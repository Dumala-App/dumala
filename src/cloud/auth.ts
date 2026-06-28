import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { DumalaSupabaseClient } from './client';

export interface CloudAuthSession {
  userId: string;
  email?: string;
  lastSignInAt?: string;
  assuranceLevel?: string | null;
}

export interface MfaFactor {
  id: string;
  friendlyName?: string;
  factorType: 'totp' | 'phone' | 'webauthn' | string;
  status: 'verified' | 'unverified' | string;
  createdAt: string;
  updatedAt: string;
  lastChallengedAt?: string;
}

export interface MfaAssurance {
  currentLevel: string | null;
  nextLevel: string | null;
}

export interface TotpEnrollment {
  factorId: string;
  friendlyName?: string;
  qrCode: string;
  secret: string;
  uri: string;
}

export interface MfaChallenge {
  challengeId: string;
  expiresAt: number;
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

const parseJwtPayload = (token?: string): Record<string, unknown> | null => {
  if (!token) return null;
  const [, payload] = token.split('.');
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=');
    const decoded = globalThis.atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const toCloudAuthState = (session: Session | null): AuthState => {
  const user = session?.user;
  if (!user) return { status: 'signedOut' };
  const claims = parseJwtPayload(session.access_token);
  const assuranceLevel = typeof claims?.aal === 'string' ? claims.aal : null;

  return {
    status: 'signedIn',
    session: {
      userId: user.id,
      email: user.email,
      lastSignInAt: user.last_sign_in_at,
      assuranceLevel
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

export const getAuthenticatorAssuranceLevel = async (client: DumalaSupabaseClient): Promise<MfaAssurance> => {
  const { data, error } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) {
    throw new CloudAuthError(`Failed to read MFA assurance level: ${getErrorMessage(error)}`, 'AUTH_MFA_AAL_READ_FAILED', error);
  }

  return {
    currentLevel: data.currentLevel,
    nextLevel: data.nextLevel
  };
};

export const listMfaFactors = async (client: DumalaSupabaseClient): Promise<MfaFactor[]> => {
  const { data, error } = await client.auth.mfa.listFactors();
  if (error) {
    throw new CloudAuthError(`Failed to list MFA factors: ${getErrorMessage(error)}`, 'AUTH_MFA_FACTORS_READ_FAILED', error);
  }

  return data.all.map(factor => ({
    id: factor.id,
    friendlyName: factor.friendly_name,
    factorType: factor.factor_type,
    status: factor.status,
    createdAt: factor.created_at,
    updatedAt: factor.updated_at,
    lastChallengedAt: factor.last_challenged_at
  }));
};

export const enrollTotpFactor = async (
  client: DumalaSupabaseClient,
  friendlyName = 'Dumala Admin Console'
): Promise<TotpEnrollment> => {
  const { data, error } = await client.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName,
    issuer: 'Dumala'
  });
  if (error) {
    throw new CloudAuthError(`Failed to enroll authenticator app: ${getErrorMessage(error)}`, 'AUTH_MFA_ENROLL_FAILED', error);
  }

  return {
    factorId: data.id,
    friendlyName: data.friendly_name,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri
  };
};

export const challengeMfaFactor = async (client: DumalaSupabaseClient, factorId: string): Promise<MfaChallenge> => {
  const { data, error } = await client.auth.mfa.challenge({ factorId });
  if (error) {
    throw new CloudAuthError(`Failed to start MFA challenge: ${getErrorMessage(error)}`, 'AUTH_MFA_CHALLENGE_FAILED', error);
  }

  return {
    challengeId: data.id,
    expiresAt: data.expires_at
  };
};

export const verifyMfaChallenge = async (
  client: DumalaSupabaseClient,
  factorId: string,
  challengeId: string,
  code: string
): Promise<void> => {
  const { error } = await client.auth.mfa.verify({
    factorId,
    challengeId,
    code: code.trim()
  });
  if (error) {
    throw new CloudAuthError(`Failed to verify MFA code: ${getErrorMessage(error)}`, 'AUTH_MFA_VERIFY_FAILED', error);
  }
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
