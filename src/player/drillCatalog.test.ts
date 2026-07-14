import { describe, expect, it } from 'vitest';
import {
  JUGGLING_DRILL_ID,
  PLAYER_DRILLS,
  difficultyForIntensity,
  estimatedMinutes,
  filterPlayerDrills,
  equipmentOptions,
  getJugglingProgress,
  getPlayerDrill,
  parseJugglingScore,
  serializeJugglingScoreNote,
  type PlayerDrill
} from './drillCatalog';
import type { PlayerDrillCompletion } from '../cloud/player';

describe('drill catalog', () => {
  it('exposes a solo-only player drill library', () => {
    expect(PLAYER_DRILLS.length).toBeGreaterThanOrEqual(24);
    for (const drill of PLAYER_DRILLS) {
      expect(drill.id).toMatch(/^solo-/);
      expect(['Easy', 'Moderate', 'Hard']).toContain(drill.difficulty);
      expect(drill.minutes).toBeGreaterThanOrEqual(10);
      expect(drill.minutes).toBeLessThanOrEqual(30);
      expect(Array.isArray(drill.equipment)).toBe(true);
      expect(drill.instructions).toBeTruthy();
    }
  });

  it('includes a juggling score drill', () => {
    const juggling = getPlayerDrill(JUGGLING_DRILL_ID);
    expect(juggling?.trackJugglingScore).toBe(true);
    expect(juggling?.equipment).toContain('ball');
    expect(juggling?.equipment).toContain('timer');
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
    { id: 'solo-a', name: 'Sprint Ladder', category: 'Physical & Pace', description: 'speed work', intensity: 8, difficulty: 'Hard', minutes: 28, positionGroup: 'General', equipment: ['cones'], color: '', instructions: 'Run.' },
    { id: 'solo-b', name: 'Easy Passing', category: 'Creative Midfield', description: 'passing wall drill', intensity: 2, difficulty: 'Easy', minutes: 12, positionGroup: 'Midfield', equipment: ['ball'], color: '', instructions: 'Pass.' }
  ];

  it('filters by difficulty, search, equipment, and favorites', () => {
    expect(filterPlayerDrills(sample, { difficulty: 'Hard' }).map(d => d.id)).toEqual(['solo-a']);
    expect(filterPlayerDrills(sample, { search: 'passing' }).map(d => d.id)).toEqual(['solo-b']);
    expect(filterPlayerDrills(sample, { equipment: 'ball' }).map(d => d.id)).toEqual(['solo-b']);
    expect(filterPlayerDrills(sample, { positionGroup: 'Midfield' }).map(d => d.id)).toEqual(['solo-b']);
    expect(filterPlayerDrills(sample, { favoritesOnly: true }, new Set(['solo-a'])).map(d => d.id)).toEqual(['solo-a']);
    expect(filterPlayerDrills(sample, { difficulty: 'all' }).length).toBe(2);
  });

  it('tracks juggling progress from completion notes', () => {
    const completion = (id: string, daysAgo: number, note: string | null): PlayerDrillCompletion => ({
      id,
      user_id: 'u1',
      drill_id: JUGGLING_DRILL_ID,
      completed_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      duration_seconds: 600,
      perceived_exertion: null,
      notes: note,
      created_at: new Date().toISOString()
    });

    expect(serializeJugglingScoreNote(27.4)).toBe('juggling_score:27');
    expect(parseJugglingScore(completion('a', 0, 'juggling_score:44'))).toBe(44);
    expect(parseJugglingScore(completion('b', 0, null))).toBeNull();

    const progress = getJugglingProgress([
      completion('older', 2, 'juggling_score:33'),
      completion('latest', 0, 'juggling_score:28'),
      completion('best', 1, 'juggling_score:61')
    ]);

    expect(progress.latestScore).toBe(28);
    expect(progress.bestScore).toBe(61);
    expect(progress.attempts.map(attempt => attempt.id)).toEqual(['latest', 'best', 'older']);
  });
});
