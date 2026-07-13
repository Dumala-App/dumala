// Phase 6 - Player engagement: achievement catalog + display evaluator.
//
// The catalog is the display source (titles, descriptions, icons) and mirrors
// the grant thresholds in the sync_player_achievements RPC
// (supabase/migrations/202607100011). Keep the keys + thresholds in sync with
// that migration. The server is the grant authority; this module only decides
// what to show and how far along a locked badge is.

export type AchievementMetric = 'drills' | 'workouts' | 'streak' | 'favorites';

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
  { key: 'drill_10', title: 'Perfect Ten', description: 'Complete 10 drills', metric: 'drills', threshold: 10, icon: 'Target' },
  { key: 'drill_50', title: 'Half Century', description: 'Complete 50 drills', metric: 'drills', threshold: 50, icon: 'Award' },
  { key: 'first_workout', title: 'First Sweat', description: 'Log your first workout', metric: 'workouts', threshold: 1, icon: 'Timer' },
  { key: 'workout_10', title: 'Grinder', description: 'Log 10 workouts', metric: 'workouts', threshold: 10, icon: 'Dumbbell' },
  { key: 'streak_3', title: 'On a Roll', description: 'Reach a 3-day streak', metric: 'streak', threshold: 3, icon: 'Flame' },
  { key: 'streak_7', title: 'Week Warrior', description: 'Reach a 7-day streak', metric: 'streak', threshold: 7, icon: 'Zap' },
  { key: 'collector', title: 'Curator', description: 'Favorite 5 drills', metric: 'favorites', threshold: 5, icon: 'Heart' }
];

export interface PlayerStats {
  drills: number;
  workouts: number;
  streak: number;
  favorites: number;
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
