import type { DumalaSupabaseClient } from './client';
import { writeTeamActivityEvent } from './activity';
import type { MembershipRole } from './permissions';

export type ClubInvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';
export type ManageableMembershipRole = Exclude<MembershipRole, 'owner'>;

export interface ClubInvitation {
  id: string;
  club_id: string;
  email: string;
  role: ManageableMembershipRole;
  status: ClubInvitationStatus;
  invited_by?: string | null;
  accepted_by?: string | null;
  invited_at?: string;
  expires_at: string;
  accepted_at?: string | null;
  revoked_at?: string | null;
}

export interface ClubMembershipSummary {
  id: string;
  club_id: string;
  user_id: string;
  role: MembershipRole;
  membership_state: 'active' | 'invited' | 'suspended' | 'removed';
  invited_at?: string | null;
  accepted_at?: string | null;
  suspended_at?: string | null;
  removed_at?: string | null;
}

export class CloudMembershipError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'CloudMembershipError';
  }
}

const getErrorMessage = (error: unknown) => {
  if (!error) return 'Unknown Supabase error.';
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message);
  return String(error);
};

const expectNoError = <Data>(
  result: { data: Data; error: unknown },
  code: string,
  message: string
): Data => {
  if (result.error) {
    throw new CloudMembershipError(message, code, result.error);
  }

  return result.data;
};

const getRequiredUserId = async (client: DumalaSupabaseClient) => {
  const authResult = await client.auth.getUser();
  const error = 'error' in authResult ? authResult.error : null;
  const user = authResult.data.user;

  if (error || !user) {
    throw new CloudMembershipError(
      error ? getErrorMessage(error) : 'A signed-in user is required for membership changes.',
      'AUTH_REQUIRED',
      error
    );
  }

  return user.id;
};

export const normalizeInvitationEmail = (email: string): string => email.trim().toLowerCase();

export const assertManageableMembershipRole = (role: MembershipRole): ManageableMembershipRole => {
  if (role === 'owner') {
    throw new CloudMembershipError('Owner memberships must be transferred, not invited.', 'OWNER_INVITE_NOT_ALLOWED');
  }

  return role;
};

export const listClubInvitations = async (
  client: DumalaSupabaseClient,
  clubId: string
): Promise<ClubInvitation[]> =>
  expectNoError(
    await client
      .from('club_invitations')
      .select('*')
      .eq('club_id', clubId)
      .order('invited_at', { ascending: false }),
    'LIST_INVITATIONS_FAILED',
    'Failed to list club invitations.'
  ) as unknown as ClubInvitation[];

export const createClubInvitation = async (
  client: DumalaSupabaseClient,
  input: {
    clubId: string;
    email: string;
    role: MembershipRole;
    expiresAt: string;
  }
): Promise<ClubInvitation> => {
  const invitedBy = await getRequiredUserId(client);
  const role = assertManageableMembershipRole(input.role);
  const email = normalizeInvitationEmail(input.email);

  const invitation = expectNoError(
    await client
      .from('club_invitations')
      .insert({
        club_id: input.clubId,
        email,
        role,
        status: 'pending',
        invited_by: invitedBy,
        expires_at: input.expiresAt
      })
      .select('*')
      .single(),
    'CREATE_INVITATION_FAILED',
    'Failed to create club invitation.'
  ) as ClubInvitation;

  await writeTeamActivityEvent(client, 'invitation_created', {
    clubId: input.clubId,
    metadata: { role }
  });

  return invitation;
};

export const revokeClubInvitation = async (
  client: DumalaSupabaseClient,
  invitationId: string,
  revokedAt = new Date().toISOString()
): Promise<void> => {
  expectNoError(
    await client
      .from('club_invitations')
      .update({
        status: 'revoked',
        revoked_at: revokedAt
      })
      .eq('id', invitationId)
      .eq('status', 'pending'),
    'REVOKE_INVITATION_FAILED',
    'Failed to revoke club invitation.'
  );
};

export const revokeClubInvitationForClub = async (
  client: DumalaSupabaseClient,
  input: {
    clubId: string;
    invitationId: string;
    role?: ManageableMembershipRole;
    revokedAt?: string;
  }
): Promise<void> => {
  await revokeClubInvitation(client, input.invitationId, input.revokedAt);
  await writeTeamActivityEvent(client, 'invitation_revoked', {
    clubId: input.clubId,
    metadata: { role: input.role }
  });
};

export const acceptClubInvitation = async (
  client: DumalaSupabaseClient,
  invitation: ClubInvitation
): Promise<void> => {
  expectNoError(
    await client.rpc('accept_club_invitation', { target_invitation_id: invitation.id }),
    'ACCEPT_INVITATION_FAILED',
    'Failed to accept club invitation.'
  );
};

export const listClubMemberships = async (
  client: DumalaSupabaseClient,
  clubId: string
): Promise<ClubMembershipSummary[]> =>
  expectNoError(
    await client
      .from('club_memberships')
      .select('*')
      .eq('club_id', clubId)
      .order('created_at', { ascending: true }),
    'LIST_MEMBERSHIPS_FAILED',
    'Failed to list club memberships.'
  ) as unknown as ClubMembershipSummary[];

export const changeClubMemberRole = async (
  client: DumalaSupabaseClient,
  membershipId: string,
  role: MembershipRole
): Promise<void> => {
  const manageableRole = assertManageableMembershipRole(role);

  expectNoError(
    await client
      .from('club_memberships')
      .update({ role: manageableRole })
      .eq('id', membershipId),
    'CHANGE_MEMBER_ROLE_FAILED',
    'Failed to change club member role.'
  );
};

export const changeClubMemberRoleForClub = async (
  client: DumalaSupabaseClient,
  input: {
    clubId: string;
    membershipId: string;
    role: MembershipRole;
  }
): Promise<void> => {
  const manageableRole = assertManageableMembershipRole(input.role);
  await changeClubMemberRole(client, input.membershipId, manageableRole);
  await writeTeamActivityEvent(client, 'membership_role_changed', {
    clubId: input.clubId,
    metadata: { role: manageableRole }
  });
};

export const removeClubMembership = async (
  client: DumalaSupabaseClient,
  membershipId: string,
  removedAt = new Date().toISOString()
): Promise<void> => {
  expectNoError(
    await client
      .from('club_memberships')
      .update({
        membership_state: 'removed',
        removed_at: removedAt
      })
      .eq('id', membershipId),
    'REMOVE_MEMBERSHIP_FAILED',
    'Failed to remove club membership.'
  );
};

export const removeClubMembershipForClub = async (
  client: DumalaSupabaseClient,
  input: {
    clubId: string;
    membershipId: string;
    removedAt?: string;
  }
): Promise<void> => {
  await removeClubMembership(client, input.membershipId, input.removedAt);
  await writeTeamActivityEvent(client, 'membership_removed', {
    clubId: input.clubId
  });
};

export const suspendClubMembershipForClub = async (
  client: DumalaSupabaseClient,
  input: {
    clubId: string;
    membershipId: string;
    suspendedAt?: string;
  }
): Promise<void> => {
  const suspendedAt = input.suspendedAt ?? new Date().toISOString();

  expectNoError(
    await client
      .from('club_memberships')
      .update({
        membership_state: 'suspended',
        suspended_at: suspendedAt
      })
      .eq('id', input.membershipId),
    'SUSPEND_MEMBERSHIP_FAILED',
    'Failed to suspend club membership.'
  );

  await writeTeamActivityEvent(client, 'membership_suspended', {
    clubId: input.clubId
  });
};
