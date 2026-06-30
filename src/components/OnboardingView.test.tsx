import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { CloudRuntime } from '../cloud/runtime';
import type { CloudAuthController } from '../hooks/useCloudAuth';
import OnboardingView from './OnboardingView';

const signedOutAuth: CloudAuthController = {
  state: { status: 'signedOut' },
  requestOtp: vi.fn(),
  signUpWithPassword: vi.fn(),
  signInWithPassword: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn()
};

const renderOnboarding = (cloudRuntime: CloudRuntime) => renderToStaticMarkup(
  <OnboardingView
    onComplete={vi.fn()}
    cloudRuntime={cloudRuntime}
    cloudAuthController={signedOutAuth}
  />
);

describe('OnboardingView cloud account entry', () => {
  it('offers returning coaches cloud sign-in while preserving local setup', () => {
    const runtime = {
      enabled: true,
      dataAccess: {
        auth: {},
        account: {}
      }
    } as CloudRuntime;

    const html = renderOnboarding(runtime);

    expect(html).toContain('Start with Dumala Cloud');
    expect(html).toContain('Continue with Google');
    expect(html).toContain('Google is the fastest way');
    expect(html).toContain('Use email instead');
    expect(html).not.toContain('coach@example.com');
    expect(html).toContain('Official team name');
    expect(html).toContain('Centermall Grounds');
    expect(html).toContain('Portuseros FC');
    expect(html).toContain('2012');
    expect(html).toContain('League 1');
    expect(html).toContain('Confirm Identity');
  });

  it('explains that registration is unavailable while preserving local setup when cloud is disabled', () => {
    const html = renderOnboarding({ enabled: false, dataAccess: null });

    expect(html).toContain('Start with Dumala Cloud');
    expect(html).toContain('Cloud registration is unavailable in this build');
    expect(html).not.toContain('coach@example.com');
    expect(html).toContain('Official team name');
    expect(html).toContain('Confirm Identity');
  });
});
