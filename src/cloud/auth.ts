import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { DumalaSupabaseClient } from './client';

export interface CloudAuthSession {
  userId: string;
  email?: string;
  lastSignInAt?: string;
}

export type AuthState =
  | { status: 'disabled' }
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; session: CloudAuthSession }
  | { status: 'error'; message: string };

export type CloudAuthChangeHandler = (state: AuthState) => void;

export class CloudAuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'CloudAuthError';
  }
}

const getErrorMessage = (error: unknown) => {
  if (!error) return 'Unknown Supabase auth error.';
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message);
  return String(error);
};

export const toCloudAuthState = (session: Session | null): AuthState => {
  const user = session?.user;
  if (!user) return { status: 'signedOut' };

  return {
    status: 'signedIn',
    session: {
      userId: user.id,
      email: user.email,
      lastSignInAt: user.last_sign_in_at
    }
  };
};

export const requestOtp = async (
  client: DumalaSupabaseClient,
  email: string,
  redirectTo?: string
): Promise<void> => {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) throw new CloudAuthError('Email is required to request a sign-in link.', 'AUTH_EMAIL_REQUIRED');

  const { error } = await client.auth.signInWithOtp({
    email: normalizedEmail,
    options: redirectTo ? { emailRedirectTo: redirectTo } : undefined
  });

  if (error) {
    throw new CloudAuthError(`Failed to request sign-in link: ${getErrorMessage(error)}`, 'AUTH_OTP_REQUEST_FAILED', error);
  }
};

export const signOut = async (client: DumalaSupabaseClient): Promise<void> => {
  const { error } = await client.auth.signOut();
  if (error) throw new CloudAuthError(`Failed to sign out: ${getErrorMessage(error)}`, 'AUTH_SIGN_OUT_FAILED', error);
};

export const getSession = async (client: DumalaSupabaseClient): Promise<AuthState> => {
  const { data, error } = await client.auth.getSession();
  if (error) {
    throw new CloudAuthError(`Failed to read auth session: ${getErrorMessage(error)}`, 'AUTH_SESSION_READ_FAILED', error);
  }

  return toCloudAuthState(data.session);
};

export const subscribeToAuthChanges = (
  client: DumalaSupabaseClient,
  onChange: CloudAuthChangeHandler
): (() => void) => {
  const { data } = client.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
    onChange(toCloudAuthState(session));
  });

  return () => data.subscription.unsubscribe();
};

