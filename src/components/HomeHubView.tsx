import React, { lazy, Suspense, type ReactNode } from 'react';
import type { AssessmentSession, Announcement, Game, Player, Standing, TeamInfo } from '../types';
import type { DayName } from '../training/synchronization';
import ViewLoadingFallback from './ViewLoadingFallback';
import { SegmentedTabs, type SegmentedTabOption } from './ui/segmented-tabs';

const DashboardView = lazy(() => import('./DashboardView'));
const AnnouncementsView = lazy(() => import('./AnnouncementsView'));
const ScheduleView = lazy(() => import('./ScheduleView'));

export type HomeTab = 'overview' | 'bulletins' | 'game_week';

const HOME_TAB_OPTIONS: Array<SegmentedTabOption<HomeTab>> = [
  { value: 'overview', label: 'Overview' },
  { value: 'bulletins', label: 'Bulletins' },
  { value: 'game_week', label: 'Game Week' }
];

export type HubNavigateTarget =
  | { primary: 'home'; homeTab: HomeTab }
  | { primary: 'squad' }
  | { primary: 'tactics' }
  | { primary: 'development'; developmentTab: 'assessments' | 'training' | 'assessment_guide'; trainingDay?: DayName }
  | { primary: 'league_updates'; leagueUpdatesTab: 'league' | 'updates' };

interface HomeHubViewProps {
  activeTab: HomeTab;
  onTabChange: (tab: HomeTab) => void;
  onNavigate: (target: HubNavigateTarget) => void;
  workspaceControls?: ReactNode;

  // Overview (Dashboard)
  teamInfo: TeamInfo;
  players: Player[];
  games: Game[];
  standings: Standing[];
  announcements: Announcement[];
  assessments: AssessmentSession[];
  onSelectPlayer: (player: Player) => void;
  onUpdateTeamInfo: (updated: TeamInfo) => void;
  onAddAnnouncement: (announcement: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;

  // Game Week (Schedule)
  onAddGame: (game: Game) => void;
  onRecordResult: (
    gameId: string,
    ourScore: number,
    opponentScore: number,
    mvpId: string,
    notes: string,
    scorersList: NonNullable<Game['scorers']>
  ) => void;
  onDeleteGame: (gameId: string) => void;
  teamName: string;
  highlightGameId?: string | null;
}

export default function HomeHubView(props: HomeHubViewProps) {
  const homeWorkspaceHeader = (
    <div className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-start">
      <SegmentedTabs
        value={props.activeTab}
        options={HOME_TAB_OPTIONS}
        onValueChange={props.onTabChange}
        label="Home workspace sections"
      />
      {props.workspaceControls && (
        <div className="flex w-full min-w-0 justify-stretch lg:w-auto lg:justify-end">
          {props.workspaceControls}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {homeWorkspaceHeader}

      <Suspense fallback={<ViewLoadingFallback label={props.activeTab === 'game_week' ? 'game week' : props.activeTab} />}>
        {props.activeTab === 'overview' && (
          <DashboardView
            teamInfo={props.teamInfo}
            players={props.players}
            games={props.games}
            standings={props.standings}
            announcements={props.announcements}
            assessments={props.assessments}
            onNavigate={props.onNavigate}
            onSelectPlayer={props.onSelectPlayer}
            onUpdateTeamInfo={props.onUpdateTeamInfo}
          />
        )}

        {props.activeTab === 'bulletins' && (
          <AnnouncementsView
            announcements={props.announcements}
            onAddAnnouncement={props.onAddAnnouncement}
            onDeleteAnnouncement={props.onDeleteAnnouncement}
          />
        )}

        {props.activeTab === 'game_week' && (
          <ScheduleView
            games={props.games}
            players={props.players}
            standings={props.standings}
            onAddGame={props.onAddGame}
            onRecordResult={props.onRecordResult}
            onDeleteGame={props.onDeleteGame}
            teamName={props.teamName}
            highlightGameId={props.highlightGameId}
          />
        )}
      </Suspense>
    </div>
  );
}
