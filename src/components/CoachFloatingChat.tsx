import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { useCloudAuth } from '../hooks/useCloudAuth';
import { useCloudRuntime } from '../hooks/useCloudRuntime';
import { hasTeamChatRuntime } from '../cloud/chatAvailability';
import TeamChat from './chat/TeamChat';

interface CoachFloatingChatProps {
  clubId: string | null;
}

const CoachFloatingChat = ({ clubId }: CoachFloatingChatProps) => {
  const [open, setOpen] = useState(false);
  const runtime = useCloudRuntime();
  const auth = useCloudAuth({ enabled: runtime.enabled, auth: runtime.dataAccess?.auth ?? null });

  if (!clubId || !hasTeamChatRuntime(runtime)) return null;

  const userId = auth.state.status === 'signedIn' ? auth.state.session.userId : null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 pb-[env(safe-area-inset-bottom)] sm:bottom-6 sm:right-6">
      {open && (
        <section
          className="h-[min(38rem,calc(100dvh-7rem))] w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-cyan-300/15 bg-[#020713] text-slate-100 shadow-2xl shadow-black/45 backdrop-blur-xl sm:w-[24rem]"
          aria-label="Coach team chat"
        >
          <TeamChat
            runtime={runtime}
            clubId={clubId}
            selfUserId={userId}
            tone="glass"
            canModerateAll
            title="Team chat"
            onBack={() => setOpen(false)}
          />
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        aria-label={open ? 'Close team chat' : 'Open team chat'}
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-300/40 bg-orange-400 text-slate-950 shadow-2xl shadow-black/35 transition hover:-translate-y-0.5 hover:bg-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:translate-y-0"
      >
        {open ? <X size={24} aria-hidden="true" /> : <MessageSquare size={24} aria-hidden="true" />}
      </button>
    </div>
  );
};

export default CoachFloatingChat;
