import React from 'react';
import { Bell, Dumbbell, Flame, Home, MessageSquare, Timer as TimerIcon, TrendingUp, User } from 'lucide-react';
import { APEX_THEME_STYLE, apexHeader, apexMono, apexMonoTight, apexNav, apexShell, apexWordmark } from './playerTheme';

export type PlayerTab = 'home' | 'drills' | 'timer' | 'progress' | 'profile';

const TABS: Array<{ id: PlayerTab; label: string; icon: React.ComponentType<{ size?: number; className?: string; fill?: string }> }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'drills', label: 'Drills', icon: Dumbbell },
  { id: 'timer', label: 'Timer', icon: TimerIcon },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'profile', label: 'Profile', icon: User }
];

interface PlayerAppLayoutProps {
  greeting: string;
  subGreeting: string;
  streakDays: number;
  unreadCount: number;
  activeTab: PlayerTab;
  onTabChange: (tab: PlayerTab) => void;
  onBellClick: () => void;
  onChatClick?: () => void;
  children: React.ReactNode;
}

const PlayerAppLayout = ({
  greeting,
  subGreeting,
  streakDays,
  unreadCount,
  activeTab,
  onTabChange,
  onBellClick,
  onChatClick,
  children
}: PlayerAppLayoutProps) => (
  <div className={apexShell} style={APEX_THEME_STYLE}>
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <header className={apexHeader}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#bec6e0]/20 bg-[#152031] font-player-display text-xs font-bold text-[#bec6e0]">
            {greeting.replace(/^Hey, /, '').charAt(0).toUpperCase() || 'D'}
          </div>
          <div className="min-w-0">
            <h1 className={apexWordmark}>Dumala</h1>
            <p className={`${apexMonoTight} truncate text-[#c6c6cd]/60`}>{subGreeting} · {greeting.replace(/^Hey, /, '')}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {streakDays > 0 && (
            <span className="flex items-center gap-1 rounded border border-[#ff6d00]/30 bg-[#ff6d00]/10 px-2 py-1 font-player-mono text-[11px] font-bold text-[#ff6d00]">
              <Flame size={13} /> {streakDays}
            </span>
          )}
          {onChatClick && (
            <button
              type="button"
              onClick={onChatClick}
              aria-label="Team chat"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[#c6c6cd] transition-colors hover:text-[#ff6d00]"
            >
              <MessageSquare size={19} />
            </button>
          )}
          <button
            type="button"
            onClick={onBellClick}
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-[#c6c6cd] transition-colors hover:text-[#ff6d00]"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff6d00] px-1 font-player-mono text-[9px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-28 pt-5">{children}</main>

      <nav className={apexNav} aria-label="Player app sections">
        <div className="grid grid-cols-5">
          {TABS.map(tab => {
            const active = tab.id === activeTab;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-1.5 px-1 pb-2 pt-1 transition-colors ${
                  active ? 'text-[#ff6d00]' : 'text-[#c6c6cd]/60 hover:text-[#ff6d00]'
                }`}
              >
                <Icon size={23} fill={active ? 'currentColor' : 'none'} />
                <span className={`${apexMono} !text-[9px] ${active ? 'font-bold' : ''}`}>{tab.label}</span>
                {active && (
                  <span className="absolute bottom-0.5 h-0.5 w-5 rounded-full bg-[#ff6d00] shadow-[0_0_8px_#ff6d00]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  </div>
);

export default PlayerAppLayout;
