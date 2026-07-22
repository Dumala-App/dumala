import { ATTACK_STRATEGY_CARDS, DEFENSE_STRATEGY_CARDS, type TacticalStrategyCard } from '../strategyLibrary';
import { COACH_MODELS, LENS_POINT_MAX, LENS_POINT_MIN, type CoachModel } from './coachModels';
import { DEFAULT_STRATEGY_CONTEXT, STRATEGY_CONTEXT_LABELS, type StrategyContext } from '../strategyContext';
import { STRATEGY_TAGS } from './strategyTags';

export type StrategyKnowledgeIssue = {
  id: string;
  message: string;
};

const allStrategyCards = (): readonly TacticalStrategyCard[] => [
  ...ATTACK_STRATEGY_CARDS,
  ...DEFENSE_STRATEGY_CARDS
];

const findDuplicateIds = (ids: readonly string[]) => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  ids.forEach(id => {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  });
  return Array.from(duplicates);
};

const validateStrategyCards = (
  cards: readonly TacticalStrategyCard[],
  coachIds: Set<string>,
  knownTags: Set<string>
): StrategyKnowledgeIssue[] => {
  const issues: StrategyKnowledgeIssue[] = [];
  const duplicateIds = findDuplicateIds(cards.map(card => card.id));
  duplicateIds.forEach(id => issues.push({ id, message: 'Strategy card IDs must be unique.' }));

  cards.forEach(card => {
    const cardTags = [...card.formationFit, ...card.opponentCounters, ...card.tags];
    cardTags.forEach(tag => {
      if (!knownTags.has(tag)) {
        issues.push({ id: card.id, message: `Unknown strategy tag: ${tag}.` });
      }
    });

    card.sourceModelIds?.forEach(modelId => {
      if (!coachIds.has(modelId)) {
        issues.push({ id: card.id, message: `Unknown source model ID: ${modelId}.` });
      }
    });

    if (card.status !== 'draft') {
      if (card.formationFit.length === 0) issues.push({ id: card.id, message: 'Active strategies need at least one formation fit tag.' });
      if (card.opponentCounters.length === 0) issues.push({ id: card.id, message: 'Active strategies need at least one opponent counter tag.' });
      if (card.cues.length === 0) issues.push({ id: card.id, message: 'Active strategies need at least one cue.' });
      if (!card.watchout.trim()) issues.push({ id: card.id, message: 'Active strategies need a watchout.' });
      if (card.phase === 'attack' && !card.territorialIntent) issues.push({ id: card.id, message: 'Active attack strategies need a territorial intent for pair coherence.' });
      if (card.phase === 'defense' && !card.blockHeight) issues.push({ id: card.id, message: 'Active defense strategies need a block height for pair coherence.' });
    }
  });

  return issues;
};

/**
 * Exported so the rules can be exercised against synthetic models: the shipped
 * library is expected to be clean, which would otherwise leave every rule here
 * asserted only by its absence.
 */
export const validateCoachModels = (
  models: readonly CoachModel[],
  strategyIds: Set<string>,
  knownTags: Set<string>
): StrategyKnowledgeIssue[] => {
  const issues: StrategyKnowledgeIssue[] = [];
  const duplicateIds = findDuplicateIds(models.map(model => model.id));
  duplicateIds.forEach(id => issues.push({ id, message: 'Coach model IDs must be unique.' }));

  models.forEach(model => {
    model.principles.forEach(tag => {
      if (!knownTags.has(tag)) {
        issues.push({ id: model.id, message: `Unknown coach model principle tag: ${tag}.` });
      }
    });

    const penalties = model.strategyPenalties ?? [];

    [...model.strategyBoosts, ...penalties].forEach(item => {
      if (!strategyIds.has(item.strategyId)) {
        issues.push({ id: model.id, message: `Unknown strategy ID: ${item.strategyId}.` });
      }
      if (!Number.isInteger(item.points) || item.points < LENS_POINT_MIN || item.points > LENS_POINT_MAX) {
        issues.push({
          id: model.id,
          message: `Lens points for ${item.strategyId} must be a whole number between ${LENS_POINT_MIN} and ${LENS_POINT_MAX}.`
        });
      }
      if (!item.reason.trim()) {
        issues.push({ id: model.id, message: `Lens entry for ${item.strategyId} needs a reason the coach can read.` });
      }
    });

    findDuplicateIds(model.strategyBoosts.map(boost => boost.strategyId))
      .forEach(id => issues.push({ id: model.id, message: `Duplicate boost for strategy ID: ${id}.` }));
    findDuplicateIds(penalties.map(penalty => penalty.strategyId))
      .forEach(id => issues.push({ id: model.id, message: `Duplicate penalty for strategy ID: ${id}.` }));

    const boostedIds = new Set(model.strategyBoosts.map(boost => boost.strategyId));
    penalties
      .filter(penalty => boostedIds.has(penalty.strategyId))
      .forEach(penalty => issues.push({
        id: model.id,
        message: `Strategy ${penalty.strategyId} is both boosted and penalised, so the lens has no clear opinion on it.`
      }));

    (Object.keys(model.preferredContexts) as (keyof StrategyContext)[]).forEach(key => {
      const value = model.preferredContexts[key];
      if (value === undefined) return;
      if (!(key in DEFAULT_STRATEGY_CONTEXT)) {
        issues.push({ id: model.id, message: `Unknown preferred context field: ${key}.` });
        return;
      }
      if (!(value in STRATEGY_CONTEXT_LABELS[key])) {
        issues.push({ id: model.id, message: `Unknown preferred context value for ${key}: ${value}.` });
      }
    });

    if (model.status !== 'draft') {
      if (model.references.length === 0) {
        issues.push({ id: model.id, message: 'Active coach models need at least one reference.' });
      }
      if (Object.keys(model.preferredContexts).length === 0) {
        issues.push({ id: model.id, message: 'Active coach models need at least one preferred context so lens fit can be assessed.' });
      }
      (['attack', 'defense'] as const).forEach(phase => {
        const hasPhaseBoost = model.strategyBoosts.some(boost => boost.strategyId.startsWith(`${phase}-`));
        if (!hasPhaseBoost) {
          issues.push({
            id: model.id,
            message: `Active coach models need at least one ${phase} boost, otherwise the lens is silent for half the ranking.`
          });
        }
      });
      if (penalties.length === 0) {
        issues.push({
          id: model.id,
          message: 'Active coach models need at least one penalty, otherwise the lens can only add and never expresses what it avoids.'
        });
      }
    }
  });

  return issues;
};

export const validateStrategyKnowledge = (): StrategyKnowledgeIssue[] => {
  const cards = allStrategyCards();
  const models = COACH_MODELS;
  const strategyIds = new Set(cards.map(card => card.id));
  const coachIds = new Set(models.map(model => model.id));
  const knownTags = new Set<string>(STRATEGY_TAGS);

  return [
    ...validateStrategyCards(cards, coachIds, knownTags),
    ...validateCoachModels(models, strategyIds, knownTags)
  ];
};

