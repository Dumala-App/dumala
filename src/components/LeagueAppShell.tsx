import React, { useEffect, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useCloudRuntime } from '../hooks/useCloudRuntime';
import { useCloudAuth } from '../hooks/useCloudAuth';
import RequestLeagueAccessForm from './RequestLeagueAccessForm';
import type { AppDestination } from '../cloud/identity';
import LeagueApp from './league/LeagueApp';
import { createPreviewLeagueRuntime, createPreviewLeagueAuthController } from './league/demoLeagueData';
import PersonaAccessShell from './PersonaAccessShell';
import { AetherFlowBackdrop } from './ui/aether-flow-hero';
import { GlowingEffect } from './ui/glowing-effect';
import { ORANGE_NEW_CLASSES, ORANGE_NEW_GLOW_PROPS, ORANGE_NEW_THEME_STYLE } from '../theme/orangeNewTheme';

// Paid League Owner app (free during the beta pilot). There is no open signup:
// owners request access and a Dumala admin provisions the account and entitlement.

const CloudRequiredNotice = () => (
  <PersonaAccessShell
    variant="league"
    eyebrow="Dumala League"
    title="League access needs cloud."
    description="A private workspace for league owners to manage competitions, events, and records."
    badge="Admin-provisioned beta"
    compact
    singlePanel
  >
    <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-5 py-4 text-sm leading-6 text-amber-100">
      Cloud is not configured on this device yet. Add the Supabase public URL and publishable key, then reload this page.
    </div>
  </PersonaAccessShell>
);

const ShellLoading = () => (
  <div className="flex items-center justify-center rounded-2xl border border-cyan-300/15 bg-white/[0.045] p-6">
    <span className="inline-flex items-center gap-2 text-sm text-slate-300">
      <Loader2 size={16} className="animate-spin" /> Loading your league workspace...
    </span>
  </div>
);

const RedirectingNotice = ({ route }: { route: string }) => (
  <div className="rounded-2xl border border-cyan-300/15 bg-white/[0.045] p-5 text-center">
    <h1 className="font-display text-lg font-black text-white">This is not your app</h1>
    <p className="mt-2 text-sm leading-6 text-slate-400">
      Your account belongs to a different Dumala app. Taking you to <span className="font-semibold text-slate-100">{route}</span>...
    </p>
  </div>
);

const AccessPendingNotice = () => (
  <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-5 py-4 text-amber-100">
    <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide">
      <ShieldCheck size={16} /> League access not active yet
    </div>
    <p className="mt-2 text-sm leading-6 text-amber-100/90">
      Your account is registered, but League access has not been granted. A Dumala admin activates the league entitlement once your
      request is approved.
    </p>
  </div>
);

const LeagueWaitlistView = ({ runtime }: { runtime: ReturnType<typeof useCloudRuntime> }) => (
  <div
    className={`${ORANGE_NEW_CLASSES.accessShell} flex min-h-screen items-center justify-center p-4`}
    style={ORANGE_NEW_THEME_STYLE}
  >
    <AetherFlowBackdrop
      className="absolute inset-0 z-0"
      particleColor="rgba(34,211,238,0.82)"
      lineRGB="125,211,252"
    />
    <main className="relative z-10 w-full max-w-sm">
      <div className={ORANGE_NEW_CLASSES.glowShellTight}>
        <GlowingEffect {...ORANGE_NEW_GLOW_PROPS.shellTight} />
        <section className="relative z-10 rounded-2xl border border-cyan-300/15 bg-[#07111f]/92 px-5 py-6 text-center text-slate-100 shadow-2xl shadow-black/45 backdrop-blur-xl sm:px-6">
          <img
            src="/dumala-onboarding-logo.png"
            alt="Dumala"
            className="mx-auto mb-3 h-auto w-24 object-contain"
          />
          <p className="mx-auto mb-4 max-w-[17rem] text-sm font-semibold leading-6 text-slate-300">
            Join the private beta waitlist for Dumala league management.
          </p>
          <RequestLeagueAccessForm runtime={runtime} />
        </section>
      </div>
    </main>
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

  if (runtime.phase6.leaguePreviewEnabled) {
    if (!previewLeagueRuntimeSingleton) previewLeagueRuntimeSingleton = createPreviewLeagueRuntime(runtime.phase6);
    return (
      <LeagueApp runtime={previewLeagueRuntimeSingleton} userId="preview-owner" authController={previewLeagueAuthController} preview />
    );
  }

  if (!runtime.enabled) return <CloudRequiredNotice />;

  if (
    auth.state.status === 'signedIn' &&
    destination &&
    destination.persona === 'league' &&
    destination.leagueEntitled
  ) {
    return <LeagueApp runtime={runtime} userId={auth.state.session.userId} authController={auth} />;
  }

  const signedIn = auth.state.status === 'signedIn';

  if (!signedIn) return <LeagueWaitlistView runtime={runtime} />;

  return (
    <PersonaAccessShell
      variant="league"
      eyebrow="Dumala League"
      title="League Owner access"
      description="Join the private beta waitlist for Dumala league management."
      badge="Owner beta access"
      compact
      singlePanel
    >
      <div className="mx-auto w-full max-w-xl space-y-4">
        {signedIn && (resolving || !destination) && <ShellLoading />}
        {signedIn && destination && destination.persona !== 'league' && (
          <RedirectingNotice route={destination.authorizedRoute} />
        )}
        {signedIn && destination && destination.persona === 'league' && !destination.leagueEntitled && (
          <AccessPendingNotice />
        )}
      </div>
    </PersonaAccessShell>
  );
};

export default LeagueAppShell;
