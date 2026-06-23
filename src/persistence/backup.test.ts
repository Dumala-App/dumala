import { describe, expect, it } from 'vitest';
import {
  applyWorkspaceBackup,
  collectFeatureState,
  createWorkspaceBackup,
  parseWorkspaceBackup,
  workspaceBackupV3Schema
} from './backup';
import { STORAGE_KEYS, type StorageLike } from './storage';

class MemoryStorage implements StorageLike {
  protected values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

class FailingStorage extends MemoryStorage {
  constructor(private failKey: string) {
    super();
  }

  override setItem(key: string, value: string) {
    if (key === this.failKey) throw new Error('simulated write failure');
    super.setItem(key, value);
  }
}

const teamInfo = {
  name: 'Dumala Test FC',
  founded: '2026',
  stadium: 'Test Ground',
  coach: 'Coach Test',
  league: 'Test League',
  logoColor: '#123456'
};

const player = {
  id: 'p1',
  name: 'Test Player',
  number: 10,
  position: 'Forward',
  bio: '',
  photoUrl: '/player.png',
  gamesPlayed: 0,
  points: 0,
  assists: 0,
  cleanSheetsOrRebounds: 0,
  minutesPlayed: 0,
  mvpAwards: 0,
  yellowCards: 0,
  redCards: 0,
  offenses: [],
  baseAttributes: {
    pace: 70,
    stamina: 70,
    agility: 70,
    strength: 70,
    firstTouch: 70,
    shortPassing: 70
  },
  positionAttributes: { Finishing: 70 },
  registrationStatus: 'Active' as const
};

const legacyStaffPlayer = {
  ...player,
  id: 'staff-1',
  name: 'Coach Test',
  number: 0,
  position: 'Head Coach',
  email: 'coach@example.com'
};

const staff = {
  id: 'staff-1',
  name: 'Coach Test',
  role: 'Head Coach',
  bio: '',
  photoUrl: '/player.png',
  email: 'coach@example.com',
  status: 'Active' as const
};

const game = {
  id: 'g1',
  opponent: 'Opponent FC',
  date: '2026-06-21',
  time: '10:00',
  location: 'Test Ground',
  status: 'Upcoming' as const,
  type: 'League' as const
};

const standing = {
  rank: 1,
  teamName: teamInfo.name,
  played: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  points: 0,
  isUserTeam: true
};

const announcement = {
  id: 'a1',
  title: 'Test',
  content: 'Test bulletin',
  date: '2026-06-21',
  category: 'Training' as const,
  author: 'Coach Test'
};

const assessment = {
  id: 'assessment-1',
  playerId: 'p1',
  assessmentDate: '2026-06-21',
  createdAt: '2026-06-21T00:00:00.000Z',
  assessmentType: 'Quick' as const,
  ageGroup: 'Adult' as const,
  role: 'ST' as const,
  rawResults: {
    role: 'ST' as const,
    assessmentType: 'Quick' as const,
    base: {
      sprint10mSeconds: 2,
      sprint30mSeconds: 4,
      yoyoMeters: 1200,
      illinoisSeconds: 16,
      broadJumpCm: 200,
      medicineBallThrowCm: 500,
      firstTouchSuccessesOutOf10: 7,
      shortPassingSuccessesOutOf10: 8
    },
    roleSpecific: {
      finishingGoalsOutOf6: 4,
      finishingOnTargetOutOf6: 5,
      shotPowerMaxControlledDistanceMeters: 25
    }
  },
  attributeScores: {
    pace: 70,
    stamina: 70,
    agility: 70,
    strength: 70,
    firstTouch: 70,
    shortPassing: 70,
    finishingBox: 70,
    shotPower: 70,
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
  },
  ovr: 70,
  labels: { weakestAttributeId: 'strength' as const, ovrTierLabel: 'Developing' },
  deltas: {}
};

const core = {
  teamInfo,
  players: [player],
  staff: [staff],
  games: [game],
  standings: [standing],
  announcements: [announcement],
  assessments: [assessment]
};

describe('workspace backup V2', () => {
  it('round-trips core and feature state', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEYS.availability, JSON.stringify({ g1: { p1: 'yes' } }));
    storage.setItem(STORAGE_KEYS.coachNotes, JSON.stringify({ g1: 'Press early' }));
    storage.setItem(STORAGE_KEYS.weeklySchedule, JSON.stringify({
      Monday: [{
        id: 'scheduled-drill-1',
        drillId: 'passing-drill',
        name: 'Passing Circuit',
        fatigueIncrease: 3
      }],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    }));
    storage.setItem(STORAGE_KEYS.lineup, JSON.stringify({
      CF: {
        id: 'p1',
        name: 'Test Player',
        rating: 70,
        position: 'CF',
        condition: 'B',
        photoUrl: '/player.png',
        isLegend: false
      }
    }));
    storage.setItem(STORAGE_KEYS.tacticsNotes, JSON.stringify([{
      id: 'note-1',
      title: 'Counter-press',
      content: 'Press after losing possession',
      category: 'Strategy',
      createdAt: '2026-06-21T00:00:00.000Z'
    }]));
    const backup = createWorkspaceBackup(core, storage, '2026-06-21T00:00:00.000Z');
    expect(workspaceBackupV3Schema.parse(backup)).toEqual(backup);

    const restored = new MemoryStorage();
    applyWorkspaceBackup(backup, restored);
    expect(JSON.parse(restored.getItem(STORAGE_KEYS.players)!)).toHaveLength(1);
    expect(JSON.parse(restored.getItem(STORAGE_KEYS.staff)!)).toEqual([staff]);
    expect(JSON.parse(restored.getItem(STORAGE_KEYS.availability)!)).toEqual({ g1: { p1: 'yes' } });
    expect(JSON.parse(restored.getItem(STORAGE_KEYS.coachNotes)!)).toEqual({ g1: 'Press early' });
    expect(JSON.parse(restored.getItem(STORAGE_KEYS.weeklySchedule)!).Monday).toHaveLength(1);
    expect(JSON.parse(restored.getItem(STORAGE_KEYS.lineup)!).CF.id).toBe('p1');
    expect(JSON.parse(restored.getItem(STORAGE_KEYS.tacticsNotes)!)).toHaveLength(1);
  });

  it.each(['1.0.0', '1.1.0'] as const)('migrates legacy backup %s', version => {
    const legacy = {
      backupVersion: version,
      exportedAt: '2026-06-21T00:00:00.000Z',
      teamInfo,
      players: [player],
      games: [game],
      standings: [standing],
      announcements: [announcement],
      ...(version === '1.1.0' ? { assessments: [assessment] } : {})
    };
    const currentFeatureState = collectFeatureState(new MemoryStorage());
    const result = parseWorkspaceBackup(legacy, currentFeatureState);
    expect(result.sourceVersion).toBe(version);
    expect(result.backup.version).toBe(3);
    expect(result.backup.core.assessments).toHaveLength(version === '1.1.0' ? 1 : 0);
  });

  it('migrates a V2 mixed roster into separate player and staff collections', () => {
    const current = createWorkspaceBackup(core, new MemoryStorage(), '2026-06-21T00:00:00.000Z');
    const v2 = {
      ...current,
      version: 2,
      core: {
        ...current.core,
        players: [player, legacyStaffPlayer],
        staff: undefined
      }
    };

    const result = parseWorkspaceBackup(v2, current.featureState);
    expect(result.sourceVersion).toBe('2');
    expect(result.backup.core.players.map(item => item.id)).toEqual(['p1']);
    expect(result.backup.core.staff).toEqual([staff]);
  });

  it('rejects unsupported and invalid nested data', () => {
    const currentFeatureState = collectFeatureState(new MemoryStorage());
    expect(() => parseWorkspaceBackup({ backupVersion: '9.0.0' }, currentFeatureState)).toThrow();
    expect(() => parseWorkspaceBackup({
      backupVersion: '1.1.0',
      teamInfo,
      players: [{ id: 'invalid' }],
      games: [game],
      standings: [standing],
      announcements: [announcement],
      assessments: []
    }, currentFeatureState)).toThrow();
  });

  it.each([
    ['games', [{ id: 'invalid' }]],
    ['assessments', [{ id: 'invalid' }]]
  ] as const)('rejects invalid nested %s records', (collection, invalidRecords) => {
    const currentFeatureState = collectFeatureState(new MemoryStorage());
    const legacy = {
      backupVersion: '1.1.0',
      exportedAt: '2026-06-21T00:00:00.000Z',
      teamInfo,
      players: [player],
      games: [game],
      standings: [standing],
      announcements: [announcement],
      assessments: [assessment],
      [collection]: invalidRecords
    };

    expect(() => parseWorkspaceBackup(legacy, currentFeatureState)).toThrow();
  });

  it('rolls back every write when storage fails', () => {
    const source = new MemoryStorage();
    const backup = createWorkspaceBackup(core, source);
    const target = new FailingStorage(STORAGE_KEYS.standings);
    target.setItem(STORAGE_KEYS.players, JSON.stringify([{ existing: true }]));
    const before = target.getItem(STORAGE_KEYS.players);
    expect(() => applyWorkspaceBackup(backup, target)).toThrow('simulated write failure');
    expect(target.getItem(STORAGE_KEYS.players)).toBe(before);
    expect(target.getItem(STORAGE_KEYS.teamInfo)).toBeNull();
  });
});
