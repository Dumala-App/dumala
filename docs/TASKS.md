# Dumala Delivery Tasks

Updated: 2026-06-23

Status values: **Done**, **In Progress**, **Next**, **Planned**, **Long Term**.

## Progress dashboard

Progress is calculated from the completed capabilities and open checklist items in this document. The roadmap bars track implementation, while Release Validation tracks the latest verified build checks.

```text
Overall roadmap                 [######----]  55%  54 / 98

Shipped beta foundation         [##########] 100%  20 / 20
Current Beta: Reliability       [########--]  83%  19 / 23
FPRDS Beta                      [######----]  60%   9 / 15
Phase 1: Offline-ready PWA      [#########-]  86%   6 / 7
Phase 2: Mobile and tablet      [----------]   0%   0 / 5
Phase 3: Cloud and sync         [----------]   0%   0 / 6
Phase 4: Team collaboration     [----------]   0%   0 / 5
Phase 5: Profiles and drafting  [----------]   0%   0 / 6
Future: Coach education         [----------]   0%   0 / 6
Future: Club operations         [----------]   0%   0 / 5

Release validation              [##########] 100%  12 / 12
```

| Phase | Completed | Total | Progress | Status |
| --- | ---: | ---: | ---: | --- |
| Shipped beta foundation | 20 | 20 | 100% | Done |
| Current Beta: Reliability and data confidence | 19 | 23 | 83% | In Progress |
| FPRDS Beta | 9 | 15 | 60% | In Progress |
| Phase 1: Offline-ready web app | 6 | 7 | 86% | In Progress |
| Phase 2: Mobile and tablet experience | 0 | 5 | 0% | Planned |
| Phase 3: Cloud accounts and synchronization | 0 | 6 | 0% | Planned |
| Phase 4: Team collaboration | 0 | 5 | 0% | Planned |
| Phase 5: Public profiles and drafting | 0 | 6 | 0% | Long Term |
| Future Expansion: Philippine coach education | 0 | 6 | 0% | Long Term |
| Future Expansion: Club operations | 0 | 5 | 0% | Long Term |

The FPRDS total includes nine completed capabilities: the five shipped assessment features plus interpolation, role-weighting, age-transition, and required-field validation coverage. Its six remaining review and reporting tasks appear below.

## Recent changes

### Completed: 2026-06-23

- [x] Added FPRDS interpolation, seven-role OVR weighting, age-transition, and Quick/Full requirement tests.
- [x] Extracted and tested deterministic tactics auto-fill and training-calendar synchronization.
- [x] Added a non-mutating workspace integrity checker for completed games, standings, and player totals.
- [x] Added an actionable integrity warning with review, backup, rerun, and session-dismiss controls.

### Completed: 2026-06-22

- [x] Extracted assessment snapshot transitions into a pure tested service.
- [x] Made profile-to-assessment navigation open existing assessment history for the selected player.

### Completed: 2026-06-15 to 2026-06-21

- [x] Added the FPRDS Assessment Center with Full and Quick workflows.
- [x] Added U12, U15, U18, and Adult benchmark groups.
- [x] Added ST, W, CM, CDM, FB, CB, and GK role scoring.
- [x] Added weighted OVR, assessment deltas, history, player-card preview, and four-week development plans.
- [x] Included assessments in backup version 1.1.
- [x] Reorganized navigation into Home, Squad, Tactics, Development, and League & Updates hubs.
- [x] Added Overview/Game Week, Training/Assessments, and League/Bulletins/Updates sub-tabs.
- [x] Fixed League rank to use the actual sorted standings.
- [x] Reset standings and assessments during onboarding and workspace reset.
- [x] Made onboarding land on Overview.
- [x] Added position-specific player and staff placeholder artwork.
- [x] Added player age, height, weight, and position-specific traits.
- [x] Moved player removal into the selected profile and reduced action button sizes.
- [x] Standardized roster card height and removed visible footer color gaps.
- [x] Fixed the Tactics page loading issue.
- [x] Sourced the Team Tactician photo and identity from roster staff.
- [x] Made Tactics auto-fill position-aware and preserve valid assignments.
- [x] Fixed missing player-name labels on the match board.
- [x] Corrected League & Updates routing and renamed announcements to Bulletins.
- [x] Expanded the Updates roadmap and removed AI direction from the public roadmap.
- [x] Added public profile, drafting, Philippine coach education, and club expansion plans.
- [x] Added structured feedback delivery with email fallback.
- [x] Added Dumala favicon and Apple touch icon.
- [x] Deployed as a static Vite application through GitHub and Vercel.
- [x] Added validated Full Workspace V2 backup, legacy migration, pre-restore backup, and rollback protection.
- [x] Added safe runtime validation and section-specific recovery warnings for browser data.
- [x] Added idempotent match-result editing and completed-match deletion reversal.
- [x] Added view-level code splitting and removed the production chunk-size warning.
- [x] Added dialog focus trapping, Escape handling, focus restoration, and destructive match-event confirmation.
- [x] Completed desktop, tablet, mobile, empty-state, and primary workflow release validation.
- [x] Added the production service worker, offline app shell, runtime cache policy, and controlled update prompt.
- [x] Added offline, reconnect, offline-ready, update-available, and registration-warning status messages.
- [x] Added repeatable generated-service-worker policy verification.
- [x] Self-hosted DM Sans and Manrope for reliable offline typography.
- [x] Added GitHub Actions CI for TypeScript, tests, production build, and PWA verification.
- [x] Protected `main` with pull requests, required current CI, no bypass, and no force-push or deletion access.
- [x] Added validated private-repository production deployment from GitHub Actions to Vercel.
- [x] Updated PRD, MVP, architecture, roadmap, audit, tasks, and README.

## Current Beta: Reliability and data confidence

### Persistence and recovery

- [x] **Done:** Add runtime schemas for every core persisted collection.
- [x] **Done:** Validate nested player, game, standing, bulletin, and assessment entities during restore.
- [x] **Done:** Include tactics, availability, coach notes, training schedules, and standings backups in a full-workspace export.
- [x] **Done:** Add backup migration tests for versions 1.0 and 1.1.
- [ ] **Planned:** Warn when browser storage approaches quota.
- [ ] **Planned:** Add a recovery screen for invalid startup data instead of silently falling back.

### Core business rules

- [x] **Done:** Add unit tests for match-result cascades.
- [x] **Done:** Add unit tests for standings sorting and opponent updates.
- [x] **Done:** Prevent accidental duplicate application of a completed match result.
- [x] **Done:** Validate scorer counts, MVP selection, and clean-sheet credit.
- [x] **Done:** Add integrity checks comparing completed games, standings, and player totals.

### UI reliability and accessibility

- [x] **Done:** Complete an empty-state audit across every nested tab.
- [x] **Done:** Complete keyboard and visible-focus testing for primary workflows.
- [x] **Done:** Audit dialogs for focus trapping, Escape handling, and focus restoration.
- [x] **Done:** Add application-level and view-level error boundaries with recoverable fallback screens.
- [ ] **Planned:** Add consistent validation messages to all forms.
- [x] **Done:** Add confirmation to remaining destructive match-event actions.
- [x] **Done:** Verify global focus contrast and reduced-motion behavior.

### Engineering structure

- [x] **Done:** Extract persistence operations from `App.tsx`.
- [x] **Done:** Extract the match-result service from `App.tsx`.
- [x] **Done:** Extract the assessment snapshot service from `App.tsx`.
- [ ] **Planned:** Replace deprecated `Player.attributes?: any` after migration support is no longer needed.
- [ ] **Planned:** Split Player and Staff models before credential and permission work.
- [x] **Done:** Add CI for type-check, tests, production build, PWA verification, and build artifacts.

## FPRDS Beta

- [ ] **Next:** Review every benchmark table with qualified football practitioners.
- [x] **Done:** Add tests for lower-is-better and higher-is-better interpolation.
- [x] **Done:** Test OVR weighting for all seven roles.
- [x] **Done:** Validate age calculation and age-group transitions.
- [x] **Done:** Verify Quick and Full required-field behavior.
- [ ] **Planned:** Add true historical progress charts.
- [ ] **Planned:** Add player-to-player and session-to-session reports.
- [ ] **Planned:** Add downloadable assessment and development reports.
- [ ] **Planned:** Add assessment export suitable for coach review.
- [ ] **Planned:** Define benchmark versioning so historical sessions remain reproducible.

## Phase 1: Offline-ready web app

- [x] **Done:** Add web-app manifest, install icons, metadata, and platform-specific installation support.
- [x] **Done:** Add a production-only service worker with an explicit Workbox caching strategy.
- [x] **Done:** Precache generated application assets, icons, logos, local placeholder artwork, DM Sans, and Manrope.
- [x] **Done:** Add offline, reconnect, offline-ready, update-available, and registration-error indicators.
- [ ] **Next:** Test cold launch and refresh while offline.
- [x] **Done:** Define user-controlled service-worker update and Vercel rollback behavior.
- [x] **Done:** Move DM Sans and Manrope into the repository for guaranteed offline typography.

## Phase 2: Mobile and tablet experience

- [ ] **Planned:** Define supported tablet viewport and touch targets.
- [ ] **Planned:** Redesign dense tables and forms for tablet use.
- [ ] **Planned:** Improve touch dragging and drawing on the tactics board.
- [ ] **Planned:** Test orientation changes and virtual keyboard behavior.
- [ ] **Planned:** Package the validated PWA for Google Play.

## Phase 3: Cloud accounts and synchronization

- [ ] **Planned:** Select backend, database, authentication, and hosting.
- [ ] **Planned:** Design club, user, membership, and durable domain schemas.
- [ ] **Planned:** Create local-to-cloud migration with non-destructive rollback.
- [ ] **Planned:** Define offline mutation queue and conflict strategy.
- [ ] **Planned:** Add account recovery, data export, and deletion.
- [ ] **Planned:** Add monitoring, audit logging, and backups.

## Phase 4: Team collaboration

- [ ] **Planned:** Implement Owner, Admin, Coach, Staff, and Viewer roles.
- [ ] **Planned:** Add invitations and membership management.
- [ ] **Planned:** Add activity history and sensitive-action audit records.
- [ ] **Planned:** Add shared bulletins and controlled editing.
- [ ] **Planned:** Prevent silent overwrite during simultaneous edits.

## Phase 5: Public profiles and drafting

- [ ] **Long Term:** Define public player, coach, and club profile schemas.
- [ ] **Long Term:** Add personalized-link reservation and moderation.
- [ ] **Long Term:** Add explicit publish/unpublish and field-level privacy controls.
- [ ] **Long Term:** Add draft shortlists, comparisons, trial status, and notes.
- [ ] **Long Term:** Add media, achievements, position history, and verified assessment highlights.
- [ ] **Long Term:** Add abuse reporting and profile ownership recovery.

## Future Expansion: Philippine coach education

- [ ] **Long Term:** Curate a coach knowledge base.
- [ ] **Long Term:** Maintain official PFF, AFC, and FIFA resource links.
- [ ] **Long Term:** Model qualifications, issuers, licence numbers, dates, documents, and verification state.
- [ ] **Long Term:** Add learning plans, journals, reflections, goals, and renewal reminders.
- [ ] **Long Term:** Keep Dumala Development Progress separate from official credentials.
- [ ] **Long Term:** Add controlled public coach credentials and portfolios.

## Future Expansion: Club operations

- [ ] **Long Term:** Add attendance and availability history.
- [ ] **Long Term:** Add season archives and richer reports.
- [ ] **Long Term:** Add calendar export and scheduled reminders.
- [ ] **Long Term:** Add multiple squads and age groups.
- [ ] **Long Term:** Preserve records across seasons.

## Release validation checklist

- [x] TypeScript validation passes.
- [x] Production build passes.
- [x] Production chunks remain below Vite's 500 kB warning threshold after view-level code splitting.
- [x] Onboarding and reset start with clean standings.
- [x] Roster create/edit/remove works for players and staff.
- [x] Backup export and restore pass isolated-storage V2 round-trip and migration tests.
- [x] Match results update standings and player totals once.
- [x] Tactics auto-fill matches positions and preserves manual assignments.
- [x] Training schedule persists and syncs calendar events.
- [x] Full and Quick assessment save/restore and assessment deletion logic are validated.
- [x] League, Bulletins, and Updates all render.
- [x] Desktop, mobile, and tablet smoke tests pass.
