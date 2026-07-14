import { describe, expect, it } from 'vitest';
import { getUniqueRosterPlayerOptions } from './PlayerLinkRequestsPanel';
import type { ClubRosterPlayer } from '../cloud/player';

const rosterPlayer = (player: Pick<ClubRosterPlayer, 'id' | 'name' | 'roster_number' | 'position'>): ClubRosterPlayer => ({
  photo_url: '',
  games_played: 0,
  goals: 0,
  assists: 0,
  clean_sheets: 0,
  minutes_played: 0,
  yellow_cards: 0,
  red_cards: 0,
  base_attributes: null,
  position_attributes: null,
  specialty_traits: null,
  ...player
});

describe('getUniqueRosterPlayerOptions', () => {
  it('collapses duplicate cloud roster rows into one visible player option', () => {
    const roster: ClubRosterPlayer[] = [
      rosterPlayer({ id: 'player-1', name: 'Franco Armani', roster_number: 1, position: 'Goalkeeper' }),
      rosterPlayer({ id: 'player-duplicate', name: ' Franco   Armani ', roster_number: 1, position: ' goalkeeper ' }),
      rosterPlayer({ id: 'player-2', name: 'Nicolas Tagliafico', roster_number: 3, position: 'Defender' })
    ];

    const options = getUniqueRosterPlayerOptions(roster, new Set());

    expect(options).toHaveLength(2);
    expect(options.map(player => player.name)).toEqual(['Franco Armani', 'Nicolas Tagliafico']);
  });

  it('marks the whole duplicate player group linked when any duplicate row is linked', () => {
    const roster: ClubRosterPlayer[] = [
      rosterPlayer({ id: 'player-1', name: 'Franco Armani', roster_number: 1, position: 'Goalkeeper' }),
      rosterPlayer({ id: 'linked-duplicate', name: 'Franco Armani', roster_number: 1, position: 'Goalkeeper' })
    ];

    const options = getUniqueRosterPlayerOptions(roster, new Set(['linked-duplicate']));

    expect(options).toEqual([
      expect.objectContaining({ id: 'linked-duplicate', name: 'Franco Armani', linked: true })
    ]);
  });
});
