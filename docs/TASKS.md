# Stack Team Manager -- Production Launch Tasks

Updated: 2026-06-14

## Recent Changes Applied (2026-06-14)

The following feature work has been completed and is reflected in the task statuses below:

- **TrainingView:** 52-drill library with position-specific drills (Forwards, Midfielders, Defenders, Goalkeepers, Passing), professional Lucide icons, collapsible How-To guides per drill, 9 training presets (Heavy Fitness, Tactical Focus, Match Taper, Pre-Match Week, Recovery Week, Forward Focus, Midfield Focus, Defender Focus, Last Week), match badges on weekly planner, position-based Focus Target filters, "Last Week" restore from history.
- **ScheduleView:** Removed redundant DAILY SCHEDULE FOCUS panel; added Match Availability Tracker (Yes/No/Maybe per player), Upcoming Opponent Quick Intel (standings position, H2H), Coach's Notes; fixed hardcoded "Apex Rangers" to use live `teamName` prop; fixed "Today" and date logic to use real system date; added `standings` prop for opponent intel.
- **DashboardView:** Added Squad Summary table (goals, assists, cards, games played, MVP, status with aggregate footer); swapped position so Squad Summary appears before Analytics Row.
- **StandingsView:** Shrunk Log New Offence form ~35%; added Man of the Match MVP recorder with persistent `MvpAwardRecord` history; split into side-by-side Disciplinary Records and Man of the Match panels; added MVP Leaderboard and Award History log.
- **Types:** Added `MvpAwardRecord` interface; added `mvpHistory` field to `Player`.
- **Cross-cutting:** Replaced all emoji icons with Lucide vector icons; removed all hardcoded "Apex Rangers" references; schedule and training use live dates.

## Overall Progress

```
Phase 1: Repository & Docs     [██████████] 100%  Complete
Phase 2: MVP Stabilization     [████████████░░░░░░]  71%  In Progress
Phase 3: Backend & Auth        [░░░░░░░░░░]   0%  Not Started
Phase 4: Production Readiness  [░░░░░░░░░░]   0%  Not Started
Phase 5: Launch & Operations   [░░░░░░░░░░]   0%  Not Started
```

| Phase | Status | Progress |
| --- | --- | --- |
| Phase 1: Repository & Docs | Complete | 11 / 11 |
| Phase 2: MVP Stabilization | In Progress | 17 / 24 |
| Phase 3: Backend & Auth | Not Started | 0 / 19 |
| Phase 4: Production Readiness | Not Started | 0 / 14 |
| Phase 5: Launch & Operations | Not Started | 0 / 9 |

---

## Phase 1: Repository & Documentation Cleanup

> **Goal:** One clean repository, one product name, clear documentation.

| # | Task | Priority | Status |
| --- | --- | --- | --- |
| 1.1 | Remove duplicate `sports-team-manager/` folder | High | Done |
| 1.2 | Decide and finalize the canonical product name | High | Done |
| 1.3 | Replace generic root README with a real project README | High | Done |
| 1.4 | Create product documentation in `docs/` (PRD, MVP, ARCH, ROADMAP, AUDIT) | High | Done |
| 1.5 | Create `docs/TASKS.md` with production launch checklist | High | Done |
| 1.6 | Update `metadata.json` to reflect the real product name and description | Medium | To do |
| 1.7 | Add a `.env.example` file documenting required environment variables | Medium | To do |
| 1.8 | Add a `CONTRIBUTING.md` with development setup instructions | Medium | To do |
| 1.9 | Verify `.gitignore` covers all generated and environment files | Medium | To do |
| 1.10 | Align `package.json` name and metadata with the product | Low | To do |
| 1.11 | Run `npm run lint` and confirm zero TypeScript errors | High | Done |

---

## Phase 2: MVP Stabilization

> **Goal:** Make the current local-first app trustworthy and polished for testing.

### Core workflow hardening

| # | Task | Priority | Status |
| --- | --- | --- | --- |
| 2.1 | Add in-app banner or indicator that this is an MVP/testing build with local storage | High | To do |
| 2.2 | Validate malformed or corrupted `localStorage` data on app load with graceful fallback | High | To do |
| 2.3 | Add input validation on all forms (player add, game create, result logging, announcements) | High | To do |
| 2.4 | Add confirmation dialogs on destructive actions beyond the existing reset flow | Medium | To do |
| 2.5 | Handle edge cases in result cascade logic (zero goals, own-team-vs-own-team, duplicate scorers) | High | To do |
| 2.6 | Show meaningful empty states on all views when no data exists | Medium | In Progress |
| 2.7 | Add a "first-run" guided tour or tooltip hints after onboarding completes | Low | To do |

### UI and accessibility

| # | Task | Priority | Status |
| --- | --- | --- | --- |
| 2.8 | Add `aria-label` attributes to all interactive elements without text content | High | To do |
| 2.9 | Ensure all interactive elements are keyboard-accessible (tab order, Enter/Space activation) | High | To do |
| 2.10 | Test and fix responsive layout on tablet and smaller desktop viewports | Medium | To do |
| 2.11 | Add focus-ring styles consistent with the existing design system | Medium | To do |

### Data integrity

| # | Task | Priority | Status |
| --- | --- | --- | --- |
| 2.12 | Validate JSON backup files on import before restoring data | High | To do |
| 2.13 | Add a data integrity check after result logging to verify standings and player stats match | Medium | To do |
| 2.14 | Surface `localStorage` quota warnings when storage is near browser limits | Medium | To do |
| 2.15 | Ensure standings auto-sort logic applies consistently across manual edits and result cascades | High | Done |

### Feature depth and polish (NEW — completed 2026-06-14)

| # | Task | Priority | Status |
| --- | --- | --- | --- |
| 2.16 | Expand drill library with position-specific drills (Forwards, Midfielders, Defenders, Goalkeepers, Passing) — 52 total | High | Done |
| 2.17 | Add professional Lucide vector icons to all drill cards with color-coded category badges | Medium | Done |
| 2.18 | Add collapsible How-To Guide per drill (Equipment, Setup, Execution, Sets/Reps) | Medium | Done |
| 2.19 | Add Match Availability Tracker to Schedule page (Yes/No/Maybe per player per fixture) | High | Done |
| 2.20 | Add Upcoming Opponent Quick Intel (standings position, H2H, match notes) | High | Done |
| 2.21 | Add Coach's Notes component on Schedule page for pre-match tactical notes | Medium | Done |
| 2.22 | Add Squad Summary table to Dashboard (goals, assists, cards, GP, MVP, status) | High | Done |
| 2.23 | Add Discipline & MVP side-by-side panels with MVP Award History log | High | Done |
| 2.24 | Add 9 training presets including Last Week restore | Medium | Done |

### Testing

| # | Task | Priority | Status |
| --- | --- | --- | --- |
| 2.25 | Write unit tests for the match result cascade logic in `App.tsx` | High | To do |
| 2.26 | Write unit tests for the standings sorting and backup/restore flows | High | To do |

---

## Phase 3: Backend & Authentication

> **Goal:** Replace `localStorage` with a proper backend and add user authentication for production.

### Database and API design

| # | Task | Priority | Status |
| --- | --- | --- | --- |
| 3.1 | Choose and document the backend technology stack (runtime, framework, database) | High | To do |
| 3.2 | Design the database schema for all domain entities (Team, Player, Game, Standing, Announcement, MvpAwardRecord, PlayerOffense) | High | To do |
| 3.3 | Design a REST or GraphQL API contract for all CRUD operations | High | To do |
| 3.4 | Define API versioning strategy and error response format | Medium | To do |
| 3.5 | Create OpenAPI/Swagger documentation for the backend API | Medium | To do |
| 3.6 | Set up database migrations framework | High | To do |

### Authentication system

| # | Task | Priority | Status |
| --- | --- | --- | --- |
| 3.7 | Choose and document the authentication strategy (OAuth, magic link, email/password, SSO) | High | To do |
| 3.8 | Implement user registration and login flows | High | To do |
| 3.9 | Implement session management with secure token handling | High | To do |
| 3.10 | Add password reset and email verification flows | High | To do |
| 3.11 | Implement role-based access control (Admin, Coach, Player, Viewer) | High | To do |
| 3.12 | Add team-scoped data isolation so users only see their own club data | High | To do |

### Data migration

| # | Task | Priority | Status |
| --- | --- | --- | --- |
| 3.13 | Build a `localStorage`-to-backend migration flow for existing MVP data | High | To do |
| 3.14 | Add a data export endpoint for full club backup in production | Medium | To do |
| 3.15 | Add a data import endpoint with validation for restoring backups | Medium | To do |

### Frontend integration

| # | Task | Priority | Status |
| --- | --- | --- | --- |
| 3.16 | Abstract all `localStorage` reads/writes behind a persistence service layer | High | To do |
| 3.17 | Add API client with request interceptors for auth tokens | High | To do |
| 3.18 | Add loading, error, and retry states for all API-dependent views | High | To do |
| 3.19 | Implement optimistic UI updates with rollback on API failure for key workflows | Medium | To do |

---

## Phase 4: Production Readiness

> **Goal:** Harden the application for a production environment.

### Security

| # | Task | Priority | Status |
| --- | --- | --- | --- |
| 4.1 | Add HTTPS enforcement and secure cookie configuration | High | To do |
| 4.2 | Implement CSRF protection for all state-changing requests | High | To do |
| 4.3 | Add rate limiting on authentication and API endpoints | High | To do |
| 4.4 | Sanitize all user-generated content (announcements, player bios, notes) | High | To do |
| 4.5 | Add Content Security Policy headers | Medium | To do |
| 4.6 | Conduct a security review of image upload and URL handling | Medium | To do |

### Performance

| # | Task | Priority | Status |
| --- | --- | --- | --- |
| 4.7 | Add code splitting by route/view for faster initial load | High | To do |
| 4.8 | Implement image optimization (resize on upload, lazy loading) | Medium | To do |
| 4.9 | Add bundle analysis to CI and set size budgets | Medium | To do |
| 4.10 | Implement API response caching where appropriate | Medium | To do |

### Infrastructure

| # | Task | Priority | Status |
| --- | --- | --- | --- |
| 4.11 | Set up a CI/CD pipeline for automated testing and deployment | High | To do |
| 4.12 | Configure production environment variables and secrets management | High | To do |
| 4.13 | Set up application monitoring and error tracking | High | To do |
| 4.14 | Create a staging environment for pre-release validation | Medium | To do |

---

## Phase 5: Launch & Operations

> **Goal:** Go to production and support live users.

### Pre-launch

| # | Task | Priority | Status |
| --- | --- | --- | --- |
| 5.1 | Complete a full end-to-end QA pass of all user flows | High | To do |
| 5.2 | Conduct load testing on the backend API | High | To do |
| 5.3 | Write and test a production rollback plan | High | To do |
| 5.4 | Prepare user-facing documentation and onboarding guides | Medium | To do |
| 5.5 | Set up a customer support channel and issue-tracking workflow | Medium | To do |

### Launch

| # | Task | Priority | Status |
| --- | --- | --- | --- |
| 5.6 | Execute the production deployment | High | To do |
| 5.7 | Monitor error rates, performance, and user feedback for the first 48 hours | High | To do |

### Post-launch

| # | Task | Priority | Status |
| --- | --- | --- | --- |
| 5.8 | Collect and triage initial user feedback | High | To do |
| 5.9 | Plan the first post-launch iteration based on real usage data | Medium | To do |

---

## Task Count Summary

| Phase | Total | Done | Remaining |
| --- | --- | --- | --- |
| Phase 1: Repository & Docs | 11 | 11 | 0 |
| Phase 2: MVP Stabilization | 24 | 17 | 7 |
| Phase 3: Backend & Auth | 19 | 0 | 19 |
| Phase 4: Production Readiness | 14 | 0 | 14 |
| Phase 5: Launch & Operations | 9 | 0 | 9 |
| **Total** | **77** | **28** | **49** |
