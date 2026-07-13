import React, { useMemo } from 'react';
import { Award, Dumbbell, Flame, Footprints, Heart, Target, Timer, TrendingUp, Zap } from 'lucide-react';
import type { PlayerAchievement, PlayerDrillCompletion } from '../../cloud/player';
import { getPlayerDrill } from '../../player/drillCatalog';
import { computeStreakDays, weeklyTotals } from '../../player/progress';
import { evaluateAchievements, type PlayerStats } from '../../player/achievements';
import { apexCard, apexDisplay, apexEyebrow, apexMonoTight, apexSectionTitle } from './playerTheme';

interface ProgressTabProps {
  completions: PlayerDrillCompletion[];
  stats: PlayerStats;
  achievements: PlayerAchievement[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const ACHIEVEMENT_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Footprints, Target, Award, Timer, Dumbbell, Flame, Zap, Heart
};

const Stat = ({ icon: Icon, value, label, accent }: {
  icon: React.ComponentType<{ size?: number; className?: string; fill?: string }>;
  value: string | number;
  label: string;
  accent?: boolean;
}) => (
  <div className={`${apexCard} border-l-4 p-4 ${accent ? 'border-l-[#ff6d00]/70' : 'border-l-[#b9c8de]/70'}`}>
    <Icon size={17} className={accent ? 'text-[#ff9440]' : 'text-[#b9c8de]'} fill={accent ? 'currentColor' : 'none'} />
    <p className="mt-2 font-player-display text-2xl font-bold text-[#d8e3fb]">{value}</p>
    <p className={`${apexMonoTight} mt-0.5 text-[#c6c6cd]/70`}>{label}</p>
  </div>
);

const ProgressTab = ({ completions, stats, achievements }: ProgressTabProps) => {
  const totals = weeklyTotals(completions);
  const streak = computeStreakDays(completions);
  const totalMinutes = Math.round(completions.reduce((sum, c) => sum + (c.duration_seconds ?? 0), 0) / 60);

  const badges = useMemo(() => {
    const earnedMap = new Map(achievements.map(a => [a.achievement_key, a.earned_at]));
    return evaluateAchievements(stats, earnedMap);
  }, [stats, achievements]);
  const earnedBadges = badges.filter(b => b.earned).length;

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
        <p className={`${apexEyebrow} mb-1`}>Consistency Report</p>
        <h2 className={`${apexDisplay} text-2xl`}>Daily Discipline</h2>
      </section>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={Flame} value={streak} label="Day Streak" accent />
        <Stat icon={Dumbbell} value={totals.drills} label="This Week" />
        <Stat icon={Timer} value={`${totalMinutes}m`} label="All Time" />
      </div>

      {/* Achievements */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={apexSectionTitle}>Achievements</h3>
          <span className={`${apexMonoTight} border-b border-[#b9c8de]/40 pb-0.5 text-[#dce7f8]`}>{earnedBadges} / {badges.length}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {badges.map(badge => {
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
        {completions.length === 0 ? (
          <p className={`${apexCard} px-4 py-8 text-center text-sm text-[#c6c6cd]`}>
            Your completed drills will show up here.
          </p>
        ) : (
          <ul className="space-y-2">
            {completions.slice(0, 25).map(completion => {
              const drill = getPlayerDrill(completion.drill_id);
              return (
                <li key={completion.id} className={`${apexCard} flex items-center gap-3 px-4 py-3`}>
                  <span className="flex h-9 w-9 items-center justify-center rounded bg-[#b9c8de]/10 text-[#dce7f8]">
                    <Dumbbell size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-player-display text-sm font-semibold text-[#d8e3fb]">{drill?.name ?? completion.drill_id}</p>
                    <p className={`${apexMonoTight} mt-0.5 text-[#c6c6cd]/60`}>
                      {new Date(completion.completed_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      {completion.duration_seconds ? ` · ${Math.round(completion.duration_seconds / 60)} min` : ''}
                    </p>
                  </div>
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
