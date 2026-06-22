import { sortStandings } from '../standings';
import type { Game, Player, Standing } from '../types';
import {
  ATHLETE_POSITIONS,
  playerContribution,
  standingContribution
} from './projections';

export interface MatchResultInput {
  ourScore: number;
  opponentScore: number;
  mvpId: string;
  notes: string;
  scorers: NonNullable<Game['scorers']>;
}

interface MatchState {
  games: Game[];
  players: Player[];
  standings: Standing[];
}

interface MatchStateInput extends MatchState {
  gameId: string;
  teamName: string;
}

const reconcilePlayers = (players: Player[], previousGame?: Game, nextGame?: Game) =>
  players.map(player => {
    const previous = playerContribution(previousGame, player, players);
    const next = playerContribution(nextGame, player, players);

    return {
      ...player,
      gamesPlayed: Math.max(0, player.gamesPlayed - previous.appearances + next.appearances),
      points: Math.max(0, player.points - previous.goals + next.goals),
      cleanSheetsOrRebounds: Math.max(
        0,
        player.cleanSheetsOrRebounds - previous.cleanSheets + next.cleanSheets
      ),
      mvpAwards: Math.max(0, player.mvpAwards - previous.mvpAwards + next.mvpAwards)
    };
  });

const reconcileStandings = (
  standings: Standing[],
  teamName: string,
  previousGame?: Game,
  nextGame?: Game
) => sortStandings(standings.map(standing => {
  const previous = standingContribution(previousGame, standing, teamName);
  const next = standingContribution(nextGame, standing, teamName);

  return {
    ...standing,
    played: Math.max(0, standing.played - previous.played + next.played),
    won: Math.max(0, standing.won - previous.won + next.won),
    drawn: Math.max(0, standing.drawn - previous.drawn + next.drawn),
    lost: Math.max(0, standing.lost - previous.lost + next.lost),
    goalsFor: Math.max(0, standing.goalsFor - previous.goalsFor + next.goalsFor),
    goalsAgainst: Math.max(0, standing.goalsAgainst - previous.goalsAgainst + next.goalsAgainst),
    points: Math.max(0, standing.points - previous.points + next.points)
  };
}));

export const validateMatchResult = (
  game: Game,
  result: MatchResultInput,
  players: Player[]
) => {
  if (game.type === 'Training' || game.type === 'Meeting') {
    throw new Error('Training sessions and meetings cannot have match results.');
  }
  if (!Number.isInteger(result.ourScore) || result.ourScore < 0
    || !Number.isInteger(result.opponentScore) || result.opponentScore < 0) {
    throw new Error('Scores must be whole numbers of zero or greater.');
  }

  const eligiblePlayers = new Map(
    players
      .filter(player => ATHLETE_POSITIONS.has(player.position) && player.registrationStatus === 'Active')
      .map(player => [player.id, player])
  );
  if (!eligiblePlayers.has(result.mvpId)) {
    throw new Error('Select an active athlete as the match MVP.');
  }

  const scorerIds = new Set<string>();
  let recordedGoals = 0;
  for (const scorer of result.scorers) {
    if (!Number.isInteger(scorer.count) || scorer.count <= 0) {
      throw new Error('Scorer goal counts must be positive whole numbers.');
    }
    if (!scorer.playerId || !eligiblePlayers.has(scorer.playerId)) {
      throw new Error('Every scorer must reference an active athlete.');
    }
    if (scorerIds.has(scorer.playerId)) {
      throw new Error('Each scorer can only appear once in the scorecard.');
    }
    scorerIds.add(scorer.playerId);
    recordedGoals += scorer.count;
  }

  if (recordedGoals > result.ourScore) {
    throw new Error('Recorded scorer goals cannot exceed the team score.');
  }
};

export const recordMatchResult = (
  input: MatchStateInput,
  result: MatchResultInput
): MatchState => {
  const previousGame = input.games.find(game => game.id === input.gameId);
  if (!previousGame) throw new Error('The selected match could not be found.');
  validateMatchResult(previousGame, result, input.players);

  const nextGame: Game = {
    ...previousGame,
    status: 'Completed',
    ourScore: result.ourScore,
    opponentScore: result.opponentScore,
    mvpId: result.mvpId,
    notes: result.notes,
    scorers: result.scorers,
    creditedPlayerIds: previousGame.status === 'Completed'
      ? previousGame.creditedPlayerIds
        ?? input.players.filter(player => ATHLETE_POSITIONS.has(player.position)).map(player => player.id)
      : input.players
        .filter(player => ATHLETE_POSITIONS.has(player.position) && player.registrationStatus === 'Active')
        .map(player => player.id)
  };

  return {
    games: input.games.map(game => game.id === input.gameId ? nextGame : game),
    players: reconcilePlayers(input.players, previousGame, nextGame),
    standings: reconcileStandings(input.standings, input.teamName, previousGame, nextGame)
  };
};

export const deleteGameAndReconcile = (input: MatchStateInput): MatchState => {
  const previousGame = input.games.find(game => game.id === input.gameId);
  if (!previousGame) return {
    games: input.games,
    players: input.players,
    standings: input.standings
  };

  return {
    games: input.games.filter(game => game.id !== input.gameId),
    players: reconcilePlayers(input.players, previousGame),
    standings: reconcileStandings(input.standings, input.teamName, previousGame)
  };
};
