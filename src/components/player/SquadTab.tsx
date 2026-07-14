import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Loader2, Search, Shield, Shirt, Users } from 'lucide-react';
import type { ClubRosterPlayer, TeamTacticsSummary } from '../../cloud/player';
import type { CloudRuntime } from '../../cloud/runtime';
import { apexCard, apexEyebrow, apexMono, apexMonoTight, apexSectionTitle } from './playerTheme';
import PlayerSchedulePanel from './PlayerSchedulePanel';

interface SquadTabProps {
  runtime: Extract<CloudRuntime, { enabled: true }>;
  clubId: string | null;
  onGoToProfile: () => void;
}

const positionTone: Record<string, string> = {
  Goalkeeper: 'border-orange-300/25 bg-orange-300/[0.08] text-orange-100',
  Defender: 'border-sky-300/25 bg-sky-300/[0.08] text-sky-100',
  Midfielder: 'border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-100',
  Forward: 'border-rose-300/25 bg-rose-300/[0.08] text-rose-100'
};

const shortPosition = (position: string) => {
  if (position === 'Goalkeeper') return 'GK';
  if (position === 'Defender') return 'DEF';
  if (position === 'Midfielder') return 'MID';
  if (position === 'Forward') return 'FWD';
  return position.slice(0, 3).toUpperCase();
};

const setupValue = (value: string | null | undefined, fallback = 'Not set') => {
  const trimmed = value?.trim();
  return trimmed || fallback;
};

const TeamSetupPanel = ({ tactics }: { tactics: TeamTacticsSummary | null }) => {
  const attackingStyle = setupValue(tactics?.is_custom_strategy ? tactics.custom_playstyle_value : tactics?.playstyle);
  const defensiveStyle = setupValue(tactics?.custom_defensive_value ?? tactics?.defensive_style);
  const mentality = setupValue(tactics?.custom_mentality_value);

  return (
    <section className={`${apexCard} p-4`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity size={17} className="text-[#dce7f8]" />
          <h3 className={apexSectionTitle}>Team Setup</h3>
        </div>
        <span className={`${apexMonoTight} rounded border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[#c6c6cd]/70`}>
          {setupValue(tactics?.match_format, 'Match')}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-white/[0.06] bg-[#111c2d]/70 p-3">
          <p className={`${apexMonoTight} text-[#c6c6cd]/55`}>Formation</p>
          <p className="mt-1 font-player-display text-lg font-bold text-[#d8e3fb]">{setupValue(tactics?.formation)}</p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-[#111c2d]/70 p-3">
          <p className={`${apexMonoTight} text-[#c6c6cd]/55`}>Mentality</p>
          <p className="mt-1 truncate font-player-display text-lg font-bold text-[#d8e3fb]">{mentality}</p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-[#111c2d]/70 p-3">
          <p className={`${apexMonoTight} text-[#c6c6cd]/55`}>Attack</p>
          <p className="mt-1 truncate text-sm font-bold text-[#d8e3fb]">{attackingStyle}</p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-[#111c2d]/70 p-3">
          <p className={`${apexMonoTight} text-[#c6c6cd]/55`}>Defense</p>
          <p className="mt-1 truncate text-sm font-bold text-[#d8e3fb]">{defensiveStyle}</p>
        </div>
      </div>
      {tactics?.custom_strategy_notes && (
        <p className="mt-3 rounded-lg border border-[#b9c8de]/10 bg-[#b9c8de]/[0.05] px-3 py-2 text-xs leading-5 text-[#c6c6cd]/75">
          {tactics.custom_strategy_notes}
        </p>
      )}
      {!tactics && (
        <p className="mt-3 text-xs leading-5 text-[#c6c6cd]/65">
          Your coach has not shared a team setup yet.
        </p>
      )}
    </section>
  );
};

const SquadTab = ({ runtime, clubId, onGoToProfile }: SquadTabProps) => {
  const [players, setPlayers] = useState<ClubRosterPlayer[]>([]);
  const [tactics, setTactics] = useState<TeamTacticsSummary | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!clubId) {
      setPlayers([]);
      setTactics(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError('');
    Promise.all([
      runtime.dataAccess.player.listClubRosterPlayers(clubId),
      runtime.dataAccess.player.getMyTeamTacticsSummary(clubId)
    ])
      .then(([rosterRows, tacticsRow]) => {
        if (active) {
          setPlayers(rosterRows);
          setTactics(tacticsRow);
        }
      })
      .catch(err => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load the squad.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [runtime, clubId]);

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return players;
    return players.filter(player => (
      player.name.toLowerCase().includes(query)
      || player.position.toLowerCase().includes(query)
      || String(player.roster_number).includes(query)
    ));
  }, [players, search]);

  if (!clubId) {
    return (
      <div className="space-y-5 pt-1">
        <section>
          <p className={`${apexEyebrow} mb-1`}>Squad</p>
          <h2 className="font-player-display text-[22px] font-bold leading-tight text-[#d8e3fb]">Join your team first</h2>
        </section>
        <section className={`${apexCard} border-orange-300/20 bg-orange-300/[0.08] p-5`}>
          <div className="flex items-start gap-3">
            <Users size={21} className="mt-0.5 shrink-0 text-[#ff9440]" />
            <div>
              <h3 className="font-player-display text-base font-bold text-[#d8e3fb]">No linked squad yet</h3>
              <p className="mt-1 text-sm leading-5 text-[#c6c6cd]/75">
                Use your coach invite link or club code to unlock the team roster.
              </p>
              <button
                type="button"
                onClick={onGoToProfile}
                className="mt-3 rounded-lg bg-[#ff6d00] px-4 py-2 font-player-mono text-[11px] font-bold uppercase tracking-wide text-[#081425]"
              >
                Go to profile
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-1">
      <section>
        <p className={`${apexEyebrow} mb-1`}>Squad</p>
        <h2 className="font-player-display text-[22px] font-bold leading-tight text-[#d8e3fb]">Team roster</h2>
      </section>

      <TeamSetupPanel tactics={tactics} />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className={apexSectionTitle}>Whole Squad</h3>
          <span className={`${apexMono} text-[#b9c8de]`}>{filteredPlayers.length} shown</span>
        </div>

        <label className="flex h-11 items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0d1828]/85 px-3 text-[#c6c6cd] focus-within:border-[#b9c8de]/45">
          <Search size={16} />
          <span className="sr-only">Search squad</span>
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search name, number, position"
            className="min-w-0 flex-1 bg-transparent font-player-mono text-[11px] text-[#d8e3fb] outline-none placeholder:text-[#c6c6cd]/45"
          />
        </label>

        {loading ? (
          <div className={`${apexCard} flex items-center gap-2 p-5 text-sm text-[#c6c6cd]`}>
            <Loader2 size={16} className="animate-spin" /> Loading squad...
          </div>
        ) : error ? (
          <p className={`${apexCard} p-5 text-sm text-amber-400`} role="alert">{error}</p>
        ) : players.length === 0 ? (
          <p className={`${apexCard} p-5 text-sm text-[#c6c6cd]/70`}>No players are registered on this squad yet.</p>
        ) : filteredPlayers.length === 0 ? (
          <p className={`${apexCard} p-5 text-sm text-[#c6c6cd]/70`}>No squad members match that search.</p>
        ) : (
          <ul className="grid h-[24rem] grid-cols-2 content-start gap-2 overflow-y-auto pr-1">
            {filteredPlayers.map(player => (
              <li key={player.id} className={`${apexCard} flex min-w-0 items-center gap-2 px-2.5 py-2.5`}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-[#111c2d] font-player-display text-xs font-bold text-[#d8e3fb]">
                  {player.roster_number}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-player-display text-xs font-bold text-[#d8e3fb]">{player.name}</p>
                  <p className={`${apexMonoTight} mt-0.5 flex items-center gap-1.5 text-[#c6c6cd]/65`}>
                    <Shield size={12} /> {player.position}
                  </p>
                </div>
                <span className={`hidden min-w-12 justify-center rounded border px-2 py-1 font-player-mono text-[10px] font-bold min-[380px]:inline-flex ${positionTone[player.position] ?? 'border-white/[0.12] bg-white/[0.05] text-[#c6c6cd]'}`}>
                  <Shirt size={12} className="mr-1" /> {shortPosition(player.position)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PlayerSchedulePanel runtime={runtime} clubId={clubId} />
    </div>
  );
};

export default SquadTab;
