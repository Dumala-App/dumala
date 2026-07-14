import { describe, expect, it, vi } from 'vitest';
import type { DumalaSupabaseClient } from './client';
import { createCloudDataAccess } from './dataAccess';
import { computeIsMinor, CloudPlayerError, mapCloudAssessmentSession, mapRosterPlayerToReportPlayer } from './player';

const createRpcStub = (result: unknown, error: unknown = null) => {
  const rpc = vi.fn().mockResolvedValue({ data: result, error });
  return { client: { rpc } as unknown as DumalaSupabaseClient, rpc };
};

describe('computeIsMinor', () => {
  const now = new Date('2026-07-10T00:00:00.000Z');

  it('treats an under-18 date of birth as a minor', () => {
    expect(computeIsMinor('2015-01-01', now)).toBe(true);
  });

  it('treats an 18+ date of birth as an adult', () => {
    expect(computeIsMinor('2000-01-01', now)).toBe(false);
  });

  it('handles the exact 18th birthday as no longer a minor', () => {
    expect(computeIsMinor('2008-07-10', now)).toBe(false);
  });

  it('returns false for missing or invalid dates', () => {
    expect(computeIsMinor(null, now)).toBe(false);
    expect(computeIsMinor('not-a-date', now)).toBe(false);
  });
});

describe('player FPRDS mapping', () => {
  it('maps cloud assessment rows into local report sessions', () => {
    expect(mapCloudAssessmentSession({
      id: 'assessment-1',
      player_id: 'player-1',
      assessment_date: '2026-07-10',
      assessment_type: 'quick',
      age_group: 'u18',
      role: 'w',
      ovr: 72,
      weakest_attribute_id: 'strength',
      ovr_tier_label: 'Developing',
      previous_session_id: null,
      benchmark_version: '1.0.0',
      raw_results: { role: 'W', assessmentType: 'Quick', base: {}, roleSpecific: {} },
      attribute_scores: { pace: 82, strength: 61 },
      attribute_deltas: { pace: 3 },
      created_at: '2026-07-10T10:00:00.000Z'
    })).toMatchObject({
      id: 'assessment-1',
      playerId: 'player-1',
      assessmentType: 'Quick',
      ageGroup: 'U18',
      role: 'W',
      attributeScores: { pace: 82, strength: 61 },
      deltas: { attributeDeltas: { pace: 3 } }
    });
  });

  it('maps a linked roster player into the report player model', () => {
    const player = mapRosterPlayerToReportPlayer({
      id: 'player-1',
      name: 'Alex Rivera',
      roster_number: 11,
      position: 'Forward',
      photo_url: '',
      games_played: 5,
      goals: 3,
      assists: 2,
      clean_sheets: 0,
      minutes_played: 350,
      yellow_cards: 1,
      red_cards: 0,
      base_attributes: { pace: 88, stamina: 77, agility: 85, strength: 70, firstTouch: 82, shortPassing: 78 },
      position_attributes: { Finishing: 80 },
      specialty_traits: ['Wide runner']
    });

    expect(player).toMatchObject({
      id: 'player-1',
      name: 'Alex Rivera',
      number: 11,
      points: 3,
      baseAttributes: { pace: 88 },
      positionAttributes: { Finishing: 80 },
      specialtyTraits: ['Wide runner']
    });
  });
});

describe('cloud player repository', () => {
  it('normalizes a join request before submitting', async () => {
    const { client, rpc } = createRpcStub('request-1');

    await expect(
      createCloudDataAccess(client).player.requestLink({
        joinCode: '  joincode1 ',
        claimedName: '  Kid Striker  ',
        claimedRosterNumber: 7,
        message: '  add me  '
      })
    ).resolves.toBe('request-1');

    expect(rpc).toHaveBeenCalledWith('request_player_link', {
      join_code: 'JOINCODE1',
      claimed_name: 'Kid Striker',
      claimed_roster_number: 7,
      message: 'add me'
    });
  });

  it('records guardian consent through the RPC', async () => {
    const { client, rpc } = createRpcStub('granted');

    await expect(
      createCloudDataAccess(client).player.setGuardianConsent({
        guardianName: '  Parent  ',
        guardianEmail: ' parent@example.test ',
        guardianRelationship: ' Mother '
      })
    ).resolves.toBe('granted');

    expect(rpc).toHaveBeenCalledWith('set_guardian_consent', {
      p_guardian_name: 'Parent',
      p_guardian_email: 'parent@example.test',
      p_guardian_relationship: 'Mother'
    });
  });

  it('approves a link with the prefixed player id parameter', async () => {
    const { client, rpc } = createRpcStub('link-1');
    await expect(
      createCloudDataAccess(client).player.approveLink('req-1', 'player-1')
    ).resolves.toBe('link-1');
    expect(rpc).toHaveBeenCalledWith('approve_player_link', {
      request_id: 'req-1',
      p_target_player_id: 'player-1'
    });
  });

  it('surfaces RPC errors as CloudPlayerError', async () => {
    const { client } = createRpcStub(null, { message: 'denied' });
    await expect(
      createCloudDataAccess(client).player.requestLink({ joinCode: 'X', claimedName: 'Y' })
    ).rejects.toBeInstanceOf(CloudPlayerError);
  });
});

// A minimal chainable from() stub for table-based reads/writes.
const createTableStub = (result: unknown) => {
  const query: Record<string, unknown> = {};
  const chain = () => query;
  for (const method of ['insert', 'select', 'delete', 'update', 'eq', 'is', 'order', 'limit']) {
    query[method] = vi.fn(chain);
  }
  query.single = vi.fn().mockResolvedValue({ data: result, error: null });
  (query as { then: unknown }).then = (resolve: (v: { data: unknown; error: null }) => void) =>
    resolve({ data: result, error: null });
  const from = vi.fn(() => query);
  return { client: { from } as unknown as DumalaSupabaseClient, from, query };
};

describe('cloud player activity', () => {
  it('logs a drill completion with the owner id', async () => {
    const saved = { id: 'c1', drill_id: 'drill-agility' };
    const { client, from, query } = createTableStub(saved);

    await expect(
      createCloudDataAccess(client).player.logDrillCompletion('user-1', {
        drillId: 'drill-agility',
        durationSeconds: 600,
        notes: '  good  '
      })
    ).resolves.toEqual(saved);

    expect(from).toHaveBeenCalledWith('player_drill_completions');
    expect(query.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      drill_id: 'drill-agility',
      duration_seconds: 600,
      perceived_exertion: null,
      notes: 'good'
    });
  });

  it('adds and removes favorites', async () => {
    const add = createTableStub(null);
    await createCloudDataAccess(add.client).player.toggleFavorite('user-1', 'drill-x', false);
    expect(add.query.insert).toHaveBeenCalledWith({ user_id: 'user-1', drill_id: 'drill-x' });

    const remove = createTableStub(null);
    await createCloudDataAccess(remove.client).player.toggleFavorite('user-1', 'drill-x', true);
    expect(remove.query.delete).toHaveBeenCalled();
  });

  it('returns favorite drill ids as a flat list', async () => {
    const { client } = createTableStub([{ drill_id: 'a' }, { drill_id: 'b' }]);
    await expect(createCloudDataAccess(client).player.listFavorites()).resolves.toEqual(['a', 'b']);
  });
});
