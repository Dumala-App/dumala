import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { TRAINING_DRILLS } from '../training/drillLibrary';
import type { ScheduledDrill } from '../training/synchronization';
import TrainingSessionBuilder from './TrainingSessionBuilder';

describe('TrainingSessionBuilder', () => {
  it('renders the five session blocks and a calculated session summary', () => {
    const drills: ScheduledDrill[] = [
      {
        id: 'warmup-1',
        drillId: 'drill-pass-triangle',
        name: 'Triangle Passing Warm-Up',
        fatigueIncrease: 2,
        block: 'warmup',
        order: 0,
        durationMinutes: 10,
        intensityRating: 2,
        equipment: ['cones', 'balls']
      },
      {
        id: 'tactical-1',
        drillId: 'drill-tactical-shadow',
        name: 'Shadow Play Tactical Shape',
        fatigueIncrease: 5,
        block: 'tactical',
        order: 0,
        durationMinutes: 20,
        intensityRating: 5,
        equipment: ['cones', 'pinnies']
      }
    ];

    const html = renderToStaticMarkup(
      <TrainingSessionBuilder
        day="Thursday"
        drills={drills}
        library={TRAINING_DRILLS}
        onChange={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain('Thursday training session');
    expect(html).toContain('Warm-up');
    expect(html).toContain('Main technical');
    expect(html).toContain('Tactical');
    expect(html).toContain('Conditioning');
    expect(html).toContain('Cooldown');
    expect(html).toContain('30 min');
    expect(html).toContain('12');
    expect(html).toContain('cones');
    expect(html).toContain('pinnies');
    expect(html).toContain('Finish with a cooldown or recovery drill.');
    expect(html).toContain('Needs structure');
    expect(html).toContain('Block balance');
    expect(html).toContain('Intensity');
    expect(html).toContain('Coach cue');
    expect(html).toContain('Duplicate Triangle Passing Warm-Up');
  });

  it('offers a quick-start path for an empty session', () => {
    const html = renderToStaticMarkup(
      <TrainingSessionBuilder
        day="Monday"
        drills={[]}
        library={TRAINING_DRILLS}
        onChange={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(html).toContain('Not started');
    expect(html).toContain('Start with a balanced structure');
    expect(html).toContain('Quick start');
    expect(html).not.toContain('Clear session');
  });
});
