import React, { type CSSProperties, useState } from 'react';
import { ArrowRight, CheckCircle, Cloud, Flag, MapPin, User } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { CloudRuntime } from '../cloud/runtime';
import type { CloudAuthController } from '../hooks/useCloudAuth';
import { StaffMember, TeamInfo } from '../types';
import CloudAccountGate from './CloudAccountGate';
import { Button } from './ui/button';
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

interface OnboardingViewProps {
  onComplete: (team: TeamInfo, headCoach: StaffMember) => void;
  cloudRuntime: CloudRuntime;
  cloudAuthController?: CloudAuthController;
}

export function OnboardingCloudAccountEntry({
  runtime,
  authController
}: {
  runtime: CloudRuntime;
  authController?: CloudAuthController;
}) {
  return (
    <section aria-labelledby="onboarding-cloud-account-title" className="rounded-2xl border border-cyan-300/10 bg-white/[0.022] p-3 shadow-lg shadow-black/15">
      <div className="grid gap-3 md:grid-cols-[minmax(0,0.9fr)_minmax(16rem,0.92fr)] md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-cyan-300/15 bg-cyan-300/[0.06] text-cyan-200">
              <Cloud size={13} aria-hidden="true" />
            </span>
            <h2 id="onboarding-cloud-account-title" className="text-sm font-black text-slate-100">
              Start with Dumala Cloud
            </h2>
          </div>
          <p className="mt-2 max-w-sm text-[11px] leading-5 text-slate-400">
            Google is the fastest way to create or access your private coach account. You can still continue locally below.
          </p>
        </div>
        {runtime.enabled ? (
          <CloudAccountGate
            appVersion="0.0.0"
            bootstrapAccount={false}
            tone="dark"
            runtime={runtime}
            authController={authController}
          />
        ) : (
          <div role="status" className="rounded-md border border-amber-300/15 bg-amber-300/[0.055] px-2.5 py-1.5 text-[9.5px] font-semibold leading-4 text-amber-100/80">
            Cloud registration is unavailable in this build. Local workspace setup remains available.
          </div>
        )}
      </div>
    </section>
  );
}

function InteractiveOnboardingBackdrop({ pointer }: { pointer: { x: number; y: number } }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden"
      style={{
        '--pointer-x': `${pointer.x}%`,
        '--pointer-y': `${pointer.y}%`
      } as CSSProperties}
    >
      <div className="absolute inset-0 bg-[#020713]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--pointer-x)_var(--pointer-y),rgba(34,211,238,0.24),transparent_26rem),radial-gradient(circle_at_18%_18%,rgba(249,115,22,0.22),transparent_23rem),linear-gradient(135deg,#020713_0%,#051325_48%,#041511_100%)] transition-[background] duration-300" />
      <div className="absolute left-1/2 top-1/2 h-[78vmin] w-[78vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10 bg-[conic-gradient(from_160deg,transparent,rgba(56,189,248,0.18),transparent,rgba(249,115,22,0.18),transparent)] opacity-70 blur-[1px]" />
      <div className="absolute inset-x-[-10%] bottom-[-28%] h-[58%] rotate-[-4deg] border-t border-emerald-300/20 bg-[linear-gradient(rgba(34,197,94,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.12)_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] [transform-origin:center]" />
      <div className="absolute left-[calc(var(--pointer-x)-9rem)] top-[calc(var(--pointer-y)-9rem)] h-72 w-72 rounded-full border border-cyan-200/15 bg-cyan-300/10 blur-2xl transition-all duration-300" />
      <div className="absolute right-6 top-8 hidden h-52 w-52 rounded-full border border-orange-300/10 lg:block" />
      <div className="absolute bottom-8 left-8 hidden h-36 w-36 rounded-full border border-emerald-300/10 lg:block" />
    </div>
  );
}

export default function OnboardingView({ onComplete, cloudRuntime, cloudAuthController }: OnboardingViewProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [pointer, setPointer] = useState({ x: 58, y: 42 });

  const [teamName, setTeamName] = useState('');
  const [stadium, setStadium] = useState('');
  const [league, setLeague] = useState('');
  const [founded, setFounded] = useState(new Date().getFullYear().toString());

  const [mgrName, setMgrName] = useState('');
  const [mgrPosition, setMgrPosition] = useState('Manager / Coach');
  const [mgrBio, setMgrBio] = useState('');
  const [mgrPhoto, setMgrPhoto] = useState('');

  const handleNext = () => setStep(2);

  const generateTeam = () => {
    if (!teamName || !mgrName) return;

    const tInf: TeamInfo = {
      name: teamName,
      founded: founded || new Date().getFullYear().toString(),
      stadium: stadium || 'Home Ground',
      coach: mgrName,
      league: league || 'Friendly Division',
      logoColor: 'from-blue-600 to-indigo-800'
    };

    const headCoach: StaffMember = {
      id: crypto.randomUUID(),
      name: mgrName,
      role: mgrPosition,
      photoUrl: mgrPhoto || 'https://images.unsplash.com/photo-1544717297-ea0e52a269c7?w=150&auto=format&fit=crop&q=80',
      bio: mgrBio || 'Team Manager & Core Organizer.',
      status: 'Active'
    };

    onComplete(tInf, headCoach);
  };

  return (
    <div
      className="relative h-dvh overflow-hidden bg-[#020713] font-sans text-slate-100 selection:bg-orange-400/30"
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        setPointer({
          x: ((event.clientX - bounds.left) / bounds.width) * 100,
          y: ((event.clientY - bounds.top) / bounds.height) * 100
        });
      }}
      onPointerLeave={() => setPointer({ x: 58, y: 42 })}
    >
      <InteractiveOnboardingBackdrop pointer={pointer} />
      <main className="relative z-10 flex h-full min-h-0 items-center justify-center p-3 sm:p-4 lg:p-6">
        <section className="flex min-h-0 w-full max-w-3xl items-center justify-center">
          <div className="flex max-h-full w-full flex-col overflow-hidden rounded-[1.85rem] border border-white/10 bg-[#07111f]/90 p-5 shadow-2xl shadow-black/45 backdrop-blur-xl sm:p-6">
            <div className="mb-5 text-center">
              <img
                src="/Dumala_logo.png"
                alt="Dumala"
                className="mx-auto h-[8.1rem] w-[12.15rem] object-contain sm:h-[9.45rem] sm:w-[14.85rem]"
              />
              <p className="mt-[-0.2rem] text-[10px] font-black uppercase tracking-normal text-orange-300">
                Football management system
              </p>
              <h1 className="mt-2 font-display text-2xl font-black leading-[1.06] text-white sm:text-3xl">
                Coach smarter.<br className="sm:hidden" /> Manage better.
              </h1>
              <p className="mx-auto mt-3 max-w-lg text-xs leading-5 text-slate-300 sm:text-sm">
                All-in-one football management platform built for modern coaches and winning teams.
              </p>
            </div>

            <div className="mx-auto w-full max-w-[40rem]">
              <OnboardingCloudAccountEntry runtime={cloudRuntime} authController={cloudAuthController} />
            </div>

            <ol className="mt-4 flex items-center justify-center gap-2 text-[11px]" aria-label="Onboarding progress">
              <li className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${step === 1 ? 'bg-orange-300/10 text-orange-200' : 'text-slate-500'}`}>
                <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${step === 1 ? 'bg-orange-300 text-slate-950' : 'bg-slate-800/70 text-slate-500'}`}>1</span>
                Club
              </li>
              <span className="h-px w-8 bg-white/10" aria-hidden="true" />
              <li className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${step === 2 ? 'bg-orange-300/10 text-orange-200' : 'text-slate-500'}`}>
                <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${step === 2 ? 'bg-orange-300 text-slate-950' : 'bg-slate-800/70 text-slate-500'}`}>2</span>
                Coach
              </li>
            </ol>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="mt-5 min-h-0"
                >
                  <div className="mx-auto mb-5 w-full max-w-2xl text-left">
                    <div>
                      <h2 className="font-display text-base font-black text-white">Your club identity</h2>
                      <p className="text-[10px] text-slate-500">Start with the details supporters and players recognize.</p>
                    </div>
                  </div>

                  <div className="mx-auto grid w-full max-w-2xl gap-4 sm:grid-cols-[minmax(0,1.12fr)_10rem]">
                    <div>
                      <Label className={ONBOARDING_LABEL_CLASS}>Official team name <span className="text-orange-300">*</span></Label>
                      <Input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="e.g. Barbados FC"
                        className={`${ONBOARDING_INPUT_CLASS} font-semibold placeholder:font-normal`}
                      />
                    </div>

                    <div>
                      <Label className={ONBOARDING_LABEL_CLASS}>Founded</Label>
                      <Input
                        type="number"
                        value={founded}
                        onChange={(e) => setFounded(e.target.value)}
                        className={`${ONBOARDING_INPUT_CLASS} w-full font-mono`}
                      />
                    </div>

                    <div>
                        <Label className={`${ONBOARDING_LABEL_CLASS} flex items-center gap-1`}><MapPin size={11} /> Home ground</Label>
                        <Input
                          type="text"
                          value={stadium}
                          onChange={(e) => setStadium(e.target.value)}
                          placeholder="Centermall Grounds"
                          className={`${ONBOARDING_INPUT_CLASS} text-xs sm:text-sm`}
                        />
                    </div>
                    <div>
                        <Label className={`${ONBOARDING_LABEL_CLASS} flex items-center gap-1`}><Flag size={11} /> League / division</Label>
                        <Input
                          type="text"
                          value={league}
                          onChange={(e) => setLeague(e.target.value)}
                          placeholder="Regional Premier"
                          className={`${ONBOARDING_INPUT_CLASS} text-xs sm:text-sm`}
                        />
                    </div>
                  </div>

                  <div className="mx-auto mt-6 flex w-full max-w-2xl justify-end border-t border-white/[0.07] pt-4">
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={!teamName.trim()}
                      size="lg"
                      className="h-10 rounded-xl bg-orange-400 px-4 text-sm font-black text-slate-950 shadow-lg shadow-orange-500/20 hover:bg-orange-300 active:scale-[0.98]"
                    >
                      Confirm Identity <ArrowRight size={16} />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="mt-5 min-h-0"
                >
                  <div className="mb-5 flex items-center justify-center gap-2 text-center">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08]">
                      <User size={16} className="text-cyan-200" />
                    </span>
                    <div>
                      <h2 className="font-display text-base font-black text-white">Your touchline profile</h2>
                      <p className="text-[10px] text-slate-500">You will be the first member of the staff directory.</p>
                    </div>
                  </div>

                  <div className="mx-auto w-full max-w-2xl space-y-4">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                      <div className="relative shrink-0">
                        <img
                          src={mgrPhoto || 'https://images.unsplash.com/photo-1544717297-ea0e52a269c7?w=150&auto=format&fit=crop&q=80'}
                          alt="Profile Preview"
                          className="h-12 w-12 rounded-full border-2 border-cyan-300/40 object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className={ONBOARDING_LABEL_CLASS}>Profile photo</Label>
                        <Input
                          id="onboarding-mgr-photo"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  setMgrPhoto(reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          onClick={() => document.getElementById('onboarding-mgr-photo')?.click()}
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg border-white/10 bg-white/[0.055] px-3 text-[11px] text-slate-200 hover:bg-white/10 hover:text-white"
                        >
                          Choose picture
                        </Button>
                        <p className="mt-1 text-[9px] text-slate-500">PNG or JPG, up to 5MB</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className={ONBOARDING_LABEL_CLASS}>Full name <span className="text-orange-300">*</span></Label>
                        <Input
                          type="text"
                          value={mgrName}
                          onChange={(e) => setMgrName(e.target.value)}
                          placeholder="e.g. Alex Sterling"
                          className={`${ONBOARDING_INPUT_CLASS} text-xs font-semibold placeholder:font-normal sm:text-sm`}
                        />
                      </div>
                      <div>
                        <Label className={ONBOARDING_LABEL_CLASS}>Primary role</Label>
                        <Select
                          value={mgrPosition}
                          onValueChange={setMgrPosition}
                        >
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
                      <Textarea
                        value={mgrBio}
                        onChange={(e) => setMgrBio(e.target.value)}
                        placeholder="Tactical philosophy or your playing background..."
                        rows={2}
                        className="min-h-16 resize-none rounded-xl border-white/10 bg-white/[0.055] px-3 py-2 text-slate-100 shadow-sm placeholder:text-slate-500 focus-visible:border-orange-300/70 focus-visible:ring-orange-300/15"
                      />
                    </div>
                  </div>

                  <div className="mx-auto mt-6 flex w-full max-w-2xl items-center justify-between border-t border-white/[0.07] pt-4">
                    <Button
                      type="button"
                      onClick={() => setStep(1)}
                      variant="ghost"
                      className="h-10 px-3 text-xs text-slate-400 hover:bg-white/5 hover:text-white"
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={generateTeam}
                      disabled={!mgrName.trim()}
                      size="lg"
                      className="h-10 rounded-xl bg-orange-400 px-4 text-sm font-black text-slate-950 shadow-lg shadow-orange-500/20 hover:bg-orange-300 active:scale-[0.98]"
                    >
                      Enter Workspace <CheckCircle size={16} />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>
    </div>
  );
}
