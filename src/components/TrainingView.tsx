import React, { useState, useEffect, useMemo } from 'react';
import { z } from 'zod';
import { Player, Game } from '../types';
import { weeklyScheduleSchema } from '../persistence/schemas';
import { readJsonStorage, STORAGE_KEYS, writeJsonStorage } from '../persistence/storage';
import {
  DAYS_OF_WEEK,
  getWeekDaysMap,
  synchronizeTrainingCalendar,
  type DayName,
  type ScheduledDrill,
  type WeeklySchedule
} from '../training/synchronization';
import { DRILL_INSTRUCTIONS, TRAINING_DRILLS, type TrainingDrill } from '../training/drillLibrary';
import { TrainingDrillCard, getDrillIcon } from './TrainingDrillCard';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/src/components/ui/select';
import { 
  Dumbbell, Sparkles, RotateCcw, TrendingUp, Search, Filter,
  User, CheckCircle, CalendarPlus, HeartPulse, ShieldCheck, Target, Footprints,
  Shield, Timer, Gauge, ArrowUpRight, Crosshair, Waves, Goal, Hand, Route,
  ChevronLeft, ChevronRight, Trophy, X
} from 'lucide-react';

interface TrainingViewProps {
  players: Player[];
  onUpdatePlayer: (player: Player) => void;
  games: Game[];
  onUpdateGames: (games: Game[]) => void;
}

const DEFAULT_SCHEDULE: WeeklySchedule = {
  Monday: [
    { id: 'init-1', drillId: 'drill-gym', name: 'Iron Core Power Workout', fatigueIncrease: 7 },
    { id: 'init-2', drillId: 'drill-agility', name: 'Shuttle Run Sprints', fatigueIncrease: 6 }
  ],
  Tuesday: [
    { id: 'init-3', drillId: 'drill-passing', name: 'Triangular Direct Passing', fatigueIncrease: 3 }
  ],
  Wednesday: [],
  Thursday: [
    { id: 'init-4', drillId: 'drill-defending', name: 'Defensive Low Block Walkthrough', fatigueIncrease: 5 }
  ],
  Friday: [
    { id: 'init-5', drillId: 'drill-shooting', name: 'Finesse Target Shooting', fatigueIncrease: 4 }
  ],
  Saturday: [],
  Sunday: []
};

const weeklyScheduleWeeksSchema = z.record(z.string(), weeklyScheduleSchema);

const createEmptyWeeklySchedule = (): WeeklySchedule => ({
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: [],
  Sunday: []
});

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
  if (scheduleWeeks[weekKey]) return scheduleWeeks[weekKey];
  if (weekKey === currentWeekKey) {
    return readJsonStorage(STORAGE_KEYS.weeklySchedule, weeklyScheduleSchema, DEFAULT_SCHEDULE, 'Weekly training');
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

export default function TrainingView({ players, onUpdatePlayer, games, onUpdateGames }: TrainingViewProps) {
  const [selectedDrillId, setSelectedDrillId] = useState<string>(TRAINING_DRILLS[0].id);
  const [expandedDrills, setExpandedDrills] = useState<Set<string>>(new Set());
  const currentWeekKey = useMemo(() => toDateKey(getWeekStartDate(new Date())), []);
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => getWeekStartDate(new Date()));
  const selectedWeekKey = useMemo(() => toDateKey(selectedWeekStart), [selectedWeekStart]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(() => {
    return readScheduleForWeek(currentWeekKey, currentWeekKey);
  });

  const weekDaysMap = useMemo(() => getWeekDaysMap(selectedWeekStart), [selectedWeekStart]);
  const weekRangeLabel = useMemo(() => getWeekRangeLabel(selectedWeekStart), [selectedWeekStart]);
  const isCurrentWeek = selectedWeekKey === currentWeekKey;

  useEffect(() => {
    // Archive current week as history before overwriting
    const current = readJsonStorage(STORAGE_KEYS.weeklySchedule, weeklyScheduleSchema, weeklySchedule, 'Weekly training');
    writeJsonStorage(STORAGE_KEYS.weeklyScheduleHistory, current);
    writeScheduleForWeek(selectedWeekKey, weeklySchedule);
    writeJsonStorage(STORAGE_KEYS.weeklySchedule, weeklySchedule);
  }, [selectedWeekKey, weeklySchedule]);

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
    setSelectedWeekStart(nextWeekStart);
    setWeeklySchedule(readScheduleForWeek(nextWeekKey, currentWeekKey));
  };

  const handleReturnToCurrentWeek = () => {
    writeScheduleForWeek(selectedWeekKey, weeklySchedule);
    const currentStart = getWeekStartDate(new Date());
    setSelectedWeekStart(currentStart);
    setWeeklySchedule(readScheduleForWeek(currentWeekKey, currentWeekKey));
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAttributeFilter, setSelectedAttributeFilter] = useState('all');
  const [recommendPlayerId, setRecommendPlayerId] = useState('');
  const [developmentDay, setDevelopmentDay] = useState<DayName>('Wednesday');
  const [developmentFocus, setDevelopmentFocus] = useState<'all' | 'technical' | 'tactical' | 'conditioning' | 'recovery'>('all');
  const [selectedTrainingDrillIds, setSelectedTrainingDrillIds] = useState<string[]>([]);

  const handleDragStart = (e: React.DragEvent, drillId: string) => {
    e.dataTransfer.setData('text/plain', drillId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDropDrill = (day: DayName, e: React.DragEvent) => {
    e.preventDefault();
    const drillId = e.dataTransfer.getData('text/plain');
    const drill = TRAINING_DRILLS.find(d => d.id === drillId);
    if (drill) {
      const newScheduled: ScheduledDrill = {
        id: `scheduled-${day}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        drillId: drill.id,
        name: drill.name,
        icon: drill.icon,
        fatigueIncrease: drill.fatigueIncrease
      };
      setWeeklySchedule(prev => ({
        ...prev,
        [day]: [...prev[day], newScheduled]
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

  const handleLoadTemplate = (mode: 'heavy' | 'taper' | 'tactical' | 'prematch' | 'recovery' | 'forward-focus' | 'midfield-focus' | 'defender-focus' | 'last-week') => {
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
      setWeeklySchedule(restored);
      return;
    }

    const fillDays = (template: Partial<Record<DayName, Array<{ id: string; drillId: string; name: string; fatigueIncrease: number }>>>) => {
      const base: WeeklySchedule = { Monday:[], Tuesday:[], Wednesday:[], Thursday:[], Friday:[], Saturday:[], Sunday:[] };
      DAYS_OF_WEEK.forEach(day => { if (template[day]) base[day] = template[day]; });
      return base;
    };

    if (mode === 'heavy') {
      setWeeklySchedule(fillDays({
        Monday: [
          { id: 'h-1', drillId: 'drill-gym', name: 'Iron Core Power Workout', fatigueIncrease: 7 },
          { id: 'h-2', drillId: 'drill-agility', name: 'Shuttle Run Sprints', fatigueIncrease: 6 }
        ],
        Tuesday: [
          { id: 'h-3', drillId: 'drill-dribbling', name: 'Dribble Maze Challenge', fatigueIncrease: 3 },
          { id: 'h-4', drillId: 'drill-gym', name: 'Iron Core Power Workout', fatigueIncrease: 7 }
        ],
        Wednesday: [
          { id: 'h-5', drillId: 'drill-passing', name: 'Triangular Direct Passing', fatigueIncrease: 3 }
        ],
        Thursday: [
          { id: 'h-6', drillId: 'drill-defending', name: 'Defensive Low Block Walkthrough', fatigueIncrease: 5 },
          { id: 'h-7', drillId: 'drill-agility', name: 'Shuttle Run Sprints', fatigueIncrease: 6 }
        ],
        Friday: [
          { id: 'h-8', drillId: 'drill-shooting', name: 'Finesse Target Shooting', fatigueIncrease: 4 }
        ]
      }));
    } else if (mode === 'taper') {
      setWeeklySchedule(fillDays({
        Monday: [
          { id: 't-1', drillId: 'drill-passing', name: 'Triangular Direct Passing', fatigueIncrease: 3 }
        ],
        Tuesday: [
          { id: 't-2', drillId: 'drill-shooting', name: 'Finesse Target Shooting', fatigueIncrease: 4 }
        ],
        Wednesday: [],
        Thursday: [
          { id: 't-3', drillId: 'drill-dribbling', name: 'Dribble Maze Challenge', fatigueIncrease: 3 }
        ],
        Friday: [
          { id: 't-4', drillId: 'drill-passing', name: 'Triangular Direct Passing', fatigueIncrease: 3 }
        ]
      }));
    } else if (mode === 'tactical') {
      setWeeklySchedule(fillDays({
        Monday: [
          { id: 'ac-1', drillId: 'drill-passing', name: 'Triangular Direct Passing', fatigueIncrease: 3 }
        ],
        Tuesday: [
          { id: 'ac-2', drillId: 'drill-defending', name: 'Defensive Low Block Walkthrough', fatigueIncrease: 5 }
        ],
        Wednesday: [],
        Thursday: [
          { id: 'ac-3', drillId: 'drill-defending', name: 'Defensive Low Block Walkthrough', fatigueIncrease: 5 },
          { id: 'ac-4', drillId: 'drill-passing', name: 'Triangular Direct Passing', fatigueIncrease: 3 }
        ],
        Friday: [
          { id: 'ac-5', drillId: 'drill-shooting', name: 'Finesse Target Shooting', fatigueIncrease: 4 }
        ]
      }));
    } else if (mode === 'prematch') {
      // Light day before match, match day empty, recovery after
      setWeeklySchedule(fillDays({
        Monday: [
          { id: 'pm-1', drillId: 'drill-passing', name: 'Triangular Direct Passing', fatigueIncrease: 3 }
        ],
        Tuesday: [
          { id: 'pm-2', drillId: 'drill-defending', name: 'Defensive Low Block Walkthrough', fatigueIncrease: 5 }
        ],
        Wednesday: [],
        Thursday: [
          { id: 'pm-3', drillId: 'drill-pass-triangle', name: 'Triangle Passing Warm-Up', fatigueIncrease: 2 },
          { id: 'pm-4', drillId: 'drill-mobility', name: 'Mobility & Recovery Flow', fatigueIncrease: 1 }
        ],
        Friday: [
          { id: 'pm-5', drillId: 'drill-shooting', name: 'Finesse Target Shooting', fatigueIncrease: 4 }
        ],
        Saturday: [],  // Match day — kept clear
        Sunday: []      // Rest day
      }));
    } else if (mode === 'recovery') {
      // Low load, mobility and technique focus
      setWeeklySchedule(fillDays({
        Monday: [
          { id: 'rc-1', drillId: 'drill-mobility', name: 'Mobility & Recovery Flow', fatigueIncrease: 1 }
        ],
        Tuesday: [
          { id: 'rc-2', drillId: 'drill-pass-triangle', name: 'Triangle Passing Warm-Up', fatigueIncrease: 2 }
        ],
        Wednesday: [],
        Thursday: [
          { id: 'rc-3', drillId: 'drill-core-stability', name: 'Core Stability Circuit', fatigueIncrease: 4 }
        ],
        Friday: [
          { id: 'rc-4', drillId: 'drill-mobility', name: 'Mobility & Recovery Flow', fatigueIncrease: 1 }
        ],
        Saturday: [],
        Sunday: []
      }));
    } else if (mode === 'forward-focus') {
      setWeeklySchedule(fillDays({
        Monday: [
          { id: 'ff-1', drillId: 'drill-fwd-finishing', name: 'Clinical Finishing Under Pressure', fatigueIncrease: 5 }
        ],
        Tuesday: [
          { id: 'ff-2', drillId: 'drill-fwd-positioning', name: 'Off-Ball Striker Movement', fatigueIncrease: 4 }
        ],
        Wednesday: [],
        Thursday: [
          { id: 'ff-3', drillId: 'drill-fwd-cross-finish', name: 'Crossing & Volley Finish Drill', fatigueIncrease: 5 }
        ],
        Friday: [
          { id: 'ff-4', drillId: 'drill-fwd-wall-pass', name: 'Wall Pass Give & Go Finish', fatigueIncrease: 4 },
          { id: 'ff-5', drillId: 'drill-shooting', name: 'Finesse Target Shooting', fatigueIncrease: 4 }
        ],
        Saturday: [],
        Sunday: []
      }));
    } else if (mode === 'midfield-focus') {
      setWeeklySchedule(fillDays({
        Monday: [
          { id: 'mf-1', drillId: 'drill-mid-possession', name: 'Rondo Possession Circuit', fatigueIncrease: 3 }
        ],
        Tuesday: [
          { id: 'mf-2', drillId: 'drill-mid-transition', name: 'Quick Transition Build-Up', fatigueIncrease: 5 }
        ],
        Wednesday: [],
        Thursday: [
          { id: 'mf-3', drillId: 'drill-mid-through-ball', name: 'Through Ball Lane Calibration', fatigueIncrease: 3 },
          { id: 'mf-4', drillId: 'drill-pass-wall', name: 'Wall Passing One-Twos', fatigueIncrease: 3 }
        ],
        Friday: [
          { id: 'mf-5', drillId: 'drill-mid-switch-play', name: 'Switching Play Long Diagonals', fatigueIncrease: 3 }
        ],
        Saturday: [],
        Sunday: []
      }));
    } else if (mode === 'defender-focus') {
      setWeeklySchedule(fillDays({
        Monday: [
          { id: 'df-1', drillId: 'drill-def-1v1', name: '1v1 Defensive Duels', fatigueIncrease: 5 }
        ],
        Tuesday: [
          { id: 'df-2', drillId: 'drill-def-line-shift', name: 'Back Four Line Shift Drill', fatigueIncrease: 4 }
        ],
        Wednesday: [],
        Thursday: [
          { id: 'df-3', drillId: 'drill-def-aerial', name: 'Aerial Clearance Domination', fatigueIncrease: 5 }
        ],
        Friday: [
          { id: 'df-4', drillId: 'drill-def-overlap', name: 'Fullback Overlap & Recovery', fatigueIncrease: 6 }
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

  const selectedTrainingDrills = TRAINING_DRILLS.filter(drill => selectedTrainingDrillIds.includes(drill.id));
  const selectedTrainingLoad = selectedTrainingDrills.reduce((sum, drill) => sum + drill.fatigueIncrease, 0);
  const projectedTrainingGains = selectedTrainingDrills.reduce<Partial<Record<keyof Player['attributes'], number>>>(
    (totals, drill) => {
      Object.entries(drill.statsBumps).forEach(([attribute, amount]) => {
        const key = attribute as keyof Player['attributes'];
        totals[key] = (totals[key] || 0) + amount;
      });
      return totals;
    },
    {}
  );

  const dailyLoads = DAYS_OF_WEEK.map(day => ({
    day,
    load: weeklySchedule[day].reduce((sum, item) => sum + item.fatigueIncrease, 0)
  }));
  const weeklyLoad = dailyLoads.reduce((sum, item) => sum + item.load, 0);
  const heavyDays = dailyLoads.filter(item => item.load >= 13).length;
  const recoveryDays = dailyLoads.filter(item => item.load <= 3).length;
  const workloadStatus = heavyDays >= 3 || weeklyLoad > 55
    ? { label: 'High risk', color: 'text-rose-300', note: 'Reduce one high-load day and add mobility work.' }
    : recoveryDays < 2
      ? { label: 'Needs recovery', color: 'text-amber-300', note: 'Keep at least two low-load days in the week.' }
      : { label: 'Balanced', color: 'text-emerald-300', note: 'Work and recovery are distributed well.' };

  const addDrillsToDay = (drills: readonly TrainingDrill[], day: DayName, playerName?: string) => {
    const scheduled = drills.map((drill, index) => ({
      id: `development-${day}-${Date.now()}-${index}`,
      drillId: drill.id,
      name: drill.name,
      icon: drill.icon,
      fatigueIncrease: drill.fatigueIncrease,
      playerName
    }));
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: [...prev[day], ...scheduled]
    }));
  };

  const handleCompleteDevelopmentSession = () => {
    if (!recommendedPlayer || selectedTrainingDrills.length === 0) return;
    const nextBaseAttrs = { ...(recommendedPlayer.baseAttributes || { pace: 50, stamina: 50, agility: 50, strength: 50, firstTouch: 50, shortPassing: 50 }) };
    const nextPosAttrs = { ...(recommendedPlayer.positionAttributes || {}) };

    const legacyToBase: Record<string, keyof Player['baseAttributes']> = {
      speed: 'pace',
      physicalness: 'strength',
      stamina: 'stamina',
      passing: 'shortPassing',
      dribbling: 'firstTouch'
    };

    selectedTrainingDrills.forEach(drill => {
      Object.entries(drill.statsBumps).forEach(([attribute, amount]) => {
        const baseKey = legacyToBase[attribute];
        if (baseKey) {
          nextBaseAttrs[baseKey] = Math.min(99, nextBaseAttrs[baseKey] + amount);
        } else {
          const posKey = attribute.charAt(0).toUpperCase() + attribute.slice(1);
          nextPosAttrs[posKey] = Math.min(99, (nextPosAttrs[posKey] || 50) + amount);
        }
      });
    });

    onUpdatePlayer({ ...recommendedPlayer, baseAttributes: nextBaseAttrs, positionAttributes: nextPosAttrs });
  };

  const toggleTrainingDrill = (drillId: string) => {
    setSelectedTrainingDrillIds(current =>
      current.includes(drillId)
        ? current.filter(id => id !== drillId)
        : [...current, drillId]
    );
  };

  // Filter Drills by text and category/focus filters
  const filteredDrills = TRAINING_DRILLS.filter(drill => {
    const query = searchQuery.toLowerCase();
    const matchesText = 
      drill.name.toLowerCase().includes(query) ||
      drill.category.toLowerCase().includes(query) ||
      drill.description.toLowerCase().includes(query) ||
      drill.targetAttributes.some(attr => attr.toLowerCase().includes(query));

    const matchesAttribute =
      selectedAttributeFilter === 'all' ||
      (selectedAttributeFilter === 'conditioning'
        ? drill.category.toLowerCase().includes('conditioning') || drill.category.toLowerCase().includes('recovery')
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

    return matchesText && matchesAttribute;
  });

  return (
    <div id="training-view-container" className="space-y-6">
      
      {/* Standalone Brand Header Section */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6.5 shadow-lg border border-indigo-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Dumbbell size={200} className="stroke-[3]" />
        </div>
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded tracking-widest">ATHLETIC LABS</span>
            <span className="text-indigo-200 text-xs font-mono">Performance Hub & Drills Engine</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-black tracking-tight">Interactive Training Grounds</h2>
          <p className="text-slate-300 text-xs md:text-sm max-w-3xl leading-relaxed">
            Maximize squad tactical capabilities and stamina ratios. Establish full team workouts, select specific training drills, and simulate direct stat boosts to improve your players' technical scores in coordination with state metrics.
          </p>
        </div>
      </div>

      {/* WEEKLY DRAG-AND-DROP TRAINING PLANNER */}
      <div id="weekly-training-planner-card" className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/60 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-display shadow-sm font-bold shadow-amber-500/10">
              📅
            </div>
            <div>
              <h3 className="font-display font-black text-slate-800 text-sm uppercase tracking-wider">Weekly Intensity & Strategy Planner</h3>
              <p className="text-slate-500 text-[11px]">Drag drills from the playbook index and drop onto calendar blocks to design and balance the squad's physical workload.</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-slate-700">
            <span className="text-slate-400 text-[10px] tracking-wider uppercase mr-1">Load Preset Mode:</span>
            <Button
              id="btn-pres-heavy"
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleLoadTemplate('heavy')} 
              className="h-7 border-rose-100 bg-rose-50 px-2.5 py-1.5 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
            >
              <Dumbbell size={11} /> Heavy Fitness
            </Button>
            <Button
              id="btn-pres-tactical"
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleLoadTemplate('tactical')} 
              className="h-7 border-indigo-100 bg-indigo-50 px-2.5 py-1.5 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800"
            >
              <Shield size={11} /> Tactical Focus
            </Button>
            <Button
              id="btn-pres-taper"
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleLoadTemplate('taper')} 
              className="h-7 border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
            >
              <Sparkles size={11} /> Match Taper
            </Button>
            <Button
              id="btn-pres-prematch"
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleLoadTemplate('prematch')} 
              className="h-7 border-amber-100 bg-amber-50 px-2.5 py-1.5 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
            >
              <Target size={11} /> Pre-Match Week
            </Button>
            <Button
              id="btn-pres-recovery"
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleLoadTemplate('recovery')} 
              className="h-7 border-teal-100 bg-teal-50 px-2.5 py-1.5 text-teal-700 hover:bg-teal-100 hover:text-teal-800"
            >
              <HeartPulse size={11} /> Recovery Week
            </Button>
            <Button
              id="btn-pres-forward"
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleLoadTemplate('forward-focus')} 
              className="h-7 border-red-100 bg-red-50 px-2.5 py-1.5 text-red-700 hover:bg-red-100 hover:text-red-800"
            >
              <Crosshair size={11} /> Forward Focus
            </Button>
            <Button
              id="btn-pres-midfield"
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleLoadTemplate('midfield-focus')} 
              className="h-7 border-sky-100 bg-sky-50 px-2.5 py-1.5 text-sky-700 hover:bg-sky-100 hover:text-sky-800"
            >
              <Route size={11} /> Midfield Focus
            </Button>
            <Button
              id="btn-pres-defender"
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleLoadTemplate('defender-focus')} 
              className="h-7 border-blue-100 bg-blue-50 px-2.5 py-1.5 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
            >
              <Shield size={11} /> Defender Focus
            </Button>
            <Button
              id="btn-pres-last-week"
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleLoadTemplate('last-week')} 
              className="h-7 border-purple-100 bg-purple-50 px-2.5 py-1.5 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
            >
              <RotateCcw size={11} /> Last Week
            </Button>
            <Button
              id="btn-pres-reset"
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleClearAllWeekly} 
              className="h-7 px-2.5 py-1.5 text-slate-600"
            >
              Reset Week
            </Button>
          </div>
        </div>

        {/* Intensity Distribution Trend Graph */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-900 text-white p-4.5 rounded-xl border border-slate-800">
          <div className="md:col-span-1 space-y-2 flex flex-col justify-center">
            <span className="text-[9px] font-black tracking-widest text-indigo-400 uppercase">CALENDAR LABS</span>
            <h4 className="font-display font-black text-white text-sm uppercase">Intensity Distribution</h4>
            <p className="text-[10px] text-slate-400 leading-normal">
              A real-time aggregate of physical drainage indices across the seven-day cycle. High-intensity spikes should be balanced with tapering periods.
            </p>
            
            {/* Distribution Index info */}
            <div className="mt-2 text-[10px] font-mono space-y-1 p-2 bg-slate-950/60 rounded-lg">
              <div className="flex justify-between items-center text-rose-400 font-bold">
                <span>Heavy Load (13+):</span>
                <span>{DAYS_OF_WEEK.filter(d => weeklySchedule[d].reduce((sum, item) => sum + item.fatigueIncrease, 0) >= 13).length} Days</span>
              </div>
              <div className="flex justify-between items-center text-amber-300 font-bold">
                <span>Optimal (6-12):</span>
                <span>{DAYS_OF_WEEK.filter(d => {
                  const sum = weeklySchedule[d].reduce((sum, item) => sum + item.fatigueIncrease, 0);
                  return sum >= 6 && sum < 13;
                }).length} Days</span>
              </div>
              <div className="flex justify-between items-center text-emerald-400 font-bold">
                <span>Recovery (0-5):</span>
                <span>{DAYS_OF_WEEK.filter(d => weeklySchedule[d].reduce((sum, item) => sum + item.fatigueIncrease, 0) < 6).length} Days</span>
              </div>
            </div>
          </div>

          {/* Mini Chart of weekly Load Curve */}
          <div className="md:col-span-3 flex flex-col justify-end h-36">
            <div className="flex items-end justify-between h-full px-2 mt-4">
              {DAYS_OF_WEEK.map((day) => {
                const load = weeklySchedule[day].reduce((sum, item) => sum + item.fatigueIncrease, 0);
                const maxPossibleLoad = 25; // scaling
                const heightPercent = Math.min(100, Math.max(8, (load / maxPossibleLoad) * 100));
                let barBg = 'bg-gradient-to-t from-emerald-500 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
                if (load >= 13) {
                  barBg = 'bg-gradient-to-t from-rose-600 to-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]';
                } else if (load >= 6) {
                  barBg = 'bg-gradient-to-t from-amber-500 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]';
                }
                
                return (
                  <div key={day} className="flex flex-col items-center flex-1 group">
                    {/* Load indicator badge on hover / top */}
                    <span className="text-[10px] font-mono font-black mb-1.5 text-slate-300 group-hover:text-indigo-400 transition-colors">
                      {load}%
                    </span>
                    
                    {/* Vertical Bar */}
                    <div className="w-6 md:w-8 bg-slate-950 rounded-t-lg overflow-hidden h-24 flex items-end">
                      <div 
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-md transition-all duration-300 ${barBg}`}
                      />
                    </div>

                    {/* Day Name */}
                    <span className="text-[9px] font-sans font-extrabold text-slate-500 uppercase tracking-widest mt-2">{day.substring(0, 3)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="grid grid-cols-1 items-stretch gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-2.5 sm:grid-cols-[9rem_minmax(15rem,1fr)_9rem] sm:items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleNavigateWeek(-1)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-700 hover:bg-slate-100 hover:text-indigo-700 transition-colors flex items-center justify-center gap-2 text-xs font-black"
            aria-label="Open previous week's training schedule"
            title="Previous week"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Previous
          </Button>

          <div className="flex min-h-12 flex-col items-center justify-center text-center px-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Training Week</span>
            <span className="min-w-[14rem] text-sm font-display font-black text-slate-800">{weekRangeLabel}</span>
            <span className="text-[10px] font-bold text-indigo-600">
              {isCurrentWeek ? 'Current week' : selectedWeekStart > getWeekStartDate(new Date()) ? 'Future week' : 'Past week'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
            {!isCurrentWeek && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReturnToCurrentWeek}
                className="h-10 w-full rounded-xl border border-indigo-100 bg-indigo-50 px-3 text-indigo-700 hover:bg-indigo-100 transition-colors text-xs font-black"
              >
                This Week
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => handleNavigateWeek(1)}
              className={`${isCurrentWeek ? 'col-span-2 sm:col-span-1' : ''} h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-700 hover:bg-slate-100 hover:text-indigo-700 transition-colors flex items-center justify-center gap-2 text-xs font-black`}
              aria-label="Open next week's training schedule"
              title="Next week"
            >
              Next
              <ChevronRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Weekly Drop Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {DAYS_OF_WEEK.map((day) => {
            const scheduledList = weeklySchedule[day];
            const totalLoad = scheduledList.reduce((sum, item) => sum + item.fatigueIncrease, 0);
            const dateStr = weekDaysMap[day].dateStr;
            const dayMatches = games.filter(g => (g.type === 'League' || g.type === 'Cup' || g.type === 'Friendly') && g.date === dateStr);
            
            let loadLabel = "RECOVER";
            let loadColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
            let loadDot = "bg-emerald-500";
            if (totalLoad >= 13) {
              loadLabel = "HEAVY LOAD";
              loadColor = "bg-rose-50 text-rose-700 border-rose-100 animate-pulse";
              loadDot = "bg-rose-500";
            } else if (totalLoad >= 6) {
              loadLabel = "OPTIMAL";
              loadColor = "bg-amber-50 text-amber-700 border-amber-100";
              loadDot = "bg-amber-500";
            }

            return (
              <div
                id={`planner-day-${day.toLowerCase()}`}
                key={day}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-indigo-500', 'bg-indigo-50/20');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50/20');
                }}
                onDrop={(e) => {
                  e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50/20');
                  handleDropDrill(day, e);
                }}
                className="border border-slate-200 bg-slate-50/40 rounded-xl p-3 flex flex-col justify-between min-h-[220px] transition-all relative group/day hover:border-slate-300"
              >
                {/* Day block top layout */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-display font-black text-slate-800 text-xs uppercase tracking-wide leading-tight">{day}</span>
                      <span className="text-[10px] text-indigo-600 font-bold font-mono tracking-tight">{weekDaysMap[day].monthDate}</span>
                    </div>
                    <span className="text-[8px] text-slate-400 font-mono font-medium">{scheduledList.length} d</span>
                  </div>

                  {/* Load indicator tag */}
                  <div className={`p-1 rounded text-[8px] font-mono font-bold border flex items-center justify-center gap-1 leading-none ${loadColor}`}>
                    <span className={`w-1 h-1 rounded-full ${loadDot}`}></span>
                    <span>{loadLabel} ({totalLoad}%)</span>
                  </div>

                  {/* Match badge if there's a scheduled game */}
                  {dayMatches.length > 0 && dayMatches.map(m => (
                    <div key={m.id} className={`p-1 rounded text-[8px] font-black border flex items-center gap-1 leading-none ${
                      m.type === 'League' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      m.type === 'Cup' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      'bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}>
                      <Trophy size={9} />
                      <span className="truncate">{m.type === 'League' ? 'LEAGUE' : m.type === 'Cup' ? 'CUP' : 'FRIENDLY'} vs {m.opponent.substring(0, 12)}</span>
                    </div>
                  ))}

                  {/* Scheduled drills list */}
                  <div className="space-y-1.5 pt-1.5">
                    {scheduledList.length === 0 ? (
                      <div className="border border-dashed border-slate-200 rounded-lg p-4 text-center text-slate-400 text-[9px] flex flex-col items-center justify-center gap-1 select-none">
                        <Hand size={14} className="text-slate-300 mx-auto" />
                        <span className="font-sans leading-tight">Drop drills</span>
                      </div>
                    ) : (
                      scheduledList.map((item) => (
                        <div 
                          id={`scheduled-item-${item.id}`}
                          key={item.id}
                          className="flex justify-between items-center bg-white border border-slate-200 rounded-lg p-1.5 hover:border-slate-300 transition-all text-[10px]"
                        >
                          <div className="flex items-center gap-1 truncate pr-1">
                            <span className="text-slate-400 shrink-0">{getDrillIcon(item.drillId)}</span>
                            <span className="font-semibold text-slate-800 truncate leading-tight select-none">
                              {item.name.replace("Challenge", "").replace("Workout", "").replace("Walkthrough", "").replace("Sprints", "")}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveDrill(day, item.id)}
                            className="size-4 rounded bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                            title="Remove Drill"
                          >
                            <X size={10} aria-hidden="true" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Day footer helper text */}
                <div className="mt-3 text-[8px] font-mono text-slate-400 border-t border-slate-100 pt-1.5 flex justify-between items-center select-none">
                  <span>Daily Load</span>
                  <span className="font-bold text-slate-650">+{totalLoad}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Playbook drills and player development */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Drills Catalog */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/60 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Dumbbell size={16} />
                </div>
                <div>
                  <h3 className="font-display font-black text-slate-800 text-sm uppercase tracking-wider">Tactical & Technical Drill Selector</h3>
                  <p className="text-slate-400 text-[10px]">Select a specialized drill to check target attribute upgrades and daily load ratios.</p>
                </div>
              </div>
              
              <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full border border-indigo-100">
                Found {filteredDrills.length} Drills
              </span>
            </div>

            {/* Filter Section (Search & Pill buttons) */}
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search drills by name, category, or benefit (e.g. speed, physical, shooting)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 rounded-xl pl-9 pr-14 text-xs font-sans text-slate-700"
                />
                {searchQuery && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-1.5 top-1.5 h-7 px-2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Skill Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs font-mono text-slate-400 font-bold uppercase mr-1 flex items-center gap-1">
                  <Filter size={13} /> Focus Target:
                </span>
                {[
                  { id: 'all', label: 'All Skills' },
                  { id: 'forward', label: 'Forwards' },
                  { id: 'midfielder', label: 'Midfielders' },
                  { id: 'defender', label: 'Defenders' },
                  { id: 'goalkeeper', label: 'Goalkeepers' },
                  { id: 'speed', label: 'Speed' },
                  { id: 'shooting', label: 'Shooting' },
                  { id: 'passing', label: 'Passing' },
                  { id: 'dribbling', label: 'Dribbling' },
                  { id: 'defending', label: 'Defending' },
                  { id: 'physicalness', label: 'Stamina/Physicality' },
                  { id: 'conditioning', label: 'Conditioning & Recovery' },
                ].map((pill) => {
                  const isActive = selectedAttributeFilter === pill.id;
                  return (
                    <Button
                      key={pill.id}
                      type="button"
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedAttributeFilter(pill.id)}
                      className={`h-7 px-2.5 py-1 text-xs ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {pill.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Drills Grid */}
            {filteredDrills.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 space-y-1.5">
                <Search size={24} className="mx-auto text-slate-300" />
                <p className="text-sm font-semibold">No matches found for "{searchQuery}"</p>
                <p className="text-xs text-slate-400">Try modifying your search query or picking another focus target filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredDrills.map((drill) => (
                  <TrainingDrillCard
                    key={drill.id}
                    drill={drill}
                    instructions={DRILL_INSTRUCTIONS[drill.id]}
                    isSelected={selectedDrillId === drill.id}
                    isRecommended={growthNeeds?.isBeneficial(drill)}
                    isExpanded={expandedDrills.has(drill.id)}
                    onDragStart={(event) => handleDragStart(event, drill.id)}
                    onSelect={() => setSelectedDrillId(drill.id)}
                    onToggleExpanded={() => {
                      setExpandedDrills(prev => {
                        const next = new Set(prev);
                        if (next.has(drill.id)) next.delete(drill.id);
                        else next.add(drill.id);
                        return next;
                      });
                    }}
                  />
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Player development and workload tools */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2">
              <HeartPulse size={17} className="text-rose-500" />
              <div>
                <h4 className="font-display font-black text-sm text-slate-900">Weekly Load Check</h4>
                <p className="text-[10px] text-slate-500">Fast guidance from the current calendar</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                <strong className="block text-lg text-slate-900">{weeklyLoad}%</strong>
                <span className="text-[8px] uppercase font-bold text-slate-400">Total load</span>
              </div>
              <div className="bg-rose-50 rounded-xl p-2.5 text-center border border-rose-100">
                <strong className="block text-lg text-rose-700">{heavyDays}</strong>
                <span className="text-[8px] uppercase font-bold text-rose-500">Heavy days</span>
              </div>
              <div className="bg-emerald-50 rounded-xl p-2.5 text-center border border-emerald-100">
                <strong className="block text-lg text-emerald-700">{recoveryDays}</strong>
                <span className="text-[8px] uppercase font-bold text-emerald-600">Recovery days</span>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-3.5 flex items-start gap-2.5">
              <ShieldCheck size={17} className={workloadStatus.color} />
              <div>
                <div className={`text-xs font-black ${workloadStatus.color}`}>{workloadStatus.label}</div>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{workloadStatus.note}</p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => addDrillsToDay([TRAINING_DRILLS.find(drill => drill.id === 'drill-mobility')!], developmentDay)}
              className="w-full rounded-xl border-emerald-100 bg-emerald-50 py-2 text-[10px] font-black text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
            >
              Add recovery flow to {developmentDay}
            </Button>
          </div>
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
                                {drill.category} · Load {drill.fatigueIncrease}% · {Object.entries(drill.statsBumps).map(([key, value]) => `${key === 'physicalness' ? 'conditioning' : key} +${value}`).join(', ')}
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
                      {Object.keys(projectedTrainingGains).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(projectedTrainingGains).map(([attribute, gain]) => (
                            <Badge key={attribute} className="border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] capitalize text-emerald-300">
                              {attribute === 'physicalness' ? 'conditioning' : attribute} +{gain}
                            </Badge>
                          ))}
                        </div>
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
                  <CheckCircle size={13} /> Complete selected training and apply gains
                </Button>
              </>
            ) : (
              <div className="border border-dashed border-slate-700 rounded-xl p-5 text-center">
                <User size={20} className="mx-auto text-slate-600 mb-2" />
                <p className="text-[10px] text-slate-400 leading-relaxed">Choose a player to identify their weakest attribute and build a practical three-drill session.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

