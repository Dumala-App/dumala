export type StrategyMatchState = 'balanced' | 'protect-lead' | 'chasing-goal';
export type StrategyMatchPhase = 'first-half' | 'second-half' | 'last-15';
export type StrategyTeamCondition = 'fresh' | 'normal' | 'tired';
export type StrategyOpponentBehavior =
  | 'balanced'
  | 'high-press'
  | 'low-block'
  | 'wide-overload'
  | 'direct-play'
  | 'strong-midfield';
export type StrategyRiskLevel = 'safe' | 'balanced' | 'aggressive';

export type StrategyContext = {
  matchState: StrategyMatchState;
  matchPhase: StrategyMatchPhase;
  teamCondition: StrategyTeamCondition;
  opponentBehavior: StrategyOpponentBehavior;
  riskLevel: StrategyRiskLevel;
};

export type StrategyContextFit = {
  matchState?: StrategyMatchState[];
  matchPhase?: StrategyMatchPhase[];
  teamCondition?: StrategyTeamCondition[];
  opponentBehavior?: StrategyOpponentBehavior[];
  riskLevel?: StrategyRiskLevel[];
  avoidWhen?: Partial<StrategyContext>[];
};

export const DEFAULT_STRATEGY_CONTEXT: StrategyContext = {
  matchState: 'balanced',
  matchPhase: 'first-half',
  teamCondition: 'normal',
  opponentBehavior: 'balanced',
  riskLevel: 'balanced'
};

export const STRATEGY_CONTEXT_LABELS = {
  matchState: {
    balanced: 'Balanced',
    'protect-lead': 'Protect lead',
    'chasing-goal': 'Chasing goal'
  },
  matchPhase: {
    'first-half': 'First half',
    'second-half': 'Second half',
    'last-15': 'Last 15'
  },
  teamCondition: {
    fresh: 'Fresh',
    normal: 'Normal',
    tired: 'Tired'
  },
  opponentBehavior: {
    balanced: 'Balanced',
    'high-press': 'High press',
    'low-block': 'Low block',
    'wide-overload': 'Wide overload',
    'direct-play': 'Direct play',
    'strong-midfield': 'Strong midfield'
  },
  riskLevel: {
    safe: 'Safe',
    balanced: 'Balanced',
    aggressive: 'Aggressive'
  }
} as const;

