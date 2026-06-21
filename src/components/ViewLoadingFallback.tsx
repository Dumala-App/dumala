export default function ViewLoadingFallback({ label = 'workspace' }: { label?: string }) {
  return (
    <div
      className="flex min-h-56 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-12 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="text-center">
        <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
        <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
          Loading {label}
        </p>
      </div>
    </div>
  );
}
