import { describe, expect, it } from 'vitest';
import type { Game } from '../types';
import { suggestTeamCondition } from './contextSuggestions';

const TODAY = new Date('2026-07-19T12:00:00');

const makeGame = (overrides: Partial<Game> & { id: string; date: string }): Game => ({
  opponent: 'Test FC',
  time: '10:00',
  location: 'Home',
  status: 'Completed',
  type: 'League',
  ...overrides
});

describe('suggestTeamCondition', () => {
  it('suggests tired after a dense stretch of sessions', () => {
    const games = [
      makeGame({ id: 'g1', date: '2026-07-16' }),
      makeGame({ id: 'g2', date: '2026-07-17', type: 'Training', status: 'Upcoming' }),
      makeGame({ id: 'g3', date: '2026-07-18', type: 'Friendly' })
    ];

    const suggestion = suggestTeamCondition(games, TODAY);
    expect(suggestion.value).toBe('tired');
    expect(suggestion.reason).toContain('3');
  });

  it('suggests fresh when there was no recent load', () => {
    const suggestion = suggestTeamCondition([], TODAY);
    expect(suggestion.value).toBe('fresh');
  });

  it('suggests normal for light recent load', () => {
    const games = [makeGame({ id: 'g1', date: '2026-07-18', type: 'Training' })];
    expect(suggestTeamCondition(games, TODAY).value).toBe('normal');
  });

  it('ignores cancelled games, meetings, old sessions, and future sessions', () => {
    const games = [
      makeGame({ id: 'g1', date: '2026-07-17', status: 'Cancelled' }),
      makeGame({ id: 'g2', date: '2026-07-18', type: 'Meeting' }),
      makeGame({ id: 'g3', date: '2026-07-10' }),
      makeGame({ id: 'g4', date: '2026-07-21', status: 'Upcoming' })
    ];

    expect(suggestTeamCondition(games, TODAY).value).toBe('fresh');
  });
});
