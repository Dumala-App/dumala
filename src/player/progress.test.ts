import { describe, expect, it } from 'vitest';
import { computeStreakDays, weeklyTotals, weeklyGoalPercent } from './progress';

const at = (iso: string, duration?: number) => ({ drill_id: 'd', completed_at: iso, duration_seconds: duration });

describe('computeStreakDays', () => {
  const now = new Date('2026-07-10T18:00:00');

  it('counts consecutive days ending today', () => {
    const completions = [at('2026-07-10T09:00:00'), at('2026-07-09T09:00:00'), at('2026-07-08T09:00:00')];
    expect(computeStreakDays(completions, now)).toBe(3);
  });

  it('still counts a streak that ran through yesterday', () => {
    expect(computeStreakDays([at('2026-07-09T09:00:00'), at('2026-07-08T09:00:00')], now)).toBe(2);
  });

  it('breaks the streak on a gap', () => {
    expect(computeStreakDays([at('2026-07-10T09:00:00'), at('2026-07-07T09:00:00')], now)).toBe(1);
  });

  it('is zero when the last completion is older than yesterday', () => {
    expect(computeStreakDays([at('2026-07-05T09:00:00')], now)).toBe(0);
  });

  it('is zero with no completions', () => {
    expect(computeStreakDays([], now)).toBe(0);
  });

  it('counts two completions on the same day once', () => {
    expect(computeStreakDays([at('2026-07-10T08:00:00'), at('2026-07-10T20:00:00')], now)).toBe(1);
  });
});

describe('weeklyTotals + weeklyGoalPercent', () => {
  const now = new Date('2026-07-10T18:00:00');

  it('sums drills and minutes within the last 7 days', () => {
    const completions = [
      at('2026-07-10T09:00:00', 600), // today, 10 min
      at('2026-07-06T09:00:00', 1200), // 4 days ago, 20 min
      at('2026-07-01T09:00:00', 600) // 9 days ago, excluded
    ];
    expect(weeklyTotals(completions, now)).toEqual({ drills: 2, minutes: 30 });
  });

  it('treats missing durations as zero minutes', () => {
    expect(weeklyTotals([at('2026-07-10T09:00:00')], now)).toEqual({ drills: 1, minutes: 0 });
  });

  it('computes goal percent clamped to 100', () => {
    expect(weeklyGoalPercent({ drills: 2, minutes: 30 }, 5)).toBe(40);
    expect(weeklyGoalPercent({ drills: 8, minutes: 90 }, 5)).toBe(100);
    expect(weeklyGoalPercent({ drills: 0, minutes: 0 }, 5)).toBe(0);
  });
});
