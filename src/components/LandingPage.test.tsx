import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import LandingPage from './LandingPage';

describe('LandingPage Premium CTA', () => {
  it('uses lead capture for Premium interest while keeping free app opens separate', () => {
    const html = renderToStaticMarkup(<LandingPage />);

    expect(html).toContain('Start free');
    expect(html).toContain('href="#/app"');
    expect(html).not.toContain('href="#/player"');
    expect(html).not.toContain('href="#/league"');
    expect(html).toContain('<button type="button" class="dc-joinbeta"');
    expect(html).toContain('Join the beta list</button>');
    expect(html).not.toContain('<a href="#/app" class="dc-joinbeta"');
  });

  it('links the devlog from the header and footer navigation', () => {
    const html = renderToStaticMarkup(<LandingPage />);

    expect(html).toContain('href="#/devlog"');
    expect(html).toContain('Devlog</a>');
  });

  it('exposes a dedicated sign-in route for registered coaches', () => {
    const html = renderToStaticMarkup(<LandingPage />);

    expect(html).toContain('href="#/login"');
    expect(html).toContain('Sign in</a>');
  });

  it('does not render account access below the hero', () => {
    const html = renderToStaticMarkup(<LandingPage />);

    expect(html).not.toContain('id="account-access"');
    expect(html).not.toContain('Dumala account access');
    expect(html).not.toContain('Start fresh or pick up where you left off.');
    expect(html).not.toContain('placeholder="coach@example.com"');
  });
});
