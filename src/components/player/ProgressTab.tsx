import React, { useMemo } from 'react';
import { Award, Dumbbell, Flame, Footprints, Gauge, Heart, Sparkles, Target, Timer, Trophy, TrendingUp, Volleyball, Zap } from 'lucide-react';
import type { PlayerAchievement, PlayerDrillCompletion, PlayerWorkoutSession } from '../../cloud/player';
import { getPlayerDrill } from '../../player/drillCatalog';
import { computeStreakDays, weeklyTotals } from '../../player/progress';
import { evaluateAchievements, type PlayerStats } from '../../player/achievements';
import { apexCard, apexCardHero, apexEyebrow, apexMonoTight, apexSectionTitle } from './playerTheme';

interface ProgressTabProps {
  completions: PlayerDrillCompletion[];
  workouts: PlayerWorkoutSession[];
  stats: PlayerStats;
  achievements: PlayerAchievement[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const STREAK_WEEK_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const ACHIEVEMENT_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Footprints, Target, Award, Timer, Dumbbell, Flame, Zap, Heart, Volleyball, Sparkles, Trophy, Gauge
};

/** Mon-start week model: which days trained, which is today, which are future. */
const buildWeekRow = (completions: PlayerDrillCompletion[], now = new Date()) => {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = today.getTime() - mondayOffset * DAY_MS;

  const trained = new Set<number>();
  for (const completion of completions) {
    const t = new Date(completion.completed_at);
    if (Number.isNaN(t.getTime())) continue;
    t.setHours(0, 0, 0, 0);
    const index = Math.floor((t.getTime() - monday) / DAY_MS);
    if (index >= 0 && index < 7) trained.add(index);
  }

  return STREAK_WEEK_LABELS.map((label, index) => ({
    label,
    trained: trained.has(index),
    isToday: index === mondayOffset,
    isFuture: index > mondayOffset
  }));
};

const formatActivityDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const formatDuration = (seconds: number) => {
  const rounded = Math.max(0, Math.round(seconds));
  if (rounded < 60) return `${rounded}s`;
  return `${Math.round(rounded / 60)} min`;
};

const ProgressTab = ({ completions, workouts, stats, achievements }: ProgressTabProps) => {
  const totals = weeklyTotals(completions);
  const streak = computeStreakDays(completions);
  const streakWeek = useMemo(() => buildWeekRow(completions), [completions]);

  const badges = useMemo(() => {
    const earnedMap = new Map(achievements.map(a => [a.achievement_key, a.earned_at]));
    return evaluateAchievements(stats, earnedMap);
  }, [stats, achievements]);
  const earnedBadges = badges.filter(b => b.earned).length;
  const visibleBadges = badges.slice(0, 4);
  const remainingBadgeCount = Math.max(0, badges.length - visibleBadges.length);
  const activityHistory = useMemo(() => {
    const drillRows = completions.map(completion => ({
      id: `drill-${completion.id}`,
      kind: 'drill' as const,
      at: completion.completed_at,
      title: getPlayerDrill(completion.drill_id)?.name ?? completion.drill_id,
      meta: completion.duration_seconds ? formatDuration(completion.duration_seconds) : ''
    }));
    const workoutRows = workouts.map(workout => ({
      id: `workout-${workout.id}`,
      kind: 'workout' as const,
      at: workout.completed_at,
      title: workout.label || `${workout.kind[0].toUpperCase()}${workout.kind.slice(1)} workout`,
      meta: formatDuration(workout.total_seconds)
    }));
    return [...drillRows, ...workoutRows]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 25);
  }, [completions, workouts]);

  // Set of local-day timestamps that have at least one completion.
  const trainedDays = useMemo(() => {
    const days = new Set<number>();
    for (const completion of completions) {
      const t = new Date(completion.completed_at);
      if (Number.isNaN(t.getTime())) continue;
      t.setHours(0, 0, 0, 0);
      days.add(t.getTime());
    }
    return days;
  }, [completions]);

  // Month grid (habit-tracker style): leading blanks + one cell per day.
  const month = useMemo(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const leading = (first.getDay() + 6) % 7; // Mon-start
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const cells: Array<{ day: number; trained: boolean; isToday: boolean; isFuture: boolean } | null> = [];
    for (let i = 0; i < leading; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const time = new Date(now.getFullYear(), now.getMonth(), day).getTime();
      cells.push({
        day,
        trained: trainedDays.has(time),
        isToday: time === today.getTime(),
        isFuture: time > today.getTime()
      });
    }
    return { label: now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), cells };
  }, [trainedDays]);

  // 7-day load chart (dashboard style).
  const week = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: Array<{ count: number }> = [];
    for (let i = 6; i >= 0; i -= 1) {
      const start = today.getTime() - i * DAY_MS;
      const end = start + DAY_MS;
      days.push({
        count: completions.filter(c => {
          const t = new Date(c.completed_at).getTime();
          return t >= start && t < end;
        }).length
      });
    }
    return days;
  }, [completions]);
  const maxCount = Math.max(1, ...week.map(d => d.count));

  return (
    <div className="space-y-7">
      <section>
        <p className={`${apexEyebrow} mb-1`}>This week · {totals.drills} drills · {totals.minutes} min</p>
        <h2 className="font-player-display text-[22px] font-bold leading-tight text-[#d8e3fb]">{streak > 0 ? 'Keep the run alive' : 'Match day ready?'}</h2>
      </section>

      <section className={`${apexCardHero} p-5`}>
        <div className="mb-6 flex items-center justify-between">
          <h3 className={apexSectionTitle}>Active Streak</h3>
          <div className="flex items-center gap-2 text-[#ff9440]">
            <Flame size={18} fill="currentColor" />
            <span className="font-player-mono text-base font-bold">{streak} {streak === 1 ? 'DAY' : 'DAYS'}</span>
          </div>
        </div>
        <div className="flex items-start justify-between px-1">
          {streakWeek.map(day => (
            <div
              key={day.label}
              className={`flex flex-col items-center gap-2 ${
                day.trained || day.isToday ? 'text-[#dce7f8]' : day.isFuture ? 'text-[#b9c8de] opacity-30' : 'text-[#b9c8de]/50'
              }`}
            >
              {day.isToday && !day.trained ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#dce7f8]/70">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff6d00]" />
                </span>
              ) : (
                <Volleyball size={20} fill={day.trained ? 'currentColor' : 'none'} />
              )}
              <span className={`${apexMonoTight} ${day.isToday ? 'font-bold' : ''}`}>{day.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Achievements */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={apexSectionTitle}>Achievements</h3>
          <div className="flex items-center gap-2">
            <span className={`${apexMonoTight} border-b border-[#b9c8de]/40 pb-0.5 text-[#dce7f8]`}>{earnedBadges} / {badges.length}</span>
            {remainingBadgeCount > 0 && (
              <span className="rounded-full border border-[#b9c8de]/25 bg-[#b9c8de]/10 px-2.5 py-1 font-player-mono text-[9px] font-bold uppercase tracking-wider text-[#dce7f8]">
                +{remainingBadgeCount} more
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {visibleBadges.map(badge => {
            const Icon = ACHIEVEMENT_ICONS[badge.def.icon] ?? Award;
            return (
              <div key={badge.def.key} className={`${apexCard} p-4 ${badge.earned ? 'border-l-4 border-l-[#dce7f8]/70' : 'opacity-70'}`}>
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded ${badge.earned ? 'bg-[#dce7f8]/12 text-[#dce7f8] shadow-lg shadow-[#b9c8de]/15' : 'bg-[#152031] text-[#c6c6cd]/40'}`}>
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-player-display text-sm font-semibold text-[#d8e3fb]">{badge.def.title}</p>
                    <p className={`${apexMonoTight} text-[#c6c6cd]/60`}>{badge.earned ? 'Unlocked' : `${badge.current} / ${badge.threshold}`}</p>
                  </div>
                </div>
                <p className="mt-2.5 text-xs leading-snug text-[#c6c6cd]/70">{badge.def.description}</p>
                {!badge.earned && (
                  <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-[#152031]">
                    <div className="h-full rounded-full bg-[#b9c8de]/60" style={{ width: `${badge.percent}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Month grid */}
      <section className={`${apexCard} p-5`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className={apexSectionTitle}>Training Log</h3>
          <span className={`${apexMonoTight} border-b border-[#b9c8de]/40 pb-0.5 text-[#dce7f8]`}>{month.label}</span>
        </div>
        <div className="mb-2 grid grid-cols-7 gap-1.5">
          {WEEK_LABELS.map((label, i) => (
            <span key={i} className={`${apexMonoTight} text-center text-[#c6c6cd]/40`}>{label}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {month.cells.map((cell, i) =>
            cell === null ? (
              <span key={`blank-${i}`} />
            ) : (
              <span
                key={cell.day}
                className={`relative flex aspect-square w-full items-center justify-center rounded-sm text-[11px] font-medium ${
                  cell.trained
                    ? 'bg-[#dce7f8] font-bold text-[#0a1526] shadow-lg shadow-[#b9c8de]/20'
                    : cell.isFuture
                      ? 'bg-[#152031]/50 text-[#c6c6cd]/25'
                      : 'bg-[#152031] text-[#c6c6cd]/60'
                }`}
              >
                {cell.day}
                {cell.isToday && !cell.trained && (
                  <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-[#ff6d00]" />
                )}
              </span>
            )
          )}
        </div>
      </section>

      {/* Weekly load chart */}
      <section className={`${apexCard} p-5`}>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={17} className="text-[#dce7f8]" />
            <h3 className={apexSectionTitle}>Weekly Load</h3>
          </div>
          {totals.drills > 0 && (
            <span className="rounded-full border border-[#b9c8de]/30 bg-[#b9c8de]/10 px-3 py-1 font-player-mono text-[9px] font-bold uppercase tracking-widest text-[#dce7f8]">
              Building
            </span>
          )}
        </div>
        <div className="flex h-20 w-full items-end gap-2 px-1">
          {week.map((day, i) => {
            const isPeak = day.count > 0 && day.count === maxCount;
            return (
              <div
                key={i}
                className={`flex-1 rounded-t-sm ${
                  isPeak ? 'bg-[#dce7f8] shadow-[0_-4px_16px_rgba(220,231,248,0.35)]' : day.count > 0 ? 'bg-[#b9c8de]/40' : 'bg-[#2a3548]/30'
                }`}
                style={{ height: `${Math.max(8, (day.count / maxCount) * 100)}%` }}
                title={`${day.count} drills`}
              />
            );
          })}
        </div>
        <div className={`${apexMonoTight} mt-3 flex justify-between text-[#c6c6cd]/40`}>
          <span>{new Date(Date.now() - 6 * DAY_MS).toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}</span>
          <span>TODAY</span>
        </div>
      </section>

      {/* History */}
      <section className="space-y-4">
        <h3 className={apexSectionTitle}>History</h3>
        {activityHistory.length === 0 ? (
          <p className={`${apexCard} px-4 py-8 text-center text-sm text-[#c6c6cd]`}>
            Your completed drills and saved timer workouts will show up here.
          </p>
        ) : (
          <ul className="space-y-2">
            {activityHistory.map(activity => {
              const isWorkout = activity.kind === 'workout';
              return (
                <li key={activity.id} className={`${apexCard} flex items-center gap-3 px-4 py-3`}>
                  <span className="flex h-9 w-9 items-center justify-center rounded bg-[#b9c8de]/10 text-[#dce7f8]">
                    {isWorkout ? <Timer size={16} /> : <Dumbbell size={16} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-player-display text-sm font-semibold text-[#d8e3fb]">{activity.title}</p>
                    <p className={`${apexMonoTight} mt-0.5 text-[#c6c6cd]/60`}>
                      {formatActivityDateTime(activity.at)}
                      {activity.meta ? ` · ${activity.meta}` : ''}
                    </p>
                  </div>
                  <span className={`${apexMonoTight} shrink-0 rounded border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[#c6c6cd]/60`}>
                    {isWorkout ? 'Timer' : 'Drill'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ProgressTab;
