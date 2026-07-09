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

export interface CloudDataAccess {
  auth: CloudAuthRepository;
  account: CloudAccountRepository;
  bulletins: CloudBulletinRepository;
  memberships: CloudMembershipRepository;
  lifecycle: CloudLifecycleRepository;
  activity: CloudActivityRepository;
  sync: CloudSyncRepository;
  admin: CloudAdminRepository;
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
  }
});
