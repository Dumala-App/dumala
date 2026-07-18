import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import type { CoachTourStep } from '../onboarding/coachTour';
import { Button } from './ui/button';

interface CoachTourOverlayProps {
  steps: readonly CoachTourStep[];
  onClose: (completed: boolean) => void;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

// Measures before paint in the browser; falls back to useEffect during
// server-style test rendering where useLayoutEffect warns.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

// Spotlight walkthrough shown over the live workspace. Each step highlights a
// real UI element; steps whose target is not rendered (e.g. the desktop nav on
// mobile) fall back to a centered card so the copy still lands.
export default function CoachTourOverlay({ steps, onClose }: CoachTourOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  const measure = useCallback(() => {
    const target = step.targetId ? document.getElementById(step.targetId) : null;
    const bounds = target?.getBoundingClientRect();
    if (!bounds || (bounds.width === 0 && bounds.height === 0)) {
      setRect(null);
      return;
    }
    setRect({ top: bounds.top, left: bounds.left, width: bounds.width, height: bounds.height });
  }, [step.targetId]);

  useIsomorphicLayoutEffect(() => {
    const target = step.targetId ? document.getElementById(step.targetId) : null;
    const bounds = target?.getBoundingClientRect();
    if (target && bounds && (bounds.width > 0 || bounds.height > 0) && (bounds.top < 0 || bounds.bottom > window.innerHeight)) {
      target.scrollIntoView({ block: 'center' });
    }
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step.targetId, measure]);

  useEffect(() => {
    primaryButtonRef.current?.focus();
  }, [stepIndex]);

  const goNext = useCallback(() => {
    if (isLastStep) {
      onClose(true);
      return;
    }
    setStepIndex(index => Math.min(index + 1, steps.length - 1));
  }, [isLastStep, onClose, steps.length]);

  const goBack = useCallback(() => setStepIndex(index => Math.max(index - 1, 0)), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose(false);
      if (event.key === 'ArrowRight') goNext();
      if (event.key === 'ArrowLeft') goBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goNext, goBack]);

  const cardStyle: CSSProperties = rect
    ? (() => {
        const width = Math.min(330, window.innerWidth - 24);
        const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, 12), window.innerWidth - width - 12);
        const placeBelow = rect.top + rect.height / 2 < window.innerHeight / 2;
        return placeBelow
          ? { top: rect.top + rect.height + 14, left, width }
          : { bottom: window.innerHeight - rect.top + 14, left, width };
      })()
    : {};

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby="coach-tour-title">
      {rect ? (
        <div
          aria-hidden="true"
          className="absolute rounded-xl border-2 border-cyan-300/80 transition-all duration-200"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: '0 0 0 100vmax rgba(2, 7, 19, 0.82)'
          }}
        />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 bg-[#020713]/85" />
      )}

      <div
        className={`rounded-2xl border border-cyan-300/20 bg-[#07111f] p-4 text-slate-100 shadow-2xl shadow-black/50 ${
          rect
            ? 'absolute'
            : 'absolute left-1/2 top-1/2 w-[340px] max-w-[calc(100vw-1.5rem)] -translate-x-1/2 -translate-y-1/2'
        }`}
        style={cardStyle}
      >
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-lg border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
            <Compass size={13} aria-hidden="true" />
          </span>
          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
            {stepIndex + 1} of {steps.length}
          </p>
        </div>
        <h2 id="coach-tour-title" className="mt-2 text-base font-black text-white">{step.title}</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{step.body}</p>

        <div className="mt-3.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="mr-auto rounded-md px-1.5 py-1 text-[11px] font-bold text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-slate-300"
          >
            Skip tour
          </button>
          {stepIndex > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goBack}
              className="h-8 gap-1 rounded-lg border-white/15 bg-white/[0.04] px-2.5 text-[11px] font-bold text-slate-200 hover:bg-white/10 hover:text-white [&_svg]:size-3"
            >
              <ArrowLeft size={12} /> Back
            </Button>
          )}
          <Button
            ref={primaryButtonRef}
            type="button"
            size="sm"
            onClick={goNext}
            className="h-8 gap-1 rounded-lg bg-cyan-500/90 px-3 text-[11px] font-bold text-slate-950 hover:bg-cyan-400 [&_svg]:size-3"
          >
            {isLastStep ? 'Finish' : stepIndex === 0 ? 'Start tour' : 'Next'}
            {!isLastStep && <ArrowRight size={12} />}
          </Button>
        </div>
      </div>
    </div>
  );
}
