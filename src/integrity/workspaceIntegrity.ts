import type { Game, Player, Standing } from '../types';
import {
  ATHLETE_POSITIONS,
  emptyStandingContribution,
  isCompetitiveGame,
  isLeagueGame,
  normalizeMatchName,
  playerContribution,
  standingContribution,
  type PlayerMatchContribution,
  type StandingMatchContribution
} from '../matches/projections';

export type IntegritySeverity = 'info' | 'warning' | 'error';
export type IntegritySection = 'games' | 'standings' | 'players' | 'assessments';

export interface IntegrityFinding {
  code: string;
  severity: IntegritySeverity;
  section: IntegritySection;
  message: string;
  relatedIds: string[];
}

export interface WorkspaceIntegrityReport {
  checkedAt: string;
  findings: IntegrityFinding[];
  isHealthy: boolean;
}

export interface WorkspaceIntegrityInput {
  teamName: string;
  games: Game[];
  players: Player[];
  standings: Standing[];
}

const addStandingContribution = (
  total: StandingMatchContribution,
  contribution: StandingMatchContribution
): StandingMatchContribution => ({
  played: total.played + contribution.played,
  won: total.won + contribution.won,
  drawn: total.drawn + contribution.drawn,
  lost: total.lost + contribution.lost,
  goalsFor: total.goalsFor + contribution.goalsFor,
  goalsAgainst: total.goalsAgainst + contribution.goalsAgainst,
  points: total.points + contribution.points
});

const addPlayerContribution = (
  total: PlayerMatchContribution,
  contribution: PlayerMatchContribution
): PlayerMatchContribution => ({
  appearances: total.appearances + contribution.appearances,
  goals: total.goals + contribution.goals,
  cleanSheets: total.cleanSheets + contribution.cleanSheets,
  mvpAwards: total.mvpAwards + contribution.mvpAwards
});

const finding = (
  code: string,
  severity: IntegritySeverity,
  section: IntegritySection,
  message: string,
  relatedIds: string[]
): IntegrityFinding => ({ code, severity, section, message, relatedIds });

const projectStanding = (
  standing: Standing,
  games: Game[],
  teamName: string
): StandingMatchContribution => games.reduce(
  (total, game) => addStandingContribution(total, standingContribution(game, standing, teamName)),
  emptyStandingContribution()
);

const checkStanding = (
  standing: Standing,
  expected: StandingMatchContribution
): IntegrityFinding[] => {
  const findings: IntegrityFinding[] = [];
  const relatedIds = [standing.teamName];
  const fields: Array<keyof StandingMatchContribution> = [
    'played',
    'won',
    'drawn',
    'lost',
    'goalsFor',
    'goalsAgainst',
    'points'
  ];

  for (const field of fields) {
    if (standing[field] < expected[field]) {
      findings.push(finding(
        `STANDING_${field.toUpperCase()}_BELOW_MATCHES`,
        'error',
        'standings',
        `${standing.teamName} has less ${field} than completed league matches require.`,
        relatedIds
      ));
    }
  }

  const external = {
    played: standing.played - expected.played,
    won: standing.won - expected.won,
    drawn: standing.drawn - expected.drawn,
    lost: standing.lost - expected.lost,
    points: standing.points - expected.points
  };
  if (
    Object.values(external).every(value => value >= 0)
    && (
      external.played !== external.won + external.drawn + external.lost
      || external.points !== external.won * 3 + external.drawn
    )
  ) {
    findings.push(finding(
      'STANDING_EXTERNAL_TOTALS_INCONSISTENT',
      'warning',
      'standings',
      `${standing.teamName} has manual or external totals that do not reconcile with wins, draws, and losses.`,
      relatedIds
    ));
  }

  return findings;
};

const projectPlayer = (
  player: Player,
  games: Game[],
  players: Player[]
): PlayerMatchContribution => games.reduce(
  (total, game) => addPlayerContribution(total, playerContribution(game, player, players)),
  { appearances: 0, goals: 0, cleanSheets: 0, mvpAwards: 0 }
);

export const checkWorkspaceIntegrity = (
  input: WorkspaceIntegrityInput,
  checkedAt = new Date().toISOString()
): WorkspaceIntegrityReport => {
  const findings: IntegrityFinding[] = [];
  const completedLeagueGames = input.games.filter(isLeagueGame);
  const completedGames = input.games.filter(isCompetitiveGame);
  const userStanding = input.standings.find(standing =>
    standing.isUserTeam || normalizeMatchName(standing.teamName) === normalizeMatchName(input.teamName)
  );

  if (completedLeagueGames.length > 0 && !userStanding) {
    findings.push(finding(
      'STANDING_USER_TEAM_MISSING',
      'error',
      'standings',
      'Completed league matches exist, but the team is missing from league standings.',
      completedLeagueGames.map(game => game.id)
    ));
  }

  const standingNames = new Set(input.standings.map(standing => normalizeMatchName(standing.teamName)));
  for (const game of completedLeagueGames) {
    if (!standingNames.has(normalizeMatchName(game.opponent))) {
      findings.push(finding(
        'STANDING_OPPONENT_MISSING',
        'warning',
        'standings',
        `${game.opponent} is missing from standings for a completed league match.`,
        [game.id]
      ));
    }
  }

  for (const standing of input.standings) {
    findings.push(...checkStanding(
      standing,
      projectStanding(standing, completedLeagueGames, input.teamName)
    ));
  }

  const hasLegacyCredits = completedGames.some(game => !game.creditedPlayerIds);
  if (hasLegacyCredits) {
    findings.push(finding(
      'GAME_PLAYER_CREDITS_INCOMPLETE',
      'warning',
      'games',
      'Some completed matches predate player-credit tracking, so appearance totals cannot be verified safely.',
      completedGames.filter(game => !game.creditedPlayerIds).map(game => game.id)
    ));
  }

  for (const game of completedGames) {
    for (const scorer of game.scorers ?? []) {
      if (scorer.playerId && !input.players.some(player => player.id === scorer.playerId)) {
        findings.push(finding(
          'GAME_SCORER_PLAYER_MISSING',
          'warning',
          'games',
          `A scorer recorded for ${game.opponent} no longer matches a roster player.`,
          [game.id, scorer.playerId]
        ));
      }
      if (!scorer.playerId) {
        const matches = input.players.filter(
          player => normalizeMatchName(player.name) === normalizeMatchName(scorer.playerName)
        );
        if (matches.length !== 1) {
          findings.push(finding(
            'GAME_SCORER_NAME_AMBIGUOUS',
            'warning',
            'games',
            `A scorer recorded for ${game.opponent} cannot be matched uniquely to the roster.`,
            [game.id]
          ));
        }
      }
    }
  }

  for (const player of input.players.filter(player => ATHLETE_POSITIONS.has(player.position))) {
    const expected = projectPlayer(player, completedGames, input.players);

    if (!hasLegacyCredits && player.gamesPlayed !== expected.appearances) {
      findings.push(finding(
        'PLAYER_APPEARANCES_MISMATCH',
        'error',
        'players',
        `${player.name}'s appearances do not match completed match credits.`,
        [player.id]
      ));
    }
    if (player.points !== expected.goals) {
      findings.push(finding(
        'PLAYER_GOALS_MISMATCH',
        'error',
        'players',
        `${player.name}'s goals do not match recorded scorers.`,
        [player.id]
      ));
    }
    if (!hasLegacyCredits && player.cleanSheetsOrRebounds !== expected.cleanSheets) {
      findings.push(finding(
        'PLAYER_CLEAN_SHEETS_MISMATCH',
        'warning',
        'players',
        `${player.name}'s clean sheets do not match completed match credits.`,
        [player.id]
      ));
    }
    if (!hasLegacyCredits && player.mvpAwards !== expected.mvpAwards) {
      findings.push(finding(
        'PLAYER_MVP_MISMATCH',
        'warning',
        'players',
        `${player.name}'s MVP total does not match completed matches.`,
        [player.id]
      ));
    }
    if (player.assists > 0) {
      findings.push(finding(
        'PLAYER_ASSISTS_UNVERIFIABLE',
        'info',
        'players',
        `${player.name}'s assists cannot be verified because match assist events are not stored yet.`,
        [player.id]
      ));
    }
  }

  return {
    checkedAt,
    findings,
    isHealthy: findings.every(item => item.severity === 'info')
  };
};

export const getActionableIntegrityFindings = (
  report: WorkspaceIntegrityReport
): IntegrityFinding[] => report.findings.filter(
  item => item.severity === 'warning' || item.severity === 'error'
);

export const getIntegritySignature = (report: WorkspaceIntegrityReport): string =>
  getActionableIntegrityFindings(report)
    .map(item => `${item.code}:${item.relatedIds.join(',')}`)
    .sort()
    .join('|');
