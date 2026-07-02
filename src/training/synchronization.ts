import type { Game } from '../types';

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
] as const;

export type DayName = typeof DAYS_OF_WEEK[number];

export const SESSION_BLOCKS = [
  { id: 'warmup', label: 'Warm-up', defaultDurationMinutes: 10 },
  { id: 'technical', label: 'Main technical', defaultDurationMinutes: 15 },
  { id: 'tactical', label: 'Tactical', defaultDurationMinutes: 20 },
  { id: 'conditioning', label: 'Conditioning', defaultDurationMinutes: 15 },
  { id: 'cooldown', label: 'Cooldown', defaultDurationMinutes: 10 }
] as const;

export type SessionBlockId = typeof SESSION_BLOCKS[number]['id'];

export const SESSION_LOAD_THRESHOLDS = {
  optimal: 13,
  high: 36,
  weeklyHigh: 160
} as const;

export interface ScheduledDrill {
  id: string;
  drillId: string;
  name: string;
  icon?: string;
  fatigueIncrease: number;
  playerId?: string;
  playerName?: string;
  block?: SessionBlockId;
  order?: number;
  durationMinutes?: number;
  intensityRating?: number;
  equipment?: string[];
  notes?: string;
  status?: 'planned' | 'done' | 'skipped';
  completedAt?: string;
  skipReason?: string;
}

export type WeeklySchedule = Record<DayName, ScheduledDrill[]>;

export type TrainingSessionStatus = 'planned' | 'in_progress' | 'completed';

export interface TrainingSessionMeta {
  status?: TrainingSessionStatus;
  completedAt?: string;
  reflection?: string;
}

export type TrainingSessionMetaMap = Record<string, Partial<Record<DayName, TrainingSessionMeta>>>;

export interface TrainingSessionSummary {
  day: DayName;
  dateStr: string;
  drills: ScheduledDrill[];
  keyDrills: ScheduledDrill[];
  overflowCount: number;
  duration: number;
  loadPoints: number;
  equipment: string[];
  coachCues: string[];
  warnings: string[];
  readiness: 'ready' | 'needs_structure' | 'high_load' | 'no_drills';
  status: TrainingSessionStatus;
  completedCount: number;
  skippedCount: number;
  reflection: string;
}

export const getScheduledDrillBlock = (drill: ScheduledDrill): SessionBlockId => drill.block ?? 'technical';

export const getScheduledDrillDuration = (drill: ScheduledDrill): number => (
  Math.max(5, Math.round(drill.durationMinutes ?? 10))
);

export const getScheduledDrillLoadPoints = (drill: ScheduledDrill): number => {
  const intensity = Math.max(1, Math.min(10, drill.intensityRating ?? drill.fatigueIncrease));
  return Math.round(intensity * getScheduledDrillDuration(drill) / 10);
};

export const getSessionDuration = (drills: readonly ScheduledDrill[]): number => (
  drills.reduce((total, drill) => total + getScheduledDrillDuration(drill), 0)
);

export const getSessionLoadPoints = (drills: readonly ScheduledDrill[]): number => (
  drills.reduce((total, drill) => total + getScheduledDrillLoadPoints(drill), 0)
);

export const getSessionEquipment = (drills: readonly ScheduledDrill[]): string[] => {
  const equipment = new Map<string, string>();
  drills.flatMap(drill => drill.equipment ?? []).forEach(item => {
    const key = item.trim().toLowerCase();
    if (key && !equipment.has(key)) equipment.set(key, item.trim());
  });
  return [...equipment.values()];
};

export const getOrderedSessionDrills = (drills: readonly ScheduledDrill[]): ScheduledDrill[] => {
  const blockOrder = new Map(SESSION_BLOCKS.map((block, index) => [block.id, index]));
  return [...drills].sort((first, second) => {
    const blockDifference = (blockOrder.get(getScheduledDrillBlock(first)) ?? 0)
      - (blockOrder.get(getScheduledDrillBlock(second)) ?? 0);
    if (blockDifference !== 0) return blockDifference;
    return (first.order ?? 0) - (second.order ?? 0);
  });
};

export const getTrainingSessionWarnings = (drills: readonly ScheduledDrill[]): string[] => {
  const hasWarmup = drills.some(drill => getScheduledDrillBlock(drill) === 'warmup');
  const hasCooldown = drills.some(drill => getScheduledDrillBlock(drill) === 'cooldown');
  const duration = getSessionDuration(drills);
  return [
    drills.length > 0 && !hasWarmup ? 'Add a warm-up block before the main work.' : null,
    drills.length > 0 && !hasCooldown ? 'Finish with a cooldown or recovery drill.' : null,
    duration > 120 ? 'This session is longer than two hours.' : null
  ].filter((warning): warning is string => Boolean(warning));
};

export const getTrainingSessionReadiness = (drills: readonly ScheduledDrill[]): TrainingSessionSummary['readiness'] => {
  if (drills.length === 0) return 'no_drills';
  if (getSessionLoadPoints(drills) >= SESSION_LOAD_THRESHOLDS.high) return 'high_load';
  if (getTrainingSessionWarnings(drills).length > 0) return 'needs_structure';
  return 'ready';
};

export const buildTrainingSessionSummary = ({
  day,
  dateStr,
  drills,
  meta
}: {
  day: DayName;
  dateStr: string;
  drills: readonly ScheduledDrill[];
  meta?: TrainingSessionMeta;
}): TrainingSessionSummary => {
  const orderedDrills = getOrderedSessionDrills(drills);
  const keyDrills = orderedDrills.slice(0, 3);
  return {
    day,
    dateStr,
    drills: orderedDrills,
    keyDrills,
    overflowCount: Math.max(0, orderedDrills.length - keyDrills.length),
    duration: getSessionDuration(orderedDrills),
    loadPoints: getSessionLoadPoints(orderedDrills),
    equipment: getSessionEquipment(orderedDrills),
    coachCues: orderedDrills.flatMap(drill => drill.notes?.trim() ? [`${drill.name}: ${drill.notes.trim()}`] : []),
    warnings: getTrainingSessionWarnings(orderedDrills),
    readiness: getTrainingSessionReadiness(orderedDrills),
    status: meta?.status ?? 'planned',
    completedCount: orderedDrills.filter(drill => drill.status === 'done').length,
    skippedCount: orderedDrills.filter(drill => drill.status === 'skipped').length,
    reflection: meta?.reflection ?? ''
  };
};

export type WeekDaysMap = Record<DayName, {
  dateStr: string;
  monthDate: string;
  displayStrOrMonthDate: string;
}>;

export const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getWeekStartDate = (date: Date) => {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(date);
  start.setHours(12, 0, 0, 0);
  start.setDate(date.getDate() + diff);
  return start;
};

export const getWeekDaysMap = (refDate: Date): WeekDaysMap => {
  const monday = getWeekStartDate(refDate);

  return DAYS_OF_WEEK.reduce<WeekDaysMap>((map, dayName, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayOfMonth}`;
    const monthDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    map[dayName] = {
      dateStr,
      monthDate,
      displayStrOrMonthDate: `${dayName} (${monthDate})`
    };
    return map;
  }, {} as WeekDaysMap);
};

export const getDayNameForDateKey = (dateKey: string, weekDaysMap: WeekDaysMap): DayName | null => (
  DAYS_OF_WEEK.find(day => weekDaysMap[day].dateStr === dateKey) ?? null
);

export const buildTrainingCalendarGames = (
  weeklySchedule: WeeklySchedule,
  weekDaysMap: WeekDaysMap
): Game[] => DAYS_OF_WEEK.flatMap((dayName) => {
  const drills = weeklySchedule[dayName];
  if (drills.length === 0) return [];

  const dateInfo = weekDaysMap[dayName];
  const orderedDrills = getOrderedSessionDrills(drills);
  const drillText = orderedDrills.map(drill => `${drill.icon ?? ''} ${drill.name}`.trim()).join(' & ');
  const workLoad = getSessionLoadPoints(drills);
  const duration = getSessionDuration(drills);
  const equipment = getSessionEquipment(drills);
  const coachCues = orderedDrills.flatMap(drill => drill.notes?.trim() ? [`${drill.name}: ${drill.notes.trim()}`] : []);
  const developmentPlayers = [...new Set(
    drills.flatMap(drill => drill.playerName ? [drill.playerName] : [])
  )];
  const playerLabel = developmentPlayers.length > 0
    ? ` | Dev: ${developmentPlayers.join(', ')}`
    : '';

  return [{
    id: `training_sync_${dateInfo.dateStr}`,
    opponent: `Training: ${orderedDrills.map(drill => drill.name).join(' + ')}${playerLabel}`,
    date: dateInfo.dateStr,
    time: '10:00 AM',
    location: 'Training Ground A',
    status: 'Upcoming',
    type: 'Training',
    notes: `Planned session: ${duration} minutes, ${workLoad} load points. Drills: ${drillText}.${equipment.length > 0 ? ` Equipment: ${equipment.join(', ')}.` : ''}${coachCues.length > 0 ? ` Coach cues: ${coachCues.join(' | ')}.` : ''}${developmentPlayers.length > 0 ? ` Individual development for: ${developmentPlayers.join(', ')}.` : ''}`
  }];
});

const comparableGame = (game: Game) => ({
  id: game.id,
  opponent: game.opponent,
  date: game.date,
  time: game.time,
  location: game.location,
  status: game.status,
  type: game.type,
  notes: game.notes
});

export const synchronizeTrainingCalendar = ({
  games,
  weeklySchedule,
  weekDaysMap
}: {
  games: Game[];
  weeklySchedule: WeeklySchedule;
  weekDaysMap: WeekDaysMap;
}): { games: Game[]; changed: boolean } => {
  const activeWeekDates = new Set(Object.values(weekDaysMap).map(day => day.dateStr));
  const expectedTrainingGames = buildTrainingCalendarGames(weeklySchedule, weekDaysMap);
  const currentTrainingGames = games
    .filter(game => game.type === 'Training' && activeWeekDates.has(game.date))
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const sortedExpected = [...expectedTrainingGames]
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const changed =
    currentTrainingGames.length !== sortedExpected.length
    || currentTrainingGames.some((game, index) => (
      JSON.stringify(comparableGame(game)) !== JSON.stringify(comparableGame(sortedExpected[index]))
    ));

  if (!changed) return { games, changed: false };

  const otherGames = games.filter(game => (
    game.type !== 'Training' || !activeWeekDates.has(game.date)
  ));
  return {
    games: [...otherGames, ...expectedTrainingGames],
    changed: true
  };
};
