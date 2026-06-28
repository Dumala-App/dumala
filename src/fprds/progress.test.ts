import { describe, expect, it } from 'vitest';
import type { AssessmentSession, FprdsAttributeId } from '../types';
import {
  buildPlayerAssessmentReport,
  buildAssessmentProgressSeries,
  buildPlayerFeedbackReport,
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

  it('builds a player feedback report from one saved assessment', () => {
    const latest = session({
      id: 'latest',
      role: 'ST',
      ovr: 72,
      labels: {
        weakestAttributeId: 'shotPower',
        ovrTierLabel: 'Core'
      },
      attributeScores: {
        ...scores(62),
        finishingBox: 84,
        pace: 78,
        shotPower: 45,
        offensive1v1: 58
      }
    });

    const report = buildPlayerFeedbackReport(latest, null);

    expect(report?.ovrDelta).toBeNull();
    expect(report?.trendLabel).toBe('First saved assessment');
    expect(report?.latestSession.id).toBe('latest');
    expect(report?.strengths[0].attributeId).toBe('finishingBox');
    expect(report?.strengths[0].displayName).toBe('Finishing in the box');
    expect(report?.priorities[0].attributeId).toBe('shotPower');
    expect(report?.priorities[0].displayName).toBe('Controlled power');
    expect(report?.priorities[0].reason).toContain('Controlled power');
    expect(report?.feedback.headline).not.toContain('profile');
    expect(report?.feedback.headline).not.toContain('make the next message narrow');
    expect(report?.feedback.opening).not.toContain('Your role picture is clear');
    expect(report?.feedback.correction).toContain('Controlled power');
    expect(report?.feedback.focus.length).toBeGreaterThan(40);
    expect(JSON.stringify(report?.feedback)).not.toContain('Tell the player:');
    expect(report?.conversationPrompts).toHaveLength(3);
    expect(new Set(report?.conversationPrompts).size).toBe(3);
  });

  it('includes previous-assessment trend in player feedback', () => {
    const previous = session({ id: 'previous', ovr: 68 });
    const latest = session({ id: 'latest', ovr: 75 });

    const report = buildPlayerFeedbackReport(latest, previous);

    expect(report?.ovrDelta).toBe(7);
    expect(report?.trendLabel).toBe('Up 7 OVR since last assessment');
    expect(report?.trendTone).toBe('positive');
    expect(JSON.stringify(report?.feedback)).toContain('The progress is real');
  });

  it('uses coach-friendly language instead of raw FPRDS attribute IDs', () => {
    const latest = session({
      id: 'winger',
      role: 'W',
      attributeScores: {
        ...scores(70),
        pace: 82,
        offensive1v1: 41,
        finishingBox: 72
      }
    });

    const report = buildPlayerFeedbackReport(latest, null);
    const priority = report?.priorities.find((item) => item.attributeId === 'offensive1v1');

    expect(priority?.displayName).toBe('Beating a defender');
    expect(priority?.coachPhrase).toBe('taking on and beating the first defender');
    expect(priority?.reason).not.toContain('Offensive1v1');
    expect(JSON.stringify(report)).not.toContain('Offensive1v1');
  });

  it('selects stable copy variations without banned scaffolding phrases', () => {
    const first = buildPlayerFeedbackReport(session({ id: 'copy-a', ovr: 71 }), null);
    const second = buildPlayerFeedbackReport(session({ id: 'copy-b', ovr: 71 }), null);

    expect(first?.feedback.headline).not.toBe(second?.feedback.headline);
    expect(JSON.stringify(first?.feedback)).not.toContain('Your role picture is clear');
    expect(JSON.stringify(first?.feedback)).not.toContain('make the next message narrow');
    expect(JSON.stringify(first?.feedback)).not.toContain('profile:');
    expect(first?.feedback).toEqual(buildPlayerFeedbackReport(session({ id: 'copy-a', ovr: 71 }), null)?.feedback);
  });

  it('uses a saved development plan for feedback next steps', () => {
    const latest = session({
      id: 'latest',
      developmentPlan: {
        focusAttributeId: 'visionPlaymaking',
        priorityScore: 8,
        weeks: [
          { weekNumber: 1, focus: 'Foundation: Vision', drillIds: ['drill-playmaking'], notes: 'Scan early.' },
          { weekNumber: 2, focus: 'Progression: Vision', drillIds: ['drill-playmaking'], notes: 'Add pressure.' },
          { weekNumber: 3, focus: 'Decision speed: Vision', drillIds: ['drill-playmaking'], notes: 'Limit touches.' },
          { weekNumber: 4, focus: 'Retest: Vision', drillIds: [], notes: 'Retest.' }
        ]
      }
    });

    const report = buildPlayerFeedbackReport(latest, null);

    expect(report?.nextStep.title).toBe('Use the saved 4-week plan');
    expect(report?.nextStep.focusAttributeId).toBe('visionPlaymaking');
    expect(report?.nextStep.body).toContain('seeing the next pass before pressure closes');
    expect(report?.nextStep.body).toContain('retest after week 4');
  });

  it('recommends a Full assessment when feedback has no development plan', () => {
    const latest = session({ id: 'quick', assessmentType: 'Quick', developmentPlan: undefined });

    const report = buildPlayerFeedbackReport(latest, null);

    expect(report?.nextStep.title).toBe('Run a Full assessment for the plan');
    expect(report?.nextStep.body).toContain('feedback checkpoint');
    expect(report?.nextStep.body).toContain('4-week training block');
  });
});
