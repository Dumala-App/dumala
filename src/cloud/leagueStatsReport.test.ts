import { describe, expect, it } from 'vitest';
import { buildStatDatabase, type EventTeam, type FixtureStatEvent } from './league';
import { renderStatDatabaseReportHtml } from './leagueStatsReport';

const team = (id: string, name: string): EventTeam => ({
  id, event_id: 'e1', league_id: 'l', registration_id: null, name, seed: null, created_at: '', updated_at: ''
});
const stat = (teamId: string, player: string, type: FixtureStatEvent['stat_type']): FixtureStatEvent => ({
  id: `${teamId}-${player}-${type}`, fixture_id: 'fx1', event_id: 'e1', league_id: 'l',
  team_id: teamId, player_name: player, stat_type: type, minute: 42, note: null, created_at: '', updated_at: ''
});

describe('renderStatDatabaseReportHtml', () => {
  const db = buildStatDatabase(
    [stat('t1', 'Ramos', 'goal'), stat('t1', 'Ramos', 'goal'), stat('t2', 'Lim', 'yellow_card')],
    [team('t1', 'Bayside FC'), team('t2', 'North Stars')]
  );

  it('produces a self-contained HTML document with the scope, players, and totals', () => {
    const html = renderStatDatabaseReportHtml(db, {
      leagueName: 'Metro Youth League', scopeLabel: 'Season 2026', generatedAt: '2026-07-15T09:00:00.000Z'
    });
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('Metro Youth League');
    expect(html).toContain('Season 2026');
    expect(html).toContain('Ramos');
    expect(html).toContain('Bayside FC');
    // No external assets are referenced, so it prints offline.
    expect(html).not.toMatch(/https?:\/\//);
  });

  it('escapes HTML in names to avoid breaking the document', () => {
    const risky = buildStatDatabase([stat('t1', '<script>x</script>', 'goal')], [team('t1', 'A & B FC')]);
    const html = renderStatDatabaseReportHtml(risky, { leagueName: 'L', scopeLabel: 'All competitions', generatedAt: '2026-07-15T09:00:00.000Z' });
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('A &amp; B FC');
    expect(html).not.toContain('<script>x</script>');
  });

  it('renders an empty-state row when there are no records', () => {
    const html = renderStatDatabaseReportHtml(buildStatDatabase([], []), {
      leagueName: 'L', scopeLabel: 'All competitions', generatedAt: '2026-07-15T09:00:00.000Z'
    });
    expect(html).toContain('No statistics recorded for this scope yet.');
  });
});
