import type { CSSProperties } from 'react';

export type DarkGlassThemeId = 'dark-glass';

export const DARK_GLASS_THEME = {
  id: 'dark-glass',
  label: 'Dark Glass',
  style: {
    '--background': '#020713',
    '--foreground': '#f8fafc',
    '--card': 'rgba(7, 17, 31, 0.9)',
    '--card-foreground': '#f8fafc',
    '--muted': 'rgba(255, 255, 255, 0.06)',
    '--muted-foreground': '#94a3b8',
    '--popover': 'rgba(7, 17, 31, 0.98)',
    '--popover-foreground': '#f8fafc',
    '--border': 'rgba(255, 255, 255, 0.1)',
    '--input': 'rgba(11, 23, 38, 0.95)',
    '--ring': '#fb923c',
    '--primary': '#fb923c',
    '--primary-foreground': '#020713',
    '--accent': '#fb923c',
    '--accent-foreground': '#020713',
    '--destructive': '#fb7185'
  } as CSSProperties,
  classes: {
    shell: 'relative min-h-screen overflow-x-hidden bg-[#020713] text-slate-100',
    dashboardShell: 'space-y-6 rounded-[1.75rem] border border-cyan-300/10 p-4 text-slate-100 shadow-2xl shadow-black/25 sm:p-5 lg:p-6',
    accessShell: 'relative min-h-screen overflow-hidden bg-[#020713] font-sans text-slate-100 selection:bg-orange-400/30',
    accessPanel: 'w-full max-w-3xl rounded-[1.85rem] border border-white/10 bg-[#07111f]/90 p-5 text-slate-100 shadow-2xl shadow-black/45 backdrop-blur-xl sm:p-6',
    panel: 'rounded-2xl border border-cyan-300/10 bg-[#07111f]/88 text-slate-100 shadow-lg shadow-black/20 backdrop-blur-xl [&_.text-foreground]:!text-slate-100 [&_.text-muted-foreground]:!text-slate-400',
    panelHeader: 'flex items-center gap-2 border-b border-cyan-300/10 px-4 py-3',
    sectionDivider: 'border-b border-cyan-300/10 pb-4',
    subtleCard: 'rounded-xl border border-cyan-300/10 bg-white/[0.035] text-slate-100 shadow-sm shadow-black/10 [&_.text-foreground]:!text-slate-100 [&_.text-muted-foreground]:!text-slate-400',
    metricCard: 'flex items-center justify-between rounded-xl border border-cyan-300/10 bg-white/[0.035] text-slate-100 shadow-sm shadow-black/10 transition-colors hover:border-orange-300/30 hover:bg-orange-300/10',
    listButton: 'h-auto w-full justify-between rounded-xl border-cyan-300/10 bg-white/[0.035] p-3 text-left whitespace-normal text-slate-100 hover:border-orange-300/30 hover:bg-orange-300/10 hover:text-orange-100',
    input: 'h-9 rounded-xl border border-cyan-300/10 bg-[#0b1726]/85 px-3 text-xs font-semibold text-slate-100 outline-none ring-orange-300/15 transition placeholder:text-slate-500 focus:border-orange-300/60 focus:ring-2',
    select: 'h-9 rounded-xl border border-cyan-300/10 bg-[#0b1726]/85 px-2 text-xs font-bold text-slate-100 outline-none ring-orange-300/15 transition focus:border-orange-300/60 focus:ring-2',
    warning: 'rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs font-bold leading-5 text-amber-100',
    reviewButton: 'border-orange-300/35 bg-orange-400 text-slate-950 shadow-sm shadow-orange-950/20 hover:border-orange-200 hover:bg-orange-300 hover:text-slate-950',
    dialogContent: 'border-cyan-300/10 bg-[#07111f] text-slate-100 shadow-2xl shadow-black/40 [&_.text-foreground]:!text-slate-100 [&_.text-muted-foreground]:!text-slate-400',
    dialogField: 'border-cyan-300/15 bg-[#0b1726]/95 text-slate-100 placeholder:text-slate-500 focus:ring-orange-300/25',
    dialogSelectContent: 'border-cyan-300/15 bg-[#0b1726] text-slate-100 shadow-2xl shadow-black/35',
    dialogSelectItem: 'text-slate-100 focus:bg-orange-300/10 focus:text-orange-100',
    dialogSecondaryButton: 'border-cyan-300/15 bg-[#0b1726]/90 text-slate-100 hover:bg-white/[0.06] hover:text-white',
    dialogPrimaryButton: 'bg-orange-400 text-slate-950 shadow-sm shadow-orange-950/25 hover:bg-orange-300 hover:text-slate-950',
    secondaryActionButton: 'border-cyan-300/15 bg-[#0b1726]/90 text-slate-100 shadow-sm shadow-black/15 hover:border-orange-300/30 hover:bg-orange-300/10 hover:text-orange-100',
    nav: 'flex flex-wrap gap-1.5 rounded-2xl border border-orange-300/10 bg-[#07111f]/88 p-2 shadow-lg shadow-black/20 backdrop-blur-xl lg:flex-nowrap',
    navItem: 'min-w-0 shrink-0 border px-2 text-[10px] transition-colors sm:flex-1 lg:h-8 lg:flex-1 lg:basis-0 lg:shrink xl:text-[11px]',
    navItemActive: 'border-orange-300/40 bg-orange-400 text-slate-950 shadow-sm shadow-orange-950/25 hover:bg-orange-300 hover:text-slate-950',
    navItemIdle: 'border-transparent text-slate-400 hover:border-orange-300/20 hover:bg-orange-300/10 hover:text-orange-100'
  }
} as const;

export const DARK_GLASS_THEME_STYLE = DARK_GLASS_THEME.style;
export const DARK_GLASS_CLASSES = DARK_GLASS_THEME.classes;

export const DARK_GLASS_DASHBOARD_SURFACE_STYLE: CSSProperties = {
  background: [
    'radial-gradient(circle at 58% 8%, rgba(34, 211, 238, 0.18), transparent 24rem)',
    'radial-gradient(circle at 12% 18%, rgba(249, 115, 22, 0.18), transparent 22rem)',
    'linear-gradient(135deg, #020713 0%, #051325 48%, #041511 100%)'
  ].join(', '),
  boxShadow: '0 28px 70px rgba(2, 7, 19, 0.32)'
};
