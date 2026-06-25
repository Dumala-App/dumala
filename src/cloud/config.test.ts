import { describe, expect, it } from 'vitest';
import { assertCloudConfigReady, readCloudConfig } from './config';
import { createDumalaSupabaseClient } from './client';

describe('cloud config', () => {
  it('is disabled by default', () => {
    expect(readCloudConfig({})).toEqual({
      enabled: false,
      supabaseUrl: undefined,
      supabasePublishableKey: undefined
    });
    expect(createDumalaSupabaseClient({ enabled: false })).toBeNull();
  });

  it('requires Supabase values when cloud is enabled', () => {
    expect(() => assertCloudConfigReady({ enabled: true })).toThrow(
      'Cloud sync is enabled, but Supabase URL or publishable key is missing.'
    );
  });

  it('accepts Vite Supabase environment variables', () => {
    expect(readCloudConfig({
      VITE_DUMALA_CLOUD_ENABLED: 'true',
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test'
    })).toEqual({
      enabled: true,
      supabaseUrl: 'http://127.0.0.1:54321',
      supabasePublishableKey: 'sb_publishable_test'
    });
  });
});
