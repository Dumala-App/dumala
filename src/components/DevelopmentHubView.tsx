import React, { lazy, Suspense } from 'react';
import type { AssessmentSession, Game, Player } from '../types';
import ViewLoadingFallback from './ViewLoadingFallback';

const AssessmentsView = lazy(() => import('./AssessmentsView'));
const TrainingView = lazy(() => import('./TrainingView'));

export type DevelopmentTab = 'assessments' | 'training';

interface DevelopmentHubViewProps {
  activeTab: DevelopmentTab;
  onTabChange: (tab: DevelopmentTab) => void;

  players: Player[];
  games: Game[];
  onUpdateGames: (games: Game[]) => void;
  onUpdatePlayer: (player: Player) => void;

  assessments: AssessmentSession[];
  preselectedAssessmentsPlayerId: string | null;
  onClearPreselectedAssessmentsPlayerId: () => void;
  onAddAssessment: (session: AssessmentSession) => void;
  onDeleteAssessment: (sessionId: string) => void;
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

export default function DevelopmentHubView(props: DevelopmentHubViewProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/70 rounded-2xl p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <TabPill label="Training" isActive={props.activeTab === 'training'} onClick={() => props.onTabChange('training')} />
          <TabPill label="Assessments" isActive={props.activeTab === 'assessments'} onClick={() => props.onTabChange('assessments')} />
        </div>
      </div>

      <Suspense fallback={<ViewLoadingFallback label={props.activeTab} />}>
        {props.activeTab === 'assessments' ? (
          <AssessmentsView
            players={props.players}
            assessments={props.assessments}
            preselectedPlayerId={props.preselectedAssessmentsPlayerId}
            onClearPreselectedPlayer={props.onClearPreselectedAssessmentsPlayerId}
            onAddAssessment={props.onAddAssessment}
            onDeleteAssessment={props.onDeleteAssessment}
            onUpdatePlayer={props.onUpdatePlayer}
          />
        ) : (
          <TrainingView players={props.players} onUpdatePlayer={props.onUpdatePlayer} games={props.games} onUpdateGames={props.onUpdateGames} />
        )}
      </Suspense>
    </div>
  );
}
