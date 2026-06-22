import { describe, expect, it } from 'vitest';
import type { AssessmentSession, Player } from '../types';
import {
  addAssessmentToWorkspace,
  compareAssessmentRecency,
  deleteAssessmentFromWorkspace,
  selectLatestAssessmentForPlayer
} from './assessmentService';

const basePlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'player-1',
  name: 'Mika Santos',
  number: 9,
  position: 'Forward',
  bio: '',
  photoUrl: '',
  gamesPlayed: 12,
  points: 8,
  assists: 4,
  cleanSheetsOrRebounds: 0,
  minutesPlayed: 720,
  mvpAwards: 1,
  yellowCards: 2,
  redCards: 0,
  baseAttributes: {
    pace: 50,
    stamina: 51,
    agility: 52,
    strength: 53,
    firstTouch: 54,
    shortPassing: 55
  },
  positionAttributes: {
    Finishing: 56,
    'Long Shots': 57,
    'Offensive 1v1': 58,
    'Attacking Heading': 59
  },
  registrationStatus: 'Active',
  ...overrides
});

const assessment = (overrides: Partial<AssessmentSession> = {}): AssessmentSession => ({
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
    pace: 71,
    stamina: 72,
    agility: 73,
    strength: 74,
    firstTouch: 75,
    shortPassing: 76,
    finishingBox: 77,
    shotPower: 78,
    offensive1v1: 79,
    attackingHeading: 80,
    longPassing: 40,
    visionPlaymaking: 40,
    ballRetention: 40,
    pressingInterceptions: 40,
    tackling: 40,
    defensiveHeading: 40,
    positioningClearances: 40,
    crossing: 40,
    reflexes: 40,
    handling: 40,
    divingReach: 40,
    distribution: 40
  },
  ovr: 76,
  labels: {
    weakestAttributeId: 'pace',
    ovrTierLabel: 'Strong'
  },
  deltas: {},
  ...overrides
});

describe('assessment workspace transitions', () => {
  it('adds a first assessment and applies its player snapshot', () => {
    const player = basePlayer();
    const session = assessment();
    const result = addAssessmentToWorkspace({ players: [player], assessments: [] }, session);

    expect(result?.assessments).toEqual([session]);
    expect(result?.players[0]).toMatchObject({
      id: player.id,
      fprdsRole: 'ST',
      fprdsLastAssessmentId: session.id,
      baseAttributes: {
        pace: 71,
        stamina: 72,
        agility: 73,
        strength: 74,
        firstTouch: 75,
        shortPassing: 76
      }
    });
    expect(result?.players[0].positionAttributes.Finishing).toBe(77);
    expect(result?.players[0].gamesPlayed).toBe(player.gamesPlayed);
  });

  it('replaces the player snapshot only when an added assessment is latest', () => {
    const older = assessment({ id: 'older', assessmentDate: '2026-06-18', ovr: 60 });
    const newer = assessment({
      id: 'newer',
      assessmentDate: '2026-06-21',
      attributeScores: {
        ...assessment().attributeScores,
        pace: 88,
        finishingBox: 89
      }
    });

    const withNewer = addAssessmentToWorkspace(
      { players: [basePlayer()], assessments: [older] },
      newer
    );
    const withOlderAddedLast = addAssessmentToWorkspace(
      { players: [withNewer!.players[0]], assessments: withNewer!.assessments },
      assessment({ id: 'oldest', assessmentDate: '2026-06-17', attributeScores: { ...assessment().attributeScores, pace: 30 } })
    );

    expect(withNewer?.players[0].fprdsLastAssessmentId).toBe('newer');
    expect(withNewer?.players[0].baseAttributes.pace).toBe(88);
    expect(withOlderAddedLast?.players[0].fprdsLastAssessmentId).toBe('newer');
    expect(withOlderAddedLast?.players[0].baseAttributes.pace).toBe(88);
  });

  it('uses assessment date, created timestamp, and id as deterministic recency tie-breakers', () => {
    const first = assessment({ id: 'a', assessmentDate: '2026-06-20', createdAt: '2026-06-20T10:00:00.000Z' });
    const second = assessment({ id: 'b', assessmentDate: '2026-06-20', createdAt: '2026-06-20T10:00:00.000Z' });
    const createdLater = assessment({ id: 'c', assessmentDate: '2026-06-20', createdAt: '2026-06-20T11:00:00.000Z' });
    const datedLater = assessment({ id: 'd', assessmentDate: '2026-06-21', createdAt: '2026-06-20T09:00:00.000Z' });

    expect(compareAssessmentRecency(second, first)).toBeGreaterThan(0);
    expect(selectLatestAssessmentForPlayer([first, second, createdLater, datedLater], 'player-1')?.id).toBe('d');
    expect(selectLatestAssessmentForPlayer([first, second], 'player-1')?.id).toBe('b');
  });

  it('deleting a non-latest assessment preserves the current snapshot', () => {
    const older = assessment({ id: 'older', assessmentDate: '2026-06-18' });
    const newer = assessment({
      id: 'newer',
      assessmentDate: '2026-06-21',
      attributeScores: { ...assessment().attributeScores, pace: 91 }
    });
    const state = addAssessmentToWorkspace({ players: [basePlayer()], assessments: [older] }, newer)!;

    const result = deleteAssessmentFromWorkspace(state, 'older');

    expect(result?.assessments.map((session) => session.id)).toEqual(['newer']);
    expect(result?.players[0].fprdsLastAssessmentId).toBe('newer');
    expect(result?.players[0].baseAttributes.pace).toBe(91);
  });

  it('deleting the latest assessment restores the previous snapshot', () => {
    const older = assessment({
      id: 'older',
      assessmentDate: '2026-06-18',
      attributeScores: { ...assessment().attributeScores, pace: 64 }
    });
    const newer = assessment({
      id: 'newer',
      assessmentDate: '2026-06-21',
      attributeScores: { ...assessment().attributeScores, pace: 91 }
    });
    const state = addAssessmentToWorkspace({ players: [basePlayer()], assessments: [older] }, newer)!;

    const result = deleteAssessmentFromWorkspace(state, 'newer');

    expect(result?.players[0].fprdsLastAssessmentId).toBe('older');
    expect(result?.players[0].baseAttributes.pace).toBe(64);
  });

  it('deleting the final assessment clears only the assessment pointer', () => {
    const player = basePlayer({ fprdsLastAssessmentId: 'assessment-1', fprdsRole: 'ST' });
    const result = deleteAssessmentFromWorkspace(
      { players: [player], assessments: [assessment()] },
      'assessment-1'
    );

    expect(result?.players[0].fprdsLastAssessmentId).toBeUndefined();
    expect(result?.players[0].fprdsRole).toBe('ST');
    expect(result?.players[0].gamesPlayed).toBe(player.gamesPlayed);
    expect(result?.players[0].baseAttributes).toEqual(player.baseAttributes);
  });

  it('leaves other players unchanged and does not mutate input arrays or objects', () => {
    const target = basePlayer();
    const other = basePlayer({ id: 'player-2', name: 'Rafa Cruz', number: 10 });
    const players = [target, other];
    const assessments: AssessmentSession[] = [];

    const result = addAssessmentToWorkspace({ players, assessments }, assessment());

    expect(result?.players[1]).toBe(other);
    expect(players[0]).toBe(target);
    expect(players[0].fprdsLastAssessmentId).toBeUndefined();
    expect(assessments).toEqual([]);
  });

  it('returns null for unknown assessment or player ids without mutating input objects', () => {
    const player = basePlayer();
    const sessions = [assessment()];

    expect(addAssessmentToWorkspace({ players: [player], assessments: sessions }, assessment({ playerId: 'missing-player' }))).toBeNull();
    expect(deleteAssessmentFromWorkspace({ players: [player], assessments: sessions }, 'missing-assessment')).toBeNull();
    expect(player.fprdsLastAssessmentId).toBeUndefined();
    expect(sessions).toHaveLength(1);
  });
});
