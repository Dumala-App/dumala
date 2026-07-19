import type { Game } from '../types';
import { toDateKey } from '../training/synchronization';
import type { StrategyTeamCondition } from './strategyContext';

export type TeamConditionSuggestion = {
  value: StrategyTeamCondition;
  reason: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const LOAD_WINDOW_DAYS = 3;
const TIRED_SESSION_COUNT = 3;

/**
 * Suggest a team condition from recent calendar load (matches and training in
 * the last few days). The suggestion is advisory: the coach applies it
 * explicitly, it never overwrites the stored strategy context on its own.
 */
export const suggestTeamCondition = (
  games: readonly Game[],
  today: Date = new Date()
): TeamConditionSuggestion => {
  const todayKey = toDateKey(today);
  const windowStartKey = toDateKey(new Date(today.getTime() - LOAD_WINDOW_DAYS * DAY_MS));
  const recentSessions = games.filter(game => (
    game.status !== 'Cancelled'
    && game.type !== 'Meeting'
    && game.date >= windowStartKey
    && game.date <= todayKey
  ));

  if (recentSessions.length >= TIRED_SESSION_COUNT) {
    return {
      value: 'tired',
      reason: `${recentSessions.length} matches or training sessions in the last ${LOAD_WINDOW_DAYS + 1} days.`
    };
  }
  if (recentSessions.length === 0) {
    return {
      value: 'fresh',
      reason: `No matches or training in the last ${LOAD_WINDOW_DAYS + 1} days.`
    };
  }
  return {
    value: 'normal',
    reason: `${recentSessions.length} session${recentSessions.length === 1 ? '' : 's'} in the last ${LOAD_WINDOW_DAYS + 1} days.`
  };
};
