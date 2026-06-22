import React, { Component } from 'react';

type BoundaryLevel = 'application' | 'view' | 'widget';

interface ErrorFallbackProps {
  boundaryName: string;
  level: BoundaryLevel;
  error: Error;
  onRetry: () => void;
  onReturnHome?: () => void;
}

interface ErrorBoundaryProps {
  boundaryName: string;
  level?: BoundaryLevel;
  onReturnHome?: () => void;
  resetKeys?: ReadonlyArray<unknown>;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

const recoveryCopy: Record<BoundaryLevel, { title: string; message: string }> = {
  application: {
    title: 'Dumala needs a quick reload',
    message:
      'Something unexpected stopped the app shell from rendering. Your workspace data stays in this browser unless you reset it yourself.'
  },
  view: {
    title: 'This section hit a display issue',
    message:
      'Only this section failed to render. You can retry it or return to Overview while your saved workspace remains untouched.'
  },
  widget: {
    title: 'This panel could not load',
    message:
      'The rest of the workspace is still available. Retry this panel when you are ready.'
  }
};

const didResetKeysChange = (previous: ReadonlyArray<unknown>, next: ReadonlyArray<unknown>) => {
  if (previous.length !== next.length) return true;
  return previous.some((value, index) => value !== next[index]);
};

export function ErrorFallback({ boundaryName, level, error, onRetry, onReturnHome }: ErrorFallbackProps) {
  const copy = recoveryCopy[level];

  return (
    <section
      className="rounded-2xl border border-rose-200 bg-white px-5 py-6 shadow-sm"
      role="alert"
      aria-labelledby={`${boundaryName.replace(/\s+/g, '-').toLowerCase()}-error-title`}
    >
      <div className="mx-auto max-w-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
          {boundaryName} recovery
        </p>
        <h2
          id={`${boundaryName.replace(/\s+/g, '-').toLowerCase()}-error-title`}
          className="mt-2 font-display text-xl font-extrabold text-slate-950"
        >
          {copy.title}
        </h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
          {copy.message}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition-colors hover:bg-slate-800"
          >
            {level === 'application' ? 'Reload Dumala' : 'Retry view'}
          </button>
          {onReturnHome && (
            <button
              type="button"
              onClick={onReturnHome}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-700 transition-colors hover:bg-slate-100"
            >
              Return to Overview
            </button>
          )}
        </div>
        {import.meta.env.DEV && (
          <details className="mt-5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <summary className="cursor-pointer font-bold text-slate-700">Developer details</summary>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap">{error.message}</pre>
          </details>
        )}
      </div>
    </section>
  );
}

export class DumalaErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[Dumala] ${this.props.boundaryName} render failure`, {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack
    });
  }

  componentDidUpdate(previousProps: ErrorBoundaryProps) {
    const previousKeys = previousProps.resetKeys ?? [];
    const nextKeys = this.props.resetKeys ?? [];
    if (this.state.error && didResetKeysChange(previousKeys, nextKeys)) {
      this.setState({ error: null });
    }
  }

  private handleRetry = () => {
    if (this.props.level === 'application') {
      window.location.reload();
      return;
    }
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <ErrorFallback
          boundaryName={this.props.boundaryName}
          level={this.props.level ?? 'view'}
          error={this.state.error}
          onRetry={this.handleRetry}
          onReturnHome={this.props.onReturnHome}
        />
      );
    }

    return this.props.children;
  }
}

export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <DumalaErrorBoundary boundaryName="Application" level="application">
      {children}
    </DumalaErrorBoundary>
  );
}

export function ViewErrorBoundary({
  viewName,
  onReturnHome,
  resetKeys,
  children
}: {
  viewName: string;
  onReturnHome?: () => void;
  resetKeys?: ReadonlyArray<unknown>;
  children: React.ReactNode;
}) {
  return (
    <DumalaErrorBoundary
      boundaryName={viewName}
      level="view"
      onReturnHome={onReturnHome}
      resetKeys={resetKeys}
    >
      {children}
    </DumalaErrorBoundary>
  );
}
