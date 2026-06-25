import type { DumalaSupabaseClient } from './client';

export type ControlledRecordTable =
  | 'players'
  | 'staff_members'
  | 'games'
  | 'match_results'
  | 'match_scorer_contributions'
  | 'mvp_awards'
  | 'player_offenses'
  | 'standings_rows'
  | 'standings_snapshots'
  | 'bulletins'
  | 'assessment_sessions'
  | 'assessment_development_plan_weeks'
  | 'payment_ledger_entries'
  | 'player_availability'
  | 'coach_notes'
  | 'weekly_training_schedules'
  | 'tactics_workspaces'
  | 'tactics_lineup_assignments'
  | 'tactics_draw_paths'
  | 'tactics_notes'
  | 'tactics_player_extras';

export interface ControlledRecordUpdateInput {
  table: ControlledRecordTable;
  id: string;
  expectedVersion: number;
  patch: Record<string, unknown>;
}

export class CloudConcurrencyError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'CloudConcurrencyError';
  }
}

const PROTECTED_PATCH_FIELDS = new Set([
  'id',
  'club_id',
  'created_at',
  'created_by',
  'updated_at',
  'updated_by',
  'version',
  'deleted_at',
  'client_created_at',
  'origin_device_id'
]);

const getErrorMessage = (error: unknown) => {
  if (!error) return 'Unknown Supabase error.';
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message);
  return String(error);
};

const getErrorCode = (error: unknown) => {
  if (error && typeof error === 'object' && 'code' in error) return String((error as { code: unknown }).code);
  return undefined;
};

export const isVersionConflictError = (error: unknown): boolean =>
  error instanceof CloudConcurrencyError
    ? error.code === 'VERSION_CONFLICT'
    : getErrorCode(error) === '40001';

const sanitizePatch = (patch: Record<string, unknown>) => {
  const entries = Object.entries(patch).filter(([, value]) => value !== undefined);
  if (entries.length === 0) {
    throw new CloudConcurrencyError('Controlled update patch must include at least one field.', 'PATCH_EMPTY');
  }

  const protectedField = entries.find(([field]) => PROTECTED_PATCH_FIELDS.has(field));
  if (protectedField) {
    throw new CloudConcurrencyError(`Controlled update patch cannot include ${protectedField[0]}.`, 'PATCH_PROTECTED_FIELD');
  }

  return Object.fromEntries(entries);
};

export const applyControlledRecordUpdate = async <RecordShape = Record<string, unknown>>(
  client: DumalaSupabaseClient,
  input: ControlledRecordUpdateInput
): Promise<RecordShape> => {
  const { data, error } = await client.rpc('apply_controlled_record_update', {
    target_table: input.table,
    target_id: input.id,
    expected_version: input.expectedVersion,
    patch: sanitizePatch(input.patch)
  });

  if (error) {
    const code = getErrorCode(error) === '40001' ? 'VERSION_CONFLICT' : 'CONTROLLED_UPDATE_FAILED';
    throw new CloudConcurrencyError(`Failed to apply controlled update: ${getErrorMessage(error)}`, code, error);
  }

  return data as RecordShape;
};
