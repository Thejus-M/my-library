'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const { spawn } = require('child_process');

const parse = require('./lib/parse');
const tmdb = require('./lib/tmdb');

const CONFIG_FILE = path.join(__dirname, 'config.json');
const OVERRIDES_FILE = path.join(__dirname, 'overrides.json');
const PROGRESS_FILE = path.join(__dirname, 'watch-progress.json');
const TRASH_FILE = path.join(__dirname, 'trash.json');
const TRASH_DIR = path.join(__dirname, '.trash');
const PORT = process.env.PORT || 4300;

function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}
function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

// Manual fixes for titles TMDB matched wrong, or couldn't find at all.
// Keyed by filename (movies) / folder name (series) so they survive rescans.
// episodes: keyed by episode filename, overrides which season/episode number
// we ask TMDB for - fixes files whose own season/episode number in the name
// doesn't match what TMDB actually lists for the matched show.
function loadOverrides() {
  try {
    const o = JSON.parse(fs.readFileSync(OVERRIDES_FILE, 'utf8'));
    if (!o.episodes) o.episodes = {};
    return o;
  } catch {
    return { movies: {}, series: {}, episodes: {} };
  }
}
function saveOverrides(overrides) {
  fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(overrides, null, 2));
}

// Watch progress, keyed by absolute file path. { percent, position, duration, watched, updatedAt }
function loadProgress() {
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  } catch {
    return {};
  }
}
function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// Trash manifest, keyed by a generated id. { type, originalPath, trashPath, title, subtitle, posterUrl, trashedAt }
function loadTrash() {
  try {
    return JSON.parse(fs.readFileSync(TRASH_FILE, 'utf8'));
  } catch {
    return {};
  }
}
function saveTrash(trash) {
  fs.writeFileSync(TRASH_FILE, JSON.stringify(trash, null, 2));
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function isVideoFile(name, exts) {
  return exts.includes(path.extname(name).toLowerCase());
}

function listDir(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (err) {
    console.error('Cannot read dir', dirPath, err.message);
    return [];
  }
}

// A file is only ever played/trashed from inside the configured library roots.
function isInsideLibrary(cfg, resolved) {
  const roots = [path.resolve(cfg.moviesPath), path.resolve(cfg.seriesPath)];
  return roots.some((root) => resolved === root || resolved.startsWith(root + path.sep));
}

// --- Library scan ---

async function scanMovies(cfg, overrides) {
  const entries = listDir(cfg.moviesPath).filter(
    (e) => e.isFile() && isVideoFile(e.name, cfg.videoExtensions)
  );

  const movies = [];
  for (const entry of entries) {
    const parsed = parse.parseMovieFilename(entry.name);
    const override = overrides.movies[entry.name] || {};
    const searchTitle = override.title || parsed.title;
    const searchYear = override.year || parsed.year;
    const meta = await tmdb.lookupMovie(cfg.tmdbApiKey, searchTitle, searchYear);
    movies.push({
      id: entry.name,
      filePath: path.join(cfg.moviesPath, entry.name),
      title: override.title || (meta && meta.title) || parsed.title,
      year: override.year || (meta && meta.year) || parsed.year,
      overview: override.overview || (meta && meta.overview) || null,
      posterUrl: override.posterUrl || (meta && meta.posterUrl) || null,
      backdropUrl: (meta && meta.backdropUrl) || null,
      rating: meta && meta.rating,
      genres: (meta && meta.genres) || [],
      tagline: (meta && meta.tagline) || null,
      runtime: (meta && meta.runtime) || null,
      contentRating: (meta && meta.contentRating) || null,
      trailerUrl: (meta && meta.trailerUrl) || null,
      hasOverride: Boolean(overrides.movies[entry.name])
    });
  }
  movies.sort((a, b) => a.title.localeCompare(b.title));
  return movies;
}

async function scanSeries(cfg, overrides) {
  const seriesDirs = listDir(cfg.seriesPath).filter((e) => e.isDirectory());

  const series = [];
  for (const seriesDir of seriesDirs) {
    const override = overrides.series[seriesDir.name] || {};
    const seriesTitle = override.title || parse.cleanTitle(seriesDir.name);
    const seriesPath = path.join(cfg.seriesPath, seriesDir.name);
    const meta = await tmdb.lookupSeries(cfg.tmdbApiKey, seriesTitle);

    const seasonEntries = listDir(seriesPath).filter((e) => e.isDirectory());
    const seasons = [];

    // Support series with no season subfolders: treat episodes directly under the series folder as Season 1.
    const looseFiles = listDir(seriesPath).filter(
      (e) => e.isFile() && isVideoFile(e.name, cfg.videoExtensions)
    );

    // One request per season fetches every episode's data at once (cached to
    // disk), instead of one request per episode file - this is what makes
    // "fetch it all, only re-hit TMDB for genuinely new files" possible.
    const seasonMetaCache = new Map();
    async function getSeasonMeta(seasonNum) {
      if (!meta || !meta.tmdbId || seasonNum == null) return null;
      if (!seasonMetaCache.has(seasonNum)) {
        seasonMetaCache.set(seasonNum, await tmdb.lookupSeason(cfg.tmdbApiKey, meta.tmdbId, seasonNum, meta.ended));
      }
      return seasonMetaCache.get(seasonNum);
    }

    // A revival can be numbered "S14" by the release group (continuing the
    // original show's total season count) while TMDB numbers the very same
    // content "season 11" (continuing only the revival's own count) - same
    // episodes, same episode numbers, just a different season number. When
    // the local season number isn't one TMDB actually has, fall back to
    // matching episodes into whichever season TMDB has currently airing (or,
    // failing that, its latest) BY EPISODE NUMBER, so real titles/overviews/
    // stills/ratings are still found. The local number stays the displayed
    // label/grouping either way - filenames are ground truth for
    // organization (PRODUCT.md); TMDB is only ever the data source.
    const validSeasons = meta && Array.isArray(meta.seasonNumbers) ? meta.seasonNumbers : null;
    const airingSeason = meta && meta.nextEpisodeToAir && meta.nextEpisodeToAir.season;
    const fallbackSeasonNum = validSeasons && validSeasons.includes(airingSeason)
      ? airingSeason
      : (validSeasons && validSeasons.length ? Math.max(...validSeasons) : null);
    // Which TMDB season a given *local* season number actually pulls episode
    // data from - itself if TMDB has it, else the fallback above.
    function dataSourceFor(localSeasonNum) {
      if (!validSeasons) return localSeasonNum;
      return validSeasons.includes(localSeasonNum) ? localSeasonNum : fallbackSeasonNum;
    }

    const buildSeason = async (label, number, dirForFiles) => {
      const files = listDir(dirForFiles).filter(
        (e) => e.isFile() && isVideoFile(e.name, cfg.videoExtensions)
      );

      const episodes = [];
      for (const f of files) {
        const ep = parse.parseEpisodeFilename(f.name);
        const epOverride = overrides.episodes[f.name];
        const seasonNum = (epOverride && epOverride.season) || ep.season || number;
        const episodeNum = (epOverride && epOverride.episode) || ep.episode;
        const seasonMeta = await getSeasonMeta(dataSourceFor(seasonNum));
        const epMeta = seasonMeta && seasonMeta.episodes.find((e) => e.episode === episodeNum);
        episodes.push({
          id: f.name,
          filePath: path.join(dirForFiles, f.name),
          season: seasonNum,
          episode: episodeNum,
          title: (epOverride && epOverride.title) || (epMeta && epMeta.name) || ep.title,
          overview: (epOverride && epOverride.overview) || (epMeta && epMeta.overview),
          stillUrl: epMeta && epMeta.stillUrl,
          airDate: epMeta && epMeta.airDate,
          rating: epMeta && epMeta.rating,
          hasOverride: Boolean(epOverride)
        });
      }
      episodes.sort((a, b) => (a.episode || 0) - (b.episode || 0));

      // If every episode here resolved to the same (possibly overridden) season
      // number, label the group by that real number - e.g. a folder literally
      // named "S1" holding episodes overridden to season 11 should say
      // "Season 11", not "S1", once the override makes that the true season.
      const seasonNumbers = new Set(episodes.map((e) => e.season).filter((n) => n != null));
      const effectiveNumber = seasonNumbers.size === 1 ? [...seasonNumbers][0] : number;
      const effectiveLabel = seasonNumbers.size === 1 ? `Season ${effectiveNumber}` : label;

      // Season's own poster (falls back to the series poster client-side when
      // TMDB has none for this specific season, e.g. a season 1 before TMDB
      // started tracking per-season art).
      const posterSeasonMeta = await getSeasonMeta(dataSourceFor(effectiveNumber));
      const posterUrl = (posterSeasonMeta && posterSeasonMeta.posterUrl) || null;

      return { label: effectiveLabel, number: effectiveNumber, posterUrl, episodes };
    };

    for (const seasonDir of seasonEntries) {
      const seasonInfo = parse.parseSeasonFolder(seasonDir.name);
      seasons.push(
        await buildSeason(
          seasonInfo.label,
          seasonInfo.number,
          path.join(seriesPath, seasonDir.name)
        )
      );
    }
    if (looseFiles.length) {
      seasons.push(await buildSeason('Season 1', 1, seriesPath));
    }

    // The next episode TMDB says is coming, shown even before you've downloaded
    // it - only for shows still airing, and only if you don't already have it.
    // Attaches to whichever local season is actually sourcing its episode data
    // from the TMDB season the upcoming episode belongs to (matched the same
    // way buildSeason() matches downloaded episodes - by episode number, via
    // dataSourceFor()) - not by a literal season-number match, since the
    // local season number and TMDB's for the same content can legitimately
    // differ (see dataSourceFor above). If no local season maps to it at all,
    // skip rather than inventing a mismatched new block.
    if (meta && !meta.ended && meta.nextEpisodeToAir) {
      const next = meta.nextEpisodeToAir;
      const targetSeason = seasons.find((s) => dataSourceFor(s.number) === next.season);
      const alreadyHave = targetSeason && targetSeason.episodes.some((e) => e.episode === next.episode);
      if (targetSeason && !alreadyHave) {
        targetSeason.episodes.push({
          id: null,
          filePath: null,
          season: targetSeason.number,
          episode: next.episode,
          title: next.name || `Episode ${next.episode}`,
          overview: null,
          stillUrl: null,
          airDate: next.airDate,
          rating: null,
          hasOverride: false,
          upcoming: true
        });
        targetSeason.episodes.sort((a, b) => (a.episode || 0) - (b.episode || 0));
      }
    }

    seasons.sort((a, b) => (a.number || 0) - (b.number || 0));

    series.push({
      id: seriesDir.name,
      title: seriesTitle,
      overview: override.overview || (meta && meta.overview) || null,
      posterUrl: override.posterUrl || (meta && meta.posterUrl) || null,
      backdropUrl: (meta && meta.backdropUrl) || null,
      rating: meta && meta.rating,
      genres: (meta && meta.genres) || [],
      tagline: (meta && meta.tagline) || null,
      runtime: (meta && meta.runtime) || null,
      contentRating: (meta && meta.contentRating) || null,
      trailerUrl: (meta && meta.trailerUrl) || null,
      status: (meta && meta.status) || null,
      hasOverride: Boolean(overrides.series[seriesDir.name]),
      seasons
    });
  }
  series.sort((a, b) => a.title.localeCompare(b.title));
  return series;
}

// --- Routes ---

app.get('/api/library', async (req, res) => {
  const cfg = loadConfig();
  const overrides = loadOverrides();
  try {
    const [movies, series] = await Promise.all([
      scanMovies(cfg, overrides),
      scanSeries(cfg, overrides)
    ]);
    // A missing folder (typo'd path, unmounted drive) scans to an empty list
    // the same way a genuinely empty folder does - the client can't tell them
    // apart without this, and "no movies found" is a much worse message than
    // "this folder doesn't exist" when it's actually a config problem.
    res.json({
      movies, series,
      tmdbConfigured: Boolean(cfg.tmdbApiKey),
      moviesPath: cfg.moviesPath,
      seriesPath: cfg.seriesPath,
      moviesPathExists: fs.existsSync(cfg.moviesPath),
      seriesPathExists: fs.existsSync(cfg.seriesPath)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch a saved manual override (to prefill the edit form), if any.
app.get('/api/override', (req, res) => {
  const { type, id } = req.query;
  if (type !== 'movie' && type !== 'series' && type !== 'episode') {
    return res.status(400).json({ error: 'invalid type' });
  }
  const overrides = loadOverrides();
  const bucket = type === 'movie' ? overrides.movies : type === 'series' ? overrides.series : overrides.episodes;
  res.json(bucket[id] || {});
});

// Save a manual fix for a movie/series whose match TMDB got wrong or missed entirely.
// title/year re-drive the TMDB search; posterUrl/overview are a manual fallback
// used only if TMDB still finds nothing.
app.post('/api/override', (req, res) => {
  const { type, id, title, year, posterUrl, overview } = req.body || {};
  if (type !== 'movie' && type !== 'series') return res.status(400).json({ error: 'invalid type' });
  if (!id) return res.status(400).json({ error: 'id required' });

  const overrides = loadOverrides();
  const bucket = type === 'movie' ? overrides.movies : overrides.series;

  const entry = {};
  if (typeof title === 'string' && title.trim()) entry.title = title.trim();
  if (type === 'movie' && year) entry.year = parseInt(year, 10) || null;
  if (typeof posterUrl === 'string' && posterUrl.trim()) entry.posterUrl = posterUrl.trim();
  if (typeof overview === 'string' && overview.trim()) entry.overview = overview.trim();

  if (Object.keys(entry).length === 0) {
    delete bucket[id];
  } else {
    bucket[id] = entry;
  }
  saveOverrides(overrides);
  res.json({ ok: true });
});

// Correct a single episode's season/episode number (e.g. a mislabeled rip
// whose "S14E03" doesn't match any season TMDB actually lists for the show),
// and/or a manual title/overview fallback for when TMDB genuinely has no
// data at all for that season - same "always one click from being fixed,
// never a dead end" escape hatch movies already have.
app.post('/api/override-episode', (req, res) => {
  const { id, season, episode, title, overview } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id required' });

  const overrides = loadOverrides();
  const entry = {};
  if (season) entry.season = parseInt(season, 10) || null;
  if (episode) entry.episode = parseInt(episode, 10) || null;
  if (typeof title === 'string' && title.trim()) entry.title = title.trim();
  if (typeof overview === 'string' && overview.trim()) entry.overview = overview.trim();

  if (Object.keys(entry).length === 0) {
    delete overrides.episodes[id];
  } else {
    overrides.episodes[id] = entry;
  }
  saveOverrides(overrides);
  res.json({ ok: true });
});

app.get('/api/config', (req, res) => {
  const cfg = loadConfig();
  res.json({
    moviesPath: cfg.moviesPath,
    seriesPath: cfg.seriesPath,
    tmdbConfigured: Boolean(cfg.tmdbApiKey)
  });
});

app.post('/api/config', (req, res) => {
  const cfg = loadConfig();
  const { tmdbApiKey, moviesPath, seriesPath } = req.body || {};
  if (typeof tmdbApiKey === 'string') cfg.tmdbApiKey = tmdbApiKey.trim();
  if (typeof moviesPath === 'string' && moviesPath.trim()) cfg.moviesPath = moviesPath.trim();
  if (typeof seriesPath === 'string' && seriesPath.trim()) cfg.seriesPath = seriesPath.trim();
  saveConfig(cfg);
  res.json({ ok: true });
});

app.post('/api/clear-metadata-cache', (req, res) => {
  tmdb.clearCache();
  res.json({ ok: true });
});

// Force-refresh just one series' TMDB data (its own entry + all cached
// season entries) - for "I fixed a match/override, re-check this one show"
// without the full-library cost of Clear Metadata Cache. seriesId is the
// series' folder name, same as the `id` field /api/library returns per
// series. The actual re-fetch happens on the client's next /api/library
// call; this just invalidates what's cached so that call hits TMDB fresh
// for this show only.
app.post('/api/rescan-series', (req, res) => {
  const { seriesId } = req.body || {};
  if (!seriesId) return res.status(400).json({ error: 'seriesId required' });

  const cfg = loadConfig();
  const seriesDirPath = path.join(cfg.seriesPath, seriesId);
  if (!fs.existsSync(seriesDirPath)) {
    return res.status(404).json({ error: 'Series folder not found' });
  }

  const overrides = loadOverrides();
  const override = overrides.series[seriesId] || {};
  const seriesTitle = override.title || parse.cleanTitle(seriesId);
  tmdb.invalidateSeries(seriesTitle);
  res.json({ ok: true });
});

// --- Playback + watch progress ---
//
// VLC doesn't report anything back to a plain spawned process, so we launch it
// with its own HTTP control interface on a per-launch random port/password and
// poll that while it runs. This is purely additive: if the http interface
// never comes up for any reason, playback itself still works, we just never
// learn how far the user got.

const activeSessions = new Map(); // filePath -> { pollTimer }

function vlcAuthHeader(token) {
  return 'Basic ' + Buffer.from(':' + token).toString('base64');
}

async function pollVlcStatus(port, token) {
  const res = await fetch(`http://127.0.0.1:${port}/requests/status.json`, {
    headers: { Authorization: vlcAuthHeader(token) },
    signal: AbortSignal.timeout(2000)
  });
  if (!res.ok) throw new Error(`vlc http ${res.status}`);
  return res.json();
}

async function pollVlcPlaylist(port, token) {
  const res = await fetch(`http://127.0.0.1:${port}/requests/playlist.json`, {
    headers: { Authorization: vlcAuthHeader(token) },
    signal: AbortSignal.timeout(2000)
  });
  if (!res.ok) throw new Error(`vlc http ${res.status}`);
  return res.json();
}

// VLC's playlist.json is a tree (root -> a "Playlist" folder node -> the
// actual queued items); walk it for every leaf (a node with a `uri`, no
// `children`) regardless of nesting depth.
function flattenPlaylistItems(node, out) {
  out = out || [];
  if (node.children) {
    for (const child of node.children) flattenPlaylistItems(child, out);
  } else if (node.uri) {
    out.push(node);
  }
  return out;
}

function uriToPath(uri) {
  try { return decodeURIComponent(new URL(uri).pathname); } catch { return null; }
}

function finalizeProgress(filePath, time, length) {
  const progress = loadProgress();
  if (length > 0) {
    const percent = Math.min(100, Math.round((time / length) * 100));
    progress[filePath] = {
      percent,
      position: time,
      duration: length,
      watched: percent >= 90,
      updatedAt: new Date().toISOString()
    };
    saveProgress(progress);
  }
}

function trackPlayback(filePath, port, token, child) {
  let lastTime = 0;
  let lastLength = 0;

  const pollTimer = setInterval(async () => {
    try {
      const status = await pollVlcStatus(port, token);
      lastTime = status.time || 0;
      lastLength = status.length || 0;
      finalizeProgress(filePath, lastTime, lastLength);
    } catch {
      // VLC's http interface may not be up yet, or the window was closed
      // mid-poll - either way, just try again next tick.
    }
  }, 3000);

  activeSessions.set(filePath, { pollTimer });

  child.on('exit', async () => {
    try {
      const status = await pollVlcStatus(port, token);
      lastTime = status.time || 0;
      lastLength = status.length || 0;
    } catch {
      // VLC's http server is already gone by the time it exits - use the
      // last value we polled while it was still running.
    }
    clearInterval(pollTimer);
    activeSessions.delete(filePath);
    finalizeProgress(filePath, lastTime, lastLength);
  });
}

// Same idea as trackPlayback, but for a whole queued playlist: VLC reports
// one shared time/length for whichever item is currently playing, so each
// tick we also ask which playlist item that is (status.currentplid, matched
// against playlist.json's flattened items by uri) and attribute the
// progress to THAT file - letting progress naturally roll from episode to
// episode as VLC advances through the queue instead of all piling onto the
// first file.
function trackPlaylistPlayback(filePaths, port, token, child) {
  const known = new Set(filePaths);
  let currentPath = filePaths[0];
  let lastTime = 0;
  let lastLength = 0;

  async function currentItemPath() {
    const [status, playlist] = await Promise.all([pollVlcStatus(port, token), pollVlcPlaylist(port, token)]);
    const items = flattenPlaylistItems(playlist);
    const active = items.find((it) => Number(it.id) === Number(status.currentplid));
    const activePath = active ? uriToPath(active.uri) : null;
    return { status, path: activePath && known.has(activePath) ? activePath : null };
  }

  const pollTimer = setInterval(async () => {
    try {
      const { status, path: activePath } = await currentItemPath();
      if (activePath) currentPath = activePath;
      lastTime = status.time || 0;
      lastLength = status.length || 0;
      finalizeProgress(currentPath, lastTime, lastLength);
    } catch {
      // VLC's http interface may not be up yet, or the window was closed
      // mid-poll - either way, just try again next tick.
    }
  }, 3000);

  activeSessions.set(filePaths[0], { pollTimer, filePaths });

  child.on('exit', async () => {
    try {
      const { status, path: activePath } = await currentItemPath();
      if (activePath) currentPath = activePath;
      lastTime = status.time || 0;
      lastLength = status.length || 0;
    } catch {
      // VLC's http server is already gone by the time it exits - use the
      // last value we polled while it was still running.
    }
    clearInterval(pollTimer);
    activeSessions.delete(filePaths[0]);
    finalizeProgress(currentPath, lastTime, lastLength);
  });
}

app.get('/api/progress', (req, res) => {
  res.json(loadProgress());
});

// Manual correction on top of the automatic tracking, e.g. "actually mark this
// watched" or "I'm rewatching this, stop calling it done". Unmarking resets
// percent/position to 0 rather than leaving a stale 100% behind - "unwatched"
// should mean "starts over," not "resume at the last second."
app.post('/api/progress/toggle-watched', (req, res) => {
  const { filePath, watched } = req.body || {};
  if (!filePath) return res.status(400).json({ error: 'filePath required' });
  const isWatched = Boolean(watched);
  const progress = loadProgress();
  const existing = progress[filePath] || { percent: 0, position: 0, duration: 0 };
  progress[filePath] = {
    ...existing,
    watched: isWatched,
    percent: isWatched ? 100 : 0,
    position: isWatched ? existing.position : 0,
    updatedAt: new Date().toISOString()
  };
  saveProgress(progress);
  res.json({ ok: true });
});

// Personal 1-5 star rating, e.g. "I watched this, here's what I thought" -
// distinct from TMDB's own crowd rating. Stored on the same per-file progress
// record as watched/percent so there's one JSON store for "what am I
// watching and what did I think of it," not a second database. rating: null
// clears an existing rating.
app.post('/api/rate', (req, res) => {
  const { filePath, rating } = req.body || {};
  if (!filePath) return res.status(400).json({ error: 'filePath required' });

  let value = null;
  if (rating !== null && rating !== undefined && rating !== '') {
    value = parseInt(rating, 10);
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return res.status(400).json({ error: 'rating must be an integer 1-5, or null to clear' });
    }
  }

  const progress = loadProgress();
  const existing = progress[filePath] || { percent: 0, position: 0, duration: 0, watched: false };
  progress[filePath] = {
    ...existing,
    rating: value,
    updatedAt: new Date().toISOString()
  };
  saveProgress(progress);
  res.json({ ok: true, rating: value });
});

// Play a file in VLC. Only allow files inside the configured library roots.
app.post('/api/play', (req, res) => {
  const cfg = loadConfig();
  const { filePath, startTime } = req.body || {};
  if (!filePath) return res.status(400).json({ error: 'filePath required' });

  const resolved = path.resolve(filePath);
  if (!isInsideLibrary(cfg, resolved)) {
    return res.status(403).json({ error: 'File is outside configured library folders' });
  }
  if (!fs.existsSync(resolved)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const port = 9880 + Math.floor(Math.random() * 100);
  const token = crypto.randomBytes(8).toString('hex');
  const args = [];
  if (startTime && Number(startTime) > 0) args.push(`--start-time=${Math.floor(Number(startTime))}`);
  args.push('--extraintf', 'http', '--http-host', '127.0.0.1', '--http-port', String(port), '--http-password', token, resolved);
  // Explicit rather than relying on VLC's own same-name-sidecar autodetect -
  // see the matching comment in /api/play-playlist.
  const sidecarSrt = resolved.replace(/\.[^.]+$/, '.srt');
  if (fs.existsSync(sidecarSrt)) args.push(`:sub-file=${sidecarSrt}`);

  const child = spawn('vlc', args, { detached: true, stdio: 'ignore' });
  child.unref();

  try {
    trackPlayback(resolved, port, token, child);
  } catch (err) {
    console.error('Watch-progress tracking failed to start (playback continues normally):', err.message);
  }

  res.json({ ok: true });
});

// Play a whole list of files (e.g. a season's episodes) as one VLC playlist,
// in the given order, so Next/Previous moves between them without
// re-opening the app per episode. Same library-root check as /api/play,
// applied to every file.
app.post('/api/play-playlist', (req, res) => {
  const cfg = loadConfig();
  const { filePaths, startTime } = req.body || {};
  if (!Array.isArray(filePaths) || filePaths.length === 0) {
    return res.status(400).json({ error: 'filePaths required' });
  }

  const resolved = [];
  for (const filePath of filePaths) {
    const r = path.resolve(filePath);
    if (!isInsideLibrary(cfg, r)) {
      return res.status(403).json({ error: 'File is outside configured library folders' });
    }
    if (!fs.existsSync(r)) {
      return res.status(404).json({ error: `File not found: ${filePath}` });
    }
    resolved.push(r);
  }

  const port = 9880 + Math.floor(Math.random() * 100);
  const token = crypto.randomBytes(8).toString('hex');
  const args = ['--extraintf', 'http', '--http-host', '127.0.0.1', '--http-port', String(port), '--http-password', token];
  // A ":option=value" argument immediately after an MRL applies only to that
  // one playlist item in VLC, not the whole invocation - lets the playlist
  // start already resumed at its first item without affecting the rest.
  resolved.forEach((r, i) => {
    args.push(r);
    if (i === 0 && startTime && Number(startTime) > 0) args.push(`:start-time=${Math.floor(Number(startTime))}`);
    // VLC only auto-detects a same-name sidecar .srt for the FIRST item it
    // opens - advancing to a later playlist item internally skips that
    // detection pass, silently dropping the subtitle. Attaching it
    // explicitly per item survives that transition.
    const sidecarSrt = r.replace(/\.[^.]+$/, '.srt');
    if (fs.existsSync(sidecarSrt)) args.push(`:sub-file=${sidecarSrt}`);
  });

  const child = spawn('vlc', args, { detached: true, stdio: 'ignore' });
  child.unref();

  try {
    trackPlaylistPlayback(resolved, port, token, child);
  } catch (err) {
    console.error('Watch-progress tracking failed to start for playlist (playback continues normally):', err.message);
  }

  res.json({ ok: true });
});

// --- Trash ---

function findTrashEntry(trash, id) {
  return trash[id];
}

app.get('/api/trash', (req, res) => {
  const trash = loadTrash();
  const items = Object.entries(trash)
    .map(([id, entry]) => ({ id, ...entry }))
    .sort((a, b) => new Date(b.trashedAt) - new Date(a.trashedAt));
  res.json(items);
});

// Move a file into .trash/ and record it in the manifest with a display snapshot,
// so the trash view can show a poster/title without needing the scanner to still see it.
app.post('/api/trash', (req, res) => {
  const cfg = loadConfig();
  const { type, filePath, title, subtitle, posterUrl } = req.body || {};
  if (type !== 'movie' && type !== 'episode') return res.status(400).json({ error: 'invalid type' });
  if (!filePath) return res.status(400).json({ error: 'filePath required' });

  const resolved = path.resolve(filePath);
  if (!isInsideLibrary(cfg, resolved)) {
    return res.status(403).json({ error: 'File is outside configured library folders' });
  }
  if (!fs.existsSync(resolved)) {
    return res.status(404).json({ error: 'File not found' });
  }

  fs.mkdirSync(TRASH_DIR, { recursive: true });
  const id = crypto.randomUUID();
  const trashPath = path.join(TRASH_DIR, `${id}-${path.basename(resolved)}`);

  try {
    fs.renameSync(resolved, trashPath);
  } catch (err) {
    if (err.code === 'EXDEV') {
      fs.copyFileSync(resolved, trashPath);
      fs.unlinkSync(resolved);
    } else {
      throw err;
    }
  }

  const trash = loadTrash();
  trash[id] = {
    type,
    originalPath: resolved,
    trashPath,
    title: title || path.basename(resolved),
    subtitle: subtitle || null,
    posterUrl: posterUrl || null,
    trashedAt: new Date().toISOString()
  };
  saveTrash(trash);
  res.json({ ok: true, id });
});

app.post('/api/trash/restore', (req, res) => {
  const { id } = req.body || {};
  const trash = loadTrash();
  const entry = findTrashEntry(trash, id);
  if (!entry) return res.status(404).json({ error: 'Not in trash' });

  fs.mkdirSync(path.dirname(entry.originalPath), { recursive: true });
  try {
    fs.renameSync(entry.trashPath, entry.originalPath);
  } catch (err) {
    if (err.code === 'EXDEV') {
      fs.copyFileSync(entry.trashPath, entry.originalPath);
      fs.unlinkSync(entry.trashPath);
    } else {
      throw err;
    }
  }

  delete trash[id];
  saveTrash(trash);
  res.json({ ok: true });
});

app.post('/api/trash/delete', (req, res) => {
  const { id } = req.body || {};
  const trash = loadTrash();
  const entry = findTrashEntry(trash, id);
  if (!entry) return res.status(404).json({ error: 'Not in trash' });

  fs.rmSync(entry.trashPath, { force: true });
  delete trash[id];
  saveTrash(trash);
  res.json({ ok: true });
});

app.post('/api/trash/empty', (req, res) => {
  const trash = loadTrash();
  for (const entry of Object.values(trash)) {
    fs.rmSync(entry.trashPath, { force: true });
  }
  saveTrash({});
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Kodi replacement running at http://localhost:${PORT}`);
});
