# Stack Team Manager Codebase Audit

Updated: 2026-06-14

## Executive summary

The repository contains a functional sports club management web app with a deep feature set for a single-team local workspace. The strongest parts of the product are the local-first club workflow, the broad operational coverage, the match-result cascade, the new match intelligence features (availability tracker, opponent intel, coach's notes), and the expanded 52-drill training library with How-To guides.

The largest risks remain structural rather than visual: most persistence depends on `localStorage`, and the AI feature depends on an endpoint that is not clearly represented in the visible server code. The "Apex Rangers" hardcoding and mock date issues have been resolved; the products now use live data throughout.

## What was reviewed

The audit reviewed:
1. Root application structure and build files.
2. Main React entry and app shell.
3. Core feature modules under `src/components/`.
4. Type definitions and app-level state behavior.
5. The visible server wrapper.
6. Metadata and README files.
7. Recent features added: Match Availability Tracker, Opponent Intel, Coach's Notes, Squad Summary, Discipline & MVP panels, expanded drill library, training presets.

## Repository overview

### Observed structure
- Root application with active source files and build output.
- No duplicate app copies (the `sports-team-manager/` copy was removed).

### Immediate conclusion
The root application is the active runnable target with a single source of truth.

## What is implemented well

### Broad product coverage
The app already supports:
1. Onboarding and team identity.
2. Roster and staff management.
3. Player profile editing.
4. Match and event scheduling.
5. Match result recording.
6. Automatic standings updates.
7. **Squad Summary table** (9-column roster overview with aggregate footer).
8. **Match Availability Tracker** (Yes/No/Maybe per player per fixture, persisted).
9. **Upcoming Opponent Quick Intel** (standings position, H2H, match notes).
10. **Coach's Notes** (tactical notes editor per upcoming match).
11. **Discipline & Match Awards** (offence logging, MVP awards with history).
12. Announcements.
13. Tactics planning.
14. **Training planning** — 52 drills with position-specific sets, Lucide icons, How-To guides, 9 presets including Last Week restore, match badges on planner.
15. Backup-related flows.

### Coherent main workflow
The best implemented product loop is:
1. Set up the team.
2. Build the roster.
3. Schedule fixtures.
4. Check availability + review opponent intel + write coach's notes.
5. Plan training with position-specific drills.
6. Record results.
7. Log discipline and award MVPs.
8. Review standings, squad summary, and player outputs.

### TypeScript health
The current root project passed `npm run lint`, which runs `tsc --noEmit`. Consistent clean builds confirmed across all recent feature additions.

### Cross-cutting polish
- All hardcoded "Apex Rangers" references replaced with live `teamName` prop.
- "Today" button and date logic use real system date throughout Schedule and Training pages.
- All drill and UI emojis replaced with professional Lucide vector icons.

## What is fragile or incomplete

### Documentation gap (improved)
The root README and docs have been updated to reflect the real product. `PRD.md`, `MVP.md`, `TASKS.md`, `AUDIT.md`, `ARCHITECTURE.md`, and `ROADMAP.md` all document the current state.

### Persistence limits
The app relies heavily on browser `localStorage`. That works for a local-first MVP prototype or solo testing tool, but it creates limits around:
1. Storage size (now expanded with drill data, availability, coach notes, MVP history).
2. Cross-device continuity.
3. Recovery after browser reset.
4. Data ownership and auditability.

> **Clarification:** These limits are intentionally accepted for the MVP testing phase. The production release will include a backend persistence layer and user authentication.

### Mixed domain modeling
Players and staff share the same `Player` type, with role inference based on the `position` field. This is manageable now but could become awkward if the product grows into clearer admin, coaching, or player-facing workflows.

### Aggregate-driven analytics
Some charts and progression views are based on current totals or generated breakdowns rather than durable event history.

## Technical risk list

| Risk | Severity | Why it matters |
| --- | --- | --- |
| `App.tsx` concentration of responsibility | High | Increases change risk around core business logic |
| Heavy `localStorage` reliance | High | Limits scale, recovery, and portability (accepted for MVP testing; backend planned for production) |
| No authentication system | High | Limits multi-user access (accepted for MVP testing; auth planned for production) |
| Shared player/staff model | Medium | May block cleaner future domain design |
| External image URL dependence | Medium | Introduces runtime failures outside local control |
| Partial accessibility coverage | Medium | Limits usability and quality bar |

## Product risk list

| Risk | Severity | Why it matters |
| --- | --- | --- |
| Product identity is broader than the docs suggest | Medium → Lowered | Docs now reflect current scope accurately |
| Local-only data model may not match future user expectations | High | Real clubs often expect shared access and persistence (accepted for MVP; addressed in production roadmap) |
| Wide feature surface may hide weak core polish | Medium | Users notice trust and clarity more than breadth |
| Feature data sprawl across localStorage keys | Low | Manageable for MVP but needs consolidation before production |

## Strengths worth protecting

1. Fast startup with low setup cost.
2. Clear single-team operational focus.
3. Strong local workflow from scheduling to standings.
4. Deep match intelligence features (availability, intel, notes).
5. Comprehensive 52-drill training library with How-To guides.
6. Full discipline and MVP award tracking with history.
7. Flexible tactical and training experimentation.
8. Lightweight backup options already exist.

## Recommended decisions

### Decision 1 (Resolved)
Choose the canonical application root and remove or archive the duplicate variant. (The duplicate `sports-team-manager/` folder has been removed.)

### Decision 2 (Resolved)
Decide whether the product is intentionally local-first for solo use, or only temporarily implemented that way. (Local-first is intentional for MVP testing; production will include backend persistence and authentication.)

### Decision 3
Decide whether tactics and training are core differentiators or advanced extras around a roster-and-schedule core.

## Recommended fixes

### Immediate fixes
1. Communicate clearly in-app that the current version is for MVP testing and data lives locally in the browser. (Still todo)

### Near-term fixes
1. Reduce the amount of top-level logic living directly in `App.tsx`.
2. Add tests around result logging, standings updates, and the new availability/MVP flows.
3. Improve accessibility on interactive elements across major screens.
4. Add data import validation and safer restore flows.

## Final assessment

This codebase is not an empty prototype. It is a real local-first club management product with enough working behavior to justify formal product documentation and staged improvement planning. The 2026-06-14 update added significant depth across training, match intelligence, squad overview, and discipline/MVP tracking — moving the product from a wide-but-thin surface to a genuinely useful club operations tool.

The biggest need now is not more breadth. It is cleanup, clarity, confidence in the existing foundation, and a plan for the backend transition.
