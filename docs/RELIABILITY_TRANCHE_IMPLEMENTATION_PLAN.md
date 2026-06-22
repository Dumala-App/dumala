# Dumala Reliability Tranche Implementation Plan

Updated: 2026-06-22

## Purpose

This plan strengthens Dumala before major routing, cloud, collaboration, and public-profile work. It is intentionally incremental: each tranche produces an independently useful improvement, passes the existing Quality Gate, and can be reviewed, merged, or rolled back without requiring the remaining tranches.

This is not a project-wide rewrite. Large views remain functional throughout the work, existing `localStorage` keys remain compatible, Full Workspace V2 backups remain valid, and production continues to deploy only from validated merges into protected `main`.

## Outcomes

After completion:

- unexpected rendering failures show a recoverable screen instead of a blank application;
- assessment changes use a pure, tested state transition instead of embedded `App.tsx` orchestration;
- FPRDS calculations, age grouping, assessment snapshots, tactics auto-fill, and training synchronization have regression tests;
- inconsistencies between games, standings, and player totals are detected and explained;
- high-risk `any` usage is replaced with domain types without breaking legacy player migration;
- critical forms reject malformed input using consistent, accessible feedback;
- the codebase has enough protection to begin client-side routing and incremental view decomposition safely.

## Delivery Rules

1. Implement each tranche on a separate `codex/` branch and pull request.
2. Keep PRs narrowly scoped; do not combine unrelated UI redesign or feature work.
3. Require the existing **TypeScript, tests, build, and PWA** Quality Gate before merge.
4. Update `docs/TASKS.md` only when a tranche meets all acceptance criteria.
5. Preserve existing storage keys, backup formats, offline behavior, and public URLs.
6. Run manual checks with a populated workspace and a fresh workspace.
7. Export a Full Workspace V2 backup before destructive manual test scenarios.
8. Prefer pure domain functions over hooks or context when logic does not require React.
9. Do not introduce a global state library, broad provider migration, virtualization, or generalized component rewrite during this work.

## Tranche 1: Error Containment and Recovery

### Goal

Prevent an unexpected render failure in one view or widget from taking down the entire application.

### Step-by-step implementation

1. Add a reusable class-based error boundary because React render errors cannot currently be caught by a function component alone.
2. Define error-boundary props for:
   - boundary name;
   - fallback level: `application`, `view`, or `widget`;
   - optional retry callback;
   - optional return-to-Overview callback;
   - children.
3. Store only transient error state in the boundary. Never clear `localStorage`, restore defaults, or mutate workspace records when an error is caught.
4. Add an application-level boundary around `App` in `main.tsx`.
5. Build an application fallback containing:
   - a clear message that workspace data remains in the browser;
   - **Reload Dumala**;
   - recovery guidance for exporting a backup after reload;
   - technical details collapsed behind a development-only section.
6. Add view-level boundaries around the lazy-loaded active views:
   - Overview and Game Week;
   - Squad;
   - Tactics;
   - Training and Assessments;
   - League, Bulletins, and Updates.
7. Build a view fallback containing:
   - affected view name;
   - **Retry view**;
   - **Return to Overview**;
   - reassurance that other workspace sections remain available.
8. Reset a view boundary when its view key changes so navigating away and back can retry a clean mount.
9. Log error and component-stack details to `console.error` without rendering raw stored data, backup contents, email addresses, or player records.
10. Add a small test-only component that throws on render and unit-test boundary behavior.

### Tests

- Application fallback appears when a child throws.
- View fallback contains the correct view name.
- Retry remounts the child.
- Navigating to a different view resets the boundary.
- Workspace storage is unchanged after an error.
- Keyboard focus moves to the fallback heading or first recovery action.
- Existing reduced-motion and focus-visible behavior remains intact.

### Manual validation

1. Inject a temporary development-only render failure in each boundary level.
2. Confirm the rest of the app remains available after a view-level failure.
3. Reload and verify the workspace data is intact.
4. Remove all failure injection before committing.
5. Test desktop, mobile, and an installed PWA window.

### Acceptance criteria

- No tested render error produces an unhandled blank screen.
- Error recovery never erases or rewrites workspace data.
- View failures do not force a complete workspace reset.
- TypeScript, tests, production build, and PWA verification pass.

### Estimated effort

1-2 working days.

## Tranche 2: Assessment Snapshot Service Extraction

### Goal

Move assessment-to-player snapshot transitions out of `App.tsx` into deterministic domain functions that can be tested independently.

### Domain interface

Create a pure assessment service with interfaces equivalent to:

```ts
interface AssessmentState {
  players: Player[];
  assessments: AssessmentSession[];
}

interface AssessmentTransition extends AssessmentState {
  affectedPlayerId: string;
}

addAssessmentToWorkspace(
  state: AssessmentState,
  assessment: AssessmentSession
): AssessmentTransition;

deleteAssessmentFromWorkspace(
  state: AssessmentState,
  assessmentId: string
): AssessmentTransition | null;
```

Names may follow local conventions, but inputs and outputs must remain plain data. The service must not use React, browser APIs, storage, downloads, or navigation.

### Step-by-step implementation

1. Document the current add/delete behavior from `App.tsx` as characterization tests before moving it.
2. Extract one comparison function for assessment recency:
   - assessment date first;
   - creation timestamp as deterministic tie-breaker;
   - stable final tie-breaker using ID when timestamps match.
3. Add a helper that selects the latest assessment for one player.
4. Add a helper that applies the latest assessment snapshot to a player using the existing FPRDS snapshot function.
5. Define explicit behavior when no assessment remains:
   - clear only assessment-derived snapshot fields;
   - preserve identity, measurements, match statistics, traits, discipline, and MVP records.
6. Implement the add transition:
   - validate the target player exists;
   - append or replace according to existing session-ID behavior;
   - recalculate the affected player's latest snapshot;
   - return new arrays without mutating inputs.
7. Implement the delete transition:
   - return `null` when the assessment does not exist;
   - remove the selected session;
   - find the latest remaining session for that player;
   - reapply it or clear the snapshot;
   - leave other players unchanged.
8. Replace `App.tsx` assessment handlers with calls to the service followed by state updates.
9. Preserve current navigation into Assessments and player-profile behavior.
10. Do not introduce a workspace context or assessment hook unless it removes real duplication after the pure service exists.

### Tests

- Adding a first assessment sets the player snapshot.
- Adding a newer assessment replaces the snapshot.
- Adding an older assessment preserves the newer snapshot.
- Date ties resolve deterministically.
- Deleting a non-latest assessment preserves the current snapshot.
- Deleting the latest assessment restores the previous snapshot.
- Deleting the final assessment clears assessment-derived data.
- Other players and unrelated player fields remain unchanged.
- Unknown assessment and player IDs are handled without partial mutation.
- Input arrays and objects are not mutated.

### Manual validation

1. Run Full and Quick assessments for one player.
2. Confirm the latest result appears on the roster and profile.
3. Delete the latest session and confirm the previous result returns.
4. Delete the final session and confirm only assessment-derived information clears.
5. Export and restore the workspace and repeat the checks.

### Acceptance criteria

- `App.tsx` no longer contains assessment snapshot selection or cascade logic.
- Assessment state transitions are fully covered by focused unit tests.
- Existing assessment and backup behavior is unchanged.

### Estimated effort

2-4 working days.

## Tranche 3: Critical Domain Test Expansion

### Goal

Protect calculations and cross-feature behavior that future refactors are most likely to break.

### 3A. FPRDS interpolation and boundaries

1. Inventory all supported benchmark directions.
2. Add table-driven tests for higher-is-better and lower-is-better measurements.
3. Test exact tier values, values between tiers, and values outside minimum and maximum ranges.
4. Confirm interpolation is monotonic and clamped to the intended scoring range.
5. Include invalid, missing, zero, and non-finite inputs according to current validation rules.

### 3B. Role weighting and OVR

1. Create fixtures for all seven supported roles.
2. Verify every role uses the intended weighted attributes.
3. Confirm weights produce the documented total or normalization behavior.
4. Test representative low, middle, and high scores.
5. Verify unrelated role attributes do not incorrectly affect OVR.
6. Add a regression test for each previously reported rating defect.

### 3C. Age and age-group transitions

1. Extract or reuse a single age calculation function.
2. Test the day before, day of, and day after a birthday.
3. Test leap-day birth dates.
4. Test boundaries between U12, U15, U18, and Adult.
5. Use fixed dates in tests; never depend on the machine's current date.
6. Confirm the correct benchmark group is selected after a transition.

### 3D. Quick and Full assessment requirements

1. Define required fields by assessment mode and role.
2. Test complete valid submissions.
3. Test every required field missing individually.
4. Confirm optional fields do not block submission.
5. Confirm errors identify the exact missing or invalid field.

### 3E. Tactics auto-fill

1. Extract position matching into a pure function if necessary.
2. Test complete and incomplete rosters.
3. Verify goalkeepers fill goalkeeper slots first.
4. Verify defenders, midfielders, and forwards prefer compatible slots.
5. Verify valid manual assignments are preserved.
6. Verify duplicate player assignment cannot occur.
7. Define and test fallback behavior when no compatible player remains.

### 3F. Training and calendar synchronization

1. Extract schedule-to-game conversion into pure functions if currently embedded in the component.
2. Test creating, editing, moving, and deleting a weekly training entry.
3. Confirm only linked training events change.
4. Confirm matches and meetings remain untouched.
5. Test history restore and repeated synchronization for idempotency.

### Acceptance criteria

- All seven FPRDS roles and all age groups have test coverage.
- Tactics auto-fill and training synchronization have deterministic unit tests.
- Tests use stable fixtures and fixed dates.
- No test relies on production `localStorage` or network access.

### Estimated effort

5-8 working days.

## Tranche 4: Workspace Integrity Checker

### Goal

Detect and explain disagreements among completed games, league standings, and player totals without silently rewriting user data.

### Integrity result interface

```ts
type IntegritySeverity = 'info' | 'warning' | 'error';

interface IntegrityFinding {
  code: string;
  severity: IntegritySeverity;
  section: 'games' | 'standings' | 'players' | 'assessments';
  message: string;
  relatedIds: string[];
}

interface WorkspaceIntegrityReport {
  checkedAt: string;
  findings: IntegrityFinding[];
  isHealthy: boolean;
}
```

Messages shown to users must summarize affected sections without exposing raw stored JSON.

### Step-by-step implementation

1. Document which values are authoritative:
   - completed game records and match events are the source for reversible match-derived totals;
   - explicit external/manual league results remain valid standings input;
   - manual player profile information is never overwritten by the checker.
2. Reuse existing match reconciliation functions rather than duplicating formulas.
3. Build a pure projection that derives expected match contributions:
   - played, won, drawn, lost;
   - goals for, goals against, goal difference, and points;
   - player appearances, goals, and assists represented by stored event data.
4. Keep external results separate so the checker does not report them as unexplained corruption.
5. Compare expected values with persisted standings and players.
6. Return stable finding codes for each mismatch category.
7. Treat missing optional historical details as `info` or `warning`, not automatically as corruption.
8. Run the checker:
   - after startup hydration;
   - after successful backup restore;
   - after result create/edit/delete;
   - on demand from a diagnostic action.
9. Show a non-blocking banner only for actionable warnings or errors.
10. Provide actions:
    - dismiss for the current session;
    - export Full Workspace backup;
    - open the affected feature;
    - rerun check.
11. Do not add automatic repair in the first version.
12. Record only finding codes and counts in console diagnostics; never log full workspace records.

### Tests

- Healthy workspace returns no warnings.
- Match creation, editing, and deletion produce matching projections.
- Incorrect standings totals produce targeted findings.
- Incorrect player goals, assists, or appearances produce targeted findings.
- Manual external league results are not treated as match corruption.
- Incomplete historical event data produces the intended severity.
- Checker does not mutate workspace input.
- Backup restore can invoke the checker without partial writes.

### Manual validation

1. Export a populated workspace.
2. Deliberately alter a local test copy of standings and player totals.
3. Restore or load the test data and confirm findings identify the right sections.
4. Confirm no automatic changes occur.
5. Restore the original backup and confirm the report becomes healthy.

### Acceptance criteria

- Silent cross-collection mismatches become visible.
- Findings are understandable and actionable.
- No checker path automatically rewrites team data.
- External/manual league results remain supported.

### Estimated effort

3-5 working days.

## Tranche 5: Targeted Type Safety Cleanup

### Goal

Remove unsafe typing where it can conceal runtime defects while retaining compatibility required for legacy player records.

### Step-by-step implementation

1. Generate a baseline inventory with:

```bash
rg -n "as any|:\s*any\b|<any>|any\[\]" src
```

2. Categorize each occurrence:
   - legitimate third-party typing boundary;
   - temporary legacy migration compatibility;
   - avoidable domain-model gap;
   - unsafe UI event cast.
3. Add concrete domain types for tactics:
   - quick note and category;
   - drawing point and path;
   - dragged position;
   - player-extra state.
4. Add assessment types:
   - assessment wizard step;
   - attribute key;
   - attribute delta map;
   - role-weight key iteration helper.
5. Replace select casts with typed parsing functions that validate allowed values before updating state.
6. Type Recharts tooltip and dot props using the installed library's exported types where practical. Keep a narrow local adapter if the library's generic types are insufficient.
7. Replace temporary object casts such as `{} as any` with typed constructors or reducer initialization.
8. Retain `Player.attributes?: any` only as a documented legacy migration boundary.
9. Prevent new application-facing `any` usage through review policy; do not add a lint rule until remaining justified cases are documented.
10. Run the complete type check after each feature-area cleanup instead of changing every file at once.

### Tests

- Existing unit tests continue to pass.
- TypeScript catches invalid tactics note categories and assessment steps.
- Typed parsers reject unsupported select values.
- Tactics drawings and stored notes continue to validate through Zod.
- Legacy player migration tests continue to pass.

### Acceptance criteria

- Avoidable `any` and `as any` usage is removed from assessment, tactics, form-select, and chart boundaries.
- Remaining uses are documented and justified.
- `Player.attributes?: any` remains only until a versioned migration removes the need.

### Estimated effort

2-4 working days.

## Tranche 6: Consistent Validation for High-Risk Forms

### Goal

Prevent malformed data from entering calculated or heavily interconnected workspace areas.

### Shared validation behavior

All migrated forms must:

- validate on submit and revalidate an edited field after its first error;
- show a concise field-level message;
- connect messages with `aria-invalid` and `aria-describedby`;
- preserve entered values after failure;
- focus the first invalid field;
- show a form summary only when multiple errors need orientation;
- never use color as the only error indicator;
- normalize numeric input before domain submission;
- keep persistence schemas separate from form-input schemas where input strings require conversion.

### Step-by-step implementation

#### 6A. Shared primitives

1. Add a typed validation-result helper.
2. Add reusable field error and form error-summary components matching Dumala's current visual language.
3. Add a hook or utility for first-invalid-field focus without adopting a new form library.
4. Add shared numeric parsing for blank, decimal, integer, minimum, and maximum behavior.

#### 6B. Match result form

1. Validate non-negative integer scores.
2. Validate event players exist and are eligible.
3. Validate scorer/assist selections and minute ranges where recorded.
4. Prevent duplicate submission while reconciliation is in progress.
5. Confirm invalid input cannot update games, standings, or player totals.

#### 6C. Assessment forms

1. Reuse the required-field rules covered in Tranche 3.
2. Validate numeric ranges and lower-is-better measurements.
3. Show role- and mode-specific messages.
4. Preserve progress when correcting errors.

#### 6D. Player registration and profile editing

1. Require a usable name and supported position.
2. Validate jersey number, birth date, age fallback, height, and weight.
3. Define duplicate jersey-number behavior as a warning rather than a hard block unless product policy changes.
4. Validate uploaded image type and existing size limit.
5. Preserve legacy profiles with missing optional fields.

#### 6E. Backup import

1. Keep full structural validation in the backup service.
2. Improve UI messages for unsupported version, malformed JSON, invalid nested records, and storage failure.
3. Never include raw backup content in messages.
4. Keep failed imports atomic.

#### 6F. Manual standings editing

1. Validate non-negative integer fields.
2. Validate derived totals or recalculate them consistently.
3. Prevent impossible combinations when the UI controls all inputs.
4. Preserve external-result support.

### Tests

- Each form accepts representative valid input.
- Each required and bounded field has a failure test.
- Invalid submissions do not mutate state or storage.
- First-invalid-field focus works.
- Errors are associated with their inputs.
- Backup failures preserve the existing workspace.
- Mobile layouts do not hide validation messages or actions.

### Acceptance criteria

- The five selected workflows use one consistent validation and accessibility pattern.
- Invalid calculated data cannot be submitted.
- Existing valid and legacy records remain editable.
- No new form dependency is introduced unless implementation proves the shared utilities insufficient.

### Estimated effort

4-7 working days.

## Cross-Tranche Verification

Run for every tranche:

```bash
npm run lint
npm test
npm run clean
npm run build
npm run verify:pwa
```

Before completing the reliability tranche, verify:

1. onboarding creates a clean workspace and lands on Overview;
2. player and staff creation, editing, and deletion work;
3. match results update and reverse standings and player totals;
4. Tactics auto-fill remains position-aware;
5. training changes synchronize correctly with Game Week;
6. Full and Quick assessments save, display, and delete correctly;
7. Full Workspace V2 export and restore remain atomic;
8. reset workspace clears every supported storage section;
9. all major views reopen and refresh offline;
10. update prompts preserve workspace data;
11. desktop, mobile, and tablet layouts remain usable;
12. GitHub Actions validates and deploys the merged production revision.

## Recommended PR Sequence

| PR | Deliverable | Dependency |
| --- | --- | --- |
| 1 | Error boundaries and recovery UI | None |
| 2 | Assessment snapshot characterization tests and pure service | PR 1 recommended, not technically required |
| 3 | FPRDS interpolation, weighting, and age tests | PR 2 for snapshot tests |
| 4 | Tactics auto-fill and training synchronization tests | None |
| 5 | Workspace integrity checker and warning UI | Match-result tests |
| 6 | Assessment and tactics type cleanup | PRs 2-4 |
| 7 | Shared validation primitives and match-result validation | Integrity checker recommended |
| 8 | Assessment, roster, backup, and standings validation | PR 7 |

Do not start React Router migration until PRs 1-5 have merged and the production smoke test is clean. Type cleanup and validation may continue in parallel only when they touch separate files.

## Risks and Controls

| Risk | Control |
| --- | --- |
| Error UI hides a real defect | Log technical details, preserve retry, and retain CI regression tests |
| Assessment extraction changes current behavior | Add characterization tests before moving logic |
| Test fixtures encode incorrect football rules | Keep benchmark fixtures traceable and obtain practitioner review separately |
| Integrity checker reports valid manual data as corruption | Model external/manual results explicitly and avoid automatic repair |
| Type cleanup becomes a broad rewrite | Limit changes to verified unsafe boundaries and feature-specific PRs |
| Validation rejects legacy workspaces | Validate new submissions while keeping optional legacy fields readable |
| Offline regressions | Run production PWA verification and physical-device checks after affected tranches |
| Long feature freeze | Merge independently valuable PRs and stop safely after any completed tranche |

## Effort and Scheduling

Expected engineering effort is approximately 17-30 working days:

| Tranche | Estimate |
| --- | ---: |
| Error containment | 1-2 days |
| Assessment extraction | 2-4 days |
| Critical tests | 5-8 days |
| Integrity checker | 3-5 days |
| Type cleanup | 2-4 days |
| Form validation | 4-7 days |

The estimates include implementation, automated testing, focused manual verification, review fixes, and documentation. They do not include external practitioner validation of FPRDS benchmarks or physical-device testing delays.

## Completion Definition

The reliability tranche is complete when:

- all eight recommended PRs are merged through protected `main`;
- all acceptance criteria in Tranches 1-6 are met;
- no critical calculation or restore regression remains open;
- production deployment and offline PWA checks pass;
- `docs/TASKS.md`, `docs/ARCHITECTURE.md`, and release notes reflect the delivered behavior;
- React Router work can begin without requiring a simultaneous state-management rewrite.
