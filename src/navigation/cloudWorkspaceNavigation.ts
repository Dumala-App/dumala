export type CloudWorkspaceReadySource = 'onboarding' | 'workspace_controls';

export const shouldResetHomeTabAfterCloudWorkspaceReady = (source: CloudWorkspaceReadySource) => source === 'onboarding';

export interface SavedCloudWorkspaceRestoreInput {
  authStatus: string;
  isOnboarded: boolean;
  hasTeamInfo: boolean;
  hasSavedCloudWorkspace: boolean;
}

export const shouldRestoreSavedCloudWorkspaceAfterAuth = ({
  authStatus,
  isOnboarded,
  hasTeamInfo,
  hasSavedCloudWorkspace
}: SavedCloudWorkspaceRestoreInput) =>
  authStatus === 'signedIn'
  && !isOnboarded
  && !hasTeamInfo
  && hasSavedCloudWorkspace;
