# Dumala Architecture

Updated: 2026-06-14

## Overview

Dumala is a React single-page application served through a lightweight Express wrapper. The visible implementation is strongly client-side and local-first: most product behavior, state management, and persistence live in the browser rather than on the server.

The app is designed around one active team workspace in one browser context. That design choice simplifies setup but also defines the current scale limit of the product.

> **MVP testing architecture:** The current reliance on browser `localStorage` and the absence of an authentication layer are deliberate architectural choices for the MVP testing phase. These will be replaced with a proper backend database and authentication system in production. The architecture described below reflects the current testing state, not the final production design.

## Tech stack

| Layer | Technology | Notes |
| --- | --- | --- |
| Frontend runtime | React 19 | Main application framework |
| Language | TypeScript | Used across app and server files |
| Build tool | Vite | Dev server and frontend bundling |
| Styling | Tailwind CSS v4 via Vite plugin | Utility-first styling approach |
| Motion and transitions | `motion` / `framer-motion` | View and modal animations |
| Charts | Recharts | Dashboard and comparison visualizations |
| Icons | Lucide React | UI iconography (26+ icons used across drill cards and UI) |
| Server wrapper | Express | Serves Vite middleware in dev and static assets in production |
| Node runtime tooling | `tsx`, `esbuild` | Development and server bundling |

## Runtime model

### Frontend boot flow

- `index.html` mounts the app on the `root` element.
- `src/main.tsx` renders `App` inside `StrictMode`.
- `src/App.tsx` owns the top-level application shell and most cross-feature state.

### Server boot flow

- `server.ts` creates an Express app.
- In development, it starts Vite in middleware mode and uses Vite to serve the SPA.
- In production, it serves the built frontend from `dist/` and falls back to `dist/index.html` for all routes.

This means the server is currently a delivery wrapper, not a business-logic backend for most product features.

## Frontend structure

### Main composition

`src/App.tsx` coordinates:
- onboarding status
- current navigation tab
- team info
- players
- games
- standings
- announcements
- selected player modal state
- mobile menu state

This file also handles:
- local persistence synchronization
- onboarding completion logic
- match result cascade logic
- app-wide reset behavior
- backup export

### Feature modules

| File | Responsibility |
| --- | --- |
| `src/components/OnboardingView.tsx` | Team and manager setup flow |
| `src/components/DashboardView.tsx` | Summary dashboard, team identity, trends, quick actions, Squad Summary table |
| `src/components/RosterView.tsx` | Roster and staff management, backup export, compare entry point |
| `src/components/PlayerProfileModal.tsx` | Player detail editing and progression chart |
| `src/components/PlayerComparer.tsx` | Side-by-side radar comparison and tactical summary |
| `src/components/ScheduleView.tsx` | Event scheduling, calendar, result logging, Match Availability Tracker, Upcoming Opponent Intel, Coach's Notes |
| `src/components/StandingsView.tsx` | League table, snapshots, manual updates, Discipline & Match Awards panels, MVP history |
| `src/components/AnnouncementsView.tsx` | Club notice creation and deletion |
| `src/components/TacticsView.tsx` | Tactical board, formation logic, lineup persistence |
| `src/components/TrainingView.tsx` | 52-drill library with position-specific sets, How-To guides, weekly schedule with 9 presets, match badges, player development |

## State management approach

The app uses local React state rather than a dedicated state management library. The main data collections are held in `App.tsx`, while feature components own their own UI state and some feature-local persistent state.

### Characteristics of the current state model

1. Top-level domain state is centralized in `App.tsx`.
2. State mutations are passed down as callback props.
3. Feature components persist additional local concerns directly to `localStorage`.
4. There is no global normalized store, query cache, reducer-based domain layer, or server-state layer.

### Practical consequences

Benefits:
- Simple to understand for a small app.
- Fast to bootstrap without backend dependencies.
- Easy to keep major domain objects in one place.

Costs:
- `App.tsx` becomes a high-responsibility file.
- Cross-feature rules are spread across components.
- Data ownership boundaries are less explicit than they would be in a dedicated domain store.

## Persistence model

Browser `localStorage` is the main persistence layer for the MVP testing phase. A backend database with user authentication will replace this in production.

### Core persisted objects

- `stack_team_info`
- `stack_team_players`
- `stack_team_games`
- `stack_team_standings`
- `stack_team_announcements`
- `stack_team_onboarded`

### Feature-local persisted objects

- standings backups and Sunday backup preference
- tactics lineup, notes, dragged positions, and draw paths
- match format, formation, coach metadata, and set-piece roles
- weekly training schedule (`squad_weekly_schedule`)
- weekly training schedule history (`squad_weekly_schedule_history`)
- match availability (`squad_availability`)
- coach's notes (`squad_coach_notes`)

### Backup behavior
- Full data export exists through the roster flow as a JSON file.
- Standings snapshots exist separately inside the standings workflow.
- Training schedule history enables Last Week restore via preset.

### Constraints
1. Data is tied to one browser unless exported (accepted for MVP testing; backend storage planned for production).
2. Storage size limits apply, especially when images and extended drill data are stored.
3. Clearing browser storage can remove operational history.

## Domain model

The main domain types are defined in `src/types.ts`.

| Type | Role in system |
| --- | --- |
| `TeamInfo` | Club identity metadata |
| `Player` | Unified record for both players and staff. Includes `offenses?: PlayerOffense[]` and `mvpHistory?: MvpAwardRecord[]` |
| `PlayerOffense` | Card/discipline record with date, cardType, reason, opponent, matchMinute |
| `MvpAwardRecord` | Man of the Match award with date, opponent, note |
| `Game` | Match or scheduled event record |
| `Standing` | One row in the league table |
| `Announcement` | Club notice content |

### Modeling note

`Player` currently acts as both athlete and staff entity, with role differences inferred from `position` and `isStaffPosition()`. The recent addition of `PlayerOffense[]` and `MvpAwardRecord[]` extends the Player model with trackable event history for discipline and awards.

## Important business logic

### Match result cascade

The most important domain rule currently lives in `App.tsx` through `handleRecordResult`.

That flow:
1. Marks a game as completed.
2. Adds goals, MVPs, and clean-sheet related counts to players.
3. Updates the user team standings row.
4. Updates the opponent row if the opponent exists in the standings table.

### Training sync to schedule

`TrainingView.tsx` converts weekly scheduled drills into `Game` entries of type `Training`. That makes training a first-class calendar event without requiring a separate calendar subsystem.

### Discipline and MVP workflows

In `StandingsView.tsx`:
- `handleLogOffense` appends `PlayerOffense` records and increments card counts.
- `handleAwardMVP` appends `MvpAwardRecord` entries and increments `mvpAwards`.
- Both are reflected immediately in the Dashboard Squad Summary table.

### Schedule intelligence

In `ScheduleView.tsx`:
- Match Availability Tracker reads/writes `squad_availability` per game + player.
- Upcoming Opponent Intel cross-references `standings` and completed games for H2H.
- Coach's Notes reads/writes `squad_coach_notes` per game ID.

### Training presets

`TrainingView.tsx` `handleLoadTemplate` supports 9 modes. `Last Week` reads from `squad_weekly_schedule_history` to restore the previous schedule. History is archived on every schedule change.

### Tactics board persistence

`TacticsView.tsx` stores lineup assignments, field placements, notes, and draw paths locally. The feature behaves like a self-contained tactical workspace with its own persistent state.

## Build and delivery

### Development
- `npm run dev` starts Vite on port 3000
- `runserver.bat` provides a double-clickable Windows launcher

### Production
- `npm run build` writes static assets to `dist/`
- Vercel serves `dist/` from its global static network
- Traditional hosts can serve the contents of `dist/` without Node.js

### Validation
- `npm run lint` runs `tsc --noEmit`
- This validation passes consistently, confirmed across all recent feature additions

## Repository structure

### Observed structure
- Root application with active source files
- Built output in `dist/`
- No duplicate app copies (resolved)

## Scalability and maintainability concerns

1. `App.tsx` carries too much application responsibility.
2. Feature persistence is spread across many components and `localStorage` keys (now 10+ keys).
3. There is no server-backed source of truth for shared or durable operations.
4. Domain events are implied by UI actions rather than captured explicitly in a durable event model.
5. Some visual analytics are derived from current aggregates rather than historical logs.
6. Remote image dependencies can fail independently of the local product state.
7. `MvpAwardRecord` and `PlayerOffense` are embedded in the Player model rather than being independent event-sourced entities.

## Recommended next technical steps

1. (Done) Remove duplicate app copy.
2. Extract core domain logic from `App.tsx` into a clearer state or service layer.
3. Define a persistence strategy for eventual shared or durable data.
4. Add stronger runtime validation around imported, restored, or persisted local data.
5. Consider extracting event history (offences, MVP awards) into an independent event log or audit store.
