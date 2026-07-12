import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { CloudRuntime } from '../../cloud/runtime';
import type { CloudAuthController } from '../../hooks/useCloudAuth';
import { computeIsMinor, type PlayerDrillCompletion, type PlayerNotification, type PlayerProfile, type TeamScheduleEntry } from '../../cloud/player';
import { computeStreakDays } from '../../player/progress';
import TeamChat, { ChatConsentGate } from '../chat/TeamChat';
import PlayerAppLayout, { type PlayerTab } from './PlayerAppLayout';
import NotificationsSheet from './NotificationsSheet';
import HomeTab from './HomeTab';
import DrillsTab from './DrillsTab';
import TimerTab, { type TimerPreset } from './TimerTab';
import ProgressTab from './ProgressTab';
import ProfileTab from './ProfileTab';

interface PlayerAppProps {
  runtime: Extract<CloudRuntime, { enabled: true }>;
  userId: string;
  authController: CloudAuthController;
  /** Demo/preview mode: no login, in-memory data; hides account controls. */
  preview?: boolean;
}

const firstName = (profile: PlayerProfile | null): string => {
  const name = profile?.display_name?.trim();
  if (!name) return 'player';
  return name.split(/\s+/)[0];
};

const PlayerApp = ({ runtime, userId, authController, preview = false }: PlayerAppProps) => {
  const [tab, setTab] = useState<PlayerTab>('home');
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [linkedClubId, setLinkedClubId] = useState<string | null>(null);
  const [completions, setCompletions] = useState<PlayerDrillCompletion[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<PlayerNotification[]>([]);
  const [schedule, setSchedule] = useState<TeamScheduleEntry[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [timerPreset, setTimerPreset] = useState<TimerPreset | null>(null);

  const player = runtime.dataAccess.player;

  const reload = useCallback(async () => {
    const [nextProfile, links, nextCompletions, nextFavorites, nextNotifications] = await Promise.all([
      player.getMyProfile(userId),
      player.listMyLinks(),
      player.listDrillCompletions(),
      player.listFavorites(),
      player.listNotifications()
    ]);
    setProfile(nextProfile);
    setCompletions(nextCompletions);
    setFavorites(nextFavorites);
    setNotifications(nextNotifications);
    const clubId = links[0]?.club_id ?? null;
    setLinkedClubId(clubId);
    setSchedule(clubId ? await player.listMyTeamSchedule(clubId) : []);
  }, [player, userId]);

  useEffect(() => {
    void reload().catch(() => undefined);
  }, [reload]);

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
  const unreadCount = notifications.filter(notification => !notification.read_at).length;
  const nextFixture = useMemo(
    () => schedule.filter(entry => entry.status === 'upcoming')[0] ?? null,
    [schedule]
  );
  const weekday = new Date().toLocaleDateString(undefined, { weekday: 'long' });

  const chatAvailable = runtime.phase6.chatEnabled && !!linkedClubId;
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
        onChatClick={chatAvailable ? () => setChatOpen(true) : undefined}
      >
        {tab === 'home' && (
          <HomeTab
            streakDays={streakDays}
            completions={completions}
            nextFixture={nextFixture}
            onGoToDrills={() => setTab('drills')}
            onGoToTimer={() => setTab('timer')}
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
        {tab === 'progress' && <ProgressTab completions={completions} />}
        {tab === 'profile' && (
          <ProfileTab
            runtime={runtime}
            userId={userId}
            authController={authController}
            preview={preview}
            linkedClubId={linkedClubId}
            onLinkedClubChange={clubId => {
              setLinkedClubId(clubId);
              void reload();
            }}
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

      {chatOpen && linkedClubId && (
        <div className="fixed inset-0 z-50 flex justify-center bg-black/40">
          <div className="h-[100dvh] w-full max-w-md">
            {minorBlockedFromChat ? (
              <div className="flex h-full flex-col bg-[#081425]">
                <button type="button" onClick={() => setChatOpen(false)} className="px-4 py-3 text-left font-player-mono text-[11px] uppercase tracking-wide text-[#ff6d00]">← Back</button>
                <div className="flex-1"><ChatConsentGate tone="apex" /></div>
              </div>
            ) : (
              <TeamChat
                runtime={runtime}
                clubId={linkedClubId}
                selfUserId={userId}
                tone="apex"
                title="Your team"
                onBack={() => setChatOpen(false)}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PlayerApp;
