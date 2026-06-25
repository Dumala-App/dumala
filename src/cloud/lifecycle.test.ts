import { describe, expect, it } from 'vitest';
import type { DumalaSupabaseClient } from './client';
import {
  assertRecentAuthentication,
  createPortableAccountArchive,
  requestAccountDeletion,
  requestAccountRecoveryLink,
  requestClubDeletion,
  revokeDevice
} from './lifecycle';

interface Operation {
  type: 'select' | 'insert' | 'update' | 'otp';
  table?: string;
  columns?: string;
  values?: unknown;
  filters?: Array<{ column: string; value: unknown }>;
  order?: { column: string; ascending?: boolean };
}

const user = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'coach@example.com',
  last_sign_in_at: '2026-06-25T12:00:00.000Z'
};

const createClient = (options: {
  lastSignInAt?: string;
  userEmail?: string;
  clubOwnerId?: string;
  clubName?: string;
  ownedClubStates?: string[];
} = {}) => {
  const operations: Operation[] = [];
  const rows: Record<string, unknown> = {
    user_profiles: { user_id: user.id, display_name: 'Coach' },
    devices: [{ id: 'device-1', label: 'Coach tablet', app_version: '0.0.0' }],
    clubs: [{
      id: 'club-1',
      name: options.clubName ?? 'Dumala Test FC',
      owner_user_id: options.clubOwnerId ?? user.id,
      club_state: 'active'
    }],
    club_memberships: [{ club_id: 'club-1', user_id: user.id, role: 'owner' }],
    players: [{ id: 'player-1', club_id: 'club-1', name: 'Ari Santos' }],
    staff_members: [],
    games: [],
    match_results: [],
    match_scorer_contributions: [],
    mvp_awards: [],
    player_offenses: [],
    standings_rows: [],
    standings_snapshots: [],
    bulletins: [],
    assessment_sessions: [],
    assessment_development_plan_weeks: [],
    payment_ledger_entries: [],
    player_availability: [],
    coach_notes: [],
    weekly_training_schedules: [],
    tactics_workspaces: [],
    tactics_lineup_assignments: [],
    tactics_draw_paths: [],
    tactics_notes: [],
    tactics_player_extras: []
  };

  const filteredRows = (table: string, filters: Operation['filters']) => {
    if (table === 'clubs' && filters?.some(filter => filter.column === 'owner_user_id')) {
      return (options.ownedClubStates ?? ['pending_deletion']).map((club_state, index) => ({
        id: `club-${index + 1}`,
        name: `Club ${index + 1}`,
        club_state
      }));
    }
    const value = rows[table];
    return Array.isArray(value) ? value : [value];
  };

  const makeQuery = (table: string) => {
    const operation: Operation = { type: 'select', table, filters: [] };
    const query = {
      select: (columns = '*') => {
        operation.columns = columns;
        operations.push(operation);
        return query;
      },
      insert: async (values: unknown) => {
        operations.push({ type: 'insert', table, values });
        return { data: null, error: null };
      },
      update: (values: unknown) => {
        const updateOperation: Operation = { type: 'update', table, values, filters: [] };
        const updateQuery = {
          eq: (column: string, value: unknown) => {
            updateOperation.filters!.push({ column, value });
            return updateQuery;
          },
          then: (resolve: (result: { data: null; error: null }) => void) => {
            operations.push(updateOperation);
            resolve({ data: null, error: null });
          }
        };
        return updateQuery;
      },
      eq: (column: string, value: unknown) => {
        operation.filters!.push({ column, value });
        return query;
      },
      order: (column: string, config: { ascending?: boolean }) => {
        operation.order = { column, ascending: config.ascending };
        return query;
      },
      maybeSingle: async () => ({ data: rows[table] ?? null, error: null }),
      single: async () => ({ data: filteredRows(table, operation.filters)[0], error: null }),
      then: (resolve: (result: { data: unknown[]; error: null }) => void) => {
        resolve({ data: filteredRows(table, operation.filters), error: null });
      }
    };
    return query;
  };

  const client = {
    auth: {
      getUser: async () => ({
        data: {
          user: {
            ...user,
            email: options.userEmail ?? user.email
          }
        },
        error: null
      }),
      getSession: async () => ({
        data: {
          session: {
            user: {
              ...user,
              last_sign_in_at: options.lastSignInAt ?? user.last_sign_in_at
            }
          }
        },
        error: null
      }),
      signInWithOtp: async (values: unknown) => {
        operations.push({ type: 'otp', values });
        return { data: null, error: null };
      }
    },
    from: makeQuery
  } as unknown as DumalaSupabaseClient;

  return { client, operations };
};

describe('cloud lifecycle', () => {
  it('requests passwordless recovery without keeping secret payloads', async () => {
    const { client, operations } = createClient();

    await requestAccountRecoveryLink(client, ' Coach@Example.COM ', 'http://localhost:3000');

    expect(operations).toEqual([{
      type: 'otp',
      values: {
        email: 'coach@example.com',
        options: { emailRedirectTo: 'http://localhost:3000' }
      }
    }]);
  });

  it('requires recent authentication for sensitive actions', async () => {
    const { client } = createClient({ lastSignInAt: '2026-06-25T11:00:00.000Z' });

    await expect(assertRecentAuthentication(client, new Date('2026-06-25T12:00:00.000Z'))).rejects.toMatchObject({
      code: 'RECENT_AUTH_REQUIRED'
    });
  });

  it('revokes a device and writes a redacted audit event', async () => {
    const { client, operations } = createClient();

    await revokeDevice(client, 'device-1', new Date('2026-06-25T12:05:00.000Z'));

    expect(operations.find(operation => operation.type === 'update' && operation.table === 'devices')).toMatchObject({
      values: { revoked_at: '2026-06-25T12:05:00.000Z' },
      filters: [
        { column: 'id', value: 'device-1' },
        { column: 'user_id', value: user.id }
      ]
    });
    expect(operations.find(operation => operation.type === 'insert' && operation.table === 'audit_events')).toMatchObject({
      values: {
        user_id: user.id,
        device_id: 'device-1',
        event_type: 'device_revoked',
        metadata: {}
      }
    });
  });

  it('creates a portable account archive from account, device, membership, club, and workspace tables', async () => {
    const { client, operations } = createClient();

    const archive = await createPortableAccountArchive(client, 'club-1', new Date('2026-06-25T12:06:00.000Z'));

    expect(archive).toMatchObject({
      format: 'dumala-portable-account-archive',
      version: 1,
      exportedAt: '2026-06-25T12:06:00.000Z',
      account: {
        userId: user.id,
        email: user.email
      }
    });
    expect(archive.workspace.players).toEqual([{ id: 'player-1', club_id: 'club-1', name: 'Ari Santos' }]);
    expect(operations.filter(operation => operation.type === 'insert' && operation.table === 'audit_events').map(operation => (
      operation.values as { event_type: string }
    ).event_type)).toEqual(['export_requested', 'export_completed']);
  });

  it('marks a club pending deletion only for the owner with exact name confirmation', async () => {
    const { client, operations } = createClient();

    await requestClubDeletion(client, 'club-1', 'Dumala Test FC', new Date('2026-06-25T12:07:00.000Z'));

    expect(operations.find(operation => operation.type === 'update' && operation.table === 'clubs')).toMatchObject({
      values: {
        club_state: 'pending_deletion',
        pending_deletion_at: '2026-06-25T12:07:00.000Z'
      },
      filters: [{ column: 'id', value: 'club-1' }]
    });
  });

  it('blocks account deletion while an owned club is active', async () => {
    const { client } = createClient({ ownedClubStates: ['active'] });

    await expect(requestAccountDeletion(client, 'coach@example.com', new Date('2026-06-25T12:08:00.000Z'))).rejects.toMatchObject({
      code: 'ACTIVE_OWNED_CLUB_BLOCKS_ACCOUNT_DELETION'
    });
  });

  it('marks the account pending deletion and revokes devices after club deletion is pending', async () => {
    const { client, operations } = createClient({ ownedClubStates: ['pending_deletion'] });

    await requestAccountDeletion(client, 'coach@example.com', new Date('2026-06-25T12:08:00.000Z'));

    expect(operations.find(operation => operation.type === 'update' && operation.table === 'user_profiles')).toMatchObject({
      values: {
        account_state: 'pending_deletion',
        pending_deletion_at: '2026-06-25T12:08:00.000Z'
      }
    });
    expect(operations.filter(operation => operation.type === 'update' && operation.table === 'devices')).toHaveLength(1);
  });
});
