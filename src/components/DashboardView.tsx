import React, { type ReactNode, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { AssessmentSession, Game, GamePlan, Player, Standing, Announcement, TeamInfo } from '../types';
import type { ActivationState } from '../activation/milestones';
import GettingStartedChecklist from './GettingStartedChecklist';
import {findUserStanding, sortStandings} from '../standings';
import { Calendar, MapPin, Trophy, Shield, Megaphone, Star, Award, Zap, ArrowRight, CornerRightDown, TrendingUp, Edit, Upload, Link, Check, X, Image, Crown, Target, Flame, AlertCircle, Table, Users, ClipboardList, CloudSun, CloudRain, Wind, MoreHorizontal, Clock, Route, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  matchFormatSchema,
  strategyContextSchema,
  stringSchema,
  trainingSessionMetaMapSchema,
  weeklyScheduleSchema,
  gamePlansSchema,
  tacticsLineupSchema
} from '../persistence/schemas';
import {
  readJsonStorage,
  readStringStorage,
  STORAGE_KEYS
} from '../persistence/storage';
import {
  getDefaultFormation,
  isFormationValidForFormat,
  MATCH_FORMAT_CONFIG,
  type MatchFormat
} from '../tactics/formations';
import {
  buildPositionAwareLineup,
  type TacticsLineup,
  type TacticsPlayer
} from '../tactics/lineup';
import {
  DEFAULT_STRATEGY_CONTEXT,
  STRATEGY_CONTEXT_LABELS,
  type StrategyContext
} from '../tactics/strategyContext';
import {
  DAYS_OF_WEEK,
  buildTrainingSessionSummary,
  getWeekDaysMap,
  getWeekStartDate,
  toDateKey,
  type DayName,
  type TrainingSessionSummary,
  type WeeklySchedule
} from '../training/synchronization';
import {
  DARK_GLASS_CLASSES,
  DARK_GLASS_DASHBOARD_SURFACE_STYLE,
  DARK_GLASS_THEME_STYLE
} from '../theme/darkGlassTheme';
import weatherClearUrl from '../assets/weather/clear.png';
import weatherCloudyUrl from '../assets/weather/cloudy.png';
import weatherFogUrl from '../assets/weather/fog.png';
import weatherRainUrl from '../assets/weather/rain.png';
import weatherStormUrl from '../assets/weather/storm.png';
import { LocalImageUploadError, prepareLocalImageDataUrl } from '../images/localImageUpload';

type MatchOutcome = 'W' | 'D' | 'L';
type DashboardChartPoint = {
  name: string;
  points: number;
  outcome: MatchOutcome;
  opponent: string;
  matchPoints: number;
};
type DashboardTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: DashboardChartPoint }>;
};
type DashboardDotProps = {
  cx?: number;
  cy?: number;
  index?: number;
  payload?: DashboardChartPoint;
};
type WeatherDay = {
  date: string;
  code: number;
  high: number;
  low: number;
  rainChance: number;
  wind: number;
};
type WeatherLocationResult = {
  id?: number;
  latitude: number;
  longitude: number;
  name: string;
  admin1?: string;
  country?: string;
};
type WeatherLocationSuggestion = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};
type SavedWeatherPlace = {
  label: string;
  latitude: number;
  longitude: number;
};
type WeatherAdvisoryState = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  locationLabel: string;
  current?: {
    temperature: number;
    humidity: number;
    precipitation: number;
    wind: number;
    code: number;
  };
  days: WeatherDay[];
  message?: string;
};
type MiniFormationSlot = {
  role: string;
  top: number;
  left: number;
};
type StrategySnapshot = {
  matchFormat: MatchFormat;
  formation: string;
  playstyle: string;
  defensiveStyle: string;
  context: StrategyContext;
  captain?: Player;
  freeKickTaker?: Player;
  cornerTaker?: Player;
  penaltyTaker?: Player;
  slots: Array<MiniFormationSlot & { player?: TacticsPlayer }>;
};

const WEATHER_CODE_LABELS: Record<number, string> = {
  0: 'Clear',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Cloudy',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  80: 'Rain showers',
  81: 'Showers',
  82: 'Heavy showers',
  95: 'Thunderstorm',
  96: 'Storm with hail',
  99: 'Storm with hail'
};

const getWeatherLabel = (code: number) => WEATHER_CODE_LABELS[code] ?? 'Mixed conditions';

const formatWeatherLocation = (place: Pick<WeatherLocationResult, 'name' | 'admin1' | 'country'>) => (
  [place.name, place.admin1, place.country].filter(Boolean).join(', ')
);

const parseSavedWeatherPlace = (value: string | null): SavedWeatherPlace | null => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<SavedWeatherPlace>;
    if (
      typeof parsed.label === 'string' &&
      typeof parsed.latitude === 'number' &&
      typeof parsed.longitude === 'number'
    ) {
      return {
        label: parsed.label,
        latitude: parsed.latitude,
        longitude: parsed.longitude
      };
    }
  } catch {
    return null;
  }

  return null;
};

const getWeatherAdvisoryTone = (day?: WeatherDay, currentWind = 0) => {
  if (!day) return { label: 'Monitoring', className: 'border-sky-300/25 bg-sky-300/10 text-sky-100', message: 'Weather check is preparing.' };
  if (day.code >= 95 || day.rainChance >= 75 || day.wind >= 35 || currentWind >= 35) {
    return {
      label: 'High caution',
      className: 'border-rose-300/25 bg-rose-300/10 text-rose-100',
      message: 'Plan wet-weather footwear, extra warm-up time, hydration, and pitch-safety checks.'
    };
  }
  if (day.rainChance >= 45 || day.wind >= 24 || day.code >= 61) {
    return {
      label: 'Watch conditions',
      className: 'border-amber-300/25 bg-amber-300/10 text-amber-100',
      message: 'Prepare rain cover, towel rotation, and adjust ball-speed expectations.'
    };
  }
  return {
    label: 'Good window',
    className: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100',
    message: 'Conditions look manageable for normal match or training preparation.'
  };
};

const getShortWeekday = (date: string) => new Intl.DateTimeFormat('en', { weekday: 'short' }).format(new Date(`${date}T00:00:00`));

const cleanLocationQuery = (value: string) => (
  value
    .replace(/\b(stadium|field|pitch|court|gym|clubhouse)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
);

const getCalendarEventStartMs = (game: Game) => {
  const time = game.time?.trim() || '00:00';
  const timestamp = new Date(`${game.date}T${time}`).getTime();
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
};

export const selectMatchDayPrepEvent = (
  games: Game[],
  now = new Date()
): Game | undefined => {
  const todayKey = toDateKey(now);

  return games
    .filter(game => game.status === 'Upcoming')
    .map(game => ({ game, startsAt: getCalendarEventStartMs(game) }))
    .filter(item => item.game.date >= todayKey)
    .sort((a, b) => a.startsAt - b.startsAt)[0]?.game;
};

const formatCalendarEventDateTime = (game: Game) => {
  const timestamp = getCalendarEventStartMs(game);
  if (!Number.isFinite(timestamp)) return `${game.date} @ ${game.time}`;

  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(timestamp));
};

const getCalendarEventCountdown = (game: Game, now = new Date()) => {
  const diffMs = getCalendarEventStartMs(game) - now.getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) return 'Due now';

  const totalMinutes = Math.ceil(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const getEventTypeLabel = (event: Game) => (
  event.type === 'Training' ? 'Practice' : event.type === 'Meeting' ? 'Meeting' : 'Matchday'
);

const getMatchPrepChecklist = (event: Game) => {
  if (event.type === 'Training') {
    return ['Confirm attendance', 'Set drill blocks', 'Prep equipment'];
  }

  if (event.type === 'Meeting') {
    return ['Share agenda', 'Prepare clips', 'Confirm attendees'];
  }

  return ['Confirm squad list', 'Review tactics', 'Verify travel'];
};

const getWeatherArtType = (code: number) => {
  if (code >= 95) return 'storm';
  if (code >= 51 && code <= 82) return 'rain';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 1 && code <= 3) return 'cloud';
  return 'clear';
};

const getPlayerTacticsAttributes = (player: Player): NonNullable<TacticsPlayer['attributes']> => {
  const base = player.baseAttributes || {
    pace: 50,
    stamina: 50,
    agility: 50,
    strength: 50,
    firstTouch: 50,
    shortPassing: 50
  };
  const positional = player.positionAttributes || {};
  const average = (...values: number[]) => Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

  const shooting = player.position === 'Forward'
    ? average(positional.Finishing || 50, positional['Long Shots'] || 50)
    : positional['Long Shots'] || 50;
  const defending = player.position === 'Goalkeeper'
    ? average(positional.Reflexes || 50, positional.Handling || 50)
    : average(positional.Tackling || 50, positional.Positioning || 50);

  return {
    speed: base.pace,
    shooting,
    passing: base.shortPassing,
    dribbling: average(base.agility, base.firstTouch),
    defending,
    physicalness: average(base.stamina, base.strength)
  };
};

const toTacticsPlayer = (player: Player): TacticsPlayer => {
  const attributes = getPlayerTacticsAttributes(player);
  const rating = Math.round(Object.values(attributes).reduce((sum, value) => sum + value, 0) / 6);

  return {
    id: player.id,
    name: player.name,
    rating,
    position: player.position === 'Forward' ? 'CF' : player.position === 'Midfielder' ? 'AMF' : player.position === 'Defender' ? 'CB' : 'GK',
    condition: 'B',
    photoUrl: player.photoUrl,
    isLegend: false,
    attributes,
    number: player.number,
    bio: player.bio,
    gamesPlayed: player.gamesPlayed,
    points: player.points,
    assists: player.assists,
    cleanSheetsOrRebounds: player.cleanSheetsOrRebounds,
    minutesPlayed: player.minutesPlayed,
    mvpAwards: player.mvpAwards,
    yellowCards: player.yellowCards,
    redCards: player.redCards,
    registrationStatus: player.registrationStatus
  };
};

const buildMiniFormationSlots = (matchFormat: MatchFormat, formation: string): MiniFormationSlot[] => {
  const defaultGK = { role: 'GK', top: 50, left: 12 };
  const expectedOutfield = MATCH_FORMAT_CONFIG[matchFormat].size - 1;
  const parts = formation.split('-').map(Number).filter(n => !Number.isNaN(n) && n > 0);
  let effectiveParts = parts;

  if (parts.length === 0 || parts.reduce((sum, value) => sum + value, 0) !== expectedOutfield) {
    const fallback = getDefaultFormation(matchFormat);
    effectiveParts = fallback.split('-').map(Number).filter(n => !Number.isNaN(n) && n > 0);
  }

  const rowCount = effectiveParts.length;
  const slots: MiniFormationSlot[] = [];

  for (let row = 0; row < rowCount; row++) {
    const count = effectiveParts[row];
    const left = rowCount === 1 ? 58 : Math.round(28 + (row / (rowCount - 1)) * 56);

    for (let index = 0; index < count; index++) {
      const top = count === 1 ? 50 : Math.round(20 + (index / (count - 1)) * 60);
      let role = 'MID';

      if (row === 0) {
        if (count === 1) role = 'CB';
        else if (count === 2) role = index === 0 ? 'LB' : 'RB';
        else if (count === 3) role = index === 0 ? 'LCB' : index === 1 ? 'CB' : 'RCB';
        else if (count === 4) role = index === 0 ? 'LB' : index === 3 ? 'RB' : 'CB';
        else if (count === 5) role = index === 0 ? 'LWB' : index === 4 ? 'RWB' : 'CB';
        else role = 'DEF';
      } else if (row === rowCount - 1) {
        if (count === 1) role = 'CF';
        else if (count === 2) role = index === 0 ? 'LWF' : 'RWF';
        else if (count === 3) role = index === 0 ? 'LWF' : index === 1 ? 'CF' : 'RWF';
        else role = 'FWD';
      } else {
        const isDefensiveMid = row === 1 && rowCount > 3;
        const isAttackingMid = row === rowCount - 2;
        if (isDefensiveMid) role = count === 1 ? 'DMF' : index === 0 ? 'LDMF' : 'RDMF';
        else if (isAttackingMid) role = count === 1 ? 'AMF' : index === 0 ? 'LAMF' : index === count - 1 ? 'RAMF' : 'AMF';
        else role = count === 1 ? 'CMF' : index === 0 ? 'LMF' : index === count - 1 ? 'RMF' : 'CMF';
      }

      slots.push({ role, top, left });
    }
  }

  return [defaultGK, ...slots];
};

const readStrategySnapshot = (players: Player[]): StrategySnapshot => {
  const matchFormat = readStringStorage(STORAGE_KEYS.matchFormat, matchFormatSchema, '11-a-side', 'Tactics match format');
  const storedFormation = readStringStorage(STORAGE_KEYS.formation, stringSchema, '4-1-2-3', 'Tactics formation');
  const formation = isFormationValidForFormat(matchFormat, storedFormation) ? storedFormation : getDefaultFormation(matchFormat);
  const playstyle = readStringStorage(STORAGE_KEYS.playstyle, stringSchema, 'Quick Counter', 'Tactics playstyle');
  const defensiveStyle = readStringStorage(STORAGE_KEYS.defensiveStyle, stringSchema, 'High Press', 'Tactics defense');
  const context = readJsonStorage(
    STORAGE_KEYS.strategyContext,
    strategyContextSchema,
    DEFAULT_STRATEGY_CONTEXT,
    'Tactics strategy context'
  );
  const captainId = readStringStorage(STORAGE_KEYS.captainId, stringSchema, '', 'Tactics roles');
  const freeKickTakerId = readStringStorage(STORAGE_KEYS.freeKickTakerId, stringSchema, '', 'Tactics roles');
  const cornerTakerId = readStringStorage(STORAGE_KEYS.cornerTakerId, stringSchema, '', 'Tactics roles');
  const penaltyTakerId = readStringStorage(STORAGE_KEYS.penaltyTakerId, stringSchema, '', 'Tactics roles');
  const savedLineup = readJsonStorage(STORAGE_KEYS.lineup, tacticsLineupSchema, {}, 'Tactics lineup') as TacticsLineup;
  const miniSlots = buildMiniFormationSlots(matchFormat, formation);
  const tacticsPlayers = players.filter(player => player.registrationStatus === 'Active').map(toTacticsPlayer);
  const lineup = buildPositionAwareLineup({
    players: tacticsPlayers,
    slots: miniSlots,
    size: MATCH_FORMAT_CONFIG[matchFormat].size,
    currentLineup: savedLineup,
    preserveAssignments: true
  });

  return {
    matchFormat,
    formation,
    playstyle,
    defensiveStyle,
    context,
    captain: players.find(player => player.id === captainId),
    freeKickTaker: players.find(player => player.id === freeKickTakerId),
    cornerTaker: players.find(player => player.id === cornerTakerId),
    penaltyTaker: players.find(player => player.id === penaltyTakerId),
    slots: miniSlots.slice(0, MATCH_FORMAT_CONFIG[matchFormat].size).map((slot, index) => ({
      ...slot,
      player: lineup[index]
    }))
  };
};

const getMiniPlayerNumber = (player: TacticsPlayer | undefined, fallback: number) => (
  player?.number ? String(player.number) : String(fallback + 1)
);

const WEATHER_ICON_ASSETS = {
  clear: weatherClearUrl,
  cloud: weatherCloudyUrl,
  fog: weatherFogUrl,
  rain: weatherRainUrl,
  storm: weatherStormUrl
} as const;

const WeatherKitIcon = ({ code, compact = false }: { code: number; compact?: boolean }) => {
  const type = getWeatherArtType(code);
  const sizeClass = compact
    ? 'mx-auto h-10 w-12 object-contain'
    : 'mx-auto h-32 w-full max-w-[190px] object-contain';

  return (
    <img
      src={WEATHER_ICON_ASSETS[type]}
      alt={`${getWeatherLabel(code)} weather icon`}
      className={sizeClass}
      loading="lazy"
      decoding="async"
    />
  );
};

const CustomTooltip = ({ active, payload }: DashboardTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-950/95 border border-slate-800 p-3 rounded-xl shadow-lg font-sans text-xs text-slate-200">
        <p className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">{data.name}</p>
        <p className="font-display font-black text-white text-sm mt-0.5">
          Cumulative: <span className="text-indigo-400">{data.points} pts</span>
        </p>
        <div className="border-t border-slate-800/80 my-1.5 pt-1.5 space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Opponent:</span>
            <span className="font-semibold text-slate-200">{data.opponent}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Result:</span>
            <span className={`font-bold ${
              data.outcome === 'W' ? 'text-emerald-400' :
              data.outcome === 'D' ? 'text-amber-400' :
              'text-rose-500'
            }`}>
              {data.outcome === 'W' ? 'Won (+3 pts)' :
               data.outcome === 'D' ? 'Draw (+1 pt)' :
               'Lost (0 pts)'}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const renderOutcomeDot = ({ cx, cy, payload, index }: DashboardDotProps) => {
  if (cx === undefined || cy === undefined || !payload) return null;
  const color = payload.outcome === 'W' ? '#10b981' : payload.outcome === 'D' ? '#fbbf24' : '#ef4444';
  return (
    <circle key={`dot-${index ?? 0}`} cx={cx} cy={cy} r={5} fill={color} stroke="#ffffff" strokeWidth={1.5} />
  );
};

const dashboardHeroStyle: React.CSSProperties = {
  background: [
    'radial-gradient(circle at 78% 20%, rgba(34, 211, 238, 0.22), transparent 20rem)',
    'radial-gradient(circle at 14% 18%, rgba(251, 146, 60, 0.28), transparent 18rem)',
    'linear-gradient(135deg, rgba(7,17,31,0.96) 0%, rgba(11,23,38,0.92) 52%, rgba(4,21,17,0.92) 100%)'
  ].join(', '),
  boxShadow: '0 24px 58px rgba(0, 0, 0, 0.28)'
};

const dashboardLogoTileStyle: React.CSSProperties = {
  background: 'linear-gradient(150deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 48%, rgba(34,211,238,0.12) 100%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(15,23,42,0.24), 0 20px 38px rgba(0,0,0,0.28)'
};

const dashboardStatTileStyle: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(251,146,60,0.24) 0%, rgba(34,211,238,0.14) 54%, rgba(15,23,42,0.34) 100%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(15,23,42,0.24), 0 16px 32px rgba(0,0,0,0.24)'
};

const dashboardCardClass = `${DARK_GLASS_CLASSES.panel} p-5 sm:p-6`;
const dashboardHeaderClass = DARK_GLASS_CLASSES.sectionDivider;
const dashboardSectionTitleClass = 'flex items-center gap-2 font-display text-base font-black tracking-tight text-slate-100';
const dashboardSectionDescriptionClass = 'mt-1 text-sm font-medium leading-relaxed text-slate-400';
const dashboardPanelClass = 'rounded-xl border border-cyan-300/10 bg-[#0b1726]/66 p-4 text-slate-100 shadow-sm shadow-black/10 backdrop-blur-sm [&_.text-foreground]:!text-slate-100 [&_.text-muted-foreground]:!text-slate-400';
const dashboardListButtonClass = DARK_GLASS_CLASSES.listButton;
const dashboardMetricRowClass = `${DARK_GLASS_CLASSES.metricCard} p-3`;
const dashboardMutedTextClass = 'text-xs font-medium leading-relaxed text-slate-400';
const dashboardInsetPanelClass = 'rounded-xl border border-cyan-300/10 bg-[#0b1726]/72 text-slate-100 shadow-inner shadow-black/10 backdrop-blur-sm';
const dashboardSoftPanelClass = 'rounded-xl border border-cyan-300/10 bg-[#0b1726]/66 text-slate-100 shadow-sm shadow-black/10 backdrop-blur-sm';
const dashboardTileClass = 'rounded-lg border border-cyan-300/10 bg-[#0b1726]/66 text-slate-100 shadow-sm shadow-black/10';
const dashboardDividerBorderClass = 'border-cyan-300/10';
const dashboardBadgeClass = 'border-cyan-300/15 bg-[#0b1726]/85 text-slate-100 shadow-sm shadow-black/10';
const dashboardActionButtonClass = 'border-cyan-300/15 bg-[#0b1726]/85 text-slate-100 shadow-sm shadow-black/10 hover:border-orange-300/35 hover:bg-orange-300/10 hover:text-orange-100';
const dashboardSuccessBadgeClass = 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100 shadow-sm shadow-black/10';
const dashboardWarningBadgeClass = 'border-amber-300/30 bg-amber-300/15 text-white shadow-sm shadow-black/10';
const dashboardDangerBadgeClass = 'border-rose-300/25 bg-rose-300/10 text-rose-100 shadow-sm shadow-black/10';
const dashboardInfoBadgeClass = 'border-cyan-300/25 bg-cyan-300/10 text-cyan-100 shadow-sm shadow-black/10';
const dashboardAnnouncementBadgeClasses: Record<Announcement['category'], string> = {
  Urgent: 'border-rose-300/30 bg-rose-300/12 text-rose-100 shadow-sm shadow-black/10',
  Matchday: 'border-orange-300/30 bg-orange-300/15 text-orange-100 shadow-sm shadow-black/10',
  Training: 'border-amber-300/30 bg-amber-300/15 text-amber-100 shadow-sm shadow-black/10',
  Social: 'border-emerald-300/30 bg-emerald-300/15 text-emerald-100 shadow-sm shadow-black/10'
};
const dashboardAnnouncementAccentClasses: Record<Announcement['category'], string> = {
  Urgent: 'bg-rose-500',
  Matchday: 'bg-orange-400',
  Training: 'bg-amber-300',
  Social: 'bg-emerald-400'
};
const WEATHER_LOCATION_STORAGE_KEY = 'dumala_weather_location';
const WEATHER_PLACE_STORAGE_KEY = 'dumala_weather_place';
const STRATEGY_SNAPSHOT_STORAGE_KEYS = new Set<string>([
  STORAGE_KEYS.matchFormat,
  STORAGE_KEYS.formation,
  STORAGE_KEYS.playstyle,
  STORAGE_KEYS.defensiveStyle,
  STORAGE_KEYS.strategyContext,
  STORAGE_KEYS.captainId,
  STORAGE_KEYS.penaltyTakerId,
  STORAGE_KEYS.freeKickTakerId,
  STORAGE_KEYS.cornerTakerId,
  STORAGE_KEYS.lineup
]);

const weeklyScheduleWeeksSchema = z.record(z.string(), weeklyScheduleSchema);

const emptyWeeklySchedule = (): WeeklySchedule => ({
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: [],
  Sunday: []
});

const readDashboardTrainingSchedule = (weekKey: string, currentWeekKey: string): WeeklySchedule => {
  const scheduleWeeks = readJsonStorage(STORAGE_KEYS.weeklyScheduleWeeks, weeklyScheduleWeeksSchema, {}, 'Weekly training weeks');
  if (scheduleWeeks[weekKey]) return scheduleWeeks[weekKey];
  if (weekKey === currentWeekKey) {
    return readJsonStorage(STORAGE_KEYS.weeklySchedule, weeklyScheduleSchema, emptyWeeklySchedule(), 'Weekly training');
  }
  return emptyWeeklySchedule();
};

const selectWeeklyTrainingSummaries = (today = new Date()): TrainingSessionSummary[] => {
  const weekStart = getWeekStartDate(today);
  const weekKey = toDateKey(weekStart);
  const weekDaysMap = getWeekDaysMap(weekStart);
  const schedule = readDashboardTrainingSchedule(weekKey, weekKey);
  const metaMap = readJsonStorage(STORAGE_KEYS.trainingSessionMeta, trainingSessionMetaMapSchema, {}, 'Training session notes');
  const weekMeta = metaMap[weekKey] ?? {};

  return DAYS_OF_WEEK
    .map(day => buildTrainingSessionSummary({
      day,
      dateStr: weekDaysMap[day].dateStr,
      drills: schedule[day],
      meta: weekMeta[day]
    }))
    .filter(summary => summary.drills.length > 0);
};

interface DashboardViewProps {
  homeWorkspaceHeader?: ReactNode;
  teamInfo: TeamInfo;
  players: Player[];
  games: Game[];
  standings: Standing[];
  announcements: Announcement[];
  assessments: AssessmentSession[];
  cloudClubId?: string | null;
  teamChatAvailable?: boolean;
  onNavigate: (target: {
    primary: 'home' | 'squad' | 'tactics' | 'development' | 'league_updates';
    homeTab?: 'overview' | 'bulletins' | 'game_week';
    developmentTab?: 'assessments' | 'training' | 'assessment_guide';
    trainingDay?: DayName;
    leagueUpdatesTab?: 'league' | 'updates';
  }) => void;
  onOpenTrainingSession: (day: DayName) => void;
  onSelectPlayer: (player: Player) => void;
  onUpdateTeamInfo: (updated: TeamInfo) => void;
  activation?: ActivationState;
}

export default function DashboardView({ 
  homeWorkspaceHeader,
  teamInfo, 
  players, 
  games, 
  standings, 
  announcements, 
  assessments,
  cloudClubId,
  teamChatAvailable = false,
  onNavigate,
  onOpenTrainingSession,
  onSelectPlayer,
  onUpdateTeamInfo,
  activation
}: DashboardViewProps) {
  
  // Team logo management states
  const [showLogoPicker, setShowLogoPicker] = useState(false);
  const [clubNameInput, setClubNameInput] = useState(teamInfo.name);
  const [clubNameError, setClubNameError] = useState('');
  const [logoInputUrl, setLogoInputUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [logoStatus, setLogoStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [weatherAdvisory, setWeatherAdvisory] = useState<WeatherAdvisoryState>({
    status: 'idle',
    locationLabel: '',
    days: []
  });
  const [savedWeatherLocation, setSavedWeatherLocation] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(WEATHER_LOCATION_STORAGE_KEY) ?? '';
  });
  const [savedWeatherPlace, setSavedWeatherPlace] = useState<SavedWeatherPlace | null>(() => {
    if (typeof window === 'undefined') return null;
    return parseSavedWeatherPlace(window.localStorage.getItem(WEATHER_PLACE_STORAGE_KEY));
  });
  const [weatherLocationInput, setWeatherLocationInput] = useState(savedWeatherLocation);
  const [showWeatherSettings, setShowWeatherSettings] = useState(() => !savedWeatherLocation);
  const [weatherLocationSuggestions, setWeatherLocationSuggestions] = useState<WeatherLocationSuggestion[]>([]);
  const [weatherLocationSearchStatus, setWeatherLocationSearchStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [dailyPrepPanel, setDailyPrepPanel] = useState<'training' | 'match'>('match');
  const [trainingStorageRefreshKey, setTrainingStorageRefreshKey] = useState(0);
  const [gamePlanOpen, setGamePlanOpen] = useState(false);
  const [gamePlanStorageRefreshKey, setGamePlanStorageRefreshKey] = useState(0);
  const hasPlayerCollaborationFeatures = teamChatAvailable || Boolean(cloudClubId);

  const presetLogos = [
    { key: 'shield', label: 'Classic Shield', icon: Shield },
    { key: 'crown', label: 'Royal Crown', icon: Crown },
    { key: 'star', label: 'Star Victory', icon: Star },
    { key: 'flame', label: 'Apex Flame', icon: Flame },
    { key: 'target', label: 'Bullseye Target', icon: Target },
    { key: 'trophy', label: 'Gold Trophy', icon: Trophy },
  ];

  useEffect(() => {
    setClubNameInput(teamInfo.name);
    setClubNameError('');
  }, [teamInfo.name]);

  const renderLogo = (logoUrl: string | undefined, size = 64, className = "") => {
    if (!logoUrl) {
      return <Shield size={size} className={className} />;
    }
    
    if (logoUrl.startsWith('preset:')) {
      const key = logoUrl.replace('preset:', '');
      switch (key) {
        case 'shield': return <Shield size={size} className={className} />;
        case 'crown': return <Crown size={size} className={className} />;
        case 'star': return <Star size={size} className={className} />;
        case 'flame': return <Flame size={size} className={className} />;
        case 'target': return <Target size={size} className={className} />;
        case 'trophy': return <Trophy size={size} className={className} />;
        default: return <Shield size={size} className={className} />;
      }
    }
    
    return (
      <img 
        src={logoUrl} 
        alt="Team Logo" 
        className={`object-contain rounded-xl ${className}`}
        style={{ width: size, height: size }}
        onError={(e) => {
          e.currentTarget.src = "";
          e.currentTarget.className = "hidden";
        }}
        referrerPolicy="no-referrer"
      />
    );
  };

  const processFile = async (file: File) => {
    try {
      const logoUrl = await prepareLocalImageDataUrl(file, {
        maxDimension: 720,
        maxBytes: 420 * 1024,
        outputType: 'image/webp'
      });
      onUpdateTeamInfo({
        ...teamInfo,
        logoUrl
      });
      setLogoStatus('success');
      setTimeout(() => setLogoStatus('idle'), 2500);
    } catch (error) {
      setLogoStatus('error');
      alert(error instanceof LocalImageUploadError ? error.message : 'The selected logo could not be uploaded.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      void processFile(files[0]);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      void processFile(files[0]);
    }
  };

  const handlePresetSelect = (presetKey: string) => {
    onUpdateTeamInfo({
      ...teamInfo,
      logoUrl: `preset:${presetKey}`
    });
    setLogoStatus('success');
    setTimeout(() => setLogoStatus('idle'), 2500);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoInputUrl.trim()) return;
    onUpdateTeamInfo({
      ...teamInfo,
      logoUrl: logoInputUrl.trim()
    });
    setLogoStatus('success');
    setLogoInputUrl("");
    setTimeout(() => setLogoStatus('idle'), 2500);
  };

  const handleClubNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = clubNameInput.trim();
    if (!trimmedName) {
      setClubNameError('Club name is required.');
      return;
    }

    const normalizedCurrentName = teamInfo.name.trim().toLowerCase();
    const nameTaken = standings.some(team => {
      const normalizedStandingName = team.teamName.trim().toLowerCase();
      const isCurrentUserTeam = team.isUserTeam || normalizedStandingName === normalizedCurrentName;
      return !isCurrentUserTeam && normalizedStandingName === trimmedName.toLowerCase();
    });

    if (nameTaken) {
      setClubNameError('Another standings club already uses this name.');
      return;
    }

    onUpdateTeamInfo({
      ...teamInfo,
      name: trimmedName
    });
    setClubNameError('');
    setLogoStatus('success');
    setTimeout(() => setLogoStatus('idle'), 2500);
  };
  
  const nextMatch = useMemo(() => selectMatchDayPrepEvent(games), [games]);
  const todayDateKey = useMemo(() => toDateKey(new Date()), []);
  const weeklyTrainingSummaries = useMemo(
    () => selectWeeklyTrainingSummaries(new Date()),
    [games, trainingStorageRefreshKey]
  );
  const todayTrainingSummary = weeklyTrainingSummaries.find(summary => summary.dateStr === todayDateKey);
  const nextTrainingSummary = weeklyTrainingSummaries.find(summary => summary.dateStr >= todayDateKey);
  const dashboardTrainingSummary = todayTrainingSummary ?? nextTrainingSummary;
  const dashboardTrainingDay = dashboardTrainingSummary?.day ?? null;
  const activeDailyPrepPanel = dashboardTrainingSummary && (dailyPrepPanel === 'training' || !nextMatch)
    ? 'training'
    : 'match';

  useEffect(() => {
    setDailyPrepPanel(todayTrainingSummary ? 'training' : 'match');
  }, [todayTrainingSummary?.dateStr]);

  useEffect(() => {
    const refreshTrainingStorage = () => setTrainingStorageRefreshKey(key => key + 1);
    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key === STORAGE_KEYS.weeklySchedule
        || event.key === STORAGE_KEYS.weeklyScheduleWeeks
        || event.key === STORAGE_KEYS.trainingSessionMeta
      ) {
        refreshTrainingStorage();
      }
    };

    window.addEventListener('focus', refreshTrainingStorage);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('focus', refreshTrainingStorage);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const refreshGamePlanStorage = () => setGamePlanStorageRefreshKey(key => key + 1);
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.gamePlans) refreshGamePlanStorage();
    };

    window.addEventListener('focus', refreshGamePlanStorage);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('focus', refreshGamePlanStorage);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  const weatherLocationQuery = useMemo(() => {
    const candidates = [
      savedWeatherPlace?.label ?? savedWeatherLocation,
      nextMatch?.location,
      teamInfo.stadium,
      teamInfo.league
    ];
    return candidates.map(value => cleanLocationQuery(value ?? '')).find(Boolean) ?? '';
  }, [savedWeatherLocation, savedWeatherPlace?.label, nextMatch?.location, teamInfo.stadium, teamInfo.league]);

  const applyWeatherLocation = (location: string, place?: WeatherLocationSuggestion) => {
    const nextLocation = location.trim();
    setWeatherLocationInput(nextLocation);
    setSavedWeatherLocation(nextLocation);
    setWeatherLocationSuggestions([]);
    setWeatherLocationSearchStatus('idle');
    if (nextLocation) {
      window.localStorage.setItem(WEATHER_LOCATION_STORAGE_KEY, nextLocation);
      if (place) {
        const nextPlace: SavedWeatherPlace = {
          label: place.label,
          latitude: place.latitude,
          longitude: place.longitude
        };
        setSavedWeatherPlace(nextPlace);
        window.localStorage.setItem(WEATHER_PLACE_STORAGE_KEY, JSON.stringify(nextPlace));
      } else {
        setSavedWeatherPlace(null);
        window.localStorage.removeItem(WEATHER_PLACE_STORAGE_KEY);
      }
      setShowWeatherSettings(false);
    } else {
      setSavedWeatherPlace(null);
      window.localStorage.removeItem(WEATHER_LOCATION_STORAGE_KEY);
      window.localStorage.removeItem(WEATHER_PLACE_STORAGE_KEY);
      setShowWeatherSettings(true);
    }
  };

  const saveWeatherLocation = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyWeatherLocation(weatherLocationInput);
  };

  const clearWeatherLocation = () => {
    setWeatherLocationInput('');
    setSavedWeatherLocation('');
    setSavedWeatherPlace(null);
    setWeatherLocationSuggestions([]);
    setWeatherLocationSearchStatus('idle');
    setShowWeatherSettings(true);
    window.localStorage.removeItem(WEATHER_LOCATION_STORAGE_KEY);
    window.localStorage.removeItem(WEATHER_PLACE_STORAGE_KEY);
  };

  useEffect(() => {
    const query = weatherLocationInput.trim();
    if (!showWeatherSettings || query.length < 2) {
      setWeatherLocationSuggestions([]);
      setWeatherLocationSearchStatus('idle');
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      const loadSuggestions = async () => {
        setWeatherLocationSearchStatus('loading');
        try {
          const geocodeUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
          geocodeUrl.searchParams.set('name', query);
          geocodeUrl.searchParams.set('count', '5');
          geocodeUrl.searchParams.set('language', 'en');
          geocodeUrl.searchParams.set('format', 'json');
          const geocodeResponse = await fetch(geocodeUrl, { signal: controller.signal });
          if (!geocodeResponse.ok) throw new Error('Location suggestions failed.');
          const geocodeData = await geocodeResponse.json() as { results?: WeatherLocationResult[] };
          const seen = new Set<string>();
          const suggestions = (geocodeData.results ?? []).reduce<WeatherLocationSuggestion[]>((items, place) => {
            const label = formatWeatherLocation(place);
            if (!label || seen.has(label)) return items;
            seen.add(label);
            items.push({
              id: String(place.id ?? `${place.latitude}-${place.longitude}-${label}`),
              label,
              latitude: place.latitude,
              longitude: place.longitude
            });
            return items;
          }, []);
          setWeatherLocationSuggestions(suggestions);
          setWeatherLocationSearchStatus('ready');
        } catch (error) {
          if (controller.signal.aborted) return;
          setWeatherLocationSuggestions([]);
          setWeatherLocationSearchStatus('error');
        }
      };

      void loadSuggestions();
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [showWeatherSettings, weatherLocationInput]);

  useEffect(() => {
    if (!weatherLocationQuery) {
      setWeatherAdvisory({
        status: 'error',
        locationLabel: '',
        days: [],
        message: 'Add an event location or team stadium to show a weekly weather advisory.'
      });
      return;
    }

    const controller = new AbortController();
    const loadWeather = async () => {
      const savedPlaceMatchesQuery = savedWeatherPlace && cleanLocationQuery(savedWeatherPlace.label) === weatherLocationQuery;
      setWeatherAdvisory(prev => ({
        ...prev,
        status: 'loading',
        locationLabel: savedPlaceMatchesQuery ? savedWeatherPlace.label : weatherLocationQuery,
        message: undefined
      }));

      try {
        let place: Pick<WeatherLocationResult, 'latitude' | 'longitude' | 'name' | 'admin1' | 'country'> | undefined = savedPlaceMatchesQuery
          ? {
              latitude: savedWeatherPlace.latitude,
              longitude: savedWeatherPlace.longitude,
              name: savedWeatherPlace.label
            }
          : undefined;

        if (!place) {
          const lookupLocation = async (query: string) => {
            const geocodeUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
            geocodeUrl.searchParams.set('name', query);
            geocodeUrl.searchParams.set('count', '1');
            geocodeUrl.searchParams.set('language', 'en');
            geocodeUrl.searchParams.set('format', 'json');
            const geocodeResponse = await fetch(geocodeUrl, { signal: controller.signal });
            if (!geocodeResponse.ok) throw new Error('Weather location lookup failed.');
            const geocodeData = await geocodeResponse.json() as { results?: WeatherLocationResult[] };
            return geocodeData.results?.[0];
          };

          place = await lookupLocation(weatherLocationQuery);
          if (!place && weatherLocationQuery.includes(',')) {
            place = await lookupLocation(weatherLocationQuery.split(',')[0].trim());
          }
        }

        if (!place) throw new Error('Weather location was not found.');

        const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
        forecastUrl.searchParams.set('latitude', String(place.latitude));
        forecastUrl.searchParams.set('longitude', String(place.longitude));
        forecastUrl.searchParams.set('current', 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m');
        forecastUrl.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max');
        forecastUrl.searchParams.set('timezone', 'auto');
        forecastUrl.searchParams.set('forecast_days', '7');

        const forecastResponse = await fetch(forecastUrl, { signal: controller.signal });
        if (!forecastResponse.ok) throw new Error('Weather forecast failed.');
        const forecastData = await forecastResponse.json() as {
          current?: {
            temperature_2m?: number;
            relative_humidity_2m?: number;
            precipitation?: number;
            weather_code?: number;
            wind_speed_10m?: number;
          };
          daily?: {
            time?: string[];
            weather_code?: number[];
            temperature_2m_max?: number[];
            temperature_2m_min?: number[];
            precipitation_probability_max?: number[];
            wind_speed_10m_max?: number[];
          };
        };

        const days = (forecastData.daily?.time ?? []).map((date, index) => ({
          date,
          code: forecastData.daily?.weather_code?.[index] ?? 0,
          high: Math.round(forecastData.daily?.temperature_2m_max?.[index] ?? 0),
          low: Math.round(forecastData.daily?.temperature_2m_min?.[index] ?? 0),
          rainChance: Math.round(forecastData.daily?.precipitation_probability_max?.[index] ?? 0),
          wind: Math.round(forecastData.daily?.wind_speed_10m_max?.[index] ?? 0)
        }));

        setWeatherAdvisory({
          status: 'ready',
          locationLabel: formatWeatherLocation(place),
          current: {
            temperature: Math.round(forecastData.current?.temperature_2m ?? days[0]?.high ?? 0),
            humidity: Math.round(forecastData.current?.relative_humidity_2m ?? 0),
            precipitation: forecastData.current?.precipitation ?? 0,
            wind: Math.round(forecastData.current?.wind_speed_10m ?? days[0]?.wind ?? 0),
            code: forecastData.current?.weather_code ?? days[0]?.code ?? 0
          },
          days
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setWeatherAdvisory({
          status: 'error',
          locationLabel: weatherLocationQuery,
          days: [],
          message: error instanceof Error ? error.message : 'Weather advisory is unavailable right now.'
        });
      }
    };

    void loadWeather();

    return () => controller.abort();
  }, [savedWeatherPlace, weatherLocationQuery]);

  const latestAssessmentByPlayerId = useMemo(() => {
    const sorted = [...assessments].sort((a, b) => {
      const ad = new Date(a.assessmentDate).getTime();
      const bd = new Date(b.assessmentDate).getTime();
      if (ad !== bd) return bd - ad;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const map = new Map<string, AssessmentSession>();
    for (const s of sorted) {
      if (!map.has(s.playerId)) map.set(s.playerId, s);
    }
    return map;
  }, [assessments]);

  const topProspects = useMemo(() => {
    return [...players]
      .map(p => ({ player: p, session: latestAssessmentByPlayerId.get(p.id) }))
      .filter((x): x is { player: Player; session: AssessmentSession } => !!x.session)
      .sort((a, b) => b.session.ovr - a.session.ovr)
      .slice(0, 5);
  }, [latestAssessmentByPlayerId, players]);

  const topImprovers = useMemo(() => {
    return [...players]
      .map(p => ({ player: p, session: latestAssessmentByPlayerId.get(p.id) }))
      .filter((x): x is { player: Player; session: AssessmentSession } => !!x.session)
      .sort((a, b) => (b.session.deltas.ovrDelta ?? 0) - (a.session.deltas.ovrDelta ?? 0))
      .slice(0, 5);
  }, [latestAssessmentByPlayerId, players]);

  const recentAssessments = useMemo(() => {
    return [...assessments]
      .sort((a, b) => {
        const ad = new Date(a.assessmentDate).getTime();
        const bd = new Date(b.assessmentDate).getTime();
        if (ad !== bd) return bd - ad;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 6);
  }, [assessments]);

  // Use the same ordering rules as the League table.
  const rankedStandings = sortStandings(standings);
  const userTeam = findUserStanding(rankedStandings, teamInfo.name);
  const leagueRank = userTeam?.rank;
  const nextOpponentStanding = nextMatch
    ? rankedStandings.find(row => row.teamName.trim().toLowerCase() === nextMatch.opponent.trim().toLowerCase())
    : undefined;
  const activePlayersCount = players.filter(player => player.registrationStatus === 'Active').length;
  const unavailablePlayersCount = Math.max(0, players.length - activePlayersCount);
  const nextMatchChecklist = nextMatch ? getMatchPrepChecklist(nextMatch) : [];
  const nextMatchCountdown = nextMatch ? getCalendarEventCountdown(nextMatch) : '';
  const nextMatchDateTime = nextMatch ? formatCalendarEventDateTime(nextMatch) : '';
  const savedGamePlans = useMemo(() => (
    readJsonStorage(STORAGE_KEYS.gamePlans, gamePlansSchema, [], 'Tactics game plans') as GamePlan[]
  ), [gamePlanStorageRefreshKey]);
  const nextMatchGamePlan = nextMatch
    ? savedGamePlans.find(plan => plan.gameId === nextMatch.id)
      ?? savedGamePlans.find(plan => (
        plan.opponent.trim().toLowerCase() === nextMatch.opponent.trim().toLowerCase()
        && plan.gameDate === nextMatch.date
      ))
    : undefined;
  const nextMatchPrepTone = nextMatch && nextMatch.type !== 'Training' && nextMatch.type !== 'Meeting'
    ? nextOpponentStanding
      ? `Opponent sits #${nextOpponentStanding.rank} with ${nextOpponentStanding.points} pts`
      : 'Add opponent to League table for deeper intel'
    : nextMatch?.type === 'Training'
      ? `${activePlayersCount} active players available for session planning`
      : 'Staff and player briefing event';
  
  // Calculate team's point trend over the last 10 games played
  const userCompletedGames = games
    .filter(g => g.status === 'Completed')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const opponentsPool = standings
    .filter(t => t.teamName.toLowerCase() !== (userTeam?.teamName || "").toLowerCase())
    .map(t => t.teamName);

  const { won = 0, drawn = 0, lost = 0 } = userTeam || {};

  const completedOutcomes = userCompletedGames.map(g => {
    const our = g.ourScore ?? 0;
    const opp = g.opponentScore ?? 0;
    if (our > opp) return { outcome: 'W' as const, points: 3 };
    if (our === opp) return { outcome: 'D' as const, points: 1 };
    return { outcome: 'L' as const, points: 0 };
  });

  const W_completed = completedOutcomes.filter(o => o.outcome === 'W').length;
  const D_completed = completedOutcomes.filter(o => o.outcome === 'D').length;
  const L_completed = completedOutcomes.filter(o => o.outcome === 'L').length;

  const W_rem = Math.max(0, won - W_completed);
  const D_rem = Math.max(0, drawn - D_completed);
  const L_rem = Math.max(0, lost - L_completed);

  const remOutcomes: { outcome: 'W' | 'D' | 'L'; points: number }[] = [];
  let w_left = W_rem, d_left = D_rem, l_left = L_rem;
  const remTotal = w_left + d_left + l_left;

  for (let i = 0; i < remTotal; i++) {
    if (i % 3 === 0 && d_left > 0) {
      remOutcomes.push({ outcome: 'D', points: 1 });
      d_left--;
    } else if (i % 5 === 0 && l_left > 0) {
      remOutcomes.push({ outcome: 'L', points: 0 });
      l_left--;
    } else if (w_left > 0) {
      remOutcomes.push({ outcome: 'W', points: 3 });
      w_left--;
    } else if (d_left > 0) {
      remOutcomes.push({ outcome: 'D', points: 1 });
      d_left--;
    } else if (l_left > 0) {
      remOutcomes.push({ outcome: 'L', points: 0 });
      l_left--;
    }
  }

  const totalOutcomes = [...remOutcomes, ...completedOutcomes];
  let cumulativePoints = 0;
  
  const pointsHistory = totalOutcomes.map((o, idx) => {
    cumulativePoints += o.points;
    const opponent = idx >= remOutcomes.length 
      ? userCompletedGames[idx - remOutcomes.length].opponent 
      : (opponentsPool[idx % opponentsPool.length] || "League Opponent");
    return {
      gameNumber: idx + 1,
      opponent,
      outcome: o.outcome,
      matchPoints: o.points,
      points: cumulativePoints,
    };
  });

  const chartData = pointsHistory.slice(-10).map((d) => ({
    name: `Game ${d.gameNumber}`,
    points: d.points,
    outcome: d.outcome,
    opponent: d.opponent,
    matchPoints: d.matchPoints
  }));

  // Leaderboards: Sort players for goals (points), assists, clean sheets
  const topScorers = [...players]
    .filter(p => p.points > 0)
    .sort((a,b) => b.points - a.points)
    .slice(0, 3);

  const topAssists = [...players]
    .filter(p => p.assists > 0)
    .sort((a,b) => b.assists - a.assists)
    .slice(0, 3);

  const topGoalkeepers = [...players]
    .filter(p => p.position === 'Goalkeeper' || p.position === 'Defender')
    .sort((a,b) => b.cleanSheetsOrRebounds - a.cleanSheetsOrRebounds)
    .slice(0, 3);
  const [strategySnapshotRefreshKey, setStrategySnapshotRefreshKey] = useState(0);
  const [strategySnapshotSyncedAt, setStrategySnapshotSyncedAt] = useState(() => Date.now());
  const todayWeather = weatherAdvisory.days[0];
  const weatherTone = getWeatherAdvisoryTone(todayWeather, weatherAdvisory.current?.wind);
  const strategySnapshot = useMemo(() => readStrategySnapshot(players), [players, strategySnapshotRefreshKey]);
  const strategySetPieceSummary = [
    strategySnapshot.cornerTaker ? `CK ${strategySnapshot.cornerTaker.name}` : '',
    strategySnapshot.freeKickTaker ? `FK ${strategySnapshot.freeKickTaker.name}` : '',
    strategySnapshot.penaltyTaker ? `PK ${strategySnapshot.penaltyTaker.name}` : ''
  ].filter(Boolean).join(' / ') || 'Assign roles';
  const strategyLeadershipSummary = strategySnapshot.captain ? `Captain ${strategySnapshot.captain.name}` : 'Select captain';
  const strategyContextSummary = [
    STRATEGY_CONTEXT_LABELS.matchState[strategySnapshot.context.matchState],
    STRATEGY_CONTEXT_LABELS.riskLevel[strategySnapshot.context.riskLevel],
    STRATEGY_CONTEXT_LABELS.opponentBehavior[strategySnapshot.context.opponentBehavior]
  ].join(' / ');
  const strategySyncedLabel = new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(strategySnapshotSyncedAt));

  useEffect(() => {
    const refreshStrategySnapshot = () => {
      setStrategySnapshotRefreshKey(key => key + 1);
      setStrategySnapshotSyncedAt(Date.now());
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshStrategySnapshot();
    };
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && STRATEGY_SNAPSHOT_STORAGE_KEYS.has(event.key)) refreshStrategySnapshot();
    };

    window.addEventListener('focus', refreshStrategySnapshot);
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', refreshStrategySnapshot);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div
      id="dashboard-view-container"
      className={DARK_GLASS_CLASSES.dashboardShell}
      style={{ ...DARK_GLASS_THEME_STYLE, ...DARK_GLASS_DASHBOARD_SURFACE_STYLE }}
    >

      {homeWorkspaceHeader}

      {activation && <GettingStartedChecklist state={activation} onNavigate={onNavigate} />}

      <Dialog open={gamePlanOpen} onOpenChange={setGamePlanOpen}>
        <DialogContent className="grid max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-[1180px] grid-rows-[auto_minmax(0,1fr)_auto] gap-4 overflow-y-auto border-cyan-300/10 bg-[#07111f] p-4 text-slate-100 shadow-2xl shadow-black/40 sm:p-5 lg:h-[min(660px,88vh)] lg:overflow-hidden">
          <DialogHeader className="pr-9">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2 text-white">
                  <ClipboardList size={18} className="text-orange-300" aria-hidden="true" />
                  {nextMatch ? `Game Plan: ${nextMatch.opponent}` : 'Game Plan'}
                </DialogTitle>
                <DialogDescription className="mt-1 text-slate-400">
                  {nextMatch
                    ? `${nextMatchDateTime} at ${nextMatch.location || 'venue to confirm'}`
                    : 'Add an upcoming match to prepare an opponent-specific plan.'}
                </DialogDescription>
              </div>
              {nextMatchGamePlan && (
                <div className="flex max-w-full flex-wrap gap-1.5 lg:max-w-[34rem] lg:justify-end">
                  {[
                    { label: 'Shape', value: nextMatchGamePlan.formation },
                    { label: 'Vs', value: nextMatchGamePlan.opponentFormation },
                    { label: 'Attack', value: nextMatchGamePlan.playstyle },
                    { label: 'Defense', value: nextMatchGamePlan.defensiveStyle }
                  ].map(item => (
                    <span key={item.label} className="inline-flex max-w-[10rem] items-center gap-1.5 rounded-full border border-cyan-300/10 bg-white/[0.035] px-2.5 py-1.5 text-[10px] font-black text-slate-100">
                      <span className="text-slate-500">{item.label}</span>
                      <span className="truncate">{item.value}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </DialogHeader>

          {nextMatch && nextMatchGamePlan ? (
            <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-12">
              <aside className="min-h-0 rounded-2xl border border-orange-300/12 bg-[linear-gradient(145deg,rgba(249,115,22,0.13),rgba(14,165,233,0.06)_44%,rgba(15,23,42,0.2))] p-4 lg:col-span-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-orange-100">Opponent briefing</span>
                <h4 className="mt-2 font-display text-3xl font-black leading-tight text-white">{nextMatchGamePlan.opponent}</h4>
                <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-slate-300">{nextMatchGamePlan.location || 'Venue to confirm'}</p>
                <div className="mt-4 flex flex-wrap gap-1.5 text-[10px] font-bold text-slate-300">
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1">{nextMatchGamePlan.gameType}</span>
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1">{nextMatchGamePlan.matchFormat}</span>
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1">{nextMatchGamePlan.phase}</span>
                </div>

                <div className="mt-6 space-y-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Leaders</span>
                  <div className="space-y-2">
                    {[
                      ['Captain', nextMatchGamePlan.roles.captain || 'Unassigned'],
                      ['Free kick', nextMatchGamePlan.roles.freeKickTaker || 'Unassigned'],
                      ['Corner', nextMatchGamePlan.roles.cornerTaker || 'Unassigned'],
                      ['Penalty', nextMatchGamePlan.roles.penaltyTaker || 'Unassigned']
                    ].map(([label, value]) => (
                      <div key={label} className="flex min-w-0 items-center justify-between gap-3 border-b border-white/[0.06] pb-2 last:border-b-0">
                        <span className="shrink-0 text-[8px] font-black uppercase tracking-widest text-slate-500">{label}</span>
                        <span className="min-w-0 truncate text-[11px] font-bold text-slate-100">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-cyan-300/10 bg-[#07111f]/45 p-3">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Board</span>
                    <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-300">
                      {nextMatchGamePlan.board.drawingPaths.length} marking{nextMatchGamePlan.board.drawingPaths.length === 1 ? '' : 's'} / ball {nextMatchGamePlan.board.showBall ? 'on' : 'off'} / wall {nextMatchGamePlan.board.showWall ? 'on' : 'off'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-cyan-300/10 bg-[#07111f]/45 p-3">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Notes</span>
                    <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-relaxed text-slate-300">
                      {nextMatchGamePlan.notes[0]?.title || 'No notes saved.'}
                    </p>
                  </div>
                </div>
              </aside>

              <section className="relative min-h-0 overflow-hidden rounded-2xl border border-cyan-300/10 bg-[linear-gradient(135deg,rgba(99,102,241,0.1),rgba(16,185,129,0.08)_45%,rgba(7,17,31,0.86))] p-5 lg:col-span-5">
                <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent" />
                <span className="text-[9px] font-black uppercase tracking-widest text-cyan-100">Match strategy</span>
                <div className="mt-4 grid gap-5">
                  <div className="border-l-2 border-indigo-300/35 pl-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-200">Attack</span>
                    <h4 className="mt-1 text-xl font-black text-white">{nextMatchGamePlan.recommendation.attackTitle}</h4>
                    <p className="mt-2 line-clamp-4 text-sm font-semibold leading-relaxed text-slate-300">{nextMatchGamePlan.recommendation.attackIntent}</p>
                  </div>
                  <div className="border-l-2 border-emerald-300/35 pl-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-200">Defense</span>
                    <h4 className="mt-1 text-xl font-black text-white">{nextMatchGamePlan.recommendation.defenseTitle}</h4>
                    <p className="mt-2 line-clamp-4 text-sm font-semibold leading-relaxed text-slate-300">{nextMatchGamePlan.recommendation.defenseIntent}</p>
                  </div>
                </div>

                <div className="mt-5 border-t border-cyan-300/10 pt-4">
                  <div className="flex flex-wrap gap-1.5">
                    {nextMatchGamePlan.recommendation.cues.slice(0, 6).map(cue => (
                      <span key={cue} className="rounded-full border border-orange-300/15 bg-orange-300/10 px-2.5 py-1 text-[10px] font-bold text-orange-100">{cue}</span>
                    ))}
                  </div>
                  <p className="mt-3 line-clamp-2 text-[11px] font-semibold leading-relaxed text-amber-100/85">
                    Watch: {nextMatchGamePlan.recommendation.watchout}
                  </p>
                </div>
              </section>

              <aside className="min-h-0 rounded-2xl border border-cyan-300/10 bg-[#0b1726]/58 p-4 lg:col-span-4">
                <div className="flex items-center justify-between gap-2 border-b border-cyan-300/10 pb-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Starting lineup</span>
                  <span className="rounded-full border border-orange-300/15 bg-orange-300/10 px-2.5 py-1 text-[9px] font-black text-orange-100">{nextMatchGamePlan.lineup.length} players</span>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-x-3 gap-y-1.5 sm:grid-cols-2">
                  {nextMatchGamePlan.lineup.slice(0, 12).map((player, index) => (
                    <div key={`${player.slot}-${player.playerId}`} className="grid min-w-0 grid-cols-[1.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 border-b border-white/[0.055] py-1.5 last:border-b-0">
                      <span className="text-[9px] font-black text-slate-600">{String(index + 1).padStart(2, '0')}</span>
                      <span className="min-w-0 truncate text-[11px] font-bold text-slate-100">{player.name}</span>
                      <span className="text-right text-[8px] font-black uppercase text-orange-200">{player.role}</span>
                    </div>
                  ))}
                  {nextMatchGamePlan.lineup.length === 0 && (
                    <p className="text-xs font-semibold text-slate-500">No lineup saved yet.</p>
                  )}
                </div>
              </aside>
            </div>
          ) : (
            <div className="flex min-h-[20rem] flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-[#0b1726]/72 p-6 text-center">
              <ClipboardList size={22} className="mx-auto text-slate-500" aria-hidden="true" />
              <h4 className="mt-3 font-display text-base font-black text-white">No saved plan for this opponent yet</h4>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
                Open the Tactical Board, choose the upcoming opponent from the dropdown, set the tactics, then save the Game Plan.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-cyan-300/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {nextMatchGamePlan ? `Saved ${new Date(nextMatchGamePlan.updatedAt).toLocaleString()}` : 'Opponent plan required'}
            </span>
            <Button
              type="button"
              onClick={() => {
                setGamePlanOpen(false);
                onNavigate({ primary: 'tactics' });
              }}
              className="h-9 rounded-xl bg-orange-300 px-3 text-xs font-black text-slate-950 hover:bg-orange-200"
            >
              Open Tactical Board <ArrowRight size={13} />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hero Header Banner */}
      <div
        className="min-h-[172px] p-5 md:px-7 md:py-6 rounded-2xl text-white relative overflow-hidden flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6 border border-white/[0.15]"
        style={dashboardHeroStyle}
      >
        <div className="absolute -right-8 -top-10 bottom-0 opacity-[0.08] hidden md:flex items-center pointer-events-none">
          {renderLogo(teamInfo.logoUrl, 260, "stroke-[1.5] text-white")}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5 md:gap-6 relative z-10 w-full md:w-auto">
          {/* logo circle uploader with overlay action button */}
          <div className="relative group shrink-0">
            <div 
              onClick={() => setShowLogoPicker(!showLogoPicker)}
              className="w-[6.8rem] h-[6.8rem] border border-white/[0.24] rounded-2xl flex items-center justify-center p-3 hover:border-white/[0.45] hover:scale-[1.02] cursor-pointer transition-all"
              style={dashboardLogoTileStyle}
            >
              {renderLogo(teamInfo.logoUrl, 78, "text-white select-none drop-shadow-sm")}
            </div>
            <Button
              id="edit-logo-trigger-btn"
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowLogoPicker(!showLogoPicker)}
              className="absolute -bottom-1.5 -right-1.5 size-8 rounded-full border border-orange-300/30 bg-orange-400 text-slate-950 shadow-md shadow-black/25 hover:scale-105 hover:bg-orange-300 hover:text-slate-950 active:scale-95 [&_svg]:size-3"
              title="Edit Team Logo"
              aria-label="Edit team logo"
            >
              <Edit size={12} />
            </Button>
          </div>

          <div className="space-y-3 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="bg-amber-300 text-slate-950 text-[10px] uppercase font-black px-2.5 py-1 rounded-full tracking-wider shadow-sm">
                Club Administration
              </span>
              <span className="text-indigo-100/[0.85] text-xs font-black">
                Since {teamInfo.founded}
              </span>
            </div>
            <h2 id="team-hero-name" className="text-3xl md:text-5xl font-display font-black tracking-tight text-white drop-shadow-sm">{teamInfo.name}</h2>
            
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 text-xs text-white pt-0.5">
              <span className="flex items-center gap-1.5 bg-white/[0.13] border border-white/[0.12] px-2.5 py-1.5 rounded-md shadow-sm backdrop-blur-sm">
                <Trophy size={12} className="text-amber-300" aria-hidden="true" />
                <span className="font-semibold">{teamInfo.league}</span>
              </span>
              <span className="flex items-center gap-1.5 bg-white/[0.13] border border-white/[0.12] px-2.5 py-1.5 rounded-md shadow-sm backdrop-blur-sm">
                <MapPin size={12} className="text-cyan-200" aria-hidden="true" />
                <span className="font-semibold">Stadium: {teamInfo.stadium}</span>
              </span>
              <span className="flex items-center gap-1.5 bg-white/[0.13] border border-white/[0.12] px-2.5 py-1.5 rounded-md shadow-sm backdrop-blur-sm">
                <ClipboardList size={12} className="text-emerald-200" aria-hidden="true" />
                <span className="font-semibold">Coach: {teamInfo.coach}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 relative z-10 shrink-0 w-full sm:w-auto md:mr-1">
          <div className="relative overflow-hidden border border-white/[0.2] rounded-2xl px-5 py-4 text-center min-w-28 text-white backdrop-blur-md" style={dashboardStatTileStyle}>
            <div className="absolute inset-x-0 top-0 h-px bg-white/[0.45]" />
            <span id="dashboard-league-rank" className="relative text-2xl md:text-3xl font-display font-black text-white drop-shadow-sm">
              {leagueRank ? `#${leagueRank}` : 'N/A'}
            </span>
            <span className="relative block text-[10px] text-white/85 uppercase font-black mt-1 tracking-wider">League Rank</span>
          </div>
          <div className="relative overflow-hidden border border-white/[0.2] rounded-2xl px-5 py-4 text-center min-w-28 text-white backdrop-blur-md" style={dashboardStatTileStyle}>
            <div className="absolute inset-x-0 top-0 h-px bg-white/[0.45]" />
            <span className="relative text-2xl md:text-3xl font-display font-black text-white drop-shadow-sm">{players.length}</span>
            <span className="relative block text-[10px] text-white/85 uppercase font-black mt-1 tracking-wider">Registered</span>
          </div>
        </div>
      </div>

      {hasPlayerCollaborationFeatures && (
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-2" aria-label="Player collaboration tools">
          {teamChatAvailable && (
            <div className={`${dashboardCardClass} flex flex-col justify-between gap-4`}>
              <div className={dashboardHeaderClass}>
                <h3 className={dashboardSectionTitleClass}>
                  <Megaphone className="text-cyan-200" size={18} aria-hidden="true" /> Team chat
                </h3>
                <p className={dashboardSectionDescriptionClass}>
                  Keep coach and player messages in the official team channel with staff moderation controls.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={cloudClubId && teamChatAvailable ? 'success' : 'outline'} className={cloudClubId && teamChatAvailable ? dashboardSuccessBadgeClass : dashboardBadgeClass}>
                    {cloudClubId && teamChatAvailable ? 'Ready in Squad' : cloudClubId ? 'Chat unavailable' : 'Cloud team required'}
                  </Badge>
                  <Badge variant="info" className={dashboardInfoBadgeClass}>Shared channel</Badge>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onNavigate({ primary: 'squad' })}
                  disabled={!cloudClubId || !teamChatAvailable}
                  className="rounded-xl border-cyan-300/15 bg-[#0b1726]/85 text-xs font-black text-slate-100 hover:border-orange-300/30 hover:bg-orange-300/10 hover:text-orange-100"
                >
                  Open chat <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* COMPACT INTERACTIVE LOGO CUSTOMIZATION BOARD (Dropping panel) */}
      <AnimatePresence>
        {showLogoPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden rounded-2xl border border-cyan-300/10 bg-[#07111f]/92 shadow-lg shadow-black/20 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-cyan-300/10 p-5">
              <div className="flex items-center gap-2.5">
                <Trophy size={16} className="text-amber-400" />
                <div>
                  <h4 className="text-sm font-display font-black text-white uppercase tracking-wide">
                    Manage Team Logo & Identity
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Upload an emblem file, paste a link coordinates, or choose from custom-designed vector badges.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowLogoPicker(false)}
                className={DARK_GLASS_CLASSES.secondaryActionButton}
              >
                Close Editor
              </Button>
            </div>

            <div className="p-5 space-y-5">
              <form onSubmit={handleClubNameSubmit} className={dashboardPanelClass}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                  <div className="min-w-0 flex-1">
                    <Label htmlFor="club-name-editor" className="block text-amber-400">
                      Club Name
                    </Label>
                    <Input
                      id="club-name-editor"
                      value={clubNameInput}
                      onChange={e => {
                        setClubNameInput(e.target.value);
                        setClubNameError('');
                      }}
                      className={`mt-2 rounded-xl bg-slate-900 font-black text-slate-100 placeholder:text-slate-600 ${
                        clubNameError ? 'border-rose-500 focus-visible:ring-rose-500/30' : 'border-slate-800 focus-visible:ring-amber-400/30'
                      }`}
                      placeholder="Enter club name"
                      aria-invalid={Boolean(clubNameError)}
                      aria-describedby="club-name-editor-help"
                    />
                    <p id="club-name-editor-help" className={`mt-1.5 text-[10px] font-semibold ${clubNameError ? 'text-rose-300' : 'text-slate-500'}`}>
                      {clubNameError || 'This name syncs with your user-team row in League Standings.'}
                    </p>
                  </div>
                  <Button
                    type="submit"
                    disabled={clubNameInput.trim() === teamInfo.name.trim()}
                    className="rounded-xl bg-amber-400 text-xs font-black uppercase tracking-wider text-slate-950 shadow-md hover:bg-amber-300"
                  >
                    <Check size={13} /> Save Name
                  </Button>
                </div>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Option 1: Vector Preset Badges */}
              <div className="md:col-span-4 space-y-3">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
                  🛡️ Vector Preset Glyphs
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {presetLogos.map((preset) => {
                    const PresetIcon = preset.icon;
                    const isActive = teamInfo.logoUrl === `preset:${preset.key}` || (!teamInfo.logoUrl && preset.key === 'shield');
                    
                    return (
                      <Button
                        key={preset.key}
                        type="button"
                        variant="ghost"
                        onClick={() => handlePresetSelect(preset.key)}
                        className={`h-auto min-w-0 flex-col rounded-xl border p-3 whitespace-normal [&_svg]:size-6 ${
                          isActive 
                            ? 'bg-amber-400/10 border-amber-400 text-amber-400' 
                            : 'bg-slate-950 border-slate-800/85 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                        title={preset.label}
                      >
                        <PresetIcon size={24} />
                        <span className="text-[9px] font-bold tracking-tight truncate w-full text-center">
                          {preset.label.split(' ')[1]}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Option 2: Image drag-and-drop Box */}
              <div className="md:col-span-4 space-y-3">
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">
                  📁 File System Uploader
                </span>
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer flex flex-col items-center justify-center gap-2 transition-all h-[115px] ${
                    dragOver 
                      ? 'border-emerald-400 bg-emerald-500/5' 
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                  }`}
                >
                  <Label htmlFor="logo-file-picker" className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 normal-case tracking-normal">
                    <Upload size={20} className={dragOver ? 'text-emerald-400 animate-bounce' : 'text-slate-500'} />
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black text-slate-300 block">
                        Drag or click file
                      </span>
                      <span className="text-[9px] text-slate-500 block">
                        PNG, JPG, SVG up to 1.5MB
                      </span>
                    </div>
                  </Label>
                  <Input
                    id="logo-file-picker" 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                </div>
              </div>

              {/* Option 3: External URL Paste */}
              <div className="md:col-span-4 space-y-3">
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider block">
                  🔗 Web Image Address Link
                </span>
                
                <form onSubmit={handleUrlSubmit} className="space-y-2">
                  <div className="relative">
                    <Input
                      id="logo-url-editor"
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={logoInputUrl}
                      onChange={e => setLogoInputUrl(e.target.value)}
                      className="rounded-xl border-slate-800 bg-slate-950 pl-8 pr-3 text-xs font-semibold text-slate-200 placeholder:text-slate-600 focus-visible:ring-indigo-500/30"
                      aria-label="Team logo image URL"
                    />
                    <div className="absolute left-2.5 top-3 text-slate-500">
                      <Link size={13} />
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={!logoInputUrl.trim()}
                    className="w-full rounded-xl bg-indigo-600 text-xs font-black text-white shadow-md hover:bg-indigo-700"
                  >
                    <Check size={13} /> Link Emblem URL
                  </Button>
                </form>
              </div>
              </div>
            </div>

            {/* Notification tray */}
            {logoStatus === 'success' && (
              <div className="bg-emerald-950/40 border-t border-emerald-900 px-5 py-2.5 text-center text-xs font-bold text-emerald-400 font-mono flex items-center justify-center gap-1.5">
                <Check size={14} /> Team club identity synced and saved successfully!
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid: Next Clash Spotlight & Latest Announcement notices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Daily Prep (Left col 7) */}
        <div className={`order-1 lg:col-span-7 flex flex-col justify-between ${dashboardCardClass}`}>
          <div>
            <div className={`${dashboardHeaderClass} flex items-start justify-between gap-3`}>
              <div>
                <h3 className={dashboardSectionTitleClass}>
                  <Calendar size={18} className={activeDailyPrepPanel === 'training' ? 'text-emerald-300' : 'text-orange-300'} aria-hidden="true" />
                  {activeDailyPrepPanel === 'training' ? (todayTrainingSummary ? "Today's Training" : 'Next Training') : 'Match Day Prep'}
                </h3>
                <p className={dashboardSectionDescriptionClass}>
                  {activeDailyPrepPanel === 'training'
                    ? 'Daily session agenda, key drills, equipment, and coach cues.'
                    : 'Next event details, location, and coach directives.'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="flex rounded-full border border-slate-500/15 bg-[#07111f]/80 p-1">
                  {[
                    { id: 'training' as const, label: 'Training' },
                    { id: 'match' as const, label: 'Match Prep' }
                  ].map(option => (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={activeDailyPrepPanel === option.id}
                      onClick={() => setDailyPrepPanel(option.id)}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-black transition-colors ${
                        activeDailyPrepPanel === option.id
                          ? option.id === 'training'
                            ? 'bg-emerald-300 text-slate-950'
                            : 'bg-orange-300 text-slate-950'
                          : 'text-slate-400 hover:text-slate-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {activeDailyPrepPanel === 'training' && dashboardTrainingSummary ? (
              <div className="mt-4 overflow-hidden rounded-3xl border border-emerald-300/16 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.2),transparent_34%),linear-gradient(135deg,rgba(7,17,31,0.96),rgba(7,38,36,0.9)_54%,rgba(14,24,38,0.96))] shadow-lg shadow-black/20">
                <div className="grid gap-4 px-4 py-3.5 sm:px-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-stretch">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-100">
                        {todayTrainingSummary ? 'Today' : dashboardTrainingSummary.day}
                      </span>
                      <span className="rounded-full border border-slate-500/15 bg-white/[0.035] px-2 py-0.5 text-[9px] font-black uppercase text-slate-300">
                        {dashboardTrainingSummary.status === 'in_progress' ? 'In progress' : dashboardTrainingSummary.status}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{dashboardTrainingSummary.dateStr}</span>
                    </div>
                    <div className="mt-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-100/70">Training brief</span>
                      <h4 className="mt-0.5 truncate font-display text-3xl font-black tracking-tight text-white">
                        {dashboardTrainingSummary.day} Session
                      </h4>
                      <p className="mt-1 max-w-xl text-sm font-semibold leading-relaxed text-slate-300">
                        {dashboardTrainingSummary.drills.length} drills, {dashboardTrainingSummary.duration} minutes, {dashboardTrainingSummary.loadPoints} load points
                      </p>
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-col justify-between gap-3 border-t border-white/[0.07] pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
                    <div className="min-w-0">
                      <span className="text-[8px] font-black uppercase tracking-wider text-emerald-100/70">Start with</span>
                      <strong className="mt-1 block line-clamp-2 text-sm font-black leading-tight text-slate-100">
                        {dashboardTrainingSummary.drills[0]?.name || 'Open the session'}
                      </strong>
                      <span className="mt-1 block text-[10px] font-bold text-slate-500">
                        {dashboardTrainingSummary.drills[0]?.durationMinutes ?? 10} min opening block
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-2.5">
                      {[
                        { label: 'Min', value: dashboardTrainingSummary.duration },
                        { label: 'Load', value: dashboardTrainingSummary.loadPoints },
                        { label: 'Done', value: `${dashboardTrainingSummary.completedCount}/${dashboardTrainingSummary.drills.length}` }
                      ].map(item => (
                        <div key={item.label} className="min-w-0">
                          <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">{item.label}</span>
                          <strong className="mt-0.5 block truncate text-sm font-black text-slate-100">{item.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/[0.07] px-4 py-3 sm:px-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-100">
                      <ClipboardList size={13} aria-hidden="true" /> Order of work
                    </span>
                    <span className="max-w-[18rem] truncate text-[10px] font-bold text-slate-400">
                      {dashboardTrainingSummary.equipment.slice(0, 5).join(', ') || 'No equipment listed.'}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-5">
                    {dashboardTrainingSummary.drills.slice(0, 5).map((drill, index) => (
                      <div key={drill.id} className="min-w-0 border-l border-emerald-300/20 pl-2.5">
                        <span className="text-[9px] font-black text-emerald-100/75">{String(index + 1).padStart(2, '0')}</span>
                        <span className="mt-1 block min-h-8 text-[11px] font-black leading-tight text-slate-100 line-clamp-2">{drill.name}</span>
                        <span className="mt-1 block text-[8px] font-black uppercase text-slate-500">{drill.durationMinutes ?? 10} min</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-start gap-2 border-t border-white/[0.07] pt-2.5">
                    <Megaphone size={13} className="mt-0.5 shrink-0 text-amber-200" aria-hidden="true" />
                    <p className="line-clamp-1 text-[11px] font-semibold leading-relaxed text-slate-300">
                      {dashboardTrainingSummary.coachCues.slice(0, 1).join(' | ') || dashboardTrainingSummary.warnings[0] || 'Add cues inside the session builder.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : nextMatch ? (
              <div className="mt-4 overflow-hidden rounded-3xl border border-orange-300/16 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.2),transparent_34%),linear-gradient(135deg,rgba(7,17,31,0.96),rgba(8,28,42,0.9)_54%,rgba(14,24,38,0.96))] shadow-lg shadow-black/20">
                <div className="grid lg:grid-cols-[minmax(0,1fr)_15.75rem]">
                  <section className="relative min-w-0 px-4 py-3.5 sm:px-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="warning" className={dashboardWarningBadgeClass}>
                        <Clock size={11} aria-hidden="true" /> T-{nextMatchCountdown}
                      </Badge>
                      <Badge variant="outline" className={dashboardBadgeClass}>
                        {getEventTypeLabel(nextMatch)}
                      </Badge>
                      <span className="hidden h-px flex-1 bg-gradient-to-r from-orange-200/25 to-transparent sm:block" />
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-orange-100/70">
                          {nextMatch.type === 'Training' || nextMatch.type === 'Meeting' ? 'Scheduled event' : 'Next opponent'}
                        </span>
                        <h4 id="next-match-opponent-slug" className="mt-0.5 truncate font-display text-3xl font-black tracking-tight text-white">
                          {nextMatch.opponent}
                        </h4>
                        <p className="mt-1 max-w-xl text-sm font-semibold leading-relaxed text-slate-300">{nextMatchPrepTone}</p>
                      </div>

                      {nextMatch.type !== 'Training' && nextMatch.type !== 'Meeting' && (
                        <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/[0.08] bg-slate-950/36 px-2.5 py-2 text-xs shadow-inner shadow-black/20">
                          <span className="max-w-[7rem] truncate font-black text-slate-100">{teamInfo?.name || 'Our Team'}</span>
                          <span className="rounded-full bg-orange-300 px-2 py-0.5 text-[9px] font-black text-slate-950">VS</span>
                          <span className="max-w-[7rem] truncate font-black text-orange-100">{nextMatch.opponent}</span>
                        </div>
                      )}
                    </div>

                    <dl className="mt-4 grid gap-x-5 gap-y-2.5 border-y border-white/[0.07] py-3 sm:grid-cols-2">
                      {[
                        { label: 'Date & time', value: nextMatchDateTime, icon: Calendar, id: 'next-match-datetime' },
                        { label: 'Venue', value: nextMatch.location, icon: MapPin, id: 'next-match-loc' },
                        { label: 'Squad pool', value: `${activePlayersCount} active`, icon: Users },
                        { label: 'Availability', value: unavailablePlayersCount > 0 ? `${unavailablePlayersCount} unavailable` : 'All clear', icon: AlertCircle }
                      ].map(({ label, value, icon: Icon, id }) => (
                        <div key={label} className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
                          <Icon size={13} className="mt-0.5 text-cyan-200" aria-hidden="true" />
                          <div className="min-w-0">
                            <dt className="text-[9px] font-black uppercase tracking-wider text-slate-500">{label}</dt>
                            <dd id={id} className="mt-0.5 truncate text-sm font-black text-slate-100">{value}</dd>
                          </div>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-3 flex items-start gap-3">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-300/12 text-emerald-200">
                        <Megaphone size={15} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <strong className="block text-sm font-black text-slate-50">{(teamInfo?.coach || 'Coach')}'s prep directive</strong>
                        <p className="mt-1 line-clamp-1 text-sm font-semibold leading-relaxed text-slate-300">
                          {nextMatch.notes || (
                            nextMatch.type === 'Training'
                              ? 'Focus on high-intensity workloads, technical precision, and attendance discipline.'
                              : nextMatch.type === 'Meeting'
                                ? 'Review tactical clips, player assignments, and next-session responsibilities.'
                                : 'Confirm squad readiness, review the opponent profile, and lock travel plus warm-up timing.'
                          )}
                        </p>
                      </div>
                    </div>
                  </section>

                  <aside className="border-t border-white/[0.07] bg-slate-950/24 px-4 py-3.5 lg:border-l lg:border-t-0">
                    <div>
                      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-orange-100/75">
                        <ClipboardList size={13} aria-hidden="true" /> Prep flow
                      </span>
                      <div className="mt-3 grid gap-2">
                        {nextMatchChecklist.map((item) => (
                          <div key={item} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5">
                            <span className="flex size-5 items-center justify-center rounded-full bg-emerald-300 text-[10px] font-black text-slate-950">
                              <Check size={12} aria-hidden="true" />
                            </span>
                            <span className="min-w-0 truncate text-xs font-bold leading-snug text-slate-200">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-y border-white/[0.07] py-3">
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">Plan</span>
                        <strong className="mt-0.5 block truncate text-xs font-black text-slate-100">{nextMatchGamePlan ? 'Saved' : 'Needed'}</strong>
                      </div>
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">Squad</span>
                        <strong className="mt-0.5 block truncate text-xs font-black text-slate-100">{unavailablePlayersCount > 0 ? `${unavailablePlayersCount} out` : 'Ready'}</strong>
                      </div>
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">Shape</span>
                        <strong className="mt-0.5 block truncate text-xs font-black text-slate-100">{nextMatchGamePlan?.formation || 'Set tactics'}</strong>
                      </div>
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">Focus</span>
                        <strong className="mt-0.5 block truncate text-xs font-black text-slate-100">{nextMatchGamePlan?.playstyle || 'Match prep'}</strong>
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className="text-[9px] font-black uppercase tracking-wider text-cyan-100/70">Match ops</span>
                      <div className="mt-2 space-y-1.5 text-xs font-semibold text-slate-300">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500">Arrival</span>
                          <span className="truncate text-right text-slate-100">90 min before KO</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500">Warm-up</span>
                          <span className="truncate text-right text-slate-100">35 min window</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500">Briefing</span>
                          <span className="truncate text-right text-slate-100">{nextMatchGamePlan ? 'Tactics locked' : 'Open board'}</span>
                        </div>
                      </div>
                    </div>
                  </aside>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3 py-12 text-center text-sm text-muted-foreground">
                <span>No training or match prep scheduled for this week.</span>
                <span className="cursor-pointer text-emerald-200 hover:text-emerald-100 hover:underline" onClick={() => onNavigate({ primary: 'development', developmentTab: 'training' })}>
                  Plan training week
                </span>
                <span className="cursor-pointer text-orange-200 hover:text-orange-100 hover:underline" onClick={() => onNavigate({ primary: 'home', homeTab: 'game_week' })}>
                  Add games
                </span>
              </div>
            )}
          </div>

          <div className={`mt-5 flex flex-col gap-3 border-t pt-4 text-sm sm:flex-row sm:items-center sm:justify-between ${dashboardDividerBorderClass}`}>
            <span className="inline-flex items-center gap-2 font-medium text-muted-foreground">
              <Route size={14} className={activeDailyPrepPanel === 'training' ? 'text-emerald-200' : 'text-cyan-200'} aria-hidden="true" />
              {activeDailyPrepPanel === 'training'
                ? 'Run the daily session from the structured training sheet'
                : 'Coordinate calendar, venue, and squad readiness'}
            </span>
            <Button
              id="dash-go-schedule"
              type="button"
              onClick={() => {
                if (activeDailyPrepPanel === 'training' && dashboardTrainingDay) {
                  onOpenTrainingSession(dashboardTrainingDay);
                  return;
                }
                setGamePlanOpen(true);
              }}
              className={`h-9 rounded-xl px-3 text-xs font-black text-slate-950 shadow-lg ${
                activeDailyPrepPanel === 'training'
                  ? 'bg-emerald-300 shadow-emerald-950/20 hover:bg-emerald-200'
                  : 'bg-orange-300 shadow-orange-950/20 hover:bg-orange-200'
              }`}
            >
              {activeDailyPrepPanel === 'training' ? 'Open Session' : 'Game Plan'} <ArrowRight size={13} />
            </Button>
          </div>
        </div>

        {/* Weather Advisory (Left col 7) */}
        <div id="dashboard-weather-advisory" className={`order-3 lg:col-span-7 ${dashboardCardClass}`}>
          <div className={`${dashboardHeaderClass} flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center`}>
            <div>
              <h3 className={dashboardSectionTitleClass}>
              <CloudSun size={18} className="text-cyan-200" aria-hidden="true" /> Weather Advisory
              </h3>
              <p className={dashboardSectionDescriptionClass}>
                Today and the next seven days for match and training planning.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowWeatherSettings(value => !value)}
              className={`h-9 w-9 rounded-full p-0 ${dashboardActionButtonClass}`}
              aria-label="Weather location settings"
              title="Weather location settings"
            >
              <MoreHorizontal size={16} />
            </Button>
          </div>

          {showWeatherSettings && (
            <div className={`mt-4 p-3 ${dashboardInsetPanelClass}`}>
              <form onSubmit={saveWeatherLocation} className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                <div className="relative min-w-0">
                  <Input
                    value={weatherLocationInput}
                    onChange={(event) => setWeatherLocationInput(event.target.value)}
                    placeholder="Search city, e.g. Manila, Philippines"
                    aria-label="Weather advisory location"
                    aria-autocomplete="list"
                    aria-expanded={weatherLocationSuggestions.length > 0}
                    aria-controls="weather-location-suggestions"
                    autoComplete="off"
                    className={`${DARK_GLASS_CLASSES.input} h-10 text-sm`}
                  />
                  {(weatherLocationSuggestions.length > 0 || weatherLocationSearchStatus === 'loading' || weatherLocationSearchStatus === 'error') && (
                    <div
                      id="weather-location-suggestions"
                      role="listbox"
                      className="absolute left-0 right-0 top-11 z-30 overflow-hidden rounded-xl border border-cyan-300/10 bg-[#07111f] text-slate-100 shadow-2xl shadow-black/35"
                    >
                      {weatherLocationSearchStatus === 'loading' && (
                        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">Finding cities...</div>
                      )}
                      {weatherLocationSearchStatus === 'error' && (
                        <div className="px-3 py-2 text-xs font-semibold text-amber-100">City suggestions unavailable.</div>
                      )}
                      {weatherLocationSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          role="option"
                          onClick={() => applyWeatherLocation(suggestion.label, suggestion)}
                          className="block w-full px-3 py-2 text-left text-sm font-semibold text-slate-100 hover:bg-orange-300/10 focus:bg-orange-300/10 focus:outline-none"
                        >
                          {suggestion.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button type="submit" size="sm" className="h-10 rounded-xl bg-orange-400 text-slate-950 shadow-sm shadow-black/10 hover:bg-orange-300 hover:text-slate-950">
                  Save location
                </Button>
                {savedWeatherLocation && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={clearWeatherLocation}
                    className={`h-10 rounded-xl ${dashboardActionButtonClass}`}
                  >
                    Clear
                  </Button>
                )}
              </form>
            </div>
          )}

          {weatherAdvisory.status === 'loading' && (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-[11rem_minmax(0,1fr)]">
              <div className={`h-28 animate-pulse ${dashboardInsetPanelClass}`} />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className={`h-28 animate-pulse ${dashboardInsetPanelClass}`} />
                ))}
              </div>
            </div>
          )}

          {weatherAdvisory.status === 'error' && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
              <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <strong className="block">Weather advisory unavailable</strong>
                <p className="mt-1 leading-relaxed">{weatherAdvisory.message || 'Unable to load the weekly forecast right now.'}</p>
              </div>
            </div>
          )}

          {weatherAdvisory.status === 'ready' && (
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[13rem_minmax(0,1fr)]">
                <div className={`p-4 ${dashboardInsetPanelClass}`}>
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <MapPin size={13} className="text-cyan-200" aria-hidden="true" /> {weatherAdvisory.locationLabel}
                  </span>
                  <div className="mt-3 flex flex-col items-center gap-3 text-center">
                    <WeatherKitIcon code={weatherAdvisory.current?.code ?? todayWeather?.code ?? 0} />
                    <div>
                      <span className="text-4xl font-black tracking-tight text-foreground">
                        {weatherAdvisory.current?.temperature ?? todayWeather?.high ?? '--'}&#176;
                      </span>
                      <p className="mt-1 text-xs font-semibold text-muted-foreground">
                        {getWeatherLabel(weatherAdvisory.current?.code ?? todayWeather?.code ?? 0)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1.5"><CloudRain size={12} className="text-cyan-200" aria-hidden="true" /> {todayWeather?.rainChance ?? 0}% rain</span>
                    <span className="flex items-center gap-1.5"><Wind size={12} className="text-emerald-200" aria-hidden="true" /> {weatherAdvisory.current?.wind ?? todayWeather?.wind ?? 0} km/h</span>
                  </div>
                </div>

                <div className={`p-4 ${dashboardSoftPanelClass}`}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Badge variant="outline" className={`w-fit ${weatherTone.className}`}>
                      {weatherTone.label}
                    </Badge>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">7-day outlook</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{weatherTone.message}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
                    {weatherAdvisory.days.map((day) => (
                      <div
                        key={day.date}
                        className={`min-w-0 p-2.5 text-center ${dashboardTileClass}`}
                        title={getWeatherLabel(day.code)}
                        aria-label={`${getShortWeekday(day.date)} ${getWeatherLabel(day.code)}, high ${day.high} degrees, low ${day.low} degrees, ${day.rainChance}% rain`}
                      >
                        <span className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground">{getShortWeekday(day.date)}</span>
                        <div className="mx-auto mt-1 max-w-[58px]">
                          <WeatherKitIcon code={day.code} compact />
                        </div>
                        <span className="mt-1 block text-xs font-black text-orange-200">{day.high}&#176;/{day.low}&#176;</span>
                        <span className="mt-1 block text-[10px] font-semibold text-muted-foreground">{day.rainChance}% rain</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Strategy Snapshot (Right col 5) */}
        <div id="dashboard-strategy-snapshot" className={`order-2 lg:col-span-5 flex flex-col justify-between ${dashboardCardClass}`}>
          <div className={dashboardHeaderClass}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className={dashboardSectionTitleClass}>
                  <ClipboardList size={18} className="text-orange-300" aria-hidden="true" /> Strategy Snapshot
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className={`h-4 px-1.5 text-[9px] ${dashboardBadgeClass}`}>{strategySnapshot.formation}</Badge>
                  <Badge variant="secondary" className={`h-4 px-1.5 text-[9px] ${dashboardBadgeClass}`}>{strategySnapshot.matchFormat}</Badge>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Synced {strategySyncedLabel}</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onNavigate({ primary: 'tactics' })}
                className={`h-7 shrink-0 rounded-lg px-2.5 text-[11px] ${dashboardActionButtonClass}`}
              >
                Open <ArrowRight size={12} />
              </Button>
            </div>
          </div>

          <div
            className="relative mx-auto mt-2 aspect-[18/8] w-[84%] overflow-hidden rounded-lg border border-emerald-200 bg-emerald-700 shadow-inner"
            role="img"
            aria-label={`Mini pitch showing ${strategySnapshot.formation} formation`}
          >
            <div className="absolute inset-2 rounded-lg border border-white/55" />
            <div className="absolute left-1/2 top-2 h-[calc(100%-1rem)] w-px -translate-x-1/2 bg-white/45" />
            <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/45" />
            <div className="absolute left-2 top-1/2 h-14 w-8 -translate-y-1/2 rounded-r-lg border border-l-0 border-white/45" />
            <div className="absolute right-2 top-1/2 h-14 w-8 -translate-y-1/2 rounded-l-lg border border-r-0 border-white/45" />
            {strategySnapshot.slots.map((slot, index) => (
              <div
                key={`${slot.role}-${index}`}
                className="absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white bg-orange-300 text-[9px] font-black text-slate-950 shadow-md ring-2 ring-emerald-950/15"
                style={{ left: `${slot.left}%`, top: `${slot.top}%` }}
                title={slot.player ? `${slot.player.name} - ${slot.role}` : slot.role}
              >
                {getMiniPlayerNumber(slot.player, index)}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-2 overflow-hidden rounded-lg border border-cyan-300/10 bg-[#0b1726]/72 shadow-inner shadow-black/10">
            <div className="min-w-0 border-b border-r border-cyan-300/10 px-2 py-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Attack</span>
              <p className="truncate text-[10.5px] font-black leading-tight text-foreground">{strategySnapshot.playstyle}</p>
            </div>
            <div className="min-w-0 border-b border-cyan-300/10 px-2 py-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Defense</span>
              <p className="truncate text-[10.5px] font-black leading-tight text-foreground">{strategySnapshot.defensiveStyle}</p>
            </div>
            <div className="min-w-0 border-r border-cyan-300/10 px-2 py-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Lead</span>
              <p className="truncate text-[10.5px] font-bold leading-tight text-foreground">{strategyLeadershipSummary}</p>
            </div>
            <div className="min-w-0 px-2 py-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Set Piece</span>
              <p className="truncate text-[10.5px] font-bold leading-tight text-foreground">{strategySetPieceSummary}</p>
            </div>
            <div className="col-span-2 min-w-0 border-t border-cyan-300/10 px-2 py-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Context</span>
              <p className="truncate text-[10.5px] font-bold leading-tight text-foreground">{strategyContextSummary}</p>
            </div>
          </div>
        </div>

        {/* Latest Announcements Bulletin (Right col 5) */}
        <div className={`order-4 lg:col-span-5 flex flex-col justify-between ${dashboardCardClass}`}>
          <div>
            <div className={`${dashboardHeaderClass} flex items-start justify-between gap-3`}>
              <div>
                <h3 className={dashboardSectionTitleClass}>
                  <Megaphone size={18} className="text-orange-300" aria-hidden="true" /> Latest Alerts
                </h3>
                <p className={dashboardSectionDescriptionClass}>
                  Club bulletins and time-sensitive updates.
                </p>
              </div>
              <Badge variant={announcements.some(ann => ann.category === 'Urgent') ? 'destructive' : 'outline'} className={`shrink-0 ${dashboardBadgeClass}`}>
                {announcements.length > 0 ? `${announcements.length} total` : 'Quiet'}
              </Badge>
            </div>

            <div className="mt-5 space-y-3">
              {announcements.slice(0, 2).map((ann) => (
                <div 
                  id={`dash-ann-${ann.id}-card`}
                  key={ann.id} 
                  className={`relative overflow-hidden rounded-xl border p-4 pl-5 shadow-lg shadow-black/15 backdrop-blur-xl transition-colors hover:border-orange-300/30 hover:bg-orange-300/10 ${
                    ann.category === 'Urgent' 
                      ? 'border-rose-300/25 bg-rose-300/10 text-rose-50'
                      : 'border-cyan-300/10 bg-[#0b1726]/66 text-slate-100'
                  }`}
                >
                  <div className={`absolute bottom-0 left-0 top-0 w-1.5 ${dashboardAnnouncementAccentClasses[ann.category]}`} />
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <Badge
                      variant={ann.category === 'Urgent' ? 'destructive' : ann.category === 'Matchday' ? 'info' : ann.category === 'Training' ? 'success' : 'secondary'}
                      className={`rounded-full px-2.5 ${dashboardAnnouncementBadgeClasses[ann.category]}`}
                    >
                      {ann.category}
                    </Badge>
                    <span className="shrink-0 text-xs font-semibold text-slate-400">{ann.date}</span>
                  </div>
                  <h4 className="line-clamp-1 text-sm font-black leading-tight text-slate-100">{ann.title}</h4>
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-300">
                    "{ann.content}"
                  </p>
                </div>
              ))}

              {announcements.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-cyan-300/15 bg-[#0b1726]/50 px-4 py-10 text-center text-sm text-slate-400">
                  <Megaphone size={24} className="text-orange-300/65" aria-hidden="true" />
                  <span>No alerts recorded on the dashboard.</span>
                </div>
              )}
            </div>
          </div>

          <Button
            id="dash-go-ann"
            type="button"
            variant="outline"
            onClick={() => onNavigate({ primary: 'home', homeTab: 'bulletins' })}
            className={`mt-5 w-full rounded-xl ${dashboardActionButtonClass}`}
          >
            Open bulletin notices <ArrowRight size={12} />
          </Button>
        </div>

      </div>

      {/* Team Summary Table — full squad at a glance */}
      <div id="team-summary-table" className={dashboardCardClass}>
        <div className={`${dashboardHeaderClass} flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center`}>
          <div>
            <h3 className={dashboardSectionTitleClass}>
              <Table size={18} className="text-cyan-200" aria-hidden="true" /> Squad Summary
            </h3>
            <p className={dashboardSectionDescriptionClass}>All registered players, performance totals, discipline, availability, and MVP awards.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success" className={dashboardSuccessBadgeClass}>Active</Badge>
            <Badge variant="warning" className={dashboardWarningBadgeClass}>Pending</Badge>
            <Badge variant="destructive" className={dashboardDangerBadgeClass}>Suspended</Badge>
          </div>
        </div>

        <div className="mt-4 max-h-[26rem] overflow-auto rounded-xl border border-cyan-300/10 bg-[#0b1726]/42 shadow-inner shadow-black/10">
          <table className="min-w-[52rem] w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-[#0b1726] shadow-[0_1px_0_rgba(103,232,249,0.1)]">
              <tr className="border-b border-cyan-300/10 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="pb-2.5 pr-2 w-8">#</th>
                <th className="pb-2.5 pr-2">Name</th>
                <th className="pb-2.5 pr-2">Position</th>
                <th className="pb-2.5 pr-2 text-center">G</th>
                <th className="pb-2.5 pr-2 text-center">A</th>
                <th className="pb-2.5 pr-2 text-center">Cards</th>
                <th className="pb-2.5 pr-2 text-center">GP</th>
                <th className="pb-2.5 pr-2 text-center">MVP</th>
                <th className="pb-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-300/10">
              {[...players]
                .sort((a, b) => {
                  const order = ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'];
                  const aIdx = order.indexOf(a.position);
                  const bIdx = order.indexOf(b.position);
                  const posA = aIdx === -1 ? 99 : aIdx;
                  const posB = bIdx === -1 ? 99 : bIdx;
                  return posA - posB;
                })
                .map(p => {
                  const hasCards = (p.yellowCards || 0) > 0 || (p.redCards || 0) > 0;
                  const isSuspended = p.registrationStatus === 'Suspended';
                  return (
                    <tr 
                      key={p.id}
                      onClick={() => onSelectPlayer(p)}
                      className={`cursor-pointer transition-colors hover:bg-orange-300/10 ${
                        isSuspended ? 'bg-rose-300/10 opacity-70' : ''
                      }`}
                    >
                      <td className="py-2.5 pr-2 font-mono font-bold text-muted-foreground">{p.number || '—'}</td>
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-2">
                          <img 
                            src={p.photoUrl} 
                            alt="" 
                            className="w-6 h-6 rounded-full object-cover shrink-0 border border-border"
                            referrerPolicy="no-referrer"
                          />
                          <span className="max-w-[120px] truncate text-[11px] font-bold text-foreground">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-2 text-muted-foreground font-medium text-[10px] whitespace-nowrap">{p.position}</td>
                      <td className="py-2.5 pr-2 text-center font-bold text-foreground">{p.points ?? 0}</td>
                      <td className="py-2.5 pr-2 text-center font-bold text-foreground">{p.assists ?? 0}</td>
                      <td className="py-2.5 pr-2 text-center">
                        {hasCards ? (
                          <div className="inline-flex items-center gap-1">
                            {(p.yellowCards || 0) > 0 && (
                              <Badge variant="warning" className={`px-1.5 py-0 text-[9px] normal-case tracking-normal ${dashboardWarningBadgeClass}`}>
                                YC {p.yellowCards}
                              </Badge>
                            )}
                            {(p.redCards || 0) > 0 && (
                              <Badge variant="destructive" className={`px-1.5 py-0 text-[9px] normal-case tracking-normal ${dashboardDangerBadgeClass}`}>
                                RC {p.redCards}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/45">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-2 text-center font-bold text-foreground">{p.gamesPlayed ?? 0}</td>
                      <td className="py-2.5 pr-2 text-center">
                        {(p.mvpAwards || 0) > 0 ? (
                          <Badge variant="warning" className={`gap-1 px-2 py-0 text-[10px] ${dashboardWarningBadgeClass}`}>
                            <Star size={10} aria-hidden="true" /> {p.mvpAwards}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/45">—</span>
                        )}
                      </td>
                      <td className="py-2.5 text-center">
                        <Badge
                          variant={p.registrationStatus === 'Active' ? 'success' : isSuspended ? 'destructive' : 'warning'}
                          className={`px-2 py-0 text-[9px] ${
                            p.registrationStatus === 'Active'
                              ? dashboardSuccessBadgeClass
                              : isSuspended
                                ? dashboardDangerBadgeClass
                                : dashboardWarningBadgeClass
                          }`}
                        >
                          {p.registrationStatus === 'Active' ? 'Active' :
                           isSuspended ? 'Suspended' : 'Pending'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          {players.length === 0 && (
            <div className="text-center py-10 text-sm text-muted-foreground">
              <Users size={24} className="mx-auto mb-2 text-muted-foreground/60" />
              No players registered yet. Add players from the Roster tab.
            </div>
          )}
        </div>

        {/* Aggregate quick-stats footer */}
        {players.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <Badge variant="outline" className={dashboardBadgeClass}>Players {players.length}</Badge>
            <Badge variant="info" className={dashboardInfoBadgeClass}>Goals {players.reduce((s, p) => s + (p.points || 0), 0)}</Badge>
            <Badge variant="success" className={dashboardSuccessBadgeClass}>Assists {players.reduce((s, p) => s + (p.assists || 0), 0)}</Badge>
            <Badge variant="warning" className={dashboardWarningBadgeClass}>YC {players.reduce((s, p) => s + (p.yellowCards || 0), 0)}</Badge>
            <Badge variant="destructive" className={dashboardDangerBadgeClass}>RC {players.reduce((s, p) => s + (p.redCards || 0), 0)}</Badge>
            <Badge variant="success" className={dashboardSuccessBadgeClass}>Active {players.filter(p => p.registrationStatus === 'Active').length}</Badge>
            <Badge variant="warning" className={`gap-1 ${dashboardWarningBadgeClass}`}><Star size={10} aria-hidden="true" /> MVP {players.reduce((s, p) => s + (p.mvpAwards || 0), 0)}</Badge>
          </div>
        )}
      </div>

      {/* FPRDS Snapshot */}
      <div id="fprds-snapshot" className={dashboardCardClass}>
        <div className={`${dashboardHeaderClass} flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center`}>
          <div>
            <h3 className={dashboardSectionTitleClass}>
              <ClipboardList className="text-orange-300" size={18} aria-hidden="true" /> FPRDS Snapshot
            </h3>
            <p className={dashboardSectionDescriptionClass}>Top prospects, recent improvements, and latest assessment sessions.</p>
          </div>
          <Button
            id="dash-open-assessments"
            type="button"
            onClick={() => onNavigate({ primary: 'development', developmentTab: 'assessments' })}
            className="rounded-xl text-xs font-black"
          >
            Open Assessments <ArrowRight size={14} />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mt-6">
          <div className={dashboardPanelClass}>
            <h4 className="mb-3 flex items-center gap-2 font-display text-sm font-black text-foreground">
              <Star size={15} className="text-amber-300" aria-hidden="true" /> Top Prospects
            </h4>
            <div className="space-y-2.5">
              {topProspects.map(({ player, session }, idx) => (
                <Button
                  key={player.id}
                  type="button"
                  variant="outline"
                  onClick={() => onSelectPlayer(player)}
                  className={dashboardListButtonClass}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-display font-black text-muted-foreground/55 text-xs w-4 shrink-0">#{idx + 1}</span>
                    <img src={player.photoUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-border shrink-0" referrerPolicy="no-referrer" />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-foreground truncate">{player.name}</p>
                      <p className="text-[10px] text-slate-500 font-semibold truncate">{player.position} • {session.role}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">OVR</p>
                    <p className="text-lg font-display font-black text-foreground leading-none">{session.ovr}</p>
                  </div>
                </Button>
              ))}
              {topProspects.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-10">No assessments recorded yet.</div>
              )}
            </div>
          </div>

          <div className={dashboardPanelClass}>
            <h4 className="mb-3 flex items-center gap-2 font-display text-sm font-black text-foreground">
              <TrendingUp size={15} className="text-emerald-300" aria-hidden="true" /> Top Improvers
            </h4>
            <div className="space-y-2.5">
              {topImprovers.map(({ player, session }, idx) => (
                <Button
                  key={player.id}
                  type="button"
                  variant="outline"
                  onClick={() => onSelectPlayer(player)}
                  className={dashboardListButtonClass}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-display font-black text-muted-foreground/55 text-xs w-4 shrink-0">#{idx + 1}</span>
                    <img src={player.photoUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-border shrink-0" referrerPolicy="no-referrer" />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-foreground truncate">{player.name}</p>
                      <p className="text-[10px] text-slate-500 font-semibold truncate">{session.assessmentDate} • {session.assessmentType}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Δ OVR</p>
                    <p className={`text-lg font-display font-black leading-none ${(session.deltas.ovrDelta ?? 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {(session.deltas.ovrDelta ?? 0) >= 0 ? `+${session.deltas.ovrDelta ?? 0}` : `${session.deltas.ovrDelta ?? 0}`}
                    </p>
                  </div>
                </Button>
              ))}
              {topImprovers.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-10">No improvement data yet.</div>
              )}
            </div>
          </div>

          <div className={dashboardPanelClass}>
            <h4 className="mb-3 flex items-center gap-2 font-display text-sm font-black text-foreground">
              <Calendar size={15} className="text-orange-300" aria-hidden="true" /> Recent Assessments
            </h4>
            <div className="space-y-2.5">
              {recentAssessments.map((s) => {
                const player = players.find(p => p.id === s.playerId);
                if (!player) return null;
                return (
                  <Button
                    key={s.id}
                    type="button"
                    variant="outline"
                    onClick={() => onSelectPlayer(player)}
                    className={dashboardListButtonClass}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={player.photoUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-border shrink-0" referrerPolicy="no-referrer" />
                      <div className="min-w-0">
                        <p className="text-xs font-black text-foreground truncate">{player.name}</p>
                        <p className="text-[10px] text-slate-500 font-semibold truncate">{s.assessmentDate} • {s.role} • {s.assessmentType}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">OVR</p>
                      <p className="text-lg font-display font-black text-foreground leading-none">{s.ovr}</p>
                    </div>
                  </Button>
                );
              })}
              {recentAssessments.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-10">No recent sessions.</div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Leaderboards Grid (Rich visual player statistics) */}
      <div id="stat-leaderboards-card" className={dashboardCardClass}>
        <div className={`${dashboardHeaderClass} flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center`}>
          <div>
            <h3 className={dashboardSectionTitleClass}>
              <Award className="text-orange-300" size={18} /> Player Performance Leaderboards
            </h3>
            <p className={dashboardSectionDescriptionClass}>Season standings across main performance metrics. Click an athlete to open full stats.</p>
          </div>
          <Badge variant="outline" className={dashboardBadgeClass}>Seeded metrics</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          
          {/* Section: Golden Boot */}
          <div className={dashboardPanelClass}>
            <h4 className="mb-3 flex items-center gap-2 font-display text-sm font-black text-foreground">
              <Zap size={14} className="text-orange-300 fill-orange-300" /> Golden Boot (Goals)
            </h4>
            <div className="space-y-2.5">
              {topScorers.map((player, idx) => (
                <div 
                  id={`leaderboard-scorer-${player.id}`}
                  key={player.id}
                  onClick={() => onSelectPlayer(player)}
                  className={dashboardMetricRowClass}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-display font-black text-muted-foreground/55 text-xs w-4">#{idx+1}</span>
                    <img 
                      src={player.photoUrl} 
                      alt={player.name} 
                      className="w-8 h-8 rounded-full border border-border object-cover shadow-inner"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="font-semibold text-xs text-foreground">{player.name}</div>
                      <div className="text-[11px] text-muted-foreground">Position: {player.position}</div>
                    </div>
                  </div>
                  <Badge variant="info" className={dashboardInfoBadgeClass}>{player.points} G</Badge>
                </div>
              ))}

              {topScorers.length === 0 && (
                <div className="text-center py-6 text-sm text-muted-foreground">No statistics logged yet.</div>
              )}
            </div>
          </div>

          {/* Section: Playmaking King */}
          <div className={dashboardPanelClass}>
            <h4 className="mb-3 flex items-center gap-2 font-display text-sm font-black text-foreground">
              <Award size={14} className="text-orange-300" /> Playmaking Kings (Assists)
            </h4>
            <div className="space-y-2.5">
              {topAssists.map((player, idx) => (
                <div 
                  id={`leaderboard-assists-${player.id}`}
                  key={player.id}
                  onClick={() => onSelectPlayer(player)}
                  className={dashboardMetricRowClass}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-display font-black text-muted-foreground/55 text-xs w-4">#{idx+1}</span>
                    <img 
                      src={player.photoUrl} 
                      alt={player.name} 
                      className="w-8 h-8 rounded-full border border-border object-cover shadow-inner"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="font-semibold text-xs text-foreground">{player.name}</div>
                      <div className="text-[11px] text-muted-foreground">Position: {player.position}</div>
                    </div>
                  </div>
                  <Badge variant="success" className={dashboardSuccessBadgeClass}>{player.assists} A</Badge>
                </div>
              ))}

              {topAssists.length === 0 && (
                <div className="text-center py-6 text-sm text-muted-foreground">No statistics logged yet.</div>
              )}
            </div>
          </div>

          {/* Section: Clean Sheet Wall */}
          <div className={dashboardPanelClass}>
            <h4 className="mb-3 flex items-center gap-2 font-display text-sm font-black text-foreground">
              <Shield size={14} className="text-emerald-300" /> Goalkeeping Walls
            </h4>
            <div className="space-y-2.5">
              {topGoalkeepers.map((player, idx) => (
                <div 
                  id={`leaderboard-wall-${player.id}`}
                  key={player.id}
                  onClick={() => onSelectPlayer(player)}
                  className={dashboardMetricRowClass}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-display font-black text-muted-foreground/55 text-xs w-4">#{idx+1}</span>
                    <img 
                      src={player.photoUrl} 
                      alt={player.name} 
                      className="w-8 h-8 rounded-full border border-border object-cover shadow-inner"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="font-semibold text-xs text-foreground">{player.name}</div>
                      <div className="text-[11px] text-muted-foreground">Position: {player.position}</div>
                    </div>
                  </div>
                  <Badge variant="info" className={dashboardInfoBadgeClass}>{player.cleanSheetsOrRebounds} CS</Badge>
                </div>
              ))}

              {topGoalkeepers.length === 0 && (
                <div className="text-center py-6 text-sm text-muted-foreground">No statistics logged yet.</div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Analytics Row: Trend Chart & Recent Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Points Trend Line Chart */}
        <div id="points-trend-chart-card" className={`lg:col-span-8 ${dashboardCardClass}`}>
          <div className={`${dashboardHeaderClass} flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center`}>
            <div>
              <h3 className={dashboardSectionTitleClass}>
                <TrendingUp className="text-emerald-300" size={18} /> Team Points Progression
              </h3>
              <p className={dashboardSectionDescriptionClass}>Cumulative standings trajectory over the last 10 completed matches.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success" className={dashboardSuccessBadgeClass}>Win +3</Badge>
              <Badge variant="warning" className={dashboardWarningBadgeClass}>Draw +1</Badge>
              <Badge variant="destructive" className={dashboardDangerBadgeClass}>Loss 0</Badge>
            </div>
          </div>

          <div className="mt-6 h-[280px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 15, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.18)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    dy={10}
                    className="font-mono"
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    dx={-5}
                    className="font-mono"
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="points" 
                    stroke="#22d3ee"
                    strokeWidth={3.5} 
                    activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2, fill: '#22d3ee' }}
                    dot={renderOutcomeDot}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No matches played yet to display cumulative trend.
              </div>
            )}
          </div>
        </div>

        {/* Recent Form Widget */}
        <div id="recent-form-card" className={`lg:col-span-4 flex flex-col ${dashboardCardClass}`}>
          <div className={`${dashboardHeaderClass} flex flex-col gap-3`}>
            <div>
              <h3 className={dashboardSectionTitleClass}>
                <Calendar className="text-orange-300" size={18} /> Recent Form
              </h3>
              <p className={dashboardSectionDescriptionClass}>Results from the last 5 games</p>
            </div>
            
            <div className="flex gap-2 items-center">
              {userCompletedGames.slice(-5).map((game) => {
                const our = game.ourScore ?? 0;
                const opp = game.opponentScore ?? 0;
                const isWin = our > opp;
                const isDraw = our === opp;
                return (
                  <span key={`seq-${game.id}`} className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-xs text-white shadow-sm ${isWin ? 'bg-emerald-500' : isDraw ? 'bg-amber-400' : 'bg-rose-500'}`}>
                    {isWin ? 'W' : isDraw ? 'D' : 'L'}
                  </span>
                )
              })}
              {userCompletedGames.length === 0 && (
                <span className={dashboardMutedTextClass}>No form available</span>
              )}
            </div>
          </div>
          <div className="mt-4 flex-1 flex flex-col gap-3 overflow-y-auto">
            {userCompletedGames.slice(-5).reverse().map((game) => {
              const our = game.ourScore ?? 0;
              const opp = game.opponentScore ?? 0;
              const isWin = our > opp;
              const isDraw = our === opp;
              return (
                <div key={game.id} className="flex items-center justify-between rounded-xl border border-cyan-300/10 bg-[#0b1726]/66 p-3 text-slate-100 shadow-sm shadow-black/10 transition-colors hover:border-orange-300/30 hover:bg-orange-300/10">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded font-bold text-[10px] text-white ${isWin ? 'bg-emerald-500' : isDraw ? 'bg-amber-400' : 'bg-rose-500'}`}>
                      {isWin ? 'W' : isDraw ? 'D' : 'L'}
                    </span>
                    <span className="max-w-[120px] truncate text-xs font-semibold text-slate-100">{game.opponent}</span>
                  </div>
                  <div className="rounded border border-cyan-300/10 bg-[#0b1726]/80 px-2 py-1 font-mono text-xs font-black text-slate-100 shadow-sm shadow-black/10">
                    {our} - {opp}
                  </div>
                </div>
              );
            })}
            {userCompletedGames.length === 0 && (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground mt-8">
                No recent matches completed.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

