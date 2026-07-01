import React, { useState } from 'react';
import { ChevronDown, MessageSquare, RotateCcw } from 'lucide-react';
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
import { Badge } from './ui/badge';
import { Button } from './ui/button';

const WORKSPACE_GLASS_ACTION_CLASS = 'border-cyan-300/15 bg-[#0b1726]/85 text-slate-100 shadow-sm shadow-black/10 hover:border-orange-300/35 hover:bg-orange-300/10 hover:text-orange-100';

interface WorkspaceStatusBarProps {
  teamName: string;
  cloudRuntime: CloudRuntime;
  cloudAuthController?: CloudAuthController;
  resetOpen: boolean;
  onResetOpenChange: (open: boolean) => void;
  onFeedback: () => void;
  onConfirmReset: () => void;
  onSignedOut?: () => void;
}

export default function WorkspaceStatusBar({
  teamName,
  cloudRuntime,
  cloudAuthController,
  resetOpen,
  onResetOpenChange,
  onFeedback,
  onConfirmReset,
  onSignedOut
}: WorkspaceStatusBarProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const shouldShowPanel = panelOpen || resetOpen;

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
        className="absolute bottom-full left-0 z-30 mb-3 w-full rounded-2xl border border-cyan-300/10 bg-[#07111f]/95 p-2.5 text-slate-100 shadow-2xl shadow-black/35 backdrop-blur-xl transition-all duration-300 ease-out lg:left-auto lg:right-0 lg:w-[min(38rem,calc(100vw-3rem))]"
      >
        <div className="grid grid-cols-1 gap-2">
        <p className="rounded-lg border border-emerald-300/15 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-100">
          Workspace ready.
        </p>
        {cloudRuntime.enabled ? (
          <CloudAccountGate
            clubName={teamName}
            appVersion="0.0.0"
            runtime={cloudRuntime}
            authController={cloudAuthController}
            layout="compact"
            onSignedOut={onSignedOut}
          />
        ) : (
          <p className="rounded-lg border border-cyan-300/10 bg-[#0b1726]/72 px-3 py-1.5 text-xs font-medium text-slate-400">
            Local workspace is active. Cloud account sync is unavailable in this build.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Badge variant="success" className="border-emerald-300/25 bg-emerald-300/10 text-emerald-100">Saved locally</Badge>
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
