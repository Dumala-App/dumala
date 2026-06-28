import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, disabled, ...props }, ref) => (
    <span
      className={cn(
        'relative inline-flex size-4 shrink-0 items-center justify-center rounded border border-border bg-input transition-colors',
        'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/35 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background',
        'has-[:checked]:border-primary has-[:checked]:bg-primary',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <input
        ref={ref}
        type="checkbox"
        disabled={disabled}
        className="peer absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...props}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none flex size-full items-center justify-center rounded-[3px] text-primary-foreground transition-colors peer-checked:[&>svg]:opacity-100"
      >
        <Check className="size-3 opacity-0 transition-opacity" />
      </span>
    </span>
  )
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
