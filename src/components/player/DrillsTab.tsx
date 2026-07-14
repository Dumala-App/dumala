import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Heart, Loader2, Play, Repeat, Search, X } from 'lucide-react';
import type { CloudRuntime } from '../../cloud/runtime';
import {
  PLAYER_DRILLS,
  filterPlayerDrills,
  getDrillInstructions,
  getJugglingProgress,
  serializeJugglingScoreNote,
  JUGGLING_DRILL_ID,
  type PlayerDrill
} from '../../player/drillCatalog';
import type { PlayerDrillCompletion } from '../../cloud/player';
import {
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
  completions: PlayerDrillCompletion[];
  onChanged: () => Promise<void> | void;
  onStartWithTimer: (label: string, seconds: number) => void;
}

/** Short mono code for the card overlay chip, drill-library style (PAC/SHT/…). */
const categoryCode = (category: string): string => {
  const words = category.replace(/&/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map(word => word[0]).join('').slice(0, 3).toUpperCase();
};

const DrillsTab = ({ runtime, userId, favorites, completions, onChanged, onStartWithTimer }: DrillsTabProps) => {
  const [search, setSearch] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selected, setSelected] = useState<PlayerDrill | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [jugglingScore, setJugglingScore] = useState('');

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const drills = useMemo(
    () => filterPlayerDrills(PLAYER_DRILLS, { search, favoritesOnly }, favoriteSet),
    [search, favoritesOnly, favoriteSet]
  );
  const jugglingProgress = useMemo(() => getJugglingProgress(completions), [completions]);
  const jugglingDrill = PLAYER_DRILLS.find(drill => drill.id === JUGGLING_DRILL_ID);

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

  const recordJugglingScore = async () => {
    const score = Number(jugglingScore);
    if (!Number.isFinite(score) || score < 0 || !jugglingDrill) return;
    setBusy('juggling-score');
    try {
      await runtime.dataAccess.player.logDrillCompletion(userId, {
        drillId: JUGGLING_DRILL_ID,
        durationSeconds: jugglingDrill.minutes * 60,
        notes: serializeJugglingScoreNote(score)
      });
      setJugglingScore('');
      await onChanged();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <h2 className={`${apexDisplay} text-2xl`}>Drill Library</h2>
        <span className={`${apexMono} text-[#c6c6cd]`}>{drills.length} solo</span>
      </div>

      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#c6c6cd]/60" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search solo drills..."
          className="w-full rounded-lg border-none bg-[#2a3548] py-3.5 pl-12 pr-4 text-sm text-[#d8e3fb] outline-none transition-all placeholder:text-[#c6c6cd]/50 focus:ring-1 focus:ring-[#b9c8de]/50"
        />
      </div>

      <section className={`${apexCard} p-4`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`${apexMonoTight} mb-1 text-[#b9c8de]`}>Ball control tracker</p>
            <h3 className="font-player-display text-lg font-bold text-[#d8e3fb]">Juggling score</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-right">
            <div>
              <p className={`${apexMonoTight} text-[#c6c6cd]/55`}>Best</p>
              <p className="font-player-display text-2xl font-bold text-[#d8e3fb]">{jugglingProgress.bestScore ?? '-'}</p>
            </div>
            <div>
              <p className={`${apexMonoTight} text-[#c6c6cd]/55`}>Latest</p>
              <p className="font-player-display text-2xl font-bold text-[#d8e3fb]">{jugglingProgress.latestScore ?? '-'}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <label className="sr-only" htmlFor="juggling-score">Juggling score</label>
          <input
            id="juggling-score"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={jugglingScore}
            onChange={event => setJugglingScore(event.target.value)}
            placeholder="Best unbroken count"
            className="min-w-0 rounded-lg border border-[#45464d]/30 bg-[#040e1f] px-3 py-3 font-player-mono text-[11px] text-[#d8e3fb] outline-none placeholder:text-[#c6c6cd]/45 focus:border-[#b9c8de]/60"
          />
          <button
            type="button"
            onClick={() => void recordJugglingScore()}
            disabled={busy === 'juggling-score' || !jugglingScore}
            className="rounded-lg bg-[#dce7f8] px-4 py-3 font-player-mono text-[11px] font-bold uppercase tracking-wider text-[#0a1526] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
          >
            {busy === 'juggling-score' ? <Loader2 size={15} className="animate-spin" /> : 'Record'}
          </button>
        </div>
        {jugglingProgress.attempts.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {jugglingProgress.attempts.slice(0, 6).map(attempt => (
              <span key={attempt.id} className="shrink-0 rounded border border-white/[0.08] bg-[#111c2d] px-3 py-2">
                <span className="block font-player-display text-base font-bold text-[#d8e3fb]">{attempt.score}</span>
                <span className={`${apexMonoTight} text-[#c6c6cd]/55`}>
                  {new Date(attempt.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </span>
            ))}
          </div>
        )}
      </section>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button type="button" className={apexChip(favoritesOnly)} onClick={() => setFavoritesOnly(v => !v)}>♥ Saved</button>
      </div>

      <ul className="grid grid-cols-2 gap-3">
        {drills.map(drill => {
          const fav = favoriteSet.has(drill.id);
          return (
            <li key={drill.id} className={`${apexCard} overflow-hidden`}>
              <button type="button" onClick={() => setSelected(drill)} className="relative block h-16 w-full text-left">
                <div className={`absolute inset-0 bg-gradient-to-br ${drill.color} opacity-60`} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#081425] via-[#081425]/30 to-transparent" />
                <div className="absolute bottom-2 left-2 flex flex-wrap gap-2">
                  <span className="rounded border border-[#45464d]/30 bg-[#040e1f]/90 px-2 py-0.5 font-player-mono text-[10px] uppercase text-[#d8e3fb] backdrop-blur-md">
                    {categoryCode(drill.category)}
                  </span>
                </div>
              </button>

              <div className="flex min-h-[8.5rem] flex-col p-3">
                <button type="button" onClick={() => setSelected(drill)} className="min-w-0 flex-1 space-y-2 text-left">
                  <h3 className="overflow-hidden font-player-display text-[13px] font-semibold leading-tight text-[#d8e3fb] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                    {drill.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-[#b9c8de]" />
                        <span className={`${apexMonoTight} text-[#d8e3fb]`}>{drill.minutes}m</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Repeat size={12} className="text-[#b9c8de]" />
                        <span className={`${apexMonoTight} text-[#d8e3fb]`}>Solo</span>
                      </span>
                  </div>
                </button>

                <div className="mt-3 flex items-center gap-2 border-t border-[#45464d]/20 pt-3">
                  <button
                    type="button"
                    aria-label={fav ? 'Remove favorite' : 'Add favorite'}
                    onClick={() => void toggleFavorite(drill)}
                    disabled={busy === `fav-${drill.id}`}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-[#111c2d]/70 transition-colors ${fav ? 'text-[#ff6d00]' : 'text-[#c6c6cd]/50 hover:text-[#c6c6cd]'}`}
                  >
                    <Heart size={16} fill={fav ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelected(drill)}
                    className="flex h-9 min-w-0 flex-1 items-center justify-center rounded-lg bg-[#dce7f8] px-2 font-player-mono text-[9px] font-bold uppercase tracking-wider text-[#0a1526] transition-all hover:brightness-110 active:scale-[0.98]"
                  >
                    Start
                  </button>
                </div>

                {drill.equipment.length > 0 && (
                  <div className="mt-2 min-w-0">
                    <span className={`${apexTag} inline-flex max-w-full truncate`}>{drill.equipment[0]}</span>
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
