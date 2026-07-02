import React from 'react';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  FileText,
  Flag,
  Lock,
  Sparkles,
  Trophy,
  Users
} from 'lucide-react';
import { Button } from './ui/button';
import * as PricingCard from './ui/pricing-card';

const premiumUseCases = [
  {
    label: 'Coach',
    title: 'Run one team with less weekly admin',
    detail: 'Plan the week, prepare tactics, assess players, and keep the squad organized from one workspace.'
  },
  {
    label: 'Club',
    title: 'Coordinate staff without losing control',
    detail: 'Use reports, shared operating rhythm, and cleaner communication as club workflows mature.'
  },
  {
    label: 'Academy',
    title: 'Turn assessments into development proof',
    detail: 'Build player records that help coaches, parents, and leaders understand progress over time.'
  }
];

const freeFeatures = [
  'One local team workspace',
  'Roster, schedule, tactics, and training basics',
  'Full workspace backup and restore',
  'Good for trying Dumala during real match weeks'
];

const premiumFeatures = [
  'Advanced assessment and development reporting',
  'Guided planning for training and match preparation',
  'Cloud sync and staff workflows when production-approved',
  'Premium support for serious coach, club, and academy use'
];

const freeLockedFeatures = [
  'Downloadable assessment reports',
  'Guided match-week planning',
  'Cloud sync when production-approved'
];

const matchweekCycle = [
  {
    step: '01',
    clock: 'Mon–Wed',
    icon: CalendarDays,
    title: 'Plan the week',
    text: 'Fixtures, training, availability, and coach notes stay connected instead of scattered.'
  },
  {
    step: '02',
    clock: 'Thu–Fri',
    icon: Flag,
    title: 'Prepare the match',
    text: 'Lineups, formations, tactics, opponent context, and roles live in one match-day surface.'
  },
  {
    step: '03',
    clock: 'Matchday',
    icon: BarChart3,
    title: 'Track development',
    text: 'FPRDS assessments create comparable player records instead of vague progress notes.'
  },
  {
    step: '04',
    clock: 'Sunday',
    icon: FileText,
    title: 'Show the value',
    text: 'Reports and development records make coaching work easier to explain to players and parents.'
  }
];

const navItems = [
  { id: 'value', label: 'How it works' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'premium-fit', label: 'Who it fits' }
];

const panelClass = 'rounded-2xl border border-white/[0.06] bg-white/[0.02]';
const eyebrowClass = 'text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-300';

function SectionHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className={eyebrowClass}>{eyebrow}</p>
      <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-base leading-7 text-slate-400">{description}</p> : null}
    </div>
  );
}

function TacticsBoard() {
  const nodes = [
    { y: 86, label: 'Plan' },
    { y: 186, label: 'Prepare' },
    { y: 286, label: 'Track' },
    { y: 386, label: 'Show' }
  ];

  return (
    <div className="flex h-full flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Match week board</p>
          <p className="mt-1 text-xs text-slate-500">The weekly coaching rhythm, mapped like a board.</p>
        </div>
        <span className="rounded-full border border-orange-300/25 bg-orange-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-orange-200">
          Beta
        </span>
      </div>
      <svg
        viewBox="0 0 320 470"
        role="img"
        aria-labelledby="tactics-board-title"
        className="mx-auto h-auto w-full max-w-xs"
      >
        <title id="tactics-board-title">
          A vertical tactics board showing the weekly coaching cycle: plan, prepare, track, show.
        </title>
        <rect x="20" y="16" width="280" height="438" rx="10" fill="#060d1c" stroke="#94a3b8" strokeOpacity="0.16" strokeWidth="1.5" />
        <line x1="20" y1="235" x2="300" y2="235" stroke="#94a3b8" strokeOpacity="0.14" strokeWidth="1.5" />
        <circle cx="160" cy="235" r="46" fill="none" stroke="#94a3b8" strokeOpacity="0.14" strokeWidth="1.5" />
        <circle cx="160" cy="235" r="2" fill="#94a3b8" fillOpacity="0.35" />
        <rect x="90" y="16" width="140" height="70" fill="none" stroke="#94a3b8" strokeOpacity="0.13" strokeWidth="1.5" />
        <rect x="90" y="384" width="140" height="70" fill="none" stroke="#94a3b8" strokeOpacity="0.13" strokeWidth="1.5" />
        <path
          d="M 160 86 L 160 386"
          stroke="#fb923c"
          strokeWidth="1.5"
          strokeDasharray="2 8"
          strokeLinecap="round"
          strokeOpacity="0.7"
          fill="none"
        />

        {nodes.map((node, index) => (
          <g key={node.label}>
            <circle cx="160" cy={node.y} r="15" fill="#060d1c" stroke="#fb923c" strokeOpacity="0.8" strokeWidth="1.5" />
            <text
              x="160"
              y={node.y + 4}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill="#fdba74"
              fontFamily="inherit"
            >
              {index + 1}
            </text>
            <text
              x={192}
              y={node.y + 4}
              fontSize="13"
              fontWeight="600"
              fill="#e2e8f0"
              fillOpacity="0.85"
              fontFamily="inherit"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function HeroDashboardPreview() {
  return (
    <div className="relative mx-auto mt-16 w-full max-w-6xl">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[-10%] -z-10 h-[26rem] w-[85%] -translate-x-1/2 rounded-full bg-orange-500/[0.08] blur-3xl"
      />
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#050b18]/90 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
          <span className="size-2.5 rounded-full bg-white/10" aria-hidden="true" />
          <span className="size-2.5 rounded-full bg-white/10" aria-hidden="true" />
          <span className="size-2.5 rounded-full bg-white/10" aria-hidden="true" />
          <span className="ml-3 text-xs font-medium text-slate-500">Dumala — Match week</span>
        </div>

        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.42fr)]">
          <div>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Command center</p>
                <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-white">Portuseros FC match week</h2>
              </div>
              <div className="flex gap-2 text-[10px] font-semibold uppercase tracking-wide">
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-emerald-200">Ready</span>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-slate-300">U15</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['Next match', 'Sat 4:00 PM', 'Lineup pending'],
                ['Available', '14 / 18', '3 need reply'],
                ['Focus', 'Defensive transition', '2 drills planned']
              ].map(([label, value, meta]) => (
                <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
                  <p className="mt-2 font-display text-lg font-bold tracking-tight text-white">{value}</p>
                  <p className="mt-1 text-xs text-slate-500">{meta}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,0.38fr)]">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Weekly flow</p>
                  <span className="text-[10px] font-semibold text-orange-300">4 steps</span>
                </div>
                <div className="space-y-2.5">
                  {matchweekCycle.map(({ step, title, clock }) => (
                    <div key={step} className="grid grid-cols-[2.25rem_minmax(0,1fr)_4.5rem] items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                      <span className="text-xs font-semibold text-orange-300">{step}</span>
                      <span className="truncate text-sm font-medium text-slate-200">{title}</span>
                      <span className="text-right text-[10px] font-medium uppercase tracking-wide text-slate-500">{clock}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">FPRDS snapshot</p>
                <div className="mt-4 space-y-3">
                  {[
                    ['OVR confidence', 'Fresh'],
                    ['Top gain', '+6 stamina'],
                    ['Next review', 'Sunday']
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-500">{label}</span>
                      <span className="text-xs font-semibold text-slate-200">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 h-24 rounded-lg border border-white/[0.05] bg-[linear-gradient(180deg,rgba(251,146,60,0.14),rgba(251,146,60,0.02))]" />
              </div>
            </div>
          </div>

          <TacticsBoard />
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#030814] text-slate-100 antialiased selection:bg-orange-400/30">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#030814]" />
        <div className="absolute left-1/2 top-[-22rem] h-[44rem] w-[72rem] -translate-x-1/2 rounded-full bg-orange-500/[0.07] blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
      </div>

      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.06] bg-[#030814]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#landing" className="flex items-center gap-2.5" aria-label="Dumala landing page">
            <img src="/Dumala_logo.png" alt="" className="h-9 w-9 object-contain" />
            <span className="font-display text-lg font-bold tracking-tight text-white">Dumala</span>
          </a>
          <nav aria-label="Landing page navigation" className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-400 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none"
              >
                {item.label}
              </button>
            ))}
          </nav>
          <Button asChild size="sm" className="bg-orange-400 font-semibold text-slate-950 shadow-sm shadow-orange-950/25 hover:bg-orange-300">
            <a href="#/">Open app</a>
          </Button>
        </div>
      </header>

      <main className="relative z-10">
        <section
          className="relative px-4 pb-16 pt-32 sm:px-6 md:pt-40 lg:px-8"
          style={{ animation: 'view-enter 240ms ease-out' }}
        >
          <div className="mx-auto max-w-4xl text-center">
            <button
              type="button"
              onClick={() => scrollToSection('pricing')}
              className="group inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-xs text-slate-400 transition-colors hover:border-orange-300/25 hover:text-slate-200"
            >
              <span className="hidden size-1.5 rounded-full bg-orange-400 sm:inline-block" aria-hidden="true" />
              Private beta is being shaped with real coaches
              <span className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-orange-300 transition-colors group-hover:text-orange-200">
                See the offer
                <ArrowRight size={12} aria-hidden="true" />
              </span>
            </button>

            <h1 className="mx-auto mt-8 max-w-3xl bg-gradient-to-b from-white via-white to-white/55 bg-clip-text font-display text-4xl font-bold leading-[1.06] tracking-tight text-transparent sm:text-6xl lg:text-[4.25rem]">
              Run your football team like a professional academy.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
              Dumala helps coaches plan the week, prepare match day, manage the squad, and build player-development records — without living inside chats and spreadsheets.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-orange-400 px-6 font-semibold text-slate-950 shadow-[0_12px_32px_rgba(249,115,22,0.28)] transition-transform hover:bg-orange-300 active:scale-[0.98]">
                <a href="#/">Start free <ArrowRight size={16} aria-hidden="true" /></a>
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() => scrollToSection('pricing')}
                className="border-white/10 bg-white/[0.03] px-6 text-slate-200 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
              >
                Compare Free and Premium
              </Button>
            </div>
            <p className="mt-6 text-xs text-slate-500">Free plan available · No credit card required</p>
          </div>

          <HeroDashboardPreview />
        </section>

        <section id="value" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Why coaches subscribe"
              title="Less admin, sharper preparation, proof of development."
              description="One weekly rhythm from Monday planning to Sunday reporting — every step connected to the next."
            />
            <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {matchweekCycle.map(({ step, clock, icon: Icon, title, text }) => (
                <article
                  key={title}
                  className={`${panelClass} group relative overflow-hidden p-6 transition-colors duration-200 hover:border-orange-300/25 hover:bg-white/[0.04]`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-orange-300 transition-colors group-hover:border-orange-300/25">
                      <Icon size={19} aria-hidden="true" />
                    </span>
                    <div className="text-right">
                      <span className="block font-display text-sm font-bold text-slate-600">{step}</span>
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{clock}</span>
                    </div>
                  </div>
                  <h3 className="mt-6 font-display text-lg font-bold tracking-tight text-white">{title}</h3>
                  <p className="mt-2.5 text-sm leading-6 text-slate-400">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Simple pricing"
              title="Start free. Upgrade when Dumala becomes part of your weekly rhythm."
              description="Free is for trying the workflow. Premium is for serious coaches and organizations that need stronger reports, planning, and growth tools."
            />

            <div className="mx-auto mt-14 grid max-w-4xl gap-5 md:grid-cols-2">
              <PricingCard.Card className="border-white/[0.07] bg-[#050b18]/90">
                <PricingCard.Header className="border-white/[0.06]">
                  <PricingCard.Plan>
                    <PricingCard.PlanName>
                      <Users aria-hidden="true" className="text-slate-400" />
                      <span>Free</span>
                    </PricingCard.PlanName>
                    <PricingCard.Badge className="border-white/[0.08] bg-white/[0.03] text-slate-400">Beta</PricingCard.Badge>
                  </PricingCard.Plan>
                  <PricingCard.Price>
                    <PricingCard.MainPrice>$0</PricingCard.MainPrice>
                    <PricingCard.Period>/ month</PricingCard.Period>
                  </PricingCard.Price>
                  <PricingCard.Description>For coaches getting Dumala into a real match week.</PricingCard.Description>
                  <Button asChild className="mt-4 w-full border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07] hover:text-white" variant="outline">
                    <a href="#/">Start free</a>
                  </Button>
                </PricingCard.Header>
                <PricingCard.Body>
                  <PricingCard.List>
                    {freeFeatures.map((feature) => (
                      <PricingCard.ListItem key={feature}>
                        <Check className="mt-1 size-4 shrink-0 text-emerald-400" aria-hidden="true" />
                        <span>{feature}</span>
                      </PricingCard.ListItem>
                    ))}
                  </PricingCard.List>
                  <PricingCard.Separator>Premium unlocks</PricingCard.Separator>
                  <PricingCard.List>
                    {freeLockedFeatures.map((feature) => (
                      <PricingCard.ListItem key={feature} className="text-slate-500">
                        <Lock className="mt-1 size-4 shrink-0 text-slate-600" aria-hidden="true" />
                        <span>{feature}</span>
                      </PricingCard.ListItem>
                    ))}
                  </PricingCard.List>
                </PricingCard.Body>
              </PricingCard.Card>

              <PricingCard.Card className="border-orange-300/30 bg-[#050b18]/90 shadow-orange-950/20 ring-1 ring-orange-300/20">
                <PricingCard.Header className="border-orange-300/15 bg-orange-300/[0.07]">
                  <PricingCard.Plan>
                    <PricingCard.PlanName className="text-orange-100">
                      <Trophy aria-hidden="true" className="text-orange-300" />
                      <span>Premium</span>
                    </PricingCard.PlanName>
                    <PricingCard.Badge>Recommended</PricingCard.Badge>
                  </PricingCard.Plan>
                  <PricingCard.Price>
                    <PricingCard.MainPrice>$9–15</PricingCard.MainPrice>
                    <PricingCard.Period>/ month</PricingCard.Period>
                    <PricingCard.OriginalPrice>$20+</PricingCard.OriginalPrice>
                  </PricingCard.Price>
                  <PricingCard.Description>For serious coaches, clubs, and academies that use Dumala every week.</PricingCard.Description>
                  <Button asChild className="mt-4 w-full bg-orange-400 font-semibold text-slate-950 shadow-sm shadow-orange-950/25 hover:bg-orange-300">
                    <a href="#/">Join the beta list</a>
                  </Button>
                </PricingCard.Header>
                <PricingCard.Body>
                  <PricingCard.List>
                    {premiumFeatures.map((feature) => (
                      <PricingCard.ListItem key={feature}>
                        <CheckCircle2 className="mt-1 size-4 shrink-0 text-orange-300" aria-hidden="true" />
                        <span>{feature}</span>
                      </PricingCard.ListItem>
                    ))}
                  </PricingCard.List>
                  <PricingCard.Separator>Best fit</PricingCard.Separator>
                  <PricingCard.List>
                    {['Serious coach workflow', 'Club-ready reports', 'Academy development records'].map((feature) => (
                      <PricingCard.ListItem key={feature}>
                        <Check className="mt-1 size-4 shrink-0 text-slate-400" aria-hidden="true" />
                        <span>{feature}</span>
                      </PricingCard.ListItem>
                    ))}
                  </PricingCard.List>
                </PricingCard.Body>
              </PricingCard.Card>
            </div>
          </div>
        </section>

        <section id="premium-fit" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Who it fits"
              title="One Premium plan, three football realities."
              description="Coach, Club, and Academy are not separate public plans yet — they describe who gets value from the Premium subscription."
            />
            <div className="mt-14 grid gap-4 lg:grid-cols-3">
              {premiumUseCases.map((useCase) => (
                <article
                  key={useCase.label}
                  className={`${panelClass} p-7 transition-colors duration-200 hover:border-orange-300/25 hover:bg-white/[0.04]`}
                >
                  <span className="inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-300/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-200">
                    <span className="size-1.5 rounded-full bg-orange-400" aria-hidden="true" />
                    {useCase.label}
                  </span>
                  <h3 className="mt-6 font-display text-xl font-bold tracking-tight text-white">{useCase.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{useCase.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-24 pt-4 sm:px-6 lg:px-8">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/[0.08] bg-[#050b18]/90 px-6 py-14 text-center sm:px-12">
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-0 h-64 w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/[0.12] blur-3xl"
            />
            <div className="relative">
              <p className={`${eyebrowClass} inline-flex items-center gap-2`}>
                <Sparkles size={14} aria-hidden="true" />
                Private beta offer
              </p>
              <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Free beta for one team. Upgrade later when Premium proves its value.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-400">
                The next product goal is to validate whether coaches feel the weekly time savings clearly enough to subscribe.
              </p>
              <div className="mt-8 flex justify-center">
                <Button asChild size="lg" className="bg-orange-400 px-6 font-semibold text-slate-950 shadow-[0_12px_32px_rgba(249,115,22,0.28)] hover:bg-orange-300">
                  <a href="#/">Open Dumala <ClipboardList size={16} aria-hidden="true" /></a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <a href="#landing" className="flex items-center gap-2.5" aria-label="Dumala landing page">
            <img src="/Dumala_logo.png" alt="" className="h-8 w-8 object-contain" />
            <span className="font-display text-base font-bold tracking-tight text-white">Dumala</span>
          </a>
          <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="text-sm text-slate-500 transition-colors hover:text-slate-200"
              >
                {item.label}
              </button>
            ))}
            <a href="#/" className="text-sm text-slate-500 transition-colors hover:text-slate-200">Open app</a>
          </nav>
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} Dumala. Built for coaches.</p>
        </div>
      </footer>
    </div>
  );
}
