import { describe, expect, it } from 'vitest';
import type { ClubRosterPlayer } from '../../cloud/player';
import { getUniqueSquadPlayers } from './SquadTab';

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

describe('getUniqueSquadPlayers', () => {
  it('collapses duplicate roster rows into one visible squad player', () => {
    const players = [
      rosterPlayer({ id: 'player-1', name: 'Alex Rivera', roster_number: 11, position: 'Forward' }),
      rosterPlayer({ id: 'player-copy', name: ' Alex   Rivera ', roster_number: 11, position: ' forward ' }),
      rosterPlayer({ id: 'player-2', name: 'Mason Lee', roster_number: 1, position: 'Goalkeeper' })
    ];

    const uniquePlayers = getUniqueSquadPlayers(players);

    expect(uniquePlayers).toHaveLength(2);
    expect(uniquePlayers.map(player => player.id)).toEqual(['player-1', 'player-2']);
  });
});

