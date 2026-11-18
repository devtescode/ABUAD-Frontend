import { cn } from "@/components/ui";

export type BrowseView = "grid" | "list";

function GridIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="5.5" height="5.5" rx="1.2" />
      <rect x="11.5" y="3" width="5.5" height="5.5" rx="1.2" />
      <rect x="3" y="11.5" width="5.5" height="5.5" rx="1.2" />
      <rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1.2" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 5.5h12M4 10h12M4 14.5h12" />
    </svg>
  );
}

export function ViewToggle({
  value,
  onChange,
}: {
  value: BrowseView;
  onChange: (value: BrowseView) => void;
}) {
  const base =
    "inline-flex h-10 w-10 items-center justify-center rounded-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6F36B] focus-visible:ring-offset-2";

  return (
    <div className="inline-flex items-center rounded-[14px] border border-[#E4E6E0] bg-white p-1 dark:border-ink-800 dark:bg-ink-900">
      <button
        type="button"
        aria-label="Grid view"
        aria-pressed={value === "grid"}
        onClick={() => onChange("grid")}
        className={cn(
          base,
          value === "grid"
            ? "bg-[#0E2B25] text-[#C6F36B] dark:bg-ink-50 dark:text-ink-950"
            : "text-[#59625E] hover:bg-[#F4F3EE] hover:text-[#0E1A17] dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-50"
        )}
      >
        <GridIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="List view"
        aria-pressed={value === "list"}
        onClick={() => onChange("list")}
        className={cn(
          base,
          value === "list"
            ? "bg-[#0E2B25] text-[#C6F36B] dark:bg-ink-50 dark:text-ink-950"
            : "text-[#59625E] hover:bg-[#F4F3EE] hover:text-[#0E1A17] dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-50"
        )}
      >
        <ListIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
