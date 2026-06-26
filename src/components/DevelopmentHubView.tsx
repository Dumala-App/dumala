import React, { lazy, Suspense, useEffect, useState } from 'react';
import type { AssessmentSession, Game, Player } from '../types';
import ViewLoadingFallback from './ViewLoadingFallback';

const AssessmentsView = lazy(() => import('./AssessmentsView'));
const AssessmentDrillGuideView = lazy(() => import('./AssessmentDrillGuideView'));
const TrainingView = lazy(() => import('./TrainingView'));

export type DevelopmentTab = 'assessments' | 'training' | 'assessment_guide';

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
  onUpdateAssessmentNotes: (sessionId: string, coachNotes: string) => void;
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
  const [visitedTabs, setVisitedTabs] = useState<Set<DevelopmentTab>>(() => new Set([props.activeTab]));
  const shouldRenderTab = (tab: DevelopmentTab) => props.activeTab === tab || visitedTabs.has(tab);

  useEffect(() => {
    setVisitedTabs((current) => {
      if (current.has(props.activeTab)) return current;
      const next = new Set(current);
      next.add(props.activeTab);
      return next;
    });
  }, [props.activeTab]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/70 rounded-2xl p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <TabPill label="Training" isActive={props.activeTab === 'training'} onClick={() => props.onTabChange('training')} />
          <TabPill label="Assessments" isActive={props.activeTab === 'assessments'} onClick={() => props.onTabChange('assessments')} />
          <TabPill label="Assessment Guide" isActive={props.activeTab === 'assessment_guide'} onClick={() => props.onTabChange('assessment_guide')} />
        </div>
      </div>

      <Suspense fallback={<ViewLoadingFallback label={props.activeTab} />}>
        {shouldRenderTab('assessment_guide') && (
          <section hidden={props.activeTab !== 'assessment_guide'} aria-hidden={props.activeTab !== 'assessment_guide'}>
            <AssessmentDrillGuideView />
          </section>
        )}

        {shouldRenderTab('assessments') && (
          <section hidden={props.activeTab !== 'assessments'} aria-hidden={props.activeTab !== 'assessments'}>
            <AssessmentsView
              players={props.players}
              assessments={props.assessments}
              preselectedPlayerId={props.preselectedAssessmentsPlayerId}
              onClearPreselectedPlayer={props.onClearPreselectedAssessmentsPlayerId}
              onAddAssessment={props.onAddAssessment}
              onDeleteAssessment={props.onDeleteAssessment}
              onUpdateAssessmentNotes={props.onUpdateAssessmentNotes}
            />
          </section>
        )}

        {shouldRenderTab('training') && (
          <section hidden={props.activeTab !== 'training'} aria-hidden={props.activeTab !== 'training'}>
            <TrainingView players={props.players} onUpdatePlayer={props.onUpdatePlayer} games={props.games} onUpdateGames={props.onUpdateGames} />
          </section>
        )}
      </Suspense>
    </div>
  );
}
