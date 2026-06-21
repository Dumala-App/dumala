import { useRef } from 'react';
import { Download, Share2, Smartphone, X } from 'lucide-react';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import { usePwaInstall } from '../hooks/usePwaInstall';

export default function PwaInstallControl() {
  const {
    installMessage,
    isAppleMobile,
    isInstalled,
    requestInstall,
    setShowAppleInstructions,
    showAppleInstructions
  } = usePwaInstall();
  const instructionsRef = useRef<HTMLDivElement | null>(null);
  const closeInstructions = () => setShowAppleInstructions(false);
  useDialogAccessibility(instructionsRef, showAppleInstructions, closeInstructions);

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg border border-sky-100 bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-700">
        <Smartphone size={10} /> Installed
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={requestInstall}
        className="inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 transition-colors hover:border-blue-200 hover:bg-blue-100"
      >
        <Download size={10} />
        Install Dumala
      </button>

      {installMessage && (
        <span
          className="fixed bottom-4 left-1/2 z-[130] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl border border-blue-200 bg-white px-4 py-3 text-center text-xs font-bold text-blue-800 shadow-xl"
          role="status"
          aria-live="polite"
        >
          {installMessage}
        </span>
      )}

      {showAppleInstructions && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div
            ref={instructionsRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="apple-install-title"
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">iPhone and iPad</p>
                <h2 id="apple-install-title" className="mt-1 font-display text-lg font-black text-slate-900">
                  Install Dumala
                </h2>
              </div>
              <button
                type="button"
                onClick={closeInstructions}
                aria-label="Close installation instructions"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={17} />
              </button>
            </div>

            <ol className="mt-5 space-y-3 text-sm font-medium text-slate-600">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-700">1</span>
                Open Dumala in Safari.
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-700">2</span>
                <span>Tap the <Share2 size={15} className="mx-1 inline text-blue-600" /> Share button.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-700">3</span>
                Choose <strong className="text-slate-900">Add to Home Screen</strong>, then confirm Add.
              </li>
            </ol>

            <p className="mt-5 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              Installation support is ready. Full offline launching will be added in the next service-worker phase.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
