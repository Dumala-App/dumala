# Dumala Roadmap

Updated: 2026-06-14

## Current state

The current product is a usable local-first club management app with a broad and now deep feature surface for a single team. It covers onboarding, roster management, schedule management, standings, discipline & MVP awards, announcements, match intelligence, training with a 52-drill library, tactics, and backup flows.

The 2026-06-14 update added significant depth: Squad Summary table, Match Availability Tracker, Upcoming Opponent Intel, Coach's Notes, expanded 52-drill training library with position-specific sets and How-To guides, 9 training presets, and full discipline/MVP management with history.

The next stages should focus on turning this wide and deep surface area into a cleaner, more dependable product by addressing structural concerns around persistence, authentication, and test coverage.

> **MVP testing status:** This application is in active MVP testing. Browser `localStorage` serves as the temporary persistence layer and there is intentionally no authentication system yet. These are deliberate tradeoffs for rapid iteration. Phase 3 of this roadmap covers the implementation of backend persistence and user authentication for the production launch.

## Product direction

The roadmap below assumes the product will continue as a sports club operations workspace and not pivot into a general productivity app. It also assumes the root application is the active source of truth.

## Phase 1: Stabilize & Clarify (Mostly Complete)

### Goal
Stabilize and clarify the current product.

### Product priorities
1. ✅ Align product naming across the app, metadata, README, and documentation.
2. ✅ Decide the canonical repository root and remove ambiguity caused by the duplicate app copy.
3. ✅ Make the core operating loop feel complete and trustworthy (onboarding, roster, schedule, standings, announcements, backup).
4. ✅ Add feature depth: Squad Summary, Match Availability, Opponent Intel, Coach's Notes, Discipline & MVP panels, 52-drill training library.
5. ✅ Replace hardcoded mock data with live data throughout (team names, dates).
6. ✅ Replace emoji icons with professional Lucide vector icons.
7. ✅ Update all documentation to reflect current product state.

### Technical priorities
1. Reduce risk in `App.tsx` by extracting core state and domain logic into clearer modules.
2. Document every major `localStorage` key and its ownership. (Partially done — 10+ keys now identified)
3. Add validation for restored or malformed local data.

### Exit condition
The product has one clear source of truth, one clear product name, deep features across all modules, live data throughout, and a reliable local-first club workflow.

## Phase 2: Data Integrity & Usability

### Goal
Improve data integrity and everyday usability.

### Product priorities
1. Improve empty states and first-run guidance.
2. Make result logging and standings behavior easier to verify.
3. Strengthen backup and restore confidence with clearer import and recovery flows (now more critical with added feature data).
4. Improve accessibility and keyboard support across major views.
5. Improve mobile and tablet usability for common admin tasks.
6. Add confirmation dialogs for destructive operations.

### Technical priorities
1. Introduce clearer domain boundaries for players, staff, fixtures, standings, training, discipline, and awards.
2. Create lightweight service or hook layers for repeated state behaviors.
3. Add better testing coverage around match result cascade, discipline workflows, and MVP award logic.
4. Reduce direct browser storage coupling inside individual components where practical.
5. Add data integrity checks across the expanded feature set (availability, coach notes, MVP history).

### Exit condition
The product still remains local-first, but the main workflows are easier to trust, easier to recover, and easier to operate on more screen sizes.

## Phase 3: Shared Data & Multi-User

### Goal
Prepare for shared data and multi-user use cases.

### Product priorities
1. Decide whether the product should support one team per browser, one team per account, or multiple clubs per workspace.
2. Introduce authentication and shared persistence if the product is moving beyond solo use.
3. Add role-aware collaboration for coaches, admins, and read-only team members.
4. Define which data should be private, shared, or exportable.

### Technical priorities
1. Add a real backend source of truth for club data.
2. Move core domain objects out of `localStorage`-only persistence.
3. Introduce an API contract for games, roster records, standings, announcements, discipline, and MVP data.
4. Add migration logic from local browser data into the new backend model (including history records).

### Exit condition
The product is no longer limited to one browser as the only durable home of team data.

## Phase 4: Football Player Rating & Development System

### Goal
Move beyond raw stats to structured player growth and benchmark tracking.

### Product priorities
1. Create a structured player rating model combining coach input, match output, and drill execution.
2. Establish positional benchmarks (forwards, midfielders, defenders, goalkeepers) across age bands.
3. Track individual player development, regression, and readiness over time.
4. Compare player growth against team averages and individual targets.
5. Turn training sessions into measurable development signals rather than just scheduled events.

### Technical priorities
1. Build a time-series event engine for tracking rating changes.
2. Introduce a scoring algorithm that normalizes different data types (e.g. subjective coach ratings vs objective clean sheets).

### Exit condition
The product offers clear differentiation beyond a local admin dashboard by actively helping coaches evaluate and develop talent over a season.

## Phase 5: AI Assistant & Advanced Match Intelligence

### Goal
Turn captured operational data into active coaching support and strategic intelligence.

### Product priorities
1. **AI Game & Training Analysis:** Analyze recent matches and training loads to summarize team performance.
2. **AI Drill Recommendations:** Automatically suggest specific drills from the 52-drill library based on identified squad weaknesses and player development gaps.
3. **AI Pre-Match Briefings:** Generate automated tactical focus points and opponent preparation checklists.
4. Add tactical pattern recognition and trend analysis by player, unit, and squad.
5. Consider video or event-linked analysis integration if requested by high-tier users.

### Technical priorities
1. Clarify and document the AI backend contract.
2. Build the prompt engineering and context-assembly pipeline for pre-match and post-match AI generation.
3. Introduce AI-generated coaching notes and development flags safely into the UI.

### Exit condition
The product acts as an intelligent assistant that helps coaches make faster, better decisions, proving the value of the underlying operational data.

## Suggested order of work

| Priority | Theme | Why it should come first |
| --- | --- | --- |
| 1 | ✅ Repository cleanup and source-of-truth decision | Reduces confusion before more work is added |
| 2 | ✅ Documentation and naming alignment | Makes the product understandable to future contributors |
| 3 | ✅ Feature depth and polish (drills, match intelligence, discipline, live data) | Multiple rounds of feature enhancement completed |
| 4 | Core workflow stabilization | Protects the features users depend on most |
| 5 | Data integrity and recovery | Increases trust in a local-first app |
| 6 | Accessibility and responsive polish | Improves real-world usability |
| 7 | Backend and multi-user planning | Important, but should follow a stable single-user product |

## Features to protect during roadmap execution

These current strengths should not be lost while the product evolves:
1. Fast local-first startup with no backend setup.
2. Broad visibility from the dashboard with Squad Summary table.
3. Match result automation into player and standings state.
4. Match intelligence (availability, opponent intel, coach's notes).
5. 52-drill training library with How-To guides and 9 presets.
6. Discipline and MVP tracking with full history.
7. Lightweight export and snapshot flows.

## Features to reevaluate later

These areas should stay under review rather than being assumed permanent:
1. Using the `Player` model for both athletes and staff.
2. The exact size and ambition of the tactics board.
3. The amount of simulated or inferred analytics versus real historical logging.
4. Whether discipline and MVP history should be independent event-sourced entities.

## Decision checkpoints

Before moving beyond Phase 2, the team should explicitly answer:
1. Is this product intentionally solo and local-first, or is that only a temporary implementation choice?
2. Are tactics and training differentiators, or nice-to-have extensions around the roster and schedule core?
3. What kind of customer or operator is the product truly for: a coach, a club admin, or a shared organization?
