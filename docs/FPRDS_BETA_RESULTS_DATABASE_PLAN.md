# FPRDS Beta Results Database Plan

Updated: 2026-06-26

## Purpose

The FPRDS private beta should not rely on loose coach opinion prompts. To decide whether the benchmarks are plausible, Dumala needs a separate beta review dataset that collects real assessment results from participating coaches and compares those results against the current benchmark bands.

The goal is to answer practical validation questions:

- Are the current benchmark bands too easy or too hard for each age group?
- Do different roles produce unexpected score distributions?
- Are certain drills unclear or inconsistent in real field conditions?
- Do Quick assessments produce useful enough signal compared with Full assessments?
- Do coaches repeatedly challenge the same benchmark tiers?
- Which benchmark rows need practitioner review or correction before wider release?

## Product Principle

Normal team assessment history and benchmark-validation data should be related but not treated as the same product surface.

- **Team assessment history** helps a coach develop players inside their own club.
- **FPRDS beta review data** helps Dumala validate whether the benchmark system itself is plausible across many teams.

The beta review dataset should minimize player identity exposure. Benchmark validation normally needs age group, role, drill result, scoring version, and context. It should not need public player names.

## Recommended User Flow

### 1. Coach runs an assessment

The coach uses the normal FPRDS Assessment Center and Assessment Guide:

- Select player.
- Select role.
- Select age group or derive it from date of birth.
- Select Full or Quick assessment.
- Enter drill results.
- Save the local/team assessment session.

### 2. Coach reviews a beta submission summary

After saving, Dumala offers a private beta submission step:

- Show which assessment session will be submitted.
- Show the fields included in the beta dataset.
- Explain that player names are excluded or replaced with a stable anonymous participant key.
- Ask for optional context: surface, timing method, equipment quality, venue type, and unusual conditions.
- Ask for optional benchmark confidence notes only after the data is attached to the session.

### 3. Coach submits to beta review database

The app sends a versioned review payload to a cloud table separate from normal assessment history.

Submission should be explicit. Do not auto-submit private local data without consent.

### 4. Dumala analyzes aggregate results

Admin/reviewer tools group submissions by:

- Drill.
- Age group.
- Role.
- Assessment type.
- Gender or competition level if those fields are later approved.
- Benchmark version.
- Scoring algorithm version.
- Coach experience level if approved.
- Country/region if approved.

### 5. Benchmark correction decisions are recorded

If the data shows a benchmark issue, reviewers create a correction record:

- Affected drill.
- Affected age group.
- Current benchmark band.
- Proposed benchmark band.
- Evidence summary.
- Reviewer decision.
- Release decision.

Historical assessment sessions should keep their original benchmark version. New benchmark tables should ship as a new version.

## Data Model

### `fprds_beta_submissions`

One row per submitted assessment session.

Recommended fields:

| Field | Purpose |
| --- | --- |
| `id` | Stable submission UUID |
| `club_id` | Source club, used for permission and abuse controls |
| `assessment_session_id` | Source assessment session when submitted from a saved session |
| `submitted_by` | Authenticated user who submitted |
| `submitted_at` | Submission timestamp |
| `player_anonymous_id` | Stable per-player anonymous key for longitudinal analysis |
| `player_age_at_assessment` | Numeric age at assessment date |
| `age_group` | U12, U15, U18, Adult |
| `role` | ST, W, CM, CDM, FB, CB, GK |
| `assessment_type` | Full or Quick |
| `benchmark_version` | Benchmark table version used |
| `weighting_version` | Role weight version used |
| `scoring_algorithm_version` | Scoring implementation version used |
| `raw_results` | Raw submitted drill values |
| `attribute_scores` | Derived attribute scores |
| `ovr` | Derived OVR |
| `venue_context` | Optional structured context |
| `coach_confidence` | Optional coach rating of confidence in the session quality |
| `coach_notes` | Optional beta-only notes, redacted for private info |
| `review_status` | pending, accepted, excluded, needs_followup |
| `exclusion_reason` | Why a submission was excluded from aggregate benchmark analysis |

### `fprds_beta_drill_results`

One row per drill measurement extracted from each submission. This makes analysis easier than querying nested JSON for everything.

Recommended fields:

| Field | Purpose |
| --- | --- |
| `id` | Stable drill result UUID |
| `submission_id` | Parent beta submission |
| `club_id` | Source club |
| `drill_id` | Internal drill identifier |
| `attribute_id` | FPRDS attribute being scored |
| `raw_value` | Numeric drill result |
| `raw_unit` | seconds, meters, centimeters, out_of_10, out_of_5, coach_score |
| `raw_direction` | lower_is_better or higher_is_better |
| `age_group` | Denormalized for analysis |
| `role` | Denormalized for analysis |
| `assessment_type` | Full or Quick |
| `benchmark_tier` | Tier assigned by current benchmark |
| `score` | 10-99 score assigned by current scoring table |
| `benchmark_version` | Benchmark table version used |

### `fprds_benchmark_reviews`

Reviewer-level assessment of whether a benchmark row is plausible.

Recommended fields:

| Field | Purpose |
| --- | --- |
| `id` | Stable review UUID |
| `drill_id` | Drill under review |
| `attribute_id` | Attribute under review |
| `age_group` | Affected age group |
| `role` | Optional role when role-specific |
| `benchmark_version` | Version being reviewed |
| `sample_size` | Number of included drill results |
| `distribution_summary` | Percentiles and tier counts |
| `review_decision` | accept, change_requested, inconclusive |
| `reviewer_notes` | Practitioner or product notes |
| `created_by` | Reviewer |
| `created_at` | Review timestamp |

### `fprds_benchmark_corrections`

Tracks proposed and accepted changes.

Recommended fields:

| Field | Purpose |
| --- | --- |
| `id` | Stable correction UUID |
| `review_id` | Source review |
| `drill_id` | Drill affected |
| `age_group` | Age group affected |
| `tier_label` | Elite, Advanced, Developing, Below Average, Beginner |
| `current_raw_best` | Current raw best bound |
| `current_raw_worst` | Current raw worst bound |
| `proposed_raw_best` | Proposed raw best bound |
| `proposed_raw_worst` | Proposed raw worst bound |
| `rationale` | Why the change is proposed |
| `status` | proposed, accepted, rejected, deferred |
| `target_benchmark_version` | Version where change should land |

## Privacy Requirements

FPRDS beta review data may involve minors. The system should follow these rules:

1. Submission is opt-in.
2. Player names are not required for benchmark validation.
3. Public profile data is never submitted as part of benchmark review.
4. Coach notes must warn against entering medical, school, address, or sensitive family information.
5. Admin exports should use anonymized participant IDs by default.
6. Deleting a club or account must either delete or anonymize beta submissions according to the approved privacy policy.
7. Support diagnostics must not include raw player names, private notes, or payment data.

## Analysis Dashboard

The private admin/reviewer dashboard should show:

- Submission count by club, age group, role, and assessment type.
- Drill result distribution by age group.
- Tier distribution for each benchmark table.
- Outlier results and likely data-entry mistakes.
- Coach confidence score distribution.
- Excluded submissions and reasons.
- Benchmark rows with low sample size.
- Benchmark rows with high change-request rate.
- Suggested correction candidates.

Useful summary metrics:

- Median raw result.
- 10th, 25th, 75th, and 90th percentiles.
- Percentage of results falling into each tier.
- Percentage of submissions excluded.
- Number of distinct clubs and players represented.
- Difference between expected and actual tier distribution.

## Implementation Phases

### Phase A: Product and Consent Design

- Define exact fields sent in a beta submission.
- Write plain consent copy for coaches.
- Decide whether submissions require signed-in cloud accounts.
- Define anonymized player ID strategy.
- Define who can view aggregate review dashboards.

### Phase B: Database Foundation

- Add beta review tables separate from normal `assessment_sessions`.
- Add RLS policies so clubs can submit their own data but cannot read other clubs' submissions.
- Add admin/reviewer access separately from normal club roles.
- Add indexes for drill, age group, role, assessment type, and benchmark version.

### Phase C: Submission UI

- Add a "Submit to FPRDS beta review" action after saving an assessment.
- Show included data before submission.
- Add optional context fields.
- Add submission status on saved assessment sessions.
- Allow coaches to withdraw a submission if privacy policy requires it.

### Phase D: Aggregation and Review Tools

- Build internal aggregate dashboard.
- Add reviewer decision workflow.
- Add correction log workflow.
- Export anonymized CSV/JSON for practitioner review.

### Phase E: Benchmark Versioning

- Assign immutable benchmark versions.
- Keep historical assessment sessions tied to the version used at save time.
- Publish benchmark updates as new versions.
- Show version context in downloadable reports.

## Open Decisions

1. Should private beta submissions require cloud sign-in from day one?
2. Should submissions be club-identifiable to Dumala admins, or anonymized at club level too?
3. Which admin/reviewer roles can see raw drill results?
4. Should coaches be able to submit retroactive local assessments after cloud migration?
5. Should beta submissions include player sex/gender, competition level, or training age? These may improve analysis but increase privacy and consent complexity.
6. What minimum sample size is required before changing a benchmark row?
7. Who has final authority to approve benchmark corrections?

## Recommended Next Step

Build Phase A and Phase B before adding more coach-facing review prompts. The Assessment Guide can explain how to run drills today, but benchmark plausibility feedback should be collected only when a saved assessment session can be submitted into the beta review database with consent and versioned metadata.
