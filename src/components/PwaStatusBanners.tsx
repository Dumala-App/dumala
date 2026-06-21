import {AlertTriangle, CheckCircle2, RefreshCw, WifiOff, X} from 'lucide-react';
import {usePwaLifecycle} from '../hooks/usePwaLifecycle';

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
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[130] mx-auto flex w-full max-w-xl flex-col gap-2 px-4"
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
        <div className="pointer-events-auto rounded-2xl border border-blue-300 bg-blue-50 px-4 py-3 text-blue-950 shadow-xl">
          <div className="flex items-start gap-3">
            <RefreshCw size={18} className={`mt-0.5 shrink-0 text-blue-700 ${isUpdating ? 'animate-spin' : ''}`} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-wide">New Dumala version available</p>
              <p className="mt-1 text-xs leading-relaxed">
                Your workspace data is preserved. Update when you are ready for one controlled reload.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={activateUpdate}
                  disabled={isUpdating}
                  className="rounded-lg bg-blue-700 px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-blue-600 disabled:cursor-wait disabled:opacity-60"
                >
                  {isUpdating ? 'Updating...' : 'Update now'}
                </button>
                <button
                  type="button"
                  onClick={dismissUpdate}
                  disabled={isUpdating}
                  className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-[11px] font-black text-blue-800 transition hover:bg-blue-100"
                >
                  Later
                </button>
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
          <button type="button" onClick={dismissOfflineReady} className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100" aria-label="Dismiss offline-ready message">
            <X size={15} />
          </button>
        </div>
      )}

      {registrationError && (
        <div className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 shadow-xl">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-wide">Offline setup warning</p>
            <p className="mt-1 text-xs leading-relaxed">{registrationError}</p>
          </div>
          <button type="button" onClick={dismissRegistrationError} className="rounded-lg p-1 text-amber-700 hover:bg-amber-100" aria-label="Dismiss offline setup warning">
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
