import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarRange,
  ChevronRight,
  Eye,
  Gauge,
  Loader2,
  MapPin,
  Plus,
  Save,
  Settings,
  Trash2,
  Trophy
} from 'lucide-react';
import type { CloudRuntime } from '../../cloud/runtime';
import type { CloudAuthController } from '../../hooks/useCloudAuth';
import {
  SEASON_STATUS_LABELS,
  nextSeasonStatuses,
  type League,
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

type LeagueSection = 'overview' | 'seasons' | 'venues' | 'settings';

const NAV: Array<{ id: LeagueSection; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: 'overview', label: 'Overview', icon: Gauge },
  { id: 'seasons', label: 'Seasons', icon: CalendarRange },
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
  const [section, setSection] = useState<LeagueSection>('overview');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const activeLeague = useMemo(() => leagues.find(l => l.id === activeLeagueId) ?? null, [leagues, activeLeagueId]);

  const loadLeagueData = useCallback(async (leagueId: string) => {
    const [nextSeasons, nextVenues] = await Promise.all([league.listSeasons(leagueId), league.listVenues(leagueId)]);
    setSeasons(nextSeasons);
    setVenues(nextVenues);
  }, [league]);

  const reload = useCallback(async () => {
    const nextLeagues = await league.listLeagues();
    setLeagues(nextLeagues);
    const target = nextLeagues.find(l => l.id === activeLeagueId) ?? nextLeagues[0] ?? null;
    setActiveLeagueId(target?.id ?? null);
    if (target) await loadLeagueData(target.id);
    else { setSeasons([]); setVenues([]); }
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
