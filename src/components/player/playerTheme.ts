import type { CSSProperties } from 'react';

// "Apex Precision" design system for the Player app (from the Dumala player
// design package). Deep navy tonal surfaces, slate-blue secondary accents, and a
// single focal burnt orange used sparingly with glow shadows. Typography pairs
// Hanken Grotesk uppercase display headlines with tiny uppercase monospace
// micro-labels. Shapes are "soft-technical" (4-8px radii, micro-borders), depth
// comes from tonal layering rather than heavy shadows.

// --- Core color values (kept here so non-class usages stay consistent) --------
export const APEX = {
  surface: '#081425',
  surfaceLowest: '#040e1f',
  containerLow: '#111c2d',
  container: '#152031',
  containerHigh: '#1f2a3c',
  containerHighest: '#2a3548',
  onSurface: '#d8e3fb',
  onSurfaceVariant: '#c6c6cd',
  primary: '#bec6e0',
  secondary: '#b9c8de',
  tertiary: '#ff6d00',
  outlineVariant: '#45464d'
} as const;

// --- Shell ---------------------------------------------------------------------
export const apexShell = 'relative min-h-screen bg-[#081425] text-[#d8e3fb] font-sans';

/** CSS-variable block so shared shadcn primitives (Input, Button, Label) pick up
 * the Apex palette, mirroring how DARK_GLASS_THEME.style themes the coach app. */
export const APEX_THEME_STYLE: CSSProperties = {
  '--background': '#081425',
  '--foreground': '#d8e3fb',
  '--card': '#152031',
  '--card-foreground': '#d8e3fb',
  '--muted': 'rgba(255, 255, 255, 0.05)',
  '--muted-foreground': '#c6c6cd',
  '--popover': '#111c2d',
  '--popover-foreground': '#d8e3fb',
  '--border': 'rgba(69, 70, 77, 0.4)',
  '--input': '#040e1f',
  '--ring': '#b9c8de',
  '--primary': '#ff6d00',
  '--primary-foreground': '#ffffff',
  '--accent': '#ff6d00',
  '--accent-foreground': '#ffffff',
  '--destructive': '#ffb4ab'
} as CSSProperties;

export const apexHeader =
  'sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#45464d]/30 bg-[#081425]/80 px-4 backdrop-blur-xl';

export const apexWordmark =
  'font-player-display text-lg font-bold uppercase tracking-widest text-[#bec6e0]';

export const apexNav =
  'fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-[#45464d]/30 bg-[#040e1f]/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-2xl';

// --- Typography ------------------------------------------------------------------
/** Tiny uppercase monospace micro-label — the system's signature "engineered" detail. */
export const apexMono = 'font-player-mono text-[10px] font-medium uppercase tracking-[0.2em]';
export const apexMonoTight = 'font-player-mono text-[9px] font-medium uppercase tracking-[0.15em]';
/** Eyebrow line above a display headline. */
export const apexEyebrow = `${apexMono} text-[#b9c8de] opacity-80`;
/** Big uppercase display headline. */
export const apexDisplay = 'font-player-display font-bold uppercase leading-tight text-[#d8e3fb]';
/** Section header: small, uppercase, wide-tracked Hanken. */
export const apexSectionTitle =
  'font-player-display text-[13px] font-semibold uppercase tracking-widest text-[#d8e3fb]';

// --- Surfaces --------------------------------------------------------------------
/** Standard tonal card: container surface, micro-border, soft blur. */
export const apexCard =
  'rounded-xl border border-white/5 bg-[#152031]/80 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-sm';
export const apexCardLow = 'rounded-lg border border-white/5 bg-[#111c2d]/80';
/** Sheet/panel elevation (modals, bottom sheets). */
export const apexSheet =
  'border border-[#45464d]/30 bg-[#111c2d] shadow-[0_20px_50px_rgba(0,0,0,0.45)]';

// --- Controls ---------------------------------------------------------------------
/** Primary CTA: focal orange with the signature glow. */
export const apexCta =
  'bg-[#ff6d00] text-white font-player-mono text-[11px] font-bold uppercase tracking-wider rounded-lg shadow-[0_4px_20px_rgba(255,109,0,0.4)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:shadow-none';
/** Ghost/secondary control on a raised container. */
export const apexGhost =
  'rounded-lg border border-[#45464d]/20 bg-[#1f2a3c] text-[#c6c6cd] transition-all hover:bg-[#2a3548] active:scale-95';
/** Filter chip (mono uppercase); pass active to swap to solid orange. */
export const apexChip = (active: boolean) =>
  `whitespace-nowrap rounded-lg px-4 py-2 font-player-mono text-[11px] font-bold uppercase tracking-wide transition-colors ${
    active ? 'bg-[#ff6d00] text-white' : 'bg-[#152031] text-[#d8e3fb] hover:bg-[#1f2a3c]'
  }`;
/** Small data chip: icon + mono microcopy on a low container. */
export const apexTag =
  'flex items-center gap-1.5 rounded bg-[#111c2d] border border-white/5 px-2 py-1 font-player-mono text-[9px] uppercase tracking-wide text-[#d8e3fb]';
/** Solid orange badge chip (difficulty, status). */
export const apexBadge =
  'rounded bg-[#ff6d00] px-2 py-1 font-player-mono text-[10px] font-bold uppercase tracking-widest text-white';

// --- Inputs -----------------------------------------------------------------------
/** Darkened input; calm slate focus ring per the design doc (not orange). */
export const apexInput =
  'w-full rounded-lg border border-[#45464d]/30 bg-[#040e1f] px-3 py-2.5 font-sans text-sm text-[#d8e3fb] outline-none transition-all placeholder:text-[#c6c6cd]/50 focus:border-[#b9c8de]/60 focus:ring-1 focus:ring-[#b9c8de]/40';
export const apexLabel = `${apexMonoTight} text-[#c6c6cd]`;
