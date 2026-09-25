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

    const buildSeason = async (label, number, dirForFiles) => {
      const files = listDir(dirForFiles).filter(
        (e) => e.isFile() && isVideoFile(e.name, cfg.videoExtensions)
      );

      // A release group's embedded season number doesn't always match what
      // TMDB actually calls that season (e.g. a scene group numbering a
      // revival "S14" when TMDB only goes up to season 11 for that show) -
      // blindly trusting it sends lookupSeason() a number TMDB has never
      // heard of, so that episode gets no metadata, and separately the
      // "next episode to air" block below can't find a same-numbered local
      // season to attach to and spawns a second, phantom one.
      //
      // A number is only "trusted" as-is when there's an explicit manual
      // override (always wins) or when TMDB's real season list for this show
      // actually contains it. Anything else falls back, in order: to
      // whatever season number the *rest of this folder* agreed on (files
      // living together are almost always the same season even if one file's
      // own numbering is off) - then to the show's currently-airing season if
      // it has one - then to its latest known season - then, only if TMDB
      // gave us nothing to validate against at all, the raw filename/folder
      // number as before.
      const validSeasons = meta && Array.isArray(meta.seasonNumbers) ? meta.seasonNumbers : null;

      const parsed = files.map((f) => {
        const ep = parse.parseEpisodeFilename(f.name);
        const epOverride = overrides.episodes[f.name];
        let seasonNum = (epOverride && epOverride.season) || ep.season;
        const trusted = Boolean(epOverride && epOverride.season) || (seasonNum != null && (!validSeasons || validSeasons.includes(seasonNum)));
        return { f, ep, epOverride, seasonNum, trusted };
      });

      let consensusSeason = null;
      if (validSeasons) {
        const counts = new Map();
        for (const p of parsed) {
          if (p.trusted && p.seasonNum != null) counts.set(p.seasonNum, (counts.get(p.seasonNum) || 0) + 1);
        }
        let best = 0;
        for (const [num, count] of counts) {
          if (count > best) { consensusSeason = num; best = count; }
        }
      }
      const currentSeason = meta && meta.nextEpisodeToAir && meta.nextEpisodeToAir.season;
      const latestValidSeason = validSeasons && validSeasons.length ? Math.max(...validSeasons) : null;

      const episodes = [];
      for (const { f, ep, epOverride, seasonNum, trusted } of parsed) {
        const resolvedSeason = trusted
          ? seasonNum
          : (consensusSeason ?? (validSeasons && currentSeason != null && validSeasons.includes(currentSeason) ? currentSeason : null) ?? latestValidSeason ?? seasonNum ?? number);
        const episodeNum = (epOverride && epOverride.episode) || ep.episode;
        const seasonMeta = await getSeasonMeta(resolvedSeason);
        const epMeta = seasonMeta && seasonMeta.episodes.find((e) => e.episode === episodeNum);
        episodes.push({
          id: f.name,
          filePath: path.join(dirForFiles, f.name),
          season: resolvedSeason,
          episode: episodeNum,
          title: (epMeta && epMeta.name) || ep.title,
          overview: epMeta && epMeta.overview,
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

      return { label: effectiveLabel, number: effectiveNumber, episodes };
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
    if (meta && !meta.ended && meta.nextEpisodeToAir) {
      const next = meta.nextEpisodeToAir;
      const alreadyHave = seasons.some((s) => s.episodes.some((e) => e.season === next.season && e.episode === next.episode));
      if (!alreadyHave) {
        let targetSeason = seasons.find((s) => s.number === next.season);
        if (!targetSeason) {
          targetSeason = { label: `Season ${next.season}`, number: next.season, episodes: [] };
          seasons.push(targetSeason);
        }
        targetSeason.episodes.push({
          id: null,
          filePath: null,
          season: next.season,
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
// whose "S14E03" doesn't match any season TMDB actually lists for the show).
app.post('/api/override-episode', (req, res) => {
  const { id, season, episode } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id required' });

  const overrides = loadOverrides();
  const entry = {};
  if (season) entry.season = parseInt(season, 10) || null;
  if (episode) entry.episode = parseInt(episode, 10) || null;

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

  const child = spawn('vlc', args, { detached: true, stdio: 'ignore' });
  child.unref();

  try {
    trackPlayback(resolved, port, token, child);
  } catch (err) {
    console.error('Watch-progress tracking failed to start (playback continues normally):', err.message);
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
