import {
  useEffect,
  useMemo,
  useState,
  type SyntheticEvent,
} from "react";

import { Link } from "react-router-dom";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Clock,
  Maximize2,
  Search,
  SearchX,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

interface ServiceItem {
  _id: string;
  title: string;
  category: string;
  price: number;
  duration: string;
  description: string;
  image: string;
  status?: string;
  createdAt?: string;
}

interface ServicesTabProps {
  services: ServiceItem[];
  providerId: string;
  providerName: string;
}

type SortOption =
  | "recommended"
  | "price-asc"
  | "price-desc"
  | "duration-asc";

interface SelectedImage {
  src: string;
  title: string;
}

/* =========================================================
   CONSTANTS + HELPERS
========================================================= */

const PAGE_SIZE = 9;
const ALL_CATEGORIES = "All";
const PLACEHOLDER_IMAGE = "/images/service-placeholder.png";

const formatNaira = (amount: number) =>
  `₦${Number(amount || 0).toLocaleString("en-NG")}`;

const normalizeCategory = (category?: string) =>
  category?.trim() || "Service";

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const durationInMinutes = (duration?: string) => {
  const value = (duration || "").toLowerCase();

  const weeks = Number(
    value.match(/(\d+(?:\.\d+)?)\s*(?:w|wk|week)s?/)?.[1] || 0
  );
  const days = Number(
    value.match(/(\d+(?:\.\d+)?)\s*(?:d|day)s?/)?.[1] || 0
  );
  const hours = Number(
    value.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hour)s?/)?.[1] || 0
  );
  const minutes = Number(
    value.match(/(\d+(?:\.\d+)?)\s*(?:m|min|minute)s?/)?.[1] || 0
  );

  const total =
    weeks * 7 * 24 * 60 + days * 24 * 60 + hours * 60 + minutes;

  if (total > 0) return total;

  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) && numeric > 0
    ? numeric
    : Number.MAX_SAFE_INTEGER;
};

const handleImageError = (event: SyntheticEvent<HTMLImageElement>) => {
  if (event.currentTarget.src.endsWith(PLACEHOLDER_IMAGE)) return;
  event.currentTarget.src = PLACEHOLDER_IMAGE;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function ServicesTab({
  services,
  providerId,
  providerName,
}: ServicesTabProps) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState(ALL_CATEGORIES);
  const [sort, setSort] = useState<SortOption>("recommended");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedImage, setSelectedImage] =
    useState<SelectedImage | null>(null);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    services.forEach((service) =>
      unique.add(normalizeCategory(service.category))
    );

    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [services]);

  const startingPrice = useMemo(() => {
    if (services.length === 0) return 0;

    return Math.min(
      ...services.map((service) => Number(service.price) || 0)
    );
  }, [services]);

  const filteredServices = useMemo(() => {
    const term = query.trim().toLowerCase();

    const matches = services.filter((service) => {
      const inCategory =
        selectedCategory === ALL_CATEGORIES ||
        normalizeCategory(service.category) === selectedCategory;

      if (!inCategory) return false;
      if (!term) return true;

      return [service.title, service.description, service.category].some(
        (field) => (field || "").toLowerCase().includes(term)
      );
    });

    switch (sort) {
      case "price-asc":
        matches.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;

      case "price-desc":
        matches.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;

      case "duration-asc":
        matches.sort(
          (a, b) =>
            durationInMinutes(a.duration) -
            durationInMinutes(b.duration)
        );
        break;

      default:
        break;
    }

    return matches;
  }, [services, query, selectedCategory, sort]);

  const visibleServices = filteredServices.slice(0, visibleCount);
  const hasFilters =
    query.trim() !== "" ||
    selectedCategory !== ALL_CATEGORIES ||
    sort !== "recommended";

  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedImage(null);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedImage]);

  const clearFilters = () => {
    setQuery("");
    setSelectedCategory(ALL_CATEGORIES);
    setSort("recommended");
    setVisibleCount(PAGE_SIZE);
  };

  const openImage = (src: string, title: string) =>
    setSelectedImage({ src, title });

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
      aria-labelledby="services-heading"
    >
      {/* ===================================================
          HEADER
      ==================================================== */}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 shadow-xs ring-1 ring-primary-100 dark:bg-primary-950/40 dark:text-primary-300 dark:ring-primary-900/50">
            <Briefcase className="h-5 w-5" />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2
                id="services-heading"
                className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white sm:text-[28px]"
              >
                Services
              </h2>

              <span
                aria-label={`${services.length} ${
                  services.length === 1 ? "service" : "services"
                }`}
                className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-ink-900 px-2 text-[11px] font-bold text-white dark:bg-primary-500"
              >
                {services.length}
              </span>
            </div>

            <p className="mt-1 truncate text-sm text-ink-500 dark:text-ink-400">
              Explore what {providerName} offers
            </p>
          </div>
        </div>

        <div className="inline-flex shrink-0 items-center gap-2 self-start rounded-2xl border border-primary-100 bg-primary-50/80 px-4 py-2.5 text-sm text-primary-800 shadow-xs dark:border-primary-900/60 dark:bg-primary-950/30 dark:text-primary-200 sm:self-auto">
          <Sparkles className="h-4 w-4 text-primary-500" />
          <span className="font-medium">From</span>
          <span className="font-extrabold">
            {formatNaira(startingPrice)}
          </span>
        </div>
      </div>

      {/* ===================================================
          TOOLBAR
      ==================================================== */}

      {services.length > 0 && (
        <div className="rounded-3xl border border-ink-100 bg-white/80 p-4 shadow-card backdrop-blur-sm dark:border-ink-800 dark:bg-ink-900/70 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <label htmlFor="services-search" className="sr-only">
                Search services
              </label>

              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />

              <input
                id="services-search"
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                placeholder="Search by title, category or keyword…"
                className="w-full rounded-2xl border border-ink-200 bg-ink-50/70 py-3 pl-11 pr-11 text-sm font-medium text-ink-800 outline-none transition placeholder:text-ink-400 focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-500/10 dark:border-ink-700 dark:bg-ink-800/60 dark:text-ink-100 dark:focus:border-primary-500 dark:focus:bg-ink-800"
              />

              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("");
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:hover:bg-ink-700 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="relative shrink-0 lg:w-56">
              <label htmlFor="services-sort" className="sr-only">
                Sort services
              </label>

              <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />

              <select
                id="services-sort"
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as SortOption);
                  setVisibleCount(PAGE_SIZE);
                }}
                className="w-full appearance-none rounded-2xl border border-ink-200 bg-ink-50/70 py-3 pl-11 pr-10 text-sm font-semibold text-ink-700 outline-none transition focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-500/10 dark:border-ink-700 dark:bg-ink-800/60 dark:text-ink-100 dark:focus:border-primary-500 dark:focus:bg-ink-800"
              >
                <option value="recommended">Recommended</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="duration-asc">Shortest duration</option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            </div>
          </div>

          <div
            className="mt-4 flex gap-2 overflow-x-auto pb-1"
            role="group"
            aria-label="Filter services by category"
          >
            {[ALL_CATEGORIES, ...categories].map((category) => {
              const isActive = selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => {
                    setSelectedCategory(category);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className={cn(
                    "shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
                    isActive
                      ? "border-primary-600 bg-primary-600 text-white shadow-soft"
                      : "border-ink-200 bg-white text-ink-600 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 dark:border-ink-700 dark:bg-ink-800/60 dark:text-ink-300 dark:hover:border-primary-800 dark:hover:bg-primary-950/30 dark:hover:text-primary-300"
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================
          RESULTS COUNT
      ==================================================== */}

      {services.length > 0 && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-wrap items-center justify-between gap-2 px-1"
        >
          <p className="text-xs font-medium text-ink-500 dark:text-ink-400">
            Showing{" "}
            <span className="font-bold text-ink-800 dark:text-ink-100">
              {visibleServices.length}
            </span>{" "}
            of{" "}
            <span className="font-bold text-ink-800 dark:text-ink-100">
              {filteredServices.length}
            </span>{" "}
            {filteredServices.length === 1 ? "service" : "services"}
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full px-3 py-1.5 text-xs font-bold text-primary-700 transition hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:text-primary-300 dark:hover:bg-primary-950/30"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ===================================================
          EMPTY STATES
      ==================================================== */}

      {services.length === 0 ? (
        <div className="relative overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-400/10 blur-3xl" />

          <div className="relative px-6 py-16 text-center sm:px-10 sm:py-20">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-300">
              <Briefcase className="h-7 w-7" />
            </div>

            <h3 className="mt-6 text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white">
              No services yet
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-500 dark:text-ink-400">
              {providerName} has not added any services yet. Available
              services will appear here once they are published.
            </p>
          </div>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-ink-200 bg-white px-6 py-16 text-center shadow-card dark:border-ink-700 dark:bg-ink-900 sm:py-20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-50 text-ink-400 dark:bg-ink-800 dark:text-ink-500">
            <SearchX className="h-7 w-7" />
          </div>

          <h3 className="mt-6 text-xl font-extrabold tracking-tight text-ink-900 dark:text-white">
            No matching services
          </h3>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-500 dark:text-ink-400">
            Try a different search term or category to discover more of
            {providerName}&apos;s services.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-primary-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/20 active:scale-[0.98]"
          >
            <X className="h-4 w-4" />
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {/* =================================================
              CARD GRID
          ================================================= */}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visibleServices.map((service, index) => {
              const serviceImage = service.image || PLACEHOLDER_IMAGE;

              return (
                <motion.article
                  key={service._id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: Math.min(index, 8) * 0.05,
                  }}
                  className="group flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-card-hover dark:border-ink-800 dark:bg-ink-900 dark:hover:border-primary-900/70"
                >
                  <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-ink-100 dark:bg-ink-800">
                    <img
                      src={serviceImage}
                      alt={service.title}
                      loading="lazy"
                      decoding="async"
                      onError={handleImageError}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/10 to-transparent" />

                    <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
                      <span className="inline-flex max-w-[70%] items-center gap-1.5 truncate rounded-full border border-white/20 bg-white/95 px-3 py-1.5 text-[11px] font-bold text-ink-800 shadow-lg backdrop-blur-md dark:bg-ink-900/90 dark:text-white">
                        <Briefcase className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {normalizeCategory(service.category)}
                        </span>
                      </span>

                      {service.status &&
                      service.status !== "pending" ? (
                        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-lg backdrop-blur-md ${service.status === "rejected" || service.status === "cancelled"
                            ? "bg-danger-500/95"
                            : service.status === "completed"
                              ? "bg-brand-500/95"
                              : "bg-primary-500/95"
                          }`}>
                          <CheckCircle2 className="h-3 w-3" />
                          {service.status.charAt(0).toUpperCase() +
                            service.status.slice(1)}
                        </span>
                      ) : null}
                    </div>

                    <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 text-xs font-semibold text-white">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 backdrop-blur-md">
                        <Clock className="h-3.5 w-3.5" />
                      </span>
                      <span className="max-w-[9rem] truncate">
                        {service.duration || "Flexible duration"}
                      </span>
                    </div>

                    <button
                      type="button"
                      aria-label={`View ${service.title} image`}
                      onClick={() => openImage(serviceImage, service.title)}
                      className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-ink-950/40 text-white backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-ink-950/70 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <h3 className="line-clamp-2 text-lg font-extrabold leading-snug tracking-tight text-ink-900 dark:text-white sm:text-xl">
                      {service.title}
                    </h3>

                    <p className="mt-2.5 line-clamp-2 min-h-[44px] text-sm leading-6 text-ink-500 dark:text-ink-400">
                      {service.description ||
                        "Professional service tailored to your needs."}
                    </p>

                    <div className="mt-auto border-t border-ink-100 pt-5 dark:border-ink-800">
                      <div className="flex items-end justify-between gap-4 rounded-2xl bg-ink-50/80 p-4 dark:bg-ink-800/60">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
                            Starting from
                          </p>
                          <p className="mt-1 truncate text-xl font-black tracking-tight text-ink-900 dark:text-white sm:text-2xl">
                            {formatNaira(service.price)}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col items-end">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
                            Duration
                          </p>
                          <div className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-ink-700 dark:text-ink-200">
                            <Clock className="h-3.5 w-3.5 text-primary-500" />
                            <span className="max-w-[6.5rem] truncate">
                              {service.duration || "Flexible"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Link
                        to={`/book/${providerId}?service=${service._id}`}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 py-3.5 text-sm font-bold text-white shadow-soft transition-all duration-300 hover:bg-primary-700 hover:shadow-card-hover focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/25 active:scale-[0.98]"
                      >
                        Book this service
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>

          {visibleServices.length < filteredServices.length && (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                className="inline-flex items-center gap-2 rounded-2xl border border-ink-200 bg-white px-5 py-3 text-sm font-bold text-ink-700 shadow-xs transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:border-primary-800 dark:hover:bg-primary-950/30 dark:hover:text-primary-300"
              >
                Show more services
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* ===================================================
          IMAGE LIGHTBOX
      ==================================================== */}

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            key="service-image-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedImage.title} image`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/85 p-4 backdrop-blur-md sm:p-8"
          >
            <button
              type="button"
              autoFocus
              aria-label="Close image viewer"
              onClick={() => setSelectedImage(null)}
              className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-xl transition hover:bg-white/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/30 sm:right-6 sm:top-6"
            >
              <X className="h-5 w-5" />
            </button>

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-ink-900 shadow-elevated"
            >
              <img
                src={selectedImage.src}
                alt={selectedImage.title}
                onError={handleImageError}
                className="max-h-[70vh] w-full object-contain"
              />

              <div className="flex items-center justify-between gap-4 border-t border-white/10 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary-300">
                    Service image
                  </p>
                  <p className="mt-1 truncate text-sm font-bold text-white">
                    {selectedImage.title}
                  </p>
                </div>

                <span className="hidden shrink-0 items-center gap-1.5 text-xs text-ink-400 sm:flex">
                  Press Esc to close
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
