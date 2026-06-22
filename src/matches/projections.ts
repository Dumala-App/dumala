import type { Game, Player, Standing } from '../types';

export const ATHLETE_POSITIONS = new Set(['Forward', 'Midfielder', 'Defender', 'Goalkeeper']);

export const isCompetitiveGame = (game: Game | undefined): game is Game =>
  Boolean(
    game
    && game.status === 'Completed'
    && game.type !== 'Training'
    && game.type !== 'Meeting'
    && Number.isFinite(game.ourScore)
    && Number.isFinite(game.opponentScore)
  );

export const isLeagueGame = (game: Game | undefined): game is Game =>
  isCompetitiveGame(game) && game.type === 'League';

export const normalizeMatchName = (value: string): string =>
  value.trim().toLocaleLowerCase();

export interface PlayerMatchContribution {
  appearances: number;
  goals: number;
  cleanSheets: number;
  mvpAwards: number;
}

export const scorerGoalsForPlayer = (
  game: Game | undefined,
  player: Player,
  players: Player[]
): number => {
  if (!isCompetitiveGame(game)) return 0;

  return (game.scorers ?? []).reduce((total, scorer) => {
    if (scorer.playerId) return total + (scorer.playerId === player.id ? scorer.count : 0);

    const matchingPlayers = players.filter(
      candidate => normalizeMatchName(candidate.name) === normalizeMatchName(scorer.playerName)
    );
    return total + (matchingPlayers.length === 1 && matchingPlayers[0].id === player.id ? scorer.count : 0);
  }, 0);
};

export const playerContribution = (
  game: Game | undefined,
  player: Player,
  players: Player[]
): PlayerMatchContribution => {
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

export interface StandingMatchContribution {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export const emptyStandingContribution = (): StandingMatchContribution => ({
  played: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  points: 0
});

export const standingContribution = (
  game: Game | undefined,
  standing: Standing,
  teamName: string
): StandingMatchContribution => {
  const empty = emptyStandingContribution();
  if (!isLeagueGame(game)) return empty;

  const isUserTeam = standing.isUserTeam
    || normalizeMatchName(standing.teamName) === normalizeMatchName(teamName);
  const isOpponent = normalizeMatchName(standing.teamName) === normalizeMatchName(game.opponent);
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
