import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { CloudRuntime } from '../cloud/runtime';
import type { CloudAuthController } from '../hooks/useCloudAuth';
import OnboardingView from './OnboardingView';

const runtime = {
  enabled: true,
  dataAccess: {
    auth: {},
    account: {}
  }
} as CloudRuntime;

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
      email: 'coach@example.com',
      displayName: 'Coach Google',
      avatarUrl: 'https://example.com/avatar.png'
    }
  }
};

const renderOnboarding = (
  cloudRuntime: CloudRuntime,
  authController: CloudAuthController = signedOutAuth,
  isReturningUser = false
) => renderToStaticMarkup(
  <OnboardingView
    onComplete={vi.fn()}
    cloudRuntime={cloudRuntime}
    cloudAuthController={authController}
    onCloudOnboardingComplete={vi.fn()}
    isReturningUser={isReturningUser}
  />
);

describe('OnboardingView account-first flow', () => {
  it('shows first-time account creation before club identity', () => {
    const html = renderOnboarding(runtime);

    expect(html).toContain('Create your account');
    expect(html).toContain('Create account with email');
    expect(html).not.toContain('Continue with Google');
    expect(html).not.toContain('Your club identity');
    expect(html).not.toContain('Official team name');
    expect(html).not.toContain('Continue locally');
  });

  it('shows the returning sign-in entry for returning users', () => {
    const html = renderOnboarding(runtime, signedOutAuth, true);

    expect(html).not.toContain('Welcome back');
    expect(html).toContain('Continue with Google');
    expect(html).toContain('Sign in with email');
    expect(html).not.toContain('Your club identity');
  });

  it('reveals club identity and sample team choices after sign-in', () => {
    const html = renderOnboarding(runtime, signedInAuth);

    expect(html).toContain('Account');
    expect(html).toContain('Your club identity');
    expect(html).toContain('Official team name');
    expect(html).toContain('Try a sample team');
    expect(html).toContain('Use sample team');
  });

  it('blocks local-only setup when cloud is unavailable', () => {
    const html = renderOnboarding({ enabled: false, dataAccess: null });

    expect(html).toContain('Cloud account required');
    expect(html).toContain('Enable Dumala Cloud');
    expect(html).not.toContain('Official team name');
    expect(html).not.toContain('Confirm Identity');
  });
});
