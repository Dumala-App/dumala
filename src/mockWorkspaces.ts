import type { WorkspaceBackupV4 } from './persistence/backup';

const mockWorkspaceModules = import.meta.glob<WorkspaceBackupV4>('../mock/*.json', {
  eager: true,
  import: 'default'
});

const fileLabel = (path: string) =>
  path.split('/').pop()?.replace(/\.json$/i, '').replace(/[-_]+/g, ' ') ?? 'workspace';

export const MOCK_WORKSPACE_CHOICES = Object.entries(mockWorkspaceModules)
  .map(([path, backup]) => ({
    id: path,
    fileName: path.split('/').pop() ?? 'workspace.json',
    label: backup.core?.teamInfo?.name || fileLabel(path),
    detail: `${backup.core?.players?.length ?? 0} players · ${backup.core?.games?.length ?? 0} games · ${backup.core?.assessments?.length ?? 0} FPRDS`,
    backup
  }))
  .sort((a, b) => a.label.localeCompare(b.label));
