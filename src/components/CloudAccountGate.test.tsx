import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  bootstrapSignedInCloudAccount,
  CloudAccountGate,
  submitCloudAccountEmail
} from './CloudAccountGate';
import type { CloudAuthController } from '../hooks/useCloudAuth';
import type { CloudRuntime } from '../cloud/runtime';

const signedOutAuth = (): CloudAuthController => ({
  state: { status: 'signedOut' },
  requestOtp: vi.fn(),
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

  it('renders a compact passwordless email form when signed out', () => {
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
    expect(html).toContain('Send link');
  });

  it('submits OTP requests through the auth controller boundary', async () => {
    const requestOtp = vi.fn().mockResolvedValue(undefined);

    await submitCloudAccountEmail('coach@example.com', requestOtp, 'https://dumala.test/auth');

    expect(requestOtp).toHaveBeenCalledWith('coach@example.com', 'https://dumala.test/auth');
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

