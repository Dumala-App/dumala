import React, { useEffect, useState } from 'react';
import { CalendarDays, Dumbbell, Loader2, TimerReset } from 'lucide-react';
import { useCloudRuntime } from '../hooks/useCloudRuntime';
import { useCloudAuth } from '../hooks/useCloudAuth';
import { CloudAccountGate, getAppAuthRedirectUrl } from './CloudAccountGate';
import type { AppDestination } from '../cloud/identity';
import PlayerApp from './player/PlayerApp';
import { createPreviewRuntime, createPreviewAuthController } from './player/demoPlayerData';
import PersonaAccessShell from './PersonaAccessShell';
import { AetherFlowBackdrop } from './ui/aether-flow-hero';
import { GlowingEffect } from './ui/glowing-effect';
import { ORANGE_NEW_CLASSES, ORANGE_NEW_GLOW_PROPS, ORANGE_NEW_THEME_STYLE } from '../theme/orangeNewTheme';
import { rememberPlayerInviteCodeFromHash } from '../player/inviteLink';
import PwaInstallControl from './PwaInstallControl';

// Free Player app. This shell owns the Player registration door and, once signed
// in, confirms the persona server-side and hands off to the full-screen mobile
// PlayerApp.

const playerHighlights = [
  {
    icon: Dumbbell,
    title: 'Solo drills',
    text: 'Train with position-aware routines and keep favorite drills close.'
  },
  {
    icon: TimerReset,
    title: 'Workout timer',
    text: 'Record intervals, streaks, and sessions from a phone-friendly flow.'
  },
  {
    icon: CalendarDays,
    title: 'Team link',
    text: 'Claim your roster spot to see schedule, chat, and official updates.'
  }
];

const CloudRequiredNotice = () => (
  <PersonaAccessShell
    variant="player"
    eyebrow="Dumala Player"
    title="Player access needs cloud."
    description="Open Dumala with a cloud connection to create your free player account, claim your roster spot, and sync training progress."
    badge="Free player workspace"
    highlights={playerHighlights}
  >
    <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-5 py-4 text-sm leading-6 text-amber-100">
      Cloud is not configured on this device yet. Add the Supabase public URL and publishable key, then reload this page.
    </div>
  </PersonaAccessShell>
);

const ShellLoading = () => (
  <div className="flex items-center justify-center rounded-2xl border border-cyan-300/15 bg-white/[0.045] p-6">
    <span className="inline-flex items-center gap-2 text-sm text-slate-300">
      <Loader2 size={16} className="animate-spin" /> Loading your player workspace...
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

// Preview mode is stable across the component lifetime, so the demo runtime is
// built once (module-level) to keep its in-memory state across re-renders.
let previewRuntimeSingleton: ReturnType<typeof createPreviewRuntime> | null = null;
const previewAuthController = createPreviewAuthController();

const PlayerAppShell = () => {
  const runtime = useCloudRuntime();
  const auth = useCloudAuth({ enabled: runtime.enabled, auth: runtime.dataAccess?.auth ?? null });
  const [destination, setDestination] = useState<AppDestination | null>(null);
  const [resolving, setResolving] = useState(false);
  const signedInUserId = auth.state.status === 'signedIn' ? auth.state.session.userId : null;

  useEffect(() => {
    rememberPlayerInviteCodeFromHash();
  }, []);

  useEffect(() => {
    if (!runtime.enabled || !signedInUserId) {
      setDestination(null);
      return;
    }

    let active = true;
    setResolving(true);
    (async () => {
      try {
        let dest = await runtime.dataAccess.identity.resolveDestination();
        // The Player door claims the persona for a brand-new, unaffiliated
        // account. Established coaches are rejected by the RPC and fall through
        // to a redirect to their own app.
        if (dest.persona === 'coach') {
          try {
            await runtime.dataAccess.identity.bootstrapPlayerAccount();
            dest = await runtime.dataAccess.identity.resolveDestination();
          } catch {
            /* not eligible for the player persona */
          }
        }
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
    if (destination && destination.authorizedRoute !== '/player') {
      window.location.hash = destination.authorizedRoute;
    }
  }, [destination]);

  if (runtime.phase6.playerPreviewEnabled) {
    if (!previewRuntimeSingleton) previewRuntimeSingleton = createPreviewRuntime(runtime.phase6);
    return (
      <PlayerApp runtime={previewRuntimeSingleton} userId="preview-player" authController={previewAuthController} preview />
    );
  }

  if (!runtime.enabled) return <CloudRequiredNotice />;

  if (
    auth.state.status === 'signedIn' &&
    destination &&
    destination.authorizedRoute === '/player'
  ) {
    return (
      <PlayerApp
        runtime={runtime}
        userId={auth.state.session.userId}
        authController={auth}
        accountDisplayName={auth.state.session.displayName}
        accountEmail={auth.state.session.email}
      />
    );
  }

  const signedIn = auth.state.status === 'signedIn';

  return (
    <>
      <div className="fixed right-4 top-4 z-40">
        <PwaInstallControl audience="player" tone="player" />
      </div>
      <div
        className={`${ORANGE_NEW_CLASSES.accessShell} flex min-h-screen items-center justify-center p-4`}
        style={ORANGE_NEW_THEME_STYLE}
      >
        <AetherFlowBackdrop className="fixed inset-0 z-0" particleColor="rgba(255,109,0,0.86)" lineRGB="255,179,126" />
        <main className="relative z-10 w-full max-w-sm">
          <div className={ORANGE_NEW_CLASSES.glowShellTight}>
            <GlowingEffect {...ORANGE_NEW_GLOW_PROPS.shellTight} />
            <section className="relative z-10 overflow-hidden rounded-2xl border border-white/10 bg-[#07111f]/92 p-6 text-slate-100 shadow-2xl shadow-black/45 backdrop-blur-xl">
              <div className="flex flex-col items-center text-center">
                <img src="/dumala-onboarding-logo.png" alt="Dumala" className="h-14 w-auto object-contain" />
                <p className={`mt-3 ${ORANGE_NEW_CLASSES.eyebrowLabel}`}>Dumala Player</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">Free player account</p>
              </div>

              <div className="mt-5">
                <CloudAccountGate
                  runtime={runtime}
                  authController={auth}
                  bootstrapAccount={false}
                  tone="dark"
                  layout="compact"
                  audience="player"
                  redirectTo={getAppAuthRedirectUrl('player')}
                />
              </div>

              {signedIn && (resolving || !destination) && <div className="mt-4"><ShellLoading /></div>}
              {signedIn && destination && destination.authorizedRoute !== '/player' && (
                <div className="mt-4"><RedirectingNotice route={destination.authorizedRoute} /></div>
              )}

              <p className="mt-5 border-t border-white/10 pt-3 text-center text-[11px] leading-5 text-slate-500">
                Join with a coach invite link or club join code.
              </p>
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export default PlayerAppShell;
