import { describe, expect, it, vi } from 'vitest';
import type { DumalaSupabaseClient } from './client';
import { getSession, requestOtp, signOut, subscribeToAuthChanges } from './auth';

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

  it('maps the current Supabase session to a React-facing auth state', async () => {
    const getSessionRequest = vi.fn().mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'user-1',
            email: 'coach@example.com',
            last_sign_in_at: '2026-06-26T01:00:00.000Z'
          }
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
        lastSignInAt: '2026-06-26T01:00:00.000Z'
      }
    });
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

