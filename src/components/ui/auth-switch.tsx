import React, { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, Cloud, Loader2 } from 'lucide-react';
import type { CloudRuntime } from '../../cloud/runtime';
import type { CloudAuthController } from '../../hooks/useCloudAuth';
import { cn } from '../../lib/utils';
import {
  submitCloudAccountEmail,
  submitCloudGoogleSignIn,
  submitCloudPasswordRegistration,
  submitCloudPasswordSignIn
} from '../CloudAccountGate';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

type AuthMode = 'create' | 'signIn' | 'link';

export interface AuthSwitchProps {
  className?: string;
  runtime?: CloudRuntime;
  authController?: CloudAuthController;
  returning?: boolean;
  onOpenApp?: () => void;
}

const fieldClass = 'h-10 w-full rounded-xl border border-white/12 bg-[#040b17]/88 px-3 text-sm font-semibold text-slate-100 shadow-inner shadow-black/15 outline-none transition placeholder:text-slate-500 focus:border-orange-300/70 focus:ring-2 focus:ring-orange-300/20';

const openApp = (onOpenApp?: () => void) => {
  onOpenApp?.();
  if (!onOpenApp && typeof window !== 'undefined') {
    window.location.hash = '/app';
  }
};

export function AuthSwitch({
  className,
  runtime,
  authController,
  returning = false,
  onOpenApp
}: AuthSwitchProps) {
  const [mode, setMode] = useState<AuthMode>(returning ? 'signIn' : 'create');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setMode(returning ? 'signIn' : 'create');
  }, [returning]);

  const resetMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setSubmitState('idle');
    setMessage('');
  };

  if (runtime && !runtime.enabled) {
    return (
      <section
        aria-labelledby="auth-switch-cloud-required-title"
        className={cn(
          'rounded-2xl border border-white/12 bg-[#071026]/88 p-4 shadow-2xl shadow-slate-950/35 backdrop-blur-xl',
          className
        )}
      >
        <div className="rounded-xl border border-white/10 bg-[#050b14]/72 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-300/18 bg-orange-300/[0.08] text-orange-200">
              <Cloud size={17} aria-hidden="true" />
            </span>
            <div>
              <h2 id="auth-switch-cloud-required-title" className="text-sm font-black text-slate-100">Cloud account required</h2>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Account access is unavailable in this build. Enable Dumala Cloud to create or sign in before setting up a workspace.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (runtime?.enabled && (!authController || authController.state.status === 'loading')) {
    return (
      <section
        aria-label="Cloud account"
        className={cn(
          'rounded-2xl border border-white/12 bg-[#071026]/88 p-4 shadow-2xl shadow-slate-950/35 backdrop-blur-xl',
          className
        )}
      >
        <div className="rounded-xl border border-white/10 bg-[#050b14]/72 p-4 text-xs font-semibold text-slate-300">
          <span className="inline-flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            Checking cloud account
          </span>
        </div>
      </section>
    );
  }

  if (authController?.state.status === 'signedIn') {
    return (
      <section
        aria-label="Cloud account connected"
        className={cn(
          'rounded-2xl border border-white/12 bg-[#071026]/88 p-4 shadow-2xl shadow-slate-950/35 backdrop-blur-xl',
          className
        )}
      >
        <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/[0.09] text-emerald-100">
              <CheckCircle2 size={17} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-black text-slate-100">Account connected</h2>
              <p className="mt-1 text-xs text-slate-400">Create your club identity or start from a sample workspace.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const hasLiveAuth = Boolean(authController);
  const isCreateMode = mode === 'create';
  const isSignInMode = mode === 'signIn';
  const isLinkMode = mode === 'link';
  const isSignInChoice = isSignInMode || isLinkMode;
  const formTitle = isCreateMode ? 'Create account' : isSignInMode ? 'Sign in with email' : 'Email sign-in link';
  const helperTone = submitState === 'error' || authController?.state.status === 'error' ? 'text-rose-300' : 'text-emerald-200';

  const handleGoogle = async () => {
    if (!authController) {
      openApp(onOpenApp);
      return;
    }

    setSubmitState('sending');
    setMessage('');
    try {
      await submitCloudGoogleSignIn(authController.signInWithGoogle);
      setSubmitState('sent');
      setMessage('Redirecting to Google. Dumala will continue after sign-in.');
    } catch (error) {
      setSubmitState('error');
      setMessage(error instanceof Error ? error.message : 'Could not start Google sign-in.');
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!authController) {
      openApp(onOpenApp);
      return;
    }

    setSubmitState('sending');
    setMessage('');
    try {
      if (isCreateMode) {
        await submitCloudPasswordRegistration(email, password, authController.signUpWithPassword);
        setMessage('Account created. Confirm your email if required, then sign in to continue.');
      } else {
        await submitCloudPasswordSignIn(email, password, authController.signInWithPassword);
        setMessage('Signed in. Your workspace is being restored.');
      }
      setSubmitState('sent');
    } catch (error) {
      setSubmitState('error');
      setMessage(error instanceof Error ? error.message : 'Could not complete account access.');
    }
  };

  const handleLinkSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!authController) {
      openApp(onOpenApp);
      return;
    }

    setSubmitState('sending');
    setMessage('');
    try {
      await submitCloudAccountEmail(email, authController.requestOtp);
      setSubmitState('sent');
      setMessage('Check your email for the Dumala sign-in link.');
    } catch (error) {
      setSubmitState('error');
      setMessage(error instanceof Error ? error.message : 'Could not send the sign-in link.');
    }
  };

  return (
    <section
      aria-label="Dumala account access"
      className={cn(
        'rounded-[1.35rem] border border-white/12 bg-[#071026]/88 p-3 shadow-2xl shadow-slate-950/35 backdrop-blur-xl sm:p-4',
        className
      )}
    >
      <div className="grid gap-3">
        <div className="grid gap-2 sm:grid-cols-2" role="tablist" aria-label="Choose account access">
          <button
            type="button"
            onClick={() => resetMode('create')}
            aria-pressed={isCreateMode}
            className={cn(
              'min-h-[5.5rem] rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/45',
              isCreateMode
                ? 'border-orange-300/60 bg-orange-300/[0.12] text-orange-100 shadow-lg shadow-orange-950/20'
                : 'border-white/10 bg-[#050b14]/62 text-slate-300 hover:border-orange-300/25 hover:bg-orange-300/[0.06]'
            )}
          >
            <span className="block text-base font-black">Create Account</span>
            <span className="mt-1 block text-xs font-semibold leading-5 text-slate-400">Start a new Dumala account with email.</span>
          </button>
          <button
            type="button"
            onClick={() => resetMode('signIn')}
            aria-pressed={isSignInChoice}
            className={cn(
              'min-h-[5.5rem] rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/45',
              isSignInChoice
                ? 'border-cyan-300/50 bg-cyan-300/[0.1] text-cyan-100 shadow-lg shadow-cyan-950/20'
                : 'border-white/10 bg-[#050b14]/62 text-slate-300 hover:border-cyan-300/25 hover:bg-cyan-300/[0.06]'
            )}
          >
            <span className="block text-base font-black">Sign in</span>
            <span className="mt-1 block text-xs font-semibold leading-5 text-slate-400">Return with Google, email, or a secure link.</span>
          </button>
        </div>

        <div className={cn(
          'rounded-2xl border bg-[#050b14]/86 p-4 shadow-xl shadow-black/20',
          isCreateMode ? 'border-orange-300/18' : 'border-cyan-300/15'
        )}>
          {isLinkMode ? (
            <form onSubmit={handleLinkSubmit} className="grid gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-100">{formTitle}</h3>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Send a secure one-time link to your Dumala email.</p>
                </div>
                <Button
                  type="button"
                  onClick={() => void handleGoogle()}
                  disabled={submitState === 'sending'}
                  className="h-9 rounded-xl bg-white px-4 text-xs font-black text-slate-950 shadow-lg shadow-cyan-950/20 hover:bg-cyan-50 disabled:bg-slate-600 disabled:text-slate-300"
                >
                  {submitState === 'sending' ? (
                    <span className="inline-flex items-center gap-2"><Loader2 size={13} className="animate-spin" aria-hidden="true" />Connecting</span>
                  ) : (
                    'Continue with Google'
                  )}
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="grid gap-1.5">
                <Label htmlFor="auth-switch-email-link" className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Email address</Label>
                <Input
                  id="auth-switch-email-link"
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="coach@example.com"
                  autoComplete="email"
                  className={fieldClass}
                  required={hasLiveAuth}
                />
              </div>
              <Button type="submit" disabled={submitState === 'sending'} className="h-10 rounded-xl bg-cyan-600 px-5 text-sm font-black text-white hover:bg-cyan-500 disabled:bg-slate-600">
                {submitState === 'sending' ? 'Sending link' : 'Send email link'}
              </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="grid gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                <h3 className="text-base font-black text-slate-100">{formTitle}</h3>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  {isCreateMode ? 'Create your cloud account first. Club setup comes next.' : 'Use the email and password attached to your Dumala account.'}
                </p>
                </div>
                {isSignInChoice && (
                  <Button
                    type="button"
                    onClick={() => void handleGoogle()}
                    disabled={submitState === 'sending'}
                    className="h-9 rounded-xl bg-white px-4 text-xs font-black text-slate-950 shadow-lg shadow-cyan-950/20 hover:bg-cyan-50 disabled:bg-slate-600 disabled:text-slate-300"
                  >
                    {submitState === 'sending' ? (
                      <span className="inline-flex items-center gap-2"><Loader2 size={13} className="animate-spin" aria-hidden="true" />Connecting</span>
                    ) : (
                      'Continue with Google'
                    )}
                  </Button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="auth-switch-email" className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Email address</Label>
                <Input
                  id="auth-switch-email"
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="coach@example.com"
                  autoComplete="email"
                  className={fieldClass}
                  required={hasLiveAuth}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="auth-switch-password" className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Password</Label>
                <Input
                  id="auth-switch-password"
                  type="password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder={isCreateMode ? 'Minimum 8 characters' : 'Your password'}
                  autoComplete={isCreateMode ? 'new-password' : 'current-password'}
                  minLength={isCreateMode ? 8 : undefined}
                  className={fieldClass}
                  required={hasLiveAuth}
                />
              </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                type="submit"
                disabled={submitState === 'sending'}
                className={cn(
                  'h-10 rounded-xl px-5 text-sm font-black shadow-lg disabled:bg-slate-600',
                  isCreateMode
                    ? 'bg-gradient-to-b from-[#ff9a52] to-[#ff8a3d] text-[#180a00] shadow-orange-950/20 hover:from-[#ffb06e] hover:to-[#ffa35f]'
                    : 'bg-cyan-600 text-white shadow-cyan-950/20 hover:bg-cyan-500'
                )}
              >
                {submitState === 'sending'
                  ? isCreateMode ? 'Creating account' : 'Signing in'
                  : isCreateMode ? 'Create account with email' : 'Sign in with email'}
              </Button>
              {isSignInChoice && (
                <button
                  type="button"
                  onClick={() => resetMode('link')}
                  className="h-10 rounded-xl border border-white/10 px-4 text-xs font-black text-slate-400 transition hover:border-cyan-300/25 hover:bg-white/[0.05] hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40"
                >
                  Email link
                </button>
              )}
              </div>
            </form>
          )}

          {isLinkMode && (
          <div className="mt-3 border-t border-white/[0.08] pt-3">
            <button
              type="button"
              onClick={() => resetMode(isLinkMode ? 'signIn' : 'link')}
              className="rounded-xl px-3 py-2 text-xs font-black text-slate-400 transition hover:bg-white/[0.05] hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40"
            >
              {isLinkMode ? 'Use password instead' : 'Send a passwordless email link'}
            </button>
          </div>
          )}

          {message && <p className={cn('mt-3 text-[11px] font-semibold leading-5', helperTone)}>{message}</p>}
          {authController?.state.status === 'error' && <p className="mt-3 text-[11px] font-semibold leading-5 text-rose-300">{authController.state.message}</p>}
        </div>
      </div>
    </section>
  );
}

export const Component = AuthSwitch;

export default AuthSwitch;
