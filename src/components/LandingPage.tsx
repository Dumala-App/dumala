import React, { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeftRight, BarChart3, Banknote, BrainCircuit, CalendarDays, CheckCircle2, CloudSun, Dumbbell, FileText, Loader2, Presentation, Send, ShieldCheck, Trophy, Users } from 'lucide-react';
import AetherFlowHero, { AetherFlowBackdrop } from './ui/aether-flow-hero';
import { GlowingEffect } from './ui/glowing-effect';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from './ui/dialog';
import { useCloudRuntime } from '../hooks/useCloudRuntime';
import {
  createPremiumLeadRecord,
  hasPremiumLeadErrors,
  initialPremiumLeadForm,
  storePremiumLead,
  submitPremiumLead,
  validatePremiumLeadForm,
  type PremiumLeadErrors,
  type PremiumLeadField,
  type PremiumLeadForm
} from '../landing/premiumLeadCapture';

const steps = [
  {
    n: '01',
    when: 'Training',
    title: 'Plan training in minutes',
    text: 'Pick drills from the built-in library and drop them onto your weekly schedule. Warm-ups, conditioning, tactical work — sorted in a few clicks, not a few hours.',
    detail: 'Drill library · Weekly planner'
  },
  {
    n: '02',
    when: 'Match prep',
    title: 'Build your tactics like a pro',
    text: 'Tell it how you want to play, and the smart strategy engine suggests your formation, player roles and set pieces — like having a tactics assistant beside you on the touchline.',
    detail: 'Tactics board · Smart strategy engine'
  },
  {
    n: '03',
    when: 'Matchday',
    title: 'Rate players the easy way',
    text: 'Give every player a simple rating right after the match — effort, performance, attitude — while it is still fresh in your mind. No spreadsheets, no jargon.',
    detail: 'Simple player ratings · Match notes'
  },
  {
    n: '04',
    when: 'After the match',
    title: 'Share real progress',
    text: 'Turn the week into a clear, easy-to-read update for players and parents — actual progress they can see, not just "he\'s improving."',
    detail: 'Progress reports · Season trends'
  }
];

const features = [
  {
    Icon: CalendarDays,
    title: 'Match-week calendar',
    text: 'Fixtures, sessions, availability and preparation tasks stay tied to the week instead of scattered across chats.'
  },
  {
    Icon: BrainCircuit,
    title: 'Playstyle strategy engine',
    text: 'Choose how you want to play and the engine turns it into formation, roles and tactical guidance for the week.'
  },
  {
    Icon: Presentation,
    title: 'Interactive match board',
    text: 'A fullscreen tactics board for lineups, formations, set plays and opponent shape — made for the touchline.'
  },
  {
    Icon: BarChart3,
    title: 'FPRDS assessments',
    text: 'Structured player ratings and feedback reports you can compare match after match, season after season.'
  },
  {
    Icon: FileText,
    title: 'Player development reports',
    text: 'Turn assessment history into clear progress summaries for players, parents and staff conversations.'
  },
  {
    Icon: Dumbbell,
    title: 'Training & drill library',
    text: 'Plan sessions from a coaching library of drills, diagrams and formations matched to your week’s focus.'
  },
  {
    Icon: Users,
    title: 'Squad & match-day prep',
    text: 'Roster, availability, fixtures and match-day preparation in one place.'
  },
  {
    Icon: CloudSun,
    title: 'Weather advisory',
    text: 'Check conditions before training or kickoff so coaches can adjust drills, kit reminders and match-day plans early.'
  },
  {
    Icon: ShieldCheck,
    title: 'Offline workspace backups',
    text: 'Installable app that keeps working offline, with full workspace backup, restore and multiple team support.'
  }
];

const moreFeatures = [
  { Icon: Banknote, label: 'Squad payments & dues tracking' },
  { Icon: Trophy, label: 'League standings & club announcements' },
  { Icon: ArrowLeftRight, label: 'Side-by-side player comparison' }
];

const wins = [
  {
    title: 'One coaching workspace',
    benefit: 'Your whole week in one place, not five apps.',
    after: 'Installable app that keeps working offline, with full backup and restore.',
    note: 'Roster, fixtures, training sessions and your drill library stay tied to the week instead of scattered across notes and chats.'
  },
  {
    title: 'Match prep',
    benefit: 'Walk onto the pitch with the plan already built.',
    after: 'Lineups, set plays and opponent shape ready on a fullscreen touchline board.',
    note: 'Pick how you want to play and the strategy engine builds the formation, roles and tactics for you — saved and reusable every match week.'
  },
  {
    title: 'Player development',
    benefit: 'Show real progress, not just a gut feeling.',
    after: 'FPRDS ratings you can compare match after match, season after season.',
    note: 'Score players with structured assessments and turn the history into clear reports for players, parents and staff.'
  }
];

const styles = `
.dc-root{--dc-bg:#04091A;--dc-ink:#F5F7FB;--dc-muted:#8A96AD;--dc-dim:#5C6880;--dc-accent:#FF8A3D;--dc-accent-2:#FFB37E}
.dc-root *{box-sizing:border-box}

.dc-nav-link{background:none;border:none;cursor:pointer;padding:8px 14px;border-radius:10px;font-family:inherit;font-size:14px;font-weight:500;color:var(--dc-muted);transition:color .15s}
.dc-nav-link:hover{color:var(--dc-ink)}
.dc-openapp{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(180deg,#FF9A52,#FF8A3D);color:#180A00;text-decoration:none;font-weight:700;font-size:14px;padding:9px 18px;border-radius:12px;box-shadow:inset 0 1px 0 rgba(255,255,255,.32),0 1px 2px rgba(0,0,0,.35),0 6px 14px -7px rgba(255,138,61,.5);transition:background .15s,box-shadow .15s}
.dc-openapp:hover{background:linear-gradient(180deg,#FFB06E,#FFA35F)}
.dc-cta-primary{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(180deg,#FF9A52,#FF8A3D);color:#180A00;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:14px;box-shadow:inset 0 1px 0 rgba(255,255,255,.34),0 1px 2px rgba(0,0,0,.4),0 8px 20px -9px rgba(255,138,61,.55);transition:background .15s,transform .15s,box-shadow .15s;border:none;cursor:pointer;font-family:inherit}
.dc-cta-primary:hover{background:linear-gradient(180deg,#FFB06E,#FFA35F);transform:translateY(-1px);box-shadow:inset 0 1px 0 rgba(255,255,255,.34),0 2px 4px rgba(0,0,0,.4),0 12px 26px -10px rgba(255,138,61,.6)}
.dc-cta-secondary{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.14);color:#DDE4EF;cursor:pointer;font-family:inherit;font-weight:600;font-size:15px;padding:14px 28px;border-radius:14px;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 1px 2px rgba(0,0,0,.3);transition:border-color .15s,background .15s}
.dc-cta-secondary:hover{border-color:rgba(255,255,255,.26);background:rgba(255,255,255,.07)}
.dc-card{border:1px solid rgba(255,255,255,.14);background:rgba(8,16,38,.66);border-radius:18px;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 1px 2px rgba(0,0,0,.3),0 14px 30px -20px rgba(0,0,0,.65);transition:border-color .2s,background .2s,box-shadow .2s}
.dc-card:hover{border-color:rgba(255,138,61,.34);background:rgba(8,16,38,.76);box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 1px 2px rgba(0,0,0,.35),0 18px 36px -20px rgba(0,0,0,.7)}
.dc-feature-shell{position:relative;min-height:210px;list-style:none;border:1px solid rgba(255,255,255,.10);border-radius:22px;padding:8px;background:rgba(255,255,255,.025);box-shadow:0 16px 34px -26px rgba(0,0,0,.75)}
.dc-feature-card{position:relative;z-index:1;height:100%;overflow:hidden;border:1px solid rgba(255,255,255,.12);background:rgba(8,16,38,.70);border-radius:16px;padding:24px;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:inset 0 1px 0 rgba(255,255,255,.08)}
.dc-feature-icon{display:inline-flex;width:40px;height:40px;align-items:center;justify-content:center;border-radius:12px;border:1px solid rgba(255,138,61,.25);background:rgba(255,138,61,.10);color:#FFB37E}
.dc-glow-shell{position:relative;list-style:none;border:1px solid rgba(255,255,255,.10);border-radius:22px;padding:8px;background:rgba(255,255,255,.025);box-shadow:0 16px 34px -26px rgba(0,0,0,.75)}
.dc-glow-card{position:relative;z-index:1;height:100%;overflow:hidden;border:1px solid rgba(255,255,255,.12);background:rgba(8,16,38,.70);border-radius:16px;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:inset 0 1px 0 rgba(255,255,255,.08)}
.dc-startfree{display:block;width:100%;text-align:center;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:#DDE4EF;text-decoration:none;font-weight:600;font-size:13.5px;padding:11px;border-radius:12px;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 1px 2px rgba(0,0,0,.3);transition:background .15s,border-color .15s}
.dc-startfree:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.24)}
.dc-joinbeta{display:block;width:100%;text-align:center;background:linear-gradient(180deg,#FF9A52,#FF8A3D);color:#180A00;text-decoration:none;font-weight:700;font-size:13.5px;padding:11px;border-radius:12px;box-shadow:inset 0 1px 0 rgba(255,255,255,.30),0 1px 2px rgba(0,0,0,.35),0 6px 16px -8px rgba(255,138,61,.5);transition:background .15s;border:none;cursor:pointer;font-family:inherit}
.dc-joinbeta:hover{background:linear-gradient(180deg,#FFB06E,#FFA35F)}
.dc-foot-link{background:none;border:none;cursor:pointer;padding:0;font-family:inherit;font-size:13.5px;color:var(--dc-dim);transition:color .15s;text-decoration:none}
.dc-foot-link:hover{color:#DDE4EF}
.dc-header-nav{display:flex;align-items:center;gap:4px}
.dc-lead-field{display:grid;gap:6px;font-size:12px;font-weight:800;color:#DDE4EF}
.dc-lead-field span{font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#8A96AD}
.dc-lead-field input,.dc-lead-field select,.dc-lead-field textarea{width:100%;border:1px solid rgba(255,255,255,.13);background:rgba(4,9,26,.72);color:#F5F7FB;border-radius:12px;padding:11px 12px;font:inherit;font-size:13px;font-weight:600;outline:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}
.dc-lead-field textarea{min-height:92px;resize:vertical;line-height:1.5}
.dc-lead-field input:focus,.dc-lead-field select:focus,.dc-lead-field textarea:focus{border-color:rgba(255,138,61,.72);box-shadow:0 0 0 3px rgba(255,138,61,.18)}
.dc-lead-error{font-size:11px;font-weight:700;color:#FDBA74}
.dc-lead-status{border-radius:14px;border:1px solid rgba(255,255,255,.12);padding:12px 14px;font-size:12px;font-weight:800;line-height:1.5}
.dc-lead-submit{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:pointer;border-radius:12px;background:linear-gradient(180deg,#FF9A52,#FF8A3D);color:#180A00;padding:12px 16px;font-family:inherit;font-size:13px;font-weight:800;box-shadow:inset 0 1px 0 rgba(255,255,255,.30),0 8px 18px -12px rgba(255,138,61,.7)}
.dc-lead-submit:disabled{cursor:not-allowed;opacity:.68}
.dc-lead-ghost{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:#DDE4EF;cursor:pointer;border-radius:12px;padding:12px 16px;font-family:inherit;font-size:13px;font-weight:800}

@media (max-width:700px){
  .dc-header-nav{display:none}
}
@media (max-width:640px){
  .dc-ticket{grid-template-columns:1fr !important}
  .dc-ticket-stub{border-left:none !important;border-top:2px dashed rgba(255,255,255,.12) !important}
  .dc-ticket-stub-premium{border-left:none !important;border-top:2px dashed rgba(255,138,61,.32) !important}
}
@media (prefers-reduced-motion: reduce){
  .dc-root *{animation-duration:.001ms !important;animation-iteration-count:1 !important}
}
`;

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const runtime = useCloudRuntime();
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [premiumLead, setPremiumLead] = useState<PremiumLeadForm>(initialPremiumLeadForm);
  const [premiumLeadErrors, setPremiumLeadErrors] = useState<PremiumLeadErrors>({});
  const [premiumLeadStatus, setPremiumLeadStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [premiumLeadMessage, setPremiumLeadMessage] = useState('');

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 84;
    window.scrollTo({ top, behavior: 'smooth' });
  };
  const goTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const scrollToPricingPlans = () => scrollToId('pricing-plans');
  const openPremiumLeadModal = () => {
    setPremiumLeadErrors({});
    setPremiumLeadStatus('idle');
    setPremiumLeadMessage('');
    setPremiumModalOpen(true);
  };
  const updatePremiumLead = (field: PremiumLeadField, value: string) => {
    setPremiumLead(current => ({ ...current, [field]: value }));
    setPremiumLeadErrors(current => ({ ...current, [field]: undefined }));
  };
  const handlePremiumLeadSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validatePremiumLeadForm(premiumLead);
    setPremiumLeadErrors(errors);
    if (hasPremiumLeadErrors(errors)) return;

    const lead = createPremiumLeadRecord(premiumLead);
    storePremiumLead(lead);
    setPremiumLeadStatus('submitting');
    setPremiumLeadMessage('');

    try {
      const deliveredLead = await submitPremiumLead(lead, runtime);
      storePremiumLead(deliveredLead);
      setPremiumLeadStatus('success');
      setPremiumLeadMessage('You are on the Premium beta list. We will follow up before Premium access opens.');
      setPremiumLead(initialPremiumLeadForm);
    } catch {
      setPremiumLeadStatus('error');
      setPremiumLeadMessage('We saved your details in this browser, but could not send them yet. Please try again when your connection is back.');
    }
  };

  // Scroll-reveal for below-the-fold blocks
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !('IntersectionObserver' in window)) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const t = entry.target as HTMLElement;
            t.style.opacity = '1';
            t.style.transform = 'translateY(0)';
            obs.unobserve(t);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => {
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(26px)';
        el.style.transition = 'opacity .7s ease-out, transform .7s cubic-bezier(.2,.7,.2,1)';
        obs.observe(el);
      }
    });
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      className="dc-root"
      style={{
        minHeight: '100vh',
        background: '#04091A',
        color: '#F5F7FB',
        fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
        overflowX: 'hidden',
        position: 'relative'
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      {/* ambient background */}
      <AetherFlowBackdrop className="fixed inset-0 z-0" />

      {/* header */}
      <header style={{ position: 'fixed', left: 0, right: 0, top: 0, zIndex: 40, borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(4,9,26,.78)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, padding: '0 24px' }}>
          <nav className="dc-header-nav" style={{ marginRight: 'auto' }}>
            <button type="button" onClick={() => scrollToId('value')} className="dc-nav-link">How it works</button>
            <button type="button" onClick={() => scrollToId('features')} className="dc-nav-link">Features</button>
            <button type="button" onClick={scrollToPricingPlans} className="dc-nav-link">Pricing</button>
            <button type="button" onClick={() => scrollToId('fit')} className="dc-nav-link">Why Dumala</button>
          </nav>
          <a href="#/app" className="dc-openapp">Open app</a>
        </div>
      </header>

      <main id="top" style={{ position: 'relative', zIndex: 1 }}>
        {/* HERO — Aether Flow particle network in the brand palette */}
        <section style={{ position: 'relative' }}>
          <AetherFlowHero
            className="h-[90vh]"
            badge="The team management app for football coaches"
            title={
              <>
                <span style={{ background: 'linear-gradient(180deg,#fff,rgba(255,255,255,.62))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>The operating system</span>
                <br />
                <span style={{ background: 'linear-gradient(180deg,#FFB37E,#FF8A3D)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>for your football team.</span>
              </>
            }
            description="Roster, schedule, tactics, and player development — all connected, so nothing lives in a separate app anymore."
            actions={
              <>
                <a href="#/app" className="dc-cta-primary">Start free →</a>
                <button type="button" onClick={scrollToPricingPlans} className="dc-cta-secondary">See pricing</button>
              </>
            }
            footnote="Free plan available · No credit card required"
            showParticles={false}
          />
        </section>

        {/* HOW IT WORKS — compact weekly rhythm strip */}
        <section id="value" style={{ padding: '56px 24px 0' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto' }}>
            <div data-reveal="1" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', opacity: 1 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: '#FF9E5E' }}>How it works</p>
              <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, letterSpacing: '-.03em', fontSize: 'clamp(1.9rem,3.4vw,2.6rem)', lineHeight: 1.15, margin: '16px 0 0', color: '#F5F7FB' }}>Like having an assistant coach in your pocket.</h2>
              <p style={{ margin: '16px auto 0', fontSize: 15.5, lineHeight: 1.7, color: '#8A96AD' }}>Dumala plans your training, helps you build your tactics, rates your players in plain language, and shares the progress — so you spend less time on admin and more time coaching.</p>
            </div>

            <div style={{ marginTop: 36, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(230px,100%),1fr))', gap: 12 }}>
              {steps.map(({ n, when, title, text, detail }) => (
                <article key={n} data-reveal="1" className="dc-glow-shell" style={{ opacity: 1 }}>
                  <GlowingEffect spread={34} glow disabled={false} proximity={58} inactiveZone={0.01} borderWidth={2} />
                  <div className="dc-glow-card" style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 15, color: 'rgba(255,138,61,.9)' }}>{n}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#5C6880' }}>{when}</span>
                    </div>
                    <h3 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, letterSpacing: '-.01em', fontSize: 15.5, margin: '10px 0 0', color: '#F5F7FB' }}>{title}</h3>
                    <p style={{ margin: '6px 0 0', fontSize: 12.5, lineHeight: 1.55, color: '#8A96AD' }}>{text}</p>
                    <p style={{ margin: '10px 0 0', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.07)', fontSize: 11, fontWeight: 600, color: '#5C6880' }}>{detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" style={{ padding: '90px 24px 20px' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto' }}>
            <div data-reveal="1" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', opacity: 1 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: '#FF9E5E' }}>Inside the app</p>
              <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, letterSpacing: '-.03em', fontSize: 'clamp(1.9rem,3.4vw,2.6rem)', lineHeight: 1.15, margin: '16px 0 0', color: '#F5F7FB' }}>The tools doing the heavy lifting.</h2>
              <p style={{ margin: '16px auto 0', fontSize: 15.5, lineHeight: 1.7, color: '#8A96AD' }}>Every tool works from the same connected team data — plan the week, prepare match day, and develop players without leaving the app.</p>
            </div>

            <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap: 14 }}>
              {features.map(({ Icon, title, text }) => (
                <article key={title} data-reveal="1" className="dc-feature-shell" style={{ opacity: 1 }}>
                  <GlowingEffect spread={40} glow disabled={false} proximity={72} inactiveZone={0.01} borderWidth={3} />
                  <div className="dc-feature-card">
                    <span className="dc-feature-icon">
                      <Icon size={19} aria-hidden="true" />
                    </span>
                    <h3 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, letterSpacing: '-.01em', fontSize: 16.5, margin: '16px 0 0', color: '#F5F7FB' }}>{title}</h3>
                    <p style={{ margin: '8px 0 0', fontSize: 13.5, lineHeight: 1.65, color: '#8A96AD' }}>{text}</p>
                  </div>
                </article>
              ))}
            </div>

            <div data-reveal="1" style={{ opacity: 1, marginTop: 28, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#5C6880', whiteSpace: 'nowrap' }}>Also in the workspace</span>
              <span style={{ height: 1, flex: 1, minWidth: 24, background: 'rgba(255,255,255,.07)' }} />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {moreFeatures.map(({ Icon, label }) => (
                  <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.03)', borderRadius: 999, padding: '7px 14px 7px 10px', fontSize: 12.5, fontWeight: 600, color: '#B9C2D4' }}>
                    <Icon size={14} style={{ color: '#FFB37E' }} aria-hidden="true" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" style={{ padding: '110px 24px 20px' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto' }}>
            <div data-reveal="1" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', opacity: 1 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: '#FF9E5E' }}>Simple pricing</p>
              <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, letterSpacing: '-.03em', fontSize: 'clamp(1.9rem,3.4vw,2.6rem)', lineHeight: 1.15, margin: '16px 0 0', color: '#F5F7FB' }}>Start free. Upgrade when it becomes your rhythm.</h2>
              <p style={{ margin: '16px auto 0', fontSize: 15.5, lineHeight: 1.7, color: '#8A96AD' }}>Free is for trying the workflow in a real match week. Premium is for coaches and organizations that need stronger reports and planning.</p>
            </div>

            <div id="pricing-plans" style={{ margin: '40px auto 0', maxWidth: 920, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Free — Matchday pass ticket */}
              <div data-reveal="1" className="dc-glow-shell" style={{ opacity: 1, borderRadius: 26 }}>
                <GlowingEffect spread={42} glow disabled={false} proximity={82} inactiveZone={0.01} borderWidth={3} />
                <article className="dc-ticket" style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 264px', border: '1px solid rgba(255,255,255,.14)', background: 'rgba(8,16,38,.68)', borderRadius: 20, overflow: 'hidden', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08),0 1px 2px rgba(0,0,0,.3),0 22px 46px -30px rgba(0,0,0,.75)' }}>
                  <div aria-hidden="true" style={{ position: 'absolute', left: '28%', top: 0, width: '26rem', height: '13rem', transform: 'translate(-50%,-55%)', borderRadius: '50%', background: 'rgba(52,211,153,.14)', filter: 'blur(70px)' }} />
                  <div style={{ position: 'relative', padding: '30px 34px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#5C6880' }}>Matchday pass</span>
                      <span style={{ height: 1, flex: 1, background: 'rgba(255,255,255,.07)', minWidth: 40 }} />
                      <span style={{ border: '1px solid rgba(255,255,255,.09)', background: 'rgba(255,255,255,.03)', borderRadius: 999, padding: '3px 11px', fontSize: 10.5, fontWeight: 600, color: '#8A96AD' }}>Beta</span>
                    </div>
                    <h3 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, letterSpacing: '-.02em', fontSize: 26, margin: '16px 0 0', color: '#F5F7FB' }}>Free</h3>
                    <p style={{ margin: '8px 0 0', fontSize: 13.5, lineHeight: 1.6, color: '#8A96AD' }}>For coaches getting Dumala into a real match week.</p>
                    <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '10px 24px' }}>
                      {['One local team workspace', 'Roster, schedule, tactics, training basics', 'Full workspace backup and restore', 'Real match weeks, zero commitment'].map((f) => (
                        <div key={f} style={{ display: 'flex', gap: 10, fontSize: 13.5, lineHeight: 1.55, color: '#B9C2D4' }}>
                          <span style={{ color: '#34D399', fontWeight: 700 }}>✓</span>
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ margin: '20px 0 0', fontSize: 12, lineHeight: 1.6, color: '#5C6880' }}>
                      <span style={{ fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', fontSize: 10, color: '#5C6880' }}>Premium unlocks · </span>
                      Downloadable reports · Guided match-week planning · Cloud sync
                    </p>
                  </div>
                  <div className="dc-ticket-stub" style={{ position: 'relative', borderLeft: '2px dashed rgba(255,255,255,.12)', padding: '30px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center' }}>
                    <span aria-hidden="true" style={{ position: 'absolute', left: -12, top: -11, width: 22, height: 22, borderRadius: '50%', background: '#04091A', border: '1px solid rgba(255,255,255,.09)' }} />
                    <span aria-hidden="true" style={{ position: 'absolute', left: -12, bottom: -11, width: 22, height: 22, borderRadius: '50%', background: '#04091A', border: '1px solid rgba(255,255,255,.09)' }} />
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.24em', textTransform: 'uppercase', color: '#5C6880' }}>Admit one team</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 4 }}>
                      <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 44, letterSpacing: '-.03em', color: '#F5F7FB' }}>₱0</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#5C6880' }}>forever, while in beta</span>
                    <a href="#/app" className="dc-startfree" style={{ marginTop: 16 }}>Start free</a>
                    <div aria-hidden="true" style={{ marginTop: 16, width: 110, height: 26, background: 'repeating-linear-gradient(90deg,rgba(221,228,239,.35) 0 2px,transparent 2px 5px,rgba(221,228,239,.35) 5px 6px,transparent 6px 10px)', borderRadius: 2, opacity: 0.5 }} />
                  </div>
                </article>
              </div>

              {/* Premium — Season pass ticket */}
              <div data-reveal="1" className="dc-glow-shell" style={{ opacity: 1, borderRadius: 26 }}>
                <GlowingEffect spread={42} glow disabled={false} proximity={82} inactiveZone={0.01} borderWidth={3} />
                <article className="dc-ticket" style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 264px', border: '1px solid rgba(255,138,61,.42)', background: 'linear-gradient(120deg,rgba(255,138,61,.10),rgba(8,16,38,0) 45%),rgba(8,16,38,.70)', borderRadius: 20, overflow: 'hidden', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08),0 1px 2px rgba(0,0,0,.35),0 22px 48px -30px rgba(255,138,61,.4),0 30px 60px -34px rgba(0,0,0,.7)' }}>
                  <div aria-hidden="true" style={{ position: 'absolute', left: '28%', top: 0, width: '26rem', height: '13rem', transform: 'translate(-50%,-55%)', borderRadius: '50%', background: 'rgba(255,138,61,.18)', filter: 'blur(70px)' }} />
                  <span style={{ position: 'absolute', top: 0, left: 34, zIndex: 1, background: '#FF8A3D', color: '#180A00', fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: '0 0 8px 8px' }}>Recommended</span>
                  <div style={{ position: 'relative', padding: '38px 34px 30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#FFB37E' }}>Season pass</span>
                      <span style={{ height: 1, flex: 1, background: 'rgba(255,138,61,.18)', minWidth: 40 }} />
                      <span style={{ border: '1px solid rgba(255,138,61,.3)', background: 'rgba(255,138,61,.1)', borderRadius: 999, padding: '3px 11px', fontSize: 10.5, fontWeight: 700, color: '#FFB37E' }}>Full squad access</span>
                    </div>
                    <h3 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, letterSpacing: '-.02em', fontSize: 26, margin: '16px 0 0', color: '#FFD9BC' }}>Premium</h3>
                    <p style={{ margin: '8px 0 0', fontSize: 13.5, lineHeight: 1.6, color: '#B9C2D4' }}>For serious coaches, clubs, and academies that use Dumala every week.</p>
                    <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '10px 24px' }}>
                      {['Advanced assessment & development reporting', 'Guided training & match preparation', 'Cloud sync and staff workflows', 'Premium support for coach, club & academy'].map((f) => (
                        <div key={f} style={{ display: 'flex', gap: 10, fontSize: 13.5, lineHeight: 1.55, color: '#B9C2D4' }}>
                          <span style={{ color: '#FFB37E', fontWeight: 700 }}>✓</span>
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ margin: '20px 0 0', fontSize: 12, lineHeight: 1.6, color: '#8A96AD' }}>
                      <span style={{ fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', fontSize: 10, color: '#FFB37E' }}>Best fit · </span>
                      Serious coach workflow · Club-ready reports · Academy development records
                    </p>
                  </div>
                  <div className="dc-ticket-stub-premium" style={{ position: 'relative', borderLeft: '2px dashed rgba(255,138,61,.32)', background: 'repeating-linear-gradient(-45deg,rgba(255,138,61,.045) 0 10px,transparent 10px 20px)', padding: '30px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center' }}>
                    <span aria-hidden="true" style={{ position: 'absolute', left: -12, top: -11, width: 22, height: 22, borderRadius: '50%', background: '#04091A', border: '1px solid rgba(255,138,61,.4)' }} />
                    <span aria-hidden="true" style={{ position: 'absolute', left: -12, bottom: -11, width: 22, height: 22, borderRadius: '50%', background: '#04091A', border: '1px solid rgba(255,138,61,.4)' }} />
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.24em', textTransform: 'uppercase', color: '#FFB37E' }}>Whole season</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                      <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 44, letterSpacing: '-.03em', color: '#F5F7FB' }}>₱499</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#8A96AD' }}>per month · <span style={{ textDecoration: 'line-through', color: '#5C6880' }}>₱800</span> early-bird</span>
                    <button type="button" onClick={openPremiumLeadModal} className="dc-joinbeta" style={{ marginTop: 16 }}>Join the beta list</button>
                    <div aria-hidden="true" style={{ marginTop: 16, width: 110, height: 26, background: 'repeating-linear-gradient(90deg,rgba(255,179,126,.5) 0 2px,transparent 2px 5px,rgba(255,179,126,.5) 5px 6px,transparent 6px 10px)', borderRadius: 2, opacity: 0.6 }} />
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        {/* WHY DUMALA */}
        <section id="fit" style={{ padding: '110px 24px 20px' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto' }}>
            <div data-reveal="1" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', opacity: 1 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: '#FF9E5E' }}>Why Dumala</p>
              <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, letterSpacing: '-.03em', fontSize: 'clamp(1.9rem,3.4vw,2.6rem)', lineHeight: 1.15, margin: '16px 0 0', color: '#F5F7FB' }}>More clarity before every session and match.</h2>
              <p style={{ margin: '16px auto 0', fontSize: 15.5, lineHeight: 1.7, color: '#8A96AD' }}>When your team's information lives in one place, every decision starts with the full picture — and your hours go into coaching, not admin.</p>
            </div>

            <div style={{ marginTop: 42, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap: 14 }}>
              {wins.map((w) => (
                <article key={w.title} data-reveal="1" className="dc-glow-shell" style={{ opacity: 1 }}>
                  <GlowingEffect spread={36} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
                  <div className="dc-glow-card" style={{ padding: 26 }}>
                  <span style={{ display: 'inline-flex', border: '1px solid rgba(255,138,61,.24)', background: 'rgba(255,138,61,.1)', borderRadius: 999, padding: '4px 10px', fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#FFB37E' }}>{w.title}</span>
                  <h3 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, letterSpacing: '-.02em', fontSize: 21, lineHeight: 1.2, margin: '16px 0 0', color: '#F5F7FB' }}>{w.benefit}</h3>
                  <p style={{ margin: '10px 0 0', fontSize: 13.5, lineHeight: 1.65, color: '#B9C2D4' }}>{w.note}</p>
                  <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
                    <span aria-hidden="true" style={{ color: '#FFB37E', fontWeight: 700, fontSize: 13 }}>✓</span>
                    <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, fontWeight: 600, color: '#DDE4EF' }}>{w.after}</p>
                  </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '110px 24px 96px' }}>
          <div data-reveal="1" className="dc-glow-shell dc-beta-offer" style={{ opacity: 1, maxWidth: 1040, margin: '0 auto', borderRadius: 30 }}>
            <GlowingEffect spread={44} glow disabled={false} proximity={96} inactiveZone={0.01} borderWidth={3} />
            <div className="dc-glow-card" style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, padding: 34, textAlign: 'left' }}>
              <div aria-hidden="true" style={{ position: 'absolute', left: '35%', top: 0, width: '38rem', height: '16rem', transform: 'translate(-50%,-55%)', borderRadius: '50%', background: 'rgba(255,138,61,.14)', filter: 'blur(70px)' }} />
              <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(320px,100%),1fr))', gap: 28, alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: '.22em', textTransform: 'uppercase', color: '#FF9E5E' }}>Private beta offer</p>
                  <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, letterSpacing: '-.03em', fontSize: 'clamp(1.9rem,3.6vw,2.7rem)', lineHeight: 1.12, margin: '16px 0 0', maxWidth: 680, color: '#F5F7FB' }}>Run one real match week in Dumala for free.</h2>
                  <p style={{ margin: '16px 0 0', maxWidth: 600, fontSize: 14.5, lineHeight: 1.75, color: '#B9C2D4' }}>Use Dumala with one team, test the planning rhythm, and upgrade only when the reports and match-week workflow are clearly saving time.</p>
                  <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <a href="#/app" className="dc-cta-primary">Open Dumala -&gt;</a>
                    <button type="button" onClick={scrollToPricingPlans} className="dc-cta-secondary">Compare plans</button>
                  </div>
                </div>

                <div className="dc-card" style={{ padding: 22 }}>
                  {['Free for one local team workspace', 'No credit card required during beta', 'Back up and restore your work anytime'].map((item) => (
                    <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', borderBottom: item === 'Back up and restore your work anytime' ? 'none' : '1px solid rgba(255,255,255,.08)' }}>
                      <span aria-hidden="true" style={{ color: '#FFB37E', fontWeight: 800, fontSize: 13 }}>+</span>
                      <span style={{ fontSize: 13.5, lineHeight: 1.55, color: '#DDE4EF' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* footer */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,.06)', padding: '56px 24px 34px', background: 'rgba(4,9,26,.42)' }}>
        <div data-reveal="1" className="dc-glow-shell" style={{ opacity: 1, maxWidth: 1160, margin: '0 auto', borderRadius: 26 }}>
          <GlowingEffect spread={46} glow disabled={false} proximity={96} inactiveZone={0.01} borderWidth={3} />
          <div className="dc-glow-card" style={{ padding: '34px 32px 28px', borderRadius: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(210px,100%),1fr))', gap: 32, alignItems: 'start' }}>
            <div>
              <a href="#top" onClick={goTop} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#F5F7FB' }}>
                <img src="/Dumala_logo.png" alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 17 }}>Dumala</span>
              </a>
              <p style={{ margin: '14px 0 0', maxWidth: 330, fontSize: 13.5, lineHeight: 1.7, color: '#8A96AD' }}>The football coaching app that connects your team's information — planning, match preparation, and player development in one workspace.</p>
              <p style={{ margin: '16px 0 0', fontSize: 11, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: '#FF9E5E' }}>Private beta now open</p>
            </div>

            <div>
              <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#DDE4EF' }}>Product</h3>
              <nav style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                <button type="button" onClick={() => scrollToId('value')} className="dc-foot-link" style={{ textAlign: 'left' }}>How it works</button>
                <button type="button" onClick={() => scrollToId('features')} className="dc-foot-link" style={{ textAlign: 'left' }}>Inside the app</button>
                <button type="button" onClick={scrollToPricingPlans} className="dc-foot-link" style={{ textAlign: 'left' }}>Pricing</button>
                <button type="button" onClick={() => scrollToId('fit')} className="dc-foot-link" style={{ textAlign: 'left' }}>Why Dumala</button>
              </nav>
            </div>

            <div>
              <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#DDE4EF' }}>Built For</h3>
              <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                {['Grassroots coaches', 'Club staff', 'Academy teams', 'Player development'].map((item) => (
                  <span key={item} style={{ fontSize: 13.5, color: '#5C6880' }}>{item}</span>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#DDE4EF' }}>Workspace</h3>
              <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                {['Works offline', 'Local backups', 'Multi-team ready', 'Weather-aware prep'].map((item) => (
                  <span key={item} style={{ fontSize: 13.5, color: '#5C6880' }}>{item}</span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 40, paddingTop: 22, borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#43506B' }}>© {new Date().getFullYear()} Dumala. Built for coaches.</p>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <a href="#/app" className="dc-foot-link">Open app</a>
              <button type="button" onClick={goTop} className="dc-foot-link">Back to top</button>
            </div>
          </div>
          </div>
        </div>
      </footer>

      <Dialog open={premiumModalOpen} onOpenChange={setPremiumModalOpen}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto border-white/15 bg-[#071026] p-0 text-[#F5F7FB] shadow-2xl">
          <DialogHeader className="border-b border-white/10 px-5 py-5 pr-12 sm:px-6">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ display: 'flex', width: 42, height: 42, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 12, border: '1px solid rgba(255,138,61,.28)', background: 'rgba(255,138,61,.12)', color: '#FFB37E' }}>
                <Send size={18} aria-hidden="true" />
              </div>
              <div>
                <DialogTitle className="text-[#F5F7FB]">Join the Premium beta list</DialogTitle>
                <DialogDescription className="mt-2 text-[#8A96AD]">
                  Tell us a little about your team so we can invite the right coaches and clubs first when Premium beta access opens.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handlePremiumLeadSubmit} style={{ display: 'grid', gap: 16, padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(220px,100%),1fr))', gap: 14 }}>
              <label className="dc-lead-field">
                <span>Name</span>
                <input value={premiumLead.name} onChange={event => updatePremiumLead('name', event.target.value)} autoComplete="name" data-validation-field="name" />
                {premiumLeadErrors.name && <strong className="dc-lead-error">{premiumLeadErrors.name}</strong>}
              </label>
              <label className="dc-lead-field">
                <span>Email</span>
                <input type="email" value={premiumLead.email} onChange={event => updatePremiumLead('email', event.target.value)} autoComplete="email" data-validation-field="email" />
                {premiumLeadErrors.email && <strong className="dc-lead-error">{premiumLeadErrors.email}</strong>}
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(190px,100%),1fr))', gap: 14 }}>
              <label className="dc-lead-field">
                <span>Club or team</span>
                <input value={premiumLead.organization} onChange={event => updatePremiumLead('organization', event.target.value)} autoComplete="organization" data-validation-field="organization" />
                {premiumLeadErrors.organization && <strong className="dc-lead-error">{premiumLeadErrors.organization}</strong>}
              </label>
              <label className="dc-lead-field">
                <span>Role</span>
                <select value={premiumLead.role} onChange={event => updatePremiumLead('role', event.target.value)}>
                  <option>Coach</option>
                  <option>Club manager</option>
                  <option>Academy staff</option>
                  <option>School staff</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="dc-lead-field">
                <span>Teams</span>
                <input type="number" min={1} max={99} value={premiumLead.teamCount} onChange={event => updatePremiumLead('teamCount', event.target.value)} data-validation-field="teamCount" />
                {premiumLeadErrors.teamCount && <strong className="dc-lead-error">{premiumLeadErrors.teamCount}</strong>}
              </label>
            </div>

            <label className="dc-lead-field">
              <span>What would make Premium worth it?</span>
              <textarea value={premiumLead.notes} onChange={event => updatePremiumLead('notes', event.target.value)} maxLength={800} placeholder="Reports, cloud sync, staff workflows, academy records, or anything else you would pay for." />
            </label>

            <div style={{ borderRadius: 16, border: '1px solid rgba(255,138,61,.18)', background: 'rgba(255,138,61,.08)', padding: 14, color: '#FFD9BC', fontSize: 12.5, lineHeight: 1.55 }}>
              You can keep using Dumala free during beta. We will only use these details to follow up about Premium access, reporting needs, and club-ready workflows.
            </div>

            {premiumLeadStatus !== 'idle' && (
              <div
                role="status"
                className="dc-lead-status"
                style={{
                  borderColor: premiumLeadStatus === 'success' ? 'rgba(52,211,153,.38)' : premiumLeadStatus === 'error' ? 'rgba(251,186,116,.42)' : 'rgba(255,255,255,.12)',
                  background: premiumLeadStatus === 'success' ? 'rgba(16,185,129,.12)' : premiumLeadStatus === 'error' ? 'rgba(251,146,60,.12)' : 'rgba(255,255,255,.04)',
                  color: premiumLeadStatus === 'success' ? '#A7F3D0' : premiumLeadStatus === 'error' ? '#FDBA74' : '#DDE4EF'
                }}
              >
                {premiumLeadStatus === 'success' && <CheckCircle2 size={15} aria-hidden="true" style={{ display: 'inline', marginRight: 8, verticalAlign: '-2px' }} />}
                {premiumLeadMessage || 'Sending your request...'}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 16 }}>
              <button type="button" onClick={() => setPremiumModalOpen(false)} className="dc-lead-ghost">Close</button>
              <button type="submit" disabled={premiumLeadStatus === 'submitting'} className="dc-lead-submit">
                {premiumLeadStatus === 'submitting' ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Send size={15} aria-hidden="true" />}
                {premiumLeadStatus === 'submitting' ? 'Joining list...' : 'Join the Premium beta list'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


