import { useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Circle, Rocket } from 'lucide-react';
import type { ActivationNavTarget, ActivationState } from '../activation/milestones';
import { HEALTHY_ROSTER_MIN } from '../activation/milestones';
import { Button } from './ui/button';

interface GettingStartedChecklistProps {
  state: ActivationState;
  onNavigate: (target: ActivationNavTarget) => void;
}

export default function GettingStartedChecklist({ state, onNavigate }: GettingStartedChecklistProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Once every milestone is reached the coach is activated; the checklist has
  // done its job and steps out of the way.
  if (state.isFullyActivated) return null;

  const progressPct = Math.round((state.activatedCount / state.total) * 100);

  return (
    <section
      aria-label="Getting started checklist"
      className="mb-4 rounded-2xl border border-cyan-300/15 bg-white/[0.03] p-4 shadow-sm shadow-black/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
            <Rocket size={18} aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-black text-slate-100">Get set up in your first week</h3>
            <p className="mt-0.5 text-xs font-semibold text-slate-400">
              {state.activatedCount} of {state.total} done · finish these to get real value from Dumala.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(value => !value)}
          className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand checklist' : 'Collapse checklist'}
        >
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400/80 to-emerald-400/80 transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {!collapsed && (
        <ul className="mt-4 space-y-2">
          {state.milestones.map(milestone => (
            <li
              key={milestone.id}
              className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors ${
                milestone.done
                  ? 'border-emerald-300/15 bg-emerald-300/[0.06]'
                  : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              <div className="flex items-start gap-3">
                {milestone.done ? (
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-300" aria-hidden="true" />
                ) : (
                  <Circle size={18} className="mt-0.5 shrink-0 text-slate-500" aria-hidden="true" />
                )}
                <div>
                  <p className={`text-sm font-bold ${milestone.done ? 'text-emerald-100' : 'text-slate-100'}`}>
                    {milestone.title}
                    {milestone.id === 'roster' && milestone.done && !state.hasHealthyRoster && (
                      <span className="ml-2 text-[11px] font-semibold text-amber-300">
                        Aim for {HEALTHY_ROSTER_MIN}+ players
                      </span>
                    )}
                  </p>
                  {!milestone.done && (
                    <p className="mt-0.5 text-xs text-slate-400">{milestone.hint}</p>
                  )}
                </div>
              </div>
              {!milestone.done && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onNavigate(milestone.navTarget)}
                  className="h-8 shrink-0 gap-1.5 rounded-lg bg-cyan-500/90 px-3 text-[11px] font-bold text-slate-950 hover:bg-cyan-400"
                >
                  {milestone.cta} <ArrowRight size={13} />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
