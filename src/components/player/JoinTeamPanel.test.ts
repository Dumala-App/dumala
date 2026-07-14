import { describe, expect, it } from 'vitest';
import { shouldAutoSubmitInviteCode } from './JoinTeamPanel';

describe('JoinTeamPanel auto invite guard', () => {
  it('auto-submits only when the code came from an invite source and the account has no open team state', () => {
    expect(shouldAutoSubmitInviteCode({
      inviteCode: 'TEAM123',
      loading: false,
      status: 'idle',
      linkedCount: 0,
      hasPendingRequest: false,
      alreadyAttempted: false
    })).toBe(true);
  });

  it('does not auto-submit manual typing after the invite source is cleared', () => {
    expect(shouldAutoSubmitInviteCode({
      inviteCode: '',
      loading: false,
      status: 'idle',
      linkedCount: 0,
      hasPendingRequest: false,
      alreadyAttempted: false
    })).toBe(false);
  });

  it('does not auto-submit when a request is already pending', () => {
    expect(shouldAutoSubmitInviteCode({
      inviteCode: 'TEAM123',
      loading: false,
      status: 'idle',
      linkedCount: 0,
      hasPendingRequest: true,
      alreadyAttempted: false
    })).toBe(false);
  });
});
