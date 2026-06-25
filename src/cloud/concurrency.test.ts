import { describe, expect, it } from 'vitest';
import type { DumalaSupabaseClient } from './client';
import {
  applyControlledRecordUpdate,
  CloudConcurrencyError,
  isVersionConflictError
} from './concurrency';

const createMockClient = (error: unknown = null) => {
  const calls: unknown[] = [];
  const client = {
    rpc: async (functionName: string, args: unknown) => {
      calls.push({ functionName, args });
      return {
        data: { id: 'player-1', version: 2, name: 'Updated Player' },
        error
      };
    }
  } as unknown as DumalaSupabaseClient;

  return { client, calls };
};

describe('cloud concurrency', () => {
  it('applies controlled updates through the version-checked RPC', async () => {
    const { client, calls } = createMockClient();

    await expect(applyControlledRecordUpdate(client, {
      table: 'players',
      id: 'player-1',
      expectedVersion: 1,
      patch: {
        name: 'Updated Player',
        bio: undefined
      }
    })).resolves.toMatchObject({
      id: 'player-1',
      version: 2
    });

    expect(calls).toEqual([{
      functionName: 'apply_controlled_record_update',
      args: {
        target_table: 'players',
        target_id: 'player-1',
        expected_version: 1,
        patch: {
          name: 'Updated Player'
        }
      }
    }]);
  });

  it('rejects protected patch fields before reaching the server', async () => {
    const { client } = createMockClient();

    await expect(applyControlledRecordUpdate(client, {
      table: 'players',
      id: 'player-1',
      expectedVersion: 1,
      patch: {
        club_id: 'other-club'
      }
    })).rejects.toMatchObject({
      code: 'PATCH_PROTECTED_FIELD'
    });
  });

  it('maps stale-version database errors to a version conflict', async () => {
    const { client } = createMockClient({ code: '40001', message: 'Record changed since it was opened.' });

    await expect(applyControlledRecordUpdate(client, {
      table: 'players',
      id: 'player-1',
      expectedVersion: 1,
      patch: { name: 'Updated Player' }
    })).rejects.toMatchObject({
      code: 'VERSION_CONFLICT'
    });

    expect(isVersionConflictError(new CloudConcurrencyError('conflict', 'VERSION_CONFLICT'))).toBe(true);
    expect(isVersionConflictError({ code: '40001' })).toBe(true);
  });
});
