import { describe, expect, it } from 'vitest';
import type { StaffMember, TeamInfo } from '../types';
import { createWorkspaceBackup } from './backup';
import { STORAGE_KEYS, type StorageLike } from './storage';
import {
  bootstrapManagedWorkspaces,
  copyActiveKeysToWorkspace,
  createManagedWorkspace,
  deleteManagedWorkspace,
  getActiveWorkspaceId,
  importBackupAsManagedWorkspace,
  switchManagedWorkspace
} from './workspaces';

class MemoryStorage implements StorageLike {
  protected values = new Map<string, string>();

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

const team = (name: string): TeamInfo => ({
  name,
  founded: '2026',
  stadium: `${name} Ground`,
  coach: `${name} Coach`,
  league: 'Test League',
  logoColor: '#123456'
});

const coach = (name: string): StaffMember => ({
  id: `${name.toLowerCase().replace(/\s+/g, '-')}-coach`,
  name: `${name} Coach`,
  role: 'Head Coach',
  bio: '',
  photoUrl: '/coach.png',
  status: 'Active'
});

const core = (teamInfo: TeamInfo) => ({
  teamInfo,
  players: [],
  staff: [coach(teamInfo.name)],
  games: [],
  standings: [],
  announcements: [],
  assessments: [],
  paymentLedger: []
});

describe('managed workspaces', () => {
  it('migrates a valid legacy single workspace into one managed workspace', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEYS.onboarded, 'true');
    storage.setItem(STORAGE_KEYS.teamInfo, JSON.stringify(team('Legacy FC')));
    storage.setItem(STORAGE_KEYS.players, JSON.stringify([]));
    storage.setItem(STORAGE_KEYS.staff, JSON.stringify([coach('Legacy FC')]));

    const result = bootstrapManagedWorkspaces(storage, '2026-06-28T00:00:00.000Z');

    expect(result.workspaces).toHaveLength(1);
    expect(result.workspaces[0].name).toBe('Legacy FC');
    expect(result.activeWorkspaceId).toBe(result.workspaces[0].id);
    expect(getActiveWorkspaceId(storage)).toBe(result.workspaces[0].id);
  });

  it('switches active teams without leaking active workspace data', () => {
    const storage = new MemoryStorage();
    const first = createManagedWorkspace(team('First FC'), coach('First FC'), storage);
    storage.setItem(STORAGE_KEYS.players, JSON.stringify([{ id: 'first-player' }]));
    copyActiveKeysToWorkspace(first.summary.id, storage);

    const second = createManagedWorkspace(team('Second FC'), coach('Second FC'), storage);
    storage.setItem(STORAGE_KEYS.players, JSON.stringify([{ id: 'second-player' }]));
    copyActiveKeysToWorkspace(second.summary.id, storage);

    switchManagedWorkspace(first.summary.id, second.summary.id, storage);

    expect(JSON.parse(storage.getItem(STORAGE_KEYS.teamInfo)!).name).toBe('First FC');
    expect(JSON.parse(storage.getItem(STORAGE_KEYS.players)!)).toEqual([{ id: 'first-player' }]);
  });

  it('deleting the active workspace selects another team when available', () => {
    const storage = new MemoryStorage();
    const first = createManagedWorkspace(team('First FC'), coach('First FC'), storage);
    const second = createManagedWorkspace(team('Second FC'), coach('Second FC'), storage);

    const result = deleteManagedWorkspace(second.summary.id, storage);

    expect(result.activeWorkspaceId).toBe(first.summary.id);
    expect(JSON.parse(storage.getItem(STORAGE_KEYS.teamInfo)!).name).toBe('First FC');
    expect(result.workspaces.map(workspace => workspace.name)).toEqual(['First FC']);
  });

  it('deleting the last active workspace returns to an empty onboarding state', () => {
    const storage = new MemoryStorage();
    const only = createManagedWorkspace(team('Only FC'), coach('Only FC'), storage);

    const result = deleteManagedWorkspace(only.summary.id, storage);

    expect(result.activeWorkspaceId).toBeNull();
    expect(result.workspaces).toEqual([]);
    expect(storage.getItem(STORAGE_KEYS.teamInfo)).toBeNull();
    expect(storage.getItem(STORAGE_KEYS.onboarded)).toBeNull();
  });

  it('imports a V4 backup as a new team without overwriting the current active team', () => {
    const storage = new MemoryStorage();
    const active = createManagedWorkspace(team('Active FC'), coach('Active FC'), storage);
    const backup = createWorkspaceBackup(core(team('Imported FC')), new MemoryStorage(), '2026-06-28T00:00:00.000Z');

    const imported = importBackupAsManagedWorkspace(backup, storage, '2026-06-28T01:00:00.000Z');

    expect(imported.summary.name).toBe('Imported FC');
    expect(getActiveWorkspaceId(storage)).toBe(active.summary.id);
    expect(JSON.parse(storage.getItem(STORAGE_KEYS.teamInfo)!).name).toBe('Active FC');
    expect(imported.workspaces.map(workspace => workspace.name)).toEqual(['Active FC', 'Imported FC']);
  });
});
