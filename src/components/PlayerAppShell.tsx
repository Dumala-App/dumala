import React, { useEffect, useState } from 'react';
import { CalendarDays, Dumbbell, Loader2, TimerReset } from 'lucide-react';
import { useCloudRuntime } from '../hooks/useCloudRuntime';
import { useCloudAuth } from '../hooks/useCloudAuth';
import { CloudAccountGate, getAppAuthRedirectUrl } from './CloudAccountGate';
import type { AppDestination } from '../cloud/identity';
import PlayerApp from './player/PlayerApp';
import { createPreviewRuntime, createPreviewAuthController } from './player/demoPlayerData';
import PersonaAccessShell from './PersonaAccessShell';

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
    return <PlayerApp runtime={runtime} userId={auth.state.session.userId} authController={auth} />;
  }

  const signedIn = auth.state.status === 'signedIn';

  return (
    <PersonaAccessShell
      variant="player"
      eyebrow="Dumala Player"
      title="Train. Track. Level up."
      description="Your free football workspace for solo drills, a workout timer, training streaks, and your team schedule once your coach approves the link."
      badge="Free player account"
      highlights={playerHighlights}
      footer="Players join through a coach invite link or club join code. Your coach controls official roster records."
    >
      <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
        <p className="mb-3 text-xs font-black uppercase tracking-wide text-orange-200">Player sign in</p>
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

      {!signedIn && (
        <p className="rounded-2xl border border-orange-300/15 bg-orange-300/10 px-5 py-4 text-sm leading-6 text-orange-50/90">
          Sign in above, or create your free player account, to open your workspace.
        </p>
      )}
      {signedIn && (resolving || !destination) && <ShellLoading />}
      {signedIn && destination && destination.authorizedRoute !== '/player' && (
        <RedirectingNotice route={destination.authorizedRoute} />
      )}
    </PersonaAccessShell>
  );
};

export default PlayerAppShell;
