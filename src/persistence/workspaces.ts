import { z } from 'zod';
import type { StaffMember, TeamInfo } from '../types';
import { teamInfoSchema } from './schemas';
import {
  CORE_DUMALA_KEYS,
  getWorkspaceStorageKey,
  MANAGED_WORKSPACE_KEYS,
  readJsonStorage,
  STORAGE_KEYS,
  type StorageLike
} from './storage';
import {
  applyWorkspaceBackup,
  collectFeatureState,
  createWorkspaceBackup,
  parseWorkspaceBackup,
  summarizeBackup,
  type BackupRestoreSummary,
  type CoreWorkspace,
  type WorkspaceBackupV4
} from './backup';

export interface WorkspaceSummary {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  logoUrl?: string;
  cloudClubId?: string;
}

const workspaceSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  logoUrl: z.string().optional(),
  cloudClubId: z.string().optional()
});

const workspaceIndexSchema = z.array(workspaceSummarySchema);

const browserStorage = (): StorageLike => window.localStorage;

const createWorkspaceId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `workspace-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const readWorkspaceSummaries = (
  storage: StorageLike = browserStorage()
): WorkspaceSummary[] => {
  const raw = storage.getItem(MANAGED_WORKSPACE_KEYS.index);
  if (!raw) return [];

  try {
    const parsed = workspaceIndexSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
};

export const writeWorkspaceSummaries = (
  summaries: WorkspaceSummary[],
  storage: StorageLike = browserStorage()
) => {
  storage.setItem(MANAGED_WORKSPACE_KEYS.index, JSON.stringify(workspaceIndexSchema.parse(summaries)));
};

export const getActiveWorkspaceId = (storage: StorageLike = browserStorage()) =>
  storage.getItem(MANAGED_WORKSPACE_KEYS.activeWorkspaceId)?.trim() || null;

export const setActiveWorkspaceId = (
  workspaceId: string | null,
  storage: StorageLike = browserStorage()
) => {
  if (workspaceId) storage.setItem(MANAGED_WORKSPACE_KEYS.activeWorkspaceId, workspaceId);
  else storage.removeItem(MANAGED_WORKSPACE_KEYS.activeWorkspaceId);
};

const readStoredTeamInfo = (storage: StorageLike): TeamInfo | null => {
  const raw = storage.getItem(STORAGE_KEYS.teamInfo);
  if (!raw) return null;
  try {
    const parsed = teamInfoSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

const readStoredWorkspaceTeamInfo = (
  workspaceId: string,
  storage: StorageLike
): TeamInfo | null => {
  const raw = storage.getItem(getWorkspaceStorageKey(workspaceId, STORAGE_KEYS.teamInfo));
  if (!raw) return null;
  try {
    const parsed = teamInfoSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

const hasLegacyWorkspaceData = (storage: StorageLike) =>
  Boolean(
    storage.getItem(STORAGE_KEYS.onboarded) === 'true' ||
    storage.getItem(STORAGE_KEYS.teamInfo) ||
    storage.getItem(STORAGE_KEYS.players) ||
    storage.getItem(STORAGE_KEYS.staff)
  );

export const copyActiveKeysToWorkspace = (
  workspaceId: string,
  storage: StorageLike = browserStorage()
) => {
  CORE_DUMALA_KEYS.forEach(key => {
    const value = storage.getItem(key);
    const namespacedKey = getWorkspaceStorageKey(workspaceId, key);
    if (value === null) storage.removeItem(namespacedKey);
    else storage.setItem(namespacedKey, value);
  });
};

export const copyWorkspaceToActiveKeys = (
  workspaceId: string,
  storage: StorageLike = browserStorage()
) => {
  CORE_DUMALA_KEYS.forEach(key => {
    const value = storage.getItem(getWorkspaceStorageKey(workspaceId, key));
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, value);
  });
};

export const createWorkspaceSummary = (
  teamInfo: TeamInfo,
  now = new Date().toISOString(),
  id = createWorkspaceId()
): WorkspaceSummary => ({
  id,
  name: teamInfo.name.trim(),
  logoUrl: teamInfo.logoUrl,
  createdAt: now,
  updatedAt: now
});

export const bootstrapManagedWorkspaces = (
  storage: StorageLike = browserStorage(),
  now = new Date().toISOString()
): { workspaces: WorkspaceSummary[]; activeWorkspaceId: string | null } => {
  let workspaces = readWorkspaceSummaries(storage);
  let activeWorkspaceId = getActiveWorkspaceId(storage);

  if (workspaces.length === 0 && hasLegacyWorkspaceData(storage)) {
    const teamInfo = readStoredTeamInfo(storage);
    if (teamInfo) {
      const summary = createWorkspaceSummary(teamInfo, now);
      workspaces = [summary];
      activeWorkspaceId = summary.id;
      writeWorkspaceSummaries(workspaces, storage);
      setActiveWorkspaceId(activeWorkspaceId, storage);
      copyActiveKeysToWorkspace(summary.id, storage);
      return { workspaces, activeWorkspaceId };
    }
  }

  if (workspaces.length > 0) {
    if (!activeWorkspaceId || !workspaces.some(workspace => workspace.id === activeWorkspaceId)) {
      activeWorkspaceId = workspaces[0].id;
      setActiveWorkspaceId(activeWorkspaceId, storage);
    }
    copyWorkspaceToActiveKeys(activeWorkspaceId, storage);
  } else {
    activeWorkspaceId = null;
    setActiveWorkspaceId(null, storage);
  }

  return { workspaces, activeWorkspaceId };
};

export const touchWorkspaceSummary = (
  workspaceId: string,
  updates: Partial<Pick<WorkspaceSummary, 'name' | 'logoUrl' | 'cloudClubId'>>,
  storage: StorageLike = browserStorage(),
  now = new Date().toISOString()
): WorkspaceSummary[] => {
  const next = readWorkspaceSummaries(storage).map(workspace => (
    workspace.id === workspaceId
      ? {
          ...workspace,
          ...updates,
          name: updates.name?.trim() || workspace.name,
          updatedAt: now
        }
      : workspace
  ));
  writeWorkspaceSummaries(next, storage);
  return next;
};

export const renameManagedWorkspace = (
  workspaceId: string,
  name: string,
  storage: StorageLike = browserStorage(),
  now = new Date().toISOString()
): WorkspaceSummary[] => {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('Team name is required.');

  const teamInfoKey = getWorkspaceStorageKey(workspaceId, STORAGE_KEYS.teamInfo);
  const rawTeamInfo = storage.getItem(teamInfoKey);
  if (rawTeamInfo) {
    try {
      const parsed = teamInfoSchema.safeParse(JSON.parse(rawTeamInfo));
      if (parsed.success) {
        storage.setItem(teamInfoKey, JSON.stringify({ ...parsed.data, name: trimmedName }));
      }
    } catch {
      // The startup recovery path will catch malformed team info if this workspace is opened.
    }
  }

  if (getActiveWorkspaceId(storage) === workspaceId) {
    const activeTeamInfo = readStoredTeamInfo(storage);
    if (activeTeamInfo) {
      storage.setItem(STORAGE_KEYS.teamInfo, JSON.stringify({ ...activeTeamInfo, name: trimmedName }));
    }
  }

  return touchWorkspaceSummary(workspaceId, { name: trimmedName }, storage, now);
};

export const createManagedWorkspace = (
  teamInfo: TeamInfo,
  headCoach: StaffMember,
  storage: StorageLike = browserStorage(),
  now = new Date().toISOString()
) => {
  const summary = createWorkspaceSummary(teamInfo, now);
  const current = readWorkspaceSummaries(storage);
  writeWorkspaceSummaries([...current, summary], storage);
  setActiveWorkspaceId(summary.id, storage);

  CORE_DUMALA_KEYS.forEach(key => storage.removeItem(key));
  storage.setItem(STORAGE_KEYS.onboarded, 'true');
  storage.setItem(STORAGE_KEYS.teamInfo, JSON.stringify(teamInfo));
  storage.setItem(STORAGE_KEYS.players, JSON.stringify([]));
  storage.setItem(STORAGE_KEYS.staff, JSON.stringify([headCoach]));
  storage.setItem(STORAGE_KEYS.games, JSON.stringify([]));
  storage.setItem(STORAGE_KEYS.standings, JSON.stringify([]));
  storage.setItem(STORAGE_KEYS.announcements, JSON.stringify([]));
  storage.setItem(STORAGE_KEYS.assessments, JSON.stringify([]));
  storage.setItem(STORAGE_KEYS.paymentLedger, JSON.stringify([]));
  copyActiveKeysToWorkspace(summary.id, storage);

  return {
    summary,
    workspaces: readWorkspaceSummaries(storage)
  };
};

export const switchManagedWorkspace = (
  nextWorkspaceId: string,
  currentWorkspaceId: string | null = getActiveWorkspaceId(),
  storage: StorageLike = browserStorage()
) => {
  const workspaces = readWorkspaceSummaries(storage);
  if (!workspaces.some(workspace => workspace.id === nextWorkspaceId)) {
    throw new Error('The selected team workspace could not be found.');
  }

  if (currentWorkspaceId) copyActiveKeysToWorkspace(currentWorkspaceId, storage);
  setActiveWorkspaceId(nextWorkspaceId, storage);
  copyWorkspaceToActiveKeys(nextWorkspaceId, storage);
};

export const deleteManagedWorkspace = (
  workspaceId: string,
  storage: StorageLike = browserStorage()
) => {
  const current = readWorkspaceSummaries(storage);
  const next = current.filter(workspace => workspace.id !== workspaceId);
  CORE_DUMALA_KEYS.forEach(key => storage.removeItem(getWorkspaceStorageKey(workspaceId, key)));
  writeWorkspaceSummaries(next, storage);

  const activeId = getActiveWorkspaceId(storage);
  if (activeId !== workspaceId) {
    return { workspaces: next, activeWorkspaceId: activeId };
  }

  const nextActiveId = next[0]?.id ?? null;
  setActiveWorkspaceId(nextActiveId, storage);
  if (nextActiveId) copyWorkspaceToActiveKeys(nextActiveId, storage);
  else CORE_DUMALA_KEYS.forEach(key => storage.removeItem(key));

  return { workspaces: next, activeWorkspaceId: nextActiveId };
};

export const resetManagedWorkspace = (
  workspaceId: string,
  storage: StorageLike = browserStorage(),
  now = new Date().toISOString()
) => {
  const workspace = readWorkspaceSummaries(storage).find(summary => summary.id === workspaceId);
  if (!workspace) throw new Error('The selected team workspace could not be found.');

  const activeTeamInfo = getActiveWorkspaceId(storage) === workspaceId
    ? readStoredTeamInfo(storage)
    : null;
  const workspaceTeamInfo = readStoredWorkspaceTeamInfo(workspaceId, storage);
  const teamInfo = activeTeamInfo ?? workspaceTeamInfo;
  if (!teamInfo) throw new Error('Team information is required before resetting the workspace.');

  CORE_DUMALA_KEYS.forEach(key => {
    storage.removeItem(key);
    storage.removeItem(getWorkspaceStorageKey(workspaceId, key));
  });

  setActiveWorkspaceId(workspaceId, storage);
  storage.setItem(STORAGE_KEYS.onboarded, 'true');
  storage.setItem(STORAGE_KEYS.teamInfo, JSON.stringify(teamInfo));
  storage.setItem(STORAGE_KEYS.players, JSON.stringify([]));
  storage.setItem(STORAGE_KEYS.staff, JSON.stringify([]));
  storage.setItem(STORAGE_KEYS.games, JSON.stringify([]));
  storage.setItem(STORAGE_KEYS.standings, JSON.stringify([]));
  storage.setItem(STORAGE_KEYS.announcements, JSON.stringify([]));
  storage.setItem(STORAGE_KEYS.assessments, JSON.stringify([]));
  storage.setItem(STORAGE_KEYS.paymentLedger, JSON.stringify([]));
  copyActiveKeysToWorkspace(workspaceId, storage);

  return touchWorkspaceSummary(workspaceId, {
    name: teamInfo.name,
    logoUrl: teamInfo.logoUrl,
    cloudClubId: workspace.cloudClubId
  }, storage, now);
};

export const createBackupFromActiveWorkspace = (
  core: CoreWorkspace,
  storage: StorageLike = browserStorage()
): WorkspaceBackupV4 => createWorkspaceBackup(core, storage);

export const restoreBackupIntoActiveWorkspace = (
  backup: WorkspaceBackupV4,
  workspaceId: string,
  storage: StorageLike = browserStorage()
) => {
  applyWorkspaceBackup(backup, storage);
  copyActiveKeysToWorkspace(workspaceId, storage);
  return touchWorkspaceSummary(workspaceId, {
    name: backup.core.teamInfo.name,
    logoUrl: backup.core.teamInfo.logoUrl
  }, storage);
};

export const importBackupAsManagedWorkspace = (
  input: unknown,
  storage: StorageLike = browserStorage(),
  now = new Date().toISOString()
): { summary: WorkspaceSummary; workspaces: WorkspaceSummary[]; restoreSummary: BackupRestoreSummary } => {
  const { backup, sourceVersion } = parseWorkspaceBackup(input, collectFeatureState(storage));
  const summary = createWorkspaceSummary(backup.core.teamInfo, now);
  const previousActiveId = getActiveWorkspaceId(storage);
  const workspaces = [...readWorkspaceSummaries(storage), summary];
  writeWorkspaceSummaries(workspaces, storage);
  setActiveWorkspaceId(summary.id, storage);
  applyWorkspaceBackup(backup, storage);
  copyActiveKeysToWorkspace(summary.id, storage);
  if (previousActiveId) {
    setActiveWorkspaceId(previousActiveId, storage);
    copyWorkspaceToActiveKeys(previousActiveId, storage);
  }

  return {
    summary,
    workspaces: readWorkspaceSummaries(storage),
    restoreSummary: summarizeBackup(backup, sourceVersion)
  };
};

export const readActiveTeamInfo = (
  storage: StorageLike = browserStorage()
) => readJsonStorage(STORAGE_KEYS.teamInfo, teamInfoSchema.nullable(), null, 'Team information', storage);
