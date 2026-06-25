import { describe, expect, it } from 'vitest';
import type { CoreWorkspace } from '../persistence/backup';
import { STORAGE_KEYS, type StorageLike } from '../persistence/storage';
import {
  CLOUD_MIGRATION_SCHEMA_VERSION,
  cloudMigrationManifestSchema,
  countCloudMigrationRecords,
  createCloudImportPayload,
  createCloudMigrationManifest,
  createCloudMigrationPackage,
  getCloudMigrationActivationDecision,
  restoreCloudMigrationRollback,
  toCloudUuid,
  verifyCloudMigrationPackage
} from './localToCloud';

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();

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

const player = {
  id: 'player-1',
  name: 'Test Player',
  number: 9,
  position: 'Forward',
  bio: '',
  photoUrl: '/player.png',
  gamesPlayed: 1,
  points: 2,
  assists: 0,
  cleanSheetsOrRebounds: 0,
  minutesPlayed: 90,
  mvpAwards: 1,
  mvpHistory: [{
    id: 'mvp-history-1',
    date: '2026-06-20',
    opponent: 'Opponent FC'
  }],
  yellowCards: 1,
  redCards: 0,
  offenses: [{
    id: 'offense-1',
    gameId: 'game-1',
    date: '2026-06-20',
    cardType: 'Yellow' as const,
    reason: 'Persistent fouling',
    matchMinute: 44
  }],
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

const staff = {
  id: 'staff-1',
  name: 'Coach Test',
  role: 'Head Coach',
  bio: '',
  photoUrl: '/staff.png',
  status: 'Active' as const
};

const completedGame = {
  id: 'game-1',
  opponent: 'Opponent FC',
  date: '2026-06-20',
  time: '10:00',
  location: 'Test Ground',
  status: 'Completed' as const,
  type: 'League' as const,
  ourScore: 2,
  opponentScore: 0,
  scorers: [{ playerId: 'player-1', playerName: 'Test Player', count: 2 }],
  creditedPlayerIds: ['player-1'],
  mvpId: 'player-1'
};

const completedTraining = {
  id: 'training-1',
  opponent: 'Recovery Session',
  date: '2026-06-21',
  time: '08:00',
  location: 'Training Ground',
  status: 'Completed' as const,
  type: 'Training' as const
};

const assessment = {
  id: 'assessment-1',
  playerId: 'player-1',
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
  deltas: {},
  developmentPlan: {
    focusAttributeId: 'strength' as const,
    priorityScore: 30,
    weeks: [
      { weekNumber: 1 as const, focus: 'Strength base', drillIds: ['drill-1'], notes: 'Start light.' },
      { weekNumber: 2 as const, focus: 'Strength repeat', drillIds: ['drill-2'], notes: 'Progress.' }
    ]
  }
};

const paymentEntry = {
  id: 'payment-1',
  playerId: 'player-1',
  playerNameSnapshot: 'Test Player',
  type: 'charge' as const,
  category: 'registration' as const,
  amount: 500,
  date: '2026-06-21',
  createdAt: '2026-06-21T00:00:00.000Z'
};

const core: CoreWorkspace = {
  teamInfo: {
    name: 'Dumala Test FC',
    founded: '2026',
    stadium: 'Test Ground',
    coach: 'Coach Test',
    league: 'Test League',
    logoColor: '#123456'
  },
  players: [player],
  staff: [staff],
  games: [completedGame, completedTraining],
  standings: [{
    rank: 1,
    teamName: 'Dumala Test FC',
    played: 1,
    won: 1,
    drawn: 0,
    lost: 0,
    goalsFor: 2,
    goalsAgainst: 0,
    points: 3,
    isUserTeam: true
  }],
  announcements: [{
    id: 'bulletin-1',
    title: 'Training',
    content: 'Bring water.',
    date: '2026-06-21',
    category: 'Training' as const,
    author: 'Coach Test'
  }],
  assessments: [assessment],
  paymentLedger: [paymentEntry]
};

const createStorage = () => {
  const storage = new MemoryStorage();
  storage.setItem(STORAGE_KEYS.availability, JSON.stringify({ game1: { 'player-1': 'yes' } }));
  storage.setItem(STORAGE_KEYS.coachNotes, JSON.stringify({ 'player-1': 'Needs finishing reps' }));
  storage.setItem(STORAGE_KEYS.weeklySchedule, JSON.stringify({
    Monday: [{ id: 'scheduled-1', drillId: 'drill-1', name: 'Finishing', fatigueIncrease: 2 }],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: []
  }));
  storage.setItem(STORAGE_KEYS.standingsBackups, JSON.stringify([{
    id: 'standings-backup-1',
    createdAt: '2026-06-21T00:00:00.000Z',
    label: 'Weekly',
    source: 'manual',
    standings: core.standings
  }]));
  storage.setItem(STORAGE_KEYS.lineup, JSON.stringify({
    CF: {
      id: 'player-1',
      name: 'Test Player',
      rating: 70,
      position: 'CF',
      condition: 'B',
      photoUrl: '/player.png',
      isLegend: false
    }
  }));
  storage.setItem(STORAGE_KEYS.tacticsNotes, JSON.stringify([{
    id: 'tactics-note-1',
    title: 'Press',
    content: 'Press high.',
    category: 'Strategy',
    createdAt: '2026-06-21T00:00:00.000Z'
  }]));
  storage.setItem(STORAGE_KEYS.drawingPaths, JSON.stringify([{
    color: '#ffffff',
    width: 2,
    points: [[0, 0], [10, 10]]
  }]));
  storage.setItem(STORAGE_KEYS.playerExtras, JSON.stringify({
    'player-1': { status: 'starting', yellowCards: 0, redCards: 0 }
  }));
  return storage;
};

const options = {
  importId: 'import-1',
  sourceDeviceId: 'device-1',
  targetClubId: 'club-1',
  appVersion: 'test-version',
  exportedAt: '2026-06-25T00:00:00.000Z'
};

describe('local-to-cloud migration package', () => {
  it('creates a V4 backup, manifest, and rollback snapshot before upload', () => {
    const migration = createCloudMigrationPackage(core, createStorage(), options);

    expect(migration.state).toBe('manifest_ready');
    expect(migration.backup.version).toBe(4);
    expect(migration.rollback).toEqual({
      state: 'backup_created',
      backup: migration.backup,
      createdAt: '2026-06-25T00:00:00.000Z'
    });
    expect(cloudMigrationManifestSchema.parse(migration.manifest)).toEqual(migration.manifest);
    expect(migration.manifest.schemaVersion).toBe(CLOUD_MIGRATION_SCHEMA_VERSION);
  });

  it('counts transformed cloud records from core and feature state', () => {
    const migration = createCloudMigrationPackage(core, createStorage(), options);

    expect(countCloudMigrationRecords(migration.backup)).toMatchObject({
      players: 1,
      staff: 1,
      games: 2,
      matchResults: 1,
      matchScorerContributions: 1,
      mvpAwards: 2,
      playerOffenses: 1,
      standings: 1,
      bulletins: 1,
      assessments: 1,
      assessmentPlanWeeks: 2,
      paymentLedgerEntries: 1,
      availabilityGroups: 1,
      availabilityResponses: 1,
      coachNotes: 1,
      weeklyTrainingDays: 7,
      weeklyTrainingDrills: 1,
      standingsSnapshots: 1,
      tacticsLineupAssignments: 1,
      tacticsNotes: 1,
      tacticsDrawPaths: 1,
      tacticsPlayerExtras: 1
    });
  });

  it('builds a structured import payload with stable idempotency keys', () => {
    const migration = createCloudMigrationPackage(core, createStorage(), options);
    const byTable = (table: string) => migration.payload.records.filter(item => item.table === table);
    const mappedClubId = toCloudUuid(options.importId, 'clubs', options.targetClubId);

    expect(migration.payload.importId).toBe(options.importId);
    expect(migration.payload.clubId).toBe(mappedClubId);
    expect(migration.payload.sourceIdMap['clubs:club-1']).toBe(mappedClubId);
    expect(migration.payload.sourceIdMap['players:player-1']).toMatch(/^[0-9a-f-]{36}$/);
    expect(byTable('clubs')).toHaveLength(1);
    expect(byTable('players')).toHaveLength(1);
    expect(byTable('staff_members')).toHaveLength(1);
    expect(byTable('games')).toHaveLength(2);
    expect(byTable('match_results')).toHaveLength(1);
    expect(byTable('match_scorer_contributions')).toHaveLength(1);
    expect(byTable('assessment_development_plan_weeks')).toHaveLength(2);
    expect(byTable('payment_ledger_entries')).toHaveLength(1);
    expect(byTable('tactics_lineup_assignments')).toHaveLength(1);

    expect(byTable('match_results')[0].sourceId).toBe('game-1:result');
    expect(byTable('match_results')[0].idempotencyKey).toBe('import-1:match_results:game-1:result');
    expect(byTable('games').map(item => item.sourceId)).toEqual(['game-1', 'training-1']);
    expect(byTable('clubs')[0].data).toMatchObject({
      id: mappedClubId,
      name: 'Dumala Test FC',
      source_team_info: true
    });
  });

  it('preserves valid UUID source IDs and maps legacy string IDs deterministically', () => {
    const uuid = '11111111-1111-4111-8111-111111111111';

    expect(toCloudUuid('import-1', 'players', uuid)).toBe(uuid);
    expect(toCloudUuid('import-1', 'players', 'player-1')).toBe(toCloudUuid('import-1', 'players', 'player-1'));
    expect(toCloudUuid('import-1', 'players', 'player-1')).not.toBe(toCloudUuid('import-1', 'staff_members', 'player-1'));
  });

  it('can rebuild the same payload from a saved backup and manifest', () => {
    const migration = createCloudMigrationPackage(core, createStorage(), options);
    const rebuilt = createCloudImportPayload(migration.rollback.backup, migration.manifest);

    expect(rebuilt).toEqual(migration.payload);
  });

  it('creates deterministic manifest hashes for the same backup content', () => {
    const first = createCloudMigrationPackage(core, createStorage(), options);
    const second = createCloudMigrationPackage(core, createStorage(), options);

    expect(second.manifest.hashes).toEqual(first.manifest.hashes);
    expect(second.manifest.sourceIds).toEqual(first.manifest.sourceIds);
  });

  it('keeps manifest identity fields separate from content fingerprints', () => {
    const migration = createCloudMigrationPackage(core, createStorage(), options);
    const replayManifest = createCloudMigrationManifest(migration.backup, {
      ...options,
      importId: 'import-2',
      sourceDeviceId: 'device-2'
    });

    expect(replayManifest.importId).toBe('import-2');
    expect(replayManifest.sourceDeviceId).toBe('device-2');
    expect(replayManifest.hashes).toEqual(migration.manifest.hashes);
  });

  it('passes local verification for an untouched migration package', () => {
    const migration = createCloudMigrationPackage(core, createStorage(), options);

    const report = verifyCloudMigrationPackage(migration, '2026-06-25T01:00:00.000Z');
    expect(report).toEqual({
      status: 'passed',
      checkedAt: '2026-06-25T01:00:00.000Z',
      findings: []
    });
    expect(getCloudMigrationActivationDecision(report)).toEqual({ canActivate: true });
  });

  it('fails verification when the manifest counts no longer match the backup', () => {
    const migration = createCloudMigrationPackage(core, createStorage(), options);
    const report = verifyCloudMigrationPackage({
      ...migration,
      manifest: {
        ...migration.manifest,
        counts: {
          ...migration.manifest.counts,
          players: 99
        }
      }
    });

    expect(report.status).toBe('failed');
    expect(report.findings.map(item => item.code)).toContain('MANIFEST_COUNT_PLAYERS_MISMATCH');
    expect(getCloudMigrationActivationDecision(report)).toEqual({
      canActivate: false,
      reason: 'Cloud activation is blocked because migration verification failed.'
    });
  });

  it('fails verification when payload table counts do not satisfy the manifest', () => {
    const migration = createCloudMigrationPackage(core, createStorage(), options);
    const report = verifyCloudMigrationPackage({
      ...migration,
      payload: {
        ...migration.payload,
        records: migration.payload.records.filter(record => record.table !== 'players')
      }
    });

    expect(report.status).toBe('failed');
    expect(report.findings.map(item => item.code)).toContain('PAYLOAD_TABLE_PLAYERS_COUNT_MISMATCH');
  });

  it('fails verification when idempotency keys are duplicated', () => {
    const migration = createCloudMigrationPackage(core, createStorage(), options);
    const duplicate = {
      ...migration.payload.records[0],
      table: 'clubs',
      sourceId: 'club-1'
    };
    const report = verifyCloudMigrationPackage({
      ...migration,
      payload: {
        ...migration.payload,
        records: [...migration.payload.records, duplicate]
      }
    });

    expect(report.status).toBe('failed');
    expect(report.findings.map(item => item.code)).toContain('PAYLOAD_IDEMPOTENCY_KEY_DUPLICATE');
  });

  it('restores the pre-migration V4 backup during deliberate rollback', () => {
    const storage = createStorage();
    const migration = createCloudMigrationPackage(core, storage, options);
    storage.setItem(STORAGE_KEYS.players, JSON.stringify([{ id: 'cloud-mutated-player' }]));
    storage.setItem(STORAGE_KEYS.paymentLedger, JSON.stringify([]));

    expect(restoreCloudMigrationRollback(migration, storage, '2026-06-25T02:00:00.000Z')).toEqual({
      state: 'rolled_back',
      restoredAt: '2026-06-25T02:00:00.000Z',
      sourceExportedAt: '2026-06-25T00:00:00.000Z'
    });
    expect(JSON.parse(storage.getItem(STORAGE_KEYS.players)!)).toEqual(migration.rollback.backup.core.players);
    expect(JSON.parse(storage.getItem(STORAGE_KEYS.paymentLedger)!)).toEqual(migration.rollback.backup.core.paymentLedger);
    expect(JSON.parse(storage.getItem(STORAGE_KEYS.lineup)!).CF.id).toBe('player-1');
  });
});
