import { describe, expect, it } from 'vitest';
import { EMPTY_COACH_LEARNING_RECORD, credentialRenewalState, learningProgress, parseCoachLearningRecord, publicPortfolioSnapshot } from './coachEducation';

describe('coach education records', () => {
  it('falls back safely for missing or invalid local data', () => {
    expect(parseCoachLearningRecord(null)).toEqual(EMPTY_COACH_LEARNING_RECORD);
    expect(parseCoachLearningRecord('{broken')).toEqual(EMPTY_COACH_LEARNING_RECORD);
  });

  it('migrates existing learning progress with private credential defaults', () => {
    const record = parseCoachLearningRecord(JSON.stringify({
      version: 1,
      plans: [{
        id: 'plan-1', title: 'Build better sessions', focus: 'Session planning', createdAt: '2026-07-12',
        goals: [
          { id: 'g1', title: 'Plan the arrival activity', targetDate: '', completed: true },
          { id: 'g2', title: 'Write three coaching cues', targetDate: '', completed: false }
        ]
      }],
      reflections: []
    }));
    expect(learningProgress(record)).toEqual({ completed: 1, total: 2 });
    expect(record).not.toHaveProperty('licences');
    expect(record.credentials).toEqual([]);
    expect(record.portfolio.isPublic).toBe(false);
  });

  it('derives renewal reminders and strips document metadata from public previews', () => {
    const credential = {
      id: 'credential-1', qualification: 'PFF C Diploma', issuer: 'PFF', licenceNumber: '123',
      issuedOn: '2025-01-01', expiresOn: '2026-08-01', documentName: 'private-certificate.pdf',
      verificationState: 'self-recorded' as const, showInPortfolio: true
    };
    expect(credentialRenewalState(credential, new Date('2026-07-12T00:00:00'))).toBe('due-soon');
    const snapshot = publicPortfolioSnapshot({
      ...EMPTY_COACH_LEARNING_RECORD,
      credentials: [credential],
      portfolio: { isPublic: true, displayName: 'Coach Ana', headline: '', bio: '', specialties: [], ageGroups: '', experience: '', achievements: [] }
    });
    expect(snapshot.credentials).toHaveLength(1);
    expect(snapshot.credentials[0]).not.toHaveProperty('documentName');
    expect(snapshot.credentials[0].verificationState).toBe('self-recorded');
  });
});
