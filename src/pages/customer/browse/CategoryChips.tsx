import { cn } from "@/components/ui";

export type CategoryChipOption = {
  name: string;
  count: number;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function CategoryChips({
  options,
  selected,
  onSelect,
}: {
  options: CategoryChipOption[];
  selected: string;
  onSelect: (category: string) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Filter by category"
      className="flex flex-wrap gap-2"
    >
      {options.map((option) => {
        const active =
          option.name === "All"
            ? selected === "All"
            : normalize(option.name) === normalize(selected);
        return (
          <button
            key={option.name}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(option.name)}
            className={cn(
              "inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E2B25] focus-visible:ring-offset-2",
              active
                ? "border-[#0E2B25] bg-[#0E2B25] text-white dark:border-ink-50 dark:bg-ink-50 dark:text-ink-950"
                : "border-[#E4E6E0] bg-white text-[#0E1A17] hover:border-[#0E2B25]/30 hover:bg-[#F4F3EE] dark:border-ink-800 dark:bg-ink-900 dark:text-ink-50 dark:hover:border-ink-700 dark:hover:bg-ink-800"
            )}
          >
            <span>{option.name}</span>
            <span
              className={cn(
                "inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                active
                  ? "bg-white/15 text-white dark:bg-ink-950/10 dark:text-ink-950"
                  : "bg-[#F4F3EE] text-[#59625E] dark:bg-ink-800 dark:text-ink-300"
              )}
            >
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
