import React, { useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, Clock, Dumbbell, Gauge, Pause, Play, RotateCcw, ShieldCheck, Timer, Users, X } from 'lucide-react';
import type { AssessmentSession, Game, Player, TeamInfo } from '../types';
import type {
  DayName,
  ScheduledDrill,
  SessionBlockId,
  TrainingSessionMeta,
  TrainingSessionMetaMap,
  TrainingSessionSummary,
  WeeklySchedule
} from '../training/synchronization';
import {
  SESSION_BLOCKS,
  SESSION_LOAD_THRESHOLDS,
  buildTrainingSessionSummary,
  getScheduledDrillBlock,
  getScheduledDrillDuration,
  getScheduledDrillLoadPoints,
  getWeekDaysMap,
  getWeekStartDate,
  toDateKey
} from '../training/synchronization';
import { DRILL_INSTRUCTIONS, getDrillEquipment, getDrillHowToRun } from '../training/drillLibrary';
import { trainingSessionMetaMapSchema, weeklyScheduleSchema } from '../persistence/schemas';
import { readJsonStorage, STORAGE_KEYS, writeJsonStorage } from '../persistence/storage';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { getDrillIcon } from './TrainingDrillCard';

interface TrainingSessionDetailModalProps {
  day: DayName;
  teamInfo: TeamInfo;
  players: Player[];
  games: Game[];
  assessments: AssessmentSession[];
  onClose: () => void;
  onOpenPlanner: (day: DayName) => void;
}

const weeklyScheduleWeeksSchema = z.record(z.string(), weeklyScheduleSchema);

const createEmptyWeeklySchedule = (): WeeklySchedule => ({
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: [],
  Sunday: []
});

const readTrainingScheduleForWeek = (weekKey: string): WeeklySchedule => {
  const scheduleWeeks = readJsonStorage(STORAGE_KEYS.weeklyScheduleWeeks, weeklyScheduleWeeksSchema, {}, 'Weekly training weeks');
  if (scheduleWeeks[weekKey]) return scheduleWeeks[weekKey];
  return readJsonStorage(STORAGE_KEYS.weeklySchedule, weeklyScheduleSchema, createEmptyWeeklySchedule(), 'Weekly training');
};

const readTrainingSessionMeta = (): TrainingSessionMetaMap => readJsonStorage(
  STORAGE_KEYS.trainingSessionMeta,
  trainingSessionMetaMapSchema,
  {},
  'Training session notes'
);

const notifyTrainingStorageChanged = (key: string) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new StorageEvent('storage', { key }));
};

const getBlockTone = (block: SessionBlockId) => {
  if (block === 'warmup') return 'border-amber-300/20 bg-amber-300/10 text-amber-100';
  if (block === 'tactical') return 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100';
  if (block === 'conditioning') return 'border-orange-300/20 bg-orange-300/10 text-orange-100';
  if (block === 'cooldown') return 'border-indigo-300/20 bg-indigo-300/10 text-indigo-100';
  return 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100';
};

const getReadinessTone = (summary: TrainingSessionSummary) => {
  if (summary.readiness === 'ready') return 'border-emerald-300/25 bg-emerald-300/12 text-emerald-100';
  if (summary.readiness === 'high_load') return 'border-red-300/25 bg-red-500/12 text-red-100';
  if (summary.readiness === 'needs_structure') return 'border-amber-300/25 bg-amber-300/12 text-amber-100';
  return 'border-slate-500/20 bg-white/[0.04] text-slate-300';
};

const getDrillEquipmentList = (drill: ScheduledDrill) => drill.equipment ?? getDrillEquipment(drill.drillId);

const createBlockTimerSeconds = (drills: readonly ScheduledDrill[]): Record<SessionBlockId, number> => (
  SESSION_BLOCKS.reduce<Record<SessionBlockId, number>>((timers, block) => {
    timers[block.id] = drills
      .filter(drill => getScheduledDrillBlock(drill) === block.id)
      .reduce((total, drill) => total + getScheduledDrillDuration(drill) * 60, 0);
    return timers;
  }, {
    warmup: 0,
    technical: 0,
    tactical: 0,
    conditioning: 0,
    cooldown: 0
  })
);

const formatTimer = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
};

const TeamStatusSummary = ({
  teamInfo,
  players,
  games,
  assessments,
  summary,
  targetedPlayers
}: {
  teamInfo: TeamInfo;
  players: Player[];
  games: Game[];
  assessments: AssessmentSession[];
  summary: TrainingSessionSummary;
  targetedPlayers: string[];
}) => {
  const activePlayers = players.filter(player => player.registrationStatus === 'Active');
  const pendingPlayers = players.filter(player => player.registrationStatus === 'Pending');
  const suspendedPlayers = players.filter(player => player.registrationStatus === 'Suspended');
  const assessedPlayerIds = new Set(assessments.map(assessment => assessment.playerId));
  const assessedActiveCount = activePlayers.filter(player => assessedPlayerIds.has(player.id)).length;
  const assessmentCoverage = activePlayers.length > 0 ? Math.round((assessedActiveCount / activePlayers.length) * 100) : 0;
  const todayKey = toDateKey(new Date());
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const weekEndKey = toDateKey(sevenDaysFromNow);
  const upcomingEvents = games
    .filter(game => game.status === 'Upcoming' && game.date >= todayKey && game.date <= weekEndKey)
    .sort((first, second) => first.date.localeCompare(second.date) || first.time.localeCompare(second.time));
  const upcomingMatch = upcomingEvents.find(game => game.type !== 'Training' && game.type !== 'Meeting');
  const completionLabel = summary.drills.length > 0
    ? `${summary.completedCount}/${summary.drills.length}`
    : '0/0';
  const trainingLoadTone = summary.loadPoints >= SESSION_LOAD_THRESHOLDS.high
    ? 'High'
    : summary.loadPoints >= SESSION_LOAD_THRESHOLDS.optimal
      ? 'Moderate'
      : 'Light';

  return (
    <section aria-labelledby="team-status-summary-title" className="rounded-xl border border-cyan-300/15 bg-cyan-300/8 p-3">
      <div className="flex items-start gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-100">
          <ShieldCheck size={15} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 id="team-status-summary-title" className="text-xs font-black text-slate-50">{teamInfo.name}</h3>
          <p className="mt-0.5 text-[10px] font-semibold leading-relaxed text-slate-400">Current team status for this training session.</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          { label: 'Active', value: String(activePlayers.length), tone: 'border-emerald-300/15 bg-emerald-300/8 text-emerald-100' },
          { label: 'Limited', value: String(pendingPlayers.length + suspendedPlayers.length), tone: 'border-amber-300/15 bg-amber-300/8 text-amber-100' },
          { label: 'Assessments', value: `${assessmentCoverage}%`, tone: 'border-indigo-300/15 bg-indigo-300/8 text-indigo-100' },
          { label: 'Session done', value: completionLabel, tone: 'border-cyan-300/15 bg-cyan-300/8 text-cyan-100' }
        ].map(item => (
          <div key={item.label} className={`rounded-lg border p-2 ${item.tone}`}>
            <strong className="block text-base font-black text-slate-50">{item.value}</strong>
            <span className="text-[8px] font-black uppercase tracking-wider">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.035] p-2">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Training load</span>
          <p className="mt-1 text-[11px] font-semibold text-slate-200">{trainingLoadTone} load - {summary.loadPoints} points across {summary.duration} minutes.</p>
        </div>
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.035] p-2">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Next event</span>
          <p className="mt-1 text-[11px] font-semibold text-slate-200">
            {upcomingMatch ? `${upcomingMatch.type} vs ${upcomingMatch.opponent} on ${upcomingMatch.date}` : upcomingEvents[0] ? `${upcomingEvents[0].type} - ${upcomingEvents[0].date}` : 'No upcoming events in the next 7 days.'}
          </p>
        </div>
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.035] p-2">
          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
            <Users size={11} aria-hidden="true" /> Focus players
          </span>
          <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-200">
            {targetedPlayers.length > 0 ? targetedPlayers.join(', ') : 'No individual player focus assigned for this session.'}
          </p>
        </div>
      </div>
    </section>
  );
};

export default function TrainingSessionDetailModal({ day, teamInfo, players, games, assessments, onClose, onOpenPlanner }: TrainingSessionDetailModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  useDialogAccessibility(dialogRef, true, onClose, closeButtonRef);

  const sessionWeek = useMemo(() => {
    const weekStart = getWeekStartDate(new Date());
    const weekKey = toDateKey(weekStart);
    const weekDaysMap = getWeekDaysMap(weekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return {
      weekKey,
      weekDaysMap,
      weekLabel: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    };
  }, []);

  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(() => readTrainingScheduleForWeek(sessionWeek.weekKey));
  const [sessionMeta, setSessionMeta] = useState<TrainingSessionMeta>(() => {
    const metaMap = readTrainingSessionMeta();
    return metaMap[sessionWeek.weekKey]?.[day] ?? {};
  });
  const [activeDrillId, setActiveDrillId] = useState<string>('');
  const [activeDrillTimerSeconds, setActiveDrillTimerSeconds] = useState(0);
  const [isActiveDrillTimerRunning, setIsActiveDrillTimerRunning] = useState(false);

  const summary = useMemo(() => buildTrainingSessionSummary({
    day,
    dateStr: sessionWeek.weekDaysMap[day].dateStr,
    drills: weeklySchedule[day] ?? [],
    meta: sessionMeta
  }), [day, sessionMeta, sessionWeek.weekDaysMap, weeklySchedule]);
  const timerPlanSignature = useMemo(() => (
    (weeklySchedule[day] ?? [])
      .map(drill => `${drill.id}:${getScheduledDrillBlock(drill)}:${getScheduledDrillDuration(drill)}`)
      .join('|')
  ), [day, weeklySchedule]);

  const persistWeeklySchedule = (nextSchedule: WeeklySchedule) => {
    const scheduleWeeks = readJsonStorage(STORAGE_KEYS.weeklyScheduleWeeks, weeklyScheduleWeeksSchema, {}, 'Weekly training weeks');
    writeJsonStorage(STORAGE_KEYS.weeklyScheduleWeeks, {
      ...scheduleWeeks,
      [sessionWeek.weekKey]: nextSchedule
    });
    writeJsonStorage(STORAGE_KEYS.weeklySchedule, nextSchedule);
    setWeeklySchedule(nextSchedule);
    notifyTrainingStorageChanged(STORAGE_KEYS.weeklyScheduleWeeks);
    notifyTrainingStorageChanged(STORAGE_KEYS.weeklySchedule);
  };

  const persistSessionMeta = (meta: TrainingSessionMeta) => {
    const metaMap = readTrainingSessionMeta();
    writeJsonStorage(STORAGE_KEYS.trainingSessionMeta, {
      ...metaMap,
      [sessionWeek.weekKey]: {
        ...(metaMap[sessionWeek.weekKey] ?? {}),
        [day]: meta
      }
    });
    setSessionMeta(meta);
    notifyTrainingStorageChanged(STORAGE_KEYS.trainingSessionMeta);
  };

  const getNextSessionStatus = (drills: ScheduledDrill[]): TrainingSessionMeta['status'] => {
    if (drills.length > 0 && drills.every(drill => drill.status === 'done')) return 'completed';
    if (drills.some(drill => drill.status === 'done' || drill.status === 'skipped')) return 'in_progress';
    return 'planned';
  };

  const updateDrillStatus = (drillId: string, status: NonNullable<ScheduledDrill['status']>) => {
    const nextDrills = (weeklySchedule[day] ?? []).map(drill => (
      drill.id === drillId
        ? {
            ...drill,
            status,
            completedAt: status === 'done' ? new Date().toISOString() : undefined,
            skipReason: status === 'skipped' ? drill.skipReason ?? '' : undefined
          }
        : drill
    ));
    persistWeeklySchedule({ ...weeklySchedule, [day]: nextDrills });
    persistSessionMeta({
      ...sessionMeta,
      status: getNextSessionStatus(nextDrills),
      completedAt: nextDrills.length > 0 && nextDrills.every(drill => drill.status === 'done')
        ? new Date().toISOString()
        : sessionMeta.completedAt
    });
  };

  const activeDrillIndex = Math.max(0, summary.drills.findIndex(drill => drill.id === activeDrillId));
  const activeDrill = summary.drills[activeDrillIndex] ?? summary.drills[0] ?? null;
  const activeDrillInstruction = activeDrill ? DRILL_INSTRUCTIONS[activeDrill.drillId] : undefined;
  const activeDrillEquipment = activeDrill ? getDrillEquipmentList(activeDrill) : [];
  const activeDrillHowToRun = activeDrill ? getDrillHowToRun(activeDrill.drillId, activeDrill.notes) : 'Run the drill according to the planner instructions.';
  const nextDrills = activeDrill
    ? summary.drills.filter(drill => drill.id !== activeDrill.id)
    : summary.drills.slice(1);

  useEffect(() => {
    const firstDrill = weeklySchedule[day]?.[0];
    if (!firstDrill) {
      setActiveDrillId('');
      setActiveDrillTimerSeconds(0);
      setIsActiveDrillTimerRunning(false);
      return;
    }

    setActiveDrillId(current => (
      weeklySchedule[day]?.some(drill => drill.id === current) ? current : firstDrill.id
    ));
  }, [day, timerPlanSignature, weeklySchedule]);

  useEffect(() => {
    if (!activeDrill) return;
    setActiveDrillTimerSeconds(getScheduledDrillDuration(activeDrill) * 60);
    setIsActiveDrillTimerRunning(false);
  }, [activeDrill?.id]);

  useEffect(() => {
    if (!isActiveDrillTimerRunning) return;

    const intervalId = window.setInterval(() => {
      setActiveDrillTimerSeconds(current => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          setIsActiveDrillTimerRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isActiveDrillTimerRunning]);

  const resetActiveDrillTimer = () => {
    if (!activeDrill) return;
    setIsActiveDrillTimerRunning(false);
    setActiveDrillTimerSeconds(getScheduledDrillDuration(activeDrill) * 60);
  };

  const drillsByBlock = SESSION_BLOCKS.map(block => ({
    ...block,
    drills: summary.drills.filter(drill => getScheduledDrillBlock(drill) === block.id)
  }));
  const readinessTone = getReadinessTone(summary);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/78 px-3 py-4 text-slate-100 backdrop-blur-xl lg:overflow-hidden" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="training-session-detail-title"
        tabIndex={-1}
        className="grid max-h-[92vh] w-full max-w-[1180px] grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-y-auto rounded-2xl border border-cyan-300/12 bg-[#07111f] p-4 shadow-2xl shadow-black/40 outline-none sm:p-5 lg:h-[min(700px,90vh)] lg:overflow-hidden"
      >
        <header className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-emerald-300/25 bg-emerald-300/10 text-emerald-100">
                <CalendarDays size={12} aria-hidden="true" /> {summary.dateStr}
              </Badge>
              <Badge variant="outline" className={readinessTone}>
                {summary.readiness === 'needs_structure' ? 'Needs structure' : summary.readiness.replace('_', ' ')}
              </Badge>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{sessionWeek.weekLabel}</span>
            </div>
            <h2 id="training-session-detail-title" className="mt-2 font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
              {day} Training Session
            </h2>
          </div>
          <div className="flex shrink-0 items-start justify-between gap-2 lg:justify-end">
            <section aria-label="Session metrics" className="hidden grid-cols-4 gap-1.5 md:grid">
              {[
                { label: 'Min', value: String(summary.duration), icon: Clock, className: 'border-cyan-300/15 bg-cyan-300/8 text-cyan-100' },
                { label: 'Load', value: String(summary.loadPoints), icon: Gauge, className: summary.loadPoints >= SESSION_LOAD_THRESHOLDS.high ? 'border-red-300/20 bg-red-500/10 text-red-100' : 'border-amber-300/15 bg-amber-300/8 text-amber-100' },
                { label: 'Drills', value: String(summary.drills.length), icon: Dumbbell, className: 'border-emerald-300/15 bg-emerald-300/8 text-emerald-100' },
                { label: 'Active', value: `${activeDrillIndex + 1}/${summary.drills.length}`, icon: CheckCircle2, className: 'border-indigo-300/15 bg-indigo-300/8 text-indigo-100' }
              ].map(({ label, value, icon: Icon, className }) => (
                <div key={label} className={`min-w-[4.4rem] rounded-lg border px-2.5 py-2 ${className}`}>
                  <Icon size={12} aria-hidden="true" />
                  <strong className="mt-1 block text-base font-black text-slate-50">{value}</strong>
                  <span className="text-[8px] font-black uppercase tracking-wider text-current">{label}</span>
                </div>
              ))}
            </section>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => onOpenPlanner(day)}
                className="h-9 rounded-xl border border-emerald-300/25 bg-emerald-300/15 px-3 text-xs font-black text-emerald-50 hover:bg-emerald-300/22"
              >
                Open Planner <ArrowRight size={13} aria-hidden="true" />
              </Button>
              <Button
                ref={closeButtonRef}
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close training session"
                className="size-9 rounded-xl text-slate-300 hover:bg-white/[0.08] hover:text-white"
              >
                <X size={18} aria-hidden="true" />
              </Button>
            </div>
          </div>
        </header>

        {summary.drills.length === 0 ? (
          <section className="flex min-h-[20rem] flex-col items-center justify-center rounded-xl border border-dashed border-cyan-300/18 bg-white/[0.035] p-8 text-center">
            <Dumbbell size={24} className="mx-auto text-slate-500" aria-hidden="true" />
            <h3 className="mt-3 text-sm font-black text-slate-100">No drills planned for {day}</h3>
            <p className="mt-1 text-xs font-medium text-slate-400">Open the planner to build a coach-ready session structure.</p>
            <Button type="button" onClick={() => onOpenPlanner(day)} className="mt-4 h-9 rounded-xl bg-emerald-300 px-3 text-xs font-black text-slate-950 hover:bg-emerald-200">
              Build Session
            </Button>
          </section>
        ) : (
          <main className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-12">
            <section aria-label="Active drill" className="relative min-h-0 overflow-hidden rounded-2xl border border-cyan-300/12 bg-[linear-gradient(135deg,rgba(20,184,166,0.12),rgba(15,23,42,0.28)_38%,rgba(7,17,31,0.92))] p-5 lg:col-span-8">
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200/40 to-transparent" />
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_12.5rem]">
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Current drill</span>
                  <h3 className="mt-2 max-w-2xl font-display text-3xl font-black leading-tight tracking-tight text-white">
                    {activeDrill?.name}
                  </h3>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-cyan-300/18 bg-cyan-300/8 px-2.5 py-1 text-[10px] font-black uppercase text-cyan-100">
                      Drill {activeDrillIndex + 1} of {summary.drills.length}
                    </span>
                    <span className="rounded-full border border-amber-300/18 bg-amber-300/8 px-2.5 py-1 text-[10px] font-black uppercase text-amber-100">
                      {activeDrill ? getScheduledDrillBlock(activeDrill) : 'technical'}
                    </span>
                    <span className="rounded-full border border-slate-500/14 bg-white/[0.035] px-2.5 py-1 text-[10px] font-black uppercase text-slate-300">
                      {activeDrill ? getScheduledDrillDuration(activeDrill) : 0} min
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-300/16 bg-[#07111f]/72 p-3 text-center shadow-inner shadow-black/10">
                  <span className="flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-100">
                    <Timer size={12} aria-hidden="true" /> Timer
                  </span>
                  <strong className="mt-1 block font-mono text-4xl font-black tracking-tight text-white">
                    {formatTimer(activeDrillTimerSeconds)}
                  </strong>
                  <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                    <Button
                      type="button"
                      onClick={() => setIsActiveDrillTimerRunning(value => !value)}
                      disabled={!activeDrill || activeDrillTimerSeconds <= 0}
                      className="h-9 rounded-xl bg-emerald-300 px-3 text-xs font-black text-slate-950 hover:bg-emerald-200 disabled:opacity-50"
                    >
                      {isActiveDrillTimerRunning ? <Pause size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />}
                      {isActiveDrillTimerRunning ? 'Pause' : 'Start'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={resetActiveDrillTimer}
                      disabled={!activeDrill}
                      aria-label="Reset drill timer"
                      className="size-9 rounded-xl border border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800"
                    >
                      <RotateCcw size={14} aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid min-h-0 gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(16rem,0.75fr)]">
                <div className="min-w-0">
                  <div className="border-l-2 border-emerald-300/35 pl-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-200">How to run it</span>
                    <p className="mt-2 text-sm font-bold leading-relaxed text-slate-50 lg:text-[15px]">
                      {activeDrillHowToRun}
                    </p>
                  </div>
                  <div className="mt-5 grid gap-4 text-sm font-semibold leading-relaxed text-slate-300 sm:grid-cols-2">
                    <div className="min-w-0">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Setup</span>
                      <p className="mt-1 line-clamp-5">{activeDrillInstruction?.setup || activeDrill?.notes || 'Use the field space and equipment listed for this drill.'}</p>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Sets / reps</span>
                      <p className="mt-1">{activeDrillInstruction?.setsReps || `${activeDrill ? getScheduledDrillDuration(activeDrill) : 0} minutes`}</p>
                    </div>
                  </div>
                </div>

                <div className="grid content-start gap-4">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-cyan-100">Equipment</span>
                    <p className="mt-2 rounded-xl border border-cyan-300/10 bg-cyan-300/6 px-3 py-2 text-sm font-bold leading-relaxed text-slate-100">
                      {activeDrillEquipment.length > 0 ? activeDrillEquipment.join(', ') : activeDrillInstruction?.equipment || 'No equipment listed.'}
                    </p>
                  </div>
                  <label className="block">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Coach notes</span>
                    <textarea
                      value={summary.reflection}
                      onChange={(event) => persistSessionMeta({ ...sessionMeta, reflection: event.target.value })}
                      placeholder="Attendance, player response, changes made..."
                      className="mt-2 min-h-24 w-full resize-none rounded-xl border border-cyan-300/10 bg-[#07111f]/88 px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-100 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-300/25"
                    />
                  </label>
                </div>
              </div>
            </section>

            <aside aria-label="Next drills" className="grid min-h-0 gap-2 lg:col-span-4 lg:grid-rows-[auto_minmax(0,1fr)]">
              <div className="flex items-center justify-between gap-2 border-b border-cyan-300/10 px-1 pb-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Next drills</span>
                <span className="rounded-md border border-emerald-300/15 bg-emerald-300/10 px-2 py-1 text-[9px] font-black text-emerald-100">{nextDrills.length} queued</span>
              </div>

              <div className="grid min-h-0 content-start gap-1.5">
                {nextDrills.map((drill) => {
                  const instruction = DRILL_INSTRUCTIONS[drill.drillId];
                  return (
                    <button
                      key={drill.id}
                      type="button"
                      onClick={() => setActiveDrillId(drill.id)}
                      className="group grid min-h-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-xl border border-transparent px-2.5 py-2.5 text-left transition-colors hover:border-emerald-300/18 hover:bg-white/[0.035]"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-cyan-300/10 bg-white/[0.035] text-slate-300 group-hover:border-emerald-300/20 group-hover:text-emerald-100">
                        {getDrillIcon(drill.drillId)}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[8px] font-black uppercase tracking-wider text-slate-500">{getScheduledDrillBlock(drill)}</span>
                        <span className="mt-0.5 block truncate text-xs font-black text-white">{drill.name}</span>
                        <span className="mt-1 line-clamp-2 text-[10px] font-semibold leading-relaxed text-slate-400">
                          {drill.notes || getDrillHowToRun(drill.drillId) || instruction?.execution || instruction?.setup || 'Open as current drill for details.'}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full border border-cyan-300/12 bg-cyan-300/6 px-2 py-1 text-[8px] font-black text-cyan-100">
                        {getScheduledDrillDuration(drill)} min
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>
          </main>
        )}

        {summary.warnings.length > 0 && (
        <footer className="grid gap-2 border-t border-cyan-300/10 pt-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          {summary.warnings.length > 0 ? (
            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2" role="status">
              <AlertTriangle size={13} className="shrink-0 text-amber-100" aria-hidden="true" />
              <p className="truncate text-[11px] font-semibold text-amber-50">{summary.warnings[0]}{summary.warnings.length > 1 ? ` +${summary.warnings.length - 1} more` : ''}</p>
            </div>
          ) : null}
        </footer>
        )}
      </div>
    </div>
  );
}
