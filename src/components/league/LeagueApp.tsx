import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Eye,
  Gauge,
  ListOrdered,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Shuffle,
  Swords,
  Trash2,
  Trophy,
  Users,
  X
} from 'lucide-react';
import type { CloudRuntime } from '../../cloud/runtime';
import type { CloudLeagueRepository } from '../../cloud/dataAccess';
import type { CloudAuthController } from '../../hooks/useCloudAuth';
import {
  EVENT_FORMAT_LABELS,
  EVENT_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
  SEASON_STATUS_LABELS,
  computeStandings,
  nextEventStatuses,
  nextSeasonStatuses,
  spotsRemaining,
  type EventFixture,
  type EventRegistration,
  type EventRegistrationStatus,
  type EventTeam,
  type League,
  type LeagueEvent,
  type LeagueEventFormat,
  type LeagueEventStatus,
  type LeagueSeason,
  type LeagueSeasonStatus,
  type LeagueVenue
} from '../../cloud/league';
import {
  DARK_GLASS_CLASSES,
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

type LeagueSection = 'overview' | 'seasons' | 'events' | 'venues' | 'settings';

const NAV: Array<{ id: LeagueSection; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: 'overview', label: 'Overview', icon: Gauge },
  { id: 'seasons', label: 'Seasons', icon: CalendarRange },
  { id: 'events', label: 'Events', icon: Trophy },
  { id: 'venues', label: 'Venues', icon: MapPin },
  { id: 'settings', label: 'Settings', icon: Settings }
];

const statusTone: Record<LeagueSeasonStatus, string> = {
  draft: 'border-slate-400/40 bg-slate-400/15 text-slate-200',
  registration_open: 'border-amber-400/40 bg-amber-400/15 text-amber-100',
  active: 'border-emerald-400/40 bg-emerald-400/15 text-emerald-100',
  completed: 'border-cyan-400/40 bg-cyan-400/15 text-cyan-100',
  archived: 'border-slate-500/40 bg-slate-500/15 text-slate-300'
};

const eventStatusTone: Record<LeagueEventStatus, string> = {
  draft: 'border-slate-400/40 bg-slate-400/15 text-slate-200',
  registration_open: 'border-amber-400/40 bg-amber-400/15 text-amber-100',
  active: 'border-emerald-400/40 bg-emerald-400/15 text-emerald-100',
  completed: 'border-cyan-400/40 bg-cyan-400/15 text-cyan-100'
};

const registrationTone: Record<EventRegistrationStatus, string> = {
  submitted: 'border-amber-400/40 bg-amber-400/15 text-amber-100',
  approved: 'border-emerald-400/40 bg-emerald-400/15 text-emerald-100',
  rejected: 'border-rose-400/40 bg-rose-400/15 text-rose-100',
  waitlisted: 'border-sky-400/40 bg-sky-400/15 text-sky-100',
  withdrawn: 'border-slate-500/40 bg-slate-500/15 text-slate-300'
};

const panel = DARK_GLASS_CLASSES.panel;
const inputClass = DARK_GLASS_CLASSES.input;
const primaryBtn = `inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold ${DARK_GLASS_CLASSES.reviewButton}`;
const ghostBtn = `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${DARK_GLASS_CLASSES.secondaryActionButton}`;
const label = 'block text-[11px] font-black uppercase tracking-wide text-cyan-100/65';

const StatusBadge = ({ status }: { status: LeagueSeasonStatus }) => (
  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusTone[status]}`}>
    {SEASON_STATUS_LABELS[status]}
  </span>
);

const StatTile = ({ label: tileLabel, value, detail }: { label: string; value: string | number; detail: string }) => (
  <div className="rounded-2xl border border-cyan-300/10 bg-white/[0.035] p-4">
    <p className="text-[11px] font-black uppercase text-cyan-100/65">{tileLabel}</p>
    <p className="mt-1 font-display text-2xl font-black text-white">{value}</p>
    <p className="mt-1 text-xs text-slate-400">{detail}</p>
  </div>
);

const LeagueApp = ({ runtime, userId, authController, preview = false }: LeagueAppProps) => {
  const league = runtime.dataAccess.league;
  const [leagues, setLeagues] = useState<League[]>([]);
  const [activeLeagueId, setActiveLeagueId] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<LeagueSeason[]>([]);
  const [venues, setVenues] = useState<LeagueVenue[]>([]);
  const [events, setEvents] = useState<LeagueEvent[]>([]);
  const [section, setSection] = useState<LeagueSection>('overview');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const activeLeague = useMemo(() => leagues.find(l => l.id === activeLeagueId) ?? null, [leagues, activeLeagueId]);

  const loadLeagueData = useCallback(async (leagueId: string) => {
    const [nextSeasons, nextVenues, nextEvents] = await Promise.all([
      league.listSeasons(leagueId),
      league.listVenues(leagueId),
      league.listEvents(leagueId)
    ]);
    setSeasons(nextSeasons);
    setVenues(nextVenues);
    setEvents(nextEvents);
  }, [league]);

  const reload = useCallback(async () => {
    const nextLeagues = await league.listLeagues();
    setLeagues(nextLeagues);
    const target = nextLeagues.find(l => l.id === activeLeagueId) ?? nextLeagues[0] ?? null;
    setActiveLeagueId(target?.id ?? null);
    if (target) await loadLeagueData(target.id);
    else { setSeasons([]); setVenues([]); setEvents([]); }
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
    <div className="relative min-h-screen bg-[#020713] text-slate-100" style={DARK_GLASS_THEME_STYLE}>
      <div className="mx-auto min-h-screen max-w-5xl px-4 py-6" style={DARK_GLASS_DASHBOARD_SURFACE_STYLE}>
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${activeLeague?.logo_color ?? '#f97316'}22`, color: activeLeague?.logo_color ?? '#f97316' }}>
              <Trophy size={18} />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-300">Dumala League</p>
              <h1 className="font-display text-lg font-black leading-tight">{activeLeague?.name ?? 'Your league'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {leagues.length > 1 && (
              <select
                value={activeLeagueId ?? ''}
                onChange={e => { setActiveLeagueId(e.target.value); void loadLeagueData(e.target.value); }}
                className={DARK_GLASS_CLASSES.select}
              >
                {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            )}
            {preview ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-orange-400/25 bg-orange-400/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-orange-200">
                <Eye size={13} /> Preview
              </span>
            ) : (
              <CloudAccountGate runtime={runtime} authController={authController} bootstrapAccount={false} tone="dark" layout="compact" audience="admin" />
            )}
          </div>
        </header>

        <nav className="mb-5 flex flex-wrap gap-2">
          {NAV.map(item => {
            const active = item.id === section;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${active ? DARK_GLASS_CLASSES.navItemActive : DARK_GLASS_CLASSES.navItemIdle}`}
              >
                <Icon size={15} /> {item.label}
              </button>
            );
          })}
        </nav>

        {message && <p className="mb-4 rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-sm text-amber-100" role="status">{message}</p>}

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
                onAdvance={(seasonId, next) => withError(async () => { await league.advanceSeasonStatus(seasonId, next); await loadLeagueData(activeLeague.id); })}
                onGoToSeasons={() => setSection('seasons')}
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
            {section === 'venues' && (
              <VenuesSection
                venues={venues}
                onCreate={input => withError(async () => { await league.createVenue(activeLeague.id, input); await loadLeagueData(activeLeague.id); })}
                onDelete={venueId => withError(async () => { await league.deleteVenue(venueId); await loadLeagueData(activeLeague.id); })}
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

const OverviewSection = ({ league, seasons, venues, onAdvance, onGoToSeasons }: {
  league: League;
  seasons: LeagueSeason[];
  venues: LeagueVenue[];
  onAdvance: (seasonId: string, next: LeagueSeasonStatus) => void;
  onGoToSeasons: () => void;
}) => {
  const activeSeasons = seasons.filter(s => s.status === 'active').length;
  const focus = seasons.find(s => s.status === 'active') ?? seasons.find(s => s.status === 'registration_open') ?? seasons[0] ?? null;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Seasons" value={seasons.length} detail={`${activeSeasons} active`} />
        <StatTile label="Venues" value={venues.length} detail="Available locations" />
        <StatTile label="League" value={league.short_name ?? '—'} detail={league.location ?? 'No location set'} />
      </div>
      <section className={panel}>
        <div className={DARK_GLASS_CLASSES.panelHeader}>
          <CalendarRange size={16} className="text-cyan-200" />
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
              No seasons yet. <button type="button" onClick={onGoToSeasons} className="font-bold text-orange-300">Create your first season</button>.
            </div>
          )}
        </div>
      </section>
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
          <button type="button" onClick={onGoToSeasons} className="font-bold text-orange-300">Go to Seasons</button>.
        </p>
      ) : (
        <>
          {open && (
            <form onSubmit={submit} className={`${panel} space-y-3 p-4`}>
              <p className="text-xs text-slate-400">A tournament or competition inside a season. You'll get a shareable registration link once it opens.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className={label}>Season</label>
                  <select className={DARK_GLASS_CLASSES.select} required value={seasonId} onChange={e => setSeasonId(e.target.value)}>
                    {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1"><label className={label}>Event name</label><input className={inputClass} required value={name} onChange={e => setName(e.target.value)} placeholder="Metro Cup Qualifiers" /></div>
                <div className="space-y-1">
                  <label className={label}>Format</label>
                  <select className={DARK_GLASS_CLASSES.select} value={format} onChange={e => setFormat(e.target.value as LeagueEventFormat)}>
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
                    className={`${panel} flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left transition-colors hover:border-cyan-300/25`}
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

type EventTab = 'applications' | 'teams' | 'fixtures' | 'table';

const EVENT_TABS: Array<{ id: EventTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: 'applications', label: 'Applications', icon: Users },
  { id: 'teams', label: 'Teams', icon: Shield },
  { id: 'fixtures', label: 'Fixtures', icon: Swords },
  { id: 'table', label: 'Table', icon: ListOrdered }
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
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<EventTab>('applications');

  const refresh = useCallback(async () => {
    const [regs, tms, fxs] = await Promise.all([
      league.listRegistrations(event.id),
      league.listEventTeams(event.id),
      league.listFixtures(event.id)
    ]);
    setRegistrations(regs);
    setTeams(tms);
    setFixtures(fxs);
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
  const generateFixtures = () =>
    runError(async () => { await league.generateFixtures(event.league_id, event.id); await refresh(); });
  const clearFixtures = () =>
    runError(async () => { await league.clearFixtures(event.id); await refresh(); });
  const recordResult = (fixtureId: string, home: number, away: number) =>
    runError(async () => { await league.recordFixtureResult(fixtureId, home, away); await refresh(); });

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className={ghostBtn}><ChevronLeft size={14} /> All events</button>

      <section className={panel}>
        <div className={DARK_GLASS_CLASSES.panelHeader}>
          <Trophy size={16} className="text-cyan-200" />
          <h2 className="font-display text-sm font-black text-white">{event.name}</h2>
          <EventStatusBadge status={event.status} />
        </div>
        <div className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Registered" value={`${approvedCount}${event.team_cap ? ` / ${event.team_cap}` : ''}`} detail={spots === null ? 'No cap' : `${spots} spots left`} />
            <StatTile label="Teams" value={teams.length} detail="In this event" />
            <StatTile label="Format" value={EVENT_FORMAT_LABELS[event.format]} detail={event.category ?? 'All ages'} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-300/10 bg-white/[0.035] p-4">
            <div>
              <p className="text-[11px] font-black uppercase text-cyan-100/65">Registration code</p>
              <p className="mt-1 font-display text-xl font-black tracking-[0.2em] text-white">{event.registration_code}</p>
              <p className="mt-1 text-xs text-slate-400">
                {event.status === 'registration_open'
                  ? <>Share <span className="text-cyan-200">{registerUrl}</span> and this code with clubs.</>
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
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${active ? DARK_GLASS_CLASSES.navItemActive : DARK_GLASS_CLASSES.navItemIdle}`}
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
          {tab === 'fixtures' && <FixturesPanel fixtures={fixtures} teamCount={teams.length} teamName={teamName} onGenerate={generateFixtures} onClear={clearFixtures} onRecord={recordResult} />}
          {tab === 'table' && <TablePanel standings={computeStandings(teams, fixtures)} />}
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
    <div className={DARK_GLASS_CLASSES.panelHeader}>
      <Users size={16} className="text-cyan-200" />
      <h2 className="font-display text-sm font-black text-white">Applications</h2>
    </div>
    <div className="p-4">
      {registrations.length === 0 ? (
        <p className="text-sm text-slate-400">No applications yet. Share the registration code to invite clubs.</p>
      ) : (
        <ul className="space-y-2">
          {registrations.map(reg => (
            <li key={reg.id} className="rounded-2xl border border-cyan-300/10 bg-white/[0.035] p-4">
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
      <div className={DARK_GLASS_CLASSES.panelHeader}>
        <Shield size={16} className="text-cyan-200" />
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
              <li key={team.id} className="flex items-center justify-between gap-3 rounded-xl border border-cyan-300/10 bg-white/[0.035] px-4 py-3">
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
      <div className={`${DARK_GLASS_CLASSES.panelHeader} justify-between`}>
        <div className="flex items-center gap-2">
          <Swords size={16} className="text-cyan-200" />
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
                <p className="text-[11px] font-black uppercase tracking-wide text-cyan-100/65">Round {round}</p>
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

  const scoreInput = 'h-9 w-12 rounded-lg border border-cyan-300/10 bg-[#0b1726]/85 text-center font-display text-sm font-black text-white';

  return (
    <div className="flex items-center gap-2 rounded-xl border border-cyan-300/10 bg-white/[0.035] px-3 py-2">
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

const TablePanel = ({ standings }: { standings: ReturnType<typeof computeStandings> }) => (
  <section className={panel}>
    <div className={DARK_GLASS_CLASSES.panelHeader}>
      <ListOrdered size={16} className="text-cyan-200" />
      <h2 className="font-display text-sm font-black text-white">Standings</h2>
    </div>
    <div className="p-4">
      {standings.length === 0 ? (
        <p className="text-sm text-slate-400">Add teams and record results to build the table.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] font-black uppercase text-cyan-100/65">
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
                <tr key={row.teamId} className="border-t border-cyan-300/10">
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

// --- Venues ------------------------------------------------------------------

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
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200"><MapPin size={16} /></span>
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

// --- Settings + first-league -------------------------------------------------

interface LeagueFormValues { name: string; shortName?: string | null; logoColor?: string | null; contactEmail?: string | null; location?: string | null; description?: string | null }

const LeagueForm = ({ initial, submitLabel, onSubmit }: { initial?: League; submitLabel: string; onSubmit: (v: LeagueFormValues) => void }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [shortName, setShortName] = useState(initial?.short_name ?? '');
  const [logoColor, setLogoColor] = useState(initial?.logo_color ?? '#f97316');
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
        <div className="space-y-1"><label className={label}>Brand color</label><input className="h-9 w-full rounded-xl border border-cyan-300/10 bg-[#0b1726]/85" type="color" value={logoColor} onChange={e => setLogoColor(e.target.value)} /></div>
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
