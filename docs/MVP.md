# Dumala MVP

Updated: 2026-06-14

## MVP objective

The MVP for Dumala is a single-browser club operations workspace that lets one team operator set up a club, manage roster data, schedule events, record match results, maintain standings, log discipline, award MVP honours, plan training with a 52-drill library, track match availability, review opponent intel, publish announcements, and preserve core data locally. It is not a collaboration platform, a league network, or a full sports operations system.

This document defines the smallest product slice that should be considered release-ready based on the current codebase and the current product direction.

> **MVP testing phase:** This application is currently in MVP testing. The use of browser `localStorage` for all data persistence and the absence of user authentication are intentional decisions for this phase. They allow rapid iteration and user feedback without requiring backend infrastructure setup. A proper database-backed persistence layer and authentication system are planned for the production release. The current implementation is a functional testing ground, not the final production architecture.

## MVP product statement

The MVP is a local-first web app for running one sports team from one browser. Its value comes from reducing manual admin work and giving coaches or managers one place to handle the club's weekly operating loop.

## In-scope features

### Must-have user-facing features

1. Team onboarding with club identity and first manager profile.
2. Roster management for players and staff.
3. Player profile editing for core identity and performance values.
4. Event scheduling for matches, training sessions, and meetings using live data.
5. Match result logging with automatic standings updates.
6. Standings editing and manual league maintenance.
7. **Squad Summary table** — full roster overview with goals, assists, cards, games played, MVP awards, and status.
8. **Discipline & Match Awards** — log card offences (yellow/red) and award Man of the Match with persistent history.
9. **Match Availability Tracker** — player Yes/No/Maybe status per upcoming fixture.
10. **Upcoming Opponent Quick Intel** — standings position, head-to-head record, match notes.
11. **Coach's Notes** — tactical notes editor per upcoming match.
12. **Training drills and planning** — 52-drill library with position-specific drills, How-To guides, 9 training presets, drag-and-drop weekly planner.
13. Announcements management.
14. Local persistence across refreshes.
15. JSON backup export for core data.

### Must-have system behaviors

1. A returning user must reopen their saved workspace from browser storage.
2. The app must remain usable without requiring a database or login flow.
3. Core data updates must remain internally consistent after result logging.
4. The product must build and type-check successfully (`npm run lint` passes).

## Not required for MVP

1. Multi-user accounts.
2. Cloud sync.
3. Role-based permissions.
4. League-wide data import or official competition integrations.
5. Real historical analytics with event replay.
6. Native mobile apps.
7. Financial, registration, or compliance workflows.

## Feature classification

| Feature area | MVP status | Reason |
| --- | --- | --- |
| Onboarding | Core MVP | Required to create a usable workspace |
| Dashboard summary | Core MVP | Gives visibility into club state |
| Squad Summary table | Core MVP | Full roster stats at a glance — quick operating reference |
| Roster and staff management | Core MVP | Core day-to-day operating need |
| Player comparison | Secondary | Useful, but not essential to basic club operations |
| Player profile editing | Core MVP | Required to maintain roster quality |
| Schedule management | Core MVP | Central to weekly team operations |
| Match result logging | Core MVP | Key automation value in the product |
| Match Availability Tracker | Core MVP | Essential pre-match planning tool |
| Upcoming Opponent Intel | Core MVP | Gives coach critical pre-match context |
| Coach's Notes | Core MVP | Tactical match preparation |
| Standings editing and backup log | Core MVP | Needed because standings are part of the main operating loop |
| Discipline & Match Awards | Core MVP | Card logging and MVP tracking are standard club operations |
| Announcements | Core MVP | Important internal communication surface |
| Tactics board | Post-MVP or advanced MVP | Valuable, but the product still works without it |
| Weekly training planner (52 drills) | Advanced MVP | Valuable extension with deep drill content, not required for base operating loop |

## MVP user flows

### Flow 1: Create the club workspace

1. Open the app.
2. Enter team details.
3. Enter manager details.
4. Reach the dashboard with a saved local workspace.

### Flow 2: Build and maintain the roster

1. Add players and staff.
2. Edit profiles as needed.
3. Review the active squad from the Squad Summary table on the dashboard.

### Flow 3: Schedule the week

1. Create a match, training session, or meeting.
2. Check player availability for the next fixture (Yes/No/Maybe).
3. Review opponent intel including standings position and head-to-head record.
4. Write coach's notes for tactical preparation.
5. Optionally assign position-specific training drills with How-To instructions.

### Flow 4: Record a match

1. Open a scheduled match.
2. Log the result, scorers, and MVP.
3. Log any yellow/red cards from the match.
4. Let the app update standings and player totals.

### Flow 5: Manage discipline and awards

1. Log player offences from the Standings page (date, card type, opponent, minute, reason).
2. View card tally and offence history.
3. Award MVP with date, opponent, and performance note.
4. Review MVP leaderboard and award history.

### Flow 6: Keep the team informed

1. Create announcements.
2. Review them from the announcements view and dashboard.

### Flow 7: Protect the data

1. Export a JSON backup.
2. Restore a JSON backup in another browser workspace.
3. Optionally save standings snapshots.
4. Restore previous week's training schedule via Last Week preset.

## MVP quality bar

The MVP should meet this bar before being treated as releasable:

1. New users can finish onboarding without confusion.
2. Core local persistence works for the main domain objects including availability and coach notes.
3. Match result logging updates the correct records in the UI.
4. Empty states are understandable when no data exists yet.
5. Reset and destructive flows are confirmed before execution.

## Known MVP compromises

The following are accepted compromises for the MVP testing phase and will be addressed in the production release:

1. Data lives in the current browser unless the user exports it. A backend persistence layer will be implemented before production.
2. There is no authentication or user login. This will be added as part of the production launch.
3. There is no cross-device continuity. This will be resolved with cloud-backed storage in production.
4. Some analytics visuals are illustrative summaries rather than audit-grade history.
5. Accessibility coverage is partial rather than comprehensive.
6. Product naming and repository structure are now cleanly aligned.

## Recommended MVP cuts if the scope needs to shrink further

If the product needs an even tighter first release, these features should be reduced before cutting the core flow:

1. Reduce tactics to a simple notes-based planning screen.
2. Remove player comparison from the first release.
3. Reduce the drill library to core technical drills only (remove position-specific and passing foundation sets).

## MVP exit criteria

The MVP is complete when:

1. A user can create a club workspace from scratch.
2. A user can manage players, staff, schedule, standings, discipline, MVP awards, and announcements in one app.
3. A user can check match availability, review opponent intel, and write coach's notes before a fixture.
4. A user can plan a training week with 9 preset modes, 52 drills, and How-To guides.
5. A user can record a match result and see downstream updates without manual recalculation.
6. Core data survives refreshes in the same browser.
7. A user can export the club data for backup.
8. The app passes the current TypeScript validation flow.

## Post-MVP priorities

1. Replace or supplement local-only persistence with a backend database model.
2. Implement user authentication, accounts, and role-based access.
3. Decide whether tactics and training are flagship differentiators or optional extensions.
4. Add stronger accessibility and mobile usability work.
5. Clarify and document the AI backend contract.
