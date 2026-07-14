import { describe, expect, it } from 'vitest';
import { getChatDisplayName } from './TeamChat';

describe('getChatDisplayName', () => {
  it('uses only the first name for player messages', () => {
    expect(getChatDisplayName({ author_name: 'Jordan Miller', author_role: 'player' })).toBe('Jordan');
  });

  it('keeps staff display names intact', () => {
    expect(getChatDisplayName({ author_name: 'Coach Rivera', author_role: 'coach' })).toBe('Coach Rivera');
  });
});
