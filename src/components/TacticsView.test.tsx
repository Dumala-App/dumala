import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TacticsView from './TacticsView';
import { CoachKnowledgeBase } from './CoachKnowledgeBase';
import { COACHING_LIBRARY_ITEMS } from '../knowledge/coachingLibrary';
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
  it('renders coaching reference content from structured library data', () => {
    const html = renderToStaticMarkup(<CoachKnowledgeBase />);

    expect(html).toContain('Coach Reference Library');
    expect(html).toContain('Formations, game phases, and tactical models');
    expect(html).toContain(`${COACHING_LIBRARY_ITEMS.length} topics`);
    expect(html).toContain('4-3-3');
    expect(html).toContain('3-4-3');
    expect(html).toContain('4-1-4-1');
    expect(html).toContain('5-3-2');
    expect(html).toContain('4-3-1-2');
    expect(html).toContain('4-4-1-1');
    expect(html).toContain('Attack Types');
    expect(html).toContain('Defense Types');
    expect(html).toContain('Tactical Models');
    expect(html).not.toContain('Illustration brief');
    expect(html).not.toContain('Photo/diagram brief');
    expect(html).toContain('<svg');
    expect(html).toContain('4-3-3 with wide forwards and fullback overlaps');
    expect(html).toContain('Key Learning');
    expect(html).toContain('Coach Notes');
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
