import { describe, expect, it } from 'vitest';
import { shouldResetHomeTabAfterCloudWorkspaceReady } from './navigation/cloudWorkspaceNavigation';

describe('cloud workspace navigation policy', () => {
  it('only resets the Home sub-tab after onboarding bootstrap', () => {
    expect(shouldResetHomeTabAfterCloudWorkspaceReady('onboarding')).toBe(true);
    expect(shouldResetHomeTabAfterCloudWorkspaceReady('workspace_controls')).toBe(false);
  });
});
