# Dumala Architecture

Updated: 2026-06-21

## 1. System overview

Dumala is a static React 19 single-page application built with Vite and TypeScript. There is no application server or business API in the current beta. Vercel or any static host serves the generated `dist/` files.

The browser owns application state, business interactions, and persistence. The architecture supports fast MVP iteration but limits collaboration, cross-device access, and durable recovery.

## 2. Technology stack

| Layer | Technology |
| --- | --- |
| UI runtime | React 19 |
| Language | TypeScript 5.8 |
| Build and development | Vite 6 |
| Styling | Tailwind CSS 4 through `@tailwindcss/vite` |
| Animation | Motion / Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Persistence | Browser `localStorage` |
| Hosting | Static Vercel deployment or traditional static hosting |

## 3. Runtime flow

1. `index.html` loads `src/main.tsx`.
2. `src/main.tsx` mounts `App` in React Strict Mode.
3. `App.tsx` restores core collections from `localStorage`.
4. Onboarding renders when no valid team workspace exists.
5. The app shell renders one of five primary areas and their nested tabs.
6. React effects persist core collections after state changes.
7. Feature modules persist additional local state under their own keys.

## 4. Frontend composition

### Application shell

`src/App.tsx` owns:

- onboarding state
- primary and nested navigation
- team information
- players and staff
- games
- standings
- bulletins
- assessments
- selected-player modal
- match-result cascade
- backup export/import
- reset and feedback dialogs

### Navigation hubs

| Hub | Nested views |
| --- | --- |
| `HomeHubView` | Overview, Game Week |
| `DevelopmentHubView` | Training, Assessments |
| `LeagueUpdatesHubView` | League, Bulletins, Updates |

Squad and Tactics render directly as primary views.

### Major feature modules

| Module | Responsibility |
| --- | --- |
| `DashboardView` | Club overview, rank, summaries, FPRDS snapshot, navigation shortcuts |
| `ScheduleView` | Calendar, events, result logging, availability, opponent context, coach notes |
| `RosterView` | Player/staff creation, cards, search, comparison, backup entry points |
| `PlayerProfileModal` | Profile editing, traits, statistics, assessment summary, removal |
| `TacticsView` | Formation, position-aware lineup, board interaction, roles, notes |
| `TrainingView` | Drill library, guides, weekly planning, presets, calendar sync |
| `AssessmentsView` | FPRDS workflow, scoring preview, history, guides, development plans |
| `StandingsView` | League table, snapshots, discipline, MVP awards |
| `AnnouncementsView` | Team bulletins |
| `UpdatesView` | Product purpose, changelog, FPRDS explanation, roadmap |
| `FeedbackModal` | Structured feedback submission and email fallback |

## 5. FPRDS subsystem

The FPRDS implementation is split by responsibility:

| File | Responsibility |
| --- | --- |
| `fprds/benchmarks.ts` | Raw-result benchmark tables and score tiers |
| `fprds/weights.ts` | Role-specific attribute weighting and labels |
| `fprds/scoring.ts` | Validation, interpolation, attribute scores, OVR, deltas, player snapshots |
| `fprds/development.ts` | Four-week plan generation from weighted weaknesses |
| `fprds/drillGuide.ts` | Assessment drill instructions and safety guidance |

Assessment sessions retain raw results and derived scores so calculations remain inspectable.

## 6. State and persistence

### Core keys

- `stack_team_onboarded`
- `stack_team_info`
- `stack_team_players`
- `stack_team_games`
- `stack_team_standings`
- `stack_team_announcements`
- `stack_team_assessments`

### Standings keys

- `stack_team_standings_backups`
- `stack_team_sunday_backup_enabled`

### Schedule and training keys

- `squad_availability`
- `squad_coach_notes`
- `squad_weekly_schedule`
- `squad_weekly_schedule_history`

### Tactics keys

- `squad_match_format`
- `squad_formation`
- `squad_playstyle`
- `squad_is_custom_strategy`
- `squad_custom_playstyle_val`
- `squad_custom_defensive_val`
- `squad_custom_mentality_val`
- `squad_custom_strategy_notes`
- `squad_coach_level`
- `squad_custom_playstyles`
- `squad_captain_id`
- `squad_penalty_taker_id`
- `squad_free_kick_taker_id`
- `squad_corner_taker_id`
- `squad_defensive_style`
- `stack_squad_player_extras`
- `stack_squad_lineup`
- `stack_tactics_quick_notes`
- `stack_tactics_dragged_positions`
- `stack_tactics_draw_paths`

## 7. Domain model

`src/types.ts` contains the public frontend domain types.

- `Player` intentionally represents athletes and staff for the beta.
- `AssessmentSession` stores assessment inputs, outputs, labels, deltas, and plans.
- `PlayerOffense` and `MvpAwardRecord` are embedded histories on `Player`.
- `Game` represents matches, training sessions, and meetings.

The shared Player/staff model is expedient but should be revisited before permissions, public profiles, or coach credentials are implemented.

## 8. Important business rules

### Match result cascade

Recording a result:

1. completes the game
2. saves scores, scorers, MVP, and notes
3. increments player games and relevant totals
4. awards clean-sheet credit to defenders and goalkeepers
5. updates the user and matching opponent standings rows

### Assessment snapshot

Saving an assessment:

1. validates required raw data
2. derives benchmark scores
3. computes role-weighted OVR
4. compares with the previous role assessment
5. optionally creates a four-week plan
6. persists the session
7. applies the latest snapshot to the Player record

### Tactics auto-fill

Auto-fill keeps valid manual assignments, then fills empty formation slots by matching broad position groups before using remaining available players.

### Training synchronization

Weekly planned training creates or refreshes Training events in the shared games calendar.

## 9. Backup format

Backup version `1.1.0` contains:

- team information
- players
- games
- standings
- bulletins
- assessments
- export timestamp

Import also accepts version `1.0.0`, which may not contain assessments.

Feature-local tactics, availability, coach notes, and training schedule keys are not currently included in the full backup. This is a known recovery gap.

## 10. Build and deployment

### Development

`npm run dev` starts Vite on port 3000. `runserver.bat` provides a Windows launcher.

### Production

`npm run build` generates `dist/`. Vercel configuration is stored in `vercel.json`.

### Metadata

`index.html` includes Dumala description, Open Graph metadata, favicon, and Apple touch icon.

## 11. Technical risks

1. `App.tsx` owns too many domain and integration responsibilities.
2. Persistence is fragmented across many keys and components.
3. Several core collections parse stored JSON without complete runtime schema validation.
4. The current backup does not cover all feature-local data.
5. The main production bundle exceeds Vite's 500 kB warning threshold.
6. There is no automated test suite.
7. Public profiles and collaboration require a new identity, privacy, and authorization architecture.

## 12. Recommended engineering sequence

1. Add runtime validation and full backup coverage.
2. Extract persistence and result-cascade services from `App.tsx`.
3. Add unit tests for standings, results, scoring, and backup migration.
4. Add PWA caching and update lifecycle.
5. Optimize responsive tablet interactions and split large view bundles.
6. Design cloud identity and synchronization before implementing collaboration or public profiles.
