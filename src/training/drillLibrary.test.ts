import { describe, expect, it } from 'vitest';
import {
  DRILL_INSTRUCTIONS,
  TRAINING_DRILLS,
  getDrillEquipment,
  inferDrillSessionBlock
} from './drillLibrary';

describe('training drill library', () => {
  it('keeps every drill uniquely addressable with an instruction record', () => {
    const ids = TRAINING_DRILLS.map(drill => drill.id);

    expect(TRAINING_DRILLS).toHaveLength(85);
    expect(new Set(ids).size).toBe(ids.length);
    expect(TRAINING_DRILLS.every(drill => DRILL_INSTRUCTIONS[drill.id])).toBe(true);
  });

  it('keeps drill metadata complete enough for filtering and scheduling', () => {
    expect(TRAINING_DRILLS.every(drill => drill.name && drill.category && drill.description)).toBe(true);
    expect(TRAINING_DRILLS.every(drill => drill.targetAttributes.length > 0)).toBe(true);
    expect(TRAINING_DRILLS.every(drill => Object.keys(drill.developmentFocus).length > 0)).toBe(true);
    expect(TRAINING_DRILLS.every(drill => drill.fatigueIncrease > 0)).toBe(true);
  });

  it('derives structured session defaults from the drill library', () => {
    const recovery = TRAINING_DRILLS.find(drill => drill.id === 'drill-mobility');
    const tactical = TRAINING_DRILLS.find(drill => drill.id === 'drill-tactical-shadow');
    const warmup = TRAINING_DRILLS.find(drill => drill.id === 'drill-warm-rondo-arrival');
    const tacticalExpansion = TRAINING_DRILLS.find(drill => drill.id === 'drill-tactical-midblock-trap');
    const conditioningExpansion = TRAINING_DRILLS.find(drill => drill.id === 'drill-cond-hiit-small-sided');
    const recoveryExpansion = TRAINING_DRILLS.find(drill => drill.id === 'drill-recovery-breath-mobility');

    expect(recovery && inferDrillSessionBlock(recovery)).toBe('cooldown');
    expect(tactical && inferDrillSessionBlock(tactical)).toBe('tactical');
    expect(warmup && inferDrillSessionBlock(warmup)).toBe('warmup');
    expect(tacticalExpansion && inferDrillSessionBlock(tacticalExpansion)).toBe('tactical');
    expect(conditioningExpansion && inferDrillSessionBlock(conditioningExpansion)).toBe('conditioning');
    expect(recoveryExpansion && inferDrillSessionBlock(recoveryExpansion)).toBe('cooldown');
    expect(getDrillEquipment('drill-agility')).toEqual(expect.arrayContaining(['cones', 'flat markers', 'stopwatch']));
  });
});
