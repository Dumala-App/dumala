import { useState } from 'react';
import { AlertTriangle, ArrowRight, ChevronDown, ChevronUp, Download, RefreshCw, X } from 'lucide-react';
import {
  getActionableIntegrityFindings,
  type IntegrityFinding,
  type IntegritySection,
  type WorkspaceIntegrityReport
} from '../integrity/workspaceIntegrity';
import { Button } from './ui/button';

interface WorkspaceIntegrityBannerProps {
  report: WorkspaceIntegrityReport;
  onDismiss: () => void;
  onExportBackup: () => void;
  onOpenSection: (section: IntegritySection) => void;
  onOpenFinding: (finding: IntegrityFinding) => void;
  onRerun: () => void;
}

const SECTION_LABELS: Record<IntegritySection, string> = {
  games: 'match records',
  standings: 'league standings',
  players: 'player totals',
  assessments: 'assessments'
};

const SECTION_PRIORITY: IntegritySection[] = ['standings', 'players', 'games', 'assessments'];

export default function WorkspaceIntegrityBanner({
  report,
  onDismiss,
  onExportBackup,
  onOpenSection,
  onOpenFinding,
  onRerun
}: WorkspaceIntegrityBannerProps) {
  // Collapsed by default: a one-line summary keeps the check visible without
  // taking over the workspace. Details live behind the toggle.
  const [expanded, setExpanded] = useState(false);

  const findings = getActionableIntegrityFindings(report).sort((left, right) => {
    const severityOrder = { error: 0, warning: 1, info: 2 };
    return severityOrder[left.severity] - severityOrder[right.severity];
  });
  if (findings.length === 0) return null;

  const sections = [...new Set(findings.map(item => item.section))];
  const targetSection = SECTION_PRIORITY.find(section => sections.includes(section)) ?? sections[0];
  const errorCount = findings.filter(item => item.severity === 'error').length;
  const warningCount = findings.length - errorCount;
  const countSummary = [
    errorCount > 0 ? `${errorCount} error${errorCount === 1 ? '' : 's'}` : '',
    warningCount > 0 ? `${warningCount} warning${warningCount === 1 ? '' : 's'}` : ''
  ].filter(Boolean).join(' · ');

  return (
    <section
      className="rounded-xl border border-amber-300/25 bg-amber-400/[0.07] text-amber-100 shadow-sm shadow-black/20"
      aria-labelledby="workspace-integrity-title"
    >
      <div className="flex items-center gap-3 px-3 py-2">
        <AlertTriangle size={15} className="shrink-0 text-amber-300" aria-hidden="true" />
        <p id="workspace-integrity-title" className="min-w-0 flex-1 truncate text-xs font-semibold">
          <span className="font-black">Consistency check:</span>{' '}
          {countSummary} in {sections.map(section => SECTION_LABELS[section]).join(', ')}.{' '}
          <span className="hidden text-amber-200/70 md:inline">No workspace data was changed.</span>
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() => onOpenSection(targetSection)}
          className="h-7 shrink-0 gap-1 rounded-lg bg-amber-400/90 px-2.5 text-[11px] font-black text-amber-950 hover:bg-amber-300 [&_svg]:size-3"
        >
          Review <ArrowRight size={12} />
        </Button>
        <button
          type="button"
          onClick={() => setExpanded(value => !value)}
          className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-amber-300/20 bg-amber-300/[0.06] text-amber-200 transition-colors hover:bg-amber-300/15 hover:text-amber-100"
          aria-expanded={expanded}
          aria-label={expanded ? 'Hide consistency check details' : 'Show consistency check details'}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-amber-300/70 transition-colors hover:bg-amber-300/10 hover:text-amber-100"
          aria-label="Dismiss workspace consistency warning"
        >
          <X size={14} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-amber-300/15 px-3 pb-3 pt-2">
          <ul className="space-y-1">
            {findings.map(finding => (
              <li
                key={`${finding.code}:${finding.relatedIds.join(':')}`}
                className="flex items-center justify-between gap-3 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-amber-300/[0.06]"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                      finding.severity === 'error'
                        ? 'bg-rose-400/15 text-rose-300'
                        : 'bg-amber-300/15 text-amber-200'
                    }`}
                  >
                    {finding.severity}
                  </span>
                  <p className="min-w-0 truncate text-xs text-amber-50/90" title={finding.message}>
                    {finding.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenFinding(finding)}
                  className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-bold text-amber-200 transition-colors hover:bg-amber-300/10 hover:text-amber-100"
                >
                  Review <ArrowRight size={11} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-amber-300/10 pt-2">
            <p className="mr-auto text-[11px] font-semibold text-amber-200/70">
              No workspace data was changed. Rerun the check after each fix.
            </p>
            <button
              type="button"
              onClick={onExportBackup}
              className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] font-bold text-amber-200 transition-colors hover:bg-amber-300/10 hover:text-amber-100"
            >
              <Download size={12} aria-hidden="true" /> Export backup
            </button>
            <button
              type="button"
              onClick={onRerun}
              className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] font-bold text-amber-200 transition-colors hover:bg-amber-300/10 hover:text-amber-100"
            >
              <RefreshCw size={12} aria-hidden="true" /> Rerun check
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
