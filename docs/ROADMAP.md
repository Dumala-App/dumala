# Dumala Product Roadmap

Updated: 2026-07-08

## Source of truth

This document mirrors the in-app **League & Updates > Updates > Roadmap Snapshot**. The roadmap defines order and intent, not promised release dates. Beta feedback may change priorities.

## Current Beta: Reliability and data confidence

Status: **Complete**

### Planned deliverables

- Fix workflow and display defects across the main coaching tools.
- Validate standings calculations and the full match-result update flow.
- Improve backup import validation, recovery guidance, and malformed-data handling.
- Standardize roster, tactics, training, schedule, and assessment data behavior.
- Polish the Home dashboard hero and remove outdated promotional surfaces from the operational overview.
- Support week-by-week training planning from the Development planner.
- Connect match preparation and training delivery with saved Game Plans, dashboard game-plan summaries, daily session summaries, and readiness signals.
- Keep the beta feedback loop visible beside the roadmap so real coach testing can steer what gets refined next.
- Support multiple local team workspaces from the navbar while keeping cloud club switching as a later capability.
- Keep the Tactics page focused on pitch planning, curated strategy cards, opponent-shape recommendations, and fullscreen board controls instead of free-form custom-plan editing.

### Completion criteria

Core workflows, planning summaries, and recovery paths work without unexpected data loss.

## FPRDS Beta: Development system

Status: **Complete**

### Delivered

- Standardized assessments for every supported position and age group with interpolated, role-weighted, explainable scoring.
- Historical progress charts, player-to-player and session-to-session comparison reports, and measurable four-week development plans.
- Separation of training evidence, rating confidence, and verified assessment results under the evidence-based development doctrine.
- Downloadable player assessment and development reports plus a coach-review data export.
- An opt-in private beta results database with per-drill data, aggregate benchmark distribution analysis, and a reviewer verdict and correction-log workflow.
- Benchmark versioning that stamps every session with the benchmark version it was scored under so historical results stay reproducible.

### Deferred

- Qualified practitioner review of every benchmark table remains deferred until external reviewers are available; the beta results database and correction log exist to support that review when it happens.

### Completion criteria

Repeated assessments, not training completion alone, generate consistent, explainable, and comparable official development records.

## Phase 1: Offline-ready web app

Status: **Complete**

### Planned deliverables

- Validate the installed Progressive Web App on production devices.
- Verify cold launch and refresh across desktop, Android, iPhone, and iPad while offline.
- Confirm roster, tactics, assessments, scheduling, training, and notes remain reliable without internet.
- Keep controlled-update and physical-device offline validation documented as deferred evidence.

### Completion criteria

An installed device can reopen Dumala and use all local features while offline.

## Phase 2: Mobile and tablet experience

Status: **Complete**

### Planned deliverables

- Create tablet-focused navigation and workspace layouts.
- Improve touch controls, form sizing, tactical-board interaction, and responsive tables.
- Test complete coaching workflows on common Android tablet sizes.
- Use the Phase 2 support contract for viewport bands, touch targets, and verification coverage.

### Completion criteria

Primary coaching workflows work comfortably on supported mobile and tablet viewports. Google Play packaging is deferred until core cloud, collaboration, and public-release capabilities stabilize.

## Phase 3: Cloud accounts and synchronization

Status: **Complete**

### Planned deliverables

- Add secure accounts, club workspaces, and durable cloud storage.
- Migrate existing browser data without deleting local records.
- Synchronize approved changes across devices after reconnection.
- Handle interrupted uploads, duplicates, and failed synchronization.
- Carry newer planning records, including saved Game Plans, through the local-to-cloud migration path.

### Completion criteria

A user can sign in on another device and safely access the same club data.

## Phase 4: Team collaboration

Status: **Complete**

### Planned deliverables

- Add Owner, Admin, Coach, Staff, and Viewer permissions.
- Support invitations, controlled editing, shared bulletins, and activity history.
- Protect sensitive actions with role-based access.
- Resolve simultaneous edits without silent overwrites.

### Completion criteria

Authorized staff can safely manage one shared team according to their role.

## Phase 5: Public profiles and player drafting

Status: **Long Term**

### Planned deliverables

- Upgrade player cards with verified football history, attributes, assessments, achievements, media, and development highlights.
- Create draft-ready profiles for shortlists, comparisons, trials, and squad selection.
- Give eligible players controlled public profiles with personalized links.
- Give teams controlled public club profiles with personalized links.
- Add publishing approval, privacy settings, link checks, and reporting tools.

### Completion criteria

Authorized users can publish controlled player and team profiles, and coaches can reliably shortlist and compare candidates.

## Future Expansion: Philippine coach education

Status: **Long Term**

### Planned deliverables

- Build a knowledge base for session planning, tactics, development, conditioning, leadership, safeguarding, first aid, and Laws of the Game.
- Explain the Philippine pathway using current PFF and AFC guidance.
- Link official PFF, AFC, and FIFA course resources.
- Add education planning, learning goals, seminars, workshops, and continuing development.
- Track qualification, issuer, licence number, issue/expiry dates, documents, and verification state.
- Add renewal reminders, private coaching journals, reflections, goals, and portfolios.
- Expand staff profiles with specialties, age groups, experience, achievements, and approved public credentials.
- Keep Dumala Development Progress separate from official PFF/AFC qualifications.

### Completion criteria

Philippine coaches can find official guidance, organize development records, and clearly distinguish verified credentials from app progress.

## Future Expansion: Club operations

Status: **Long Term**

### Planned deliverables

- Add attendance, availability history, season archives, and richer reports.
- Support calendar export and scheduled reminders.
- Manage multiple local teams now; later expand this into multiple squads or age groups inside one shared club.
- Preserve records and development history across seasons.

### Completion criteria

A club can manage multiple squads and seasons from one organized workspace.

## Commercial validation and SaaS packaging

Status: **In Progress**

### Delivered

- Shipped a coach-facing landing page that leads with weekly admin relief, match-week preparation, and clearer player development.
- Packaged the public offer as two choices: Free during beta and a Premium monthly subscription, with Coach, Club, and Academy value framed inside Premium rather than as separate visible tiers.
- Separated the marketing landing page from the coach workspace with a dedicated `#/app` route, made the installed app open straight into the workspace, and returned cloud sign-in redirects cleanly to the app.
- Refined the landing page copy, glow treatment, hero-to-How-it-Works flow, installed app route, and cloud sign-in return path around the coach workspace.
- Shipped a first-week getting-started checklist on the Home dashboard that guides a coach to value across five milestones and deep-links each step.
- Bundled sample teams a coach can load from onboarding or the team menu to evaluate the product before building a roster.
- Instrumented activation metrics (roster, schedule, result, assessment, report) as one-time events with an activation funnel in the Admin Console.
- Consolidated internal plan codes to the same two-plan offer (Free and Premium) behind a single shared plans module, with legacy trial/pro/club codes migrated to Premium.
- Added a Marketing tab to the Admin Console for running scheduled discounts or sales (shown automatically on the landing page pricing) and publishing in-app announcements with draft/publish control.

### Planned deliverables

- Validate whether solo coaches will pay roughly USD 9-15 per month before introducing any future club-scale pricing.
- Recruit 10-20 real coaches or clubs for private beta feedback, activation tracking, and willingness-to-pay interviews (go-to-market task, supported by the in-app feedback channel and activation funnel).

### Completion criteria

Dumala has a tested subscription story, a simple first offer, and real coach feedback before paid packaging is treated as validated.

## Product principles

1. Reliability before breadth.
2. Offline capability before cloud synchronization.
3. Cloud identity before collaboration and public profiles.
4. Explicit privacy before publishing personal information.
5. Explainable assessment scoring before wider FPRDS claims.
6. Training creates development evidence; FPRDS assessment verifies current ability.
7. Official coaching credentials must never be replaced by an internal Dumala score.
8. Pricing must follow proven coach and club value, not feature count alone.
