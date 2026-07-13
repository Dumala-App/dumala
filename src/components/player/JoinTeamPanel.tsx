import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { Loader2, LogIn, Users, X } from 'lucide-react';
import type { CloudRuntime } from '../../cloud/runtime';
import type { PlayerClubLink, PlayerLinkRequest } from '../../cloud/player';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { apexCta, apexInput } from './playerTheme';

interface JoinTeamPanelProps {
  runtime: Extract<CloudRuntime, { enabled: true }>;
  onLinkedClubChange: (clubId: string | null) => void;
}

const statusBadge: Record<PlayerLinkRequest['status'], string> = {
  pending: 'border-amber-400/40 bg-amber-400/15 text-amber-100',
  approved: 'border-emerald-400/40 bg-emerald-400/15 text-emerald-100',
  rejected: 'border-rose-400/40 bg-rose-400/15 text-rose-100',
  withdrawn: 'border-slate-400/40 bg-slate-400/15 text-slate-200'
};

const JoinTeamPanel = ({ runtime, onLinkedClubChange }: JoinTeamPanelProps) => {
  const [links, setLinks] = useState<PlayerClubLink[]>([]);
  const [requests, setRequests] = useState<PlayerLinkRequest[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [claimedName, setClaimedName] = useState('');
  const [rosterNumber, setRosterNumber] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  const refresh = useCallback(async () => {
    const [nextLinks, nextRequests] = await Promise.all([
      runtime.dataAccess.player.listMyLinks(),
      runtime.dataAccess.player.listMyLinkRequests()
    ]);
    setLinks(nextLinks);
    setRequests(nextRequests);
    onLinkedClubChange(nextLinks[0]?.club_id ?? null);
  }, [runtime, onLinkedClubChange]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    refresh()
      .catch(error => {
        if (active) setFeedback(error instanceof Error ? error.message : 'Could not load your teams.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refresh]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('submitting');
    setFeedback('');
    try {
      await runtime.dataAccess.player.requestLink({
        joinCode,
        claimedName,
        claimedRosterNumber: rosterNumber ? Number(rosterNumber) : null,
        message: message || null
      });
      setJoinCode('');
      setClaimedName('');
      setRosterNumber('');
      setMessage('');
      setStatus('idle');
      setFeedback('Request sent. Your coach will review it.');
      await refresh();
    } catch (error) {
      setStatus('error');
      setFeedback(error instanceof Error ? error.message : 'Could not send your request.');
    }
  };

  const handleWithdraw = async (request: PlayerLinkRequest) => {
    setFeedback('');
    try {
      await runtime.dataAccess.player.withdrawLinkRequest(request.id);
      await refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Could not withdraw the request.');
    }
  };

  const pendingRequests = requests.filter(request => request.status === 'pending');

  return (
    <section className="apex-card rounded-xl border border-white/[0.06] p-5">
      <div className="mb-4 flex items-center gap-2 text-[#d8e3fb]">
        <Users size={18} className="text-[#dce7f8]" />
        <h2 className="font-player-display text-[13px] font-semibold uppercase tracking-widest text-[#d8e3fb]">Your team</h2>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[#c6c6cd]">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      ) : links.length > 0 ? (
        <p className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-100">
          You're linked to your team. Your schedule appears below. Your coach controls your official records.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3" aria-label="Request to join a team">
          <p className="text-sm text-[#c6c6cd]/70">
            Ask your coach for the club join code, then request to be linked to your roster spot.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="jt-code" className="text-[#c6c6cd]">Club join code</Label>
              <Input id="jt-code" className={apexInput} required value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="ABC12345" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jt-name" className="text-[#c6c6cd]">Your name on the roster</Label>
              <Input id="jt-name" className={apexInput} required value={claimedName} onChange={e => setClaimedName(e.target.value)} placeholder="As your coach listed you" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jt-number" className="text-[#c6c6cd]">Squad number <span className="text-[#c6c6cd]/50">(optional)</span></Label>
              <Input id="jt-number" className={apexInput} type="number" min={0} value={rosterNumber} onChange={e => setRosterNumber(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jt-message" className="text-[#c6c6cd]">Note to coach <span className="text-[#c6c6cd]/50">(optional)</span></Label>
              <Input id="jt-message" className={apexInput} value={message} onChange={e => setMessage(e.target.value)} />
            </div>
          </div>
          <button type="submit" disabled={status === 'submitting'} className={`${apexCta} inline-flex items-center gap-2 px-5 py-3`}>
            {status === 'submitting' ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />} Request to join
          </button>
        </form>
      )}

      {pendingRequests.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-black uppercase tracking-wide text-[#c6c6cd]/70">Pending requests</p>
          {pendingRequests.map(request => (
            <div key={request.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-[#111c2d]/80 px-3 py-2">
              <span className="text-sm text-[#c6c6cd]">
                {request.claimed_name}
                <span className={`ml-2 rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusBadge[request.status]}`}>{request.status}</span>
              </span>
              <button
                type="button"
                className="inline-flex h-7 items-center gap-1 rounded px-2 font-player-mono text-[10px] font-bold uppercase tracking-wide text-[#c6c6cd] transition-colors hover:text-[#dce7f8]"
                onClick={() => void handleWithdraw(request)}
              >
                <X size={12} /> Withdraw
              </button>
            </div>
          ))}
        </div>
      )}

      {feedback && <p className="mt-3 text-sm text-[#c6c6cd]" role="status">{feedback}</p>}
    </section>
  );
};

export default JoinTeamPanel;
