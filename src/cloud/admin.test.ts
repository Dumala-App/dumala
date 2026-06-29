import { describe, expect, it, vi } from 'vitest';
import type { DumalaSupabaseClient } from './client';
import { createCloudDataAccess } from './dataAccess';

describe('cloud admin repository', () => {
  it('reads storage metrics through the owner admin RPC', async () => {
    const metrics = {
      totalBytes: 4096,
      tableBytes: 3072,
      indexBytes: 1024,
      tables: [{
        tableName: 'players',
        rowEstimate: 24,
        totalBytes: 2048,
        tableBytes: 1536,
        indexBytes: 512,
        totalPercent: 50
      }],
      trend: [{
        date: '2026-06-30',
        totalBytes: 4096,
        tableBytes: 3072,
        indexBytes: 1024,
        topTables: []
      }],
      warnings: []
    };
    const rpc = vi.fn().mockResolvedValue({ data: metrics, error: null });
    const client = { rpc } as unknown as DumalaSupabaseClient;

    await expect(createCloudDataAccess(client).admin.getStorageMetrics(14)).resolves.toEqual(metrics);

    expect(rpc).toHaveBeenCalledWith('get_admin_storage_metrics_v1', { days: 14 });
  });
});
