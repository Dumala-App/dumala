import { describe, expect, it } from 'vitest';
import { paymentLedgerSchema, playersSchema } from './schemas';
import {
  createStorageRecoverySnapshot,
  drainRecoveryWarnings,
  inspectDumalaStorage,
  readJsonStorage,
  STORAGE_KEYS,
  type StorageLike
} from './storage';

class MemoryStorage implements StorageLike {
  protected values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

const legacyPlayer = {
  id: 'p1',
  name: 'Legacy Player',
  number: 9,
  position: 'Forward',
  bio: '',
  photoUrl: '',
  gamesPlayed: 0,
  points: 0,
  assists: 0,
  cleanSheetsOrRebounds: 0,
  minutesPlayed: 0,
  mvpAwards: 0,
  yellowCards: 0,
  redCards: 0,
  registrationStatus: 'Active',
  attributes: {
    speed: 82,
    shooting: 77,
    passing: 68,
    dribbling: 75,
    defending: 40,
    physicalness: 70
  }
};

describe('validated storage reads', () => {
  it('returns validated data', () => {
    const storage = new MemoryStorage();
    storage.setItem('players', JSON.stringify([legacyPlayer]));
    const players = readJsonStorage('players', playersSchema, [], 'Roster', storage);
    expect(players).toHaveLength(1);
    expect(players[0].baseAttributes.pace).toBe(82);
    expect(players[0].positionAttributes.Finishing).toBe(77);
  });

  it('migrates missing optional counters and histories', () => {
    const parsed = playersSchema.parse([{
      ...legacyPlayer,
      yellowCards: undefined,
      redCards: undefined,
      offenses: undefined
    }]);
    expect(parsed[0].yellowCards).toBe(0);
    expect(parsed[0].redCards).toBe(0);
    expect(parsed[0].offenses).toEqual([]);
  });

  it('falls back and reports malformed JSON without throwing', () => {
    drainRecoveryWarnings();
    const storage = new MemoryStorage();
    storage.setItem('players', '{bad-json');
    const players = readJsonStorage('players', playersSchema, [], 'Roster', storage);
    expect(players).toEqual([]);
    expect(drainRecoveryWarnings()).toEqual([
      expect.objectContaining({ key: 'players', section: 'Roster' })
    ]);
  });

  it('rejects structurally invalid nested records', () => {
    drainRecoveryWarnings();
    const storage = new MemoryStorage();
    storage.setItem('players', JSON.stringify([{ id: 'missing-fields' }]));
    expect(readJsonStorage('players', playersSchema, [], 'Roster', storage)).toEqual([]);
    expect(drainRecoveryWarnings()).toHaveLength(1);
  });

  it('validates payment ledger records', () => {
    expect(paymentLedgerSchema.parse([{
      id: 'pay-1',
      playerId: 'p1',
      playerNameSnapshot: 'Legacy Player',
      type: 'payment',
      category: 'monthly_fee',
      amount: 250,
      date: '2026-06-25',
      method: 'cash',
      createdAt: '2026-06-25T00:00:00.000Z'
    }])).toHaveLength(1);

    expect(() => paymentLedgerSchema.parse([{
      id: 'pay-1',
      playerId: 'p1',
      playerNameSnapshot: 'Legacy Player',
      type: 'payment',
      category: 'monthly_fee',
      amount: 0,
      date: '2026-06-25',
      createdAt: '2026-06-25T00:00:00.000Z'
    }])).toThrow();
  });
});

describe('startup storage inspection', () => {
  it('reports malformed and structurally invalid saved sections without changing them', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEYS.players, '{bad-json');
    storage.setItem(STORAGE_KEYS.games, JSON.stringify([{ id: 'missing-fields' }]));
    const playersBefore = storage.getItem(STORAGE_KEYS.players);
    const gamesBefore = storage.getItem(STORAGE_KEYS.games);

    expect(inspectDumalaStorage(storage)).toEqual([
      {
        key: STORAGE_KEYS.players,
        section: 'Roster',
        reason: 'malformed-json'
      },
      {
        key: STORAGE_KEYS.games,
        section: 'Schedule',
        reason: 'invalid-data'
      }
    ]);
    expect(storage.getItem(STORAGE_KEYS.players)).toBe(playersBefore);
    expect(storage.getItem(STORAGE_KEYS.games)).toBe(gamesBefore);
  });

  it('accepts valid JSON, string, and boolean storage encodings', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEYS.players, JSON.stringify([legacyPlayer]));
    storage.setItem(STORAGE_KEYS.onboarded, 'true');
    storage.setItem(STORAGE_KEYS.formation, '4-3-3');
    storage.setItem(STORAGE_KEYS.matchFormat, '9-a-side');
    storage.setItem(STORAGE_KEYS.isCustomStrategy, 'false');

    expect(inspectDumalaStorage(storage)).toEqual([]);
  });

  it('creates a recovery snapshot with untouched known records and issue metadata', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEYS.players, '{bad-json');
    storage.setItem('unrelated-key', 'do-not-export');
    const issues = inspectDumalaStorage(storage);

    expect(createStorageRecoverySnapshot(issues, storage, '2026-06-23T00:00:00.000Z')).toEqual({
      format: 'dumala-storage-recovery',
      version: 1,
      exportedAt: '2026-06-23T00:00:00.000Z',
      issues,
      entries: {
        [STORAGE_KEYS.players]: '{bad-json'
      }
    });
  });
});

