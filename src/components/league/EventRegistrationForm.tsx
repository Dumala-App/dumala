import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users
} from 'lucide-react';
import { useCloudRuntime } from '../../hooks/useCloudRuntime';
import type { CloudLeagueRepository } from '../../cloud/dataAccess';
import {
  EVENT_FORMAT_LABELS,
  EVENT_STATUS_LABELS,
  REQUIREMENT_TARGET_LABELS,
  type EventRegistrationLookup
} from '../../cloud/league';
import { DARK_GLASS_CLASSES, DARK_GLASS_THEME_STYLE } from '../../theme/darkGlassTheme';
import { createPreviewLeagueRuntime } from './demoLeagueData';

// Public event registration. #/register remains a code-entry fallback, while
// #/register/CODE opens a reusable tournament landing page with direct apply.

const label = 'block text-[11px] font-black uppercase tracking-wide text-cyan-100/65';
const inputClass = DARK_GLASS_CLASSES.input;
const primaryBtn = `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold ${DARK_GLASS_CLASSES.reviewButton}`;
const secondaryBtn = 'inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08]';
const panel = DARK_GLASS_CLASSES.panel;

type IconComponent = React.ComponentType<{ size?: number; className?: string }>;

interface ApplicationFormState {
  clubName: string;
  teamName: string;
  category: string;
  contactName: string;
  contactEmail: string;
  rosterSize: string;
  message: string;
}

const friendlyError = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('ALREADY_REGISTERED')) return 'A registration from this email already exists for this event.';
  if (message.includes('REGISTRATION_CLOSED')) return 'Registration for this event has closed.';
  if (message.includes('INVALID_REGISTRATION_CODE')) return 'That registration code was not found.';
  if (message.includes('CLUB_NAME_REQUIRED')) return 'Please enter your club name.';
  if (message.includes('CONTACT_NAME_REQUIRED')) return 'Please enter a contact name.';
  if (message.includes('CONTACT_EMAIL_INVALID')) return 'Please enter a valid contact email.';
  return message || 'Something went wrong. Please try again.';
};

const getRegistrationCode = (): string => {
  if (typeof window === 'undefined') return '';
  const route = window.location.hash.replace(/^#\/?/, '');
  if (route.startsWith('register/')) return route.slice('register/'.length).split(/[/?#]/)[0].toUpperCase();
  const queryIndex = route.indexOf('?');
  if (queryIndex !== -1) return new URLSearchParams(route.slice(queryIndex + 1)).get('code')?.toUpperCase() ?? '';
  return '';
};

const formatDate = (date?: string | null) => {
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed);
};

const eventDates = (event: EventRegistrationLookup) =>
  [formatDate(event.startsOn), formatDate(event.endsOn)].filter(Boolean).join(' - ');

const eventCapacity = (event: EventRegistrationLookup) => {
  if (!event.teamCap) return 'Open field';
  return `${event.spotsRemaining ?? 0} of ${event.teamCap} spots left`;
};

const eventFormat = (event: EventRegistrationLookup) =>
  [event.format ? EVENT_FORMAT_LABELS[event.format] : null, event.category].filter(Boolean).join(' / ') || 'Tournament';

const leagueLine = (event: EventRegistrationLookup) =>
  [event.leagueName, event.leagueLocation].filter(Boolean).join(' / ') || 'League organizer';

const DetailTile = ({ icon: Icon, label: tileLabel, value }: { icon: IconComponent; label: string; value: string }) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.045] p-3">
    <div className="flex items-center gap-2 text-slate-400">
      <Icon size={14} className="text-orange-300" />
      <span className="text-[10px] font-black uppercase tracking-wide">{tileLabel}</span>
    </div>
    <p className="mt-1 min-h-[1.25rem] text-sm font-black text-white">{value}</p>
  </div>
);

const StatusBadge = ({ event }: { event: EventRegistrationLookup }) => {
  const labelText = event.open ? 'Registration open' : event.status ? EVENT_STATUS_LABELS[event.status] : 'Unavailable';
  const className = event.open
    ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100'
    : 'border-amber-300/30 bg-amber-300/10 text-amber-100';
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labelText}
    </span>
  );
};

const TournamentSummary = ({ event }: { event: EventRegistrationLookup }) => {
  const heroTitle = event.headline?.trim() || event.name || 'Tournament registration';
  return (
    <section className={`${panel} overflow-hidden`}>
      <div className="relative p-5 sm:p-6">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-orange-400/14 to-transparent" />
        <div className="relative space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge event={event} />
            {event.category && (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-slate-300">
                {event.category}
              </span>
            )}
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-orange-300">{event.leagueName ?? 'Dumala League'}</p>
            <h2 className="mt-2 max-w-3xl font-display text-3xl font-black leading-tight text-white sm:text-4xl">
              {heroTitle}
            </h2>
            {event.details ? (
              <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 text-slate-300">{event.details}</p>
            ) : (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Review the tournament details, confirm your team information, and send the application directly to the league owner.
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DetailTile icon={Trophy} label="Format" value={eventFormat(event)} />
            <DetailTile icon={CalendarDays} label="Schedule" value={eventDates(event) || 'Dates TBD'} />
            <DetailTile icon={Users} label="Capacity" value={eventCapacity(event)} />
            <DetailTile icon={MapPin} label="League" value={leagueLine(event)} />
          </div>
        </div>
      </div>
    </section>
  );
};

const RequirementsPanel = ({ event }: { event: EventRegistrationLookup }) => {
  const rules = event.eligibilityRules ?? [];
  const docs = event.documentRequirements ?? [];
  if (rules.length === 0 && docs.length === 0 && !event.contactNote && !event.terms) return null;

  return (
    <section className={`${panel} p-5`}>
      <div className="grid gap-5 lg:grid-cols-2">
        {rules.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-white">
              <ShieldCheck size={16} className="text-orange-300" /> Eligibility
            </div>
            <ul className="space-y-2">
              {rules.map(rule => (
                <li key={rule.id} className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-slate-300">
                  <span className="font-black text-white">{rule.title}</span>
                  <span className="ml-2 text-slate-500">{REQUIREMENT_TARGET_LABELS[rule.target]}</span>
                  {rule.description && <span className="mt-1 block leading-5 text-slate-400">{rule.description}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {docs.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-white">
              <FileText size={16} className="text-orange-300" /> Documents
            </div>
            <ul className="space-y-2">
              {docs.map(doc => (
                <li key={doc.id} className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-slate-300">
                  <span className="font-black text-white">{doc.title}</span>
                  {doc.required && <span className="ml-2 text-orange-200">Required</span>}
                  {doc.instructions && <span className="mt-1 block leading-5 text-slate-400">{doc.instructions}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {(event.contactNote || event.terms) && (
        <div className="mt-5 grid gap-3">
          {event.contactNote && (
            <p className="rounded-xl border border-cyan-300/15 bg-cyan-300/10 p-3 text-xs leading-5 text-cyan-100">
              <Mail size={14} className="mr-1 inline text-cyan-200" />
              {event.contactNote}
            </p>
          )}
          {event.terms && (
            <p className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-xs leading-5 text-slate-300">
              <ClipboardCheck size={14} className="mr-1 inline text-orange-300" />
              {event.terms}
            </p>
          )}
        </div>
      )}
    </section>
  );
};

const ClosedRegistrationPanel = ({ event, onChangeCode }: { event: EventRegistrationLookup; onChangeCode: () => void }) => (
  <section className={`${panel} p-5`}>
    <div className="flex items-start gap-3">
      <div className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-2 text-amber-100">
        <CalendarDays size={18} />
      </div>
      <div>
        <h3 className="font-display text-base font-black text-white">Registration is not accepting applications</h3>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          This tournament is currently {event.status ? EVENT_STATUS_LABELS[event.status].toLowerCase() : 'unavailable'}. Contact the league if you expected this link to be open.
        </p>
        <button type="button" className={`${secondaryBtn} mt-4`} onClick={onChangeCode}>
          <Search size={14} /> Use a different code
        </button>
      </div>
    </div>
  </section>
);

const ApplicationForm = ({
  event,
  code,
  status,
  feedback,
  form,
  onFormChange,
  onSubmit,
  onChangeCode
}: {
  event: EventRegistrationLookup;
  code: string;
  status: 'idle' | 'working';
  feedback: string;
  form: ApplicationFormState;
  onFormChange: (field: keyof ApplicationFormState, value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onChangeCode: () => void;
}) => (
  <form onSubmit={onSubmit} className={`${panel} space-y-4 p-5 lg:sticky lg:top-6`} aria-label="Event registration">
    <div>
      <div className="flex items-center gap-2">
        <Send size={16} className="text-orange-300" />
        <h3 className="font-display text-base font-black text-white">Team application</h3>
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-400">
        Applying for <span className="font-bold text-slate-200">{event.name}</span> with code <span className="font-display tracking-wide text-orange-200">{code}</span>.
      </p>
    </div>

    <div className="grid gap-3">
      <div className="space-y-1">
        <label className={label}>Club name</label>
        <input className={inputClass} required value={form.clubName} onChange={e => onFormChange('clubName', e.target.value)} placeholder="Rovers FC" />
      </div>
      <div className="space-y-1">
        <label className={label}>Team name <span className="text-slate-500">(optional)</span></label>
        <input className={inputClass} value={form.teamName} onChange={e => onFormChange('teamName', e.target.value)} placeholder="Rovers U14" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <div className="space-y-1">
          <label className={label}>Age group</label>
          <input className={inputClass} value={form.category} onChange={e => onFormChange('category', e.target.value)} placeholder="U14" />
        </div>
        <div className="space-y-1">
          <label className={label}>Roster size <span className="text-slate-500">(optional)</span></label>
          <input className={inputClass} type="number" min={0} value={form.rosterSize} onChange={e => onFormChange('rosterSize', e.target.value)} />
        </div>
      </div>
      <div className="space-y-1">
        <label className={label}>Contact name</label>
        <input className={inputClass} required value={form.contactName} onChange={e => onFormChange('contactName', e.target.value)} placeholder="Coach name" autoComplete="name" />
      </div>
      <div className="space-y-1">
        <label className={label}>Contact email</label>
        <input className={inputClass} type="email" required value={form.contactEmail} onChange={e => onFormChange('contactEmail', e.target.value)} placeholder="coach@example.com" autoComplete="email" />
      </div>
      <div className="space-y-1">
        <label className={label}>Message <span className="text-slate-500">(optional)</span></label>
        <textarea className={inputClass} rows={4} maxLength={1000} value={form.message} onChange={e => onFormChange('message', e.target.value)} placeholder="Anything the league should know" />
      </div>
    </div>

    {feedback && <p className="text-sm text-amber-300" role="alert">{feedback}</p>}

    <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
      <button type="submit" disabled={status === 'working'} className={primaryBtn}>
        {status === 'working' ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />} Submit application
      </button>
      <button type="button" className={secondaryBtn} onClick={onChangeCode}>
        <Search size={14} /> Different code
      </button>
    </div>
  </form>
);

const LookupForm = ({
  code,
  status,
  feedback,
  onCodeChange,
  onSubmit
}: {
  code: string;
  status: 'idle' | 'working';
  feedback: string;
  onCodeChange: (code: string) => void;
  onSubmit: (e: FormEvent) => void;
}) => (
  <form onSubmit={onSubmit} className={`${panel} mx-auto max-w-lg space-y-4 p-5`} aria-label="Find event by code">
    <div>
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-slate-300">
        <Sparkles size={13} className="text-orange-300" /> Public tournament registration
      </div>
      <h2 className="mt-3 font-display text-2xl font-black text-white">Enter your registration code</h2>
      <p className="mt-1 text-sm leading-6 text-slate-400">Use the code shared by the league owner to open the tournament page and apply.</p>
    </div>
    <div className="space-y-1">
      <label className={label}>Registration code</label>
      <input
        className={`${inputClass} font-display text-lg tracking-[0.2em]`}
        required
        value={code}
        onChange={e => onCodeChange(e.target.value.toUpperCase())}
        placeholder="ABCD1234"
        autoCapitalize="characters"
        spellCheck={false}
      />
    </div>
    {feedback && <p className="text-sm text-amber-300" role="alert">{feedback}</p>}
    <button type="submit" disabled={status === 'working'} className={primaryBtn}>
      {status === 'working' ? <Loader2 size={16} className="animate-spin" /> : <Search size={14} />} Find event <ArrowRight size={14} />
    </button>
  </form>
);

const DirectLinkLoading = () => (
  <div className={`${panel} mx-auto max-w-2xl p-6`}>
    <div className="flex items-center gap-3">
      <Loader2 size={20} className="animate-spin text-orange-300" />
      <div>
        <h2 className="font-display text-xl font-black text-white">Opening tournament registration</h2>
        <p className="mt-1 text-sm text-slate-400">Loading the public tournament details from the league.</p>
      </div>
    </div>
  </div>
);

const RegistrationForm = ({ league, initialCode = '' }: { league: CloudLeagueRepository; initialCode?: string }) => {
  const [step, setStep] = useState<'lookup' | 'apply' | 'done'>(initialCode ? 'apply' : 'lookup');
  const [code, setCode] = useState(initialCode);
  const [event, setEvent] = useState<EventRegistrationLookup | null>(null);
  const [status, setStatus] = useState<'idle' | 'working'>(initialCode ? 'working' : 'idle');
  const [feedback, setFeedback] = useState('');

  const [form, setForm] = useState({
    clubName: '',
    teamName: '',
    category: '',
    contactName: '',
    contactEmail: '',
    rosterSize: '',
    message: ''
  });

  const onFormChange = (field: keyof typeof form, value: string) => setForm(current => ({ ...current, [field]: value }));

  const resetToLookup = () => {
    setStep('lookup');
    setEvent(null);
    setFeedback('');
  };

  const lookupCode = async (targetCode = code) => {
    if (!targetCode.trim()) return;
    setStatus('working');
    setFeedback('');
    try {
      const result = await league.lookupEventRegistration(targetCode);
      if (!result.found) {
        setEvent(null);
        setStep('lookup');
        setFeedback('No event was found for that code. Double-check it with the league.');
      } else {
        setCode(targetCode.trim().toUpperCase());
        setEvent(result);
        setForm(current => ({ ...current, category: result.category ?? current.category }));
        setStep('apply');
      }
    } catch (error) {
      setFeedback(friendlyError(error));
      setStep('lookup');
    } finally {
      setStatus('idle');
    }
  };

  useEffect(() => {
    if (initialCode) void lookupCode(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode, league]);

  const lookup = async (e: FormEvent) => {
    e.preventDefault();
    await lookupCode(code);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!event || !event.open) return;
    setStatus('working');
    setFeedback('');
    try {
      await league.submitEventRegistration({
        code,
        clubName: form.clubName,
        teamName: form.teamName || null,
        category: form.category || null,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        rosterSize: form.rosterSize ? Number(form.rosterSize) : null,
        message: form.message || null
      });
      setStep('done');
    } catch (error) {
      setFeedback(friendlyError(error));
    } finally {
      setStatus('idle');
    }
  };

  if (step === 'done') {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-6 text-emerald-100">
        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide">
          <CheckCircle2 size={18} /> Application submitted
        </div>
        <p className="mt-2 text-sm leading-relaxed text-emerald-200/90">
          Thanks. Your registration for <span className="font-bold">{event?.name}</span> is in. The league will review it and confirm your club's place.
        </p>
      </div>
    );
  }

  if (step === 'apply' && !event && status === 'working') return <DirectLinkLoading />;

  if (step === 'apply' && event) {
    return (
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
        <div className="space-y-5">
          <TournamentSummary event={event} />
          <RequirementsPanel event={event} />
        </div>

        {event.open ? (
          <ApplicationForm
            event={event}
            code={code}
            status={status}
            feedback={feedback}
            form={form}
            onFormChange={onFormChange}
            onSubmit={submit}
            onChangeCode={resetToLookup}
          />
        ) : (
          <ClosedRegistrationPanel event={event} onChangeCode={resetToLookup} />
        )}
      </div>
    );
  }

  return (
    <LookupForm
      code={code}
      status={status}
      feedback={feedback}
      onCodeChange={setCode}
      onSubmit={lookup}
    />
  );
};

let previewRegisterRuntimeSingleton: ReturnType<typeof createPreviewLeagueRuntime> | null = null;

const EventRegistrationView = () => {
  const runtime = useCloudRuntime();
  const directCode = useMemo(() => getRegistrationCode(), []);

  let league: CloudLeagueRepository | null = null;
  if (runtime.phase6.leaguePreviewEnabled) {
    if (!previewRegisterRuntimeSingleton) previewRegisterRuntimeSingleton = createPreviewLeagueRuntime(runtime.phase6);
    league = previewRegisterRuntimeSingleton.dataAccess.league;
  } else if (runtime.enabled) {
    league = runtime.dataAccess.league;
  }

  return (
    <div className="min-h-screen bg-[#020713] text-slate-100" style={DARK_GLASS_THEME_STYLE}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-300">Dumala League</p>
            <h1 className="mt-1 font-display text-2xl font-black leading-tight sm:text-3xl">Tournament registration</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
              Review tournament details and apply directly. No account needed.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-slate-400">
            Public link
          </div>
        </header>

        {league ? (
          <RegistrationForm league={league} initialCode={directCode} />
        ) : (
          <p className={`${panel} p-6 text-sm text-slate-300`}>
            Registration needs a cloud connection. Please open this link on an online device.
          </p>
        )}
      </div>
    </div>
  );
};

export default EventRegistrationView;
