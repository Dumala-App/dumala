import { describe, expect, it, vi } from 'vitest';
import type { DumalaSupabaseClient } from './client';
import { createCloudDataAccess } from './dataAccess';
import { CloudLeagueError, nextSeasonStatuses, SEASON_STATUS_LABELS } from './league';

const createTableStub = (result: unknown, error: unknown = null) => {
  const query: Record<string, unknown> = {};
  const chain = () => query;
  for (const method of ['insert', 'select', 'update', 'delete', 'eq', 'order']) {
    query[method] = vi.fn(chain);
  }
  query.single = vi.fn().mockResolvedValue({ data: result, error });
  (query as { then: unknown }).then = (resolve: (v: { data: unknown; error: unknown }) => void) =>
    resolve({ data: result, error });
  const rpc = vi.fn().mockResolvedValue({ data: result, error });
  const from = vi.fn(() => query);
  return { client: { from, rpc } as unknown as DumalaSupabaseClient, from, rpc, query };
};

describe('season lifecycle helper', () => {
  it('advances forward one step at a time', () => {
    expect(nextSeasonStatuses('draft')).toEqual(['registration_open']);
    expect(nextSeasonStatuses('registration_open')).toEqual(['active']);
    expect(nextSeasonStatuses('active')).toEqual(['completed']);
    expect(nextSeasonStatuses('completed')).toEqual(['archived']);
  });

  it('has no next status once archived', () => {
    expect(nextSeasonStatuses('archived')).toEqual([]);
  });

  it('labels every status', () => {
    expect(SEASON_STATUS_LABELS.registration_open).toBe('Registration open');
    expect(Object.keys(SEASON_STATUS_LABELS)).toHaveLength(5);
  });
});

describe('cloud league repository', () => {
  it('creates a league with the owner id and normalized fields', async () => {
    const saved = { id: 'league-1', name: 'Metro League' };
    const { client, from, query } = createTableStub(saved);

    await expect(
      createCloudDataAccess(client).league.createLeague('owner-1', {
        name: '  Metro League  ',
        location: ' Manila ',
        contactEmail: null
      })
    ).resolves.toEqual(saved);

    expect(from).toHaveBeenCalledWith('leagues');
    expect(query.insert).toHaveBeenCalledWith({
      owner_user_id: 'owner-1',
      name: 'Metro League',
      short_name: null,
      logo_color: '#f97316',
      contact_email: null,
      location: 'Manila',
      description: null
    });
  });

  it('creates a season under a league', async () => {
    const { client, from, query } = createTableStub({ id: 'season-1' });
    await createCloudDataAccess(client).league.createSeason('league-1', { name: 'Season 2026', year: 2026 });
    expect(from).toHaveBeenCalledWith('league_seasons');
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ league_id: 'league-1', name: 'Season 2026', year: 2026 }));
  });

  it('advances a season status through the RPC', async () => {
    const { client, rpc } = createTableStub('active');
    await expect(
      createCloudDataAccess(client).league.advanceSeasonStatus('season-1', 'active')
    ).resolves.toBe('active');
    expect(rpc).toHaveBeenCalledWith('advance_season_status', { season_id: 'season-1', next_status: 'active' });
  });

  it('surfaces errors as CloudLeagueError', async () => {
    const { client } = createTableStub(null, { message: 'denied' });
    await expect(createCloudDataAccess(client).league.listLeagues()).rejects.toBeInstanceOf(CloudLeagueError);
  });
});
