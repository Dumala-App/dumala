import { describe, expect, it } from 'vitest';
import type { AssessmentSession, FprdsAttributeId } from '../types';
import {
  buildPlayerAssessmentReport,
  buildAssessmentProgressSeries,
  buildSessionAssessmentReport,
  calculateProgressDelta,
  filterProgressSeriesByRole,
  getLatestRoleFromProgress,
  getWeightedProgressAttributes
} from './progress';

const scores = (value: number): Record<FprdsAttributeId, number> => ({
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

const session = (overrides: Partial<AssessmentSession>): AssessmentSession => ({
  id: 'assessment',
  playerId: 'player-1',
  assessmentDate: '2026-06-20',
  createdAt: '2026-06-20T10:00:00.000Z',
  assessmentType: 'Full',
  ageGroup: 'U18',
  role: 'CM',
  rawResults: {
    role: 'CM',
    assessmentType: 'Full',
    base: {
      sprint10mSeconds: 1.8,
      sprint30mSeconds: 4.4,
      yoyoMeters: 1500,
      illinoisSeconds: 15.5,
      broadJumpCm: 190,
      medicineBallThrowCm: 550,
      firstTouchSuccessesOutOf10: 8,
      shortPassingSuccessesOutOf10: 8
    },
    roleSpecific: {
      longPassing30mSuccessesOutOf5: 4,
      longPassing40mSuccessesOutOf5: 3,
      visionCoachScore1to10: 8,
      ballRetentionBestSeconds: 18,
      pressingWinsOutOf5: 3
    }
  },
  attributeScores: scores(70),
  ovr: 70,
  labels: {
    weakestAttributeId: 'stamina',
    ovrTierLabel: 'Core'
  },
  deltas: {},
  ...overrides
});

describe('FPRDS progress series', () => {
  it('orders saved assessments chronologically and labels real sessions', () => {
    const series = buildAssessmentProgressSeries([
      session({ id: 'latest', assessmentDate: '2026-06-22', createdAt: '2026-06-22T10:00:00.000Z', ovr: 78 }),
      session({ id: 'oldest', assessmentDate: '2026-06-18', createdAt: '2026-06-18T10:00:00.000Z', ovr: 64 }),
      session({ id: 'middle', assessmentDate: '2026-06-20', createdAt: '2026-06-20T10:00:00.000Z', ovr: 70 })
    ]);

    expect(series.map((point) => point.id)).toEqual(['oldest', 'middle', 'latest']);
    expect(series.map((point) => point.label)).toEqual([
      '1. 2026-06-18',
      '2. 2026-06-20',
      '3. 2026-06-22'
    ]);
    expect(calculateProgressDelta(series)).toBe(14);
  });

  it('uses the latest role and role-matched points for attribute trend charts', () => {
    const series = buildAssessmentProgressSeries([
      session({ id: 'cm-old', role: 'CM', assessmentDate: '2026-06-18' }),
      session({ id: 'st-new', role: 'ST', assessmentDate: '2026-06-22' })
    ]);

    expect(getLatestRoleFromProgress(series)).toBe('ST');
    expect(filterProgressSeriesByRole(series, 'ST').map((point) => point.id)).toEqual(['st-new']);
    expect(getWeightedProgressAttributes('ST', 3)).toEqual(['finishingBox', 'pace', 'shotPower']);
  });

  it('returns null delta until at least two sessions exist', () => {
    expect(calculateProgressDelta(buildAssessmentProgressSeries([]))).toBeNull();
    expect(calculateProgressDelta(buildAssessmentProgressSeries([session({ id: 'only' })]))).toBeNull();
  });

  it('builds player-to-player reports from latest comparable assessment scores', () => {
    const primary = session({
      id: 'primary',
      role: 'ST',
      ovr: 80,
      attributeScores: { ...scores(70), finishingBox: 90, pace: 82, shotPower: 75 }
    });
    const comparison = session({
      id: 'comparison',
      role: 'ST',
      ovr: 74,
      attributeScores: { ...scores(70), finishingBox: 78, pace: 84, shotPower: 68 }
    });

    const report = buildPlayerAssessmentReport(primary, comparison);

    expect(report?.ovrDelta).toBe(6);
    expect(report?.rows.find((row) => row.attributeId === 'finishingBox')?.delta).toBe(12);
    expect(report?.primaryAdvantages[0].attributeId).toBe('finishingBox');
    expect(report?.comparisonAdvantages[0].attributeId).toBe('pace');
  });

  it('builds session-to-session reports from selected baseline and target sessions', () => {
    const baseline = session({
      id: 'baseline',
      ovr: 70,
      attributeScores: { ...scores(70), visionPlaymaking: 72, stamina: 75 }
    });
    const target = session({
      id: 'target',
      ovr: 76,
      attributeScores: { ...scores(70), visionPlaymaking: 84, stamina: 71 }
    });

    const report = buildSessionAssessmentReport(baseline, target);

    expect(report?.ovrDelta).toBe(6);
    expect(report?.improved[0].attributeId).toBe('visionPlaymaking');
    expect(report?.declined[0].attributeId).toBe('stamina');
    expect(buildSessionAssessmentReport(target, target)).toBeNull();
  });
});
