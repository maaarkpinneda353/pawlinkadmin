const NAV_ITEMS = [
  { label: 'Home', href: 'home.html', icon: '⌂' },
  { label: 'Search pets', href: 'search.html', icon: '⌕' },
  { label: 'Community reports', href: 'reports.html', icon: '▤' },
  { label: 'Adopt a pet', href: 'adopt.html', icon: '♡' },
  { label: 'Pet shop', href: 'shop.html', icon: '▧' },
  { label: 'Donation Analytics', href: 'donations.html', icon: '↗' },
  { label: 'My profile', href: 'profile.html', icon: '◉' }
];

const THEME_KEY = 'pawlinkTheme';
const USER_KEY = 'currentUser';
const LOGIN_KEY = 'isLoggedIn';
const RECORD_KEYS = {
  reports: ['reports', 'communityReports', 'pawlinkReports', 'lostPets', 'foundPets'],
  pets: ['pets', 'adoptablePets', 'petListings', 'adoptionListings', 'pawlinkPets'],
  shop: ['shopListings', 'products', 'petShopListings', 'pawlinkShop'],
  funds: ['donations', 'pawlinkDonations', 'fundraising', 'fundsRaised', 'pawlinkFunds']
};
const SEARCH_CATEGORY_LABELS = { lost: 'Lost', found: 'Found', adoption: 'Adoption', shop: 'Shop', reports: 'Reports', pets: 'Pets' };

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
  catch { return null; }
}

function parseStoredValue(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); }
  catch { return null; }
}

function toRecordArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    for (const key of ['items', 'records', 'data', 'listings', 'results']) {
      if (Array.isArray(value[key])) return value[key];
    }
    return [value];
  }
  return [];
}

function readRecords(keys) {
  return keys.flatMap((key) => toRecordArray(parseStoredValue(key)).filter((item) => item && typeof item === 'object'));
}

function getRecordId(record, fallback) {
  return record.id ?? record._id ?? record.petId ?? record.reportId ?? record.productId ?? fallback;
}

function normalizedText(value) {
  return String(value ?? '').toLowerCase();
}

function applyTheme(theme) {
  const normalized = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = normalized;
  localStorage.setItem(THEME_KEY, normalized);
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.setAttribute('aria-pressed', String(normalized === 'dark'));
    const label = button.querySelector('.theme-label');
    if (label) label.textContent = normalized === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    const icon = button.querySelector('.theme-icon');
    if (icon) icon.textContent = normalized === 'dark' ? '☼' : '◐';
  });
}

function renderShell(user) {
  const mount = document.querySelector('[data-admin-shell]');
  if (!mount) return;
  const currentPage = location.pathname.split('/').pop() || 'home.html';
  const firstLetter = (user.name || 'Admin').trim().charAt(0).toUpperCase() || 'A';
  const links = NAV_ITEMS.map((item) => {
    const active = item.href === currentPage;
    return `<a class="nav-link${active ? ' is-active' : ''}" href="${item.href}"${active ? ' aria-current="page"' : ''}><span class="nav-icon" aria-hidden="true">${item.icon}</span><span>${item.label}</span>${active ? '<span class="active-indicator" aria-hidden="true"></span>' : ''}</a>`;
  }).join('');

  mount.innerHTML = `
    <header class="mobile-header">
      <button class="icon-button menu-button" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="admin-sidebar" data-menu-toggle><span></span><span></span><span></span></button>
      <a class="brand" href="home.html"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 40 40"><path d="M20 31.2c-2.7-2.1-10.7-7.5-10.7-14.4a6.1 6.1 0 0 1 10.7-4 6.1 6.1 0 0 1 10.7 4c0 6.9-8 12.3-10.7 14.4Z"/><circle cx="11" cy="9" r="3"/><circle cx="19" cy="6.5" r="3"/><circle cx="27" cy="9" r="3"/></svg></span><span class="brand-name">PawLink</span></a>
      <span class="mobile-admin-dot" aria-label="Administrator">${escapeHTML(firstLetter)}</span>
    </header>
    <button class="drawer-scrim" type="button" aria-label="Close navigation" data-menu-close></button>
    <aside class="sidebar" id="admin-sidebar" aria-label="Admin navigation">
      <a class="brand sidebar-brand" href="home.html"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 40 40"><path d="M20 31.2c-2.7-2.1-10.7-7.5-10.7-14.4a6.1 6.1 0 0 1 10.7-4 6.1 6.1 0 0 1 10.7 4c0 6.9-8 12.3-10.7 14.4Z"/><circle cx="11" cy="9" r="3"/><circle cx="19" cy="6.5" r="3"/><circle cx="27" cy="9" r="3"/></svg></span><span class="brand-name">PawLink<span class="brand-admin">ADMIN</span></span></a>
      <p class="nav-caption">WORKSPACE</p><nav class="primary-nav">${links}</nav>
      <div class="sidebar-bottom"><button class="utility-button" type="button" data-theme-toggle aria-label="Switch to dark mode" aria-pressed="false"><span class="theme-icon" aria-hidden="true">◐</span><span class="theme-label">Switch to dark mode</span></button><div class="sidebar-user"><span class="avatar" aria-hidden="true">${escapeHTML(firstLetter)}</span><span class="user-meta"><strong>${escapeHTML(user.name || 'Admin')}</strong><span>Administrator</span></span><span class="role-tag">admin</span></div><button class="utility-button logout-button" type="button" data-logout><span class="logout-icon" aria-hidden="true">↪</span><span>Log out</span></button></div>
    </aside>
    <div class="workspace">${mount.innerHTML}</div>`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function isActiveReport(record) {
  const status = normalizedText(record.status || record.state);
  return !['resolved', 'closed', 'complete', 'completed', 'archived', 'deleted'].includes(status) && record.active !== false;
}

function isAdoptablePet(record) {
  const status = normalizedText(record.status || record.adoptionStatus);
  return record.available !== false && record.adoptable !== false && !['adopted', 'unavailable', 'archived', 'deleted', 'completed'].includes(status);
}

function formatCurrency(value) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function updateDashboard() {
  const reportCount = readRecords(RECORD_KEYS.reports).filter(isActiveReport).length;
  const petCount = readRecords(RECORD_KEYS.pets).filter(isAdoptablePet).length;
  const shopCount = readRecords(RECORD_KEYS.shop).filter((record) => record.active !== false && !['archived', 'deleted', 'inactive'].includes(normalizedText(record.status))).length;
  const donations = readRecords(RECORD_KEYS.funds);
  const totalFunds = donations.reduce((total, record) => total + (Number(record.amount ?? record.total ?? record.value) || 0), 0);
  document.querySelectorAll('[data-kpi="reports"]').forEach((node) => { node.textContent = reportCount.toLocaleString(); });
  document.querySelectorAll('[data-kpi="pets"]').forEach((node) => { node.textContent = petCount.toLocaleString(); });
  document.querySelectorAll('[data-kpi="shop"]').forEach((node) => { node.textContent = shopCount.toLocaleString(); });
  document.querySelectorAll('[data-kpi="funds"]').forEach((node) => { node.textContent = formatCurrency(totalFunds); });
}

function getAnnouncements() {
  return toRecordArray(parseStoredValue('pawlinkAnnouncements')).filter((item) => item && typeof item === 'object');
}

function renderAnnouncements() {
  const list = document.querySelector('[data-announcement-list]');
  if (!list) return;
  const announcements = getAnnouncements().slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 4);
  const count = document.querySelector('[data-announcement-count]');
  if (count) count.textContent = String(announcements.length);
  list.innerHTML = announcements.length ? announcements.map((item) => {
    const date = item.createdAt ? new Date(item.createdAt) : null;
    const dateLabel = date && !Number.isNaN(date.valueOf()) ? date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now';
    return `<article class="announcement-item"><span class="announcement-icon" aria-hidden="true">📣</span><div><p>${escapeHTML(item.message || item.text || '')}</p><time>${escapeHTML(dateLabel)}</time></div></article>`;
  }).join('') : '<p class="muted announcement-empty">Your published announcements will appear here.</p>';
}

function detectCategory(record, sourceKey) {
  const explicit = normalizedText(record.category || record.type || record.kind || record.recordType);
  const source = normalizedText(sourceKey);
  if (explicit.includes('lost') || source.includes('lost')) return 'lost';
  if (explicit.includes('found') || source.includes('found')) return 'found';
  if (explicit.includes('shop') || explicit.includes('product') || source.includes('shop') || source.includes('product')) return 'shop';
  if (explicit.includes('adopt') || explicit.includes('pet') || source.includes('pet') || source.includes('adopt')) return 'adoption';
  if (explicit.includes('report') || source.includes('report')) return 'reports';
  return 'pets';
}

function collectSearchRecords() {
  const records = [];
  const seen = new Set();
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || !/(report|lost|found|pet|adopt|shop|product|listing)/i.test(key) || /announcement|broadcast/i.test(key)) continue;
    const value = parseStoredValue(key);
    toRecordArray(value).forEach((record, itemIndex) => {
      if (!record || typeof record !== 'object') return;
      const category = detectCategory(record, key);
      if (category === 'reports' && !['lost', 'found'].includes(category)) return;
      const id = getRecordId(record, `${key}-${itemIndex}`);
      const unique = `${key}:${id}`;
      if (seen.has(unique)) return;
      seen.add(unique);
      const page = category === 'shop' ? 'shop.html' : ['lost', 'found', 'reports'].includes(category) ? 'reports.html' : 'adopt.html';
      const title = record.name || record.petName || record.title || record.productName || record.label || `${SEARCH_CATEGORY_LABELS[category] || 'Platform'} record`;
      const description = record.description || record.details || record.summary || record.notes || '';
      const locationText = record.location || record.city || record.address || '';
      const status = record.status || record.state || '';
      const searchable = [title, description, locationText, status, id, record.breed, record.species].map(normalizedText).join(' ');
      records.push({ id: String(id), title: String(title), description: String(description), location: String(locationText), status: String(status), category, page, searchable });
    });
  }
  return records;
}

let activeSearchCategory = 'all';
let searchRecords = [];
function renderSearchResults() {
  const resultsNode = document.querySelector('[data-search-results]');
  if (!resultsNode) return;
  const query = normalizedText(document.querySelector('[data-global-search-input]')?.value.trim());
  const filtered = searchRecords.filter((record) => (activeSearchCategory === 'all' || record.category === activeSearchCategory) && (!query || record.searchable.includes(query)));
  const countNode = document.querySelector('[data-search-count]');
  if (countNode) countNode.textContent = `${filtered.length} ${filtered.length === 1 ? 'record' : 'records'}`;
  const categories = ['all', 'lost', 'found', 'adoption', 'shop'];
  categories.forEach((category) => {
    const node = document.querySelector(`[data-filter-count="${category}"]`);
    if (node) node.textContent = String(category === 'all' ? searchRecords.length : searchRecords.filter((record) => record.category === category).length);
  });
  if (!filtered.length) {
    resultsNode.innerHTML = `<div class="empty-state search-empty"><div class="empty-icon" aria-hidden="true">⌕</div><h2>${query || activeSearchCategory !== 'all' ? 'No matching records' : 'No records yet'}</h2><p>${query || activeSearchCategory !== 'all' ? 'Try another search term or category filter.' : 'Records saved by the PawLink platform will appear here.'}</p></div>`;
    return;
  }
  resultsNode.innerHTML = filtered.map((record) => {
    const params = new URLSearchParams({ edit: record.id, category: record.category });
    const meta = [record.location, record.status].filter(Boolean).map(escapeHTML).join(' · ');
    return `<article class="record-card"><div class="record-card-top"><span class="record-category category-${escapeHTML(record.category)}">${escapeHTML(SEARCH_CATEGORY_LABELS[record.category] || 'Pet')}</span><span class="record-id">#${escapeHTML(record.id)}</span></div><h3>${escapeHTML(record.title)}</h3><p class="record-description">${escapeHTML(record.description || 'No description provided.')}</p><div class="record-card-bottom"><span class="record-meta">${meta || 'PawLink listing'}</span><a class="record-open-link" href="${record.page}?${params.toString()}">Open record <span aria-hidden="true">↗</span></a></div></article>`;
  }).join('');
}

function refreshSearchRecords() {
  if (!document.querySelector('[data-search-results]')) return;
  searchRecords = collectSearchRecords();
  renderSearchResults();
}

function initPageFeatures() {
  const dateNode = document.querySelector('#dashboard-date');
  if (dateNode) dateNode.textContent = new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(new Date());
  updateDashboard();
  renderAnnouncements();

  const broadcastForm = document.querySelector('#broadcast-form');
  const messageInput = document.querySelector('#broadcast-message');
  const countNode = document.querySelector('[data-character-count]');
  messageInput?.addEventListener('input', () => { if (countNode) countNode.textContent = String(messageInput.value.length); });
  broadcastForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = messageInput.value.trim();
    if (!message) return;
    const announcement = { id: `announcement-${Date.now()}`, message, author: 'Admin', createdAt: new Date().toISOString(), type: 'announcement' };
    const announcements = getAnnouncements();
    announcements.push(announcement);
    localStorage.setItem('pawlinkAnnouncements', JSON.stringify(announcements));
    localStorage.setItem('pawlinkCommunityFeed', JSON.stringify([announcement, ...toRecordArray(parseStoredValue('pawlinkCommunityFeed'))]));
    messageInput.value = '';
    if (countNode) countNode.textContent = '0';
    const feedback = document.querySelector('[data-broadcast-feedback]');
    if (feedback) feedback.textContent = 'Announcement published to the community feed and alerts.';
    renderAnnouncements();
  });

  const searchInput = document.querySelector('[data-global-search-input]');
  const clearButton = document.querySelector('[data-search-clear]');
  searchInput?.addEventListener('input', () => {
    if (clearButton) clearButton.hidden = !searchInput.value;
    renderSearchResults();
  });
  clearButton?.addEventListener('click', () => {
    searchInput.value = '';
    clearButton.hidden = true;
    searchInput.focus();
    renderSearchResults();
  });
  document.querySelector('[data-search-filters]')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    activeSearchCategory = button.dataset.category;
    document.querySelectorAll('[data-category]').forEach((pill) => {
      const selected = pill === button;
      pill.classList.toggle('is-selected', selected);
      pill.setAttribute('aria-pressed', String(selected));
    });
    renderSearchResults();
  });
  if (searchInput) refreshSearchRecords();
}

function init() {
  applyTheme(localStorage.getItem(THEME_KEY) || 'light');
  const isLoginPage = document.body.classList.contains('login-page');
  const user = getCurrentUser();
  const authenticated = localStorage.getItem(LOGIN_KEY) === 'true' && user;
  if (isLoginPage && authenticated) { location.replace('home.html'); return; }
  if (!isLoginPage && !authenticated) { location.replace('index.html'); return; }
  if (isLoginPage) {
    document.querySelector('#login-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      localStorage.setItem(USER_KEY, JSON.stringify({ name: 'Admin', email: 'admin@pawlink.org', role: 'admin' }));
      localStorage.setItem(LOGIN_KEY, 'true');
      location.href = 'home.html';
    });
    return;
  }
  renderShell(user);
  initPageFeatures();
  document.addEventListener('click', (event) => {
    const themeButton = event.target.closest('[data-theme-toggle]');
    if (themeButton) applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    if (event.target.closest('[data-logout]')) {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(LOGIN_KEY);
      location.replace('index.html');
    }
    if (event.target.closest('[data-menu-toggle]')) {
      document.body.classList.add('drawer-open');
      document.querySelector('[data-menu-toggle]')?.setAttribute('aria-expanded', 'true');
    }
    if (event.target.closest('[data-menu-close]') || event.target.closest('.nav-link')) {
      document.body.classList.remove('drawer-open');
      document.querySelector('[data-menu-toggle]')?.setAttribute('aria-expanded', 'false');
    }
  });
  window.addEventListener('storage', () => { updateDashboard(); renderAnnouncements(); refreshSearchRecords(); });
  window.addEventListener('focus', () => { updateDashboard(); renderAnnouncements(); refreshSearchRecords(); });
  document.addEventListener('keydown', (event) => {
    if (event.key === '/' && !/input|textarea/i.test(document.activeElement.tagName) && document.querySelector('[data-global-search-input]')) {
      event.preventDefault();
      document.querySelector('[data-global-search-input]').focus();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
