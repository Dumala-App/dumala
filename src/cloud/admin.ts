import type { SupabaseClient } from '@supabase/supabase-js';
import type { DumalaSupabaseClient } from './client';
import type { BetaDrillResultInput } from '../fprds/betaDrillResults';
import { CURRENT_BENCHMARK_VERSION, CURRENT_SCORING_VERSION, CURRENT_WEIGHTING_VERSION } from '../fprds/benchmarks';
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

export interface AdminMetricCount {
  key: string;
  count: number;
}

export interface AdminRoleCount {
  role: AppAdminRole;
  count: number;
}

export interface AdminAuditEvent {
  id: string;
  actorUserId?: string | null;
  actorRole?: AppAdminRole | null;
  eventType: string;
  targetTable?: string | null;
  targetId?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AdminUserSummary {
  userId: string;
  role: AppAdminRole;
  grantedAt: string;
  revokedAt?: string | null;
  notes?: string | null;
}

export interface AdminSecurityMetrics {
  currentAdmin: {
    userId: string;
    role: AppAdminRole;
    assuranceLevel?: string | null;
    mfaVerified: boolean;
    grantedAt: string;
  };
  adminCountsByRole: AdminRoleCount[];
  admins: AdminUserSummary[];
  deniedAccessCount: number;
  recentAuditEvents: AdminAuditEvent[];
  activeSessionsNow: number;
  lastOwnerLoginAt?: string | null;
  warnings: string[];
}

export interface AdminProductMetrics {
  activeUsersNow: number;
  eventsLast24h: number;
  topTabs: AdminMetricCount[];
  leastUsedTabs: AdminMetricCount[];
  deviceBreakdown: AdminMetricCount[];
  browserBreakdown: AdminMetricCount[];
  feedback: {
    total: number;
    open: number;
    highPriority: number;
    byArea: AdminMetricCount[];
  };
  fprds: {
    pending: number;
    accepted: number;
    excluded: number;
    byAgeGroup: AdminMetricCount[];
  };
  billing: {
    customers: number;
    subscriptions: number;
    activeOrTrial: number;
    failedWebhookEvents: number;
  };
}

export interface AdminRecentUserSummary {
  userId: string;
  displayName?: string | null;
  email?: string | null;
  accountState: string;
  createdAt: string;
  lastActiveAt?: string | null;
  workspaceCount: number;
  deviceCount: number;
  feedbackCount: number;
  fprdsCount: number;
}

export interface AdminWorkspaceSummary {
  clubId: string;
  name: string;
  ownerUserId: string;
  memberCount: number;
  eventCount: number;
  feedbackCount: number;
  fprdsCount: number;
  lastActiveAt?: string | null;
}

export interface AdminRecoverableWorkspace {
  clubId: string;
  name: string;
  ownerUserId: string;
  ownerEmail?: string | null;
  state: 'active' | 'pending_deletion' | 'deleted';
  memberCount: number;
  lastActiveAt?: string | null;
  pendingDeletionAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStorageTableMetric {
  tableName: string;
  rowEstimate: number;
  totalBytes: number;
  tableBytes: number;
  indexBytes: number;
  totalPercent: number;
}

export interface AdminStorageTrendPoint {
  date: string;
  totalBytes: number;
  tableBytes: number;
  indexBytes: number;
  topTables: AdminStorageTableMetric[];
}

export interface AdminStorageMetrics {
  totalBytes: number;
  tableBytes: number;
  indexBytes: number;
  tables: AdminStorageTableMetric[];
  trend: AdminStorageTrendPoint[];
  warnings: string[];
}

export interface AdminDuplicateFeedbackGroup {
  fingerprint: string;
  count: number;
  latestAt: string;
  sampleSubject: string;
}

export interface AdminRoadmapCandidate {
  area: string;
  category: string;
  count: number;
  highPriorityCount: number;
  latestAt: string;
}

export interface AdminGrowthMetrics {
  windowDays: number;
  users: {
    total: number;
    newToday: number;
    new7d: number;
    new30d: number;
    active7d: number;
    active30d: number;
    pendingDeletion: number;
    deleted: number;
  };
  workspaces: {
    total: number;
    active: number;
    pendingDeletion: number;
    deleted: number;
    new30d: number;
  };
  engagement: {
    dau: number;
    wau: number;
    mau: number;
    avgSessionMinutes: number;
    activeSessionsNow: number;
  };
  topWorkspaces: AdminWorkspaceSummary[];
  recentUsers: AdminRecentUserSummary[];
  feedbackIntelligence: {
    duplicateGroups: AdminDuplicateFeedbackGroup[];
    roadmapCandidates: AdminRoadmapCandidate[];
  };
  fprdsAnalytics: {
    averageOvr?: number | null;
    averageCoachConfidence?: number | null;
    pendingOlderThan7d: number;
    byRole: Array<{ key: string; count: number; avgOvr?: number | null }>;
    byAssessmentType: AdminMetricCount[];
  };
  billingReadiness: {
    customers: number;
    subscriptions: number;
    activeOrTrial: number;
    pastDue: number;
    failedWebhookEvents: number;
    ledgerEntries: number;
    ledgerAmountDue: number;
    ledgerAmountPaid: number;
  };
  exports: {
    recentExportCount: number;
    recentExports: Array<{
      id: string;
      actorUserId?: string | null;
      actorRole?: AppAdminRole | null;
      metadata: Record<string, unknown>;
      createdAt: string;
    }>;
  };
  alerts: string[];
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
  benchmarkVersion?: string;
  drillResults?: BetaDrillResultInput[];
}

export interface FprdsBetaReviewInput {
  reviewStatus: FprdsBetaReviewStatus;
  reviewerNotes?: string | null;
  exclusionReason?: string | null;
}

export type FprdsBenchmarkReviewDecision = 'accept' | 'change_requested' | 'inconclusive';
export type FprdsBenchmarkCorrectionStatus = 'proposed' | 'accepted' | 'rejected' | 'deferred';

export interface FprdsBenchmarkAnalysisRow {
  drillId: string;
  attributeId: string;
  ageGroup: string;
  role: string;
  assessmentType: string;
  benchmarkVersion: string;
  unit: string;
  sampleSize: number;
  clubCount: number;
  min: number | null;
  max: number | null;
  avg: number | null;
  p10: number | null;
  p25: number | null;
  median: number | null;
  p75: number | null;
  p90: number | null;
  avgScore: number | null;
  tierDistribution: Record<string, number>;
}

export interface FprdsBenchmarkReview {
  id: string;
  drill_id: string;
  attribute_id: string;
  age_group: string;
  role?: string | null;
  benchmark_version: string;
  sample_size: number;
  distribution_summary: Record<string, unknown>;
  review_decision: FprdsBenchmarkReviewDecision;
  reviewer_notes?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FprdsBenchmarkReviewInput {
  drillId: string;
  attributeId: string;
  ageGroup: string;
  role?: string | null;
  benchmarkVersion: string;
  sampleSize: number;
  distributionSummary?: Record<string, unknown>;
  reviewDecision: FprdsBenchmarkReviewDecision;
  reviewerNotes?: string | null;
}

export interface FprdsBenchmarkCorrection {
  id: string;
  review_id?: string | null;
  drill_id: string;
  attribute_id: string;
  age_group: string;
  role?: string | null;
  tier_label: string;
  current_raw_best?: number | null;
  current_raw_worst?: number | null;
  proposed_raw_best?: number | null;
  proposed_raw_worst?: number | null;
  rationale: string;
  status: FprdsBenchmarkCorrectionStatus;
  target_benchmark_version?: string | null;
  created_by?: string | null;
  decided_by?: string | null;
  decided_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FprdsBenchmarkCorrectionInput {
  reviewId?: string | null;
  drillId: string;
  attributeId: string;
  ageGroup: string;
  role?: string | null;
  tierLabel: string;
  currentRawBest?: number | null;
  currentRawWorst?: number | null;
  proposedRawBest?: number | null;
  proposedRawWorst?: number | null;
  rationale: string;
  targetBenchmarkVersion?: string | null;
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
  productMetrics?: AdminProductMetrics | null;
  securityMetrics?: AdminSecurityMetrics | null;
  growthMetrics?: AdminGrowthMetrics | null;
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
    throw new CloudAdminError('Account is not authorized.', 'APP_ADMIN_ACCESS_DENIED');
  }

  const supabase = asUntypedClient(client);
  const canReadProduct = admin.role === 'owner' || admin.role === 'support';
  const canReadFprds = admin.role === 'owner' || admin.role === 'fprds_reviewer';
  const canReadBilling = admin.role === 'owner' || admin.role === 'billing';
  const emptyResult = { data: [], error: null };
  const emptyMetrics = { data: null, error: null };

  const [usageEvents, activeSessions, feedback] = canReadProduct
    ? await Promise.all([
        supabase.from('app_usage_events').select('*').order('created_at', { ascending: false }).limit(250),
        supabase.from('app_sessions').select('*').order('last_seen_at', { ascending: false }).limit(100),
        supabase.from('feedback_submissions').select('*').order('created_at', { ascending: false }).limit(100)
      ])
    : [emptyResult, emptyResult, emptyResult];

  const fprdsSubmissions = canReadFprds
    ? await supabase.from('fprds_beta_submissions').select('*').order('submitted_at', { ascending: false }).limit(100)
    : emptyResult;

  const [billingCustomers, subscriptions] = canReadBilling
    ? await Promise.all([
        supabase.from('billing_customers').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('subscriptions').select('*').order('created_at', { ascending: false }).limit(100)
      ])
    : [emptyResult, emptyResult];

  const productMetrics = admin.role === 'owner'
    ? await supabase.rpc('get_admin_product_metrics_v1', { days: 30 })
    : emptyMetrics;

  return {
    admin,
    usageEvents: expectNoError(usageEvents, 'APP_USAGE_READ_FAILED', 'Failed to read usage events') as AppUsageEvent[],
    activeSessions: expectNoError(activeSessions, 'APP_SESSIONS_READ_FAILED', 'Failed to read app sessions') as AppSession[],
    feedback: expectNoError(feedback, 'FEEDBACK_READ_FAILED', 'Failed to read feedback') as FeedbackSubmission[],
    fprdsSubmissions: expectNoError(fprdsSubmissions, 'FPRDS_BETA_READ_FAILED', 'Failed to read FPRDS beta submissions') as FprdsBetaSubmission[],
    billingCustomers: expectNoError(billingCustomers, 'BILLING_CUSTOMERS_READ_FAILED', 'Failed to read billing customers') as BillingCustomer[],
    subscriptions: expectNoError(subscriptions, 'SUBSCRIPTIONS_READ_FAILED', 'Failed to read subscriptions') as SubscriptionRecord[],
    productMetrics: expectNoError(productMetrics, 'ADMIN_PRODUCT_METRICS_READ_FAILED', 'Failed to read product metrics') as AdminProductMetrics | null
  };
};

export const getAdminSecurityMetrics = async (
  client: DumalaSupabaseClient,
  days = 30
): Promise<AdminSecurityMetrics> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.rpc('get_admin_security_metrics_v1', { days }),
    'ADMIN_SECURITY_METRICS_READ_FAILED',
    'Failed to read admin security metrics'
  ) as AdminSecurityMetrics;
};

export const getAdminGrowthMetrics = async (
  client: DumalaSupabaseClient,
  days = 30
): Promise<AdminGrowthMetrics> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.rpc('get_admin_growth_metrics_v1', { days }),
    'ADMIN_GROWTH_METRICS_READ_FAILED',
    'Failed to read admin growth metrics'
  ) as AdminGrowthMetrics;
};

export interface ActivationFunnelStep {
  step: string;
  users: number;
  workspaces: number;
}

export const getAdminActivationFunnel = async (
  client: DumalaSupabaseClient,
  days = 30
): Promise<ActivationFunnelStep[]> => {
  const supabase = asUntypedClient(client);
  const data = expectNoError(
    await supabase.rpc('get_activation_funnel_v1', { days }),
    'ADMIN_ACTIVATION_FUNNEL_READ_FAILED',
    'Failed to read activation funnel'
  );
  return (data as ActivationFunnelStep[] | null) ?? [];
};

export const listAdminRecoverableWorkspaces = async (
  client: DumalaSupabaseClient,
  days = 365
): Promise<AdminRecoverableWorkspace[]> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.rpc('list_admin_recoverable_workspaces_v1', { days }),
    'ADMIN_RECOVERABLE_WORKSPACES_READ_FAILED',
    'Failed to read recoverable workspaces'
  ) as AdminRecoverableWorkspace[];
};

export const restoreAdminWorkspace = async (
  client: DumalaSupabaseClient,
  clubId: string
): Promise<AdminRecoverableWorkspace> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.rpc('restore_admin_workspace_v1', { target_club_id: clubId }),
    'ADMIN_WORKSPACE_RESTORE_FAILED',
    'Failed to restore workspace'
  ) as AdminRecoverableWorkspace;
};

export const getAdminStorageMetrics = async (
  client: DumalaSupabaseClient,
  days = 30
): Promise<AdminStorageMetrics> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.rpc('get_admin_storage_metrics_v1', { days }),
    'ADMIN_STORAGE_METRICS_READ_FAILED',
    'Failed to read database storage metrics'
  ) as AdminStorageMetrics;
};

export const recordAdminAuditEvent = async (
  client: DumalaSupabaseClient,
  eventType: string,
  metadata: Record<string, unknown> = {}
): Promise<void> => {
  const supabase = asUntypedClient(client);
  expectNoError(
    await supabase.rpc('record_admin_audit', {
      event_type: eventType,
      target_table: null,
      target_id: null,
      metadata
    }),
    'ADMIN_AUDIT_WRITE_FAILED',
    'Failed to record admin audit event'
  );
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

  const submission = expectNoError(
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
        benchmark_version: input.benchmarkVersion || CURRENT_BENCHMARK_VERSION,
        weighting_version: CURRENT_WEIGHTING_VERSION,
        scoring_algorithm_version: CURRENT_SCORING_VERSION,
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

  // Fan out per-drill rows for benchmark distribution analysis. These enrich the
  // review dataset; a failure here must not undo the accepted submission, which
  // is unique per (user, assessment) and cannot simply be retried.
  if (input.drillResults && input.drillResults.length > 0) {
    try {
      const rows = input.drillResults.map(result => ({
        submission_id: submission.id,
        drill_id: result.drillId,
        attribute_id: result.attributeId,
        raw_value: result.rawValue,
        unit: result.unit,
        score: result.score,
        benchmark_band: result.benchmarkBand ?? {}
      }));
      await supabase.from('fprds_beta_drill_results').insert(rows);
    } catch {
      // Best effort: the submission is saved even if drill rows fail to persist.
    }
  }

  return submission;
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

export const getFprdsBenchmarkAnalysis = async (
  client: DumalaSupabaseClient,
  minSample = 1
): Promise<FprdsBenchmarkAnalysisRow[]> => {
  const supabase = asUntypedClient(client);
  const data = expectNoError(
    await supabase.rpc('get_fprds_benchmark_analysis_v1', { min_sample: minSample }),
    'FPRDS_BENCHMARK_ANALYSIS_FAILED',
    'Failed to load FPRDS benchmark analysis'
  );
  return (data as FprdsBenchmarkAnalysisRow[] | null) ?? [];
};

export const listFprdsBenchmarkReviews = async (
  client: DumalaSupabaseClient
): Promise<FprdsBenchmarkReview[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase
      .from('fprds_benchmark_reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200),
    'FPRDS_BENCHMARK_REVIEWS_READ_FAILED',
    'Failed to load benchmark reviews'
  ) as FprdsBenchmarkReview[] | null) ?? [];
};

export const createFprdsBenchmarkReview = async (
  client: DumalaSupabaseClient,
  input: FprdsBenchmarkReviewInput
): Promise<FprdsBenchmarkReview> => {
  const userId = await requireSignedInUserId(client);
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase
      .from('fprds_benchmark_reviews')
      .insert({
        drill_id: input.drillId,
        attribute_id: input.attributeId,
        age_group: input.ageGroup.toLowerCase(),
        role: input.role ? input.role.toLowerCase() : null,
        benchmark_version: input.benchmarkVersion,
        sample_size: Math.max(0, Math.round(input.sampleSize)),
        distribution_summary: input.distributionSummary ?? {},
        review_decision: input.reviewDecision,
        reviewer_notes: input.reviewerNotes?.trim() || null,
        created_by: userId
      })
      .select('*')
      .single(),
    'FPRDS_BENCHMARK_REVIEW_CREATE_FAILED',
    'Failed to record benchmark review'
  ) as FprdsBenchmarkReview;
};

export const listFprdsBenchmarkCorrections = async (
  client: DumalaSupabaseClient
): Promise<FprdsBenchmarkCorrection[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase
      .from('fprds_benchmark_corrections')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200),
    'FPRDS_BENCHMARK_CORRECTIONS_READ_FAILED',
    'Failed to load benchmark corrections'
  ) as FprdsBenchmarkCorrection[] | null) ?? [];
};

export const createFprdsBenchmarkCorrection = async (
  client: DumalaSupabaseClient,
  input: FprdsBenchmarkCorrectionInput
): Promise<FprdsBenchmarkCorrection> => {
  const userId = await requireSignedInUserId(client);
  if (!input.rationale?.trim()) {
    throw new CloudAdminError('A rationale is required for a benchmark correction.', 'FPRDS_BENCHMARK_CORRECTION_RATIONALE_REQUIRED');
  }

  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase
      .from('fprds_benchmark_corrections')
      .insert({
        review_id: input.reviewId ?? null,
        drill_id: input.drillId,
        attribute_id: input.attributeId,
        age_group: input.ageGroup.toLowerCase(),
        role: input.role ? input.role.toLowerCase() : null,
        tier_label: input.tierLabel,
        current_raw_best: input.currentRawBest ?? null,
        current_raw_worst: input.currentRawWorst ?? null,
        proposed_raw_best: input.proposedRawBest ?? null,
        proposed_raw_worst: input.proposedRawWorst ?? null,
        rationale: input.rationale.trim(),
        target_benchmark_version: input.targetBenchmarkVersion?.trim() || null,
        created_by: userId
      })
      .select('*')
      .single(),
    'FPRDS_BENCHMARK_CORRECTION_CREATE_FAILED',
    'Failed to record benchmark correction'
  ) as FprdsBenchmarkCorrection;
};

export const updateFprdsBenchmarkCorrectionStatus = async (
  client: DumalaSupabaseClient,
  correctionId: string,
  status: FprdsBenchmarkCorrectionStatus
): Promise<FprdsBenchmarkCorrection> => {
  const userId = await requireSignedInUserId(client);
  const supabase = asUntypedClient(client);
  const decided = status === 'proposed';
  return expectNoError(
    await supabase
      .from('fprds_benchmark_corrections')
      .update({
        status,
        decided_by: decided ? null : userId,
        decided_at: decided ? null : new Date().toISOString()
      })
      .eq('id', correctionId)
      .select('*')
      .single(),
    'FPRDS_BENCHMARK_CORRECTION_UPDATE_FAILED',
    'Failed to update benchmark correction'
  ) as FprdsBenchmarkCorrection;
};
