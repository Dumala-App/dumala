import { describe, expect, it, vi } from 'vitest';
import { createCloudDataAccess } from './dataAccess';
import type { DumalaSupabaseClient } from './client';

describe('cloud data access boundary', () => {
  it('routes feature operations through cloud repositories', async () => {
    const order = vi.fn(() => query);
    const is = vi.fn(() => query);
    const eq = vi.fn(() => query);
    const query = {
      eq,
      is,
      order,
      then: (resolve: (value: { data: unknown[]; error: null }) => void) => resolve({ data: [], error: null })
    };
    const select = vi.fn(() => query);
    const from = vi.fn(() => ({ select }));
    const client = { from } as unknown as DumalaSupabaseClient;

    const cloud = createCloudDataAccess(client);
    const bulletins = await cloud.bulletins.list('club-1');

    expect(bulletins).toEqual([]);
    expect(from).toHaveBeenCalledWith('bulletins');
    expect(select).toHaveBeenCalledWith('*');
    expect(eq).toHaveBeenCalledWith('club_id', 'club-1');
    expect(is).toHaveBeenCalledWith('deleted_at', null);
  });
});
