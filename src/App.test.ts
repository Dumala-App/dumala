import { describe, expect, it } from 'vitest';
import {
  shouldResetHomeTabAfterCloudWorkspaceReady,
  shouldRestoreSavedCloudWorkspaceAfterAuth
} from './navigation/cloudWorkspaceNavigation';

describe('cloud workspace navigation policy', () => {
  it('only resets the Home sub-tab after onboarding bootstrap', () => {
    expect(shouldResetHomeTabAfterCloudWorkspaceReady('onboarding')).toBe(true);
    expect(shouldResetHomeTabAfterCloudWorkspaceReady('workspace_controls')).toBe(false);
  });

  it('restores saved cloud workspaces after auth without hijacking new account onboarding', () => {
    expect(shouldRestoreSavedCloudWorkspaceAfterAuth({
      authStatus: 'signedIn',
      isOnboarded: false,
      hasTeamInfo: false,
      hasSavedCloudWorkspace: true
    })).toBe(true);

    expect(shouldRestoreSavedCloudWorkspaceAfterAuth({
      authStatus: 'signedIn',
      isOnboarded: false,
      hasTeamInfo: false,
      hasSavedCloudWorkspace: false
    })).toBe(false);

    expect(shouldRestoreSavedCloudWorkspaceAfterAuth({
      authStatus: 'signedOut',
      isOnboarded: false,
      hasTeamInfo: false,
      hasSavedCloudWorkspace: true
    })).toBe(false);
  });
});
