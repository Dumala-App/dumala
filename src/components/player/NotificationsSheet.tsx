import React from 'react';
import { Bell, CheckCheck, PartyPopper, ShieldX, Sparkles, X } from 'lucide-react';
import type { PlayerNotification } from '../../cloud/player';
import { apexMono, apexMonoTight, apexSectionTitle, apexSheet } from './playerTheme';

interface NotificationsSheetProps {
  open: boolean;
  notifications: PlayerNotification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

const iconFor = (type: PlayerNotification['type']) => {
  switch (type) {
    case 'link_approved':
      return PartyPopper;
    case 'link_rejected':
      return ShieldX;
    case 'welcome':
      return Sparkles;
    default:
      return Bell;
  }
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
};

const NotificationsSheet = ({ open, notifications, onClose, onMarkRead, onMarkAllRead }: NotificationsSheetProps) => {
  if (!open) return null;
  const hasUnread = notifications.some(n => !n.read_at);

  return (
    <div className="fixed inset-0 z-40 flex justify-center" role="dialog" aria-label="Notifications">
      <button type="button" aria-label="Close notifications" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`${apexSheet} relative mt-auto w-full max-w-md rounded-t-xl p-4 pb-8 sm:mb-auto sm:mt-16 sm:rounded-xl`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className={apexSectionTitle}>Notifications</h2>
          <div className="flex items-center gap-1">
            {hasUnread && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className={`${apexMonoTight} inline-flex items-center gap-1 rounded border border-[#45464d]/30 px-2 py-1 text-[#c6c6cd] transition-colors hover:text-[#dce7f8]`}
              >
                <CheckCheck size={12} /> Mark all
              </button>
            )}
            <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded text-[#c6c6cd] hover:text-[#d8e3fb]">
              <X size={17} />
            </button>
          </div>
        </div>

        {notifications.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[#45464d]/40 bg-white/[0.02] px-4 py-8 text-center text-sm text-[#c6c6cd]">
            No notifications yet. Log a drill or join a team to get started.
          </p>
        ) : (
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
            {notifications.map(notification => {
              const Icon = iconFor(notification.type);
              const unread = !notification.read_at;
              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => unread && onMarkRead(notification.id)}
                    className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                      unread ? 'border-[#b9c8de]/25 bg-[#b9c8de]/[0.06]' : 'border-white/5 bg-[#152031]/60'
                    }`}
                  >
                    <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded ${unread ? 'bg-[#dce7f8]/12 text-[#dce7f8]' : 'bg-white/[0.04] text-[#c6c6cd]'}`}>
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate font-player-display text-sm font-semibold text-[#d8e3fb]">{notification.title}</span>
                        <span className={`${apexMonoTight} shrink-0 text-[#c6c6cd]/50`}>{timeAgo(notification.created_at)}</span>
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-[#c6c6cd]">{notification.body}</span>
                    </span>
                    {unread && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff6d00] shadow-[0_0_6px_#ff6d00]" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationsSheet;
