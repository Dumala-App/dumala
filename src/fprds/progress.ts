import type { AssessmentSession, FprdsAttributeId, FprdsRole } from '../types';
import { compareAssessmentRecency } from './assessmentService';
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
