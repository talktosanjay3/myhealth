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
 * Must match the logic in update-activities.js.
 */
function nameToSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// --- Parse the issue body ---

const lines = body.split('\n').map(l => l.trim()).filter(Boolean);

// Find the Date
const dateLine = lines.find(l => /^date:/i.test(l));
if (!dateLine) {
  console.error('No "Date:" field found in issue body.');
  process.exit(1);
}
const entryDate = dateLine.replace(/^date:\s*/i, '').trim();
// Basic date validation
if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
  console.error(`Invalid date format: "${entryDate}". Expected YYYY-MM-DD.`);
  process.exit(1);
}

// Parse completion lines: "Activity Name: yes/no"
const completions = {};
for (const line of lines) {
  const match = line.match(/^(.+?):\s*(yes|no|y|n|true|false|1|0)\s*$/i);
  if (match && !/^date:/i.test(line)) {
    const name = match[1].trim();
    const value = match[2].toLowerCase();
    const completed = ['yes', 'y', 'true', '1'].includes(value);
    const slug = nameToSlug(name);
    completions[slug] = completed;
  }
}

if (Object.keys(completions).length === 0) {
  console.error('No completion entries found in issue body.');
  process.exit(1);
}

console.log(`Parsed entry for ${entryDate} with ${Object.keys(completions).length} completions.`);

// --- Load activities to validate slugs ---

const activitiesPath = path.join(__dirname, '..', 'data', 'activities.json');
let allSlugs = [];
try {
  const activitiesData = JSON.parse(fs.readFileSync(activitiesPath, 'utf8'));
  allSlugs = activitiesData.activities.map(a => a.slug);
} catch {
  console.warn('Could not read activities.json — skipping slug validation.');
}

// Warn about unknown slugs, but still save them
for (const slug of Object.keys(completions)) {
  if (!allSlugs.includes(slug)) {
    console.warn(`Unknown activity slug: "${slug}". Entry will still be saved.`);
  }
}

// --- Update events.json ---

const eventsPath = path.join(__dirname, '..', 'data', 'events.json');
const eventsData = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));

const existing = eventsData.events.find(e => e.date === entryDate);
if (existing) {
  // Merge completions
  Object.assign(existing.completions, completions);
  console.log(`Updated existing event for ${entryDate}.`);
} else {
  eventsData.events.push({
    date: entryDate,
    completions,
  });
  console.log(`Added new event for ${entryDate}.`);
}

// Sort by date descending (newest first)
eventsData.events.sort((a, b) => b.date.localeCompare(a.date));

fs.writeFileSync(eventsPath, JSON.stringify(eventsData, null, 2) + '\n', 'utf8');
console.log(`Saved ${eventsData.events.length} events to ${eventsPath}`);
