import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  bootstrapSignedInCloudAccount,
  CloudAccountGate,
  getAppAuthRedirectUrl,
  submitCloudAccountEmail,
  submitCloudGoogleSignIn,
  submitCloudPasswordRegistration,
  submitCloudPasswordSignIn,
  submitCloudSignOut
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
  it('builds app auth redirects without hash routing so OAuth can return to the coach app', () => {
    vi.stubGlobal('window', {
      location: {
        href: 'https://dumala.test/#/app'
      }
    });

    expect(getAppAuthRedirectUrl()).toBe('https://dumala.test/?dumalaAuth=app');

    vi.unstubAllGlobals();
  });

  it('renders nothing when cloud runtime is disabled', () => {
    const html = renderToStaticMarkup(
      <CloudAccountGate
        runtime={{ enabled: false, dataAccess: null }}
        authController={signedOutAuth()}
      />
    );

    expect(html).toBe('');
  });

  it('prioritizes Google sign-in and keeps email options as a fallback', () => {
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

    expect(html).toContain('Continue with Google');
    expect(html).toContain('Fastest for new and returning coaches.');
    expect(html).toContain('Use email instead');
    expect(html).not.toContain('coach@example.com');
    expect(html).not.toContain('Create account');
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

  it('signs out before handing control back to the app shell', async () => {
    const signOut = vi.fn().mockResolvedValue(undefined);
    const onSignedOut = vi.fn();

    await submitCloudSignOut(signOut, onSignedOut);

    expect(signOut).toHaveBeenCalledOnce();
    expect(onSignedOut).toHaveBeenCalledOnce();
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
