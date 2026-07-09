import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TacticsView from './TacticsView';
import { CoachKnowledgeBase } from './CoachKnowledgeBase';
import { ACTIVE_LIBRARY_ARTICLES } from '../knowledge/library';
import type { Player, StaffMember } from '../types';

const createMemoryStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    }
  };
};

const testPlayers: Player[] = [
  {
    id: 'player-1',
    name: 'Maya Santos',
    number: 9,
    position: 'Forward',
    bio: '',
    photoUrl: '/placeholders/forward-placeholder.png',
    gamesPlayed: 3,
    points: 4,
    assists: 2,
    cleanSheetsOrRebounds: 0,
    minutesPlayed: 180,
    mvpAwards: 1,
    yellowCards: 0,
    redCards: 0,
    baseAttributes: {
      pace: 78,
      stamina: 72,
      agility: 80,
      strength: 62,
      firstTouch: 74,
      shortPassing: 70
    },
    positionAttributes: {
      Finishing: 82,
      'Long Shots': 76
    },
    registrationStatus: 'Active'
  }
];

const testStaff: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Coach Lina',
    role: 'Manager / Coach',
    bio: '',
    photoUrl: '/placeholders/staff-placeholder.png',
    status: 'Active'
  }
];

beforeEach(() => {
  vi.stubGlobal('window', {
    localStorage: createMemoryStorage(),
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Tactics knowledgebase', () => {
  it('renders the reading library with article list and reader', () => {
    const html = renderToStaticMarkup(<CoachKnowledgeBase />);

    expect(html).toContain('Coaching Library');
    expect(html).toContain('A reading room for coaches');
    expect(html).toContain(`${ACTIVE_LIBRARY_ARTICLES.length} articles`);

    // Category filters are present
    expect(html).toContain('Coaching Philosophies');
    expect(html).toContain('Club &amp; National Identities');
    expect(html).toContain('Formations &amp; Systems');
    expect(html).toContain('Game Principles');
    expect(html).toContain('Coaching Craft');

    // Every active article appears in the browse list
    for (const article of ACTIVE_LIBRARY_ARTICLES) {
      expect(html).toContain(article.title.replace(/&/g, '&amp;'));
    }

    // The default-selected article renders as long-form text
    const first = ACTIVE_LIBRARY_ARTICLES[0];
    expect(html).toContain(first.sections[0].heading);
    expect(html).toContain('Key Ideas');
    expect(html).toContain('min read');
    expect(html).toContain(`Updated ${first.updatedOn}`);
  });
});

describe('Tactics workspace', () => {
  it('renders the match layout and fullscreen board control', () => {
    const html = renderToStaticMarkup(
      <TacticsView
        players={testPlayers}
        staff={testStaff}
        teamCoach="Coach Lina"
        teamName="Dumala FC"
      />
    );

    expect(html).toContain('Tactics Workspace');
    expect(html).toContain('Match Layout');
    expect(html).toContain('Fullscreen');
    expect(html).toContain('Workspace Panels');
    expect(html).toContain('tactical-field-card');
  });
});
