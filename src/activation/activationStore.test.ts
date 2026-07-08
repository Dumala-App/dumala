import { describe, expect, it } from 'vitest';
import type { StorageLike } from '../persistence/storage';
import { readActivationFlags, recordActivationFlag } from './activationStore';

const memoryStorage = (): StorageLike => {
  const map = new Map<string, string>();
  return {
    getItem: key => map.get(key) ?? null,
    setItem: (key, value) => { map.set(key, value); },
    removeItem: key => { map.delete(key); }
  };
};

describe('activation store', () => {
  it('returns an empty map before anything is recorded', () => {
    expect(readActivationFlags(memoryStorage())).toEqual({});
  });

  it('records a milestone and reads it back', () => {
    const storage = memoryStorage();
    const result = recordActivationFlag('roster', '2026-07-08T00:00:00.000Z', storage);
    expect(result.changed).toBe(true);
    expect(readActivationFlags(storage)).toEqual({ roster: '2026-07-08T00:00:00.000Z' });
  });

  it('is idempotent: a second record leaves the first timestamp untouched', () => {
    const storage = memoryStorage();
    recordActivationFlag('roster', '2026-07-08T00:00:00.000Z', storage);
    const second = recordActivationFlag('roster', '2026-09-01T00:00:00.000Z', storage);
    expect(second.changed).toBe(false);
    expect(readActivationFlags(storage).roster).toBe('2026-07-08T00:00:00.000Z');
  });

  it('accumulates multiple milestones', () => {
    const storage = memoryStorage();
    recordActivationFlag('roster', '2026-07-08T00:00:00.000Z', storage);
    recordActivationFlag('report', '2026-07-09T00:00:00.000Z', storage);
    expect(Object.keys(readActivationFlags(storage)).sort()).toEqual(['report', 'roster']);
  });
});
