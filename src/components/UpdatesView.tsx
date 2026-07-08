import React, { useState } from 'react';
import { Award, Brain, Calculator, ChevronDown, ChevronRight, Cloud, Download, FlaskConical, Hash, Megaphone, Sparkles, Target, TrendingUp, Users } from 'lucide-react';
import { Button } from './ui/button';

export default function UpdatesView() {
  const [openEntries, setOpenEntries] = useState<Record<string, boolean>>({});
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);

  const handleToggleEntry = (entryId: string) => {
    setOpenEntries((current) => ({
      ...current,
      [entryId]: !current[entryId]
    }));
  };

  const changelogBadgeStyles: Record<string, string> = {
    'New Features Added': 'border-emerald-400/40 bg-emerald-400/15 text-emerald-100',
    'Major Milestone': 'border-amber-400/50 bg-amber-400/15 text-amber-100',
    'UX Polish': 'border-sky-400/40 bg-sky-400/15 text-sky-100',
    'Cloud Prep': 'border-indigo-400/40 bg-indigo-400/15 text-indigo-100',
    'Coaching Library': 'border-lime-400/40 bg-lime-400/15 text-lime-100',
    'Assessment Tools': 'border-violet-400/40 bg-violet-400/15 text-violet-100',
    'Reports Added': 'border-fuchsia-400/40 bg-fuchsia-400/15 text-fuchsia-100',
    'Progress Tracking': 'border-cyan-400/40 bg-cyan-400/15 text-cyan-100',
    'Review Package': 'border-orange-400/40 bg-orange-400/15 text-orange-100',
    'Cloud Foundation': 'border-blue-400/40 bg-blue-400/15 text-blue-100',
    Payments: 'border-rose-400/40 bg-rose-400/15 text-rose-100',
    Reliability: 'border-teal-400/40 bg-teal-400/15 text-teal-100',
    'Offline Ready': 'border-purple-400/40 bg-purple-400/15 text-purple-100',
    'Core Workflow': 'border-green-400/40 bg-green-400/15 text-green-100',
    'FPRDS Vision': 'border-yellow-400/40 bg-yellow-400/15 text-yellow-100',
    'Go To Market': 'border-pink-400/40 bg-pink-400/15 text-pink-100',
    Roadmap: 'border-slate-400/40 bg-slate-400/15 text-slate-100'
  };

  const getChangelogBadgeClass = (badge: string) =>
    changelogBadgeStyles[badge] ?? 'border-slate-400/40 bg-slate-400/15 text-slate-100';

  const changelogEntries = [
    {
      id: 'july_8_getting_started_checklist',
      date: '2026-07-08',
      title: 'First-Week Getting-Started Checklist',
      badge: 'New Features Added',
      summary: 'The Home dashboard now shows a getting-started checklist that walks you through the five steps that make Dumala genuinely useful in your first week, with one-tap links straight to each screen.',
      accent: 'border-cyan-400/20 bg-slate-950/90 text-slate-100',
      renderContent: () => (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            New to Dumala or setting up a fresh team? The overview now guides you from an empty workspace to real value: add your squad, schedule a match, log a result, run an assessment, and download a report. Each step links straight to the right screen, and the checklist steps aside once you are set up.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                icon: Target,
                title: 'Five steps to value',
                desc: 'Add 8-12 players, schedule your next match, log a result, run an FPRDS assessment, and download a player report.'
              },
              {
                icon: TrendingUp,
                title: 'Progress at a glance',
                desc: 'A progress bar tracks how far along you are, and completed steps are checked off automatically from your workspace.'
              },
              {
                icon: Sparkles,
                title: 'One-tap deep links',
                desc: 'Every unfinished step has a button that jumps straight to the Squad, Game Week, or Assessments screen you need.'
              },
              {
                icon: Award,
                title: 'Try a sample team',
                desc: 'Prefer to explore first? Load a bundled sample team from onboarding or the team menu to see a fully set-up workspace instantly.'
              }
            ].map(item => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="rounded-xl border border-cyan-400/20 bg-slate-900/80 p-4 shadow-sm shadow-black/20">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    <h5 className="text-xs font-black uppercase tracking-wider text-cyan-100">{item.title}</h5>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )
    },
    {
      id: 'july_8_downloadable_assessment_reports',
      date: '2026-07-08',
      title: 'Downloadable Player Assessment and Development Reports',
      badge: 'New Features Added',
      summary: 'Coaches can now download a clean, print-ready report for any assessed player straight from the Assessment Center, plus a JSON data export for record-keeping or sharing.',
      accent: 'border-cyan-400/20 bg-slate-950/90 text-slate-100',
      renderContent: () => (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Open a player in the Assessment Center, and the coach feedback panel now offers a one-click <span className="font-bold text-cyan-200">Download report</span>. The report is a self-contained web page you can open and print to PDF, so it works offline and needs no extra software.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                icon: Download,
                title: 'Print-ready player report',
                desc: 'One page with the OVR snapshot and tier, role-weighted attribute scores, strengths, development priorities, the 4-week development plan, OVR history, and coach notes.'
              },
              {
                icon: TrendingUp,
                title: 'Built from real assessments',
                desc: 'The report uses the player’s latest saved session and the trend against the previous one, so it reflects actual drill results, not manual entry.'
              },
              {
                icon: Award,
                title: 'Development plan included',
                desc: 'The saved or freshly generated 4-week plan is printed alongside the scores, giving players and parents a clear next block of work.'
              },
              {
                icon: Cloud,
                title: 'JSON data export',
                desc: 'A separate data export saves the raw assessment sessions for the player, useful for backups, coach handover, or external review.'
              }
            ].map(item => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="rounded-xl border border-cyan-400/20 bg-slate-900/80 p-4 shadow-sm shadow-black/20">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    <h5 className="text-xs font-black uppercase tracking-wider text-cyan-100">{item.title}</h5>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
          <p className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-xs font-semibold leading-relaxed text-cyan-100">
            Every assessment now records the benchmark version it was scored under, shown on the report and in the Assessment Center. This keeps older results reproducible if the benchmark tables are updated in a future version.
          </p>
        </div>
      )
    },
    {
      id: 'july_8_fprds_beta_results_database',
      date: '2026-07-08',
      title: 'FPRDS Beta Results Database and Benchmark Review',
      badge: 'New Features Added',
      summary: 'Opt-in FPRDS beta submissions now feed a private benchmark-validation dataset: each shared assessment records per-drill results, and reviewers get an aggregate distribution view with a benchmark verdict and correction-log workflow.',
      accent: 'border-indigo-400/20 bg-slate-950/90 text-slate-100',
      renderContent: () => (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            When a coach chooses to share an assessment with the FPRDS beta, Dumala now stores anonymized per-drill measurements alongside the session. This lets us check whether each benchmark band is realistic for its age group and role before wider release — without sending any player identity.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                icon: FlaskConical,
                title: 'Per-drill beta dataset',
                desc: 'Shared submissions fan out into individual drill rows with raw value, unit, derived score, and the benchmark tier each result landed in, all keyed to the benchmark version used at save time.'
              },
              {
                icon: TrendingUp,
                title: 'Aggregate benchmark analysis',
                desc: 'Reviewers see distributions grouped by drill, age group, role, and assessment type with sample size, percentiles, average score, and tier mix.'
              },
              {
                icon: Award,
                title: 'Benchmark verdicts and corrections',
                desc: 'Each benchmark cell can be marked accept, change-requested, or inconclusive, and proposed band changes are tracked in a correction log with accept, reject, and defer decisions.'
              },
              {
                icon: Cloud,
                title: 'Private and versioned',
                desc: 'The review dataset is separate from team assessment history, protected so only FPRDS reviewers can read it, and proposed corrections target a new benchmark version rather than rewriting past sessions.'
              }
            ].map(item => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="rounded-xl border border-indigo-400/20 bg-slate-900/80 p-4 shadow-sm shadow-black/20">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-400/30 bg-indigo-400/10 text-indigo-200">
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    <h5 className="text-xs font-black uppercase tracking-wider text-indigo-100">{item.title}</h5>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
          <p className="rounded-xl border border-indigo-400/20 bg-indigo-400/10 p-3 text-xs font-semibold leading-relaxed text-indigo-100">
            Contributing beta results is always opt-in and never includes player names, photos, or dates of birth. The dataset exists to make the FPRDS benchmarks more trustworthy before they are treated as settled.
          </p>
        </div>
      )
    },
    {
      id: 'july_5_game_plan_session_dashboard_overhaul',
      date: '2026-07-05',
      title: 'Game Plan Workflow, Session Dashboard Summary, and Coaching Command Center',
      badge: 'New Features Added',
      summary: 'Dumala now connects match preparation and training delivery more tightly with saved Game Plans, dashboard game-plan summaries, richer daily session summaries, clearer training readiness signals, and a stronger coach command-center flow.',
      accent: 'border-emerald-400/20 bg-slate-950/90 text-slate-100',
      renderContent: () => (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            July 5 focuses on turning Dumala into a working command center for the week. Coaches can move from the dashboard into a saved Game Plan, check the next match context, review today&apos;s training session, and keep tactical preparation connected to actual squad work.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                icon: Target,
                title: 'Saved Game Plan workflow',
                desc: 'Tactics now supports opponent-linked Game Plans so coaches can save the formation, match format, opponent shape, strategy context, set-piece assignments, and notes for an upcoming game.'
              },
              {
                icon: Brain,
                title: 'Dashboard game-plan summary',
                desc: 'The dashboard now surfaces the next-match Game Plan with opponent, formation, opponent formation, tactical intent, and a direct path back into the tactical board.'
              },
              {
                icon: FlaskConical,
                title: 'Session dashboard summary',
                desc: 'Training-day cards now summarize the active session with duration, load, drill count, completion state, key drills, equipment, coach cues, warnings, and reflection status.'
              },
              {
                icon: TrendingUp,
                title: 'Daily prep panels',
                desc: 'The main dashboard better separates match prep and training prep so coaches can scan what matters today without opening every module.'
              },
              {
                icon: Award,
                title: 'Training session detail modal',
                desc: 'Coaches can open a session, step through drills, inspect block structure, review readiness warnings, mark drill progress, and keep a concise reflection tied to the day.'
              },
              {
                icon: Users,
                title: 'Squad context stays attached',
                desc: 'Game Plans and daily summaries use the active team workspace, roster, upcoming fixtures, and saved training schedule so the plan reflects the actual squad instead of a generic template.'
              },
              {
                icon: Cloud,
                title: 'Persistent planning data',
                desc: 'Game Plans are stored as workspace data and included in the local-to-cloud migration path, preparing the feature for durable continuity as cloud sync matures.'
              },
              {
                icon: Hash,
                title: 'Coach workflow polish',
                desc: 'Buttons, panels, empty states, and compact summary language were tightened so daily review, match planning, and session delivery feel like one connected coaching loop.'
              }
            ].map(item => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="rounded-xl border border-emerald-400/20 bg-slate-900/80 p-4 shadow-sm shadow-black/20">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/10 text-emerald-200">
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    <h5 className="text-xs font-black uppercase tracking-wider text-emerald-100">{item.title}</h5>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
          <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs font-semibold leading-relaxed text-emerald-100">
            This pass makes the dashboard more useful as the first screen after launch: it now points coaches toward the next practical action, whether that is saving the Game Plan, opening today&apos;s session, or reviewing readiness before training.
          </p>
        </div>
      )
    },
    {
      id: 'july_4_ui_game_and_coaching_tools_overhaul',
      date: '2026-07-04',
      title: 'Major UI Overhaul, Free Kick Game, and Match-Prep Product Expansion',
      badge: 'UX Polish',
      summary: 'Dumala received a broad UI overhaul across the coach workspace, League & Updates gained the Dumala Free Kick game, and recent match-prep, tactics, training, cloud, landing, and app-launch upgrades were consolidated into a more polished beta experience.',
      accent: 'border-sky-400/20 bg-slate-950/90 text-slate-100',
      renderContent: () => (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            July 4 was a broad product polish and expansion pass. The app now feels more complete across the dark shell, navigation, tactical surfaces, training panels, update content, install flow, and coach-facing launch story, with a new Free Kick game added inside League &amp; Updates.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                icon: Hash,
                title: 'Major UI overhaul',
                desc: 'The main workspace, cards, badges, overlays, buttons, compact controls, and dark product surfaces were tightened for a cleaner, more consistent coaching interface.'
              },
              {
                icon: Target,
                title: 'Dumala Free Kick game',
                desc: 'League & Updates now includes a dedicated Game tab with the Dumala Free Kick Hero experience embedded directly in the app.'
              },
              {
                icon: Brain,
                title: 'Tactical board improvements',
                desc: 'Fullscreen match layout controls, opponent dots, formation controls, ball tools, wall tools, scenario presets, captain and set-piece selectors, and strategy context all received practical match-prep polish.'
              },
              {
                icon: Award,
                title: 'Match-day preparation',
                desc: 'Upcoming match planning now has clearer routes through opponent shape, playstyle, weather-aware preparation, tactical notes, snapshots, and saved planning context.'
              },
              {
                icon: FlaskConical,
                title: 'Training planning upgrades',
                desc: 'Training received richer drill variety, stronger daily-prep context, better session structure, and summary language that helps coaches understand load and readiness faster.'
              },
              {
                icon: Megaphone,
                title: 'Product story and launch routing',
                desc: 'The public landing page, Free/Premium beta positioning, app route, installed-app start URL, and cloud sign-in return path now present Dumala as a clearer coach product.'
              },
              {
                icon: Cloud,
                title: 'Cloud and backup hardening',
                desc: 'Google-first cloud entry, Supabase migration foundations, multi-team workspace support, cloud backup duplicate handling, and local-first protections continued moving toward beta readiness.'
              },
              {
                icon: Download,
                title: 'Installable app polish',
                desc: 'The PWA and installed app flow now better respect the coach workspace route, offline shell expectations, tablet layouts, and update-ready app behavior.'
              }
            ].map(item => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="rounded-xl border border-sky-400/20 bg-slate-900/80 p-4 shadow-sm shadow-black/20">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-400/30 bg-sky-400/10 text-sky-200">
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    <h5 className="text-xs font-black uppercase tracking-wider text-sky-100">{item.title}</h5>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
          <p className="rounded-xl border border-sky-400/20 bg-sky-400/10 p-3 text-xs font-semibold leading-relaxed text-sky-100">
            This update is both polish and personality: the serious coaching tools became more cohesive, while the Free Kick game gives League &amp; Updates a playful football moment inside the same workspace.
          </p>
        </div>
      )
    },
    {
      id: 'landing_page_saas_launch_routing',
      date: '2026-07-03',
      title: 'Coach-First Landing Page, SaaS Positioning, and App Launch Routing',
      badge: 'Go To Market',
      summary: 'Dumala now has a public coach-facing landing page with simple Free and Premium pricing, a dedicated app route separated from the marketing site, an installed app that opens straight into the workspace, and cloud sign-in that returns cleanly to the coach app.',
      accent: 'border-pink-400/20 bg-slate-950/90 text-slate-100',
      renderContent: () => (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            This update begins Dumala&apos;s go-to-market pass. The product now presents a clear public story for coaches, keeps the marketing page separate from the working app, and makes signing in and installing feel like a real product rather than a single-page prototype.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                icon: Megaphone,
                title: 'Coach-first landing page',
                desc: 'A new public landing page leads with weekly admin relief, match-week preparation, and clearer player development, positioning Dumala as the coach\'s weekly command center.'
              },
              {
                icon: TrendingUp,
                title: 'Simple two-choice pricing',
                desc: 'Pricing is packaged as two clear options — Free while in beta and a Premium monthly subscription — with Coach, Club, and Academy value framed inside Premium instead of separate visible tiers.'
              },
              {
                icon: Hash,
                title: 'Dedicated app route',
                desc: 'The coach workspace now lives on its own #/app route, cleanly separated from the marketing landing page so the two experiences no longer share the same entry point.'
              },
              {
                icon: Download,
                title: 'Installed app opens into the workspace',
                desc: 'The installable app now launches directly into the coaching workspace instead of the marketing page, so an installed copy behaves like a dedicated coaching tool.'
              },
              {
                icon: Cloud,
                title: 'Cleaner cloud sign-in return',
                desc: 'Google and email sign-in redirects now return coaches straight back into the app after authenticating, so cloud sign-in no longer strands users on the wrong route.'
              },
              {
                icon: FlaskConical,
                title: 'Stronger daily training prep',
                desc: 'The training dashboard daily-prep view was upgraded with clearer session context so coaches get more useful match-week and training-day guidance at a glance.'
              },
              {
                icon: Target,
                title: 'Launch configuration and cleanup',
                desc: 'A repeatable launch configuration was added for running the app, offline verification now checks the dedicated app route, and an unused pricing card was removed to keep the offer focused.'
              }
            ].map(item => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="rounded-xl border border-pink-400/20 bg-slate-900/80 p-4 shadow-sm shadow-black/20">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-pink-400/30 bg-pink-400/10 text-pink-200">
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    <h5 className="text-xs font-black uppercase tracking-wider text-pink-100">{item.title}</h5>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
          <p className="rounded-xl border border-pink-400/20 bg-pink-400/10 p-3 text-xs font-semibold leading-relaxed text-pink-100">
            The subscription story is being validated, not locked in. Dumala stays free during beta while we confirm whether coaches will pay for weekly time savings before any club-scale pricing is introduced.
          </p>
        </div>
      )
    },
    {
      id: 'july_product_coaching_overhaul',
      date: '2026-07-01',
      title: 'Match Day Prep, Tactics Tools, Weather Advisory, and UI Overhaul',
      badge: 'New Features Added',
      summary: 'Dumala now has a stronger match-prep workspace with cleaner fullscreen tactics controls, opponent-shape scouting, richer strategy snapshots, weather advisory support, more training drill variety, and broad UI polish.',
      accent: 'border-emerald-400/20 bg-slate-950/90 text-slate-100',
      renderContent: () => (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            This changelog captures the latest product pass across the coaching workflow: match-day planning, fullscreen tactics, opponent preparation, training variety, cloud backup reliability, and visual consistency across darker app surfaces.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                icon: Target,
                title: 'Tactics fullscreen overhaul',
                desc: 'The Match Layout fullscreen experience now has safer exit controls, compact bottom-left board actions, centered field behavior, corrected goalkeeper placement, and less clutter around the pitch.'
              },
              {
                icon: Brain,
                title: 'Strategy snapshot and opponent shape',
                desc: 'Coaches can select an opponent formation, toggle faded opponent dots on the board, and use matchup strategy cues without repeating the same controls across multiple panels.'
              },
              {
                icon: Cloud,
                title: 'Weather advisory support',
                desc: 'Match preparation now has clearer room for weather-aware planning, helping coaches treat weather, venue conditions, and training-day readiness as part of the weekly decision cycle.'
              },
              {
                icon: FlaskConical,
                title: 'More drills and training variety',
                desc: 'Training planning received broader drill variety and less repetitive quick-start behavior so coaches have more useful options when preparing sessions.'
              },
              {
                icon: Award,
                title: 'Improved match day prep',
                desc: 'Tactics, formation, opponent context, ball/wall tools, scenario presets, snapshots, and board controls now work together as a clearer match-prep surface.'
              },
              {
                icon: Cloud,
                title: 'Cloud backup reliability',
                desc: 'Cloud Backup now handles repeated uploads more safely by avoiding natural-key duplicate failures and preserving the local workspace copy.'
              },
              {
                icon: Download,
                title: 'Installed app polish',
                desc: 'Fullscreen controls were adjusted for the downloadable app so they remain reachable around the shell navigation and tablet-style layouts.'
              },
              {
                icon: Hash,
                title: 'Major UI consistency pass',
                desc: 'Changelog surfaces, tactics controls, badges, overlays, and compact button states were polished to better match Dumala\'s dark product shell.'
              }
            ].map(item => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm shadow-black/20">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-100">{item.title}</h5>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
          <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs font-semibold leading-relaxed text-emerald-100">
            The goal of this pass is practical: make Dumala feel more match-ready for coaches using it before training, before kickoff, and during weekly squad review.
          </p>
        </div>
      )
    },
    {
      id: 'major_cloud_and_product_milestone',
      date: '2026-06-30',
      title: 'Cloud Signup, Migration, and Core Product Milestones',
      badge: 'Major Milestone',
      summary: 'Dumala now has Google-first cloud account entry, cloud migration foundations, multiple team support, an installable offline app shell, and a stronger tactics strategy engine.',
      accent: 'border-amber-400/20 bg-slate-950/90 text-slate-100',
      renderContent: () => (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Dumala is moving from a strong local-first coaching tool into a cloud-ready, multi-workspace platform with Google signup, migration paths, offline install support, and a more strategic tactics experience.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                icon: Users,
                title: 'Multiple team support',
                desc: "Coaches can manage separate team workspaces, switch between clubs, and keep each team's roster, matches, assessments, tactics, and records isolated."
              },
              {
                icon: Cloud,
                title: 'Cloud migration and Google signup',
                desc: 'Supabase-backed account foundations, Google sign-in entry, migration helpers, and cloud-safe boundaries now prepare Dumala for durable workspace continuity.'
              },
              {
                icon: Download,
                title: 'Installable offline app shell',
                desc: 'The PWA shell can be installed and opened like an app, with offline-ready assets and local-first workflows kept available while cloud features mature.'
              },
              {
                icon: Brain,
                title: 'Playstyle tactics strategy engine',
                desc: 'Tactics now supports richer playstyle, formation, matchup, and strategy recommendations so planning feels more like a coaching decision engine.'
              }
            ].map(item => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="rounded-xl border border-amber-400/20 bg-slate-900/80 p-4 shadow-sm shadow-black/20">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-400/10 text-amber-200">
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    <h5 className="text-xs font-black uppercase tracking-wider text-amber-100">{item.title}</h5>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
          <p className="rounded-xl border border-sky-400/20 bg-sky-400/10 p-3 text-xs font-semibold leading-relaxed text-sky-100">
            Cloud remains designed as a careful migration path, not a forced lock-in. Existing local workspaces stay usable while Google signup and Supabase-backed continuity continue to mature.
          </p>
        </div>
      )
    },
    {
      id: 'assessment_feedback_reports_and_polish',
      date: '2026-06-29',
      title: 'Assessment Feedback Reports and UI Polish',
      badge: 'UX Polish',
      summary: 'Assessment Center feedback is clearer, training quick-starts are more varied, and the main dashboard surfaces now feel more consistent.',
      accent: 'border-sky-200 bg-sky-50/70',
      renderContent: () => (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Today's update improves the review side of Dumala. Coaches get more useful FPRDS feedback language, clearer assessment reporting, less repetitive training quick-start sessions, and a cleaner visual pass across key dashboard surfaces.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                title: 'Richer FPRDS feedback report',
                desc: 'Assessment feedback now explains strengths, priority gaps, role context, and next coaching prompts with more practical language.'
              },
              {
                title: 'Progress logic improved',
                desc: 'New FPRDS progress helpers support better comparison of saved assessment sessions and more reliable report content.'
              },
              {
                title: 'Training quick-start variety',
                desc: 'Generated training sessions now rotate drill mixes more naturally instead of repeating the same quick-start pattern.'
              },
              {
                title: 'Cleaner app surfaces',
                desc: 'Dashboard, Payments, and Bulletins were polished with shared card surfaces, standardized badges, and calmer typography.'
              },
              {
                title: 'Build output cleaned up',
                desc: 'Vendor chunk splitting reduced the main app bundle and removed the large-chunk warning from production builds.'
              }
            ].map(item => (
              <div key={item.title} className="bg-white border border-sky-200 rounded-xl p-4">
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">{item.title}</h5>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'multi_team_supabase_migration_setup',
      date: '2026-06-28',
      title: 'Multiple Teams and Supabase Migration Setup',
      badge: 'Cloud Prep',
      summary: 'Dumala now supports multiple local team workspaces and has clearer Supabase migration foundations for future cloud-backed continuity.',
      accent: 'border-indigo-200 bg-indigo-50/70',
      renderContent: () => (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Yesterday's update focused on preparing Dumala for coaches who manage more than one team and for a safer future migration path from browser-only workspaces toward Supabase-backed cloud storage.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                title: 'Multiple team workspaces',
                desc: 'Coaches can create, switch, rename, delete, import, and manage separate team workspaces from the app shell.'
              },
              {
                title: 'Workspace state is isolated',
                desc: 'Each managed team keeps its own roster, staff, matches, standings, assessments, bulletins, tactics, and payment records.'
              },
              {
                title: 'Safer browser persistence',
                desc: 'Workspace storage helpers now copy active records into the selected team space before switching, reducing accidental cross-team data mixing.'
              },
              {
                title: 'Supabase migration direction',
                desc: 'The cloud path remains Supabase-based, with local-first data protected while the app prepares for future durable cloud workspace sync.'
              },
              {
                title: 'Migration-ready boundaries',
                desc: 'Cloud-facing code stays behind runtime and data-access boundaries so the normal local workflow does not depend on a signed-in cloud account.'
              },
              {
                title: 'Evidence-based development link',
                desc: 'Training recommendations now connect more directly to assessment evidence, preparing development data for stronger future reporting.'
              }
            ].map(item => (
              <div key={item.title} className="bg-white border border-indigo-200 rounded-xl p-4">
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">{item.title}</h5>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            This is migration setup, not a forced cloud account flow. Existing local team workspaces remain usable without sign-in.
          </p>
        </div>
      )
    },
    {
      id: 'coaching_library_redesigned',
      date: '2026-06-26',
      title: 'Coaching Library Redesigned and Expanded',
      badge: 'Coaching Library',
      summary: 'Tactics now includes a cleaner Coaching Library with data-driven articles, SVG tactical diagrams, and more formation references for future expansion.',
      accent: 'border-violet-200 bg-violet-50/70',
      renderContent: () => (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            The Tactics workspace now separates live match-board planning from a structured Coaching Library. Coaches can browse formation references, attack and defense concepts, tactical principles, and famous tactical models without crowding the pitch layout.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                title: 'Cleaner reading layout',
                desc: 'The library moved away from dense nested boxes into lighter article cards with bullet-point learning notes and clearer coaching takeaways.'
              },
              {
                title: 'Reusable knowledge model',
                desc: 'Formation, phase, principle, and case-study content now lives in structured data so future topics can be added without rewriting the component.'
              },
              {
                title: 'Inline tactical SVGs',
                desc: 'Simple pitch diagrams now show formations, overloads, defensive blocks, pressing ideas, and case-study movement patterns directly in each topic.'
              },
              {
                title: 'More formation coverage',
                desc: 'The library now includes additional shapes such as 3-4-3, 4-1-4-1, 5-3-2, 4-3-1-2, and 4-4-1-1 alongside the original core systems.'
              },
              {
                title: 'Better diagram consistency',
                desc: 'Formation SVG spacing, arrow thickness, arrowhead sizing, and caption behavior were adjusted so cards read more evenly.'
              },
              {
                title: 'Drill library groundwork',
                desc: 'Training drills were also extracted into a typed data module with reusable drill cards, preparing the training catalog for easier future expansion.'
              }
            ].map(item => (
              <div key={item.title} className="bg-white border border-violet-200 rounded-xl p-4">
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">{item.title}</h5>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'assessment_team_history_notes',
      date: '2026-06-25',
      title: 'Assessment Team History and Notes Added',
      badge: 'Assessment Tools',
      summary: 'Assessment Center now has direct team history access and coach notes on saved assessment sessions.',
      accent: 'border-sky-200 bg-sky-50/70',
      renderContent: () => (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Coaches can open the full team Assessment History from the Assessment Center and add session-specific notes for context, follow-up, and player feedback.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                title: 'Team history button',
                desc: 'A new Assessment Center action opens every saved FPRDS assessment across the squad.'
              },
              {
                title: 'Player drill-down',
                desc: 'From team history, coaches can jump into one player\'s individual assessment history.'
              },
              {
                title: 'Coach notes',
                desc: 'Each saved session now supports editable notes for observations, reminders, and review context.'
              },
              {
                title: 'Backup support',
                desc: 'Notes are stored on assessment records, so they travel with the existing workspace backup flow.'
              }
            ].map(item => (
              <div key={item.title} className="bg-white border border-sky-200 rounded-xl p-4">
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">{item.title}</h5>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'fprds_comparison_reports',
      date: '2026-06-22',
      title: 'FPRDS Player and Session Reports Added',
      badge: 'Reports Added',
      summary: 'Assessment History now includes player-to-player and session-to-session reports for comparing OVR and weighted attribute gaps.',
      accent: 'border-indigo-200 bg-indigo-50/70',
      renderContent: () => (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Coaches can now compare FPRDS assessment records directly inside the Assessment History view, without manually reading every session card.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                title: 'Player-to-player reports',
                desc: 'Compare the selected player\'s latest FPRDS assessment against another assessed player and review OVR gap plus weighted attribute differences.'
              },
              {
                title: 'Session-to-session reports',
                desc: 'Select any two saved sessions for the player to see baseline, target, total OVR change, and attribute-by-attribute movement.'
              },
              {
                title: 'Role-aware comparisons',
                desc: 'Reports focus on the weighted attributes for the relevant FPRDS role, keeping comparison output tied to football context.'
              },
              {
                title: 'Next reporting step',
                desc: 'The next FPRDS beta task is downloadable assessment and development reports.'
              }
            ].map(item => (
              <div key={item.title} className="bg-white border border-indigo-200 rounded-xl p-4">
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">{item.title}</h5>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'fprds_historical_progress_charts',
      date: '2026-06-20',
      title: 'FPRDS Historical Progress Charts Added',
      badge: 'Progress Tracking',
      summary: 'Assessment History now charts real saved FPRDS sessions so coaches can see OVR movement and same-role attribute trends over time.',
      accent: 'border-emerald-200 bg-emerald-50/70',
      renderContent: () => (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Dumala now turns saved assessment history into actual progress charts instead of leaving coaches to compare session cards manually.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                title: 'Real OVR timeline',
                desc: 'The chart is built from saved FPRDS assessment sessions and shows the player\'s OVR movement across assessment dates.'
              },
              {
                title: 'Same-role attribute trend',
                desc: 'For the latest role, Dumala charts the most important weighted attributes across matching role assessments.'
              },
              {
                title: 'Progress summary',
                desc: 'Assessment History now shows session count, latest OVR, and change from first to latest saved session.'
              },
              {
                title: 'Practitioner review deferred',
                desc: 'External benchmark signoff remains planned, but implementation moved ahead to the next FPRDS beta reporting task.'
              }
            ].map(item => (
              <div key={item.title} className="bg-white border border-emerald-200 rounded-xl p-4">
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">{item.title}</h5>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'fprds_benchmark_review_package',
      date: '2026-06-18',
      title: 'FPRDS Benchmark Review Package Prepared',
      badge: 'Review Package',
      summary: 'The next FPRDS beta gate is now organized around a practitioner review packet for benchmark tables, assumptions, role weights, signoff, and corrections.',
      accent: 'border-sky-200 bg-sky-50/70',
      renderContent: () => (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Dumala now has a structured review package for qualified football practitioners to assess the current FPRDS benchmark tables before the ratings are treated as approved beyond beta use.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                title: 'Benchmark tables gathered',
                desc: 'Sprint, agility, endurance, jump, medicine-ball, shot-power, ball-retention, count, and coach-score tables are documented in one review packet.'
              },
              {
                title: 'Assumptions are explicit',
                desc: 'The package records age-group boundaries, scoring ranges, interpolation behavior, open-ended tiers, and beta-use limits.'
              },
              {
                title: 'Role weights are reviewable',
                desc: 'ST, W, CM, CDM, FB, CB, and GK weights are laid out so practitioners can challenge the football profile behind each OVR.'
              },
              {
                title: 'Signoff path is ready',
                desc: 'Reviewer fields, checklist decisions, correction logging, and approval gates are defined before benchmark changes are made.'
              }
            ].map(item => (
              <div key={item.title} className="bg-white border border-sky-200 rounded-xl p-4">
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">{item.title}</h5>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            The benchmark review itself is still open. The next step is to collect qualified practitioner decisions, apply any required corrections, and only then mark benchmark review complete.
          </p>
        </div>
      )
    },
    {
      id: 'cloud_collaboration_foundation_completed',
      date: '2026-06-25',
      title: 'Cloud and Team Collaboration Foundation Completed',
      badge: 'Cloud Foundation',
      summary: 'Dumala now has the cloud platform foundation, production approval controls, club roles, invitations, activity history, shared bulletins, and overwrite-safe editing needed for a private beta collaboration workflow.',
      accent: 'border-indigo-200 bg-indigo-50/70',
      renderContent: () => (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            This update completes the backend foundation for Dumala's next stage: secure cloud-backed club workspaces and controlled team collaboration. The work focused on making shared data durable, role-aware, auditable, and protected from accidental overwrites before expanding the visible collaboration UI.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                title: 'Supabase cloud platform selected and approved',
                desc: 'Dumala now has an architecture decision record confirming Supabase, PostgreSQL, Supabase Auth, Vercel hosting, IndexedDB replica storage, and optimistic sync controls as the cloud direction.'
              },
              {
                title: 'Production launch gates are documented',
                desc: 'Production approval records, cloud readiness checks, access-control ownership, privacy review, diagnostic boundaries, incident runbooks, restore evidence, and approval verification are now tracked.'
              },
              {
                title: 'Durable club workspace schema is in place',
                desc: 'The Supabase schema now covers user profiles, clubs, memberships, devices, imports, sync metadata, audit events, and core football domain records with tenant-scoped row-level security.'
              },
              {
                title: 'Roles and invitations are ready',
                desc: 'Owner, Admin, Coach, Staff, and Viewer permissions are modeled, tested, and backed by database policies. Club invitations can be created, revoked, accepted, and converted into memberships safely.'
              },
              {
                title: 'Activity history is auditable',
                desc: 'Sensitive collaboration actions now write redacted activity records, with owner/admin access to club history and tighter boundaries for ordinary members.'
              },
              {
                title: 'Shared bulletins use controlled editing',
                desc: 'Cloud bulletins can be listed, created, updated, and removed through permission-aware helpers and version-checked database functions instead of blind updates.'
              },
              {
                title: 'Simultaneous edits are protected',
                desc: 'Versioned cloud records now reject stale updates so one user cannot silently overwrite another user\'s newer work. Conflicts are surfaced as explicit version errors.'
              },
              {
                title: 'Build verification is more stable',
                desc: 'The Vite cache path was isolated to prevent a Windows parallel-build cache collision that could surface during simultaneous build and test verification.'
              }
            ].map(item => (
              <div key={item.title} className="bg-white border border-indigo-200 rounded-xl p-4">
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">{item.title}</h5>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Phase 3 cloud accounts and synchronization and Phase 4 team collaboration are now marked complete in the delivery tracker. Independent backup storage remains the main operational upgrade to complete before inviting external beta users beyond the current private-beta posture.
          </p>
        </div>
      )
    },
    {
      id: 'squad_payments_ledger_added',
      date: '2026-06-24',
      title: 'Squad Payments / Ledger Tab Added',
      badge: 'Payments',
      summary: 'Squad now includes a Payments tab for tracking player fees, payments, balances, overdue amounts, and payment history inside the team workspace.',
      accent: 'border-emerald-200 bg-emerald-50/70',
      renderContent: () => (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            This update adds a practical cash-ledger workflow inside Squad. Coaches and team administrators can now keep fee records close to the player roster without turning Dumala into a full accounting or online payment-processing system.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                title: 'Payments tab under Squad',
                desc: 'The Squad workspace now has Players, Staff, and Payments sections, keeping payment tracking near the roster records it belongs to.'
              },
              {
                title: 'Ledger-based records',
                desc: 'Fees, payments, waivers, refunds, and adjustments are stored as separate ledger entries instead of manually editing player balances.'
              },
              {
                title: 'Player payment summaries',
                desc: 'The Payments view calculates each player\'s charged total, paid total, balance, overdue status, and last payment date from the ledger.'
              },
              {
                title: 'Single-player and bulk charges',
                desc: 'Teams can record an individual fee or payment, or create the same charge for multiple active players in one workflow.'
              },
              {
                title: 'Void instead of delete',
                desc: 'Ledger entries can be voided with a reason, preserving a clearer payment history instead of silently removing financial records.'
              },
              {
                title: 'Backup and restore support',
                desc: 'Full Workspace V4 backups now include payment ledger records, and restore validation keeps payment data protected with the rest of the workspace.'
              }
            ].map(item => (
              <div key={item.title} className="bg-white border border-emerald-200 rounded-xl p-4">
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">{item.title}</h5>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            The first version is intentionally local-first and workspace-only. It helps teams track cash, GCash, bank transfer, card, and other manual payment records without implying online checkout, invoices, or accounting-grade reporting.
          </p>
        </div>
      )
    },
    {
      id: 'reliability_foundation_upgraded',
      date: '2026-06-23',
      title: 'Reliability and Recovery Foundation Upgraded',
      badge: 'Reliability',
      summary: 'Dumala now protects unreadable saved data, warns before browser storage fills, guides coaches to affected records, and automatically verifies offline production behavior.',
      accent: 'border-amber-400/20 bg-slate-950/90 text-slate-100',
      renderContent: () => (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            This update focused on trust. Across the recent reliability tranches, Dumala strengthened how assessment data is handled, how broken or mismatched workspace records are detected, and how coaches are guided back to the exact players, matches, or standings entries that need review.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                title: 'Assessment data is more dependable',
                desc: 'Assessment snapshot handling was separated into a dedicated service boundary so evaluation workflows are easier to maintain and less likely to regress as the product grows.'
              },
              {
                title: 'Workspace issues are easier to fix',
                desc: 'The workspace integrity checker now reports specific data mismatches and highlights the affected players, fixtures, or league rows so coaches can review the right record immediately.'
              },
              {
                title: 'Unreadable browser data stays protected',
                desc: 'Startup validation now pauses before writing defaults over malformed records, with recovery export, retry, diagnostics, and confirmed reset actions.'
              },
              {
                title: 'Core coaching tools are safer',
                desc: 'Type-safety cleanup reduced weak data boundaries across assessments, tactics, schedule, standings, dashboard, announcements, and player workflows.'
              },
              {
                title: 'Players and staff are modeled separately',
                desc: 'Athletes now keep football statistics and assessments in a dedicated player model, while management and coaches use staff-specific profiles, storage, and backup records.'
              },
              {
                title: 'Storage pressure is visible early',
                desc: 'Dumala now warns when the browser reports that site storage is approaching its quota and offers an immediate full-workspace backup.'
              },
              {
                title: 'Offline readiness is now verified automatically',
                desc: 'Production builds now run an automated cold-launch and refresh check while offline, and GitHub Actions installs Chromium so the same verification happens in CI.'
              }
            ].map(item => (
              <div key={item.title} className="rounded-xl border border-amber-400/20 bg-slate-900/80 p-4 shadow-sm shadow-black/20">
                <h5 className="text-xs font-black text-amber-100 uppercase tracking-wider mb-1.5">{item.title}</h5>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The result is a steadier beta: coaches get clearer feedback when something is inconsistent, faster paths to fix it, and stronger confidence that key workflows and offline access will hold up in real weekly use.
          </p>
        </div>
      )
    },
    {
      id: 'offline_app_shell_released',
      date: '2026-06-21',
      title: 'Installable Offline App Shell Released',
      badge: 'Offline Ready',
      summary: 'Dumala can now install its application interface, reopen without internet, and apply new releases through a controlled update prompt.',
      accent: 'border-sky-400/20 bg-slate-950/90 text-slate-100',
      renderContent: () => (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Dumala now includes a production service worker that saves the application shell, generated interface files, logos, icons, and local player placeholder artwork on the device. After a successful online load, an installed copy can reopen and refresh even when the connection is unavailable.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                title: 'Local work stays available',
                desc: 'Roster editing, tactics, training, assessments, scheduling, notes, and other browser-stored workflows remain available when the app interface is offline.'
              },
              {
                title: 'Controlled updates',
                desc: 'New Dumala releases download in the background. Coaches can choose Update now for one controlled reload or Later to continue the current session.'
              },
              {
                title: 'Clear connection status',
                desc: 'The app now reports offline, reconnected, offline-ready, update-available, and service-worker registration states without blocking normal work.'
              },
              {
                title: 'Private data boundary',
                desc: 'Team records, uploaded workspace data, backup files, and future authentication tokens are never stored in the service-worker cache.'
              }
            ].map(item => (
              <div key={item.title} className="rounded-xl border border-sky-400/20 bg-slate-900/80 p-4 shadow-sm shadow-black/20">
                <h5 className="text-xs font-black text-sky-100 uppercase tracking-wider mb-1.5">{item.title}</h5>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Feedback delivery and external resources still require internet. Physical-device cold-launch testing continues across supported desktop, Android, iPhone, and iPad browsers.
          </p>
        </div>
      )
    },
    {
      id: 'assessment_center_implemented',
      date: '2026-06-15',
      title: 'Assessment Center and Core Workflow Expansion',
      badge: 'Core Workflow',
      summary: 'Dumala now supports structured assessments alongside stronger day-to-day team management workflows.',
      accent: 'border-emerald-200 bg-emerald-50/70',
      renderContent: () => (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            This release expands Dumala into a more complete football team operating workspace. The platform now goes beyond basic team records by combining <strong>structured player assessments</strong> with practical day-to-day coaching tools such as squad organization, scheduling, tactical planning, and development tracking.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            The new <strong>Assessment Center</strong> gives coaches a guided flow for reviewing players in a more consistent and repeatable way. Instead of relying on memory, chat notes, or paper-based impressions after training, coaches can now record evaluations inside a clearer in-app workflow that supports better review, discussion, and follow-up.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            At the same time, the wider site experience is now more useful as a weekly coaching hub. Roster records, match scheduling, tactical organization, training planning, and player development workflows are all becoming more connected, making it easier to manage the full coaching cycle in one place instead of jumping between separate tools.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            This update matters because it strengthens both sides of the product: operational team management and player development. It gives coaches a more informative base for squad planning today while also preparing Dumala for the longer-term shift toward FPRDS and more objective rating systems in future releases.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                title: 'Assessments and live review',
                desc: 'Coaches can now use a dedicated assessment workflow with clearer player review context, making evaluations easier to repeat, compare, and discuss.'
              },
              {
                title: 'Roster and squad management',
                desc: 'Team data stays more organized through a centralized roster workflow that helps coaches manage players, staff, and squad structure in one place.'
              },
              {
                title: 'Schedule and match operations',
                desc: 'The site continues to support weekly team operations such as planning fixtures, tracking match context, and keeping club activity visible throughout the season.'
              },
              {
                title: 'Training and development planning',
                desc: 'Training workflows and development-focused features now connect more naturally with player review, helping coaches turn observations into actionable improvement work.'
              },
              {
                title: 'Tactical organization',
                desc: 'Tactics tools continue to support lineup planning, match preparation, and role-based thinking so coaches can translate squad decisions into game-ready structure.'
              },
              {
                title: 'Foundation for objective scoring',
                desc: 'This release creates a stronger bridge from today’s coach-led workflows toward the future FPRDS model built on standardized drills and more objective measurement.'
              }
            ].map((item) => (
              <div key={item.title} className="bg-white border border-emerald-200 rounded-xl p-4">
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">{item.title}</h5>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'fprds_vision_announced',
      date: '2026-06-01',
      title: 'Coming Soon: FPRDS Vision Announced',
      badge: 'FPRDS Vision',
      summary: 'Objective player rating and development framework planned as the next major evolution of Dumala.',
      accent: 'border-slate-700 bg-slate-950',
      renderContent: () => (
        <div className="space-y-6">
          <div>
            <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">Product MVP — Version 2.0</p>
            <h4 className="text-lg font-black text-white">Product Vision</h4>
            <p className="text-sm text-slate-300 leading-relaxed mt-2">
              The Football Player Rating &amp; Development System (FPRDS) is a data-driven assessment platform designed for football coaches, academies, clubs, and development programs.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed mt-2">
              The system allows coaches to conduct standardized football drills during training sessions, record results directly from a mobile device, and automatically generate FIFA/eFootball-style player ratings based on <strong>objective measurements</strong> rather than subjective opinions.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed mt-2">
              The platform focuses on player development by identifying weaknesses and recommending targeted drills to improve specific attributes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <h5 className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-2">Primary Goals</h5>
              <ul className="list-disc pl-4 text-xs text-slate-300 space-y-1">
                <li>Create objective player ratings</li>
                <li>Standardize player evaluations</li>
                <li>Track player development over time</li>
                <li>Recommend improvement programs</li>
                <li>Help coaches make position-based decisions</li>
                <li>Generate FIFA-style player cards</li>
              </ul>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <h5 className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-2">Problems Solved</h5>
              <p className="text-xs text-slate-300 leading-relaxed">
                Traditional coaching evaluations often rely on subjective observations. This system converts those opinions into measurable, repeatable, and trackable data.
              </p>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <h5 className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-2">Assessment Philosophy</h5>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every player rating must be generated from: <strong>standardized drills, repeatable testing procedures, objective measurements,</strong> and <strong>position-specific calculations.</strong> The same player should receive similar ratings regardless of which coach performs the assessment.
            </p>
          </div>

          <div className="border border-slate-700 rounded-2xl p-5 space-y-6 bg-slate-900/60">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
              <Hash size={18} className="text-indigo-300" />
              <h4 className="font-black text-white text-sm uppercase tracking-wider">FPRDS Scoring &amp; Ranking Formula System</h4>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              How raw drill results become 0–100 attribute scores. Every attribute score in FPRDS is generated in <strong>three steps</strong>: raw result → benchmark conversion → linear interpolation.
            </p>

            <div className="border border-slate-700 rounded-xl p-4 space-y-2 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded">Step 1</span>
                <h5 className="font-black text-slate-100 text-xs uppercase tracking-wider">Age Group Classification</h5>
              </div>
              <p className="text-xs text-slate-300">Before any score is calculated, the player is assigned to an age group. All benchmark tables are age-grouped.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse mt-2">
                  <thead>
                    <tr className="bg-slate-800">
                      <th className="text-left p-2 border border-slate-700 font-bold text-slate-200">Age Group</th>
                      <th className="text-left p-2 border border-slate-700 font-bold text-slate-200">Age Range</th>
                      <th className="text-left p-2 border border-slate-700 font-bold text-slate-200">Label</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border border-slate-700 font-mono text-slate-200">U12</td>
                      <td className="p-2 border border-slate-700 text-slate-300">10–12</td>
                      <td className="p-2 border border-slate-700 text-slate-300">Youth — Junior</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-700 font-mono text-slate-200">U15</td>
                      <td className="p-2 border border-slate-700 text-slate-300">13–15</td>
                      <td className="p-2 border border-slate-700 text-slate-300">Youth — Intermediate</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-700 font-mono text-slate-200">U18</td>
                      <td className="p-2 border border-slate-700 text-slate-300">16–18</td>
                      <td className="p-2 border border-slate-700 text-slate-300">Youth — Senior</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-700 font-mono text-slate-200">Adult</td>
                      <td className="p-2 border border-slate-700 text-slate-300">18+</td>
                      <td className="p-2 border border-slate-700 text-slate-300">Open / Amateur</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-400 italic">For mixed environments, always classify by the player's age at the time of assessment. A player moving between groups mid-season will have their historical scores benchmarked against the group they were in at assessment date.</p>
            </div>

            <div className="border border-slate-700 rounded-xl p-4 space-y-2 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded">Step 2</span>
                <h5 className="font-black text-slate-100 text-xs uppercase tracking-wider">Benchmark Tables</h5>
              </div>
              <p className="text-xs text-slate-300">Each drill has a benchmark table with <strong>5 tiers</strong> mapping to score ranges:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse mt-2">
                  <thead>
                    <tr className="bg-slate-800">
                      <th className="text-left p-2 border border-slate-700 font-bold text-slate-200">Tier</th>
                      <th className="text-left p-2 border border-slate-700 font-bold text-slate-200">Score Range</th>
                      <th className="text-left p-2 border border-slate-700 font-bold text-slate-200">Label</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border border-slate-700"><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">Elite</span></td>
                      <td className="p-2 border border-slate-700 font-mono text-slate-200">90–99</td>
                      <td className="p-2 border border-slate-700 text-slate-300">Top-level performer</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-700"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">Advanced</span></td>
                      <td className="p-2 border border-slate-700 font-mono text-slate-200">75–89</td>
                      <td className="p-2 border border-slate-700 text-slate-300">Above average</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-700"><span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold">Developing</span></td>
                      <td className="p-2 border border-slate-700 font-mono text-slate-200">55–74</td>
                      <td className="p-2 border border-slate-700 text-slate-300">Average / on track</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-700"><span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold">Below Avg</span></td>
                      <td className="p-2 border border-slate-700 font-mono text-slate-200">35–54</td>
                      <td className="p-2 border border-slate-700 text-slate-300">Needs improvement</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-700"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold">Beginner</span></td>
                      <td className="p-2 border border-slate-700 font-mono text-slate-200">10–34</td>
                      <td className="p-2 border border-slate-700 text-slate-300">Significant gap</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-400 italic">Scores below 10 are possible only in extreme cases. No score is ever 0 unless a drill is not attempted.</p>
            </div>

            <div className="border border-slate-700 rounded-xl p-4 space-y-2 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded">Step 3</span>
                <h5 className="font-black text-slate-100 text-xs uppercase tracking-wider">Linear Interpolation Formula</h5>
              </div>
              <p className="text-xs text-slate-300">Once the benchmark tier is identified, the exact score within that tier is calculated using:</p>
              <div className="bg-slate-950 text-emerald-300 p-3 rounded-lg font-mono text-xs overflow-x-auto mt-2 border border-slate-700">
                Score = Tier_Min + ((Best_In_Tier - Raw_Result) / (Best_In_Tier - Worst_In_Tier)) × (Tier_Max - Tier_Min)
              </div>
              <ul className="list-disc pl-5 text-xs text-slate-300 space-y-1">
                <li><strong>Time-based drills</strong> (lower = better): Best_In_Tier is the fastest time in the tier</li>
                <li><strong>Distance/count-based drills</strong> (higher = better): Best_In_Tier is the highest value in the tier</li>
              </ul>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Calculator size={16} className="text-indigo-600" />
                <h5 className="font-black text-slate-800 text-xs uppercase tracking-wider">Worked Example — 30m Sprint (Time-Based)</h5>
              </div>
              <p className="text-xs text-slate-700">
                Player records <strong>4.35 seconds</strong>. Age group: <strong>Adult</strong>.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-indigo-100/50">
                      <th className="text-left p-2 border border-indigo-200 font-bold text-slate-700">Tier</th>
                      <th className="text-left p-2 border border-indigo-200 font-bold text-slate-700">Time Range</th>
                      <th className="text-left p-2 border border-indigo-200 font-bold text-slate-700">Score Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border border-indigo-100 text-slate-600">Elite</td>
                      <td className="p-2 border border-indigo-100 font-mono text-slate-600">&lt; 3.90s</td>
                      <td className="p-2 border border-indigo-100 font-mono text-slate-600">90–99</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-indigo-100 text-slate-600">Advanced</td>
                      <td className="p-2 border border-indigo-100 font-mono text-slate-600">3.90s – 4.19s</td>
                      <td className="p-2 border border-indigo-100 font-mono text-slate-600">75–89</td>
                    </tr>
                    <tr className="bg-amber-50">
                      <td className="p-2 border border-indigo-100 font-bold text-amber-700">Developing</td>
                      <td className="p-2 border border-indigo-100 font-mono font-bold text-amber-700">4.20s – 4.59s</td>
                      <td className="p-2 border border-indigo-100 font-mono font-bold text-amber-700">55–74</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-indigo-100 text-slate-600">Below Avg</td>
                      <td className="p-2 border border-indigo-100 font-mono text-slate-600">4.60s – 4.99s</td>
                      <td className="p-2 border border-indigo-100 font-mono text-slate-600">35–54</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-indigo-100 text-slate-600">Beginner</td>
                      <td className="p-2 border border-indigo-100 font-mono text-slate-600">5.00s+</td>
                      <td className="p-2 border border-indigo-100 font-mono text-slate-600">10–34</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-700">
                Player falls in <strong>Developing</strong> tier (4.20s – 4.59s → score range 55–74).
              </p>
              <div className="bg-white border border-indigo-200 rounded-lg p-3 font-mono text-xs text-slate-700 space-y-1">
                <div>Score = 55 + ((4.59 - 4.35) / (4.59 - 4.20)) × (74 - 55)</div>
                <div>Score = 55 + (0.24 / 0.39) × 19</div>
                <div>Score = 55 + 0.615 × 19</div>
                <div>Score = 55 + 11.7</div>
                <div className="text-indigo-700 font-bold pt-1 border-t border-indigo-100 mt-1">30m Sprint Sub-Score = 67</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'roadmap_snapshot',
      date: '2026-07-05',
      title: 'Roadmap Snapshot',
      badge: 'Roadmap',
      summary: 'A practical development sequence covering the active beta, saved Game Plans, dashboard/session summaries, cloud-ready planning data, objective player development, SaaS validation, and longer-term public profile and club operations work.',
      accent: 'border-slate-700/70 bg-slate-950/90 text-slate-100',
      renderContent: () => (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm shadow-black/20">
            <p className="text-xs text-slate-300 leading-relaxed">
              This roadmap shows the intended order of development rather than fixed release dates. Priorities may change as beta testers identify more urgent coaching and club-management needs.
            </p>
          </div>
          {[
            {
              phase: 'Current Beta',
              status: 'Complete',
              objective: 'Reliability and data confidence',
              deliverables: [
                'Fix workflow and display defects across the main coaching tools.',
                'Validate standings calculations and the full match-result update flow.',
                'Improve backup import validation, recovery guidance, and malformed-data handling.',
                'Standardize roster, tactics, training, schedule, and assessment data behavior.',
                'Connect match preparation and training delivery with saved Game Plans, dashboard game-plan summaries, daily session summaries, and readiness signals.',
                'Keep the beta feedback loop visible so real coach testing can steer what gets refined next.'
              ],
              benefit: 'Coaches can trust Dumala as a weekly command center that points them toward the next useful match, training, or squad action.',
              completion: 'Core workflows, planning summaries, and recovery paths work without unexpected data loss.',
              color: 'border-l-amber-400 bg-amber-400/10',
              badge: 'border-amber-400/30 bg-amber-400/15 text-amber-100'
            },
            {
              phase: 'FPRDS Beta',
              status: 'Current',
              objective: 'FPRDS development system',
              deliverables: [
                'Complete standardized assessments for every supported position and age group.',
                'Finalize benchmark tables through qualified practitioner review, scoring validation, and explainable rating calculations.',
                'Add historical progress charts, comparison reports, and measurable development plans.',
                'Keep training evidence, rating confidence, and verified assessment results clearly separated.',
                'Produce downloadable player assessment and progress reports.'
              ],
              benefit: 'Coaches gain consistent evidence for player evaluation, training priorities, and development conversations.',
              completion: 'Repeated assessments produce consistent, explainable, and comparable development records.',
              color: 'border-l-emerald-400 bg-emerald-400/10',
              badge: 'border-emerald-400/30 bg-emerald-400/15 text-emerald-100'
            },
            {
              phase: 'Phase 1',
              status: 'Complete',
              objective: 'Offline-ready web app',
              deliverables: [
                'Validate the installed Progressive Web App on production devices.',
                'Verify cold launch and refresh across desktop, Android, iPhone, and iPad while offline.',
                'Confirm roster editing, tactics, assessments, scheduling, training, and notes remain reliable without internet.',
                'Complete controlled-update and physical-device offline validation.'
              ],
              benefit: 'Teams can continue working at pitches and venues with unreliable or unavailable internet access.',
              completion: 'An installed device can reopen Dumala and use all local features while offline.',
              color: 'border-l-blue-400 bg-blue-400/10',
              badge: 'border-blue-400/30 bg-blue-400/15 text-blue-100'
            },
            {
              phase: 'Phase 2',
              status: 'Complete',
              objective: 'Mobile and tablet experience',
              deliverables: [
                'Create navigation and workspace layouts designed for tablets.',
                'Improve touch controls, form sizing, tactical-board interaction, and responsive tables.',
                'Test the complete coaching workflow on common Android tablet sizes.',
                'Use the Phase 2 support contract for viewport bands, touch targets, and verification coverage.'
              ],
              benefit: 'Coaches can comfortably manage the team from the sideline, training ground, or match venue.',
              completion: 'Primary coaching workflows work comfortably on supported mobile and tablet viewports. Google Play packaging is deferred until core cloud, collaboration, and public-release capabilities stabilize.',
              color: 'border-l-cyan-400 bg-cyan-400/10',
              badge: 'border-cyan-400/30 bg-cyan-400/15 text-cyan-100'
            },
            {
              phase: 'Phase 3',
              status: 'Complete',
              objective: 'Cloud accounts and synchronization',
              deliverables: [
                'Add secure user accounts, club workspaces, and durable cloud storage.',
                'Provide a guided migration from existing browser data without deleting local records.',
                'Synchronize approved changes across devices after connectivity returns.',
                'Handle interrupted uploads, duplicate updates, and recovery from failed synchronization.',
                'Carry newer planning records, including saved Game Plans, through the local-to-cloud migration path.'
              ],
              benefit: 'Users can move between devices without manually transferring backups or losing their club workspace.',
              completion: 'A user can sign in on another device and safely access the same club data.',
              color: 'border-l-indigo-400 bg-indigo-400/10',
              badge: 'border-indigo-400/30 bg-indigo-400/15 text-indigo-100'
            },
            {
              phase: 'Phase 4',
              status: 'Complete',
              objective: 'Team collaboration',
              deliverables: [
                'Add Owner, Admin, Coach, Staff, and Viewer permissions.',
                'Support club invitations, controlled editing, shared bulletins, and an activity history.',
                'Protect sensitive actions with role-based access rules.',
                'Resolve simultaneous edits without silently overwriting another user\'s work.'
              ],
              benefit: 'Club staff can work from one shared source of truth while retaining clear responsibilities.',
              completion: 'Authorized staff can safely manage one shared team according to their assigned role.',
              color: 'border-l-violet-400 bg-violet-400/10',
              badge: 'border-violet-400/30 bg-violet-400/15 text-violet-100'
            },
            {
              phase: 'Phase 5',
              status: 'Long Term',
              objective: 'Public profiles and player drafting',
              deliverables: [
                'Upgrade player profile cards with verified football information, position history, attributes, assessment results, achievements, media, and development highlights.',
                'Create draft-ready player profiles that coaches can shortlist, compare, review, and organize for trials or squad selection.',
                'Give eligible players a public profile with a memorable personalized link that can be shared with clubs, coaches, academies, and scouts.',
                'Give each team a public club profile with its own personalized link, crest, staff, roster highlights, achievements, contact details, and selected updates.',
                'Add privacy controls, publishing approval, profile visibility settings, link availability checks, and reporting tools for public information.'
              ],
              benefit: 'Players can present a credible football profile while teams can showcase their identity and evaluate prospective athletes through a structured drafting workflow.',
              completion: 'Authorized users can publish controlled player and team profiles through unique links, and coaches can reliably shortlist and compare draft candidates.',
              color: 'border-l-fuchsia-400 bg-fuchsia-400/10',
              badge: 'border-fuchsia-400/30 bg-fuchsia-400/15 text-fuchsia-100'
            },
            {
              phase: 'Future Expansion: Coaching',
              status: 'Long Term',
              objective: 'Philippine coach education and professional development',
              deliverables: [
                'Build a coach knowledge base covering session planning, tactics, player development, conditioning, leadership, safeguarding, first aid, and the Laws of the Game.',
                'Explain the Philippine coaching qualification pathway using current guidance from the Philippine Football Federation and the Asian Football Confederation.',
                'Provide official PFF, AFC, and FIFA resource links for recognized coaching courses, announcements, requirements, and registration information.',
                'Add a coach education planner for prerequisites, learning goals, recommended next qualifications, workshops, seminars, and continuing development.',
                'Track certificates with qualification name, issuing authority, licence number, issue date, expiry date, supporting document, and verification status.',
                'Add renewal reminders, a private coaching journal, session reflections, development goals, and a downloadable coaching portfolio.',
                'Expand staff profiles with coaching specialties, age groups coached, experience, achievements, course history, and approved public credentials.',
                'Keep official qualifications separate from Dumala Development Progress, which may summarize completed learning activities but must never appear as a PFF or AFC rating.'
              ],
              benefit: 'Philippine coaches can understand recognized development pathways, organize their credentials, and build practical coaching knowledge without confusing app progress with an official licence.',
              completion: 'Coaches can find official Philippine guidance, record qualifications and development activity, control what appears publicly, and clearly distinguish verified credentials from Dumala progress.',
              color: 'border-l-sky-400 bg-sky-400/10',
              badge: 'border-sky-400/30 bg-sky-400/15 text-sky-100'
            },
            {
              phase: 'Future Expansion: Clubs',
              status: 'Long Term',
              objective: 'Club operations expansion',
              deliverables: [
                'Add attendance, player availability history, season archives, and richer operational reports.',
                'Support calendar export and scheduled team reminders.',
                'Manage multiple squads or age groups inside one club workspace.',
                'Provide season-to-season continuity for records, reports, and development history.'
              ],
              benefit: 'Growing clubs can manage more of their football operations without splitting data across separate tools.',
              completion: 'A club can manage multiple squads and seasons from one organized workspace.',
              color: 'border-l-rose-400 bg-rose-400/10',
              badge: 'border-rose-400/30 bg-rose-400/15 text-rose-100'
            },
            {
              phase: 'Commercial Validation',
              status: 'In Progress',
              objective: 'Commercial validation and SaaS packaging',
              deliverables: [
                'Lead the public offer with weekly admin relief, match-week preparation, and clearer player development.',
                'Package pricing as two clear choices: Free during beta and a Premium monthly subscription, with Coach, Club, and Academy value framed inside Premium.',
                'Keep the public landing page, installed app route, and cloud sign-in return path aligned around the coach workspace.',
                'Validate whether solo coaches will pay roughly USD 9-15 per month before introducing any future club-scale pricing.',
                'Build a first-week success flow that gets a coach to value after adding 8-12 players and one upcoming match.',
                'Prepare a demo/sample workspace so coaches can evaluate the product before full setup.',
                'Recruit 10-20 real coaches or clubs for private beta feedback, activation tracking, and willingness-to-pay interviews.'
              ],
              benefit: 'Dumala earns a tested subscription story and real coach feedback before paid packaging is treated as validated.',
              completion: 'A coach-facing pitch, a simple first offer, and real activation and willingness-to-pay feedback are in place.',
              color: 'border-l-pink-400 bg-pink-400/10',
              badge: 'border-pink-400/30 bg-pink-400/15 text-pink-100'
            }
          ].map((item) => (
            <div key={item.phase} className={`rounded-r-xl border border-l-4 border-slate-800 ${item.color} p-4 shadow-sm shadow-black/20 md:p-5 space-y-4`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.phase}</span>
                  <h5 className="text-sm font-black text-slate-100 mt-1">{item.objective}</h5>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${item.badge}`}>
                  {item.status}
                </span>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Planned deliverables</p>
                <ul className="list-disc pl-5 text-xs text-slate-300 leading-relaxed space-y-1.5">
                  {item.deliverables.map((deliverable) => (
                    <li key={deliverable}>{deliverable}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-700/80 bg-slate-950/50 p-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">User benefit</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.benefit}</p>
                </div>
                <div className="rounded-lg border border-slate-700/80 bg-slate-950/50 p-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Completion criteria</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.completion}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }
  ];
  const roadmapSnapshotEntry = changelogEntries.find((entry) => entry.id === 'roadmap_snapshot');
  const productChangelogEntries = changelogEntries.filter((entry) => entry.id !== 'roadmap_snapshot');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0f172a] text-white rounded-2xl p-6 shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <img src="/Dumala_logo.png" alt="" className="w-[160px] h-[160px] object-contain" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src="/Dumala_logo.png" alt="Dumala" className="w-14 h-14 rounded-xl object-contain shrink-0" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-widest">Dev Notes</span>
                <span className="text-slate-400 text-xs font-mono">Updates &amp; Development Log</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">Dumala — Developer Updates &amp; Product Roadmap</h2>
              <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
                Stay informed about the purpose behind this app, current development status, and the vision for future features including the Football Player Rating &amp; Development System.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Purpose of the App */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Target size={18} className="text-indigo-600" />
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Purpose of the App</h3>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          <strong>Dumala</strong> was built to solve a real problem: football coaches and club managers at the grassroots, amateur, and academy levels spend far too much time juggling disconnected tools. Team data lives in spreadsheets, chat threads, notebooks, and memory — scattered, fragile, and hard to act on.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          This app consolidates the core operating loop of running a football team into one workspace. Roster management, match scheduling, result logging, training planning, tactical notes, discipline tracking, and MVP awards — all in a single interface designed specifically for the coach who wants to spend less time administering and more time coaching.
        </p>
        <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
          <li>Replace fragmented spreadsheets and chat threads with a unified team dashboard</li>
          <li>Automate standings updates and player stat tracking from match results</li>
          <li>Plan training weeks with an 85-drill library and preset templates</li>
          <li>Track player availability, opponent intel, and tactical notes before fixtures</li>
          <li>Build a foundation for objective, data-driven player assessment and development</li>
        </ul>
      </div>

      {/* Beta Phase & Feedback */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-amber-200">
          <FlaskConical size={18} className="text-amber-600" />
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Beta Phase — Your Feedback Matters</h3>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          This application is currently in <strong>active beta testing</strong>. It is functional and ready for real-world use, but it is not yet the finished product. Every feature you see today exists because of early feedback from coaches and club operators like you.
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">
          Your feedback directly shapes what gets built next. If something feels clunky, if a workflow is missing, if you have an idea that would make your week easier — I want to hear about it. Use the feedback button in the top-right corner or reach out directly.
        </p>
        <div className="bg-white/60 border border-amber-300 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Megaphone size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>How to help:</strong> Use the app to manage your team for a full week. Try adding players, scheduling a match, logging a result, planning training, and checking the squad summary. Then share what worked, what didn't, and what you wish existed next.
            </p>
          </div>
        </div>
        {roadmapSnapshotEntry ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-sm shadow-black/20 md:p-5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsRoadmapOpen((current) => !current)}
              className="h-auto w-full items-start justify-between gap-4 p-0 text-left whitespace-normal hover:bg-transparent"
              aria-expanded={isRoadmapOpen}
              aria-label={`${isRoadmapOpen ? 'Minimize' : 'Expand'} Roadmap Snapshot`}
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
                {isRoadmapOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </div>
            </Button>
            {isRoadmapOpen ? (
              <div className="mt-4 border-t border-slate-800 pt-4">
                {roadmapSnapshotEntry.renderContent()}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Product Changelog */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <TrendingUp size={18} className="text-emerald-600" />
          <div>
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Product Changelog</h3>
            <p className="text-xs text-slate-500 mt-1">Dated development updates and roadmap history</p>
          </div>
        </div>

        <div className="space-y-4">
          {productChangelogEntries.map((entry) => {
            const isOpen = openEntries[entry.id];
            const isDarkEntry = entry.id === 'fprds_vision_announced';

            return (
              <div
                key={entry.id}
                className={`rounded-2xl border p-4 md:p-5 shadow-sm ${entry.accent}`}
              >
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
                      {'badge' in entry && entry.badge ? (
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${getChangelogBadgeClass(entry.badge)}`}>
                          <Award size={12} aria-hidden="true" />
                          {entry.badge}
                        </span>
                      ) : null}
                    </div>
                    <div>
                      <h4 className={`text-base font-black leading-tight ${isDarkEntry ? 'text-white' : 'text-slate-900'}`}>
                        {entry.title}
                      </h4>
                      <p className={`text-sm mt-1 leading-relaxed ${isDarkEntry ? 'text-slate-300' : 'text-slate-600'}`}>
                        {entry.summary}
                      </p>
                    </div>
                  </div>
                  <div className={`shrink-0 mt-0.5 ${isDarkEntry ? 'text-slate-300' : 'text-slate-500'}`}>
                    {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                </Button>

                {isOpen && (
                  <div className="mt-5 pt-5 border-t border-current/10">
                    {entry.renderContent()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center pb-4">
        <p className="text-[10px] text-slate-400">
          Dumala — Beta Version · Built for coaches, shaped by feedback · Thank you for testing
        </p>
      </div>
    </div>
  );
}
