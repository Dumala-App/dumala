import React, { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Game, Player, Standing } from '../types';
import { Calendar, MapPin, Award, Plus, Trophy, Clock, Trash2, ChevronLeft, ChevronRight, CalendarDays, Users, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { availabilitySchema } from '../persistence/schemas';
import { readJsonStorage, STORAGE_KEYS, writeJsonStorage } from '../persistence/storage';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import { FieldError, FormErrorSummary } from './FormValidation';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { Textarea } from './ui/textarea';
import { cn } from '@/src/lib/utils';
import {
  FieldErrors,
  focusFirstInvalidField,
  hasFieldErrors,
  mergeFieldErrors,
  parseIntegerInput
} from '../forms/validation';
import {
  DARK_GLASS_CLASSES,
  DARK_GLASS_DASHBOARD_SURFACE_STYLE,
  DARK_GLASS_THEME_STYLE
} from '../theme/darkGlassTheme';

interface ScheduleViewProps {
  homeWorkspaceHeader?: ReactNode;
  games: Game[];
  players: Player[];
  standings: Standing[];
  onAddGame: (newGame: Game) => void;
  onRecordResult: (
    gameId: string, 
    ourScore: number, 
    opponentScore: number, 
    mvpId: string, 
    notes: string,
    scorersList: NonNullable<Game['scorers']>
  ) => void;
  onDeleteGame: (gameId: string) => void;
  teamName?: string;
  highlightGameId?: string | null;
}

type GameType = Game['type'];
type MatchResultField = 'ourScore' | 'opponentScore' | 'mvpId' | 'scorers';
type GameWeekInspectorTab = 'selected' | 'upcoming' | 'results' | 'availability';

interface ValidMatchResultForm {
  ourScore: number;
  opponentScore: number;
  mvpId: string;
  notes: string;
  scorers: NonNullable<Game['scorers']>;
}

const GAME_TYPES: readonly GameType[] = ['League', 'Cup', 'Friendly', 'Training', 'Meeting'];
const GAME_WEEK_INSPECTOR_TABS: Array<{ value: GameWeekInspectorTab; label: string }> = [
  { value: 'selected', label: 'Selected Day' },
  { value: 'upcoming', label: 'Upcoming Matches' },
  { value: 'results', label: 'Match Results' },
  { value: 'availability', label: 'Availability' }
];

const GAME_TYPE_LABELS: Record<GameType, string> = {
  League: 'League Match',
  Cup: 'Cup Tournament',
  Friendly: 'Friendly Exhibition',
  Training: 'Training Session',
  Meeting: 'Team Meeting'
};

const scheduleInputClass = (hasError?: boolean) => cn(
  'rounded-xl border bg-[#07111f]/72 text-sm text-slate-100 shadow-sm shadow-black/10 placeholder:text-slate-500 focus-visible:ring-2',
  hasError
    ? 'border-rose-300/50 focus-visible:ring-rose-400/30'
    : 'border-cyan-300/15 focus-visible:ring-cyan-300/25'
);

const scheduleCardClass = `${DARK_GLASS_CLASSES.panel} p-4 sm:p-5`;
const scheduleInsetClass = 'rounded-xl border border-cyan-300/10 bg-[#07111f]/72 text-slate-100 shadow-inner shadow-black/10';
const scheduleDividerClass = 'border-cyan-300/10';
const scheduleActionButtonClass = 'border-cyan-300/15 bg-[#0b1726]/85 text-slate-100 shadow-sm shadow-black/10 hover:border-orange-300/35 hover:bg-orange-300/10 hover:text-orange-100';
const schedulePrimaryButtonClass = 'border border-orange-300/25 bg-orange-400 text-slate-950 shadow-sm shadow-black/20 hover:bg-orange-300 hover:text-slate-950';
const scheduleQuietToggleButtonClass = 'border border-cyan-300/15 bg-white/[0.045] text-slate-200 shadow-sm shadow-black/10 backdrop-blur-sm transition-colors hover:border-cyan-300/25 hover:bg-white/[0.075] hover:text-white focus-visible:ring-cyan-300/25';
const scheduleSuccessButtonClass = 'border border-emerald-300/25 bg-emerald-300/15 text-emerald-100 shadow-sm shadow-black/10 hover:bg-emerald-300/25 hover:text-white';
const scheduleBadgeBaseClass = 'border shadow-sm shadow-black/10';

const getGameTypeBadgeClass = (gameType: GameType) => cn(
  scheduleBadgeBaseClass,
  gameType === 'League' ? 'border-cyan-300/25 bg-cyan-300/10 text-cyan-100' :
  gameType === 'Cup' ? 'border-amber-300/30 bg-amber-300/15 text-amber-100' :
  gameType === 'Friendly' ? 'border-slate-300/20 bg-slate-300/10 text-slate-200' :
  gameType === 'Training' ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100' :
  'border-rose-300/25 bg-rose-300/10 text-rose-100'
);

const parseGameType = (value: string): GameType => (
  GAME_TYPES.includes(value as GameType) ? value as GameType : 'League'
);

type CalendarDayItem = {
  dayNum: number;
  date: Date;
  isCurrentMonth: boolean;
  dateStr: string;
};

type AvailabilityMap = Record<string, Record<string, 'yes' | 'no' | 'maybe'>>;

const getGameStartMs = (game: Game) => {
  const timestamp = new Date(`${game.date}T${game.time || '00:00'}`).getTime();
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
};

const getGameTitle = (game: Game, teamName?: string) => (
  game.type === 'Training' || game.type === 'Meeting'
    ? game.opponent
    : `${teamName || 'Our Team'} vs ${game.opponent}`
);

function GameWeekSummaryBar({
  nextFixture,
  latestResult,
  eventsThisMonth,
  upcomingCount,
  completedCount,
  selectedDateLabel,
  selectedCount,
  teamName
}: {
  nextFixture?: Game;
  latestResult?: Game;
  eventsThisMonth: number;
  upcomingCount: number;
  completedCount: number;
  selectedDateLabel: string | null;
  selectedCount: number;
  teamName?: string;
}) {
  const summaryItems = [
    {
      label: 'Next fixture',
      value: nextFixture ? nextFixture.opponent : 'No upcoming event',
      meta: nextFixture ? `${nextFixture.date} @ ${nextFixture.time}` : 'Add a match or session'
    },
    {
      label: 'Latest result',
      value: latestResult ? `${teamName || 'Us'} ${latestResult.ourScore ?? 0}-${latestResult.opponentScore ?? 0} ${latestResult.opponent}` : 'No result logged',
      meta: latestResult ? latestResult.date : 'Completed matches appear here'
    },
    {
      label: 'Month load',
      value: `${eventsThisMonth} events`,
      meta: `${upcomingCount} upcoming / ${completedCount} results`
    },
    {
      label: 'Date focus',
      value: selectedDateLabel || 'Full month',
      meta: selectedDateLabel ? `${selectedCount} events on selected day` : 'Select a day to inspect'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {summaryItems.map(item => (
        <div key={item.label} className={`${scheduleInsetClass} p-3`}>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{item.label}</span>
          <p className="mt-1 truncate text-sm font-black text-slate-100">{item.value}</p>
          <p className="mt-0.5 truncate text-xs font-medium text-slate-400">{item.meta}</p>
        </div>
      ))}
    </div>
  );
}

function GameWeekCalendar({
  calendarDays,
  games,
  viewDate,
  selectedDateStr,
  todayStr,
  monthNames,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onToday
}: {
  calendarDays: CalendarDayItem[];
  games: Game[];
  viewDate: Date;
  selectedDateStr: string | null;
  todayStr: string;
  monthNames: string[];
  onSelectDate: (dateStr: string, date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}) {
  return (
    <div className={`${scheduleCardClass} space-y-4 xl:min-h-[42rem]`}>
      <div className={`flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-center lg:justify-between ${scheduleDividerClass}`}>
        <div>
          <h3 className="flex items-center gap-2 font-display text-xl font-black tracking-tight text-slate-100">
            <CalendarDays className="text-orange-300" size={22} />
            <span>{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
          </h3>
          <p className="mt-1 text-xs font-medium text-slate-400">Select a day to inspect fixtures, results, and attendance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="icon" onClick={onPrevMonth} className={`size-9 rounded-lg p-1.5 ${scheduleActionButtonClass}`} title="Previous Month">
            <ChevronLeft size={16} />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onToday} className={`h-9 rounded-lg px-3 text-[10px] font-black uppercase ${scheduleActionButtonClass}`}>
            Today
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={onNextMonth} className={`size-9 rounded-lg p-1.5 ${scheduleActionButtonClass}`} title="Next Month">
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <span key={day} className="py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">{day}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {calendarDays.map(({ dayNum, date, isCurrentMonth, dateStr }, idx) => {
          const isSelected = dateStr === selectedDateStr;
          const isToday = dateStr === todayStr;
          const dayEvents = games.filter(game => game.date === dateStr).sort((a, b) => a.time.localeCompare(b.time));
          const hasEvents = dayEvents.length > 0;

          return (
            <Button
              key={`${dateStr}-${idx}`}
              type="button"
              variant="outline"
              onClick={() => onSelectDate(dateStr, date)}
              aria-pressed={isSelected}
              className={`group flex min-h-24 flex-col items-stretch justify-start whitespace-normal rounded-xl border p-2 text-left transition-colors sm:min-h-28 xl:min-h-[6.6rem] ${
                isSelected
                  ? 'border-orange-300 bg-orange-400 text-slate-950 shadow-md shadow-black/20 hover:bg-orange-300'
                  : isToday
                    ? 'border-cyan-300/45 bg-cyan-300/12 text-cyan-100 hover:bg-cyan-300/18'
                    : isCurrentMonth
                      ? 'border-cyan-300/10 bg-[#0b1726]/66 text-slate-200 hover:border-cyan-300/25 hover:bg-cyan-300/10'
                      : 'border-transparent bg-[#07111f]/35 text-slate-600 hover:bg-[#0b1726]/70 hover:text-slate-400'
              }`}
            >
              <span className="flex items-center justify-between gap-1 text-[11px] font-black">
                <span>{dayNum}</span>
                {hasEvents && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[8px] ${isSelected ? 'bg-slate-950/15 text-slate-950' : 'bg-white/[0.06] text-slate-300'}`}>
                    {dayEvents.length}
                  </span>
                )}
              </span>
              {hasEvents && (
                <span className="mt-2 flex flex-col gap-1 overflow-hidden">
                  {dayEvents.slice(0, 3).map(event => (
                    <span key={event.id} className={`truncate rounded-md px-1.5 py-1 text-[9px] font-bold leading-none ${isSelected ? 'bg-slate-950/15 text-slate-950' : getGameTypeBadgeClass(event.type)}`}>
                      {event.time} - {event.type === 'Training' || event.type === 'Meeting' ? event.opponent : `vs ${event.opponent}`}
                    </span>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className={`text-[9px] font-black ${isSelected ? 'text-slate-950' : 'text-slate-500'}`}>+{dayEvents.length - 3} more</span>
                  )}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      <div className={`flex flex-wrap gap-x-4 gap-y-2 border-t pt-3 text-[10px] font-black uppercase tracking-wider text-slate-400 ${scheduleDividerClass}`}>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-cyan-400" />League</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-300" />Cup</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-slate-400" />Friendly</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-300" />Training</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-rose-300" />Meeting</span>
      </div>
    </div>
  );
}

function GameWeekEventRow({
  game,
  teamName,
  players,
  isHighlighted,
  onRecordResult,
  onDeleteGame
}: {
  game: Game;
  teamName?: string;
  players: Player[];
  isHighlighted: boolean;
  onRecordResult: (game: Game) => void;
  onDeleteGame: (gameId: string) => void;
}) {
  const daysLeft = Math.ceil((new Date(game.date).getTime() - Date.now()) / (1000 * 3600 * 24));
  const mvpName = players.find(player => player.id === game.mvpId)?.name;
  const resultMarker = game.status === 'Completed'
    ? game.ourScore! > game.opponentScore! ? 'W' : game.ourScore! === game.opponentScore! ? 'D' : 'L'
    : game.type === 'Training' ? 'TRN' : game.type === 'Meeting' ? 'MTG' : 'VS';

  return (
    <motion.div
      id={`game-item-${game.id}`}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border bg-[#07111f]/88 p-3 text-slate-100 shadow-sm shadow-black/10 backdrop-blur-xl transition-colors hover:border-orange-300/35 hover:bg-[#0b1726]/92 ${
        isHighlighted ? 'border-amber-300/60 ring-4 ring-amber-300/15' : 'border-cyan-300/10'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl font-display text-xs font-black ${
          game.status === 'Completed'
            ? (game.ourScore! > game.opponentScore! ? 'border border-emerald-300/25 bg-emerald-300/15 text-emerald-100' : game.ourScore! === game.opponentScore! ? 'border border-slate-300/20 bg-slate-300/10 text-slate-200' : 'border border-rose-300/25 bg-rose-300/15 text-rose-100')
            : 'border border-orange-300/25 bg-orange-300/15 text-orange-100'
        }`}>
          {resultMarker}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge id={`game-${game.id}-type-badge`} className={`rounded-full px-2 py-0.5 text-[9px] ${getGameTypeBadgeClass(game.type)}`}>
              {game.type}
            </Badge>
            {isHighlighted && <Badge className="rounded-full border-amber-300/30 bg-amber-300/15 px-2 py-0.5 text-[9px] text-amber-100">Review</Badge>}
            {game.status === 'Upcoming' && daysLeft > 0 && (
              <Badge id={`game-${game.id}-countdown-badge`} className="rounded-full border-rose-300/25 bg-rose-300/10 px-2 py-0.5 text-[9px] text-rose-100">
                In {daysLeft} Days
              </Badge>
            )}
          </div>
          <h4 id={`game-${game.id}-title`} className="mt-1 truncate font-display text-sm font-black text-slate-100">
            {getGameTitle(game, teamName)}
          </h4>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium text-slate-400">
            <span id={`game-${game.id}-dt`} className="flex items-center gap-1.5"><Clock size={12} className="text-orange-300" />{game.date} @ {game.time}</span>
            <span id={`game-${game.id}-loc`} className="flex items-center gap-1.5"><MapPin size={12} className="text-cyan-200" />{game.location}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-start gap-1">
          {game.status === 'Completed' ? (
            <Button type="button" variant="outline" size="sm" onClick={() => onRecordResult(game)} className={`h-8 rounded-lg px-2 text-[10px] font-bold ${scheduleActionButtonClass}`}>
              {game.ourScore} - {game.opponentScore}
            </Button>
          ) : game.type !== 'Training' && game.type !== 'Meeting' ? (
            <Button type="button" id={`record-score-btn-${game.id}`} variant="outline" size="sm" onClick={() => onRecordResult(game)} className={`h-8 rounded-lg px-2 text-[10px] font-bold ${scheduleSuccessButtonClass}`}>
              <Trophy size={11} /> Log
            </Button>
          ) : null}
          <Button
            id={`delete-game-btn-${game.id}`}
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              if (window.confirm(`Remove the ${game.opponent} event? Completed match statistics will be reversed.`)) {
                onDeleteGame(game.id);
              }
            }}
            className="size-8 rounded-lg text-slate-500 hover:bg-rose-300/10 hover:text-rose-200"
            title="Remove Event"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {(game.notes || mvpName || (game.scorers && game.scorers.length > 0)) && (
        <div className={`${scheduleInsetClass} mt-3 flex flex-col gap-2 p-3 text-xs text-slate-400`}>
          {mvpName && <span id={`game-${game.id}-mvp`} className="font-bold uppercase tracking-wider text-amber-300"><Award size={11} className="mr-1 inline fill-amber-300 text-amber-500" />{mvpName}</span>}
          {game.notes && <p className="line-clamp-2 text-[11px] font-medium leading-relaxed text-slate-300">{game.notes}</p>}
          {game.scorers && game.scorers.length > 0 && (
            <div id={`game-${game.id}-scorers-list`} className="flex flex-wrap gap-1">
              {game.scorers.map(scorer => (
                <span key={scorer.playerName} className="rounded border border-cyan-300/10 bg-[#07111f]/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-200">
                  Goal {scorer.playerName} ({scorer.count})
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function AvailabilityMiniPanel({
  games,
  players,
  availability,
  onSetPlayerAvailability
}: {
  games: Game[];
  players: Player[];
  availability: AvailabilityMap;
  onSetPlayerAvailability: (gameId: string, playerId: string, value: 'yes' | 'no' | 'maybe') => void;
}) {
  const upcomingMatchEvents = games
    .filter(game => ['League', 'Cup', 'Friendly'].includes(game.type) && game.status === 'Upcoming')
    .sort((a, b) => getGameStartMs(a) - getGameStartMs(b))
    .slice(0, 2);
  const activePlayers = players.filter(player => player.registrationStatus === 'Active');

  return (
    <div className="space-y-3">
      {upcomingMatchEvents.map(game => {
        const gameAvailability = availability[game.id] || {};
        const yesCount = Object.values(gameAvailability).filter(value => value === 'yes').length;
        const noCount = Object.values(gameAvailability).filter(value => value === 'no').length;
        const maybeCount = Object.values(gameAvailability).filter(value => value === 'maybe').length;

        return (
          <div key={game.id} className={`${scheduleInsetClass} p-3`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Badge className={`rounded-full px-2 py-0.5 text-[8px] ${getGameTypeBadgeClass(game.type)}`}>{game.type}</Badge>
                <p className="mt-1 truncate text-xs font-black text-slate-100">vs {game.opponent}</p>
                <p className="text-[10px] font-medium text-slate-500">{game.date} @ {game.time}</p>
              </div>
              <div className="shrink-0 text-right text-[10px] font-black">
                <span className="text-emerald-300">{yesCount}</span>
                <span className="px-1 text-slate-600">/</span>
                <span className="text-rose-300">{noCount}</span>
                <span className="px-1 text-slate-600">/</span>
                <span className="text-amber-300">{maybeCount}</span>
              </div>
            </div>

            <div className="mt-3 flex max-h-36 flex-wrap gap-1 overflow-y-auto pr-1">
              {activePlayers.map(player => {
                const status = gameAvailability[player.id] || '';
                return (
                  <Button
                    key={player.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onSetPlayerAvailability(game.id, player.id, status === 'yes' ? 'no' : status === 'no' ? 'maybe' : 'yes')}
                    title={`${player.name}: ${status || 'unset'}`}
                    className={`h-7 max-w-full rounded-full px-2 py-1 text-[9px] font-bold ${
                      status === 'yes' ? 'border-emerald-300/35 bg-emerald-300/15 text-emerald-100' :
                      status === 'no' ? 'border-rose-300/35 bg-rose-300/15 text-rose-100 line-through' :
                      status === 'maybe' ? 'border-amber-300/35 bg-amber-300/15 text-amber-100' :
                      'border-cyan-300/10 bg-[#07111f]/72 text-slate-400 hover:border-cyan-300/25 hover:text-slate-100'
                    }`}
                  >
                    <span className="truncate">{player.name}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        );
      })}

      {upcomingMatchEvents.length === 0 && (
        <div className={`${scheduleInsetClass} p-4 text-center text-xs font-medium text-slate-400`}>
          No upcoming match availability to track.
        </div>
      )}
    </div>
  );
}

function GameWeekInspector({
  activeTab,
  onTabChange,
  selectedDateLabel,
  selectedGames,
  upcomingGames,
  completedGames,
  teamName,
  players,
  highlightGameId,
  onRecordResult,
  onDeleteGame,
  availability,
  onSetPlayerAvailability
}: {
  activeTab: GameWeekInspectorTab;
  onTabChange: (tab: GameWeekInspectorTab) => void;
  selectedDateLabel: string | null;
  selectedGames: Game[];
  upcomingGames: Game[];
  completedGames: Game[];
  teamName?: string;
  players: Player[];
  highlightGameId?: string | null;
  onRecordResult: (game: Game) => void;
  onDeleteGame: (gameId: string) => void;
  availability: AvailabilityMap;
  onSetPlayerAvailability: (gameId: string, playerId: string, value: 'yes' | 'no' | 'maybe') => void;
}) {
  const eventGroups: Record<Exclude<GameWeekInspectorTab, 'availability'>, { title: string; empty: string; games: Game[] }> = {
    selected: {
      title: selectedDateLabel ? selectedDateLabel : 'Selected Day',
      empty: selectedDateLabel ? 'No events on this day.' : 'Select a calendar day to inspect events.',
      games: selectedGames
    },
    upcoming: {
      title: 'Upcoming Matches',
      empty: 'No upcoming fixtures or sessions.',
      games: upcomingGames
    },
    results: {
      title: 'Match Results',
      empty: 'No match results logged yet.',
      games: completedGames
    }
  };

  return (
    <aside className={`${scheduleCardClass} flex max-h-[48rem] flex-col gap-4 xl:sticky xl:top-24`}>
      <div>
        <h3 className="flex items-center gap-2 font-display text-base font-black text-slate-100">
          <CalendarDays size={18} className="text-orange-300" /> Game Week Desk
        </h3>
        <p className="mt-1 text-xs font-medium text-slate-400">Inspect the calendar without leaving the main surface.</p>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-xl border border-cyan-300/10 bg-[#07111f]/72 p-1">
        {GAME_WEEK_INSPECTOR_TABS.map(tab => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onTabChange(tab.value)}
            className={`rounded-lg px-2 py-2 text-[10px] font-black uppercase tracking-wider transition-colors ${
              activeTab === tab.value
                ? 'bg-orange-400 text-slate-950 shadow-sm shadow-black/20'
                : 'text-slate-400 hover:bg-cyan-300/10 hover:text-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {activeTab === 'availability' ? (
          <AvailabilityMiniPanel
            games={upcomingGames}
            players={players}
            availability={availability}
            onSetPlayerAvailability={onSetPlayerAvailability}
          />
        ) : (
          <div className="space-y-3">
            <div className={`flex items-center justify-between border-b pb-2 ${scheduleDividerClass}`}>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-300">{eventGroups[activeTab].title}</h4>
              <span className="text-[10px] font-black text-slate-500">{eventGroups[activeTab].games.length}</span>
            </div>
            {eventGroups[activeTab].games.length > 0 ? (
              eventGroups[activeTab].games.map(game => (
                <GameWeekEventRow
                  key={game.id}
                  game={game}
                  teamName={teamName}
                  players={players}
                  isHighlighted={highlightGameId === game.id}
                  onRecordResult={onRecordResult}
                  onDeleteGame={onDeleteGame}
                />
              ))
            ) : (
              <div className={`${scheduleInsetClass} flex min-h-32 items-center justify-center p-4 text-center text-xs font-medium text-slate-400`}>
                {eventGroups[activeTab].empty}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

export default function ScheduleView({ homeWorkspaceHeader, games, players, onAddGame, onRecordResult, onDeleteGame, teamName, highlightGameId }: ScheduleViewProps) {
  const resultDialogRef = useRef<HTMLDivElement | null>(null);
  const resultFormRef = useRef<HTMLFormElement | null>(null);
  const [activeInspectorTab, setActiveInspectorTab] = useState<GameWeekInspectorTab>('selected');
  
  // Calendar View & Filter State
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Add Game form state
  const [isAdding, setIsAdding] = useState(false);
  const [opponent, setOpponent] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<Game['type']>("League");
  const [notes, setNotes] = useState("");

  // Record Score state
  const [recordingGameId, setRecordingGameId] = useState<string | null>(null);
  const [ourScore, setOurScore] = useState('0');
  const [opponentScore, setOpponentScore] = useState('0');
  const [selectedMvp, setSelectedMvp] = useState("");
  const [gameNotes, setGameNotes] = useState("");
  
  // Goals record state for the completed game
  const [selectedScorer, setSelectedScorer] = useState("");
  const [currentScorers, setCurrentScorers] = useState<NonNullable<Game['scorers']>>([]);
  const [resultError, setResultError] = useState('');
  const [resultErrors, setResultErrors] = useState<FieldErrors<MatchResultField>>({});
  const [isRecordingResult, setIsRecordingResult] = useState(false);
  const closeResultDialog = useCallback(() => {
    setRecordingGameId(null);
    setResultError('');
    setResultErrors({});
    setIsRecordingResult(false);
  }, []);
  useDialogAccessibility(resultDialogRef, recordingGameId !== null, closeResultDialog);

  const activeAthletes = useMemo(() => players.filter(p =>
    ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'].includes(p.position)
    && p.registrationStatus === 'Active'
  ), [players]);

  const clearResultFieldError = (field: MatchResultField) => {
    setResultErrors(previous => previous[field] ? { ...previous, [field]: undefined } : previous);
    setResultError('');
  };

  // Match Availability Tracker state: per gameId, per playerId to yes/no/maybe
  const [availability, setAvailability] = useState<Record<string, Record<string, 'yes' | 'no' | 'maybe'>>>(() => {
    return readJsonStorage(STORAGE_KEYS.availability, availabilitySchema, {}, 'Match availability');
  });

  const setPlayerAvail = (gameId: string, playerId: string, value: 'yes' | 'no' | 'maybe') => {
    setAvailability(prev => {
      const gameAvail = { ...(prev[gameId] || {}) };
      if (gameAvail[playerId] === value) {
        delete gameAvail[playerId]; // toggle off
      } else {
        gameAvail[playerId] = value;
      }
      const next = { ...prev, [gameId]: gameAvail };
      writeJsonStorage(STORAGE_KEYS.availability, next);
      return next;
    });
  };

  useEffect(() => {
    if (!highlightGameId) return;
    const highlightedGame = games.find(game => game.id === highlightGameId);
    if (!highlightedGame) return;
    setActiveInspectorTab(highlightedGame.status === 'Completed' ? 'results' : 'upcoming');
    setSelectedDateStr(highlightedGame.date);
  }, [games, highlightGameId]);

  useEffect(() => {
    if (!highlightGameId) return;
    const card = document.getElementById(`game-item-${highlightGameId}`);
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeInspectorTab, games, highlightGameId, selectedDateStr]);

  // Date helper functions
  const formatDateString = (d: Date) => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const getCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const numDaysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const prevMonthNumDays = new Date(year, month, 0).getDate();
    
    const days = [];
    
    // Trailing days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthNumDays - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({
        dayNum: d,
        date: prevDate,
        isCurrentMonth: false,
        dateStr: formatDateString(prevDate)
      });
    }
    
    // Days in current month
    for (let d = 1; d <= numDaysInMonth; d++) {
      const currentDateItem = new Date(year, month, d);
      days.push({
        dayNum: d,
        date: currentDateItem,
        isCurrentMonth: true,
        dateStr: formatDateString(currentDateItem)
      });
    }
    
    // Future padding cells to fit clean grid columns
    const totalCells = days.length > 35 ? 42 : 35;
    let nextMonthDay = 1;
    while (days.length < totalCells) {
      const nextDateItem = new Date(year, month + 1, nextMonthDay);
      days.push({
        dayNum: nextMonthDay,
        date: nextDateItem,
        isCurrentMonth: false,
        dateStr: formatDateString(nextDateItem)
      });
      nextMonthDay++;
    }
    
    return days;
  };

  const handleAddGameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isMeetingOrTraining = type === 'Training' || type === 'Meeting';
    const finalOpponent = isMeetingOrTraining 
      ? (opponent.trim() || (type === 'Training' ? 'First Team Training' : 'Squad Strategy Session'))
      : opponent.trim();

    if (!finalOpponent || !date || !time || !location.trim()) return;

    const newGame: Game = {
      id: "g_" + Date.now(),
      opponent: finalOpponent,
      date,
      time,
      location: location.trim(),
      status: "Upcoming",
      type,
      notes: notes.trim()
    };

    onAddGame(newGame);
    // Reset Form
    setOpponent("");
    setDate("");
    setTime("");
    setLocation("");
    setType("League");
    setNotes("");
    setIsAdding(false);
  };

  const handleScorerAdd = () => {
    if (!selectedScorer) return;
    const player = activeAthletes.find(candidate => candidate.id === selectedScorer);
    if (!player) return;
    clearResultFieldError('scorers');
    const existing = currentScorers.find(s => s.playerId === player.id);
    if (existing) {
      setCurrentScorers(currentScorers.map(s => s.playerId === player.id ? { ...s, count: s.count + 1 } : s));
    } else {
      setCurrentScorers([...currentScorers, { playerId: player.id, playerName: player.name, count: 1 }]);
    }
  };

  const handleScorerRemove = (playerId: string | undefined, playerName: string) => {
    clearResultFieldError('scorers');
    setCurrentScorers(currentScorers.filter(s =>
      playerId ? s.playerId !== playerId : s.playerName !== playerName
    ));
  };

  const openResultEditor = (game: Game) => {
    setRecordingGameId(game.id);
    setOurScore(String(game.ourScore ?? 0));
    setOpponentScore(String(game.opponentScore ?? 0));
    setSelectedMvp(game.mvpId ?? '');
    setGameNotes(game.notes ?? '');
    setCurrentScorers((game.scorers ?? []).map(scorer => {
      if (scorer.playerId) return scorer;
      const matchingPlayers = players.filter(player =>
        player.name.trim().toLowerCase() === scorer.playerName.trim().toLowerCase()
      );
      return matchingPlayers.length === 1
        ? { ...scorer, playerId: matchingPlayers[0].id }
        : scorer;
    }));
    setSelectedScorer('');
    setResultError('');
    setResultErrors({});
  };

  const validateMatchResultForm = (): ValidMatchResultForm | null => {
    const parsedOurScore = parseIntegerInput(ourScore, { label: `${teamName || 'Our team'} score`, min: 0 });
    const parsedOpponentScore = parseIntegerInput(opponentScore, { label: 'Opponent score', min: 0 });
    const ourScoreError = 'errors' in parsedOurScore ? parsedOurScore.errors.value : undefined;
    const opponentScoreError = 'errors' in parsedOpponentScore ? parsedOpponentScore.errors.value : undefined;
    const scoreErrors = mergeFieldErrors<MatchResultField>(
      ourScoreError ? { ourScore: ourScoreError } : {},
      opponentScoreError ? { opponentScore: opponentScoreError } : {}
    );

    const eligibleIds = new Set(activeAthletes.map(player => player.id));
    const scorerIds = new Set<string>();
    let recordedGoals = 0;
    let scorerError = '';
    for (const scorer of currentScorers) {
      if (!Number.isInteger(scorer.count) || scorer.count <= 0) {
        scorerError = 'Scorer goal counts must be positive whole numbers.';
        break;
      }
      if (!scorer.playerId || !eligibleIds.has(scorer.playerId)) {
        scorerError = 'Every scorer must reference an active athlete.';
        break;
      }
      if (scorerIds.has(scorer.playerId)) {
        scorerError = 'Each scorer can only appear once in the scorecard.';
        break;
      }
      scorerIds.add(scorer.playerId);
      recordedGoals += scorer.count;
    }

    if (!scorerError && parsedOurScore.ok && recordedGoals > parsedOurScore.value) {
      scorerError = 'Recorded scorer goals cannot exceed the team score.';
    }

    const nextErrors: FieldErrors<MatchResultField> = {
      ...scoreErrors,
      mvpId: eligibleIds.has(selectedMvp) ? undefined : 'Select an active athlete as the match MVP.',
      scorers: scorerError || undefined
    };

    if (hasFieldErrors(nextErrors) || !parsedOurScore.ok || !parsedOpponentScore.ok) {
      setResultErrors(nextErrors);
      focusFirstInvalidField(resultFormRef.current, nextErrors);
      return null;
    }

    return {
      ourScore: parsedOurScore.value,
      opponentScore: parsedOpponentScore.value,
      mvpId: selectedMvp,
      notes: gameNotes,
      scorers: currentScorers
    };
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingGameId || isRecordingResult) return;

    const validResult = validateMatchResultForm();
    if (!validResult) return;

    try {
      setIsRecordingResult(true);
      onRecordResult(
        recordingGameId,
        validResult.ourScore,
        validResult.opponentScore,
        validResult.mvpId,
        validResult.notes,
        validResult.scorers
      );
    } catch (error) {
      setResultError(error instanceof Error ? error.message : 'The result could not be saved.');
      setIsRecordingResult(false);
      return;
    }

    // Reset recording fields
    setRecordingGameId(null);
    setOurScore('0');
    setOpponentScore('0');
    setSelectedMvp("");
    setGameNotes("");
    setCurrentScorers([]);
    setResultError('');
    setResultErrors({});
    setIsRecordingResult(false);
  };

  const calendarDays = getCalendarDays();
  const selectedGames = games
    .filter(game => selectedDateStr ? game.date === selectedDateStr : false)
    .sort((a, b) => getGameStartMs(a) - getGameStartMs(b));
  const upcomingGames = games
    .filter(game => game.status === 'Upcoming')
    .sort((a, b) => getGameStartMs(a) - getGameStartMs(b));
  const completedGames = games
    .filter(game => game.status === 'Completed')
    .sort((a, b) => getGameStartMs(b) - getGameStartMs(a));

  const visibleMonthGames = games.filter(game => {
    const gameDate = new Date(`${game.date}T00:00:00`);
    return gameDate.getFullYear() === viewDate.getFullYear() && gameDate.getMonth() === viewDate.getMonth();
  });
  const upcomingMatchesCount = games.filter(game => game.status === 'Upcoming').length;
  const completedMatchesCount = games.filter(game => game.status === 'Completed').length;
  const selectedDateLabel = selectedDateStr
    ? new Date(`${selectedDateStr}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;
  const nextFixture = upcomingGames[0];
  const latestResult = completedGames[0];

  return (
    <div
      id="schedule-view-container"
      className={DARK_GLASS_CLASSES.dashboardShell}
      style={{ ...DARK_GLASS_THEME_STYLE, ...DARK_GLASS_DASHBOARD_SURFACE_STYLE }}
    >

      {homeWorkspaceHeader}
      
      <div className={`${scheduleCardClass} flex flex-col justify-between gap-3 sm:flex-row sm:items-center`}>
        <div>
          <h2 className="font-display text-lg font-black tracking-tight text-slate-100">Game Week</h2>
          <p className="mt-1 text-xs font-medium text-slate-400">Calendar-first match planning, results, and availability.</p>
        </div>
        <Button
          id="toggle-schedule-form-btn"
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className={`w-full justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold sm:w-auto ${scheduleQuietToggleButtonClass}`}
        >
          {isAdding ? <Plus size={14} className="rotate-45 text-slate-300" /> : <Plus size={14} className="text-slate-300" />}
          {isAdding ? 'Cancel' : 'Schedule Tournament Event'}
        </Button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/72 p-4 backdrop-blur-sm">
        <motion.div 
          id="add-game-form-container"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-game-title"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-cyan-300/10 bg-[#07111f]/95 p-5 text-slate-100 shadow-xl shadow-black/35 backdrop-blur-xl"
        >
          <div className={`flex items-center justify-between gap-3 border-b pb-3 ${scheduleDividerClass}`}>
            <h3 id="add-game-title" className="flex items-center gap-2 font-display text-lg font-black text-slate-100">
              <Calendar className="text-orange-300" size={20} />
              Add Next Game / Event
            </h3>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="text-slate-400 hover:bg-cyan-300/10 hover:text-slate-100">
              Cancel
            </Button>
          </div>

          <form onSubmit={handleAddGameSubmit} className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div>
              <Label className="mb-1 block text-slate-300">
                {type === 'Training' ? 'Session Title' : type === 'Meeting' ? 'Meeting Subject' : 'Opposing Club Name'} *
              </Label>
              <Input
                id="new-opponent-name"
                type="text" 
                placeholder={type === 'Training' ? 'e.g. Shooting & Passing Drills' : type === 'Meeting' ? 'e.g. Tactical Strategy Briefing' : 'e.g. Glacier Rovers'}
                value={opponent}
                onChange={e => setOpponent(e.target.value)}
                className={scheduleInputClass()}
              />
            </div>

            <div>
              <Label className="mb-1 block text-slate-300">Event Date *</Label>
              <Input
                id="new-game-date"
                type="date" 
                required 
                value={date}
                onChange={e => setDate(e.target.value)}
                className={scheduleInputClass()}
              />
            </div>

            <div>
              <Label className="mb-1 block text-slate-300">Start Time *</Label>
              <Input
                id="new-game-time"
                type="time" 
                required 
                value={time}
                onChange={e => setTime(e.target.value)}
                className={scheduleInputClass()}
              />
            </div>

            <div className="lg:col-span-2">
              <Label className="mb-1 block text-slate-300">Venue / Field Location *</Label>
              <Input
                id="new-game-location"
                type="text" 
                required 
                placeholder="e.g. Arena Field 2, Metro Sports Hub"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className={scheduleInputClass()}
              />
            </div>

            <div>
              <Label className="mb-1 block text-slate-300">Event Type *</Label>
              <Select value={type} onValueChange={value => setType(parseGameType(value))}>
                <SelectTrigger id="new-game-type" className={scheduleInputClass()}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-cyan-300/10 bg-[#07111f] text-slate-100">
                  {GAME_TYPES.map(gameType => (
                    <SelectItem key={gameType} value={gameType}>
                      {GAME_TYPE_LABELS[gameType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-3">
              <Label className="mb-1 block text-slate-300">Squad Tactical Instructions / Notes</Label>
              <Textarea
                id="new-game-notes"
                placeholder="Required uniform color, warmup hours, agenda items..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className={cn(scheduleInputClass(), 'min-h-20')}
              />
            </div>

            <div className="lg:col-span-3 flex flex-col sm:flex-row justify-end gap-2 p-1">
              <Button
                id="cancel-add-game-btn"
                type="button" 
                onClick={() => setIsAdding(false)}
                variant="outline"
                className={`rounded-xl ${scheduleActionButtonClass}`}
              >
                Cancel
              </Button>
              <Button
                id="submit-add-game-btn"
                type="submit" 
                className={`rounded-xl ${schedulePrimaryButtonClass}`}
              >
                Save Event
              </Button>
            </div>
          </form>
        </motion.div>
        </div>
      )}

      {/* Record Score Overlay Card Form */}
      {recordingGameId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/72 p-4 backdrop-blur-sm">
          <motion.div
            ref={resultDialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="record-results-title"
            id="record-results-modal"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg rounded-2xl border border-cyan-300/10 bg-[#07111f]/95 p-6 text-slate-100 shadow-xl shadow-black/35 backdrop-blur-xl"
          >
            <div className={`flex items-center justify-between border-b pb-3 ${scheduleDividerClass}`}>
              <h3 id="record-results-title" className="flex items-center gap-2 font-display text-lg font-bold text-slate-100">
                <Trophy size={20} className="text-amber-500" />
                {games.find(game => game.id === recordingGameId)?.status === 'Completed'
                  ? 'Edit Match Result'
                  : 'Record Match Scores'}
              </h3>
              <Button
                id="close-record-modal"
                onClick={closeResultDialog}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:bg-cyan-300/10 hover:text-slate-100"
              >
                Cancel
              </Button>
            </div>

            <form ref={resultFormRef} onSubmit={handleRecordSubmit} className="mt-4 space-y-4" noValidate>
              <FormErrorSummary id="match-result-error-summary" errors={resultErrors} />
              <div>
                <Label className="mb-1.5 block text-slate-300">Record Final Score</Label>
                <div className="grid grid-cols-5 gap-2 items-center text-center">
                  <div className="col-span-2">
                    <span className="text-[11px] font-bold uppercase text-slate-400">{teamName ? teamName.substring(0, 10) : 'Us'}</span>
                    <Input
                      id="record-score-rangers"
                      data-validation-field="ourScore"
                      type="number" 
                      min="0" 
                      step="1"
                      inputMode="numeric"
                      value={ourScore}
                      onChange={e => {
                        setOurScore(e.target.value);
                        clearResultFieldError('ourScore');
                      }}
                      aria-invalid={Boolean(resultErrors.ourScore)}
                      aria-describedby={resultErrors.ourScore ? 'record-score-rangers-error' : undefined}
                      className={cn(scheduleInputClass(Boolean(resultErrors.ourScore)), 'h-14 text-center font-display text-2xl font-black')}
                    />
                    <FieldError id="record-score-rangers-error" message={resultErrors.ourScore} />
                  </div>
                  <div className="text-xl font-bold text-slate-400">:</div>
                  <div className="col-span-2">
                    <span className="text-[11px] font-bold uppercase text-slate-400">Opponent</span>
                    <Input
                      id="record-score-opponent"
                      data-validation-field="opponentScore"
                      type="number" 
                      min="0" 
                      step="1"
                      inputMode="numeric"
                      value={opponentScore}
                      onChange={e => {
                        setOpponentScore(e.target.value);
                        clearResultFieldError('opponentScore');
                      }}
                      aria-invalid={Boolean(resultErrors.opponentScore)}
                      aria-describedby={resultErrors.opponentScore ? 'record-score-opponent-error' : undefined}
                      className={cn(scheduleInputClass(Boolean(resultErrors.opponentScore)), 'h-14 text-center font-display text-2xl font-black')}
                    />
                    <FieldError id="record-score-opponent-error" message={resultErrors.opponentScore} />
                  </div>
                </div>
              </div>

              {/* Goal scorers picker */}
              {Number(ourScore) > 0 && (
                <div
                  data-validation-field="scorers"
                  tabIndex={resultErrors.scorers ? -1 : undefined}
                  className={`rounded-xl border bg-[#0b1726]/66 p-3 ${
                    resultErrors.scorers ? 'border-rose-300/45' : 'border-cyan-300/10'
                  }`}
                >
                  <Label className="mb-2 block text-slate-300">Track Team Scorers</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select
                      value={selectedScorer}
                      onValueChange={setSelectedScorer}
                    >
                      <SelectTrigger id="scorer-player-select" className={cn(scheduleInputClass(), 'h-9 flex-1 rounded-lg text-xs')}>
                        <SelectValue placeholder="Choose scorer" />
                      </SelectTrigger>
                      <SelectContent className="border-cyan-300/10 bg-[#07111f] text-slate-100">
                        {activeAthletes.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name} (#{p.number})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      id="add-scorer-btn"
                      type="button"
                      onClick={handleScorerAdd}
                      size="sm"
                      className={`rounded-lg ${schedulePrimaryButtonClass}`}
                    >
                      Add Scorer
                    </Button>
                  </div>

                  {currentScorers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {currentScorers.map(sc => (
                        <span key={sc.playerName} className="inline-flex items-center gap-1 rounded-lg border border-cyan-300/10 bg-[#07111f]/80 px-2 py-1 text-xs font-medium text-slate-100">
                          {sc.playerName} ({sc.count})
                          <Button
                            id={`remove-scorer-${sc.playerName.replace(/\s+/g, '-')}`}
                            type="button" 
                            onClick={() => handleScorerRemove(sc.playerId, sc.playerName)}
                            variant="ghost"
                            size="icon"
                            className="ml-0.5 size-5 text-rose-300 hover:bg-rose-300/10 hover:text-rose-100"
                            aria-label={`Remove ${sc.playerName} from scorers`}
                          >
                            <XCircle size={12} aria-hidden="true" />
                          </Button>
                        </span>
                      ))}
                    </div>
                  )}
                  <FieldError id="match-scorers-error" message={resultErrors.scorers} />
                </div>
              )}

              <div>
                <Label className="mb-1 block text-slate-300">Match MVP Award *</Label>
                <Select
                  value={selectedMvp}
                  onValueChange={value => {
                    setSelectedMvp(value);
                    clearResultFieldError('mvpId');
                  }}
                >
                  <SelectTrigger
                    id="mvp-player-select"
                    data-validation-field="mvpId"
                    aria-invalid={Boolean(resultErrors.mvpId)}
                    aria-describedby={resultErrors.mvpId ? 'mvp-player-select-error' : undefined}
                    className={scheduleInputClass(Boolean(resultErrors.mvpId))}
                  >
                    <SelectValue placeholder="Select Most Valuable Player" />
                  </SelectTrigger>
                  <SelectContent className="border-cyan-300/10 bg-[#07111f] text-slate-100">
                    {activeAthletes.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} (#{p.number}) - {p.position}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError id="mvp-player-select-error" message={resultErrors.mvpId} />
              </div>

              {resultError && (
                <div role="alert" className="rounded-xl border border-rose-300/25 bg-rose-300/10 px-3 py-2 text-xs font-semibold text-rose-100">
                  {resultError}
                </div>
              )}

              <div>
                <Label className="mb-1 block text-slate-300">Post-Match Coach Analysis</Label>
                <Textarea
                  id="game-post-notes"
                  placeholder="Analyze team shape, highlighting tactical setups or standout performers."
                  value={gameNotes}
                  onChange={e => setGameNotes(e.target.value)}
                  rows={2}
                  className={cn(scheduleInputClass(), 'min-h-20')}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  id="cancel-record-modal-btn"
                  type="button"
                  onClick={closeResultDialog}
                  variant="outline"
                  className={`rounded-xl ${scheduleActionButtonClass}`}
                >
                  Cancel
                </Button>
                <Button
                  id="submit-record-result-btn"
                  type="submit"
                  disabled={isRecordingResult}
                  className="rounded-xl border border-emerald-300/25 bg-emerald-400 text-slate-950 hover:bg-emerald-300 disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
                >
                  {isRecordingResult ? 'Publishing...' : 'Publish Scorecard'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}


      <div className="space-y-5">
        <GameWeekSummaryBar
          nextFixture={nextFixture}
          latestResult={latestResult}
          eventsThisMonth={visibleMonthGames.length}
          upcomingCount={upcomingMatchesCount}
          completedCount={completedMatchesCount}
          selectedDateLabel={selectedDateLabel}
          selectedCount={selectedGames.length}
          teamName={teamName}
        />

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <GameWeekCalendar
            calendarDays={calendarDays}
            games={games}
            viewDate={viewDate}
            selectedDateStr={selectedDateStr}
            todayStr={todayStr}
            monthNames={monthNames}
            onSelectDate={(dateStr, date) => {
              setSelectedDateStr(current => current === dateStr ? null : dateStr);
              setActiveInspectorTab('selected');
              if (date.getMonth() !== viewDate.getMonth()) {
                setViewDate(new Date(date.getFullYear(), date.getMonth(), 1));
              }
            }}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            onToday={() => {
              setViewDate(new Date());
              setSelectedDateStr(null);
              setActiveInspectorTab('selected');
            }}
          />

          <GameWeekInspector
            activeTab={activeInspectorTab}
            onTabChange={setActiveInspectorTab}
            selectedDateLabel={selectedDateLabel}
            selectedGames={selectedGames}
            upcomingGames={upcomingGames}
            completedGames={completedGames}
            teamName={teamName}
            players={players}
            highlightGameId={highlightGameId}
            onRecordResult={openResultEditor}
            onDeleteGame={onDeleteGame}
            availability={availability}
            onSetPlayerAvailability={setPlayerAvail}
          />
        </div>
      </div>
    </div>
  );
}
