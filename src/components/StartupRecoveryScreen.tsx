import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Download, RefreshCw, RotateCcw, ShieldCheck } from 'lucide-react';
import type { StorageRecoveryIssue } from '../persistence/storage';

interface StartupRecoveryScreenProps {
  issues: StorageRecoveryIssue[];
  onExport: () => void;
  onRetry: () => void;
  onReset: () => void;
}

export default function StartupRecoveryScreen({
  issues,
  onExport,
  onRetry,
  onReset
}: StartupRecoveryScreenProps) {
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const sections = [...new Set(issues.map(issue => issue.section))];

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:py-14">
      <section
        className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-amber-200 bg-white shadow-xl shadow-slate-900/10"
        role="alert"
        aria-labelledby="startup-recovery-title"
      >
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-5 sm:px-7">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 rounded-md bg-amber-100 p-2 text-amber-800">
              <AlertTriangle size={22} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-amber-800">Workspace recovery</p>
              <h1
                ref={headingRef}
                tabIndex={-1}
                id="startup-recovery-title"
                className="mt-1 font-display text-2xl font-extrabold text-slate-950 outline-none"
              >
                Dumala paused before loading saved data
              </h1>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-700">
                One or more saved sections are unreadable. Dumala has not replaced, reset, or written over them.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-5 py-6 sm:px-7">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Affected sections</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {sections.map(section => (
                <li key={section} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                  {section}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 shrink-0 text-blue-700" size={19} aria-hidden="true" />
              <div>
                <h2 className="text-sm font-extrabold text-blue-950">Preserve a recovery copy first</h2>
                <p className="mt-1 text-xs font-medium leading-relaxed text-blue-900">
                  Export downloads the untouched Dumala browser records as a diagnostic recovery file. It may contain team and player data, so store it privately. It is not a normal workspace backup.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={onExport}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
            >
              <Download size={17} aria-hidden="true" /> Export recovery copy
            </button>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <RefreshCw size={17} aria-hidden="true" /> Retry validation
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-800 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
            >
              <RotateCcw size={17} aria-hidden="true" /> Reset browser workspace
            </button>
          </div>

          <details className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <summary className="cursor-pointer text-sm font-extrabold text-slate-800">Diagnostic guidance</summary>
            <div className="mt-3 space-y-2 text-xs font-medium leading-relaxed text-slate-600">
              <p>Retry after refreshing the browser or freeing device storage. If the warning remains, export the recovery copy before resetting.</p>
              <p>The affected storage keys are listed for technical support, but saved record contents are never displayed here.</p>
              <ul className="space-y-1 font-mono text-[11px] text-slate-700">
                {issues.map(issue => <li key={issue.key}>{issue.key}: {issue.reason}</li>)}
              </ul>
            </div>
          </details>

          {confirmReset && (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-4" role="alert">
              <h2 className="text-sm font-extrabold text-rose-950">Delete this browser workspace?</h2>
              <p className="mt-1 text-xs font-medium leading-relaxed text-rose-900">
                This permanently removes Dumala data stored in this browser. Export a recovery copy first if you may need these records.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={onReset}
                  className="min-h-10 rounded-md bg-rose-700 px-4 py-2 text-xs font-black uppercase text-white hover:bg-rose-800"
                >
                  Delete and restart
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="min-h-10 rounded-md border border-rose-200 bg-white px-4 py-2 text-xs font-black uppercase text-rose-800 hover:bg-rose-100"
                >
                  Keep saved data
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
