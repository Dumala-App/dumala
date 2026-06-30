import { describe, expect, it } from 'vitest';
import { COACH_MODELS } from './coachModels';
import { validateStrategyKnowledge } from './validation';

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

