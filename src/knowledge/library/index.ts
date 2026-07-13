import type { LibraryArticle, LibraryCategory } from './types';
import { PHILOSOPHY_ARTICLES } from './philosophies';
import { CLUB_DNA_ARTICLES } from './clubDna';
import { FORMATION_ARTICLES } from './formations';
import { PRINCIPLE_ARTICLES } from './principles';
import { COACHING_CRAFT_ARTICLES } from './coachingCraft';
import { FAMOUS_EFFECTIVE_EXPANSION_ARTICLES } from './famousEffectiveExpansion';

export type { LibraryArticle, LibraryCategory, LibrarySection, LibraryReference } from './types';

export const LIBRARY_CATEGORY_ORDER: readonly LibraryCategory[] = [
  'philosophy',
  'club-dna',
  'formations',
  'principles',
  'coaching-craft'
];

export const LIBRARY_CATEGORY_LABELS: Record<LibraryCategory, string> = {
  philosophy: 'Coaching Philosophies',
  'club-dna': 'Club & National Identities',
  formations: 'Formations & Systems',
  principles: 'Game Principles',
  'coaching-craft': 'Coaching Craft'
};

export const LIBRARY_CATEGORY_DESCRIPTIONS: Record<LibraryCategory, string> = {
  philosophy: 'The ideas of the coaches who shaped the modern game — and what each one offers your team.',
  'club-dna': 'How clubs and nations built lasting identities, academies, and playing traditions.',
  formations: 'Deep guides to the major systems: history, mechanics, strengths, and when to use each.',
  principles: 'The universal concepts — pressing, build-up, transitions, blocks, chance creation.',
  'coaching-craft': 'The coaching profession itself: sessions, communication, development, and match day.'
};

export const LIBRARY_ARTICLES: readonly LibraryArticle[] = [
  ...PHILOSOPHY_ARTICLES,
  ...CLUB_DNA_ARTICLES,
  ...FORMATION_ARTICLES,
  ...PRINCIPLE_ARTICLES,
  ...COACHING_CRAFT_ARTICLES,
  ...FAMOUS_EFFECTIVE_EXPANSION_ARTICLES
];

export const ACTIVE_LIBRARY_ARTICLES: readonly LibraryArticle[] = LIBRARY_ARTICLES
  .filter(article => article.status === 'active');

const countWords = (text: string): number => text.split(/\s+/).filter(Boolean).length;

export const estimateReadingMinutes = (article: LibraryArticle): number => {
  const words = article.sections.reduce((sum, section) => (
    sum
    + countWords(section.heading)
    + section.paragraphs.reduce((inner, paragraph) => inner + countWords(paragraph), 0)
    + (section.bullets ?? []).reduce((inner, bullet) => inner + countWords(bullet), 0)
  ), 0)
    + article.keyIdeas.reduce((sum, idea) => sum + countWords(idea), 0)
    + (article.trainingIdeas ?? []).reduce((sum, idea) => sum + countWords(idea), 0);

  return Math.max(1, Math.ceil(words / 200));
};

export const searchLibraryArticles = (
  articles: readonly LibraryArticle[],
  query: string
): readonly LibraryArticle[] => {
  const needle = query.trim().toLowerCase();
  if (!needle) return articles;

  return articles.filter(article => {
    const haystack = [
      article.title,
      article.subtitle,
      article.origin ?? '',
      article.era ?? '',
      ...article.tags,
      ...article.sections.map(section => section.heading)
    ].join(' ').toLowerCase();
    return haystack.includes(needle);
  });
};
