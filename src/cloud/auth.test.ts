import { describe, expect, it, vi } from 'vitest';
import type { DumalaSupabaseClient } from './client';
import {
  challengeMfaFactor,
  enrollTotpFactor,
  getAuthenticatorAssuranceLevel,
  getSession,
  listMfaFactors,
  requestOtp,
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
  signOut,
  subscribeToAuthChanges,
  verifyMfaChallenge
} from './auth';

describe('cloud auth service', () => {
  it('requests passwordless OTP with normalized email and redirect', async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: null });
    const client = { auth: { signInWithOtp } } as unknown as DumalaSupabaseClient;

    await requestOtp(client, ' Coach@Example.COM ', 'https://dumala.test/auth');

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'coach@example.com',
      options: { emailRedirectTo: 'https://dumala.test/auth' }
    });
  });

  it('registers a coach with email and password', async () => {
    const signUp = vi.fn().mockResolvedValue({ error: null });
    const client = { auth: { signUp } } as unknown as DumalaSupabaseClient;

    await signUpWithPassword(client, ' Coach@Example.COM ', 'secure-pass-1', 'https://dumala.test/auth');

    expect(signUp).toHaveBeenCalledWith({
      email: 'coach@example.com',
      password: 'secure-pass-1',
      options: { emailRedirectTo: 'https://dumala.test/auth' }
    });
  });

  it('signs a returning coach in with email and password', async () => {
    const signInWithPasswordRequest = vi.fn().mockResolvedValue({ error: null });
    const client = { auth: { signInWithPassword: signInWithPasswordRequest } } as unknown as DumalaSupabaseClient;

    await signInWithPassword(client, ' Coach@Example.COM ', 'secure-pass-1');

    expect(signInWithPasswordRequest).toHaveBeenCalledWith({
      email: 'coach@example.com',
      password: 'secure-pass-1'
    });
  });

  it('starts Google OAuth sign-in with the app redirect URL', async () => {
    const signInWithOAuth = vi.fn().mockResolvedValue({ error: null });
    const client = { auth: { signInWithOAuth } } as unknown as DumalaSupabaseClient;

    await signInWithGoogle(client, 'https://dumala.test/auth');

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'https://dumala.test/auth' }
    });
  });

  it('maps the current Supabase session to a React-facing auth state', async () => {
    const getSessionRequest = vi.fn().mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'user-1',
            email: 'coach@example.com',
            last_sign_in_at: '2026-06-26T01:00:00.000Z'
          },
          access_token: `header.${Buffer.from(JSON.stringify({ aal: 'aal1' })).toString('base64url')}.signature`
        }
      },
      error: null
    });
    const client = { auth: { getSession: getSessionRequest } } as unknown as DumalaSupabaseClient;

    await expect(getSession(client)).resolves.toEqual({
      status: 'signedIn',
      session: {
        userId: 'user-1',
        email: 'coach@example.com',
        lastSignInAt: '2026-06-26T01:00:00.000Z',
        assuranceLevel: 'aal1'
      }
    });
  });

  it('wraps Supabase TOTP MFA enrollment and verification helpers', async () => {
    const enroll = vi.fn().mockResolvedValue({
      data: {
        id: 'factor-1',
        friendly_name: 'Dumala Admin Console',
        totp: {
          qr_code: 'data:image/svg+xml;utf-8,<svg />',
          secret: 'SECRET',
          uri: 'otpauth://totp/Dumala'
        }
      },
      error: null
    });
    const challenge = vi.fn().mockResolvedValue({ data: { id: 'challenge-1', expires_at: 123 }, error: null });
    const verify = vi.fn().mockResolvedValue({ data: {}, error: null });
    const getAuthenticatorAssuranceLevelRequest = vi.fn().mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2' },
      error: null
    });
    const listFactors = vi.fn().mockResolvedValue({
      data: {
        all: [{
          id: 'factor-1',
          friendly_name: 'Dumala Admin Console',
          factor_type: 'totp',
          status: 'verified',
          created_at: '2026-06-28T01:00:00.000Z',
          updated_at: '2026-06-28T01:00:00.000Z'
        }]
      },
      error: null
    });
    const client = {
      auth: {
        mfa: {
          enroll,
          challenge,
          verify,
          getAuthenticatorAssuranceLevel: getAuthenticatorAssuranceLevelRequest,
          listFactors
        }
      }
    } as unknown as DumalaSupabaseClient;

    await expect(enrollTotpFactor(client)).resolves.toMatchObject({ factorId: 'factor-1', secret: 'SECRET' });
    await expect(challengeMfaFactor(client, 'factor-1')).resolves.toEqual({ challengeId: 'challenge-1', expiresAt: 123 });
    await expect(verifyMfaChallenge(client, 'factor-1', 'challenge-1', '123456')).resolves.toBeUndefined();
    await expect(getAuthenticatorAssuranceLevel(client)).resolves.toEqual({ currentLevel: 'aal1', nextLevel: 'aal2' });
    await expect(listMfaFactors(client)).resolves.toEqual([{
      id: 'factor-1',
      friendlyName: 'Dumala Admin Console',
      factorType: 'totp',
      status: 'verified',
      createdAt: '2026-06-28T01:00:00.000Z',
      updatedAt: '2026-06-28T01:00:00.000Z',
      lastChallengedAt: undefined
    }]);
  });

  it('signs out through Supabase Auth', async () => {
    const signOutRequest = vi.fn().mockResolvedValue({ error: null });
    const client = { auth: { signOut: signOutRequest } } as unknown as DumalaSupabaseClient;

    await signOut(client);

    expect(signOutRequest).toHaveBeenCalledOnce();
  });

  it('subscribes to auth changes and exposes an unsubscribe boundary', () => {
    const unsubscribe = vi.fn();
    const onAuthStateChange = vi.fn((_handler) => ({ data: { subscription: { unsubscribe } } }));
    const client = { auth: { onAuthStateChange } } as unknown as DumalaSupabaseClient;
    const onChange = vi.fn();

    const stop = subscribeToAuthChanges(client, onChange);
    stop();

    expect(onAuthStateChange).toHaveBeenCalledOnce();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
