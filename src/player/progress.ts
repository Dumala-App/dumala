// Pure progress helpers for the Player app's Home and Progress tabs. Derived from
// self-reported drill completions so the dashboard is real without a server RPC.

export interface CompletionLike {
  drill_id: string;
  completed_at: string;
  duration_seconds?: number | null;
}

export interface WeeklyTotals {
  drills: number;
  minutes: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_WEEKLY_GOAL = 5;

const startOfDay = (date: Date): number => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
};

/** Distinct local days that have at least one completion. */
const completionDaySet = (completions: CompletionLike[]): Set<number> => {
  const days = new Set<number>();
  for (const completion of completions) {
    const time = new Date(completion.completed_at).getTime();
    if (Number.isNaN(time)) continue;
    days.add(startOfDay(new Date(time)));
  }
  return days;
};

/**
 * Consecutive days ending today (or yesterday, so a streak survives until the end
 * of the next day) that have at least one completion.
 */
export const computeStreakDays = (completions: CompletionLike[], now: Date = new Date()): number => {
  const days = completionDaySet(completions);
  if (days.size === 0) return 0;

  const today = startOfDay(now);
  let cursor = days.has(today) ? today : today - DAY_MS;
  if (!days.has(cursor)) return 0;

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor -= DAY_MS;
  }
  return streak;
};

/** Drills and minutes completed in the last 7 days (rolling). */
export const weeklyTotals = (completions: CompletionLike[], now: Date = new Date()): WeeklyTotals => {
  const cutoff = now.getTime() - 7 * DAY_MS;
  let drills = 0;
  let seconds = 0;
  for (const completion of completions) {
    const time = new Date(completion.completed_at).getTime();
    if (Number.isNaN(time) || time < cutoff || time > now.getTime()) continue;
    drills += 1;
    seconds += completion.duration_seconds ?? 0;
  }
  return { drills, minutes: Math.round(seconds / 60) };
};

/** Progress toward a weekly drill goal, clamped to 0–100. */
export const weeklyGoalPercent = (
  totals: WeeklyTotals,
  goal: number = DEFAULT_WEEKLY_GOAL
): number => {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((totals.drills / goal) * 100));
};

export const WEEKLY_DRILL_GOAL = DEFAULT_WEEKLY_GOAL;
