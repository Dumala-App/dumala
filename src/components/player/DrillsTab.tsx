import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Heart, Loader2, Play, Repeat, Search, X } from 'lucide-react';
import type { CloudRuntime } from '../../cloud/runtime';
import {
  PLAYER_DRILLS,
  filterPlayerDrills,
  getDrillInstructions,
  type DrillDifficulty,
  type PlayerDrill,
  type PositionGroup
} from '../../player/drillCatalog';
import {
  apexBadge,
  apexCard,
  apexChip,
  apexCta,
  apexDisplay,
  apexMono,
  apexMonoTight,
  apexSectionTitle,
  apexSheet,
  apexTag
} from './playerTheme';

interface DrillsTabProps {
  runtime: Extract<CloudRuntime, { enabled: true }>;
  userId: string;
  favorites: string[];
  onChanged: () => Promise<void> | void;
  onStartWithTimer: (label: string, seconds: number) => void;
}

const DIFFICULTIES: Array<DrillDifficulty | 'all'> = ['all', 'Easy', 'Moderate', 'Hard'];
const POSITIONS: PositionGroup[] = ['Forward', 'Midfield', 'Defender', 'Goalkeeper', 'General'];

/** Short mono code for the card overlay chip, drill-library style (PAC/SHT/…). */
const categoryCode = (category: string): string => {
  const words = category.replace(/&/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map(word => word[0]).join('').slice(0, 3).toUpperCase();
};

const DrillsTab = ({ runtime, userId, favorites, onChanged, onStartWithTimer }: DrillsTabProps) => {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<DrillDifficulty | 'all'>('all');
  const [position, setPosition] = useState<PositionGroup | 'all'>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selected, setSelected] = useState<PlayerDrill | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const drills = useMemo(
    () => filterPlayerDrills(PLAYER_DRILLS, { search, difficulty, positionGroup: position, favoritesOnly }, favoriteSet),
    [search, difficulty, position, favoritesOnly, favoriteSet]
  );

  const toggleFavorite = async (drill: PlayerDrill) => {
    setBusy(`fav-${drill.id}`);
    try {
      await runtime.dataAccess.player.toggleFavorite(userId, drill.id, favoriteSet.has(drill.id));
      await onChanged();
    } finally {
      setBusy(null);
    }
  };

  const markComplete = async (drill: PlayerDrill) => {
    setBusy(`done-${drill.id}`);
    try {
      await runtime.dataAccess.player.logDrillCompletion(userId, { drillId: drill.id, durationSeconds: drill.minutes * 60 });
      await onChanged();
      setSelected(null);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <h2 className={`${apexDisplay} text-2xl`}>Drill Library</h2>
        <span className={`${apexMono} text-[#c6c6cd]`}>{drills.length} items</span>
      </div>

      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#c6c6cd]/60" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search the drill database…"
          className="w-full rounded-lg border-none bg-[#2a3548] py-3.5 pl-12 pr-4 text-sm text-[#d8e3fb] outline-none transition-all placeholder:text-[#c6c6cd]/50 focus:ring-1 focus:ring-[#b9c8de]/50"
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button type="button" className={apexChip(favoritesOnly)} onClick={() => setFavoritesOnly(v => !v)}>♥ Saved</button>
        {DIFFICULTIES.map(level => (
          <button key={level} type="button" className={apexChip(difficulty === level)} onClick={() => setDifficulty(level)}>
            {level === 'all' ? 'All Drills' : level}
          </button>
        ))}
        {POSITIONS.map(pos => (
          <button key={pos} type="button" className={apexChip(position === pos)} onClick={() => setPosition(position === pos ? 'all' : pos)}>
            {pos}
          </button>
        ))}
      </div>

      <ul className="space-y-5">
        {drills.map(drill => {
          const fav = favoriteSet.has(drill.id);
          return (
            <li key={drill.id} className={`${apexCard} overflow-hidden`}>
              {/* Gradient header (photo stand-in) */}
              <button type="button" onClick={() => setSelected(drill)} className="relative block h-24 w-full text-left">
                <div className={`absolute inset-0 bg-gradient-to-br ${drill.color} opacity-60`} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#081425] via-[#081425]/30 to-transparent" />
                <div className="absolute bottom-3 left-4 flex flex-wrap gap-2">
                  <span className="rounded border border-[#45464d]/30 bg-[#040e1f]/90 px-2 py-0.5 font-player-mono text-[10px] uppercase text-[#d8e3fb] backdrop-blur-md">
                    {categoryCode(drill.category)}
                  </span>
                  <span className="rounded border border-[#45464d]/30 bg-[#040e1f]/90 px-2 py-0.5 font-player-mono text-[10px] uppercase text-[#d8e3fb] backdrop-blur-md">
                    {drill.positionGroup}
                  </span>
                </div>
                <span className={`${apexBadge} absolute right-3 top-3`}>{drill.difficulty}</span>
              </button>

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <button type="button" onClick={() => setSelected(drill)} className="min-w-0 flex-1 space-y-1.5 text-left">
                    <h3 className="font-player-display text-[16px] font-semibold leading-tight text-[#d8e3fb]">{drill.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock size={14} className="text-[#b9c8de]" />
                        <span className={`${apexMonoTight} text-[#d8e3fb]`}>{drill.minutes}m</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Repeat size={14} className="text-[#b9c8de]" />
                        <span className={`${apexMonoTight} text-[#d8e3fb]`}>Solo</span>
                      </span>
                    </div>
                  </button>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      aria-label={fav ? 'Remove favorite' : 'Add favorite'}
                      onClick={() => void toggleFavorite(drill)}
                      disabled={busy === `fav-${drill.id}`}
                      className={`flex h-9 w-9 items-center justify-center rounded transition-colors ${fav ? 'text-[#ff6d00]' : 'text-[#c6c6cd]/50 hover:text-[#c6c6cd]'}`}
                    >
                      <Heart size={17} fill={fav ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelected(drill)}
                      className="rounded-lg bg-[#dce7f8] px-4 py-2.5 font-player-mono text-[11px] font-bold uppercase tracking-wider text-[#0a1526] transition-all hover:brightness-110 active:scale-[0.98]"
                    >
                      Start
                    </button>
                  </div>
                </div>

                {drill.equipment.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-[#45464d]/20 pt-3">
                    {drill.equipment.slice(0, 3).map(item => (
                      <span key={item} className={apexTag}>{item}</span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
        {drills.length === 0 && (
          <li className="rounded-lg border border-dashed border-[#45464d]/40 bg-white/[0.02] px-4 py-8 text-center text-sm text-[#c6c6cd]">
            No drills match your filters.
          </li>
        )}
      </ul>

      {selected && (
        <div className="fixed inset-0 z-40 flex justify-center" role="dialog" aria-label={selected.name}>
          <button type="button" aria-label="Close" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className={`${apexSheet} relative mt-auto max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-xl p-5 pb-8 sm:my-auto sm:rounded-xl`}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className={`${apexMonoTight} mb-1 text-[#b9c8de]`}>{selected.category}</p>
                <h2 className={`${apexDisplay} text-xl`}>{selected.name}</h2>
                <div className="mt-2 flex items-center gap-2">
                  <span className={apexBadge}>{selected.difficulty}</span>
                  <span className={`${apexMonoTight} flex items-center gap-1 text-[#c6c6cd]`}>
                    <Clock size={12} className="text-[#b9c8de]" /> {selected.minutes} min
                  </span>
                </div>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close" className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-[#c6c6cd] hover:text-[#d8e3fb]">
                <X size={17} />
              </button>
            </div>

            <p className="text-sm leading-relaxed text-[#c6c6cd]">{selected.description}</p>

            {selected.equipment.length > 0 && (
              <div className="mt-4">
                <p className={`${apexMonoTight} text-[#b9c8de]`}>Equipment</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selected.equipment.map(item => (
                    <span key={item} className={apexTag}>{item}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 rounded-lg border border-white/5 bg-[#111c2d] p-4">
              <p className={`${apexMonoTight} text-[#b9c8de]`}>How to run it</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#c6c6cd]">{getDrillInstructions(selected.id)}</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { onStartWithTimer(selected.name, selected.minutes * 60); }}
                className="flex items-center justify-center gap-2 rounded-lg border border-[#45464d]/20 bg-[#1f2a3c] p-3.5 font-player-mono text-[11px] font-bold uppercase tracking-wider text-[#d8e3fb] transition-all hover:bg-[#2a3548] active:scale-[0.98]"
              >
                <Play size={15} className="text-[#dce7f8]" /> Timer
              </button>
              <button
                type="button"
                onClick={() => void markComplete(selected)}
                disabled={busy === `done-${selected.id}`}
                className={`${apexCta} flex items-center justify-center gap-2 p-3.5`}
              >
                {busy === `done-${selected.id}` ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Mark Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrillsTab;
