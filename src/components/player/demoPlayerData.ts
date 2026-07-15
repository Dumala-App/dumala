import type { CloudChatRepository, CloudDataAccess, CloudPlayerRepository } from '../../cloud/dataAccess';
import type { CloudRuntime, Phase6Config } from '../../cloud/runtime';
import type { CloudAuthController } from '../../hooks/useCloudAuth';
import type { ChatMessage } from '../../cloud/chat';
import type { AssessmentSession } from '../../types';
import type {
  PlayerAchievement,
  ClubRosterPlayer,
  PlayerClubLink,
  PlayerDrillCompletion,
  PlayerLinkRequest,
  PlayerNotification,
  PlayerProfile,
  PlayerWorkoutSession,
  TeamScheduleEntry,
  TeamTacticsSummary
} from '../../cloud/player';
import { PLAYER_ACHIEVEMENTS } from '../../player/achievements';
import { getJugglingProgress } from '../../player/drillCatalog';

// In-memory sample data for the Player app "preview" mode. When the preview flag
// is on, the app renders straight into a demo dashboard (no login, no cloud) so
// the UI can be reviewed without an account. Everything here is client-side and
// resets on reload; mutations are applied to the in-memory arrays so the preview
// stays interactive.

const DEMO_CLUB_ID = 'demo-club';
const DAY_MS = 24 * 60 * 60 * 1000;
const ago = (days: number, hour = 9) => {
  const d = new Date(Date.now() - days * DAY_MS);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const newId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const createDemoPlayerRepository = (): CloudPlayerRepository => {
  let profile: PlayerProfile = {
    user_id: 'preview-player',
    display_name: 'Alex Rivera',
    date_of_birth: '2005-03-10',
    position: 'Winger',
    height: 176,
    weight: 68,
    bio: 'Left winger. Loves 1v1s and cutting inside.',
    avatar_url: null,
    guardian_name: null,
    guardian_email: null,
    guardian_relationship: null,
    guardian_consent_state: 'not_required',
    guardian_consent_at: null,
    created_at: ago(30),
    updated_at: ago(1)
  };

  const completion = (drillId: string, days: number, minutes: number, notes: string | null = null): PlayerDrillCompletion => ({
    id: newId(),
    user_id: 'preview-player',
    drill_id: drillId,
    completed_at: ago(days),
    duration_seconds: minutes * 60,
    perceived_exertion: null,
    notes,
    created_at: ago(days)
  });

  // A 3-day streak (today/yesterday/2d) plus older sessions for the history + chart.
  let completions: PlayerDrillCompletion[] = [
    completion('solo-shooting-corners', 0, 18),
    completion('solo-ball-control-juggling', 0, 10, 'juggling_score:42'),
    completion('solo-dribble-slalom', 1, 15),
    completion('solo-wall-pass-first-touch', 2, 15),
    completion('solo-ball-control-juggling', 4, 10, 'juggling_score:31'),
    completion('solo-endurance-ball-circuit', 6, 24)
  ];

  let favorites = new Set<string>(['solo-dribble-slalom', 'solo-shooting-corners']);
  let achievements: PlayerAchievement[] = [];

  let workouts: PlayerWorkoutSession[] = [
    {
      id: newId(),
      user_id: 'preview-player',
      kind: 'interval',
      label: 'Sprint intervals',
      total_seconds: 900,
      rounds: { workSec: 30, restSec: 15, rounds: 8 },
      completed_at: ago(1),
      notes: null,
      created_at: ago(1)
    }
  ];

  let notifications: PlayerNotification[] = [
    {
      id: newId(),
      user_id: 'preview-player',
      type: 'link_approved',
      title: "You're on the team!",
      body: 'Metro Rovers approved your request. Your schedule is now available.',
      related: { clubId: DEMO_CLUB_ID },
      read_at: null,
      created_at: ago(1, 18)
    },
    {
      id: newId(),
      user_id: 'preview-player',
      type: 'welcome',
      title: 'Welcome to Dumala Player',
      body: 'Build your streak with solo drills, time your workouts, and track your progress.',
      related: {},
      read_at: ago(5),
      created_at: ago(5)
    }
  ];

  const links: PlayerClubLink[] = [
    {
      id: newId(),
      user_id: 'preview-player',
      club_id: DEMO_CLUB_ID,
      player_id: 'demo-roster-11',
      state: 'active',
      linked_by: 'demo-coach',
      linked_at: ago(2),
      created_at: ago(2),
      updated_at: ago(2)
    }
  ];

  const schedule: TeamScheduleEntry[] = [
    { id: newId(), club_id: DEMO_CLUB_ID, opponent: 'Northside FC', event_date: ago(-3, 15).slice(0, 10), event_time: '15:00', location: 'Home Ground', status: 'upcoming', type: 'league', our_score: null, opponent_score: null, notes: null },
    { id: newId(), club_id: DEMO_CLUB_ID, opponent: '', event_date: ago(-1, 18).slice(0, 10), event_time: '18:00', location: 'Training Pitch B', status: 'upcoming', type: 'training', our_score: null, opponent_score: null, notes: null },
    { id: newId(), club_id: DEMO_CLUB_ID, opponent: 'Harbor United', event_date: ago(-7, 11).slice(0, 10), event_time: '11:00', location: 'Away', status: 'upcoming', type: 'cup', our_score: null, opponent_score: null, notes: null },
    { id: newId(), club_id: DEMO_CLUB_ID, opponent: 'East End Athletic', event_date: ago(-10, 16).slice(0, 10), event_time: '16:00', location: 'Away', status: 'upcoming', type: 'friendly', our_score: null, opponent_score: null, notes: null },
    { id: newId(), club_id: DEMO_CLUB_ID, opponent: '', event_date: ago(-12, 19).slice(0, 10), event_time: '19:00', location: 'Clubhouse', status: 'upcoming', type: 'meeting', our_score: null, opponent_score: null, notes: null }
  ];

  const rosterPlayer = (row: Pick<ClubRosterPlayer, 'id' | 'name' | 'roster_number' | 'position'>, over: Partial<ClubRosterPlayer> = {}): ClubRosterPlayer => ({
    ...row,
    bio: '',
    photo_url: '',
    date_of_birth: null,
    height: null,
    weight: null,
    fprds_role: null,
    fprds_age_group_preference: null,
    fprds_last_assessment_id: null,
    games_played: 0,
    goals: 0,
    assists: 0,
    clean_sheets: 0,
    minutes_played: 0,
    yellow_cards: 0,
    red_cards: 0,
    base_attributes: { pace: 62, stamina: 64, agility: 60, strength: 58, firstTouch: 61, shortPassing: 60 },
    position_attributes: {},
    specialty_traits: [],
    ...over
  });

  const roster: ClubRosterPlayer[] = [
    rosterPlayer({ id: 'demo-roster-1', name: 'Mason Lee', roster_number: 1, position: 'Goalkeeper' }),
    rosterPlayer({ id: 'demo-roster-2', name: 'Noah Santos', roster_number: 2, position: 'Defender' }),
    rosterPlayer({ id: 'demo-roster-4', name: 'Ethan Brooks', roster_number: 4, position: 'Defender' }),
    rosterPlayer({ id: 'demo-roster-5', name: 'Samir Khan', roster_number: 5, position: 'Defender' }),
    rosterPlayer({ id: 'demo-roster-6', name: 'Leo Martinez', roster_number: 6, position: 'Midfielder' }),
    rosterPlayer({ id: 'demo-roster-8', name: 'Jordan Miles', roster_number: 8, position: 'Midfielder' }),
    rosterPlayer({ id: 'demo-roster-10', name: 'Kai Bennett', roster_number: 10, position: 'Midfielder' }),
    rosterPlayer(
      { id: 'demo-roster-11', name: 'Alex Rivera', roster_number: 11, position: 'Forward' },
      {
        bio: 'Explosive wide forward with strong attacking 1v1 habits.',
        date_of_birth: '2005-03-10',
        height: 176,
        weight: 68,
        fprds_role: 'W',
        fprds_age_group_preference: 'Adult',
        fprds_last_assessment_id: 'demo-assessment-2',
        games_played: 6,
        goals: 4,
        assists: 3,
        minutes_played: 428,
        yellow_cards: 1,
        base_attributes: { pace: 88, stamina: 76, agility: 84, strength: 72, firstTouch: 82, shortPassing: 78 },
        position_attributes: { Finishing: 80, 'Long Shots': 74, 'Offensive 1v1': 86, 'Attacking Heading': 68 },
        specialty_traits: ['Overlap runs', 'Recovery pace']
      }
    ),
    rosterPlayer({ id: 'demo-roster-17', name: 'Owen Clarke', roster_number: 17, position: 'Forward' }),
    rosterPlayer({ id: 'demo-roster-23', name: 'Daniel Park', roster_number: 23, position: 'Forward' })
  ];

  const assessmentScores = {
    pace: 88,
    stamina: 78,
    agility: 86,
    strength: 73,
    firstTouch: 84,
    shortPassing: 79,
    finishingBox: 80,
    shotPower: 76,
    offensive1v1: 87,
    attackingHeading: 68,
    longPassing: 70,
    visionPlaymaking: 72,
    ballRetention: 73,
    pressingInterceptions: 71,
    tackling: 60,
    defensiveHeading: 58,
    positioningClearances: 61,
    crossing: 81,
    reflexes: 50,
    handling: 50,
    divingReach: 50,
    distribution: 60
  } as const;

  const assessments: AssessmentSession[] = [
    {
      id: 'demo-assessment-1',
      playerId: 'demo-roster-11',
      assessmentDate: ago(24).slice(0, 10),
      createdAt: ago(24),
      assessmentType: 'Quick',
      ageGroup: 'Adult',
      role: 'W',
      rawResults: {
        role: 'W',
        assessmentType: 'Quick',
        base: {
          sprint10mSeconds: 1.93,
          sprint30mSeconds: 4.28,
          yoyoMeters: 1320,
          illinoisSeconds: 16.7,
          broadJumpCm: 225,
          medicineBallThrowCm: 610,
          firstTouchSuccessesOutOf10: 8,
          shortPassingSuccessesOutOf10: 8
        },
        roleSpecific: {
          finishingGoalsOutOf6: 3,
          finishingOnTargetOutOf6: 5,
          offensive1v1TakeonsOutOf10: 7
        }
      },
      attributeScores: { ...assessmentScores, pace: 84, agility: 82, offensive1v1: 82, finishingBox: 74 },
      ovr: 78,
      labels: { weakestAttributeId: 'attackingHeading', ovrTierLabel: 'Advanced' },
      deltas: {},
      benchmarkVersion: '1.0.0'
    },
    {
      id: 'demo-assessment-2',
      playerId: 'demo-roster-11',
      assessmentDate: ago(4).slice(0, 10),
      createdAt: ago(4),
      assessmentType: 'Full',
      ageGroup: 'Adult',
      role: 'W',
      rawResults: {
        role: 'W',
        assessmentType: 'Full',
        base: {
          sprint10mSeconds: 1.88,
          sprint30mSeconds: 4.18,
          yoyoMeters: 1480,
          illinoisSeconds: 16.2,
          broadJumpCm: 236,
          medicineBallThrowCm: 640,
          firstTouchSuccessesOutOf10: 9,
          shortPassingSuccessesOutOf10: 8
        },
        roleSpecific: {
          finishingGoalsOutOf6: 4,
          finishingOnTargetOutOf6: 5,
          shotPowerMaxControlledDistanceMeters: 24,
          offensive1v1TakeonsOutOf10: 8,
          attackingHeadingOnTargetOutOf10: 6
        }
      },
      attributeScores: assessmentScores,
      ovr: 82,
      labels: { weakestAttributeId: 'attackingHeading', ovrTierLabel: 'Advanced' },
      deltas: { previousSessionId: 'demo-assessment-1', ovrDelta: 4 },
      coachNotes: 'Great change of pace in wide channels. Keep improving attacking heading.',
      benchmarkVersion: '1.0.0'
    }
  ];

  const tactics: TeamTacticsSummary = {
    id: 'demo-tactics',
    club_id: DEMO_CLUB_ID,
    match_format: '11v11',
    formation: '4-3-3',
    playstyle: 'High press',
    defensive_style: 'Compact mid block',
    is_custom_strategy: false,
    custom_playstyle_value: null,
    custom_defensive_value: null,
    custom_mentality_value: 'Positive',
    custom_strategy_notes: 'Stretch the pitch in possession, counter-press for five seconds after losing the ball, and recover into a compact midfield three.',
    updated_at: ago(0)
  };

  return {
    getMyProfile: async () => profile,
    upsertMyProfile: async (_userId, input) => {
      profile = {
        ...profile,
        display_name: input.displayName ?? profile.display_name,
        date_of_birth: input.dateOfBirth ?? profile.date_of_birth,
        position: input.position ?? profile.position,
        height: input.height ?? profile.height,
        weight: input.weight ?? profile.weight,
        bio: input.bio ?? profile.bio,
        updated_at: new Date().toISOString()
      };
      return profile;
    },
    setGuardianConsent: async input => {
      profile = {
        ...profile,
        guardian_name: input.guardianName,
        guardian_email: input.guardianEmail ?? null,
        guardian_relationship: input.guardianRelationship ?? null,
        guardian_consent_state: 'granted',
        guardian_consent_at: new Date().toISOString()
      };
      return 'granted';
    },
    requestLink: async () => newId(),
    withdrawLinkRequest: async () => undefined,
    listMyLinkRequests: async (): Promise<PlayerLinkRequest[]> => [],
    listMyLinks: async () => links,
    listMyTeamSchedule: async () => schedule,
    getMyTeamTacticsSummary: async () => tactics,
    getOrCreateClubJoinCode: async () => 'DEMO1234',
    listClubLinkRequests: async () => [],
    listClubRosterPlayers: async () => roster,
    listMyAssessmentSessions: async playerId => assessments.filter(assessment => assessment.playerId === playerId),
    approveLink: async () => newId(),
    rejectLink: async () => undefined,
    logDrillCompletion: async (_userId, input) => {
      const row: PlayerDrillCompletion = {
        id: newId(),
        user_id: 'preview-player',
        drill_id: input.drillId,
        completed_at: new Date().toISOString(),
        duration_seconds: input.durationSeconds ?? null,
        perceived_exertion: input.perceivedExertion ?? null,
        notes: input.notes ?? null,
        created_at: new Date().toISOString()
      };
      completions = [row, ...completions];
      return row;
    },
    listDrillCompletions: async () => completions,
    listFavorites: async () => [...favorites],
    toggleFavorite: async (_userId, drillId, isFavorite) => {
      favorites = new Set(favorites);
      if (isFavorite) favorites.delete(drillId);
      else favorites.add(drillId);
    },
    saveWorkoutSession: async (_userId, input) => {
      const row: PlayerWorkoutSession = {
        id: newId(),
        user_id: 'preview-player',
        kind: input.kind,
        label: input.label ?? null,
        total_seconds: Math.max(0, Math.round(input.totalSeconds)),
        rounds: input.rounds ?? [],
        completed_at: new Date().toISOString(),
        notes: input.notes ?? null,
        created_at: new Date().toISOString()
      };
      workouts = [row, ...workouts];
      return row;
    },
    listWorkoutSessions: async () => workouts,
    listNotifications: async () => notifications,
    markNotificationRead: async id => {
      notifications = notifications.map(n => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    },
    markAllNotificationsRead: async () => {
      const now = new Date().toISOString();
      notifications = notifications.map(n => (n.read_at ? n : { ...n, read_at: now }));
    },
    listAchievements: async () => achievements,
    syncAchievements: async streak => {
      const jugglingProgress = getJugglingProgress(completions);
      const stats = {
        drills: completions.length,
        workouts: workouts.length,
        favorites: favorites.size,
        streak,
        jugglingAttempts: jugglingProgress.attempts.length,
        jugglingBest: jugglingProgress.bestScore ?? 0,
        totalMinutes: Math.round((
          completions.reduce((sum, completion) => sum + (completion.duration_seconds ?? 0), 0)
          + workouts.reduce((sum, workout) => sum + workout.total_seconds, 0)
        ) / 60)
      };
      const earnedKeys = new Set(achievements.map(a => a.achievement_key));
      const newly: string[] = [];
      for (const def of PLAYER_ACHIEVEMENTS) {
        const val = def.metric === 'drills' ? stats.drills
          : def.metric === 'workouts' ? stats.workouts
          : def.metric === 'streak' ? stats.streak
          : def.metric === 'favorites' ? stats.favorites
          : def.metric === 'jugglingAttempts' ? stats.jugglingAttempts
          : def.metric === 'jugglingBest' ? stats.jugglingBest
          : stats.totalMinutes;
        if (val >= def.threshold && !earnedKeys.has(def.key)) {
          const at = new Date().toISOString();
          achievements = [...achievements, { user_id: profile.user_id, achievement_key: def.key, earned_at: at, created_at: at }];
          newly.push(def.key);
        }
      }
      return newly;
    }
  };
};

/** A stub auth controller (unused in preview — the account card is hidden). */
export const createDemoChatRepository = (): CloudChatRepository => {
  let messages: ChatMessage[] = [
    { id: newId(), channel_id: 'demo-chan', club_id: 'demo-club', author_user_id: 'demo-coach', author_name: 'Coach Rivera', author_role: 'coach', body: 'Tactical briefing 15 mins before kickoff on Saturday.', message_kind: 'announcement', deleted_at: null, deleted_by: null, created_at: ago(0, 8) },
    { id: newId(), channel_id: 'demo-chan', club_id: 'demo-club', author_user_id: 'demo-teammate', author_name: 'Jordan M.', author_role: 'player', body: 'On it, coach. Just finished my shooting drills.', message_kind: 'message', deleted_at: null, deleted_by: null, created_at: ago(0, 9) }
  ];
  return {
    ensureChannel: async () => 'demo-chan',
    listMessages: async () => messages,
    postMessage: async (_clubId, body) => {
      const row: ChatMessage = {
        id: newId(), channel_id: 'demo-chan', club_id: 'demo-club', author_user_id: 'preview-player',
        author_name: 'Alex Rivera', author_role: 'player', body: body.trim(), message_kind: 'message', deleted_at: null, deleted_by: null,
        created_at: new Date().toISOString()
      };
      messages = [...messages, row];
      return row;
    },
    postAnnouncement: async (_clubId, body) => {
      const row: ChatMessage = {
        id: newId(), channel_id: 'demo-chan', club_id: 'demo-club', author_user_id: 'demo-coach',
        author_name: 'Coach Rivera', author_role: 'coach', body: body.trim(), message_kind: 'announcement',
        deleted_at: null, deleted_by: null, created_at: new Date().toISOString()
      };
      messages = [...messages, row];
      return row;
    },
    deleteMessage: async id => { messages = messages.map(m => m.id === id ? { ...m, deleted_at: new Date().toISOString() } : m); },
    reportMessage: async () => undefined,
    markRead: async () => undefined,
    getCaptainUserId: async () => 'demo-teammate'
  };
};

export const createPreviewAuthController = (): CloudAuthController => ({
  state: { status: 'disabled' },
  requestOtp: async () => undefined,
  signUpWithPassword: async () => undefined,
  signInWithPassword: async () => undefined,
  signInWithGoogle: async () => undefined,
  signOut: async () => undefined
});

/**
 * An "enabled" CloudRuntime whose data access only wires up the demo player repo.
 * Only `dataAccess.player` is exercised by the Player app in preview mode; the
 * rest of CloudDataAccess is intentionally absent (cast) and never called.
 */
export const createPreviewRuntime = (
  phase6: Phase6Config
): Extract<CloudRuntime, { enabled: true }> => ({
  enabled: true,
  phase6,
  dataAccess: { player: createDemoPlayerRepository(), chat: createDemoChatRepository() } as unknown as CloudDataAccess
});
