export type StorageEstimate = {
  usage?: number;
  quota?: number;
};

export type StorageHealth = {
  usage: number;
  quota: number;
  usageRatio: number;
  level: 'healthy' | 'warning' | 'critical';
};

export interface StorageManagerLike {
  estimate(): Promise<StorageEstimate>;
}

export const STORAGE_WARNING_RATIO = 0.8;
export const STORAGE_CRITICAL_RATIO = 0.95;

export const calculateStorageHealth = (estimate: StorageEstimate): StorageHealth | null => {
  const usage = estimate.usage;
  const quota = estimate.quota;
  if (
    typeof usage !== 'number'
    || typeof quota !== 'number'
    || !Number.isFinite(usage)
    || !Number.isFinite(quota)
    || usage < 0
    || quota <= 0
  ) {
    return null;
  }

  const usageRatio = Math.min(usage / quota, 1);
  const level = usageRatio >= STORAGE_CRITICAL_RATIO
    ? 'critical'
    : usageRatio >= STORAGE_WARNING_RATIO
      ? 'warning'
      : 'healthy';

  return { usage, quota, usageRatio, level };
};

export const estimateStorageHealth = async (
  storageManager: StorageManagerLike | undefined = typeof navigator === 'undefined'
    ? undefined
    : navigator.storage
): Promise<StorageHealth | null> => {
  if (!storageManager?.estimate) return null;

  try {
    return calculateStorageHealth(await storageManager.estimate());
  } catch {
    return null;
  }
};

export const formatStorageSize = (bytes: number): string => {
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
};
