import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import WorkspaceIntegrityBanner from './WorkspaceIntegrityBanner';
import type { WorkspaceIntegrityReport } from '../integrity/workspaceIntegrity';

const report: WorkspaceIntegrityReport = {
  checkedAt: '2026-07-18T00:00:00.000Z',
  isHealthy: false,
  findings: [
    {
      code: 'player-appearances-mismatch',
      severity: 'error',
      section: 'players',
      message: 'Adrian Lim has 4 appearances, but completed match credits total 0.',
      relatedIds: ['p1']
    },
    {
      code: 'player-mvp-mismatch',
      severity: 'warning',
      section: 'players',
      message: 'Adrian Lim has 1 MVP awards, but completed matches credit 0.',
      relatedIds: ['p1']
    },
    {
      code: 'informational-note',
      severity: 'info',
      section: 'games',
      message: 'Informational only.',
      relatedIds: []
    }
  ]
};

const noop = vi.fn();

describe('WorkspaceIntegrityBanner', () => {
  it('renders a one-line summary with details collapsed by default', () => {
    const html = renderToStaticMarkup(
      <WorkspaceIntegrityBanner
        report={report}
        onDismiss={noop}
        onExportBackup={noop}
        onOpenSection={noop}
        onOpenFinding={noop}
        onRerun={noop}
      />
    );

    expect(html).toContain('Consistency check:');
    expect(html).toContain('1 error');
    expect(html).toContain('1 warning');
    expect(html).toContain('player totals');
    expect(html).toContain('Review');
    // Individual findings and secondary actions live behind the details toggle.
    expect(html).not.toContain('Adrian Lim has 4 appearances');
    expect(html).not.toContain('Export backup');
    expect(html).not.toContain('Rerun check');
  });

  it('renders nothing when every finding is informational', () => {
    const healthy: WorkspaceIntegrityReport = {
      checkedAt: report.checkedAt,
      isHealthy: true,
      findings: report.findings.filter(item => item.severity === 'info')
    };
    const html = renderToStaticMarkup(
      <WorkspaceIntegrityBanner
        report={healthy}
        onDismiss={noop}
        onExportBackup={noop}
        onOpenSection={noop}
        onOpenFinding={noop}
        onRerun={noop}
      />
    );
    expect(html).toBe('');
  });
});
