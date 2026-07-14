import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildPlayerInviteLink,
  clearRememberedPlayerInviteCode,
  readPlayerInviteCodeFromHash,
  readRememberedPlayerInviteCode,
  rememberPlayerInviteCode
} from './inviteLink';

class MemoryStorage implements Pick<Storage, 'getItem' | 'removeItem' | 'setItem'> {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe('player invite links', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('builds a hash route that opens the Player app with the join code', () => {
    expect(buildPlayerInviteLink(' abc123 ', {
      origin: 'https://dumala.test',
      pathname: '/app'
    })).toBe('https://dumala.test/app#/player?join=ABC123');
  });

  it('reads the join code from a Player app hash route', () => {
    expect(readPlayerInviteCodeFromHash('#/player?join=team-42')).toBe('TEAM-42');
  });

  it('ignores hashes without a join code', () => {
    expect(readPlayerInviteCodeFromHash('#/player')).toBe('');
  });

  it('remembers a join code across auth redirects that drop the hash', () => {
    const storage = new MemoryStorage();

    expect(rememberPlayerInviteCode(' team-42 ', storage)).toBe('TEAM-42');
    expect(readRememberedPlayerInviteCode(storage)).toBe('TEAM-42');

    clearRememberedPlayerInviteCode(storage);
    expect(readRememberedPlayerInviteCode(storage)).toBe('');
  });

  it('expires stale remembered join codes', () => {
    const storage = new MemoryStorage();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-10T00:00:00.000Z'));

    rememberPlayerInviteCode('team-42', storage);
    vi.setSystemTime(new Date('2026-07-11T00:01:00.000Z'));

    expect(readRememberedPlayerInviteCode(storage)).toBe('');
  });
});
