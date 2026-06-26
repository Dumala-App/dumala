import React, { lazy, Suspense } from 'react';
import type { Announcement, Player, Standing, TeamInfo } from '../types';
import ViewLoadingFallback from './ViewLoadingFallback';
import { SegmentedTabs } from './ui/segmented-tabs';

const AnnouncementsView = lazy(() => import('./AnnouncementsView'));
const StandingsView = lazy(() => import('./StandingsView'));
const UpdatesView = lazy(() => import('./UpdatesView'));

export type LeagueUpdatesTab = 'league' | 'updates' | 'bulletins';

const LEAGUE_UPDATES_TAB_OPTIONS: Array<{ value: LeagueUpdatesTab; label: string }> = [
  { value: 'league', label: 'League' },
  { value: 'bulletins', label: 'Bulletins' },
  { value: 'updates', label: 'Updates' }
];

interface LeagueUpdatesHubViewProps {
  activeTab: LeagueUpdatesTab;
  onTabChange: (tab: LeagueUpdatesTab) => void;

  // League
  standings: Standing[];
  onUpdateStanding: (standing: Standing) => void;
  onResetStandings: () => void;
  teamName: string;
  teamInfo: TeamInfo;
  onUpdateTeamInfo: (updated: TeamInfo) => void;
  onUpdateAllStandings: (standings: Standing[]) => void;
  players: Player[];
  onUpdatePlayer: (player: Player) => void;
  highlightStandingTeamName?: string | null;

  // Updates
  announcements: Announcement[];
  onAddAnnouncement: (announcement: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
}

export default function LeagueUpdatesHubView(props: LeagueUpdatesHubViewProps) {
  return (
    <div className="space-y-6">
      <SegmentedTabs
        value={props.activeTab}
        options={LEAGUE_UPDATES_TAB_OPTIONS}
        onValueChange={props.onTabChange}
        label="League and updates workspace sections"
      />

      <Suspense fallback={<ViewLoadingFallback label={props.activeTab} />}>
        {props.activeTab === 'league' && (
          <StandingsView
            standings={props.standings}
            onUpdateStanding={props.onUpdateStanding}
            onResetStandings={props.onResetStandings}
            teamName={props.teamName}
            teamInfo={props.teamInfo}
            onUpdateTeamInfo={props.onUpdateTeamInfo}
            onUpdateAllStandings={props.onUpdateAllStandings}
            players={props.players}
            onUpdatePlayer={props.onUpdatePlayer}
            highlightStandingTeamName={props.highlightStandingTeamName}
          />
        )}

        {props.activeTab === 'updates' && (
          <UpdatesView />
        )}

        {props.activeTab === 'bulletins' && (
          <AnnouncementsView announcements={props.announcements} onAddAnnouncement={props.onAddAnnouncement} onDeleteAnnouncement={props.onDeleteAnnouncement} />
        )}
      </Suspense>
    </div>
  );
}
