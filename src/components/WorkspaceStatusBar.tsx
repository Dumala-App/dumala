import React, { useState } from 'react';
import { ChevronDown, CloudUpload, Loader2, MessageSquare, RotateCcw } from 'lucide-react';
import type { AccountBootstrapResult } from '../cloud/account';
import type { CloudRuntime } from '../cloud/runtime';
import type { CloudAuthController } from '../hooks/useCloudAuth';
import CloudAccountGate from './CloudAccountGate';
import PwaInstallControl from './PwaInstallControl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from './ui/alert-dialog';
import { Button } from './ui/button';

const WORKSPACE_GLASS_ACTION_CLASS = 'border-cyan-300/15 bg-[#0b1726]/85 text-slate-100 shadow-sm shadow-black/10 hover:border-orange-300/35 hover:bg-orange-300/10 hover:text-orange-100';

export type CloudBackupStatus =
  | { state: 'hidden' }
  | { state: 'needs_sign_in'; message?: string }
  | { state: 'needs_link'; message?: string }
  | { state: 'needed'; message?: string }
  | { state: 'current'; message?: string; backedUpAt?: string }
  | { state: 'running'; message?: string }
  | { state: 'error'; message: string };

interface WorkspaceStatusBarProps {
  teamName: string;
  cloudRuntime: CloudRuntime;
  cloudAuthController?: CloudAuthController;
  resetOpen: boolean;
  onResetOpenChange: (open: boolean) => void;
  onFeedback: () => void;
  onConfirmReset: () => void;
  onSignedOut?: () => void;
  onCloudWorkspaceReady?: (result: AccountBootstrapResult) => void;
  cloudBackupStatus?: CloudBackupStatus;
  onCloudBackup?: () => Promise<void>;
}

export default function WorkspaceStatusBar({
  teamName,
  cloudRuntime,
  cloudAuthController,
  resetOpen,
  onResetOpenChange,
  onFeedback,
  onConfirmReset,
  onSignedOut,
  onCloudWorkspaceReady,
  cloudBackupStatus = { state: 'hidden' },
  onCloudBackup
}: WorkspaceStatusBarProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [cloudBackupOpen, setCloudBackupOpen] = useState(false);
  const shouldShowPanel = panelOpen || resetOpen;
  const canRunCloudBackup = Boolean(onCloudBackup) && (
    cloudBackupStatus.state === 'needed'
    || cloudBackupStatus.state === 'error'
  );
  const cloudBackupTone = cloudBackupStatus.state === 'current'
    ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100'
    : cloudBackupStatus.state === 'running'
      ? 'border-amber-300/30 bg-amber-300/10 text-amber-100'
      : cloudBackupStatus.state === 'needed' || cloudBackupStatus.state === 'error'
        ? 'border-rose-300/30 bg-rose-300/10 text-rose-100'
        : 'border-slate-500/30 bg-slate-500/10 text-slate-300';
  const cloudBackupLabel = cloudBackupStatus.state === 'current'
    ? 'Backed up'
    : cloudBackupStatus.state === 'running'
      ? 'Backing up'
      : cloudBackupStatus.state === 'needed' || cloudBackupStatus.state === 'error'
        ? 'Not backed up'
        : 'Cloud pending';

  return (
    <div
      id="quick-alert-drawer"
      aria-label="Workspace status"
      className="relative w-full lg:flex lg:flex-col lg:items-end"
    >
      <button
        type="button"
        onClick={() => setPanelOpen(open => !open)}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/10 bg-[#07111f]/90 px-4 py-2 text-xs font-bold text-slate-100 shadow-lg shadow-black/20 backdrop-blur-xl transition hover:border-orange-300/30 hover:bg-orange-300/10 hover:text-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/35 sm:w-auto sm:min-w-56"
        aria-expanded={shouldShowPanel}
        aria-controls="workspace-status-panel"
      >
        <ChevronDown size={14} className={`transition-transform ${shouldShowPanel ? '' : 'rotate-180'}`} aria-hidden="true" />
        Workspace controls
      </button>
      <section
        id="workspace-status-panel"
        hidden={!shouldShowPanel}
        className="absolute bottom-full left-0 z-50 mb-3 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-cyan-300/10 bg-[#07111f]/95 p-2 text-slate-100 shadow-2xl shadow-black/35 backdrop-blur-xl transition-all duration-300 ease-out lg:bottom-auto lg:left-auto lg:right-full lg:top-0 lg:mb-0 lg:mr-3"
      >
        <div className="grid grid-cols-1 gap-1.5">
          {cloudRuntime.enabled ? (
            <CloudAccountGate
              clubName={teamName}
              appVersion="0.0.0"
              runtime={cloudRuntime}
              authController={cloudAuthController}
              tone="dark"
              layout="compact"
              onSignedOut={onSignedOut}
              onBootstrapComplete={onCloudWorkspaceReady}
            />
          ) : (
            <p className="rounded-lg border border-emerald-300/15 bg-emerald-300/10 px-2.5 py-1.5 text-[11px] font-bold text-emerald-100">
              Workspace ready
            </p>
          )}

          {cloudRuntime.enabled && cloudBackupStatus.state !== 'hidden' && (
            <div className="rounded-lg border border-cyan-300/10 bg-[#050b14]/90 p-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`inline-flex min-h-7 items-center gap-1.5 rounded-md border px-2 text-[10px] font-black ${cloudBackupTone}`}>
                  {cloudBackupStatus.state === 'running' ? <Loader2 size={11} className="animate-spin" /> : <CloudUpload size={11} />}
                  {cloudBackupLabel}
                </span>
                <AlertDialog open={cloudBackupOpen} onOpenChange={setCloudBackupOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!canRunCloudBackup}
                      className={`h-7 px-2.5 text-[10px] ${WORKSPACE_GLASS_ACTION_CLASS} disabled:cursor-not-allowed disabled:opacity-55`}
                    >
                      <CloudUpload size={10} /> Cloud backup
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Back up this workspace?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Dumala will create a local Full Workspace backup first, then upload this roster, staff, schedule, bulletins, assessments, payments, training, tactics, and standings to your linked cloud workspace. Your browser copy stays here.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          setCloudBackupOpen(false);
                          void onCloudBackup?.();
                        }}
                      >
                        Start backup
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              {cloudBackupStatus.state !== 'current' && cloudBackupStatus.message && (
                <p className="mt-1.5 text-[10px] font-semibold leading-4 text-slate-400">
                  {cloudBackupStatus.message}
                </p>
              )}
              {cloudBackupStatus.state === 'current' && (
                <p className="mt-1.5 text-[10px] font-semibold leading-4 text-emerald-200/80">
                  Cloud copy matches this local workspace.
                </p>
              )}
            </div>
          )}

        <div className="flex flex-wrap gap-1.5">
          <PwaInstallControl tone="darkGlass" />
          <Button
            type="button"
            onClick={onFeedback}
            variant="outline"
            size="sm"
            className={`h-7 px-2.5 text-[10px] ${WORKSPACE_GLASS_ACTION_CLASS}`}
          >
            <MessageSquare size={10} /> Feedback
          </Button>
          <AlertDialog open={resetOpen} onOpenChange={onResetOpenChange}>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 border-cyan-300/15 bg-[#0b1726]/85 px-2.5 text-[10px] text-slate-100 shadow-sm shadow-black/10 hover:border-rose-300/35 hover:bg-rose-300/10 hover:text-rose-100"
              >
                <RotateCcw size={10} /> Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset workspace?</AlertDialogTitle>
                <AlertDialogDescription>
                  This clears roster, payments, schedule, tactics, assessments, and statistics for this team workspace. Your account stays signed in.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onConfirmReset}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Reset workspace
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        </div>
      </section>
    </div>
  );
}
