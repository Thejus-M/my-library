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
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14 20 4M14 4h6v6M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/></svg>'
};
function icon(name, extraClass) {
  return `<span class="icon${extraClass ? ' ' + extraClass : ''}" aria-hidden="true">${ICONS[name]}</span>`;
}

const state = { movies: [], series: [], tmdbConfigured: true, activeTab: 'movies', currentDetail: null, progress: {} };

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
  requestAnimationFrame(() => modalEl.classList.add('modal-visible'));
}
function closeModal(modalEl) {
  modalEl.classList.remove('modal-visible');
  setTimeout(() => { modalEl.hidden = true; }, MODAL_TRANSITION_MS);
}

async function fetchLibrary() {
  el('loading').hidden = false;
  el('moviesView').hidden = true;
  el('seriesView').hidden = true;
  const [libRes, progressRes] = await Promise.all([
    fetch('/api/library'),
    fetch('/api/progress').catch(() => null)
  ]);
  const data = await libRes.json();
  state.movies = data.movies;
  state.series = data.series;
  state.tmdbConfigured = data.tmdbConfigured;
  state.progress = progressRes ? await progressRes.json().catch(() => ({})) : {};
  el('loading').hidden = true;
  renderActiveTab();
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

function makeCardClickable(card, onActivate) {
  card.addEventListener('click', onActivate);
  card.addEventListener('keydown', (e) => {
    if (e.target.closest('button')) return; // let an inner action button (edit/trash) handle its own Enter/Space
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate();
    }
  });
}

function renderMovies() {
  const hero = state.movies.find((m) => m.backdropUrl) || state.movies[0];
  renderHero(el('moviesHero'), hero, (m) => playFile(m.filePath), (m) => openMovieDetail(m));

  const grid = el('moviesGrid');
  if (!state.movies.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">${icon('film')}</div>No movies found in the configured folder.</div>`;
    return;
  }
  grid.innerHTML = state.movies.map((m, i) => `
    <div class="card" tabindex="0" role="button" aria-label="${escapeHtml(m.title)}" style="--i:${Math.min(i, STAGGER_CAP)}" data-movie-index="${i}">
      ${posterOrFallback(m)}
      <div class="card-meta">
        <div class="card-title">${escapeHtml(m.title)}</div>
        <div class="card-sub">${m.year || ''}</div>
      </div>
    </div>
  `).join('');
  grid.querySelectorAll('[data-movie-index]').forEach((card) => {
    makeCardClickable(card, () => openMovieDetail(state.movies[card.dataset.movieIndex]));
  });
}

function renderSeries() {
  const hero = state.series.find((s) => s.backdropUrl) || state.series[0];
  renderHero(el('seriesHero'), hero, (s) => playFirstEpisode(s), (s) => openSeriesDetail(s));

  const grid = el('seriesGrid');
  if (!state.series.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">${icon('tv')}</div>No series found in the configured folder.</div>`;
    return;
  }
  grid.innerHTML = state.series.map((s, i) => `
    <div class="card" tabindex="0" role="button" aria-label="${escapeHtml(s.title)}" style="--i:${Math.min(i, STAGGER_CAP)}" data-series-index="${i}">
      ${posterOrFallback(s)}
      <div class="card-meta">
        <div class="card-title">${escapeHtml(s.title)}</div>
        <div class="card-sub">${s.seasons.length} season${s.seasons.length === 1 ? '' : 's'}</div>
      </div>
    </div>
  `).join('');
  grid.querySelectorAll('[data-series-index]').forEach((card) => {
    makeCardClickable(card, () => openSeriesDetail(state.series[card.dataset.seriesIndex]));
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

    if (item.posterUrl) {
      el('detailPoster').src = item.posterUrl;
      el('detailPoster').style.display = 'block';
    } else {
      el('detailPoster').style.display = 'none';
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
function setPlayButton(filePath) {
  const playBtn = el('detailPlayBtn');
  const p = state.progress[filePath];
  const resumeAt = p && !p.watched && p.position > 5 ? p.position : null;
  playBtn.innerHTML = resumeAt ? `${icon('play')}Resume` : `${icon('play')}Play`;
  playBtn.hidden = false;
  playBtn.onclick = () => playFile(filePath, resumeAt);
}

function openMovieDetail(movie) {
  state.currentDetail = { type: 'movie', id: movie.id };
  openDetailShell(movie);
  el('detailMeta').innerHTML = ratingHtml(movie.rating) + metaRow([
    movie.year, formatRuntime(movie.runtime), movie.contentRating, ...(movie.genres || [])
  ]);
  setPlayButton(movie.filePath);

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

function firstEpisodeOf(series) {
  for (const season of series.seasons) {
    const ep = season.episodes.find((e) => !e.upcoming);
    if (ep) return ep;
  }
  return null;
}

function playFirstEpisode(series) {
  const ep = firstEpisodeOf(series);
  if (ep) playFile(ep.filePath);
}

function openSeriesDetail(series) {
  state.currentDetail = { type: 'series', id: series.id };
  openDetailShell(series);
  el('detailMeta').innerHTML = ratingHtml(series.rating) + metaRow([
    series.seasons.length + ' season' + (series.seasons.length === 1 ? '' : 's'),
    formatRuntime(series.runtime), series.contentRating, ...(series.genres || [])
  ]);

  const firstEp = firstEpisodeOf(series);
  if (firstEp) {
    setPlayButton(firstEp.filePath);
  } else {
    el('detailPlayBtn').hidden = true;
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
          </div>
          <div class="episode-actions">
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
  });
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
  if (state.activeTab === 'movies') {
    el('moviesView').hidden = false;
    el('seriesView').hidden = true;
    renderMovies();
  } else {
    el('moviesView').hidden = true;
    el('seriesView').hidden = false;
    renderSeries();
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
        renderActiveTab();
      });
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

function setupSettings() {
  el('settingsBtn').addEventListener('click', async () => {
    const res = await fetch('/api/config');
    const cfg = await res.json();
    el('moviesPathInput').value = cfg.moviesPath;
    el('seriesPathInput').value = cfg.seriesPath;
    el('tmdbKeyInput').value = '';
    el('tmdbKeyInput').placeholder = cfg.tmdbConfigured ? 'key set (leave blank to keep)' : 'paste TMDB v3 API key';
    openModal(el('settingsModal'));
  });
  el('closeSettings').addEventListener('click', () => closeModal(el('settingsModal')));
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
  el('emptyTrashBtn').innerHTML = `${icon('trash')}Empty Trash`;
}

wireStaticIcons();
setupTabs();
setupBack();
setupEdit();
setupEpisodeEdit();
setupTrash();
setupSettings();
setupRescan();
fetchLibrary();
