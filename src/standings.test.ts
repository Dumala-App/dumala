import { describe, expect, it } from 'vitest';
import type { Standing } from './types';
import { findUserStanding, sortStandings } from './standings';

const standing = (teamName: string, points: number, goalsFor: number, goalsAgainst: number): Standing => ({
  rank: 0,
  teamName,
  played: 1,
  won: 0,
  drawn: 0,
  lost: 0,
  goalsFor,
  goalsAgainst,
  points
});

describe('standings helpers', () => {
  it('sorts by points, goal difference, then goals scored and assigns ranks', () => {
    const sorted = sortStandings([
      standing('Third', 3, 2, 1),
      standing('First', 4, 1, 0),
      standing('Second', 3, 3, 2),
      standing('Fourth', 3, 1, 0)
    ]);

    expect(sorted.map(team => [team.rank, team.teamName])).toEqual([
      [1, 'First'],
      [2, 'Second'],
      [3, 'Third'],
      [4, 'Fourth']
    ]);
  });

  it('finds the explicit user team before matching a team name', () => {
    const teams = [
      standing('Dumala FC', 3, 1, 0),
      { ...standing('Renamed Club', 1, 1, 1), isUserTeam: true }
    ];

    expect(findUserStanding(teams, 'Dumala FC')?.teamName).toBe('Renamed Club');
  });
});
