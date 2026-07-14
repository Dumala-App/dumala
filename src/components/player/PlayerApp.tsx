import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import type { CloudRuntime } from '../../cloud/runtime';
import type { CloudAuthController } from '../../hooks/useCloudAuth';
import { computeIsMinor, type PlayerAchievement, type PlayerDrillCompletion, type PlayerNotification, type PlayerProfile, type PlayerWorkoutSession, type TeamScheduleEntry } from '../../cloud/player';
import { computeStreakDays } from '../../player/progress';
import TeamChat, { ChatConsentGate } from '../chat/TeamChat';
import PlayerAppLayout, { type PlayerTab } from './PlayerAppLayout';
import NotificationsSheet from './NotificationsSheet';
import HomeTab from './HomeTab';
import DrillsTab from './DrillsTab';
import TimerTab, { type TimerPreset } from './TimerTab';
import ProgressTab from './ProgressTab';
import ProfileTab from './ProfileTab';
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
      return;
    }
    let active = true;
    player.listMyTeamSchedule(linkedClubId)
      .then(entries => { if (active) setSchedule(entries); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [player, linkedClubId]);

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

  const startTimerForDrill = useCallback((label: string, seconds: number) => {
    setTimerPreset({ label, seconds });
    setTab('timer');
  }, []);

  const streakDays = useMemo(() => computeStreakDays(completions), [completions]);
  const playerStats = useMemo(
    () => ({ drills: completions.length, workouts: workouts.length, favorites: favorites.length, streak: streakDays }),
    [completions.length, workouts.length, favorites.length, streakDays]
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
            streakDays={streakDays}
            completions={completions}
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
        {tab === 'progress' && <ProgressTab completions={completions} stats={playerStats} achievements={achievements} />}
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
            onLinkedClubChange={setLinkedClubId}
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
