import { describe, expect, it, vi } from 'vitest';
import type { DumalaSupabaseClient } from './client';
import {
  CloudTeamPageError,
  EMPTY_PUBLIC_TEAM_BUNDLE,
  buildPublicTeamUrl,
  getPublicTeam,
  isValidTeamSlug,
  parsePublicTeamSlug,
  saveClubPublicPage,
  suggestTeamSlug
} from './teamPage';

const createRpcStub = (result: unknown, error: unknown = null) => {
  const rpc = vi.fn().mockResolvedValue({ data: result, error });
  return { client: { rpc } as unknown as DumalaSupabaseClient, rpc };
};

describe('team slug helpers', () => {
  it('accepts lowercase letters, digits, and hyphens between 3 and 32 chars', () => {
    expect(isValidTeamSlug('blue-eagles-fc')).toBe(true);
    expect(isValidTeamSlug('u12')).toBe(true);
    expect(isValidTeamSlug('a'.repeat(32))).toBe(true);
  });

  it('rejects malformed slugs', () => {
    expect(isValidTeamSlug('')).toBe(false);
    expect(isValidTeamSlug('ab')).toBe(false);
    expect(isValidTeamSlug('a'.repeat(33))).toBe(false);
    expect(isValidTeamSlug('Blue-Eagles')).toBe(false);
    expect(isValidTeamSlug('-eagles')).toBe(false);
    expect(isValidTeamSlug('eagles-')).toBe(false);
    expect(isValidTeamSlug('blue eagles')).toBe(false);
  });

  it('suggests a slug from a team name', () => {
    expect(suggestTeamSlug('Blue Eagles FC!')).toBe('blue-eagles-fc');
    expect(suggestTeamSlug('  Fútbol Club  Año ')).toBe('futbol-club-ano');
    expect(suggestTeamSlug('AB')).toBe('');
    expect(isValidTeamSlug(suggestTeamSlug('A Very Long Team Name That Never Seems To End FC'))).toBe(true);
  });

  it('builds the public link under the app origin', () => {
    expect(buildPublicTeamUrl('blue-eagles-fc', 'https://dumala.asia')).toBe('https://dumala.asia/#/t/blue-eagles-fc');
  });

  it('parses the slug out of the public page hash', () => {
    expect(parsePublicTeamSlug('#/t/blue-eagles-fc')).toBe('blue-eagles-fc');
    expect(parsePublicTeamSlug('#/t/Blue-Eagles-FC')).toBe('blue-eagles-fc');
    expect(parsePublicTeamSlug('#/t/blue-eagles-fc?utm=share')).toBe('blue-eagles-fc');
    expect(parsePublicTeamSlug('#/t?team=blue-eagles-fc')).toBe('blue-eagles-fc');
    expect(parsePublicTeamSlug('#/t/')).toBeUndefined();
    expect(parsePublicTeamSlug('#/landing')).toBeUndefined();
  });
});

describe('getPublicTeam', () => {
  it('maps a found bundle and normalizes the slug before the RPC call', async () => {
    const { client, rpc } = createRpcStub({
      found: true,
      club: { name: 'Blue Eagles FC', shortName: 'BEFC', founded: '2019', stadium: null, league: null, logoColor: '#0f172a' },
      page: { headline: 'Champs', teamPhoto: null, updatedAt: '2026-07-17T00:00:00Z' },
      roster: [{ name: 'Miguel Santos', number: 9, position: 'Forward' }],
      staff: [],
      lineup: { formation: '4-3-3', matchFormat: '11v11', starters: [] },
      results: []
    });

    const bundle = await getPublicTeam(client, '  Blue-Eagles-FC ');

    expect(rpc).toHaveBeenCalledWith('get_public_team', { page_slug: 'blue-eagles-fc' });
    expect(bundle.found).toBe(true);
    expect(bundle.club?.name).toBe('Blue Eagles FC');
    expect(bundle.roster).toHaveLength(1);
    expect(bundle.lineup.formation).toBe('4-3-3');
  });

  it('returns the empty bundle when the page is unpublished or unknown', async () => {
    const { client } = createRpcStub({ found: false });
    await expect(getPublicTeam(client, 'nope-nope')).resolves.toEqual(EMPTY_PUBLIC_TEAM_BUNDLE);
  });

  it('wraps RPC failures in a CloudTeamPageError', async () => {
    const { client } = createRpcStub(null, { message: 'boom' });
    await expect(getPublicTeam(client, 'blue-eagles-fc')).rejects.toMatchObject({
      name: 'CloudTeamPageError',
      code: 'PUBLIC_TEAM_READ_FAILED'
    });
  });
});

describe('saveClubPublicPage', () => {
  const createUpsertStub = (result: unknown, error: unknown = null) => {
    const single = vi.fn().mockResolvedValue({ data: result, error });
    const select = vi.fn(() => ({ single }));
    const upsert = vi.fn(() => ({ select }));
    const from = vi.fn(() => ({ upsert }));
    return { client: { from } as unknown as DumalaSupabaseClient, upsert };
  };

  it('rejects invalid slugs before calling the network', async () => {
    const { client, upsert } = createUpsertStub(null);
    await expect(saveClubPublicPage(client, 'club-1', { isPublic: true, slug: 'Bad Slug!' }))
      .rejects.toBeInstanceOf(CloudTeamPageError);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('normalizes the slug and defaults the section toggles on', async () => {
    const saved = { club_id: 'club-1', slug: 'blue-eagles-fc', is_public: true };
    const { client, upsert } = createUpsertStub(saved);

    await saveClubPublicPage(client, 'club-1', { isPublic: true, slug: '  BLUE-eagles-fc ', headline: '  ' });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        club_id: 'club-1',
        slug: 'blue-eagles-fc',
        headline: null,
        team_photo: null,
        show_roster: true,
        show_staff: true,
        show_lineup: true,
        show_results: true
      }),
      { onConflict: 'club_id' }
    );
  });

  it('reports a taken slug as a friendly error', async () => {
    const { client } = createUpsertStub(null, { code: '23505', message: 'duplicate key value violates unique constraint' });
    await expect(saveClubPublicPage(client, 'club-1', { isPublic: false, slug: 'blue-eagles-fc' }))
      .rejects.toMatchObject({ code: 'TEAM_PAGE_SLUG_TAKEN' });
  });
});
