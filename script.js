/* ============================================================
   myhealth — Personal Health Tracking Dashboard
   ============================================================ */

// ── State ──────────────────────────────────────────────────
const state = {
  entries: [],
  chart: null,
};

const cfg = {
  get token()    { return localStorage.getItem('mh_gh_token') || ''; },
  set token(v)   { localStorage.setItem('mh_gh_token', v); },
  get repo()     { return localStorage.getItem('mh_gh_repo') || ''; },
  set repo(v)    { localStorage.setItem('mh_gh_repo', v); },
};

// ── DOM Cache ──────────────────────────────────────────────
const $    = (s, p = document) => p.querySelector(s);
const $$   = (s, p = document) => [...p.querySelectorAll(s)];

const dom = {};

function cacheDom() {
  dom.main            = $('#mainContent');
  dom.footer          = $('#footer');
  dom.loading         = $('#loadingState');
  dom.currentDate     = $('#currentDate');

  // Hero
  dom.heroStats       = $('#heroStats');
  dom.streak          = $('#streakValue');
  dom.consistency     = $('#consistencyValue');
  dom.todayScore      = $('#todayScoreValue');

  // Metrics
  dom.metricsGrid     = $('#metricsGrid');

  // Chart
  dom.chartSection    = $('#chartSection');
  dom.chartCanvas     = $('#trendChart');

  // Entries
  dom.entriesSection  = $('#entriesSection');
  dom.entriesList     = $('#entriesList');

  // Modals
  dom.entryModal      = $('#entryModal');
  dom.entryForm       = $('#entryForm');
  dom.addEntryBtn     = $('#addEntryBtn');
  dom.closeEntryModal = $('#closeEntryModal');
  dom.cancelEntryBtn  = $('#cancelEntryBtn');

  dom.settingsModal   = $('#settingsModal');
  dom.settingsForm    = $('#settingsForm');
  dom.settingsBtn     = $('#settingsBtn');
  dom.closeSettings   = $('#closeSettingsModal');
  dom.cancelSettings  = $('#cancelSettingsBtn');
  dom.ghStatus        = $('#ghStatus');
  dom.ghIndicator     = $('#ghIndicator');
  dom.ghStatusText    = $('#ghStatusText');
  dom.tokenInput      = $('#githubToken');
  dom.repoInput       = $('#repoFull');

  // Toast
  dom.toastContainer  = $('#toastContainer');
}

// ── Utilities ──────────────────────────────────────────────
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtDate(d) {
  const dateObj = typeof d === 'string' ? new Date(d + 'T00:00:00') : d;
  return `${MONTHS[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
}

function fmtShort(d) {
  const dateObj = typeof d === 'string' ? new Date(d + 'T00:00:00') : d;
  return `${MONTHS[dateObj.getMonth()]} ${dateObj.getDate()}`;
}

function dayName(d) {
  const dateObj = typeof d === 'string' ? new Date(d + 'T00:00:00') : d;
  return DAY_NAMES[dateObj.getDay()];
}

function toDateStr(d) {
  const dateObj = typeof d === 'string' ? new Date(d + 'T00:00:00') : d;
  return dateObj.toISOString().slice(0, 10);
}

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// ── Data Fetching & Parsing ────────────────────────────────
async function fetchData() {
  const resp = await fetch('data/checklist.json?' + Date.now());
  if (!resp.ok) throw new Error('Unable to load data.');
  const json = await resp.json();
  return (json.entries || [])
    .map(e => ({ ...e }))
    .filter(e => e.date)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ── Calculations ──────────────────────────────────────────
function getStreak(entries) {
  if (!entries.length) return 0;
  let streak = 1;
  for (let i = entries.length - 1; i > 0; i--) {
    const curr = new Date(entries[i].date + 'T00:00:00');
    const prev = new Date(entries[i - 1].date + 'T00:00:00');
    const diff = (curr - prev) / (86400000);
    if (Math.round(diff) === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function getGoalScore(entry) {
  const hits = [
    (entry.proteinPercent || 0) >= 80,
    (entry.waterGlasses || 0) >= 7,
    (entry.sleepHours || 0) >= 7,
    !!entry.generalHealth,
  ].filter(Boolean).length;
  return Math.round((hits / 4) * 100);
}

function getConsistency(entries) {
  if (!entries.length) return 0;
  let totalHits = 0;
  for (const e of entries) {
    totalHits += [
      (e.proteinPercent || 0) >= 80,
      (e.waterGlasses || 0) >= 7,
      (e.sleepHours || 0) >= 7,
      !!e.generalHealth,
    ].filter(Boolean).length;
  }
  return Math.round((totalHits / (entries.length * 4)) * 100);
}

function getLastNDays(entries, n = 14) {
  if (!entries.length) return [];
  const latest = new Date(entries[entries.length - 1].date + 'T00:00:00');
  const cutoff = new Date(latest);
  cutoff.setDate(cutoff.getDate() - (n - 1));
  return entries.filter(e => new Date(e.date + 'T00:00:00') >= cutoff);
}

function getWeekDays(entries) {
  if (!entries.length) return { count: 0, goalHitPct: 0, metrics: {} };
  const latest = new Date(entries[entries.length - 1].date + 'T00:00:00');
  const weekAgo = new Date(latest);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const week = entries.filter(e => new Date(e.date + 'T00:00:00') >= weekAgo);
  const count = week.length;
  if (!count) return { count: 0, goalHitPct: 0, metrics: {} };
  const metrics = {
    protein: week.filter(e => (e.proteinPercent || 0) >= 80).length / count,
    water:   week.filter(e => (e.waterGlasses || 0) >= 7).length / count,
    sleep:   week.filter(e => (e.sleepHours || 0) >= 7).length / count,
    health:  week.filter(e => !!e.generalHealth).length / count,
  };
  const goalHitPct = week.filter(e => getGoalScore(e) >= 75).length / count;
  return { count, goalHitPct: Math.round(goalHitPct * 100), metrics };
}

// ── Render Helpers ────────────────────────────────────────
function render() {
  if (!state.entries.length) {
    dom.main.innerHTML = `
      <div class="empty-state">
        <p>No entries yet</p>
        <p class="hint">Click "+ New Entry" to add your first day.</p>
      </div>`;
    dom.footer.hidden = false;
    return;
  }

  const entries = state.entries;
  const latest  = entries[entries.length - 1];
  const streak  = getStreak(entries);
  const consist = getConsistency(entries);
  const todayGs = getGoalScore(latest);
  const week    = getWeekDays(entries);

  dom.main.innerHTML = `
    <!-- Hero Stats -->
    <section class="hero-stats" id="heroStats">
      <div class="stat-card">
        <div class="stat-value">${streak} <span class="unit">days</span></div>
        <div class="stat-label">Current streak</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${consist}<span class="unit">%</span></div>
        <div class="stat-label">Overall consistency</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${todayGs}<span class="unit">%</span></div>
        <div class="stat-label">Latest goal score</div>
      </div>
    </section>

    <!-- Metric Cards -->
    <section class="metrics-grid" id="metricsGrid">
      ${metricCard('Protein', latest.proteinPercent != null ? latest.proteinPercent + '%' : '—', barClass(latest.proteinPercent, 80), proteinBar(latest.proteinPercent))}
      ${metricCard('Water',   latest.waterGlasses != null ? latest.waterGlasses + 'gl' : '—', barClass(latest.waterGlasses, 7), waterBar(latest.waterGlasses))}
      ${metricCard('Sleep',   latest.sleepHours != null ? latest.sleepHours + 'h' : '—', barClass(latest.sleepHours, 7), sleepBar(latest.sleepHours))}
      ${metricCard('Health',  latest.generalHealth ? 'Good' : 'Ok', latest.generalHealth ? 'success' : 'neutral', latest.generalHealth ? 100 : 50)}
    </section>

    <!-- Chart -->
    <section class="chart-section" id="chartSection">
      <p class="section-title">14-Day Trends</p>
      <div class="chart-card">
        <canvas id="trendChart"></canvas>
      </div>
    </section>

    <!-- Recent Entries -->
    <section class="entries-section" id="entriesSection">
      <p class="section-title">Recent Entries</p>
      <div class="entries-list" id="entriesList">
        ${entries.slice(-10).reverse().map(e => entryRow(e)).join('')}
      </div>
    </section>`;

  dom.footer.hidden = false;

  // Re-cache new DOM elements and draw chart
  dom.heroStats   = $('#heroStats');
  dom.metricsGrid = $('#metricsGrid');
  dom.chartCanvas = $('#trendChart');
  dom.entriesList = $('#entriesList');
  dom.chartSection = $('#chartSection');
  dom.entriesSection = $('#entriesSection');

  drawChart(getLastNDays(entries));
}

function metricCard(label, value, barClassVal, barWidth) {
  return `
    <div class="metric-card">
      <div class="metric-value">${value}</div>
      <div class="metric-label">${label}</div>
      <div class="metric-bar"><div class="metric-bar-fill ${barClassVal}" style="width:${barWidth}%"></div></div>
    </div>`;
}

function barClass(val, threshold) {
  if (val == null) return 'neutral';
  return val >= threshold ? 'success' : 'warning';
}

function proteinBar(val) {
  if (val == null) return 0;
  return Math.min(100, val);
}

function waterBar(val) {
  if (val == null) return 0;
  return Math.min(100, (val / 10) * 100);
}

function sleepBar(val) {
  if (val == null) return 0;
  return Math.min(100, (val / 9) * 100);
}

function entryRow(e) {
  const gs = getGoalScore(e);
  const healthClass = e.generalHealth ? 'good' : 'neutral';
  return `
    <div class="entry-row">
      <div class="entry-date-block">
        <div class="entry-day-name">${dayName(e.date)}</div>
        <div class="entry-date-num">${fmtDate(e.date)}</div>
      </div>
      <div class="entry-metrics">
        <span class="entry-metric"><span class="tag">P</span> <span class="val">${e.proteinPercent || 0}%</span></span>
        <span class="entry-metric"><span class="tag">W</span> <span class="val">${e.waterGlasses || 0}gl</span></span>
        <span class="entry-metric"><span class="tag">Ex</span> <span class="val">${e.exerciseMinutes || 0}m</span></span>
        <span class="entry-metric"><span class="tag">Sl</span> <span class="val">${e.sleepHours || 0}h</span></span>
        <span class="entry-metric"><span class="tag">Sc</span> <span class="val">${gs}%</span></span>
      </div>
      <span class="entry-dot ${healthClass}"></span>
    </div>`;
}

// ── Chart ─────────────────────────────────────────────────
const CHART_COLORS = {
  protein: '#0a6847',
  water:   '#2563eb',
  sleep:   '#7c3aed',
  score:   '#d97706',
};

function drawChart(entries) {
  if (!dom.chartCanvas) return;
  const ctx = dom.chartCanvas.getContext('2d');
  if (!ctx) return;

  if (state.chart) { state.chart.destroy(); state.chart = null; }

  if (!entries.length) return;

  const labels = entries.map(e => fmtShort(e.date));
  const datasets = [
    {
      label: 'Protein %',
      data: entries.map(e => e.proteinPercent || 0),
      borderColor: CHART_COLORS.protein,
      backgroundColor: 'rgba(10,104,71,0.08)',
      tension: 0.35,
      fill: true,
      pointRadius: 3,
      pointHoverRadius: 5,
      spanGaps: true,
    },
    {
      label: 'Water',
      data: entries.map(e => e.waterGlasses || 0),
      borderColor: CHART_COLORS.water,
      backgroundColor: 'rgba(37,99,235,0.08)',
      tension: 0.35,
      fill: true,
      pointRadius: 3,
      pointHoverRadius: 5,
      spanGaps: true,
    },
    {
      label: 'Sleep',
      data: entries.map(e => e.sleepHours || 0),
      borderColor: CHART_COLORS.sleep,
      backgroundColor: 'rgba(124,58,237,0.08)',
      tension: 0.35,
      fill: true,
      pointRadius: 3,
      pointHoverRadius: 5,
      spanGaps: true,
    },
    {
      label: 'Score',
      data: entries.map(e => getGoalScore(e)),
      borderColor: CHART_COLORS.score,
      backgroundColor: 'rgba(217,119,6,0.08)',
      tension: 0.35,
      fill: true,
      pointRadius: 3,
      pointHoverRadius: 5,
      borderDash: [4, 3],
      spanGaps: true,
    },
  ];

  state.chart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 16,
            font: { size: 11, family: 'Inter, sans-serif' },
            color: '#8e8e93',
          },
        },
        tooltip: {
          backgroundColor: '#1c1c1e',
          titleFont: { size: 12, family: 'Inter, sans-serif' },
          bodyFont: { size: 12, family: 'Inter, sans-serif' },
          cornerRadius: 8,
          padding: 10,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: {
            font: { size: 10, family: 'Inter, sans-serif' },
            color: '#aeaeb2',
          },
        },
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 10, family: 'Inter, sans-serif' },
            color: '#aeaeb2',
            maxRotation: 0,
          },
        },
      },
    },
  });
}

// ── Modal Management ──────────────────────────────────────
function openModal(modal) {
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// ── Form Handling ─────────────────────────────────────────
function getFormBody(data) {
  return [
    `Date: ${data.date}`,
    `Protein %: ${data.proteinPercent}`,
    `Water glasses: ${data.waterGlasses}`,
    `Exercise minutes: ${data.exerciseMinutes}`,
    `Sleep hours: ${data.sleepHours}`,
    `General health: ${data.generalHealth ? 'yes' : 'no'}`,
    `Notes: ${data.notes}`,
  ].join('\n');
}

async function submitToGitHub(body) {
  const token = cfg.token;
  const repo  = cfg.repo;
  if (!token || !repo) return false;

  // Extract date from body to build title
  const dateMatch = body.match(/^Date: (.+)$/m);
  const title = dateMatch ? `Health Entry - ${dateMatch[1].trim()}` : `Health Entry - ${todayStr()}`;

  const url = `https://api.github.com/repos/${repo}/issues`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      body,
      labels: ['health-entry'],
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API returned ${resp.status}`);
  }

  return true;
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const data = {
    date:             $('#entryDate', dom.entryForm).value || todayStr(),
    proteinPercent:   parseInt($('#proteinPercent', dom.entryForm).value) || 0,
    waterGlasses:    parseInt($('#waterGlasses', dom.entryForm).value) || 0,
    exerciseMinutes: parseInt($('#exerciseMinutes', dom.entryForm).value) || 0,
    sleepHours:      parseFloat($('#sleepHours', dom.entryForm).value) || 0,
    generalHealth:   $('#generalHealth', dom.entryForm).checked,
    notes:           $('#notes', dom.entryForm).value.trim(),
  };

  // Close modal immediately
  closeModal(dom.entryModal);

  // Optimistic local update
  const existing = state.entries.findIndex(e => e.date === data.date);
  if (existing >= 0) {
    state.entries[existing] = { ...state.entries[existing], ...data };
  } else {
    state.entries.push(data);
    state.entries.sort((a, b) => a.date.localeCompare(b.date));
  }
  render();

  // Persist via GitHub Issues API
  const body = getFormBody(data);
  try {
    await submitToGitHub(body);
    showToast('Entry saved and synced to GitHub', 'success');
  } catch (err) {
    if (cfg.token && cfg.repo) {
      showToast(`Saved locally. GitHub sync failed: ${err.message}`, 'error');
    } else {
      showToast('Entry saved locally. Configure GitHub in Settings for permanent storage.', 'info');
    }
  }

  dom.entryForm.reset();
  $('#entryDate', dom.entryForm).value = todayStr();
  $('#generalHealth', dom.entryForm).checked = true;
}

// ── Settings ──────────────────────────────────────────────
function loadSettingsForm() {
  dom.tokenInput.value = cfg.token;
  dom.repoInput.value  = cfg.repo;
  updateGhStatus();
}

function updateGhStatus() {
  const hasToken = !!cfg.token;
  const hasRepo  = !!cfg.repo;
  dom.ghIndicator.className = 'indicator' + (hasToken && hasRepo ? ' on' : ' off');
  dom.ghStatusText.textContent = hasToken && hasRepo
    ? `Connected to ${cfg.repo}`
    : 'Not connected';
}

function handleSettingsSubmit(e) {
  e.preventDefault();
  cfg.token = dom.tokenInput.value.trim();
  cfg.repo  = dom.repoInput.value.trim();
  updateGhStatus();
  closeModal(dom.settingsModal);
  showToast('Settings saved', 'success');
}

// ── Toast Notifications ───────────────────────────────────
function showToast(msg, type = 'info', duration = 3500) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  dom.toastContainer.appendChild(el);

  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 200);
  }, duration);
}

// ── Init ──────────────────────────────────────────────────
function setCurrentDate() {
  const now = new Date();
  dom.currentDate.textContent = `${DAY_NAMES[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;
}

function setupEntryForm() {
  // Default date to today
  $('#entryDate', dom.entryForm).value = todayStr();
}

function bindEvents() {
  // Entry modal
  dom.addEntryBtn.addEventListener('click', () => { setupEntryForm(); openModal(dom.entryModal); });
  dom.closeEntryModal.addEventListener('click', () => closeModal(dom.entryModal));
  dom.cancelEntryBtn.addEventListener('click', () => closeModal(dom.entryModal));
  dom.entryForm.addEventListener('submit', handleFormSubmit);
  dom.entryModal.addEventListener('click', (e) => { if (e.target === dom.entryModal) closeModal(dom.entryModal); });

  // Settings modal
  dom.settingsBtn.addEventListener('click', () => { loadSettingsForm(); openModal(dom.settingsModal); });
  dom.closeSettings.addEventListener('click', () => closeModal(dom.settingsModal));
  dom.cancelSettings.addEventListener('click', () => closeModal(dom.settingsModal));
  dom.settingsForm.addEventListener('submit', handleSettingsSubmit);
  dom.settingsModal.addEventListener('click', (e) => { if (e.target === dom.settingsModal) closeModal(dom.settingsModal); });

  // Close modals on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal(dom.entryModal);
      closeModal(dom.settingsModal);
    }
  });
}

async function init() {
  cacheDom();
  setCurrentDate();
  bindEvents();

  try {
    state.entries = await fetchData();
    render();
  } catch (err) {
    console.error(err);
    dom.main.innerHTML = `
      <div class="error-state">
        <span class="icon">&#9888;</span>
        <p>Unable to load your health data.</p>
        <button class="btn btn-secondary btn-sm" onclick="location.reload()">Try again</button>
      </div>`;
    dom.footer.hidden = false;
  }
}

document.addEventListener('DOMContentLoaded', init);
