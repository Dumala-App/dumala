import { describe, expect, it } from 'vitest';
import type { AgeGroup, FprdsAttributeId, FprdsRole } from '../types';
import {
  BALL_RETENTION_SECONDS,
  BROAD_JUMP_CM,
  ILLINOIS_AGILITY,
  MED_BALL_THROW_CM,
  SHOT_POWER_DISTANCE_M,
  SPRINT_10M,
  SPRINT_30M,
  YOYO_DISTANCE,
  type BenchmarkTable
} from './benchmarks';
import {
  computeAgeGroupFromDob,
  computeOvr,
  computeScoresForSession,
  scoreFromBenchmarkTable
} from './scoring';
import { ROLE_WEIGHTS } from './weights';

const AGE_GROUPS: AgeGroup[] = ['U12', 'U15', 'U18', 'Adult'];
const ROLES: FprdsRole[] = ['ST', 'W', 'CM', 'CDM', 'FB', 'CB', 'GK'];

const benchmarkCases: Array<[string, BenchmarkTable]> = [
  ...AGE_GROUPS.flatMap((ageGroup) => [
    [`30m sprint ${ageGroup}`, SPRINT_30M[ageGroup]] as [string, BenchmarkTable],
    [`10m sprint ${ageGroup}`, SPRINT_10M[ageGroup]] as [string, BenchmarkTable],
    [`Illinois agility ${ageGroup}`, ILLINOIS_AGILITY[ageGroup]] as [string, BenchmarkTable],
    [`Yo-Yo distance ${ageGroup}`, YOYO_DISTANCE[ageGroup]] as [string, BenchmarkTable],
    [`broad jump ${ageGroup}`, BROAD_JUMP_CM[ageGroup]] as [string, BenchmarkTable],
    [`medicine-ball throw ${ageGroup}`, MED_BALL_THROW_CM[ageGroup]] as [string, BenchmarkTable],
    [`shot power ${ageGroup}`, SHOT_POWER_DISTANCE_M[ageGroup]] as [string, BenchmarkTable]
  ]),
  ['ball retention', BALL_RETENTION_SECONDS]
];

const emptyScores = (value = 10): Record<FprdsAttributeId, number> => ({
  pace: value,
  stamina: value,
  agility: value,
  strength: value,
  firstTouch: value,
  shortPassing: value,
  finishingBox: value,
  shotPower: value,
  offensive1v1: value,
  attackingHeading: value,
  longPassing: value,
  visionPlaymaking: value,
  ballRetention: value,
  pressingInterceptions: value,
  tackling: value,
  defensiveHeading: value,
  positioningClearances: value,
  crossing: value,
  reflexes: value,
  handling: value,
  divingReach: value,
  distribution: value
});

const validBase = {
  sprint10mSeconds: 1.8,
  sprint30mSeconds: 4.4,
  yoyoMeters: 1500,
  illinoisSeconds: 15.5,
  broadJumpCm: 190,
  medicineBallThrowCm: 550,
  firstTouchSuccessesOutOf10: 8,
  shortPassingSuccessesOutOf10: 8
};

const fullRoleResults: Record<FprdsRole, Record<string, number>> = {
  ST: {
    finishingGoalsOutOf6: 4,
    finishingOnTargetOutOf6: 5,
    shotPowerMaxControlledDistanceMeters: 30,
    offensive1v1TakeonsOutOf10: 7,
    attackingHeadingOnTargetOutOf10: 6
  },
  W: {
    finishingGoalsOutOf6: 4,
    finishingOnTargetOutOf6: 5,
    shotPowerMaxControlledDistanceMeters: 30,
    offensive1v1TakeonsOutOf10: 7,
    attackingHeadingOnTargetOutOf10: 6
  },
  CM: {
    longPassing30mSuccessesOutOf5: 4,
    longPassing40mSuccessesOutOf5: 3,
    visionCoachScore1to10: 8,
    ballRetentionBestSeconds: 18,
    pressingWinsOutOf5: 3
  },
  CDM: {
    longPassing30mSuccessesOutOf5: 4,
    longPassing40mSuccessesOutOf5: 3,
    visionCoachScore1to10: 8,
    ballRetentionBestSeconds: 18,
    pressingWinsOutOf5: 3
  },
  FB: {
    tacklingWinsOutOf10: 8,
    defensiveHeadingClearancesOutOf10: 7,
    positioningCoachScore1to10: 8,
    positioningClearancesToSafeZoneOutOf10: 7,
    crossingSuccessesOutOf10: 7
  },
  CB: {
    tacklingWinsOutOf10: 8,
    defensiveHeadingClearancesOutOf10: 7,
    positioningCoachScore1to10: 8,
    positioningClearancesToSafeZoneOutOf10: 7,
    crossingSuccessesOutOf10: 7
  },
  GK: {
    gkReflexesSavesOutOf10: 8,
    gkHandlingCleanCatchesOutOf10: 8,
    gkDivingSavesOutOf10: 7,
    gkDistributionSuccessesOutOf10: 7
  }
};

const quickRoleFields: Record<FprdsRole, string[]> = {
  ST: ['finishingGoalsOutOf6', 'finishingOnTargetOutOf6', 'shotPowerMaxControlledDistanceMeters'],
  W: ['finishingGoalsOutOf6', 'finishingOnTargetOutOf6', 'offensive1v1TakeonsOutOf10'],
  CM: ['longPassing30mSuccessesOutOf5', 'longPassing40mSuccessesOutOf5', 'visionCoachScore1to10'],
  CDM: ['longPassing30mSuccessesOutOf5', 'longPassing40mSuccessesOutOf5', 'pressingWinsOutOf5'],
  FB: ['tacklingWinsOutOf10', 'crossingSuccessesOutOf10'],
  CB: ['tacklingWinsOutOf10', 'defensiveHeadingClearancesOutOf10'],
  GK: ['gkReflexesSavesOutOf10', 'gkHandlingCleanCatchesOutOf10']
};

describe('FPRDS benchmark interpolation', () => {
  it.each(benchmarkCases)('%s is monotonic, bounded, and scores its published tiers', (_name, table) => {
    const finiteBounds = table.tiers.flatMap(tier => [tier.rawBest, tier.rawWorst])
      .filter((value): value is number => value !== null);
    const minimum = Math.min(...finiteBounds);
    const maximum = Math.max(...finiteBounds);
    const samples = Array.from({ length: 101 }, (_, index) =>
      minimum - 1 + ((maximum - minimum + 2) * index) / 100
    );
    const scores = samples.map(raw => scoreFromBenchmarkTable(raw, table));

    scores.forEach(score => {
      expect(score).toBeGreaterThanOrEqual(10);
      expect(score).toBeLessThanOrEqual(99);
    });

    for (let index = 1; index < scores.length; index++) {
      if (table.direction === 'higher_is_better') {
        expect(scores[index]).toBeGreaterThanOrEqual(scores[index - 1] - 0.000001);
      } else {
        expect(scores[index]).toBeLessThanOrEqual(scores[index - 1] + 0.000001);
      }
    }

    table.tiers.forEach((tier) => {
      if (tier.rawBest !== null && tier.rawWorst !== null) {
        const midpoint = (tier.rawBest + tier.rawWorst) / 2;
        const score = scoreFromBenchmarkTable(midpoint, table);
        expect(score).toBeGreaterThanOrEqual(tier.scoreMin);
        expect(score).toBeLessThanOrEqual(tier.scoreMax);
      }
    });
  });

  it('interpolates rounded gaps and handles invalid inputs consistently', () => {
    expect(scoreFromBenchmarkTable(4.895, SPRINT_30M.U12)).toBeCloseTo(74.5);
    expect(scoreFromBenchmarkTable(1199.5, YOYO_DISTANCE.U12)).toBeCloseTo(89.5);
    expect(scoreFromBenchmarkTable(Number.NaN, YOYO_DISTANCE.Adult)).toBe(10);
    expect(scoreFromBenchmarkTable(Number.POSITIVE_INFINITY, SPRINT_10M.Adult)).toBe(10);
  });
});

describe('FPRDS role weighting', () => {
  it.each(ROLES)('%s weights total one and preserve uniform ratings', (role) => {
    const totalWeight = Object.values(ROLE_WEIGHTS[role]).reduce((sum, weight) => sum + weight, 0);
    expect(totalWeight).toBeCloseTo(1);
    expect(computeOvr(role, emptyScores(10))).toBe(10);
    expect(computeOvr(role, emptyScores(55))).toBe(55);
    expect(computeOvr(role, emptyScores(99))).toBe(99);
  });

  it.each(ROLES)('%s uses every weighted attribute and ignores unrelated attributes', (role) => {
    const weights = ROLE_WEIGHTS[role];
    const baseline = emptyScores(10);

    (Object.keys(weights) as FprdsAttributeId[]).forEach((attribute) => {
      const changed = { ...baseline, [attribute]: 99 };
      const expected = Math.round(10 + 89 * weights[attribute]);
      expect(computeOvr(role, changed)).toBe(expected);
    });
  });
});

describe('FPRDS age groups', () => {
  it('changes group on the birthday using fixed calendar dates', () => {
    expect(computeAgeGroupFromDob('2013-06-24', '2026-06-23')).toBe('U12');
    expect(computeAgeGroupFromDob('2013-06-24', '2026-06-24')).toBe('U15');
    expect(computeAgeGroupFromDob('2013-06-24', '2026-06-25')).toBe('U15');
  });

  it.each([
    ['2014-06-23', 'U12'],
    ['2013-06-23', 'U15'],
    ['2011-06-23', 'U15'],
    ['2010-06-23', 'U18'],
    ['2008-06-23', 'U18'],
    ['2007-06-23', 'Adult']
  ] as const)('maps a player born %s to %s at each age boundary', (dateOfBirth, expected) => {
    expect(computeAgeGroupFromDob(dateOfBirth, '2026-06-23')).toBe(expected);
  });

  it('handles leap-day birthdays without relying on the machine date', () => {
    expect(computeAgeGroupFromDob('2012-02-29', '2025-02-28')).toBe('U12');
    expect(computeAgeGroupFromDob('2012-02-29', '2025-03-01')).toBe('U15');
  });

  it('rejects malformed dates and assessment dates before birth', () => {
    expect(computeAgeGroupFromDob('not-a-date', '2026-06-23')).toBeNull();
    expect(computeAgeGroupFromDob('2012-02-30', '2026-06-23')).toBeNull();
    expect(computeAgeGroupFromDob('2027-01-01', '2026-06-23')).toBeNull();
  });
});

describe('Quick and Full assessment requirements', () => {
  const score = (
    role: FprdsRole,
    assessmentType: 'Full' | 'Quick',
    roleSpecific: Record<string, number>,
    base = validBase
  ) => computeScoresForSession({
    role,
    ageGroup: 'U18',
    assessmentType,
    base,
    roleSpecific
  });

  it.each(ROLES)('accepts complete Full and Quick submissions for %s', (role) => {
    const full = score(role, 'Full', fullRoleResults[role]);
    const quick = score(
      role,
      'Quick',
      Object.fromEntries(quickRoleFields[role].map(field => [field, fullRoleResults[role][field]]))
    );

    expect(full.ok).toBe(true);
    expect(quick.ok).toBe(true);
  });

  it.each(Object.keys(validBase) as Array<keyof typeof validBase>)(
    'identifies missing base field %s',
    (field) => {
      const result = score('ST', 'Quick', fullRoleResults.ST, { ...validBase, [field]: Number.NaN });
      expect(result).toEqual({
        ok: false,
        errors: expect.arrayContaining([expect.objectContaining({ field })])
      });
    }
  );

  it.each(ROLES)('identifies every missing Full role field for %s', (role) => {
    Object.keys(fullRoleResults[role]).forEach((field) => {
      const result = score(role, 'Full', { ...fullRoleResults[role], [field]: Number.NaN });
      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.errors).toEqual(
          expect.arrayContaining([expect.objectContaining({ field })])
        );
      }
    });
  });

  it.each(ROLES)('identifies every missing Quick role field and permits optional fields for %s', (role) => {
    const quickValues = Object.fromEntries(
      quickRoleFields[role].map(field => [field, fullRoleResults[role][field]])
    );

    quickRoleFields[role].forEach((field) => {
      const result = score(role, 'Quick', { ...quickValues, [field]: Number.NaN });
      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.errors).toEqual(
          expect.arrayContaining([expect.objectContaining({ field })])
        );
      }
    });

    expect(score(role, 'Quick', quickValues).ok).toBe(true);
  });
});
