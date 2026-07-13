import { TRAINING_DRILLS, getDrillEquipment, getDrillHowToRun } from '../training/drillLibrary';

// Player-facing view of the shared drill library. Turns the coach-side
// TRAINING_DRILLS (src/training/drillLibrary.ts) into simple cards a teenager can
// browse and filter, deriving difficulty, an estimated duration, equipment, and
// a rough position group.

export type DrillDifficulty = 'Easy' | 'Moderate' | 'Hard';
export type PositionGroup = 'Forward' | 'Midfield' | 'Defender' | 'Goalkeeper' | 'General';

export interface PlayerDrill {
  id: string;
  name: string;
  category: string;
  description: string;
  intensity: number;
  difficulty: DrillDifficulty;
  minutes: number;
  positionGroup: PositionGroup;
  equipment: string[];
  color: string;
}

export const difficultyForIntensity = (intensity: number): DrillDifficulty => {
  if (intensity <= 3) return 'Easy';
  if (intensity <= 5) return 'Moderate';
  return 'Hard';
};

// Approximate a session length from intensity (a hint on the card, not a rule).
export const estimatedMinutes = (intensity: number): number =>
  Math.min(30, Math.max(10, Math.round(8 + intensity * 2.5)));

const positionGroupForCategory = (category: string): PositionGroup => {
  const text = category.toLowerCase();
  if (text.includes('forward') || text.includes('finish') || text.includes('striker')) return 'Forward';
  if (text.includes('midfield')) return 'Midfield';
  if (text.includes('defender') || text.includes('defensive')) return 'Defender';
  if (text.includes('goalkeep')) return 'Goalkeeper';
  return 'General';
};

export const buildPlayerDrill = (drill: (typeof TRAINING_DRILLS)[number]): PlayerDrill => ({
  id: drill.id,
  name: drill.name,
  category: drill.category,
  description: drill.description,
  intensity: drill.fatigueIncrease,
  difficulty: difficultyForIntensity(drill.fatigueIncrease),
  minutes: estimatedMinutes(drill.fatigueIncrease),
  positionGroup: positionGroupForCategory(drill.category),
  equipment: getDrillEquipment(drill.id),
  color: drill.color
});

export const PLAYER_DRILLS: PlayerDrill[] = TRAINING_DRILLS.map(buildPlayerDrill);

export const getPlayerDrill = (drillId: string): PlayerDrill | undefined =>
  PLAYER_DRILLS.find(drill => drill.id === drillId);

export const getDrillInstructions = (drillId: string): string => getDrillHowToRun(drillId);

export interface DrillFilter {
  search?: string;
  difficulty?: DrillDifficulty | 'all';
  positionGroup?: PositionGroup | 'all';
  equipment?: string | 'all';
  favoritesOnly?: boolean;
}

export const equipmentOptions = (): string[] => {
  const set = new Set<string>();
  for (const drill of PLAYER_DRILLS) {
    for (const item of drill.equipment) set.add(item);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
};

export const filterPlayerDrills = (
  drills: PlayerDrill[],
  filter: DrillFilter,
  favorites: ReadonlySet<string> = new Set()
): PlayerDrill[] => {
  const search = filter.search?.trim().toLowerCase() ?? '';
  return drills.filter(drill => {
    if (filter.favoritesOnly && !favorites.has(drill.id)) return false;
    if (filter.difficulty && filter.difficulty !== 'all' && drill.difficulty !== filter.difficulty) return false;
    if (filter.positionGroup && filter.positionGroup !== 'all' && drill.positionGroup !== filter.positionGroup) return false;
    if (filter.equipment && filter.equipment !== 'all' && !drill.equipment.includes(filter.equipment)) return false;
    if (search) {
      const haystack = `${drill.name} ${drill.category} ${drill.description}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
};
