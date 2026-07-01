import type { CloudImportDeviceContext, CloudImportResult } from './importer';
import type { CloudSyncRepository } from './dataAccess';
import {
  createCloudMigrationPackage,
  getCloudMigrationActivationDecision,
  restoreCloudMigrationRollback,
  verifyCloudMigrationPackage,
  type CloudMigrationCounts
} from '../migrations/localToCloud';
import type { CoreWorkspace, WorkspaceBackupV4 } from '../persistence/backup';
import type { StorageLike } from '../persistence/storage';

export interface CloudBackupFlowInput {
  core: CoreWorkspace;
  storage: StorageLike;
  sync: Pick<CloudSyncRepository, 'importPayload'>;
  importId: string;
  sourceDeviceId: string;
  targetClubId: string;
  appVersion: string;
  device: CloudImportDeviceContext;
  exportedAt?: string;
}

export interface CloudBackupFlowResult {
  state: 'complete';
  backup: WorkspaceBackupV4;
  importResult: CloudImportResult;
  counts: CloudMigrationCounts;
  backedUpAt: string;
}

export const runCloudBackupFlow = async ({
  core,
  storage,
  sync,
  importId,
  sourceDeviceId,
  targetClubId,
  appVersion,
  device,
  exportedAt
}: CloudBackupFlowInput): Promise<CloudBackupFlowResult> => {
  const migration = createCloudMigrationPackage(core, storage, {
    importId,
    sourceDeviceId,
    targetClubId,
    appVersion,
    exportedAt
  });

  const verification = verifyCloudMigrationPackage(migration);
  const activation = getCloudMigrationActivationDecision(verification);
  if (!activation.canActivate) {
    throw new Error(activation.reason ?? 'Cloud backup verification failed.');
  }

  try {
    const importResult = await sync.importPayload(migration.payload, device);
    return {
      state: 'complete',
      backup: migration.backup,
      importResult,
      counts: migration.manifest.counts,
      backedUpAt: new Date().toISOString()
    };
  } catch (error) {
    restoreCloudMigrationRollback(migration, storage);
    throw error;
  }
};
