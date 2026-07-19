import { ATTACK_STRATEGY_CARDS, DEFENSE_STRATEGY_CARDS, type TacticalStrategyCard } from '../strategyLibrary';
import { COACH_MODELS, type CoachModel } from './coachModels';
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

const validateCoachModels = (
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

    [...model.strategyBoosts, ...(model.strategyPenalties ?? [])].forEach(item => {
      if (!strategyIds.has(item.strategyId)) {
        issues.push({ id: model.id, message: `Unknown strategy ID: ${item.strategyId}.` });
      }
    });

    if (model.status !== 'draft' && model.references.length === 0) {
      issues.push({ id: model.id, message: 'Active coach models need at least one reference.' });
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

