import { describe, expect, it } from 'vitest';
import type { Game } from '../types';
import { selectMatchDayPrepEvent, selectNextTrainingEvent } from './DashboardView';

const game = (overrides: Partial<Game>): Game => ({
  id: overrides.id ?? 'game-1',
  opponent: overrides.opponent ?? 'Test FC',
  date: overrides.date ?? '2026-07-02',
  time: overrides.time ?? '18:00',
  location: overrides.location ?? 'Main Ground',
  status: overrides.status ?? 'Upcoming',
  type: overrides.type ?? 'League',
  notes: overrides.notes
});

describe('selectMatchDayPrepEvent', () => {
  it('uses the next future calendar event by date and time', () => {
    const selected = selectMatchDayPrepEvent([
      game({ id: 'later', opponent: 'Later FC', date: '2026-07-03', time: '09:00' }),
      game({ id: 'past', opponent: 'Past FC', date: '2026-06-30', time: '20:00' }),
      game({ id: 'next', opponent: 'Next FC', date: '2026-07-02', time: '14:00' })
    ], new Date('2026-07-01T12:00:00'));

    expect(selected?.id).toBe('next');
  });

  it('ignores completed and cancelled calendar events', () => {
    const selected = selectMatchDayPrepEvent([
      game({ id: 'completed', status: 'Completed', date: '2026-07-02', time: '14:00' }),
      game({ id: 'cancelled', status: 'Cancelled', date: '2026-07-02', time: '15:00' }),
      game({ id: 'upcoming', status: 'Upcoming', type: 'League', date: '2026-07-02', time: '16:00' })
    ], new Date('2026-07-01T12:00:00'));

    expect(selected?.id).toBe('upcoming');
  });

  it('excludes Training and Meeting events — Match Prep is matches only', () => {
    const selected = selectMatchDayPrepEvent([
      game({ id: 'training', type: 'Training', date: '2026-07-02', time: '09:00' }),
      game({ id: 'meeting', type: 'Meeting', date: '2026-07-02', time: '10:00' }),
      game({ id: 'match', type: 'Friendly', date: '2026-07-03', time: '18:00' })
    ], new Date('2026-07-01T12:00:00'));

    expect(selected?.id).toBe('match');
  });

  it('returns undefined when only non-match events are upcoming', () => {
    const selected = selectMatchDayPrepEvent([
      game({ id: 'training', type: 'Training', date: '2026-07-02', time: '09:00' }),
      game({ id: 'meeting', type: 'Meeting', date: '2026-07-04', time: '10:00' })
    ], new Date('2026-07-01T12:00:00'));

    expect(selected).toBeUndefined();
  });

  it('keeps same-day upcoming events visible for match prep after kickoff time', () => {
    const selected = selectMatchDayPrepEvent([
      game({ id: 'today', opponent: 'Today FC', date: '2026-07-05', time: '08:00' }),
      game({ id: 'tomorrow', opponent: 'Tomorrow FC', date: '2026-07-06', time: '08:00' })
    ], new Date('2026-07-05T20:00:00'));

    expect(selected?.id).toBe('today');
  });
});

describe('selectNextTrainingEvent', () => {
  it('returns the next upcoming non-match event and ignores matches', () => {
    const selected = selectNextTrainingEvent([
      game({ id: 'match', type: 'League', date: '2026-07-02', time: '09:00' }),
      game({ id: 'training', type: 'Training', date: '2026-07-03', time: '17:00' }),
      game({ id: 'meeting', type: 'Meeting', date: '2026-07-04', time: '12:00' })
    ], new Date('2026-07-01T12:00:00'));

    expect(selected?.id).toBe('training');
  });

  it('picks a Meeting when it is the soonest non-match event', () => {
    const selected = selectNextTrainingEvent([
      game({ id: 'meeting', type: 'Meeting', date: '2026-07-02', time: '10:00' }),
      game({ id: 'training', type: 'Training', date: '2026-07-05', time: '17:00' })
    ], new Date('2026-07-01T12:00:00'));

    expect(selected?.id).toBe('meeting');
  });

  it('ignores completed and cancelled non-match events', () => {
    const selected = selectNextTrainingEvent([
      game({ id: 'done', type: 'Training', status: 'Completed', date: '2026-07-02', time: '09:00' }),
      game({ id: 'off', type: 'Training', status: 'Cancelled', date: '2026-07-03', time: '09:00' }),
      game({ id: 'next', type: 'Training', status: 'Upcoming', date: '2026-07-04', time: '09:00' })
    ], new Date('2026-07-01T12:00:00'));

    expect(selected?.id).toBe('next');
  });

  it('returns undefined when only matches are upcoming', () => {
    const selected = selectNextTrainingEvent([
      game({ id: 'match', type: 'Cup', date: '2026-07-02', time: '09:00' })
    ], new Date('2026-07-01T12:00:00'));

    expect(selected).toBeUndefined();
  });
});
