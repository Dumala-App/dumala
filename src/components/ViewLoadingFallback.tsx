import { DARK_GLASS_CLASSES } from '../theme/darkGlassTheme';

export default function ViewLoadingFallback({ label = 'workspace' }: { label?: string }) {
  return (
    <div
      className={`flex min-h-56 items-center justify-center px-6 py-12 ${DARK_GLASS_CLASSES.panel}`}
      role="status"
      aria-live="polite"
    >
      <div className="text-center">
        <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-cyan-300/10 border-t-orange-300 shadow-sm shadow-orange-950/30" />
        <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-300">
          Loading {label}
        </p>
      </div>
    </div>
  );
}
