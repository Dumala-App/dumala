import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Chrome, Cloud, Flag, KeyRound, Loader2, Mail, MapPin, Sparkles, User, UserPlus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { AccountBootstrapResult } from '../cloud/account';
import type { CloudRuntime } from '../cloud/runtime';
import type { CloudAuthController } from '../hooks/useCloudAuth';
import { MOCK_WORKSPACE_CHOICES } from '../mockWorkspaces';
import type { WorkspaceBackupV4 } from '../persistence/backup';
import { ORANGE_NEW_CLASSES, ORANGE_NEW_GLOW_PROPS } from '../theme/orangeNewTheme';
import { StaffMember, TeamInfo } from '../types';
import {
  bootstrapSignedInCloudAccount,
  hasOnboardingIntent,
  markOnboardingIntent,
  submitCloudAccountEmail,
  submitCloudGoogleSignIn,
  submitCloudPasswordRegistration,
  submitCloudPasswordSignIn
} from './CloudAccountGate';
import { AetherFlowBackdrop } from './ui/aether-flow-hero';
import { Button } from './ui/button';
import { GlowingEffect } from './ui/glowing-effect';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { Textarea } from './ui/textarea';

const ONBOARDING_INPUT_CLASS = 'h-10 rounded-xl border-white/10 bg-white/[0.055] px-3 text-slate-100 shadow-sm shadow-black/20 placeholder:text-slate-500 focus-visible:border-orange-300/70 focus-visible:ring-orange-300/15';
const ONBOARDING_LABEL_CLASS = 'mb-1.5 block text-[10px] font-bold uppercase tracking-normal text-slate-400';
const DEFAULT_COACH_PHOTO = 'https://images.unsplash.com/photo-1544717297-ea0e52a269c7?w=150&auto=format&fit=crop&q=80';

type OnboardingStage = 'auth-intent' | 'club-identity' | 'coach-profile';

interface OnboardingViewProps {
  onComplete: (team: TeamInfo, headCoach: StaffMember) => void;
  cloudRuntime: CloudRuntime;
  cloudAuthController?: CloudAuthController;
  onCloudWorkspaceReady?: (result: AccountBootstrapResult) => void;
  onCloudOnboardingComplete?: (result: AccountBootstrapResult, team: TeamInfo, headCoach: StaffMember, mockBackup?: WorkspaceBackupV4) => void;
  isReturningUser?: boolean;
}

const createId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getSessionCoachName = (authController?: CloudAuthController) => {
  if (authController?.state.status !== 'signedIn') return '';
  return authController.state.session.displayName ?? authController.state.session.email ?? '';
};

const getSessionCoachPhoto = (authController?: CloudAuthController) => {
  if (authController?.state.status !== 'signedIn') return '';
  return authController.state.session.avatarUrl ?? '';
};

function OnboardingAuthEntry({
  runtime,
  authController,
  returning
}: {
  runtime: CloudRuntime;
  authController?: CloudAuthController;
  returning: boolean;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'register' | 'signIn' | 'magicLink'>(returning ? 'signIn' : 'register');
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (!runtime.enabled) {
    return (
      <section aria-labelledby="onboarding-cloud-account-title" className={ORANGE_NEW_CLASSES.glowShellTight}>
        <GlowingEffect {...ORANGE_NEW_GLOW_PROPS.shellTight} />
        <div className={`${ORANGE_NEW_CLASSES.glowCardTight} p-4`}>
          <div className="flex items-start gap-3">
            <Cloud size={18} className="mt-0.5 text-amber-200" aria-hidden="true" />
            <div>
              <h2 id="onboarding-cloud-account-title" className="text-sm font-black text-slate-100">Cloud account required</h2>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Account access is unavailable in this build. Enable Dumala Cloud to create or sign in before setting up a workspace.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!authController || authController.state.status === 'loading') {
    return (
      <section aria-label="Cloud account" className={ORANGE_NEW_CLASSES.glowShellTight}>
        <GlowingEffect {...ORANGE_NEW_GLOW_PROPS.shellTight} />
        <div className={`${ORANGE_NEW_CLASSES.glowCardTight} p-4 text-xs font-semibold text-slate-300`}>
          <span className="inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Checking cloud account</span>
        </div>
      </section>
    );
  }

  if (authController.state.status === 'signedIn') {
    return (
      <section aria-label="Cloud account connected" className={ORANGE_NEW_CLASSES.glowShellTight}>
        <GlowingEffect {...ORANGE_NEW_GLOW_PROPS.shellTight} />
        <div className={`${ORANGE_NEW_CLASSES.glowCardTight} p-4`}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/[0.09] text-emerald-100">
              <CheckCircle size={17} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-black text-slate-100">Account connected</h2>
              <p className="mt-1 text-xs text-slate-400">Create your club identity or start from a sample workspace.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const handleGoogle = async () => {
    setSubmitState('sending');
    setMessage('');
    try {
      await submitCloudGoogleSignIn(authController.signInWithGoogle);
      setSubmitState('sent');
      setMessage('Redirecting to Google. Club setup will continue after sign-in.');
    } catch (error) {
      setSubmitState('error');
      setMessage(error instanceof Error ? error.message : 'Could not start Google sign-in.');
    }
  };

  const handlePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState('sending');
    setMessage('');
    try {
      if (mode === 'register') {
        await submitCloudPasswordRegistration(email, password, authController.signUpWithPassword);
        setMessage('Account created. Confirm your email if required, then sign in to continue.');
      } else {
        await submitCloudPasswordSignIn(email, password, authController.signInWithPassword);
        setMessage('Signed in. Your club setup is ready.');
      }
      setSubmitState('sent');
    } catch (error) {
      setSubmitState('error');
      setMessage(error instanceof Error ? error.message : 'Could not complete account access.');
    }
  };

  const handleMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState('sending');
    setMessage('');
    try {
      await submitCloudAccountEmail(email, authController.requestOtp);
      setSubmitState('sent');
      setMessage('Check your email for the Dumala sign-in link.');
    } catch (error) {
      setSubmitState('error');
      setMessage(error instanceof Error ? error.message : 'Could not send the sign-in link.');
    }
  };

  const helperTone = submitState === 'error' || authController.state.status === 'error' ? 'text-rose-300' : 'text-emerald-200';
  const title = returning ? 'Welcome back' : 'Create your account';

  return (
    <section aria-labelledby="onboarding-cloud-account-title" className={ORANGE_NEW_CLASSES.glowShellTight}>
      <GlowingEffect {...ORANGE_NEW_GLOW_PROPS.shellTight} />
      <div className={`${ORANGE_NEW_CLASSES.glowCardTight} p-4`}>
        <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(17rem,0.95fr)] md:items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-orange-300/15 bg-orange-300/[0.08] text-orange-200">
                {returning ? <KeyRound size={14} aria-hidden="true" /> : <UserPlus size={14} aria-hidden="true" />}
              </span>
              <h2 id="onboarding-cloud-account-title" className="text-base font-black text-slate-100">
                {title}
              </h2>
            </div>
            <p className="mt-2 max-w-sm text-xs leading-5 text-slate-400">
              {returning
                ? 'Continue with your Dumala account to reopen setup or restore your workspace.'
                : 'Start with Google or email. Your workspace details stay available locally for offline use after setup.'}
            </p>
          </div>

          <div className="rounded-xl border border-cyan-300/15 bg-[#050b14]/90 p-3">
            <Button
              type="button"
              onClick={() => void handleGoogle()}
              disabled={submitState === 'sending'}
              className="h-10 w-full gap-2 rounded-lg bg-white text-sm font-black text-slate-950 shadow-lg shadow-cyan-950/20 hover:bg-cyan-50 disabled:bg-slate-600 [&_svg]:size-4"
            >
              {submitState === 'sending' ? <Loader2 size={15} className="animate-spin" /> : <Chrome size={15} />}
              Continue with Google
            </Button>

            <div className="my-3 h-px bg-white/10" />

            {mode === 'magicLink' ? (
              <form onSubmit={handleMagicLink} className="grid gap-2">
                <Label htmlFor="onboarding-cloud-email" className="text-[11px] normal-case tracking-normal text-slate-300">Email address</Label>
                <Input id="onboarding-cloud-email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="coach@example.com" className="h-9 rounded-md border-slate-700 bg-[#07111f] px-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:border-cyan-400 focus-visible:ring-cyan-400/20" required />
                <Button type="submit" size="sm" disabled={submitState === 'sending'} className="h-9 gap-1 rounded-md bg-cyan-600 px-2.5 text-xs text-white hover:bg-cyan-500 disabled:bg-slate-500 [&_svg]:size-3.5">
                  {submitState === 'sending' ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
                  Send sign-in link
                </Button>
              </form>
            ) : (
              <form onSubmit={handlePassword} className="grid gap-2">
                <Label htmlFor="onboarding-cloud-email" className="text-[11px] normal-case tracking-normal text-slate-300">Email address</Label>
                <Input id="onboarding-cloud-email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="coach@example.com" className="h-9 rounded-md border-slate-700 bg-[#07111f] px-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:border-cyan-400 focus-visible:ring-cyan-400/20" required />
                <Input id="onboarding-cloud-password" type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Password" minLength={mode === 'register' ? 8 : undefined} className="h-9 rounded-md border-slate-700 bg-[#07111f] px-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:border-cyan-400 focus-visible:ring-cyan-400/20" required />
                <Button type="submit" size="sm" disabled={submitState === 'sending'} className="h-9 gap-1 rounded-md bg-cyan-600 px-2.5 text-xs text-white hover:bg-cyan-500 disabled:bg-slate-500 [&_svg]:size-3.5">
                  {submitState === 'sending' ? <Loader2 size={13} className="animate-spin" /> : mode === 'register' ? <UserPlus size={13} /> : <KeyRound size={13} />}
                  {mode === 'register' ? 'Create account with email' : 'Sign in with email'}
                </Button>
              </form>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 border-t border-white/[0.07] pt-3">
              <button type="button" onClick={() => { setMode('register'); setMessage(''); setSubmitState('idle'); markOnboardingIntent(); }} className={`rounded-md px-2 py-1 text-[11px] font-bold ${mode === 'register' ? 'bg-orange-300/10 text-orange-200' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                Create account
              </button>
              <button type="button" onClick={() => { setMode('signIn'); setMessage(''); setSubmitState('idle'); markOnboardingIntent(); }} className={`rounded-md px-2 py-1 text-[11px] font-bold ${mode === 'signIn' ? 'bg-cyan-300/10 text-cyan-200' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                Sign in
              </button>
              <button type="button" onClick={() => { setMode('magicLink'); setMessage(''); setSubmitState('idle'); markOnboardingIntent(); }} className={`rounded-md px-2 py-1 text-[11px] font-bold ${mode === 'magicLink' ? 'bg-cyan-300/10 text-cyan-200' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                Email link
              </button>
            </div>

            {message && <p className={`mt-2 text-[11px] font-semibold leading-4 ${helperTone}`}>{message}</p>}
            {authController.state.status === 'error' && <p className="mt-2 text-[11px] font-semibold text-rose-300">{authController.state.message}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function OnboardingView({
  onComplete,
  cloudRuntime,
  cloudAuthController,
  onCloudWorkspaceReady: _onCloudWorkspaceReady,
  onCloudOnboardingComplete,
  isReturningUser = false
}: OnboardingViewProps) {
  const signedIn = cloudRuntime.enabled && cloudAuthController?.state.status === 'signedIn';
  const returning = signedIn || isReturningUser || hasOnboardingIntent();
  const initialCoachName = getSessionCoachName(cloudAuthController);
  const initialCoachPhoto = getSessionCoachPhoto(cloudAuthController);
  const [stage, setStage] = useState<OnboardingStage>(() => signedIn ? 'club-identity' : 'auth-intent');

  const [teamName, setTeamName] = useState('');
  const [stadium, setStadium] = useState('');
  const [league, setLeague] = useState('');
  const [founded, setFounded] = useState('');
  const [selectedMockId, setSelectedMockId] = useState(MOCK_WORKSPACE_CHOICES[0]?.id ?? '');

  const [mgrName, setMgrName] = useState(initialCoachName);
  const [mgrPosition, setMgrPosition] = useState('Manager / Coach');
  const [mgrBio, setMgrBio] = useState('');
  const [mgrPhoto, setMgrPhoto] = useState(initialCoachPhoto);
  const [completionState, setCompletionState] = useState<'idle' | 'saving' | 'error'>('idle');
  const [completionMessage, setCompletionMessage] = useState('');

  useEffect(() => {
    if (signedIn && stage === 'auth-intent') setStage('club-identity');
  }, [signedIn, stage]);

  const selectedMock = useMemo(
    () => MOCK_WORKSPACE_CHOICES.find(choice => choice.id === selectedMockId) ?? null,
    [selectedMockId]
  );

  const buildTeam = (source?: TeamInfo): TeamInfo => {
    const coachName = source?.coach
      ?? mgrName.trim()
      ?? initialCoachName
      ?? getSessionCoachName(cloudAuthController)
      ?? 'Team Coach';

    return {
      name: (source?.name ?? teamName).trim(),
      founded: source?.founded ?? (founded.trim() || new Date().getFullYear().toString()),
      stadium: source?.stadium ?? (stadium.trim() || 'Home Ground'),
      coach: coachName,
      league: source?.league ?? (league.trim() || 'Friendly Division'),
      logoColor: source?.logoColor ?? 'from-blue-600 to-indigo-800',
      logoUrl: source?.logoUrl
    };
  };

  const buildHeadCoach = (team: TeamInfo): StaffMember => ({
    id: createId('staff'),
    name: mgrName.trim() || initialCoachName || team.coach || 'Team Coach',
    role: mgrPosition,
    photoUrl: mgrPhoto || DEFAULT_COACH_PHOTO,
    bio: mgrBio.trim() || 'Team Manager & Core Organizer.',
    status: 'Active'
  });

  const finishOnboarding = async (team: TeamInfo, headCoach: StaffMember, mockBackup?: WorkspaceBackupV4) => {
    markOnboardingIntent();
    setCompletionState('saving');
    setCompletionMessage('');

    try {
      if (!cloudRuntime.enabled || cloudAuthController?.state.status !== 'signedIn') {
        throw new Error('Sign in to your Dumala account before creating a workspace.');
      }

      const result = await bootstrapSignedInCloudAccount(cloudRuntime, cloudAuthController.state, team.name, '0.0.0');
      if (onCloudOnboardingComplete) {
        onCloudOnboardingComplete(result, team, headCoach, mockBackup);
      } else {
        onComplete(team, headCoach);
      }
      setCompletionState('idle');
    } catch (error) {
      setCompletionState('error');
      setCompletionMessage(error instanceof Error ? error.message : 'Could not finish onboarding.');
    }
  };

  const handleOwnClubNext = () => {
    if (!teamName.trim()) return;
    setStage('coach-profile');
  };

  const handleMockComplete = () => {
    if (!selectedMock) return;
    const team = buildTeam(selectedMock.backup.core.teamInfo);
    const firstStaff = selectedMock.backup.core.staff[0];
    const coach: StaffMember = firstStaff ?? buildHeadCoach(team);
    void finishOnboarding(team, coach, selectedMock.backup);
  };

  const handleProfileComplete = () => {
    if (!teamName.trim()) return;
    const team = buildTeam();
    void finishOnboarding(team, buildHeadCoach(team));
  };

  return (
    <div className={`h-dvh ${ORANGE_NEW_CLASSES.accessShell}`}>
      <AetherFlowBackdrop className="absolute inset-0 z-0" />
      <a
        href="#landing"
        className="fixed left-4 top-4 z-40 rounded-lg border border-white/10 bg-white/[0.07] px-3 py-2 text-xs font-bold text-slate-200 shadow-lg shadow-black/20 backdrop-blur-md transition hover:bg-white/[0.12] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/40"
      >
        View coach pitch
      </a>
      <main className="relative z-10 flex h-full min-h-0 items-center justify-center p-3 sm:p-4 lg:p-6">
        <section className="flex min-h-0 w-full max-w-3xl items-center justify-center">
          <div className={`max-h-full w-full ${ORANGE_NEW_CLASSES.glowShell}`}>
            <GlowingEffect {...ORANGE_NEW_GLOW_PROPS.shell} />
            <div className="relative z-10 flex max-h-full w-full flex-col overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#07111f]/90 p-5 shadow-2xl shadow-black/45 backdrop-blur-xl sm:p-6">
              <div className="mb-5 text-center">
                <img src="/Dumala_logo.png" alt="Dumala" className="mx-auto h-[8.1rem] w-[12.15rem] object-contain sm:h-[9.45rem] sm:w-[14.85rem]" />
                <p className="mt-[-0.2rem] text-[10px] font-black uppercase tracking-normal text-orange-300">Football management system</p>
                <h1 className="mt-2 font-display text-2xl font-black leading-[1.06] text-white sm:text-3xl">
                  Coach smarter.<br className="sm:hidden" /> Manage better.
                </h1>
                <p className="mx-auto mt-3 max-w-lg text-xs leading-5 text-slate-300 sm:text-sm">
                  Create your account first, then set up a club workspace that stays useful online or offline.
                </p>
              </div>

              {stage !== 'auth-intent' && (
                <ol className="mb-4 flex items-center justify-center gap-2 text-[11px]" aria-label="Onboarding progress">
                  <li className="inline-flex items-center gap-1.5 rounded-full bg-emerald-300/10 px-2.5 py-1 font-semibold text-emerald-200">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-300 text-[9px] text-slate-950">1</span>
                    Account
                  </li>
                  <span className="h-px w-8 bg-white/10" aria-hidden="true" />
                  <li className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${stage === 'club-identity' ? 'bg-orange-300/10 text-orange-200' : 'text-slate-500'}`}>
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${stage === 'club-identity' ? 'bg-orange-300 text-slate-950' : 'bg-slate-800/70 text-slate-500'}`}>2</span>
                    Club
                  </li>
                  <span className="h-px w-8 bg-white/10" aria-hidden="true" />
                  <li className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${stage === 'coach-profile' ? 'bg-cyan-300/10 text-cyan-200' : 'text-slate-500'}`}>
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${stage === 'coach-profile' ? 'bg-cyan-300 text-slate-950' : 'bg-slate-800/70 text-slate-500'}`}>3</span>
                    Coach
                  </li>
                </ol>
              )}

              <AnimatePresence mode="wait">
                {stage === 'auth-intent' && (
                  <motion.div key="auth" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="mx-auto w-full max-w-[40rem]">
                    <OnboardingAuthEntry runtime={cloudRuntime} authController={cloudAuthController} returning={returning} />
                  </motion.div>
                )}

                {stage === 'club-identity' && (
                  <motion.div key="club" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="min-h-0">
                    <div className="mx-auto mb-5 w-full max-w-2xl text-left">
                      <h2 className="font-display text-base font-black text-white">Your club identity</h2>
                      <p className="text-[10px] text-slate-500">Start with your own club details or try a bundled mock team.</p>
                    </div>

                    <div className="mx-auto grid w-full max-w-2xl gap-4 sm:grid-cols-[minmax(0,1.12fr)_10rem]">
                      <div>
                        <Label className={ONBOARDING_LABEL_CLASS}>Official team name <span className="text-orange-300">*</span></Label>
                        <Input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Portuseros FC" className={`${ONBOARDING_INPUT_CLASS} font-semibold placeholder:font-normal`} />
                      </div>
                      <div>
                        <Label className={ONBOARDING_LABEL_CLASS}>Founded</Label>
                        <Input type="number" value={founded} onChange={(e) => setFounded(e.target.value)} placeholder="2012" className={`${ONBOARDING_INPUT_CLASS} w-full font-mono`} />
                      </div>
                      <div>
                        <Label className={`${ONBOARDING_LABEL_CLASS} flex items-center gap-1`}><MapPin size={11} /> Home ground</Label>
                        <Input type="text" value={stadium} onChange={(e) => setStadium(e.target.value)} placeholder="Centermall Grounds" className={`${ONBOARDING_INPUT_CLASS} text-xs sm:text-sm`} />
                      </div>
                      <div>
                        <Label className={`${ONBOARDING_LABEL_CLASS} flex items-center gap-1`}><Flag size={11} /> League / division</Label>
                        <Input type="text" value={league} onChange={(e) => setLeague(e.target.value)} placeholder="League 1" className={`${ONBOARDING_INPUT_CLASS} text-xs sm:text-sm`} />
                      </div>
                    </div>

                    <div className="mx-auto mt-4 w-full max-w-2xl rounded-xl border border-cyan-300/15 bg-[#0b1726] p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-orange-200">Try a sample team</p>
                          <p className="text-xs text-slate-400">Use a mock workspace from the bundled folder.</p>
                        </div>
                        <Sparkles size={18} className="text-orange-300" aria-hidden="true" />
                      </div>
                      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                        <Select value={selectedMockId} onValueChange={setSelectedMockId} disabled={MOCK_WORKSPACE_CHOICES.length === 0}>
                          <SelectTrigger className="h-10 rounded-xl border-white/10 bg-white/[0.055] px-3 text-slate-100 shadow-sm focus:ring-orange-300/15" aria-label="Sample team">
                            <SelectValue placeholder="Select a sample team" />
                          </SelectTrigger>
                          <SelectContent className="border-slate-700 bg-[#081421] text-slate-100">
                            {MOCK_WORKSPACE_CHOICES.map(choice => (
                              <SelectItem key={choice.id} value={choice.id}>{choice.label} - {choice.detail}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" onClick={handleMockComplete} disabled={!selectedMockId || completionState === 'saving'} className={ORANGE_NEW_CLASSES.ctaPrimaryButton}>
                          {completionState === 'saving' ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                          Use sample team
                        </Button>
                      </div>
                    </div>

                    <div className="mx-auto mt-6 flex w-full max-w-2xl justify-end border-t border-white/[0.07] pt-4">
                      <Button type="button" onClick={handleOwnClubNext} disabled={!teamName.trim()} size="lg" className={ORANGE_NEW_CLASSES.ctaPrimaryButton}>
                        Continue to coach profile <ArrowRight size={16} />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {stage === 'coach-profile' && (
                  <motion.div key="coach" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="min-h-0">
                    <div className="mb-5 flex items-center justify-center gap-2 text-center">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08]">
                        <User size={16} className="text-cyan-200" />
                      </span>
                      <div>
                        <h2 className="font-display text-base font-black text-white">Your touchline profile</h2>
                        <p className="text-[10px] text-slate-500">Prefilled from your account when available. You can skip this for now.</p>
                      </div>
                    </div>

                    <div className="mx-auto w-full max-w-2xl space-y-4">
                      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                        <img src={mgrPhoto || DEFAULT_COACH_PHOTO} alt="Profile Preview" className="h-12 w-12 shrink-0 rounded-full border-2 border-cyan-300/40 object-cover" />
                        <div className="flex-1">
                          <Label className={ONBOARDING_LABEL_CLASS}>Profile photo</Label>
                          <Input id="onboarding-mgr-photo" type="file" accept="image/*" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') setMgrPhoto(reader.result);
                            };
                            reader.readAsDataURL(file);
                          }} className="hidden" />
                          <Button type="button" onClick={() => document.getElementById('onboarding-mgr-photo')?.click()} variant="outline" size="sm" className="h-8 rounded-lg border-white/10 bg-white/[0.055] px-3 text-[11px] text-slate-200 hover:bg-white/10 hover:text-white">
                            Choose picture
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label className={ONBOARDING_LABEL_CLASS}>Full name</Label>
                          <Input type="text" value={mgrName} onChange={(e) => setMgrName(e.target.value)} placeholder="e.g. Alex Sterling" className={`${ONBOARDING_INPUT_CLASS} text-xs font-semibold placeholder:font-normal sm:text-sm`} />
                        </div>
                        <div>
                          <Label className={ONBOARDING_LABEL_CLASS}>Primary role</Label>
                          <Select value={mgrPosition} onValueChange={setMgrPosition}>
                            <SelectTrigger className="h-10 rounded-xl border-white/10 bg-white/[0.055] px-3 text-slate-100 shadow-sm focus:ring-orange-300/15">
                              <SelectValue placeholder="Choose role" />
                            </SelectTrigger>
                            <SelectContent className="border-slate-700 bg-[#081421] text-slate-100">
                              <SelectItem value="Manager / Coach">Manager / Coach</SelectItem>
                              <SelectItem value="Head Coach">Head Coach</SelectItem>
                              <SelectItem value="Assistant Coach">Assistant Coach</SelectItem>
                              <SelectItem value="Manager">Manager</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className={ONBOARDING_LABEL_CLASS}>Brief bio / playing style</Label>
                        <Textarea value={mgrBio} onChange={(e) => setMgrBio(e.target.value)} placeholder="Tactical philosophy or your playing background..." rows={2} className="min-h-16 resize-none rounded-xl border-white/10 bg-white/[0.055] px-3 py-2 text-slate-100 shadow-sm placeholder:text-slate-500 focus-visible:border-orange-300/70 focus-visible:ring-orange-300/15" />
                      </div>
                    </div>

                    {completionMessage && <p className="mx-auto mt-3 max-w-2xl text-xs font-semibold text-rose-300">{completionMessage}</p>}

                    <div className="mx-auto mt-6 flex w-full max-w-2xl items-center justify-between border-t border-white/[0.07] pt-4">
                      <Button type="button" onClick={() => setStage('club-identity')} variant="ghost" className="h-10 px-3 text-xs text-slate-400 hover:bg-white/5 hover:text-white">
                        <ArrowLeft size={14} /> Back
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button type="button" onClick={handleProfileComplete} disabled={completionState === 'saving'} variant="ghost" className="h-10 px-3 text-xs text-slate-400 hover:bg-white/5 hover:text-white">
                          Skip for now
                        </Button>
                        <Button type="button" onClick={handleProfileComplete} disabled={completionState === 'saving'} size="lg" className={ORANGE_NEW_CLASSES.ctaPrimaryButton}>
                          {completionState === 'saving' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                          Enter Workspace
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {stage === 'club-identity' && completionMessage && <p className="mx-auto mt-3 max-w-2xl text-xs font-semibold text-rose-300">{completionMessage}</p>}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
