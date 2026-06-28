import React, { lazy, Suspense, useEffect, useState } from 'react';
import type { AssessmentSession, Game, Player } from '../types';
import ViewLoadingFallback from './ViewLoadingFallback';
import { SegmentedTabs } from './ui/segmented-tabs';

const AssessmentsView = lazy(() => import('./AssessmentsView'));
const AssessmentDrillGuideView = lazy(() => import('./AssessmentDrillGuideView'));
const TrainingView = lazy(() => import('./TrainingView'));

export type DevelopmentTab = 'assessments' | 'training' | 'assessment_guide';

const DEVELOPMENT_TAB_OPTIONS: Array<{ value: DevelopmentTab; label: string }> = [
  { value: 'training', label: 'Training' },
  { value: 'assessments', label: 'Assessments' },
  { value: 'assessment_guide', label: 'Assessment Guide' }
];

interface DevelopmentHubViewProps {
  activeTab: DevelopmentTab;
  onTabChange: (tab: DevelopmentTab) => void;

  players: Player[];
  games: Game[];
  onUpdateGames: (games: Game[]) => void;

  assessments: AssessmentSession[];
  preselectedAssessmentsPlayerId: string | null;
  onClearPreselectedAssessmentsPlayerId: () => void;
  onAddAssessment: (session: AssessmentSession) => void;
  onDeleteAssessment: (sessionId: string) => void;
  onUpdateAssessmentNotes: (sessionId: string, coachNotes: string) => void;
}

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
      <SegmentedTabs
        value={props.activeTab}
        options={DEVELOPMENT_TAB_OPTIONS}
        onValueChange={props.onTabChange}
        label="Development workspace sections"
      />

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
            <TrainingView
              players={props.players}
              assessments={props.assessments}
              games={props.games}
              onUpdateGames={props.onUpdateGames}
            />
          </section>
        )}
      </Suspense>
    </div>
  );
}
