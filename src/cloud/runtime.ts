import { createDumalaSupabaseClient, type DumalaSupabaseClient } from './client';
import { readCloudConfig, type CloudConfig } from './config';
import { createCloudDataAccess, type CloudDataAccess } from './dataAccess';

export type { CloudConfig };

export type CloudRuntime =
  | { enabled: false; dataAccess: null }
  | { enabled: true; dataAccess: CloudDataAccess };

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
  if (!config.enabled) return { enabled: false, dataAccess: null };

  const client = createClient(config);
  if (!client) return { enabled: false, dataAccess: null };

  return {
    enabled: true,
    dataAccess: createDataAccess(client)
  };
};
