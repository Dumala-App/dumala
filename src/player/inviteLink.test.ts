import { describe, expect, it } from 'vitest';
import { buildPlayerInviteLink, readPlayerInviteCodeFromHash } from './inviteLink';

describe('player invite links', () => {
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
});
