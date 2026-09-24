# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A single personal user, browsing their own local media library from a normal desktop browser on the same Linux machine that stores the files. No accounts, no profiles, no other household members using it (confirmed).

## Product Purpose

A local "Kodi replacement": a thin, zero-setup visual layer over two folders of already-organized personal media (Movies, Series). It scans the folders, parses filenames for title/year/season/episode, enriches with TMDB metadata (poster, backdrop, overview, rating, genres, per-episode stills/overview/air date), and presents a Netflix/Apple-TV-style gallery. Choosing something to watch launches it in VLC, the system's default video player. Success = browsing personal media with real posters and details, and one click to play, without running a media-server stack.

## Positioning

Not a media server (no Kodi/Plex/Jellyfin install, accounts, transcoding, or library-scan ceremony) - a direct, local read of the user's own files paired with their already-installed VLC. Where scraper-driven tools fail silently on odd filenames, this app always gives the user a one-click manual override ("Fix match") instead of a dead end.

## Operating Context

Single Linux desktop (Arch). A local Node/Express server (`localhost:4300`) opened in a normal browser; no reverse proxy or LAN exposure. VLC is the system default video player (set during this project). Two fixed root folders, already organized before the app runs and never written to by it:
- **Movies** - flat directory of video files.
- **Series** - one subfolder per series; season subfolders optional (loose episode files directly under the series folder are treated as Season 1).

## Capabilities and Constraints

- Scans both roots on each `/api/library` request; no persistent database beyond a TMDB metadata cache and a manual-override file.
- Scene-filename parsing (title/year for movies; season/episode/title for episodes) strips common release tags; underscore- and dot-separated names both handled.
- Optional TMDB v3 API key. Without one, posters fall back to a text tile; with one, results are cached to `cache/tmdb-cache.json` to avoid re-querying on every rescan.
- Per-item manual override (`overrides.json`, survives rescans): correct the TMDB search title/year, or set a manual poster URL/overview fallback when TMDB has no match at all.
- Settings UI edits the Movies/Series paths and the TMDB key directly - no manual file editing needed for normal use.
- Play action shells out to `vlc <resolved file path>`; the server refuses to play any path outside the two configured roots.
- No accounts, multi-user profiles, transcoding, or remote streaming. Confirmed single-user, localhost-only for now - not hardened for LAN/multi-device access.

## Brand Commitments

Working name "My Library" (browser tab title only - no logo/wordmark). Visual direction has been directed toward the Apple TV app's look throughout this project (dark cinematic canvas, poster-forward, minimal chrome) and the user is now asking to push the whole UI further in that direction.

## Evidence on Hand

None beyond the user's own local media filenames observed during setup (e.g. *Vishwanath and Sons* (2026), *Disclosure Day* (2026), *Jewel Thief - The Heist Begins* (2025), *One Night Only* (2026), *Stuart Fails to Save the Universe*). No testimonials, case studies, or press - this is a personal tool, not a marketed product. Future work must not invent any.

## Product Principles

1. Zero setup beyond pointing at two folders - no server accounts, no scan wizard, no config file editing required for normal use.
2. Filenames are ground truth, metadata is decoration - a wrong or missing TMDB match is always one click from being fixed, never a dead end.
3. Playback is VLC's job, not this app's - the only playback action is handing a file path to the system default player.
4. The visual language borrows Apple TV's confidence deliberately - the point is a "feels like a real streaming app" experience laid over the user's own files.
5. Single-user, local-first - no auth, no multi-device sync, no cloud dependency.

## Accessibility & Inclusion

No specific requirement beyond standard good practice (confirmed): visible keyboard focus states, `prefers-reduced-motion` support, WCAG-reasonable contrast. Partly established already in this project's current implementation.
