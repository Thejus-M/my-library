# My Library

Local Netflix-style gallery for your Movies and Series folders. Reads filenames, pulls posters from TMDB, plays everything in VLC.

## Run

```
npm install
npm start
```

Open http://localhost:4300

## Config

Defaults already set in `config.json`:
- `moviesPath` = `/run/media/pc/MY Drive/Movies`
- `seriesPath` = `/run/media/pc/MY Drive/Series`

Change these only via ⚙ settings button in UI (no file edit needed):
- Movies folder — folder with movie files directly inside it
- Series folder — folder with one subfolder per series; inside each, either season subfolders (e.g. `Season 01`) or episode files directly
- TMDB API key — free key from https://www.themoviedb.org/settings/api (sign up → Settings → API → request key, "Developer" use). Without it, posters show as text tiles, everything else still works.

## Filename parsing

- Movies: `Title.Year.tags-GROUP.mkv` → title + year (release tags like `1080p`, `WEB-DL`, `x265` are stripped).
- Episodes: looks for `S01E02`, `1x02`, `Season 1 Episode 2`, or a bare episode number. Falls back to season 1 if no season folder exists.

## Notes

- `/api/play` only launches files inside the configured `moviesPath`/`seriesPath` — refuses anything else.
- TMDB lookups are cached in `cache/tmdb-cache.json` so re-scans don't re-hit the API.
