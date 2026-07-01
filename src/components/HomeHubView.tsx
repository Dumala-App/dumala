import React, { lazy, Suspense, type ReactNode } from 'react';
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
      <div className="grid gap-3 lg:grid-cols-[minmax(0,auto)_minmax(18rem,1fr)] lg:items-start">
        <SegmentedTabs
          value={props.activeTab}
          options={HOME_TAB_OPTIONS}
          onValueChange={props.onTabChange}
          label="Home workspace sections"
          className="rounded-2xl border border-cyan-300/10 bg-[#07111f]/88 p-2 text-slate-100 shadow-lg shadow-black/20 backdrop-blur-xl"
          listClassName="border-cyan-300/10 bg-[#0b1726]/72 text-slate-400 shadow-inner shadow-black/10"
          triggerClassName="text-slate-400 data-[state=active]:bg-orange-400 data-[state=active]:text-slate-950 data-[state=active]:shadow-sm data-[state=inactive]:hover:bg-orange-300/10 data-[state=inactive]:hover:text-orange-100"
        />
        {props.workspaceControls && (
          <div className="flex min-w-0 justify-stretch lg:justify-end">
            {props.workspaceControls}
          </div>
        )}
      </div>

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
