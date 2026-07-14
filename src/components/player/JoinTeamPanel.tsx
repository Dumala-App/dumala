import React, { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, LogIn, Users, X } from 'lucide-react';
import type { CloudRuntime } from '../../cloud/runtime';
import type { PlayerClubLink, PlayerLinkRequest } from '../../cloud/player';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { apexCta, apexInput } from './playerTheme';
import {
  clearRememberedPlayerInviteCode,
  readInitialPlayerInviteCode,
  rememberPlayerInviteCode
} from '../../player/inviteLink';

interface JoinTeamPanelProps {
  runtime: Extract<CloudRuntime, { enabled: true }>;
  userId: string;
  accountDisplayName?: string;
  accountEmail?: string;
  onLinkedClubChange: (clubId: string | null) => void;
}

const statusBadge: Record<PlayerLinkRequest['status'], string> = {
  pending: 'border-amber-400/40 bg-amber-400/15 text-amber-100',
  approved: 'border-emerald-400/40 bg-emerald-400/15 text-emerald-100',
  rejected: 'border-rose-400/40 bg-rose-400/15 text-rose-100',
  withdrawn: 'border-slate-400/40 bg-slate-400/15 text-slate-200'
};

const nameFromEmail = (email?: string) => {
  const localPart = email?.split('@')[0]?.replace(/[._-]+/g, ' ').trim();
  if (!localPart) return '';
  return localPart.replace(/\b\w/g, char => char.toUpperCase());
};

export const shouldAutoSubmitInviteCode = ({
  inviteCode,
  loading,
  status,
  linkedCount,
  hasPendingRequest,
  alreadyAttempted
}: {
  inviteCode: string;
  loading: boolean;
  status: 'idle' | 'submitting' | 'auto-submitting' | 'error';
  linkedCount: number;
  hasPendingRequest: boolean;
  alreadyAttempted: boolean;
}) =>
  Boolean(inviteCode)
  && !loading
  && status === 'idle'
  && linkedCount === 0
  && !hasPendingRequest
  && !alreadyAttempted;

const JoinTeamPanel = ({
  runtime,
  userId,
  accountDisplayName,
  accountEmail,
  onLinkedClubChange
}: JoinTeamPanelProps) => {
  const initialInviteCode = readInitialPlayerInviteCode();
  const [links, setLinks] = useState<PlayerClubLink[]>([]);
  const [requests, setRequests] = useState<PlayerLinkRequest[]>([]);
  const [joinCode, setJoinCode] = useState(initialInviteCode);
  const [autoInviteCode, setAutoInviteCode] = useState(initialInviteCode);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'auto-submitting' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');
  const attemptedInviteCodes = useRef(new Set<string>());

  const refresh = useCallback(async () => {
    const [nextLinks, nextRequests] = await Promise.all([
      runtime.dataAccess.player.listMyLinks(),
      runtime.dataAccess.player.listMyLinkRequests()
    ]);
    setLinks(nextLinks);
    setRequests(nextRequests);
    onLinkedClubChange(nextLinks[0]?.club_id ?? null);
    return { links: nextLinks, requests: nextRequests };
  }, [runtime, onLinkedClubChange]);

  const resolveClaimedName = useCallback(async () => {
    const profile = await runtime.dataAccess.player.getMyProfile(userId).catch(() => null);
    return (
      profile?.display_name?.trim()
      || accountDisplayName?.trim()
      || nameFromEmail(accountEmail)
      || 'Invited player'
    );
  }, [accountDisplayName, accountEmail, runtime, userId]);

  const submitRequest = useCallback(async (
    code: string,
    note: string | null,
    nextStatus: 'submitting' | 'auto-submitting',
    rememberCode: boolean
  ) => {
    const normalizedCode = rememberCode ? rememberPlayerInviteCode(code) : code.trim().toUpperCase();
    if (!normalizedCode) return;

    setStatus(nextStatus);
    setFeedback('');
    try {
      await runtime.dataAccess.player.requestLink({
        joinCode: normalizedCode,
        claimedName: await resolveClaimedName(),
        message: note
      });
      clearRememberedPlayerInviteCode();
      setJoinCode('');
      setAutoInviteCode('');
      setMessage('');
      setStatus('idle');
      setFeedback('Request sent. Your coach will review and match it to your roster spot.');
      await refresh();
    } catch (error) {
      await refresh().catch(() => undefined);
      if (nextStatus === 'auto-submitting') {
        clearRememberedPlayerInviteCode();
        setAutoInviteCode('');
      }
      const text = error instanceof Error ? error.message : 'Could not send your request.';
      if (text.includes('REQUEST_ALREADY_PENDING')) {
        clearRememberedPlayerInviteCode();
        setJoinCode('');
        setAutoInviteCode('');
        setMessage('');
        setStatus('idle');
        setFeedback('You already have a pending request for this club.');
        return;
      }
      setStatus('error');
      setFeedback(text);
    }
  }, [refresh, resolveClaimedName, runtime]);

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

  useEffect(() => {
    const normalizedCode = autoInviteCode.trim().toUpperCase();
    const alreadyAttempted = attemptedInviteCodes.current.has(normalizedCode);
    if (!shouldAutoSubmitInviteCode({
      inviteCode: normalizedCode,
      loading,
      status,
      linkedCount: links.length,
      hasPendingRequest: requests.some(request => request.status === 'pending'),
      alreadyAttempted
    })) return;

    if (attemptedInviteCodes.current.has(normalizedCode)) return;
    attemptedInviteCodes.current.add(normalizedCode);
    void submitRequest(normalizedCode, 'Joined from coach invite link.', 'auto-submitting', true);
  }, [autoInviteCode, links.length, loading, requests, status, submitRequest]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitRequest(joinCode, message || null, 'submitting', false);
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
          <Loader2 size={16} className="animate-spin" /> Loading...
        </div>
      ) : status === 'auto-submitting' ? (
        <div className="rounded-lg border border-orange-300/20 bg-orange-300/10 px-4 py-4 text-sm text-orange-50">
          <span className="inline-flex items-center gap-2 font-semibold">
            <Loader2 size={16} className="animate-spin" /> Sending your join request
          </span>
          <p className="mt-1 text-orange-50/75">We found your coach invite link. No roster-name setup needed.</p>
        </div>
      ) : links.length > 0 ? (
        <p className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-100">
          <span className="inline-flex items-center gap-2 font-semibold">
            <CheckCircle2 size={16} /> You're linked to your team.
          </span>
          <span className="mt-1 block text-emerald-100/80">Your schedule appears below. Your coach controls your official records.</span>
        </p>
      ) : pendingRequests.length > 0 ? (
        <div className="rounded-lg border border-amber-400/25 bg-amber-400/10 px-4 py-4 text-sm text-amber-50">
          <span className="inline-flex items-center gap-2 font-semibold">
            <CheckCircle2 size={16} /> Request pending
          </span>
          <p className="mt-1 text-amber-50/75">Your coach can now review and match your account to the right roster spot.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3" aria-label="Request to join a team">
          <p className="text-sm text-[#c6c6cd]/70">
            Open your coach's invite link and we'll send this automatically. If you only have a code, enter it here.
          </p>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="jt-code" className="text-[#c6c6cd]">Club join code</Label>
              <Input
                id="jt-code"
                className={apexInput}
                required
                value={joinCode}
                onChange={e => {
                  setJoinCode(e.target.value);
                  setAutoInviteCode('');
                }}
                placeholder="ABC12345"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jt-message" className="text-[#c6c6cd]">Note to coach <span className="text-[#c6c6cd]/50">(optional)</span></Label>
              <Input id="jt-message" className={apexInput} value={message} onChange={e => setMessage(e.target.value)} placeholder="Anything your coach should know" />
            </div>
          </div>
          <button type="submit" disabled={status === 'submitting'} className={`${apexCta} inline-flex items-center gap-2 px-5 py-3`}>
            {status === 'submitting' ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />} Request to join
          </button>
        </form>
      )}

      {pendingRequests.length > 0 && status !== 'auto-submitting' && (
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
