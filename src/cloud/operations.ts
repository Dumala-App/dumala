export type OperationalMetricArea =
  | 'auth'
  | 'migration'
  | 'sync'
  | 'conflict'
  | 'api'
  | 'database'
  | 'authorization'
  | 'export'
  | 'deletion'
  | 'client'
  | 'backup';

export interface OperationalMetricDefinition {
  id: string;
  area: OperationalMetricArea;
  description: string;
  allowedLabels: string[];
}

export interface DiagnosticSnapshotInput {
  appVersion: string;
  cloudEnabled: boolean;
  sync?: {
    state: string;
    pendingMutations: Record<string, number>;
    unresolvedConflicts: Record<string, number>;
    oldestPendingMutationAgeMs?: number;
    lastPullCursor?: string;
  };
  storage?: {
    usage?: number;
    quota?: number;
    usageRatio?: number;
  };
  migration?: {
    state: string;
    lastErrorCode?: string;
  };
  recentErrorCodes?: string[];
  browser?: {
    family?: string;
    platformClass?: string;
  };
}

export interface DiagnosticSnapshot {
  format: 'dumala-redacted-diagnostics';
  version: 1;
  exportedAt: string;
  appVersion: string;
  cloudEnabled: boolean;
  browser?: {
    family?: string;
    platformClass?: string;
  };
  sync?: DiagnosticSnapshotInput['sync'];
  storage?: DiagnosticSnapshotInput['storage'];
  migration?: DiagnosticSnapshotInput['migration'];
  recentErrorCodes: string[];
}

export interface RestoreDrillEvidence {
  sourceBackupTimestamp?: string;
  restoreEnvironment?: string;
  operator?: string;
  startedAt?: string;
  completedAt?: string;
  checks: Partial<Record<RestoreDrillCheckId, boolean>>;
  issues?: string[];
}

export type RestoreDrillCheckId =
  | 'schema_migration_validation'
  | 'rls_isolation_tests'
  | 'sample_club_counts'
  | 'domain_integrity'
  | 'sync_cursor_integrity'
  | 'export_generation';

export interface RestoreDrillReport {
  status: 'passed' | 'failed';
  missingChecks: RestoreDrillCheckId[];
  issues: string[];
}

export type ProductionGateId =
  | 'environment_separation'
  | 'production_env_access_control'
  | 'rls_policy_tests'
  | 'migration_verification_tests'
  | 'offline_sync_failure_tests'
  | 'export_deletion_tests'
  | 'audit_redaction_tests'
  | 'provider_backup_settings_confirmed'
  | 'restore_drill_passed'
  | 'privacy_review_approved'
  | 'diagnostic_boundaries_approved'
  | 'incident_response_runbooks';

export interface ProductionGateStatus {
  id: ProductionGateId;
  passed: boolean;
  notes?: string;
}

export interface ProductionLaunchReadiness {
  ready: boolean;
  blockedBy: ProductionGateId[];
}

export const OPERATIONAL_METRICS: OperationalMetricDefinition[] = [
  { id: 'auth.otp_requested', area: 'auth', description: 'OTP or magic-link request count.', allowedLabels: ['environment'] },
  { id: 'auth.sign_in_success_rate', area: 'auth', description: 'Successful sign-in ratio.', allowedLabels: ['environment'] },
  { id: 'migration.completed', area: 'migration', description: 'Completed local-to-cloud migrations.', allowedLabels: ['environment', 'schemaVersion'] },
  { id: 'migration.failed', area: 'migration', description: 'Failed local-to-cloud migrations by stable code.', allowedLabels: ['environment', 'failureCode'] },
  { id: 'sync.push_success_rate', area: 'sync', description: 'Mutation push success ratio.', allowedLabels: ['environment'] },
  { id: 'sync.oldest_queued_mutation_age', area: 'sync', description: 'Age of the oldest pending local mutation.', allowedLabels: ['environment'] },
  { id: 'conflict.count', area: 'conflict', description: 'Conflict count by entity and conflict type.', allowedLabels: ['environment', 'entityTable', 'conflictType'] },
  { id: 'api.error_rate', area: 'api', description: 'Client-visible cloud API error ratio.', allowedLabels: ['environment', 'errorClass'] },
  { id: 'database.constraint_failed', area: 'database', description: 'Database constraint failures by stable code.', allowedLabels: ['environment', 'constraintClass'] },
  { id: 'authorization.denied', area: 'authorization', description: 'RLS or function authorization denials.', allowedLabels: ['environment', 'action'] },
  { id: 'export.completed', area: 'export', description: 'Completed account or workspace exports.', allowedLabels: ['environment', 'exportType'] },
  { id: 'deletion.requested', area: 'deletion', description: 'Deletion requests by target type.', allowedLabels: ['environment', 'target'] },
  { id: 'client.unhandled_error', area: 'client', description: 'Unhandled client errors by stable code.', allowedLabels: ['environment', 'errorCode'] },
  { id: 'backup.restore_drill_completed', area: 'backup', description: 'Completed restore drills and result.', allowedLabels: ['environment', 'result'] }
];

export const RESTORE_DRILL_CHECKS: RestoreDrillCheckId[] = [
  'schema_migration_validation',
  'rls_isolation_tests',
  'sample_club_counts',
  'domain_integrity',
  'sync_cursor_integrity',
  'export_generation'
];

export const PRODUCTION_GATES: ProductionGateId[] = [
  'environment_separation',
  'production_env_access_control',
  'rls_policy_tests',
  'migration_verification_tests',
  'offline_sync_failure_tests',
  'export_deletion_tests',
  'audit_redaction_tests',
  'provider_backup_settings_confirmed',
  'restore_drill_passed',
  'privacy_review_approved',
  'diagnostic_boundaries_approved',
  'incident_response_runbooks'
];

const SENSITIVE_KEY_PATTERN = /(token|secret|password|otp|magic|link|payload|note|assessment|payment|amount|reference|player|staff|email|phone|name)/i;

export const sanitizeOperationalMetadata = (metadata: Record<string, unknown> = {}) =>
  Object.fromEntries(
    Object.entries(metadata).filter(([key, value]) => {
      if (SENSITIVE_KEY_PATTERN.test(key)) return false;
      return ['string', 'number', 'boolean'].includes(typeof value) || value === null;
    })
  );

export const createDiagnosticSnapshot = (
  input: DiagnosticSnapshotInput,
  exportedAt = new Date().toISOString()
): DiagnosticSnapshot => ({
  format: 'dumala-redacted-diagnostics',
  version: 1,
  exportedAt,
  appVersion: input.appVersion,
  cloudEnabled: input.cloudEnabled,
  browser: input.browser,
  sync: input.sync,
  storage: input.storage,
  migration: input.migration,
  recentErrorCodes: input.recentErrorCodes ?? []
});

export const evaluateRestoreDrill = (evidence: RestoreDrillEvidence): RestoreDrillReport => {
  const missingChecks = RESTORE_DRILL_CHECKS.filter(check => evidence.checks[check] !== true);
  const issues = evidence.issues ?? [];

  if (!evidence.sourceBackupTimestamp) issues.push('Missing source backup timestamp.');
  if (!evidence.restoreEnvironment) issues.push('Missing restore environment.');
  if (!evidence.operator) issues.push('Missing operator.');
  if (!evidence.startedAt || !evidence.completedAt) issues.push('Missing restore drill timing.');

  return {
    status: missingChecks.length === 0 && issues.length === 0 ? 'passed' : 'failed',
    missingChecks,
    issues
  };
};

export const evaluateProductionLaunchReadiness = (
  gates: ProductionGateStatus[]
): ProductionLaunchReadiness => {
  const statusById = new Map(gates.map(gate => [gate.id, gate.passed]));
  const blockedBy = PRODUCTION_GATES.filter(gate => statusById.get(gate) !== true);

  return {
    ready: blockedBy.length === 0,
    blockedBy
  };
};
