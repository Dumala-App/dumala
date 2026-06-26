import React from 'react';
import type { CoachingLibraryItem } from '../knowledge/coachingLibrary';

type Point = {
  x: number;
  y: number;
  label?: string;
  tone?: 'team' | 'support' | 'opponent' | 'highlight';
};

type Arrow = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  tone?: 'team' | 'support' | 'danger';
};

const toneFill = {
  team: '#38bdf8',
  support: '#34d399',
  opponent: '#64748b',
  highlight: '#f59e0b'
} as const;

const arrowStroke = {
  team: '#38bdf8',
  support: '#34d399',
  danger: '#fb7185'
} as const;

const rowsToPoints = (rows: number[], labels: string[][]): Point[] => {
  const rowCount = rows.length;
  const top = rowCount >= 4 ? 22 : 34;
  const bottom = 78;
  const yRows = rows.map((_, index) => (
    rowCount === 1 ? 50 : bottom - ((bottom - top) / (rowCount - 1)) * index
  ));
  return rows.flatMap((count, rowIndex) => {
    const gap = 78 / Math.max(count - 1, 1);
    const start = count === 1 ? 50 : 11;
    return Array.from({ length: count }, (_, index) => ({
      x: count === 1 ? 50 : start + gap * index,
      y: yRows[rowIndex],
      label: labels[rowIndex]?.[index],
      tone: rowIndex === 0 ? 'team' : rowIndex === 1 ? 'support' : 'highlight'
    }));
  });
};

const PitchSvg = ({
  title,
  points,
  arrows = [],
  children
}: {
  title: string;
  points: readonly Point[];
  arrows?: readonly Arrow[];
  children?: React.ReactNode;
}) => {
  const markerId = `arrow-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={title} className="h-full w-full">
      <defs>
        <marker id={markerId} markerWidth="4" markerHeight="4" refX="3.5" refY="2" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L4,2 L0,4 Z" fill="currentColor" />
        </marker>
      </defs>
      <rect x="3" y="3" width="94" height="94" rx="4" fill="#082f1f" stroke="#1f6f4a" strokeWidth="1.2" />
      <line x1="3" y1="50" x2="97" y2="50" stroke="#1f6f4a" strokeWidth="0.8" />
      <circle cx="50" cy="50" r="10" fill="none" stroke="#1f6f4a" strokeWidth="0.8" />
      <rect x="32" y="3" width="36" height="13" fill="none" stroke="#1f6f4a" strokeWidth="0.8" />
      <rect x="32" y="84" width="36" height="13" fill="none" stroke="#1f6f4a" strokeWidth="0.8" />
      {children}
      {arrows.map((arrow, index) => (
        <line
          key={`${arrow.x1}-${arrow.y1}-${index}`}
          x1={arrow.x1}
          y1={arrow.y1}
          x2={arrow.x2}
          y2={arrow.y2}
          stroke={arrowStroke[arrow.tone ?? 'support']}
          strokeWidth="1.05"
          strokeLinecap="round"
          markerEnd={`url(#${markerId})`}
        />
      ))}
      {points.map((point, index) => (
        <g key={`${point.label ?? 'p'}-${index}`}>
          <circle cx={point.x} cy={point.y} r="3.3" fill={toneFill[point.tone ?? 'team']} stroke="#e2e8f0" strokeWidth="0.7" />
          {point.label && (
            <text x={point.x} y={point.y + 7.8} textAnchor="middle" fill="#cbd5e1" fontSize="4" fontWeight="700">
              {point.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
};

const MiniPanel = ({
  title,
  points,
  arrows = []
}: {
  title: string;
  points: readonly Point[];
  arrows?: readonly Arrow[];
}) => (
  <div className="min-h-28">
    <PitchSvg title={title} points={points} arrows={arrows} />
    <p className="mt-1 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">{title}</p>
  </div>
);

const DiagramFrame = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <figure className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
    <div className="aspect-[16/9] overflow-hidden rounded-lg bg-slate-950" aria-label={title}>
      {children}
    </div>
  </figure>
);

const FormationDiagram = ({
  title,
  rows,
  labels,
  arrows = []
}: {
  title: string;
  rows: number[];
  labels: string[][];
  arrows?: Arrow[];
}) => (
  <PitchSvg title={title} points={rowsToPoints(rows, labels)} arrows={arrows} />
);

type FormationDiagramDefinition = {
  title: string;
  rows: number[];
  labels: string[][];
  arrows?: Arrow[];
};

const FORMATION_DIAGRAMS: Record<string, FormationDiagramDefinition> = {
  'formation-4-3-3': {
    title: '4-3-3 with wide forwards and fullback overlaps',
    rows: [4, 3, 3],
    labels: [['LB', 'CB', 'CB', 'RB'], ['8', '6', '8'], ['LW', '9', 'RW']],
    arrows: [
      { x1: 11, y1: 78, x2: 11, y2: 30 },
      { x1: 89, y1: 78, x2: 89, y2: 30 }
    ]
  },
  'formation-4-2-3-1': {
    title: '4-2-3-1 with double pivot and number 10 pocket',
    rows: [4, 2, 3, 1],
    labels: [['LB', 'CB', 'CB', 'RB'], ['6', '6'], ['LW', '10', 'RW'], ['9']],
    arrows: [
      { x1: 36, y1: 59, x2: 50, y2: 41 },
      { x1: 64, y1: 59, x2: 50, y2: 41 },
      { x1: 11, y1: 78, x2: 11, y2: 41 },
      { x1: 89, y1: 78, x2: 89, y2: 41 }
    ]
  },
  'formation-3-5-2': {
    title: '3-5-2 wingbacks, central overload, and two strikers',
    rows: [3, 5, 2],
    labels: [['LCB', 'CB', 'RCB'], ['WB', '8', '6', '8', 'WB'], ['9', '9']],
    arrows: [
      { x1: 11, y1: 56, x2: 11, y2: 28 },
      { x1: 89, y1: 56, x2: 89, y2: 28 }
    ]
  },
  'formation-4-4-2': {
    title: '4-4-2 compact block with crossing channels',
    rows: [4, 4, 2],
    labels: [['LB', 'CB', 'CB', 'RB'], ['LM', 'CM', 'CM', 'RM'], ['9', '9']],
    arrows: [
      { x1: 11, y1: 56, x2: 11, y2: 30 },
      { x1: 89, y1: 56, x2: 89, y2: 30 }
    ]
  },
  'formation-3-4-3': {
    title: '3-4-3 with front-three press and wingback width',
    rows: [3, 4, 3],
    labels: [['LCB', 'CB', 'RCB'], ['WB', 'CM', 'CM', 'WB'], ['LW', '9', 'RW']],
    arrows: [
      { x1: 11, y1: 56, x2: 11, y2: 28 },
      { x1: 89, y1: 56, x2: 89, y2: 28 }
    ]
  },
  'formation-4-1-4-1': {
    title: '4-1-4-1 with holding midfielder and two compact lines',
    rows: [4, 1, 4, 1],
    labels: [['LB', 'CB', 'CB', 'RB'], ['6'], ['LM', '8', '8', 'RM'], ['9']],
    arrows: [
      { x1: 50, y1: 59, x2: 50, y2: 41 },
      { x1: 11, y1: 78, x2: 11, y2: 41 },
      { x1: 89, y1: 78, x2: 89, y2: 41 }
    ]
  },
  'formation-5-3-2': {
    title: '5-3-2 with wingback cover and two-striker counter threat',
    rows: [5, 3, 2],
    labels: [['LWB', 'CB', 'CB', 'CB', 'RWB'], ['8', '6', '8'], ['9', '9']],
    arrows: [
      { x1: 11, y1: 78, x2: 11, y2: 54 },
      { x1: 89, y1: 78, x2: 89, y2: 54 }
    ]
  },
  'formation-4-3-1-2': {
    title: '4-3-1-2 diamond with central playmaker',
    rows: [4, 3, 1, 2],
    labels: [['LB', 'CB', 'CB', 'RB'], ['8', '6', '8'], ['10'], ['9', '9']],
    arrows: [
      { x1: 50, y1: 41, x2: 36, y2: 22 },
      { x1: 50, y1: 41, x2: 64, y2: 22 }
    ]
  },
  'formation-4-4-1-1': {
    title: '4-4-1-1 with second striker between the lines',
    rows: [4, 4, 1, 1],
    labels: [['LB', 'CB', 'CB', 'RB'], ['LM', 'CM', 'CM', 'RM'], ['SS'], ['9']],
    arrows: [
      { x1: 50, y1: 41, x2: 50, y2: 22 },
      { x1: 11, y1: 59, x2: 11, y2: 41 },
      { x1: 89, y1: 59, x2: 89, y2: 41 }
    ]
  }
};

const AttackTypesDiagram = () => (
  <div className="grid h-full grid-cols-2 gap-2 p-2">
    <MiniPanel
      title="Possession"
      points={[
        { x: 30, y: 62, label: 'CB', tone: 'team' },
        { x: 50, y: 50, label: '6', tone: 'support' },
        { x: 68, y: 38, label: '8', tone: 'support' },
        { x: 48, y: 25, label: '10', tone: 'highlight' }
      ]}
      arrows={[
        { x1: 30, y1: 62, x2: 50, y2: 50 },
        { x1: 50, y1: 50, x2: 68, y2: 38 },
        { x1: 68, y1: 38, x2: 48, y2: 25 }
      ]}
    />
    <MiniPanel
      title="Quick Counter"
      points={[
        { x: 36, y: 68, label: 'WIN', tone: 'team' },
        { x: 54, y: 45, label: 'RUN', tone: 'highlight' },
        { x: 70, y: 25, label: '9', tone: 'highlight' }
      ]}
      arrows={[
        { x1: 36, y1: 68, x2: 54, y2: 45 },
        { x1: 54, y1: 45, x2: 70, y2: 25 }
      ]}
    />
    <MiniPanel
      title="Wide Overload"
      points={[
        { x: 78, y: 65, label: 'RB', tone: 'team' },
        { x: 82, y: 48, label: '8', tone: 'support' },
        { x: 86, y: 29, label: 'RW', tone: 'highlight' }
      ]}
      arrows={[
        { x1: 78, y1: 65, x2: 82, y2: 48 },
        { x1: 82, y1: 48, x2: 86, y2: 29 }
      ]}
    />
    <MiniPanel
      title="Direct Play"
      points={[
        { x: 30, y: 72, label: 'CB', tone: 'team' },
        { x: 55, y: 28, label: '9', tone: 'highlight' },
        { x: 66, y: 34, label: '2nd', tone: 'support' }
      ]}
      arrows={[{ x1: 30, y1: 72, x2: 55, y2: 28 }]}
    />
  </div>
);

const DefenseTypesDiagram = () => (
  <svg viewBox="0 0 100 56" role="img" aria-label="Defensive block comparison" className="h-full w-full">
    <rect x="3" y="5" width="20" height="46" rx="2" fill="#082f1f" stroke="#1f6f4a" />
    <rect x="28" y="5" width="20" height="46" rx="2" fill="#082f1f" stroke="#1f6f4a" />
    <rect x="53" y="5" width="20" height="46" rx="2" fill="#082f1f" stroke="#1f6f4a" />
    <rect x="78" y="5" width="19" height="46" rx="2" fill="#082f1f" stroke="#1f6f4a" />
    {[
      { x: 13, y: 14, label: 'HIGH', lines: [16, 23, 31] },
      { x: 38, y: 24, label: 'HALF', lines: [26, 32, 38] },
      { x: 63, y: 20, label: 'MAN', lines: [18, 30, 42] },
      { x: 88, y: 37, label: 'LOW', lines: [32, 38, 44] }
    ].map(panel => (
      <g key={panel.label}>
        {panel.lines.map((y, index) => (
          <line key={y} x1={panel.x - 6} y1={y} x2={panel.x + 6} y2={y} stroke={index === 0 ? '#f59e0b' : '#38bdf8'} strokeWidth="1.35" strokeLinecap="round" />
        ))}
        <text x={panel.x} y="50" textAnchor="middle" fill="#cbd5e1" fontSize="4" fontWeight="800">{panel.label}</text>
      </g>
    ))}
  </svg>
);

const PrinciplesDiagram = () => (
  <svg viewBox="0 0 100 56" role="img" aria-label="Tactical principles whiteboard" className="h-full w-full">
    <rect x="4" y="5" width="92" height="46" rx="4" fill="#07111f" stroke="#334155" />
    <line x1="20" y1="16" x2="80" y2="16" stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" />
    <text x="50" y="11" textAnchor="middle" fill="#34d399" fontSize="4" fontWeight="800">WIDTH</text>
    <circle cx="30" cy="31" r="4" fill="#38bdf8" />
    <circle cx="50" cy="31" r="4" fill="#f59e0b" />
    <circle cx="70" cy="31" r="4" fill="#38bdf8" />
    <path d="M30 31 Q48 20 70 31" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2" />
    <text x="50" y="43" textAnchor="middle" fill="#cbd5e1" fontSize="4" fontWeight="800">THIRD-MAN RUN</text>
    <rect x="10" y="35" width="17" height="8" rx="2" fill="none" stroke="#fb7185" strokeWidth="0.9" />
    <text x="18.5" y="48" textAnchor="middle" fill="#fb7185" fontSize="3.5" fontWeight="800">REST DEFENSE</text>
  </svg>
);

const CaseStudyDiagram = ({ item }: { item: CoachingLibraryItem }) => {
  switch (item.visual.diagramId) {
    case 'spain-barcelona-positional-play':
      return (
        <PitchSvg
          title="Positional play rondo map"
          points={[
            { x: 35, y: 52, label: '6', tone: 'team' },
            { x: 50, y: 40, label: '8', tone: 'support' },
            { x: 65, y: 52, label: '10', tone: 'support' },
            { x: 50, y: 28, label: 'F9', tone: 'highlight' }
          ]}
          arrows={[
            { x1: 35, y1: 52, x2: 50, y2: 40 },
            { x1: 50, y1: 40, x2: 65, y2: 52 },
            { x1: 65, y1: 52, x2: 50, y2: 28 },
            { x1: 50, y1: 28, x2: 35, y2: 52 }
          ]}
        />
      );
    case 'germany-2014-transition-pressure':
      return (
        <PitchSvg
          title="Counter-press and vertical release"
          points={[
            { x: 40, y: 55, label: '1', tone: 'team' },
            { x: 52, y: 48, label: '2', tone: 'team' },
            { x: 45, y: 38, label: '3', tone: 'team' },
            { x: 68, y: 22, label: 'RUN', tone: 'highlight' }
          ]}
          arrows={[
            { x1: 40, y1: 55, x2: 52, y2: 48, tone: 'danger' },
            { x1: 45, y1: 38, x2: 52, y2: 48, tone: 'danger' },
            { x1: 52, y1: 48, x2: 68, y2: 22 }
          ]}
        />
      );
    case 'italy-classic-defensive-block':
      return (
        <PitchSvg
          title="Compact block and touchline trap"
          points={rowsToPoints([4, 4, 1], [['LB', 'CB', 'CB', 'RB'], ['LM', 'CM', 'CM', 'RM'], ['9']])}
          arrows={[
            { x1: 84, y1: 42, x2: 92, y2: 42, tone: 'danger' },
            { x1: 84, y1: 58, x2: 92, y2: 58, tone: 'danger' }
          ]}
        >
          <rect x="78" y="33" width="16" height="34" fill="none" stroke="#fb7185" strokeDasharray="3 2" strokeWidth="0.9" />
        </PitchSvg>
      );
    case 'liverpool-gegenpressing-era':
      return (
        <PitchSvg
          title="Front three press and high fullbacks"
          points={[
            { x: 25, y: 23, label: 'LW', tone: 'highlight' },
            { x: 50, y: 18, label: '9', tone: 'highlight' },
            { x: 75, y: 23, label: 'RW', tone: 'highlight' },
            { x: 15, y: 42, label: 'LB', tone: 'support' },
            { x: 85, y: 42, label: 'RB', tone: 'support' }
          ]}
          arrows={[
            { x1: 25, y1: 23, x2: 38, y2: 34, tone: 'danger' },
            { x1: 50, y1: 18, x2: 50, y2: 31, tone: 'danger' },
            { x1: 75, y1: 23, x2: 62, y2: 34, tone: 'danger' },
            { x1: 15, y1: 42, x2: 22, y2: 28 },
            { x1: 85, y1: 42, x2: 78, y2: 28 }
          ]}
        />
      );
    default:
      return <FallbackDiagram item={item} />;
  }
};

const FallbackDiagram = ({ item }: { item: CoachingLibraryItem }) => (
  <PitchSvg
    title={`${item.title} concept map`}
    points={[
      { x: 32, y: 64, label: 'A', tone: 'team' },
      { x: 50, y: 48, label: 'B', tone: 'support' },
      { x: 68, y: 32, label: 'C', tone: 'highlight' }
    ]}
    arrows={[
      { x1: 32, y1: 64, x2: 50, y2: 48 },
      { x1: 50, y1: 48, x2: 68, y2: 32 }
    ]}
  />
);

export const CoachingLibraryDiagram = ({ item }: { item: CoachingLibraryItem }) => {
  const diagram = (() => {
    const formationDiagram = FORMATION_DIAGRAMS[item.visual.diagramId];
    if (formationDiagram) {
      return (
        <FormationDiagram
          title={formationDiagram.title}
          rows={formationDiagram.rows}
          labels={formationDiagram.labels}
          arrows={formationDiagram.arrows}
        />
      );
    }

    switch (item.visual.diagramId) {
      case 'attack-types':
        return <AttackTypesDiagram />;
      case 'defense-types':
        return <DefenseTypesDiagram />;
      case 'tactical-principles':
        return <PrinciplesDiagram />;
      case 'spain-barcelona-positional-play':
      case 'germany-2014-transition-pressure':
      case 'italy-classic-defensive-block':
      case 'liverpool-gegenpressing-era':
        return <CaseStudyDiagram item={item} />;
      default:
        return <FallbackDiagram item={item} />;
    }
  })();

  return <DiagramFrame title={item.visual.brief}>{diagram}</DiagramFrame>;
};
