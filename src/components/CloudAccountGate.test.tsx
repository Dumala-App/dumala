import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  bootstrapSignedInCloudAccount,
  CloudAccountGate,
  submitCloudAccountEmail,
  submitCloudGoogleSignIn,
  submitCloudPasswordRegistration,
  submitCloudPasswordSignIn
} from './CloudAccountGate';
import type { CloudAuthController } from '../hooks/useCloudAuth';
import type { CloudRuntime } from '../cloud/runtime';

const signedOutAuth = (): CloudAuthController => ({
  state: { status: 'signedOut' },
  requestOtp: vi.fn(),
  signUpWithPassword: vi.fn(),
  signInWithPassword: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn()
});

describe('CloudAccountGate', () => {
  it('renders nothing when cloud runtime is disabled', () => {
    const html = renderToStaticMarkup(
      <CloudAccountGate
        runtime={{ enabled: false, dataAccess: null }}
        authController={signedOutAuth()}
      />
    );

    expect(html).toBe('');
  });

  it('renders email/password and Google sign-in options when signed out', () => {
    const runtime = {
      enabled: true,
      dataAccess: { auth: {}, account: {} }
    } as CloudRuntime;

    const html = renderToStaticMarkup(
      <CloudAccountGate
        runtime={runtime}
        authController={signedOutAuth()}
      />
    );

    expect(html).toContain('Cloud account');
    expect(html).toContain('coach@example.com');
    expect(html).toContain('Sign in');
    expect(html).toContain('Create account');
    expect(html).toContain('Email link');
    expect(html).toContain('Continue with Google');
  });

  it('submits OTP requests through the auth controller boundary', async () => {
    const requestOtp = vi.fn().mockResolvedValue(undefined);

    await submitCloudAccountEmail('coach@example.com', requestOtp, 'https://dumala.test/auth');

    expect(requestOtp).toHaveBeenCalledWith('coach@example.com', 'https://dumala.test/auth');
  });

  it('submits password sign-in through the auth controller boundary', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue(undefined);

    await submitCloudPasswordSignIn('coach@example.com', 'secure-pass-1', signInWithPassword);

    expect(signInWithPassword).toHaveBeenCalledWith('coach@example.com', 'secure-pass-1');
  });

  it('submits password registration through the auth controller boundary', async () => {
    const signUpWithPassword = vi.fn().mockResolvedValue(undefined);

    await submitCloudPasswordRegistration('coach@example.com', 'secure-pass-1', signUpWithPassword, 'https://dumala.test/auth');

    expect(signUpWithPassword).toHaveBeenCalledWith('coach@example.com', 'secure-pass-1', 'https://dumala.test/auth');
  });

  it('starts Google sign-in through the auth controller boundary', async () => {
    const signInWithGoogle = vi.fn().mockResolvedValue(undefined);

    await submitCloudGoogleSignIn(signInWithGoogle, 'https://dumala.test/auth');

    expect(signInWithGoogle).toHaveBeenCalledWith('https://dumala.test/auth');
  });

  it('bootstraps account records after sign-in through the account repository', async () => {
    const ensureBootstrap = vi.fn().mockResolvedValue(undefined);
    const runtime = {
      enabled: true,
      dataAccess: { account: { ensureBootstrap } }
    } as unknown as Extract<CloudRuntime, { enabled: true }>;

    await bootstrapSignedInCloudAccount(
      runtime,
      {
        status: 'signedIn',
        session: {
          userId: 'user-1',
          email: 'coach@example.com'
        }
      },
      'Dumala FC',
      '0.0.0'
    );

    expect(ensureBootstrap).toHaveBeenCalledWith(expect.objectContaining({
      clubName: 'Dumala FC',
      deviceId: 'server-rendered-device',
      displayName: 'coach@example.com',
      appVersion: '0.0.0'
    }));
  });
});
