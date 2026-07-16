import type { SupabaseClient } from '@supabase/supabase-js';
import type { DumalaSupabaseClient } from './client';

// Phase 6 - League Owner app foundation. A league profile, seasons with a
// controlled lifecycle, and venues. Owner-scoped; League-persona + league_pilot
// entitlement is required to own a league (enforced by RLS server-side).

export type LeagueSeasonStatus =
  | 'draft'
  | 'registration_open'
  | 'active'
  | 'completed'
  | 'archived';

export interface League {
  id: string;
  owner_user_id: string;
  name: string;
  short_name: string | null;
  logo_color: string;
  contact_email: string | null;
  location: string | null;
  description: string | null;
  timezone: string;
  currency: string;
  state: 'active' | 'archived';
  coach_seat_limit: number;
  coach_invite_code: string;
  created_at: string;
  updated_at: string;
}

export interface LeagueInput {
  name: string;
  shortName?: string | null;
  logoColor?: string | null;
  contactEmail?: string | null;
  location?: string | null;
  description?: string | null;
}

export interface LeagueSeason {
  id: string;
  league_id: string;
  name: string;
  year: number | null;
  status: LeagueSeasonStatus;
  starts_on: string | null;
  ends_on: string | null;
  registration_opens_on: string | null;
  registration_closes_on: string | null;
  roster_deadline: string | null;
  transfer_window_opens_on: string | null;
  transfer_window_closes_on: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeagueSeasonInput {
  name: string;
  year?: number | null;
  startsOn?: string | null;
  endsOn?: string | null;
  registrationOpensOn?: string | null;
  registrationClosesOn?: string | null;
  rosterDeadline?: string | null;
  transferWindowOpensOn?: string | null;
  transferWindowClosesOn?: string | null;
  notes?: string | null;
}

export interface LeagueVenue {
  id: string;
  league_id: string;
  name: string;
  address: string | null;
  capacity: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeagueVenueInput {
  name: string;
  address?: string | null;
  capacity?: number | null;
  notes?: string | null;
}

const asUntypedClient = (client: DumalaSupabaseClient): SupabaseClient => client as unknown as SupabaseClient;

const getErrorMessage = (error: unknown) => {
  if (!error) return 'Unknown Supabase error.';
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message);
  return String(error);
};

export class CloudLeagueError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'CloudLeagueError';
  }
}

const expectNoError = <Data>(
  result: { data: Data; error: unknown },
  code: string,
  message: string
): Data => {
  if (result.error) throw new CloudLeagueError(`${message}: ${getErrorMessage(result.error)}`, code, result.error);
  return result.data;
};

// --- Pure helper (unit-testable) ---------------------------------------------

const SEASON_FLOW: Record<LeagueSeasonStatus, LeagueSeasonStatus | null> = {
  draft: 'registration_open',
  registration_open: 'active',
  active: 'completed',
  completed: 'archived',
  archived: null
};

export const SEASON_STATUS_LABELS: Record<LeagueSeasonStatus, string> = {
  draft: 'Draft',
  registration_open: 'Registration open',
  active: 'Active',
  completed: 'Completed',
  archived: 'Archived'
};

/** The single status a season may advance to next (or [] when terminal). */
export const nextSeasonStatuses = (status: LeagueSeasonStatus): LeagueSeasonStatus[] => {
  const next = SEASON_FLOW[status];
  return next ? [next] : [];
};

// --- League profile ----------------------------------------------------------

const leagueRow = (input: LeagueInput) => ({
  name: input.name.trim(),
  short_name: input.shortName?.trim() || null,
  logo_color: input.logoColor?.trim() || '#f97316',
  contact_email: input.contactEmail?.trim() || null,
  location: input.location?.trim() || null,
  description: input.description?.trim() || null
});

export const listLeagues = async (client: DumalaSupabaseClient): Promise<League[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase.from('leagues').select('*').order('created_at', { ascending: true }),
    'LEAGUES_READ_FAILED',
    'Failed to load your leagues'
  ) as League[] | null) ?? [];
};

export const createLeague = async (
  client: DumalaSupabaseClient,
  ownerUserId: string,
  input: LeagueInput
): Promise<League> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.from('leagues').insert({ owner_user_id: ownerUserId, ...leagueRow(input) }).select('*').single(),
    'LEAGUE_CREATE_FAILED',
    'Failed to create the league'
  ) as League;
};

export const updateLeague = async (
  client: DumalaSupabaseClient,
  leagueId: string,
  input: LeagueInput
): Promise<League> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.from('leagues').update(leagueRow(input)).eq('id', leagueId).select('*').single(),
    'LEAGUE_UPDATE_FAILED',
    'Failed to update the league'
  ) as League;
};

// --- Seasons -----------------------------------------------------------------

const seasonRow = (input: LeagueSeasonInput) => ({
  name: input.name.trim(),
  year: input.year ?? null,
  starts_on: input.startsOn || null,
  ends_on: input.endsOn || null,
  registration_opens_on: input.registrationOpensOn || null,
  registration_closes_on: input.registrationClosesOn || null,
  roster_deadline: input.rosterDeadline || null,
  transfer_window_opens_on: input.transferWindowOpensOn || null,
  transfer_window_closes_on: input.transferWindowClosesOn || null,
  notes: input.notes?.trim() || null
});

export const listSeasons = async (client: DumalaSupabaseClient, leagueId: string): Promise<LeagueSeason[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase.from('league_seasons').select('*').eq('league_id', leagueId).order('created_at', { ascending: false }),
    'SEASONS_READ_FAILED',
    'Failed to load seasons'
  ) as LeagueSeason[] | null) ?? [];
};

export const createSeason = async (
  client: DumalaSupabaseClient,
  leagueId: string,
  input: LeagueSeasonInput
): Promise<LeagueSeason> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.from('league_seasons').insert({ league_id: leagueId, ...seasonRow(input) }).select('*').single(),
    'SEASON_CREATE_FAILED',
    'Failed to create the season'
  ) as LeagueSeason;
};

export const updateSeason = async (
  client: DumalaSupabaseClient,
  seasonId: string,
  input: LeagueSeasonInput
): Promise<LeagueSeason> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.from('league_seasons').update(seasonRow(input)).eq('id', seasonId).select('*').single(),
    'SEASON_UPDATE_FAILED',
    'Failed to update the season'
  ) as LeagueSeason;
};

export const advanceSeasonStatus = async (
  client: DumalaSupabaseClient,
  seasonId: string,
  nextStatus: LeagueSeasonStatus
): Promise<LeagueSeasonStatus> => {
  const supabase = asUntypedClient(client);
  const data = expectNoError(
    await supabase.rpc('advance_season_status', { season_id: seasonId, next_status: nextStatus }),
    'SEASON_ADVANCE_FAILED',
    'Failed to update the season status'
  );
  return (typeof data === 'string' ? data : nextStatus) as LeagueSeasonStatus;
};

// --- Venues ------------------------------------------------------------------

const venueRow = (input: LeagueVenueInput) => ({
  name: input.name.trim(),
  address: input.address?.trim() || null,
  capacity: input.capacity ?? null,
  notes: input.notes?.trim() || null
});

export const listVenues = async (client: DumalaSupabaseClient, leagueId: string): Promise<LeagueVenue[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase.from('league_venues').select('*').eq('league_id', leagueId).order('name', { ascending: true }),
    'VENUES_READ_FAILED',
    'Failed to load venues'
  ) as LeagueVenue[] | null) ?? [];
};

export const createVenue = async (
  client: DumalaSupabaseClient,
  leagueId: string,
  input: LeagueVenueInput
): Promise<LeagueVenue> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.from('league_venues').insert({ league_id: leagueId, ...venueRow(input) }).select('*').single(),
    'VENUE_CREATE_FAILED',
    'Failed to create the venue'
  ) as LeagueVenue;
};

export const updateVenue = async (
  client: DumalaSupabaseClient,
  venueId: string,
  input: LeagueVenueInput
): Promise<LeagueVenue> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.from('league_venues').update(venueRow(input)).eq('id', venueId).select('*').single(),
    'VENUE_UPDATE_FAILED',
    'Failed to update the venue'
  ) as LeagueVenue;
};

export const deleteVenue = async (client: DumalaSupabaseClient, venueId: string): Promise<void> => {
  const supabase = asUntypedClient(client);
  expectNoError(
    await supabase.from('league_venues').delete().eq('id', venueId),
    'VENUE_DELETE_FAILED',
    'Failed to remove the venue'
  );
};

// --- Events + registration ---------------------------------------------------
// Independent events (tournaments/competitions) inside a season, a public
// registration link, coach applications submitted without an account, and owner
// review (approve/reject/waitlist) with team-cap enforcement.

export type LeagueEventFormat = 'round_robin' | 'single_elimination' | 'group_knockout';
export type LeagueEventStatus = 'draft' | 'registration_open' | 'active' | 'completed';
export type EventRegistrationStatus =
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'waitlisted'
  | 'withdrawn';

export interface LeagueEvent {
  id: string;
  league_id: string;
  season_id: string;
  name: string;
  format: LeagueEventFormat;
  category: string | null;
  status: LeagueEventStatus;
  team_cap: number | null;
  starts_on: string | null;
  ends_on: string | null;
  registration_code: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeagueEventInput {
  seasonId: string;
  name: string;
  format?: LeagueEventFormat | null;
  category?: string | null;
  teamCap?: number | null;
  startsOn?: string | null;
  endsOn?: string | null;
  notes?: string | null;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  league_id: string;
  club_name: string;
  team_name: string | null;
  category: string | null;
  contact_name: string;
  contact_email: string;
  roster_size: number | null;
  message: string | null;
  status: EventRegistrationStatus;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRegistrationInput {
  code: string;
  clubName: string;
  teamName?: string | null;
  category?: string | null;
  contactName: string;
  contactEmail: string;
  rosterSize?: number | null;
  message?: string | null;
}

/** Minimal event info returned by the public `lookup_event_registration` RPC. */
export interface EventRegistrationLookup {
  found: boolean;
  open?: boolean;
  eventId?: string;
  name?: string;
  category?: string | null;
  format?: LeagueEventFormat;
  teamCap?: number | null;
  spotsRemaining?: number | null;
  status?: LeagueEventStatus;
}

// --- Pure helpers (unit-testable) --------------------------------------------

const EVENT_FLOW: Record<LeagueEventStatus, LeagueEventStatus | null> = {
  draft: 'registration_open',
  registration_open: 'active',
  active: 'completed',
  completed: null
};

export const EVENT_STATUS_LABELS: Record<LeagueEventStatus, string> = {
  draft: 'Draft',
  registration_open: 'Registration open',
  active: 'Active',
  completed: 'Completed'
};

export const EVENT_FORMAT_LABELS: Record<LeagueEventFormat, string> = {
  round_robin: 'Round robin',
  single_elimination: 'Single elimination',
  group_knockout: 'Group + knockout'
};

export const REGISTRATION_STATUS_LABELS: Record<EventRegistrationStatus, string> = {
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  waitlisted: 'Waitlisted',
  withdrawn: 'Withdrawn'
};

/** The single status an event may advance to next (or [] when terminal). */
export const nextEventStatuses = (status: LeagueEventStatus): LeagueEventStatus[] => {
  const next = EVENT_FLOW[status];
  return next ? [next] : [];
};

/** Spots left against a team cap (null when the event is uncapped). */
export const spotsRemaining = (cap: number | null | undefined, approvedCount: number): number | null => {
  if (cap === null || cap === undefined) return null;
  return Math.max(0, cap - approvedCount);
};

// --- Owner: events -----------------------------------------------------------

const eventRow = (input: LeagueEventInput) => ({
  season_id: input.seasonId,
  name: input.name.trim(),
  format: input.format ?? 'round_robin',
  category: input.category?.trim() || null,
  team_cap: input.teamCap ?? null,
  starts_on: input.startsOn || null,
  ends_on: input.endsOn || null,
  notes: input.notes?.trim() || null
});

export const listEvents = async (client: DumalaSupabaseClient, leagueId: string): Promise<LeagueEvent[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase.from('league_events').select('*').eq('league_id', leagueId).order('created_at', { ascending: false }),
    'EVENTS_READ_FAILED',
    'Failed to load events'
  ) as LeagueEvent[] | null) ?? [];
};

export const createEvent = async (
  client: DumalaSupabaseClient,
  leagueId: string,
  input: LeagueEventInput
): Promise<LeagueEvent> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.from('league_events').insert({ league_id: leagueId, ...eventRow(input) }).select('*').single(),
    'EVENT_CREATE_FAILED',
    'Failed to create the event'
  ) as LeagueEvent;
};

export const updateEvent = async (
  client: DumalaSupabaseClient,
  eventId: string,
  input: LeagueEventInput
): Promise<LeagueEvent> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.from('league_events').update(eventRow(input)).eq('id', eventId).select('*').single(),
    'EVENT_UPDATE_FAILED',
    'Failed to update the event'
  ) as LeagueEvent;
};

export const advanceEventStatus = async (
  client: DumalaSupabaseClient,
  eventId: string,
  nextStatus: LeagueEventStatus
): Promise<LeagueEventStatus> => {
  const supabase = asUntypedClient(client);
  const data = expectNoError(
    await supabase.rpc('advance_event_status', { event_id: eventId, next_status: nextStatus }),
    'EVENT_ADVANCE_FAILED',
    'Failed to update the event status'
  );
  return (typeof data === 'string' ? data : nextStatus) as LeagueEventStatus;
};

// --- Owner: registrations ----------------------------------------------------

export const listRegistrations = async (
  client: DumalaSupabaseClient,
  eventId: string
): Promise<EventRegistration[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase.from('event_registrations').select('*').eq('event_id', eventId).order('created_at', { ascending: true }),
    'REGISTRATIONS_READ_FAILED',
    'Failed to load registrations'
  ) as EventRegistration[] | null) ?? [];
};

export const reviewRegistration = async (
  client: DumalaSupabaseClient,
  registrationId: string,
  nextStatus: EventRegistrationStatus,
  note?: string | null
): Promise<EventRegistrationStatus> => {
  const supabase = asUntypedClient(client);
  expectNoError(
    await supabase.rpc('review_event_registration', {
      registration_id: registrationId,
      next_status: nextStatus,
      note: note?.trim() || null
    }),
    'REGISTRATION_REVIEW_FAILED',
    'Failed to update the registration'
  );
  return nextStatus;
};

// --- Public: apply via registration code -------------------------------------

export const lookupEventRegistration = async (
  client: DumalaSupabaseClient,
  code: string
): Promise<EventRegistrationLookup> => {
  const supabase = asUntypedClient(client);
  const data = expectNoError(
    await supabase.rpc('lookup_event_registration', { code: code.trim().toUpperCase() }),
    'EVENT_LOOKUP_FAILED',
    'Failed to look up the event'
  );
  return (data as EventRegistrationLookup | null) ?? { found: false };
};

export const submitEventRegistration = async (
  client: DumalaSupabaseClient,
  input: EventRegistrationInput
): Promise<string> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.rpc('submit_event_registration', {
      code: input.code.trim().toUpperCase(),
      club_name: input.clubName.trim(),
      team_name: input.teamName?.trim() || null,
      category: input.category?.trim() || null,
      contact_name: input.contactName.trim(),
      contact_email: input.contactEmail.trim(),
      roster_size: input.rosterSize ?? null,
      message: input.message?.trim() || null
    }),
    'REGISTRATION_SUBMIT_FAILED',
    'Failed to submit your registration'
  ) as string;
};

// --- Tournament engine: teams, fixtures, results -----------------------------
// A round-robin backbone. Standings are derived from results by a pure helper
// (computeStandings) rather than stored, so there is nothing to keep in sync.

export type EventFixtureStatus = 'scheduled' | 'completed' | 'cancelled';

export interface EventTeam {
  id: string;
  event_id: string;
  league_id: string;
  registration_id: string | null;
  name: string;
  seed: number | null;
  created_at: string;
  updated_at: string;
}

export interface EventFixture {
  id: string;
  event_id: string;
  league_id: string;
  round: number;
  sequence: number | null;
  // Nullable for knockout brackets: a future-round fixture has no teams until
  // winners advance into it. Round-robin fixtures always have both.
  home_team_id: string | null;
  away_team_id: string | null;
  status: EventFixtureStatus;
  home_score: number | null;
  away_score: number | null;
  kickoff_at: string | null;
  venue_id: string | null;
  home_checked_in: boolean;
  away_checked_in: boolean;
  official_name: string | null;
  // group_knockout only: 'group' or 'knockout' (null for round_robin / single_elim).
  stage: 'group' | 'knockout' | null;
  group_label: string | null;
  created_at: string;
  updated_at: string;
}

export interface StandingRow {
  teamId: string;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

/** A single generated pairing (team ids, or null for a bye). */
export interface FixturePairing {
  round: number;
  sequence: number;
  homeTeamId: string;
  awayTeamId: string;
}

// --- Pure helpers (unit-testable) --------------------------------------------

/**
 * Round-robin schedule (circle method): every team plays every other once.
 * Odd counts get a bye each round (dropped from the output). Deterministic.
 */
export const roundRobinRounds = (teamIds: string[]): FixturePairing[] => {
  const ids = [...teamIds];
  if (ids.length < 2) return [];
  const bye = '__bye__';
  if (ids.length % 2 === 1) ids.push(bye);

  const n = ids.length;
  const rounds = n - 1;
  const half = n / 2;
  const rotating = ids.slice(1);
  const pairings: FixturePairing[] = [];

  for (let round = 0; round < rounds; round += 1) {
    const roster = [ids[0], ...rotating];
    let sequence = 0;
    for (let i = 0; i < half; i += 1) {
      const home = roster[i];
      const away = roster[n - 1 - i];
      if (home !== bye && away !== bye) {
        // Alternate home/away by round so it isn't always the same side.
        const flip = round % 2 === 1;
        pairings.push({
          round: round + 1,
          sequence: sequence + 1,
          homeTeamId: flip ? away : home,
          awayTeamId: flip ? home : away
        });
        sequence += 1;
      }
    }
    // Rotate all but the first element clockwise.
    rotating.unshift(rotating.pop() as string);
  }
  return pairings;
};

/** League table from completed fixtures. 3 pts win / 1 draw; sorted by pts, GD, GF, name. */
export const computeStandings = (teams: EventTeam[], fixtures: EventFixture[]): StandingRow[] => {
  const table = new Map<string, StandingRow>();
  for (const team of teams) {
    table.set(team.id, {
      teamId: team.id, name: team.name, played: 0, won: 0, drawn: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
    });
  }

  for (const fixture of fixtures) {
    if (fixture.status !== 'completed' || fixture.home_score === null || fixture.away_score === null) continue;
    const home = table.get(fixture.home_team_id);
    const away = table.get(fixture.away_team_id);
    if (!home || !away) continue;
    home.played += 1; away.played += 1;
    home.goalsFor += fixture.home_score; home.goalsAgainst += fixture.away_score;
    away.goalsFor += fixture.away_score; away.goalsAgainst += fixture.home_score;
    if (fixture.home_score > fixture.away_score) {
      home.won += 1; home.points += 3; away.lost += 1;
    } else if (fixture.home_score < fixture.away_score) {
      away.won += 1; away.points += 3; home.lost += 1;
    } else {
      home.drawn += 1; away.drawn += 1; home.points += 1; away.points += 1;
    }
  }

  const rows = [...table.values()];
  for (const row of rows) row.goalDifference = row.goalsFor - row.goalsAgainst;
  rows.sort((a, b) =>
    b.points - a.points ||
    b.goalDifference - a.goalDifference ||
    b.goalsFor - a.goalsFor ||
    a.name.localeCompare(b.name));
  return rows;
};

// --- Knockout bracket (single elimination) -----------------------------------
// A bracket is stored as ordinary fixtures: round 1 holds the opening matchups
// (byes pre-advanced), later rounds start with empty team slots. Winners feed
// forward: fixture (round r, sequence s) advances into (r+1, ceil(s/2)) — the
// home slot when s is odd, the away slot when s is even.

export interface BracketFixtureSpec {
  round: number;
  sequence: number;
  homeTeamId: string | null;
  awayTeamId: string | null;
}

/** Smallest power of two >= n (>= 1). */
export const nextPowerOfTwo = (n: number): number => {
  let p = 1;
  while (p < n) p *= 2;
  return p;
};

/**
 * Standard single-elimination seed slot order for a bracket of `size` (a power
 * of two). Pairs the top seed with the bottom, spreading seeds so they only meet
 * in later rounds — e.g. size 4 → [1,4,2,3], size 8 → [1,8,4,5,2,7,3,6].
 */
export const seedPositions = (size: number): number[] => {
  let seeds = [1, 2];
  while (seeds.length < size) {
    const round = seeds.length * 2;
    const next: number[] = [];
    for (const s of seeds) {
      next.push(s);
      next.push(round + 1 - s);
    }
    seeds = next;
  }
  return seeds;
};

/**
 * Build a single-elimination bracket for the given (seed-ordered) team ids.
 * Odd fields get byes: a team drawn against a bye is pre-advanced into round 2
 * and no round-1 fixture is created for it. Later-round fixtures start empty and
 * fill in as winners advance. Returns fixture specs across every round.
 */
export const singleEliminationBracket = (teamIds: string[]): BracketFixtureSpec[] => {
  const n = teamIds.length;
  if (n < 2) return [];
  const size = nextPowerOfTwo(n);
  const totalRounds = Math.round(Math.log2(size));
  const positions = seedPositions(size);
  const teamAt = (pos: number): string | null => (pos <= n ? teamIds[pos - 1] : null);

  const specs: BracketFixtureSpec[] = [];
  // Round-2 slots pre-filled by a bye winner: sequence -> { home?, away? }.
  const prefill = new Map<number, { home?: string; away?: string }>();

  const round1Slots = size / 2;
  for (let i = 0; i < round1Slots; i += 1) {
    const seq = i + 1;
    const a = teamAt(positions[i * 2]);
    const b = teamAt(positions[i * 2 + 1]);
    if (a !== null && b !== null) {
      specs.push({ round: 1, sequence: seq, homeTeamId: a, awayTeamId: b });
    } else {
      const advancer = a ?? b; // the real team (the other side is a bye)
      if (advancer !== null) {
        const parentSeq = Math.ceil(seq / 2);
        const entry = prefill.get(parentSeq) ?? {};
        if (seq % 2 === 1) entry.home = advancer; else entry.away = advancer;
        prefill.set(parentSeq, entry);
      }
    }
  }

  for (let round = 2; round <= totalRounds; round += 1) {
    const slots = size / 2 ** round;
    for (let seq = 1; seq <= slots; seq += 1) {
      const pre = round === 2 ? prefill.get(seq) : undefined;
      specs.push({ round, sequence: seq, homeTeamId: pre?.home ?? null, awayTeamId: pre?.away ?? null });
    }
  }

  return specs;
};

/** The winning team id of a fixture, or null when it isn't decided (unplayed or drawn). */
export const bracketWinnerId = (fixture: EventFixture): string | null => {
  if (fixture.status !== 'completed' || fixture.home_score === null || fixture.away_score === null) return null;
  if (fixture.home_score === fixture.away_score) return null;
  return fixture.home_score > fixture.away_score ? fixture.home_team_id : fixture.away_team_id;
};

/** Human label for a knockout round given the total number of rounds. */
export const bracketRoundName = (round: number, totalRounds: number): string => {
  const fromFinal = totalRounds - round;
  if (fromFinal <= 0) return 'Final';
  if (fromFinal === 1) return 'Semi-finals';
  if (fromFinal === 2) return 'Quarter-finals';
  return `Round of ${2 ** (fromFinal + 1)}`;
};

// --- Group stage (group -> knockout) -----------------------------------------
// Teams split into groups that each play a round robin; the top finishers then
// advance into a single-elimination bracket. Group membership is derived from
// the group fixtures, so only fixtures carry the stage/group data.

export const GROUP_LABELS = 'ABCDEFGHIJKLMNOP'.split('');

export interface GroupDraw {
  label: string;
  teamIds: string[];
}

export interface GroupFixtureSpec {
  groupLabel: string;
  round: number;
  sequence: number;
  homeTeamId: string;
  awayTeamId: string;
}

export interface GroupStanding {
  label: string;
  rows: StandingRow[];
}

/** Distribute (seed-ordered) teams across `groupCount` groups, round-robin style. */
export const drawGroups = (teamIds: string[], groupCount: number): GroupDraw[] => {
  const maxGroups = Math.max(1, Math.floor(teamIds.length / 2));
  const count = Math.max(1, Math.min(Math.round(groupCount), maxGroups));
  const groups: GroupDraw[] = Array.from({ length: count }, (_, i) => ({ label: GROUP_LABELS[i], teamIds: [] }));
  teamIds.forEach((id, i) => { groups[i % count].teamIds.push(id); });
  return groups;
};

/** Round-robin fixture specs for every group. */
export const groupStageFixtureSpecs = (groups: GroupDraw[]): GroupFixtureSpec[] => {
  const specs: GroupFixtureSpec[] = [];
  for (const group of groups) {
    for (const pairing of roundRobinRounds(group.teamIds)) {
      specs.push({
        groupLabel: group.label,
        round: pairing.round,
        sequence: pairing.sequence,
        homeTeamId: pairing.homeTeamId,
        awayTeamId: pairing.awayTeamId
      });
    }
  }
  return specs;
};

/** Per-group standings derived from the group fixtures (teams inferred from them). */
export const groupStageStandings = (teams: EventTeam[], groupFixtures: EventFixture[]): GroupStanding[] => {
  const byLabel = new Map<string, EventFixture[]>();
  for (const fixture of groupFixtures) {
    if (!fixture.group_label) continue;
    const list = byLabel.get(fixture.group_label);
    if (list) list.push(fixture); else byLabel.set(fixture.group_label, [fixture]);
  }
  const teamById = new Map(teams.map(t => [t.id, t]));
  return [...byLabel.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, fixtures]) => {
      const ids = new Set<string>();
      for (const f of fixtures) {
        if (f.home_team_id) ids.add(f.home_team_id);
        if (f.away_team_id) ids.add(f.away_team_id);
      }
      const groupTeams = [...ids].map(id => teamById.get(id)).filter((t): t is EventTeam => Boolean(t));
      return { label, rows: computeStandings(groupTeams, fixtures) };
    });
};

/**
 * The qualifying team ids, ordered for bracket seeding: every group's winner
 * first, then every runner-up, and so on. Fed to singleEliminationBracket this
 * cross-pairs group winners against other groups' runners-up.
 */
export const qualifiers = (standings: GroupStanding[], advancePerGroup: number): string[] => {
  const out: string[] = [];
  for (let pos = 0; pos < advancePerGroup; pos += 1) {
    for (const group of standings) {
      const row = group.rows[pos];
      if (row) out.push(row.teamId);
    }
  }
  return out;
};

// --- Owner: teams ------------------------------------------------------------

export const listEventTeams = async (client: DumalaSupabaseClient, eventId: string): Promise<EventTeam[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase.from('event_teams').select('*').eq('event_id', eventId).order('created_at', { ascending: true }),
    'TEAMS_READ_FAILED',
    'Failed to load teams'
  ) as EventTeam[] | null) ?? [];
};

export const addEventTeam = async (
  client: DumalaSupabaseClient,
  leagueId: string,
  eventId: string,
  input: { name: string; seed?: number | null; registrationId?: string | null }
): Promise<EventTeam> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.from('event_teams').insert({
      league_id: leagueId, event_id: eventId, name: input.name.trim(),
      seed: input.seed ?? null, registration_id: input.registrationId ?? null
    }).select('*').single(),
    'TEAM_CREATE_FAILED',
    'Failed to add the team'
  ) as EventTeam;
};

export const deleteEventTeam = async (client: DumalaSupabaseClient, teamId: string): Promise<void> => {
  const supabase = asUntypedClient(client);
  expectNoError(
    await supabase.from('event_teams').delete().eq('id', teamId),
    'TEAM_DELETE_FAILED',
    'Failed to remove the team'
  );
};

/** Add an event_team for every approved registration not already represented. */
export const syncApprovedTeams = async (
  client: DumalaSupabaseClient,
  leagueId: string,
  eventId: string
): Promise<EventTeam[]> => {
  const supabase = asUntypedClient(client);
  const [approved, existing] = await Promise.all([
    listRegistrations(client, eventId),
    listEventTeams(client, eventId)
  ]);
  const linked = new Set(existing.map(t => t.registration_id).filter(Boolean) as string[]);
  const toAdd = approved
    .filter(r => r.status === 'approved' && !linked.has(r.id))
    .map(r => ({
      league_id: leagueId, event_id: eventId,
      name: r.team_name?.trim() || r.club_name.trim(), registration_id: r.id
    }));
  if (toAdd.length === 0) return existing;
  const inserted = expectNoError(
    await supabase.from('event_teams').insert(toAdd).select('*'),
    'TEAM_SYNC_FAILED',
    'Failed to add approved teams'
  ) as EventTeam[] | null;
  return [...existing, ...(inserted ?? [])];
};

// --- Owner: fixtures + results -----------------------------------------------

export const listFixtures = async (client: DumalaSupabaseClient, eventId: string): Promise<EventFixture[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase.from('event_fixtures').select('*').eq('event_id', eventId)
      .order('round', { ascending: true }).order('sequence', { ascending: true }),
    'FIXTURES_READ_FAILED',
    'Failed to load fixtures'
  ) as EventFixture[] | null) ?? [];
};

export const clearFixtures = async (client: DumalaSupabaseClient, eventId: string): Promise<void> => {
  const supabase = asUntypedClient(client);
  expectNoError(
    await supabase.from('event_fixtures').delete().eq('event_id', eventId),
    'FIXTURES_CLEAR_FAILED',
    'Failed to clear fixtures'
  );
};

/** Regenerate a round-robin schedule for the event's teams (clears existing first). */
export const generateFixtures = async (
  client: DumalaSupabaseClient,
  leagueId: string,
  eventId: string
): Promise<EventFixture[]> => {
  const supabase = asUntypedClient(client);
  const teams = await listEventTeams(client, eventId);
  if (teams.length < 2) {
    throw new CloudLeagueError('Add at least two teams before generating fixtures.', 'NOT_ENOUGH_TEAMS');
  }
  await clearFixtures(client, eventId);
  const rows = roundRobinRounds(teams.map(t => t.id)).map(p => ({
    league_id: leagueId, event_id: eventId, round: p.round, sequence: p.sequence,
    home_team_id: p.homeTeamId, away_team_id: p.awayTeamId
  }));
  const inserted = expectNoError(
    await supabase.from('event_fixtures').insert(rows).select('*')
      .order('round', { ascending: true }).order('sequence', { ascending: true }),
    'FIXTURES_GENERATE_FAILED',
    'Failed to generate fixtures'
  ) as EventFixture[] | null;
  return inserted ?? [];
};

/** Regenerate a single-elimination bracket for the event's teams (clears existing first). */
export const generateBracket = async (
  client: DumalaSupabaseClient,
  leagueId: string,
  eventId: string
): Promise<EventFixture[]> => {
  const supabase = asUntypedClient(client);
  const teams = await listEventTeams(client, eventId);
  if (teams.length < 2) {
    throw new CloudLeagueError('Add at least two teams before generating a bracket.', 'NOT_ENOUGH_TEAMS');
  }
  await clearFixtures(client, eventId);
  const ordered = teams.slice().sort((a, b) => (a.seed ?? 9999) - (b.seed ?? 9999));
  const rows = singleEliminationBracket(ordered.map(t => t.id)).map(spec => ({
    league_id: leagueId, event_id: eventId, round: spec.round, sequence: spec.sequence,
    home_team_id: spec.homeTeamId, away_team_id: spec.awayTeamId
  }));
  const inserted = expectNoError(
    await supabase.from('event_fixtures').insert(rows).select('*')
      .order('round', { ascending: true }).order('sequence', { ascending: true }),
    'BRACKET_GENERATE_FAILED',
    'Failed to generate the bracket'
  ) as EventFixture[] | null;
  return inserted ?? [];
};

/** Advance winners into later bracket rounds. Idempotent; returns slots updated. */
export const syncBracket = async (client: DumalaSupabaseClient, eventId: string): Promise<number> => {
  const supabase = asUntypedClient(client);
  const data = expectNoError(
    await supabase.rpc('sync_bracket', { target_event_id: eventId }),
    'BRACKET_SYNC_FAILED',
    'Failed to advance the bracket'
  );
  return typeof data === 'number' ? data : 0;
};

/** Draw the group stage: split teams into groups and generate their round robins. */
export const drawGroupStage = async (
  client: DumalaSupabaseClient,
  leagueId: string,
  eventId: string,
  groupCount: number
): Promise<EventFixture[]> => {
  const supabase = asUntypedClient(client);
  const teams = await listEventTeams(client, eventId);
  if (teams.length < 4) {
    throw new CloudLeagueError('Add at least four teams to draw groups.', 'NOT_ENOUGH_TEAMS');
  }
  await clearFixtures(client, eventId);
  const ordered = teams.slice().sort((a, b) => (a.seed ?? 9999) - (b.seed ?? 9999));
  const groups = drawGroups(ordered.map(t => t.id), groupCount);
  const rows = groupStageFixtureSpecs(groups).map(spec => ({
    league_id: leagueId, event_id: eventId, stage: 'group', group_label: spec.groupLabel,
    round: spec.round, sequence: spec.sequence, home_team_id: spec.homeTeamId, away_team_id: spec.awayTeamId
  }));
  const inserted = expectNoError(
    await supabase.from('event_fixtures').insert(rows).select('*')
      .order('group_label', { ascending: true }).order('round', { ascending: true }).order('sequence', { ascending: true }),
    'GROUP_DRAW_FAILED',
    'Failed to draw the group stage'
  ) as EventFixture[] | null;
  return inserted ?? [];
};

/** Seed a knockout bracket from the group standings once every group match is played. */
export const generateKnockoutFromGroups = async (
  client: DumalaSupabaseClient,
  leagueId: string,
  eventId: string,
  advancePerGroup: number
): Promise<EventFixture[]> => {
  const supabase = asUntypedClient(client);
  const [teams, fixtures] = await Promise.all([listEventTeams(client, eventId), listFixtures(client, eventId)]);
  const groupFixtures = fixtures.filter(f => f.stage === 'group');
  if (groupFixtures.length === 0) {
    throw new CloudLeagueError('Draw the group stage first.', 'NO_GROUP_STAGE');
  }
  if (groupFixtures.some(f => f.status !== 'completed')) {
    throw new CloudLeagueError('Finish every group match before generating the knockout.', 'GROUP_STAGE_INCOMPLETE');
  }
  const qualifierIds = qualifiers(groupStageStandings(teams, groupFixtures), advancePerGroup);
  if (qualifierIds.length < 2) {
    throw new CloudLeagueError('Not enough qualifiers to build a knockout.', 'NOT_ENOUGH_QUALIFIERS');
  }
  // Replace any previous knockout stage, keeping the group fixtures intact.
  expectNoError(
    await supabase.from('event_fixtures').delete().eq('event_id', eventId).eq('stage', 'knockout'),
    'KNOCKOUT_CLEAR_FAILED',
    'Failed to reset the knockout stage'
  );
  const rows = singleEliminationBracket(qualifierIds).map(spec => ({
    league_id: leagueId, event_id: eventId, stage: 'knockout', group_label: null,
    round: spec.round, sequence: spec.sequence, home_team_id: spec.homeTeamId, away_team_id: spec.awayTeamId
  }));
  const inserted = expectNoError(
    await supabase.from('event_fixtures').insert(rows).select('*')
      .order('round', { ascending: true }).order('sequence', { ascending: true }),
    'KNOCKOUT_GENERATE_FAILED',
    'Failed to generate the knockout bracket'
  ) as EventFixture[] | null;
  return inserted ?? [];
};

export const recordFixtureResult = async (
  client: DumalaSupabaseClient,
  fixtureId: string,
  homeScore: number,
  awayScore: number
): Promise<EventFixture> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.rpc('record_fixture_result', { fixture_id: fixtureId, home_score: homeScore, away_score: awayScore }),
    'FIXTURE_RESULT_FAILED',
    'Failed to record the result'
  ) as EventFixture;
};

// --- Statistics + awards -----------------------------------------------------
// Match stat events (goals/cards attributed to a team + named player) and event
// awards. Leaderboards + award suggestions are derived by pure helpers.

export type FixtureStatType = 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'own_goal';
export type AwardRecipientType = 'team' | 'player';

export interface FixtureStatEvent {
  id: string;
  fixture_id: string;
  event_id: string;
  league_id: string;
  team_id: string;
  player_name: string;
  stat_type: FixtureStatType;
  minute: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface FixtureStatInput {
  fixtureId: string;
  teamId: string;
  playerName: string;
  statType: FixtureStatType;
  minute?: number | null;
}

export interface EventAward {
  id: string;
  event_id: string;
  league_id: string;
  title: string;
  recipient_type: AwardRecipientType;
  team_id: string | null;
  player_name: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventAwardInput {
  title: string;
  recipientType: AwardRecipientType;
  teamId?: string | null;
  playerName?: string | null;
  note?: string | null;
}

export interface ScorerRow {
  teamId: string;
  playerName: string;
  goals: number;
  assists: number;
}

export interface DisciplineRow {
  teamId: string;
  playerName: string;
  yellow: number;
  red: number;
}

/** A team's suggested champion / a player's suggested top scorer, for award auto-fill. */
export interface AwardSuggestions {
  champion: { teamId: string; name: string } | null;
  topScorer: { teamId: string; playerName: string; goals: number } | null;
}

export const STAT_TYPE_LABELS: Record<FixtureStatType, string> = {
  goal: 'Goal',
  assist: 'Assist',
  yellow_card: 'Yellow card',
  red_card: 'Red card',
  own_goal: 'Own goal'
};

// --- Pure helpers (unit-testable) --------------------------------------------

const statKey = (teamId: string, playerName: string) => `${teamId}::${playerName}`;

/** Top scorers from stat events (goals count; assists tallied), sorted goals → assists → name. */
export const computeScorers = (statEvents: FixtureStatEvent[]): ScorerRow[] => {
  const table = new Map<string, ScorerRow>();
  const ensure = (teamId: string, playerName: string) => {
    const key = statKey(teamId, playerName);
    let row = table.get(key);
    if (!row) {
      row = { teamId, playerName, goals: 0, assists: 0 };
      table.set(key, row);
    }
    return row;
  };
  for (const e of statEvents) {
    if (e.stat_type === 'goal') ensure(e.team_id, e.player_name).goals += 1;
    else if (e.stat_type === 'assist') ensure(e.team_id, e.player_name).assists += 1;
  }
  return [...table.values()]
    .filter(r => r.goals > 0 || r.assists > 0)
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists || a.playerName.localeCompare(b.playerName));
};

/** Discipline table from card stat events, sorted red → yellow → name. */
export const computeDiscipline = (statEvents: FixtureStatEvent[]): DisciplineRow[] => {
  const table = new Map<string, DisciplineRow>();
  const ensure = (teamId: string, playerName: string) => {
    const key = statKey(teamId, playerName);
    let row = table.get(key);
    if (!row) {
      row = { teamId, playerName, yellow: 0, red: 0 };
      table.set(key, row);
    }
    return row;
  };
  for (const e of statEvents) {
    if (e.stat_type === 'yellow_card') ensure(e.team_id, e.player_name).yellow += 1;
    else if (e.stat_type === 'red_card') ensure(e.team_id, e.player_name).red += 1;
  }
  return [...table.values()]
    .sort((a, b) => b.red - a.red || b.yellow - a.yellow || a.playerName.localeCompare(b.playerName));
};

/** Suggest a champion (standings leader) and top scorer for award auto-fill. */
export const suggestAwards = (standings: StandingRow[], scorers: ScorerRow[]): AwardSuggestions => {
  const leader = standings.find(s => s.played > 0) ?? null;
  const scorer = scorers.length > 0 && scorers[0].goals > 0 ? scorers[0] : null;
  return {
    champion: leader ? { teamId: leader.teamId, name: leader.name } : null,
    topScorer: scorer ? { teamId: scorer.teamId, playerName: scorer.playerName, goals: scorer.goals } : null
  };
};

// --- Owner: stat events ------------------------------------------------------

export const listStatEvents = async (client: DumalaSupabaseClient, eventId: string): Promise<FixtureStatEvent[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase.from('fixture_stat_events').select('*').eq('event_id', eventId).order('created_at', { ascending: true }),
    'STAT_EVENTS_READ_FAILED',
    'Failed to load statistics'
  ) as FixtureStatEvent[] | null) ?? [];
};

export const addStatEvent = async (
  client: DumalaSupabaseClient,
  leagueId: string,
  eventId: string,
  input: FixtureStatInput
): Promise<FixtureStatEvent> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.from('fixture_stat_events').insert({
      league_id: leagueId, event_id: eventId, fixture_id: input.fixtureId, team_id: input.teamId,
      player_name: input.playerName.trim(), stat_type: input.statType, minute: input.minute ?? null
    }).select('*').single(),
    'STAT_EVENT_CREATE_FAILED',
    'Failed to record the statistic'
  ) as FixtureStatEvent;
};

export const deleteStatEvent = async (client: DumalaSupabaseClient, statEventId: string): Promise<void> => {
  const supabase = asUntypedClient(client);
  expectNoError(
    await supabase.from('fixture_stat_events').delete().eq('id', statEventId),
    'STAT_EVENT_DELETE_FAILED',
    'Failed to remove the statistic'
  );
};

// --- Owner: awards -----------------------------------------------------------

export const listAwards = async (client: DumalaSupabaseClient, eventId: string): Promise<EventAward[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase.from('event_awards').select('*').eq('event_id', eventId).order('created_at', { ascending: true }),
    'AWARDS_READ_FAILED',
    'Failed to load awards'
  ) as EventAward[] | null) ?? [];
};

export const addAward = async (
  client: DumalaSupabaseClient,
  leagueId: string,
  eventId: string,
  input: EventAwardInput
): Promise<EventAward> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.from('event_awards').insert({
      league_id: leagueId, event_id: eventId, title: input.title.trim(), recipient_type: input.recipientType,
      team_id: input.recipientType === 'team' ? input.teamId ?? null : null,
      player_name: input.recipientType === 'player' ? input.playerName?.trim() || null : null,
      note: input.note?.trim() || null
    }).select('*').single(),
    'AWARD_CREATE_FAILED',
    'Failed to assign the award'
  ) as EventAward;
};

export const deleteAward = async (client: DumalaSupabaseClient, awardId: string): Promise<void> => {
  const supabase = asUntypedClient(client);
  expectNoError(
    await supabase.from('event_awards').delete().eq('id', awardId),
    'AWARD_DELETE_FAILED',
    'Failed to remove the award'
  );
};

// --- Finance: ledger + invoices ----------------------------------------------
// A per-league ledger and team invoices. Money is in integer minor units
// (cents). Summary totals are derived by a pure helper.

export type LedgerDirection = 'income' | 'expense';
export type InvoiceStatus = 'unpaid' | 'paid' | 'waived';

export interface LedgerEntry {
  id: string;
  league_id: string;
  season_id: string | null;
  event_id: string | null;
  invoice_id: string | null;
  direction: LedgerDirection;
  category: string;
  description: string | null;
  amount_cents: number;
  occurred_on: string;
  created_at: string;
  updated_at: string;
}

export interface LedgerEntryInput {
  direction: LedgerDirection;
  category: string;
  amountCents: number;
  description?: string | null;
  eventId?: string | null;
  seasonId?: string | null;
  occurredOn?: string | null;
}

export interface EventInvoice {
  id: string;
  league_id: string;
  event_id: string;
  team_id: string | null;
  registration_id: string | null;
  bill_to: string;
  description: string | null;
  amount_cents: number;
  due_on: string | null;
  status: InvoiceStatus;
  paid_on: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventInvoiceInput {
  eventId: string;
  billTo: string;
  amountCents: number;
  description?: string | null;
  dueOn?: string | null;
  teamId?: string | null;
}

export interface LedgerSummary {
  incomeCents: number;
  expenseCents: number;
  netCents: number;
  invoicedCents: number;
  collectedCents: number;
  outstandingCents: number;
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  unpaid: 'Unpaid',
  paid: 'Paid',
  waived: 'Waived'
};

// --- Pure helpers (unit-testable) --------------------------------------------

/** Format integer minor units as a currency amount, e.g. (150000,'PHP') → "PHP 1,500.00". */
export const formatMoney = (cents: number, currency = 'PHP'): string => {
  const amount = (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${currency} ${amount}`;
};

/** Income/expense/net from the ledger and invoiced/collected/outstanding from invoices. */
export const summarizeLedger = (entries: LedgerEntry[], invoices: EventInvoice[]): LedgerSummary => {
  let incomeCents = 0;
  let expenseCents = 0;
  for (const e of entries) {
    if (e.direction === 'income') incomeCents += e.amount_cents;
    else expenseCents += e.amount_cents;
  }
  let invoicedCents = 0;
  let collectedCents = 0;
  let outstandingCents = 0;
  for (const inv of invoices) {
    if (inv.status === 'waived') continue;
    invoicedCents += inv.amount_cents;
    if (inv.status === 'paid') collectedCents += inv.amount_cents;
    else outstandingCents += inv.amount_cents;
  }
  return {
    incomeCents,
    expenseCents,
    netCents: incomeCents - expenseCents,
    invoicedCents,
    collectedCents,
    outstandingCents
  };
};

// --- Owner: ledger -----------------------------------------------------------

export const listLedgerEntries = async (client: DumalaSupabaseClient, leagueId: string): Promise<LedgerEntry[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase.from('league_ledger_entries').select('*').eq('league_id', leagueId).order('occurred_on', { ascending: false }),
    'LEDGER_READ_FAILED',
    'Failed to load the ledger'
  ) as LedgerEntry[] | null) ?? [];
};

export const addLedgerEntry = async (
  client: DumalaSupabaseClient,
  leagueId: string,
  input: LedgerEntryInput
): Promise<LedgerEntry> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.from('league_ledger_entries').insert({
      league_id: leagueId, direction: input.direction, category: input.category.trim(),
      amount_cents: Math.max(0, Math.round(input.amountCents)), description: input.description?.trim() || null,
      event_id: input.eventId ?? null, season_id: input.seasonId ?? null,
      occurred_on: input.occurredOn || undefined
    }).select('*').single(),
    'LEDGER_CREATE_FAILED',
    'Failed to record the ledger entry'
  ) as LedgerEntry;
};

export const deleteLedgerEntry = async (client: DumalaSupabaseClient, entryId: string): Promise<void> => {
  const supabase = asUntypedClient(client);
  expectNoError(
    await supabase.from('league_ledger_entries').delete().eq('id', entryId),
    'LEDGER_DELETE_FAILED',
    'Failed to remove the ledger entry'
  );
};

// --- Owner: invoices ---------------------------------------------------------

export const listInvoices = async (client: DumalaSupabaseClient, leagueId: string): Promise<EventInvoice[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase.from('event_invoices').select('*').eq('league_id', leagueId).order('created_at', { ascending: false }),
    'INVOICES_READ_FAILED',
    'Failed to load invoices'
  ) as EventInvoice[] | null) ?? [];
};

export const addInvoice = async (
  client: DumalaSupabaseClient,
  leagueId: string,
  input: EventInvoiceInput
): Promise<EventInvoice> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.from('event_invoices').insert({
      league_id: leagueId, event_id: input.eventId, bill_to: input.billTo.trim(),
      amount_cents: Math.max(0, Math.round(input.amountCents)), description: input.description?.trim() || null,
      due_on: input.dueOn || null, team_id: input.teamId ?? null
    }).select('*').single(),
    'INVOICE_CREATE_FAILED',
    'Failed to create the invoice'
  ) as EventInvoice;
};

export const settleInvoice = async (
  client: DumalaSupabaseClient,
  invoiceId: string,
  nextStatus: Extract<InvoiceStatus, 'paid' | 'waived'>,
  paidOn?: string | null
): Promise<EventInvoice> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.rpc('settle_invoice', { invoice_id: invoiceId, next_status: nextStatus, paid_on: paidOn || undefined }),
    'INVOICE_SETTLE_FAILED',
    'Failed to update the invoice'
  ) as EventInvoice;
};

export const deleteInvoice = async (client: DumalaSupabaseClient, invoiceId: string): Promise<void> => {
  const supabase = asUntypedClient(client);
  expectNoError(
    await supabase.from('event_invoices').delete().eq('id', invoiceId),
    'INVOICE_DELETE_FAILED',
    'Failed to remove the invoice'
  );
};

// --- Live operations: check-in, officials, incidents -------------------------

export type IncidentKind = 'injury' | 'misconduct' | 'dispute' | 'delay' | 'other';

export interface EventIncident {
  id: string;
  event_id: string;
  league_id: string;
  fixture_id: string | null;
  team_id: string | null;
  kind: IncidentKind;
  summary: string;
  occurred_at: string;
  created_at: string;
  updated_at: string;
}

export interface EventIncidentInput {
  kind: IncidentKind;
  summary: string;
  fixtureId?: string | null;
  teamId?: string | null;
}

export interface FixtureOpsPatch {
  homeCheckedIn?: boolean;
  awayCheckedIn?: boolean;
  officialName?: string | null;
}

export interface MatchdaySummary {
  total: number;
  completed: number;
  ready: number;      // both teams checked in, not yet played
  awaitingCheckin: number;
}

export const INCIDENT_KIND_LABELS: Record<IncidentKind, string> = {
  injury: 'Injury',
  misconduct: 'Misconduct',
  dispute: 'Dispute',
  delay: 'Delay',
  other: 'Other'
};

// --- Pure helper (unit-testable) ---------------------------------------------

/** Match-day readiness across an event's fixtures. */
export const summarizeMatchday = (fixtures: EventFixture[]): MatchdaySummary => {
  let completed = 0;
  let ready = 0;
  let awaitingCheckin = 0;
  for (const f of fixtures) {
    if (f.status === 'completed') { completed += 1; continue; }
    if (f.status === 'cancelled') continue;
    if (f.home_checked_in && f.away_checked_in) ready += 1;
    else awaitingCheckin += 1;
  }
  return { total: fixtures.length, completed, ready, awaitingCheckin };
};

// --- Owner: fixture match-day ops --------------------------------------------

export const setFixtureOps = async (
  client: DumalaSupabaseClient,
  fixtureId: string,
  patch: FixtureOpsPatch
): Promise<EventFixture> => {
  const supabase = asUntypedClient(client);
  const row: Record<string, unknown> = {};
  if (patch.homeCheckedIn !== undefined) row.home_checked_in = patch.homeCheckedIn;
  if (patch.awayCheckedIn !== undefined) row.away_checked_in = patch.awayCheckedIn;
  if (patch.officialName !== undefined) row.official_name = patch.officialName?.trim() || null;
  return expectNoError(
    await supabase.from('event_fixtures').update(row).eq('id', fixtureId).select('*').single(),
    'FIXTURE_OPS_FAILED',
    'Failed to update the match'
  ) as EventFixture;
};

// --- Owner: incidents --------------------------------------------------------

export const listIncidents = async (client: DumalaSupabaseClient, eventId: string): Promise<EventIncident[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase.from('event_incidents').select('*').eq('event_id', eventId).order('occurred_at', { ascending: false }),
    'INCIDENTS_READ_FAILED',
    'Failed to load incidents'
  ) as EventIncident[] | null) ?? [];
};

export const addIncident = async (
  client: DumalaSupabaseClient,
  leagueId: string,
  eventId: string,
  input: EventIncidentInput
): Promise<EventIncident> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.from('event_incidents').insert({
      league_id: leagueId, event_id: eventId, kind: input.kind, summary: input.summary.trim(),
      fixture_id: input.fixtureId ?? null, team_id: input.teamId ?? null
    }).select('*').single(),
    'INCIDENT_CREATE_FAILED',
    'Failed to log the incident'
  ) as EventIncident;
};

export const deleteIncident = async (client: DumalaSupabaseClient, incidentId: string): Promise<void> => {
  const supabase = asUntypedClient(client);
  expectNoError(
    await supabase.from('event_incidents').delete().eq('id', incidentId),
    'INCIDENT_DELETE_FAILED',
    'Failed to remove the incident'
  );
};

// --- Cross-event dashboard rollup --------------------------------------------
// League-wide reads (every table carries league_id) plus a pure helper that
// rolls the per-event teams, fixtures, and stats up into one live-competition
// snapshot for the Overview. Standings/scorers/match-day are all derived by the
// existing pure helpers, so there is nothing extra to keep in sync.

/** Every team across the league's events, in one read. */
export const listLeagueEventTeams = async (client: DumalaSupabaseClient, leagueId: string): Promise<EventTeam[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase.from('event_teams').select('*').eq('league_id', leagueId).order('created_at', { ascending: true }),
    'LEAGUE_TEAMS_READ_FAILED',
    'Failed to load teams'
  ) as EventTeam[] | null) ?? [];
};

/** Every fixture across the league's events, in one read. */
export const listLeagueFixtures = async (client: DumalaSupabaseClient, leagueId: string): Promise<EventFixture[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase.from('event_fixtures').select('*').eq('league_id', leagueId)
      .order('round', { ascending: true }).order('sequence', { ascending: true }),
    'LEAGUE_FIXTURES_READ_FAILED',
    'Failed to load fixtures'
  ) as EventFixture[] | null) ?? [];
};

/** Every stat event across the league's events, in one read. */
export const listLeagueStatEvents = async (client: DumalaSupabaseClient, leagueId: string): Promise<FixtureStatEvent[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase.from('fixture_stat_events').select('*').eq('league_id', leagueId).order('created_at', { ascending: true }),
    'LEAGUE_STATS_READ_FAILED',
    'Failed to load statistics'
  ) as FixtureStatEvent[] | null) ?? [];
};

export interface CompetitionStanding {
  eventId: string;
  eventName: string;
  status: LeagueEventStatus;
  category: string | null;
  leaders: StandingRow[];
  playedFixtures: number;
  totalFixtures: number;
}

export interface LeagueScorerRow {
  teamId: string;
  teamName: string;
  eventId: string;
  eventName: string;
  playerName: string;
  goals: number;
  assists: number;
}

export interface CompetitionResult {
  fixtureId: string;
  eventId: string;
  eventName: string;
  round: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  updatedAt: string;
}

export interface CompetitionSummary {
  liveMatchday: MatchdaySummary;
  standings: CompetitionStanding[];
  scorers: LeagueScorerRow[];
  recentResults: CompetitionResult[];
  activeEventCount: number;
  hasActivity: boolean;
}

export interface CompetitionSummaryOptions {
  scorerLimit?: number;
  resultLimit?: number;
  leaderLimit?: number;
}

/**
 * Roll per-event teams/fixtures/stats into one league-wide live snapshot:
 * match-day readiness across active events, standings leaders per running or
 * finished event, a league-wide top-scorer board, and recent results. Pure.
 */
export const summarizeCompetition = (
  events: LeagueEvent[],
  teams: EventTeam[],
  fixtures: EventFixture[],
  statEvents: FixtureStatEvent[],
  options: CompetitionSummaryOptions = {}
): CompetitionSummary => {
  const scorerLimit = options.scorerLimit ?? 5;
  const resultLimit = options.resultLimit ?? 5;
  const leaderLimit = options.leaderLimit ?? 3;

  const eventById = new Map(events.map(e => [e.id, e]));
  const teamById = new Map(teams.map(t => [t.id, t]));
  const teamsByEvent = new Map<string, EventTeam[]>();
  const fixturesByEvent = new Map<string, EventFixture[]>();
  for (const team of teams) {
    const list = teamsByEvent.get(team.event_id);
    if (list) list.push(team); else teamsByEvent.set(team.event_id, [team]);
  }
  for (const fixture of fixtures) {
    const list = fixturesByEvent.get(fixture.event_id);
    if (list) list.push(fixture); else fixturesByEvent.set(fixture.event_id, [fixture]);
  }

  // Live match-day readiness is scoped to fixtures of currently-active events.
  const activeEventIds = new Set(events.filter(e => e.status === 'active').map(e => e.id));
  const liveMatchday = summarizeMatchday(fixtures.filter(f => activeEventIds.has(f.event_id)));

  // Standings leaders for any event that has at least one recorded result.
  const standings: CompetitionStanding[] = [];
  for (const event of events) {
    const evFixtures = fixturesByEvent.get(event.id) ?? [];
    const playedFixtures = evFixtures.filter(f => f.status === 'completed').length;
    if (playedFixtures === 0) continue;
    const table = computeStandings(teamsByEvent.get(event.id) ?? [], evFixtures);
    standings.push({
      eventId: event.id,
      eventName: event.name,
      status: event.status,
      category: event.category,
      leaders: table.filter(r => r.played > 0).slice(0, leaderLimit),
      playedFixtures,
      totalFixtures: evFixtures.length
    });
  }
  standings.sort((a, b) =>
    (a.status === 'active' ? 0 : 1) - (b.status === 'active' ? 0 : 1) ||
    b.playedFixtures - a.playedFixtures ||
    a.eventName.localeCompare(b.eventName));

  // A team belongs to exactly one event, so team ids never collide across
  // events and computeScorers over every stat row yields a league-wide board.
  const scorers: LeagueScorerRow[] = computeScorers(statEvents).slice(0, scorerLimit).map(row => {
    const team = teamById.get(row.teamId);
    const event = team ? eventById.get(team.event_id) : undefined;
    return {
      teamId: row.teamId,
      teamName: team?.name ?? 'Unknown team',
      eventId: event?.id ?? '',
      eventName: event?.name ?? '',
      playerName: row.playerName,
      goals: row.goals,
      assists: row.assists
    };
  });

  const recentResults: CompetitionResult[] = fixtures
    .filter(f => f.status === 'completed' && f.home_score !== null && f.away_score !== null)
    .slice()
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, resultLimit)
    .map(f => ({
      fixtureId: f.id,
      eventId: f.event_id,
      eventName: eventById.get(f.event_id)?.name ?? '',
      round: f.round,
      homeTeamName: teamById.get(f.home_team_id)?.name ?? 'TBD',
      awayTeamName: teamById.get(f.away_team_id)?.name ?? 'TBD',
      homeScore: f.home_score as number,
      awayScore: f.away_score as number,
      updatedAt: f.updated_at
    }));

  return {
    liveMatchday,
    standings,
    scorers,
    recentResults,
    activeEventCount: activeEventIds.size,
    hasActivity: standings.length > 0 || scorers.length > 0 || recentResults.length > 0 || liveMatchday.total > 0
  };
};

// --- Statistics database -----------------------------------------------------
// A verifiable per-player / per-team record built from the raw stat events. A
// player is keyed by club + name so their record merges across the events a
// club enters within the selected scope (a season, an event, or everything).

export interface PlayerStatLine {
  key: string;
  playerName: string;
  teamName: string;
  goals: number;
  assists: number;
  ownGoals: number;
  yellow: number;
  red: number;
  goalContributions: number;
  matches: number;
  events: number;
}

export interface TeamStatLine {
  key: string;
  teamName: string;
  players: number;
  goals: number;
  assists: number;
  ownGoals: number;
  yellow: number;
  red: number;
}

export interface StatDatabaseTotals {
  goals: number;
  assists: number;
  ownGoals: number;
  yellow: number;
  red: number;
  records: number;
  players: number;
  teams: number;
  matches: number;
}

export interface StatDatabase {
  players: PlayerStatLine[];
  teams: TeamStatLine[];
  totals: StatDatabaseTotals;
}

/** Aggregate raw stat events into a sortable per-player and per-team record. Pure. */
export const buildStatDatabase = (statEvents: FixtureStatEvent[], teams: EventTeam[]): StatDatabase => {
  const teamNameById = new Map(teams.map(t => [t.id, t.name]));
  interface PlayerAcc extends PlayerStatLine { fixtures: Set<string>; eventIds: Set<string>; }
  interface TeamAcc extends TeamStatLine { playerKeys: Set<string>; }
  const players = new Map<string, PlayerAcc>();
  const teamAcc = new Map<string, TeamAcc>();

  for (const event of statEvents) {
    const teamName = teamNameById.get(event.team_id) ?? 'Unknown team';
    const teamKey = teamName.trim().toLowerCase();
    const playerName = event.player_name.trim();
    const playerKey = `${teamKey}::${playerName.toLowerCase()}`;

    let player = players.get(playerKey);
    if (!player) {
      player = {
        key: playerKey, playerName, teamName, goals: 0, assists: 0, ownGoals: 0, yellow: 0, red: 0,
        goalContributions: 0, matches: 0, events: 0, fixtures: new Set(), eventIds: new Set()
      };
      players.set(playerKey, player);
    }
    let team = teamAcc.get(teamKey);
    if (!team) {
      team = { key: teamKey, teamName, players: 0, goals: 0, assists: 0, ownGoals: 0, yellow: 0, red: 0, playerKeys: new Set() };
      teamAcc.set(teamKey, team);
    }
    player.fixtures.add(event.fixture_id);
    player.eventIds.add(event.event_id);
    team.playerKeys.add(playerKey);

    switch (event.stat_type) {
      case 'goal': player.goals += 1; team.goals += 1; break;
      case 'assist': player.assists += 1; team.assists += 1; break;
      case 'own_goal': player.ownGoals += 1; team.ownGoals += 1; break;
      case 'yellow_card': player.yellow += 1; team.yellow += 1; break;
      case 'red_card': player.red += 1; team.red += 1; break;
    }
  }

  const playerRows: PlayerStatLine[] = [...players.values()]
    .map(({ fixtures, eventIds, ...row }) => ({
      ...row, goalContributions: row.goals + row.assists, matches: fixtures.size, events: eventIds.size
    }))
    .sort((a, b) =>
      b.goals - a.goals || b.assists - a.assists || b.goalContributions - a.goalContributions ||
      a.playerName.localeCompare(b.playerName));

  const teamRows: TeamStatLine[] = [...teamAcc.values()]
    .map(({ playerKeys, ...row }) => ({ ...row, players: playerKeys.size }))
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists || a.teamName.localeCompare(b.teamName));

  const totals: StatDatabaseTotals = {
    goals: 0, assists: 0, ownGoals: 0, yellow: 0, red: 0,
    records: statEvents.length, players: playerRows.length, teams: teamRows.length,
    matches: new Set(statEvents.map(e => e.fixture_id)).size
  };
  for (const p of playerRows) {
    totals.goals += p.goals; totals.assists += p.assists; totals.ownGoals += p.ownGoals;
    totals.yellow += p.yellow; totals.red += p.red;
  }

  return { players: playerRows, teams: teamRows, totals };
};

// --- Conflict-aware auto-scheduling ------------------------------------------
// Greedily place fixtures onto (time, venue) slots so no venue is double-booked
// and no team plays two matches at once. Pairs with buildFixtureCalendar, which
// detects the same conflicts. Pure — the caller persists the result.

export interface ScheduleOptions {
  startDate: string;    // 'YYYY-MM-DD'
  firstKickoff: string; // 'HH:MM'
  lastKickoff: string;  // 'HH:MM'
  slotMinutes: number;  // gap between kickoffs at a venue, and the match footprint
}

export interface ScheduleAssignment {
  fixtureId: string;
  kickoffAt: string; // ISO
  venueId: string;
}

export const DEFAULT_MATCH_MINUTES = 120;

const parseHm = (value: string): number => {
  const [h, m] = value.split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

/**
 * Assign each fixture the earliest (time, venue) slot with no clash: the venue
 * must be free and neither team already playing within one match's window. Times
 * run from firstKickoff to lastKickoff each day, stepping by slotMinutes, from
 * startDate onward. `busy` fixtures (e.g. already-played) hold their slots fixed.
 * Fixtures are placed in round then sequence order.
 */
export const autoScheduleFixtures = (
  toSchedule: EventFixture[],
  venues: LeagueVenue[],
  busy: EventFixture[],
  options: ScheduleOptions
): ScheduleAssignment[] => {
  if (venues.length === 0 || toSchedule.length === 0) return [];
  const stepMinutes = Math.max(15, Math.round(options.slotMinutes) || DEFAULT_MATCH_MINUTES);
  const windowMs = stepMinutes * 60_000;
  const firstMin = parseHm(options.firstKickoff);
  const lastMin = Math.max(firstMin, parseHm(options.lastKickoff));

  const placed: Array<{ time: number; venueId: string; home: string | null; away: string | null }> = [];
  for (const b of busy) {
    if (b.kickoff_at && b.venue_id) {
      const time = new Date(b.kickoff_at).getTime();
      if (!Number.isNaN(time)) placed.push({ time, venueId: b.venue_id, home: b.home_team_id, away: b.away_team_id });
    }
  }

  // Candidate kickoff times in chronological order.
  const slotTimes: number[] = [];
  const start = new Date(`${options.startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return [];
  const MAX_DAYS = 180;
  for (let day = 0; day < MAX_DAYS; day += 1) {
    for (let minute = firstMin; minute <= lastMin; minute += stepMinutes) {
      const dt = new Date(start);
      dt.setDate(start.getDate() + day);
      dt.setHours(0, minute, 0, 0);
      slotTimes.push(dt.getTime());
    }
  }

  const clashes = (time: number, venueId: string, home: string | null, away: string | null): boolean =>
    placed.some(p => Math.abs(p.time - time) < windowMs && (
      p.venueId === venueId ||
      (home !== null && (p.home === home || p.away === home)) ||
      (away !== null && (p.home === away || p.away === away))
    ));

  const ordered = toSchedule.slice().sort((a, b) => a.round - b.round || (a.sequence ?? 0) - (b.sequence ?? 0));
  const assignments: ScheduleAssignment[] = [];
  for (const fixture of ordered) {
    let done = false;
    for (const time of slotTimes) {
      for (const venue of venues) {
        if (!clashes(time, venue.id, fixture.home_team_id, fixture.away_team_id)) {
          placed.push({ time, venueId: venue.id, home: fixture.home_team_id, away: fixture.away_team_id });
          assignments.push({ fixtureId: fixture.id, kickoffAt: new Date(time).toISOString(), venueId: venue.id });
          done = true;
          break;
        }
      }
      if (done) break;
    }
  }
  return assignments;
};

// --- League coach organization -----------------------------------------------
// A league carries a coach seat quota + a shareable invite code. Coaches apply
// through the code and the owner reviews each; a seat is consumed on approval.
// Affiliation is directory-only and never grants access to a coach's club data.

export type LeagueCoachStatus = 'pending' | 'active' | 'declined' | 'removed';

export interface LeagueCoachMembership {
  id: string;
  league_id: string;
  coach_user_id: string;
  coach_name: string;
  coach_email: string;
  message: string | null;
  status: LeagueCoachStatus;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeagueCoachApplyInput {
  code: string;
  coachName: string;
  coachEmail: string;
  message?: string | null;
}

/** Minimal org info returned by the public `resolve_league_org_invite` RPC. */
export interface LeagueCoachInviteLookup {
  found: boolean;
  leagueId?: string;
  leagueName?: string;
  location?: string | null;
  seatLimit?: number;
  seatsRemaining?: number;
  open?: boolean;
}

export interface CoachSeatSummary {
  seatLimit: number;
  active: number;
  pending: number;
  remaining: number;
  full: boolean;
}

export const LEAGUE_COACH_STATUS_LABELS: Record<LeagueCoachStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  declined: 'Declined',
  removed: 'Removed'
};

/** Seat usage from a league's memberships. Pure. */
export const summarizeCoachSeats = (memberships: LeagueCoachMembership[], seatLimit: number): CoachSeatSummary => {
  let active = 0;
  let pending = 0;
  for (const m of memberships) {
    if (m.status === 'active') active += 1;
    else if (m.status === 'pending') pending += 1;
  }
  return { seatLimit, active, pending, remaining: Math.max(0, seatLimit - active), full: active >= seatLimit };
};

export const listCoachMemberships = async (client: DumalaSupabaseClient, leagueId: string): Promise<LeagueCoachMembership[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase.from('league_coach_memberships').select('*').eq('league_id', leagueId).order('created_at', { ascending: false }),
    'LEAGUE_COACHES_READ_FAILED',
    'Failed to load organization coaches'
  ) as LeagueCoachMembership[] | null) ?? [];
};

export const resolveLeagueOrgInvite = async (client: DumalaSupabaseClient, code: string): Promise<LeagueCoachInviteLookup> => {
  const supabase = asUntypedClient(client);
  const data = expectNoError(
    await supabase.rpc('resolve_league_org_invite', { code: code.trim().toUpperCase() }),
    'LEAGUE_ORG_LOOKUP_FAILED',
    'Failed to look up the organization'
  );
  return (data as LeagueCoachInviteLookup | null) ?? { found: false };
};

export const applyToLeagueOrg = async (client: DumalaSupabaseClient, input: LeagueCoachApplyInput): Promise<string> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.rpc('apply_to_league_org', {
      code: input.code.trim().toUpperCase(),
      coach_name: input.coachName.trim(),
      coach_email: input.coachEmail.trim(),
      message: input.message?.trim() || null
    }),
    'LEAGUE_ORG_APPLY_FAILED',
    'Failed to submit your application'
  ) as string;
};

export const reviewCoachMembership = async (
  client: DumalaSupabaseClient,
  membershipId: string,
  nextStatus: Extract<LeagueCoachStatus, 'active' | 'declined' | 'removed'>,
  note?: string | null
): Promise<LeagueCoachStatus> => {
  const supabase = asUntypedClient(client);
  expectNoError(
    await supabase.rpc('review_league_coach_membership', {
      membership_id: membershipId,
      next_status: nextStatus,
      note: note?.trim() || null
    }),
    'LEAGUE_COACH_REVIEW_FAILED',
    'Failed to update the coach application'
  );
  return nextStatus;
};

export const rotateCoachInvite = async (client: DumalaSupabaseClient, leagueId: string): Promise<string> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.rpc('rotate_league_coach_invite', { target_league_id: leagueId }),
    'LEAGUE_INVITE_ROTATE_FAILED',
    'Failed to rotate the invite code'
  ) as string;
};

export const setCoachSeatLimit = async (client: DumalaSupabaseClient, leagueId: string, seatLimit: number): Promise<League> => {
  const supabase = asUntypedClient(client);
  const clamped = Math.max(0, Math.min(1000, Math.round(seatLimit)));
  return expectNoError(
    await supabase.from('leagues').update({ coach_seat_limit: clamped }).eq('id', leagueId).select('*').single(),
    'LEAGUE_SEAT_LIMIT_FAILED',
    'Failed to update the seat limit'
  ) as League;
};

// --- Fixtures calendar + venue conflicts -------------------------------------
// A league-wide operating calendar built from the fixtures' kickoff time and
// venue (columns already on event_fixtures). "Double booking" = two fixtures at
// the same venue whose kickoff times fall within a short window of each other.

export interface FixtureSchedulePatch {
  kickoffAt?: string | null;
  venueId?: string | null;
}

/** Set (or clear) a fixture's kickoff time and venue. Owner-scoped by RLS. */
export const setFixtureSchedule = async (
  client: DumalaSupabaseClient,
  fixtureId: string,
  patch: FixtureSchedulePatch
): Promise<EventFixture> => {
  const supabase = asUntypedClient(client);
  const row: Record<string, unknown> = {};
  if (patch.kickoffAt !== undefined) row.kickoff_at = patch.kickoffAt || null;
  if (patch.venueId !== undefined) row.venue_id = patch.venueId || null;
  return expectNoError(
    await supabase.from('event_fixtures').update(row).eq('id', fixtureId).select('*').single(),
    'FIXTURE_SCHEDULE_FAILED',
    'Failed to update the fixture schedule'
  ) as EventFixture;
};

/** Apply a batch of schedule assignments (e.g. from autoScheduleFixtures). */
export const applyFixtureSchedules = async (
  client: DumalaSupabaseClient,
  assignments: ScheduleAssignment[]
): Promise<number> => {
  await Promise.all(assignments.map(a => setFixtureSchedule(client, a.fixtureId, { kickoffAt: a.kickoffAt, venueId: a.venueId })));
  return assignments.length;
};

export interface CalendarFixtureItem {
  fixtureId: string;
  eventId: string;
  eventName: string;
  round: number;
  homeTeamName: string;
  awayTeamName: string;
  venueId: string | null;
  venueName: string | null;
  kickoffAt: string | null;
  status: EventFixtureStatus;
  homeScore: number | null;
  awayScore: number | null;
  conflict: boolean;
}

export interface CalendarDay {
  date: string;      // YYYY-MM-DD (local)
  items: CalendarFixtureItem[];
}

export interface FixtureCalendar {
  days: CalendarDay[];
  unscheduled: CalendarFixtureItem[];
  scheduledCount: number;
  conflictCount: number;
  venueConflicts: Array<{ venueId: string; venueName: string | null; fixtureIds: string[] }>;
}

/** Two fixtures at one venue within this many minutes count as a double-booking. */
export const FIXTURE_CONFLICT_WINDOW_MINUTES = 120;

const localDayKey = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Build a league operating calendar from fixtures. Scheduled fixtures (with a
 * kickoff time) are grouped by local day; the rest are returned as `unscheduled`.
 * A fixture is flagged `conflict` when another fixture shares its venue within
 * FIXTURE_CONFLICT_WINDOW_MINUTES. Pure.
 */
export const buildFixtureCalendar = (
  fixtures: EventFixture[],
  teams: EventTeam[],
  events: LeagueEvent[],
  venues: LeagueVenue[],
  options: { windowMinutes?: number } = {}
): FixtureCalendar => {
  const windowMs = (options.windowMinutes ?? FIXTURE_CONFLICT_WINDOW_MINUTES) * 60_000;
  const teamName = new Map(teams.map(t => [t.id, t.name]));
  const eventName = new Map(events.map(e => [e.id, e.name]));
  const venueName = new Map(venues.map(v => [v.id, v.name]));

  // Detect venue double-bookings among scheduled, non-cancelled fixtures.
  const conflictIds = new Set<string>();
  const venueConflictMap = new Map<string, Set<string>>();
  const byVenue = new Map<string, EventFixture[]>();
  for (const f of fixtures) {
    if (f.status === 'cancelled' || !f.kickoff_at || !f.venue_id) continue;
    const list = byVenue.get(f.venue_id);
    if (list) list.push(f); else byVenue.set(f.venue_id, [f]);
  }
  for (const [venueId, list] of byVenue) {
    const sorted = list.slice().sort((a, b) => new Date(a.kickoff_at as string).getTime() - new Date(b.kickoff_at as string).getTime());
    for (let i = 0; i < sorted.length; i += 1) {
      for (let j = i + 1; j < sorted.length; j += 1) {
        const gap = Math.abs(new Date(sorted[j].kickoff_at as string).getTime() - new Date(sorted[i].kickoff_at as string).getTime());
        if (gap < windowMs) {
          conflictIds.add(sorted[i].id);
          conflictIds.add(sorted[j].id);
          const set = venueConflictMap.get(venueId) ?? new Set<string>();
          set.add(sorted[i].id); set.add(sorted[j].id);
          venueConflictMap.set(venueId, set);
        } else {
          break; // sorted by time — no later fixture can be within the window of i
        }
      }
    }
  }

  const toItem = (f: EventFixture): CalendarFixtureItem => ({
    fixtureId: f.id,
    eventId: f.event_id,
    eventName: eventName.get(f.event_id) ?? '—',
    round: f.round,
    homeTeamName: teamName.get(f.home_team_id) ?? 'TBD',
    awayTeamName: teamName.get(f.away_team_id) ?? 'TBD',
    venueId: f.venue_id,
    venueName: f.venue_id ? venueName.get(f.venue_id) ?? 'Unknown venue' : null,
    kickoffAt: f.kickoff_at,
    status: f.status,
    homeScore: f.home_score,
    awayScore: f.away_score,
    conflict: conflictIds.has(f.id)
  });

  const dayMap = new Map<string, CalendarFixtureItem[]>();
  const unscheduled: CalendarFixtureItem[] = [];
  for (const f of fixtures) {
    const item = toItem(f);
    if (f.kickoff_at) {
      const key = localDayKey(f.kickoff_at);
      const list = dayMap.get(key);
      if (list) list.push(item); else dayMap.set(key, [item]);
    } else {
      unscheduled.push(item);
    }
  }

  const days: CalendarDay[] = [...dayMap.entries()]
    .map(([date, items]) => ({
      date,
      items: items.sort((a, b) => (a.kickoffAt ?? '').localeCompare(b.kickoffAt ?? '') || a.eventName.localeCompare(b.eventName))
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    days,
    unscheduled,
    scheduledCount: fixtures.filter(f => f.kickoff_at).length,
    conflictCount: conflictIds.size,
    venueConflicts: [...venueConflictMap.entries()].map(([venueId, ids]) => ({
      venueId,
      venueName: venueName.get(venueId) ?? null,
      fixtureIds: [...ids]
    }))
  };
};
