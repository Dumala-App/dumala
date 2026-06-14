# Stack Team Manager PRD

Updated: 2026-06-14

## Product overview

Stack Team Manager is a local-first web application for running a single sports club from one browser workspace. It combines team setup, roster management, match scheduling, standings tracking, training planning, tactics planning, announcements, disciplinary records, MVP awards, and lightweight backup flows in one interface.

The current product behaves more like an operations dashboard for a coach, manager, or club organizer than a multi-user SaaS platform. The root application in this repository is treated as the current source of truth for this document.

> **MVP testing note:** In its current form the application is built for MVP testing and internal validation. All data is stored in browser `localStorage` and there is no user authentication. This is an intentional tradeoff to allow rapid experimentation and feedback without backend infrastructure. Both a proper backend persistence layer and an authentication system are planned for the production release.

## Problem statement

Small clubs often manage players, staff, fixtures, tactical notes, announcements, and league progress across scattered spreadsheets, chat threads, notebooks, and memory. That makes it easy to lose updates, duplicate work, and miss important details such as training load, upcoming events, or standings changes after a result is recorded.

The current product aims to reduce that fragmentation by giving one person a single place to manage the day-to-day operating view of a club. The immediate value is speed, visibility, and local control, not shared collaboration.

## Target users

| User type | Primary needs | Current fit |
| --- | --- | --- |
| Club manager | Set up team identity, maintain players and staff, keep records organized | Strong |
| Coach | Plan fixtures, log results, adjust lineups, track player attributes, manage discipline and MVP awards | Strong |
| Team administrator | Post announcements, maintain basic league table data, export backups | Strong |
| Players | Read-only self-service access, mobile-first usage, collaboration | Weak in current product |
| Club ownership or league admins | Cross-team reporting, centralized governance, audit workflows | Weak in current product |

## Product goals

1. Give one club operator a single workspace for the core weekly running of a team.
2. Keep essential club data available in the browser without requiring a backend setup.
3. Let match results update player and standings data with minimal manual effort.
4. Make tactical and training planning part of the same workflow instead of separate tools.
5. Provide lightweight backup and recovery options so local data is not fully trapped in browser storage.

## Non-goals

1. Multi-user collaboration with accounts, roles, and shared cloud storage.
2. League-wide verified data feeds or official integrations.
3. Financial operations, payments, registration compliance, or contracts.
4. Full medical, scouting, recruiting, or academy workflows.
5. Native mobile applications.

## Current product capabilities

### Onboarding and club identity

- Create a team profile with name, stadium, league, founded year, and manager profile.
- Add the manager as the first roster member during onboarding.
- Persist onboarding state locally so returning users reopen the same workspace.

### Dashboard

- Show a club summary with team identity, logo management, next event, latest announcements, recent form, standings progression, and player leaderboards.
- Let users upload a logo as a local image, use a preset icon, or paste an external logo URL.
- Surface quick navigation into schedule, tactics, and announcements workflows.
- **Squad Summary table** — full roster at a glance: jersey number, photo, position, goals, assists, cards (yellow/red), games played, MVP awards, and registration status with aggregate footer totals.

### Roster and staff management

- Add players with name, number, position, photo, bio, and generated starting attributes.
- Add staff members and management entries using the same underlying `Player` model.
- Search and filter roster entries.
- Compare two players side by side through a radar chart and attribute summary.
- Export the current club data as a JSON backup file.

### Player profile management

- Open a player detail modal from roster and dashboard areas.
- Edit player identity, photo, status, performance totals, and attribute values.
- View a generated five-match progression visualization based on current totals.

### Schedule and result logging

- Create upcoming matches and non-match events such as training sessions and meetings.
- Manage a calendar-style monthly view and a list view of upcoming or completed events.
- Record match results with scores, MVP, notes, and scorer attribution.
- Delete events from the schedule.
- Uses live team name (from onboarding) instead of hardcoded defaults.
- "Today" and date logic use real system date.

### Schedule page intelligence

- **Match Availability Tracker** — confirm Yes/No/Maybe per player for the next 2 upcoming fixtures. Color-coded pill breakdown with counts, persisted to localStorage. Tap to toggle, right-click to mark unavailable.
- **Upcoming Opponent Quick Intel** — shows opponent's standings position, points, W-D-L record, head-to-head history from completed games (W-D-L + GF/GA + Edge/Underdog/Even trend), and match notes.
- **Coach's Notes** — free-text tactical notes editor for the next upcoming match. Expandable textarea with Save/Cancel/Clear, persisted to localStorage per match ID.

### Standings management

- Maintain a league table for the user team and competitor clubs.
- Update standings automatically when a result is recorded from the schedule flow.
- Manually edit club rows or log external match results in the standings area.
- Save manual standings snapshots and optional Sunday auto-snapshots.
- Restore previous standings backups.
- Clear the league table with a pre-clear backup flow.

### Discipline & Match Awards

- **Disciplinary Records** — log player offences (Yellow, Second Yellow, Straight Red, Red) with date, opponent, match minute, and reason. Auto-updates player card counts.
- **Player Card Tally** — visual grid of per-player yellow/red card counts.
- **Offence History** — scrollable log table with delete capability.
- **Man of the Match Recorder** — award MVP to a player with date, opponent, and note. Creates persistent `MvpAwardRecord` history per player, increments `mvpAwards`.
- **MVP Leaderboard** — ranked top 8 players by MVP count.
- **Award History** — scrollable log table of all MVP awards across the squad.

### Announcements

- Create, categorize, and delete club announcements.
- Store announcement content locally and show recent items on the dashboard.

### Tactics planning

- Build a tactical board with match format, formation, play style, assignments, and lineup management.
- Persist lineup, captain and set-piece roles, coach information, tactical notes, dragged positions, and drawn paths locally.
- Support custom formation logic and visual board manipulation.

### Training planning

- **52-drill library** across all skill areas and positions:
  - Physical & Pace (Shuttle Run Sprints, Stamina Cardio, Acceleration, Plyometrics, Aerobic Base, Repeat Sprints, Mobility, Core Stability)
  - Technical (Shooting, Passing, Dribbling, Defending, Heading, Goalkeeping, Playmaking, Pressing, Tactical Shadow, Gym)
  - Position-specific: Forwards (8 drills), Midfielders (9 drills), Defenders (5 drills), Goalkeepers (5 drills)
  - Passing Foundation (7 drills): Triangle, Wall Pass, Overlap, One-Touch Grid, Long Ball Switch, Aerial Control, Pressure Cage
- **Professional Lucide vector icons** per drill with color-coded category badges (26 distinct colors).
- **Collapsible How-To Guide** per drill card: Equipment, Setup, Execution, Sets/Reps.
- **Focus Target filter pills**: All Skills, Forwards, Midfielders, Defenders, Goalkeepers, Speed, Shooting, Passing, Dribbling, Defending, Stamina/Physicality, Conditioning & Recovery.
- Weekly training schedule with drag-and-drop drill assignment and live load indicators per day.
- **9 preset training modes**: Heavy Fitness, Tactical Focus, Match Taper, Pre-Match Week, Recovery Week, Forward Focus, Midfield Focus, Defender Focus, Last Week.
- **Last Week preset** restores previous week's schedule from `localStorage` history.
- **Match badges** on weekly planner day cards showing League/Cup/Friendly fixtures with opponent name.
- Sync scheduled training days into the shared calendar as training events.
- Recommend development drills for a selected player based on weak attributes and position.
- Complete a development session to update player attributes.

## Primary user journeys

### Journey 1: First-time club setup

1. Open the app and enter onboarding.
2. Create team identity details.
3. Add the first manager or coach profile.
4. Enter the main workspace with initial standings seeded for the user team.

### Journey 2: Build the roster

1. Open the roster view.
2. Add staff and players.
3. Upload or select photos.
4. Review cards and open player profiles for edits.

### Journey 3: Plan the week

1. Open the schedule or training view.
2. Create upcoming fixtures, meetings, or training sessions.
3. Optionally assign drills to the weekly training schedule.
4. Let training events appear in the shared calendar.
5. Check match availability by tapping player Yes/No/Maybe status.

### Journey 4: Run matchday updates

1. Open an upcoming match.
2. Review opponent intel (standings position, H2H history) and coach's notes.
3. Record final score, MVP, scorers, and notes.
4. Update game status to completed.
5. Let team standings and player totals update automatically.
6. Log any disciplinary cards or award Man of the Match.

### Journey 5: Track season state

1. Review dashboard Squad Summary table for full roster stats.
2. Review MVP leaderboard and disciplinary records.
3. Edit standings if outside results need to be logged manually.
4. Save standings snapshots when needed.
5. Export a JSON backup for local safety.

## Functional requirements

### Core requirements

| Area | Requirement |
| --- | --- |
| Team setup | The app must let a user create a club identity and first manager profile before entering the main workspace. |
| Local persistence | The app must persist team, player, game, standings, tactics, training, schedule history, availability, coach notes, disciplinary, and MVP state in browser storage. |
| Roster management | The app must let the user add, edit, browse, and compare players and staff. |
| Scheduling | The app must let the user create and delete matches, training sessions, and meetings using live data. |
| Result logging | The app must let the user record match scores and update related player and standings data. |
| Standings | The app must support manual and automatic standings maintenance. |
| Discipline & Awards | The app must let the user log card offences and award MVP with persistent history. |
| Training | The app must support a 52-drill library with position-specific drills, How-To guides, 9 training presets, and match badges. |
| Match intelligence | The app must show opponent intel, match availability tracking, and coach's notes for upcoming fixtures. |
| Announcements | The app must let the user publish and remove club notices. |
| Tactics | The app must support a visual tactical board with lineup persistence and tactical notes. |
| Backup | The app must support JSON export and standings snapshot restore flows. |

### Detailed behavior

#### Team setup

- Onboarding must block entry into the main app until team info exists.
- The first manager profile must be added as a `Player` record so the roster is never empty after setup.
- Initial standings must be generated using the new team name.

#### Data persistence

- Team info, players, games, standings, and announcements must be saved in `localStorage`.
- Tactics state, training state, schedule history, match availability, and coach notes must also persist in `localStorage` using separate keys.
- Exported backups must include the major domain objects and export metadata.

#### Result cascade logic

- Logging a completed match must update the match record itself.
- Player season totals must update for goals, games played, MVP awards, and clean-sheet related counts where applicable.
- The user team standings row must update based on the recorded result.
- The opponent standings row must also update when a matching club exists in the table.

#### Training schedule sync

- Scheduled drills for a day must generate or refresh a training event in the shared games calendar for that date.
- Removing or changing weekly drills must update the synced training events for the active week.
- Weekly schedule history is archived to localStorage before each overwrite to enable Last Week restore.

#### Discipline and MVP workflows

- Logging an offence auto-increments the player's yellowCard or redCard count and appends a `PlayerOffense` record.
- Deleting an offence decrements the corresponding card count.
- Awarding MVP increments `mvpAwards` and appends an `MvpAwardRecord` (date, opponent, note) to the player's `mvpHistory`.

## Non-functional requirements

### Usability

- The product should be usable without backend setup.
- Main club tasks should be reachable from a tabbed top-level navigation.
- The app should remain understandable for non-technical users such as coaches and club organizers.

### Performance

- Main screens should load from local state quickly after the first render.
- Client interactions should not depend on a remote data API for the core local-first flows.

### Reliability

- The app should survive browser refreshes through local persistence.
- Destructive resets should ask for confirmation.
- Backup flows should exist for at least key club data and standings states.

### Accessibility

- The interface includes some semantic controls and labels, but accessibility is not yet consistently enforced across all interactive elements.
- Accessibility improvements are a requirement for future stabilization rather than a proven current strength.

### Security and privacy

- The current model assumes local, single-browser use rather than shared or regulated environments.
- Sensitive access control, authentication, and audit requirements are out of scope in the current implementation.

## Data model summary

| Entity | Purpose | Key fields |
| --- | --- | --- |
| `TeamInfo` | Club identity | `name`, `founded`, `stadium`, `coach`, `league`, `logoColor`, `logoUrl` |
| `Player` | Player or staff record | `id`, `name`, `number`, `position`, `bio`, `photoUrl`, season totals (points, assists, gamesPlayed, mvpAwards, yellowCards, redCards), `attributes`, `registrationStatus`, `offenses`, `mvpHistory` |
| `PlayerOffense` | Card/discipline record | `id`, `date`, `cardType`, `reason`, `gameOpponent`, `matchMinute` |
| `MvpAwardRecord` | Man of the Match award | `id`, `date`, `opponent`, `note` |
| `Game` | Match or scheduled event | `id`, `opponent`, `date`, `time`, `location`, `status`, `type`, optional scores, scorers, MVP, notes |
| `Standing` | League table row | `rank`, `teamName`, `played`, `won`, `drawn`, `lost`, `goalsFor`, `goalsAgainst`, `points`, `isUserTeam` |
| `Announcement` | Club notice | `id`, `title`, `content`, `date`, `category`, `author` |

## Dependencies and assumptions

1. The root project is the active product source of truth.
2. The app is intended for one club per browser workspace.
3. Browser `localStorage` is the main persistence layer for the MVP testing phase. A proper backend persistence system with user authentication will replace this in production.
4. External image URLs and user-uploaded base64 images are both accepted in the UI.

## Risks and constraints

1. The repository previously contained a duplicate and divergent `sports-team-manager/` copy, which has been removed.
2. Heavy use of `localStorage` creates practical storage limits and device-specific data isolation. This is accepted for MVP testing and will be addressed with backend storage in production.
3. Clearing browser storage or switching browsers can remove operational history unless the user exported a backup.
4. The current app has no authentication, multi-user model, or server-backed data ownership. This is by design for the MVP testing phase. Authentication and shared persistence will be implemented before production launch.
5. Some player progression and analytics views are generated from current totals rather than true historical event logs.

## Success criteria

The current product should be considered successful for its present scope if a club operator can:

1. Set up a team and return to the same workspace later.
2. Maintain a usable roster and staff directory.
3. Plan fixtures and weekly training activity with position-specific drills and how-to guides.
4. Record match results without manually recalculating standings.
5. Track player discipline and award MVPs with full history.
6. Review squad summary stats, opponent intel, and match availability before fixtures.
7. Publish internal announcements.
8. Export core data for backup.

## Open decisions

1. Should the product stay local-first, or move toward shared cloud data?
2. Should staff and players continue sharing the same domain model, or split into separate models later?
3. What level of mobile support is expected for real club use?
