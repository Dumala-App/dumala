import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs';

type SegmentedTabOption<TValue extends string> = {
  value: TValue;
  label: string;
};

interface SegmentedTabsProps<TValue extends string> {
  value: TValue;
  options: Array<SegmentedTabOption<TValue>>;
  onValueChange: (value: TValue) => void;
  label: string;
  className?: string;
  listClassName?: string;
  triggerClassName?: string;
}

export function SegmentedTabs<TValue extends string>({
  value,
  options,
  onValueChange,
  label,
  className,
  listClassName,
  triggerClassName
}: SegmentedTabsProps<TValue>) {
  return (
    <div className={className ?? 'rounded-xl border border-border bg-card p-2 shadow-sm'}>
      <Tabs value={value} onValueChange={(nextValue) => onValueChange(nextValue as TValue)}>
        <TabsList aria-label={label} className={listClassName}>
          {options.map((option) => (
            <TabsTrigger key={option.value} value={option.value} className={triggerClassName}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
