import React from 'react';
// Tailwind normally arrives with the workspace app (App.tsx); this page renders
// from its own chunk, so it has to bring the stylesheet along itself.
import '../index.css';
import '../landing-page.css';
import ChangelogList from './updates/ChangelogList';
import NowBuilding from './updates/NowBuilding';
import RoadmapSnapshot from './updates/RoadmapSnapshot';
import { inProgressItems, productChangelogEntries } from './updates/changelog';

// Public devlog (#/devlog): the changelog coaches read in League & Updates,
// published on the marketing site without a login. Both surfaces render the
// same entries from ./updates/changelog, so writing one entry updates both.
//
// It is a route rather than a landing section on purpose: the changelog is a
// long, ever-growing document, and folding it into the marketing page would
// make every visitor download all of it before seeing the hero.
//
// There is deliberately no particle backdrop here. The landing page animates a
// canvas behind a single screen of copy; this page is a long read, and running
// a per-frame simulation behind it the whole way down buys nothing.

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Format an ISO date without going through Date, which would shift the day west of UTC. */
const formatEntryDate = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
};

const LANDING_SECTIONS = [
  { id: 'value', label: 'How it works' },
  { id: 'features', label: 'Features' },
  { id: 'pricing-plans', label: 'Pricing' },
  { id: 'fit', label: 'Why Dumala' }
];

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '.22em',
  textTransform: 'uppercase',
  color: '#FF9E5E'
};

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: "'Manrope', sans-serif",
  fontWeight: 800,
  letterSpacing: '-.02em',
  fontSize: 20,
  margin: 0,
  color: '#F5F7FB'
};

const metaPillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  border: '1px solid rgba(255,255,255,.10)',
  background: 'rgba(255,255,255,.035)',
  borderRadius: 999,
  padding: '7px 13px',
  fontSize: 12,
  fontWeight: 700,
  color: '#DDE4EF'
};

export default function DevlogPage() {
  // Newest entry first; the list is sorted by date in the data module.
  const latestEntry = productChangelogEntries[0];

  return (
    <div
      className="dc-root"
      style={{
        minHeight: '100vh',
        // A static wash stands in for the landing's animated canvas.
        background: 'radial-gradient(1100px 620px at 50% -8%, rgba(255,138,61,.10), transparent 62%), #04091A',
        color: '#F5F7FB',
        fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
        overflowX: 'hidden'
      }}
    >
      <header style={{ position: 'fixed', left: 0, right: 0, top: 0, zIndex: 40, borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(4,9,26,.78)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, padding: '0 24px' }}>
          <nav className="dc-header-nav" style={{ marginRight: 'auto' }}>
            {LANDING_SECTIONS.map(({ id, label }) => (
              <a key={id} href={`#/landing/${id}`} className="dc-nav-link" style={{ textDecoration: 'none' }}>{label}</a>
            ))}
            <a href="#/devlog" aria-current="page" className="dc-nav-link" style={{ textDecoration: 'none', color: '#F5F7FB' }}>Devlog</a>
          </nav>
          <a href="#/app" className="dc-openapp">Open app</a>
        </div>
      </header>

      <main style={{ maxWidth: 940, margin: '0 auto', padding: '124px 20px 64px' }}>
        {/* Hero */}
        <div style={{ maxWidth: 680 }}>
          <p style={eyebrowStyle}>Devlog</p>
          <h1
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 800,
              letterSpacing: '-.03em',
              fontSize: 'clamp(2rem,4.4vw,2.9rem)',
              lineHeight: 1.12,
              margin: '16px 0 0'
            }}
          >
            <span style={{ background: 'linear-gradient(180deg,#fff,rgba(255,255,255,.62))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Every change, </span>
            <span style={{ background: 'linear-gradient(180deg,#FFB37E,#FF8A3D)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>as it ships.</span>
          </h1>
          <p style={{ margin: '18px 0 0', fontSize: 15.5, lineHeight: 1.7, color: '#8A96AD' }}>
            Dumala is built in the open, one week at a time. This is the same development log coaches read inside the app — what shipped, why it was built, and what is coming next.
          </p>

          {latestEntry ? (
            <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span style={metaPillStyle}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: '#4ADE80', boxShadow: '0 0 0 3px rgba(74,222,128,.16)' }} aria-hidden="true" />
                Updated {formatEntryDate(latestEntry.date)}
              </span>
              {inProgressItems.length > 0 ? (
                <span style={metaPillStyle}>{inProgressItems.length} in progress</span>
              ) : null}
              <span style={metaPillStyle}>{productChangelogEntries.length} updates shipped</span>
            </div>
          ) : null}
        </div>

        {/* In progress — hidden when nothing is actively being built */}
        {inProgressItems.length > 0 ? (
          <section style={{ marginTop: 52 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
              <h2 style={sectionHeadingStyle}>In progress</h2>
              <span style={{ height: 1, flex: 1, background: 'rgba(255,255,255,.08)' }} aria-hidden="true" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#5C6880' }}>Building now</span>
            </div>
            <NowBuilding />
          </section>
        ) : null}

        {/* What's next */}
        <section style={{ marginTop: 44 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
            <h2 style={sectionHeadingStyle}>What&apos;s next</h2>
            <span style={{ height: 1, flex: 1, background: 'rgba(255,255,255,.08)' }} aria-hidden="true" />
          </div>
          <RoadmapSnapshot />
        </section>

        {/* Shipped */}
        <section style={{ marginTop: 44 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
            <h2 style={sectionHeadingStyle}>Shipped</h2>
            <span style={{ height: 1, flex: 1, background: 'rgba(255,255,255,.08)' }} aria-hidden="true" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#5C6880' }}>Newest first</span>
          </div>
          <ChangelogList entries={productChangelogEntries} />
        </section>

        {/* Footer */}
        <div style={{ marginTop: 52, paddingTop: 22, borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#43506B' }}>© {new Date().getFullYear()} Dumala. Built for coaches.</p>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <a href="#/" className="dc-foot-link" style={{ textDecoration: 'none' }}>Back to home</a>
            <a href="#/app" className="dc-foot-link" style={{ textDecoration: 'none' }}>Open app</a>
          </div>
        </div>
      </main>
    </div>
  );
}
