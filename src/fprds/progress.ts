import type { AssessmentSession, FprdsAttributeId, FprdsRole } from '../types';
import { compareAssessmentRecency } from './assessmentService';
import {
  type CoachFeedbackCopyContext,
  CONVERSATION_PROMPTS,
  CORRECTION_STATEMENTS,
  FEEDBACK_HEADLINES,
  FOCUS_STATEMENTS,
  getCoachAttributeLanguage,
  getCoachRoleLanguage,
  OPENING_STATEMENTS,
  PRAISE_STATEMENTS,
  PRIORITY_REASON_STATEMENTS,
  priorityCue,
  selectCoachStatement,
  strengthCue
} from './coachFeedbackContent';
import { getAttributeLabel } from './scoring';
import { ROLE_WEIGHTS } from './weights';

export interface AssessmentProgressPoint {
  id: string;
  label: string;
  assessmentDate: string;
  role: FprdsRole;
  assessmentType: AssessmentSession['assessmentType'];
  ageGroup: AssessmentSession['ageGroup'];
  ovr: number;
  attributeScores: Record<FprdsAttributeId, number>;
}

export interface AttributeComparisonRow {
  attributeId: FprdsAttributeId;
  primaryScore: number;
  comparisonScore: number;
  delta: number;
}

export interface PlayerAssessmentReport {
  primarySession: AssessmentSession;
  comparisonSession: AssessmentSession;
  role: FprdsRole;
  ovrDelta: number;
  rows: AttributeComparisonRow[];
  primaryAdvantages: AttributeComparisonRow[];
  comparisonAdvantages: AttributeComparisonRow[];
}

export interface SessionAssessmentReport {
  baselineSession: AssessmentSession;
  targetSession: AssessmentSession;
  role: FprdsRole;
  ovrDelta: number;
  rows: AttributeComparisonRow[];
  improved: AttributeComparisonRow[];
  declined: AttributeComparisonRow[];
}

export interface PlayerFeedbackAttribute {
  attributeId: FprdsAttributeId;
  displayName: string;
  coachPhrase: string;
  trainingCue: string;
  score: number;
  label: string;
  color: string;
  priorityScore: number;
  reason: string;
}

export interface PlayerFeedbackReport {
  latestSession: AssessmentSession;
  previousSession: AssessmentSession | null;
  role: FprdsRole;
  ovrDelta: number | null;
  trendLabel: string;
  trendTone: 'positive' | 'negative' | 'neutral';
  feedback: {
    headline: string;
    opening: string;
    praise: string;
    correction: string;
    focus: string;
  };
  strengths: PlayerFeedbackAttribute[];
  priorities: PlayerFeedbackAttribute[];
  conversationPrompts: string[];
  nextStep: {
    title: string;
    body: string;
    focusAttributeId?: FprdsAttributeId;
  };
}

export const sortAssessmentsChronologically = (sessions: AssessmentSession[]): AssessmentSession[] => (
  [...sessions].sort(compareAssessmentRecency)
);

export const buildAssessmentProgressSeries = (sessions: AssessmentSession[]): AssessmentProgressPoint[] => (
  sortAssessmentsChronologically(sessions).map((session, index) => ({
    id: session.id,
    label: `${index + 1}. ${session.assessmentDate}`,
    assessmentDate: session.assessmentDate,
    role: session.role,
    assessmentType: session.assessmentType,
    ageGroup: session.ageGroup,
    ovr: session.ovr,
    attributeScores: session.attributeScores
  }))
);

export const getLatestRoleFromProgress = (series: AssessmentProgressPoint[]): FprdsRole | null => (
  series.length > 0 ? series[series.length - 1].role : null
);

export const getWeightedProgressAttributes = (
  role: FprdsRole,
  limit = 4
): FprdsAttributeId[] => (
  (Object.keys(ROLE_WEIGHTS[role]) as FprdsAttributeId[])
    .filter((attributeId) => ROLE_WEIGHTS[role][attributeId] > 0)
    .sort((a, b) => ROLE_WEIGHTS[role][b] - ROLE_WEIGHTS[role][a])
    .slice(0, limit)
);

const buildFeedbackAttributes = (
  session: AssessmentSession,
  sorter: (first: PlayerFeedbackAttribute, second: PlayerFeedbackAttribute) => number,
  limit: number,
  copyContext?: (attributeId: FprdsAttributeId) => CoachFeedbackCopyContext
): PlayerFeedbackAttribute[] => (
  (Object.keys(ROLE_WEIGHTS[session.role]) as FprdsAttributeId[])
    .filter((attributeId) => ROLE_WEIGHTS[session.role][attributeId] > 0)
    .map((attributeId) => {
      const score = session.attributeScores[attributeId];
      const meta = getAttributeLabel(score);
      const language = getCoachAttributeLanguage(attributeId);
      const priorityScore = (100 - score) * ROLE_WEIGHTS[session.role][attributeId];
      const reasonBuilder = selectCoachStatement(
        PRIORITY_REASON_STATEMENTS,
        `${session.id}-${attributeId}-reason`
      );
      const reasonContext = copyContext?.(attributeId);
      return {
        attributeId,
        displayName: language.display,
        coachPhrase: language.coachPhrase,
        trainingCue: language.trainingCue,
        score,
        label: meta.label,
        color: meta.color,
        priorityScore: Number(priorityScore.toFixed(2)),
        reason: reasonContext
          ? reasonBuilder(reasonContext)
          : `${language.display} has role value and room to grow. Cue it as: ${language.trainingCue}.`
      };
    })
    .sort(sorter)
    .slice(0, limit)
);

const describeTrend = (delta: number | null): { label: string; tone: PlayerFeedbackReport['trendTone'] } => {
  if (delta === null) return { label: 'First saved assessment', tone: 'neutral' };
  if (delta > 0) return { label: `Up ${delta} OVR since last assessment`, tone: 'positive' };
  if (delta < 0) return { label: `Down ${Math.abs(delta)} OVR since last assessment`, tone: 'negative' };
  return { label: 'Level with last assessment', tone: 'neutral' };
};

const buildTrendMessage = (delta: number | null): string => {
  if (delta === null) return 'This gives us a clean starting point. No drama, no labels, just a clear picture of what we can train next.';
  if (delta > 0) return 'The progress is real, and I want you to connect it to the habits that created it.';
  if (delta < 0) return 'The number dipped, but that does not define you. We are going to find the part of the action we can control first.';
  return 'The score stayed level, so the next jump will come from sharper detail rather than simply working harder.';
};

export const buildPlayerFeedbackReport = (
  latestSession: AssessmentSession | null,
  previousSession: AssessmentSession | null
): PlayerFeedbackReport | null => {
  if (!latestSession) return null;

  const ovrDelta = previousSession ? latestSession.ovr - previousSession.ovr : null;
  const trend = describeTrend(ovrDelta);
  const roleLanguage = getCoachRoleLanguage(latestSession.role);
  const buildContextForAttribute = (attributeId: FprdsAttributeId) => {
    const language = getCoachAttributeLanguage(attributeId);
    const scoreLabel = getAttributeLabel(latestSession.attributeScores[attributeId]).label;
    return {
      rolePicture: roleLanguage.rolePicture,
      roleStandard: roleLanguage.standard,
      trendMessage: buildTrendMessage(ovrDelta),
      strengthCoachPhrase: language.coachPhrase,
      strengthDisplayName: language.display,
      strengthCue: strengthCue(scoreLabel),
      priorityCoachPhrase: language.coachPhrase,
      priorityDisplayName: language.display,
      priorityCue: priorityCue(scoreLabel),
      priorityTrainingCue: language.trainingCue
    };
  };

  const strengths = buildFeedbackAttributes(latestSession, (a, b) => b.score - a.score, 3);
  const priorities = buildFeedbackAttributes(
    latestSession,
    (a, b) => b.priorityScore - a.priorityScore,
    3,
    buildContextForAttribute
  );
  const topStrength = strengths[0] ?? null;
  const topPriority = priorities[0] ?? null;
  const fallbackPriority = latestSession.labels.weakestAttributeId;
  const fallbackPriorityLanguage = getCoachAttributeLanguage(fallbackPriority);
  const topStrengthName = topStrength?.displayName ?? 'current strengths';
  const topStrengthLabel = topStrength?.label ?? 'Developing';
  const topPriorityAttributeId = topPriority?.attributeId ?? fallbackPriority;
  const topPriorityLanguage = topPriority ? getCoachAttributeLanguage(topPriority.attributeId) : fallbackPriorityLanguage;
  const topPriorityName = topPriority?.displayName ?? topPriorityLanguage.display;
  const topPriorityCoachPhrase = topPriority?.coachPhrase ?? topPriorityLanguage.coachPhrase;
  const topPriorityTrainingCue = topPriority?.trainingCue ?? topPriorityLanguage.trainingCue;
  const topPriorityLabel = topPriority?.label ?? getAttributeLabel(latestSession.attributeScores[topPriorityAttributeId]).label;
  const trendMessage = buildTrendMessage(ovrDelta);
  const copyContext = {
    rolePicture: roleLanguage.rolePicture,
    roleStandard: roleLanguage.standard,
    trendMessage,
    strengthCoachPhrase: topStrength?.coachPhrase ?? 'your strongest current habit',
    strengthDisplayName: topStrengthName,
    strengthCue: topStrength ? strengthCue(topStrengthLabel) : 'Start with one honest positive before moving into the correction.',
    priorityCoachPhrase: topPriorityCoachPhrase,
    priorityDisplayName: topPriorityName,
    priorityCue: priorityCue(topPriorityLabel),
    priorityTrainingCue: topPriorityTrainingCue
  };

  const promptStart = Array.from(`${latestSession.id}-prompts`).reduce((total, char) => total + char.charCodeAt(0), 0);
  const conversationPrompts = [0, 1, 2].map((offset) => (
    CONVERSATION_PROMPTS[(promptStart + offset) % CONVERSATION_PROMPTS.length](copyContext)
  ));

  const nextStep = latestSession.developmentPlan
    ? {
        title: 'Use the saved 4-week plan',
        body: `Build the next block around ${getCoachAttributeLanguage(latestSession.developmentPlan.focusAttributeId).coachPhrase}. Start with the week 1 focus from the saved plan, check the cue after two sessions, then retest after week 4 so the player can see whether the work transferred.`,
        focusAttributeId: latestSession.developmentPlan.focusAttributeId
      }
    : {
        title: 'Run a Full assessment for the plan',
        body: 'This looks like a feedback checkpoint, but it does not yet create a structured weekly plan. Run a Full assessment when you want the system to turn this conversation into a 4-week training block.'
      };

  return {
    latestSession,
    previousSession,
    role: latestSession.role,
    ovrDelta,
    trendLabel: trend.label,
    trendTone: trend.tone,
    feedback: {
      headline: selectCoachStatement(FEEDBACK_HEADLINES, `${latestSession.id}-headline`),
      opening: selectCoachStatement(OPENING_STATEMENTS, `${latestSession.id}-opening`)(copyContext),
      praise: selectCoachStatement(PRAISE_STATEMENTS, `${latestSession.id}-praise`)(copyContext),
      correction: selectCoachStatement(CORRECTION_STATEMENTS, `${latestSession.id}-correction`)(copyContext),
      focus: selectCoachStatement(FOCUS_STATEMENTS, `${latestSession.id}-focus`)(copyContext)
    },
    strengths,
    priorities,
    conversationPrompts,
    nextStep
  };
};

export const filterProgressSeriesByRole = (
  series: AssessmentProgressPoint[],
  role: FprdsRole
): AssessmentProgressPoint[] => (
  series.filter((point) => point.role === role)
);

export const calculateProgressDelta = (series: AssessmentProgressPoint[]): number | null => {
  if (series.length < 2) return null;
  return series[series.length - 1].ovr - series[0].ovr;
};

export const selectLatestAssessment = (sessions: AssessmentSession[]): AssessmentSession | null => (
  sortAssessmentsChronologically(sessions).at(-1) ?? null
);

export const selectLatestAssessmentByPlayer = (
  sessions: AssessmentSession[],
  playerId: string
): AssessmentSession | null => (
  selectLatestAssessment(sessions.filter((session) => session.playerId === playerId))
);

export const buildAttributeComparisonRows = (
  primarySession: AssessmentSession,
  comparisonSession: AssessmentSession,
  role: FprdsRole
): AttributeComparisonRow[] => (
  getWeightedProgressAttributes(role, Number.POSITIVE_INFINITY)
    .map((attributeId) => {
      const primaryScore = primarySession.attributeScores[attributeId];
      const comparisonScore = comparisonSession.attributeScores[attributeId];
      return {
        attributeId,
        primaryScore,
        comparisonScore,
        delta: primaryScore - comparisonScore
      };
    })
);

const topPositiveRows = (rows: AttributeComparisonRow[], scoreSelector: (row: AttributeComparisonRow) => number) => (
  [...rows]
    .filter((row) => scoreSelector(row) > 0)
    .sort((a, b) => scoreSelector(b) - scoreSelector(a))
    .slice(0, 3)
);

export const buildPlayerAssessmentReport = (
  primarySession: AssessmentSession | null,
  comparisonSession: AssessmentSession | null
): PlayerAssessmentReport | null => {
  if (!primarySession || !comparisonSession) return null;
  const role = primarySession.role === comparisonSession.role ? primarySession.role : primarySession.role;
  const rows = buildAttributeComparisonRows(primarySession, comparisonSession, role);

  return {
    primarySession,
    comparisonSession,
    role,
    ovrDelta: primarySession.ovr - comparisonSession.ovr,
    rows,
    primaryAdvantages: topPositiveRows(rows, (row) => row.delta),
    comparisonAdvantages: topPositiveRows(rows, (row) => -row.delta)
  };
};

export const buildSessionAssessmentReport = (
  baselineSession: AssessmentSession | null,
  targetSession: AssessmentSession | null
): SessionAssessmentReport | null => {
  if (!baselineSession || !targetSession || baselineSession.id === targetSession.id) return null;
  const role = targetSession.role;
  const rows = buildAttributeComparisonRows(targetSession, baselineSession, role);

  return {
    baselineSession,
    targetSession,
    role,
    ovrDelta: targetSession.ovr - baselineSession.ovr,
    rows,
    improved: topPositiveRows(rows, (row) => row.delta),
    declined: topPositiveRows(rows, (row) => -row.delta)
  };
};
