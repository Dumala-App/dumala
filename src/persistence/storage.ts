import type { z } from 'zod';
import {
  activationFlagsSchema,
  announcementsSchema,
  assessmentsSchema,
  availabilitySchema,
  booleanSchema,
  coachNotesSchema,
  draggedPositionsSchema,
  drawingPathsSchema,
  gamesSchema,
  gamePlansSchema,
  matchFormatSchema,
  playerExtrasSchema,
  paymentLedgerSchema,
  playersSchema,
  staffMembersSchema,
  standingsBackupsSchema,
  standingsSchema,
  strategyContextSchema,
  stringArraySchema,
  stringSchema,
  tacticsBoardSnapshotsSchema,
  tacticsLineupSchema,
  tacticsNotesSchema,
  teamInfoSchema,
  trainingSessionMetaMapSchema,
  weeklyScheduleWeeksSchema,
  weeklyScheduleSchema
} from './schemas';

export const STORAGE_KEYS = {
  onboarded: 'stack_team_onboarded',
  teamInfo: 'stack_team_info',
  players: 'stack_team_players',
  staff: 'stack_team_staff',
  games: 'stack_team_games',
  standings: 'stack_team_standings',
  announcements: 'stack_team_announcements',
  assessments: 'stack_team_assessments',
  paymentLedger: 'stack_team_payment_ledger',
  standingsBackups: 'stack_team_standings_backups',
  sundayBackupEnabled: 'stack_team_sunday_backup_enabled',
  availability: 'squad_availability',
  coachNotes: 'squad_coach_notes',
  weeklySchedule: 'squad_weekly_schedule',
  weeklyScheduleWeeks: 'squad_weekly_schedule_weeks',
  weeklyScheduleHistory: 'squad_weekly_schedule_history',
  weeklyScheduleCadence: 'squad_weekly_schedule_cadence',
  trainingSessionMeta: 'squad_training_session_meta',
  matchFormat: 'squad_match_format',
  formation: 'squad_formation',
  opponentFormation: 'squad_opponent_formation',
  playstyle: 'squad_playstyle',
  isCustomStrategy: 'squad_is_custom_strategy',
  customPlaystyle: 'squad_custom_playstyle_val',
  customDefensiveStyle: 'squad_custom_defensive_val',
  customMentality: 'squad_custom_mentality_val',
  customStrategyNotes: 'squad_custom_strategy_notes',
  coachLevel: 'squad_coach_level',
  customPlaystyles: 'squad_custom_playstyles',
  captainId: 'squad_captain_id',
  penaltyTakerId: 'squad_penalty_taker_id',
  freeKickTakerId: 'squad_free_kick_taker_id',
  cornerTakerId: 'squad_corner_taker_id',
  defensiveStyle: 'squad_defensive_style',
  strategyContext: 'squad_strategy_context',
  playerExtras: 'stack_squad_player_extras',
  lineup: 'stack_squad_lineup',
  tacticsNotes: 'stack_tactics_quick_notes',
  draggedPositions: 'stack_tactics_dragged_positions',
  drawingPaths: 'stack_tactics_draw_paths',
  tacticsBoardSnapshots: 'stack_tactics_board_snapshots',
  gamePlans: 'stack_tactics_game_plans',
  activation: 'stack_team_activation',
  preRestoreBackup: 'stack_pre_restore_backup'
} as const;

export const MANAGED_WORKSPACE_KEYS = {
  index: 'dumala_workspaces_index',
  activeWorkspaceId: 'dumala_active_workspace_id',
  cloudSignedOut: 'dumala_cloud_signed_out'
} as const;

export const storageSchemas = {
  [STORAGE_KEYS.teamInfo]: teamInfoSchema.nullable(),
  [STORAGE_KEYS.players]: playersSchema,
  [STORAGE_KEYS.staff]: staffMembersSchema,
  [STORAGE_KEYS.games]: gamesSchema,
  [STORAGE_KEYS.standings]: standingsSchema,
  [STORAGE_KEYS.announcements]: announcementsSchema,
  [STORAGE_KEYS.assessments]: assessmentsSchema,
  [STORAGE_KEYS.paymentLedger]: paymentLedgerSchema,
  [STORAGE_KEYS.standingsBackups]: standingsBackupsSchema,
  [STORAGE_KEYS.sundayBackupEnabled]: booleanSchema,
  [STORAGE_KEYS.availability]: availabilitySchema,
  [STORAGE_KEYS.coachNotes]: coachNotesSchema,
  [STORAGE_KEYS.weeklySchedule]: weeklyScheduleSchema,
  [STORAGE_KEYS.weeklyScheduleWeeks]: weeklyScheduleWeeksSchema,
  [STORAGE_KEYS.weeklyScheduleHistory]: weeklyScheduleSchema,
  [STORAGE_KEYS.weeklyScheduleCadence]: stringSchema,
  [STORAGE_KEYS.trainingSessionMeta]: trainingSessionMetaMapSchema,
  [STORAGE_KEYS.matchFormat]: matchFormatSchema,
  [STORAGE_KEYS.formation]: stringSchema,
  [STORAGE_KEYS.opponentFormation]: stringSchema,
  [STORAGE_KEYS.playstyle]: stringSchema,
  [STORAGE_KEYS.isCustomStrategy]: booleanSchema,
  [STORAGE_KEYS.customPlaystyle]: stringSchema,
  [STORAGE_KEYS.customDefensiveStyle]: stringSchema,
  [STORAGE_KEYS.customMentality]: stringSchema,
  [STORAGE_KEYS.customStrategyNotes]: stringSchema,
  [STORAGE_KEYS.coachLevel]: stringSchema,
  [STORAGE_KEYS.customPlaystyles]: stringArraySchema,
  [STORAGE_KEYS.captainId]: stringSchema,
  [STORAGE_KEYS.penaltyTakerId]: stringSchema,
  [STORAGE_KEYS.freeKickTakerId]: stringSchema,
  [STORAGE_KEYS.cornerTakerId]: stringSchema,
  [STORAGE_KEYS.defensiveStyle]: stringSchema,
  [STORAGE_KEYS.strategyContext]: strategyContextSchema,
  [STORAGE_KEYS.playerExtras]: playerExtrasSchema,
  [STORAGE_KEYS.lineup]: tacticsLineupSchema,
  [STORAGE_KEYS.tacticsNotes]: tacticsNotesSchema,
  [STORAGE_KEYS.draggedPositions]: draggedPositionsSchema,
  [STORAGE_KEYS.drawingPaths]: drawingPathsSchema,
  [STORAGE_KEYS.tacticsBoardSnapshots]: tacticsBoardSnapshotsSchema,
  [STORAGE_KEYS.gamePlans]: gamePlansSchema,
  [STORAGE_KEYS.activation]: activationFlagsSchema
} as const;

export type RecoveryWarning = {
  key: string;
  section: string;
  message: string;
};

export type StorageRecoveryIssue = {
  key: string;
  section: string;
  reason: 'malformed-json' | 'invalid-data';
};

export type StorageRecoverySnapshot = {
  format: 'dumala-storage-recovery';
  version: 1;
  exportedAt: string;
  issues: StorageRecoveryIssue[];
  entries: Record<string, string>;
};

const STORAGE_SECTIONS: Record<string, string> = {
  [STORAGE_KEYS.onboarded]: 'Onboarding',
  [STORAGE_KEYS.teamInfo]: 'Team information',
  [STORAGE_KEYS.players]: 'Roster',
  [STORAGE_KEYS.staff]: 'Staff directory',
  [STORAGE_KEYS.games]: 'Schedule',
  [STORAGE_KEYS.standings]: 'League standings',
  [STORAGE_KEYS.announcements]: 'Bulletins',
  [STORAGE_KEYS.assessments]: 'Assessments',
  [STORAGE_KEYS.paymentLedger]: 'Payment ledger',
  [STORAGE_KEYS.standingsBackups]: 'Standings history',
  [STORAGE_KEYS.sundayBackupEnabled]: 'Standings preferences',
  [STORAGE_KEYS.availability]: 'Match availability',
  [STORAGE_KEYS.coachNotes]: 'Coach notes',
  [STORAGE_KEYS.weeklySchedule]: 'Weekly training',
  [STORAGE_KEYS.weeklyScheduleHistory]: 'Training history',
  [STORAGE_KEYS.weeklyScheduleCadence]: 'Training schedule cadence',
  [STORAGE_KEYS.trainingSessionMeta]: 'Training session notes',
  [STORAGE_KEYS.matchFormat]: 'Tactics match format',
  [STORAGE_KEYS.formation]: 'Tactics formation',
  [STORAGE_KEYS.opponentFormation]: 'Opponent formation',
  [STORAGE_KEYS.playstyle]: 'Tactics playstyle',
  [STORAGE_KEYS.isCustomStrategy]: 'Tactics strategy',
  [STORAGE_KEYS.customPlaystyle]: 'Tactics strategy',
  [STORAGE_KEYS.customDefensiveStyle]: 'Tactics strategy',
  [STORAGE_KEYS.customMentality]: 'Tactics strategy',
  [STORAGE_KEYS.customStrategyNotes]: 'Tactics strategy',
  [STORAGE_KEYS.coachLevel]: 'Tactics coach details',
  [STORAGE_KEYS.customPlaystyles]: 'Tactics playstyles',
  [STORAGE_KEYS.captainId]: 'Tactics roles',
  [STORAGE_KEYS.penaltyTakerId]: 'Tactics roles',
  [STORAGE_KEYS.freeKickTakerId]: 'Tactics roles',
  [STORAGE_KEYS.cornerTakerId]: 'Tactics roles',
  [STORAGE_KEYS.defensiveStyle]: 'Tactics defense',
  [STORAGE_KEYS.strategyContext]: 'Tactics strategy context',
  [STORAGE_KEYS.playerExtras]: 'Tactics player status',
  [STORAGE_KEYS.lineup]: 'Tactics lineup',
  [STORAGE_KEYS.tacticsNotes]: 'Tactics notes',
  [STORAGE_KEYS.draggedPositions]: 'Tactics positions',
  [STORAGE_KEYS.drawingPaths]: 'Tactics drawings',
  [STORAGE_KEYS.tacticsBoardSnapshots]: 'Tactics board snapshots',
  [STORAGE_KEYS.gamePlans]: 'Tactics game plans',
  [STORAGE_KEYS.activation]: 'Getting started'
};

const BOOLEAN_STORAGE_KEYS = new Set<string>([
  STORAGE_KEYS.sundayBackupEnabled,
  STORAGE_KEYS.isCustomStrategy
]);

const STRING_STORAGE_KEYS = new Set<string>([
  STORAGE_KEYS.matchFormat,
  STORAGE_KEYS.formation,
  STORAGE_KEYS.opponentFormation,
  STORAGE_KEYS.playstyle,
  STORAGE_KEYS.customPlaystyle,
  STORAGE_KEYS.customDefensiveStyle,
  STORAGE_KEYS.customMentality,
  STORAGE_KEYS.customStrategyNotes,
  STORAGE_KEYS.coachLevel,
  STORAGE_KEYS.weeklyScheduleCadence,
  STORAGE_KEYS.captainId,
  STORAGE_KEYS.penaltyTakerId,
  STORAGE_KEYS.freeKickTakerId,
  STORAGE_KEYS.cornerTakerId,
  STORAGE_KEYS.defensiveStyle
]);

const recoveryWarnings: RecoveryWarning[] = [];

const reportRecovery = (key: string, section: string) => {
  if (recoveryWarnings.some(warning => warning.key === key)) return;
  const warning = {
    key,
    section,
    message: `${section} contained invalid saved data and was reset to a safe default.`
  };
  recoveryWarnings.push(warning);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<RecoveryWarning>('dumala:storage-recovery', { detail: warning }));
  }
};

export const drainRecoveryWarnings = (): RecoveryWarning[] => recoveryWarnings.splice(0);

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key?(index: number): string | null;
  readonly length?: number;
}

const browserStorage = (): StorageLike => window.localStorage;

export const inspectDumalaStorage = (storage: StorageLike = browserStorage()): StorageRecoveryIssue[] => {
  const issues: StorageRecoveryIssue[] = [];
  const onboarded = storage.getItem(STORAGE_KEYS.onboarded);

  if (onboarded !== null && onboarded !== 'true' && onboarded !== 'false') {
    issues.push({
      key: STORAGE_KEYS.onboarded,
      section: STORAGE_SECTIONS[STORAGE_KEYS.onboarded],
      reason: 'invalid-data'
    });
  }

  for (const [key, schema] of Object.entries(storageSchemas)) {
    const raw = storage.getItem(key);
    if (raw === null) continue;

    let value: unknown = raw;
    if (!BOOLEAN_STORAGE_KEYS.has(key) && !STRING_STORAGE_KEYS.has(key)) {
      try {
        value = JSON.parse(raw);
      } catch {
        issues.push({
          key,
          section: STORAGE_SECTIONS[key] ?? 'Workspace data',
          reason: 'malformed-json'
        });
        continue;
      }
    } else if (BOOLEAN_STORAGE_KEYS.has(key)) {
      if (raw === 'true') value = true;
      else if (raw === 'false') value = false;
    }

    if (!schema.safeParse(value).success) {
      issues.push({
        key,
        section: STORAGE_SECTIONS[key] ?? 'Workspace data',
        reason: 'invalid-data'
      });
    }
  }

  return issues;
};

export const createStorageRecoverySnapshot = (
  issues: StorageRecoveryIssue[],
  storage: StorageLike = browserStorage(),
  exportedAt = new Date().toISOString()
): StorageRecoverySnapshot => {
  const entries: Record<string, string> = {};
  for (const key of CORE_DUMALA_KEYS) {
    const raw = storage.getItem(key);
    if (raw !== null) entries[key] = raw;
  }

  return {
    format: 'dumala-storage-recovery',
    version: 1,
    exportedAt,
    issues,
    entries
  };
};

export const readJsonStorage = <T>(
  key: string,
  schema: z.ZodType<T>,
  fallback: T,
  section: string,
  storage: StorageLike = browserStorage()
): T => {
  const raw = storage.getItem(key);
  if (raw === null) return fallback;
  try {
    const result = schema.safeParse(JSON.parse(raw));
    if (result.success) return result.data;
  } catch {
    // Report below.
  }
  reportRecovery(key, section);
  return fallback;
};

export const readStringStorage = <T extends string>(
  key: string,
  schema: z.ZodType<T>,
  fallback: T,
  section: string,
  storage: StorageLike = browserStorage()
): T => {
  const raw = storage.getItem(key);
  if (raw === null) return fallback;
  const result = schema.safeParse(raw);
  if (result.success) return result.data;
  reportRecovery(key, section);
  return fallback;
};

export const readBooleanStorage = (
  key: string,
  fallback: boolean,
  section: string,
  storage: StorageLike = browserStorage()
): boolean => {
  const raw = storage.getItem(key);
  if (raw === null) return fallback;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  reportRecovery(key, section);
  return fallback;
};

export const writeJsonStorage = (key: string, value: unknown, storage: StorageLike = browserStorage()) => {
  const serialized = JSON.stringify(value);
  storage.setItem(key, serialized);
  mirrorActiveWorkspaceWrite(key, serialized, storage);
};

export const writeStringStorage = (key: string, value: string, storage: StorageLike = browserStorage()) => {
  storage.setItem(key, value);
  mirrorActiveWorkspaceWrite(key, value, storage);
};

export const writeBooleanStorage = (key: string, value: boolean, storage: StorageLike = browserStorage()) => {
  const serialized = String(value);
  storage.setItem(key, serialized);
  mirrorActiveWorkspaceWrite(key, serialized, storage);
};

export const removeStorage = (key: string, storage: StorageLike = browserStorage()) => {
  storage.removeItem(key);
  mirrorActiveWorkspaceRemove(key, storage);
};

export const CORE_DUMALA_KEYS = [
  STORAGE_KEYS.onboarded,
  ...Object.keys(storageSchemas),
  STORAGE_KEYS.preRestoreBackup
];

const WORKSPACE_NAMESPACE_PREFIX = 'dumala_workspace__';

export const getWorkspaceStorageKey = (workspaceId: string, key: string) =>
  `${WORKSPACE_NAMESPACE_PREFIX}${workspaceId}__${key}`;

const WORKSPACE_SCOPED_KEYS = new Set<string>(CORE_DUMALA_KEYS);

const isWorkspaceScopedKey = (key: string) =>
  WORKSPACE_SCOPED_KEYS.has(key) && !key.startsWith(WORKSPACE_NAMESPACE_PREFIX);

const getActiveWorkspaceId = (storage: StorageLike) => {
  const activeId = storage.getItem(MANAGED_WORKSPACE_KEYS.activeWorkspaceId);
  return activeId?.trim() || null;
};

const mirrorActiveWorkspaceWrite = (key: string, serialized: string, storage: StorageLike) => {
  if (!isWorkspaceScopedKey(key)) return;
  const activeId = getActiveWorkspaceId(storage);
  if (!activeId) return;
  storage.setItem(getWorkspaceStorageKey(activeId, key), serialized);
};

const mirrorActiveWorkspaceRemove = (key: string, storage: StorageLike) => {
  if (!isWorkspaceScopedKey(key)) return;
  const activeId = getActiveWorkspaceId(storage);
  if (!activeId) return;
  storage.removeItem(getWorkspaceStorageKey(activeId, key));
};

export const clearDumalaStorage = (storage: StorageLike = browserStorage()) => {
  CORE_DUMALA_KEYS.forEach(key => storage.removeItem(key));
  const rawIndex = storage.getItem(MANAGED_WORKSPACE_KEYS.index);
  if (rawIndex) {
    try {
      const summaries = JSON.parse(rawIndex);
      if (Array.isArray(summaries)) {
        summaries.forEach(summary => {
          if (summary && typeof summary === 'object' && typeof summary.id === 'string') {
            CORE_DUMALA_KEYS.forEach(key => storage.removeItem(getWorkspaceStorageKey(summary.id, key)));
          }
        });
      }
    } catch {
      // If the index is malformed, the known active compatibility keys are still cleared above.
    }
  }
  storage.removeItem(MANAGED_WORKSPACE_KEYS.index);
  storage.removeItem(MANAGED_WORKSPACE_KEYS.activeWorkspaceId);
  storage.removeItem(MANAGED_WORKSPACE_KEYS.cloudSignedOut);
};
