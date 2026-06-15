import type { AssessmentDevelopmentPlan, AssessmentDevelopmentPlanWeek, FprdsAttributeId, FprdsRole } from '../types';
import { ROLE_WEIGHTS } from './weights';

const DRILL_MAP: Record<FprdsAttributeId, { drillIds: string[]; focusLabel: string; notes: string }> = {
  pace: {
    drillIds: ['drill-acceleration', 'drill-repeat-sprint'],
    focusLabel: 'Pace / Acceleration',
    notes: 'Emphasize sprint mechanics, first-step explosiveness, and repeated sprint capacity.'
  },
  stamina: {
    drillIds: ['drill-stamina-cardio', 'drill-aerobic-base'],
    focusLabel: 'Stamina / Endurance',
    notes: 'Build aerobic base first, then layer interval intensity. Track recovery and consistency.'
  },
  agility: {
    drillIds: ['drill-agility', 'drill-mobility'],
    focusLabel: 'Agility / Balance',
    notes: 'Focus on change-of-direction technique and joint-friendly movement quality.'
  },
  strength: {
    drillIds: ['drill-gym', 'drill-plyometrics'],
    focusLabel: 'Strength / Power',
    notes: 'Blend strength foundation with controlled plyometrics for explosive power.'
  },
  firstTouch: {
    drillIds: ['drill-dribbling', 'drill-passing'],
    focusLabel: 'First Touch',
    notes: 'Prioritize clean receiving and quick setup touches before executing the next action.'
  },
  shortPassing: {
    drillIds: ['drill-passing', 'drill-playmaking'],
    focusLabel: 'Short Passing',
    notes: 'Improve pass weight, timing, and decision speed under light pressure.'
  },
  finishingBox: {
    drillIds: ['drill-shooting', 'drill-playmaking'],
    focusLabel: 'Finishing (Box)',
    notes: 'Emphasize first/second touch finishing and shot selection from typical scoring zones.'
  },
  shotPower: {
    drillIds: ['drill-shooting', 'drill-plyometrics'],
    focusLabel: 'Shot Power / Long Shots',
    notes: 'Combine striking technique with lower-body power development.'
  },
  offensive1v1: {
    drillIds: ['drill-dribbling', 'drill-acceleration'],
    focusLabel: 'Offensive 1v1',
    notes: 'Work on explosive separation, feints, and end-product (shot/cross) after beating a defender.'
  },
  attackingHeading: {
    drillIds: ['drill-heading', 'drill-plyometrics'],
    focusLabel: 'Attacking Heading',
    notes: 'Train timing, neck/core stability, and consistent contact into target zones.'
  },
  longPassing: {
    drillIds: ['drill-playmaking', 'drill-passing'],
    focusLabel: 'Long Passing',
    notes: 'Focus on body shape, striking through the ball, and accuracy into target zones.'
  },
  visionPlaymaking: {
    drillIds: ['drill-playmaking', 'drill-tactical-shadow'],
    focusLabel: 'Vision / Playmaking',
    notes: 'Increase scanning frequency and decision speed; connect actions to team shape and options.'
  },
  ballRetention: {
    drillIds: ['drill-dribbling', 'drill-tactical-shadow'],
    focusLabel: 'Ball Retention',
    notes: 'Improve shielding technique, first contact, and composure under pressure.'
  },
  pressingInterceptions: {
    drillIds: ['drill-pressing', 'drill-defending'],
    focusLabel: 'Pressing / Interceptions',
    notes: 'Work on angles, triggers, and recovery steps to win the ball quickly and safely.'
  },
  tackling: {
    drillIds: ['drill-defending', 'drill-agility'],
    focusLabel: 'Tackling (1v1 Defending)',
    notes: 'Focus on timing, body position, and containment before the tackle.'
  },
  defensiveHeading: {
    drillIds: ['drill-heading', 'drill-defending'],
    focusLabel: 'Defensive Heading',
    notes: 'Emphasize distance and direction of clearances to safe zones.'
  },
  positioningClearances: {
    drillIds: ['drill-tactical-shadow', 'drill-defending'],
    focusLabel: 'Positioning / Clearances',
    notes: 'Train body shape, awareness, and consistent clearances under pressure.'
  },
  crossing: {
    drillIds: ['drill-passing', 'drill-playmaking'],
    focusLabel: 'Crossing',
    notes: 'Improve delivery consistency into target zones from wide areas.'
  },
  reflexes: {
    drillIds: ['drill-goalkeeper'],
    focusLabel: 'Goalkeeper Reflexes',
    notes: 'Prioritize reaction speed and set position discipline.'
  },
  handling: {
    drillIds: ['drill-goalkeeper'],
    focusLabel: 'Goalkeeper Handling',
    notes: 'Emphasize clean catches and secure holds on shots and crosses.'
  },
  divingReach: {
    drillIds: ['drill-goalkeeper'],
    focusLabel: 'Goalkeeper Diving / Reach',
    notes: 'Train explosive lateral dives with safe landing mechanics.'
  },
  distribution: {
    drillIds: ['drill-goalkeeper', 'drill-passing'],
    focusLabel: 'Goalkeeper Distribution',
    notes: 'Work on accuracy to targets and quick decision-making under pressure.'
  }
};

export const computePriorityScore = (score: number, weight: number): number => {
  return (100 - score) * weight;
};

export const pickDevelopmentFocus = (role: FprdsRole, scores: Record<string, number>): { focusAttributeId: FprdsAttributeId; priorityScore: number } => {
  const weights = ROLE_WEIGHTS[role];
  const weightedKeys = (Object.keys(weights) as FprdsAttributeId[]).filter(k => (weights[k] ?? 0) > 0);

  let bestKey: FprdsAttributeId = weightedKeys[0] ?? 'pace';
  let bestPriority = -Infinity;

  for (const key of weightedKeys) {
    const weight = weights[key] ?? 0;
    const score = typeof scores[key] === 'number' ? scores[key] : 10;
    const p = computePriorityScore(score, weight);
    if (p > bestPriority) {
      bestPriority = p;
      bestKey = key;
    }
  }

  return { focusAttributeId: bestKey, priorityScore: bestPriority };
};

export const generateFourWeekPlan = (role: FprdsRole, attributeScores: Record<string, number>): AssessmentDevelopmentPlan => {
  const { focusAttributeId, priorityScore } = pickDevelopmentFocus(role, attributeScores);
  const mapping = DRILL_MAP[focusAttributeId] ?? DRILL_MAP.pace;

  const week = (weekNumber: 1 | 2 | 3 | 4, focus: string, drillIds: string[], notes: string): AssessmentDevelopmentPlanWeek => ({
    weekNumber,
    focus,
    drillIds,
    notes
  });

  const weeks: AssessmentDevelopmentPlanWeek[] = [
    week(1, `Foundation: ${mapping.focusLabel}`, mapping.drillIds, mapping.notes),
    week(2, `Progression: ${mapping.focusLabel}`, mapping.drillIds, 'Increase difficulty slightly. Keep quality high; avoid sacrificing technique for volume.'),
    week(3, `Decision speed: ${mapping.focusLabel}`, mapping.drillIds, 'Add game-like constraints (time limit, pressure cues, limited touches) while keeping execution clean.'),
    week(4, `Retest: ${mapping.focusLabel}`, [], 'Retest the relevant drill(s) and record a new assessment session to recalculate OVR and deltas.')
  ];

  return {
    focusAttributeId,
    priorityScore: Number(priorityScore.toFixed(2)),
    weeks
  };
};

