import type { CSSProperties } from 'react';

// "Apex Precision v2" design system for the Player app. Deep navy tonal
// surfaces with layered texture (a technical grid + film-grain noise on the
// shell, tonal-gradient cards with a hairline top-light — see the .apex-*
// classes in src/index.css), an "ice" cool highlight for active/lit states, and
// burnt orange reserved for ONE focal moment per screen (the primary CTA, the
// streak flame, attention dots). Typography pairs Hanken Grotesk uppercase
// display headlines with tiny uppercase monospace micro-labels. Shapes are
// "soft-technical" (4-8px radii, micro-borders); depth comes from tonal
// layering rather than heavy shadows.

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
  /** Cool highlight for active/lit states (chips, rings, progress). */
  ice: '#dce7f8',
  /** Focal accent — CTAs, the streak flame, attention dots. Use sparingly. */
  tertiary: '#ff6d00',
  outlineVariant: '#45464d'
} as const;

// --- Shell ---------------------------------------------------------------------
export const apexShell = 'apex-shell relative min-h-screen text-[#d8e3fb] font-sans';

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
/** Standard tonal card: gradient surface with a hairline top-light (texture in index.css). */
export const apexCard = 'apex-card rounded-xl border border-white/[0.06]';
/** Feature/hero card: same, plus diagonal speed-line micro-stripes. */
export const apexCardHero = 'apex-card-hero rounded-xl border border-white/[0.07]';
export const apexCardLow = 'rounded-lg border border-white/5 bg-[#111c2d]/80';
/** Sheet/panel elevation (modals, bottom sheets). */
export const apexSheet =
  'border border-[#45464d]/30 bg-[#111c2d] shadow-[0_20px_50px_rgba(0,0,0,0.45)]';

// --- Controls ---------------------------------------------------------------------
/** Primary CTA: the screen's focal orange, with a calmer glow than v1. */
export const apexCta =
  'bg-[#ff6d00] text-white font-player-mono text-[11px] font-bold uppercase tracking-wider rounded-lg shadow-[0_4px_16px_rgba(255,109,0,0.25)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:shadow-none';
/** Ghost/secondary control on a raised container. */
export const apexGhost =
  'rounded-lg border border-[#45464d]/20 bg-[#1f2a3c] text-[#c6c6cd] transition-all hover:bg-[#2a3548] active:scale-95';
/** Filter chip (mono uppercase); active inverts to ice. */
export const apexChip = (active: boolean) =>
  `whitespace-nowrap rounded-lg px-4 py-2 font-player-mono text-[11px] font-bold uppercase tracking-wide transition-colors ${
    active ? 'bg-[#dce7f8] text-[#0a1526]' : 'bg-[#152031] text-[#d8e3fb] hover:bg-[#1f2a3c]'
  }`;
/** Small data chip: icon + mono microcopy on a low container. */
export const apexTag =
  'flex items-center gap-1.5 rounded bg-[#111c2d] border border-white/5 px-2 py-1 font-player-mono text-[9px] uppercase tracking-wide text-[#d8e3fb]';
/** Quiet badge chip (difficulty, status): outlined ice, not solid orange. */
export const apexBadge =
  'rounded border border-[#b9c8de]/30 bg-[#b9c8de]/10 px-2 py-1 font-player-mono text-[10px] font-bold uppercase tracking-widest text-[#dce7f8]';

// --- Inputs -----------------------------------------------------------------------
/** Darkened input; calm slate focus ring per the design doc (not orange). */
export const apexInput =
  'w-full rounded-lg border border-[#45464d]/30 bg-[#040e1f] px-3 py-2.5 font-sans text-sm text-[#d8e3fb] outline-none transition-all placeholder:text-[#c6c6cd]/50 focus:border-[#b9c8de]/60 focus:ring-1 focus:ring-[#b9c8de]/40';
export const apexLabel = `${apexMonoTight} text-[#c6c6cd]`;
