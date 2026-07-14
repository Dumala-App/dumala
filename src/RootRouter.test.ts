import { describe, expect, it } from 'vitest';
import { getRootRoute, shouldLoadWorkspace } from './RootRouter';

describe('RootRouter', () => {
  it('keeps public routes on the lightweight landing surface', () => {
    expect(getRootRoute('')).toBe('');
    expect(getRootRoute('#/landing')).toBe('landing');
    expect(shouldLoadWorkspace('', '', null)).toBe(false);
    expect(shouldLoadWorkspace('landing', '', null)).toBe(false);
  });

  it('loads the workspace for app and authentication callback routes', () => {
    expect(shouldLoadWorkspace('app', '', null)).toBe(true);
    expect(shouldLoadWorkspace('', '?dumalaAuth=app', null)).toBe(true);
    expect(shouldLoadWorkspace('', '?dumalaAuth=player', null)).toBe(true);
    expect(shouldLoadWorkspace('', '?dumalaAuth=league', null)).toBe(true);
    expect(shouldLoadWorkspace('', '', Date.now().toString())).toBe(true);
  });
});
