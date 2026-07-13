import { describe, expect, it } from 'vitest';
import {
  PLAYER_DRILLS,
  difficultyForIntensity,
  estimatedMinutes,
  filterPlayerDrills,
  equipmentOptions,
  getPlayerDrill,
  type PlayerDrill
} from './drillCatalog';

describe('drill catalog', () => {
  it('derives a card for every library drill', () => {
    expect(PLAYER_DRILLS.length).toBeGreaterThan(50);
    for (const drill of PLAYER_DRILLS) {
      expect(drill.id).toBeTruthy();
      expect(['Easy', 'Moderate', 'Hard']).toContain(drill.difficulty);
      expect(drill.minutes).toBeGreaterThanOrEqual(10);
      expect(drill.minutes).toBeLessThanOrEqual(30);
      expect(Array.isArray(drill.equipment)).toBe(true);
    }
  });

  it('maps intensity to difficulty and a bounded duration', () => {
    expect(difficultyForIntensity(2)).toBe('Easy');
    expect(difficultyForIntensity(4)).toBe('Moderate');
    expect(difficultyForIntensity(8)).toBe('Hard');
    expect(estimatedMinutes(1)).toBe(11);
    expect(estimatedMinutes(8)).toBe(28);
  });

  it('exposes stable equipment options', () => {
    const options = equipmentOptions();
    expect(options.length).toBeGreaterThan(0);
    expect(options).toEqual([...options].sort((a, b) => a.localeCompare(b)));
  });

  it('finds a drill by id', () => {
    const first = PLAYER_DRILLS[0];
    expect(getPlayerDrill(first.id)?.name).toBe(first.name);
    expect(getPlayerDrill('nope')).toBeUndefined();
  });

  const sample: PlayerDrill[] = [
    { id: 'a', name: 'Sprint Ladder', category: 'Physical & Pace', description: 'speed work', intensity: 8, difficulty: 'Hard', minutes: 28, positionGroup: 'General', equipment: ['cones'], color: '' },
    { id: 'b', name: 'Easy Passing', category: 'Creative Midfield', description: 'passing rondo', intensity: 2, difficulty: 'Easy', minutes: 12, positionGroup: 'Midfield', equipment: ['balls'], color: '' }
  ];

  it('filters by difficulty, search, equipment, and favorites', () => {
    expect(filterPlayerDrills(sample, { difficulty: 'Hard' }).map(d => d.id)).toEqual(['a']);
    expect(filterPlayerDrills(sample, { search: 'passing' }).map(d => d.id)).toEqual(['b']);
    expect(filterPlayerDrills(sample, { equipment: 'balls' }).map(d => d.id)).toEqual(['b']);
    expect(filterPlayerDrills(sample, { positionGroup: 'Midfield' }).map(d => d.id)).toEqual(['b']);
    expect(filterPlayerDrills(sample, { favoritesOnly: true }, new Set(['a'])).map(d => d.id)).toEqual(['a']);
    expect(filterPlayerDrills(sample, { difficulty: 'all' }).length).toBe(2);
  });
});
