import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import UpdatesView from '../UpdatesView';
import DevlogPage from '../DevlogPage';
import { changelogEntries, inProgressItems, productChangelogEntries, roadmapSnapshotEntry, ROADMAP_SNAPSHOT_ID } from './changelog';

describe('changelog data', () => {
  it('lists dated releases newest first', () => {
    const dates = productChangelogEntries.map(entry => entry.date);

    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('uses ISO dates and unique ids', () => {
    const ids = changelogEntries.map(entry => entry.id);

    expect(new Set(ids).size).toBe(ids.length);
    changelogEntries.forEach(entry => {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('keeps the roadmap snapshot out of the shipped list', () => {
    expect(roadmapSnapshotEntry?.id).toBe(ROADMAP_SNAPSHOT_ID);
    expect(productChangelogEntries.some(entry => entry.id === ROADMAP_SNAPSHOT_ID)).toBe(false);
    expect(productChangelogEntries).toHaveLength(changelogEntries.length - 1);
  });

  // Every entry renders on the public devlog, where no coach chrome exists to
  // explain a light card, so none may carry the old light-surface styling.
  it('styles every entry for a dark surface', () => {
    changelogEntries.forEach(entry => {
      expect(entry.accent, entry.id).not.toMatch(/bg-white|bg-\w+-50\b/);
    });
  });

  // In-progress items are the "now" between Shipped and the roadmap. An item
  // that has already shipped must not be sitting in both places at once.
  it('keeps in-progress items out of the shipped changelog', () => {
    const shippedIds = new Set(changelogEntries.map(entry => entry.id));

    inProgressItems.forEach(item => {
      expect(item.id, `${item.id} is both in-progress and shipped`).not.toBe(ROADMAP_SNAPSHOT_ID);
      expect(shippedIds.has(item.id), `${item.id} is both in-progress and shipped`).toBe(false);
      expect(item.status.trim().length).toBeGreaterThan(0);
    });
    expect(new Set(inProgressItems.map(item => item.id)).size).toBe(inProgressItems.length);
  });
});

describe('devlog mirror', () => {
  it('publishes the same entries to the workspace tab and the public devlog', () => {
    const workspace = renderToStaticMarkup(<UpdatesView />);
    const devlog = renderToStaticMarkup(<DevlogPage />);

    // The point of the shared module: one entry written, both surfaces updated.
    productChangelogEntries.forEach(entry => {
      expect(workspace, `workspace missing ${entry.id}`).toContain(entry.date);
      expect(devlog, `devlog missing ${entry.id}`).toContain(entry.date);
    });
    expect(devlog).toContain('Public Team Pages');
    expect(workspace).toContain('Public Team Pages');
  });

  it('shows the current in-progress work on the public devlog', () => {
    const devlog = renderToStaticMarkup(<DevlogPage />);
    // renderToStaticMarkup escapes text, so & in a title becomes &amp;.
    const escapeHtml = (value: string) => value.replace(/&/g, '&amp;');

    expect(devlog).toContain('In progress');
    inProgressItems.forEach(item => {
      expect(devlog, `devlog missing in-progress item ${item.id}`).toContain(escapeHtml(item.title));
    });
  });

  it('keeps coach-only framing out of the public devlog', () => {
    const devlog = renderToStaticMarkup(<DevlogPage />);

    // This copy points at the in-app feedback button, which a visitor has no
    // access to, and repeats the landing page's own pitch.
    expect(devlog).not.toContain('Purpose of the App');
    expect(devlog).not.toContain('feedback button in the top-right corner');
  });

  it('offers the devlog its own navigation back to the landing page', () => {
    const devlog = renderToStaticMarkup(<DevlogPage />);

    expect(devlog).toContain('href="#/landing/features"');
    expect(devlog).toContain('href="#/app"');
  });
});
