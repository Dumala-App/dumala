import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useCloudRuntime } from '../hooks/useCloudRuntime';
import { useCloudAuth } from '../hooks/useCloudAuth';
import { CloudAccountGate } from './CloudAccountGate';
import type { AppDestination } from '../cloud/identity';
import PlayerApp from './player/PlayerApp';
import { createPreviewRuntime, createPreviewAuthController } from './player/demoPlayerData';
import {
  APEX_THEME_STYLE,
  apexCard,
  apexDisplay,
  apexEyebrow,
  apexShell
} from './player/playerTheme';

// Free Player app. This shell owns the Player registration door and, once signed
// in, confirms the persona server-side and hands off to the full-screen mobile
// PlayerApp. Styled with the "Apex Precision" player design system.

const CloudRequiredNotice = () => (
  <div className={`${apexShell} flex items-center justify-center p-6`} style={APEX_THEME_STYLE}>
    <div className={`${apexCard} max-w-md p-6 text-center`}>
      <h1 className={`${apexDisplay} text-lg`}>Dumala for Players</h1>
      <p className="mt-2 text-sm text-[#c6c6cd]">
        The Player app needs a cloud connection. Open Dumala on an online device to sign in or create your free player account.
      </p>
    </div>
  </div>
);

const ShellLoading = () => (
  <div className="flex items-center justify-center p-6">
    <span className="inline-flex items-center gap-2 text-sm text-[#c6c6cd]">
      <Loader2 size={16} className="animate-spin" /> Loading your player workspace…
    </span>
  </div>
);

const RedirectingNotice = ({ route }: { route: string }) => (
  <div className={`${apexCard} p-6 text-center`}>
    <h1 className={`${apexDisplay} text-lg`}>This isn't your app</h1>
    <p className="mt-2 text-sm text-[#c6c6cd]">
      Your account belongs to a different Dumala app. Taking you to <span className="font-semibold text-[#d8e3fb]">{route}</span>…
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
  // Key resolution on the stable user id, not the whole auth.state object, so a
  // new auth.state reference for the same user doesn't cancel an in-flight
  // resolution and leave the shell stuck loading.
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

  // Direct design mode: while the Player app is enabled for production rollout,
  // skip the login gate and cloud entirely so the dashboard can be designed with
  // stable in-memory sample data. Placed after all hooks so hook order stays stable.
  if (runtime.phase6.playerAppEnabled || runtime.phase6.playerPreviewEnabled) {
    if (!previewRuntimeSingleton) previewRuntimeSingleton = createPreviewRuntime(runtime.phase6);
    return (
      <PlayerApp runtime={previewRuntimeSingleton} userId="preview-player" authController={previewAuthController} preview />
    );
  }

  if (!runtime.enabled) return <CloudRequiredNotice />;

  // Signed-in players get the full-screen mobile app.
  if (
    auth.state.status === 'signedIn' &&
    destination &&
    destination.authorizedRoute === '/player'
  ) {
    return <PlayerApp runtime={runtime} userId={auth.state.session.userId} authController={auth} />;
  }

  const signedIn = auth.state.status === 'signedIn';

  return (
    <div className={apexShell} style={APEX_THEME_STYLE}>
      <div className="mx-auto max-w-md px-4 py-12">
        <header className="mb-6 space-y-5">
          <div>
            <p className={`${apexEyebrow} mb-1`}>Dumala Player</p>
            <h1 className={`${apexDisplay} text-[28px]`}>Train. Track. Level up.</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#c6c6cd]">
              Your free football workspace — solo drills, a workout timer, streaks, and your team schedule.
            </p>
          </div>
          <CloudAccountGate
            runtime={runtime}
            authController={auth}
            bootstrapAccount={false}
            tone="dark"
            layout="compact"
          />
        </header>

        {!signedIn && (
          <p className={`${apexCard} px-5 py-4 text-sm text-[#c6c6cd]`}>
            Sign in above, or create your free player account, to open your workspace.
          </p>
        )}
        {signedIn && (resolving || !destination) && <ShellLoading />}
        {signedIn && destination && destination.authorizedRoute !== '/player' && (
          <RedirectingNotice route={destination.authorizedRoute} />
        )}
      </div>
    </div>
  );
};

export default PlayerAppShell;
