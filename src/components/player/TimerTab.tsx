import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Flag, Loader2, Pause, Play, RotateCcw, Save } from 'lucide-react';
import type { CloudRuntime } from '../../cloud/runtime';
import { apexCard, apexCta, apexInput, apexMono, apexMonoTight, apexSheet } from './playerTheme';

export interface TimerPreset {
  label: string;
  seconds: number;
}

type TimerMode = 'stopwatch' | 'countdown' | 'interval';

interface TimerTabProps {
  runtime: Extract<CloudRuntime, { enabled: true }>;
  userId: string;
  preset: TimerPreset | null;
  onConsumePreset: () => void;
  onSaved: () => Promise<void> | void;
}

const cue = () => {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(120);
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    osc.onended = () => ctx.close();
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

const RING_RADIUS = 130;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const modeChip = (active: boolean) =>
  `flex-1 rounded-lg px-3 py-2 font-player-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
    active ? 'bg-[#dce7f8] text-[#0a1526]' : 'text-[#c6c6cd] hover:text-[#d8e3fb]'
  }`;

const TimerTab = ({ runtime, userId, preset, onConsumePreset, onSaved }: TimerTabProps) => {
  const [mode, setMode] = useState<TimerMode>('stopwatch');
  const [running, setRunning] = useState(false);
  const [displayMs, setDisplayMs] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Config
  const [countdownSec, setCountdownSec] = useState(300);
  const [workSec, setWorkSec] = useState(30);
  const [restSec, setRestSec] = useState(15);
  const [rounds, setRounds] = useState(8);

  // Interval runtime state
  const [phase, setPhase] = useState<'work' | 'rest'>('work');
  const [roundLeft, setRoundLeft] = useState(8);

  const remainingRef = useRef(0);
  const elapsedRef = useRef(0);
  const lastTickRef = useRef(0);
  const phaseRef = useRef<'work' | 'rest'>('work');
  const roundRef = useRef(8);

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

  // Apply a drill preset (arrives from the Drills tab).
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
        cue();
        remainingRef.current = 0;
        setDisplayMs(0);
        setRunning(false);
        return;
      }

      // interval boundary
      cue();
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
          ? { workSec, restSec, rounds }
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

  // Ring progress: fraction of the current phase (countdown/interval) or the
  // current rolling minute (stopwatch), so the ring always moves with the work.
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
  const dashOffset = RING_CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, ringFraction)));

  const phaseLabel = mode === 'interval'
    ? phase === 'work' ? 'Work Phase' : 'Rest Phase'
    : mode === 'countdown' ? (label || 'Countdown') : 'Stopwatch';
  const restPhase = mode === 'interval' && phase === 'rest';
  const ringColor = restPhase ? '#b9c8de' : '#dce7f8';

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Mode selector */}
      <div className={`${apexCard} flex w-full gap-1 p-1`}>
        <button type="button" className={modeChip(mode === 'stopwatch')} onClick={() => selectMode('stopwatch')}>Stopwatch</button>
        <button type="button" className={modeChip(mode === 'countdown')} onClick={() => selectMode('countdown')}>Countdown</button>
        <button type="button" className={modeChip(mode === 'interval')} onClick={() => selectMode('interval')}>Intervals</button>
      </div>

      {/* Phase indicator */}
      <div className="text-center">
        <div className="mx-auto mb-3 flex w-fit items-center justify-center gap-2 rounded-full border border-[#45464d]/20 bg-[#1f2a3c] px-4 py-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${running ? 'animate-pulse' : ''}`} style={{ backgroundColor: ringColor }} />
          <span className={`${apexMono} text-[#c6c6cd]`}>{phaseLabel}</span>
        </div>
        {mode === 'interval' && (
          <h2 className="font-player-display text-xl font-semibold text-[#d8e3fb]">
            Round {Math.min(rounds, rounds - roundLeft + 1)} <span className="font-normal text-[#c6c6cd]/40">/ {rounds}</span>
          </h2>
        )}
      </div>

      {/* Circular ring timer */}
      <div className="relative flex h-72 w-72 items-center justify-center">
        <div className="absolute inset-0 scale-[1.05] rounded-full border border-[#45464d]/10" />
        <svg viewBox="0 0 288 288" className="absolute h-full w-full -rotate-90">
          <circle cx="144" cy="144" r={RING_RADIUS} fill="transparent" stroke="rgba(69,70,77,0.3)" strokeWidth="6" />
          <circle
            cx="144"
            cy="144"
            r={RING_RADIUS}
            fill="transparent"
            stroke={ringColor}
            strokeWidth="10"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.2s linear, stroke 0.3s' }}
          />
        </svg>
        <div className="flex h-56 w-56 flex-col items-center justify-center rounded-full border border-[#45464d]/10 bg-[#040e1f]/20 backdrop-blur-sm">
          <span className="font-player-display text-[56px] font-bold leading-none tracking-tighter text-[#d8e3fb] tabular-nums">
            {fmt(displayMs)}
          </span>
          <span className={`${apexMono} mt-2 text-[#c6c6cd]`}>
            {mode === 'stopwatch' ? 'Elapsed' : 'Remaining'}
          </span>
        </div>
      </div>

      {/* Controls grid */}
      <div className="grid w-full grid-cols-3 gap-4">
        <button
          type="button"
          onClick={reset}
          aria-label="Reset"
          className="flex h-16 items-center justify-center rounded-xl border border-[#45464d]/20 bg-[#1f2a3c] text-[#c6c6cd]/60 transition-all hover:bg-[#2a3548] active:scale-95"
        >
          <RotateCcw size={22} />
        </button>
        <button
          type="button"
          onClick={toggle}
          aria-label={running ? 'Pause' : 'Start'}
          className="flex h-16 items-center justify-center rounded-xl bg-[#ff6d00] text-white shadow-[0_8px_24px_rgba(255,109,0,0.22)] transition-all hover:brightness-110 active:scale-95"
        >
          {running ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
        </button>
        <button
          type="button"
          onClick={addLap}
          disabled={mode !== 'stopwatch' || !running}
          aria-label="Lap"
          className="flex h-16 items-center justify-center rounded-xl border border-[#45464d]/20 bg-[#1f2a3c] text-[#c6c6cd]/60 transition-all hover:bg-[#2a3548] active:scale-95 disabled:opacity-30"
        >
          <Flag size={22} />
        </button>
      </div>

      {/* Config */}
      {mode === 'countdown' && !running && (
        <div className="flex items-center justify-center gap-2">
          {[60, 180, 300, 600].map(sec => (
            <button
              key={sec}
              type="button"
              onClick={() => { setCountdownSec(sec); remainingRef.current = sec * 1000; setDisplayMs(sec * 1000); }}
              className={`rounded-lg px-4 py-2 font-player-mono text-[11px] font-bold uppercase transition-colors ${
                countdownSec === sec ? 'bg-[#dce7f8]/15 text-[#dce7f8] ring-1 ring-[#b9c8de]/40' : 'bg-[#152031] text-[#c6c6cd]'
              }`}
            >
              {sec / 60}m
            </button>
          ))}
        </div>
      )}

      {mode === 'interval' && !running && (
        <div className="grid w-full grid-cols-3 gap-3">
          {[
            { label: 'Work (s)', value: workSec, set: setWorkSec },
            { label: 'Rest (s)', value: restSec, set: setRestSec },
            { label: 'Rounds', value: rounds, set: (v: number) => { setRounds(v); roundRef.current = v; setRoundLeft(v); } }
          ].map(field => (
            <label key={field.label} className={`${apexCard} p-3 text-center`}>
              <span className={`${apexMonoTight} block text-[#c6c6cd]/70`}>{field.label}</span>
              <input
                type="number"
                min={1}
                value={field.value}
                onChange={e => { const v = Math.max(1, Number(e.target.value) || 1); field.set(v); resetState('interval'); }}
                className="mt-1 w-full bg-transparent text-center font-player-display text-lg font-bold text-[#d8e3fb] outline-none"
              />
            </label>
          ))}
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

      {/* Save row */}
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
