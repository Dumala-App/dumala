import { describe, expect, it } from 'vitest';
import { COACH_TOUR_STEPS, hasSeenCoachTour, markCoachTourSeen } from './coachTour';

const createMemoryStorage = () => {
  const entries = new Map<string, string>();
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(key, value);
    }
  };
};

describe('coach tour steps', () => {
  it('opens with a centered welcome step before any spotlight', () => {
    expect(COACH_TOUR_STEPS[0].targetId).toBeNull();
  });

  it('uses unique step ids', () => {
    const ids = COACH_TOUR_STEPS.map(step => step.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('spotlights every primary navigation tab', () => {
    const targets = COACH_TOUR_STEPS.map(step => step.targetId);
    for (const tab of ['home', 'squad', 'tactics', 'development', 'league_updates']) {
      expect(targets).toContain(`nav-tab-btn-${tab}`);
    }
    expect(targets).toContain('getting-started-strip');
  });
});

describe('coach tour seen flag', () => {
  it('is unseen on a fresh device and seen after marking', () => {
    const storage = createMemoryStorage();
    expect(hasSeenCoachTour(storage)).toBe(false);
    markCoachTourSeen(storage);
    expect(hasSeenCoachTour(storage)).toBe(true);
  });

  it('treats an unavailable storage as seen so the tour never nags', () => {
    const broken = {
      getItem: () => {
        throw new Error('storage unavailable');
      },
      setItem: () => {
        throw new Error('storage unavailable');
      }
    };
    expect(hasSeenCoachTour(broken)).toBe(true);
    expect(() => markCoachTourSeen(broken)).not.toThrow();
  });
});
