import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CloudRuntime } from '../cloud/runtime';
import TeamPublicPagePanel from './TeamPublicPagePanel';
import { getSquadSectionOptions } from './RosterView';

let mockRuntime: CloudRuntime;

vi.mock('../hooks/useCloudRuntime', () => ({
  useCloudRuntime: () => mockRuntime
}));

const phase6 = {
  playerAppEnabled: false,
  leagueAppEnabled: false,
  leagueRequestEnabled: false,
  playerPreviewEnabled: false,
  leaguePreviewEnabled: false,
  chatEnabled: false,
  teamPageEnabled: true
};

describe('TeamPublicPagePanel', () => {
  beforeEach(() => {
    mockRuntime = {
      enabled: true,
      phase6,
      dataAccess: {
        teamPage: {
          getSettings: vi.fn().mockResolvedValue(null),
          saveSettings: vi.fn(),
          getPublicTeam: vi.fn()
        }
      }
    } as unknown as CloudRuntime;
  });

  it('stays hidden while the feature flag is off', () => {
    mockRuntime = { ...mockRuntime, phase6: { ...phase6, teamPageEnabled: false } } as CloudRuntime;
    expect(renderToStaticMarkup(<TeamPublicPagePanel clubId="club-1" teamName="Blue Eagles FC" />)).toBe('');
  });

  it('asks for a cloud workspace when the club is local-only', () => {
    const html = renderToStaticMarkup(<TeamPublicPagePanel clubId={null} teamName="Blue Eagles FC" />);
    expect(html).toContain('Public team page');
    expect(html).toContain('Dumala Cloud');
  });

  it('loads the saved settings for a cloud-backed club', () => {
    const html = renderToStaticMarkup(<TeamPublicPagePanel clubId="club-1" teamName="Blue Eagles FC" />);
    expect(html).toContain('Loading public page settings');
  });
});

describe('squad section tabs', () => {
  it('adds the Public Page tab between Staff and Payments when the flag is on', () => {
    expect(getSquadSectionOptions(true).map(option => option.label)).toEqual(['Players', 'Staff', 'Public Page', 'Payments']);
  });

  it('keeps the original tabs when the flag is off', () => {
    expect(getSquadSectionOptions(false).map(option => option.label)).toEqual(['Players', 'Staff', 'Payments']);
  });
});
