import React, { lazy, Suspense } from 'react';
import type { AssessmentSession, Announcement, Game, Player, Standing, TeamInfo } from '../types';
import ViewLoadingFallback from './ViewLoadingFallback';
import { SegmentedTabs } from './ui/segmented-tabs';

const DashboardView = lazy(() => import('./DashboardView'));
const ScheduleView = lazy(() => import('./ScheduleView'));

export type HomeTab = 'overview' | 'game_week';

const HOME_TAB_OPTIONS: Array<{ value: HomeTab; label: string }> = [
  { value: 'overview', label: 'Overview' },
  { value: 'game_week', label: 'Game Week' }
];

export type HubNavigateTarget =
  | { primary: 'home'; homeTab: HomeTab }
  | { primary: 'squad' }
  | { primary: 'tactics' }
  | { primary: 'development'; developmentTab: 'assessments' | 'training' | 'assessment_guide' }
  | { primary: 'league_updates'; leagueUpdatesTab: 'league' | 'updates' | 'bulletins' };

interface HomeHubViewProps {
  activeTab: HomeTab;
  onTabChange: (tab: HomeTab) => void;
  onNavigate: (target: HubNavigateTarget) => void;

  // Overview (Dashboard)
  teamInfo: TeamInfo;
  players: Player[];
  games: Game[];
  standings: Standing[];
  announcements: Announcement[];
  assessments: AssessmentSession[];
  onSelectPlayer: (player: Player) => void;
  onUpdateTeamInfo: (updated: TeamInfo) => void;

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
  return (
    <div className="space-y-6">
      <SegmentedTabs
        value={props.activeTab}
        options={HOME_TAB_OPTIONS}
        onValueChange={props.onTabChange}
        label="Home workspace sections"
      />

      <Suspense fallback={<ViewLoadingFallback label={props.activeTab === 'overview' ? 'overview' : 'game week'} />}>
        {props.activeTab === 'overview' ? (
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
        ) : (
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
