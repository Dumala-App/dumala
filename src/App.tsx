import React, { useState, useEffect } from 'react';
import { Player, Game, Standing, Announcement, TeamInfo, AssessmentSession } from './types';

import RosterView from './components/RosterView';
import PlayerProfileModal from './components/PlayerProfileModal';
import TacticsView from './components/TacticsView';
import OnboardingView from './components/OnboardingView';
import FeedbackModal from './components/FeedbackModal';
import HomeHubView from './components/HomeHubView';
import DevelopmentHubView from './components/DevelopmentHubView';
import LeagueUpdatesHubView from './components/LeagueUpdatesHubView';
import { applyAssessmentSnapshotToPlayer } from './fprds/scoring';

import { 
  Shield, 
  Users, 
  Trophy, 
  Heart, 
  Menu,
  X,
  Sliders,
  RotateCcw,
  MessageSquare,
  ClipboardList
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';

export default function App() {
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('stack_team_onboarded') === 'true' || localStorage.getItem('stack_team_info') !== null;
  });
  type PrimaryTab = 'home' | 'squad' | 'tactics' | 'development' | 'league_updates';
  type HomeTab = 'overview' | 'game_week';
  type DevelopmentTab = 'assessments' | 'training';
  type LeagueUpdatesTab = 'league' | 'updates' | 'dev_notes';

  const [primaryTab, setPrimaryTab] = useState<PrimaryTab>('home');
  const [homeTab, setHomeTab] = useState<HomeTab>('overview');
  const [developmentTab, setDevelopmentTab] = useState<DevelopmentTab>('assessments');
  const [leagueUpdatesTab, setLeagueUpdatesTab] = useState<LeagueUpdatesTab>('league');
  
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
        // Migrate: ensure all players have yellowCards/redCards fields and new attribute schema
        return parsed.map(p => {
          let baseAttributes = p.baseAttributes;
          let positionAttributes = p.positionAttributes;
          
          // Migrate old attributes to new schema if baseAttributes doesn't exist
          if (!baseAttributes && p.attributes) {
            baseAttributes = {
              pace: p.attributes.speed || 50,
              stamina: p.attributes.physicalness || 50,
              agility: p.attributes.dribbling || 50,
              strength: p.attributes.physicalness || 50,
              firstTouch: p.attributes.dribbling || 50,
              shortPassing: p.attributes.passing || 50
            };
            
            // Map old shooting/defending to position attributes based on role
            positionAttributes = {};
            const posAttrs = ['Finishing', 'Long Shots', 'Offensive 1v1', 'Attacking Heading', 
                             'Long Passing', 'Vision', 'Ball Retention', 'Pressing',
                             'Tackling', 'Defensive Heading', 'Positioning', 'Crossing',
                             'Reflexes', 'Handling', 'Diving', 'Distribution'];
                             
            // Just populate standard defaults mapped loosely from old stats
            const primaryOffense = p.attributes.shooting || 50;
            const primaryDefense = p.attributes.defending || 50;
            const primaryPass = p.attributes.passing || 50;
            
            if (p.position === 'Forward') {
              positionAttributes = { 'Finishing': primaryOffense, 'Long Shots': primaryOffense, 'Offensive 1v1': p.attributes.dribbling || 50, 'Attacking Heading': primaryOffense };
            } else if (p.position === 'Midfielder') {
              positionAttributes = { 'Long Passing': primaryPass, 'Vision': primaryPass, 'Ball Retention': p.attributes.dribbling || 50, 'Pressing': primaryDefense };
            } else if (p.position === 'Defender') {
              positionAttributes = { 'Tackling': primaryDefense, 'Defensive Heading': primaryDefense, 'Positioning': primaryDefense, 'Crossing': primaryPass };
            } else if (p.position === 'Goalkeeper') {
              positionAttributes = { 'Reflexes': primaryDefense, 'Handling': primaryDefense, 'Diving': primaryDefense, 'Distribution': primaryPass };
            }
          }

          // Fallback if completely missing
          if (!baseAttributes) {
            baseAttributes = { pace: 50, stamina: 50, agility: 50, strength: 50, firstTouch: 50, shortPassing: 50 };
          }
          if (!positionAttributes) {
            positionAttributes = {};
          }

          return {
            ...p,
            yellowCards: typeof p.yellowCards === 'number' ? p.yellowCards : 0,
            redCards: typeof p.redCards === 'number' ? p.redCards : 0,
            offenses: Array.isArray(p.offenses) ? p.offenses : [],
            baseAttributes,
            positionAttributes
          };
        });
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
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('stack_team_announcements');
    return saved ? JSON.parse(saved) : [];
  });

  const [assessments, setAssessments] = useState<AssessmentSession[]>(() => {
    const saved = localStorage.getItem('stack_team_assessments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed as AssessmentSession[];
      } catch {}
    }
    return [];
  });

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [preselectedAssessmentsPlayerId, setPreselectedAssessmentsPlayerId] = useState<string | null>(null);

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

  useEffect(() => {
    localStorage.setItem('stack_team_assessments', JSON.stringify(assessments));
  }, [assessments]);

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

  const handleRemovePlayer = (playerId: string) => {
    setPlayers(prev => prev.filter(player => player.id !== playerId));
    setSelectedPlayer(prev => prev?.id === playerId ? null : prev);
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

  const handleAddAssessment = (session: AssessmentSession) => {
    setAssessments(prev => [session, ...prev]);
  };

  const handleDeleteAssessment = (sessionId: string) => {
    setAssessments(prev => {
      const target = prev.find(s => s.id === sessionId);
      const next = prev.filter(s => s.id !== sessionId);

      if (target) {
        setPlayers(playersPrev => {
          const player = playersPrev.find(p => p.id === target.playerId);
          if (!player) return playersPrev;

          const latest = next
            .filter(s => s.playerId === target.playerId)
            .sort((a, b) => {
              const ad = new Date(a.assessmentDate).getTime();
              const bd = new Date(b.assessmentDate).getTime();
              if (ad !== bd) return bd - ad;
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            })[0];

          const updatedPlayer = latest
            ? applyAssessmentSnapshotToPlayer(player, latest)
            : { ...player, fprdsLastAssessmentId: undefined };

          return playersPrev.map(p => (p.id === updatedPlayer.id ? updatedPlayer : p));
        });
      }

      return next;
    });
  };

  const handleExportBackup = () => {
    try {
      const data = {
        teamInfo,
        players,
        games,
        standings,
        announcements,
        assessments,
        exportedAt: new Date().toISOString(),
        backupVersion: "1.1.0"
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
      throw new Error('The selected file is not a valid Dumala backup.');
    }

    const backup = parsed as Record<string, unknown>;
    const restoredTeam = backup.teamInfo as TeamInfo | null;
    const restoredPlayers = backup.players as Player[] | undefined;
    const restoredGames = backup.games as Game[] | undefined;
    const restoredStandings = backup.standings as Standing[] | undefined;
    const restoredAnnouncements = backup.announcements as Announcement[] | undefined;
    const restoredAssessments = backup.assessments as AssessmentSession[] | undefined;
    const backupVersion = backup.backupVersion as string | undefined;

    if (
      (backupVersion !== '1.0.0' && backupVersion !== '1.1.0') ||
      !restoredTeam ||
      typeof restoredTeam.name !== 'string' ||
      !Array.isArray(restoredPlayers) ||
      !Array.isArray(restoredGames) ||
      !Array.isArray(restoredStandings) ||
      !Array.isArray(restoredAnnouncements) ||
      (backupVersion === '1.1.0' && restoredAssessments !== undefined && !Array.isArray(restoredAssessments))
    ) {
      throw new Error('This backup is missing required team data or uses an unsupported version.');
    }

    setTeamInfo(restoredTeam);
    setPlayers(restoredPlayers);
    setGames(restoredGames);
    setStandings(restoredStandings);
    setAnnouncements(restoredAnnouncements);
    setAssessments(Array.isArray(restoredAssessments) ? restoredAssessments : []);
    setIsOnboarded(true);
    setPrimaryTab('squad');

    localStorage.setItem('stack_team_onboarded', 'true');
    localStorage.setItem('stack_team_info', JSON.stringify(restoredTeam));
    localStorage.setItem('stack_team_players', JSON.stringify(restoredPlayers));
    localStorage.setItem('stack_team_games', JSON.stringify(restoredGames));
    localStorage.setItem('stack_team_standings', JSON.stringify(restoredStandings));
    localStorage.setItem('stack_team_announcements', JSON.stringify(restoredAnnouncements));
    localStorage.setItem('stack_team_assessments', JSON.stringify(Array.isArray(restoredAssessments) ? restoredAssessments : []));
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const confirmResetApp = () => {
    localStorage.clear();
    setIsOnboarded(false);
    setTeamInfo(null);
    setPlayers([]);
    setGames([]);
    setStandings([]);
    setAnnouncements([]);
    setAssessments([]);
    setPreselectedAssessmentsPlayerId(null);
    setShowResetConfirm(false);
  };

  const handleNavigate = (target: {
    primary: PrimaryTab;
    homeTab?: HomeTab;
    developmentTab?: DevelopmentTab;
    leagueUpdatesTab?: LeagueUpdatesTab;
  }) => {
    setPrimaryTab(target.primary);

    if (target.primary === 'home') {
      setHomeTab(target.homeTab ?? 'overview');
    }

    if (target.primary === 'development') {
      setDevelopmentTab(target.developmentTab ?? 'assessments');
    }

    if (target.primary === 'league_updates') {
      setLeagueUpdatesTab(target.leagueUpdatesTab ?? 'league');
    }

    setMobileMenuOpen(false);
  };

  const handleSelectPrimaryTab = (tab: PrimaryTab) => {
    if (tab === 'home') return handleNavigate({ primary: 'home', homeTab: 'overview' });
    if (tab === 'development') return handleNavigate({ primary: 'development', developmentTab: 'training' });
    if (tab === 'league_updates') return handleNavigate({ primary: 'league_updates', leagueUpdatesTab: 'league' });
    return handleNavigate({ primary: tab });
  };

  if (!isOnboarded || !teamInfo) {
    return (
      <OnboardingView 
        onComplete={(team: TeamInfo, coachPlayer: Player) => {
          setTeamInfo(team);
          setPlayers([coachPlayer]);
          setStandings([]);
          setAssessments([]);
          setPrimaryTab('home');
          setHomeTab('overview');
          localStorage.setItem('stack_team_standings', JSON.stringify([]));
          localStorage.setItem('stack_team_assessments', JSON.stringify([]));
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
              <img
                id="brand-logo"
                src="/Dumala_logo.png"
                alt="Dumala"
                onClick={() => handleSelectPrimaryTab('home')}
                className="w-14 h-14 rounded-xl object-contain cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0"
              />
              <div>
                <h1 
                  id="brand-title" 
                  onClick={() => handleSelectPrimaryTab('home')}
                  className="font-display font-extrabold text-sm sm:text-base tracking-tight cursor-pointer text-white hover:text-blue-100 transition-colors truncate"
                >
                  Dumala
                </h1>
                <span id="brand-tagline" className="text-[10px] text-slate-400 block font-semibold truncate max-w-44">
                  {teamInfo?.name || "Team workspace"}
                </span>
              </div>
            </div>

            {/* Desktop Navigation Link Tabs */}
            <nav id="desktop-nav" aria-label="Primary navigation" className="hidden lg:flex items-center gap-1 bg-white/[0.06] border border-white/[0.08] rounded-2xl p-1.5">
              {[
                { id: 'home', label: 'Home', icon: Shield },
                { id: 'squad', label: 'Squad', icon: Users },
                { id: 'tactics', label: 'Tactics', icon: Sliders },
                { id: 'development', label: 'Development', icon: ClipboardList },
                { id: 'league_updates', label: 'League & Updates', icon: Trophy }
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = primaryTab === tab.id;
                return (
                  <button
                    id={`nav-tab-btn-${tab.id}`}
                    key={tab.id}
                    onClick={() => handleSelectPrimaryTab(tab.id as any)}
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
              { id: 'home', label: 'Home', icon: Shield },
              { id: 'squad', label: 'Squad', icon: Users },
              { id: 'tactics', label: 'Tactics', icon: Sliders },
              { id: 'development', label: 'Development', icon: ClipboardList },
              { id: 'league_updates', label: 'League & Updates', icon: Trophy }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = primaryTab === tab.id;
              return (
                <button
                  id={`mobile-nav-btn-${tab.id}`}
                  key={tab.id}
                  onClick={() => {
                    handleSelectPrimaryTab(tab.id as any);
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
            <button
              onClick={() => setShowFeedback(true)}
              className="flex items-center gap-1 rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700 transition-colors hover:border-indigo-200 hover:bg-indigo-100"
            >
              <MessageSquare size={10} /> Feedback
            </button>
            <button onClick={() => setShowResetConfirm(true)} className="text-[10px] bg-slate-50 text-slate-600 font-bold px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100 transition-colors flex items-center gap-1"><RotateCcw size={10} /> Reset</button>
          </div>
        </div>

        {showFeedback && (
          <FeedbackModal
            teamName={teamInfo.name}
            onClose={() => setShowFeedback(false)}
          />
        )}

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
          {primaryTab === 'home' && (
            <HomeHubView
              activeTab={homeTab}
              onTabChange={setHomeTab}
              onNavigate={handleNavigate}
              teamInfo={teamInfo}
              players={players}
              games={games}
              standings={standings}
              announcements={announcements}
              assessments={assessments}
              onSelectPlayer={setSelectedPlayer}
              onUpdateTeamInfo={handleUpdateTeamInfo}
              onAddGame={handleAddGame}
              onRecordResult={handleRecordResult}
              onDeleteGame={handleDeleteGame}
              teamName={teamInfo?.name || 'Apex Rangers'}
            />
          )}

          {primaryTab === 'squad' && (
            <RosterView
              players={players}
              onAddPlayer={handleAddPlayer}
              onSelectPlayer={setSelectedPlayer}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onUpdatePlayer={handleUpdatePlayer}
            />
          )}

          {primaryTab === 'tactics' && (
            <TacticsView players={players} teamCoach={teamInfo?.coach || ''} teamName={teamInfo?.name || 'Apex Rangers'} teamLogoUrl={teamInfo?.logoUrl} onUpdatePlayer={handleUpdatePlayer} />
          )}

          {primaryTab === 'development' && (
            <DevelopmentHubView
              activeTab={developmentTab}
              onTabChange={setDevelopmentTab}
              players={players}
              games={games}
              onUpdateGames={setGames}
              onUpdatePlayer={handleUpdatePlayer}
              assessments={assessments}
              preselectedAssessmentsPlayerId={preselectedAssessmentsPlayerId}
              onClearPreselectedAssessmentsPlayerId={() => setPreselectedAssessmentsPlayerId(null)}
              onAddAssessment={handleAddAssessment}
              onDeleteAssessment={handleDeleteAssessment}
            />
          )}

          {primaryTab === 'league_updates' && (
            <LeagueUpdatesHubView
              activeTab={leagueUpdatesTab}
              onTabChange={setLeagueUpdatesTab}
              standings={standings}
              onUpdateStanding={handleUpdateStanding}
              onResetStandings={handleResetStandings}
              teamName={teamInfo?.name || 'Apex Rangers'}
              teamInfo={teamInfo}
              onUpdateTeamInfo={handleUpdateTeamInfo}
              onUpdateAllStandings={setStandings}
              players={players}
              onUpdatePlayer={handleUpdatePlayer}
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
            onRemove={handleRemovePlayer}
            assessments={assessments}
            onOpenAssessments={(playerId: string) => {
              setPreselectedAssessmentsPlayerId(playerId);
              setPrimaryTab('development');
              setDevelopmentTab('assessments');
              setSelectedPlayer(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Application Footer */}
      <footer id="app-footer" className="bg-[#07111f] text-slate-400 border-t border-white/10 py-6 text-center text-xs mt-12 space-y-2">
        <div className="flex justify-center gap-4 items-center flex-wrap">
          <span className="font-display font-semibold text-slate-300">Dumala</span>
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
