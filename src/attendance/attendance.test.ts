import { describe, expect, it } from 'vitest';
import type { AttendanceSession, Game, Player } from '../types';
import {
  attendanceSessionTitle,
  createRosterEntries,
  cycleAttendanceStatus,
  findLinkableGames,
  reconcileEntriesWithRoster,
  setEntryStatus,
  sortSessionsByDateDesc,
  summarizePlayerAttendance,
  summarizeSessionEntries,
  summarizeTeamAttendance
} from './attendance';

const makePlayer = (id: string, name: string): Player => ({
  id,
  name,
  number: 10,
  position: 'Forward',
  bio: '',
  photoUrl: '',
  gamesPlayed: 0,
  points: 0,
  assists: 0,
  cleanSheetsOrRebounds: 0,
  minutesPlayed: 0,
  mvpAwards: 0,
  yellowCards: 0,
  redCards: 0,
  baseAttributes: { pace: 50, stamina: 50, agility: 50, strength: 50, firstTouch: 50, shortPassing: 50 },
  positionAttributes: {},
  registrationStatus: 'Active'
});

const players = [makePlayer('p1', 'Ana'), makePlayer('p2', 'Ben'), makePlayer('p3', 'Cara')];

const makeSession = (
  id: string,
  date: string,
  statuses: Record<string, AttendanceSession['entries'][number]['status']>,
  createdAt = `${date}T08:00:00.000Z`
): AttendanceSession => ({
  id,
  date,
  type: 'Training',
  entries: Object.entries(statuses).map(([playerId, status]) => ({
    playerId,
    playerNameSnapshot: players.find(player => player.id === playerId)?.name ?? playerId,
    status
  })),
  createdAt
});

describe('createRosterEntries', () => {
  it('marks every rostered player present by default (absence-first workflow)', () => {
    const entries = createRosterEntries(players);
    expect(entries).toHaveLength(3);
    expect(entries.every(entry => entry.status === 'present')).toBe(true);
    expect(entries[0]).toMatchObject({ playerId: 'p1', playerNameSnapshot: 'Ana' });
  });
});

describe('reconcileEntriesWithRoster', () => {
  it('reuses prior statuses, adds new players as present, and keeps departed players', () => {
    const existing = [
      { playerId: 'p1', playerNameSnapshot: 'Ana', status: 'absent' as const, note: 'sick' },
      { playerId: 'gone', playerNameSnapshot: 'Old Player', status: 'late' as const }
    ];
    const reconciled = reconcileEntriesWithRoster(players, existing);

    expect(reconciled.find(entry => entry.playerId === 'p1')).toMatchObject({ status: 'absent', note: 'sick' });
    expect(reconciled.find(entry => entry.playerId === 'p2')?.status).toBe('present');
    expect(reconciled.find(entry => entry.playerId === 'gone')).toMatchObject({ status: 'late', playerNameSnapshot: 'Old Player' });
  });

  it('refreshes the name snapshot for renamed players', () => {
    const existing = [{ playerId: 'p1', playerNameSnapshot: 'Old Name', status: 'present' as const }];
    const reconciled = reconcileEntriesWithRoster(players, existing);
    expect(reconciled.find(entry => entry.playerId === 'p1')?.playerNameSnapshot).toBe('Ana');
  });
});

describe('cycleAttendanceStatus', () => {
  it('cycles present → absent → late → excused → present', () => {
    expect(cycleAttendanceStatus('present')).toBe('absent');
    expect(cycleAttendanceStatus('absent')).toBe('late');
    expect(cycleAttendanceStatus('late')).toBe('excused');
    expect(cycleAttendanceStatus('excused')).toBe('present');
  });
});

describe('setEntryStatus', () => {
  it('updates only the targeted player without mutating the source list', () => {
    const entries = createRosterEntries(players);
    const next = setEntryStatus(entries, 'p2', 'absent');
    expect(next.find(entry => entry.playerId === 'p2')?.status).toBe('absent');
    expect(next.find(entry => entry.playerId === 'p1')?.status).toBe('present');
    expect(entries.find(entry => entry.playerId === 'p2')?.status).toBe('present');
  });
});

describe('summarizeSessionEntries', () => {
  it('counts each status', () => {
    const session = makeSession('s1', '2026-07-20', { p1: 'present', p2: 'absent', p3: 'late' });
    expect(summarizeSessionEntries(session.entries)).toEqual({ present: 1, absent: 1, late: 1, excused: 0 });
  });
});

describe('summarizePlayerAttendance', () => {
  const sessions = [
    makeSession('s1', '2026-07-01', { p1: 'present', p2: 'absent' }),
    makeSession('s2', '2026-07-08', { p1: 'late', p2: 'excused' }),
    makeSession('s3', '2026-07-15', { p1: 'present', p2: 'absent' })
  ];

  it('treats late arrivals as attended and excludes excused sessions from the rate', () => {
    const ana = summarizePlayerAttendance(sessions, players[0]);
    expect(ana.sessionsTracked).toBe(3);
    expect(ana.attendanceRate).toBe(100);

    const ben = summarizePlayerAttendance(sessions, players[1]);
    expect(ben.sessionsTracked).toBe(3);
    expect(ben.absent).toBe(2);
    expect(ben.excused).toBe(1);
    // 0 attended of 2 counted (excused session ignored).
    expect(ben.attendanceRate).toBe(0);
    expect(ben.lastAbsenceDate).toBe('2026-07-15');
  });

  it('returns a null rate for a player with no tracked sessions', () => {
    const cara = summarizePlayerAttendance(sessions, players[2]);
    expect(cara.sessionsTracked).toBe(0);
    expect(cara.attendanceRate).toBeNull();
    expect(cara.lastAbsenceDate).toBeNull();
  });
});

describe('summarizeTeamAttendance', () => {
  it('aggregates totals, current-month count, and perfect attendance', () => {
    const sessions = [
      makeSession('s1', '2026-06-30', { p1: 'present', p2: 'present' }),
      makeSession('s2', '2026-07-06', { p1: 'present', p2: 'absent' })
    ];
    const overview = summarizeTeamAttendance(sessions, players, '2026-07-20');
    expect(overview.totalSessions).toBe(2);
    expect(overview.sessionsThisMonth).toBe(1);
    // 3 attended of 4 counted entries.
    expect(overview.overallRate).toBe(75);
    expect(overview.perfectAttendanceCount).toBe(1);
  });

  it('returns null rate with no sessions', () => {
    const overview = summarizeTeamAttendance([], players, '2026-07-20');
    expect(overview.overallRate).toBeNull();
    expect(overview.perfectAttendanceCount).toBe(0);
  });
});

describe('sortSessionsByDateDesc', () => {
  it('orders by date, newest first, then by creation time', () => {
    const sessions = [
      makeSession('older', '2026-07-01', { p1: 'present' }),
      makeSession('newest', '2026-07-15', { p1: 'present' }),
      makeSession('same-day-late', '2026-07-01', { p1: 'present' }, '2026-07-01T18:00:00.000Z')
    ];
    expect(sortSessionsByDateDesc(sessions).map(session => session.id)).toEqual([
      'newest',
      'same-day-late',
      'older'
    ]);
  });
});

describe('game linking', () => {
  const games: Game[] = [
    {
      id: 'g1',
      opponent: 'River FC',
      date: '2026-07-20',
      time: '10:00',
      location: 'Main pitch',
      status: 'Upcoming',
      type: 'League'
    },
    {
      id: 'g2',
      opponent: 'Cancelled FC',
      date: '2026-07-20',
      time: '12:00',
      location: 'Main pitch',
      status: 'Cancelled',
      type: 'Friendly'
    },
    {
      id: 'g3',
      opponent: 'Other Day FC',
      date: '2026-07-21',
      time: '10:00',
      location: 'Main pitch',
      status: 'Upcoming',
      type: 'League'
    }
  ];

  it('finds only non-cancelled events on the chosen date', () => {
    expect(findLinkableGames(games, '2026-07-20').map(game => game.id)).toEqual(['g1']);
  });

  it('builds a session title from the linked game, custom title, or type', () => {
    const linked = { ...makeSession('s1', '2026-07-20', { p1: 'present' }), gameId: 'g1' };
    expect(attendanceSessionTitle(linked, games)).toBe('League vs River FC');

    const titled = { ...linked, title: 'Morning drills' };
    expect(attendanceSessionTitle(titled, games)).toBe('Morning drills');

    const plain = makeSession('s2', '2026-07-20', { p1: 'present' });
    expect(attendanceSessionTitle(plain, games)).toBe('Training session');
  });
});
