import { useMemo } from 'react';
import { createCloudRuntime, type CloudConfig, type CloudRuntime } from '../cloud/runtime';

export const useCloudRuntime = (config?: CloudConfig): CloudRuntime =>
  useMemo(
    () => createCloudRuntime(config ? { config } : undefined),
    [config?.enabled, config?.supabasePublishableKey, config?.supabaseUrl]
  );
