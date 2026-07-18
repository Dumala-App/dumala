import React from 'react';
import { inProgressItems } from './changelog';

// The "In progress" section of the devlog: what the team is actively building
// right now, rendered from the shared inProgressItems list. Renders nothing when
// that list is empty, so the section can disappear cleanly between milestones.
//
// A live pulse on each card is what tells this apart at a glance from the dated
// Shipped entries and the Roadmap Snapshot — this is work happening now. The
// reduced-motion rule in landing-page.css calms the pulse for anyone who asks.

export default function NowBuilding() {
  if (inProgressItems.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {inProgressItems.map(item => {
        const Icon = item.icon;

        return (
          <div
            key={item.id}
            className="rounded-2xl border border-emerald-400/20 bg-[linear-gradient(150deg,rgba(16,185,129,0.10),rgba(6,182,212,0.05)_48%,rgba(2,7,19,0.30))] p-5 shadow-sm shadow-black/20"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-100">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                {item.status}
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-400/25 bg-emerald-400/10 text-emerald-200">
                <Icon size={17} aria-hidden="true" />
              </span>
            </div>
            <h3 className="mt-3 text-base font-black leading-tight text-slate-100">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.summary}</p>
          </div>
        );
      })}
    </div>
  );
}
