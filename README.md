# Calendar App

React + TypeScript calendar frontend with time block management. Built with Feature-Sliced Design architecture.

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
├── app/          — Entry point, providers, config
├── pages/        — Page layouts
├── widgets/      — Calendar grids, header
├── features/     — TimeBlock, Calendar navigation, current time indicator
├── entities/     — (reserved)
└── shared/       — Date utilities
```

### Key Patterns

- **Repository Pattern** — `TimeBlockRepository` interface with `ApiRepository` implementation
- **Controller Hook** — `useTimeBlocksController` manages state and CRUD operations
- **Context Provider** — `CalendarProvider` for view state with localStorage persistence
- **Custom Drag Hooks** — `useDragMove`, `useDragResize` with 15-minute snapping
- **Layout Engine** — `calculateDayLayout` handles overlapping block positioning

## Features

- [x] Week view (7-day grid with time columns)
- [x] Day view (single day, full width)
- [x] Time block CRUD (create, read, update, delete)
- [x] Drag to move blocks (within and between days)
- [x] Drag to resize blocks (15-min snap)
- [x] Context menu (edit title, copy, delete, 12-color picker)
- [x] Click on empty space to create block
- [x] Current time indicator (live red line)
- [x] Period navigation (prev/next, "Today" button)
- [x] View & scroll position persistence (localStorage)

## Planned

- [ ] Month view
- [ ] Year view
- [ ] Tests
