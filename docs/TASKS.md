# Dumala Delivery Tasks

Updated: 2026-07-03

Status values: **Done**, **In Progress**, **Next**, **Planned**, **Long Term**.

## Progress dashboard

Progress is calculated from the completed capabilities and open checklist items in this document. The roadmap bars track implementation, while Release Validation tracks the latest verified build checks.

```text
Overall roadmap                 [########--]  77%  86 / 111

Shipped beta foundation         [##########] 100%  20 / 20
Current Beta: Reliability       [##########] 100%  24 / 24
FPRDS Beta                      [########--]  80%  16 / 20
Phase 1: Offline-ready PWA      [##########] 100%   7 / 7
Phase 2: Mobile and tablet      [##########] 100%   4 / 4
Phase 3: Cloud and sync         [##########] 100%   6 / 6
Phase 4: Team collaboration     [##########] 100%   5 / 5
Phase 5: Profiles and drafting  [----------]   0%   0 / 6
Future: Coach education         [----------]   0%   0 / 6
Future: Club operations         [##--------]  17%   1 / 6
Commercial validation           [###-------]  33%   2 / 6
Release: App stores             [----------]   0%   0 / 1

Release validation              [##########] 100%  14 / 14
```

| Phase | Completed | Total | Progress | Status |
| --- | ---: | ---: | ---: | --- |
| Shipped beta foundation | 20 | 20 | 100% | Done |
| Current Beta: Reliability and data confidence | 24 | 24 | 100% | Done |
| FPRDS Beta | 16 | 20 | 80% | In Progress |
| Phase 1: Offline-ready web app | 7 | 7 | 100% | Done |
| Phase 2: Mobile and tablet experience | 4 | 4 | 100% | Done |
| Phase 3: Cloud accounts and synchronization | 6 | 6 | 100% | Done |
| Phase 4: Team collaboration | 5 | 5 | 100% | Done |
| Phase 5: Public profiles and drafting | 0 | 6 | 0% | Long Term |
| Future Expansion: Philippine coach education | 0 | 6 | 0% | Long Term |
| Future Expansion: Club operations | 1 | 6 | 17% | Long Term |
| Commercial validation and SaaS packaging | 2 | 6 | 33% | In Progress |
| Future Release: App store distribution | 0 | 1 | 0% | Deferred |

The FPRDS total includes sixteen completed capabilities: the five shipped assessment features plus interpolation, role-weighting, age-transition, required-field validation coverage, true historical progress charts, player/session comparison reports, the evidence-based development doctrine, training evidence naming, removal of direct training-to-rating mutation, reassessment recommendations, and rating confidence labels. Practitioner benchmark review is deferred until qualified external reviewers are available.

## Recent changes

### Completed: 2026-07-03

- [x] Separated the marketing landing page from the coach workspace by moving the app onto a dedicated `#/app` route while keeping the landing page as the default public entry point.
- [x] Made the installed PWA open directly into the coach workspace by pointing the manifest `start_url` at `/#/app` and verifying the offline cold-launch flow against the app route.
- [x] Fixed cloud sign-in redirects so Google and email OAuth return coaches into the app via a `dumalaAuth=app` callback instead of stranding them on the landing route, with coverage in `CloudAccountGate.test.tsx`.
- [x] Polished the landing page hero and footer effects and shipped a repeatable launch configuration (`.claude/launch.json`) for running the app.
- [x] Removed an unused pricing card to keep the public Free and Premium offer focused.
- [x] Upgraded the training dashboard daily-prep view with clearer session context for match-week and training-day guidance.

### Completed: 2026-07-02

- [x] Clarified the SaaS business model hypothesis: Dumala should be priced gently for individual coaches and monetized more seriously through clubs, academies, schools, and multi-squad organizations.
- [x] Identified the strongest subscription promise as saving weekly admin time, improving match-week preparation, and creating clearer player-development records.
- [x] Confirmed the likely Premium monthly subscription range for individual coaches as roughly USD 9-15 per month, with higher pricing reserved for future club-scale capabilities only after validation.
- [x] Confirmed the simpler packaging direction: keep only two visible choices, Free and Premium monthly subscription, while describing Coach, Club, and Academy use cases inside the Premium value proposition.
- [x] Reframed the commercial pitch from "team management software" to "run your football team like a professional academy" and "the coach's weekly command center."
- [x] Set the next product task as a coach-facing subscription/value proposition pass before adding more broad feature work.
- [x] Built the coach-facing landing page at `#landing` with the simplified two-choice Free and Premium monthly subscription offer.

### Completed: 2026-06-29

- [x] Redesigned the Tactics workspace around a compact command flow with pitch-first planning, side panels, and reduced duplicate controls.
- [x] Added an in-app fullscreen Match Layout with synced players, drawings, ball, defensive wall, scenario presets, phase selector, drawing layers, snapshots, and a hideable coach toolset.
- [x] Added the updatable tactical strategy engine with curated attack/defense strategy records, opponent formation selection, deterministic matchup recommendations, Shape Impact cards, and explainable Coach Read details.
- [x] Replaced the oversized Formation Library grid with a compact formation selector and removed the repetitive Current Game Plan summary.
- [x] Removed the deprecated custom strategy editor, including Custom Playstyle Directive, Custom Defensive Anchor, mentality selector, strategy notes, and the custom/preset toggle from the Tactics UI.
- [x] Fixed tablet/iPad layout issues in the Attacking Plan and Defensive Plan cards so text wraps without overlap.

### Completed: 2026-06-28

- [x] Added local multi-team workspace management from the navbar with team switching, creation, rename, export, import-as-new, and single-team deletion.
- [x] Added managed workspace metadata, active workspace IDs, legacy single-team migration, and namespaced local storage snapshots for per-team isolation.
- [x] Updated reset behavior so Reset Workspace removes only the active team and returns to onboarding only when no local teams remain.
- [x] Added persistence tests for legacy migration, switching isolation, active deletion, last-team reset, and V4 backup import as a new team.
- [x] Documented the FPRDS evidence-based development doctrine as the core rule that training creates development evidence while assessments verify official ratings.
- [x] Renamed training stat bumps to development evidence focus across the drill library and training UI.
- [x] Removed direct training-to-rating mutation from completed development sessions.
- [x] Added reassessment recommendation messaging after focused development evidence.
- [x] Added assessment confidence labels for selected-player training plans.

### Completed: 2026-06-26

- [x] Created the FPRDS benchmark practitioner review package with current benchmark tables, scoring assumptions, role-weight review, Quick assessment fields, reviewer signoff fields, and a correction log.
- [x] Refreshed the product roadmap statuses so Phase 2, Phase 3, and Phase 4 match the task tracker.
- [x] Deferred external practitioner benchmark signoff and added true historical FPRDS progress charts from saved assessment sessions.
- [x] Added FPRDS player-to-player and session-to-session reports with latest-assessment comparison, selectable session baselines, OVR deltas, and weighted attribute gap tables.
- [x] Added Assessment Center team history access and per-session coach notes that persist with assessment records and backups.
- [x] Added the validated Argentina mock workspace export in `docs/argentina.json` with roster, staff, assessments, availability, payments, standings history, and tactics data.
- [x] Redesigned the Home dashboard hero with a larger club logo, clean app-gradient background, readable club metadata chips, and compact rank/registration cards.
- [x] Removed the Home dashboard tactics promo banner so the overview moves directly from the hero into operational cards.
- [x] Added week navigation to the Development training planner so coaches can move to previous or next weeks and schedule separate training plans per week.

### Completed: 2026-06-25

- [x] Accepted the Phase 3 cloud platform ADR selecting Supabase, PostgreSQL, Supabase Auth, Vercel hosting, IndexedDB replica/outbox, and optimistic sync conflict controls.
- [x] Designed the Phase 3 durable schema baseline for user profiles, clubs, memberships, devices, sync metadata, domain records, assessments, tactics, payments, and audit events.
- [x] Documented the non-destructive local-to-cloud migration and rollback workflow with V4 backups, import manifests, idempotency, verification, failure recovery, and beta rollback.
- [x] Defined the offline mutation queue, IndexedDB replica stores, mutation envelope, retry/backoff behavior, conflict records, entity-specific conflict policies, and sync status states.
- [x] Documented Phase 3 account recovery, session and device management, data export, club deletion, account deletion, re-authentication gates, pending-sync handling, and lifecycle audit events.
- [x] Documented Phase 3 operations, monitoring, redacted diagnostics, audit logging, layered backups, restore drills, security operations, production launch gates, and private beta operating rhythm.
- [x] Added the first local-to-cloud migration implementation slice for V4 pre-migration backups, deterministic manifests, record counts, content fingerprints, and rollback snapshots.
- [x] Added the local-to-cloud import payload transform with deterministic source idempotency keys for club, roster, schedule, result, standings, bulletin, assessment, payment, availability, training, and tactics records.
- [x] Added local migration package verification that blocks cloud activation when manifest hashes, counts, source IDs, payload table counts, or idempotency keys do not match.
- [x] Added migration activation and rollback helpers so cloud-backed mode requires a passed verification report and beta rollback restores the pre-migration V4 backup.
- [x] Initialized the Supabase local project scaffold, installed Supabase client and CLI dependencies, added disabled-by-default cloud configuration, and created the first RLS-protected cloud foundation migration.
- [x] Added deterministic cloud UUID mapping for legacy local IDs and created the Supabase domain-table migration for roster, schedule, results, standings, bulletins, assessments, payments, training, and tactics records.
- [x] Started the local Supabase stack with Docker, verified migrations with `supabase db reset`, and added an authenticated cloud import executor that creates owner membership, registers the device, upserts domain records in dependency order, and marks workspace imports completed or failed.
- [x] Added account lifecycle implementation for passwordless recovery links, recent-auth gates, device revocation, portable account archive export, club deletion/cancellation, account deletion requests, and redacted lifecycle audit event inserts.
- [x] Added Phase 3 operations guardrails for privacy-minimized metric definitions, redacted diagnostics, audit metadata redaction, restore drill evidence checks, and production launch gate evaluation.
- [x] Added the Phase 3 launch approval runbook, local cloud-launch verifier, and pgTAP RLS isolation tests covering cross-user profile, club, domain-write, and audit-event boundaries.
- [x] Added a machine-readable production approval record and failing production-approval verifier so real cloud launch remains blocked until project refs, access owners, backup settings, restore evidence, privacy approvals, diagnostic approvals, incident owners, and final signoff are filled in.
- [x] Added Phase 4 role behavior for Owner, Admin, Coach, Staff, and Viewer with a shared permission matrix, database helper functions, role-scoped RLS policies, and pgTAP coverage for membership, domain-write, payment, bulletin, and viewer read-only boundaries.
- [x] Added Phase 4 invitations and membership management with pending invitation records, owner/admin invitation controls, email-matched invitation visibility, atomic invitation acceptance, membership management helpers, and pgTAP coverage for invite isolation.
- [x] Added Phase 4 activity history and sensitive-action audit records with collaboration audit event types, atomic invite-accept activity logging, redacted team activity helpers, owner/admin audit-history access, and pgTAP coverage for activity visibility boundaries.
- [x] Added Phase 4 shared bulletins and controlled editing with active-only shared bulletin reads, audited bulletin creation, version-checked update/remove RPCs, blocked direct bulletin updates, and pgTAP coverage for stale-edit conflicts and viewer denial.
- [x] Completed Phase 4 simultaneous-edit protection with database triggers that block blind direct updates, a generic version-checked controlled-update RPC for versioned domain records, conflict error mapping, protected-field patch validation, and pgTAP coverage for stale overwrite prevention.

### Completed: 2026-06-23

- [x] Added FPRDS interpolation, seven-role OVR weighting, age-transition, and Quick/Full requirement tests.
- [x] Extracted and tested deterministic tactics auto-fill and training-calendar synchronization.
- [x] Added a non-mutating workspace integrity checker for completed games, standings, and player totals.
- [x] Added an actionable integrity warning with review, backup, rerun, and session-dismiss controls.
- [x] Removed avoidable application-facing `any` usage from assessment, tactics, select, and chart typing boundaries.
- [x] Added shared accessible validation for match results, assessments, roster/profile editing, backup import, and manual standings.
- [x] Added browser quota monitoring with actionable full-workspace backup guidance.
- [x] Added blocking startup recovery for malformed saved data with raw recovery export, retry, diagnostics, and confirmed reset.
- [x] Split player and staff domain models, storage, profiles, and Full Workspace backup records with legacy migration.
- [x] Defined supported mobile/tablet viewport bands, touch targets, and Phase 2 verification requirements.
- [x] Improved tablet layouts for dense roster, schedule, assessment, and standings forms and tables.
- [x] Improved tactics-board touch dragging, drawing, and tablet hit targets.
- [x] Added mobile/tablet orientation and reduced-keyboard-viewport verification.

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
- [x] Added Overview/Bulletins/Game Week, Training/Assessments, and League/Updates sub-tabs.
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
- [x] Added GitHub Actions CI for TypeScript, tests, production build, PWA verification, and cloud-launch boundary verification.
- [x] Protected `main` with pull requests, required current CI, no bypass, and no force-push or deletion access.
- [x] Added validated private-repository production deployment from GitHub Actions to Vercel.
- [x] Updated PRD, MVP, architecture, roadmap, audit, tasks, and README.

## Current Beta: Reliability and data confidence

### Persistence and recovery

- [x] **Done:** Add runtime schemas for every core persisted collection.
- [x] **Done:** Validate nested player, game, standing, bulletin, and assessment entities during restore.
- [x] **Done:** Include tactics, availability, coach notes, training schedules, and standings backups in a full-workspace export.
- [x] **Done:** Add backup migration tests for versions 1.0 and 1.1.
- [x] **Done:** Warn when browser storage approaches quota.
- [x] **Done:** Add a recovery screen for invalid startup data instead of silently falling back.

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
- [x] **Done:** Add consistent validation messages to high-risk forms.
- [x] **Done:** Add confirmation to remaining destructive match-event actions.
- [x] **Done:** Verify global focus contrast and reduced-motion behavior.

### Engineering structure

- [x] **Done:** Extract persistence operations from `App.tsx`.
- [x] **Done:** Extract the match-result service from `App.tsx`.
- [x] **Done:** Extract the assessment snapshot service from `App.tsx`.
- [x] **Done:** Replace avoidable application-facing `any` usage while keeping a typed legacy player-attributes boundary.
- [x] **Done:** Split Player and Staff models before credential and permission work.
- [x] **Done:** Add CI for type-check, tests, production build, PWA verification, cloud-launch boundary verification, and build artifacts.

## FPRDS Beta

- [x] **Done:** Document and enforce the evidence-based development doctrine across product docs.
- [ ] **Planned:** Deferred qualified football practitioner review of every benchmark table using `docs/FPRDS_BENCHMARK_REVIEW_PACKAGE.md`.
- [x] **Done:** Add tests for lower-is-better and higher-is-better interpolation.
- [x] **Done:** Test OVR weighting for all seven roles.
- [x] **Done:** Validate age calculation and age-group transitions.
- [x] **Done:** Verify Quick and Full required-field behavior.
- [x] **Done:** Add true historical progress charts.
- [x] **Done:** Add player-to-player and session-to-session reports.
- [x] **Done:** Rename training stat bumps to development focus or development evidence in the training model and UI.
- [x] **Done:** Remove direct training-to-rating mutation from completed development sessions.
- [x] **Done:** Add reassessment recommendation behavior after sustained development evidence.
- [x] **Done:** Add confidence and freshness labels for assessment-derived ratings.
- [ ] **Next:** Design and build the FPRDS private beta results database for opt-in submitted assessment sessions, aggregate benchmark analysis, and correction review.
- [ ] **Next:** Add downloadable assessment and development reports.
- [ ] **Planned:** Add assessment export suitable for coach review.
- [ ] **Planned:** Define benchmark versioning so historical sessions remain reproducible.

## Phase 1: Offline-ready web app

- [x] **Done:** Add web-app manifest, install icons, metadata, and platform-specific installation support.
- [x] **Done:** Add a production-only service worker with an explicit Workbox caching strategy.
- [x] **Done:** Precache generated application assets, icons, logos, local placeholder artwork, DM Sans, and Manrope.
- [x] **Done:** Add offline, reconnect, offline-ready, update-available, and registration-error indicators.
- [x] **Done:** Automate production cold-launch and refresh verification while offline.
- [x] **Done:** Verify seeded core coaching workflows and V3 player/staff persistence offline in CI.
- [x] **Done:** Define user-controlled service-worker update and Vercel rollback behavior.
- [x] **Done:** Move DM Sans and Manrope into the repository for guaranteed offline typography.

Deferred by product decision: production physical-device and controlled-update validation across desktop, Android, iPhone, and iPad remains documented in `docs/PHASE_1_OFFLINE_DEVICE_VALIDATION.md`, but is no longer blocking Phase 2.

## Phase 2: Mobile and tablet experience

- [x] **Done:** Define supported tablet viewport and touch targets.
- [x] **Done:** Redesign dense tables and forms for tablet use.
- [x] **Done:** Improve touch dragging and drawing on the tactics board.
- [x] **Done:** Test orientation changes and virtual keyboard behavior.

Deferred by product decision: Google Play packaging is a future release task, not a core-feature blocker. Revisit after the next major product capabilities stabilize so packaging, store listing assets, Android validation, and versioning do not need to be repeated for every feature iteration.

## Phase 3: Cloud accounts and synchronization

- [x] **Done:** Confirm Supabase, PostgreSQL, Supabase Auth, and Vercel as the Phase 3 platform foundation.
- [x] **Done:** Design club, user, membership, and durable domain schemas.
- [x] **Done:** Create local-to-cloud migration with non-destructive rollback.
- [x] **Done:** Define offline mutation queue and conflict strategy.
- [x] **Done:** Add account recovery, data export, and deletion.
- [x] **Done:** Add monitoring, audit logging, and backups.

Phase 3 implementation baseline is complete. Local launch-readiness checks now include `npm run supabase:test` and `npm run verify:cloud-launch`. Private-beta production approval has been recorded for the current no-staging Supabase Free-plan posture; the shared setup password has been rotated, and independent backup storage should still be upgraded before inviting external beta users.

## Phase 4: Team collaboration

- [x] **Done:** Implement Owner, Admin, Coach, Staff, and Viewer roles.
- [x] **Done:** Add invitations and membership management.
- [x] **Done:** Add activity history and sensitive-action audit records.
- [x] **Done:** Add shared bulletins and controlled editing.
- [x] **Done:** Prevent silent overwrite during simultaneous edits.

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

- [x] **Done:** Add local multi-team workspace management in one browser.
- [ ] **Long Term:** Add attendance and availability history.
- [ ] **Long Term:** Add season archives and richer reports.
- [ ] **Long Term:** Add calendar export and scheduled reminders.
- [ ] **Long Term:** Add multiple squads and age groups.
- [ ] **Long Term:** Preserve records across seasons.

## Commercial validation and SaaS packaging

- [x] **Done:** Define the initial SaaS hypothesis, target paying users, and coach/club subscription ranges.
- [x] **Done:** Create a coach-facing one-page pitch and pricing/value proposition with two choices: Free and Premium monthly subscription.
- [ ] **Next:** Design the first-week success flow so a coach gets value after adding 8-12 players and one upcoming match.
- [ ] **Planned:** Prepare a demo/sample workspace that lets coaches evaluate Dumala without entering a full roster first.
- [ ] **Planned:** Recruit 10-20 real coaches or clubs for private beta validation and collect willingness-to-pay feedback.
- [ ] **Planned:** Define activation metrics: roster added, first event scheduled, first result logged, first assessment saved, report downloaded.

## Future Release: App store distribution

- [ ] **Deferred:** Package the validated PWA for Google Play after core cloud, collaboration, and public-release capabilities stabilize.

## Release validation checklist

- [x] TypeScript validation passes.
- [x] Production build passes.
- [x] Cloud-launch artifact and browser environment boundary verification passes.
- [x] Production chunks remain below Vite's 500 kB warning threshold after view-level code splitting.
- [x] Onboarding and reset start with clean standings.
- [x] Roster create/edit/remove works for players and staff.
- [x] Backup export and restore pass isolated-storage V3 round-trip and V1/V2 migration tests.
- [x] Match results update standings and player totals once.
- [x] Tactics auto-fill matches positions and preserves manual assignments.
- [x] Training schedule persists and syncs calendar events.
- [x] Training planner supports week navigation and separate locally persisted schedules by week.
- [x] Full and Quick assessment save/restore and assessment deletion logic are validated.
- [x] Home Bulletins plus League and Updates all render.
- [x] Desktop, mobile, and tablet smoke tests pass.
