# Productivity App

React + TypeScript personal productivity app built with Feature-Sliced Design. Combines a calendar with time blocks, task management, habit tracking, budgeting, and a FIRE capital planner.

## Links

- Backend: [productivity-backend](https://github.com/seryegas/productivity-backend) — Express + MongoDB API (required for the app to work)

## Tech Stack

- React 19, TypeScript 5.9, Vite 7
- Feature-Sliced Design (FSD) architecture
- Docker for production and development environments

## Installation & Running

### Requirements

- Docker installed

### Production

```bash
git clone https://github.com/seryegas/calendar.git
cd calendar
cp .env.prod .env
docker-compose up
```

### Development

```bash
cp .env.dev .env
docker-compose -f docker-compose-dev.yml --env-file .env.dev up
```

Dev server runs on `0.0.0.0:5173` with hot reload and volume mount.

### Local (without Docker)

```bash
npm install
npm run dev       # Vite dev server
npm run build     # TypeScript compile + Vite build
npm run lint      # ESLint
npm run preview   # Preview production build
```

### Environment Variables

| Variable | Description |
|---|---|
| `VITE_HOST` | Backend API host |
| `VITE_PORT` | Backend API port |
| `VITE_API_PART` | API path prefix |
| `FRONTEND_PORT` | Frontend container port |
| `FRONTEND_PORT_EXTERNAL` | Frontend external port (dev only) |

Ports must be available and match the backend `.env` configuration.

## Architecture

```
src/
├── app/          — Entry point, providers (CalendarProvider), config, global types
├── pages/        — Main page layout, section router
├── widgets/      — Calendar grids, header/navigation
├── features/     — Feature modules (see below)
├── entities/     — (reserved)
└── shared/       — Shared UI (TrendChart) and libs (date utilities)
```

The app renders one section at a time. The active section (`AppSection`) is held in `CalendarProvider` and routed by `MainPage`:
`dashboard` (default) · `calendar` · `tasks` · `tracker` · `budget` · `capital`.

### Feature Modules (`src/features/`)

| Module | Description |
|---|---|
| `TimeBlock` | Time block CRUD, drag move/resize, layout engine, context menu |
| `Calendar` | Calendar navigation (week/day views, period switching) |
| `Tasks` | Task list with subtasks |
| `HabitTracker` | Habit tracking |
| `Budget` | Transactions, categories, CSV import, list/add modals |
| `Capital` | FIRE planner — capital timeline, adjustments, projections |
| `Dashboard` | Overview landing section |
| `current-time-indicator` | Live current-time red line |

Each feature follows the FSD layering: `model/` (types, logic), `ui/` (components), `storage/` or `api/` (data access), `lib/` (calculations).

### Key Patterns

- **Repository Pattern** — `TimeBlockRepository` interface with `ApiRepository` implementation
- **Controller Hook** — `useTimeBlocksController` manages state and CRUD operations
- **Context Provider** — `CalendarProvider` for global view/section state with localStorage persistence
- **Custom Drag Hooks** — `useDragMove`, `useDragResize` with 15-minute snapping
- **Layout Engine** — `calculateDayLayout` handles overlapping block positioning
- **FIRE Projection** — `projectFire` computes financial-independence timeline from history/assumptions (`features/Capital/model/fire.ts`)

## Features

- [x] Week & day calendar views with time columns
- [x] Time block CRUD, drag to move/resize (15-min snap), context menu (edit, copy, delete, color picker)
- [x] Click on empty space to create block
- [x] Current time indicator (live red line)
- [x] Period navigation (prev/next, "Today"), view & scroll persistence (localStorage)
- [x] Task list with subtasks
- [x] Habit tracker
- [x] Budget: transactions, categories, CSV import
- [x] Capital / FIRE planner: timeline, adjustments, projections, trend charts
- [x] Dashboard overview

## Planned

- [ ] Month view
- [ ] Year view
- [ ] Tests
