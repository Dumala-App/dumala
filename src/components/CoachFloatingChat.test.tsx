import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CloudRuntime } from '../cloud/runtime';
import type { CloudAuthController } from '../hooks/useCloudAuth';
import CoachFloatingChat from './CoachFloatingChat';

let mockRuntime: CloudRuntime;
let mockAuth: CloudAuthController;

vi.mock('../hooks/useCloudRuntime', () => ({
  useCloudRuntime: () => mockRuntime
}));

vi.mock('../hooks/useCloudAuth', () => ({
  useCloudAuth: () => mockAuth
}));

const phase6 = {
  playerAppEnabled: false,
  leagueAppEnabled: false,
  leagueRequestEnabled: false,
  playerPreviewEnabled: false,
  leaguePreviewEnabled: false,
  chatEnabled: true
};

describe('CoachFloatingChat', () => {
  beforeEach(() => {
    mockRuntime = {
      enabled: true,
      phase6,
      dataAccess: {
        auth: {},
        chat: {}
      }
    } as CloudRuntime;
    mockAuth = {
      state: {
        status: 'signedIn',
        session: {
          userId: 'coach-1',
          email: 'coach@example.com'
        }
      },
      requestOtp: vi.fn(),
      signUpWithPassword: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn()
    };
  });

  it('renders a persistent coach chat launcher for cloud-backed teams', () => {
    const html = renderToStaticMarkup(<CoachFloatingChat clubId="club-1" />);

    expect(html).toContain('Open team chat');
    expect(html).toContain('fixed bottom-4 right-4');
  });

  it('stays hidden without a cloud club or enabled chat flag', () => {
    expect(renderToStaticMarkup(<CoachFloatingChat clubId={null} />)).toBe('');

    mockRuntime = {
      enabled: true,
      phase6: { ...phase6, chatEnabled: false },
      dataAccess: {
        auth: {},
        chat: {}
      }
    } as CloudRuntime;

    expect(renderToStaticMarkup(<CoachFloatingChat clubId="club-1" />)).toBe('');
  });
});
