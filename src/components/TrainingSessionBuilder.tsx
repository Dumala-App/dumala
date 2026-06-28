import React from 'react';
import { ArrowDown, ArrowUp, CheckCircle, Clock, Copy, Gauge, Package, Plus, Sparkles, Trash2, X } from 'lucide-react';
import type { TrainingDrill } from '../training/drillLibrary';
import { getDrillEquipment, inferDrillSessionBlock } from '../training/drillLibrary';
import {
  SESSION_BLOCKS,
  SESSION_LOAD_THRESHOLDS,
  getOrderedSessionDrills,
  getScheduledDrillBlock,
  getScheduledDrillDuration,
  getScheduledDrillLoadPoints,
  getSessionDuration,
  getSessionLoadPoints,
  type DayName,
  type ScheduledDrill,
  type SessionBlockId
} from '../training/synchronization';
import { Button } from './ui/button';
import { getDrillIcon } from './TrainingDrillCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from './ui/alert-dialog';

interface TrainingSessionBuilderProps {
  day: DayName;
  drills: ScheduledDrill[];
  library: readonly TrainingDrill[];
  onChange: (drills: ScheduledDrill[]) => void;
  onClose: () => void;
}

const BLOCK_STYLES: Record<SessionBlockId, { border: string; badge: string; dot: string }> = {
  warmup: { border: 'border-amber-200', badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  technical: { border: 'border-emerald-200', badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  tactical: { border: 'border-indigo-200', badge: 'bg-indigo-50 text-indigo-700', dot: 'bg-indigo-500' },
  conditioning: { border: 'border-rose-200', badge: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500' },
  cooldown: { border: 'border-sky-200', badge: 'bg-sky-50 text-sky-700', dot: 'bg-sky-500' }
};

const uniqueEquipment = (drills: readonly ScheduledDrill[]) => {
  const values = new Map<string, string>();
  drills.flatMap(drill => drill.equipment ?? getDrillEquipment(drill.drillId)).forEach(item => {
    const key = item.toLowerCase();
    if (!values.has(key)) values.set(key, item);
  });
  return [...values.values()];
};

const createSessionDrill = (
  source: TrainingDrill,
  day: DayName,
  block: SessionBlockId,
  order: number,
  suffix: string
): ScheduledDrill => {
  const blockDefinition = SESSION_BLOCKS.find(item => item.id === block);
  return {
    id: `session-${day}-${suffix}`,
    drillId: source.id,
    name: source.name,
    icon: source.icon,
    fatigueIncrease: source.fatigueIncrease,
    block,
    order,
    durationMinutes: blockDefinition?.defaultDurationMinutes ?? 15,
    intensityRating: source.fatigueIncrease,
    equipment: getDrillEquipment(source.id)
  };
};

export default function TrainingSessionBuilder({
  day,
  drills,
  library,
  onChange,
  onClose
}: TrainingSessionBuilderProps) {
  const orderedDrills = getOrderedSessionDrills(drills);
  const duration = getSessionDuration(drills);
  const loadPoints = getSessionLoadPoints(drills);
  const equipment = uniqueEquipment(drills);
  const hasWarmup = drills.some(drill => getScheduledDrillBlock(drill) === 'warmup');
  const hasCooldown = drills.some(drill => getScheduledDrillBlock(drill) === 'cooldown');
  const blockDurations = SESSION_BLOCKS.map(block => ({
    ...block,
    duration: getSessionDuration(drills.filter(drill => getScheduledDrillBlock(drill) === block.id))
  }));
  const warnings = [
    !hasWarmup && drills.length > 0 ? 'Add a warm-up block before the main work.' : null,
    !hasCooldown && drills.length > 0 ? 'Finish with a cooldown or recovery drill.' : null,
    duration > 120 ? 'This session is longer than two hours.' : null
  ].filter((warning): warning is string => Boolean(warning));
  const readiness = drills.length === 0
    ? { label: 'Not started', className: 'border-slate-200 bg-slate-50 text-slate-600' }
    : loadPoints >= SESSION_LOAD_THRESHOLDS.high
      ? { label: 'High load', className: 'border-rose-200 bg-rose-50 text-rose-700' }
      : warnings.length > 0
        ? { label: 'Needs structure', className: 'border-amber-200 bg-amber-50 text-amber-700' }
        : { label: 'Ready', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' };

  const addDrill = (block: SessionBlockId, drillId: string) => {
    const source = library.find(drill => drill.id === drillId);
    if (!source) return;
    const blockCount = drills.filter(drill => getScheduledDrillBlock(drill) === block).length;
    onChange([
      ...drills,
      createSessionDrill(source, day, block, blockCount, `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`)
    ]);
  };

  const addSuggestedBlocks = (onlyMissing: boolean) => {
    const timestamp = Date.now();
    const additions = SESSION_BLOCKS.flatMap((block, index) => {
      const alreadyHasBlock = drills.some(drill => getScheduledDrillBlock(drill) === block.id);
      if (onlyMissing && alreadyHasBlock) return [];
      const source = library.find(drill => inferDrillSessionBlock(drill) === block.id);
      if (!source) return [];
      const order = drills.filter(drill => getScheduledDrillBlock(drill) === block.id).length;
      return [createSessionDrill(source, day, block.id, order, `${timestamp}-${index}`)];
    });
    onChange([...drills, ...additions]);
  };

  const duplicateDrill = (drill: ScheduledDrill) => {
    const block = getScheduledDrillBlock(drill);
    const blockDrills = orderedDrills.filter(item => getScheduledDrillBlock(item) === block);
    const sourceIndex = blockDrills.findIndex(item => item.id === drill.id);
    const duplicate: ScheduledDrill = {
      ...drill,
      id: `session-${day}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      order: sourceIndex + 1
    };
    const nextBlockDrills = [...blockDrills];
    nextBlockDrills.splice(sourceIndex + 1, 0, duplicate);
    const nextOrder = new Map(nextBlockDrills.map((item, index) => [item.id, index]));
    onChange([
      ...drills.filter(item => getScheduledDrillBlock(item) !== block),
      ...nextBlockDrills.map(item => ({ ...item, order: nextOrder.get(item.id) }))
    ]);
  };

  const updateDrill = (id: string, patch: Partial<ScheduledDrill>) => {
    onChange(drills.map(drill => drill.id === id ? { ...drill, ...patch } : drill));
  };

  const moveWithinBlock = (id: string, direction: -1 | 1) => {
    const current = drills.find(drill => drill.id === id);
    if (!current) return;
    const block = getScheduledDrillBlock(current);
    const blockDrills = orderedDrills.filter(drill => getScheduledDrillBlock(drill) === block);
    const currentIndex = blockDrills.findIndex(drill => drill.id === id);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= blockDrills.length) return;
    const reordered = [...blockDrills];
    [reordered[currentIndex], reordered[nextIndex]] = [reordered[nextIndex], reordered[currentIndex]];
    const orderById = new Map(reordered.map((drill, index) => [drill.id, index]));
    onChange(drills.map(drill => orderById.has(drill.id) ? { ...drill, order: orderById.get(drill.id) } : drill));
  };

  const moveToBlock = (id: string, block: SessionBlockId) => {
    const order = drills.filter(drill => getScheduledDrillBlock(drill) === block).length;
    updateDrill(id, { block, order });
  };

  return (
    <section id="training-session-builder" aria-labelledby="session-builder-title" className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:items-center">
        <div>
          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Session structure</span>
          <h3 id="session-builder-title" className="mt-1 font-display text-lg font-black text-slate-900">{day} training session</h3>
          <p className="mt-1 text-[11px] text-slate-500">Build the session in delivery order. Changes save automatically.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${readiness.className}`}>{readiness.label}</span>
          {drills.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" size="icon" aria-label="Clear session" className="text-slate-400 hover:text-rose-600">
                  <Trash2 size={16} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear {day} session?</AlertDialogTitle>
                  <AlertDialogDescription>This removes every drill from the session. The change is saved immediately.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep session</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onChange([])} className="bg-rose-600 text-white hover:bg-rose-700">Clear session</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close session builder" className="text-slate-500">
            <X size={17} />
          </Button>
        </div>
      </div>

      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-3">
          {drills.length === 0 && (
            <div className="flex flex-col gap-3 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-900">Start with a balanced structure</h4>
                <p className="mt-1 text-[10px] text-slate-600">Add one suggested drill to each available session block, then adjust the details.</p>
              </div>
              <Button type="button" onClick={() => addSuggestedBlocks(false)} className="h-9 bg-indigo-600 text-white hover:bg-indigo-700">
                <Sparkles size={14} /> Quick start
              </Button>
            </div>
          )}
          {SESSION_BLOCKS.map((block, blockIndex) => {
            const blockDrills = orderedDrills.filter(drill => getScheduledDrillBlock(drill) === block.id);
            const suggestedDrills = library.filter(drill => inferDrillSessionBlock(drill) === block.id);
            const otherDrills = library.filter(drill => inferDrillSessionBlock(drill) !== block.id);
            const blockDuration = getSessionDuration(blockDrills);
            const styles = BLOCK_STYLES[block.id];
            return (
              <section key={block.id} aria-labelledby={`session-block-${block.id}`} className={`overflow-hidden rounded-xl border ${styles.border}`}>
                <div className="flex flex-col gap-3 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`flex size-6 items-center justify-center rounded-full text-[9px] font-black ${styles.badge}`}>{blockIndex + 1}</span>
                    <div>
                      <h4 id={`session-block-${block.id}`} className="text-xs font-black text-slate-900">{block.label}</h4>
                      <p className="text-[9px] text-slate-500">{blockDrills.length} {blockDrills.length === 1 ? 'drill' : 'drills'} · {blockDuration} min</p>
                    </div>
                  </div>
                  <label className="relative">
                    <span className="sr-only">Add drill to {block.label}</span>
                    <select
                      value=""
                      onChange={(event) => addDrill(block.id, event.target.value)}
                      className="h-8 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-8 pr-7 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/30 sm:w-44"
                    >
                      <option value="">Add drill</option>
                      {suggestedDrills.length > 0 && (
                        <optgroup label={`Suggested for ${block.label}`}>
                          {suggestedDrills.map(drill => <option key={drill.id} value={drill.id}>{drill.name}</option>)}
                        </optgroup>
                      )}
                      <optgroup label="All other drills">
                        {otherDrills.map(drill => <option key={drill.id} value={drill.id}>{drill.name}</option>)}
                      </optgroup>
                    </select>
                    <Plus size={13} className="pointer-events-none absolute left-2.5 top-2 text-slate-400" aria-hidden="true" />
                  </label>
                </div>

                <div className="space-y-2 p-3">
                  {blockDrills.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-[10px] text-slate-400">
                      No {block.label.toLowerCase()} drills yet.
                    </div>
                  ) : blockDrills.map((drill, index) => (
                    <div key={drill.id} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-start gap-2.5">
                        <span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg text-white ${styles.dot}`}>
                          {getDrillIcon(drill.drillId)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-black text-slate-900">{drill.name}</p>
                          <p className="mt-0.5 text-[9px] text-slate-500">{getScheduledDrillLoadPoints(drill)} load points</p>
                          {(drill.equipment ?? getDrillEquipment(drill.drillId)).length > 0 && (
                            <p className="mt-1 truncate text-[8px] text-slate-400">{(drill.equipment ?? getDrillEquipment(drill.drillId)).join(', ')}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Button type="button" variant="ghost" size="icon" disabled={index === 0} onClick={() => moveWithinBlock(drill.id, -1)} aria-label={`Move ${drill.name} up`} className="size-7 text-slate-400">
                            <ArrowUp size={13} />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" disabled={index === blockDrills.length - 1} onClick={() => moveWithinBlock(drill.id, 1)} aria-label={`Move ${drill.name} down`} className="size-7 text-slate-400">
                            <ArrowDown size={13} />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" onClick={() => duplicateDrill(drill)} aria-label={`Duplicate ${drill.name}`} className="size-7 text-slate-400 hover:text-indigo-600">
                            <Copy size={13} />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" onClick={() => onChange(drills.filter(item => item.id !== drill.id))} aria-label={`Remove ${drill.name}`} className="size-7 text-slate-400 hover:text-rose-600">
                            <X size={13} />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <label className="text-[9px] font-bold text-slate-500">
                          Duration
                          <div className="relative mt-1">
                            <input
                              type="number"
                              min={5}
                              max={90}
                              step={5}
                              value={getScheduledDrillDuration(drill)}
                              onChange={(event) => updateDrill(drill.id, { durationMinutes: Number(event.target.value) || 5 })}
                              className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 pr-9 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/30"
                            />
                            <span className="pointer-events-none absolute right-2.5 top-2 text-[9px] text-slate-400">min</span>
                          </div>
                        </label>
                        <label className="text-[9px] font-bold text-slate-500">
                          Intensity
                          <select
                            value={Math.max(1, Math.min(10, drill.intensityRating ?? drill.fatigueIncrease))}
                            onChange={(event) => updateDrill(drill.id, { intensityRating: Number(event.target.value) })}
                            className="mt-1 h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/30"
                          >
                            {Array.from({ length: 10 }, (_, rating) => rating + 1).map(rating => (
                              <option key={rating} value={rating}>{rating}/10</option>
                            ))}
                          </select>
                        </label>
                        <label className="text-[9px] font-bold text-slate-500">
                          Session block
                          <select
                            value={getScheduledDrillBlock(drill)}
                            onChange={(event) => moveToBlock(drill.id, event.target.value as SessionBlockId)}
                            className="mt-1 h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/30"
                          >
                            {SESSION_BLOCKS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                          </select>
                        </label>
                        <label className="text-[9px] font-bold text-slate-500 sm:col-span-3">
                          Coach cue <span className="font-normal text-slate-400">(optional)</span>
                          <input
                            type="text"
                            value={drill.notes ?? ''}
                            onChange={(event) => updateDrill(drill.id, { notes: event.target.value })}
                            placeholder="e.g. two-touch maximum, scan before receiving"
                            className="mt-1 h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] text-slate-700 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/30"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <aside aria-label="Session summary" className="h-fit rounded-xl border border-slate-200 bg-slate-50 p-4 lg:sticky lg:top-4">
          <h4 className="text-xs font-black text-slate-900">Session summary</h4>
          <div className="mt-3 grid grid-cols-3 gap-2 lg:grid-cols-1">
            <div className="rounded-lg border border-slate-200 bg-white p-2.5">
              <Clock size={14} className="text-indigo-500" aria-hidden="true" />
              <strong className="mt-1 block text-base font-black text-slate-900">{duration} min</strong>
              <span className="text-[8px] font-bold uppercase text-slate-400">Duration</span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-2.5">
              <Gauge size={14} className="text-rose-500" aria-hidden="true" />
              <strong className="mt-1 block text-base font-black text-slate-900">{loadPoints}</strong>
              <span className="text-[8px] font-bold uppercase text-slate-400">Load points</span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-2.5">
              <CheckCircle size={14} className="text-emerald-500" aria-hidden="true" />
              <strong className="mt-1 block text-base font-black text-slate-900">{drills.length}</strong>
              <span className="text-[8px] font-bold uppercase text-slate-400">Drills</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-[9px] font-black uppercase tracking-wider text-slate-500">Block balance</div>
            {duration > 0 ? (
              <>
                <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-slate-200" aria-label="Session duration by block">
                  {blockDurations.filter(block => block.duration > 0).map(block => (
                    <span
                      key={block.id}
                      style={{ width: `${block.duration / duration * 100}%` }}
                      className={BLOCK_STYLES[block.id].dot}
                      title={`${block.label}: ${block.duration} minutes`}
                    />
                  ))}
                </div>
                <div className="mt-2 space-y-1">
                  {blockDurations.filter(block => block.duration > 0).map(block => (
                    <div key={block.id} className="flex items-center justify-between text-[9px] text-slate-500">
                      <span className="flex items-center gap-1.5"><span className={`size-1.5 rounded-full ${BLOCK_STYLES[block.id].dot}`} />{block.label}</span>
                      <span className="font-bold text-slate-700">{block.duration} min</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-2 text-[10px] text-slate-400">Add drills to see the session balance.</p>
            )}
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
              <Package size={13} aria-hidden="true" /> Equipment
            </div>
            {equipment.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {equipment.map(item => <span key={item} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[9px] text-slate-600">{item}</span>)}
              </div>
            ) : (
              <p className="mt-2 text-[10px] text-slate-400">Add drills to create the equipment list.</p>
            )}
          </div>

          {warnings.length > 0 && (
            <div className="mt-4 space-y-1.5 rounded-lg border border-amber-200 bg-amber-50 p-3" role="status">
              {warnings.map(warning => <p key={warning} className="text-[9px] leading-relaxed text-amber-800">{warning}</p>)}
              {drills.length > 0 && (!hasWarmup || !hasCooldown) && (
                <Button type="button" variant="outline" size="sm" onClick={() => addSuggestedBlocks(true)} className="mt-2 h-7 border-amber-200 bg-white px-2 text-[9px] text-amber-800 hover:bg-amber-100">
                  <Sparkles size={12} /> Add missing blocks
                </Button>
              )}
            </div>
          )}

          <Button type="button" onClick={onClose} className="mt-4 h-9 w-full bg-indigo-600 text-white hover:bg-indigo-700">
            Done
          </Button>
        </aside>
      </div>
    </section>
  );
}
