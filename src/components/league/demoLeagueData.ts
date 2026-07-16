import type { CloudDataAccess, CloudLeagueRepository } from '../../cloud/dataAccess';
import type { CloudRuntime, Phase6Config } from '../../cloud/runtime';
import type { CloudAuthController } from '../../hooks/useCloudAuth';
import {
  drawGroups,
  groupStageFixtureSpecs,
  groupStageStandings,
  nextEventStatuses,
  nextSeasonStatuses,
  qualifiers,
  roundRobinRounds,
  singleEliminationBracket,
  spotsRemaining,
  type EventAward,
  type EventFixture,
  type EventIncident,
  type EventInvoice,
  type EventRegistration,
  type EventTeam,
  type FixtureStatEvent,
  type League,
  type LeagueCoachMembership,
  type LeagueEvent,
  type LeagueSeason,
  type LeagueVenue,
  type LedgerEntry
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
      currency: 'PHP',
      state: 'active',
      coach_seat_limit: 10,
      coach_invite_code: 'MYLCOACH',
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
      format: 'round_robin', category: 'U14', status: 'registration_open', team_cap: 8,
      starts_on: '2026-08-01', ends_on: '2026-08-30', registration_code: 'METROCUP',
      notes: 'Open to all metro clubs. Share the code below to invite teams.', created_at: now(), updated_at: now()
    },
    {
      id: 'demo-event-2', league_id: LEAGUE_ID, season_id: 'demo-season-1', name: 'Founders Invitational',
      format: 'round_robin', category: 'U16', status: 'draft', team_cap: 6,
      starts_on: null, ends_on: null, registration_code: 'FOUNDERS1', notes: null, created_at: now(), updated_at: now()
    },
    {
      id: 'demo-event-3', league_id: LEAGUE_ID, season_id: 'demo-season-1', name: 'Metro Knockout Cup',
      format: 'single_elimination', category: 'U16', status: 'active', team_cap: 8,
      starts_on: '2026-09-01', ends_on: '2026-09-15', registration_code: 'KNOCKOUT', notes: null, created_at: now(), updated_at: now()
    },
    {
      id: 'demo-event-4', league_id: LEAGUE_ID, season_id: 'demo-season-1', name: 'Metro Champions Cup',
      format: 'group_knockout', category: 'U18', status: 'active', team_cap: 8,
      starts_on: '2026-10-01', ends_on: '2026-10-20', registration_code: 'CHAMPIONS', notes: null, created_at: now(), updated_at: now()
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
  // Pre-schedule the first few fixtures onto match day. The first two share a
  // venue an hour apart, so the calendar surfaces a venue double-booking.
  const seededSchedule: Record<number, { at: string; venue: string }> = {
    0: { at: '2026-08-15T09:00:00', venue: 'demo-venue-1' },
    1: { at: '2026-08-15T10:00:00', venue: 'demo-venue-1' },
    2: { at: '2026-08-15T13:00:00', venue: 'demo-venue-2' }
  };
  let fixtures: EventFixture[] = roundRobinRounds(teams.map(t => t.id)).map((p, index) => {
    const key = `${p.homeTeamId}|${p.awayTeamId}`;
    const result = seededResults[key];
    const schedule = seededSchedule[index];
    return {
      id: `demo-fixture-${index + 1}`, event_id: 'demo-event-1', league_id: LEAGUE_ID,
      round: p.round, sequence: p.sequence, home_team_id: p.homeTeamId, away_team_id: p.awayTeamId,
      status: result ? 'completed' : 'scheduled', home_score: result ? result[0] : null,
      away_score: result ? result[1] : null, kickoff_at: schedule ? schedule.at : null, venue_id: schedule ? schedule.venue : null,
      home_checked_in: !!result, away_checked_in: !!result, official_name: result ? 'Ref Santos' : null,
      stage: null, group_label: null, created_at: now(), updated_at: now()
    };
  });

  // --- Single-elimination demo event (demo-event-3) --------------------------
  // Six teams (bracket of 8 → a bye in each half). Two round-1 matches are
  // pre-played and advanced, so the semi-finals show real teams and the final
  // is still empty (TBD slots).
  const elimTeams: EventTeam[] = ['Titans', 'Rovers', 'Galaxy', 'Comets', 'Strikers', 'Dynamo'].map((name, i) => ({
    id: `demo-elim-team-${i + 1}`, event_id: 'demo-event-3', league_id: LEAGUE_ID, registration_id: null,
    name, seed: i + 1, created_at: now(), updated_at: now()
  }));
  teams = [...teams, ...elimTeams];

  let elimSeq = 0;
  const elimFixtures: EventFixture[] = singleEliminationBracket(elimTeams.map(t => t.id)).map(spec => ({
    id: `demo-elim-fixture-${++elimSeq}`, event_id: 'demo-event-3', league_id: LEAGUE_ID,
    round: spec.round, sequence: spec.sequence, home_team_id: spec.homeTeamId, away_team_id: spec.awayTeamId,
    status: 'scheduled', home_score: null, away_score: null, kickoff_at: null, venue_id: null,
    home_checked_in: false, away_checked_in: false, official_name: null, stage: null, group_label: null, created_at: now(), updated_at: now()
  }));
  fixtures = [...fixtures, ...elimFixtures];

  // Recompute downstream bracket slots from feeder results (mirrors sync_bracket).
  // Scoped to the knockout stage so group fixtures (which reuse round/sequence
  // numbers) are never treated as feeders.
  const advanceBracketFor = (eventId: string): number => {
    const isKnockout = (f: EventFixture) => (f.stage ?? 'knockout') === 'knockout';
    const winnerOf = (f: EventFixture | undefined): string | null =>
      f && f.status === 'completed' && f.home_score !== null && f.away_score !== null && f.home_score !== f.away_score
        ? (f.home_score > f.away_score ? f.home_team_id : f.away_team_id)
        : null;
    const downstream = fixtures
      .filter(f => f.event_id === eventId && isKnockout(f) && f.round > 1 && f.status !== 'completed')
      .sort((a, b) => a.round - b.round || (a.sequence ?? 0) - (b.sequence ?? 0));
    let updated = 0;
    for (const p of downstream) {
      const seq = p.sequence ?? 0;
      const homeFeeder = fixtures.find(f => f.event_id === eventId && isKnockout(f) && f.round === p.round - 1 && f.sequence === seq * 2 - 1);
      const awayFeeder = fixtures.find(f => f.event_id === eventId && isKnockout(f) && f.round === p.round - 1 && f.sequence === seq * 2);
      const nextHome = homeFeeder ? winnerOf(homeFeeder) : p.home_team_id;
      const nextAway = awayFeeder ? winnerOf(awayFeeder) : p.away_team_id;
      if (nextHome !== p.home_team_id || nextAway !== p.away_team_id) {
        fixtures = fixtures.map(f => f.id === p.id ? { ...f, home_team_id: nextHome, away_team_id: nextAway, updated_at: now() } : f);
        updated += 1;
      }
    }
    return updated;
  };

  const playElim = (id: string, hs: number, as: number) => {
    fixtures = fixtures.map(f => f.id === id
      ? { ...f, home_score: hs, away_score: as, status: 'completed', home_checked_in: true, away_checked_in: true, updated_at: now() }
      : f);
  };
  playElim('demo-elim-fixture-1', 2, 1);
  playElim('demo-elim-fixture-2', 0, 3);
  advanceBracketFor('demo-event-3');

  // --- Group -> knockout demo event (demo-event-4) ---------------------------
  // Six teams in two groups of three. Every group match is played (stronger seed
  // wins), and the knockout is already drawn from the top two of each group, so
  // the semi-finals show real qualifiers and the final is still TBD.
  const gkTeams: EventTeam[] = ['Falcons', 'Sharks', 'Wolves', 'Bears', 'Eagles', 'Lions'].map((name, i) => ({
    id: `demo-gk-team-${i + 1}`, event_id: 'demo-event-4', league_id: LEAGUE_ID, registration_id: null,
    name, seed: i + 1, created_at: now(), updated_at: now()
  }));
  teams = [...teams, ...gkTeams];
  const gkSeed = new Map(gkTeams.map(t => [t.id, t.seed ?? 99]));
  let gkSeq = 0;
  const gkGroupFixtures: EventFixture[] = groupStageFixtureSpecs(drawGroups(gkTeams.map(t => t.id), 2)).map(spec => {
    const homeStronger = (gkSeed.get(spec.homeTeamId) ?? 99) < (gkSeed.get(spec.awayTeamId) ?? 99);
    return {
      id: `demo-gk-fixture-${++gkSeq}`, event_id: 'demo-event-4', league_id: LEAGUE_ID, stage: 'group', group_label: spec.groupLabel,
      round: spec.round, sequence: spec.sequence, home_team_id: spec.homeTeamId, away_team_id: spec.awayTeamId,
      status: 'completed', home_score: homeStronger ? 2 : 1, away_score: homeStronger ? 1 : 2,
      kickoff_at: null, venue_id: null, home_checked_in: true, away_checked_in: true, official_name: null,
      created_at: now(), updated_at: now()
    };
  });
  fixtures = [...fixtures, ...gkGroupFixtures];
  let gkKoSeq = 0;
  const gkKnockoutFixtures: EventFixture[] = singleEliminationBracket(
    qualifiers(groupStageStandings(gkTeams, gkGroupFixtures), 2)
  ).map(spec => ({
    id: `demo-gk-ko-${++gkKoSeq}`, event_id: 'demo-event-4', league_id: LEAGUE_ID, stage: 'knockout', group_label: null,
    round: spec.round, sequence: spec.sequence, home_team_id: spec.homeTeamId, away_team_id: spec.awayTeamId,
    status: 'scheduled', home_score: null, away_score: null, kickoff_at: null, venue_id: null,
    home_checked_in: false, away_checked_in: false, official_name: null, created_at: now(), updated_at: now()
  }));
  fixtures = [...fixtures, ...gkKnockoutFixtures];

  const statRow = (teamId: string, playerName: string, statType: FixtureStatEvent['stat_type']): FixtureStatEvent => ({
    id: newId(), fixture_id: 'demo-fixture-1', event_id: 'demo-event-1', league_id: LEAGUE_ID,
    team_id: teamId, player_name: playerName, stat_type: statType, minute: null, note: null,
    created_at: now(), updated_at: now()
  });
  let statEvents: FixtureStatEvent[] = [
    statRow('demo-team-1', 'A. Ramos', 'goal'),
    statRow('demo-team-1', 'A. Ramos', 'goal'),
    statRow('demo-team-1', 'J. Cruz', 'assist'),
    statRow('demo-team-2', 'M. Lim', 'goal'),
    statRow('demo-team-2', 'M. Lim', 'yellow_card')
  ];

  let awards: EventAward[] = [
    {
      id: 'demo-award-1', event_id: 'demo-event-1', league_id: LEAGUE_ID, title: 'Group Stage Winners',
      recipient_type: 'team', team_id: 'demo-team-1', player_name: null, note: null, created_at: now(), updated_at: now()
    }
  ];

  let ledger: LedgerEntry[] = [
    {
      id: 'demo-ledger-1', league_id: LEAGUE_ID, season_id: 'demo-season-1', event_id: 'demo-event-1', invoice_id: null,
      direction: 'income', category: 'Sponsorship', description: 'Metro Sports Co.', amount_cents: 2500000,
      occurred_on: '2026-07-01', created_at: now(), updated_at: now()
    },
    {
      id: 'demo-ledger-2', league_id: LEAGUE_ID, season_id: 'demo-season-1', event_id: 'demo-event-1', invoice_id: null,
      direction: 'expense', category: 'Referees', description: 'Matchday officials', amount_cents: 600000,
      occurred_on: '2026-07-05', created_at: now(), updated_at: now()
    },
    {
      id: 'demo-ledger-3', league_id: LEAGUE_ID, season_id: 'demo-season-1', event_id: 'demo-event-1', invoice_id: null,
      direction: 'expense', category: 'Venue', description: 'Rizal Memorial hire', amount_cents: 900000,
      occurred_on: '2026-07-06', created_at: now(), updated_at: now()
    }
  ];

  let invoices: EventInvoice[] = [
    {
      id: 'demo-invoice-1', league_id: LEAGUE_ID, event_id: 'demo-event-1', team_id: 'demo-team-1', registration_id: 'demo-reg-1',
      bill_to: 'Bayside FC', description: 'Metro Cup registration', amount_cents: 500000, due_on: '2026-07-20',
      status: 'paid', paid_on: '2026-07-08', created_at: now(), updated_at: now()
    },
    {
      id: 'demo-invoice-2', league_id: LEAGUE_ID, event_id: 'demo-event-1', team_id: 'demo-team-2', registration_id: null,
      bill_to: 'North Stars', description: 'Metro Cup registration', amount_cents: 500000, due_on: '2026-07-20',
      status: 'unpaid', paid_on: null, created_at: now(), updated_at: now()
    }
  ];

  let incidents: EventIncident[] = [
    {
      id: 'demo-incident-1', event_id: 'demo-event-1', league_id: LEAGUE_ID, fixture_id: 'demo-fixture-1', team_id: 'demo-team-1',
      kind: 'injury', summary: 'Bayside #7 subbed off after a knock — cleared by medics.',
      occurred_at: now(), created_at: now(), updated_at: now()
    }
  ];

  const coachRow = (
    id: string, name: string, email: string, status: LeagueCoachMembership['status'], message: string | null
  ): LeagueCoachMembership => ({
    id, league_id: LEAGUE_ID, coach_user_id: `preview-coach-${id}`, coach_name: name, coach_email: email,
    message, status, review_note: null,
    reviewed_by: status === 'active' ? 'preview-owner' : null,
    reviewed_at: status === 'active' ? now() : null,
    created_at: now(), updated_at: now()
  });
  let coachMemberships: LeagueCoachMembership[] = [
    coachRow('cm1', 'Coach Ramirez', 'ramirez@bayside.example', 'active', 'Head coach, Bayside FC youth.'),
    coachRow('cm2', 'Coach Delgado', 'delgado@northstars.example', 'active', null),
    coachRow('cm3', 'Coach Ferrer', 'ferrer@metrounited.example', 'pending', 'Would love to bring our U16s into the league.'),
    coachRow('cm4', 'Coach Santos', 'santos@harbourcity.example', 'pending', null)
  ];

  return {
    listLeagues: async () => leagues,
    createLeague: async (ownerUserId, input) => {
      const row: League = {
        id: newId(), owner_user_id: ownerUserId, name: input.name.trim(),
        short_name: input.shortName?.trim() || null, logo_color: input.logoColor?.trim() || '#f97316',
        contact_email: input.contactEmail?.trim() || null, location: input.location?.trim() || null,
        description: input.description?.trim() || null, timezone: 'Asia/Manila', currency: 'PHP', state: 'active',
        coach_seat_limit: 10, coach_invite_code: genCode(), created_at: now(), updated_at: now()
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
    listLeagueEventTeams: async leagueId => teams.filter(t => t.league_id === leagueId),
    listLeagueFixtures: async leagueId => fixtures
      .filter(f => f.league_id === leagueId)
      .sort((a, b) => a.round - b.round || (a.sequence ?? 0) - (b.sequence ?? 0)),
    listLeagueStatEvents: async leagueId => statEvents.filter(s => s.league_id === leagueId),
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
        home_score: null, away_score: null, kickoff_at: null, venue_id: null,
        home_checked_in: false, away_checked_in: false, official_name: null, stage: null, group_label: null, created_at: now(), updated_at: now()
      }));
      fixtures = [...fixtures, ...generated];
      return generated;
    },
    generateBracket: async (leagueId, eventId) => {
      const eventTeams = teams.filter(t => t.event_id === eventId);
      if (eventTeams.length < 2) throw new Error('NOT_ENOUGH_TEAMS');
      fixtures = fixtures.filter(f => f.event_id !== eventId);
      const ordered = eventTeams.slice().sort((a, b) => (a.seed ?? 9999) - (b.seed ?? 9999));
      const generated: EventFixture[] = singleEliminationBracket(ordered.map(t => t.id)).map(spec => ({
        id: newId(), event_id: eventId, league_id: leagueId, round: spec.round, sequence: spec.sequence,
        home_team_id: spec.homeTeamId, away_team_id: spec.awayTeamId, status: 'scheduled',
        home_score: null, away_score: null, kickoff_at: null, venue_id: null,
        home_checked_in: false, away_checked_in: false, official_name: null, stage: null, group_label: null, created_at: now(), updated_at: now()
      }));
      fixtures = [...fixtures, ...generated];
      return generated;
    },
    syncBracket: async eventId => advanceBracketFor(eventId),
    drawGroupStage: async (leagueId, eventId, groupCount) => {
      const eventTeams = teams.filter(t => t.event_id === eventId);
      if (eventTeams.length < 4) throw new Error('NOT_ENOUGH_TEAMS');
      fixtures = fixtures.filter(f => f.event_id !== eventId);
      const ordered = eventTeams.slice().sort((a, b) => (a.seed ?? 9999) - (b.seed ?? 9999));
      const generated: EventFixture[] = groupStageFixtureSpecs(drawGroups(ordered.map(t => t.id), groupCount)).map(spec => ({
        id: newId(), event_id: eventId, league_id: leagueId, stage: 'group', group_label: spec.groupLabel,
        round: spec.round, sequence: spec.sequence, home_team_id: spec.homeTeamId, away_team_id: spec.awayTeamId,
        status: 'scheduled', home_score: null, away_score: null, kickoff_at: null, venue_id: null,
        home_checked_in: false, away_checked_in: false, official_name: null, created_at: now(), updated_at: now()
      }));
      fixtures = [...fixtures, ...generated];
      return generated;
    },
    generateKnockoutFromGroups: async (leagueId, eventId, advancePerGroup) => {
      const eventTeams = teams.filter(t => t.event_id === eventId);
      const groupFixtures = fixtures.filter(f => f.event_id === eventId && f.stage === 'group');
      if (groupFixtures.length === 0) throw new Error('NO_GROUP_STAGE');
      if (groupFixtures.some(f => f.status !== 'completed')) throw new Error('GROUP_STAGE_INCOMPLETE');
      const qualifierIds = qualifiers(groupStageStandings(eventTeams, groupFixtures), advancePerGroup);
      if (qualifierIds.length < 2) throw new Error('NOT_ENOUGH_QUALIFIERS');
      fixtures = fixtures.filter(f => !(f.event_id === eventId && f.stage === 'knockout'));
      const generated: EventFixture[] = singleEliminationBracket(qualifierIds).map(spec => ({
        id: newId(), event_id: eventId, league_id: leagueId, stage: 'knockout', group_label: null,
        round: spec.round, sequence: spec.sequence, home_team_id: spec.homeTeamId, away_team_id: spec.awayTeamId,
        status: 'scheduled', home_score: null, away_score: null, kickoff_at: null, venue_id: null,
        home_checked_in: false, away_checked_in: false, official_name: null, created_at: now(), updated_at: now()
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
    },
    setFixtureSchedule: async (fixtureId, patch) => {
      fixtures = fixtures.map(f => f.id === fixtureId ? {
        ...f,
        kickoff_at: patch.kickoffAt !== undefined ? (patch.kickoffAt || null) : f.kickoff_at,
        venue_id: patch.venueId !== undefined ? (patch.venueId || null) : f.venue_id,
        updated_at: now()
      } : f);
      return fixtures.find(f => f.id === fixtureId)!;
    },
    listStatEvents: async eventId => statEvents.filter(s => s.event_id === eventId),
    addStatEvent: async (leagueId, eventId, input) => {
      const row: FixtureStatEvent = {
        id: newId(), fixture_id: input.fixtureId, event_id: eventId, league_id: leagueId, team_id: input.teamId,
        player_name: input.playerName.trim(), stat_type: input.statType, minute: input.minute ?? null, note: null,
        created_at: now(), updated_at: now()
      };
      statEvents = [...statEvents, row];
      return row;
    },
    deleteStatEvent: async statEventId => {
      statEvents = statEvents.filter(s => s.id !== statEventId);
    },
    listAwards: async eventId => awards.filter(a => a.event_id === eventId),
    addAward: async (leagueId, eventId, input) => {
      const row: EventAward = {
        id: newId(), event_id: eventId, league_id: leagueId, title: input.title.trim(),
        recipient_type: input.recipientType,
        team_id: input.recipientType === 'team' ? input.teamId ?? null : null,
        player_name: input.recipientType === 'player' ? input.playerName?.trim() || null : null,
        note: input.note?.trim() || null, created_at: now(), updated_at: now()
      };
      awards = [...awards, row];
      return row;
    },
    deleteAward: async awardId => {
      awards = awards.filter(a => a.id !== awardId);
    },
    listLedgerEntries: async leagueId => ledger.filter(l => l.league_id === leagueId),
    addLedgerEntry: async (leagueId, input) => {
      const row: LedgerEntry = {
        id: newId(), league_id: leagueId, season_id: input.seasonId ?? null, event_id: input.eventId ?? null,
        invoice_id: null, direction: input.direction, category: input.category.trim(),
        description: input.description?.trim() || null, amount_cents: Math.max(0, Math.round(input.amountCents)),
        occurred_on: input.occurredOn || now().slice(0, 10), created_at: now(), updated_at: now()
      };
      ledger = [row, ...ledger];
      return row;
    },
    deleteLedgerEntry: async entryId => {
      ledger = ledger.filter(l => l.id !== entryId);
    },
    listInvoices: async leagueId => invoices.filter(i => i.league_id === leagueId),
    addInvoice: async (leagueId, input) => {
      const row: EventInvoice = {
        id: newId(), league_id: leagueId, event_id: input.eventId, team_id: input.teamId ?? null, registration_id: null,
        bill_to: input.billTo.trim(), description: input.description?.trim() || null,
        amount_cents: Math.max(0, Math.round(input.amountCents)), due_on: input.dueOn || null,
        status: 'unpaid', paid_on: null, created_at: now(), updated_at: now()
      };
      invoices = [row, ...invoices];
      return row;
    },
    settleInvoice: async (invoiceId, nextStatus, paidOn) => {
      const invoice = invoices.find(i => i.id === invoiceId);
      if (!invoice) throw new Error('INVOICE_NOT_FOUND');
      const wasPaid = invoice.status === 'paid';
      const paidDate = nextStatus === 'paid' ? (paidOn || now().slice(0, 10)) : null;
      invoices = invoices.map(i => i.id === invoiceId ? { ...i, status: nextStatus, paid_on: paidDate, updated_at: now() } : i);
      // Post a reconciling income entry only on the transition into paid.
      if (nextStatus === 'paid' && !wasPaid) {
        ledger = [{
          id: newId(), league_id: invoice.league_id, season_id: null, event_id: invoice.event_id, invoice_id: invoice.id,
          direction: 'income', category: 'Registration fee', description: `Invoice — ${invoice.bill_to}`,
          amount_cents: invoice.amount_cents, occurred_on: paidDate ?? now().slice(0, 10), created_at: now(), updated_at: now()
        }, ...ledger];
      }
      return invoices.find(i => i.id === invoiceId)!;
    },
    deleteInvoice: async invoiceId => {
      invoices = invoices.filter(i => i.id !== invoiceId);
    },
    setFixtureOps: async (fixtureId, patch) => {
      fixtures = fixtures.map(f => f.id === fixtureId ? {
        ...f,
        home_checked_in: patch.homeCheckedIn ?? f.home_checked_in,
        away_checked_in: patch.awayCheckedIn ?? f.away_checked_in,
        official_name: patch.officialName !== undefined ? (patch.officialName?.trim() || null) : f.official_name,
        updated_at: now()
      } : f);
      return fixtures.find(f => f.id === fixtureId)!;
    },
    listIncidents: async eventId => incidents.filter(i => i.event_id === eventId),
    addIncident: async (leagueId, eventId, input) => {
      const row: EventIncident = {
        id: newId(), event_id: eventId, league_id: leagueId, fixture_id: input.fixtureId ?? null,
        team_id: input.teamId ?? null, kind: input.kind, summary: input.summary.trim(),
        occurred_at: now(), created_at: now(), updated_at: now()
      };
      incidents = [row, ...incidents];
      return row;
    },
    deleteIncident: async incidentId => {
      incidents = incidents.filter(i => i.id !== incidentId);
    },
    listCoachMemberships: async leagueId => coachMemberships.filter(m => m.league_id === leagueId),
    resolveLeagueOrgInvite: async code => {
      const league = leagues.find(l => l.coach_invite_code === code.trim().toUpperCase());
      if (!league) return { found: false };
      const active = coachMemberships.filter(m => m.league_id === league.id && m.status === 'active').length;
      return {
        found: true, leagueId: league.id, leagueName: league.name, location: league.location,
        seatLimit: league.coach_seat_limit, seatsRemaining: Math.max(0, league.coach_seat_limit - active),
        open: active < league.coach_seat_limit
      };
    },
    applyToLeagueOrg: async input => {
      const league = leagues.find(l => l.coach_invite_code === input.code.trim().toUpperCase());
      if (!league) throw new Error('INVALID_INVITE_CODE');
      const row = coachRow(newId(), input.coachName.trim(), input.coachEmail.trim(), 'pending', input.message?.trim() || null);
      row.league_id = league.id;
      coachMemberships = [row, ...coachMemberships];
      return row.id;
    },
    reviewCoachMembership: async (membershipId, nextStatus) => {
      const member = coachMemberships.find(m => m.id === membershipId);
      if (!member) throw new Error('MEMBERSHIP_NOT_FOUND');
      if (nextStatus === 'active' && member.status !== 'active') {
        const league = leagues.find(l => l.id === member.league_id);
        const active = coachMemberships.filter(m => m.league_id === member.league_id && m.status === 'active').length;
        if (league && active >= league.coach_seat_limit) throw new Error('SEAT_LIMIT_REACHED');
      }
      coachMemberships = coachMemberships.map(m => m.id === membershipId
        ? { ...m, status: nextStatus, reviewed_by: 'preview-owner', reviewed_at: now(), updated_at: now() }
        : m);
      return nextStatus;
    },
    rotateCoachInvite: async leagueId => {
      const code = genCode();
      leagues = leagues.map(l => l.id === leagueId ? { ...l, coach_invite_code: code, updated_at: now() } : l);
      return code;
    },
    setCoachSeatLimit: async (leagueId, seatLimit) => {
      const clamped = Math.max(0, Math.min(1000, Math.round(seatLimit)));
      leagues = leagues.map(l => l.id === leagueId ? { ...l, coach_seat_limit: clamped, updated_at: now() } : l);
      return leagues.find(l => l.id === leagueId)!;
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
