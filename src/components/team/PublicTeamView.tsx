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
  type PublicTeamClub,
  type PublicTeamResult
} from '../../cloud/teamPage';
import {
  DARK_GLASS_CLASSES,
  DARK_GLASS_DASHBOARD_SURFACE_STYLE,
  DARK_GLASS_THEME_STYLE
} from '../../theme/darkGlassTheme';

// Public, read-only team page (#/t/<slug>). Anyone with the link sees a coach's
// team showcase - logo, one photo, roster names/numbers, lineup, and recent
// results - no login. Deliberately lite: a single RPC call and one compressed
// image. Laid out as tinted panels rather than one long list, borrowing the
// Game Plan modal's language (orange identity panel, cyan/indigo strategy
// panel, plain glass squad list) so the page reads as part of the same app.

// Only the most recent handful of matches; a public page is a highlight, not an
// archive. The RPC sends up to 10 so the cut stays a display choice.
const MAX_VISIBLE_RESULTS = 5;

// Who runs the team goes first; everyone else keeps the RPC's name order. Roles
// are free text (onboarding writes "Manager / Coach" or "Head Coach", the roster
// editor adds "Founder", "Team Owner", and friends), so match loosely and let
// anything unrecognised fall to the back rather than dropping it.
const STAFF_ROLE_PRIORITY = [
  'team manager',
  'manager / coach',
  'manager',
  'head coach',
  'coach',
  'assistant coach'
];

const staffRank = (role: string): number => {
  const index = STAFF_ROLE_PRIORITY.indexOf(role.trim().toLowerCase());
  return index === -1 ? STAFF_ROLE_PRIORITY.length : index;
};

/** Leadership first, then the rest of the staff in the order the RPC sent them. */
export const orderStaffByRole = <T extends { role: string }>(staff: readonly T[]): T[] =>
  [...staff].sort((a, b) => staffRank(a.role) - staffRank(b.role));

const getPublicTeamSlug = (): string | undefined =>
  typeof window === 'undefined' ? undefined : parsePublicTeamSlug(window.location.hash);

const eyebrowClass = 'text-[9px] font-black uppercase tracking-widest';
const pillClass = 'rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[10px] font-bold text-slate-300';
const identityPanelClass = 'rounded-2xl border border-orange-300/12 bg-[linear-gradient(145deg,rgba(249,115,22,0.13),rgba(14,165,233,0.06)_44%,rgba(15,23,42,0.2))] p-4';
const lineupPanelClass = 'relative overflow-hidden rounded-2xl border border-cyan-300/10 bg-[linear-gradient(135deg,rgba(99,102,241,0.1),rgba(16,185,129,0.08)_45%,rgba(7,17,31,0.86))] p-4';
const squadPanelClass = 'rounded-2xl border border-cyan-300/10 bg-[#0b1726]/58 p-4';

const TeamLogo = ({ club, className }: { club: PublicTeamClub; className: string }) =>
  club.logoUrl ? (
    <img
      src={club.logoUrl}
      alt={`${club.name} logo`}
      className={`${className} border border-white/10 bg-[#07111f] object-contain`}
    />
  ) : (
    <span
      className={`${className} flex items-center justify-center border border-white/10 font-black text-white`}
      style={{ background: club.logoColor }}
      aria-hidden="true"
    >
      {(club.shortName ?? club.name).slice(0, 2).toUpperCase()}
    </span>
  );

const resultTone = (result: PublicTeamResult) => {
  if (result.ourScore > result.opponentScore) {
    return { label: 'W', text: 'text-emerald-300', panel: 'border-emerald-300/25 bg-emerald-400/[0.07]' };
  }
  if (result.ourScore < result.opponentScore) {
    return { label: 'L', text: 'text-rose-300', panel: 'border-rose-300/25 bg-rose-400/[0.06]' };
  }
  return { label: 'D', text: 'text-slate-300', panel: 'border-white/10 bg-white/[0.03]' };
};

const PublicTeamBody = ({ bundle }: { bundle: PublicTeamBundle }) => {
  const { club, page, roster, staff, lineup, results } = bundle;
  if (!club) return null;

  const visibleResults = results.slice(0, MAX_VISIBLE_RESULTS);
  const wins = visibleResults.filter(r => r.ourScore > r.opponentScore).length;
  const draws = visibleResults.filter(r => r.ourScore === r.opponentScore).length;
  const losses = visibleResults.length - wins - draws;

  const hasLineup = Boolean(lineup.formation) && lineup.starters.length > 0;
  const hasRoster = roster.length > 0;

  // Keep the row filled when a coach hides a section.
  const identitySpan = hasLineup && hasRoster ? 'lg:col-span-3' : hasLineup || hasRoster ? 'lg:col-span-5' : 'lg:col-span-12';
  const lineupSpan = hasRoster ? 'lg:col-span-5' : 'lg:col-span-7';
  const squadSpan = hasLineup ? 'lg:col-span-4' : 'lg:col-span-7';

  return (
    <div className="space-y-4">
      {page?.teamPhoto && (
        <img
          src={page.teamPhoto}
          alt={`${club.name} team photo`}
          className="max-h-[380px] w-full rounded-2xl border border-cyan-300/10 object-cover"
        />
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <aside className={`${identityPanelClass} ${identitySpan}`}>
          <span className={`${eyebrowClass} text-orange-100`}>The club</span>
          <h2 className="mt-2 text-2xl font-black leading-tight text-white">{club.name}</h2>
          {club.stadium && <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-300">{club.stadium}</p>}

          <div className="mt-4 flex flex-wrap gap-1.5">
            {club.league && <span className={pillClass}>{club.league}</span>}
            {club.founded && <span className={pillClass}>Est. {club.founded}</span>}
            {lineup.matchFormat && <span className={pillClass}>{lineup.matchFormat}</span>}
          </div>

          {staff.length > 0 && (
            <div className="mt-6 space-y-3">
              <span className={`${eyebrowClass} text-slate-500`}>Coaching staff</span>
              <div className="space-y-2">
                {orderStaffByRole(staff).map(member => (
                  <div key={`${member.role}-${member.name}`} className="flex min-w-0 items-center justify-between gap-3 border-b border-white/[0.06] pb-2 last:border-b-0">
                    <span className="shrink-0 text-[8px] font-black uppercase tracking-widest text-slate-500">{member.role}</span>
                    <span className="min-w-0 truncate text-[11px] font-bold text-slate-100">{member.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {hasLineup && (
          <section className={`${lineupPanelClass} ${lineupSpan}`}>
            <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent" />
            <div className="flex items-center justify-between gap-2">
              <span className={`${eyebrowClass} text-cyan-100`}>Starting lineup</span>
              <span className="rounded-full border border-orange-300/15 bg-orange-300/10 px-2.5 py-1 text-[9px] font-black text-orange-100">{lineup.formation}</span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
              {lineup.starters.map(slot => (
                <div key={slot.slotId} className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-2 border-b border-white/[0.055] py-1.5 last:border-b-0">
                  <span className="text-[8px] font-black uppercase tracking-widest text-orange-200">{slot.position}</span>
                  <span className="min-w-0 truncate text-[11px] font-bold text-slate-100">{slot.name}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-cyan-300/10 pt-4">
              <div className="rounded-xl border border-cyan-300/10 bg-[#07111f]/45 p-3">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Squad</span>
                <p className="mt-1 text-[11px] font-semibold text-slate-300">
                  {roster.length} player{roster.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="rounded-xl border border-cyan-300/10 bg-[#07111f]/45 p-3">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Last {visibleResults.length}</span>
                <p className="mt-1 text-[11px] font-semibold text-slate-300">
                  {visibleResults.length > 0 ? `${wins}W · ${draws}D · ${losses}L` : 'No results yet'}
                </p>
              </div>
            </div>
          </section>
        )}

        {hasRoster && (
          <aside className={`${squadPanelClass} ${squadSpan}`}>
            <div className="flex items-center justify-between gap-2 border-b border-cyan-300/10 pb-3">
              <span className={`${eyebrowClass} text-slate-500`}>Squad</span>
              <span className="rounded-full border border-orange-300/15 bg-orange-300/10 px-2.5 py-1 text-[9px] font-black text-orange-100">
                {roster.length} player{roster.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-x-3 gap-y-1.5 sm:grid-cols-2">
              {roster.map(player => (
                <div key={`${player.number}-${player.name}`} className="grid min-w-0 grid-cols-[1.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 border-b border-white/[0.055] py-1.5 last:border-b-0">
                  <span className="text-[9px] font-black tabular-nums text-slate-600">{String(player.number).padStart(2, '0')}</span>
                  <span className="min-w-0 truncate text-[11px] font-bold text-slate-100">{player.name}</span>
                  <span className="truncate text-right text-[8px] font-black uppercase text-orange-200">{player.position}</span>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {visibleResults.length > 0 && (
        <section className="rounded-2xl border border-cyan-300/10 bg-[#0b1726]/58 p-4">
          <div className="flex items-center justify-between gap-2 border-b border-cyan-300/10 pb-3">
            <span className={`${eyebrowClass} text-slate-500`}>Recent results</span>
            <span className="text-[10px] font-bold text-slate-500">{wins}W · {draws}D · {losses}L</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {visibleResults.map((result, index) => {
              const tone = resultTone(result);
              return (
                <div key={`${result.date}-${result.opponent}-${index}`} className={`rounded-xl border p-3 ${tone.panel}`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`text-[10px] font-black ${tone.text}`}>{tone.label}</span>
                    <span className="text-sm font-black tabular-nums text-slate-100">{result.ourScore}–{result.opponentScore}</span>
                  </div>
                  <p className="mt-2 truncate text-[11px] font-bold text-slate-100">{result.opponent}</p>
                  <p className="mt-0.5 truncate text-[9px] font-semibold uppercase tracking-wide text-slate-500">{result.date}</p>
                </div>
              );
            })}
          </div>
        </section>
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
        <main className="mx-auto max-w-5xl px-4 py-10">
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
              <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                <TeamLogo club={club} className="h-20 w-20 shrink-0 rounded-2xl text-2xl sm:h-24 sm:w-24 sm:text-3xl" />
                <div className="min-w-0">
                  {bundle.page?.headline && <p className={`${eyebrowClass} text-orange-300`}>{bundle.page.headline}</p>}
                  <h1 className="mt-1.5 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
                    <span style={{ background: 'linear-gradient(180deg,#fff,rgba(255,255,255,.66))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{club.name}</span>
                  </h1>
                </div>
              </section>

              <PublicTeamBody bundle={bundle} />

              <footer className="mt-10 border-t border-white/[0.06] pt-6">
                <a
                  href="https://dumala.asia"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-500 underline-offset-4 transition-colors hover:text-orange-300 hover:underline"
                >
                  Powered by dumala.asia
                </a>
              </footer>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default PublicTeamView;
