import { describe, expect, it } from 'vitest';
import { COACH_MODELS, type CoachModel } from './coachModels';
import { validateCoachModels, validateStrategyKnowledge } from './validation';

describe('strategy knowledge validation', () => {
  it('keeps editable coach models and strategy cards internally consistent', () => {
    expect(validateStrategyKnowledge()).toEqual([]);
  });

  it('ships with active coach model references for future strategy expansion', () => {
    expect(COACH_MODELS.filter(model => model.status === 'active').map(model => model.coachName)).toEqual(
      expect.arrayContaining([
        'Pep Guardiola',
        'Jose Mourinho',
        'Carlo Ancelotti',
        'Arsene Wenger',
        'Sir Alex Ferguson'
      ])
    );
  });
});

describe('coach model lens rules', () => {
  const strategyIds = new Set(['attack-quick-counter', 'attack-possession-game', 'defense-low-block']);
  const knownTags = new Set(['counter']);

  const model = (overrides: Partial<CoachModel> = {}): CoachModel => ({
    id: 'test-model',
    coachName: 'Test Coach',
    modelName: 'Test model',
    summary: 'A model used only for validation tests.',
    tacticalThemes: ['testing'],
    principles: ['counter'] as CoachModel['principles'],
    preferredContexts: { matchState: 'balanced' },
    strategyBoosts: [
      { strategyId: 'attack-quick-counter', points: 3, reason: 'Fits the model.' },
      { strategyId: 'defense-low-block', points: 2, reason: 'Protects the result.' }
    ],
    strategyPenalties: [
      { strategyId: 'attack-possession-game', points: 2, reason: 'Not how this model creates chances.' }
    ],
    references: [{ label: 'Reference', url: 'https://example.com', sourceType: 'encyclopedia' }],
    status: 'active',
    ...overrides
  });

  const messagesFor = (candidate: CoachModel) => (
    validateCoachModels([candidate], strategyIds, knownTags).map(issue => issue.message)
  );

  it('accepts a well-formed model', () => {
    expect(messagesFor(model())).toEqual([]);
  });

  it('rejects lens points outside the allowed magnitude', () => {
    const messages = messagesFor(model({
      strategyBoosts: [{ strategyId: 'attack-quick-counter', points: 9, reason: 'Way too strong.' }]
    }));

    expect(messages.some(message => message.includes('must be a whole number between 1 and 3'))).toBe(true);
  });

  it('rejects a strategy that is both boosted and penalised', () => {
    const messages = messagesFor(model({
      strategyPenalties: [{ strategyId: 'attack-quick-counter', points: 2, reason: 'Contradicts the boost.' }]
    }));

    expect(messages.some(message => message.includes('both boosted and penalised'))).toBe(true);
  });

  it('rejects duplicate boosts for the same strategy', () => {
    const messages = messagesFor(model({
      strategyBoosts: [
        { strategyId: 'attack-quick-counter', points: 2, reason: 'First.' },
        { strategyId: 'attack-quick-counter', points: 2, reason: 'Second.' },
        { strategyId: 'defense-low-block', points: 2, reason: 'Protects the result.' }
      ]
    }));

    expect(messages.some(message => message.includes('Duplicate boost'))).toBe(true);
  });

  it('requires active models to cover both attack and defense', () => {
    const messages = messagesFor(model({
      strategyBoosts: [{ strategyId: 'attack-quick-counter', points: 3, reason: 'Attack only.' }]
    }));

    expect(messages.some(message => message.includes('at least one defense boost'))).toBe(true);
  });

  it('requires active models to express at least one penalty', () => {
    const messages = messagesFor(model({ strategyPenalties: undefined }));

    expect(messages.some(message => message.includes('at least one penalty'))).toBe(true);
  });

  it('requires active models to declare a preferred context for lens fit', () => {
    const messages = messagesFor(model({ preferredContexts: {} }));

    expect(messages.some(message => message.includes('at least one preferred context'))).toBe(true);
  });

  it('rejects an unknown preferred context value', () => {
    const messages = messagesFor(model({
      preferredContexts: { matchState: 'winning-comfortably' as never }
    }));

    expect(messages.some(message => message.includes('Unknown preferred context value'))).toBe(true);
  });

  it('leaves draft models exempt from the coverage rules', () => {
    const messages = messagesFor(model({
      status: 'draft',
      strategyBoosts: [{ strategyId: 'attack-quick-counter', points: 3, reason: 'Attack only.' }],
      strategyPenalties: undefined,
      preferredContexts: {},
      references: []
    }));

    expect(messages).toEqual([]);
  });
});
