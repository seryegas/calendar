# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React + TypeScript calendar frontend with time block management. Requires a separate backend (https://github.com/seryegas/productivity-backend).

## Commands

```bash
npm run dev       # Start Vite dev server (0.0.0.0:5173)
npm run build     # TypeScript compile + Vite build
npm run lint      # ESLint
npm run preview   # Preview production build

# Docker
docker-compose up                         # Production
docker-compose -f docker-compose-dev.yml up  # Development with hot reload
```

## Architecture

**Feature-Sliced Design** structure:

- `src/app/` - Application core: entry point, providers, config, global types
- `src/pages/` - Page-level layouts
- `src/features/` - Isolated feature modules with their own model/ui/storage/api layers
- `src/widgets/` - Complex reusable components (calendar grids, header)
- `src/shared/` - Shared utilities (date helpers)

**Key Patterns:**

- **Repository Pattern**: `TimeBlockRepository` interface with `ApiRepository` implementation in `features/TimeBlock/storage/`
- **Controller Hook Pattern**: `useTimeBlocksController` manages state and interactions
- **Context Providers**: `CalendarProvider` for global view state with localStorage persistence
- **Custom Drag Hooks**: `useDragMove`, `useDragResize` with pixel-to-minute snapping

**TimeBlock Feature** (`src/features/TimeBlock/`):
- `api/` - Controller hooks
- `model/` - Types, drag logic, helpers
- `storage/` - API repository
- `ui/` - Components (TimeBlock, TimeBlockList, TimeBlockMenu)
- `lib/` - Layout calculations

## Tech Stack

- React 19, TypeScript 5.9, Vite 7
- Express backend (separate repo)
- Environment config via `.env` files (`.env.dev`, `.env.prod`)
