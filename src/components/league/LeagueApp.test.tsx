import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { GroupKnockoutPanel } from './LeagueApp';
import type { EventFixture, EventTeam } from '../../cloud/league';

const team = (id: string, name: string): EventTeam => ({
  id,
  event_id: 'event-1',
  league_id: 'league-1',
  registration_id: null,
  name,
  seed: null,
  created_at: '',
  updated_at: ''
});

const groupFixture = (group: string, home: string, away: string, homeScore: number, awayScore: number): EventFixture => ({
  id: `${group}-${home}-${away}`,
  event_id: 'event-1',
  league_id: 'league-1',
  round: 1,
  sequence: 1,
  home_team_id: home,
  away_team_id: away,
  status: 'completed',
  home_score: homeScore,
  away_score: awayScore,
  kickoff_at: null,
  venue_id: null,
  home_checked_in: false,
  away_checked_in: false,
  official_name: null,
  stage: 'group',
  group_label: group,
  created_at: '',
  updated_at: ''
});

describe('GroupKnockoutPanel', () => {
  it('shows tied qualification places and keeps knockout generation disabled', () => {
    const teams = [
      team('a', 'Alpha'),
      team('b', 'Bravo'),
      team('c', 'Charlie'),
      team('d', 'Delta')
    ];
    const html = renderToStaticMarkup(
      <GroupKnockoutPanel
        fixtures={[
          groupFixture('A', 'a', 'b', 1, 1),
          groupFixture('B', 'c', 'd', 2, 0)
        ]}
        teams={teams}
        teamCount={teams.length}
        teamName={id => teams.find(t => t.id === id)?.name ?? 'TBD'}
        onDrawGroups={vi.fn()}
        onGenerateKnockout={vi.fn()}
        onClear={vi.fn()}
        onRecord={vi.fn()}
      />
    );

    expect(html).toContain('Qualification tie needs a decision');
    expect(html).toContain('Group A, place 1: Alpha / Bravo');
    expect(html).toContain('Resolve the qualification tie to unlock the knockout draw.');
    expect(html).toContain('disabled=""');
  });
});
