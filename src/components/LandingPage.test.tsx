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

  it('includes the branded account switch without icons inside text fields', () => {
    const html = renderToStaticMarkup(<LandingPage />);

    expect(html).toContain('Dumala account access');
    expect(html).toContain('Start fresh or pick up where you left off.');
    expect(html).toContain('Create account');
    expect(html).toContain('Sign in');
    expect(html).toContain('placeholder="coach@example.com"');
    expect(html).not.toContain('class="input-field"');
    expect(html).not.toContain('<i>');
  });
});
