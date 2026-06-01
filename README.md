# MyHealth Daily Tracker

A static GitHub Pages dashboard for your health checklist. Daily entries are recorded in `data/checklist.json` and updated automatically using GitHub Issues + Actions.

## How it works

- `index.html` displays your latest progress, metrics, and a trend chart.
- Use a GitHub issue with the daily entry template to log a new day.
- The action in `.github/workflows/update-checklist.yml` parses the issue and updates `data/checklist.json`.
- Once the workflow completes, refresh the site to see your latest entry.

## Deploy on GitHub Pages

1. Push this repository to GitHub.
2. In repository settings, enable GitHub Pages from the `main` branch and root folder.
3. Your site will be available at `https://<username>.github.io/<repo>/`.

## Use the issue template

Create a new issue with the `Daily health entry` template. Example issue body:

```text
Date: 2026-06-01
Protein %: 90
Water glasses: 8
Exercise minutes: 30
Sleep hours: 7.5
General health: yes
Notes: Good energy, protein goal met, stayed disciplined.
```

## Notes

- The action runs on issue creation and issue edit events.
- It updates or inserts the entry for the date in `data/checklist.json`.
- If your issue does not include valid fields, the workflow will fail and report the issue.

## Customization

If you want, I can also add:

- a settings panel for your exact targets,
- a GitHub Pages button and repository link inside the site,
- additional metrics like weekly weight and calorie tracking.
