import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useCloudRuntime } from '../hooks/useCloudRuntime';
import { useCloudAuth } from '../hooks/useCloudAuth';
import { CloudAccountGate } from './CloudAccountGate';
import RequestLeagueAccessForm from './RequestLeagueAccessForm';
import type { AppDestination } from '../cloud/identity';
import LeagueApp from './league/LeagueApp';
import { createPreviewLeagueRuntime, createPreviewLeagueAuthController } from './league/demoLeagueData';

// Paid League Owner app (free during the beta pilot). This is the Phase 6
// identity shell: there is no open signup — owners request access and a Dumala
// admin provisions the account and grants the league entitlement. Dashboards are
// gated on that entitlement, not on a plan name.

const shellClass = 'min-h-screen bg-[#04070f] text-slate-100';

const CloudRequiredNotice = () => (
  <div className={`${shellClass} flex items-center justify-center p-6`}>
    <div className="max-w-md rounded-xl border border-slate-700 bg-[#080d17] p-6 text-center">
      <h1 className="text-lg font-black">Dumala for Leagues</h1>
      <p className="mt-2 text-sm text-slate-400">
        The League app needs a cloud connection. Open Dumala on an online device to continue.
      </p>
    </div>
  </div>
);

const ShellLoading = () => (
  <div className={`${shellClass} flex items-center justify-center p-6`}>
    <span className="inline-flex items-center gap-2 text-sm text-slate-300">
      <Loader2 size={16} className="animate-spin" /> Loading your league workspace…
    </span>
  </div>
);

const RedirectingNotice = ({ route }: { route: string }) => (
  <div className={`${shellClass} flex items-center justify-center p-6`}>
    <div className="max-w-md rounded-xl border border-slate-700 bg-[#080d17] p-6 text-center">
      <h1 className="text-lg font-black">This isn't your app</h1>
      <p className="mt-2 text-sm text-slate-400">
        Your account belongs to a different Dumala app. Taking you to <span className="font-semibold text-slate-200">{route}</span>…
      </p>
    </div>
  </div>
);

const AccessPendingNotice = () => (
  <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-5 py-4 text-amber-100">
    <h2 className="text-sm font-black uppercase tracking-wide">League access not active yet</h2>
    <p className="mt-2 text-sm leading-relaxed text-amber-100/90">
      Your account is registered, but League access hasn't been granted. A Dumala admin activates the league entitlement once your
      request is approved. You'll get in as soon as it's switched on.
    </p>
  </div>
);

// Built once so the demo runtime keeps its in-memory state across re-renders.
let previewLeagueRuntimeSingleton: ReturnType<typeof createPreviewLeagueRuntime> | null = null;
const previewLeagueAuthController = createPreviewLeagueAuthController();

const LeagueAppShell = () => {
  const runtime = useCloudRuntime();
  const auth = useCloudAuth({ enabled: runtime.enabled, auth: runtime.dataAccess?.auth ?? null });
  const [destination, setDestination] = useState<AppDestination | null>(null);
  const [resolving, setResolving] = useState(false);
  // Key resolution on the stable user id (see PlayerAppShell) so a new auth.state
  // reference for the same user doesn't cancel an in-flight resolution.
  const signedInUserId = auth.state.status === 'signedIn' ? auth.state.session.userId : null;

  useEffect(() => {
    if (!runtime.enabled || !signedInUserId) {
      setDestination(null);
      return;
    }

    let active = true;
    setResolving(true);
    (async () => {
      try {
        const dest = await runtime.dataAccess.identity.resolveDestination();
        if (active) setDestination(dest);
      } catch {
        if (active) setDestination(null);
      } finally {
        if (active) setResolving(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [runtime, signedInUserId]);

  useEffect(() => {
    // A coach or player who lands here is sent back to their own app. A league
    // owner stays put (entitled or not) so they see the access-pending notice.
    if (destination && destination.persona !== 'league') {
      window.location.hash = destination.authorizedRoute;
    }
  }, [destination]);

  // Direct design mode: while the League app is enabled for production rollout,
  // skip login + entitlement and render the dashboard with in-memory sample data.
  // After all hooks.
  if (runtime.phase6.leagueAppEnabled || runtime.phase6.leaguePreviewEnabled) {
    if (!previewLeagueRuntimeSingleton) previewLeagueRuntimeSingleton = createPreviewLeagueRuntime(runtime.phase6);
    return (
      <LeagueApp runtime={previewLeagueRuntimeSingleton} userId="preview-owner" authController={previewLeagueAuthController} preview />
    );
  }

  if (!runtime.enabled) return <CloudRequiredNotice />;

  // A signed-in, entitled League owner gets the full dashboard app.
  if (
    auth.state.status === 'signedIn' &&
    destination &&
    destination.persona === 'league' &&
    destination.leagueEntitled
  ) {
    return <LeagueApp runtime={runtime} userId={auth.state.session.userId} authController={auth} />;
  }

  const signedIn = auth.state.status === 'signedIn';

  return (
    <div className={shellClass}>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <header className="mb-6 space-y-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300">Dumala League</p>
            <h1 className="mt-1 text-2xl font-black">Run your seasons, tournaments, and league operations</h1>
            <p className="mt-1 text-sm text-slate-400">
              League accounts are provisioned by Dumala — there's no open signup. Sign in below, or request access.
            </p>
          </div>
          <CloudAccountGate
            runtime={runtime}
            authController={auth}
            bootstrapAccount={false}
            tone="dark"
            layout="compact"
            audience="admin"
          />
        </header>

        {signedIn && (resolving || !destination) && <ShellLoading />}
        {signedIn && destination && destination.persona !== 'league' && (
          <RedirectingNotice route={destination.authorizedRoute} />
        )}
        {signedIn && destination && destination.persona === 'league' && !destination.leagueEntitled && (
          <AccessPendingNotice />
        )}

        {!signedIn && (
          <section className="space-y-4 rounded-xl border border-slate-700 bg-[#080d17] p-5">
            <div>
              <h2 className="text-base font-black text-slate-100">Request League access</h2>
              <p className="mt-1 text-sm text-slate-400">
                Tell us about your league and we'll set up your account. Access is free during the beta pilot.
              </p>
            </div>
            <RequestLeagueAccessForm runtime={runtime} />
          </section>
        )}
      </div>
    </div>
  );
};

export default LeagueAppShell;
