import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { DumalaErrorBoundary, ErrorFallback } from './ErrorBoundary';

describe('Dumala error boundaries', () => {
  it('creates recoverable boundary state from a render error', () => {
    const error = new Error('Chart exploded');
    expect(DumalaErrorBoundary.getDerivedStateFromError(error)).toEqual({ error });
  });

  it('renders a view fallback without suggesting data reset', () => {
    const html = renderToStaticMarkup(
      <ErrorFallback
        boundaryName="Tactics"
        level="view"
        error={new Error('Board failed')}
        onRetry={vi.fn()}
        onReturnHome={vi.fn()}
      />
    );

    expect(html).toContain('Tactics recovery');
    expect(html).toContain('Only this section failed to render');
    expect(html).toContain('Retry view');
    expect(html).toContain('Return to Overview');
    expect(html).not.toContain('Reset');
  });

  it('renders an application fallback that preserves workspace data messaging', () => {
    const html = renderToStaticMarkup(
      <ErrorFallback
        boundaryName="Application"
        level="application"
        error={new Error('Shell failed')}
        onRetry={vi.fn()}
      />
    );

    expect(html).toContain('Dumala needs a quick reload');
    expect(html).toContain('Your workspace data stays in this browser');
    expect(html).toContain('Reload Dumala');
  });
});
