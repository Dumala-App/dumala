import React, { useEffect, useState } from 'react';
// The Tailwind stylesheet normally arrives with the workspace app (App.tsx);
// this page renders from its own small chunk, so it has to bring it along.
import '../../index.css';
import { Loader2, Users } from 'lucide-react';
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
// same Dark Glass palette as the rest of the app (deep navy, cyan hairlines,
// orange accents) - but laid out as an editorial page rather than a dashboard,
// so the content sits on the background instead of inside stacked panels.

const getPublicTeamSlug = (): string | undefined =>
  typeof window === 'undefined' ? undefined : parsePublicTeamSlug(window.location.hash);

const rowClass = 'flex items-baseline gap-3 border-b border-white/[0.06] py-2.5';

const Section = ({ title, aside, children }: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section>
    <div className="flex items-baseline justify-between gap-4 border-b border-cyan-300/15 pb-2">
      <h2 className="text-[11px] font-black uppercase tracking-[.22em] text-orange-300/90">{title}</h2>
      {aside && <span className="text-[11px] font-semibold tracking-wide text-slate-500">{aside}</span>}
    </div>
    <div className="mt-1">{children}</div>
  </section>
);

const resultTone = (result: PublicTeamResult) => {
  if (result.ourScore > result.opponentScore) return { label: 'W', className: 'text-emerald-300' };
  if (result.ourScore < result.opponentScore) return { label: 'L', className: 'text-rose-300' };
  return { label: 'D', className: 'text-slate-400' };
};

const PublicTeamBody = ({ bundle }: { bundle: PublicTeamBundle }) => {
  const { club, page, roster, staff, lineup, results } = bundle;
  if (!club) return null;

  const wins = results.filter(r => r.ourScore > r.opponentScore).length;
  const draws = results.filter(r => r.ourScore === r.opponentScore).length;
  const losses = results.length - wins - draws;

  return (
    <div className="space-y-10">
      {page?.teamPhoto && (
        <img
          src={page.teamPhoto}
          alt={`${club.name} team photo`}
          className="max-h-[420px] w-full rounded-2xl object-cover"
        />
      )}

      {lineup.formation && lineup.starters.length > 0 && (
        <Section title="Starting lineup" aside={lineup.formation}>
          <ul className="grid gap-x-10 sm:grid-cols-2">
            {lineup.starters.map(slot => (
              <li key={slot.slotId} className={rowClass}>
                <span className="w-9 shrink-0 text-[11px] font-black uppercase tracking-wide text-orange-300/80">{slot.position}</span>
                <span className="truncate text-sm font-semibold text-slate-100">{slot.name}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {roster.length > 0 && (
        <Section title="Squad" aside={`${roster.length} ${roster.length === 1 ? 'player' : 'players'}`}>
          <ul className="grid gap-x-10 sm:grid-cols-2">
            {roster.map(player => (
              <li key={`${player.number}-${player.name}`} className={rowClass}>
                <span className="w-7 shrink-0 text-right text-sm font-black tabular-nums text-slate-500">{player.number}</span>
                <span className="truncate text-sm font-semibold text-slate-100">{player.name}</span>
                <span className="ml-auto shrink-0 text-[11px] font-medium text-slate-500">{player.position}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {results.length > 0 && (
        <Section title="Recent results" aside={`${wins}W · ${draws}D · ${losses}L`}>
          <ul className="grid gap-x-10 sm:grid-cols-2">
            {results.map((result, index) => {
              const tone = resultTone(result);
              return (
                <li key={`${result.date}-${result.opponent}-${index}`} className={rowClass}>
                  <span className={`w-4 shrink-0 text-sm font-black ${tone.className}`}>{tone.label}</span>
                  <span className="truncate text-sm font-semibold text-slate-100">{result.opponent}</span>
                  <span className="ml-auto shrink-0 text-sm font-black tabular-nums text-slate-300">
                    {result.ourScore}–{result.opponentScore}
                  </span>
                  <span className="w-20 shrink-0 text-right text-[11px] font-medium text-slate-500">{result.date}</span>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {staff.length > 0 && (
        <Section title="Coaching staff">
          <ul className="grid gap-x-10 sm:grid-cols-2">
            {staff.map(member => (
              <li key={`${member.role}-${member.name}`} className={rowClass}>
                <span className="truncate text-sm font-semibold text-slate-100">{member.name}</span>
                <span className="ml-auto shrink-0 text-[11px] font-medium uppercase tracking-wide text-slate-500">{member.role}</span>
              </li>
            ))}
          </ul>
        </Section>
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
  const meta = club ? [club.league, club.stadium, club.founded && `Est. ${club.founded}`].filter(Boolean) : [];

  return (
    <div className={DARK_GLASS_CLASSES.shell} style={DARK_GLASS_THEME_STYLE}>
      <div aria-hidden="true" className="fixed inset-0 z-0" style={DARK_GLASS_DASHBOARD_SURFACE_STYLE} />

      <div className="relative z-10">
        <header className="sticky top-0 z-20 border-b border-cyan-300/10 bg-[#020713]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-4xl items-center gap-2.5 px-4 py-3">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-black text-white"
              style={{ background: club?.logoColor ?? '#0f172a' }}
            >
              {(club?.shortName ?? club?.name ?? 'D').slice(0, 2).toUpperCase()}
            </span>
            <p className="text-xs font-bold text-slate-300">{club?.name ?? 'Dumala'}</p>
            <span className="text-xs font-medium text-slate-600">Team page</span>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 py-10">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 size={16} className="animate-spin" /> Loading team page…</div>
          ) : !bundle || !bundle.found || !club ? (
            <div className="mx-auto max-w-md py-16 text-center">
              <Users size={24} className="mx-auto text-slate-600" />
              <p className="mt-4 text-base font-black text-slate-100">Team page not available</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">This page isn't published yet, or the link is incorrect. Check the link with the team's coach.</p>
            </div>
          ) : (
            <>
              <section className="mb-10">
                {bundle.page?.headline && <p className="text-[11px] font-black uppercase tracking-[.22em] text-orange-300">{bundle.page.headline}</p>}
                <h1 className="mt-2.5 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
                  <span style={{ background: 'linear-gradient(180deg,#fff,rgba(255,255,255,.66))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{club.name}</span>
                </h1>
                {meta.length > 0 && (
                  <p className="mt-3.5 text-xs font-medium text-slate-400">
                    {meta.map((entry, index) => (
                      <React.Fragment key={entry as string}>
                        {index > 0 && <span className="px-2 text-slate-600">·</span>}
                        {entry}
                      </React.Fragment>
                    ))}
                  </p>
                )}
              </section>

              <PublicTeamBody bundle={bundle} />

              <footer className="mt-14 border-t border-white/[0.06] pt-6">
                <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-slate-600">Team page powered by Dumala</p>
              </footer>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default PublicTeamView;
