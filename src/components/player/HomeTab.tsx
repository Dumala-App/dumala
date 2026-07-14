import React, { useMemo } from 'react';
import { CalendarDays, ChevronRight, Dumbbell, Flame, Play, Timer as TimerIcon, Volleyball } from 'lucide-react';
import type { PlayerDrillCompletion, TeamScheduleEntry } from '../../cloud/player';
import { getPlayerDrill } from '../../player/drillCatalog';
import { weeklyGoalPercent, weeklyTotals, WEEKLY_DRILL_GOAL } from '../../player/progress';
import {
  apexCard,
  apexCardHero,
  apexCta,
  apexDisplay,
  apexEyebrow,
  apexGhost,
  apexMono,
  apexMonoTight,
  apexSectionTitle
} from './playerTheme';

interface HomeTabProps {
  streakDays: number;
  completions: PlayerDrillCompletion[];
  nextFixture: TeamScheduleEntry | null;
  linkedClubId: string | null;
  onGoToDrills: () => void;
  onGoToTimer: () => void;
  onGoToProfile: () => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/** Mon-start week model: which days trained, which is today, which are future. */
const buildWeekRow = (completions: PlayerDrillCompletion[], now = new Date()) => {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const mondayOffset = (today.getDay() + 6) % 7; // Mon=0 … Sun=6
  const monday = today.getTime() - mondayOffset * DAY_MS;

  const trained = new Set<number>();
  for (const completion of completions) {
    const t = new Date(completion.completed_at);
    if (Number.isNaN(t.getTime())) continue;
    t.setHours(0, 0, 0, 0);
    const index = Math.floor((t.getTime() - monday) / DAY_MS);
    if (index >= 0 && index < 7) trained.add(index);
  }

  return WEEK_LABELS.map((label, index) => ({
    label,
    trained: trained.has(index),
    isToday: index === mondayOffset,
    isFuture: index > mondayOffset
  }));
};

const formatFixtureDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

const HomeTab = ({
  streakDays,
  completions,
  nextFixture,
  linkedClubId,
  onGoToDrills,
  onGoToTimer,
  onGoToProfile
}: HomeTabProps) => {
  const totals = weeklyTotals(completions);
  const percent = weeklyGoalPercent(totals);
  const week = useMemo(() => buildWeekRow(completions), [completions]);
  const recent = completions.slice(0, 4);

  return (
    <div className="space-y-7">
      {/* Headline */}
      <section>
        <p className={`${apexEyebrow} mb-1`}>This week · {totals.drills} drills · {totals.minutes} min</p>
        <h2 className={`${apexDisplay} text-[30px]`}>{streakDays > 0 ? 'Keep the run alive' : 'Match day ready?'}</h2>
      </section>

      {!linkedClubId && (
        <section className={`${apexCard} border-orange-300/20 bg-orange-300/[0.08] p-5`}>
          <div className="flex items-start gap-3">
            <CalendarDays size={19} className="mt-0.5 shrink-0 text-[#ff9440]" />
            <div className="min-w-0 flex-1">
              <h3 className="font-player-display text-base font-bold text-[#d8e3fb]">Connect your team</h3>
              <p className="mt-1 text-sm leading-5 text-[#c6c6cd]/75">
                Use your coach invite link or club code once. Dumala will send the join request for review.
              </p>
              <button type="button" onClick={onGoToProfile} className={`${apexGhost} mt-3 px-4 py-2.5 font-player-mono text-[11px] font-bold uppercase tracking-wide`}>
                Join team
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Active streak card */}
      <section className={`${apexCardHero} p-5`}>
        <div className="mb-6 flex items-center justify-between">
          <h3 className={apexSectionTitle}>Active Streak</h3>
          <div className="flex items-center gap-2 text-[#ff9440]">
            <Flame size={18} fill="currentColor" />
            <span className="font-player-mono text-base font-bold">{streakDays} {streakDays === 1 ? 'DAY' : 'DAYS'}</span>
          </div>
        </div>
        <div className="flex items-start justify-between px-1">
          {week.map(day => (
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

      {/* Today's training CTA */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h3 className={apexSectionTitle}>Today's Training</h3>
          <button type="button" onClick={onGoToDrills} className={`${apexMono} text-[#b9c8de] transition-colors hover:text-[#dce7f8]`}>
            Library
          </button>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <button type="button" onClick={onGoToDrills} className={`${apexCta} flex items-center justify-center gap-2 py-4`}>
            Start Session <Play size={16} />
          </button>
          <button type="button" onClick={onGoToTimer} aria-label="Workout timer" className={`${apexGhost} flex w-16 items-center justify-center`}>
            <TimerIcon size={20} />
          </button>
        </div>
      </section>

      {/* Next fixture */}
      {nextFixture && (
        <section className={`${apexCard} p-5`}>
          <div className="mb-2 flex items-center gap-2 text-[#b9c8de]">
            <CalendarDays size={15} className="text-[#dce7f8]" />
            <span className={apexMono}>
              {formatFixtureDate(nextFixture.event_date)}{nextFixture.event_time ? ` · ${nextFixture.event_time}` : ''}
            </span>
          </div>
          <h4 className={`${apexDisplay} text-xl`}>
            {nextFixture.type === 'training' || nextFixture.type === 'meeting'
              ? nextFixture.type
              : `vs ${nextFixture.opponent}`}
          </h4>
          {nextFixture.location && <p className={`${apexMonoTight} mt-1 text-[#c6c6cd]/60`}>{nextFixture.location}</p>}
        </section>
      )}

      {/* Quick stats */}
      <section className="space-y-4">
        <h3 className={apexSectionTitle}>Quick Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className={`${apexCard} border-l-4 border-l-[#b9c8de] p-5`}>
            <div className="mb-4 flex items-center justify-between">
              <Dumbbell size={19} className="text-[#b9c8de]" />
              <span className={`${apexMonoTight} text-[#c6c6cd]`}>Weekly</span>
            </div>
            <div className="font-player-display text-3xl font-bold text-[#d8e3fb]">{totals.drills}</div>
            <div className={`${apexMonoTight} mt-1 text-[#c6c6cd]/80`}>Drills Done</div>
          </div>
          <div className={`${apexCard} border-l-4 border-l-[#dce7f8]/70 p-5`}>
            <div className="mb-4 flex items-center justify-between">
              <Flame size={19} className="text-[#dce7f8]" />
              <span className={`${apexMonoTight} text-[#c6c6cd]`}>Goal</span>
            </div>
            <div className="font-player-display text-3xl font-bold text-[#d8e3fb]">{percent}%</div>
            <div className={`${apexMonoTight} mt-1 font-semibold text-[#b9c8de]`}>of {WEEKLY_DRILL_GOAL} / week</div>
          </div>
        </div>
      </section>

      {/* Recent activity */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h3 className={apexSectionTitle}>Recent Activity</h3>
          {completions.length > 0 && (
            <button type="button" onClick={onGoToDrills} className={`${apexMono} inline-flex items-center text-[#b9c8de] transition-colors hover:text-[#dce7f8]`}>
              More <ChevronRight size={13} />
            </button>
          )}
        </div>
        {recent.length === 0 ? (
          <p className={`${apexCard} px-4 py-7 text-center text-sm text-[#c6c6cd]`}>
            No drills logged yet. Hit <span className="font-bold text-[#ff6d00]">Start Session</span> to begin.
          </p>
        ) : (
          <ul className="space-y-2">
            {recent.map(completion => {
              const drill = getPlayerDrill(completion.drill_id);
              return (
                <li key={completion.id} className={`${apexCard} flex items-center gap-3 px-4 py-3`}>
                  <span className="flex h-9 w-9 items-center justify-center rounded bg-[#b9c8de]/10 text-[#dce7f8]">
                    <Dumbbell size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-player-display text-sm font-semibold text-[#d8e3fb]">{drill?.name ?? completion.drill_id}</p>
                    <p className={`${apexMonoTight} mt-0.5 text-[#c6c6cd]/60`}>
                      {completion.duration_seconds ? `${Math.round(completion.duration_seconds / 60)} min · ` : ''}
                      {new Date(completion.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
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

export default HomeTab;
