import { z } from 'zod';

const booleanEnvSchema = z.enum(['true', 'false']).optional().or(z.literal(''));

const cloudEnvironmentSchema = z.object({
  VITE_DUMALA_CLOUD_ENABLED: booleanEnvSchema,
  VITE_SUPABASE_URL: z.string().url().optional().or(z.literal('')),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  VITE_DUMALA_PLAYER_APP_ENABLED: booleanEnvSchema,
  VITE_DUMALA_LEAGUE_APP_ENABLED: booleanEnvSchema,
  VITE_DUMALA_LEAGUE_REQUEST_ENABLED: booleanEnvSchema,
  VITE_DUMALA_PLAYER_PREVIEW: booleanEnvSchema,
  VITE_DUMALA_LEAGUE_PREVIEW: booleanEnvSchema,
  VITE_DUMALA_CHAT_ENABLED: booleanEnvSchema,
  VITE_DUMALA_TEAM_PAGE_ENABLED: booleanEnvSchema,
  DEV: z.boolean().optional()
});

// Phase 6 turns Dumala into three apps (Coach, Player, League Owner). The Player
// and League doors ship dark by default so the Coach app is unchanged until an
// operator flips these flags.
export interface Phase6Config {
  playerAppEnabled: boolean;
  leagueAppEnabled: boolean;
  leagueRequestEnabled: boolean;
  // Preview/demo mode: open the Player app straight into a demo dashboard with
  // no login and no cloud (in-memory sample data), so the UI can be reviewed
  // without an account. Toggle off to restore the sign-in gate.
  playerPreviewEnabled: boolean;
  // Same idea for the League Owner app: open #/league straight into a demo
  // dashboard with no login/entitlement (in-memory sample data).
  leaguePreviewEnabled: boolean;
  // Team Chat (shared Coach/Player communication) surfaces.
  chatEnabled: boolean;
  // Public team page (#/t/<slug>): a coach's shareable, login-free showcase
  // page plus the Squad > Public Page settings tab. Off by default.
  teamPageEnabled: boolean;
}

export interface CloudConfig {
  enabled: boolean;
  supabaseUrl?: string;
  supabasePublishableKey?: string;
  phase6: Phase6Config;
}

const readBooleanEnv = (value: string | boolean | undefined): string | undefined =>
  typeof value === 'string' ? value : undefined;

export const readCloudConfig = (
  env: Record<string, string | boolean | undefined> = import.meta.env
): CloudConfig => {
  const parsed = cloudEnvironmentSchema.parse({
    VITE_DUMALA_CLOUD_ENABLED: readBooleanEnv(env.VITE_DUMALA_CLOUD_ENABLED),
    VITE_SUPABASE_URL: typeof env.VITE_SUPABASE_URL === 'string' ? env.VITE_SUPABASE_URL : '',
    VITE_SUPABASE_PUBLISHABLE_KEY: typeof env.VITE_SUPABASE_PUBLISHABLE_KEY === 'string'
      ? env.VITE_SUPABASE_PUBLISHABLE_KEY
      : '',
    VITE_DUMALA_PLAYER_APP_ENABLED: readBooleanEnv(env.VITE_DUMALA_PLAYER_APP_ENABLED),
    VITE_DUMALA_LEAGUE_APP_ENABLED: readBooleanEnv(env.VITE_DUMALA_LEAGUE_APP_ENABLED),
    VITE_DUMALA_LEAGUE_REQUEST_ENABLED: readBooleanEnv(env.VITE_DUMALA_LEAGUE_REQUEST_ENABLED),
    VITE_DUMALA_PLAYER_PREVIEW: readBooleanEnv(env.VITE_DUMALA_PLAYER_PREVIEW),
    VITE_DUMALA_LEAGUE_PREVIEW: readBooleanEnv(env.VITE_DUMALA_LEAGUE_PREVIEW),
    VITE_DUMALA_CHAT_ENABLED: readBooleanEnv(env.VITE_DUMALA_CHAT_ENABLED),
    VITE_DUMALA_TEAM_PAGE_ENABLED: readBooleanEnv(env.VITE_DUMALA_TEAM_PAGE_ENABLED),
    DEV: typeof env.DEV === 'boolean' ? env.DEV : false
  });

  const hasSupabaseConfig = Boolean(parsed.VITE_SUPABASE_URL && parsed.VITE_SUPABASE_PUBLISHABLE_KEY);
  const enabled = parsed.VITE_DUMALA_CLOUD_ENABLED === 'true'
    || (parsed.VITE_DUMALA_CLOUD_ENABLED !== 'false' && parsed.DEV === true && hasSupabaseConfig);

  return {
    enabled,
    supabaseUrl: parsed.VITE_SUPABASE_URL || undefined,
    supabasePublishableKey: parsed.VITE_SUPABASE_PUBLISHABLE_KEY || undefined,
    phase6: {
      playerAppEnabled: parsed.VITE_DUMALA_PLAYER_APP_ENABLED === 'true',
      leagueAppEnabled: parsed.VITE_DUMALA_LEAGUE_APP_ENABLED === 'true',
      // The public request form is available whenever the League app is enabled,
      // or explicitly on its own, so the waitlist can open before dashboards do.
      leagueRequestEnabled: parsed.VITE_DUMALA_LEAGUE_REQUEST_ENABLED === 'true'
        || parsed.VITE_DUMALA_LEAGUE_APP_ENABLED === 'true',
      playerPreviewEnabled: parsed.VITE_DUMALA_PLAYER_PREVIEW === 'true',
      leaguePreviewEnabled: parsed.VITE_DUMALA_LEAGUE_PREVIEW === 'true',
      chatEnabled: parsed.VITE_DUMALA_CHAT_ENABLED === 'true',
      teamPageEnabled: parsed.VITE_DUMALA_TEAM_PAGE_ENABLED === 'true'
    }
  };
};

export const assertCloudConfigReady = (config: CloudConfig): CloudConfig => {
  if (!config.enabled) return config;
  if (!config.supabaseUrl || !config.supabasePublishableKey) {
    throw new Error('Cloud sync is enabled, but Supabase URL or publishable key is missing.');
  }
  return config;
};
