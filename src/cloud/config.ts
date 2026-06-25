import { z } from 'zod';

const booleanEnvSchema = z.enum(['true', 'false']).optional();

const cloudEnvironmentSchema = z.object({
  VITE_DUMALA_CLOUD_ENABLED: booleanEnvSchema,
  VITE_SUPABASE_URL: z.string().url().optional().or(z.literal('')),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().optional()
});

export interface CloudConfig {
  enabled: boolean;
  supabaseUrl?: string;
  supabasePublishableKey?: string;
}

export const readCloudConfig = (
  env: Record<string, string | boolean | undefined> = import.meta.env
): CloudConfig => {
  const parsed = cloudEnvironmentSchema.parse({
    VITE_DUMALA_CLOUD_ENABLED: String(env.VITE_DUMALA_CLOUD_ENABLED ?? 'false'),
    VITE_SUPABASE_URL: typeof env.VITE_SUPABASE_URL === 'string' ? env.VITE_SUPABASE_URL : '',
    VITE_SUPABASE_PUBLISHABLE_KEY: typeof env.VITE_SUPABASE_PUBLISHABLE_KEY === 'string'
      ? env.VITE_SUPABASE_PUBLISHABLE_KEY
      : ''
  });

  const enabled = parsed.VITE_DUMALA_CLOUD_ENABLED === 'true';
  return {
    enabled,
    supabaseUrl: parsed.VITE_SUPABASE_URL || undefined,
    supabasePublishableKey: parsed.VITE_SUPABASE_PUBLISHABLE_KEY || undefined
  };
};

export const assertCloudConfigReady = (config: CloudConfig): CloudConfig => {
  if (!config.enabled) return config;
  if (!config.supabaseUrl || !config.supabasePublishableKey) {
    throw new Error('Cloud sync is enabled, but Supabase URL or publishable key is missing.');
  }
  return config;
};
