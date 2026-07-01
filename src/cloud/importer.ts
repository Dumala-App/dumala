import type { DumalaSupabaseClient } from './client';
import type { Database, Json } from './database.types';
import type { CloudImportPayload, CloudImportRecord } from '../migrations/localToCloud';
import { createContentFingerprint, toCloudUuid } from '../migrations/localToCloud';

type ImportTable = ReturnType<DumalaSupabaseClient['from']>;
type WorkspaceImportUpdate = Database['public']['Tables']['workspace_imports']['Update'];
type ClubMembershipInsert = Database['public']['Tables']['club_memberships']['Insert'];
type NaturalKeyTable = keyof typeof NATURAL_ACTIVE_KEYS;

export interface CloudImportDeviceContext {
  label?: string;
  appVersion: string;
}

export interface CloudImportResult {
  state: 'complete';
  importId: string;
  cloudImportId: string;
  clubId: string;
  deviceId: string;
  uploadedTables: Array<{
    table: string;
    count: number;
  }>;
}

export class CloudImportError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'CloudImportError';
  }
}

const IMPORT_ORDER = [
  'clubs',
  'players',
  'staff_members',
  'games',
  'match_results',
  'match_scorer_contributions',
  'mvp_awards',
  'player_offenses',
  'standings_rows',
  'standings_snapshots',
  'bulletins',
  'assessment_sessions',
  'assessment_development_plan_weeks',
  'payment_ledger_entries',
  'player_availability',
  'coach_notes',
  'weekly_training_schedules',
  'tactics_workspaces',
  'tactics_lineup_assignments',
  'tactics_draw_paths',
  'tactics_notes',
  'tactics_player_extras'
] as const;

const NATURAL_ACTIVE_KEYS = {
  match_results: ['game_id'],
  standings_rows: ['team_name'],
  assessment_development_plan_weeks: ['assessment_session_id', 'week_number'],
  player_availability: ['event_id', 'player_id'],
  tactics_lineup_assignments: ['tactics_workspace_id', 'slot_id'],
  tactics_player_extras: ['player_id']
} as const;

const getErrorMessage = (error: unknown) => {
  if (!error) return 'Unknown Supabase error.';
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message);
  return String(error);
};

const expectMutation = async (
  mutation: PromiseLike<{ error: unknown }>,
  code: string,
  message: string
) => {
  const { error } = await mutation;
  if (error) throw new CloudImportError(`${message}: ${getErrorMessage(error)}`, code, error);
};

const recordsFor = (payload: CloudImportPayload, table: string) =>
  payload.records.filter(record => record.table === table);

const withoutUndefined = (value: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));

const buildClubRow = (record: CloudImportRecord, userId: string) => {
  const { source_team_info: _sourceTeamInfo, ...data } = record.data;
  return withoutUndefined({
    ...data,
    owner_user_id: userId
  });
};

const buildDomainRow = (record: CloudImportRecord, userId: string, deviceId: string) =>
  withoutUndefined({
    ...record.data,
    created_by: userId,
    updated_by: userId,
    origin_device_id: deviceId
  });

const isNaturalKeyTable = (table: string): table is NaturalKeyTable =>
  table in NATURAL_ACTIVE_KEYS;

const naturalKeyFor = (row: Record<string, unknown>, columns: readonly string[]) =>
  columns.map(column => String(row[column] ?? '')).join('\u001f');

const removeExistingNaturalKeyRows = async (
  client: DumalaSupabaseClient,
  table: NaturalKeyTable,
  rows: Record<string, unknown>[]
) => {
  if (rows.length === 0) return rows;

  const clubId = rows[0].club_id;
  if (typeof clubId !== 'string') return rows;

  const keyColumns = NATURAL_ACTIVE_KEYS[table];
  let query = client
    .from(table)
    .select(keyColumns.join(','))
    .eq('club_id', clubId)
    .is('deleted_at', null);

  if (table === 'match_results') {
    query = query.is('reversed_at', null);
  }

  const { data, error } = await query;
  if (error) {
    throw new CloudImportError(
      `Failed to read existing ${table} rows: ${getErrorMessage(error)}`,
      `${table.toUpperCase()}_NATURAL_KEY_READ_FAILED`,
      error
    );
  }

  const existingRows = Array.isArray(data) ? data as unknown as Record<string, unknown>[] : [];
  const existingKeys = new Set(existingRows.map(row => naturalKeyFor(row, keyColumns)));

  return rows.filter(row => !existingKeys.has(naturalKeyFor(row, keyColumns)));
};

const upsertRows = async (
  table: ImportTable,
  rows: Record<string, unknown>[],
  code: string,
  onConflict = 'id'
) => {
  if (rows.length === 0) return;
  await expectMutation(
    table.upsert(rows as Array<Record<string, Json | undefined>>, { onConflict }),
    code,
    `Failed to upsert ${rows.length} row(s)`
  );
};

const insertRows = async (
  table: ImportTable,
  rows: Record<string, unknown>[],
  code: string
) => {
  if (rows.length === 0) return;
  await expectMutation(
    table.insert(rows as Array<Record<string, Json | undefined>>),
    code,
    `Failed to insert ${rows.length} row(s)`
  );
};

const ensureOwnerMembership = async (
  client: DumalaSupabaseClient,
  clubId: string,
  userId: string
) => {
  const { data, error } = await client
    .from('club_memberships')
    .select('id')
    .eq('club_id', clubId)
    .eq('user_id', userId)
    .eq('role', 'owner')
    .eq('membership_state', 'active')
    .maybeSingle();

  if (error) {
    throw new CloudImportError(
      `Failed to read owner membership: ${getErrorMessage(error)}`,
      'OWNER_MEMBERSHIP_READ_FAILED',
      error
    );
  }

  if (data) return;

  const ownerMembership: ClubMembershipInsert = {
    club_id: clubId,
    user_id: userId,
    role: 'owner',
    membership_state: 'active'
  };

  await expectMutation(
    client.from('club_memberships').insert(ownerMembership),
    'OWNER_MEMBERSHIP_INSERT_FAILED',
    'Failed to create owner membership'
  );
};

const updateWorkspaceImportStatus = async (
  client: DumalaSupabaseClient,
  cloudImportId: string,
  values: WorkspaceImportUpdate
) => {
  await expectMutation(
    client.from('workspace_imports').update(values).eq('id', cloudImportId),
    'WORKSPACE_IMPORT_STATUS_UPDATE_FAILED',
    'Failed to update workspace import status'
  );
};

export const importCloudPayload = async (
  client: DumalaSupabaseClient,
  payload: CloudImportPayload,
  device: CloudImportDeviceContext
): Promise<CloudImportResult> => {
  const { data, error } = await client.auth.getUser();
  if (error) {
    throw new CloudImportError(`Failed to read Supabase user: ${getErrorMessage(error)}`, 'AUTH_USER_LOOKUP_FAILED', error);
  }

  const userId = data.user?.id;
  if (!userId) {
    throw new CloudImportError('Cloud import requires a signed-in Supabase user.', 'AUTH_USER_REQUIRED');
  }

  const deviceId = toCloudUuid(payload.importId, 'devices', payload.manifest.sourceDeviceId);
  const cloudImportId = toCloudUuid(payload.importId, 'workspace_imports', payload.importId);
  const uploadedTables: CloudImportResult['uploadedTables'] = [];

  const clubRecords = recordsFor(payload, 'clubs');
  if (clubRecords.length !== 1) {
    throw new CloudImportError('Cloud import payload must contain exactly one club record.', 'INVALID_CLUB_RECORD_COUNT');
  }

  await upsertRows(client.from('clubs'), [buildClubRow(clubRecords[0], userId)], 'CLUB_UPSERT_FAILED');
  uploadedTables.push({ table: 'clubs', count: 1 });

  await ensureOwnerMembership(client, payload.clubId, userId);

  await upsertRows(client.from('devices'), [withoutUndefined({
    id: deviceId,
    user_id: userId,
    label: device.label,
    app_version: device.appVersion,
    last_seen_at: new Date().toISOString()
  })], 'DEVICE_UPSERT_FAILED');

  await upsertRows(client.from('workspace_imports'), [withoutUndefined({
    id: cloudImportId,
    club_id: payload.clubId,
    user_id: userId,
    device_id: deviceId,
    source_backup_version: String(payload.manifest.sourceVersion),
    manifest_hash: createContentFingerprint(payload.manifest),
    record_counts: payload.manifest.counts,
    status: 'started'
  })], 'WORKSPACE_IMPORT_UPSERT_FAILED');

  try {
    for (const table of IMPORT_ORDER) {
      if (table === 'clubs') continue;
      const tableRecords = recordsFor(payload, table);
      const rows = tableRecords.map(record => buildDomainRow(record, userId, deviceId));
      const rowsToWrite = isNaturalKeyTable(table)
        ? await removeExistingNaturalKeyRows(client, table, rows)
        : rows;
      if (table === 'bulletins') {
        await insertRows(client.from(table), rowsToWrite, 'BULLETINS_INSERT_FAILED');
      } else {
        await upsertRows(client.from(table), rowsToWrite, `${table.toUpperCase()}_UPSERT_FAILED`);
      }
      if (rowsToWrite.length > 0) uploadedTables.push({ table, count: rowsToWrite.length });
    }

    await updateWorkspaceImportStatus(client, cloudImportId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      failure_code: null
    });
  } catch (error) {
    await updateWorkspaceImportStatus(client, cloudImportId, {
      status: 'failed',
      failed_at: new Date().toISOString(),
      failure_code: error instanceof CloudImportError ? error.code : 'UNKNOWN_IMPORT_FAILURE'
    });
    throw error;
  }

  return {
    state: 'complete',
    importId: payload.importId,
    cloudImportId,
    clubId: payload.clubId,
    deviceId,
    uploadedTables
  };
};
