# Dumala Codebase Audit

Updated: 2026-06-23

## Executive summary

Dumala is a substantial local-first football operations application, not a thin prototype. It now includes a broad club-management workflow and a dedicated FPRDS assessment subsystem. The strongest product qualities are feature continuity across the coaching week, useful football-specific presentation, and the ability to operate without backend infrastructure.

The main remaining risks are architecture and regression coverage: state ownership is concentrated in `App.tsx`, browser persistence still spans many keys, and automated coverage does not yet include several important domain and UI workflows.

## Current strengths

1. Five-area navigation organizes a large feature set more clearly.
2. Onboarding starts with clean standings and opens Overview.
3. Roster cards support position artwork, measurements, traits, profile editing, and removal.
4. League rank is derived from actual sorted standings.
5. Result logging connects schedule, player totals, and league state.
6. Tactics auto-fill matches players to broad position groups and preserves valid assignments.
7. Training includes 52 drills, practical guides, filters, presets, and calendar synchronization.
8. FPRDS stores raw measurements and derived outputs, enabling explainable assessment history.
9. Full Workspace V3 validates and restores separate player/staff collections plus feature-local data, with V1/V2 migration and rollback protection.
10. Match-result reconciliation prevents duplicate saves and reverses edited or deleted match contributions.
11. Release-critical dialogs trap focus, support Escape, and restore focus to their opener.
12. The project is a simple static Vite deployment with no environment variables.
13. Product updates contain a detailed AI-free roadmap.
14. Favicon, social metadata, feedback, and public beta messaging improve release polish.

## Architecture findings

### Medium: distributed browser persistence

Core data is managed in `App.tsx`, while schedule, training, standings backups, and tactics own separate state. All keys now use one typed persistence service and Full Workspace V3 covers the supported feature state.

Impact: future schema changes still need coordinated migrations across multiple feature owners.

### Resolved: unsafe persisted-data parsing and startup fallback

Zod schemas validate core and feature-local records at startup and restore boundaries. Invalid startup records now pause the workspace before any fallback state can be persisted. Users can export untouched recovery data, retry validation, review diagnostics, or confirm a reset. Invalid backups are rejected before writes.

Remaining risk: schemas and migrations must be maintained as domain models evolve.

### High: limited automated regression suite

Vitest now covers persistence validation, legacy backup migration, full-workspace round trips, nested-record rejection, feature-state recovery, and failed-write rollback. Match cascades, standings, FPRDS interpolation, lineup assignment, and UI workflows still rely mainly on TypeScript, builds, and manual browser checks.

Impact: changes to shared types or domain rules have a high regression cost.

### Medium: `App.tsx` responsibility concentration

The shell owns navigation, persistence, result processing, assessment updates, backups, reset, and modal orchestration.

Impact: unrelated changes can affect core flows and make tests harder to isolate.

### Resolved: shared Player/staff model

Players and staff now use separate domain types, state collections, storage keys, profile workflows, and V3 backup records. Legacy mixed rosters migrate through known staff roles while ambiguous football roles remain athletes.

### Resolved: initial bundle size

Primary areas, hub subviews, onboarding, feedback, and player profiles now load through view-level dynamic imports. The initial production JavaScript chunk is approximately 334 KB before gzip and no longer triggers Vite's 500 KB warning.

Remaining risk: chart-heavy views still load a shared deferred chart chunk when first opened, so chunk sizes should be monitored as those screens grow.

### Medium: unofficial coach-level field

Tactics currently stores a free-form `squad_coach_level` presentation value.

Impact: this must not be confused with future PFF/AFC qualifications. The roadmap correctly requires official credentials and Dumala progress to remain separate.

## Product findings

### FPRDS is already beta functionality

The Assessment Center supports role and age selection, Full/Quick assessments, benchmark conversion, OVR, history, deltas, guides, and development plans. Documentation must describe it as beta, not only future scope.

### Public profiles require backend identity

Personalized player and club links cannot safely build on browser-only state. They require accounts, durable IDs, publishing consent, authorization, and moderation/reporting controls.

### Offline mode requires physical-device validation

The installable production PWA and automated cold-launch checks are complete. Remaining validation is physical-device coverage across supported desktop, Android, iPhone, and iPad browsers.

## Documentation findings resolved by this update

- Removed obsolete Express architecture.
- Removed obsolete AI roadmap direction.
- Added the Assessment Center and navigation hubs.
- Documented Full Workspace V2, legacy migration, validation, and rollback behavior.
- Aligned roadmap phases with the in-app Roadmap Snapshot.
- Updated tasks with recent roster, tactics, updates, deployment, and favicon work.

## Recommended priorities

1. Unit tests for standings, match cascades, and FPRDS scoring.
2. Browser-level tests for startup recovery, export, and restore.
3. Result-cascade and domain-service extraction from `App.tsx`.
4. PWA manifest, service worker, and update lifecycle.
5. Responsive tablet interaction review.
6. Monitor deferred chunks and loading behavior during feature growth.
7. Cloud identity design before shared or public functionality.

## Final assessment

The beta has enough depth for structured field testing. New feature breadth should now be secondary to trust, assessment validation, recovery, automated tests, accessibility, and offline readiness.
