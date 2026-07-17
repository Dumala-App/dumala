import { describe, expect, it, vi } from 'vitest';
import type { DumalaSupabaseClient } from './client';
import type { CloudDataAccess } from './dataAccess';
import { createCloudRuntime } from './runtime';

describe('cloud runtime', () => {
  it('keeps cloud disabled without creating a Supabase client', () => {
    const createClient = vi.fn();

    expect(createCloudRuntime({
      config: { enabled: false, phase6: { playerAppEnabled: false, leagueAppEnabled: false, leagueRequestEnabled: false, playerPreviewEnabled: false, leaguePreviewEnabled: false, chatEnabled: false, teamPageEnabled: false } },
      createClient
    })).toEqual({ enabled: false, dataAccess: null, phase6: { playerAppEnabled: false, leagueAppEnabled: false, leagueRequestEnabled: false, playerPreviewEnabled: false, leaguePreviewEnabled: false, chatEnabled: false, teamPageEnabled: false } });
    expect(createClient).not.toHaveBeenCalled();
  });

  it('creates data access only when cloud config is enabled and ready', () => {
    const client = {} as DumalaSupabaseClient;
    const dataAccess = { auth: {} } as CloudDataAccess;
    const createClient = vi.fn(() => client);
    const createDataAccess = vi.fn(() => dataAccess);

    expect(createCloudRuntime({
      config: {
        enabled: true,
        supabaseUrl: 'http://127.0.0.1:54321',
        supabasePublishableKey: 'sb_publishable_test',
        phase6: { playerAppEnabled: false, leagueAppEnabled: false, leagueRequestEnabled: false, playerPreviewEnabled: false, leaguePreviewEnabled: false, chatEnabled: false, teamPageEnabled: false }
      },
      createClient,
      createDataAccess
    })).toEqual({ enabled: true, dataAccess, phase6: { playerAppEnabled: false, leagueAppEnabled: false, leagueRequestEnabled: false, playerPreviewEnabled: false, leaguePreviewEnabled: false, chatEnabled: false, teamPageEnabled: false } });
    expect(createClient).toHaveBeenCalledOnce();
    expect(createDataAccess).toHaveBeenCalledWith(client);
  });
});

