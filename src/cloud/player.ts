import type { SupabaseClient } from '@supabase/supabase-js';
import type { DumalaSupabaseClient } from './client';
import type { AgeGroup, AssessmentRawResults, AssessmentSession, FprdsAttributeId, FprdsRole, Player } from '../types';

// Phase 6 - Player foundation. Cloud-first player data: a personal profile with
// guardian consent for minors, an invite-and-claim flow (player requests to join
// a club, a coach approves and links the account to a roster entry), and
// read-only access to the linked club's schedule.

export type GuardianConsentState = 'not_required' | 'pending' | 'granted' | 'revoked';
export type PlayerLinkRequestStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

export interface PlayerProfile {
  user_id: string;
  display_name: string | null;
  date_of_birth: string | null;
  position: string | null;
  height: number | null;
  weight: number | null;
  bio: string | null;
  avatar_url: string | null;
  guardian_name: string | null;
  guardian_email: string | null;
  guardian_relationship: string | null;
  guardian_consent_state: GuardianConsentState;
  guardian_consent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlayerProfileInput {
  displayName?: string | null;
  dateOfBirth?: string | null;
  position?: string | null;
  height?: number | null;
  weight?: number | null;
  bio?: string | null;
  avatarUrl?: string | null;
}

export interface GuardianConsentInput {
  guardianName: string;
  guardianEmail?: string | null;
  guardianRelationship?: string | null;
}

export interface PlayerLinkRequest {
  id: string;
  requester_user_id: string;
  club_id: string;
  target_player_id: string | null;
  claimed_name: string;
  claimed_roster_number: number | null;
  message: string | null;
  status: PlayerLinkRequestStatus;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  resulting_link_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlayerClubLink {
  id: string;
  user_id: string;
  club_id: string;
  player_id: string;
  state: 'active' | 'removed';
  linked_by: string | null;
  linked_at: string;
  created_at: string;
  updated_at: string;
}

export interface TeamScheduleEntry {
  id: string;
  club_id: string;
  opponent: string;
  event_date: string;
  event_time: string;
  location: string;
  status: string;
  type: string;
  our_score: number | null;
  opponent_score: number | null;
  notes: string | null;
}

export interface TeamTacticsSummary {
  id: string;
  club_id: string;
  match_format: string;
  formation: string;
  playstyle: string;
  defensive_style: string | null;
  is_custom_strategy: boolean;
  custom_playstyle_value: string | null;
  custom_defensive_value: string | null;
  custom_mentality_value: string | null;
  custom_strategy_notes: string | null;
  updated_at: string;
}

export interface PlayerDrillCompletion {
  id: string;
  user_id: string;
  drill_id: string;
  completed_at: string;
  duration_seconds: number | null;
  perceived_exertion: number | null;
  notes: string | null;
  created_at: string;
}

export interface DrillCompletionInput {
  drillId: string;
  durationSeconds?: number | null;
  perceivedExertion?: number | null;
  notes?: string | null;
}

export interface PlayerWorkoutSession {
  id: string;
  user_id: string;
  kind: 'stopwatch' | 'countdown' | 'interval';
  label: string | null;
  total_seconds: number;
  rounds: unknown;
  completed_at: string;
  notes: string | null;
  created_at: string;
}

export interface WorkoutSessionInput {
  kind: 'stopwatch' | 'countdown' | 'interval';
  totalSeconds: number;
  label?: string | null;
  rounds?: unknown;
  notes?: string | null;
}

export interface PlayerNotification {
  id: string;
  user_id: string;
  type: 'welcome' | 'link_approved' | 'link_rejected' | 'system';
  title: string;
  body: string;
  related: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface RequestPlayerLinkInput {
  joinCode: string;
  claimedName: string;
  claimedRosterNumber?: number | null;
  message?: string | null;
}

const asUntypedClient = (client: DumalaSupabaseClient): SupabaseClient => client as unknown as SupabaseClient;

const getErrorMessage = (error: unknown) => {
  if (!error) return 'Unknown Supabase error.';
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message);
  return String(error);
};

export class CloudPlayerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'CloudPlayerError';
  }
}

const expectNoError = <Data>(
  result: { data: Data; error: unknown },
  code: string,
  message: string
): Data => {
  if (result.error) throw new CloudPlayerError(`${message}: ${getErrorMessage(result.error)}`, code, result.error);
  return result.data;
};

// --- Pure helper (unit-testable without a client) ----------------------------

/** True when the given date of birth is under 18 as of `now`. */
export const computeIsMinor = (dateOfBirth: string | null | undefined, now: Date = new Date()): boolean => {
  if (!dateOfBirth) return false;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return false;
  const eighteenth = new Date(dob.getFullYear() + 18, dob.getMonth(), dob.getDate());
  return now < eighteenth;
};

const profileRow = (input: PlayerProfileInput) => ({
  display_name: input.displayName?.trim() || null,
  date_of_birth: input.dateOfBirth || null,
  position: input.position?.trim() || null,
  height: input.height ?? null,
  weight: input.weight ?? null,
  bio: input.bio?.trim() || null,
  avatar_url: input.avatarUrl?.trim() || null
});

// --- Player-facing operations ------------------------------------------------

export const getMyPlayerProfile = async (
  client: DumalaSupabaseClient,
  userId: string
): Promise<PlayerProfile | null> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase.from('player_profiles').select('*').eq('user_id', userId).maybeSingle(),
    'PLAYER_PROFILE_READ_FAILED',
    'Failed to load your player profile'
  ) as PlayerProfile | null) ?? null;
};

export const upsertMyPlayerProfile = async (
  client: DumalaSupabaseClient,
  userId: string,
  input: PlayerProfileInput
): Promise<PlayerProfile> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase
      .from('player_profiles')
      .upsert({ user_id: userId, ...profileRow(input) }, { onConflict: 'user_id' })
      .select('*')
      .single(),
    'PLAYER_PROFILE_SAVE_FAILED',
    'Failed to save your player profile'
  ) as PlayerProfile;
};

export const setGuardianConsent = async (
  client: DumalaSupabaseClient,
  input: GuardianConsentInput
): Promise<GuardianConsentState> => {
  const supabase = asUntypedClient(client);
  const data = expectNoError(
    await supabase.rpc('set_guardian_consent', {
      p_guardian_name: input.guardianName.trim(),
      p_guardian_email: input.guardianEmail?.trim() || null,
      p_guardian_relationship: input.guardianRelationship?.trim() || null
    }),
    'GUARDIAN_CONSENT_FAILED',
    'Failed to record guardian consent'
  );
  return (typeof data === 'string' ? data : 'granted') as GuardianConsentState;
};

export const requestPlayerLink = async (
  client: DumalaSupabaseClient,
  input: RequestPlayerLinkInput
): Promise<string> => {
  const supabase = asUntypedClient(client);
  const data = expectNoError(
    await supabase.rpc('request_player_link', {
      join_code: input.joinCode.trim().toUpperCase(),
      claimed_name: input.claimedName.trim(),
      claimed_roster_number: input.claimedRosterNumber ?? null,
      message: input.message?.trim() || null
    }),
    'PLAYER_LINK_REQUEST_FAILED',
    'Failed to submit your join request'
  );
  return String(data);
};

export const withdrawPlayerLinkRequest = async (
  client: DumalaSupabaseClient,
  requestId: string
): Promise<void> => {
  const supabase = asUntypedClient(client);
  expectNoError(
    await supabase.rpc('withdraw_player_link_request', { request_id: requestId }),
    'PLAYER_LINK_WITHDRAW_FAILED',
    'Failed to withdraw your request'
  );
};

export const listMyLinkRequests = async (client: DumalaSupabaseClient): Promise<PlayerLinkRequest[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase.from('player_link_requests').select('*').order('created_at', { ascending: false }),
    'PLAYER_LINK_REQUESTS_READ_FAILED',
    'Failed to load your join requests'
  ) as PlayerLinkRequest[] | null) ?? [];
};

export const listMyPlayerLinks = async (client: DumalaSupabaseClient): Promise<PlayerClubLink[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase.from('player_club_links').select('*').eq('state', 'active'),
    'PLAYER_LINKS_READ_FAILED',
    'Failed to load your teams'
  ) as PlayerClubLink[] | null) ?? [];
};

export const listMyTeamSchedule = async (
  client: DumalaSupabaseClient,
  clubId: string
): Promise<TeamScheduleEntry[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase
      .from('games')
      .select('id, club_id, opponent, event_date, event_time, location, status, type, our_score, opponent_score, notes')
      .eq('club_id', clubId)
      .order('event_date', { ascending: true }),
    'TEAM_SCHEDULE_READ_FAILED',
    'Failed to load the team schedule'
  ) as TeamScheduleEntry[] | null) ?? [];
};

export const getMyTeamTacticsSummary = async (
  client: DumalaSupabaseClient,
  clubId: string
): Promise<TeamTacticsSummary | null> => {
  const supabase = asUntypedClient(client);
  const rows = (expectNoError(
    await supabase
      .from('tactics_workspaces')
      .select('id, club_id, match_format, formation, playstyle, defensive_style, is_custom_strategy, custom_playstyle_value, custom_defensive_value, custom_mentality_value, custom_strategy_notes, updated_at')
      .eq('club_id', clubId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(1),
    'TEAM_TACTICS_READ_FAILED',
    'Failed to load the team setup'
  ) as TeamTacticsSummary[] | null) ?? [];
  return rows[0] ?? null;
};

// --- Coach-facing operations -------------------------------------------------

export const getOrCreateClubJoinCode = async (
  client: DumalaSupabaseClient,
  clubId: string
): Promise<string> => {
  const supabase = asUntypedClient(client);
  const data = expectNoError(
    await supabase.rpc('get_or_create_club_join_code', { target_club_id: clubId }),
    'CLUB_JOIN_CODE_FAILED',
    'Failed to load the club join code'
  );
  return String(data);
};

export interface ClubRosterPlayer {
  id: string;
  name: string;
  roster_number: number;
  position: string;
  bio?: string;
  photo_url: string;
  date_of_birth?: string | null;
  height?: number | null;
  weight?: number | null;
  fprds_role?: FprdsRole | null;
  fprds_age_group_preference?: AgeGroup | null;
  fprds_last_assessment_id?: string | null;
  games_played: number;
  goals: number;
  assists: number;
  clean_sheets: number;
  minutes_played: number;
  yellow_cards: number;
  red_cards: number;
  base_attributes: unknown;
  position_attributes: unknown;
  specialty_traits: unknown;
}

type CloudAssessmentSessionRow = {
  id: string;
  player_id: string;
  assessment_date: string;
  assessment_type: string;
  age_group: string;
  role: string;
  ovr: number;
  weakest_attribute_id: string;
  ovr_tier_label: string;
  previous_session_id: string | null;
  benchmark_version: string | null;
  raw_results: unknown;
  attribute_scores: unknown;
  attribute_deltas: unknown;
  created_at: string;
};

const upperEnum = <T extends string>(value: string): T => value.toUpperCase() as T;
const titleEnum = <T extends string>(value: string): T => (
  value ? `${value.charAt(0).toUpperCase()}${value.slice(1).toLowerCase()}` : value
) as T;
const numericRecord = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1]))
  );
};
const stringArray = (value: unknown): string[] => (
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0) : []
);

export const mapCloudAssessmentSession = (row: CloudAssessmentSessionRow): AssessmentSession => ({
  id: row.id,
  playerId: row.player_id,
  assessmentDate: row.assessment_date,
  createdAt: row.created_at,
  assessmentType: titleEnum(row.assessment_type),
  ageGroup: upperEnum(row.age_group),
  role: upperEnum(row.role),
  rawResults: row.raw_results as AssessmentRawResults,
  attributeScores: numericRecord(row.attribute_scores) as Record<FprdsAttributeId, number>,
  ovr: Math.round(Number(row.ovr)),
  labels: {
    weakestAttributeId: row.weakest_attribute_id as FprdsAttributeId,
    ovrTierLabel: row.ovr_tier_label
  },
  deltas: {
    previousSessionId: row.previous_session_id ?? undefined,
    attributeDeltas: numericRecord(row.attribute_deltas) as Partial<Record<FprdsAttributeId, number>>
  },
  benchmarkVersion: row.benchmark_version ?? undefined
});

export const mapRosterPlayerToReportPlayer = (player: ClubRosterPlayer): Player => ({
  id: player.id,
  name: player.name,
  number: player.roster_number,
  position: player.position,
  bio: player.bio ?? '',
  photoUrl: player.photo_url,
  dateOfBirth: player.date_of_birth ?? undefined,
  height: player.height ?? undefined,
  weight: player.weight ?? undefined,
  fprdsRole: player.fprds_role ?? undefined,
  fprdsAgeGroupPreference: player.fprds_age_group_preference ?? undefined,
  fprdsLastAssessmentId: player.fprds_last_assessment_id ?? undefined,
  gamesPlayed: player.games_played,
  points: player.goals,
  assists: player.assists,
  cleanSheetsOrRebounds: player.clean_sheets,
  minutesPlayed: player.minutes_played,
  mvpAwards: 0,
  yellowCards: player.yellow_cards,
  redCards: player.red_cards,
  baseAttributes: {
    pace: numericRecord(player.base_attributes).pace ?? 50,
    stamina: numericRecord(player.base_attributes).stamina ?? 50,
    agility: numericRecord(player.base_attributes).agility ?? 50,
    strength: numericRecord(player.base_attributes).strength ?? 50,
    firstTouch: numericRecord(player.base_attributes).firstTouch ?? 50,
    shortPassing: numericRecord(player.base_attributes).shortPassing ?? 50
  },
  positionAttributes: numericRecord(player.position_attributes),
  specialtyTraits: stringArray(player.specialty_traits),
  registrationStatus: 'Active'
});

export const listClubRosterPlayers = async (
  client: DumalaSupabaseClient,
  clubId: string
): Promise<ClubRosterPlayer[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase
      .from('players')
      .select('id, name, roster_number, position, bio, photo_url, date_of_birth, height, weight, fprds_role, fprds_age_group_preference, fprds_last_assessment_id, games_played, goals, assists, clean_sheets, minutes_played, yellow_cards, red_cards, base_attributes, position_attributes, specialty_traits')
      .eq('club_id', clubId)
      .is('deleted_at', null)
      .order('roster_number', { ascending: true }),
    'CLUB_ROSTER_READ_FAILED',
    'Failed to load the club roster'
  ) as ClubRosterPlayer[] | null) ?? [];
};

export const listMyAssessmentSessions = async (
  client: DumalaSupabaseClient,
  playerId: string
): Promise<AssessmentSession[]> => {
  const supabase = asUntypedClient(client);
  const rows = (expectNoError(
    await supabase
      .from('assessment_sessions')
      .select('id, player_id, assessment_date, assessment_type, age_group, role, ovr, weakest_attribute_id, ovr_tier_label, previous_session_id, benchmark_version, raw_results, attribute_scores, attribute_deltas, created_at')
      .eq('player_id', playerId)
      .is('deleted_at', null)
      .order('assessment_date', { ascending: false }),
    'PLAYER_ASSESSMENTS_READ_FAILED',
    'Failed to load your FPRDS assessments'
  ) as CloudAssessmentSessionRow[] | null) ?? [];
  return rows.map(mapCloudAssessmentSession);
};

export const listClubLinkRequests = async (
  client: DumalaSupabaseClient,
  clubId: string
): Promise<PlayerLinkRequest[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase
      .from('player_link_requests')
      .select('*')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false }),
    'CLUB_LINK_REQUESTS_READ_FAILED',
    'Failed to load player join requests'
  ) as PlayerLinkRequest[] | null) ?? [];
};

export const approvePlayerLink = async (
  client: DumalaSupabaseClient,
  requestId: string,
  targetPlayerId: string
): Promise<string> => {
  const supabase = asUntypedClient(client);
  const data = expectNoError(
    await supabase.rpc('approve_player_link', { request_id: requestId, p_target_player_id: targetPlayerId }),
    'PLAYER_LINK_APPROVE_FAILED',
    'Failed to approve the request'
  );
  return String(data);
};

export const rejectPlayerLink = async (
  client: DumalaSupabaseClient,
  requestId: string,
  reason?: string | null
): Promise<void> => {
  const supabase = asUntypedClient(client);
  expectNoError(
    await supabase.rpc('reject_player_link', { request_id: requestId, reason: reason?.trim() || null }),
    'PLAYER_LINK_REJECT_FAILED',
    'Failed to reject the request'
  );
};

// --- Self-reported activity: drills, favorites, workouts ---------------------

export const logDrillCompletion = async (
  client: DumalaSupabaseClient,
  userId: string,
  input: DrillCompletionInput
): Promise<PlayerDrillCompletion> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase
      .from('player_drill_completions')
      .insert({
        user_id: userId,
        drill_id: input.drillId,
        duration_seconds: input.durationSeconds ?? null,
        perceived_exertion: input.perceivedExertion ?? null,
        notes: input.notes?.trim() || null
      })
      .select('*')
      .single(),
    'DRILL_COMPLETION_FAILED',
    'Failed to log your drill'
  ) as PlayerDrillCompletion;
};

export const listDrillCompletions = async (
  client: DumalaSupabaseClient,
  limit = 200
): Promise<PlayerDrillCompletion[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase
      .from('player_drill_completions')
      .select('*')
      .order('completed_at', { ascending: false })
      .limit(limit),
    'DRILL_COMPLETIONS_READ_FAILED',
    'Failed to load your drill history'
  ) as PlayerDrillCompletion[] | null) ?? [];
};

export const listFavorites = async (client: DumalaSupabaseClient): Promise<string[]> => {
  const supabase = asUntypedClient(client);
  const rows = (expectNoError(
    await supabase.from('player_drill_favorites').select('drill_id'),
    'FAVORITES_READ_FAILED',
    'Failed to load your favorites'
  ) as Array<{ drill_id: string }> | null) ?? [];
  return rows.map(row => row.drill_id);
};

export const toggleDrillFavorite = async (
  client: DumalaSupabaseClient,
  userId: string,
  drillId: string,
  isFavorite: boolean
): Promise<void> => {
  const supabase = asUntypedClient(client);
  if (isFavorite) {
    expectNoError(
      await supabase.from('player_drill_favorites').delete().eq('user_id', userId).eq('drill_id', drillId),
      'FAVORITE_REMOVE_FAILED',
      'Failed to remove the favorite'
    );
  } else {
    expectNoError(
      await supabase.from('player_drill_favorites').insert({ user_id: userId, drill_id: drillId }),
      'FAVORITE_ADD_FAILED',
      'Failed to save the favorite'
    );
  }
};

export const saveWorkoutSession = async (
  client: DumalaSupabaseClient,
  userId: string,
  input: WorkoutSessionInput
): Promise<PlayerWorkoutSession> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase
      .from('player_workout_sessions')
      .insert({
        user_id: userId,
        kind: input.kind,
        label: input.label?.trim() || null,
        total_seconds: Math.max(0, Math.round(input.totalSeconds)),
        rounds: input.rounds ?? [],
        notes: input.notes?.trim() || null
      })
      .select('*')
      .single(),
    'WORKOUT_SAVE_FAILED',
    'Failed to save your workout'
  ) as PlayerWorkoutSession;
};

export const listWorkoutSessions = async (
  client: DumalaSupabaseClient,
  limit = 100
): Promise<PlayerWorkoutSession[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase
      .from('player_workout_sessions')
      .select('*')
      .order('completed_at', { ascending: false })
      .limit(limit),
    'WORKOUTS_READ_FAILED',
    'Failed to load your workouts'
  ) as PlayerWorkoutSession[] | null) ?? [];
};

// --- Notifications -----------------------------------------------------------

export const listNotifications = async (
  client: DumalaSupabaseClient,
  limit = 50
): Promise<PlayerNotification[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase
      .from('player_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit),
    'NOTIFICATIONS_READ_FAILED',
    'Failed to load your notifications'
  ) as PlayerNotification[] | null) ?? [];
};

export const markNotificationRead = async (
  client: DumalaSupabaseClient,
  notificationId: string
): Promise<void> => {
  const supabase = asUntypedClient(client);
  expectNoError(
    await supabase.from('player_notifications').update({ read_at: new Date().toISOString() }).eq('id', notificationId),
    'NOTIFICATION_READ_FAILED',
    'Failed to update the notification'
  );
};

export const markAllNotificationsRead = async (
  client: DumalaSupabaseClient,
  userId: string
): Promise<void> => {
  const supabase = asUntypedClient(client);
  expectNoError(
    await supabase
      .from('player_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null),
    'NOTIFICATIONS_READ_ALL_FAILED',
    'Failed to update notifications'
  );
};

// --- Achievements / badges ---------------------------------------------------

export interface PlayerAchievement {
  user_id: string;
  achievement_key: string;
  earned_at: string;
  created_at: string;
}

export const listAchievements = async (client: DumalaSupabaseClient): Promise<PlayerAchievement[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase.from('player_achievements').select('*').order('earned_at', { ascending: true }),
    'ACHIEVEMENTS_READ_FAILED',
    'Failed to load achievements'
  ) as PlayerAchievement[] | null) ?? [];
};

/** Grant any newly-earned badges from the player's activity; returns new keys. */
export const syncAchievements = async (client: DumalaSupabaseClient, streak: number): Promise<string[]> => {
  const supabase = asUntypedClient(client);
  const data = expectNoError(
    await supabase.rpc('sync_player_achievements', { p_streak: Math.max(0, Math.round(streak)) }),
    'ACHIEVEMENTS_SYNC_FAILED',
    'Failed to update achievements'
  );
  return Array.isArray(data) ? (data as string[]) : [];
};
