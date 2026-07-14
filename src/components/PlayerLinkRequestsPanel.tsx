import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, Loader2, UserPlus, X } from 'lucide-react';
import { useCloudRuntime } from '../hooks/useCloudRuntime';
import type { ClubRosterPlayer, PlayerLinkRequest } from '../cloud/player';
import { Button } from './ui/button';
import { buildPlayerInviteLink } from '../player/inviteLink';

interface PlayerLinkRequestsPanelProps {
  clubId: string;
}

type RosterPlayerOption = ClubRosterPlayer & {
  linked: boolean;
};

const rosterOptionKey = (player: ClubRosterPlayer): string => [
  player.roster_number,
  player.name.trim().replace(/\s+/g, ' ').toLowerCase(),
  player.position.trim().replace(/\s+/g, ' ').toLowerCase()
].join('::');

export const getUniqueRosterPlayerOptions = (
  roster: ClubRosterPlayer[],
  linkedPlayerIds: ReadonlySet<string>
): RosterPlayerOption[] => {
  const grouped = new Map<string, RosterPlayerOption>();

  for (const player of roster) {
    const key = rosterOptionKey(player);
    const existing = grouped.get(key);
    const linked = linkedPlayerIds.has(player.id);

    if (!existing) {
      grouped.set(key, { ...player, linked });
      continue;
    }

    if (linked) {
      grouped.set(key, { ...existing, id: player.id, linked: true });
    }
  }

  return Array.from(grouped.values());
};

// Coach-facing approval queue for the Player app. A player requests to join the
// club with its join code; a coach picks the matching roster player and links the
// account. Only shown for a cloud-backed club with the Player app enabled.
const PlayerLinkRequestsPanel = ({ clubId }: PlayerLinkRequestsPanelProps) => {
  const runtime = useCloudRuntime();
  const enabled = runtime.enabled && runtime.phase6.playerAppEnabled;

  const [joinCode, setJoinCode] = useState('');
  const [requests, setRequests] = useState<PlayerLinkRequest[]>([]);
  const [roster, setRoster] = useState<ClubRosterPlayer[]>([]);
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const refresh = useCallback(async () => {
    if (!runtime.enabled) return;
    const [code, requestRows, rosterRows] = await Promise.all([
      runtime.dataAccess.player.getOrCreateClubJoinCode(clubId),
      runtime.dataAccess.player.listClubLinkRequests(clubId),
      runtime.dataAccess.player.listClubRosterPlayers(clubId)
    ]);
    setJoinCode(code);
    setRequests(requestRows);
    setRoster(rosterRows);
  }, [runtime, clubId]);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setLoading(true);
    refresh()
      .catch(error => {
        if (active) setMessage(error instanceof Error ? error.message : 'Could not load player requests.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [enabled, refresh]);

  if (!runtime.enabled || !runtime.phase6.playerAppEnabled) return null;

  const pending = requests.filter(request => request.status === 'pending');

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(buildPlayerInviteLink(joinCode));
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleApprove = async (request: PlayerLinkRequest) => {
    const targetPlayerId = selection[request.id];
    if (!targetPlayerId) {
      setMessage('Pick the roster player to link before approving.');
      return;
    }
    setBusyId(request.id);
    setMessage('');
    try {
      await runtime.dataAccess.player.approveLink(request.id, targetPlayerId);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not approve the request.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (request: PlayerLinkRequest) => {
    setBusyId(request.id);
    setMessage('');
    try {
      await runtime.dataAccess.player.rejectLink(request.id, null);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not reject the request.');
    } finally {
      setBusyId(null);
    }
  };

  const linkedPlayerIds = useMemo(() => new Set(
    requests.filter(request => request.status === 'approved' && request.target_player_id).map(request => request.target_player_id as string)
  ), [requests]);
  const rosterOptions = useMemo(
    () => getUniqueRosterPlayerOptions(roster, linkedPlayerIds),
    [roster, linkedPlayerIds]
  );

  return (
    <section className="rounded-2xl border border-cyan-300/10 bg-[#07111f]/88 p-5 text-slate-100 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <UserPlus size={18} className="text-orange-200" />
          <h2 className="text-sm font-black">Player app requests</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400">Club join code</span>
          <code className="rounded-md border border-cyan-300/15 bg-[#0b1726]/85 px-2 py-1 font-black tracking-widest text-orange-100">{joinCode || '……'}</code>
          <Button type="button" variant="outline" size="sm" className="h-7 gap-1 px-2 text-[11px]" onClick={() => void handleCopyCode()}>
            {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button type="button" size="sm" className="h-7 gap-1 px-2 text-[11px]" onClick={() => void handleCopyLink()} disabled={!joinCode}>
            {copiedLink ? <Check size={12} /> : <Copy size={12} />} {copiedLink ? 'Link copied' : 'Copy invite link'}
          </Button>
        </div>
      </div>

      <p className="mb-3 text-xs text-slate-400">
        Share the invite link with your players. The join code is available as a fallback if a player opens the Player app manually.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Loader2 size={16} className="animate-spin" /> Loading requests…
        </div>
      ) : pending.length === 0 ? (
        <p className="rounded-xl border border-dashed border-cyan-300/15 bg-cyan-300/[0.035] px-4 py-4 text-center text-sm text-slate-400">
          No pending player requests.
        </p>
      ) : (
        <ul className="space-y-2">
          {pending.map(request => (
            <li key={request.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-cyan-300/10 bg-[#0b1726]/66 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-100">
                  {request.claimed_name}
                  {request.claimed_roster_number != null && <span className="ml-2 text-slate-400">#{request.claimed_roster_number}</span>}
                </p>
                {request.message && <p className="truncate text-xs text-slate-400">{request.message}</p>}
              </div>
              <select
                aria-label="Match roster player"
                value={selection[request.id] ?? ''}
                onChange={e => setSelection(current => ({ ...current, [request.id]: e.target.value }))}
                className="h-8 rounded-md border border-cyan-300/15 bg-[#0b1726]/85 px-2 text-xs text-slate-100"
              >
                <option value="">Match roster player…</option>
                {rosterOptions.map(player => (
                  <option key={player.id} value={player.id} disabled={player.linked}>
                    #{player.roster_number} {player.name}{player.linked ? ' (linked)' : ''}
                  </option>
                ))}
              </select>
              <Button type="button" size="sm" className="h-8 gap-1 px-2 text-[11px]" disabled={busyId === request.id} onClick={() => void handleApprove(request)}>
                {busyId === request.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Approve
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1 px-2 text-[11px]" disabled={busyId === request.id} onClick={() => void handleReject(request)}>
                <X size={12} /> Reject
              </Button>
            </li>
          ))}
        </ul>
      )}

      {message && <p className="mt-3 text-sm text-amber-300" role="status">{message}</p>}
    </section>
  );
};

export default PlayerLinkRequestsPanel;
