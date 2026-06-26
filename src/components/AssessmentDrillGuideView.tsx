import React, { useMemo, useState } from 'react';
import { BookOpen, ClipboardCheck, FlaskConical, SlidersHorizontal } from 'lucide-react';
import { DRILL_GUIDE_CATEGORIES, DRILL_GUIDE_ENTRIES, type DrillGuideEntry } from '../fprds/drillGuide';
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
  YOYO_DISTANCE,
  type AgeGroup,
  type BenchmarkTable
} from '../fprds/benchmarks';
import { QUICK_ROLE_POSITION_ATTRIBUTES, ROLE_LABELS, ROLE_WEIGHTS } from '../fprds/weights';
import type { FprdsAttributeId, FprdsRole } from '../types';

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

const SectionCard = (props: { title: string; items: string[] }) => {
  if (props.items.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{props.title}</p>
      <ul className="mt-3 list-disc space-y-1.5 pl-5">
        {props.items.map((item) => (
          <li key={item} className="text-xs font-semibold leading-relaxed text-slate-600">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

const TableBenchmark = (props: { panel: Extract<BenchmarkPanel, { kind: 'table' }>; ageGroup: AgeGroup }) => {
  const benchmarkTable = getBenchmarkForAge(props.panel, props.ageGroup);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h4 className="font-display text-base font-black text-slate-950">{props.panel.title}</h4>
          <p className="text-[11px] font-semibold text-slate-500">{props.panel.unit}</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
          {benchmarkTable.direction === 'lower_is_better' ? 'Lower is better' : 'Higher is better'}
        </span>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-xs">
          <thead>
            <tr className="border-y border-slate-100 bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400">
              <th className="px-3 py-2 font-black">Tier</th>
              <th className="px-3 py-2 font-black">Raw result</th>
              <th className="px-3 py-2 font-black">Score range</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {benchmarkTable.tiers.map((tier) => (
              <tr key={`${props.panel.title}-${props.ageGroup}-${tier.label}`} className="text-slate-700">
                <td className="px-3 py-3 font-black text-slate-900">{tier.label}</td>
                <td className="px-3 py-3 font-semibold">{formatTierRange(benchmarkTable, tier.rawBest, tier.rawWorst)}</td>
                <td className="px-3 py-3 font-semibold">{tier.scoreMin}-{tier.scoreMax}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const BandsBenchmark = (props: { panel: Extract<BenchmarkPanel, { kind: 'bands' }> }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4">
    <h4 className="font-display text-base font-black text-slate-950">{props.panel.title}</h4>
    <p className="mt-1 text-[11px] font-semibold text-slate-500">{props.panel.unit}</p>
    {props.panel.note && <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-900">{props.panel.note}</p>}
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-xs">
        <thead>
          <tr className="border-y border-slate-100 bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400">
            <th className="px-3 py-2 font-black">Raw result</th>
            <th className="px-3 py-2 font-black">Score range</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {props.panel.bands.map((band) => (
            <tr key={`${props.panel.title}-${band.min}-${band.max}`} className="text-slate-700">
              <td className="px-3 py-3 font-semibold">{band.min === band.max ? band.min : `${band.min}-${band.max}`}</td>
              <td className="px-3 py-3 font-semibold">{band.scoreMin}-{band.scoreMax}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const DirectBenchmark = (props: { panel: Extract<BenchmarkPanel, { kind: 'direct' }> }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4">
    <h4 className="font-display text-base font-black text-slate-950">{props.panel.title}</h4>
    <p className="mt-1 text-[11px] font-semibold text-slate-500">{props.panel.unit}</p>
    {props.panel.note && <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-900">{props.panel.note}</p>}
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
      {props.panel.values.map((value) => (
        <div key={`${props.panel.title}-${value}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Raw {value}</p>
          <p className="mt-1 text-sm font-black text-slate-900">{props.panel.mapping[value]}</p>
        </div>
      ))}
    </div>
  </div>
);

const FinishingBenchmark = (props: { panel: Extract<BenchmarkPanel, { kind: 'finishing' }> }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4">
    <h4 className="font-display text-base font-black text-slate-950">{props.panel.title}</h4>
    <p className="mt-1 text-[11px] font-semibold text-slate-500">
      Uses both goals scored and shots on target from the 6-ball finishing drill.
    </p>
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-xs">
        <thead>
          <tr className="border-y border-slate-100 bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400">
            <th className="px-3 py-2 font-black">Result quality</th>
            <th className="px-3 py-2 font-black">Base score range</th>
            <th className="px-3 py-2 font-black">Final adjustment</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {[
            ['6 on target and at least 5 goals', '95-99', 'Adjusted by goals / on-target ratio'],
            ['5 on target and at least 4 goals', '80-94', 'Adjusted by goals / on-target ratio'],
            ['4 on target and at least 3 goals', '65-79', 'Adjusted by goals / on-target ratio'],
            ['3 on target and at least 2 goals', '50-64', 'Adjusted by goals / on-target ratio'],
            ['2 on target', '35-49', 'Adjusted by goals / on-target ratio'],
            ['0-1 on target', '10-34', 'Low or no on-target finishing output']
          ].map(([quality, range, adjustment]) => (
            <tr key={quality} className="text-slate-700">
              <td className="px-3 py-3 font-semibold">{quality}</td>
              <td className="px-3 py-3 font-semibold">{range}</td>
              <td className="px-3 py-3 font-semibold">{adjustment}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default function AssessmentDrillGuideView() {
  const [activeCategory, setActiveCategory] = useState<ActiveGuideCategory>('All');
  const [selectedDrillId, setSelectedDrillId] = useState(DRILL_GUIDE_ENTRIES[0]?.id ?? '');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup>('U15');
  const [selectedRole, setSelectedRole] = useState<FprdsRole>('CM');

  const filteredDrills = useMemo(() => {
    return DRILL_GUIDE_ENTRIES.filter((entry) => {
      if (activeCategory !== 'All' && entry.category !== activeCategory) return false;
      return true;
    });
  }, [activeCategory]);

  const selectedDrill = useMemo(
    () => DRILL_GUIDE_ENTRIES.find((entry) => entry.id === selectedDrillId) ?? filteredDrills[0] ?? null,
    [filteredDrills, selectedDrillId]
  );

  const selectedBenchmarkPanels = selectedDrill ? drillBenchmarkPanels[selectedDrill.id] ?? [] : [];
  const hasAgeBandedBenchmark = selectedBenchmarkPanels.some((panel) => panel.kind === 'table');
  const activeRoleWeights = Object.entries(ROLE_WEIGHTS[selectedRole])
    .filter(([, weight]) => weight > 0)
    .sort((a, b) => b[1] - a[1]) as Array<[FprdsAttributeId, number]>;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-700">
              <FlaskConical size={13} /> Private beta guide
            </p>
            <h2 className="mt-3 font-display text-2xl font-black tracking-tight text-slate-950">
              Assessment Drill Guide
            </h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">
              Use this tab to run FPRDS drills consistently during private beta testing. It combines field setup,
              scoring data to record, benchmark bands, role weights, and reviewer prompts from the benchmark review package.
            </p>
          </div>
          <div className="rounded-2xl border border-white bg-white/80 p-4 text-xs font-semibold leading-relaxed text-slate-600 lg:max-w-sm">
            <p className="font-black uppercase tracking-wider text-slate-900">Beta reminder</p>
            <p className="mt-1">
              FPRDS benchmarks are coach-supporting beta references until qualified practitioner review is completed.
              Do not present them as official federation ratings.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(300px,0.45fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-600" />
              <h3 className="font-display text-sm font-black uppercase tracking-wider text-slate-900">Drill instructions</h3>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
              {filteredDrills.length} drills
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setActiveCategory('All')}
              className={`rounded-md px-2 py-1 text-[8px] font-black uppercase tracking-wide leading-none transition-colors ${
                activeCategory === 'All' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-800'
              }`}
            >
              All
            </button>
            {DRILL_GUIDE_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`rounded-md px-2 py-1 text-[8px] font-black uppercase tracking-wide leading-none transition-colors ${
                  activeCategory === category.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-800'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="mt-4 max-h-[560px] space-y-3 overflow-y-auto pr-1">
            {filteredDrills.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedDrillId(entry.id)}
                className={`group w-full overflow-hidden rounded-2xl border text-left transition-all ${
                  selectedDrill?.id === entry.id
                    ? 'border-indigo-300 bg-white shadow-md shadow-indigo-100/70 ring-1 ring-indigo-100'
                    : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm'
                }`}
              >
                <div className={`h-1 w-full ${selectedDrill?.id === entry.id ? 'bg-indigo-600' : 'bg-slate-100 group-hover:bg-indigo-200'}`} />
                <div className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-black leading-snug text-slate-900">{entry.title}</p>
                    {entry.attributeCode && (
                      <span className={`shrink-0 rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                        selectedDrill?.id === entry.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-700'
                      }`}>
                        {entry.attributeCode}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
                      {DRILL_GUIDE_CATEGORIES.find(category => category.id === entry.category)?.label ?? entry.category}
                    </span>
                    <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
                      {entry.dataToRecord.length} records
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[11px] font-semibold leading-relaxed text-slate-500">
                    {entry.dataToRecord.join(' | ')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          {selectedDrill && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                    {selectedDrill.attributeCode ? `${selectedDrill.attributeCode} | ` : ''}
                    {selectedDrill.category}
                  </p>
                  <h3 className="mt-1 font-display text-xl font-black text-slate-950">{selectedDrill.title}</h3>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Record consistently
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                <SectionCard title="Equipment" items={selectedDrill.equipment} />
                <SectionCard title="Setup" items={selectedDrill.setup} />
                <SectionCard title="Procedure" items={selectedDrill.procedure} />
                <SectionCard title="Attempts" items={selectedDrill.attempts} />
                <SectionCard title="Data to record" items={selectedDrill.dataToRecord} />
                <SectionCard title="Common mistakes" items={selectedDrill.commonMistakes ?? []} />
                <SectionCard title="Safety" items={selectedDrill.safety ?? []} />
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <SlidersHorizontal size={14} className="text-indigo-600" /> Benchmark bands
                </p>
                <h3 className="mt-1 font-display text-lg font-black text-slate-950">
                  {selectedDrill ? selectedDrill.title : 'Select a drill'}
                </h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Benchmarks update automatically from the selected drill. Adjust the age group only when the drill uses age-banded tables.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <select
                  value={selectedAgeGroup}
                  onChange={(event) => setSelectedAgeGroup(event.target.value as AgeGroup)}
                  aria-label="Select benchmark age group"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  disabled={!hasAgeBandedBenchmark}
                >
                  {ageGroups.map((ageGroup) => (
                    <option key={ageGroup} value={ageGroup}>{ageGroup}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {selectedBenchmarkPanels.map((panel) => {
                if (panel.kind === 'table') return <TableBenchmark key={`${selectedDrill?.id}-${panel.title}`} panel={panel} ageGroup={selectedAgeGroup} />;
                if (panel.kind === 'bands') return <BandsBenchmark key={`${selectedDrill?.id}-${panel.title}`} panel={panel} />;
                if (panel.kind === 'direct') return <DirectBenchmark key={`${selectedDrill?.id}-${panel.title}`} panel={panel} />;
                return <FinishingBenchmark key={`${selectedDrill?.id}-${panel.title}`} panel={panel} />;
              })}
              {selectedBenchmarkPanels.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                  Select a drill to view its scoring benchmark.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <ClipboardCheck size={14} className="text-indigo-600" /> Role weights
                  </p>
                  <h3 className="mt-1 font-display text-lg font-black text-slate-950">{ROLE_LABELS[selectedRole]}</h3>
                </div>
                <select
                  value={selectedRole}
                  onChange={(event) => setSelectedRole(event.target.value as FprdsRole)}
                  aria-label="Select FPRDS role"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>{role} - {ROLE_LABELS[role]}</option>
                  ))}
                </select>
              </div>

              <div className="mt-4 space-y-2">
                {activeRoleWeights.map(([attributeId, weight]) => (
                  <div key={`${selectedRole}-${attributeId}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-black text-slate-800">{attributeLabels[attributeId]}</span>
                      <span className="font-black text-indigo-700">{Math.round(weight * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-800">Quick assessment fields</p>
                <p className="mt-1 text-xs font-semibold text-amber-900">
                  {QUICK_ROLE_POSITION_ATTRIBUTES[selectedRole].map((attributeId) => attributeLabels[attributeId]).join(', ')}
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
