import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Player, Game, Standing, Announcement, TeamInfo, AssessmentSession } from './types';

import ViewLoadingFallback from './components/ViewLoadingFallback';
import PwaInstallControl from './components/PwaInstallControl';
import PwaStatusBanners from './components/PwaStatusBanners';
import { applyAssessmentSnapshotToPlayer } from './fprds/scoring';
import {
  announcementsSchema,
  assessmentsSchema,
  gamesSchema,
  playersSchema,
  standingsSchema,
  teamInfoSchema
} from './persistence/schemas';
import {
  clearDumalaStorage,
  drainRecoveryWarnings,
  readBooleanStorage,
  readJsonStorage,
  removeStorage,
  STORAGE_KEYS,
  writeBooleanStorage,
  writeJsonStorage
} from './persistence/storage';
import {
  applyWorkspaceBackup,
  collectFeatureState,
  createWorkspaceBackup,
  parseWorkspaceBackup,
  summarizeBackup,
  type BackupRestoreSummary,
  type WorkspaceBackupV2
} from './persistence/backup';
import { deleteGameAndReconcile, recordMatchResult } from './matches/results';
import { useDialogAccessibility } from './hooks/useDialogAccessibility';

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

const RosterView = lazy(() => import('./components/RosterView'));
const PlayerProfileModal = lazy(() => import('./components/PlayerProfileModal'));
const TacticsView = lazy(() => import('./components/TacticsView'));
const OnboardingView = lazy(() => import('./components/OnboardingView'));
const FeedbackModal = lazy(() => import('./components/FeedbackModal'));
const HomeHubView = lazy(() => import('./components/HomeHubView'));
const DevelopmentHubView = lazy(() => import('./components/DevelopmentHubView'));
const LeagueUpdatesHubView = lazy(() => import('./components/LeagueUpdatesHubView'));

export default function App() {
  const resetDialogRef = useRef<HTMLDivElement | null>(null);
  const [initialWorkspace] = useState(() => {
    const teamInfo = readJsonStorage(STORAGE_KEYS.teamInfo, teamInfoSchema.nullable(), null, 'Team information');
    const players = readJsonStorage(STORAGE_KEYS.players, playersSchema, [], 'Roster');
    const games = readJsonStorage(STORAGE_KEYS.games, gamesSchema, [], 'Schedule');
    const standings = readJsonStorage(STORAGE_KEYS.standings, standingsSchema, [], 'League standings');
    const announcements = readJsonStorage(STORAGE_KEYS.announcements, announcementsSchema, [], 'Bulletins');
    const assessments = readJsonStorage(STORAGE_KEYS.assessments, assessmentsSchema, [], 'Assessments');
    const onboarded = readBooleanStorage(STORAGE_KEYS.onboarded, false, 'Onboarding');

    return {
      teamInfo,
      players,
      games,
      standings,
      announcements,
      assessments,
      isOnboarded: onboarded || teamInfo !== null,
      warnings: drainRecoveryWarnings()
    };
  });

  const [isOnboarded, setIsOnboarded] = useState(initialWorkspace.isOnboarded);
  type PrimaryTab = 'home' | 'squad' | 'tactics' | 'development' | 'league_updates';
  type HomeTab = 'overview' | 'game_week';
  type DevelopmentTab = 'assessments' | 'training';
  type LeagueUpdatesTab = 'league' | 'updates' | 'bulletins';

  const [primaryTab, setPrimaryTab] = useState<PrimaryTab>('home');
  const [homeTab, setHomeTab] = useState<HomeTab>('overview');
  const [developmentTab, setDevelopmentTab] = useState<DevelopmentTab>('assessments');
  const [leagueUpdatesTab, setLeagueUpdatesTab] = useState<LeagueUpdatesTab>('league');
  
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(initialWorkspace.teamInfo);
  const [players, setPlayers] = useState<Player[]>(initialWorkspace.players);
  const [games, setGames] = useState<Game[]>(initialWorkspace.games);
  const [standings, setStandings] = useState<Standing[]>(initialWorkspace.standings);
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialWorkspace.announcements);
  const [assessments, setAssessments] = useState<AssessmentSession[]>(initialWorkspace.assessments);
  const [recoveryWarnings, setRecoveryWarnings] = useState(initialWorkspace.warnings);

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [preselectedAssessmentsPlayerId, setPreselectedAssessmentsPlayerId] = useState<string | null>(null);

  useEffect(() => {
    const handleRecovery = (event: Event) => {
      const warning = (event as CustomEvent<(typeof recoveryWarnings)[number]>).detail;
      setRecoveryWarnings(current => current.some(item => item.key === warning.key) ? current : [...current, warning]);
    };
    window.addEventListener('dumala:storage-recovery', handleRecovery);
    return () => window.removeEventListener('dumala:storage-recovery', handleRecovery);
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    writeJsonStorage(STORAGE_KEYS.teamInfo, teamInfo);
  }, [teamInfo]);

  useEffect(() => {
    writeJsonStorage(STORAGE_KEYS.players, players);
  }, [players]);

  useEffect(() => {
    writeJsonStorage(STORAGE_KEYS.games, games);
  }, [games]);

  useEffect(() => {
    writeJsonStorage(STORAGE_KEYS.standings, standings);
  }, [standings]);

  useEffect(() => {
    writeJsonStorage(STORAGE_KEYS.announcements, announcements);
  }, [announcements]);

  useEffect(() => {
    writeJsonStorage(STORAGE_KEYS.assessments, assessments);
  }, [assessments]);

  const handleRecordResult = (
    gameId: string,
    ourScore: number,
    opponentScore: number,
    mvpId: string,
    notes: string,
    scorersList: NonNullable<Game['scorers']>
  ) => {
    const next = recordMatchResult({
      gameId,
      teamName: teamInfo.name,
      games,
      players,
      standings
    }, {
      ourScore,
      opponentScore,
      mvpId,
      notes,
      scorers: scorersList
    });

    setGames(next.games);
    setPlayers(next.players);
    setStandings(next.standings);
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
    const next = deleteGameAndReconcile({
      gameId,
      teamName: teamInfo.name,
      games,
      players,
      standings
    });
    setGames(next.games);
    setPlayers(next.players);
    setStandings(next.standings);
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

    writeJsonStorage(STORAGE_KEYS.standings, []);
    removeStorage(STORAGE_KEYS.games);
    removeStorage(STORAGE_KEYS.announcements);
    
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
    writeJsonStorage(STORAGE_KEYS.players, resetPlayers);
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

  const downloadBackup = (backup: WorkspaceBackupV2, fileName: string) => {
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getCurrentBackup = () => {
    if (!teamInfo) throw new Error('Create a team workspace before exporting a backup.');
    return createWorkspaceBackup({
      teamInfo,
      players,
      games,
      standings,
      announcements,
      assessments
    });
  };

  const handleExportBackup = () => {
    try {
      const backup = getCurrentBackup();
      const cleanTeamName = teamInfo.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      downloadBackup(backup, `${cleanTeamName}_full_workspace_${new Date().toISOString().slice(0, 10)}.json`);
    } catch (error) {
      console.error('Error generating full workspace backup:', error);
    }
  };

  const handleImportBackup = async (file: File): Promise<BackupRestoreSummary> => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      throw new Error('The selected file is not a valid Dumala backup.');
    }

    const { backup, sourceVersion } = parseWorkspaceBackup(parsed, collectFeatureState());
    const preRestoreBackup = getCurrentBackup();
    writeJsonStorage(STORAGE_KEYS.preRestoreBackup, preRestoreBackup);
    const cleanTeamName = teamInfo.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    downloadBackup(preRestoreBackup, `${cleanTeamName}_pre_restore_${new Date().toISOString().slice(0, 10)}.json`);

    applyWorkspaceBackup(backup);
    setTeamInfo(backup.core.teamInfo);
    setPlayers(backup.core.players);
    setGames(backup.core.games);
    setStandings(backup.core.standings);
    setAnnouncements(backup.core.announcements);
    setAssessments(backup.core.assessments);
    setIsOnboarded(true);
    setPrimaryTab('squad');
    return summarizeBackup(backup, sourceVersion);
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const closeResetDialog = useCallback(() => setShowResetConfirm(false), []);
  useDialogAccessibility(resetDialogRef, showResetConfirm, closeResetDialog);

  const confirmResetApp = () => {
    clearDumalaStorage();
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

  const recoveryBanner = recoveryWarnings.length > 0 ? (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900" role="status">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wider">Local data recovery</p>
          <p className="mt-1 text-xs leading-relaxed">
            {recoveryWarnings.map(warning => warning.section).join(', ')} contained invalid saved data and was reset safely.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRecoveryWarnings([])}
          className="text-xs font-black uppercase tracking-wider text-amber-800 hover:text-amber-950"
        >
          Dismiss
        </button>
      </div>
    </div>
  ) : null;

  if (!isOnboarded || !teamInfo) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PwaStatusBanners />
        <div className="fixed right-4 top-4 z-40">
          <PwaInstallControl />
        </div>
        {recoveryBanner && <div className="mx-auto max-w-3xl px-4 pt-4">{recoveryBanner}</div>}
        <Suspense fallback={<div className="mx-auto max-w-3xl p-4"><ViewLoadingFallback label="onboarding" /></div>}>
          <OnboardingView
            onComplete={(team: TeamInfo, coachPlayer: Player) => {
              setTeamInfo(team);
              setPlayers([coachPlayer]);
              setStandings([]);
              setAssessments([]);
              setPrimaryTab('home');
              setHomeTab('overview');
              writeJsonStorage(STORAGE_KEYS.standings, []);
              writeJsonStorage(STORAGE_KEYS.assessments, []);
              setIsOnboarded(true);
              writeBooleanStorage(STORAGE_KEYS.onboarded, true);
              writeJsonStorage(STORAGE_KEYS.teamInfo, team);
              writeJsonStorage(STORAGE_KEYS.players, [coachPlayer]);
            }}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div id="stack-app-root" className="min-h-screen flex flex-col font-sans text-slate-900">
      <PwaStatusBanners />
      
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
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-lg border border-emerald-100">Saved locally</span>
            <PwaInstallControl />
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
          <Suspense fallback={null}>
            <FeedbackModal
              teamName={teamInfo.name}
              onClose={() => setShowFeedback(false)}
            />
          </Suspense>
        )}

        {showResetConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div
              ref={resetDialogRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="reset-workspace-title"
              className="bg-white border border-slate-200 p-6 rounded-2xl shadow-2xl max-w-sm w-full font-sans"
            >
              <h3 id="reset-workspace-title" className="text-lg font-display font-extrabold text-slate-900 mb-2">Reset workspace?</h3>
              <p className="text-sm text-slate-600 mb-6 font-medium">This removes the team, roster, schedule, and statistics saved in this browser.</p>
              <div className="flex justify-end gap-3 font-semibold">
                <button onClick={() => setShowResetConfirm(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-xs">Cancel</button>
                <button onClick={confirmResetApp} className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-md transition-colors text-xs font-bold">Reset everything</button>
              </div>
            </div>
          </div>
        )}

        {recoveryBanner}

        {/* Active Tab Frame Switcher */}
        <div id="tab-content-frame">
          <Suspense fallback={<ViewLoadingFallback label="workspace" />}>
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
          </Suspense>
        </div>

      </main>

      {/* Dynamic Profile/Detailed Stats Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <Suspense fallback={null}>
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
          </Suspense>
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
