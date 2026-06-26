import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CoachKnowledgeBase } from './CoachKnowledgeBase';
import { COACHING_LIBRARY_ITEMS } from '../knowledge/coachingLibrary';

describe('Tactics knowledgebase', () => {
  it('renders coaching reference content from structured library data', () => {
    const html = renderToStaticMarkup(<CoachKnowledgeBase />);

    expect(html).toContain('Coach Reference Library');
    expect(html).toContain('Formations, game phases, and tactical models');
    expect(html).toContain(`${COACHING_LIBRARY_ITEMS.length} topics`);
    expect(html).toContain('4-3-3');
    expect(html).toContain('3-4-3');
    expect(html).toContain('4-1-4-1');
    expect(html).toContain('5-3-2');
    expect(html).toContain('4-3-1-2');
    expect(html).toContain('4-4-1-1');
    expect(html).toContain('Attack Types');
    expect(html).toContain('Defense Types');
    expect(html).toContain('Tactical Models');
    expect(html).not.toContain('Illustration brief');
    expect(html).not.toContain('Photo/diagram brief');
    expect(html).toContain('<svg');
    expect(html).toContain('4-3-3 with wide forwards and fullback overlaps');
    expect(html).toContain('Key Learning');
    expect(html).toContain('Coach Notes');
  });
});
