import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { roadmapSnapshotEntry } from './changelog';

// The roadmap snapshot card, shared by the workspace Updates tab and the public
// devlog. It is what is coming rather than what shipped, so it sits outside the
// dated changelog on both surfaces.

export default function RoadmapSnapshot() {
  const [isOpen, setIsOpen] = useState(false);

  if (!roadmapSnapshotEntry) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-sm shadow-black/20 md:p-5">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setIsOpen(current => !current)}
        className="h-auto w-full items-start justify-between gap-4 p-0 text-left whitespace-normal hover:bg-transparent"
        aria-expanded={isOpen}
        aria-label={`${isOpen ? 'Minimize' : 'Expand'} Roadmap Snapshot`}
      >
        <div className="flex flex-wrap items-start gap-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">Roadmap Snapshot</span>
            <h4 className="mt-1 text-lg font-black text-slate-100">{roadmapSnapshotEntry.title}</h4>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-400">{roadmapSnapshotEntry.summary}</p>
          </div>
          <span className="rounded border border-cyan-300/25 bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-100 shadow-sm shadow-black/30">
            Updated {roadmapSnapshotEntry.date}
          </span>
        </div>
        <div className="mt-1 shrink-0 text-slate-300">
          {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
      </Button>
      {isOpen ? <div className="mt-4 border-t border-slate-800 pt-4">{roadmapSnapshotEntry.renderContent()}</div> : null}
    </div>
  );
}
