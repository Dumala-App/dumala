import type { AssessmentSession, Player } from '../types';
import type { TrainingDrill } from './drillLibrary';

export type DevelopmentEvidenceSignal = Partial<Record<keyof Player['attributes'], number>>;

export type DevelopmentEvidenceSummary = {
  drillCount: number;
  loadPoints: number;
  focusSignals: DevelopmentEvidenceSignal;
  reassessmentRecommended: boolean;
  recommendationLabel: string;
};

export type RatingConfidence = {
  label: 'High confidence' | 'Medium confidence' | 'Low confidence' | 'Unverified';
  description: string;
  tone: 'strong' | 'moderate' | 'stale' | 'missing';
};

const TRAINING_ATTRIBUTE_LABELS: Record<string, string> = {
  speed: 'Speed',
  shooting: 'Shooting',
  passing: 'Passing',
  dribbling: 'Dribbling',
  defending: 'Defending',
  physicalness: 'Conditioning'
};

export const formatTrainingFocusList = (
  focusSignals: DevelopmentEvidenceSignal
): string => {
  const labels = Object.entries(focusSignals)
    .sort(([, first], [, second]) => (second ?? 0) - (first ?? 0))
    .map(([attribute]) => TRAINING_ATTRIBUTE_LABELS[attribute] ?? attribute);

  return labels.length > 0 ? labels.join(', ') : 'None selected';
};

export const summarizeDevelopmentEvidence = (
  drills: readonly TrainingDrill[],
  loadPoints: number
): DevelopmentEvidenceSummary => {
  const focusSignals = drills.reduce<DevelopmentEvidenceSignal>((totals, drill) => {
    Object.entries(drill.developmentFocus).forEach(([attribute, amount]) => {
      const key = attribute as keyof Player['attributes'];
      totals[key] = (totals[key] || 0) + amount;
    });
    return totals;
  }, {});

  const reassessmentRecommended = drills.length >= 3 || loadPoints >= 12;

  return {
    drillCount: drills.length,
    loadPoints,
    focusSignals,
    reassessmentRecommended,
    recommendationLabel: reassessmentRecommended
      ? 'Reassessment recommended'
      : 'Build more evidence'
  };
};

const parseDate = (value: string): number | null => {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
};

export const getAssessmentConfidence = (
  latestAssessment: AssessmentSession | null,
  today: Date = new Date()
): RatingConfidence => {
  if (!latestAssessment) {
    return {
      label: 'Unverified',
      description: 'No saved FPRDS assessment yet. Rating changes need a verified baseline.',
      tone: 'missing'
    };
  }

  const assessedAt = parseDate(latestAssessment.assessmentDate);
  if (assessedAt === null) {
    return {
      label: 'Low confidence',
      description: 'Latest assessment date needs review before relying on this rating.',
      tone: 'stale'
    };
  }

  const daysOld = Math.max(0, Math.floor((today.getTime() - assessedAt) / 86_400_000));

  if (daysOld <= 30) {
    return {
      label: 'High confidence',
      description: `Latest verified assessment was ${daysOld} days ago.`,
      tone: 'strong'
    };
  }

  if (daysOld <= 90) {
    return {
      label: 'Medium confidence',
      description: `Latest verified assessment was ${daysOld} days ago; reassess after this block if evidence is strong.`,
      tone: 'moderate'
    };
  }

  return {
    label: 'Low confidence',
    description: `Latest verified assessment was ${daysOld} days ago. Reassessment is recommended before trusting rating movement.`,
    tone: 'stale'
  };
};
