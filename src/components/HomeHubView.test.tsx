import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
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

const renderHome = () => renderToStaticMarkup(
  <HomeHubView
    activeTab="overview"
    onTabChange={vi.fn()}
    onNavigate={vi.fn()}
    onOpenTrainingSession={vi.fn()}
    teamInfo={teamInfo}
    players={[]}
    games={[]}
    standings={[]}
    announcements={[]}
    assessments={[]}
    onSelectPlayer={vi.fn()}
    onUpdateTeamInfo={vi.fn()}
    onAddAnnouncement={vi.fn()}
    onDeleteAnnouncement={vi.fn()}
    onAddGame={vi.fn()}
    onRecordResult={vi.fn()}
    onDeleteGame={vi.fn()}
    teamName={teamInfo.name}
  />
);

describe('HomeHubView', () => {
  it('keeps the local Home workspace focused while lazy loading', () => {
    const html = renderHome();

    expect(html).toContain('role="tab"');
    expect(html).toContain('Bulletins');
    expect(html).toContain('Game Week');
    expect(html).toContain('Loading overview');
    expect(html).not.toContain('Use your Dumala cloud account');
  });
});
