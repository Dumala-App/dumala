import type { LucideIcon } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from './ui/button';

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
    <Button
      id={id}
      type="button"
      variant="ghost"
      onClick={onSelect}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'h-auto items-center border font-bold transition-all focus-visible:ring-white/25',
        layout === 'desktop'
          ? 'gap-2 rounded-xl px-3 py-2 text-[11px] [&_svg]:size-3.5'
          : 'min-h-11 w-full gap-3 rounded-xl px-4 py-3 text-xs [&_svg]:size-4',
        isActive
          ? 'border-accent/70 bg-accent text-accent-foreground shadow-md shadow-orange-950/20 hover:bg-accent hover:text-accent-foreground'
          : 'border-transparent text-white/72 hover:bg-white/10 hover:text-white'
      )}
    >
      <Icon size={layout === 'desktop' ? 14 : 16} aria-hidden="true" />
      {label}
    </Button>
  );
}
