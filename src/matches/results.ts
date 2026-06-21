import { sortStandings } from '../standings';
import type { Game, Player, Standing } from '../types';

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

const ATHLETE_POSITIONS = new Set(['Forward', 'Midfielder', 'Defender', 'Goalkeeper']);

const isCompetitiveGame = (game: Game | undefined): game is Game =>
  Boolean(
    game
    && game.status === 'Completed'
    && game.type !== 'Training'
    && game.type !== 'Meeting'
    && Number.isFinite(game.ourScore)
    && Number.isFinite(game.opponentScore)
  );

const isLeagueGame = (game: Game | undefined): game is Game =>
  isCompetitiveGame(game) && game.type === 'League';

const normalized = (value: string) => value.trim().toLocaleLowerCase();

const scorerGoalsForPlayer = (game: Game | undefined, player: Player, players: Player[]) => {
  if (!isCompetitiveGame(game)) return 0;

  return (game.scorers ?? []).reduce((total, scorer) => {
    if (scorer.playerId) return total + (scorer.playerId === player.id ? scorer.count : 0);

    const matchingPlayers = players.filter(candidate => normalized(candidate.name) === normalized(scorer.playerName));
    return total + (matchingPlayers.length === 1 && matchingPlayers[0].id === player.id ? scorer.count : 0);
  }, 0);
};

const playerContribution = (game: Game | undefined, player: Player, players: Player[]) => {
  if (!isCompetitiveGame(game) || !ATHLETE_POSITIONS.has(player.position)) {
    return { appearances: 0, goals: 0, cleanSheets: 0, mvpAwards: 0 };
  }
  const creditedPlayerIds = game.creditedPlayerIds;
  if (creditedPlayerIds && !creditedPlayerIds.includes(player.id)) {
    return { appearances: 0, goals: 0, cleanSheets: 0, mvpAwards: 0 };
  }

  return {
    appearances: 1,
    goals: scorerGoalsForPlayer(game, player, players),
    cleanSheets: game.opponentScore === 0 && (player.position === 'Defender' || player.position === 'Goalkeeper') ? 1 : 0,
    mvpAwards: game.mvpId === player.id ? 1 : 0
  };
};

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

const standingContribution = (
  game: Game | undefined,
  standing: Standing,
  teamName: string
) => {
  const empty = { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
  if (!isLeagueGame(game)) return empty;

  const isUserTeam = standing.isUserTeam || normalized(standing.teamName) === normalized(teamName);
  const isOpponent = normalized(standing.teamName) === normalized(game.opponent);
  if (!isUserTeam && !isOpponent) return empty;

  const goalsFor = isUserTeam ? game.ourScore! : game.opponentScore!;
  const goalsAgainst = isUserTeam ? game.opponentScore! : game.ourScore!;
  const won = goalsFor > goalsAgainst ? 1 : 0;
  const drawn = goalsFor === goalsAgainst ? 1 : 0;

  return {
    played: 1,
    won,
    drawn,
    lost: won || drawn ? 0 : 1,
    goalsFor,
    goalsAgainst,
    points: won ? 3 : drawn ? 1 : 0
  };
};

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
