import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  AppWindow,
  Ban,
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  CreditCard,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileText,
  FlaskConical,
  Gauge,
  KeyRound,
  Loader2,
  LockKeyhole,
  LogOut,
  Megaphone,
  MessageSquare,
  Pencil,
  RefreshCcw,
  Rocket,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tag,
  Trash2,
  Trophy,
  UserCog,
  UsersRound,
  Volume2,
  VolumeX,
  Wifi
} from 'lucide-react';
import { useCloudAuth } from '../hooks/useCloudAuth';
import { useCloudRuntime } from '../hooks/useCloudRuntime';
import type {
  AdminConsoleSnapshot,
  AdminGrowthMetrics,
  AdminManagedUser,
  AdminProductMetrics,
  AdminRecoverableWorkspace,
  AdminSecurityMetrics,
  AdminStorageMetrics,
  AppAdminProfile,
  AppSession,
  AppUsageEvent,
  FeedbackStatus,
  FeedbackSubmission,
  FprdsBetaReviewStatus,
  FprdsBetaSubmission,
  FprdsBenchmarkAnalysisRow,
  FprdsBenchmarkReview,
  FprdsBenchmarkReviewDecision,
  FprdsBenchmarkCorrection,
  FprdsBenchmarkCorrectionInput,
  FprdsBenchmarkCorrectionStatus,
  ActivationFunnelStep
} from '../cloud/admin';
import type {
  AnnouncementInput,
  AnnouncementKind,
  AnnouncementRecord,
  PromotionDiscountType,
  PromotionInput,
  PromotionRecord
} from '../cloud/marketing';
import type {
  AccountPersona,
  LeagueAccessRequestRecord,
  LeagueAccessRequestStatus
} from '../cloud/identity';
import { LEAGUE_PILOT_ENTITLEMENT } from '../cloud/identity';
import { PLAN_OPTIONS } from '../billing/plans';
import { derivePremiumLeads, isPremiumLeadFeedback, type PremiumLeadSummary } from '../landing/premiumLeadCapture';
import type { MfaChallenge, MfaFactor, TotpEnrollment } from '../cloud/auth';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import CloudAccountGate from './CloudAccountGate';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { DARK_GLASS_THEME, type DarkGlassThemeId } from '../theme/darkGlassTheme';

type AdminTab = 'overview' | 'access' | 'users' | 'recovery' | 'storage' | 'security' | 'usage' | 'feedback' | 'leads' | 'fprds' | 'benchmarks' | 'online' | 'billing' | 'marketing' | 'league-access' | 'exports' | 'alerts';

const ADMIN_AUTH_REDIRECT_URL = 'https://dumala.asia/?returnTo=admin';

const ADMIN_THEMES: Record<DarkGlassThemeId, typeof DARK_GLASS_THEME> = {
  'dark-glass': DARK_GLASS_THEME
};

const ADMIN_ACTIVE_THEME_ID: DarkGlassThemeId = 'dark-glass';
const ADMIN_THEME = ADMIN_THEMES[ADMIN_ACTIVE_THEME_ID];
const ADMIN_THEME_STYLE = ADMIN_THEME.style;

const adminTabs: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: 'overview', label: 'Overview', icon: Gauge },
  { id: 'access', label: 'Access', icon: AppWindow },
  { id: 'users', label: 'Users', icon: UsersRound },
  { id: 'recovery', label: 'Recovery', icon: RefreshCcw },
  { id: 'storage', label: 'Storage', icon: Database },
  { id: 'security', label: 'Security', icon: ShieldAlert },
  { id: 'usage', label: 'Usage', icon: BarChart3 },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  { id: 'leads', label: 'Premium leads', icon: Sparkles },
  { id: 'fprds', label: 'FPRDS Beta', icon: ClipboardList },
  { id: 'benchmarks', label: 'Benchmarks', icon: FlaskConical },
  { id: 'online', label: 'Online', icon: Wifi },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'league-access', label: 'League access', icon: Trophy },
  { id: 'exports', label: 'Exports', icon: Download },
  { id: 'alerts', label: 'Alerts', icon: Bell }
];

const highPrivilegeRoles = new Set<AppAdminProfile['role']>(['owner', 'billing']);

const canUseTab = (role: AppAdminProfile['role'] | undefined, tab: AdminTab) => {
  if (!role) return tab === 'overview';
  if (role === 'owner') return true;
  if (role === 'support') return ['overview', 'usage', 'feedback', 'leads', 'online'].includes(tab);
  if (role === 'fprds_reviewer') return ['overview', 'fprds', 'benchmarks'].includes(tab);
  if (role === 'billing') return ['overview', 'billing'].includes(tab);
  return tab === 'overview';
};

const roleLabel: Record<AppAdminProfile['role'], string> = {
  owner: 'Owner',
  support: 'Support',
  fprds_reviewer: 'FPRDS reviewer',
  billing: 'Billing'
};

// Plan choices come from the shared plans module so new tiers only need to be
// added in src/billing/plans.ts. Legacy codes on existing users still render
// because the plan dialog appends unknown codes to this list.
const ADMIN_PLAN_OPTIONS: Array<{ value: string; label: string }> = PLAN_OPTIONS.map(option => ({
  value: option.value,
  label: option.label
}));

const MUTE_DURATION_OPTIONS: Array<{ hours: number; label: string }> = [
  { hours: 1, label: '1 hour' },
  { hours: 8, label: '8 hours' },
  { hours: 24, label: '24 hours' },
  { hours: 72, label: '3 days' },
  { hours: 168, label: '7 days' },
  { hours: 720, label: '30 days' }
];

const isManagedUserMuted = (user: AdminManagedUser) =>
  Boolean(user.mutedUntil && new Date(user.mutedUntil).getTime() > Date.now());

const managedUserLabel = (user: AdminManagedUser) =>
  user.displayName || user.email || user.userId.slice(0, 12);

const planBadgeTone = (planCode: string) =>
  planCode === 'free'
    ? 'border-slate-300/20 bg-slate-300/10 text-slate-200'
    : 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100';

const ADMIN_PANEL_CLASS = ADMIN_THEME.classes.panel;
const ADMIN_PANEL_HEADER_CLASS = ADMIN_THEME.classes.panelHeader;
const ADMIN_SUBTLE_CARD_CLASS = ADMIN_THEME.classes.subtleCard;
const ADMIN_INPUT_CLASS = ADMIN_THEME.classes.input;
const ADMIN_SELECT_CLASS = ADMIN_THEME.classes.select;
const ADMIN_WARNING_CLASS = ADMIN_THEME.classes.warning;
const ADMIN_REVIEW_BUTTON_CLASS = ADMIN_THEME.classes.reviewButton;
const ADMIN_DIALOG_CONTENT_CLASS = ADMIN_THEME.classes.dialogContent;
const ADMIN_DIALOG_FIELD_CLASS = ADMIN_THEME.classes.dialogField;
const ADMIN_DIALOG_SELECT_CONTENT_CLASS = ADMIN_THEME.classes.dialogSelectContent;
const ADMIN_DIALOG_SELECT_ITEM_CLASS = ADMIN_THEME.classes.dialogSelectItem;
const ADMIN_DIALOG_SECONDARY_BUTTON_CLASS = ADMIN_THEME.classes.dialogSecondaryButton;
const ADMIN_DIALOG_PRIMARY_BUTTON_CLASS = ADMIN_THEME.classes.dialogPrimaryButton;
const ADMIN_SECONDARY_ACTION_BUTTON_CLASS = ADMIN_THEME.classes.secondaryActionButton;

const AdminBackdrop = () => (
  <div aria-hidden="true" className="fixed inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-[#020713]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_42%,rgba(34,211,238,0.22),transparent_26rem),radial-gradient(circle_at_18%_18%,rgba(249,115,22,0.2),transparent_23rem),linear-gradient(135deg,#020713_0%,#051325_48%,#041511_100%)]" />
    <div className="absolute left-1/2 top-1/2 h-[78vmin] w-[78vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10 bg-[conic-gradient(from_160deg,transparent,rgba(56,189,248,0.18),transparent,rgba(249,115,22,0.18),transparent)] opacity-70 blur-[1px]" />
    <div className="absolute inset-x-[-10%] bottom-[-28%] h-[58%] rotate-[-4deg] border-t border-emerald-300/20 bg-[linear-gradient(rgba(34,197,94,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.12)_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] [transform-origin:center]" />
    <div className="absolute right-6 top-8 hidden h-52 w-52 rounded-full border border-orange-300/10 lg:block" />
    <div className="absolute bottom-8 left-8 hidden h-36 w-36 rounded-full border border-emerald-300/10 lg:block" />
  </div>
);

const AdminAccessShell = ({ children }: { children: React.ReactNode }) => (
  <div className={ADMIN_THEME.classes.accessShell} style={ADMIN_THEME_STYLE}>
    <AdminBackdrop />
    <main className="relative z-10 flex min-h-screen items-center justify-center p-3 sm:p-4 lg:p-6">
      <section className={ADMIN_THEME.classes.accessPanel}>
        {children}
      </section>
    </main>
  </div>
);

const statusLabel: Record<FeedbackStatus, string> = {
  new: 'New',
  triaged: 'Triaged',
  planned: 'Planned',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed'
};

const statusTone: Record<FeedbackStatus, string> = {
  new: 'border-sky-300/25 bg-sky-300/10 text-sky-100',
  triaged: 'border-indigo-300/25 bg-indigo-300/10 text-indigo-100',
  planned: 'border-violet-300/25 bg-violet-300/10 text-violet-100',
  in_progress: 'border-amber-300/25 bg-amber-300/10 text-amber-100',
  resolved: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100',
  closed: 'border-slate-300/20 bg-slate-300/10 text-slate-200'
};

const urgencyLabel = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  blocking: 'Blocking'
} as const;

const categoryLabel = {
  improvement: 'Improvement',
  suggestion: 'Suggestion',
  bug: 'Bug',
  usability_issue: 'Usability issue',
  feature_request: 'Feature request',
  other: 'Other'
} as const;

const fprdsStatusLabel: Record<FprdsBetaReviewStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  excluded: 'Excluded',
  needs_followup: 'Needs follow-up'
};

const fprdsStatusTone: Record<FprdsBetaReviewStatus, string> = {
  pending: 'border-amber-300/25 bg-amber-300/10 text-amber-100',
  accepted: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100',
  excluded: 'border-rose-300/25 bg-rose-300/10 text-rose-100',
  needs_followup: 'border-sky-300/25 bg-sky-300/10 text-sky-100'
};

const benchmarkDecisionLabel: Record<FprdsBenchmarkReviewDecision, string> = {
  accept: 'Accept as-is',
  change_requested: 'Change requested',
  inconclusive: 'Inconclusive'
};

const benchmarkDecisionTone: Record<FprdsBenchmarkReviewDecision, string> = {
  accept: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100',
  change_requested: 'border-amber-300/25 bg-amber-300/10 text-amber-100',
  inconclusive: 'border-slate-300/20 bg-white/[0.05] text-slate-200'
};

const correctionStatusLabel: Record<FprdsBenchmarkCorrectionStatus, string> = {
  proposed: 'Proposed',
  accepted: 'Accepted',
  rejected: 'Rejected',
  deferred: 'Deferred'
};

const correctionStatusTone: Record<FprdsBenchmarkCorrectionStatus, string> = {
  proposed: 'border-amber-300/25 bg-amber-300/10 text-amber-100',
  accepted: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100',
  rejected: 'border-rose-300/25 bg-rose-300/10 text-rose-100',
  deferred: 'border-sky-300/25 bg-sky-300/10 text-sky-100'
};

const BENCHMARK_TIERS = ['Elite', 'Advanced', 'Developing', 'Below Average', 'Beginner', 'Unbanded'] as const;

const formatDrillLabel = (drillId: string) => drillId.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

const eventAgeMs = (date: string) => Date.now() - new Date(date).getTime();

const formatRelativeTime = (date: string) => {
  const diffMinutes = Math.max(0, Math.round(eventAgeMs(date) / 60000));
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

const formatDateTime = (date: string) => new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short'
}).format(new Date(date));

const formatCurrency = (value: number) => new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0
}).format(value);

const formatBytes = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const amount = value / 1024 ** index;
  return `${amount >= 10 || index === 0 ? amount.toFixed(0) : amount.toFixed(1)} ${units[index]}`;
};

const uniqueCount = (values: Array<string | null | undefined>) => new Set(values.filter(Boolean)).size;

const countBy = <RecordShape,>(items: RecordShape[], getKey: (item: RecordShape) => string | null | undefined) =>
  items.reduce<Array<{ key: string; count: number }>>((summary, item) => {
    const key = getKey(item) || 'Unknown';
    const existing = summary.find(row => row.key === key);
    if (existing) {
      existing.count += 1;
    } else {
      summary.push({ key, count: 1 });
    }
    return summary;
  }, []).sort((a, b) => b.count - a.count);

const getSettledErrorMessage = (result: PromiseSettledResult<unknown>) =>
  result.status === 'rejected'
    ? result.reason instanceof Error
      ? result.reason.message
      : String(result.reason)
    : '';

const StatTile = ({ label, value, detail }: { label: string; value: string | number; detail: string }) => (
  <div className="rounded-2xl border border-cyan-300/10 bg-white/[0.035] p-4 shadow-lg shadow-black/15 backdrop-blur-sm">
    <p className="text-[11px] font-black uppercase text-cyan-100/65">{label}</p>
    <p className="mt-2 font-display text-2xl font-black text-white">{value}</p>
    <p className="mt-1 text-xs font-medium leading-relaxed text-slate-400">{detail}</p>
  </div>
);

const Section = ({ title, icon: Icon, children }: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) => (
  <section className={ADMIN_PANEL_CLASS}>
    <div className={ADMIN_PANEL_HEADER_CLASS}>
      <Icon size={17} className="text-cyan-200" aria-hidden="true" />
      <h2 className="font-display text-sm font-black text-white">{title}</h2>
    </div>
    <div className="p-4">{children}</div>
  </section>
);

const EmptyState = ({ title, detail }: { title: string; detail: string }) => (
  <div className="rounded-2xl border border-dashed border-cyan-300/15 bg-cyan-300/[0.035] p-6 text-center">
    <p className="text-sm font-black text-slate-100">{title}</p>
    <p className="mx-auto mt-1 max-w-xl text-xs font-medium leading-relaxed text-slate-400">{detail}</p>
  </div>
);

const CompactTable = ({
  children,
  headers,
  scrollHeightClassName,
}: {
  headers: string[];
  children: React.ReactNode;
  scrollHeightClassName?: string;
}) => (
  <div
    className={`overflow-x-auto rounded-2xl border border-cyan-300/10 bg-[#07111f]/70 text-slate-300 shadow-sm shadow-black/15 [&_td.font-black]:!text-white [&_td.font-bold]:!text-slate-100 [&_td]:!text-slate-300 [&_td_.text-foreground]:!text-slate-100 [&_td_.text-muted-foreground]:!text-slate-400 ${
      scrollHeightClassName ? `${scrollHeightClassName} overflow-y-auto` : ''
    }`}
  >
    <table className="min-w-full divide-y divide-cyan-300/10 text-left text-xs">
      <thead className="sticky top-0 z-10 bg-[#0b1828] text-[10px] font-black uppercase text-cyan-100/65 shadow-[0_1px_0_rgba(103,232,249,0.1)]">
        <tr>{headers.map(header => <th key={header} className="px-3 py-2">{header}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-cyan-300/10 bg-[#07111f]/35">{children}</tbody>
    </table>
  </div>
);

const TopList = ({ rows }: { rows: Array<{ key: string; count: number }> }) => (
  <div className="space-y-2">
    {rows.slice(0, 8).map(row => (
      <div key={row.key} className="flex items-center justify-between gap-3 rounded-xl border border-cyan-300/10 bg-white/[0.035] px-3 py-2">
        <span className="truncate text-xs font-bold text-slate-100">{row.key}</span>
        <Badge variant="secondary">{row.count}</Badge>
      </div>
    ))}
    {rows.length === 0 && <EmptyState title="No data yet" detail="Events will appear here after users open the app with cloud analytics enabled." />}
  </div>
);

const escapeCsvValue = (value: unknown) => {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
};

const downloadCsv = (filename: string, headers: string[], rows: Array<Array<unknown>>) => {
  const csv = [headers, ...rows].map(row => row.map(escapeCsvValue).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const OverviewPanel = ({ snapshot, growthMetrics }: { snapshot: AdminConsoleSnapshot; growthMetrics: AdminGrowthMetrics | null }) => {
  const activeNow = snapshot.activeSessions.filter(session => eventAgeMs(session.last_seen_at) < 5 * 60000).length;
  const openFeedback = snapshot.feedback.filter(item => !['resolved', 'closed'].includes(item.status)).length;
  const pendingFprds = snapshot.fprdsSubmissions.filter(item => item.review_status === 'pending').length;
  const activeSubscriptions = snapshot.subscriptions.filter(item => ['trialing', 'active'].includes(item.status)).length;
  const alerts = growthMetrics?.alerts ?? [];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Active now" value={growthMetrics?.engagement.activeSessionsNow ?? activeNow} detail="Sessions seen in the last five minutes." />
        <StatTile label="DAU / WAU" value={`${growthMetrics?.engagement.dau ?? '-'} / ${growthMetrics?.engagement.wau ?? '-'}`} detail="Signed-in active users by day and week." />
        <StatTile label="Open feedback" value={openFeedback} detail="Items not resolved or closed." />
        <StatTile label="Health alerts" value={alerts.length} detail={alerts.length ? 'Needs attention.' : 'No active warning rules.'} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Product adoption" icon={Activity}>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Users" value={growthMetrics?.users.total ?? uniqueCount(snapshot.usageEvents.map(item => item.user_id))} detail="Known cloud user profiles." />
            <StatTile label="Workspaces" value={growthMetrics?.workspaces.total ?? uniqueCount(snapshot.usageEvents.map(item => item.club_id))} detail="Team workspaces in cloud." />
            <StatTile label="Paid/trial" value={activeSubscriptions} detail="Future billing status count." />
          </div>
        </Section>
        <Section title="Most used areas" icon={BarChart3}>
          <TopList rows={growthMetrics ? snapshot.productMetrics?.topTabs ?? countBy(snapshot.usageEvents, item => item.view_name) : countBy(snapshot.usageEvents, item => item.view_name)} />
        </Section>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Section title="Top workspaces" icon={Building2}>
          {growthMetrics?.topWorkspaces.length ? (
            <CompactTable headers={['Workspace', 'Members', 'Events', 'Feedback', 'FPRDS', 'Last active']}>
              {growthMetrics.topWorkspaces.slice(0, 8).map(workspace => (
                <tr key={workspace.clubId}>
                  <td className="px-3 py-2 font-bold text-foreground">{workspace.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{workspace.memberCount}</td>
                  <td className="px-3 py-2 text-muted-foreground">{workspace.eventCount}</td>
                  <td className="px-3 py-2 text-muted-foreground">{workspace.feedbackCount}</td>
                  <td className="px-3 py-2 text-muted-foreground">{workspace.fprdsCount}</td>
                  <td className="px-3 py-2 text-muted-foreground">{workspace.lastActiveAt ? formatRelativeTime(workspace.lastActiveAt) : '-'}</td>
                </tr>
              ))}
            </CompactTable>
          ) : (
            <EmptyState title="No workspace insight yet" detail="Workspace activity appears after cloud workspaces generate usage events." />
          )}
        </Section>
        <Section title="Daily health" icon={Bell}>
          {alerts.length ? (
            <div className="space-y-2">
              {alerts.map(alert => <div key={alert} className={ADMIN_WARNING_CLASS}>{alert}</div>)}
            </div>
          ) : (
            <EmptyState title="No alerts" detail="Dumala will flag high-priority feedback, stale FPRDS reviews, billing errors, and security issues here." />
          )}
        </Section>
      </div>
    </div>
  );
};

const ACTIVATION_STEP_LABELS: Record<string, string> = {
  roster: 'Roster added',
  schedule: 'Match scheduled',
  result: 'Result logged',
  assessment: 'Assessment saved',
  report: 'Report downloaded'
};

const UsagePanel = ({
  events,
  sessions,
  metrics,
  productMetrics,
  activationFunnel
}: {
  events: AppUsageEvent[];
  sessions: AppSession[];
  metrics: AdminGrowthMetrics | null;
  productMetrics: AdminProductMetrics | null | undefined;
  activationFunnel: ActivationFunnelStep[];
}) => {
  const last24hEvents = events.filter(event => eventAgeMs(event.created_at) < 24 * 60 * 60000);
  const onlineNow = sessions.filter(session => eventAgeMs(session.last_seen_at) < 5 * 60000);
  const knownSessions = uniqueCount([
    ...events.map(event => event.session_id),
    ...sessions.map(session => session.session_id)
  ]);
  const topViews = countBy(events, item => item.view_name);
  const topFeatures = countBy(events, item => item.feature_name);
  const topDevices = countBy([...events, ...sessions], item => item.device_type);
  const topBrowsers = countBy([...events, ...sessions], item => item.browser_family);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Events" value={events.length} detail="Recent product events captured." />
        <StatTile label="DAU / WAU" value={metrics ? `${metrics.engagement.dau} / ${metrics.engagement.wau}` : last24hEvents.length} detail="Signed-in active users." />
        <StatTile label="Sessions" value={knownSessions} detail="Unique analytics sessions." />
        <StatTile label="Avg session" value={metrics ? `${metrics.engagement.avgSessionMinutes}m` : '-'} detail="Average duration in selected window." />
        <StatTile label="Top view" value={topViews[0]?.key ?? '-'} detail={topViews[0] ? `${topViews[0].count} recent opens.` : 'No view events yet.'} />
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Section title="Top views" icon={BarChart3}>
          <TopList rows={productMetrics?.topTabs ?? topViews} />
        </Section>
        <Section title="Least used" icon={Gauge}>
          <TopList rows={productMetrics?.leastUsedTabs ?? topViews.slice().reverse()} />
        </Section>
        <Section title="Top features" icon={Activity}>
          <TopList rows={topFeatures} />
        </Section>
        <Section title="Devices" icon={UsersRound}>
          <TopList rows={topDevices} />
        </Section>
        <Section title="Browsers" icon={Gauge}>
          <TopList rows={topBrowsers} />
        </Section>
      </div>
      <Section title="First-week activation funnel" icon={Rocket}>
        {activationFunnel.length === 0 || activationFunnel.every(step => step.users === 0) ? (
          <EmptyState title="No activation data yet" detail="Coaches emit activation milestones as they add a roster, schedule a match, log a result, save an assessment, and download a report." />
        ) : (
          <div className="space-y-2">
            {activationFunnel.map((step, index) => {
              const base = activationFunnel[0]?.users || 0;
              const pct = base > 0 ? Math.round((step.users / base) * 100) : 0;
              return (
                <div key={step.step} className="flex items-center gap-3">
                  <div className="w-36 shrink-0 text-xs font-bold text-slate-200">{ACTIVATION_STEP_LABELS[step.step] ?? step.step}</div>
                  <div className="relative h-6 flex-1 overflow-hidden rounded-md border border-white/10 bg-white/[0.04]">
                    <div className="h-full rounded-md bg-gradient-to-r from-cyan-400/70 to-emerald-400/70" style={{ width: `${Math.max(pct, step.users > 0 ? 4 : 0)}%` }} />
                    <span className="absolute inset-y-0 left-2 flex items-center text-[11px] font-black text-slate-100">{step.users}</span>
                  </div>
                  <div className="w-24 shrink-0 text-right text-[11px] text-muted-foreground">{index === 0 ? `${step.workspaces} teams` : `${pct}% of start`}</div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Section title="Recent events" icon={Activity}>
          {events.length === 0 ? (
            <EmptyState title="No usage events yet" detail="Dumala records privacy-minimized app view events when users open sections of the app." />
          ) : (
            <CompactTable headers={['Event', 'View', 'Feature', 'Device', 'When']} scrollHeightClassName="max-h-[22rem]">
              {events.slice(0, 40).map(event => (
                <tr key={event.id}>
                  <td className="px-3 py-2 font-bold text-foreground">{event.event_type.replaceAll('_', ' ')}</td>
                  <td className="px-3 py-2 text-muted-foreground">{event.view_name || 'Unknown'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{event.feature_name || '-'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{[event.device_type, event.browser_family].filter(Boolean).join(' / ') || 'Unknown'}</td>
                  <td className="px-3 py-2 text-muted-foreground" title={formatDateTime(event.created_at)}>{formatRelativeTime(event.created_at)}</td>
                </tr>
              ))}
            </CompactTable>
          )}
        </Section>
        <Section title="Recent sessions" icon={Wifi}>
          {sessions.length === 0 ? (
            <EmptyState title="No session heartbeats yet" detail="Session rows appear after app tabs send heartbeat updates." />
          ) : (
            <CompactTable headers={['Session', 'View', 'Device', 'Last seen']}>
              {sessions.slice(0, 12).map(session => (
                <tr key={session.session_id}>
                  <td className="px-3 py-2 font-bold text-foreground">{session.session_id.slice(0, 10)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{session.current_view || 'Unknown'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{[session.device_type, session.browser_family].filter(Boolean).join(' / ') || 'Unknown'}</td>
                  <td className="px-3 py-2 text-muted-foreground" title={formatDateTime(session.last_seen_at)}>{formatRelativeTime(session.last_seen_at)}</td>
                </tr>
              ))}
            </CompactTable>
          )}
        </Section>
      </div>
    </div>
  );
};

const StoragePanel = ({ metrics }: { metrics: AdminStorageMetrics | null }) => {
  const largestTable = metrics?.tables[0] ?? null;
  const maxTrendBytes = Math.max(...(metrics?.trend.map(point => point.totalBytes) ?? [0]), 1);

  if (!metrics) {
    return (
      <Section title="Storage" icon={Database}>
        <EmptyState title="Storage metrics unavailable" detail="Storage metrics require owner access with MFA verification." />
      </Section>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Tracked storage" value={formatBytes(metrics.totalBytes)} detail="Public schema table and index storage." />
        <StatTile label="Table data" value={formatBytes(metrics.tableBytes)} detail="Heap data across tracked public tables." />
        <StatTile label="Indexes" value={formatBytes(metrics.indexBytes)} detail={`${metrics.totalBytes > 0 ? Math.round((metrics.indexBytes / metrics.totalBytes) * 100) : 0}% of tracked storage.`} />
        <StatTile label="Largest table" value={largestTable ? largestTable.tableName : '-'} detail={largestTable ? `${formatBytes(largestTable.totalBytes)} · ${largestTable.totalPercent}%` : 'No table metrics yet.'} />
      </div>

      {metrics.warnings.length > 0 && (
        <div className="grid gap-2 md:grid-cols-3">
          {metrics.warnings.map(warning => (
            <div key={warning} className={ADMIN_WARNING_CLASS}>
              {warning}
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.35fr]">
        <Section title="Daily growth trend" icon={BarChart3}>
          {metrics.trend.length === 0 ? (
            <EmptyState title="No snapshots yet" detail="The first storage snapshot is created when this panel loads." />
          ) : (
            <div className="space-y-3">
              {metrics.trend.slice(-14).map(point => {
                const width = Math.max(4, (point.totalBytes / maxTrendBytes) * 100);
                return (
                  <div key={point.date} className="space-y-1">
                    <div className="flex items-center justify-between gap-3 text-[11px] font-bold">
                      <span className="text-slate-100">{point.date}</span>
                      <span className="text-slate-300">{formatBytes(point.totalBytes)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-orange-300" style={{ width: `${width}%` }} />
                    </div>
                    <p className="text-[10px] font-medium text-slate-400">
                      Data {formatBytes(point.tableBytes)} · Indexes {formatBytes(point.indexBytes)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="Table storage ranking" icon={Database}>
          {metrics.tables.length === 0 ? (
            <EmptyState title="No table storage yet" detail="Public schema tables will appear here once the database has relation metrics." />
          ) : (
            <CompactTable headers={['Table', 'Rows est.', 'Total', 'Data', 'Indexes', 'Share']} scrollHeightClassName="max-h-[22rem]">
              {metrics.tables.map(table => (
                <tr key={table.tableName}>
                  <td className="px-3 py-2 font-bold text-foreground">{table.tableName}</td>
                  <td className="px-3 py-2 text-muted-foreground">{new Intl.NumberFormat().format(table.rowEstimate)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatBytes(table.totalBytes)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatBytes(table.tableBytes)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatBytes(table.indexBytes)}</td>
                  <td className="px-3 py-2">
                    <Badge variant="secondary">{table.totalPercent}%</Badge>
                  </td>
                </tr>
              ))}
            </CompactTable>
          )}
        </Section>
      </div>
    </div>
  );
};

const FeedbackPanel = ({ feedback, metrics, onStatusChange, onOpen }: {
  feedback: FeedbackSubmission[];
  metrics?: AdminGrowthMetrics | null;
  onStatusChange: (feedbackId: string, status: FeedbackStatus) => void;
  onOpen: (item: FeedbackSubmission) => void;
}) => {
  const [statusFilter, setStatusFilter] = useState<'open' | 'all' | FeedbackStatus>('open');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | FeedbackSubmission['urgency']>('all');
  const [search, setSearch] = useState('');
  const openStatuses: FeedbackStatus[] = ['new', 'triaged', 'planned', 'in_progress'];
  const openItems = feedback.filter(item => openStatuses.includes(item.status));
  const highPriorityItems = feedback.filter(item => item.urgency === 'blocking' || item.urgency === 'high');
  const todayItems = feedback.filter(item => eventAgeMs(item.created_at) < 24 * 60 * 60000);
  const priorityScore = highPriorityItems.length * 3 + openItems.length;
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = feedback.filter(item => {
    const matchesStatus = statusFilter === 'all'
      ? true
      : statusFilter === 'open'
        ? openStatuses.includes(item.status)
        : item.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' || item.urgency === urgencyFilter;
    const matchesSearch = !normalizedSearch || [
      item.subject,
      item.details,
      item.affected_area,
      item.team_workspace ?? '',
      item.contact_email ?? ''
    ].join(' ').toLowerCase().includes(normalizedSearch);
    return matchesStatus && matchesUrgency && matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <StatTile label="Total feedback" value={feedback.length} detail="Synced from the Share feedback button." />
        <StatTile label="Open" value={openItems.length} detail="New, triaged, planned, or in progress." />
        <StatTile label="High priority" value={highPriorityItems.length} detail="High and blocking submissions." />
        <StatTile label="Priority score" value={priorityScore} detail={`${todayItems.length} items arrived in the last day.`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Roadmap candidates" icon={FileText}>
          {metrics?.feedbackIntelligence.roadmapCandidates.length ? (
            <CompactTable headers={['Area', 'Category', 'Count', 'High', 'Latest']}>
              {metrics.feedbackIntelligence.roadmapCandidates.map(candidate => (
                <tr key={`${candidate.area}-${candidate.category}`}>
                  <td className="px-3 py-2 font-bold text-foreground">{candidate.area}</td>
                  <td className="px-3 py-2 text-muted-foreground">{candidate.category.replaceAll('_', ' ')}</td>
                  <td className="px-3 py-2 text-muted-foreground">{candidate.count}</td>
                  <td className="px-3 py-2 text-muted-foreground">{candidate.highPriorityCount}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatRelativeTime(candidate.latestAt)}</td>
                </tr>
              ))}
            </CompactTable>
          ) : (
            <EmptyState title="No roadmap candidates yet" detail="Open feedback grouped by area and category will appear here when patterns emerge." />
          )}
        </Section>
        <Section title="Possible duplicates" icon={MessageSquare}>
          {metrics?.feedbackIntelligence.duplicateGroups.length ? (
            <CompactTable headers={['Subject fingerprint', 'Count', 'Latest']}>
              {metrics.feedbackIntelligence.duplicateGroups.map(group => (
                <tr key={group.fingerprint}>
                  <td className="px-3 py-2 font-bold text-foreground">{group.sampleSubject}</td>
                  <td className="px-3 py-2 text-muted-foreground">{group.count}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatRelativeTime(group.latestAt)}</td>
                </tr>
              ))}
            </CompactTable>
          ) : (
            <EmptyState title="No duplicates detected" detail="Repeated feedback subjects in the selected window will be grouped here." />
          )}
        </Section>
      </div>
      <Section title="Feedback inbox" icon={MessageSquare}>
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <input
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search subject, details, workspace, or email"
            className={ADMIN_INPUT_CLASS}
          />
          <select
            aria-label="Filter feedback by status"
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value as typeof statusFilter)}
            className={ADMIN_SELECT_CLASS}
          >
            <option value="open">Open statuses</option>
            <option value="all">All statuses</option>
            {Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select
            aria-label="Filter feedback by urgency"
            value={urgencyFilter}
            onChange={event => setUrgencyFilter(event.target.value as typeof urgencyFilter)}
            className={ADMIN_SELECT_CLASS}
          >
            <option value="all">All urgency</option>
            {Object.entries(urgencyLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        {feedback.length === 0 ? (
          <EmptyState title="No feedback yet" detail="Feedback submitted from the app's Share feedback button will appear here automatically." />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching feedback" detail="Clear the search or choose another status or urgency filter." />
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <article key={item.id} className={`${ADMIN_SUBTLE_CARD_CLASS} p-4`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-black ${statusTone[item.status]}`}>
                        {statusLabel[item.status]}
                      </span>
                      <Badge variant={item.urgency === 'blocking' || item.urgency === 'high' ? 'destructive' : 'secondary'}>
                        {urgencyLabel[item.urgency]}
                      </Badge>
                      <span className="text-[11px] font-black uppercase text-muted-foreground">{item.affected_area}</span>
                      <span className="text-[11px] font-medium text-muted-foreground">{formatRelativeTime(item.created_at)}</span>
                    </div>
                    <h3 className="mt-2 text-sm font-black text-foreground">{item.subject}</h3>
                    <p className="mt-1 line-clamp-3 text-xs font-medium leading-relaxed text-muted-foreground">{item.details}</p>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-muted-foreground">
                      <span>{categoryLabel[item.category]}</span>
                      <span>Workspace: {item.team_workspace || 'Unknown'}</span>
                      {item.contact_email && <span>Contact: {item.contact_email}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <select
                      aria-label={`Status for ${item.subject}`}
                      value={item.status}
                      onChange={event => onStatusChange(item.id, event.target.value as FeedbackStatus)}
                      className={ADMIN_SELECT_CLASS}
                    >
                      {Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    <Button type="button" variant="outline" size="sm" onClick={() => onOpen(item)} aria-label={`Open feedback: ${item.subject}`} className={ADMIN_REVIEW_BUTTON_CLASS}>
                      <Eye size={14} aria-hidden="true" /> Review
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
};

const LEAD_OPEN_STATUSES: FeedbackStatus[] = ['new', 'triaged', 'planned', 'in_progress'];

const parseTeamCount = (value: string) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const PremiumLeadsPanel = ({ feedback, onStatusChange, onOpen, onExport }: {
  feedback: FeedbackSubmission[];
  onStatusChange: (feedbackId: string, status: FeedbackStatus) => void;
  onOpen: (item: FeedbackSubmission) => void;
  onExport: () => void;
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'open' | 'all' | FeedbackStatus>('open');
  const [roleFilter, setRoleFilter] = useState('all');

  const leadFeedback = useMemo(() => feedback.filter(isPremiumLeadFeedback), [feedback]);
  const feedbackById = useMemo(
    () => new Map(leadFeedback.map(item => [item.id, item])),
    [leadFeedback]
  );
  const leads = useMemo(() => derivePremiumLeads(feedback), [feedback]);

  const newLeads = leads.filter(lead => lead.status === 'new').length;
  const weekLeads = leads.filter(lead => eventAgeMs(lead.submittedAt) < 7 * 24 * 60 * 60000).length;
  const totalTeams = leads.reduce((sum, lead) => sum + parseTeamCount(lead.teamCount), 0);
  const roleOptions = useMemo(
    () => Array.from(new Set(leads.map(lead => lead.role))).sort(),
    [leads]
  );

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = leads.filter(lead => {
    const matchesStatus = statusFilter === 'all'
      ? true
      : statusFilter === 'open'
        ? LEAD_OPEN_STATUSES.includes(lead.status)
        : lead.status === statusFilter;
    const matchesRole = roleFilter === 'all' || lead.role === roleFilter;
    const matchesSearch = !normalizedSearch || [
      lead.name,
      lead.organization,
      lead.email,
      lead.role,
      lead.notes
    ].join(' ').toLowerCase().includes(normalizedSearch);
    return matchesStatus && matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <StatTile label="Total leads" value={leads.length} detail="Premium beta interest captured from the landing page." />
        <StatTile label="Awaiting outreach" value={newLeads} detail="Leads still marked new — not yet contacted." />
        <StatTile label="This week" value={weekLeads} detail="Leads submitted in the last seven days." />
        <StatTile label="Teams represented" value={totalTeams} detail="Sum of the team counts coaches reported." />
      </div>
      <Section title="Premium beta leads" icon={Sparkles}>
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <input
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search name, organization, email, or notes"
            className={ADMIN_INPUT_CLASS}
          />
          <select
            aria-label="Filter leads by follow-up status"
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value as typeof statusFilter)}
            className={ADMIN_SELECT_CLASS}
          >
            <option value="open">Open statuses</option>
            <option value="all">All statuses</option>
            {Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select
            aria-label="Filter leads by role"
            value={roleFilter}
            onChange={event => setRoleFilter(event.target.value)}
            className={ADMIN_SELECT_CLASS}
          >
            <option value="all">All roles</option>
            {roleOptions.map(role => <option key={role} value={role}>{role}</option>)}
          </select>
          <Button type="button" variant="outline" onClick={onExport} disabled={leads.length === 0} className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS}>
            <Download size={14} aria-hidden="true" /> Export CSV
          </Button>
        </div>
        {leads.length === 0 ? (
          <EmptyState title="No Premium leads yet" detail="When a coach or club submits interest from the landing page Premium CTA, they appear here for willingness-to-pay follow-up." />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching leads" detail="Clear the search or choose another status or role filter." />
        ) : (
          <>
            <p className="mb-3 text-xs text-muted-foreground">Showing {filtered.length} of {leads.length} leads</p>
            <CompactTable headers={['Status', 'Name', 'Organization', 'Role', 'Teams', 'Email', 'Submitted', 'Follow-up', '']} scrollHeightClassName="max-h-[34rem]">
              {filtered.map(lead => {
                const feedbackItem = feedbackById.get(lead.id);
                return (
                  <tr key={lead.id}>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-black ${statusTone[lead.status]}`}>
                        {statusLabel[lead.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-bold text-foreground">{lead.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{lead.organization}</td>
                    <td className="px-3 py-2 text-muted-foreground">{lead.role}</td>
                    <td className="px-3 py-2 text-muted-foreground">{lead.teamCount || '-'}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {lead.email ? (
                        <a href={`mailto:${lead.email}`} className="text-cyan-200 underline-offset-2 hover:underline">{lead.email}</a>
                      ) : '-'}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground" title={formatDateTime(lead.submittedAt)}>{formatRelativeTime(lead.submittedAt)}</td>
                    <td className="px-3 py-2">
                      <select
                        aria-label={`Follow-up status for ${lead.name}`}
                        value={lead.status}
                        onChange={event => onStatusChange(lead.id, event.target.value as FeedbackStatus)}
                        className={ADMIN_SELECT_CLASS}
                      >
                        {Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {feedbackItem && (
                        <Button type="button" variant="outline" size="sm" onClick={() => onOpen(feedbackItem)} aria-label={`Open lead: ${lead.name}`} className={ADMIN_REVIEW_BUTTON_CLASS}>
                          <Eye size={14} aria-hidden="true" /> Review
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </CompactTable>
          </>
        )}
      </Section>
    </div>
  );
};

const FeedbackReviewDialog = ({ item, open, saving, onOpenChange, onSave }: {
  item: FeedbackSubmission | null;
  open: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: FeedbackSubmission, status: FeedbackStatus, adminNotes: string) => void;
}) => {
  const [status, setStatus] = useState<FeedbackStatus>('new');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (!item || !open) return;
    setStatus(item.status);
    setAdminNotes(item.admin_notes ?? '');
  }, [item, open]);

  if (!item) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${ADMIN_DIALOG_CONTENT_CLASS} max-h-[92vh] max-w-2xl overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="text-slate-100">{item.subject}</DialogTitle>
          <DialogDescription className="text-slate-400">{item.affected_area} - {categoryLabel[item.category]} - {formatRelativeTime(item.created_at)}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className={`${ADMIN_SUBTLE_CARD_CLASS} p-4`}>
            <p className="text-[10px] font-black uppercase text-muted-foreground">Feedback</p>
            <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-foreground">{item.details}</p>
          </div>
          {item.expected_behavior && (
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground">Expected outcome</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{item.expected_behavior}</p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="feedback-review-status" className="normal-case tracking-normal text-slate-300">Status</Label>
              <Select value={status} onValueChange={value => setStatus(value as FeedbackStatus)}>
                <SelectTrigger id="feedback-review-status" className={ADMIN_DIALOG_FIELD_CLASS}><SelectValue /></SelectTrigger>
                <SelectContent className={ADMIN_DIALOG_SELECT_CONTENT_CLASS}>{Object.entries(statusLabel).map(([value, label]) => <SelectItem key={value} value={value} className={ADMIN_DIALOG_SELECT_ITEM_CLASS}>{label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className={`${ADMIN_SUBTLE_CARD_CLASS} px-3 py-2 text-xs text-slate-400`}>
              <p><strong className="text-foreground">Urgency:</strong> {item.urgency}</p>
              <p className="mt-1"><strong className="text-foreground">Contact:</strong> {item.contact_email || 'Not provided'}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="feedback-admin-notes" className="normal-case tracking-normal text-slate-300">Private admin notes</Label>
            <Textarea id="feedback-admin-notes" value={adminNotes} onChange={event => setAdminNotes(event.target.value)} rows={4} maxLength={4000} placeholder="Triage decision, reproduction notes, or follow-up action." className={ADMIN_DIALOG_FIELD_CLASS} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>Cancel</Button>
          <Button type="button" disabled={saving} onClick={() => onSave(item, status, adminNotes)} className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const JsonFieldList = ({ value }: { value: Record<string, unknown> }) => {
  const rows = Object.entries(value);
  return rows.length === 0 ? <p className="text-xs text-muted-foreground">No values recorded.</p> : (
    <dl className="grid gap-px overflow-hidden rounded-xl border border-cyan-300/10 bg-cyan-300/10 sm:grid-cols-2">
      {rows.map(([key, rawValue]) => (
        <div key={key} className="flex items-start justify-between gap-3 bg-[#07111f]/90 px-3 py-2 text-xs">
          <dt className="break-all font-semibold text-muted-foreground">{key.replaceAll('_', ' ')}</dt>
          <dd className="max-w-[55%] break-all text-right font-black text-foreground">{typeof rawValue === 'object' ? JSON.stringify(rawValue) : String(rawValue)}</dd>
        </div>
      ))}
    </dl>
  );
};

const FprdsReviewDialog = ({ submission, open, saving, onOpenChange, onSave }: {
  submission: FprdsBetaSubmission | null;
  open: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (submission: FprdsBetaSubmission, status: FprdsBetaReviewStatus, reviewerNotes: string, exclusionReason: string) => void;
}) => {
  const [status, setStatus] = useState<FprdsBetaReviewStatus>('pending');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [exclusionReason, setExclusionReason] = useState('');

  useEffect(() => {
    if (!submission || !open) return;
    setStatus(submission.review_status);
    setReviewerNotes(submission.reviewer_notes ?? '');
    setExclusionReason(submission.exclusion_reason ?? '');
  }, [open, submission]);

  if (!submission) return null;
  const venue = submission.venue_context ?? {};
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${ADMIN_DIALOG_CONTENT_CLASS} max-h-[94vh] max-w-4xl overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="text-slate-100">FPRDS beta review</DialogTitle>
          <DialogDescription className="text-slate-400">Anonymous player {submission.player_anonymous_id.slice(0, 10)} - submitted {formatRelativeTime(submission.submitted_at)}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-cyan-300/10 bg-cyan-300/10 sm:grid-cols-5">
          {[
            ['Role', submission.role.toUpperCase()],
            ['Age group', submission.age_group.toUpperCase()],
            ['Type', submission.assessment_type],
            ['OVR', String(submission.ovr ?? '-')],
            ['Confidence', String(submission.coach_confidence ?? '-')]
          ].map(([label, value]) => (
            <div key={label} className="bg-[#07111f]/90 px-3 py-2.5">
              <p className="text-[9px] font-black uppercase text-muted-foreground">{label}</p>
              <p className="mt-1 text-sm font-black text-foreground">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-xs font-black text-foreground">Attribute scores</h3>
            <JsonFieldList value={submission.attribute_scores} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xs font-black text-foreground">Test context</h3>
            <JsonFieldList value={venue} />
            <p className="text-[11px] text-muted-foreground">Consent: {submission.consent_version} - {new Date(submission.consented_at).toLocaleString()}</p>
          </div>
        </div>

        <details className={`${ADMIN_SUBTLE_CARD_CLASS} p-3`}>
          <summary className="cursor-pointer text-xs font-black text-foreground">Raw drill results</summary>
          <div className="mt-3"><JsonFieldList value={submission.raw_results} /></div>
        </details>

        {submission.coach_notes && (
          <div className={`${ADMIN_SUBTLE_CARD_CLASS} p-3`}>
            <p className="text-[10px] font-black uppercase text-muted-foreground">Coach context</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{submission.coach_notes}</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fprds-review-status" className="normal-case tracking-normal text-slate-300">Review decision</Label>
            <Select value={status} onValueChange={value => setStatus(value as FprdsBetaReviewStatus)}>
              <SelectTrigger id="fprds-review-status" className={ADMIN_DIALOG_FIELD_CLASS}><SelectValue /></SelectTrigger>
              <SelectContent className={ADMIN_DIALOG_SELECT_CONTENT_CLASS}>{Object.entries(fprdsStatusLabel).map(([value, label]) => <SelectItem key={value} value={value} className={ADMIN_DIALOG_SELECT_ITEM_CLASS}>{label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {status === 'excluded' && (
            <div className="space-y-1.5">
              <Label htmlFor="fprds-exclusion-reason" className="normal-case tracking-normal text-slate-300">Exclusion reason</Label>
              <Textarea id="fprds-exclusion-reason" value={exclusionReason} onChange={event => setExclusionReason(event.target.value)} rows={2} maxLength={1000} required className={ADMIN_DIALOG_FIELD_CLASS} />
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fprds-reviewer-notes" className="normal-case tracking-normal text-slate-300">Reviewer notes</Label>
          <Textarea id="fprds-reviewer-notes" value={reviewerNotes} onChange={event => setReviewerNotes(event.target.value)} rows={3} maxLength={3000} placeholder="Quality observations, benchmark implications, or follow-up questions." className={ADMIN_DIALOG_FIELD_CLASS} />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>Cancel</Button>
          <Button type="button" disabled={saving || (status === 'excluded' && !exclusionReason.trim())} onClick={() => onSave(submission, status, reviewerNotes, exclusionReason)} className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save decision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const FprdsPanel = ({
  submissions,
  metrics,
  onOpen
}: {
  submissions: FprdsBetaSubmission[];
  metrics?: AdminGrowthMetrics | null;
  onOpen: (submission: FprdsBetaSubmission) => void;
}) => {
  const [filter, setFilter] = useState<'all' | FprdsBetaReviewStatus>('all');
  const filtered = filter === 'all' ? submissions : submissions.filter(item => item.review_status === filter);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {(Object.keys(fprdsStatusLabel) as FprdsBetaReviewStatus[]).map(status => (
          <button key={status} type="button" onClick={() => setFilter(status)} className={`rounded-2xl border p-3 text-left transition-colors ${filter === status ? fprdsStatusTone[status] : 'border-cyan-300/10 bg-white/[0.035] text-slate-300 hover:border-cyan-300/20 hover:bg-cyan-300/[0.055]'}`}>
            <p className="text-[10px] font-black uppercase">{fprdsStatusLabel[status]}</p>
            <p className="mt-1 text-xl font-black">{submissions.filter(item => item.review_status === status).length}</p>
          </button>
        ))}
        <StatTile label="Avg OVR" value={metrics?.fprdsAnalytics.averageOvr ?? '-'} detail="Across submitted beta data." />
        <StatTile label="Stale pending" value={metrics?.fprdsAnalytics.pendingOlderThan7d ?? 0} detail="Pending for more than seven days." />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Role coverage" icon={BarChart3}>
          <TopList rows={metrics?.fprdsAnalytics.byRole ?? countBy(submissions, item => item.role)} />
        </Section>
        <Section title="Assessment types" icon={ClipboardList}>
          <TopList rows={metrics?.fprdsAnalytics.byAssessmentType ?? countBy(submissions, item => item.assessment_type)} />
        </Section>
        <Section title="Age groups" icon={UsersRound}>
          <TopList rows={countBy(submissions, item => item.age_group)} />
        </Section>
      </div>
      <Section title="FPRDS beta submissions" icon={ClipboardList}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Showing {filtered.length} of {submissions.length} submissions</p>
          {filter !== 'all' && <Button type="button" variant="ghost" size="sm" onClick={() => setFilter('all')}>Clear filter</Button>}
        </div>
        {submissions.length === 0 ? (
          <EmptyState title="No beta submissions yet" detail="Opt-in anonymized coach assessments will appear here for benchmark review." />
        ) : filtered.length === 0 ? (
          <EmptyState title="No submissions in this status" detail="Choose another review status or clear the filter." />
        ) : (
          <CompactTable headers={['Status', 'Role', 'Age', 'Type', 'OVR', 'Confidence', 'Submitted', '']}>
            {filtered.map(submission => (
              <tr key={submission.id}>
                <td className="px-3 py-2"><span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-black ${fprdsStatusTone[submission.review_status]}`}>{fprdsStatusLabel[submission.review_status]}</span></td>
                <td className="px-3 py-2 font-bold text-foreground">{submission.role.toUpperCase()}</td>
                <td className="px-3 py-2 text-muted-foreground">{submission.age_group.toUpperCase()}</td>
                <td className="px-3 py-2 text-muted-foreground">{submission.assessment_type}</td>
                <td className="px-3 py-2 font-black text-foreground">{submission.ovr ?? '-'}</td>
                <td className="px-3 py-2 text-muted-foreground">{submission.coach_confidence ?? '-'}/5</td>
                <td className="px-3 py-2 text-muted-foreground">{formatRelativeTime(submission.submitted_at)}</td>
                <td className="px-3 py-2 text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpen(submission)}
                    className={ADMIN_REVIEW_BUTTON_CLASS}
                  >
                    <Eye size={14} /> Review
                  </Button>
                </td>
              </tr>
            ))}
          </CompactTable>
        )}
      </Section>
    </div>
  );
};

const TierBar = ({ distribution }: { distribution: Record<string, number> }) => {
  const tones: Record<string, string> = {
    Elite: 'bg-amber-400/80',
    Advanced: 'bg-emerald-400/80',
    Developing: 'bg-sky-400/80',
    'Below Average': 'bg-orange-400/80',
    Beginner: 'bg-rose-400/80',
    Unbanded: 'bg-slate-500/60'
  };
  const total = BENCHMARK_TIERS.reduce((sum, tier) => sum + (distribution[tier] ?? 0), 0);
  if (total === 0) return <span className="text-muted-foreground">-</span>;
  return (
    <div className="flex h-2.5 w-32 overflow-hidden rounded-full border border-white/10" title={BENCHMARK_TIERS.map(tier => `${tier}: ${distribution[tier] ?? 0}`).join(' · ')}>
      {BENCHMARK_TIERS.map(tier => {
        const value = distribution[tier] ?? 0;
        if (value === 0) return null;
        return <div key={tier} className={tones[tier]} style={{ width: `${(value / total) * 100}%` }} />;
      })}
    </div>
  );
};

const BenchmarkReviewDialog = ({ row, open, saving, onOpenChange, onSave }: {
  row: FprdsBenchmarkAnalysisRow | null;
  open: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (row: FprdsBenchmarkAnalysisRow, decision: FprdsBenchmarkReviewDecision, notes: string) => void;
}) => {
  const [decision, setDecision] = useState<FprdsBenchmarkReviewDecision>('inconclusive');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!row) return;
    setDecision('inconclusive');
    setNotes('');
  }, [row]);

  if (!row) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={ADMIN_DIALOG_CONTENT_CLASS}>
        <DialogHeader>
          <DialogTitle className="text-slate-100">Record benchmark verdict</DialogTitle>
          <DialogDescription className="text-slate-400">
            {formatDrillLabel(row.drillId)} · {row.ageGroup.toUpperCase()} · {row.role.toUpperCase()} · {row.assessmentType} · n={row.sampleSize}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 text-center">
            {([['P10', row.p10], ['Median', row.median], ['P90', row.p90]] as const).map(([label, value]) => (
              <div key={label} className="bg-slate-900/60 px-2 py-2">
                <p className="text-[9px] font-black uppercase text-slate-400">{label}</p>
                <p className="mt-0.5 text-sm font-extrabold text-slate-100">{value ?? '-'}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="benchmark-decision" className="normal-case tracking-normal text-slate-300">Decision</Label>
            <Select value={decision} onValueChange={value => setDecision(value as FprdsBenchmarkReviewDecision)}>
              <SelectTrigger id="benchmark-decision" className={ADMIN_DIALOG_FIELD_CLASS}><SelectValue /></SelectTrigger>
              <SelectContent className={ADMIN_DIALOG_SELECT_CONTENT_CLASS}>
                {(Object.keys(benchmarkDecisionLabel) as FprdsBenchmarkReviewDecision[]).map(value => (
                  <SelectItem key={value} value={value} className={ADMIN_DIALOG_SELECT_ITEM_CLASS}>{benchmarkDecisionLabel[value]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="benchmark-review-notes" className="normal-case tracking-normal text-slate-300">Reviewer notes</Label>
            <Textarea id="benchmark-review-notes" value={notes} onChange={event => setNotes(event.target.value)} rows={3} maxLength={3000} placeholder="Distribution read, drill-consistency concerns, or follow-up needed." className={ADMIN_DIALOG_FIELD_CLASS} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>Cancel</Button>
          <Button type="button" disabled={saving} onClick={() => onSave(row, decision, notes)} className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save verdict
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const BenchmarkCorrectionDialog = ({ row, open, saving, onOpenChange, onSave }: {
  row: FprdsBenchmarkAnalysisRow | null;
  open: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: FprdsBenchmarkCorrectionInput) => void;
}) => {
  const [tierLabel, setTierLabel] = useState<string>('Developing');
  const [currentBest, setCurrentBest] = useState('');
  const [currentWorst, setCurrentWorst] = useState('');
  const [proposedBest, setProposedBest] = useState('');
  const [proposedWorst, setProposedWorst] = useState('');
  const [rationale, setRationale] = useState('');
  const [targetVersion, setTargetVersion] = useState('');

  useEffect(() => {
    if (!row) return;
    setTierLabel('Developing');
    setCurrentBest('');
    setCurrentWorst('');
    setProposedBest('');
    setProposedWorst('');
    setRationale('');
    setTargetVersion('');
  }, [row]);

  if (!row) return null;

  const toNumberOrNull = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  };

  const submit = () => {
    onSave({
      drillId: row.drillId,
      attributeId: row.attributeId,
      ageGroup: row.ageGroup,
      role: row.role,
      tierLabel,
      currentRawBest: toNumberOrNull(currentBest),
      currentRawWorst: toNumberOrNull(currentWorst),
      proposedRawBest: toNumberOrNull(proposedBest),
      proposedRawWorst: toNumberOrNull(proposedWorst),
      rationale: rationale.trim(),
      targetBenchmarkVersion: targetVersion.trim() || null
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={ADMIN_DIALOG_CONTENT_CLASS}>
        <DialogHeader>
          <DialogTitle className="text-slate-100">Propose benchmark correction</DialogTitle>
          <DialogDescription className="text-slate-400">
            {formatDrillLabel(row.drillId)} · {row.ageGroup.toUpperCase()} · {row.role.toUpperCase()} · v{row.benchmarkVersion}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="correction-tier" className="normal-case tracking-normal text-slate-300">Tier under review</Label>
            <Select value={tierLabel} onValueChange={setTierLabel}>
              <SelectTrigger id="correction-tier" className={ADMIN_DIALOG_FIELD_CLASS}><SelectValue /></SelectTrigger>
              <SelectContent className={ADMIN_DIALOG_SELECT_CONTENT_CLASS}>
                {BENCHMARK_TIERS.filter(tier => tier !== 'Unbanded').map(tier => (
                  <SelectItem key={tier} value={tier} className={ADMIN_DIALOG_SELECT_ITEM_CLASS}>{tier}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="current-best" className="normal-case tracking-normal text-slate-300">Current best bound</Label>
              <Input id="current-best" inputMode="decimal" value={currentBest} onChange={event => setCurrentBest(event.target.value)} placeholder="e.g. 4.20" className={ADMIN_DIALOG_FIELD_CLASS} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="current-worst" className="normal-case tracking-normal text-slate-300">Current worst bound</Label>
              <Input id="current-worst" inputMode="decimal" value={currentWorst} onChange={event => setCurrentWorst(event.target.value)} placeholder="e.g. 4.59" className={ADMIN_DIALOG_FIELD_CLASS} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proposed-best" className="normal-case tracking-normal text-slate-300">Proposed best bound</Label>
              <Input id="proposed-best" inputMode="decimal" value={proposedBest} onChange={event => setProposedBest(event.target.value)} placeholder="Optional" className={ADMIN_DIALOG_FIELD_CLASS} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proposed-worst" className="normal-case tracking-normal text-slate-300">Proposed worst bound</Label>
              <Input id="proposed-worst" inputMode="decimal" value={proposedWorst} onChange={event => setProposedWorst(event.target.value)} placeholder="Optional" className={ADMIN_DIALOG_FIELD_CLASS} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="correction-rationale" className="normal-case tracking-normal text-slate-300">Rationale</Label>
            <Textarea id="correction-rationale" value={rationale} onChange={event => setRationale(event.target.value)} rows={3} maxLength={4000} required placeholder="Why the current band looks too easy or too hard, backed by the observed distribution." className={ADMIN_DIALOG_FIELD_CLASS} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="correction-target" className="normal-case tracking-normal text-slate-300">Target benchmark version (optional)</Label>
            <Input id="correction-target" value={targetVersion} onChange={event => setTargetVersion(event.target.value)} placeholder="e.g. fprds-beta-2" className={ADMIN_DIALOG_FIELD_CLASS} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>Cancel</Button>
          <Button type="button" disabled={saving || !rationale.trim()} onClick={submit} className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Log correction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const FprdsBenchmarkPanel = ({
  analysis,
  reviews,
  corrections,
  loadState,
  minSample,
  onMinSampleChange,
  onRefresh,
  onReview,
  onPropose,
  onCorrectionStatus,
  busyCorrectionId
}: {
  analysis: FprdsBenchmarkAnalysisRow[];
  reviews: FprdsBenchmarkReview[];
  corrections: FprdsBenchmarkCorrection[];
  loadState: 'idle' | 'loading' | 'ready' | 'error';
  minSample: number;
  onMinSampleChange: (value: number) => void;
  onRefresh: () => void;
  onReview: (row: FprdsBenchmarkAnalysisRow) => void;
  onPropose: (row: FprdsBenchmarkAnalysisRow) => void;
  onCorrectionStatus: (correction: FprdsBenchmarkCorrection, status: FprdsBenchmarkCorrectionStatus) => void;
  busyCorrectionId: string | null;
}) => {
  const totalSamples = analysis.reduce((sum, row) => sum + row.sampleSize, 0);
  const openCorrections = corrections.filter(item => item.status === 'proposed').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Benchmark groups" value={analysis.length} detail="Drill × age × role × type cells." />
        <StatTile label="Drill measurements" value={totalSamples} detail="Included, non-excluded submissions." />
        <StatTile label="Reviews logged" value={reviews.length} detail="Reviewer verdicts on benchmark rows." />
        <StatTile label="Open corrections" value={openCorrections} detail="Proposed band changes awaiting a decision." />
      </div>

      <Section title="Benchmark distribution analysis" icon={FlaskConical}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="benchmark-min-sample" className="normal-case tracking-normal text-slate-300">Min sample</Label>
            <Select value={String(minSample)} onValueChange={value => onMinSampleChange(Number(value))}>
              <SelectTrigger id="benchmark-min-sample" className={`h-8 w-20 ${ADMIN_DIALOG_FIELD_CLASS}`}><SelectValue /></SelectTrigger>
              <SelectContent className={ADMIN_DIALOG_SELECT_CONTENT_CLASS}>
                {[1, 3, 5, 10, 20].map(value => (
                  <SelectItem key={value} value={String(value)} className={ADMIN_DIALOG_SELECT_ITEM_CLASS}>{value}+</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onRefresh} className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS}>
            <RefreshCcw size={14} /> Refresh
          </Button>
        </div>
        {loadState === 'loading' ? (
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm font-semibold text-slate-300"><Loader2 size={16} className="animate-spin" /> Loading benchmark analysis...</div>
        ) : loadState === 'error' ? (
          <EmptyState title="Analysis unavailable" detail="The benchmark analysis query failed. Refresh to try again." />
        ) : analysis.length === 0 ? (
          <EmptyState title="No benchmark data yet" detail="Distributions appear once opt-in submissions include per-drill results at or above the minimum sample size." />
        ) : (
          <CompactTable headers={['Drill', 'Age', 'Role', 'Type', 'N', 'Median (P10–P90)', 'Avg score', 'Tier mix', '']}>
            {analysis.map(row => (
              <tr key={`${row.drillId}-${row.ageGroup}-${row.role}-${row.assessmentType}-${row.benchmarkVersion}`}>
                <td className="px-3 py-2 font-bold text-foreground">{formatDrillLabel(row.drillId)}</td>
                <td className="px-3 py-2 text-muted-foreground">{row.ageGroup.toUpperCase()}</td>
                <td className="px-3 py-2 text-muted-foreground">{row.role.toUpperCase()}</td>
                <td className="px-3 py-2 text-muted-foreground">{row.assessmentType}</td>
                <td className="px-3 py-2 font-black text-foreground">{row.sampleSize}</td>
                <td className="px-3 py-2 text-muted-foreground">{row.median ?? '-'} <span className="text-slate-500">({row.p10 ?? '-'}–{row.p90 ?? '-'})</span></td>
                <td className="px-3 py-2 text-muted-foreground">{row.avgScore ?? '-'}</td>
                <td className="px-3 py-2"><TierBar distribution={row.tierDistribution} /></td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => onReview(row)} className={ADMIN_REVIEW_BUTTON_CLASS}><Eye size={14} /> Review</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => onPropose(row)} className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS}>Propose fix</Button>
                  </div>
                </td>
              </tr>
            ))}
          </CompactTable>
        )}
      </Section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Recent benchmark reviews" icon={ClipboardList}>
          {reviews.length === 0 ? (
            <EmptyState title="No reviews yet" detail="Recorded verdicts on benchmark rows appear here." />
          ) : (
            <CompactTable headers={['Drill', 'Age', 'Role', 'Decision', 'N', 'When']}>
              {reviews.map(review => (
                <tr key={review.id}>
                  <td className="px-3 py-2 font-bold text-foreground">{formatDrillLabel(review.drill_id)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{review.age_group.toUpperCase()}</td>
                  <td className="px-3 py-2 text-muted-foreground">{review.role ? review.role.toUpperCase() : 'All'}</td>
                  <td className="px-3 py-2"><span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-black ${benchmarkDecisionTone[review.review_decision]}`}>{benchmarkDecisionLabel[review.review_decision]}</span></td>
                  <td className="px-3 py-2 text-muted-foreground">{review.sample_size}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatRelativeTime(review.created_at)}</td>
                </tr>
              ))}
            </CompactTable>
          )}
        </Section>

        <Section title="Benchmark corrections" icon={FileText}>
          {corrections.length === 0 ? (
            <EmptyState title="No corrections proposed" detail="Proposed band changes and their decisions appear here." />
          ) : (
            <div className="space-y-3">
              {corrections.map(correction => (
                <div key={correction.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-foreground">{formatDrillLabel(correction.drill_id)} · {correction.tier_label}</p>
                      <p className="text-[11px] text-muted-foreground">{correction.age_group.toUpperCase()} · {correction.role ? correction.role.toUpperCase() : 'All roles'}
                        {correction.target_benchmark_version ? ` · → ${correction.target_benchmark_version}` : ''}</p>
                    </div>
                    <span className={`inline-flex shrink-0 rounded-md border px-2 py-1 text-[10px] font-black ${correctionStatusTone[correction.status]}`}>{correctionStatusLabel[correction.status]}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-300">
                    <span className="text-slate-500">Band</span> {correction.current_raw_best ?? '·'}–{correction.current_raw_worst ?? '·'}
                    <span className="text-slate-500"> → </span> {correction.proposed_raw_best ?? '·'}–{correction.proposed_raw_worst ?? '·'}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{correction.rationale}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(['accepted', 'rejected', 'deferred', 'proposed'] as FprdsBenchmarkCorrectionStatus[])
                      .filter(status => status !== correction.status)
                      .map(status => (
                        <Button key={status} type="button" variant="outline" size="sm" disabled={busyCorrectionId === correction.id} onClick={() => onCorrectionStatus(correction, status)} className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS}>
                          {busyCorrectionId === correction.id ? <Loader2 size={12} className="animate-spin" /> : null}
                          {status === 'proposed' ? 'Reopen' : correctionStatusLabel[status]}
                        </Button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
};

const ManagedUserStatusBadges = ({ user }: { user: AdminManagedUser }) => (
  <div className="flex flex-wrap items-center gap-1.5">
    <Badge variant={user.accountState === 'active' ? 'secondary' : 'warning'}>{user.accountState.replaceAll('_', ' ')}</Badge>
    {user.bannedAt && (
      <span className="inline-flex items-center gap-1 rounded-md border border-rose-300/25 bg-rose-300/10 px-2 py-0.5 text-[10px] font-black text-rose-100">
        <Ban size={11} aria-hidden="true" /> Banned
      </span>
    )}
    {isManagedUserMuted(user) && (
      <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/25 bg-amber-300/10 px-2 py-0.5 text-[10px] font-black text-amber-100">
        <VolumeX size={11} aria-hidden="true" /> Muted
      </span>
    )}
  </div>
);

const UsersPanel = ({
  metrics,
  users,
  usersState,
  search,
  onSearchChange,
  onSearch,
  onManage
}: {
  metrics: AdminGrowthMetrics | null;
  users: AdminManagedUser[];
  usersState: 'idle' | 'loading' | 'ready' | 'error';
  search: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onManage: (user: AdminManagedUser) => void;
}) => {
  const bannedCount = users.filter(user => user.bannedAt).length;
  const mutedCount = users.filter(isManagedUserMuted).length;
  const paidCount = users.filter(user => user.planCode !== 'free').length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Users" value={metrics?.users.total ?? users.length} detail="Cloud user profiles." />
        <StatTile label="New 7d" value={metrics?.users.new7d ?? 0} detail={`${metrics?.users.newToday ?? 0} joined today.`} />
        <StatTile label="Banned / muted" value={`${bannedCount} / ${mutedCount}`} detail="Moderated accounts in the loaded directory." />
        <StatTile label="Paid plans" value={paidCount} detail="Loaded users on a non-free plan." />
        <StatTile label="Deletion risk" value={(metrics?.users.pendingDeletion ?? 0) + (metrics?.workspaces.pendingDeletion ?? 0)} detail="Users or workspaces pending deletion." />
      </div>
      <Section title="User management" icon={UserCog}>
        <form
          className="mb-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={event => {
            event.preventDefault();
            onSearch();
          }}
        >
          <input
            type="search"
            value={search}
            onChange={event => onSearchChange(event.target.value)}
            placeholder="Search by email, display name, or user id"
            className={`${ADMIN_INPUT_CLASS} flex-1`}
          />
          <Button type="submit" variant="outline" disabled={usersState === 'loading'} className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS}>
            {usersState === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Search
          </Button>
        </form>
        {usersState === 'loading' && users.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm font-semibold text-slate-300">
            <Loader2 size={16} className="animate-spin" /> Loading user directory...
          </div>
        ) : usersState === 'error' ? (
          <EmptyState title="User directory unavailable" detail="The managed users query failed. Search again to retry." />
        ) : users.length === 0 ? (
          <EmptyState title="No users found" detail="Clear the search or wait for cloud accounts to bootstrap." />
        ) : (
          <CompactTable headers={['User', 'Status', 'Plan', 'Workspaces', 'Devices', 'Last active', '']} scrollHeightClassName="max-h-[30rem]">
            {users.map(user => (
              <tr key={user.userId}>
                <td className="px-3 py-2">
                  <p className="font-bold text-foreground">{managedUserLabel(user)}</p>
                  <p className="mt-0.5 max-w-[16rem] truncate text-[11px] text-muted-foreground">{user.email || user.userId}</p>
                </td>
                <td className="px-3 py-2"><ManagedUserStatusBadges user={user} /></td>
                <td className="px-3 py-2">
                  <span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-black uppercase ${planBadgeTone(user.planCode)}`}>
                    {user.planCode}
                  </span>
                  {user.planExpiresAt && (
                    <p className="mt-1 text-[10px] text-muted-foreground">until {formatDateTime(user.planExpiresAt)}</p>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{user.workspaceCount}</td>
                <td className="px-3 py-2 text-muted-foreground">{user.deviceCount}</td>
                <td className="px-3 py-2 text-muted-foreground">{user.lastActiveAt ? formatRelativeTime(user.lastActiveAt) : '-'}</td>
                <td className="px-3 py-2 text-right">
                  <Button type="button" variant="outline" size="sm" onClick={() => onManage(user)} className={ADMIN_REVIEW_BUTTON_CLASS}>
                    <UserCog size={14} /> Manage
                  </Button>
                </td>
              </tr>
            ))}
          </CompactTable>
        )}
      </Section>
      <Section title="Top workspaces" icon={Building2}>
        {metrics?.topWorkspaces.length ? (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.topWorkspaces.slice(0, 9).map(workspace => (
              <div key={workspace.clubId} className={`${ADMIN_SUBTLE_CARD_CLASS} px-3 py-2`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-xs font-black text-foreground">{workspace.name}</p>
                  <Badge variant="secondary">{workspace.eventCount}</Badge>
                </div>
                <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                  {workspace.memberCount} members · {workspace.feedbackCount} feedback · {workspace.fprdsCount} FPRDS
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No workspace activity" detail="Top workspaces are ranked by usage events in the selected window." />
        )}
      </Section>
    </div>
  );
};

type ManagedUserAction = 'ban' | 'mute' | 'plan' | 'devices' | 'notes';

const ManageUserDialog = ({
  user,
  open,
  onOpenChange,
  onBan,
  onMute,
  onPlan,
  onRevokeDevices,
  onNotes
}: {
  user: AdminManagedUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBan: (user: AdminManagedUser, banned: boolean, reason: string) => Promise<void>;
  onMute: (user: AdminManagedUser, mutedUntil: string | null, reason: string) => Promise<void>;
  onPlan: (user: AdminManagedUser, planCode: string, expiresAt: string | null, note: string) => Promise<void>;
  onRevokeDevices: (user: AdminManagedUser) => Promise<void>;
  onNotes: (user: AdminManagedUser, notes: string) => Promise<void>;
}) => {
  const [banReason, setBanReason] = useState('');
  const [muteHours, setMuteHours] = useState('24');
  const [muteReason, setMuteReason] = useState('');
  const [planCode, setPlanCode] = useState('free');
  const [planExpires, setPlanExpires] = useState('');
  const [planNote, setPlanNote] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [busyAction, setBusyAction] = useState<ManagedUserAction | null>(null);
  const [error, setError] = useState('');
  const userId = user?.userId;

  useEffect(() => {
    if (!user || !open) return;
    setBanReason(user.banReason ?? '');
    setMuteHours('24');
    setMuteReason(user.muteReason ?? '');
    setPlanCode(user.planCode);
    setPlanExpires(user.planExpiresAt ? user.planExpiresAt.slice(0, 10) : '');
    setPlanNote(user.planNote ?? '');
    setAdminNotes(user.adminNotes ?? '');
    setBusyAction(null);
    setError('');
    // Only reset the form when a different user is opened, not after each saved action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, open]);

  if (!user) return null;
  const muted = isManagedUserMuted(user);
  const planOptions = ADMIN_PLAN_OPTIONS.some(option => option.value === user.planCode)
    ? ADMIN_PLAN_OPTIONS
    : [...ADMIN_PLAN_OPTIONS, { value: user.planCode, label: user.planCode }];

  const run = async (action: ManagedUserAction, task: () => Promise<void>) => {
    setBusyAction(action);
    setError('');
    try {
      await task();
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : 'Action could not be completed.');
    } finally {
      setBusyAction(null);
    }
  };

  const actionSpinner = (action: ManagedUserAction, fallback: React.ReactNode) =>
    busyAction === action ? <Loader2 size={14} className="animate-spin" /> : fallback;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${ADMIN_DIALOG_CONTENT_CLASS} max-h-[92vh] max-w-2xl overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="text-slate-100">{managedUserLabel(user)}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {user.email || 'No email on record'} · joined {formatRelativeTime(user.createdAt)} · {user.workspaceCount} workspaces
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <ManagedUserStatusBadges user={user} />
          <span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-black uppercase ${planBadgeTone(user.planCode)}`}>
            {user.planCode}
          </span>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-xs font-semibold text-destructive" role="alert">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className={`${ADMIN_SUBTLE_CARD_CLASS} p-4`}>
            <div className="flex items-center gap-2">
              <Ban size={15} className="text-rose-200" aria-hidden="true" />
              <h3 className="text-xs font-black uppercase text-slate-200">Ban</h3>
            </div>
            {user.bannedAt ? (
              <div className="mt-3 space-y-3">
                <p className="text-xs leading-relaxed text-slate-300">
                  Banned {formatRelativeTime(user.bannedAt)}{user.banReason ? ` — ${user.banReason}` : ''}. The account is disabled and blocked from all workspace data.
                </p>
                <Button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() => void run('ban', () => onBan(user, false, ''))}
                  className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}
                >
                  {actionSpinner('ban', <ShieldCheck size={14} />)} Unban user
                </Button>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-xs leading-relaxed text-slate-400">
                  Banning disables the account, blocks all workspace data access, and revokes every synced device.
                </p>
                <Input
                  value={banReason}
                  onChange={event => setBanReason(event.target.value)}
                  maxLength={500}
                  placeholder="Ban reason (recommended)"
                  className={ADMIN_DIALOG_FIELD_CLASS}
                />
                <Button
                  type="button"
                  variant="destructive"
                  disabled={busyAction !== null}
                  onClick={() => void run('ban', () => onBan(user, true, banReason))}
                >
                  {actionSpinner('ban', <Ban size={14} />)} Ban user
                </Button>
              </div>
            )}
          </div>

          <div className={`${ADMIN_SUBTLE_CARD_CLASS} p-4`}>
            <div className="flex items-center gap-2">
              <VolumeX size={15} className="text-amber-200" aria-hidden="true" />
              <h3 className="text-xs font-black uppercase text-slate-200">Mute</h3>
            </div>
            {muted ? (
              <div className="mt-3 space-y-3">
                <p className="text-xs leading-relaxed text-slate-300">
                  Muted until {formatDateTime(user.mutedUntil as string)}{user.muteReason ? ` — ${user.muteReason}` : ''}. Muted users cannot post bulletins or submit feedback.
                </p>
                <Button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() => void run('mute', () => onMute(user, null, ''))}
                  className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}
                >
                  {actionSpinner('mute', <Volume2 size={14} />)} Unmute user
                </Button>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-xs leading-relaxed text-slate-400">
                  Muted users keep access but cannot post bulletins or submit feedback until the mute expires.
                </p>
                <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
                  <Select value={muteHours} onValueChange={setMuteHours}>
                    <SelectTrigger aria-label="Mute duration" className={ADMIN_DIALOG_FIELD_CLASS}><SelectValue /></SelectTrigger>
                    <SelectContent className={ADMIN_DIALOG_SELECT_CONTENT_CLASS}>
                      {MUTE_DURATION_OPTIONS.map(option => (
                        <SelectItem key={option.hours} value={String(option.hours)} className={ADMIN_DIALOG_SELECT_ITEM_CLASS}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={muteReason}
                    onChange={event => setMuteReason(event.target.value)}
                    maxLength={500}
                    placeholder="Mute reason (optional)"
                    className={ADMIN_DIALOG_FIELD_CLASS}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busyAction !== null}
                  onClick={() => void run('mute', () => onMute(
                    user,
                    new Date(Date.now() + Number(muteHours) * 3_600_000).toISOString(),
                    muteReason
                  ))}
                  className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS}
                >
                  {actionSpinner('mute', <VolumeX size={14} />)} Mute user
                </Button>
              </div>
            )}
          </div>

          <div className={`${ADMIN_SUBTLE_CARD_CLASS} p-4`}>
            <div className="flex items-center gap-2">
              <CreditCard size={15} className="text-emerald-200" aria-hidden="true" />
              <h3 className="text-xs font-black uppercase text-slate-200">Plan</h3>
            </div>
            <div className="mt-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="managed-user-plan" className="normal-case tracking-normal text-slate-300">Plan</Label>
                  <Select value={planCode} onValueChange={setPlanCode}>
                    <SelectTrigger id="managed-user-plan" className={ADMIN_DIALOG_FIELD_CLASS}><SelectValue /></SelectTrigger>
                    <SelectContent className={ADMIN_DIALOG_SELECT_CONTENT_CLASS}>
                      {planOptions.map(option => (
                        <SelectItem key={option.value} value={option.value} className={ADMIN_DIALOG_SELECT_ITEM_CLASS}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="managed-user-plan-expiry" className="normal-case tracking-normal text-slate-300">Expires (optional)</Label>
                  <Input
                    id="managed-user-plan-expiry"
                    type="date"
                    value={planExpires}
                    onChange={event => setPlanExpires(event.target.value)}
                    className={ADMIN_DIALOG_FIELD_CLASS}
                  />
                </div>
              </div>
              <Input
                value={planNote}
                onChange={event => setPlanNote(event.target.value)}
                maxLength={500}
                placeholder="Plan note, e.g. founder discount or comp reason (optional)"
                className={ADMIN_DIALOG_FIELD_CLASS}
              />
              <Button
                type="button"
                disabled={busyAction !== null}
                onClick={() => void run('plan', () => onPlan(
                  user,
                  planCode,
                  planExpires ? new Date(`${planExpires}T23:59:59`).toISOString() : null,
                  planNote
                ))}
                className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}
              >
                {actionSpinner('plan', <Save size={14} />)} Apply plan
              </Button>
            </div>
          </div>

          <div className={`${ADMIN_SUBTLE_CARD_CLASS} p-4`}>
            <div className="flex items-center gap-2">
              <Smartphone size={15} className="text-cyan-200" aria-hidden="true" />
              <h3 className="text-xs font-black uppercase text-slate-200">Devices</h3>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs leading-relaxed text-slate-400">
                {user.deviceCount} active synced {user.deviceCount === 1 ? 'device' : 'devices'}. Revoking forces every device to re-authenticate before syncing again.
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={busyAction !== null || user.deviceCount === 0}
                onClick={() => void run('devices', () => onRevokeDevices(user))}
                className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS}
              >
                {actionSpinner('devices', <Smartphone size={14} />)} Revoke all devices
              </Button>
            </div>
          </div>

          <div className={`${ADMIN_SUBTLE_CARD_CLASS} p-4`}>
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-slate-300" aria-hidden="true" />
              <h3 className="text-xs font-black uppercase text-slate-200">Private admin notes</h3>
            </div>
            <div className="mt-3 space-y-3">
              <Textarea
                value={adminNotes}
                onChange={event => setAdminNotes(event.target.value)}
                rows={3}
                maxLength={4000}
                placeholder="Moderation history, support context, or follow-up reminders."
                className={ADMIN_DIALOG_FIELD_CLASS}
              />
              <Button
                type="button"
                variant="outline"
                disabled={busyAction !== null}
                onClick={() => void run('notes', () => onNotes(user, adminNotes))}
                className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS}
              >
                {actionSpinner('notes', <Save size={14} />)} Save notes
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const BillingPanel = ({ snapshot, metrics }: { snapshot: AdminConsoleSnapshot; metrics: AdminGrowthMetrics | null }) => (
  <div className="space-y-4">
    <Section title="Payments and ledger readiness" icon={CreditCard}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Customers" value={metrics?.billingReadiness.customers ?? snapshot.billingCustomers.length} detail="Provider-linked billing customers." />
        <StatTile label="Subscriptions" value={metrics?.billingReadiness.subscriptions ?? snapshot.subscriptions.length} detail="Future Stripe/PayPal plan states." />
        <StatTile label="Active/trial" value={metrics?.billingReadiness.activeOrTrial ?? snapshot.subscriptions.filter(item => ['trialing', 'active'].includes(item.status)).length} detail="Currently billable accounts." />
        <StatTile label="Past due" value={metrics?.billingReadiness.pastDue ?? 0} detail="Needs payment follow-up." />
        <StatTile label="Webhook failures" value={metrics?.billingReadiness.failedWebhookEvents ?? 0} detail="Provider events with processing errors." />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <StatTile label="Ledger entries" value={metrics?.billingReadiness.ledgerEntries ?? 0} detail="Internal payment ledger rows." />
        <StatTile label="Ledger balance" value={formatCurrency(metrics?.billingReadiness.ledgerAmountDue ?? 0)} detail="Charges/refunds less payments/waivers." />
        <StatTile label="Collected" value={formatCurrency(metrics?.billingReadiness.ledgerAmountPaid ?? 0)} detail="Payment entries recorded." />
      </div>
      <p className="mt-4 text-xs font-medium leading-relaxed text-muted-foreground">
        Billing tables are provider-neutral. Stripe, PayPal, or another processor should update them through secure server-side webhooks.
      </p>
    </Section>
  </div>
);

const statusChip = (label: string, tone: string) => (
  <span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-black uppercase ${tone}`}>{label}</span>
);

const LIVE_TONE = 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100';
const SCHEDULED_TONE = 'border-sky-300/25 bg-sky-300/10 text-sky-100';
const ENDED_TONE = 'border-amber-300/25 bg-amber-300/10 text-amber-100';
const OFF_TONE = 'border-slate-300/20 bg-slate-300/10 text-slate-200';

const scheduleStatus = (enabled: boolean, startsAt: string, endsAt: string | null | undefined, offLabel: string) => {
  if (!enabled) return { label: offLabel, tone: OFF_TONE };
  const now = Date.now();
  if (new Date(startsAt).getTime() > now) return { label: 'Scheduled', tone: SCHEDULED_TONE };
  if (endsAt && new Date(endsAt).getTime() <= now) return { label: 'Ended', tone: ENDED_TONE };
  return { label: 'Live', tone: LIVE_TONE };
};

const promotionStatus = (promotion: PromotionRecord) =>
  scheduleStatus(promotion.is_active, promotion.starts_at, promotion.ends_at, 'Inactive');

const announcementStatus = (announcement: AnnouncementRecord) =>
  scheduleStatus(announcement.is_published, announcement.starts_at, announcement.ends_at, 'Draft');

const discountLabel = (promotion: PromotionRecord) =>
  promotion.discount_type === 'percent'
    ? `${promotion.discount_value}% off`
    : `${formatCurrency(promotion.discount_value)} off`;

const scheduleWindowLabel = (startsAt: string, endsAt?: string | null) =>
  `${formatDateTime(startsAt)} → ${endsAt ? formatDateTime(endsAt) : 'no end date'}`;

const announcementKindLabel: Record<AnnouncementKind, string> = {
  info: 'Info',
  feature: 'Feature',
  maintenance: 'Maintenance',
  promo: 'Promotion'
};

const leagueRequestStatusLabel: Record<LeagueAccessRequestStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  provisioned: 'Provisioned',
  withdrawn: 'Withdrawn'
};

const personaLabel: Record<AccountPersona, string> = {
  coach: 'Coach',
  player: 'Player',
  league: 'League'
};

const accountPersonas: AccountPersona[] = ['coach', 'player', 'league'];

const hasLeaguePilot = (user: AdminManagedUser) =>
  (user.entitlements ?? []).includes(LEAGUE_PILOT_ENTITLEMENT);

const getAppUrl = (hashRoute: string) => {
  if (typeof window === 'undefined') return hashRoute;
  return `${window.location.origin}${window.location.pathname}${hashRoute}`;
};

const AccessPanel = ({
  adminProfile,
  phase6,
  users,
  usersState,
  search,
  requests,
  requestsState,
  busyUserId,
  actionId,
  onSearchChange,
  onSearch,
  onPersonaChange,
  onToggleLeaguePilot,
  onRefreshRequests,
  onProvision,
  onReview
}: {
  adminProfile: AppAdminProfile | null;
  phase6: ReturnType<typeof useCloudRuntime>['phase6'];
  users: AdminManagedUser[];
  usersState: 'idle' | 'loading' | 'ready' | 'error';
  search: string;
  requests: LeagueAccessRequestRecord[];
  requestsState: 'idle' | 'loading' | 'ready' | 'error';
  busyUserId: string | null;
  actionId: string | null;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onPersonaChange: (user: AdminManagedUser, persona: AccountPersona) => Promise<void>;
  onToggleLeaguePilot: (user: AdminManagedUser, enabled: boolean) => Promise<void>;
  onRefreshRequests: () => void;
  onProvision: (request: LeagueAccessRequestRecord) => Promise<void>;
  onReview: (request: LeagueAccessRequestRecord, status: LeagueAccessRequestStatus) => Promise<void>;
}) => {
  const appCards = [
    {
      id: 'coach',
      label: 'Coach App',
      route: '#/app',
      enabled: true,
      status: 'Enabled',
      detail: 'Current team workspace experience.'
    },
    {
      id: 'league',
      label: 'League App',
      route: '#/league',
      enabled: phase6.leagueAppEnabled || phase6.leagueRequestEnabled,
      status: phase6.leagueAppEnabled ? 'Enabled' : phase6.leagueRequestEnabled ? 'Request only' : 'Disabled',
      preview: phase6.leaguePreviewEnabled,
      detail: 'League Owner dashboard gated by persona and entitlement.'
    },
    {
      id: 'player',
      label: 'Player App',
      route: '#/player',
      enabled: phase6.playerAppEnabled,
      status: phase6.playerAppEnabled ? 'Enabled' : 'Disabled',
      preview: phase6.playerPreviewEnabled,
      detail: 'Player personal training and team experience.'
    }
  ];
  const pendingRequests = requests.filter(request => request.status === 'pending');

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Admin role" value={adminProfile ? roleLabel[adminProfile.role] : '-'} detail="Current owner-console permission." />
        <StatTile label="Coach door" value="Online" detail="Default app surface." />
        <StatTile label="League door" value={phase6.leagueAppEnabled ? 'Online' : phase6.leagueRequestEnabled ? 'Request only' : 'Off'} detail={phase6.leaguePreviewEnabled ? 'Preview mode enabled.' : 'Production gate enforced.'} />
        <StatTile label="Player door" value={phase6.playerAppEnabled ? 'Online' : 'Off'} detail={phase6.playerPreviewEnabled ? 'Preview mode enabled.' : 'Persona gate enforced.'} />
      </div>

      <Section title="App doors" icon={AppWindow}>
        <div className="grid gap-3 lg:grid-cols-3">
          {appCards.map(app => (
            <div key={app.id} className={`${ADMIN_SUBTLE_CARD_CLASS} p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-100">{app.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{app.detail}</p>
                </div>
                <Badge variant={app.enabled ? 'secondary' : 'outline'}>{app.status}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS} onClick={() => window.open(getAppUrl(app.route), '_blank', 'noopener,noreferrer')}>
                  <ExternalLink size={14} /> Open
                </Button>
                {'preview' in app && (
                  <Button type="button" size="sm" variant="outline" className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS} disabled={!app.preview} onClick={() => window.open(getAppUrl(app.route), '_blank', 'noopener,noreferrer')}>
                    <Eye size={14} /> Demo
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Persona and entitlements" icon={KeyRound}>
        <form
          className="mb-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={event => {
            event.preventDefault();
            onSearch();
          }}
        >
          <input
            type="search"
            value={search}
            onChange={event => onSearchChange(event.target.value)}
            placeholder="Search users by email, display name, or user id"
            className={`${ADMIN_INPUT_CLASS} flex-1`}
          />
          <Button type="submit" variant="outline" disabled={usersState === 'loading'} className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS}>
            {usersState === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Search
          </Button>
        </form>

        {usersState === 'loading' && users.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm font-semibold text-slate-300">
            <Loader2 size={16} className="animate-spin" /> Loading access directory...
          </div>
        ) : usersState === 'error' ? (
          <EmptyState title="Access directory unavailable" detail="The managed users query failed. Search again to retry." />
        ) : users.length === 0 ? (
          <EmptyState title="No users found" detail="Search for a cloud account before changing persona or entitlements." />
        ) : (
          <CompactTable headers={['User', 'Persona', 'League pilot', 'State', 'Last active']} scrollHeightClassName="max-h-[30rem]">
            {users.map(user => {
              const busy = busyUserId === user.userId;
              const leaguePilot = hasLeaguePilot(user);
              return (
                <tr key={user.userId}>
                  <td className="px-3 py-2">
                    <p className="font-bold text-foreground">{managedUserLabel(user)}</p>
                    <p className="mt-0.5 max-w-[18rem] truncate text-[11px] text-muted-foreground">{user.email || user.userId}</p>
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      value={user.persona ?? 'coach'}
                      onValueChange={value => void onPersonaChange(user, value as AccountPersona)}
                      disabled={busy}
                    >
                      <SelectTrigger className={`${ADMIN_SELECT_CLASS} h-8 w-32 text-xs`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={ADMIN_DIALOG_SELECT_CONTENT_CLASS}>
                        {accountPersonas.map(persona => (
                          <SelectItem key={persona} value={persona} className={ADMIN_DIALOG_SELECT_ITEM_CLASS}>
                            {personaLabel[persona]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={leaguePilot ? 'outline' : 'default'}
                      className={leaguePilot ? ADMIN_SECONDARY_ACTION_BUTTON_CLASS : undefined}
                      disabled={busy}
                      onClick={() => void onToggleLeaguePilot(user, !leaguePilot)}
                    >
                      {busy ? <Loader2 size={13} className="animate-spin" /> : leaguePilot ? <ShieldCheck size={13} /> : <KeyRound size={13} />}
                      {leaguePilot ? 'Revoke' : 'Grant'}
                    </Button>
                  </td>
                  <td className="px-3 py-2"><ManagedUserStatusBadges user={user} /></td>
                  <td className="px-3 py-2 text-muted-foreground">{user.lastActiveAt ? formatRelativeTime(user.lastActiveAt) : '-'}</td>
                </tr>
              );
            })}
          </CompactTable>
        )}
      </Section>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Section title="League requests" icon={Trophy}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-slate-400">{pendingRequests.length} pending request{pendingRequests.length === 1 ? '' : 's'} awaiting review.</p>
            <Button type="button" variant="outline" size="sm" className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS} onClick={onRefreshRequests} disabled={requestsState === 'loading'}>
              {requestsState === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />} Refresh
            </Button>
          </div>
          {requests.length === 0 ? (
            <EmptyState title={requestsState === 'loading' ? 'Loading requests...' : 'No League requests'} detail="Public League access submissions appear here and in the dedicated League access tab." />
          ) : (
            <CompactTable headers={['Status', 'Contact', 'League', 'Actions']} scrollHeightClassName="max-h-[20rem]">
              {requests.slice(0, 8).map(request => {
                const busy = actionId === request.id;
                return (
                  <tr key={request.id}>
                    <td className="px-3 py-2"><Badge variant="secondary">{leagueRequestStatusLabel[request.status]}</Badge></td>
                    <td className="px-3 py-2">
                      <p className="font-bold text-slate-100">{request.contact_name}</p>
                      <p className="text-[11px] text-slate-400">{request.contact_email}</p>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{request.league_name ?? request.organization ?? '-'}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1.5">
                        <Button type="button" size="sm" className="h-7 gap-1 px-2 text-[11px]" disabled={busy || request.status === 'provisioned'} onClick={() => void onProvision(request)}>
                          {busy ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />} Provision
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="h-7 gap-1 px-2 text-[11px]" disabled={busy || request.status === 'provisioned'} onClick={() => void onReview(request, 'rejected')}>
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </CompactTable>
          )}
        </Section>

        <Section title="Test account checklist" icon={ClipboardList}>
          <div className="space-y-2 text-xs font-medium leading-relaxed text-slate-300">
            <p className="rounded-xl border border-cyan-300/10 bg-white/[0.035] p-3">Owner: use this console at <span className="font-black text-slate-100">/#admin</span>.</p>
            <p className="rounded-xl border border-cyan-300/10 bg-white/[0.035] p-3">Coach tester: keep persona <span className="font-black text-slate-100">Coach</span> and open <span className="font-black text-slate-100">/#/app</span>.</p>
            <p className="rounded-xl border border-cyan-300/10 bg-white/[0.035] p-3">League tester: set persona <span className="font-black text-slate-100">League</span>, grant <span className="font-black text-slate-100">league_pilot</span>, then open <span className="font-black text-slate-100">/#/league</span>.</p>
            <p className="rounded-xl border border-cyan-300/10 bg-white/[0.035] p-3">Player tester: set persona <span className="font-black text-slate-100">Player</span> and open <span className="font-black text-slate-100">/#/player</span>.</p>
          </div>
        </Section>
      </div>
    </div>
  );
};

const LeagueAccessPanel = ({
  requests,
  loadState,
  actionId,
  onRefresh,
  onProvision,
  onReview
}: {
  requests: LeagueAccessRequestRecord[];
  loadState: 'idle' | 'loading' | 'ready' | 'error';
  actionId: string | null;
  onRefresh: () => void;
  onProvision: (request: LeagueAccessRequestRecord) => Promise<void>;
  onReview: (request: LeagueAccessRequestRecord, status: LeagueAccessRequestStatus) => Promise<void>;
}) => {
  const pendingCount = requests.filter(request => request.status === 'pending').length;
  const provisionedCount = requests.filter(request => request.status === 'provisioned').length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Open requests" value={pendingCount} detail="Waitlist entries awaiting review." />
        <StatTile label="Provisioned" value={provisionedCount} detail="League owners granted the pilot entitlement." />
        <StatTile label="Total requests" value={requests.length} detail="All League access submissions." />
      </div>

      <Section title="League access requests" icon={Trophy}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-slate-400">
            Provisioning sets the account persona to League and grants the <span className="font-black text-slate-200">league_pilot</span> entitlement.
            The owner account must already exist in Users (create it there first if needed).
          </p>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onRefresh} disabled={loadState === 'loading'}>
            {loadState === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />} Refresh
          </Button>
        </div>

        {requests.length === 0 ? (
          <EmptyState
            title={loadState === 'loading' ? 'Loading requests…' : 'No League access requests yet'}
            detail="Requests submitted through the public League door appear here for review and provisioning."
          />
        ) : (
          <CompactTable headers={['Status', 'Contact', 'Organization', 'League', 'Submitted', 'Actions']} scrollHeightClassName="max-h-[32rem]">
            {requests.map(request => {
              const busy = actionId === request.id;
              return (
                <tr key={request.id}>
                  <td className="px-3 py-2"><Badge variant="secondary">{leagueRequestStatusLabel[request.status]}</Badge></td>
                  <td className="px-3 py-2">
                    <div className="font-bold text-slate-100">{request.contact_name}</div>
                    <div className="text-slate-400">{request.contact_email}</div>
                  </td>
                  <td className="px-3 py-2">{request.organization ?? '—'}</td>
                  <td className="px-3 py-2">{request.league_name ?? '—'}</td>
                  <td className="px-3 py-2">{formatDateTime(request.created_at)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 gap-1 px-2 text-[11px]"
                        disabled={busy || request.status === 'provisioned'}
                        onClick={() => void onProvision(request)}
                      >
                        {busy ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />} Provision
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 px-2 text-[11px]"
                        disabled={busy || request.status === 'provisioned'}
                        onClick={() => void onReview(request, 'rejected')}
                      >
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </CompactTable>
        )}
      </Section>
    </div>
  );
};

const MarketingPanel = ({
  promotions,
  announcements,
  loadState,
  onRefresh,
  onSavePromotion,
  onTogglePromotion,
  onDeletePromotion,
  onSaveAnnouncement,
  onToggleAnnouncement,
  onDeleteAnnouncement
}: {
  promotions: PromotionRecord[];
  announcements: AnnouncementRecord[];
  loadState: 'idle' | 'loading' | 'ready' | 'error';
  onRefresh: () => void;
  onSavePromotion: (input: PromotionInput, promotionId: string | null) => Promise<void>;
  onTogglePromotion: (promotion: PromotionRecord) => Promise<void>;
  onDeletePromotion: (promotion: PromotionRecord) => Promise<void>;
  onSaveAnnouncement: (input: AnnouncementInput, announcementId: string | null) => Promise<void>;
  onToggleAnnouncement: (announcement: AnnouncementRecord) => Promise<void>;
  onDeleteAnnouncement: (announcement: AnnouncementRecord) => Promise<void>;
}) => {
  const [promotionId, setPromotionId] = useState<string | null>(null);
  const [promotionName, setPromotionName] = useState('');
  const [promotionHeadline, setPromotionHeadline] = useState('');
  const [promotionDescription, setPromotionDescription] = useState('');
  const [promotionType, setPromotionType] = useState<PromotionDiscountType>('percent');
  const [promotionValue, setPromotionValue] = useState('20');
  const [promotionStarts, setPromotionStarts] = useState('');
  const [promotionEnds, setPromotionEnds] = useState('');
  const [promotionActive, setPromotionActive] = useState(true);
  const [promotionBusy, setPromotionBusy] = useState(false);

  const [announcementId, setAnnouncementId] = useState<string | null>(null);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [announcementKind, setAnnouncementKind] = useState<AnnouncementKind>('info');
  const [announcementPublished, setAnnouncementPublished] = useState(true);
  const [announcementStarts, setAnnouncementStarts] = useState('');
  const [announcementEnds, setAnnouncementEnds] = useState('');
  const [announcementBusy, setAnnouncementBusy] = useState(false);

  const [busyRowId, setBusyRowId] = useState<string | null>(null);

  const resetPromotionForm = () => {
    setPromotionId(null);
    setPromotionName('');
    setPromotionHeadline('');
    setPromotionDescription('');
    setPromotionType('percent');
    setPromotionValue('20');
    setPromotionStarts('');
    setPromotionEnds('');
    setPromotionActive(true);
  };

  const resetAnnouncementForm = () => {
    setAnnouncementId(null);
    setAnnouncementTitle('');
    setAnnouncementBody('');
    setAnnouncementKind('info');
    setAnnouncementPublished(true);
    setAnnouncementStarts('');
    setAnnouncementEnds('');
  };

  const editPromotion = (promotion: PromotionRecord) => {
    setPromotionId(promotion.id);
    setPromotionName(promotion.name);
    setPromotionHeadline(promotion.headline ?? '');
    setPromotionDescription(promotion.description ?? '');
    setPromotionType(promotion.discount_type);
    setPromotionValue(String(promotion.discount_value));
    setPromotionStarts(promotion.starts_at.slice(0, 10));
    setPromotionEnds(promotion.ends_at ? promotion.ends_at.slice(0, 10) : '');
    setPromotionActive(promotion.is_active);
  };

  const editAnnouncement = (announcement: AnnouncementRecord) => {
    setAnnouncementId(announcement.id);
    setAnnouncementTitle(announcement.title);
    setAnnouncementBody(announcement.body);
    setAnnouncementKind(announcement.kind);
    setAnnouncementPublished(announcement.is_published);
    setAnnouncementStarts(announcement.starts_at.slice(0, 10));
    setAnnouncementEnds(announcement.ends_at ? announcement.ends_at.slice(0, 10) : '');
  };

  const submitPromotion = async () => {
    setPromotionBusy(true);
    try {
      await onSavePromotion({
        name: promotionName,
        headline: promotionHeadline.trim() || null,
        description: promotionDescription.trim() || null,
        discountType: promotionType,
        discountValue: Number(promotionValue),
        startsAt: promotionStarts ? new Date(`${promotionStarts}T00:00:00`).toISOString() : null,
        endsAt: promotionEnds ? new Date(`${promotionEnds}T23:59:59`).toISOString() : null,
        isActive: promotionActive
      }, promotionId);
      resetPromotionForm();
    } catch {
      // The console view surfaces the error message.
    } finally {
      setPromotionBusy(false);
    }
  };

  const submitAnnouncement = async () => {
    setAnnouncementBusy(true);
    try {
      await onSaveAnnouncement({
        title: announcementTitle,
        body: announcementBody,
        kind: announcementKind,
        isPublished: announcementPublished,
        startsAt: announcementStarts ? new Date(`${announcementStarts}T00:00:00`).toISOString() : null,
        endsAt: announcementEnds ? new Date(`${announcementEnds}T23:59:59`).toISOString() : null
      }, announcementId);
      resetAnnouncementForm();
    } catch {
      // The console view surfaces the error message.
    } finally {
      setAnnouncementBusy(false);
    }
  };

  const runRowAction = async (rowId: string, action: () => Promise<void>) => {
    setBusyRowId(rowId);
    try {
      await action();
    } catch {
      // The console view surfaces the error message.
    } finally {
      setBusyRowId(null);
    }
  };

  const livePromotions = promotions.filter(promotion => promotionStatus(promotion).label === 'Live').length;
  const liveAnnouncements = announcements.filter(announcement => announcementStatus(announcement).label === 'Live').length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Promotions" value={promotions.length} detail="Discount and sale campaigns created." />
        <StatTile label="Live promotions" value={livePromotions} detail="Shown on the landing page pricing right now." />
        <StatTile label="Announcements" value={announcements.length} detail="Product announcements created." />
        <StatTile label="Live announcements" value={liveAnnouncements} detail="Shown to app users right now." />
      </div>

      {loadState === 'error' && (
        <div className={ADMIN_WARNING_CLASS}>
          Marketing data could not load.
          <Button type="button" variant="outline" size="sm" onClick={onRefresh} className="ml-2 h-7">
            <RefreshCcw size={12} /> Retry
          </Button>
        </div>
      )}

      <Section title="Discounts and sales" icon={Tag}>
        <div className={`${ADMIN_SUBTLE_CARD_CLASS} p-4`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-black uppercase text-slate-200">
              {promotionId ? 'Edit promotion' : 'New promotion'}
            </h3>
            {promotionId && (
              <Button type="button" variant="ghost" size="sm" onClick={resetPromotionForm} className="h-7 text-xs">
                Cancel edit
              </Button>
            )}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1.5 xl:col-span-2">
              <Label htmlFor="promotion-name" className="normal-case tracking-normal text-slate-300">Name</Label>
              <Input
                id="promotion-name"
                value={promotionName}
                onChange={event => setPromotionName(event.target.value)}
                maxLength={120}
                placeholder="e.g. Season kickoff sale"
                className={ADMIN_DIALOG_FIELD_CLASS}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="promotion-type" className="normal-case tracking-normal text-slate-300">Discount type</Label>
              <Select value={promotionType} onValueChange={value => setPromotionType(value as PromotionDiscountType)}>
                <SelectTrigger id="promotion-type" className={ADMIN_DIALOG_FIELD_CLASS}><SelectValue /></SelectTrigger>
                <SelectContent className={ADMIN_DIALOG_SELECT_CONTENT_CLASS}>
                  <SelectItem value="percent" className={ADMIN_DIALOG_SELECT_ITEM_CLASS}>Percent off</SelectItem>
                  <SelectItem value="fixed" className={ADMIN_DIALOG_SELECT_ITEM_CLASS}>Fixed amount off (PHP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="promotion-value" className="normal-case tracking-normal text-slate-300">
                {promotionType === 'percent' ? 'Percent off' : 'Amount off (PHP)'}
              </Label>
              <Input
                id="promotion-value"
                type="number"
                min={1}
                max={promotionType === 'percent' ? 100 : undefined}
                value={promotionValue}
                onChange={event => setPromotionValue(event.target.value)}
                className={ADMIN_DIALOG_FIELD_CLASS}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2 xl:col-span-4">
              <Label htmlFor="promotion-headline" className="normal-case tracking-normal text-slate-300">Headline (shown on the landing page)</Label>
              <Input
                id="promotion-headline"
                value={promotionHeadline}
                onChange={event => setPromotionHeadline(event.target.value)}
                maxLength={160}
                placeholder="e.g. 20% off Premium until the season opener"
                className={ADMIN_DIALOG_FIELD_CLASS}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2 xl:col-span-4">
              <Label htmlFor="promotion-description" className="normal-case tracking-normal text-slate-300">Details (optional)</Label>
              <Textarea
                id="promotion-description"
                value={promotionDescription}
                onChange={event => setPromotionDescription(event.target.value)}
                rows={2}
                maxLength={1000}
                placeholder="Internal notes or extra copy for the offer."
                className={ADMIN_DIALOG_FIELD_CLASS}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="promotion-starts" className="normal-case tracking-normal text-slate-300">Starts</Label>
              <Input
                id="promotion-starts"
                type="date"
                value={promotionStarts}
                onChange={event => setPromotionStarts(event.target.value)}
                className={ADMIN_DIALOG_FIELD_CLASS}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="promotion-ends" className="normal-case tracking-normal text-slate-300">Ends (optional)</Label>
              <Input
                id="promotion-ends"
                type="date"
                value={promotionEnds}
                onChange={event => setPromotionEnds(event.target.value)}
                className={ADMIN_DIALOG_FIELD_CLASS}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="promotion-active" className="normal-case tracking-normal text-slate-300">Status</Label>
              <Select value={promotionActive ? 'active' : 'inactive'} onValueChange={value => setPromotionActive(value === 'active')}>
                <SelectTrigger id="promotion-active" className={ADMIN_DIALOG_FIELD_CLASS}><SelectValue /></SelectTrigger>
                <SelectContent className={ADMIN_DIALOG_SELECT_CONTENT_CLASS}>
                  <SelectItem value="active" className={ADMIN_DIALOG_SELECT_ITEM_CLASS}>Active</SelectItem>
                  <SelectItem value="inactive" className={ADMIN_DIALOG_SELECT_ITEM_CLASS}>Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                disabled={promotionBusy || !promotionName.trim() || !Number(promotionValue)}
                onClick={() => void submitPromotion()}
                className="w-full"
              >
                {promotionBusy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {promotionId ? 'Save changes' : 'Create promotion'}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          {promotions.length === 0 ? (
            <EmptyState title="No promotions yet" detail="Create a discount or sale above. Live promotions appear automatically on the landing page pricing section." />
          ) : (
            <CompactTable headers={['Promotion', 'Discount', 'Window', 'Status', 'Actions']}>
              {promotions.map(promotion => {
                const status = promotionStatus(promotion);
                const busy = busyRowId === promotion.id;
                return (
                  <tr key={promotion.id}>
                    <td className="px-3 py-2">
                      <p className="font-bold text-foreground">{promotion.name}</p>
                      {promotion.headline && <p className="mt-0.5 max-w-[18rem] truncate text-[10px] text-muted-foreground">{promotion.headline}</p>}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{discountLabel(promotion)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{scheduleWindowLabel(promotion.starts_at, promotion.ends_at)}</td>
                    <td className="px-3 py-2">{statusChip(status.label, status.tone)}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => editPromotion(promotion)} className="h-7 px-2 text-xs">
                          <Pencil size={12} /> Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void runRowAction(promotion.id, () => onTogglePromotion(promotion))}
                          className="h-7 px-2 text-xs"
                        >
                          {busy ? <Loader2 size={12} className="animate-spin" /> : <Tag size={12} />}
                          {promotion.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => {
                            if (window.confirm(`Delete promotion "${promotion.name}"? This cannot be undone.`)) {
                              void runRowAction(promotion.id, () => onDeletePromotion(promotion));
                            }
                          }}
                          className="h-7 px-2 text-xs text-red-300 hover:text-red-200"
                        >
                          <Trash2 size={12} /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </CompactTable>
          )}
        </div>
      </Section>

      <Section title="Announcements" icon={Megaphone}>
        <div className={`${ADMIN_SUBTLE_CARD_CLASS} p-4`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-black uppercase text-slate-200">
              {announcementId ? 'Edit announcement' : 'New announcement'}
            </h3>
            {announcementId && (
              <Button type="button" variant="ghost" size="sm" onClick={resetAnnouncementForm} className="h-7 text-xs">
                Cancel edit
              </Button>
            )}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1.5 xl:col-span-2">
              <Label htmlFor="announcement-title" className="normal-case tracking-normal text-slate-300">Title</Label>
              <Input
                id="announcement-title"
                value={announcementTitle}
                onChange={event => setAnnouncementTitle(event.target.value)}
                maxLength={160}
                placeholder="e.g. Scheduled maintenance this Sunday"
                className={ADMIN_DIALOG_FIELD_CLASS}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="announcement-kind" className="normal-case tracking-normal text-slate-300">Type</Label>
              <Select value={announcementKind} onValueChange={value => setAnnouncementKind(value as AnnouncementKind)}>
                <SelectTrigger id="announcement-kind" className={ADMIN_DIALOG_FIELD_CLASS}><SelectValue /></SelectTrigger>
                <SelectContent className={ADMIN_DIALOG_SELECT_CONTENT_CLASS}>
                  {(Object.keys(announcementKindLabel) as AnnouncementKind[]).map(kind => (
                    <SelectItem key={kind} value={kind} className={ADMIN_DIALOG_SELECT_ITEM_CLASS}>{announcementKindLabel[kind]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="announcement-published" className="normal-case tracking-normal text-slate-300">Status</Label>
              <Select value={announcementPublished ? 'published' : 'draft'} onValueChange={value => setAnnouncementPublished(value === 'published')}>
                <SelectTrigger id="announcement-published" className={ADMIN_DIALOG_FIELD_CLASS}><SelectValue /></SelectTrigger>
                <SelectContent className={ADMIN_DIALOG_SELECT_CONTENT_CLASS}>
                  <SelectItem value="published" className={ADMIN_DIALOG_SELECT_ITEM_CLASS}>Published</SelectItem>
                  <SelectItem value="draft" className={ADMIN_DIALOG_SELECT_ITEM_CLASS}>Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2 xl:col-span-4">
              <Label htmlFor="announcement-body" className="normal-case tracking-normal text-slate-300">Message</Label>
              <Textarea
                id="announcement-body"
                value={announcementBody}
                onChange={event => setAnnouncementBody(event.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="What users should know. Shown as a banner inside the app while the announcement is live."
                className={ADMIN_DIALOG_FIELD_CLASS}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="announcement-starts" className="normal-case tracking-normal text-slate-300">Starts</Label>
              <Input
                id="announcement-starts"
                type="date"
                value={announcementStarts}
                onChange={event => setAnnouncementStarts(event.target.value)}
                className={ADMIN_DIALOG_FIELD_CLASS}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="announcement-ends" className="normal-case tracking-normal text-slate-300">Ends (optional)</Label>
              <Input
                id="announcement-ends"
                type="date"
                value={announcementEnds}
                onChange={event => setAnnouncementEnds(event.target.value)}
                className={ADMIN_DIALOG_FIELD_CLASS}
              />
            </div>
            <div className="flex items-end sm:col-span-2">
              <Button
                type="button"
                disabled={announcementBusy || !announcementTitle.trim() || !announcementBody.trim()}
                onClick={() => void submitAnnouncement()}
                className="w-full sm:w-auto"
              >
                {announcementBusy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {announcementId ? 'Save changes' : 'Create announcement'}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          {announcements.length === 0 ? (
            <EmptyState title="No announcements yet" detail="Published announcements appear as a banner inside the app for every user while they are live." />
          ) : (
            <CompactTable headers={['Announcement', 'Type', 'Window', 'Status', 'Actions']}>
              {announcements.map(announcement => {
                const status = announcementStatus(announcement);
                const busy = busyRowId === announcement.id;
                return (
                  <tr key={announcement.id}>
                    <td className="px-3 py-2">
                      <p className="font-bold text-foreground">{announcement.title}</p>
                      <p className="mt-0.5 max-w-[18rem] truncate text-[10px] text-muted-foreground">{announcement.body}</p>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{announcementKindLabel[announcement.kind]}</td>
                    <td className="px-3 py-2 text-muted-foreground">{scheduleWindowLabel(announcement.starts_at, announcement.ends_at)}</td>
                    <td className="px-3 py-2">{statusChip(status.label, status.tone)}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => editAnnouncement(announcement)} className="h-7 px-2 text-xs">
                          <Pencil size={12} /> Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void runRowAction(announcement.id, () => onToggleAnnouncement(announcement))}
                          className="h-7 px-2 text-xs"
                        >
                          {busy ? <Loader2 size={12} className="animate-spin" /> : <Megaphone size={12} />}
                          {announcement.is_published ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => {
                            if (window.confirm(`Delete announcement "${announcement.title}"? This cannot be undone.`)) {
                              void runRowAction(announcement.id, () => onDeleteAnnouncement(announcement));
                            }
                          }}
                          className="h-7 px-2 text-xs text-red-300 hover:text-red-200"
                        >
                          <Trash2 size={12} /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </CompactTable>
          )}
        </div>
      </Section>
    </div>
  );
};

const RecoveryPanel = ({
  workspaces,
  restoringWorkspaceId,
  onRestore
}: {
  workspaces: AdminRecoverableWorkspace[];
  restoringWorkspaceId: string | null;
  onRestore: (workspace: AdminRecoverableWorkspace) => void;
}) => (
  <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-3">
      <StatTile label="Recoverable" value={workspaces.length} detail="Soft-deleted or pending-deletion workspaces." />
      <StatTile label="Pending deletion" value={workspaces.filter(workspace => workspace.state === 'pending_deletion').length} detail="Owner deletion requests that can be cancelled." />
      <StatTile label="Deleted" value={workspaces.filter(workspace => workspace.state === 'deleted').length} detail="Soft-deleted workspaces still retained in cloud data." />
    </div>

    <Section title="Workspace recovery" icon={RefreshCcw}>
      {workspaces.length === 0 ? (
        <EmptyState title="No recoverable workspaces" detail="Workspaces marked pending deletion or soft deleted will appear here for owner-level recovery." />
      ) : (
        <CompactTable headers={['Workspace', 'Owner', 'State', 'Members', 'Last active', 'Updated', 'Action']}>
          {workspaces.map(workspace => {
            const restoring = restoringWorkspaceId === workspace.clubId;
            return (
              <tr key={workspace.clubId}>
                <td className="px-3 py-2">
                  <p className="font-bold text-foreground">{workspace.name}</p>
                  <p className="mt-0.5 max-w-[14rem] truncate font-mono text-[10px] text-muted-foreground">{workspace.clubId}</p>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{workspace.ownerEmail || workspace.ownerUserId.slice(0, 12)}</td>
                <td className="px-3 py-2">
                  <Badge variant={workspace.state === 'pending_deletion' ? 'outline' : 'secondary'}>
                    {workspace.state === 'pending_deletion' ? 'Pending deletion' : 'Deleted'}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{workspace.memberCount}</td>
                <td className="px-3 py-2 text-muted-foreground">{workspace.lastActiveAt ? formatRelativeTime(workspace.lastActiveAt) : '-'}</td>
                <td className="px-3 py-2 text-muted-foreground" title={formatDateTime(workspace.updatedAt)}>{formatRelativeTime(workspace.updatedAt)}</td>
                <td className="px-3 py-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onRestore(workspace)}
                    disabled={restoring}
                    className="h-8"
                  >
                    {restoring ? <Loader2 size={13} className="animate-spin" /> : <RefreshCcw size={13} />}
                    Restore
                  </Button>
                </td>
              </tr>
            );
          })}
        </CompactTable>
      )}
    </Section>
  </div>
);

const ExportsPanel = ({
  snapshot,
  metrics,
  onExport
}: {
  snapshot: AdminConsoleSnapshot;
  metrics: AdminGrowthMetrics | null;
  onExport: (kind: 'feedback' | 'usage' | 'fprds' | 'users' | 'leads') => void;
}) => {
  const premiumLeadCount = snapshot.feedback.filter(isPremiumLeadFeedback).length;
  return (
  <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile label="Recent exports" value={metrics?.exports.recentExportCount ?? 0} detail="Audited export actions in this window." />
      <StatTile label="Feedback rows" value={snapshot.feedback.length} detail="Ready for CSV export." />
      <StatTile label="Premium leads" value={premiumLeadCount} detail="Landing-page Premium beta interest." />
      <StatTile label="FPRDS rows" value={snapshot.fprdsSubmissions.length} detail="Review queue export." />
    </div>
    <Section title="Create export" icon={Download}>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => onExport('feedback')} className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS}><Download size={14} /> Feedback CSV</Button>
        <Button type="button" variant="outline" onClick={() => onExport('leads')} disabled={premiumLeadCount === 0} className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS}><Download size={14} /> Premium leads CSV</Button>
        <Button type="button" variant="outline" onClick={() => onExport('usage')} className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS}><Download size={14} /> Usage CSV</Button>
        <Button type="button" variant="outline" onClick={() => onExport('fprds')} className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS}><Download size={14} /> FPRDS CSV</Button>
        <Button type="button" variant="outline" onClick={() => onExport('users')} disabled={!metrics} className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS}><Download size={14} /> Users CSV</Button>
      </div>
    </Section>
    <Section title="Recent export audit" icon={FileText}>
      {metrics?.exports.recentExports.length ? (
        <CompactTable headers={['Actor', 'Role', 'Metadata', 'When']}>
          {metrics.exports.recentExports.map(exportEvent => (
            <tr key={exportEvent.id}>
              <td className="px-3 py-2 font-bold text-foreground">{exportEvent.actorUserId?.slice(0, 12) ?? '-'}</td>
              <td className="px-3 py-2 text-muted-foreground">{exportEvent.actorRole ? roleLabel[exportEvent.actorRole] : '-'}</td>
              <td className="px-3 py-2 text-muted-foreground">{JSON.stringify(exportEvent.metadata)}</td>
              <td className="px-3 py-2 text-muted-foreground">{formatRelativeTime(exportEvent.createdAt)}</td>
            </tr>
          ))}
        </CompactTable>
      ) : (
        <EmptyState title="No exports yet" detail="CSV export actions are recorded in admin audit events." />
      )}
    </Section>
  </div>
  );
};

const AlertsPanel = ({ snapshot, securityMetrics, growthMetrics }: {
  snapshot: AdminConsoleSnapshot;
  securityMetrics: AdminSecurityMetrics | null;
  growthMetrics: AdminGrowthMetrics | null;
}) => {
  const openHighPriority = snapshot.feedback.filter(item => ['high', 'blocking'].includes(item.urgency) && !['resolved', 'closed'].includes(item.status)).length;
  const derivedAlerts = [
    ...(growthMetrics?.alerts ?? []),
    ...(securityMetrics?.warnings ?? []),
    ...(openHighPriority ? [`${openHighPriority} high-priority feedback items are open.`] : []),
    ...(growthMetrics?.billingReadiness.failedWebhookEvents ? [`${growthMetrics.billingReadiness.failedWebhookEvents} billing webhook events failed.`] : [])
  ];
  const uniqueAlerts = Array.from(new Set(derivedAlerts));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Alerts" value={uniqueAlerts.length} detail="Current admin attention items." />
        <StatTile label="Denied access" value={securityMetrics?.deniedAccessCount ?? 0} detail="Security access denials in window." />
        <StatTile label="Stale FPRDS" value={growthMetrics?.fprdsAnalytics.pendingOlderThan7d ?? 0} detail="Pending more than seven days." />
        <StatTile label="High feedback" value={openHighPriority} detail="Open high/blocking feedback." />
      </div>
      <Section title="Daily health summary" icon={Bell}>
        {uniqueAlerts.length ? (
          <div className="space-y-2">
            {uniqueAlerts.map(alert => (
              <div key={alert} className={ADMIN_WARNING_CLASS}>{alert}</div>
            ))}
          </div>
        ) : (
          <EmptyState title="No active alerts" detail="Security, product, feedback, FPRDS, and billing warning rules are currently quiet." />
        )}
      </Section>
    </div>
  );
};

const AdminMfaGate = ({
  admin,
  assuranceLevel,
  factors,
  enrollment,
  challenge,
  code,
  message,
  busy,
  onCodeChange,
  onEnroll,
  onChallenge,
  onVerify,
  onRefresh,
  onSignOut
}: {
  admin: AppAdminProfile;
  assuranceLevel: string | null;
  factors: MfaFactor[];
  enrollment: TotpEnrollment | null;
  challenge: MfaChallenge | null;
  code: string;
  message: string;
  busy: boolean;
  onCodeChange: (value: string) => void;
  onEnroll: () => void;
  onChallenge: (factorId: string) => void;
  onVerify: (factorId: string, challengeId: string) => void;
  onRefresh: () => void;
  onSignOut: () => void;
}) => {
  const verifiedTotp = factors.filter(factor => factor.factorType === 'totp' && factor.status === 'verified');
  const activeFactorId = enrollment?.factorId ?? verifiedTotp[0]?.id ?? null;
  const activeChallengeId = challenge?.challengeId ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Section title="MFA required" icon={KeyRound}>
        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold leading-relaxed text-foreground">
              {roleLabel[admin.role]} access requires a verified authenticator session before admin data loads.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <StatTile label="Role" value={roleLabel[admin.role]} detail="Role from public.app_admins." />
              <StatTile label="Session AAL" value={assuranceLevel ?? 'Unknown'} detail="Supabase assurance claim." />
              <StatTile label="TOTP factors" value={verifiedTotp.length} detail="Verified authenticator factors." />
            </div>
            {message && (
              <div className="mt-4 rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                {message}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {verifiedTotp.length === 0 ? (
                <Button type="button" onClick={onEnroll} disabled={busy}>
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />} Set up authenticator
                </Button>
              ) : (
                <Button type="button" onClick={() => onChallenge(verifiedTotp[0].id)} disabled={busy}>
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />} Verify authenticator
                </Button>
              )}
              <Button type="button" variant="outline" onClick={onRefresh} disabled={busy}>
                <RefreshCcw size={14} /> Refresh status
              </Button>
              <Button type="button" variant="ghost" onClick={onSignOut}>
                <LogOut size={14} /> Sign out
              </Button>
            </div>
          </div>
          <div className={`${ADMIN_SUBTLE_CARD_CLASS} p-4`}>
            {enrollment ? (
              <div className="space-y-3">
                <p className="text-xs font-black uppercase text-muted-foreground">Scan QR code</p>
                <img src={enrollment.qrCode} alt="Dumala Admin Console authenticator QR code" className="mx-auto aspect-square w-48 rounded-xl border border-cyan-300/10 bg-white p-2 shadow-lg shadow-black/20" />
                <div>
                  <Label htmlFor="mfa-secret" className="normal-case tracking-normal">Manual secret</Label>
                  <input id="mfa-secret" readOnly value={enrollment.secret} className={`mt-1 w-full ${ADMIN_INPUT_CLASS}`} />
                </div>
              </div>
            ) : verifiedTotp.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-black uppercase text-muted-foreground">Verified factors</p>
                {verifiedTotp.map(factor => (
                  <div key={factor.id} className={`${ADMIN_SUBTLE_CARD_CLASS} px-3 py-2`}>
                    <p className="text-sm font-black text-foreground">{factor.friendlyName || 'Authenticator app'}</p>
                    <p className="text-[11px] font-medium text-muted-foreground">Added {formatDateTime(factor.createdAt)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No authenticator enrolled" detail="Set up TOTP with an authenticator app, then enter the six-digit code to promote this session to aal2." />
            )}
          </div>
        </div>
        {(enrollment || activeChallengeId) && activeFactorId && (
          <div className={`${ADMIN_SUBTLE_CARD_CLASS} mt-4 p-4`}>
            <Label htmlFor="mfa-code" className="normal-case tracking-normal">Six-digit authenticator code</Label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="mfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={event => onCodeChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
                className="h-10 rounded-xl border border-cyan-300/10 bg-[#0b1726]/85 px-3 text-sm font-black tracking-widest text-slate-100 outline-none ring-orange-300/15 transition focus:border-orange-300/60 focus:ring-2"
              />
              <Button
                type="button"
                disabled={busy || code.length < 6}
                onClick={() => {
                  if (activeChallengeId) {
                    onVerify(activeFactorId, activeChallengeId);
                  } else {
                    onChallenge(activeFactorId);
                  }
                }}
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                {activeChallengeId ? 'Verify code' : 'Start verification'}
              </Button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
};

const SecurityPanel = ({
  metrics,
  assuranceLevel,
  factors,
  onRefresh,
  onSignOut
}: {
  metrics: AdminSecurityMetrics | null;
  assuranceLevel: string | null;
  factors: MfaFactor[];
  onRefresh: () => void;
  onSignOut: () => void;
}) => {
  const verifiedFactors = factors.filter(factor => factor.status === 'verified');

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="AAL" value={assuranceLevel ?? 'Unknown'} detail="Current Supabase session assurance." />
        <StatTile label="MFA factors" value={verifiedFactors.length} detail="Verified factors on this account." />
        <StatTile label="Active admins" value={metrics?.admins.filter(admin => !admin.revokedAt).length ?? 0} detail="Admin users not revoked." />
        <StatTile label="Denied attempts" value={metrics?.deniedAccessCount ?? 0} detail="Denied or MFA-required audit events." />
        <StatTile label="Active sessions" value={metrics?.activeSessionsNow ?? 0} detail="App sessions seen in five minutes." />
      </div>
      {metrics?.warnings.length ? (
        <Section title="Security warnings" icon={ShieldAlert}>
          <div className="space-y-2">
            {metrics.warnings.map(warning => (
              <div key={warning} className={ADMIN_WARNING_CLASS}>{warning}</div>
            ))}
          </div>
        </Section>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
        <Section title="Admin users" icon={UsersRound}>
          {metrics?.admins.length ? (
            <CompactTable headers={['User', 'Role', 'Granted', 'Status']}>
              {metrics.admins.map(admin => (
                <tr key={admin.userId}>
                  <td className="px-3 py-2 font-bold text-foreground">{admin.userId.slice(0, 12)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{roleLabel[admin.role]}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatRelativeTime(admin.grantedAt)}</td>
                  <td className="px-3 py-2"><Badge variant={admin.revokedAt ? 'destructive' : 'secondary'}>{admin.revokedAt ? 'Revoked' : 'Active'}</Badge></td>
                </tr>
              ))}
            </CompactTable>
          ) : (
            <EmptyState title="No admin metrics loaded" detail="Refresh security metrics after completing MFA." />
          )}
        </Section>
        <Section title="Recent audit events" icon={ShieldCheck}>
          {metrics?.recentAuditEvents.length ? (
            <CompactTable headers={['Event', 'Actor', 'Target', 'When']} scrollHeightClassName="max-h-[22rem]">
              {metrics.recentAuditEvents.slice(0, 25).map(event => (
                <tr key={event.id}>
                  <td className="px-3 py-2 font-bold text-foreground">{event.eventType.replaceAll('_', ' ')}</td>
                  <td className="px-3 py-2 text-muted-foreground">{event.actorRole ? roleLabel[event.actorRole] : 'Unknown'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{event.targetTable || '-'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatRelativeTime(event.createdAt)}</td>
                </tr>
              ))}
            </CompactTable>
          ) : (
            <EmptyState title="No audit events yet" detail="Sensitive reads, denied access, and admin actions will appear here." />
          )}
        </Section>
      </div>
      <Section title="Session actions" icon={LockKeyhole}>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={onRefresh} className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS}>
            <RefreshCcw size={14} /> Refresh security
          </Button>
          <Button type="button" variant="destructive" onClick={onSignOut}>
            <LogOut size={14} /> Sign out
          </Button>
        </div>
      </Section>
    </div>
  );
};

export default function AdminConsoleView() {
  const runtime = useCloudRuntime();
  const auth = useCloudAuth({
    enabled: runtime.enabled,
    auth: runtime.dataAccess?.auth ?? null
  });
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [adminProfile, setAdminProfile] = useState<AppAdminProfile | null>(null);
  const [assuranceLevel, setAssuranceLevel] = useState<string | null>(null);
  const [mfaFactors, setMfaFactors] = useState<MfaFactor[]>([]);
  const [totpEnrollment, setTotpEnrollment] = useState<TotpEnrollment | null>(null);
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallenge | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaBusy, setMfaBusy] = useState(false);
  const [snapshot, setSnapshot] = useState<AdminConsoleSnapshot | null>(null);
  const [securityMetrics, setSecurityMetrics] = useState<AdminSecurityMetrics | null>(null);
  const [growthMetrics, setGrowthMetrics] = useState<AdminGrowthMetrics | null>(null);
  const [activationFunnel, setActivationFunnel] = useState<ActivationFunnelStep[]>([]);
  const [storageMetrics, setStorageMetrics] = useState<AdminStorageMetrics | null>(null);
  const [recoverableWorkspaces, setRecoverableWorkspaces] = useState<AdminRecoverableWorkspace[]>([]);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error' | 'denied' | 'mfaRequired'>('idle');
  const [message, setMessage] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackSubmission | null>(null);
  const [selectedFprdsSubmission, setSelectedFprdsSubmission] = useState<FprdsBetaSubmission | null>(null);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [restoringWorkspaceId, setRestoringWorkspaceId] = useState<string | null>(null);
  const [benchmarkAnalysis, setBenchmarkAnalysis] = useState<FprdsBenchmarkAnalysisRow[]>([]);
  const [benchmarkReviews, setBenchmarkReviews] = useState<FprdsBenchmarkReview[]>([]);
  const [benchmarkCorrections, setBenchmarkCorrections] = useState<FprdsBenchmarkCorrection[]>([]);
  const [benchmarkLoadState, setBenchmarkLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [benchmarkMinSample, setBenchmarkMinSample] = useState(1);
  const [selectedBenchmarkReviewRow, setSelectedBenchmarkReviewRow] = useState<FprdsBenchmarkAnalysisRow | null>(null);
  const [selectedBenchmarkCorrectionRow, setSelectedBenchmarkCorrectionRow] = useState<FprdsBenchmarkAnalysisRow | null>(null);
  const [isSavingBenchmark, setIsSavingBenchmark] = useState(false);
  const [busyCorrectionId, setBusyCorrectionId] = useState<string | null>(null);
  const [managedUsers, setManagedUsers] = useState<AdminManagedUser[]>([]);
  const [managedUsersState, setManagedUsersState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [managedUserSearch, setManagedUserSearch] = useState('');
  const [selectedManagedUser, setSelectedManagedUser] = useState<AdminManagedUser | null>(null);
  const [accessActionUserId, setAccessActionUserId] = useState<string | null>(null);
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [marketingLoadState, setMarketingLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [leagueRequests, setLeagueRequests] = useState<LeagueAccessRequestRecord[]>([]);
  const [leagueAccessLoadState, setLeagueAccessLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [leagueActionId, setLeagueActionId] = useState<string | null>(null);

  const loadSnapshot = async () => {
    if (!runtime.enabled || auth.state.status !== 'signedIn') return;
    setLoadState('loading');
    setMessage('');
    try {
      const admin = await runtime.dataAccess.admin.getCurrentAdmin();
      if (!admin) {
        setAdminProfile(null);
        setSnapshot(null);
        setSecurityMetrics(null);
        setGrowthMetrics(null);
        setStorageMetrics(null);
        setRecoverableWorkspaces([]);
        setLoadState('denied');
        setMessage('Account is not authorized.');
        await runtime.dataAccess.admin.recordAuditEvent('admin_access_denied', { surface: 'admin_console' }).catch(() => undefined);
        return;
      }

      setAdminProfile(admin);
      if (!canUseTab(admin.role, activeTab)) setActiveTab('overview');
      const [assurance, factors] = await Promise.all([
        runtime.dataAccess.auth.getAuthenticatorAssuranceLevel(),
        runtime.dataAccess.auth.listMfaFactors()
      ]);
      setAssuranceLevel(assurance.currentLevel);
      setMfaFactors(factors);

      if (highPrivilegeRoles.has(admin.role) && assurance.currentLevel !== 'aal2') {
        setSnapshot(null);
        setSecurityMetrics(null);
        setGrowthMetrics(null);
        setStorageMetrics(null);
        setRecoverableWorkspaces([]);
        setLoadState('mfaRequired');
        setMessage('');
        await runtime.dataAccess.admin.recordAuditEvent('admin_mfa_required', { role: admin.role, surface: 'admin_console' }).catch(() => undefined);
        return;
      }

      const next = await runtime.dataAccess.admin.getSnapshot();
      setSnapshot(next);
      if (admin.role === 'owner') {
        const [security, growth, storage, recoverable, activation] = await Promise.allSettled([
          runtime.dataAccess.admin.getSecurityMetrics(),
          runtime.dataAccess.admin.getGrowthMetrics(),
          runtime.dataAccess.admin.getStorageMetrics(),
          runtime.dataAccess.admin.listRecoverableWorkspaces(),
          runtime.dataAccess.admin.getActivationFunnel()
        ]);
        setSecurityMetrics(security.status === 'fulfilled' ? security.value : null);
        setGrowthMetrics(growth.status === 'fulfilled' ? growth.value : null);
        setStorageMetrics(storage.status === 'fulfilled' ? storage.value : null);
        setRecoverableWorkspaces(recoverable.status === 'fulfilled' ? recoverable.value : []);
        setActivationFunnel(activation.status === 'fulfilled' ? activation.value : []);

        const ownerMetricErrors = [security, growth, storage, recoverable]
          .map(getSettledErrorMessage)
          .filter(Boolean);
        if (ownerMetricErrors.length > 0) setMessage(ownerMetricErrors[0]);
      } else {
        setSecurityMetrics(null);
        setGrowthMetrics(null);
        setStorageMetrics(null);
        setRecoverableWorkspaces([]);
        setActivationFunnel([]);
      }
      await runtime.dataAccess.admin.recordAuditEvent('admin_console_opened', { role: admin.role }).catch(() => undefined);
      setLoadState('ready');
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Admin console could not load.';
      const isDenied = text.includes('APP_ADMIN_ACCESS_DENIED') || text.includes('app_admins') || text.includes('not listed');
      setMessage(isDenied ? 'Account is not authorized.' : text);
      setLoadState(text.includes('ADMIN_MFA_REQUIRED') ? 'mfaRequired' : isDenied ? 'denied' : 'error');
    }
  };

  useEffect(() => {
    void loadSnapshot();
  }, [auth.state.status, runtime.enabled]);

  useEffect(() => {
    if (activeTab === 'benchmarks' && loadState === 'ready' && benchmarkLoadState === 'idle') {
      void loadBenchmarkData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, loadState, benchmarkLoadState]);

  useEffect(() => {
    if (activeTab === 'users' && loadState === 'ready' && managedUsersState === 'idle' && adminProfile?.role === 'owner') {
      void loadManagedUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, loadState, managedUsersState, adminProfile]);

  useEffect(() => {
    if (activeTab !== 'access' || loadState !== 'ready' || adminProfile?.role !== 'owner') return;
    if (managedUsersState === 'idle') void loadManagedUsers();
    if (leagueAccessLoadState === 'idle') void loadLeagueAccessRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, loadState, adminProfile, managedUsersState, leagueAccessLoadState]);

  useEffect(() => {
    if (activeTab === 'marketing' && loadState === 'ready' && marketingLoadState === 'idle') {
      void loadMarketingData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, loadState, marketingLoadState]);

  useEffect(() => {
    if (activeTab === 'league-access' && loadState === 'ready' && leagueAccessLoadState === 'idle') {
      void loadLeagueAccessRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, loadState, leagueAccessLoadState]);

  const onlineSessions = useMemo(
    () => snapshot?.activeSessions.filter(session => eventAgeMs(session.last_seen_at) < 5 * 60000) ?? [],
    [snapshot]
  );
  const visibleTabs = useMemo(
    () => adminTabs.filter(tab => canUseTab(adminProfile?.role, tab.id)),
    [adminProfile]
  );

  const refreshMfaState = async () => {
    if (!runtime.enabled) return;
    const [assurance, factors] = await Promise.all([
      runtime.dataAccess.auth.getAuthenticatorAssuranceLevel(),
      runtime.dataAccess.auth.listMfaFactors()
    ]);
    setAssuranceLevel(assurance.currentLevel);
    setMfaFactors(factors);
  };

  const handleEnrollTotp = async () => {
    if (!runtime.enabled) return;
    setMfaBusy(true);
    setMessage('');
    try {
      const enrollment = await runtime.dataAccess.auth.enrollTotpFactor();
      setTotpEnrollment(enrollment);
      setMfaChallenge(null);
      setMfaCode('');
      await refreshMfaState();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authenticator setup could not start.');
    } finally {
      setMfaBusy(false);
    }
  };

  const handleMfaChallenge = async (factorId: string) => {
    if (!runtime.enabled) return;
    setMfaBusy(true);
    setMessage('');
    try {
      const challenge = await runtime.dataAccess.auth.challengeMfaFactor(factorId);
      setMfaChallenge(challenge);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'MFA verification could not start.');
    } finally {
      setMfaBusy(false);
    }
  };

  const handleMfaVerify = async (factorId: string, challengeId: string) => {
    if (!runtime.enabled) return;
    setMfaBusy(true);
    setMessage('');
    try {
      await runtime.dataAccess.auth.verifyMfaChallenge(factorId, challengeId, mfaCode);
      setTotpEnrollment(null);
      setMfaChallenge(null);
      setMfaCode('');
      await refreshMfaState();
      await loadSnapshot();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'MFA code could not be verified.');
    } finally {
      setMfaBusy(false);
    }
  };

  const handleAdminSignOut = async () => {
    if (!runtime.enabled) return;
    await runtime.dataAccess.auth.signOut();
    setAdminProfile(null);
    setSnapshot(null);
    setSecurityMetrics(null);
    setGrowthMetrics(null);
    setStorageMetrics(null);
    setRecoverableWorkspaces([]);
    setLoadState('idle');
  };

  const handleExport = async (kind: 'feedback' | 'usage' | 'fprds' | 'users' | 'leads') => {
    if (!snapshot) return;
    const stamp = new Date().toISOString().slice(0, 10);

    if (kind === 'leads') {
      const leads = derivePremiumLeads(snapshot.feedback);
      downloadCsv(`dumala-premium-leads-${stamp}.csv`, ['id', 'status', 'name', 'organization', 'role', 'teams', 'email', 'notes', 'submitted_at'], leads.map(lead => [
        lead.id,
        lead.status,
        lead.name,
        lead.organization,
        lead.role,
        lead.teamCount,
        lead.email,
        lead.notes,
        lead.submittedAt
      ]));
    }

    if (kind === 'feedback') {
      downloadCsv(`dumala-feedback-${stamp}.csv`, ['id', 'status', 'urgency', 'category', 'area', 'subject', 'workspace', 'created_at'], snapshot.feedback.map(item => [
        item.id,
        item.status,
        item.urgency,
        item.category,
        item.affected_area,
        item.subject,
        item.team_workspace ?? '',
        item.created_at
      ]));
    }

    if (kind === 'usage') {
      downloadCsv(`dumala-usage-${stamp}.csv`, ['id', 'event_type', 'view', 'feature', 'device', 'browser', 'created_at'], snapshot.usageEvents.map(item => [
        item.id,
        item.event_type,
        item.view_name ?? '',
        item.feature_name ?? '',
        item.device_type ?? '',
        item.browser_family ?? '',
        item.created_at
      ]));
    }

    if (kind === 'fprds') {
      downloadCsv(`dumala-fprds-${stamp}.csv`, ['id', 'status', 'age_group', 'role', 'type', 'ovr', 'confidence', 'submitted_at'], snapshot.fprdsSubmissions.map(item => [
        item.id,
        item.review_status,
        item.age_group,
        item.role,
        item.assessment_type,
        item.ovr ?? '',
        item.coach_confidence ?? '',
        item.submitted_at
      ]));
    }

    if (kind === 'users' && growthMetrics) {
      downloadCsv(`dumala-users-${stamp}.csv`, ['user_id', 'email', 'display_name', 'state', 'workspaces', 'devices', 'feedback', 'fprds', 'last_active_at'], growthMetrics.recentUsers.map(user => [
        user.userId,
        user.email ?? '',
        user.displayName ?? '',
        user.accountState,
        user.workspaceCount,
        user.deviceCount,
        user.feedbackCount,
        user.fprdsCount,
        user.lastActiveAt ?? ''
      ]));
    }

    const rowCount = kind === 'users'
      ? growthMetrics?.recentUsers.length ?? 0
      : kind === 'usage'
        ? snapshot.usageEvents.length
        : kind === 'fprds'
          ? snapshot.fprdsSubmissions.length
          : kind === 'leads'
            ? snapshot.feedback.filter(isPremiumLeadFeedback).length
            : snapshot.feedback.length;

    if (runtime.enabled) {
      await runtime.dataAccess.admin.recordAuditEvent('admin_export', { kind, rowCount }).catch(() => undefined);
    }
  };

  const handleFeedbackStatusChange = async (feedbackId: string, status: FeedbackStatus) => {
    if (!runtime.enabled || !snapshot) return;
    const previous = snapshot.feedback;
    setSnapshot({
      ...snapshot,
      feedback: previous.map(item => item.id === feedbackId ? { ...item, status } : item)
    });
    try {
      const updated = await runtime.dataAccess.admin.updateFeedback(feedbackId, { status });
      setSnapshot(current => current ? {
        ...current,
        feedback: current.feedback.map(item => item.id === feedbackId ? updated : item)
      } : current);
    } catch (error) {
      setSnapshot(current => current ? { ...current, feedback: previous } : current);
      setMessage(error instanceof Error ? error.message : 'Feedback status could not be updated.');
    }
  };

  const handleFeedbackReviewSave = async (item: FeedbackSubmission, status: FeedbackStatus, adminNotes: string) => {
    if (!runtime.enabled || !snapshot) return;
    setIsSavingReview(true);
    setMessage('');
    try {
      const updated = await runtime.dataAccess.admin.updateFeedback(item.id, { status, adminNotes: adminNotes.trim() || null });
      setSnapshot(current => current ? {
        ...current,
        feedback: current.feedback.map(entry => entry.id === item.id ? updated : entry)
      } : current);
      setSelectedFeedback(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Feedback review could not be saved.');
    } finally {
      setIsSavingReview(false);
    }
  };

  const handleFprdsReviewSave = async (
    submission: FprdsBetaSubmission,
    reviewStatus: FprdsBetaReviewStatus,
    reviewerNotes: string,
    exclusionReason: string
  ) => {
    if (!runtime.enabled || !snapshot) return;
    setIsSavingReview(true);
    setMessage('');
    try {
      const updated = await runtime.dataAccess.admin.updateFprdsReview(submission.id, {
        reviewStatus,
        reviewerNotes: reviewerNotes.trim() || null,
        exclusionReason: reviewStatus === 'excluded' ? exclusionReason.trim() : null
      });
      setSnapshot(current => current ? {
        ...current,
        fprdsSubmissions: current.fprdsSubmissions.map(entry => entry.id === submission.id ? updated : entry)
      } : current);
      setSelectedFprdsSubmission(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'FPRDS review could not be saved.');
    } finally {
      setIsSavingReview(false);
    }
  };

  const loadBenchmarkData = async (sample = benchmarkMinSample) => {
    if (!runtime.enabled) return;
    setBenchmarkLoadState('loading');
    try {
      const [analysis, reviews, corrections] = await Promise.all([
        runtime.dataAccess.admin.getFprdsBenchmarkAnalysis(sample),
        runtime.dataAccess.admin.listFprdsBenchmarkReviews(),
        runtime.dataAccess.admin.listFprdsBenchmarkCorrections()
      ]);
      setBenchmarkAnalysis(analysis);
      setBenchmarkReviews(reviews);
      setBenchmarkCorrections(corrections);
      setBenchmarkLoadState('ready');
    } catch (error) {
      setBenchmarkLoadState('error');
      setMessage(error instanceof Error ? error.message : 'Benchmark analysis could not load.');
    }
  };

  const handleBenchmarkMinSampleChange = (value: number) => {
    setBenchmarkMinSample(value);
    void loadBenchmarkData(value);
  };

  const handleBenchmarkReviewSave = async (
    row: FprdsBenchmarkAnalysisRow,
    decision: FprdsBenchmarkReviewDecision,
    notes: string
  ) => {
    if (!runtime.enabled) return;
    setIsSavingBenchmark(true);
    setMessage('');
    try {
      const created = await runtime.dataAccess.admin.createFprdsBenchmarkReview({
        drillId: row.drillId,
        attributeId: row.attributeId,
        ageGroup: row.ageGroup,
        role: row.role,
        benchmarkVersion: row.benchmarkVersion,
        sampleSize: row.sampleSize,
        distributionSummary: {
          median: row.median,
          p10: row.p10,
          p25: row.p25,
          p75: row.p75,
          p90: row.p90,
          avg: row.avg,
          avgScore: row.avgScore,
          tierDistribution: row.tierDistribution
        },
        reviewDecision: decision,
        reviewerNotes: notes.trim() || null
      });
      setBenchmarkReviews(current => [created, ...current]);
      setSelectedBenchmarkReviewRow(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Benchmark review could not be saved.');
    } finally {
      setIsSavingBenchmark(false);
    }
  };

  const handleBenchmarkCorrectionSave = async (input: FprdsBenchmarkCorrectionInput) => {
    if (!runtime.enabled) return;
    setIsSavingBenchmark(true);
    setMessage('');
    try {
      const created = await runtime.dataAccess.admin.createFprdsBenchmarkCorrection(input);
      setBenchmarkCorrections(current => [created, ...current]);
      setSelectedBenchmarkCorrectionRow(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Benchmark correction could not be saved.');
    } finally {
      setIsSavingBenchmark(false);
    }
  };

  const handleCorrectionStatus = async (correction: FprdsBenchmarkCorrection, status: FprdsBenchmarkCorrectionStatus) => {
    if (!runtime.enabled) return;
    setBusyCorrectionId(correction.id);
    setMessage('');
    try {
      const updated = await runtime.dataAccess.admin.updateFprdsBenchmarkCorrectionStatus(correction.id, status);
      setBenchmarkCorrections(current => current.map(item => item.id === correction.id ? updated : item));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Benchmark correction could not be updated.');
    } finally {
      setBusyCorrectionId(null);
    }
  };

  const loadManagedUsers = async (search = managedUserSearch) => {
    if (!runtime.enabled) return;
    setManagedUsersState('loading');
    try {
      const users = await runtime.dataAccess.admin.listManagedUsers(search.trim() || null, 100);
      setManagedUsers(users);
      setManagedUsersState('ready');
    } catch (error) {
      setManagedUsersState('error');
      setMessage(error instanceof Error ? error.message : 'User directory could not load.');
    }
  };

  const requireAdminRepo = () => {
    if (!runtime.enabled) throw new Error('Cloud runtime is disabled.');
    return runtime.dataAccess.admin;
  };

  const applyManagedUserUpdate = (updated: AdminManagedUser) => {
    setManagedUsers(current => current.map(item => item.userId === updated.userId ? updated : item));
    setSelectedManagedUser(current => current && current.userId === updated.userId ? updated : current);
  };

  const handleManagedUserBan = async (user: AdminManagedUser, banned: boolean, reason: string) => {
    applyManagedUserUpdate(await requireAdminRepo().setUserBan(user.userId, banned, reason.trim() || null));
  };

  const handleManagedUserMute = async (user: AdminManagedUser, mutedUntil: string | null, reason: string) => {
    applyManagedUserUpdate(await requireAdminRepo().setUserMute(user.userId, mutedUntil, reason.trim() || null));
  };

  const handleManagedUserPlan = async (user: AdminManagedUser, planCode: string, expiresAt: string | null, note: string) => {
    applyManagedUserUpdate(await requireAdminRepo().setUserPlan(user.userId, planCode, expiresAt, note.trim() || null));
  };

  const handleManagedUserDeviceRevoke = async (user: AdminManagedUser) => {
    applyManagedUserUpdate(await requireAdminRepo().revokeUserDevices(user.userId));
  };

  const handleManagedUserNotes = async (user: AdminManagedUser, notes: string) => {
    applyManagedUserUpdate(await requireAdminRepo().setUserNotes(user.userId, notes.trim() || null));
  };

  const applyAccessUserPatch = (userId: string, patch: Partial<AdminManagedUser>) => {
    setManagedUsers(current => current.map(item => item.userId === userId ? { ...item, ...patch } : item));
    setSelectedManagedUser(current => current && current.userId === userId ? { ...current, ...patch } : current);
  };

  const recordAccessAudit = (eventType: string, metadata: Record<string, unknown>) => {
    if (!runtime.enabled) return;
    void runtime.dataAccess.admin.recordAuditEvent(eventType, metadata).catch(() => undefined);
  };

  const handleAccessPersonaChange = async (user: AdminManagedUser, persona: AccountPersona) => {
    if ((user.persona ?? 'coach') === persona) return;
    setAccessActionUserId(user.userId);
    setMessage('');
    try {
      await requireIdentityRepo().setUserPersona(user.userId, persona);
      applyAccessUserPatch(user.userId, { persona });
      recordAccessAudit('admin_access_persona_changed', {
        targetUserId: user.userId,
        previousPersona: user.persona ?? 'coach',
        persona
      });
      setMessage(`${managedUserLabel(user)} is now a ${personaLabel[persona]} account.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not change the account persona.');
    } finally {
      setAccessActionUserId(null);
    }
  };

  const handleAccessLeaguePilotToggle = async (user: AdminManagedUser, enabled: boolean) => {
    setAccessActionUserId(user.userId);
    setMessage('');
    try {
      if (enabled) {
        await requireIdentityRepo().grantEntitlement(user.userId, LEAGUE_PILOT_ENTITLEMENT, null, 'Granted from Admin Access tab');
      } else {
        await requireIdentityRepo().revokeEntitlement(user.userId, LEAGUE_PILOT_ENTITLEMENT);
      }
      const currentEntitlements = user.entitlements ?? [];
      const entitlements = enabled
        ? Array.from(new Set([...currentEntitlements, LEAGUE_PILOT_ENTITLEMENT])).sort()
        : currentEntitlements.filter(entitlement => entitlement !== LEAGUE_PILOT_ENTITLEMENT);
      applyAccessUserPatch(user.userId, { entitlements });
      recordAccessAudit(enabled ? 'admin_access_league_pilot_granted' : 'admin_access_league_pilot_revoked', {
        targetUserId: user.userId,
        entitlement: LEAGUE_PILOT_ENTITLEMENT
      });
      setMessage(`${enabled ? 'Granted' : 'Revoked'} league pilot access for ${managedUserLabel(user)}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update league pilot access.');
    } finally {
      setAccessActionUserId(null);
    }
  };

  const loadMarketingData = async () => {
    if (!runtime.enabled) return;
    setMarketingLoadState('loading');
    try {
      const [promotionRows, announcementRows] = await Promise.all([
        runtime.dataAccess.marketing.listPromotions(),
        runtime.dataAccess.marketing.listAnnouncements()
      ]);
      setPromotions(promotionRows);
      setAnnouncements(announcementRows);
      setMarketingLoadState('ready');
    } catch (error) {
      setMarketingLoadState('error');
      setMessage(error instanceof Error ? error.message : 'Marketing data could not load.');
    }
  };

  const requireMarketingRepo = () => {
    if (!runtime.enabled) throw new Error('Cloud runtime is disabled.');
    return runtime.dataAccess.marketing;
  };

  const requireIdentityRepo = () => {
    if (!runtime.enabled) throw new Error('Cloud runtime is disabled.');
    return runtime.dataAccess.identity;
  };

  const loadLeagueAccessRequests = async () => {
    if (!runtime.enabled) return;
    setLeagueAccessLoadState('loading');
    try {
      const rows = await runtime.dataAccess.identity.listLeagueAccessRequests();
      setLeagueRequests(rows);
      setLeagueAccessLoadState('ready');
    } catch (error) {
      setLeagueAccessLoadState('error');
      setMessage(error instanceof Error ? error.message : 'League access requests could not load.');
    }
  };

  const handleProvisionLeagueOwner = async (request: LeagueAccessRequestRecord) => {
    setLeagueActionId(request.id);
    setMessage('');
    try {
      await requireIdentityRepo().provisionLeagueOwner(request.id);
      setMessage(`Provisioned League owner for ${request.contact_email}.`);
      await loadLeagueAccessRequests();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not provision the League owner.');
    } finally {
      setLeagueActionId(null);
    }
  };

  const handleReviewLeagueRequest = async (request: LeagueAccessRequestRecord, status: LeagueAccessRequestStatus) => {
    setLeagueActionId(request.id);
    setMessage('');
    try {
      await requireIdentityRepo().reviewLeagueAccessRequest(request.id, status);
      await loadLeagueAccessRequests();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update the request.');
    } finally {
      setLeagueActionId(null);
    }
  };

  const recordMarketingAudit = (eventType: string, metadata: Record<string, unknown>) => {
    if (!runtime.enabled) return;
    void runtime.dataAccess.admin.recordAuditEvent(eventType, metadata).catch(() => undefined);
  };

  const handleSavePromotion = async (input: PromotionInput, promotionId: string | null) => {
    try {
      const repo = requireMarketingRepo();
      const saved = promotionId
        ? await repo.updatePromotion(promotionId, input)
        : await repo.createPromotion(input);
      setPromotions(current => promotionId
        ? current.map(item => item.id === saved.id ? saved : item)
        : [saved, ...current]);
      recordMarketingAudit('promotion_saved', { promotionId: saved.id, name: saved.name });
      setMessage(`Promotion "${saved.name}" was saved.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Promotion could not be saved.');
      throw error;
    }
  };

  const handleTogglePromotion = async (promotion: PromotionRecord) => {
    try {
      const updated = await requireMarketingRepo().setPromotionActive(promotion.id, !promotion.is_active);
      setPromotions(current => current.map(item => item.id === updated.id ? updated : item));
      recordMarketingAudit('promotion_toggled', { promotionId: updated.id, isActive: updated.is_active });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Promotion could not be updated.');
      throw error;
    }
  };

  const handleDeletePromotion = async (promotion: PromotionRecord) => {
    try {
      await requireMarketingRepo().deletePromotion(promotion.id);
      setPromotions(current => current.filter(item => item.id !== promotion.id));
      recordMarketingAudit('promotion_deleted', { promotionId: promotion.id, name: promotion.name });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Promotion could not be deleted.');
      throw error;
    }
  };

  const handleSaveAnnouncement = async (input: AnnouncementInput, announcementId: string | null) => {
    try {
      const repo = requireMarketingRepo();
      const saved = announcementId
        ? await repo.updateAnnouncement(announcementId, input)
        : await repo.createAnnouncement(input);
      setAnnouncements(current => announcementId
        ? current.map(item => item.id === saved.id ? saved : item)
        : [saved, ...current]);
      recordMarketingAudit('announcement_saved', { announcementId: saved.id, title: saved.title });
      setMessage(`Announcement "${saved.title}" was saved.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Announcement could not be saved.');
      throw error;
    }
  };

  const handleToggleAnnouncement = async (announcement: AnnouncementRecord) => {
    try {
      const updated = await requireMarketingRepo().setAnnouncementPublished(announcement.id, !announcement.is_published);
      setAnnouncements(current => current.map(item => item.id === updated.id ? updated : item));
      recordMarketingAudit('announcement_toggled', { announcementId: updated.id, isPublished: updated.is_published });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Announcement could not be updated.');
      throw error;
    }
  };

  const handleDeleteAnnouncement = async (announcement: AnnouncementRecord) => {
    try {
      await requireMarketingRepo().deleteAnnouncement(announcement.id);
      setAnnouncements(current => current.filter(item => item.id !== announcement.id));
      recordMarketingAudit('announcement_deleted', { announcementId: announcement.id, title: announcement.title });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Announcement could not be deleted.');
      throw error;
    }
  };

  const handleRestoreWorkspace = async (workspace: AdminRecoverableWorkspace) => {
    if (!runtime.enabled) return;
    setRestoringWorkspaceId(workspace.clubId);
    setMessage('');
    try {
      await runtime.dataAccess.admin.restoreWorkspace(workspace.clubId);
      setRecoverableWorkspaces(current => current.filter(item => item.clubId !== workspace.clubId));
      await loadSnapshot();
      setMessage(`${workspace.name} was restored.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Workspace could not be restored.');
    } finally {
      setRestoringWorkspaceId(null);
    }
  };

  if (!runtime.enabled) {
    return (
      <AdminAccessShell>
        <div className="text-center">
          <img src="/Dumala_logo.png" alt="Dumala" className="mx-auto h-[8.1rem] w-[12.15rem] object-contain sm:h-[9.45rem] sm:w-[14.85rem]" />
          <p className="mt-[-0.2rem] text-[10px] font-black uppercase tracking-normal text-orange-300">Owner console</p>
          <h1 className="mt-2 font-display text-2xl font-black leading-[1.06] text-white sm:text-3xl">Dumala Admin Console</h1>
          <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-amber-300/15 bg-amber-300/[0.055] p-4 text-left">
            <div className="flex gap-3">
              <LockKeyhole className="mt-0.5 shrink-0 text-amber-200" size={18} aria-hidden="true" />
              <p className="text-xs font-semibold leading-5 text-amber-100/85">
                Admin access is unavailable in this build.
              </p>
            </div>
          </div>
        </div>
      </AdminAccessShell>
    );
  }

  if (auth.state.status !== 'signedIn') {
    return (
      <AdminAccessShell>
        <div className="text-center">
          <img src="/Dumala_logo.png" alt="Dumala" className="mx-auto h-[8.1rem] w-[12.15rem] object-contain sm:h-[9.45rem] sm:w-[14.85rem]" />
          <p className="mt-[-0.2rem] text-[10px] font-black uppercase tracking-normal text-orange-300">Owner console</p>
          <h1 className="mt-2 font-display text-2xl font-black leading-[1.06] text-white sm:text-3xl">Dumala Admin Console</h1>
          <p className="mx-auto mt-3 max-w-lg text-xs leading-5 text-slate-300 sm:text-sm">
            Private access for the app owner and developer.
          </p>
        </div>
        <div className="mx-auto mt-5 w-full max-w-[30rem] rounded-2xl border border-cyan-300/10 bg-white/[0.022] p-3 shadow-lg shadow-black/15">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-cyan-300/15 bg-cyan-300/[0.06] text-cyan-200">
              <ShieldCheck size={13} aria-hidden="true" />
            </span>
            <div className="text-left">
              <h2 className="text-sm font-black text-slate-100">Admin sign in</h2>
              <p className="mt-0.5 text-[10px] leading-4 text-slate-500">Owner account only.</p>
            </div>
          </div>
          <CloudAccountGate redirectTo={ADMIN_AUTH_REDIRECT_URL} tone="dark" audience="admin" bootstrapAccount={false} />
        </div>
      </AdminAccessShell>
    );
  }

  return (
    <div className={ADMIN_THEME.classes.shell} style={ADMIN_THEME_STYLE}>
      <AdminBackdrop />
      <header className="relative z-10 border-b border-white/10 bg-[#07111f]/90 shadow-lg shadow-black/20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <img src="/Dumala_logo.png" alt="Dumala" className="h-11 w-11 shrink-0 rounded-xl object-contain drop-shadow-sm" />
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-cyan-200" aria-hidden="true" />
                  <h1 className="font-display text-xl font-black text-white">Dumala Admin Console</h1>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  Private app-owner console for beta health, FPRDS review, feedback, usage, live sessions, and future billing.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {adminProfile && <Badge variant="secondary">Role: {roleLabel[adminProfile.role]}</Badge>}
            {assuranceLevel && <Badge variant={assuranceLevel === 'aal2' ? 'secondary' : 'outline'}>AAL: {assuranceLevel}</Badge>}
            <Button type="button" onClick={() => void loadSnapshot()} variant="outline" size="sm" disabled={loadState === 'loading'}>
              {loadState === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
              Refresh
            </Button>
            <Button type="button" onClick={() => { window.location.hash = ''; }} size="sm">
              Return to app
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1440px] space-y-4 p-4 sm:p-6">
        {(loadState === 'denied' || loadState === 'error') && (
          <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-4 text-sm font-semibold text-destructive" role="alert">
            <div className="flex gap-2">
              <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{message}</span>
            </div>
          </div>
        )}

        {message && loadState === 'ready' && (
          <div
            className={`rounded-lg border p-4 text-sm font-semibold ${
              message.toLowerCase().includes('failed') || message.toLowerCase().includes('could not')
                ? 'border-destructive/25 bg-destructive/10 text-destructive'
                : 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
            }`}
            role="status"
          >
            {message}
          </div>
        )}

        {loadState === 'loading' && !snapshot && (
          <div className={`${ADMIN_PANEL_CLASS} flex min-h-96 items-center justify-center`}>
            <span className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground">
              <Loader2 size={18} className="animate-spin" /> Loading admin console
            </span>
          </div>
        )}

        {loadState === 'denied' && (
          <Section title="Access denied" icon={LockKeyhole}>
            <p className="text-sm font-medium leading-relaxed text-muted-foreground">
              Account is not authorized.
            </p>
          </Section>
        )}

        {loadState === 'mfaRequired' && adminProfile && (
          <AdminMfaGate
            admin={adminProfile}
            assuranceLevel={assuranceLevel}
            factors={mfaFactors}
            enrollment={totpEnrollment}
            challenge={mfaChallenge}
            code={mfaCode}
            message={message}
            busy={mfaBusy}
            onCodeChange={setMfaCode}
            onEnroll={handleEnrollTotp}
            onChallenge={handleMfaChallenge}
            onVerify={handleMfaVerify}
            onRefresh={() => {
              void refreshMfaState().then(() => loadSnapshot());
            }}
            onSignOut={() => void handleAdminSignOut()}
          />
        )}

        {snapshot && (
          <>
            <nav aria-label="Admin console sections" className={ADMIN_THEME.classes.nav}>
              {visibleTabs.map(tab => {
                const Icon = tab.icon;
                const selected = activeTab === tab.id;
                return (
                  <Button
                    key={tab.id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className={`${ADMIN_THEME.classes.navItem} ${
                      selected
                        ? ADMIN_THEME.classes.navItemActive
                        : ADMIN_THEME.classes.navItemIdle
                    }`}
                  >
                    <Icon size={15} className="shrink-0" aria-hidden="true" />
                    <span className="truncate">{tab.label}</span>
                  </Button>
                );
              })}
            </nav>

            {activeTab === 'overview' && <OverviewPanel snapshot={snapshot} growthMetrics={growthMetrics} />}
            {activeTab === 'access' && (
              <AccessPanel
                adminProfile={adminProfile}
                phase6={runtime.phase6}
                users={managedUsers}
                usersState={managedUsersState}
                search={managedUserSearch}
                requests={leagueRequests}
                requestsState={leagueAccessLoadState}
                busyUserId={accessActionUserId}
                actionId={leagueActionId}
                onSearchChange={setManagedUserSearch}
                onSearch={() => void loadManagedUsers()}
                onPersonaChange={handleAccessPersonaChange}
                onToggleLeaguePilot={handleAccessLeaguePilotToggle}
                onRefreshRequests={() => void loadLeagueAccessRequests()}
                onProvision={handleProvisionLeagueOwner}
                onReview={handleReviewLeagueRequest}
              />
            )}
            {activeTab === 'users' && (
              <UsersPanel
                metrics={growthMetrics}
                users={managedUsers}
                usersState={managedUsersState}
                search={managedUserSearch}
                onSearchChange={setManagedUserSearch}
                onSearch={() => void loadManagedUsers()}
                onManage={setSelectedManagedUser}
              />
            )}
            {activeTab === 'recovery' && (
              <RecoveryPanel
                workspaces={recoverableWorkspaces}
                restoringWorkspaceId={restoringWorkspaceId}
                onRestore={handleRestoreWorkspace}
              />
            )}
            {activeTab === 'storage' && <StoragePanel metrics={storageMetrics} />}
            {activeTab === 'security' && (
              <SecurityPanel
                metrics={securityMetrics}
                assuranceLevel={assuranceLevel}
                factors={mfaFactors}
                onRefresh={() => void loadSnapshot()}
                onSignOut={() => void handleAdminSignOut()}
              />
            )}
            {activeTab === 'usage' && <UsagePanel events={snapshot.usageEvents} sessions={snapshot.activeSessions} metrics={growthMetrics} productMetrics={snapshot.productMetrics} activationFunnel={activationFunnel} />}
            {activeTab === 'feedback' && (
              <FeedbackPanel feedback={snapshot.feedback} metrics={growthMetrics} onStatusChange={handleFeedbackStatusChange} onOpen={setSelectedFeedback} />
            )}
            {activeTab === 'leads' && (
              <PremiumLeadsPanel
                feedback={snapshot.feedback}
                onStatusChange={handleFeedbackStatusChange}
                onOpen={setSelectedFeedback}
                onExport={() => void handleExport('leads')}
              />
            )}
            {activeTab === 'fprds' && <FprdsPanel submissions={snapshot.fprdsSubmissions} metrics={growthMetrics} onOpen={setSelectedFprdsSubmission} />}
            {activeTab === 'benchmarks' && (
              <FprdsBenchmarkPanel
                analysis={benchmarkAnalysis}
                reviews={benchmarkReviews}
                corrections={benchmarkCorrections}
                loadState={benchmarkLoadState}
                minSample={benchmarkMinSample}
                onMinSampleChange={handleBenchmarkMinSampleChange}
                onRefresh={() => void loadBenchmarkData()}
                onReview={setSelectedBenchmarkReviewRow}
                onPropose={setSelectedBenchmarkCorrectionRow}
                onCorrectionStatus={(correction, status) => void handleCorrectionStatus(correction, status)}
                busyCorrectionId={busyCorrectionId}
              />
            )}
            {activeTab === 'online' && (
              <Section title="Online users" icon={UsersRound}>
                {onlineSessions.length === 0 ? (
                  <EmptyState title="No users online right now" detail="Presence appears here when app sessions start sending heartbeat updates." />
                ) : (
                  <CompactTable headers={['Session', 'View', 'Device', 'Last seen']}>
                    {onlineSessions.map(session => (
                      <tr key={session.session_id}>
                        <td className="px-3 py-2 font-bold text-foreground">{session.session_id.slice(0, 12)}</td>
                        <td className="px-3 py-2 text-muted-foreground">{session.current_view || 'Unknown'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{session.device_type || 'Unknown'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{formatRelativeTime(session.last_seen_at)}</td>
                      </tr>
                    ))}
                  </CompactTable>
                )}
              </Section>
            )}
            {activeTab === 'billing' && (
              <BillingPanel snapshot={snapshot} metrics={growthMetrics} />
            )}
            {activeTab === 'marketing' && (
              <MarketingPanel
                promotions={promotions}
                announcements={announcements}
                loadState={marketingLoadState}
                onRefresh={() => void loadMarketingData()}
                onSavePromotion={handleSavePromotion}
                onTogglePromotion={handleTogglePromotion}
                onDeletePromotion={handleDeletePromotion}
                onSaveAnnouncement={handleSaveAnnouncement}
                onToggleAnnouncement={handleToggleAnnouncement}
                onDeleteAnnouncement={handleDeleteAnnouncement}
              />
            )}
            {activeTab === 'league-access' && (
              <LeagueAccessPanel
                requests={leagueRequests}
                loadState={leagueAccessLoadState}
                actionId={leagueActionId}
                onRefresh={() => void loadLeagueAccessRequests()}
                onProvision={handleProvisionLeagueOwner}
                onReview={handleReviewLeagueRequest}
              />
            )}
            {activeTab === 'exports' && <ExportsPanel snapshot={snapshot} metrics={growthMetrics} onExport={handleExport} />}
            {activeTab === 'alerts' && <AlertsPanel snapshot={snapshot} securityMetrics={securityMetrics} growthMetrics={growthMetrics} />}
          </>
        )}
      </main>

      <FeedbackReviewDialog
        item={selectedFeedback}
        open={selectedFeedback !== null}
        saving={isSavingReview}
        onOpenChange={open => { if (!open) setSelectedFeedback(null); }}
        onSave={handleFeedbackReviewSave}
      />
      <FprdsReviewDialog
        submission={selectedFprdsSubmission}
        open={selectedFprdsSubmission !== null}
        saving={isSavingReview}
        onOpenChange={open => { if (!open) setSelectedFprdsSubmission(null); }}
        onSave={handleFprdsReviewSave}
      />
      <BenchmarkReviewDialog
        row={selectedBenchmarkReviewRow}
        open={selectedBenchmarkReviewRow !== null}
        saving={isSavingBenchmark}
        onOpenChange={open => { if (!open) setSelectedBenchmarkReviewRow(null); }}
        onSave={(row, decision, notes) => void handleBenchmarkReviewSave(row, decision, notes)}
      />
      <BenchmarkCorrectionDialog
        row={selectedBenchmarkCorrectionRow}
        open={selectedBenchmarkCorrectionRow !== null}
        saving={isSavingBenchmark}
        onOpenChange={open => { if (!open) setSelectedBenchmarkCorrectionRow(null); }}
        onSave={input => void handleBenchmarkCorrectionSave(input)}
      />
      <ManageUserDialog
        user={selectedManagedUser}
        open={selectedManagedUser !== null}
        onOpenChange={open => { if (!open) setSelectedManagedUser(null); }}
        onBan={handleManagedUserBan}
        onMute={handleManagedUserMute}
        onPlan={handleManagedUserPlan}
        onRevokeDevices={handleManagedUserDeviceRevoke}
        onNotes={handleManagedUserNotes}
      />
    </div>
  );
}
