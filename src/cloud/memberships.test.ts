import { describe, expect, it } from 'vitest';
import type { DumalaSupabaseClient } from './client';
import {
  acceptClubInvitation,
  assertManageableMembershipRole,
  changeClubMemberRole,
  changeClubMemberRoleForClub,
  CloudMembershipError,
  createClubInvitation,
  listClubInvitations,
  normalizeInvitationEmail,
  removeClubMembership,
  removeClubMembershipForClub,
  revokeClubInvitation,
  revokeClubInvitationForClub,
  suspendClubMembershipForClub,
  type ClubInvitation
} from './memberships';

const createMockClient = (userId = 'user-1') => {
  const operations: Array<{ table: string; action: string; payload?: unknown; filters: Array<[string, unknown]> }> = [];
  const rows: Record<string, unknown[]> = {
    club_invitations: [{
      id: 'invite-1',
      club_id: 'club-1',
      email: 'coach@example.test',
      role: 'coach',
      status: 'pending',
      expires_at: '2026-06-30T00:00:00.000Z'
    }],
    club_memberships: [{
      id: 'membership-1',
      club_id: 'club-1',
      user_id: 'user-1',
      role: 'coach',
      membership_state: 'active'
    }]
  };

  const client = {
    auth: {
      getUser: async () => ({ data: { user: { id: userId } }, error: null })
    },
    rpc: async (functionName: string, args: unknown) => {
      operations.push({ table: functionName, action: 'rpc', payload: args, filters: [] });
      return { data: 'membership-2', error: null };
    },
    from: (table: string) => {
      const filters: Array<[string, unknown]> = [];
      let action = 'select';
      let payload: unknown;
      let singleResult = false;

      const builder = {
        select: () => {
          action = action === 'insert' ? 'insert' : 'select';
          return builder;
        },
        insert: (values: unknown) => {
          action = 'insert';
          payload = values;
          return builder;
        },
        update: (values: unknown) => {
          action = 'update';
          payload = values;
          return builder;
        },
        eq: (column: string, value: unknown) => {
          filters.push([column, value]);
          return builder;
        },
        order: () => builder,
        limit: () => builder,
        single: () => {
          singleResult = true;
          return builder;
        },
        then: (resolve: (value: { data: unknown; error: null }) => void) => {
          operations.push({ table, action, payload, filters: [...filters] });
          const data = action === 'select'
            ? rows[table] ?? []
            : singleResult
              ? { id: 'created-1', ...(payload as object) }
              : null;

          resolve({ data, error: null });
        }
      };

      return builder;
    }
  } as unknown as DumalaSupabaseClient;

  return { client, operations };
};

describe('cloud memberships', () => {
  it('normalizes invitation email addresses', () => {
    expect(normalizeInvitationEmail(' Coach@Example.Test ')).toBe('coach@example.test');
  });

  it('rejects owner invitations and owner role changes', () => {
    expect(() => assertManageableMembershipRole('owner')).toThrow(CloudMembershipError);
  });

  it('creates a pending invitation with the signed-in inviter', async () => {
    const { client, operations } = createMockClient('admin-1');

    const invitation = await createClubInvitation(client, {
      clubId: 'club-1',
      email: ' New.Coach@Example.Test ',
      role: 'coach',
      expiresAt: '2026-07-01T00:00:00.000Z'
    });

    expect(invitation).toMatchObject({
      id: 'created-1',
      club_id: 'club-1',
      email: 'new.coach@example.test',
      role: 'coach',
      status: 'pending',
      invited_by: 'admin-1'
    });
    expect(operations[0]).toMatchObject({ table: 'club_invitations', action: 'insert' });
    expect(operations[1]).toMatchObject({
      table: 'audit_events',
      action: 'insert',
      payload: {
        club_id: 'club-1',
        user_id: 'admin-1',
        event_type: 'invitation_created',
        metadata: { role: 'coach' }
      }
    });
  });

  it('lists and revokes club invitations', async () => {
    const { client, operations } = createMockClient();

    await expect(listClubInvitations(client, 'club-1')).resolves.toHaveLength(1);
    await revokeClubInvitation(client, 'invite-1', '2026-06-25T12:00:00.000Z');

    expect(operations.at(-1)).toMatchObject({
      table: 'club_invitations',
      action: 'update',
      payload: {
        status: 'revoked',
        revoked_at: '2026-06-25T12:00:00.000Z'
      },
      filters: [['id', 'invite-1'], ['status', 'pending']]
    });
  });

  it('accepts an invitation and creates an active membership', async () => {
    const { client, operations } = createMockClient('new-user-1');
    const invitation: ClubInvitation = {
      id: 'invite-1',
      club_id: 'club-1',
      email: 'new@example.test',
      role: 'staff',
      status: 'pending',
      invited_at: '2026-06-25T11:00:00.000Z',
      expires_at: '2026-07-01T00:00:00.000Z'
    };

    await acceptClubInvitation(client, invitation);

    expect(operations).toEqual([{
      table: 'accept_club_invitation',
      action: 'rpc',
      payload: { target_invitation_id: 'invite-1' },
      filters: []
    }]);
  });

  it('updates manageable memberships only', async () => {
    const { client, operations } = createMockClient();

    await changeClubMemberRole(client, 'membership-1', 'viewer');
    await removeClubMembership(client, 'membership-1', '2026-06-25T12:00:00.000Z');

    expect(operations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        table: 'club_memberships',
        action: 'update',
        payload: { role: 'viewer' }
      }),
      expect.objectContaining({
        table: 'club_memberships',
        action: 'update',
        payload: {
          membership_state: 'removed',
          removed_at: '2026-06-25T12:00:00.000Z'
        }
      })
    ]));
  });

  it('writes redacted activity for audited membership management actions', async () => {
    const { client, operations } = createMockClient('admin-1');

    await revokeClubInvitationForClub(client, {
      clubId: 'club-1',
      invitationId: 'invite-1',
      role: 'staff',
      revokedAt: '2026-06-25T12:00:00.000Z'
    });
    await changeClubMemberRoleForClub(client, {
      clubId: 'club-1',
      membershipId: 'membership-1',
      role: 'viewer'
    });
    await removeClubMembershipForClub(client, {
      clubId: 'club-1',
      membershipId: 'membership-1',
      removedAt: '2026-06-25T12:01:00.000Z'
    });
    await suspendClubMembershipForClub(client, {
      clubId: 'club-1',
      membershipId: 'membership-1',
      suspendedAt: '2026-06-25T12:02:00.000Z'
    });

    expect(operations.filter(operation => operation.table === 'audit_events').map(operation => operation.payload)).toEqual([
      {
        club_id: 'club-1',
        user_id: 'admin-1',
        device_id: undefined,
        correlation_id: undefined,
        event_type: 'invitation_revoked',
        metadata: { role: 'staff' }
      },
      {
        club_id: 'club-1',
        user_id: 'admin-1',
        device_id: undefined,
        correlation_id: undefined,
        event_type: 'membership_role_changed',
        metadata: { role: 'viewer' }
      },
      {
        club_id: 'club-1',
        user_id: 'admin-1',
        device_id: undefined,
        correlation_id: undefined,
        event_type: 'membership_removed',
        metadata: {}
      },
      {
        club_id: 'club-1',
        user_id: 'admin-1',
        device_id: undefined,
        correlation_id: undefined,
        event_type: 'membership_suspended',
        metadata: {}
      }
    ]);
  });
});
