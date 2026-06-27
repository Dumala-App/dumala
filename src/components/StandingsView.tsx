import React, { useEffect, useRef, useState } from 'react';
import { Standing, TeamInfo, Player, PlayerOffense, MvpAwardRecord } from '../types';
import {findUserStanding, sortStandings} from '../standings';
import { 
  Trophy, RefreshCw, Star, Edit, Save, Plus, Trash2, CheckCircle, X, Sliders,
  Calendar, Edit3, Info, Archive, History, RotateCcw, AlertTriangle, ClipboardList, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { standingsBackupsSchema } from '../persistence/schemas';
import {
  readBooleanStorage,
  readJsonStorage,
  STORAGE_KEYS,
  writeBooleanStorage,
  writeJsonStorage
} from '../persistence/storage';
import { FieldError, FormErrorSummary } from './FormValidation';
import {
  FieldErrors,
  focusFirstInvalidField,
  hasFieldErrors,
  mergeFieldErrors,
  parseIntegerInput
} from '../forms/validation';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from './ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { cn } from '../lib/utils';

interface StandingsViewProps {
  standings: Standing[];
  onUpdateStanding: (updated: Standing) => void;
  onResetStandings: () => void;
  teamName: string;
  teamInfo: TeamInfo;
  onUpdateTeamInfo: (updated: TeamInfo) => void;
  onUpdateAllStandings: (updated: Standing[]) => void;
  players: Player[];
  onUpdatePlayer: (updated: Player) => void;
  highlightStandingTeamName?: string | null;
}

type CardType = PlayerOffense['cardType'];
type ScoreboardField = 'homeTeam' | 'awayTeam' | 'homeScore' | 'awayScore';
type StandingEditField = 'teamName' | 'won' | 'drawn' | 'lost' | 'goalsFor' | 'goalsAgainst';
type AddClubField = 'clubName';

const CARD_TYPES: readonly CardType[] = ['Yellow', 'Red', 'Second Yellow', 'Straight Red'];
const CARD_TYPE_LABELS: Record<CardType, string> = {
  Yellow: 'Yellow',
  Red: 'Red',
  'Second Yellow': 'Second yellow',
  'Straight Red': 'Straight red'
};
const CARD_TYPE_BADGE_VARIANTS: Record<CardType, React.ComponentProps<typeof Badge>['variant']> = {
  Yellow: 'warning',
  Red: 'destructive',
  'Second Yellow': 'warning',
  'Straight Red': 'destructive'
};
const standingsCompactControlClass = 'h-8 rounded-md text-[10px] font-medium';
const standingsPanelControlClass = 'rounded-xl text-xs font-semibold';
const standingsPanelInvalidClass = 'border-rose-300 focus-visible:ring-rose-500/25';

const parseCardType = (value: string): CardType => (
  CARD_TYPES.includes(value as CardType) ? value as CardType : 'Yellow'
);

const integerError = (result: ReturnType<typeof parseIntegerInput>): string | undefined => (
  'errors' in result ? result.errors.value : undefined
);

const toStandingAnchorId = (teamName: string): string => (
  `standing-row-${teamName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
);

interface StandingsBackup {
  id: string;
  createdAt: string;
  label: string;
  source: 'manual' | 'sunday';
  standings: Standing[];
}

export default function StandingsView({ 
  standings, 
  onUpdateStanding, 
  onResetStandings, 
  teamName,
  teamInfo,
  onUpdateTeamInfo,
  onUpdateAllStandings,
  players,
  onUpdatePlayer,
  highlightStandingTeamName
}: StandingsViewProps) {
  const scoreboardFormRef = useRef<HTMLFormElement | null>(null);
  const addClubFormRef = useRef<HTMLFormElement | null>(null);
  // Editing individual team row state
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState("");
  const [won, setWon] = useState('0');
  const [drawn, setDrawn] = useState('0');
  const [lost, setLost] = useState('0');
  const [gf, setGf] = useState('0');
  const [ga, setGa] = useState('0');
  const [standingEditErrors, setStandingEditErrors] = useState<FieldErrors<StandingEditField>>({});

  // League Name Edit state
  const [isEditingLeagueName, setIsEditingLeagueName] = useState(false);
  const [tempLeagueName, setTempLeagueName] = useState(teamInfo.league || "Regional Division");

  // Add new club team state
  const [newClubName, setNewClubName] = useState("");
  const [addClubErrors, setAddClubErrors] = useState<FieldErrors<AddClubField>>({});
  const [showAddClubPanel, setShowAddClubPanel] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showBackupLog, setShowBackupLog] = useState(false);
  const [standingsBackups, setStandingsBackups] = useState<StandingsBackup[]>(() => {
    return readJsonStorage(STORAGE_KEYS.standingsBackups, standingsBackupsSchema, [], 'Standings history');
  });
  const [sundayBackupEnabled, setSundayBackupEnabled] = useState(() => {
    return readBooleanStorage(STORAGE_KEYS.sundayBackupEnabled, true, 'Standings preferences');
  });
  const [backupNotice, setBackupNotice] = useState('');

  // Match scoreboard logger state
  const [showLogger, setShowLogger] = useState(false);
  const [logHomeTeam, setLogHomeTeam] = useState("");
  const [logAwayTeam, setLogAwayTeam] = useState("");
  const [logHomeScore, setLogHomeScore] = useState('0');
  const [logAwayScore, setLogAwayScore] = useState('0');
  const [scoreboardErrors, setScoreboardErrors] = useState<FieldErrors<ScoreboardField>>({});
  const [logSuccessMessage, setLogSuccessMessage] = useState("");

  const saveBackups = (nextBackups: StandingsBackup[]) => {
    const limitedBackups = nextBackups.slice(0, 12);
    setStandingsBackups(limitedBackups);
    writeJsonStorage(STORAGE_KEYS.standingsBackups, limitedBackups);
  };

  const createStandingsBackup = (source: StandingsBackup['source'], customLabel?: string) => {
    if (standings.length === 0) {
      setBackupNotice('Add teams before creating a standings backup.');
      return;
    }

    const now = new Date();
    const dateLabel = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const newBackup: StandingsBackup = {
      id: `${source}-${now.toISOString()}`,
      createdAt: now.toISOString(),
      label: customLabel || (source === 'sunday' ? `Sunday snapshot - ${dateLabel}` : `Manual snapshot - ${dateLabel}`),
      source,
      standings: standings.map(team => ({ ...team }))
    };
    saveBackups([newBackup, ...standingsBackups]);
    setBackupNotice(source === 'sunday' ? 'Sunday standings backup saved.' : 'Standings snapshot saved.');
  };

  useEffect(() => {
    writeBooleanStorage(STORAGE_KEYS.sundayBackupEnabled, sundayBackupEnabled);
  }, [sundayBackupEnabled]);

  useEffect(() => {
    if (!sundayBackupEnabled || standings.length === 0) return;
    const today = new Date();
    if (today.getDay() !== 0) return;

    const dateKey = today.toISOString().slice(0, 10);
    const alreadySaved = standingsBackups.some(backup =>
      backup.source === 'sunday' && backup.createdAt.slice(0, 10) === dateKey
    );
    if (!alreadySaved) createStandingsBackup('sunday');
  }, [sundayBackupEnabled, standings.length]);

  useEffect(() => {
    if (!highlightStandingTeamName) return;
    const row = document.getElementById(toStandingAnchorId(highlightStandingTeamName));
    if (!row) return;
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightStandingTeamName, standings]);

  const startEdit = (team: Standing) => {
    setEditingTeam(team.teamName);
    setEditingTeamName(team.teamName);
    setWon(String(team.won));
    setDrawn(String(team.drawn));
    setLost(String(team.lost));
    setGf(String(team.goalsFor));
    setGa(String(team.goalsAgainst));
    setStandingEditErrors({});
  };

  const handleSave = (team: Standing) => {
    const parsedWon = parseIntegerInput(won, { label: 'Wins', min: 0 });
    const parsedDrawn = parseIntegerInput(drawn, { label: 'Draws', min: 0 });
    const parsedLost = parseIntegerInput(lost, { label: 'Losses', min: 0 });
    const parsedGf = parseIntegerInput(gf, { label: 'Goals for', min: 0 });
    const parsedGa = parseIntegerInput(ga, { label: 'Goals against', min: 0 });
    const trimmedName = editingTeamName.trim();

    const nameTaken = standings.some(candidate =>
      candidate.teamName !== team.teamName
      && candidate.teamName.toLowerCase() === trimmedName.toLowerCase()
    );
    const nextErrors = mergeFieldErrors<StandingEditField>(
      trimmedName ? {} : { teamName: 'Club name is required.' },
      nameTaken ? { teamName: 'A club with this name already exists.' } : {},
      integerError(parsedWon) ? { won: integerError(parsedWon) } : {},
      integerError(parsedDrawn) ? { drawn: integerError(parsedDrawn) } : {},
      integerError(parsedLost) ? { lost: integerError(parsedLost) } : {},
      integerError(parsedGf) ? { goalsFor: integerError(parsedGf) } : {},
      integerError(parsedGa) ? { goalsAgainst: integerError(parsedGa) } : {}
    );

    if (
      hasFieldErrors(nextErrors)
      || !parsedWon.ok
      || !parsedDrawn.ok
      || !parsedLost.ok
      || !parsedGf.ok
      || !parsedGa.ok
    ) {
      setStandingEditErrors(nextErrors);
      return;
    }

    const updatedPlayed = parsedWon.value + parsedDrawn.value + parsedLost.value;
    const updatedPoints = (parsedWon.value * 3) + parsedDrawn.value;
    
    const updatedList = standings.map(t => {
      // Find the old team by its original name
      if (t.teamName === team.teamName) {
        return {
          ...t,
          teamName: trimmedName,
          played: updatedPlayed,
          won: parsedWon.value,
          drawn: parsedDrawn.value,
          lost: parsedLost.value,
          goalsFor: parsedGf.value,
          goalsAgainst: parsedGa.value,
          points: updatedPoints
        };
      }
      return t;
    });

    onUpdateAllStandings(updatedList);
    setEditingTeam(null);
    setStandingEditErrors({});
  };

  const handleDeleteTeam = (teamNameToDelete: string) => {
    if (window.confirm(`Are you sure you want to remove ${teamNameToDelete} from the league standings?`)) {
      const filtered = standings.filter(t => t.teamName !== teamNameToDelete);
      onUpdateAllStandings(filtered);
    }
  };

  const handleAddClub = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedClubName = newClubName.trim();

    // Check if team already exists
    const nextErrors: FieldErrors<AddClubField> = {
      clubName: !trimmedClubName
        ? 'Club name is required.'
        : standings.some(t => t.teamName.toLowerCase() === trimmedClubName.toLowerCase())
          ? 'A team with this name already exists in the league division.'
          : undefined
    };
    if (hasFieldErrors(nextErrors)) {
      setAddClubErrors(nextErrors);
      focusFirstInvalidField(addClubFormRef.current, nextErrors);
      return;
    }

    const newClub: Standing = {
      rank: standings.length + 1,
      teamName: trimmedClubName,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      isUserTeam: trimmedClubName.toLowerCase() === teamName.toLowerCase()
    };

    onUpdateAllStandings([...standings, newClub]);
    setNewClubName("");
    setAddClubErrors({});
    setShowAddClubPanel(false);
  };

  // Scoreboard logger submit
  const handleApplyMatchResults = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedHomeScore = parseIntegerInput(logHomeScore, { label: 'Home score', min: 0 });
    const parsedAwayScore = parseIntegerInput(logAwayScore, { label: 'Away score', min: 0 });
    const teamNames = new Set(standings.map(team => team.teamName));
    const nextErrors = mergeFieldErrors<ScoreboardField>(
      teamNames.has(logHomeTeam) ? {} : { homeTeam: 'Choose a home club from the standings.' },
      teamNames.has(logAwayTeam) ? {} : { awayTeam: 'Choose an away club from the standings.' },
      logHomeTeam && logAwayTeam && logHomeTeam === logAwayTeam
        ? { awayTeam: 'Home and away clubs must be different.' }
        : {},
      integerError(parsedHomeScore) ? { homeScore: integerError(parsedHomeScore) } : {},
      integerError(parsedAwayScore) ? { awayScore: integerError(parsedAwayScore) } : {}
    );

    if (hasFieldErrors(nextErrors) || !parsedHomeScore.ok || !parsedAwayScore.ok) {
      setScoreboardErrors(nextErrors);
      focusFirstInvalidField(scoreboardFormRef.current, nextErrors);
      return;
    }

    const homeGoals = parsedHomeScore.value;
    const awayGoals = parsedAwayScore.value;

    const updatedList = standings.map(t => {
      // Home Team update
      if (t.teamName === logHomeTeam) {
        const isWin = homeGoals > awayGoals;
        const isDraw = homeGoals === awayGoals;
        const pts = isWin ? 3 : isDraw ? 1 : 0;
        return {
          ...t,
          played: t.played + 1,
          won: t.won + (isWin ? 1 : 0),
          drawn: t.drawn + (isDraw ? 1 : 0),
          lost: t.lost + (!isWin && !isDraw ? 1 : 0),
          goalsFor: t.goalsFor + homeGoals,
          goalsAgainst: t.goalsAgainst + awayGoals,
          points: t.points + pts
        };
      }
      // Away Team update
      if (t.teamName === logAwayTeam) {
        const isWin = awayGoals > homeGoals;
        const isDraw = homeGoals === awayGoals;
        const pts = isWin ? 3 : isDraw ? 1 : 0;
        return {
          ...t,
          played: t.played + 1,
          won: t.won + (isWin ? 1 : 0),
          drawn: t.drawn + (isDraw ? 1 : 0),
          lost: t.lost + (!isWin && !isDraw ? 1 : 0),
          goalsFor: t.goalsFor + awayGoals,
          goalsAgainst: t.goalsAgainst + homeGoals,
          points: t.points + pts
        };
      }
      return t;
    });

    onUpdateAllStandings(updatedList);
    setLogSuccessMessage(`Result logged: ${logHomeTeam} ${homeGoals} - ${awayGoals} ${logAwayTeam}`);
    setLogHomeScore('0');
    setLogAwayScore('0');
    setScoreboardErrors({});
    setTimeout(() => setLogSuccessMessage(""), 4000);
  };

  const handleSaveLeagueName = () => {
    if (!tempLeagueName.trim()) return;
    onUpdateTeamInfo({
      ...teamInfo,
      league: tempLeagueName.trim()
    });
    setIsEditingLeagueName(false);
  };

  const restoreStandingsBackup = (backup: StandingsBackup) => {
    onUpdateAllStandings(backup.standings.map(team => ({ ...team })));
    setBackupNotice(`Restored ${backup.label}.`);
  };

  const deleteStandingsBackup = (backupId: string) => {
    saveBackups(standingsBackups.filter(backup => backup.id !== backupId));
    setBackupNotice('Backup removed.');
  };

  const sortedStandings = sortStandings(standings);

  // Dynamic calculations for Hero rank cards
  const userTeamInstance = findUserStanding(sortedStandings, teamName);
  const userRank = userTeamInstance?.rank || "N/A";
  const userPoints = userTeamInstance?.points || 0;
  
  // Calculate dynamic summary text
  const leaderTeam = sortedStandings[0];
  const isLeader = userTeamInstance?.teamName === leaderTeam?.teamName;
  const ptsBack = leaderTeam && userTeamInstance ? (leaderTeam.points - userTeamInstance.points) : 0;
  const totalMatchesPlayed = Math.floor(sortedStandings.reduce((sum, team) => sum + team.played, 0) / 2);
  const totalGoals = sortedStandings.reduce((sum, team) => sum + team.goalsFor, 0);
  const averageGoals = totalMatchesPlayed > 0 ? (totalGoals / totalMatchesPlayed).toFixed(1) : "0.0";
  const bestAttack = [...sortedStandings].sort((a, b) => b.goalsFor - a.goalsFor)[0];
  const bestDefense = [...sortedStandings].sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0];

  return (
    <div id="standings-view-container" className="space-y-6">
      
      {/* Standings Header with Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* League Rank Hero */}
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-10px] text-white/15">
            <Trophy size={110} />
          </div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-100">League Standing</span>
          <h3 className="text-2xl font-display font-bold mt-1">
            {isLeader ? "Division Leader! 🏆" : ptsBack <= 3 ? "Within Striking Distance ⚡" : "Chasing First Place 🏃"}
          </h3>
          <div className="mt-4 flex items-baseline gap-2">
            <span id="user-team-rank-display" className="text-5xl font-display font-black text-amber-400">#{userRank}</span>
            <span className="text-xs text-indigo-100">{userTeamInstance?.teamName || teamName} ({userPoints} pts)</span>
          </div>
          <p className="text-xs text-indigo-100/85 mt-2 leading-relaxed">
            {isLeader 
              ? "You are currently sitting at the top of the league! Keep defending the title in the subsequent weeks." 
              : leaderTeam 
                ? `Only ${ptsBack} points behind league leaders ${leaderTeam.teamName}. Adjust matches and keep fighting for glory!`
                : "No division matched yet. Use the scoreboard tools to build up history!"}
          </p>
        </div>

        {/* Action Quick Gates / Config panel */}
        <div className="bg-white p-5 rounded-2xl shadow-md shadow-slate-100/30 border border-slate-200/60 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 block font-mono">League Managers</span>
            <h3 className="text-base font-display font-bold text-slate-800 mt-1">Manual Tools</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Add competitor clubs and maintain the sample league structure.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              id="toggle-add-club-btn"
              type="button"
              onClick={() => {
                setShowAddClubPanel(!showAddClubPanel);
                setShowLogger(false);
              }}
              variant="outline"
              size="sm"
              className="rounded-xl border-indigo-100 bg-indigo-50 text-xs font-bold text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800"
            >
              <Plus size={13} />
              Add Club
            </Button>
          </div>
        </div>

        {/* Scoreboard Weekly Updater Gate */}
        <div className="bg-white p-5 rounded-2xl shadow-md shadow-slate-100/30 border border-slate-200/60 flex flex-col justify-between relative overflow-hidden">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 block font-mono">Matchday Sync</span>
            <h3 className="text-base font-display font-bold text-slate-800 mt-1">Scoreboard Updater</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Instantly log a league match score to automatically crunch the standings numbers, update points, and adjust ranks!
            </p>
          </div>
          <Button
            id="toggle-scoreboard-logger-btn"
            type="button"
            onClick={() => {
              setShowLogger(!showLogger);
              setShowAddClubPanel(false);
            }}
            className="mt-4 w-full rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
          >
            <Calendar size={13} />
            {showLogger ? "Hide Weekly Updater" : "Open Weekly Scoreboard Updater"}
          </Button>
        </div>

      </div>

      {/* Expandable Forms Panel */}
      {highlightStandingTeamName && !standings.some(team => team.teamName.toLowerCase() === highlightStandingTeamName.toLowerCase()) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-black uppercase tracking-wider text-[11px]">Missing standings row</p>
          <p className="mt-1 text-xs leading-relaxed">
            Review "{highlightStandingTeamName}". The integrity check found match history that references this club, but there is no standings row to highlight yet.
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {showAddClubPanel && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/80"
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-display font-bold text-xs text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                <Plus size={14} className="text-indigo-650" /> Add Competitor Club Team
              </h4>
              <Button
                type="button"
                onClick={() => setShowAddClubPanel(false)}
                variant="ghost"
                size="icon"
                className="size-8 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-700"
                aria-label="Close add club panel"
              >
                <X size={16} />
              </Button>
            </div>
            <form ref={addClubFormRef} onSubmit={handleAddClub} className="flex flex-col sm:flex-row gap-3" noValidate>
              <div className="flex-1">
                <Label htmlFor="add-club-name-input" className="sr-only">Club name</Label>
                <Input
                  id="add-club-name-input"
                  data-validation-field="clubName"
                  type="text"
                  value={newClubName}
                  onChange={e => {
                    setNewClubName(e.target.value);
                    setAddClubErrors({});
                  }}
                  placeholder="e.g. Metro Knights, City Falcons, Vale United..."
                  aria-invalid={Boolean(addClubErrors.clubName)}
                  aria-describedby={addClubErrors.clubName ? 'add-club-name-error' : undefined}
                  className={cn('bg-white px-4', standingsPanelControlClass, addClubErrors.clubName && standingsPanelInvalidClass)}
                />
                <FieldError id="add-club-name-error" message={addClubErrors.clubName} />
              </div>
              <Button
                type="submit"
                className="rounded-xl bg-indigo-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
              >
                <CheckCircle size={14} /> Commit Team
              </Button>
            </form>
            <p className="text-[10px] text-slate-500 mt-2 font-medium">Entering a new club will start them off with 0 played, 0 points. You can modify stats anytime.</p>
          </motion.div>
        )}

        {showLogger && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-100/60"
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-display font-bold text-xs text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                <Calendar size={14} className="text-emerald-700" /> Weekly Scoreboard Match Logger
              </h4>
              <Button
                type="button"
                onClick={() => setShowLogger(false)}
                variant="ghost"
                size="icon"
                className="size-8 text-emerald-400 hover:bg-emerald-100 hover:text-emerald-700"
                aria-label="Close scoreboard logger"
              >
                <X size={16} />
              </Button>
            </div>
            
            <form ref={scoreboardFormRef} onSubmit={handleApplyMatchResults} className="space-y-4" noValidate>
              <FormErrorSummary id="scoreboard-error-summary" errors={scoreboardErrors} />
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-center">
                
                {/* Home Team select */}
                <div className="lg:col-span-2">
                  <Label className="mb-1 block text-[10px] text-slate-400">Home Team</Label>
                  <Select
                    value={logHomeTeam}
                    onValueChange={value => {
                      setLogHomeTeam(value);
                      setScoreboardErrors(previous => ({ ...previous, homeTeam: undefined, awayTeam: undefined }));
                    }}
                  >
                    <SelectTrigger
                      data-validation-field="homeTeam"
                      aria-invalid={Boolean(scoreboardErrors.homeTeam)}
                      aria-describedby={scoreboardErrors.homeTeam ? 'scoreboard-home-team-error' : undefined}
                      className={cn('bg-white text-slate-800', standingsPanelControlClass, scoreboardErrors.homeTeam && standingsPanelInvalidClass)}
                    >
                      <SelectValue placeholder="Choose Home Club" />
                    </SelectTrigger>
                    <SelectContent>
                      {standings.map(t => (
                        <SelectItem key={t.teamName} value={t.teamName}>{t.teamName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError id="scoreboard-home-team-error" message={scoreboardErrors.homeTeam} />
                </div>

                {/* Score section */}
                <div className="flex items-center justify-center gap-2">
                  <div className="text-center">
                    <Label className="mb-1 block text-[9px] text-slate-400">Score</Label>
                    <Input
                      data-validation-field="homeScore"
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={logHomeScore}
                      onChange={e => {
                        setLogHomeScore(e.target.value);
                        setScoreboardErrors(previous => ({ ...previous, homeScore: undefined }));
                      }}
                      aria-invalid={Boolean(scoreboardErrors.homeScore)}
                      aria-describedby={scoreboardErrors.homeScore ? 'scoreboard-home-score-error' : undefined}
                      className={cn('h-9 w-12 rounded-lg p-2 text-center text-xs font-black text-slate-800', scoreboardErrors.homeScore && standingsPanelInvalidClass)}
                    />
                    <FieldError id="scoreboard-home-score-error" message={scoreboardErrors.homeScore} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 mt-4">VS</span>
                  <div className="text-center">
                    <Label className="mb-1 block text-[9px] text-slate-400">Score</Label>
                    <Input
                      data-validation-field="awayScore"
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={logAwayScore}
                      onChange={e => {
                        setLogAwayScore(e.target.value);
                        setScoreboardErrors(previous => ({ ...previous, awayScore: undefined }));
                      }}
                      aria-invalid={Boolean(scoreboardErrors.awayScore)}
                      aria-describedby={scoreboardErrors.awayScore ? 'scoreboard-away-score-error' : undefined}
                      className={cn('h-9 w-12 rounded-lg p-2 text-center text-xs font-black text-slate-800', scoreboardErrors.awayScore && standingsPanelInvalidClass)}
                    />
                    <FieldError id="scoreboard-away-score-error" message={scoreboardErrors.awayScore} />
                  </div>
                </div>

                {/* Away Team select */}
                <div className="lg:col-span-2">
                  <Label className="mb-1 block text-[10px] text-slate-400">Away Team</Label>
                  <Select
                    value={logAwayTeam}
                    onValueChange={value => {
                      setLogAwayTeam(value);
                      setScoreboardErrors(previous => ({ ...previous, homeTeam: undefined, awayTeam: undefined }));
                    }}
                  >
                    <SelectTrigger
                      data-validation-field="awayTeam"
                      aria-invalid={Boolean(scoreboardErrors.awayTeam)}
                      aria-describedby={scoreboardErrors.awayTeam ? 'scoreboard-away-team-error' : undefined}
                      className={cn('bg-white text-slate-800', standingsPanelControlClass, scoreboardErrors.awayTeam && standingsPanelInvalidClass)}
                    >
                      <SelectValue placeholder="Choose Away Club" />
                    </SelectTrigger>
                    <SelectContent>
                      {standings.map(t => (
                        <SelectItem key={t.teamName} value={t.teamName}>{t.teamName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError id="scoreboard-away-team-error" message={scoreboardErrors.awayTeam} />
                </div>

              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <span className="text-[10px] text-slate-500 font-medium leading-tight">
                  Logs 1 match game. Updates wins, draws, losses, goals scored and conceded, and points automatically for both teams.
                </span>
                <Button
                  type="submit"
                  disabled={!logHomeTeam || !logAwayTeam || logHomeTeam === logAwayTeam}
                  className="w-full rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 sm:w-auto"
                >
                  <CheckCircle size={14} /> Calculate & Apply Result
                </Button>
              </div>
            </form>

            <AnimatePresence>
              {logSuccessMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 p-2 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold font-mono tracking-tight text-center"
                >
                  {logSuccessMessage}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sample season context */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Clubs', value: sortedStandings.length, detail: 'Sample division field' },
          { label: 'Matches played', value: totalMatchesPlayed, detail: 'Across all clubs' },
          { label: 'Goals per match', value: averageGoals, detail: bestAttack ? `Best attack: ${bestAttack.teamName}` : 'No results yet' },
          { label: 'Best defense', value: bestDefense?.teamName || 'N/A', detail: bestDefense ? `${bestDefense.goalsAgainst} goals conceded` : 'No results yet' }
        ].map(item => (
          <div key={item.label} className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-sm">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
            <strong className="block text-lg font-display font-black text-slate-900 mt-1 truncate">{item.value}</strong>
            <span className="text-[10px] text-slate-500">{item.detail}</span>
          </div>
        ))}
      </div>

      {/* Main League Rankings Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-md shadow-slate-100/30 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          
          {/* Editable Division / League Name */}
          <div className="flex items-center gap-3">
            {isEditingLeagueName ? (
              <div className="flex items-center gap-2">
                <Input
                  id="edit-division-name-input"
                  type="text"
                  value={tempLeagueName}
                  onChange={e => setTempLeagueName(e.target.value)}
                  className="h-8 w-52 rounded-xl bg-white px-3 py-1.5 font-display text-xs font-bold text-slate-800"
                  placeholder="Division Name"
                />
                <Button
                  type="button"
                  onClick={handleSaveLeagueName}
                  size="sm"
                  className="h-8 rounded-lg bg-indigo-600 px-2.5 text-[10px] font-bold text-white hover:bg-indigo-700"
                >
                  Save
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsEditingLeagueName(false)}
                  variant="secondary"
                  size="sm"
                  className="h-8 rounded-lg px-2.5 text-[10px] font-medium"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <h4 className="font-display font-bold text-xs text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Trophy size={16} className="text-indigo-600 animate-pulse" /> {teamInfo.league || "Regional Premier Division"} Standings
                </h4>
                <Button
                  type="button"
                  onClick={() => {
                    setTempLeagueName(teamInfo.league || "Regional Premier Division");
                    setIsEditingLeagueName(true);
                  }}
                  variant="ghost"
                  size="icon"
                  className="size-7 text-slate-400 hover:bg-indigo-50 hover:text-indigo-700"
                  title="Edit League Name"
                  aria-label="Edit league name"
                >
                  <Edit3 size={11} />
                </Button>
              </div>
            )}
          </div>
          
          <span className="text-[10px] font-black uppercase py-1 px-2.5 bg-slate-200 text-slate-700 rounded-lg font-mono tracking-wider w-max">
            Season {teamInfo.founded || "2026"}
          </span>
        </div>

        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100">
                <th className="py-3 px-4 text-center w-12">Pos</th>
                <th className="py-3 px-4">Club name</th>
                <th className="py-3 px-3 text-center">Played</th>
                <th className="py-3 px-3 text-center">W</th>
                <th className="py-3 px-3 text-center">D</th>
                <th className="py-3 px-3 text-center">L</th>
                <th className="py-3 px-3 text-center">GF</th>
                <th className="py-3 px-3 text-center">GA</th>
                <th className="py-3 px-3 text-center">GD</th>
                <th className="py-3 px-4 text-center">Pts</th>
                <th className="py-3 px-4 text-center w-40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedStandings.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 font-medium">
                    No teams in the division standings list. Add a club above to get started!
                  </td>
                </tr>
              ) : (
                sortedStandings.map((team, idx) => {
                  const gd = team.goalsFor - team.goalsAgainst;
                  const isUser = team.isUserTeam || team.teamName.toLowerCase() === teamName.toLowerCase();
                  const isIntegrityHighlighted = highlightStandingTeamName === team.teamName;
                  const editWon = Number.parseInt(won, 10);
                  const editDrawn = Number.parseInt(drawn, 10);
                  const editLost = Number.parseInt(lost, 10);
                  const editGf = Number.parseInt(gf, 10);
                  const editGa = Number.parseInt(ga, 10);
                  const previewWon = Number.isFinite(editWon) ? editWon : 0;
                  const previewDrawn = Number.isFinite(editDrawn) ? editDrawn : 0;
                  const previewLost = Number.isFinite(editLost) ? editLost : 0;
                  const previewGf = Number.isFinite(editGf) ? editGf : 0;
                  const previewGa = Number.isFinite(editGa) ? editGa : 0;

                  return (
                    <tr 
                      id={toStandingAnchorId(team.teamName)}
                      key={team.teamName}
                      className={`transition-colors ${
                        isIntegrityHighlighted
                          ? 'bg-amber-50 ring-2 ring-inset ring-amber-200'
                          : ''
                      } ${
                        isUser 
                          ? 'bg-blue-50/50 font-semibold hover:bg-blue-50' 
                          : 'hover:bg-slate-50/50 text-slate-600'
                      }`}
                    >
                      {/* Rank cell */}
                      <td id={`standing-rank-${team.rank}`} className="py-3.5 px-4 font-display font-bold text-center text-sm">
                        {team.rank === 1 ? (
                          <div className="flex items-center justify-center text-amber-500" title="First Place League Leader">
                            <Star size={14} className="fill-amber-400 mr-0.5" /> 1
                          </div>
                        ) : (
                          team.rank
                        )}
                      </td>

                      {/* Team Name Cell */}
                      <td id={`standing-team-${team.rank}-name`} className="py-3.5 px-4 font-medium text-slate-800 text-sm">
                        {editingTeam === team.teamName ? (
                          <div>
                            <Input
                              id="edit-standing-team-name-input"
                              data-validation-field="teamName"
                              type="text"
                              value={editingTeamName}
                              onChange={e => {
                                setEditingTeamName(e.target.value);
                                setStandingEditErrors(previous => ({ ...previous, teamName: undefined }));
                              }}
                              aria-invalid={Boolean(standingEditErrors.teamName)}
                              aria-describedby={standingEditErrors.teamName ? 'edit-standing-team-name-error' : undefined}
                              className={cn(
                                'h-8 rounded px-2 py-1 text-xs font-semibold text-slate-800',
                                standingEditErrors.teamName && standingsPanelInvalidClass
                              )}
                              placeholder="Club Name"
                            />
                            <FieldError id="edit-standing-team-name-error" message={standingEditErrors.teamName} />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[170px]">{team.teamName}</span>
                            {isIntegrityHighlighted && (
                              <Badge variant="warning" className="shrink-0 rounded px-1.5 py-0 text-[9px]">
                                Review
                              </Badge>
                            )}
                            {isUser && (
                              <Badge className="shrink-0 rounded border-transparent bg-indigo-600 px-1.5 py-0 text-[9px] text-white">
                                My Team
                              </Badge>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Stats cells */}
                      {editingTeam === team.teamName ? (
                        /* Editing fields row WITH dynamic calculations */
                        <>
                          <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                            {previewWon + previewDrawn + previewLost}
                          </td>
                          <td className="py-3.5 px-3">
                            <Input
                              id="edit-standing-won"
                              data-validation-field="won"
                              type="number" 
                              min="0" 
                              step="1"
                              inputMode="numeric"
                              value={won} 
                              onChange={e => {
                                setWon(e.target.value);
                                setStandingEditErrors(previous => ({ ...previous, won: undefined }));
                              }}
                              aria-invalid={Boolean(standingEditErrors.won)}
                              aria-describedby={standingEditErrors.won ? 'edit-standing-won-error' : undefined}
                              className={cn(
                                'h-8 w-11 rounded p-1 text-center text-xs font-bold text-slate-800',
                                standingEditErrors.won && standingsPanelInvalidClass
                              )}
                            />
                            <FieldError id="edit-standing-won-error" message={standingEditErrors.won} />
                          </td>
                          <td className="py-3.5 px-3">
                            <Input
                              id="edit-standing-drawn"
                              data-validation-field="drawn"
                              type="number" 
                              min="0" 
                              step="1"
                              inputMode="numeric"
                              value={drawn} 
                              onChange={e => {
                                setDrawn(e.target.value);
                                setStandingEditErrors(previous => ({ ...previous, drawn: undefined }));
                              }}
                              aria-invalid={Boolean(standingEditErrors.drawn)}
                              aria-describedby={standingEditErrors.drawn ? 'edit-standing-drawn-error' : undefined}
                              className={cn(
                                'h-8 w-11 rounded p-1 text-center text-xs font-bold text-slate-800',
                                standingEditErrors.drawn && standingsPanelInvalidClass
                              )}
                            />
                            <FieldError id="edit-standing-drawn-error" message={standingEditErrors.drawn} />
                          </td>
                          <td className="py-3.5 px-3">
                            <Input
                              id="edit-standing-lost"
                              data-validation-field="lost"
                              type="number" 
                              min="0" 
                              step="1"
                              inputMode="numeric"
                              value={lost} 
                              onChange={e => {
                                setLost(e.target.value);
                                setStandingEditErrors(previous => ({ ...previous, lost: undefined }));
                              }}
                              aria-invalid={Boolean(standingEditErrors.lost)}
                              aria-describedby={standingEditErrors.lost ? 'edit-standing-lost-error' : undefined}
                              className={cn(
                                'h-8 w-11 rounded p-1 text-center text-xs font-bold text-slate-800',
                                standingEditErrors.lost && standingsPanelInvalidClass
                              )}
                            />
                            <FieldError id="edit-standing-lost-error" message={standingEditErrors.lost} />
                          </td>
                          <td className="py-3.5 px-3">
                            <Input
                              id="edit-standing-gf"
                              data-validation-field="goalsFor"
                              type="number" 
                              min="0" 
                              step="1"
                              inputMode="numeric"
                              value={gf} 
                              onChange={e => {
                                setGf(e.target.value);
                                setStandingEditErrors(previous => ({ ...previous, goalsFor: undefined }));
                              }}
                              aria-invalid={Boolean(standingEditErrors.goalsFor)}
                              aria-describedby={standingEditErrors.goalsFor ? 'edit-standing-gf-error' : undefined}
                              className={cn(
                                'h-8 w-11 rounded p-1 text-center text-xs font-bold text-slate-800',
                                standingEditErrors.goalsFor && standingsPanelInvalidClass
                              )}
                            />
                            <FieldError id="edit-standing-gf-error" message={standingEditErrors.goalsFor} />
                          </td>
                          <td className="py-3.5 px-3">
                            <Input
                              id="edit-standing-ga"
                              data-validation-field="goalsAgainst"
                              type="number" 
                              min="0" 
                              step="1"
                              inputMode="numeric"
                              value={ga} 
                              onChange={e => {
                                setGa(e.target.value);
                                setStandingEditErrors(previous => ({ ...previous, goalsAgainst: undefined }));
                              }}
                              aria-invalid={Boolean(standingEditErrors.goalsAgainst)}
                              aria-describedby={standingEditErrors.goalsAgainst ? 'edit-standing-ga-error' : undefined}
                              className={cn(
                                'h-8 w-11 rounded p-1 text-center text-xs font-bold text-slate-800',
                                standingEditErrors.goalsAgainst && standingsPanelInvalidClass
                              )}
                            />
                            <FieldError id="edit-standing-ga-error" message={standingEditErrors.goalsAgainst} />
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold font-mono">{previewGf - previewGa}</td>
                          <td className="py-3.5 px-4 text-center font-display font-black text-sm text-indigo-750">{(previewWon * 3) + previewDrawn}</td>
                        </>
                      ) : (
                        /* Display fields row */
                        <>
                          <td id={`standing-gp-${team.rank}`} className="py-3.5 px-3 text-center">{team.played}</td>
                          <td id={`standing-won-${team.rank}`} className="py-3.5 px-3 text-center">{team.won}</td>
                          <td id={`standing-drawn-${team.rank}`} className="py-3.5 px-3 text-center">{team.drawn}</td>
                          <td id={`standing-lost-${team.rank}`} className="py-3.5 px-3 text-center">{team.lost}</td>
                          <td id={`standing-gf-${team.rank}`} className="py-3.5 px-3 text-center text-slate-500">{team.goalsFor}</td>
                          <td id={`standing-ga-${team.rank}`} className="py-3.5 px-3 text-center text-slate-500">{team.goalsAgainst}</td>
                          <td id={`standing-gd-${team.rank}`} className="py-3.5 px-3 text-center">
                            <span className={gd > 0 ? 'text-emerald-600 font-bold' : gd < 0 ? 'text-rose-500 font-bold' : 'text-slate-400'}>
                              {gd > 0 ? `+${gd}` : gd}
                            </span>
                          </td>
                          <td id={`standing-points-${team.rank}`} className="py-3.5 px-4 font-display font-black text-center text-sm text-indigo-700">
                            {team.points}
                          </td>
                        </>
                      )}

                      {/* Actions Cell */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {editingTeam === team.teamName ? (
                            <Button
                              id={`save-standing-btn-${team.rank}`}
                              type="button"
                              onClick={() => handleSave(team)}
                              size="sm"
                              className="h-8 rounded-lg bg-emerald-600 px-2.5 text-[10px] font-bold text-white hover:bg-emerald-700"
                            >
                              <Save size={11} /> Save
                            </Button>
                          ) : (
                            <>
                              <Button
                                id={`edit-standing-btn-${team.rank}`}
                                type="button"
                                onClick={() => startEdit(team)}
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-[10px] font-bold text-indigo-700 hover:bg-indigo-50 hover:text-indigo-900"
                              >
                                <Edit size={11} /> Edit
                              </Button>
                              
                              {/* Allow delete for other clubs, but not user team to protect key app contexts */}
                              {!isUser && (
                                <Button
                                  id={`delete-standing-btn-${team.rank}`}
                                  type="button"
                                  onClick={() => handleDeleteTeam(team.teamName)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-[10px] font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                  title="Remove from League"
                                >
                                  <Trash2 size={11} /> Remove
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Table Column Meanings and Legends */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500 shrink-0">
            <Info size={14} className="text-indigo-605 animate-pulse shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Legend & Glossary</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 text-[11px] text-slate-650 w-full md:w-auto">
            <div className="flex flex-col">
              <span className="font-bold text-slate-800 font-mono">W / D / L</span>
              <span className="text-slate-400 text-[10px] sm:text-[11px] mt-0.5">Wins / Draws / Losses</span>
            </div>
            <div className="flex flex-col border-s border-slate-200 pl-3">
              <span className="font-bold text-slate-800 font-mono">GF</span>
              <span className="text-slate-400 text-[10px] sm:text-[11px] mt-0.5">Goals For (Scored)</span>
            </div>
            <div className="flex flex-col border-s border-slate-200 pl-3">
              <span className="font-bold text-slate-800 font-mono">GA</span>
              <span className="text-slate-400 text-[10px] sm:text-[11px] mt-0.5">Goals Against (Conceded)</span>
            </div>
            <div className="flex flex-col border-s border-slate-200 pl-3">
              <span className="font-bold text-slate-800 font-mono">GD</span>
              <span className="text-slate-400 text-[10px] sm:text-[11px] mt-0.5">Goal Difference (GF - GA)</span>
            </div>
            <div className="flex flex-col border-s border-slate-200 pl-3">
              <span className="font-bold text-indigo-700 font-mono">Pts</span>
              <span className="text-slate-400 text-[10px] sm:text-[11px] mt-0.5">Points (Win=3, Draw=1, Loss=0)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Standings backup history */}
      <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Archive size={17} />
            </div>
            <div>
              <h4 className="font-display font-black text-sm text-slate-900">Standings Backup Log</h4>
              <p className="text-[10px] text-slate-500">Save weekly snapshots and restore an earlier league table.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-bold normal-case tracking-normal text-slate-600">
              <Checkbox
                checked={sundayBackupEnabled}
                onChange={(event) => setSundayBackupEnabled(event.target.checked)}
              />
              Auto-save Sundays
            </Label>
            <Button
              type="button"
              onClick={() => createStandingsBackup('manual')}
              disabled={standings.length === 0}
              size="sm"
              className="h-8 rounded-lg bg-indigo-600 px-2.5 text-[10px] font-bold text-white hover:bg-indigo-700 disabled:opacity-40"
            >
              <Save size={11} />
              Save snapshot
            </Button>
            <Button
              type="button"
              onClick={() => setShowBackupLog(!showBackupLog)}
              variant="outline"
              size="sm"
              className="h-8 rounded-lg px-2.5 text-[10px] font-bold text-slate-600"
            >
              <History size={11} />
              {showBackupLog ? 'Hide logs' : `View logs (${standingsBackups.length})`}
            </Button>
          </div>
        </div>

        {backupNotice && (
          <div className="mx-4 mb-4 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg text-[10px] font-bold text-emerald-700">
            {backupNotice}
          </div>
        )}

        <AnimatePresence>
          {showBackupLog && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-slate-100 overflow-hidden"
            >
              {standingsBackups.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No standings backups yet. Save a snapshot now or enable Sunday auto-save.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {standingsBackups.map(backup => {
                    const leader = [...backup.standings].sort((a, b) => b.points - a.points)[0];
                    return (
                      <div key={backup.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={backup.source === 'sunday' ? 'info' : 'secondary'}
                              className="rounded px-1.5 py-0 text-[8px]"
                            >
                              {backup.source === 'sunday' ? 'Sunday auto' : 'Manual'}
                            </Badge>
                            <strong className="text-xs text-slate-800 truncate">{backup.label}</strong>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                            {backup.standings.length} clubs
                            {leader ? ` - Leader: ${leader.teamName} (${leader.points} pts)` : ''}
                            {' - '}
                            {new Date(backup.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            onClick={() => restoreStandingsBackup(backup)}
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-lg px-2.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-50 hover:text-indigo-900"
                          >
                            <RotateCcw size={10} /> Restore
                          </Button>
                          <Button
                            type="button"
                            onClick={() => deleteStandingsBackup(backup.id)}
                            variant="ghost"
                            size="icon"
                            className="size-8 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            aria-label={`Delete ${backup.label}`}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom safety controls */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <div className="flex justify-end">
          <AlertDialogTrigger asChild>
            <Button
              id="reset-standings-btn"
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-rose-200 px-2.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <RefreshCw size={11} />
              Clear standings table
            </Button>
          </AlertDialogTrigger>
        </div>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <div className="flex size-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <RefreshCw size={18} />
          </div>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear league table?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears every club from the table and resets recorded matches, announcements, and season player totals. Your backup logs will remain available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 rounded-lg bg-slate-100 px-3 text-xs font-bold text-slate-700 hover:bg-slate-200">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (standings.length > 0) {
                  createStandingsBackup('manual', `Pre-clear backup - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
                }
                onResetStandings();
              }}
              className="h-9 rounded-lg bg-rose-600 px-3 text-xs font-bold text-white hover:bg-rose-700"
            >
              Yes, clear the table
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* === DISCIPLINARY RECORDS === */}
      <section className="bg-white rounded-2xl shadow-lg shadow-slate-100/30 border border-slate-200/60 p-5 mt-6">
        <DisciplinaryRecords 
          players={players} 
          onUpdatePlayer={onUpdatePlayer} 
        />
      </section>

    </div>
  );
}

// === DISCIPLINARY RECORDS SUB-COMPONENT ===
function DisciplinaryRecords({ 
  players, 
  onUpdatePlayer 
}: { 
  players: Player[]; 
  onUpdatePlayer: (updated: Player) => void;
}) {
  const activePlayers = players.filter(p => p.registrationStatus === 'Active' && !['Manager', 'Coach', 'Staff', 'Team Owner', 'Founder', 'President', 'Vice President', 'Director of Football', 'Treasurer', 'Secretary', 'Manager / Coach', 'Head Coach', 'Assistant Coach'].includes(p.position));
  
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [offenseDate, setOffenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [cardType, setCardType] = useState<CardType>('Yellow');
  const [reason, setReason] = useState('');
  const [offenseMinute, setOffenseMinute] = useState('');
  const [opponent, setOpponent] = useState('');

  const handleLogOffense = () => {
    if (!selectedPlayerId || !reason.trim()) return;
    const player = players.find(p => p.id === selectedPlayerId);
    if (!player) return;

    const offense: PlayerOffense = {
      id: 'off_' + Date.now(),
      date: offenseDate,
      cardType,
      reason: reason.trim(),
      gameOpponent: opponent || undefined,
      matchMinute: offenseMinute ? Number(offenseMinute) : undefined
    };

    const yellowCount = cardType === 'Yellow' || cardType === 'Second Yellow' ? 1 : 0;
    const redCount = cardType === 'Red' || cardType === 'Second Yellow' || cardType === 'Straight Red' ? 1 : 0;

    const updated: Player = {
      ...player,
      yellowCards: (player.yellowCards ?? 0) + yellowCount,
      redCards: (player.redCards ?? 0) + redCount,
      offenses: [...(player.offenses || []), offense]
    };
    onUpdatePlayer(updated);

    // Reset form
    setReason('');
    setOffenseMinute('');
    setOpponent('');
    setCardType('Yellow');
  };

  const handleDeleteOffense = (offenseId: string, playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const offense = player.offenses?.find(o => o.id === offenseId);
    if (!offense) return;

    const wasYellow = offense.cardType === 'Yellow' || offense.cardType === 'Second Yellow';
    const wasRed = offense.cardType === 'Red' || offense.cardType === 'Second Yellow' || offense.cardType === 'Straight Red';

    const updated: Player = {
      ...player,
      yellowCards: Math.max(0, (player.yellowCards ?? 0) - (wasYellow ? 1 : 0)),
      redCards: Math.max(0, (player.redCards ?? 0) - (wasRed ? 1 : 0)),
      offenses: (player.offenses || []).filter(o => o.id !== offenseId)
    };
    onUpdatePlayer(updated);
  };

  const handleDeleteMvp = (awardId: string, playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    const updated: Player = {
      ...player,
      mvpAwards: Math.max(0, (player.mvpAwards ?? 0) - 1),
      mvpHistory: (player.mvpHistory || []).filter(m => m.id !== awardId)
    };
    onUpdatePlayer(updated);
  };

  // MVP Recorder state
  const [mvpPlayerId, setMvpPlayerId] = useState('');
  const [mvpDate, setMvpDate] = useState(new Date().toISOString().split('T')[0]);
  const [mvpOpponent, setMvpOpponent] = useState('');
  const [mvpNote, setMvpNote] = useState('');

  const handleAwardMVP = () => {
    if (!mvpPlayerId) return;
    const player = players.find(p => p.id === mvpPlayerId);
    if (!player) return;

    const record: MvpAwardRecord = {
      id: 'mvp_' + Date.now(),
      date: mvpDate,
      opponent: mvpOpponent || undefined,
      note: mvpNote || undefined
    };

    const updated: Player = {
      ...player,
      mvpAwards: (player.mvpAwards ?? 0) + 1,
      mvpHistory: [...(player.mvpHistory || []), record]
    };
    onUpdatePlayer(updated);
    setMvpPlayerId('');
    setMvpOpponent('');
    setMvpNote('');
  };

  // Gather all MVP awards from all players, sorted by date desc
  const allMvpAwards = players
    .filter(p => p.mvpHistory && p.mvpHistory.length > 0)
    .flatMap(p => (p.mvpHistory || []).map(m => ({ ...m, playerName: p.name, playerId: p.id })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Gather all offenses from all players, sorted by date desc
  const allOffenses = players
    .filter(p => p.offenses && p.offenses.length > 0)
    .flatMap(p => (p.offenses || []).map(o => ({ ...o, playerName: p.name, playerId: p.id })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Player card summary
  const playersWithCards = activePlayers.filter(p => (p.yellowCards || 0) > 0 || (p.redCards || 0) > 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-black text-slate-800 text-base flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" /> Discipline & Match Awards
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Log player offences and award Man of the Match honours</p>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <Badge variant="warning" className="rounded-full">Yellow {players.reduce((s, p) => s + (p.yellowCards || 0), 0)}</Badge>
          <Badge variant="destructive" className="rounded-full">Red {players.reduce((s, p) => s + (p.redCards || 0), 0)}</Badge>
          <Badge variant="warning" className="rounded-full border-amber-200 bg-amber-50 text-amber-700">
            MVP {players.reduce((s, p) => s + (p.mvpAwards || 0), 0)}
          </Badge>
        </div>
      </div>

      {/* Side-by-Side: Disciplinary Records & Man of the Match */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* LEFT: Disciplinary Records */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-black text-slate-800 text-sm flex items-center gap-1.5">
                <AlertTriangle size={15} className="text-amber-500" /> Disciplinary
              </h3>
              <p className="text-[10px] text-slate-500">Log player offences - yellow & red cards</p>
            </div>
            <div className="flex items-center gap-1.5 text-[9px]">
              <Badge variant="warning" className="rounded">Yellow {players.reduce((s, p) => s + (p.yellowCards || 0), 0)}</Badge>
              <Badge variant="destructive" className="rounded">Red {players.reduce((s, p) => s + (p.redCards || 0), 0)}</Badge>
            </div>
          </div>

          {/* Offence Logger Form */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <h4 className="text-[9px] font-mono font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <ClipboardList size={11} className="text-indigo-600" /> Log New Offence
            </h4>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              <div>
                <Label className="mb-0.5 block text-[8px] text-slate-400">Player *</Label>
                <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                  <SelectTrigger className={standingsCompactControlClass}>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activePlayers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-0.5 block text-[8px] text-slate-400">Date *</Label>
                <Input type="date" value={offenseDate} onChange={e => setOffenseDate(e.target.value)} className={standingsCompactControlClass} />
              </div>
              <div>
                <Label className="mb-0.5 block text-[8px] text-slate-400">Card *</Label>
                <Select value={cardType} onValueChange={value => setCardType(parseCardType(value))}>
                  <SelectTrigger className={standingsCompactControlClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CARD_TYPES.map(type => <SelectItem key={type} value={type}>{CARD_TYPE_LABELS[type]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-0.5 block text-[8px] text-slate-400">Minute</Label>
                <Input type="number" min="1" max="120" placeholder="67'" value={offenseMinute} onChange={e => setOffenseMinute(e.target.value)} className={standingsCompactControlClass} />
              </div>
              <div>
                <Label className="mb-0.5 block text-[8px] text-slate-400">Opponent</Label>
                <Input type="text" placeholder="Metro Knights" value={opponent} onChange={e => setOpponent(e.target.value)} className={standingsCompactControlClass} />
              </div>
              <div>
                <Label className="mb-0.5 block text-[8px] text-slate-400">Reason *</Label>
                <Input type="text" placeholder="Reckless tackle..." value={reason} onChange={e => setReason(e.target.value)} className={standingsCompactControlClass} />
              </div>
            </div>
            <Button type="button" onClick={handleLogOffense} disabled={!selectedPlayerId || !reason.trim()} size="sm" className="h-8 rounded-md bg-amber-500 px-3 text-[9px] font-bold text-white hover:bg-amber-600">
              <Plus size={10} /> Record Offence
            </Button>
          </div>

          {/* Player Card Tally */}
          {playersWithCards.length > 0 && (
            <div>
              <h4 className="text-[9px] font-mono font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1"><ClipboardList size={12} className="text-slate-500" /> Card Tally</h4>
              <div className="grid grid-cols-2 gap-1.5">
                {playersWithCards.map(p => (
                  <div key={p.id} className="bg-slate-50 rounded-lg p-2 border border-slate-200 flex items-center justify-between">
                    <div className="min-w-0 text-[9px] font-bold text-slate-700 truncate pr-1">{p.name}</div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="warning" className="rounded px-1 py-0 text-[9px]">{p.yellowCards} Yellow</Badge>
                      {p.redCards > 0 && (<Badge variant="destructive" className="rounded px-1 py-0 text-[9px]">{p.redCards} Red</Badge>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Offence History */}
          {allOffenses.length > 0 && (
            <div>
              <h4 className="text-[9px] font-mono font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1"><History size={12} className="text-slate-500" /> Offence History</h4>
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-[8px] font-black text-slate-400 uppercase tracking-wider sticky top-0 bg-white">
                      <th className="pb-1.5 pr-1.5">Date</th>
                      <th className="pb-1.5 pr-1.5">Player</th>
                      <th className="pb-1.5 pr-1.5">Card</th>
                      <th className="pb-1.5 pr-1.5">Min</th>
                      <th className="pb-1.5">Reason</th>
                      <th className="pb-1.5 pl-1 w-5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {allOffenses.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/50 group">
                        <td className="py-1.5 pr-1.5 text-[9px] font-mono text-slate-500 whitespace-nowrap">{new Date(o.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                        <td className="py-1.5 pr-1.5 text-[9px] font-bold text-slate-700 whitespace-nowrap">{o.playerName}</td>
                        <td className="py-1.5 pr-1.5 whitespace-nowrap">
                          <Badge variant={CARD_TYPE_BADGE_VARIANTS[o.cardType]} className={cn('rounded px-1 py-0 text-[8px]', o.cardType === 'Second Yellow' && 'border-orange-100 bg-orange-50 text-orange-800')}>
                            {CARD_TYPE_LABELS[o.cardType]}
                          </Badge>
                        </td>
                        <td className="py-1.5 pr-1.5 text-[9px] font-mono text-slate-400 whitespace-nowrap">{o.matchMinute ? `${o.matchMinute}'` : '-'}</td>
                        <td className="py-1.5 text-[9px] text-slate-600 max-w-[140px] truncate">{o.reason}</td>
                        <td className="py-1.5 pl-1 text-center">
                          <Button type="button" onClick={() => handleDeleteOffense(o.id, o.playerId)} variant="ghost" size="icon" className="size-6 text-slate-400 opacity-0 hover:text-rose-600 group-hover:opacity-100" title="Delete offence" aria-label={`Delete offence for ${o.playerName}`}>
                            <Trash2 size={10} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Man of the Match Awards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-black text-slate-800 text-sm flex items-center gap-1.5">
                <Star size={15} className="text-amber-500" /> Man of the Match
              </h3>
              <p className="text-[10px] text-slate-500">Award match MVP to standout performers</p>
            </div>
            <Badge variant="warning" className="rounded">MVP {players.reduce((s, p) => s + (p.mvpAwards || 0), 0)} Total</Badge>
          </div>

          {/* MVP Award Form */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <h4 className="text-[9px] font-mono font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <Award size={11} className="text-amber-500" /> Award Man of the Match
            </h4>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              <div>
                <Label className="mb-0.5 block text-[8px] text-slate-400">Player *</Label>
                <Select value={mvpPlayerId} onValueChange={setMvpPlayerId}>
                  <SelectTrigger className={standingsCompactControlClass}>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activePlayers.map(p => <SelectItem key={p.id} value={p.id}>{p.name} MVP {p.mvpAwards || 0}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-0.5 block text-[8px] text-slate-400">Date</Label>
                <Input type="date" value={mvpDate} onChange={e => setMvpDate(e.target.value)} className={standingsCompactControlClass} />
              </div>
              <div>
                <Label className="mb-0.5 block text-[8px] text-slate-400">Opponent</Label>
                <Input type="text" placeholder="vs Metro Knights" value={mvpOpponent} onChange={e => setMvpOpponent(e.target.value)} className={standingsCompactControlClass} />
              </div>
              <div>
                <Label className="mb-0.5 block text-[8px] text-slate-400">Note</Label>
                <Input type="text" placeholder="Hat-trick, clean sheet..." value={mvpNote} onChange={e => setMvpNote(e.target.value)} className={standingsCompactControlClass} />
              </div>
            </div>
            <Button type="button" onClick={handleAwardMVP} disabled={!mvpPlayerId} size="sm" className="h-8 rounded-md bg-amber-500 px-3 text-[9px] font-bold text-white hover:bg-amber-600">
              <Award size={10} /> Award MVP
            </Button>
          </div>

          {/* MVP Leaderboard */}
          {activePlayers.filter(p => (p.mvpAwards || 0) > 0).length > 0 && (
            <div>
              <h4 className="text-[9px] font-mono font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1"><Star size={12} className="text-amber-500" /> MVP Leaderboard</h4>
              <div className="grid grid-cols-1 gap-1.5">
                {[...activePlayers].filter(p => (p.mvpAwards || 0) > 0).sort((a,b) => (b.mvpAwards || 0) - (a.mvpAwards || 0)).slice(0, 8).map((p, idx) => (
                  <div key={p.id} className="bg-slate-50 rounded-lg p-2 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-display font-black text-[10px] text-slate-300 w-4">{idx+1}</span>
                      <span className="text-[9px] font-bold text-slate-700 truncate">{p.name}</span>
                    </div>
                    <Badge variant="warning" className="shrink-0 rounded px-1.5 py-0 text-[9px]">MVP {p.mvpAwards}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MVP History Log */}
          {allMvpAwards.length > 0 && (
            <div>
              <h4 className="text-[9px] font-mono font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1"><History size={12} className="text-slate-500" /> Award History</h4>
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-[8px] font-black text-slate-400 uppercase tracking-wider sticky top-0 bg-white">
                      <th className="pb-1.5 pr-1.5">Date</th>
                      <th className="pb-1.5 pr-1.5">Player</th>
                      <th className="pb-1.5 pr-1.5">Opponent</th>
                      <th className="pb-1.5">Note</th>
                      <th className="pb-1.5 pl-1 w-5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {allMvpAwards.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50 group">
                        <td className="py-1.5 pr-1.5 text-[9px] font-mono text-slate-500 whitespace-nowrap">{new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                        <td className="py-1.5 pr-1.5 text-[9px] font-bold text-slate-700 whitespace-nowrap">{m.playerName}</td>
                        <td className="py-1.5 pr-1.5 text-[9px] text-slate-500 whitespace-nowrap">{m.opponent || '-'}</td>
                        <td className="py-1.5 text-[9px] text-slate-600 max-w-[160px] truncate">{m.note || '-'}</td>
                        <td className="py-1.5 pl-1 text-center">
                          <Button
                            type="button"
                            onClick={() => handleDeleteMvp(m.id, m.playerId)}
                            variant="ghost"
                            size="icon"
                            className="size-6 text-slate-400 opacity-0 hover:text-rose-600 group-hover:opacity-100"
                            title="Delete this MVP award"
                            aria-label={`Delete MVP award for ${m.playerName}`}
                          >
                            <Trash2 size={10} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


