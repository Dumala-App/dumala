import type { LucideIcon } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface ShellNavItemProps {
  id: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  onSelect: () => void;
  layout: 'desktop' | 'mobile';
}

export default function ShellNavItem({
  id,
  label,
  icon: Icon,
  isActive,
  onSelect,
  layout
}: ShellNavItemProps) {
  return (
    <button
      id={id}
      type="button"
      onClick={onSelect}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'inline-flex items-center border font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25',
        layout === 'desktop'
          ? 'gap-2 rounded-xl px-3 py-2 text-[11px]'
          : 'min-h-11 w-full gap-3 rounded-xl px-4 py-3 text-xs',
        isActive
          ? 'border-white bg-white text-slate-950 shadow-md'
          : 'border-transparent text-slate-300 hover:bg-white/10 hover:text-white'
      )}
    >
      <Icon size={layout === 'desktop' ? 14 : 16} aria-hidden="true" />
      {label}
    </button>
  );
}
