import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const recordPath = join(process.cwd(), 'docs', 'PHASE_3_PRODUCTION_APPROVAL_RECORD.json');
const record = JSON.parse(readFileSync(recordPath, 'utf8'));
const failures = [];

const requireValue = (path, value) => {
  if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
    failures.push(`${path} is required.`);
  }
};

const requireTrue = (path, value) => {
  if (value !== true) failures.push(`${path} must be true.`);
};

const requirePositiveNumber = (path, value) => {
  if (typeof value !== 'number' || value <= 0) failures.push(`${path} must be a positive number.`);
};

const requireNonNegativeNumber = (path, value) => {
  if (typeof value !== 'number' || value < 0) failures.push(`${path} must be a non-negative number.`);
};

if (record.status !== 'approved') {
  failures.push('status must be approved.');
}

for (const environment of ['staging', 'production']) {
  const item = record.environments?.[environment] ?? {};
  const stagingWaived = environment === 'staging' && item.waived === true;
  if (!stagingWaived) {
    requireValue(`environments.${environment}.supabaseProjectRef`, item.supabaseProjectRef);
    requireValue(`environments.${environment}.region`, item.region);
    requireValue(`environments.${environment}.apiUrl`, item.apiUrl);
    requireValue(`environments.${environment}.allowedRedirectUrls`, item.allowedRedirectUrls);
  } else {
    requireValue('environments.staging.waiverReason', item.waiverReason);
  }
  requireTrue(`environments.${environment}.approved`, item.approved);
  requireValue(`environments.${environment}.approvedBy`, item.approvedBy);
  requireValue(`environments.${environment}.approvedAt`, item.approvedAt);
}

for (const [name, item] of Object.entries(record.accessControls ?? {})) {
  requireValue(`accessControls.${name}.peopleOrTeams`, item.peopleOrTeams);
  requireTrue(`accessControls.${name}.approved`, item.approved);
  requireValue(`accessControls.${name}.approvedBy`, item.approvedBy);
  requireValue(`accessControls.${name}.approvedAt`, item.approvedAt);
}

const backups = record.providerBackups ?? {};
requireValue('providerBackups.supabasePlan', backups.supabasePlan);
if (backups.supabasePlan === 'Free') {
  requireNonNegativeNumber('providerBackups.dailyBackupRetentionDays', backups.dailyBackupRetentionDays);
  if (backups.dailyBackupRetentionDays !== 0) {
    failures.push('providerBackups.dailyBackupRetentionDays must be 0 for the Free plan unless provider settings are upgraded.');
  }
} else {
  requirePositiveNumber('providerBackups.dailyBackupRetentionDays', backups.dailyBackupRetentionDays);
}
if (typeof backups.pitrEnabled !== 'boolean') failures.push('providerBackups.pitrEnabled must be boolean.');
if (backups.pitrEnabled) requirePositiveNumber('providerBackups.pitrRetentionDays', backups.pitrRetentionDays);
if (backups.supabasePlan === 'Free' && backups.pitrEnabled) {
  failures.push('providerBackups.pitrEnabled must be false for the Free plan.');
}
requireValue('providerBackups.logicalExportCadence', backups.logicalExportCadence);
requireValue('providerBackups.logicalExportStorageLocation', backups.logicalExportStorageLocation);
if (typeof backups.objectStorageBackupNeeded !== 'boolean') failures.push('providerBackups.objectStorageBackupNeeded must be boolean.');
requireTrue('providerBackups.approved', backups.approved);
requireValue('providerBackups.approvedBy', backups.approvedBy);
requireValue('providerBackups.approvedAt', backups.approvedAt);

const restore = record.restoreDrill ?? {};
for (const field of ['sourceBackupTimestamp', 'restoreEnvironment', 'operator', 'startedAt', 'completedAt']) {
  requireValue(`restoreDrill.${field}`, restore[field]);
}
for (const field of [
  'schemaMigrationValidationPassed',
  'rlsIsolationTestsPassed',
  'sampleClubCountsPassed',
  'domainIntegrityPassed',
  'syncCursorIntegrityPassed',
  'exportGenerationPassed',
  'approved'
]) {
  requireTrue(`restoreDrill.${field}`, restore[field]);
}
requireValue('restoreDrill.approvedBy', restore.approvedBy);
requireValue('restoreDrill.approvedAt', restore.approvedAt);

const privacy = record.privacyReview ?? {};
for (const field of [
  'minorPlayerDataApproved',
  'staffContactFieldsApproved',
  'paymentLedgerExportWordingApproved',
  'assessmentExportWordingApproved',
  'supportAccessBoundariesApproved',
  'accountDeletionCopyApproved',
  'approved'
]) {
  requireTrue(`privacyReview.${field}`, privacy[field]);
}
requirePositiveNumber('privacyReview.clubDeletionRecoveryWindowDays', privacy.clubDeletionRecoveryWindowDays);
requirePositiveNumber('privacyReview.accountDeletionRecoveryWindowDays', privacy.accountDeletionRecoveryWindowDays);
requirePositiveNumber('privacyReview.auditRetentionDays', privacy.auditRetentionDays);
requireValue('privacyReview.approvedBy', privacy.approvedBy);
requireValue('privacyReview.approvedAt', privacy.approvedAt);

const diagnostics = record.diagnosticBoundary ?? {};
requireValue('diagnosticBoundary.approvedFields', diagnostics.approvedFields);
requireTrue('diagnosticBoundary.forbiddenFieldsReviewed', diagnostics.forbiddenFieldsReviewed);
requireTrue('diagnosticBoundary.approved', diagnostics.approved);
requireValue('diagnosticBoundary.approvedBy', diagnostics.approvedBy);
requireValue('diagnosticBoundary.approvedAt', diagnostics.approvedAt);

const incident = record.incidentAndKeyRotation ?? {};
for (const field of ['incidentOwner', 'backupOwner', 'privacyOwner', 'keyRotationOwner']) {
  requireValue(`incidentAndKeyRotation.${field}`, incident[field]);
}
for (const field of [
  'serviceRoleRotationApproved',
  'jwtSecretRotationApproved',
  'databasePasswordRotationApproved',
  'supabaseAccessTokenRotationApproved',
  'approved'
]) {
  requireTrue(`incidentAndKeyRotation.${field}`, incident[field]);
}
requireValue('incidentAndKeyRotation.approvedBy', incident.approvedBy);
requireValue('incidentAndKeyRotation.approvedAt', incident.approvedAt);

const finalApproval = record.finalApproval ?? {};
requireTrue('finalApproval.approved', finalApproval.approved);
requireValue('finalApproval.approvedBy', finalApproval.approvedBy);
requireValue('finalApproval.approvedAt', finalApproval.approvedAt);

if (failures.length > 0) {
  console.error('Production approval verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Production approval verification passed: production cloud data gates are approved.');
