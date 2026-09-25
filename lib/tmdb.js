'use strict';

const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '..', 'cache', 'tmdb-cache.json');
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';
const API_BASE = 'https://api.themoviedb.org/3';

// Ongoing shows get re-checked at most this often (a fresh scan re-validates
// stale entries); ended/canceled shows are cached forever since their data
// can't change anymore.
const STALE_MS = 24 * 60 * 60 * 1000;

// Static TMDB genre id -> name maps (movie + tv), avoids an extra API call per title.
const GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance',
  878: 'Science Fiction', 10770: 'TV Movie', 53: 'Thriller', 10752: 'War',
  37: 'Western', 10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News',
  10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk',
  10768: 'War & Politics'
};

function genreNames(ids) {
  return (ids || []).map((id) => GENRE_MAP[id]).filter(Boolean).slice(0, 3);
}

let cache = {};
try {
  cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
} catch {
  cache = {};
}

// A full scan of a large library calls saveCache() once per new title (movie,
// series, or season) - writing the whole cache file synchronously on every
// single one made a big library's first scan (or a scan after adding many new
// files) noticeably slower, blocking the event loop on every call. Debounce
// to one async write per short burst instead; still flushes eventually so a
// server restart mid-scan never loses more than that debounce window.
let saveTimer = null;
function saveCache() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), (err) => {
      if (err) console.error('Failed to write TMDB cache', err.message);
    });
  }, 250);
}

// v3: bumped for the richer shape (tagline/runtime/contentRating/trailer,
// season-blob caching, staleness tracking) - old v2 entries are ignored.
function cacheKey(type, title, year) {
  return `v3:${type}:${title.toLowerCase()}:${year || ''}`;
}

async function tmdbFetch(apiKey, endpoint, params) {
  const url = new URL(API_BASE + endpoint);
  url.searchParams.set('api_key', apiKey);
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

function isStale(entry) {
  if (!entry || !entry.fetchedAt) return true;
  if (entry.ended) return false; // finished shows/movies never change - cached forever
  return Date.now() - entry.fetchedAt > STALE_MS;
}

function trailerUrl(videos) {
  const results = (videos && videos.results) || [];
  const hit = results.find((v) => v.site === 'YouTube' && v.type === 'Trailer')
    || results.find((v) => v.site === 'YouTube' && v.type === 'Teaser');
  return hit ? `https://www.youtube.com/watch?v=${hit.key}` : null;
}

function movieCertification(releaseDates) {
  const us = (releaseDates && releaseDates.results || []).find((r) => r.iso_3166_1 === 'US');
  const withCert = us && us.release_dates.find((d) => d.certification);
  return (withCert && withCert.certification) || null;
}

function tvCertification(contentRatings) {
  const us = (contentRatings && contentRatings.results || []).find((r) => r.iso_3166_1 === 'US');
  return (us && us.rating) || null;
}

// Returns { title, year, overview, posterUrl, backdropUrl, rating, genres,
//   tagline, runtime, contentRating, trailerUrl, tmdbId } or null.
// Cached forever once found - a released movie's data doesn't change.
async function lookupMovie(apiKey, title, year) {
  const key = cacheKey('movie', title, year);
  if (cache[key] !== undefined) return cache[key];
  if (!apiKey) return null;

  let result = null;
  try {
    const data = await tmdbFetch(apiKey, '/search/movie', { query: title, year });
    const hit = data.results && data.results[0];
    if (hit) {
      const detail = await tmdbFetch(apiKey, `/movie/${hit.id}`, { append_to_response: 'videos,release_dates' });
      result = {
        title: hit.title,
        year: (hit.release_date || '').slice(0, 4) || year,
        overview: hit.overview,
        posterUrl: hit.poster_path ? IMG_BASE + hit.poster_path : null,
        backdropUrl: hit.backdrop_path ? BACKDROP_BASE + hit.backdrop_path : null,
        rating: hit.vote_average,
        genres: genreNames(hit.genre_ids),
        tagline: detail.tagline || null,
        runtime: detail.runtime || null,
        contentRating: movieCertification(detail.release_dates),
        trailerUrl: trailerUrl(detail.videos),
        tmdbId: hit.id
      };
    }
  } catch (err) {
    console.error('TMDB movie lookup failed for', title, err.message);
  }

  cache[key] = result;
  saveCache();
  return result;
}

// Returns { title, overview, posterUrl, backdropUrl, rating, genres, tagline,
//   runtime, contentRating, trailerUrl, status, ended, nextEpisodeToAir,
//   seasonNumbers, tmdbId } or null. Re-checked once a day while the show is
// still airing; cached forever once it has ended or been canceled.
async function lookupSeries(apiKey, title) {
  const key = cacheKey('tv', title, null);
  const cached = cache[key];
  if (cached !== undefined && !isStale(cached)) return cached;
  if (!apiKey) return cached !== undefined ? cached : null;

  let result = cached || null;
  try {
    const data = await tmdbFetch(apiKey, '/search/tv', { query: title });
    const hit = data.results && data.results[0];
    if (hit) {
      const detail = await tmdbFetch(apiKey, `/tv/${hit.id}`, { append_to_response: 'videos,content_ratings' });
      const ended = detail.status === 'Ended' || detail.status === 'Canceled';
      result = {
        title: hit.name,
        overview: hit.overview,
        posterUrl: hit.poster_path ? IMG_BASE + hit.poster_path : null,
        backdropUrl: hit.backdrop_path ? BACKDROP_BASE + hit.backdrop_path : null,
        rating: hit.vote_average,
        genres: genreNames(hit.genre_ids),
        tagline: detail.tagline || null,
        runtime: (detail.episode_run_time && detail.episode_run_time[0]) || null,
        contentRating: tvCertification(detail.content_ratings),
        trailerUrl: trailerUrl(detail.videos),
        status: detail.status || null,
        ended,
        nextEpisodeToAir: detail.next_episode_to_air ? {
          season: detail.next_episode_to_air.season_number,
          episode: detail.next_episode_to_air.episode_number,
          airDate: detail.next_episode_to_air.air_date,
          name: detail.next_episode_to_air.name
        } : null,
        // The real season numbers TMDB has for this show (can skip around,
        // e.g. a revival that jumps straight to season 11) - lets the scanner
        // tell "filename season TMDB doesn't recognize" apart from "filename
        // season TMDB just hasn't cached locally yet."
        seasonNumbers: (detail.seasons || []).map((s) => s.season_number),
        tmdbId: hit.id,
        fetchedAt: Date.now()
      };
    }
  } catch (err) {
    console.error('TMDB series lookup failed for', title, err.message);
    if (cached) return cached; // stale data beats no data if TMDB is briefly unreachable
  }

  cache[key] = result;
  saveCache();
  return result;
}

// Fetches every episode of one season in a single request and caches the
// whole thing, instead of one API call per episode. Re-checked once a day
// while the show is ongoing (so a "TBA" episode picks up its real title once
// it airs); cached forever once the show has ended.
// Returns { episodes: [{episode, name, overview, stillUrl, airDate, rating}], fetchedAt } or null.
async function lookupSeason(apiKey, tvId, seasonNumber, seriesEnded) {
  if (!apiKey || !tvId || seasonNumber == null) return null;
  const key = `v3:season:${tvId}:${seasonNumber}`;
  const cached = cache[key];
  if (cached !== undefined && !isStale({ ...cached, ended: seriesEnded })) return cached;

  let result = cached || null;
  try {
    const data = await tmdbFetch(apiKey, `/tv/${tvId}/season/${seasonNumber}`);
    if (data && !data.status_code) {
      result = {
        episodes: (data.episodes || []).map((ep) => ({
          episode: ep.episode_number,
          name: ep.name,
          overview: ep.overview,
          stillUrl: ep.still_path ? IMG_BASE + ep.still_path : null,
          airDate: ep.air_date || null,
          rating: ep.vote_average
        })),
        fetchedAt: Date.now()
      };
    }
  } catch (err) {
    console.error(`TMDB season lookup failed for tv/${tvId} season ${seasonNumber}`, err.message);
    if (cached) return cached;
  }

  cache[key] = result;
  saveCache();
  return result;
}

// A deliberate, one-off action (user clicked "Clear metadata cache" in
// Settings) - unlike the hot per-lookup path above, this should land on disk
// immediately rather than waiting out the debounce window.
function clearCache() {
  cache = {};
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

module.exports = { lookupMovie, lookupSeries, lookupSeason, clearCache };
