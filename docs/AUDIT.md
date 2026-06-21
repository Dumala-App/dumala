# Dumala Codebase Audit

Updated: 2026-06-21

## Executive summary

Dumala is a substantial local-first football operations application, not a thin prototype. It now includes a broad club-management workflow and a dedicated FPRDS assessment subsystem. The strongest product qualities are feature continuity across the coaching week, useful football-specific presentation, and the ability to operate without backend infrastructure.

The main risks are architecture and reliability: state ownership is concentrated in `App.tsx`, persistence is spread across many `localStorage` keys, full backups omit some feature-local state, runtime validation is inconsistent, the bundle is large, and automated tests are absent.

## Current strengths

1. Five-area navigation organizes a large feature set more clearly.
2. Onboarding starts with clean standings and opens Overview.
3. Roster cards support position artwork, measurements, traits, profile editing, and removal.
4. League rank is derived from actual sorted standings.
5. Result logging connects schedule, player totals, and league state.
6. Tactics auto-fill matches players to broad position groups and preserves valid assignments.
7. Training includes 52 drills, practical guides, filters, presets, and calendar synchronization.
8. FPRDS stores raw measurements and derived outputs, enabling explainable assessment history.
9. Backup version 1.1 includes assessment sessions.
10. The project is a simple static Vite deployment with no environment variables.
11. Product updates contain a detailed AI-free roadmap.
12. Favicon, social metadata, feedback, and public beta messaging improve release polish.

## Architecture findings

### High: fragmented persistence

Core data is managed in `App.tsx`, while schedule, training, standings backups, and tactics manage their own keys. Reset clears everything, but export does not include every feature-local key.

Impact: a user can restore the main workspace while losing tactical layouts, availability, coach notes, and weekly training state.

### High: limited runtime validation

Some collections use guarded JSON parsing, while others directly parse stored values. Backup validation checks collection presence and version but does not validate nested entity shapes.

Impact: malformed or stale data can create inconsistent UI behavior or startup failures.

### High: no automated regression suite

The most important logic includes match cascades, standings, FPRDS interpolation, backup migration, and lineup assignment, but validation currently relies on TypeScript, builds, and manual browser checks.

Impact: changes to shared types or domain rules have a high regression cost.

### Medium: `App.tsx` responsibility concentration

The shell owns navigation, persistence, result processing, assessment updates, backups, reset, and modal orchestration.

Impact: unrelated changes can affect core flows and make tests harder to isolate.

### Medium: shared Player/staff model

Staff are represented as `Player` records and identified by position strings.

Impact: future coach qualifications, permissions, public profiles, and staff-specific privacy will strain the model.

### Medium: bundle size

The production JavaScript bundle is approximately 1.28 MB before gzip and triggers Vite's chunk-size warning.

Impact: slower first load, especially on mobile connections.

### Medium: unofficial coach-level field

Tactics currently stores a free-form `squad_coach_level` presentation value.

Impact: this must not be confused with future PFF/AFC qualifications. The roadmap correctly requires official credentials and Dumala progress to remain separate.

## Product findings

### FPRDS is already beta functionality

The Assessment Center supports role and age selection, Full/Quick assessments, benchmark conversion, OVR, history, deltas, guides, and development plans. Documentation must describe it as beta, not only future scope.

### Public profiles require backend identity

Personalized player and club links cannot safely build on browser-only state. They require accounts, durable IDs, publishing consent, authorization, and moderation/reporting controls.

### Offline mode is not complete

Local data operations already work after the page loads, but the app has no service worker or installable manifest. A fresh launch without network is not guaranteed.

## Documentation findings resolved by this update

- Removed obsolete Express architecture.
- Removed obsolete AI roadmap direction.
- Added the Assessment Center and navigation hubs.
- Documented backup version 1.1 and its coverage gap.
- Aligned roadmap phases with the in-app Roadmap Snapshot.
- Updated tasks with recent roster, tactics, updates, deployment, and favicon work.

## Recommended priorities

1. Runtime validation for persisted and imported data.
2. Full-workspace backup coverage.
3. Unit tests for standings, match cascades, FPRDS scoring, and migration.
4. Persistence service extraction.
5. PWA manifest, service worker, and update lifecycle.
6. Responsive tablet interaction review.
7. Route/view code splitting.
8. Cloud identity design before shared or public functionality.

## Final assessment

The beta has enough depth for structured field testing. New feature breadth should now be secondary to trust, assessment validation, recovery, automated tests, accessibility, and offline readiness.
