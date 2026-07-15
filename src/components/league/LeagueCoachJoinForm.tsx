import React, { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2, Search, Send, ShieldCheck, UserCheck } from 'lucide-react';
import { useCloudRuntime } from '../../hooks/useCloudRuntime';
import { useCloudAuth } from '../../hooks/useCloudAuth';
import type { CloudLeagueRepository } from '../../cloud/dataAccess';
import type { LeagueCoachInviteLookup } from '../../cloud/league';
import { DARK_GLASS_CLASSES, DARK_GLASS_THEME_STYLE } from '../../theme/darkGlassTheme';
import { createPreviewLeagueRuntime } from './demoLeagueData';
import { CloudAccountGate } from '../CloudAccountGate';

// Public coach-side join page (#/join-league). A coach opens the link a league
// owner shared, enters the invite code, and applies to be affiliated under the
// organization. Applying needs a signed-in coach account (the RPC is auth-gated),
// so real mode shows the account gate first; preview mode runs on demo data with
// no login and shares the owner's in-memory store, so the loop is reviewable end
// to end (an application here appears in the owner's Coaches tab).

const label = 'block text-[11px] font-black uppercase tracking-wide text-cyan-100/65';
const inputClass = DARK_GLASS_CLASSES.input;
const primaryBtn = `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold ${DARK_GLASS_CLASSES.reviewButton}`;
const panel = DARK_GLASS_CLASSES.panel;

const friendlyError = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('ALREADY_APPLIED')) return 'You have already applied to this organization.';
  if (message.includes('INVALID_INVITE_CODE')) return 'That invite code was not found.';
  if (message.includes('OWNER_CANNOT_JOIN')) return "You own this league, so you can't join it as a coach.";
  if (message.includes('COACH_ACCOUNT_REQUIRED')) return 'Only coach accounts can join a league organization.';
  if (message.includes('COACH_NAME_REQUIRED')) return 'Please enter your name.';
  if (message.includes('COACH_EMAIL_INVALID')) return 'Please enter a valid email.';
  if (message.includes('AUTH_REQUIRED')) return 'Please sign in to your coach account to apply.';
  return message || 'Something went wrong. Please try again.';
};

const JoinForm = ({ league, defaultCode }: { league: CloudLeagueRepository; defaultCode?: string }) => {
  const [step, setStep] = useState<'lookup' | 'apply' | 'done'>('lookup');
  const [code, setCode] = useState(defaultCode ?? '');
  const [org, setOrg] = useState<LeagueCoachInviteLookup | null>(null);
  const [status, setStatus] = useState<'idle' | 'working'>('idle');
  const [feedback, setFeedback] = useState('');

  const [coachName, setCoachName] = useState('');
  const [coachEmail, setCoachEmail] = useState('');
  const [message, setMessage] = useState('');

  const lookup = async (event?: FormEvent) => {
    event?.preventDefault();
    setStatus('working');
    setFeedback('');
    try {
      const result = await league.resolveLeagueOrgInvite(code);
      if (!result.found) {
        setFeedback('No organization was found for that code. Double-check it with the league.');
      } else {
        setOrg(result);
        setStep('apply');
      }
    } catch (error) {
      setFeedback(friendlyError(error));
    } finally {
      setStatus('idle');
    }
  };

  // Auto-resolve when a code arrived on the URL (?code=...).
  useEffect(() => {
    if (defaultCode) void lookup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('working');
    setFeedback('');
    try {
      await league.applyToLeagueOrg({ code, coachName, coachEmail, message: message || null });
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
          Thanks — your request to join <span className="font-bold">{org?.leagueName}</span> is in. The league owner will review
          it and confirm your place. You can close this page.
        </p>
      </div>
    );
  }

  if (step === 'apply' && org) {
    return (
      <form onSubmit={submit} className={`${panel} space-y-4 p-5`} aria-label="Join league organization">
        <div className="rounded-2xl border border-cyan-300/10 bg-white/[0.035] p-4">
          <div className="flex items-center gap-2">
            <UserCheck size={16} className="text-orange-300" />
            <span className="font-display text-base font-black text-white">{org.leagueName}</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {[org.location, org.seatsRemaining !== undefined ? `${org.seatsRemaining} ${org.seatsRemaining === 1 ? 'seat' : 'seats'} open` : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {org.open === false && (
            <p className="mt-2 rounded-lg border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-[11px] leading-4 text-amber-100">
              This organization is currently full. You can still apply — the owner will affiliate you once a seat frees up.
            </p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1"><label className={label}>Your name</label><input className={inputClass} required value={coachName} onChange={e => setCoachName(e.target.value)} placeholder="Coach name" autoComplete="name" /></div>
          <div className="space-y-1"><label className={label}>Your email</label><input className={inputClass} type="email" required value={coachEmail} onChange={e => setCoachEmail(e.target.value)} placeholder="coach@example.com" autoComplete="email" /></div>
          <div className="space-y-1 sm:col-span-2"><label className={label}>Message <span className="text-slate-500">(optional)</span></label><textarea className={inputClass} rows={3} maxLength={1000} value={message} onChange={e => setMessage(e.target.value)} placeholder="Tell the league about your team" /></div>
        </div>

        {feedback && <p className="text-sm text-amber-300" role="alert">{feedback}</p>}

        <div className="flex items-center gap-2">
          <button type="submit" disabled={status === 'working'} className={primaryBtn}>
            {status === 'working' ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />} Apply to join
          </button>
          <button type="button" className="text-xs font-bold text-slate-400 hover:text-slate-200" onClick={() => { setStep('lookup'); setOrg(null); setFeedback(''); }}>
            Use a different code
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={lookup} className={`${panel} space-y-4 p-5`} aria-label="Find organization by code">
      <div className="space-y-1">
        <label className={label}>Invite code</label>
        <input
          className={`${inputClass} font-display text-lg tracking-[0.2em]`}
          required
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="ABCD1234"
          autoCapitalize="characters"
          spellCheck={false}
        />
        <p className="text-xs text-slate-400">Enter the code the league owner shared with you.</p>
      </div>
      {feedback && <p className="text-sm text-amber-300" role="alert">{feedback}</p>}
      <button type="submit" disabled={status === 'working'} className={primaryBtn}>
        {status === 'working' ? <Loader2 size={16} className="animate-spin" /> : <Search size={14} />} Find organization <ArrowRight size={14} />
      </button>
    </form>
  );
};

// Built once so a preview application persists into the owner's Coaches tab.
let previewJoinRuntimeSingleton: ReturnType<typeof createPreviewLeagueRuntime> | null = null;

const getUrlCode = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  // The invite link is `${origin}/#/join-league?code=XXX`; the query rides after
  // the hash, so read it from the hash rather than window.location.search.
  const hash = window.location.hash;
  const queryIndex = hash.indexOf('?');
  if (queryIndex === -1) return undefined;
  const code = new URLSearchParams(hash.slice(queryIndex + 1)).get('code');
  return code ? code.toUpperCase() : undefined;
};

const LeagueCoachJoinView = () => {
  const runtime = useCloudRuntime();
  const auth = useCloudAuth({ enabled: runtime.enabled, auth: runtime.dataAccess?.auth ?? null });
  const preview = runtime.phase6.leaguePreviewEnabled;
  const defaultCode = getUrlCode();

  let previewLeague: CloudLeagueRepository | null = null;
  if (preview) {
    if (!previewJoinRuntimeSingleton) previewJoinRuntimeSingleton = createPreviewLeagueRuntime(runtime.phase6);
    previewLeague = previewJoinRuntimeSingleton.dataAccess.league;
  }

  const signedIn = auth.state.status === 'signedIn';

  return (
    <div className="min-h-screen bg-[#020713] text-slate-100" style={DARK_GLASS_THEME_STYLE}>
      <div className="mx-auto max-w-lg px-4 py-10">
        <header className="mb-6">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-300">Dumala League</p>
          <h1 className="mt-1 font-display text-2xl font-black leading-tight">Join a league organization</h1>
          <p className="mt-1 text-sm text-slate-400">
            A league owner invited your coaching team. Enter the invite code to apply and be affiliated under their organization.
          </p>
        </header>

        {preview && previewLeague ? (
          <JoinForm league={previewLeague} defaultCode={defaultCode} />
        ) : !runtime.enabled ? (
          <p className={`${panel} p-6 text-sm text-slate-300`}>
            Joining a league needs a cloud connection. Please open this link on an online device.
          </p>
        ) : signedIn ? (
          <JoinForm league={runtime.dataAccess.league} defaultCode={defaultCode} />
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-2xl border border-cyan-300/15 bg-white/[0.045] px-4 py-3 text-sm leading-6 text-slate-300">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-cyan-200" />
              <span>Sign in to your Dumala coach account — or create one — to apply. New to Dumala? Create a free coach account, then come back to this link.</span>
            </div>
            <CloudAccountGate runtime={runtime} authController={auth} bootstrapAccount={false} tone="dark" audience="coach" />
          </div>
        )}
      </div>
    </div>
  );
};

export default LeagueCoachJoinView;
