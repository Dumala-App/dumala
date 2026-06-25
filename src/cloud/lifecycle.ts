import type { DumalaSupabaseClient } from './client';
import { sanitizeOperationalMetadata } from './operations';

export const RECENT_AUTH_WINDOW_MS = 15 * 60 * 1000;

export type LifecycleAuditEventType =
  | 'export_requested'
  | 'export_completed'
  | 'deletion_requested'
  | 'deletion_cancelled'
  | 'device_revoked'
  | 'authorization_denied';

export interface PortableAccountArchive {
  format: 'dumala-portable-account-archive';
  version: 1;
  exportedAt: string;
  account: {
    userId: string;
    email?: string;
    profile: unknown;
  };
  clubs: unknown[];
  memberships: unknown[];
  devices: unknown[];
  workspace: Record<string, unknown[]>;
}

export interface LifecycleDeviceSummary {
  id: string;
  label?: string;
  appVersion?: string;
  lastSeenAt?: string;
  lastSyncAt?: string;
  revokedAt?: string;
}

export interface LifecycleSummary {
  userId: string;
  email?: string;
  profile: unknown;
  devices: LifecycleDeviceSummary[];
}

export class CloudLifecycleError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'CloudLifecycleError';
  }
}

const EXPORT_TABLES = [
  'players',
  'staff_members',
  'games',
  'match_results',
  'match_scorer_contributions',
  'mvp_awards',
  'player_offenses',
  'standings_rows',
  'standings_snapshots',
  'bulletins',
  'assessment_sessions',
  'assessment_development_plan_weeks',
  'payment_ledger_entries',
  'player_availability',
  'coach_notes',
  'weekly_training_schedules',
  'tactics_workspaces',
  'tactics_lineup_assignments',
  'tactics_draw_paths',
  'tactics_notes',
  'tactics_player_extras'
] as const;

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
  if (result.error) throw new CloudLifecycleError(`${message}: ${getErrorMessage(result.error)}`, code, result.error);
  return result.data;
};

export const getSignedInUser = async (client: DumalaSupabaseClient) => {
  const { data, error } = await client.auth.getUser();
  if (error) throw new CloudLifecycleError(`Failed to read Supabase user: ${getErrorMessage(error)}`, 'AUTH_USER_LOOKUP_FAILED', error);
  if (!data.user) throw new CloudLifecycleError('A signed-in account is required for this action.', 'AUTH_USER_REQUIRED');
  return data.user;
};

export const assertRecentAuthentication = async (
  client: DumalaSupabaseClient,
  now = new Date(),
  windowMs = RECENT_AUTH_WINDOW_MS
) => {
  const { data, error } = await client.auth.getSession();
  if (error) throw new CloudLifecycleError(`Failed to read Supabase session: ${getErrorMessage(error)}`, 'AUTH_SESSION_LOOKUP_FAILED', error);

  const lastSignInAt = data.session?.user?.last_sign_in_at;
  if (!lastSignInAt) {
    throw new CloudLifecycleError('Recent authentication is required before this sensitive action.', 'RECENT_AUTH_REQUIRED');
  }

  const ageMs = now.getTime() - new Date(lastSignInAt).getTime();
  if (Number.isNaN(ageMs) || ageMs > windowMs) {
    throw new CloudLifecycleError('Recent authentication is required before this sensitive action.', 'RECENT_AUTH_REQUIRED');
  }
};

export const writeLifecycleAuditEvent = async (
  client: DumalaSupabaseClient,
  eventType: LifecycleAuditEventType,
  values: {
    clubId?: string;
    deviceId?: string;
    metadata?: Record<string, unknown>;
  } = {}
) => {
  const user = await getSignedInUser(client);
  expectNoError(
    await client.from('audit_events').insert({
      club_id: values.clubId,
      user_id: user.id,
      device_id: values.deviceId,
      event_type: eventType,
      metadata: sanitizeOperationalMetadata(values.metadata)
    }),
    'AUDIT_EVENT_INSERT_FAILED',
    'Failed to write lifecycle audit event'
  );
};

export const requestAccountRecoveryLink = async (
  client: DumalaSupabaseClient,
  email: string,
  redirectTo?: string
) => {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new CloudLifecycleError('Email is required to request account recovery.', 'RECOVERY_EMAIL_REQUIRED');
  }

  const { error } = await client.auth.signInWithOtp({
    email: normalizedEmail,
    options: redirectTo ? { emailRedirectTo: redirectTo } : undefined
  });
  if (error) {
    throw new CloudLifecycleError(`Failed to request recovery link: ${getErrorMessage(error)}`, 'RECOVERY_LINK_REQUEST_FAILED', error);
  }
};

export const getAccountLifecycleSummary = async (
  client: DumalaSupabaseClient
): Promise<LifecycleSummary> => {
  const user = await getSignedInUser(client);
  const profile = expectNoError(
    await client.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    'PROFILE_READ_FAILED',
    'Failed to read account profile'
  );
  const devices = expectNoError(
    await client.from('devices').select('*').eq('user_id', user.id).order('last_seen_at', { ascending: false }),
    'DEVICES_READ_FAILED',
    'Failed to read account devices'
  ) as Array<Record<string, string | undefined>>;

  return {
    userId: user.id,
    email: user.email,
    profile,
    devices: devices.map(device => ({
      id: device.id!,
      label: device.label,
      appVersion: device.app_version,
      lastSeenAt: device.last_seen_at,
      lastSyncAt: device.last_sync_at,
      revokedAt: device.revoked_at
    }))
  };
};

export const revokeDevice = async (
  client: DumalaSupabaseClient,
  deviceId: string,
  now = new Date()
) => {
  await assertRecentAuthentication(client, now);
  const user = await getSignedInUser(client);

  expectNoError(
    await client
      .from('devices')
      .update({ revoked_at: now.toISOString() })
      .eq('id', deviceId)
      .eq('user_id', user.id),
    'DEVICE_REVOKE_FAILED',
    'Failed to revoke device'
  );
  await writeLifecycleAuditEvent(client, 'device_revoked', { deviceId });
};

const readClub = async (client: DumalaSupabaseClient, clubId: string) =>
  expectNoError(
    await client.from('clubs').select('*').eq('id', clubId).single(),
    'CLUB_READ_FAILED',
    'Failed to read club'
  ) as Record<string, unknown>;

export const createPortableAccountArchive = async (
  client: DumalaSupabaseClient,
  clubId: string,
  now = new Date()
): Promise<PortableAccountArchive> => {
  await assertRecentAuthentication(client, now);
  const user = await getSignedInUser(client);
  await writeLifecycleAuditEvent(client, 'export_requested', { clubId, metadata: { exportType: 'portable_account_archive' } });

  const profile = expectNoError(
    await client.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    'PROFILE_READ_FAILED',
    'Failed to read account profile'
  );
  const clubs = expectNoError(
    await client.from('clubs').select('*').eq('id', clubId),
    'CLUB_EXPORT_READ_FAILED',
    'Failed to read club export data'
  ) as unknown[];
  const memberships = expectNoError(
    await client.from('club_memberships').select('*').eq('user_id', user.id),
    'MEMBERSHIP_EXPORT_READ_FAILED',
    'Failed to read membership export data'
  ) as unknown[];
  const devices = expectNoError(
    await client.from('devices').select('id,label,app_version,last_seen_at,last_sync_at,revoked_at,created_at,updated_at').eq('user_id', user.id),
    'DEVICE_EXPORT_READ_FAILED',
    'Failed to read device export data'
  ) as unknown[];

  const workspace: Record<string, unknown[]> = {};
  for (const table of EXPORT_TABLES) {
    workspace[table] = expectNoError(
      await client.from(table).select('*').eq('club_id', clubId),
      `${table.toUpperCase()}_EXPORT_READ_FAILED`,
      `Failed to read ${table} export data`
    ) as unknown[];
  }

  await writeLifecycleAuditEvent(client, 'export_completed', {
    clubId,
    metadata: { exportType: 'portable_account_archive', tableCount: EXPORT_TABLES.length }
  });

  return {
    format: 'dumala-portable-account-archive',
    version: 1,
    exportedAt: now.toISOString(),
    account: {
      userId: user.id,
      email: user.email,
      profile
    },
    clubs,
    memberships,
    devices,
    workspace
  };
};

export const requestClubDeletion = async (
  client: DumalaSupabaseClient,
  clubId: string,
  confirmationName: string,
  now = new Date()
) => {
  await assertRecentAuthentication(client, now);
  const user = await getSignedInUser(client);
  const club = await readClub(client, clubId);

  if (club.owner_user_id !== user.id) {
    await writeLifecycleAuditEvent(client, 'authorization_denied', { clubId, metadata: { action: 'request_club_deletion' } });
    throw new CloudLifecycleError('Only the club owner can request club deletion.', 'CLUB_OWNER_REQUIRED');
  }
  if (club.name !== confirmationName) {
    throw new CloudLifecycleError('Club deletion requires typing the exact club name.', 'CLUB_CONFIRMATION_MISMATCH');
  }

  expectNoError(
    await client.from('clubs').update({
      club_state: 'pending_deletion',
      pending_deletion_at: now.toISOString()
    }).eq('id', clubId),
    'CLUB_DELETION_REQUEST_FAILED',
    'Failed to request club deletion'
  );
  await writeLifecycleAuditEvent(client, 'deletion_requested', { clubId, metadata: { target: 'club' } });
};

export const cancelClubDeletion = async (
  client: DumalaSupabaseClient,
  clubId: string,
  now = new Date()
) => {
  await assertRecentAuthentication(client, now);
  const user = await getSignedInUser(client);
  const club = await readClub(client, clubId);

  if (club.owner_user_id !== user.id) {
    await writeLifecycleAuditEvent(client, 'authorization_denied', { clubId, metadata: { action: 'cancel_club_deletion' } });
    throw new CloudLifecycleError('Only the club owner can cancel club deletion.', 'CLUB_OWNER_REQUIRED');
  }

  expectNoError(
    await client.from('clubs').update({
      club_state: 'active',
      pending_deletion_at: null
    }).eq('id', clubId),
    'CLUB_DELETION_CANCEL_FAILED',
    'Failed to cancel club deletion'
  );
  await writeLifecycleAuditEvent(client, 'deletion_cancelled', { clubId, metadata: { target: 'club' } });
};

export const requestAccountDeletion = async (
  client: DumalaSupabaseClient,
  confirmationEmail: string,
  now = new Date()
) => {
  await assertRecentAuthentication(client, now);
  const user = await getSignedInUser(client);

  if (user.email && confirmationEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
    throw new CloudLifecycleError('Account deletion requires typing the account email.', 'ACCOUNT_CONFIRMATION_MISMATCH');
  }

  const ownedClubs = expectNoError(
    await client.from('clubs').select('id,name,club_state').eq('owner_user_id', user.id),
    'OWNED_CLUBS_READ_FAILED',
    'Failed to read owned clubs'
  ) as Array<{ club_state?: string }>;
  if (ownedClubs.some(club => club.club_state === 'active')) {
    throw new CloudLifecycleError('Delete or cancel active owned clubs before deleting the account.', 'ACTIVE_OWNED_CLUB_BLOCKS_ACCOUNT_DELETION');
  }

  expectNoError(
    await client.from('user_profiles').update({
      account_state: 'pending_deletion',
      pending_deletion_at: now.toISOString()
    }).eq('user_id', user.id),
    'ACCOUNT_DELETION_REQUEST_FAILED',
    'Failed to request account deletion'
  );
  expectNoError(
    await client.from('devices').update({ revoked_at: now.toISOString() }).eq('user_id', user.id),
    'ACCOUNT_DEVICE_REVOKE_FAILED',
    'Failed to revoke account devices'
  );
  await writeLifecycleAuditEvent(client, 'deletion_requested', { metadata: { target: 'account' } });
};
