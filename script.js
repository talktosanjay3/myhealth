const chartColors = {
  protein: '#58a6ff',
  water: '#2ea043',
  sleep: '#d29922',
  habit: '#8b949e'
};

function parseEntry(data) {
  return data.entries
    .map(entry => ({
      ...entry,
      date: new Date(entry.date),
      label: entry.date
    }))
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

function victoryMessage(score) {
  if (score >= 85) return 'You are building powerful momentum. Keep this pace!';
  if (score >= 65) return 'Strong progress — consistency is your best habit.';
  if (score >= 45) return 'Good start. Focus on one more daily win.';
  return 'Small steps add up. Log today and keep the streak alive.';
}

function renderStats(entries) {
  const latest = entries[entries.length - 1];
  const recent = getLastNDays(entries, 7);
  const daysRecorded = entries.length;
  const proteinScore = entries.filter(entry => entry.proteinPercent >= 80).length;
  const waterScore = entries.filter(entry => entry.waterGlasses >= 7).length;
  const sleepScore = entries.filter(entry => entry.sleepHours >= 6).length;
  const consistency = daysRecorded ? ((proteinScore + waterScore + sleepScore) / (daysRecorded * 3)) * 100 : 0;
  const overallScore = daysRecorded ? ((proteinScore + waterScore + sleepScore + entries.filter(e => e.generalHealth).length) / (daysRecorded * 4)) * 100 : 0;

  document.getElementById('hero-title').textContent = latest ? `Latest entry: ${latest.label}` : 'No entries yet';
  document.getElementById('hero-text').textContent = latest
    ? `Your latest record shows ${latest.proteinPercent}% protein, ${latest.waterGlasses} glasses, ${latest.exerciseMinutes} min exercise, and general health ${latest.generalHealth ? 'tracked' : 'not tracked'}.`
    : 'Create a new issue entry to start tracking your progress.';
  document.getElementById('streak').textContent = getStreak(entries);
  document.getElementById('consistency').textContent = formatPercent(consistency);
  document.getElementById('progress').textContent = formatPercent(overallScore);

  document.getElementById('latest-date').textContent = latest ? latest.label : '—';
  document.getElementById('latest-protein').textContent = latest ? `${latest.proteinPercent}%` : '—';
  document.getElementById('latest-water').textContent = latest ? `${latest.waterGlasses} glasses` : '—';
  document.getElementById('latest-exercise').textContent = latest ? `${latest.exerciseMinutes} min` : '—';
  document.getElementById('latest-sleep').textContent = latest ? `${latest.sleepHours} hrs` : '—';
  document.getElementById('latest-health').textContent = latest ? (latest.generalHealth ? 'Yes' : 'No') : '—';

  document.getElementById('days-recorded').textContent = daysRecorded;
  document.getElementById('protein-score').textContent = formatPercent(daysRecorded ? (proteinScore / daysRecorded) * 100 : 0);
  document.getElementById('water-score').textContent = formatPercent(daysRecorded ? (waterScore / daysRecorded) * 100 : 0);
  document.getElementById('sleep-score').textContent = formatPercent(daysRecorded ? (sleepScore / daysRecorded) * 100 : 0);
  document.getElementById('motivation-text').textContent = victoryMessage(overallScore);

  return recent;
}

function createChart(recentEntries) {
  const ctx = document.getElementById('healthChart');
  if (!ctx) return;
  const labels = recentEntries.map(entry => entry.label);
  const proteinData = recentEntries.map(entry => entry.proteinPercent);
  const waterData = recentEntries.map(entry => entry.waterGlasses);
  const sleepData = recentEntries.map(entry => entry.sleepHours);
  const habitData = recentEntries.map(entry => (entry.generalHealth ? 100 : 20));

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Protein %',
          data: proteinData,
          borderColor: chartColors.protein,
          backgroundColor: 'rgba(88,166,255,0.16)',
          tension: 0.28,
          fill: true,
          pointRadius: 4
        },
        {
          label: 'Water glasses',
          data: waterData,
          borderColor: chartColors.water,
          backgroundColor: 'rgba(46,160,67,0.16)',
          tension: 0.28,
          fill: true,
          pointRadius: 4
        },
        {
          label: 'Sleep hours',
          data: sleepData,
          borderColor: chartColors.sleep,
          backgroundColor: 'rgba(210,153,34,0.16)',
          tension: 0.28,
          fill: true,
          pointRadius: 4
        },
        {
          label: 'General health signal',
          data: habitData,
          borderColor: chartColors.habit,
          backgroundColor: 'rgba(139,148,158,0.16)',
          tension: 0.28,
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
