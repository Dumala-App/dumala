import React from 'react';
import { cn } from '@/src/lib/utils';

function Card({ className, ...props }: React.ComponentProps<'article'>) {
  return (
    <article
      className={cn(
        'relative w-full rounded-2xl border border-cyan-300/10 bg-[#07111f]/88 p-1.5 shadow-2xl shadow-black/25 backdrop-blur-xl',
        className
      )}
      {...props}
    />
  );
}

function Header({
  className,
  children,
  glassEffect = true,
  ...props
}: React.ComponentProps<'div'> & {
  glassEffect?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative mb-4 overflow-hidden rounded-xl border border-cyan-300/10 bg-white/[0.035] p-4',
        className
      )}
      {...props}
    >
      {glassEffect && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-48 rounded-[inherit]"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 42%, rgba(0,0,0,0) 100%)'
          }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

function Plan({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('mb-8 flex items-center justify-between gap-3', className)}
      {...props}
    />
  );
}

function Description({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={cn('text-xs leading-5 text-slate-400', className)} {...props} />;
}

function PlanName({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm font-bold text-slate-300 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  );
}

function Badge({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'rounded-full border border-orange-300/20 bg-orange-300/10 px-2 py-0.5 text-xs font-black uppercase tracking-normal text-orange-100',
        className
      )}
      {...props}
    />
  );
}

function Price({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('mb-3 flex items-end gap-1', className)} {...props} />;
}

function MainPrice({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn('font-display text-3xl font-black tracking-normal text-white', className)}
      {...props}
    />
  );
}

function Period({ className, ...props }: React.ComponentProps<'span'>) {
  return <span className={cn('pb-1 text-sm text-slate-400', className)} {...props} />;
}

function OriginalPrice({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn('ml-auto mr-1 text-lg text-slate-500 line-through', className)}
      {...props}
    />
  );
}

function Body({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('space-y-6 p-3', className)} {...props} />;
}

function List({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul className={cn('space-y-3', className)} {...props} />;
}

function ListItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      className={cn('flex items-start gap-3 text-sm leading-6 text-slate-300', className)}
      {...props}
    />
  );
}

function Separator({
  children = 'Upgrade to access',
  className,
  ...props
}: React.ComponentProps<'div'> & {
  children?: string;
}) {
  return (
    <div
      className={cn('flex items-center gap-3 text-sm text-slate-500', className)}
      {...props}
    >
      <span className="h-px flex-1 bg-cyan-300/10" />
      <span className="shrink-0 text-[11px] font-black uppercase tracking-normal text-slate-500">{children}</span>
      <span className="h-px flex-1 bg-cyan-300/10" />
    </div>
  );
}

export {
  Card,
  Header,
  Description,
  Plan,
  PlanName,
  Badge,
  Price,
  MainPrice,
  Period,
  OriginalPrice,
  Body,
  List,
  ListItem,
  Separator
};
