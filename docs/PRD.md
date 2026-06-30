# Dumala Product Requirements Document

Updated: 2026-06-29

## 1. Product summary

Dumala is a Philippines-first football team management platform for coaches, managers, academies, and grassroots clubs. The current beta is a local-first React application that lets one operator manage multiple team workspaces from one browser.

The product combines club operations with player development:

- Operations: roster, schedule, results, standings, tactics, training, bulletins, discipline, and awards.
- Development: structured FPRDS assessments, benchmark-based scoring, player cards, assessment history, and development plans.

The current release is a public beta, not a shared multi-user service. The detailed future sequence is maintained in [ROADMAP.md](ROADMAP.md) and the in-app **Updates > Roadmap Snapshot**.

## 2. Problem statement

Grassroots football teams often keep information across spreadsheets, chat threads, notebooks, and individual devices. Coaches lose time reconciling rosters, schedules, player observations, match results, and training plans. Player evaluation is also frequently subjective and difficult to compare over time.

Dumala provides one structured workspace for weekly team administration and repeatable player development records.

## 3. Target users

| User | Current need | Current fit |
| --- | --- | --- |
| Head coach or manager | Operate one or more local teams and make weekly decisions | Strong |
| Assistant coach | Review players, training, tactics, and match context | Moderate; collaboration is not yet available |
| Team administrator | Maintain records, standings, bulletins, and backups | Strong |
| Academy evaluator | Run standardized player assessments | Beta |
| Player or parent | View a controlled player profile | Future |
| Scout or recruiting coach | Compare draft candidates | Future |
| Club leadership | Manage multiple squads and shared staff | Future |

## 4. Product goals

1. Reduce fragmented team administration.
2. Make weekly coaching workflows fast and understandable.
3. Keep the beta usable without accounts or backend setup.
4. Update standings and player totals from match results.
5. Make player assessment repeatable, explainable, and position-aware.
6. Preserve data through validated export and restore.
7. Separate development activity from verified ability so FPRDS ratings remain evidence-based.
8. Let operators manage multiple local teams while preserving a clean path toward cloud clubs.
9. Build toward offline use, tablets, shared clubs, public profiles, and Philippine coach education.

## 5. Current non-goals

1. Shared real-time collaboration.
2. Authentication and cloud synchronization.
3. Official league feeds or federation verification.
4. Payments, contracts, registration compliance, or medical records.
5. Public player and team profiles.
6. An official PFF or AFC coach rating.
7. Native Android implementation; the planned first app path is a tablet-focused PWA wrapper.

## 6. Current information architecture

### Home

- **Overview**: club identity, league rank, next event, alerts, squad summary, FPRDS snapshot, leaderboards, and recent form.
- **Game Week**: schedule, calendar, match creation, result logging, availability, opponent context, and coach notes.

### Squad

- Player and staff registration.
- Position-specific placeholder artwork.
- Player age, height, weight, traits, attributes, statistics, and status.
- Player comparison.
- Profile editing and removal.
- Backup export and restore.

### Tactics

- Match format and formation selection.
- Position-aware lineup auto-fill.
- Manual lineup assignment and board positioning.
- Captain and set-piece roles.
- Curated attacking and defensive strategy cards.
- Opponent formation selection, Shape Impact summary, and matchup-based strategy recommendations.
- In-app fullscreen Match Layout with drawing tools, ball/wall accessories, scenarios, phases, drawing layers, and saved snapshots.
- Drawing paths and quick notes.
- Coach identity sourced from the roster when available.

### Development

- **Training**: 85-drill library, filters, How-To guides, week-by-week planner, nine presets, match badges, schedule synchronization, development evidence, and reassessment planning.
- **Assessments**: Full and Quick FPRDS assessments, seven role profiles, four age groups, benchmark scoring, OVR, deltas, history, drill guides, player-card preview, and four-week plans for Full assessments.

### League & Updates

- **League**: standings, external result entry, snapshots, restore, discipline, and match awards.
- **Bulletins**: team announcements.
- **Updates**: product purpose, changelog, FPRDS explanation, and detailed roadmap.

## 7. Functional requirements

### Onboarding

- A new workspace must collect club and manager information.
- The manager must be stored as the first staff record.
- Onboarding must start with an empty standings table.
- Completion must open the Home Overview tab.

### Team workspace management

- The top navbar must show the active team and expose team workspace management.
- Users must be able to add a new local team without resetting existing teams.
- Users must be able to switch active teams, with roster, staff, schedule, standings, bulletins, assessments, payments, tactics, training, availability, and coach notes isolated per team.
- Users must be able to rename a team from the manager and keep the team metadata aligned with the active workspace.
- Users must be able to export the current team using the existing Full Workspace V4 format.
- Users must be able to import a Full Workspace V4 backup as a separate local team without overwriting the active team.
- Users must be able to delete one team while preserving other local teams.
- Workspace metadata must include stable local IDs and an optional future cloud club ID.

### Roster and profiles

- Users must be able to add, edit, inspect, compare, and remove players.
- Player creation must support position, age, height, weight, traits, photo, and biography.
- Staff creation must support role, contact details, start date, photo, and biography.
- Missing photos must use the correct position or staff placeholder.
- Player cards must remain visually uniform despite missing optional data.

### Scheduling and results

- Users must create matches, training sessions, and meetings.
- Upcoming fixtures must support availability and private coach notes.
- Result logging must update the game, relevant player totals, and standings.
- League rank on the Overview must be derived from the sorted standings table.

### Tactics

- Auto-fill must preserve valid existing assignments.
- Empty slots must prefer players matching the slot's position group.
- Every assigned board card must display a readable player name.
- Lineup and tactical settings must persist locally.
- Formation selection must stay compact and not duplicate information already shown in the board HUD or matchup panel.
- Shape Impact must provide glanceable, data-driven coaching cues from the selected match format, team formation, and opponent formation.
- Matchup Strategy must recommend attack and defense plans without automatically changing the coach's selected style.
- The deprecated custom strategy editor must not appear in the current Tactics UI; curated strategy records are the extension point for future coaching content.

### Training

- Users must browse and filter the drill library.
- Each drill must provide practical instructions.
- Users must assign drills to a weekly schedule, navigate to previous or future weeks, and load presets.
- Training schedule changes must synchronize corresponding calendar events for the selected week.
- Training must record drill plans, load, focus areas, and development evidence without treating attendance as verified ability.
- Training must not directly update official FPRDS ratings, OVR, assessment snapshots, or assessment-derived attributes.

### FPRDS assessments

- Users must select a player, role, age group, date, and Full or Quick assessment.
- Supported roles are ST, W, CM, CDM, FB, CB, and GK.
- Supported age groups are U12, U15, U18, and Adult.
- Raw drill results must be converted to attribute scores using benchmark tables.
- OVR must use role-specific weights and remain explainable.
- Saving an assessment must update the player's FPRDS snapshot.
- Assessment history must show OVR, attributes, tier, and deltas.
- Full assessments must generate a four-week development plan.
- Deleting the latest assessment must restore the player's next-latest snapshot when available.
- FPRDS assessments are the authoritative source for verified rating updates.
- Official rating deltas must come from saved assessments, not training attendance.

### League, discipline, and awards

- Standings must support automatic and manual updates.
- Users must save and restore standings snapshots.
- Reset and onboarding must support a clean league table.
- Discipline records must update yellow and red card totals.
- MVP awards must maintain per-player history.

### Bulletins and feedback

- Users must create and remove team bulletins.
- The feedback form must capture type, summary, details, expected outcome, optional contact email, page, browser, team, and submission time.
- Automatic delivery must provide an email-app fallback.

### Backup and recovery

- Full Workspace V4 must include separate player and staff records, payment ledger records, tactics, training, availability, coach notes, and standings history.
- Import must validate nested records and reject unsupported or incomplete backups before changing the workspace.
- Legacy versions 1.0, 1.1, Full Workspace V2, and Full Workspace V3 must migrate into the V4 structure.
- Restore must create a pre-restore backup and reopen the workspace without requiring onboarding.
- Failed writes must roll back so the current workspace remains unchanged.
- Reset Workspace must delete the active team workspace; if it is the last local team, the app must return to onboarding.

## 8. Non-functional requirements

### Reliability

- Core state must survive refresh and browser restart.
- Team switching must flush the current active workspace before loading the selected one.
- Destructive actions must require confirmation where data loss is material.
- Imported and persisted data should fail safely when malformed.

### Accessibility

- Interactive controls must have accessible names.
- Core workflows must support keyboard operation and visible focus.
- Motion must respect reduced-motion preferences.

### Responsive behavior

- Core workflows must remain usable on desktop and mobile.
- Tablet-specific optimization is planned in Roadmap Phase 2.

### Performance

- Core local workflows must not require a network request.
- Primary areas and nested views must remain code-split, with production chunks kept below Vite's 500 kB advisory threshold.

### Privacy

- Uploaded photos and team records remain in the browser in the beta.
- Future public profiles must require explicit publishing controls.
- Dumala development progress must never be represented as an official PFF or AFC credential.

## 9. Data model

| Entity | Purpose |
| --- | --- |
| `WorkspaceSummary` | Local team workspace metadata, active-team switching identity, and future cloud-club link |
| `TeamInfo` | Club identity and branding |
| `Player` | Athlete identity, football attributes, status, statistics, traits, and FPRDS snapshot |
| `StaffMember` | Staff identity, club role, contact details, tenure, biography, and status |
| `Game` | Match, training, or meeting event |
| `Standing` | League-table row |
| `Announcement` | Team bulletin |
| `PlayerOffense` | Discipline event |
| `MvpAwardRecord` | Match award history |
| `AssessmentSession` | Raw FPRDS results, scores, labels, deltas, and optional development plan |

## 10. Success criteria

The beta succeeds when a coach can:

1. Create and reopen multiple local team workspaces.
2. Maintain players and staff with useful profile data.
3. Plan a match week and training schedule.
4. Build a position-appropriate lineup.
5. Record results and see correct standings and player totals.
6. Run and review repeatable player assessments.
7. Switch between teams without data leaking between workspaces.
8. Export and restore a complete backup.
9. Use the product on desktop and mobile without blocking defects.

## 11. Roadmap authority

The in-app **Updates > Roadmap Snapshot** is the product-facing roadmap. [ROADMAP.md](ROADMAP.md) mirrors it for engineering and planning. If older documents conflict with those sources, the Roadmap Snapshot and current code take precedence.

## 12. Development doctrine

[FPRDS_EVIDENCE_BASED_DEVELOPMENT_SYSTEM.md](FPRDS_EVIDENCE_BASED_DEVELOPMENT_SYSTEM.md) is the authority for Dumala's player-development model. It defines the core rule that training creates development evidence, while FPRDS assessment verifies current ability and updates official ratings.
