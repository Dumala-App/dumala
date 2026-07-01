import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { CloudRuntime } from '../cloud/runtime';
import type { CloudAuthController } from '../hooks/useCloudAuth';
import WorkspaceStatusBar from './WorkspaceStatusBar';

const signedOutAuth: CloudAuthController = {
  state: { status: 'signedOut' },
  requestOtp: vi.fn(),
  signUpWithPassword: vi.fn(),
  signInWithPassword: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn()
};

const signedInAuth: CloudAuthController = {
  ...signedOutAuth,
  state: {
    status: 'signedIn',
    session: {
      userId: 'user-1',
      email: 'coach@example.com'
    }
  }
};

const renderStatus = (
  cloudRuntime: CloudRuntime,
  cloudAuthController: CloudAuthController = signedOutAuth
) => renderToStaticMarkup(
  <WorkspaceStatusBar
    teamName="Barbados FC 2026"
    cloudRuntime={cloudRuntime}
    cloudAuthController={cloudAuthController}
    resetOpen={false}
    onResetOpenChange={vi.fn()}
    onFeedback={vi.fn()}
    onConfirmReset={vi.fn()}
  />
);

describe('WorkspaceStatusBar', () => {
  it('organizes local workspace actions and cloud sign-in in one status surface', () => {
    const html = renderStatus({
      enabled: true,
      dataAccess: {
        auth: {},
        account: {}
      }
    } as CloudRuntime);

    expect(html).toContain('Continue with Google');
    expect(html).toContain('Use email instead');
    expect(html).not.toContain('coach@example.com');
    expect(html).toContain('Install Dumala');
    expect(html).toContain('Feedback');
    expect(html).toContain('Reset');
    expect(html).not.toContain('Saved locally');
  });

  it('keeps the status bar local-first when cloud accounts are disabled', () => {
    const html = renderStatus({ enabled: false, dataAccess: null });

    expect(html).toContain('Workspace ready');
    expect(html).toContain('Install Dumala');
    expect(html).not.toContain('coach@example.com');
    expect(html).not.toContain('Saved locally');
  });

  it('shows sign out controls from the shared signed-in cloud session', () => {
    const html = renderStatus({
      enabled: true,
      dataAccess: {
        auth: {},
        account: {}
      }
    } as CloudRuntime, signedInAuth);

    expect(html).toContain('Cloud connected');
    expect(html).toContain('Sign out');
    expect(html).not.toContain('Continue with Google');
  });
});
