const fs = require('fs');
const path = require('path');

const eventPath = process.argv[2] || process.env.GITHUB_EVENT_PATH;
if (!eventPath) {
  console.error('Missing GITHUB_EVENT_PATH argument.');
  process.exit(1);
}

const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
const issue = event.issue || {};
const body = issue.body || '';

function parseLine(label) {
  const regex = new RegExp(`^${label}:\\s*(.+)$`, 'mi');
  const match = body.match(regex);
  return match ? match[1].trim() : null;
}

function toBoolean(value) {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (['yes', 'y', 'true', '1', 'no', 'n', 'false', '0'].includes(normalized)) {
    return ['yes', 'y', 'true', '1'].includes(normalized);
  }
  return null;
}

const rawDate = parseLine('Date');
const date = rawDate ? new Date(rawDate) : new Date();
if (Number.isNaN(date.getTime())) {
  console.error('Invalid date:', rawDate);
  process.exit(1);
}

const parseNumber = value => {
  if (!value) return null;
  const normalized = value.replace(/[^0-9.]/g, '');
  return normalized ? Number(normalized) : null;
};

const entry = {
  date: date.toISOString().slice(0, 10),
  proteinPercent: parseNumber(parseLine('Protein %')) || parseNumber(parseLine('Protein Percentage')) || 0,
  waterGlasses: parseNumber(parseLine('Water glasses')) || 0,
  exerciseMinutes: parseNumber(parseLine('Exercise minutes')) || 0,
  sleepHours: parseNumber(parseLine('Sleep hours')) || 0,
  noMasturbation: (() => {
    const value = parseLine('Masturbation');
    const parsed = toBoolean(value);
    return parsed === null ? false : !parsed;
  })(),
  notes: parseLine('Notes') || ''
};

if (!entry.proteinPercent && !entry.waterGlasses && !entry.exerciseMinutes && !entry.sleepHours && !entry.notes) {
  console.error('No valid health values found in issue body. Use the daily entry template.');
  process.exit(1);
}

const filePath = path.join(__dirname, '..', 'data', 'checklist.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const existing = data.entries.find(item => item.date === entry.date);
if (existing) {
  Object.assign(existing, entry);
  console.log(`Updated entry for ${entry.date}`);
} else {
  data.entries.push(entry);
  console.log(`Added entry for ${entry.date}`);
}

data.entries.sort((a, b) => a.date.localeCompare(b.date));
fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
