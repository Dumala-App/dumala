import React, { useState } from 'react';
import { Award, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { getChangelogBadgeClass, type ChangelogEntry } from './changelog';

// The changelog accordion, shared by the workspace Updates tab and the public
// devlog so the entries read identically on both. Each surface supplies its own
// chrome around it and passes the entries it wants shown.

interface ChangelogListProps {
  entries: ChangelogEntry[];
}

export default function ChangelogList({ entries }: ChangelogListProps) {
  const [openEntries, setOpenEntries] = useState<Record<string, boolean>>({});

  const handleToggleEntry = (entryId: string) => {
    setOpenEntries(current => ({ ...current, [entryId]: !current[entryId] }));
  };

  return (
    <div className="space-y-4">
      {entries.map(entry => {
        const isOpen = Boolean(openEntries[entry.id]);

        return (
          <div key={entry.id} className={`rounded-2xl border p-4 md:p-5 shadow-sm ${entry.accent}`}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleToggleEntry(entry.id)}
              className="h-auto w-full items-start justify-between gap-4 p-0 text-left whitespace-normal hover:bg-transparent"
              aria-expanded={isOpen}
              aria-label={`Toggle ${entry.title}`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded border border-cyan-300/25 bg-slate-950/70 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-100 shadow-sm shadow-black/30 backdrop-blur">
                    {entry.date}
                  </span>
                  {entry.badge ? (
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${getChangelogBadgeClass(entry.badge)}`}>
                      <Award size={12} aria-hidden="true" />
                      {entry.badge}
                    </span>
                  ) : null}
                </div>
                <div>
                  <h4 className="text-base font-black leading-tight text-slate-100">{entry.title}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">{entry.summary}</p>
                </div>
              </div>
              <div className="mt-0.5 shrink-0 text-slate-300">
                {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </div>
            </Button>

            {isOpen ? <div className="mt-5 border-t border-current/10 pt-5">{entry.renderContent()}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
