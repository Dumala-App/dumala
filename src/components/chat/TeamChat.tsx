import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BellOff, Check, Flag, Loader2, MoreVertical, RefreshCw, Send, Settings, ShieldCheck, Trash2 } from 'lucide-react';
import type { CloudRuntime } from '../../cloud/runtime';
import type { ChatMessage } from '../../cloud/chat';

export type ChatTone = 'apex' | 'glass';

interface TeamChatProps {
  runtime: Extract<CloudRuntime, { enabled: true }>;
  clubId: string;
  selfUserId: string | null;
  tone?: ChatTone;
  /** Staff can delete any message. */
  canModerateAll?: boolean;
  title?: string;
  onBack?: () => void;
}

const TONE: Record<ChatTone, Record<string, string>> = {
  apex: {
    shell: 'bg-[#081425] text-[#d8e3fb]',
    header: 'border-[#45464d]/30 bg-[#081425]/85',
    eyebrow: 'font-player-mono text-[10px] uppercase tracking-[0.15em] text-[#c6c6cd]/70',
    title: 'font-player-display font-bold uppercase tracking-wide',
    self: 'bg-[#dce7f8] text-[#0a1526]',
    other: 'border border-white/5 bg-[#152031] text-[#d8e3fb]',
    coach: 'border border-[#b9c8de]/25 bg-[#1f2a3c] text-[#d8e3fb]',
    roleBadge: 'border border-[#b9c8de]/50 text-[#dce7f8]',
    adminName: 'text-[#ff9440]',
    adminBadge: 'border border-[#ff9440]/50 bg-[#ff6d00]/10 text-[#ff9440]',
    captainName: 'text-[#8df2c7]',
    captainBadge: 'border border-[#8df2c7]/45 bg-[#8df2c7]/10 text-[#8df2c7]',
    accent: 'text-[#dce7f8]',
    input: 'border border-[#45464d]/30 bg-[#040e1f] text-[#d8e3fb] placeholder:text-[#c6c6cd]/50 focus:border-[#b9c8de]/60',
    send: 'bg-[#ff6d00] text-white',
    muted: 'text-[#c6c6cd]/70',
    divider: 'bg-[#152031] text-[#c6c6cd]',
    menu: 'border border-[#45464d]/40 bg-[#111c2d] text-[#d8e3fb]'
  },
  glass: {
    shell: 'bg-[#020713] text-slate-100',
    header: 'border-cyan-300/10 bg-[#07111f]/85',
    eyebrow: 'text-[10px] font-black uppercase tracking-[0.15em] text-slate-400',
    title: 'font-display font-black uppercase tracking-wide',
    self: 'bg-orange-400 text-slate-950',
    other: 'border border-cyan-300/10 bg-[#07111f]/85 text-slate-100',
    coach: 'border border-orange-300/20 bg-[#0b1726]/85 text-slate-100',
    roleBadge: 'border border-orange-300/50 text-orange-300',
    adminName: 'text-orange-300',
    adminBadge: 'border border-orange-300/50 bg-orange-300/10 text-orange-300',
    captainName: 'text-cyan-300',
    captainBadge: 'border border-cyan-300/45 bg-cyan-300/10 text-cyan-300',
    accent: 'text-orange-300',
    input: 'border border-cyan-300/12 bg-[#0b1726]/85 text-slate-100 placeholder:text-slate-500 focus:border-orange-300/60',
    send: 'bg-orange-400 text-slate-950',
    muted: 'text-slate-400',
    divider: 'bg-[#07111f] text-slate-400',
    menu: 'border border-cyan-300/15 bg-[#07111f] text-slate-100'
  }
};

const STAFF_ROLES = new Set(['owner', 'admin', 'coach', 'staff']);
const POLL_MS = 4000;

const dayKey = (iso: string) => new Date(iso).toDateString();
const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

export const getChatDisplayName = (message: Pick<ChatMessage, 'author_name' | 'author_role'>): string => (
  message.author_role === 'player' ? firstName(message.author_name) : message.author_name
);

const TeamChat = ({ runtime, clubId, selfUserId, tone = 'glass', canModerateAll = false, title = 'Team chat', onBack }: TeamChatProps) => {
  const t = TONE[tone];
  const chat = runtime.dataAccess.chat;
  const [channelId, setChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [captainUserId, setCaptainUserId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [muted, setMuted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(`dumala:team-chat-muted:${clubId}`) === 'true';
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [clearing, setClearing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const skipNextMuteSaveRef = useRef(false);
  const visibleMessages = useMemo(
    () => canModerateAll ? messages.filter(message => !message.deleted_at) : messages,
    [canModerateAll, messages]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    skipNextMuteSaveRef.current = true;
    setMuted(window.localStorage.getItem(`dumala:team-chat-muted:${clubId}`) === 'true');
  }, [clubId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (skipNextMuteSaveRef.current) {
      skipNextMuteSaveRef.current = false;
      return;
    }
    window.localStorage.setItem(`dumala:team-chat-muted:${clubId}`, String(muted));
  }, [clubId, muted]);

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  const refresh = useCallback(async () => {
    const next = await chat.listMessages(clubId);
    setMessages(next);
  }, [chat, clubId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const cid = await chat.ensureChannel(clubId);
        if (!active) return;
        setChannelId(cid);
        chat.getCaptainUserId(clubId)
          .then(id => { if (active) setCaptainUserId(id); })
          .catch(() => undefined);
        await refresh();
        await chat.markRead(cid).catch(() => undefined);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Chat is unavailable.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [chat, clubId, refresh]);

  // Poll for new messages while visible.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!autoRefresh) return;
      if (typeof document !== 'undefined' && document.hidden) return;
      refresh().catch(() => undefined);
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [autoRefresh, refresh]);

  useEffect(() => {
    if (atBottomRef.current) scrollToBottom();
  }, [messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');
    try {
      await chat.postMessage(clubId, body);
      setDraft('');
      atBottomRef.current = true;
      await refresh();
      if (channelId) await chat.markRead(channelId).catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send.');
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: string) => {
    setMenuFor(null);
    try { await chat.deleteMessage(id); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not remove.'); }
  };
  const report = async (id: string) => {
    setMenuFor(null);
    try { await chat.reportMessage(id, null); setError('Reported to your coaches.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not report.'); }
  };
  const clearVisibleMessages = async () => {
    if (!canModerateAll || clearing || visibleMessages.length === 0) return;
    setSettingsOpen(false);
    setClearing(true);
    setError('');
    try {
      await Promise.all(visibleMessages.map(message => chat.deleteMessage(message.id)));
      await refresh();
      setError('Team chat cleared for this channel.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not clear chat.');
    } finally {
      setClearing(false);
    }
  };

  let lastDay = '';

  return (
    <div className={`flex h-full flex-col ${t.shell}`}>
      <header className={`flex items-center gap-3 border-b px-4 py-3 backdrop-blur-md ${t.header}`}>
        {onBack && (
          <button type="button" onClick={onBack} aria-label="Back" className={`flex h-9 w-9 items-center justify-center rounded-lg ${t.accent}`}>
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className={t.eyebrow}>Team channel</p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className={`${t.title} truncate text-base`}>{title}</h1>
            {muted && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${t.divider}`}>Muted</span>}
          </div>
          {canModerateAll && (
            <p className={`mt-0.5 text-[11px] ${t.muted}`}>
              Coach controls active - {visibleMessages.length} visible {visibleMessages.length === 1 ? 'message' : 'messages'}
            </p>
          )}
        </div>
        {canModerateAll && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setSettingsOpen(open => !open)}
              aria-label="Chat settings"
              aria-expanded={settingsOpen}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition hover:bg-white/5 ${t.menu}`}
            >
              <Settings size={17} />
            </button>
            {settingsOpen && (
              <div className={`absolute right-0 top-full z-20 mt-2 w-60 overflow-hidden rounded-xl text-xs shadow-2xl shadow-black/30 ${t.menu}`}>
                <div className="border-b border-white/10 px-3 py-2">
                  <p className="font-bold text-slate-100">Coach settings</p>
                  <p className={t.muted}>Manage this official team channel.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMuted(current => !current)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-white/5"
                >
                  <span className="flex items-center gap-2"><BellOff size={14} /> Mute channel</span>
                  {muted && <Check size={14} className={t.accent} />}
                </button>
                <button
                  type="button"
                  onClick={() => setAutoRefresh(current => !current)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-white/5"
                >
                  <span className="flex items-center gap-2"><RefreshCw size={14} /> Auto refresh</span>
                  {autoRefresh && <Check size={14} className={t.accent} />}
                </button>
                <button
                  type="button"
                  onClick={() => void clearVisibleMessages()}
                  disabled={clearing || visibleMessages.length === 0}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-rose-300 hover:bg-rose-300/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {clearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Clear chat
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <div ref={scrollRef} onScroll={onScroll} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className={`flex items-center gap-2 text-sm ${t.muted}`}><Loader2 size={16} className="animate-spin" /> Loading messages...</div>
        ) : visibleMessages.length === 0 ? (
          <p className={`py-10 text-center text-sm ${t.muted}`}>No messages yet. Say hello to your team.</p>
        ) : (
          visibleMessages.map(message => {
            const self = !!selfUserId && message.author_user_id === selfUserId;
            const staff = STAFF_ROLES.has(message.author_role);
            const captain = !!captainUserId && message.author_user_id === captainUserId;
            const showDay = dayKey(message.created_at) !== lastDay;
            lastDay = dayKey(message.created_at);
            const canDelete = !message.deleted_at && (self || canModerateAll);
            const canReport = !message.deleted_at && !self;
            const displayName = getChatDisplayName(message);
            return (
              <React.Fragment key={message.id}>
                {showDay && (
                  <div className="flex justify-center py-1">
                    <span className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${t.divider}`}>{dayLabel(message.created_at)}</span>
                  </div>
                )}
                <div className={`flex ${self ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${self ? 'items-end' : 'items-start'}`}>
                    {!self && (
                      <div className="mb-1 flex items-center gap-2 px-1">
                        <span className={`text-xs font-bold ${staff ? t.adminName : captain ? t.captainName : t.muted}`}>{displayName}</span>
                        {staff && <span className={`rounded px-1.5 py-0 text-[8px] font-bold uppercase ${t.adminBadge}`}>{message.author_role}</span>}
                        {!staff && captain && <span className={`rounded px-1.5 py-0 text-[8px] font-bold uppercase ${t.captainBadge}`}>captain</span>}
                      </div>
                    )}
                    <div className={`group relative rounded-2xl px-3.5 py-2.5 ${message.deleted_at ? `${t.other} italic opacity-60` : self ? t.self : staff ? t.coach : t.other}`}>
                      {message.deleted_at ? (
                        <p className="text-sm">Message removed</p>
                      ) : (
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.body}</p>
                      )}
                      <div className={`mt-1 flex items-center justify-end gap-1.5 ${self ? 'text-black/60' : t.muted}`}>
                        <span className="text-[10px]">{timeLabel(message.created_at)}</span>
                        {(canDelete || canReport) && (
                          <button type="button" aria-label="Message actions" onClick={() => setMenuFor(menuFor === message.id ? null : message.id)} className="opacity-60 hover:opacity-100">
                            <MoreVertical size={13} />
                          </button>
                        )}
                      </div>
                      {menuFor === message.id && (
                        <div className={`absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-lg text-xs shadow-xl ${t.menu}`}>
                          {canReport && (
                            <button type="button" onClick={() => void report(message.id)} className="flex w-full items-center gap-2 px-3 py-2 hover:bg-white/5">
                              <Flag size={13} /> Report
                            </button>
                          )}
                          {canDelete && (
                            <button type="button" onClick={() => void remove(message.id)} className="flex w-full items-center gap-2 px-3 py-2 text-rose-300 hover:bg-white/5">
                              <Trash2 size={13} /> Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
      </div>

      {error && <p className={`px-4 py-1 text-xs ${t.muted}`} role="status">{error}</p>}

      <form onSubmit={send} className={`flex items-center gap-2 border-t px-3 py-3 ${t.header}`}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder={muted ? 'Channel muted for you' : 'Message your team...'}
          className={`h-11 flex-1 rounded-2xl px-4 text-sm outline-none ${t.input}`}
        />
        <button type="submit" disabled={sending || !draft.trim()} aria-label="Send" className={`flex h-11 w-11 items-center justify-center rounded-2xl ${t.send} disabled:opacity-40`}>
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
};

export const ChatConsentGate = ({ tone = 'apex' }: { tone?: ChatTone }) => {
  const t = TONE[tone];
  return (
    <div className={`flex h-full flex-col items-center justify-center gap-3 p-8 text-center ${t.shell}`}>
      <ShieldCheck size={28} className={t.accent} />
      <h2 className={`${t.title} text-lg`}>Guardian consent needed</h2>
      <p className={`max-w-xs text-sm ${t.muted}`}>
        Because you're under 18, a parent or guardian must approve consent in your profile before you can use team chat.
      </p>
    </div>
  );
};

export default TeamChat;
