import React from 'react';
import { Eye } from 'lucide-react';
import type { CloudRuntime } from '../../cloud/runtime';
import type { CloudAuthController } from '../../hooks/useCloudAuth';
import { CloudAccountGate } from '../CloudAccountGate';
import PlayerProfileForm from './PlayerProfileForm';
import JoinTeamPanel from './JoinTeamPanel';
import PlayerSchedulePanel from './PlayerSchedulePanel';
import { apexMono } from './playerTheme';

interface ProfileTabProps {
  runtime: Extract<CloudRuntime, { enabled: true }>;
  userId: string;
  authController: CloudAuthController;
  linkedClubId: string | null;
  onLinkedClubChange: (clubId: string | null) => void;
  accountDisplayName?: string;
  accountEmail?: string;
  preview?: boolean;
}

const ProfileTab = ({
  runtime,
  userId,
  authController,
  linkedClubId,
  onLinkedClubChange,
  accountDisplayName,
  accountEmail,
  preview = false
}: ProfileTabProps) => (
  <div className="space-y-3 pt-1">
    {preview ? (
      <div className="flex items-center gap-2 rounded-lg border border-[#b9c8de]/25 bg-[#b9c8de]/[0.06] px-4 py-3">
        <Eye size={16} className="text-[#dce7f8]" />
        <p className={`${apexMono} text-[#dce7f8]`}>Preview mode — sign-in disabled, demo data</p>
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
    <PlayerSchedulePanel runtime={runtime} clubId={linkedClubId} />
    <PlayerProfileForm runtime={runtime} userId={userId} />
  </div>
);

export default ProfileTab;
