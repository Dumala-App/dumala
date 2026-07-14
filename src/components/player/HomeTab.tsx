import React from 'react';
import { CalendarDays, Dumbbell, Play, Timer as TimerIcon, UserRound, Volleyball } from 'lucide-react';
import type { ClubRosterPlayer, PlayerDrillCompletion, PlayerProfile, TeamScheduleEntry } from '../../cloud/player';
import type { PlayerStats } from '../../player/achievements';
import { weeklyTotals } from '../../player/progress';
import {
  apexCard,
  apexGhost,
  apexMono,
  apexMonoTight,
  apexSectionTitle
} from './playerTheme';

interface HomeTabProps {
  profile: PlayerProfile | null;
  linkedPlayer: ClubRosterPlayer | null;
  completions: PlayerDrillCompletion[];
  stats: PlayerStats;
  nextFixture: TeamScheduleEntry | null;
  linkedClubId: string | null;
  onGoToDrills: () => void;
  onGoToTimer: () => void;
  onGoToProfile: () => void;
}

type AttributeMap = Record<string, number>;

const isAttributeMap = (value: unknown): value is AttributeMap => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.values(value).every(item => typeof item === 'number' && Number.isFinite(item));
};

const getBaseAttributes = (player: ClubRosterPlayer | null): AttributeMap => {
  const attrs = isAttributeMap(player?.base_attributes) ? player.base_attributes : {};
  return {
    pace: attrs.pace ?? 50,
    stamina: attrs.stamina ?? 50,
    agility: attrs.agility ?? 50,
    strength: attrs.strength ?? 50,
    firstTouch: attrs.firstTouch ?? 50,
    shortPassing: attrs.shortPassing ?? 50
  };
};

const getPositionAttributes = (player: ClubRosterPlayer | null): AttributeMap => (
  isAttributeMap(player?.position_attributes) ? player.position_attributes : {}
);

const getTraits = (player: ClubRosterPlayer | null): string[] => (
  Array.isArray(player?.specialty_traits)
    ? player.specialty_traits.filter((trait): trait is string => typeof trait === 'string' && trait.trim().length > 0)
    : []
);

const average = (values: number[]) => Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length));

const calculateOvr = (base: AttributeMap, positionAttrs: AttributeMap) => {
  const baseMean = average(Object.values(base));
  const positionValues = Object.values(positionAttrs);
  const positionMean = positionValues.length > 0 ? average(positionValues) : baseMean;
  return Math.round(baseMean * 0.6 + positionMean * 0.4);
};

const formatAttributeLabel = (key: string) => (
  key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, char => char.toUpperCase())
);

const shortPosition = (position: string | null | undefined) => {
  if (position === 'Goalkeeper') return 'GK';
  if (position === 'Defender') return 'DEF';
  if (position === 'Midfielder') return 'MID';
  if (position === 'Forward') return 'FWD';
  const trimmed = position?.trim();
  return trimmed ? trimmed.slice(0, 3).toUpperCase() : 'PLY';
};

const getProfileAttributes = (position: string | null | undefined, base: AttributeMap, positionAttrs: AttributeMap) => {
  if (position === 'Goalkeeper') {
    return [
      { label: 'DIV', value: positionAttrs.Diving ?? 50, bar: 'bg-sky-400' },
      { label: 'HAN', value: positionAttrs.Handling ?? 50, bar: 'bg-yellow-400' },
      { label: 'REF', value: positionAttrs.Reflexes ?? 50, bar: 'bg-rose-400' },
      { label: 'PAC', value: base.pace, bar: 'bg-emerald-400' }
    ];
  }
  if (position === 'Defender') {
    return [
      { label: 'TAC', value: positionAttrs.Tackling ?? 50, bar: 'bg-sky-400' },
      { label: 'STR', value: base.strength, bar: 'bg-violet-400' },
      { label: 'PAC', value: base.pace, bar: 'bg-indigo-400' },
      { label: 'PAS', value: base.shortPassing, bar: 'bg-emerald-400' }
    ];
  }
  if (position === 'Midfielder') {
    return [
      { label: 'PAS', value: base.shortPassing, bar: 'bg-emerald-400' },
      { label: 'VIS', value: positionAttrs.Vision ?? 50, bar: 'bg-amber-400' },
      { label: 'AGI', value: base.agility, bar: 'bg-rose-400' },
      { label: 'STA', value: base.stamina, bar: 'bg-yellow-400' }
    ];
  }
  return [
    { label: 'FIN', value: positionAttrs.Finishing ?? 50, bar: 'bg-rose-400' },
    { label: 'PAC', value: base.pace, bar: 'bg-indigo-400' },
    { label: 'AGI', value: base.agility, bar: 'bg-amber-400' },
    { label: 'STR', value: base.strength, bar: 'bg-violet-400' }
  ];
};

const formatFixtureDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

const PlayerProfileCard = ({ profile, linkedPlayer }: { profile: PlayerProfile | null; linkedPlayer: ClubRosterPlayer | null }) => {
  const base = getBaseAttributes(linkedPlayer);
  const positionAttrs = getPositionAttributes(linkedPlayer);
  const traits = getTraits(linkedPlayer);
  const displayName = linkedPlayer?.name || profile?.display_name || 'Player profile';
  const position = linkedPlayer?.position || profile?.position || null;
  const attrs = getProfileAttributes(position, base, positionAttrs);
  const photoUrl = linkedPlayer?.photo_url || profile?.avatar_url || '';
  const ovr = linkedPlayer ? calculateOvr(base, positionAttrs) : null;

  return (
    <section className="rounded-xl border border-[#32415e]/70 bg-[#080f24]/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_18px_44px_-30px_rgba(0,0,0,.8)]">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#4266ff]/50 bg-[#13225d] text-[#dce7f8]">
          {photoUrl ? (
            <img src={photoUrl} alt={displayName} className="h-full w-full object-cover object-top" referrerPolicy="no-referrer" />
          ) : (
            <UserRound size={27} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-player-display text-base font-bold text-[#eef4ff]">{displayName}</h2>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
            <span className="rounded border border-cyan-300/35 bg-cyan-300/15 px-2 py-0.5 font-player-mono text-[9px] font-black uppercase tracking-wider text-cyan-100">
              {shortPosition(position)}
            </span>
            {linkedPlayer && <span className="font-player-mono text-[10px] font-black text-[#7f8aa3]">#{linkedPlayer.roster_number}</span>}
            {linkedPlayer ? <span className="font-player-mono text-[10px] font-medium text-[#5f6d84]">Coach synced</span> : null}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-player-display text-[28px] font-black leading-none text-[#f8fbff]">{ovr ?? '--'}</p>
          <p className="mt-0.5 font-player-mono text-[9px] font-black uppercase tracking-widest text-[#ff9440]">OVR</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
        {attrs.map(attr => (
          <div key={attr.label} className="flex items-center gap-2">
            <span className="w-7 shrink-0 text-right font-player-mono text-[9px] font-black tracking-wider text-[#7f8aa3]">{attr.label}</span>
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
              <div className={`h-full rounded-full ${attr.bar}`} style={{ width: `${Math.max(0, Math.min(100, attr.value))}%` }} />
            </div>
            <span className="w-6 shrink-0 text-right font-player-mono text-[10px] font-bold tabular-nums text-[#e8eefb]">{attr.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-3">
        <div className="flex flex-wrap items-center gap-3 font-player-mono text-[10px] font-bold uppercase tracking-wide text-[#7f8aa3]">
          <span><span className="text-[#f8fbff]">{linkedPlayer?.games_played ?? 0}</span> GP</span>
          <span><span className="text-[#f8fbff]">{linkedPlayer?.goals ?? 0}</span> G</span>
          <span><span className="text-[#f8fbff]">{linkedPlayer?.assists ?? 0}</span> A</span>
          {linkedPlayer && linkedPlayer.yellow_cards + linkedPlayer.red_cards > 0 && (
            <span className="inline-flex items-center gap-1">
              {linkedPlayer.yellow_cards > 0 && (
                <span className="inline-flex items-center gap-1" title={`${linkedPlayer.yellow_cards} yellow cards`}>
                  <span className="inline-block h-3 w-2 rounded-[1px] bg-yellow-300" />
                  {linkedPlayer.yellow_cards}
                </span>
              )}
              {linkedPlayer.red_cards > 0 && (
                <span className="inline-flex items-center gap-1" title={`${linkedPlayer.red_cards} red cards`}>
                  <span className="inline-block h-3 w-2 rounded-[1px] bg-red-500" />
                  {linkedPlayer.red_cards}
                </span>
              )}
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-wrap justify-end gap-1.5">
          {(traits.length > 0 ? traits : ['Coach linked']).slice(0, 2).map(trait => (
            <span key={trait} className="max-w-[9rem] truncate rounded border border-white/[0.14] bg-white/[0.05] px-2 py-1 font-player-mono text-[9px] font-bold text-[#d8e3fb]">
              {trait}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

const AttributeRow = ({ label, value }: { label: string; value: number }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between gap-2">
      <span className="min-w-0 flex-1 truncate font-player-mono text-[8px] font-bold uppercase tracking-[0.12em] text-[#c6c6cd]/65">
        {label}
      </span>
      <span className="w-6 shrink-0 text-right font-player-mono text-[10px] font-black tabular-nums text-[#eef4ff]">{value}</span>
    </div>
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
      <div className="h-full rounded-full bg-[#dce7f8]/80" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  </div>
);

const AttributeColumn = ({ title, attributes, emptyText }: { title: string; attributes: AttributeMap; emptyText: string }) => {
  const entries = Object.entries(attributes);

  return (
    <div className={`${apexCard} min-w-0 p-4`}>
      <h4 className={`${apexMonoTight} mb-3 text-[#dce7f8]`}>{title}</h4>
      {entries.length > 0 ? (
        <div className="space-y-2.5">
          {entries.map(([key, value]) => (
            <AttributeRow key={key} label={formatAttributeLabel(key)} value={value} />
          ))}
        </div>
      ) : (
        <p className="text-xs leading-5 text-[#c6c6cd]/60">{emptyText}</p>
      )}
    </div>
  );
};

const Stat = ({ icon: Icon, value, label, accent }: {
  icon: React.ComponentType<{ size?: number; className?: string; fill?: string }>;
  value: string | number;
  label: string;
  accent?: boolean;
}) => (
  <div className={`${apexCard} border-l-4 p-4 ${accent ? 'border-l-[#ff6d00]/70' : 'border-l-[#b9c8de]/70'}`}>
    <Icon size={17} className={accent ? 'text-[#ff9440]' : 'text-[#b9c8de]'} fill={accent ? 'currentColor' : 'none'} />
    <p className="mt-2 font-player-display text-2xl font-bold text-[#d8e3fb]">{value}</p>
    <p className={`${apexMonoTight} mt-0.5 text-[#c6c6cd]/70`}>{label}</p>
  </div>
);

const HomeTab = ({
  profile,
  linkedPlayer,
  completions,
  stats,
  nextFixture,
  linkedClubId,
  onGoToDrills,
  onGoToTimer,
  onGoToProfile
}: HomeTabProps) => {
  const baseAttributes = getBaseAttributes(linkedPlayer);
  const positionAttributes = getPositionAttributes(linkedPlayer);
  const totals = weeklyTotals(completions);

  return (
    <div className="space-y-7">
      <PlayerProfileCard profile={profile} linkedPlayer={linkedPlayer} />

      {!linkedClubId && (
        <section className={`${apexCard} border-orange-300/20 bg-orange-300/[0.08] p-5`}>
          <div className="flex items-start gap-3">
            <CalendarDays size={19} className="mt-0.5 shrink-0 text-[#ff9440]" />
            <div className="min-w-0 flex-1">
              <h3 className="font-player-display text-base font-bold text-[#d8e3fb]">Connect your team</h3>
              <p className="mt-1 text-sm leading-5 text-[#c6c6cd]/75">
                Use your coach invite link or club code once. Dumala will send the join request for review.
              </p>
              <button type="button" onClick={onGoToProfile} className={`${apexGhost} mt-3 px-4 py-2.5 font-player-mono text-[11px] font-bold uppercase tracking-wide`}>
                Join team
              </button>
            </div>
          </div>
        </section>
      )}

      {nextFixture && (
        <section className={`${apexCard} p-5`}>
          <div className="mb-2 flex items-center gap-2 text-[#b9c8de]">
            <CalendarDays size={15} className="text-[#dce7f8]" />
            <span className={apexMono}>
              {formatFixtureDate(nextFixture.event_date)}{nextFixture.event_time ? ` · ${nextFixture.event_time}` : ''}
            </span>
          </div>
          <h4 className="font-player-display text-lg font-bold leading-tight text-[#d8e3fb]">
            {nextFixture.type === 'training' || nextFixture.type === 'meeting'
              ? nextFixture.type
              : `vs ${nextFixture.opponent}`}
          </h4>
          {nextFixture.location && <p className={`${apexMonoTight} mt-1 text-[#c6c6cd]/60`}>{nextFixture.location}</p>}
        </section>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={Volleyball} value={stats.jugglingBest || '-'} label="Best Juggle" accent />
        <Stat icon={Dumbbell} value={totals.drills} label="This Week" />
        <Stat icon={TimerIcon} value={`${stats.totalMinutes}m`} label="All Time" />
      </div>

      <section className="space-y-4">
        <h3 className={apexSectionTitle}>Quick Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          <AttributeColumn
            title="Base attributes"
            attributes={baseAttributes}
            emptyText="No base attributes yet."
          />
          <AttributeColumn
            title="Position attributes"
            attributes={positionAttributes}
            emptyText="No position attributes assigned yet."
          />
        </div>
      </section>

      <section className="space-y-4 pb-28">
        <div className="flex items-end justify-between">
          <h3 className={apexSectionTitle}>Today's Training</h3>
          <button type="button" onClick={onGoToDrills} className={`${apexMono} text-[#b9c8de] transition-colors hover:text-[#dce7f8]`}>
            Library
          </button>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <button
            type="button"
            onClick={onGoToDrills}
            className={`${apexGhost} flex items-center justify-center gap-2 px-4 py-4 font-player-mono text-[11px] font-bold uppercase tracking-wider text-[#d8e3fb] hover:text-white`}
          >
            Start Session <Play size={16} />
          </button>
          <button type="button" onClick={onGoToTimer} aria-label="Workout timer" className={`${apexGhost} flex w-16 items-center justify-center`}>
            <TimerIcon size={20} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomeTab;
