import { describe, expect, it } from 'vitest';
import type { Game, Player, Standing } from '../types';
import { recordMatchResult } from '../matches/results';
import {
  checkWorkspaceIntegrity,
  getActionableIntegrityFindings
} from './workspaceIntegrity';

const makePlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'forward',
  name: 'Forward One',
  number: 9,
  position: 'Forward',
  bio: '',
  photoUrl: '',
  gamesPlayed: 0,
  points: 0,
  assists: 0,
  cleanSheetsOrRebounds: 0,
  minutesPlayed: 0,
  mvpAwards: 0,
  yellowCards: 0,
  redCards: 0,
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
  makePlayer(),
  makePlayer({ id: 'defender', name: 'Defender One', number: 4, position: 'Defender' }),
  makePlayer({ id: 'keeper', name: 'Keeper One', number: 1, position: 'Goalkeeper' })
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

const game: Game = {
  id: 'game-1',
  opponent: 'United FC',
  date: '2026-06-23',
  time: '10:00',
  location: 'Home',
  status: 'Upcoming',
  type: 'League'
};

const reconciled = recordMatchResult({
  gameId: game.id,
  teamName: 'Dumala FC',
  games: [game],
  players,
  standings
}, {
  ourScore: 2,
  opponentScore: 0,
  mvpId: 'forward',
  notes: '',
  scorers: [{ playerId: 'forward', playerName: 'Forward One', count: 2 }]
});

const check = (
  overrides: Partial<{
    games: Game[];
    players: Player[];
    standings: Standing[];
  }> = {}
) => checkWorkspaceIntegrity({
  teamName: 'Dumala FC',
  games: overrides.games ?? reconciled.games,
  players: overrides.players ?? reconciled.players,
  standings: overrides.standings ?? reconciled.standings
}, '2026-06-23T00:00:00.000Z');

describe('workspace integrity checker', () => {
  it('returns a healthy report for a reconciled workspace', () => {
    const report = check();

    expect(report.isHealthy).toBe(true);
    expect(getActionableIntegrityFindings(report)).toEqual([]);
    expect(report.checkedAt).toBe('2026-06-23T00:00:00.000Z');
  });

  it('finds targeted standings totals below completed match contributions', () => {
    const brokenStandings = reconciled.standings.map(standing =>
      standing.isUserTeam
        ? { ...standing, played: 0, goalsFor: 1, points: 0 }
        : standing
    );
    const report = check({ standings: brokenStandings });

    expect(report.findings.map(item => item.code)).toEqual(expect.arrayContaining([
      'STANDING_PLAYED_BELOW_MATCHES',
      'STANDING_GOALSFOR_BELOW_MATCHES',
      'STANDING_POINTS_BELOW_MATCHES'
    ]));
    expect(report.isHealthy).toBe(false);
  });

  it('accepts coherent manual or external league results above tracked matches', () => {
    const withExternal = reconciled.standings.map(standing => {
      if (standing.isUserTeam) {
        return {
          ...standing,
          played: standing.played + 2,
          won: standing.won + 1,
          drawn: standing.drawn + 1,
          goalsFor: standing.goalsFor + 3,
          goalsAgainst: standing.goalsAgainst + 2,
          points: standing.points + 4
        };
      }
      if (standing.teamName === 'United FC') {
        return {
          ...standing,
          played: standing.played + 1,
          won: standing.won + 1,
          goalsFor: standing.goalsFor + 2,
          goalsAgainst: standing.goalsAgainst + 1,
          points: standing.points + 3
        };
      }
      return standing;
    });

    expect(getActionableIntegrityFindings(check({ standings: withExternal }))).toEqual([]);
  });

  it('warns when external standing totals are internally inconsistent', () => {
    const inconsistent = reconciled.standings.map(standing =>
      standing.isUserTeam
        ? { ...standing, played: standing.played + 1, points: standing.points + 2 }
        : standing
    );

    expect(check({ standings: inconsistent }).findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'STANDING_EXTERNAL_TOTALS_INCONSISTENT' })
      ])
    );
  });

  it('finds player goals, appearances, clean sheets, and MVP mismatches', () => {
    const brokenPlayers = reconciled.players.map(player => {
      if (player.id === 'forward') {
        return { ...player, gamesPlayed: 0, points: 1, mvpAwards: 0 };
      }
      if (player.id === 'keeper') {
        return { ...player, cleanSheetsOrRebounds: 0 };
      }
      return player;
    });
    const codes = check({ players: brokenPlayers }).findings.map(item => item.code);

    expect(codes).toEqual(expect.arrayContaining([
      'PLAYER_APPEARANCES_MISMATCH',
      'PLAYER_GOALS_MISMATCH',
      'PLAYER_MVP_MISMATCH',
      'PLAYER_CLEAN_SHEETS_MISMATCH'
    ]));
    expect(check({ players: brokenPlayers }).findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'PLAYER_GOALS_MISMATCH',
        focusId: 'forward',
        focusLabel: 'Forward One',
        message: "Forward One has 1 saved goals, but recorded scorers total 2."
      })
    ]));
  });

  it('treats incomplete historical player credits as a warning instead of guessing', () => {
    const legacyGames = reconciled.games.map(({ creditedPlayerIds: _credits, ...storedGame }) => storedGame);
    const report = check({ games: legacyGames });

    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'GAME_PLAYER_CREDITS_INCOMPLETE',
        severity: 'warning'
      })
    ]));
    expect(report.findings.some(item => item.code === 'PLAYER_APPEARANCES_MISMATCH')).toBe(false);
  });

  it('reports missing standings rows and unresolved historical scorers', () => {
    const historicalGame: Game = {
      ...reconciled.games[0],
      opponent: 'Missing Club',
      scorers: [{ playerName: 'Unknown Player', count: 2 }]
    };
    const report = check({
      games: [historicalGame],
      standings: reconciled.standings.filter(standing => standing.isUserTeam)
    });
    const codes = report.findings.map(item => item.code);

    expect(codes).toContain('STANDING_OPPONENT_MISSING');
    expect(codes).toContain('GAME_SCORER_NAME_AMBIGUOUS');
    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'STANDING_OPPONENT_MISSING',
        focusId: 'Missing Club',
        focusLabel: 'Missing Club'
      }),
      expect.objectContaining({
        code: 'GAME_SCORER_NAME_AMBIGUOUS',
        focusId: historicalGame.id,
        focusLabel: `${historicalGame.date} vs ${historicalGame.opponent}`
      })
    ]));
  });

  it('reports assist totals as informational when event data cannot verify them', () => {
    const withAssists = reconciled.players.map(player =>
      player.id === 'forward' ? { ...player, assists: 3 } : player
    );
    const report = check({ players: withAssists });

    expect(report.findings).toContainEqual(expect.objectContaining({
      code: 'PLAYER_ASSISTS_UNVERIFIABLE',
      severity: 'info'
    }));
    expect(report.isHealthy).toBe(true);
  });

  it('does not mutate games, players, or standings', () => {
    const input = {
      games: structuredClone(reconciled.games),
      players: structuredClone(reconciled.players),
      standings: structuredClone(reconciled.standings)
    };
    const before = structuredClone(input);

    check(input);

    expect(input).toEqual(before);
  });
});
