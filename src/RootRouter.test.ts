import { describe, expect, it } from 'vitest';
import {
  applyPwaMetadataForRoute,
  getPwaMetadataForRoute,
  getRootRoute,
  isDevlogRootRoute,
  isLandingRootRoute,
  isPublicTeamRootRoute,
  isTeamPageEnabled,
  shouldLoadWorkspace
} from './RootRouter';

describe('RootRouter', () => {
  it('keeps public routes on the lightweight landing surface', () => {
    expect(getRootRoute('')).toBe('');
    expect(getRootRoute('#/landing')).toBe('landing');
    expect(shouldLoadWorkspace('', '', null)).toBe(false);
    expect(shouldLoadWorkspace('landing', '', null)).toBe(false);
    expect(shouldLoadWorkspace('t/blue-eagles-fc', '', null)).toBe(false);
    expect(shouldLoadWorkspace('devlog', '', null)).toBe(false);
    expect(shouldLoadWorkspace('landing/features', '', null)).toBe(false);
  });

  it('recognizes the public devlog route without catching workspace routes', () => {
    expect(isDevlogRootRoute('devlog')).toBe(true);
    expect(isDevlogRootRoute('devlog/entry')).toBe(false);
    expect(isDevlogRootRoute('development')).toBe(false);
    expect(isDevlogRootRoute('')).toBe(false);
  });

  it('treats devlog section hand-offs as landing routes', () => {
    expect(getRootRoute('#/landing/features')).toBe('landing/features');
    expect(isLandingRootRoute('')).toBe(true);
    expect(isLandingRootRoute('landing')).toBe(true);
    expect(isLandingRootRoute('landing/pricing-plans')).toBe(true);
    expect(isLandingRootRoute('app')).toBe(false);
  });

  it('loads the workspace for app and authentication callback routes', () => {
    expect(shouldLoadWorkspace('app', '', null)).toBe(true);
    expect(shouldLoadWorkspace('login', '', null)).toBe(true);
    expect(shouldLoadWorkspace('', '?dumalaAuth=app', null)).toBe(true);
    expect(shouldLoadWorkspace('', '?dumalaAuth=player', null)).toBe(true);
    expect(shouldLoadWorkspace('', '?dumalaAuth=league', null)).toBe(true);
    expect(shouldLoadWorkspace('', '', Date.now().toString())).toBe(true);
  });

  it('recognizes public team page routes', () => {
    expect(isPublicTeamRootRoute('t/blue-eagles-fc')).toBe(true);
    expect(isPublicTeamRootRoute('t?team=blue-eagles-fc')).toBe(true);
    expect(isPublicTeamRootRoute('t')).toBe(true);
    expect(isPublicTeamRootRoute('training')).toBe(false);
    expect(isPublicTeamRootRoute('team')).toBe(false);
    expect(isPublicTeamRootRoute('')).toBe(false);
  });

  it('keeps the public team page dark unless its flag is on', () => {
    expect(isTeamPageEnabled({ VITE_DUMALA_TEAM_PAGE_ENABLED: 'true' })).toBe(true);
    expect(isTeamPageEnabled({ VITE_DUMALA_TEAM_PAGE_ENABLED: 'false' })).toBe(false);
    expect(isTeamPageEnabled({})).toBe(false);
  });

  it('uses player install metadata only for the player route', () => {
    expect(getPwaMetadataForRoute('player').manifest).toBe('/player-manifest.webmanifest');
    expect(getPwaMetadataForRoute('player?join=ABC123').manifest).toBe('/player-manifest.webmanifest');
    expect(getPwaMetadataForRoute('app').manifest).toBe('/manifest.webmanifest');
  });

  it('applies route-specific PWA metadata to the document head', () => {
    const elements = new Map<string, { attrs: Record<string, string>; setAttribute: (name: string, value: string) => void; getAttribute: (name: string) => string | undefined }>();
    const createElement = (attrs: Record<string, string>) => {
      const element = {
        attrs,
        setAttribute: (name: string, value: string) => {
          element.attrs[name] = value;
        },
        getAttribute: (name: string) => element.attrs[name]
      };
      return element;
    };
    elements.set('link[rel="manifest"]', createElement({ href: '/manifest.webmanifest' }));
    elements.set('link[rel="apple-touch-icon"]', createElement({ href: '/dumala-pwa-192.png' }));
    elements.set('meta[name="application-name"]', createElement({ content: 'Dumala' }));
    elements.set('meta[name="apple-mobile-web-app-title"]', createElement({ content: 'Dumala' }));
    elements.set('meta[name="theme-color"]', createElement({ content: '#07111f' }));
    const doc = {
      title: 'Dumala',
      querySelector: (selector: string) => elements.get(selector) ?? null
    } as unknown as Document;

    applyPwaMetadataForRoute('player', doc);

    expect(doc.querySelector('link[rel="manifest"]')?.getAttribute('href')).toBe('/player-manifest.webmanifest');
    expect(doc.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href')).toBe('/dumala-player-pwa-192.png');
    expect(doc.querySelector('meta[name="apple-mobile-web-app-title"]')?.getAttribute('content')).toBe('Dumala Player');
    expect(doc.title).toBe('Dumala Player');
  });
});
