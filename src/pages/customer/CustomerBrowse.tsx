import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  DashboardLayout,
  DashboardHeader,
} from "@/components/DashboardLayout";
import { customerNavItems } from "@/data/customerNavItems";
import { categories as staticCategories } from "@/data/mockData";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  SearchBar,
  ServiceCard,
  Skeleton,
  cn,
  type ServiceLike,
} from "@/components/ui";
import { useApprovedServices } from "@/hooks/queries";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";

/* =========================================================
   TYPES
   (ServiceLike is the backend-aware shape exported by the
    design system, so cards and query data stay in sync)
========================================================= */

type Service = ServiceLike;

type DisplayService = Service & {
  providerServiceCount: number;
  additionalServicesCount: number;
};

type LoggedInUser = {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  role?: string;
};

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "name", label: "Name" },
];

/* =========================================================
   HELPERS
========================================================= */

const getStoredUserId = (): string | null => {
  try {
    const storedUser = sessionStorage.getItem("servicely_user");

    if (!storedUser) {
      return null;
    }

    const user: LoggedInUser = JSON.parse(storedUser);

    return user._id || user.id || null;
  } catch (error) {
    console.error("Failed to read logged-in user:", error);

    return null;
  }
};

const getProviderId = (service: Service): string =>
  String(service.provider?._id || service.provider?.id || "");

const getServiceKey = (service: Service, index: number): string =>
  String(service._id || service.id || `service-${index}`);

const getCreatedAtTime = (service: Service): number => {
  const value = service.createdAt;

  if (typeof value !== "string" || !value) {
    return 0;
  }

  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : 0;
};

/*
 * Search matches title, description, category and provider name —
 * same client-side filtering behaviour as before the redesign.
 */
function matchesSearch(service: Service, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase();

  if (!query) {
    return true;
  }

  const title = (service.title || "").toLowerCase();
  const description = (service.description || "").toLowerCase();
  const category = (service.category || "").toLowerCase();
  const providerName = (
    service.provider?.fullName ||
    service.provider?.name ||
    ""
  ).toLowerCase();

  return (
    title.includes(query) ||
    description.includes(query) ||
    category.includes(query) ||
    providerName.includes(query)
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export function CustomerBrowse() {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useApprovedServices();

  const [search, setSearch] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("All");

  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);

  /*
   * Read the signed-in user once on mount. This is only used to
   * keep a customer's own services out of the browse feed.
   */
  const [currentUserId] = useState<string | null>(() =>
    getStoredUserId()
  );

  const services = useMemo<Service[]>(
    () => (Array.isArray(data) ? data : []),
    [data]
  );

  /* =========================================================
     REMOVE CURRENT USER'S OWN SERVICES
  ========================================================= */

  const servicesFromOtherUsers = useMemo(() => {
    if (!currentUserId) {
      return services;
    }

    return services.filter((service) => {
      const providerId = getProviderId(service);

      if (!providerId) {
        return true;
      }

      return providerId !== currentUserId;
    });
  }, [services, currentUserId]);

  /* =========================================================
     CATEGORY CHIPS
     Static categories from mockData + whatever the
     backend returned on the approved-services feed.
  ========================================================= */

  const categoryOptions = useMemo(() => {
    const names = new Set<string>();

    staticCategories.forEach((category) => {
      if (category.name) {
        names.add(category.name);
      }
    });

    servicesFromOtherUsers.forEach((service) => {
      if (service.category) {
        names.add(service.category);
      }
    });

    return ["All", ...Array.from(names)];
  }, [servicesFromOtherUsers]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();

    servicesFromOtherUsers.forEach((service) => {
      if (!service.category) {
        return;
      }

      counts.set(
        service.category,
        (counts.get(service.category) ?? 0) + 1
      );
    });

    return counts;
  }, [servicesFromOtherUsers]);

  /* =========================================================
     FILTER + SEARCH + SORT + GROUP BY PROVIDER
  ========================================================= */

  const filteredServices = useMemo(() => {
    let result = [...servicesFromOtherUsers];

    /* SEARCH */
    if (search.trim()) {
      result = result.filter((service) =>
        matchesSearch(service, search)
      );
    }

    /* CATEGORY */
    if (selectedCategory !== "All") {
      result = result.filter(
        (service) => service.category === selectedCategory
      );
    }

    /* SORT SERVICES BEFORE GROUPING */
    if (sortBy === "price-low") {
      result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    }

    if (sortBy === "price-high") {
      result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    }

    if (sortBy === "name") {
      result.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "")
      );
    }

    if (sortBy === "newest") {
      result.sort(
        (a, b) => getCreatedAtTime(b) - getCreatedAtTime(a)
      );
    }

    /* GROUP SERVICES BY PROVIDER */
    const providerMap = new Map<string, DisplayService>();

    result.forEach((service, index) => {
      /*
       * If provider ID exists, use it.
       *
       * If for some reason the backend doesn't
       * populate provider, fall back to the service ID
       * so the service is still displayed.
       */
      const providerKey =
        getProviderId(service) || `service-${getServiceKey(service, index)}`;

      const existing = providerMap.get(providerKey);

      if (!existing) {
        providerMap.set(providerKey, {
          ...service,
          providerServiceCount: 1,
          additionalServicesCount: 0,
        });
      } else {
        /*
         * Same provider has another service.
         */
        existing.providerServiceCount += 1;

        existing.additionalServicesCount =
          existing.providerServiceCount - 1;
      }
    });

    return Array.from(providerMap.values());
  }, [servicesFromOtherUsers, search, selectedCategory, sortBy]);

  const pageSize = 4;
  const totalPages = Math.ceil(filteredServices.length / pageSize);
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const firstProviderOnPage =
    filteredServices.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastProviderOnPage = Math.min(
    currentPage * pageSize,
    filteredServices.length
  );

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory, sortBy, servicesFromOtherUsers.length]);

  /* =========================================================
     RESULT COUNT (services matching search + category)
  ========================================================= */

  const totalMatchingServices = useMemo(() => {
    let result = [...servicesFromOtherUsers];

    if (search.trim()) {
      result = result.filter((service) =>
        matchesSearch(service, search)
      );
    }

    if (selectedCategory !== "All") {
      result = result.filter(
        (service) => service.category === selectedCategory
      );
    }

    return result.length;
  }, [servicesFromOtherUsers, search, selectedCategory]);

  /* =========================================================
     CLEAR FILTERS + RETRY
  ========================================================= */

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setSortBy("newest");
  };

  const refresh = () => {
    void refetch();
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCategory !== "All" ||
    sortBy !== "newest";

  const countLabel = hasActiveFilters
    ? totalMatchingServices === 1
      ? "service matches your search"
      : "services match your search"
    : totalMatchingServices === 1
      ? "service available"
      : "services available";

  const errorMessage =
    error instanceof Error && error.message
      ? error.message
      : "We couldn't load the service catalogue. Please try again.";

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <DashboardLayout
      role="customer"
      navItems={customerNavItems}
    >
      <DashboardHeader
        title="Browse Services"
        subtitle="Find trusted providers for your needs"
        action={
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            loading={isFetching && !isLoading}
            disabled={isLoading}
            onClick={refresh}
            className="self-start sm:self-auto"
          >
            Refresh
          </Button>
        }
      />

      {/* =====================================================
          SEARCH + FILTER BAR
      ===================================================== */}

      <section
        aria-label="Search and filter services"
        className="mb-5 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900"
      >
        {/* Brand banner */}
        <div className="flex flex-col gap-4 bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:from-brand-700 dark:via-brand-600 dark:to-brand-800">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/20">
                <Sparkles className="h-4 w-4 text-white" />
              </span>

              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
                Servicely Marketplace
              </span>
            </div>

            <h2 className="mt-2 text-lg font-bold text-white sm:text-xl">
              Find the right service for you
            </h2>

            <p className="mt-1 text-sm text-white/80 dark:text-white/70">
              Browse trusted services offered by ABUAD providers.
            </p>
          </div>

          <div className="flex items-baseline gap-2 rounded-2xl bg-white/15 px-4 py-3 sm:flex-col sm:items-end sm:gap-0">
            <p className="text-2xl font-bold leading-none text-white tabular-nums">
              {isLoading ? "—" : totalMatchingServices}
            </p>

            <p className="text-xs font-medium text-white/80 sm:mt-1">
              {isLoading ? "loading services" : countLabel}
            </p>
          </div>
        </div>

        {/* Search + sort + chips panel */}
        <div className="bg-white p-4 sm:p-5 dark:bg-ink-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search services, categories or providers..."
              className="min-w-0 flex-1"
            />

            <div className="flex items-center gap-2">
              <label
                htmlFor="browse-sort"
                className="shrink-0 text-xs font-medium text-slate-500 dark:text-ink-400"
              >
                Sort by
              </label>

              <select
                id="browse-sort"
                value={sortBy}
                aria-label="Sort services by"
                onChange={(event) => setSortBy(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 sm:w-auto dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            role="group"
            aria-label="Filter by category"
            className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
          >
            {categoryOptions.map((category) => {
              const active = selectedCategory === category;

              const chipCount =
                category === "All"
                  ? servicesFromOtherUsers.length
                  : categoryCounts.get(category) ?? 0;

              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors duration-200 active:scale-[0.98]",
                    active
                      ? "border-brand-600 bg-brand-600 text-white shadow-soft dark:border-brand-500 dark:bg-brand-500 dark:text-white"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-brand-200 hover:bg-lavender hover:text-brand-700 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:border-ink-600 dark:hover:bg-ink-700 dark:hover:text-ink-50"
                  )}
                >
                  {category}

                  {chipCount > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                        active
                          ? "bg-white/20 text-white"
                          : "bg-white text-slate-500 dark:bg-ink-900 dark:text-ink-400"
                      )}
                    >
                      {chipCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          RESULTS TOOLBAR
      ===================================================== */}

      {!isLoading && !isError && filteredServices.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p
            aria-live="polite"
            className="text-sm text-slate-500 dark:text-ink-400"
          >
            <span className="font-semibold text-slate-900 dark:text-ink-50">
              {totalMatchingServices}
            </span>{" "}
            {totalMatchingServices === 1 ? "service" : "services"} from{" "}
            <span className="font-semibold text-slate-900 dark:text-ink-50">
              {filteredServices.length}
            </span>{" "}
            {filteredServices.length === 1 ? "provider" : "providers"}
          </p>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              icon={X}
              aria-label="Clear all filters"
              onClick={clearFilters}
              className="self-start sm:self-auto"
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* =====================================================
          LOADING SKELETONS
      ===================================================== */}

      {isLoading && (
        <div
          aria-busy="true"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          <span className="sr-only">Loading services…</span>

          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="card overflow-hidden"
              aria-hidden="true"
            >
              <div className="aspect-[16/10] animate-pulse bg-slate-100 dark:bg-ink-800" />

              <div className="space-y-3 p-4">
                <Skeleton className="h-4 w-3/4" />

                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>

                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />

                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =====================================================
          ERROR
      ===================================================== */}

      {!isLoading && isError && (
        <ErrorState message={errorMessage} onRetry={refresh} />
      )}

      {/* =====================================================
          EMPTY
      ===================================================== */}

      {!isLoading && !isError && filteredServices.length === 0 && (
        <EmptyState
          icon={Search}
          title={
            hasActiveFilters
              ? "No services match your filters"
              : "No services available yet"
          }
          description={
            hasActiveFilters
              ? "We couldn't find any services matching your search or filters. Try a different term or category."
              : "There are no approved services to browse right now. Please check back soon."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" icon={X} onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button variant="outline" icon={RefreshCw} onClick={refresh}>
                Refresh
              </Button>
            )
          }
        />
      )}

      {/* =====================================================
          SERVICES (grouped by provider)
      ===================================================== */}

      {!isLoading && !isError && filteredServices.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedServices.map((group, index) => {
            const providerId = getProviderId(group);

            const providerLabel =
              group.provider?.fullName ||
              group.provider?.name ||
              "provider";

            const serviceId = String(group._id || group.id || "");

            const providerServices = providerId
              ? servicesFromOtherUsers.filter(
                  (candidate) =>
                    getProviderId(candidate) === providerId
                )
              : [group];

            return (
              <motion.div
                key={
                  providerId
                    ? `provider-${providerId}`
                    : `service-${getServiceKey(group, index)}`
                }
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: Math.min(index * 0.05, 0.4),
                  ease: "easeOut",
                }}
                className="relative h-full"
              >
                <ServiceCard
                  service={group}
                  className="h-full"
                  action={
                    providerId ? (
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Link
                          to={`/book/${providerId}?service=${serviceId}`}
                          aria-label={`Book Now: ${group.title || "service"} with ${providerLabel}`}
                          className="btn-primary btn-sm whitespace-nowrap"
                        >
                          Book Now
                        </Link>

                        <Link
                          to={`/providers/${providerId}`}
                          state={{ providerServices }}
                          className="rounded text-[11px] font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                        >
                          View provider
                        </Link>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled
                        aria-label="Provider unavailable"
                        className="btn-outline btn-sm whitespace-nowrap"
                      >
                        Unavailable
                      </button>
                    )
                  }
                />

                {group.additionalServicesCount > 0 && (
                  <Badge
                    tone="brand"
                    className="pointer-events-none absolute right-3 top-3 shadow-sm"
                  >
                    +{group.additionalServicesCount} more
                    <span className="sr-only">
                      {" "}
                      services from this provider
                    </span>
                  </Badge>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {!isLoading && !isError && filteredServices.length > 0 && (
        <nav
          aria-label="Service results pagination"
          className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 shadow-card sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-ink-800 dark:bg-ink-900"
        >
          <p
            aria-live="polite"
            className="text-sm text-slate-500 dark:text-ink-400"
          >
            Showing{" "}
            <span className="font-semibold text-slate-800 dark:text-ink-100">
              {firstProviderOnPage}–{lastProviderOnPage}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-800 dark:text-ink-100">
              {filteredServices.length}
            </span>{" "}
            providers
          </p>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className="text-xs font-medium tabular-nums text-slate-500 dark:text-ink-400">
              Page {currentPage} of {Math.max(totalPages, 1)}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous page"
                title="Previous page"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-brand-300 hover:bg-lavender hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:border-ink-600 dark:hover:bg-ink-700 dark:hover:text-ink-50 dark:disabled:hover:border-ink-700 dark:disabled:hover:bg-ink-800 dark:disabled:hover:text-ink-300"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next page"
                title="Next page"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-brand-300 hover:bg-lavender hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:border-ink-600 dark:hover:bg-ink-700 dark:hover:text-ink-50 dark:disabled:hover:border-ink-700 dark:disabled:hover:bg-ink-800 dark:disabled:hover:text-ink-300"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </nav>
      )}
    </DashboardLayout>
  );
}
