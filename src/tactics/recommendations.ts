import { ATTACK_STRATEGY_CARDS, DEFENSE_STRATEGY_CARDS, type TacticalStrategyCard } from './strategyLibrary';
import type { MatchFormat } from './formations';
import {
  DEFAULT_STRATEGY_CONTEXT,
  STRATEGY_CONTEXT_LABELS,
  type StrategyContext,
  type StrategyRiskLevel
} from './strategyContext';
import { findCoachModelById, type CoachModel } from './knowledge/coachModels';

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
  pairCoherence: PairCoherence;
  coachLens: CoachLensSummary | null;
  alternatives: { attack: PhaseAlternatives; defense: PhaseAlternatives };
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

export type PairCoherence = {
  status: 'coherent' | 'adjusted' | 'tension';
  note?: string;
};

export type CoachLensFitStatus = 'unset' | 'aligned' | 'partial' | 'diverged';

export type CoachLensDivergence = {
  key: keyof StrategyContext;
  label: string;
  expected: string;
  actual: string;
};

export type CoachLensFit = {
  status: CoachLensFitStatus;
  /** Multiplier applied to the lens contribution before the cap is enforced. */
  weight: number;
  matched: string[];
  diverged: CoachLensDivergence[];
  note?: string;
};

export type CoachLensSummary = {
  id: string;
  coachName: string;
  modelName: string;
  fit: CoachLensFit;
};

/**
 * Why an alternative is worth showing. `safe` and `aggressive` give the coach
 * the two directions they can move from the recommendation; `lens-demoted`
 * names the plan the engine would have picked without the active coach lens,
 * so a lens never quietly buries the default answer.
 */
export type StrategyAlternativeKind = 'safe' | 'aggressive' | 'lens-demoted';

export type StrategyAlternative = {
  kind: StrategyAlternativeKind;
  card: TacticalStrategyCard;
  score: number;
  /** Points behind the recommended plan. Zero means it is level on score. */
  scoreGap: number;
  rationale: string;
};

export type PhaseAlternatives = {
  phase: 'attack' | 'defense';
  safe: StrategyAlternative | null;
  aggressive: StrategyAlternative | null;
  lensDemoted: StrategyAlternative | null;
};

export type CurrentPlanVerdict = 'top-pick' | 'solid' | 'off-context' | 'risky';

export type CurrentPlanCheck = {
  phase: 'attack' | 'defense';
  title: string;
  verdict: CurrentPlanVerdict;
  note: string;
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

/**
 * Penalty for a plan the match format structurally rules out. Kept above
 * LENS_MAX_CONTRIBUTION so no coach lens can promote an unrunnable plan.
 */
export const FORMAT_EXCLUSION_PENALTY = 8;

const SMALL_SIDED_FORMATS: readonly MatchFormat[] = ['7-a-side', '6-a-side', '5-a-side'];
const MEDIUM_SIDED_FORMATS: readonly MatchFormat[] = ['9-a-side', '8-a-side'];

const scoreFormatFit = (
  card: TacticalStrategyCard,
  matchFormat: MatchFormat
): { score: number; reasons: StrategyScoreReason[] } => {
  if (card.formatAvoid?.includes(matchFormat)) {
    return {
      score: -FORMAT_EXCLUSION_PENALTY,
      reasons: [makeContextReason('Format', `Hard to run in ${matchFormat}: the structure this plan needs does not exist at this size.`, 'warning')]
    };
  }

  if (SMALL_SIDED_FORMATS.includes(matchFormat)) {
    if (card.complexity === 'complex') {
      return {
        score: -4,
        reasons: [makeContextReason('Format', `Complex structure is hard to coordinate in ${matchFormat}.`, 'warning')]
      };
    }
    if (card.complexity === 'simple') {
      return {
        score: 2,
        reasons: [makeContextReason('Format', `Simple triggers work well in ${matchFormat}.`)]
      };
    }
    return { score: 0, reasons: [] };
  }

  if (MEDIUM_SIDED_FORMATS.includes(matchFormat) && card.complexity === 'complex') {
    return {
      score: -2,
      reasons: [makeContextReason('Format', `Needs simplified roles to work in ${matchFormat}.`, 'warning')]
    };
  }

  return { score: 0, reasons: [] };
};

/**
 * Hard ceiling on how far a coach lens can move any single card. The engine's
 * own signals stay decisive: a format hard-exclusion is -8, so a lens can never
 * rescue a plan the match format rules out, and matchup scoring keeps its
 * weight. The lens colors the ranking, it does not take it over.
 */
export const LENS_MAX_CONTRIBUTION = 6;

const LENS_FIT_WEIGHTS: Record<CoachLensFitStatus, number> = {
  unset: 1,
  aligned: 1,
  partial: 0.6,
  diverged: 0.3
};

const CONTEXT_KEY_LABELS: Record<keyof StrategyContext, string> = {
  matchState: 'Match state',
  matchPhase: 'Phase',
  teamCondition: 'Team condition',
  opponentBehavior: 'Opponent behavior',
  riskLevel: 'Risk'
};

const contextValueLabel = <K extends keyof StrategyContext>(key: K, value: StrategyContext[K]): string => (
  (STRATEGY_CONTEXT_LABELS[key] as Record<string, string>)[value] ?? String(value)
);

const NEUTRAL_LENS_FIT: CoachLensFit = { status: 'unset', weight: 1, matched: [], diverged: [] };

export const LENS_WEIGHT_SUMMARY: Record<CoachLensFitStatus, string> = {
  unset: 'Applied at full weight; no match context was set.',
  aligned: 'Applied at full weight for this context.',
  partial: 'Applied at reduced weight because the context differs from the model.',
  diverged: 'Applied at heavily reduced weight; this is not the situation the model assumes.'
};

/**
 * Compare the situation a coach model was built for against the situation the
 * coach has actually described. A lens borrowed from a different game state is
 * still useful, but it should not dictate the ranking, so divergence reduces
 * the lens weight and surfaces an explicit warning instead of applying silently.
 *
 * Fit is only assessed once the coach has moved off the default context. With a
 * default context there is nothing to disagree with, so the lens keeps full
 * weight rather than being penalised for a situation nobody described.
 */
export const assessCoachLensFit = (
  lens: CoachModel | undefined,
  context: StrategyContext,
  useContext: boolean
): CoachLensFit => {
  if (!lens) return NEUTRAL_LENS_FIT;

  const keys = (Object.keys(lens.preferredContexts) as (keyof StrategyContext)[])
    .filter(key => lens.preferredContexts[key] !== undefined);

  if (!useContext || keys.length === 0) {
    return { ...NEUTRAL_LENS_FIT, matched: keys.map(key => CONTEXT_KEY_LABELS[key]) };
  }

  const matched: string[] = [];
  const diverged: CoachLensDivergence[] = [];

  keys.forEach(key => {
    const expected = lens.preferredContexts[key]!;
    if (context[key] === expected) {
      matched.push(CONTEXT_KEY_LABELS[key]);
      return;
    }
    diverged.push({
      key,
      label: CONTEXT_KEY_LABELS[key],
      expected: contextValueLabel(key, expected),
      actual: contextValueLabel(key, context[key])
    });
  });

  if (diverged.length === 0) {
    return {
      status: 'aligned',
      weight: LENS_FIT_WEIGHTS.aligned,
      matched,
      diverged,
      note: `${lens.coachName}'s model was built for exactly this situation, so the lens applies at full weight.`
    };
  }

  const status: CoachLensFitStatus = matched.length === 0 ? 'diverged' : 'partial';
  const expectedText = diverged.map(item => `${item.label.toLowerCase()} ${item.expected.toLowerCase()}`).join(', ');
  const actualText = diverged.map(item => item.actual.toLowerCase()).join(', ');
  const note = status === 'diverged'
    ? `${lens.coachName}'s model assumes ${expectedText}, but you are set to ${actualText}. The lens still ranks, at heavily reduced weight — the matchup itself is the stronger signal here.`
    : `${lens.coachName}'s model assumes ${expectedText}, but you are set to ${actualText}. The lens applies at reduced weight for this context.`;

  return { status, weight: LENS_FIT_WEIGHTS[status], matched, diverged, note };
};

const scoreCoachLens = (
  card: TacticalStrategyCard,
  lens: CoachModel | undefined,
  fit: CoachLensFit
): { score: number; reasons: StrategyScoreReason[] } => {
  if (!lens) return { score: 0, reasons: [] };

  let raw = 0;
  const reasons: StrategyScoreReason[] = [];

  lens.strategyBoosts
    .filter(boost => boost.strategyId === card.id)
    .forEach(boost => {
      raw += Math.abs(boost.points);
      reasons.push(makeContextReason('Coach lens', `${lens.coachName}: ${boost.reason}`));
    });

  (lens.strategyPenalties ?? [])
    .filter(penalty => penalty.strategyId === card.id)
    .forEach(penalty => {
      raw -= Math.abs(penalty.points);
      reasons.push(makeContextReason('Coach lens', `${lens.coachName}: ${penalty.reason}`, 'warning'));
    });

  if (raw === 0) return { score: 0, reasons };

  const capped = Math.max(-LENS_MAX_CONTRIBUTION, Math.min(LENS_MAX_CONTRIBUTION, raw));
  const score = Math.round(capped * fit.weight);

  // Short form on the card: the full explanation lives once in the Lens fit
  // strip, so repeating it per card would just crowd the reason chips.
  if (fit.status === 'partial' || fit.status === 'diverged') {
    const weightText = fit.status === 'diverged' ? 'heavily reduced' : 'reduced';
    reasons.push(makeContextReason(
      'Lens fit',
      `Counted at ${weightText} weight: not the situation ${lens.coachName}'s model assumes.`,
      'warning'
    ));
  }

  return { score, reasons };
};

const isPairConflict = (attack: TacticalStrategyCard, defense: TacticalStrategyCard) => (
  attack.territorialIntent === 'sustained' && defense.blockHeight === 'low'
);

const PAIR_COHERENCE_MARGIN = 4;

export const pickCoherentPair = (
  attackScores: RankedStrategyCard[],
  defenseScores: RankedStrategyCard[]
): { attack?: RankedStrategyCard; defense?: RankedStrategyCard; coherence: PairCoherence } => {
  const topAttack = attackScores[0];
  const topDefense = defenseScores[0];

  if (!topAttack || !topDefense || !isPairConflict(topAttack.card, topDefense.card)) {
    return { attack: topAttack, defense: topDefense, coherence: { status: 'coherent' } };
  }

  const altDefense = defenseScores.find(entry => (
    !isPairConflict(topAttack.card, entry.card) && topDefense.score - entry.score <= PAIR_COHERENCE_MARGIN
  ));
  const altAttack = attackScores.find(entry => (
    !isPairConflict(entry.card, topDefense.card) && topAttack.score - entry.score <= PAIR_COHERENCE_MARGIN
  ));
  const defenseCost = altDefense ? topDefense.score - altDefense.score : Number.POSITIVE_INFINITY;
  const attackCost = altAttack ? topAttack.score - altAttack.score : Number.POSITIVE_INFINITY;

  if (altDefense && defenseCost <= attackCost) {
    return {
      attack: topAttack,
      defense: altDefense,
      coherence: {
        status: 'adjusted',
        note: `Defense adjusted to ${altDefense.card.title}: a deep block cannot support the sustained territorial pressure of ${topAttack.card.title}.`
      }
    };
  }

  if (altAttack) {
    return {
      attack: altAttack,
      defense: topDefense,
      coherence: {
        status: 'adjusted',
        note: `Attack adjusted to ${altAttack.card.title}: a sustained possession attack does not fit behind ${topDefense.card.title}.`
      }
    };
  }

  return {
    attack: topAttack,
    defense: topDefense,
    coherence: {
      status: 'tension',
      note: `${topAttack.card.title} wants sustained territory while ${topDefense.card.title} sits deep — pick one intent or assign clear counter outlets.`
    }
  };
};

/**
 * Where a plan sits on the risk scale. The card's own context fit is the
 * authority; structural metadata is the fallback for cards that do not declare
 * a risk range, so every card can still be offered as an alternative.
 */
export const cardRiskProfile = (card: TacticalStrategyCard): StrategyRiskLevel => {
  const levels = card.contextFit?.riskLevel;
  if (levels && levels.length > 0) {
    const safe = levels.includes('safe');
    const aggressive = levels.includes('aggressive');
    if (safe && !aggressive) return 'safe';
    if (aggressive && !safe) return 'aggressive';
    return 'balanced';
  }

  if (card.phase === 'defense') {
    if (card.blockHeight === 'high') return 'aggressive';
    if (card.blockHeight === 'low') return 'safe';
    return 'balanced';
  }

  if (card.territorialIntent === 'sustained') return 'aggressive';
  if (card.territorialIntent === 'transition') return 'safe';
  return 'balanced';
};

const describeGap = (scoreGap: number, recommendedTitle: string): string => {
  if (scoreGap <= 0) return `Level with ${recommendedTitle} on score`;
  return `${scoreGap} point${scoreGap === 1 ? '' : 's'} behind ${recommendedTitle}`;
};

const conflictsWithCounterpart = (
  phase: 'attack' | 'defense',
  card: TacticalStrategyCard,
  counterpart: TacticalStrategyCard | undefined
): boolean => {
  if (!counterpart) return false;
  return phase === 'attack' ? isPairConflict(card, counterpart) : isPairConflict(counterpart, card);
};

/**
 * Offer the coach one safer and one more aggressive option beside the
 * recommendation, plus whatever an active lens pushed off the top. Candidates
 * that the match format rules out, or that would break the pairing with the
 * other phase's recommended plan, are left out: an alternative the coach cannot
 * actually run is noise.
 */
export const buildPhaseAlternatives = ({
  phase,
  scores,
  baselineScores,
  recommended,
  counterpart,
  matchFormat,
  coachLens
}: {
  phase: 'attack' | 'defense';
  scores: RankedStrategyCard[];
  baselineScores: RankedStrategyCard[] | null;
  recommended: TacticalStrategyCard;
  counterpart: TacticalStrategyCard | undefined;
  matchFormat: MatchFormat;
  coachLens: CoachModel | undefined;
}): PhaseAlternatives => {
  const recommendedScore = scores.find(entry => entry.card.id === recommended.id)?.score ?? 0;

  let lensDemoted: StrategyAlternative | null = null;
  const baselineTop = baselineScores?.[0];
  if (coachLens && baselineTop && scores[0] && baselineTop.card.id !== scores[0].card.id) {
    const currentScore = scores.find(entry => entry.card.id === baselineTop.card.id)?.score ?? baselineTop.score;
    lensDemoted = {
      kind: 'lens-demoted',
      card: baselineTop.card,
      score: currentScore,
      scoreGap: Math.max(0, recommendedScore - currentScore),
      rationale: `Without the ${coachLens.coachName} lens this was the top ${phase} pick. ${baselineTop.card.intent}`
    };
  }

  const eligible = scores.filter(entry => (
    entry.card.id !== recommended.id
    // Already listed as the demoted plan; showing it twice reads as two options.
    && entry.card.id !== lensDemoted?.card.id
    && !entry.card.formatAvoid?.includes(matchFormat)
    && !conflictsWithCounterpart(phase, entry.card, counterpart)
  ));

  const pick = (kind: 'safe' | 'aggressive'): StrategyAlternative | null => {
    const entry = eligible.find(candidate => cardRiskProfile(candidate.card) === kind);
    if (!entry) return null;

    const scoreGap = Math.max(0, recommendedScore - entry.score);
    const lead = kind === 'safe' ? 'Safer option' : 'More aggressive option';
    return {
      kind,
      card: entry.card,
      score: entry.score,
      scoreGap,
      rationale: `${lead}. ${describeGap(scoreGap, recommended.title)}. ${entry.card.intent}`
    };
  };

  return { phase, safe: pick('safe'), aggressive: pick('aggressive'), lensDemoted };
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
  matchFormat: MatchFormat,
  context: StrategyContext,
  useContext: boolean,
  coachLens: CoachModel | undefined,
  lensFit: CoachLensFit
): RankedStrategyCard[] => {
  const ourTags = tagsForOurFormation(our);
  const opponentTags = tagsForOpponentFormation(opponent);
  return cards
    .filter(card => card.status !== 'draft')
    .map(card => {
      const contextScore = scoreContextFit(card, context, useContext);
      const formatScore = scoreFormatFit(card, matchFormat);
      const lensScore = scoreCoachLens(card, coachLens, lensFit);
      return {
        card,
        score: scoreCard(card, ourTags, opponentTags) + contextScore.score + formatScore.score + lensScore.score,
        reasons: [...formatScore.reasons, ...contextScore.reasons, ...lensScore.reasons]
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
  playerInstructions: string[],
  coachLens: CoachModel | undefined,
  lensFit: CoachLensFit
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
  },
  // The lens belongs in the coach read, not only on a badge: this is the text
  // that travels with the saved plan, so a plan ranked through Ferguson has to
  // still say so after the fact.
  ...(coachLens
    ? [{
      label: 'Coach lens',
      value: `Ranked through ${coachLens.coachName} — ${coachLens.modelName}. ${LENS_WEIGHT_SUMMARY[lensFit.status]}`
    }]
    : [])
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
  context = DEFAULT_STRATEGY_CONTEXT,
  coachLensId
}: {
  ourFormation: string;
  opponentFormation: string;
  matchFormat: MatchFormat;
  context?: StrategyContext;
  coachLensId?: string;
}): MatchupRecommendation => {
  const our = analyzeFormation(ourFormation);
  const opponent = analyzeFormation(opponentFormation);
  const useContext = !isDefaultStrategyContext(context);
  const coachLens = coachLensId ? findCoachModelById(coachLensId) : undefined;
  const lensFit = assessCoachLensFit(coachLens, context, useContext);
  const attackScores = rankCards(ATTACK_STRATEGY_CARDS, our, opponent, matchFormat, context, useContext, coachLens, lensFit);
  const defenseScores = rankCards(DEFENSE_STRATEGY_CARDS, our, opponent, matchFormat, context, useContext, coachLens, lensFit);
  const coherentPair = pickCoherentPair(attackScores, defenseScores);
  const recommendedAttack = coherentPair.attack?.card ?? ATTACK_STRATEGY_CARDS[0];
  const recommendedDefense = coherentPair.defense?.card ?? DEFENSE_STRATEGY_CARDS[0];
  // Only ranked a second time when a lens is active, purely to answer "what
  // would the engine have said on its own?" for the demoted alternative.
  const baselineAttackScores = coachLens
    ? rankCards(ATTACK_STRATEGY_CARDS, our, opponent, matchFormat, context, useContext, undefined, NEUTRAL_LENS_FIT)
    : null;
  const baselineDefenseScores = coachLens
    ? rankCards(DEFENSE_STRATEGY_CARDS, our, opponent, matchFormat, context, useContext, undefined, NEUTRAL_LENS_FIT)
    : null;
  const alternatives = {
    attack: buildPhaseAlternatives({
      phase: 'attack',
      scores: attackScores,
      baselineScores: baselineAttackScores,
      recommended: recommendedAttack,
      counterpart: recommendedDefense,
      matchFormat,
      coachLens
    }),
    defense: buildPhaseAlternatives({
      phase: 'defense',
      scores: defenseScores,
      baselineScores: baselineDefenseScores,
      recommended: recommendedDefense,
      counterpart: recommendedAttack,
      matchFormat,
      coachLens
    })
  };
  const contextReasons = getTopContextReasons(coherentPair.attack, coherentPair.defense);
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
    playerInstructions,
    coachLens,
    lensFit
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
    pairCoherence: coherentPair.coherence,
    coachLens: coachLens
      ? { id: coachLens.id, coachName: coachLens.coachName, modelName: coachLens.modelName, fit: lensFit }
      : null,
    alternatives,
    opponentThreats,
    exploitableSpaces,
    playerInstructions,
    shapeImpactSummary,
    comparisonInsights,
    explanation: comparisonInsights.map(insight => `${insight.label}: ${insight.value}`).join(' ')
  };
};

const CURRENT_PLAN_SCORE_MARGIN = 3;

const assessRankedPlan = (
  scores: RankedStrategyCard[],
  recommended: TacticalStrategyCard,
  style: string,
  phase: CurrentPlanCheck['phase']
): CurrentPlanCheck | null => {
  const index = scores.findIndex(entry => entry.card.styleValue === style);
  if (index === -1) return null;

  const entry = scores[index];
  const top = scores[0];
  const warning = entry.reasons.find(reason => reason.tone === 'warning');

  if (entry.card.id === recommended.id) {
    return {
      phase,
      title: entry.card.title,
      verdict: 'top-pick',
      note: warning ? `Top choice, but watch: ${warning.value}` : "Matches the engine's top recommendation."
    };
  }
  if (warning) {
    return { phase, title: entry.card.title, verdict: 'risky', note: warning.value };
  }
  if (index <= 2 || top.score - entry.score <= CURRENT_PLAN_SCORE_MARGIN) {
    return {
      phase,
      title: entry.card.title,
      verdict: 'solid',
      note: `Close alternative to ${recommended.title} in this context.`
    };
  }
  return {
    phase,
    title: entry.card.title,
    verdict: 'off-context',
    note: `${recommended.title} fits this matchup and context better.`
  };
};

/**
 * Rate the coach's currently applied playstyle and defensive style against the
 * ranked recommendations, so the panel can flag when the active plan is risky
 * or clearly beaten by the current matchup and context. Comparisons reference
 * the final recommended cards (after pair-coherence adjustment), so the check
 * never points the coach at a card the engine did not actually recommend.
 */
export const assessCurrentPlan = (
  recommendation: MatchupRecommendation,
  playstyle: string,
  defensiveStyle: string
): { attack: CurrentPlanCheck | null; defense: CurrentPlanCheck | null } => ({
  attack: assessRankedPlan(recommendation.attackScores, recommendation.recommendedAttack, playstyle, 'attack'),
  defense: assessRankedPlan(recommendation.defenseScores, recommendation.recommendedDefense, defensiveStyle, 'defense')
});
