import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Database,
  Eye,
  FileDown,
  FileJson,
  Gauge,
  Activity,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Award,
  ListOrdered,
  Loader2,
  MapPin,
  Medal,
  Plus,
  RefreshCw,
  Receipt,
  Save,
  Search,
  Settings,
  Shield,
  Shuffle,
  Swords,
  Target,
  Trash2,
  Trophy,
  UserCheck,
  Users,
  Wallet,
  X
} from 'lucide-react';
import type { CloudRuntime } from '../../cloud/runtime';
import type { CloudLeagueRepository } from '../../cloud/dataAccess';
import type { CloudAuthController } from '../../hooks/useCloudAuth';
import {
  EVENT_FORMAT_LABELS,
  EVENT_STATUS_LABELS,
  INVOICE_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
  SEASON_STATUS_LABELS,
  INCIDENT_KIND_LABELS,
  STAT_TYPE_LABELS,
  computeDiscipline,
  computeScorers,
  computeStandings,
  formatMoney,
  nextEventStatuses,
  nextSeasonStatuses,
  spotsRemaining,
  bracketRoundName,
  bracketWinnerId,
  buildFixtureCalendar,
  buildStatDatabase,
  suggestAwards,
  summarizeCoachSeats,
  summarizeCompetition,
  summarizeLedger,
  summarizeMatchday,
  LEAGUE_COACH_STATUS_LABELS,
  type AwardRecipientType,
  type CalendarFixtureItem,
  type CompetitionStanding,
  type CompetitionSummary,
  type EventAward,
  type EventFixture,
  type LeagueCoachMembership,
  type EventIncident,
  type EventIncidentInput,
  type EventInvoice,
  type EventRegistration,
  type EventRegistrationStatus,
  type EventTeam,
  type FixtureOpsPatch,
  type FixtureStatEvent,
  type FixtureStatInput,
  type FixtureStatType,
  type IncidentKind,
  type InvoiceStatus,
  type League,
  type LeagueEvent,
  type LeagueEventFormat,
  type LeagueEventStatus,
  type LeagueSeason,
  type LeagueSeasonStatus,
  type LeagueVenue,
  type LedgerDirection,
  type LedgerEntry
} from '../../cloud/league';
import { renderStatDatabaseReportHtml } from '../../cloud/leagueStatsReport';
import {
  DARK_GLASS_THEME_STYLE,
  DARK_GLASS_DASHBOARD_SURFACE_STYLE
} from '../../theme/darkGlassTheme';
import { CloudAccountGate } from '../CloudAccountGate';

interface LeagueAppProps {
  runtime: Extract<CloudRuntime, { enabled: true }>;
  userId: string;
  authController: CloudAuthController;
  preview?: boolean;
}

type LeagueSection = 'overview' | 'seasons' | 'events' | 'calendar' | 'statistics' | 'coaches' | 'venues' | 'finance' | 'settings';

const NAV: Array<{ id: LeagueSection; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: 'overview', label: 'Overview', icon: Gauge },
  { id: 'seasons', label: 'Seasons', icon: CalendarRange },
  { id: 'events', label: 'Events', icon: Trophy },
  { id: 'calendar', label: 'Calendar', icon: CalendarClock },
  { id: 'statistics', label: 'Statistics', icon: Database },
  { id: 'coaches', label: 'Coaches', icon: UserCheck },
  { id: 'venues', label: 'Venues', icon: MapPin },
  { id: 'finance', label: 'Finance', icon: Wallet },
  { id: 'settings', label: 'Settings', icon: Settings }
];

const statusTone: Record<LeagueSeasonStatus, string> = {
  draft: 'border-slate-300/20 bg-slate-300/8 text-slate-300',
  registration_open: 'border-sky-300/30 bg-sky-400/10 text-sky-100',
  active: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100',
  completed: 'border-indigo-300/30 bg-indigo-400/10 text-indigo-100',
  archived: 'border-slate-500/30 bg-slate-500/10 text-slate-400'
};

const eventStatusTone: Record<LeagueEventStatus, string> = {
  draft: 'border-slate-300/20 bg-slate-300/8 text-slate-300',
  registration_open: 'border-sky-300/30 bg-sky-400/10 text-sky-100',
  active: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100',
  completed: 'border-indigo-300/30 bg-indigo-400/10 text-indigo-100'
};

const registrationTone: Record<EventRegistrationStatus, string> = {
  submitted: 'border-sky-300/30 bg-sky-400/10 text-sky-100',
  approved: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100',
  rejected: 'border-rose-300/30 bg-rose-400/10 text-rose-100',
  waitlisted: 'border-violet-300/30 bg-violet-400/10 text-violet-100',
  withdrawn: 'border-slate-500/30 bg-slate-500/10 text-slate-400'
};

const panel = 'rounded-[1.4rem] border border-white/10 bg-slate-950/55 shadow-[0_20px_70px_rgba(2,6,23,0.28)] backdrop-blur-xl';
const subtleCard = 'rounded-2xl border border-white/10 bg-white/[0.045] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';
const sectionHeader = 'flex items-center gap-2 border-b border-white/10 px-4 py-3';
const inputClass = 'h-10 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300/50 focus:ring-2 focus:ring-sky-400/15';
const selectClass = `${inputClass} pr-8`;
const primaryBtn = 'inline-flex items-center justify-center gap-2 rounded-xl border border-sky-300/30 bg-sky-300 px-4 py-2 text-xs font-bold text-slate-950 shadow-[0_10px_30px_rgba(125,211,252,0.16)] transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/10 disabled:text-slate-500';
const ghostBtn = 'inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-sky-300/35 hover:bg-sky-300/10 hover:text-white';
const navItemActive = 'border-white/20 bg-white text-slate-950 shadow-[0_12px_40px_rgba(15,23,42,0.22)]';
const navItemIdle = 'border-white/10 bg-white/[0.035] text-slate-300 hover:border-sky-300/35 hover:bg-white/[0.07] hover:text-white';
const label = 'block text-[11px] font-bold uppercase tracking-wide text-slate-400';
const inlineLink = 'font-bold text-sky-200 transition hover:text-white';

const StatusBadge = ({ status }: { status: LeagueSeasonStatus }) => (
  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusTone[status]}`}>
    {SEASON_STATUS_LABELS[status]}
  </span>
);

const StatTile = ({ label: tileLabel, value, detail }: { label: string; value: string | number; detail: string }) => (
  <div className={`${subtleCard} p-4`}>
    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{tileLabel}</p>
    <p className="mt-1 font-display text-2xl font-black text-white">{value}</p>
    <p className="mt-1 text-xs text-slate-400">{detail}</p>
  </div>
);

const ProgressMeter = ({ value, label: meterLabel }: { value: number; label: string }) => {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-300">{meterLabel}</span>
        <span className="font-display text-sm font-black text-white">{clamped}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-300 via-indigo-300 to-emerald-300 transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

const formatShortDate = (date: string | null | undefined) => {
  if (!date) return 'Date TBD';
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(parsed);
};

const daysUntil = (date: string | null | undefined) => {
  if (!date) return null;
  const target = new Date(`${date}T00:00:00`).getTime();
  if (Number.isNaN(target)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today.getTime()) / 86_400_000);
};

const LeagueApp = ({ runtime, userId, authController, preview = false }: LeagueAppProps) => {
  const league = runtime.dataAccess.league;
  const [leagues, setLeagues] = useState<League[]>([]);
  const [activeLeagueId, setActiveLeagueId] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<LeagueSeason[]>([]);
  const [venues, setVenues] = useState<LeagueVenue[]>([]);
  const [events, setEvents] = useState<LeagueEvent[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [invoices, setInvoices] = useState<EventInvoice[]>([]);
  const [eventTeams, setEventTeams] = useState<EventTeam[]>([]);
  const [leagueFixtures, setLeagueFixtures] = useState<EventFixture[]>([]);
  const [leagueStats, setLeagueStats] = useState<FixtureStatEvent[]>([]);
  const [section, setSection] = useState<LeagueSection>('overview');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const activeLeague = useMemo(() => leagues.find(l => l.id === activeLeagueId) ?? null, [leagues, activeLeagueId]);

  const loadLeagueData = useCallback(async (leagueId: string) => {
    const [nextSeasons, nextVenues, nextEvents, nextLedger, nextInvoices, nextTeams, nextFixtures, nextStats] = await Promise.all([
      league.listSeasons(leagueId),
      league.listVenues(leagueId),
      league.listEvents(leagueId),
      league.listLedgerEntries(leagueId),
      league.listInvoices(leagueId),
      league.listLeagueEventTeams(leagueId),
      league.listLeagueFixtures(leagueId),
      league.listLeagueStatEvents(leagueId)
    ]);
    setSeasons(nextSeasons);
    setVenues(nextVenues);
    setEvents(nextEvents);
    setLedger(nextLedger);
    setInvoices(nextInvoices);
    setEventTeams(nextTeams);
    setLeagueFixtures(nextFixtures);
    setLeagueStats(nextStats);
  }, [league]);

  const reload = useCallback(async () => {
    const nextLeagues = await league.listLeagues();
    setLeagues(nextLeagues);
    const target = nextLeagues.find(l => l.id === activeLeagueId) ?? nextLeagues[0] ?? null;
    setActiveLeagueId(target?.id ?? null);
    if (target) await loadLeagueData(target.id);
    else { setSeasons([]); setVenues([]); setEvents([]); setLedger([]); setInvoices([]); setEventTeams([]); setLeagueFixtures([]); setLeagueStats([]); }
  }, [league, activeLeagueId, loadLeagueData]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    reload().catch(err => { if (active) setMessage(err instanceof Error ? err.message : 'Could not load your league.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league]);

  const withError = async (fn: () => Promise<unknown>) => {
    setMessage('');
    try { await fn(); } catch (err) { setMessage(err instanceof Error ? err.message : 'Something went wrong.'); }
  };

  return (
    <div
      className="relative min-h-screen bg-[#05070d] text-slate-100"
      style={{
        ...DARK_GLASS_THEME_STYLE,
        backgroundImage:
          'radial-gradient(circle at 18% 0%, rgba(125, 211, 252, 0.14), transparent 32rem), radial-gradient(circle at 82% 8%, rgba(129, 140, 248, 0.11), transparent 30rem), linear-gradient(180deg, #070a12 0%, #05070d 48%, #03050a 100%)'
      }}
    >
      <div className="mx-auto min-h-screen max-w-7xl px-4 py-5 sm:px-6 lg:px-8" style={DARK_GLASS_DASHBOARD_SURFACE_STYLE}>
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-white/10 bg-white/[0.045] px-4 py-4 shadow-[0_24px_90px_rgba(2,6,23,0.25)] backdrop-blur-xl sm:px-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] text-sky-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <Trophy size={18} />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-200/85">Dumala League</p>
              <h1 className="font-display text-xl font-black leading-tight text-white">{activeLeague?.name ?? 'Your league'}</h1>
              <p className="mt-0.5 text-xs text-slate-400">{activeLeague?.location ?? 'League operations workspace'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {leagues.length > 1 && (
              <select
                value={activeLeagueId ?? ''}
                onChange={e => { setActiveLeagueId(e.target.value); void loadLeagueData(e.target.value); }}
                className={selectClass}
              >
                {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            )}
            {preview ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-200">
                <Eye size={13} /> Preview
              </span>
            ) : (
              <CloudAccountGate runtime={runtime} authController={authController} bootstrapAccount={false} tone="dark" layout="compact" audience="admin" />
            )}
          </div>
        </header>

        <nav className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/20 p-1.5 backdrop-blur-xl">
          {NAV.map(item => {
            const active = item.id === section;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${active ? navItemActive : navItemIdle}`}
              >
                <Icon size={15} /> {item.label}
              </button>
            );
          })}
        </nav>

        {message && <p className="mb-4 rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-2 text-sm text-rose-100" role="status">{message}</p>}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-300"><Loader2 size={16} className="animate-spin" /> Loading your league…</div>
        ) : !activeLeague ? (
          <CreateLeaguePanel onCreate={input => withError(async () => { await league.createLeague(userId, input); await reload(); setSection('overview'); })} />
        ) : (
          <>
            {section === 'overview' && (
              <OverviewSection
                league={activeLeague}
                seasons={seasons}
                venues={venues}
                events={events}
                ledger={ledger}
                invoices={invoices}
                eventTeams={eventTeams}
                fixtures={leagueFixtures}
                statEvents={leagueStats}
                onAdvance={(seasonId, next) => withError(async () => { await league.advanceSeasonStatus(seasonId, next); await loadLeagueData(activeLeague.id); })}
                onGoToSeasons={() => setSection('seasons')}
                onGoToEvents={() => setSection('events')}
                onGoToVenues={() => setSection('venues')}
                onGoToFinance={() => setSection('finance')}
              />
            )}
            {section === 'seasons' && (
              <SeasonsSection
                seasons={seasons}
                onCreate={input => withError(async () => { await league.createSeason(activeLeague.id, input); await loadLeagueData(activeLeague.id); })}
                onAdvance={(seasonId, next) => withError(async () => { await league.advanceSeasonStatus(seasonId, next); await loadLeagueData(activeLeague.id); })}
              />
            )}
            {section === 'events' && (
              <EventsSection
                league={league}
                events={events}
                seasons={seasons}
                runError={withError}
                onCreate={input => withError(async () => { await league.createEvent(activeLeague.id, input); await loadLeagueData(activeLeague.id); })}
                onAdvance={(eventId, next) => withError(async () => { await league.advanceEventStatus(eventId, next); await loadLeagueData(activeLeague.id); })}
                onAfterReview={() => loadLeagueData(activeLeague.id)}
                onGoToSeasons={() => setSection('seasons')}
              />
            )}
            {section === 'calendar' && (
              <CalendarSection
                league={league}
                fixtures={leagueFixtures}
                teams={eventTeams}
                events={events}
                venues={venues}
                runError={withError}
                onAfter={() => loadLeagueData(activeLeague.id)}
              />
            )}
            {section === 'statistics' && (
              <StatisticsSection
                leagueName={activeLeague.name}
                seasons={seasons}
                events={events}
                teams={eventTeams}
                statEvents={leagueStats}
                fixtures={leagueFixtures}
              />
            )}
            {section === 'coaches' && (
              <CoachesSection
                league={league}
                activeLeague={activeLeague}
                runError={withError}
              />
            )}
            {section === 'venues' && (
              <VenuesSection
                venues={venues}
                onCreate={input => withError(async () => { await league.createVenue(activeLeague.id, input); await loadLeagueData(activeLeague.id); })}
                onDelete={venueId => withError(async () => { await league.deleteVenue(venueId); await loadLeagueData(activeLeague.id); })}
              />
            )}
            {section === 'finance' && (
              <FinanceSection
                currency={activeLeague.currency}
                ledger={ledger}
                invoices={invoices}
                events={events}
                onAddLedger={input => withError(async () => { await league.addLedgerEntry(activeLeague.id, input); await loadLeagueData(activeLeague.id); })}
                onDeleteLedger={entryId => withError(async () => { await league.deleteLedgerEntry(entryId); await loadLeagueData(activeLeague.id); })}
                onAddInvoice={input => withError(async () => { await league.addInvoice(activeLeague.id, input); await loadLeagueData(activeLeague.id); })}
                onSettleInvoice={(invoiceId, status) => withError(async () => { await league.settleInvoice(invoiceId, status); await loadLeagueData(activeLeague.id); })}
                onDeleteInvoice={invoiceId => withError(async () => { await league.deleteInvoice(invoiceId); await loadLeagueData(activeLeague.id); })}
              />
            )}
            {section === 'settings' && (
              <SettingsSection
                league={activeLeague}
                onSave={input => withError(async () => { await league.updateLeague(activeLeague.id, input); await reload(); })}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// --- Overview ----------------------------------------------------------------

const OverviewSection = ({ league, seasons, venues, events, ledger, invoices, eventTeams, fixtures, statEvents, onAdvance, onGoToSeasons, onGoToEvents, onGoToVenues, onGoToFinance }: {
  league: League;
  seasons: LeagueSeason[];
  venues: LeagueVenue[];
  events: LeagueEvent[];
  ledger: LedgerEntry[];
  invoices: EventInvoice[];
  eventTeams: EventTeam[];
  fixtures: EventFixture[];
  statEvents: FixtureStatEvent[];
  onAdvance: (seasonId: string, next: LeagueSeasonStatus) => void;
  onGoToSeasons: () => void;
  onGoToEvents: () => void;
  onGoToVenues: () => void;
  onGoToFinance: () => void;
}) => {
  const competition = useMemo(
    () => summarizeCompetition(events, eventTeams, fixtures, statEvents),
    [events, eventTeams, fixtures, statEvents]
  );
  const activeSeasons = seasons.filter(s => s.status === 'active').length;
  const focus = seasons.find(s => s.status === 'active') ?? seasons.find(s => s.status === 'registration_open') ?? seasons[0] ?? null;
  const openEvents = events.filter(event => event.status === 'registration_open');
  const activeEvents = events.filter(event => event.status === 'active');
  const upcomingEvents = events
    .filter(event => event.status !== 'completed')
    .slice()
    .sort((a, b) => (a.starts_on ?? '9999-12-31').localeCompare(b.starts_on ?? '9999-12-31'))
    .slice(0, 3);
  const finance = summarizeLedger(ledger, invoices);
  const unpaidInvoices = invoices.filter(invoice => invoice.status === 'unpaid');
  const hasLiveCompetition = events.some(event => event.status === 'registration_open' || event.status === 'active');
  const readinessItems = [
    {
      label: 'Season calendar',
      ready: Boolean(focus?.starts_on),
      detail: focus?.starts_on ? `${focus.name} starts ${formatShortDate(focus.starts_on)}` : 'Add dates to the active season.',
      action: onGoToSeasons
    },
    {
      label: 'Venue inventory',
      ready: venues.length > 0,
      detail: venues.length > 0 ? `${venues.length} venue${venues.length === 1 ? '' : 's'} ready for scheduling.` : 'Add at least one match venue.',
      action: onGoToVenues
    },
    {
      label: 'Competition setup',
      ready: events.length > 0,
      detail: events.length > 0 ? `${events.length} event${events.length === 1 ? '' : 's'} created.` : 'Create a tournament, cup, or league event.',
      action: onGoToEvents
    },
    {
      label: 'Registration flow',
      ready: hasLiveCompetition,
      detail: hasLiveCompetition ? `${openEvents.length + activeEvents.length} event${openEvents.length + activeEvents.length === 1 ? '' : 's'} accepting or running teams.` : 'Open registration or activate an event.',
      action: onGoToEvents
    },
    {
      label: 'Finance follow-up',
      ready: finance.outstandingCents === 0,
      detail: finance.outstandingCents === 0 ? 'No unpaid invoices right now.' : `${formatMoney(finance.outstandingCents, league.currency)} still outstanding.`,
      action: onGoToFinance
    }
  ];
  const readinessScore = Math.round((readinessItems.filter(item => item.ready).length / readinessItems.length) * 100);
  const timeline = [
    focus?.starts_on ? { date: focus.starts_on, title: `${focus.name} starts`, detail: 'Season calendar' } : null,
    focus?.ends_on ? { date: focus.ends_on, title: `${focus.name} ends`, detail: 'Season calendar' } : null,
    ...events.flatMap(event => [
      event.starts_on ? { date: event.starts_on, title: `${event.name} starts`, detail: EVENT_FORMAT_LABELS[event.format] } : null,
      event.ends_on ? { date: event.ends_on, title: `${event.name} ends`, detail: EVENT_STATUS_LABELS[event.status] } : null
    ])
  ]
    .filter((item): item is { date: string; title: string; detail: string } => Boolean(item))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);
  const capacityEvents = events
    .filter(event => event.status !== 'completed')
    .slice()
    .sort((a, b) => {
      const aPriority = a.status === 'registration_open' ? 0 : a.status === 'active' ? 1 : 2;
      const bPriority = b.status === 'registration_open' ? 0 : b.status === 'active' ? 1 : 2;
      return aPriority - bPriority || (a.starts_on ?? '9999-12-31').localeCompare(b.starts_on ?? '9999-12-31');
    })
    .slice(0, 4);
  const nextActions = [
    !focus ? { label: 'Create the first season', detail: 'Seasons organize every event and table.', action: onGoToSeasons } : null,
    focus && focus.status === 'draft' ? { label: 'Open season registration', detail: `${focus.name} is still in draft.`, action: () => onAdvance(focus.id, 'registration_open') } : null,
    events.length === 0 && focus ? { label: 'Create a league event', detail: 'Start a cup, tournament, or season competition.', action: onGoToEvents } : null,
    venues.length === 0 ? { label: 'Add venue inventory', detail: 'Set match locations before scheduling.', action: onGoToVenues } : null,
    unpaidInvoices.length > 0 ? { label: 'Review outstanding invoices', detail: `${unpaidInvoices.length} unpaid invoice${unpaidInvoices.length === 1 ? '' : 's'} to collect.`, action: onGoToFinance } : null
  ].filter(Boolean) as Array<{ label: string; detail: string; action: () => void }>;

  return (
    <div className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className={`${panel} overflow-hidden p-5 sm:p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-200/80">Operations overview</p>
              <h2 className="mt-2 font-display text-3xl font-black tracking-normal text-white sm:text-4xl">
                {league.short_name ?? league.name}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                {league.description || 'Control seasons, tournaments, venues, finance, registration, and match-day operations from one league workspace.'}
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-slate-200">
              {league.currency} workspace
            </span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Seasons" value={seasons.length} detail={`${activeSeasons} active`} />
            <StatTile label="Events" value={events.length} detail={`${activeEvents.length} live now`} />
            <StatTile label="Registration" value={openEvents.length} detail="Events open to clubs" />
            <StatTile label="Net balance" value={formatMoney(finance.netCents, league.currency)} detail={`${formatMoney(finance.outstandingCents, league.currency)} outstanding`} />
          </div>
        </div>

        <section className={`${panel} overflow-hidden`}>
          <div className={sectionHeader}>
            <Activity size={16} className="text-sky-200" />
            <h2 className="font-display text-sm font-black text-white">Priority actions</h2>
          </div>
          <div className="space-y-2 p-4">
            {nextActions.length === 0 ? (
              <p className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                Your league setup looks calm. Keep reviewing registrations, fixtures, and finance as events progress.
              </p>
            ) : (
              nextActions.map(action => (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.action}
                  className={`${subtleCard} flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:border-sky-300/35 hover:bg-sky-300/10`}
                >
                  <span>
                    <span className="block text-sm font-black text-white">{action.label}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-400">{action.detail}</span>
                  </span>
                  <ChevronRight size={16} className="mt-0.5 shrink-0 text-slate-500" />
                </button>
              ))
            )}
          </div>
        </section>
      </section>

      <section className={panel}>
        <div className={sectionHeader}>
          <CalendarRange size={16} className="text-sky-200" />
          <h2 className="font-display text-sm font-black text-white">Current season</h2>
        </div>
        <div className="p-4">
          {focus ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-black text-white">{focus.name}</span>
                  <StatusBadge status={focus.status} />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {focus.starts_on ? `${focus.starts_on} → ${focus.ends_on ?? 'TBD'}` : 'Dates not set'}
                </p>
              </div>
              <SeasonAdvance season={focus} onAdvance={onAdvance} />
            </div>
          ) : (
            <div className="text-sm text-slate-400">
              No seasons yet. <button type="button" onClick={onGoToSeasons} className={inlineLink}>Create your first season</button>.
            </div>
          )}
        </div>
      </section>

      {competition.hasActivity && (
        <LiveCompetitionSection league={league} competition={competition} onGoToEvents={onGoToEvents} />
      )}

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className={panel}>
          <div className={sectionHeader}>
            <Trophy size={16} className="text-sky-200" />
            <h2 className="font-display text-sm font-black text-white">Event pipeline</h2>
          </div>
          <div className="space-y-2 p-4">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-slate-400">No upcoming events yet. Create a competition when the season is ready.</p>
            ) : (
              upcomingEvents.map(event => (
                <button
                  key={event.id}
                  type="button"
                  onClick={onGoToEvents}
                  className={`${subtleCard} flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:border-sky-300/35 hover:bg-sky-300/10`}
                >
                  <span>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-sm font-black text-white">{event.name}</span>
                      <EventStatusBadge status={event.status} />
                    </span>
                    <span className="mt-1 block text-xs text-slate-400">
                      {[EVENT_FORMAT_LABELS[event.format], event.category, event.starts_on ?? 'Date TBD'].filter(Boolean).join(' / ')}
                    </span>
                  </span>
                  <ChevronRight size={16} className="text-slate-500" />
                </button>
              ))
            )}
          </div>
        </div>
        <div className={panel}>
          <div className={sectionHeader}>
            <Wallet size={16} className="text-sky-200" />
            <h2 className="font-display text-sm font-black text-white">Finance pulse</h2>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <StatTile label="Income" value={formatMoney(finance.incomeCents, league.currency)} detail="Recorded" />
            <StatTile label="Expenses" value={formatMoney(finance.expenseCents, league.currency)} detail="Recorded" />
            <StatTile label="Collected" value={formatMoney(finance.collectedCents, league.currency)} detail="Invoices paid" />
            <StatTile label="Outstanding" value={formatMoney(finance.outstandingCents, league.currency)} detail={`${unpaidInvoices.length} unpaid`} />
          </div>
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className={panel}>
          <div className={sectionHeader}>
            <Shield size={16} className="text-sky-200" />
            <h2 className="font-display text-sm font-black text-white">League readiness</h2>
          </div>
          <div className="space-y-4 p-4">
            <ProgressMeter value={readinessScore} label="Setup health" />
            <div className="space-y-2">
              {readinessItems.map(item => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.action}
                  className={`${subtleCard} flex w-full items-start gap-3 px-4 py-3 text-left transition hover:border-sky-300/35 hover:bg-sky-300/10`}
                >
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${item.ready ? 'border-emerald-300/35 bg-emerald-400/10 text-emerald-100' : 'border-white/15 bg-white/[0.04] text-slate-400'}`}>
                    {item.ready ? <Check size={12} /> : <Clock size={12} />}
                  </span>
                  <span>
                    <span className="block text-sm font-black text-white">{item.label}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-400">{item.detail}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={panel}>
          <div className={sectionHeader}>
            <CalendarRange size={16} className="text-sky-200" />
            <h2 className="font-display text-sm font-black text-white">Operations timeline</h2>
          </div>
          <div className="p-4">
            {timeline.length === 0 ? (
              <p className="text-sm text-slate-400">Add season and event dates to build your league operating calendar.</p>
            ) : (
              <ol className="space-y-3">
                {timeline.map(item => {
                  const diff = daysUntil(item.date);
                  const timing = diff === null
                    ? formatShortDate(item.date)
                    : diff === 0
                      ? 'Today'
                      : diff > 0
                        ? `${diff} day${diff === 1 ? '' : 's'} away`
                        : `${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'} ago`;
                  return (
                    <li key={`${item.date}-${item.title}`} className={`${subtleCard} grid gap-3 px-4 py-3 sm:grid-cols-[5rem_1fr_auto] sm:items-center`}>
                      <span className="font-display text-sm font-black text-sky-100">{formatShortDate(item.date)}</span>
                      <span>
                        <span className="block text-sm font-black text-white">{item.title}</span>
                        <span className="mt-0.5 block text-xs text-slate-400">{item.detail}</span>
                      </span>
                      <span className="text-xs font-bold text-slate-400 sm:text-right">{timing}</span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      </section>

      <section className={panel}>
        <div className={sectionHeader}>
          <Users size={16} className="text-sky-200" />
          <h2 className="font-display text-sm font-black text-white">Registration and capacity planning</h2>
        </div>
        <div className="p-4">
          {capacityEvents.length === 0 ? (
            <p className="text-sm text-slate-400">Create an event to track registration status, team caps, and launch readiness.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {capacityEvents.map(event => {
                const startsIn = daysUntil(event.starts_on);
                const statusHint = event.status === 'registration_open'
                  ? 'Share the registration code with clubs.'
                  : event.status === 'active'
                    ? 'Competition is live.'
                    : 'Draft event, finish setup before opening.';
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={onGoToEvents}
                    className={`${subtleCard} flex h-full flex-col items-start gap-3 p-4 text-left transition hover:border-sky-300/35 hover:bg-sky-300/10`}
                  >
                    <span className="flex w-full flex-wrap items-start justify-between gap-2">
                      <span>
                        <span className="block font-display text-sm font-black text-white">{event.name}</span>
                        <span className="mt-1 block text-xs text-slate-400">{EVENT_FORMAT_LABELS[event.format]} / {event.category ?? 'Open category'}</span>
                      </span>
                      <EventStatusBadge status={event.status} />
                    </span>
                    <span className="grid w-full gap-2 sm:grid-cols-3">
                      <span className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
                        <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Starts</span>
                        <span className="mt-0.5 block text-xs font-bold text-slate-200">
                          {startsIn === null ? 'TBD' : startsIn === 0 ? 'Today' : startsIn > 0 ? `${startsIn}d` : 'Started'}
                        </span>
                      </span>
                      <span className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
                        <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Team cap</span>
                        <span className="mt-0.5 block text-xs font-bold text-slate-200">{event.team_cap ?? 'Open'}</span>
                      </span>
                      <span className="rounded-xl border border-white/10 bg-black/15 px-3 py-2">
                        <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Code</span>
                        <span className="mt-0.5 block text-xs font-bold text-slate-200">{event.registration_code}</span>
                      </span>
                    </span>
                    <span className="text-xs leading-5 text-slate-400">{statusHint}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

// --- Live competition rollup (dashboard) -------------------------------------

const MatchdayTile = ({ label: tileLabel, value, tone }: { label: string; value: number; tone: string }) => (
  <div className={`rounded-xl border px-3 py-2.5 ${tone}`}>
    <p className="font-display text-xl font-black leading-none">{value}</p>
    <p className="mt-1 text-[10px] font-bold uppercase tracking-wide opacity-80">{tileLabel}</p>
  </div>
);

const StandingsLeaders = ({ standing, onGoToEvents }: { standing: CompetitionStanding; onGoToEvents: () => void }) => (
  <button
    type="button"
    onClick={onGoToEvents}
    className={`${subtleCard} block w-full px-4 py-3 text-left transition hover:border-sky-300/35 hover:bg-sky-300/10`}
  >
    <span className="flex flex-wrap items-center justify-between gap-2">
      <span className="flex items-center gap-2">
        <span className="font-display text-sm font-black text-white">{standing.eventName}</span>
        <EventStatusBadge status={standing.status} />
      </span>
      <span className="text-[11px] font-bold text-slate-400">{standing.playedFixtures}/{standing.totalFixtures} played</span>
    </span>
    <span className="mt-2 block space-y-1">
      {standing.leaders.map((row, index) => (
        <span key={row.teamId} className="grid grid-cols-[1.25rem_1fr_auto] items-center gap-2 text-xs">
          <span className={`text-center font-black ${index === 0 ? 'text-amber-300' : 'text-slate-500'}`}>{index + 1}</span>
          <span className="truncate font-bold text-slate-100">{row.name}</span>
          <span className="text-slate-400">
            {row.played} PL · <span className="font-black text-white">{row.points}</span> PTS
            <span className="ml-1 text-slate-500">({row.goalDifference >= 0 ? '+' : ''}{row.goalDifference})</span>
          </span>
        </span>
      ))}
    </span>
  </button>
);

const LiveCompetitionSection = ({ league, competition, onGoToEvents }: {
  league: League;
  competition: CompetitionSummary;
  onGoToEvents: () => void;
}) => {
  const { liveMatchday, standings, scorers, recentResults } = competition;
  const readinessPct = liveMatchday.total > 0
    ? Math.round(((liveMatchday.ready + liveMatchday.completed) / liveMatchday.total) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <section className="grid gap-4 lg:grid-cols-2">
        <div className={panel}>
          <div className={sectionHeader}>
            <Activity size={16} className="text-sky-200" />
            <h2 className="font-display text-sm font-black text-white">Live match day</h2>
            {competition.activeEventCount > 0 && (
              <span className="ml-auto text-[11px] font-bold text-slate-400">
                {competition.activeEventCount} active event{competition.activeEventCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <div className="space-y-4 p-4">
            {liveMatchday.total === 0 ? (
              <p className="text-sm text-slate-400">No fixtures in an active event yet. Activate an event and generate its schedule to run match day here.</p>
            ) : (
              <>
                <ProgressMeter value={readinessPct} label="Fixtures ready or played" />
                <div className="grid grid-cols-3 gap-2">
                  <MatchdayTile label="Ready" value={liveMatchday.ready} tone="border-emerald-300/30 bg-emerald-400/10 text-emerald-100" />
                  <MatchdayTile label="Awaiting" value={liveMatchday.awaitingCheckin} tone="border-amber-300/30 bg-amber-400/10 text-amber-100" />
                  <MatchdayTile label="Completed" value={liveMatchday.completed} tone="border-white/10 bg-white/[0.05] text-slate-200" />
                </div>
                <button type="button" onClick={onGoToEvents} className={ghostBtn}>
                  Open match-day control <ChevronRight size={14} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className={panel}>
          <div className={sectionHeader}>
            <Swords size={16} className="text-sky-200" />
            <h2 className="font-display text-sm font-black text-white">Recent results</h2>
          </div>
          <div className="p-4">
            {recentResults.length === 0 ? (
              <p className="text-sm text-slate-400">No results recorded yet. Enter scores from an event's Fixtures tab.</p>
            ) : (
              <ul className="space-y-2">
                {recentResults.map(result => (
                  <li key={result.fixtureId} className={`${subtleCard} px-4 py-2.5`}>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="flex-1 truncate text-right font-bold text-slate-100">{result.homeTeamName}</span>
                      <span className="rounded-lg border border-white/10 bg-black/25 px-2 py-0.5 font-display text-sm font-black text-white">
                        {result.homeScore}–{result.awayScore}
                      </span>
                      <span className="flex-1 truncate font-bold text-slate-100">{result.awayTeamName}</span>
                    </div>
                    <p className="mt-1 truncate text-center text-[11px] text-slate-500">{result.eventName} · Round {result.round}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {(standings.length > 0 || scorers.length > 0) && (
        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className={panel}>
            <div className={sectionHeader}>
              <ListOrdered size={16} className="text-sky-200" />
              <h2 className="font-display text-sm font-black text-white">Standings leaders</h2>
            </div>
            <div className="space-y-2 p-4">
              {standings.length === 0 ? (
                <p className="text-sm text-slate-400">Standings appear once an active or completed event has a result.</p>
              ) : (
                standings.map(standing => (
                  <StandingsLeaders key={standing.eventId} standing={standing} onGoToEvents={onGoToEvents} />
                ))
              )}
            </div>
          </div>

          <div className={panel}>
            <div className={sectionHeader}>
              <Target size={16} className="text-sky-200" />
              <h2 className="font-display text-sm font-black text-white">Top scorers</h2>
              <span className="ml-auto text-[11px] font-bold uppercase tracking-wide text-slate-500">{league.name}</span>
            </div>
            <div className="p-4">
              {scorers.length === 0 ? (
                <p className="text-sm text-slate-400">No goals recorded yet. Log goals from an event's Stats tab.</p>
              ) : (
                <ul className="space-y-2">
                  {scorers.map((scorer, index) => (
                    <li key={`${scorer.teamId}-${scorer.playerName}`} className={`${subtleCard} flex items-center gap-3 px-4 py-2.5`}>
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${index === 0 ? 'bg-amber-400/20 text-amber-200' : 'bg-white/[0.06] text-slate-400'}`}>
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black text-white">{scorer.playerName}</span>
                        <span className="block truncate text-[11px] text-slate-500">{scorer.teamName}{scorer.eventName ? ` · ${scorer.eventName}` : ''}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="font-display text-base font-black text-white">{scorer.goals}</span>
                        <span className="ml-1 text-[11px] font-bold text-slate-500">G</span>
                        {scorer.assists > 0 && <span className="ml-2 text-[11px] text-slate-500">{scorer.assists} A</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

const SeasonAdvance = ({ season, onAdvance }: { season: LeagueSeason; onAdvance: (seasonId: string, next: LeagueSeasonStatus) => void }) => {
  const nexts = nextSeasonStatuses(season.status);
  if (nexts.length === 0) return <span className="text-xs text-slate-500">Archived — read-only</span>;
  const next = nexts[0];
  return (
    <button type="button" className={primaryBtn} onClick={() => onAdvance(season.id, next)}>
      Advance to {SEASON_STATUS_LABELS[next]} <ChevronRight size={14} />
    </button>
  );
};

// --- Seasons -----------------------------------------------------------------

const SeasonsSection = ({ seasons, onCreate, onAdvance }: {
  seasons: LeagueSeason[];
  onCreate: (input: { name: string; year?: number | null; startsOn?: string | null; endsOn?: string | null }) => void;
  onAdvance: (seasonId: string, next: LeagueSeasonStatus) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [startsOn, setStartsOn] = useState('');
  const [endsOn, setEndsOn] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onCreate({ name, year: year ? Number(year) : null, startsOn: startsOn || null, endsOn: endsOn || null });
    setName(''); setYear(''); setStartsOn(''); setEndsOn(''); setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-black uppercase tracking-wide text-white">Seasons</h2>
        <button type="button" className={primaryBtn} onClick={() => setOpen(v => !v)}><Plus size={14} /> New season</button>
      </div>

      {open && (
        <form onSubmit={submit} className={`${panel} space-y-3 p-4`}>
          <p className="text-xs text-slate-400">Every new season starts empty — no clubs, rosters, or rules are copied forward.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1"><label className={label}>Season name</label><input className={inputClass} required value={name} onChange={e => setName(e.target.value)} placeholder="Season 2026" /></div>
            <div className="space-y-1"><label className={label}>Year</label><input className={inputClass} type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="2026" /></div>
            <div className="space-y-1"><label className={label}>Starts on</label><input className={inputClass} type="date" value={startsOn} onChange={e => setStartsOn(e.target.value)} /></div>
            <div className="space-y-1"><label className={label}>Ends on</label><input className={inputClass} type="date" value={endsOn} onChange={e => setEndsOn(e.target.value)} /></div>
          </div>
          <button type="submit" className={primaryBtn}><Save size={14} /> Create season</button>
        </form>
      )}

      {seasons.length === 0 ? (
        <p className={`${panel} p-6 text-center text-sm text-slate-400`}>No seasons yet.</p>
      ) : (
        <ul className="space-y-2">
          {seasons.map(season => (
            <li key={season.id} className={`${panel} flex flex-wrap items-center justify-between gap-3 p-4`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-black text-white">{season.name}</span>
                  <StatusBadge status={season.status} />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {season.year ? `${season.year} · ` : ''}{season.starts_on ? `${season.starts_on} → ${season.ends_on ?? 'TBD'}` : 'Dates not set'}
                </p>
              </div>
              <SeasonAdvance season={season} onAdvance={onAdvance} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// --- Events + registration ---------------------------------------------------

const EventStatusBadge = ({ status }: { status: LeagueEventStatus }) => (
  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${eventStatusTone[status]}`}>
    {EVENT_STATUS_LABELS[status]}
  </span>
);

const EVENT_FORMATS: LeagueEventFormat[] = ['round_robin', 'single_elimination', 'group_knockout'];

interface EventCreateInput {
  seasonId: string;
  name: string;
  format?: LeagueEventFormat | null;
  category?: string | null;
  teamCap?: number | null;
  startsOn?: string | null;
  endsOn?: string | null;
}

const EventsSection = ({ league, events, seasons, runError, onCreate, onAdvance, onAfterReview, onGoToSeasons }: {
  league: CloudLeagueRepository;
  events: LeagueEvent[];
  seasons: LeagueSeason[];
  runError: (fn: () => Promise<unknown>) => Promise<void>;
  onCreate: (input: EventCreateInput) => void;
  onAdvance: (eventId: string, next: LeagueEventStatus) => void;
  onAfterReview: () => void;
  onGoToSeasons: () => void;
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => events.find(e => e.id === selectedId) ?? null, [events, selectedId]);

  if (selected) {
    return (
      <EventDetail
        league={league}
        event={selected}
        runError={runError}
        onBack={() => setSelectedId(null)}
        onAdvance={onAdvance}
        onAfterReview={onAfterReview}
      />
    );
  }

  return (
    <EventsList
      events={events}
      seasons={seasons}
      onCreate={onCreate}
      onOpen={setSelectedId}
      onGoToSeasons={onGoToSeasons}
    />
  );
};

const EventsList = ({ events, seasons, onCreate, onOpen, onGoToSeasons }: {
  events: LeagueEvent[];
  seasons: LeagueSeason[];
  onCreate: (input: EventCreateInput) => void;
  onOpen: (eventId: string) => void;
  onGoToSeasons: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [seasonId, setSeasonId] = useState(seasons[0]?.id ?? '');
  const [name, setName] = useState('');
  const [format, setFormat] = useState<LeagueEventFormat>('round_robin');
  const [category, setCategory] = useState('');
  const [teamCap, setTeamCap] = useState('');
  const [startsOn, setStartsOn] = useState('');
  const [endsOn, setEndsOn] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onCreate({
      seasonId, name, format, category: category || null,
      teamCap: teamCap ? Number(teamCap) : null, startsOn: startsOn || null, endsOn: endsOn || null
    });
    setName(''); setCategory(''); setTeamCap(''); setStartsOn(''); setEndsOn(''); setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-black uppercase tracking-wide text-white">Events</h2>
        {seasons.length > 0 && (
          <button type="button" className={primaryBtn} onClick={() => setOpen(v => !v)}><Plus size={14} /> New event</button>
        )}
      </div>

      {seasons.length === 0 ? (
        <p className={`${panel} p-6 text-center text-sm text-slate-400`}>
          Create a season first — every event belongs to one.{' '}
          <button type="button" onClick={onGoToSeasons} className="font-bold text-sky-200 transition hover:text-white">Go to Seasons</button>.
        </p>
      ) : (
        <>
          {open && (
            <form onSubmit={submit} className={`${panel} space-y-3 p-4`}>
              <p className="text-xs text-slate-400">A tournament or competition inside a season. You'll get a shareable registration link once it opens.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className={label}>Season</label>
                  <select className={selectClass} required value={seasonId} onChange={e => setSeasonId(e.target.value)}>
                    {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1"><label className={label}>Event name</label><input className={inputClass} required value={name} onChange={e => setName(e.target.value)} placeholder="Metro Cup Qualifiers" /></div>
                <div className="space-y-1">
                  <label className={label}>Format</label>
                  <select className={selectClass} value={format} onChange={e => setFormat(e.target.value as LeagueEventFormat)}>
                    {EVENT_FORMATS.map(f => <option key={f} value={f}>{EVENT_FORMAT_LABELS[f]}</option>)}
                  </select>
                </div>
                <div className="space-y-1"><label className={label}>Age group</label><input className={inputClass} value={category} onChange={e => setCategory(e.target.value)} placeholder="U14" /></div>
                <div className="space-y-1"><label className={label}>Team cap</label><input className={inputClass} type="number" min={1} value={teamCap} onChange={e => setTeamCap(e.target.value)} placeholder="No limit" /></div>
                <div className="space-y-1"><label className={label}>Starts on</label><input className={inputClass} type="date" value={startsOn} onChange={e => setStartsOn(e.target.value)} /></div>
                <div className="space-y-1"><label className={label}>Ends on</label><input className={inputClass} type="date" value={endsOn} onChange={e => setEndsOn(e.target.value)} /></div>
              </div>
              <button type="submit" className={primaryBtn}><Save size={14} /> Create event</button>
            </form>
          )}

          {events.length === 0 ? (
            <p className={`${panel} p-6 text-center text-sm text-slate-400`}>No events yet. Create one to open registration for clubs.</p>
          ) : (
            <ul className="space-y-2">
              {events.map(event => (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(event.id)}
                    className={`${panel} flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left transition-colors hover:border-sky-300/35`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-black text-white">{event.name}</span>
                        <EventStatusBadge status={event.status} />
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {[EVENT_FORMAT_LABELS[event.format], event.category, event.team_cap ? `${event.team_cap} teams` : 'No cap'].filter(Boolean).join(' · ')}
                        {event.starts_on ? ` · ${event.starts_on}` : ''}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-slate-500" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

type EventTab = 'applications' | 'teams' | 'fixtures' | 'table' | 'stats' | 'matchday';

const EVENT_TABS: Array<{ id: EventTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: 'applications', label: 'Applications', icon: Users },
  { id: 'teams', label: 'Teams', icon: Shield },
  { id: 'fixtures', label: 'Fixtures', icon: Swords },
  { id: 'table', label: 'Table', icon: ListOrdered },
  { id: 'stats', label: 'Stats', icon: Target },
  { id: 'matchday', label: 'Match day', icon: Activity }
];

const EventDetail = ({ league, event, runError, onBack, onAdvance, onAfterReview }: {
  league: CloudLeagueRepository;
  event: LeagueEvent;
  runError: (fn: () => Promise<unknown>) => Promise<void>;
  onBack: () => void;
  onAdvance: (eventId: string, next: LeagueEventStatus) => void;
  onAfterReview: () => void;
}) => {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [teams, setTeams] = useState<EventTeam[]>([]);
  const [fixtures, setFixtures] = useState<EventFixture[]>([]);
  const [statEvents, setStatEvents] = useState<FixtureStatEvent[]>([]);
  const [awards, setAwards] = useState<EventAward[]>([]);
  const [incidents, setIncidents] = useState<EventIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<EventTab>('applications');

  const refresh = useCallback(async () => {
    const [regs, tms, fxs, stats, aws, incs] = await Promise.all([
      league.listRegistrations(event.id),
      league.listEventTeams(event.id),
      league.listFixtures(event.id),
      league.listStatEvents(event.id),
      league.listAwards(event.id),
      league.listIncidents(event.id)
    ]);
    setRegistrations(regs);
    setTeams(tms);
    setFixtures(fxs);
    setStatEvents(stats);
    setAwards(aws);
    setIncidents(incs);
  }, [league, event.id]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    refresh().finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  const approvedCount = registrations.filter(r => r.status === 'approved').length;
  const spots = spotsRemaining(event.team_cap, approvedCount);
  const nexts = nextEventStatuses(event.status);
  const registerUrl = typeof window !== 'undefined' ? `${window.location.origin}/#/register` : '/#/register';
  const teamName = (id: string) => teams.find(t => t.id === id)?.name ?? 'TBD';

  const copyCode = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(event.registration_code);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* clipboard unavailable — the code is shown for manual copy */
    }
  };

  const review = (registrationId: string, status: EventRegistrationStatus) =>
    runError(async () => { await league.reviewRegistration(registrationId, status); await refresh(); onAfterReview(); });

  const addTeam = (name: string) =>
    runError(async () => { await league.addEventTeam(event.league_id, event.id, { name }); await refresh(); });
  const addApprovedTeams = () =>
    runError(async () => { await league.syncApprovedTeams(event.league_id, event.id); await refresh(); });
  const removeTeam = (teamId: string) =>
    runError(async () => { await league.deleteEventTeam(teamId); await refresh(); });
  const isKnockout = event.format === 'single_elimination';
  const generateFixtures = () =>
    runError(async () => {
      if (isKnockout) await league.generateBracket(event.league_id, event.id);
      else await league.generateFixtures(event.league_id, event.id);
      await refresh();
    });
  const clearFixtures = () =>
    runError(async () => { await league.clearFixtures(event.id); await refresh(); });
  const recordResult = (fixtureId: string, home: number, away: number) =>
    runError(async () => {
      await league.recordFixtureResult(fixtureId, home, away);
      if (isKnockout) await league.syncBracket(event.id);
      await refresh();
    });
  const addStat = (input: FixtureStatInput) =>
    runError(async () => { await league.addStatEvent(event.league_id, event.id, input); await refresh(); });
  const deleteStat = (statEventId: string) =>
    runError(async () => { await league.deleteStatEvent(statEventId); await refresh(); });
  const addAward = (input: { title: string; recipientType: AwardRecipientType; teamId?: string | null; playerName?: string | null }) =>
    runError(async () => { await league.addAward(event.league_id, event.id, input); await refresh(); });
  const deleteAward = (awardId: string) =>
    runError(async () => { await league.deleteAward(awardId); await refresh(); });
  const setFixtureOps = (fixtureId: string, patch: FixtureOpsPatch) =>
    runError(async () => { await league.setFixtureOps(fixtureId, patch); await refresh(); });
  const addIncident = (input: EventIncidentInput) =>
    runError(async () => { await league.addIncident(event.league_id, event.id, input); await refresh(); });
  const deleteIncident = (incidentId: string) =>
    runError(async () => { await league.deleteIncident(incidentId); await refresh(); });

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className={ghostBtn}><ChevronLeft size={14} /> All events</button>

      <section className={panel}>
        <div className={sectionHeader}>
          <Trophy size={16} className="text-sky-200" />
          <h2 className="font-display text-sm font-black text-white">{event.name}</h2>
          <EventStatusBadge status={event.status} />
        </div>
        <div className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Registered" value={`${approvedCount}${event.team_cap ? ` / ${event.team_cap}` : ''}`} detail={spots === null ? 'No cap' : `${spots} spots left`} />
            <StatTile label="Teams" value={teams.length} detail="In this event" />
            <StatTile label="Format" value={EVENT_FORMAT_LABELS[event.format]} detail={event.category ?? 'All ages'} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div>
              <p className="text-[11px] font-black uppercase text-slate-400">Registration code</p>
              <p className="mt-1 font-display text-xl font-black tracking-[0.2em] text-white">{event.registration_code}</p>
              <p className="mt-1 text-xs text-slate-400">
                {event.status === 'registration_open'
                  ? <>Share <span className="text-sky-200">{registerUrl}</span> and this code with clubs.</>
                  : 'Applications open only while the event is in Registration open.'}
              </p>
            </div>
            <button type="button" className={ghostBtn} onClick={copyCode}>
              {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy code</>}
            </button>
          </div>

          {nexts.length > 0 ? (
            <button type="button" className={primaryBtn} onClick={() => onAdvance(event.id, nexts[0])}>
              Advance to {EVENT_STATUS_LABELS[nexts[0]]} <ChevronRight size={14} />
            </button>
          ) : (
            <p className="text-xs text-slate-500">This event is completed — read-only.</p>
          )}
        </div>
      </section>

      <nav className="flex flex-wrap gap-2">
        {EVENT_TABS.map(item => {
          const active = item.id === tab;
          const Icon = item.icon;
          const count = item.id === 'applications' ? registrations.length : item.id === 'teams' ? teams.length : null;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${active ? navItemActive : navItemIdle}`}
            >
              <Icon size={14} /> {item.label}{count ? ` (${count})` : ''}
            </button>
          );
        })}
      </nav>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-300"><Loader2 size={16} className="animate-spin" /> Loading event…</div>
      ) : (
        <>
          {tab === 'applications' && <ApplicationsPanel registrations={registrations} onReview={review} />}
          {tab === 'teams' && <TeamsPanel teams={teams} approvedCount={approvedCount} onAdd={addTeam} onAddApproved={addApprovedTeams} onRemove={removeTeam} />}
          {tab === 'fixtures' && (isKnockout
            ? <BracketPanel fixtures={fixtures} teamCount={teams.length} teamName={teamName} onGenerate={generateFixtures} onClear={clearFixtures} onRecord={recordResult} />
            : <FixturesPanel fixtures={fixtures} teamCount={teams.length} teamName={teamName} onGenerate={generateFixtures} onClear={clearFixtures} onRecord={recordResult} />)}
          {tab === 'table' && (isKnockout
            ? <BracketTablePanel fixtures={fixtures} teamName={teamName} />
            : <TablePanel standings={computeStandings(teams, fixtures)} />)}
          {tab === 'stats' && (
            <StatsPanel
              teams={teams}
              fixtures={fixtures}
              statEvents={statEvents}
              awards={awards}
              standings={computeStandings(teams, fixtures)}
              teamName={teamName}
              onAddStat={addStat}
              onDeleteStat={deleteStat}
              onAddAward={addAward}
              onDeleteAward={deleteAward}
            />
          )}
          {tab === 'matchday' && (
            <MatchdayPanel
              fixtures={fixtures}
              incidents={incidents}
              teamName={teamName}
              onSetOps={setFixtureOps}
              onAddIncident={addIncident}
              onDeleteIncident={deleteIncident}
            />
          )}
        </>
      )}
    </div>
  );
};

const ApplicationsPanel = ({ registrations, onReview }: {
  registrations: EventRegistration[];
  onReview: (registrationId: string, status: EventRegistrationStatus) => void;
}) => (
  <section className={panel}>
    <div className={sectionHeader}>
      <Users size={16} className="text-sky-200" />
      <h2 className="font-display text-sm font-black text-white">Applications</h2>
    </div>
    <div className="p-4">
      {registrations.length === 0 ? (
        <p className="text-sm text-slate-400">No applications yet. Share the registration code to invite clubs.</p>
      ) : (
        <ul className="space-y-2">
          {registrations.map(reg => (
            <li key={reg.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-black text-white">{reg.club_name}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${registrationTone[reg.status]}`}>
                      {REGISTRATION_STATUS_LABELS[reg.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {[reg.team_name, reg.category, reg.roster_size ? `${reg.roster_size} players` : null].filter(Boolean).join(' · ') || '—'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{reg.contact_name} · {reg.contact_email}</p>
                  {reg.message && <p className="mt-2 rounded-lg bg-black/20 px-3 py-2 text-xs text-slate-300">“{reg.message}”</p>}
                </div>
                {(reg.status === 'submitted' || reg.status === 'waitlisted') && (
                  <div className="flex items-center gap-1.5">
                    <button type="button" className={`${primaryBtn} !px-3`} onClick={() => onReview(reg.id, 'approved')}><Check size={14} /> Approve</button>
                    <button type="button" aria-label="Waitlist" className={`${ghostBtn} !px-2.5`} onClick={() => onReview(reg.id, 'waitlisted')}><Clock size={14} /></button>
                    <button type="button" aria-label="Reject" className={`${ghostBtn} !px-2.5`} onClick={() => onReview(reg.id, 'rejected')}><X size={14} /></button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  </section>
);

const TeamsPanel = ({ teams, approvedCount, onAdd, onAddApproved, onRemove }: {
  teams: EventTeam[];
  approvedCount: number;
  onAdd: (name: string) => void;
  onAddApproved: () => void;
  onRemove: (teamId: string) => void;
}) => {
  const [name, setName] = useState('');
  const linkedCount = teams.filter(t => t.registration_id).length;
  const pendingApproved = Math.max(0, approvedCount - linkedCount);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name);
    setName('');
  };

  return (
    <section className={panel}>
      <div className={sectionHeader}>
        <Shield size={16} className="text-sky-200" />
        <h2 className="font-display text-sm font-black text-white">Teams</h2>
      </div>
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <form onSubmit={submit} className="flex flex-1 items-end gap-2">
            <div className="flex-1 space-y-1">
              <label className={label}>Add a team</label>
              <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="Team name" />
            </div>
            <button type="submit" className={primaryBtn}><Plus size={14} /> Add</button>
          </form>
          {pendingApproved > 0 && (
            <button type="button" className={ghostBtn} onClick={onAddApproved}>
              <Plus size={14} /> Add {pendingApproved} approved
            </button>
          )}
        </div>

        {teams.length === 0 ? (
          <p className="text-sm text-slate-400">No teams yet. Add them by hand, or pull in approved applicants.</p>
        ) : (
          <ul className="space-y-2">
            {teams.map((team, index) => (
              <li key={team.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-display text-xs font-black text-slate-500">{index + 1}</span>
                  <span className="font-display text-sm font-black text-white">{team.name}</span>
                  {team.registration_id && <span className="rounded-full border border-emerald-400/40 bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-100">Registered</span>}
                </div>
                <button type="button" aria-label="Remove team" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-rose-300" onClick={() => onRemove(team.id)}>
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

const FixturesPanel = ({ fixtures, teamCount, teamName, onGenerate, onClear, onRecord }: {
  fixtures: EventFixture[];
  teamCount: number;
  teamName: (id: string) => string;
  onGenerate: () => void;
  onClear: () => void;
  onRecord: (fixtureId: string, home: number, away: number) => void;
}) => {
  const rounds = [...new Set(fixtures.map(f => f.round))].sort((a, b) => a - b);
  const played = fixtures.filter(f => f.status === 'completed').length;

  return (
    <section className={panel}>
      <div className={`${sectionHeader} justify-between`}>
        <div className="flex items-center gap-2">
          <Swords size={16} className="text-sky-200" />
          <h2 className="font-display text-sm font-black text-white">Fixtures</h2>
        </div>
        {fixtures.length > 0 && (
          <button type="button" className={`${ghostBtn} !py-1.5`} onClick={onClear}><RefreshCw size={13} /> Clear & regenerate</button>
        )}
      </div>
      <div className="space-y-4 p-4">
        {fixtures.length === 0 ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-slate-400">
              {teamCount < 2 ? 'Add at least two teams to generate a schedule.' : 'Generate a round-robin schedule — every team plays every other once.'}
            </p>
            <button type="button" className={primaryBtn} disabled={teamCount < 2} onClick={onGenerate}>
              <Shuffle size={14} /> Generate fixtures
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-400">{played} of {fixtures.length} played</p>
            {rounds.map(round => (
              <div key={round} className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Round {round}</p>
                {fixtures.filter(f => f.round === round).map(fixture => (
                  <FixtureRow key={fixture.id} fixture={fixture} teamName={teamName} onRecord={onRecord} />
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
};

const FixtureRow = ({ fixture, teamName, onRecord }: {
  fixture: EventFixture;
  teamName: (id: string) => string;
  onRecord: (fixtureId: string, home: number, away: number) => void;
}) => {
  const [home, setHome] = useState(fixture.home_score?.toString() ?? '');
  const [away, setAway] = useState(fixture.away_score?.toString() ?? '');
  const dirty = home !== (fixture.home_score?.toString() ?? '') || away !== (fixture.away_score?.toString() ?? '');
  const canSave = home !== '' && away !== '' && dirty;

  const scoreInput = 'h-9 w-12 rounded-lg border border-white/10 bg-[#0b1726]/85 text-center font-display text-sm font-black text-white';

  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">
      <span className="flex-1 truncate text-right text-sm font-bold text-white">{teamName(fixture.home_team_id)}</span>
      <input aria-label="Home score" type="number" min={0} className={scoreInput} value={home} onChange={e => setHome(e.target.value)} />
      <span className="text-xs text-slate-500">v</span>
      <input aria-label="Away score" type="number" min={0} className={scoreInput} value={away} onChange={e => setAway(e.target.value)} />
      <span className="flex-1 truncate text-sm font-bold text-white">{teamName(fixture.away_team_id)}</span>
      <button
        type="button"
        aria-label="Save result"
        disabled={!canSave}
        onClick={() => onRecord(fixture.id, Number(home), Number(away))}
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${canSave ? 'text-emerald-300 hover:bg-emerald-300/10' : 'text-slate-600'}`}
      >
        {fixture.status === 'completed' && !dirty ? <Check size={16} /> : <Save size={16} />}
      </button>
    </div>
  );
};

// --- Knockout bracket UI -----------------------------------------------------

const BracketMatch = ({ fixture, teamName, onRecord }: {
  fixture: EventFixture;
  teamName: (id: string) => string;
  onRecord: (fixtureId: string, home: number, away: number) => void;
}) => {
  const bothTeams = Boolean(fixture.home_team_id) && Boolean(fixture.away_team_id);
  const [home, setHome] = useState(fixture.home_score?.toString() ?? '');
  const [away, setAway] = useState(fixture.away_score?.toString() ?? '');
  const dirty = home !== (fixture.home_score?.toString() ?? '') || away !== (fixture.away_score?.toString() ?? '');
  const equal = home !== '' && away !== '' && Number(home) === Number(away);
  const canSave = bothTeams && home !== '' && away !== '' && !equal && dirty;
  const winner = bracketWinnerId(fixture);
  const scoreInput = 'h-8 w-11 rounded-lg border border-white/10 bg-[#0b1726]/85 text-center font-display text-sm font-black text-white disabled:opacity-40';

  const teamCell = (id: string | null, align: 'left' | 'right') => (
    <span className={`flex-1 truncate text-sm font-bold ${align === 'right' ? 'text-right' : ''} ${id && winner === id ? 'text-emerald-200' : id ? 'text-white' : 'italic text-slate-500'}`}>
      {id ? teamName(id) : 'TBD'}
    </span>
  );

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">
      <div className="flex items-center gap-2">
        {teamCell(fixture.home_team_id, 'right')}
        <input aria-label="Home score" type="number" min={0} disabled={!bothTeams} className={scoreInput} value={home} onChange={e => setHome(e.target.value)} />
        <span className="text-xs text-slate-500">v</span>
        <input aria-label="Away score" type="number" min={0} disabled={!bothTeams} className={scoreInput} value={away} onChange={e => setAway(e.target.value)} />
        {teamCell(fixture.away_team_id, 'left')}
        <button
          type="button"
          aria-label="Save result"
          disabled={!canSave}
          onClick={() => onRecord(fixture.id, Number(home), Number(away))}
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${canSave ? 'text-emerald-300 hover:bg-emerald-300/10' : 'text-slate-600'}`}
        >
          {fixture.status === 'completed' && !dirty ? <Check size={16} /> : <Save size={16} />}
        </button>
      </div>
      {equal && <p className="mt-1 text-right text-[11px] text-amber-300">A knockout match needs a winner.</p>}
    </div>
  );
};

const BracketPanel = ({ fixtures, teamCount, teamName, onGenerate, onClear, onRecord }: {
  fixtures: EventFixture[];
  teamCount: number;
  teamName: (id: string) => string;
  onGenerate: () => void;
  onClear: () => void;
  onRecord: (fixtureId: string, home: number, away: number) => void;
}) => {
  const rounds = [...new Set(fixtures.map(f => f.round))].sort((a, b) => a - b);
  const totalRounds = rounds.length ? Math.max(...rounds) : 0;

  return (
    <section className={panel}>
      <div className={`${sectionHeader} justify-between`}>
        <div className="flex items-center gap-2">
          <Swords size={16} className="text-sky-200" />
          <h2 className="font-display text-sm font-black text-white">Bracket</h2>
        </div>
        {fixtures.length > 0 && (
          <button type="button" className={`${ghostBtn} !py-1.5`} onClick={onClear}><RefreshCw size={13} /> Clear & regenerate</button>
        )}
      </div>
      <div className="space-y-4 p-4">
        {fixtures.length === 0 ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-slate-400">
              {teamCount < 2 ? 'Add at least two teams to draw a bracket.' : 'Generate a single-elimination bracket — winners advance, and odd fields get byes.'}
            </p>
            <button type="button" className={primaryBtn} disabled={teamCount < 2} onClick={onGenerate}>
              <Shuffle size={14} /> Generate bracket
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rounds.map(round => (
              <div key={round} className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-wide text-sky-200/80">{bracketRoundName(round, totalRounds)}</p>
                {fixtures.filter(f => f.round === round).map(fixture => (
                  <BracketMatch key={fixture.id} fixture={fixture} teamName={teamName} onRecord={onRecord} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const BracketTablePanel = ({ fixtures, teamName }: { fixtures: EventFixture[]; teamName: (id: string) => string }) => {
  const totalRounds = fixtures.length ? Math.max(...fixtures.map(f => f.round)) : 0;
  const final = fixtures.find(f => f.round === totalRounds && (f.sequence ?? 1) === 1) ?? null;
  const champion = final ? bracketWinnerId(final) : null;

  return (
    <section className={panel}>
      <div className={sectionHeader}>
        <Trophy size={16} className="text-sky-200" />
        <h2 className="font-display text-sm font-black text-white">Bracket result</h2>
      </div>
      <div className="p-4">
        {!final ? (
          <p className="text-sm text-slate-400">Generate the bracket and record results to crown a champion.</p>
        ) : champion ? (
          <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-5 text-center">
            <Medal size={22} className="mx-auto text-amber-300" />
            <p className="mt-2 text-[11px] font-black uppercase tracking-wide text-amber-200/80">Champion</p>
            <p className="mt-1 font-display text-2xl font-black text-white">{teamName(champion)}</p>
            <p className="mt-2 text-xs text-slate-400">
              Final: {teamName(final.home_team_id)} {final.home_score}–{final.away_score} {teamName(final.away_team_id)}
            </p>
          </div>
        ) : (
          <p className="text-sm leading-6 text-slate-400">
            The champion is crowned in the final
            {final.home_team_id && final.away_team_id
              ? <>: <span className="font-bold text-white">{teamName(final.home_team_id)}</span> vs <span className="font-bold text-white">{teamName(final.away_team_id)}</span>.</>
              : ' once both finalists are known.'}
          </p>
        )}
      </div>
    </section>
  );
};

const TablePanel = ({ standings }: { standings: ReturnType<typeof computeStandings> }) => (
  <section className={panel}>
    <div className={sectionHeader}>
      <ListOrdered size={16} className="text-sky-200" />
      <h2 className="font-display text-sm font-black text-white">Standings</h2>
    </div>
    <div className="p-4">
      {standings.length === 0 ? (
        <p className="text-sm text-slate-400">Add teams and record results to build the table.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] font-black uppercase text-slate-400">
                <th className="px-2 py-2 text-left">#</th>
                <th className="px-2 py-2 text-left">Team</th>
                <th className="px-2 py-2 text-right">P</th>
                <th className="px-2 py-2 text-right">W</th>
                <th className="px-2 py-2 text-right">D</th>
                <th className="px-2 py-2 text-right">L</th>
                <th className="px-2 py-2 text-right">GF</th>
                <th className="px-2 py-2 text-right">GA</th>
                <th className="px-2 py-2 text-right">GD</th>
                <th className="px-2 py-2 text-right">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, index) => (
                <tr key={row.teamId} className="border-t border-white/10">
                  <td className="px-2 py-2 text-slate-500">{index + 1}</td>
                  <td className="px-2 py-2 font-bold text-white">{row.name}</td>
                  <td className="px-2 py-2 text-right text-slate-300">{row.played}</td>
                  <td className="px-2 py-2 text-right text-slate-300">{row.won}</td>
                  <td className="px-2 py-2 text-right text-slate-300">{row.drawn}</td>
                  <td className="px-2 py-2 text-right text-slate-300">{row.lost}</td>
                  <td className="px-2 py-2 text-right text-slate-300">{row.goalsFor}</td>
                  <td className="px-2 py-2 text-right text-slate-300">{row.goalsAgainst}</td>
                  <td className="px-2 py-2 text-right text-slate-300">{row.goalDifference}</td>
                  <td className="px-2 py-2 text-right font-black text-white">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </section>
);

// --- Statistics + awards -----------------------------------------------------

const STAT_TYPES: FixtureStatType[] = ['goal', 'assist', 'yellow_card', 'red_card', 'own_goal'];

const StatsPanel = ({ teams, fixtures, statEvents, awards, standings, teamName, onAddStat, onDeleteStat, onAddAward, onDeleteAward }: {
  teams: EventTeam[];
  fixtures: EventFixture[];
  statEvents: FixtureStatEvent[];
  awards: EventAward[];
  standings: ReturnType<typeof computeStandings>;
  teamName: (id: string) => string;
  onAddStat: (input: FixtureStatInput) => void;
  onDeleteStat: (statEventId: string) => void;
  onAddAward: (input: { title: string; recipientType: AwardRecipientType; teamId?: string | null; playerName?: string | null }) => void;
  onDeleteAward: (awardId: string) => void;
}) => {
  const scorers = computeScorers(statEvents);
  const discipline = computeDiscipline(statEvents);
  const suggestions = suggestAwards(standings, scorers);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <LeaderboardCard title="Top scorers" icon={Target}>
          {scorers.length === 0 ? (
            <p className="text-sm text-slate-400">No goals recorded yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {scorers.map((row, index) => (
                <li key={`${row.teamId}-${row.playerName}`} className="flex items-center gap-3 text-sm">
                  <span className="w-5 text-right font-display text-xs font-black text-slate-500">{index + 1}</span>
                  <span className="flex-1 truncate"><span className="font-bold text-white">{row.playerName}</span> <span className="text-slate-500">· {teamName(row.teamId)}</span></span>
                  <span className="font-display font-black text-white">{row.goals}<span className="text-[11px] font-bold text-slate-500"> G</span></span>
                  {row.assists > 0 && <span className="text-xs text-slate-400">{row.assists} A</span>}
                </li>
              ))}
            </ul>
          )}
        </LeaderboardCard>

        <LeaderboardCard title="Discipline" icon={Shield}>
          {discipline.length === 0 ? (
            <p className="text-sm text-slate-400">No cards recorded yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {discipline.map(row => (
                <li key={`${row.teamId}-${row.playerName}`} className="flex items-center gap-3 text-sm">
                  <span className="flex-1 truncate"><span className="font-bold text-white">{row.playerName}</span> <span className="text-slate-500">· {teamName(row.teamId)}</span></span>
                  {row.yellow > 0 && <span className="rounded border border-yellow-200/25 bg-yellow-300/10 px-1.5 text-xs font-bold text-yellow-100">{row.yellow}Y</span>}
                  {row.red > 0 && <span className="rounded border border-rose-400/40 bg-rose-400/15 px-1.5 text-xs font-bold text-rose-100">{row.red}R</span>}
                </li>
              ))}
            </ul>
          )}
        </LeaderboardCard>
      </div>

      <AddStatForm teams={teams} fixtures={fixtures} onAddStat={onAddStat} />

      {statEvents.length > 0 && (
        <section className={panel}>
          <div className={sectionHeader}>
            <Target size={16} className="text-sky-200" />
            <h2 className="font-display text-sm font-black text-white">Stat log</h2>
          </div>
          <ul className="divide-y divide-white/10 p-2">
            {statEvents.map(s => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-2 py-2 text-sm">
                <span className="truncate">
                  <span className="font-bold text-white">{s.player_name}</span>
                  <span className="text-slate-500"> · {teamName(s.team_id)} · {STAT_TYPE_LABELS[s.stat_type]}{s.minute !== null ? ` · ${s.minute}'` : ''}</span>
                </span>
                <button type="button" aria-label="Remove stat" className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-rose-300" onClick={() => onDeleteStat(s.id)}>
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AwardsCard awards={awards} teams={teams} teamName={teamName} suggestions={suggestions} onAdd={onAddAward} onDelete={onDeleteAward} />
    </div>
  );
};

const LeaderboardCard = ({ title, icon: Icon, children }: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) => (
  <section className={panel}>
    <div className={sectionHeader}>
      <Icon size={16} className="text-sky-200" />
      <h2 className="font-display text-sm font-black text-white">{title}</h2>
    </div>
    <div className="p-4">{children}</div>
  </section>
);

const AddStatForm = ({ teams, fixtures, onAddStat }: {
  teams: EventTeam[];
  fixtures: EventFixture[];
  onAddStat: (input: FixtureStatInput) => void;
}) => {
  const [fixtureId, setFixtureId] = useState(fixtures[0]?.id ?? '');
  const [teamId, setTeamId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [statType, setStatType] = useState<FixtureStatType>('goal');
  const [minute, setMinute] = useState('');

  const selectedFixture = fixtures.find(f => f.id === fixtureId) ?? null;
  const teamOptions = selectedFixture
    ? teams.filter(t => t.id === selectedFixture.home_team_id || t.id === selectedFixture.away_team_id)
    : [];

  useEffect(() => {
    if (selectedFixture && !teamOptions.some(t => t.id === teamId)) {
      setTeamId(selectedFixture.home_team_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixtureId, fixtures]);

  const fixtureLabel = (f: EventFixture) =>
    `R${f.round}: ${teams.find(t => t.id === f.home_team_id)?.name ?? '?'} v ${teams.find(t => t.id === f.away_team_id)?.name ?? '?'}`;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!fixtureId || !teamId || !playerName.trim()) return;
    onAddStat({ fixtureId, teamId, playerName, statType, minute: minute ? Number(minute) : null });
    setPlayerName('');
    setMinute('');
  };

  if (fixtures.length === 0) {
    return (
      <section className={panel}>
        <div className="p-4 text-sm text-slate-400">Generate fixtures first — statistics are recorded against a match.</div>
      </section>
    );
  }

  return (
    <section className={panel}>
      <div className={sectionHeader}>
        <Plus size={16} className="text-sky-200" />
        <h2 className="font-display text-sm font-black text-white">Record a statistic</h2>
      </div>
      <form onSubmit={submit} className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1 sm:col-span-2 lg:col-span-1">
          <label className={label}>Match</label>
          <select className={selectClass} value={fixtureId} onChange={e => setFixtureId(e.target.value)}>
            {fixtures.map(f => <option key={f.id} value={f.id}>{fixtureLabel(f)}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className={label}>Team</label>
          <select className={selectClass} value={teamId} onChange={e => setTeamId(e.target.value)}>
            {teamOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className={label}>Player</label>
          <input className={inputClass} value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Player name" />
        </div>
        <div className="space-y-1">
          <label className={label}>Type</label>
          <select className={selectClass} value={statType} onChange={e => setStatType(e.target.value as FixtureStatType)}>
            {STAT_TYPES.map(t => <option key={t} value={t}>{STAT_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className={label}>Minute</label>
          <input className={inputClass} type="number" min={0} value={minute} onChange={e => setMinute(e.target.value)} placeholder="Optional" />
        </div>
        <div className="flex items-end">
          <button type="submit" className={`${primaryBtn} w-full`}><Plus size={14} /> Add</button>
        </div>
      </form>
    </section>
  );
};

const AwardsCard = ({ awards, teams, teamName, suggestions, onAdd, onDelete }: {
  awards: EventAward[];
  teams: EventTeam[];
  teamName: (id: string) => string;
  suggestions: ReturnType<typeof suggestAwards>;
  onAdd: (input: { title: string; recipientType: AwardRecipientType; teamId?: string | null; playerName?: string | null }) => void;
  onDelete: (awardId: string) => void;
}) => {
  const [title, setTitle] = useState('');
  const [recipientType, setRecipientType] = useState<AwardRecipientType>('team');
  const [teamId, setTeamId] = useState(teams[0]?.id ?? '');
  const [playerName, setPlayerName] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (recipientType === 'team' && !teamId) return;
    if (recipientType === 'player' && !playerName.trim()) return;
    onAdd({ title, recipientType, teamId: recipientType === 'team' ? teamId : null, playerName: recipientType === 'player' ? playerName : null });
    setTitle('');
    setPlayerName('');
  };

  const applyChampion = () => {
    if (!suggestions.champion) return;
    setTitle('Champions');
    setRecipientType('team');
    setTeamId(suggestions.champion.teamId);
  };
  const applyTopScorer = () => {
    if (!suggestions.topScorer) return;
    setTitle('Top Scorer');
    setRecipientType('player');
    setPlayerName(suggestions.topScorer.playerName);
  };

  return (
    <section className={panel}>
      <div className={sectionHeader}>
        <Award size={16} className="text-sky-200" />
        <h2 className="font-display text-sm font-black text-white">Awards</h2>
      </div>
      <div className="space-y-4 p-4">
        {awards.length > 0 && (
          <ul className="space-y-2">
            {awards.map(award => (
              <li key={award.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
                <div className="flex items-center gap-3">
                  <Medal size={16} className="text-indigo-200" />
                  <div>
                    <p className="font-display text-sm font-black text-white">{award.title}</p>
                    <p className="text-xs text-slate-400">{award.recipient_type === 'team' ? (award.team_id ? teamName(award.team_id) : 'Team') : award.player_name}</p>
                  </div>
                </div>
                <button type="button" aria-label="Remove award" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-rose-300" onClick={() => onDelete(award.id)}>
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {(suggestions.champion || suggestions.topScorer) && (
          <div className="flex flex-wrap gap-2">
            {suggestions.champion && (
              <button type="button" className={ghostBtn} onClick={applyChampion}>
                <Trophy size={13} /> Champions: {suggestions.champion.name}
              </button>
            )}
            {suggestions.topScorer && (
              <button type="button" className={ghostBtn} onClick={applyTopScorer}>
                <Target size={13} /> Top scorer: {suggestions.topScorer.playerName} ({suggestions.topScorer.goals})
              </button>
            )}
          </div>
        )}

        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <div className="space-y-1">
            <label className={label}>Award title</label>
            <input className={inputClass} value={title} onChange={e => setTitle(e.target.value)} placeholder="Champions" />
          </div>
          <div className="space-y-1">
            <label className={label}>Recipient</label>
            <select className={selectClass} value={recipientType} onChange={e => setRecipientType(e.target.value as AwardRecipientType)}>
              <option value="team">Team</option>
              <option value="player">Player</option>
            </select>
          </div>
          {recipientType === 'team' ? (
            <div className="space-y-1">
              <label className={label}>Team</label>
              <select className={selectClass} value={teamId} onChange={e => setTeamId(e.target.value)}>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          ) : (
            <div className="space-y-1">
              <label className={label}>Player</label>
              <input className={inputClass} value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Player name" />
            </div>
          )}
          <button type="submit" className={primaryBtn}><Plus size={14} /> Assign</button>
        </form>
      </div>
    </section>
  );
};

// --- Match day (live operations) ---------------------------------------------

const INCIDENT_KINDS: IncidentKind[] = ['injury', 'misconduct', 'dispute', 'delay', 'other'];

const MatchdayPanel = ({ fixtures, incidents, teamName, onSetOps, onAddIncident, onDeleteIncident }: {
  fixtures: EventFixture[];
  incidents: EventIncident[];
  teamName: (id: string) => string;
  onSetOps: (fixtureId: string, patch: FixtureOpsPatch) => void;
  onAddIncident: (input: EventIncidentInput) => void;
  onDeleteIncident: (incidentId: string) => void;
}) => {
  const summary = summarizeMatchday(fixtures);
  const active = fixtures.filter(f => f.status !== 'cancelled');

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Fixtures" value={summary.total} detail="In this event" />
        <StatTile label="Completed" value={summary.completed} detail="Results in" />
        <StatTile label="Ready" value={summary.ready} detail="Both checked in" />
        <StatTile label="Awaiting" value={summary.awaitingCheckin} detail="Check-in pending" />
      </div>

      <section className={panel}>
        <div className={sectionHeader}>
          <Activity size={16} className="text-sky-200" />
          <h2 className="font-display text-sm font-black text-white">Command center</h2>
        </div>
        <div className="space-y-2 p-4">
          {active.length === 0 ? (
            <p className="text-sm text-slate-400">Generate fixtures to run match-day check-in.</p>
          ) : (
            active.map(fixture => <FixtureOpsCard key={fixture.id} fixture={fixture} teamName={teamName} onSetOps={onSetOps} />)
          )}
        </div>
      </section>

      <section className={panel}>
        <div className={sectionHeader}>
          <AlertTriangle size={16} className="text-sky-200" />
          <h2 className="font-display text-sm font-black text-white">Incidents</h2>
        </div>
        <div className="space-y-4 p-4">
          <IncidentForm fixtures={fixtures} teamName={teamName} onAdd={onAddIncident} />
          {incidents.length === 0 ? (
            <p className="text-sm text-slate-400">No incidents logged.</p>
          ) : (
            <ul className="space-y-2">
              {incidents.map(inc => (
                <li key={inc.id} className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-slate-300/20 bg-white/[0.045] px-2 py-0.5 text-[11px] font-bold text-slate-200">{INCIDENT_KIND_LABELS[inc.kind]}</span>
                      <span className="text-[11px] text-slate-500">{new Date(inc.occurred_at).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-200">{inc.summary}</p>
                  </div>
                  <button type="button" aria-label="Remove incident" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:text-rose-300" onClick={() => onDeleteIncident(inc.id)}>
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};

const CheckinButton = ({ name, checked, onClick }: { name: string; checked: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors ${checked ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-100' : 'border-white/10 bg-white/[0.035] text-slate-300 hover:text-white'}`}
  >
    <UserCheck size={13} /> {name}
  </button>
);

const FixtureOpsCard = ({ fixture, teamName, onSetOps }: {
  fixture: EventFixture;
  teamName: (id: string) => string;
  onSetOps: (fixtureId: string, patch: FixtureOpsPatch) => void;
}) => {
  const ready = fixture.home_checked_in && fixture.away_checked_in;
  const statusPill = fixture.status === 'completed'
    ? { text: `${fixture.home_score}–${fixture.away_score}`, tone: 'border-sky-300/35 bg-sky-400/10 text-sky-100' }
    : ready
      ? { text: 'Ready', tone: 'border-emerald-400/40 bg-emerald-400/15 text-emerald-100' }
      : { text: 'Awaiting', tone: 'border-slate-300/20 bg-white/[0.045] text-slate-300' };

  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.035] p-3">
      <div className="flex items-center justify-between gap-2">
        <CheckinButton name={teamName(fixture.home_team_id)} checked={fixture.home_checked_in} onClick={() => onSetOps(fixture.id, { homeCheckedIn: !fixture.home_checked_in })} />
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusPill.tone}`}>{statusPill.text}</span>
        <CheckinButton name={teamName(fixture.away_team_id)} checked={fixture.away_checked_in} onClick={() => onSetOps(fixture.id, { awayCheckedIn: !fixture.away_checked_in })} />
      </div>
      <OfficialInput value={fixture.official_name} onSave={name => onSetOps(fixture.id, { officialName: name })} />
    </div>
  );
};

const OfficialInput = ({ value, onSave }: { value: string | null; onSave: (name: string) => void }) => {
  const [name, setName] = useState(value ?? '');
  useEffect(() => { setName(value ?? ''); }, [value]);
  const commit = () => { if ((name.trim() || null) !== (value ?? null)) onSave(name); };
  return (
    <input
      className={`${inputClass} h-8 text-xs`}
      value={name}
      onChange={e => setName(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      placeholder="Assign official / referee"
    />
  );
};

const IncidentForm = ({ fixtures, teamName, onAdd }: {
  fixtures: EventFixture[];
  teamName: (id: string) => string;
  onAdd: (input: EventIncidentInput) => void;
}) => {
  const [kind, setKind] = useState<IncidentKind>('injury');
  const [summary, setSummary] = useState('');
  const [fixtureId, setFixtureId] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;
    onAdd({ kind, summary, fixtureId: fixtureId || null });
    setSummary('');
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
      <div className="space-y-1">
        <label className={label}>Type</label>
        <select className={selectClass} value={kind} onChange={e => setKind(e.target.value as IncidentKind)}>
          {INCIDENT_KINDS.map(k => <option key={k} value={k}>{INCIDENT_KIND_LABELS[k]}</option>)}
        </select>
      </div>
      <div className="space-y-1 lg:col-span-2"><label className={label}>What happened</label><input className={inputClass} value={summary} onChange={e => setSummary(e.target.value)} placeholder="Brief summary" /></div>
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <label className={label}>Match</label>
          <select className={selectClass} value={fixtureId} onChange={e => setFixtureId(e.target.value)}>
            <option value="">— None —</option>
            {fixtures.map(f => <option key={f.id} value={f.id}>{teamName(f.home_team_id)} v {teamName(f.away_team_id)}</option>)}
          </select>
        </div>
        <button type="submit" className={primaryBtn}><Plus size={14} /> Log</button>
      </div>
    </form>
  );
};

// --- Venues ------------------------------------------------------------------

// --- Fixtures calendar -------------------------------------------------------

const toLocalInput = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => `${n}`.padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const formatClock = (iso: string | null): string => {
  if (!iso) return 'Time TBD';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Time TBD';
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(d);
};
const formatDayHeading = (dateKey: string): string => {
  const d = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateKey;
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(d);
};

const CalendarSection = ({ league, fixtures, teams, events, venues, runError, onAfter }: {
  league: CloudLeagueRepository;
  fixtures: EventFixture[];
  teams: EventTeam[];
  events: LeagueEvent[];
  venues: LeagueVenue[];
  runError: (fn: () => Promise<unknown>) => Promise<void>;
  onAfter: () => Promise<void> | void;
}) => {
  const calendar = useMemo(() => buildFixtureCalendar(fixtures, teams, events, venues), [fixtures, teams, events, venues]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAt, setEditAt] = useState('');
  const [editVenue, setEditVenue] = useState('');

  const startEdit = (item: CalendarFixtureItem) => {
    setEditingId(item.fixtureId);
    setEditAt(item.kickoffAt ? toLocalInput(item.kickoffAt) : '');
    setEditVenue(item.venueId ?? '');
  };
  const save = (fixtureId: string) =>
    runError(async () => {
      await league.setFixtureSchedule(fixtureId, {
        kickoffAt: editAt ? new Date(editAt).toISOString() : null,
        venueId: editVenue || null
      });
      setEditingId(null);
      await onAfter();
    });
  const clearSchedule = (fixtureId: string) =>
    runError(async () => { await league.setFixtureSchedule(fixtureId, { kickoffAt: null, venueId: null }); setEditingId(null); await onAfter(); });

  const editor = (item: CalendarFixtureItem) => (
    <div className="mt-3 grid gap-2 border-t border-white/10 pt-3 sm:grid-cols-[1fr_1fr_auto]">
      <div className="space-y-1">
        <label className={label}>Kick-off</label>
        <input type="datetime-local" className={inputClass} value={editAt} onChange={e => setEditAt(e.target.value)} />
      </div>
      <div className="space-y-1">
        <label className={label}>Venue</label>
        <select className={selectClass} value={editVenue} onChange={e => setEditVenue(e.target.value)}>
          <option value="">No venue</option>
          {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </div>
      <div className="flex items-end gap-2">
        <button type="button" className={primaryBtn} onClick={() => save(item.fixtureId)}><Save size={14} /> Save</button>
        <button type="button" className={ghostBtn} onClick={() => setEditingId(null)}><X size={14} /></button>
      </div>
    </div>
  );

  const fixtureRow = (item: CalendarFixtureItem, showTime: boolean) => {
    const isEditing = editingId === item.fixtureId;
    return (
      <div key={item.fixtureId} className={`${subtleCard} p-4 ${item.conflict ? 'border-rose-300/40 bg-rose-400/5' : ''}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {showTime && <span className="font-display text-sm font-black text-sky-100">{formatClock(item.kickoffAt)}</span>}
              <span className="text-sm font-black text-white">{item.homeTeamName}</span>
              {item.status === 'completed'
                ? <span className="rounded-lg border border-white/10 bg-black/25 px-2 py-0.5 font-display text-xs font-black text-white">{item.homeScore}–{item.awayScore}</span>
                : <span className="text-xs text-slate-500">vs</span>}
              <span className="text-sm font-black text-white">{item.awayTeamName}</span>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
              <span>{item.eventName} · Round {item.round}</span>
              {item.venueName && <span className="inline-flex items-center gap-1"><MapPin size={11} /> {item.venueName}</span>}
              {item.conflict && (
                <span className="inline-flex items-center gap-1 font-bold text-rose-200"><AlertTriangle size={11} /> Venue double-booked</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {item.kickoffAt && !isEditing && (
              <button type="button" className="text-[11px] font-bold text-slate-500 hover:text-rose-200" onClick={() => clearSchedule(item.fixtureId)}>Unschedule</button>
            )}
            <button type="button" className={ghostBtn} onClick={() => (isEditing ? setEditingId(null) : startEdit(item))}>
              <CalendarClock size={13} /> {item.kickoffAt ? 'Reschedule' : 'Schedule'}
            </button>
          </div>
        </div>
        {isEditing && editor(item)}
      </div>
    );
  };

  const noFixtures = fixtures.length === 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-sm font-black uppercase tracking-wide text-white">Fixtures calendar</h2>
        <p className="mt-1 text-xs text-slate-400">Your whole league's match schedule in one place, with automatic venue double-booking checks.</p>
      </div>

      {noFixtures ? (
        <div className={`${panel} p-8 text-center`}>
          <CalendarClock size={22} className="mx-auto text-slate-500" />
          <p className="mt-3 text-sm font-bold text-white">No fixtures yet</p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
            Generate a schedule from an event's <span className="font-bold text-sky-200">Fixtures</span> tab, then set each match's kick-off time and venue here.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Scheduled" value={calendar.scheduledCount} detail={`${fixtures.length} fixtures total`} />
            <StatTile label="Unscheduled" value={calendar.unscheduled.length} detail="Need a time" />
            <StatTile label="Conflicts" value={calendar.conflictCount} detail="Venue clashes" />
            <StatTile label="Venues" value={venues.length} detail="Available" />
          </div>

          {calendar.conflictCount > 0 && (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>
                {calendar.conflictCount} fixture{calendar.conflictCount === 1 ? '' : 's'} clash on a venue within {' '}2 hours
                {calendar.venueConflicts.length > 0 && <> — {calendar.venueConflicts.map(v => v.venueName ?? 'a venue').join(', ')}</>}. Reschedule or move them to clear the conflict.
              </span>
            </div>
          )}

          {venues.length === 0 && (
            <p className="rounded-xl border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
              Add venues in the Venues tab to assign them to matches and enable double-booking checks.
            </p>
          )}

          {calendar.days.map(day => (
            <section key={day.date} className={panel}>
              <div className={sectionHeader}>
                <CalendarRange size={16} className="text-sky-200" />
                <h2 className="font-display text-sm font-black text-white">{formatDayHeading(day.date)}</h2>
                <span className="ml-auto text-[11px] font-bold text-slate-500">{day.items.length} match{day.items.length === 1 ? '' : 'es'}</span>
              </div>
              <div className="space-y-2 p-4">
                {day.items.map(item => fixtureRow(item, true))}
              </div>
            </section>
          ))}

          {calendar.unscheduled.length > 0 && (
            <section className={panel}>
              <div className={sectionHeader}>
                <Clock size={16} className="text-sky-200" />
                <h2 className="font-display text-sm font-black text-white">Unscheduled</h2>
                <span className="ml-auto text-[11px] font-bold text-slate-500">{calendar.unscheduled.length}</span>
              </div>
              <div className="space-y-2 p-4">
                {calendar.unscheduled.map(item => fixtureRow(item, false))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

// --- Coach organization ------------------------------------------------------

const coachStatusTone: Record<LeagueCoachMembership['status'], string> = {
  pending: 'border-amber-300/30 bg-amber-400/10 text-amber-100',
  active: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100',
  declined: 'border-rose-300/30 bg-rose-400/10 text-rose-100',
  removed: 'border-slate-500/30 bg-slate-500/10 text-slate-400'
};

const CoachAvatar = ({ name }: { name: string }) => {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?';
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-xs font-black text-sky-200">
      {initials}
    </span>
  );
};

const CoachesSection = ({ league, activeLeague, runError }: {
  league: CloudLeagueRepository;
  activeLeague: League;
  runError: (fn: () => Promise<unknown>) => Promise<void>;
}) => {
  const [memberships, setMemberships] = useState<LeagueCoachMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [seatLimit, setSeatLimit] = useState(activeLeague.coach_seat_limit);
  const [inviteCode, setInviteCode] = useState(activeLeague.coach_invite_code);
  const [limitDraft, setLimitDraft] = useState(String(activeLeague.coach_seat_limit));
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const refresh = useCallback(async () => {
    setMemberships(await league.listCoachMemberships(activeLeague.id));
  }, [league, activeLeague.id]);

  useEffect(() => {
    setSeatLimit(activeLeague.coach_seat_limit);
    setInviteCode(activeLeague.coach_invite_code);
    setLimitDraft(String(activeLeague.coach_seat_limit));
  }, [activeLeague.id, activeLeague.coach_seat_limit, activeLeague.coach_invite_code]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    refresh().finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  const seats = summarizeCoachSeats(memberships, seatLimit);
  const pending = memberships.filter(m => m.status === 'pending');
  const activeCoaches = memberships.filter(m => m.status === 'active');
  const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/#/join-league` : '/#/join-league';
  const filledPct = seatLimit > 0 ? Math.round((seats.active / seatLimit) * 100) : 0;

  const copy = async (text: string, which: 'code' | 'link') => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(which);
        window.setTimeout(() => setCopied(null), 1800);
      }
    } catch { /* clipboard unavailable — the code is shown for manual copy */ }
  };

  const review = (id: string, status: 'active' | 'declined' | 'removed') =>
    runError(async () => { await league.reviewCoachMembership(id, status); await refresh(); });
  const saveLimit = () =>
    runError(async () => {
      const next = await league.setCoachSeatLimit(activeLeague.id, Number(limitDraft) || 0);
      setSeatLimit(next.coach_seat_limit);
      setLimitDraft(String(next.coach_seat_limit));
    });
  const rotate = () =>
    runError(async () => { const code = await league.rotateCoachInvite(activeLeague.id); setInviteCode(code); });

  const limitDirty = String(seatLimit) !== limitDraft.trim();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-sm font-black uppercase tracking-wide text-white">Coach organization</h2>
        <p className="mt-1 text-xs text-slate-400">
          Affiliate coaches under {activeLeague.name}. Share your invite link, review each application, and manage your seats.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className={panel}>
          <div className={sectionHeader}>
            <UserCheck size={16} className="text-sky-200" />
            <h2 className="font-display text-sm font-black text-white">Coach seats</h2>
          </div>
          <div className="space-y-4 p-4">
            <ProgressMeter value={filledPct} label={`${seats.active} of ${seatLimit} seats filled`} />
            <div className="grid grid-cols-3 gap-2">
              <StatTile label="Active" value={seats.active} detail="Affiliated" />
              <StatTile label="Pending" value={seats.pending} detail="Awaiting review" />
              <StatTile label="Open" value={seats.remaining} detail="Seats left" />
            </div>
            <div className="flex items-end gap-2 border-t border-white/10 pt-4">
              <div className="space-y-1">
                <label className={label}>Seat limit</label>
                <input
                  className={`${inputClass} w-28`}
                  type="number"
                  min={0}
                  max={1000}
                  value={limitDraft}
                  onChange={e => setLimitDraft(e.target.value)}
                />
              </div>
              <button type="button" className={primaryBtn} onClick={saveLimit} disabled={!limitDirty}>
                <Save size={14} /> Update
              </button>
            </div>
            <p className="text-[11px] leading-4 text-slate-500">Change the number of coach seats anytime. Lowering it below your active count keeps current coaches but blocks new approvals until a seat frees up.</p>
          </div>
        </div>

        <div className={panel}>
          <div className={sectionHeader}>
            <Copy size={16} className="text-sky-200" />
            <h2 className="font-display text-sm font-black text-white">Invite link</h2>
          </div>
          <div className="space-y-3 p-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-[11px] font-black uppercase text-slate-400">Invite code</p>
              <p className="mt-1 font-display text-2xl font-black tracking-[0.28em] text-white">{inviteCode}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className={ghostBtn} onClick={() => copy(inviteCode, 'code')}>
                {copied === 'code' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy code</>}
              </button>
              <button type="button" className={ghostBtn} onClick={() => copy(`${inviteUrl}?code=${inviteCode}`, 'link')}>
                {copied === 'link' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy link</>}
              </button>
              <button type="button" className={ghostBtn} onClick={rotate}>
                <RefreshCw size={14} /> Rotate
              </button>
            </div>
            <p className="text-[11px] leading-4 text-slate-500">
              Share <span className="text-sky-200">{inviteUrl}</span> and this code. A coach — new or existing — opens it from their Dumala coach account and applies; you approve each one below. Rotating invalidates the old link.
            </p>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center gap-2 p-2 text-sm text-slate-300"><Loader2 size={16} className="animate-spin" /> Loading coaches…</div>
      ) : (
        <>
          <section className={panel}>
            <div className={sectionHeader}>
              <Clock size={16} className="text-sky-200" />
              <h2 className="font-display text-sm font-black text-white">Pending applications</h2>
              <span className="ml-auto text-[11px] font-bold text-slate-500">{pending.length}</span>
            </div>
            <div className="space-y-2 p-4">
              {pending.length === 0 ? (
                <p className="text-sm text-slate-400">No applications waiting. Share your invite link to bring coaches into the organization.</p>
              ) : (
                pending.map(coach => (
                  <div key={coach.id} className={`${subtleCard} flex flex-wrap items-center justify-between gap-3 p-4`}>
                    <div className="flex items-start gap-3">
                      <CoachAvatar name={coach.coach_name} />
                      <div className="min-w-0">
                        <p className="font-display text-sm font-black text-white">{coach.coach_name}</p>
                        <p className="text-xs text-slate-400">{coach.coach_email}</p>
                        {coach.message && <p className="mt-1 max-w-md text-xs italic leading-5 text-slate-400">“{coach.message}”</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className={primaryBtn}
                        onClick={() => review(coach.id, 'active')}
                        disabled={seats.full}
                        title={seats.full ? 'No seats left — raise the seat limit first' : undefined}
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button type="button" className={ghostBtn} onClick={() => review(coach.id, 'declined')}>
                        <X size={14} /> Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
              {seats.full && pending.length > 0 && (
                <p className="rounded-xl border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
                  All {seatLimit} seats are filled. Raise the seat limit or remove a coach to approve more.
                </p>
              )}
            </div>
          </section>

          <section className={panel}>
            <div className={sectionHeader}>
              <Users size={16} className="text-sky-200" />
              <h2 className="font-display text-sm font-black text-white">Affiliated coaches</h2>
              <span className="ml-auto text-[11px] font-bold text-slate-500">{activeCoaches.length}</span>
            </div>
            <div className="space-y-2 p-4">
              {activeCoaches.length === 0 ? (
                <p className="text-sm text-slate-400">No affiliated coaches yet. Approved coaches appear here.</p>
              ) : (
                activeCoaches.map(coach => (
                  <div key={coach.id} className={`${subtleCard} flex flex-wrap items-center justify-between gap-3 p-4`}>
                    <div className="flex items-center gap-3">
                      <CoachAvatar name={coach.coach_name} />
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-display text-sm font-black text-white">
                          {coach.coach_name}
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${coachStatusTone.active}`}>
                            {LEAGUE_COACH_STATUS_LABELS.active}
                          </span>
                        </p>
                        <p className="text-xs text-slate-400">{coach.coach_email}</p>
                      </div>
                    </div>
                    <button type="button" className={ghostBtn} onClick={() => review(coach.id, 'removed')}>
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

// --- Statistics database -----------------------------------------------------

const STAT_KIND_TONE: Record<FixtureStatType, string> = {
  goal: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100',
  assist: 'border-sky-300/30 bg-sky-400/10 text-sky-100',
  own_goal: 'border-orange-300/30 bg-orange-400/10 text-orange-100',
  yellow_card: 'border-amber-300/30 bg-amber-400/10 text-amber-100',
  red_card: 'border-rose-300/30 bg-rose-400/10 text-rose-100'
};

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'league';

const triggerReportDownload = (content: string, mimeType: string, fileName: string) => {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const th = 'px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500';
const thNum = `${th} text-right`;
const td = 'px-3 py-2 text-sm text-slate-200';
const tdNum = `${td} text-right font-variant-numeric tabular-nums`;

const StatisticsSection = ({ leagueName, seasons, events, teams, statEvents, fixtures }: {
  leagueName: string;
  seasons: LeagueSeason[];
  events: LeagueEvent[];
  teams: EventTeam[];
  statEvents: FixtureStatEvent[];
  fixtures: EventFixture[];
}) => {
  const [seasonId, setSeasonId] = useState<string>('all');
  const [eventId, setEventId] = useState<string>('all');
  const [query, setQuery] = useState('');

  const scopedEvents = useMemo(
    () => (seasonId === 'all' ? events : events.filter(e => e.season_id === seasonId)),
    [events, seasonId]
  );
  // Guard against a stale event selection when the season filter narrows the list.
  const effectiveEventId = eventId !== 'all' && scopedEvents.some(e => e.id === eventId) ? eventId : 'all';
  const scopedEventIds = useMemo(() => new Set(scopedEvents.map(e => e.id)), [scopedEvents]);

  const filteredStats = useMemo(
    () => statEvents.filter(s => (effectiveEventId !== 'all' ? s.event_id === effectiveEventId : scopedEventIds.has(s.event_id))),
    [statEvents, effectiveEventId, scopedEventIds]
  );

  const db = useMemo(() => buildStatDatabase(filteredStats, teams), [filteredStats, teams]);

  const scopeLabel = effectiveEventId !== 'all'
    ? (events.find(e => e.id === effectiveEventId)?.name ?? 'Selected event')
    : seasonId !== 'all'
      ? (seasons.find(s => s.id === seasonId)?.name ?? 'Selected season')
      : 'All competitions';

  const q = query.trim().toLowerCase();
  const matchesQuery = (a: string, b: string) => !q || a.toLowerCase().includes(q) || b.toLowerCase().includes(q);
  const visiblePlayers = db.players.filter(p => matchesQuery(p.playerName, p.teamName));
  const visibleTeams = db.teams.filter(t => matchesQuery(t.teamName, t.teamName));

  const teamNameById = useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams]);
  const eventNameById = useMemo(() => new Map(events.map(e => [e.id, e.name])), [events]);
  const fixtureById = useMemo(() => new Map(fixtures.map(f => [f.id, f])), [fixtures]);

  const records = useMemo(() => filteredStats
    .map(s => ({
      id: s.id,
      eventName: eventNameById.get(s.event_id) ?? '—',
      round: fixtureById.get(s.fixture_id)?.round ?? null,
      teamName: teamNameById.get(s.team_id) ?? 'Unknown team',
      playerName: s.player_name,
      statType: s.stat_type,
      minute: s.minute,
      createdAt: s.created_at
    }))
    .filter(r => matchesQuery(r.playerName, r.teamName))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 250),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredStats, eventNameById, fixtureById, teamNameById, q]
  );

  const handleDownloadHtml = () => {
    const html = renderStatDatabaseReportHtml(db, { leagueName, scopeLabel, generatedAt: new Date().toISOString() });
    triggerReportDownload(html, 'text/html;charset=utf-8', `${slugify(leagueName)}-${slugify(scopeLabel)}-statistics.html`);
  };
  const handleExportJson = () => {
    const payload = { league: leagueName, scope: scopeLabel, generatedAt: new Date().toISOString(), ...db };
    triggerReportDownload(JSON.stringify(payload, null, 2), 'application/json', `${slugify(leagueName)}-${slugify(scopeLabel)}-statistics.json`);
  };

  const hasAnyStats = statEvents.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-sm font-black uppercase tracking-wide text-white">Statistics database</h2>
          <p className="mt-1 text-xs text-slate-400">Verifiable goal, assist, and card records across your competitions — {scopeLabel}.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className={ghostBtn} onClick={handleExportJson} disabled={db.totals.records === 0}>
            <FileJson size={14} /> Data (JSON)
          </button>
          <button type="button" className={primaryBtn} onClick={handleDownloadHtml} disabled={db.totals.records === 0}>
            <FileDown size={14} /> Download report
          </button>
        </div>
      </div>

      {!hasAnyStats ? (
        <div className={`${panel} p-8 text-center`}>
          <Database size={22} className="mx-auto text-slate-500" />
          <p className="mt-3 text-sm font-bold text-white">No statistics recorded yet</p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
            Record goals, assists, and cards from an event's <span className="font-bold text-sky-200">Stats</span> tab.
            They will roll up here into a searchable, printable player and team record.
          </p>
        </div>
      ) : (
        <>
          <div className={`${panel} grid gap-3 p-4 sm:grid-cols-[1fr_1fr_1.4fr]`}>
            <div className="space-y-1">
              <label className={label}>Season</label>
              <select className={selectClass} value={seasonId} onChange={e => { setSeasonId(e.target.value); setEventId('all'); }}>
                <option value="all">All seasons</option>
                {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className={label}>Event</label>
              <select className={selectClass} value={effectiveEventId} onChange={e => setEventId(e.target.value)}>
                <option value="all">All events</option>
                {scopedEvents.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className={label}>Search player or team</label>
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input className={`${inputClass} pl-9`} value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. Ramos or Bayside" />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatTile label="Goals" value={db.totals.goals} detail={`${db.totals.records} records`} />
            <StatTile label="Assists" value={db.totals.assists} detail={`${db.totals.matches} matches`} />
            <StatTile label="Yellow cards" value={db.totals.yellow} detail="Cautions" />
            <StatTile label="Red cards" value={db.totals.red} detail="Dismissals" />
            <StatTile label="Players" value={db.totals.players} detail="Tracked" />
            <StatTile label="Teams" value={db.totals.teams} detail="With records" />
          </div>

          <div className={panel}>
            <div className={sectionHeader}>
              <Target size={16} className="text-sky-200" />
              <h2 className="font-display text-sm font-black text-white">Player statistics</h2>
              <span className="ml-auto text-[11px] font-bold text-slate-500">{visiblePlayers.length} of {db.players.length}</span>
            </div>
            <div className="overflow-x-auto p-2">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className={thNum}>#</th>
                    <th className={th}>Player</th>
                    <th className={th}>Team</th>
                    <th className={thNum} title="Matches with a recorded stat">MP</th>
                    <th className={thNum} title="Events">Ev</th>
                    <th className={thNum}>G</th>
                    <th className={thNum}>A</th>
                    <th className={thNum} title="Goal contributions">G+A</th>
                    <th className={thNum}>Y</th>
                    <th className={thNum}>R</th>
                    <th className={thNum} title="Own goals">OG</th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePlayers.length === 0 ? (
                    <tr><td className={`${td} text-center text-slate-400`} colSpan={11}>No players match your filters.</td></tr>
                  ) : (
                    visiblePlayers.map((p, index) => (
                      <tr key={p.key} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.03]">
                        <td className={`${tdNum} ${index === 0 ? 'text-amber-300 font-black' : 'text-slate-500'}`}>{index + 1}</td>
                        <td className={`${td} font-bold text-white`}>{p.playerName}</td>
                        <td className={`${td} text-slate-400`}>{p.teamName}</td>
                        <td className={tdNum}>{p.matches}</td>
                        <td className={tdNum}>{p.events}</td>
                        <td className={`${tdNum} font-black text-white`}>{p.goals}</td>
                        <td className={tdNum}>{p.assists}</td>
                        <td className={tdNum}>{p.goalContributions}</td>
                        <td className={`${tdNum} ${p.yellow ? 'text-amber-200' : 'text-slate-500'}`}>{p.yellow}</td>
                        <td className={`${tdNum} ${p.red ? 'text-rose-200' : 'text-slate-500'}`}>{p.red}</td>
                        <td className={tdNum}>{p.ownGoals}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className={panel}>
            <div className={sectionHeader}>
              <Shield size={16} className="text-sky-200" />
              <h2 className="font-display text-sm font-black text-white">Team statistics</h2>
            </div>
            <div className="overflow-x-auto p-2">
              <table className="w-full min-w-[520px] border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className={thNum}>#</th>
                    <th className={th}>Team</th>
                    <th className={thNum}>Players</th>
                    <th className={thNum}>G</th>
                    <th className={thNum}>A</th>
                    <th className={thNum}>Y</th>
                    <th className={thNum}>R</th>
                    <th className={thNum}>OG</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTeams.length === 0 ? (
                    <tr><td className={`${td} text-center text-slate-400`} colSpan={8}>No teams match your filters.</td></tr>
                  ) : (
                    visibleTeams.map((t, index) => (
                      <tr key={t.key} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.03]">
                        <td className={`${tdNum} text-slate-500`}>{index + 1}</td>
                        <td className={`${td} font-bold text-white`}>{t.teamName}</td>
                        <td className={tdNum}>{t.players}</td>
                        <td className={`${tdNum} font-black text-white`}>{t.goals}</td>
                        <td className={tdNum}>{t.assists}</td>
                        <td className={`${tdNum} ${t.yellow ? 'text-amber-200' : 'text-slate-500'}`}>{t.yellow}</td>
                        <td className={`${tdNum} ${t.red ? 'text-rose-200' : 'text-slate-500'}`}>{t.red}</td>
                        <td className={tdNum}>{t.ownGoals}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className={panel}>
            <div className={sectionHeader}>
              <ListOrdered size={16} className="text-sky-200" />
              <h2 className="font-display text-sm font-black text-white">Match records</h2>
              <span className="ml-auto text-[11px] font-bold text-slate-500">{records.length} entr{records.length === 1 ? 'y' : 'ies'}</span>
            </div>
            <div className="max-h-[26rem] overflow-auto p-2">
              <table className="w-full min-w-[620px] border-collapse">
                <thead className="sticky top-0 bg-slate-950/80 backdrop-blur">
                  <tr className="border-b border-white/10">
                    <th className={th}>Event</th>
                    <th className={thNum}>Rnd</th>
                    <th className={th}>Team</th>
                    <th className={th}>Player</th>
                    <th className={th}>Statistic</th>
                    <th className={thNum}>Min</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr><td className={`${td} text-center text-slate-400`} colSpan={6}>No records match your filters.</td></tr>
                  ) : (
                    records.map(r => (
                      <tr key={r.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.03]">
                        <td className={`${td} text-slate-300`}>{r.eventName}</td>
                        <td className={`${tdNum} text-slate-400`}>{r.round ?? '—'}</td>
                        <td className={`${td} text-slate-400`}>{r.teamName}</td>
                        <td className={`${td} font-bold text-white`}>{r.playerName}</td>
                        <td className={td}>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${STAT_KIND_TONE[r.statType]}`}>
                            {STAT_TYPE_LABELS[r.statType]}
                          </span>
                        </td>
                        <td className={`${tdNum} text-slate-400`}>{r.minute != null ? `${r.minute}'` : '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const VenuesSection = ({ venues, onCreate, onDelete }: {
  venues: LeagueVenue[];
  onCreate: (input: { name: string; address?: string | null; capacity?: number | null }) => void;
  onDelete: (venueId: string) => void;
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onCreate({ name, address: address || null, capacity: capacity ? Number(capacity) : null });
    setName(''); setAddress(''); setCapacity('');
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-sm font-black uppercase tracking-wide text-white">Venues</h2>
      <form onSubmit={submit} className={`${panel} grid gap-3 p-4 sm:grid-cols-[2fr_2fr_1fr_auto] sm:items-end`}>
        <div className="space-y-1"><label className={label}>Venue name</label><input className={inputClass} required value={name} onChange={e => setName(e.target.value)} placeholder="Central Pitch" /></div>
        <div className="space-y-1"><label className={label}>Address</label><input className={inputClass} value={address} onChange={e => setAddress(e.target.value)} placeholder="City / area" /></div>
        <div className="space-y-1"><label className={label}>Capacity</label><input className={inputClass} type="number" min={0} value={capacity} onChange={e => setCapacity(e.target.value)} /></div>
        <button type="submit" className={primaryBtn}><Plus size={14} /> Add</button>
      </form>

      {venues.length === 0 ? (
        <p className={`${panel} p-6 text-center text-sm text-slate-400`}>No venues yet.</p>
      ) : (
        <ul className="space-y-2">
          {venues.map(venue => (
            <li key={venue.id} className={`${panel} flex items-center justify-between gap-3 p-4`}>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-300/10 text-sky-200"><MapPin size={16} /></span>
                <div>
                  <p className="font-display text-sm font-black text-white">{venue.name}</p>
                  <p className="text-xs text-slate-400">{[venue.address, venue.capacity ? `${venue.capacity} cap` : null].filter(Boolean).join(' · ') || '—'}</p>
                </div>
              </div>
              <button type="button" aria-label="Remove venue" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-rose-300" onClick={() => onDelete(venue.id)}>
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// --- Finance -----------------------------------------------------------------

const amountToCents = (v: string) => Math.max(0, Math.round(Number(v) * 100));
const LEDGER_DIRECTIONS: LedgerDirection[] = ['income', 'expense'];

const invoiceTone: Record<InvoiceStatus, string> = {
  unpaid: 'border-sky-300/30 bg-sky-400/10 text-sky-100',
  paid: 'border-emerald-400/40 bg-emerald-400/15 text-emerald-100',
  waived: 'border-slate-500/40 bg-slate-500/15 text-slate-300'
};

const FinanceSection = ({ currency, ledger, invoices, events, onAddLedger, onDeleteLedger, onAddInvoice, onSettleInvoice, onDeleteInvoice }: {
  currency: string;
  ledger: LedgerEntry[];
  invoices: EventInvoice[];
  events: LeagueEvent[];
  onAddLedger: (input: { direction: LedgerDirection; category: string; amountCents: number; description?: string | null; eventId?: string | null; occurredOn?: string | null }) => void;
  onDeleteLedger: (entryId: string) => void;
  onAddInvoice: (input: { eventId: string; billTo: string; amountCents: number; dueOn?: string | null }) => void;
  onSettleInvoice: (invoiceId: string, status: Extract<InvoiceStatus, 'paid' | 'waived'>) => void;
  onDeleteInvoice: (invoiceId: string) => void;
}) => {
  const summary = summarizeLedger(ledger, invoices);
  const eventName = (id: string | null) => (id ? events.find(e => e.id === id)?.name ?? '—' : '—');

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Income" value={formatMoney(summary.incomeCents, currency)} detail="Recorded" />
        <StatTile label="Expenses" value={formatMoney(summary.expenseCents, currency)} detail="Recorded" />
        <StatTile label="Net" value={formatMoney(summary.netCents, currency)} detail="Income − expenses" />
        <StatTile label="Outstanding" value={formatMoney(summary.outstandingCents, currency)} detail={`${formatMoney(summary.collectedCents, currency)} collected`} />
      </div>

      <section className={panel}>
        <div className={sectionHeader}>
          <Receipt size={16} className="text-sky-200" />
          <h2 className="font-display text-sm font-black text-white">Invoices</h2>
        </div>
        <div className="space-y-4 p-4">
          <InvoiceForm events={events} onAdd={onAddInvoice} />
          {invoices.length === 0 ? (
            <p className="text-sm text-slate-400">No invoices yet. Bill a team for an event above.</p>
          ) : (
            <ul className="space-y-2">
              {invoices.map(inv => (
                <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-black text-white">{inv.bill_to}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${invoiceTone[inv.status]}`}>{INVOICE_STATUS_LABELS[inv.status]}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatMoney(inv.amount_cents, currency)} · {eventName(inv.event_id)}
                      {inv.status === 'paid' && inv.paid_on ? ` · paid ${inv.paid_on}` : inv.due_on ? ` · due ${inv.due_on}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {inv.status === 'unpaid' && (
                      <>
                        <button type="button" className={`${primaryBtn} !px-3`} onClick={() => onSettleInvoice(inv.id, 'paid')}><Check size={14} /> Mark paid</button>
                        <button type="button" className={`${ghostBtn} !px-3`} onClick={() => onSettleInvoice(inv.id, 'waived')}>Waive</button>
                      </>
                    )}
                    <button type="button" aria-label="Remove invoice" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-rose-300" onClick={() => onDeleteInvoice(inv.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className={panel}>
        <div className={sectionHeader}>
          <Wallet size={16} className="text-sky-200" />
          <h2 className="font-display text-sm font-black text-white">Ledger</h2>
        </div>
        <div className="space-y-4 p-4">
          <LedgerForm events={events} onAdd={onAddLedger} />
          {ledger.length === 0 ? (
            <p className="text-sm text-slate-400">No entries yet. Record income and expenses above.</p>
          ) : (
            <ul className="space-y-2">
              {ledger.map(entry => (
                <li key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${entry.direction === 'income' ? 'bg-emerald-400/15 text-emerald-300' : 'bg-rose-400/15 text-rose-300'}`}>
                      {entry.direction === 'income' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </span>
                    <div>
                      <p className="font-display text-sm font-black text-white">{entry.category}</p>
                      <p className="text-xs text-slate-400">{[entry.occurred_on, entry.description, entry.event_id ? eventName(entry.event_id) : null].filter(Boolean).join(' · ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-display text-sm font-black ${entry.direction === 'income' ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {entry.direction === 'income' ? '+' : '−'} {formatMoney(entry.amount_cents, currency)}
                    </span>
                    <button type="button" aria-label="Remove entry" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-rose-300" onClick={() => onDeleteLedger(entry.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};

const InvoiceForm = ({ events, onAdd }: {
  events: LeagueEvent[];
  onAdd: (input: { eventId: string; billTo: string; amountCents: number; dueOn?: string | null }) => void;
}) => {
  const [eventId, setEventId] = useState(events[0]?.id ?? '');
  const [billTo, setBillTo] = useState('');
  const [amount, setAmount] = useState('');
  const [dueOn, setDueOn] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!eventId || !billTo.trim() || !amount) return;
    onAdd({ eventId, billTo, amountCents: amountToCents(amount), dueOn: dueOn || null });
    setBillTo(''); setAmount(''); setDueOn('');
  };

  if (events.length === 0) return <p className="text-xs text-slate-400">Create an event first — invoices are billed against one.</p>;

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
      <div className="space-y-1 lg:col-span-1">
        <label className={label}>Event</label>
        <select className={selectClass} value={eventId} onChange={e => setEventId(e.target.value)}>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
      </div>
      <div className="space-y-1"><label className={label}>Bill to</label><input className={inputClass} value={billTo} onChange={e => setBillTo(e.target.value)} placeholder="Club name" /></div>
      <div className="space-y-1"><label className={label}>Amount</label><input className={inputClass} type="number" min={0} step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" /></div>
      <div className="space-y-1"><label className={label}>Due on</label><input className={inputClass} type="date" value={dueOn} onChange={e => setDueOn(e.target.value)} /></div>
      <button type="submit" className={primaryBtn}><Plus size={14} /> Invoice</button>
    </form>
  );
};

const LedgerForm = ({ events, onAdd }: {
  events: LeagueEvent[];
  onAdd: (input: { direction: LedgerDirection; category: string; amountCents: number; description?: string | null; eventId?: string | null; occurredOn?: string | null }) => void;
}) => {
  const [direction, setDirection] = useState<LedgerDirection>('income');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [eventId, setEventId] = useState('');
  const [occurredOn, setOccurredOn] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!category.trim() || !amount) return;
    onAdd({ direction, category, amountCents: amountToCents(amount), eventId: eventId || null, occurredOn: occurredOn || null });
    setCategory(''); setAmount(''); setOccurredOn('');
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
      <div className="space-y-1">
        <label className={label}>Type</label>
        <select className={selectClass} value={direction} onChange={e => setDirection(e.target.value as LedgerDirection)}>
          {LEDGER_DIRECTIONS.map(d => <option key={d} value={d}>{d === 'income' ? 'Income' : 'Expense'}</option>)}
        </select>
      </div>
      <div className="space-y-1"><label className={label}>Category</label><input className={inputClass} value={category} onChange={e => setCategory(e.target.value)} placeholder="Referees" /></div>
      <div className="space-y-1"><label className={label}>Amount</label><input className={inputClass} type="number" min={0} step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" /></div>
      <div className="space-y-1">
        <label className={label}>Event</label>
        <select className={selectClass} value={eventId} onChange={e => setEventId(e.target.value)}>
          <option value="">— None —</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
      </div>
      <div className="space-y-1"><label className={label}>Date</label><input className={inputClass} type="date" value={occurredOn} onChange={e => setOccurredOn(e.target.value)} /></div>
      <button type="submit" className={primaryBtn}><Plus size={14} /> Add</button>
    </form>
  );
};

// --- Settings + first-league -------------------------------------------------

interface LeagueFormValues { name: string; shortName?: string | null; logoColor?: string | null; contactEmail?: string | null; location?: string | null; description?: string | null }

const LeagueForm = ({ initial, submitLabel, onSubmit }: { initial?: League; submitLabel: string; onSubmit: (v: LeagueFormValues) => void }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [shortName, setShortName] = useState(initial?.short_name ?? '');
  const [logoColor, setLogoColor] = useState(initial?.logo_color ?? '#38bdf8');
  const [contactEmail, setContactEmail] = useState(initial?.contact_email ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ name, shortName: shortName || null, logoColor, contactEmail: contactEmail || null, location: location || null, description: description || null });
  };

  return (
    <form onSubmit={submit} className={`${panel} space-y-3 p-4`}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1"><label className={label}>League name</label><input className={inputClass} required value={name} onChange={e => setName(e.target.value)} placeholder="Metro Youth League" /></div>
        <div className="space-y-1"><label className={label}>Short name</label><input className={inputClass} value={shortName} onChange={e => setShortName(e.target.value)} placeholder="MYL" /></div>
        <div className="space-y-1"><label className={label}>Contact email</label><input className={inputClass} type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} /></div>
        <div className="space-y-1"><label className={label}>Location</label><input className={inputClass} value={location} onChange={e => setLocation(e.target.value)} placeholder="Metro Manila" /></div>
        <div className="space-y-1"><label className={label}>Brand color</label><input className="h-9 w-full rounded-xl border border-white/10 bg-[#0b1726]/85" type="color" value={logoColor} onChange={e => setLogoColor(e.target.value)} /></div>
        <div className="space-y-1 sm:col-span-2"><label className={label}>Description</label><textarea className={inputClass} rows={2} value={description} onChange={e => setDescription(e.target.value)} /></div>
      </div>
      <button type="submit" className={primaryBtn}><Save size={14} /> {submitLabel}</button>
    </form>
  );
};

const SettingsSection = ({ league, onSave }: { league: League; onSave: (v: LeagueFormValues) => void }) => (
  <div className="space-y-4">
    <h2 className="font-display text-sm font-black uppercase tracking-wide text-white">League settings</h2>
    <LeagueForm initial={league} submitLabel="Save league" onSubmit={onSave} />
  </div>
);

const CreateLeaguePanel = ({ onCreate }: { onCreate: (v: LeagueFormValues) => void }) => (
  <div className="space-y-4">
    <div className={`${panel} p-5`}>
      <h2 className="font-display text-base font-black text-white">Create your league</h2>
      <p className="mt-1 text-sm text-slate-400">Set up your league profile to start building seasons and venues.</p>
    </div>
    <LeagueForm submitLabel="Create league" onSubmit={onCreate} />
  </div>
);

export default LeagueApp;
