import type { LibraryApplyAction, LibraryArticle, LibraryCategory } from './types';
import { PHILOSOPHY_ARTICLES } from './philosophies';
import { CLUB_DNA_ARTICLES } from './clubDna';
import { FORMATION_ARTICLES } from './formations';
import { PRINCIPLE_ARTICLES } from './principles';
import { COACHING_CRAFT_ARTICLES } from './coachingCraft';
import { FAMOUS_EFFECTIVE_EXPANSION_ARTICLES } from './famousEffectiveExpansion';

export type { LibraryApplyAction, LibraryArticle, LibraryCategory, LibrarySection, LibraryReference } from './types';

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
    + (article.trainingIdeas ?? []).reduce((sum, idea) => sum + countWords(idea), 0)
    + (article.applyActions ?? []).reduce((sum, action) => (
      sum + countWords(action.title) + countWords(action.detail)
    ), 0);

  return Math.max(1, Math.ceil(words / 200));
};

const CATEGORY_BEHAVIOUR_PROMPTS: Record<LibraryCategory, string> = {
  philosophy: 'Watch whether the players solve the same problem with fewer coach interventions.',
  'club-dna': 'Watch whether the group repeats the identity habit when the session becomes messy.',
  formations: 'Watch whether the distances between units help players find the next pass or pressure.',
  principles: 'Watch whether the principle appears naturally in a live game-speed moment.',
  'coaching-craft': 'Watch whether your intervention improves player attention, confidence, or decision quality.'
};

const CATEGORY_ADAPTATION_PROMPTS: Record<LibraryCategory, string> = {
  philosophy: 'Scale the idea down to one constraint, one cue, and one success picture for your age group.',
  'club-dna': 'Translate the identity into one repeatable team habit your players can recognize.',
  formations: 'Reduce the system to one relationship between two or three nearby players.',
  principles: 'Start with a small-sided version before asking for it across the full team.',
  'coaching-craft': 'Change the language, space, or pressure level until the players can act on it.'
};

export const getArticleApplyActions = (article: LibraryArticle): readonly LibraryApplyAction[] => {
  if (article.applyActions && article.applyActions.length > 0) return article.applyActions;

  const firstTrainingIdea = article.trainingIdeas?.[0];
  const firstKeyIdea = article.keyIdeas[0];

  return [
    {
      title: 'Try this in your next session',
      detail: firstKeyIdea
        ? `Choose one moment from training where this idea can be tested: ${firstKeyIdea}`
        : 'Choose one moment from training where this idea can be tested under realistic pressure.'
    },
    {
      title: 'Add the recommended drill',
      detail: firstTrainingIdea
        ? firstTrainingIdea
        : 'Use a small-sided practice with a clear scoring condition so players must repeat the target behaviour.'
    },
    {
      title: 'Use three coaching cues',
      detail: 'Prepare three short cues before the session: one for the action, one for the timing, and one for the next decision.'
    },
    {
      title: 'Watch for player behaviours',
      detail: CATEGORY_BEHAVIOUR_PROMPTS[article.category]
    },
    {
      title: 'Adapt this for your age group',
      detail: CATEGORY_ADAPTATION_PROMPTS[article.category]
    }
  ];
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
