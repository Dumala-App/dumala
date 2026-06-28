import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart3,
  ClipboardList,
  CreditCard,
  Eye,
  Gauge,
  Loader2,
  LockKeyhole,
  MessageSquare,
  RefreshCcw,
  Save,
  ShieldCheck,
  UsersRound,
  Wifi
} from 'lucide-react';
import { useCloudAuth } from '../hooks/useCloudAuth';
import { useCloudRuntime } from '../hooks/useCloudRuntime';
import type {
  AdminConsoleSnapshot,
  AppUsageEvent,
  FeedbackStatus,
  FeedbackSubmission,
  FprdsBetaReviewStatus,
  FprdsBetaSubmission
} from '../cloud/admin';
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

type AdminTab = 'overview' | 'usage' | 'feedback' | 'fprds' | 'online' | 'billing';

const ADMIN_AUTH_REDIRECT_URL = 'https://dumala.asia/?returnTo=admin';

const adminTabs: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: 'overview', label: 'Overview', icon: Gauge },
  { id: 'usage', label: 'Usage', icon: BarChart3 },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  { id: 'fprds', label: 'FPRDS Beta', icon: ClipboardList },
  { id: 'online', label: 'Online', icon: Wifi },
  { id: 'billing', label: 'Billing', icon: CreditCard }
];

const statusLabel: Record<FeedbackStatus, string> = {
  new: 'New',
  triaged: 'Triaged',
  planned: 'Planned',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed'
};

const fprdsStatusLabel: Record<FprdsBetaReviewStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  excluded: 'Excluded',
  needs_followup: 'Needs follow-up'
};

const fprdsStatusTone: Record<FprdsBetaReviewStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  accepted: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  excluded: 'border-rose-200 bg-rose-50 text-rose-800',
  needs_followup: 'border-sky-200 bg-sky-50 text-sky-800'
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

const StatTile = ({ label, value, detail }: { label: string; value: string | number; detail: string }) => (
  <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
    <p className="text-[11px] font-black uppercase text-muted-foreground">{label}</p>
    <p className="mt-2 font-display text-2xl font-black text-foreground">{value}</p>
    <p className="mt-1 text-xs font-medium leading-relaxed text-muted-foreground">{detail}</p>
  </div>
);

const Section = ({ title, icon: Icon, children }: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) => (
  <section className="rounded-lg border border-border bg-card shadow-sm">
    <div className="flex items-center gap-2 border-b border-border px-4 py-3">
      <Icon size={17} className="text-primary" aria-hidden="true" />
      <h2 className="font-display text-sm font-black text-foreground">{title}</h2>
    </div>
    <div className="p-4">{children}</div>
  </section>
);

const EmptyState = ({ title, detail }: { title: string; detail: string }) => (
  <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
    <p className="text-sm font-black text-foreground">{title}</p>
    <p className="mx-auto mt-1 max-w-xl text-xs font-medium leading-relaxed text-muted-foreground">{detail}</p>
  </div>
);

const CompactTable = ({ children, headers }: { headers: string[]; children: React.ReactNode }) => (
  <div className="overflow-x-auto rounded-lg border border-border">
    <table className="min-w-full divide-y divide-border text-left text-xs">
      <thead className="bg-muted/45 text-[10px] font-black uppercase text-muted-foreground">
        <tr>{headers.map(header => <th key={header} className="px-3 py-2">{header}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-border bg-card">{children}</tbody>
    </table>
  </div>
);

const TopList = ({ rows }: { rows: Array<{ key: string; count: number }> }) => (
  <div className="space-y-2">
    {rows.slice(0, 8).map(row => (
      <div key={row.key} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/25 px-3 py-2">
        <span className="truncate text-xs font-bold text-foreground">{row.key}</span>
        <Badge variant="secondary">{row.count}</Badge>
      </div>
    ))}
    {rows.length === 0 && <EmptyState title="No data yet" detail="Events will appear here after users open the app with cloud analytics enabled." />}
  </div>
);

const OverviewPanel = ({ snapshot }: { snapshot: AdminConsoleSnapshot }) => {
  const activeNow = snapshot.activeSessions.filter(session => eventAgeMs(session.last_seen_at) < 5 * 60000).length;
  const openFeedback = snapshot.feedback.filter(item => !['resolved', 'closed'].includes(item.status)).length;
  const pendingFprds = snapshot.fprdsSubmissions.filter(item => item.review_status === 'pending').length;
  const activeSubscriptions = snapshot.subscriptions.filter(item => ['trialing', 'active'].includes(item.status)).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Active now" value={activeNow} detail="Sessions seen in the last five minutes." />
        <StatTile label="Usage events" value={snapshot.usageEvents.length} detail="Recent privacy-minimized product events." />
        <StatTile label="Open feedback" value={openFeedback} detail="Items not resolved or closed." />
        <StatTile label="FPRDS pending" value={pendingFprds} detail="Beta submissions waiting for review." />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Product adoption" icon={Activity}>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Users" value={uniqueCount(snapshot.usageEvents.map(item => item.user_id))} detail="Unique recent signed-in users." />
            <StatTile label="Clubs" value={uniqueCount(snapshot.usageEvents.map(item => item.club_id))} detail="Unique recent club IDs." />
            <StatTile label="Paid/trial" value={activeSubscriptions} detail="Future billing status count." />
          </div>
        </Section>
        <Section title="Most used areas" icon={BarChart3}>
          <TopList rows={countBy(snapshot.usageEvents, item => item.view_name)} />
        </Section>
      </div>
    </div>
  );
};

const UsagePanel = ({ events }: { events: AppUsageEvent[] }) => (
  <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
    <Section title="Top views" icon={BarChart3}>
      <TopList rows={countBy(events, item => item.view_name)} />
    </Section>
    <Section title="Recent events" icon={Activity}>
      {events.length === 0 ? (
        <EmptyState title="No usage events yet" detail="The console is ready. Wire app actions into app_usage_events as beta analytics mature." />
      ) : (
        <CompactTable headers={['Event', 'View', 'Feature', 'When']}>
          {events.slice(0, 30).map(event => (
            <tr key={event.id}>
              <td className="px-3 py-2 font-bold text-foreground">{event.event_type}</td>
              <td className="px-3 py-2 text-muted-foreground">{event.view_name || 'Unknown'}</td>
              <td className="px-3 py-2 text-muted-foreground">{event.feature_name || '-'}</td>
              <td className="px-3 py-2 text-muted-foreground">{formatRelativeTime(event.created_at)}</td>
            </tr>
          ))}
        </CompactTable>
      )}
    </Section>
  </div>
);

const FeedbackPanel = ({ feedback, onStatusChange, onOpen }: {
  feedback: FeedbackSubmission[];
  onStatusChange: (feedbackId: string, status: FeedbackStatus) => void;
  onOpen: (item: FeedbackSubmission) => void;
}) => (
  <Section title="Feedback inbox" icon={MessageSquare}>
    {feedback.length === 0 ? (
      <EmptyState title="No feedback yet" detail="Database-backed feedback will appear here after the feedback form is connected to Supabase." />
    ) : (
      <div className="space-y-3">
        {feedback.map(item => (
          <article key={item.id} className="rounded-lg border border-border bg-muted/20 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={item.urgency === 'blocking' || item.urgency === 'high' ? 'destructive' : 'secondary'}>
                    {item.urgency}
                  </Badge>
                  <span className="text-[11px] font-black uppercase text-muted-foreground">{item.affected_area}</span>
                  <span className="text-[11px] font-medium text-muted-foreground">{formatRelativeTime(item.created_at)}</span>
                </div>
                <h3 className="mt-2 text-sm font-black text-foreground">{item.subject}</h3>
                <p className="mt-1 line-clamp-3 text-xs font-medium leading-relaxed text-muted-foreground">{item.details}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <select
                  aria-label={`Status for ${item.subject}`}
                  value={item.status}
                  onChange={event => onStatusChange(item.id, event.target.value as FeedbackStatus)}
                  className="h-9 rounded-lg border border-border bg-background px-2 text-xs font-bold text-foreground"
                >
                  {Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <Button type="button" variant="outline" size="sm" onClick={() => onOpen(item)} aria-label={`Open feedback: ${item.subject}`}>
                  <Eye size={14} aria-hidden="true" /> Review
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    )}
  </Section>
);

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
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item.subject}</DialogTitle>
          <DialogDescription>{item.affected_area} · {item.category.replaceAll('_', ' ')} · {formatRelativeTime(item.created_at)}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/25 p-4">
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
              <Label htmlFor="feedback-review-status" className="normal-case tracking-normal">Status</Label>
              <Select value={status} onValueChange={value => setStatus(value as FeedbackStatus)}>
                <SelectTrigger id="feedback-review-status"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(statusLabel).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
              <p><strong className="text-foreground">Urgency:</strong> {item.urgency}</p>
              <p className="mt-1"><strong className="text-foreground">Contact:</strong> {item.contact_email || 'Not provided'}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="feedback-admin-notes" className="normal-case tracking-normal">Private admin notes</Label>
            <Textarea id="feedback-admin-notes" value={adminNotes} onChange={event => setAdminNotes(event.target.value)} rows={4} maxLength={4000} placeholder="Triage decision, reproduction notes, or follow-up action." />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" disabled={saving} onClick={() => onSave(item, status, adminNotes)}>
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
    <dl className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
      {rows.map(([key, rawValue]) => (
        <div key={key} className="flex items-start justify-between gap-3 bg-card px-3 py-2 text-xs">
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
      <DialogContent className="max-h-[94vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>FPRDS beta review</DialogTitle>
          <DialogDescription>Anonymous player {submission.player_anonymous_id.slice(0, 10)} · submitted {formatRelativeTime(submission.submitted_at)}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-5">
          {[
            ['Role', submission.role.toUpperCase()],
            ['Age group', submission.age_group.toUpperCase()],
            ['Type', submission.assessment_type],
            ['OVR', String(submission.ovr ?? '-')],
            ['Confidence', String(submission.coach_confidence ?? '-')]
          ].map(([label, value]) => (
            <div key={label} className="bg-muted/30 px-3 py-2.5">
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
            <p className="text-[11px] text-muted-foreground">Consent: {submission.consent_version} · {new Date(submission.consented_at).toLocaleString()}</p>
          </div>
        </div>

        <details className="rounded-lg border border-border bg-muted/20 p-3">
          <summary className="cursor-pointer text-xs font-black text-foreground">Raw drill results</summary>
          <div className="mt-3"><JsonFieldList value={submission.raw_results} /></div>
        </details>

        {submission.coach_notes && (
          <div className="rounded-lg border border-border p-3">
            <p className="text-[10px] font-black uppercase text-muted-foreground">Coach context</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{submission.coach_notes}</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fprds-review-status" className="normal-case tracking-normal">Review decision</Label>
            <Select value={status} onValueChange={value => setStatus(value as FprdsBetaReviewStatus)}>
              <SelectTrigger id="fprds-review-status"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(fprdsStatusLabel).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {status === 'excluded' && (
            <div className="space-y-1.5">
              <Label htmlFor="fprds-exclusion-reason" className="normal-case tracking-normal">Exclusion reason</Label>
              <Textarea id="fprds-exclusion-reason" value={exclusionReason} onChange={event => setExclusionReason(event.target.value)} rows={2} maxLength={1000} required />
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fprds-reviewer-notes" className="normal-case tracking-normal">Reviewer notes</Label>
          <Textarea id="fprds-reviewer-notes" value={reviewerNotes} onChange={event => setReviewerNotes(event.target.value)} rows={3} maxLength={3000} placeholder="Quality observations, benchmark implications, or follow-up questions." />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" disabled={saving || (status === 'excluded' && !exclusionReason.trim())} onClick={() => onSave(submission, status, reviewerNotes, exclusionReason)}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save decision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const FprdsPanel = ({ submissions, onOpen }: { submissions: FprdsBetaSubmission[]; onOpen: (submission: FprdsBetaSubmission) => void }) => {
  const [filter, setFilter] = useState<'all' | FprdsBetaReviewStatus>('all');
  const filtered = filter === 'all' ? submissions : submissions.filter(item => item.review_status === filter);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(Object.keys(fprdsStatusLabel) as FprdsBetaReviewStatus[]).map(status => (
          <button key={status} type="button" onClick={() => setFilter(status)} className={`rounded-lg border p-3 text-left transition-colors ${filter === status ? fprdsStatusTone[status] : 'border-border bg-card hover:bg-muted/30'}`}>
            <p className="text-[10px] font-black uppercase">{fprdsStatusLabel[status]}</p>
            <p className="mt-1 text-xl font-black">{submissions.filter(item => item.review_status === status).length}</p>
          </button>
        ))}
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
                <td className="px-3 py-2 text-right"><Button type="button" variant="outline" size="sm" onClick={() => onOpen(submission)}><Eye size={14} /> Review</Button></td>
              </tr>
            ))}
          </CompactTable>
        )}
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
  const [snapshot, setSnapshot] = useState<AdminConsoleSnapshot | null>(null);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error' | 'denied'>('idle');
  const [message, setMessage] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackSubmission | null>(null);
  const [selectedFprdsSubmission, setSelectedFprdsSubmission] = useState<FprdsBetaSubmission | null>(null);
  const [isSavingReview, setIsSavingReview] = useState(false);

  const loadSnapshot = async () => {
    if (!runtime.enabled || auth.state.status !== 'signedIn') return;
    setLoadState('loading');
    setMessage('');
    try {
      const next = await runtime.dataAccess.admin.getSnapshot();
      setSnapshot(next);
      setLoadState('ready');
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Admin console could not load.';
      setMessage(text);
      setLoadState(text.includes('app_admins') || text.includes('not listed') ? 'denied' : 'error');
    }
  };

  useEffect(() => {
    void loadSnapshot();
  }, [auth.state.status, runtime.enabled]);

  const onlineSessions = useMemo(
    () => snapshot?.activeSessions.filter(session => eventAgeMs(session.last_seen_at) < 5 * 60000) ?? [],
    [snapshot]
  );

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

  if (!runtime.enabled) {
    return (
      <div className="min-h-screen bg-background p-4 text-foreground sm:p-6">
        <section className="mx-auto max-w-3xl rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-1 text-primary" size={22} aria-hidden="true" />
            <div>
              <h1 className="font-display text-2xl font-black">Dumala Admin Console</h1>
              <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
                Cloud is disabled in this environment. Enable `VITE_DUMALA_CLOUD_ENABLED=true` and configure Supabase to use the private admin console.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (auth.state.status !== 'signedIn') {
    return (
      <div className="min-h-screen bg-background p-4 text-foreground sm:p-6">
        <section className="mx-auto max-w-3xl rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 text-primary" size={22} aria-hidden="true" />
            <div>
              <h1 className="font-display text-2xl font-black">Dumala Admin Console</h1>
              <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
                Sign in with the Supabase account that has been added to `app_admins`.
              </p>
              <div className="mt-4">
                <CloudAccountGate redirectTo={ADMIN_AUTH_REDIRECT_URL} />
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-primary" aria-hidden="true" />
              <h1 className="font-display text-xl font-black">Dumala Admin Console</h1>
            </div>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              Private app-owner console for beta health, FPRDS review, feedback, usage, live sessions, and future billing.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {snapshot && <Badge variant="secondary">Role: {snapshot.admin.role}</Badge>}
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

      <main className="mx-auto max-w-[1440px] space-y-4 p-4 sm:p-6">
        {(loadState === 'denied' || loadState === 'error') && (
          <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-4 text-sm font-semibold text-destructive" role="alert">
            <div className="flex gap-2">
              <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{message}</span>
            </div>
          </div>
        )}

        {loadState === 'loading' && !snapshot && (
          <div className="flex min-h-96 items-center justify-center rounded-lg border border-border bg-card">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground">
              <Loader2 size={18} className="animate-spin" /> Loading admin console
            </span>
          </div>
        )}

        {loadState === 'denied' && (
          <Section title="Access setup required" icon={LockKeyhole}>
            <p className="text-sm font-medium leading-relaxed text-muted-foreground">
              Your signed-in account is not an app admin yet. In Supabase Studio, add your auth user ID to `public.app_admins`, then refresh this page.
            </p>
          </Section>
        )}

        {snapshot && (
          <>
            <nav aria-label="Admin console sections" className="flex gap-2 overflow-x-auto rounded-lg border border-border bg-card p-2">
              {adminTabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    type="button"
                    variant={activeTab === tab.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className="shrink-0"
                  >
                    <Icon size={14} aria-hidden="true" />
                    {tab.label}
                  </Button>
                );
              })}
            </nav>

            {activeTab === 'overview' && <OverviewPanel snapshot={snapshot} />}
            {activeTab === 'usage' && <UsagePanel events={snapshot.usageEvents} />}
            {activeTab === 'feedback' && (
              <FeedbackPanel feedback={snapshot.feedback} onStatusChange={handleFeedbackStatusChange} onOpen={setSelectedFeedback} />
            )}
            {activeTab === 'fprds' && <FprdsPanel submissions={snapshot.fprdsSubmissions} onOpen={setSelectedFprdsSubmission} />}
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
              <Section title="Payments and ledger readiness" icon={CreditCard}>
                <div className="grid gap-3 sm:grid-cols-3">
                  <StatTile label="Customers" value={snapshot.billingCustomers.length} detail="Provider-linked billing customers." />
                  <StatTile label="Subscriptions" value={snapshot.subscriptions.length} detail="Future Stripe/PayPal plan states." />
                  <StatTile label="Active/trial" value={snapshot.subscriptions.filter(item => ['trialing', 'active'].includes(item.status)).length} detail="Currently billable accounts." />
                </div>
                <p className="mt-4 text-xs font-medium leading-relaxed text-muted-foreground">
                  Billing tables are provider-neutral. Stripe, PayPal, or another processor should update them through secure server-side webhooks.
                </p>
              </Section>
            )}
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
