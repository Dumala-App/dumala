import { describe, expect, it } from 'vitest';
import type { Game, Player, Standing } from '../types';
import { deleteGameAndReconcile, recordMatchResult } from './results';

const makePlayer = (overrides: Partial<Player>): Player => ({
  id: 'player-1',
  name: 'Player One',
  number: 1,
  position: 'Forward',
  bio: '',
  photoUrl: '',
  gamesPlayed: 0,
  points: 0,
  assists: 2,
  cleanSheetsOrRebounds: 0,
  minutesPlayed: 90,
  mvpAwards: 0,
  yellowCards: 0,
  redCards: 0,
  offenses: [],
  baseAttributes: {
    pace: 50,
    stamina: 50,
    agility: 50,
    strength: 50,
    firstTouch: 50,
    shortPassing: 50
  },
  positionAttributes: {},
  registrationStatus: 'Active',
  ...overrides
});

const players = [
  makePlayer({ id: 'forward', name: 'Forward', number: 9 }),
  makePlayer({ id: 'defender', name: 'Defender', number: 4, position: 'Defender' }),
  makePlayer({ id: 'keeper', name: 'Keeper', number: 1, position: 'Goalkeeper' }),
  makePlayer({ id: 'staff', name: 'Coach', number: 0, position: 'Manager / Coach' })
];

const standings: Standing[] = [
  {
    rank: 1,
    teamName: 'Dumala FC',
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
    isUserTeam: true
  },
  {
    rank: 2,
    teamName: 'United FC',
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0
  }
];

const upcomingGame: Game = {
  id: 'game-1',
  opponent: 'United FC',
  date: '2026-06-21',
  time: '10:00',
  location: 'Home',
  status: 'Upcoming',
  type: 'League'
};

const result = {
  ourScore: 2,
  opponentScore: 0,
  mvpId: 'forward',
  notes: 'Controlled match',
  scorers: [{ playerId: 'forward', playerName: 'Forward', count: 2 }]
};

describe('match result reconciliation', () => {
  it('applies a league win to both standings and eligible athletes', () => {
    const next = recordMatchResult({
      gameId: upcomingGame.id,
      teamName: 'Dumala FC',
      games: [upcomingGame],
      players,
      standings
    }, result);

    expect(next.standings.find(team => team.isUserTeam)).toMatchObject({
      played: 1, won: 1, goalsFor: 2, goalsAgainst: 0, points: 3
    });
    expect(next.standings.find(team => team.teamName === 'United FC')).toMatchObject({
      played: 1, lost: 1, goalsFor: 0, goalsAgainst: 2, points: 0
    });
    expect(next.players.find(player => player.id === 'forward')).toMatchObject({
      gamesPlayed: 1, points: 2, mvpAwards: 1, assists: 2, minutesPlayed: 90
    });
    expect(next.players.find(player => player.id === 'defender')?.cleanSheetsOrRebounds).toBe(1);
    expect(next.players.find(player => player.id === 'keeper')?.cleanSheetsOrRebounds).toBe(1);
    expect(next.players.find(player => player.id === 'staff')?.gamesPlayed).toBe(0);
  });

  it('does not duplicate totals when the same result is saved twice', () => {
    const first = recordMatchResult({
      gameId: upcomingGame.id,
      teamName: 'Dumala FC',
      games: [upcomingGame],
      players,
      standings
    }, result);
    const second = recordMatchResult({
      ...first,
      gameId: upcomingGame.id,
      teamName: 'Dumala FC'
    }, result);

    expect(second.players).toEqual(first.players);
    expect(second.standings).toEqual(first.standings);
  });

  it('reverses the old contribution before applying an edited result', () => {
    const first = recordMatchResult({
      gameId: upcomingGame.id,
      teamName: 'Dumala FC',
      games: [upcomingGame],
      players,
      standings
    }, result);
    const edited = recordMatchResult({
      ...first,
      gameId: upcomingGame.id,
      teamName: 'Dumala FC'
    }, {
      ...result,
      ourScore: 1,
      opponentScore: 1,
      mvpId: 'keeper',
      scorers: [{ playerId: 'forward', playerName: 'Forward', count: 1 }]
    });

    expect(edited.standings.find(team => team.isUserTeam)).toMatchObject({
      played: 1, won: 0, drawn: 1, goalsFor: 1, goalsAgainst: 1, points: 1
    });
    expect(edited.players.find(player => player.id === 'forward')).toMatchObject({
      gamesPlayed: 1, points: 1, mvpAwards: 0
    });
    expect(edited.players.find(player => player.id === 'keeper')).toMatchObject({
      cleanSheetsOrRebounds: 0, mvpAwards: 1
    });
  });

  it('reconciles an old result even if a player is now suspended', () => {
    const first = recordMatchResult({
      gameId: upcomingGame.id,
      teamName: 'Dumala FC',
      games: [upcomingGame],
      players,
      standings
    }, result);
    const changedRoster = first.players.map(player =>
      player.id === 'defender' ? { ...player, registrationStatus: 'Suspended' as const } : player
    );
    const edited = recordMatchResult({
      ...first,
      players: changedRoster,
      gameId: upcomingGame.id,
      teamName: 'Dumala FC'
    }, {
      ...result,
      opponentScore: 1
    });

    expect(edited.players.find(player => player.id === 'defender')).toMatchObject({
      gamesPlayed: 1,
      cleanSheetsOrRebounds: 0,
      registrationStatus: 'Suspended'
    });
  });

  it('does not credit suspended athletes in a newly recorded match', () => {
    const roster = players.map(player =>
      player.id === 'defender' ? { ...player, registrationStatus: 'Suspended' as const } : player
    );
    const next = recordMatchResult({
      gameId: upcomingGame.id,
      teamName: 'Dumala FC',
      games: [upcomingGame],
      players: roster,
      standings
    }, result);

    expect(next.games[0].creditedPlayerIds).not.toContain('defender');
    expect(next.players.find(player => player.id === 'defender')).toMatchObject({
      gamesPlayed: 0,
      cleanSheetsOrRebounds: 0
    });
  });

  it('removes all game contributions when a completed game is deleted', () => {
    const completed = recordMatchResult({
      gameId: upcomingGame.id,
      teamName: 'Dumala FC',
      games: [upcomingGame],
      players,
      standings
    }, result);
    const deleted = deleteGameAndReconcile({
      ...completed,
      gameId: upcomingGame.id,
      teamName: 'Dumala FC'
    });

    expect(deleted.games).toEqual([]);
    expect(deleted.standings).toEqual(standings);
    expect(deleted.players).toEqual(players);
  });

  it('keeps cup and friendly results out of league standings', () => {
    const next = recordMatchResult({
      gameId: upcomingGame.id,
      teamName: 'Dumala FC',
      games: [{ ...upcomingGame, type: 'Cup' }],
      players,
      standings
    }, result);

    expect(next.standings).toEqual(standings);
    expect(next.players.find(player => player.id === 'forward')?.points).toBe(2);
  });

  it('rejects invalid scorer, MVP, and score values without changing state', () => {
    const input = {
      gameId: upcomingGame.id,
      teamName: 'Dumala FC',
      games: [upcomingGame],
      players,
      standings
    };

    expect(() => recordMatchResult(input, { ...result, ourScore: -1 })).toThrow('Scores must');
    expect(() => recordMatchResult(input, { ...result, mvpId: 'staff' })).toThrow('active athlete');
    expect(() => recordMatchResult(input, {
      ...result,
      ourScore: 1,
      scorers: [{ playerId: 'forward', playerName: 'Forward', count: 2 }]
    })).toThrow('cannot exceed');
    expect(input.games[0].status).toBe('Upcoming');
    expect(input.players).toEqual(players);
    expect(input.standings).toEqual(standings);
  });
});
