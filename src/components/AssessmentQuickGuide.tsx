import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Search, Star, X } from 'lucide-react';
import { DRILL_GUIDE_CATEGORIES, DRILL_GUIDE_ENTRIES, type DrillGuideCategory, type DrillGuideEntry } from '../fprds/drillGuide';

interface AssessmentQuickGuideProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: DrillGuideCategory;
  initialDrillId?: string;
  recommendedDrillIds?: string[];
  title?: string;
}

type ActiveCategory = 'All' | DrillGuideCategory;

const normalize = (v: string): string => v.trim().toLowerCase();

const Section = (props: { title: string; items: string[] }) => {
  if (props.items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">{props.title}</p>
      <ul className="mt-3 list-disc pl-5 space-y-1.5">
        {props.items.map((line, idx) => (
          <li key={`${props.title}-${idx}`} className="text-sm text-slate-700 font-medium leading-relaxed">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function AssessmentQuickGuide({
  isOpen,
  onClose,
  initialCategory,
  initialDrillId,
  recommendedDrillIds,
  title
}: AssessmentQuickGuideProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>('All');
  const [selectedDrillId, setSelectedDrillId] = useState<string | null>(null);
  const [recommendedOnly, setRecommendedOnly] = useState(false);

  const lastFocusedElRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const isRecommendedModeAvailable = Array.isArray(recommendedDrillIds) && recommendedDrillIds.length > 0;

  const filteredEntries = useMemo(() => {
    const q = normalize(searchQuery);

    return DRILL_GUIDE_ENTRIES.filter((entry) => {
      if (activeCategory !== 'All' && entry.category !== activeCategory) return false;
      if (isRecommendedModeAvailable && recommendedOnly && !recommendedDrillIds?.includes(entry.id)) return false;

      if (!q) return true;

      const haystack = [
        entry.title,
        entry.attributeCode ?? '',
        entry.category,
        ...(entry.tags ?? []),
        ...(entry.equipment ?? []),
        ...(entry.setup ?? [])
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [activeCategory, isRecommendedModeAvailable, recommendedDrillIds, recommendedOnly, searchQuery]);

  const selectedEntry: DrillGuideEntry | null = useMemo(() => {
    if (!selectedDrillId) return null;
    return DRILL_GUIDE_ENTRIES.find(e => e.id === selectedDrillId) ?? null;
  }, [selectedDrillId]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      lastFocusedElRef.current?.focus?.();
    }, 0);
  };

  useEffect(() => {
    if (!isOpen) return;
    lastFocusedElRef.current = (document.activeElement as HTMLElement) ?? null;

    setActiveCategory(initialCategory ?? 'All');
    setSelectedDrillId(initialDrillId ?? null);
    setSearchQuery('');
    setRecommendedOnly(false);

    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  }, [initialCategory, initialDrillId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (selectedDrillId) return;
    if (filteredEntries.length === 0) return;
    setSelectedDrillId(filteredEntries[0].id);
  }, [filteredEntries, isOpen, selectedDrillId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120]">
      <button
        type="button"
        aria-label="Close quick guide (overlay)"
        onClick={handleClose}
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Quick Guide'}
        className="absolute inset-0 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-3xl max-h-[85vh] rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 border border-indigo-200 flex items-center justify-center shrink-0">
                <BookOpen size={18} className="text-indigo-700" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-display font-black text-slate-900 leading-tight truncate">{title ?? 'Quick Guide'}</p>
                <p className="text-[12px] text-slate-500 font-semibold truncate">How to run each drill consistently</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close quick guide"
              className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50 transition-colors"
            >
              <X size={16} className="text-slate-700" />
            </button>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search drills (e.g., sprint, yoyo, finishing)"
              aria-label="Search drills"
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm font-semibold text-slate-800 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory('All')}
              aria-label="Show all drills"
              className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-colors ${
                activeCategory === 'All' ? 'border-indigo-200 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              All
            </button>
            {DRILL_GUIDE_CATEGORIES.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCategory(c.id)}
                aria-label={`Filter category ${c.label}`}
                className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-colors ${
                  activeCategory === c.id ? 'border-indigo-200 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {c.label}
              </button>
            ))}

            {isRecommendedModeAvailable && (
              <button
                type="button"
                onClick={() => setRecommendedOnly(v => !v)}
                aria-label="Toggle recommended drills only"
                className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 ${
                  recommendedOnly ? 'border-amber-200 bg-amber-500 text-slate-950' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Star size={12} className={recommendedOnly ? 'text-slate-950' : 'text-amber-500'} />
                Recommended
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-[260px_1fr]">
          {/* List */}
          <div className="border-b md:border-b-0 md:border-r border-slate-200 bg-white overflow-y-auto">
            {filteredEntries.length === 0 && (
              <div className="p-6 text-center text-slate-500 text-sm font-semibold">
                No drills match your search.
              </div>
            )}

            <div className="p-3 space-y-2">
              {filteredEntries.map((entry) => {
                const active = entry.id === selectedDrillId;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSelectedDrillId(entry.id)}
                    aria-label={`Open guide for ${entry.title}`}
                    className={`w-full text-left rounded-2xl border p-3 transition-colors ${
                      active ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-sm font-black text-slate-900 leading-snug">{entry.title}</p>
                    <p className="mt-1 text-[11px] text-slate-500 font-semibold">
                      {entry.attributeCode ? `${entry.attributeCode} • ` : ''}
                      {entry.category}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail */}
          <div className="bg-slate-50/60 overflow-y-auto p-5">
            {!selectedEntry && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 text-sm font-semibold">
                Select a drill to view the quick guide.
              </div>
            )}

            {selectedEntry && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                    {selectedEntry.attributeCode ? `${selectedEntry.attributeCode} • ` : ''}
                    {selectedEntry.category}
                  </p>
                  <h4 className="mt-1 text-xl font-display font-black text-slate-900 leading-tight">{selectedEntry.title}</h4>
                </div>

                <Section title="Equipment" items={selectedEntry.equipment} />
                <Section title="Setup" items={selectedEntry.setup} />
                <Section title="Procedure" items={selectedEntry.procedure} />
                <Section title="Attempts" items={selectedEntry.attempts} />
                <Section title="Data to record" items={selectedEntry.dataToRecord} />
                <Section title="Common mistakes" items={selectedEntry.commonMistakes ?? []} />
                <Section title="Safety" items={selectedEntry.safety ?? []} />
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
