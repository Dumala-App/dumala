import React, { useMemo, useState } from 'react';
import { BookOpen, Clock, ExternalLink, Lightbulb, ClipboardList, Search, Bookmark, CheckCircle2, ArrowRight, Sparkles, X, Target, Eye, Users, Save, RotateCcw } from 'lucide-react';
import {
  ACTIVE_LIBRARY_ARTICLES,
  LIBRARY_CATEGORY_DESCRIPTIONS,
  LIBRARY_CATEGORY_LABELS,
  LIBRARY_CATEGORY_ORDER,
  estimateReadingMinutes,
  getArticleApplyActions,
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
type ReadingFilter = 'all' | 'saved' | 'unread';

const readStoredArticleIds = (key: string): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? '[]') as unknown;
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

const CategoryBadge = ({ category }: { category: LibraryCategory }) => (
  <span className={`rounded-md border px-2 py-1 text-[9px] font-black uppercase tracking-widest ${CATEGORY_ACCENTS[category]}`}>
    {LIBRARY_CATEGORY_LABELS[category]}
  </span>
);

type SessionReviewDraft = {
  actionTitle: string;
  evidence: string;
  playerResponse: string;
  nextTry: string;
  savedAt?: string;
};

const emptyReview = (actionTitle: string): SessionReviewDraft => ({
  actionTitle,
  evidence: '',
  playerResponse: '',
  nextTry: ''
});

const readStoredReview = (articleId: string, actionTitle: string): SessionReviewDraft => {
  if (typeof window === 'undefined') return emptyReview(actionTitle);
  try {
    const value = JSON.parse(window.localStorage.getItem(`dumala:coach-library:session-review:${articleId}:v1`) ?? 'null') as Partial<SessionReviewDraft> | null;
    if (!value) return emptyReview(actionTitle);
    return {
      actionTitle: typeof value.actionTitle === 'string' ? value.actionTitle : actionTitle,
      evidence: typeof value.evidence === 'string' ? value.evidence : '',
      playerResponse: typeof value.playerResponse === 'string' ? value.playerResponse : '',
      nextTry: typeof value.nextTry === 'string' ? value.nextTry : '',
      savedAt: typeof value.savedAt === 'string' ? value.savedAt : undefined
    };
  } catch {
    return emptyReview(actionTitle);
  }
};

const applyActionIcons = [Target, ClipboardList, Lightbulb, Eye, Users] as const;

const ArticleApplicationPanel = ({ article }: { article: LibraryArticle }) => {
  const applyActions = getArticleApplyActions(article);
  const [selectedAction, setSelectedAction] = useState(applyActions[0]?.title ?? '');
  const [review, setReview] = useState<SessionReviewDraft>(() => readStoredReview(article.id, applyActions[0]?.title ?? ''));
  const selectedActionDetail = applyActions.find(action => action.title === selectedAction)?.detail ?? applyActions[0]?.detail ?? '';
  const hasReviewNotes = Boolean(review.evidence.trim() || review.playerResponse.trim() || review.nextTry.trim());

  const updateReview = (field: keyof Pick<SessionReviewDraft, 'evidence' | 'playerResponse' | 'nextTry'>, value: string) => {
    setReview(current => ({ ...current, [field]: value }));
  };

  const handleSelectAction = (actionTitle: string) => {
    setSelectedAction(actionTitle);
    setReview(current => ({ ...current, actionTitle }));
  };

  const handleSaveReview = () => {
    if (typeof window === 'undefined') return;
    const next = { ...review, actionTitle: selectedAction, savedAt: new Date().toISOString() };
    setReview(next);
    window.localStorage.setItem(`dumala:coach-library:session-review:${article.id}:v1`, JSON.stringify(next));
  };

  const handleClearReview = () => {
    const next = emptyReview(selectedAction);
    setReview(next);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(`dumala:coach-library:session-review:${article.id}:v1`);
    }
  };

  return (
    <section className="mt-8 overflow-hidden rounded-xl border border-amber-400/25 bg-amber-400/[0.06]">
      <div className="border-b border-amber-400/15 p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h4 className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-300">
              <Target size={14} aria-hidden="true" />
              Apply this idea
            </h4>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Pick one action for the next session, then capture what actually happened. The goal is evidence, not paperwork.
            </p>
          </div>
          {review.savedAt && (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-200">
              <CheckCircle2 size={11} aria-hidden="true" />
              Review saved
            </span>
          )}
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-5">
          {applyActions.map((action, index) => {
            const Icon = applyActionIcons[index] ?? Target;
            const isActive = selectedAction === action.title;
            return (
              <button
                key={action.title}
                type="button"
                onClick={() => handleSelectAction(action.title)}
                aria-pressed={isActive}
                className={`rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 ${
                  isActive
                    ? 'border-amber-300/70 bg-amber-300/15 text-amber-100'
                    : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900/70'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-amber-200' : 'text-slate-500'} aria-hidden="true" />
                <span className="mt-2 block text-[10px] font-black uppercase leading-4 tracking-widest">
                  {action.title}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/45 p-3 text-xs leading-5 text-slate-300">
          {selectedActionDetail}
        </p>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-3 md:p-5">
        {[
          ['evidence', 'What evidence did you see?', 'Example: players scanned before receiving, pressed together, or solved the overload without a reminder.'],
          ['playerResponse', 'How did players respond?', 'Note confidence, confusion, tempo, communication, and whether the idea survived pressure.'],
          ['nextTry', 'What will you try next?', 'Decide the next cue, constraint, drill tweak, or match-day reminder.']
        ].map(([field, label, placeholder]) => (
          <label key={field} className="block">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
            <textarea
              value={review[field as keyof Pick<SessionReviewDraft, 'evidence' | 'playerResponse' | 'nextTry'>]}
              onChange={event => updateReview(field as keyof Pick<SessionReviewDraft, 'evidence' | 'playerResponse' | 'nextTry'>, event.target.value)}
              placeholder={placeholder}
              className="mt-2 min-h-28 w-full resize-y rounded-lg border border-slate-800 bg-slate-950/55 p-3 text-xs leading-5 text-slate-200 outline-none placeholder:text-slate-600 focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/15"
            />
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-amber-400/15 px-4 py-3 md:px-5">
        <p className="text-[11px] leading-5 text-slate-500">
          Saved locally on this device until session planning is connected to the library.
        </p>
        <div className="flex flex-wrap gap-2">
          {hasReviewNotes && (
            <button type="button" onClick={handleClearReview} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-800 hover:text-white">
              <RotateCcw size={12} aria-hidden="true" />
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveReview}
            disabled={!hasReviewNotes}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-300/60 bg-amber-300 px-3 text-[10px] font-black uppercase tracking-widest text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
          >
            <Save size={12} aria-hidden="true" />
            Save review
          </button>
        </div>
      </div>
    </section>
  );
};

const ArticleListItem = ({
  article,
  isSelected,
  isBookmarked,
  isCompleted,
  onSelect
}: {
  article: LibraryArticle;
  isSelected: boolean;
  isBookmarked: boolean;
  isCompleted: boolean;
  onSelect: (id: string) => void;
}) => (
  <button
    type="button"
    onClick={() => onSelect(article.id)}
    aria-current={isSelected ? 'true' : undefined}
    className={`w-full rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
      isSelected
        ? 'border-amber-400/60 bg-amber-400/10 shadow-[inset_3px_0_0_#fbbf24]'
        : 'border-slate-800/80 bg-slate-950/35 hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900/70'
    }`}
  >
    <div className="flex items-center justify-between gap-2">
      <CategoryBadge category={article.category} />
      <span className="flex items-center gap-1.5">
        {isBookmarked && <Bookmark size={11} className="fill-amber-300 text-amber-300" aria-label="Bookmarked" />}
        {isCompleted && <CheckCircle2 size={12} className="text-emerald-300" aria-label="Completed" />}
        <span className="inline-flex shrink-0 items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-slate-500"><Clock size={10} aria-hidden="true" />{estimateReadingMinutes(article)} min</span>
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

const ArticleReader = ({ article, isBookmarked, isCompleted, onBookmark, onComplete }: { article: LibraryArticle; isBookmarked: boolean; isCompleted: boolean; onBookmark: () => void; onComplete: () => void }) => {
  const diagramItem = article.diagramId
    ? COACHING_LIBRARY_ITEMS.find(item => item.id === article.diagramId)
    : undefined;

  return (
    <article
      className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0f172a]/95 p-5 shadow-xl shadow-slate-950/20 md:p-8"
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
        <h3 id={`library-article-${article.id}`} className="mt-4 max-w-3xl font-display text-2xl font-black leading-tight text-white md:text-3xl">
          {article.title}
        </h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:text-base md:leading-7">
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
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={onBookmark} aria-pressed={isBookmarked} className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-[10px] font-black uppercase tracking-widest transition ${isBookmarked ? 'border-amber-400/40 bg-amber-400/10 text-amber-200' : 'border-slate-700 bg-slate-950/50 text-slate-300 hover:border-amber-400/50 hover:text-amber-200'}`}><Bookmark size={13} className={isBookmarked ? 'fill-current' : ''} />{isBookmarked ? 'Saved' : 'Save article'}</button>
          <button type="button" onClick={onComplete} aria-pressed={isCompleted} className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-[10px] font-black uppercase tracking-widest transition ${isCompleted ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200' : 'border-slate-700 bg-slate-950/50 text-slate-300 hover:border-emerald-400/50 hover:text-emerald-200'}`}><CheckCircle2 size={13} />{isCompleted ? 'Completed' : 'Mark as read'}</button>
        </div>
      </header>

      <div className="mt-7 max-w-4xl space-y-8">
        {article.sections.map(section => (
          <section key={section.heading}>
            <h4 className="font-display text-sm font-black uppercase tracking-wide text-amber-300">
              {section.heading}
            </h4>
            <div className="mt-2 space-y-3">
              {section.paragraphs.map(paragraph => (
                <p key={paragraph.slice(0, 48)} className="text-sm leading-7 text-slate-300 md:text-[15px] md:leading-8">
                  {paragraph}
                </p>
              ))}
            </div>
            {section.bullets && (
              <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-amber-400">
                {section.bullets.map(bullet => (
                  <li key={bullet} className="text-sm leading-6 text-slate-300">
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

      <ArticleApplicationPanel key={article.id} article={article} />

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
  const [readingFilter, setReadingFilter] = useState<ReadingFilter>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>(() => readStoredArticleIds('dumala:coach-library:saved:v1'));
  const [completedArticleIds, setCompletedArticleIds] = useState<string[]>(() => readStoredArticleIds('dumala:coach-library:completed:v1'));

  const visibleArticles = useMemo(() => {
    const byCategory = activeFilter === 'all'
      ? ACTIVE_LIBRARY_ARTICLES
      : ACTIVE_LIBRARY_ARTICLES.filter(article => article.category === activeFilter);
    const byReadingState = readingFilter === 'saved'
      ? byCategory.filter(article => savedArticleIds.includes(article.id))
      : readingFilter === 'unread'
        ? byCategory.filter(article => !completedArticleIds.includes(article.id))
        : byCategory;
    return searchLibraryArticles(byReadingState, query);
  }, [activeFilter, completedArticleIds, query, readingFilter, savedArticleIds]);

  const selectedArticle = visibleArticles.find(article => article.id === selectedId)
    ?? visibleArticles[0]
    ?? null;

  const toggleStoredArticle = (key: string, id: string, values: string[], setValues: React.Dispatch<React.SetStateAction<string[]>>) => {
    const next = values.includes(id) ? values.filter(value => value !== id) : [...values, id];
    setValues(next);
    window.localStorage.setItem(key, JSON.stringify(next));
  };

  const resetFilters = () => {
    setActiveFilter('all');
    setReadingFilter('all');
    setQuery('');
  };

  return (
    <section id="coach-knowledgebase-panel" className="xl:col-span-12 relative z-10 space-y-5">
      <header className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0f172a]/95 shadow-xl shadow-slate-950/20">
        <div className="relative bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_38%)] p-5 md:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 grid size-11 place-items-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-300"><BookOpen size={22} aria-hidden="true" /></div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-400">Coaching Library</p>
              <h3 className="mt-1 font-display text-2xl font-black leading-tight text-white md:text-3xl">Knowledge that earns its place on the pitch.</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Explore proven systems, coaching principles, team identities, and session-ready ideas. Find a topic, save the useful parts, and bring one clear action to training.</p>
            </div>
            <dl className="grid grid-cols-3 gap-2 text-center" aria-label={`${ACTIVE_LIBRARY_ARTICLES.length} articles, ${savedArticleIds.length} saved, ${completedArticleIds.length} read`}>
              {[['Articles', ACTIVE_LIBRARY_ARTICLES.length], ['Saved', savedArticleIds.length], ['Read', completedArticleIds.length]].map(([label, value]) => <div key={label} className="min-w-20 rounded-xl border border-slate-800 bg-slate-950/55 px-3 py-3"><dt className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</dt><dd className="mt-0.5 font-display text-xl font-black text-white">{value}</dd></div>)}
            </dl>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-[#0f172a]/95 p-4 md:p-5" aria-labelledby="library-browse-heading">
        <div className="flex items-start gap-3">
          <Sparkles size={18} className="mt-0.5 shrink-0 text-sky-300" aria-hidden="true" />
          <div><h4 id="library-browse-heading" className="font-display text-lg font-black text-white">Choose what you want to improve</h4><p className="mt-1 text-xs leading-5 text-slate-400">Start with a coaching question, or browse a focused part of the game.</p></div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {LIBRARY_CATEGORY_ORDER.map(category => {
            const count = ACTIVE_LIBRARY_ARTICLES.filter(article => article.category === category).length;
            return <button key={category} type="button" onClick={() => setActiveFilter(current => current === category ? 'all' : category)} aria-pressed={activeFilter === category} className={`group rounded-xl border p-3.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${activeFilter === category ? 'border-amber-400/55 bg-amber-400/10' : 'border-slate-800 bg-slate-950/40 hover:-translate-y-0.5 hover:border-slate-700'}`}><CategoryBadge category={category} /><p className="mt-2 line-clamp-2 text-[11px] leading-4 text-slate-400">{LIBRARY_CATEGORY_DESCRIPTIONS[category]}</p><span className={`mt-3 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${activeFilter === category ? 'text-amber-300' : 'text-slate-500 group-hover:text-amber-300'}`}>{count} articles <ArrowRight size={10} /></span></button>;
          })}
        </div>
      </section>
      <div className="sticky top-2 z-20 rounded-2xl border border-slate-800 bg-[#0f172a]/95 p-3 shadow-lg shadow-slate-950/20 backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 lg:w-96">
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
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter articles by reading status">
            {(['all', 'saved', 'unread'] as const).map(filter => {
              const isActive = readingFilter === filter;
              const label = filter === 'all' ? 'All articles' : filter === 'saved' ? 'Saved' : 'Unread';
              return (
                <Button
                  key={filter}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReadingFilter(filter)}
                  aria-pressed={isActive}
                  title={`Show ${label.toLowerCase()}`}
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
            {(activeFilter !== 'all' || readingFilter !== 'all' || query) && <button type="button" onClick={resetFilters} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-800 hover:text-white"><X size={12} /> Clear</button>}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[300px_1fr] lg:items-start">
        <nav
          aria-label="Coaching library articles"
          className="max-h-[34rem] space-y-2 overflow-y-auto rounded-2xl border border-slate-800 bg-[#0f172a]/80 p-3 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)]"
        >
          <p className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
            {visibleArticles.length} {visibleArticles.length === 1 ? 'article' : 'articles'}
          </p>
          {visibleArticles.map(article => (
            <ArticleListItem
              key={article.id}
              article={article}
              isSelected={selectedArticle?.id === article.id}
              isBookmarked={savedArticleIds.includes(article.id)}
              isCompleted={completedArticleIds.includes(article.id)}
              onSelect={setSelectedId}
            />
          ))}
          {visibleArticles.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-800 px-3 py-10 text-center">
              <BookOpen size={18} className="text-slate-500" aria-hidden="true" />
              <p className="text-xs font-medium text-slate-300">No articles match these filters.</p>
              <p className="text-[10px] leading-4 text-slate-500">Try a coach name, formation, or principle—or clear the current filters.</p>
              <button type="button" onClick={resetFilters} className="mt-2 rounded-lg bg-slate-800 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white hover:bg-slate-700">Clear filters</button>
            </div>
          )}
        </nav>

        {selectedArticle ? (
          <ArticleReader article={selectedArticle} isBookmarked={savedArticleIds.includes(selectedArticle.id)} isCompleted={completedArticleIds.includes(selectedArticle.id)} onBookmark={() => toggleStoredArticle('dumala:coach-library:saved:v1', selectedArticle.id, savedArticleIds, setSavedArticleIds)} onComplete={() => toggleStoredArticle('dumala:coach-library:completed:v1', selectedArticle.id, completedArticleIds, setCompletedArticleIds)} />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-800 p-10 text-center text-xs text-slate-400">
            Select an article to start reading.
          </div>
        )}
      </div>
    </section>
  );
};
