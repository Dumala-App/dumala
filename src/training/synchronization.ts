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

export interface ScheduledDrill {
  id: string;
  drillId: string;
  name: string;
  icon?: string;
  fatigueIncrease: number;
  playerId?: string;
  playerName?: string;
}

export type WeeklySchedule = Record<DayName, ScheduledDrill[]>;

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
  const drillText = drills.map(drill => `${drill.icon ?? ''} ${drill.name}`.trim()).join(' & ');
  const workLoad = drills.reduce((sum, item) => sum + item.fatigueIncrease, 0);
  const developmentPlayers = [...new Set(
    drills.flatMap(drill => drill.playerName ? [drill.playerName] : [])
  )];
  const playerLabel = developmentPlayers.length > 0
    ? ` | Dev: ${developmentPlayers.join(', ')}`
    : '';

  return [{
    id: `training_sync_${dateInfo.dateStr}`,
    opponent: `Training: ${drills.map(drill => drill.name).join(' + ')}${playerLabel}`,
    date: dateInfo.dateStr,
    time: '10:00 AM',
    location: 'Training Ground A',
    status: 'Upcoming',
    type: 'Training',
    notes: `Squad Workload Target: +${workLoad}% intensity. Drills: ${drillText}.${developmentPlayers.length > 0 ? ` Individual development for: ${developmentPlayers.join(', ')}.` : ''} Prepare lightweight kits.`
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
