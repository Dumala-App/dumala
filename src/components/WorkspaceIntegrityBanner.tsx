import { AlertTriangle, ArrowRight, Download, RefreshCw, X } from 'lucide-react';
import {
  getActionableIntegrityFindings,
  type IntegritySection,
  type WorkspaceIntegrityReport
} from '../integrity/workspaceIntegrity';

interface WorkspaceIntegrityBannerProps {
  report: WorkspaceIntegrityReport;
  onDismiss: () => void;
  onExportBackup: () => void;
  onOpenSection: (section: IntegritySection) => void;
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
  onRerun
}: WorkspaceIntegrityBannerProps) {
  const findings = getActionableIntegrityFindings(report);
  if (findings.length === 0) return null;

  const sections = [...new Set(findings.map(item => item.section))];
  const targetSection = SECTION_PRIORITY.find(section => sections.includes(section)) ?? sections[0];
  const errorCount = findings.filter(item => item.severity === 'error').length;
  const warningCount = findings.length - errorCount;

  return (
    <section
      className="border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm"
      aria-labelledby="workspace-integrity-title"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="workspace-integrity-title" className="text-xs font-black uppercase">
                Workspace consistency check
              </h2>
              <p className="mt-1 text-xs leading-relaxed">
                Dumala found {errorCount > 0 ? `${errorCount} error${errorCount === 1 ? '' : 's'}` : ''}
                {errorCount > 0 && warningCount > 0 ? ' and ' : ''}
                {warningCount > 0 ? `${warningCount} warning${warningCount === 1 ? '' : 's'}` : ''} involving{' '}
                {sections.map(section => SECTION_LABELS[section]).join(', ')}. No workspace data was changed.
              </p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-md p-1 text-amber-700 hover:bg-amber-100"
              aria-label="Dismiss workspace consistency warning"
            >
              <X size={15} />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onOpenSection(targetSection)}
              className="inline-flex items-center gap-1.5 rounded-md bg-amber-800 px-3 py-1.5 text-[11px] font-black text-white hover:bg-amber-700"
            >
              Review {SECTION_LABELS[targetSection]} <ArrowRight size={13} />
            </button>
            <button
              type="button"
              onClick={onExportBackup}
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-black text-amber-900 hover:bg-amber-100"
            >
              <Download size={13} /> Export backup
            </button>
            <button
              type="button"
              onClick={onRerun}
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-black text-amber-900 hover:bg-amber-100"
            >
              <RefreshCw size={13} /> Rerun check
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
