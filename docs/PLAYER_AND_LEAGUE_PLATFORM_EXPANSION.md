# Player and League Platform Expansion

Updated: 2026-07-09

Status: Proposed platform plan (pre-implementation)

## Source of truth

This document is the reference plan for expanding Dumala from a single Coach
workspace into a three-persona platform. It defines scope, order, and intent —
not promised release dates. Sequencing tracks the existing phase model in
[docs/ROADMAP.md](ROADMAP.md); financial mechanics reuse and extend
[docs/PAYMENTS_LEDGER_IMPLEMENTATION_PLAN.md](PAYMENTS_LEDGER_IMPLEMENTATION_PLAN.md);
cloud, identity, and durability foundations build on the Phase 3 documents
([ADR_PHASE_3_CLOUD_PLATFORM.md](ADR_PHASE_3_CLOUD_PLATFORM.md),
[PHASE_3_DURABLE_SCHEMA_DESIGN.md](PHASE_3_DURABLE_SCHEMA_DESIGN.md),
[PHASE_3_ACCOUNT_LIFECYCLE.md](PHASE_3_ACCOUNT_LIFECYCLE.md),
[PHASE_3_CLOUD_SYNC_IMPLEMENTATION_PLAN.md](PHASE_3_CLOUD_SYNC_IMPLEMENTATION_PLAN.md)).

When priorities or scope change, update this file and mirror any roadmap-visible
changes into ROADMAP.md and the in-app Roadmap Snapshot.

## 1. Executive summary

Expand Dumala into three secured products that share one identity and
entitlement platform:

- **Coach App — `#/app`:** the existing club-management workspace, extended with
  team chat, tournament registration, match-stat submission, and League
  announcements.
- **Player App — `#/player`:** a free personal experience for training, fitness,
  schedule, achievements, and team communication.
- **League Owner App — `#/league`:** a paid, price-pending platform for season
  oversight, independent tournament operations, registration, finance,
  statistics, and reporting.

One account has one **persona**. Existing accounts migrate to `coach`. New users
choose a persona once during registration; in v1 only Dumala administrators can
change it. Access is resolved server-side after sign-in and gated by
**entitlements**, never by client-trusted routes or plan-name string matching.

### Design principles

1. **One identity, separated concerns.** Account persona, club membership, and
   League operational roles are independent axes. A person can be a coach in one
   club and appear on a League roster without those roles leaking into each
   other.
2. **Verified vs. self-reported is always visible.** Official club and League
   records stay staff-controlled. Player self-recorded activity is stored and
   displayed as clearly distinct from verified data.
3. **Seasons are containers, events are independent.** A season groups tournaments
   and competitions for history and reporting; it does not impose shared
   operational rules on them.
4. **Every season starts empty.** No automatic copying of clubs, rosters, rules,
   or configuration between seasons.
5. **Sensitive changes are atomic and audited.** Sporting, financial, and
   identity mutations run in server functions and leave immutable before/after
   audit records.
6. **Youth safety is a first-class constraint,** not a later add-on: guardian
   consent, privacy-aware views, and moderated communication apply from the
   Player foundation onward.

## 2. Personas and routing

| Persona  | Route      | Price          | Primary purpose                                   |
| -------- | ---------- | -------------- | ------------------------------------------------- |
| Coach    | `#/app`    | existing plans | Club and squad management (current product)       |
| Player   | `#/player` | free           | Personal training, fitness, schedule, team comms  |
| League   | `#/league` | price-pending  | Season, tournament, finance, and reporting ops    |

- The persona is stored on the account, not inferred from the URL. After
  sign-in, the server resolves the authorized destination and rejects
  cross-persona access to another dashboard or its protected records, including
  through modified URLs or direct requests.
- League pilot access is admin-granted while checkout enforcement stays
  feature-flagged. League pricing will exceed Premium but remains configurable
  and unpublished until production approval.

## 3. Player App

Free personal experience. Official club and League records remain
staff-controlled; self-recorded activity is visibly distinguished from verified
data throughout.

- **Profile:** personal and football details, team memberships, verified stats,
  achievements, privacy controls, and guardian consent.
- **Team Schedule:** fixtures, training, meetings, and League activities with RSVP
  availability, reminders, and calendar filters.
- **Solo Drills Library:** filter by position, skill, difficulty, equipment,
  duration, and goal; favorites, instructions, videos, completion history, and
  recommended drills.
- **Team Group Chat:** the official team channel plus coach-created topic and
  announcement channels. The same module renders in the Coach App with
  moderation, attachments, reporting, read state, mute controls, and youth
  safeguards.
- **Fitness Tracker:** phone or manual tracking for football, running, walking,
  cycling, strength, and custom workouts — storing duration, estimated calories,
  distance or repetitions, splits, perceived exertion, and notes.
- **Badges:** verified and self-recorded categories for attendance, consistency,
  drills, fitness streaks, matches, assessment improvement, tournaments, and
  team milestones.
- **Workout Timer:** stopwatch, countdown, laps/splits, interval sets, rest
  periods, sound/vibration cues, and saved workout summaries.
- **Progress Dashboard:** weekly activity totals, personal streaks, drill
  history, badge progress, assessment trends, and upcoming goals.
- **Notifications:** schedule changes, invitations, announcements, chat activity,
  badge unlocks, registration issues, and consent actions.

### Player onboarding and identity

- Players join by **invite-and-claim**: a coach or League adds a roster entry,
  and the player claims it to link a real account, or a player self-registers and
  requests to join a team. Claiming is an atomic server operation that prevents
  duplicate or hijacked links.
- Minors require guardian consent before communication, fitness sharing, and
  public profile fields are enabled. Consent state gates the relevant features.

## 4. League Owner App

### 4.1 League and season management

- Create League profiles with branding, contacts, policies, venues, staff, and
  public information.
- Create seasons with name, year, dates, status, registration periods, roster
  deadlines, transfer windows, eligibility rules, fee templates, and document
  requirements.
- Seasons are reporting and historical containers; tournaments and competitions
  stay operationally independent with their own teams, formats, rules, schedules,
  and registration.
- Season lifecycle: **Draft → Registration open → Active → Completed → Archived.**
- New seasons start completely fresh — no automatic copying of clubs, rules,
  rosters, or configuration.
- The season dashboard shows registered clubs and players, active events,
  fixtures, payments, discipline, unresolved issues, and operational readiness.
- Block closing a season while it holds unresolved disputes, incomplete fixtures,
  unverified match statistics, or unreconciled required payments.
- Archive completed seasons as read-only while preserving searchable history and
  reports.

### 4.2 Season statistics and recognition

- Aggregate verified statistics across selected season events without merging
  events that use incompatible rules.
- **Team statistics:** matches, wins, draws, losses, goals for/against, goal
  difference, points, form, home/away records, and final placement.
- **Player statistics:** appearances, starts, minutes, goals, assists,
  yellow/red cards, clean sheets, and player-of-the-match awards.
- Coaches submit lineups and match events; assigned League staff verify them
  before official leaderboards and season totals update.
- Maintain correction reasons and immutable before/after audit history.
- Provide season leaderboards, club comparisons, participation trends, player
  availability, and event-by-event breakdowns.
- Configurable season awards support statistical winners and panel-selected
  awards, with approval, publication, downloadable certificates, and permanent
  award history.
- Preserve each player's club association at the time of every match so
  transfers never rewrite historical statistics.

### 4.3 Coach, player, and roster management

- Search, filter, invite, approve, suspend, transfer, release, and inspect
  coaches and players.
- Maintain season-specific registrations independently from permanent club
  profiles.
- Support roster limits, registration deadlines, eligibility validation, roster
  locking, transfer windows, guest-player rules, release records, and
  League-approved exceptions.
- Track required documents, expiry dates, verification status, rejection
  reasons, and renewal reminders.
- Detect duplicate player registrations across clubs and surface them for review.
- Use privacy-aware views so League personnel see only the information required
  for competition administration.

### 4.4 League Database

- Central database for seasons, independent events, clubs, teams, coaches,
  players, venues, registrations, documents, fixtures, results, statistics,
  discipline, awards, payments, and historical participation.
- Global search and saved filters for common operational queries.
- Duplicate detection for clubs, coaches, players, and tournament applications.
- Bulk import with validation preview and row-level error reporting.
- Controlled CSV/PDF exports with export audit records.
- Data-quality dashboard for incomplete profiles, expired documents, duplicate
  identities, missing statistics, and unresolved records.

### 4.5 Tournament registration

- Create unique, revocable, expiring, or capacity-limited registration links per
  event.
- Coaches can sign in or create a Coach account from the registration experience.
- A full application includes club details, team category, roster, staff,
  required documents, terms, waivers, and fee acknowledgement.
- Support draft applications, progress saving, submission, requested revisions,
  approval, rejection, withdrawal, and waitlisting.
- Show coaches a registration checklist and outstanding requirements.
- Approval creates the competition entry without duplicating the club or coach
  account.
- Generate confirmation records and notify both League staff and the submitting
  coach.

### 4.6 Tournament formats and scheduling

- Support round robin, single elimination with automatic byes, and group stage
  followed by knockout.
- Generate seeded or random draws with a preview before publication.
- Validate team counts, duplicate placements, group balance, venue capacity,
  rest periods, and schedule conflicts.
- Allow controlled redraws before publication; post-publication changes require a
  reason and audit record.
- Manage fixtures, venues, pitches/courts, meetings, deadlines, ceremonies, and
  other activities in a shared calendar.
- Provide list, day, week, month, venue, team, and event views.
- Detect club, venue, and time conflicts before saving.
- Notify affected coaches and players when published schedules change.

### 4.7 On-the-Day command center

- Live summary of team check-in, player eligibility, missing requirements,
  current and upcoming and completed matches, venues, delays, incidents, and
  announcements.
- QR or code-based team check-in with manual fallback.
- Quick access to approved rosters, match sheets, score entry, cards, incidents,
  and result confirmation.
- Automatically advance verified winners through brackets.
- Operational alerts for late teams, venue conflicts, delayed matches, missing
  officials, disputed results, and medical incidents.
- League Owners assign tournament-scoped roles such as event administrator, table
  official, and scorekeeper.
- Offline-tolerant match-day queue with conflict resolution when connectivity
  returns, reusing the mutation-queue approach from
  [PHASE_3_OFFLINE_MUTATION_QUEUE.md](PHASE_3_OFFLINE_MUTATION_QUEUE.md).

### 4.8 Results and tournament statistics

- Coaches submit results, lineups, and match events.
- Results may update standings immediately, while player statistics stay
  provisional until League staff verification.
- League staff can correct, dispute, verify, lock, and reopen records with
  mandatory reasons.
- Recalculate affected tables, brackets, team form, player totals, and season
  aggregates atomically.
- Track top scorers, assists, cards, clean sheets, appearances, minutes, and
  awards.
- Clearly distinguish provisional, verified, disputed, corrected, and locked
  records.

### 4.9 Ledger and payment dashboard

Extends the Squad ledger model to League scope.

- Configure season, event, registration, penalty, venue, and miscellaneous fees.
- Generate invoices with due dates and club or team responsibility.
- Record cash, bank transfer, e-wallet, cheque, waived, and adjusted payments
  manually.
- Support partial payments, receipts, adjustments, reversals, outstanding
  balances, overdue reminders, and internal notes.
- Reconcile totals by season, event, club, fee type, and date range.
- Export transaction and balance reports.
- Online collection and payment-gateway integration remain deferred, consistent
  with [PAYMENTS_LEDGER_IMPLEMENTATION_PLAN.md](PAYMENTS_LEDGER_IMPLEMENTATION_PLAN.md).

### 4.10 Announcements and communication

- Publish announcements to entire seasons, selected events, divisions, clubs,
  coaches, players, or operational staff.
- Show announcements in League, Coach, and relevant Player dashboards using the
  existing admin-announcement pattern.
- Optional email delivery includes scheduling, expiry, delivery logs, failures,
  retries, and unsubscribe/consent handling where applicable.
- Require acknowledgement for critical notices such as schedule changes,
  registration deadlines, and policy updates.
- Preserve read and acknowledgement status for League reporting.
- Team chat stays club-scoped; League announcements never expose private team
  channels.

### 4.11 Reports

- Season summary and comparison.
- Club, team, coach, and player participation.
- Registration status and outstanding requirements.
- Roster eligibility, transfer, and exception history.
- Fixtures, results, standings, and bracket outcomes.
- Team and player statistical leaders.
- Discipline and incident summaries.
- Financial balances, collections, overdue fees, and adjustments.
- Attendance, check-in, venue utilization, and schedule delays.
- Announcement delivery and acknowledgement.
- Configurable filters, saved report presets, CSV/PDF export, and audit logging.

## 5. Platform architecture

- Extend `user_profiles` with persona, onboarding status, and account state.
- Keep account persona separate from club membership and League operational
  roles.
- Resolve the authorized destination server-side after sign-in.
- Introduce **entitlement-based access** for League features; do not authorize on
  plan-name comparisons.
- Add domain entities for seasons, independent events, registrations,
  eligibility, documents, rosters, transfers, brackets, groups, fixtures, match
  events, verified statistics, awards, event staff, invoices, payments,
  announcements, chat, fitness activities, drill completion, badges, and consent.
- Use atomic server functions for player claiming, registration approval, roster
  locking, draw generation, schedule publication, result correction, statistic
  verification, bracket advancement, badge awarding, and financial reconciliation.
- Enforce Supabase row-level security for persona, organization, competition,
  club, team, player, guardian, and delegated event access.
- Add immutable audit records for sensitive administrative, sporting, financial,
  and identity changes.
- Use background jobs for email delivery, reminders, report generation, badge
  evaluation, and aggregate-statistic rebuilding.
- Validate all persisted structures with Zod schemas and keep local-first
  behavior for the Coach and Player experiences where offline use is expected,
  syncing through the Phase 3 cloud path.

### 5.1 Core entity relationships (reference)

```
Account (persona: coach | player | league)
  ├─ ClubMembership        (coach ↔ club, independent of persona)
  ├─ LeagueRole            (delegated, event- or season-scoped)
  └─ GuardianConsent       (for minor players)

League ─┬─ Season ─┬─ Event (tournament/competition, independent rules)
        │          │   ├─ Registration ── Application ── Documents
        │          │   ├─ Roster (season-scoped) ── Transfer/Release records
        │          │   ├─ Group / Bracket ── Fixture ── MatchEvent
        │          │   ├─ Result (provisional | verified | locked)
        │          │   └─ EventStaff (scoped roles)
        │          ├─ SeasonAggregate (verified stats only)
        │          ├─ Award / Certificate
        │          └─ Invoice ── Payment (ledger entries)
        └─ Venue

Player ─┬─ FitnessActivity (self-reported)
        ├─ DrillCompletion
        ├─ Badge (verified | self-recorded)
        └─ TeamChatMembership
```

## 6. Delivery sequence

Each stage is independently shippable behind feature flags and entitlements.

1. **Identity and authorization:** personas, migration, routing, dashboard
   shells, permissions, audit foundation, and League pilot entitlements.
2. **Player foundation:** profile, invite-and-claim, guardian consent, schedule,
   drills, timer, progress, and notifications.
3. **Shared communication:** Coach/Player Team Chat, moderation, dashboard
   announcements, and email delivery.
4. **League and season foundation:** League Database, fresh-season lifecycle,
   independent events, roles, venues, eligibility rules, and documents.
5. **Registration and rosters:** unique links, Coach account creation,
   applications, approvals, roster controls, and transfer windows.
6. **Tournament engine:** formats, draws, brackets, groups, fixtures, conflict
   detection, and calendar publication.
7. **Live operations:** On-the-Day command center, delegated staff, check-in,
   match sheets, results, incidents, and offline queue.
8. **Statistics and awards:** verification workflow, event and season aggregates,
   leaderboards, awards, and certificates.
9. **Finance and reporting:** ledger, invoices, receipts, reconciliation,
   exports, operational dashboards, and season closeout.
10. **Player engagement:** fitness tracking, badges, verified achievements,
    streaks, and personalized recommendations.
11. **Production hardening:** accessibility, performance, security review,
    migration rehearsal, monitoring, retention policies, support procedures, and
    staged rollout.

## 7. Test and acceptance plan

- Existing Coach accounts retain their workspaces and reach the current Coach
  dashboard.
- Personas cannot access another dashboard or its protected records through
  modified URLs or requests.
- Fresh seasons contain no copied configuration or participants.
- Season state changes enforce registration, active-operation, completion, and
  archival rules.
- Independent events retain their own rules while contributing only compatible
  verified statistics to season reports.
- Transfers preserve historical club attribution.
- Registration links correctly enforce expiration, capacity, revocation,
  duplicate prevention, and required fields.
- Roster limits, deadlines, locks, eligibility, transfer windows, and approved
  exceptions behave correctly.
- Draw generation produces valid groups, byes, fixtures, and knockout
  progression.
- Schedule conflict detection covers teams, venues, pitches, and minimum rest
  periods.
- Result corrections atomically update tables and brackets with complete audit
  history.
- Unverified player statistics cannot appear in official leaderboards or awards.
- Delegated event staff cannot access other events or League administration.
- Fitness estimates, badge sources, chat permissions, guardian consent, and youth
  protections are clearly enforced.
- Ledger balances reconcile across partial payments, adjustments, reversals, and
  waivers.
- Reports match their source records and respect access and export permissions.
- Cover all critical flows with database/RLS tests, service tests, component
  tests, end-to-end persona journeys, accessibility checks, offline recovery
  tests, and migration rollback tests.

## 8. Risks and mitigations

| Risk                                              | Mitigation                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------- |
| Cross-persona data exposure                       | Server-side destination resolution + RLS + entitlement checks; URL tests.  |
| Transfers rewriting history                       | Snapshot club association per match; aggregates read snapshots, not live.  |
| Statistic disputes and corrections                | Provisional/verified states, mandatory reasons, atomic recompute, audit.   |
| Youth-safety gaps                                 | Consent gating from Player foundation; moderated chat; privacy-aware views.|
| Offline match-day data loss                       | Offline-tolerant queue with conflict resolution on reconnect.              |
| Migration regressions for existing coaches        | Default-to-`coach` migration, rehearsal, rollback tests before rollout.    |
| Scope creep before revenue is proven              | Feature-flagged, entitlement-gated, admin-granted League pilot.            |

## 9. Assumptions and deferred features

- Player accounts remain free.
- League pricing will exceed Premium but stays configurable and unpublished until
  production approval.
- League pilot access is admin-granted while checkout enforcement remains
  feature-flagged.
- Seasons group independent events for history and reporting rather than imposing
  shared operational configuration.
- Every new season starts empty.
- Phone/manual fitness tracking ships before smartwatch or health-platform
  integrations.
- Online payment collection, direct messages, social feeds, public recruitment
  profiles, live GPS tracking, biometric interpretation, and advanced tournament
  formats remain deferred.
