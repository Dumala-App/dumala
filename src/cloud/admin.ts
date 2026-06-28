import type { SupabaseClient } from '@supabase/supabase-js';
import type { DumalaSupabaseClient } from './client';
import { getSession } from './auth';

export type AppAdminRole = 'owner' | 'support' | 'fprds_reviewer' | 'billing';
export type FeedbackStatus = 'new' | 'triaged' | 'planned' | 'in_progress' | 'resolved' | 'closed';
export type FeedbackCategory = 'improvement' | 'suggestion' | 'bug' | 'usability_issue' | 'feature_request' | 'other';
export type FeedbackUrgency = 'low' | 'normal' | 'high' | 'blocking';
export type FprdsBetaReviewStatus = 'pending' | 'accepted' | 'excluded' | 'needs_followup';
export type BillingProvider = 'stripe' | 'paypal' | 'manual' | 'other';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'paused' | 'canceled' | 'incomplete';

export interface AppAdminProfile {
  user_id: string;
  role: AppAdminRole;
  granted_at: string;
  revoked_at?: string | null;
}

export interface AppUsageEvent {
  id: string;
  user_id?: string | null;
  club_id?: string | null;
  session_id?: string | null;
  event_type: string;
  view_name?: string | null;
  feature_name?: string | null;
  app_version?: string | null;
  device_type?: string | null;
  browser_family?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AppSession {
  session_id: string;
  user_id?: string | null;
  club_id?: string | null;
  started_at: string;
  last_seen_at: string;
  current_view?: string | null;
  app_version?: string | null;
  device_type?: string | null;
  browser_family?: string | null;
}

export interface FeedbackSubmission {
  id: string;
  user_id?: string | null;
  club_id?: string | null;
  category: FeedbackCategory;
  affected_area: string;
  urgency: FeedbackUrgency;
  subject: string;
  details: string;
  expected_behavior?: string | null;
  contact_email?: string | null;
  page_url?: string | null;
  browser?: string | null;
  team_workspace?: string | null;
  status: FeedbackStatus;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackSubmissionInput {
  clubId?: string | null;
  category: FeedbackCategory;
  affectedArea: string;
  urgency: FeedbackUrgency;
  subject: string;
  details: string;
  expectedBehavior?: string | null;
  contactEmail?: string | null;
  pageUrl?: string | null;
  browser?: string | null;
  teamWorkspace?: string | null;
}

export interface FprdsBetaSubmission {
  id: string;
  club_id?: string | null;
  assessment_session_id?: string | null;
  source_assessment_ref: string;
  submitted_by?: string | null;
  submitted_at: string;
  withdrawn_at?: string | null;
  player_anonymous_id: string;
  player_age_at_assessment?: number | null;
  age_group: 'u12' | 'u15' | 'u18' | 'adult';
  role: 'st' | 'w' | 'cm' | 'cdm' | 'fb' | 'cb' | 'gk';
  assessment_type: 'full' | 'quick';
  benchmark_version: string;
  weighting_version: string;
  scoring_algorithm_version: string;
  raw_results: Record<string, unknown>;
  attribute_scores: Record<string, unknown>;
  ovr?: number | null;
  venue_context: Record<string, unknown>;
  coach_confidence?: number | null;
  coach_notes?: string | null;
  consent_version: string;
  consented_at: string;
  review_status: FprdsBetaReviewStatus;
  exclusion_reason?: string | null;
  reviewer_notes?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FprdsBetaSubmissionInput {
  clubId?: string | null;
  assessmentId: string;
  playerId: string;
  playerAgeAtAssessment?: number | null;
  ageGroup: 'U12' | 'U15' | 'U18' | 'Adult';
  role: 'ST' | 'W' | 'CM' | 'CDM' | 'FB' | 'CB' | 'GK';
  assessmentType: 'Full' | 'Quick';
  rawResults: Record<string, unknown>;
  attributeScores: Record<string, number>;
  ovr: number;
  venueContext: {
    surface: 'grass' | 'artificial' | 'indoor' | 'other';
    timingMethod: 'manual' | 'electronic' | 'mixed';
    conditions: 'dry' | 'wet' | 'indoor' | 'unknown';
  };
  coachConfidence: number;
  coachNotes?: string | null;
  consentVersion: string;
}

export interface FprdsBetaReviewInput {
  reviewStatus: FprdsBetaReviewStatus;
  reviewerNotes?: string | null;
  exclusionReason?: string | null;
}

export interface BillingCustomer {
  id: string;
  club_id?: string | null;
  user_id?: string | null;
  provider: BillingProvider;
  provider_customer_id: string;
  email?: string | null;
  name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionRecord {
  id: string;
  billing_customer_id?: string | null;
  club_id?: string | null;
  provider: BillingProvider;
  provider_subscription_id?: string | null;
  plan_code: string;
  status: SubscriptionStatus;
  trial_ends_at?: string | null;
  current_period_ends_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminConsoleSnapshot {
  admin: AppAdminProfile;
  usageEvents: AppUsageEvent[];
  activeSessions: AppSession[];
  feedback: FeedbackSubmission[];
  fprdsSubmissions: FprdsBetaSubmission[];
  billingCustomers: BillingCustomer[];
  subscriptions: SubscriptionRecord[];
}

export interface UsageEventInput {
  eventType: string;
  clubId?: string | null;
  sessionId?: string | null;
  viewName?: string | null;
  featureName?: string | null;
  appVersion?: string | null;
  deviceType?: string | null;
  browserFamily?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AppSessionHeartbeatInput {
  sessionId: string;
  clubId?: string | null;
  currentView?: string | null;
  appVersion?: string | null;
  deviceType?: string | null;
  browserFamily?: string | null;
  metadata?: Record<string, unknown>;
}

const asUntypedClient = (client: DumalaSupabaseClient): SupabaseClient => client as unknown as SupabaseClient;

const getErrorMessage = (error: unknown) => {
  if (!error) return 'Unknown Supabase error.';
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message);
  return String(error);
};

export class CloudAdminError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'CloudAdminError';
  }
}

const expectNoError = <Data>(
  result: { data: Data; error: unknown },
  code: string,
  message: string
): Data => {
  if (result.error) throw new CloudAdminError(`${message}: ${getErrorMessage(result.error)}`, code, result.error);
  return result.data;
};

const requireSignedInUserId = async (client: DumalaSupabaseClient): Promise<string> => {
  const state = await getSession(client);
  if (state.status !== 'signedIn') {
    throw new CloudAdminError('Sign in before opening the Dumala Admin Console.', 'ADMIN_SIGN_IN_REQUIRED');
  }
  return state.session.userId;
};

const createAnonymousReference = async (userId: string, kind: 'player' | 'assessment', sourceId: string) => {
  const bytes = new TextEncoder().encode(`dumala-fprds-beta:${kind}:${userId}:${sourceId}`);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
};

export const getCurrentAppAdmin = async (client: DumalaSupabaseClient): Promise<AppAdminProfile | null> => {
  const userId = await requireSignedInUserId(client);
  const supabase = asUntypedClient(client);
  const data = expectNoError(
    await supabase
      .from('app_admins')
      .select('user_id, role, granted_at, revoked_at')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .maybeSingle(),
    'APP_ADMIN_READ_FAILED',
    'Failed to check app admin access'
  );

  return data as AppAdminProfile | null;
};

export const getAdminConsoleSnapshot = async (client: DumalaSupabaseClient): Promise<AdminConsoleSnapshot> => {
  const admin = await getCurrentAppAdmin(client);
  if (!admin) {
    throw new CloudAdminError('This account is not listed in app_admins.', 'APP_ADMIN_ACCESS_DENIED');
  }

  const supabase = asUntypedClient(client);
  const [
    usageEvents,
    activeSessions,
    feedback,
    fprdsSubmissions,
    billingCustomers,
    subscriptions
  ] = await Promise.all([
    supabase.from('app_usage_events').select('*').order('created_at', { ascending: false }).limit(250),
    supabase.from('app_sessions').select('*').order('last_seen_at', { ascending: false }).limit(100),
    supabase.from('feedback_submissions').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('fprds_beta_submissions').select('*').order('submitted_at', { ascending: false }).limit(100),
    supabase.from('billing_customers').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('subscriptions').select('*').order('created_at', { ascending: false }).limit(100)
  ]);

  return {
    admin,
    usageEvents: expectNoError(usageEvents, 'APP_USAGE_READ_FAILED', 'Failed to read usage events') as AppUsageEvent[],
    activeSessions: expectNoError(activeSessions, 'APP_SESSIONS_READ_FAILED', 'Failed to read app sessions') as AppSession[],
    feedback: expectNoError(feedback, 'FEEDBACK_READ_FAILED', 'Failed to read feedback') as FeedbackSubmission[],
    fprdsSubmissions: expectNoError(fprdsSubmissions, 'FPRDS_BETA_READ_FAILED', 'Failed to read FPRDS beta submissions') as FprdsBetaSubmission[],
    billingCustomers: expectNoError(billingCustomers, 'BILLING_CUSTOMERS_READ_FAILED', 'Failed to read billing customers') as BillingCustomer[],
    subscriptions: expectNoError(subscriptions, 'SUBSCRIPTIONS_READ_FAILED', 'Failed to read subscriptions') as SubscriptionRecord[]
  };
};

export const recordAppUsageEvent = async (
  client: DumalaSupabaseClient,
  input: UsageEventInput
): Promise<void> => {
  const state = await getSession(client).catch(() => ({ status: 'signedOut' as const }));
  const userId = state.status === 'signedIn' ? state.session.userId : null;
  const supabase = asUntypedClient(client);

  expectNoError(
    await supabase.from('app_usage_events').insert({
      user_id: userId,
      club_id: input.clubId ?? null,
      session_id: input.sessionId ?? null,
      event_type: input.eventType,
      view_name: input.viewName ?? null,
      feature_name: input.featureName ?? null,
      app_version: input.appVersion ?? null,
      device_type: input.deviceType ?? null,
      browser_family: input.browserFamily ?? null,
      metadata: input.metadata ?? {}
    }),
    'APP_USAGE_WRITE_FAILED',
    'Failed to record usage event'
  );
};

export const recordAppSessionHeartbeat = async (
  client: DumalaSupabaseClient,
  input: AppSessionHeartbeatInput
): Promise<void> => {
  const state = await getSession(client).catch(() => ({ status: 'signedOut' as const }));
  const userId = state.status === 'signedIn' ? state.session.userId : null;
  const supabase = asUntypedClient(client);

  expectNoError(
    await supabase.from('app_sessions').upsert({
      session_id: input.sessionId,
      user_id: userId,
      club_id: input.clubId ?? null,
      last_seen_at: new Date().toISOString(),
      current_view: input.currentView ?? null,
      app_version: input.appVersion ?? null,
      device_type: input.deviceType ?? null,
      browser_family: input.browserFamily ?? null,
      metadata: input.metadata ?? {}
    }, { onConflict: 'session_id' }),
    'APP_SESSION_HEARTBEAT_FAILED',
    'Failed to record app session heartbeat'
  );
};

export const createFeedbackSubmission = async (
  client: DumalaSupabaseClient,
  input: FeedbackSubmissionInput
): Promise<FeedbackSubmission> => {
  const state = await getSession(client).catch(() => ({ status: 'signedOut' as const }));
  const userId = state.status === 'signedIn' ? state.session.userId : null;
  const supabase = asUntypedClient(client);

  return expectNoError(
    await supabase
      .from('feedback_submissions')
      .insert({
        user_id: userId,
        club_id: input.clubId ?? null,
        category: input.category,
        affected_area: input.affectedArea,
        urgency: input.urgency,
        subject: input.subject,
        details: input.details,
        expected_behavior: input.expectedBehavior ?? null,
        contact_email: input.contactEmail ?? null,
        page_url: input.pageUrl ?? null,
        browser: input.browser ?? null,
        team_workspace: input.teamWorkspace ?? null
      })
      .select('*')
      .single(),
    'FEEDBACK_CREATE_FAILED',
    'Failed to create feedback'
  ) as FeedbackSubmission;
};

export const updateFeedbackSubmission = async (
  client: DumalaSupabaseClient,
  feedbackId: string,
  values: { status?: FeedbackStatus; adminNotes?: string | null }
): Promise<FeedbackSubmission> => {
  const update: Record<string, string | null> = {};
  if (values.status) update.status = values.status;
  if ('adminNotes' in values) update.admin_notes = values.adminNotes ?? null;

  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase
      .from('feedback_submissions')
      .update(update)
      .eq('id', feedbackId)
      .select('*')
      .single(),
    'FEEDBACK_UPDATE_FAILED',
    'Failed to update feedback'
  ) as FeedbackSubmission;
};

export const findMyFprdsBetaSubmission = async (
  client: DumalaSupabaseClient,
  assessmentId: string
): Promise<FprdsBetaSubmission | null> => {
  const userId = await requireSignedInUserId(client);
  const sourceAssessmentRef = await createAnonymousReference(userId, 'assessment', assessmentId);
  const supabase = asUntypedClient(client);

  return expectNoError(
    await supabase
      .from('fprds_beta_submissions')
      .select('*')
      .eq('submitted_by', userId)
      .eq('source_assessment_ref', sourceAssessmentRef)
      .is('withdrawn_at', null)
      .maybeSingle(),
    'FPRDS_BETA_STATUS_FAILED',
    'Failed to check FPRDS beta submission status'
  ) as FprdsBetaSubmission | null;
};

export const createFprdsBetaSubmission = async (
  client: DumalaSupabaseClient,
  input: FprdsBetaSubmissionInput
): Promise<FprdsBetaSubmission> => {
  const userId = await requireSignedInUserId(client);
  const [playerAnonymousId, sourceAssessmentRef] = await Promise.all([
    createAnonymousReference(userId, 'player', input.playerId),
    createAnonymousReference(userId, 'assessment', input.assessmentId)
  ]);
  const supabase = asUntypedClient(client);

  return expectNoError(
    await supabase
      .from('fprds_beta_submissions')
      .insert({
        club_id: input.clubId ?? null,
        assessment_session_id: null,
        source_assessment_ref: sourceAssessmentRef,
        submitted_by: userId,
        player_anonymous_id: playerAnonymousId,
        player_age_at_assessment: input.playerAgeAtAssessment ?? null,
        age_group: input.ageGroup.toLowerCase(),
        role: input.role.toLowerCase(),
        assessment_type: input.assessmentType.toLowerCase(),
        benchmark_version: 'fprds-beta-1',
        weighting_version: 'fprds-beta-1',
        scoring_algorithm_version: 'fprds-beta-1',
        raw_results: input.rawResults,
        attribute_scores: input.attributeScores,
        ovr: input.ovr,
        venue_context: {
          surface: input.venueContext.surface,
          timing_method: input.venueContext.timingMethod,
          conditions: input.venueContext.conditions
        },
        coach_confidence: input.coachConfidence,
        coach_notes: input.coachNotes ?? null,
        consent_version: input.consentVersion,
        consented_at: new Date().toISOString()
      })
      .select('*')
      .single(),
    'FPRDS_BETA_CREATE_FAILED',
    'Failed to submit FPRDS beta results'
  ) as FprdsBetaSubmission;
};

export const updateFprdsBetaSubmissionReview = async (
  client: DumalaSupabaseClient,
  submissionId: string,
  input: FprdsBetaReviewInput
): Promise<FprdsBetaSubmission> => {
  const reviewerId = await requireSignedInUserId(client);
  if (input.reviewStatus === 'excluded' && !input.exclusionReason?.trim()) {
    throw new CloudAdminError('An exclusion reason is required.', 'FPRDS_BETA_EXCLUSION_REASON_REQUIRED');
  }

  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase
      .from('fprds_beta_submissions')
      .update({
        review_status: input.reviewStatus,
        reviewer_notes: input.reviewerNotes?.trim() || null,
        exclusion_reason: input.reviewStatus === 'excluded' ? input.exclusionReason?.trim() || null : null,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', submissionId)
      .select('*')
      .single(),
    'FPRDS_BETA_REVIEW_FAILED',
    'Failed to update FPRDS beta review'
  ) as FprdsBetaSubmission;
};
