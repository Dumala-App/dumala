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

  it('lists managed users through the owner admin RPC', async () => {
    const users = [{
      userId: 'user-1',
      email: 'coach@example.com',
      displayName: 'Coach',
      accountState: 'active',
      createdAt: '2026-07-01T00:00:00Z',
      workspaceCount: 1,
      deviceCount: 2,
      feedbackCount: 0,
      planCode: 'free'
    }];
    const rpc = vi.fn().mockResolvedValue({ data: users, error: null });
    const client = { rpc } as unknown as DumalaSupabaseClient;

    await expect(createCloudDataAccess(client).admin.listManagedUsers('  coach  ', 25)).resolves.toEqual(users);

    expect(rpc).toHaveBeenCalledWith('list_admin_managed_users_v1', { search: 'coach', limit_count: 25 });
  });

  it('bans a user through the moderation RPC', async () => {
    const updated = { userId: 'user-1', accountState: 'disabled', bannedAt: '2026-07-09T00:00:00Z', planCode: 'free' };
    const rpc = vi.fn().mockResolvedValue({ data: updated, error: null });
    const client = { rpc } as unknown as DumalaSupabaseClient;

    await expect(createCloudDataAccess(client).admin.setUserBan('user-1', true, ' spam ')).resolves.toEqual(updated);

    expect(rpc).toHaveBeenCalledWith('set_admin_user_ban_v1', {
      target_user_id: 'user-1',
      banned: true,
      reason: 'spam'
    });
  });

  it('unmutes a user by passing a null muted_until', async () => {
    const updated = { userId: 'user-1', accountState: 'active', mutedUntil: null, planCode: 'free' };
    const rpc = vi.fn().mockResolvedValue({ data: updated, error: null });
    const client = { rpc } as unknown as DumalaSupabaseClient;

    await expect(createCloudDataAccess(client).admin.setUserMute('user-1', null)).resolves.toEqual(updated);

    expect(rpc).toHaveBeenCalledWith('set_admin_user_mute_v1', {
      target_user_id: 'user-1',
      muted_until: null,
      reason: null
    });
  });

  it('normalizes plan codes before calling the plan RPC', async () => {
    const updated = { userId: 'user-1', accountState: 'active', planCode: 'premium' };
    const rpc = vi.fn().mockResolvedValue({ data: updated, error: null });
    const client = { rpc } as unknown as DumalaSupabaseClient;

    await expect(
      createCloudDataAccess(client).admin.setUserPlan('user-1', ' Premium ', '2026-12-31T23:59:59.000Z', 'founder deal')
    ).resolves.toEqual(updated);

    expect(rpc).toHaveBeenCalledWith('set_admin_user_plan_v1', {
      target_user_id: 'user-1',
      plan_code: 'premium',
      expires_at: '2026-12-31T23:59:59.000Z',
      note: 'founder deal'
    });
  });

  it('revokes user devices through the owner admin RPC', async () => {
    const updated = { userId: 'user-1', accountState: 'active', planCode: 'free', deviceCount: 0, revokedDeviceCount: 3 };
    const rpc = vi.fn().mockResolvedValue({ data: updated, error: null });
    const client = { rpc } as unknown as DumalaSupabaseClient;

    await expect(createCloudDataAccess(client).admin.revokeUserDevices('user-1')).resolves.toEqual(updated);

    expect(rpc).toHaveBeenCalledWith('revoke_admin_user_devices_v1', { target_user_id: 'user-1' });
  });
});
