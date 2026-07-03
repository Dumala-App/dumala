import {AlertTriangle, CheckCircle2, RefreshCw, WifiOff, X} from 'lucide-react';
import {usePwaLifecycle} from '../hooks/usePwaLifecycle';
import { Button } from './ui/button';

export default function PwaStatusBanners() {
  const {
    isOnline,
    showReconnected,
    updateAvailable,
    offlineReady,
    isUpdating,
    registrationError,
    activateUpdate,
    dismissUpdate,
    dismissOfflineReady,
    dismissRegistrationError,
  } = usePwaLifecycle();

  if (isOnline && !showReconnected && !updateAvailable && !offlineReady && !registrationError) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed bottom-4 left-4 right-4 z-[45] mx-auto flex max-w-xl flex-col gap-2"
      aria-live="polite"
      aria-atomic="true"
    >
      {!isOnline && (
        <div className="pointer-events-auto rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 shadow-xl">
          <div className="flex items-start gap-3">
            <WifiOff size={18} className="mt-0.5 shrink-0 text-amber-700" />
            <div>
              <p className="text-xs font-black uppercase tracking-wide">You are offline</p>
              <p className="mt-1 text-xs leading-relaxed">
                Local editing remains available. Feedback delivery and external images require an internet connection.
              </p>
            </div>
          </div>
        </div>
      )}

      {showReconnected && (
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-900 shadow-xl">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <p className="text-xs font-bold">Connection restored. Online services are available again.</p>
        </div>
      )}

      {updateAvailable && (
        <div className="pointer-events-auto rounded-2xl border border-orange-300/35 bg-[#07111f]/95 px-4 py-3 text-slate-100 shadow-2xl shadow-black/35 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-200">
              <RefreshCw size={16} className={isUpdating ? 'animate-spin' : ''} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-wide text-orange-200">New Dumala version available</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Your workspace data is preserved. Update when you are ready for one controlled reload.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={activateUpdate}
                  disabled={isUpdating}
                  className="h-8 rounded-lg bg-gradient-to-b from-[#ff9a52] to-[#ff8a3d] px-3 text-[11px] font-black text-[#180a00] shadow-lg shadow-orange-950/20 hover:from-[#ffb06e] hover:to-[#ffa35f] disabled:cursor-wait disabled:opacity-70"
                >
                  {isUpdating ? 'Updating...' : 'Update now'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={dismissUpdate}
                  disabled={isUpdating}
                  className="h-8 rounded-lg border-white/12 bg-white/[0.035] px-3 text-[11px] font-black text-slate-300 hover:bg-white/[0.08] hover:text-white disabled:opacity-60"
                >
                  Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {offlineReady && (
        <div className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-950 shadow-xl">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-wide">Dumala is ready offline</p>
            <p className="mt-1 text-xs leading-relaxed">The app shell and local assets are saved on this device.</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={dismissOfflineReady} className="size-7 rounded-lg text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900" aria-label="Dismiss offline-ready message">
            <X size={15} />
          </Button>
        </div>
      )}

      {registrationError && (
        <div className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 shadow-xl">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-wide">Offline setup warning</p>
            <p className="mt-1 text-xs leading-relaxed">{registrationError}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={dismissRegistrationError} className="size-7 rounded-lg text-amber-700 hover:bg-amber-100 hover:text-amber-900" aria-label="Dismiss offline setup warning">
            <X size={15} />
          </Button>
        </div>
      )}
    </div>
  );
}
