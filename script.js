const chartColors = {
  protein: '#58a6ff',
  water: '#2ea043',
  sleep: '#d29922',
  health: '#8b949e'
};

function parseEntry(data) {
  return (data.entries || [])
    .map(entry => ({
      ...entry,
      date: new Date(entry.date),
      label: entry.date
    }))
    .filter(entry => !Number.isNaN(entry.date.getTime()))
    .sort((a, b) => a.date - b.date);
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function getStreak(entries) {
  let streak = 0;
  const sorted = [...entries].sort((a, b) => b.date - a.date);
  let previous = null;

  for (const entry of sorted) {
    if (!previous) {
      streak = 1;
      previous = entry.date;
      continue;
    }

    const diff = (previous - entry.date) / (1000 * 60 * 60 * 24);
    if (Math.round(diff) === 1) {
      streak += 1;
      previous = entry.date;
    } else {
      break;
    }
  }

  return streak;
}

function getLastNDays(entries, days = 14) {
  const latest = entries[entries.length - 1];
  if (!latest) return [];
  const cutoff = new Date(latest.date);
  cutoff.setDate(cutoff.getDate() - (days - 1));
  return entries.filter(entry => entry.date >= cutoff);
}

function getGoalScore(entry) {
  const hits = [
    entry.proteinPercent >= 80,
    entry.waterGlasses >= 7,
    entry.sleepHours >= 7,
    entry.generalHealth
  ].filter(Boolean).length;
  return Math.round((hits / 4) * 100);
}

function updateProgressBar(id, value) {
  const bar = document.getElementById(id);
  if (!bar) return;
  const fill = bar.querySelector('span');
  if (!fill) return;
  fill.style.width = `${Math.min(100, Math.max(0, value))}%`;
}

function victoryMessage(score) {
  if (score >= 90) return 'Excellent work — your routine is very strong right now.';
  if (score >= 70) return 'Good momentum. Keep the streak going.';
  if (score >= 50) return 'You are improving. Keep logging daily.';
  return 'Start with one more healthy habit today and build momentum.';
}

function renderStats(entries) {
  const latest = entries[entries.length - 1];
  const recent = getLastNDays(entries, 14);
  const daysRecorded = entries.length;
  const proteinScore = entries.filter(entry => entry.proteinPercent >= 80).length;
  const waterScore = entries.filter(entry => entry.waterGlasses >= 7).length;
  const sleepScore = entries.filter(entry => entry.sleepHours >= 7).length;
  const healthScore = entries.filter(entry => entry.generalHealth).length;
  const consistency = daysRecorded ? ((proteinScore + waterScore + sleepScore + healthScore) / (daysRecorded * 4)) * 100 : 0;

  document.getElementById('hero-title').textContent = latest ? `Latest entry: ${latest.label}` : 'No entries yet';
  document.getElementById('hero-text').textContent = latest
    ? `Your latest record shows ${latest.proteinPercent}% protein, ${latest.waterGlasses} glasses, ${latest.exerciseMinutes} min exercise, and a healthy general status.`
    : 'Use the issue template to add your first daily entry and see the dashboard populate.';

  document.getElementById('streak').textContent = getStreak(entries);
  document.getElementById('consistency').textContent = formatPercent(consistency);
  document.getElementById('progress').textContent = latest ? `${getGoalScore(latest)}%` : '0%';

  document.getElementById('latest-date').textContent = latest ? latest.label : '—';
  document.getElementById('latest-protein').textContent = latest ? `${latest.proteinPercent}%` : '—';
  document.getElementById('latest-water').textContent = latest ? `${latest.waterGlasses} glasses` : '—';
  document.getElementById('latest-exercise').textContent = latest ? `${latest.exerciseMinutes} min` : '—';
  document.getElementById('latest-sleep').textContent = latest ? `${latest.sleepHours} hrs` : '—';
  document.getElementById('latest-health').textContent = latest ? (latest.generalHealth ? 'Yes' : 'No') : '—';
  document.getElementById('latest-notes').textContent = latest ? latest.notes || 'No notes provided.' : '—';

  document.getElementById('days-recorded').textContent = daysRecorded;
  document.getElementById('protein-score').textContent = formatPercent(daysRecorded ? (proteinScore / daysRecorded) * 100 : 0);
  document.getElementById('water-score').textContent = formatPercent(daysRecorded ? (waterScore / daysRecorded) * 100 : 0);
  document.getElementById('sleep-score').textContent = formatPercent(daysRecorded ? (sleepScore / daysRecorded) * 100 : 0);
  document.getElementById('motivation-text').textContent = victoryMessage(consistency);

  updateProgressBar('protein-bar', latest ? latest.proteinPercent : 0);
  updateProgressBar('water-bar', latest ? Math.min(100, latest.waterGlasses * 12) : 0);
  updateProgressBar('sleep-bar', latest ? Math.min(100, (latest.sleepHours / 8) * 100) : 0);
  updateProgressBar('health-bar', latest ? (latest.generalHealth ? 100 : 25) : 0);

  document.getElementById('today-protein').textContent = latest ? `${latest.proteinPercent}%` : '—';
  document.getElementById('today-water').textContent = latest ? `${latest.waterGlasses} glasses` : '—';
  document.getElementById('today-sleep').textContent = latest ? `${latest.sleepHours} hrs` : '—';
  document.getElementById('today-health').textContent = latest ? (latest.generalHealth ? 'Good' : 'Needs review') : '—';

  return recent;
}

function createChart(recentEntries) {
  const ctx = document.getElementById('healthChart');
  if (!ctx) return;

  const labels = recentEntries.map(entry => entry.label);
  const proteinData = recentEntries.map(entry => entry.proteinPercent);
  const waterData = recentEntries.map(entry => entry.waterGlasses);
  const sleepData = recentEntries.map(entry => entry.sleepHours);
  const healthScoreData = recentEntries.map(entry => getGoalScore(entry));

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Protein %',
          data: proteinData,
          borderColor: chartColors.protein,
          backgroundColor: 'rgba(88,166,255,0.18)',
          tension: 0.3,
          fill: true,
          pointRadius: 4
        },
        {
          label: 'Water glasses',
          data: waterData,
          borderColor: chartColors.water,
          backgroundColor: 'rgba(46,160,67,0.18)',
          tension: 0.3,
          fill: true,
          pointRadius: 4
        },
        {
          label: 'Sleep hours',
          data: sleepData,
          borderColor: chartColors.sleep,
          backgroundColor: 'rgba(210,153,34,0.18)',
          tension: 0.3,
          fill: true,
          pointRadius: 4
        },
        {
          label: 'Goal score',
          data: healthScoreData,
          borderColor: chartColors.health,
          backgroundColor: 'rgba(139,148,158,0.18)',
          tension: 0.3,
          fill: true,
          pointRadius: 4,
          borderDash: [6, 4]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          grid: { color: 'rgba(148,163,184,0.12)' },
          ticks: { color: '#c9d1d9' }
        },
        x: {
          grid: { color: 'rgba(148,163,184,0.08)' },
          ticks: { color: '#c9d1d9' }
        }
      },
      plugins: {
        legend: { labels: { color: '#c9d1d9' } },
        tooltip: { mode: 'index', intersect: false }
      }
    }
  });
}

async function init() {
  try {
    const response = await fetch('data/checklist.json');
    if (!response.ok) throw new Error('Unable to load checklist data.');
    const raw = await response.json();
    const entries = parseEntry(raw);
    const recent = renderStats(entries);
    createChart(recent);
  } catch (error) {
    document.getElementById('hero-text').textContent = 'Unable to load data. Make sure checklist.json exists and the site is deployed correctly.';
    console.error(error);
  }
}

init();
