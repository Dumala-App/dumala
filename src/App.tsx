import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Player, Game, Standing, Announcement, TeamInfo, AssessmentSession, StaffMember, PaymentLedgerEntry } from './types';

import ViewLoadingFallback from './components/ViewLoadingFallback';
import PwaInstallControl from './components/PwaInstallControl';
import PwaStatusBanners from './components/PwaStatusBanners';
import WorkspaceIntegrityBanner from './components/WorkspaceIntegrityBanner';
import WorkspaceStatusBar, { type CloudBackupStatus } from './components/WorkspaceStatusBar';
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
  activateCloudWorkspace,
  bootstrapManagedWorkspaces,
  copyActiveKeysToWorkspace,
  createManagedWorkspace,
  deleteManagedWorkspace,
  importBackupAsManagedWorkspace,
  renameManagedWorkspace,
  resetManagedWorkspace,
  readWorkspaceSummaries,
  restoreBackupIntoActiveWorkspace,
  markCloudWorkspaceSignedOut,
  setActiveWorkspaceId as persistActiveWorkspaceId,
  switchManagedWorkspace,
  touchWorkspaceSummary,
  type WorkspaceSummary
} from './persistence/workspaces';
import type { AccountBootstrapResult } from './cloud/account';
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
  type CoreWorkspace,
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
import { useCloudAuth } from './hooks/useCloudAuth';
import {
  shouldResetHomeTabAfterCloudWorkspaceReady,
  shouldRestoreSavedCloudWorkspaceAfterAuth
} from './navigation/cloudWorkspaceNavigation';
import type { DayName } from './training/synchronization';
import {
  bootstrapSignedInCloudAccount,
  clearPendingAppAuthRedirect,
  getOrCreateCloudDeviceId,
  hasPendingAppAuthRedirect
} from './components/CloudAccountGate';
import { runCloudBackupFlow } from './cloud/workspaceBackupFlow';
import { createContentFingerprint } from './migrations/localToCloud';
import { deriveActivationMilestones, type ActivationMilestoneId } from './activation/milestones';
import { readActivationFlags, recordActivationFlag } from './activation/activationStore';

import { 
  Shield, 
  Users, 
  Trophy, 
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
const TrainingSessionDetailModal = lazy(() => import('./components/TrainingSessionDetailModal'));
const StaffProfileModal = lazy(() => import('./components/StaffProfileModal'));
const TacticsView = lazy(() => import('./components/TacticsView'));
const OnboardingView = lazy(() => import('./components/OnboardingView'));
const FeedbackModal = lazy(() => import('./components/FeedbackModal'));
const HomeHubView = lazy(() => import('./components/HomeHubView'));
const DevelopmentHubView = lazy(() => import('./components/DevelopmentHubView'));
const LeagueUpdatesHubView = lazy(() => import('./components/LeagueUpdatesHubView'));
const AdminConsoleView = lazy(() => import('./components/AdminConsoleView'));
const LandingPage = lazy(() => import('./components/LandingPage'));

const getHashRoute = () => typeof window === 'undefined' ? '' : window.location.hash.replace(/^#\/?/, '');
const isLandingRoute = (route: string) => route === '' || route === 'landing';
const isAppAuthRedirect = () => {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('dumalaAuth') === 'app';
};
const shouldRouteAuthReturnToApp = () => isAppAuthRedirect() || hasPendingAppAuthRedirect();

const CLOUD_BACKUP_METADATA_PREFIX = 'dumala_cloud_backup__';

interface LocalCloudBackupMetadata {
  workspaceId: string;
  cloudClubId: string;
  importId: string;
  contentFingerprint: string;
  backedUpAt: string;
  backupExportedAt: string;
}

const createClientId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const cloudBackupMetadataKey = (workspaceId: string) => `${CLOUD_BACKUP_METADATA_PREFIX}${workspaceId}`;

const readCloudBackupMetadata = (workspaceId: string): LocalCloudBackupMetadata | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(cloudBackupMetadataKey(workspaceId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<LocalCloudBackupMetadata>;
    if (
      parsed.workspaceId === workspaceId
      && typeof parsed.cloudClubId === 'string'
      && typeof parsed.importId === 'string'
      && typeof parsed.contentFingerprint === 'string'
      && typeof parsed.backedUpAt === 'string'
      && typeof parsed.backupExportedAt === 'string'
    ) {
      return parsed as LocalCloudBackupMetadata;
    }
  } catch {
    return null;
  }
  return null;
};

const writeCloudBackupMetadata = (metadata: LocalCloudBackupMetadata) => {
  window.localStorage.setItem(cloudBackupMetadataKey(metadata.workspaceId), JSON.stringify(metadata));
};

const getCloudBackupFingerprint = (backup: WorkspaceBackupV4) =>
  createContentFingerprint({
    core: backup.core,
    featureState: backup.featureState
  });

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
  const cloudAuthController = useCloudAuth({
    enabled: cloudRuntime.enabled,
    auth: cloudRuntime.dataAccess?.auth ?? null
  });
  const analyticsSessionIdRef = useRef(getOrCreateAnalyticsSessionId());
  const onboardingCloudBootstrapUserRef = useRef<string | null>(null);
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
  type HomeTab = 'overview' | 'bulletins' | 'game_week';
  type DevelopmentTab = 'assessments' | 'training' | 'assessment_guide';
  type LeagueUpdatesTab = 'league' | 'updates' | 'game';
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
  const [initialTrainingBuilderDay, setInitialTrainingBuilderDay] = useState<DayName | null>(null);
  const [leagueUpdatesTab, setLeagueUpdatesTab] = useState<LeagueUpdatesTab>('league');
  const [isMatchLayoutFullscreen, setIsMatchLayoutFullscreen] = useState<boolean>(false);
  
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
  const [activationFlags, setActivationFlags] = useState<Record<string, string>>(() => readActivationFlags());
  const [recoveryWarnings, setRecoveryWarnings] = useState(initialWorkspace.warnings);
  const [startupRecoveryIssues, setStartupRecoveryIssues] = useState(initialWorkspace.startupIssues);
  const [storageHealth, setStorageHealth] = useState<StorageHealth | null>(null);
  const [integrityReport, setIntegrityReport] = useState<WorkspaceIntegrityReport | null>(null);
  const [integrityDismissed, setIntegrityDismissed] = useState(false);
  const [integrityFocus, setIntegrityFocus] = useState<IntegrityFocus | null>(null);
  const [cloudBackupRun, setCloudBackupRun] = useState<{ state: 'idle' | 'running' | 'error'; message?: string }>({ state: 'idle' });
  const integritySignatureRef = useRef('');

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [selectedTrainingSessionDay, setSelectedTrainingSessionDay] = useState<DayName | null>(null);
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
    setActivationFlags(readActivationFlags());
    setSelectedPlayer(null);
    setSelectedStaff(null);
    setSelectedTrainingSessionDay(null);
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

  const activeWorkspace = useMemo(
    () => activeWorkspaceId ? workspaces.find(workspace => workspace.id === activeWorkspaceId) ?? null : null,
    [activeWorkspaceId, workspaces]
  );

  const cloudBackupStatus = useMemo<CloudBackupStatus>(() => {
    if (!cloudRuntime.enabled) return { state: 'hidden' };
    if (cloudAuthController.state.status !== 'signedIn') {
      return {
        state: 'needs_sign_in',
        message: 'Sign in first, then back up this local workspace to your cloud account.'
      };
    }
    if (!activeWorkspace?.cloudClubId || !activeWorkspaceId) {
      return {
        state: 'needs_link',
        message: 'Dumala is linking this workspace to your cloud account.'
      };
    }
    if (cloudBackupRun.state === 'running') {
      return {
        state: 'running',
        message: 'Creating a local rollback backup and uploading the workspace.'
      };
    }
    if (cloudBackupRun.state === 'error') {
      return {
        state: 'error',
        message: cloudBackupRun.message ?? 'Cloud backup failed. Your local workspace was left unchanged.'
      };
    }

    try {
      const backup = getCurrentBackup();
      const metadata = readCloudBackupMetadata(activeWorkspaceId);
      const fingerprint = getCloudBackupFingerprint(backup);
      if (
        metadata
        && metadata.cloudClubId === activeWorkspace.cloudClubId
        && metadata.contentFingerprint === fingerprint
      ) {
        return {
          state: 'current',
          backedUpAt: metadata.backedUpAt
        };
      }
    } catch {
      return {
        state: 'needed',
        message: 'Create a valid local workspace before backing it up to cloud.'
      };
    }

    return {
      state: 'needed',
      message: 'Your local copy stays on this browser. Cloud backup starts only after you confirm.'
    };
  }, [
    activeWorkspace,
    activeWorkspaceId,
    announcements,
    assessments,
    cloudAuthController.state.status,
    cloudBackupRun,
    cloudRuntime.enabled,
    games,
    paymentLedger,
    players,
    staff,
    standings,
    teamInfo
  ]);

  const handleExportBackup = () => {
    try {
      const backup = getCurrentBackup();
      const cleanTeamName = teamInfo.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      downloadBackup(backup, `${cleanTeamName}_full_workspace_${new Date().toISOString().slice(0, 10)}.json`);
    } catch (error) {
      console.error('Error generating full workspace backup:', error);
    }
  };

  const handleCloudBackup = async () => {
    if (!cloudRuntime.enabled) return;
    if (cloudAuthController.state.status !== 'signedIn') {
      setCloudBackupRun({ state: 'error', message: 'Sign in before starting Cloud backup.' });
      return;
    }
    if (!activeWorkspaceId || !activeWorkspace?.cloudClubId) {
      setCloudBackupRun({ state: 'error', message: 'This workspace is still linking to your cloud account. Try again in a moment.' });
      return;
    }

    setCloudBackupRun({ state: 'running' });

    try {
      const rollbackBackup = getCurrentBackup();
      const cleanTeamName = rollbackBackup.core.teamInfo.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      downloadBackup(rollbackBackup, `${cleanTeamName}_pre_cloud_backup_${new Date().toISOString().slice(0, 10)}.json`);

      const importId = createClientId('cloud-backup');
      const sourceDeviceId = getOrCreateCloudDeviceId();
      const result = await runCloudBackupFlow({
        core: rollbackBackup.core as unknown as CoreWorkspace,
        storage: window.localStorage,
        sync: cloudRuntime.dataAccess.sync,
        importId,
        sourceDeviceId,
        targetClubId: activeWorkspace.cloudClubId,
        appVersion: '0.0.0',
        device: {
          appVersion: '0.0.0',
          label: typeof navigator === 'undefined' ? 'Dumala web session' : navigator.userAgent.slice(0, 120)
        },
        exportedAt: rollbackBackup.exportedAt
      });

      if (activeWorkspaceId) copyActiveKeysToWorkspace(activeWorkspaceId);
      writeCloudBackupMetadata({
        workspaceId: activeWorkspaceId,
        cloudClubId: activeWorkspace.cloudClubId,
        importId: result.importResult.importId,
        contentFingerprint: getCloudBackupFingerprint(result.backup),
        backedUpAt: result.backedUpAt,
        backupExportedAt: result.backup.exportedAt
      });
      setCloudBackupRun({ state: 'idle' });
    } catch (error) {
      if (activeWorkspaceId) {
        copyActiveKeysToWorkspace(activeWorkspaceId);
        loadWorkspaceStateFromStorage();
      }
      setCloudBackupRun({
        state: 'error',
        message: error instanceof Error ? error.message : 'Cloud backup failed. Your local workspace was left unchanged.'
      });
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
    if (!shouldRouteAuthReturnToApp() || cloudAuthController.state.status === 'loading') return;
    const nextUrl = `${window.location.pathname}#/app`;
    window.history.replaceState(null, '', nextUrl);
    clearPendingAppAuthRedirect();
    setHashRoute('app');
  }, [cloudAuthController.state.status]);

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

  const activationState = useMemo(
    () => deriveActivationMilestones(players, games, assessments, activationFlags),
    [players, games, assessments, activationFlags]
  );

  const emitActivationMilestone = useCallback((id: ActivationMilestoneId, viewName: string, metadata?: Record<string, unknown>) => {
    if (!cloudRuntime.enabled) return;
    void cloudRuntime.dataAccess.admin.recordUsageEvent({
      sessionId: analyticsSessionIdRef.current,
      eventType: 'activation_milestone',
      viewName,
      featureName: id,
      appVersion: '0.0.0',
      deviceType: getDeviceType(),
      browserFamily: getBrowserFamily(),
      metadata
    }).catch(error => {
      console.warn('Failed to record activation milestone', error);
    });
  }, [cloudRuntime]);

  // First time a state-derived milestone is reached, persist it (per team) and
  // emit one activation event. localStorage is the source of truth, so this fires
  // exactly once per milestone even across reloads. The `report` milestone is
  // handled separately by the download handler below.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const existing = readActivationFlags();
    const nowIso = new Date().toISOString();
    const newlyReached = activationState.milestones.filter(
      milestone => milestone.id !== 'report' && milestone.done && !existing[milestone.id]
    );
    if (newlyReached.length === 0) return;

    let flags = existing;
    for (const milestone of newlyReached) {
      const result = recordActivationFlag(milestone.id, nowIso);
      flags = result.flags;
      if (result.changed) emitActivationMilestone(milestone.id, 'home', { rosterSize: activationState.rosterSize });
    }
    setActivationFlags(flags);
  }, [activationState, emitActivationMilestone]);

  const handleReportDownloaded = useCallback(() => {
    const result = recordActivationFlag('report', new Date().toISOString());
    if (result.changed) {
      setActivationFlags(result.flags);
      emitActivationMilestone('report', 'development');
    }
  }, [emitActivationMilestone]);

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
      setWorkspaces(resetManagedWorkspace(activeWorkspaceId));
      setActiveWorkspaceId(activeWorkspaceId);
      loadWorkspaceStateFromStorage();
      setPrimaryTab('home');
      setHomeTab('overview');
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

  const handleSignedOut = () => {
    if (activeWorkspaceId) copyActiveKeysToWorkspace(activeWorkspaceId);
    markCloudWorkspaceSignedOut();
    persistActiveWorkspaceId(null);
    setWorkspaces(readWorkspaceSummaries());
    setActiveWorkspaceId(null);
    setIsOnboarded(false);
    setTeamInfo(null);
    setPlayers([]);
    setStaff([]);
    setGames([]);
    setStandings([]);
    setAnnouncements([]);
    setAssessments([]);
    setPaymentLedger([]);
    setSelectedPlayer(null);
    setSelectedStaff(null);
    setPreselectedAssessmentsPlayerId(null);
    setIntegrityFocus(null);
    setIntegrityReport(null);
    setIntegrityDismissed(false);
    integritySignatureRef.current = '';
    setMobileMenuOpen(false);
    setShowFeedback(false);
    setShowResetConfirm(false);
    setPrimaryTab('home');
    setHomeTab('overview');
  };

  const handleNavigate = (target: {
    primary: PrimaryTab;
    homeTab?: HomeTab;
    developmentTab?: DevelopmentTab;
    trainingDay?: DayName;
    leagueUpdatesTab?: LeagueUpdatesTab;
  }) => {
    setPrimaryTab(target.primary);
    setSelectedTrainingSessionDay(null);

    if (target.primary === 'home') {
      setHomeTab(current => target.homeTab ?? current);
    }

    if (target.primary === 'development') {
      setDevelopmentTab(target.developmentTab ?? 'assessments');
      setInitialTrainingBuilderDay(target.developmentTab === 'training' ? target.trainingDay ?? null : null);
    }

    if (target.primary === 'league_updates') {
      setLeagueUpdatesTab(target.leagueUpdatesTab ?? 'league');
    }

    setMobileMenuOpen(false);
  };

  const handleOpenIntegritySection = (section: IntegritySection) => {
    setSelectedPlayer(null);
    setSelectedTrainingSessionDay(null);
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
      setSelectedTrainingSessionDay(null);
      return;
    }

    if (finding.section === 'games') {
      setSelectedPlayer(null);
      setSelectedTrainingSessionDay(null);
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
    setSelectedTrainingSessionDay(null);
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

  const handleSelectHomeTab = (tab: HomeTab) => {
    handleNavigate({ primary: 'home', homeTab: tab });
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

  const applyCloudWorkspace = (result: AccountBootstrapResult) => {
    if (activeWorkspaceId) copyActiveKeysToWorkspace(activeWorkspaceId);

    const cloudTeamInfo: TeamInfo = {
      name: result.club.name,
      founded: result.club.founded ?? new Date(result.club.created_at).getFullYear().toString(),
      stadium: result.club.stadium ?? 'Home Ground',
      coach: result.profile.display_name ?? 'Team Coach',
      league: result.club.league ?? 'Friendly Division',
      logoColor: result.club.logo_color,
      logoUrl: result.club.logo_url ?? undefined
    };
    const activated = activateCloudWorkspace(cloudTeamInfo, result.club.id);

    setWorkspaces(activated.workspaces);
    setActiveWorkspaceId(activated.summary.id);
    loadWorkspaceStateFromStorage();
    setIsOnboarded(true);
    setSelectedPlayer(null);
    setSelectedStaff(null);
    setIntegrityFocus(null);
    setMobileMenuOpen(false);
  };

  const handleCloudWorkspaceReady = (result: AccountBootstrapResult) => {
    applyCloudWorkspace(result);
    if (shouldResetHomeTabAfterCloudWorkspaceReady('onboarding')) {
      handleNavigate({ primary: 'home', homeTab: 'overview' });
    }
  };

  useEffect(() => {
    if (startupRecoveryIssues.length > 0) return;
    if (!cloudRuntime.enabled || cloudAuthController.state.status !== 'signedIn') {
      onboardingCloudBootstrapUserRef.current = null;
      return;
    }

    const hasSavedCloudWorkspace = workspaces.some(workspace => Boolean(workspace.cloudClubId));
    const shouldRestore = shouldRestoreSavedCloudWorkspaceAfterAuth({
      authStatus: cloudAuthController.state.status,
      isOnboarded,
      hasTeamInfo: teamInfo !== null,
      hasSavedCloudWorkspace
    });

    if (!shouldRestore && (isOnboarded || teamInfo !== null)) return;

    const signedInState = cloudAuthController.state;
    const userId = cloudAuthController.state.session.userId;
    if (onboardingCloudBootstrapUserRef.current === userId) return;
    onboardingCloudBootstrapUserRef.current = userId;

    const restoreExistingCloudWorkspace = async () => {
      if (!shouldRestore) {
        const hasExistingCloudWorkspace = await cloudRuntime.dataAccess.account.hasExistingWorkspace();
        if (!hasExistingCloudWorkspace) return;
      }

      const result = await bootstrapSignedInCloudAccount(cloudRuntime, signedInState, undefined, '0.0.0');
      handleCloudWorkspaceReady(result);
    };

    restoreExistingCloudWorkspace()
      .then(result => {
        onboardingCloudBootstrapUserRef.current = null;
      })
      .catch(error => {
        onboardingCloudBootstrapUserRef.current = null;
        console.warn('Cloud workspace could not restore after sign-in.', error);
      });
  }, [
    cloudAuthController.state,
    cloudRuntime,
    isOnboarded,
    startupRecoveryIssues.length,
    teamInfo,
    workspaces
  ]);

  const handleCloudOnboardingComplete = (
    result: AccountBootstrapResult,
    team: TeamInfo,
    headCoach: StaffMember,
    mockBackup?: WorkspaceBackupV4
  ) => {
    if (activeWorkspaceId) copyActiveKeysToWorkspace(activeWorkspaceId);
    const activated = activateCloudWorkspace(team, result.club.id);
    setWorkspaces(activated.workspaces);
    setActiveWorkspaceId(activated.summary.id);

    if (mockBackup) {
      restoreBackupIntoActiveWorkspace(mockBackup, activated.summary.id);
    } else {
      writeJsonStorage(STORAGE_KEYS.teamInfo, team);
      writeJsonStorage(STORAGE_KEYS.players, []);
      writeJsonStorage(STORAGE_KEYS.staff, [headCoach]);
      writeJsonStorage(STORAGE_KEYS.games, []);
      writeJsonStorage(STORAGE_KEYS.standings, []);
      writeJsonStorage(STORAGE_KEYS.announcements, []);
      writeJsonStorage(STORAGE_KEYS.assessments, []);
      writeJsonStorage(STORAGE_KEYS.paymentLedger, []);
    }

    loadWorkspaceStateFromStorage();
    setWorkspaces(readWorkspaceSummaries());
    setIsOnboarded(true);
    setSelectedPlayer(null);
    setSelectedStaff(null);
    setIntegrityFocus(null);
    setMobileMenuOpen(false);
    if (shouldResetHomeTabAfterCloudWorkspaceReady('onboarding')) {
      handleNavigate({ primary: 'home', homeTab: 'overview' });
    }
  };

  const handleWorkspaceCloudReady = (result: AccountBootstrapResult) => {
    if (activeWorkspaceId && teamInfo) {
      copyActiveKeysToWorkspace(activeWorkspaceId);
      setWorkspaces(touchWorkspaceSummary(activeWorkspaceId, {
        cloudClubId: result.club.id,
        logoUrl: teamInfo.logoUrl
      }));
      setIsOnboarded(true);
      setSelectedPlayer(null);
      setSelectedStaff(null);
      setIntegrityFocus(null);
      setMobileMenuOpen(false);
    } else {
      applyCloudWorkspace(result);
    }
    if (shouldResetHomeTabAfterCloudWorkspaceReady('workspace_controls')) {
      handleNavigate({ primary: 'home', homeTab: 'overview' });
    }
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

  if (isLandingRoute(hashRoute) && !shouldRouteAuthReturnToApp()) {
    return (
      <>
        <PwaStatusBanners />
        <Suspense fallback={<ViewLoadingFallback label="landing page" />}>
          <LandingPage />
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
      <div className="min-h-screen bg-[#020713] text-slate-100">
        <PwaStatusBanners />
        <div className="fixed right-4 top-4 z-40">
          <PwaInstallControl />
        </div>
        {storageWarningBanner && <div className="mx-auto max-w-3xl px-4 pt-4">{storageWarningBanner}</div>}
        {recoveryBanner && <div className="mx-auto max-w-3xl px-4 pt-4">{recoveryBanner}</div>}
        <Suspense fallback={<div className="min-h-screen bg-[#020713] p-4 text-slate-100"><div className="mx-auto max-w-3xl"><ViewLoadingFallback label="onboarding" /></div></div>}>
          <ViewErrorBoundary viewName="Onboarding" resetKeys={['onboarding']}>
            <OnboardingView
              onComplete={handleCreateTeamWorkspace}
              cloudRuntime={cloudRuntime}
              cloudAuthController={cloudAuthController}
              onCloudWorkspaceReady={handleCloudWorkspaceReady}
              onCloudOnboardingComplete={handleCloudOnboardingComplete}
              isReturningUser={workspaces.length > 0}
            />
          </ViewErrorBoundary>
        </Suspense>
      </div>
    );
  }

  const usesDarkGlassShell = (
    primaryTab === 'home'
    || primaryTab === 'squad'
    || primaryTab === 'tactics'
    || primaryTab === 'development'
    || primaryTab === 'league_updates'
  );

  return (
    <div
      id="stack-app-root"
      className={`relative min-h-screen flex flex-col font-sans ${
        usesDarkGlassShell ? 'overflow-x-hidden bg-[#020713] text-slate-100 selection:bg-orange-400/30' : 'text-foreground'
      }`}
    >
      {usesDarkGlassShell && (
        <div aria-hidden="true" className="fixed inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[#020713]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_18%,rgba(34,211,238,0.2),transparent_26rem),radial-gradient(circle_at_18%_18%,rgba(249,115,22,0.2),transparent_23rem),linear-gradient(135deg,#020713_0%,#051325_48%,#041511_100%)]" />
          <div className="absolute left-1/2 top-1/2 h-[78vmin] w-[78vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10 bg-[conic-gradient(from_160deg,transparent,rgba(56,189,248,0.16),transparent,rgba(249,115,22,0.16),transparent)] opacity-70 blur-[1px]" />
          <div className="absolute inset-x-[-10%] bottom-[-28%] h-[58%] rotate-[-4deg] border-t border-emerald-300/20 bg-[linear-gradient(rgba(34,197,94,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.12)_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] [transform-origin:center]" />
        </div>
      )}
      <PwaStatusBanners />
      
      {/* Dynamic Navigation Topbar */}
      {!isMatchLayoutFullscreen && (
        <header id="app-topbar" className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#04091a]/80 text-[#F5F7FB] backdrop-blur-xl">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">

              {/* Desktop Navigation Link Tabs */}
              <nav id="desktop-nav" aria-label="Primary navigation" className="hidden lg:flex items-center gap-1">
                {primaryTabs.map((tab) => {
                  return (
                    <ShellNavItem
                      id={`nav-tab-btn-${tab.id}`}
                      key={tab.id}
                      label={tab.label}
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
                  className="size-10 rounded-xl border border-white/[0.14] bg-white/[0.04] text-[#DDE4EF] shadow-[inset_0_1px_0_rgba(255,255,255,.10)] hover:border-white/[0.26] hover:bg-white/[0.07] hover:text-white active:scale-95 lg:hidden [&_svg]:size-5"
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </Button>
              </div>

            </div>
          </div>

          {/* Expandable Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div id="mobile-nav-panel" className="grid grid-cols-2 gap-2 border-t border-white/[0.06] bg-[#04091a]/95 p-3 backdrop-blur-xl lg:hidden">
              {primaryTabs.map((tab) => {
                return (
                  <ShellNavItem
                    id={`mobile-nav-btn-${tab.id}`}
                    key={tab.id}
                    label={tab.label}
                    isActive={primaryTab === tab.id}
                    onSelect={() => handleSelectPrimaryTab(tab.id)}
                    layout="mobile"
                  />
                );
              })}
            </div>
          )}
        </header>
      )}

      {/* Main Container Stage Body */}
      <main id="app-main-content" className="relative z-10 flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
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
              <ViewErrorBoundary viewName={homeTab === 'overview' ? 'Overview' : homeTab === 'bulletins' ? 'Bulletins' : 'Game Week'} onReturnHome={handleReturnHomeFromError} resetKeys={[primaryTab, homeTab]}>
                <HomeHubView
                  activeTab={homeTab}
                  onTabChange={handleSelectHomeTab}
                  onNavigate={handleNavigate}
                  workspaceControls={
                    <WorkspaceStatusBar
                      teamName={teamInfo.name}
                      cloudRuntime={cloudRuntime}
                      cloudAuthController={cloudAuthController}
                      resetOpen={showResetConfirm}
                      onResetOpenChange={setShowResetConfirm}
                      onFeedback={() => setShowFeedback(true)}
                      onConfirmReset={confirmResetApp}
                      onSignedOut={handleSignedOut}
                      onCloudWorkspaceReady={handleWorkspaceCloudReady}
                      cloudBackupStatus={cloudBackupStatus}
                      onCloudBackup={handleCloudBackup}
                    />
                  }
                  teamInfo={teamInfo}
                  players={players}
                  games={games}
                  standings={standings}
                  announcements={announcements}
                  assessments={assessments}
                  activation={activationState}
                  onSelectPlayer={setSelectedPlayer}
                  onOpenTrainingSession={setSelectedTrainingSessionDay}
                  onUpdateTeamInfo={handleUpdateTeamInfo}
                  onAddAnnouncement={handleAddAnnouncement}
                  onDeleteAnnouncement={handleDeleteAnnouncement}
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
                <TacticsView
                  players={players}
                  staff={staff}
                  games={games}
                  teamCoach={teamInfo?.coach || ''}
                  teamName={teamInfo?.name || 'Apex Rangers'}
                  teamLogoUrl={teamInfo?.logoUrl}
                  onUpdatePlayer={handleUpdatePlayer}
                  onMatchLayoutFullscreenChange={setIsMatchLayoutFullscreen}
                />
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
                  initialTrainingBuilderDay={initialTrainingBuilderDay}
                  onInitialTrainingBuilderDayHandled={() => setInitialTrainingBuilderDay(null)}
                  assessments={assessments}
                  preselectedAssessmentsPlayerId={preselectedAssessmentsPlayerId}
                  onClearPreselectedAssessmentsPlayerId={() => setPreselectedAssessmentsPlayerId(null)}
                  onAddAssessment={handleAddAssessment}
                  onDeleteAssessment={handleDeleteAssessment}
                  onUpdateAssessmentNotes={handleUpdateAssessmentNotes}
                  onReportDownloaded={handleReportDownloaded}
                />
              </ViewErrorBoundary>
            )}

            {primaryTab === 'league_updates' && (
              <ViewErrorBoundary viewName={leagueUpdatesTab === 'league' ? 'League' : leagueUpdatesTab === 'updates' ? 'Updates' : 'Game'} onReturnHome={handleReturnHomeFromError} resetKeys={[primaryTab, leagueUpdatesTab]}>
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
        {selectedTrainingSessionDay && (
          <Suspense fallback={null}>
            <TrainingSessionDetailModal
              day={selectedTrainingSessionDay}
              teamInfo={teamInfo}
              players={players}
              games={games}
              assessments={assessments}
              onClose={() => setSelectedTrainingSessionDay(null)}
              onOpenPlanner={(day: DayName) => {
                setSelectedTrainingSessionDay(null);
                handleNavigate({ primary: 'development', developmentTab: 'training', trainingDay: day });
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
      <footer id="app-footer" className="relative z-10 mt-8 border-t border-cyan-300/10 bg-slate-950/55 px-4 py-2 text-center text-[11px] font-medium text-slate-300/75 shadow-[0_-10px_30px_rgba(2,8,23,0.18)] backdrop-blur-xl">
        Dumala | The operating system built for coaches. Smart Coaching. Future Ready.
      </footer>

    </div>
  );
}
