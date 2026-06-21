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
