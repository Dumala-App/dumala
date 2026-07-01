import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs';

export const WORKSPACE_SEGMENTED_TABS_CLASS =
  'inline-flex max-w-full rounded-2xl border border-cyan-300/10 bg-[#06111f]/88 p-2 text-slate-100 shadow-lg shadow-black/20 backdrop-blur-xl';

export const WORKSPACE_SEGMENTED_LIST_CLASS =
  'h-auto max-w-full flex-wrap justify-start gap-2 border-0 bg-transparent p-0 text-slate-300 shadow-none';

export const WORKSPACE_SEGMENTED_TRIGGER_CLASS = [
  'inline-flex h-8 flex-none items-center justify-center whitespace-nowrap rounded-lg border border-transparent px-3 text-[12px] font-semibold tracking-normal text-slate-300 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/20',
  'hover:bg-cyan-300/8 hover:text-cyan-50',
  'aria-[pressed=true]:bg-cyan-300/12 aria-[pressed=true]:text-white',
  'data-[state=active]:bg-cyan-300/12 data-[state=active]:text-white'
].join(' ');

export type SegmentedTabOption<TValue extends string> = {
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
    <div className={className ?? WORKSPACE_SEGMENTED_TABS_CLASS}>
      <Tabs value={value} onValueChange={(nextValue) => onValueChange(nextValue as TValue)}>
        <TabsList aria-label={label} className={listClassName ?? WORKSPACE_SEGMENTED_LIST_CLASS}>
          {options.map((option) => (
            <TabsTrigger key={option.value} value={option.value} className={triggerClassName ?? WORKSPACE_SEGMENTED_TRIGGER_CLASS}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
