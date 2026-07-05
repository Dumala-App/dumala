import { cn } from '@/src/lib/utils';
import { Button } from './ui/button';

interface ShellNavItemProps {
  id: string;
  label: string;
  isActive: boolean;
  onSelect: () => void;
  layout: 'desktop' | 'mobile';
}

export default function ShellNavItem({
  id,
  label,
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
        'h-auto items-center justify-center rounded-xl transition-all duration-150 focus-visible:ring-orange-300/40',
        layout === 'desktop'
          ? 'px-4 py-2 text-sm'
          : 'min-h-11 w-full py-3 text-sm',
        isActive
          ? 'bg-[linear-gradient(180deg,#FF9A52,#FF8A3D)] font-bold text-[#180A00] shadow-[inset_0_1px_0_rgba(255,255,255,.32),0_1px_2px_rgba(0,0,0,.35),0_6px_14px_-7px_rgba(255,138,61,.5)] hover:bg-[linear-gradient(180deg,#FFB06E,#FFA35F)] hover:text-[#180A00]'
          : 'font-medium text-[#8A96AD] hover:bg-white/[0.04] hover:text-[#F5F7FB]'
      )}
    >
      {label}
    </Button>
  );
}
