import { AlertTriangle, ArrowRight, Download, RefreshCw, X } from 'lucide-react';
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
  const findings = getActionableIntegrityFindings(report).sort((left, right) => {
    const severityOrder = { error: 0, warning: 1, info: 2 };
    return severityOrder[left.severity] - severityOrder[right.severity];
  });
  if (findings.length === 0) return null;

  const sections = [...new Set(findings.map(item => item.section))];
  const targetSection = SECTION_PRIORITY.find(section => sections.includes(section)) ?? sections[0];
  const errorCount = findings.filter(item => item.severity === 'error').length;
  const warningCount = findings.length - errorCount;
  const previewFindings = findings.slice(0, 4);
  const hiddenCount = findings.length - previewFindings.length;

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
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="size-7 rounded-md text-amber-700 hover:bg-amber-100 hover:text-amber-900"
              aria-label="Dismiss workspace consistency warning"
            >
              <X size={15} />
            </Button>
          </div>

          <div className="mt-3 space-y-2">
            {previewFindings.map((finding) => (
              <div
                key={`${finding.code}:${finding.relatedIds.join(':')}`}
                className="rounded-md border border-amber-200 bg-white/80 px-3 py-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        finding.severity === 'error'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {finding.severity}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                        {SECTION_LABELS[finding.section]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-amber-950">{finding.message}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenFinding(finding)}
                    className="h-7 shrink-0 gap-1 rounded-md border-amber-300 bg-amber-100 px-2 text-[11px] font-black text-amber-950 hover:bg-amber-200 hover:text-amber-950 [&_svg]:size-3"
                  >
                    Review <ArrowRight size={12} />
                  </Button>
                </div>
              </div>
            ))}
            {hiddenCount > 0 && (
              <p className="text-[11px] font-semibold text-amber-900">
                {hiddenCount} more issue{hiddenCount === 1 ? '' : 's'} are hidden in this summary. Rerun the check after each fix to work through them.
              </p>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => onOpenSection(targetSection)}
              className="h-8 gap-1.5 rounded-md bg-amber-800 text-[11px] font-black text-white hover:bg-amber-700 [&_svg]:size-3"
            >
              Review {SECTION_LABELS[targetSection]} <ArrowRight size={13} />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onExportBackup}
              className="h-8 gap-1.5 rounded-md border-amber-300 text-[11px] font-black text-amber-900 hover:bg-amber-100 hover:text-amber-950 [&_svg]:size-3"
            >
              <Download size={13} /> Export backup
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRerun}
              className="h-8 gap-1.5 rounded-md border-amber-300 text-[11px] font-black text-amber-900 hover:bg-amber-100 hover:text-amber-950 [&_svg]:size-3"
            >
              <RefreshCw size={13} /> Rerun check
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
