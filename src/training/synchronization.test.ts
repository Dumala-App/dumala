import { describe, expect, it } from 'vitest';
import type { Game } from '../types';
import {
  getWeekDaysMap,
  synchronizeTrainingCalendar,
  type DayName,
  type ScheduledDrill,
  type WeeklySchedule
} from './synchronization';

const emptySchedule = (): WeeklySchedule => ({
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: [],
  Sunday: []
});

const drill = (overrides: Partial<ScheduledDrill> = {}): ScheduledDrill => ({
  id: 'drill-1',
  drillId: 'passing',
  name: 'Passing Circuit',
  icon: 'P',
  fatigueIncrease: 4,
  ...overrides
});

const match: Game = {
  id: 'match-1',
  opponent: 'United FC',
  date: '2026-06-17',
  time: '18:00',
  location: 'Home',
  status: 'Upcoming',
  type: 'League'
};

const meeting: Game = {
  id: 'meeting-1',
  opponent: 'Video Review',
  date: '2026-06-18',
  time: '17:00',
  location: 'Clubhouse',
  status: 'Upcoming',
  type: 'Meeting'
};

const weekDaysMap = getWeekDaysMap(new Date(2026, 5, 17));

const sync = (games: Game[], schedule: WeeklySchedule) =>
  synchronizeTrainingCalendar({ games, weeklySchedule: schedule, weekDaysMap });

const withDrill = (day: DayName, scheduledDrill = drill()): WeeklySchedule => ({
  ...emptySchedule(),
  [day]: [scheduledDrill]
});

describe('training calendar synchronization', () => {
  it('creates linked training events without changing matches or meetings', () => {
    const result = sync([match, meeting], withDrill('Monday'));
    const training = result.games.find(game => game.type === 'Training');

    expect(result.changed).toBe(true);
    expect(training).toMatchObject({
      id: 'training_sync_2026-06-15',
      date: '2026-06-15',
      opponent: 'Training: Passing Circuit'
    });
    expect(result.games).toContain(match);
    expect(result.games).toContain(meeting);
  });

  it('updates only the linked training event when a drill changes', () => {
    const initial = sync([match, meeting], withDrill('Monday')).games;
    const edited = sync(initial, withDrill('Monday', drill({
      name: 'Finishing Circuit',
      fatigueIncrease: 7
    })));

    expect(edited.changed).toBe(true);
    expect(edited.games.find(game => game.type === 'Training')).toMatchObject({
      opponent: 'Training: Finishing Circuit',
      notes: expect.stringContaining('+7% intensity')
    });
    expect(edited.games).toContain(match);
    expect(edited.games).toContain(meeting);
  });

  it('moves a linked training event to the selected day', () => {
    const initial = sync([], withDrill('Monday')).games;
    const moved = sync(initial, withDrill('Thursday'));

    expect(moved.games.filter(game => game.type === 'Training')).toHaveLength(1);
    expect(moved.games.find(game => game.type === 'Training')).toMatchObject({
      id: 'training_sync_2026-06-18',
      date: '2026-06-18'
    });
  });

  it('deletes linked training events when the weekly schedule is cleared', () => {
    const initial = sync([match], withDrill('Monday')).games;
    const cleared = sync(initial, emptySchedule());

    expect(cleared.games).toEqual([match]);
  });

  it('restores the projected events from a historical schedule', () => {
    const historical = withDrill('Wednesday', drill({
      id: 'history-1',
      name: 'Recovery Session',
      fatigueIncrease: 2,
      playerName: 'Mika'
    }));
    const current = sync([], withDrill('Friday')).games;
    const restored = sync(current, historical);

    expect(restored.games).toHaveLength(1);
    expect(restored.games[0]).toMatchObject({
      date: '2026-06-17',
      opponent: 'Training: Recovery Session | Dev: Mika',
      notes: expect.stringContaining('Individual development for: Mika')
    });
  });

  it('is idempotent and preserves training events outside the active week', () => {
    const outsideWeek: Game = {
      ...match,
      id: 'old-training',
      date: '2026-06-08',
      type: 'Training',
      opponent: 'Previous training'
    };
    const first = sync([outsideWeek], withDrill('Monday'));
    const second = sync(first.games, withDrill('Monday'));

    expect(second.changed).toBe(false);
    expect(second.games).toBe(first.games);
    expect(second.games).toContain(outsideWeek);
  });
});
