import React, { useEffect, useState } from 'react';
import { Standing, TeamInfo, Player, PlayerOffense, MvpAwardRecord } from '../types';
import {findUserStanding, sortStandings} from '../standings';
import { 
  Trophy, RefreshCw, Star, Edit, Save, Plus, Trash2, CheckCircle, X, Sliders,
  Calendar, Edit3, Info, Archive, History, RotateCcw, AlertTriangle, ClipboardList, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
}

interface StandingsBackup {
  id: string;
  createdAt: string;
  label: string;
  source: 'manual' | 'sunday';
  standings: Standing[];
}

const STANDINGS_BACKUPS_KEY = 'stack_team_standings_backups';
const SUNDAY_BACKUP_ENABLED_KEY = 'stack_team_sunday_backup_enabled';

export default function StandingsView({ 
  standings, 
  onUpdateStanding, 
  onResetStandings, 
  teamName,
  teamInfo,
  onUpdateTeamInfo,
  onUpdateAllStandings,
  players,
  onUpdatePlayer
}: StandingsViewProps) {
  // Editing individual team row state
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState("");
  const [won, setWon] = useState(0);
  const [drawn, setDrawn] = useState(0);
  const [lost, setLost] = useState(0);
  const [gf, setGf] = useState(0);
  const [ga, setGa] = useState(0);

  // League Name Edit state
  const [isEditingLeagueName, setIsEditingLeagueName] = useState(false);
  const [tempLeagueName, setTempLeagueName] = useState(teamInfo.league || "Regional Division");

  // Add new club team state
  const [newClubName, setNewClubName] = useState("");
  const [showAddClubPanel, setShowAddClubPanel] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showBackupLog, setShowBackupLog] = useState(false);
  const [standingsBackups, setStandingsBackups] = useState<StandingsBackup[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STANDINGS_BACKUPS_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [sundayBackupEnabled, setSundayBackupEnabled] = useState(() => {
    return localStorage.getItem(SUNDAY_BACKUP_ENABLED_KEY) !== 'false';
  });
  const [backupNotice, setBackupNotice] = useState('');

  // Match scoreboard logger state
  const [showLogger, setShowLogger] = useState(false);
  const [logHomeTeam, setLogHomeTeam] = useState("");
  const [logAwayTeam, setLogAwayTeam] = useState("");
  const [logHomeScore, setLogHomeScore] = useState<number | "">(0);
  const [logAwayScore, setLogAwayScore] = useState<number | "">(0);
  const [logSuccessMessage, setLogSuccessMessage] = useState("");

  const saveBackups = (nextBackups: StandingsBackup[]) => {
    const limitedBackups = nextBackups.slice(0, 12);
    setStandingsBackups(limitedBackups);
    localStorage.setItem(STANDINGS_BACKUPS_KEY, JSON.stringify(limitedBackups));
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
    localStorage.setItem(SUNDAY_BACKUP_ENABLED_KEY, String(sundayBackupEnabled));
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

  const startEdit = (team: Standing) => {
    setEditingTeam(team.teamName);
    setEditingTeamName(team.teamName);
    setWon(team.won);
    setDrawn(team.drawn);
    setLost(team.lost);
    setGf(team.goalsFor);
    setGa(team.goalsAgainst);
  };

  const handleSave = (team: Standing) => {
    const updatedPlayed = won + drawn + lost;
    const updatedPoints = (won * 3) + drawn;
    
    const updatedList = standings.map(t => {
      // Find the old team by its original name
      if (t.teamName === team.teamName) {
        return {
          ...t,
          teamName: editingTeamName.trim() || t.teamName,
          played: updatedPlayed,
          won,
          drawn,
          lost,
          goalsFor: gf,
          goalsAgainst: ga,
          points: updatedPoints
        };
      }
      return t;
    });

    onUpdateAllStandings(updatedList);
    setEditingTeam(null);
  };

  const handleDeleteTeam = (teamNameToDelete: string) => {
    if (window.confirm(`Are you sure you want to remove ${teamNameToDelete} from the league standings?`)) {
      const filtered = standings.filter(t => t.teamName !== teamNameToDelete);
      onUpdateAllStandings(filtered);
    }
  };

  const handleAddClub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClubName.trim()) return;

    // Check if team already exists
    if (standings.some(t => t.teamName.toLowerCase() === newClubName.trim().toLowerCase())) {
      alert("A team with this name already exists in the league division!");
      return;
    }

    const newClub: Standing = {
      rank: standings.length + 1,
      teamName: newClubName.trim(),
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      isUserTeam: newClubName.trim().toLowerCase() === teamName.toLowerCase()
    };

    onUpdateAllStandings([...standings, newClub]);
    setNewClubName("");
    setShowAddClubPanel(false);
  };

  // Scoreboard logger submit
  const handleApplyMatchResults = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logHomeTeam || !logAwayTeam) return;
    if (logHomeTeam === logAwayTeam) {
      alert("Home team and Away team must be different!");
      return;
    }

    const homeGoals = logHomeScore === "" ? 0 : Number(logHomeScore);
    const awayGoals = logAwayScore === "" ? 0 : Number(logAwayScore);

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
    setLogHomeScore(0);
    setLogAwayScore(0);
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
            <button 
              id="toggle-add-club-btn"
              onClick={() => {
                setShowAddClubPanel(!showAddClubPanel);
                setShowLogger(false);
              }}
              className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 font-bold text-xs py-2 px-3 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Plus size={13} />
              Add Club
            </button>
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
          <button 
            id="toggle-scoreboard-logger-btn"
            onClick={() => {
              setShowLogger(!showLogger);
              setShowAddClubPanel(false);
            }}
            className="mt-4 w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Calendar size={13} />
            {showLogger ? "Hide Weekly Updater" : "Open Weekly Scoreboard Updater"}
          </button>
        </div>

      </div>

      {/* Expandable Forms Panel */}
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
              <button onClick={() => setShowAddClubPanel(false)} className="text-indigo-400 hover:text-indigo-700">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddClub} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input 
                  type="text"
                  required
                  value={newClubName}
                  onChange={e => setNewClubName(e.target.value)}
                  placeholder="e.g. Metro Knights, City Falcons, Vale United..."
                  className="w-full bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button 
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <CheckCircle size={14} /> Commit Team
              </button>
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
              <button onClick={() => setShowLogger(false)} className="text-emerald-400 hover:text-emerald-700">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleApplyMatchResults} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                
                {/* Home Team select */}
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Home Team</label>
                  <select
                    required
                    value={logHomeTeam}
                    onChange={e => setLogHomeTeam(e.target.value)}
                    className="w-full bg-white border border-slate-255 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-emerald-505 focus:outline-none text-slate-800"
                  >
                    <option value="">-- Choose Home Club --</option>
                    {standings.map(t => (
                      <option key={t.teamName} value={t.teamName}>{t.teamName}</option>
                    ))}
                  </select>
                </div>

                {/* Score section */}
                <div className="flex items-center justify-center gap-2">
                  <div className="text-center">
                    <label className="text-[9px] uppercase font-bold text-slate-400 mb-1 block">Score</label>
                    <input 
                      type="number"
                      min="0"
                      required
                      value={logHomeScore}
                      onChange={e => setLogHomeScore(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-12 text-center p-2 border border-slate-300 rounded-lg text-xs font-black text-slate-800"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 mt-4">VS</span>
                  <div className="text-center">
                    <label className="text-[9px] uppercase font-bold text-slate-400 mb-1 block">Score</label>
                    <input 
                      type="number"
                      min="0"
                      required
                      value={logAwayScore}
                      onChange={e => setLogAwayScore(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-12 text-center p-2 border border-slate-300 rounded-lg text-xs font-black text-slate-800"
                    />
                  </div>
                </div>

                {/* Away Team select */}
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Away Team</label>
                  <select
                    required
                    value={logAwayTeam}
                    onChange={e => setLogAwayTeam(e.target.value)}
                    className="w-full bg-white border border-slate-255 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-emerald-505 focus:outline-none text-slate-800"
                  >
                    <option value="">-- Choose Away Club --</option>
                    {standings.map(t => (
                      <option key={t.teamName} value={t.teamName}>{t.teamName}</option>
                    ))}
                  </select>
                </div>

              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <span className="text-[10px] text-slate-500 font-medium leading-tight">
                  🎉 Logs 1 Match Game. Updates Wins, Draws, Losses, Goals scored & conceded, and points automatically for both teams.
                </span>
                <button
                  type="submit"
                  disabled={!logHomeTeam || !logAwayTeam || logHomeTeam === logAwayTeam}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0"
                >
                  <CheckCircle size={14} /> Calculate & Apply Result
                </button>
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
                <input 
                  id="edit-division-name-input"
                  type="text"
                  value={tempLeagueName}
                  onChange={e => setTempLeagueName(e.target.value)}
                  className="bg-white text-xs font-bold font-display px-3 py-1.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  placeholder="Division Name"
                />
                <button 
                  onClick={handleSaveLeagueName}
                  className="p-1 px-2.2 bg-indigo-650 text-white rounded-lg text-[10px] font-bold shadow-sm"
                >
                  Save
                </button>
                <button 
                  onClick={() => setIsEditingLeagueName(false)}
                  className="p-1 px-2 bg-slate-250 text-slate-700 rounded-lg text-[10px] font-medium"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <h4 className="font-display font-bold text-xs text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Trophy size={16} className="text-indigo-600 animate-pulse" /> {teamInfo.league || "Regional Premier Division"} Standings
                </h4>
                <button 
                  onClick={() => {
                    setTempLeagueName(teamInfo.league || "Regional Premier Division");
                    setIsEditingLeagueName(true);
                  }}
                  className="text-slate-400 hover:text-indigo-650 transition-colors p-1 rounded-md"
                  title="Edit League Name"
                >
                  <Edit3 size={11} />
                </button>
              </div>
            )}
          </div>
          
          <span className="text-[10px] font-black uppercase py-1 px-2.5 bg-slate-200 text-slate-700 rounded-lg font-mono tracking-wider w-max">
            Season {teamInfo.founded || "2026"}
          </span>
        </div>

        <div className="overflow-x-auto">
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

                  return (
                    <tr 
                      id={`standing-row-rank-${team.rank}`}
                      key={team.teamName}
                      className={`transition-colors ${
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
                          <input 
                            id="edit-standing-team-name-input"
                            type="text"
                            value={editingTeamName}
                            onChange={e => setEditingTeamName(e.target.value)}
                            className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                            placeholder="Club Name"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[170px]">{team.teamName}</span>
                            {isUser && (
                              <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0">
                                My Team
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Stats cells */}
                      {editingTeam === team.teamName ? (
                        /* Editing fields row WITH dynamic calculations */
                        <>
                          <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                            {won + drawn + lost}
                          </td>
                          <td className="py-3.5 px-3">
                            <input 
                              id="edit-standing-won"
                              type="number" 
                              min="0" 
                              value={won} 
                              onChange={e => setWon(Number(e.target.value))}
                              className="w-11 text-center border border-slate-300 rounded p-1 bg-white font-bold text-slate-800"
                            />
                          </td>
                          <td className="py-3.5 px-3">
                            <input 
                              id="edit-standing-drawn"
                              type="number" 
                              min="0" 
                              value={drawn} 
                              onChange={e => setDrawn(Number(e.target.value))}
                              className="w-11 text-center border border-slate-300 rounded p-1 bg-white font-bold text-slate-800"
                            />
                          </td>
                          <td className="py-3.5 px-3">
                            <input 
                              id="edit-standing-lost"
                              type="number" 
                              min="0" 
                              value={lost} 
                              onChange={e => setLost(Number(e.target.value))}
                              className="w-11 text-center border border-slate-300 rounded p-1 bg-white font-bold text-slate-800"
                            />
                          </td>
                          <td className="py-3.5 px-3">
                            <input 
                              id="edit-standing-gf"
                              type="number" 
                              min="0" 
                              value={gf} 
                              onChange={e => setGf(Number(e.target.value))}
                              className="w-11 text-center border border-slate-300 rounded p-1 bg-white font-bold text-slate-800"
                            />
                          </td>
                          <td className="py-3.5 px-3">
                            <input 
                              id="edit-standing-ga"
                              type="number" 
                              min="0" 
                              value={ga} 
                              onChange={e => setGa(Number(e.target.value))}
                              className="w-11 text-center border border-slate-300 rounded p-1 bg-white font-bold text-slate-800"
                            />
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold font-mono">{gf - ga}</td>
                          <td className="py-3.5 px-4 text-center font-display font-black text-sm text-indigo-750">{(won * 3) + drawn}</td>
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
                            <button
                              id={`save-standing-btn-${team.rank}`}
                              onClick={() => handleSave(team)}
                              className="bg-emerald-600 text-white rounded-lg px-2.5 py-1 hover:bg-emerald-700 font-bold text-[10px] flex items-center gap-1 transition-all shadow-sm"
                            >
                              <Save size={11} /> Save
                            </button>
                          ) : (
                            <>
                              <button
                                id={`edit-standing-btn-${team.rank}`}
                                onClick={() => startEdit(team)}
                                className="text-indigo-650 hover:text-indigo-900 font-bold hover:underline text-[10px] flex items-center gap-1 transition-colors"
                              >
                                <Edit size={11} /> Edit
                              </button>
                              
                              {/* Allow delete for other clubs, but not user team to protect key app contexts */}
                              {!isUser && (
                                <button
                                  id={`delete-standing-btn-${team.rank}`}
                                  onClick={() => handleDeleteTeam(team.teamName)}
                                  className="text-rose-500 hover:text-rose-750 font-bold hover:underline text-[10px] flex items-center gap-1 transition-colors"
                                  title="Remove from League"
                                >
                                  <Trash2 size={11} /> Remove
                                </button>
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
            <label className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">
              <input
                type="checkbox"
                checked={sundayBackupEnabled}
                onChange={(event) => setSundayBackupEnabled(event.target.checked)}
                className="accent-indigo-600"
              />
              Auto-save Sundays
            </label>
            <button
              type="button"
              onClick={() => createStandingsBackup('manual')}
              disabled={standings.length === 0}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-[10px] font-bold"
            >
              <Save size={11} />
              Save snapshot
            </button>
            <button
              type="button"
              onClick={() => setShowBackupLog(!showBackupLog)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold"
            >
              <History size={11} />
              {showBackupLog ? 'Hide logs' : `View logs (${standingsBackups.length})`}
            </button>
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
                            <span className={`text-[8px] uppercase font-black px-1.5 py-0.5 rounded ${
                              backup.source === 'sunday'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {backup.source === 'sunday' ? 'Sunday auto' : 'Manual'}
                            </span>
                            <strong className="text-xs text-slate-800 truncate">{backup.label}</strong>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                            {backup.standings.length} clubs
                            {leader ? ` · Leader: ${leader.teamName} (${leader.points} pts)` : ''}
                            {' · '}
                            {new Date(backup.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => restoreStandingsBackup(backup)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold"
                          >
                            <RotateCcw size={10} /> Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteStandingsBackup(backup.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            aria-label={`Delete ${backup.label}`}
                          >
                            <Trash2 size={12} />
                          </button>
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
      <div className="flex justify-end">
        <button
          id="reset-standings-btn"
          type="button"
          onClick={() => setShowResetConfirm(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 text-[10px] font-bold transition-colors"
        >
          <RefreshCw size={11} />
          Clear standings table
        </button>
      </div>

      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-sm p-4 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-sm w-full"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <RefreshCw size={18} />
              </div>
              <h3 className="font-display font-black text-lg text-slate-900">Clear league table?</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                This clears every club from the table and resets recorded matches, announcements, and season player totals. Your backup logs will remain available.
              </p>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (standings.length > 0) {
                      createStandingsBackup('manual', `Pre-clear backup - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
                    }
                    onResetStandings();
                    setShowResetConfirm(false);
                  }}
                  className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                >
                  Yes, clear the table
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
  const [cardType, setCardType] = useState<'Yellow' | 'Red' | 'Second Yellow' | 'Straight Red'>('Yellow');
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
          <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
            🟨 {players.reduce((s, p) => s + (p.yellowCards || 0), 0)}
          </span>
          <span className="bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full border border-red-200">
            🟥 {players.reduce((s, p) => s + (p.redCards || 0), 0)}
          </span>
          <span className="bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-200">
            ⭐ {players.reduce((s, p) => s + (p.mvpAwards || 0), 0)}
          </span>
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
              <p className="text-[10px] text-slate-500">Log player offences — yellow & red cards</p>
            </div>
            <div className="flex items-center gap-1.5 text-[9px]">
              <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-200">🟨 {players.reduce((s, p) => s + (p.yellowCards || 0), 0)}</span>
              <span className="bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded border border-red-200">🟥 {players.reduce((s, p) => s + (p.redCards || 0), 0)}</span>
            </div>
          </div>

          {/* Offence Logger Form */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <h4 className="text-[9px] font-mono font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <ClipboardList size={11} className="text-indigo-600" /> Log New Offence
            </h4>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              <div>
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Player *</label>
                <select value={selectedPlayerId} onChange={e => setSelectedPlayerId(e.target.value)} className="w-full border border-slate-200 rounded-md p-1.5 text-[10px] focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium">
                  <option value="">Select...</option>
                  {activePlayers.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Date *</label>
                <input type="date" value={offenseDate} onChange={e => setOffenseDate(e.target.value)} className="w-full border border-slate-200 rounded-md p-1.5 text-[10px] focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium" />
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Card *</label>
                <select value={cardType} onChange={e => setCardType(e.target.value as any)} className="w-full border border-slate-200 rounded-md p-1.5 text-[10px] focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium">
                  <option value="Yellow">🟨 Yellow</option>
                  <option value="Second Yellow">🟨🟨 2nd Yellow</option>
                  <option value="Straight Red">🟥 Straight Red</option>
                  <option value="Red">🟥 Red</option>
                </select>
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Minute</label>
                <input type="number" min="1" max="120" placeholder="67'" value={offenseMinute} onChange={e => setOffenseMinute(e.target.value)} className="w-full border border-slate-200 rounded-md p-1.5 text-[10px] focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium" />
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Opponent</label>
                <input type="text" placeholder="Metro Knights" value={opponent} onChange={e => setOpponent(e.target.value)} className="w-full border border-slate-200 rounded-md p-1.5 text-[10px] focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium" />
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Reason *</label>
                <input type="text" placeholder="Reckless tackle..." value={reason} onChange={e => setReason(e.target.value)} className="w-full border border-slate-200 rounded-md p-1.5 text-[10px] focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium" />
              </div>
            </div>
            <button onClick={handleLogOffense} disabled={!selectedPlayerId || !reason.trim()} className="text-[9px] font-bold bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:text-slate-500 text-white px-3 py-1.5 rounded-md transition-all flex items-center gap-1">
              <Plus size={10} /> Record Offence
            </button>
          </div>

          {/* Player Card Tally */}
          {playersWithCards.length > 0 && (
            <div>
              <h4 className="text-[9px] font-mono font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">📋 Card Tally</h4>
              <div className="grid grid-cols-2 gap-1.5">
                {playersWithCards.map(p => (
                  <div key={p.id} className="bg-slate-50 rounded-lg p-2 border border-slate-200 flex items-center justify-between">
                    <div className="min-w-0 text-[9px] font-bold text-slate-700 truncate pr-1">{p.name}</div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 py-0.5 rounded">{p.yellowCards} 🟨</span>
                      {p.redCards > 0 && (<span className="text-[9px] font-bold text-red-700 bg-red-100 px-1 py-0.5 rounded">{p.redCards} 🟥</span>)}
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
                          <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${o.cardType === 'Yellow' ? 'bg-amber-100 text-amber-800' : o.cardType === 'Second Yellow' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                            {o.cardType === 'Yellow' ? '🟨' : o.cardType === 'Second Yellow' ? '🟨🟨' : '🟥'} {o.cardType}
                          </span>
                        </td>
                        <td className="py-1.5 pr-1.5 text-[9px] font-mono text-slate-400 whitespace-nowrap">{o.matchMinute ? `${o.matchMinute}'` : '—'}</td>
                        <td className="py-1.5 text-[9px] text-slate-600 max-w-[140px] truncate">{o.reason}</td>
                        <td className="py-1.5 pl-1 text-center">
                          <button onClick={() => handleDeleteOffense(o.id, o.playerId)} className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100" title="Delete"><Trash2 size={10} /></button>
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
            <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-200">⭐ {players.reduce((s, p) => s + (p.mvpAwards || 0), 0)} Total</span>
          </div>

          {/* MVP Award Form */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <h4 className="text-[9px] font-mono font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <Award size={11} className="text-amber-500" /> Award Man of the Match
            </h4>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              <div>
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Player *</label>
                <select value={mvpPlayerId} onChange={e => setMvpPlayerId(e.target.value)} className="w-full border border-slate-200 rounded-md p-1.5 text-[10px] focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium">
                  <option value="">Select...</option>
                  {activePlayers.map(p => (<option key={p.id} value={p.id}>{p.name} ⭐{p.mvpAwards || 0}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Date</label>
                <input type="date" value={mvpDate} onChange={e => setMvpDate(e.target.value)} className="w-full border border-slate-200 rounded-md p-1.5 text-[10px] focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium" />
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Opponent</label>
                <input type="text" placeholder="vs Metro Knights" value={mvpOpponent} onChange={e => setMvpOpponent(e.target.value)} className="w-full border border-slate-200 rounded-md p-1.5 text-[10px] focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium" />
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Note</label>
                <input type="text" placeholder="Hat-trick, clean sheet…" value={mvpNote} onChange={e => setMvpNote(e.target.value)} className="w-full border border-slate-200 rounded-md p-1.5 text-[10px] focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium" />
              </div>
            </div>
            <button onClick={handleAwardMVP} disabled={!mvpPlayerId} className="text-[9px] font-bold bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:text-slate-500 text-white px-3 py-1.5 rounded-md transition-all flex items-center gap-1">
              <Award size={10} /> Award MVP
            </button>
          </div>

          {/* MVP Leaderboard */}
          {activePlayers.filter(p => (p.mvpAwards || 0) > 0).length > 0 && (
            <div>
              <h4 className="text-[9px] font-mono font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">⭐ MVP Leaderboard</h4>
              <div className="grid grid-cols-1 gap-1.5">
                {[...activePlayers].filter(p => (p.mvpAwards || 0) > 0).sort((a,b) => (b.mvpAwards || 0) - (a.mvpAwards || 0)).slice(0, 8).map((p, idx) => (
                  <div key={p.id} className="bg-slate-50 rounded-lg p-2 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-display font-black text-[10px] text-slate-300 w-4">{idx+1}</span>
                      <span className="text-[9px] font-bold text-slate-700 truncate">{p.name}</span>
                    </div>
                    <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">⭐ {p.mvpAwards}</span>
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
                        <td className="py-1.5 pr-1.5 text-[9px] text-slate-500 whitespace-nowrap">{m.opponent || '—'}</td>
                        <td className="py-1.5 text-[9px] text-slate-600 max-w-[160px] truncate">{m.note || '—'}</td>
                        <td className="py-1.5 pl-1 text-center">
                          <button
                            onClick={() => handleDeleteMvp(m.id, m.playerId)}
                            className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-colors"
                            title="Delete this MVP award"
                          >
                            <Trash2 size={10} />
                          </button>
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
