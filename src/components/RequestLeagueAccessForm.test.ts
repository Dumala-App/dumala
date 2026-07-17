import { describe, expect, it, vi } from 'vitest';
import type { CloudRuntime } from '../cloud/runtime';
import { submitLeagueAccessRequest } from './RequestLeagueAccessForm';

describe('submitLeagueAccessRequest', () => {
  it('submits through the identity repository used by the admin console', async () => {
    const requestLeagueAccess = vi.fn().mockResolvedValue('request-1');
    const runtime = {
      enabled: true,
      dataAccess: {
        identity: { requestLeagueAccess }
      },
      phase6: {
        playerAppEnabled: true,
        leagueAppEnabled: true,
        leagueRequestEnabled: true,
        playerPreviewEnabled: false,
        leaguePreviewEnabled: false,
        chatEnabled: true
      }
    } as unknown as CloudRuntime;

    await expect(submitLeagueAccessRequest(runtime, {
      contactName: 'Ada Owner',
      contactEmail: 'owner@example.com',
      organization: 'Metro Football',
      leagueName: 'Metro Youth League',
      location: 'Manila',
      message: 'U15 and U17'
    })).resolves.toBe('request-1');

    expect(requestLeagueAccess).toHaveBeenCalledWith({
      contactName: 'Ada Owner',
      contactEmail: 'owner@example.com',
      organization: 'Metro Football',
      leagueName: 'Metro Youth League',
      location: 'Manila',
      message: 'U15 and U17'
    });
  });

  it('allows email-only waitlist submissions by deriving an admin display name', async () => {
    const requestLeagueAccess = vi.fn().mockResolvedValue('request-2');
    const runtime = {
      enabled: true,
      dataAccess: {
        identity: { requestLeagueAccess }
      },
      phase6: {
        playerAppEnabled: true,
        leagueAppEnabled: true,
        leagueRequestEnabled: true,
        playerPreviewEnabled: false,
        leaguePreviewEnabled: false,
        chatEnabled: true
      }
    } as unknown as CloudRuntime;

    await expect(submitLeagueAccessRequest(runtime, {
      contactEmail: 'owner@example.com'
    })).resolves.toBe('request-2');

    expect(requestLeagueAccess).toHaveBeenCalledWith({
      contactName: 'owner',
      contactEmail: 'owner@example.com',
      organization: undefined,
      leagueName: undefined,
      location: undefined,
      message: undefined
    });
  });

  it('rejects when cloud runtime is unavailable', () => {
    expect(() => submitLeagueAccessRequest({
      enabled: false,
      dataAccess: null,
      phase6: {
        playerAppEnabled: false,
        leagueAppEnabled: true,
        leagueRequestEnabled: true,
        playerPreviewEnabled: false,
        leaguePreviewEnabled: false,
        chatEnabled: false,
        teamPageEnabled: false
      }
    }, {
      contactName: 'Ada Owner',
      contactEmail: 'owner@example.com'
    })).toThrow('League access requests need a cloud connection.');
  });
});
