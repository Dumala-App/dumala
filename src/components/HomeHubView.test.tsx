import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { CloudRuntime } from '../cloud/runtime';
import type { CloudAuthController } from '../hooks/useCloudAuth';
import type { TeamInfo } from '../types';
import HomeHubView from './HomeHubView';

const teamInfo: TeamInfo = {
  name: 'Dumala Coaches FC',
  founded: '2026',
  stadium: 'Home Ground',
  coach: 'Coach Rivera',
  league: 'Community League',
  logoColor: 'from-blue-600 to-indigo-800'
};

const signedOutAuth: CloudAuthController = {
  state: { status: 'signedOut' },
  requestOtp: vi.fn(),
  signOut: vi.fn()
};

const renderHome = (cloudRuntime: CloudRuntime) => renderToStaticMarkup(
  <HomeHubView
    activeTab="overview"
    onTabChange={vi.fn()}
    onNavigate={vi.fn()}
    cloudRuntime={cloudRuntime}
    cloudAuthController={signedOutAuth}
    teamInfo={teamInfo}
    players={[]}
    games={[]}
    standings={[]}
    announcements={[]}
    assessments={[]}
    onSelectPlayer={vi.fn()}
    onUpdateTeamInfo={vi.fn()}
    onAddGame={vi.fn()}
    onRecordResult={vi.fn()}
    onDeleteGame={vi.fn()}
    teamName={teamInfo.name}
  />
);

describe('HomeHubView cloud account entry', () => {
  it('offers coach sign-in from the normal Home surface without replacing the local workspace', () => {
    const runtime = {
      enabled: true,
      dataAccess: {
        auth: {},
        account: {}
      }
    } as CloudRuntime;

    const html = renderHome(runtime);

    expect(html).toContain('Use your Dumala cloud account');
    expect(html).toContain('coach@example.com');
    expect(html).toContain('Send link');
    expect(html).toContain('stays saved locally unless you explicitly migrate it');
    expect(html).toContain('Home workspace sections');
  });

  it('keeps the local Home workflow unchanged when cloud accounts are disabled', () => {
    const html = renderHome({ enabled: false, dataAccess: null });

    expect(html).not.toContain('Use your Dumala cloud account');
    expect(html).not.toContain('coach@example.com');
    expect(html).toContain('Home workspace sections');
  });
});
