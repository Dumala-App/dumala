# Dumala Beta MVP

Updated: 2026-07-02

## Objective

The current MVP is a local-first football operations and player-development app for managing multiple team workspaces in one browser. It is intended for real beta testing by coaches while the product remains simple to deploy, switch between teams, back up, and reset.

The current business hypothesis is that Dumala should keep the public offer simple: Free for early trust and a Premium monthly subscription for coaches, clubs, academies, schools, and multi-squad organizations that need stronger workflows, reports, and professional presentation.

## Included

1. Team and manager onboarding.
2. Navbar team workspace management for adding, switching, renaming, importing, exporting, and removing local teams.
3. Home Overview with a polished club dashboard hero and Game Week schedule.
4. Player and staff roster management.
5. Position-specific cards, placeholders, traits, and measurements.
6. Player comparison, editing, assessment entry, and removal.
7. Match scheduling, availability, opponent context, notes, and results.
8. Automatic league standings and player-stat updates.
9. Discipline records, MVP awards, and histories.
10. Position-aware tactics auto-fill, fullscreen match-board planning, curated strategy cards, opponent formation simulation, Shape Impact cues, and persistent tactical planning.
11. Weekly training planner with 85 drills, guides, filters, nine presets, week-by-week schedule navigation, development planning, and reassessment support without automatic official rating growth.
12. FPRDS Assessment Center in beta:
    - Full and Quick assessments
    - U12, U15, U18, and Adult groups
    - ST, W, CM, CDM, FB, CB, and GK roles
    - Benchmark scoring and weighted OVR
    - Assessment history and deltas
    - Four-week plans for Full assessments
13. Team bulletins and product updates.
14. Feedback delivery with email fallback.
15. Validated Full Workspace V4 export and restore, including separate player/staff records, payment ledger records, feature-local state, and legacy backup migration.

## Excluded

1. User accounts and cloud storage.
2. Shared team collaboration and permissions.
3. Offline PWA installation and service-worker caching.
4. Public player, coach, or club profiles.
5. Draft shortlists or recruiting workflows.
7. Multi-squad, multi-season, and shared club administration beyond separate local team workspaces.
8. Native mobile application.
9. Paid subscription enforcement.
10. Validated pricing or paid plan limits.

## Required user flows

### Create a workspace

Complete onboarding, create the manager record, start with clean standings, and land on Overview.

### Manage multiple teams

Use the navbar team switcher to add another team, switch active teams, rename teams, export the current team, import a backup as a new team, and remove a team without deleting the other local teams.

### Build a squad

Add players and staff, select traits and measurements, use position placeholders, edit profiles, and remove records when needed.

### Plan the week

Create events, check availability, review opponent information, write coach notes, and schedule training across current and future weeks.

### Prepare tactics

Select format and formation, compare against the opponent shape, review Shape Impact cues, apply recommended attack or defense plans when useful, auto-fill by position, preserve manual assignments, assign team roles, use fullscreen board tools, and save tactical notes.

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
- Multiple teams are local browser workspaces, not cloud clubs or shared accounts yet.
- Some generated charts are summaries rather than complete event streams.
- The primary JavaScript bundle remains large and needs later code splitting.
- FPRDS benchmarks and scoring remain in beta validation.
- FPRDS benchmarks remain beta, but the separation between training evidence and verified rating updates is a core product rule, not a temporary compromise.
- The old custom strategy editor is intentionally removed from the Tactics UI. Future strategy expansion should add curated records to the tactics library instead of free-form custom-plan fields.

## Exit criteria

The beta MVP is ready for broader testing when reliability and data-confidence tasks in [TASKS.md](TASKS.md) are complete, repeated assessments produce explainable and comparable records without corrupting roster data, and official development progress remains assessment-derived.

The MVP is ready for subscription packaging only after the coach-facing pitch, first-week success flow, and private beta willingness-to-pay interviews are completed.

Future scope is defined in [ROADMAP.md](ROADMAP.md).
