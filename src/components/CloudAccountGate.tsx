import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, LogOut, Mail } from 'lucide-react';
import { useCloudAuth, type CloudAuthController } from '../hooks/useCloudAuth';
import { useCloudRuntime } from '../hooks/useCloudRuntime';
import type { AccountBootstrapInput } from '../cloud/account';
import type { AuthState } from '../cloud/auth';
import type { CloudRuntime } from '../cloud/runtime';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const CLOUD_DEVICE_ID_KEY = 'dumala_cloud_device_id';

export interface CloudAccountGateProps {
  clubName?: string;
  appVersion?: string;
  runtime?: CloudRuntime;
  authController?: CloudAuthController;
}

export const getOrCreateCloudDeviceId = (): string => {
  if (typeof window === 'undefined') return 'server-rendered-device';

  const existing = window.localStorage.getItem(CLOUD_DEVICE_ID_KEY);
  if (existing) return existing;

  const generated = typeof window.crypto?.randomUUID === 'function'
    ? window.crypto.randomUUID()
    : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(CLOUD_DEVICE_ID_KEY, generated);
  return generated;
};

export const submitCloudAccountEmail = async (
  email: string,
  requestOtp: CloudAuthController['requestOtp'],
  redirectTo = typeof window === 'undefined' ? undefined : window.location.href
): Promise<void> => {
  await requestOtp(email, redirectTo);
};

export const buildAccountBootstrapInput = (
  state: Extract<AuthState, { status: 'signedIn' }>,
  clubName = 'Dumala Club',
  appVersion = '0.0.0'
): AccountBootstrapInput => ({
  clubName,
  deviceId: getOrCreateCloudDeviceId(),
  deviceLabel: typeof navigator === 'undefined' ? 'Dumala web session' : navigator.userAgent.slice(0, 120),
  appVersion,
  displayName: state.session.email,
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
  runtime: runtimeOverride,
  authController: authControllerOverride
}: CloudAccountGateProps) => {
  const liveRuntime = useCloudRuntime();
  const runtime = runtimeOverride ?? liveRuntime;
  const liveAuth = useCloudAuth({
    enabled: runtime.enabled,
    auth: runtime.dataAccess?.auth ?? null
  });
  const auth = authControllerOverride ?? liveAuth;
  const [email, setEmail] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const bootstrappedUsers = useRef(new Set<string>());

  useEffect(() => {
    if (!runtime.enabled || auth.state.status !== 'signedIn') return;
    if (bootstrappedUsers.current.has(auth.state.session.userId)) return;
    bootstrappedUsers.current.add(auth.state.session.userId);

    bootstrapSignedInCloudAccount(runtime, auth.state, clubName, appVersion)
      .catch(error => {
        bootstrappedUsers.current.delete(auth.state.status === 'signedIn' ? auth.state.session.userId : '');
        setMessage(error instanceof Error ? error.message : 'Cloud account setup could not finish.');
      });
  }, [appVersion, auth.state, clubName, runtime]);

  if (!runtime.enabled) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState('sending');
    setMessage('');

    try {
      await submitCloudAccountEmail(email, auth.requestOtp);
      setSubmitState('sent');
      setMessage('Check your email for the Dumala sign-in link.');
    } catch (error) {
      setSubmitState('error');
      setMessage(error instanceof Error ? error.message : 'Could not send the sign-in link.');
    }
  };

  if (auth.state.status === 'loading') {
    return (
      <section aria-label="Cloud account" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
        <span className="inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Checking cloud account</span>
      </section>
    );
  }

  if (auth.state.status === 'signedIn') {
    return (
      <section aria-label="Cloud account" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} /> Cloud account connected</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void auth.signOut()} className="h-7 gap-1 rounded-lg border-emerald-200 px-2 text-[11px] text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 [&_svg]:size-3">
            <LogOut size={12} /> Sign out
          </Button>
        </div>
        {message && <p className="mt-1 text-[11px] text-amber-700">{message}</p>}
      </section>
    );
  }

  return (
    <section aria-label="Cloud account" className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Label htmlFor="cloud-account-email" className="text-xs normal-case tracking-normal text-slate-700">Cloud account</Label>
        <Input
          id="cloud-account-email"
          type="email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          placeholder="coach@example.com"
          className="h-8 min-w-0 rounded-lg px-2.5 text-xs focus-visible:border-indigo-400 focus-visible:ring-indigo-100"
          required
        />
        <Button
          type="submit"
          size="sm"
          disabled={submitState === 'sending'}
          className="h-8 gap-1 rounded-lg bg-indigo-600 px-2.5 text-xs text-white hover:bg-indigo-700 disabled:bg-slate-400 [&_svg]:size-3.5"
        >
          {submitState === 'sending' ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
          Send link
        </Button>
      </form>
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
