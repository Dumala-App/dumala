import type { CloudRuntime } from './runtime';

export const hasTeamChatRuntime = (
  runtime: CloudRuntime
): runtime is Extract<CloudRuntime, { enabled: true }> => (
  runtime.enabled && Boolean(runtime.dataAccess.chat)
);
