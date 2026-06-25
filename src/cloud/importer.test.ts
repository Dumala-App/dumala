import { describe, expect, it } from 'vitest';
import type { DumalaSupabaseClient } from './client';
import { CloudImportError, importCloudPayload } from './importer';
import { createCloudMigrationPackage, toCloudUuid } from '../migrations/localToCloud';
import { STORAGE_KEYS, type StorageLike } from '../persistence/storage';
import type { CoreWorkspace } from '../persistence/backup';

class MemoryStorage implements StorageLike {
  private readonly data = new Map<string, string>();

  get length() {
    return this.data.size;
  }

  clear() {
    this.data.clear();
  }

  getItem(key: string) {
    return this.data.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.data.delete(key);
  }

  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

const core: CoreWorkspace = {
  players: [{
    id: 'player-1',
    name: 'Ari Santos',
    number: 9,
    position: 'ST',
    age: 17,
    bio: '',
    photoUrl: '',
    height: 172,
    weight: 66,
    specialtyTraits: ['Finisher'],
    coachNotes: 'Composed in the box',
    dateOfBirth: '2009-01-10',
    fprdsRole: 'ST',
    fprdsAgeGroupPreference: 'U18',
    gamesPlayed: 2,
    points: 3,
    assists: 1,
    cleanSheetsOrRebounds: 0,
    minutesPlayed: 140,
    mvpAwards: 1,
    yellowCards: 0,
    redCards: 0,
    baseAttributes: {
      pace: 70,
      stamina: 70,
      agility: 70,
      strength: 70,
      firstTouch: 70,
      shortPassing: 70
    },
    positionAttributes: {},
    registrationStatus: 'Active',
    offenses: [],
    mvpHistory: []
  }],
  staff: [],
  games: [{
    id: 'game-1',
    opponent: 'North FC',
    date: '2026-06-20',
    time: '16:00',
    location: 'Home',
    status: 'Completed',
    type: 'League',
    ourScore: 2,
    opponentScore: 1,
    scorers: [{ playerId: 'player-1', playerName: 'Ari Santos', count: 2 }],
    mvpId: 'player-1',
    notes: 'Strong finish'
  }],
  standings: [],
  announcements: [],
  assessments: [],
  paymentLedger: [],
  teamInfo: {
    name: 'Dumala Test FC',
    coach: 'Coach Test',
    founded: '2025',
    stadium: 'Rizal Memorial',
    league: 'Local League',
    logoColor: '#0f172a',
    logoUrl: ''
  }
};

const createStorage = () => {
  const storage = new MemoryStorage();
  storage.setItem(STORAGE_KEYS.weeklySchedule, JSON.stringify({}));
  storage.setItem(STORAGE_KEYS.lineup, JSON.stringify({}));
  storage.setItem(STORAGE_KEYS.tacticsNotes, JSON.stringify([]));
  storage.setItem(STORAGE_KEYS.drawingPaths, JSON.stringify([]));
  storage.setItem(STORAGE_KEYS.playerExtras, JSON.stringify({}));
  return storage;
};

interface Operation {
  type: 'upsert' | 'update';
  table: string;
  rows?: Record<string, unknown>[];
  values?: Record<string, unknown>;
  onConflict?: string;
  filters?: Array<{ column: string; value: unknown }>;
}

const createClient = (options: { failTable?: string; userId?: string | null } = {}) => {
  const operations: Operation[] = [];
  const userId = options.userId === undefined ? '11111111-1111-4111-8111-111111111111' : options.userId;

  const client = {
    auth: {
      getUser: async () => ({
        data: { user: userId ? { id: userId } : null },
        error: null
      })
    },
    from: (table: string) => ({
      upsert: async (rows: Record<string, unknown>[], config?: { onConflict?: string }) => {
        operations.push({ type: 'upsert', table, rows, onConflict: config?.onConflict });
        return {
          error: options.failTable === table ? { message: `${table} rejected` } : null
        };
      },
      update: (values: Record<string, unknown>) => ({
        eq: async (column: string, value: unknown) => {
          operations.push({ type: 'update', table, values, filters: [{ column, value }] });
          return { error: null };
        }
      })
    })
  } as unknown as DumalaSupabaseClient;

  return { client, operations };
};

const createPayload = () => createCloudMigrationPackage(core, createStorage(), {
  importId: 'import-1',
  sourceDeviceId: 'browser-device-1',
  targetClubId: 'club-1',
  appVersion: '0.0.0',
  exportedAt: '2026-06-25T00:00:00.000Z'
}).payload;

describe('cloud importer', () => {
  it('uploads the migration payload in dependency order with user and device stamps', async () => {
    const payload = createPayload();
    const { client, operations } = createClient();

    const result = await importCloudPayload(client, payload, {
      label: 'Coach tablet',
      appVersion: '0.0.0'
    });

    const upsertedTables = operations.filter(operation => operation.type === 'upsert').map(operation => operation.table);
    expect(upsertedTables.slice(0, 5)).toEqual([
      'clubs',
      'club_memberships',
      'devices',
      'workspace_imports',
      'players'
    ]);
    expect(upsertedTables.indexOf('match_results')).toBeGreaterThan(upsertedTables.indexOf('games'));
    expect(upsertedTables.indexOf('match_scorer_contributions')).toBeGreaterThan(upsertedTables.indexOf('match_results'));

    const club = operations.find(operation => operation.table === 'clubs')!.rows![0];
    expect(club.owner_user_id).toBe('11111111-1111-4111-8111-111111111111');
    expect(club.source_team_info).toBeUndefined();

    const player = operations.find(operation => operation.table === 'players')!.rows![0];
    expect(player.created_by).toBe('11111111-1111-4111-8111-111111111111');
    expect(player.origin_device_id).toBe(toCloudUuid(payload.importId, 'devices', payload.manifest.sourceDeviceId));

    expect(result).toMatchObject({
      state: 'complete',
      importId: 'import-1',
      cloudImportId: toCloudUuid(payload.importId, 'workspace_imports', payload.importId),
      deviceId: toCloudUuid(payload.importId, 'devices', payload.manifest.sourceDeviceId)
    });
    expect(operations.at(-1)).toMatchObject({
      type: 'update',
      table: 'workspace_imports',
      values: { status: 'completed' }
    });
  });

  it('marks the workspace import failed when a domain upsert is rejected', async () => {
    const payload = createPayload();
    const { client, operations } = createClient({ failTable: 'players' });

    await expect(importCloudPayload(client, payload, {
      appVersion: '0.0.0'
    })).rejects.toThrow(CloudImportError);

    expect(operations.at(-1)).toMatchObject({
      type: 'update',
      table: 'workspace_imports',
      values: {
        status: 'failed',
        failure_code: 'PLAYERS_UPSERT_FAILED'
      }
    });
  });

  it('requires a signed-in Supabase user', async () => {
    const { client } = createClient({ userId: null });

    await expect(importCloudPayload(client, createPayload(), {
      appVersion: '0.0.0'
    })).rejects.toMatchObject({
      code: 'AUTH_USER_REQUIRED'
    });
  });
});
