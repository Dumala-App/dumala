import type { AssessmentSession, Game, Player } from '../types';

export type ActivationMilestoneId = 'roster' | 'schedule' | 'result' | 'assessment' | 'report';

// Structurally matches the `onNavigate` target used by DashboardView / HomeHubView
// so a milestone can deep-link straight into the relevant workspace view.
export interface ActivationNavTarget {
  primary: 'home' | 'squad' | 'tactics' | 'development' | 'league_updates';
  homeTab?: 'overview' | 'bulletins' | 'game_week';
  developmentTab?: 'assessments' | 'training' | 'assessment_guide';
}

export interface ActivationMilestoneDef {
  id: ActivationMilestoneId;
  title: string;
  hint: string;
  cta: string;
  navTarget: ActivationNavTarget;
}

// A healthy first-week roster is 8-12 players; used for encouraging copy only.
export const HEALTHY_ROSTER_MIN = 8;

export const ACTIVATION_MILESTONES: readonly ActivationMilestoneDef[] = [
  {
    id: 'roster',
    title: 'Add your squad',
    hint: 'Add 8-12 players so tactics, training, and assessments have a roster to work with.',
    cta: 'Go to Squad',
    navTarget: { primary: 'squad' }
  },
  {
    id: 'schedule',
    title: 'Schedule your next match',
    hint: 'Add one upcoming fixture to unlock match-week preparation and game plans.',
    cta: 'Open Game Week',
    navTarget: { primary: 'home', homeTab: 'game_week' }
  },
  {
    id: 'result',
    title: 'Log a match result',
    hint: 'Record a completed match to update standings and player stats.',
    cta: 'Open Game Week',
    navTarget: { primary: 'home', homeTab: 'game_week' }
  },
  {
    id: 'assessment',
    title: 'Run an FPRDS assessment',
    hint: 'Assess one player to generate role-weighted ratings and a development plan.',
    cta: 'Open Assessments',
    navTarget: { primary: 'development', developmentTab: 'assessments' }
  },
  {
    id: 'report',
    title: 'Download a player report',
    hint: 'Export a printable assessment and development report to share with a player.',
    cta: 'Open Assessments',
    navTarget: { primary: 'development', developmentTab: 'assessments' }
  }
] as const;

// Per-team map of milestone id -> ISO timestamp first reached.
export type ActivationFlags = Record<string, string>;

export interface ActivationMilestoneState extends ActivationMilestoneDef {
  done: boolean;
  reachedAt: string | null;
}

export interface ActivationState {
  milestones: ActivationMilestoneState[];
  activatedCount: number;
  total: number;
  isFullyActivated: boolean;
  rosterSize: number;
  hasHealthyRoster: boolean;
}

// Whether a milestone is currently satisfied. Four milestones derive from
// persisted workspace state; `report` is an action with no state trace, so it is
// driven entirely by the persisted activation flag written on download.
export const isActivationMilestoneReached = (
  id: ActivationMilestoneId,
  players: Player[],
  games: Game[],
  assessments: AssessmentSession[],
  flags: ActivationFlags
): boolean => {
  switch (id) {
    case 'roster':
      return players.length >= 1;
    case 'schedule':
      return games.some(game => game.status === 'Upcoming');
    case 'result':
      return games.some(game => game.status === 'Completed');
    case 'assessment':
      return assessments.length >= 1;
    case 'report':
      return Boolean(flags.report);
    default:
      return false;
  }
};

export const deriveActivationMilestones = (
  players: Player[],
  games: Game[],
  assessments: AssessmentSession[],
  flags: ActivationFlags = {}
): ActivationState => {
  const milestones: ActivationMilestoneState[] = ACTIVATION_MILESTONES.map(def => ({
    ...def,
    done: isActivationMilestoneReached(def.id, players, games, assessments, flags),
    reachedAt: flags[def.id] ?? null
  }));

  const activatedCount = milestones.filter(milestone => milestone.done).length;

  return {
    milestones,
    activatedCount,
    total: milestones.length,
    isFullyActivated: activatedCount === milestones.length,
    rosterSize: players.length,
    hasHealthyRoster: players.length >= HEALTHY_ROSTER_MIN
  };
};
