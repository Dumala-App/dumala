import { describe, expect, it } from 'vitest';
import {
  calculateStorageHealth,
  estimateStorageHealth,
  formatStorageSize
} from './storageHealth';

describe('storage health', () => {
  it.each([
    [799, 1000, 'healthy'],
    [800, 1000, 'warning'],
    [949, 1000, 'warning'],
    [950, 1000, 'critical']
  ] as const)('classifies %d of %d bytes as %s', (usage, quota, level) => {
    expect(calculateStorageHealth({ usage, quota })).toEqual(expect.objectContaining({
      usage,
      quota,
      level
    }));
  });

  it('returns null for unavailable or invalid estimates', () => {
    expect(calculateStorageHealth({})).toBeNull();
    expect(calculateStorageHealth({ usage: 1, quota: 0 })).toBeNull();
    expect(calculateStorageHealth({ usage: Number.NaN, quota: 100 })).toBeNull();
  });

  it('handles unsupported and failed browser estimates without throwing', async () => {
    await expect(estimateStorageHealth(undefined)).resolves.toBeNull();
    await expect(estimateStorageHealth({
      estimate: async () => {
        throw new Error('estimate unavailable');
      }
    })).resolves.toBeNull();
  });

  it('formats storage sizes for recovery guidance', () => {
    expect(formatStorageSize(900)).toBe('900 B');
    expect(formatStorageSize(1536)).toBe('1.5 KB');
    expect(formatStorageSize(5 * 1024 ** 2)).toBe('5.0 MB');
  });
});
