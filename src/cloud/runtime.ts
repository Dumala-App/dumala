import { createDumalaSupabaseClient, type DumalaSupabaseClient } from './client';
import { readCloudConfig, type CloudConfig, type Phase6Config } from './config';
import { createCloudDataAccess, type CloudDataAccess } from './dataAccess';

export type { CloudConfig, Phase6Config };

// Phase 6 feature flags are surfaced here so React routing can read them without
// importing the low-level config module directly (see cloud/boundaries.test.ts).
export type CloudRuntime =
  | { enabled: false; dataAccess: null; phase6: Phase6Config }
  | { enabled: true; dataAccess: CloudDataAccess; phase6: Phase6Config };

export interface CloudRuntimeOptions {
  config?: CloudConfig;
  createClient?: (config: CloudConfig) => DumalaSupabaseClient | null;
  createDataAccess?: (client: DumalaSupabaseClient) => CloudDataAccess;
}

export const createCloudRuntime = ({
  config = readCloudConfig(),
  createClient = createDumalaSupabaseClient,
  createDataAccess = createCloudDataAccess
}: CloudRuntimeOptions = {}): CloudRuntime => {
  if (!config.enabled) return { enabled: false, dataAccess: null, phase6: config.phase6 };

  const client = createClient(config);
  if (!client) return { enabled: false, dataAccess: null, phase6: config.phase6 };

  return {
    enabled: true,
    dataAccess: createDataAccess(client),
    phase6: config.phase6
  };
};
