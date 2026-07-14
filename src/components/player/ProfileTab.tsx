import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Download, Eye, Loader2, UserRound } from 'lucide-react';
import type { CloudRuntime } from '../../cloud/runtime';
import type { CloudAuthController } from '../../hooks/useCloudAuth';
import { mapRosterPlayerToReportPlayer, type ClubRosterPlayer } from '../../cloud/player';
import type { AssessmentSession } from '../../types';
import { buildAssessmentReportModel, renderAssessmentReportHtml } from '../../fprds/assessmentReport';
import { ROLE_LABELS } from '../../fprds/weights';
import { CloudAccountGate } from '../CloudAccountGate';
import PlayerProfileForm from './PlayerProfileForm';
import JoinTeamPanel from './JoinTeamPanel';
import { apexCard, apexCta, apexMono, apexMonoTight } from './playerTheme';

interface ProfileTabProps {
  runtime: Extract<CloudRuntime, { enabled: true }>;
  userId: string;
  authController: CloudAuthController;
  linkedClubId: string | null;
  linkedPlayer: ClubRosterPlayer | null;
  onLinkedClubChange: (clubId: string | null) => void;
  accountDisplayName?: string;
  accountEmail?: string;
  preview?: boolean;
}

const ProfileTab = ({
  runtime,
  userId,
  authController,
  linkedPlayer,
  onLinkedClubChange,
  accountDisplayName,
  accountEmail,
  preview = false
}: ProfileTabProps) => {
  const [assessments, setAssessments] = useState<AssessmentSession[]>([]);
  const [assessmentStatus, setAssessmentStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [assessmentMessage, setAssessmentMessage] = useState('');

  useEffect(() => {
    if (!linkedPlayer) {
      setAssessments([]);
      setAssessmentStatus('idle');
      return;
    }
    let active = true;
    setAssessmentStatus('loading');
    setAssessmentMessage('');
    runtime.dataAccess.player.listMyAssessmentSessions(linkedPlayer.id)
      .then(rows => {
        if (!active) return;
        setAssessments(rows);
        setAssessmentStatus('idle');
      })
      .catch(error => {
        if (!active) return;
        setAssessmentStatus('error');
        setAssessmentMessage(error instanceof Error ? error.message : 'Could not load your FPRDS report.');
      });
    return () => {
      active = false;
    };
  }, [linkedPlayer, runtime]);

  const latestAssessment = assessments[0] ?? null;
  const reportModel = useMemo(() => {
    if (!linkedPlayer) return null;
    return buildAssessmentReportModel(mapRosterPlayerToReportPlayer(linkedPlayer), assessments);
  }, [assessments, linkedPlayer]);

  const downloadReport = () => {
    if (!reportModel) return;
    const safeName = reportModel.player.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'player';
    const blob = new Blob([renderAssessmentReportHtml(reportModel)], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeName}-fprds-${reportModel.latest.date}-report.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3 pt-1">
      {preview ? (
        <div className="flex items-center gap-2 rounded-lg border border-[#b9c8de]/25 bg-[#b9c8de]/[0.06] px-4 py-3">
          <Eye size={16} className="text-[#dce7f8]" />
          <p className={`${apexMono} text-[#dce7f8]`}>Preview mode - sign-in disabled, demo data</p>
        </div>
      ) : (
        <CloudAccountGate
          runtime={runtime}
          authController={authController}
          bootstrapAccount={false}
          tone="dark"
          layout="compact"
        />
      )}

      <JoinTeamPanel
        runtime={runtime}
        userId={userId}
        accountDisplayName={accountDisplayName}
        accountEmail={accountEmail}
        onLinkedClubChange={onLinkedClubChange}
      />

      <PlayerProfileForm runtime={runtime} userId={userId} linkedPlayer={linkedPlayer} />

      <section className={`${apexCard} p-5`}>
        <div className="mb-4 flex items-center gap-2 text-[#d8e3fb]">
          <ClipboardList size={18} className="text-[#dce7f8]" />
          <h2 className="font-player-display text-[13px] font-semibold uppercase tracking-widest text-[#d8e3fb]">FPRDS report</h2>
        </div>

        {!linkedPlayer ? (
          <p className="text-sm leading-5 text-[#c6c6cd]/70">Join your coach's team to see your official FPRDS assessment report.</p>
        ) : assessmentStatus === 'loading' ? (
          <p className="flex items-center gap-2 text-sm text-[#c6c6cd]/75"><Loader2 size={15} className="animate-spin" /> Loading report...</p>
        ) : latestAssessment && reportModel ? (
          <div className="space-y-4">
            <div className="grid grid-cols-[auto_1fr] gap-4">
              <div className="flex h-16 w-16 flex-col items-center justify-center rounded-lg border border-[#ff6d00]/30 bg-[#ff6d00]/10">
                <span className="font-player-display text-2xl font-black text-[#eef4ff]">{latestAssessment.ovr}</span>
                <span className={apexMonoTight}>OVR</span>
              </div>
              <div className="min-w-0">
                <p className="font-player-display text-base font-bold text-[#eef4ff]">{ROLE_LABELS[latestAssessment.role]}</p>
                <p className="mt-1 text-sm text-[#c6c6cd]/75">
                  {latestAssessment.assessmentType} assessment - {latestAssessment.assessmentDate}
                </p>
                <p className={`${apexMonoTight} mt-2 text-[#ff9440]`}>{assessments.length} saved {assessments.length === 1 ? 'assessment' : 'assessments'}</p>
              </div>
            </div>
            <button type="button" onClick={downloadReport} className={`${apexCta} inline-flex items-center gap-2 px-5 py-3`}>
              <Download size={16} /> View FPRDS report
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-white/[0.06] bg-[#111c2d]/70 p-4">
            <div className="flex items-start gap-3">
              <UserRound size={18} className="mt-0.5 shrink-0 text-[#b9c8de]" />
              <div>
                <p className="text-sm font-semibold text-[#d8e3fb]">No FPRDS assessment yet</p>
                <p className="mt-1 text-sm leading-5 text-[#c6c6cd]/65">Once your coach saves an assessment for your roster spot, your report will appear here.</p>
              </div>
            </div>
          </div>
        )}

        {assessmentStatus === 'error' && <p className="mt-3 text-sm text-amber-300" role="status">{assessmentMessage}</p>}
      </section>

      <div className="pb-24" />
    </div>
  );
};

export default ProfileTab;
