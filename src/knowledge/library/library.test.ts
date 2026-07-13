import { describe, expect, it } from 'vitest';
import {
  ACTIVE_LIBRARY_ARTICLES,
  LIBRARY_ARTICLES,
  LIBRARY_CATEGORY_LABELS,
  LIBRARY_CATEGORY_ORDER,
  estimateReadingMinutes,
  getArticleApplyActions,
  searchLibraryArticles
} from './index';
import { COACHING_LIBRARY_ITEMS } from '../coachingLibrary';

describe('coaching library knowledge data', () => {
  it('has unique article ids', () => {
    const ids = LIBRARY_ARTICLES.map(article => article.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses only registered categories', () => {
    for (const article of LIBRARY_ARTICLES) {
      expect(LIBRARY_CATEGORY_ORDER).toContain(article.category);
      expect(LIBRARY_CATEGORY_LABELS[article.category]).toBeTruthy();
    }
  });

  it('gives every active article substantial reading content', () => {
    for (const article of ACTIVE_LIBRARY_ARTICLES) {
      expect(article.title.length, article.id).toBeGreaterThan(3);
      expect(article.subtitle.length, article.id).toBeGreaterThan(20);
      expect(article.sections.length, article.id).toBeGreaterThanOrEqual(3);
      for (const section of article.sections) {
        expect(section.heading.length, `${article.id} section heading`).toBeGreaterThan(2);
        expect(section.paragraphs.length, `${article.id} / ${section.heading}`).toBeGreaterThanOrEqual(1);
        for (const paragraph of section.paragraphs) {
          expect(paragraph.length, `${article.id} / ${section.heading}`).toBeGreaterThan(80);
        }
      }
      expect(article.keyIdeas.length, article.id).toBeGreaterThanOrEqual(3);
      expect(article.tags.length, article.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('keeps every article readable in a few minutes, not seconds', () => {
    for (const article of ACTIVE_LIBRARY_ARTICLES) {
      expect(estimateReadingMinutes(article), article.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('gives every active article concrete apply-this-idea actions', () => {
    for (const article of ACTIVE_LIBRARY_ARTICLES) {
      const actions = getArticleApplyActions(article);
      expect(actions.length, article.id).toBeGreaterThanOrEqual(5);
      for (const action of actions) {
        expect(action.title.length, `${article.id} action title`).toBeGreaterThan(8);
        expect(action.detail.length, `${article.id} action detail`).toBeGreaterThan(40);
      }
      expect(actions.map(action => action.title)).toEqual(expect.arrayContaining([
        'Try this in your next session',
        'Add the recommended drill',
        'Use three coaching cues',
        'Watch for player behaviours',
        'Adapt this for your age group'
      ]));
    }
  });

  it('uses valid ISO dates for updatedOn', () => {
    for (const article of LIBRARY_ARTICLES) {
      expect(article.updatedOn, article.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(article.updatedOn)), article.id).toBe(false);
    }
  });

  it('points diagram references at existing legacy diagram items', () => {
    const diagramIds = new Set(COACHING_LIBRARY_ITEMS.map(item => item.id));
    for (const article of LIBRARY_ARTICLES) {
      if (article.diagramId) {
        expect(diagramIds.has(article.diagramId), `${article.id} -> ${article.diagramId}`).toBe(true);
      }
    }
  });

  it('only uses http(s) urls in references', () => {
    for (const article of LIBRARY_ARTICLES) {
      for (const reference of article.references ?? []) {
        if (reference.url) {
          expect(reference.url, `${article.id} / ${reference.label}`).toMatch(/^https:\/\//);
        }
      }
    }
  });

  it('supports search across titles, tags, and origins', () => {
    expect(searchLibraryArticles(ACTIVE_LIBRARY_ARTICLES, 'cruyff').length).toBeGreaterThan(0);
    expect(searchLibraryArticles(ACTIVE_LIBRARY_ARTICLES, '4-3-3').length).toBeGreaterThan(0);
    expect(searchLibraryArticles(ACTIVE_LIBRARY_ARTICLES, 'pressing').length).toBeGreaterThan(0);
    expect(searchLibraryArticles(ACTIVE_LIBRARY_ARTICLES, 'zzzz-no-match')).toHaveLength(0);
    expect(searchLibraryArticles(ACTIVE_LIBRARY_ARTICLES, '  ')).toHaveLength(ACTIVE_LIBRARY_ARTICLES.length);
  });
});
