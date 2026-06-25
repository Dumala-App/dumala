import { z } from 'zod';
import type { Announcement, AssessmentSession, Game, PaymentLedgerEntry, Player, StaffMember, Standing, TeamInfo } from '../types';
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
  migrateLegacyRoster,
  playerExtrasSchema,
  paymentLedgerSchema,
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
import {
  readBooleanStorage,
  readJsonStorage,
  readStringStorage,
  STORAGE_KEYS,
  type StorageLike,
  writeBooleanStorage,
  writeJsonStorage,
  writeStringStorage
} from './storage';

const tacticsSchema = z.object({
  matchFormat: matchFormatSchema,
  formation: stringSchema,
  playstyle: stringSchema,
  isCustomStrategy: booleanSchema,
  customPlaystyle: stringSchema,
  customDefensiveStyle: stringSchema,
  customMentality: stringSchema,
  customStrategyNotes: stringSchema,
  coachLevel: stringSchema,
  customPlaystyles: stringArraySchema,
  captainId: stringSchema,
  penaltyTakerId: stringSchema,
  freeKickTakerId: stringSchema,
  cornerTakerId: stringSchema,
  defensiveStyle: stringSchema,
  playerExtras: playerExtrasSchema,
  lineup: tacticsLineupSchema,
  notes: tacticsNotesSchema,
  draggedPositions: draggedPositionsSchema,
  drawings: drawingPathsSchema
});

const featureStateSchema = z.object({
  availability: availabilitySchema,
  coachNotes: coachNotesSchema,
  weeklyTraining: weeklyScheduleSchema,
  weeklyTrainingHistory: weeklyScheduleSchema.nullable(),
  standingsBackups: standingsBackupsSchema,
  standingsPreferences: z.object({ sundayBackupEnabled: booleanSchema }),
  tactics: tacticsSchema
});

const coreWorkspaceV2Schema = z.object({
  teamInfo: teamInfoSchema,
  players: playersSchema,
  games: gamesSchema,
  standings: standingsSchema,
  announcements: announcementsSchema,
  assessments: assessmentsSchema
});

export const workspaceBackupV2Schema = z.object({
  format: z.literal('dumala-workspace'),
  version: z.literal(2),
  exportedAt: z.string(),
  core: coreWorkspaceV2Schema,
  featureState: featureStateSchema
});

export const workspaceBackupV3Schema = z.object({
  format: z.literal('dumala-workspace'),
  version: z.literal(3),
  exportedAt: z.string(),
  core: coreWorkspaceV2Schema.extend({
    staff: staffMembersSchema
  }),
  featureState: featureStateSchema
});

export const workspaceBackupV4Schema = z.object({
  format: z.literal('dumala-workspace'),
  version: z.literal(4),
  exportedAt: z.string(),
  core: coreWorkspaceV2Schema.extend({
    staff: staffMembersSchema,
    paymentLedger: paymentLedgerSchema
  }),
  featureState: featureStateSchema
});

export type WorkspaceBackupV3 = z.infer<typeof workspaceBackupV3Schema>;
export type WorkspaceBackupV4 = z.infer<typeof workspaceBackupV4Schema>;

export type CoreWorkspace = {
  teamInfo: TeamInfo;
  players: Player[];
  staff: StaffMember[];
  games: Game[];
  standings: Standing[];
  announcements: Announcement[];
  assessments: AssessmentSession[];
  paymentLedger: PaymentLedgerEntry[];
};

export type BackupRestoreSummary = {
  sourceVersion: string;
  players: number;
  staff: number;
  games: number;
  standings: number;
  announcements: number;
  assessments: number;
  paymentEntries: number;
  includedFeatureState: boolean;
};

const emptyWeeklySchedule = {
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: [],
  Sunday: []
};

const defaultTactics = {
  matchFormat: '11-a-side' as const,
  formation: '4-1-2-3',
  playstyle: 'Quick Counter',
  isCustomStrategy: false,
  customPlaystyle: 'Direct Attacking Tiki-Taka',
  customDefensiveStyle: 'Aggressive Wing Press',
  customMentality: 'Balanced',
  customStrategyNotes: 'Focus on rapid mid-block transitional overload. Fullbacks overlap actively while DMF covers the backline.',
  coachLevel: 'Expert ★★★★★',
  customPlaystyles: ['Quick Counter', 'Possession Game', 'Long Ball Counter', 'Out Wide'],
  captainId: '',
  penaltyTakerId: '',
  freeKickTakerId: '',
  cornerTakerId: '',
  defensiveStyle: 'High Press',
  playerExtras: {},
  lineup: {},
  notes: [],
  draggedPositions: {},
  drawings: []
};

export const collectFeatureState = (storage: StorageLike = window.localStorage): WorkspaceBackupV3['featureState'] => ({
  availability: readJsonStorage(STORAGE_KEYS.availability, availabilitySchema, {}, 'Match availability', storage),
  coachNotes: readJsonStorage(STORAGE_KEYS.coachNotes, coachNotesSchema, {}, 'Coach notes', storage),
  weeklyTraining: readJsonStorage(STORAGE_KEYS.weeklySchedule, weeklyScheduleSchema, emptyWeeklySchedule, 'Weekly training', storage),
  weeklyTrainingHistory: storage.getItem(STORAGE_KEYS.weeklyScheduleHistory) === null
    ? null
    : readJsonStorage(STORAGE_KEYS.weeklyScheduleHistory, weeklyScheduleSchema, emptyWeeklySchedule, 'Training history', storage),
  standingsBackups: readJsonStorage(STORAGE_KEYS.standingsBackups, standingsBackupsSchema, [], 'Standings history', storage),
  standingsPreferences: {
    sundayBackupEnabled: readBooleanStorage(STORAGE_KEYS.sundayBackupEnabled, true, 'Standings preferences', storage)
  },
  tactics: {
    matchFormat: readStringStorage(STORAGE_KEYS.matchFormat, matchFormatSchema, defaultTactics.matchFormat, 'Tactics match format', storage),
    formation: readStringStorage(STORAGE_KEYS.formation, stringSchema, defaultTactics.formation, 'Tactics formation', storage),
    playstyle: readStringStorage(STORAGE_KEYS.playstyle, stringSchema, defaultTactics.playstyle, 'Tactics playstyle', storage),
    isCustomStrategy: readBooleanStorage(STORAGE_KEYS.isCustomStrategy, false, 'Tactics strategy', storage),
    customPlaystyle: readStringStorage(STORAGE_KEYS.customPlaystyle, stringSchema, defaultTactics.customPlaystyle, 'Tactics strategy', storage),
    customDefensiveStyle: readStringStorage(STORAGE_KEYS.customDefensiveStyle, stringSchema, defaultTactics.customDefensiveStyle, 'Tactics strategy', storage),
    customMentality: readStringStorage(STORAGE_KEYS.customMentality, stringSchema, defaultTactics.customMentality, 'Tactics strategy', storage),
    customStrategyNotes: readStringStorage(STORAGE_KEYS.customStrategyNotes, stringSchema, defaultTactics.customStrategyNotes, 'Tactics strategy', storage),
    coachLevel: readStringStorage(STORAGE_KEYS.coachLevel, stringSchema, defaultTactics.coachLevel, 'Tactics coach details', storage),
    customPlaystyles: readJsonStorage(STORAGE_KEYS.customPlaystyles, stringArraySchema, defaultTactics.customPlaystyles, 'Tactics playstyles', storage),
    captainId: readStringStorage(STORAGE_KEYS.captainId, stringSchema, '', 'Tactics roles', storage),
    penaltyTakerId: readStringStorage(STORAGE_KEYS.penaltyTakerId, stringSchema, '', 'Tactics roles', storage),
    freeKickTakerId: readStringStorage(STORAGE_KEYS.freeKickTakerId, stringSchema, '', 'Tactics roles', storage),
    cornerTakerId: readStringStorage(STORAGE_KEYS.cornerTakerId, stringSchema, '', 'Tactics roles', storage),
    defensiveStyle: readStringStorage(STORAGE_KEYS.defensiveStyle, stringSchema, defaultTactics.defensiveStyle, 'Tactics defense', storage),
    playerExtras: readJsonStorage(STORAGE_KEYS.playerExtras, playerExtrasSchema, {}, 'Tactics player status', storage),
    lineup: readJsonStorage(STORAGE_KEYS.lineup, tacticsLineupSchema, {}, 'Tactics lineup', storage),
    notes: readJsonStorage(STORAGE_KEYS.tacticsNotes, tacticsNotesSchema, [], 'Tactics notes', storage),
    draggedPositions: readJsonStorage(STORAGE_KEYS.draggedPositions, draggedPositionsSchema, {}, 'Tactics positions', storage),
    drawings: readJsonStorage(STORAGE_KEYS.drawingPaths, drawingPathsSchema, [], 'Tactics drawings', storage)
  }
});

export const createWorkspaceBackup = (
  core: CoreWorkspace,
  storage: StorageLike = window.localStorage,
  exportedAt = new Date().toISOString()
): WorkspaceBackupV4 => workspaceBackupV4Schema.parse({
  format: 'dumala-workspace',
  version: 4,
  exportedAt,
  core,
  featureState: collectFeatureState(storage)
});

const legacyBackupSchema = z.object({
  backupVersion: z.enum(['1.0.0', '1.1.0']),
  exportedAt: z.string().optional(),
  teamInfo: teamInfoSchema,
  players: playersSchema,
  games: gamesSchema,
  standings: standingsSchema,
  announcements: announcementsSchema,
  assessments: assessmentsSchema.optional()
});

export const parseWorkspaceBackup = (
  input: unknown,
  currentFeatureState: WorkspaceBackupV4['featureState']
): { backup: WorkspaceBackupV4; sourceVersion: string } => {
  const v4 = workspaceBackupV4Schema.safeParse(input);
  if (v4.success) return { backup: v4.data, sourceVersion: '4' };

  const v3 = workspaceBackupV3Schema.safeParse(input);
  if (v3.success) {
    return {
      sourceVersion: '3',
      backup: workspaceBackupV4Schema.parse({
        ...v3.data,
        version: 4,
        core: {
          ...v3.data.core,
          paymentLedger: []
        }
      })
    };
  }

  const v2 = workspaceBackupV2Schema.safeParse(input);
  if (v2.success) {
    const roster = migrateLegacyRoster(v2.data.core.players);
    return {
      sourceVersion: '2',
      backup: workspaceBackupV4Schema.parse({
        ...v2.data,
        version: 4,
        core: {
          ...v2.data.core,
          players: roster.players,
          staff: roster.staff,
          paymentLedger: []
        }
      })
    };
  }

  const legacy = legacyBackupSchema.safeParse(input);
  if (!legacy.success) {
    throw new Error('This backup is invalid, incomplete, or uses an unsupported version.');
  }

  return {
    sourceVersion: legacy.data.backupVersion,
    backup: workspaceBackupV4Schema.parse({
      format: 'dumala-workspace',
      version: 4,
      exportedAt: legacy.data.exportedAt ?? new Date().toISOString(),
      core: {
        teamInfo: legacy.data.teamInfo,
        ...migrateLegacyRoster(legacy.data.players),
        games: legacy.data.games,
        standings: legacy.data.standings,
        announcements: legacy.data.announcements,
        assessments: legacy.data.assessments ?? [],
        paymentLedger: []
      },
      featureState: currentFeatureState
    })
  };
};

const writesForBackup = (backup: WorkspaceBackupV4): Array<[string, unknown, 'json' | 'string' | 'boolean']> => [
  [STORAGE_KEYS.onboarded, true, 'boolean'],
  [STORAGE_KEYS.teamInfo, backup.core.teamInfo, 'json'],
  [STORAGE_KEYS.players, backup.core.players, 'json'],
  [STORAGE_KEYS.staff, backup.core.staff, 'json'],
  [STORAGE_KEYS.games, backup.core.games, 'json'],
  [STORAGE_KEYS.standings, backup.core.standings, 'json'],
  [STORAGE_KEYS.announcements, backup.core.announcements, 'json'],
  [STORAGE_KEYS.assessments, backup.core.assessments, 'json'],
  [STORAGE_KEYS.paymentLedger, backup.core.paymentLedger, 'json'],
  [STORAGE_KEYS.availability, backup.featureState.availability, 'json'],
  [STORAGE_KEYS.coachNotes, backup.featureState.coachNotes, 'json'],
  [STORAGE_KEYS.weeklySchedule, backup.featureState.weeklyTraining, 'json'],
  [STORAGE_KEYS.standingsBackups, backup.featureState.standingsBackups, 'json'],
  [STORAGE_KEYS.sundayBackupEnabled, backup.featureState.standingsPreferences.sundayBackupEnabled, 'boolean'],
  [STORAGE_KEYS.matchFormat, backup.featureState.tactics.matchFormat, 'string'],
  [STORAGE_KEYS.formation, backup.featureState.tactics.formation, 'string'],
  [STORAGE_KEYS.playstyle, backup.featureState.tactics.playstyle, 'string'],
  [STORAGE_KEYS.isCustomStrategy, backup.featureState.tactics.isCustomStrategy, 'boolean'],
  [STORAGE_KEYS.customPlaystyle, backup.featureState.tactics.customPlaystyle, 'string'],
  [STORAGE_KEYS.customDefensiveStyle, backup.featureState.tactics.customDefensiveStyle, 'string'],
  [STORAGE_KEYS.customMentality, backup.featureState.tactics.customMentality, 'string'],
  [STORAGE_KEYS.customStrategyNotes, backup.featureState.tactics.customStrategyNotes, 'string'],
  [STORAGE_KEYS.coachLevel, backup.featureState.tactics.coachLevel, 'string'],
  [STORAGE_KEYS.customPlaystyles, backup.featureState.tactics.customPlaystyles, 'json'],
  [STORAGE_KEYS.captainId, backup.featureState.tactics.captainId, 'string'],
  [STORAGE_KEYS.penaltyTakerId, backup.featureState.tactics.penaltyTakerId, 'string'],
  [STORAGE_KEYS.freeKickTakerId, backup.featureState.tactics.freeKickTakerId, 'string'],
  [STORAGE_KEYS.cornerTakerId, backup.featureState.tactics.cornerTakerId, 'string'],
  [STORAGE_KEYS.defensiveStyle, backup.featureState.tactics.defensiveStyle, 'string'],
  [STORAGE_KEYS.playerExtras, backup.featureState.tactics.playerExtras, 'json'],
  [STORAGE_KEYS.lineup, backup.featureState.tactics.lineup, 'json'],
  [STORAGE_KEYS.tacticsNotes, backup.featureState.tactics.notes, 'json'],
  [STORAGE_KEYS.draggedPositions, backup.featureState.tactics.draggedPositions, 'json'],
  [STORAGE_KEYS.drawingPaths, backup.featureState.tactics.drawings, 'json']
];

export const applyWorkspaceBackup = (backup: WorkspaceBackupV4, storage: StorageLike = window.localStorage) => {
  const validated = workspaceBackupV4Schema.parse(backup);
  const writes = writesForBackup(validated);
  const before = new Map<string, string | null>(writes.map(([key]) => [key, storage.getItem(key)]));
  before.set(STORAGE_KEYS.weeklyScheduleHistory, storage.getItem(STORAGE_KEYS.weeklyScheduleHistory));

  try {
    for (const [key, value, kind] of writes) {
      if (kind === 'json') writeJsonStorage(key, value, storage);
      if (kind === 'string') writeStringStorage(key, value as string, storage);
      if (kind === 'boolean') writeBooleanStorage(key, value as boolean, storage);
    }

    if (validated.featureState.weeklyTrainingHistory) {
      writeJsonStorage(STORAGE_KEYS.weeklyScheduleHistory, validated.featureState.weeklyTrainingHistory, storage);
    } else {
      storage.removeItem(STORAGE_KEYS.weeklyScheduleHistory);
    }
  } catch (error) {
    for (const [key, previous] of before) {
      if (previous === null) storage.removeItem(key);
      else storage.setItem(key, previous);
    }
    throw error;
  }
};

export const summarizeBackup = (backup: WorkspaceBackupV4, sourceVersion = '4'): BackupRestoreSummary => ({
  sourceVersion,
  players: backup.core.players.length,
  staff: backup.core.staff.length,
  games: backup.core.games.length,
  standings: backup.core.standings.length,
  announcements: backup.core.announcements.length,
  assessments: backup.core.assessments.length,
  paymentEntries: 'paymentLedger' in backup.core ? backup.core.paymentLedger.length : 0,
  includedFeatureState: ['2', '3', '4'].includes(sourceVersion)
});
