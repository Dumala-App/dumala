import type { CSSProperties } from 'react';

export type OrangeNewThemeId = 'orange-new';

/**
 * Shared look of the coach-facing landing page: deep navy backdrop, orange
 * accent, particle network ambience, and glow-ring glass cards.
 *
 * Every class string here is self-contained (display, spacing, color, shadow,
 * hover/transition) so it can be dropped straight onto a plain <button>/<a>,
 * or passed as `className` to the shared <Button>/<Badge> — twMerge resolves
 * any conflicting utility in this string's favor since it's applied last.
 */
export const ORANGE_NEW_THEME = {
  id: 'orange-new',
  label: 'Orange Flow',
  style: {
    '--background': '#04091A',
    '--foreground': '#F5F7FB',
    '--card': 'rgba(8, 16, 38, 0.70)',
    '--card-foreground': '#F5F7FB',
    '--muted': 'rgba(255, 255, 255, 0.04)',
    '--muted-foreground': '#8A96AD',
    '--popover': 'rgba(8, 16, 38, 0.92)',
    '--popover-foreground': '#F5F7FB',
    '--border': 'rgba(255, 255, 255, 0.14)',
    '--input': 'rgba(8, 16, 38, 0.85)',
    '--ring': '#FF8A3D',
    '--primary': '#FF8A3D',
    '--primary-foreground': '#180A00',
    '--accent': '#FF8A3D',
    '--accent-foreground': '#180A00',
    '--destructive': '#fb7185'
  } as CSSProperties,
  classes: {
    shell: 'relative min-h-screen overflow-x-hidden bg-[#04091A] text-slate-100',
    accessShell: 'relative min-h-screen overflow-hidden bg-[#04091A] font-sans text-slate-100 selection:bg-orange-400/30',
    accessPanel: 'w-full max-w-3xl rounded-[1.85rem] border border-white/10 bg-[#07111f]/90 p-5 text-slate-100 shadow-2xl shadow-black/45 backdrop-blur-xl sm:p-6',

    // ---- Boxes -----------------------------------------------------------
    /** Static glass box, no hover glow ring — dc-card. */
    card: 'rounded-[18px] border border-white/[0.14] bg-[#081026]/[0.66] shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_1px_2px_rgba(0,0,0,.3),0_14px_30px_-20px_rgba(0,0,0,.65)] backdrop-blur-[14px] transition-[border-color,background,box-shadow] duration-200 hover:border-orange-300/[0.34] hover:bg-[#081026]/[0.76] hover:shadow-[inset_0_1px_0_rgba(255,255,255,.10),0_1px_2px_rgba(0,0,0,.35),0_18px_36px_-20px_rgba(0,0,0,.7)]',
    /** Outer wrapper for a glow-ring card — pair with <GlowingEffect /> then glowCard as siblings. */
    glowShell: 'relative rounded-[2.1rem] border border-white/10 bg-white/[0.025] p-2 shadow-[0_16px_34px_-26px_rgba(0,0,0,.75)]',
    glowShellTight: 'relative rounded-2xl border border-white/10 bg-white/[0.025] p-2 shadow-lg shadow-black/15',
    glowCard: 'relative z-10 overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#07111f]/90 backdrop-blur-xl',
    glowCardTight: 'relative z-10 overflow-hidden rounded-xl border border-white/10 bg-[#07111f]/80 backdrop-blur-xl',
    /** Feature-grid box (icon + title + text) — dc-feature-shell/-card, min-height 210px, pairs with <GlowingEffect />. */
    featureShell: 'relative min-h-[210px] list-none rounded-[22px] border border-white/10 bg-white/[0.025] p-2 shadow-[0_16px_34px_-26px_rgba(0,0,0,.75)]',
    featureCard: 'relative z-10 h-full overflow-hidden rounded-2xl border border-white/[0.12] bg-[#081026]/70 p-6 backdrop-blur-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,.08)]',
    featureIcon: 'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-orange-300/[0.25] bg-orange-300/[0.10] text-orange-200',

    // ---- Buttons -----------------------------------------------------------
    /** Big gradient CTA — dc-cta-primary. Self-contained; safe as className on <Button> or a plain <a>/<button>. */
    ctaPrimaryButton: 'inline-flex items-center gap-2 rounded-[14px] border-0 bg-[linear-gradient(180deg,#FF9A52,#FF8A3D)] px-7 py-3.5 text-[15px] font-bold text-[#180A00] shadow-[inset_0_1px_0_rgba(255,255,255,.34),0_1px_2px_rgba(0,0,0,.4),0_8px_20px_-9px_rgba(255,138,61,.55)] transition-[background,transform,box-shadow] duration-150 hover:bg-[linear-gradient(180deg,#FFB06E,#FFA35F)] hover:-translate-y-px hover:shadow-[inset_0_1px_0_rgba(255,255,255,.34),0_2px_4px_rgba(0,0,0,.4),0_12px_26px_-10px_rgba(255,138,61,.6)] active:translate-y-0',
    /** Glass outline CTA — dc-cta-secondary. */
    ctaSecondaryButton: 'inline-flex items-center gap-2 rounded-[14px] border border-white/[0.14] bg-white/[0.04] px-7 py-3.5 text-[15px] font-semibold text-[#DDE4EF] shadow-[inset_0_1px_0_rgba(255,255,255,.10),0_1px_2px_rgba(0,0,0,.3)] backdrop-blur-[6px] transition-[border-color,background] duration-150 hover:border-white/[0.26] hover:bg-white/[0.07]',
    /** Small gradient nav pill — dc-openapp ("Open app"). */
    navPillButton: 'inline-flex items-center gap-1.5 rounded-xl bg-[linear-gradient(180deg,#FF9A52,#FF8A3D)] px-[18px] py-[9px] text-sm font-bold text-[#180A00] shadow-[inset_0_1px_0_rgba(255,255,255,.32),0_1px_2px_rgba(0,0,0,.35),0_6px_14px_-7px_rgba(255,138,61,.5)] transition-[background,box-shadow] duration-150 hover:bg-[linear-gradient(180deg,#FFB06E,#FFA35F)]',
    /** Full-width gradient action (pricing ticket "Join the beta list") — dc-joinbeta. */
    ticketPrimaryButton: 'block w-full rounded-xl bg-[linear-gradient(180deg,#FF9A52,#FF8A3D)] p-[11px] text-center text-[13.5px] font-bold text-[#180A00] shadow-[inset_0_1px_0_rgba(255,255,255,.30),0_1px_2px_rgba(0,0,0,.35),0_6px_16px_-8px_rgba(255,138,61,.5)] transition-[background] duration-150 hover:bg-[linear-gradient(180deg,#FFB06E,#FFA35F)]',
    /** Full-width glass action (pricing ticket "Start free") — dc-startfree. */
    ticketSecondaryButton: 'block w-full rounded-xl border border-white/[0.14] bg-white/[0.04] p-[11px] text-center text-[13.5px] font-semibold text-[#DDE4EF] shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_1px_2px_rgba(0,0,0,.3)] transition-[background,border-color] duration-150 hover:bg-white/[0.08] hover:border-white/[0.24]',
    /** Plain text nav item — dc-nav-link. */
    navLinkButton: 'rounded-[10px] px-3.5 py-2 text-sm font-medium text-[#8A96AD] transition-colors duration-150 hover:text-[#F5F7FB]',
    /** Plain text footer link — dc-foot-link. */
    footerLinkButton: 'p-0 text-[13.5px] text-[#5C6880] transition-colors duration-150 hover:text-[#DDE4EF]',

    // ---- Badges / labels -----------------------------------------------------------
    /** Hero-style pill badge with room for a leading icon. */
    badgePill: 'inline-flex items-center gap-2 rounded-full border border-orange-300/[0.22] bg-orange-300/[0.08] px-4 py-1.5 text-sm font-medium text-[#DDE4EF] backdrop-blur-sm',
    /** Small uppercase section eyebrow ("HOW IT WORKS") — text only, no box. */
    eyebrowLabel: 'text-[11px] font-bold uppercase tracking-[.22em] text-[#FF9E5E]',
    /** Neutral outline pill ("Beta"). */
    tagPillNeutral: 'inline-flex items-center rounded-full border border-white/[0.09] bg-white/[0.03] px-[11px] py-[3px] text-[10.5px] font-semibold text-[#8A96AD]',
    /** Orange outline pill ("Full squad access"). */
    tagPillAccent: 'inline-flex items-center rounded-full border border-orange-300/30 bg-orange-300/10 px-[11px] py-[3px] text-[10.5px] font-bold text-orange-200',
    /** Corner ribbon badge ("Recommended"). */
    ribbonBadge: 'absolute top-0 rounded-b-lg bg-orange-400 px-3 py-[5px] text-[10px] font-extrabold uppercase tracking-[.14em] text-[#180A00]'
  }
} as const;

export const ORANGE_NEW_THEME_STYLE = ORANGE_NEW_THEME.style;
export const ORANGE_NEW_CLASSES = ORANGE_NEW_THEME.classes;

/** Default glow-effect tuning that matches the landing page's cards. */
export const ORANGE_NEW_GLOW_PROPS = {
  shell: { spread: 44, glow: true, disabled: false, proximity: 96, inactiveZone: 0.01, borderWidth: 3 },
  shellTight: { spread: 36, glow: true, disabled: false, proximity: 64, inactiveZone: 0.01, borderWidth: 2 },
  feature: { spread: 40, glow: true, disabled: false, proximity: 72, inactiveZone: 0.01, borderWidth: 3 }
} as const;
