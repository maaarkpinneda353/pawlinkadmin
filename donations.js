(() => {
  'use strict';

  const STORAGE_KEY = 'donations';
  const GOAL = 10000;
  const CAMPAIGNS = ['Emergency Medical', 'Shelter Food', 'Rescue Operations'];
  const SEED_DONATIONS = [
    { id: 'don-501', donor: 'Avery Thompson', amount: 125, campaign: 'Emergency Medical', date: '2026-11-11', status: 'Completed' },
    { id: 'don-502', donor: 'Morgan Patel', amount: 50, campaign: 'Shelter Food', date: '2026-11-10', status: 'Completed' },
    { id: 'don-503', donor: 'Jamie Rivera', amount: 250, campaign: 'Rescue Operations', date: '2026-11-09', status: 'Completed' },
    { id: 'don-504', donor: 'Riley Chen', amount: 35, campaign: 'Emergency Medical', date: '2026-11-08', status: 'Pending' },
    { id: 'don-505', donor: 'Casey Johnson', amount: 75, campaign: 'Shelter Food', date: '2026-11-07', status: 'Completed' },
    { id: 'don-506', donor: 'Taylor Morgan', amount: 500, campaign: 'Rescue Operations', date: '2026-11-05', status: 'Completed' },
    { id: 'don-507', donor: 'Jordan Blake', amount: 40, campaign: 'Emergency Medical', date: '2026-11-03', status: 'Completed' },
    { id: 'don-508', donor: 'Sam Williams', amount: 120, campaign: 'Shelter Food', date: '2026-10-28', status: 'Completed' },
    { id: 'don-509', donor: 'Nina Lopez', amount: 300, campaign: 'Rescue Operations', date: '2026-10-23', status: 'Completed' },
    { id: 'don-510', donor: 'Devon Kim', amount: 60, campaign: 'Emergency Medical', date: '2026-10-16', status: 'Completed' },
    { id: 'don-511', donor: 'Alex Parker', amount: 85, campaign: 'Shelter Food', date: '2026-09-21', status: 'Completed' },
    { id: 'don-512', donor: 'Mia Robinson', amount: 175, campaign: 'Rescue Operations', date: '2026-09-12', status: 'Completed' },
    { id: 'don-513', donor: 'Robin Davis', amount: 45, campaign: 'Emergency Medical', date: '2026-08-18', status: 'Completed' },
    { id: 'don-514', donor: 'Ellis Green', amount: 90, campaign: 'Shelter Food', date: '2026-07-26', status: 'Completed' },
    { id: 'don-515', donor: 'Parker James', amount: 210, campaign: 'Rescue Operations', date: '2026-06-14', status: 'Completed' },
    { id: 'don-516', donor: 'Quinn Foster', amount: 65, campaign: 'Emergency Medical', date: '2026-05-09', status: 'Completed' },
    { id: 'don-517', donor: 'Drew Carter', amount: 110, campaign: 'Shelter Food', date: '2026-04-04', status: 'Completed' },
    { id: 'don-518', donor: 'Skyler Reed', amount: 400, campaign: 'Rescue Operations', date: '2026-03-19', status: 'Completed' }
  ];
  const page = document.querySelector('[data-donations-page]');
  if (!page) return;

  function readDonations() {
    try {
      const entries = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (Array.isArray(entries)) return entries.filter((entry) => entry && typeof entry === 'object');
    } catch { /* Invalid data is replaced with sample rows. */ }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DONATIONS));
    return SEED_DONATIONS;
  }
  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const amountOf = (entry) => Number(entry.amount ?? entry.total ?? entry.value) || 0;
  const campaignOf = (entry) => String(entry.campaign || entry.fund || 'Community Giving');
  const dateOf = (entry) => new Date(entry.date || entry.createdAt || entry.timestamp || '');
  const currency = (amount) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(amount || 0);
  const statusOf = (entry) => String(entry.status || 'Completed');
  const completed = (entry) => !['pending', 'failed', 'cancelled', 'canceled'].includes(statusOf(entry).toLowerCase());
  const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = (date) => new Intl.DateTimeFormat(undefined, { month: 'short' }).format(date);

  function renderMetrics() {
    const entries = readDonations().filter(completed);
    const total = entries.reduce((sum, entry) => sum + amountOf(entry), 0);
    const donors = new Set(entries.map((entry) => String(entry.donor || entry.donorName || 'Anonymous').trim().toLowerCase())).size;
    const average = entries.length ? total / entries.length : 0;
    const now = new Date();
    const monthTotal = entries.filter((entry) => { const date = dateOf(entry); return !Number.isNaN(date.valueOf()) && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth(); }).reduce((sum, entry) => sum + amountOf(entry), 0);
    const progress = Math.min(100, Math.round((monthTotal / GOAL) * 100));
    page.querySelector('[data-total-raised]').textContent = currency(total);
    page.querySelector('[data-total-donors]').textContent = donors.toLocaleString();
    page.querySelector('[data-average-donation]').textContent = currency(average);
    page.querySelector('[data-month-total]').textContent = currency(monthTotal);
    page.querySelector('[data-goal-target]').textContent = currency(GOAL);
    page.querySelector('[data-goal-percent]').textContent = `${progress}%`;
    page.querySelector('[data-goal-bar]').style.width = `${progress}%`;
    page.querySelector('[data-goal-progress]').setAttribute('aria-valuenow', String(progress));
    page.querySelector('[data-goal-caption]').textContent = `${currency(Math.max(GOAL - monthTotal, 0))} to reach this month’s goal`;
  }

  function renderCampaigns() {
    const entries = readDonations().filter(completed);
    const totals = CAMPAIGNS.map((campaign) => ({ campaign, total: entries.filter((entry) => campaignOf(entry) === campaign).reduce((sum, entry) => sum + amountOf(entry), 0) }));
    const max = Math.max(...totals.map((entry) => entry.total), 1);
    page.querySelector('[data-campaign-chart]').innerHTML = totals.map((entry, index) => `<div class="campaign-row"><div class="campaign-label-row"><span>${escapeHTML(entry.campaign)}</span><strong>${currency(entry.total)}</strong></div><div class="campaign-track"><span class="campaign-bar campaign-color-${index}" style="width:${Math.max(3, (entry.total / max) * 100)}%"></span></div></div>`).join('');
  }

  function renderTrends() {
    const entries = readDonations().filter(completed);
    const today = new Date();
    const months = Array.from({ length: 6 }, (_, index) => new Date(today.getFullYear(), today.getMonth() - (5 - index), 1));
    const totals = months.map((month) => ({ date: month, total: entries.filter((entry) => { const date = dateOf(entry); return !Number.isNaN(date.valueOf()) && monthKey(date) === monthKey(month); }).reduce((sum, entry) => sum + amountOf(entry), 0) }));
    const max = Math.max(...totals.map((item) => item.total), 1);
    page.querySelector('[data-trend-total]').textContent = `${currency(totals.reduce((sum, item) => sum + item.total, 0))} · 6 months`;
    page.querySelector('[data-trend-chart]').innerHTML = totals.map((item) => `<div class="trend-column"><span class="trend-value">${item.total ? currency(item.total) : '—'}</span><div class="trend-track"><span style="height:${Math.max(item.total ? 8 : 0, (item.total / max) * 100)}%"></span></div><span class="trend-month">${monthLabel(item.date)}</span></div>`).join('');
  }

  function renderLedger() {
    const query = page.querySelector('[data-ledger-search]').value.trim().toLowerCase();
    const statusFilter = page.querySelector('[data-status-filter]').value;
    const entries = readDonations().filter((entry) => {
      const donor = entry.donor || entry.donorName || 'Anonymous';
      const matchesSearch = `${donor} ${campaignOf(entry)}`.toLowerCase().includes(query);
      return matchesSearch && (statusFilter === 'all' || statusOf(entry) === statusFilter);
    }).sort((a, b) => dateOf(b) - dateOf(a));
    page.querySelector('[data-ledger-count]').textContent = `${entries.length} ${entries.length === 1 ? 'transaction' : 'transactions'}`;
    page.querySelector('[data-ledger-empty]').hidden = entries.length > 0;
    page.querySelector('[data-ledger-body]').innerHTML = entries.map((entry) => {
      const donor = entry.donor || entry.donorName || 'Anonymous';
      const date = dateOf(entry);
      const dateLabel = Number.isNaN(date.valueOf()) ? '—' : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
      const status = statusOf(entry);
      return `<tr><td><span class="donor-cell"><span class="donor-avatar" aria-hidden="true">${escapeHTML(String(donor).trim().charAt(0).toUpperCase() || 'A')}</span><strong>${escapeHTML(donor)}</strong></span></td><td class="amount-cell">${currency(amountOf(entry))}</td><td>${escapeHTML(campaignOf(entry))}</td><td>${escapeHTML(dateLabel)}</td><td><span class="donation-status status-${escapeHTML(status.toLowerCase())}">${escapeHTML(status)}</span></td></tr>`;
    }).join('');
  }

  function exportCSV() {
    const entries = readDonations();
    const columns = ['Donor Name', 'Amount', 'Campaign', 'Date', 'Status'];
    const rows = entries.map((entry) => [entry.donor || entry.donorName || 'Anonymous', amountOf(entry).toFixed(2), campaignOf(entry), entry.date || entry.createdAt || entry.timestamp || '', statusOf(entry)]);
    const csv = [columns, ...rows].map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pawlink-donations-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(link.href);
  }

  page.querySelector('[data-ledger-search]').addEventListener('input', renderLedger);
  page.querySelector('[data-status-filter]').addEventListener('change', renderLedger);
  page.querySelector('[data-export-csv]').addEventListener('click', exportCSV);
  window.addEventListener('storage', (event) => { if (event.key === STORAGE_KEY) { renderMetrics(); renderCampaigns(); renderTrends(); renderLedger(); } });
  renderMetrics(); renderCampaigns(); renderTrends(); renderLedger();
})();
