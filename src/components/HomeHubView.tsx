import React, { lazy, Suspense } from 'react';
import type { AssessmentSession, Announcement, Game, Player, Standing, TeamInfo } from '../types';
import ViewLoadingFallback from './ViewLoadingFallback';

const DashboardView = lazy(() => import('./DashboardView'));
const ScheduleView = lazy(() => import('./ScheduleView'));

export type HomeTab = 'overview' | 'game_week';

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

const TabPill = (props: { label: string; isActive: boolean; onClick: () => void }) => {
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-label={`Open ${props.label}`}
      className={`rounded-xl border px-4 py-2 text-xs font-black transition-colors ${
        props.isActive
          ? 'border-indigo-200 bg-indigo-600 text-white'
          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
      }`}
    >
      {props.label}
    </button>
  );
};

export default function HomeHubView(props: HomeHubViewProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/70 rounded-2xl p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <TabPill label="Overview" isActive={props.activeTab === 'overview'} onClick={() => props.onTabChange('overview')} />
          <TabPill label="Game Week" isActive={props.activeTab === 'game_week'} onClick={() => props.onTabChange('game_week')} />
        </div>
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
