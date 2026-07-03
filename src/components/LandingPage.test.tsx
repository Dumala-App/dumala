import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import LandingPage from './LandingPage';

describe('LandingPage Premium CTA', () => {
  it('uses lead capture for Premium interest while keeping free app opens separate', () => {
    const html = renderToStaticMarkup(<LandingPage />);

    expect(html).toContain('Start free');
    expect(html).toContain('href="#/app"');
    expect(html).toContain('<button type="button" class="dc-joinbeta"');
    expect(html).toContain('Join the beta list</button>');
    expect(html).not.toContain('<a href="#/app" class="dc-joinbeta"');
  });
});
