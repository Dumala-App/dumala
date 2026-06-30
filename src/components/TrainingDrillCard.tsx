import React from 'react';
import {
  Activity,
  ArrowUpRight,
  Box,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  Crosshair,
  Dumbbell,
  Flame,
  Footprints,
  Gauge,
  Goal,
  Hand,
  HeartPulse,
  Route,
  Shield,
  Sparkles,
  Target,
  Users,
  Zap
} from 'lucide-react';
import type { DrillInstruction, TrainingDrill } from '../training/drillLibrary';
import { formatTrainingFocusList } from '../training/developmentEvidence';
import { Button } from './ui/button';

export function getDrillIcon(drillId: string): React.ReactNode {
  const iconMap: Record<string, React.ReactNode> = {
    "drill-agility": <Footprints size={18} />,
    "drill-shooting": <Target size={18} />,
    "drill-passing": <Route size={18} />,
    "drill-dribbling": <Footprints size={18} />,
    "drill-defending": <Shield size={18} />,
    "drill-gym": <Dumbbell size={18} />,
    "drill-heading": <Goal size={18} />,
    "drill-tactical-shadow": <Users size={18} />,
    "drill-goalkeeper": <Hand size={18} />,
    "drill-stamina-cardio": <Clock size={18} />,
    "drill-playmaking": <ArrowUpRight size={18} />,
    "drill-pressing": <Shield size={18} />,
    "drill-aerobic-base": <Activity size={18} />,
    "drill-repeat-sprint": <Gauge size={18} />,
    "drill-acceleration": <Zap size={18} />,
    "drill-plyometrics": <Flame size={18} />,
    "drill-mobility": <HeartPulse size={18} />,
    "drill-core-stability": <Shield size={18} />,
    "drill-fwd-finishing": <Crosshair size={18} />,
    "drill-fwd-positioning": <ArrowUpRight size={18} />,
    "drill-fwd-hold-up": <Target size={18} />,
    "drill-fwd-cross-finish": <Goal size={18} />,
    "drill-mid-transition": <Zap size={18} />,
    "drill-mid-through-ball": <ArrowUpRight size={18} />,
    "drill-mid-possession": <Route size={18} />,
    "drill-mid-long-range": <Target size={18} />,
    "drill-mid-pressing-resist": <Shield size={18} />,
    "drill-def-1v1": <Shield size={18} />,
    "drill-def-line-shift": <Users size={18} />,
    "drill-def-aerial": <Goal size={18} />,
    "drill-def-overlap": <ArrowUpRight size={18} />,
    "drill-gk-diving": <Hand size={18} />,
    "drill-gk-distribution": <Route size={18} />,
    "drill-gk-cross": <Hand size={18} />,
    "drill-gk-1v1": <Shield size={18} />,
    "drill-gk-footwork": <Footprints size={18} />,
    "drill-fwd-wall-pass": <Route size={18} />,
    "drill-fwd-blind-side": <Crosshair size={18} />,
    "drill-fwd-rebound": <Target size={18} />,
    "drill-fwd-distance-shooting": <Crosshair size={18} />,
    "drill-mid-switch-play": <Route size={18} />,
    "drill-mid-half-turn": <ArrowUpRight size={18} />,
    "drill-mid-breaking-lines": <ArrowUpRight size={18} />,
    "drill-mid-third-man": <Users size={18} />,
    "drill-pass-triangle": <Route size={18} />,
    "drill-pass-wall": <Route size={18} />,
    "drill-pass-overlap": <ArrowUpRight size={18} />,
    "drill-pass-one-touch-grid": <Gauge size={18} />,
    "drill-pass-target-switch": <Route size={18} />,
    "drill-pass-headed-pass": <Goal size={18} />,
    "drill-pass-under-pressure": <Shield size={18} />,
    "drill-warm-dynamic-ball": <Footprints size={18} />,
    "drill-warm-rondo-arrival": <Route size={18} />,
    "drill-warm-speed-react": <Zap size={18} />,
    "drill-warm-pass-move": <Route size={18} />,
    "drill-rondo-4v2-split": <Route size={18} />,
    "drill-positional-5v5-plus3": <Users size={18} />,
    "drill-counterpress-6-second": <Shield size={18} />,
    "drill-transition-wave": <Zap size={18} />,
    "drill-winger-1v1-cross": <ArrowUpRight size={18} />,
    "drill-fwd-pressing-curve": <Shield size={18} />,
    "drill-mid-pivot-scan": <Route size={18} />,
    "drill-mid-box-arrival": <Crosshair size={18} />,
    "drill-def-cb-build-out": <Route size={18} />,
    "drill-def-rest-defense": <Shield size={18} />,
    "drill-fullback-underlap": <ArrowUpRight size={18} />,
    "drill-gk-build-third-man": <Hand size={18} />,
    "drill-tactical-overload-to-isolate": <ArrowUpRight size={18} />,
    "drill-tactical-midblock-trap": <Shield size={18} />,
    "drill-tactical-backline-cover": <Users size={18} />,
    "drill-tactical-final-third-rotation": <Route size={18} />,
    "drill-tactical-set-piece-zones": <Goal size={18} />,
    "drill-tactical-press-resist-build": <Route size={18} />,
    "drill-cond-tempo-possession": <Activity size={18} />,
    "drill-cond-hiit-small-sided": <Gauge size={18} />,
    "drill-cond-accel-decel": <Zap size={18} />,
    "drill-cond-strength-carry": <Dumbbell size={18} />,
    "drill-cond-endurance-ladders": <Clock size={18} />,
    "drill-cond-speed-endurance": <Flame size={18} />,
    "drill-recovery-breath-mobility": <HeartPulse size={18} />,
    "drill-recovery-ball-circulation": <Route size={18} />,
    "drill-recovery-pool-shadow": <Activity size={18} />,
    "drill-recovery-yoga-hips": <HeartPulse size={18} />,
    "drill-recovery-regeneration-walk": <Users size={18} />,
    "drill-recovery-foam-band": <HeartPulse size={18} />
  };
  return iconMap[drillId] || <Activity size={18} />;
}

export function getDrillIconColor(drillId: string): string {
  const colorMap: Record<string, string> = {
    "drill-agility": "bg-sky-50 text-sky-600 border-sky-200",
    "drill-shooting": "bg-rose-50 text-rose-600 border-rose-200",
    "drill-passing": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "drill-dribbling": "bg-amber-50 text-amber-600 border-amber-200",
    "drill-defending": "bg-indigo-50 text-indigo-600 border-indigo-200",
    "drill-gym": "bg-slate-100 text-slate-700 border-slate-300",
    "drill-heading": "bg-blue-50 text-blue-600 border-blue-200",
    "drill-tactical-shadow": "bg-purple-50 text-purple-600 border-purple-200",
    "drill-goalkeeper": "bg-yellow-50 text-yellow-600 border-yellow-200",
    "drill-stamina-cardio": "bg-red-50 text-red-600 border-red-200",
    "drill-playmaking": "bg-violet-50 text-violet-600 border-violet-200",
    "drill-pressing": "bg-amber-50 text-amber-600 border-amber-200",
    "drill-aerobic-base": "bg-cyan-50 text-cyan-600 border-cyan-200",
    "drill-repeat-sprint": "bg-orange-50 text-orange-600 border-orange-200",
    "drill-acceleration": "bg-sky-50 text-sky-600 border-sky-200",
    "drill-plyometrics": "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200",
    "drill-mobility": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "drill-core-stability": "bg-slate-50 text-slate-600 border-slate-200",
    "drill-fwd-finishing": "bg-rose-50 text-rose-600 border-rose-200",
    "drill-fwd-positioning": "bg-orange-50 text-orange-600 border-orange-200",
    "drill-fwd-hold-up": "bg-amber-50 text-amber-600 border-amber-200",
    "drill-fwd-cross-finish": "bg-red-50 text-red-600 border-red-200",
    "drill-mid-transition": "bg-sky-50 text-sky-600 border-sky-200",
    "drill-mid-through-ball": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "drill-mid-possession": "bg-teal-50 text-teal-600 border-teal-200",
    "drill-mid-long-range": "bg-violet-50 text-violet-600 border-violet-200",
    "drill-mid-pressing-resist": "bg-indigo-50 text-indigo-600 border-indigo-200",
    "drill-def-1v1": "bg-sky-50 text-sky-600 border-sky-200",
    "drill-def-line-shift": "bg-blue-50 text-blue-600 border-blue-200",
    "drill-def-aerial": "bg-slate-50 text-slate-600 border-slate-200",
    "drill-def-overlap": "bg-cyan-50 text-cyan-600 border-cyan-200",
    "drill-gk-diving": "bg-yellow-50 text-yellow-600 border-yellow-200",
    "drill-gk-distribution": "bg-lime-50 text-lime-600 border-lime-200",
    "drill-gk-cross": "bg-amber-50 text-amber-600 border-amber-200",
    "drill-gk-1v1": "bg-orange-50 text-orange-600 border-orange-200",
    "drill-gk-footwork": "bg-blue-50 text-blue-600 border-blue-200",
    "drill-fwd-wall-pass": "bg-rose-50 text-rose-600 border-rose-200",
    "drill-fwd-blind-side": "bg-orange-50 text-orange-600 border-orange-200",
    "drill-fwd-rebound": "bg-red-50 text-red-600 border-red-200",
    "drill-fwd-distance-shooting": "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200",
    "drill-mid-switch-play": "bg-blue-50 text-blue-600 border-blue-200",
    "drill-mid-half-turn": "bg-teal-50 text-teal-600 border-teal-200",
    "drill-mid-breaking-lines": "bg-cyan-50 text-cyan-600 border-cyan-200",
    "drill-mid-third-man": "bg-purple-50 text-purple-600 border-purple-200",
    "drill-pass-triangle": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "drill-pass-wall": "bg-lime-50 text-lime-600 border-lime-200",
    "drill-pass-overlap": "bg-cyan-50 text-cyan-600 border-cyan-200",
    "drill-pass-one-touch-grid": "bg-sky-50 text-sky-600 border-sky-200",
    "drill-pass-target-switch": "bg-indigo-50 text-indigo-600 border-indigo-200",
    "drill-pass-headed-pass": "bg-amber-50 text-amber-600 border-amber-200",
    "drill-pass-under-pressure": "bg-rose-50 text-rose-600 border-rose-200",
    "drill-warm-dynamic-ball": "bg-teal-50 text-teal-600 border-teal-200",
    "drill-warm-rondo-arrival": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "drill-warm-speed-react": "bg-sky-50 text-sky-600 border-sky-200",
    "drill-warm-pass-move": "bg-lime-50 text-lime-600 border-lime-200",
    "drill-rondo-4v2-split": "bg-teal-50 text-teal-600 border-teal-200",
    "drill-positional-5v5-plus3": "bg-indigo-50 text-indigo-600 border-indigo-200",
    "drill-counterpress-6-second": "bg-amber-50 text-amber-600 border-amber-200",
    "drill-transition-wave": "bg-orange-50 text-orange-600 border-orange-200",
    "drill-winger-1v1-cross": "bg-cyan-50 text-cyan-600 border-cyan-200",
    "drill-fwd-pressing-curve": "bg-rose-50 text-rose-600 border-rose-200",
    "drill-mid-pivot-scan": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "drill-mid-box-arrival": "bg-violet-50 text-violet-600 border-violet-200",
    "drill-def-cb-build-out": "bg-blue-50 text-blue-600 border-blue-200",
    "drill-def-rest-defense": "bg-slate-50 text-slate-600 border-slate-200",
    "drill-fullback-underlap": "bg-sky-50 text-sky-600 border-sky-200",
    "drill-gk-build-third-man": "bg-lime-50 text-lime-600 border-lime-200",
    "drill-tactical-overload-to-isolate": "bg-indigo-50 text-indigo-600 border-indigo-200",
    "drill-tactical-midblock-trap": "bg-amber-50 text-amber-600 border-amber-200",
    "drill-tactical-backline-cover": "bg-blue-50 text-blue-600 border-blue-200",
    "drill-tactical-final-third-rotation": "bg-violet-50 text-violet-600 border-violet-200",
    "drill-tactical-set-piece-zones": "bg-slate-50 text-slate-600 border-slate-200",
    "drill-tactical-press-resist-build": "bg-cyan-50 text-cyan-600 border-cyan-200",
    "drill-cond-tempo-possession": "bg-cyan-50 text-cyan-600 border-cyan-200",
    "drill-cond-hiit-small-sided": "bg-red-50 text-red-600 border-red-200",
    "drill-cond-accel-decel": "bg-sky-50 text-sky-600 border-sky-200",
    "drill-cond-strength-carry": "bg-slate-100 text-slate-700 border-slate-300",
    "drill-cond-endurance-ladders": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "drill-cond-speed-endurance": "bg-orange-50 text-orange-600 border-orange-200",
    "drill-recovery-breath-mobility": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "drill-recovery-ball-circulation": "bg-lime-50 text-lime-600 border-lime-200",
    "drill-recovery-pool-shadow": "bg-cyan-50 text-cyan-600 border-cyan-200",
    "drill-recovery-yoga-hips": "bg-teal-50 text-teal-600 border-teal-200",
    "drill-recovery-regeneration-walk": "bg-slate-50 text-slate-600 border-slate-200",
    "drill-recovery-foam-band": "bg-green-50 text-green-600 border-green-200"
  };
  return colorMap[drillId] || "bg-slate-50 text-slate-600 border-slate-200";
}

type TrainingDrillCardProps = {
  drill: TrainingDrill;
  instructions?: DrillInstruction;
  isSelected: boolean;
  isRecommended?: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onDragStart: (event: React.DragEvent) => void;
  onToggleExpanded: () => void;
};

export const TrainingDrillCard = ({
  drill,
  instructions,
  isSelected,
  isRecommended,
  isExpanded,
  onSelect,
  onDragStart,
  onToggleExpanded
}: TrainingDrillCardProps) => {
  const toggleExpand = (event: React.MouseEvent) => {
    event.stopPropagation();
    onToggleExpanded();
  };

  return (
    <div
      id={`drill-card-${drill.id}`}
      draggable={true}
      onDragStart={onDragStart}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Select ${drill.name}`}
      className={`relative flex cursor-grab flex-col justify-between overflow-hidden rounded-xl border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:cursor-grabbing ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50/60 shadow-sm'
          : isRecommended
            ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300 hover:bg-emerald-50/40'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${getDrillIconColor(drill.id)}`}>
          {getDrillIcon(drill.id)}
        </div>
        <div className="space-y-1 w-full">
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-slate-800">{drill.name}</span>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black uppercase tracking-wider">{drill.category}</span>
          </div>

          {isRecommended && (
            <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded mt-0.5">
              <Sparkles size={10} /> Highly Recommended
            </div>
          )}

          <p className="line-clamp-2 pt-1 text-[11px] leading-relaxed text-slate-500">{drill.description}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-[10px] font-bold">
        <span className="flex items-center gap-1 text-indigo-600">
          <Sparkles size={11} /> Focus: {formatTrainingFocusList(drill.developmentFocus)}
        </span>
        <span className="text-rose-500 flex items-center gap-1">
          <Flame size={11} /> Intensity {drill.fatigueIncrease}/10
        </span>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100">
        <Button
          type="button"
          variant="ghost"
          onClick={toggleExpand}
          aria-expanded={isExpanded}
          className="h-auto w-full justify-between p-0 text-xs font-black uppercase tracking-wider text-slate-400 hover:bg-transparent hover:text-slate-600"
        >
          <span className="flex items-center gap-1.5"><ClipboardList size={12} /> How-To Guide</span>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </Button>
        {isExpanded && instructions && (
          <div className="mt-2 space-y-2.5 text-[11px] text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100">
            <div className="flex items-start gap-2">
              <Box size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <div><span className="font-black text-slate-500 uppercase tracking-wider">Equipment:</span> {instructions.equipment}</div>
            </div>
            <div className="flex items-start gap-2">
              <Route size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <div><span className="font-black text-slate-500 uppercase tracking-wider">Setup:</span> {instructions.setup}</div>
            </div>
            <div className="flex items-start gap-2">
              <Activity size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <div><span className="font-black text-slate-500 uppercase tracking-wider">Execution:</span> {instructions.execution}</div>
            </div>
            <div className="flex items-start gap-2">
              <Clock size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <div><span className="font-black text-slate-500 uppercase tracking-wider">Sets/Reps:</span> {instructions.setsReps}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
