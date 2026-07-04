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
import { DRILL_INSTRUCTIONS, getDrillEquipment } from '../training/drillLibrary';
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
  const [activeTimerBlock, setActiveTimerBlock] = useState<SessionBlockId | null>(null);
  const [blockTimerSeconds, setBlockTimerSeconds] = useState<Record<SessionBlockId, number>>(() => (
    createBlockTimerSeconds(weeklySchedule[day] ?? [])
  ));

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

  useEffect(() => {
    setBlockTimerSeconds(createBlockTimerSeconds(weeklySchedule[day] ?? []));
    setActiveTimerBlock(null);
  }, [day, timerPlanSignature]);

  useEffect(() => {
    if (!activeTimerBlock) return;

    const intervalId = window.setInterval(() => {
      setBlockTimerSeconds(current => {
        const remaining = current[activeTimerBlock];
        if (remaining <= 1) {
          window.clearInterval(intervalId);
          setActiveTimerBlock(null);
          return { ...current, [activeTimerBlock]: 0 };
        }
        return { ...current, [activeTimerBlock]: remaining - 1 };
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [activeTimerBlock]);

  const resetBlockTimer = (blockId: SessionBlockId, drills: readonly ScheduledDrill[]) => {
    if (activeTimerBlock === blockId) setActiveTimerBlock(null);
    setBlockTimerSeconds(current => ({
      ...current,
      [blockId]: drills.reduce((total, drill) => total + getScheduledDrillDuration(drill) * 60, 0)
    }));
  };

  const drillsByBlock = SESSION_BLOCKS.map(block => ({
    ...block,
    drills: summary.drills.filter(drill => getScheduledDrillBlock(drill) === block.id)
  }));
  const readinessTone = getReadinessTone(summary);
  const targetedPlayers = [...new Set(summary.drills.flatMap(drill => drill.playerName ? [drill.playerName] : []))];

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-slate-950/78 px-3 py-4 text-slate-100 backdrop-blur-xl sm:px-5 sm:py-7" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="training-session-detail-title"
        tabIndex={-1}
        className="w-full max-w-6xl overflow-hidden rounded-2xl border border-cyan-300/12 bg-[#07111f] shadow-2xl shadow-black/40 outline-none"
      >
        <header className="border-b border-cyan-300/10 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(14,165,233,0.12)_48%,rgba(7,17,31,0.95))] p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
              <h2 id="training-session-detail-title" className="mt-3 font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
                {day} Training Session
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-slate-300">
                Coach execution sheet with session order, load, equipment, cues, and drill instructions for today.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                onClick={() => onOpenPlanner(day)}
                className="h-10 rounded-xl border border-emerald-300/25 bg-emerald-300/15 px-3 text-xs font-black text-emerald-50 hover:bg-emerald-300/22"
              >
                Edit in Planner <ArrowRight size={14} aria-hidden="true" />
              </Button>
              <Button
                ref={closeButtonRef}
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close training session"
                className="size-10 rounded-xl text-slate-300 hover:bg-white/[0.08] hover:text-white"
              >
                <X size={18} aria-hidden="true" />
              </Button>
            </div>
          </div>
        </header>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <main className="space-y-4 p-4 sm:p-5">
            <section aria-label="Session metrics" className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: 'Duration', value: `${summary.duration} min`, icon: Clock, className: 'border-cyan-300/15 bg-cyan-300/8 text-cyan-100' },
                { label: 'Load', value: `${summary.loadPoints} pts`, icon: Gauge, className: summary.loadPoints >= SESSION_LOAD_THRESHOLDS.high ? 'border-red-300/20 bg-red-500/10 text-red-100' : 'border-amber-300/15 bg-amber-300/8 text-amber-100' },
                { label: 'Drills', value: String(summary.drills.length), icon: Dumbbell, className: 'border-emerald-300/15 bg-emerald-300/8 text-emerald-100' },
                { label: 'Completed', value: `${summary.completedCount}/${summary.drills.length}`, icon: CheckCircle2, className: 'border-indigo-300/15 bg-indigo-300/8 text-indigo-100' }
              ].map(({ label, value, icon: Icon, className }) => (
                <div key={label} className={`rounded-xl border p-3 ${className}`}>
                  <Icon size={15} aria-hidden="true" />
                  <strong className="mt-2 block text-lg font-black text-slate-50">{value}</strong>
                  <span className="text-[9px] font-black uppercase tracking-wider text-current">{label}</span>
                </div>
              ))}
            </section>

            {summary.drills.length === 0 ? (
              <section className="rounded-xl border border-dashed border-cyan-300/18 bg-white/[0.035] p-8 text-center">
                <Dumbbell size={24} className="mx-auto text-slate-500" aria-hidden="true" />
                <h3 className="mt-3 text-sm font-black text-slate-100">No drills planned for {day}</h3>
                <p className="mt-1 text-xs font-medium text-slate-400">Open the planner to build a coach-ready session structure.</p>
                <Button type="button" onClick={() => onOpenPlanner(day)} className="mt-4 h-9 rounded-xl bg-emerald-300 px-3 text-xs font-black text-slate-950 hover:bg-emerald-200">
                  Build Session
                </Button>
              </section>
            ) : (
              <section aria-label="Session delivery order" className="space-y-3">
                {drillsByBlock.map((block, blockIndex) => {
                  const blockDuration = block.drills.reduce((total, drill) => total + getScheduledDrillDuration(drill), 0);
                  return (
                    <section key={block.id} className={`overflow-hidden rounded-xl border ${getBlockTone(block.id)}`}>
                      <div className="flex flex-col gap-3 border-b border-white/[0.08] bg-white/[0.035] p-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-7 items-center justify-center rounded-full border border-white/[0.12] bg-slate-950/30 text-[10px] font-black">{blockIndex + 1}</span>
                          <div>
                            <h3 className="text-xs font-black text-slate-50">{block.label}</h3>
                            <p className="text-[10px] font-semibold text-slate-400">{block.drills.length} drills - {blockDuration} min</p>
                          </div>
                        </div>
                        {block.drills.length === 0 ? (
                          <span className="text-[10px] font-semibold text-slate-500">No planned work</span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.08] bg-slate-950/24 p-1.5">
                            <span className="min-w-16 px-2 text-center font-mono text-sm font-black text-white">
                              {formatTimer(blockTimerSeconds[block.id] ?? 0)}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setActiveTimerBlock(current => current === block.id ? null : block.id)}
                              disabled={(blockTimerSeconds[block.id] ?? 0) <= 0}
                              aria-label={activeTimerBlock === block.id ? `Pause ${block.label} timer` : `Start ${block.label} timer`}
                              className="size-7 rounded-lg border border-cyan-300/12 bg-cyan-300/8 text-cyan-50 hover:bg-cyan-300/14"
                            >
                              {activeTimerBlock === block.id ? <Pause size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => resetBlockTimer(block.id, block.drills)}
                              aria-label={`Reset ${block.label} timer`}
                              className="size-7 rounded-lg border border-slate-500/12 bg-white/[0.035] text-slate-300 hover:bg-white/[0.07] hover:text-slate-50"
                            >
                              <RotateCcw size={13} aria-hidden="true" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {block.drills.length > 0 && (
                        <div className="space-y-2 p-3">
                          {block.drills.map((drill, drillIndex) => {
                            const instruction = DRILL_INSTRUCTIONS[drill.drillId];
                            const equipment = getDrillEquipmentList(drill);
                            return (
                              <article key={drill.id} className="rounded-xl border border-white/[0.08] bg-[#07111f]/78 p-3 text-slate-100 shadow-sm shadow-black/10">
                                <div className="flex items-start gap-3">
                                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/10 bg-white/[0.045] text-slate-300">
                                    {getDrillIcon(drill.drillId)}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                                      <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Drill {drillIndex + 1}</p>
                                        <h4 className="mt-0.5 text-sm font-black text-white">{drill.name}</h4>
                                      </div>
                                      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                                        <span className="rounded-full border border-cyan-300/15 bg-cyan-300/8 px-2 py-1 text-[9px] font-black text-cyan-100">
                                          <Timer size={10} className="inline" aria-hidden="true" /> {getScheduledDrillDuration(drill)} min
                                        </span>
                                        <span className="rounded-full border border-amber-300/15 bg-amber-300/8 px-2 py-1 text-[9px] font-black text-amber-100">
                                          {getScheduledDrillLoadPoints(drill)} load
                                        </span>
                                        <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.035] p-1">
                                        {[
                                          { status: 'planned' as const, label: 'Planned' },
                                          { status: 'done' as const, label: 'Done' },
                                          { status: 'skipped' as const, label: 'Skip' }
                                        ].map(option => (
                                          <Button
                                            key={option.status}
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => updateDrillStatus(drill.id, option.status)}
                                            aria-pressed={(drill.status ?? 'planned') === option.status}
                                            className={`h-7 rounded-md border px-2 text-[9px] font-black ${
                                              (drill.status ?? 'planned') === option.status
                                                ? option.status === 'done'
                                                  ? 'border-emerald-300/25 bg-emerald-300/15 text-emerald-50 hover:bg-emerald-300/18'
                                                  : option.status === 'skipped'
                                                    ? 'border-amber-300/25 bg-amber-300/15 text-amber-50 hover:bg-amber-300/18'
                                                    : 'border-cyan-300/20 bg-cyan-300/10 text-cyan-50 hover:bg-cyan-300/14'
                                                : 'border-slate-500/12 bg-white/[0.025] text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
                                            }`}
                                          >
                                            {option.label}
                                          </Button>
                                        ))}
                                        </div>
                                      </div>
                                    </div>
                                    {drill.playerName && (
                                      <p className="mt-2 text-[10px] font-bold text-emerald-100">Individual development: {drill.playerName}</p>
                                    )}
                                    {drill.notes && (
                                      <p className="mt-2 rounded-lg border border-amber-300/15 bg-amber-300/8 px-3 py-2 text-[11px] font-semibold leading-relaxed text-amber-50">
                                        {drill.notes}
                                      </p>
                                    )}
                                    {instruction && (
                                      <div className="mt-3 grid gap-2 text-[10px] leading-relaxed text-slate-300 md:grid-cols-2">
                                        <div>
                                          <span className="font-black uppercase text-slate-500">Setup</span>
                                          <p className="mt-1">{instruction.setup}</p>
                                        </div>
                                        <div>
                                          <span className="font-black uppercase text-slate-500">Execution</span>
                                          <p className="mt-1">{instruction.execution}</p>
                                        </div>
                                        <div>
                                          <span className="font-black uppercase text-slate-500">Sets / reps</span>
                                          <p className="mt-1">{instruction.setsReps}</p>
                                        </div>
                                        <div>
                                          <span className="font-black uppercase text-slate-500">Equipment</span>
                                          <p className="mt-1">{equipment.length > 0 ? equipment.join(', ') : instruction.equipment}</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })}
              </section>
            )}
          </main>

          <aside className="border-t border-cyan-300/10 bg-[#0b1726]/72 p-4 sm:p-5 lg:border-l lg:border-t-0">
            <div className="lg:sticky lg:top-5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Coach Brief</h3>
              <div className="mt-3 space-y-3">
                <TeamStatusSummary
                  teamInfo={teamInfo}
                  players={players}
                  games={games}
                  assessments={assessments}
                  summary={summary}
                  targetedPlayers={targetedPlayers}
                />

                <label className="block rounded-xl border border-slate-500/15 bg-white/[0.035] p-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Coach notes</span>
                  <textarea
                    value={summary.reflection}
                    onChange={(event) => persistSessionMeta({ ...sessionMeta, reflection: event.target.value })}
                    placeholder="Attendance, player response, changes made, reminders for next session..."
                    className="mt-2 min-h-28 w-full resize-y rounded-lg border border-cyan-300/10 bg-[#07111f] px-3 py-2 text-xs font-medium normal-case tracking-normal text-slate-100 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-300/25"
                  />
                </label>

                {summary.warnings.length > 0 && (
                  <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-3" role="status">
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-100">
                      <AlertTriangle size={13} aria-hidden="true" /> Structure checks
                    </span>
                    <div className="mt-2 space-y-1.5">
                      {summary.warnings.map(warning => (
                        <p key={warning} className="text-[11px] font-semibold leading-relaxed text-amber-50">{warning}</p>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
