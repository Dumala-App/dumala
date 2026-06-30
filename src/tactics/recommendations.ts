import { ATTACK_STRATEGY_CARDS, DEFENSE_STRATEGY_CARDS, type TacticalStrategyCard } from './strategyLibrary';
import type { MatchFormat } from './formations';
import { DEFAULT_STRATEGY_CONTEXT, STRATEGY_CONTEXT_LABELS, type StrategyContext } from './strategyContext';

export type FormationTraits = {
  formation: string;
  rows: number[];
  defenders: number;
  midfielders: number;
  forwards: number;
  hasBackThree: boolean;
  hasBackFive: boolean;
  hasWingbacks: boolean;
  hasFrontThree: boolean;
  hasFrontTwo: boolean;
  hasSinglePivot: boolean;
  hasDoublePivot: boolean;
  hasCentralOverload: boolean;
  hasNarrowDiamond: boolean;
  hasWideForwards: boolean;
  widthScore: number;
  pressureScore: number;
};

export type MatchupRecommendation = {
  our: FormationTraits;
  opponent: FormationTraits;
  recommendedAttack: TacticalStrategyCard;
  recommendedDefense: TacticalStrategyCard;
  attackScores: RankedStrategyCard[];
  defenseScores: RankedStrategyCard[];
  context: StrategyContext;
  contextReasons: StrategyScoreReason[];
  opponentThreats: string[];
  exploitableSpaces: string[];
  playerInstructions: string[];
  shapeImpactSummary: ShapeImpactCard[];
  comparisonInsights: Array<{ label: string; value: string }>;
  explanation: string;
};

export type StrategyScoreReason = {
  label: string;
  value: string;
  tone: 'positive' | 'warning' | 'neutral';
};

export type RankedStrategyCard = {
  card: TacticalStrategyCard;
  score: number;
  reasons: StrategyScoreReason[];
};

export type ShapeImpactCard = {
  id: string;
  label: string;
  value: string;
  note: string;
  tone: 'amber' | 'sky' | 'emerald' | 'rose';
};

const parseFormationRows = (formation: string): number[] => (
  formation
    .split('-')
    .map(part => Number.parseInt(part, 10))
    .filter(value => Number.isFinite(value) && value >= 0)
);

export const analyzeFormation = (formation: string): FormationTraits => {
  const rows = parseFormationRows(formation);
  const defenders = rows[0] ?? 0;
  const forwards = rows[rows.length - 1] ?? 0;
  const midfieldRows = rows.slice(1, -1);
  const midfielders = midfieldRows.reduce((sum, value) => sum + value, 0);
  const hasBackThree = defenders === 3;
  const hasBackFive = defenders >= 5;
  const hasWingbacks = hasBackThree || hasBackFive;
  const hasFrontThree = forwards >= 3;
  const hasFrontTwo = forwards === 2;
  const hasSinglePivot = midfieldRows[0] === 1;
  const hasDoublePivot = midfieldRows[0] === 2;
  const hasCentralOverload = midfielders >= 5 || formation === '4-3-1-2';
  const hasNarrowDiamond = formation === '4-3-1-2' || formation === '4-1-2-3';
  const hasWideForwards = hasFrontThree || formation === '3-4-3';
  const widthScore = (hasWideForwards ? 2 : 0) + (hasWingbacks ? 2 : 0) + (defenders === 4 ? 1 : 0);
  const pressureScore = (hasFrontThree ? 3 : 0) + (hasFrontTwo ? 2 : 0) + (hasCentralOverload ? 1 : 0);

  return {
    formation,
    rows,
    defenders,
    midfielders,
    forwards,
    hasBackThree,
    hasBackFive,
    hasWingbacks,
    hasFrontThree,
    hasFrontTwo,
    hasSinglePivot,
    hasDoublePivot,
    hasCentralOverload,
    hasNarrowDiamond,
    hasWideForwards,
    widthScore,
    pressureScore
  };
};

const tagsForOurFormation = (traits: FormationTraits): string[] => [
  traits.hasFrontThree ? 'front-three' : '',
  traits.hasFrontTwo ? 'two-striker' : '',
  traits.hasCentralOverload ? 'midfield-overload' : '',
  traits.hasSinglePivot ? 'single-pivot' : '',
  traits.hasDoublePivot ? 'double-pivot' : '',
  traits.hasWingbacks ? 'wing-width' : '',
  traits.widthScore >= 3 ? 'fullback-overlap' : '',
  traits.defenders >= 5 ? 'back-five' : '',
  traits.defenders >= 5 || traits.midfielders >= 4 ? 'compact-block' : '',
  traits.pressureScore >= 3 ? 'compact-lines' : '',
  traits.forwards >= 1 ? 'direct-outlet' : ''
].filter(Boolean);

const tagsForOpponentFormation = (traits: FormationTraits): string[] => [
  traits.hasWingbacks ? 'wingback-space' : '',
  traits.hasBackThree ? 'back-three' : '',
  traits.hasBackFive ? 'back-five' : '',
  traits.hasFrontThree ? 'front-three-press' : '',
  traits.hasFrontTwo ? 'front-two' : '',
  traits.hasFrontTwo ? 'front-two-screen' : '',
  traits.hasSinglePivot ? 'single-pivot' : '',
  traits.hasCentralOverload ? 'central-overload' : '',
  traits.hasCentralOverload ? 'playmaker-pocket' : '',
  traits.hasNarrowDiamond ? 'narrow-diamond' : '',
  traits.widthScore >= 4 ? 'wide-overload' : '',
  traits.hasFrontThree || traits.pressureScore >= 5 ? 'high-press' : '',
  !traits.hasWideForwards && traits.midfielders >= 4 ? 'narrow-midfield' : '',
  traits.hasBackFive && traits.forwards <= 1 ? 'low-block' : '',
  traits.defenders >= 4 && traits.forwards <= 1 ? 'slow-build-up' : '',
  traits.defenders >= 4 ? 'pace-behind' : '',
  traits.midfielders >= 4 ? 'midfield-congestion' : ''
].filter(Boolean);

const scoreCard = (card: TacticalStrategyCard, ourTags: string[], opponentTags: string[]) => (
  card.formationFit.reduce((score, tag) => score + (ourTags.includes(tag) ? 3 : 0), 0)
  + card.opponentCounters.reduce((score, tag) => score + (opponentTags.includes(tag) ? 4 : 0), 0)
  + card.tags.reduce((score, tag) => score + (ourTags.includes(tag) || opponentTags.includes(tag) ? 1 : 0), 0)
);

const isDefaultStrategyContext = (context: StrategyContext) => (
  context.matchState === DEFAULT_STRATEGY_CONTEXT.matchState
  && context.matchPhase === DEFAULT_STRATEGY_CONTEXT.matchPhase
  && context.teamCondition === DEFAULT_STRATEGY_CONTEXT.teamCondition
  && context.opponentBehavior === DEFAULT_STRATEGY_CONTEXT.opponentBehavior
  && context.riskLevel === DEFAULT_STRATEGY_CONTEXT.riskLevel
);

const contextPartMatches = <K extends keyof StrategyContext>(
  context: StrategyContext,
  key: K,
  expected: StrategyContext[K] | undefined
) => expected === undefined || context[key] === expected;

const contextAvoidMatches = (context: StrategyContext, avoidWhen: Partial<StrategyContext>) => (
  contextPartMatches(context, 'matchState', avoidWhen.matchState)
  && contextPartMatches(context, 'matchPhase', avoidWhen.matchPhase)
  && contextPartMatches(context, 'teamCondition', avoidWhen.teamCondition)
  && contextPartMatches(context, 'opponentBehavior', avoidWhen.opponentBehavior)
  && contextPartMatches(context, 'riskLevel', avoidWhen.riskLevel)
);

const makeContextReason = (
  label: string,
  value: string,
  tone: StrategyScoreReason['tone'] = 'positive'
): StrategyScoreReason => ({ label, value, tone });

const scoreContextFit = (
  card: TacticalStrategyCard,
  context: StrategyContext,
  enabled: boolean
): { score: number; reasons: StrategyScoreReason[] } => {
  if (!enabled || !card.contextFit) return { score: 0, reasons: [] };

  let score = 0;
  const reasons: StrategyScoreReason[] = [];
  const fit = card.contextFit;

  if (fit.matchState?.includes(context.matchState)) {
    score += 5;
    reasons.push(makeContextReason('Match state', `Fits ${STRATEGY_CONTEXT_LABELS.matchState[context.matchState].toLowerCase()}.`));
  }
  if (fit.opponentBehavior?.includes(context.opponentBehavior)) {
    score += 5;
    reasons.push(makeContextReason('Opponent behavior', `Answers ${STRATEGY_CONTEXT_LABELS.opponentBehavior[context.opponentBehavior].toLowerCase()}.`));
  }
  if (fit.teamCondition?.includes(context.teamCondition)) {
    score += 3;
    reasons.push(makeContextReason('Team condition', `Suitable for a ${STRATEGY_CONTEXT_LABELS.teamCondition[context.teamCondition].toLowerCase()} team.`));
  }
  if (fit.riskLevel?.includes(context.riskLevel)) {
    score += 3;
    reasons.push(makeContextReason('Risk', `Matches ${STRATEGY_CONTEXT_LABELS.riskLevel[context.riskLevel].toLowerCase()} risk.`));
  }
  if (fit.matchPhase?.includes(context.matchPhase)) {
    score += 2;
    reasons.push(makeContextReason('Phase', `Useful in the ${STRATEGY_CONTEXT_LABELS.matchPhase[context.matchPhase].toLowerCase()}.`));
  }

  const avoidMatch = fit.avoidWhen?.find(item => contextAvoidMatches(context, item));
  if (avoidMatch) {
    score -= 6;
    reasons.push(makeContextReason('Warning', 'Context makes this plan riskier than usual.', 'warning'));
  }

  return { score, reasons };
};

const getTopContextReasons = (
  attack: RankedStrategyCard | undefined,
  defense: RankedStrategyCard | undefined
): StrategyScoreReason[] => {
  const reasons = [
    ...(attack?.reasons ?? []),
    ...(defense?.reasons ?? [])
  ];
  const ordered = [
    ...reasons.filter(reason => reason.tone === 'warning'),
    ...reasons.filter(reason => reason.tone !== 'warning')
  ];
  const seen = new Set<string>();
  const unique: StrategyScoreReason[] = [];

  for (const reason of ordered) {
    const key = reason.label;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(reason);
    if (unique.length >= 3) break;
  }

  return unique;
};

const rankCards = (
  cards: readonly TacticalStrategyCard[],
  our: FormationTraits,
  opponent: FormationTraits,
  context: StrategyContext,
  useContext: boolean
): RankedStrategyCard[] => {
  const ourTags = tagsForOurFormation(our);
  const opponentTags = tagsForOpponentFormation(opponent);
  return cards
    .filter(card => card.status !== 'draft')
    .map(card => {
      const contextScore = scoreContextFit(card, context, useContext);
      return {
        card,
        score: scoreCard(card, ourTags, opponentTags) + contextScore.score,
        reasons: contextScore.reasons
      };
    })
    .sort((a, b) => b.score - a.score || a.card.title.localeCompare(b.card.title));
};

export const buildOpponentThreats = (opponent: FormationTraits): string[] => {
  const threats: string[] = [];
  if (opponent.hasWingbacks) threats.push('Wingbacks can overload wide channels and arrive late beyond your fullbacks.');
  if (opponent.hasCentralOverload) threats.push('Central midfield numbers can crowd your build-up and second-ball zones.');
  if (opponent.hasFrontThree) threats.push('A front three can press your back line and isolate slow circulation.');
  if (opponent.hasFrontTwo) threats.push('Two forwards can pin center backs and attack early direct passes.');
  if (opponent.hasBackFive) threats.push('A back five protects the box and can force low-quality crosses.');
  return threats.length > 0 ? threats : ['Opponent shape is balanced, so focus on execution triggers rather than one obvious mismatch.'];
};

export const buildExploitableSpaces = (opponent: FormationTraits): string[] => {
  const spaces: string[] = [];
  if (opponent.hasWingbacks) spaces.push('Space behind wingbacks after switches or early forward passes.');
  if (opponent.hasBackFive) spaces.push('Cutback lanes at the edge of the box before their back five settles.');
  if (opponent.hasFrontTwo) spaces.push('The far-side fullback lane if your pivot can switch play quickly.');
  if (opponent.hasFrontThree) spaces.push('Space behind the first press if your first pass breaks the front line.');
  if (opponent.hasNarrowDiamond) spaces.push('Wide isolation zones outside their narrow midfield diamond.');
  return spaces.length > 0 ? spaces : ['Look for the weak-side channel after drawing pressure to one side.'];
};

const buildPlayerInstructions = (
  attack: TacticalStrategyCard,
  defense: TacticalStrategyCard,
  opponent: FormationTraits
): string[] => [
  ...attack.cues.slice(0, 2).map(cue => `Attack: ${cue}.`),
  ...defense.cues.slice(0, 2).map(cue => `Defense: ${cue}.`),
  opponent.hasWingbacks
    ? 'Transition: nearest wide player tracks the wingback until the fullback can take over.'
    : 'Transition: closest midfielder protects the central counter lane after attacks.'
];

const describeShape = (traits: FormationTraits): string => {
  const width = traits.hasWingbacks
    ? 'wingback width'
    : traits.hasWideForwards
      ? 'wide forward threat'
      : 'narrower attacking width';
  const midfield = traits.hasCentralOverload
    ? `${traits.midfielders}-player midfield overload`
    : `${traits.midfielders}-player midfield`;
  const frontLine = traits.hasFrontThree
    ? 'front-three pressure'
    : traits.hasFrontTwo
      ? 'two-forward pressure'
      : 'single-forward reference point';

  return `${traits.defenders}-player back line, ${midfield}, ${width}, ${frontLine}.`;
};

const buildComparisonInsights = (
  ourFormation: string,
  opponentFormation: string,
  matchFormat: MatchFormat,
  our: FormationTraits,
  opponent: FormationTraits,
  attack: TacticalStrategyCard,
  defense: TacticalStrategyCard,
  opponentThreats: string[],
  exploitableSpaces: string[],
  playerInstructions: string[]
) => [
  {
    label: 'Shape read',
    value: `${ourFormation} vs ${opponentFormation} in ${matchFormat}: our ${describeShape(our)} Opponent shows ${describeShape(opponent)}`
  },
  {
    label: 'Attack logic',
    value: `${attack.title} is recommended because the clearest attacking window is ${exploitableSpaces[0].toLowerCase()}`
  },
  {
    label: 'Defensive logic',
    value: `${defense.title} is recommended to control the main danger: ${opponentThreats[0].toLowerCase()}`
  },
  {
    label: 'Coach priority',
    value: playerInstructions[0]
  }
];

const describeOurStructure = (our: FormationTraits): string => {
  if (our.hasBackFive) return 'Box protection';
  if (our.hasBackThree) return 'Wingback release';
  if (our.hasCentralOverload) return 'Central numbers';
  if (our.hasFrontThree) return 'Wide front line';
  if (our.hasFrontTwo) return 'Two-forward outlet';
  return 'Balanced shape';
};

const describeFormatLens = (matchFormat: MatchFormat): string => {
  if (matchFormat === '11-a-side') return 'Full pitch';
  if (matchFormat === '9-a-side' || matchFormat === '8-a-side') return 'Medium-sided';
  return 'Small-sided';
};

const buildFormatNote = (matchFormat: MatchFormat, our: FormationTraits): string => {
  if (matchFormat === '11-a-side') {
    return our.hasWingbacks
      ? 'Keep far-side cover when wingbacks step high.'
      : 'Manage distances between back line, midfield, and forwards.';
  }

  if (matchFormat === '9-a-side' || matchFormat === '8-a-side') {
    return our.hasCentralOverload
      ? 'Use the extra midfielder to create clean support angles.'
      : 'Rotations must be quick because lines collapse faster.';
  }

  return 'Prioritize simple triggers, fast support, and immediate rest-defense.';
};

const describeOpponentProblem = (opponent: FormationTraits): string => {
  if (opponent.hasWingbacks) return 'Wingback width';
  if (opponent.hasCentralOverload) return 'Central crowd';
  if (opponent.hasFrontThree) return 'Front press';
  if (opponent.hasFrontTwo) return 'Two-striker pin';
  if (opponent.hasBackFive) return 'Deep box cover';
  return 'Balanced block';
};

const describeOurShapeNote = (our: FormationTraits, opponent: FormationTraits): string => {
  if (our.hasBackFive) return 'Protect the box first, then release the nearest wide outlet.';
  if (our.hasBackThree) return 'Wingbacks create width, but recovery runs must be assigned.';
  if (our.hasCentralOverload && !opponent.hasCentralOverload) return 'Use midfield numbers before switching into the free side.';
  if (our.hasWideForwards) return 'Pin their fullbacks and attack the weak-side channel early.';
  if (our.hasFrontTwo) return 'Stagger the forwards so one pins and one receives between lines.';
  return 'Keep compact distances so the shape can attack and recover together.';
};

const buildShapeImpactSummary = ({
  matchFormat,
  our,
  opponent,
  attack,
  defense,
  opponentThreats,
  exploitableSpaces,
  playerInstructions
}: {
  matchFormat: MatchFormat;
  our: FormationTraits;
  opponent: FormationTraits;
  attack: TacticalStrategyCard;
  defense: TacticalStrategyCard;
  opponentThreats: string[];
  exploitableSpaces: string[];
  playerInstructions: string[];
}): ShapeImpactCard[] => [
  {
    id: 'our-shape',
    label: 'Our shape',
    value: describeOurStructure(our),
    note: describeOurShapeNote(our, opponent),
    tone: 'amber'
  },
  {
    id: 'format-lens',
    label: 'Format lens',
    value: describeFormatLens(matchFormat),
    note: buildFormatNote(matchFormat, our),
    tone: 'sky'
  },
  {
    id: 'opponent-problem',
    label: 'Opponent problem',
    value: describeOpponentProblem(opponent),
    note: opponentThreats[0],
    tone: 'rose'
  },
  {
    id: 'first-action',
    label: 'First action',
    value: attack.title,
    note: `${exploitableSpaces[0]} ${playerInstructions[0] ?? defense.cues[0]}.`,
    tone: 'emerald'
  }
];

export const recommendMatchupStrategy = ({
  ourFormation,
  opponentFormation,
  matchFormat,
  context = DEFAULT_STRATEGY_CONTEXT
}: {
  ourFormation: string;
  opponentFormation: string;
  matchFormat: MatchFormat;
  context?: StrategyContext;
}): MatchupRecommendation => {
  const our = analyzeFormation(ourFormation);
  const opponent = analyzeFormation(opponentFormation);
  const useContext = !isDefaultStrategyContext(context);
  const attackScores = rankCards(ATTACK_STRATEGY_CARDS, our, opponent, context, useContext);
  const defenseScores = rankCards(DEFENSE_STRATEGY_CARDS, our, opponent, context, useContext);
  const recommendedAttack = attackScores[0]?.card ?? ATTACK_STRATEGY_CARDS[0];
  const recommendedDefense = defenseScores[0]?.card ?? DEFENSE_STRATEGY_CARDS[0];
  const contextReasons = getTopContextReasons(attackScores[0], defenseScores[0]);
  const opponentThreats = buildOpponentThreats(opponent);
  const exploitableSpaces = buildExploitableSpaces(opponent);
  const playerInstructions = buildPlayerInstructions(recommendedAttack, recommendedDefense, opponent);
  const shapeImpactSummary = buildShapeImpactSummary({
    matchFormat,
    our,
    opponent,
    attack: recommendedAttack,
    defense: recommendedDefense,
    opponentThreats,
    exploitableSpaces,
    playerInstructions
  });
  const comparisonInsights = buildComparisonInsights(
    ourFormation,
    opponentFormation,
    matchFormat,
    our,
    opponent,
    recommendedAttack,
    recommendedDefense,
    opponentThreats,
    exploitableSpaces,
    playerInstructions
  );

  return {
    our,
    opponent,
    recommendedAttack,
    recommendedDefense,
    attackScores,
    defenseScores,
    context,
    contextReasons,
    opponentThreats,
    exploitableSpaces,
    playerInstructions,
    shapeImpactSummary,
    comparisonInsights,
    explanation: comparisonInsights.map(insight => `${insight.label}: ${insight.value}`).join(' ')
  };
};
