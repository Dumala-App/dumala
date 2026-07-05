import React, { useState, useEffect, useMemo } from 'react';
import { z } from 'zod';
import { Player, Game, AssessmentSession } from '../types';
import { selectLatestAssessmentForPlayer } from '../fprds/assessmentService';
import { trainingSessionMetaMapSchema, weeklyScheduleSchema } from '../persistence/schemas';
import { readJsonStorage, readStringStorage, STORAGE_KEYS, writeJsonStorage, writeStringStorage } from '../persistence/storage';
import {
  DAYS_OF_WEEK,
  SESSION_BLOCKS,
  SESSION_LOAD_THRESHOLDS,
  buildTrainingSessionSummary,
  getSessionEquipment,
  getWeekDaysMap,
  getOrderedSessionDrills,
  getScheduledDrillBlock,
  getSessionDuration,
  getSessionLoadPoints,
  synchronizeTrainingCalendar,
  type DayName,
  type ScheduledDrill,
  type TrainingSessionMeta,
  type TrainingSessionMetaMap,
  type WeeklySchedule
} from '../training/synchronization';
import {
  DRILL_INSTRUCTIONS,
  TRAINING_DRILLS,
  getDrillEquipment,
  inferDrillSessionBlock,
  type TrainingDrill
} from '../training/drillLibrary';
import { formatTrainingFocusList, getAssessmentConfidence, summarizeDevelopmentEvidence } from '../training/developmentEvidence';
import { getDrillIcon } from './TrainingDrillCard';
import TrainingSessionBuilder from './TrainingSessionBuilder';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from '@/src/components/ui/select';
import { 
  Dumbbell, Sparkles, RotateCcw, TrendingUp, Filter,
  User, CheckCircle, CalendarPlus, HeartPulse, ShieldCheck, Target, Footprints,
  Shield, Timer, Gauge, ArrowUpRight, Crosshair, Waves, Goal, Hand, Route,
  ChevronLeft, ChevronRight, Trophy, X
} from 'lucide-react';

interface TrainingViewProps {
  players: Player[];
  assessments: AssessmentSession[];
  games: Game[];
  onUpdateGames: (games: Game[]) => void;
  initialBuilderDay?: DayName | null;
  onInitialBuilderDayHandled?: () => void;
}

type WeeklyTemplateMode =
  | 'heavy'
  | 'taper'
  | 'tactical'
  | 'prematch'
  | 'recovery'
  | 'forward-focus'
  | 'midfield-focus'
  | 'defender-focus'
  | 'last-week';

type TrainingScheduleMode =
  | 'mwf'
  | 'tths'
  | 'weekend'
  | 'mw'
  | 'tth'
  | 'weekdays'
  | 'custom';

const WEEKLY_TEMPLATE_OPTIONS: Array<{ mode: WeeklyTemplateMode; label: string }> = [
  { mode: 'tactical', label: 'Tactical' },
  { mode: 'prematch', label: 'Pre-match' },
  { mode: 'recovery', label: 'Recovery' },
  { mode: 'heavy', label: 'Fitness' },
  { mode: 'taper', label: 'Taper' },
  { mode: 'forward-focus', label: 'Forwards' },
  { mode: 'midfield-focus', label: 'Midfield' },
  { mode: 'defender-focus', label: 'Defenders' },
  { mode: 'last-week', label: 'Last week' }
];

const TRAINING_SCHEDULE_OPTIONS: Array<{ mode: TrainingScheduleMode; label: string; days: DayName[] }> = [
  { mode: 'mwf', label: 'MWF', days: ['Monday', 'Wednesday', 'Friday'] },
  { mode: 'tths', label: 'Tue / Thu / Sat', days: ['Tuesday', 'Thursday', 'Saturday'] },
  { mode: 'weekend', label: 'Weekend', days: ['Saturday', 'Sunday'] },
  { mode: 'mw', label: 'Mon / Wed', days: ['Monday', 'Wednesday'] },
  { mode: 'tth', label: 'Tue / Thu', days: ['Tuesday', 'Thursday'] },
  { mode: 'weekdays', label: 'Mon - Fri', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
  { mode: 'custom', label: 'Every day', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }
];

const trainingScheduleModeSchema = z.enum(['mwf', 'tths', 'weekend', 'mw', 'tth', 'weekdays', 'custom']);

const getTrainingScheduleDays = (mode: TrainingScheduleMode): DayName[] => {
  return TRAINING_SCHEDULE_OPTIONS.find(option => option.mode === mode)?.days ?? [...DAYS_OF_WEEK];
};

const TRAINING_SELECT_CONTENT_CLASS = 'z-[90] border-cyan-300/15 bg-[#07111f] text-slate-100 shadow-2xl shadow-black/35';
const TRAINING_SELECT_ITEM_CLASS = 'text-slate-200 focus:bg-cyan-300/12 focus:text-cyan-50 data-[state=checked]:bg-cyan-300/10 data-[state=checked]:text-cyan-50';
const TRAINING_SELECT_LABEL_CLASS = 'text-[10px] font-black uppercase tracking-[0.14em] text-slate-500';
const TRAINING_SELECT_SEPARATOR_CLASS = 'bg-cyan-300/10';
const TRAINING_DRILL_ICON_CLASS = 'border-cyan-300/12 bg-white/[0.045] text-slate-300 group-hover:border-cyan-300/20 group-hover:bg-cyan-300/8 group-hover:text-cyan-100';

const getTrainingCategoryStyle = (category: string) => {
  const value = category.toLowerCase();
  if (value.includes('recovery') || value.includes('mobility')) {
    return 'border-emerald-300/25 bg-emerald-400/12 text-emerald-100 shadow-[0_0_12px_rgba(52,211,153,0.12)]';
  }
  if (value.includes('conditioning') || value.includes('stamina') || value.includes('physical')) {
    return 'border-orange-300/25 bg-orange-400/12 text-orange-100 shadow-[0_0_12px_rgba(251,146,60,0.14)]';
  }
  if (value.includes('tactical') || value.includes('strategy') || value.includes('defender')) {
    return 'border-cyan-300/25 bg-cyan-300/12 text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,0.12)]';
  }
  if (value.includes('forward') || value.includes('shooting')) {
    return 'border-amber-300/25 bg-amber-300/12 text-amber-100 shadow-[0_0_12px_rgba(252,211,77,0.12)]';
  }
  return 'border-indigo-300/25 bg-indigo-300/12 text-indigo-100 shadow-[0_0_12px_rgba(129,140,248,0.12)]';
};

const getTrainingLoadStyle = (load: number) => {
  if (load >= SESSION_LOAD_THRESHOLDS.high) {
    return {
      badge: 'border-red-300/30 bg-red-500/15 text-red-100 shadow-[0_0_14px_rgba(239,68,68,0.18)]',
      text: 'text-red-200',
      dot: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]'
    };
  }
  if (load >= SESSION_LOAD_THRESHOLDS.high - 3) {
    return {
      badge: 'border-orange-300/30 bg-orange-600/20 text-orange-50 shadow-[0_0_14px_rgba(249,115,22,0.18)]',
      text: 'text-orange-100',
      dot: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]'
    };
  }
  if (load >= SESSION_LOAD_THRESHOLDS.optimal) {
    return {
      badge: 'border-amber-300/25 bg-amber-400/15 text-amber-100 shadow-[0_0_14px_rgba(252,211,77,0.14)]',
      text: 'text-amber-200',
      dot: 'bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.55)]'
    };
  }
  return {
    badge: 'border-emerald-300/25 bg-emerald-500/12 text-emerald-100 shadow-[0_0_14px_rgba(16,185,129,0.12)]',
    text: 'text-emerald-200',
    dot: 'bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.55)]'
  };
};

const DEFAULT_SCHEDULE: WeeklySchedule = {
  Monday: [
    { id: 'init-1', drillId: 'drill-warm-rondo-arrival', name: 'Arrival Rondo Warm-Up', fatigueIncrease: 2 },
    { id: 'init-2', drillId: 'drill-positional-5v5-plus3', name: '5v5+3 Positional Play', fatigueIncrease: 5 }
  ],
  Tuesday: [
    { id: 'init-3', drillId: 'drill-cond-tempo-possession', name: 'Tempo Possession Conditioning', fatigueIncrease: 6 }
  ],
  Wednesday: [],
  Thursday: [
    { id: 'init-4', drillId: 'drill-tactical-midblock-trap', name: 'Mid-Block Pressing Trap', fatigueIncrease: 5 },
    { id: 'init-5', drillId: 'drill-tactical-set-piece-zones', name: 'Set-Piece Zone Assignments', fatigueIncrease: 3 }
  ],
  Friday: [
    { id: 'init-6', drillId: 'drill-recovery-breath-mobility', name: 'Breathing and Mobility Reset', fatigueIncrease: 1 }
  ],
  Saturday: [],
  Sunday: []
};

const weeklyScheduleWeeksSchema = z.record(z.string(), weeklyScheduleSchema);

const readTrainingSessionMeta = () => readJsonStorage(
  STORAGE_KEYS.trainingSessionMeta,
  trainingSessionMetaMapSchema,
  {},
  'Training session notes'
);

const DRILL_FILTER_GROUPS = [
  {
    label: 'Training type',
    options: [
      { id: 'all', label: 'All drills' },
      { id: 'technical', label: 'Technical' },
      { id: 'tactical', label: 'Tactical' },
      { id: 'conditioning', label: 'Conditioning & recovery' }
    ]
  },
  {
    label: 'Player role',
    options: [
      { id: 'forward', label: 'Forwards' },
      { id: 'midfielder', label: 'Midfielders' },
      { id: 'defender', label: 'Defenders' },
      { id: 'goalkeeper', label: 'Goalkeepers' }
    ]
  },
  {
    label: 'Attribute',
    options: [
      { id: 'speed', label: 'Speed' },
      { id: 'shooting', label: 'Shooting' },
      { id: 'passing', label: 'Passing' },
      { id: 'dribbling', label: 'Dribbling' },
      { id: 'defending', label: 'Defending' },
      { id: 'physicalness', label: 'Stamina & physicality' }
    ]
  }
] as const;

const DRILL_FILTER_LABELS = Object.fromEntries(
  DRILL_FILTER_GROUPS.flatMap(group => group.options.map(option => [option.id, option.label]))
);

type DrillLibraryTab = 'recommended' | 'technical' | 'tactical' | 'conditioning' | 'recovery';

const DRILL_LIBRARY_TABS: Array<{ id: DrillLibraryTab; label: string }> = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'technical', label: 'Technical' },
  { id: 'tactical', label: 'Tactical' },
  { id: 'conditioning', label: 'Conditioning' },
  { id: 'recovery', label: 'Recovery' }
];

const getDrillLibraryTab = (drill: TrainingDrill): Exclude<DrillLibraryTab, 'recommended'> => {
  const category = drill.category.toLowerCase();
  if (category.includes('recovery')) return 'recovery';
  if (category.includes('conditioning') || category.includes('stamina') || category.includes('physical')) return 'conditioning';
  if (category.includes('tactical') || category.includes('strategy') || category.includes('creative midfield')) return 'tactical';
  return 'technical';
};

const createEmptyWeeklySchedule = (): WeeklySchedule => ({
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: [],
  Sunday: []
});

const filterScheduleToTrainingDays = (schedule: WeeklySchedule, trainingDays: DayName[]): WeeklySchedule => {
  const activeDays = new Set(trainingDays);
  const next = createEmptyWeeklySchedule();
  DAYS_OF_WEEK.forEach(day => {
    next[day] = activeDays.has(day) ? schedule[day] : [];
  });
  return next;
};

const normalizeWeeklySchedule = (schedule: WeeklySchedule): WeeklySchedule => {
  const normalized = createEmptyWeeklySchedule();
  DAYS_OF_WEEK.forEach(day => {
    const blockCounts = new Map<string, number>();
    normalized[day] = (schedule[day] ?? []).map(drill => {
      const source = TRAINING_DRILLS.find(item => item.id === drill.drillId);
      const block = drill.block ?? (source ? inferDrillSessionBlock(source) : 'technical');
      const blockDefinition = SESSION_BLOCKS.find(item => item.id === block);
      const order = drill.order ?? (blockCounts.get(block) ?? 0);
      const libraryIntensity = source?.fatigueIncrease ?? drill.fatigueIncrease;
      const hasCustomIntensity = drill.intensityRating !== undefined && drill.intensityRating !== drill.fatigueIncrease;
      blockCounts.set(block, order + 1);
      return {
        ...drill,
        fatigueIncrease: libraryIntensity,
        block,
        order,
        durationMinutes: drill.durationMinutes ?? blockDefinition?.defaultDurationMinutes ?? 15,
        intensityRating: hasCustomIntensity ? drill.intensityRating : libraryIntensity,
        equipment: drill.equipment ?? getDrillEquipment(drill.drillId)
      };
    });
  });
  return normalized;
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekStartDate = (date: Date) => {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(date);
  start.setHours(12, 0, 0, 0);
  start.setDate(date.getDate() + diff);
  return start;
};

const addWeeks = (date: Date, weeks: number) => {
  const next = new Date(date);
  next.setDate(date.getDate() + weeks * 7);
  return getWeekStartDate(next);
};

const getWeekRangeLabel = (weekStart: Date) => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const sameYear = weekStart.getFullYear() === weekEnd.getFullYear();
  const startLabel = weekStart.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' })
  });
  const endLabel = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startLabel} - ${endLabel}`;
};

const readWeeklyScheduleWeeks = () => readJsonStorage(
  STORAGE_KEYS.weeklyScheduleWeeks,
  weeklyScheduleWeeksSchema,
  {},
  'Weekly training weeks'
);

const readScheduleForWeek = (weekKey: string, currentWeekKey: string) => {
  const scheduleWeeks = readWeeklyScheduleWeeks();
  if (scheduleWeeks[weekKey]) return normalizeWeeklySchedule(scheduleWeeks[weekKey]);
  if (weekKey === currentWeekKey) {
    return normalizeWeeklySchedule(readJsonStorage(STORAGE_KEYS.weeklySchedule, weeklyScheduleSchema, DEFAULT_SCHEDULE, 'Weekly training'));
  }
  return createEmptyWeeklySchedule();
};

const writeScheduleForWeek = (weekKey: string, schedule: WeeklySchedule) => {
  const scheduleWeeks = readWeeklyScheduleWeeks();
  writeJsonStorage(STORAGE_KEYS.weeklyScheduleWeeks, {
    ...scheduleWeeks,
    [weekKey]: schedule
  });
};

const createScheduledDrill = (
  drill: TrainingDrill,
  day: DayName,
  order: number,
  playerName?: string
): ScheduledDrill => {
  const block = inferDrillSessionBlock(drill);
  const blockDefinition = SESSION_BLOCKS.find(item => item.id === block);
  return {
    id: `scheduled-${day}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    drillId: drill.id,
    name: drill.name,
    icon: drill.icon,
    fatigueIncrease: drill.fatigueIncrease,
    playerName,
    block,
    order,
    durationMinutes: blockDefinition?.defaultDurationMinutes ?? 15,
    intensityRating: drill.fatigueIncrease,
    equipment: getDrillEquipment(drill.id)
  };
};

export default function TrainingView({
  players,
  assessments,
  games,
  onUpdateGames,
  initialBuilderDay,
  onInitialBuilderDayHandled
}: TrainingViewProps) {
  const [selectedDrillId, setSelectedDrillId] = useState<string>(TRAINING_DRILLS[0].id);
  const [builderDay, setBuilderDay] = useState<DayName | null>(null);
  const [selectedTemplateMode, setSelectedTemplateMode] = useState<WeeklyTemplateMode | ''>('');
  const [trainingScheduleMode, setTrainingScheduleMode] = useState<TrainingScheduleMode>(() =>
    readStringStorage(
      STORAGE_KEYS.weeklyScheduleCadence,
      trainingScheduleModeSchema,
      'weekdays',
      'Training schedule cadence'
    )
  );
  const [activeTrainingDays, setActiveTrainingDays] = useState<DayName[]>(() => getTrainingScheduleDays(trainingScheduleMode));
  const currentWeekKey = useMemo(() => toDateKey(getWeekStartDate(new Date())), []);
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => getWeekStartDate(new Date()));
  const selectedWeekKey = useMemo(() => toDateKey(selectedWeekStart), [selectedWeekStart]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(() => {
    return readScheduleForWeek(currentWeekKey, currentWeekKey);
  });
  const [trainingSessionMeta, setTrainingSessionMeta] = useState<TrainingSessionMetaMap>(() => readTrainingSessionMeta());

  const weekDaysMap = useMemo(() => getWeekDaysMap(selectedWeekStart), [selectedWeekStart]);
  const weekRangeLabel = useMemo(() => getWeekRangeLabel(selectedWeekStart), [selectedWeekStart]);
  const isCurrentWeek = selectedWeekKey === currentWeekKey;
  const activeTrainingDaySet = useMemo(() => new Set(activeTrainingDays), [activeTrainingDays]);
  const selectedWeekSessionMeta = trainingSessionMeta[selectedWeekKey] ?? {};

  useEffect(() => {
    // Archive current week as history before overwriting
    const current = readJsonStorage(STORAGE_KEYS.weeklySchedule, weeklyScheduleSchema, weeklySchedule, 'Weekly training');
    writeJsonStorage(STORAGE_KEYS.weeklyScheduleHistory, current);
    writeScheduleForWeek(selectedWeekKey, weeklySchedule);
    writeJsonStorage(STORAGE_KEYS.weeklySchedule, weeklySchedule);
  }, [selectedWeekKey, weeklySchedule]);

  useEffect(() => {
    writeJsonStorage(STORAGE_KEYS.trainingSessionMeta, trainingSessionMeta);
  }, [trainingSessionMeta]);

  useEffect(() => {
    if (!initialBuilderDay) return;
    if (selectedWeekKey !== currentWeekKey) {
      const currentStart = getWeekStartDate(new Date());
      setSelectedWeekStart(currentStart);
      setWeeklySchedule(readScheduleForWeek(currentWeekKey, currentWeekKey));
    }
    setBuilderDay(initialBuilderDay);
    onInitialBuilderDayHandled?.();
  }, [currentWeekKey, initialBuilderDay, onInitialBuilderDayHandled, selectedWeekKey]);

  // Synchronize Weekly Training to Calendar Games
  useEffect(() => {
    const result = synchronizeTrainingCalendar({
      games,
      weeklySchedule,
      weekDaysMap
    });
    if (result.changed) {
      onUpdateGames(result.games);
    }
  }, [weeklySchedule, games, onUpdateGames, weekDaysMap]);

  const handleNavigateWeek = (direction: -1 | 1) => {
    writeScheduleForWeek(selectedWeekKey, weeklySchedule);
    const nextWeekStart = addWeeks(selectedWeekStart, direction);
    const nextWeekKey = toDateKey(nextWeekStart);
    setBuilderDay(null);
    setSelectedWeekStart(nextWeekStart);
    setWeeklySchedule(readScheduleForWeek(nextWeekKey, currentWeekKey));
  };

  const handleReturnToCurrentWeek = () => {
    writeScheduleForWeek(selectedWeekKey, weeklySchedule);
    const currentStart = getWeekStartDate(new Date());
    setBuilderDay(null);
    setSelectedWeekStart(currentStart);
    setWeeklySchedule(readScheduleForWeek(currentWeekKey, currentWeekKey));
  };

  const [selectedAttributeFilter, setSelectedAttributeFilter] = useState('all');
  const [activeDrillLibraryTab, setActiveDrillLibraryTab] = useState<DrillLibraryTab>('recommended');
  const [recommendPlayerId, setRecommendPlayerId] = useState('');
  const [developmentDay, setDevelopmentDay] = useState<DayName>('Wednesday');
  const [developmentFocus, setDevelopmentFocus] = useState<'all' | 'technical' | 'tactical' | 'conditioning' | 'recovery'>('all');
  const [selectedTrainingDrillIds, setSelectedTrainingDrillIds] = useState<string[]>([]);
  const [recentEvidenceMessage, setRecentEvidenceMessage] = useState<string>('');

  const handleDragStart = (e: React.DragEvent, drillId: string) => {
    e.dataTransfer.setData('text/plain', drillId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDropDrill = (day: DayName, e: React.DragEvent) => {
    e.preventDefault();
    const drillId = e.dataTransfer.getData('text/plain');
    const drill = TRAINING_DRILLS.find(d => d.id === drillId);
    if (drill) {
      setWeeklySchedule(prev => ({
        ...prev,
        [day]: [...prev[day], createScheduledDrill(drill, day, prev[day].length)]
      }));
    }
  };

  const handleRemoveDrill = (day: DayName, id: string) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: prev[day].filter(item => item.id !== id)
    }));
  };

  const handleClearAllWeekly = () => {
    setWeeklySchedule({
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    });
  };

  const handleTrainingScheduleChange = (mode: TrainingScheduleMode) => {
    const option = TRAINING_SCHEDULE_OPTIONS.find(item => item.mode === mode);
    if (!option) return;
    setTrainingScheduleMode(mode);
    setActiveTrainingDays(option.days);
    writeStringStorage(STORAGE_KEYS.weeklyScheduleCadence, mode);
    if (builderDay && !option.days.includes(builderDay)) {
      setBuilderDay(null);
    }
    setWeeklySchedule(prev => normalizeWeeklySchedule(filterScheduleToTrainingDays(prev, option.days)));
  };

  const handleUpdateSessionMeta = (day: DayName, meta: TrainingSessionMeta) => {
    setTrainingSessionMeta(current => ({
      ...current,
      [selectedWeekKey]: {
        ...(current[selectedWeekKey] ?? {}),
        [day]: meta
      }
    }));
  };

  const handleLoadTemplate = (mode: WeeklyTemplateMode) => {
    setSelectedTemplateMode(mode);
    if (mode === 'last-week') {
      const prev = readJsonStorage(STORAGE_KEYS.weeklyScheduleHistory, weeklyScheduleSchema.nullable(), null, 'Training history');
      if (!prev) return;
      const restored: WeeklySchedule = { Monday:[], Tuesday:[], Wednesday:[], Thursday:[], Friday:[], Saturday:[], Sunday:[] };
      DAYS_OF_WEEK.forEach(day => {
        restored[day] = (prev[day] || []).map((drill, index) => ({
          ...drill,
          id: `lw-${day}-${Date.now()}-${index}`
        }));
      });
      setWeeklySchedule(normalizeWeeklySchedule(filterScheduleToTrainingDays(restored, activeTrainingDays)));
      return;
    }

    const fillDays = (template: Partial<Record<DayName, Array<{ id: string; drillId: string; name: string; fatigueIncrease: number }>>>) => {
      const base: WeeklySchedule = { Monday:[], Tuesday:[], Wednesday:[], Thursday:[], Friday:[], Saturday:[], Sunday:[] };
      const sessions = DAYS_OF_WEEK
        .map(day => template[day] ?? [])
        .filter(session => session.length > 0);

      if (sessions.length === 0) return base;

      activeTrainingDays.forEach((day, dayIndex) => {
        const session = sessions[dayIndex % sessions.length];
        base[day] = session.map((item, drillIndex) => {
          const source = TRAINING_DRILLS.find(drill => drill.id === item.drillId);
          return {
            ...item,
            id: `${item.id}-${day}-${drillIndex}`,
            name: source?.name ?? item.name,
            fatigueIncrease: source?.fatigueIncrease ?? item.fatigueIncrease,
            intensityRating: source?.fatigueIncrease ?? item.fatigueIncrease
          };
        });
      });
      return normalizeWeeklySchedule(base);
    };

    if (mode === 'heavy') {
      setWeeklySchedule(fillDays({
        Monday: [
          { id: 'h-1', drillId: 'drill-warm-speed-react', name: 'Reaction Gates Warm-Up', fatigueIncrease: 3 },
          { id: 'h-2', drillId: 'drill-cond-accel-decel', name: 'Acceleration-Deceleration Grid', fatigueIncrease: 6 },
          { id: 'h-3', drillId: 'drill-cond-hiit-small-sided', name: 'HIIT Small-Sided Waves', fatigueIncrease: 8 }
        ],
        Tuesday: [
          { id: 'h-4', drillId: 'drill-warm-rondo-arrival', name: 'Arrival Rondo Warm-Up', fatigueIncrease: 2 },
          { id: 'h-5', drillId: 'drill-cond-tempo-possession', name: 'Tempo Possession Conditioning', fatigueIncrease: 6 },
          { id: 'h-6', drillId: 'drill-counterpress-6-second', name: 'Six-Second Counter-Press Game', fatigueIncrease: 6 }
        ],
        Wednesday: [
          { id: 'h-7', drillId: 'drill-recovery-breath-mobility', name: 'Breathing and Mobility Reset', fatigueIncrease: 1 },
          { id: 'h-8', drillId: 'drill-recovery-ball-circulation', name: 'Low-Tempo Ball Circulation', fatigueIncrease: 1 }
        ],
        Thursday: [
          { id: 'h-9', drillId: 'drill-warm-pass-move', name: 'Pass-and-Move Activation', fatigueIncrease: 2 },
          { id: 'h-10', drillId: 'drill-transition-wave', name: 'Three-Zone Transition Wave', fatigueIncrease: 6 },
          { id: 'h-11', drillId: 'drill-cond-speed-endurance', name: 'Speed-Endurance Channels', fatigueIncrease: 7 }
        ],
        Friday: [
          { id: 'h-12', drillId: 'drill-tactical-set-piece-zones', name: 'Set-Piece Zone Assignments', fatigueIncrease: 3 },
          { id: 'h-13', drillId: 'drill-recovery-foam-band', name: 'Foam Roll and Band Release', fatigueIncrease: 1 }
        ]
      }));
    } else if (mode === 'taper') {
      setWeeklySchedule(fillDays({
        Monday: [
          { id: 't-1', drillId: 'drill-warm-rondo-arrival', name: 'Arrival Rondo Warm-Up', fatigueIncrease: 2 },
          { id: 't-2', drillId: 'drill-positional-5v5-plus3', name: '5v5+3 Positional Play', fatigueIncrease: 5 }
        ],
        Tuesday: [
          { id: 't-3', drillId: 'drill-warm-pass-move', name: 'Pass-and-Move Activation', fatigueIncrease: 2 },
          { id: 't-4', drillId: 'drill-tactical-final-third-rotation', name: 'Final-Third Rotation Pattern', fatigueIncrease: 4 }
        ],
        Wednesday: [],
        Thursday: [
          { id: 't-5', drillId: 'drill-recovery-ball-circulation', name: 'Low-Tempo Ball Circulation', fatigueIncrease: 1 },
          { id: 't-6', drillId: 'drill-tactical-set-piece-zones', name: 'Set-Piece Zone Assignments', fatigueIncrease: 3 }
        ],
        Friday: [
          { id: 't-7', drillId: 'drill-recovery-breath-mobility', name: 'Breathing and Mobility Reset', fatigueIncrease: 1 }
        ]
      }));
    } else if (mode === 'tactical') {
      setWeeklySchedule(fillDays({
        Monday: [
          { id: 'ac-1', drillId: 'drill-warm-rondo-arrival', name: 'Arrival Rondo Warm-Up', fatigueIncrease: 2 },
          { id: 'ac-2', drillId: 'drill-positional-5v5-plus3', name: '5v5+3 Positional Play', fatigueIncrease: 5 }
        ],
        Tuesday: [
          { id: 'ac-3', drillId: 'drill-tactical-midblock-trap', name: 'Mid-Block Pressing Trap', fatigueIncrease: 5 },
          { id: 'ac-4', drillId: 'drill-tactical-backline-cover', name: 'Back-Line Cover Rotation', fatigueIncrease: 4 }
        ],
        Wednesday: [],
        Thursday: [
          { id: 'ac-5', drillId: 'drill-tactical-press-resist-build', name: 'Press-Resistant Build-Up', fatigueIncrease: 5 },
          { id: 'ac-6', drillId: 'drill-tactical-overload-to-isolate', name: 'Overload to Isolate Switch', fatigueIncrease: 4 }
        ],
        Friday: [
          { id: 'ac-7', drillId: 'drill-tactical-final-third-rotation', name: 'Final-Third Rotation Pattern', fatigueIncrease: 4 },
          { id: 'ac-8', drillId: 'drill-tactical-set-piece-zones', name: 'Set-Piece Zone Assignments', fatigueIncrease: 3 }
        ]
      }));
    } else if (mode === 'prematch') {
      // Light day before match, match day empty, recovery after
      setWeeklySchedule(fillDays({
        Monday: [
          { id: 'pm-1', drillId: 'drill-warm-rondo-arrival', name: 'Arrival Rondo Warm-Up', fatigueIncrease: 2 },
          { id: 'pm-2', drillId: 'drill-tactical-overload-to-isolate', name: 'Overload to Isolate Switch', fatigueIncrease: 4 }
        ],
        Tuesday: [
          { id: 'pm-3', drillId: 'drill-tactical-midblock-trap', name: 'Mid-Block Pressing Trap', fatigueIncrease: 5 },
          { id: 'pm-4', drillId: 'drill-tactical-set-piece-zones', name: 'Set-Piece Zone Assignments', fatigueIncrease: 3 }
        ],
        Wednesday: [],
        Thursday: [
          { id: 'pm-5', drillId: 'drill-warm-pass-move', name: 'Pass-and-Move Activation', fatigueIncrease: 2 },
          { id: 'pm-6', drillId: 'drill-tactical-final-third-rotation', name: 'Final-Third Rotation Pattern', fatigueIncrease: 4 },
          { id: 'pm-7', drillId: 'drill-recovery-breath-mobility', name: 'Breathing and Mobility Reset', fatigueIncrease: 1 }
        ],
        Friday: [
          { id: 'pm-8', drillId: 'drill-recovery-ball-circulation', name: 'Low-Tempo Ball Circulation', fatigueIncrease: 1 },
          { id: 'pm-9', drillId: 'drill-recovery-foam-band', name: 'Foam Roll and Band Release', fatigueIncrease: 1 }
        ],
        Saturday: [],  // Match day — kept clear
        Sunday: []      // Rest day
      }));
    } else if (mode === 'recovery') {
      // Low load, mobility and technique focus
      setWeeklySchedule(fillDays({
        Monday: [
          { id: 'rc-1', drillId: 'drill-recovery-breath-mobility', name: 'Breathing and Mobility Reset', fatigueIncrease: 1 },
          { id: 'rc-2', drillId: 'drill-recovery-ball-circulation', name: 'Low-Tempo Ball Circulation', fatigueIncrease: 1 }
        ],
        Tuesday: [
          { id: 'rc-3', drillId: 'drill-recovery-yoga-hips', name: 'Hip and Hamstring Yoga Flow', fatigueIncrease: 1 }
        ],
        Wednesday: [],
        Thursday: [
          { id: 'rc-4', drillId: 'drill-recovery-regeneration-walk', name: 'Regeneration Walk and Scan', fatigueIncrease: 1 },
          { id: 'rc-5', drillId: 'drill-recovery-pool-shadow', name: 'Pool or No-Impact Shadow Movements', fatigueIncrease: 1 }
        ],
        Friday: [
          { id: 'rc-6', drillId: 'drill-recovery-foam-band', name: 'Foam Roll and Band Release', fatigueIncrease: 1 },
          { id: 'rc-7', drillId: 'drill-mobility', name: 'Mobility & Recovery Flow', fatigueIncrease: 1 }
        ],
        Saturday: [],
        Sunday: []
      }));
    } else if (mode === 'forward-focus') {
      setWeeklySchedule(fillDays({
        Monday: [
          { id: 'ff-1', drillId: 'drill-warm-pass-move', name: 'Pass-and-Move Activation', fatigueIncrease: 2 },
          { id: 'ff-2', drillId: 'drill-fwd-pressing-curve', name: 'Striker Curved Press', fatigueIncrease: 5 }
        ],
        Tuesday: [
          { id: 'ff-3', drillId: 'drill-fwd-positioning', name: 'Off-Ball Striker Movement', fatigueIncrease: 4 },
          { id: 'ff-4', drillId: 'drill-winger-1v1-cross', name: 'Winger 1v1 to Cutback', fatigueIncrease: 5 }
        ],
        Wednesday: [],
        Thursday: [
          { id: 'ff-5', drillId: 'drill-tactical-final-third-rotation', name: 'Final-Third Rotation Pattern', fatigueIncrease: 4 },
          { id: 'ff-6', drillId: 'drill-fwd-cross-finish', name: 'Crossing & Volley Finish Drill', fatigueIncrease: 5 }
        ],
        Friday: [
          { id: 'ff-7', drillId: 'drill-fwd-rebound', name: 'Rebound Anticipation Finishing', fatigueIncrease: 5 },
          { id: 'ff-8', drillId: 'drill-recovery-breath-mobility', name: 'Breathing and Mobility Reset', fatigueIncrease: 1 }
        ],
        Saturday: [],
        Sunday: []
      }));
    } else if (mode === 'midfield-focus') {
      setWeeklySchedule(fillDays({
        Monday: [
          { id: 'mf-1', drillId: 'drill-rondo-4v2-split', name: '4v2 Split-Pass Rondo', fatigueIncrease: 3 },
          { id: 'mf-2', drillId: 'drill-mid-pivot-scan', name: 'Pivot Scan and Bounce', fatigueIncrease: 3 }
        ],
        Tuesday: [
          { id: 'mf-3', drillId: 'drill-positional-5v5-plus3', name: '5v5+3 Positional Play', fatigueIncrease: 5 },
          { id: 'mf-4', drillId: 'drill-tactical-press-resist-build', name: 'Press-Resistant Build-Up', fatigueIncrease: 5 }
        ],
        Wednesday: [],
        Thursday: [
          { id: 'mf-5', drillId: 'drill-tactical-overload-to-isolate', name: 'Overload to Isolate Switch', fatigueIncrease: 4 },
          { id: 'mf-6', drillId: 'drill-mid-box-arrival', name: 'Late Box Arrival Finish', fatigueIncrease: 4 }
        ],
        Friday: [
          { id: 'mf-7', drillId: 'drill-mid-switch-play', name: 'Switching Play Long Diagonals', fatigueIncrease: 3 },
          { id: 'mf-8', drillId: 'drill-recovery-ball-circulation', name: 'Low-Tempo Ball Circulation', fatigueIncrease: 1 }
        ],
        Saturday: [],
        Sunday: []
      }));
    } else if (mode === 'defender-focus') {
      setWeeklySchedule(fillDays({
        Monday: [
          { id: 'df-1', drillId: 'drill-warm-rondo-arrival', name: 'Arrival Rondo Warm-Up', fatigueIncrease: 2 },
          { id: 'df-2', drillId: 'drill-tactical-backline-cover', name: 'Back-Line Cover Rotation', fatigueIncrease: 4 }
        ],
        Tuesday: [
          { id: 'df-3', drillId: 'drill-def-cb-build-out', name: 'Centre-Back Build-Out', fatigueIncrease: 3 },
          { id: 'df-4', drillId: 'drill-tactical-midblock-trap', name: 'Mid-Block Pressing Trap', fatigueIncrease: 5 }
        ],
        Wednesday: [],
        Thursday: [
          { id: 'df-5', drillId: 'drill-def-rest-defense', name: 'Rest-Defense Counter Cover', fatigueIncrease: 4 },
          { id: 'df-6', drillId: 'drill-tactical-set-piece-zones', name: 'Set-Piece Zone Assignments', fatigueIncrease: 3 }
        ],
        Friday: [
          { id: 'df-7', drillId: 'drill-fullback-underlap', name: 'Fullback Underlap Timing', fatigueIncrease: 5 },
          { id: 'df-8', drillId: 'drill-recovery-foam-band', name: 'Foam Roll and Band Release', fatigueIncrease: 1 }
        ],
        Saturday: [],
        Sunday: []
      }));
    }
  };

  const calculateOVR = (bAttrs: Player['baseAttributes'], pAttrs: Player['positionAttributes']) => {
    if (!bAttrs) return 50;
    const baseAvg = (bAttrs.pace + bAttrs.stamina + bAttrs.agility + bAttrs.strength + bAttrs.firstTouch + bAttrs.shortPassing) / 6;
    const posKeys = Object.keys(pAttrs || {});
    let posAvg = 0;
    if (posKeys.length > 0) {
      posAvg = (Object.values(pAttrs) as number[]).reduce((a: number, b: number) => a + b, 0) / posKeys.length;
    }
    return Math.round(posKeys.length > 0 ? (baseAvg * 0.6) + (posAvg * 0.4) : baseAvg);
  };

  // Find info about a player selected for recommendation
  const recommendedPlayer = players.find(p => p.id === recommendPlayerId);
  const rankedPlayerAttributes = recommendedPlayer
    ? Object.entries(recommendedPlayer.baseAttributes || {}).sort((a, b) => b[1] - a[1])
    : [];
  const strongestPlayerAttributes = rankedPlayerAttributes.slice(0, 2);
  const playerGoalContributions = recommendedPlayer
    ? recommendedPlayer.points + recommendedPlayer.assists
    : 0;

  const getPlayerGrowthNeeds = (player: Player) => {
    const attrs = player.baseAttributes || { pace: 50, stamina: 50, agility: 50, strength: 50, firstTouch: 50, shortPassing: 50 };
    const sorted = Object.entries(attrs).sort((a, b) => (a[1] as number) - (b[1] as number));
    const lowestAttr = sorted[0][0];
    const lowestVal = sorted[0][1];

    let positionKeys: string[] = [];
    if (player.position === 'Forward') positionKeys = ['pace', 'shortPassing'];
    else if (player.position === 'Midfielder') positionKeys = ['shortPassing', 'stamina'];
    else if (player.position === 'Defender') positionKeys = ['strength', 'pace'];
    else positionKeys = ['agility', 'strength'];

    return {
      lowestAttr,
      lowestVal,
      positionKeys,
      isBeneficial: (drill: TrainingDrill) => {
        return drill.targetAttributes.includes(lowestAttr) || 
               drill.targetAttributes.some(attr => positionKeys.includes(attr));
      }
    };
  };

  const growthNeeds = recommendedPlayer ? getPlayerGrowthNeeds(recommendedPlayer) : null;

  const developmentDrills = TRAINING_DRILLS.filter(drill => {
    const category = drill.category.toLowerCase();
    if (developmentFocus === 'conditioning') {
      return category.includes('conditioning') || category.includes('stamina') || category.includes('physical');
    }
    if (developmentFocus === 'recovery') return category.includes('recovery');
    if (developmentFocus === 'tactical') {
      return category.includes('tactical') || category.includes('strategy') || category.includes('creative midfield');
    }
    if (developmentFocus === 'technical') {
      return !category.includes('conditioning') &&
        !category.includes('recovery') &&
        !category.includes('stamina') &&
        !category.includes('physical') &&
        !category.includes('tactical') &&
        !category.includes('strategy');
    }
    return true;
  });
  const orderedDevelopmentDrills = [...developmentDrills].sort((first, second) => {
    if (!growthNeeds) return 0;
    return Number(growthNeeds.isBeneficial(second)) - Number(growthNeeds.isBeneficial(first));
  });

  const selectedTrainingDrills = TRAINING_DRILLS.filter(drill => selectedTrainingDrillIds.includes(drill.id));
  const selectedScheduleDrill = TRAINING_DRILLS.find(drill => drill.id === selectedDrillId) ?? TRAINING_DRILLS[0];
  const selectedScheduleDrillInstructions = DRILL_INSTRUCTIONS[selectedScheduleDrill.id];
  const selectedTrainingLoad = selectedTrainingDrills.reduce((sum, drill) => {
    const block = inferDrillSessionBlock(drill);
    const duration = SESSION_BLOCKS.find(item => item.id === block)?.defaultDurationMinutes ?? 15;
    return sum + Math.round(drill.fatigueIncrease * duration / 10);
  }, 0);
  const developmentEvidenceSummary = summarizeDevelopmentEvidence(selectedTrainingDrills, selectedTrainingLoad);
  const developmentEvidenceSignals = developmentEvidenceSummary.focusSignals;
  const developmentFocusLabel = formatTrainingFocusList(developmentEvidenceSignals);
  const selectedScheduleDrillCategoryClass = getTrainingCategoryStyle(selectedScheduleDrill.category);
  const selectedScheduleDrillLoadStyle = getTrainingLoadStyle(selectedScheduleDrill.fatigueIncrease);
  const selectedTrainingLoadStyle = getTrainingLoadStyle(selectedTrainingLoad);
  const latestRecommendedPlayerAssessment = recommendedPlayer
    ? selectLatestAssessmentForPlayer(assessments, recommendedPlayer.id)
    : null;
  const ratingConfidence = getAssessmentConfidence(latestRecommendedPlayerAssessment);

  const dailyLoads = DAYS_OF_WEEK.map(day => ({
    day,
    load: getSessionLoadPoints(weeklySchedule[day])
  }));
  const weeklyLoad = dailyLoads.reduce((sum, item) => sum + item.load, 0);
  const overloadedDays = dailyLoads.filter(item => item.load >= SESSION_LOAD_THRESHOLDS.high);
  const recoveryDays = dailyLoads.filter(item => item.load < SESSION_LOAD_THRESHOLDS.optimal).length;
  const highestLoadDay = dailyLoads.reduce((highest, item) => item.load > highest.load ? item : highest, dailyLoads[0]);
  const lowestLoadDay = dailyLoads.reduce((lowest, item) => item.load < lowest.load ? item : lowest, dailyLoads[0]);
  const overloadedDayNames = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' })
    .format(overloadedDays.map(item => item.day));
  const weekHealth = overloadedDays.length >= 2 || weeklyLoad > SESSION_LOAD_THRESHOLDS.weeklyHigh
    ? {
        label: 'High load',
        badgeClass: 'border-red-300/30 bg-red-500/15 text-red-100 shadow-[0_0_14px_rgba(239,68,68,0.16)]',
        iconClass: 'text-red-200',
        actionClass: 'border-red-300/25 bg-red-500/10 text-red-100 hover:bg-red-500/15 hover:text-red-50'
      }
    : overloadedDays.length === 1 || recoveryDays < 2
      ? {
          label: 'Needs attention',
          badgeClass: 'border-amber-300/25 bg-amber-400/15 text-amber-100 shadow-[0_0_14px_rgba(252,211,77,0.14)]',
          iconClass: 'text-amber-200',
          actionClass: 'border-amber-300/25 bg-amber-400/10 text-amber-100 hover:bg-amber-400/15 hover:text-amber-50'
        }
      : {
          label: 'Balanced',
          badgeClass: 'border-emerald-300/25 bg-emerald-500/12 text-emerald-100 shadow-[0_0_14px_rgba(16,185,129,0.14)]',
          iconClass: 'text-emerald-200',
          actionClass: 'border-emerald-300/25 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15 hover:text-emerald-50'
        };

  const addDrillsToDay = (drills: readonly TrainingDrill[], day: DayName, playerName?: string) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: [
        ...prev[day],
        ...drills.map((drill, index) => createScheduledDrill(drill, day, prev[day].length + index, playerName))
      ]
    }));
  };

  const handleWeekHealthAction = () => {
    if (overloadedDays.length === 0) {
      const recoveryDrill = TRAINING_DRILLS.find(drill => drill.id === 'drill-mobility');
      if (recoveryDrill) addDrillsToDay([recoveryDrill], lowestLoadDay.day);
      return;
    }

    setWeeklySchedule(current => {
      const drills = current[highestLoadDay.day];
      if (drills.length === 0) return current;
      const highestLoadDrill = drills.reduce((highest, drill) => (
        getSessionLoadPoints([drill]) > getSessionLoadPoints([highest]) ? drill : highest
      ), drills[0]);
      return {
        ...current,
        [highestLoadDay.day]: drills.filter(drill => drill.id !== highestLoadDrill.id)
      };
    });
  };

  const handleCompleteDevelopmentSession = () => {
    if (!recommendedPlayer || selectedTrainingDrills.length === 0) return;
    const label = developmentEvidenceSummary.reassessmentRecommended
      ? 'Reassessment recommended to verify whether this work changed ability.'
      : 'Development evidence logged. Add more focused work before reassessment.';
    setRecentEvidenceMessage(`${recommendedPlayer.name}: ${selectedTrainingDrills.length} ${selectedTrainingDrills.length === 1 ? 'drill' : 'drills'} completed. ${label}`);
    setSelectedTrainingDrillIds([]);
  };

  const toggleTrainingDrill = (drillId: string) => {
    setSelectedTrainingDrillIds(current =>
      current.includes(drillId)
        ? current.filter(id => id !== drillId)
        : [...current, drillId]
    );
  };

  // Filter drills by category/focus filters
  const filteredDrills = TRAINING_DRILLS.filter(drill => {
    const matchesAttribute =
      selectedAttributeFilter === 'all' ||
      (selectedAttributeFilter === 'conditioning'
        ? drill.category.toLowerCase().includes('conditioning') || drill.category.toLowerCase().includes('recovery')
        : selectedAttributeFilter === 'tactical'
          ? drill.category.toLowerCase().includes('tactical') || drill.category.toLowerCase().includes('strategy')
          : selectedAttributeFilter === 'technical'
            ? !drill.category.toLowerCase().includes('conditioning') &&
              !drill.category.toLowerCase().includes('recovery') &&
              !drill.category.toLowerCase().includes('stamina') &&
              !drill.category.toLowerCase().includes('physical') &&
              !drill.category.toLowerCase().includes('tactical') &&
              !drill.category.toLowerCase().includes('strategy')
        : selectedAttributeFilter === 'forward'
          ? drill.category.toLowerCase().startsWith('forward')
          : selectedAttributeFilter === 'midfielder'
            ? drill.category.toLowerCase().startsWith('midfield')
            : selectedAttributeFilter === 'defender'
              ? drill.category.toLowerCase().startsWith('defender')
              : selectedAttributeFilter === 'goalkeeper'
                ? drill.category.toLowerCase().startsWith('goalkeeper')
                : selectedAttributeFilter === 'passing'
                  ? drill.category.toLowerCase().includes('passing') || drill.targetAttributes.includes('passing')
                  : drill.targetAttributes.includes(selectedAttributeFilter));

    return matchesAttribute;
  });
  const recommendedDrills = growthNeeds
    ? filteredDrills.filter(drill => growthNeeds.isBeneficial(drill))
    : filteredDrills.slice(0, 8);
  const visibleLibraryDrills = activeDrillLibraryTab === 'recommended'
    ? recommendedDrills
    : filteredDrills.filter(drill => getDrillLibraryTab(drill) === activeDrillLibraryTab);
  const drillLibraryTabCounts = DRILL_LIBRARY_TABS.reduce<Record<DrillLibraryTab, number>>((counts, tab) => {
    counts[tab.id] = tab.id === 'recommended'
      ? recommendedDrills.length
      : filteredDrills.filter(drill => getDrillLibraryTab(drill) === tab.id).length;
    return counts;
  }, {
    recommended: 0,
    technical: 0,
    tactical: 0,
    conditioning: 0,
    recovery: 0
  });

  return (
    <div id="training-view-container" className="relative space-y-6">
      <p className="pointer-events-none absolute left-0 top-0 h-px overflow-hidden text-[1px] leading-none text-[#020713]" aria-hidden="true">
        Interactive Training Grounds
      </p>

      {/* WEEKLY DRAG-AND-DROP TRAINING PLANNER */}
      <div id="weekly-training-planner-card" className="space-y-6 rounded-2xl border border-cyan-300/10 bg-[#07111f]/88 p-4 text-slate-100 shadow-lg shadow-black/20 backdrop-blur-xl sm:p-5 lg:p-6">
        {/* Header */}
        <div className="grid gap-4 border-b border-cyan-300/10 pb-5 xl:grid-cols-[minmax(18rem,1fr)_minmax(34rem,auto)] xl:items-start">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/10 bg-cyan-300/10 text-[0px] text-cyan-100 shadow-sm shadow-black/10">
              <CalendarPlus size={17} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Training cycle</p>
              <h3 className="mt-1 font-display text-lg font-black tracking-tight text-slate-50">Weekly Training Planner</h3>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">Shape the week with a preset, then fine tune each day by adding drills from the library.</p>
            </div>
          </div>

          {/* Controls */}
          <div className="rounded-xl border border-cyan-300/10 bg-[#0b1726]/72 p-2 shadow-inner shadow-black/10">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="min-w-0 rounded-lg border border-cyan-300/10 bg-white/[0.025] p-2">
                <span className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">Presets</span>
                <Select
                  value={selectedTemplateMode}
                  onValueChange={(value) => handleLoadTemplate(value as WeeklyTemplateMode)}
                >
                  <SelectTrigger className="h-8 rounded-lg border-cyan-300/10 bg-[#07111f]/80 px-2 text-[10px] font-semibold text-slate-200 shadow-sm shadow-black/10 focus:ring-cyan-300/20">
                    <SelectValue placeholder="Choose plan" />
                  </SelectTrigger>
                  <SelectContent className={TRAINING_SELECT_CONTENT_CLASS}>
                    <SelectGroup>
                      <SelectLabel className={TRAINING_SELECT_LABEL_CLASS}>Weekly presets</SelectLabel>
                      {WEEKLY_TEMPLATE_OPTIONS.map((option) => (
                        <SelectItem key={option.mode} value={option.mode} className={TRAINING_SELECT_ITEM_CLASS}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-0 rounded-lg border border-cyan-300/10 bg-white/[0.025] p-2">
                <span className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">Usual schedule</span>
                <Select
                  value={trainingScheduleMode}
                  onValueChange={(value) => handleTrainingScheduleChange(value as TrainingScheduleMode)}
                >
                  <SelectTrigger className="h-8 rounded-lg border-cyan-300/10 bg-[#07111f]/80 px-2 text-[10px] font-semibold text-slate-200 shadow-sm shadow-black/10 focus:ring-cyan-300/20">
                    <SelectValue placeholder="Training days" />
                  </SelectTrigger>
                  <SelectContent className={TRAINING_SELECT_CONTENT_CLASS}>
                    <SelectGroup>
                      <SelectLabel className={TRAINING_SELECT_LABEL_CLASS}>Training cadence</SelectLabel>
                      {TRAINING_SCHEDULE_OPTIONS.map((option) => (
                        <SelectItem key={option.mode} value={option.mode} className={TRAINING_SELECT_ITEM_CLASS}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="grid grid-cols-1 items-stretch gap-3 rounded-2xl border border-cyan-300/10 bg-[#0b1726]/72 p-2.5 shadow-inner shadow-black/10 sm:grid-cols-[9rem_minmax(15rem,1fr)_9rem] sm:items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleNavigateWeek(-1)}
            className="h-10 w-full rounded-xl border border-cyan-300/10 bg-white/[0.04] px-3 text-slate-300 hover:border-cyan-300/20 hover:bg-cyan-300/10 hover:text-cyan-50 transition-colors flex items-center justify-center gap-2 text-xs font-semibold"
            aria-label="Open previous week's training schedule"
            title="Previous week"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Previous
          </Button>

          <div className="flex min-h-12 flex-col items-center justify-center text-center px-3">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">Training Week</span>
            <span className="min-w-[14rem] text-sm font-display font-black text-slate-50">{weekRangeLabel}</span>
            <span className="text-[10px] font-semibold text-cyan-200">
              {isCurrentWeek ? 'Current week' : selectedWeekStart > getWeekStartDate(new Date()) ? 'Future week' : 'Past week'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
            {!isCurrentWeek && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReturnToCurrentWeek}
                className="h-10 w-full rounded-xl border border-cyan-300/10 bg-cyan-300/10 px-3 text-cyan-100 hover:bg-cyan-300/15 transition-colors text-xs font-semibold"
              >
                This Week
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => handleNavigateWeek(1)}
              className={`${isCurrentWeek ? 'col-span-2 sm:col-span-1' : ''} h-10 w-full rounded-xl border border-cyan-300/10 bg-white/[0.04] px-3 text-slate-300 hover:border-cyan-300/20 hover:bg-cyan-300/10 hover:text-cyan-50 transition-colors flex items-center justify-center gap-2 text-xs font-semibold`}
              aria-label="Open next week's training schedule"
              title="Next week"
            >
              Next
              <ChevronRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Intensity Distribution Trend Graph */}
        <div className="rounded-2xl border border-cyan-300/10 bg-[#0b1726]/72 p-4 text-slate-100 shadow-inner shadow-black/10">
          <div className="flex flex-col gap-3 border-b border-cyan-300/10 pb-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">Load overview</span>
              <h4 className="mt-1 font-display text-base font-black text-slate-50">Intensity Distribution</h4>
              <p className="mt-1 max-w-2xl text-[10px] leading-normal text-slate-400">
                Read the week by date: each bar sits over its day and reflects planned session load.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 lg:items-end">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[9px] font-black uppercase tracking-wider">
                {[
                  { label: 'Light', count: DAYS_OF_WEEK.filter(d => getSessionLoadPoints(weeklySchedule[d]) < SESSION_LOAD_THRESHOLDS.optimal).length, dot: 'bg-emerald-400', tone: 'text-emerald-200' },
                  { label: 'Training', count: DAYS_OF_WEEK.filter(d => {
                    const sum = getSessionLoadPoints(weeklySchedule[d]);
                    return sum >= SESSION_LOAD_THRESHOLDS.optimal && sum < SESSION_LOAD_THRESHOLDS.high - 7;
                  }).length, dot: 'bg-amber-300', tone: 'text-amber-200' },
                  { label: 'Heavy', count: DAYS_OF_WEEK.filter(d => {
                    const sum = getSessionLoadPoints(weeklySchedule[d]);
                    return sum >= SESSION_LOAD_THRESHOLDS.high - 7 && sum < SESSION_LOAD_THRESHOLDS.high;
                  }).length, dot: 'bg-orange-400', tone: 'text-orange-200' },
                  { label: 'High', count: DAYS_OF_WEEK.filter(d => getSessionLoadPoints(weeklySchedule[d]) >= SESSION_LOAD_THRESHOLDS.high).length, dot: 'bg-red-500', tone: 'text-red-200' }
                ].map(item => (
                  <span key={item.label} className={`inline-flex items-center gap-1.5 ${item.tone}`}>
                    <span className={`size-1.5 rounded-full ${item.dot}`} />
                    {item.label} {item.count}
                  </span>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleClearAllWeekly}
                className="h-9 rounded-xl border-slate-500/20 bg-white/[0.045] px-4 text-[11px] font-bold text-slate-200 hover:border-slate-300/25 hover:bg-white/[0.08] hover:text-white"
              >
                Reset Week
              </Button>
            </div>
          </div>

          <div className="pt-4">
            <div className="grid grid-cols-7 items-end gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const load = getSessionLoadPoints(weeklySchedule[day]);
                const duration = getSessionDuration(weeklySchedule[day]);
                const maxPossibleLoad = 60;
                const heightPercent = Math.min(100, Math.max(8, (load / maxPossibleLoad) * 100));
                let barBg = 'bg-gradient-to-t from-emerald-600 to-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.34)]';
                let loadText = 'text-emerald-200 group-hover:text-emerald-100';
                let trackRing = 'group-hover:border-emerald-300/40';
                if (load >= SESSION_LOAD_THRESHOLDS.high) {
                  barBg = 'bg-gradient-to-t from-red-700 via-red-500 to-rose-300 shadow-[0_0_16px_rgba(239,68,68,0.5)]';
                  loadText = 'text-red-200 group-hover:text-red-100';
                  trackRing = 'group-hover:border-red-300/50';
                } else if (load >= SESSION_LOAD_THRESHOLDS.high - 3) {
                  barBg = 'bg-gradient-to-t from-orange-700 via-orange-500 to-red-300 shadow-[0_0_15px_rgba(249,115,22,0.46)]';
                  loadText = 'text-orange-100 group-hover:text-orange-50';
                  trackRing = 'group-hover:border-orange-300/50';
                } else if (load >= SESSION_LOAD_THRESHOLDS.high - 7) {
                  barBg = 'bg-gradient-to-t from-orange-600 to-orange-300 shadow-[0_0_14px_rgba(251,146,60,0.4)]';
                  loadText = 'text-orange-200 group-hover:text-orange-100';
                  trackRing = 'group-hover:border-orange-300/40';
                } else if (load >= SESSION_LOAD_THRESHOLDS.optimal) {
                  barBg = 'bg-gradient-to-t from-amber-600 to-yellow-300 shadow-[0_0_14px_rgba(245,158,11,0.38)]';
                  loadText = 'text-amber-200 group-hover:text-amber-100';
                  trackRing = 'group-hover:border-amber-300/40';
                }
                
                return (
                  <div key={day} className="group flex min-w-0 flex-col items-center">
                    <span className={`mb-1.5 text-[10px] font-mono font-bold transition-colors ${loadText}`}>
                      {load} pts
                    </span>
                    <div className={`flex h-24 w-full max-w-11 items-end overflow-hidden rounded-t-lg border border-cyan-300/10 bg-[#07111f] transition-colors ${trackRing}`}>
                      <div 
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-md transition-all duration-300 ${barBg}`}
                      />
                    </div>
                    <div className="mt-2 min-w-0 text-center">
                      <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">{day.substring(0, 3)}</span>
                      <span className="mt-0.5 block truncate text-[9px] font-semibold text-slate-400">{duration} min</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Weekly Drop Grid */}
        <div className="rounded-2xl border border-cyan-300/10 bg-[#0b1726]/52 p-3 shadow-inner shadow-black/10">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          {DAYS_OF_WEEK.map((day) => {
            const scheduledList = getOrderedSessionDrills(weeklySchedule[day]);
            const sessionSummary = buildTrainingSessionSummary({
              day,
              dateStr: weekDaysMap[day].dateStr,
              drills: scheduledList,
              meta: selectedWeekSessionMeta[day]
            });
            const totalLoad = getSessionLoadPoints(scheduledList);
            const dateStr = weekDaysMap[day].dateStr;
            const dayMatches = games.filter(g => (g.type === 'League' || g.type === 'Cup' || g.type === 'Friendly') && g.date === dateStr);
            const isUsualTrainingDay = activeTrainingDaySet.has(day);
            const hasSession = scheduledList.length > 0;
            const previewDrills = sessionSummary.keyDrills.slice(0, 3);
            const hiddenDrillCount = Math.max(0, scheduledList.length - previewDrills.length);
            let loadLabel = "LIGHT";
            let loadDot = "bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.55)]";
            let cardSurface = "border-emerald-300/[0.18] bg-[radial-gradient(circle_at_12%_0%,rgba(52,211,153,0.18),transparent_38%),linear-gradient(135deg,rgba(6,78,59,0.78),rgba(7,17,31,0.94)_68%)] hover:border-emerald-200/[0.34] hover:shadow-[0_18px_45px_rgba(16,185,129,0.16)]";
            let datePill = "border-emerald-300/[0.18] bg-emerald-300/10 text-emerald-100";
            if (totalLoad >= SESSION_LOAD_THRESHOLDS.high) {
              loadLabel = "HIGH LOAD";
              loadDot = "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]";
              cardSurface = "border-red-300/[0.18] bg-[radial-gradient(circle_at_12%_0%,rgba(248,113,113,0.18),transparent_38%),linear-gradient(135deg,rgba(69,26,3,0.72),rgba(7,17,31,0.94)_68%)] hover:border-red-200/[0.34] hover:shadow-[0_18px_45px_rgba(248,113,113,0.14)]";
              datePill = "border-red-300/[0.18] bg-red-300/10 text-red-100";
            } else if (totalLoad >= SESSION_LOAD_THRESHOLDS.high - 3) {
              loadLabel = "PEAK";
              loadDot = "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]";
              cardSurface = "border-orange-300/[0.18] bg-[radial-gradient(circle_at_12%_0%,rgba(251,146,60,0.2),transparent_38%),linear-gradient(135deg,rgba(67,36,12,0.76),rgba(7,17,31,0.94)_68%)] hover:border-orange-200/[0.34] hover:shadow-[0_18px_45px_rgba(251,146,60,0.15)]";
              datePill = "border-orange-300/20 bg-orange-300/10 text-orange-100";
            } else if (totalLoad >= SESSION_LOAD_THRESHOLDS.high - 7) {
              loadLabel = "HEAVY";
              loadDot = "bg-orange-300 shadow-[0_0_8px_rgba(251,146,60,0.55)]";
              cardSurface = "border-orange-300/[0.18] bg-[radial-gradient(circle_at_12%_0%,rgba(251,191,36,0.18),transparent_38%),linear-gradient(135deg,rgba(69,42,12,0.72),rgba(7,17,31,0.94)_68%)] hover:border-orange-200/[0.34] hover:shadow-[0_18px_45px_rgba(251,191,36,0.14)]";
              datePill = "border-amber-300/20 bg-amber-300/10 text-amber-100";
            } else if (totalLoad >= SESSION_LOAD_THRESHOLDS.optimal) {
              loadLabel = "TRAINING";
              loadDot = "bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.55)]";
              cardSurface = "border-amber-300/[0.18] bg-[radial-gradient(circle_at_12%_0%,rgba(252,211,77,0.2),transparent_38%),linear-gradient(135deg,rgba(64,51,13,0.72),rgba(7,17,31,0.94)_68%)] hover:border-amber-200/[0.34] hover:shadow-[0_18px_45px_rgba(252,211,77,0.14)]";
              datePill = "border-amber-300/20 bg-amber-300/10 text-amber-100";
            }
            if (!hasSession) {
              cardSurface = "border-cyan-300/10 bg-[radial-gradient(circle_at_12%_0%,rgba(148,163,184,0.12),transparent_36%),linear-gradient(135deg,rgba(15,23,42,0.72),rgba(7,17,31,0.96)_70%)] hover:border-cyan-300/[0.22] hover:shadow-[0_18px_45px_rgba(34,211,238,0.1)]";
              datePill = "border-cyan-300/12 bg-cyan-300/[0.08] text-slate-300";
            }

            return (
              <div
                id={`planner-day-${day.toLowerCase()}`}
                key={day}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-cyan-300/40', 'bg-cyan-300/10');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-cyan-300/40', 'bg-cyan-300/10');
                }}
                onDrop={(e) => {
                  e.currentTarget.classList.remove('border-cyan-300/40', 'bg-cyan-300/10');
                  handleDropDrill(day, e);
                }}
                className={`group/day relative flex min-h-[226px] flex-col justify-between overflow-hidden rounded-xl border p-4 shadow-inner shadow-white/[0.025] transition-all duration-200 hover:-translate-y-0.5 ${cardSurface}`}
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.075] via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover/day:opacity-100" />
                <div className="relative space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="block truncate font-display text-sm font-black text-slate-50">{day}</span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${datePill}`}>
                        {weekDaysMap[day].monthDate}
                      </span>
                      {sessionSummary.status !== 'planned' && hasSession && (
                        <span className="text-[8px] font-bold uppercase tracking-wider text-indigo-200">
                          {sessionSummary.status === 'in_progress' ? 'Live' : 'Done'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-y border-white/[0.08] py-2">
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <span className={`size-1.5 rounded-full ${loadDot}`} />
                      {loadLabel}
                    </span>
                  </div>

                  {dayMatches.length > 0 && dayMatches.map(m => (
                    <div key={m.id} className="flex items-center gap-1 text-[9px] font-bold leading-none text-amber-100">
                      <Trophy size={9} />
                      <span className="truncate">{m.type === 'League' ? 'LEAGUE' : m.type === 'Cup' ? 'CUP' : 'FRIENDLY'} vs {m.opponent.substring(0, 12)}</span>
                    </div>
                  ))}

                  <div className="space-y-2">
                    {scheduledList.length === 0 ? (
                      <div className="flex min-h-[76px] select-none items-center rounded-lg border border-dashed border-cyan-300/[0.14] bg-black/10 px-3 text-[10px] text-slate-500 transition-colors group-hover/day:border-cyan-200/[0.24] group-hover/day:text-slate-400">
                        <span className="inline-flex items-center gap-1.5 leading-tight">
                          <Hand size={12} className={isUsualTrainingDay ? 'text-amber-200/70' : 'text-slate-500'} aria-hidden="true" />
                          Drop drills here
                        </span>
                      </div>
                    ) : (
                      <>
                      {previewDrills.map((item) => (
                        <div 
                          id={`scheduled-item-${item.id}`}
                          key={item.id}
                          className="flex items-start justify-between gap-2 rounded-lg border border-white/[0.055] bg-black/10 px-2 py-1.5 text-[10px] transition-colors group-hover/day:border-white/[0.09] group-hover/day:bg-white/[0.035]"
                        >
                          <div className="flex min-w-0 items-start gap-1.5 truncate pr-1">
                            <span className="mt-0.5 shrink-0 text-cyan-100/80">{getDrillIcon(item.drillId)}</span>
                            <span className="min-w-0 truncate">
                              <span className="block truncate font-semibold leading-tight text-slate-100">
                                {item.name.replace("Challenge", "").replace("Workout", "").replace("Walkthrough", "").replace("Sprints", "")}
                              </span>
                              <span className="block text-[8px] uppercase tracking-wide text-slate-400/80">
                                {getScheduledDrillBlock(item)}
                              </span>
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveDrill(day, item.id)}
                            className="size-4 rounded text-slate-500 hover:bg-rose-300/10 hover:text-rose-200"
                            title="Remove Drill"
                          >
                            <X size={10} aria-hidden="true" />
                          </Button>
                        </div>
                      ))}
                      {hiddenDrillCount > 0 && (
                        <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                          +{hiddenDrillCount} more in builder
                        </div>
                      )}
                      </>
                    )}
                  </div>
                </div>
                
                <div className="relative mt-3 space-y-2 border-t border-white/[0.08] pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setBuilderDay(day)}
                    className="h-7 w-full shrink-0 rounded-lg border border-white/[0.09] bg-white/[0.045] px-2 text-[9px] font-semibold text-slate-100 hover:border-emerald-300/28 hover:bg-emerald-300/12 hover:text-emerald-50"
                    aria-label={`Open ${day} training session`}
                    title={`Open ${day} session`}
                  >
                    <CalendarPlus size={12} aria-hidden="true" />
                    {hasSession ? 'Open' : 'Build'}
                  </Button>
                </div>
              </div>
            );
          })}
          </div>
        </div>

        {builderDay && (
          <TrainingSessionBuilder
            day={builderDay}
            drills={weeklySchedule[builderDay]}
            library={TRAINING_DRILLS}
            meta={selectedWeekSessionMeta[builderDay]}
            onChange={(drills) => setWeeklySchedule(current => ({ ...current, [builderDay]: drills }))}
            onMetaChange={(meta) => handleUpdateSessionMeta(builderDay, meta)}
            onClose={() => setBuilderDay(null)}
          />
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Playbook drills and player development */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Drills Catalog */}
          <div className="overflow-hidden rounded-2xl border border-cyan-300/10 bg-[radial-gradient(circle_at_16%_0%,rgba(45,212,191,0.16),transparent_34%),linear-gradient(135deg,rgba(8,47,73,0.72),rgba(7,17,31,0.94)_58%)] p-4 text-slate-100 shadow-lg shadow-black/20 backdrop-blur-xl sm:p-5">
            <div className="flex flex-col gap-3 border-b border-cyan-300/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-cyan-300/15 bg-cyan-300/12 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.12)]">
                  <Dumbbell size={16} />
                </div>
                <div>
                  <h3 className="font-display text-base font-black tracking-tight text-slate-50">Tactical & Technical Drill Selector</h3>
                  <p className="mt-0.5 text-[11px] text-slate-400">Find a drill, review its load, then add it to your training week.</p>
                </div>
              </div>

              <span aria-live="polite" className="w-fit rounded-full border border-cyan-300/10 bg-white/[0.05] px-3 py-1.5 text-[10px] font-bold text-slate-300">
                {filteredDrills.length} {filteredDrills.length === 1 ? 'drill' : 'drills'}
              </span>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-cyan-300/10 bg-[#07111f]/54 shadow-inner shadow-black/10 backdrop-blur-xl">
              <div className="bg-[linear-gradient(135deg,rgba(6,78,59,0.5),rgba(11,23,38,0.72)_54%,rgba(7,17,31,0.86))] p-4">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_9.5rem] xl:items-start">
                  <div className="flex min-w-0 gap-3">
                    <div className={`flex size-12 shrink-0 items-center justify-center rounded-full border shadow-sm shadow-black/10 ${TRAINING_DRILL_ICON_CLASS}`}>
                      {getDrillIcon(selectedScheduleDrill.id)}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-200">Selected drill</span>
                      <h4 className="mt-0.5 truncate font-display text-lg font-black tracking-tight text-slate-50">{selectedScheduleDrill.name}</h4>
                      <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-slate-300">{selectedScheduleDrill.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase shadow-sm shadow-black/10 ${selectedScheduleDrillCategoryClass}`}>
                          {selectedScheduleDrill.category}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase shadow-sm shadow-black/10 ${selectedScheduleDrillLoadStyle.badge}`}>
                          <span className={`size-1.5 rounded-full ${selectedScheduleDrillLoadStyle.dot}`} />
                          <Gauge size={10} aria-hidden="true" /> Intensity {selectedScheduleDrill.fatigueIncrease}/10
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-300/20 bg-indigo-300/10 px-2.5 py-1 text-[9px] font-black uppercase text-indigo-100 shadow-sm shadow-black/10">
                          <Target size={10} aria-hidden="true" /> {formatTrainingFocusList(selectedScheduleDrill.developmentFocus)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid w-full grid-cols-2 gap-2 xl:grid-cols-1">
                    <Select value={developmentDay} onValueChange={(value) => setDevelopmentDay(value as DayName)}>
                      <SelectTrigger aria-label="Day to add selected drill" className="h-9 w-full rounded-xl border-emerald-300/20 bg-[#0b1726]/85 px-3 text-xs font-bold text-slate-100 shadow-inner shadow-black/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={TRAINING_SELECT_CONTENT_CLASS}>
                        {DAYS_OF_WEEK.map(day => <SelectItem key={day} value={day} className={TRAINING_SELECT_ITEM_CLASS}>{day}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={() => addDrillsToDay([selectedScheduleDrill], developmentDay)}
                      className="h-9 w-full rounded-xl border border-emerald-300/20 bg-emerald-300/15 px-3 text-emerald-50 hover:bg-emerald-300/22"
                    >
                      <CalendarPlus size={14} /> Add to day
                    </Button>
                  </div>
                </div>
              </div>

              {selectedScheduleDrillInstructions ? (
                <div className="grid gap-0 border-t border-cyan-300/10 md:grid-cols-2 xl:grid-cols-[0.9fr_0.9fr_1.1fr_1.1fr]">
                  <div className="border-b border-cyan-300/10 p-4 md:border-r xl:border-b-0">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-emerald-300/25 bg-emerald-400/12 text-emerald-100">
                        <Dumbbell size={13} aria-hidden="true" />
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-100">Equipment</span>
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-300">{selectedScheduleDrillInstructions.equipment}</p>
                  </div>
                  <div className="border-b border-cyan-300/10 p-4 xl:border-b-0 xl:border-r">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-amber-300/25 bg-amber-300/12 text-amber-100">
                        <Timer size={13} aria-hidden="true" />
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-wider text-amber-100">Sets / reps</span>
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-300">{selectedScheduleDrillInstructions.setsReps}</p>
                  </div>

                  <div className="relative border-b border-cyan-300/10 p-4 md:border-b-0 md:border-r">
                    <span className="absolute right-4 top-4 text-xl font-black leading-none text-cyan-100/20">01</span>
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/12 text-cyan-100">
                        <Route size={13} aria-hidden="true" />
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-wider text-cyan-100">Setup</span>
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-200">{selectedScheduleDrillInstructions.setup}</p>
                  </div>
                  <div className="relative p-4">
                    <span className="absolute right-4 top-4 text-xl font-black leading-none text-indigo-100/20">02</span>
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-indigo-300/25 bg-indigo-300/12 text-indigo-100">
                        <CheckCircle size={13} aria-hidden="true" />
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-wider text-indigo-100">Execution</span>
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-200">{selectedScheduleDrillInstructions.execution}</p>
                  </div>
                </div>
              ) : (
                <p className="m-3 rounded-lg border border-cyan-300/10 bg-white/[0.04] p-3 text-[11px] leading-relaxed text-slate-300">
                  {selectedScheduleDrill.description}
                </p>
              )}
            </div>

            {/* Compact drill browser */}
            <div className="mt-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Browse library</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {activeDrillLibraryTab === 'recommended' && growthNeeds
                      ? 'Recommended drills match the selected player development need.'
                      : activeDrillLibraryTab === 'recommended'
                        ? 'Quick picks are shown until a player need is selected.'
                        : 'Select a drill row or drag it onto the calendar.'}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-end">
                  <div className="sm:w-56">
                    <label className="mb-1.5 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <Filter size={12} aria-hidden="true" /> Filter by focus
                    </label>
                    <Select value={selectedAttributeFilter} onValueChange={setSelectedAttributeFilter}>
                      <SelectTrigger aria-label="Filter drills by focus" className="h-9 rounded-xl border-cyan-300/10 bg-[#0b1726]/85 text-xs text-slate-100">
                        <SelectValue>{DRILL_FILTER_LABELS[selectedAttributeFilter] ?? 'All drills'}</SelectValue>
                      </SelectTrigger>
                      <SelectContent className={TRAINING_SELECT_CONTENT_CLASS}>
                        {DRILL_FILTER_GROUPS.map((group, groupIndex) => (
                          <React.Fragment key={group.label}>
                            {groupIndex > 0 && <SelectSeparator className={TRAINING_SELECT_SEPARATOR_CLASS} />}
                            <SelectGroup>
                              <SelectLabel className={TRAINING_SELECT_LABEL_CLASS}>{group.label}</SelectLabel>
                              {group.options.map(option => (
                                <SelectItem key={option.id} value={option.id} className={TRAINING_SELECT_ITEM_CLASS}>{option.label}</SelectItem>
                              ))}
                            </SelectGroup>
                          </React.Fragment>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Badge variant="outline" className="h-9 w-fit rounded-xl border-cyan-300/10 bg-white/[0.04] px-3 text-[10px] font-black text-slate-300 sm:mb-0">
                    {visibleLibraryDrills.length} shown
                  </Badge>
                </div>
              </div>

              <Tabs value={activeDrillLibraryTab} onValueChange={(value) => setActiveDrillLibraryTab(value as DrillLibraryTab)} className="mt-3">
                <TabsList aria-label="Drill library categories" className="w-full justify-start overflow-x-auto rounded-full border border-cyan-300/10 bg-[#0b1726]/72 p-1">
                  {DRILL_LIBRARY_TABS.map(tab => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="min-h-8 shrink-0 gap-1.5 rounded-full px-2.5 text-[10px] text-slate-400 data-[state=active]:bg-cyan-300/12 data-[state=active]:text-cyan-50"
                    >
                      {tab.label}
                      <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-slate-400">
                        {drillLibraryTabCounts[tab.id]}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {visibleLibraryDrills.length === 0 ? (
                <div className="mt-3 rounded-xl border border-dashed border-cyan-300/10 p-8 text-center text-slate-400">
                  <Filter size={24} className="mx-auto text-slate-500" />
                  <p className="mt-2 text-sm font-semibold">No drills in this view</p>
                  <p className="mt-1 text-xs text-slate-400">Try another tab or focus filter.</p>
                </div>
              ) : (
                <div className="mt-3 rounded-2xl border border-cyan-300/10 bg-[#0b1726]/38 p-2">
                  <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                    {visibleLibraryDrills.map((drill) => {
                      const isSelected = selectedDrillId === drill.id;
                      const isRecommended = growthNeeds?.isBeneficial(drill);
                      const categoryStyle = getTrainingCategoryStyle(drill.category);
                      const loadStyle = getTrainingLoadStyle(drill.fatigueIncrease);
                      return (
                        <div
                          key={drill.id}
                          draggable={true}
                          onDragStart={(event) => handleDragStart(event, drill.id)}
                          onClick={() => {
                            setSelectedDrillId(drill.id);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              setSelectedDrillId(drill.id);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-pressed={isSelected}
                          aria-label={`Select ${drill.name}`}
                          className={`group flex cursor-grab items-start gap-3 rounded-xl border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/25 active:cursor-grabbing ${
                            isSelected
                              ? 'border-cyan-300/35 bg-[linear-gradient(135deg,rgba(34,211,238,0.14),rgba(7,17,31,0.82))] shadow-[0_0_18px_rgba(34,211,238,0.12)]'
                              : isRecommended
                                ? 'border-emerald-300/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(7,17,31,0.72))] hover:-translate-y-0.5 hover:border-emerald-300/35 hover:bg-emerald-500/10'
                                : 'border-cyan-300/10 bg-white/[0.025] hover:-translate-y-0.5 hover:border-cyan-300/22 hover:bg-white/[0.055]'
                          }`}
                        >
                          <span className={`flex size-9 shrink-0 items-center justify-center rounded-full border ${isSelected ? 'border-cyan-300/30 bg-cyan-300/12 text-cyan-100' : TRAINING_DRILL_ICON_CLASS}`}>
                            {getDrillIcon(drill.id)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate text-xs font-black text-slate-100">{drill.name}</span>
                              {isRecommended && (
                                <span className="shrink-0 rounded-full border border-emerald-300/25 bg-emerald-500/12 px-1.5 py-0.5 text-[7px] font-black uppercase text-emerald-100">
                                  Recommended
                                </span>
                              )}
                            </span>
                            <span className="mt-1 line-clamp-1 text-[10px] leading-relaxed text-slate-400">{drill.description}</span>
                            <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[9px] font-bold text-slate-400">
                              <span className={`rounded-md border px-1.5 py-0.5 uppercase ${categoryStyle}`}>{drill.category}</span>
                              <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 ${loadStyle.badge}`}>
                                <span className={`size-1 rounded-full ${loadStyle.dot}`} />Intensity {drill.fatigueIncrease}/10
                              </span>
                              <span className="hidden sm:inline">Focus: {formatTrainingFocusList(drill.developmentFocus)}</span>
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Player development and workload tools */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-cyan-300/10 bg-[#07111f]/88 p-5 text-slate-100 shadow-lg shadow-black/20 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/10 bg-cyan-300/10 ${weekHealth.iconClass}`}>
                  <HeartPulse size={17} aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-display text-sm font-black text-slate-50">Week Health</h4>
                  <p className="mt-0.5 text-[10px] text-slate-400">Planned workload at a glance</p>
                </div>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${weekHealth.badgeClass}`}>
                {weekHealth.label}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-cyan-300/10 bg-white/[0.04] p-3">
                <strong className="block text-lg font-black text-slate-50">{weeklyLoad}</strong>
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Planned load points</span>
              </div>
              <div className="rounded-xl border border-cyan-300/10 bg-white/[0.04] p-3">
                <strong className="block text-lg font-black text-slate-50">
                  {overloadedDays.length}
                </strong>
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Overloaded days</span>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-cyan-300/10 bg-white/[0.04] p-3">
              <ShieldCheck size={15} className={`mt-0.5 shrink-0 ${weekHealth.iconClass}`} aria-hidden="true" />
              <p className="text-[10px] leading-relaxed text-slate-300" aria-live="polite">
                {overloadedDays.length === 0
                  ? 'No days are overloaded. The planned load is spread across the week.'
                  : `${overloadedDayNames} ${overloadedDays.length === 1 ? 'is' : 'are'} overloaded.`}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleWeekHealthAction}
              className={`mt-3 h-9 w-full rounded-xl text-[10px] font-black ${weekHealth.actionClass}`}
            >
              {overloadedDays.length > 0
                ? `Reduce ${highestLoadDay.day}`
                : `Add recovery to ${lowestLoadDay.day}`}
            </Button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-cyan-300/10 bg-[#07111f]/88 text-slate-100 shadow-lg shadow-black/20 backdrop-blur-xl">
            <div className="border-b border-cyan-300/10 p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/10 bg-cyan-300/10 text-cyan-100">
                  <User size={17} aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-display text-sm font-black text-slate-50">Player Development Plan</h4>
                  <p className="mt-0.5 text-[10px] text-slate-400">Build a focused session in three steps</p>
                </div>
              </div>

              <label className="mt-4 block text-[9px] font-black uppercase tracking-wider text-slate-500">1. Choose player</label>
              <Select
                value={recommendPlayerId || 'none'}
                onValueChange={(value) => {
                  setRecommendPlayerId(value === 'none' ? '' : value);
                  setSelectedTrainingDrillIds([]);
                  setRecentEvidenceMessage('');
                }}
              >
                <SelectTrigger aria-label="Choose player for development plan" className="mt-1.5 h-10 rounded-lg border-cyan-300/10 bg-[#0b1726]/85 text-xs text-slate-100">
                  <SelectValue placeholder="Choose a squad member" />
                </SelectTrigger>
                <SelectContent className={TRAINING_SELECT_CONTENT_CLASS}>
                  <SelectItem value="none" className={TRAINING_SELECT_ITEM_CLASS}>Choose a squad member</SelectItem>
                  {players.map(player => (
                    <SelectItem key={player.id} value={player.id} className={TRAINING_SELECT_ITEM_CLASS}>{player.name} ({player.position})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {recommendedPlayer && growthNeeds ? (
              <div className="space-y-5 p-5">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={recommendedPlayer.photoUrl}
                      alt=""
                      className="size-12 rounded-xl border border-cyan-300/10 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {recommendedPlayer.number > 0 && (
                      <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-md border-2 border-[#07111f] bg-cyan-300/20 text-[9px] font-black text-cyan-50">
                        {recommendedPlayer.number}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="truncate text-sm font-black text-slate-50">{recommendedPlayer.name}</h5>
                    <p className="mt-0.5 text-[10px] font-bold text-cyan-200">{recommendedPlayer.position}</p>
                  </div>
                  <div className="text-right">
                    <strong className="block text-xl font-black text-slate-50">{calculateOVR(recommendedPlayer.baseAttributes, recommendedPlayer.positionAttributes)}</strong>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Overall</span>
                  </div>
                </div>

                <div className="rounded-xl border border-indigo-300/20 bg-indigo-300/10 p-3 shadow-sm shadow-indigo-950/10">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-300">
                    {ratingConfidence.label}
                  </span>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{ratingConfidence.description}</p>
                </div>

                <div className="rounded-xl border border-orange-300/25 bg-orange-400/10 p-3 shadow-sm shadow-orange-950/10">
                  <div className="flex items-start gap-2.5">
                    <Target size={16} className="mt-0.5 shrink-0 text-orange-200" aria-hidden="true" />
                    <div className="min-w-0">
                      <span className="text-[9px] font-black uppercase tracking-wider text-orange-100">Development priority</span>
                      <p className="mt-0.5 text-xs font-black capitalize text-slate-50">
                        {growthNeeds.lowestAttr === 'physicalness' ? 'Conditioning' : growthNeeds.lowestAttr} · {growthNeeds.lowestVal}/99
                      </p>
                      <p className="mt-1 text-[10px] leading-relaxed text-slate-400">Recommended drills appear first for faster session building.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">2. Choose drills</span>
                      <p className="mt-0.5 text-[10px] text-slate-500">Select one or more.</p>
                    </div>
                    <Select value={developmentFocus} onValueChange={(value) => setDevelopmentFocus(value as typeof developmentFocus)}>
                      <SelectTrigger aria-label="Filter player development drills" className="h-8 w-32 rounded-lg border-cyan-300/10 bg-[#0b1726]/85 text-[10px] text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={TRAINING_SELECT_CONTENT_CLASS}>
                        <SelectItem value="all" className={TRAINING_SELECT_ITEM_CLASS}>All drills</SelectItem>
                        <SelectItem value="technical" className={TRAINING_SELECT_ITEM_CLASS}>Technical</SelectItem>
                        <SelectItem value="tactical" className={TRAINING_SELECT_ITEM_CLASS}>Tactical</SelectItem>
                        <SelectItem value="conditioning" className={TRAINING_SELECT_ITEM_CLASS}>Conditioning</SelectItem>
                        <SelectItem value="recovery" className={TRAINING_SELECT_ITEM_CLASS}>Recovery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                    {orderedDevelopmentDrills.map(drill => {
                      const isChosen = selectedTrainingDrillIds.includes(drill.id);
                      const supportsGap = drill.targetAttributes.includes(growthNeeds.lowestAttr);
                      const categoryStyle = getTrainingCategoryStyle(drill.category);
                      const loadStyle = getTrainingLoadStyle(drill.fatigueIncrease);
                      return (
                        <button
                          key={drill.id}
                          type="button"
                          onClick={() => toggleTrainingDrill(drill.id)}
                          aria-pressed={isChosen}
                          className={`flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/25 ${
                            isChosen
                              ? 'border-cyan-300/35 bg-cyan-300/10 shadow-[0_0_16px_rgba(34,211,238,0.12)]'
                              : supportsGap
                                ? 'border-emerald-300/20 bg-emerald-500/[0.045] hover:border-emerald-300/35 hover:bg-emerald-500/10'
                                : 'border-cyan-300/10 bg-white/[0.035] hover:border-cyan-300/22 hover:bg-white/[0.055]'
                          }`}
                        >
                          <span className={`flex size-5 shrink-0 items-center justify-center rounded-md border ${
                            isChosen ? 'border-cyan-300/40 bg-cyan-300/20 text-cyan-50' : 'border-cyan-300/15 bg-white/[0.04] text-transparent'
                          }`}>
                            <CheckCircle size={12} aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate text-[11px] font-bold text-slate-100">{drill.name}</span>
                              {supportsGap && (
                                <span className="shrink-0 rounded-full border border-emerald-300/25 bg-emerald-500/12 px-1.5 py-0.5 text-[7px] font-black uppercase text-emerald-100">Recommended</span>
                              )}
                            </span>
                            <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[8px] font-bold">
                              <span className={`rounded-md border px-1.5 py-0.5 uppercase ${categoryStyle}`}>{drill.category}</span>
                              <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 ${loadStyle.badge}`}>
                                <span className={`size-1 rounded-full ${loadStyle.dot}`} />Intensity {drill.fatigueIncrease}/10
                              </span>
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={`rounded-xl border p-3 shadow-sm shadow-black/10 ${
                  selectedTrainingDrills.length > 0
                    ? selectedTrainingLoadStyle.badge
                    : 'border-cyan-300/10 bg-white/[0.04]'
                }`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">3. Review session</span>
                      <p className="mt-0.5 text-xs font-black text-slate-50">
                        {selectedTrainingDrills.length} {selectedTrainingDrills.length === 1 ? 'drill' : 'drills'} · {selectedTrainingLoad} load points
                      </p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => {
                      setSelectedTrainingDrillIds([]);
                      setRecentEvidenceMessage('');
                    }} disabled={selectedTrainingDrillIds.length === 0} className="h-7 px-2 text-[9px] text-slate-400 hover:text-slate-100">
                      Clear
                    </Button>
                  </div>
                  {Object.keys(developmentEvidenceSignals).length > 0 ? (
                    <p className={`mt-2 text-[10px] font-bold ${selectedTrainingLoadStyle.text}`}>
                      Training focus: {developmentFocusLabel}
                    </p>
                  ) : (
                    <p className="mt-1 text-[9px] text-slate-400">Choose drills to see the training focus.</p>
                  )}
                  {selectedTrainingDrills.length > 0 && (
                    <p className="mt-2 text-[9px] font-bold text-slate-500">
                      {developmentEvidenceSummary.recommendationLabel}. FPRDS reassessment is required before any official rating changes.
                    </p>
                  )}
                  {recentEvidenceMessage && (
                    <p className="mt-2 rounded-lg border border-cyan-300/10 bg-cyan-300/10 px-2 py-1.5 text-[9px] font-bold leading-relaxed text-cyan-100" role="status">
                      {recentEvidenceMessage}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                  <Select value={developmentDay} onValueChange={(value) => setDevelopmentDay(value as DayName)}>
                    <SelectTrigger aria-label="Development plan day" className="h-9 rounded-lg border-cyan-300/10 bg-[#0b1726]/85 text-[11px] text-slate-100"><SelectValue /></SelectTrigger>
                    <SelectContent className={TRAINING_SELECT_CONTENT_CLASS}>{DAYS_OF_WEEK.map(day => <SelectItem key={day} value={day} className={TRAINING_SELECT_ITEM_CLASS}>{day}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button type="button" variant="outline" onClick={() => addDrillsToDay(selectedTrainingDrills, developmentDay, recommendedPlayer.name)} disabled={selectedTrainingDrills.length === 0} className="h-9 border-cyan-300/10 bg-white/[0.04] px-3 text-[10px] text-slate-200 hover:bg-cyan-300/10 hover:text-cyan-50">
                    <CalendarPlus size={13} /> Schedule
                  </Button>
                </div>
                <Button type="button" onClick={handleCompleteDevelopmentSession} disabled={selectedTrainingDrills.length === 0} className="h-10 w-full border border-cyan-300/15 bg-cyan-300/12 text-[11px] text-cyan-50 hover:bg-cyan-300/18">
                  <CheckCircle size={14} /> Log evidence and recommend reassessment
                </Button>
              </div>
            ) : (
              <div className="p-5">
                <div className="rounded-xl border border-dashed border-cyan-300/10 bg-white/[0.035] p-6 text-center">
                  <User size={22} className="mx-auto text-slate-500" aria-hidden="true" />
                  <p className="mt-2 text-xs font-bold text-slate-200">Choose a player to get started</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-400">We’ll identify a development priority and recommend suitable drills.</p>
                </div>
              </div>
            )}
          </div>

          {false && (
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-300 flex items-center justify-center border border-blue-400/20">
                <User size={17} />
              </div>
              <div>
                <h4 className="font-display font-black text-sm text-white">Player Development Plan</h4>
                <p className="text-[10px] text-slate-400">Review the profile, then build a custom training session</p>
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Select player</label>
              <Select
                value={recommendPlayerId || 'none'}
                onValueChange={(value) => {
                  setRecommendPlayerId(value === 'none' ? '' : value);
                  setSelectedTrainingDrillIds([]);
                }}
              >
                <SelectTrigger className="h-10 rounded-xl border-slate-700 bg-slate-950 text-xs text-slate-200 focus:ring-blue-400/30">
                  <SelectValue placeholder="Choose a squad member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Choose a squad member</SelectItem>
                  {players.map(player => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name} ({player.position})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {recommendedPlayer && growthNeeds ? (
              <>
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={recommendedPlayer.photoUrl}
                        alt={recommendedPlayer.name}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-700"
                        referrerPolicy="no-referrer"
                      />
                      {recommendedPlayer.number > 0 && (
                        <span className="absolute -bottom-1 -right-1 min-w-5 h-5 px-1 rounded-md bg-blue-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-slate-950">
                          {recommendedPlayer.number}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h5 className="font-display font-black text-sm text-white truncate">{recommendedPlayer.name}</h5>
                          <p className="text-[10px] text-blue-300 font-bold mt-0.5">{recommendedPlayer.position}</p>
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-full border ${
                          recommendedPlayer.registrationStatus === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : recommendedPlayer.registrationStatus === 'Pending'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                        }`}>
                          {recommendedPlayer.registrationStatus}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500 leading-relaxed mt-2 line-clamp-2">
                        {recommendedPlayer.bio || 'No player profile summary has been added yet.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Overall rating</span>
                    <strong className="block text-2xl font-display text-white mt-0.5">{calculateOVR(recommendedPlayer.baseAttributes, recommendedPlayer.positionAttributes)}</strong>
                  </div>
                  <div className="bg-rose-950/30 border border-rose-900/40 rounded-xl p-3">
                    <span className="text-[9px] text-rose-300 uppercase font-bold">Development gap</span>
                    <strong className="block text-sm capitalize text-white mt-1">{growthNeeds.lowestAttr}</strong>
                    <span className="text-[10px] text-rose-300">{growthNeeds.lowestVal}/99</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Appearances', value: recommendedPlayer.gamesPlayed },
                    { label: 'Goals', value: recommendedPlayer.points },
                    { label: 'Assists', value: recommendedPlayer.assists },
                    { label: 'Contributions', value: playerGoalContributions },
                    { label: 'Minutes', value: recommendedPlayer.minutesPlayed },
                    { label: 'MVP awards', value: recommendedPlayer.mvpAwards }
                  ].map(item => (
                    <div key={item.label} className="bg-slate-950/50 border border-slate-800 rounded-xl p-2.5 text-center">
                      <strong className="block text-sm text-white font-display">{item.value}</strong>
                      <span className="text-[7px] text-slate-500 uppercase font-bold tracking-wide">{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2.5 bg-slate-950/50 border border-slate-800 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Attribute profile</span>
                    <span className="text-[8px] text-slate-600">Rating / 99</span>
                  </div>
                  {rankedPlayerAttributes.map(([attribute, value]) => {
                    const isDevelopmentGap = attribute === growthNeeds.lowestAttr;
                    const isStrength = strongestPlayerAttributes.some(([key]) => key === attribute);
                    return (
                      <div key={attribute} className="space-y-1">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className={`capitalize font-bold ${
                            isDevelopmentGap ? 'text-rose-300' : isStrength ? 'text-emerald-300' : 'text-slate-400'
                          }`}>
                            {attribute === 'physicalness' ? 'Conditioning' : attribute}
                          </span>
                          <span className="font-mono font-black text-slate-300">{value}</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${value}%` }}
                            className={`h-full rounded-full ${
                              isDevelopmentGap
                                ? 'bg-rose-500'
                                : isStrength
                                  ? 'bg-emerald-400'
                                  : 'bg-blue-500'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3">
                    <span className="text-[8px] uppercase font-black tracking-wider text-emerald-400">Top strengths</span>
                    <div className="mt-1.5 space-y-1">
                      {strongestPlayerAttributes.map(([attribute, value]) => (
                        <div key={attribute} className="flex justify-between text-[9px]">
                          <span className="capitalize text-slate-300">{attribute === 'physicalness' ? 'Conditioning' : attribute}</span>
                          <strong className="text-emerald-300">{value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-3">
                    <span className="text-[8px] uppercase font-black tracking-wider text-blue-400">Role priorities</span>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {growthNeeds.positionKeys.map(attribute => (
                        <span key={attribute} className="capitalize text-[8px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-1.5 py-0.5 rounded">
                          {attribute === 'physicalness' ? 'Conditioning' : attribute}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Build training session</span>
                      <p className="text-[9px] text-slate-500 mt-1">Choose any combination of drills for this player.</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'technical', label: 'Technical' },
                        { id: 'tactical', label: 'Tactical' },
                        { id: 'conditioning', label: 'Conditioning' },
                        { id: 'recovery', label: 'Recovery' }
                      ].map(focus => (
                        <Button
                          key={focus.id}
                          type="button"
                          variant={developmentFocus === focus.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setDevelopmentFocus(focus.id as typeof developmentFocus)}
                          className={`h-7 px-2 py-1 text-[9px] ${
                            developmentFocus === focus.id
                              ? 'bg-blue-500 border-blue-400 text-white'
                              : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          {focus.label}
                        </Button>
                      ))}
                    </div>
                    <div className="max-h-64 overflow-y-auto pr-1 space-y-1.5">
                      {developmentDrills.map(drill => {
                        const isChosen = selectedTrainingDrillIds.includes(drill.id);
                        const supportsGap = drill.targetAttributes.includes(growthNeeds.lowestAttr);
                        return (
                          <Button
                            key={drill.id}
                            type="button"
                            variant="outline"
                            onClick={() => toggleTrainingDrill(drill.id)}
                            aria-pressed={isChosen}
                            className={`h-auto w-full justify-start whitespace-normal rounded-xl p-2.5 text-left ${
                              isChosen
                                ? 'bg-blue-500/15 border-blue-400/60'
                                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 ${
                              isChosen ? 'bg-blue-500 border-blue-400 text-white' : 'border-slate-600 text-transparent'
                            }`}>
                              <CheckCircle size={12} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-white font-bold truncate">{drill.name}</span>
                                {supportsGap && (
                                  <Badge className="shrink-0 border-rose-500/20 bg-rose-500/10 px-1 py-0.5 text-[7px] text-rose-300">
                                    Develops gap
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[8px] text-slate-500 mt-0.5">
                                {drill.category} · Load {drill.fatigueIncrease}% · Focus: {formatTrainingFocusList(drill.developmentFocus)}
                              </div>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Session summary</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTrainingDrillIds([])}
                          disabled={selectedTrainingDrillIds.length === 0}
                          className="h-6 px-2 text-[8px] text-slate-500 hover:text-white"
                        >
                          Clear
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-900 rounded-lg p-2">
                          <strong className="block text-sm text-white">{selectedTrainingDrills.length}</strong>
                          <span className="text-[8px] text-slate-500 uppercase">Selected drills</span>
                        </div>
                        <div className="bg-slate-900 rounded-lg p-2">
                          <strong className={`block text-sm ${selectedTrainingLoad >= 13 ? 'text-rose-300' : selectedTrainingLoad >= 6 ? 'text-amber-300' : 'text-emerald-300'}`}>
                            {selectedTrainingLoad}%
                          </strong>
                          <span className="text-[8px] text-slate-500 uppercase">Session load</span>
                        </div>
                      </div>
                      {Object.keys(developmentEvidenceSignals).length > 0 ? (
                        <p className="text-[9px] font-bold text-emerald-300">
                          Training focus: {developmentFocusLabel}
                        </p>
                      ) : (
                        <p className="text-[9px] text-slate-600">Select at least one drill to create a session.</p>
                      )}
                    </div>
                  </div>
                  {false && selectedTrainingDrills.map((drill, index) => (
                    <div key={drill.id} className="flex items-center gap-2.5 bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
                      <span className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-300 flex items-center justify-center text-[9px] font-black">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] text-white font-bold truncate">{drill.name}</div>
                        <div className="text-[9px] text-slate-500">{drill.category} · Load {drill.fatigueIncrease}%</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <Select
                    value={developmentDay}
                    onValueChange={(value) => setDevelopmentDay(value as DayName)}
                  >
                    <SelectTrigger
                      aria-label="Development plan day"
                      className="h-9 rounded-xl border-slate-700 bg-slate-950 px-2.5 py-2 text-[11px] text-slate-200"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map(day => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={() => addDrillsToDay(selectedTrainingDrills, developmentDay, recommendedPlayer?.name)}
                    disabled={selectedTrainingDrills.length === 0}
                    className="h-9 rounded-xl bg-blue-500 px-3 py-2 text-[10px] font-black text-white hover:bg-blue-400"
                  >
                    <CalendarPlus size={13} /> Schedule
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCompleteDevelopmentSession}
                  disabled={selectedTrainingDrills.length === 0}
                  className="w-full rounded-xl border-emerald-500/30 bg-emerald-500/10 py-2 text-[10px] font-black text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200"
                >
                  <CheckCircle size={13} /> Log evidence and recommend reassessment
                </Button>
              </>
            ) : (
              <div className="border border-dashed border-slate-700 rounded-xl p-5 text-center">
                <User size={20} className="mx-auto text-slate-600 mb-2" />
                <p className="text-[10px] text-slate-400 leading-relaxed">Choose a player to identify their weakest attribute and build a practical three-drill session.</p>
              </div>
            )}
          </div>
          )}
        </div>

      </div>

    </div>
  );
}

