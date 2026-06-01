# myhealth

A minimal, classy personal health tracking dashboard. Log your daily wellness metrics and watch your consistency grow.

Deployed via **GitHub Pages** with data persistence powered by **GitHub Issues + Actions**.

## Features

- **Clean dashboard** — Streak counter, consistency score, goal tracking, and 14-day trend chart
- **Inline data entry** — Click "+ New Entry" to log daily health data directly from the dashboard
- **GitHub-backed persistence** — Entries are saved via GitHub Issues, processed by an Action, and committed to `data/checklist.json`
- **Local fallback** — Without GitHub config, entries are saved locally so you can still use the UI
- **Dark green accent** — Calm, natural aesthetic

## Quick Start

1. Push this repository to GitHub.
2. Enable **GitHub Pages** from the `main` branch (root folder).
3. Visit your site — sample data is included to show the dashboard in action.

### Adding Data

**Option A — Inline form (recommended):**
Click "+ New Entry" on the dashboard, fill in your metrics, and save.
- With GitHub configured: entries are synced to your repo automatically.
- Without GitHub: entries are saved locally in your browser.

**Option B — GitHub Issue:**
Open a new issue with the `Daily health entry` template. The GitHub Action will parse it and update the data.

### GitHub Sync Setup

To save entries from the dashboard directly to your repo:

1. Create a [GitHub fine-grained personal access token](https://github.com/settings/tokens?type=beta) with **Issues: Write** permission for this repository.
2. Click the settings gear (&#9881;) on the dashboard.
3. Paste your token and enter your repo as `owner/repo`.
4. Entries will now create GitHub Issues that auto-update your checklist.

## Data Model

Each daily entry contains:

| Field | Type | Target |
|---|---|---|
| Date | ISO date | — |
| Protein % | Number 0–100 | >= 80% |
| Water glasses | Number | >= 7 |
| Exercise minutes | Number | — |
| Sleep hours | Number | >= 7 |
| General health | Boolean | true |
| Notes | Text | — |

Data is stored in `data/checklist.json` as a JSON array of entries.

## Project Structure

```
.github/
  ISSUE_TEMPLATE/daily-entry.md   — Issue template
  workflows/update-checklist.yml  — GitHub Action (parses issues → updates data)
data/
  checklist.json                  — Data store
scripts/
  update-checklist.js             — CI script (runs in GitHub Actions)
index.html                        — Dashboard HTML
styles.css                        — Dashboard styles
script.js                         — Dashboard logic + data entry form
README.md                         — This file
```

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS, no build step
- **Charting:** Chart.js 4.4 (CDN)
- **Backend:** GitHub Actions (Node.js 20)
- **Hosting:** GitHub Pages

## Customization

Want to adjust targets, add metrics, or change the design? The code is intentionally simple — all targets (protein >= 80%, water >= 7 glasses, etc.) are defined in `script.js` and easy to modify.
