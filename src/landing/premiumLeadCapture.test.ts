import { describe, expect, it, vi } from 'vitest';
import type { FeedbackSubmission } from '../cloud/admin';
import {
  PREMIUM_LEAD_AFFECTED_AREA,
  PREMIUM_LEAD_KIND,
  PREMIUM_LEAD_STORAGE_KEY,
  PREMIUM_LEAD_SUBJECT_PREFIX,
  createPremiumLeadRecord,
  derivePremiumLeads,
  isPremiumLeadFeedback,
  parsePremiumLeadFeedback,
  readStoredPremiumLeads,
  storePremiumLead,
  validatePremiumLeadForm
} from './premiumLeadCapture';

// Mirrors the structured details block written by submitPremiumLead so the reader
// is tested against the exact contract the landing CTA produces.
const buildLeadFeedback = (overrides: Partial<FeedbackSubmission> = {}): FeedbackSubmission => ({
  id: 'feedback-1',
  category: 'feature_request',
  affected_area: PREMIUM_LEAD_AFFECTED_AREA,
  urgency: 'normal',
  subject: `${PREMIUM_LEAD_SUBJECT_PREFIX}Dumala FC`,
  details: [
    `Lead kind: ${PREMIUM_LEAD_KIND}`,
    'Source: landing_premium_cta',
    'Plan interest: premium',
    'Name: Ada Coach',
    'Organization: Dumala FC',
    'Role: Club manager',
    'Teams: 3',
    '',
    'Notes:',
    'Interested in staff workflows.'
  ].join('\n'),
  contact_email: 'ada@example.com',
  team_workspace: 'Dumala FC',
  status: 'new',
  created_at: '2026-07-03T12:00:00.000Z',
  updated_at: '2026-07-03T12:00:00.000Z',
  ...overrides
});

describe('premium lead capture', () => {
  it('validates the required Premium beta lead fields', () => {
    expect(validatePremiumLeadForm({
      name: '',
      email: 'not-email',
      organization: '',
      role: 'Coach',
      teamCount: '0',
      notes: ''
    })).toEqual({
      name: 'Add your name.',
      email: 'Add a valid email.',
      organization: 'Add your club, school, or team.',
      teamCount: 'Use a number from 1 to 99.'
    });
  });

  it('creates Premium-interest records that are distinct from free app opens', () => {
    const lead = createPremiumLeadRecord({
      name: 'Ada Coach',
      email: 'ADA@EXAMPLE.COM',
      organization: 'Dumala FC',
      role: 'Club manager',
      teamCount: '3',
      notes: 'Interested in staff workflows.'
    }, new Date('2026-07-03T12:00:00.000Z'), 'https://dumala.test/#landing', 'vitest');

    expect(lead).toMatchObject({
      kind: PREMIUM_LEAD_KIND,
      source: 'landing_premium_cta',
      planInterest: 'premium',
      email: 'ada@example.com',
      organization: 'Dumala FC',
      delivery: 'pending'
    });
  });

  it('stores one local audit record per lead id', () => {
    const values = new Map<string, string>();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: vi.fn((key: string) => values.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
          values.set(key, value);
        })
      }
    });

    const lead = createPremiumLeadRecord({
      name: 'Ada Coach',
      email: 'ada@example.com',
      organization: 'Dumala FC',
      role: 'Coach',
      teamCount: '1',
      notes: ''
    }, new Date('2026-07-03T12:00:00.000Z'));

    storePremiumLead(lead);
    storePremiumLead({ ...lead, delivery: 'formsubmit' });

    expect(readStoredPremiumLeads()).toHaveLength(1);
    expect(readStoredPremiumLeads()[0]).toMatchObject({ id: lead.id, delivery: 'formsubmit' });
    expect(values.has(PREMIUM_LEAD_STORAGE_KEY)).toBe(true);

    vi.unstubAllGlobals();
  });

  it('recognises Premium beta feedback by area or subject prefix', () => {
    expect(isPremiumLeadFeedback(buildLeadFeedback())).toBe(true);
    expect(isPremiumLeadFeedback(buildLeadFeedback({ affected_area: 'Something else' }))).toBe(true);
    expect(isPremiumLeadFeedback(buildLeadFeedback({
      affected_area: 'General feedback',
      subject: 'App is slow'
    }))).toBe(false);
  });

  it('parses lead fields back out of the stored feedback details block', () => {
    const lead = parsePremiumLeadFeedback(buildLeadFeedback());
    expect(lead).toEqual({
      id: 'feedback-1',
      name: 'Ada Coach',
      email: 'ada@example.com',
      organization: 'Dumala FC',
      role: 'Club manager',
      teamCount: '3',
      notes: 'Interested in staff workflows.',
      status: 'new',
      submittedAt: '2026-07-03T12:00:00.000Z',
      pageUrl: '',
      browser: ''
    });
  });

  it('treats "Not provided" notes as empty and only derives Premium leads', () => {
    const withoutNotes = buildLeadFeedback({
      id: 'feedback-2',
      details: buildLeadFeedback().details.replace('Interested in staff workflows.', 'Not provided')
    });
    const unrelated = buildLeadFeedback({
      id: 'feedback-3',
      affected_area: 'General feedback',
      subject: 'Bug report'
    });

    expect(parsePremiumLeadFeedback(withoutNotes).notes).toBe('');
    const derived = derivePremiumLeads([buildLeadFeedback(), withoutNotes, unrelated]);
    expect(derived.map(item => item.id)).toEqual(['feedback-1', 'feedback-2']);
  });
});
