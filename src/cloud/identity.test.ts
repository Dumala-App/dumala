import { describe, expect, it, vi } from 'vitest';
import type { DumalaSupabaseClient } from './client';
import { createCloudDataAccess } from './dataAccess';
import {
  authorizedRouteFor,
  canPersonaAccessRoute,
  isLeagueEntitled,
  parseAppDestination,
  LEAGUE_PILOT_ENTITLEMENT,
  CloudIdentityError
} from './identity';

const createRpcStub = (result: unknown, error: unknown = null) => {
  const rpc = vi.fn().mockResolvedValue({ data: result, error });
  return { client: { rpc } as unknown as DumalaSupabaseClient, rpc };
};

describe('identity pure helpers', () => {
  it('maps each persona to its single authorized route', () => {
    expect(authorizedRouteFor('coach')).toBe('/app');
    expect(authorizedRouteFor('player')).toBe('/player');
    expect(authorizedRouteFor('league')).toBe('/league');
  });

  it('only allows a persona to reach its own route', () => {
    expect(canPersonaAccessRoute('coach', '/app')).toBe(true);
    expect(canPersonaAccessRoute('coach', '/league')).toBe(false);
    expect(canPersonaAccessRoute('league', '/league')).toBe(true);
    expect(canPersonaAccessRoute('player', '/app')).toBe(false);
  });

  it('gates league on the pilot entitlement', () => {
    expect(isLeagueEntitled([LEAGUE_PILOT_ENTITLEMENT])).toBe(true);
    expect(isLeagueEntitled(['something_else'])).toBe(false);
    expect(isLeagueEntitled([])).toBe(false);
  });

  it('parses a server destination payload and falls back safely', () => {
    expect(
      parseAppDestination({
        persona: 'league',
        onboarding_status: 'new',
        entitlements: ['league_pilot'],
        league_entitled: true,
        authorized_route: '/league'
      })
    ).toEqual({
      persona: 'league',
      onboardingStatus: 'new',
      entitlements: ['league_pilot'],
      leagueEntitled: true,
      authorizedRoute: '/league'
    });

    expect(parseAppDestination(null)).toEqual({
      persona: 'coach',
      onboardingStatus: 'complete',
      entitlements: [],
      leagueEntitled: false,
      authorizedRoute: '/app'
    });
  });
});

describe('identity repository', () => {
  it('resolves the destination from the RPC payload', async () => {
    const { client, rpc } = createRpcStub({
      persona: 'player',
      onboarding_status: 'new',
      entitlements: [],
      league_entitled: false,
      authorized_route: '/player'
    });

    await expect(createCloudDataAccess(client).identity.resolveDestination()).resolves.toEqual({
      persona: 'player',
      onboardingStatus: 'new',
      entitlements: [],
      leagueEntitled: false,
      authorizedRoute: '/player'
    });
    expect(rpc).toHaveBeenCalledWith('resolve_app_destination');
  });

  it('normalizes league access request input before submitting', async () => {
    const { client, rpc } = createRpcStub('request-1');

    await expect(
      createCloudDataAccess(client).identity.requestLeagueAccess({
        contactName: '  Ada Owner  ',
        contactEmail: '  Owner@Example.COM ',
        organization: '  Metro League  ',
        leagueName: null,
        location: '',
        message: '  hello  '
      })
    ).resolves.toBe('request-1');

    expect(rpc).toHaveBeenCalledWith('request_league_access', {
      contact_name: 'Ada Owner',
      contact_email: 'owner@example.com',
      organization: 'Metro League',
      league_name: null,
      location: null,
      message: 'hello'
    });
  });

  it('provisions a league owner through the admin RPC', async () => {
    const { client, rpc } = createRpcStub(null);
    await createCloudDataAccess(client).identity.provisionLeagueOwner('req-9');
    expect(rpc).toHaveBeenCalledWith('admin_provision_league_owner', { request_id: 'req-9' });
  });

  it('surfaces RPC errors as CloudIdentityError', async () => {
    const { client } = createRpcStub(null, { message: 'denied' });
    await expect(createCloudDataAccess(client).identity.resolveDestination()).rejects.toBeInstanceOf(
      CloudIdentityError
    );
  });
});
