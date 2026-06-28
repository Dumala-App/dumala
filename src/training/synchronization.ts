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
}

export type WeeklySchedule = Record<DayName, ScheduledDrill[]>;

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

export const getOrderedSessionDrills = (drills: readonly ScheduledDrill[]): ScheduledDrill[] => {
  const blockOrder = new Map(SESSION_BLOCKS.map((block, index) => [block.id, index]));
  return [...drills].sort((first, second) => {
    const blockDifference = (blockOrder.get(getScheduledDrillBlock(first)) ?? 0)
      - (blockOrder.get(getScheduledDrillBlock(second)) ?? 0);
    if (blockDifference !== 0) return blockDifference;
    return (first.order ?? 0) - (second.order ?? 0);
  });
};

export type WeekDaysMap = Record<DayName, {
  dateStr: string;
  monthDate: string;
  displayStrOrMonthDate: string;
}>;

export const getWeekDaysMap = (refDate: Date): WeekDaysMap => {
  const day = refDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(refDate);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(refDate.getDate() + diff);

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
  const equipment = [...new Set(drills.flatMap(drill => drill.equipment ?? []))];
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
