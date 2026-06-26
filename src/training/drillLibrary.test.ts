import { describe, expect, it } from 'vitest';
import { DRILL_INSTRUCTIONS, TRAINING_DRILLS } from './drillLibrary';

describe('training drill library', () => {
  it('keeps every drill uniquely addressable with an instruction record', () => {
    const ids = TRAINING_DRILLS.map(drill => drill.id);

    expect(TRAINING_DRILLS).toHaveLength(51);
    expect(new Set(ids).size).toBe(ids.length);
    expect(TRAINING_DRILLS.every(drill => DRILL_INSTRUCTIONS[drill.id])).toBe(true);
  });

  it('keeps drill metadata complete enough for filtering and scheduling', () => {
    expect(TRAINING_DRILLS.every(drill => drill.name && drill.category && drill.description)).toBe(true);
    expect(TRAINING_DRILLS.every(drill => drill.targetAttributes.length > 0)).toBe(true);
    expect(TRAINING_DRILLS.every(drill => Object.keys(drill.statsBumps).length > 0)).toBe(true);
    expect(TRAINING_DRILLS.every(drill => drill.fatigueIncrease > 0)).toBe(true);
  });
});
