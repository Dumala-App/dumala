import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'docs/ADR_PHASE_3_CLOUD_PLATFORM.md',
  'docs/PHASE_3_DURABLE_SCHEMA_DESIGN.md',
  'docs/PHASE_3_LOCAL_TO_CLOUD_MIGRATION.md',
  'docs/PHASE_3_OFFLINE_MUTATION_QUEUE.md',
  'docs/PHASE_3_ACCOUNT_LIFECYCLE.md',
  'docs/PHASE_3_OPERATIONS_MONITORING_BACKUPS.md',
  'docs/PHASE_3_LAUNCH_APPROVAL_RUNBOOK.md',
  'docs/SUPABASE_SETUP.md',
  'supabase/tests/rls_isolation.sql',
  '.env.example'
];

const failures = [];

const read = path => readFileSync(join(root, path), 'utf8');

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) failures.push(`Missing required launch artifact: ${file}`);
}

const envExample = existsSync(join(root, '.env.example')) ? read('.env.example') : '';
const forbiddenEnvNames = [
  'VITE_SUPABASE_SECRET',
  'VITE_SUPABASE_SERVICE_ROLE',
  'VITE_SUPABASE_SERVICE_ROLE_KEY',
  'VITE_SUPABASE_JWT_SECRET',
  'VITE_SUPABASE_DB_URL',
  'VITE_SUPABASE_ACCESS_TOKEN'
];

for (const name of forbiddenEnvNames) {
  if (envExample.includes(name)) {
    failures.push(`Public env example must not expose ${name}.`);
  }
}

for (const requiredName of ['VITE_DUMALA_CLOUD_ENABLED', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY']) {
  if (!envExample.includes(requiredName)) {
    failures.push(`.env.example is missing ${requiredName}.`);
  }
}

const runbook = existsSync(join(root, 'docs/PHASE_3_LAUNCH_APPROVAL_RUNBOOK.md'))
  ? read('docs/PHASE_3_LAUNCH_APPROVAL_RUNBOOK.md')
  : '';

const runbookTerms = [
  'Environment Separation Evidence',
  'Access Control Evidence',
  'RLS Isolation Evidence',
  'Backup Setting Evidence',
  'Restore Drill Evidence Template',
  'Privacy Review Template',
  'Diagnostic Boundary Approval',
  'Incident Response Runbook',
  'Key Rotation Runbook'
];

for (const term of runbookTerms) {
  if (!runbook.includes(term)) failures.push(`Launch runbook is missing section: ${term}`);
}

const setup = existsSync(join(root, 'docs/SUPABASE_SETUP.md')) ? read('docs/SUPABASE_SETUP.md') : '';
for (const command of ['npm run supabase:reset', 'npm run supabase:test', 'npm run verify:cloud-launch']) {
  if (!setup.includes(command) && !runbook.includes(command)) {
    failures.push(`Launch docs should mention ${command}.`);
  }
}

const operations = existsSync(join(root, 'src/cloud/operations.ts')) ? read('src/cloud/operations.ts') : '';
for (const gate of [
  'environment_separation',
  'production_env_access_control',
  'rls_policy_tests',
  'provider_backup_settings_confirmed',
  'restore_drill_passed',
  'privacy_review_approved',
  'diagnostic_boundaries_approved',
  'incident_response_runbooks'
]) {
  if (!operations.includes(gate)) failures.push(`Operations gate missing: ${gate}`);
}

if (!operations.includes('SENSITIVE_KEY_PATTERN')) {
  failures.push('Operations module must define audit/diagnostic redaction rules.');
}

if (failures.length > 0) {
  console.error('Cloud launch readiness verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Cloud launch readiness verification passed: approval artifacts, env boundaries, and operations gates are present.');
