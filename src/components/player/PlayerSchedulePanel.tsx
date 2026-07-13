import React, { useEffect, useState } from 'react';
import { CalendarDays, Loader2 } from 'lucide-react';
import type { CloudRuntime } from '../../cloud/runtime';
import type { TeamScheduleEntry } from '../../cloud/player';

interface PlayerSchedulePanelProps {
  runtime: Extract<CloudRuntime, { enabled: true }>;
  clubId: string | null;
}

const typeLabel: Record<string, string> = {
  league: 'League',
  cup: 'Cup',
  friendly: 'Friendly',
  training: 'Training',
  meeting: 'Meeting'
};

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

const PlayerSchedulePanel = ({ runtime, clubId }: PlayerSchedulePanelProps) => {
  const [entries, setEntries] = useState<TeamScheduleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!clubId) {
      setEntries([]);
      return;
    }
    let active = true;
    setLoading(true);
    setError('');
    runtime.dataAccess.player
      .listMyTeamSchedule(clubId)
      .then(rows => {
        if (active) setEntries(rows);
      })
      .catch(err => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load your schedule.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [runtime, clubId]);

  const upcoming = entries.filter(entry => entry.status === 'upcoming');

  return (
    <section className="apex-card rounded-xl border border-white/[0.06] p-5">
      <div className="mb-4 flex items-center gap-2 text-[#d8e3fb]">
        <CalendarDays size={18} className="text-[#dce7f8]" />
        <h2 className="font-player-display text-[13px] font-semibold uppercase tracking-widest text-[#d8e3fb]">Team schedule</h2>
      </div>

      {!clubId ? (
        <p className="text-sm text-[#c6c6cd]/70">Join a team to see your fixtures, training, and meetings here.</p>
      ) : loading ? (
        <div className="flex items-center gap-2 text-sm text-[#c6c6cd]">
          <Loader2 size={16} className="animate-spin" /> Loading your schedule…
        </div>
      ) : error ? (
        <p className="text-sm text-amber-400" role="alert">{error}</p>
      ) : upcoming.length === 0 ? (
        <p className="text-sm text-[#c6c6cd]/70">No upcoming events on your team's calendar yet.</p>
      ) : (
        <ul className="space-y-2">
          {upcoming.map(entry => (
            <li key={entry.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-[#111c2d]/80 px-3 py-2">
              <div>
                <p className="text-sm font-bold text-[#d8e3fb]">
                  {entry.type === 'training' || entry.type === 'meeting' ? typeLabel[entry.type] : `vs ${entry.opponent}`}
                </p>
                <p className="text-xs text-[#c6c6cd]/70">
                  {formatDate(entry.event_date)}
                  {entry.event_time ? ` · ${entry.event_time}` : ''}
                  {entry.location ? ` · ${entry.location}` : ''}
                </p>
              </div>
              <span className="rounded-full border border-slate-600 bg-slate-700/30 px-2 py-0.5 text-[11px] font-bold text-[#c6c6cd]">
                {typeLabel[entry.type] ?? entry.type}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default PlayerSchedulePanel;
