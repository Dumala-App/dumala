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
| Runtime validation | Zod |
| Persistence | Typed browser `localStorage` service |
| Unit testing | Vitest |
| Installation | Standards-based web app manifest with platform install guidance |
| Hosting | Static Vercel deployment or traditional static hosting |

## 3. Runtime flow

1. `index.html` loads `src/main.tsx`.
2. `src/main.tsx` mounts `App` in React Strict Mode.
3. `App.tsx` restores core collections through validated persistence schemas.
4. Onboarding renders when no valid team workspace exists.
5. The app shell renders one of five primary areas and their nested tabs.
6. React effects persist core collections through the typed storage service.
7. Feature modules use the same service for their additional local state.
8. Invalid stored data falls back safely and raises a non-blocking section-specific recovery warning.

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

1. validates whole-number scores, active athlete references, scorer totals, and MVP selection
2. removes any contribution from the previously saved result
3. saves the completed score, scorer IDs, MVP, and notes
4. applies appearances, goals, MVP credit, and defender/goalkeeper clean sheets exactly once
5. updates both League standings rows and re-sorts the table
6. reverses the same contribution if a completed match is deleted

Cup and Friendly results affect player match totals but do not alter League standings. Training sessions and meetings cannot receive match results. Manual assists, minutes, cards, and standalone MVP history are preserved.

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

### Dialog accessibility

Release-critical dialogs use a shared focus-management hook. Opening a dialog moves focus inside it, Tab and Shift+Tab remain contained, Escape closes it, and focus returns to the invoking control. Global `focus-visible` styling and reduced-motion CSS apply across the application.

## 9. Backup format

Full Workspace V2 uses the `dumala-workspace` format and includes:

- team information, players, games, standings, bulletins, and assessments
- availability and coach notes
- weekly training schedules and history
- standings snapshots and preferences
- tactics formation, lineup, roles, notes, custom positions, drawings, and player extras
- export timestamp and numeric format version

Import continues to accept legacy versions `1.0.0` and `1.1.0`. Legacy files are migrated into V2 before validation. Restore validates the complete nested workspace before writing, creates an automatic pre-restore backup, and rolls back all writes if storage fails.

## 10. Build and deployment

### Development

`npm run dev` starts Vite on port 3000. `runserver.bat` provides a Windows launcher.

### Production

`npm run build` generates `dist/`. Vercel configuration is stored in `vercel.json`.

### Continuous integration

`.github/workflows/quality-gate.yml` runs on pull requests, pushes to `main`, and manual dispatches. The Ubuntu and Node.js 22 validation job:

1. installs the locked dependency graph with `npm ci`
2. validates TypeScript
3. runs the Vitest suite
4. performs a clean production build
5. verifies generated service-worker and offline-cache policy
6. retains the generated `dist/` artifact for seven days

The workflow has read-only repository permissions, cancels superseded runs on the same branch, and applies a 15-minute timeout.

The `main` branch is protected in the private `Dumala-App/dumala` repository. All changes must arrive through a pull request, the **TypeScript, tests, build, and PWA** check must pass, and the pull-request branch must be current with `main`. Administrators cannot bypass these requirements. Force pushes and branch deletion are disabled.

After validation succeeds on a push to `main`, the dependent **Deploy validated main to Vercel** job rebuilds the same merged revision with the pinned Vercel CLI and deploys its prebuilt output to production. The job uses the GitHub `production` environment and its encrypted `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` secrets. Pull-request jobs cannot access those credentials and never deploy production. The direct Vercel Git connection remains disabled because the private repository belongs to a GitHub organization on the Vercel Hobby plan.

The Vercel token is a dedicated deployment credential and must be rotated before expiration or immediately after suspected exposure. Rotation requires replacing only the `VERCEL_TOKEN` environment secret; IDs and application code do not change.

### Metadata and offline shell

`index.html` includes Dumala description, Open Graph metadata, favicon, Apple touch icon, mobile application metadata, and the web app manifest. Chromium browsers use the native install prompt when available. iPhone and iPad users receive Safari Add to Home Screen instructions.

`vite-plugin-pwa` generates the production service worker and Workbox precache manifest. Registration is disabled during normal Vite development. Production builds use:

- precache for HTML, generated JavaScript and CSS, the manifest, icons, logos, and local placeholders
- network-first navigation with a precached app-shell fallback
- cache-first same-origin images with expiration limits
- precached local DM Sans and Manrope variable fonts
- a small runtime cache for Unsplash images
- network-only handling for feedback, Vercel telemetry, and future `/api`, `/auth`, and `/oauth` routes

Updates use a waiting-worker flow. A downloaded release does not interrupt the current session; the shared PWA lifecycle UI offers **Update now** or **Later**. Accepting the update activates the waiting worker and reloads once. Obsolete Workbox caches are removed after successful worker activation.

The service-worker cache contains deployable application files only. Browser `localStorage`, exported backups, authentication tokens, uploaded workspace records, and future private API responses remain outside it.

DM Sans and Manrope are stored as Latin variable WOFF2 files under `public/fonts/`, preloaded by `index.html`, and precached by Workbox. Their SIL Open Font License files are retained beside each font asset. After registration, the PWA lifecycle removes the two obsolete Google Fonts runtime caches created by earlier releases.

## 11. Technical risks

1. `App.tsx` owns too many domain and integration responsibilities.
2. Persistence still spans many browser keys even though key ownership, validation, and access are centralized.
3. Deferred views are precached for offline use, but the roughly 4.2 MiB initial precache should be monitored as the product grows.
4. Persistence and backup tests exist, but match cascades, standings, FPRDS scoring, and UI workflows need broader coverage.
5. Public profiles and collaboration require a new identity, privacy, and authorization architecture.

## 12. Recommended engineering sequence

1. Extract result-cascade services from `App.tsx`.
2. Add unit tests for standings, results, and FPRDS scoring.
3. Add browser-level recovery and restore workflow tests.
4. Complete production-device cold-launch, refresh, and controlled-update testing.
5. Require the GitHub Actions quality check through branch protection.
6. Optimize responsive tablet interactions and monitor deferred-view chunk sizes as features grow.
7. Design cloud identity and synchronization before implementing collaboration or public profiles.
