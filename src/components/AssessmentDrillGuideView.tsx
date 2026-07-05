import React, { useMemo, useState } from 'react';
import { BookOpen, ClipboardCheck, Gauge, Hand, Image as ImageIcon, ListChecks, MapPin, Repeat, ShieldAlert, SlidersHorizontal, Target, TrendingDown, TrendingUp, Users, Volume2, Wrench } from 'lucide-react';
import { DRILL_GUIDE_CATEGORIES, DRILL_GUIDE_ENTRIES, type DrillGuideAudio, type DrillGuideEntry, type GoalkeeperRequirement } from '../fprds/drillGuide';
import {
  BALL_RETENTION_SECONDS,
  BROAD_JUMP_CM,
  COACH_SCORE_1_TO_10,
  ILLINOIS_AGILITY,
  MED_BALL_THROW_CM,
  OUT_OF_5_BANDS,
  OUT_OF_10_BANDS,
  OUT_OF_10_DIRECT,
  SHOT_POWER_DISTANCE_M,
  SPRINT_10M,
  SPRINT_30M,
  TIER_SCORE_RANGES,
  YOYO_DISTANCE,
  type AgeGroup,
  type BenchmarkTable,
  type TierLabel
} from '../fprds/benchmarks';
import { QUICK_ROLE_POSITION_ATTRIBUTES, ROLE_LABELS, ROLE_WEIGHTS } from '../fprds/weights';
import type { FprdsAttributeId, FprdsRole } from '../types';
import { SegmentedTabs, type SegmentedTabOption } from './ui/segmented-tabs';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from './ui/select';

type GuideSection = 'drills' | 'benchmark';
type ActiveGuideCategory = 'All' | DrillGuideEntry['category'];

type BenchmarkCard = {
  title: string;
  unit: string;
  source: BenchmarkTable | Record<AgeGroup, BenchmarkTable>;
};

type CountBand = { min: number; max: number; scoreMin: number; scoreMax: number };

type BenchmarkPanel =
  | {
      kind: 'table';
      title: string;
      unit: string;
      source: BenchmarkTable | Record<AgeGroup, BenchmarkTable>;
    }
  | {
      kind: 'bands';
      title: string;
      unit: string;
      bands: CountBand[];
      note?: string;
    }
  | {
      kind: 'direct';
      title: string;
      unit: string;
      mapping: Record<number, number>;
      values: number[];
      note?: string;
    }
  | {
      kind: 'finishing';
      title: string;
    };

const SECTION_OPTIONS: Array<SegmentedTabOption<GuideSection>> = [
  { value: 'drills', label: 'Drills' },
  { value: 'benchmark', label: 'Benchmark' }
];

const ageGroups: AgeGroup[] = ['U12', 'U15', 'U18', 'Adult'];
const roles: FprdsRole[] = ['ST', 'W', 'CM', 'CDM', 'FB', 'CB', 'GK'];

const attributeLabels: Record<FprdsAttributeId, string> = {
  pace: 'Pace',
  stamina: 'Stamina',
  agility: 'Agility',
  strength: 'Strength',
  firstTouch: 'First touch',
  shortPassing: 'Short passing',
  finishingBox: 'Finishing box',
  shotPower: 'Shot power',
  offensive1v1: 'Offensive 1v1',
  attackingHeading: 'Attacking heading',
  longPassing: 'Long passing',
  visionPlaymaking: 'Vision / playmaking',
  ballRetention: 'Ball retention',
  pressingInterceptions: 'Pressing / interceptions',
  tackling: 'Tackling',
  defensiveHeading: 'Defensive heading',
  positioningClearances: 'Positioning / clearances',
  crossing: 'Crossing',
  reflexes: 'Reflexes',
  handling: 'Handling',
  divingReach: 'Diving / reach',
  distribution: 'Distribution'
};

// Tier ranking drives the scoring colour hierarchy: strongest (emerald) -> weakest (rose).
const TIER_STYLES: Record<TierLabel, { chip: string; dot: string; bar: string }> = {
  Elite: { chip: 'border-emerald-300/25 bg-emerald-300/12 text-emerald-100', dot: 'bg-emerald-300', bar: 'bg-emerald-400/70' },
  Advanced: { chip: 'border-cyan-300/25 bg-cyan-300/12 text-cyan-100', dot: 'bg-cyan-300', bar: 'bg-cyan-400/70' },
  Developing: { chip: 'border-amber-300/25 bg-amber-300/12 text-amber-100', dot: 'bg-amber-300', bar: 'bg-amber-400/70' },
  'Below Average': { chip: 'border-orange-300/25 bg-orange-400/12 text-orange-100', dot: 'bg-orange-400', bar: 'bg-orange-400/70' },
  Beginner: { chip: 'border-rose-300/25 bg-rose-400/12 text-rose-100', dot: 'bg-rose-300', bar: 'bg-rose-400/70' }
};

// Ascending (weakest -> strongest) for the score-scale legend.
const TIER_ORDER: TierLabel[] = ['Beginner', 'Below Average', 'Developing', 'Advanced', 'Elite'];
const SCORE_SCALE_MIN = 10;
const SCORE_SCALE_MAX = 99;

type SectionAccent = 'cyan' | 'orange' | 'amber' | 'emerald' | 'rose';

const SECTION_ACCENTS: Record<SectionAccent, { border: string; label: string; marker: string }> = {
  cyan: { border: 'border-cyan-300/35', label: 'text-cyan-200/80', marker: 'text-cyan-300/70' },
  orange: { border: 'border-orange-300/35', label: 'text-orange-200/80', marker: 'text-orange-300/70' },
  amber: { border: 'border-amber-300/35', label: 'text-amber-200/80', marker: 'text-amber-300/70' },
  emerald: { border: 'border-emerald-300/35', label: 'text-emerald-200/80', marker: 'text-emerald-300/70' },
  rose: { border: 'border-rose-300/35', label: 'text-rose-200/80', marker: 'text-rose-300/70' }
};

const CATEGORY_ACCENTS: Record<DrillGuideEntry['category'], string> = {
  Base: 'text-cyan-200',
  ForwardsWingers: 'text-orange-200',
  Midfielders: 'text-emerald-200',
  Defenders: 'text-sky-200',
  Goalkeepers: 'text-violet-200'
};

const SELECT_CONTENT_CLASS = 'z-[90] border-cyan-300/15 bg-[#07111f] text-slate-100 shadow-2xl shadow-black/35';
const SELECT_ITEM_CLASS = 'text-slate-200 focus:bg-orange-300/12 focus:text-orange-50 data-[state=checked]:bg-orange-300/10 data-[state=checked]:text-orange-50';
const SELECT_LABEL_CLASS = 'text-[10px] font-black uppercase tracking-[0.14em] text-slate-500';
const SELECT_TRIGGER_CLASS = 'h-9 rounded-lg border-cyan-300/15 bg-[#0b1726]/85 text-xs font-bold text-slate-100 focus:ring-orange-300/25 disabled:opacity-60';

const GK_CHIP_STYLES: Record<GoalkeeperRequirement, { label: string; chip: string; icon: string }> = {
  required: { label: 'Goalkeeper required', chip: 'border-violet-300/35 bg-violet-300/12 text-violet-100', icon: 'text-violet-300' },
  optional: { label: 'Goalkeeper optional', chip: 'border-amber-300/25 bg-amber-300/[0.08] text-amber-100', icon: 'text-amber-300' },
  none: { label: 'No goalkeeper needed', chip: 'border-cyan-300/12 bg-white/[0.03] text-slate-300', icon: 'text-slate-400' },
  athlete: { label: 'Athlete is the goalkeeper', chip: 'border-violet-300/35 bg-violet-300/12 text-violet-100', icon: 'text-violet-300' }
};

const eyebrowClass = 'text-[10px] font-black uppercase tracking-[0.16em]';
const panelClass = 'rounded-2xl border border-cyan-300/10 bg-[#07111f]/80 p-5 shadow-lg shadow-black/20 backdrop-blur-xl';

const benchmarkCards: BenchmarkCard[] = [
  { title: '30m Sprint', unit: 'seconds', source: SPRINT_30M },
  { title: '10m Sprint', unit: 'seconds', source: SPRINT_10M },
  { title: 'Illinois Agility', unit: 'seconds', source: ILLINOIS_AGILITY },
  { title: 'Yo-Yo Distance', unit: 'meters', source: YOYO_DISTANCE },
  { title: 'Broad Jump', unit: 'centimeters', source: BROAD_JUMP_CM },
  { title: 'Medicine Ball Throw', unit: 'centimeters', source: MED_BALL_THROW_CM },
  { title: 'Shot Power Controlled Distance', unit: 'meters', source: SHOT_POWER_DISTANCE_M },
  { title: 'Ball Retention', unit: 'seconds', source: BALL_RETENTION_SECONDS }
];

const directOutOf10Values = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
const coachScoreValues = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

const drillBenchmarkPanels: Record<string, BenchmarkPanel[]> = {
  base_sprint_10_30: [
    benchmarkCards[1],
    benchmarkCards[0]
  ].map((card) => ({ kind: 'table', ...card })),
  base_yoyo: [{ kind: 'table', ...benchmarkCards[3] }],
  base_illinois: [{ kind: 'table', ...benchmarkCards[2] }],
  base_power: [
    benchmarkCards[4],
    benchmarkCards[5]
  ].map((card) => ({ kind: 'table', ...card })),
  base_first_touch: [{
    kind: 'direct',
    title: 'First Touch Successes',
    unit: 'successful controls out of 10',
    mapping: OUT_OF_10_DIRECT,
    values: directOutOf10Values
  }],
  base_short_passing: [{
    kind: 'direct',
    title: 'Short Passing Successes',
    unit: 'successful passes out of 10',
    mapping: OUT_OF_10_DIRECT,
    values: directOutOf10Values
  }],
  fw_finishing_box: [{ kind: 'finishing', title: 'Finishing Goals + On-Target Score' }],
  fw_shot_power: [{ kind: 'table', ...benchmarkCards[6] }],
  fw_offensive_1v1: [{
    kind: 'bands',
    title: 'Offensive 1v1 Take-ons',
    unit: 'successful take-ons out of 10',
    bands: OUT_OF_10_BANDS
  }],
  fw_attacking_heading: [{
    kind: 'direct',
    title: 'Attacking Heading',
    unit: 'on-target headers out of 10',
    mapping: OUT_OF_10_DIRECT,
    values: directOutOf10Values
  }],
  mid_long_passing: [{
    kind: 'bands',
    title: 'Long Passing Weighted Successes',
    unit: 'effective out-of-10 score from 30m and 40m attempts',
    bands: OUT_OF_10_BANDS,
    note: 'Dumala weights 40m completions higher: effective score = ((30m successes + 1.5 x 40m successes) / 12.5) x 10.'
  }],
  mid_vision_rondo: [{
    kind: 'direct',
    title: 'Vision / Playmaking Coach Score',
    unit: 'coach score 1-10',
    mapping: COACH_SCORE_1_TO_10,
    values: coachScoreValues
  }],
  mid_ball_retention: [{ kind: 'table', ...benchmarkCards[7] }],
  mid_pressing_cage: [{
    kind: 'bands',
    title: 'Pressing / Interceptions',
    unit: 'wins out of 5',
    bands: OUT_OF_5_BANDS
  }],
  def_tackling_1v1: [{
    kind: 'bands',
    title: 'Tackling Wins',
    unit: 'challenges won out of 10',
    bands: OUT_OF_10_BANDS
  }],
  def_heading_clearance: [{
    kind: 'direct',
    title: 'Defensive Heading',
    unit: 'clearances out of 10',
    mapping: OUT_OF_10_DIRECT,
    values: directOutOf10Values
  }],
  def_positioning_clearances: [
    {
      kind: 'direct',
      title: 'Positioning Coach Score',
      unit: 'coach score 1-10',
      mapping: COACH_SCORE_1_TO_10,
      values: coachScoreValues
    },
    {
      kind: 'direct',
      title: 'Clearances To Safe Zone',
      unit: 'clearances out of 10',
      mapping: OUT_OF_10_DIRECT,
      values: directOutOf10Values
    }
  ],
  def_crossing_target: [{
    kind: 'direct',
    title: 'Crossing Successes',
    unit: 'crosses into target box out of 10',
    mapping: OUT_OF_10_DIRECT,
    values: directOutOf10Values
  }],
  gk_reflexes: [{
    kind: 'direct',
    title: 'Goalkeeper Reflexes',
    unit: 'saves / catches out of 10',
    mapping: OUT_OF_10_DIRECT,
    values: directOutOf10Values
  }],
  gk_handling: [{
    kind: 'direct',
    title: 'Goalkeeper Handling',
    unit: 'clean catches out of 10',
    mapping: OUT_OF_10_DIRECT,
    values: directOutOf10Values
  }],
  gk_diving: [{
    kind: 'direct',
    title: 'Goalkeeper Diving / Reach',
    unit: 'saves out of 10',
    mapping: OUT_OF_10_DIRECT,
    values: directOutOf10Values
  }],
  gk_distribution: [{
    kind: 'direct',
    title: 'Goalkeeper Distribution',
    unit: 'successful deliveries out of 10',
    mapping: OUT_OF_10_DIRECT,
    values: directOutOf10Values
  }]
};

const getBenchmarkForAge = (card: BenchmarkCard, ageGroup: AgeGroup): BenchmarkTable => (
  'direction' in card.source ? card.source : card.source[ageGroup]
);

const formatTierRange = (table: BenchmarkTable, rawBest: number | null, rawWorst: number | null): string => {
  if (table.direction === 'lower_is_better') {
    if (rawBest === null && rawWorst !== null) return `<= ${rawWorst}`;
    if (rawWorst === null && rawBest !== null) return `>= ${rawBest}`;
    return `${rawBest}-${rawWorst}`;
  }

  if (rawBest === null && rawWorst !== null) return `>= ${rawWorst}`;
  if (rawWorst === null && rawBest !== null) return `<= ${rawBest}`;
  return `${rawWorst}-${rawBest}`;
};

const InstructionSection = (props: { label: string; items: string[]; accent: SectionAccent }) => {
  if (props.items.length === 0) return null;
  const accent = SECTION_ACCENTS[props.accent];
  return (
    <div className={`mb-5 break-inside-avoid border-l-2 ${accent.border} pl-3.5`}>
      <p className={`${eyebrowClass} ${accent.label}`}>{props.label}</p>
      <ul className="mt-2 space-y-1.5">
        {props.items.map((item) => (
          <li key={item} className="flex gap-2 text-[11.5px] font-semibold leading-relaxed text-slate-300">
            <span className={`mt-[3px] shrink-0 ${accent.marker}`} aria-hidden="true">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const DrillIllustration = (props: { drill: DrillGuideEntry }) => (
  <div className="relative aspect-video overflow-hidden rounded-2xl border border-cyan-300/25 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.14),transparent_45%),radial-gradient(circle_at_80%_90%,rgba(251,146,60,0.1),transparent_45%),linear-gradient(140deg,#0b1a2c,#081120)] shadow-lg shadow-cyan-950/25 ring-1 ring-cyan-300/15">
    {props.drill.illustration ? (
      <img
        src={props.drill.illustration}
        alt={`Illustration for ${props.drill.title}`}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    ) : (
      <>
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
          <span className="flex size-11 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
            <ImageIcon size={20} />
          </span>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">Drill illustration</p>
          <p className="max-w-xs text-[11px] font-semibold leading-relaxed text-slate-500">
            A visual step-by-step guide for this drill will appear here.
          </p>
        </div>
      </>
    )}
    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-100 backdrop-blur-sm">
      How to run this drill
    </span>
  </div>
);

const AudioBlock = (props: { audio: DrillGuideAudio }) => (
  <div className="rounded-2xl border border-emerald-300/22 bg-emerald-300/[0.06] p-4">
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-300/12 text-emerald-200">
        <Volume2 size={16} />
      </span>
      <div className="min-w-0">
        <p className={`text-emerald-200/90 ${eyebrowClass}`}>Required audio · {props.audio.label}</p>
        {props.audio.description && (
          <p className="mt-1 text-[11.5px] font-semibold leading-relaxed text-emerald-100/85">{props.audio.description}</p>
        )}
      </div>
    </div>
    <audio controls preload="none" src={props.audio.src} className="mt-3 h-9 w-full max-w-[320px]">
      Your browser does not support the audio element.
    </audio>
  </div>
);

const ProcedureSteps = (props: { steps: string[] }) => (
  <div className="flex h-full flex-col rounded-2xl border border-cyan-300/25 bg-cyan-300/[0.06] p-4 shadow-lg shadow-cyan-950/15 ring-1 ring-cyan-300/10">
    <p className={`flex items-center gap-1.5 text-cyan-100 ${eyebrowClass}`}>
      <ListChecks size={13} className="text-cyan-300" /> Procedure · how to run it
    </p>
    <ol className="mt-3 space-y-2.5">
      {props.steps.map((step, index) => (
        <li key={step} className="flex gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/15 text-[11px] font-black text-cyan-50">
            {index + 1}
          </span>
          <span className="text-[12.5px] font-semibold leading-relaxed text-slate-100">{step}</span>
        </li>
      ))}
    </ol>
  </div>
);

// Universal FPRDS rating scale — a legend that helps interpret every scoring table.
const ScoreScale = () => {
  const span = SCORE_SCALE_MAX - SCORE_SCALE_MIN + 1;
  return (
    <div className="rounded-xl border border-cyan-300/10 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between">
        <p className={`text-slate-400 ${eyebrowClass}`}>FPRDS score scale</p>
        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">10 – 99</span>
      </div>
      <div className="mt-2 flex h-5 overflow-hidden rounded-md">
        {TIER_ORDER.map((tier) => {
          const range = TIER_SCORE_RANGES[tier];
          const width = ((range.scoreMax - range.scoreMin + 1) / span) * 100;
          return (
            <div
              key={tier}
              className={`${TIER_STYLES[tier].bar} flex items-center justify-center`}
              style={{ width: `${width}%` }}
              title={`${tier}: ${range.scoreMin}-${range.scoreMax}`}
            >
              <span className="text-[8px] font-black text-slate-950/70">{range.scoreMin}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {[...TIER_ORDER].reverse().map((tier) => (
          <span key={tier} className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide text-slate-400">
            <span className={`size-2 rounded-full ${TIER_STYLES[tier].dot}`} aria-hidden="true" />
            {tier} {TIER_SCORE_RANGES[tier].scoreMin}-{TIER_SCORE_RANGES[tier].scoreMax}
          </span>
        ))}
      </div>
    </div>
  );
};

const ScoringHeader = (props: { title: string; unit: string; badge?: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-3">
    <div className="min-w-0">
      <h4 className="font-display text-sm font-black text-slate-100">{props.title}</h4>
      <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{props.unit}</p>
    </div>
    {props.badge}
  </div>
);

const framedListClass = 'mt-3 overflow-hidden rounded-xl border border-cyan-300/10 bg-white/[0.02]';
const rowClass = 'grid items-center gap-3 px-3 py-2 text-[11.5px]';

const TableBenchmark = (props: { panel: Extract<BenchmarkPanel, { kind: 'table' }>; ageGroup: AgeGroup }) => {
  const benchmarkTable = getBenchmarkForAge(props.panel, props.ageGroup);
  const lowerIsBetter = benchmarkTable.direction === 'lower_is_better';
  return (
    <div>
      <ScoringHeader
        title={props.panel.title}
        unit={props.panel.unit}
        badge={(
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-cyan-300/15 bg-white/[0.04] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-300">
            {lowerIsBetter ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
            {lowerIsBetter ? 'Lower is better' : 'Higher is better'}
          </span>
        )}
      />
      <div className={framedListClass}>
        <div className={`${rowClass} grid-cols-[6.5rem_1fr_auto] border-b border-cyan-300/10 bg-white/[0.03] py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500`}>
          <span>Tier</span>
          <span>Raw result</span>
          <span>Score</span>
        </div>
        <div className="divide-y divide-cyan-300/8">
          {benchmarkTable.tiers.map((tier) => (
            <div key={`${props.panel.title}-${props.ageGroup}-${tier.label}`} className={`${rowClass} grid-cols-[6.5rem_1fr_auto]`}>
              <span className={`inline-flex w-fit items-center rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${TIER_STYLES[tier.label].chip}`}>
                {tier.label}
              </span>
              <span className="font-bold text-slate-200">{formatTierRange(benchmarkTable, tier.rawBest, tier.rawWorst)}</span>
              <span className="font-black text-slate-100">{tier.scoreMin}-{tier.scoreMax}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const BandsBenchmark = (props: { panel: Extract<BenchmarkPanel, { kind: 'bands' }> }) => (
  <div>
    <ScoringHeader title={props.panel.title} unit={props.panel.unit} />
    {props.panel.note && (
      <p className="mt-2 border-l-2 border-amber-300/40 pl-3 text-[11px] font-semibold leading-relaxed text-amber-100/90">{props.panel.note}</p>
    )}
    <div className={framedListClass}>
      <div className={`${rowClass} grid-cols-2 border-b border-cyan-300/10 bg-white/[0.03] py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500`}>
        <span>Raw result</span>
        <span>Score</span>
      </div>
      <div className="divide-y divide-cyan-300/8">
        {props.panel.bands.map((band) => (
          <div key={`${props.panel.title}-${band.min}-${band.max}`} className={`${rowClass} grid-cols-2`}>
            <span className="font-bold text-slate-200">{band.min === band.max ? band.min : `${band.min}-${band.max}`}</span>
            <span className="font-black text-slate-100">{band.scoreMin}-{band.scoreMax}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const DirectBenchmark = (props: { panel: Extract<BenchmarkPanel, { kind: 'direct' }> }) => (
  <div>
    <ScoringHeader title={props.panel.title} unit={props.panel.unit} />
    {props.panel.note && (
      <p className="mt-2 border-l-2 border-amber-300/40 pl-3 text-[11px] font-semibold leading-relaxed text-amber-100/90">{props.panel.note}</p>
    )}
    <div className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-5">
      {props.panel.values.map((value) => (
        <div key={`${props.panel.title}-${value}`} className="rounded-lg border border-cyan-300/10 bg-white/[0.03] px-2 py-1.5 text-center">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Raw {value}</p>
          <p className="mt-0.5 text-sm font-black text-cyan-100">{props.panel.mapping[value]}</p>
        </div>
      ))}
    </div>
  </div>
);

const FinishingBenchmark = () => (
  <div>
    <ScoringHeader
      title="Finishing Goals + On-Target Score"
      unit="Uses both goals scored and shots on target from the 6-ball finishing drill."
    />
    <div className={framedListClass}>
      <div className={`${rowClass} grid-cols-[1fr_auto_auto] border-b border-cyan-300/10 bg-white/[0.03] py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500`}>
        <span>Result quality</span>
        <span>Base</span>
        <span className="hidden sm:block">Adjustment</span>
      </div>
      <div className="divide-y divide-cyan-300/8">
        {[
          ['6 on target and at least 5 goals', '95-99', 'Goals / on-target ratio'],
          ['5 on target and at least 4 goals', '80-94', 'Goals / on-target ratio'],
          ['4 on target and at least 3 goals', '65-79', 'Goals / on-target ratio'],
          ['3 on target and at least 2 goals', '50-64', 'Goals / on-target ratio'],
          ['2 on target', '35-49', 'Goals / on-target ratio'],
          ['0-1 on target', '10-34', 'Low on-target output']
        ].map(([quality, range, adjustment]) => (
          <div key={quality} className={`${rowClass} grid-cols-[1fr_auto_auto]`}>
            <span className="font-bold text-slate-200">{quality}</span>
            <span className="font-black text-slate-100">{range}</span>
            <span className="hidden font-semibold text-slate-400 sm:block">{adjustment}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function AssessmentDrillGuideView() {
  const [activeSection, setActiveSection] = useState<GuideSection>('drills');
  const [activeCategory, setActiveCategory] = useState<ActiveGuideCategory>('All');
  const [selectedDrillId, setSelectedDrillId] = useState(DRILL_GUIDE_ENTRIES[0]?.id ?? '');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup>('U15');
  const [selectedRole, setSelectedRole] = useState<FprdsRole>('CM');

  const filteredDrills = useMemo(() => (
    DRILL_GUIDE_ENTRIES.filter((entry) => activeCategory === 'All' || entry.category === activeCategory)
  ), [activeCategory]);

  const groupedDrills = useMemo(() => (
    DRILL_GUIDE_CATEGORIES
      .map((category) => ({ category, drills: filteredDrills.filter((entry) => entry.category === category.id) }))
      .filter((group) => group.drills.length > 0)
  ), [filteredDrills]);

  const selectedDrill = useMemo(
    () => DRILL_GUIDE_ENTRIES.find((entry) => entry.id === selectedDrillId) ?? filteredDrills[0] ?? null,
    [filteredDrills, selectedDrillId]
  );

  const handleCategoryChange = (category: ActiveGuideCategory) => {
    setActiveCategory(category);
    const next = DRILL_GUIDE_ENTRIES.filter((entry) => category === 'All' || entry.category === category);
    if (next.length > 0 && !next.some((entry) => entry.id === selectedDrillId)) {
      setSelectedDrillId(next[0].id);
    }
  };

  const selectedBenchmarkPanels = selectedDrill ? drillBenchmarkPanels[selectedDrill.id] ?? [] : [];
  const hasAgeBandedBenchmark = selectedBenchmarkPanels.some((panel) => panel.kind === 'table');
  const activeRoleWeights = (Object.entries(ROLE_WEIGHTS[selectedRole]) as Array<[FprdsAttributeId, number]>)
    .filter(([, weight]) => weight > 0)
    .sort((a, b) => b[1] - a[1]);
  const maxRoleWeight = activeRoleWeights[0]?.[1] ?? 1;
  const primaryWeight = activeRoleWeights[0];
  const topThreeShare = activeRoleWeights.slice(0, 3).reduce((sum, [, weight]) => sum + weight, 0);
  const categoryLabel = selectedDrill
    ? DRILL_GUIDE_CATEGORIES.find((category) => category.id === selectedDrill.category)?.label ?? selectedDrill.category
    : '';

  const categoryPills: Array<{ id: ActiveGuideCategory; label: string }> = [
    { id: 'All', label: 'All' },
    ...DRILL_GUIDE_CATEGORIES
  ];

  const toolbar = (
    <section className="flex flex-col gap-3 rounded-2xl border border-cyan-300/10 bg-[#07111f]/70 p-3 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter drills by category">
        {categoryPills.map((pill) => {
          const isActive = activeCategory === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => handleCategoryChange(pill.id)}
              aria-pressed={isActive}
              className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wide transition-colors ${
                isActive
                  ? 'border-orange-300/40 bg-orange-400 text-slate-950 shadow-sm shadow-orange-950/25'
                  : 'border-cyan-300/12 bg-white/[0.03] text-slate-400 hover:border-orange-300/25 hover:bg-orange-300/10 hover:text-orange-100'
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <BookOpen size={15} className="shrink-0 text-cyan-300" aria-hidden="true" />
        <Select value={selectedDrill?.id ?? ''} onValueChange={setSelectedDrillId}>
          <SelectTrigger aria-label="Select drill" className={`w-full sm:w-80 ${SELECT_TRIGGER_CLASS}`}>
            <SelectValue placeholder="Select a drill" />
          </SelectTrigger>
          <SelectContent className={SELECT_CONTENT_CLASS}>
            {groupedDrills.map((group) => (
              <SelectGroup key={group.category.id}>
                <SelectLabel className={SELECT_LABEL_CLASS}>{group.category.label}</SelectLabel>
                {group.drills.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id} className={SELECT_ITEM_CLASS}>
                    {entry.title}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  );

  return (
    <div className="space-y-5">
      {/* Section switcher + beta compliance note */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedTabs
          value={activeSection}
          options={SECTION_OPTIONS}
          onValueChange={(value) => setActiveSection(value)}
          label="Assessment guide sections"
        />
        <div className="inline-flex items-start gap-2 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2 sm:max-w-md">
          <ShieldAlert size={14} className="mt-0.5 shrink-0 text-amber-200" aria-hidden="true" />
          <p className="text-[11px] font-semibold leading-relaxed text-amber-100/90">
            Beta references support coaching only until practitioner review completes — not official federation ratings.
          </p>
        </div>
      </div>

      {activeSection === 'drills' ? (
        <>
          {toolbar}
          {selectedDrill && (
            <section className={panelClass}>
              <div className="flex flex-col gap-3 border-b border-cyan-300/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className={`flex items-center gap-1.5 ${eyebrowClass} ${CATEGORY_ACCENTS[selectedDrill.category]}`}>
                    {selectedDrill.attributeCode && (
                      <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 tracking-widest">{selectedDrill.attributeCode}</span>
                    )}
                    {categoryLabel}
                  </p>
                  <h3 className="mt-1.5 font-display text-2xl font-black tracking-tight text-white">{selectedDrill.title}</h3>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-cyan-300/15 bg-white/[0.04] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-300">
                  <ClipboardCheck size={11} /> Record consistently
                </span>
              </div>

              {/* Quick facts */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-300/12 bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-bold text-slate-300">
                  <Repeat size={12} className="text-cyan-300" /> {selectedDrill.attempts[0] ?? 'See attempts'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-300/12 bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-bold text-slate-300">
                  <Wrench size={12} className="text-cyan-300" /> {selectedDrill.equipment.length} equipment item{selectedDrill.equipment.length === 1 ? '' : 's'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/18 bg-emerald-300/[0.06] px-2.5 py-1.5 text-[10px] font-bold text-emerald-100">
                  <Target size={12} className="text-emerald-300" /> {selectedDrill.dataToRecord.length} metric{selectedDrill.dataToRecord.length === 1 ? '' : 's'} to record
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-300/12 bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-bold text-slate-300">
                  <Users size={12} className="text-cyan-300" /> {selectedDrill.personnel.length} people / role{selectedDrill.personnel.length === 1 ? '' : 's'} needed
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold ${GK_CHIP_STYLES[selectedDrill.goalkeeper.requirement].chip}`}
                  title={selectedDrill.goalkeeper.note}
                >
                  <Hand size={12} className={GK_CHIP_STYLES[selectedDrill.goalkeeper.requirement].icon} /> {GK_CHIP_STYLES[selectedDrill.goalkeeper.requirement].label}
                </span>
              </div>

              {/* Highlighted priority: illustration (16:9) + procedure with drill audio below it */}
              <div className="mt-4 grid gap-4 md:grid-cols-2 md:items-start">
                <DrillIllustration drill={selectedDrill} />
                <div className="flex flex-col gap-3">
                  <div className="rounded-2xl border border-amber-300/25 bg-amber-300/[0.06] p-4">
                    <p className={`flex items-center gap-1.5 text-amber-100 ${eyebrowClass}`}>
                      <MapPin size={13} className="text-amber-300" /> Where the player starts
                    </p>
                    <p className="mt-2 text-[12px] font-semibold leading-relaxed text-slate-100">{selectedDrill.playerStart}</p>
                  </div>
                  <ProcedureSteps steps={selectedDrill.procedure} />
                  <div className={`rounded-2xl border p-4 ${GK_CHIP_STYLES[selectedDrill.goalkeeper.requirement].chip}`}>
                    <p className={`flex items-center gap-1.5 ${eyebrowClass}`}>
                      <Hand size={13} className={GK_CHIP_STYLES[selectedDrill.goalkeeper.requirement].icon} /> {GK_CHIP_STYLES[selectedDrill.goalkeeper.requirement].label}
                    </p>
                    <p className="mt-2 text-[11.5px] font-semibold leading-relaxed text-slate-200">{selectedDrill.goalkeeper.note}</p>
                  </div>
                  {selectedDrill.audio && <AudioBlock audio={selectedDrill.audio} />}
                </div>
              </div>

              {/* Compact data to record */}
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-300/18 bg-emerald-300/[0.05] px-3 py-2.5">
                <span className={`text-emerald-200/85 ${eyebrowClass}`}>Data to record</span>
                {selectedDrill.dataToRecord.map((item) => (
                  <span key={item} className="inline-flex items-center rounded-md border border-emerald-300/25 bg-emerald-300/10 px-2 py-0.5 text-[11px] font-bold text-emerald-50">
                    {item}
                  </span>
                ))}
              </div>

              {/* Supporting detail flows below in balanced columns */}
              <div className="mt-5 gap-x-7 border-t border-cyan-300/10 pt-5 sm:columns-2 xl:columns-3">
                <InstructionSection label="People needed" items={selectedDrill.personnel} accent="emerald" />
                <InstructionSection label="Equipment" items={selectedDrill.equipment} accent="cyan" />
                <InstructionSection label="Setup" items={selectedDrill.setup} accent="cyan" />
                <InstructionSection label="Attempts" items={selectedDrill.attempts} accent="amber" />
                <InstructionSection label="Common mistakes" items={selectedDrill.commonMistakes ?? []} accent="rose" />
                <InstructionSection label="Safety" items={selectedDrill.safety ?? []} accent="amber" />
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Scoring benchmark */}
            <div className={panelClass}>
              <div className="border-b border-cyan-300/10 pb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className={`flex items-center gap-1.5 text-emerald-200/80 ${eyebrowClass}`}>
                      <SlidersHorizontal size={13} className="text-emerald-300" /> Scoring benchmark
                    </p>
                    <Select value={selectedDrill?.id ?? ''} onValueChange={setSelectedDrillId}>
                      <SelectTrigger aria-label="Select drill for benchmark" className={`mt-1.5 w-full sm:max-w-xs ${SELECT_TRIGGER_CLASS}`}>
                        <SelectValue placeholder="Select a drill" />
                      </SelectTrigger>
                      <SelectContent className={SELECT_CONTENT_CLASS}>
                        {groupedDrills.map((group) => (
                          <SelectGroup key={group.category.id}>
                            <SelectLabel className={SELECT_LABEL_CLASS}>{group.category.label}</SelectLabel>
                            {group.drills.map((entry) => (
                              <SelectItem key={entry.id} value={entry.id} className={SELECT_ITEM_CLASS}>
                                {entry.title}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Select
                    value={selectedAgeGroup}
                    onValueChange={(value) => setSelectedAgeGroup(value as AgeGroup)}
                    disabled={!hasAgeBandedBenchmark}
                  >
                    <SelectTrigger aria-label="Select benchmark age group" className={`w-full shrink-0 sm:w-28 ${SELECT_TRIGGER_CLASS}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={SELECT_CONTENT_CLASS}>
                      {ageGroups.map((ageGroup) => (
                        <SelectItem key={ageGroup} value={ageGroup} className={SELECT_ITEM_CLASS}>{ageGroup}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <ScoreScale />
              </div>

              {hasAgeBandedBenchmark && (
                <p className="mt-3 text-[11px] font-semibold text-slate-400">
                  Age group applies only to age-banded tables. Other scoring maps are fixed.
                </p>
              )}

              <div className="mt-4 space-y-5">
                {selectedBenchmarkPanels.map((panel, index) => {
                  const key = `${selectedDrill?.id}-${panel.kind}-${index}`;
                  if (panel.kind === 'table') return <TableBenchmark key={key} panel={panel} ageGroup={selectedAgeGroup} />;
                  if (panel.kind === 'bands') return <BandsBenchmark key={key} panel={panel} />;
                  if (panel.kind === 'direct') return <DirectBenchmark key={key} panel={panel} />;
                  return <FinishingBenchmark key={key} />;
                })}
                {selectedBenchmarkPanels.length === 0 && (
                  <div className="border-l-2 border-cyan-300/30 pl-3 text-sm font-semibold text-slate-400">
                    Select a drill to view its scoring benchmark.
                  </div>
                )}
              </div>
            </div>

            {/* Role weights */}
            <div className={panelClass}>
              <div className="flex flex-col gap-3 border-b border-cyan-300/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className={`flex items-center gap-1.5 text-orange-200/80 ${eyebrowClass}`}>
                    <Gauge size={13} className="text-orange-300" /> Role weights
                  </p>
                  <h3 className="mt-1 font-display text-lg font-black text-white">{ROLE_LABELS[selectedRole]}</h3>
                </div>
                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as FprdsRole)}>
                  <SelectTrigger aria-label="Select FPRDS role" className={`w-full sm:w-56 ${SELECT_TRIGGER_CLASS}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={SELECT_CONTENT_CLASS}>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role} className={SELECT_ITEM_CLASS}>{role} - {ROLE_LABELS[role]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {primaryWeight && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-cyan-300/10 bg-white/[0.02] px-2.5 py-2">
                    <p className={`text-slate-500 ${eyebrowClass}`}>Primary focus</p>
                    <p className="mt-1 truncate text-[12px] font-black text-orange-100" title={attributeLabels[primaryWeight[0]]}>{attributeLabels[primaryWeight[0]]}</p>
                    <p className="text-[10px] font-bold text-slate-500">{Math.round(primaryWeight[1] * 100)}% weight</p>
                  </div>
                  <div className="rounded-lg border border-cyan-300/10 bg-white/[0.02] px-2.5 py-2">
                    <p className={`text-slate-500 ${eyebrowClass}`}>Top 3 share</p>
                    <p className="mt-1 text-sm font-black text-orange-100">{Math.round(topThreeShare * 100)}%</p>
                    <p className="text-[10px] font-bold text-slate-500">of the rating</p>
                  </div>
                  <div className="rounded-lg border border-cyan-300/10 bg-white/[0.02] px-2.5 py-2">
                    <p className={`text-slate-500 ${eyebrowClass}`}>Attributes</p>
                    <p className="mt-1 text-sm font-black text-slate-100">{activeRoleWeights.length}</p>
                    <p className="text-[10px] font-bold text-slate-500">weighted</p>
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-2.5">
                {activeRoleWeights.map(([attributeId, weight]) => (
                  <div key={`${selectedRole}-${attributeId}`}>
                    <div className="flex items-center justify-between gap-3 text-[11.5px]">
                      <span className="truncate font-bold text-slate-200">{attributeLabels[attributeId]}</span>
                      <span className="shrink-0 font-black text-orange-200">{Math.round(weight * 100)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-400/80 to-amber-300/80"
                        style={{ width: `${Math.max(8, Math.round((weight / maxRoleWeight) * 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-l-2 border-amber-300/40 pl-3">
                <p className={`text-amber-200/80 ${eyebrowClass}`}>Quick assessment fields</p>
                <p className="mt-1 text-[11.5px] font-semibold leading-relaxed text-amber-100/90">
                  {QUICK_ROLE_POSITION_ATTRIBUTES[selectedRole].map((attributeId) => attributeLabels[attributeId]).join(', ')}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
