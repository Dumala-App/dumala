import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import StartupRecoveryScreen from './StartupRecoveryScreen';

describe('StartupRecoveryScreen', () => {
  it('offers preservation and recovery actions without rendering saved record contents', () => {
    const html = renderToStaticMarkup(
      <StartupRecoveryScreen
        issues={[
          { key: 'stack_team_players', section: 'Roster', reason: 'malformed-json' },
          { key: 'stack_team_games', section: 'Schedule', reason: 'invalid-data' }
        ]}
        onExport={vi.fn()}
        onRetry={vi.fn()}
        onReset={vi.fn()}
      />
    );

    expect(html).toContain('Dumala paused before loading saved data');
    expect(html).toContain('Export recovery copy');
    expect(html).toContain('Retry validation');
    expect(html).toContain('Reset browser workspace');
    expect(html).toContain('stack_team_players: malformed-json');
    expect(html).not.toContain('player contents');
  });
});
