const fs = require('fs');
const path = require('path');

const eventPath = process.argv[2] || process.env.GITHUB_EVENT_PATH;
if (!eventPath) {
  console.error('Missing GITHUB_EVENT_PATH argument.');
  process.exit(1);
}

const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
const body = event.issue ? event.issue.body || '' : '';

/**
 * Convert an activity name to a URL-safe slug.
 * "Exercise 30 min" -> "exercise-30-min"
 */
function nameToSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Get today's date as YYYY-MM-DD.
 */
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

// --- Load events to check history ---

const eventsPath = path.join(__dirname, '..', 'data', 'events.json');
let eventsData;
try {
  eventsData = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
} catch {
  eventsData = { events: [] };
}

/**
 * Check if any historical event references this slug.
 */
function slugHasHistory(slug) {
  return eventsData.events.some(e => e.completions && e.completions[slug] !== undefined);
}

// --- Update activities.json ---

const activitiesPath = path.join(__dirname, '..', 'data', 'activities.json');
const data = JSON.parse(fs.readFileSync(activitiesPath, 'utf8'));

const now = todayStr();

for (const name of adds) {
  const slug = nameToSlug(name);
  const existing = data.activities.find(a => a.slug === slug);

  if (existing) {
    if (existing.deletedAt) {
      existing.deletedAt = null;
      console.log(`Restored activity: "${name}" (${slug})`);
    } else {
      console.log(`Activity already exists: "${name}" (${slug}) — skipped`);
    }
  } else {
    data.activities.push({
      slug,
      name,
      createdAt: now,
      deletedAt: null,
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

  if (data.activities[idx].deletedAt) {
    console.log(`Activity already deleted: "${name}" (${slug}) — skipped`);
    continue;
  }

  // If the slug has historical events, soft-delete. Otherwise, remove entirely.
  if (slugHasHistory(slug)) {
    data.activities[idx].deletedAt = now;
    console.log(`Soft-deleted activity (has history): "${name}" (${slug})`);
  } else {
    data.activities.splice(idx, 1);
    console.log(`Removed activity (no history): "${name}" (${slug})`);
  }
}

data.activities.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.slug.localeCompare(b.slug));
fs.writeFileSync(activitiesPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`\nSaved ${data.activities.length} activities to ${activitiesPath}`);
