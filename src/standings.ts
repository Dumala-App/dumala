import {Standing} from './types';

export const sortStandings = (standings: Standing[]): Standing[] => {
  return [...standings]
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;

      const goalDifferenceA = a.goalsFor - a.goalsAgainst;
      const goalDifferenceB = b.goalsFor - b.goalsAgainst;
      if (goalDifferenceB !== goalDifferenceA) return goalDifferenceB - goalDifferenceA;

      return b.goalsFor - a.goalsFor;
    })
    .map((team, index) => ({...team, rank: index + 1}));
};

export const findUserStanding = (standings: Standing[], teamName: string): Standing | undefined => {
  const normalizedTeamName = teamName.trim().toLowerCase();
  return standings.find(team => team.isUserTeam)
    || standings.find(team => team.teamName.trim().toLowerCase() === normalizedTeamName);
};
