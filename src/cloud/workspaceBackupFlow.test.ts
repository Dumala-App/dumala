import { describe, expect, it, vi } from 'vitest';
import { runCloudBackupFlow } from './workspaceBackupFlow';
import type { CoreWorkspace } from '../persistence/backup';
import { STORAGE_KEYS, type StorageLike } from '../persistence/storage';

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

const core: CoreWorkspace = {
  teamInfo: {
    name: 'Dumala Test FC',
    founded: '2026',
    stadium: 'Test Ground',
    coach: 'Coach Test',
    league: 'Test League',
    logoColor: '#123456'
  },
  players: [],
  staff: [],
  games: [],
  standings: [],
  announcements: [],
  assessments: [],
  paymentLedger: []
};

const createInput = (storage: StorageLike, importPayload = vi.fn().mockResolvedValue({
  state: 'complete',
  importId: 'import-1',
  cloudImportId: 'cloud-import-1',
  clubId: '11111111-1111-4111-8111-111111111111',
  deviceId: '22222222-2222-4222-8222-222222222222',
  uploadedTables: [{ table: 'clubs', count: 1 }]
})) => ({
  core,
  storage,
  sync: { importPayload },
  importId: '33333333-3333-4333-8333-333333333333',
  sourceDeviceId: '44444444-4444-4444-8444-444444444444',
  targetClubId: '11111111-1111-4111-8111-111111111111',
  appVersion: '0.0.0',
  exportedAt: '2026-07-01T00:00:00.000Z',
  device: {
    appVersion: '0.0.0',
    label: 'Unit test browser'
  }
});

describe('runCloudBackupFlow', () => {
  it('creates and uploads a verified migration package', async () => {
    const storage = new MemoryStorage();
    const importPayload = vi.fn().mockResolvedValue({
      state: 'complete',
      importId: '33333333-3333-4333-8333-333333333333',
      cloudImportId: 'cloud-import-1',
      clubId: '11111111-1111-4111-8111-111111111111',
      deviceId: '22222222-2222-4222-8222-222222222222',
      uploadedTables: [{ table: 'clubs', count: 1 }]
    });

    const result = await runCloudBackupFlow(createInput(storage, importPayload));

    expect(importPayload).toHaveBeenCalledOnce();
    expect(importPayload).toHaveBeenCalledWith(
      expect.objectContaining({
        importId: '33333333-3333-4333-8333-333333333333',
        clubId: '11111111-1111-4111-8111-111111111111'
      }),
      { appVersion: '0.0.0', label: 'Unit test browser' }
    );
    expect(result.state).toBe('complete');
    expect(result.backup.version).toBe(4);
    expect(result.counts.players).toBe(0);
  });

  it('restores the local rollback backup when upload fails', async () => {
    const storage = new MemoryStorage();
    const importPayload = vi.fn().mockImplementation(async () => {
      storage.setItem(STORAGE_KEYS.players, JSON.stringify([{ id: 'partial-cloud-side-effect' }]));
      throw new Error('network unavailable');
    });

    await expect(runCloudBackupFlow(createInput(storage, importPayload))).rejects.toThrow('network unavailable');

    expect(JSON.parse(storage.getItem(STORAGE_KEYS.players) ?? '[]')).toEqual([]);
    expect(JSON.parse(storage.getItem(STORAGE_KEYS.teamInfo) ?? 'null')).toMatchObject({
      name: 'Dumala Test FC'
    });
  });
});
