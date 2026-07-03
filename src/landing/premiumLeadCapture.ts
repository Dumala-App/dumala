import type { CloudRuntime } from '../cloud/runtime';

export const PREMIUM_LEAD_STORAGE_KEY = 'dumala.premiumBetaLeads.v1';
export const PREMIUM_LEAD_KIND = 'premium_beta_interest';
const PREMIUM_LEAD_EMAIL = 'kleinski23@gmail.com';

export type PremiumLeadField = 'name' | 'email' | 'organization' | 'role' | 'teamCount' | 'notes';

export interface PremiumLeadForm {
  name: string;
  email: string;
  organization: string;
  role: string;
  teamCount: string;
  notes: string;
}

export interface PremiumLeadRecord extends PremiumLeadForm {
  id: string;
  kind: typeof PREMIUM_LEAD_KIND;
  source: 'landing_premium_cta';
  planInterest: 'premium';
  submittedAt: string;
  pageUrl: string;
  userAgent: string;
  delivery: 'pending' | 'cloud' | 'formsubmit';
}

export type PremiumLeadErrors = Partial<Record<PremiumLeadField, string>>;

export const initialPremiumLeadForm: PremiumLeadForm = {
  name: '',
  email: '',
  organization: '',
  role: 'Coach',
  teamCount: '1',
  notes: ''
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validatePremiumLeadForm = (form: PremiumLeadForm): PremiumLeadErrors => {
  const errors: PremiumLeadErrors = {};
  if (form.name.trim().length < 2) errors.name = 'Add your name.';
  if (!emailPattern.test(form.email.trim())) errors.email = 'Add a valid email.';
  if (form.organization.trim().length < 2) errors.organization = 'Add your club, school, or team.';
  const parsedTeams = Number(form.teamCount);
  if (!Number.isInteger(parsedTeams) || parsedTeams < 1 || parsedTeams > 99) {
    errors.teamCount = 'Use a number from 1 to 99.';
  }
  return errors;
};

export const hasPremiumLeadErrors = (errors: PremiumLeadErrors): boolean =>
  Object.values(errors).some(Boolean);

export const createPremiumLeadRecord = (
  form: PremiumLeadForm,
  now = new Date(),
  pageUrl = typeof window === 'undefined' ? '' : window.location?.href ?? '',
  userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent ?? ''
): PremiumLeadRecord => ({
  id: `premium-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
  kind: PREMIUM_LEAD_KIND,
  source: 'landing_premium_cta',
  planInterest: 'premium',
  name: form.name.trim(),
  email: form.email.trim().toLowerCase(),
  organization: form.organization.trim(),
  role: form.role,
  teamCount: form.teamCount.trim(),
  notes: form.notes.trim(),
  submittedAt: now.toISOString(),
  pageUrl,
  userAgent,
  delivery: 'pending'
});

export const readStoredPremiumLeads = (): PremiumLeadRecord[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(PREMIUM_LEAD_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isPremiumLeadRecord) : [];
  } catch {
    return [];
  }
};

export const storePremiumLead = (lead: PremiumLeadRecord) => {
  if (typeof window === 'undefined') return;
  try {
    const leads = readStoredPremiumLeads().filter(existing => existing.id !== lead.id);
    window.localStorage.setItem(PREMIUM_LEAD_STORAGE_KEY, JSON.stringify([lead, ...leads].slice(0, 50)));
  } catch {
    // Lead capture must still try online delivery if browser storage is unavailable.
  }
};

export const submitPremiumLead = async (
  lead: PremiumLeadRecord,
  runtime: CloudRuntime
): Promise<PremiumLeadRecord> => {
  if (runtime.enabled) {
    const savedFeedback = await runtime.dataAccess.admin.createFeedback({
      category: 'feature_request',
      affectedArea: 'Landing page Premium beta',
      urgency: 'normal',
      subject: `Premium beta interest: ${lead.organization}`,
      details: [
        `Lead kind: ${lead.kind}`,
        `Source: ${lead.source}`,
        `Plan interest: ${lead.planInterest}`,
        `Name: ${lead.name}`,
        `Organization: ${lead.organization}`,
        `Role: ${lead.role}`,
        `Teams: ${lead.teamCount}`,
        '',
        'Notes:',
        lead.notes || 'Not provided'
      ].join('\n'),
      expectedBehavior: 'Follow up about Premium beta access and willingness-to-pay validation.',
      contactEmail: lead.email,
      pageUrl: lead.pageUrl,
      browser: lead.userAgent,
      teamWorkspace: lead.organization
    });

    void runtime.dataAccess.admin.recordUsageEvent({
      eventType: 'lead_captured',
      viewName: 'landing',
      featureName: PREMIUM_LEAD_KIND,
      appVersion: '0.0.0',
      metadata: {
        feedbackId: savedFeedback.id,
        source: lead.source,
        planInterest: lead.planInterest,
        organization: lead.organization,
        role: lead.role,
        teamCount: lead.teamCount
      }
    }).catch(() => undefined);

    return { ...lead, delivery: 'cloud' };
  }

  const response = await fetch(`https://formsubmit.co/ajax/${PREMIUM_LEAD_EMAIL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      _subject: `[Dumala Premium beta] ${lead.organization}`,
      _template: 'table',
      _captcha: 'false',
      _honey: '',
      _replyto: lead.email,
      lead_kind: lead.kind,
      source: lead.source,
      plan_interest: lead.planInterest,
      name: lead.name,
      email: lead.email,
      organization: lead.organization,
      role: lead.role,
      team_count: lead.teamCount,
      notes: lead.notes || 'Not provided',
      page_url: lead.pageUrl,
      browser: lead.userAgent,
      submitted_at: lead.submittedAt
    })
  });

  if (!response.ok) throw new Error('Lead capture service rejected the submission.');
  return { ...lead, delivery: 'formsubmit' };
};

const isPremiumLeadRecord = (value: unknown): value is PremiumLeadRecord => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<PremiumLeadRecord>;
  return record.kind === PREMIUM_LEAD_KIND
    && record.source === 'landing_premium_cta'
    && typeof record.email === 'string'
    && typeof record.submittedAt === 'string';
};
