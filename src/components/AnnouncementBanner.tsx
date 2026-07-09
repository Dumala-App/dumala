import { useEffect, useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import type { CloudRuntime } from '../cloud/runtime';
import type { AnnouncementKind, AnnouncementRecord } from '../cloud/marketing';

const DISMISSED_STORAGE_KEY = 'dumala.dismissedAnnouncements';

const readDismissedIds = (): string[] => {
  try {
    const raw = window.localStorage.getItem(DISMISSED_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

const storeDismissedIds = (ids: string[]) => {
  try {
    window.localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(ids.slice(-50)));
  } catch {
    // Dismissals are a convenience; ignore storage failures (private mode, quota).
  }
};

const kindTone: Record<AnnouncementKind, string> = {
  info: 'border-sky-300/25 bg-sky-300/10 text-sky-100',
  feature: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100',
  maintenance: 'border-amber-300/25 bg-amber-300/10 text-amber-100',
  promo: 'border-orange-300/25 bg-orange-300/10 text-orange-100'
};

export default function AnnouncementBanner({ runtime }: { runtime: CloudRuntime }) {
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => readDismissedIds());

  useEffect(() => {
    if (!runtime.enabled) return;
    let cancelled = false;
    runtime.dataAccess.marketing.listActiveAnnouncements()
      .then(rows => {
        if (!cancelled) setAnnouncements(rows);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [runtime]);

  const visible = announcements.filter(announcement => !dismissedIds.includes(announcement.id));
  if (visible.length === 0) return null;

  const dismiss = (id: string) => {
    const next = [...dismissedIds, id];
    setDismissedIds(next);
    storeDismissedIds(next);
  };

  return (
    <div className="space-y-2" aria-live="polite">
      {visible.map(announcement => (
        <div
          key={announcement.id}
          role="status"
          className={`flex items-start gap-3 rounded-2xl border p-4 shadow-lg shadow-black/15 backdrop-blur-sm ${kindTone[announcement.kind] ?? kindTone.info}`}
        >
          <Megaphone size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black">{announcement.title}</p>
            <p className="mt-0.5 text-xs font-medium leading-relaxed opacity-90">{announcement.body}</p>
          </div>
          <button
            type="button"
            onClick={() => dismiss(announcement.id)}
            aria-label={`Dismiss announcement: ${announcement.title}`}
            className="shrink-0 rounded-lg p-1 opacity-70 transition hover:bg-white/10 hover:opacity-100"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
