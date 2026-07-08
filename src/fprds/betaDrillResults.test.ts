import { describe, expect, it } from 'vitest';
import type { AssessmentSession } from '../types';
import { deriveBetaDrillResults } from './betaDrillResults';

const stSession = (overrides: Partial<AssessmentSession> = {}): AssessmentSession => ({
  id: 'assessment-1',
  playerId: 'player-1',
  assessmentDate: '2026-06-20',
  createdAt: '2026-06-20T10:00:00.000Z',
  assessmentType: 'Quick',
  ageGroup: 'U18',
  role: 'ST',
  rawResults: {
    role: 'ST',
    assessmentType: 'Quick',
    base: {
      sprint10mSeconds: 1.8,
      sprint30mSeconds: 4.3,
      yoyoMeters: 1200,
      illinoisSeconds: 15.2,
      broadJumpCm: 210,
      medicineBallThrowCm: 620,
      firstTouchSuccessesOutOf10: 8,
      shortPassingSuccessesOutOf10: 7
    },
    roleSpecific: {
      finishingGoalsOutOf6: 4,
      finishingOnTargetOutOf6: 5,
      shotPowerMaxControlledDistanceMeters: 28
    }
  },
  attributeScores: {
    pace: 71, stamina: 72, agility: 73, strength: 74, firstTouch: 75, shortPassing: 76,
    finishingBox: 77, shotPower: 78, offensive1v1: 79, attackingHeading: 80,
    longPassing: 40, visionPlaymaking: 40, ballRetention: 40, pressingInterceptions: 40,
    tackling: 40, defensiveHeading: 40, positioningClearances: 40, crossing: 40,
    reflexes: 40, handling: 40, divingReach: 40, distribution: 40
  },
  ovr: 76,
  labels: { weakestAttributeId: 'pace', ovrTierLabel: 'Strong' },
  deltas: {},
  ...overrides
});

describe('deriveBetaDrillResults', () => {
  it('emits one row per present base and role-specific drill', () => {
    const rows = deriveBetaDrillResults(stSession());
    const drillIds = rows.map(r => r.drillId).sort();
    expect(drillIds).toEqual([
      'finishing_goals',
      'finishing_on_target',
      'first_touch',
      'illinois_agility',
      'broad_jump',
      'med_ball_throw',
      'short_passing',
      'shot_power',
      'sprint_10m',
      'sprint_30m',
      'yoyo'
    ].sort());
  });

  it('records a benchmark tier and score for age-grouped drills', () => {
    const rows = deriveBetaDrillResults(stSession());
    const sprint = rows.find(r => r.drillId === 'sprint_30m');
    expect(sprint).toBeDefined();
    expect(sprint?.unit).toBe('seconds');
    expect(sprint?.rawValue).toBe(4.3);
    expect(sprint?.benchmarkBand?.tier).toBe('Developing');
    expect(sprint?.score).toBeGreaterThanOrEqual(55);
    expect(sprint?.score).toBeLessThanOrEqual(74);
  });

  it('leaves composite finishing raws unscored with no band', () => {
    const rows = deriveBetaDrillResults(stSession());
    const goals = rows.find(r => r.drillId === 'finishing_goals');
    expect(goals?.score).toBeNull();
    expect(goals?.benchmarkBand).toBeNull();
    expect(goals?.unit).toBe('out_of_6');
  });

  it('scores fixed-scale drills without a benchmark band', () => {
    const rows = deriveBetaDrillResults(stSession());
    const firstTouch = rows.find(r => r.drillId === 'first_touch');
    expect(firstTouch?.benchmarkBand).toBeNull();
    expect(firstTouch?.score).toBeGreaterThan(0);
  });

  it('skips drills whose raw value is missing or non-finite', () => {
    const session = stSession();
    (session.rawResults.base as { yoyoMeters: number }).yoyoMeters = Number.NaN;
    const rows = deriveBetaDrillResults(session);
    expect(rows.find(r => r.drillId === 'yoyo')).toBeUndefined();
  });

  it('emits goalkeeper drills for a GK session', () => {
    const session = stSession({
      role: 'GK',
      rawResults: {
        role: 'GK',
        assessmentType: 'Quick',
        base: stSession().rawResults.base,
        roleSpecific: {
          gkReflexesSavesOutOf10: 7,
          gkHandlingCleanCatchesOutOf10: 6
        }
      }
    });
    const drillIds = deriveBetaDrillResults(session).map(r => r.drillId);
    expect(drillIds).toContain('gk_reflexes');
    expect(drillIds).toContain('gk_handling');
    expect(drillIds).not.toContain('shot_power');
  });
});
