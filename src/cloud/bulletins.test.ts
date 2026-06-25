import { describe, expect, it } from 'vitest';
import type { DumalaSupabaseClient } from './client';
import {
  CloudBulletinError,
  createSharedBulletin,
  listSharedBulletins,
  normalizeBulletinCategory,
  removeSharedBulletinControlled,
  updateSharedBulletinControlled
} from './bulletins';

const createMockClient = () => {
  const operations: Array<{ table: string; action: string; payload?: unknown; filters: Array<[string, unknown]> }> = [];
  const rows = [{
    id: 'bulletin-1',
    club_id: 'club-1',
    title: 'Training moved',
    content: 'Bring indoor shoes.',
    bulletin_date: '2026-06-25',
    category: 'training',
    author_snapshot: 'Coach',
    version: 1,
    deleted_at: null
  }];

  const client = {
    auth: {
      getUser: async () => ({ data: { user: { id: 'user-1' } }, error: null })
    },
    rpc: async (functionName: string, args: unknown) => {
      operations.push({ table: functionName, action: 'rpc', payload: args, filters: [] });
      return { data: { ...rows[0], version: 2 }, error: null };
    },
    from: (table: string) => {
      const filters: Array<[string, unknown]> = [];
      let action = 'select';
      let payload: unknown;
      let singleResult = false;

      const builder = {
        select: () => builder,
        insert: (values: unknown) => {
          action = 'insert';
          payload = values;
          return builder;
        },
        eq: (column: string, value: unknown) => {
          filters.push([column, value]);
          return builder;
        },
        is: (column: string, value: unknown) => {
          filters.push([column, value]);
          return builder;
        },
        order: () => builder,
        single: () => {
          singleResult = true;
          return builder;
        },
        then: (resolve: (value: { data: unknown; error: null }) => void) => {
          operations.push({ table, action, payload, filters: [...filters] });
          const data = action === 'select'
            ? rows
            : singleResult
              ? { id: 'bulletin-created', version: 1, ...(payload as object) }
              : null;

          resolve({ data, error: null });
        }
      };

      return builder;
    }
  } as unknown as DumalaSupabaseClient;

  return { client, operations };
};

describe('shared bulletins', () => {
  it('normalizes known bulletin categories', () => {
    expect(normalizeBulletinCategory(' Training ')).toBe('training');
    expect(() => normalizeBulletinCategory('finance')).toThrow(CloudBulletinError);
  });

  it('lists active shared bulletins for a club', async () => {
    const { client, operations } = createMockClient();

    await expect(listSharedBulletins(client, 'club-1')).resolves.toHaveLength(1);
    expect(operations[0]).toMatchObject({
      table: 'bulletins',
      action: 'select',
      filters: [['club_id', 'club-1'], ['deleted_at', null]]
    });
  });

  it('creates a bulletin and writes redacted team activity', async () => {
    const { client, operations } = createMockClient();

    await createSharedBulletin(client, {
      id: 'bulletin-2',
      clubId: 'club-1',
      title: ' Matchday ',
      content: ' Wear blue. ',
      bulletinDate: '2026-06-26',
      category: 'Matchday',
      authorSnapshot: ' Coach '
    });

    expect(operations[0]).toMatchObject({
      table: 'bulletins',
      action: 'insert',
      payload: {
        id: 'bulletin-2',
        club_id: 'club-1',
        title: 'Matchday',
        content: 'Wear blue.',
        bulletin_date: '2026-06-26',
        category: 'matchday',
        author_snapshot: 'Coach',
        created_by: 'user-1',
        updated_by: 'user-1'
      }
    });
    expect(operations[1]).toMatchObject({
      table: 'audit_events',
      action: 'insert',
      payload: {
        club_id: 'club-1',
        user_id: 'user-1',
        event_type: 'bulletin_created',
        metadata: { category: 'matchday', version: 1 }
      }
    });
  });

  it('updates and removes bulletins through controlled RPC calls', async () => {
    const { client, operations } = createMockClient();

    await updateSharedBulletinControlled(client, {
      id: 'bulletin-1',
      expectedVersion: 1,
      title: 'Updated',
      content: 'New detail',
      bulletinDate: '2026-06-27',
      category: 'urgent',
      authorSnapshot: 'Admin'
    });
    await removeSharedBulletinControlled(client, {
      id: 'bulletin-1',
      expectedVersion: 2
    });

    expect(operations).toEqual(expect.arrayContaining([
      {
        table: 'update_bulletin_controlled',
        action: 'rpc',
        payload: {
          target_bulletin_id: 'bulletin-1',
          expected_version: 1,
          new_title: 'Updated',
          new_content: 'New detail',
          new_bulletin_date: '2026-06-27',
          new_category: 'urgent',
          new_author_snapshot: 'Admin'
        },
        filters: []
      },
      {
        table: 'remove_bulletin_controlled',
        action: 'rpc',
        payload: {
          target_bulletin_id: 'bulletin-1',
          expected_version: 2
        },
        filters: []
      }
    ]));
  });
});
