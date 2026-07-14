import { useRef } from 'react';
import { Download, Share2, Smartphone, X } from 'lucide-react';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import { useIsPhone } from '../hooks/useIsPhone';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { Button } from './ui/button';

type PwaInstallAudience = 'coach' | 'player';

type PwaInstallControlProps = {
  audience?: PwaInstallAudience;
  tone?: 'default' | 'darkGlass' | 'player';
};

const PHONE_OPTIMIZATION_NOTE =
  'Dumala is optimized for laptops, PCs, and tablets. Installing adds a shortcut, but a larger screen gives the full experience.';

const getInstallCopy = (audience: PwaInstallAudience) => {
  if (audience === 'player') {
    return {
      label: 'Install Player',
      title: 'Install Dumala Player',
      eyebrow: 'Player app',
      phoneNote: 'Built for Android, iPhone, and iPad home screens.',
      dialogIntro: 'Install Dumala Player from Safari so drills, timer, profile, and team updates open like an app.',
      offlineNote: 'After one successful online load, the app shell and local assets are available offline on this device.'
    };
  }

  return {
    label: 'Install Dumala',
    title: 'Install Dumala',
    eyebrow: 'iPhone and iPad',
    phoneNote: 'Best on a laptop, PC, or tablet.',
    dialogIntro: 'Dumala is optimized for browsers on laptops, PCs, and tablets. This install adds a home-screen shortcut; open Dumala on a larger screen for the full experience.',
    offlineNote: 'After one successful online load, the app shell and local assets are available offline on this device.'
  };
};

export default function PwaInstallControl({ audience = 'coach', tone = 'default' }: PwaInstallControlProps) {
  const {
    installMessage,
    isInstalled,
    requestInstall,
    setShowAppleInstructions,
    showAppleInstructions
  } = usePwaInstall();
  const isPhone = useIsPhone();
  const instructionsRef = useRef<HTMLDivElement | null>(null);
  const closeInstructions = () => setShowAppleInstructions(false);
  useDialogAccessibility(instructionsRef, showAppleInstructions, closeInstructions);

  const copy = getInstallCopy(audience);
  const isPlayerTone = tone === 'player';

  if (isInstalled) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-bold ${
        isPlayerTone
          ? 'border-[#ff6d00]/25 bg-[#ff6d00]/10 font-player-mono uppercase tracking-wide text-[#ffb06e]'
          : tone === 'darkGlass'
            ? 'border-sky-300/20 bg-sky-300/10 text-sky-100'
            : 'border-sky-100 bg-sky-50 text-sky-700'
      }`}>
        <Smartphone size={10} /> Installed
      </span>
    );
  }

  return (
    <>
      <div className="flex flex-col items-start gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={requestInstall}
          className={`h-7 gap-1 rounded-lg px-2.5 text-[10px] [&_svg]:size-3 ${
            isPlayerTone
              ? 'border-[#ff6d00]/25 bg-[#ff6d00]/10 font-player-mono uppercase tracking-wide text-[#ffd6b2] hover:border-[#ff6d00]/45 hover:bg-[#ff6d00]/20 hover:text-white'
              : tone === 'darkGlass'
                ? 'border-cyan-300/15 bg-[#0b1726]/85 text-slate-100 shadow-sm shadow-black/10 hover:border-orange-300/35 hover:bg-orange-300/10 hover:text-orange-100'
                : 'border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-200 hover:bg-blue-100 hover:text-blue-800'
          }`}
        >
          <Download size={10} />
          {copy.label}
        </Button>

        {isPhone && (
          <p className="px-0.5 text-[10px] font-semibold leading-4 text-slate-400">
            {copy.phoneNote}
          </p>
        )}
      </div>

      {installMessage && (
        <div
          className="fixed bottom-4 left-1/2 z-[130] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl border border-orange-300/35 bg-[#07111f]/95 px-4 py-3 text-center shadow-2xl shadow-black/35 backdrop-blur-xl"
          role="status"
          aria-live="polite"
        >
          <p className="text-xs font-bold text-slate-100">{installMessage}</p>
          {isPhone && (
            <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-slate-400">
              {audience === 'player' ? copy.phoneNote : PHONE_OPTIMIZATION_NOTE}
            </p>
          )}
        </div>
      )}

      {showAppleInstructions && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div
            ref={instructionsRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="apple-install-title"
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#07111f]/95 p-6 text-slate-100 shadow-2xl shadow-black/50 backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300">{copy.eyebrow}</p>
                <h2 id="apple-install-title" className="mt-1 font-display text-lg font-black text-slate-50">
                  {copy.title}
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeInstructions}
                aria-label="Close installation instructions"
                className="rounded-lg text-slate-400 hover:bg-white/10 hover:text-slate-100"
              >
                <X size={17} />
              </Button>
            </div>

            <p className="mt-4 rounded-xl border border-orange-300/25 bg-orange-300/10 px-3 py-2 text-xs font-medium leading-relaxed text-orange-100">
              {copy.dialogIntro}
            </p>

            <ol className="mt-5 space-y-3 text-sm font-medium text-slate-300">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-xs font-black text-cyan-100">1</span>
                Open {audience === 'player' ? 'Dumala Player' : 'Dumala'} in Safari.
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-xs font-black text-cyan-100">2</span>
                <span>Tap the <Share2 size={15} className="mx-1 inline text-cyan-300" /> Share button.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-xs font-black text-cyan-100">3</span>
                Choose <strong className="text-slate-50">Add to Home Screen</strong>, then confirm Add.
              </li>
            </ol>

            <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-400">
              {copy.offlineNote}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
