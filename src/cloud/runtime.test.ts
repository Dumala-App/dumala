import { describe, expect, it, vi } from 'vitest';
import type { DumalaSupabaseClient } from './client';
import type { CloudDataAccess } from './dataAccess';
import { createCloudRuntime } from './runtime';

describe('cloud runtime', () => {
  it('keeps cloud disabled without creating a Supabase client', () => {
    const createClient = vi.fn();

    expect(createCloudRuntime({
      config: { enabled: false },
      createClient
    })).toEqual({ enabled: false, dataAccess: null });
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
        supabasePublishableKey: 'sb_publishable_test'
      },
      createClient,
      createDataAccess
    })).toEqual({ enabled: true, dataAccess });
    expect(createClient).toHaveBeenCalledOnce();
    expect(createDataAccess).toHaveBeenCalledWith(client);
  });
});

