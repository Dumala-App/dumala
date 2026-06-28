import { describe, expect, it } from 'vitest';
import type { AssessmentSession } from '../types';
import { TRAINING_DRILLS } from './drillLibrary';
import { formatTrainingFocusList, getAssessmentConfidence, summarizeDevelopmentEvidence } from './developmentEvidence';

const assessment = (assessmentDate: string): AssessmentSession => ({
  id: 'assessment-1',
  playerId: 'player-1',
  assessmentDate,
  role: 'ST',
  ageGroup: 'Adult',
  assessmentType: 'Quick',
  rawResults: {
    assessmentType: 'Quick',
    role: 'ST',
    base: {
      sprint10mSeconds: 1.9,
      sprint30mSeconds: 4.6,
      yoyoMeters: 1200,
      illinoisSeconds: 17.2,
      broadJumpCm: 190,
      medicineBallThrowCm: 420,
      firstTouchSuccessesOutOf10: 7,
      shortPassingSuccessesOutOf10: 8
    },
    roleSpecific: {
      finishingGoalsOutOf6: 4,
      finishingOnTargetOutOf6: 5,
      shotPowerMaxControlledDistanceMeters: 24
    }
  },
  attributeScores: {
    pace: 70,
    stamina: 60,
    agility: 62,
    strength: 61,
    firstTouch: 55,
    shortPassing: 56,
    finishingBox: 74,
    shotPower: 68,
    offensive1v1: 50,
    attackingHeading: 52,
    longPassing: 50,
    visionPlaymaking: 50,
    ballRetention: 50,
    pressingInterceptions: 50,
    tackling: 45,
    defensiveHeading: 45,
    positioningClearances: 45,
    crossing: 45,
    reflexes: 45,
    handling: 45,
    divingReach: 45,
    distribution: 45
  },
  ovr: 70,
  labels: {
    weakestAttributeId: 'tackling',
    ovrTierLabel: 'Core'
  },
  deltas: {},
  createdAt: `${assessmentDate}T10:00:00.000Z`
});

describe('development evidence doctrine helpers', () => {
  it('summarizes drill focus as evidence without producing verified rating changes', () => {
    const drills = [
      TRAINING_DRILLS.find(drill => drill.id === 'drill-shooting')!,
      TRAINING_DRILLS.find(drill => drill.id === 'drill-fwd-finishing')!,
      TRAINING_DRILLS.find(drill => drill.id === 'drill-fwd-positioning')!
    ];

    const summary = summarizeDevelopmentEvidence(drills, 12);

    expect(summary.focusSignals.shooting).toBeGreaterThan(0);
    expect(summary.reassessmentRecommended).toBe(true);
    expect(summary.recommendationLabel).toBe('Reassessment recommended');
    expect(summary).not.toHaveProperty('ovr');
    expect(summary).not.toHaveProperty('attributeScores');
  });

  it('formats development focus for coaches without exposing internal weights', () => {
    expect(formatTrainingFocusList({ shooting: 3, physicalness: 1 })).toBe('Shooting, Conditioning');
    expect(formatTrainingFocusList({})).toBe('None selected');
  });

  it('labels assessment confidence from verified assessment recency', () => {
    const today = new Date('2026-06-28T12:00:00.000Z');

    expect(getAssessmentConfidence(null, today).label).toBe('Unverified');
    expect(getAssessmentConfidence(assessment('2026-06-10'), today).label).toBe('High confidence');
    expect(getAssessmentConfidence(assessment('2026-04-10'), today).label).toBe('Medium confidence');
    expect(getAssessmentConfidence(assessment('2025-12-01'), today).label).toBe('Low confidence');
  });
});
