import type { CloudDataAccess, CloudLeagueRepository } from '../../cloud/dataAccess';
import type { CloudRuntime, Phase6Config } from '../../cloud/runtime';
import type { CloudAuthController } from '../../hooks/useCloudAuth';
import {
  nextEventStatuses,
  nextSeasonStatuses,
  roundRobinRounds,
  spotsRemaining,
  type EventFixture,
  type EventRegistration,
  type EventTeam,
  type League,
  type LeagueEvent,
  type LeagueSeason,
  type LeagueVenue
} from '../../cloud/league';

// In-memory sample data for the League Owner app "preview" mode: no login, no
// entitlement, in-memory state that resets on reload. Mirrors the Player preview
// pattern (see components/player/demoPlayerData.ts).

const newId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const now = () => new Date().toISOString();
const LEAGUE_ID = 'demo-league';

const OPEN_REGISTRATION_STATUSES: EventRegistration['status'][] = ['submitted', 'waitlisted', 'approved'];
const genCode = () => `EV${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const buildDemoLeagueRepository = (): CloudLeagueRepository => {
  let leagues: League[] = [
    {
      id: LEAGUE_ID,
      owner_user_id: 'preview-owner',
      name: 'Metro Youth League',
      short_name: 'MYL',
      logo_color: '#f97316',
      contact_email: 'ops@metroyouth.example',
      location: 'Metro Manila, PH',
      description: 'Grassroots youth football across the metro.',
      timezone: 'Asia/Manila',
      state: 'active',
      created_at: now(),
      updated_at: now()
    }
  ];

  let seasons: LeagueSeason[] = [
    {
      id: 'demo-season-1',
      league_id: LEAGUE_ID,
      name: 'Season 2026',
      year: 2026,
      status: 'active',
      starts_on: '2026-06-01',
      ends_on: '2026-11-30',
      registration_opens_on: '2026-04-01',
      registration_closes_on: '2026-05-15',
      roster_deadline: '2026-05-25',
      transfer_window_opens_on: null,
      transfer_window_closes_on: null,
      notes: null,
      created_at: now(),
      updated_at: now()
    },
    {
      id: 'demo-season-2',
      league_id: LEAGUE_ID,
      name: 'Metro Cup 2026',
      year: 2026,
      status: 'draft',
      starts_on: null,
      ends_on: null,
      registration_opens_on: null,
      registration_closes_on: null,
      roster_deadline: null,
      transfer_window_opens_on: null,
      transfer_window_closes_on: null,
      notes: 'Knockout cup — dates to be confirmed.',
      created_at: now(),
      updated_at: now()
    }
  ];

  let venues: LeagueVenue[] = [
    { id: 'demo-venue-1', league_id: LEAGUE_ID, name: 'Rizal Memorial Pitch A', address: 'Malate, Manila', capacity: 4000, notes: null, created_at: now(), updated_at: now() },
    { id: 'demo-venue-2', league_id: LEAGUE_ID, name: 'McKinley Field 2', address: 'Taguig', capacity: 800, notes: 'Artificial turf', created_at: now(), updated_at: now() }
  ];

  let events: LeagueEvent[] = [
    {
      id: 'demo-event-1', league_id: LEAGUE_ID, season_id: 'demo-season-1', name: 'Metro Cup Qualifiers',
      format: 'group_knockout', category: 'U14', status: 'registration_open', team_cap: 8,
      starts_on: '2026-08-01', ends_on: '2026-08-30', registration_code: 'METROCUP',
      notes: 'Open to all metro clubs. Share the code below to invite teams.', created_at: now(), updated_at: now()
    },
    {
      id: 'demo-event-2', league_id: LEAGUE_ID, season_id: 'demo-season-1', name: 'Founders Invitational',
      format: 'round_robin', category: 'U16', status: 'draft', team_cap: 6,
      starts_on: null, ends_on: null, registration_code: 'FOUNDERS1', notes: null, created_at: now(), updated_at: now()
    }
  ];

  let registrations: EventRegistration[] = [
    {
      id: 'demo-reg-1', event_id: 'demo-event-1', league_id: LEAGUE_ID, club_name: 'Bayside FC', team_name: 'Bayside U14',
      category: 'U14', contact_name: 'Coach Ramirez', contact_email: 'ramirez@bayside.example', roster_size: 16,
      message: 'Excited to take part again this year.', status: 'approved', review_note: null,
      reviewed_by: 'preview-owner', reviewed_at: now(), created_at: now(), updated_at: now()
    },
    {
      id: 'demo-reg-2', event_id: 'demo-event-1', league_id: LEAGUE_ID, club_name: 'North Stars', team_name: null,
      category: 'U14', contact_name: 'Coach Lim', contact_email: 'lim@northstars.example', roster_size: 14,
      message: null, status: 'submitted', review_note: null, reviewed_by: null, reviewed_at: null,
      created_at: now(), updated_at: now()
    }
  ];

  const teamRow = (id: string, name: string, registrationId: string | null): EventTeam => ({
    id, event_id: 'demo-event-1', league_id: LEAGUE_ID, registration_id: registrationId, name, seed: null,
    created_at: now(), updated_at: now()
  });
  let teams: EventTeam[] = [
    teamRow('demo-team-1', 'Bayside FC', 'demo-reg-1'),
    teamRow('demo-team-2', 'North Stars', null),
    teamRow('demo-team-3', 'Metro United', null),
    teamRow('demo-team-4', 'Harbour City', null)
  ];

  // A pre-generated round-robin with the first two matches already played, so
  // the Fixtures list and the live table are populated on first open.
  const seededResults: Record<string, [number, number]> = {
    'demo-team-1|demo-team-2': [2, 1],
    'demo-team-3|demo-team-4': [0, 0]
  };
  let fixtures: EventFixture[] = roundRobinRounds(teams.map(t => t.id)).map((p, index) => {
    const key = `${p.homeTeamId}|${p.awayTeamId}`;
    const result = seededResults[key];
    return {
      id: `demo-fixture-${index + 1}`, event_id: 'demo-event-1', league_id: LEAGUE_ID,
      round: p.round, sequence: p.sequence, home_team_id: p.homeTeamId, away_team_id: p.awayTeamId,
      status: result ? 'completed' : 'scheduled', home_score: result ? result[0] : null,
      away_score: result ? result[1] : null, kickoff_at: null, venue_id: null, created_at: now(), updated_at: now()
    };
  });

  return {
    listLeagues: async () => leagues,
    createLeague: async (ownerUserId, input) => {
      const row: League = {
        id: newId(), owner_user_id: ownerUserId, name: input.name.trim(),
        short_name: input.shortName?.trim() || null, logo_color: input.logoColor?.trim() || '#f97316',
        contact_email: input.contactEmail?.trim() || null, location: input.location?.trim() || null,
        description: input.description?.trim() || null, timezone: 'Asia/Manila', state: 'active',
        created_at: now(), updated_at: now()
      };
      leagues = [...leagues, row];
      return row;
    },
    updateLeague: async (leagueId, input) => {
      leagues = leagues.map(l => l.id === leagueId ? {
        ...l, name: input.name.trim(), short_name: input.shortName?.trim() || null,
        logo_color: input.logoColor?.trim() || l.logo_color, contact_email: input.contactEmail?.trim() || null,
        location: input.location?.trim() || null, description: input.description?.trim() || null, updated_at: now()
      } : l);
      return leagues.find(l => l.id === leagueId)!;
    },
    listSeasons: async leagueId => seasons.filter(s => s.league_id === leagueId),
    createSeason: async (leagueId, input) => {
      const row: LeagueSeason = {
        id: newId(), league_id: leagueId, name: input.name.trim(), year: input.year ?? null, status: 'draft',
        starts_on: input.startsOn || null, ends_on: input.endsOn || null,
        registration_opens_on: input.registrationOpensOn || null, registration_closes_on: input.registrationClosesOn || null,
        roster_deadline: input.rosterDeadline || null, transfer_window_opens_on: input.transferWindowOpensOn || null,
        transfer_window_closes_on: input.transferWindowClosesOn || null, notes: input.notes?.trim() || null,
        created_at: now(), updated_at: now()
      };
      seasons = [row, ...seasons];
      return row;
    },
    updateSeason: async (seasonId, input) => {
      seasons = seasons.map(s => s.id === seasonId ? {
        ...s, name: input.name.trim(), year: input.year ?? s.year, starts_on: input.startsOn || null,
        ends_on: input.endsOn || null, registration_opens_on: input.registrationOpensOn || null,
        registration_closes_on: input.registrationClosesOn || null, roster_deadline: input.rosterDeadline || null,
        transfer_window_opens_on: input.transferWindowOpensOn || null, transfer_window_closes_on: input.transferWindowClosesOn || null,
        notes: input.notes?.trim() || null, updated_at: now()
      } : s);
      return seasons.find(s => s.id === seasonId)!;
    },
    advanceSeasonStatus: async (seasonId, nextStatus) => {
      const season = seasons.find(s => s.id === seasonId);
      if (!season || !nextSeasonStatuses(season.status).includes(nextStatus)) {
        throw new Error('INVALID_SEASON_TRANSITION');
      }
      seasons = seasons.map(s => s.id === seasonId ? { ...s, status: nextStatus, updated_at: now() } : s);
      return nextStatus;
    },
    listVenues: async leagueId => venues.filter(v => v.league_id === leagueId),
    createVenue: async (leagueId, input) => {
      const row: LeagueVenue = {
        id: newId(), league_id: leagueId, name: input.name.trim(), address: input.address?.trim() || null,
        capacity: input.capacity ?? null, notes: input.notes?.trim() || null, created_at: now(), updated_at: now()
      };
      venues = [...venues, row];
      return row;
    },
    updateVenue: async (venueId, input) => {
      venues = venues.map(v => v.id === venueId ? {
        ...v, name: input.name.trim(), address: input.address?.trim() || null,
        capacity: input.capacity ?? null, notes: input.notes?.trim() || null, updated_at: now()
      } : v);
      return venues.find(v => v.id === venueId)!;
    },
    deleteVenue: async venueId => {
      venues = venues.filter(v => v.id !== venueId);
    },
    listEvents: async leagueId => events.filter(e => e.league_id === leagueId),
    createEvent: async (leagueId, input) => {
      const row: LeagueEvent = {
        id: newId(), league_id: leagueId, season_id: input.seasonId, name: input.name.trim(),
        format: input.format ?? 'round_robin', category: input.category?.trim() || null, status: 'draft',
        team_cap: input.teamCap ?? null, starts_on: input.startsOn || null, ends_on: input.endsOn || null,
        registration_code: genCode(), notes: input.notes?.trim() || null, created_at: now(), updated_at: now()
      };
      events = [row, ...events];
      return row;
    },
    updateEvent: async (eventId, input) => {
      events = events.map(e => e.id === eventId ? {
        ...e, season_id: input.seasonId, name: input.name.trim(), format: input.format ?? e.format,
        category: input.category?.trim() || null, team_cap: input.teamCap ?? null,
        starts_on: input.startsOn || null, ends_on: input.endsOn || null, notes: input.notes?.trim() || null, updated_at: now()
      } : e);
      return events.find(e => e.id === eventId)!;
    },
    advanceEventStatus: async (eventId, nextStatus) => {
      const event = events.find(e => e.id === eventId);
      if (!event || !nextEventStatuses(event.status).includes(nextStatus)) {
        throw new Error('INVALID_EVENT_TRANSITION');
      }
      events = events.map(e => e.id === eventId ? { ...e, status: nextStatus, updated_at: now() } : e);
      return nextStatus;
    },
    listRegistrations: async eventId => registrations.filter(r => r.event_id === eventId),
    reviewRegistration: async (registrationId, nextStatus, note) => {
      const reg = registrations.find(r => r.id === registrationId);
      if (!reg) throw new Error('REGISTRATION_NOT_FOUND');
      if (nextStatus === 'approved') {
        const event = events.find(e => e.id === reg.event_id);
        if (event?.team_cap != null) {
          const approved = registrations.filter(r => r.event_id === reg.event_id && r.status === 'approved' && r.id !== registrationId).length;
          if (approved >= event.team_cap) throw new Error('EVENT_CAP_FULL');
        }
      }
      registrations = registrations.map(r => r.id === registrationId
        ? { ...r, status: nextStatus, review_note: note?.trim() || null, reviewed_by: 'preview-owner', reviewed_at: now(), updated_at: now() }
        : r);
      return nextStatus;
    },
    lookupEventRegistration: async code => {
      const event = events.find(e => e.registration_code === code.trim().toUpperCase());
      if (!event) return { found: false };
      if (event.status !== 'registration_open') {
        return { found: true, open: false, name: event.name, status: event.status };
      }
      const approved = registrations.filter(r => r.event_id === event.id && r.status === 'approved').length;
      return {
        found: true, open: true, eventId: event.id, name: event.name, category: event.category,
        format: event.format, teamCap: event.team_cap, spotsRemaining: spotsRemaining(event.team_cap, approved)
      };
    },
    submitEventRegistration: async input => {
      const event = events.find(e => e.registration_code === input.code.trim().toUpperCase());
      if (!event) throw new Error('INVALID_REGISTRATION_CODE');
      if (event.status !== 'registration_open') throw new Error('REGISTRATION_CLOSED');
      const email = input.contactEmail.trim().toLowerCase();
      const clash = registrations.some(r => r.event_id === event.id
        && r.contact_email.toLowerCase() === email
        && OPEN_REGISTRATION_STATUSES.includes(r.status));
      if (clash) throw new Error('ALREADY_REGISTERED');
      const row: EventRegistration = {
        id: newId(), event_id: event.id, league_id: event.league_id, club_name: input.clubName.trim(),
        team_name: input.teamName?.trim() || null, category: input.category?.trim() || null,
        contact_name: input.contactName.trim(), contact_email: input.contactEmail.trim(),
        roster_size: input.rosterSize ?? null, message: input.message?.trim() || null,
        status: 'submitted', review_note: null, reviewed_by: null, reviewed_at: null, created_at: now(), updated_at: now()
      };
      registrations = [...registrations, row];
      return row.id;
    },
    listEventTeams: async eventId => teams.filter(t => t.event_id === eventId),
    addEventTeam: async (leagueId, eventId, input) => {
      const row = teamRow(newId(), input.name.trim(), input.registrationId ?? null);
      row.event_id = eventId;
      row.league_id = leagueId;
      row.seed = input.seed ?? null;
      teams = [...teams, row];
      return row;
    },
    deleteEventTeam: async teamId => {
      teams = teams.filter(t => t.id !== teamId);
      fixtures = fixtures.filter(f => f.home_team_id !== teamId && f.away_team_id !== teamId);
    },
    syncApprovedTeams: async (leagueId, eventId) => {
      const linked = new Set(teams.filter(t => t.event_id === eventId).map(t => t.registration_id).filter(Boolean) as string[]);
      const additions = registrations
        .filter(r => r.event_id === eventId && r.status === 'approved' && !linked.has(r.id))
        .map(r => {
          const row = teamRow(newId(), r.team_name?.trim() || r.club_name.trim(), r.id);
          row.event_id = eventId;
          row.league_id = leagueId;
          return row;
        });
      teams = [...teams, ...additions];
      return teams.filter(t => t.event_id === eventId);
    },
    listFixtures: async eventId => fixtures
      .filter(f => f.event_id === eventId)
      .sort((a, b) => a.round - b.round || (a.sequence ?? 0) - (b.sequence ?? 0)),
    generateFixtures: async (leagueId, eventId) => {
      const eventTeams = teams.filter(t => t.event_id === eventId);
      if (eventTeams.length < 2) throw new Error('NOT_ENOUGH_TEAMS');
      fixtures = fixtures.filter(f => f.event_id !== eventId);
      const generated: EventFixture[] = roundRobinRounds(eventTeams.map(t => t.id)).map(p => ({
        id: newId(), event_id: eventId, league_id: leagueId, round: p.round, sequence: p.sequence,
        home_team_id: p.homeTeamId, away_team_id: p.awayTeamId, status: 'scheduled',
        home_score: null, away_score: null, kickoff_at: null, venue_id: null, created_at: now(), updated_at: now()
      }));
      fixtures = [...fixtures, ...generated];
      return generated;
    },
    clearFixtures: async eventId => {
      fixtures = fixtures.filter(f => f.event_id !== eventId);
    },
    recordFixtureResult: async (fixtureId, homeScore, awayScore) => {
      fixtures = fixtures.map(f => f.id === fixtureId
        ? { ...f, home_score: homeScore, away_score: awayScore, status: 'completed', updated_at: now() }
        : f);
      return fixtures.find(f => f.id === fixtureId)!;
    }
  };
};

// Memoized so the owner Events tab (#/league) and the public form (#/register)
// share one in-memory store within a page session: an application submitted on
// the register form then shows up for the owner to review. Resets on reload.
let sharedDemoLeagueRepository: CloudLeagueRepository | null = null;

export const createDemoLeagueRepository = (): CloudLeagueRepository => {
  if (!sharedDemoLeagueRepository) sharedDemoLeagueRepository = buildDemoLeagueRepository();
  return sharedDemoLeagueRepository;
};

export const createPreviewLeagueAuthController = (): CloudAuthController => ({
  state: { status: 'disabled' },
  requestOtp: async () => undefined,
  signUpWithPassword: async () => undefined,
  signInWithPassword: async () => undefined,
  signInWithGoogle: async () => undefined,
  signOut: async () => undefined
});

export const createPreviewLeagueRuntime = (
  phase6: Phase6Config
): Extract<CloudRuntime, { enabled: true }> => ({
  enabled: true,
  phase6,
  dataAccess: { league: createDemoLeagueRepository() } as unknown as CloudDataAccess
});
