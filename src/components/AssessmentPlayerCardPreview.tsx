import React from 'react';
import {
  Activity,
  Award,
  Clock,
  ShieldAlert,
  Sparkles,
  Star,
  Target,
  Timer,
  Zap
} from 'lucide-react';
import type { FprdsAttributeId, FprdsRole, Player } from '../types';
import { POSITION_ATTR_COMPAT_KEYS } from '../fprds/weights';

type ScorePreview =
  | null
  | { ok: false; errors: Array<{ field: string; message: string }> }
  | {
      ok: true;
      attributeScores: Record<FprdsAttributeId, number>;
      ovr: number;
      weakestAttributeId: FprdsAttributeId;
      ovrTierLabel: string;
    };

const clampPercent = (val: number): number => {
  if (!Number.isFinite(val)) return 0;
  return Math.min(100, Math.max(0, Math.round(val)));
};

const safeNumber = (val: unknown, fallback = 0): number => {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return val;
};

const getBaseDefaults = () => ({
  pace: 50,
  stamina: 50,
  agility: 50,
  strength: 50,
  firstTouch: 50,
  shortPassing: 50
});

const ProgressMetric: React.FC<{ label: string; value: number; colorClass: string }> = (props) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{props.label}</span>
        <span className="text-sm font-display font-black text-slate-100">{Math.round(props.value)}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-2 rounded-full ${props.colorClass}`} style={{ width: `${clampPercent(props.value)}%` }} />
      </div>
    </div>
  );
};

const getRolePositionAttributes = (
  role: FprdsRole
): Array<{ label: string; attrId: FprdsAttributeId; fallbackKey: string }> => {
  const make = (label: string, attrId: FprdsAttributeId) => {
    const compat = POSITION_ATTR_COMPAT_KEYS[attrId];
    return { label, attrId, fallbackKey: compat ?? label };
  };

  if (role === 'ST' || role === 'W') {
    return [make('Finishing', 'finishingBox'), make('Long Shots', 'shotPower'), make('Offensive 1v1', 'offensive1v1'), make('Attacking Heading', 'attackingHeading')];
  }
  if (role === 'CM' || role === 'CDM') {
    return [make('Long Passing', 'longPassing'), make('Vision', 'visionPlaymaking'), make('Ball Retention', 'ballRetention'), make('Pressing', 'pressingInterceptions')];
  }
  if (role === 'FB' || role === 'CB') {
    return [make('Tackling', 'tackling'), make('Defensive Heading', 'defensiveHeading'), make('Positioning', 'positioningClearances'), make('Crossing', 'crossing')];
  }
  return [make('Reflexes', 'reflexes'), make('Handling', 'handling'), make('Diving', 'divingReach'), make('Distribution', 'distribution')];
};

export default function AssessmentPlayerCardPreview(props: {
  player: Player;
  role: FprdsRole;
  assessmentType: 'Full' | 'Quick';
  ageGroupLabel: string;
  scorePreview: ScorePreview;
}) {
  const base = props.player.baseAttributes ?? getBaseDefaults();
  const baselineOvr = Math.round((base.pace + base.stamina + base.agility + base.strength + base.firstTouch + base.shortPassing) / 6);

  const computedPreview = props.scorePreview && props.scorePreview.ok ? props.scorePreview : null;
  const shownOvr = computedPreview ? computedPreview.ovr : baselineOvr;

  const goals = safeNumber(props.player.points, 0);
  const assists = safeNumber(props.player.assists, 0);
  const minutes = safeNumber(props.player.minutesPlayed, 0);
  const goalsAndAssists = goals + assists;
  const minsPerGoal = goals > 0 ? `${Math.round(minutes / goals)}m` : '0m';

  const yellows = safeNumber(props.player.yellowCards, 0);
  const reds = safeNumber(props.player.redCards, 0);
  const disciplineValue = yellows + reds === 0 ? 'Clean' : `Y: ${yellows} • R: ${reds}`;

  const cleanSheetLabel =
    props.player.position === 'Goalkeeper' || props.player.position === 'Defender' ? 'Clean Sheets' : 'G+A Combined';

  const baseMetrics: Array<{ label: string; value: number }> = [
    { label: 'PACE', value: base.pace },
    { label: 'STAMINA', value: base.stamina },
    { label: 'AGILITY', value: base.agility },
    { label: 'STRENGTH', value: base.strength },
    { label: 'FIRST TOUCH', value: base.firstTouch },
    { label: 'SHORT PASS', value: base.shortPassing }
  ];

  const posAttrDefs = getRolePositionAttributes(props.role);
  const posMetrics = posAttrDefs.map((d) => {
    if (computedPreview) {
      const v = computedPreview.attributeScores[d.attrId];
      return { label: d.label.toUpperCase(), value: safeNumber(v, 50) };
    }
    const fallback = props.player.positionAttributes?.[d.fallbackKey];
    return { label: d.label.toUpperCase(), value: safeNumber(fallback, 50) };
  });

  return (
    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Identity and base attributes (left) */}
      <div className="bg-white/[0.03] border border-cyan-300/10 rounded-2xl p-4">
        <div className="bg-white/[0.03] rounded-2xl border border-cyan-300/10 p-3">
          <div className="grid grid-cols-[64px_1fr] items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center border-4 border-amber-400 shrink-0">
              <span className="text-xl font-display font-black text-white">{shownOvr}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-display font-black text-slate-100 truncate">
                {props.player.name}
              </p>
              <p className="text-[11px] text-slate-400 font-normal mt-0.5">Average</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Base Attributes</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
            {baseMetrics.map((m) => (
              <ProgressMetric key={m.label} label={m.label} value={m.value} colorClass="bg-cyan-400" />
            ))}
          </div>
        </div>

        <div className="border-t border-cyan-300/10 mt-4 pt-4">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Position Attributes</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
            {posMetrics.map((m) => (
              <ProgressMetric key={m.label} label={m.label} value={m.value} colorClass="bg-amber-400" />
            ))}
          </div>
        </div>
      </div>

      {/* Season stats ledger (right) */}
      <div className="bg-white/[0.03] border border-cyan-300/10 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-cyan-300" />
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Season Stats Ledger</p>
        </div>

        <div className="mt-3 divide-y divide-cyan-300/10">
          {[
            { icon: Activity, label: 'Games Played', value: safeNumber(props.player.gamesPlayed, 0) },
            { icon: Zap, label: 'Goals Scored', value: goals },
            { icon: Award, label: 'Assists Made', value: assists },
            { icon: Target, label: 'Goal Contributions', value: goalsAndAssists },
            { icon: Clock, label: 'Total Minutes', value: minutes },
            { icon: Target, label: cleanSheetLabel, value: safeNumber(props.player.cleanSheetsOrRebounds, 0) },
            { icon: Star, label: 'Man of the Match', value: safeNumber(props.player.mvpAwards, 0) },
            { icon: ShieldAlert, label: 'Discipline', value: disciplineValue, valueClassName: disciplineValue === 'Clean' ? 'text-slate-400' : 'text-slate-100' },
            { icon: Timer, label: 'Mins per Goal', value: minsPerGoal, valueClassName: goals > 0 ? 'text-slate-100' : 'text-slate-400' }
          ].map((row) => {
            const RowIcon = row.icon;
            return (
              <div key={row.label} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-white/[0.03] border border-cyan-300/10 flex items-center justify-center shrink-0">
                    <RowIcon size={14} className="text-cyan-300" />
                  </div>
                  <span className="text-sm font-medium text-slate-300 truncate">{row.label}</span>
                </div>
                <span className={`text-sm font-black whitespace-nowrap ${row.valueClassName ?? 'text-slate-100'}`}>
                  {String(row.value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
