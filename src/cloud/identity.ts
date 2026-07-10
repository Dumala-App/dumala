import type { SupabaseClient } from '@supabase/supabase-js';
import type { DumalaSupabaseClient } from './client';

// Phase 6 - identity and authorization. Each account belongs to exactly one app,
// decided by its registration door and stored as a persona. The authorized
// destination is resolved server-side; League features are gated on an
// entitlement grant (never a billing plan code).

export type AccountPersona = 'coach' | 'player' | 'league';
export type AppRoute = '/app' | '/player' | '/league';
export type LeagueAccessRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'provisioned'
  | 'withdrawn';

export const LEAGUE_PILOT_ENTITLEMENT = 'league_pilot';

export interface AppDestination {
  persona: AccountPersona;
  onboardingStatus: string;
  entitlements: string[];
  leagueEntitled: boolean;
  authorizedRoute: AppRoute;
}

export interface LeagueAccessRequestInput {
  contactName: string;
  contactEmail: string;
  organization?: string | null;
  leagueName?: string | null;
  location?: string | null;
  message?: string | null;
}

export interface LeagueAccessRequestRecord {
  id: string;
  user_id: string | null;
  contact_name: string;
  contact_email: string;
  organization: string | null;
  league_name: string | null;
  location: string | null;
  message: string | null;
  status: LeagueAccessRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  provisioned_user_id: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const asUntypedClient = (client: DumalaSupabaseClient): SupabaseClient => client as unknown as SupabaseClient;

const getErrorMessage = (error: unknown) => {
  if (!error) return 'Unknown Supabase error.';
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message);
  return String(error);
};

export class CloudIdentityError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'CloudIdentityError';
  }
}

const expectNoError = <Data>(
  result: { data: Data; error: unknown },
  code: string,
  message: string
): Data => {
  if (result.error) throw new CloudIdentityError(`${message}: ${getErrorMessage(result.error)}`, code, result.error);
  return result.data;
};

// --- Pure helpers (unit-testable without a client) ---------------------------

/** Maps a persona to the single app route it is allowed to reach. */
export const authorizedRouteFor = (persona: AccountPersona): AppRoute => {
  switch (persona) {
    case 'player':
      return '/player';
    case 'league':
      return '/league';
    default:
      return '/app';
  }
};

/** League dashboards require the pilot entitlement, not just the persona. */
export const isLeagueEntitled = (entitlements: readonly string[]): boolean =>
  entitlements.includes(LEAGUE_PILOT_ENTITLEMENT);

const routeGuards: Record<AppRoute, AccountPersona> = {
  '/app': 'coach',
  '/player': 'player',
  '/league': 'league'
};

/** True when a persona is allowed to view the given app route. */
export const canPersonaAccessRoute = (persona: AccountPersona, route: AppRoute): boolean =>
  routeGuards[route] === persona;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

export const parseAppDestination = (raw: unknown): AppDestination => {
  const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const persona: AccountPersona = record.persona === 'player' || record.persona === 'league'
    ? record.persona
    : 'coach';
  const entitlements = asStringArray(record.entitlements);
  return {
    persona,
    onboardingStatus: typeof record.onboarding_status === 'string' ? record.onboarding_status : 'complete',
    entitlements,
    leagueEntitled: record.league_entitled === true || isLeagueEntitled(entitlements),
    authorizedRoute: typeof record.authorized_route === 'string'
      ? (record.authorized_route as AppRoute)
      : authorizedRouteFor(persona)
  };
};

// --- RPC wrappers ------------------------------------------------------------

/** Server-side destination resolution for the signed-in account. */
export const resolveAppDestination = async (client: DumalaSupabaseClient): Promise<AppDestination> => {
  const supabase = asUntypedClient(client);
  const data = expectNoError(
    await supabase.rpc('resolve_app_destination'),
    'DESTINATION_RESOLVE_FAILED',
    'Failed to resolve the authorized app'
  );
  return parseAppDestination(data);
};

/** Tags a brand-new, unaffiliated account as a Player (the Player door). */
export const bootstrapPlayerAccount = async (client: DumalaSupabaseClient): Promise<AccountPersona> => {
  const supabase = asUntypedClient(client);
  const data = expectNoError(
    await supabase.rpc('bootstrap_player_account'),
    'PLAYER_BOOTSTRAP_FAILED',
    'Failed to set up the player account'
  );
  return (typeof data === 'string' ? data : 'player') as AccountPersona;
};

/** Public waitlist submission for League Owner access. */
export const requestLeagueAccess = async (
  client: DumalaSupabaseClient,
  input: LeagueAccessRequestInput
): Promise<string> => {
  const supabase = asUntypedClient(client);
  const data = expectNoError(
    await supabase.rpc('request_league_access', {
      contact_name: input.contactName.trim(),
      contact_email: input.contactEmail.trim().toLowerCase(),
      organization: input.organization?.trim() || null,
      league_name: input.leagueName?.trim() || null,
      location: input.location?.trim() || null,
      message: input.message?.trim() || null
    }),
    'LEAGUE_ACCESS_REQUEST_FAILED',
    'Failed to submit the league access request'
  );
  return String(data);
};

// --- Admin operations --------------------------------------------------------

export const listLeagueAccessRequests = async (
  client: DumalaSupabaseClient,
  status?: LeagueAccessRequestStatus | null
): Promise<LeagueAccessRequestRecord[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase.rpc('list_league_access_requests_v1', { status_filter: status ?? null }),
    'LEAGUE_ACCESS_LIST_FAILED',
    'Failed to load league access requests'
  ) as LeagueAccessRequestRecord[] | null) ?? [];
};

export const provisionLeagueOwner = async (
  client: DumalaSupabaseClient,
  requestId: string
): Promise<void> => {
  const supabase = asUntypedClient(client);
  expectNoError(
    await supabase.rpc('admin_provision_league_owner', { request_id: requestId }),
    'LEAGUE_PROVISION_FAILED',
    'Failed to provision the league owner'
  );
};

export const reviewLeagueAccessRequest = async (
  client: DumalaSupabaseClient,
  requestId: string,
  status: LeagueAccessRequestStatus,
  adminNotes?: string | null
): Promise<void> => {
  const supabase = asUntypedClient(client);
  expectNoError(
    await supabase.rpc('admin_review_league_access', {
      request_id: requestId,
      new_status: status,
      admin_notes: adminNotes?.trim() || null
    }),
    'LEAGUE_ACCESS_REVIEW_FAILED',
    'Failed to update the league access request'
  );
};

export const setUserPersona = async (
  client: DumalaSupabaseClient,
  userId: string,
  persona: AccountPersona
): Promise<void> => {
  const supabase = asUntypedClient(client);
  expectNoError(
    await supabase.rpc('admin_set_user_persona', { target_user_id: userId, new_persona: persona }),
    'PERSONA_SET_FAILED',
    'Failed to change the account persona'
  );
};

export const grantEntitlement = async (
  client: DumalaSupabaseClient,
  userId: string,
  entitlement: string,
  expiresAt?: string | null,
  notes?: string | null
): Promise<void> => {
  const supabase = asUntypedClient(client);
  expectNoError(
    await supabase.rpc('admin_grant_entitlement', {
      target_user_id: userId,
      entitlement: entitlement.trim().toLowerCase(),
      expires_at: expiresAt ?? null,
      notes: notes?.trim() || null
    }),
    'ENTITLEMENT_GRANT_FAILED',
    'Failed to grant the entitlement'
  );
};

export const revokeEntitlement = async (
  client: DumalaSupabaseClient,
  userId: string,
  entitlement: string
): Promise<void> => {
  const supabase = asUntypedClient(client);
  expectNoError(
    await supabase.rpc('admin_revoke_entitlement', {
      target_user_id: userId,
      entitlement: entitlement.trim().toLowerCase()
    }),
    'ENTITLEMENT_REVOKE_FAILED',
    'Failed to revoke the entitlement'
  );
};
