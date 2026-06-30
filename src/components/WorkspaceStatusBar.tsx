import React, { useEffect, useRef, useState } from 'react';
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

const AUTO_HIDE_DELAY_MS = 7000;

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
  const [collapsed, setCollapsed] = useState(false);
  const hideTimeoutRef = useRef<number | null>(null);

  const clearHideTimer = () => {
    if (hideTimeoutRef.current === null || typeof window === 'undefined') return;
    window.clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = null;
  };

  const scheduleHide = () => {
    clearHideTimer();
    if (resetOpen || typeof window === 'undefined') return;
    hideTimeoutRef.current = window.setTimeout(() => {
      setCollapsed(true);
      hideTimeoutRef.current = null;
    }, AUTO_HIDE_DELAY_MS);
  };

  const revealStatusBar = () => {
    setCollapsed(false);
    clearHideTimer();
  };

  const revealStatusBarTemporarily = () => {
    setCollapsed(false);
    scheduleHide();
  };

  useEffect(() => {
    if (resetOpen) {
      clearHideTimer();
      setCollapsed(false);
      return;
    }

    scheduleHide();
    return clearHideTimer;
  }, [resetOpen]);

  return (
    <div
      id="quick-alert-drawer"
      aria-label="Workspace status"
      onPointerEnter={revealStatusBar}
      onPointerLeave={scheduleHide}
      onFocusCapture={revealStatusBar}
      onBlurCapture={scheduleHide}
      onTouchStart={revealStatusBarTemporarily}
      className="relative"
    >
      {collapsed && (
        <button
          type="button"
          onClick={revealStatusBarTemporarily}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card/90 px-3 py-2 text-xs font-bold text-muted-foreground shadow-sm backdrop-blur transition hover:border-primary/25 hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto sm:min-w-56 sm:px-4"
          aria-expanded="false"
          aria-controls="workspace-status-panel"
        >
          <ChevronDown size={14} aria-hidden="true" />
          Workspace controls
        </button>
      )}
      {!collapsed && (
        <section
          id="workspace-status-panel"
          className="rounded-2xl border border-border bg-card/90 p-3 text-card-foreground shadow-sm backdrop-blur transition-all duration-300 ease-out"
        >
        <div className="grid gap-3 xl:grid-cols-[minmax(17rem,1fr)_minmax(19rem,28rem)_auto] xl:items-center">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success"></span>
          </span>
          <p className="text-xs font-medium leading-relaxed text-muted-foreground">
            <strong className="font-bold text-foreground">Workspace ready.</strong> Results update your league table and player statistics.
          </p>
        </div>

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
          <p className="rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
            Local workspace is active. Cloud account sync is unavailable in this build.
          </p>
        )}

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <Badge variant="success">Saved locally</Badge>
          <PwaInstallControl />
          <Button
            type="button"
            onClick={onFeedback}
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-[10px]"
          >
            <MessageSquare size={10} /> Feedback
          </Button>
          <AlertDialog open={resetOpen} onOpenChange={onResetOpenChange}>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-[10px] hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
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
      )}
    </div>
  );
}
