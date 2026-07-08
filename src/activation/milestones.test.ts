import { describe, expect, it } from 'vitest';
import type { AssessmentSession, Game, Player } from '../types';
import { deriveActivationMilestones } from './milestones';

const player = (id: string): Player => ({
  id,
  name: `Player ${id}`,
  number: 1,
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
  registrationStatus: 'Active'
});

const game = (id: string, status: Game['status']): Game => ({
  id,
  opponent: 'Rivals',
  date: '2026-07-10',
  time: '15:00',
  location: 'Home',
  status,
  type: 'League'
});

const assessment = (id: string): AssessmentSession => ({
  id,
  playerId: 'p1',
  assessmentDate: '2026-06-20',
  createdAt: '2026-06-20T10:00:00.000Z',
  assessmentType: 'Quick',
  ageGroup: 'U15',
  role: 'ST',
  rawResults: {
    role: 'ST', assessmentType: 'Quick',
    base: { sprint10mSeconds: 1.8, sprint30mSeconds: 4.3, yoyoMeters: 1200, illinoisSeconds: 15.2, broadJumpCm: 210, medicineBallThrowCm: 620, firstTouchSuccessesOutOf10: 8, shortPassingSuccessesOutOf10: 7 },
    roleSpecific: { finishingGoalsOutOf6: 4, finishingOnTargetOutOf6: 5, shotPowerMaxControlledDistanceMeters: 28 }
  },
  attributeScores: {} as AssessmentSession['attributeScores'],
  ovr: 70,
  labels: { weakestAttributeId: 'pace', ovrTierLabel: 'Core' },
  deltas: {}
});

describe('deriveActivationMilestones', () => {
  it('reports nothing done for an empty workspace', () => {
    const state = deriveActivationMilestones([], [], [], {});
    expect(state.activatedCount).toBe(0);
    expect(state.isFullyActivated).toBe(false);
    expect(state.total).toBe(5);
  });

  it('marks roster done once a player exists', () => {
    const state = deriveActivationMilestones([player('p1')], [], [], {});
    expect(state.milestones.find(m => m.id === 'roster')?.done).toBe(true);
    expect(state.hasHealthyRoster).toBe(false);
  });

  it('flags a healthy roster at 8+ players', () => {
    const players = Array.from({ length: 8 }, (_, i) => player(`p${i}`));
    expect(deriveActivationMilestones(players, [], [], {}).hasHealthyRoster).toBe(true);
  });

  it('distinguishes upcoming schedule from completed result', () => {
    const upcoming = deriveActivationMilestones([], [game('g1', 'Upcoming')], [], {});
    expect(upcoming.milestones.find(m => m.id === 'schedule')?.done).toBe(true);
    expect(upcoming.milestones.find(m => m.id === 'result')?.done).toBe(false);

    const completed = deriveActivationMilestones([], [game('g2', 'Completed')], [], {});
    expect(completed.milestones.find(m => m.id === 'result')?.done).toBe(true);
  });

  it('marks assessment done from saved sessions', () => {
    const state = deriveActivationMilestones([], [], [assessment('a1')], {});
    expect(state.milestones.find(m => m.id === 'assessment')?.done).toBe(true);
  });

  it('drives the report milestone from the persisted flag and exposes reachedAt', () => {
    const withoutFlag = deriveActivationMilestones([], [], [], {});
    expect(withoutFlag.milestones.find(m => m.id === 'report')?.done).toBe(false);

    const withFlag = deriveActivationMilestones([], [], [], { report: '2026-07-08T00:00:00.000Z' });
    const report = withFlag.milestones.find(m => m.id === 'report');
    expect(report?.done).toBe(true);
    expect(report?.reachedAt).toBe('2026-07-08T00:00:00.000Z');
  });

  it('is fully activated when all five milestones are reached', () => {
    const players = Array.from({ length: 8 }, (_, i) => player(`p${i}`));
    const state = deriveActivationMilestones(
      players,
      [game('g1', 'Upcoming'), game('g2', 'Completed')],
      [assessment('a1')],
      { report: '2026-07-08T00:00:00.000Z' }
    );
    expect(state.isFullyActivated).toBe(true);
    expect(state.activatedCount).toBe(5);
  });
});
