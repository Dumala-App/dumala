import { describe, expect, it, vi } from 'vitest';
import type { DumalaSupabaseClient } from './client';
import { createCloudDataAccess } from './dataAccess';
import {
  CloudLeagueError,
  EVENT_STATUS_LABELS,
  computeDiscipline,
  computeScorers,
  computeStandings,
  formatMoney,
  nextEventStatuses,
  nextSeasonStatuses,
  roundRobinRounds,
  SEASON_STATUS_LABELS,
  spotsRemaining,
  suggestAwards,
  summarizeLedger,
  summarizeMatchday,
  type EventFixture,
  type EventInvoice,
  type FixtureStatEvent,
  type EventTeam,
  type LedgerEntry,
  type StandingRow
} from './league';

const createTableStub = (result: unknown, error: unknown = null) => {
  const query: Record<string, unknown> = {};
  const chain = () => query;
  for (const method of ['insert', 'select', 'update', 'delete', 'eq', 'order']) {
    query[method] = vi.fn(chain);
  }
  query.single = vi.fn().mockResolvedValue({ data: result, error });
  (query as { then: unknown }).then = (resolve: (v: { data: unknown; error: unknown }) => void) =>
    resolve({ data: result, error });
  const rpc = vi.fn().mockResolvedValue({ data: result, error });
  const from = vi.fn(() => query);
  return { client: { from, rpc } as unknown as DumalaSupabaseClient, from, rpc, query };
};

describe('season lifecycle helper', () => {
  it('advances forward one step at a time', () => {
    expect(nextSeasonStatuses('draft')).toEqual(['registration_open']);
    expect(nextSeasonStatuses('registration_open')).toEqual(['active']);
    expect(nextSeasonStatuses('active')).toEqual(['completed']);
    expect(nextSeasonStatuses('completed')).toEqual(['archived']);
  });

  it('has no next status once archived', () => {
    expect(nextSeasonStatuses('archived')).toEqual([]);
  });

  it('labels every status', () => {
    expect(SEASON_STATUS_LABELS.registration_open).toBe('Registration open');
    expect(Object.keys(SEASON_STATUS_LABELS)).toHaveLength(5);
  });
});

describe('event lifecycle + capacity helpers', () => {
  it('advances an event forward one step at a time and stops when completed', () => {
    expect(nextEventStatuses('draft')).toEqual(['registration_open']);
    expect(nextEventStatuses('registration_open')).toEqual(['active']);
    expect(nextEventStatuses('active')).toEqual(['completed']);
    expect(nextEventStatuses('completed')).toEqual([]);
  });

  it('labels every event status', () => {
    expect(EVENT_STATUS_LABELS.registration_open).toBe('Registration open');
    expect(Object.keys(EVENT_STATUS_LABELS)).toHaveLength(4);
  });

  it('computes spots remaining, clamping at zero and passing through an uncapped event', () => {
    expect(spotsRemaining(8, 3)).toBe(5);
    expect(spotsRemaining(4, 4)).toBe(0);
    expect(spotsRemaining(4, 9)).toBe(0);
    expect(spotsRemaining(null, 3)).toBeNull();
    expect(spotsRemaining(undefined, 0)).toBeNull();
  });
});

describe('tournament pure helpers', () => {
  const team = (id: string, name: string): EventTeam => ({
    id, event_id: 'e', league_id: 'l', registration_id: null, name, seed: null, created_at: '', updated_at: ''
  });
  const fixture = (
    home: string, away: string, hs: number | null, as: number | null,
    status: EventFixture['status'] = 'completed'
  ): EventFixture => ({
    id: `${home}-${away}`, event_id: 'e', league_id: 'l', round: 1, sequence: 1,
    home_team_id: home, away_team_id: away, status, home_score: hs, away_score: as,
    kickoff_at: null, venue_id: null, home_checked_in: false, away_checked_in: false, official_name: null,
    created_at: '', updated_at: ''
  });

  const unordered = (p: { homeTeamId: string; awayTeamId: string }) => [p.homeTeamId, p.awayTeamId].sort().join('-');

  it('schedules a full single round-robin for an even field', () => {
    const pairings = roundRobinRounds(['a', 'b', 'c', 'd']);
    expect(pairings).toHaveLength(6); // 4C2
    expect(Math.max(...pairings.map(p => p.round))).toBe(3);
    expect(new Set(pairings.map(unordered)).size).toBe(6); // every pair exactly once
  });

  it('gives each team a bye for an odd field', () => {
    const pairings = roundRobinRounds(['a', 'b', 'c']);
    expect(pairings).toHaveLength(3); // 3C2
    expect(Math.max(...pairings.map(p => p.round))).toBe(3); // one match per round + a bye
    expect(new Set(pairings.map(unordered)).size).toBe(3);
  });

  it('returns nothing for fewer than two teams', () => {
    expect(roundRobinRounds([])).toEqual([]);
    expect(roundRobinRounds(['a'])).toEqual([]);
  });

  it('builds a league table sorted by points, then goal difference', () => {
    const teams = [team('a', 'Alpha'), team('b', 'Bravo'), team('c', 'Charlie')];
    const fixtures = [
      fixture('a', 'b', 2, 1),
      fixture('a', 'c', 0, 0),
      fixture('b', 'c', 3, 0),
      fixture('a', 'c', 5, 0, 'scheduled') // not completed → ignored
    ];
    const table = computeStandings(teams, fixtures);
    expect(table.map(r => r.teamId)).toEqual(['a', 'b', 'c']);
    expect(table[0]).toMatchObject({ played: 2, won: 1, drawn: 1, lost: 0, points: 4, goalDifference: 1 });
    expect(table[1]).toMatchObject({ points: 3, goalDifference: 2 });
    expect(table[2]).toMatchObject({ points: 1, goalDifference: -3 });
  });
});

describe('statistics + awards pure helpers', () => {
  const stat = (teamId: string, playerName: string, statType: FixtureStatEvent['stat_type']): FixtureStatEvent => ({
    id: `${teamId}-${playerName}-${statType}-${Math.random()}`, fixture_id: 'f', event_id: 'e', league_id: 'l',
    team_id: teamId, player_name: playerName, stat_type: statType, minute: null, note: null, created_at: '', updated_at: ''
  });

  it('ranks scorers by goals then assists, ignoring card-only players', () => {
    const scorers = computeScorers([
      stat('a', 'Cruz', 'goal'), stat('a', 'Cruz', 'goal'), stat('a', 'Cruz', 'assist'),
      stat('b', 'Reyes', 'goal'), stat('b', 'Santos', 'assist'),
      stat('a', 'Cruz', 'yellow_card')
    ]);
    expect(scorers.map(s => s.playerName)).toEqual(['Cruz', 'Reyes', 'Santos']);
    expect(scorers[0]).toMatchObject({ goals: 2, assists: 1 });
    expect(scorers[2]).toMatchObject({ goals: 0, assists: 1 });
  });

  it('tallies discipline, red before yellow', () => {
    const table = computeDiscipline([
      stat('a', 'Cruz', 'yellow_card'), stat('a', 'Cruz', 'yellow_card'),
      stat('b', 'Reyes', 'red_card'), stat('a', 'Cruz', 'goal')
    ]);
    expect(table.map(r => r.playerName)).toEqual(['Reyes', 'Cruz']);
    expect(table[0]).toMatchObject({ red: 1, yellow: 0 });
    expect(table[1]).toMatchObject({ red: 0, yellow: 2 });
  });

  it('suggests the standings leader and top scorer for awards', () => {
    const standings: StandingRow[] = [
      { teamId: 'a', name: 'Alpha', played: 2, won: 2, drawn: 0, lost: 0, goalsFor: 5, goalsAgainst: 1, goalDifference: 4, points: 6 },
      { teamId: 'b', name: 'Bravo', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 }
    ];
    const scorers = computeScorers([stat('a', 'Cruz', 'goal')]);
    expect(suggestAwards(standings, scorers)).toEqual({
      champion: { teamId: 'a', name: 'Alpha' },
      topScorer: { teamId: 'a', playerName: 'Cruz', goals: 1 }
    });
    expect(suggestAwards([], [])).toEqual({ champion: null, topScorer: null });
  });
});

describe('matchday readiness helper', () => {
  const fx = (status: EventFixture['status'], home: boolean, away: boolean): EventFixture => ({
    id: `${status}-${home}-${away}-${Math.random()}`, event_id: 'e', league_id: 'l', round: 1, sequence: 1,
    home_team_id: 'a', away_team_id: 'b', status, home_score: null, away_score: null, kickoff_at: null, venue_id: null,
    home_checked_in: home, away_checked_in: away, official_name: null, created_at: '', updated_at: ''
  });

  it('counts completed, ready (both checked in), and awaiting check-in', () => {
    expect(summarizeMatchday([
      fx('completed', true, true),
      fx('scheduled', true, true),   // ready
      fx('scheduled', true, false),  // awaiting
      fx('scheduled', false, false), // awaiting
      fx('cancelled', false, false)  // ignored
    ])).toEqual({ total: 5, completed: 1, ready: 1, awaitingCheckin: 2 });
  });
});

describe('finance pure helpers', () => {
  const entry = (direction: LedgerEntry['direction'], amount: number): LedgerEntry => ({
    id: `${direction}-${amount}-${Math.random()}`, league_id: 'l', season_id: null, event_id: null, invoice_id: null,
    direction, category: 'x', description: null, amount_cents: amount, occurred_on: '2026-07-01', created_at: '', updated_at: ''
  });
  const invoice = (amount: number, status: EventInvoice['status']): EventInvoice => ({
    id: `${amount}-${status}-${Math.random()}`, league_id: 'l', event_id: 'e', team_id: null, registration_id: null,
    bill_to: 'FC', description: null, amount_cents: amount, due_on: null, status, paid_on: null, created_at: '', updated_at: ''
  });

  it('formats minor units as a currency amount with grouping', () => {
    expect(formatMoney(150000, 'PHP')).toBe('PHP 1,500.00');
    expect(formatMoney(0)).toBe('PHP 0.00');
    expect(formatMoney(2599, 'USD')).toBe('USD 25.99');
  });

  it('summarizes ledger totals and invoice collection, excluding waived invoices', () => {
    const summary = summarizeLedger(
      [entry('income', 100000), entry('income', 50000), entry('expense', 30000)],
      [invoice(50000, 'paid'), invoice(20000, 'unpaid'), invoice(99999, 'waived')]
    );
    expect(summary).toEqual({
      incomeCents: 150000,
      expenseCents: 30000,
      netCents: 120000,
      invoicedCents: 70000,      // waived excluded
      collectedCents: 50000,
      outstandingCents: 20000
    });
  });
});

describe('cloud league repository', () => {
  it('creates a league with the owner id and normalized fields', async () => {
    const saved = { id: 'league-1', name: 'Metro League' };
    const { client, from, query } = createTableStub(saved);

    await expect(
      createCloudDataAccess(client).league.createLeague('owner-1', {
        name: '  Metro League  ',
        location: ' Manila ',
        contactEmail: null
      })
    ).resolves.toEqual(saved);

    expect(from).toHaveBeenCalledWith('leagues');
    expect(query.insert).toHaveBeenCalledWith({
      owner_user_id: 'owner-1',
      name: 'Metro League',
      short_name: null,
      logo_color: '#f97316',
      contact_email: null,
      location: 'Manila',
      description: null
    });
  });

  it('creates a season under a league', async () => {
    const { client, from, query } = createTableStub({ id: 'season-1' });
    await createCloudDataAccess(client).league.createSeason('league-1', { name: 'Season 2026', year: 2026 });
    expect(from).toHaveBeenCalledWith('league_seasons');
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ league_id: 'league-1', name: 'Season 2026', year: 2026 }));
  });

  it('advances a season status through the RPC', async () => {
    const { client, rpc } = createTableStub('active');
    await expect(
      createCloudDataAccess(client).league.advanceSeasonStatus('season-1', 'active')
    ).resolves.toBe('active');
    expect(rpc).toHaveBeenCalledWith('advance_season_status', { season_id: 'season-1', next_status: 'active' });
  });

  it('creates an event under a league with a default format', async () => {
    const { client, from, query } = createTableStub({ id: 'event-1' });
    await createCloudDataAccess(client).league.createEvent('league-1', { seasonId: 'season-1', name: '  Metro Cup  ' });
    expect(from).toHaveBeenCalledWith('league_events');
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({
      league_id: 'league-1',
      season_id: 'season-1',
      name: 'Metro Cup',
      format: 'round_robin',
      team_cap: null
    }));
  });

  it('advances an event status through the RPC', async () => {
    const { client, rpc } = createTableStub('registration_open');
    await expect(
      createCloudDataAccess(client).league.advanceEventStatus('event-1', 'registration_open')
    ).resolves.toBe('registration_open');
    expect(rpc).toHaveBeenCalledWith('advance_event_status', { event_id: 'event-1', next_status: 'registration_open' });
  });

  it('submits a public registration, normalizing the code and fields', async () => {
    const { client, rpc } = createTableStub('registration-1');
    await expect(
      createCloudDataAccess(client).league.submitEventRegistration({
        code: ' alphacup1 ',
        clubName: '  Rovers FC ',
        contactName: ' Coach One ',
        contactEmail: '  coach@example.test '
      })
    ).resolves.toBe('registration-1');
    expect(rpc).toHaveBeenCalledWith('submit_event_registration', expect.objectContaining({
      code: 'ALPHACUP1',
      club_name: 'Rovers FC',
      contact_name: 'Coach One',
      contact_email: 'coach@example.test',
      team_name: null,
      roster_size: null
    }));
  });

  it('surfaces errors as CloudLeagueError', async () => {
    const { client } = createTableStub(null, { message: 'denied' });
    await expect(createCloudDataAccess(client).league.listLeagues()).rejects.toBeInstanceOf(CloudLeagueError);
  });
});
