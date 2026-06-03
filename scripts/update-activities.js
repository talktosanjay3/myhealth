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
const adds = [];        // { name, level }
const removes = [];

for (const line of lines) {
  const addMatch = line.match(/^add:\s*(.+?)(?:\s*\|\s*level:\s*(\d+))?\s*$/i);
  const removeMatch = line.match(/^remove:\s*(.+)$/i);
  if (addMatch) {
    adds.push({
      name: addMatch[1].trim(),
      level: addMatch[2] ? parseInt(addMatch[2], 10) : 3
    });
  }
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

for (const add of adds) {
  const slug = nameToSlug(add.name);
  const existing = data.activities.find(a => a.slug === slug);

  if (existing) {
    console.log(`Activity already exists: "${add.name}" (${slug}) — skipped`);
  } else {
    data.activities.push({
      slug,
      name: add.name,
      level: add.level,
      createdAt: now,
    });
    console.log(`Added activity: "${add.name}" (${slug}) level:${add.level}`);
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
