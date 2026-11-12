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

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
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
      <span class="mobile-admin-dot" aria-label="Administrator">${firstLetter}</span>
    </header>
    <button class="drawer-scrim" type="button" aria-label="Close navigation" data-menu-close></button>
    <aside class="sidebar" id="admin-sidebar" aria-label="Admin navigation">
      <a class="brand sidebar-brand" href="home.html"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 40 40"><path d="M20 31.2c-2.7-2.1-10.7-7.5-10.7-14.4a6.1 6.1 0 0 1 10.7-4 6.1 6.1 0 0 1 10.7 4c0 6.9-8 12.3-10.7 14.4Z"/><circle cx="11" cy="9" r="3"/><circle cx="19" cy="6.5" r="3"/><circle cx="27" cy="9" r="3"/></svg></span><span class="brand-name">PawLink<span class="brand-admin">ADMIN</span></span></a>
      <p class="nav-caption">WORKSPACE</p>
      <nav class="primary-nav">${links}</nav>
      <div class="sidebar-bottom">
        <button class="utility-button" type="button" data-theme-toggle aria-label="Switch to dark mode" aria-pressed="false"><span class="theme-icon" aria-hidden="true">◐</span><span class="theme-label">Switch to dark mode</span></button>
        <div class="sidebar-user"><span class="avatar" aria-hidden="true">${firstLetter}</span><span class="user-meta"><strong>${escapeHTML(user.name || 'Admin')}</strong><span>Administrator</span></span><span class="role-tag">admin</span></div>
        <button class="utility-button logout-button" type="button" data-logout><span class="logout-icon" aria-hidden="true">↪</span><span>Log out</span></button>
      </div>
    </aside>
    <div class="workspace">${mount.innerHTML}</div>`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function init() {
  applyTheme(localStorage.getItem(THEME_KEY) || 'light');
  const isLoginPage = document.body.classList.contains('login-page');
  const user = getCurrentUser();
  const authenticated = localStorage.getItem(LOGIN_KEY) === 'true' && user;

  if (isLoginPage && authenticated) {
    location.replace('home.html');
    return;
  }
  if (!isLoginPage && !authenticated) {
    location.replace('index.html');
    return;
  }

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
}

document.addEventListener('DOMContentLoaded', init);
