// Phase 6 - Player engagement: achievement catalog + display evaluator.
//
// The server can still grant canonical achievement keys through the
// sync_player_achievements RPC, but the full catalog is intentionally evaluated
// client-side too so newer progress badges can appear before a migration adds
// server-side grants.

export type AchievementMetric =
  | 'drills'
  | 'workouts'
  | 'streak'
  | 'favorites'
  | 'jugglingAttempts'
  | 'jugglingBest'
  | 'totalMinutes';

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  metric: AchievementMetric;
  threshold: number;
  icon: string; // lucide icon name, resolved by the UI
}

export const PLAYER_ACHIEVEMENTS: AchievementDef[] = [
  { key: 'first_touch', title: 'First Touch', description: 'Complete your first drill', metric: 'drills', threshold: 1, icon: 'Footprints' },
  { key: 'drill_5', title: 'Five Alive', description: 'Complete 5 solo drills', metric: 'drills', threshold: 5, icon: 'Target' },
  { key: 'drill_10', title: 'Perfect Ten', description: 'Complete 10 drills', metric: 'drills', threshold: 10, icon: 'Target' },
  { key: 'drill_25', title: 'Training Habit', description: 'Complete 25 solo drills', metric: 'drills', threshold: 25, icon: 'Dumbbell' },
  { key: 'drill_50', title: 'Half Century', description: 'Complete 50 drills', metric: 'drills', threshold: 50, icon: 'Award' },
  { key: 'drill_100', title: 'Century Club', description: 'Complete 100 drills', metric: 'drills', threshold: 100, icon: 'Trophy' },
  { key: 'first_workout', title: 'First Sweat', description: 'Log your first workout', metric: 'workouts', threshold: 1, icon: 'Timer' },
  { key: 'workout_5', title: 'Clocked In', description: 'Save 5 timer workouts', metric: 'workouts', threshold: 5, icon: 'Timer' },
  { key: 'workout_10', title: 'Grinder', description: 'Log 10 workouts', metric: 'workouts', threshold: 10, icon: 'Dumbbell' },
  { key: 'workout_25', title: 'Engine Room', description: 'Save 25 timer workouts', metric: 'workouts', threshold: 25, icon: 'Gauge' },
  { key: 'streak_3', title: 'On a Roll', description: 'Reach a 3-day streak', metric: 'streak', threshold: 3, icon: 'Flame' },
  { key: 'streak_7', title: 'Week Warrior', description: 'Reach a 7-day streak', metric: 'streak', threshold: 7, icon: 'Zap' },
  { key: 'streak_14', title: 'Fortnight Fire', description: 'Reach a 14-day streak', metric: 'streak', threshold: 14, icon: 'Flame' },
  { key: 'streak_30', title: 'Month Machine', description: 'Reach a 30-day streak', metric: 'streak', threshold: 30, icon: 'Zap' },
  { key: 'collector_3', title: 'Scout List', description: 'Favorite 3 drills', metric: 'favorites', threshold: 3, icon: 'Heart' },
  { key: 'collector', title: 'Curator', description: 'Favorite 5 drills', metric: 'favorites', threshold: 5, icon: 'Heart' },
  { key: 'collector_10', title: 'Personal Library', description: 'Favorite 10 drills', metric: 'favorites', threshold: 10, icon: 'Heart' },
  { key: 'juggling_first', title: 'Keepy-Uppy Start', description: 'Record your first juggling score', metric: 'jugglingAttempts', threshold: 1, icon: 'Volleyball' },
  { key: 'juggling_5_logs', title: 'Touch Journal', description: 'Record 5 juggling attempts', metric: 'jugglingAttempts', threshold: 5, icon: 'Volleyball' },
  { key: 'juggling_25', title: 'Soft Touch', description: 'Reach 25 ball-control juggles', metric: 'jugglingBest', threshold: 25, icon: 'Sparkles' },
  { key: 'juggling_50', title: 'Ball Magnet', description: 'Reach 50 ball-control juggles', metric: 'jugglingBest', threshold: 50, icon: 'Sparkles' },
  { key: 'juggling_100', title: 'Hundred Touches', description: 'Reach 100 ball-control juggles', metric: 'jugglingBest', threshold: 100, icon: 'Trophy' },
  { key: 'juggling_250', title: 'Touch Master', description: 'Reach 250 ball-control juggles', metric: 'jugglingBest', threshold: 250, icon: 'Trophy' },
  { key: 'minutes_60', title: 'One Hour Banked', description: 'Train for 60 total minutes', metric: 'totalMinutes', threshold: 60, icon: 'Timer' },
  { key: 'minutes_300', title: 'Five Hour Engine', description: 'Train for 300 total minutes', metric: 'totalMinutes', threshold: 300, icon: 'Gauge' }
];

export interface PlayerStats {
  drills: number;
  workouts: number;
  streak: number;
  favorites: number;
  jugglingAttempts: number;
  jugglingBest: number;
  totalMinutes: number;
}

export interface AchievementView {
  def: AchievementDef;
  earned: boolean;
  earnedAt: string | null;
  current: number;
  threshold: number;
  percent: number;
}

const metricValue = (stats: PlayerStats, metric: AchievementMetric): number => {
  switch (metric) {
    case 'drills': return stats.drills;
    case 'workouts': return stats.workouts;
    case 'streak': return stats.streak;
    case 'favorites': return stats.favorites;
    case 'jugglingAttempts': return stats.jugglingAttempts;
    case 'jugglingBest': return stats.jugglingBest;
    case 'totalMinutes': return stats.totalMinutes;
  }
};

/**
 * Merge the catalog with the player's stats and their earned set, so the UI can
 * render earned badges and locked ones with a progress bar. A badge counts as
 * earned when the server has granted it OR the threshold is already met (so
 * preview mode, which never persists, still lights up completed badges). Earned
 * badges sort first, then by proximity to completion.
 */
export const evaluateAchievements = (
  stats: PlayerStats,
  earned: Map<string, string> = new Map()
): AchievementView[] => {
  const views = PLAYER_ACHIEVEMENTS.map<AchievementView>(def => {
    const current = metricValue(stats, def.metric);
    const isEarned = earned.has(def.key) || current >= def.threshold;
    return {
      def,
      earned: isEarned,
      earnedAt: earned.get(def.key) ?? null,
      current: Math.min(current, def.threshold),
      threshold: def.threshold,
      percent: def.threshold === 0 ? 100 : Math.min(100, Math.round((current / def.threshold) * 100))
    };
  });
  return views.sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1;
    return b.percent - a.percent;
  });
};

/** How many badges are earned, for a headline count. */
export const earnedCount = (views: AchievementView[]): number => views.filter(v => v.earned).length;
