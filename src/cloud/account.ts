import type { DumalaSupabaseClient } from './client';
import type { Tables } from './database.types';
import { getSignedInUser } from './lifecycle';

export type CloudUserProfile = Tables<'user_profiles'>;
export type CloudClub = Tables<'clubs'>;
export type CloudClubMembership = Tables<'club_memberships'>;
export type CloudDevice = Tables<'devices'>;

export interface AccountBootstrapInput {
  clubName: string;
  deviceId: string;
  deviceLabel?: string;
  appVersion: string;
  locale?: string;
  timezone?: string;
  displayName?: string;
  now?: Date;
}

export interface AccountBootstrapResult {
  profile: CloudUserProfile;
  club: CloudClub;
  membership: CloudClubMembership;
  device: CloudDevice;
}

export class CloudAccountError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'CloudAccountError';
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
  if (result.error) throw new CloudAccountError(`${message}: ${getErrorMessage(result.error)}`, code, result.error);
  return result.data;
};

const requiredText = (value: string, code: string, label: string) => {
  const trimmed = value.trim();
  if (!trimmed) throw new CloudAccountError(`${label} is required.`, code);
  return trimmed;
};

const readOwnedClub = async (client: DumalaSupabaseClient, userId: string): Promise<CloudClub | null> =>
  expectNoError(
    await client
      .from('clubs')
      .select('*')
      .eq('owner_user_id', userId)
      .eq('club_state', 'active')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    'OWNER_CLUB_READ_FAILED',
    'Failed to read owner club'
  );

const readUserProfile = async (client: DumalaSupabaseClient, userId: string): Promise<CloudUserProfile | null> =>
  expectNoError(
    await client
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),
    'PROFILE_READ_FAILED',
    'Failed to read account profile'
  );

const createUserProfile = async (
  client: DumalaSupabaseClient,
  userId: string,
  email: string | undefined,
  input: AccountBootstrapInput
): Promise<CloudUserProfile> =>
  expectNoError(
    await client
      .from('user_profiles')
      .insert({
        user_id: userId,
        display_name: input.displayName ?? email ?? null,
        locale: input.locale ?? 'en-PH',
        timezone: input.timezone ?? 'Asia/Manila',
        account_state: 'active'
      })
      .select('*')
      .single(),
    'PROFILE_BOOTSTRAP_FAILED',
    'Failed to create account profile'
  );

const createOwnerClub = async (
  client: DumalaSupabaseClient,
  userId: string,
  input: AccountBootstrapInput
): Promise<CloudClub> =>
  expectNoError(
    await client
      .from('clubs')
      .insert({
        name: requiredText(input.clubName, 'CLUB_NAME_REQUIRED', 'Club name'),
        owner_user_id: userId,
        timezone: input.timezone ?? 'Asia/Manila'
      })
      .select('*')
      .single(),
    'OWNER_CLUB_CREATE_FAILED',
    'Failed to create owner club'
  );

export const ensureAccountBootstrap = async (
  client: DumalaSupabaseClient,
  input: AccountBootstrapInput
): Promise<AccountBootstrapResult> => {
  const user = await getSignedInUser(client);
  const now = input.now ?? new Date();

  const profile = await readUserProfile(client, user.id) ?? await createUserProfile(client, user.id, user.email, input);

  const club = await readOwnedClub(client, user.id) ?? await createOwnerClub(client, user.id, input);

  const membership = expectNoError(
    await client
      .from('club_memberships')
      .upsert({
        club_id: club.id,
        user_id: user.id,
        role: 'owner',
        membership_state: 'active',
        accepted_at: now.toISOString()
      }, { onConflict: 'club_id,user_id' })
      .select('*')
      .single(),
    'OWNER_MEMBERSHIP_BOOTSTRAP_FAILED',
    'Failed to ensure owner membership'
  );

  const device = expectNoError(
    await client
      .from('devices')
      .upsert({
        id: requiredText(input.deviceId, 'DEVICE_ID_REQUIRED', 'Device ID'),
        user_id: user.id,
        label: input.deviceLabel,
        app_version: input.appVersion,
        last_seen_at: now.toISOString()
      })
      .select('*')
      .single(),
    'DEVICE_BOOTSTRAP_FAILED',
    'Failed to ensure device'
  );

  return { profile, club, membership, device };
};
