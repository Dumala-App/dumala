import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Player, Game, Standing, Announcement, TeamInfo, AssessmentSession, StaffMember, PaymentLedgerEntry } from './types';

import ViewLoadingFallback from './components/ViewLoadingFallback';
import PwaInstallControl from './components/PwaInstallControl';
import PwaStatusBanners from './components/PwaStatusBanners';
import WorkspaceIntegrityBanner from './components/WorkspaceIntegrityBanner';
import WorkspaceStatusBar from './components/WorkspaceStatusBar';
import StartupRecoveryScreen from './components/StartupRecoveryScreen';
import { ViewErrorBoundary } from './components/ErrorBoundary';
import ShellNavItem from './components/ShellNavItem';
import TeamWorkspaceMenu from './components/TeamWorkspaceMenu';
import { Button } from './components/ui/button';
import { addAssessmentToWorkspace, deleteAssessmentFromWorkspace } from './fprds/assessmentService';
import {
  announcementsSchema,
  assessmentsSchema,
  gamesSchema,
  migrateLegacyRoster,
  paymentLedgerSchema,
  playersSchema,
  staffMembersSchema,
  standingsSchema,
  teamInfoSchema
} from './persistence/schemas';
import {
  clearDumalaStorage,
  createStorageRecoverySnapshot,
  drainRecoveryWarnings,
  inspectDumalaStorage,
  readBooleanStorage,
  readJsonStorage,
  removeStorage,
  STORAGE_KEYS,
  writeBooleanStorage,
  writeJsonStorage
} from './persistence/storage';
import {
  bootstrapManagedWorkspaces,
  copyActiveKeysToWorkspace,
  createManagedWorkspace,
  deleteManagedWorkspace,
  importBackupAsManagedWorkspace,
  renameManagedWorkspace,
  readWorkspaceSummaries,
  restoreBackupIntoActiveWorkspace,
  switchManagedWorkspace,
  touchWorkspaceSummary,
  type WorkspaceSummary
} from './persistence/workspaces';
import {
  estimateStorageHealth,
  formatStorageSize,
  type StorageHealth
} from './persistence/storageHealth';
import {
  applyWorkspaceBackup,
  collectFeatureState,
  createWorkspaceBackup,
  parseWorkspaceBackup,
  summarizeBackup,
  type BackupRestoreSummary,
  type WorkspaceBackupV4
} from './persistence/backup';
import { deleteGameAndReconcile, recordMatchResult } from './matches/results';
import {
  checkWorkspaceIntegrity,
  getActionableIntegrityFindings,
  getIntegritySignature,
  type IntegrityFinding,
  type IntegritySection,
  type WorkspaceIntegrityReport
} from './integrity/workspaceIntegrity';
import { findUserStanding } from './standings';
import { useCloudRuntime } from './hooks/useCloudRuntime';

import { 
  Shield, 
  Users, 
  Trophy, 
  Heart, 
  Menu,
  X,
  Sliders,
  ClipboardList,
  AlertTriangle,
  Download,
  type LucideIcon
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';

const RosterView = lazy(() => import('./components/RosterView'));
const PlayerProfileModal = lazy(() => import('./components/PlayerProfileModal'));
const StaffProfileModal = lazy(() => import('./components/StaffProfileModal'));
const TacticsView = lazy(() => import('./components/TacticsView'));
const OnboardingView = lazy(() => import('./components/OnboardingView'));
const FeedbackModal = lazy(() => import('./components/FeedbackModal'));
const HomeHubView = lazy(() => import('./components/HomeHubView'));
const DevelopmentHubView = lazy(() => import('./components/DevelopmentHubView'));
const LeagueUpdatesHubView = lazy(() => import('./components/LeagueUpdatesHubView'));
const AdminConsoleView = lazy(() => import('./components/AdminConsoleView'));

const getHashRoute = () => typeof window === 'undefined' ? '' : window.location.hash.replace(/^#\/?/, '');

const shouldReturnToAdminConsole = () => {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('returnTo') === 'admin';
};

const getOrCreateAnalyticsSessionId = () => {
  if (typeof window === 'undefined') return 'server-session';
  const key = 'dumala_admin_analytics_session_id';
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const generated = typeof window.crypto?.randomUUID === 'function'
    ? window.crypto.randomUUID()
    : `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.sessionStorage.setItem(key, generated);
  return generated;
};

const getDeviceType = () => {
  if (typeof navigator === 'undefined') return 'unknown';
  const agent = navigator.userAgent.toLowerCase();
  if (/ipad|tablet/.test(agent)) return 'tablet';
  if (/mobi|android|iphone/.test(agent)) return 'mobile';
  return 'desktop';
};

const getBrowserFamily = () => {
  if (typeof navigator === 'undefined') return 'unknown';
  const agent = navigator.userAgent;
  if (agent.includes('Edg/')) return 'Edge';
  if (agent.includes('Chrome/')) return 'Chrome';
  if (agent.includes('Firefox/')) return 'Firefox';
  if (agent.includes('Safari/') && !agent.includes('Chrome/')) return 'Safari';
  return 'Other';
};

const readPersistedWorkspaceState = () => {
  const teamInfo = readJsonStorage(STORAGE_KEYS.teamInfo, teamInfoSchema.nullable(), null, 'Team information');
  const storedRoster = readJsonStorage(STORAGE_KEYS.players, playersSchema, [], 'Roster');
  const migratedRoster = migrateLegacyRoster(storedRoster);
  const storedStaff = readJsonStorage(STORAGE_KEYS.staff, staffMembersSchema, [], 'Staff directory');
  const players = migratedRoster.players;
  const staff = [...storedStaff, ...migratedRoster.staff.filter(
    legacyStaff => !storedStaff.some(member => member.id === legacyStaff.id)
  )];
  const games = readJsonStorage(STORAGE_KEYS.games, gamesSchema, [], 'Schedule');
  const standings = readJsonStorage(STORAGE_KEYS.standings, standingsSchema, [], 'League standings');
  const announcements = readJsonStorage(STORAGE_KEYS.announcements, announcementsSchema, [], 'Bulletins');
  const assessments = readJsonStorage(STORAGE_KEYS.assessments, assessmentsSchema, [], 'Assessments') as AssessmentSession[];
  const paymentLedger = readJsonStorage(STORAGE_KEYS.paymentLedger, paymentLedgerSchema, [], 'Payment ledger') as PaymentLedgerEntry[];
  const onboarded = readBooleanStorage(STORAGE_KEYS.onboarded, false, 'Onboarding');

  return {
    teamInfo,
    players,
    staff,
    games,
    standings,
    announcements,
    assessments,
    paymentLedger,
    isOnboarded: onboarded || teamInfo !== null
  };
};

export default function App() {
  const cloudRuntime = useCloudRuntime();
  const analyticsSessionIdRef = useRef(getOrCreateAnalyticsSessionId());
  const [hashRoute, setHashRoute] = useState(getHashRoute);
  type IntegrityFocus = {
    playerId?: string | null;
    gameId?: string | null;
    standingTeamName?: string | null;
  };
  const [initialWorkspace] = useState(() => {
    const managed = bootstrapManagedWorkspaces();
    const startupIssues = inspectDumalaStorage();
    if (startupIssues.length > 0) {
      return {
        teamInfo: null,
        players: [],
        staff: [],
        games: [],
        standings: [],
        announcements: [],
        assessments: [] as AssessmentSession[],
        paymentLedger: [] as PaymentLedgerEntry[],
        isOnboarded: false,
        workspaces: managed.workspaces,
        activeWorkspaceId: managed.activeWorkspaceId,
        warnings: [],
        startupIssues
      };
    }

    const persisted = readPersistedWorkspaceState();

    return {
      ...persisted,
      workspaces: managed.workspaces,
      activeWorkspaceId: managed.activeWorkspaceId,
      warnings: drainRecoveryWarnings(),
      startupIssues
    };
  });

  const [isOnboarded, setIsOnboarded] = useState(initialWorkspace.isOnboarded);
  type PrimaryTab = 'home' | 'squad' | 'tactics' | 'development' | 'league_updates';
  type HomeTab = 'overview' | 'game_week';
  type DevelopmentTab = 'assessments' | 'training' | 'assessment_guide';
  type LeagueUpdatesTab = 'league' | 'updates' | 'bulletins';
  const primaryTabs: Array<{ id: PrimaryTab; label: string; icon: LucideIcon }> = [
    { id: 'home', label: 'Home', icon: Shield },
    { id: 'squad', label: 'Squad', icon: Users },
    { id: 'tactics', label: 'Tactics', icon: Sliders },
    { id: 'development', label: 'Development', icon: ClipboardList },
    { id: 'league_updates', label: 'League & Updates', icon: Trophy }
  ];

  const [primaryTab, setPrimaryTab] = useState<PrimaryTab>('home');
  const [homeTab, setHomeTab] = useState<HomeTab>('overview');
  const [developmentTab, setDevelopmentTab] = useState<DevelopmentTab>('assessments');
  const [leagueUpdatesTab, setLeagueUpdatesTab] = useState<LeagueUpdatesTab>('league');
  
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(initialWorkspace.teamInfo);
  const [players, setPlayers] = useState<Player[]>(initialWorkspace.players);
  const [staff, setStaff] = useState<StaffMember[]>(initialWorkspace.staff);
  const [games, setGames] = useState<Game[]>(initialWorkspace.games);
  const [standings, setStandings] = useState<Standing[]>(initialWorkspace.standings);
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialWorkspace.announcements);
  const [assessments, setAssessments] = useState<AssessmentSession[]>(initialWorkspace.assessments);
  const [paymentLedger, setPaymentLedger] = useState<PaymentLedgerEntry[]>(initialWorkspace.paymentLedger);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>(initialWorkspace.workspaces);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(initialWorkspace.activeWorkspaceId);
  const [recoveryWarnings, setRecoveryWarnings] = useState(initialWorkspace.warnings);
  const [startupRecoveryIssues, setStartupRecoveryIssues] = useState(initialWorkspace.startupIssues);
  const [storageHealth, setStorageHealth] = useState<StorageHealth | null>(null);
  const [integrityReport, setIntegrityReport] = useState<WorkspaceIntegrityReport | null>(null);
  const [integrityDismissed, setIntegrityDismissed] = useState(false);
  const [integrityFocus, setIntegrityFocus] = useState<IntegrityFocus | null>(null);
  const integritySignatureRef = useRef('');

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [preselectedAssessmentsPlayerId, setPreselectedAssessmentsPlayerId] = useState<string | null>(null);

  const loadWorkspaceStateFromStorage = useCallback(() => {
    const next = readPersistedWorkspaceState();
    setTeamInfo(next.teamInfo);
    setPlayers(next.players);
    setStaff(next.staff);
    setGames(next.games);
    setStandings(next.standings);
    setAnnouncements(next.announcements);
    setAssessments(next.assessments);
    setPaymentLedger(next.paymentLedger);
    setIsOnboarded(next.isOnboarded);
    setSelectedPlayer(null);
    setSelectedStaff(null);
    setPreselectedAssessmentsPlayerId(null);
    setIntegrityFocus(null);
    setIntegrityDismissed(false);
    integritySignatureRef.current = '';
  }, []);

  const refreshWorkspaceIndex = useCallback(() => {
    setWorkspaces(readWorkspaceSummaries());
  }, []);

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
    if (startupRecoveryIssues.length > 0) return;
    writeJsonStorage(STORAGE_KEYS.teamInfo, teamInfo);
  }, [startupRecoveryIssues.length, teamInfo]);

  useEffect(() => {
    if (startupRecoveryIssues.length > 0) return;
    writeJsonStorage(STORAGE_KEYS.players, players);
  }, [players, startupRecoveryIssues.length]);

  useEffect(() => {
    if (startupRecoveryIssues.length > 0) return;
    writeJsonStorage(STORAGE_KEYS.staff, staff);
  }, [staff, startupRecoveryIssues.length]);

  useEffect(() => {
    if (startupRecoveryIssues.length > 0) return;
    writeJsonStorage(STORAGE_KEYS.games, games);
  }, [games, startupRecoveryIssues.length]);

  useEffect(() => {
    if (startupRecoveryIssues.length > 0) return;
    writeJsonStorage(STORAGE_KEYS.standings, standings);
  }, [standings, startupRecoveryIssues.length]);

  useEffect(() => {
    if (startupRecoveryIssues.length > 0) return;
    writeJsonStorage(STORAGE_KEYS.announcements, announcements);
  }, [announcements, startupRecoveryIssues.length]);

  useEffect(() => {
    if (startupRecoveryIssues.length > 0) return;
    writeJsonStorage(STORAGE_KEYS.assessments, assessments);
  }, [assessments, startupRecoveryIssues.length]);

  useEffect(() => {
    if (startupRecoveryIssues.length > 0) return;
    writeJsonStorage(STORAGE_KEYS.paymentLedger, paymentLedger);
  }, [paymentLedger, startupRecoveryIssues.length]);

  useEffect(() => {
    if (startupRecoveryIssues.length > 0) return;
    let active = true;

    void estimateStorageHealth().then(health => {
      if (active) setStorageHealth(health);
    });

    return () => {
      active = false;
    };
  }, [
    announcements,
    assessments,
    games,
    paymentLedger,
    players,
    standings,
    startupRecoveryIssues.length,
    teamInfo
  ]);

  const runIntegrityCheck = useCallback(() => {
    if (!teamInfo) {
      setIntegrityReport(null);
      return;
    }

    const report = checkWorkspaceIntegrity({
      teamName: teamInfo.name,
      games,
      players,
      standings
    });
    const signature = getIntegritySignature(report);
    if (signature !== integritySignatureRef.current) {
      integritySignatureRef.current = signature;
      setIntegrityDismissed(false);
    }

    const actionable = getActionableIntegrityFindings(report);
    if (actionable.length > 0) {
      const counts = actionable.reduce<Record<string, number>>((summary, item) => {
        summary[item.code] = (summary[item.code] ?? 0) + 1;
        return summary;
      }, {});
      console.warn('Workspace integrity findings', {
        codes: Object.keys(counts),
        counts
      });
    }
    setIntegrityReport(report);
  }, [games, players, standings, teamInfo]);

  useEffect(() => {
    runIntegrityCheck();
  }, [runIntegrityCheck]);

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

  const handleAddPaymentLedgerEntry = (entry: PaymentLedgerEntry) => {
    setPaymentLedger(current => [entry, ...current]);
  };

  const handleAddBulkPaymentLedgerEntries = (entries: PaymentLedgerEntry[]) => {
    if (entries.length === 0) return;
    setPaymentLedger(current => [...entries, ...current]);
  };

  const handleUpdatePaymentLedgerEntry = (entry: PaymentLedgerEntry) => {
    setPaymentLedger(current => current.map(item => item.id === entry.id ? entry : item));
  };

  const handleVoidPaymentLedgerEntry = (entryId: string, reason: string) => {
    const now = new Date().toISOString();
    setPaymentLedger(current => current.map(item => item.id === entryId
      ? {
          ...item,
          voidedAt: now,
          voidReason: reason,
          updatedAt: now
        }
      : item
    ));
  };

  const handleAddStaff = (newStaff: StaffMember) => {
    setStaff(current => [newStaff, ...current]);
  };

  const handleUpdateStaff = (updatedStaff: StaffMember) => {
    setStaff(current => current.map(item => item.id === updatedStaff.id ? updatedStaff : item));
    setSelectedStaff(updatedStaff);
  };

  const handleRemoveStaff = (staffId: string) => {
    setStaff(current => current.filter(item => item.id !== staffId));
    setSelectedStaff(current => current?.id === staffId ? null : current);
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

  const renameUserStanding = (rows: Standing[], previousName: string, nextName: string): Standing[] => {
    const normalizedPrevious = previousName.trim().toLowerCase();
    const normalizedNext = nextName.trim().toLowerCase();
    if (!normalizedNext || normalizedPrevious === normalizedNext) return rows;

    let renamed = false;
    return rows.map(row => {
      const isCurrentUserRow = row.isUserTeam || row.teamName.trim().toLowerCase() === normalizedPrevious;
      if (!isCurrentUserRow || renamed) return row;
      renamed = true;
      return { ...row, teamName: nextName, isUserTeam: true };
    });
  };

  const handleUpdateStanding = (updatedStanding: Standing) => {
    setStandings(prev => prev.map(s => s.teamName === updatedStanding.teamName ? updatedStanding : s));
  };

  const handleUpdateTeamInfo = (updatedInfo: TeamInfo) => {
    setTeamInfo(current => {
      if (current && current.name.trim() !== updatedInfo.name.trim()) {
        setStandings(rows => renameUserStanding(rows, current.name, updatedInfo.name.trim()));
      }
      return updatedInfo;
    });
    if (activeWorkspaceId) {
      setWorkspaces(touchWorkspaceSummary(activeWorkspaceId, {
        name: updatedInfo.name,
        logoUrl: updatedInfo.logoUrl
      }));
    }
  };

  const handleUpdateAllStandings = (updatedStandings: Standing[]) => {
    const userStanding = teamInfo ? findUserStanding(updatedStandings, teamInfo.name) : updatedStandings.find(row => row.isUserTeam);
    if (teamInfo && userStanding && userStanding.teamName.trim() !== teamInfo.name.trim()) {
      setTeamInfo(current => current ? { ...current, name: userStanding.teamName.trim() } : current);
    }
    setStandings(updatedStandings);
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
    const transition = addAssessmentToWorkspace({ players, assessments }, session);
    if (!transition) return;

    setPlayers(transition.players);
    setAssessments(transition.assessments);
  };

  const handleDeleteAssessment = (sessionId: string) => {
    const transition = deleteAssessmentFromWorkspace({ players, assessments }, sessionId);
    if (!transition) return;

    setPlayers(transition.players);
    setAssessments(transition.assessments);
  };

  const handleUpdateAssessmentNotes = (sessionId: string, coachNotes: string) => {
    const trimmedNotes = coachNotes.trim();
    setAssessments(current => current.map(session => (
      session.id === sessionId
        ? {
            ...session,
            coachNotes: trimmedNotes || undefined
          }
        : session
    )));
  };

  const downloadJson = (value: unknown, fileName: string) => {
    const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadBackup = (backup: WorkspaceBackupV4, fileName: string) => {
    downloadJson(backup, fileName);
  };

  const getCurrentBackup = () => {
    if (!teamInfo) throw new Error('Create a team workspace before exporting a backup.');
    return createWorkspaceBackup({
      teamInfo,
      players,
      staff,
      games,
      standings,
      announcements,
      assessments,
      paymentLedger
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

    if (activeWorkspaceId) {
      setWorkspaces(restoreBackupIntoActiveWorkspace(backup, activeWorkspaceId));
    } else {
      applyWorkspaceBackup(backup);
    }
    setTeamInfo(backup.core.teamInfo);
    setPlayers(backup.core.players);
    setStaff(backup.core.staff);
    setGames(backup.core.games);
    setStandings(backup.core.standings);
    setAnnouncements(backup.core.announcements);
    setAssessments(backup.core.assessments as AssessmentSession[]);
    setPaymentLedger(backup.core.paymentLedger);
    setIsOnboarded(true);
    setPrimaryTab('squad');
    return summarizeBackup(backup, sourceVersion);
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const handleHashChange = () => setHashRoute(getHashRoute());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (!shouldReturnToAdminConsole()) return;

    const timeoutId = window.setTimeout(() => {
      window.history.replaceState(null, '', `${window.location.pathname}#admin`);
      setHashRoute('admin');
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!cloudRuntime.enabled) return;
    const viewName = primaryTab;
    const eventPayload = {
      sessionId: analyticsSessionIdRef.current,
      viewName,
      appVersion: '0.0.0',
      deviceType: getDeviceType(),
      browserFamily: getBrowserFamily()
    };

    void cloudRuntime.dataAccess.admin.recordUsageEvent({
      ...eventPayload,
      eventType: 'view_opened',
      featureName: viewName
    }).catch(error => {
      console.warn('Failed to record usage event', error);
    });
  }, [cloudRuntime, primaryTab]);

  useEffect(() => {
    if (!cloudRuntime.enabled) return;
    const heartbeat = () => {
      void cloudRuntime.dataAccess.admin.recordSessionHeartbeat({
        sessionId: analyticsSessionIdRef.current,
        currentView: primaryTab,
        appVersion: '0.0.0',
        deviceType: getDeviceType(),
        browserFamily: getBrowserFamily()
      }).catch(error => {
        console.warn('Failed to record admin analytics heartbeat', error);
      });
    };

    heartbeat();
    const intervalId = window.setInterval(heartbeat, 60000);
    return () => window.clearInterval(intervalId);
  }, [cloudRuntime, primaryTab]);

  const confirmResetApp = () => {
    if (activeWorkspaceId) {
      const next = deleteManagedWorkspace(activeWorkspaceId);
      setWorkspaces(next.workspaces);
      setActiveWorkspaceId(next.activeWorkspaceId);
      if (next.activeWorkspaceId) {
        loadWorkspaceStateFromStorage();
        setPrimaryTab('home');
        setHomeTab('overview');
      } else {
        setIsOnboarded(false);
        setTeamInfo(null);
        setPlayers([]);
        setStaff([]);
        setGames([]);
        setStandings([]);
        setAnnouncements([]);
        setAssessments([]);
        setPaymentLedger([]);
        setPreselectedAssessmentsPlayerId(null);
      }
    } else {
      clearDumalaStorage();
      setIsOnboarded(false);
      setTeamInfo(null);
      setPlayers([]);
      setStaff([]);
      setGames([]);
      setStandings([]);
      setAnnouncements([]);
      setAssessments([]);
      setPaymentLedger([]);
      setPreselectedAssessmentsPlayerId(null);
    }
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

  const handleOpenIntegritySection = (section: IntegritySection) => {
    setSelectedPlayer(null);
    if (section === 'games') {
      setIntegrityFocus({ playerId: null, gameId: null, standingTeamName: null });
      handleNavigate({ primary: 'home', homeTab: 'game_week' });
      return;
    }
    if (section === 'standings') {
      setIntegrityFocus({ playerId: null, gameId: null, standingTeamName: null });
      handleNavigate({ primary: 'league_updates', leagueUpdatesTab: 'league' });
      return;
    }
    if (section === 'players') {
      setIntegrityFocus({ playerId: null, gameId: null, standingTeamName: null });
      handleNavigate({ primary: 'squad' });
      return;
    }
    setIntegrityFocus({ playerId: null, gameId: null, standingTeamName: null });
    handleNavigate({ primary: 'development', developmentTab: 'assessments' });
  };

  const handleOpenIntegrityFinding = (finding: IntegrityFinding) => {
    if (finding.section === 'players') {
      const player = finding.focusId ? players.find(item => item.id === finding.focusId) ?? null : null;
      setIntegrityFocus({
        playerId: player?.id ?? null,
        gameId: null,
        standingTeamName: null
      });
      handleNavigate({ primary: 'squad' });
      if (player) setSelectedPlayer(player);
      return;
    }

    if (finding.section === 'games') {
      setSelectedPlayer(null);
      setIntegrityFocus({
        playerId: null,
        gameId: finding.focusId ?? finding.relatedIds[0] ?? null,
        standingTeamName: null
      });
      handleNavigate({ primary: 'home', homeTab: 'game_week' });
      return;
    }

    if (finding.section === 'standings') {
      setSelectedPlayer(null);
      setIntegrityFocus({
        playerId: null,
        gameId: null,
        standingTeamName: finding.focusId ?? null
      });
      handleNavigate({ primary: 'league_updates', leagueUpdatesTab: 'league' });
      return;
    }

    const player = finding.focusId ? players.find(item => item.id === finding.focusId) ?? null : null;
    setSelectedPlayer(null);
    setIntegrityFocus({
      playerId: player?.id ?? null,
      gameId: null,
      standingTeamName: null
    });
    if (player) setPreselectedAssessmentsPlayerId(player.id);
    handleNavigate({ primary: 'development', developmentTab: 'assessments' });
  };

  const handleSelectPrimaryTab = (tab: PrimaryTab) => {
    if (tab === 'home') return handleNavigate({ primary: 'home', homeTab: 'overview' });
    if (tab === 'development') return handleNavigate({ primary: 'development', developmentTab: 'training' });
    if (tab === 'league_updates') return handleNavigate({ primary: 'league_updates', leagueUpdatesTab: 'league' });
    return handleNavigate({ primary: tab });
  };

  const handleCreateTeamWorkspace = (team: TeamInfo, headCoach: StaffMember) => {
    if (activeWorkspaceId) copyActiveKeysToWorkspace(activeWorkspaceId);
    const created = createManagedWorkspace(team, headCoach);
    setWorkspaces(created.workspaces);
    setActiveWorkspaceId(created.summary.id);
    setTeamInfo(team);
    setPlayers([]);
    setStaff([headCoach]);
    setGames([]);
    setStandings([]);
    setAnnouncements([]);
    setAssessments([]);
    setPaymentLedger([]);
    setIsOnboarded(true);
    setSelectedPlayer(null);
    setSelectedStaff(null);
    setIntegrityFocus(null);
    setMobileMenuOpen(false);
    handleNavigate({ primary: 'home', homeTab: 'overview' });
  };

  const handleSwitchTeamWorkspace = (workspaceId: string) => {
    if (workspaceId === activeWorkspaceId) return;
    switchManagedWorkspace(workspaceId, activeWorkspaceId);
    setActiveWorkspaceId(workspaceId);
    refreshWorkspaceIndex();
    loadWorkspaceStateFromStorage();
    setMobileMenuOpen(false);
    handleNavigate({ primary: 'home', homeTab: 'overview' });
  };

  const handleRenameTeamWorkspace = (workspaceId: string, name: string) => {
    const nextName = name.trim();
    setWorkspaces(renameManagedWorkspace(workspaceId, name));
    if (workspaceId === activeWorkspaceId && teamInfo && nextName) {
      if (teamInfo.name.trim() !== nextName) {
        setStandings(rows => renameUserStanding(rows, teamInfo.name, nextName));
      }
      setTeamInfo({ ...teamInfo, name: nextName });
    }
  };

  const handleDeleteTeamWorkspace = (workspaceId: string) => {
    const next = deleteManagedWorkspace(workspaceId);
    setWorkspaces(next.workspaces);
    if (workspaceId === activeWorkspaceId) {
      setActiveWorkspaceId(next.activeWorkspaceId);
      if (next.activeWorkspaceId) {
        loadWorkspaceStateFromStorage();
        handleNavigate({ primary: 'home', homeTab: 'overview' });
      } else {
        setIsOnboarded(false);
        setTeamInfo(null);
        setPlayers([]);
        setStaff([]);
        setGames([]);
        setStandings([]);
        setAnnouncements([]);
        setAssessments([]);
        setPaymentLedger([]);
      }
    }
  };

  const handleImportTeamWorkspace = async (file: File): Promise<BackupRestoreSummary> => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      throw new Error('The selected file is not a valid Dumala backup.');
    }

    if (activeWorkspaceId) copyActiveKeysToWorkspace(activeWorkspaceId);
    const imported = importBackupAsManagedWorkspace(parsed);
    setWorkspaces(imported.workspaces);
    handleSwitchTeamWorkspace(imported.summary.id);
    return imported.restoreSummary;
  };

  const handleReturnHomeFromError = () => {
    handleNavigate({ primary: 'home', homeTab: 'overview' });
  };

  const handleExportRecoveryCopy = () => {
    const snapshot = createStorageRecoverySnapshot(startupRecoveryIssues);
    downloadJson(snapshot, `dumala_storage_recovery_${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleRetryStartupValidation = () => {
    const issues = inspectDumalaStorage();
    if (issues.length === 0) {
      window.location.reload();
      return;
    }
    setStartupRecoveryIssues(issues);
  };

  const handleResetFromRecovery = () => {
    clearDumalaStorage();
    window.location.reload();
  };

  if (hashRoute === 'admin') {
    return (
      <>
        <PwaStatusBanners />
        <Suspense fallback={<ViewLoadingFallback label="admin console" />}>
          <AdminConsoleView />
        </Suspense>
      </>
    );
  }

  if (startupRecoveryIssues.length > 0) {
    return (
      <StartupRecoveryScreen
        issues={startupRecoveryIssues}
        onExport={handleExportRecoveryCopy}
        onRetry={handleRetryStartupValidation}
        onReset={handleResetFromRecovery}
      />
    );
  }

  const storageWarningBanner = storageHealth && storageHealth.level !== 'healthy' ? (
    <div
      className={`rounded-lg border px-4 py-3 ${
        storageHealth.level === 'critical'
          ? 'border-destructive/25 bg-destructive/10 text-destructive'
          : 'border-warning/25 bg-warning/15 text-warning-foreground'
      }`}
      role="status"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs font-black uppercase">Browser storage is nearly full</p>
            <p className="mt-1 text-xs font-medium leading-relaxed">
              Dumala is using about {Math.round(storageHealth.usageRatio * 100)}% of the storage available to this site
              ({formatStorageSize(storageHealth.usage)} of {formatStorageSize(storageHealth.quota)}). Export a backup before adding more records.
            </p>
          </div>
        </div>
        {teamInfo && (
          <Button
            type="button"
            onClick={handleExportBackup}
            size="sm"
            className="min-h-10 shrink-0"
          >
            <Download size={15} aria-hidden="true" /> Export backup
          </Button>
        )}
      </div>
    </div>
  ) : null;

  const recoveryBanner = recoveryWarnings.length > 0 ? (
    <div className="rounded-xl border border-warning/25 bg-warning/15 px-4 py-3 text-warning-foreground" role="status">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wider">Local data recovery</p>
          <p className="mt-1 text-xs leading-relaxed">
            {recoveryWarnings.map(warning => warning.section).join(', ')} contained invalid saved data and was reset safely.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setRecoveryWarnings([])}
          variant="ghost"
          size="sm"
          className="-mr-2 -mt-1 text-warning-foreground hover:bg-warning/15 hover:text-warning-foreground"
        >
          Dismiss
        </Button>
      </div>
    </div>
  ) : null;

  if (!isOnboarded || !teamInfo) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <PwaStatusBanners />
        <div className="fixed right-4 top-4 z-40">
          <PwaInstallControl />
        </div>
        {storageWarningBanner && <div className="mx-auto max-w-3xl px-4 pt-4">{storageWarningBanner}</div>}
        {recoveryBanner && <div className="mx-auto max-w-3xl px-4 pt-4">{recoveryBanner}</div>}
        <Suspense fallback={<div className="mx-auto max-w-3xl p-4"><ViewLoadingFallback label="onboarding" /></div>}>
          <ViewErrorBoundary viewName="Onboarding" resetKeys={['onboarding']}>
            <OnboardingView
              onComplete={handleCreateTeamWorkspace}
              cloudRuntime={cloudRuntime}
            />
          </ViewErrorBoundary>
        </Suspense>
      </div>
    );
  }

  return (
    <div id="stack-app-root" className="min-h-screen flex flex-col font-sans text-foreground">
      <PwaStatusBanners />
      
      {/* Dynamic Navigation Topbar */}
      <header id="app-topbar" className="sticky top-0 z-40 border-b border-white/10 bg-[var(--shell)]/95 text-[var(--shell-foreground)] shadow-lg shadow-slate-950/10 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[72px]">
            
            {/* Logo Brand Icon */}
            <div className="flex items-center gap-3 min-w-0">
              <img
                id="brand-logo"
                src="/Dumala_logo.png"
                alt="Dumala"
                onClick={() => handleSelectPrimaryTab('home')}
                className="w-14 h-14 rounded-xl object-contain cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0 drop-shadow-sm"
              />
              <div>
                <h1 
                  id="brand-title" 
                  onClick={() => handleSelectPrimaryTab('home')}
                  className="font-display font-extrabold text-sm sm:text-base tracking-tight cursor-pointer text-white hover:text-orange-100 transition-colors truncate"
                >
                  Dumala
                </h1>
                <span id="brand-tagline" className="text-[10px] text-[var(--shell-muted)] block font-semibold truncate max-w-44">
                  {teamInfo?.name || "Team workspace"}
                </span>
              </div>
            </div>

            {/* Desktop Navigation Link Tabs */}
            <nav id="desktop-nav" aria-label="Primary navigation" className="hidden lg:flex items-center gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.06] p-1.5">
              {primaryTabs.map((tab) => {
                return (
                  <ShellNavItem
                    id={`nav-tab-btn-${tab.id}`}
                    key={tab.id}
                    label={tab.label}
                    icon={tab.icon}
                    isActive={primaryTab === tab.id}
                    onSelect={() => handleSelectPrimaryTab(tab.id)}
                    layout="desktop"
                  />
                );
              })}
            </nav>

            {/* Mobile Navigation Sandwich Trigger */}
            <div className="flex items-center gap-2">
              <TeamWorkspaceMenu
                workspaces={workspaces}
                activeWorkspaceId={activeWorkspaceId}
                activeTeamName={teamInfo?.name || 'Team workspace'}
                onCreateWorkspace={handleCreateTeamWorkspace}
                onSwitchWorkspace={handleSwitchTeamWorkspace}
                onRenameWorkspace={handleRenameTeamWorkspace}
                onDeleteWorkspace={handleDeleteTeamWorkspace}
                onExportCurrentWorkspace={handleExportBackup}
                onImportWorkspace={handleImportTeamWorkspace}
              />
              <Button
                id="mobile-menu-hamburger"
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
                aria-expanded={mobileMenuOpen}
                className="size-10 rounded-xl bg-white/10 text-white hover:bg-white/15 hover:text-white active:scale-95 lg:hidden [&_svg]:size-5"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>

          </div>
        </div>

        {/* Expandable Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div id="mobile-nav-panel" className="grid grid-cols-2 gap-2 border-t border-white/10 bg-[var(--shell)] p-3 lg:hidden">
            {primaryTabs.map((tab) => {
              return (
                <ShellNavItem
                  id={`mobile-nav-btn-${tab.id}`}
                  key={tab.id}
                  label={tab.label}
                  icon={tab.icon}
                  isActive={primaryTab === tab.id}
                  onSelect={() => handleSelectPrimaryTab(tab.id)}
                  layout="mobile"
                />
              );
            })}
          </div>
        )}
      </header>

      {/* Main Container Stage Body */}
      <main id="app-main-content" className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        <WorkspaceStatusBar
          teamName={teamInfo.name}
          cloudRuntime={cloudRuntime}
          resetOpen={showResetConfirm}
          onResetOpenChange={setShowResetConfirm}
          onFeedback={() => setShowFeedback(true)}
          onConfirmReset={confirmResetApp}
        />

        {showFeedback && (
          <Suspense fallback={null}>
            <FeedbackModal
              teamName={teamInfo.name}
              onClose={() => setShowFeedback(false)}
            />
          </Suspense>
        )}

        {recoveryBanner}
        {storageWarningBanner}
        {integrityReport && !integrityDismissed && (
          <WorkspaceIntegrityBanner
            report={integrityReport}
            onDismiss={() => setIntegrityDismissed(true)}
            onExportBackup={handleExportBackup}
            onOpenSection={handleOpenIntegritySection}
            onOpenFinding={handleOpenIntegrityFinding}
            onRerun={runIntegrityCheck}
          />
        )}

        {/* Active Tab Frame Switcher */}
        <div id="tab-content-frame">
          <Suspense fallback={<ViewLoadingFallback label="workspace" />}>
            {primaryTab === 'home' && (
              <ViewErrorBoundary viewName={homeTab === 'overview' ? 'Overview' : 'Game Week'} onReturnHome={handleReturnHomeFromError} resetKeys={[primaryTab, homeTab]}>
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
                  highlightGameId={integrityFocus?.gameId ?? null}
                />
              </ViewErrorBoundary>
            )}

            {primaryTab === 'squad' && (
              <ViewErrorBoundary viewName="Squad" onReturnHome={handleReturnHomeFromError} resetKeys={[primaryTab]}>
                <RosterView
                  players={players}
                  staff={staff}
                  onAddPlayer={handleAddPlayer}
                  onAddStaff={handleAddStaff}
                  onSelectPlayer={setSelectedPlayer}
                  onSelectStaff={setSelectedStaff}
                  onExportBackup={handleExportBackup}
                  onImportBackup={handleImportBackup}
                  onUpdatePlayer={handleUpdatePlayer}
                  highlightPlayerId={integrityFocus?.playerId ?? null}
                  paymentLedger={paymentLedger}
                  onAddPaymentLedgerEntry={handleAddPaymentLedgerEntry}
                  onAddBulkPaymentLedgerEntries={handleAddBulkPaymentLedgerEntries}
                  onUpdatePaymentLedgerEntry={handleUpdatePaymentLedgerEntry}
                  onVoidPaymentLedgerEntry={handleVoidPaymentLedgerEntry}
                />
              </ViewErrorBoundary>
            )}

            {primaryTab === 'tactics' && (
              <ViewErrorBoundary viewName="Tactics" onReturnHome={handleReturnHomeFromError} resetKeys={[primaryTab]}>
                <TacticsView players={players} staff={staff} teamCoach={teamInfo?.coach || ''} teamName={teamInfo?.name || 'Apex Rangers'} teamLogoUrl={teamInfo?.logoUrl} onUpdatePlayer={handleUpdatePlayer} />
              </ViewErrorBoundary>
            )}

            {primaryTab === 'development' && (
              <ViewErrorBoundary viewName={developmentTab === 'training' ? 'Training' : developmentTab === 'assessment_guide' ? 'Assessment Guide' : 'Assessments'} onReturnHome={handleReturnHomeFromError} resetKeys={[primaryTab, developmentTab]}>
                <DevelopmentHubView
                  activeTab={developmentTab}
                  onTabChange={setDevelopmentTab}
                  players={players}
                  games={games}
                  onUpdateGames={setGames}
                  assessments={assessments}
                  preselectedAssessmentsPlayerId={preselectedAssessmentsPlayerId}
                  onClearPreselectedAssessmentsPlayerId={() => setPreselectedAssessmentsPlayerId(null)}
                  onAddAssessment={handleAddAssessment}
                  onDeleteAssessment={handleDeleteAssessment}
                  onUpdateAssessmentNotes={handleUpdateAssessmentNotes}
                />
              </ViewErrorBoundary>
            )}

            {primaryTab === 'league_updates' && (
              <ViewErrorBoundary viewName={leagueUpdatesTab === 'league' ? 'League' : leagueUpdatesTab === 'bulletins' ? 'Bulletins' : 'Updates'} onReturnHome={handleReturnHomeFromError} resetKeys={[primaryTab, leagueUpdatesTab]}>
                <LeagueUpdatesHubView
                  activeTab={leagueUpdatesTab}
                  onTabChange={setLeagueUpdatesTab}
                  standings={standings}
                  onUpdateStanding={handleUpdateStanding}
                  onResetStandings={handleResetStandings}
                  teamName={teamInfo?.name || 'Apex Rangers'}
                  teamInfo={teamInfo}
                  onUpdateTeamInfo={handleUpdateTeamInfo}
                  onUpdateAllStandings={handleUpdateAllStandings}
                  players={players}
                  onUpdatePlayer={handleUpdatePlayer}
                  announcements={announcements}
                  onAddAnnouncement={handleAddAnnouncement}
                  onDeleteAnnouncement={handleDeleteAnnouncement}
                  highlightStandingTeamName={integrityFocus?.standingTeamName ?? null}
                />
              </ViewErrorBoundary>
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
      <AnimatePresence>
        {selectedStaff && (
          <Suspense fallback={null}>
            <StaffProfileModal
              staff={selectedStaff}
              onClose={() => setSelectedStaff(null)}
              onUpdate={handleUpdateStaff}
              onRemove={handleRemoveStaff}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* Application Footer */}
      <footer id="app-footer" className="mt-12 space-y-2 border-t border-white/10 bg-[var(--shell)] py-6 text-center text-xs text-[var(--shell-muted)]">
        <div className="flex justify-center gap-4 items-center flex-wrap">
          <span className="font-display font-semibold text-white">Dumala</span>
          <span className="font-sans text-white/20">|</span>
          <span className="flex items-center gap-1">Designed with <Heart size={11} className="fill-accent text-accent" /> for elite athletic clubs</span>
        </div>
        <p className="text-[10px] text-[var(--shell-muted)]/80">
          Your team data stays in this browser unless you export a backup.
        </p>
      </footer>

    </div>
  );
}
