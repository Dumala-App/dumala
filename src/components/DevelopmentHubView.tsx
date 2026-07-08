import React, { lazy, Suspense, useEffect, useState } from 'react';
import type { AssessmentSession, Game, Player } from '../types';
import type { DayName } from '../training/synchronization';
import {
  DARK_GLASS_CLASSES,
  DARK_GLASS_DASHBOARD_SURFACE_STYLE,
  DARK_GLASS_THEME_STYLE
} from '../theme/darkGlassTheme';
import ViewLoadingFallback from './ViewLoadingFallback';
import { SegmentedTabs, type SegmentedTabOption } from './ui/segmented-tabs';

const AssessmentsView = lazy(() => import('./AssessmentsView'));
const AssessmentDrillGuideView = lazy(() => import('./AssessmentDrillGuideView'));
const TrainingView = lazy(() => import('./TrainingView'));

export type DevelopmentTab = 'assessments' | 'training' | 'assessment_guide';

const DEVELOPMENT_TAB_OPTIONS: Array<SegmentedTabOption<DevelopmentTab>> = [
  { value: 'training', label: 'Training' },
  { value: 'assessments', label: 'Assessments' },
  { value: 'assessment_guide', label: 'Assessments Guide' }
];

const DEVELOPMENT_GLASS_CLASS = [
  'development-glass-theme',
  DARK_GLASS_CLASSES.dashboardShell,
  '[&_.bg-white]:!bg-[#07111f]/88',
  '[&_.bg-slate-50]:!bg-[#0b1726]/72',
  '[&_.bg-slate-100]:!bg-white/[0.08]',
  '[&_.bg-indigo-50]:!bg-orange-300/10',
  '[&_.bg-indigo-600]:!bg-orange-400',
  '[&_.bg-blue-50]:!bg-cyan-300/10',
  '[&_.bg-blue-100]:!bg-cyan-300/10',
  '[&_.bg-amber-50]:!bg-amber-300/10',
  '[&_.border-white]:!border-cyan-300/10',
  '[&_.border-slate-100]:!border-cyan-300/10',
  '[&_.border-slate-200]:!border-cyan-300/10',
  '[&_.border-indigo-100]:!border-orange-300/15',
  '[&_.border-indigo-200]:!border-orange-300/20',
  '[&_.border-indigo-300]:!border-orange-300/35',
  '[&_.shadow-sm]:!shadow-black/10',
  '[&_.text-slate-950]:!text-slate-50',
  '[&_.text-slate-900]:!text-slate-100',
  '[&_.text-slate-800]:!text-slate-100',
  '[&_.text-slate-700]:!text-slate-200',
  '[&_.text-slate-600]:!text-slate-300',
  '[&_.text-slate-500]:!text-slate-400',
  '[&_.text-indigo-700]:!text-orange-200',
  '[&_.text-indigo-800]:!text-orange-100',
  '[&_.text-indigo-600]:!text-orange-300',
  '[&_.text-blue-900]:!text-cyan-100',
  '[&_.text-blue-800]:!text-cyan-100',
  '[&_.text-blue-700]:!text-cyan-200',
  '[&_.text-amber-900]:!text-amber-100',
  '[&_.text-amber-800]:!text-amber-200',
  '[&_input]:!border-cyan-300/10',
  '[&_input]:!bg-[#0b1726]/85',
  '[&_input]:!text-slate-100',
  '[&_input::placeholder]:!text-slate-500',
  '[&_textarea]:!border-cyan-300/10',
  '[&_textarea]:!bg-[#0b1726]/85',
  '[&_textarea]:!text-slate-100',
  '[&_textarea::placeholder]:!text-slate-500',
  '[&_thead_tr]:!border-cyan-300/10',
  '[&_thead_tr]:!bg-white/[0.05]',
  '[&_tbody]:!divide-cyan-300/10',
  '[&_tr]:!border-cyan-300/10'
].join(' ');

interface DevelopmentHubViewProps {
  activeTab: DevelopmentTab;
  onTabChange: (tab: DevelopmentTab) => void;

  players: Player[];
  games: Game[];
  onUpdateGames: (games: Game[]) => void;
  initialTrainingBuilderDay?: DayName | null;
  onInitialTrainingBuilderDayHandled?: () => void;

  assessments: AssessmentSession[];
  preselectedAssessmentsPlayerId: string | null;
  onClearPreselectedAssessmentsPlayerId: () => void;
  onAddAssessment: (session: AssessmentSession) => void;
  onDeleteAssessment: (sessionId: string) => void;
  onUpdateAssessmentNotes: (sessionId: string, coachNotes: string) => void;
  onReportDownloaded?: () => void;
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
    <div
      className={DEVELOPMENT_GLASS_CLASS}
      style={{ ...DARK_GLASS_THEME_STYLE, ...DARK_GLASS_DASHBOARD_SURFACE_STYLE }}
    >
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
              onReportDownloaded={props.onReportDownloaded}
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
              initialBuilderDay={props.initialTrainingBuilderDay}
              onInitialBuilderDayHandled={props.onInitialTrainingBuilderDayHandled}
            />
          </section>
        )}
      </Suspense>
    </div>
  );
}
