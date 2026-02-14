# DueWise v1

DueWise is an offline-friendly, mobile-first planner that prioritizes tasks by comparing time remaining to estimated effort.

## Run locally

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173` in Safari/Chrome.

## Features

- Task model:
  - `id`
  - `title`
  - `dueDate` (ISO string)
  - `estimatedMinutes`
  - optional `importance` (1–3)
  - `completed`
- Full CRUD:
  - add/edit via bottom-sheet modal
  - delete task
  - toggle completion
- Smart prioritization and sorting by urgency buffer.
- “Work on Next” card highlights the highest-priority incomplete task.
- Light/Dark theme toggle persisted in localStorage.
- Premium empty state with CTA and **Add Sample Task** helper.
- Runtime debug overlay shows JS errors directly on screen.

## Storage

- Tasks: `duewise:v1:tasks`
- Theme: `duewise:v1:theme`

## Urgency rules

For each task:

- `timeLeftMinutes = dueDate - now`
- `buffer = timeLeftMinutes - estimatedMinutes`

Classification:

- `buffer < 0` → **Critical**
- `0–240` → **Urgent**
- `240–1440` → **Soon**
- `>1440` → **Safe**

## Reliability safeguards

- App bootstraps on `DOMContentLoaded`.
- Non-module script (`app.js`) for better iOS compatibility.
- If runtime errors occur, they appear in the top-right debug overlay.
- If bootstrap fails, fallback message is shown: `App failed to load—see debug panel.`
