import {
  getSession,
  getAuthenticatorAssuranceLevel,
  listMfaFactors,
  enrollTotpFactor,
  challengeMfaFactor,
  verifyMfaChallenge,
  requestOtp,
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
  signOut,
  subscribeToAuthChanges,
  type AuthState,
  type CloudAuthChangeHandler,
  type MfaAssurance,
  type MfaChallenge,
  type MfaFactor,
  type TotpEnrollment
} from './auth';
import {
  ensureAccountBootstrap,
  hasExistingAccountWorkspace,
  type AccountBootstrapInput,
  type AccountBootstrapResult
} from './account';
import {
  createSharedBulletin,
  listSharedBulletins,
  removeSharedBulletinControlled,
  updateSharedBulletinControlled,
  type SharedBulletin
} from './bulletins';
import type { DumalaSupabaseClient } from './client';
import { applyControlledRecordUpdate, type ControlledRecordUpdateInput } from './concurrency';
import {
  acceptClubInvitation,
  changeClubMemberRoleForClub,
  createClubInvitation,
  listClubInvitations,
  listClubMemberships,
  removeClubMembershipForClub,
  revokeClubInvitationForClub,
  suspendClubMembershipForClub,
  type ClubInvitation
} from './memberships';
import {
  createPortableAccountArchive,
  getAccountLifecycleSummary,
  requestAccountRecoveryLink,
  requestAccountDeletion,
  requestClubDeletion,
  cancelClubDeletion,
  revokeDevice
} from './lifecycle';
import { listTeamActivityHistory, type TeamActivityEvent } from './activity';
import { importCloudPayload, type CloudImportDeviceContext } from './importer';
import type { CloudImportPayload } from '../migrations/localToCloud';
import {
  getAdminConsoleSnapshot,
  getAdminActivationFunnel,
  getAdminGrowthMetrics,
  getAdminSecurityMetrics,
  getAdminStorageMetrics,
  getCurrentAppAdmin,
  listAdminManagedUsers,
  listAdminRecoverableWorkspaces,
  recordAdminAuditEvent,
  revokeAdminUserDevices,
  setAdminUserBan,
  setAdminUserMute,
  setAdminUserNotes,
  setAdminUserPlan,
  createFeedbackSubmission,
  createFprdsBetaSubmission,
  findMyFprdsBetaSubmission,
  getFprdsBenchmarkAnalysis,
  listFprdsBenchmarkReviews,
  createFprdsBenchmarkReview,
  listFprdsBenchmarkCorrections,
  createFprdsBenchmarkCorrection,
  updateFprdsBenchmarkCorrectionStatus,
  restoreAdminWorkspace,
  updateFprdsBetaSubmissionReview,
  recordAppSessionHeartbeat,
  recordAppUsageEvent,
  updateFeedbackSubmission,
  type AdminConsoleSnapshot,
  type AdminGrowthMetrics,
  type AdminManagedUser,
  type AdminRecoverableWorkspace,
  type AdminSecurityMetrics,
  type AdminStorageMetrics,
  type AppAdminProfile,
  type AppSessionHeartbeatInput,
  type FeedbackStatus,
  type FeedbackSubmissionInput,
  type FeedbackSubmission,
  type FprdsBetaSubmission,
  type FprdsBetaSubmissionInput,
  type FprdsBetaReviewInput,
  type FprdsBenchmarkAnalysisRow,
  type FprdsBenchmarkReview,
  type FprdsBenchmarkReviewInput,
  type FprdsBenchmarkCorrection,
  type FprdsBenchmarkCorrectionInput,
  type FprdsBenchmarkCorrectionStatus,
  type ActivationFunnelStep,
  type UsageEventInput
} from './admin';
import {
  createAdminAnnouncement,
  createAdminPromotion,
  deleteAdminAnnouncement,
  deleteAdminPromotion,
  listActiveAnnouncements,
  listActivePromotions,
  listAdminAnnouncements,
  listAdminPromotions,
  setAdminAnnouncementPublished,
  setAdminPromotionActive,
  updateAdminAnnouncement,
  updateAdminPromotion,
  type AnnouncementInput,
  type AnnouncementRecord,
  type PromotionInput,
  type PromotionRecord
} from './marketing';
import {
  bootstrapPlayerAccount,
  grantEntitlement,
  listLeagueAccessRequests,
  provisionLeagueOwner,
  requestLeagueAccess,
  resolveAppDestination,
  reviewLeagueAccessRequest,
  revokeEntitlement,
  setUserPersona,
  type AccountPersona,
  type AppDestination,
  type LeagueAccessRequestInput,
  type LeagueAccessRequestRecord,
  type LeagueAccessRequestStatus
} from './identity';
import {
  approvePlayerLink,
  getMyPlayerProfile,
  getOrCreateClubJoinCode,
  getMyTeamTacticsSummary,
  listMyAssessmentSessions,
  listAchievements,
  listClubLinkRequests,
  listClubRosterPlayers,
  listDrillCompletions,
  listFavorites,
  listMyLinkRequests,
  listMyPlayerLinks,
  listMyTeamSchedule,
  listNotifications,
  listWorkoutSessions,
  logDrillCompletion,
  markAllNotificationsRead,
  markNotificationRead,
  rejectPlayerLink,
  requestPlayerLink,
  saveWorkoutSession,
  setGuardianConsent,
  syncAchievements,
  toggleDrillFavorite,
  upsertMyPlayerProfile,
  withdrawPlayerLinkRequest,
  type ClubRosterPlayer,
  type DrillCompletionInput,
  type GuardianConsentInput,
  type GuardianConsentState,
  type PlayerAchievement,
  type PlayerClubLink,
  type PlayerDrillCompletion,
  type PlayerLinkRequest,
  type PlayerNotification,
  type PlayerProfile,
  type PlayerProfileInput,
  type PlayerWorkoutSession,
  type RequestPlayerLinkInput,
  type TeamScheduleEntry,
  type TeamTacticsSummary,
  type WorkoutSessionInput
} from './player';
import {
  addAward,
  addEventTeam,
  addIncident,
  addInvoice,
  addLedgerEntry,
  addStatEvent,
  advanceEventStatus,
  advanceSeasonStatus,
  applyToLeagueOrg,
  clearFixtures,
  createEvent,
  createLeague,
  createSeason,
  createVenue,
  deleteAward,
  deleteEventTeam,
  deleteIncident,
  deleteInvoice,
  deleteLedgerEntry,
  deleteStatEvent,
  deleteVenue,
  generateFixtures,
  listAwards,
  listCoachMemberships,
  listEvents,
  listEventTeams,
  listFixtures,
  listIncidents,
  listInvoices,
  listLeagueEventTeams,
  listLeagueFixtures,
  listLeagues,
  listLeagueStatEvents,
  listLedgerEntries,
  listRegistrations,
  listSeasons,
  listStatEvents,
  listVenues,
  lookupEventRegistration,
  recordFixtureResult,
  resolveLeagueOrgInvite,
  reviewCoachMembership,
  reviewRegistration,
  rotateCoachInvite,
  setCoachSeatLimit,
  setFixtureOps,
  setFixtureSchedule,
  settleInvoice,
  submitEventRegistration,
  syncApprovedTeams,
  updateEvent,
  updateLeague,
  updateSeason,
  updateVenue,
  type EventAward,
  type EventAwardInput,
  type EventFixture,
  type EventIncident,
  type EventIncidentInput,
  type EventInvoice,
  type EventInvoiceInput,
  type EventRegistration,
  type EventRegistrationInput,
  type EventRegistrationLookup,
  type EventRegistrationStatus,
  type EventTeam,
  type FixtureOpsPatch,
  type FixtureSchedulePatch,
  type FixtureStatEvent,
  type FixtureStatInput,
  type InvoiceStatus,
  type League,
  type LeagueCoachApplyInput,
  type LeagueCoachInviteLookup,
  type LeagueCoachMembership,
  type LeagueCoachStatus,
  type LeagueEvent,
  type LeagueEventInput,
  type LeagueEventStatus,
  type LeagueInput,
  type LeagueSeason,
  type LeagueSeasonInput,
  type LeagueSeasonStatus,
  type LeagueVenue,
  type LeagueVenueInput,
  type LedgerEntry,
  type LedgerEntryInput
} from './league';
import {
  deleteMessage,
  ensureChannel,
  getTeamChatCaptainUserId,
  listMessages,
  markChatRead,
  postAnnouncement,
  postMessage,
  reportMessage,
  type ChatMessage
} from './chat';
import type { AssessmentSession } from '../types';

export interface CloudBulletinRepository {
  list(clubId: string): Promise<SharedBulletin[]>;
  create(input: Parameters<typeof createSharedBulletin>[1]): Promise<SharedBulletin>;
  update(input: Parameters<typeof updateSharedBulletinControlled>[1]): Promise<SharedBulletin>;
  remove(input: Parameters<typeof removeSharedBulletinControlled>[1]): Promise<SharedBulletin>;
}

export interface CloudAuthRepository {
  requestOtp(email: string, redirectTo?: string): Promise<void>;
  signUpWithPassword(email: string, password: string, redirectTo?: string): Promise<void>;
  signInWithPassword(email: string, password: string): Promise<void>;
  signInWithGoogle(redirectTo?: string): Promise<void>;
  signOut(): Promise<void>;
  getSession(): Promise<AuthState>;
  getAuthenticatorAssuranceLevel(): Promise<MfaAssurance>;
  listMfaFactors(): Promise<MfaFactor[]>;
  enrollTotpFactor(friendlyName?: string): Promise<TotpEnrollment>;
  challengeMfaFactor(factorId: string): Promise<MfaChallenge>;
  verifyMfaChallenge(factorId: string, challengeId: string, code: string): Promise<void>;
  subscribeToAuthChanges(onChange: CloudAuthChangeHandler): () => void;
}

export interface CloudAccountRepository {
  ensureBootstrap(input: AccountBootstrapInput): Promise<AccountBootstrapResult>;
  hasExistingWorkspace(): Promise<boolean>;
}

export interface CloudMembershipRepository {
  listInvitations(clubId: string): Promise<ClubInvitation[]>;
  createInvitation(input: Parameters<typeof createClubInvitation>[1]): Promise<ClubInvitation>;
  revokeInvitation(input: Parameters<typeof revokeClubInvitationForClub>[1]): Promise<void>;
  acceptInvitation(invitation: ClubInvitation): Promise<void>;
  listMemberships(clubId: string): ReturnType<typeof listClubMemberships>;
  changeRole(input: Parameters<typeof changeClubMemberRoleForClub>[1]): Promise<void>;
  remove(input: Parameters<typeof removeClubMembershipForClub>[1]): Promise<void>;
  suspend(input: Parameters<typeof suspendClubMembershipForClub>[1]): Promise<void>;
}

export interface CloudLifecycleRepository {
  requestRecoveryLink(email: string, redirectTo?: string): Promise<void>;
  getSummary(): ReturnType<typeof getAccountLifecycleSummary>;
  revokeDevice(deviceId: string, now?: Date): Promise<void>;
  createPortableArchive(clubId: string, now?: Date): ReturnType<typeof createPortableAccountArchive>;
  requestClubDeletion(clubId: string, confirmationName: string, now?: Date): Promise<void>;
  cancelClubDeletion(clubId: string, now?: Date): Promise<void>;
  requestAccountDeletion(confirmationEmail: string, now?: Date): Promise<void>;
}

export interface CloudActivityRepository {
  listHistory(clubId: string, limit?: number): Promise<TeamActivityEvent[]>;
}

export interface CloudSyncRepository {
  importPayload(payload: CloudImportPayload, device: CloudImportDeviceContext): ReturnType<typeof importCloudPayload>;
  applyControlledUpdate<RecordShape = Record<string, unknown>>(
    input: ControlledRecordUpdateInput
  ): Promise<RecordShape>;
}

export interface CloudAdminRepository {
  getCurrentAdmin(): Promise<AppAdminProfile | null>;
  getSnapshot(): Promise<AdminConsoleSnapshot>;
  getSecurityMetrics(days?: number): Promise<AdminSecurityMetrics>;
  getGrowthMetrics(days?: number): Promise<AdminGrowthMetrics>;
  getActivationFunnel(days?: number): Promise<ActivationFunnelStep[]>;
  getStorageMetrics(days?: number): Promise<AdminStorageMetrics>;
  listRecoverableWorkspaces(days?: number): Promise<AdminRecoverableWorkspace[]>;
  restoreWorkspace(clubId: string): Promise<AdminRecoverableWorkspace>;
  listManagedUsers(search?: string | null, limit?: number): Promise<AdminManagedUser[]>;
  setUserBan(userId: string, banned: boolean, reason?: string | null): Promise<AdminManagedUser>;
  setUserMute(userId: string, mutedUntil: string | null, reason?: string | null): Promise<AdminManagedUser>;
  setUserPlan(userId: string, planCode: string, expiresAt?: string | null, note?: string | null): Promise<AdminManagedUser>;
  revokeUserDevices(userId: string): Promise<AdminManagedUser>;
  setUserNotes(userId: string, notes: string | null): Promise<AdminManagedUser>;
  recordAuditEvent(eventType: string, metadata?: Record<string, unknown>): Promise<void>;
  recordUsageEvent(input: UsageEventInput): Promise<void>;
  recordSessionHeartbeat(input: AppSessionHeartbeatInput): Promise<void>;
  createFeedback(input: FeedbackSubmissionInput): Promise<FeedbackSubmission>;
  updateFeedback(feedbackId: string, values: { status?: FeedbackStatus; adminNotes?: string | null }): Promise<FeedbackSubmission>;
  findMyFprdsSubmission(assessmentId: string): Promise<FprdsBetaSubmission | null>;
  createFprdsSubmission(input: FprdsBetaSubmissionInput): Promise<FprdsBetaSubmission>;
  updateFprdsReview(submissionId: string, input: FprdsBetaReviewInput): Promise<FprdsBetaSubmission>;
  getFprdsBenchmarkAnalysis(minSample?: number): Promise<FprdsBenchmarkAnalysisRow[]>;
  listFprdsBenchmarkReviews(): Promise<FprdsBenchmarkReview[]>;
  createFprdsBenchmarkReview(input: FprdsBenchmarkReviewInput): Promise<FprdsBenchmarkReview>;
  listFprdsBenchmarkCorrections(): Promise<FprdsBenchmarkCorrection[]>;
  createFprdsBenchmarkCorrection(input: FprdsBenchmarkCorrectionInput): Promise<FprdsBenchmarkCorrection>;
  updateFprdsBenchmarkCorrectionStatus(correctionId: string, status: FprdsBenchmarkCorrectionStatus): Promise<FprdsBenchmarkCorrection>;
}

export interface CloudMarketingRepository {
  listPromotions(): Promise<PromotionRecord[]>;
  listActivePromotions(): Promise<PromotionRecord[]>;
  createPromotion(input: PromotionInput): Promise<PromotionRecord>;
  updatePromotion(promotionId: string, input: PromotionInput): Promise<PromotionRecord>;
  setPromotionActive(promotionId: string, isActive: boolean): Promise<PromotionRecord>;
  deletePromotion(promotionId: string): Promise<void>;
  listAnnouncements(): Promise<AnnouncementRecord[]>;
  listActiveAnnouncements(): Promise<AnnouncementRecord[]>;
  createAnnouncement(input: AnnouncementInput): Promise<AnnouncementRecord>;
  updateAnnouncement(announcementId: string, input: AnnouncementInput): Promise<AnnouncementRecord>;
  setAnnouncementPublished(announcementId: string, isPublished: boolean): Promise<AnnouncementRecord>;
  deleteAnnouncement(announcementId: string): Promise<void>;
}

export interface CloudIdentityRepository {
  resolveDestination(): Promise<AppDestination>;
  bootstrapPlayerAccount(): Promise<AccountPersona>;
  requestLeagueAccess(input: LeagueAccessRequestInput): Promise<string>;
  listLeagueAccessRequests(status?: LeagueAccessRequestStatus | null): Promise<LeagueAccessRequestRecord[]>;
  provisionLeagueOwner(requestId: string): Promise<void>;
  reviewLeagueAccessRequest(
    requestId: string,
    status: LeagueAccessRequestStatus,
    adminNotes?: string | null
  ): Promise<void>;
  setUserPersona(userId: string, persona: AccountPersona): Promise<void>;
  grantEntitlement(userId: string, entitlement: string, expiresAt?: string | null, notes?: string | null): Promise<void>;
  revokeEntitlement(userId: string, entitlement: string): Promise<void>;
}

export interface CloudPlayerRepository {
  getMyProfile(userId: string): Promise<PlayerProfile | null>;
  upsertMyProfile(userId: string, input: PlayerProfileInput): Promise<PlayerProfile>;
  setGuardianConsent(input: GuardianConsentInput): Promise<GuardianConsentState>;
  requestLink(input: RequestPlayerLinkInput): Promise<string>;
  withdrawLinkRequest(requestId: string): Promise<void>;
  listMyLinkRequests(): Promise<PlayerLinkRequest[]>;
  listMyLinks(): Promise<PlayerClubLink[]>;
  listMyTeamSchedule(clubId: string): Promise<TeamScheduleEntry[]>;
  getMyTeamTacticsSummary(clubId: string): Promise<TeamTacticsSummary | null>;
  getOrCreateClubJoinCode(clubId: string): Promise<string>;
  listClubLinkRequests(clubId: string): Promise<PlayerLinkRequest[]>;
  listClubRosterPlayers(clubId: string): Promise<ClubRosterPlayer[]>;
  listMyAssessmentSessions(playerId: string): Promise<AssessmentSession[]>;
  approveLink(requestId: string, targetPlayerId: string): Promise<string>;
  rejectLink(requestId: string, reason?: string | null): Promise<void>;
  logDrillCompletion(userId: string, input: DrillCompletionInput): Promise<PlayerDrillCompletion>;
  listDrillCompletions(limit?: number): Promise<PlayerDrillCompletion[]>;
  listFavorites(): Promise<string[]>;
  toggleFavorite(userId: string, drillId: string, isFavorite: boolean): Promise<void>;
  saveWorkoutSession(userId: string, input: WorkoutSessionInput): Promise<PlayerWorkoutSession>;
  listWorkoutSessions(limit?: number): Promise<PlayerWorkoutSession[]>;
  listNotifications(limit?: number): Promise<PlayerNotification[]>;
  markNotificationRead(notificationId: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  listAchievements(): Promise<PlayerAchievement[]>;
  syncAchievements(streak: number): Promise<string[]>;
}

export interface CloudLeagueRepository {
  listLeagues(): Promise<League[]>;
  createLeague(ownerUserId: string, input: LeagueInput): Promise<League>;
  updateLeague(leagueId: string, input: LeagueInput): Promise<League>;
  listSeasons(leagueId: string): Promise<LeagueSeason[]>;
  createSeason(leagueId: string, input: LeagueSeasonInput): Promise<LeagueSeason>;
  updateSeason(seasonId: string, input: LeagueSeasonInput): Promise<LeagueSeason>;
  advanceSeasonStatus(seasonId: string, nextStatus: LeagueSeasonStatus): Promise<LeagueSeasonStatus>;
  listVenues(leagueId: string): Promise<LeagueVenue[]>;
  createVenue(leagueId: string, input: LeagueVenueInput): Promise<LeagueVenue>;
  updateVenue(venueId: string, input: LeagueVenueInput): Promise<LeagueVenue>;
  deleteVenue(venueId: string): Promise<void>;
  listEvents(leagueId: string): Promise<LeagueEvent[]>;
  createEvent(leagueId: string, input: LeagueEventInput): Promise<LeagueEvent>;
  updateEvent(eventId: string, input: LeagueEventInput): Promise<LeagueEvent>;
  advanceEventStatus(eventId: string, nextStatus: LeagueEventStatus): Promise<LeagueEventStatus>;
  listRegistrations(eventId: string): Promise<EventRegistration[]>;
  reviewRegistration(
    registrationId: string,
    nextStatus: EventRegistrationStatus,
    note?: string | null
  ): Promise<EventRegistrationStatus>;
  lookupEventRegistration(code: string): Promise<EventRegistrationLookup>;
  submitEventRegistration(input: EventRegistrationInput): Promise<string>;
  listEventTeams(eventId: string): Promise<EventTeam[]>;
  listLeagueEventTeams(leagueId: string): Promise<EventTeam[]>;
  listLeagueFixtures(leagueId: string): Promise<EventFixture[]>;
  listLeagueStatEvents(leagueId: string): Promise<FixtureStatEvent[]>;
  addEventTeam(leagueId: string, eventId: string, input: { name: string; seed?: number | null; registrationId?: string | null }): Promise<EventTeam>;
  deleteEventTeam(teamId: string): Promise<void>;
  syncApprovedTeams(leagueId: string, eventId: string): Promise<EventTeam[]>;
  listFixtures(eventId: string): Promise<EventFixture[]>;
  generateFixtures(leagueId: string, eventId: string): Promise<EventFixture[]>;
  clearFixtures(eventId: string): Promise<void>;
  recordFixtureResult(fixtureId: string, homeScore: number, awayScore: number): Promise<EventFixture>;
  setFixtureSchedule(fixtureId: string, patch: FixtureSchedulePatch): Promise<EventFixture>;
  listStatEvents(eventId: string): Promise<FixtureStatEvent[]>;
  addStatEvent(leagueId: string, eventId: string, input: FixtureStatInput): Promise<FixtureStatEvent>;
  deleteStatEvent(statEventId: string): Promise<void>;
  listAwards(eventId: string): Promise<EventAward[]>;
  addAward(leagueId: string, eventId: string, input: EventAwardInput): Promise<EventAward>;
  deleteAward(awardId: string): Promise<void>;
  listLedgerEntries(leagueId: string): Promise<LedgerEntry[]>;
  addLedgerEntry(leagueId: string, input: LedgerEntryInput): Promise<LedgerEntry>;
  deleteLedgerEntry(entryId: string): Promise<void>;
  listInvoices(leagueId: string): Promise<EventInvoice[]>;
  addInvoice(leagueId: string, input: EventInvoiceInput): Promise<EventInvoice>;
  settleInvoice(invoiceId: string, nextStatus: Extract<InvoiceStatus, 'paid' | 'waived'>, paidOn?: string | null): Promise<EventInvoice>;
  deleteInvoice(invoiceId: string): Promise<void>;
  setFixtureOps(fixtureId: string, patch: FixtureOpsPatch): Promise<EventFixture>;
  listIncidents(eventId: string): Promise<EventIncident[]>;
  addIncident(leagueId: string, eventId: string, input: EventIncidentInput): Promise<EventIncident>;
  deleteIncident(incidentId: string): Promise<void>;
  listCoachMemberships(leagueId: string): Promise<LeagueCoachMembership[]>;
  resolveLeagueOrgInvite(code: string): Promise<LeagueCoachInviteLookup>;
  applyToLeagueOrg(input: LeagueCoachApplyInput): Promise<string>;
  reviewCoachMembership(membershipId: string, nextStatus: Extract<LeagueCoachStatus, 'active' | 'declined' | 'removed'>, note?: string | null): Promise<LeagueCoachStatus>;
  rotateCoachInvite(leagueId: string): Promise<string>;
  setCoachSeatLimit(leagueId: string, seatLimit: number): Promise<League>;
}

export interface CloudChatRepository {
  ensureChannel(clubId: string): Promise<string>;
  listMessages(clubId: string, limit?: number): Promise<ChatMessage[]>;
  postMessage(clubId: string, body: string): Promise<ChatMessage>;
  postAnnouncement(clubId: string, body: string): Promise<ChatMessage>;
  deleteMessage(messageId: string): Promise<void>;
  reportMessage(messageId: string, reason?: string | null): Promise<void>;
  markRead(channelId: string): Promise<void>;
  getCaptainUserId(clubId: string): Promise<string | null>;
}

export interface CloudDataAccess {
  auth: CloudAuthRepository;
  account: CloudAccountRepository;
  bulletins: CloudBulletinRepository;
  memberships: CloudMembershipRepository;
  lifecycle: CloudLifecycleRepository;
  activity: CloudActivityRepository;
  sync: CloudSyncRepository;
  admin: CloudAdminRepository;
  marketing: CloudMarketingRepository;
  identity: CloudIdentityRepository;
  player: CloudPlayerRepository;
  league: CloudLeagueRepository;
  chat: CloudChatRepository;
}

export const createCloudDataAccess = (client: DumalaSupabaseClient): CloudDataAccess => ({
  auth: {
    requestOtp: (email, redirectTo) => requestOtp(client, email, redirectTo),
    signUpWithPassword: (email, password, redirectTo) => signUpWithPassword(client, email, password, redirectTo),
    signInWithPassword: (email, password) => signInWithPassword(client, email, password),
    signInWithGoogle: redirectTo => signInWithGoogle(client, redirectTo),
    signOut: () => signOut(client),
    getSession: () => getSession(client),
    getAuthenticatorAssuranceLevel: () => getAuthenticatorAssuranceLevel(client),
    listMfaFactors: () => listMfaFactors(client),
    enrollTotpFactor: friendlyName => enrollTotpFactor(client, friendlyName),
    challengeMfaFactor: factorId => challengeMfaFactor(client, factorId),
    verifyMfaChallenge: (factorId, challengeId, code) => verifyMfaChallenge(client, factorId, challengeId, code),
    subscribeToAuthChanges: onChange => subscribeToAuthChanges(client, onChange)
  },
  account: {
    ensureBootstrap: input => ensureAccountBootstrap(client, input),
    hasExistingWorkspace: () => hasExistingAccountWorkspace(client)
  },
  bulletins: {
    list: clubId => listSharedBulletins(client, clubId),
    create: input => createSharedBulletin(client, input),
    update: input => updateSharedBulletinControlled(client, input),
    remove: input => removeSharedBulletinControlled(client, input)
  },
  memberships: {
    listInvitations: clubId => listClubInvitations(client, clubId),
    createInvitation: input => createClubInvitation(client, input),
    revokeInvitation: input => revokeClubInvitationForClub(client, input),
    acceptInvitation: invitation => acceptClubInvitation(client, invitation),
    listMemberships: clubId => listClubMemberships(client, clubId),
    changeRole: input => changeClubMemberRoleForClub(client, input),
    remove: input => removeClubMembershipForClub(client, input),
    suspend: input => suspendClubMembershipForClub(client, input)
  },
  lifecycle: {
    requestRecoveryLink: (email, redirectTo) => requestAccountRecoveryLink(client, email, redirectTo),
    getSummary: () => getAccountLifecycleSummary(client),
    revokeDevice: (deviceId, now) => revokeDevice(client, deviceId, now),
    createPortableArchive: (clubId, now) => createPortableAccountArchive(client, clubId, now),
    requestClubDeletion: (clubId, confirmationName, now) =>
      requestClubDeletion(client, clubId, confirmationName, now),
    cancelClubDeletion: (clubId, now) => cancelClubDeletion(client, clubId, now),
    requestAccountDeletion: (confirmationEmail, now) => requestAccountDeletion(client, confirmationEmail, now)
  },
  activity: {
    listHistory: (clubId, limit) => listTeamActivityHistory(client, clubId, limit)
  },
  sync: {
    importPayload: (payload, device) => importCloudPayload(client, payload, device),
    applyControlledUpdate: input => applyControlledRecordUpdate(client, input)
  },
  admin: {
    getCurrentAdmin: () => getCurrentAppAdmin(client),
    getSnapshot: () => getAdminConsoleSnapshot(client),
    getSecurityMetrics: days => getAdminSecurityMetrics(client, days),
    getGrowthMetrics: days => getAdminGrowthMetrics(client, days),
    getActivationFunnel: days => getAdminActivationFunnel(client, days),
    getStorageMetrics: days => getAdminStorageMetrics(client, days),
    listRecoverableWorkspaces: days => listAdminRecoverableWorkspaces(client, days),
    restoreWorkspace: clubId => restoreAdminWorkspace(client, clubId),
    listManagedUsers: (search, limit) => listAdminManagedUsers(client, search ?? null, limit),
    setUserBan: (userId, banned, reason) => setAdminUserBan(client, userId, banned, reason ?? null),
    setUserMute: (userId, mutedUntil, reason) => setAdminUserMute(client, userId, mutedUntil, reason ?? null),
    setUserPlan: (userId, planCode, expiresAt, note) => setAdminUserPlan(client, userId, planCode, expiresAt ?? null, note ?? null),
    revokeUserDevices: userId => revokeAdminUserDevices(client, userId),
    setUserNotes: (userId, notes) => setAdminUserNotes(client, userId, notes),
    recordAuditEvent: (eventType, metadata) => recordAdminAuditEvent(client, eventType, metadata),
    recordUsageEvent: input => recordAppUsageEvent(client, input),
    recordSessionHeartbeat: input => recordAppSessionHeartbeat(client, input),
    createFeedback: input => createFeedbackSubmission(client, input),
    updateFeedback: (feedbackId, values) => updateFeedbackSubmission(client, feedbackId, values),
    findMyFprdsSubmission: assessmentId => findMyFprdsBetaSubmission(client, assessmentId),
    createFprdsSubmission: input => createFprdsBetaSubmission(client, input),
    updateFprdsReview: (submissionId, input) => updateFprdsBetaSubmissionReview(client, submissionId, input),
    getFprdsBenchmarkAnalysis: minSample => getFprdsBenchmarkAnalysis(client, minSample),
    listFprdsBenchmarkReviews: () => listFprdsBenchmarkReviews(client),
    createFprdsBenchmarkReview: input => createFprdsBenchmarkReview(client, input),
    listFprdsBenchmarkCorrections: () => listFprdsBenchmarkCorrections(client),
    createFprdsBenchmarkCorrection: input => createFprdsBenchmarkCorrection(client, input),
    updateFprdsBenchmarkCorrectionStatus: (correctionId, status) => updateFprdsBenchmarkCorrectionStatus(client, correctionId, status)
  },
  marketing: {
    listPromotions: () => listAdminPromotions(client),
    listActivePromotions: () => listActivePromotions(client),
    createPromotion: input => createAdminPromotion(client, input),
    updatePromotion: (promotionId, input) => updateAdminPromotion(client, promotionId, input),
    setPromotionActive: (promotionId, isActive) => setAdminPromotionActive(client, promotionId, isActive),
    deletePromotion: promotionId => deleteAdminPromotion(client, promotionId),
    listAnnouncements: () => listAdminAnnouncements(client),
    listActiveAnnouncements: () => listActiveAnnouncements(client),
    createAnnouncement: input => createAdminAnnouncement(client, input),
    updateAnnouncement: (announcementId, input) => updateAdminAnnouncement(client, announcementId, input),
    setAnnouncementPublished: (announcementId, isPublished) => setAdminAnnouncementPublished(client, announcementId, isPublished),
    deleteAnnouncement: announcementId => deleteAdminAnnouncement(client, announcementId)
  },
  identity: {
    resolveDestination: () => resolveAppDestination(client),
    bootstrapPlayerAccount: () => bootstrapPlayerAccount(client),
    requestLeagueAccess: input => requestLeagueAccess(client, input),
    listLeagueAccessRequests: status => listLeagueAccessRequests(client, status),
    provisionLeagueOwner: requestId => provisionLeagueOwner(client, requestId),
    reviewLeagueAccessRequest: (requestId, status, adminNotes) =>
      reviewLeagueAccessRequest(client, requestId, status, adminNotes),
    setUserPersona: (userId, persona) => setUserPersona(client, userId, persona),
    grantEntitlement: (userId, entitlement, expiresAt, notes) =>
      grantEntitlement(client, userId, entitlement, expiresAt, notes),
    revokeEntitlement: (userId, entitlement) => revokeEntitlement(client, userId, entitlement)
  },
  player: {
    getMyProfile: userId => getMyPlayerProfile(client, userId),
    upsertMyProfile: (userId, input) => upsertMyPlayerProfile(client, userId, input),
    setGuardianConsent: input => setGuardianConsent(client, input),
    requestLink: input => requestPlayerLink(client, input),
    withdrawLinkRequest: requestId => withdrawPlayerLinkRequest(client, requestId),
    listMyLinkRequests: () => listMyLinkRequests(client),
    listMyLinks: () => listMyPlayerLinks(client),
    listMyTeamSchedule: clubId => listMyTeamSchedule(client, clubId),
    getMyTeamTacticsSummary: clubId => getMyTeamTacticsSummary(client, clubId),
    getOrCreateClubJoinCode: clubId => getOrCreateClubJoinCode(client, clubId),
    listClubLinkRequests: clubId => listClubLinkRequests(client, clubId),
    listClubRosterPlayers: clubId => listClubRosterPlayers(client, clubId),
    listMyAssessmentSessions: playerId => listMyAssessmentSessions(client, playerId),
    approveLink: (requestId, targetPlayerId) => approvePlayerLink(client, requestId, targetPlayerId),
    rejectLink: (requestId, reason) => rejectPlayerLink(client, requestId, reason),
    logDrillCompletion: (userId, input) => logDrillCompletion(client, userId, input),
    listDrillCompletions: limit => listDrillCompletions(client, limit),
    listFavorites: () => listFavorites(client),
    toggleFavorite: (userId, drillId, isFavorite) => toggleDrillFavorite(client, userId, drillId, isFavorite),
    saveWorkoutSession: (userId, input) => saveWorkoutSession(client, userId, input),
    listWorkoutSessions: limit => listWorkoutSessions(client, limit),
    listNotifications: limit => listNotifications(client, limit),
    markNotificationRead: notificationId => markNotificationRead(client, notificationId),
    markAllNotificationsRead: userId => markAllNotificationsRead(client, userId),
    listAchievements: () => listAchievements(client),
    syncAchievements: streak => syncAchievements(client, streak)
  },
  league: {
    listLeagues: () => listLeagues(client),
    createLeague: (ownerUserId, input) => createLeague(client, ownerUserId, input),
    updateLeague: (leagueId, input) => updateLeague(client, leagueId, input),
    listSeasons: leagueId => listSeasons(client, leagueId),
    createSeason: (leagueId, input) => createSeason(client, leagueId, input),
    updateSeason: (seasonId, input) => updateSeason(client, seasonId, input),
    advanceSeasonStatus: (seasonId, nextStatus) => advanceSeasonStatus(client, seasonId, nextStatus),
    listVenues: leagueId => listVenues(client, leagueId),
    createVenue: (leagueId, input) => createVenue(client, leagueId, input),
    updateVenue: (venueId, input) => updateVenue(client, venueId, input),
    deleteVenue: venueId => deleteVenue(client, venueId),
    listEvents: leagueId => listEvents(client, leagueId),
    createEvent: (leagueId, input) => createEvent(client, leagueId, input),
    updateEvent: (eventId, input) => updateEvent(client, eventId, input),
    advanceEventStatus: (eventId, nextStatus) => advanceEventStatus(client, eventId, nextStatus),
    listRegistrations: eventId => listRegistrations(client, eventId),
    reviewRegistration: (registrationId, nextStatus, note) =>
      reviewRegistration(client, registrationId, nextStatus, note),
    lookupEventRegistration: code => lookupEventRegistration(client, code),
    submitEventRegistration: input => submitEventRegistration(client, input),
    listEventTeams: eventId => listEventTeams(client, eventId),
    listLeagueEventTeams: leagueId => listLeagueEventTeams(client, leagueId),
    listLeagueFixtures: leagueId => listLeagueFixtures(client, leagueId),
    listLeagueStatEvents: leagueId => listLeagueStatEvents(client, leagueId),
    addEventTeam: (leagueId, eventId, input) => addEventTeam(client, leagueId, eventId, input),
    deleteEventTeam: teamId => deleteEventTeam(client, teamId),
    syncApprovedTeams: (leagueId, eventId) => syncApprovedTeams(client, leagueId, eventId),
    listFixtures: eventId => listFixtures(client, eventId),
    generateFixtures: (leagueId, eventId) => generateFixtures(client, leagueId, eventId),
    clearFixtures: eventId => clearFixtures(client, eventId),
    recordFixtureResult: (fixtureId, homeScore, awayScore) => recordFixtureResult(client, fixtureId, homeScore, awayScore),
    setFixtureSchedule: (fixtureId, patch) => setFixtureSchedule(client, fixtureId, patch),
    listStatEvents: eventId => listStatEvents(client, eventId),
    addStatEvent: (leagueId, eventId, input) => addStatEvent(client, leagueId, eventId, input),
    deleteStatEvent: statEventId => deleteStatEvent(client, statEventId),
    listAwards: eventId => listAwards(client, eventId),
    addAward: (leagueId, eventId, input) => addAward(client, leagueId, eventId, input),
    deleteAward: awardId => deleteAward(client, awardId),
    listLedgerEntries: leagueId => listLedgerEntries(client, leagueId),
    addLedgerEntry: (leagueId, input) => addLedgerEntry(client, leagueId, input),
    deleteLedgerEntry: entryId => deleteLedgerEntry(client, entryId),
    listInvoices: leagueId => listInvoices(client, leagueId),
    addInvoice: (leagueId, input) => addInvoice(client, leagueId, input),
    settleInvoice: (invoiceId, nextStatus, paidOn) => settleInvoice(client, invoiceId, nextStatus, paidOn),
    deleteInvoice: invoiceId => deleteInvoice(client, invoiceId),
    setFixtureOps: (fixtureId, patch) => setFixtureOps(client, fixtureId, patch),
    listIncidents: eventId => listIncidents(client, eventId),
    addIncident: (leagueId, eventId, input) => addIncident(client, leagueId, eventId, input),
    deleteIncident: incidentId => deleteIncident(client, incidentId),
    listCoachMemberships: leagueId => listCoachMemberships(client, leagueId),
    resolveLeagueOrgInvite: code => resolveLeagueOrgInvite(client, code),
    applyToLeagueOrg: input => applyToLeagueOrg(client, input),
    reviewCoachMembership: (membershipId, nextStatus, note) => reviewCoachMembership(client, membershipId, nextStatus, note),
    rotateCoachInvite: leagueId => rotateCoachInvite(client, leagueId),
    setCoachSeatLimit: (leagueId, seatLimit) => setCoachSeatLimit(client, leagueId, seatLimit)
  },
  chat: {
    ensureChannel: clubId => ensureChannel(client, clubId),
    listMessages: (clubId, limit) => listMessages(client, clubId, limit),
    postMessage: (clubId, body) => postMessage(client, clubId, body),
    postAnnouncement: (clubId, body) => postAnnouncement(client, clubId, body),
    deleteMessage: messageId => deleteMessage(client, messageId),
    reportMessage: (messageId, reason) => reportMessage(client, messageId, reason),
    markRead: channelId => markChatRead(client, channelId),
    getCaptainUserId: clubId => getTeamChatCaptainUserId(client, clubId)
  }
});
