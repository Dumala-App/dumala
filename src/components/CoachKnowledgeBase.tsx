import React, { useMemo, useState } from 'react';
import { BookOpen, Clock, ExternalLink, Lightbulb, ClipboardList, Search } from 'lucide-react';
import {
  ACTIVE_LIBRARY_ARTICLES,
  LIBRARY_CATEGORY_DESCRIPTIONS,
  LIBRARY_CATEGORY_LABELS,
  LIBRARY_CATEGORY_ORDER,
  estimateReadingMinutes,
  searchLibraryArticles,
  type LibraryArticle,
  type LibraryCategory
} from '../knowledge/library';
import { COACHING_LIBRARY_ITEMS } from '../knowledge/coachingLibrary';
import { CoachingLibraryDiagram } from './CoachingLibraryDiagram';
import { Button } from './ui/button';
import { Input } from './ui/input';

const CATEGORY_ACCENTS: Record<LibraryCategory, string> = {
  philosophy: 'text-amber-300 border-amber-500/20 bg-amber-500/10',
  'club-dna': 'text-indigo-300 border-indigo-500/20 bg-indigo-500/10',
  formations: 'text-emerald-300 border-emerald-500/20 bg-emerald-500/10',
  principles: 'text-sky-300 border-sky-500/20 bg-sky-500/10',
  'coaching-craft': 'text-fuchsia-300 border-fuchsia-500/20 bg-fuchsia-500/10'
};

type LibraryFilter = 'all' | LibraryCategory;

const CategoryBadge = ({ category }: { category: LibraryCategory }) => (
  <span className={`rounded-md border px-2 py-1 text-[9px] font-black uppercase tracking-widest ${CATEGORY_ACCENTS[category]}`}>
    {LIBRARY_CATEGORY_LABELS[category]}
  </span>
);

const ArticleListItem = ({
  article,
  isSelected,
  onSelect
}: {
  article: LibraryArticle;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) => (
  <button
    type="button"
    onClick={() => onSelect(article.id)}
    aria-current={isSelected ? 'true' : undefined}
    className={`w-full rounded-xl border p-3 text-left transition-colors ${
      isSelected
        ? 'border-amber-400/60 bg-amber-400/10'
        : 'border-slate-800/80 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/60'
    }`}
  >
    <div className="flex items-center justify-between gap-2">
      <CategoryBadge category={article.category} />
      <span className="inline-flex shrink-0 items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
        <Clock size={10} aria-hidden="true" />
        {estimateReadingMinutes(article)} min
      </span>
    </div>
    <h5 className={`mt-2 text-xs font-black leading-snug ${isSelected ? 'text-amber-200' : 'text-white'}`}>
      {article.title}
    </h5>
    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400">
      {article.subtitle}
    </p>
  </button>
);

const ArticleReader = ({ article }: { article: LibraryArticle }) => {
  const diagramItem = article.diagramId
    ? COACHING_LIBRARY_ITEMS.find(item => item.id === article.diagramId)
    : undefined;

  return (
    <article
      className="rounded-2xl border border-slate-800 bg-[#0f172a]/95 p-5 shadow-lg md:p-7"
      aria-labelledby={`library-article-${article.id}`}
    >
      <header className="border-b border-slate-800/70 pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={article.category} />
          {article.era && (
            <span className="rounded-md border border-slate-700/60 bg-slate-900/70 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
              {article.era}
            </span>
          )}
        </div>
        <h3 id={`library-article-${article.id}`} className="mt-3 font-display text-2xl font-black text-white">
          {article.title}
        </h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
          {article.subtitle}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {article.origin && <span>{article.origin}</span>}
          <span className="inline-flex items-center gap-1">
            <Clock size={11} aria-hidden="true" />
            {estimateReadingMinutes(article)} min read
          </span>
          <span>Updated {article.updatedOn}</span>
        </div>
      </header>

      <div className="mt-6 space-y-7">
        {article.sections.map(section => (
          <section key={section.heading}>
            <h4 className="font-display text-sm font-black uppercase tracking-wide text-amber-300">
              {section.heading}
            </h4>
            <div className="mt-2 space-y-3">
              {section.paragraphs.map(paragraph => (
                <p key={paragraph.slice(0, 48)} className="text-[13px] leading-7 text-slate-300">
                  {paragraph}
                </p>
              ))}
            </div>
            {section.bullets && (
              <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-amber-400">
                {section.bullets.map(bullet => (
                  <li key={bullet} className="text-[12px] leading-relaxed text-slate-300">
                    {bullet}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <h4 className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-300">
            <Lightbulb size={13} aria-hidden="true" />
            Key Ideas
          </h4>
          <ul className="mt-2 list-disc space-y-1.5 pl-4 marker:text-emerald-400">
            {article.keyIdeas.map(idea => (
              <li key={idea} className="text-[12px] leading-relaxed text-slate-300">
                {idea}
              </li>
            ))}
          </ul>
        </section>
        {article.trainingIdeas && article.trainingIdeas.length > 0 && (
          <section className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
            <h4 className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-sky-300">
              <ClipboardList size={13} aria-hidden="true" />
              On the Training Pitch
            </h4>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 marker:text-sky-400">
              {article.trainingIdeas.map(idea => (
                <li key={idea} className="text-[12px] leading-relaxed text-slate-300">
                  {idea}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {diagramItem && (
        <details className="mt-6 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
          <summary className="cursor-pointer text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-200">
            Shape diagram (optional reference)
          </summary>
          <div className="mt-3">
            <CoachingLibraryDiagram item={diagramItem} />
          </div>
        </details>
      )}

      {article.references && article.references.length > 0 && (
        <footer className="mt-6 border-t border-slate-800/70 pt-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Further Reading</h4>
          <ul className="mt-2 space-y-1">
            {article.references.map(reference => (
              <li key={reference.label} className="text-[11px] text-slate-400">
                {reference.url ? (
                  <a
                    href={reference.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 hover:underline"
                  >
                    {reference.label}
                    <ExternalLink size={10} aria-hidden="true" />
                  </a>
                ) : (
                  reference.label
                )}
              </li>
            ))}
          </ul>
        </footer>
      )}
    </article>
  );
};

export const CoachKnowledgeBase = () => {
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visibleArticles = useMemo(() => {
    const byCategory = activeFilter === 'all'
      ? ACTIVE_LIBRARY_ARTICLES
      : ACTIVE_LIBRARY_ARTICLES.filter(article => article.category === activeFilter);
    return searchLibraryArticles(byCategory, query);
  }, [activeFilter, query]);

  const selectedArticle = visibleArticles.find(article => article.id === selectedId)
    ?? visibleArticles[0]
    ?? null;

  return (
    <section id="coach-knowledgebase-panel" className="xl:col-span-12 relative z-10 space-y-5">
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a]/95 p-5 shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Coaching Library</p>
            <h3 className="font-display text-xl font-black text-white">A reading room for coaches</h3>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-400">
              Long-form notes on the philosophies, club identities, systems, principles, and coaching craft that
              shaped football. Open an article, read for a few minutes, take one idea to your next session.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <BookOpen size={15} className="text-amber-300" aria-hidden="true" />
            {ACTIVE_LIBRARY_ARTICLES.length} articles
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative lg:w-72">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <Input
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search coaches, systems, ideas..."
              aria-label="Search the coaching library"
              className="h-9 rounded-lg border-slate-800 bg-slate-950/60 pl-9 text-xs text-slate-200 placeholder:text-slate-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter library by category">
            {(['all', ...LIBRARY_CATEGORY_ORDER] as const).map(filter => {
              const isActive = activeFilter === filter;
              const label = filter === 'all' ? 'All' : LIBRARY_CATEGORY_LABELS[filter];
              return (
                <Button
                  key={filter}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveFilter(filter)}
                  aria-pressed={isActive}
                  title={filter === 'all' ? 'Show every article' : LIBRARY_CATEGORY_DESCRIPTIONS[filter]}
                  className={`h-8 rounded-lg px-3 text-[10px] font-black uppercase tracking-widest ${
                    isActive
                      ? 'border-amber-400 bg-amber-400 text-slate-950 hover:bg-amber-400 hover:text-slate-950'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[300px_1fr] lg:items-start">
        <nav
          aria-label="Coaching library articles"
          className="max-h-[30rem] space-y-2 overflow-y-auto rounded-2xl border border-slate-800 bg-[#0f172a]/80 p-3 lg:max-h-[64rem] lg:sticky lg:top-4"
        >
          <p className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
            {visibleArticles.length} {visibleArticles.length === 1 ? 'article' : 'articles'}
          </p>
          {visibleArticles.map(article => (
            <ArticleListItem
              key={article.id}
              article={article}
              isSelected={selectedArticle?.id === article.id}
              onSelect={setSelectedId}
            />
          ))}
          {visibleArticles.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-800 px-3 py-10 text-center">
              <BookOpen size={18} className="text-slate-500" aria-hidden="true" />
              <p className="text-xs font-medium text-slate-400">No articles match your search.</p>
              <p className="text-[10px] text-slate-500">Try a coach name, formation, or principle.</p>
            </div>
          )}
        </nav>

        {selectedArticle ? (
          <ArticleReader article={selectedArticle} />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-800 p-10 text-center text-xs text-slate-400">
            Select an article to start reading.
          </div>
        )}
      </div>
    </section>
  );
};
