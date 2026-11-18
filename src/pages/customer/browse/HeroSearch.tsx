import { Search } from "lucide-react";
import { cn } from "@/components/ui";

type TrendingItem = {
  label: string;
  query: string;
};

export function HeroSearch({
  value,
  onChange,
  onSubmit,
  // trending,
  onSelectTrending,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  // trending: TrendingItem[];
  onSelectTrending: (query: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-3xl", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="flex w-full items-center gap-2 rounded-full bg-white p-2 shadow-[0_12px_30px_rgba(14,43,37,0.18)] ring-1 ring-white/60"
      >
        <label htmlFor="browse-hero-search" className="sr-only">
          Search services, categories or providers
        </label>
        <div className="flex min-w-0 flex-1 items-center gap-3 pl-3 sm:pl-4">
          <Search
            className="h-5 w-5 shrink-0 text-[#59625E]"
            aria-hidden="true"
          />

          <input
            id="browse-hero-search"
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search services, categories or providers..."
            aria-label="Search services, categories or providers"
            enterKeyHint="search"
            autoComplete="off"
            className="h-11 min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-[15px] text-[#0E1A17] outline-none ring-0 shadow-none placeholder:text-[#59625E] focus:border-0 focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0"
          />

        </div>
        <button
          type="submit"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#C6F36B] px-5 text-sm font-semibold text-[#0E2B25] transition-colors hover:bg-[#b8ea56] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6F36B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E2B25] sm:px-7"
          style={{ fontFamily: '"Space Grotesk", Inter, sans-serif' }}
        >
          Search
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className="pr-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#CFE6DC]/80"
          style={{ fontFamily: '"Inter", sans-serif' }}
        >
          {/* Trending */}
        </span>
        {/* {trending.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onSelectTrending(item.query)}
            className="inline-flex min-h-[44px] items-center rounded-full border border-[#C6F36B]/20 bg-[#1B4238] px-4 py-2 text-sm font-medium text-[#EAF7F1] transition-colors hover:border-[#C6F36B]/40 hover:bg-[#245447] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6F36B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E2B25]"
          >
            {item.label}
          </button>
        ))} */}
      </div>
    </div>
  );
}
