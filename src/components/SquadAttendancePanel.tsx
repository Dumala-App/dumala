import React, { useMemo, useRef, useState } from 'react';
import {
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Link2,
  Pencil,
  Search,
  Star,
  Trash2,
  UserCheck,
  Users
} from 'lucide-react';
import type {
  AttendanceEntry,
  AttendanceSession,
  AttendanceSessionType,
  AttendanceStatus,
  Game,
  Player
} from '../types';
import {
  ATTENDANCE_SESSION_TYPES,
  ATTENDANCE_STATUS_LABELS,
  attendanceSessionTitle,
  createAttendanceSessionId,
  cycleAttendanceStatus,
  findLinkableGames,
  reconcileEntriesWithRoster,
  setEntryStatus,
  sortSessionsByDateDesc,
  summarizePlayerAttendance,
  summarizeSessionEntries,
  summarizeTeamAttendance
} from '../attendance/attendance';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { Textarea } from './ui/textarea';
import { cn } from '../lib/utils';

interface SquadAttendancePanelProps {
  players: Player[];
  games: Game[];
  sessions: AttendanceSession[];
  onSaveSession: (session: AttendanceSession) => void;
  onDeleteSession: (sessionId: string) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

const cardClass = 'rounded-2xl border border-cyan-300/10 bg-[#07111f]/88 p-4 text-slate-100 shadow-lg shadow-black/20 backdrop-blur-xl';
const statCardClass = 'rounded-xl border border-cyan-300/10 bg-[#0b1726]/66 p-4 text-slate-100 shadow-sm shadow-black/10 backdrop-blur-sm';
const subtleCardClass = 'rounded-xl border border-cyan-300/10 bg-[#0b1726]/72 p-3 text-slate-100 shadow-inner shadow-black/10';
const labelClass = 'text-[11px] font-black uppercase tracking-widest text-slate-400';
const titleClass = 'font-display text-base font-black tracking-tight text-slate-100';
const descriptionClass = 'mt-1 text-sm font-medium leading-relaxed text-slate-400';
const inputClass = 'rounded-xl border-cyan-300/10 bg-[#0b1726]/85 text-xs font-semibold text-slate-100 placeholder:text-slate-500 focus-visible:border-orange-300/60 focus-visible:ring-orange-300/25';
const selectContentClass = 'border-cyan-300/15 bg-[#0b1726] text-slate-100 shadow-2xl shadow-black/35';
const tableWrapClass = 'overflow-x-auto rounded-xl border border-cyan-300/10 bg-[#0b1726]/42 shadow-inner shadow-black/10';
const actionButtonClass = 'border-cyan-300/15 bg-[#0b1726]/85 text-slate-100 hover:border-orange-300/30 hover:bg-orange-300/10 hover:text-orange-100';

const statusChipStyles: Record<AttendanceStatus, string> = {
  present: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100 hover:border-emerald-300/60',
  absent: 'border-rose-400/45 bg-rose-500/20 text-rose-100 hover:border-rose-300/60',
  late: 'border-amber-400/45 bg-amber-500/18 text-amber-100 hover:border-amber-300/60',
  excused: 'border-sky-400/40 bg-sky-500/15 text-sky-100 hover:border-sky-300/60'
};

const statusBadgeVariant: Record<AttendanceStatus, React.ComponentProps<typeof Badge>['variant']> = {
  present: 'success',
  absent: 'destructive',
  late: 'warning',
  excused: 'info'
};

const formatSessionDate = (date: string): string => {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(parsed);
};

interface AttendanceDraft {
  sessionId: string | null;
  date: string;
  type: AttendanceSessionType;
  title: string;
  gameId: string;
  note: string;
  entries: AttendanceEntry[];
  createdAt: string | null;
}

const NO_GAME_VALUE = 'none';

export default function SquadAttendancePanel({
  players,
  games,
  sessions,
  onSaveSession,
  onDeleteSession
}: SquadAttendancePanelProps) {
  const [draft, setDraft] = useState<AttendanceDraft | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [playerSearch, setPlayerSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const draftRef = useRef<HTMLDivElement | null>(null);

  const overview = useMemo(() => summarizeTeamAttendance(sessions, players), [sessions, players]);
  const orderedSessions = useMemo(() => sortSessionsByDateDesc(sessions), [sessions]);
  const playerSummaries = useMemo(
    () => players
      .map(player => summarizePlayerAttendance(sessions, player))
      .sort((a, b) => {
        // Surface the players who need a nudge: most absences first.
        if (b.absent !== a.absent) return b.absent - a.absent;
        return a.playerName.localeCompare(b.playerName);
      }),
    [players, sessions]
  );

  const openTakeAttendance = () => {
    setDraft({
      sessionId: null,
      date: today(),
      type: 'Training',
      title: '',
      gameId: '',
      note: '',
      entries: reconcileEntriesWithRoster(players),
      createdAt: null
    });
    setExpandedSessionId(null);
    window.requestAnimationFrame(() => {
      draftRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const openEditSession = (session: AttendanceSession) => {
    setDraft({
      sessionId: session.id,
      date: session.date,
      type: session.type,
      title: session.title ?? '',
      gameId: session.gameId ?? '',
      note: session.note ?? '',
      entries: reconcileEntriesWithRoster(players, session.entries),
      createdAt: session.createdAt
    });
    window.requestAnimationFrame(() => {
      draftRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const closeDraft = () => {
    setDraft(null);
    setPlayerSearch('');
  };

  const linkableGames = draft ? findLinkableGames(games, draft.date) : [];

  const draftCounts = draft
    ? summarizeSessionEntries(draft.entries)
    : { present: 0, absent: 0, late: 0, excused: 0 };

  const cyclePlayer = (playerId: string) => {
    setDraft(current => {
      if (!current) return current;
      const entry = current.entries.find(item => item.playerId === playerId);
      if (!entry) return current;
      return { ...current, entries: setEntryStatus(current.entries, playerId, cycleAttendanceStatus(entry.status)) };
    });
  };

  const setPlayerStatus = (playerId: string, status: AttendanceStatus) => {
    setDraft(current => current ? { ...current, entries: setEntryStatus(current.entries, playerId, status) } : current);
  };

  const markAllPresent = () => {
    setDraft(current => current
      ? { ...current, entries: current.entries.map(entry => ({ ...entry, status: 'present' as AttendanceStatus })) }
      : current);
  };

  const handleSaveDraft = () => {
    if (!draft) return;
    const now = new Date().toISOString();
    const linkedGame = draft.gameId ? games.find(game => game.id === draft.gameId) : undefined;
    const session: AttendanceSession = {
      id: draft.sessionId ?? createAttendanceSessionId(),
      date: draft.date,
      type: linkedGame ? 'Match' : draft.type,
      title: draft.title.trim() || undefined,
      gameId: draft.gameId || undefined,
      note: draft.note.trim() || undefined,
      entries: draft.entries,
      createdAt: draft.createdAt ?? now,
      updatedAt: draft.sessionId ? now : undefined
    };
    onSaveSession(session);
    closeDraft();
    setExpandedSessionId(session.id);
  };

  const handleDelete = (sessionId: string) => {
    onDeleteSession(sessionId);
    setConfirmDeleteId(null);
    if (expandedSessionId === sessionId) setExpandedSessionId(null);
    if (draft?.sessionId === sessionId) closeDraft();
  };

  const filteredDraftEntries = draft
    ? draft.entries.filter(entry => entry.playerNameSnapshot.toLowerCase().includes(playerSearch.trim().toLowerCase()))
    : [];

  const overviewMetrics = [
    { label: 'Sessions logged', value: String(overview.totalSessions), icon: ClipboardList, tone: 'text-slate-100' },
    { label: 'This month', value: String(overview.sessionsThisMonth), icon: CalendarClock, tone: 'text-orange-200' },
    { label: 'Team attendance', value: overview.overallRate === null ? '—' : `${overview.overallRate}%`, icon: UserCheck, tone: 'text-success' },
    { label: 'Perfect record', value: String(overview.perfectAttendanceCount), icon: Star, tone: 'text-amber-200' }
  ];

  return (
    <div id="squad-attendance-panel" className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {overviewMetrics.map(metric => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className={statCardClass}>
              <div className="flex items-center justify-between gap-3">
                <p className={labelClass}>{metric.label}</p>
                <Icon size={16} className={metric.tone} aria-hidden="true" />
              </div>
              <p className={`mt-2 text-xl font-black ${metric.tone}`}>{metric.value}</p>
            </div>
          );
        })}
      </div>

      <div className={cardClass}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-orange-300">Attendance register</p>
            <h3 className={`mt-1 ${titleClass}`}>Track who shows up</h3>
            <p className={descriptionClass}>
              Everyone starts marked present — just tap the players who missed. Link a session to a scheduled match to keep records together.
            </p>
          </div>
          {!draft && (
            <Button
              id="take-attendance-btn"
              type="button"
              onClick={openTakeAttendance}
              disabled={players.length === 0}
              className="h-10 gap-2 rounded-xl bg-[linear-gradient(180deg,#FF9A52,#FF8A3D)] px-4 text-xs font-bold text-[#180A00] shadow-[inset_0_1px_0_rgba(255,255,255,.32),0_6px_14px_-7px_rgba(255,138,61,.5)] hover:bg-[linear-gradient(180deg,#FFB06E,#FFA35F)] hover:text-[#180A00] disabled:opacity-50"
            >
              <CalendarCheck size={15} aria-hidden="true" /> Take attendance
            </Button>
          )}
        </div>

        {players.length === 0 && !draft && (
          <div className="mt-4 rounded-xl border border-dashed border-cyan-300/15 bg-[#0b1726]/42 px-4 py-6 text-center">
            <Users className="mx-auto text-slate-400" size={26} aria-hidden="true" />
            <p className="mt-2 text-sm font-black text-slate-100">Add players first</p>
            <p className="mt-1 text-sm font-medium text-slate-400">Register your squad on the Players tab, then start logging attendance here.</p>
          </div>
        )}
      </div>

      {draft && (
        <div ref={draftRef} className={cn(cardClass, 'space-y-4 border-orange-300/25')}>
          <div className="flex flex-col gap-2 border-b border-cyan-300/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="text-[#FFB37E]" size={18} aria-hidden="true" />
              <h3 className={titleClass}>{draft.sessionId ? 'Edit attendance record' : 'New attendance record'}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-black">
              <span className="rounded-md border border-emerald-400/40 bg-emerald-500/15 px-2 py-1 text-emerald-100">{draftCounts.present} present</span>
              <span className="rounded-md border border-rose-400/45 bg-rose-500/20 px-2 py-1 text-rose-100">{draftCounts.absent} absent</span>
              <span className="rounded-md border border-amber-400/45 bg-amber-500/18 px-2 py-1 text-amber-100">{draftCounts.late} late</span>
              <span className="rounded-md border border-sky-400/40 bg-sky-500/15 px-2 py-1 text-sky-100">{draftCounts.excused} excused</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="mb-1.5 block text-slate-400">Date</Label>
              <Input
                type="date"
                value={draft.date}
                onChange={event => setDraft(current => current ? { ...current, date: event.target.value, gameId: '' } : current)}
                className={cn(inputClass, 'h-10 w-full')}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-slate-400">Session type</Label>
              <Select
                value={draft.type}
                onValueChange={value => setDraft(current => current ? { ...current, type: value as AttendanceSessionType } : current)}
                disabled={Boolean(draft.gameId)}
              >
                <SelectTrigger className={cn(inputClass, 'h-10')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  {ATTENDANCE_SESSION_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="mb-1.5 block text-slate-400">Title <span className="font-medium normal-case tracking-normal text-slate-500">(optional)</span></Label>
              <Input
                type="text"
                value={draft.title}
                onChange={event => setDraft(current => current ? { ...current, title: event.target.value } : current)}
                placeholder="e.g. Tuesday evening session"
                className={cn(inputClass, 'h-10 w-full')}
              />
            </div>
          </div>

          {linkableGames.length > 0 && (
            <div className={subtleCardClass}>
              <div className="flex items-center gap-2">
                <Link2 size={14} className="text-orange-200" aria-hidden="true" />
                <Label className="text-slate-300">Link to a scheduled event on this date</Label>
              </div>
              <Select
                value={draft.gameId || NO_GAME_VALUE}
                onValueChange={value => setDraft(current => {
                  if (!current) return current;
                  const nextGameId = value === NO_GAME_VALUE ? '' : value;
                  const linkedGame = nextGameId ? games.find(game => game.id === nextGameId) : undefined;
                  return { ...current, gameId: nextGameId, type: linkedGame ? 'Match' : current.type };
                })}
              >
                <SelectTrigger className={cn(inputClass, 'mt-2 h-10')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  <SelectItem value={NO_GAME_VALUE}>No linked event</SelectItem>
                  {linkableGames.map(game => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.type} vs {game.opponent} · {game.time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                Tap a player to change status · cycles present → absent → late → excused
              </p>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={13} aria-hidden="true" />
                  <Input
                    value={playerSearch}
                    onChange={event => setPlayerSearch(event.target.value)}
                    placeholder="Find player..."
                    className={cn(inputClass, 'h-9 w-full pl-8 sm:w-44')}
                    aria-label="Filter players"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={markAllPresent}
                  className={cn('h-9 gap-1 rounded-lg px-2.5 text-[10px] font-black uppercase tracking-wider', actionButtonClass)}
                >
                  <CheckCircle2 size={13} aria-hidden="true" /> All present
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {filteredDraftEntries.map(entry => (
                <div
                  key={entry.playerId}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-xl border px-3 py-2 transition-colors',
                    statusChipStyles[entry.status]
                  )}
                >
                  <button
                    type="button"
                    onClick={() => cyclePlayer(entry.playerId)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    aria-label={`${entry.playerNameSnapshot} is ${ATTENDANCE_STATUS_LABELS[entry.status]}. Tap to change.`}
                  >
                    <span className="truncate text-xs font-black">{entry.playerNameSnapshot}</span>
                  </button>
                  <div className="flex shrink-0 items-center gap-1" role="group" aria-label={`Set status for ${entry.playerNameSnapshot}`}>
                    {(['present', 'absent', 'late', 'excused'] as AttendanceStatus[]).map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setPlayerStatus(entry.playerId, status)}
                        aria-pressed={entry.status === status}
                        title={ATTENDANCE_STATUS_LABELS[status]}
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-black uppercase transition-transform',
                          entry.status === status
                            ? 'scale-105 bg-white/90 text-slate-950 shadow'
                            : 'bg-black/25 text-white/70 hover:bg-black/40'
                        )}
                      >
                        {ATTENDANCE_STATUS_LABELS[status].charAt(0)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {filteredDraftEntries.length === 0 && (
              <p className="rounded-xl border border-dashed border-cyan-300/15 bg-[#0b1726]/42 px-4 py-4 text-center text-xs font-medium text-slate-400">
                No players match "{playerSearch}".
              </p>
            )}
          </div>

          <div>
            <Label className="mb-1.5 block text-slate-400">Session note <span className="font-medium normal-case tracking-normal text-slate-500">(optional)</span></Label>
            <Textarea
              value={draft.note}
              onChange={event => setDraft(current => current ? { ...current, note: event.target.value } : current)}
              placeholder="Weather, reason for low turnout, reminders..."
              rows={2}
              className={cn(inputClass, 'min-h-16 w-full')}
            />
          </div>

          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={closeDraft}
              className={cn('rounded-xl', actionButtonClass)}
            >
              Cancel
            </Button>
            <Button
              id="save-attendance-btn"
              type="button"
              size="sm"
              onClick={handleSaveDraft}
              className="rounded-xl bg-[linear-gradient(180deg,#FF9A52,#FF8A3D)] font-bold text-[#180A00] shadow-[inset_0_1px_0_rgba(255,255,255,.32),0_6px_14px_-7px_rgba(255,138,61,.5)] hover:bg-[linear-gradient(180deg,#FFB06E,#FFA35F)] hover:text-[#180A00]"
            >
              {draft.sessionId ? 'Save changes' : 'Save attendance'}
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className={cardClass}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className={titleClass}>Session history</h3>
              <p className={descriptionClass}>
                {orderedSessions.length} session{orderedSessions.length === 1 ? '' : 's'} recorded. Tap one to review or edit it.
              </p>
            </div>
            {orderedSessions.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setHistoryExpanded(current => !current)}
                className={cn('h-9 gap-1 rounded-lg px-3 text-[10px] font-black uppercase tracking-wider', actionButtonClass)}
                aria-expanded={historyExpanded}
              >
                {historyExpanded ? <><ChevronUp size={13} aria-hidden="true" /> Hide</> : <><ChevronDown size={13} aria-hidden="true" /> Show</>}
              </Button>
            )}
          </div>

          {orderedSessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-cyan-300/15 bg-[#0b1726]/42 px-4 py-6 text-center">
              <ClipboardList className="mx-auto text-slate-400" size={26} aria-hidden="true" />
              <p className="mt-2 text-sm font-black text-slate-100">No attendance yet</p>
              <p className="mt-1 text-sm font-medium text-slate-400">Log your first session to start building each player's record.</p>
            </div>
          ) : historyExpanded && (
            <div className="space-y-2">
              {orderedSessions.map(session => {
                const counts = summarizeSessionEntries(session.entries);
                const isExpanded = expandedSessionId === session.id;
                const missing = counts.absent + counts.late + counts.excused;
                return (
                  <div key={session.id} className={cn(subtleCardClass, 'p-0 overflow-hidden')}>
                    <button
                      type="button"
                      onClick={() => setExpandedSessionId(current => current === session.id ? null : session.id)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left hover:bg-white/[0.03]"
                      aria-expanded={isExpanded}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-xs font-black text-slate-100">{attendanceSessionTitle(session, games)}</span>
                          <Badge variant="secondary" className="shrink-0">{session.type}</Badge>
                          {session.gameId && <Link2 size={12} className="shrink-0 text-orange-200" aria-label="Linked to a scheduled event" />}
                        </div>
                        <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{formatSessionDate(session.date)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-100">{counts.present} in</span>
                        {missing > 0
                          ? <span className="rounded-md border border-rose-400/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-black text-rose-100">{missing} out</span>
                          : <span className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-100">Full</span>}
                        {isExpanded ? <ChevronUp size={15} className="text-slate-400" aria-hidden="true" /> : <ChevronDown size={15} className="text-slate-400" aria-hidden="true" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-cyan-300/10 px-3 py-3">
                        {session.note && <p className="mb-2 rounded-lg bg-[#0b1726]/72 px-3 py-2 text-xs font-medium text-slate-300">{session.note}</p>}
                        <div className="flex flex-wrap gap-1.5">
                          {session.entries.map(entry => (
                            <span
                              key={entry.playerId}
                              className={cn('rounded-md border px-2 py-1 text-[10px] font-bold', statusChipStyles[entry.status])}
                            >
                              {entry.playerNameSnapshot} · {ATTENDANCE_STATUS_LABELS[entry.status]}
                            </span>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center justify-end gap-2">
                          {confirmDeleteId === session.id ? (
                            <>
                              <span className="mr-auto text-[11px] font-bold text-rose-200">Delete this record?</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setConfirmDeleteId(null)}
                                className={cn('rounded-lg', actionButtonClass)}
                              >
                                Keep
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleDelete(session.id)}
                                className="rounded-lg bg-rose-500 text-white hover:bg-rose-600"
                              >
                                Delete
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openEditSession(session)}
                                className={cn('h-8 gap-1 rounded-lg px-2.5 text-[10px] font-black uppercase tracking-wider', actionButtonClass)}
                              >
                                <Pencil size={12} aria-hidden="true" /> Edit
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setConfirmDeleteId(session.id)}
                                className="h-8 gap-1 rounded-lg border-rose-400/30 bg-rose-500/10 px-2.5 text-[10px] font-black uppercase tracking-wider text-rose-100 hover:border-rose-300/50 hover:bg-rose-500/20 hover:text-rose-50"
                              >
                                <Trash2 size={12} aria-hidden="true" /> Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={cardClass}>
          <h3 className={titleClass}>Player records</h3>
          <p className={descriptionClass}>Attendance rate counts present and late as attended; excused sessions are set aside.</p>
          {playerSummaries.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-cyan-300/15 bg-[#0b1726]/42 px-4 py-6 text-center text-sm font-medium text-slate-400">
              No players registered yet.
            </div>
          ) : (
            <div className={cn('mt-3', tableWrapClass)}>
              <table className="min-w-[420px] w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-cyan-300/10 bg-[#0b1726]/72 text-[11px] uppercase tracking-widest text-slate-400">
                    <th className="px-3 py-2 font-black">Player</th>
                    <th className="px-3 py-2 text-center font-black">Rate</th>
                    <th className="px-2 py-2 text-center font-black" title="Present">P</th>
                    <th className="px-2 py-2 text-center font-black" title="Absent">A</th>
                    <th className="px-2 py-2 text-center font-black" title="Late">L</th>
                    <th className="px-2 py-2 text-center font-black" title="Excused">E</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-300/10">
                  {playerSummaries.map(summary => {
                    const rateTone = summary.attendanceRate === null
                      ? 'text-slate-500'
                      : summary.attendanceRate >= 85
                        ? 'text-success'
                        : summary.attendanceRate >= 60
                          ? 'text-amber-200'
                          : 'text-rose-200';
                    return (
                      <tr key={summary.playerId} className="text-slate-100">
                        <td className="px-3 py-2.5 font-black">
                          <span className="block truncate">{summary.playerName}</span>
                          {summary.lastAbsenceDate && (
                            <span className="text-[10px] font-semibold text-slate-500">Last miss {formatSessionDate(summary.lastAbsenceDate)}</span>
                          )}
                        </td>
                        <td className={cn('px-3 py-2.5 text-center font-black', rateTone)}>
                          {summary.attendanceRate === null ? '—' : `${summary.attendanceRate}%`}
                        </td>
                        <td className="px-2 py-2.5 text-center font-semibold text-emerald-200">{summary.present}</td>
                        <td className="px-2 py-2.5 text-center font-semibold text-rose-200">{summary.absent}</td>
                        <td className="px-2 py-2.5 text-center font-semibold text-amber-200">{summary.late}</td>
                        <td className="px-2 py-2.5 text-center font-semibold text-sky-200">{summary.excused}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
