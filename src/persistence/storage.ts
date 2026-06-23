import type { z } from 'zod';
import {
  announcementsSchema,
  assessmentsSchema,
  availabilitySchema,
  booleanSchema,
  coachNotesSchema,
  draggedPositionsSchema,
  drawingPathsSchema,
  gamesSchema,
  matchFormatSchema,
  playerExtrasSchema,
  playersSchema,
  staffMembersSchema,
  standingsBackupsSchema,
  standingsSchema,
  stringArraySchema,
  stringSchema,
  tacticsLineupSchema,
  tacticsNotesSchema,
  teamInfoSchema,
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
  standingsBackups: 'stack_team_standings_backups',
  sundayBackupEnabled: 'stack_team_sunday_backup_enabled',
  availability: 'squad_availability',
  coachNotes: 'squad_coach_notes',
  weeklySchedule: 'squad_weekly_schedule',
  weeklyScheduleHistory: 'squad_weekly_schedule_history',
  matchFormat: 'squad_match_format',
  formation: 'squad_formation',
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
  playerExtras: 'stack_squad_player_extras',
  lineup: 'stack_squad_lineup',
  tacticsNotes: 'stack_tactics_quick_notes',
  draggedPositions: 'stack_tactics_dragged_positions',
  drawingPaths: 'stack_tactics_draw_paths',
  preRestoreBackup: 'stack_pre_restore_backup'
} as const;

export const storageSchemas = {
  [STORAGE_KEYS.teamInfo]: teamInfoSchema.nullable(),
  [STORAGE_KEYS.players]: playersSchema,
  [STORAGE_KEYS.staff]: staffMembersSchema,
  [STORAGE_KEYS.games]: gamesSchema,
  [STORAGE_KEYS.standings]: standingsSchema,
  [STORAGE_KEYS.announcements]: announcementsSchema,
  [STORAGE_KEYS.assessments]: assessmentsSchema,
  [STORAGE_KEYS.standingsBackups]: standingsBackupsSchema,
  [STORAGE_KEYS.sundayBackupEnabled]: booleanSchema,
  [STORAGE_KEYS.availability]: availabilitySchema,
  [STORAGE_KEYS.coachNotes]: coachNotesSchema,
  [STORAGE_KEYS.weeklySchedule]: weeklyScheduleSchema,
  [STORAGE_KEYS.weeklyScheduleHistory]: weeklyScheduleSchema,
  [STORAGE_KEYS.matchFormat]: matchFormatSchema,
  [STORAGE_KEYS.formation]: stringSchema,
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
  [STORAGE_KEYS.playerExtras]: playerExtrasSchema,
  [STORAGE_KEYS.lineup]: tacticsLineupSchema,
  [STORAGE_KEYS.tacticsNotes]: tacticsNotesSchema,
  [STORAGE_KEYS.draggedPositions]: draggedPositionsSchema,
  [STORAGE_KEYS.drawingPaths]: drawingPathsSchema
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
  [STORAGE_KEYS.standingsBackups]: 'Standings history',
  [STORAGE_KEYS.sundayBackupEnabled]: 'Standings preferences',
  [STORAGE_KEYS.availability]: 'Match availability',
  [STORAGE_KEYS.coachNotes]: 'Coach notes',
  [STORAGE_KEYS.weeklySchedule]: 'Weekly training',
  [STORAGE_KEYS.weeklyScheduleHistory]: 'Training history',
  [STORAGE_KEYS.matchFormat]: 'Tactics match format',
  [STORAGE_KEYS.formation]: 'Tactics formation',
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
  [STORAGE_KEYS.playerExtras]: 'Tactics player status',
  [STORAGE_KEYS.lineup]: 'Tactics lineup',
  [STORAGE_KEYS.tacticsNotes]: 'Tactics notes',
  [STORAGE_KEYS.draggedPositions]: 'Tactics positions',
  [STORAGE_KEYS.drawingPaths]: 'Tactics drawings'
};

const BOOLEAN_STORAGE_KEYS = new Set<string>([
  STORAGE_KEYS.sundayBackupEnabled,
  STORAGE_KEYS.isCustomStrategy
]);

const STRING_STORAGE_KEYS = new Set<string>([
  STORAGE_KEYS.matchFormat,
  STORAGE_KEYS.formation,
  STORAGE_KEYS.playstyle,
  STORAGE_KEYS.customPlaystyle,
  STORAGE_KEYS.customDefensiveStyle,
  STORAGE_KEYS.customMentality,
  STORAGE_KEYS.customStrategyNotes,
  STORAGE_KEYS.coachLevel,
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
  storage.setItem(key, JSON.stringify(value));
};

export const writeStringStorage = (key: string, value: string, storage: StorageLike = browserStorage()) => {
  storage.setItem(key, value);
};

export const writeBooleanStorage = (key: string, value: boolean, storage: StorageLike = browserStorage()) => {
  storage.setItem(key, String(value));
};

export const removeStorage = (key: string, storage: StorageLike = browserStorage()) => storage.removeItem(key);

export const CORE_DUMALA_KEYS = [
  STORAGE_KEYS.onboarded,
  ...Object.keys(storageSchemas),
  STORAGE_KEYS.preRestoreBackup
];

export const clearDumalaStorage = (storage: StorageLike = browserStorage()) => {
  CORE_DUMALA_KEYS.forEach(key => storage.removeItem(key));
};
