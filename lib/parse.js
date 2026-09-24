'use strict';

// Release-tag tokens that mark "metadata starts here" in a scene-style filename.
// Everything before the first year, or first one of these tokens, is treated as title.
const RELEASE_TOKENS = [
  '1080p', '2160p', '720p', '480p', '4k', 'uhd',
  'web-dl', 'webdl', 'webrip', 'web', 'bluray', 'blu-ray', 'bdrip', 'brrip',
  'hdrip', 'dvdrip', 'hdtv', 'pdtv', 'dvdscr', 'cam', 'hdcam', 'ts', 'r5',
  'x264', 'x265', 'h264', 'h265', 'hevc', 'avc',
  'aac', 'ac3', 'dts', 'dd5', 'dd\\+5', 'ddp5', 'atmos', 'truehd',
  'nf', 'amzn', 'dsnp', 'atvp', 'hulu', 'hmax',
  'remux', 'proper', 'repack', 'extended', 'unrated', 'multi'
];

const RELEASE_TOKEN_RE = new RegExp('\\b(' + RELEASE_TOKENS.join('|') + ')\\b', 'i');
const YEAR_RE = /\b(19[0-9]{2}|20[0-9]{2})\b/;

function stripExt(filename) {
  return filename.replace(/\.[a-z0-9]{2,4}$/i, '');
}

// `\b` doesn't fire between "_" and a digit/letter (underscore counts as a word
// char), so "One_Night_Only_2026" never matched the year boundary. Normalize
// dot/underscore separators to spaces before running any `\b`-based match.
function normalizeSeparators(str) {
  return str.replace(/[._]+/g, ' ');
}

function cleanTitle(raw) {
  return raw
    .replace(/[._]+/g, ' ')
    .replace(/[[({].*?[\])}]/g, ' ') // drop bracketed/parenthesized junk
    .replace(/[-–—]+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Parse a movie filename into { title, year }.
function parseMovieFilename(filename) {
  const norm = normalizeSeparators(stripExt(filename));
  const yearMatch = norm.match(YEAR_RE);
  const tokenMatch = norm.match(RELEASE_TOKEN_RE);

  let cutIndex = norm.length;
  if (yearMatch) cutIndex = Math.min(cutIndex, yearMatch.index);
  if (tokenMatch) cutIndex = Math.min(cutIndex, tokenMatch.index);

  let titlePart = cleanTitle(norm.slice(0, cutIndex));

  return {
    title: titlePart || cleanTitle(norm),
    year: yearMatch ? parseInt(yearMatch[1], 10) : null
  };
}

// Episode patterns, in priority order.
const EP_PATTERNS = [
  // S01E02, s1e2, S01.E02, S01 E02
  /s(\d{1,2})[.\s_-]?e(\d{1,3})/i,
  // 1x02
  /\b(\d{1,2})x(\d{1,3})\b/i,
  // Season 1 Episode 2
  /season\s*(\d{1,2})\D{0,5}episode\s*(\d{1,3})/i,
  // "- 02 -" or "E02" alone (season unknown, defaults to 1)
];

const EP_ONLY_PATTERNS = [
  /\bep?\.?\s?(\d{1,3})\b/i,
  /[-_\s](\d{1,3})[-_\s.]/,
];

// Whatever comes after the SxxEyy/1x02 marker is the episode title, if the
// release actually has one. Strip release tags from it; if nothing useful is
// left (just quality/codec junk, or nothing), the caller falls back to "Episode N".
function extractEpisodeTitle(remainder) {
  const norm = normalizeSeparators(remainder);
  const tokenMatch = norm.match(RELEASE_TOKEN_RE);
  const cutIndex = tokenMatch ? tokenMatch.index : norm.length;
  const title = cleanTitle(norm.slice(0, cutIndex));
  return title.length >= 2 ? title : null;
}

// Parse an episode filename into { season, episode, title }.
function parseEpisodeFilename(filename) {
  const base = stripExt(filename);
  const cleaned = cleanTitle(base);

  for (const re of EP_PATTERNS) {
    const m = base.match(re);
    if (m) {
      const season = parseInt(m[1], 10);
      const episode = parseInt(m[2], 10);
      const remainder = base.slice(m.index + m[0].length);
      const title = extractEpisodeTitle(remainder) || `Episode ${String(episode).padStart(2, '0')}`;
      return { season, episode, title };
    }
  }

  for (const re of EP_ONLY_PATTERNS) {
    const m = base.match(re);
    if (m) {
      const episode = parseInt(m[1], 10);
      const remainder = base.slice(m.index + m[0].length);
      const title = extractEpisodeTitle(remainder) || `Episode ${String(episode).padStart(2, '0')}`;
      return { season: 1, episode, title };
    }
  }

  return { season: null, episode: null, title: cleaned };
}

// Parse a season folder name into a sortable label + number, e.g. "Season 01" -> 1.
function parseSeasonFolder(name) {
  const m = name.match(/(\d{1,2})/);
  return {
    number: m ? parseInt(m[1], 10) : null,
    label: cleanTitle(name) || name
  };
}

module.exports = {
  parseMovieFilename,
  parseEpisodeFilename,
  parseSeasonFolder,
  cleanTitle
};
