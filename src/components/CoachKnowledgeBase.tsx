import React, { useMemo, useState } from 'react';
import { BookOpen, Filter } from 'lucide-react';
import {
  COACHING_LIBRARY_CATEGORY_LABELS,
  COACHING_LIBRARY_ITEMS,
  type CoachingLibraryCategory,
  type CoachingLibraryItem
} from '../knowledge/coachingLibrary';
import { CoachingLibraryDiagram } from './CoachingLibraryDiagram';

const CATEGORY_ORDER: readonly CoachingLibraryCategory[] = [
  'formation',
  'attacking',
  'defending',
  'principle',
  'case-study'
];

const CATEGORY_ACCENTS: Record<CoachingLibraryCategory, string> = {
  formation: 'text-emerald-300 border-emerald-500/20 bg-emerald-500/10',
  attacking: 'text-amber-300 border-amber-500/20 bg-amber-500/10',
  defending: 'text-sky-300 border-sky-500/20 bg-sky-500/10',
  principle: 'text-fuchsia-300 border-fuchsia-500/20 bg-fuchsia-500/10',
  'case-study': 'text-indigo-300 border-indigo-500/20 bg-indigo-500/10'
};

type KnowledgeFilter = 'all' | CoachingLibraryCategory;

export const KnowledgeVisual = ({ item }: { item: CoachingLibraryItem }) => (
  <aside className="mt-4">
    <CoachingLibraryDiagram item={item} />
  </aside>
);

export const KnowledgeCard = ({ item }: { item: CoachingLibraryItem }) => (
  <article className="flex h-full flex-col rounded-xl border border-slate-800/80 bg-[#0f172a]/80 p-5 transition-colors hover:border-slate-700">
    <div className="flex flex-wrap items-center gap-2">
      <span className={`rounded-md border px-2 py-1 text-[9px] font-black uppercase tracking-widest ${CATEGORY_ACCENTS[item.category]}`}>
        {COACHING_LIBRARY_CATEGORY_LABELS[item.category]}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {item.tags.slice(0, 3).join(' / ')}
      </span>
    </div>
    <h4 className="mt-3 font-display text-sm font-black uppercase tracking-wide text-white">
      {item.title}
    </h4>
    <p className="mt-2 text-xs leading-relaxed text-slate-300">
      {item.summary}
    </p>
    <div className="mt-4 grid gap-5 border-t border-slate-800/70 pt-4 md:grid-cols-2">
      <div>
        <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Key Learning</h5>
        <ul className="mt-2 list-disc space-y-1.5 pl-4 marker:text-emerald-400">
          {item.learningPoints.map(point => (
            <li key={point} className="text-[11px] leading-relaxed text-slate-300">
              {point}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-300">Coach Notes</h5>
        <ul className="mt-2 list-disc space-y-1.5 pl-4 marker:text-amber-300">
          {(item.coachingNotes ?? ['Add session-specific coaching notes here when this topic expands.']).map(note => (
            <li key={note} className="text-[11px] leading-relaxed text-slate-400">
              {note}
            </li>
          ))}
        </ul>
      </div>
    </div>
    <KnowledgeVisual item={item} />
  </article>
);

export const KnowledgeSection = ({
  category,
  items
}: {
  category: CoachingLibraryCategory;
  items: readonly CoachingLibraryItem[];
}) => (
  <section className="space-y-3" aria-labelledby={`knowledge-section-${category}`}>
    <div className="flex items-center justify-between gap-3">
      <h4 id={`knowledge-section-${category}`} className="font-display text-sm font-black uppercase tracking-wide text-white">
        {COACHING_LIBRARY_CATEGORY_LABELS[category]}
      </h4>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
        {items.length} {items.length === 1 ? 'entry' : 'entries'}
      </span>
    </div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {items.map(item => (
        <KnowledgeCard key={item.id} item={item} />
      ))}
    </div>
  </section>
);

export const CoachKnowledgeBase = () => {
  const [activeFilter, setActiveFilter] = useState<KnowledgeFilter>('all');

  const sections = useMemo(() => (
    CATEGORY_ORDER
      .map(category => ({
        category,
        items: COACHING_LIBRARY_ITEMS.filter(item => (
          item.category === category && (activeFilter === 'all' || item.category === activeFilter)
        ))
      }))
      .filter(section => section.items.length > 0)
  ), [activeFilter]);

  return (
    <section id="coach-knowledgebase-panel" className="xl:col-span-12 relative z-10 space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a]/95 p-5 shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Coach Reference Library</p>
            <h3 className="font-display text-xl font-black text-white">Formations, game phases, and tactical models</h3>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-400">
              A structured study area for comparing shapes, phases, principles, and recognizable tactical ideas from clubs and national teams.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <BookOpen size={15} className="text-indigo-300" aria-hidden="true" />
            {COACHING_LIBRARY_ITEMS.length} topics
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <Filter size={13} aria-hidden="true" />
            Focus
          </span>
          {(['all', ...CATEGORY_ORDER] as const).map(filter => {
            const isActive = activeFilter === filter;
            const label = filter === 'all' ? 'All' : COACHING_LIBRARY_CATEGORY_LABELS[filter];
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                  isActive
                    ? 'border-amber-400 bg-amber-400 text-slate-950'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {sections.map(section => (
        <KnowledgeSection key={section.category} category={section.category} items={section.items} />
      ))}
    </section>
  );
};
