import type { CloudRuntime } from '../cloud/runtime';
import type { FeedbackStatus, FeedbackSubmission } from '../cloud/admin';

export const PREMIUM_LEAD_STORAGE_KEY = 'dumala.premiumBetaLeads.v1';
export const PREMIUM_LEAD_KIND = 'premium_beta_interest';
// These two strings are the join key between the landing-page lead writer and the
// Admin Console leads reader. Keep them in sync — the reader filters feedback by them.
export const PREMIUM_LEAD_AFFECTED_AREA = 'Landing page Premium beta';
export const PREMIUM_LEAD_SUBJECT_PREFIX = 'Premium beta interest: ';
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
      affectedArea: PREMIUM_LEAD_AFFECTED_AREA,
      urgency: 'normal',
      subject: `${PREMIUM_LEAD_SUBJECT_PREFIX}${lead.organization}`,
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

// A Premium beta lead reconstructed from a stored feedback submission, for the
// Admin Console leads view. The landing CTA writes the structured `details`
// block below, so we parse it back out here rather than adding a second table.
export interface PremiumLeadSummary {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: string;
  teamCount: string;
  notes: string;
  status: FeedbackStatus;
  submittedAt: string;
  pageUrl: string;
  browser: string;
}

export const isPremiumLeadFeedback = (feedback: FeedbackSubmission): boolean =>
  feedback.affected_area === PREMIUM_LEAD_AFFECTED_AREA
  || feedback.subject.startsWith(PREMIUM_LEAD_SUBJECT_PREFIX);

const readDetailField = (details: string, label: string): string => {
  const prefix = `${label}:`;
  const line = details.split('\n').find(entry => entry.startsWith(prefix));
  return line ? line.slice(prefix.length).trim() : '';
};

const readDetailNotes = (details: string): string => {
  const marker = '\nNotes:\n';
  const index = details.indexOf(marker);
  if (index === -1) return '';
  const value = details.slice(index + marker.length).trim();
  return value && value !== 'Not provided' ? value : '';
};

export const parsePremiumLeadFeedback = (feedback: FeedbackSubmission): PremiumLeadSummary => {
  const details = feedback.details ?? '';
  const organization = feedback.team_workspace?.trim()
    || readDetailField(details, 'Organization')
    || feedback.subject.slice(PREMIUM_LEAD_SUBJECT_PREFIX.length).trim();
  return {
    id: feedback.id,
    name: readDetailField(details, 'Name') || 'Unknown',
    email: feedback.contact_email?.trim() || '',
    organization: organization || 'Unknown',
    role: readDetailField(details, 'Role') || 'Unknown',
    teamCount: readDetailField(details, 'Teams'),
    notes: readDetailNotes(details),
    status: feedback.status,
    submittedAt: feedback.created_at,
    pageUrl: feedback.page_url ?? '',
    browser: feedback.browser ?? ''
  };
};

export const derivePremiumLeads = (feedback: FeedbackSubmission[]): PremiumLeadSummary[] =>
  feedback.filter(isPremiumLeadFeedback).map(parsePremiumLeadFeedback);
