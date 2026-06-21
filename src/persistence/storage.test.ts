import { describe, expect, it } from 'vitest';
import { playersSchema } from './schemas';
import { drainRecoveryWarnings, readJsonStorage, type StorageLike } from './storage';

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
});

