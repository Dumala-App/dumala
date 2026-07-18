import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import GettingStartedChecklist from './GettingStartedChecklist';
import { deriveActivationMilestones } from '../activation/milestones';
import type { Game, Player } from '../types';

const partialActivation = () => deriveActivationMilestones(
  [{ id: 'p1' } as Player],
  [{ id: 'g1', status: 'Upcoming' } as Game],
  [],
  {}
);

const fullActivation = () => deriveActivationMilestones(
  [{ id: 'p1' } as Player],
  [
    { id: 'g1', status: 'Upcoming' } as Game,
    { id: 'g2', status: 'Completed' } as Game
  ],
  [{ id: 'a1' } as never],
  { report: '2026-07-18T00:00:00.000Z' }
);

describe('GettingStartedChecklist', () => {
  it('renders a collapsed strip pointing at the next milestone only', () => {
    const html = renderToStaticMarkup(
      <GettingStartedChecklist state={partialActivation()} onNavigate={vi.fn()} />
    );

    expect(html).toContain('getting-started-strip');
    expect(html).toContain('2/5');
    expect(html).toContain('Next:');
    expect(html).toContain('Log a match result');
    // Expanded-only content stays hidden until the coach opens the strip.
    expect(html).not.toContain('Finish these first-week steps');
    expect(html).not.toContain('Add your squad');
  });

  it('offers a tour replay only when a handler is wired', () => {
    const withoutHandler = renderToStaticMarkup(
      <GettingStartedChecklist state={partialActivation()} onNavigate={vi.fn()} />
    );
    expect(withoutHandler).not.toContain('Replay the app tour');
  });

  it('steps out of the way once every milestone is reached', () => {
    const html = renderToStaticMarkup(
      <GettingStartedChecklist state={fullActivation()} onNavigate={vi.fn()} />
    );
    expect(html).toBe('');
  });
});
