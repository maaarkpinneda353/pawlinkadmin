(() => {
  'use strict';

  const USER_KEY = 'currentUser';
  const ACTIVITY_KEY = 'pawlinkAdminActivity';
  const page = document.querySelector('[data-profile-page]');
  if (!page) return;

  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  function readUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || '{}') || {}; }
    catch { return {}; }
  }
  function readActivity() {
    try {
      const value = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || 'null');
      if (Array.isArray(value)) return value;
    } catch { /* Use sample history if invalid. */ }
    const seeded = [
      { id: 'activity-login', action: 'Signed in to the PawLink admin portal', createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString() },
      { id: 'activity-reports', action: 'Reviewed community report updates', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
      { id: 'activity-dashboard', action: 'Viewed platform analytics', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() }
    ];
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(seeded));
    return seeded;
  }
  function recordActivity(action) {
    const entries = readActivity();
    entries.unshift({ id: `activity-${Date.now()}`, action, createdAt: new Date().toISOString() });
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(entries.slice(0, 12)));
  }
  function syncSidebar(user) {
    const name = user.name || 'Admin';
    const initial = name.trim().charAt(0).toUpperCase() || 'A';
    const sidebarName = document.querySelector('.sidebar-user .user-meta strong');
    if (sidebarName) sidebarName.textContent = name;
    const avatar = document.querySelector('.sidebar-user .avatar');
    if (avatar) avatar.textContent = initial;
    const mobileAvatar = document.querySelector('.mobile-admin-dot');
    if (mobileAvatar) mobileAvatar.textContent = initial;
    const display = page.querySelector('[data-profile-display-name]');
    if (display) display.textContent = name;
    const profileAvatar = page.querySelector('[data-profile-avatar]');
    if (profileAvatar) profileAvatar.textContent = initial;
  }
  function renderActivity() {
    const list = page.querySelector('[data-profile-activity]');
    const entries = readActivity().slice(0, 6);
    list.innerHTML = entries.map((entry) => {
      const date = new Date(entry.createdAt);
      const when = Number.isNaN(date.valueOf()) ? 'Recently' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
      return `<article class="profile-activity-item"><span class="activity-dot" aria-hidden="true"></span><div><p>${escapeHTML(entry.action)}</p><time>${escapeHTML(when)}</time></div></article>`;
    }).join('') || '<p class="profile-no-activity">No activity recorded yet.</p>';
  }

  const form = page.querySelector('[data-profile-form]');
  const user = readUser();
  form.elements.name.value = user.name || 'Admin';
  form.elements.email.value = user.email || 'admin@pawlink.org';
  form.elements.bio.value = user.bio || '';
  syncSidebar(user);
  renderActivity();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const updatedUser = { ...readUser(), name: form.elements.name.value.trim(), email: form.elements.email.value.trim(), bio: form.elements.bio.value.trim(), role: 'admin' };
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    syncSidebar(updatedUser);
    recordActivity('Updated administrator profile details');
    renderActivity();
    page.querySelector('[data-profile-feedback]').textContent = 'Profile saved and synced with the admin sidebar.';
  });
  window.addEventListener('storage', (event) => {
    if (event.key === USER_KEY) {
      const updated = readUser();
      form.elements.name.value = updated.name || 'Admin';
      form.elements.email.value = updated.email || 'admin@pawlink.org';
      form.elements.bio.value = updated.bio || '';
      syncSidebar(updated);
    }
    if (event.key === ACTIVITY_KEY) renderActivity();
  });
})();
