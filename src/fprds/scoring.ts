import type { AgeGroup, AssessmentSession, FprdsAttributeId, FprdsRole, Player } from '../types';
import {
  BALL_RETENTION_SECONDS,
  BROAD_JUMP_CM,
  COACH_SCORE_1_TO_10,
  ILLINOIS_AGILITY,
  MED_BALL_THROW_CM,
  OUT_OF_10_BANDS,
  OUT_OF_10_DIRECT,
  OUT_OF_5_BANDS,
  SHOT_POWER_DISTANCE_M,
  SPRINT_10M,
  SPRINT_30M,
  YOYO_DISTANCE
} from './benchmarks';
import { POSITION_ATTR_COMPAT_KEYS, ROLE_WEIGHTS } from './weights';

// benchmarks.ts only exports direction via string, but keep a stable local alias in case it changes.
type BenchmarkDirection = 'lower_is_better' | 'higher_is_better';

export const clampScore = (score: number): number => {
  if (!Number.isFinite(score)) return 10;
  return Math.min(99, Math.max(10, Math.round(score)));
};

export const clampInt = (val: number, min: number, max: number): number => {
  if (!Number.isFinite(val)) return min;
  return Math.min(max, Math.max(min, Math.round(val)));
};

export const toNumberOrNull = (val: string): number | null => {
  const n = Number(val);
  if (!Number.isFinite(n)) return null;
  return n;
};

export const computeAgeGroupFromDob = (dateOfBirthIso: string, assessmentDateIso: string): AgeGroup | null => {
  const dob = new Date(dateOfBirthIso);
  const at = new Date(assessmentDateIso);
  if (Number.isNaN(dob.getTime()) || Number.isNaN(at.getTime())) return null;

  let age = at.getFullYear() - dob.getFullYear();
  const m = at.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && at.getDate() < dob.getDate())) {
    age -= 1;
  }

  if (age <= 12) return 'U12';
  if (age <= 15) return 'U15';
  if (age <= 18) return 'U18';
  return 'Adult';
};

const isInTier = (raw: number, best: number | null, worst: number | null, direction: BenchmarkDirection): boolean => {
  if (!Number.isFinite(raw)) return false;

  if (direction === 'lower_is_better') {
    // Example: Elite: best=null, worst=3.9 => raw <= 3.9
    if (best === null && worst !== null) return raw <= worst;
    // Example: Beginner: best=5.0, worst=null => raw >= 5.0
    if (best !== null && worst === null) return raw >= best;
    if (best !== null && worst !== null) return raw >= best && raw <= worst;
    return false;
  }

  // higher_is_better
  // Example: Elite: best=null, worst=2200 => raw >= 2200
  if (best === null && worst !== null) return raw >= worst;
  // Example: Beginner: best=999, worst=null => raw <= 999
  if (best !== null && worst === null) return raw <= best;
  if (best !== null && worst !== null) return raw <= best && raw >= worst;
  return false;
};

const scoreWithinTier = (raw: number, best: number | null, worst: number | null, scoreMin: number, scoreMax: number, direction: BenchmarkDirection): number => {
  // Open-ended tiers: return the end of the tier range.
  if (best === null || worst === null) {
    // Elite is open-ended at the "best" side, Beginner is open-ended at the "worst" side.
    const isEliteOpenEnded =
      (direction === 'lower_is_better' && best === null && worst !== null) ||
      (direction === 'higher_is_better' && best === null && worst !== null);
    return isEliteOpenEnded ? scoreMax : scoreMin;
  }

  if (!Number.isFinite(raw)) return scoreMin;

  if (direction === 'lower_is_better') {
    const denom = worst - best;
    if (denom === 0) return scoreMax;
    const ratio = (worst - raw) / denom;
    const clamped = Math.min(1, Math.max(0, ratio));
    return scoreMin + clamped * (scoreMax - scoreMin);
  }

  const denom = best - worst;
  if (denom === 0) return scoreMax;
  const ratio = (raw - worst) / denom;
  const clamped = Math.min(1, Math.max(0, ratio));
  return scoreMin + clamped * (scoreMax - scoreMin);
};

export const scoreFromBenchmarkTable = (raw: number, table: { direction: BenchmarkDirection; tiers: Array<{ rawBest: number | null; rawWorst: number | null; scoreMin: number; scoreMax: number }> }): number => {
  const tier = table.tiers.find(t => isInTier(raw, t.rawBest, t.rawWorst, table.direction));
  if (!tier) return 10;
  return scoreWithinTier(raw, tier.rawBest, tier.rawWorst, tier.scoreMin, tier.scoreMax, table.direction);
};

export const scoreFromOutOf10Direct = (successes: number): number => {
  const key = clampInt(successes, 0, 10);
  return OUT_OF_10_DIRECT[key] ?? 10;
};

export const scoreFromCoach1to10 = (coachScore: number): number => {
  const key = clampInt(coachScore, 1, 10);
  return COACH_SCORE_1_TO_10[key] ?? 10;
};

export const scoreFromBands = (value: number, bands: Array<{ min: number; max: number; scoreMin: number; scoreMax: number }>): number => {
  if (!Number.isFinite(value)) return 10;
  const band = bands.find(b => value >= b.min && value <= b.max);
  if (!band) return 10;

  if (band.min === band.max) return band.scoreMax;
  const ratio = (value - band.min) / (band.max - band.min);
  return band.scoreMin + ratio * (band.scoreMax - band.scoreMin);
};

export const computeFinishingBoxScore = (goalsOutOf6: number, onTargetOutOf6: number): number => {
  const goals = clampInt(goalsOutOf6, 0, 6);
  const onTarget = clampInt(onTargetOutOf6, 0, 6);
  if (onTarget === 0) return 10;
  const safeGoals = Math.min(goals, onTarget);

  let bandMin = 10;
  let bandMax = 34;

  if (onTarget === 6 && safeGoals >= 5) {
    bandMin = 95;
    bandMax = 99;
  } else if (onTarget === 5 && safeGoals >= 4) {
    bandMin = 80;
    bandMax = 94;
  } else if (onTarget === 4 && safeGoals >= 3) {
    bandMin = 65;
    bandMax = 79;
  } else if (onTarget === 3 && safeGoals >= 2) {
    bandMin = 50;
    bandMax = 64;
  } else if (onTarget === 2) {
    bandMin = 35;
    bandMax = 49;
  }

  const ratio = safeGoals / onTarget;
  const rawScore = bandMin + ratio * (bandMax - bandMin);
  return clampScore(rawScore);
};

export const getAttributeLabel = (score: number): { label: string; color: string } => {
  const s = clampScore(score);
  if (s >= 90) return { label: 'Elite', color: 'text-amber-400' };
  if (s >= 75) return { label: 'Advanced', color: 'text-emerald-400' };
  if (s >= 55) return { label: 'Developing', color: 'text-sky-400' };
  if (s >= 35) return { label: 'Needs Work', color: 'text-orange-400' };
  return { label: 'Beginner', color: 'text-rose-400' };
};

export const getOvrTierLabel = (ovr: number): string => {
  const s = Math.round(ovr);
  if (s >= 85) return 'Standout';
  if (s >= 70) return 'Core';
  if (s >= 55) return 'Developing';
  if (s >= 40) return 'Below Par';
  return 'Foundation';
};

export const computeOvr = (role: FprdsRole, attributeScores: Record<FprdsAttributeId, number>): number => {
  const weights = ROLE_WEIGHTS[role];
  const sum = (Object.keys(weights) as FprdsAttributeId[]).reduce((acc, key) => {
    const w = weights[key] ?? 0;
    if (w <= 0) return acc;
    const val = clampScore(attributeScores[key] ?? 10);
    return acc + val * w;
  }, 0);
  return Math.round(sum);
};

export const computeWeakestWeightedAttribute = (role: FprdsRole, attributeScores: Record<FprdsAttributeId, number>): FprdsAttributeId => {
  const weights = ROLE_WEIGHTS[role];
  const weightedKeys = (Object.keys(weights) as FprdsAttributeId[]).filter(k => (weights[k] ?? 0) > 0);
  let weakest = weightedKeys[0] ?? 'pace';
  let weakestScore = clampScore(attributeScores[weakest] ?? 10);

  for (const key of weightedKeys) {
    const val = clampScore(attributeScores[key] ?? 10);
    if (val < weakestScore) {
      weakestScore = val;
      weakest = key;
    }
  }
  return weakest;
};

export interface ScoreComputationError {
  field: string;
  message: string;
}

export interface ScoreComputationResult {
  attributeScores: Record<FprdsAttributeId, number>;
  ovr: number;
  weakestAttributeId: FprdsAttributeId;
  ovrTierLabel: string;
}

export const computeScoresForSession = (params: {
  role: FprdsRole;
  ageGroup: AgeGroup;
  assessmentType: 'Full' | 'Quick';
  base: {
    sprint10mSeconds: number;
    sprint30mSeconds: number;
    yoyoMeters: number;
    illinoisSeconds: number;
    broadJumpCm: number;
    medicineBallThrowCm: number;
    firstTouchSuccessesOutOf10: number;
    shortPassingSuccessesOutOf10: number;
  };
  roleSpecific: Record<string, number>;
}): { ok: true; result: ScoreComputationResult } | { ok: false; errors: ScoreComputationError[] } => {
  const errors: ScoreComputationError[] = [];
  const requireNumber = (field: string, val: number) => {
    if (!Number.isFinite(val)) {
      errors.push({ field, message: 'Required field is missing or invalid.' });
    }
  };

  requireNumber('sprint10mSeconds', params.base.sprint10mSeconds);
  requireNumber('sprint30mSeconds', params.base.sprint30mSeconds);
  requireNumber('yoyoMeters', params.base.yoyoMeters);
  requireNumber('illinoisSeconds', params.base.illinoisSeconds);
  requireNumber('broadJumpCm', params.base.broadJumpCm);
  requireNumber('medicineBallThrowCm', params.base.medicineBallThrowCm);
  requireNumber('firstTouchSuccessesOutOf10', params.base.firstTouchSuccessesOutOf10);
  requireNumber('shortPassingSuccessesOutOf10', params.base.shortPassingSuccessesOutOf10);

  if (errors.length > 0) return { ok: false, errors };

  const sprint30 = scoreFromBenchmarkTable(params.base.sprint30mSeconds, SPRINT_30M[params.ageGroup]);
  const sprint10 = scoreFromBenchmarkTable(params.base.sprint10mSeconds, SPRINT_10M[params.ageGroup]);
  const pace = clampScore(sprint30 * 0.6 + sprint10 * 0.4);

  const stamina = clampScore(scoreFromBenchmarkTable(params.base.yoyoMeters, YOYO_DISTANCE[params.ageGroup]));
  const agility = clampScore(scoreFromBenchmarkTable(params.base.illinoisSeconds, ILLINOIS_AGILITY[params.ageGroup]));

  const broad = scoreFromBenchmarkTable(params.base.broadJumpCm, BROAD_JUMP_CM[params.ageGroup]);
  const med = scoreFromBenchmarkTable(params.base.medicineBallThrowCm, MED_BALL_THROW_CM[params.ageGroup]);
  const strength = clampScore(broad * 0.5 + med * 0.5);

  const firstTouch = clampScore(scoreFromOutOf10Direct(params.base.firstTouchSuccessesOutOf10));
  const shortPassing = clampScore(scoreFromOutOf10Direct(params.base.shortPassingSuccessesOutOf10));

  const attributeScores: Record<FprdsAttributeId, number> = {
    pace,
    stamina,
    agility,
    strength,
    firstTouch,
    shortPassing,
    finishingBox: 10,
    shotPower: 10,
    offensive1v1: 10,
    attackingHeading: 10,
    longPassing: 10,
    visionPlaymaking: 10,
    ballRetention: 10,
    pressingInterceptions: 10,
    tackling: 10,
    defensiveHeading: 10,
    positioningClearances: 10,
    crossing: 10,
    reflexes: 10,
    handling: 10,
    divingReach: 10,
    distribution: 10
  };

  const r = params.roleSpecific;

  // Role scoring
  if (params.role === 'ST' || params.role === 'W') {
    if (params.assessmentType === 'Full' || params.role === 'W') {
      // Validate minimally. (Quick fields enforced by UI; scoring still guards.)
    }

    const goals = r.finishingGoalsOutOf6;
    const onTarget = r.finishingOnTargetOutOf6;
    if (Number.isFinite(goals) && Number.isFinite(onTarget)) {
      attributeScores.finishingBox = computeFinishingBoxScore(goals, onTarget);
    } else if (params.assessmentType === 'Full' || params.role === 'ST' || params.role === 'W') {
      errors.push({ field: 'finishing', message: 'Finishing drill results are required.' });
    }

    if (params.role === 'ST' || params.role === 'W') {
      if (Number.isFinite(r.offensive1v1TakeonsOutOf10)) {
        attributeScores.offensive1v1 = clampScore(scoreFromBands(r.offensive1v1TakeonsOutOf10, OUT_OF_10_BANDS));
      } else if (params.assessmentType === 'Full' || params.role === 'W') {
        // W Quick requires 1v1, ST Full requires it.
        if (params.role === 'W' || params.assessmentType === 'Full') {
          errors.push({ field: 'offensive1v1', message: 'Offensive 1v1 result is required.' });
        }
      }
    }

    if (Number.isFinite(r.shotPowerMaxControlledDistanceMeters)) {
      attributeScores.shotPower = clampScore(scoreFromBenchmarkTable(r.shotPowerMaxControlledDistanceMeters, SHOT_POWER_DISTANCE_M[params.ageGroup]));
    } else if (params.assessmentType === 'Full' || params.role === 'ST') {
      if (params.role === 'ST') errors.push({ field: 'shotPower', message: 'Shot power result is required.' });
    }

    if (Number.isFinite(r.attackingHeadingOnTargetOutOf10)) {
      attributeScores.attackingHeading = clampScore(scoreFromOutOf10Direct(r.attackingHeadingOnTargetOutOf10));
    } else if (params.assessmentType === 'Full') {
      errors.push({ field: 'attackingHeading', message: 'Attacking heading result is required.' });
    }
  }

  if (params.role === 'CM' || params.role === 'CDM') {
    const lp30 = r.longPassing30mSuccessesOutOf5;
    const lp40 = r.longPassing40mSuccessesOutOf5;
    if (Number.isFinite(lp30) && Number.isFinite(lp40)) {
      const weighted = clampInt(lp30, 0, 5) + clampInt(lp40, 0, 5) * 1.5;
      const effectiveOutOf10 = (weighted / 12.5) * 10;
      attributeScores.longPassing = clampScore(scoreFromBands(effectiveOutOf10, OUT_OF_10_BANDS));
    } else {
      errors.push({ field: 'longPassing', message: 'Long passing results are required.' });
    }

    if (Number.isFinite(r.visionCoachScore1to10)) {
      attributeScores.visionPlaymaking = clampScore(scoreFromCoach1to10(r.visionCoachScore1to10));
    } else if (params.assessmentType === 'Full' || params.role === 'CM') {
      if (params.role === 'CM') errors.push({ field: 'vision', message: 'Vision / playmaking score is required.' });
    }

    if (Number.isFinite(r.ballRetentionBestSeconds)) {
      attributeScores.ballRetention = clampScore(scoreFromBenchmarkTable(r.ballRetentionBestSeconds, BALL_RETENTION_SECONDS));
    } else if (params.assessmentType === 'Full') {
      errors.push({ field: 'ballRetention', message: 'Ball retention time is required.' });
    }

    if (Number.isFinite(r.pressingWinsOutOf5)) {
      attributeScores.pressingInterceptions = clampScore(scoreFromBands(r.pressingWinsOutOf5, OUT_OF_5_BANDS));
    } else if (params.assessmentType === 'Full' || params.role === 'CDM') {
      if (params.role === 'CDM') errors.push({ field: 'pressing', message: 'Pressing / interceptions wins are required.' });
    }
  }

  if (params.role === 'FB' || params.role === 'CB') {
    if (Number.isFinite(r.tacklingWinsOutOf10)) {
      attributeScores.tackling = clampScore(scoreFromBands(r.tacklingWinsOutOf10, OUT_OF_10_BANDS));
    } else {
      errors.push({ field: 'tackling', message: 'Tackling wins are required.' });
    }

    if (Number.isFinite(r.defensiveHeadingClearancesOutOf10)) {
      attributeScores.defensiveHeading = clampScore(scoreFromOutOf10Direct(r.defensiveHeadingClearancesOutOf10));
    } else if (params.assessmentType === 'Full' || params.role === 'CB') {
      if (params.role === 'CB') errors.push({ field: 'defensiveHeading', message: 'Defensive heading clearances are required.' });
    }

    const coachScore = r.positioningCoachScore1to10;
    const clearances = r.positioningClearancesToSafeZoneOutOf10;
    if (Number.isFinite(coachScore) && Number.isFinite(clearances)) {
      const coachPart = clampInt(coachScore, 1, 10) * 10 * 0.6;
      const clearPart = (clampInt(clearances, 0, 10) / 10) * 100 * 0.4;
      attributeScores.positioningClearances = clampScore(coachPart + clearPart);
    } else if (params.assessmentType === 'Full') {
      errors.push({ field: 'positioning', message: 'Positioning coach score and clearance count are required.' });
    }

    if (Number.isFinite(r.crossingSuccessesOutOf10)) {
      attributeScores.crossing = clampScore(scoreFromOutOf10Direct(r.crossingSuccessesOutOf10));
    } else if (params.assessmentType === 'Full' || params.role === 'FB') {
      if (params.role === 'FB') errors.push({ field: 'crossing', message: 'Crossing successes are required.' });
    }
  }

  if (params.role === 'GK') {
    if (Number.isFinite(r.gkReflexesSavesOutOf10)) {
      attributeScores.reflexes = clampScore(scoreFromOutOf10Direct(r.gkReflexesSavesOutOf10));
    } else {
      errors.push({ field: 'reflexes', message: 'Reflexes saves are required.' });
    }

    if (Number.isFinite(r.gkHandlingCleanCatchesOutOf10)) {
      attributeScores.handling = clampScore(scoreFromOutOf10Direct(r.gkHandlingCleanCatchesOutOf10));
    } else {
      errors.push({ field: 'handling', message: 'Handling clean catches are required.' });
    }

    if (Number.isFinite(r.gkDivingSavesOutOf10)) {
      attributeScores.divingReach = clampScore(scoreFromOutOf10Direct(r.gkDivingSavesOutOf10));
    } else if (params.assessmentType === 'Full') {
      errors.push({ field: 'diving', message: 'Diving / reach saves are required.' });
    }

    if (Number.isFinite(r.gkDistributionSuccessesOutOf10)) {
      attributeScores.distribution = clampScore(scoreFromOutOf10Direct(r.gkDistributionSuccessesOutOf10));
    } else if (params.assessmentType === 'Full') {
      errors.push({ field: 'distribution', message: 'Distribution successes are required.' });
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  const ovr = computeOvr(params.role, attributeScores);
  const weakestAttributeId = computeWeakestWeightedAttribute(params.role, attributeScores);
  const ovrTierLabel = getOvrTierLabel(ovr);
  return { ok: true, result: { attributeScores, ovr, weakestAttributeId, ovrTierLabel } };
};

export const applyAssessmentSnapshotToPlayer = (player: Player, session: AssessmentSession): Player => {
  const nextBase = {
    ...player.baseAttributes,
    pace: clampScore(session.attributeScores.pace),
    stamina: clampScore(session.attributeScores.stamina),
    agility: clampScore(session.attributeScores.agility),
    strength: clampScore(session.attributeScores.strength),
    firstTouch: clampScore(session.attributeScores.firstTouch),
    shortPassing: clampScore(session.attributeScores.shortPassing)
  };

  const nextPositionAttributes: Record<string, number> = { ...(player.positionAttributes || {}) };
  (Object.keys(session.attributeScores) as FprdsAttributeId[]).forEach((attrId) => {
    const compatKey = POSITION_ATTR_COMPAT_KEYS[attrId];
    if (!compatKey) return;
    nextPositionAttributes[compatKey] = clampScore(session.attributeScores[attrId]);
  });

  return {
    ...player,
    baseAttributes: nextBase,
    positionAttributes: nextPositionAttributes,
    fprdsRole: session.role,
    fprdsLastAssessmentId: session.id
  };
};
