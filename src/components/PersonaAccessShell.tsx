import React, { type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AetherFlowBackdrop } from './ui/aether-flow-hero';
import { GlowingEffect } from './ui/glowing-effect';
import {
  ORANGE_NEW_CLASSES,
  ORANGE_NEW_GLOW_PROPS,
  ORANGE_NEW_THEME_STYLE
} from '../theme/orangeNewTheme';

interface PersonaAccessHighlight {
  icon: LucideIcon;
  title: string;
  text?: string;
}

interface PersonaAccessShellProps {
  variant: 'player' | 'league';
  eyebrow: string;
  title: string;
  description: string;
  badge: string;
  highlights?: PersonaAccessHighlight[];
  compact?: boolean;
  singlePanel?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}

const variantStyles = {
  player: {
    particleColor: 'rgba(255,109,0,0.86)',
    lineRGB: '255,179,126',
    accent: 'text-orange-200',
    rail: 'border-orange-300/15 bg-[linear-gradient(145deg,rgba(255,109,0,0.14),rgba(7,17,31,0.72)_46%,rgba(4,21,17,0.52))]'
  },
  league: {
    particleColor: 'rgba(34,211,238,0.82)',
    lineRGB: '125,211,252',
    accent: 'text-cyan-200',
    rail: 'border-cyan-300/15 bg-[linear-gradient(145deg,rgba(34,211,238,0.13),rgba(7,17,31,0.74)_46%,rgba(30,41,59,0.52))]'
  }
} as const;

const PersonaAccessShell = ({
  variant,
  eyebrow,
  title,
  description,
  badge,
  highlights = [],
  compact = false,
  singlePanel = false,
  children,
  footer
}: PersonaAccessShellProps) => {
  const style = variantStyles[variant];

  return (
    <div
      className={`${ORANGE_NEW_CLASSES.accessShell} flex min-h-screen items-center justify-center p-3 sm:p-4 lg:p-6`}
      style={ORANGE_NEW_THEME_STYLE}
    >
      <AetherFlowBackdrop
        className="absolute inset-0 z-0"
        particleColor={style.particleColor}
        lineRGB={style.lineRGB}
      />

      <main className={`relative z-10 w-full ${compact ? 'max-w-4xl' : 'max-w-6xl'}`}>
        <div className={ORANGE_NEW_CLASSES.glowShell}>
          <GlowingEffect {...ORANGE_NEW_GLOW_PROPS.shell} />
          <section className={`relative z-10 overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#07111f]/90 text-slate-100 shadow-2xl shadow-black/45 backdrop-blur-xl ${
            singlePanel
              ? ''
              : `grid ${compact ? 'lg:grid-cols-[minmax(0,0.72fr)_minmax(330px,0.9fr)]' : 'lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.78fr)]'}`
          }`}>
            <div className={`relative overflow-hidden border-b p-5 sm:p-6 ${singlePanel ? '' : 'lg:border-b-0 lg:border-r'} ${compact ? 'lg:p-6' : 'lg:p-8'} ${style.rail}`}>
              <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-orange-300/10 blur-3xl" />
              <div className="relative z-10">
                <div className={`flex gap-3 ${singlePanel ? 'items-start justify-between sm:items-center' : 'items-center'}`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src="/dumala-onboarding-logo.png"
                      alt="Dumala"
                      className={`w-auto object-contain ${singlePanel ? 'h-16 sm:h-20' : compact ? 'h-14 sm:h-16' : 'h-14 sm:h-20'}`}
                    />
                    <div>
                      <p className={ORANGE_NEW_CLASSES.eyebrowLabel}>{eyebrow}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{badge}</p>
                    </div>
                  </div>
                </div>

                <h1 className={`max-w-2xl font-display font-black leading-[1.04] text-white ${singlePanel ? 'mt-4 text-2xl sm:text-3xl' : compact ? 'mt-5 text-2xl sm:text-3xl' : 'mt-7 text-3xl sm:text-5xl'}`}>
                  {title}
                </h1>
                <p className={`mt-3 text-sm font-medium text-slate-400 ${singlePanel ? 'max-w-3xl leading-6' : `max-w-xl ${compact ? 'leading-6' : 'leading-7 sm:text-base'}`}`}>
                  {description}
                </p>

                {highlights.length > 0 && <div className={`grid gap-2 ${compact ? 'mt-5' : 'mt-8 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3'}`}>
                  {highlights.map(({ icon: Icon, title: itemTitle, text }) => (
                    <div key={itemTitle} className={`rounded-2xl border border-white/10 bg-white/[0.045] shadow-sm shadow-black/10 ${compact ? 'flex items-center gap-2.5 p-3' : 'p-4'}`}>
                      <Icon size={18} className={`${style.accent} shrink-0`} aria-hidden="true" />
                      <div>
                        <h2 className="text-sm font-black text-slate-100">{itemTitle}</h2>
                        {text && <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{text}</p>}
                      </div>
                    </div>
                  ))}
                </div>}
              </div>
            </div>

            <div className={`flex flex-col justify-center p-5 sm:p-6 ${singlePanel ? 'lg:p-6' : compact ? 'min-h-[30rem] lg:p-6' : 'min-h-[34rem] sm:p-7 lg:p-8'}`}>
              <div className="space-y-4">{children}</div>
              {footer && <div className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-slate-500">{footer}</div>}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PersonaAccessShell;
