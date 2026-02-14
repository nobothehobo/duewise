# DueWise v1

DueWise is a polished, mobile-first planner that helps you decide what to work on next by balancing **time remaining** against **estimated effort**.

## Setup

```bash
npm install
npm run dev
```

Then open the local Vite URL (typically `http://localhost:5173`).

## Features

- Mobile-first UI tuned for touch interactions on iPhone/iPad Safari.
- Add/edit tasks with:
  - title
  - due date + time
  - estimated minutes
  - optional importance (1–3)
  - completion state
- “What should I work on next?” spotlight card for the top unfinished task.
- Task list sorted by urgency.
- Local persistence via `localStorage` (no backend required).

## Urgency Calculation

For each task:

1. `timeLeftMinutes = dueDate - now`
2. `bufferMinutes = timeLeftMinutes - estimatedMinutes`
3. Urgency level:
   - `bufferMinutes < 0` → **critical**
   - `0 to 120` minutes → **urgent**
   - `> 120` minutes → **safe**

A weighted urgency score is then computed to sort tasks:

- lateness pressure (how far behind the buffer is)
- time pressure (approaching deadline)
- importance boost (1–3)
- completed tasks are deprioritized

## Architecture

```text
src/
  components/
    PriorityBadge.tsx
    TaskCard.tsx
    UrgencyRing.tsx
  hooks/
    useLocalStorage.ts
  types/
    task.ts
  utils/
    urgency.ts
  App.tsx
  main.tsx
  styles.css
```

### State Flow

- `App.tsx` stores all tasks in `useLocalStorage`.
- `sortTasksByUrgency()` computes urgency metadata and sorting.
- `TaskCard` renders each task and sends edit/complete actions back up.
- Form state is isolated in a `TaskDraft` model and reused for add/edit mode.
