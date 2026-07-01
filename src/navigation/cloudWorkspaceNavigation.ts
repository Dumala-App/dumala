export type CloudWorkspaceReadySource = 'onboarding' | 'workspace_controls';

export const shouldResetHomeTabAfterCloudWorkspaceReady = (source: CloudWorkspaceReadySource) => source === 'onboarding';
