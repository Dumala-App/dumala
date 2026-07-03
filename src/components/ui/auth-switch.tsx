import React, { FormEvent, useState } from 'react';
import { cn } from '../../lib/utils';

export interface AuthSwitchProps {
  className?: string;
  onOpenApp?: () => void;
}

const fieldClass = 'h-11 w-full rounded-xl border border-white/12 bg-[#04091a]/70 px-3 text-sm font-semibold text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-orange-300/70 focus:ring-2 focus:ring-orange-300/20';

export function AuthSwitch({ className, onOpenApp }: AuthSwitchProps) {
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onOpenApp?.();
    if (!onOpenApp && typeof window !== 'undefined') {
      window.location.hash = '/app';
    }
  };

  return (
    <section
      aria-label="Dumala account access"
      className={cn(
        'relative min-h-[34rem] overflow-hidden rounded-[1.4rem] border border-white/12 bg-[#071026]/88 shadow-2xl shadow-slate-950/35 backdrop-blur-xl',
        className
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          'absolute top-1/2 z-0 h-[62rem] w-[62rem] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#ffb37e_0%,#ff8a3d_32%,rgba(255,138,61,0.18)_58%,transparent_72%)] opacity-90 transition-all duration-700 ease-in-out',
          isSignUp ? 'right-auto left-[48%] translate-x-0' : 'right-[48%]'
        )}
      />

      <div className="absolute inset-0 z-10 grid grid-cols-1 md:grid-cols-2">
        <div className={cn(
          'flex items-center p-6 text-center transition-all duration-500 md:p-10',
          isSignUp ? 'pointer-events-none -translate-x-8 opacity-0 md:-translate-x-16' : 'opacity-100'
        )}>
          <div className="max-w-xs text-white">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-950/70 md:text-white/70">New coach?</p>
            <h3 className="mt-3 font-display text-2xl font-black leading-tight text-slate-950 md:text-white">Build your club workspace first.</h3>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-900/75 md:text-white/78">
              Create your Dumala account, then set up the club identity and offline-ready workspace.
            </p>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className="mt-5 rounded-xl border-2 border-slate-950/35 px-5 py-2.5 text-xs font-black uppercase tracking-wide text-slate-950 transition hover:bg-slate-950/10 md:border-white md:text-white md:hover:bg-white/10"
            >
              Create account
            </button>
          </div>
        </div>

        <div className={cn(
          'flex items-center justify-end p-6 text-center transition-all duration-500 md:p-10',
          isSignUp ? 'opacity-100' : 'pointer-events-none translate-x-8 opacity-0 md:translate-x-16'
        )}>
          <div className="ml-auto max-w-xs text-white">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-950/70 md:text-white/70">Already started?</p>
            <h3 className="mt-3 font-display text-2xl font-black leading-tight text-slate-950 md:text-white">Continue your match week.</h3>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-900/75 md:text-white/78">
              Sign in and reopen your team workspace, reports, tactics, and planning rhythm.
            </p>
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className="mt-5 rounded-xl border-2 border-slate-950/35 px-5 py-2.5 text-xs font-black uppercase tracking-wide text-slate-950 transition hover:bg-slate-950/10 md:border-white md:text-white md:hover:bg-white/10"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-20 grid min-h-[34rem] grid-cols-1 md:grid-cols-2">
        <div className={cn(
          'flex items-center justify-center p-5 transition-all duration-700 md:p-8',
          isSignUp ? 'md:translate-x-0' : 'md:translate-x-full'
        )}>
          <form
            onSubmit={handleSubmit}
            className={cn(
              'grid w-full max-w-sm gap-3 rounded-2xl border border-white/10 bg-[#050b14]/86 p-5 shadow-xl shadow-slate-950/20 transition-opacity duration-300 sm:p-6',
              isSignUp ? 'opacity-100' : 'opacity-0 md:pointer-events-none'
            )}
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">Account setup</p>
              <h2 className="mt-2 font-display text-2xl font-black text-white">Create account</h2>
              <p className="mt-1 text-xs font-medium leading-5 text-slate-400">Use this to start the account-required onboarding flow.</p>
            </div>
            <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Coach name
              <input className={fieldClass} type="text" name="name" placeholder="Alex Sterling" autoComplete="name" />
            </label>
            <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Email
              <input className={fieldClass} type="email" name="email" placeholder="coach@example.com" autoComplete="email" />
            </label>
            <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Password
              <input className={fieldClass} type="password" name="password" placeholder="Minimum 8 characters" autoComplete="new-password" />
            </label>
            <button type="submit" className="mt-1 h-11 rounded-xl bg-gradient-to-b from-[#ff9a52] to-[#ff8a3d] text-sm font-black text-[#180a00] shadow-lg shadow-orange-950/20 transition hover:from-[#ffb06e] hover:to-[#ffa35f]">
              Start onboarding
            </button>
          </form>
        </div>

        <div className={cn(
          'flex items-center justify-center p-5 transition-all duration-700 md:p-8',
          isSignUp ? 'md:-translate-x-full' : 'md:translate-x-0'
        )}>
          <form
            onSubmit={handleSubmit}
            className={cn(
              'grid w-full max-w-sm gap-3 rounded-2xl border border-white/10 bg-[#050b14]/86 p-5 shadow-xl shadow-slate-950/20 transition-opacity duration-300 sm:p-6',
              isSignUp ? 'opacity-0 md:pointer-events-none' : 'opacity-100'
            )}
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">Returning coach</p>
              <h2 className="mt-2 font-display text-2xl font-black text-white">Sign in</h2>
              <p className="mt-1 text-xs font-medium leading-5 text-slate-400">Continue to Dumala and use Google or email sign-in inside the app.</p>
            </div>
            <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Email
              <input className={fieldClass} type="email" name="email" placeholder="coach@example.com" autoComplete="email" />
            </label>
            <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Password
              <input className={fieldClass} type="password" name="password" placeholder="Your password" autoComplete="current-password" />
            </label>
            <button type="submit" className="mt-1 h-11 rounded-xl bg-white text-sm font-black text-slate-950 shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-50">
              Continue to app
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export const Component = AuthSwitch;

export default AuthSwitch;
