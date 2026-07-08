import { describe, expect, it } from 'vitest';
import {
  BENCHMARK_VERSION_REGISTRY,
  CURRENT_BENCHMARK_VERSION,
  getBenchmarkVersionInfo,
  isKnownBenchmarkVersion
} from './benchmarks';
import { assessmentSessionSchema } from '../persistence/schemas';

describe('benchmark version registry', () => {
  it('registers the current benchmark version', () => {
    expect(isKnownBenchmarkVersion(CURRENT_BENCHMARK_VERSION)).toBe(true);
    expect(BENCHMARK_VERSION_REGISTRY[CURRENT_BENCHMARK_VERSION].status).toBe('current');
  });

  it('treats unknown or missing versions as unknown', () => {
    expect(isKnownBenchmarkVersion('fprds-beta-999')).toBe(false);
    expect(isKnownBenchmarkVersion(undefined)).toBe(false);
    expect(isKnownBenchmarkVersion(null)).toBe(false);
  });

  it('falls back to the current version metadata for unknown values', () => {
    expect(getBenchmarkVersionInfo('fprds-beta-999').version).toBe(CURRENT_BENCHMARK_VERSION);
    expect(getBenchmarkVersionInfo(undefined).version).toBe(CURRENT_BENCHMARK_VERSION);
    expect(getBenchmarkVersionInfo(CURRENT_BENCHMARK_VERSION).label).toBeTruthy();
  });
});

describe('assessment session benchmark backfill', () => {
  const legacySession = {
    id: 'a1',
    playerId: 'p1',
    assessmentDate: '2026-06-01',
    createdAt: '2026-06-01T10:00:00.000Z',
    assessmentType: 'Quick' as const,
    ageGroup: 'U15' as const,
    role: 'CM' as const,
    rawResults: {
      role: 'CM' as const,
      assessmentType: 'Quick' as const,
      base: {
        sprint10mSeconds: 1.8, sprint30mSeconds: 4.3, yoyoMeters: 1200, illinoisSeconds: 15.2,
        broadJumpCm: 210, medicineBallThrowCm: 620, firstTouchSuccessesOutOf10: 8, shortPassingSuccessesOutOf10: 7
      },
      roleSpecific: { visionCoachScore1to10: 7, longPassing30mSuccessesOutOf5: 4, longPassing40mSuccessesOutOf5: 3 }
    },
    attributeScores: { pace: 70 },
    ovr: 70,
    labels: { weakestAttributeId: 'pace', ovrTierLabel: 'Core' },
    deltas: {}
  };

  it('backfills a legacy session with the first benchmark version', () => {
    const parsed = assessmentSessionSchema.parse(legacySession);
    expect(parsed.benchmarkVersion).toBe(CURRENT_BENCHMARK_VERSION);
  });

  it('preserves an explicit benchmark version', () => {
    const parsed = assessmentSessionSchema.parse({ ...legacySession, benchmarkVersion: 'fprds-beta-1' });
    expect(parsed.benchmarkVersion).toBe('fprds-beta-1');
  });
});
