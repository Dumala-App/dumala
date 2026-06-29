import React, { lazy, Suspense } from 'react';
import { Cloud } from 'lucide-react';
import type { CloudRuntime } from '../cloud/runtime';
import type { CloudAuthController } from '../hooks/useCloudAuth';
import type { AssessmentSession, Announcement, Game, Player, Standing, TeamInfo } from '../types';
import CloudAccountGate from './CloudAccountGate';
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
  cloudRuntime: CloudRuntime;
  cloudAuthController?: CloudAuthController;

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

export function HomeCloudAccountEntry({
  runtime,
  teamName,
  authController
}: {
  runtime: CloudRuntime;
  teamName: string;
  authController?: CloudAuthController;
}) {
  if (!runtime.enabled) return null;

  return (
    <section aria-labelledby="home-cloud-account-title" className="border-b border-border pb-5">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,34rem)] lg:items-center">
        <div className="flex items-start gap-3">
          <Cloud size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 id="home-cloud-account-title" className="text-sm font-bold text-foreground">
              Use your Dumala cloud account
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Sign in to connect this browser. Your current workspace stays saved locally unless you explicitly migrate it.
            </p>
          </div>
        </div>
        <CloudAccountGate
          clubName={teamName}
          appVersion="0.0.0"
          runtime={runtime}
          authController={authController}
        />
      </div>
    </section>
  );
}

export default function HomeHubView(props: HomeHubViewProps) {
  return (
    <div className="space-y-6">
      <HomeCloudAccountEntry
        runtime={props.cloudRuntime}
        teamName={props.teamInfo.name}
        authController={props.cloudAuthController}
      />

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
