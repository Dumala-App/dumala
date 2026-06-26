import {
  getSession,
  requestOtp,
  signOut,
  subscribeToAuthChanges,
  type AuthState,
  type CloudAuthChangeHandler
} from './auth';
import {
  ensureAccountBootstrap,
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

export interface CloudBulletinRepository {
  list(clubId: string): Promise<SharedBulletin[]>;
  create(input: Parameters<typeof createSharedBulletin>[1]): Promise<SharedBulletin>;
  update(input: Parameters<typeof updateSharedBulletinControlled>[1]): Promise<SharedBulletin>;
  remove(input: Parameters<typeof removeSharedBulletinControlled>[1]): Promise<SharedBulletin>;
}

export interface CloudAuthRepository {
  requestOtp(email: string, redirectTo?: string): Promise<void>;
  signOut(): Promise<void>;
  getSession(): Promise<AuthState>;
  subscribeToAuthChanges(onChange: CloudAuthChangeHandler): () => void;
}

export interface CloudAccountRepository {
  ensureBootstrap(input: AccountBootstrapInput): Promise<AccountBootstrapResult>;
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

export interface CloudDataAccess {
  auth: CloudAuthRepository;
  account: CloudAccountRepository;
  bulletins: CloudBulletinRepository;
  memberships: CloudMembershipRepository;
  lifecycle: CloudLifecycleRepository;
  activity: CloudActivityRepository;
  sync: CloudSyncRepository;
}

export const createCloudDataAccess = (client: DumalaSupabaseClient): CloudDataAccess => ({
  auth: {
    requestOtp: (email, redirectTo) => requestOtp(client, email, redirectTo),
    signOut: () => signOut(client),
    getSession: () => getSession(client),
    subscribeToAuthChanges: onChange => subscribeToAuthChanges(client, onChange)
  },
  account: {
    ensureBootstrap: input => ensureAccountBootstrap(client, input)
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
  }
});
