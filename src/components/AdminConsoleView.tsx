import React, { type CSSProperties, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  CreditCard,
  Database,
  Download,
  Eye,
  FileText,
  Gauge,
  KeyRound,
  Loader2,
  LockKeyhole,
  LogOut,
  MessageSquare,
  RefreshCcw,
  Save,
  ShieldAlert,
  ShieldCheck,
  UsersRound,
  Wifi
} from 'lucide-react';
import { useCloudAuth } from '../hooks/useCloudAuth';
import { useCloudRuntime } from '../hooks/useCloudRuntime';
import type {
  AdminConsoleSnapshot,
  AdminGrowthMetrics,
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
  FprdsBetaSubmission
} from '../cloud/admin';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

type AdminTab = 'overview' | 'users' | 'recovery' | 'storage' | 'security' | 'usage' | 'feedback' | 'fprds' | 'online' | 'billing' | 'exports' | 'alerts';

const ADMIN_AUTH_REDIRECT_URL = 'https://dumala.asia/?returnTo=admin';

type AdminThemeId = 'dark-glass';

const ADMIN_DARK_GLASS_THEME = {
  id: 'dark-glass',
  label: 'Dark Glass',
  style: {
    '--background': '#020713',
    '--foreground': '#f8fafc',
    '--card': 'rgba(7, 17, 31, 0.9)',
    '--card-foreground': '#f8fafc',
    '--muted': 'rgba(255, 255, 255, 0.06)',
    '--muted-foreground': '#94a3b8',
    '--border': 'rgba(255, 255, 255, 0.1)',
    '--input': 'rgba(11, 23, 38, 0.95)',
    '--ring': '#fb923c',
    '--primary': '#fb923c',
    '--primary-foreground': '#020713',
    '--accent': '#fb923c',
    '--accent-foreground': '#020713',
    '--destructive': '#fb7185'
  } as CSSProperties,
  classes: {
    shell: 'relative min-h-screen overflow-x-hidden bg-[#020713] text-slate-100',
    accessShell: 'relative min-h-screen overflow-hidden bg-[#020713] font-sans text-slate-100 selection:bg-orange-400/30',
    accessPanel: 'w-full max-w-3xl rounded-[1.85rem] border border-white/10 bg-[#07111f]/90 p-5 text-slate-100 shadow-2xl shadow-black/45 backdrop-blur-xl sm:p-6',
    panel: 'rounded-2xl border border-cyan-300/10 bg-[#07111f]/88 text-slate-100 shadow-lg shadow-black/20 backdrop-blur-xl [&_.text-foreground]:!text-slate-100 [&_.text-muted-foreground]:!text-slate-400',
    panelHeader: 'flex items-center gap-2 border-b border-cyan-300/10 px-4 py-3',
    subtleCard: 'rounded-xl border border-cyan-300/10 bg-white/[0.035] text-slate-100 shadow-sm shadow-black/10 [&_.text-foreground]:!text-slate-100 [&_.text-muted-foreground]:!text-slate-400',
    input: 'h-9 rounded-xl border border-cyan-300/10 bg-[#0b1726]/85 px-3 text-xs font-semibold text-slate-100 outline-none ring-orange-300/15 transition placeholder:text-slate-500 focus:border-orange-300/60 focus:ring-2',
    select: 'h-9 rounded-xl border border-cyan-300/10 bg-[#0b1726]/85 px-2 text-xs font-bold text-slate-100 outline-none ring-orange-300/15 transition focus:border-orange-300/60 focus:ring-2',
    warning: 'rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs font-bold leading-5 text-amber-100',
    reviewButton: 'border-orange-300/35 bg-orange-400 text-slate-950 shadow-sm shadow-orange-950/20 hover:border-orange-200 hover:bg-orange-300 hover:text-slate-950',
    dialogContent: 'border-cyan-300/10 bg-[#07111f] text-slate-100 shadow-2xl shadow-black/40 [&_.text-foreground]:!text-slate-100 [&_.text-muted-foreground]:!text-slate-400',
    dialogField: 'border-cyan-300/15 bg-[#0b1726]/95 text-slate-100 placeholder:text-slate-500 focus:ring-orange-300/25',
    dialogSelectContent: 'border-cyan-300/15 bg-[#0b1726] text-slate-100 shadow-2xl shadow-black/35',
    dialogSelectItem: 'text-slate-100 focus:bg-orange-300/10 focus:text-orange-100',
    dialogSecondaryButton: 'border-cyan-300/15 bg-[#0b1726]/90 text-slate-100 hover:bg-white/[0.06] hover:text-white',
    dialogPrimaryButton: 'bg-orange-400 text-slate-950 shadow-sm shadow-orange-950/25 hover:bg-orange-300 hover:text-slate-950',
    secondaryActionButton: 'border-cyan-300/15 bg-[#0b1726]/90 text-slate-100 shadow-sm shadow-black/15 hover:border-orange-300/30 hover:bg-orange-300/10 hover:text-orange-100',
    nav: 'flex flex-wrap gap-2 rounded-2xl border border-orange-300/10 bg-[#07111f]/88 p-2 shadow-lg shadow-black/20 backdrop-blur-xl',
    navItem: 'shrink-0 border transition-colors sm:flex-1 lg:flex-none',
    navItemActive: 'border-orange-300/40 bg-orange-400 text-slate-950 shadow-sm shadow-orange-950/25 hover:bg-orange-300 hover:text-slate-950',
    navItemIdle: 'border-transparent text-slate-400 hover:border-orange-300/20 hover:bg-orange-300/10 hover:text-orange-100'
  }
} as const;

const ADMIN_THEMES: Record<AdminThemeId, typeof ADMIN_DARK_GLASS_THEME> = {
  'dark-glass': ADMIN_DARK_GLASS_THEME
};

const ADMIN_ACTIVE_THEME_ID: AdminThemeId = 'dark-glass';
const ADMIN_THEME = ADMIN_THEMES[ADMIN_ACTIVE_THEME_ID];
const ADMIN_THEME_STYLE = ADMIN_THEME.style;

const adminTabs: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: 'overview', label: 'Overview', icon: Gauge },
  { id: 'users', label: 'Users', icon: UsersRound },
  { id: 'recovery', label: 'Recovery', icon: RefreshCcw },
  { id: 'storage', label: 'Storage', icon: Database },
  { id: 'security', label: 'Security', icon: ShieldAlert },
  { id: 'usage', label: 'Usage', icon: BarChart3 },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  { id: 'fprds', label: 'FPRDS Beta', icon: ClipboardList },
  { id: 'online', label: 'Online', icon: Wifi },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'exports', label: 'Exports', icon: Download },
  { id: 'alerts', label: 'Alerts', icon: Bell }
];

const highPrivilegeRoles = new Set<AppAdminProfile['role']>(['owner', 'billing']);

const canUseTab = (role: AppAdminProfile['role'] | undefined, tab: AdminTab) => {
  if (!role) return tab === 'overview';
  if (role === 'owner') return true;
  if (role === 'support') return ['overview', 'usage', 'feedback', 'online'].includes(tab);
  if (role === 'fprds_reviewer') return ['overview', 'fprds'].includes(tab);
  if (role === 'billing') return ['overview', 'billing'].includes(tab);
  return tab === 'overview';
};

const roleLabel: Record<AppAdminProfile['role'], string> = {
  owner: 'Owner',
  support: 'Support',
  fprds_reviewer: 'FPRDS reviewer',
  billing: 'Billing'
};

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

const UsagePanel = ({
  events,
  sessions,
  metrics,
  productMetrics
}: {
  events: AppUsageEvent[];
  sessions: AppSession[];
  metrics: AdminGrowthMetrics | null;
  productMetrics: AdminProductMetrics | null | undefined;
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

const UsersPanel = ({ metrics }: { metrics: AdminGrowthMetrics | null }) => (
  <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <StatTile label="Users" value={metrics?.users.total ?? 0} detail="Cloud user profiles." />
      <StatTile label="New 7d" value={metrics?.users.new7d ?? 0} detail={`${metrics?.users.newToday ?? 0} joined today.`} />
      <StatTile label="Active 30d" value={metrics?.users.active30d ?? 0} detail={`${metrics?.users.active7d ?? 0} active in seven days.`} />
      <StatTile label="Workspaces" value={metrics?.workspaces.total ?? 0} detail={`${metrics?.workspaces.active ?? 0} active team spaces.`} />
      <StatTile label="Deletion risk" value={(metrics?.users.pendingDeletion ?? 0) + (metrics?.workspaces.pendingDeletion ?? 0)} detail="Users or workspaces pending deletion." />
    </div>
    <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
      <Section title="Recent users" icon={UsersRound}>
        {metrics?.recentUsers.length ? (
          <CompactTable headers={['User', 'Email', 'State', 'Workspaces', 'Devices', 'Signals', 'Last active']}>
            {metrics.recentUsers.map(user => (
              <tr key={user.userId}>
                <td className="px-3 py-2 font-bold text-foreground">{user.displayName || user.userId.slice(0, 12)}</td>
                <td className="px-3 py-2 text-muted-foreground">{user.email || '-'}</td>
                <td className="px-3 py-2"><Badge variant={user.accountState === 'active' ? 'secondary' : 'warning'}>{user.accountState}</Badge></td>
                <td className="px-3 py-2 text-muted-foreground">{user.workspaceCount}</td>
                <td className="px-3 py-2 text-muted-foreground">{user.deviceCount}</td>
                <td className="px-3 py-2 text-muted-foreground">{user.feedbackCount} feedback / {user.fprdsCount} FPRDS</td>
                <td className="px-3 py-2 text-muted-foreground">{user.lastActiveAt ? formatRelativeTime(user.lastActiveAt) : '-'}</td>
              </tr>
            ))}
          </CompactTable>
        ) : (
          <EmptyState title="No user data yet" detail="Signed-in cloud users will appear here after account bootstrap and activity events." />
        )}
      </Section>
      <Section title="Top workspaces" icon={Building2}>
        {metrics?.topWorkspaces.length ? (
          <div className="space-y-2">
            {metrics.topWorkspaces.slice(0, 10).map(workspace => (
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
  </div>
);

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
  onExport: (kind: 'feedback' | 'usage' | 'fprds' | 'users') => void;
}) => (
  <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile label="Recent exports" value={metrics?.exports.recentExportCount ?? 0} detail="Audited export actions in this window." />
      <StatTile label="Feedback rows" value={snapshot.feedback.length} detail="Ready for CSV export." />
      <StatTile label="Usage rows" value={snapshot.usageEvents.length} detail="Recent privacy-minimized events." />
      <StatTile label="FPRDS rows" value={snapshot.fprdsSubmissions.length} detail="Review queue export." />
    </div>
    <Section title="Create export" icon={Download}>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => onExport('feedback')} className={ADMIN_SECONDARY_ACTION_BUTTON_CLASS}><Download size={14} /> Feedback CSV</Button>
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
  const [storageMetrics, setStorageMetrics] = useState<AdminStorageMetrics | null>(null);
  const [recoverableWorkspaces, setRecoverableWorkspaces] = useState<AdminRecoverableWorkspace[]>([]);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error' | 'denied' | 'mfaRequired'>('idle');
  const [message, setMessage] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackSubmission | null>(null);
  const [selectedFprdsSubmission, setSelectedFprdsSubmission] = useState<FprdsBetaSubmission | null>(null);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [restoringWorkspaceId, setRestoringWorkspaceId] = useState<string | null>(null);

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
        const [security, growth, storage, recoverable] = await Promise.allSettled([
          runtime.dataAccess.admin.getSecurityMetrics(),
          runtime.dataAccess.admin.getGrowthMetrics(),
          runtime.dataAccess.admin.getStorageMetrics(),
          runtime.dataAccess.admin.listRecoverableWorkspaces()
        ]);
        setSecurityMetrics(security.status === 'fulfilled' ? security.value : null);
        setGrowthMetrics(growth.status === 'fulfilled' ? growth.value : null);
        setStorageMetrics(storage.status === 'fulfilled' ? storage.value : null);
        setRecoverableWorkspaces(recoverable.status === 'fulfilled' ? recoverable.value : []);

        const ownerMetricErrors = [security, growth, storage, recoverable]
          .map(getSettledErrorMessage)
          .filter(Boolean);
        if (ownerMetricErrors.length > 0) setMessage(ownerMetricErrors[0]);
      } else {
        setSecurityMetrics(null);
        setGrowthMetrics(null);
        setStorageMetrics(null);
        setRecoverableWorkspaces([]);
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

  const handleExport = async (kind: 'feedback' | 'usage' | 'fprds' | 'users') => {
    if (!snapshot) return;
    const stamp = new Date().toISOString().slice(0, 10);

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
                    <Icon size={14} aria-hidden="true" />
                    {tab.label}
                  </Button>
                );
              })}
            </nav>

            {activeTab === 'overview' && <OverviewPanel snapshot={snapshot} growthMetrics={growthMetrics} />}
            {activeTab === 'users' && <UsersPanel metrics={growthMetrics} />}
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
            {activeTab === 'usage' && <UsagePanel events={snapshot.usageEvents} sessions={snapshot.activeSessions} metrics={growthMetrics} productMetrics={snapshot.productMetrics} />}
            {activeTab === 'feedback' && (
              <FeedbackPanel feedback={snapshot.feedback} metrics={growthMetrics} onStatusChange={handleFeedbackStatusChange} onOpen={setSelectedFeedback} />
            )}
            {activeTab === 'fprds' && <FprdsPanel submissions={snapshot.fprdsSubmissions} metrics={growthMetrics} onOpen={setSelectedFprdsSubmission} />}
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
    </div>
  );
}
