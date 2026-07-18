import { useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Circle, Compass, Rocket } from 'lucide-react';
import type { ActivationNavTarget, ActivationState } from '../activation/milestones';
import { HEALTHY_ROSTER_MIN } from '../activation/milestones';
import { Button } from './ui/button';

interface GettingStartedChecklistProps {
  state: ActivationState;
  onNavigate: (target: ActivationNavTarget) => void;
  onReplayTour?: () => void;
}

export default function GettingStartedChecklist({ state, onNavigate, onReplayTour }: GettingStartedChecklistProps) {
  // Collapsed by default: the strip should whisper, not shout. Coaches expand it
  // when they want their next step.
  const [expanded, setExpanded] = useState(false);

  // Once every milestone is reached the coach is activated; the checklist has
  // done its job and steps out of the way.
  if (state.isFullyActivated) return null;

  const progressPct = Math.round((state.activatedCount / state.total) * 100);
  const nextMilestone = state.milestones.find(milestone => !milestone.done);

  return (
    <section
      id="getting-started-strip"
      aria-label="Getting started checklist"
      className="mb-4 rounded-xl border border-cyan-300/15 bg-white/[0.03] shadow-sm shadow-black/20"
    >
      <div className="flex items-center gap-3 px-3 py-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
          <Rocket size={14} aria-hidden="true" />
        </span>

        <div className="hidden min-w-0 items-center gap-2 sm:flex">
          <span className="whitespace-nowrap text-xs font-black text-slate-100">Setup</span>
          <span className="whitespace-nowrap text-[11px] font-bold text-slate-400">
            {state.activatedCount}/{state.total}
          </span>
          <span className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden="true">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-cyan-400/80 to-emerald-400/80 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </span>
        </div>

        {nextMilestone && (
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            <p className="min-w-0 truncate text-xs font-semibold text-slate-300">
              <span className="text-slate-500">Next:</span> {nextMilestone.title}
            </p>
            <Button
              type="button"
              size="sm"
              onClick={() => onNavigate(nextMilestone.navTarget)}
              className="h-7 shrink-0 gap-1 rounded-lg bg-cyan-500/90 px-2.5 text-[11px] font-bold text-slate-950 hover:bg-cyan-400 [&_svg]:size-3"
            >
              {nextMilestone.cta} <ArrowRight size={12} />
            </Button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setExpanded(value => !value)}
          className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse setup checklist' : 'Expand setup checklist'}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-white/[0.06] px-3 pb-3 pt-2">
          <p className="px-1 text-[11px] font-semibold text-slate-400">
            Finish these first-week steps at your own pace — Dumala tracks them automatically.
          </p>
          <ul className="mt-2 space-y-1">
            {state.milestones.map(milestone => (
              <li
                key={milestone.id}
                className="flex items-center justify-between gap-3 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-white/[0.03]"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  {milestone.done ? (
                    <CheckCircle2 size={15} className="shrink-0 text-emerald-300" aria-hidden="true" />
                  ) : (
                    <Circle size={15} className="shrink-0 text-slate-500" aria-hidden="true" />
                  )}
                  <div className="min-w-0">
                    <p className={`truncate text-xs font-bold ${milestone.done ? 'text-slate-400 line-through decoration-slate-600' : 'text-slate-100'}`}>
                      {milestone.title}
                      {milestone.id === 'roster' && milestone.done && !state.hasHealthyRoster && (
                        <span className="ml-2 text-[10px] font-semibold text-amber-300 no-underline">
                          Aim for {HEALTHY_ROSTER_MIN}+ players
                        </span>
                      )}
                    </p>
                    {!milestone.done && (
                      <p className="mt-0.5 hidden truncate text-[11px] text-slate-500 sm:block">{milestone.hint}</p>
                    )}
                  </div>
                </div>
                {!milestone.done && (
                  <button
                    type="button"
                    onClick={() => onNavigate(milestone.navTarget)}
                    className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-bold text-cyan-300 transition-colors hover:bg-cyan-300/10 hover:text-cyan-200"
                  >
                    {milestone.cta} <ArrowRight size={11} aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {onReplayTour && (
            <button
              type="button"
              onClick={onReplayTour}
              className="mt-2 flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] font-bold text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-slate-200"
            >
              <Compass size={12} aria-hidden="true" /> Replay the app tour
            </button>
          )}
        </div>
      )}
    </section>
  );
}
