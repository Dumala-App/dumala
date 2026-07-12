import React from 'react';
import { useCloudRuntime } from '../hooks/useCloudRuntime';
import { useCloudAuth } from '../hooks/useCloudAuth';
import TeamChat from './chat/TeamChat';

interface TeamChatPanelProps {
  clubId: string;
}

// Coach-side embedded team chat for the Squad hub. Staff can post and moderate.
// Shown only for a cloud-backed club with the chat flag on.
const TeamChatPanel = ({ clubId }: TeamChatPanelProps) => {
  const runtime = useCloudRuntime();
  const auth = useCloudAuth({ enabled: runtime.enabled, auth: runtime.dataAccess?.auth ?? null });

  if (!runtime.enabled || !runtime.phase6.chatEnabled) return null;

  const userId = auth.state.status === 'signedIn' ? auth.state.session.userId : null;

  return (
    <section className="h-[28rem] overflow-hidden rounded-2xl border border-cyan-300/10 bg-[#07111f]/88 shadow-lg shadow-black/20">
      <TeamChat runtime={runtime} clubId={clubId} selfUserId={userId} tone="glass" canModerateAll title="Team chat" />
    </section>
  );
};

export default TeamChatPanel;
