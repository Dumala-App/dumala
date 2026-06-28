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
}

export function SegmentedTabs<TValue extends string>({
  value,
  options,
  onValueChange,
  label
}: SegmentedTabsProps<TValue>) {
  return (
    <div className="rounded-xl border border-border bg-card p-2 shadow-sm">
      <Tabs value={value} onValueChange={(nextValue) => onValueChange(nextValue as TValue)}>
        <TabsList aria-label={label}>
          {options.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
