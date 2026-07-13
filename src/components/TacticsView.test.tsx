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
  it('opens directly into the searchable coaching knowledge library', () => {
    const html = renderToStaticMarkup(<CoachKnowledgeBase />);

    expect(html).toContain('Coaching Library');
    expect(html).toContain('Knowledge that earns its place on the pitch.');
    expect(html).toContain(`${ACTIVE_LIBRARY_ARTICLES.length} articles`);
    expect(html).toContain('Choose what you want to improve');
    expect(html).toContain('Search the coaching library');
    expect(html).toContain('All articles');
    expect(html).toContain('Unread');
    expect(html).toContain('Apply this idea');
    expect(html).toContain('What evidence did you see?');
    expect(html).toContain('Save review');
    expect(html).not.toContain('My development');
    expect(html).not.toContain('Learning plans &amp; goals');
    expect(html).not.toContain('Reflection journal');
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
