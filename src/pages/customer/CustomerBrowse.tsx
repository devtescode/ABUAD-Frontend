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
  Button,
  EmptyState,
  ErrorState,
  SearchBar,
  ServiceCard,
  Skeleton,
  cn,
} from "@/components/ui";
import { RefreshCw, Search, Sparkles, X } from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

/* =========================================================
   TYPES
   (type aliases so they stay assignable to the
    backend-aware ServiceLike / ProviderLike shapes)
========================================================= */

type Provider = {
  _id?: string;
  fullName?: string;
  name?: string;
  avatar?: string;
  profileImage?: string;
};

type Service = {
  _id: string;
  title: string;
  category: string;
  price: number;
  duration: string;
  description: string;
  image: string;

  createdAt?: string;

  provider?: Provider;
};

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
  const [services, setServices] = useState<Service[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("All");

  const [sortBy, setSortBy] = useState("newest");

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  /* Increment to re-run the fetch (used by the retry buttons). */
  const [reloadKey, setReloadKey] = useState(0);

  /* =========================================================
     GET CURRENT USER
  ========================================================= */

  useEffect(() => {
    const userId = getStoredUserId();

    setCurrentUserId(userId);
  }, []);

  /* =========================================================
     FETCH SERVICES
     GET /provider/approved-services (Bearer token)
  ========================================================= */

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError("");

        const token = sessionStorage.getItem("servicely_token");

        if (!token) {
          setError("Please log in to browse services.");

          return;
        }

        const response = await fetch(
          `${API_URL}/provider/approved-services`,
          {
            method: "GET",

            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Failed to fetch services."
          );
        }

        setServices(result.services || []);
      } catch (error) {
        console.error("Fetch customer services error:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load services."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [reloadKey]);

  const retry = () => setReloadKey((key) => key + 1);

  /* =========================================================
     REMOVE CURRENT USER'S OWN SERVICES
  ========================================================= */

  const servicesFromOtherUsers = useMemo(() => {
    if (!currentUserId) {
      return services;
    }

    return services.filter((service) => {
      const providerId = service.provider?._id;

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
      result.sort((a, b) => a.price - b.price);
    }

    if (sortBy === "price-high") {
      result.sort((a, b) => b.price - a.price);
    }

    if (sortBy === "name") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (sortBy === "newest") {
      result.sort((a, b) => {
        const dateA = a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;

        const dateB = b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;

        return dateB - dateA;
      });
    }

    /* GROUP SERVICES BY PROVIDER */
    const providerMap = new Map<string, DisplayService>();

    result.forEach((service) => {
      /*
       * If provider ID exists, use it.
       *
       * If for some reason the backend doesn't
       * populate provider, fall back to service ID
       * so the service is still displayed.
       */
      const providerKey =
        service.provider?._id || `service-${service._id}`;

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
     CLEAR FILTERS
  ========================================================= */

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setSortBy("newest");
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
      />

      {/* =====================================================
          PROMINENT SEARCH + CATEGORY CHIPS
      ===================================================== */}

      <section
        aria-label="Search and filter services"
        className="mb-5 overflow-hidden rounded-2xl border border-slate-200/70 shadow-card dark:border-ink-800"
      >
        {/* Brand banner */}
        <div className="flex flex-col gap-4 bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:from-brand-700 dark:via-brand-600 dark:to-brand-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
                <Sparkles className="h-4 w-4 text-white dark:text-white" />
              </span>

              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80 dark:text-white/80">
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
            <p className="text-2xl font-bold leading-none text-white">
              {loading ? "—" : totalMatchingServices}
            </p>

            <p className="text-xs font-medium text-white/80 sm:mt-1">
              {loading ? "loading services" : countLabel}
            </p>
          </div>
        </div>

        {/* Search + chips panel */}
        <div className="space-y-4 bg-white p-4 sm:p-5 dark:bg-ink-900">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search services, categories or providers..."
            className="w-full sm:flex-1"
          />

          <div
            role="group"
            aria-label="Filter by category"
            className="flex flex-wrap gap-2"
          >
            {categoryOptions.map((category) => {
              const active = selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                    active
                      ? "bg-brand-600 text-white shadow-soft dark:bg-brand-500 dark:text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-lavender hover:text-brand-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700 dark:hover:text-ink-100"
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          RESULTS TOOLBAR
      ===================================================== */}

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

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <label
            htmlFor="browse-sort"
            className="text-xs text-slate-500 dark:text-ink-400"
          >
            Sort by
          </label>

          <select
            id="browse-sort"
            value={sortBy}
            aria-label="Sort services"
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-brand-500 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              icon={X}
              aria-label="Clear all filters"
              onClick={clearFilters}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* =====================================================
          LOADING SKELETONS
      ===================================================== */}

      {loading && (
        <div
          aria-busy="true"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <span className="sr-only">Loading services…</span>

          {Array.from({ length: 8 }).map((_, index) => (
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
                  <Skeleton className="h-7 w-24 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =====================================================
          ERROR
      ===================================================== */}

      {!loading && error && (
        <ErrorState message={error} onRetry={retry} />
      )}

      {/* =====================================================
          EMPTY
      ===================================================== */}

      {!loading && !error && filteredServices.length === 0 && (
        <EmptyState
          icon={Search}
          title="No services found"
          description={
            hasActiveFilters
              ? "We couldn't find any services matching your search or filters."
              : "There are no services available right now. Please check back soon."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" icon={X} onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button variant="outline" icon={RefreshCw} onClick={retry}>
                Refresh
              </Button>
            )
          }
        />
      )}

      {/* =====================================================
          SERVICES (grouped by provider)
      ===================================================== */}

      {!loading && !error && filteredServices.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredServices.map((group, index) => {
            const providerId = group.provider?._id;

            const providerLabel =
              group.provider?.fullName ||
              group.provider?.name ||
              "provider";

            const providerServices = servicesFromOtherUsers.filter(
              (candidate) =>
                candidate.provider?._id === group.provider?._id
            );

            return (
              <motion.div
                key={
                  providerId
                    ? `provider-${providerId}`
                    : `service-${group._id}`
                }
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: Math.min(index * 0.05, 0.4),
                  ease: "easeOut",
                }}
                className="relative"
              >
                <ServiceCard
                  service={group}
                  action={
                    providerId ? (
                      <div className="flex flex-col items-end gap-1">
                        <Link
                          to={`/book/${providerId}?service=${group._id}`}
                          aria-label={`Book Now: ${group.title} with ${providerLabel}`}
                          className="btn-primary btn-sm whitespace-nowrap"
                        >
                          Book Now
                        </Link>

                        <Link
                          to={`/providers/${providerId}`}
                          state={{ providerServices }}
                          className="text-[11px] font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
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
                  <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-brand-700 shadow-sm backdrop-blur dark:bg-ink-900/90 dark:text-brand-300">
                    +{group.additionalServicesCount} more
                    <span className="sr-only">
                      {" "}
                      services from this provider
                    </span>
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
