import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { assertCloudConfigReady, readCloudConfig, type CloudConfig } from './config';
import type { Database } from './database.types';

export type DumalaSupabaseClient = SupabaseClient<Database>;

export const createDumalaSupabaseClient = (config: CloudConfig = readCloudConfig()): DumalaSupabaseClient | null => {
  const ready = assertCloudConfigReady(config);
  if (!ready.enabled) return null;

  return createClient<Database>(ready.supabaseUrl!, ready.supabasePublishableKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'X-Client-Info': 'dumala-web'
      }
    }
  });
};
