import { describe, expect, it, vi } from 'vitest';
import type { DumalaSupabaseClient } from './client';
import { createCloudDataAccess } from './dataAccess';
import {
  CloudLeagueError,
  EVENT_STATUS_LABELS,
  activeRosterForTeam,
  autoScheduleFixtures,
  buildFixtureCalendar,
  buildStatDatabase,
  bracketRoundName,
  bracketWinnerId,
  computeDiscipline,
  computeScorers,
  computeStandings,
  drawGroups,
  fixtureAdvancementTarget,
  formatMoney,
  groupStageFixtureSpecs,
  groupStageStandings,
  isEventFinished,
  qualifiers,
  nextPowerOfTwo,
  seedPositions,
  singleEliminationBracket,
  nextEventStatuses,
  nextSeasonStatuses,
  summarizeMatchSheet,
  roundRobinRounds,
  SEASON_STATUS_LABELS,
  spotsRemaining,
  suggestAwards,
  summarizeRoster,
  summarizeCoachSeats,
  summarizeCompetition,
  summarizeLedger,
  summarizeMatchday,
  type EventIncident,
  type EventFixture,
  type EventInvoice,
  type EventRosterPlayer,
  type FixtureStatEvent,
  type EventTeam,
  type LeagueCoachMembership,
  type LeagueEvent,
  type LeagueVenue,
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
  it('advances an event forward one step at a time and stops when archived', () => {
    expect(nextEventStatuses('draft')).toEqual(['registration_open']);
    expect(nextEventStatuses('registration_open')).toEqual(['active']);
    expect(nextEventStatuses('active')).toEqual(['completed']);
    expect(nextEventStatuses('completed')).toEqual(['archived']);
    expect(nextEventStatuses('archived')).toEqual([]);
  });

  it('treats only completed and archived events as finished', () => {
    expect(isEventFinished('draft')).toBe(false);
    expect(isEventFinished('registration_open')).toBe(false);
    expect(isEventFinished('active')).toBe(false);
    expect(isEventFinished('completed')).toBe(true);
    expect(isEventFinished('archived')).toBe(true);
  });

  it('labels every event status', () => {
    expect(EVENT_STATUS_LABELS.registration_open).toBe('Registration open');
    expect(Object.keys(EVENT_STATUS_LABELS)).toHaveLength(5);
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
    kickoff_at: null, venue_id: null, home_checked_in: false, away_checked_in: false, official_name: null, stage: null, group_label: null,
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

describe('event roster helpers', () => {
  const team = (id: string, locked = false): EventTeam => ({
    id, event_id: 'e', league_id: 'l', registration_id: null, name: id.toUpperCase(), seed: null,
    roster_locked: locked, roster_locked_at: locked ? '2026-07-18T00:00:00Z' : null, roster_locked_by: locked ? 'u' : null,
    created_at: '', updated_at: ''
  });
  const player = (status: EventRosterPlayer['status']): EventRosterPlayer => ({
    id: `${status}-${Math.random()}`, event_id: 'e', league_id: 'l', team_id: 'a', registration_id: null,
    transfer_from_team_id: null, full_name: 'Player', birthdate: null, shirt_number: null, status,
    transfer_note: null, transferred_at: null, created_at: '', updated_at: ''
  });

  it('summarizes roster statuses, locks, and season windows', () => {
    const summary = summarizeRoster(
      [team('a', true), team('b')],
      [player('active'), player('active'), player('transferred'), player('released')],
      {
        roster_deadline: '2026-07-20',
        transfer_window_opens_on: '2026-07-01',
        transfer_window_closes_on: '2026-07-31'
      },
      new Date('2026-07-18T12:00:00Z')
    );
    expect(summary).toEqual({
      active: 2,
      transferred: 1,
      released: 1,
      lockedTeams: 1,
      totalTeams: 2,
      rosterWindowOpen: true,
      transferWindowOpen: true
    });
  });

  it('closes roster and transfer windows from season dates', () => {
    const summary = summarizeRoster(
      [],
      [],
      {
        roster_deadline: '2026-07-10',
        transfer_window_opens_on: '2026-07-01',
        transfer_window_closes_on: '2026-07-10'
      },
      new Date('2026-07-18T12:00:00Z')
    );
    expect(summary.rosterWindowOpen).toBe(false);
    expect(summary.transferWindowOpen).toBe(false);
  });

  it('returns only active players for a team ordered by shirt number then name', () => {
    const players: EventRosterPlayer[] = [
      { id: 'p3', event_id: 'e', league_id: 'l', team_id: 'a', transfer_from_team_id: null, registration_id: null, full_name: 'Zed', birthdate: null, shirt_number: null, status: 'active', transfer_note: null, transferred_at: null, created_at: '', updated_at: '' },
      { id: 'p1', event_id: 'e', league_id: 'l', team_id: 'a', transfer_from_team_id: null, registration_id: null, full_name: 'Ari', birthdate: null, shirt_number: 7, status: 'active', transfer_note: null, transferred_at: null, created_at: '', updated_at: '' },
      { id: 'p2', event_id: 'e', league_id: 'l', team_id: 'a', transfer_from_team_id: null, registration_id: null, full_name: 'Bea', birthdate: null, shirt_number: 7, status: 'active', transfer_note: null, transferred_at: null, created_at: '', updated_at: '' },
      { id: 'p4', event_id: 'e', league_id: 'l', team_id: 'a', transfer_from_team_id: null, registration_id: null, full_name: 'Released', birthdate: null, shirt_number: 1, status: 'released', transfer_note: null, transferred_at: null, created_at: '', updated_at: '' },
      { id: 'p5', event_id: 'e', league_id: 'l', team_id: 'b', transfer_from_team_id: null, registration_id: null, full_name: 'Other', birthdate: null, shirt_number: 2, status: 'active', transfer_note: null, transferred_at: null, created_at: '', updated_at: '' }
    ];

    expect(activeRosterForTeam(players, 'a').map(p => p.full_name)).toEqual(['Ari', 'Bea', 'Zed']);
    expect(activeRosterForTeam(players, null)).toEqual([]);
  });
});

describe('knockout bracket helpers', () => {
  const pairKey = (s: { homeTeamId: string | null; awayTeamId: string | null }) =>
    [s.homeTeamId, s.awayTeamId].sort().join('-');

  it('rounds up to the next power of two', () => {
    expect([1, 2, 3, 5, 8, 9].map(nextPowerOfTwo)).toEqual([1, 2, 4, 8, 8, 16]);
  });

  it('produces standard seed slot orders', () => {
    expect(seedPositions(2)).toEqual([1, 2]);
    expect(seedPositions(4)).toEqual([1, 4, 2, 3]);
    expect(seedPositions(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });

  it('builds a full bracket for a power-of-two field', () => {
    const specs = singleEliminationBracket(['a', 'b', 'c', 'd']);
    const r1 = specs.filter(s => s.round === 1);
    const r2 = specs.filter(s => s.round === 2);
    expect(r1).toHaveLength(2);
    expect(r2).toHaveLength(1);
    // Top seed a meets bottom seed d; b meets c. The final starts empty.
    expect(new Set(r1.map(pairKey))).toEqual(new Set(['a-d', 'b-c']));
    expect(r2[0]).toMatchObject({ homeTeamId: null, awayTeamId: null });
  });

  it('gives odd fields a bye that pre-advances into round two', () => {
    // 3 teams → bracket of 4, one bye. Seed 1 (a) draws the bye and skips to the final.
    const specs = singleEliminationBracket(['a', 'b', 'c']);
    const r1 = specs.filter(s => s.round === 1);
    const final = specs.find(s => s.round === 2)!;
    expect(r1).toHaveLength(1);                 // only b vs c is actually played
    expect(pairKey(r1[0])).toBe('b-c');
    expect(final.homeTeamId).toBe('a');         // a pre-advanced via the bye
    expect(final.awayTeamId).toBeNull();        // awaits the b/c winner
  });

  it('returns nothing for fewer than two teams', () => {
    expect(singleEliminationBracket([])).toEqual([]);
    expect(singleEliminationBracket(['solo'])).toEqual([]);
  });

  const fixture = (home: string | null, away: string | null, hs: number | null, as: number | null, status: EventFixture['status'] = 'completed'): EventFixture => ({
    id: 'f', event_id: 'e', league_id: 'l', round: 1, sequence: 1, home_team_id: home, away_team_id: away,
    status, home_score: hs, away_score: as, kickoff_at: null, venue_id: null,
    home_checked_in: false, away_checked_in: false, official_name: null, stage: null, group_label: null, created_at: '', updated_at: ''
  });

  it('resolves a decisive winner but not a draw or an unplayed match', () => {
    expect(bracketWinnerId(fixture('a', 'b', 2, 1))).toBe('a');
    expect(bracketWinnerId(fixture('a', 'b', 0, 3))).toBe('b');
    expect(bracketWinnerId(fixture('a', 'b', 1, 1))).toBeNull();
    expect(bracketWinnerId(fixture('a', 'b', null, null, 'scheduled'))).toBeNull();
  });

  it('describes the next knockout slot for a decisive result', () => {
    const opening = fixture('a', 'b', 2, 1);
    opening.id = 'semi-1';
    opening.sequence = 1;
    const otherSemi = fixture('c', 'd', 0, 3);
    otherSemi.id = 'semi-2';
    otherSemi.sequence = 2;
    const final = fixture(null, null, null, null, 'scheduled');
    final.id = 'final';
    final.round = 2;
    final.sequence = 1;

    expect(fixtureAdvancementTarget(opening, [opening, otherSemi, final])).toEqual({
      winnerId: 'a',
      nextFixtureId: 'final',
      nextRound: 2,
      nextSequence: 1,
      slot: 'home'
    });
    expect(fixtureAdvancementTarget(otherSemi, [opening, otherSemi, final])?.slot).toBe('away');
    expect(fixtureAdvancementTarget(final, [opening, otherSemi, final])).toBeNull();
  });

  it('does not expose advancement for group-stage matches or draws', () => {
    const group = fixture('a', 'b', 2, 1);
    group.stage = 'group';
    const draw = fixture('a', 'b', 1, 1);
    expect(fixtureAdvancementTarget(group, [group])).toBeNull();
    expect(fixtureAdvancementTarget(draw, [draw])).toBeNull();
  });

  it('names rounds from the end of the bracket', () => {
    expect(bracketRoundName(3, 3)).toBe('Final');
    expect(bracketRoundName(2, 3)).toBe('Semi-finals');
    expect(bracketRoundName(1, 3)).toBe('Quarter-finals');
    expect(bracketRoundName(1, 4)).toBe('Round of 16');
  });
});

describe('group stage helpers', () => {
  const team = (id: string, name: string): EventTeam => ({
    id, event_id: 'e', league_id: 'l', registration_id: null, name, seed: null, created_at: '', updated_at: ''
  });
  const groupFixture = (group: string, home: string, away: string, hs: number, as: number): EventFixture => ({
    id: `${group}-${home}-${away}`, event_id: 'e', league_id: 'l', round: 1, sequence: 1,
    home_team_id: home, away_team_id: away, status: 'completed', home_score: hs, away_score: as,
    kickoff_at: null, venue_id: null, home_checked_in: false, away_checked_in: false, official_name: null,
    stage: 'group', group_label: group, created_at: '', updated_at: ''
  });

  it('distributes teams across groups round-robin, clamping to at most n/2 groups', () => {
    const groups = drawGroups(['a', 'b', 'c', 'd', 'e', 'f'], 2);
    expect(groups.map(g => g.label)).toEqual(['A', 'B']);
    expect(groups[0].teamIds).toEqual(['a', 'c', 'e']);
    expect(groups[1].teamIds).toEqual(['b', 'd', 'f']);
    // Asking for more groups than teams allow is clamped so each group has >= 2.
    expect(drawGroups(['a', 'b', 'c', 'd'], 9)).toHaveLength(2);
  });

  it('generates a round robin within each group', () => {
    const specs = groupStageFixtureSpecs(drawGroups(['a', 'b', 'c', 'd'], 2));
    // Two groups of two → one match each.
    expect(specs).toHaveLength(2);
    expect(new Set(specs.map(s => s.groupLabel))).toEqual(new Set(['A', 'B']));
    expect(specs.every(s => s.homeTeamId && s.awayTeamId)).toBe(true);
  });

  it('builds per-group standings and cross-seeds the qualifiers', () => {
    const teams = ['a', 'b', 'c', 'd'].map(id => team(id, id.toUpperCase()));
    // Group A: a beats b. Group B: c beats d.
    const fixtures = [groupFixture('A', 'a', 'b', 3, 0), groupFixture('B', 'c', 'd', 2, 1)];
    const standings = groupStageStandings(teams, fixtures);
    expect(standings.map(s => s.label)).toEqual(['A', 'B']);
    expect(standings[0].rows[0].teamId).toBe('a'); // A winner
    expect(standings[1].rows[0].teamId).toBe('c'); // B winner

    // Advance 2 per group → winners first, then runners-up: [A1, B1, A2, B2].
    expect(qualifiers(standings, 2)).toEqual(['a', 'c', 'b', 'd']);
    // Advance 1 per group → just the winners.
    expect(qualifiers(standings, 1)).toEqual(['a', 'c']);
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
    home_checked_in: home, away_checked_in: away, official_name: null, stage: null, group_label: null, created_at: '', updated_at: ''
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

  it('summarizes one match sheet from roster, stats, and incidents', () => {
    const fixture = fx('scheduled', true, true);
    fixture.id = 'fixture-1';
    fixture.home_team_id = 'home';
    fixture.away_team_id = 'away';
    const roster = (teamId: string, status: EventRosterPlayer['status'] = 'active'): EventRosterPlayer => ({
      id: `${teamId}-${status}-${Math.random()}`, event_id: 'e', league_id: 'l', team_id: teamId, registration_id: null,
      transfer_from_team_id: null, full_name: 'Player', birthdate: null, shirt_number: null, status,
      transfer_note: null, transferred_at: null, created_at: '', updated_at: ''
    });
    const stat = (fixtureId: string, type: FixtureStatEvent['stat_type']): FixtureStatEvent => ({
      id: `${fixtureId}-${type}-${Math.random()}`, fixture_id: fixtureId, event_id: 'e', league_id: 'l',
      team_id: 'home', player_name: 'Player', stat_type: type, minute: null, note: null, created_at: '', updated_at: ''
    });
    const incident = (fixtureId: string | null): EventIncident => ({
      id: `${fixtureId ?? 'none'}-${Math.random()}`, event_id: 'e', league_id: 'l', fixture_id: fixtureId,
      team_id: null, kind: 'delay', summary: 'Delay', occurred_at: '', created_at: '', updated_at: ''
    });

    expect(summarizeMatchSheet(
      fixture,
      [roster('home'), roster('home', 'released'), roster('away'), roster('away')],
      [stat('fixture-1', 'goal'), stat('fixture-1', 'own_goal'), stat('fixture-1', 'assist'), stat('fixture-1', 'yellow_card'), stat('fixture-1', 'red_card'), stat('other', 'goal')],
      [incident('fixture-1'), incident(null)]
    )).toEqual({
      homeActiveRoster: 1,
      awayActiveRoster: 2,
      goals: 2,
      assists: 1,
      yellowCards: 1,
      redCards: 1,
      incidents: 1
    });
  });
});

describe('competition rollup helper', () => {
  const event = (id: string, status: LeagueEvent['status'], name = id): LeagueEvent => ({
    id, league_id: 'l', season_id: 's', name, format: 'round_robin', category: 'U14', status,
    team_cap: null, starts_on: null, ends_on: null, registration_code: id.toUpperCase(), is_public: false, notes: null,
    created_at: '', updated_at: ''
  });
  const team = (id: string, eventId: string, name: string): EventTeam => ({
    id, event_id: eventId, league_id: 'l', registration_id: null, name, seed: null, created_at: '', updated_at: ''
  });
  const fixture = (
    id: string, eventId: string, home: string, away: string,
    hs: number | null, as: number | null, status: EventFixture['status'], updatedAt = ''
  ): EventFixture => ({
    id, event_id: eventId, league_id: 'l', round: 1, sequence: 1, home_team_id: home, away_team_id: away,
    status, home_score: hs, away_score: as, kickoff_at: null, venue_id: null,
    home_checked_in: false, away_checked_in: false, official_name: null, stage: null, group_label: null, created_at: '', updated_at: updatedAt
  });
  const stat = (eventId: string, teamId: string, player: string, type: FixtureStatEvent['stat_type']): FixtureStatEvent => ({
    id: `${teamId}-${player}-${type}-${Math.random()}`, fixture_id: 'f', event_id: eventId, league_id: 'l',
    team_id: teamId, player_name: player, stat_type: type, minute: null, note: null, created_at: '', updated_at: ''
  });

  it('is empty and inactive when there is nothing to roll up', () => {
    const summary = summarizeCompetition([], [], [], []);
    expect(summary.hasActivity).toBe(false);
    expect(summary.standings).toEqual([]);
    expect(summary.scorers).toEqual([]);
    expect(summary.recentResults).toEqual([]);
    expect(summary.liveMatchday).toEqual({ total: 0, completed: 0, ready: 0, awaitingCheckin: 0 });
  });

  it('rolls standings, scorers, match day, and results across events', () => {
    const events = [
      event('e1', 'active', 'Metro Cup'),
      event('e2', 'completed', 'Spring Cup'),
      event('e3', 'active', 'Empty Cup')       // excluded from standings: no results
    ];
    const teams = [
      team('a', 'e1', 'Alpha'), team('b', 'e1', 'Bravo'),
      team('c', 'e2', 'Charlie'), team('d', 'e2', 'Delta'),
      team('e', 'e3', 'Echo'), team('f', 'e3', 'Foxtrot')
    ];
    const fixtures = [
      fixture('f1', 'e1', 'a', 'b', 3, 1, 'completed', '2026-07-10T10:00:00Z'),
      fixture('f2', 'e1', 'b', 'a', 0, 0, 'scheduled'),           // ready=false → awaiting
      fixture('f3', 'e2', 'c', 'd', 5, 0, 'completed', '2026-07-11T10:00:00Z'),
      fixture('f4', 'e3', 'e', 'f', null, null, 'scheduled')      // active, no result
    ];
    const stats = [
      stat('e1', 'a', 'Ramos', 'goal'), stat('e1', 'a', 'Ramos', 'goal'), stat('e1', 'a', 'Cruz', 'assist'),
      stat('e1', 'b', 'Lim', 'goal'), stat('e1', 'b', 'Lim', 'yellow_card')
    ];

    const summary = summarizeCompetition(events, teams, fixtures, stats);

    // e1 and e2 both have a result; e3 has none. Active events sort ahead.
    expect(summary.standings.map(s => s.eventId)).toEqual(['e1', 'e2']);
    expect(summary.standings[0].leaders[0]).toMatchObject({ name: 'Alpha', points: 3 });
    expect(summary.standings[0]).toMatchObject({ playedFixtures: 1, totalFixtures: 2 });

    // League-wide scorers decorated with team + event names.
    expect(summary.scorers[0]).toMatchObject({ playerName: 'Ramos', goals: 2, teamName: 'Alpha', eventName: 'Metro Cup' });
    // computeScorers keeps assist-only players (Cruz), ranked last behind the goalscorers.
    expect(summary.scorers.map(s => s.playerName)).toEqual(['Ramos', 'Lim', 'Cruz']);

    // Live match day is scoped to active events e1 + e3 (draft e2 excluded).
    expect(summary.liveMatchday).toEqual({ total: 3, completed: 1, ready: 0, awaitingCheckin: 2 });
    expect(summary.activeEventCount).toBe(2);

    // Recent results include both completed fixtures, newest first, with names.
    expect(summary.recentResults.map(r => r.fixtureId)).toEqual(['f3', 'f1']);
    expect(summary.recentResults[1]).toMatchObject({ homeTeamName: 'Alpha', awayTeamName: 'Bravo', homeScore: 3, awayScore: 1 });
    expect(summary.hasActivity).toBe(true);
  });
});

describe('statistics database helper', () => {
  const team = (id: string, eventId: string, name: string): EventTeam => ({
    id, event_id: eventId, league_id: 'l', registration_id: null, name, seed: null, created_at: '', updated_at: ''
  });
  const stat = (
    eventId: string, fixtureId: string, teamId: string, player: string, type: FixtureStatEvent['stat_type'], createdAt = ''
  ): FixtureStatEvent => ({
    id: `${teamId}-${player}-${type}-${Math.random()}`, fixture_id: fixtureId, event_id: eventId, league_id: 'l',
    team_id: teamId, player_name: player, stat_type: type, minute: null, note: null, created_at: createdAt, updated_at: ''
  });

  it('aggregates per-player and per-team records with correct totals', () => {
    const teams = [team('t1', 'e1', 'Bayside FC'), team('t2', 'e1', 'North Stars')];
    const stats = [
      stat('e1', 'fx1', 't1', 'Ramos', 'goal'),
      stat('e1', 'fx1', 't1', 'Ramos', 'goal'),
      stat('e1', 'fx2', 't1', 'Ramos', 'assist'),
      stat('e1', 'fx1', 't1', 'Cruz', 'assist'),
      stat('e1', 'fx1', 't2', 'Lim', 'goal'),
      stat('e1', 'fx2', 't2', 'Lim', 'yellow_card'),
      stat('e1', 'fx2', 't2', 'Reyes', 'red_card'),
      stat('e1', 'fx1', 't1', ' Owngoal ', 'own_goal')
    ];
    const db = buildStatDatabase(stats, teams);

    const ramos = db.players.find(p => p.playerName === 'Ramos');
    expect(ramos).toMatchObject({ teamName: 'Bayside FC', goals: 2, assists: 1, goalContributions: 3, matches: 2, events: 1 });
    // Ramos ranks first (most goals), and the leaderboard is goal-sorted.
    expect(db.players[0].playerName).toBe('Ramos');

    const bayside = db.teams.find(t => t.teamName === 'Bayside FC');
    expect(bayside).toMatchObject({ goals: 2, assists: 2, ownGoals: 1, players: 3 });

    expect(db.totals).toMatchObject({
      goals: 3, assists: 2, ownGoals: 1, yellow: 1, red: 1,
      records: 8, players: 5, teams: 2, matches: 2
    });
  });

  it('merges a club + player across events but keeps different clubs apart', () => {
    // Same club name across two events (distinct team ids) → one merged player row.
    const teams = [team('t1', 'e1', 'Bayside FC'), team('t2', 'e2', 'Bayside FC'), team('t3', 'e2', 'Bayside FC Reserves')];
    const stats = [
      stat('e1', 'fx1', 't1', 'Ramos', 'goal'),
      stat('e2', 'fx9', 't2', 'Ramos', 'goal'),
      stat('e2', 'fx9', 't3', 'Ramos', 'goal') // different club (Reserves) → separate record
    ];
    const db = buildStatDatabase(stats, teams);
    const merged = db.players.filter(p => p.teamName === 'Bayside FC');
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ goals: 2, events: 2, matches: 2 });
    expect(db.players.filter(p => p.teamName === 'Bayside FC Reserves')).toHaveLength(1);
    expect(db.totals.players).toBe(2);
  });

  it('returns empty structures when there are no stat events', () => {
    const db = buildStatDatabase([], []);
    expect(db).toEqual({ players: [], teams: [], totals: { goals: 0, assists: 0, ownGoals: 0, yellow: 0, red: 0, records: 0, players: 0, teams: 0, matches: 0 } });
  });
});

describe('fixtures calendar helper', () => {
  const ev = (id: string, name: string): LeagueEvent => ({
    id, league_id: 'l', season_id: 's', name, format: 'round_robin', category: null, status: 'active',
    team_cap: null, starts_on: null, ends_on: null, registration_code: id.toUpperCase(), is_public: false, notes: null, created_at: '', updated_at: ''
  });
  const tm = (id: string, name: string): EventTeam => ({
    id, event_id: 'e1', league_id: 'l', registration_id: null, name, seed: null, created_at: '', updated_at: ''
  });
  const vn = (id: string, name: string): LeagueVenue => ({
    id, league_id: 'l', name, address: null, capacity: null, notes: null, created_at: '', updated_at: ''
  });
  const fx = (
    id: string, home: string, away: string, kickoff: string | null, venue: string | null,
    status: EventFixture['status'] = 'scheduled'
  ): EventFixture => ({
    id, event_id: 'e1', league_id: 'l', round: 1, sequence: 1, home_team_id: home, away_team_id: away,
    status, home_score: null, away_score: null, kickoff_at: kickoff, venue_id: venue,
    home_checked_in: false, away_checked_in: false, official_name: null, stage: null, group_label: null, created_at: '', updated_at: ''
  });

  const events = [ev('e1', 'Metro Cup')];
  const teams = [tm('a', 'Alpha'), tm('b', 'Bravo'), tm('c', 'Charlie'), tm('d', 'Delta')];
  const venues = [vn('v1', 'Pitch A'), vn('v2', 'Pitch B')];

  it('groups scheduled fixtures by day and separates the unscheduled', () => {
    const cal = buildFixtureCalendar([
      fx('f1', 'a', 'b', '2026-08-15T09:00:00.000Z', 'v1'),
      fx('f2', 'c', 'd', '2026-08-16T09:00:00.000Z', 'v2'),
      fx('f3', 'a', 'c', null, null)
    ], teams, events, venues);
    expect(cal.days).toHaveLength(2);
    expect(cal.scheduledCount).toBe(2);
    expect(cal.unscheduled.map(i => i.fixtureId)).toEqual(['f3']);
    expect(cal.days[0].items[0].homeTeamName).toBe('Alpha');
    expect(cal.days[0].items[0].venueName).toBe('Pitch A');
  });

  it('flags a venue double-booking within the window and leaves clear slots alone', () => {
    const cal = buildFixtureCalendar([
      fx('f1', 'a', 'b', '2026-08-15T09:00:00.000Z', 'v1'),
      fx('f2', 'c', 'd', '2026-08-15T10:00:00.000Z', 'v1'), // 1h later, same venue → clash
      fx('f3', 'a', 'c', '2026-08-15T09:30:00.000Z', 'v2'), // same time, different venue → fine
      fx('f4', 'b', 'd', '2026-08-15T13:00:00.000Z', 'v1')  // same venue, 4h after f1 → fine
    ], teams, events, venues);
    expect(cal.conflictCount).toBe(2);
    const conflicted = cal.days.flatMap(d => d.items).filter(i => i.conflict).map(i => i.fixtureId).sort();
    expect(conflicted).toEqual(['f1', 'f2']);
    expect(cal.venueConflicts).toEqual([{ venueId: 'v1', venueName: 'Pitch A', fixtureIds: expect.arrayContaining(['f1', 'f2']) }]);
  });

  it('does not flag fixtures missing a venue or kickoff time', () => {
    const cal = buildFixtureCalendar([
      fx('f1', 'a', 'b', '2026-08-15T09:00:00.000Z', null),   // no venue
      fx('f2', 'c', 'd', '2026-08-15T09:00:00.000Z', null)
    ], teams, events, venues);
    expect(cal.conflictCount).toBe(0);
  });

  const options = { startDate: '2026-08-15', firstKickoff: '09:00', lastKickoff: '17:00', slotMinutes: 120 };

  it('auto-schedules a round robin with no venue or team clashes', () => {
    // 4 teams → 6 fixtures. Two venues, so the calendar must come out clean.
    const fixtures = [
      fx('f1', 'a', 'b', null, null), fx('f2', 'c', 'd', null, null),
      fx('f3', 'a', 'c', null, null), fx('f4', 'b', 'd', null, null),
      fx('f5', 'a', 'd', null, null), fx('f6', 'b', 'c', null, null)
    ];
    const assignments = autoScheduleFixtures(fixtures, venues, [], options);
    expect(assignments).toHaveLength(6);

    // Apply and confirm the calendar detects zero conflicts.
    const byId = new Map(assignments.map(a => [a.fixtureId, a]));
    const scheduled = fixtures.map(f => ({ ...f, kickoff_at: byId.get(f.id)!.kickoffAt, venue_id: byId.get(f.id)!.venueId }));
    expect(buildFixtureCalendar(scheduled, teams, events, venues).conflictCount).toBe(0);

    // No team is placed in two matches within one match window.
    const perTeam = new Map<string, number[]>();
    for (const f of scheduled) {
      for (const t of [f.home_team_id, f.away_team_id]) {
        const list = perTeam.get(t) ?? []; list.push(new Date(f.kickoff_at).getTime()); perTeam.set(t, list);
      }
    }
    for (const times of perTeam.values()) {
      times.sort((x, y) => x - y);
      for (let i = 1; i < times.length; i += 1) expect(times[i] - times[i - 1]).toBeGreaterThanOrEqual(120 * 60_000);
    }
  });

  it('works around already-busy slots and returns nothing without venues', () => {
    const busy = [fx('b1', 'a', 'b', '2026-08-15T09:00:00.000Z', 'v1')];
    const assignments = autoScheduleFixtures([fx('f1', 'c', 'd', null, null)], venues, busy, options);
    expect(assignments).toHaveLength(1);
    // v1 at 09:00 is taken; the fixture must avoid clashing (different venue or a later slot).
    const a = assignments[0];
    expect(a.venueId === 'v2' || new Date(a.kickoffAt).getTime() !== new Date('2026-08-15T09:00:00.000Z').getTime()).toBe(true);
    expect(autoScheduleFixtures([fx('f1', 'c', 'd', null, null)], [], [], options)).toEqual([]);
  });
});

describe('coach seat helper', () => {
  const member = (status: LeagueCoachMembership['status']): LeagueCoachMembership => ({
    id: `${status}-${Math.random()}`, league_id: 'l', coach_user_id: 'u', coach_name: 'Coach', coach_email: 'c@e.test',
    message: null, status, review_note: null, reviewed_by: null, reviewed_at: null, created_at: '', updated_at: ''
  });

  it('counts active and pending seats and reports the remainder', () => {
    const seats = summarizeCoachSeats(
      [member('active'), member('active'), member('pending'), member('declined'), member('removed')],
      10
    );
    expect(seats).toEqual({ seatLimit: 10, active: 2, pending: 1, remaining: 8, full: false });
  });

  it('clamps remaining at zero and flags a full roster when active meets the limit', () => {
    const seats = summarizeCoachSeats([member('active'), member('active'), member('active')], 2);
    expect(seats).toMatchObject({ active: 3, remaining: 0, full: true });
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

  it('creates an eligibility rule with scoped ids and normalized fields', async () => {
    const { client, from, query } = createTableStub({ id: 'rule-1' });
    await createCloudDataAccess(client).league.createEligibilityRule('league-1', {
      scope: 'event',
      eventId: 'event-1',
      seasonId: 'season-1',
      target: 'player',
      title: '  U14 age window  ',
      description: '  Born inside the league window.  ',
      minAge: 11,
      maxAge: 14
    });
    expect(from).toHaveBeenCalledWith('league_eligibility_rules');
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({
      league_id: 'league-1',
      scope: 'event',
      target: 'player',
      title: 'U14 age window',
      description: 'Born inside the league window.',
      season_id: null,
      event_id: 'event-1',
      min_age: 11,
      max_age: 14
    }));
  });

  it('creates a document requirement with scoped ids and requirement flags', async () => {
    const { client, from, query } = createTableStub({ id: 'doc-1' });
    await createCloudDataAccess(client).league.createDocumentRequirement('league-1', {
      scope: 'season',
      seasonId: 'season-1',
      eventId: 'event-1',
      target: 'team',
      title: ' Proof of age ',
      instructions: ' Upload a readable copy. ',
      required: false,
      expires: true
    });
    expect(from).toHaveBeenCalledWith('league_document_requirements');
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({
      league_id: 'league-1',
      scope: 'season',
      target: 'team',
      title: 'Proof of age',
      instructions: 'Upload a readable copy.',
      season_id: 'season-1',
      event_id: null,
      required: false,
      expires: true
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

  it('adds a roster player through the guarded RPC', async () => {
    const saved = { id: 'player-1', full_name: 'Player One' };
    const { client, rpc } = createTableStub(saved);
    await expect(
      createCloudDataAccess(client).league.addEventRosterPlayer({
        teamId: 'team-1',
        fullName: ' Player One ',
        birthdate: '2014-02-01',
        shirtNumber: 9
      })
    ).resolves.toEqual(saved);
    expect(rpc).toHaveBeenCalledWith('add_event_roster_player', {
      team_id: 'team-1',
      full_name: 'Player One',
      birthdate: '2014-02-01',
      shirt_number: 9
    });
  });

  it('marks a roster player transferred through the guarded RPC', async () => {
    const saved = { id: 'player-1', status: 'transferred' };
    const { client, rpc } = createTableStub(saved);
    await expect(
      createCloudDataAccess(client).league.markEventRosterPlayerStatus('player-1', 'transferred', ' Moved after approval ')
    ).resolves.toEqual(saved);
    expect(rpc).toHaveBeenCalledWith('mark_event_roster_player_status', {
      player_id: 'player-1',
      next_status: 'transferred',
      note: 'Moved after approval'
    });
  });

  it('transfers a roster player to another team through the guarded RPC', async () => {
    const saved = { id: 'player-1', team_id: 'team-2', transfer_from_team_id: 'team-1' };
    const { client, rpc } = createTableStub(saved);
    await expect(
      createCloudDataAccess(client).league.transferEventRosterPlayer('player-1', 'team-2', ' Approved clearance ')
    ).resolves.toEqual(saved);
    expect(rpc).toHaveBeenCalledWith('transfer_event_roster_player', {
      player_id: 'player-1',
      destination_team_id: 'team-2',
      note: 'Approved clearance'
    });
  });

  it('surfaces errors as CloudLeagueError', async () => {
    const { client } = createTableStub(null, { message: 'denied' });
    await expect(createCloudDataAccess(client).league.listLeagues()).rejects.toBeInstanceOf(CloudLeagueError);
  });
});
