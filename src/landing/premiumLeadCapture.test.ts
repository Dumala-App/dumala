import { describe, expect, it, vi } from 'vitest';
import {
  PREMIUM_LEAD_KIND,
  PREMIUM_LEAD_STORAGE_KEY,
  createPremiumLeadRecord,
  readStoredPremiumLeads,
  storePremiumLead,
  validatePremiumLeadForm
} from './premiumLeadCapture';

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
});
