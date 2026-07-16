import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CloudRuntime } from '../cloud/runtime';
import type { CloudAuthController } from '../hooks/useCloudAuth';
import PlayerAppShell from './PlayerAppShell';
import LeagueAppShell from './LeagueAppShell';

const mockState = vi.hoisted(() => ({
  runtime: null as CloudRuntime | null
}));

vi.mock('../hooks/useCloudRuntime', () => ({
  useCloudRuntime: () => mockState.runtime
}));

vi.mock('../hooks/useCloudAuth', () => ({
  useCloudAuth: (): CloudAuthController => ({
    state: { status: 'signedOut' },
    requestOtp: vi.fn(),
    signUpWithPassword: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn()
  })
}));

vi.mock('./CloudAccountGate', () => ({
  CloudAccountGate: () => 'ACCOUNT_GATE',
  getAppAuthRedirectUrl: (target = 'app') => `https://dumala.test/?dumalaAuth=${target}`
}));

vi.mock('./player/PlayerApp', () => ({
  default: ({ preview }: { preview?: boolean }) => preview ? 'PLAYER_APP_PREVIEW' : 'PLAYER_APP_LIVE'
}));

vi.mock('./league/LeagueApp', () => ({
  default: ({ preview }: { preview?: boolean }) => preview ? 'LEAGUE_APP_PREVIEW' : 'LEAGUE_APP_LIVE'
}));

vi.mock('./player/demoPlayerData', () => ({
  createPreviewAuthController: () => ({
    state: { status: 'signedOut' },
    requestOtp: vi.fn(),
    signUpWithPassword: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn()
  }),
  createPreviewRuntime: (phase6: CloudRuntime['phase6']) => ({
    enabled: false,
    dataAccess: null,
    phase6
  })
}));

vi.mock('./league/demoLeagueData', () => ({
  createPreviewLeagueAuthController: () => ({
    state: { status: 'signedOut' },
    requestOtp: vi.fn(),
    signUpWithPassword: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn()
  }),
  createPreviewLeagueRuntime: (phase6: CloudRuntime['phase6']) => ({
    enabled: false,
    dataAccess: null,
    phase6
  })
}));

const runtimeWith = (phase6: Partial<CloudRuntime['phase6']>): CloudRuntime => ({
  enabled: true,
  dataAccess: {} as CloudRuntime['dataAccess'],
  phase6: {
    playerAppEnabled: false,
    leagueAppEnabled: false,
    leagueRequestEnabled: false,
    playerPreviewEnabled: false,
    leaguePreviewEnabled: false,
    chatEnabled: false,
    ...phase6
  }
});

describe('persona app shells', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens the Player account door when the production app flag is enabled', () => {
    mockState.runtime = runtimeWith({ playerAppEnabled: true });

    const html = renderToStaticMarkup(<PlayerAppShell />);

    expect(html).toContain('ACCOUNT_GATE');
    expect(html).toContain('Dumala Player');
    expect(html).not.toContain('PLAYER_APP_PREVIEW');
  });

  it('opens the League waitlist when the production app flag is enabled', () => {
    mockState.runtime = runtimeWith({ leagueAppEnabled: true });

    const html = renderToStaticMarkup(<LeagueAppShell />);

    expect(html).toContain('Join the private beta waitlist for Dumala league management.');
    expect(html).toContain('Join waitlist');
    expect(html).not.toContain('ACCOUNT_GATE');
    expect(html).not.toContain('LEAGUE_APP_PREVIEW');
  });

  it('opens the Player preview dashboard only when the preview flag is enabled', () => {
    mockState.runtime = runtimeWith({ playerPreviewEnabled: true });

    const html = renderToStaticMarkup(<PlayerAppShell />);

    expect(html).toContain('PLAYER_APP_PREVIEW');
    expect(html).not.toContain('ACCOUNT_GATE');
  });

  it('opens the League preview dashboard only when the preview flag is enabled', () => {
    mockState.runtime = runtimeWith({ leaguePreviewEnabled: true });

    const html = renderToStaticMarkup(<LeagueAppShell />);

    expect(html).toContain('LEAGUE_APP_PREVIEW');
    expect(html).not.toContain('ACCOUNT_GATE');
  });
});
