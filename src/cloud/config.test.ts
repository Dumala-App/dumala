import { describe, expect, it } from 'vitest';
import { assertCloudConfigReady, readCloudConfig } from './config';
import { createDumalaSupabaseClient } from './client';

describe('cloud config', () => {
  it('is disabled by default', () => {
    expect(readCloudConfig({})).toEqual({
      enabled: false,
      supabaseUrl: undefined,
      supabasePublishableKey: undefined,
      phase6: { playerAppEnabled: false, leagueAppEnabled: false, leagueRequestEnabled: false, playerPreviewEnabled: false, leaguePreviewEnabled: false, chatEnabled: false, teamPageEnabled: false }
    });
    expect(createDumalaSupabaseClient({ enabled: false, phase6: { playerAppEnabled: false, leagueAppEnabled: false, leagueRequestEnabled: false, playerPreviewEnabled: false, leaguePreviewEnabled: false, chatEnabled: false, teamPageEnabled: false } })).toBeNull();
  });

  it('requires Supabase values when cloud is enabled', () => {
    expect(() => assertCloudConfigReady({
      enabled: true,
      phase6: { playerAppEnabled: false, leagueAppEnabled: false, leagueRequestEnabled: false, playerPreviewEnabled: false, leaguePreviewEnabled: false, chatEnabled: false, teamPageEnabled: false }
    })).toThrow(
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
      supabasePublishableKey: 'sb_publishable_test',
      phase6: { playerAppEnabled: false, leagueAppEnabled: false, leagueRequestEnabled: false, playerPreviewEnabled: false, leaguePreviewEnabled: false, chatEnabled: false, teamPageEnabled: false }
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
      supabasePublishableKey: 'sb_publishable_test',
      phase6: { playerAppEnabled: false, leagueAppEnabled: false, leagueRequestEnabled: false, playerPreviewEnabled: false, leaguePreviewEnabled: false, chatEnabled: false, teamPageEnabled: false }
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
      supabasePublishableKey: 'sb_publishable_test',
      phase6: { playerAppEnabled: false, leagueAppEnabled: false, leagueRequestEnabled: false, playerPreviewEnabled: false, leaguePreviewEnabled: false, chatEnabled: false, teamPageEnabled: false }
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
      supabasePublishableKey: 'sb_publishable_test',
      phase6: { playerAppEnabled: false, leagueAppEnabled: false, leagueRequestEnabled: false, playerPreviewEnabled: false, leaguePreviewEnabled: false, chatEnabled: false, teamPageEnabled: false }
    });
  });

  it('enables the Player and League doors when their flags are set', () => {
    const config = readCloudConfig({
      VITE_DUMALA_CLOUD_ENABLED: 'true',
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
      VITE_DUMALA_PLAYER_APP_ENABLED: 'true',
      VITE_DUMALA_LEAGUE_APP_ENABLED: 'true'
    });
    expect(config.phase6).toEqual({
      playerAppEnabled: true,
      leagueAppEnabled: true,
      leagueRequestEnabled: true,
      playerPreviewEnabled: false,
      leaguePreviewEnabled: false,
      chatEnabled: false,
      teamPageEnabled: false
    });
  });

  it('opens the League request form on its own without the League dashboard', () => {
    const config = readCloudConfig({
      VITE_DUMALA_LEAGUE_REQUEST_ENABLED: 'true'
    });
    expect(config.phase6).toEqual({
      playerAppEnabled: false,
      leagueAppEnabled: false,
      leagueRequestEnabled: true,
      playerPreviewEnabled: false,
      leaguePreviewEnabled: false,
      chatEnabled: false,
      teamPageEnabled: false
    });
  });

  it('enables team chat from its flag', () => {
    expect(readCloudConfig({ VITE_DUMALA_CHAT_ENABLED: 'true' }).phase6.chatEnabled).toBe(true);
  });

  it('enables the public team page from its flag', () => {
    expect(readCloudConfig({ VITE_DUMALA_TEAM_PAGE_ENABLED: 'true' }).phase6.teamPageEnabled).toBe(true);
    expect(readCloudConfig({}).phase6.teamPageEnabled).toBe(false);
  });

  it('enables player and league preview modes from their flags', () => {
    expect(readCloudConfig({ VITE_DUMALA_PLAYER_PREVIEW: 'true' }).phase6.playerPreviewEnabled).toBe(true);
    const league = readCloudConfig({ VITE_DUMALA_LEAGUE_PREVIEW: 'true' }).phase6;
    expect(league.leaguePreviewEnabled).toBe(true);
    expect(league.leagueAppEnabled).toBe(false);
  });
});
