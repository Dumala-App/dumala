import React, { useEffect, useState } from 'react';
// The Tailwind stylesheet normally arrives with the workspace app (App.tsx);
// this page renders from its own small chunk, so it has to bring it along.
import '../../index.css';
import { CalendarDays, ClipboardList, Loader2, Shield, Users } from 'lucide-react';
import { useCloudRuntime } from '../../hooks/useCloudRuntime';
import {
  EMPTY_PUBLIC_TEAM_BUNDLE,
  parsePublicTeamSlug,
  type PublicTeamBundle,
  type PublicTeamResult
} from '../../cloud/teamPage';
import {
  DARK_GLASS_CLASSES,
  DARK_GLASS_DASHBOARD_SURFACE_STYLE,
  DARK_GLASS_THEME_STYLE
} from '../../theme/darkGlassTheme';

// Public, read-only team page (#/t/<slug>). Anyone with the link sees a coach's
// team showcase - one photo, roster names/numbers, lineup, and recent results -
// no login. Deliberately lite: a single RPC call, one compressed image, and the
// same Dark Glass look as the rest of the app (deep navy, cyan-tinted glass
// panels, orange accents).

const getPublicTeamSlug = (): string | undefined =>
  typeof window === 'undefined' ? undefined : parsePublicTeamSlug(window.location.hash);

const glassPanelClass = 'rounded-2xl border border-cyan-300/10 bg-[#07111f]/88 text-slate-100 shadow-lg shadow-black/20 backdrop-blur-xl';
const glassCardClass = 'rounded-xl border border-cyan-300/10 bg-[#0b1726]/66 text-slate-100 shadow-sm shadow-black/10 backdrop-blur-sm';

const SectionCard = ({ icon: Icon, title, aside, children }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className={glassPanelClass}>
    <div className={DARK_GLASS_CLASSES.panelHeader}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-orange-300/25 bg-orange-300/10 text-orange-200"><Icon size={15} /></span>
      <h2 className="text-sm font-black tracking-wide text-slate-100">{title}</h2>
      {aside && <span className="ml-auto text-[11px] font-bold text-slate-400">{aside}</span>}
    </div>
    <div className="p-4 sm:p-5">{children}</div>
  </section>
);

const resultTone = (result: PublicTeamResult) => {
  if (result.ourScore > result.opponentScore) return { label: 'W', className: 'bg-emerald-400/15 text-emerald-300 border-emerald-300/25' };
  if (result.ourScore < result.opponentScore) return { label: 'L', className: 'bg-rose-400/15 text-rose-300 border-rose-300/25' };
  return { label: 'D', className: 'bg-slate-400/15 text-slate-300 border-slate-300/25' };
};

const PublicTeamBody = ({ bundle }: { bundle: PublicTeamBundle }) => {
  const { club, page, roster, staff, lineup, results } = bundle;
  if (!club) return null;

  const wins = results.filter(r => r.ourScore > r.opponentScore).length;
  const draws = results.filter(r => r.ourScore === r.opponentScore).length;
  const losses = results.length - wins - draws;

  return (
    <div className="space-y-5">
      {page?.teamPhoto && (
        <div className={`${glassPanelClass} overflow-hidden p-1.5`}>
          <img
            src={page.teamPhoto}
            alt={`${club.name} team photo`}
            className="max-h-[420px] w-full rounded-xl object-cover"
          />
        </div>
      )}

      {lineup.formation && lineup.starters.length > 0 && (
        <SectionCard icon={ClipboardList} title="Starting lineup" aside={lineup.formation}>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {lineup.starters.map(slot => (
              <div key={slot.slotId} className={`${glassCardClass} flex items-center gap-3 px-3.5 py-2.5`}>
                <span className="flex h-8 w-11 shrink-0 items-center justify-center rounded-lg border border-orange-300/25 bg-orange-300/10 text-xs font-black uppercase text-orange-200">{slot.position}</span>
                <span className="truncate text-sm font-bold text-slate-100">{slot.name}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {roster.length > 0 && (
        <SectionCard icon={Users} title="Squad" aside={`${roster.length} players`}>
          <ul className="grid gap-2 sm:grid-cols-2">
            {roster.map(player => (
              <li key={`${player.number}-${player.name}`} className={`${glassCardClass} flex items-center gap-3 px-3.5 py-2.5`}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-300/15 bg-white/[0.05] text-sm font-black text-slate-300">{player.number}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-slate-100">{player.name}</span>
                  <span className="block truncate text-[11px] text-slate-400">{player.position}</span>
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {results.length > 0 && (
        <SectionCard icon={CalendarDays} title="Recent results" aside={`${wins}W · ${draws}D · ${losses}L`}>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {results.map((result, index) => {
              const tone = resultTone(result);
              return (
                <div key={`${result.date}-${result.opponent}-${index}`} className={`${glassCardClass} flex items-center gap-3 px-3 py-2 text-sm`}>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-black ${tone.className}`}>{tone.label}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-slate-100">vs {result.opponent}</span>
                    <span className="block truncate text-[11px] text-slate-400">{result.date}</span>
                  </span>
                  <span className="shrink-0 rounded-lg border border-cyan-300/15 bg-[#020713]/60 px-2 py-0.5 text-sm font-black text-slate-100">
                    {result.ourScore}–{result.opponentScore}
                  </span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {staff.length > 0 && (
        <SectionCard icon={Shield} title="Coaching staff">
          <div className="flex flex-wrap gap-2">
            {staff.map(member => (
              <span key={`${member.role}-${member.name}`} className={`${glassCardClass} inline-flex items-center gap-2 rounded-full px-3.5 py-1.5`}>
                <span className="text-sm font-black text-slate-100">{member.name}</span>
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{member.role}</span>
              </span>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
};

const PublicTeamView = () => {
  const runtime = useCloudRuntime();
  const slug = getPublicTeamSlug();
  const [bundle, setBundle] = useState<PublicTeamBundle | null>(null);
  const [loading, setLoading] = useState(true);

  const teamPage = runtime.enabled ? runtime.dataAccess.teamPage : null;

  useEffect(() => {
    if (!teamPage || !slug) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    teamPage.getPublicTeam(slug)
      .then(result => { if (active) setBundle(result); })
      .catch(() => { if (active) setBundle(EMPTY_PUBLIC_TEAM_BUNDLE); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [teamPage, slug]);

  const club = bundle?.club;

  return (
    <div className={DARK_GLASS_CLASSES.shell} style={DARK_GLASS_THEME_STYLE}>
      <div aria-hidden="true" className="fixed inset-0 z-0" style={DARK_GLASS_DASHBOARD_SURFACE_STYLE} />

      <div className="relative z-10">
        <header className="sticky top-0 z-20 border-b border-cyan-300/10 bg-[#07111f]/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/15 text-sm font-black text-white shadow-sm shadow-black/20"
                style={{ background: club?.logoColor ?? '#0f172a' }}
              >
                {(club?.shortName ?? club?.name ?? 'D').slice(0, 2).toUpperCase()}
              </span>
              <div className="leading-tight">
                <p className="text-[11px] font-black uppercase tracking-[.18em] text-orange-300">{club?.name ?? 'Dumala'}</p>
                <p className="text-sm font-bold text-slate-100">Team page</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 py-8">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 size={16} className="animate-spin" /> Loading team page…</div>
          ) : !bundle || !bundle.found || !club ? (
            <div className={`${glassPanelClass} mx-auto max-w-md p-10 text-center`}>
              <Users size={24} className="mx-auto text-slate-500" />
              <p className="mt-3 text-base font-black text-slate-100">Team page not available</p>
              <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-slate-400">This page isn't published yet, or the link is incorrect. Check the link with the team's coach.</p>
            </div>
          ) : (
            <>
              <section className="mb-7">
                {bundle.page?.headline && <p className="text-[11px] font-black uppercase tracking-[.18em] text-orange-300">{bundle.page.headline}</p>}
                <h1 className="mt-2 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
                  <span style={{ background: 'linear-gradient(180deg,#fff,rgba(255,255,255,.66))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{club.name}</span>
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {club.league && <span className="inline-flex items-center rounded-full border border-orange-300/30 bg-orange-300/10 px-3 py-1 text-[11px] font-bold text-orange-200">{club.league}</span>}
                  {club.stadium && <span className="inline-flex items-center rounded-full border border-cyan-300/15 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-slate-300">{club.stadium}</span>}
                  {club.founded && <span className="inline-flex items-center rounded-full border border-cyan-300/15 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-slate-300">Est. {club.founded}</span>}
                </div>
              </section>

              <PublicTeamBody bundle={bundle} />

              <footer className="mt-10 border-t border-cyan-300/10 pt-6 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-slate-500">Team page powered by Dumala</p>
              </footer>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default PublicTeamView;
