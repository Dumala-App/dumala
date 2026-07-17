import { z } from 'zod';
import type { CoreWorkspace, WorkspaceBackupV4 } from '../persistence/backup';
import { applyWorkspaceBackup, createWorkspaceBackup, workspaceBackupV4Schema } from '../persistence/backup';
import type { StorageLike } from '../persistence/storage';

export const CLOUD_MIGRATION_SCHEMA_VERSION = 'phase-3-initial';

export type CloudMigrationState =
  | 'not_started'
  | 'preflight'
  | 'backup_created'
  | 'account_ready'
  | 'club_ready'
  | 'manifest_ready'
  | 'uploading'
  | 'verifying'
  | 'replica_initializing'
  | 'complete'
  | 'failed'
  | 'rolled_back';

export interface CloudMigrationCounts {
  players: number;
  staff: number;
  games: number;
  matchResults: number;
  matchScorerContributions: number;
  mvpAwards: number;
  playerOffenses: number;
  standings: number;
  bulletins: number;
  assessments: number;
  assessmentPlanWeeks: number;
  paymentLedgerEntries: number;
  availabilityGroups: number;
  availabilityResponses: number;
  coachNotes: number;
  weeklyTrainingDays: number;
  weeklyTrainingDrills: number;
  standingsSnapshots: number;
  tacticsLineupAssignments: number;
  tacticsNotes: number;
  tacticsDrawPaths: number;
  tacticsPlayerExtras: number;
}

export interface CloudMigrationManifest {
  importId: string;
  sourceFormat: 'dumala-workspace';
  sourceVersion: 4;
  sourceExportedAt: string;
  sourceDeviceId: string;
  targetClubId: string;
  appVersion: string;
  schemaVersion: typeof CLOUD_MIGRATION_SCHEMA_VERSION;
  counts: CloudMigrationCounts;
  sourceIds: {
    players: string[];
    staff: string[];
    games: string[];
    assessments: string[];
    paymentLedgerEntries: string[];
  };
  hashes: {
    workspace: string;
    core: string;
    featureState: string;
  };
}

export interface CloudImportRecord {
  table: string;
  sourceId: string;
  idempotencyKey: string;
  data: Record<string, unknown>;
}

export interface CloudImportPayload {
  importId: string;
  clubId: string;
  manifest: CloudMigrationManifest;
  sourceIdMap: Record<string, string>;
  records: CloudImportRecord[];
}

export type CloudMigrationVerificationStatus = 'passed' | 'warning' | 'failed';

export interface CloudMigrationVerificationFinding {
  code: string;
  status: Exclude<CloudMigrationVerificationStatus, 'passed'>;
  message: string;
}

export interface CloudMigrationVerificationReport {
  status: CloudMigrationVerificationStatus;
  checkedAt: string;
  findings: CloudMigrationVerificationFinding[];
}

export interface CloudMigrationActivationDecision {
  canActivate: boolean;
  reason?: string;
}

export interface CloudMigrationRollbackResult {
  state: Extract<CloudMigrationState, 'rolled_back'>;
  restoredAt: string;
  sourceExportedAt: string;
}

export interface CloudMigrationPackage {
  state: Extract<CloudMigrationState, 'manifest_ready'>;
  backup: WorkspaceBackupV4;
  manifest: CloudMigrationManifest;
  payload: CloudImportPayload;
  rollback: {
    state: Extract<CloudMigrationState, 'backup_created'>;
    backup: WorkspaceBackupV4;
    createdAt: string;
  };
}

export interface CreateCloudMigrationPackageOptions {
  importId: string;
  sourceDeviceId: string;
  targetClubId: string;
  appVersion: string;
  exportedAt?: string;
}

const countsSchema: z.ZodType<CloudMigrationCounts> = z.object({
  players: z.number().int().nonnegative(),
  staff: z.number().int().nonnegative(),
  games: z.number().int().nonnegative(),
  matchResults: z.number().int().nonnegative(),
  matchScorerContributions: z.number().int().nonnegative(),
  mvpAwards: z.number().int().nonnegative(),
  playerOffenses: z.number().int().nonnegative(),
  standings: z.number().int().nonnegative(),
  bulletins: z.number().int().nonnegative(),
  assessments: z.number().int().nonnegative(),
  assessmentPlanWeeks: z.number().int().nonnegative(),
  paymentLedgerEntries: z.number().int().nonnegative(),
  availabilityGroups: z.number().int().nonnegative(),
  availabilityResponses: z.number().int().nonnegative(),
  coachNotes: z.number().int().nonnegative(),
  weeklyTrainingDays: z.number().int().nonnegative(),
  weeklyTrainingDrills: z.number().int().nonnegative(),
  standingsSnapshots: z.number().int().nonnegative(),
  tacticsLineupAssignments: z.number().int().nonnegative(),
  tacticsNotes: z.number().int().nonnegative(),
  tacticsDrawPaths: z.number().int().nonnegative(),
  tacticsPlayerExtras: z.number().int().nonnegative()
});

export const cloudMigrationManifestSchema: z.ZodType<CloudMigrationManifest> = z.object({
  importId: z.string().min(1),
  sourceFormat: z.literal('dumala-workspace'),
  sourceVersion: z.literal(4),
  sourceExportedAt: z.string().min(1),
  sourceDeviceId: z.string().min(1),
  targetClubId: z.string().min(1),
  appVersion: z.string().min(1),
  schemaVersion: z.literal(CLOUD_MIGRATION_SCHEMA_VERSION),
  counts: countsSchema,
  sourceIds: z.object({
    players: z.array(z.string()),
    staff: z.array(z.string()),
    games: z.array(z.string()),
    assessments: z.array(z.string()),
    paymentLedgerEntries: z.array(z.string())
  }),
  hashes: z.object({
    workspace: z.string().min(1),
    core: z.string().min(1),
    featureState: z.string().min(1)
  })
});

const sortObject = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = sortObject((value as Record<string, unknown>)[key]);
        return result;
      }, {});
  }
  return value;
};

export const canonicalize = (value: unknown): string => JSON.stringify(sortObject(value));

const fnv1a = (input: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

export const createContentFingerprint = (value: unknown): string => `fnv1a:${fnv1a(canonicalize(value))}`;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Derive a cloud UUID for a local record. `namespace` must be stable for the
 * lifetime of the record, or a re-upload mints a fresh id and inserts a
 * duplicate row instead of updating the existing one.
 */
export const toCloudUuid = (namespace: string, table: string, sourceId: string): string => {
  if (UUID_PATTERN.test(sourceId)) return sourceId.toLowerCase();

  const seed = `${namespace}:${table}:${sourceId}`;
  const parts = [
    fnv1a(`${seed}:0`),
    fnv1a(`${seed}:1`),
    fnv1a(`${seed}:2`),
    fnv1a(`${seed}:3`)
  ].join('');

  return [
    parts.slice(0, 8),
    parts.slice(8, 12),
    `5${parts.slice(13, 16)}`,
    `${(parseInt(parts.slice(16, 17), 16) & 0x3 | 0x8).toString(16)}${parts.slice(17, 20)}`,
    parts.slice(20, 32)
  ].join('-');
};

const MATCH_TYPES = new Set(['League', 'Cup', 'Friendly']);
const isCompletedMatch = (game: WorkspaceBackupV4['core']['games'][number]) =>
  game.status === 'Completed' && MATCH_TYPES.has(game.type);

export const countCloudMigrationRecords = (backup: WorkspaceBackupV4): CloudMigrationCounts => {
  const completedGames = backup.core.games.filter(isCompletedMatch);
  const mvpHistoryAwards = backup.core.players.reduce(
    (total, player) => total + (player.mvpHistory?.length ?? 0),
    0
  );
  const gameMvpAwards = backup.core.games.filter(game => isCompletedMatch(game) && Boolean(game.mvpId)).length;
  const availabilityGroups = Object.keys(backup.featureState.availability).length;
  const availabilityResponses = Object.values(backup.featureState.availability).reduce(
    (total, responses) => total + Object.keys(responses).length,
    0
  );
  const weeklyTrainingDays = Object.keys(backup.featureState.weeklyTraining).length;
  const weeklyTrainingDrills = Object.values(backup.featureState.weeklyTraining).reduce(
    (total, drills) => total + drills.length,
    0
  );

  return {
    players: backup.core.players.length,
    staff: backup.core.staff.length,
    games: backup.core.games.length,
    matchResults: completedGames.length,
    matchScorerContributions: completedGames.reduce(
      (total, game) => total + (game.scorers?.length ?? 0),
      0
    ),
    mvpAwards: mvpHistoryAwards + gameMvpAwards,
    playerOffenses: backup.core.players.reduce(
      (total, player) => total + (player.offenses?.length ?? 0),
      0
    ),
    standings: backup.core.standings.length,
    bulletins: backup.core.announcements.length,
    assessments: backup.core.assessments.length,
    assessmentPlanWeeks: backup.core.assessments.reduce(
      (total, assessment) => total + (assessment.developmentPlan?.weeks.length ?? 0),
      0
    ),
    paymentLedgerEntries: backup.core.paymentLedger.length,
    availabilityGroups,
    availabilityResponses,
    coachNotes: Object.keys(backup.featureState.coachNotes).length,
    weeklyTrainingDays,
    weeklyTrainingDrills,
    standingsSnapshots: backup.featureState.standingsBackups.length,
    tacticsLineupAssignments: Object.keys(backup.featureState.tactics.lineup).length,
    tacticsNotes: backup.featureState.tactics.notes.length,
    tacticsDrawPaths: backup.featureState.tactics.drawings.length,
    tacticsPlayerExtras: Object.keys(backup.featureState.tactics.playerExtras).length
  };
};

const countPayloadTable = (payload: CloudImportPayload, table: string) =>
  payload.records.filter(record => record.table === table).length;

const migrationKey = (importId: string, table: string, sourceId: string) => `${importId}:${table}:${sourceId}`;

const record = (
  importId: string,
  table: string,
  sourceId: string,
  data: Record<string, unknown>
): CloudImportRecord => ({
  table,
  sourceId,
  idempotencyKey: migrationKey(importId, table, sourceId),
  data
});

export const createCloudImportPayload = (
  backup: WorkspaceBackupV4,
  manifest: CloudMigrationManifest
): CloudImportPayload => {
  const validated = workspaceBackupV4Schema.parse(backup);
  const parsedManifest = cloudMigrationManifestSchema.parse(manifest);
  const records: CloudImportRecord[] = [];
  const importId = parsedManifest.importId;
  // Namespace derived ids by the club, never by the import. Every backup run
  // mints a fresh importId, so seeding ids with it gave the same local player a
  // new cloud id each run and the id-keyed upsert inserted a duplicate instead
  // of updating the row.
  const idNamespace = parsedManifest.targetClubId;
  const clubId = toCloudUuid(idNamespace, 'clubs', parsedManifest.targetClubId);
  const sourceIdMap: Record<string, string> = {
    [`clubs:${parsedManifest.targetClubId}`]: clubId
  };

  const mapId = (table: string, sourceId: string | undefined): string | undefined => {
    if (!sourceId) return undefined;
    const key = `${table}:${sourceId}`;
    sourceIdMap[key] ??= toCloudUuid(idNamespace, table, sourceId);
    return sourceIdMap[key];
  };

  records.push(record(importId, 'clubs', parsedManifest.targetClubId, {
    id: clubId,
    name: validated.core.teamInfo.name,
    founded: validated.core.teamInfo.founded,
    stadium: validated.core.teamInfo.stadium,
    league: validated.core.teamInfo.league,
    logo_color: validated.core.teamInfo.logoColor,
    logo_url: validated.core.teamInfo.logoUrl,
    source_team_info: true
  }));

  for (const player of validated.core.players) {
    const playerId = mapId('players', player.id)!;
    records.push(record(importId, 'players', player.id, {
      id: playerId,
      club_id: clubId,
      name: player.name,
      roster_number: player.number,
      position: player.position,
      bio: player.bio,
      photo_url: player.photoUrl,
      age_snapshot: player.age,
      height: player.height,
      weight: player.weight,
      specialty_traits: player.specialtyTraits ?? [],
      coach_notes: player.coachNotes,
      date_of_birth: player.dateOfBirth,
      fprds_role: player.fprdsRole?.toLowerCase(),
      fprds_age_group_preference: player.fprdsAgeGroupPreference?.toLowerCase(),
      fprds_last_assessment_id: mapId('assessment_sessions', player.fprdsLastAssessmentId),
      games_played: player.gamesPlayed,
      goals: player.points,
      assists: player.assists,
      clean_sheets: player.cleanSheetsOrRebounds,
      minutes_played: player.minutesPlayed,
      mvp_awards: player.mvpAwards,
      yellow_cards: player.yellowCards,
      red_cards: player.redCards,
      base_attributes: player.baseAttributes,
      position_attributes: player.positionAttributes,
      registration_status: player.registrationStatus.toLowerCase()
    }));

    for (const offense of player.offenses ?? []) {
      const offenseId = mapId('player_offenses', offense.id)!;
      records.push(record(importId, 'player_offenses', offense.id, {
        id: offenseId,
        club_id: clubId,
        player_id: playerId,
        game_id: mapId('games', offense.gameId),
        game_opponent: offense.gameOpponent,
        offense_date: offense.date,
        card_type: offense.cardType,
        reason: offense.reason,
        match_minute: offense.matchMinute
      }));
    }

    for (const award of player.mvpHistory ?? []) {
      const awardId = mapId('mvp_awards', award.id)!;
      records.push(record(importId, 'mvp_awards', award.id, {
        id: awardId,
        club_id: clubId,
        player_id: playerId,
        player_name_snapshot: player.name,
        award_date: award.date,
        opponent: award.opponent,
        note: award.note,
        source: 'player_history'
      }));
    }
  }

  for (const staff of validated.core.staff) {
    const staffId = mapId('staff_members', staff.id)!;
    records.push(record(importId, 'staff_members', staff.id, {
      id: staffId,
      club_id: clubId,
      name: staff.name,
      role: staff.role,
      bio: staff.bio,
      photo_url: staff.photoUrl,
      email: staff.email,
      phone: staff.phone,
      since: staff.since,
      status: staff.status.toLowerCase()
    }));
  }

  for (const game of validated.core.games) {
    const gameId = mapId('games', game.id)!;
    records.push(record(importId, 'games', game.id, {
      id: gameId,
      club_id: clubId,
      opponent: game.opponent,
      event_date: game.date,
      event_time: game.time,
      location: game.location,
      status: game.status.toLowerCase(),
      type: game.type.toLowerCase(),
      our_score: game.ourScore,
      opponent_score: game.opponentScore,
      notes: game.notes
    }));

    if (isCompletedMatch(game)) {
      const resultId = `${game.id}:result`;
      const cloudResultId = mapId('match_results', resultId)!;
      records.push(record(importId, 'match_results', resultId, {
        id: cloudResultId,
        club_id: clubId,
        game_id: gameId,
        our_score: game.ourScore,
        opponent_score: game.opponentScore,
        notes: game.notes
      }));

      for (const [index, scorer] of (game.scorers ?? []).entries()) {
        const scorerId = `${game.id}:scorer:${index}`;
        const cloudScorerId = mapId('match_scorer_contributions', scorerId)!;
        records.push(record(importId, 'match_scorer_contributions', scorerId, {
          id: cloudScorerId,
          club_id: clubId,
          match_result_id: cloudResultId,
          player_id: mapId('players', scorer.playerId),
          player_name_snapshot: scorer.playerName,
          goal_count: scorer.count
        }));
      }

      if (game.mvpId) {
        const playerName = validated.core.players.find(player => player.id === game.mvpId)?.name ?? 'Unknown player';
        const awardId = `${game.id}:mvp`;
        const cloudAwardId = mapId('mvp_awards', awardId)!;
        records.push(record(importId, 'mvp_awards', awardId, {
          id: cloudAwardId,
          club_id: clubId,
          game_id: gameId,
          player_id: mapId('players', game.mvpId),
          player_name_snapshot: playerName,
          award_date: game.date,
          opponent: game.opponent,
          source: 'match_result'
        }));
      }
    }
  }

  for (const [index, standing] of validated.core.standings.entries()) {
    const sourceId = `${standing.teamName}:${index}`;
    const standingId = mapId('standings_rows', sourceId)!;
    records.push(record(importId, 'standings_rows', sourceId, {
      id: standingId,
      club_id: clubId,
      team_name: standing.teamName,
      rank: standing.rank,
      played: standing.played,
      won: standing.won,
      drawn: standing.drawn,
      lost: standing.lost,
      goals_for: standing.goalsFor,
      goals_against: standing.goalsAgainst,
      points: standing.points,
      is_user_team: standing.isUserTeam ?? false
    }));
  }

  for (const bulletin of validated.core.announcements) {
    const bulletinId = mapId('bulletins', bulletin.id)!;
    records.push(record(importId, 'bulletins', bulletin.id, {
      id: bulletinId,
      club_id: clubId,
      title: bulletin.title,
      content: bulletin.content,
      bulletin_date: bulletin.date,
      category: bulletin.category.toLowerCase(),
      author_snapshot: bulletin.author
    }));
  }

  for (const assessment of validated.core.assessments) {
    const assessmentId = mapId('assessment_sessions', assessment.id)!;
    records.push(record(importId, 'assessment_sessions', assessment.id, {
      id: assessmentId,
      club_id: clubId,
      player_id: mapId('players', assessment.playerId),
      assessment_date: assessment.assessmentDate,
      assessment_type: assessment.assessmentType.toLowerCase(),
      age_group: assessment.ageGroup.toLowerCase(),
      role: assessment.role.toLowerCase(),
      ovr: assessment.ovr,
      weakest_attribute_id: assessment.labels.weakestAttributeId,
      ovr_tier_label: assessment.labels.ovrTierLabel,
      previous_session_id: mapId('assessment_sessions', assessment.deltas.previousSessionId),
      benchmark_version: CLOUD_MIGRATION_SCHEMA_VERSION,
      weighting_version: CLOUD_MIGRATION_SCHEMA_VERSION,
      scoring_algorithm_version: CLOUD_MIGRATION_SCHEMA_VERSION,
      raw_results: assessment.rawResults,
      attribute_scores: assessment.attributeScores,
      attribute_deltas: assessment.deltas.attributeDeltas
    }));

    for (const week of assessment.developmentPlan?.weeks ?? []) {
      const weekId = `${assessment.id}:plan-week:${week.weekNumber}`;
      const cloudWeekId = mapId('assessment_development_plan_weeks', weekId)!;
      records.push(record(importId, 'assessment_development_plan_weeks', weekId, {
        id: cloudWeekId,
        club_id: clubId,
        assessment_session_id: assessmentId,
        focus_attribute_id: assessment.developmentPlan?.focusAttributeId,
        priority_score: assessment.developmentPlan?.priorityScore,
        week_number: week.weekNumber,
        focus: week.focus,
        drill_ids: week.drillIds,
        notes: week.notes
      }));
    }
  }

  for (const entry of validated.core.paymentLedger) {
    const entryId = mapId('payment_ledger_entries', entry.id)!;
    records.push(record(importId, 'payment_ledger_entries', entry.id, {
      id: entryId,
      club_id: clubId,
      player_id: mapId('players', entry.playerId),
      player_name_snapshot: entry.playerNameSnapshot,
      entry_type: entry.type,
      category: entry.category,
      amount: entry.amount,
      currency: 'PHP',
      entry_date: entry.date,
      due_date: entry.dueDate,
      method: entry.method,
      reference: entry.reference,
      note: entry.note,
      voided_at: entry.voidedAt,
      void_reason: entry.voidReason
    }));
  }

  for (const [eventId, responses] of Object.entries(validated.featureState.availability)) {
    for (const [playerId, status] of Object.entries(responses)) {
      const sourceId = `${eventId}:${playerId}`;
      const availabilityId = mapId('player_availability', sourceId)!;
      records.push(record(importId, 'player_availability', sourceId, {
        id: availabilityId,
        club_id: clubId,
        event_id: eventId,
        player_id: mapId('players', playerId),
        status
      }));
    }
  }

  for (const [subjectId, note] of Object.entries(validated.featureState.coachNotes)) {
    const noteId = mapId('coach_notes', subjectId)!;
    records.push(record(importId, 'coach_notes', subjectId, {
      id: noteId,
      club_id: clubId,
      subject_id: subjectId,
      note
    }));
  }

  const weeklyScheduleId = mapId('weekly_training_schedules', 'current')!;
  records.push(record(importId, 'weekly_training_schedules', 'current', {
    id: weeklyScheduleId,
    club_id: clubId,
    schedule: validated.featureState.weeklyTraining
  }));

  for (const snapshot of validated.featureState.standingsBackups) {
    const snapshotId = mapId('standings_snapshots', snapshot.id)!;
    records.push(record(importId, 'standings_snapshots', snapshot.id, {
      id: snapshotId,
      club_id: clubId,
      label: snapshot.label,
      source: snapshot.source,
      snapshot_rows: snapshot.standings,
      created_at: snapshot.createdAt
    }));
  }

  const tacticsWorkspaceId = mapId('tactics_workspaces', 'current')!;
  records.push(record(importId, 'tactics_workspaces', 'current', {
    id: tacticsWorkspaceId,
    club_id: clubId,
    match_format: validated.featureState.tactics.matchFormat,
    formation: validated.featureState.tactics.formation,
    playstyle: validated.featureState.tactics.playstyle,
    is_custom_strategy: validated.featureState.tactics.isCustomStrategy,
    custom_playstyle_value: validated.featureState.tactics.customPlaystyle,
    custom_defensive_value: validated.featureState.tactics.customDefensiveStyle,
    custom_mentality_value: validated.featureState.tactics.customMentality,
    custom_strategy_notes: validated.featureState.tactics.customStrategyNotes,
    coach_level: validated.featureState.tactics.coachLevel,
    captain_player_id: mapId('players', validated.featureState.tactics.captainId || undefined),
    penalty_taker_player_id: mapId('players', validated.featureState.tactics.penaltyTakerId || undefined),
    free_kick_taker_player_id: mapId('players', validated.featureState.tactics.freeKickTakerId || undefined),
    corner_taker_player_id: mapId('players', validated.featureState.tactics.cornerTakerId || undefined),
    defensive_style: validated.featureState.tactics.defensiveStyle,
    custom_playstyles: validated.featureState.tactics.customPlaystyles
  }));

  for (const [slotId, assignment] of Object.entries(validated.featureState.tactics.lineup)) {
    const assignmentId = mapId('tactics_lineup_assignments', slotId)!;
    records.push(record(importId, 'tactics_lineup_assignments', slotId, {
      id: assignmentId,
      club_id: clubId,
      tactics_workspace_id: tacticsWorkspaceId,
      slot_id: slotId,
      player_id: mapId('players', assignment.id),
      player_name_snapshot: assignment.name,
      position_snapshot: assignment.position,
      rating_snapshot: assignment.rating,
      condition_snapshot: assignment.condition
    }));
  }

  for (const [index, drawing] of validated.featureState.tactics.drawings.entries()) {
    const sourceId = `drawing:${index}`;
    const drawingId = mapId('tactics_draw_paths', sourceId)!;
    records.push(record(importId, 'tactics_draw_paths', sourceId, {
      id: drawingId,
      club_id: clubId,
      tactics_workspace_id: tacticsWorkspaceId,
      path_order: index,
      color: drawing.color,
      width: drawing.width,
      points: drawing.points
    }));
  }

  for (const note of validated.featureState.tactics.notes) {
    const noteId = mapId('tactics_notes', note.id)!;
    records.push(record(importId, 'tactics_notes', note.id, {
      id: noteId,
      club_id: clubId,
      title: note.title,
      content: note.content,
      category: note.category,
      created_at: note.createdAt
    }));
  }

  for (const [playerId, extras] of Object.entries(validated.featureState.tactics.playerExtras)) {
    const extrasId = mapId('tactics_player_extras', playerId)!;
    records.push(record(importId, 'tactics_player_extras', playerId, {
      id: extrasId,
      club_id: clubId,
      player_id: mapId('players', playerId),
      status: extras.status,
      yellow_cards: extras.yellowCards,
      red_cards: extras.redCards
    }));
  }

  return {
    importId,
    clubId,
    manifest: parsedManifest,
    sourceIdMap,
    records
  };
};

const finding = (
  code: string,
  status: Exclude<CloudMigrationVerificationStatus, 'passed'>,
  message: string
): CloudMigrationVerificationFinding => ({ code, status, message });

export const verifyCloudMigrationPackage = (
  migration: CloudMigrationPackage,
  checkedAt = new Date().toISOString()
): CloudMigrationVerificationReport => {
  const findings: CloudMigrationVerificationFinding[] = [];
  const backup = workspaceBackupV4Schema.parse(migration.backup);
  const manifest = cloudMigrationManifestSchema.parse(migration.manifest);
  const payload = migration.payload;

  if (migration.state !== 'manifest_ready') {
    findings.push(finding(
      'MIGRATION_STATE_NOT_READY',
      'failed',
      'The migration package is not ready for upload.'
    ));
  }

  if (payload.importId !== manifest.importId) {
    findings.push(finding(
      'PAYLOAD_IMPORT_ID_MISMATCH',
      'failed',
      'The import payload does not match the manifest import ID.'
    ));
  }

  if (payload.clubId !== toCloudUuid(manifest.targetClubId, 'clubs', manifest.targetClubId)) {
    findings.push(finding(
      'PAYLOAD_CLUB_ID_MISMATCH',
      'failed',
      'The import payload does not target the mapped manifest club ID.'
    ));
  }

  if (manifest.hashes.workspace !== createContentFingerprint(backup)) {
    findings.push(finding(
      'WORKSPACE_HASH_MISMATCH',
      'failed',
      'The backup content no longer matches the migration manifest.'
    ));
  }

  if (manifest.hashes.core !== createContentFingerprint(backup.core)) {
    findings.push(finding(
      'CORE_HASH_MISMATCH',
      'failed',
      'The core workspace content no longer matches the migration manifest.'
    ));
  }

  if (manifest.hashes.featureState !== createContentFingerprint(backup.featureState)) {
    findings.push(finding(
      'FEATURE_STATE_HASH_MISMATCH',
      'failed',
      'The feature-state content no longer matches the migration manifest.'
    ));
  }

  const expectedCounts = countCloudMigrationRecords(backup);
  for (const key of Object.keys(expectedCounts) as Array<keyof CloudMigrationCounts>) {
    if (manifest.counts[key] !== expectedCounts[key]) {
      findings.push(finding(
        `MANIFEST_COUNT_${key.toUpperCase()}_MISMATCH`,
        'failed',
        `The manifest ${key} count is ${manifest.counts[key]}, but the backup requires ${expectedCounts[key]}.`
      ));
    }
  }

  const sourceIdChecks: Array<[keyof CloudMigrationManifest['sourceIds'], string[]]> = [
    ['players', backup.core.players.map(player => player.id).sort()],
    ['staff', backup.core.staff.map(staff => staff.id).sort()],
    ['games', backup.core.games.map(game => game.id).sort()],
    ['assessments', backup.core.assessments.map(assessment => assessment.id).sort()],
    ['paymentLedgerEntries', backup.core.paymentLedger.map(entry => entry.id).sort()]
  ];

  for (const [key, expected] of sourceIdChecks) {
    if (canonicalize(manifest.sourceIds[key]) !== canonicalize(expected)) {
      findings.push(finding(
        `SOURCE_IDS_${key.toUpperCase()}_MISMATCH`,
        'failed',
        `The manifest ${key} source IDs do not match the backup.`
      ));
    }
  }

  const tableCountChecks: Array<[keyof CloudMigrationCounts, string]> = [
    ['players', 'players'],
    ['staff', 'staff_members'],
    ['games', 'games'],
    ['matchResults', 'match_results'],
    ['matchScorerContributions', 'match_scorer_contributions'],
    ['mvpAwards', 'mvp_awards'],
    ['playerOffenses', 'player_offenses'],
    ['standings', 'standings_rows'],
    ['bulletins', 'bulletins'],
    ['assessments', 'assessment_sessions'],
    ['assessmentPlanWeeks', 'assessment_development_plan_weeks'],
    ['paymentLedgerEntries', 'payment_ledger_entries'],
    ['availabilityResponses', 'player_availability'],
    ['coachNotes', 'coach_notes'],
    ['standingsSnapshots', 'standings_snapshots'],
    ['tacticsLineupAssignments', 'tactics_lineup_assignments'],
    ['tacticsNotes', 'tactics_notes'],
    ['tacticsDrawPaths', 'tactics_draw_paths'],
    ['tacticsPlayerExtras', 'tactics_player_extras']
  ];

  for (const [countKey, table] of tableCountChecks) {
    const actual = countPayloadTable(payload, table);
    if (actual !== expectedCounts[countKey]) {
      findings.push(finding(
        `PAYLOAD_TABLE_${table.toUpperCase()}_COUNT_MISMATCH`,
        'failed',
        `The ${table} payload has ${actual} records, but the manifest requires ${expectedCounts[countKey]}.`
      ));
    }
  }

  if (countPayloadTable(payload, 'clubs') !== 1) {
    findings.push(finding(
      'PAYLOAD_CLUB_RECORD_MISSING',
      'failed',
      'The import payload must contain exactly one club record.'
    ));
  }

  if (countPayloadTable(payload, 'weekly_training_schedules') !== 1) {
    findings.push(finding(
      'PAYLOAD_WEEKLY_TRAINING_RECORD_MISSING',
      'failed',
      'The import payload must contain one current weekly training schedule record.'
    ));
  }

  if (countPayloadTable(payload, 'tactics_workspaces') !== 1) {
    findings.push(finding(
      'PAYLOAD_TACTICS_WORKSPACE_RECORD_MISSING',
      'failed',
      'The import payload must contain one tactics workspace record.'
    ));
  }

  const idempotencyKeys = new Set<string>();
  for (const payloadRecord of payload.records) {
    const expectedKey = migrationKey(manifest.importId, payloadRecord.table, payloadRecord.sourceId);
    if (payloadRecord.idempotencyKey !== expectedKey) {
      findings.push(finding(
        'PAYLOAD_IDEMPOTENCY_KEY_INVALID',
        'failed',
        `The ${payloadRecord.table} record ${payloadRecord.sourceId} has an invalid idempotency key.`
      ));
    }
    if (idempotencyKeys.has(payloadRecord.idempotencyKey)) {
      findings.push(finding(
        'PAYLOAD_IDEMPOTENCY_KEY_DUPLICATE',
        'failed',
        `The idempotency key ${payloadRecord.idempotencyKey} appears more than once.`
      ));
    }
    idempotencyKeys.add(payloadRecord.idempotencyKey);
  }

  const status = findings.some(item => item.status === 'failed')
    ? 'failed'
    : findings.some(item => item.status === 'warning')
      ? 'warning'
      : 'passed';

  return { status, checkedAt, findings };
};

export const getCloudMigrationActivationDecision = (
  report: CloudMigrationVerificationReport
): CloudMigrationActivationDecision => {
  if (report.status === 'passed') return { canActivate: true };
  if (report.status === 'warning') {
    return {
      canActivate: false,
      reason: 'Cloud activation is blocked until migration warnings are reviewed.'
    };
  }
  return {
    canActivate: false,
    reason: 'Cloud activation is blocked because migration verification failed.'
  };
};

export const restoreCloudMigrationRollback = (
  migration: Pick<CloudMigrationPackage, 'rollback'>,
  storage: StorageLike,
  restoredAt = new Date().toISOString()
): CloudMigrationRollbackResult => {
  const rollbackBackup = workspaceBackupV4Schema.parse(migration.rollback.backup);
  applyWorkspaceBackup(rollbackBackup, storage);

  return {
    state: 'rolled_back',
    restoredAt,
    sourceExportedAt: rollbackBackup.exportedAt
  };
};

export const createCloudMigrationManifest = (
  backup: WorkspaceBackupV4,
  options: CreateCloudMigrationPackageOptions
): CloudMigrationManifest => {
  const validated = workspaceBackupV4Schema.parse(backup);

  return cloudMigrationManifestSchema.parse({
    importId: options.importId,
    sourceFormat: 'dumala-workspace',
    sourceVersion: 4,
    sourceExportedAt: validated.exportedAt,
    sourceDeviceId: options.sourceDeviceId,
    targetClubId: options.targetClubId,
    appVersion: options.appVersion,
    schemaVersion: CLOUD_MIGRATION_SCHEMA_VERSION,
    counts: countCloudMigrationRecords(validated),
    sourceIds: {
      players: validated.core.players.map(player => player.id).sort(),
      staff: validated.core.staff.map(staff => staff.id).sort(),
      games: validated.core.games.map(game => game.id).sort(),
      assessments: validated.core.assessments.map(assessment => assessment.id).sort(),
      paymentLedgerEntries: validated.core.paymentLedger.map(entry => entry.id).sort()
    },
    hashes: {
      workspace: createContentFingerprint(validated),
      core: createContentFingerprint(validated.core),
      featureState: createContentFingerprint(validated.featureState)
    }
  });
};

export const createCloudMigrationPackage = (
  core: CoreWorkspace,
  storage: StorageLike,
  options: CreateCloudMigrationPackageOptions
): CloudMigrationPackage => {
  const backup = createWorkspaceBackup(core, storage, options.exportedAt);
  const manifest = createCloudMigrationManifest(backup, options);
  const payload = createCloudImportPayload(backup, manifest);

  return {
    state: 'manifest_ready',
    backup,
    manifest,
    payload,
    rollback: {
      state: 'backup_created',
      backup,
      createdAt: backup.exportedAt
    }
  };
};
