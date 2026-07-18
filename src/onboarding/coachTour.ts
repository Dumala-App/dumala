// First-run coach tour: a short, skippable walkthrough of the main workspace
// areas shown once after onboarding. The seen flag is device-level (not part of
// workspace persistence) so switching or restoring workspaces never replays it.

export interface CoachTourStep {
  id: string;
  // DOM id of the element to spotlight. Steps whose target is missing (e.g. the
  // desktop nav on mobile) fall back to a centered card.
  targetId: string | null;
  title: string;
  body: string;
}

export const COACH_TOUR_STEPS: readonly CoachTourStep[] = [
  {
    id: 'welcome',
    targetId: null,
    title: 'Welcome to Dumala',
    body: 'Your team workspace is ready. Here is a quick tour of where everything lives — it takes under a minute, and you can skip it anytime.'
  },
  {
    id: 'home',
    targetId: 'nav-tab-btn-home',
    title: 'Home',
    body: 'Your matchday hub: the Overview dashboard, team bulletins, and Game Week — where you schedule fixtures and log results.'
  },
  {
    id: 'squad',
    targetId: 'nav-tab-btn-squad',
    title: 'Squad',
    body: 'Add and manage your players. Profiles, availability, and payments all live here — a roster of 8-12 players unlocks the rest of the app.'
  },
  {
    id: 'tactics',
    targetId: 'nav-tab-btn-tactics',
    title: 'Tactics',
    body: 'Pick a formation, drag players into your lineup on the board, and prepare opponent-specific game plans.'
  },
  {
    id: 'development',
    targetId: 'nav-tab-btn-development',
    title: 'Development',
    body: 'Run FPRDS player assessments, plan weekly training, and export printable development reports to share with players.'
  },
  {
    id: 'league_updates',
    targetId: 'nav-tab-btn-league_updates',
    title: 'League & Updates',
    body: 'Track your league standings and catch up on what is new in Dumala.'
  },
  {
    id: 'checklist',
    targetId: 'getting-started-strip',
    title: 'Your first-week checklist',
    body: 'Five quick setup steps live in this strip. It tracks your progress automatically and stays out of the way — expand it whenever you want your next step.'
  }
] as const;

const TOUR_SEEN_KEY = 'dumala_coach_tour_seen_v1';

interface TourStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const hasSeenCoachTour = (storage?: TourStorage): boolean => {
  try {
    const store = storage ?? window.localStorage;
    return store.getItem(TOUR_SEEN_KEY) !== null;
  } catch {
    // Storage unavailable (private mode, quota): treat as seen so the tour
    // never nags on every load.
    return true;
  }
};

export const markCoachTourSeen = (storage?: TourStorage): void => {
  try {
    const store = storage ?? window.localStorage;
    store.setItem(TOUR_SEEN_KEY, new Date().toISOString());
  } catch {
    // Best effort only.
  }
};
