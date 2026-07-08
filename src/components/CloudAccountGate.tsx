import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, Chrome, KeyRound, Loader2, LogOut, Mail, UserPlus } from 'lucide-react';
import { useCloudAuth, type CloudAuthController } from '../hooks/useCloudAuth';
import { useCloudRuntime } from '../hooks/useCloudRuntime';
import type { AccountBootstrapInput, AccountBootstrapResult } from '../cloud/account';
import type { AuthState } from '../cloud/auth';
import type { CloudRuntime } from '../cloud/runtime';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const CLOUD_DEVICE_ID_KEY = 'dumala_cloud_device_id';
const APP_AUTH_CALLBACK_PARAM = 'dumalaAuth';
const APP_AUTH_PENDING_KEY = 'dumala_pending_app_auth_redirect';
const APP_AUTH_PENDING_TTL_MS = 10 * 60 * 1000;
export const ONBOARDING_INTENT_KEY = 'dumala_onboarding_intent';

export const markOnboardingIntent = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ONBOARDING_INTENT_KEY, Date.now().toString());
};

export const hasOnboardingIntent = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(ONBOARDING_INTENT_KEY) !== null;
};

export const getAppAuthRedirectUrl = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  const url = new URL(window.location.href);
  url.searchParams.set(APP_AUTH_CALLBACK_PARAM, 'app');
  url.hash = '';
  return url.toString();
};

export const markPendingAppAuthRedirect = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(APP_AUTH_PENDING_KEY, Date.now().toString());
};

export const hasPendingAppAuthRedirect = () => {
  if (typeof window === 'undefined') return false;
  const startedAt = Number(window.localStorage.getItem(APP_AUTH_PENDING_KEY));
  if (!Number.isFinite(startedAt) || startedAt <= 0) return false;
  if (Date.now() - startedAt > APP_AUTH_PENDING_TTL_MS) {
    window.localStorage.removeItem(APP_AUTH_PENDING_KEY);
    return false;
  }
  return true;
};

export const clearPendingAppAuthRedirect = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(APP_AUTH_PENDING_KEY);
};

export interface CloudAccountGateProps {
  clubName?: string;
  appVersion?: string;
  redirectTo?: string;
  bootstrapAccount?: boolean;
  tone?: 'light' | 'dark';
  layout?: 'default' | 'compact';
  audience?: 'coach' | 'admin';
  runtime?: CloudRuntime;
  authController?: CloudAuthController;
  onSignedOut?: () => void;
  onBootstrapComplete?: (result: AccountBootstrapResult) => void;
}

const cloudDeviceIdStorageKey = (userId?: string): string =>
  userId ? `${CLOUD_DEVICE_ID_KEY}:${userId}` : CLOUD_DEVICE_ID_KEY;

// Device IDs are namespaced per user so that two accounts signing in on the same
// browser never collide on the same `devices.id`. A shared, per-browser ID caused
// the second account's upsert to hit the UPDATE branch against a row owned by the
// first account, tripping the devices RLS policy (USING expression).
export const getOrCreateCloudDeviceId = (userId?: string): string => {
  if (typeof window === 'undefined') return 'server-rendered-device';

  const storageKey = cloudDeviceIdStorageKey(userId);

  // One-time cleanup of the legacy per-browser device ID. Its DB row is owned by
  // whichever account registered first on this browser, so we must NOT carry the
  // value into a user's namespace (that would re-collide and re-trip the RLS
  // policy for a different account). Just drop it — everyone gets a fresh ID and
  // the stale row is left orphaned but harmless.
  if (userId && window.localStorage.getItem(CLOUD_DEVICE_ID_KEY) !== null) {
    window.localStorage.removeItem(CLOUD_DEVICE_ID_KEY);
  }

  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const generated = typeof window.crypto?.randomUUID === 'function'
    ? window.crypto.randomUUID()
    : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(storageKey, generated);
  return generated;
};

export const submitCloudAccountEmail = async (
  email: string,
  requestOtp: CloudAuthController['requestOtp'],
  redirectTo?: string
): Promise<void> => {
  markOnboardingIntent();
  if (!redirectTo) markPendingAppAuthRedirect();
  redirectTo ??= getAppAuthRedirectUrl();
  await requestOtp(email, redirectTo);
};

export const submitCloudPasswordSignIn = async (
  email: string,
  password: string,
  signInWithPassword: CloudAuthController['signInWithPassword']
): Promise<void> => {
  markOnboardingIntent();
  await signInWithPassword(email, password);
};

export const submitCloudPasswordRegistration = async (
  email: string,
  password: string,
  signUpWithPassword: CloudAuthController['signUpWithPassword'],
  redirectTo?: string
): Promise<void> => {
  markOnboardingIntent();
  if (!redirectTo) markPendingAppAuthRedirect();
  redirectTo ??= getAppAuthRedirectUrl();
  await signUpWithPassword(email, password, redirectTo);
};

export const submitCloudGoogleSignIn = async (
  signInWithGoogle: CloudAuthController['signInWithGoogle'],
  redirectTo?: string
): Promise<void> => {
  markOnboardingIntent();
  if (!redirectTo) markPendingAppAuthRedirect();
  redirectTo ??= getAppAuthRedirectUrl();
  await signInWithGoogle(redirectTo);
};

export const submitCloudSignOut = async (
  signOut: CloudAuthController['signOut'],
  onSignedOut?: () => void
): Promise<void> => {
  await signOut();
  onSignedOut?.();
};

export const buildAccountBootstrapInput = (
  state: Extract<AuthState, { status: 'signedIn' }>,
  clubName = 'Dumala Club',
  appVersion = '0.0.0'
): AccountBootstrapInput => ({
  clubName,
  deviceId: getOrCreateCloudDeviceId(state.session.userId),
  deviceLabel: typeof navigator === 'undefined' ? 'Dumala web session' : navigator.userAgent.slice(0, 120),
  appVersion,
  displayName: state.session.displayName ?? state.session.email,
  now: new Date()
});

export const bootstrapSignedInCloudAccount = (
  runtime: Extract<CloudRuntime, { enabled: true }>,
  state: Extract<AuthState, { status: 'signedIn' }>,
  clubName?: string,
  appVersion?: string
) => runtime.dataAccess.account.ensureBootstrap(buildAccountBootstrapInput(state, clubName, appVersion));

export const CloudAccountGate = ({
  clubName,
  appVersion,
  redirectTo,
  bootstrapAccount = true,
  tone = 'light',
  layout = 'default',
  audience = 'coach',
  runtime: runtimeOverride,
  authController: authControllerOverride,
  onSignedOut,
  onBootstrapComplete
}: CloudAccountGateProps) => {
  const liveRuntime = useCloudRuntime();
  const runtime = runtimeOverride ?? liveRuntime;
  const liveAuth = useCloudAuth({
    enabled: !authControllerOverride && runtime.enabled,
    auth: !authControllerOverride ? runtime.dataAccess?.auth ?? null : null
  });
  const auth = authControllerOverride ?? liveAuth;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signIn' | 'register' | 'magicLink'>('signIn');
  const [emailFallbackOpen, setEmailFallbackOpen] = useState(false);
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const bootstrappedUsers = useRef(new Set<string>());
  const dark = tone === 'dark';
  const compact = layout === 'compact';
  const isAdmin = audience === 'admin';
  const emailPlaceholder = isAdmin ? 'owner@example.com' : 'coach@example.com';
  const connectedLabel = isAdmin ? 'Admin account connected' : compact ? 'Cloud connected' : 'Cloud account connected';
  const googleHelper = isAdmin ? 'Owner access only.' : 'Fastest for new and returning coaches.';

  useEffect(() => {
    if (!bootstrapAccount) return;
    if (!runtime.enabled || auth.state.status !== 'signedIn') {
      bootstrappedUsers.current.clear();
      return;
    }
    if (bootstrappedUsers.current.has(auth.state.session.userId)) return;
    bootstrappedUsers.current.add(auth.state.session.userId);

    bootstrapSignedInCloudAccount(runtime, auth.state, clubName, appVersion)
      .then(result => onBootstrapComplete?.(result))
      .catch(error => {
        bootstrappedUsers.current.delete(auth.state.status === 'signedIn' ? auth.state.session.userId : '');
        setMessage(error instanceof Error ? error.message : 'Cloud account setup could not finish.');
      });
  }, [appVersion, auth.state, bootstrapAccount, clubName, onBootstrapComplete, runtime]);

  if (!runtime.enabled) return null;

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState('sending');
    setMessage('');

    try {
      if (mode === 'register') {
        await submitCloudPasswordRegistration(email, password, auth.signUpWithPassword, redirectTo);
        setMessage('Account created. Confirm your email if Supabase requires verification, then sign in.');
      } else {
        await submitCloudPasswordSignIn(email, password, auth.signInWithPassword);
        setMessage('Signed in to your Dumala cloud account.');
      }
      setSubmitState('sent');
    } catch (error) {
      setSubmitState('error');
      setMessage(error instanceof Error ? error.message : 'Could not complete cloud account sign-in.');
    }
  };

  const handleMagicLinkSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState('sending');
    setMessage('');

    try {
      await submitCloudAccountEmail(email, auth.requestOtp, redirectTo);
      setSubmitState('sent');
      setMessage('Check your email for the Dumala sign-in link.');
    } catch (error) {
      setSubmitState('error');
      setMessage(error instanceof Error ? error.message : 'Could not send the sign-in link.');
    }
  };

  const handleGoogleSignIn = async () => {
    setSubmitState('sending');
    setMessage('');

    try {
      await submitCloudGoogleSignIn(auth.signInWithGoogle, redirectTo);
      setSubmitState('sent');
      setMessage('Redirecting to Google sign-in.');
    } catch (error) {
      setSubmitState('error');
      setMessage(error instanceof Error ? error.message : 'Could not start Google sign-in.');
    }
  };

  const handleSignOut = async () => {
    setSubmitState('sending');
    setMessage('');

    try {
      await submitCloudSignOut(auth.signOut, onSignedOut);
    } catch (error) {
      setSubmitState('error');
      setMessage(error instanceof Error ? error.message : 'Could not sign out.');
    }
  };

  if (auth.state.status === 'loading') {
    return (
      <section aria-label="Cloud account" className={`rounded-lg border px-3 py-2 text-xs font-semibold ${dark ? 'border-slate-700 bg-[#050b14] text-slate-300' : compact ? 'border-border/70 bg-muted/40 text-muted-foreground' : 'border-slate-200 bg-white text-slate-600 shadow-sm'}`}>
        <span className="inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Checking cloud account</span>
      </section>
    );
  }

  if (auth.state.status === 'signedIn') {
    return (
      <section aria-label="Cloud account" className={`rounded-lg border px-3 py-2 text-xs font-semibold ${dark ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : compact ? 'border-emerald-200 bg-emerald-50/80 text-emerald-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm'}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} /> {connectedLabel}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void handleSignOut()} disabled={submitState === 'sending'} className={`h-7 gap-1 rounded-md px-2 text-[11px] [&_svg]:size-3 ${dark ? 'border-emerald-400/30 bg-transparent text-emerald-100 hover:bg-emerald-400/10 hover:text-white' : 'border-emerald-200 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900'}`}>
            {submitState === 'sending' ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />} Sign out
          </Button>
        </div>
        {message && <p className="mt-1 text-[11px] text-amber-700">{message}</p>}
      </section>
    );
  }

  return (
    <section aria-label="Cloud account" className={`rounded-xl border px-3 py-3 ${dark ? 'border-cyan-300/15 bg-[#050b14]/90' : compact ? 'border-border/70 bg-muted/40' : 'border-slate-200 bg-white shadow-sm'}`}>
      <Button
        type="button"
        onClick={() => void handleGoogleSignIn()}
        disabled={submitState === 'sending'}
        className={`h-10 w-full gap-2 rounded-lg text-sm font-black shadow-lg disabled:bg-slate-600 [&_svg]:size-4 ${dark ? 'bg-white text-slate-950 shadow-cyan-950/20 hover:bg-cyan-50' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
      >
        {submitState === 'sending' ? <Loader2 size={15} className="animate-spin" /> : <Chrome size={15} />}
        Continue with Google
      </Button>
      <p className={`mt-2 text-center text-[10px] leading-4 ${dark ? 'text-slate-500' : 'text-muted-foreground'}`}>
        {googleHelper}
      </p>

      <button
        type="button"
        onClick={() => {
          setEmailFallbackOpen(current => !current);
          setMessage('');
          setSubmitState('idle');
        }}
        className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-bold transition ${dark ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-100' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
        aria-expanded={emailFallbackOpen}
      >
        Use email instead
        <ChevronDown size={12} className={`transition-transform ${emailFallbackOpen ? 'rotate-180' : ''}`} />
      </button>

      {emailFallbackOpen && (
        <div className={`mt-2 rounded-lg border p-2 ${dark ? 'border-slate-800 bg-slate-950/70' : 'border-border bg-background/70'}`}>
          <div className={`mb-2 grid gap-1 rounded-md bg-slate-900/60 p-1 ${isAdmin ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {(isAdmin ? [
              ['signIn', 'Sign in', KeyRound],
              ['magicLink', 'Link', Mail]
            ] as const : [
              ['signIn', 'Sign in', KeyRound],
              ['register', 'Create', UserPlus],
              ['magicLink', 'Link', Mail]
            ] as const).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setMode(value);
                  setMessage('');
                  setSubmitState('idle');
                }}
                className={`inline-flex h-7 items-center justify-center gap-1 rounded px-1.5 text-[10px] font-bold transition ${mode === value
                  ? dark ? 'bg-cyan-500 text-slate-950' : 'bg-primary text-primary-foreground'
                  : dark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-100' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon size={11} /> {label}
              </button>
            ))}
          </div>

          {mode === 'magicLink' ? (
            <form onSubmit={handleMagicLinkSubmit} className="grid gap-2">
              <Label htmlFor="cloud-account-email" className={`text-[11px] normal-case tracking-normal ${dark ? 'text-slate-300' : 'text-slate-700'}`}>Email address</Label>
              <Input
                id="cloud-account-email"
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder={emailPlaceholder}
                className={`h-9 min-w-0 rounded-md px-2.5 text-xs ${dark ? 'border-slate-700 bg-[#07111f] text-slate-100 placeholder:text-slate-500 focus-visible:border-cyan-400 focus-visible:ring-cyan-400/20' : 'focus-visible:border-indigo-400 focus-visible:ring-indigo-100'}`}
                required
              />
              <Button
                type="submit"
                size="sm"
                disabled={submitState === 'sending'}
                className={`h-9 gap-1 rounded-md px-2.5 text-xs text-white disabled:bg-slate-500 [&_svg]:size-3.5 ${dark ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {submitState === 'sending' ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
                Send link
              </Button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="grid gap-2">
              <Label htmlFor="cloud-account-email" className={`text-[11px] normal-case tracking-normal ${dark ? 'text-slate-300' : 'text-slate-700'}`}>Email address</Label>
              <Input
                id="cloud-account-email"
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder={emailPlaceholder}
                className={`h-9 min-w-0 rounded-md px-2.5 text-xs ${dark ? 'border-slate-700 bg-[#07111f] text-slate-100 placeholder:text-slate-500 focus-visible:border-cyan-400 focus-visible:ring-cyan-400/20' : 'focus-visible:border-indigo-400 focus-visible:ring-indigo-100'}`}
                required
              />
              <Input
                id="cloud-account-password"
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="Password"
                minLength={mode === 'register' ? 8 : undefined}
                className={`h-9 min-w-0 rounded-md px-2.5 text-xs ${dark ? 'border-slate-700 bg-[#07111f] text-slate-100 placeholder:text-slate-500 focus-visible:border-cyan-400 focus-visible:ring-cyan-400/20' : 'focus-visible:border-indigo-400 focus-visible:ring-indigo-100'}`}
                required
              />
              <Button
                type="submit"
                size="sm"
                disabled={submitState === 'sending'}
                className={`h-9 gap-1 rounded-md px-2.5 text-xs text-white disabled:bg-slate-500 [&_svg]:size-3.5 ${dark ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {submitState === 'sending' ? <Loader2 size={13} className="animate-spin" /> : mode === 'register' ? <UserPlus size={13} /> : <KeyRound size={13} />}
                {mode === 'register' ? 'Create account' : 'Sign in with email'}
              </Button>
            </form>
          )}
        </div>
      )}
      {message && (
        <p className={`mt-1 text-[11px] font-semibold ${submitState === 'error' || auth.state.status === 'error' ? 'text-rose-700' : 'text-emerald-700'}`}>
          {message}
        </p>
      )}
      {auth.state.status === 'error' && <p className="mt-1 text-[11px] font-semibold text-rose-700">{auth.state.message}</p>}
    </section>
  );
};

export default CloudAccountGate;
