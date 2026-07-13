import React, { FormEvent, useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2, Search, Send, Trophy } from 'lucide-react';
import { useCloudRuntime } from '../../hooks/useCloudRuntime';
import type { CloudLeagueRepository } from '../../cloud/dataAccess';
import {
  EVENT_FORMAT_LABELS,
  type EventRegistrationLookup
} from '../../cloud/league';
import { DARK_GLASS_CLASSES, DARK_GLASS_THEME_STYLE } from '../../theme/darkGlassTheme';
import { createPreviewLeagueRuntime } from './demoLeagueData';

// Public event registration. A coach opens #/register, enters the code a league
// owner shared, and applies for a spot — no account required (the submit runs
// through a security-definer RPC). Mirrors the "Request League Access" waitlist.

const label = 'block text-[11px] font-black uppercase tracking-wide text-cyan-100/65';
const inputClass = DARK_GLASS_CLASSES.input;
const primaryBtn = `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold ${DARK_GLASS_CLASSES.reviewButton}`;
const panel = DARK_GLASS_CLASSES.panel;

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

const RegistrationForm = ({ league }: { league: CloudLeagueRepository }) => {
  const [step, setStep] = useState<'lookup' | 'apply' | 'done'>('lookup');
  const [code, setCode] = useState('');
  const [event, setEvent] = useState<EventRegistrationLookup | null>(null);
  const [status, setStatus] = useState<'idle' | 'working'>('idle');
  const [feedback, setFeedback] = useState('');

  const [clubName, setClubName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [category, setCategory] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [rosterSize, setRosterSize] = useState('');
  const [message, setMessage] = useState('');

  const lookup = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('working');
    setFeedback('');
    try {
      const result = await league.lookupEventRegistration(code);
      if (!result.found) {
        setFeedback('No event was found for that code. Double-check it with the league.');
      } else if (!result.open) {
        setFeedback(`Registration for ${result.name ?? 'this event'} isn't open right now.`);
      } else {
        setEvent(result);
        setCategory(result.category ?? '');
        setStep('apply');
      }
    } catch (error) {
      setFeedback(friendlyError(error));
    } finally {
      setStatus('idle');
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setStatus('working');
    setFeedback('');
    try {
      await league.submitEventRegistration({
        code,
        clubName,
        teamName: teamName || null,
        category: category || null,
        contactName,
        contactEmail,
        rosterSize: rosterSize ? Number(rosterSize) : null,
        message: message || null
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
      <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-6 text-emerald-100">
        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide">
          <CheckCircle2 size={18} /> Application submitted
        </div>
        <p className="mt-2 text-sm leading-relaxed text-emerald-200/90">
          Thanks — your registration for <span className="font-bold">{event?.name}</span> is in. The league will review it and
          confirm your club's place. You can close this page.
        </p>
      </div>
    );
  }

  if (step === 'apply' && event) {
    return (
      <form onSubmit={submit} className={`${panel} space-y-4 p-5`} aria-label="Event registration">
        <div className="rounded-2xl border border-cyan-300/10 bg-white/[0.035] p-4">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-orange-300" />
            <span className="font-display text-base font-black text-white">{event.name}</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {[event.format ? EVENT_FORMAT_LABELS[event.format] : null, event.category].filter(Boolean).join(' · ')}
            {event.spotsRemaining !== null && event.spotsRemaining !== undefined ? ` · ${event.spotsRemaining} spots left` : ''}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1"><label className={label}>Club name</label><input className={inputClass} required value={clubName} onChange={e => setClubName(e.target.value)} placeholder="Rovers FC" /></div>
          <div className="space-y-1"><label className={label}>Team name <span className="text-slate-500">(optional)</span></label><input className={inputClass} value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Rovers U14" /></div>
          <div className="space-y-1"><label className={label}>Age group</label><input className={inputClass} value={category} onChange={e => setCategory(e.target.value)} placeholder="U14" /></div>
          <div className="space-y-1"><label className={label}>Roster size <span className="text-slate-500">(optional)</span></label><input className={inputClass} type="number" min={0} value={rosterSize} onChange={e => setRosterSize(e.target.value)} /></div>
          <div className="space-y-1"><label className={label}>Contact name</label><input className={inputClass} required value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Coach name" autoComplete="name" /></div>
          <div className="space-y-1"><label className={label}>Contact email</label><input className={inputClass} type="email" required value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="coach@example.com" autoComplete="email" /></div>
          <div className="space-y-1 sm:col-span-2"><label className={label}>Message <span className="text-slate-500">(optional)</span></label><textarea className={inputClass} rows={3} maxLength={1000} value={message} onChange={e => setMessage(e.target.value)} placeholder="Anything the league should know" /></div>
        </div>

        {feedback && <p className="text-sm text-amber-300" role="alert">{feedback}</p>}

        <div className="flex items-center gap-2">
          <button type="submit" disabled={status === 'working'} className={primaryBtn}>
            {status === 'working' ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />} Submit application
          </button>
          <button type="button" className="text-xs font-bold text-slate-400 hover:text-slate-200" onClick={() => { setStep('lookup'); setEvent(null); setFeedback(''); }}>
            Use a different code
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={lookup} className={`${panel} space-y-4 p-5`} aria-label="Find event by code">
      <div className="space-y-1">
        <label className={label}>Registration code</label>
        <input
          className={`${inputClass} font-display text-lg tracking-[0.2em]`}
          required
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="ABCD1234"
          autoCapitalize="characters"
          spellCheck={false}
        />
        <p className="text-xs text-slate-400">Enter the code the league shared with you.</p>
      </div>
      {feedback && <p className="text-sm text-amber-300" role="alert">{feedback}</p>}
      <button type="submit" disabled={status === 'working'} className={primaryBtn}>
        {status === 'working' ? <Loader2 size={16} className="animate-spin" /> : <Search size={14} />} Find event <ArrowRight size={14} />
      </button>
    </form>
  );
};

// Built once so a preview submission persists into the owner's Events tab.
let previewRegisterRuntimeSingleton: ReturnType<typeof createPreviewLeagueRuntime> | null = null;

const EventRegistrationView = () => {
  const runtime = useCloudRuntime();

  let league: CloudLeagueRepository | null = null;
  if (runtime.phase6.leaguePreviewEnabled) {
    if (!previewRegisterRuntimeSingleton) previewRegisterRuntimeSingleton = createPreviewLeagueRuntime(runtime.phase6);
    league = previewRegisterRuntimeSingleton.dataAccess.league;
  } else if (runtime.enabled) {
    league = runtime.dataAccess.league;
  }

  return (
    <div className="min-h-screen bg-[#020713] text-slate-100" style={DARK_GLASS_THEME_STYLE}>
      <div className="mx-auto max-w-lg px-4 py-10">
        <header className="mb-6">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-300">Dumala League</p>
          <h1 className="mt-1 font-display text-2xl font-black leading-tight">Register your club</h1>
          <p className="mt-1 text-sm text-slate-400">
            Apply to a league event using the registration code you were given. No account needed.
          </p>
        </header>

        {league ? (
          <RegistrationForm league={league} />
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
