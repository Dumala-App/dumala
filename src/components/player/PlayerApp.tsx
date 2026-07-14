import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import type { CloudRuntime } from '../../cloud/runtime';
import type { CloudAuthController } from '../../hooks/useCloudAuth';
import { computeIsMinor, type ClubRosterPlayer, type PlayerAchievement, type PlayerDrillCompletion, type PlayerNotification, type PlayerProfile, type PlayerWorkoutSession, type TeamScheduleEntry } from '../../cloud/player';
import { getJugglingProgress } from '../../player/drillCatalog';
import { computeStreakDays } from '../../player/progress';
import TeamChat, { ChatConsentGate } from '../chat/TeamChat';
import PlayerAppLayout, { type PlayerTab } from './PlayerAppLayout';
import NotificationsSheet from './NotificationsSheet';
import HomeTab from './HomeTab';
import DrillsTab from './DrillsTab';
import TimerTab, { type TimerPreset } from './TimerTab';
import ProgressTab from './ProgressTab';
import ProfileTab from './ProfileTab';
import SquadTab from './SquadTab';
import { readInitialPlayerInviteCode } from '../../player/inviteLink';

interface PlayerAppProps {
  runtime: Extract<CloudRuntime, { enabled: true }>;
  userId: string;
  authController: CloudAuthController;
  accountDisplayName?: string;
  accountEmail?: string;
  /** Demo/preview mode: no login, in-memory data; hides account controls. */
  preview?: boolean;
}

const firstName = (profile: PlayerProfile | null): string => {
  const name = profile?.display_name?.trim();
  if (!name) return 'player';
  return name.split(/\s+/)[0];
};

const PlayerApp = ({
  runtime,
  userId,
  authController,
  accountDisplayName,
  accountEmail,
  preview = false
}: PlayerAppProps) => {
  const [tab, setTab] = useState<PlayerTab>(() => (readInitialPlayerInviteCode() ? 'profile' : 'home'));
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [linkedClubId, setLinkedClubId] = useState<string | null>(null);
  const [linkedPlayerId, setLinkedPlayerId] = useState<string | null>(null);
  const [linkedPlayer, setLinkedPlayer] = useState<ClubRosterPlayer | null>(null);
  const [completions, setCompletions] = useState<PlayerDrillCompletion[]>([]);
  const [workouts, setWorkouts] = useState<PlayerWorkoutSession[]>([]);
  const [achievements, setAchievements] = useState<PlayerAchievement[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<PlayerNotification[]>([]);
  const [schedule, setSchedule] = useState<TeamScheduleEntry[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [timerPreset, setTimerPreset] = useState<TimerPreset | null>(null);

  const player = runtime.dataAccess.player;

  const reload = useCallback(async () => {
    const [nextProfile, links, nextCompletions, nextFavorites, nextNotifications, nextWorkouts, nextAchievements] = await Promise.all([
      player.getMyProfile(userId),
      player.listMyLinks(),
      player.listDrillCompletions(),
      player.listFavorites(),
      player.listNotifications(),
      player.listWorkoutSessions(),
      player.listAchievements()
    ]);
    setProfile(nextProfile);
    setCompletions(nextCompletions);
    setFavorites(nextFavorites);
    setNotifications(nextNotifications);
    setWorkouts(nextWorkouts);
    setAchievements(nextAchievements);
    setLinkedClubId(links[0]?.club_id ?? null);
    setLinkedPlayerId(links[0]?.player_id ?? null);
    // Grant any newly-earned badges from this activity, then refresh if any landed.
    try {
      const newlyEarned = await player.syncAchievements(computeStreakDays(nextCompletions));
      if (newlyEarned.length > 0) setAchievements(await player.listAchievements());
    } catch {
      /* achievements are non-critical — never block the dashboard */
    }
  }, [player, userId]);

  useEffect(() => {
    void reload().catch(() => undefined);
  }, [reload]);

  // Load the linked club's schedule whenever the link changes. Kept separate
  // from reload so reporting the current club (from JoinTeamPanel) never has to
  // re-run the whole dashboard load.
  useEffect(() => {
    if (!linkedClubId) {
      setSchedule([]);
      setLinkedPlayer(null);
      return;
    }
    let active = true;
    player.listMyTeamSchedule(linkedClubId)
      .then(entries => { if (active) setSchedule(entries); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [player, linkedClubId]);

  useEffect(() => {
    if (!linkedClubId || !linkedPlayerId) {
      setLinkedPlayer(null);
      return;
    }
    let active = true;
    player.listClubRosterPlayers(linkedClubId)
      .then(players => {
        if (active) setLinkedPlayer(players.find(rosterPlayer => rosterPlayer.id === linkedPlayerId) ?? null);
      })
      .catch(() => {
        if (active) setLinkedPlayer(null);
      });
    return () => { active = false; };
  }, [player, linkedClubId, linkedPlayerId]);

  const reloadNotifications = useCallback(async () => {
    setNotifications(await player.listNotifications());
  }, [player]);

  const handleMarkRead = useCallback(
    async (id: string) => {
      await player.markNotificationRead(id);
      await reloadNotifications();
    },
    [player, reloadNotifications]
  );

  const handleMarkAllRead = useCallback(async () => {
    await player.markAllNotificationsRead(userId);
    await reloadNotifications();
  }, [player, userId, reloadNotifications]);

  const handleLinkedClubChange = useCallback((clubId: string | null) => {
    setLinkedClubId(clubId);
    if (!clubId) {
      setLinkedPlayerId(null);
      return;
    }
    player.listMyLinks()
      .then(links => {
        const activeLink = links.find(link => link.club_id === clubId) ?? links[0];
        setLinkedPlayerId(activeLink?.player_id ?? null);
      })
      .catch(() => setLinkedPlayerId(null));
  }, [player]);

  const startTimerForDrill = useCallback((label: string, seconds: number) => {
    setTimerPreset({ label, seconds });
    setTab('timer');
  }, []);

  const streakDays = useMemo(() => computeStreakDays(completions), [completions]);
  const jugglingProgress = useMemo(() => getJugglingProgress(completions), [completions]);
  const playerStats = useMemo(
    () => ({
      drills: completions.length,
      workouts: workouts.length,
      favorites: favorites.length,
      streak: streakDays,
      jugglingAttempts: jugglingProgress.attempts.length,
      jugglingBest: jugglingProgress.bestScore ?? 0,
      totalMinutes: Math.round((
        completions.reduce((sum, completion) => sum + (completion.duration_seconds ?? 0), 0)
        + workouts.reduce((sum, workout) => sum + workout.total_seconds, 0)
      ) / 60)
    }),
    [completions, workouts, favorites.length, streakDays, jugglingProgress]
  );
  const unreadCount = notifications.filter(notification => !notification.read_at).length;
  const nextFixture = useMemo(
    () => schedule.filter(entry => entry.status === 'upcoming')[0] ?? null,
    [schedule]
  );
  const weekday = new Date().toLocaleDateString(undefined, { weekday: 'long' });

  const minorBlockedFromChat = !!profile
    && computeIsMinor(profile.date_of_birth)
    && profile.guardian_consent_state !== 'granted';

  return (
    <>
      <PlayerAppLayout
        greeting={`Hey, ${firstName(profile)}`}
        subGreeting={preview ? `${weekday} · Preview` : weekday}
        streakDays={streakDays}
        unreadCount={unreadCount}
        activeTab={tab}
        onTabChange={setTab}
        onBellClick={() => setNotificationsOpen(true)}
        fillMain={tab === 'chat'}
      >
        {tab === 'home' && (
          <HomeTab
            profile={profile}
            linkedPlayer={linkedPlayer}
            completions={completions}
            stats={playerStats}
            nextFixture={nextFixture}
            linkedClubId={linkedClubId}
            onGoToDrills={() => setTab('drills')}
            onGoToTimer={() => setTab('timer')}
            onGoToProfile={() => setTab('profile')}
          />
        )}
        {tab === 'drills' && (
          <DrillsTab
            runtime={runtime}
            userId={userId}
            favorites={favorites}
            completions={completions}
            onChanged={reload}
            onStartWithTimer={startTimerForDrill}
          />
        )}
        {tab === 'timer' && (
          <TimerTab
            runtime={runtime}
            userId={userId}
            preset={timerPreset}
            onConsumePreset={() => setTimerPreset(null)}
            onSaved={reload}
          />
        )}
        {tab === 'progress' && <ProgressTab completions={completions} workouts={workouts} stats={playerStats} achievements={achievements} />}
        {tab === 'squad' && (
          <SquadTab
            runtime={runtime}
            clubId={linkedClubId}
            onGoToProfile={() => setTab('profile')}
          />
        )}
        {tab === 'chat' && (
          <div className="h-full pb-[calc(4.25rem+env(safe-area-inset-bottom))]">
            {!linkedClubId ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                <MessageSquare size={28} className="text-[#dce7f8]" />
                <h2 className="font-player-display text-lg font-bold uppercase tracking-wide text-[#d8e3fb]">Join a team to chat</h2>
                <p className="max-w-xs text-sm text-[#c6c6cd]/70">
                  Team chat opens once you're linked to a club. Head to your profile to join your team.
                </p>
                <button
                  type="button"
                  onClick={() => setTab('profile')}
                  className="mt-1 rounded-lg bg-[#ff6d00] px-4 py-2 font-player-mono text-[11px] font-bold uppercase tracking-wide text-[#081425]"
                >
                  Go to profile
                </button>
              </div>
            ) : minorBlockedFromChat ? (
              <ChatConsentGate tone="apex" />
            ) : (
              <TeamChat
                runtime={runtime}
                clubId={linkedClubId}
                selfUserId={userId}
                tone="apex"
                title="Your team"
              />
            )}
          </div>
        )}
        {tab === 'profile' && (
          <ProfileTab
            runtime={runtime}
            userId={userId}
            authController={authController}
            preview={preview}
            linkedClubId={linkedClubId}
            onLinkedClubChange={handleLinkedClubChange}
            accountDisplayName={accountDisplayName}
            accountEmail={accountEmail}
          />
        )}
      </PlayerAppLayout>

      <NotificationsSheet
        open={notificationsOpen}
        notifications={notifications}
        onClose={() => setNotificationsOpen(false)}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
      />
    </>
  );
};

export default PlayerApp;
