import type {
  AttendanceEntry,
  AttendanceSession,
  AttendanceSessionType,
  AttendanceStatus,
  Game,
  Player
} from '../types';

export interface PlayerAttendanceSummary {
  playerId: string;
  playerName: string;
  sessionsTracked: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  /** Percent of counted sessions attended (present + late). Excused absences do not count against the player. */
  attendanceRate: number | null;
  lastAbsenceDate: string | null;
}

export interface TeamAttendanceOverview {
  totalSessions: number;
  sessionsThisMonth: number;
  /** Team-wide rate across every counted entry, or null before any session exists. */
  overallRate: number | null;
  perfectAttendanceCount: number;
}

export const ATTENDANCE_STATUS_ORDER: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  excused: 'Excused'
};

export const ATTENDANCE_SESSION_TYPES: AttendanceSessionType[] = ['Training', 'Match', 'Meeting', 'Other'];

export const createAttendanceSessionId = () =>
  `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * Absence-first default: every rostered player starts as present so the coach
 * only marks the players who missed.
 */
export const createRosterEntries = (players: Player[]): AttendanceEntry[] =>
  players.map(player => ({
    playerId: player.id,
    playerNameSnapshot: player.name,
    status: 'present'
  }));

/**
 * Builds the entry list for the take/edit form: every current player appears
 * (defaulting to present, or reusing a prior status when editing), and entries
 * for players who have since left the roster are preserved so history is intact.
 */
export const reconcileEntriesWithRoster = (
  players: Player[],
  existing: AttendanceEntry[] = []
): AttendanceEntry[] => {
  const priorById = new Map(existing.map(entry => [entry.playerId, entry]));
  const rosterEntries: AttendanceEntry[] = players.map(player => {
    const prior = priorById.get(player.id);
    return prior
      ? { ...prior, playerNameSnapshot: player.name }
      : { playerId: player.id, playerNameSnapshot: player.name, status: 'present' };
  });
  const rosterIds = new Set(players.map(player => player.id));
  const orphaned = existing.filter(entry => !rosterIds.has(entry.playerId));
  return [...rosterEntries, ...orphaned];
};

export const cycleAttendanceStatus = (status: AttendanceStatus): AttendanceStatus => {
  const index = ATTENDANCE_STATUS_ORDER.indexOf(status);
  return ATTENDANCE_STATUS_ORDER[(index + 1) % ATTENDANCE_STATUS_ORDER.length];
};

export const setEntryStatus = (
  entries: AttendanceEntry[],
  playerId: string,
  status: AttendanceStatus
): AttendanceEntry[] =>
  entries.map(entry => entry.playerId === playerId ? { ...entry, status } : entry);

export const summarizeSessionEntries = (entries: AttendanceEntry[]) =>
  entries.reduce(
    (counts, entry) => {
      counts[entry.status] += 1;
      return counts;
    },
    { present: 0, absent: 0, late: 0, excused: 0 } as Record<AttendanceStatus, number>
  );

const rateFromCounts = (counts: Record<AttendanceStatus, number>): number | null => {
  const counted = counts.present + counts.late + counts.absent;
  if (counted === 0) return null;
  return Math.round(((counts.present + counts.late) / counted) * 100);
};

export const sortSessionsByDateDesc = (sessions: AttendanceSession[]): AttendanceSession[] =>
  [...sessions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

export const summarizePlayerAttendance = (
  sessions: AttendanceSession[],
  player: Pick<Player, 'id' | 'name'>
): PlayerAttendanceSummary => {
  const counts: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, excused: 0 };
  let sessionsTracked = 0;
  let lastAbsenceDate: string | null = null;

  for (const session of sessions) {
    const entry = session.entries.find(item => item.playerId === player.id);
    if (!entry) continue;
    sessionsTracked += 1;
    counts[entry.status] += 1;
    if (entry.status === 'absent' && (!lastAbsenceDate || session.date > lastAbsenceDate)) {
      lastAbsenceDate = session.date;
    }
  }

  return {
    playerId: player.id,
    playerName: player.name,
    sessionsTracked,
    present: counts.present,
    absent: counts.absent,
    late: counts.late,
    excused: counts.excused,
    attendanceRate: rateFromCounts(counts),
    lastAbsenceDate
  };
};

export const summarizeTeamAttendance = (
  sessions: AttendanceSession[],
  players: Player[],
  today = new Date().toISOString().slice(0, 10)
): TeamAttendanceOverview => {
  const monthKey = today.slice(0, 7);
  const totals: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, excused: 0 };

  for (const session of sessions) {
    for (const entry of session.entries) {
      totals[entry.status] += 1;
    }
  }

  const perfectAttendanceCount = players.filter(player => {
    const summary = summarizePlayerAttendance(sessions, player);
    return summary.sessionsTracked > 0 && summary.absent === 0 && summary.attendanceRate === 100;
  }).length;

  return {
    totalSessions: sessions.length,
    sessionsThisMonth: sessions.filter(session => session.date.startsWith(monthKey)).length,
    overallRate: rateFromCounts(totals),
    perfectAttendanceCount
  };
};

/** Events on the chosen date that a session can be linked to from the Schedule. */
export const findLinkableGames = (games: Game[], date: string): Game[] =>
  games.filter(game => game.date === date && game.status !== 'Cancelled');

export const attendanceSessionTitle = (session: AttendanceSession, games: Game[]): string => {
  if (session.title?.trim()) return session.title.trim();
  if (session.gameId) {
    const game = games.find(item => item.id === session.gameId);
    if (game) return game.opponent.trim() ? `${game.type} vs ${game.opponent}` : `${game.type} session`;
  }
  return `${session.type} session`;
};
