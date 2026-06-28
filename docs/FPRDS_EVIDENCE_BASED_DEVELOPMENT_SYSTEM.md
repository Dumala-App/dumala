# FPRDS Evidence-Based Development System

Updated: 2026-06-28

## 1. Core principle

Dumala's player-development model is built on one rule:

**Training creates development evidence, but only verified assessment updates official ratings.**

Training is evidence of effort, exposure, repetition, and targeted work. It can show that a player has followed a development plan, trained a weakness, carried a certain workload, or collected coach observations.

FPRDS assessment is evidence of current ability. The user-facing name may be written as Football Player Rating & Development System, but the product and codebase use FPRDS as the system name. FPRDS ratings must come from standardized drill results, age-group benchmarks, role-specific weights, and saved assessment history.

Official player ratings must never increase automatically from training attendance alone.

## 2. Product doctrine

These statements are binding product doctrine for Dumala:

- Training predicts improvement. Assessment confirms improvement.
- Training is the intervention. Assessment is the measurement.
- Ratings represent current verified ability, not effort, potential, attendance, or coach optimism.
- Training is essential, but it is not sufficient proof that measurable ability improved.
- Dumala is evidence-based, not omniscient. It helps coaches organize signals and verify progress; it does not claim to know a player's true ability without evidence.

## 3. Why automatic stat gains are rejected

Automatic stat gains are not allowed as the long-term development model because they damage trust in FPRDS.

- They make max-stat players inevitable if coaches repeatedly assign training.
- They make assessments less meaningful because ratings can rise without being retested.
- They treat all players as improving at the same rate from the same work.
- They ignore regression, injury, fatigue, inconsistency, poor form, plateauing, and missed learning.
- They let a coach, school, or club manufacture elite-looking profiles without evidence.
- They make ratings look like game progression instead of current football ability.

The correct question is not whether players should improve. Players can and should improve. The question is what proves that improvement happened.

## 4. Three independent development concepts

### FPRDS Rating

The FPRDS Rating is the player's verified current ability profile. It includes assessment-derived attributes, OVR, labels, deltas, and the latest assessment snapshot.

The FPRDS Rating can be updated only by:

- saved FPRDS assessments
- future verified evidence sources after a separate product and scoring model is approved
- future coach-approved reassessment workflows that still preserve raw evidence

Training completion alone must not update the FPRDS Rating.

### Development Evidence

Development Evidence describes the work and signals collected between assessments. It may include:

- completed training sessions
- selected drills
- target attributes
- training load
- attendance and consistency
- coach observations
- readiness signals
- recommended reassessment timing

Development Evidence can suggest that a player is likely improving. It cannot certify that official ability changed.

### Coach Confidence

Coach Confidence describes how reliable the current rating is. It should be based on freshness, completeness, and evidence quality.

Examples:

- High confidence: recent complete assessment with reliable drill data.
- Medium confidence: assessment exists but is aging, partial, or context-limited.
- Low confidence: rating is outdated, incomplete, or should be reassessed.

Coach Confidence does not replace the rating. It helps coaches understand how current and trustworthy the rating is.

## 5. System architecture rule

Training modules may:

- log activity
- schedule drills
- calculate load
- record focus areas
- collect coach notes
- show development evidence
- recommend reassessment
- support four-week development plans

Training modules must not directly mutate:

- official player OVR
- FPRDS snapshots
- assessment-derived attributes
- verified assessment history
- official rating deltas

Assessment modules remain the source of truth for official rating changes. In the current codebase, this means FPRDS scoring and assessment snapshot behavior own verified rating updates, while the training surface should be refactored away from direct rating mutation.

## 6. Recommended user flow

The intended development loop is:

1. A FPRDS assessment establishes a verified baseline.
2. The system identifies the most important weighted weakness for the player's role.
3. A training plan targets that weakness.
4. Training logs development evidence, load, consistency, and coach observations.
5. Dumala recommends a reassessment when enough evidence or time has accumulated.
6. A new FPRDS assessment updates the rating only if raw results improve.
7. Assessment history shows improvement, stagnation, or decline from verified sessions.

This keeps training useful without letting training manufacture official ratings.

## 7. UI language rules

Avoid product language that implies automatic official rating growth:

- "+3 Pace"
- "Apply gains"
- "Stat increase"
- "Level up"
- "Training improved rating"
- "Training increased OVR"

Prefer language that separates work from verification:

- "Training focus"
- "Development evidence"
- "Improvement signal"
- "Reassessment recommended"
- "Verified rating pending"
- "Targeted attribute"
- "Assessment required to confirm"

Any projected improvement must be clearly labeled as unverified. If the interface shows a possible rating change, it must say that the projection depends on a future assessment.

## 8. Future feature rules

Public profiles can show verified ratings and assessment history only when publishing, privacy, and consent controls exist.

Public profiles may show development highlights only if they are clearly separated from verified ratings.

Reports must distinguish:

- training completed
- development observed
- ability verified

Match data may influence ratings only after a separate verified-evidence model is designed. Match contributions, video review, GPS data, or coach evaluations must not be mixed into FPRDS ratings without versioned rules, explainable weighting, and clear source labeling.

No Dumala rating, development score, coach confidence label, or training signal may be represented as a medical, physiological, federation, PFF, AFC, FIFA, or professional-club certification.

## 9. Acceptance criteria

The evidence-based development system is working when:

- A completed training session never changes official OVR.
- A completed training session never changes the official FPRDS snapshot.
- FPRDS assessment history is the source of official rating deltas.
- Coaches can understand why a player trained hard but did not improve in rating.
- Players can improve, stagnate, or regress when reassessment results change.
- Training history remains valuable as context without being treated as proof.
- UI copy clearly separates projected development from verified ability.

## 10. Implementation guardrail

Any future feature that increases official ratings without verified evidence conflicts with this doctrine and should be rejected or redesigned.

If a feature needs to reward training work, it should update Development Evidence or Coach Confidence, not FPRDS Rating.
