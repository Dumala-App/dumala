import type { CloudChatRepository, CloudDataAccess, CloudPlayerRepository } from '../../cloud/dataAccess';
import type { CloudRuntime, Phase6Config } from '../../cloud/runtime';
import type { CloudAuthController } from '../../hooks/useCloudAuth';
import type { ChatMessage } from '../../cloud/chat';
import type {
  PlayerAchievement,
  PlayerClubLink,
  PlayerDrillCompletion,
  PlayerLinkRequest,
  PlayerNotification,
  PlayerProfile,
  PlayerWorkoutSession,
  TeamScheduleEntry
} from '../../cloud/player';
import { PLAYER_ACHIEVEMENTS } from '../../player/achievements';

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

  const completion = (drillId: string, days: number, minutes: number): PlayerDrillCompletion => ({
    id: newId(),
    user_id: 'preview-player',
    drill_id: drillId,
    completed_at: ago(days),
    duration_seconds: minutes * 60,
    perceived_exertion: null,
    notes: null,
    created_at: ago(days)
  });

  // A 3-day streak (today/yesterday/2d) plus older sessions for the history + chart.
  let completions: PlayerDrillCompletion[] = [
    completion('drill-shooting', 0, 22),
    completion('drill-agility', 0, 14),
    completion('drill-dribbling', 1, 18),
    completion('drill-passing', 2, 16),
    completion('drill-heading', 4, 12),
    completion('drill-gym', 6, 30)
  ];

  let favorites = new Set<string>(['drill-agility', 'drill-shooting']);
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
    { id: newId(), club_id: DEMO_CLUB_ID, opponent: 'Harbor United', event_date: ago(-7, 11).slice(0, 10), event_time: '11:00', location: 'Away', status: 'upcoming', type: 'cup', our_score: null, opponent_score: null, notes: null }
  ];

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
    getOrCreateClubJoinCode: async () => 'DEMO1234',
    listClubLinkRequests: async () => [],
    listClubRosterPlayers: async () => [],
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
      const stats = { drills: completions.length, workouts: workouts.length, favorites: favorites.size, streak };
      const earnedKeys = new Set(achievements.map(a => a.achievement_key));
      const newly: string[] = [];
      for (const def of PLAYER_ACHIEVEMENTS) {
        const val = def.metric === 'drills' ? stats.drills
          : def.metric === 'workouts' ? stats.workouts
          : def.metric === 'streak' ? stats.streak
          : stats.favorites;
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
    { id: newId(), channel_id: 'demo-chan', club_id: 'demo-club', author_user_id: 'demo-coach', author_name: 'Coach Rivera', author_role: 'coach', body: 'Tactical briefing 15 mins before kickoff on Saturday. Bring your A-game. 🔥', deleted_at: null, deleted_by: null, created_at: ago(0, 8) },
    { id: newId(), channel_id: 'demo-chan', club_id: 'demo-club', author_user_id: 'demo-teammate', author_name: 'Jordan M.', author_role: 'player', body: 'On it, coach. Just finished my shooting drills.', deleted_at: null, deleted_by: null, created_at: ago(0, 9) }
  ];
  return {
    ensureChannel: async () => 'demo-chan',
    listMessages: async () => messages,
    postMessage: async (_clubId, body) => {
      const row: ChatMessage = {
        id: newId(), channel_id: 'demo-chan', club_id: 'demo-club', author_user_id: 'preview-player',
        author_name: 'Alex Rivera', author_role: 'player', body: body.trim(), deleted_at: null, deleted_by: null,
        created_at: new Date().toISOString()
      };
      messages = [...messages, row];
      return row;
    },
    deleteMessage: async id => { messages = messages.map(m => m.id === id ? { ...m, deleted_at: new Date().toISOString() } : m); },
    reportMessage: async () => undefined,
    markRead: async () => undefined
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
