import { describe, expect, it } from 'vitest';
import { PLAYER_ACHIEVEMENTS, earnedCount, evaluateAchievements, type PlayerStats } from './achievements';

const stats = (over: Partial<PlayerStats> = {}): PlayerStats => ({
  drills: 0,
  workouts: 0,
  streak: 0,
  favorites: 0,
  jugglingAttempts: 0,
  jugglingBest: 0,
  totalMinutes: 0,
  ...over
});

describe('evaluateAchievements', () => {
  it('marks a badge earned when the threshold is met, with progress capped at 100', () => {
    const views = evaluateAchievements(stats({ drills: 12 }));
    const byKey = Object.fromEntries(views.map(v => [v.def.key, v]));
    expect(byKey.first_touch.earned).toBe(true);
    expect(byKey.drill_10.earned).toBe(true);
    expect(byKey.drill_10.percent).toBe(100);
    expect(byKey.drill_50.earned).toBe(false);
    expect(byKey.drill_50.percent).toBe(24); // 12/50
  });

  it('treats a server-granted key as earned even if the client stat lags', () => {
    const earned = new Map([['streak_7', '2026-07-13T00:00:00.000Z']]);
    const views = evaluateAchievements(stats({ streak: 0 }), earned);
    const week = views.find(v => v.def.key === 'streak_7')!;
    expect(week.earned).toBe(true);
    expect(week.earnedAt).toBe('2026-07-13T00:00:00.000Z');
  });

  it('sorts earned badges first, then by proximity to completion', () => {
    const views = evaluateAchievements(stats({ drills: 1, workouts: 0, favorites: 4, streak: 0 }));
    // first_touch earned; collector (4/5=80%) should lead the locked ones.
    expect(views[0].def.key).toBe('first_touch');
    const firstLocked = views.find(v => !v.earned)!;
    expect(firstLocked.def.key).toBe('collector');
  });

  it('counts earned badges and covers the whole catalog', () => {
    const views = evaluateAchievements(stats({
      drills: 100,
      workouts: 25,
      streak: 30,
      favorites: 10,
      jugglingAttempts: 5,
      jugglingBest: 250,
      totalMinutes: 300
    }));
    expect(views).toHaveLength(PLAYER_ACHIEVEMENTS.length);
    expect(earnedCount(views)).toBe(PLAYER_ACHIEVEMENTS.length); // everything unlocked
  });

  it('includes an expanded achievement catalog with juggling milestones', () => {
    expect(PLAYER_ACHIEVEMENTS.length).toBeGreaterThanOrEqual(20);
    const views = evaluateAchievements(stats({ jugglingAttempts: 1, jugglingBest: 50 }));
    const byKey = Object.fromEntries(views.map(v => [v.def.key, v]));
    expect(byKey.juggling_first.earned).toBe(true);
    expect(byKey.juggling_50.earned).toBe(true);
    expect(byKey.juggling_100.earned).toBe(false);
    expect(byKey.juggling_100.percent).toBe(50);
  });
});
