const fs = require('fs');
const path = require('path');

const eventPath = process.argv[2] || process.env.GITHUB_EVENT_PATH;
if (!eventPath) {
  console.error('Missing GITHUB_EVENT_PATH argument.');
  process.exit(1);
}

const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
const body = event.issue ? event.issue.body || '' : '';

function nameToSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// --- Parse the issue body ---

const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
const adds = [];
const removes = [];

for (const line of lines) {
  const addMatch = line.match(/^add:\s*(.+)$/i);
  const removeMatch = line.match(/^remove:\s*(.+)$/i);
  if (addMatch) adds.push(addMatch[1].trim());
  if (removeMatch) removes.push(removeMatch[1].trim());
}

if (adds.length === 0 && removes.length === 0) {
  console.log('No activity changes found in issue body.');
  process.exit(0);
}

// --- Update activities.json ---

const activitiesPath = path.join(__dirname, '..', 'data', 'activities.json');
const data = JSON.parse(fs.readFileSync(activitiesPath, 'utf8'));

const now = todayStr();

for (const name of adds) {
  const slug = nameToSlug(name);
  const existing = data.activities.find(a => a.slug === slug);

  if (existing) {
    console.log(`Activity already exists: "${name}" (${slug}) — skipped`);
  } else {
    data.activities.push({
      slug,
      name,
      createdAt: now,
    });
    console.log(`Added activity: "${name}" (${slug})`);
  }
}

for (const name of removes) {
  const slug = nameToSlug(name);
  const idx = data.activities.findIndex(a => a.slug === slug);

  if (idx === -1) {
    console.log(`Activity not found: "${name}" — skipped`);
    continue;
  }

  data.activities.splice(idx, 1);
  console.log(`Removed activity: "${name}" (${slug})`);
}

data.activities.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.slug.localeCompare(b.slug));
fs.writeFileSync(activitiesPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`\nSaved ${data.activities.length} activities to ${activitiesPath}`);
