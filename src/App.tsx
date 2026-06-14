import React, { useState, useEffect } from 'react';
import { Player, Game, Standing, Announcement, TeamInfo } from './types';

import DashboardView from './components/DashboardView';
import RosterView from './components/RosterView';
import ScheduleView from './components/ScheduleView';
import StandingsView from './components/StandingsView';
import AnnouncementsView from './components/AnnouncementsView';
import PlayerProfileModal from './components/PlayerProfileModal';
import TacticsView from './components/TacticsView';
import TrainingView from './components/TrainingView';
import OnboardingView from './components/OnboardingView';

import { 
  Shield, 
  Users, 
  Calendar, 
  Trophy, 
  Megaphone, 
  Heart, 
  Menu,
  X,
  Sliders,
  Dumbbell,
  RotateCcw
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';

export function getInitialStandings(userTeamName: string): Standing[] {
  return [
    { rank: 1, teamName: "Metro Knights", played: 14, won: 10, drawn: 2, lost: 2, goalsFor: 32, goalsAgainst: 12, points: 32 },
    { rank: 2, teamName: userTeamName, played: 14, won: 8, drawn: 3, lost: 3, goalsFor: 28, goalsAgainst: 15, points: 27, isUserTeam: true },
    { rank: 3, teamName: "Glacier Rovers", played: 14, won: 7, drawn: 4, lost: 3, goalsFor: 24, goalsAgainst: 18, points: 25 },
    { rank: 4, teamName: "Vale United", played: 14, won: 6, drawn: 3, lost: 5, goalsFor: 21, goalsAgainst: 20, points: 21 },
    { rank: 5, teamName: "Storm City FC", played: 14, won: 5, drawn: 4, lost: 5, goalsFor: 18, goalsAgainst: 19, points: 19 },
    { rank: 6, teamName: "Beacon Athletic", played: 14, won: 4, drawn: 3, lost: 7, goalsFor: 16, goalsAgainst: 24, points: 15 },
    { rank: 7, teamName: "Apex Hawks", played: 14, won: 3, drawn: 2, lost: 9, goalsFor: 13, goalsAgainst: 28, points: 11 },
    { rank: 8, teamName: "Iron Coast Unity", played: 14, won: 2, drawn: 3, lost: 9, goalsFor: 10, goalsAgainst: 25, points: 9 }
  ];
}

export default function App() {
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('stack_team_onboarded') === 'true' || localStorage.getItem('stack_team_info') !== null;
  });
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'roster' | 'schedule' | 'standings' | 'announcements' | 'tactics' | 'training'>('dashboard');
  
  // Local Storage state hooks
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(() => {
    const saved = localStorage.getItem('stack_team_info');
    // For existing users with INITIAL_TEAM_INFO set
    return saved ? JSON.parse(saved) : null;
  });

  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('stack_team_players');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Player[];
        // Migrate: ensure all players have yellowCards/redCards fields
        return parsed.map(p => ({
          ...p,
          yellowCards: typeof p.yellowCards === 'number' ? p.yellowCards : 0,
          redCards: typeof p.redCards === 'number' ? p.redCards : 0,
          offenses: Array.isArray(p.offenses) ? p.offenses : []
        }));
      } catch {}
    }
    return [];
  });

  const [games, setGames] = useState<Game[]>(() => {
    const saved = localStorage.getItem('stack_team_games');
    return saved ? JSON.parse(saved) : [];
  });

  const [standings, setStandings] = useState<Standing[]>(() => {
    const saved = localStorage.getItem('stack_team_standings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    const infoSaved = localStorage.getItem('stack_team_info');
    if (infoSaved) {
      try {
        const info = JSON.parse(infoSaved) as TeamInfo;
        return getInitialStandings(info.name);
      } catch (e) {}
    }
    return [];
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('stack_team_announcements');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('stack_team_info', JSON.stringify(teamInfo));
  }, [teamInfo]);

  useEffect(() => {
    localStorage.setItem('stack_team_players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('stack_team_games', JSON.stringify(games));
  }, [games]);

  useEffect(() => {
    localStorage.setItem('stack_team_standings', JSON.stringify(standings));
  }, [standings]);

  useEffect(() => {
    localStorage.setItem('stack_team_announcements', JSON.stringify(announcements));
  }, [announcements]);

  // Handle Recording Scoreboard Match Results & Cascade Side Effects
  const handleRecordResult = (
    gameId: string, 
    ourScore: number, 
    opponentScore: number, 
    mvpId: string, 
    notes: string,
    scorersList: Array<{ playerName: string; count: number }>
  ) => {
    // 1. Update Game object
    const updatedGames = games.map(game => {
      if (game.id === gameId) {
        return {
          ...game,
          status: 'Completed' as const,
          ourScore,
          opponentScore,
          mvpId,
          notes,
          scorers: scorersList
        };
      }
      return game;
    });
    setGames(updatedGames);

    // Get game detail
    const originalGame = games.find(g => g.id === gameId);
    if (!originalGame) return;

    // 2. Cascade update player goals (points), assists, mvps, and clean sheet walls
    const isCleanSheet = opponentScore === 0;
    const updatedPlayers = players.map(p => {
      let goalsToAdd = 0;
      const scorerMatch = scorersList.find(sc => sc.playerName === p.name);
      if (scorerMatch) {
        goalsToAdd = scorerMatch.count;
      }

      let mvpToAdd = 0;
      if (mvpId === p.id) {
        mvpToAdd = 1;
      }

      // Defenders and Goalkeepers get clean sheet bonus
      let csToAdd = 0;
      if (isCleanSheet && (p.position === 'Defender' || p.position === 'Goalkeeper')) {
        csToAdd = 1;
      }

      return {
        ...p,
        gamesPlayed: p.gamesPlayed + 1,
        points: p.points + goalsToAdd,
        mvpAwards: p.mvpAwards + mvpToAdd,
        cleanSheetsOrRebounds: p.cleanSheetsOrRebounds + csToAdd
      };
    });
    setPlayers(updatedPlayers);

    // 3. Auto-update team and opponent standings points!
    const opponentName = originalGame.opponent;
    const isWin = ourScore > opponentScore;
    const isDraw = ourScore === opponentScore;

    const updatedStandings = standings.map(team => {
      // Update our own stats
      if (team.isUserTeam) {
        return {
          ...team,
          played: team.played + 1,
          won: team.won + (isWin ? 1 : 0),
          drawn: team.drawn + (isDraw ? 1 : 0),
          lost: team.lost + (!isWin && !isDraw ? 1 : 0),
          goalsFor: team.goalsFor + ourScore,
          goalsAgainst: team.goalsAgainst + opponentScore,
          points: team.points + (isWin ? 3 : isDraw ? 1 : 0)
        };
      }
      // Update opponent team stats
      if (team.teamName.toLowerCase() === opponentName.toLowerCase()) {
        const oppWin = opponentScore > ourScore;
        const oppDraw = ourScore === opponentScore;
        return {
          ...team,
          played: team.played + 1,
          won: team.won + (oppWin ? 1 : 0),
          drawn: team.drawn + (oppDraw ? 1 : 0),
          lost: team.lost + (!oppWin && !oppDraw ? 1 : 0),
          goalsFor: team.goalsFor + opponentScore,
          goalsAgainst: team.goalsAgainst + ourScore,
          points: team.points + (oppWin ? 3 : oppDraw ? 1 : 0)
        };
      }
      return team;
    });
    setStandings(updatedStandings);
  };

  // State modification callbacks
  const handleAddPlayer = (newPlayer: Player) => {
    setPlayers(prev => [newPlayer, ...prev]);
  };

  const handleUpdatePlayer = (updatedPlayer: Player) => {
    setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
    setSelectedPlayer(updatedPlayer); // Update active modal focus
  };

  const handleAddGame = (newGame: Game) => {
    setGames(prev => [newGame, ...prev]);
  };

  const handleDeleteGame = (gameId: string) => {
    setGames(prev => prev.filter(g => g.id !== gameId));
  };

  const handleUpdateStanding = (updatedStanding: Standing) => {
    setStandings(prev => prev.map(s => s.teamName === updatedStanding.teamName ? updatedStanding : s));
  };

  const handleUpdateTeamInfo = (updatedInfo: TeamInfo) => {
    setTeamInfo(updatedInfo);
  };

  const handleResetStandings = () => {
    setStandings([]);
    setGames([]);
    setAnnouncements([]);
    
    // reset gamesplayed etc for players
    setPlayers(prev => prev.map(p => ({
      ...p,
      gamesPlayed: 0,
      points: 0,
      assists: 0,
      cleanSheetsOrRebounds: 0,
      minutesPlayed: 0,
      mvpAwards: 0,
      yellowCards: 0,
      redCards: 0,
      offenses: []
    })));

    localStorage.setItem('stack_team_standings', JSON.stringify([]));
    localStorage.removeItem('stack_team_games');
    localStorage.removeItem('stack_team_announcements');
    
    // Update players in localStorage
    const resetPlayers = players.map(p => ({
      ...p,
      gamesPlayed: 0,
      points: 0,
      assists: 0,
      cleanSheetsOrRebounds: 0,
      minutesPlayed: 0,
      mvpAwards: 0,
      yellowCards: 0,
      redCards: 0,
      offenses: []
    }));
    localStorage.setItem('stack_team_players', JSON.stringify(resetPlayers));
  };

  const handleAddAnnouncement = (newAnn: Announcement) => {
    setAnnouncements(prev => [newAnn, ...prev]);
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const handleExportBackup = () => {
    try {
      const data = {
        teamInfo,
        players,
        games,
        standings,
        announcements,
        exportedAt: new Date().toISOString(),
        backupVersion: "1.0.0"
      };
      
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const cleanTeamName = teamInfo.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      link.download = `${cleanTeamName}_team_backup_${new Date().toISOString().slice(0, 10)}.json`;
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating team data backup via Roster:', error);
    }
  };

  const handleImportBackup = async (file: File) => {
    const parsed: unknown = JSON.parse(await file.text());
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('The selected file is not a valid Stack Team Manager backup.');
    }

    const backup = parsed as Record<string, unknown>;
    const restoredTeam = backup.teamInfo as TeamInfo | null;
    const restoredPlayers = backup.players as Player[] | undefined;
    const restoredGames = backup.games as Game[] | undefined;
    const restoredStandings = backup.standings as Standing[] | undefined;
    const restoredAnnouncements = backup.announcements as Announcement[] | undefined;

    if (
      backup.backupVersion !== '1.0.0' ||
      !restoredTeam ||
      typeof restoredTeam.name !== 'string' ||
      !Array.isArray(restoredPlayers) ||
      !Array.isArray(restoredGames) ||
      !Array.isArray(restoredStandings) ||
      !Array.isArray(restoredAnnouncements)
    ) {
      throw new Error('This backup is missing required team data or uses an unsupported version.');
    }

    setTeamInfo(restoredTeam);
    setPlayers(restoredPlayers);
    setGames(restoredGames);
    setStandings(restoredStandings);
    setAnnouncements(restoredAnnouncements);
    setIsOnboarded(true);
    setCurrentTab('roster');

    localStorage.setItem('stack_team_onboarded', 'true');
    localStorage.setItem('stack_team_info', JSON.stringify(restoredTeam));
    localStorage.setItem('stack_team_players', JSON.stringify(restoredPlayers));
    localStorage.setItem('stack_team_games', JSON.stringify(restoredGames));
    localStorage.setItem('stack_team_standings', JSON.stringify(restoredStandings));
    localStorage.setItem('stack_team_announcements', JSON.stringify(restoredAnnouncements));
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const confirmResetApp = () => {
    localStorage.clear();
    setIsOnboarded(false);
    setTeamInfo(null);
    setPlayers([]);
    setGames([]);
    setStandings([]);
    setAnnouncements([]);
    setShowResetConfirm(false);
  };

  if (!isOnboarded || !teamInfo) {
    return (
      <OnboardingView 
        onComplete={(team: TeamInfo, coachPlayer: Player) => {
          setTeamInfo(team);
          setPlayers([coachPlayer]);
          const initialTable = getInitialStandings(team.name);
          setStandings(initialTable);
          localStorage.setItem('stack_team_standings', JSON.stringify(initialTable));
          setIsOnboarded(true);
          localStorage.setItem('stack_team_onboarded', 'true');
          localStorage.setItem('stack_team_info', JSON.stringify(team));
          localStorage.setItem('stack_team_players', JSON.stringify([coachPlayer]));
        }}
      />
    );
  }

  return (
    <div id="stack-app-root" className="min-h-screen flex flex-col font-sans text-slate-900">
      
      {/* Dynamic Navigation Topbar */}
      <header id="app-topbar" className="bg-[#07111f]/95 backdrop-blur-xl text-white sticky top-0 z-40 border-b border-white/10 shadow-lg shadow-slate-950/10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[72px]">
            
            {/* Logo Brand Icon */}
            <div className="flex items-center gap-3 min-w-0">
              <div 
                id="brand-logo"
                onClick={() => setCurrentTab('dashboard')}
                className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-300 text-slate-950 rounded-xl flex items-center justify-center font-display font-extrabold text-lg shadow-lg shadow-blue-500/20 cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                S
              </div>
              <div>
                <h1 
                  id="brand-title" 
                  onClick={() => setCurrentTab('dashboard')}
                  className="font-display font-extrabold text-sm sm:text-base tracking-tight cursor-pointer text-white hover:text-blue-100 transition-colors truncate"
                >
                  Stack Team
                </h1>
                <span id="brand-tagline" className="text-[10px] text-slate-400 block font-semibold truncate max-w-44">
                  {teamInfo?.name || "Team workspace"}
                </span>
              </div>
            </div>

            {/* Desktop Navigation Link Tabs */}
            <nav id="desktop-nav" aria-label="Primary navigation" className="hidden lg:flex items-center gap-1 bg-white/[0.06] border border-white/[0.08] rounded-2xl p-1.5">
              {[
                { id: 'dashboard', label: 'Overview', icon: Shield },
                { id: 'roster', label: 'Roster', icon: Users },
                { id: 'tactics', label: 'Tactics', icon: Sliders },
                { id: 'training', label: 'Training', icon: Dumbbell },
                { id: 'schedule', label: 'Schedule', icon: Calendar },
                { id: 'standings', label: 'League', icon: Trophy },
                { id: 'announcements', label: 'Updates', icon: Megaphone }
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    id={`nav-tab-btn-${tab.id}`}
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id as any)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold transition-all border ${
                      isActive 
                        ? 'bg-white border-white text-slate-950 shadow-md' 
                        : 'border-transparent text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <TabIcon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Mobile Navigation Sandwich Trigger */}
            <div className="lg:hidden">
              <button
                id="mobile-menu-hamburger"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
                aria-expanded={mobileMenuOpen}
                className="bg-white/10 p-2.5 rounded-xl hover:bg-white/15 transition-transform active:scale-95"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

          </div>
        </div>

        {/* Expandable Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div id="mobile-nav-panel" className="lg:hidden bg-[#07111f] border-t border-white/10 p-3 grid grid-cols-2 gap-2">
            {[
              { id: 'dashboard', label: 'Overview', icon: Shield },
              { id: 'roster', label: 'Roster', icon: Users },
              { id: 'tactics', label: 'Tactics', icon: Sliders },
              { id: 'training', label: 'Training', icon: Dumbbell },
              { id: 'schedule', label: 'Schedule', icon: Calendar },
              { id: 'standings', label: 'League', icon: Trophy },
              { id: 'announcements', label: 'Updates', icon: Megaphone }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  id={`mobile-nav-btn-${tab.id}`}
                  key={tab.id}
                  onClick={() => {
                    setCurrentTab(tab.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-white text-slate-950' 
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <TabIcon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Container Stage Body */}
      <main id="app-main-content" className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Real-time State Highlights panel */}
        <div id="quick-alert-drawer" className="bg-white/90 backdrop-blur border border-slate-200/80 rounded-2xl px-4 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              <strong className="text-slate-900 font-bold">Workspace ready.</strong> Results automatically update your league table and player statistics.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-lg border border-emerald-100">Saved locally</span>
            <button onClick={() => setShowResetConfirm(true)} className="text-[10px] bg-slate-50 text-slate-600 font-bold px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100 transition-colors flex items-center gap-1"><RotateCcw size={10} /> Reset</button>
          </div>
        </div>

        {showResetConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-2xl max-w-sm w-full font-sans">
              <h3 className="text-lg font-display font-extrabold text-slate-900 mb-2">Reset workspace?</h3>
              <p className="text-sm text-slate-600 mb-6 font-medium">This removes the team, roster, schedule, and statistics saved in this browser.</p>
              <div className="flex justify-end gap-3 font-semibold">
                <button onClick={() => setShowResetConfirm(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-xs">Cancel</button>
                <button onClick={confirmResetApp} className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-md transition-colors text-xs font-bold">Reset everything</button>
              </div>
            </div>
          </div>
        )}

        {/* Active Tab Frame Switcher */}
        <div id="tab-content-frame">
          {currentTab === 'dashboard' && (
            <DashboardView 
              teamInfo={teamInfo}
              players={players}
              games={games}
              standings={standings}
              announcements={announcements}
              setCurrentTab={setCurrentTab}
              onSelectPlayer={setSelectedPlayer}
              onUpdateTeamInfo={handleUpdateTeamInfo}
            />
          )}

          {currentTab === 'tactics' && (
            <TacticsView 
              players={players}
              teamCoach={teamInfo?.coach || ""}
              teamName={teamInfo?.name || "Apex Rangers"}
              onUpdatePlayer={handleUpdatePlayer}
            />
          )}

          {currentTab === 'roster' && (
            <RosterView 
              players={players}
              onAddPlayer={handleAddPlayer}
              onSelectPlayer={setSelectedPlayer}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onUpdatePlayer={handleUpdatePlayer}
            />
          )}

          {currentTab === 'training' && (
            <TrainingView 
              players={players}
              onUpdatePlayer={handleUpdatePlayer}
              games={games}
              onUpdateGames={setGames}
            />
          )}

          {currentTab === 'schedule' && (
            <ScheduleView 
              games={games}
              players={players}
              standings={standings}
              onAddGame={handleAddGame}
              onRecordResult={handleRecordResult}
              onDeleteGame={handleDeleteGame}
              teamName={teamInfo?.name || "Apex Rangers"}
            />
          )}

          {currentTab === 'standings' && (
            <StandingsView 
              standings={standings}
              onUpdateStanding={handleUpdateStanding}
              onResetStandings={handleResetStandings}
              teamName={teamInfo?.name || "Apex Rangers"}
              teamInfo={teamInfo!}
              onUpdateTeamInfo={handleUpdateTeamInfo}
              onUpdateAllStandings={setStandings}
              players={players}
              onUpdatePlayer={handleUpdatePlayer}
            />
          )}

          {currentTab === 'announcements' && (
            <AnnouncementsView 
              announcements={announcements}
              onAddAnnouncement={handleAddAnnouncement}
              onDeleteAnnouncement={handleDeleteAnnouncement}
            />
          )}
        </div>

      </main>

      {/* Dynamic Profile/Detailed Stats Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <PlayerProfileModal 
            player={selectedPlayer}
            onClose={() => setSelectedPlayer(null)}
            onUpdate={handleUpdatePlayer}
          />
        )}
      </AnimatePresence>

      {/* Application Footer */}
      <footer id="app-footer" className="bg-[#07111f] text-slate-400 border-t border-white/10 py-6 text-center text-xs mt-12 space-y-2">
        <div className="flex justify-center gap-4 items-center flex-wrap">
          <span className="font-display font-semibold text-slate-300">Stack Team Manager</span>
          <span className="text-slate-700 font-sans">|</span>
          <span className="flex items-center gap-1">Designed with <Heart size={11} className="fill-rose-500 text-rose-500" /> for elite athletic clubs</span>
        </div>
        <p className="text-slate-500 text-[10px]">
          Your team data stays in this browser unless you export a backup.
        </p>
      </footer>

    </div>
  );
}
