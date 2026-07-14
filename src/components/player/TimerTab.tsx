import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Flag,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Save,
  Volume2,
  VolumeX
} from 'lucide-react';
import type { CloudRuntime } from '../../cloud/runtime';
import { apexCard, apexCta, apexInput, apexMono, apexMonoTight, apexSheet } from './playerTheme';

export interface TimerPreset {
  label: string;
  seconds: number;
}

type TimerMode = 'stopwatch' | 'countdown' | 'interval';
type TimerSound = 'off' | 'beep' | 'bell';

interface TimerTabProps {
  runtime: Extract<CloudRuntime, { enabled: true }>;
  userId: string;
  preset: TimerPreset | null;
  onConsumePreset: () => void;
  onSaved: () => Promise<void> | void;
}

const playTone = (ctx: AudioContext, frequency: number, start: number, duration: number, volume: number) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.03);
};

const cue = (sound: TimerSound) => {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(sound === 'bell' ? [90, 45, 120] : 120);
  if (sound === 'off') return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    if (sound === 'bell') {
      playTone(ctx, 988, now, 0.35, 0.08);
      playTone(ctx, 1320, now + 0.03, 0.45, 0.045);
      playTone(ctx, 660, now + 0.08, 0.5, 0.035);
      window.setTimeout(() => void ctx.close(), 650);
      return;
    }
    playTone(ctx, 880, now, 0.15, 0.08);
    window.setTimeout(() => void ctx.close(), 240);
  } catch {
    /* audio unavailable */
  }
};

const fmt = (ms: number) => {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const modeChip = (active: boolean) =>
  `min-w-0 rounded-lg px-2 py-2.5 font-player-mono text-[9px] font-bold uppercase tracking-[0.12em] transition-colors min-[380px]:text-[10px] ${
    active ? 'bg-[#dce7f8] text-[#0a1526]' : 'text-[#c6c6cd] hover:text-[#d8e3fb]'
  }`;

const controlButton =
  'relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-br from-[#26344c] via-[#18243a] to-[#0c1728] text-[#d8e3fb] shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_14px_34px_-28px_rgba(0,0,0,.9)] transition-all hover:brightness-110 active:scale-95 disabled:opacity-35';

const primaryButton =
  'relative overflow-hidden rounded-xl bg-gradient-to-br from-[#ff8a24] via-[#ff6d00] to-[#b84400] text-white shadow-[0_12px_30px_rgba(255,109,0,0.26),inset_0_1px_0_rgba(255,255,255,.2)] transition-all hover:brightness-110 active:scale-95';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const Stepper = ({
  label,
  value,
  suffix,
  min,
  max,
  step,
  onChange
}: {
  label: string;
  value: number;
  suffix?: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) => (
  <div className={`${apexCard} overflow-hidden bg-[#101b2c]/80 p-3`}>
    <span className={`${apexMonoTight} block text-center text-[#c6c6cd]/70`}>{label}</span>
    <div className="mt-2 text-center">
      <span className="font-player-display text-2xl font-bold leading-none text-[#f2f6ff] tabular-nums">{value}</span>
      {suffix && <span className={`${apexMonoTight} ml-1 text-[#c6c6cd]/50`}>{suffix}</span>}
    </div>
    <div className="mt-3 grid grid-cols-2 gap-2">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(clamp(value - step, min, max))}
        className={`${controlButton} flex h-9 items-center justify-center`}
      >
        <ChevronLeft size={17} />
      </button>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() => onChange(clamp(value + step, min, max))}
        className={`${controlButton} flex h-9 items-center justify-center`}
      >
        <ChevronRight size={17} />
      </button>
    </div>
  </div>
);

const SoundButton = ({
  active,
  label,
  icon: Icon,
  onClick
}: {
  active: boolean;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 font-player-mono text-[10px] font-bold uppercase tracking-wider transition-all ${
      active
        ? 'border-[#dce7f8]/45 bg-[#dce7f8]/15 text-[#f2f6ff]'
        : 'border-white/[0.07] bg-[#111c2d]/80 text-[#c6c6cd]/70 hover:text-[#d8e3fb]'
    }`}
  >
    <Icon size={14} /> {label}
  </button>
);

const TimerTab = ({ runtime, userId, preset, onConsumePreset, onSaved }: TimerTabProps) => {
  const [mode, setMode] = useState<TimerMode>('stopwatch');
  const [running, setRunning] = useState(false);
  const [displayMs, setDisplayMs] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [countdownSec, setCountdownSec] = useState(300);
  const [workSec, setWorkSec] = useState(30);
  const [restSec, setRestSec] = useState(15);
  const [rounds, setRounds] = useState(8);
  const [sound, setSound] = useState<TimerSound>('bell');

  const [phase, setPhase] = useState<'work' | 'rest'>('work');
  const [roundLeft, setRoundLeft] = useState(8);

  const remainingRef = useRef(0);
  const elapsedRef = useRef(0);
  const lastTickRef = useRef(0);
  const phaseRef = useRef<'work' | 'rest'>('work');
  const roundRef = useRef(8);
  const soundRef = useRef<TimerSound>('bell');

  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  const resetState = useCallback(
    (nextMode: TimerMode) => {
      setRunning(false);
      setLaps([]);
      setSaved(false);
      elapsedRef.current = 0;
      setElapsedMs(0);
      if (nextMode === 'countdown') {
        remainingRef.current = countdownSec * 1000;
        setDisplayMs(countdownSec * 1000);
      } else if (nextMode === 'interval') {
        phaseRef.current = 'work';
        setPhase('work');
        roundRef.current = rounds;
        setRoundLeft(rounds);
        remainingRef.current = workSec * 1000;
        setDisplayMs(workSec * 1000);
      } else {
        setDisplayMs(0);
      }
    },
    [countdownSec, workSec, rounds]
  );

  const selectMode = (next: TimerMode) => {
    setMode(next);
    resetState(next);
  };

  const setIntervalConfig = (field: 'work' | 'rest' | 'rounds', value: number) => {
    const nextValue = Math.round(value);
    setSaved(false);
    if (field === 'work') {
      setWorkSec(nextValue);
      if (!running && mode === 'interval' && phaseRef.current === 'work') {
        remainingRef.current = nextValue * 1000;
        setDisplayMs(nextValue * 1000);
      }
      return;
    }
    if (field === 'rest') {
      setRestSec(nextValue);
      if (!running && mode === 'interval' && phaseRef.current === 'rest') {
        remainingRef.current = nextValue * 1000;
        setDisplayMs(nextValue * 1000);
      }
      return;
    }
    setRounds(nextValue);
    if (!running && mode === 'interval') {
      roundRef.current = nextValue;
      setRoundLeft(nextValue);
    }
  };

  useEffect(() => {
    if (!preset) return;
    setMode('countdown');
    setLabel(preset.label);
    setCountdownSec(preset.seconds);
    setRunning(false);
    setSaved(false);
    remainingRef.current = preset.seconds * 1000;
    setDisplayMs(preset.seconds * 1000);
    elapsedRef.current = 0;
    setElapsedMs(0);
    onConsumePreset();
  }, [preset, onConsumePreset]);

  useEffect(() => {
    if (!running) return;
    lastTickRef.current = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const dt = now - lastTickRef.current;
      lastTickRef.current = now;
      elapsedRef.current += dt;
      setElapsedMs(elapsedRef.current);

      if (mode === 'stopwatch') {
        setDisplayMs(elapsedRef.current);
        return;
      }

      remainingRef.current -= dt;
      if (remainingRef.current > 0) {
        setDisplayMs(remainingRef.current);
        return;
      }

      if (mode === 'countdown') {
        cue('bell');
        remainingRef.current = 0;
        setDisplayMs(0);
        setRunning(false);
        return;
      }

      cue(soundRef.current);
      if (phaseRef.current === 'work') {
        phaseRef.current = 'rest';
        setPhase('rest');
        remainingRef.current = restSec * 1000;
        setDisplayMs(restSec * 1000);
      } else {
        roundRef.current -= 1;
        setRoundLeft(roundRef.current);
        if (roundRef.current <= 0) {
          setRunning(false);
          setDisplayMs(0);
          return;
        }
        phaseRef.current = 'work';
        setPhase('work');
        remainingRef.current = workSec * 1000;
        setDisplayMs(workSec * 1000);
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [running, mode, restSec, workSec]);

  const toggle = () => {
    if (!running && mode === 'countdown' && remainingRef.current <= 0) remainingRef.current = countdownSec * 1000;
    if (!running && mode === 'interval' && remainingRef.current <= 0) {
      phaseRef.current = 'work';
      setPhase('work');
      roundRef.current = rounds;
      setRoundLeft(rounds);
      remainingRef.current = workSec * 1000;
      setDisplayMs(workSec * 1000);
    }
    setRunning(v => !v);
  };

  const reset = () => resetState(mode);
  const addLap = () => setLaps(current => [...current, elapsedRef.current]);
  const canSave = elapsedMs > 1000 && !saved;

  const saveWorkout = async () => {
    setSaving(true);
    try {
      await runtime.dataAccess.player.saveWorkoutSession(userId, {
        kind: mode,
        totalSeconds: Math.round(elapsedRef.current / 1000),
        label: label || null,
        rounds: mode === 'interval'
          ? { workSec, restSec, rounds, sound }
          : mode === 'stopwatch'
            ? laps.map(l => Math.round(l / 1000))
            : []
      });
      setSaved(true);
      await onSaved();
    } finally {
      setSaving(false);
    }
  };

  const phaseTotalMs = mode === 'countdown'
    ? countdownSec * 1000
    : mode === 'interval'
      ? (phase === 'work' ? workSec : restSec) * 1000
      : 60_000;
  const ringFraction = mode === 'stopwatch'
    ? (displayMs % 60_000) / 60_000
    : phaseTotalMs > 0
      ? displayMs / phaseTotalMs
      : 0;
  const clampedFraction = Math.min(1, Math.max(0, ringFraction));
  const completedPercent = Math.round((mode === 'stopwatch' ? clampedFraction : 1 - clampedFraction) * 100);
  const remainingPercent = Math.round(clampedFraction * 100);

  const phaseLabel = mode === 'interval'
    ? phase === 'work' ? 'Work Phase' : 'Rest Phase'
    : mode === 'countdown' ? (label || 'Countdown') : 'Stopwatch';
  const restPhase = mode === 'interval' && phase === 'rest';
  const ringColor = restPhase ? '#b9c8de' : '#dce7f8';
  const accentColor = restPhase ? '#9cc8ff' : '#ff9440';
  const activeRound = mode === 'interval' ? Math.min(rounds, rounds - roundLeft + 1) : 0;

  const timerMetrics = useMemo(
    () => [
      { label: mode === 'stopwatch' ? 'Minute' : 'Done', value: `${completedPercent}%` },
      { label: mode === 'interval' ? 'Left' : 'Ready', value: mode === 'interval' ? `${roundLeft}` : running ? 'Live' : 'Set' },
      { label: mode === 'countdown' ? 'Remain' : 'Mode', value: mode === 'countdown' ? `${remainingPercent}%` : mode }
    ],
    [completedPercent, mode, remainingPercent, roundLeft, running]
  );

  return (
    <div className="flex flex-col items-center space-y-6 pb-28">
      <div className={`${apexCard} grid w-full grid-cols-3 gap-1 p-1`}>
        <button type="button" className={modeChip(mode === 'stopwatch')} onClick={() => selectMode('stopwatch')}>Stopwatch</button>
        <button type="button" className={modeChip(mode === 'countdown')} onClick={() => selectMode('countdown')}>Countdown</button>
        <button type="button" className={modeChip(mode === 'interval')} onClick={() => selectMode('interval')}>Intervals</button>
      </div>

      <section className="relative w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#071322] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_24px_60px_-42px_rgba(0,0,0,.9)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(255,148,64,.16),transparent_28%),radial-gradient(circle_at_82%_6%,rgba(220,231,248,.14),transparent_26%),linear-gradient(180deg,rgba(31,42,60,.72),rgba(4,14,31,.92))]" />
        <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex w-fit items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-[#0a1526]/70 px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">
            <span className={`h-1.5 w-1.5 rounded-full ${running ? 'animate-pulse' : ''}`} style={{ backgroundColor: accentColor }} />
            <span className={`${apexMono} text-[#c6c6cd]`}>{phaseLabel}</span>
          </div>
          {mode === 'interval' && (
            <span className={`${apexMonoTight} rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[#d8e3fb]`}>
              Round {activeRound}/{rounds}
            </span>
          )}
        </div>

        <div className="relative mt-5 overflow-hidden rounded-2xl border border-white/[0.07] bg-[linear-gradient(145deg,rgba(17,28,45,.78),rgba(4,14,31,.82))] px-4 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">
          <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:34px_34px]" />
          <div
            className={`pointer-events-none absolute -right-10 -top-14 h-36 w-36 rounded-full border border-white/[0.07] ${running ? 'motion-safe:animate-[spin_12s_linear_infinite]' : ''}`}
            style={{ background: `conic-gradient(from 90deg, transparent 0 62%, ${accentColor} 63% 70%, transparent 71%)` }}
          />
          <div className="relative text-center">
            <span className={`${apexMonoTight} text-[#c6c6cd]/55`}>
              {mode === 'stopwatch' ? 'Elapsed' : 'Remaining'}
            </span>
            <div className="mt-1 font-player-display text-[64px] font-black leading-none text-[#f6f8ff] tabular-nums tracking-normal drop-shadow-[0_10px_26px_rgba(0,0,0,.4)]">
              {fmt(displayMs)}
            </div>
            {running && (
              <div className="mx-auto mt-4 flex h-5 w-fit items-end gap-1.5" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5, 6].map(index => (
                  <span
                    key={index}
                    className="w-1.5 rounded-full"
                    style={{
                      height: `${8 + ((Math.round(displayMs / 180) + index) % 6) * 2}px`,
                      backgroundColor: index % 2 ? ringColor : accentColor,
                      transition: 'height 0.18s linear'
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="relative mt-6 h-3 overflow-hidden rounded-full bg-[#040e1f]/80 ring-1 ring-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#dce7f8] via-[#9fb1d0] to-[#ff9440] transition-[width] duration-200 ease-linear"
              style={{ width: `${completedPercent}%` }}
            />
            <span
              className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-white/60 bg-[#ff9440] shadow-[0_0_18px_rgba(255,148,64,.65)] transition-[left] duration-200 ease-linear ${running ? 'motion-safe:animate-pulse' : ''}`}
              style={{ left: `calc(${completedPercent}% - 0.625rem)` }}
            />
          </div>

          <div className="relative mt-4 grid grid-cols-3 gap-2">
            {timerMetrics.map(metric => (
              <div key={metric.label} className="rounded-lg border border-white/[0.06] bg-[#081425]/70 px-2.5 py-2 text-center">
                <p className={`${apexMonoTight} text-[#c6c6cd]/50`}>{metric.label}</p>
                <p className="mt-0.5 truncate font-player-display text-sm font-bold capitalize text-[#d8e3fb]">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid w-full grid-cols-3 gap-4">
        <button type="button" onClick={reset} aria-label="Reset" className={`${controlButton} flex h-16 items-center justify-center`}>
          <RotateCcw size={22} />
        </button>
        <button type="button" onClick={toggle} aria-label={running ? 'Pause' : 'Start'} className={`${primaryButton} flex h-16 items-center justify-center`}>
          {running ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
        </button>
        <button
          type="button"
          onClick={addLap}
          disabled={mode !== 'stopwatch' || !running}
          aria-label="Lap"
          className={`${controlButton} flex h-16 items-center justify-center`}
        >
          <Flag size={22} />
        </button>
      </div>

      {mode === 'countdown' && !running && (
        <div className="grid w-full grid-cols-4 gap-2">
          {[60, 180, 300, 600].map(sec => (
            <button
              key={sec}
              type="button"
              onClick={() => { setCountdownSec(sec); remainingRef.current = sec * 1000; setDisplayMs(sec * 1000); }}
              className={`rounded-xl border px-3 py-3 font-player-mono text-[11px] font-bold uppercase transition-all ${
                countdownSec === sec
                  ? 'border-[#dce7f8]/40 bg-gradient-to-br from-[#dce7f8] to-[#9fb1d0] text-[#0a1526]'
                  : 'border-white/[0.06] bg-gradient-to-br from-[#1f2a3c] to-[#111c2d] text-[#c6c6cd]'
              }`}
            >
              {sec / 60}m
            </button>
          ))}
        </div>
      )}

      {mode === 'interval' && !running && (
        <div className="w-full space-y-3">
          <div className="grid w-full grid-cols-3 gap-3">
            <Stepper label="Work" value={workSec} suffix="s" min={5} max={300} step={5} onChange={value => setIntervalConfig('work', value)} />
            <Stepper label="Rest" value={restSec} suffix="s" min={5} max={180} step={5} onChange={value => setIntervalConfig('rest', value)} />
            <Stepper label="Rounds" value={rounds} min={1} max={30} step={1} onChange={value => setIntervalConfig('rounds', value)} />
          </div>
          <div className={`${apexCard} p-3`}>
            <div className="mb-2 flex items-center justify-between">
              <span className={`${apexMonoTight} text-[#c6c6cd]/70`}>Interval sound</span>
              <button type="button" onClick={() => cue(sound)} className={`${apexMonoTight} text-[#dce7f8] disabled:opacity-40`} disabled={sound === 'off'}>
                Test
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <SoundButton active={sound === 'off'} label="Off" icon={VolumeX} onClick={() => setSound('off')} />
              <SoundButton active={sound === 'beep'} label="Beep" icon={Volume2} onClick={() => { setSound('beep'); cue('beep'); }} />
              <SoundButton active={sound === 'bell'} label="Bell" icon={Bell} onClick={() => { setSound('bell'); cue('bell'); }} />
            </div>
          </div>
        </div>
      )}

      {mode === 'stopwatch' && laps.length > 0 && (
        <ul className="w-full space-y-1.5">
          {laps.map((lap, i) => (
            <li key={i} className={`${apexSheet} flex items-center justify-between rounded-lg px-4 py-2`}>
              <span className={`${apexMonoTight} text-[#c6c6cd]`}>Lap {i + 1}</span>
              <span className="font-player-mono text-sm font-bold text-[#d8e3fb] tabular-nums">{fmt(lap)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex w-full items-center gap-2">
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Label this workout (optional)"
          className={apexInput}
        />
        <button
          type="button"
          onClick={() => void saveWorkout()}
          disabled={!canSave || saving}
          className={`${apexCta} flex h-11 shrink-0 items-center gap-2 px-4`}
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  );
};

export default TimerTab;
