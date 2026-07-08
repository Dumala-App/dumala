import type { AgeGroup, AssessmentSession, FprdsAttributeId } from '../types';
import {
  BALL_RETENTION_SECONDS,
  BROAD_JUMP_CM,
  ILLINOIS_AGILITY,
  MED_BALL_THROW_CM,
  OUT_OF_5_BANDS,
  OUT_OF_10_BANDS,
  SHOT_POWER_DISTANCE_M,
  SPRINT_10M,
  SPRINT_30M,
  YOYO_DISTANCE,
  type BenchmarkTable
} from './benchmarks';
import {
  clampScore,
  matchBenchmarkTier,
  scoreFromBands,
  scoreFromBenchmarkTable,
  scoreFromCoach1to10,
  scoreFromOutOf10Direct
} from './scoring';

export type BetaDrillUnit =
  | 'seconds'
  | 'meters'
  | 'centimeters'
  | 'out_of_10'
  | 'out_of_6'
  | 'out_of_5'
  | 'coach_1_10';

export interface BetaDrillBand {
  tier: string;
  rawBest: number | null;
  rawWorst: number | null;
}

export interface BetaDrillResultInput {
  drillId: string;
  attributeId: FprdsAttributeId;
  rawValue: number;
  unit: BetaDrillUnit;
  // The single-drill score assigned by the current benchmark tables, or null for
  // composite raw inputs whose score only exists once combined with a partner drill.
  score: number | null;
  // The benchmark tier the raw value landed in, when the drill uses an age-grouped
  // benchmark table. Fixed-scale drills (out-of-10, coach 1-10) carry null here.
  benchmarkBand: BetaDrillBand | null;
}

const numberOrNull = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

// One row per raw drill measurement present in the session. Benchmark-table drills
// record the matched tier for distribution analysis; fixed-scale drills record the
// derived score only. Composite raws (finishing goals + on target, long-passing
// 30m + 40m, positioning coach + clearances) store the raw value with a null score
// because their attribute score is only meaningful once the pair is combined.
export const deriveBetaDrillResults = (session: AssessmentSession): BetaDrillResultInput[] => {
  const results: BetaDrillResultInput[] = [];
  const age = session.ageGroup as AgeGroup;
  const base = session.rawResults.base;
  const roleSpecific = session.rawResults.roleSpecific as Record<string, number | undefined>;

  const benchDrill = (
    drillId: string,
    attributeId: FprdsAttributeId,
    raw: number | null,
    unit: BetaDrillUnit,
    table: BenchmarkTable
  ) => {
    if (raw === null) return;
    const tier = matchBenchmarkTier(raw, table);
    results.push({
      drillId,
      attributeId,
      rawValue: raw,
      unit,
      score: clampScore(scoreFromBenchmarkTable(raw, table)),
      benchmarkBand: tier ? { tier: tier.label, rawBest: tier.rawBest, rawWorst: tier.rawWorst } : null
    });
  };

  const scaleDrill = (
    drillId: string,
    attributeId: FprdsAttributeId,
    raw: number | null,
    unit: BetaDrillUnit,
    score: number | null
  ) => {
    if (raw === null) return;
    results.push({
      drillId,
      attributeId,
      rawValue: raw,
      unit,
      score: score === null ? null : clampScore(score),
      benchmarkBand: null
    });
  };

  // Base physical and technical drills (all roles).
  benchDrill('sprint_10m', 'pace', numberOrNull(base.sprint10mSeconds), 'seconds', SPRINT_10M[age]);
  benchDrill('sprint_30m', 'pace', numberOrNull(base.sprint30mSeconds), 'seconds', SPRINT_30M[age]);
  benchDrill('yoyo', 'stamina', numberOrNull(base.yoyoMeters), 'meters', YOYO_DISTANCE[age]);
  benchDrill('illinois_agility', 'agility', numberOrNull(base.illinoisSeconds), 'seconds', ILLINOIS_AGILITY[age]);
  benchDrill('broad_jump', 'strength', numberOrNull(base.broadJumpCm), 'centimeters', BROAD_JUMP_CM[age]);
  benchDrill('med_ball_throw', 'strength', numberOrNull(base.medicineBallThrowCm), 'centimeters', MED_BALL_THROW_CM[age]);
  scaleDrill('first_touch', 'firstTouch', numberOrNull(base.firstTouchSuccessesOutOf10), 'out_of_10',
    numberOrNull(base.firstTouchSuccessesOutOf10) === null ? null : scoreFromOutOf10Direct(base.firstTouchSuccessesOutOf10));
  scaleDrill('short_passing', 'shortPassing', numberOrNull(base.shortPassingSuccessesOutOf10), 'out_of_10',
    numberOrNull(base.shortPassingSuccessesOutOf10) === null ? null : scoreFromOutOf10Direct(base.shortPassingSuccessesOutOf10));

  const rs = (key: string) => numberOrNull(roleSpecific[key]);

  if (session.role === 'ST' || session.role === 'W') {
    scaleDrill('finishing_goals', 'finishingBox', rs('finishingGoalsOutOf6'), 'out_of_6', null);
    scaleDrill('finishing_on_target', 'finishingBox', rs('finishingOnTargetOutOf6'), 'out_of_6', null);
    benchDrill('shot_power', 'shotPower', rs('shotPowerMaxControlledDistanceMeters'), 'meters', SHOT_POWER_DISTANCE_M[age]);
    const takeons = rs('offensive1v1TakeonsOutOf10');
    scaleDrill('offensive_1v1', 'offensive1v1', takeons, 'out_of_10', takeons === null ? null : scoreFromBands(takeons, OUT_OF_10_BANDS));
    const heading = rs('attackingHeadingOnTargetOutOf10');
    scaleDrill('attacking_heading', 'attackingHeading', heading, 'out_of_10', heading === null ? null : scoreFromOutOf10Direct(heading));
  }

  if (session.role === 'CM' || session.role === 'CDM') {
    scaleDrill('long_passing_30m', 'longPassing', rs('longPassing30mSuccessesOutOf5'), 'out_of_5', null);
    scaleDrill('long_passing_40m', 'longPassing', rs('longPassing40mSuccessesOutOf5'), 'out_of_5', null);
    const vision = rs('visionCoachScore1to10');
    scaleDrill('vision', 'visionPlaymaking', vision, 'coach_1_10', vision === null ? null : scoreFromCoach1to10(vision));
    benchDrill('ball_retention', 'ballRetention', rs('ballRetentionBestSeconds'), 'seconds', BALL_RETENTION_SECONDS);
    const pressing = rs('pressingWinsOutOf5');
    scaleDrill('pressing', 'pressingInterceptions', pressing, 'out_of_5', pressing === null ? null : scoreFromBands(pressing, OUT_OF_5_BANDS));
  }

  if (session.role === 'FB' || session.role === 'CB') {
    const tackling = rs('tacklingWinsOutOf10');
    scaleDrill('tackling', 'tackling', tackling, 'out_of_10', tackling === null ? null : scoreFromBands(tackling, OUT_OF_10_BANDS));
    const defHeading = rs('defensiveHeadingClearancesOutOf10');
    scaleDrill('defensive_heading', 'defensiveHeading', defHeading, 'out_of_10', defHeading === null ? null : scoreFromOutOf10Direct(defHeading));
    scaleDrill('positioning_coach', 'positioningClearances', rs('positioningCoachScore1to10'), 'coach_1_10', null);
    scaleDrill('positioning_clearances', 'positioningClearances', rs('positioningClearancesToSafeZoneOutOf10'), 'out_of_10', null);
    const crossing = rs('crossingSuccessesOutOf10');
    scaleDrill('crossing', 'crossing', crossing, 'out_of_10', crossing === null ? null : scoreFromOutOf10Direct(crossing));
  }

  if (session.role === 'GK') {
    const reflexes = rs('gkReflexesSavesOutOf10');
    scaleDrill('gk_reflexes', 'reflexes', reflexes, 'out_of_10', reflexes === null ? null : scoreFromOutOf10Direct(reflexes));
    const handling = rs('gkHandlingCleanCatchesOutOf10');
    scaleDrill('gk_handling', 'handling', handling, 'out_of_10', handling === null ? null : scoreFromOutOf10Direct(handling));
    const diving = rs('gkDivingSavesOutOf10');
    scaleDrill('gk_diving', 'divingReach', diving, 'out_of_10', diving === null ? null : scoreFromOutOf10Direct(diving));
    const distribution = rs('gkDistributionSuccessesOutOf10');
    scaleDrill('gk_distribution', 'distribution', distribution, 'out_of_10', distribution === null ? null : scoreFromOutOf10Direct(distribution));
  }

  return results;
};
