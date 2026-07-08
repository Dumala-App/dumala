import { describe, expect, it } from 'vitest';
import type { AssessmentSession, Player } from '../types';
import { buildAssessmentReportModel, renderAssessmentReportHtml } from './assessmentReport';

const player = (overrides: Partial<Player> = {}): Player => ({
  id: 'player-1',
  name: 'Mika <Santos>',
  number: 9,
  position: 'Forward',
  bio: '',
  photoUrl: '',
  gamesPlayed: 0,
  points: 0,
  assists: 0,
  cleanSheetsOrRebounds: 0,
  minutesPlayed: 0,
  mvpAwards: 0,
  yellowCards: 0,
  redCards: 0,
  baseAttributes: { pace: 50, stamina: 50, agility: 50, strength: 50, firstTouch: 50, shortPassing: 50 },
  positionAttributes: {},
  registrationStatus: 'Active',
  dateOfBirth: '2010-05-01',
  ...overrides
});

const session = (overrides: Partial<AssessmentSession> = {}): AssessmentSession => ({
  id: 'assessment-1',
  playerId: 'player-1',
  assessmentDate: '2026-06-20',
  createdAt: '2026-06-20T10:00:00.000Z',
  assessmentType: 'Full',
  ageGroup: 'U15',
  role: 'ST',
  rawResults: {
    role: 'ST',
    assessmentType: 'Full',
    base: {
      sprint10mSeconds: 1.8, sprint30mSeconds: 4.3, yoyoMeters: 1200, illinoisSeconds: 15.2,
      broadJumpCm: 210, medicineBallThrowCm: 620, firstTouchSuccessesOutOf10: 8, shortPassingSuccessesOutOf10: 7
    },
    roleSpecific: {
      finishingGoalsOutOf6: 4, finishingOnTargetOutOf6: 5, shotPowerMaxControlledDistanceMeters: 28,
      offensive1v1TakeonsOutOf10: 6, attackingHeadingOnTargetOutOf10: 5
    }
  },
  attributeScores: {
    pace: 71, stamina: 72, agility: 73, strength: 60, firstTouch: 75, shortPassing: 66,
    finishingBox: 80, shotPower: 70, offensive1v1: 64, attackingHeading: 58,
    longPassing: 40, visionPlaymaking: 40, ballRetention: 40, pressingInterceptions: 40,
    tackling: 40, defensiveHeading: 40, positioningClearances: 40, crossing: 40,
    reflexes: 40, handling: 40, divingReach: 40, distribution: 40
  },
  ovr: 72,
  labels: { weakestAttributeId: 'attackingHeading', ovrTierLabel: 'Core' },
  deltas: {},
  ...overrides
});

describe('buildAssessmentReportModel', () => {
  it('returns null when the player has no assessments', () => {
    expect(buildAssessmentReportModel(player(), [])).toBeNull();
  });

  it('summarizes the latest session with role-weighted attributes', () => {
    const model = buildAssessmentReportModel(player(), [session()], { now: new Date('2026-07-08T00:00:00Z') });
    expect(model).not.toBeNull();
    expect(model?.latest.ovr).toBe(72);
    expect(model?.latest.roleLabel).toBeTruthy();
    expect(model?.attributes.length).toBeGreaterThan(0);
    // Attributes are sorted by role weight (heaviest first) and carry a tier label.
    expect(model?.attributes[0].tier).toBeTruthy();
    expect(model?.development.weeks).toHaveLength(4);
  });

  it('computes an OVR trend against the previous session', () => {
    const older = session({ id: 'a0', assessmentDate: '2026-05-01', ovr: 65 });
    const newer = session({ id: 'a1', assessmentDate: '2026-06-20', ovr: 72 });
    const model = buildAssessmentReportModel(player(), [newer, older]);
    expect(model?.ovrDelta).toBe(7);
    expect(model?.ovrHistory).toHaveLength(2);
    expect(model?.ovrHistory[0].ovr).toBe(65); // chronological
  });

  it('only considers sessions for the given player', () => {
    const other = session({ id: 'a2', playerId: 'player-2' });
    const model = buildAssessmentReportModel(player(), [other]);
    expect(model).toBeNull();
  });
});

describe('renderAssessmentReportHtml', () => {
  it('produces a standalone HTML document with escaped player identity', () => {
    const model = buildAssessmentReportModel(player(), [session()])!;
    const html = renderAssessmentReportHtml(model);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('FPRDS Development Report');
    // Player name contains angle brackets that must be escaped, not injected as tags.
    expect(html).toContain('Mika &lt;Santos&gt;');
    expect(html).not.toContain('Mika <Santos>');
    expect(html).toContain('4-week development plan');
  });

  it('omits the OVR history section for a single assessment', () => {
    const model = buildAssessmentReportModel(player(), [session()])!;
    expect(renderAssessmentReportHtml(model)).not.toContain('OVR history');
  });
});
