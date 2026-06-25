# FPRDS Benchmark Review Package

Updated: 2026-06-26

Status: **Ready for practitioner review**

This package prepares the current FPRDS benchmark tables, assumptions, review checklist, signoff fields, and correction log for qualified football practitioners. It does not approve the tables by itself. FPRDS benchmark claims remain beta until the review record is completed and accepted.

## Review scope

Practitioners should review:

- Age groups: U12, U15, U18, Adult.
- Roles: ST, W, CM, CDM, FB, CB, GK.
- Benchmark tiers: Elite, Advanced, Developing, Below Average, Beginner.
- Score bands: Elite 90-99, Advanced 75-89, Developing 55-74, Below Average 35-54, Beginner 10-34.
- Raw result direction: lower-is-better for timed drills, higher-is-better for distance, count, or coach-score drills.
- Role weights and Quick assessment required role attributes.

## Implementation references

| Area | Source |
| --- | --- |
| Raw benchmark tables | `src/fprds/benchmarks.ts` |
| Role weights and role labels | `src/fprds/weights.ts` |
| Age grouping, scoring, interpolation, required fields | `src/fprds/scoring.ts` |
| Automated regression tests | `src/fprds/scoring.test.ts` |
| Assessment workflow UI | `src/components/AssessmentsView.tsx` |

## Current assumptions

1. Age group is derived from player date of birth and assessment date.
2. U12 includes players aged 12 and younger, U15 includes 13-15, U18 includes 16-18, Adult includes 19 and older.
3. Benchmark tables are intentionally broad enough for beta coaching use, not formal academy certification.
4. The app interpolates score values inside a tier and across small adjacent rounded-boundary gaps.
5. Open-ended Elite tiers return the top score for that tier; open-ended Beginner tiers return the minimum score for that tier.
6. Coach-scored fields use a 1-10 input mapped to the same 10-99 score range.
7. Count drills are judged as successful outcomes out of 5 or out of 10, unless a role drill explicitly defines a different denominator.
8. Role OVR is a weighted football profile score, not a replacement for scouting judgment, official qualifications, or medical/performance testing.

## Benchmark tables for review

### Timed Drills

Lower values are better.

#### 30m Sprint, seconds

| Age group | Elite | Advanced | Developing | Below Average | Beginner |
| --- | --- | --- | --- | --- | --- |
| U12 | <= 4.50 | 4.50-4.89 | 4.90-5.39 | 5.40-5.89 | >= 5.90 |
| U15 | <= 4.20 | 4.20-4.59 | 4.60-5.09 | 5.10-5.59 | >= 5.60 |
| U18 | <= 3.95 | 3.95-4.29 | 4.30-4.69 | 4.70-5.19 | >= 5.20 |
| Adult | <= 3.90 | 3.90-4.19 | 4.20-4.59 | 4.60-4.99 | >= 5.00 |

#### 10m Sprint, seconds

| Age group | Elite | Advanced | Developing | Below Average | Beginner |
| --- | --- | --- | --- | --- | --- |
| U12 | <= 1.80 | 1.80-1.99 | 2.00-2.24 | 2.25-2.49 | >= 2.50 |
| U15 | <= 1.70 | 1.70-1.89 | 1.90-2.14 | 2.15-2.39 | >= 2.40 |
| U18 | <= 1.60 | 1.60-1.79 | 1.80-2.04 | 2.05-2.29 | >= 2.30 |
| Adult | <= 1.55 | 1.55-1.74 | 1.75-1.99 | 2.00-2.24 | >= 2.25 |

#### Illinois Agility, seconds

| Age group | Elite | Advanced | Developing | Below Average | Beginner |
| --- | --- | --- | --- | --- | --- |
| U12 | <= 15.50 | 15.50-16.40 | 16.50-17.40 | 17.50-18.40 | >= 18.50 |
| U15 | <= 15.00 | 15.00-15.90 | 16.00-16.90 | 17.00-17.90 | >= 18.00 |
| U18 | <= 14.50 | 14.50-15.40 | 15.50-16.40 | 16.50-17.40 | >= 17.50 |
| Adult | <= 14.00 | 14.00-14.90 | 15.00-15.90 | 16.00-16.90 | >= 17.00 |

### Distance And Value Drills

Higher values are better.

#### Yo-Yo Distance, meters

| Age group | Elite | Advanced | Developing | Below Average | Beginner |
| --- | --- | --- | --- | --- | --- |
| U12 | >= 1200 | 900-1199 | 600-899 | 400-599 | <= 399 |
| U15 | >= 1600 | 1200-1599 | 800-1199 | 500-799 | <= 499 |
| U18 | >= 2000 | 1600-1999 | 1200-1599 | 800-1199 | <= 799 |
| Adult | >= 2200 | 1800-2199 | 1400-1799 | 1000-1399 | <= 999 |

#### Broad Jump, centimeters

| Age group | Elite | Advanced | Developing | Below Average | Beginner |
| --- | --- | --- | --- | --- | --- |
| U12 | >= 160 | 140-159 | 115-139 | 90-114 | <= 89 |
| U15 | >= 185 | 160-184 | 135-159 | 110-134 | <= 109 |
| U18 | >= 210 | 185-209 | 160-184 | 135-159 | <= 134 |
| Adult | >= 220 | 195-219 | 170-194 | 145-169 | <= 144 |

#### Medicine Ball Throw, centimeters

| Age group | Elite | Advanced | Developing | Below Average | Beginner |
| --- | --- | --- | --- | --- | --- |
| U12 | >= 450 | 380-449 | 300-379 | 220-299 | <= 219 |
| U15 | >= 550 | 460-549 | 370-459 | 280-369 | <= 279 |
| U18 | >= 650 | 540-649 | 430-539 | 320-429 | <= 319 |
| Adult | >= 700 | 580-699 | 460-579 | 350-459 | <= 349 |

#### Shot Power Controlled Distance, meters

| Age group | Elite | Advanced | Developing | Below Average | Beginner |
| --- | --- | --- | --- | --- | --- |
| U12 | >= 25 | 20-24 | 15-19 | 10-14 | <= 9 |
| U15 | >= 30 | 25-29 | 18-24 | 12-17 | <= 11 |
| U18 | >= 35 | 30-34 | 22-29 | 15-21 | <= 14 |
| Adult | >= 40 | 35-39 | 25-34 | 18-24 | <= 17 |

#### Ball Retention, seconds

| Elite | Advanced | Developing | Below Average | Beginner |
| --- | --- | --- | --- | --- |
| >= 25 | 18-24 | 12-17 | 7-11 | <= 6.9 |

### Count And Coach-Score Bands

| Drill type | Elite | Advanced | Developing | Below Average | Beginner |
| --- | --- | --- | --- | --- | --- |
| Out of 10 banded | 9-10 | 7-8 | 5-6 | 3-4 | 0-2 |
| Out of 5 banded | 5 | 4 | 3 | 2 | 0-1 |
| Direct out of 10 | 10 = 99, 9 = 88 | 8 = 77, 7 = 66 | 6 = 55 | 5 = 44, 4 = 33, 3 = 22 | 2-0 = 10 |
| Coach score 1-10 | 10 = 99, 9 = 88 | 8 = 77, 7 = 66 | 6 = 55 | 5 = 44, 4 = 33, 3 = 22 | 2-1 = 10 |

## Role weight review

Practitioners should confirm whether these weights match the intended profile for each role in grassroots and academy contexts.

| Attribute | ST | W | CM | CDM | FB | CB | GK |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Pace | 15% | 20% | 5% | 10% | 20% | 10% | 0% |
| Stamina | 5% | 10% | 15% | 20% | 15% | 10% | 0% |
| Agility | 10% | 15% | 10% | 0% | 10% | 5% | 10% |
| Strength | 10% | 0% | 0% | 10% | 0% | 15% | 10% |
| First touch | 10% | 10% | 10% | 5% | 0% | 0% | 0% |
| Short passing | 0% | 5% | 10% | 10% | 5% | 0% | 0% |
| Finishing box | 20% | 15% | 0% | 0% | 0% | 0% | 0% |
| Shot power | 15% | 0% | 0% | 0% | 0% | 0% | 0% |
| Offensive 1v1 | 10% | 20% | 0% | 0% | 0% | 0% | 0% |
| Attacking heading | 5% | 0% | 0% | 0% | 0% | 0% | 0% |
| Long passing | 0% | 0% | 15% | 10% | 0% | 0% | 0% |
| Vision/playmaking | 0% | 0% | 20% | 0% | 0% | 0% | 0% |
| Ball retention | 0% | 0% | 10% | 10% | 0% | 0% | 0% |
| Pressing/interceptions | 0% | 0% | 5% | 25% | 0% | 0% | 0% |
| Tackling | 0% | 0% | 0% | 0% | 20% | 25% | 0% |
| Defensive heading | 0% | 0% | 0% | 0% | 0% | 20% | 0% |
| Positioning/clearances | 0% | 0% | 0% | 0% | 15% | 15% | 0% |
| Crossing | 0% | 5% | 0% | 0% | 15% | 0% | 0% |
| Reflexes | 0% | 0% | 0% | 0% | 0% | 0% | 25% |
| Handling | 0% | 0% | 0% | 0% | 0% | 0% | 20% |
| Diving/reach | 0% | 0% | 0% | 0% | 0% | 0% | 20% |
| Distribution | 0% | 0% | 0% | 0% | 0% | 0% | 15% |

## Quick assessment required role attributes

| Role | Quick role attributes |
| --- | --- |
| ST | Finishing box, shot power |
| W | Offensive 1v1, finishing box |
| CM | Vision/playmaking, long passing |
| CDM | Pressing/interceptions, long passing |
| FB | Tackling, crossing |
| CB | Tackling, defensive heading |
| GK | Reflexes, handling |

## Practitioner review checklist

Each practitioner should answer **Accept**, **Change requested**, or **Not applicable** for every item.

| Item | Accept / Change / N/A | Notes |
| --- | --- | --- |
| Age-group boundaries are appropriate for Dumala beta use. |  |  |
| Timed sprint and agility thresholds are plausible by age group. |  |  |
| Yo-Yo distance thresholds are plausible by age group. |  |  |
| Broad jump thresholds are plausible by age group. |  |  |
| Medicine ball throw thresholds are plausible by age group. |  |  |
| Shot power distance thresholds are plausible by age group. |  |  |
| Ball retention threshold is usable without age grouping. |  |  |
| Count-based banding is understandable for field use. |  |  |
| Coach-score mapping is understandable and not over-claimed. |  |  |
| Role weights reflect the intended seven role profiles. |  |  |
| Quick assessment required attributes are sufficient for a lightweight review. |  |  |
| Full assessment required attributes are sufficient for a complete role review. |  |  |
| Tier labels are appropriate for coaches, players, and guardians. |  |  |
| Product wording clearly presents FPRDS as beta and coach-supporting. |  |  |
| Any Philippine youth football context adjustments are identified. |  |  |

## Signoff record

At least two qualified football practitioners should complete review before FPRDS benchmarks are represented as approved.

| Reviewer | Qualification / role | Organization | Review date | Decision | Signature / confirmation |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

Decision values:

- **Accepted:** no benchmark changes required before next beta release.
- **Accepted with conditions:** usable for beta after listed corrections are completed.
- **Rejected:** benchmark tables need substantial revision before wider use.

## Correction log

| ID | Source reviewer | Area | Current value | Requested change | Rationale | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FPRDS-BR-001 |  |  |  |  |  |  | Open |

## Approval gate

FPRDS benchmark review is complete only when:

1. Required reviewers are named with qualification context.
2. Every checklist item has a decision.
3. Every requested correction is either implemented or explicitly deferred with rationale.
4. The correction log has no unresolved release-blocking items.
5. `docs/TASKS.md` is updated to mark practitioner benchmark review complete.
6. The benchmark versioning task has a corresponding implementation plan before changing production scoring tables.
