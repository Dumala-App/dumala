import { describe, expect, it } from 'vitest';
import type { DumalaSupabaseClient } from './client';
import { listTeamActivityHistory, writeTeamActivityEvent } from './activity';

const createMockClient = () => {
  const operations: Array<{ table: string; action: string; payload?: unknown; filters: Array<[string, unknown]>; limit?: number }> = [];
  const rows = [{
    id: 'activity-1',
    club_id: 'club-1',
    user_id: 'user-1',
    event_type: 'membership_role_changed',
    event_time: '2026-06-25T12:00:00.000Z',
    metadata: { role: 'coach' }
  }];

  const client = {
    auth: {
      getUser: async () => ({ data: { user: { id: 'user-1' } }, error: null })
    },
    from: (table: string) => {
      const operation = { table, action: 'select', payload: undefined as unknown, filters: [] as Array<[string, unknown]>, limit: undefined as number | undefined };

      const builder = {
        select: () => builder,
        insert: (values: unknown) => {
          operation.action = 'insert';
          operation.payload = values;
          return builder;
        },
        eq: (column: string, value: unknown) => {
          operation.filters.push([column, value]);
          return builder;
        },
        order: () => builder,
        limit: (value: number) => {
          operation.limit = value;
          return builder;
        },
        then: (resolve: (value: { data: unknown; error: null }) => void) => {
          operations.push(operation);
          resolve({ data: operation.action === 'select' ? rows : null, error: null });
        }
      };

      return builder;
    }
  } as unknown as DumalaSupabaseClient;

  return { client, operations };
};

describe('team activity history', () => {
  it('writes privacy-minimized team activity metadata', async () => {
    const { client, operations } = createMockClient();

    await writeTeamActivityEvent(client, 'membership_role_changed', {
      clubId: 'club-1',
      metadata: {
        role: 'coach',
        playerName: 'Ari Santos',
        paymentAmount: 1200,
        noteContent: 'private'
      }
    });

    expect(operations[0]).toMatchObject({
      table: 'audit_events',
      action: 'insert',
      payload: {
        club_id: 'club-1',
        user_id: 'user-1',
        event_type: 'membership_role_changed',
        metadata: { role: 'coach' }
      }
    });
  });

  it('reads bounded club activity history newest first', async () => {
    const { client, operations } = createMockClient();

    await expect(listTeamActivityHistory(client, 'club-1', 25)).resolves.toHaveLength(1);
    expect(operations[0]).toMatchObject({
      table: 'audit_events',
      action: 'select',
      filters: [['club_id', 'club-1']],
      limit: 25
    });
  });
});
