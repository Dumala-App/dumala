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

  it('auto-enables local dev cloud when Supabase values are present and the flag is blank', () => {
    expect(readCloudConfig({
      DEV: true,
      VITE_DUMALA_CLOUD_ENABLED: '',
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test'
    })).toEqual({
      enabled: true,
      supabaseUrl: 'http://127.0.0.1:54321',
      supabasePublishableKey: 'sb_publishable_test'
    });
  });

  it('keeps the explicit local cloud disable override', () => {
    expect(readCloudConfig({
      DEV: true,
      VITE_DUMALA_CLOUD_ENABLED: 'false',
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test'
    })).toEqual({
      enabled: false,
      supabaseUrl: 'http://127.0.0.1:54321',
      supabasePublishableKey: 'sb_publishable_test'
    });
  });

  it('does not auto-enable cloud outside local dev without the explicit flag', () => {
    expect(readCloudConfig({
      DEV: false,
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test'
    })).toEqual({
      enabled: false,
      supabaseUrl: 'http://127.0.0.1:54321',
      supabasePublishableKey: 'sb_publishable_test'
    });
  });
});
