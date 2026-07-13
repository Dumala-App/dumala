# Dumala Feasibility Study

Updated: 2026-07-02

## Core Finding

Dumala's main selling point to coaches is:

**Run your football team's weekly operations and player development from one coaching workspace, even when internet access is unreliable.**

The sharper version:

**Dumala saves coaches from scattered spreadsheets, chats, notebooks, and guesswork by combining team management, match preparation, training, tactics, payments, standings, and player assessment in one football-specific app.**

That is the heart of the product. The emotional sell is not "software." It is:

**Less admin. Better preparation. Clearer player development. More time coaching.**

## What The App Currently Does Well

Dumala is already a serious football operations workspace, not a thin prototype. The current product includes:

- Team onboarding and club identity.
- Player and staff roster management.
- Player traits, measurements, attributes, photos, and placeholders.
- Match scheduling, availability, opponent context, and coach notes.
- Result logging that updates standings and player stats.
- Discipline tracking and Man of the Match history.
- Tactics board with formation, lineup, roles, notes, and position-aware auto-fill.
- Training planner with 85 drills, guides, presets, and weekly planning.
- FPRDS player assessment system with Full and Quick assessments.
- Role and age-group scoring for ST, W, CM, CDM, FB, CB, and GK.
- Assessment history, progress charts, comparisons, deltas, and development plans.
- Squad payments ledger for fees, payments, balances, overdue tracking, and void history.
- Bulletins, updates, feedback, backup/restore, PWA install, and offline shell.
- Cloud/collaboration foundation in code: Supabase, roles, invitations, RLS, activity history, and controlled edits.

The app is strongest where it connects workflows: schedule to results, results to standings, assessments to development plans, training to weekly calendar, players to tactics, and payments to roster.

## Main Selling Point

The winning pitch to coaches should not be "Dumala has many features." The pitch should be:

**Dumala is the coach's weekly command center.**

A coach can open the app and answer:

- Who is in my squad?
- Who is available?
- What is our next match?
- What did we train this week?
- What formation are we using?
- Who should start?
- What happened in the last match?
- Who is improving?
- Who needs development work?
- Who has unpaid fees?
- What do staff or players need to know?

That is powerful because most grassroots coaches are doing this across Messenger, WhatsApp, Google Sheets, notebooks, memory, and scattered files.

## Best Initial Market

The strongest initial market is not elite professional clubs. It is:

- Grassroots football teams.
- Amateur clubs.
- School teams.
- Academies.
- Youth coaches.
- Local tournament teams.
- Filipino football organizers.
- Coaches managing one squad with limited admin help.

The Philippines-first angle is smart. It gives the product a specific cultural and market wedge instead of competing generically against global sports management platforms.

## Feasibility Study

### Product Feasibility: High

The app already has enough practical value for beta coaches. The current feature set covers real weekly workflows. It is especially feasible as a local/offline-first beta and private coach tool.

### Technical Feasibility: Moderate To High

The foundation is solid: React, TypeScript, Vite, Zod validation, tests, PWA, backup/restore, Supabase architecture, RLS tests, and documented production gates.

The main caution is product-state clarity. Some docs still describe the MVP as local-only, while the task tracker and code show cloud/collaboration foundations. Marketing must not overclaim production cloud collaboration until launch approvals and external beta readiness are complete.

### Commercial Feasibility: Promising, But Must Be Validated

Coaches will value the product if it removes admin pain quickly. Willingness to pay may be limited for individual grassroots coaches, so pricing should likely start low for solo coaches and move upward for clubs, academies, and multi-squad organizations.

The business model is reasonable as SaaS, but the buyer matters. A solo grassroots coach is likely price-sensitive and may compare Dumala against WhatsApp, Google Sheets, notebooks, and memory. A club, academy, school, or paid coaching program has a stronger reason to subscribe because Dumala can improve staff coordination, parent-facing professionalism, player-development proof, and retention. Even so, the public offer should stay simple: Free and Premium monthly subscription.

The strongest subscription trigger is not the number of modules. It is whether Dumala saves time every week and makes the coach or club look more organized.

### Operational Feasibility: Beta-Ready, Not Yet Broad Public-Scale

Before wide launch, Dumala needs clearer onboarding, benchmark validation, production cloud approval, privacy posture for minors, and simple support flows.

## Biggest Risks

1. Too many features can blur the message. Coaches need one clear reason to try it.
2. FPRDS must stay beta until practitioner review is complete.
3. Cloud/collaboration should be marketed carefully. The code foundation is present, but production gates and operational approval matter.
4. Grassroots users may resist admin-heavy tools. The app must feel faster than a spreadsheet within the first 10 minutes.
5. Privacy is serious. Player data may involve minors, payments, assessments, and contact details.
6. The app needs a tighter "first week success" flow. A coach should get value after adding 8-12 players and one upcoming match.

## Perfect Future Vision

The perfect future for Dumala is:

**A football operating system for Filipino grassroots clubs, academies, and coaches.**

In that future, Dumala becomes the trusted place where a club manages:

- Multiple squads and age groups.
- Coaches, staff, players, parents, and administrators.
- Fixtures, attendance, availability, training, tactics, results, and standings.
- Player development history across seasons.
- FPRDS assessments with validated benchmarks.
- Downloadable player reports and development plans.
- Public player profiles with consent.
- Trial shortlists and draft-style comparisons.
- Club public profiles and achievements.
- A practical coaching knowledge library with session-ready tactical and development ideas.
- Payments, fees, reminders, and financial summaries.
- Season archives and year-to-year continuity.

The highest-value future product is not just team management. It is:

**A trusted development record for players and a practical operating layer for clubs.**

That gives Dumala two growth engines:

1. Coaches use it every week to run the team.
2. Players and clubs care about the records, assessments, and profiles created over time.

## Recommended Product Direction

### Short Term: Trust And Adoption

- Make onboarding faster with a sample workspace or demo mode.
- Create a "first match week" guided setup.
- Add downloadable assessment reports.
- Complete practitioner FPRDS benchmark review.
- Make backup/cloud status extremely clear.
- Prepare a coach-facing beta landing page.
- Build templates for common team setups.

### Medium Term: Collaboration And Retention

- Cloud account rollout for trusted beta clubs.
- Staff roles and invitations in visible UI.
- Shared bulletins and shared schedule.
- Parent/player view-only access later.
- Attendance and availability history.
- Season archive.

### Long Term: Network Effects

- Public player profiles.
- Public club pages.
- Player comparison and trial shortlists.
- Academy reports.
- Expanded coaching knowledge library.

## Marketing Approach

Lead with the coach pain, not the feature list.

Good positioning:

**The football team workspace built for coaches who are tired of managing everything through chats and spreadsheets.**

Alternative:

**Plan the week, manage the squad, assess players, and track progress from one football-specific workspace.**

Avoid leading with "AI," "data platform," or "ERP." Coaches need practical language.

Best messages:

- Spend less time organizing, more time coaching.
- Your roster, fixtures, tactics, training, results, and player development in one place.
- Built for grassroots football.
- Works on laptop, tablet, and installed web app.
- Designed for Philippine coaches and clubs.
- Create player development records you can actually compare over time.

## Traction Strategy

Start narrow and local.

### 1. Recruit 10-20 Real Coaches For A Private Beta

Ask them to use Dumala for one complete week: add roster, schedule match/training, plan tactics, log result, and run one assessment.

### 2. Turn Feedback Into Proof

Collect quotes, screenshots, before/after admin pain, and workflow stories.

### 3. Create A Demo Club Workspace

Let coaches experience the app without building everything from scratch.

### 4. Partner With Grassroots Tournaments, Schools, And Academies

Offer free setup for early partner clubs in exchange for feedback and testimonials.

### 5. Build Content Around Coaching Workflows

Examples:

- How to organize your football team without spreadsheets.
- How to assess youth football players consistently.
- Match week checklist for grassroots coaches.
- How to plan a 4-week development block.

### 6. Use Facebook Groups And Local Football Communities

For the Philippines, Facebook is likely more important than Product Hunt or Hacker News. Coaches, parents, and local clubs are active there.

### 7. Make The First Offer Simple

**Free beta for one team. We help you set up your roster.**

### 8. Create Shareable Reports

Downloadable player assessment reports will naturally spread to players, parents, and other coaches.

## Monetization Direction

A sensible packaging path:

- **Free:** One team, local workspace, basic roster, schedule, training, tactics, and backup/export value.
- **Premium monthly subscription:** Stronger assessment workflows, downloadable reports, guided planning, cloud sync when production-approved, communication tools, and club/academy-ready reporting as those capabilities become available.

Do not rush pricing until 10-20 coaches have used it for real match weeks. The most likely paying customers are academies and clubs, not individual volunteer coaches.

### Reasonable Pricing Hypothesis

These ranges are hypotheses for interviews and beta validation, not final prices:

| Choice | Likely monthly range | What must be true |
| --- | ---: | --- |
| Free | USD 0 | Coaches can try one team with enough value to trust the workflow. |
| Premium monthly | USD 9-15 initial target | Reports, assessments, development tracking, guided planning, and weekly time savings are used often enough to justify paying. |

For an individual coach, the practical Premium target is likely USD 9-15 per month. Higher future pricing for clubs and academies should be validated later, after shared staff workflows, parent/player reporting, and cloud collaboration create enough extra value.

### Subscription Selling Points

- Save hours on weekly admin.
- Plan sessions and match days faster.
- Track player development in a structured way.
- Produce reports that can be shared with players, parents, or club leaders.
- Run a team or academy with a more professional operating rhythm.
- Keep the coach in control while the system assists with planning, tactics, and assessment records.

The clearest subscription promise is:

**Run your football team like a professional academy.**

## Best Next Moves

1. Make a coach-facing one-page pitch with two choices: Free and Premium monthly subscription. Completed in-app at `#landing`.
2. Design the first-week success flow: add 8-12 players, schedule one event, prepare tactics, log one result, and save one assessment.
3. Add a guided demo/sample workspace.
4. Finish downloadable FPRDS reports.
5. Get two qualified football practitioners to review FPRDS benchmarks.
6. Run a 10-club private beta.
7. Track activation: roster added, first event scheduled, first result logged, first assessment saved, report downloaded.
8. Turn the strongest beta story into a case study.

## Bottom Line

Dumala's strongest future is not as "another team app." Its strongest future is as the **Philippines-first football coaching workspace** that connects weekly operations with player development.

The app should be marketed around one promise:

**Dumala helps coaches run the team today and build better player development records for tomorrow.**
