import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import CoachTourOverlay from './CoachTourOverlay';
import { COACH_TOUR_STEPS } from '../onboarding/coachTour';

describe('CoachTourOverlay', () => {
  it('opens on a centered welcome card with skip and start controls', () => {
    const html = renderToStaticMarkup(
      <CoachTourOverlay steps={COACH_TOUR_STEPS} onClose={vi.fn()} />
    );

    expect(html).toContain('Welcome to Dumala');
    expect(html).toContain(`1 of ${COACH_TOUR_STEPS.length}`);
    expect(html).toContain('Start tour');
    expect(html).toContain('Skip tour');
    expect(html).toContain('role="dialog"');
    // No spotlight yet: the welcome step dims the whole workspace instead.
    expect(html).not.toContain('border-cyan-300/80');
  });
});
