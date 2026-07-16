import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Crown, Loader2, Medal, Target, Trophy, Users } from 'lucide-react';
import { useCloudRuntime } from '../../hooks/useCloudRuntime';
import type { CloudLeagueRepository } from '../../cloud/dataAccess';
import {
  EVENT_FORMAT_LABELS,
  EVENT_STATUS_LABELS,
  bracketRoundName,
  bracketWinnerId,
  computeScorers,
  computeStandings,
  groupStageStandings,
  type EventFixture,
  type PublicEventBundle,
  type StandingRow
} from '../../cloud/league';
import { AetherFlowBackdrop } from '../ui/aether-flow-hero';
import { GlowingEffect } from '../ui/glowing-effect';
import { ORANGE_NEW_CLASSES, ORANGE_NEW_GLOW_PROPS, ORANGE_NEW_THEME_STYLE } from '../../theme/orangeNewTheme';
import { createPreviewLeagueRuntime } from './demoLeagueData';

// Public, read-only results page (#/l/CODE). Anyone with the link sees an event's
// standings/bracket, results, and scorers - no login. Styled to match the
// coach-facing landing page: deep-navy backdrop, particle-network + grid
// geometry, orange accents, and glow-ring glass cards.

const DISPLAY_FONT = "'Manrope', ui-sans-serif, system-ui, sans-serif";
const th = 'px-2.5 py-2 text-[10px] font-black uppercase tracking-wider text-[#7C8AA6]';
const td = 'px-2.5 py-2 text-sm';

const getPublicCode = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  const hash = window.location.hash; // '#/l/CODE' or '#/l?code=CODE'
  const afterRoot = hash.replace(/^#\/?/, '');
  if (afterRoot.startsWith('l/')) return afterRoot.slice(2).split(/[/?#]/)[0].toUpperCase() || undefined;
  const q = hash.indexOf('?');
  if (q !== -1) {
    const code = new URLSearchParams(hash.slice(q + 1)).get('code');
    if (code) return code.toUpperCase();
  }
  return undefined;
};

const GlowCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={ORANGE_NEW_CLASSES.glowShell}>
    <GlowingEffect {...ORANGE_NEW_GLOW_PROPS.shell} />
    <div className={`${ORANGE_NEW_CLASSES.glowCard} ${className ?? ''}`}>{children}</div>
  </div>
);

const SectionCard = ({ icon: Icon, title, aside, children }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <GlowCard>
    <div className="flex items-center gap-2 border-b border-white/[0.08] px-5 py-3.5">
      <span className={ORANGE_NEW_CLASSES.featureIcon} style={{ height: 32, width: 32 }}><Icon size={15} /></span>
      <h2 className="font-display text-sm font-black tracking-wide text-white" style={{ fontFamily: DISPLAY_FONT }}>{title}</h2>
      {aside && <span className="ml-auto text-[11px] font-bold text-[#7C8AA6]">{aside}</span>}
    </div>
    <div className="p-5">{children}</div>
  </GlowCard>
);

const StandingsTable = ({ rows, teamName }: { rows: StandingRow[]; teamName: (id: string) => string }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b border-white/[0.08]">
          <th className={`${th} text-left`}>#</th>
          <th className={`${th} text-left`}>Team</th>
          <th className={`${th} text-right`}>P</th>
          <th className={`${th} text-right`}>W</th>
          <th className={`${th} text-right`}>D</th>
          <th className={`${th} text-right`}>L</th>
          <th className={`${th} text-right`}>GD</th>
          <th className={`${th} text-right`}>Pts</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={row.teamId} className={`border-b border-white/[0.04] last:border-0 ${index === 0 ? 'bg-orange-400/[0.05]' : ''}`}>
            <td className={`${td} text-center font-black ${index === 0 ? 'text-orange-300' : 'text-[#5C6880]'}`}>{index + 1}</td>
            <td className={`${td} font-bold text-white`}>
              {index === 0 && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-orange-400 align-middle" />}
              {teamName(row.teamId)}
            </td>
            <td className={`${td} text-right text-[#B9C2D4]`}>{row.played}</td>
            <td className={`${td} text-right text-[#B9C2D4]`}>{row.won}</td>
            <td className={`${td} text-right text-[#B9C2D4]`}>{row.drawn}</td>
            <td className={`${td} text-right text-[#B9C2D4]`}>{row.lost}</td>
            <td className={`${td} text-right text-[#B9C2D4]`}>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
            <td className={`${td} text-right font-black text-white`}>{row.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ResultChip = ({ fixture, teamName }: { fixture: EventFixture; teamName: (id: string | null) => string }) => {
  const homeWin = (fixture.home_score ?? 0) > (fixture.away_score ?? 0);
  const awayWin = (fixture.away_score ?? 0) > (fixture.home_score ?? 0);
  return (
    <div className={`flex items-center gap-2 rounded-xl border border-white/[0.09] bg-[#081026]/60 px-3 py-2 text-sm ${ORANGE_NEW_CLASSES.card}`}>
      <span className={`flex-1 truncate text-right ${homeWin ? 'font-black text-white' : 'font-semibold text-[#B9C2D4]'}`}>{teamName(fixture.home_team_id)}</span>
      <span className="rounded-lg border border-white/[0.12] bg-black/30 px-2 py-0.5 font-display text-sm font-black text-white" style={{ fontFamily: DISPLAY_FONT }}>{fixture.home_score}–{fixture.away_score}</span>
      <span className={`flex-1 truncate ${awayWin ? 'font-black text-white' : 'font-semibold text-[#B9C2D4]'}`}>{teamName(fixture.away_team_id)}</span>
    </div>
  );
};

const BracketView = ({ fixtures, teamName }: { fixtures: EventFixture[]; teamName: (id: string | null) => string }) => {
  const rounds = [...new Set(fixtures.map(f => f.round))].sort((a, b) => a - b);
  const totalRounds = rounds.length ? Math.max(...rounds) : 0;
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {rounds.map(round => (
        <div key={round} className="space-y-2.5">
          <p className={ORANGE_NEW_CLASSES.eyebrowLabel}>{bracketRoundName(round, totalRounds)}</p>
          {fixtures.filter(f => f.round === round).map(fixture => {
            const winner = bracketWinnerId(fixture);
            const cell = (id: string | null) => (
              <span className={`flex-1 truncate text-sm ${id && winner === id ? 'font-black text-orange-200' : id ? 'font-semibold text-white' : 'italic text-[#5C6880]'}`}>{id ? teamName(id) : 'TBD'}</span>
            );
            return (
              <div key={fixture.id} className="rounded-xl border border-white/[0.1] bg-[#081026]/60 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  {cell(fixture.home_team_id)}
                  <span className="rounded-lg border border-white/[0.12] bg-black/30 px-2 py-0.5 font-display text-xs font-black text-white" style={{ fontFamily: DISPLAY_FONT }}>
                    {fixture.status === 'completed' ? `${fixture.home_score}–${fixture.away_score}` : 'v'}
                  </span>
                  {cell(fixture.away_team_id)}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const Kpi = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="rounded-2xl border border-white/[0.1] bg-[#081026]/55 p-4 text-center backdrop-blur-[10px]">
    <p className="font-display text-2xl font-black text-white" style={{ fontFamily: DISPLAY_FONT }}>{value}</p>
    <p className={`mt-1 ${ORANGE_NEW_CLASSES.eyebrowLabel}`}>{label}</p>
    {sub && <p className="mt-0.5 truncate text-[11px] text-[#7C8AA6]">{sub}</p>}
  </div>
);

const PublicEventBody = ({ bundle }: { bundle: PublicEventBundle }) => {
  const { event, teams, fixtures, statEvents } = bundle;
  const teamName = (id: string | null) => (id ? teams.find(t => t.id === id)?.name ?? 'TBD' : 'TBD');
  const scorers = useMemo(() => computeScorers(statEvents).slice(0, 10), [statEvents]);
  if (!event) return null;

  const groupFixtures = fixtures.filter(f => f.stage === 'group');
  const knockoutFixtures = fixtures.filter(f => f.stage === 'knockout');
  const isGroupKnockout = event.format === 'group_knockout';
  const isKnockout = event.format === 'single_elimination';
  const bracketFixtures = isGroupKnockout ? knockoutFixtures : fixtures;
  const completedResults = fixtures.filter(f => f.status === 'completed');

  // Champion: the winner of the last knockout round, or a completed round-robin leader.
  let champion: string | null = null;
  if (isKnockout || isGroupKnockout) {
    const maxRound = bracketFixtures.length ? Math.max(...bracketFixtures.map(f => f.round)) : 0;
    const final = bracketFixtures.find(f => f.round === maxRound && (f.sequence ?? 1) === 1);
    champion = final ? bracketWinnerId(final) : null;
  } else if (event.status === 'completed') {
    const table = computeStandings(teams, fixtures);
    champion = table.length && table[0].played > 0 ? table[0].teamId : null;
  }

  const goals = completedResults.reduce((sum, f) => sum + (f.home_score ?? 0) + (f.away_score ?? 0), 0);

  return (
    <div className="space-y-5">
      {champion && (
        <div className={ORANGE_NEW_CLASSES.glowShell}>
          <GlowingEffect {...ORANGE_NEW_GLOW_PROPS.shell} />
          <div className={`${ORANGE_NEW_CLASSES.glowCard} relative p-6 text-center`}>
            <div aria-hidden="true" style={{ position: 'absolute', left: '50%', top: 0, width: '30rem', height: '12rem', transform: 'translate(-50%,-45%)', borderRadius: '50%', background: 'rgba(255,138,61,.16)', filter: 'blur(70px)' }} />
            <div className="relative">
              <Crown size={26} className="mx-auto text-orange-300" />
              <p className={`mt-2 ${ORANGE_NEW_CLASSES.eyebrowLabel}`}>Champions</p>
              <p className="mt-1 font-display text-3xl font-black text-white" style={{ fontFamily: DISPLAY_FONT, letterSpacing: '-.02em' }}>{teamName(champion)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Teams" value={teams.length} />
        <Kpi label="Played" value={completedResults.length} sub={`${fixtures.length} fixtures`} />
        <Kpi label="Goals" value={goals} />
        <Kpi label="Top scorer" value={scorers[0]?.goals ?? 0} sub={scorers[0]?.playerName ?? '—'} />
      </div>

      {isGroupKnockout ? (
        <>
          <SectionCard icon={Users} title="Groups">
            <div className="grid gap-4 md:grid-cols-2">
              {groupStageStandings(teams, groupFixtures).map(group => (
                <div key={group.label}>
                  <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-black text-white" style={{ fontFamily: DISPLAY_FONT }}>
                    <span className="rounded-md bg-orange-400/15 px-2 py-0.5 text-xs text-orange-200">Group {group.label}</span>
                  </h3>
                  <StandingsTable rows={group.rows} teamName={teamName} />
                </div>
              ))}
            </div>
          </SectionCard>
          {knockoutFixtures.length > 0 && <SectionCard icon={Medal} title="Knockout"><BracketView fixtures={knockoutFixtures} teamName={teamName} /></SectionCard>}
        </>
      ) : isKnockout ? (
        <SectionCard icon={Medal} title="Bracket"><BracketView fixtures={fixtures} teamName={teamName} /></SectionCard>
      ) : (
        <SectionCard icon={Trophy} title="Standings"><StandingsTable rows={computeStandings(teams, fixtures)} teamName={teamName} /></SectionCard>
      )}

      {completedResults.length > 0 && (
        <SectionCard icon={CalendarDays} title="Results" aside={`${completedResults.length} played`}>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {completedResults.map(f => <ResultChip key={f.id} fixture={f} teamName={teamName} />)}
          </div>
        </SectionCard>
      )}

      {scorers.length > 0 && (
        <SectionCard icon={Target} title="Top scorers">
          <ul className="space-y-2">
            {scorers.map((scorer, index) => (
              <li key={`${scorer.teamId}-${scorer.playerName}`} className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#081026]/55 px-3.5 py-2.5">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${index === 0 ? 'bg-orange-400/20 text-orange-200' : index < 3 ? 'bg-white/[0.08] text-[#B9C2D4]' : 'bg-white/[0.04] text-[#7C8AA6]'}`}>{index + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-white">{scorer.playerName}</span>
                  <span className="block truncate text-[11px] text-[#7C8AA6]">{teamName(scorer.teamId)}</span>
                </span>
                <span className="shrink-0">
                  <span className="font-display text-lg font-black text-white" style={{ fontFamily: DISPLAY_FONT }}>{scorer.goals}</span>
                  <span className="ml-1 text-[11px] font-bold text-[#7C8AA6]">goals</span>
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
};

let previewPublicRuntimeSingleton: ReturnType<typeof createPreviewLeagueRuntime> | null = null;

const PublicEventView = () => {
  const runtime = useCloudRuntime();
  const code = getPublicCode();
  const [bundle, setBundle] = useState<PublicEventBundle | null>(null);
  const [loading, setLoading] = useState(true);

  let league: CloudLeagueRepository | null = null;
  if (runtime.phase6.leaguePreviewEnabled) {
    if (!previewPublicRuntimeSingleton) previewPublicRuntimeSingleton = createPreviewLeagueRuntime(runtime.phase6);
    league = previewPublicRuntimeSingleton.dataAccess.league;
  } else if (runtime.enabled) {
    league = runtime.dataAccess.league;
  }

  useEffect(() => {
    if (!league || !code) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    league.getPublicEvent(code)
      .then(result => { if (active) setBundle(result); })
      .catch(() => { if (active) setBundle({ found: false, teams: [], fixtures: [], statEvents: [] }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [league, code]);

  const event = bundle?.event;
  const live = event?.status === 'active';

  return (
    <div className={ORANGE_NEW_CLASSES.accessShell} style={ORANGE_NEW_THEME_STYLE}>
      <AetherFlowBackdrop className="fixed inset-0 z-0" />

      <div className="relative z-10">
        <header className="sticky top-0 z-20 border-b border-white/[0.06]" style={{ background: 'rgba(4,9,26,.72)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-300/25 bg-orange-300/10 text-orange-200"><Trophy size={17} /></span>
              <div className="leading-tight">
                <p className={ORANGE_NEW_CLASSES.eyebrowLabel}>{bundle?.leagueName ?? 'Dumala League'}</p>
                <p className="text-sm font-bold text-white">Live results</p>
              </div>
            </div>
            {event && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-[#DDE4EF]">
                {live && <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" /></span>}
                {live ? 'Live' : EVENT_STATUS_LABELS[event.status]}
              </span>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[#8A96AD]"><Loader2 size={16} className="animate-spin" /> Loading results…</div>
          ) : !bundle || !bundle.found || !event ? (
            <div className={`${ORANGE_NEW_CLASSES.card} mx-auto max-w-md p-10 text-center`}>
              <Trophy size={24} className="mx-auto text-[#5C6880]" />
              <p className="mt-3 font-display text-base font-black text-white" style={{ fontFamily: DISPLAY_FONT }}>Results not available</p>
              <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-[#8A96AD]">This page isn't published yet, or the link is incorrect. Check the link with the league organizer.</p>
            </div>
          ) : (
            <>
              <section className="mb-7">
                <p className={ORANGE_NEW_CLASSES.eyebrowLabel}>{bundle.leagueName}{event.category ? ` · ${event.category}` : ''}</p>
                <h1 className="mt-2 font-display text-4xl font-black leading-[1.05] sm:text-5xl" style={{ fontFamily: DISPLAY_FONT, letterSpacing: '-.035em' }}>
                  <span style={{ background: 'linear-gradient(180deg,#fff,rgba(255,255,255,.66))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{event.name}</span>
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={ORANGE_NEW_CLASSES.tagPillAccent}>{EVENT_FORMAT_LABELS[event.format]}</span>
                  {event.category && <span className={ORANGE_NEW_CLASSES.tagPillNeutral}>{event.category}</span>}
                  <span className={ORANGE_NEW_CLASSES.tagPillNeutral}>{EVENT_STATUS_LABELS[event.status]}</span>
                  {event.starts_on && <span className={ORANGE_NEW_CLASSES.tagPillNeutral}>{event.starts_on}</span>}
                </div>
              </section>

              <PublicEventBody bundle={bundle} />

              <footer className="mt-10 border-t border-white/[0.06] pt-6 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#5C6880]">Live results powered by Dumala League</p>
              </footer>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default PublicEventView;
