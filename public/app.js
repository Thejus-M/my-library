'use strict';

// One consistent-stroke icon set (24x24, stroke 1.6, round caps) - no unicode
// glyphs or emoji standing in for icons anywhere in the UI. `play` and `star`
// are filled shapes (matches SF Symbols' .fill variants); the rest are line icons.
const ICONS = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.7c0-1.2 1.3-2 2.4-1.4l10 6.3c1 .6 1 2 0 2.6l-10 6.3c-1 .6-2.4-.1-2.4-1.3V4.7Z"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3.3c.3 0 .6.2.7.5l2 4.5 4.9.6c.7.1 1 1 .5 1.5l-3.6 3.4.9 4.8c.1.7-.6 1.2-1.2.9L12 17.1l-4.2 2.4c-.6.3-1.3-.2-1.2-.9l.9-4.8-3.6-3.4c-.5-.5-.2-1.4.5-1.5l4.9-.6 2-4.5c.1-.3.4-.5.7-.5Z"/></svg>',
  pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19.5 8.5a2 2 0 0 0-4-4L4 15.9V20Z"/><path d="M14.5 6 18 9.5"/></svg>',
  chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5 8 12l7 7"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.2M12 7.8v.1" stroke-linecap="round"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.3M12 18.2v2.3M20.5 12h-2.3M5.8 12H3.5M17.8 6.2l-1.6 1.6M7.8 16.2l-1.6 1.6M17.8 17.8l-1.6-1.6M7.8 7.8 6.2 6.2"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12a7.5 7.5 0 0 1 12.8-5.3L19 8.4"/><path d="M19 4.5v4h-4"/><path d="M19.5 12a7.5 7.5 0 0 1-12.8 5.3L5 15.6"/><path d="M5 19.5v-4h4"/></svg>',
  film: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M8 4.5v15M16 4.5v15M3.5 9.5H8M16 9.5h4.5M3.5 14.5H8M16 14.5h4.5"/></svg>',
  tv: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M8.5 21.5h7"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2M18 7l-.8 12a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 7"/><path d="M10 11v6M14 11v6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17l9-10"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14 20 4M14 4h6v6M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/></svg>',
  shuffle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h3.3c1.5 0 2.9.8 3.6 2.1l1.1 2M4 18h3.3c1.5 0 2.9-.8 3.6-2.1l3.2-5.8c.7-1.3 2.1-2.1 3.6-2.1H20"/><path d="M17 4.2 20 6l-3 1.8M17 16.2l3 1.8-3 1.8"/></svg>',
  // Same star outline as `star`, but stroke-only - the "not rated this high
  // yet" state in the personal 1-5 rating row (star = filled/rated).
  starOutline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3.3c.3 0 .6.2.7.5l2 4.5 4.9.6c.7.1 1 1 .5 1.5l-3.6 3.4.9 4.8c.1.7-.6 1.2-1.2.9L12 17.1l-4.2 2.4c-.6.3-1.3-.2-1.2-.9l.9-4.8-3.6-3.4c-.5-.5-.2-1.4.5-1.5l4.9-.6 2-4.5c.1-.3.4-.5.7-.5Z"/></svg>'
};
function icon(name, extraClass) {
  return `<span class="icon${extraClass ? ' ' + extraClass : ''}" aria-hidden="true">${ICONS[name]}</span>`;
}

const state = {
  movies: [], series: [], tmdbConfigured: true, activeTab: 'movies', currentDetail: null, progress: {},
  // Per-tab filter text and sort mode - independent so switching tabs doesn't
  // reset what you were looking for on the other one.
  moviesFilter: '', seriesFilter: '', moviesSort: 'title', seriesSort: 'title',
  mylistFilter: '', mylistSort: 'recent',
  // The exact (filtered + sorted) item list currently rendered in each grid,
  // in on-screen order - card click handlers index into this, not the raw
  // state.movies/series arrays, since those two can differ once filtered/sorted.
  moviesVisible: [], seriesVisible: [], mylistVisible: []
};

const el = (id) => document.getElementById(id);

// Wrap a DOM update in the View Transitions API when the browser supports it,
// so tab switches and detail open/close cross-fade instead of hard-cutting.
// No-op fallback (just runs the update) everywhere else - stays vanilla JS,
// no animation library needed.
function withViewTransition(updateFn) {
  if (document.startViewTransition) {
    document.startViewTransition(updateFn);
  } else {
    updateFn();
  }
}

// --- Remember last view (tab + open detail) across reloads ---
//
// Single-user local app with no backend session, so localStorage is enough -
// no server round-trip needed to restore "where I was" on refresh/reopen.
// Wrapped in try/catch: private-browsing / blocked storage should degrade to
// "just open on Movies" rather than break the app.
const LAST_VIEW_KEY = 'myLibrary.lastView';
function loadLastView() {
  try {
    return JSON.parse(localStorage.getItem(LAST_VIEW_KEY));
  } catch {
    return null;
  }
}
function saveLastView() {
  try {
    localStorage.setItem(LAST_VIEW_KEY, JSON.stringify({ tab: state.activeTab, detail: state.currentDetail }));
  } catch {
    // ignore - non-critical convenience feature
  }
}

let toastTimer = null;
function showToast(message) {
  const toast = el('toast');
  toast.textContent = message;
  toast.classList.add('toast-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('toast-visible'), 3200);
}

// Modals fade + scale in/out (CSS transition is 0.18s, matched by MODAL_TRANSITION_MS below).
const MODAL_TRANSITION_MS = 180;
function openModal(modalEl) {
  modalEl.hidden = false;
  requestAnimationFrame(() => {
    modalEl.classList.add('modal-visible');
    const focusable = modalEl.querySelector('input, button, [tabindex]');
    if (focusable) focusable.focus();
  });
}
function closeModal(modalEl) {
  modalEl.classList.remove('modal-visible');
  setTimeout(() => { modalEl.hidden = true; }, MODAL_TRANSITION_MS);
}

// Click on the backdrop (outside the modal box) or press Escape to dismiss -
// whichever of modal / detail view / trash view is currently open.
function setupModalDismissal() {
  document.querySelectorAll('.modal').forEach((modalEl) => {
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) closeModal(modalEl);
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const openModalEl = document.querySelector('.modal.modal-visible');
    if (openModalEl) { closeModal(openModalEl); return; }
    if (!el('detailView').hidden) { closeDetail(); return; }
    if (!el('trashView').hidden) closeTrashView();
  });
}

let didRestoreView = false;

async function fetchLibrary() {
  el('loading').hidden = false;
  el('loadError').hidden = true;
  el('moviesView').hidden = true;
  el('seriesView').hidden = true;
  el('loadingHint').hidden = true;
  // A big library (or a first scan with a cold TMDB cache) can take a while -
  // reassure after a few seconds instead of leaving a bare spinner up with no
  // signal it's still working rather than stuck.
  const hintTimer = setTimeout(() => { el('loadingHint').hidden = false; }, 6000);
  try {
    const [libRes, progressRes] = await Promise.all([
      fetch('/api/library'),
      fetch('/api/progress').catch(() => null)
    ]);
    if (!libRes.ok) {
      const body = await libRes.json().catch(() => ({}));
      throw new Error(body.error || `Server returned ${libRes.status}`);
    }
    const data = await libRes.json();
    state.movies = data.movies;
    state.series = data.series;
    state.tmdbConfigured = data.tmdbConfigured;
    state.moviesPath = data.moviesPath;
    state.seriesPath = data.seriesPath;
    state.moviesPathExists = data.moviesPathExists !== false;
    state.seriesPathExists = data.seriesPathExists !== false;
    state.progress = progressRes ? await progressRes.json().catch(() => ({})) : {};
    el('loading').hidden = true;
    if (didRestoreView) {
      renderActiveTab();
    } else {
      didRestoreView = true;
      restoreLastView();
    }
  } catch (err) {
    // Server unreachable or scan failed - show a real error state with a
    // retry action instead of leaving the loading skeleton spinning forever.
    el('loading').hidden = true;
    el('loadErrorMessage').textContent = `Could not load your library: ${err.message}`;
    el('loadError').hidden = false;
  } finally {
    clearTimeout(hintTimer);
    el('loadingHint').hidden = true;
  }
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// A watched checkmark, a progress bar, or nothing - only for items that map to
// a single playable file (movies, episodes). Series cards have no one file to
// track, so they pass no filePath and get no overlay.
function progressOverlay(filePath) {
  const p = filePath && state.progress[filePath];
  if (!p) return '';
  if (p.watched) return `<div class="watched-badge">${icon('check')}</div>`;
  if (p.percent > 0) return `<div class="progress-track"><div class="progress-fill" style="width:${p.percent}%"></div></div>`;
  return '';
}

// Manual correction on top of the automatic VLC-tracked progress - "actually
// mark this watched" or "I'm rewatching this". Mirrors the server's own merge
// logic in state.progress immediately so the UI (badge, Play/Resume label)
// updates without waiting on a full rescan.
async function toggleWatched(filePath, watched) {
  try {
    const res = await fetch('/api/progress/toggle-watched', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, watched })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showToast('Could not update watched status: ' + (data.error || res.statusText));
      return false;
    }
    const existing = state.progress[filePath] || { percent: 0, position: 0, duration: 0 };
    state.progress[filePath] = {
      ...existing,
      watched,
      percent: watched ? 100 : 0,
      position: watched ? existing.position : 0,
      updatedAt: new Date().toISOString()
    };
    return true;
  } catch (err) {
    showToast('Could not reach server: ' + err.message);
    return false;
  }
}

// Personal 1-5 star rating - distinct from TMDB's own rating. Same
// optimistic-local-update pattern as toggleWatched: mirrors the server's
// merge into state.progress so every rating widget for this file (detail,
// episode row, My List card) stays in sync without a rescan.
async function rateFile(filePath, rating) {
  try {
    const res = await fetch('/api/rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, rating })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showToast('Could not save rating: ' + (data.error || res.statusText));
      return false;
    }
    const existing = state.progress[filePath] || { percent: 0, position: 0, duration: 0, watched: false };
    state.progress[filePath] = { ...existing, rating, updatedAt: new Date().toISOString() };
    return true;
  } catch (err) {
    showToast('Could not reach server: ' + err.message);
    return false;
  }
}

// A row of 5 clickable stars, filled up to the current rating. Clicking the
// star that's already the current rating clears it (handled by the shared
// delegated listener in setupStarRatingDelegation). Monochrome per DESIGN.md -
// filled vs. outline is the only visual difference, no color.
function starRatingHtml(filePath, currentRating) {
  const stars = [1, 2, 3, 4, 5].map((n) => {
    const filled = currentRating && n <= currentRating;
    return `<button type="button" class="star-rating-btn${filled ? ' filled' : ''}" data-value="${n}" aria-label="Rate ${n} star${n === 1 ? '' : 's'}" aria-pressed="${filled}">${icon(filled ? 'star' : 'starOutline')}</button>`;
  }).join('');
  return `<div class="star-rating" data-file="${escapeHtml(filePath)}">${stars}</div>`;
}

// One delegated listener handles every star-rating row on the page (detail
// view, episode rows, My List cards) instead of wiring each one individually.
function setupStarRatingDelegation() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.star-rating-btn');
    if (!btn) return;
    e.stopPropagation();
    const filePath = btn.closest('.star-rating').dataset.file;
    const value = parseInt(btn.dataset.value, 10);
    const current = state.progress[filePath] && state.progress[filePath].rating;
    const nextRating = current === value ? null : value;
    const ok = await rateFile(filePath, nextRating);
    if (ok) {
      showToast(nextRating ? `Rated ${nextRating} star${nextRating === 1 ? '' : 's'}` : 'Rating cleared');
      refreshCurrentView();
    }
  });
}

// Re-renders whatever's actually on screen after a background state change
// (rating, watched-toggle) so every view showing that file - grid, detail,
// My List - reflects it immediately, without a full rescan.
function refreshCurrentView() {
  if (!el('detailView').hidden && state.currentDetail) {
    const { type, id } = state.currentDetail;
    const list = type === 'movie' ? state.movies : state.series;
    const item = list.find((it) => it.id === id);
    if (item) {
      if (type === 'movie') openMovieDetail(item); else openSeriesDetail(item);
      return;
    }
  }
  if (state.activeTab === 'mylist') { renderMyList(); return; }
  renderActiveTab();
}

function posterOrFallback(item) {
  const inner = item.posterUrl
    ? `<img class="poster" src="${item.posterUrl}" alt="${escapeHtml(item.title)}" loading="lazy" />`
    : `<div class="poster-fallback">${escapeHtml(item.title)}</div>`;
  return `<div class="poster-wrap">${inner}${progressOverlay(item.filePath)}</div>`;
}

// --- Hero banner (top pick with a backdrop image) ---

function renderHero(heroEl, item, onPlay, onMoreInfo) {
  if (!item || !item.backdropUrl) {
    heroEl.hidden = true;
    heroEl.innerHTML = '';
    return;
  }
  heroEl.hidden = false;
  heroEl.innerHTML = `
    <div class="hero-bg" style="background-image:url('${item.backdropUrl}')"></div>
    <div class="hero-content">
      <div class="hero-title">${escapeHtml(item.title)}</div>
      <p class="hero-overview">${escapeHtml(item.overview || '')}</p>
      <div class="hero-actions">
        <button class="pill-btn primary" id="heroPlayBtn">${icon('play')}Play</button>
        <button class="pill-btn secondary" id="heroInfoBtn">${icon('info')}More Info</button>
      </div>
    </div>
  `;
  heroEl.querySelector('#heroPlayBtn').addEventListener('click', (e) => { e.stopPropagation(); onPlay(item); });
  heroEl.querySelector('#heroInfoBtn').addEventListener('click', (e) => { e.stopPropagation(); onMoreInfo(item); });
}

// --- Grids ---

// Stagger delay is capped so long lists don't feel slow to appear.
const STAGGER_CAP = 12;

// Sort modes available per shelf - series has no single "year" field (only
// per-episode air dates), so it only offers Title/Rating. My List sorts by
// your own activity/opinion (recently updated, my rating), not TMDB's.
const SORT_LABELS = {
  title: 'Title A–Z', year: 'Year: Newest', rating: 'Rating: Highest',
  recent: 'Recently Updated', myRating: 'My Rating'
};
const MOVIE_SORT_MODES = ['title', 'year', 'rating'];
const SERIES_SORT_MODES = ['title', 'rating'];
const MYLIST_SORT_MODES = ['recent', 'title', 'myRating'];
const SORTERS = {
  title: (a, b) => a.title.localeCompare(b.title),
  year: (a, b) => (b.year || 0) - (a.year || 0),
  rating: (a, b) => (b.rating || 0) - (a.rating || 0),
  recent: (a, b) => new Date((b.progress && b.progress.updatedAt) || 0) - new Date((a.progress && a.progress.updatedAt) || 0),
  myRating: (a, b) => ((b.progress && b.progress.rating) || 0) - ((a.progress && a.progress.rating) || 0)
};

// Filters `items` by title against `query`, sorts by `sortMode`, and returns
// the result - shared by both shelves so Movies/Series stay in lockstep.
function visibleItems(items, query, sortMode) {
  const q = query.trim().toLowerCase();
  const filtered = q ? items.filter((it) => (it.title || '').toLowerCase().includes(q)) : items.slice();
  filtered.sort(SORTERS[sortMode] || SORTERS.title);
  return filtered;
}

function makeCardClickable(card, onActivate) {
  card.addEventListener('click', (e) => {
    // An inner action button (rating stars, edit/trash) handles its own click -
    // without this a star click would bubble up and also open the detail view.
    if (e.target.closest('button')) return;
    onActivate();
  });
  card.addEventListener('keydown', (e) => {
    if (e.target.closest('button')) return; // let an inner action button (edit/trash) handle its own Enter/Space
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate();
    }
  });
}

// A missing folder (typo'd Settings path, unmounted drive) and a genuinely
// empty one both scan to zero items - this tells them apart so a config
// mistake doesn't just look like "you have no movies," with a direct way to
// fix it instead of a dead end.
function missingFolderHtml(iconName, label, folderPath) {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">${icon(iconName)}</div>
      <p>${escapeHtml(label)} folder not found.</p>
      <p class="empty-state-path">${escapeHtml(folderPath || '')}</p>
      <button type="button" class="pill-btn primary empty-state-settings-btn">Open Settings</button>
    </div>`;
}

function renderMovies() {
  const hero = state.movies.find((m) => m.backdropUrl) || state.movies[0];
  renderHero(el('moviesHero'), hero, (m) => playFile(m.filePath), (m) => openMovieDetail(m));

  el('moviesSortBtn').textContent = `Sort: ${SORT_LABELS[state.moviesSort]}`;

  const grid = el('moviesGrid');
  if (!state.movies.length) {
    if (!state.moviesPathExists) {
      grid.innerHTML = missingFolderHtml('film', 'Movies', state.moviesPath);
      grid.querySelector('.empty-state-settings-btn')?.addEventListener('click', openSettingsModal);
    } else {
      grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">${icon('film')}</div>No movies found in the configured folder.</div>`;
    }
    state.moviesVisible = [];
    return;
  }
  const visible = visibleItems(state.movies, state.moviesFilter, state.moviesSort);
  state.moviesVisible = visible;
  if (!visible.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">${icon('film')}</div>No movies match "${escapeHtml(state.moviesFilter.trim())}".</div>`;
    return;
  }
  grid.innerHTML = visible.map((m, i) => `
    <div class="card" tabindex="0" role="button" aria-label="${escapeHtml(m.title)}" style="--i:${Math.min(i, STAGGER_CAP)}" data-movie-index="${i}">
      ${posterOrFallback(m)}
      <div class="card-meta">
        <div class="card-title">${escapeHtml(m.title)}</div>
        <div class="card-sub">${m.year || ''}</div>
      </div>
    </div>
  `).join('');
  grid.querySelectorAll('[data-movie-index]').forEach((card) => {
    makeCardClickable(card, () => openMovieDetail(state.moviesVisible[card.dataset.movieIndex]));
  });
}

function renderSeries() {
  const hero = state.series.find((s) => s.backdropUrl) || state.series[0];
  renderHero(el('seriesHero'), hero, (s) => playNextEpisode(s), (s) => openSeriesDetail(s));

  el('seriesSortBtn').textContent = `Sort: ${SORT_LABELS[state.seriesSort]}`;

  const grid = el('seriesGrid');
  if (!state.series.length) {
    if (!state.seriesPathExists) {
      grid.innerHTML = missingFolderHtml('tv', 'Series', state.seriesPath);
      grid.querySelector('.empty-state-settings-btn')?.addEventListener('click', openSettingsModal);
    } else {
      grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">${icon('tv')}</div>No series found in the configured folder.</div>`;
    }
    state.seriesVisible = [];
    return;
  }
  const visible = visibleItems(state.series, state.seriesFilter, state.seriesSort);
  state.seriesVisible = visible;
  if (!visible.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">${icon('tv')}</div>No series match "${escapeHtml(state.seriesFilter.trim())}".</div>`;
    return;
  }
  grid.innerHTML = visible.map((s, i) => `
    <div class="card" tabindex="0" role="button" aria-label="${escapeHtml(s.title)}" style="--i:${Math.min(i, STAGGER_CAP)}" data-series-index="${i}">
      ${posterOrFallback(s)}
      <div class="card-meta">
        <div class="card-title">${escapeHtml(s.title)}</div>
        <div class="card-sub">${s.seasons.length} season${s.seasons.length === 1 ? '' : 's'}</div>
      </div>
    </div>
  `).join('');
  grid.querySelectorAll('[data-series-index]').forEach((card) => {
    makeCardClickable(card, () => openSeriesDetail(state.seriesVisible[card.dataset.seriesIndex]));
  });
}

// --- My List: everything with progress or a personal rating, movies and
// individual episodes together, across both shelves. ---

function computeWatchlist() {
  const items = [];
  for (const m of state.movies) {
    const p = state.progress[m.filePath];
    if (p && (p.watched || p.percent > 0)) {
      items.push({
        type: 'movie', title: m.title, subtitle: m.year ? String(m.year) : '',
        posterUrl: m.posterUrl, filePath: m.filePath, progress: p, ref: m
      });
    }
  }
  for (const s of state.series) {
    for (const season of s.seasons) {
      for (const ep of season.episodes) {
        if (ep.upcoming || !ep.filePath) continue;
        const p = state.progress[ep.filePath];
        if (p && (p.watched || p.percent > 0)) {
          const label = `S${ep.season ?? '?'} E${String(ep.episode ?? 0).padStart(2, '0')}`;
          items.push({
            type: 'episode', title: s.title, subtitle: `${label} · ${ep.title}`,
            posterUrl: s.posterUrl, filePath: ep.filePath, progress: p, ref: s
          });
        }
      }
    }
  }
  return items;
}

function renderMyList() {
  el('mylistSortBtn').textContent = `Sort: ${SORT_LABELS[state.mylistSort]}`;

  const all = computeWatchlist();
  const grid = el('mylistGrid');
  if (!all.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">${icon('play')}</div>Nothing here yet - play something and it'll show up as you watch.</div>`;
    state.mylistVisible = [];
    return;
  }
  const visible = visibleItems(all, state.mylistFilter, state.mylistSort);
  state.mylistVisible = visible;
  if (!visible.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">${icon('play')}</div>No matches for "${escapeHtml(state.mylistFilter.trim())}".</div>`;
    return;
  }
  grid.innerHTML = visible.map((it, i) => `
    <div class="card" tabindex="0" role="button" aria-label="${escapeHtml(it.title)}" style="--i:${Math.min(i, STAGGER_CAP)}" data-mylist-index="${i}">
      ${posterOrFallback(it)}
      <div class="card-meta">
        <div class="card-title">${escapeHtml(it.title)}</div>
        <div class="card-sub">${escapeHtml(it.subtitle)}</div>
        ${it.progress.watched ? starRatingHtml(it.filePath, it.progress.rating) : ''}
      </div>
    </div>
  `).join('');
  grid.querySelectorAll('[data-mylist-index]').forEach((card) => {
    makeCardClickable(card, () => {
      const it = state.mylistVisible[card.dataset.mylistIndex];
      if (it.type === 'movie') openMovieDetail(it.ref); else openSeriesDetail(it.ref);
    });
  });
}

// --- Detail overlay (shared by movies + series) ---

function metaRow(parts) {
  return parts.filter(Boolean).map((p) => `<span>${escapeHtml(p)}</span>`).join('');
}

function ratingHtml(rating) {
  return rating ? `<span class="meta-rating">${icon('star', 'icon-star')}${rating.toFixed(1)}</span>` : '';
}

function formatRuntime(minutes) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function openDetailShell(item) {
  withViewTransition(() => {
    el('app').hidden = true;
    el('detailView').hidden = false;
    window.scrollTo(0, 0);

    const backdrop = el('detailBackdrop');
    if (item.backdropUrl) {
      backdrop.style.display = 'block';
      el('detailBackdropImg').style.backgroundImage = `url("${item.backdropUrl}")`;
    } else {
      backdrop.style.display = 'none';
    }

    // No poster at all (no TMDB match, no manual override) - show the same
    // text-tile fallback the grid uses instead of just dropping the poster.
    const posterFallback = el('detailPosterFallback');
    if (item.posterUrl) {
      el('detailPoster').src = item.posterUrl;
      el('detailPoster').style.display = 'block';
      posterFallback.hidden = true;
    } else {
      el('detailPoster').style.display = 'none';
      posterFallback.textContent = item.title;
      posterFallback.hidden = false;
    }

    el('detailTitle').textContent = item.title;
    el('detailOverview').textContent = item.overview || '';

    const taglineEl = el('detailTagline');
    taglineEl.textContent = item.tagline || '';
    taglineEl.hidden = !item.tagline;

    const trailerBtn = el('detailTrailerBtn');
    if (item.trailerUrl) {
      trailerBtn.hidden = false;
      trailerBtn.onclick = () => window.open(item.trailerUrl, '_blank', 'noopener');
    } else {
      trailerBtn.hidden = true;
    }
  });
}

// Play button reads "Resume" and starts partway through when there's saved
// progress that isn't already marked watched; otherwise it's a plain Play.
// episodeLabel (e.g. "S2 E04") is appended for series so the continue-watching
// jump target is visible before you click, tvOS-style.
function setPlayButton(filePath, episodeLabel) {
  const playBtn = el('detailPlayBtn');
  const p = state.progress[filePath];
  const resumeAt = p && !p.watched && p.position > 5 ? p.position : null;
  const verb = resumeAt ? 'Resume' : 'Play';
  playBtn.innerHTML = `${icon('play')}${episodeLabel ? `${verb} ${episodeLabel}` : verb}`;
  playBtn.hidden = false;
  playBtn.onclick = () => playFile(filePath, resumeAt);
}

function openMovieDetail(movie) {
  state.currentDetail = { type: 'movie', id: movie.id };
  saveLastView();
  openDetailShell(movie);
  el('detailMeta').innerHTML = ratingHtml(movie.rating) + metaRow([
    movie.year, formatRuntime(movie.runtime), movie.contentRating, ...(movie.genres || [])
  ]);
  setPlayButton(movie.filePath);
  el('detailRandomBtn').hidden = true;

  // Manual override on top of the automatic watched detection - lets you flag
  // something you watched elsewhere, or restart tracking on a rewatch.
  const watchedBtn = el('detailWatchedBtn');
  const isWatched = Boolean(state.progress[movie.filePath] && state.progress[movie.filePath].watched);
  watchedBtn.hidden = false;
  watchedBtn.innerHTML = `${icon('check')}${isWatched ? 'Mark Unwatched' : 'Mark Watched'}`;
  watchedBtn.onclick = async () => {
    const ok = await toggleWatched(movie.filePath, !isWatched);
    if (ok) {
      showToast(isWatched ? 'Marked as unwatched' : 'Marked as watched');
      openMovieDetail(movie);
    }
  };

  // Rating is most meaningful once you've actually finished it, so it only
  // appears after Mark Watched (automatic or manual) - not shown at all
  // beforehand rather than a disabled row nobody can use yet.
  const ratingRow = el('detailRatingRow');
  if (isWatched) {
    ratingRow.hidden = false;
    ratingRow.innerHTML = `<span class="detail-rating-label">Your Rating</span>${starRatingHtml(movie.filePath, state.progress[movie.filePath].rating)}`;
  } else {
    ratingRow.hidden = true;
  }

  const deleteBtn = el('detailDeleteBtn');
  deleteBtn.hidden = false;
  deleteBtn.onclick = () => {
    if (!confirm('Delete this movie? It will be moved to Trash, where you can restore it or delete it permanently.')) return;
    trashItem({
      type: 'movie',
      filePath: movie.filePath,
      title: movie.title,
      subtitle: movie.year ? String(movie.year) : null,
      posterUrl: movie.posterUrl
    }, closeDetail);
  };

  el('detailSeasons').innerHTML = '';
}

// Continue watching: the first episode (in season/episode order) that isn't
// fully watched yet. Resumes mid-progress if that episode has any, otherwise
// lands on the next unwatched one - so the series card/hero Play button jumps
// you forward instead of always restarting at S1E1. Falls back to the very
// first episode once everything is watched.
function nextEpisodeToWatch(series) {
  let first = null;
  for (const season of series.seasons) {
    for (const ep of season.episodes) {
      if (ep.upcoming || !ep.filePath) continue;
      if (!first) first = ep;
      const p = state.progress[ep.filePath];
      if (!p || !p.watched) return ep;
    }
  }
  return first;
}

function playNextEpisode(series) {
  const ep = nextEpisodeToWatch(series);
  if (ep) playFile(ep.filePath);
}

// Every episode that's actually on disk (skips upcoming/undownloaded
// placeholders, which have no filePath to play) - the pool "Random Episode" draws from.
function playableEpisodes(series) {
  const out = [];
  for (const season of series.seasons) {
    for (const ep of season.episodes) {
      if (!ep.upcoming && ep.filePath) out.push(ep);
    }
  }
  return out;
}

function openSeriesDetail(series) {
  state.currentDetail = { type: 'series', id: series.id };
  saveLastView();
  openDetailShell(series);
  el('detailMeta').innerHTML = ratingHtml(series.rating) + metaRow([
    series.seasons.length + ' season' + (series.seasons.length === 1 ? '' : 's'),
    formatRuntime(series.runtime), series.contentRating, ...(series.genres || [])
  ]);

  const nextEp = nextEpisodeToWatch(series);
  if (nextEp) {
    const label = `S${nextEp.season ?? '?'} E${String(nextEp.episode ?? 0).padStart(2, '0')}`;
    setPlayButton(nextEp.filePath, label);
  } else {
    el('detailPlayBtn').hidden = true;
  }
  // No single file to toggle or rate at the series level - both are set per
  // episode in the list below.
  el('detailWatchedBtn').hidden = true;
  el('detailRatingRow').hidden = true;

  // Shuffle-watch: only worth offering once there's more than one downloaded
  // episode to actually pick from.
  const randomBtn = el('detailRandomBtn');
  const playable = playableEpisodes(series);
  if (playable.length > 1) {
    randomBtn.hidden = false;
    randomBtn.onclick = () => {
      const pool = playable.filter((ep) => ep.filePath !== nextEp?.filePath);
      const choices = pool.length ? pool : playable;
      playFile(choices[Math.floor(Math.random() * choices.length)].filePath);
    };
  } else {
    randomBtn.hidden = true;
  }

  el('detailDeleteBtn').hidden = true;

  // An upcoming episode you haven't downloaded yet: no file, so no play/edit/delete -
  // just what TMDB knows about it and whether it's aired yet.
  function upcomingSubtitle(ep) {
    const today = new Date().toISOString().slice(0, 10);
    if (!ep.airDate) return 'Air date not yet announced';
    return ep.airDate <= today ? `Aired ${formatDate(ep.airDate)} · not downloaded yet` : `Airs ${formatDate(ep.airDate)}`;
  }

  let epIndex = 0;
  el('detailSeasons').innerHTML = series.seasons.map((season) => `
    <div class="season-block">
      <div class="season-title">${escapeHtml(season.label)}</div>
      ${season.episodes.map((ep) => ep.upcoming ? `
        <div class="episode-row episode-row-upcoming" style="--i:${Math.min(epIndex++, STAGGER_CAP)}">
          <div class="episode-num">${ep.episode != null ? String(ep.episode).padStart(2, '0') : '–'}</div>
          <div class="episode-still-wrap">
            <div class="episode-still-fallback">${icon('calendar')}</div>
          </div>
          <div class="episode-body">
            <div class="episode-title">${escapeHtml(ep.title)}</div>
            <div class="episode-sub">${escapeHtml(upcomingSubtitle(ep))}</div>
          </div>
        </div>
      ` : `
        <div class="episode-row" tabindex="0" role="button" aria-label="${escapeHtml(ep.title)}" style="--i:${Math.min(epIndex++, STAGGER_CAP)}" data-file="${escapeHtml(ep.filePath)}" data-episode-id="${escapeHtml(ep.id)}">
          <div class="episode-num">${ep.episode != null ? String(ep.episode).padStart(2, '0') : '–'}</div>
          <div class="episode-still-wrap">
            ${ep.stillUrl
              ? `<img class="episode-still" src="${ep.stillUrl}" alt="" loading="lazy" />`
              : `<div class="episode-still-fallback">${icon('play')}</div>`}
            ${progressOverlay(ep.filePath)}
          </div>
          <div class="episode-body">
            <div class="episode-title">${escapeHtml(ep.title)}</div>
            ${ep.overview ? `<div class="episode-overview">${escapeHtml(ep.overview)}</div>` : ''}
            ${ep.airDate || ep.rating ? `<div class="episode-sub">${[ratingHtml(ep.rating), ep.airDate ? escapeHtml(formatDate(ep.airDate)) : null].filter(Boolean).join('<span class="dot"></span>')}</div>` : ''}
            ${(() => {
              const p = state.progress[ep.filePath];
              if (!p || !p.watched) return '';
              return `<div class="episode-my-rating">${starRatingHtml(ep.filePath, p.rating)}</div>`;
            })()}
          </div>
          <div class="episode-actions">
            ${(() => {
              const w = Boolean(state.progress[ep.filePath] && state.progress[ep.filePath].watched);
              const label = w ? 'Mark unwatched' : 'Mark watched';
              return `<button class="episode-action-btn episode-watched-btn${w ? ' is-watched' : ''}" title="${label}" aria-label="${label}">${icon('check')}</button>`;
            })()}
            <button class="episode-action-btn episode-edit-btn" title="Fix episode number" aria-label="Fix episode number">${icon('pencil')}</button>
            <button class="episode-action-btn episode-trash-btn" title="Delete" aria-label="Delete">${icon('trash')}</button>
            <div class="play-icon">${icon('play')}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');

  el('detailSeasons').querySelectorAll('.episode-row:not(.episode-row-upcoming)').forEach((row) => {
    makeCardClickable(row, () => playFile(row.dataset.file));

    row.querySelector('.episode-watched-btn').addEventListener('click', async (e) => {
      e.stopPropagation();
      const filePath = row.dataset.file;
      const currentlyWatched = Boolean(state.progress[filePath] && state.progress[filePath].watched);
      const ok = await toggleWatched(filePath, !currentlyWatched);
      if (ok) {
        showToast(currentlyWatched ? 'Marked as unwatched' : 'Marked as watched');
        const updated = state.series.find((s) => s.id === series.id);
        if (updated) openSeriesDetail(updated);
      }
    });
    row.querySelector('.episode-edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openEpisodeEditModal(row.dataset.episodeId);
    });
    row.querySelector('.episode-trash-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (!confirm('Delete this episode? It will be moved to Trash, where you can restore it or delete it permanently.')) return;
      const title = row.querySelector('.episode-title').textContent;
      trashItem({
        type: 'episode',
        filePath: row.dataset.file,
        title: series.title,
        subtitle: title,
        posterUrl: series.posterUrl
      }, () => {
        const updated = state.series.find((s) => s.id === series.id);
        if (updated) openSeriesDetail(updated);
        else closeDetail();
      });
    });
  });
}

function closeDetail() {
  withViewTransition(() => {
    el('detailView').hidden = true;
    el('app').hidden = false;
    // A watched-status toggle (or an edit-and-rescan) made while in detail can
    // leave the grid behind it stale - e.g. no watched badge yet on the card
    // you just finished. Re-render the active tab on the way out so it's
    // never out of sync with what you just did.
    renderActiveTab();
  });
  state.currentDetail = null;
  saveLastView();
}

// --- Play in VLC ---

async function playFile(filePath, startTime) {
  try {
    const res = await fetch('/api/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, startTime })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showToast('Could not play file: ' + (data.error || res.statusText));
    }
  } catch (err) {
    showToast('Could not reach server: ' + err.message);
  }
}

// --- Chrome: tabs, back, settings, rescan ---

function renderActiveTab() {
  el('moviesView').hidden = state.activeTab !== 'movies';
  el('seriesView').hidden = state.activeTab !== 'series';
  el('mylistView').hidden = state.activeTab !== 'mylist';
  if (state.activeTab === 'movies') renderMovies();
  else if (state.activeTab === 'series') renderSeries();
  else renderMyList();
}

// On first load only: reopen whichever tab (and detail, if any) was open the
// last time this browser had the app open, instead of always resetting to
// the top of Movies. Falls back to the default Movies grid if there's
// nothing stored, or if the stored item no longer exists in the library.
function restoreLastView() {
  const last = loadLastView();
  if (last && (last.tab === 'movies' || last.tab === 'series' || last.tab === 'mylist') && last.tab !== state.activeTab) {
    document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === last.tab));
    state.activeTab = last.tab;
  }
  renderActiveTab();

  const detail = last && last.detail;
  if (detail && detail.type && detail.id) {
    const list = detail.type === 'movie' ? state.movies : state.series;
    const item = list.find((it) => it.id === detail.id);
    if (item) {
      if (detail.type === 'movie') openMovieDetail(item);
      else openSeriesDetail(item);
    }
  }
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (state.activeTab === btn.dataset.tab) return;
      withViewTransition(() => {
        document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeTab = btn.dataset.tab;
        state.currentDetail = null;
        renderActiveTab();
      });
      saveLastView();
    });
  });
}

function setupBack() {
  el('backFromDetail').addEventListener('click', closeDetail);
}

function setupEdit() {
  el('detailEditBtn').addEventListener('click', async () => {
    const { type, id } = state.currentDetail;
    const res = await fetch(`/api/override?type=${type}&id=${encodeURIComponent(id)}`);
    const existing = await res.json();

    el('editTitleInput').value = existing.title || '';
    el('editYearInput').value = existing.year || '';
    el('editPosterInput').value = existing.posterUrl || '';
    el('editOverviewInput').value = existing.overview || '';

    const isMovie = type === 'movie';
    el('editYearLabel').hidden = !isMovie;
    el('editYearInput').hidden = !isMovie;

    openModal(el('editModal'));
  });

  el('closeEdit').addEventListener('click', () => closeModal(el('editModal')));

  el('saveEdit').addEventListener('click', async () => {
    const { type, id } = state.currentDetail;
    await fetch('/api/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type, id,
        title: el('editTitleInput').value,
        year: el('editYearInput').value,
        posterUrl: el('editPosterInput').value,
        overview: el('editOverviewInput').value
      })
    });
    closeModal(el('editModal'));
    await fetchLibrary();

    const list = type === 'movie' ? state.movies : state.series;
    const updated = list.find((item) => item.id === id);
    if (updated) {
      if (type === 'movie') openMovieDetail(updated);
      else openSeriesDetail(updated);
    } else {
      closeDetail();
    }
  });
}

// --- Delete to trash ---

async function trashItem(payload, onDone) {
  try {
    const res = await fetch('/api/trash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showToast('Could not delete: ' + (data.error || res.statusText));
      return;
    }
    showToast('Moved to trash');
    await fetchLibrary();
    onDone();
  } catch (err) {
    showToast('Could not reach server: ' + err.message);
  }
}

// --- Episode number override (fixes a mislabeled file's season/episode so TMDB lookup matches) ---

let episodeEditId = null;

async function openEpisodeEditModal(episodeId) {
  episodeEditId = episodeId;
  const res = await fetch(`/api/override?type=episode&id=${encodeURIComponent(episodeId)}`);
  const existing = await res.json();
  el('episodeSeasonInput').value = existing.season || '';
  el('episodeNumberInput').value = existing.episode || '';
  openModal(el('episodeEditModal'));
}

function setupEpisodeEdit() {
  el('closeEpisodeEdit').addEventListener('click', () => closeModal(el('episodeEditModal')));
  el('saveEpisodeEdit').addEventListener('click', async () => {
    await fetch('/api/override-episode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: episodeEditId,
        season: el('episodeSeasonInput').value,
        episode: el('episodeNumberInput').value
      })
    });
    closeModal(el('episodeEditModal'));
    await fetchLibrary();
    if (state.currentDetail && state.currentDetail.type === 'series') {
      const updated = state.series.find((s) => s.id === state.currentDetail.id);
      if (updated) openSeriesDetail(updated);
    }
  });
}

// --- Trash view ---

function trashItemHtml(item) {
  const thumb = item.posterUrl
    ? `<img class="trash-item-thumb" src="${item.posterUrl}" alt="" />`
    : `<div class="trash-item-thumb-fallback"></div>`;
  return `
    <div class="trash-item" data-id="${escapeHtml(item.id)}">
      ${thumb}
      <div class="trash-item-body">
        <div class="trash-item-title">${escapeHtml(item.title)}</div>
        ${item.subtitle ? `<div class="trash-item-sub">${escapeHtml(item.subtitle)}</div>` : ''}
      </div>
      <div class="trash-item-actions">
        <button class="pill-btn secondary trash-restore-btn">Restore</button>
        <button class="pill-btn secondary trash-delete-btn">${icon('trash')}Delete</button>
      </div>
    </div>
  `;
}

async function renderTrashList() {
  const res = await fetch('/api/trash');
  const items = await res.json();

  const list = el('trashList');
  if (!items.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">${icon('trash')}</div>Trash is empty.</div>`;
    return;
  }
  list.innerHTML = items.map(trashItemHtml).join('');

  list.querySelectorAll('.trash-item').forEach((row) => {
    const id = row.dataset.id;
    row.querySelector('.trash-restore-btn').addEventListener('click', async () => {
      await fetch('/api/trash/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      showToast('Restored');
      await Promise.all([renderTrashList(), fetchLibrary()]);
    });
    row.querySelector('.trash-delete-btn').addEventListener('click', async () => {
      if (!confirm('Permanently delete this file? This cannot be undone.')) return;
      await fetch('/api/trash/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      showToast('Deleted permanently');
      renderTrashList();
    });
  });
}

function openTrashView() {
  withViewTransition(() => {
    el('app').hidden = true;
    el('trashView').hidden = false;
    window.scrollTo(0, 0);
  });
  renderTrashList();
}

function closeTrashView() {
  withViewTransition(() => {
    el('trashView').hidden = true;
    el('app').hidden = false;
  });
}

function setupTrash() {
  el('trashBtn').addEventListener('click', openTrashView);
  el('backFromTrash').addEventListener('click', closeTrashView);
  el('emptyTrashBtn').addEventListener('click', async () => {
    if (!confirm('Permanently delete everything in Trash? This cannot be undone.')) return;
    await fetch('/api/trash/empty', { method: 'POST' });
    showToast('Trash emptied');
    renderTrashList();
  });
}

// Shared so the "folder not found" empty state can jump straight to Settings,
// not just the topbar gear icon.
async function openSettingsModal() {
  const res = await fetch('/api/config');
  const cfg = await res.json();
  el('moviesPathInput').value = cfg.moviesPath;
  el('seriesPathInput').value = cfg.seriesPath;
  el('tmdbKeyInput').value = '';
  el('tmdbKeyInput').placeholder = cfg.tmdbConfigured ? 'key set (leave blank to keep)' : 'paste TMDB v3 API key';
  openModal(el('settingsModal'));
}

function setupSettings() {
  el('settingsBtn').addEventListener('click', openSettingsModal);
  el('closeSettings').addEventListener('click', () => closeModal(el('settingsModal')));
  el('clearCacheBtn').addEventListener('click', async () => {
    if (!confirm('Clear cached TMDB metadata? The next scan re-fetches everything fresh, which takes longer and uses more TMDB API calls.')) return;
    await fetch('/api/clear-metadata-cache', { method: 'POST' });
    showToast('Metadata cache cleared');
    closeModal(el('settingsModal'));
    fetchLibrary();
  });
  el('saveSettings').addEventListener('click', async () => {
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tmdbApiKey: el('tmdbKeyInput').value,
        moviesPath: el('moviesPathInput').value,
        seriesPath: el('seriesPathInput').value
      })
    });
    closeModal(el('settingsModal'));
    fetchLibrary();
  });
}

function setupRescan() {
  el('rescanBtn').addEventListener('click', fetchLibrary);
}

function setupRetryLoad() {
  el('retryLoadBtn').addEventListener('click', fetchLibrary);
}

// Per-shelf filter text box + a single cycling sort pill (Title/Year/Rating
// for movies, Title/Rating for series - series has no single "year" field).
function setupShelfControls() {
  el('moviesSearchInput').addEventListener('input', (e) => {
    state.moviesFilter = e.target.value;
    renderMovies();
  });
  el('seriesSearchInput').addEventListener('input', (e) => {
    state.seriesFilter = e.target.value;
    renderSeries();
  });
  el('moviesSortBtn').addEventListener('click', () => {
    const i = MOVIE_SORT_MODES.indexOf(state.moviesSort);
    state.moviesSort = MOVIE_SORT_MODES[(i + 1) % MOVIE_SORT_MODES.length];
    renderMovies();
  });
  el('seriesSortBtn').addEventListener('click', () => {
    const i = SERIES_SORT_MODES.indexOf(state.seriesSort);
    state.seriesSort = SERIES_SORT_MODES[(i + 1) % SERIES_SORT_MODES.length];
    renderSeries();
  });
  el('mylistSearchInput').addEventListener('input', (e) => {
    state.mylistFilter = e.target.value;
    renderMyList();
  });
  el('mylistSortBtn').addEventListener('click', () => {
    const i = MYLIST_SORT_MODES.indexOf(state.mylistSort);
    state.mylistSort = MYLIST_SORT_MODES[(i + 1) % MYLIST_SORT_MODES.length];
    renderMyList();
  });
}

// Arrow-key navigation across poster grids and episode lists, extending the
// existing focus-visible outlines to real keyboard/d-pad-style browsing
// instead of just Tab-order. Left/Right/Up/Down move between cards in a grid
// (column count worked out from actual layout, so it holds at any breakpoint
// or grid density); Up/Down move between episode rows in a series detail.
function setupKeyboardGridNav() {
  document.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;

    const card = e.target.closest('.card');
    if (card) {
      const grid = card.closest('.grid');
      const cards = [...grid.children];
      const idx = cards.indexOf(card);
      const firstTop = cards[0].offsetTop;
      let columns = cards.findIndex((c) => c.offsetTop !== firstTop);
      if (columns === -1) columns = cards.length;
      let nextIdx = idx;
      if (e.key === 'ArrowRight') nextIdx = idx + 1;
      else if (e.key === 'ArrowLeft') nextIdx = idx - 1;
      else if (e.key === 'ArrowDown') nextIdx = idx + columns;
      else if (e.key === 'ArrowUp') nextIdx = idx - columns;
      if (nextIdx < 0 || nextIdx >= cards.length) return;
      e.preventDefault();
      cards[nextIdx].focus();
      return;
    }

    const row = e.target.closest('.episode-row:not(.episode-row-upcoming)');
    if (row && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      const rows = [...document.querySelectorAll('#detailSeasons .episode-row:not(.episode-row-upcoming)')];
      const idx = rows.indexOf(row);
      const nextIdx = e.key === 'ArrowDown' ? idx + 1 : idx - 1;
      if (nextIdx < 0 || nextIdx >= rows.length) return;
      e.preventDefault();
      rows[nextIdx].focus();
    }
  });
}

function wireStaticIcons() {
  el('backFromDetail').innerHTML = `${icon('chevronLeft')}Back`;
  el('backFromTrash').innerHTML = `${icon('chevronLeft')}Back`;
  el('settingsBtn').innerHTML = icon('gear');
  el('rescanBtn').innerHTML = icon('refresh');
  el('trashBtn').innerHTML = icon('trash');
  el('detailEditBtn').innerHTML = `${icon('pencil')}Fix match`;
  el('detailDeleteBtn').innerHTML = `${icon('trash')}Delete`;
  el('detailTrailerBtn').innerHTML = `${icon('link')}Watch Trailer`;
  el('detailPlayBtn').innerHTML = `${icon('play')}Play`;
  el('detailRandomBtn').innerHTML = `${icon('shuffle')}Random Episode`;
  el('emptyTrashBtn').innerHTML = `${icon('trash')}Empty Trash`;
  el('loadErrorIcon').innerHTML = icon('info');
  el('clearCacheBtn').innerHTML = `${icon('refresh')}Clear Metadata Cache`;
}

wireStaticIcons();
setupTabs();
setupBack();
setupEdit();
setupEpisodeEdit();
setupTrash();
setupSettings();
setupRescan();
setupRetryLoad();
setupModalDismissal();
setupShelfControls();
setupKeyboardGridNav();
setupStarRatingDelegation();
fetchLibrary();
