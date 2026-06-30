import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Game, Player, Standing } from '../types';
import { Calendar, MapPin, Award, Plus, Edit, RefreshCw, Trophy, Clock, Trash2, ChevronLeft, ChevronRight, CalendarDays, Users, Dumbbell, Sparkles, CheckCircle2, XCircle, HelpCircle, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { availabilitySchema, coachNotesSchema } from '../persistence/schemas';
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

interface ValidMatchResultForm {
  ourScore: number;
  opponentScore: number;
  mvpId: string;
  notes: string;
  scorers: NonNullable<Game['scorers']>;
}

const GAME_TYPES: readonly GameType[] = ['League', 'Cup', 'Friendly', 'Training', 'Meeting'];
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

export default function ScheduleView({ games, players, standings, onAddGame, onRecordResult, onDeleteGame, teamName, highlightGameId }: ScheduleViewProps) {
  const resultDialogRef = useRef<HTMLDivElement | null>(null);
  const resultFormRef = useRef<HTMLFormElement | null>(null);
  const [filterTab, setFilterTab] = useState<'Upcoming' | 'Completed'>('Upcoming');
  
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

  // Match Availability Tracker state — per gameId, per playerId → yes/no/maybe
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

  // Coach Notes per upcoming match
  const [coachNotes, setCoachNotes] = useState<Record<string, string>>(() => {
    return readJsonStorage(STORAGE_KEYS.coachNotes, coachNotesSchema, {}, 'Coach notes');
  });

  const setCoachNoteForGame = (gameId: string, note: string) => {
    setCoachNotes(prev => {
      const next = { ...prev, [gameId]: note };
      writeJsonStorage(STORAGE_KEYS.coachNotes, next);
      return next;
    });
  };

  // Coach note editor state
  const [coachEditGameId, setCoachEditGameId] = useState<string | null>(null);
  const [coachDraft, setCoachDraft] = useState('');

  useEffect(() => {
    if (!highlightGameId) return;
    const highlightedGame = games.find(game => game.id === highlightGameId);
    if (!highlightedGame) return;
    setFilterTab(highlightedGame.status === 'Completed' ? 'Completed' : 'Upcoming');
    setSelectedDateStr(null);
  }, [games, highlightGameId]);

  useEffect(() => {
    if (!highlightGameId) return;
    const card = document.getElementById(`game-item-${highlightGameId}`);
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [games, filterTab, highlightGameId, selectedDateStr]);

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

  const filteredGames = games.filter(g => {
    const statusMatch = g.status === filterTab;
    const dateMatch = selectedDateStr ? g.date === selectedDateStr : true;
    return statusMatch && dateMatch;
  }).sort((a,b) => {
    return filterTab === 'Upcoming' 
      ? new Date(a.date).getTime() - new Date(b.date).getTime()
      : new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div
      id="schedule-view-container"
      className={DARK_GLASS_CLASSES.dashboardShell}
      style={{ ...DARK_GLASS_THEME_STYLE, ...DARK_GLASS_DASHBOARD_SURFACE_STYLE }}
    >
      
      {/* View Selector Filters */}
      <div className={`${scheduleCardClass} flex flex-col items-center justify-between gap-4 sm:flex-row`}>
        <div className="flex w-full min-w-0 gap-1 rounded-xl border border-cyan-300/10 bg-[#07111f]/72 p-1.5 shadow-inner shadow-black/10 sm:w-auto">
          <Button
            id="tab-upcoming-games"
            type="button"
            variant={filterTab === 'Upcoming' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterTab('Upcoming')}
            className={`min-w-0 flex-1 whitespace-normal text-center leading-tight sm:flex-none sm:whitespace-nowrap rounded-lg px-3 sm:px-5 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
              filterTab === 'Upcoming' 
                ? 'bg-orange-400 text-slate-950 shadow-sm shadow-black/20 hover:bg-orange-300'
                : 'text-slate-400 hover:bg-cyan-300/10 hover:text-slate-100'
            }`}
          >
            Upcoming Matches
          </Button>
          <Button
            id="tab-completed-games"
            type="button"
            variant={filterTab === 'Completed' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterTab('Completed')}
            className={`min-w-0 flex-1 whitespace-normal text-center leading-tight sm:flex-none sm:whitespace-nowrap rounded-lg px-3 sm:px-5 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
              filterTab === 'Completed' 
                ? 'bg-orange-400 text-slate-950 shadow-sm shadow-black/20 hover:bg-orange-300'
                : 'text-slate-400 hover:bg-cyan-300/10 hover:text-slate-100'
            }`}
          >
            Match Results
          </Button>
        </div>

        <Button
          id="toggle-schedule-form-btn"
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className={`w-full justify-center rounded-xl px-4 py-2.5 text-xs font-bold sm:w-auto ${schedulePrimaryButtonClass}`}
        >
          {isAdding ? <Plus size={14} className="rotate-45" /> : <Plus size={14} />}
          {isAdding ? 'Cancel' : 'Schedule Tournament Event'}
        </Button>
      </div>

      {/* Slide down Schedule Form */}
      {isAdding && (
        <motion.div 
          id="add-game-form-container"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className={`${scheduleCardClass} space-y-4`}
        >
          <div className={`flex items-center gap-2 border-b pb-2 ${scheduleDividerClass}`}>
            <Calendar className="font-bold text-orange-300" size={20} />
            <h3 className="font-display font-semibold text-slate-100">Add Next Game / Event</h3>
          </div>

          <form onSubmit={handleAddGameSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

      {/* Main Dual-Column Layout: Left dynamic calendar, Right list registry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMN 1: Dynamic Interactive Calendar widget */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Calendar Controller Card */}
          <div className={scheduleCardClass}>
            <div className={`mb-4 flex items-center justify-between border-b pb-2 ${scheduleDividerClass}`}>
              <h3 className="flex items-center gap-2 font-display text-xs font-black uppercase tracking-wider text-slate-100">
                <CalendarDays className="text-orange-300" size={18} />
                <span>{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
              </h3>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={prevMonth}
                  className={`size-8 rounded-lg p-1.5 ${scheduleActionButtonClass}`}
                  title="Previous Month"
                >
                  <ChevronLeft size={15} />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setViewDate(new Date());
                    setSelectedDateStr(null);
                  }}
                  className={`h-8 rounded-md px-2 text-[9px] font-bold uppercase ${scheduleActionButtonClass}`}
                  title="Reset to Active Work Month"
                >
                  Today
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={nextMonth}
                  className={`size-8 rounded-lg p-1.5 ${scheduleActionButtonClass}`}
                  title="Next Month"
                >
                  <ChevronRight size={15} />
                </Button>
              </div>
            </div>

            {/* Weekday Titles */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <span key={day} className="text-[9px] font-black uppercase tracking-widest text-slate-400">{day}</span>
              ))}
            </div>

            {/* Calendar grid cells */}
            <div className="grid grid-cols-7 gap-1">
              {getCalendarDays().map(({ dayNum, date, isCurrentMonth, dateStr }, idx) => {
                const isSelected = dateStr === selectedDateStr;
                const isToday = dateStr === todayStr;
                const dayEvents = games.filter(g => g.date === dateStr);
                const hasEvents = dayEvents.length > 0;

                return (
                  <Button
                    key={idx}
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (selectedDateStr === dateStr) {
                        setSelectedDateStr(null);
                      } else {
                        setSelectedDateStr(dateStr);
                      }
                      // Switch month viewing viewDate if clicking external days
                      if (date.getMonth() !== viewDate.getMonth()) {
                        setViewDate(new Date(date.getFullYear(), date.getMonth(), 1));
                      }
                    }}
                    className={`relative flex aspect-square h-auto flex-col items-center justify-center whitespace-normal rounded-xl border p-1 text-xs ${
                      isSelected 
                        ? 'border-orange-300 bg-orange-400 text-slate-950 font-bold shadow-md shadow-black/20 hover:bg-orange-300'
                        : isToday
                          ? 'border-cyan-300/45 bg-cyan-300/12 text-cyan-100 font-bold hover:bg-cyan-300/18'
                          : isCurrentMonth
                            ? 'border-cyan-300/10 bg-[#0b1726]/66 text-slate-200 hover:border-cyan-300/25 hover:bg-cyan-300/10'
                            : 'border-transparent bg-[#07111f]/35 text-slate-600 hover:bg-[#0b1726]/70 hover:text-slate-400'
                    }`}
                  >
                    <span className="text-[11px] font-semibold">{dayNum}</span>

                    {/* Event indicators */}
                    {hasEvents && (
                      <div className="absolute bottom-1.5 flex justify-center gap-0.5 max-w-[85%]">
                        {dayEvents.slice(0, 3).map((ev, eidx) => {
                          let dotColor = 'bg-blue-500';
                          if (ev.type === 'Cup') dotColor = 'bg-amber-500';
                          else if (ev.type === 'Friendly') dotColor = 'bg-slate-400';
                          else if (ev.type === 'Training') dotColor = 'bg-emerald-500';
                          else if (ev.type === 'Meeting') dotColor = 'bg-rose-500';

                          return (
                            <span 
                              key={eidx} 
                              className={`w-1 h-1 rounded-full shrink-0 ${isSelected ? 'bg-white' : dotColor}`} 
                            />
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <span className={`text-[7px] leading-none font-bold ${isSelected ? 'text-slate-950' : 'text-slate-400'}`}>+</span>
                        )}
                      </div>
                    )}
                  </Button>
                );
              })}
            </div>

            {/* Colored Tag Legends */}
            <div className={`mt-4 flex flex-wrap justify-between gap-x-2.5 gap-y-1.5 border-t pt-3 font-mono text-[8px] font-bold uppercase tracking-wider text-slate-400 ${scheduleDividerClass}`}>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>League</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Cup</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                <span>Friendly</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Training</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                <span>Meeting</span>
              </div>
            </div>
          </div>

          {/* Match Availability Tracker — next upcoming League/Cup/Friendly */}
          {(() => {
            const nextGames = games
              .filter(g => (g.type === 'League' || g.type === 'Cup' || g.type === 'Friendly') && g.status === 'Upcoming')
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 2);

            if (nextGames.length === 0) return null;

            return (
              <div className={`${scheduleCardClass} space-y-3`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[9px] font-black uppercase tracking-wider text-emerald-300">Match Availability</h4>
                    <p className="text-[10px] text-slate-400">Tap to confirm player status for upcoming fixtures</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400">
                    <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-sm bg-emerald-500"></span> Yes</span>
                    <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-sm bg-rose-500"></span> No</span>
                    <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-sm bg-amber-500"></span> Maybe</span>
                  </div>
                </div>

                {nextGames.map(game => {
                  const activePlayers = players.filter(p => p.registrationStatus === 'Active');
                  const av = availability[game.id] || {};
                  const yesCount = Object.values(av).filter(v => v === 'yes').length;
                  const noCount = Object.values(av).filter(v => v === 'no').length;
                  const maybeCount = Object.values(av).filter(v => v === 'maybe').length;
                  const gameDate = new Date(game.date);
                  const daysUntil = Math.ceil((gameDate.getTime() - Date.now()) / (1000*3600*24));

                  return (
                    <div key={game.id} className={`${scheduleInsetClass} p-3`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`px-1.5 py-0.5 text-[8px] ${
                            game.type === 'League' ? 'border-cyan-300/25 bg-cyan-300/10 text-cyan-100' :
                            'border-amber-300/30 bg-amber-300/15 text-amber-100'
                          }`}>{game.type}</Badge>
                          <span className="text-[10px] font-bold text-slate-100">vs {game.opponent}</span>
                          <span className="text-[9px] text-slate-400">{game.date} · {daysUntil}d</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold">
                          <span className="text-emerald-300">{yesCount} ✓</span>
                          <span className="text-slate-600">|</span>
                          <span className="text-rose-300">{noCount} ✗</span>
                          <span className="text-slate-600">|</span>
                          <span className="text-amber-300">{maybeCount} ?</span>
                          <span className="text-slate-400 ml-0.5">of {activePlayers.length}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {activePlayers.map(p => {
                          const status = av[p.id] || '';
                          return (
                            <Button
                              key={p.id}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setPlayerAvail(game.id, p.id, status === 'yes' ? 'yes' : status === 'no' ? 'no' : status === 'maybe' ? 'maybe' : 'yes')}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                setPlayerAvail(game.id, p.id, 'no');
                              }}
                              title={`${p.name}: ${status || 'unset'} (right-click = No)`}
                              className={`h-7 rounded-full px-2 py-1 text-[9px] font-bold ${
                                status === 'yes' ? 'border-emerald-300/35 bg-emerald-300/15 text-emerald-100' :
                                status === 'no' ? 'border-rose-300/35 bg-rose-300/15 text-rose-100 line-through' :
                                status === 'maybe' ? 'border-amber-300/35 bg-amber-300/15 text-amber-100' :
                                'border-cyan-300/10 bg-[#07111f]/72 text-slate-400 hover:border-cyan-300/25 hover:text-slate-100'
                              }`}
                            >
                              {p.name.length > 10 ? p.name.substring(0, 10) + '…' : p.name}
                            </Button>
                          );
                        })}
                      </div>
                      {!Object.keys(av).length && (
                        <p className="text-[9px] text-slate-400 italic mt-1">No responses yet — tap a player name to mark them as available.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Upcoming Opponent Quick Intel */}
          {(() => {
            const nextMatch = games
              .filter(g => (g.type === 'League' || g.type === 'Cup' || g.type === 'Friendly') && g.status === 'Upcoming')
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

            if (!nextMatch) return null;

            // Find opponent in standings
            const oppStanding = standings.find(s => 
              s.teamName.toLowerCase() === nextMatch.opponent.toLowerCase()
            );

            // Compute head-to-head from completed games
            const h2hGames = games.filter(g => 
              g.type === nextMatch.type && 
              g.status === 'Completed' && 
              g.opponent.toLowerCase() === nextMatch.opponent.toLowerCase()
            );
            const h2hWon = h2hGames.filter(g => (g.ourScore || 0) > (g.opponentScore || 0)).length;
            const h2hDrawn = h2hGames.filter(g => g.ourScore === g.opponentScore).length;
            const h2hLost = h2hGames.filter(g => (g.ourScore || 0) < (g.opponentScore || 0)).length;
            const h2hTotal = h2hWon + h2hDrawn + h2hLost;
            const h2hGoalsFor = h2hGames.reduce((s, g) => s + (g.ourScore || 0), 0);
            const h2hGoalsAgainst = h2hGames.reduce((s, g) => s + (g.opponentScore || 0), 0);

            return (
              <div className={`${scheduleCardClass} space-y-3`}>
                <div>
                  <h4 className="text-[9px] font-black uppercase text-amber-400 tracking-wider">Next Opponent Intel</h4>
                  <h3 className="font-display font-black text-sm mt-0.5">{nextMatch.opponent}</h3>
                  <p className="text-[10px] text-slate-400">
                    {nextMatch.type} · {nextMatch.date} · {nextMatch.time} · {nextMatch.location}
                  </p>
                </div>

                {oppStanding && (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg border border-cyan-300/10 bg-[#07111f]/80 p-2">
                      <div className="text-lg font-black text-white">#{oppStanding.rank}</div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase">Position</div>
                    </div>
                    <div className="rounded-lg border border-cyan-300/10 bg-[#07111f]/80 p-2">
                      <div className="text-lg font-black text-white">{oppStanding.points}</div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase">Points</div>
                    </div>
                    <div className="rounded-lg border border-cyan-300/10 bg-[#07111f]/80 p-2">
                      <div className="text-lg font-black text-white">{oppStanding.won}W-{oppStanding.drawn}D-{oppStanding.lost}L</div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase">Record</div>
                    </div>
                  </div>
                )}

                {h2hTotal > 0 && (
                  <div className="rounded-lg border border-cyan-300/10 bg-[#07111f]/80 p-2.5">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Head-to-Head</span>
                    <div className="flex items-center gap-3 mt-1 text-[10px] font-bold">
                      <span className="text-emerald-400">{h2hWon}W</span>
                      <span className="text-slate-400">{h2hDrawn}D</span>
                      <span className="text-rose-400">{h2hLost}L</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-white">GF {h2hGoalsFor}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-white">GA {h2hGoalsAgainst}</span>
                      {h2hTotal > 0 && (
                        <span className="text-[9px] text-slate-500 ml-auto">
                          {h2hWon > h2hLost ? '⬆️ Edge' : h2hLost > h2hWon ? '⬇️ Underdog' : '↔️ Even'}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {nextMatch.notes && (
                  <div className="bg-amber-400/10 border border-amber-400/20 rounded-lg p-2.5 flex items-start gap-2">
                    <AlertTriangle size={12} className="text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-amber-200/80 leading-relaxed">{nextMatch.notes}</p>
                  </div>
                )}

                {!oppStanding && !h2hTotal && !nextMatch.notes && (
                  <p className="text-[10px] text-slate-500 italic">No intel available yet — add this opponent to the standings table for position data.</p>
                )}
              </div>
            );
          })()}

          {/* Coach's Notes for Next Match */}
          {(() => {
            const nextMatch = games
              .filter(g => (g.type === 'League' || g.type === 'Cup' || g.type === 'Friendly') && g.status === 'Upcoming')
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

            if (!nextMatch) return null;

            const note = coachNotes[nextMatch.id] || '';
            const editing = coachEditGameId === nextMatch.id;

            return (
              <div className={`${scheduleCardClass} space-y-2.5`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[9px] font-black uppercase tracking-wider text-orange-300">Coach's Notes</h4>
                    <p className="text-[10px] text-slate-400">vs {nextMatch.opponent} · {nextMatch.date}</p>
                  </div>
                  {!editing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => { setCoachDraft(note); setCoachEditGameId(nextMatch.id); }}
                      className={`h-7 rounded-lg px-2 py-1 text-[9px] font-bold ${scheduleActionButtonClass}`}
                    >
                      {note ? 'Edit' : '+ Add Notes'}
                    </Button>
                  )}
                </div>

                {editing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={coachDraft}
                      onChange={e => setCoachDraft(e.target.value)}
                      placeholder="Tactical notes, set-piece instructions, key player matchups, motivational message…"
                      rows={4}
                      className={cn(scheduleInputClass(), 'resize-none rounded-lg p-2.5 text-[10px] font-medium')}
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setCoachNoteForGame(nextMatch.id, coachDraft);
                          setCoachEditGameId(null);
                        }}
                        className={`h-7 rounded-lg px-3 py-1.5 text-[9px] font-black ${schedulePrimaryButtonClass}`}
                      >
                        Save Notes
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => { setCoachEditGameId(null); }}
                        className="h-7 px-2 py-1.5 text-[9px] font-bold text-slate-400 hover:bg-cyan-300/10 hover:text-slate-100"
                      >
                        Cancel
                      </Button>
                      {note && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCoachNoteForGame(nextMatch.id, '');
                            setCoachEditGameId(null);
                          }}
                          className="ml-auto h-7 px-2 text-[9px] font-bold text-rose-300 hover:bg-rose-300/10 hover:text-rose-100"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                ) : note ? (
                  <div className={`${scheduleInsetClass} max-h-36 overflow-y-auto p-2.5 text-[10px] leading-relaxed text-slate-300 whitespace-pre-wrap`}>
                    {note}
                  </div>
                ) : (
                  <p className="text-[10px] italic text-slate-500">No tactical notes yet. Tap "Add Notes" to write pre-match instructions.</p>
                )}
              </div>
            );
          })()}

        </div>

        {/* COLUMN 2: Full Chronological List of Game Events (with dynamic calendar filter apply) */}
        <div className="lg:col-span-7 space-y-4">
          
          {selectedDateStr && (
            <div className={`${scheduleCardClass} flex items-center justify-between p-4 text-xs text-slate-300`}>
              <span className="font-semibold flex items-center gap-1.5">
                <CalendarDays size={14} className="animate-pulse text-orange-300" />
                <span>Showing events matching date: <strong>{new Date(selectedDateStr).toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'})}</strong></span>
              </span>
              <Button
                type="button"
                variant="link"
                onClick={() => setSelectedDateStr(null)}
                className="text-xs font-bold text-orange-200 hover:text-orange-100"
              >
                Clear Filter
              </Button>
            </div>
          )}

          <div id="games-schedule-list" className="space-y-4">
            {filteredGames.length === 0 ? (
              <div className={`${scheduleCardClass} flex flex-col items-center justify-center space-y-3 py-12 text-center`}>
                <Calendar size={32} className="animate-bounce text-orange-300/70" />
                <h4 className="font-semibold text-slate-100">No {filterTab.toLowerCase()} events found</h4>
                <p className="text-xs text-slate-400">Register new events or log completions above.</p>
              </div>
            ) : (
              filteredGames.map((game) => {
                const isIntegrityHighlighted = highlightGameId === game.id;
                const daysLeft = Math.ceil((new Date(game.date).getTime() - Date.now()) / (1000 * 3600 * 24));
                const mvpName = players.find(p => p.id === game.mvpId)?.name;

                let iconSymbol = 'VS';
                if (game.status === 'Completed') {
                  iconSymbol = game.ourScore! > game.opponentScore! ? 'W' : game.ourScore! === game.opponentScore! ? 'D' : 'L';
                } else if (game.type === 'Training') {
                  iconSymbol = '💪';
                } else if (game.type === 'Meeting') {
                  iconSymbol = '📋';
                }

                return (
                  <motion.div
                    id={`game-item-${game.id}`}
                    key={game.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col items-start justify-between gap-4 rounded-2xl border bg-[#07111f]/88 p-5 text-slate-100 shadow-sm shadow-black/10 backdrop-blur-xl transition-all duration-300 hover:border-orange-300/35 hover:bg-[#0b1726]/92 hover:shadow-lg hover:shadow-black/20 md:flex-row md:items-center ${
                      isIntegrityHighlighted ? 'border-amber-300/60 ring-4 ring-amber-300/15' : 'border-cyan-300/10'
                    }`}
                  >
                    
                    {/* Left side details */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-display font-black text-lg shrink-0 ${
                        game.status === 'Completed' 
                          ? (game.ourScore! > game.opponentScore! ? 'border border-emerald-300/25 bg-emerald-300/15 text-emerald-100' : game.ourScore! === game.opponentScore! ? 'border border-slate-300/20 bg-slate-300/10 text-slate-200' : 'border border-rose-300/25 bg-rose-300/15 text-rose-100')
                          : 'border border-orange-300/25 bg-orange-300/15 text-orange-100'
                      }`}>
                        {iconSymbol}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <Badge id={`game-${game.id}-type-badge`} className={`rounded-full px-2 py-0.5 text-[9px] ${
                            getGameTypeBadgeClass(game.type)
                          }`}>
                            {game.type}
                          </Badge>
                          {isIntegrityHighlighted && (
                            <Badge className="rounded-full border-amber-300/30 bg-amber-300/15 px-2 py-0.5 text-[9px] text-amber-100">
                              Review
                            </Badge>
                          )}
                          {game.status === 'Upcoming' && daysLeft > 0 && (
                            <Badge id={`game-${game.id}-countdown-badge`} className="rounded-full border-rose-300/25 bg-rose-300/10 px-2 py-0.5 text-[9px] text-rose-100">
                              In {daysLeft} Days
                            </Badge>
                          )}
                        </div>
                        
                        <h4 id={`game-${game.id}-title`} className="mt-1 font-display text-[13px] font-semibold text-slate-100 md:text-sm">
                          {game.type === 'Training' || game.type === 'Meeting' ? (
                            <span className="font-bold text-slate-50">{game.opponent}</span>
                          ) : (
                            <span><span className="font-bold text-slate-50">{teamName || 'Our Team'}</span> <span className="font-sans font-medium text-slate-400">vs</span> <span className="font-bold text-slate-50">{game.opponent}</span></span>
                          )}
                        </h4>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span id={`game-${game.id}-dt`} className="flex items-center gap-1.5 mt-0.5 font-medium">
                            <Clock size={12} className="text-orange-300" />
                            {game.date} @ {game.time}
                          </span>
                          <span id={`game-${game.id}-loc`} className="flex items-center gap-1.5 mt-0.5 font-medium">
                            <MapPin size={12} className="text-cyan-200" />
                            {game.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Score display or recording */}
                    <div className={`flex w-full items-center justify-between gap-4 self-stretch border-t pt-3 text-right md:w-auto md:self-auto md:justify-end md:border-none md:pt-0 ${scheduleDividerClass}`}>
                      
                      {game.status === 'Completed' ? (
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-end">
                            <div id={`game-${game.id}-score`} className="font-display text-xl font-black tracking-tight text-slate-100">
                              {game.ourScore} - {game.opponentScore}
                            </div>
                            {mvpName && (
                              <div id={`game-${game.id}-mvp`} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                                <Award size={11} className="fill-amber-300 text-amber-500" /> {mvpName}
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openResultEditor(game)}
                            className={`h-7 rounded-lg px-2 py-1 text-[10px] font-bold ${scheduleActionButtonClass}`}
                          >
                            Edit Result
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          {/* Only show Log scorecard for non-training / non-meeting events */}
                          {game.type !== 'Training' && game.type !== 'Meeting' && (
                            <Button
                              type="button"
                              id={`record-score-btn-${game.id}`}
                              variant="outline"
                              size="sm"
                              onClick={() => openResultEditor(game)}
                              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold ${scheduleSuccessButtonClass}`}
                            >
                              <Trophy size={11} />
                              Log Score
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Options: Delete Match Event */}
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
                        className="size-8 rounded-lg p-1.5 text-slate-500 hover:bg-rose-300/10 hover:text-rose-200"
                        title="Remove Event"
                      >
                        <Trash2 size={14} />
                      </Button>

                    </div>

                    {/* Tactical notes drawers */}
                    {game.notes && (
                      <div className={`${scheduleInsetClass} mt-3 grid w-full grid-cols-1 gap-4 p-3 text-xs text-slate-400 md:grid-cols-2`}>
                        <div>
                          <strong className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Squad Briefing / Notes</strong>
                          <p className="leading-relaxed text-slate-300">{game.notes}</p>
                        </div>
                        {game.scorers && game.scorers.length > 0 && (
                          <div id={`game-${game.id}-scorers-list`}>
                            <strong className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-orange-300">Goal Scorers</strong>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {game.scorers.map(sc => (
                                <span key={sc.playerName} className="rounded border border-cyan-300/10 bg-[#07111f]/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-200">
                                  ⚽ {sc.playerName} ({sc.count})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
