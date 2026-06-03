# myhealth

A daily health checklist that syncs to GitHub. Track your habits, see consistency trends, and keep your data alive in the repo.

## How it works

**Single-page app** — `index.html` with embedded CSS/JS. No framework, no build step, no server. Open it in any browser.

**Data in two JSON files:**

| File | What it holds |
|------|---------------|
| `data/activities.json` | Your checklist items (slug, name, created date) |
| `data/events.json` | Daily completions (date → { slug: true/false }) |

**GitHub-backed persistence:**

- App reads JSON from `raw.githubusercontent.com` on load
- Changes are tracked locally (optimistic UI) and submitted via **"Sync to GitHub"**
- Clicking Sync creates a GitHub Issue → triggers a workflow → commits the JSON → closes the issue
- A 6-minute countdown timer shows after sync (GitHub's raw CDN takes ~5 mins to reflect new commits)

## Features

- **Checklist** — check off daily health goals, add/remove items freely
- **Consistency stats** — overall %, current streak, today's progress ring
- **30-day trend chart** — see your consistency over time (Chart.js)
- **Monthly heatmap** — GitHub-style activity grid
- **Sync button** — orange banner shows pending changes, click to submit
- **Year-end countdown** — live ticker showing days remaining in the year

## Setup

1. Push this repo to GitHub
2. Open **Settings → Pages → Source** and select **"GitHub Actions"**
3. In the app, click the ⚙ icon and enter your repo (`owner/repo`) and a [fine-grained token](https://github.com/settings/tokens?type=beta) with **Issues: Write** permission
4. Start tracking!

## Workflows

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| `update-data.yml` | Issue created/edited with `activity-change` or `health-entry` label | Runs the matching Node script to update the JSON files, commits, and closes the issue |
| `deploy.yml` | Push to `main` that touches `index.html` | Deploys to GitHub Pages |

## File structure

```
├── index.html                       # The whole app (HTML + CSS + JS)
├── data/
│   ├── activities.json              # Checklist items
│   └── events.json                  # Daily completions
├── scripts/
│   ├── update-activities.js         # Adds/removes activities
│   └── update-events.js             # Records daily completions
├── .github/
│   ├── workflows/
│   │   ├── update-data.yml          # Processes sync issues
│   │   └── deploy.yml               # Pages deployment
│   └── ISSUE_TEMPLATE/
│       ├── activity-change.md       # Template for add/remove
│       └── daily-entry.md           # Template for completions
└── README.md
```
