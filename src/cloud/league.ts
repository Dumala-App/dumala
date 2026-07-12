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
  state: 'active' | 'archived';
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
  home_team_id: string;
  away_team_id: string;
  status: EventFixtureStatus;
  home_score: number | null;
  away_score: number | null;
  kickoff_at: string | null;
  venue_id: string | null;
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
