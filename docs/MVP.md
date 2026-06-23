# Dumala Beta MVP

Updated: 2026-06-21

## Objective

The current MVP is a local-first football operations and player-development workspace for one team and one browser. It is intended for real beta testing by coaches while the product remains simple to deploy and easy to reset.

## Included

1. Team and manager onboarding.
2. Home Overview and Game Week schedule.
3. Player and staff roster management.
4. Position-specific cards, placeholders, traits, and measurements.
5. Player comparison, editing, assessment entry, and removal.
6. Match scheduling, availability, opponent context, notes, and results.
7. Automatic league standings and player-stat updates.
8. Discipline records, MVP awards, and histories.
9. Position-aware tactics auto-fill and persistent tactical planning.
10. Weekly training planner with 52 drills, guides, filters, and nine presets.
11. FPRDS Assessment Center in beta:
    - Full and Quick assessments
    - U12, U15, U18, and Adult groups
    - ST, W, CM, CDM, FB, CB, and GK roles
    - Benchmark scoring and weighted OVR
    - Assessment history and deltas
    - Four-week plans for Full assessments
12. Team bulletins and product updates.
13. Feedback delivery with email fallback.
14. Validated Full Workspace V3 export and restore, including separate player/staff records, feature-local state, and legacy backup migration.

## Excluded

1. User accounts and cloud storage.
2. Shared team collaboration and permissions.
3. Offline PWA installation and service-worker caching.
4. Public player, coach, or club profiles.
5. Draft shortlists or recruiting workflows.
6. Official PFF/AFC credential verification.
7. Multi-squad and multi-season club administration.
8. Native mobile application.

## Required user flows

### Create a workspace

Complete onboarding, create the manager record, start with clean standings, and land on Overview.

### Build a squad

Add players and staff, select traits and measurements, use position placeholders, edit profiles, and remove records when needed.

### Plan the week

Create events, check availability, review opponent information, write coach notes, and schedule training.

### Prepare tactics

Select format and formation, auto-fill by position, preserve manual assignments, assign team roles, and save tactical notes.

### Assess a player

Select the player, role, age group, assessment type, and date; enter drill results; review scores and player-card preview; save the session and development plan.

### Record match outcomes

Enter the score, scorers, MVP, notes, and discipline. Confirm that standings and player totals update correctly.

### Protect data

Export a JSON backup, restore it in a fresh browser, and confirm assessments and core team data return.

## Quality bar

- `npm run lint` passes.
- `npm run build` passes.
- Core workflows work at representative desktop and mobile widths.
- No known blank-screen failures remain in primary navigation.
- Reset, import, remove, and assessment deletion have understandable confirmation or error behavior.
- The interface clearly states that data is stored locally.

## Accepted compromises

- Data is device- and origin-specific.
- There is no conflict resolution or audit-grade collaboration history.
- Some generated charts are summaries rather than complete event streams.
- The primary JavaScript bundle remains large and needs later code splitting.
- FPRDS benchmarks and scoring remain in beta validation.

## Exit criteria

The beta MVP is ready for broader testing when reliability and data-confidence tasks in [TASKS.md](TASKS.md) are complete and repeated assessments produce explainable, comparable records without corrupting roster data.

Future scope is defined in [ROADMAP.md](ROADMAP.md).
