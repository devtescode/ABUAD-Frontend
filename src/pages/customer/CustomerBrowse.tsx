
import { useEffect, useMemo, useState } from "react";
import {
  DashboardLayout,
  DashboardHeader,
} from "@/components/DashboardLayout";
import { customerNavItems } from "@/data/customerNavItems";
import { CustomerServiceCard } from "@/components/CustomerServiceCard";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Sparkles,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

/* =========================================================
   TYPES
========================================================= */

interface Provider {
  _id?: string;
  fullName?: string;
  name?: string;
  avatar?: string;
  profileImage?: string;
}

interface Service {
  _id: string;
  title: string;
  category: string;
  price: number;
  duration: string;
  description: string;
  image: string;

  createdAt?: string;

  provider?: Provider;
}

interface DisplayService extends Service {
  providerServiceCount: number;
  additionalServicesCount: number;
}

interface LoggedInUser {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  role?: string;
}

const categories = [
  "All",
  "Photography",
  "Videography",
  "Graphic Design",
  "Makeup",
];

/* =========================================================
   HELPERS
========================================================= */

const getStoredUserId = (): string | null => {
  try {
    const storedUser =
      sessionStorage.getItem(
        "servicely_user"
      );

    if (!storedUser) {
      return null;
    }

    const user: LoggedInUser =
      JSON.parse(storedUser);

    return user._id || user.id || null;
  } catch (error) {
    console.error(
      "Failed to read logged-in user:",
      error
    );

    return null;
  }
};

/* =========================================================
   COMPONENT
========================================================= */

export function CustomerBrowse() {
  const [services, setServices] =
    useState<Service[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [sortBy, setSortBy] =
    useState("newest");

  const [showFilters, setShowFilters] =
    useState(false);

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  /* =========================================================
     GET CURRENT USER
  ========================================================= */

  useEffect(() => {
    const userId = getStoredUserId();

    setCurrentUserId(userId);
  }, []);

  /* =========================================================
     FETCH SERVICES
  ========================================================= */

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          sessionStorage.getItem(
            "servicely_token"
          );

        if (!token) {
          setError(
            "Please log in to browse services."
          );

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

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Failed to fetch services."
          );
        }

        setServices(
          result.services || []
        );
      } catch (error) {
        console.error(
          "Fetch customer services error:",
          error
        );

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
  }, []);

  /* =========================================================
     REMOVE CURRENT USER'S OWN SERVICES
  ========================================================= */

  const servicesFromOtherUsers = useMemo(() => {
    if (!currentUserId) {
      return services;
    }

    return services.filter((service) => {
      const providerId =
        service.provider?._id;

      if (!providerId) {
        return true;
      }

      return providerId !== currentUserId;
    });
  }, [services, currentUserId]);

  /* =========================================================
     FILTER + SEARCH + GROUP BY PROVIDER
  ========================================================= */

  const filteredServices =
    useMemo(() => {
      let result = [
        ...servicesFromOtherUsers,
      ];

      /* -----------------------------------------------------
         SEARCH
      ----------------------------------------------------- */

      const searchValue =
        search.trim().toLowerCase();

      if (searchValue) {
        result = result.filter(
          (service) => {
            const title =
              service.title?.toLowerCase() ||
              "";

            const description =
              service.description?.toLowerCase() ||
              "";

            const category =
              service.category?.toLowerCase() ||
              "";

            const providerName =
              service.provider?.fullName?.toLowerCase() ||
              service.provider?.name?.toLowerCase() ||
              "";

            return (
              title.includes(
                searchValue
              ) ||
              description.includes(
                searchValue
              ) ||
              category.includes(
                searchValue
              ) ||
              providerName.includes(
                searchValue
              )
            );
          }
        );
      }

      /* -----------------------------------------------------
         CATEGORY
      ----------------------------------------------------- */

      if (
        selectedCategory !== "All"
      ) {
        result = result.filter(
          (service) =>
            service.category ===
            selectedCategory
        );
      }

      /* -----------------------------------------------------
         SORT SERVICES BEFORE GROUPING
      ----------------------------------------------------- */

      if (sortBy === "price-low") {
        result.sort(
          (a, b) =>
            a.price - b.price
        );
      }

      if (sortBy === "price-high") {
        result.sort(
          (a, b) =>
            b.price - a.price
        );
      }

      if (sortBy === "name") {
        result.sort((a, b) =>
          a.title.localeCompare(
            b.title
          )
        );
      }

      if (sortBy === "newest") {
        result.sort((a, b) => {
          const dateA = a.createdAt
            ? new Date(
                a.createdAt
              ).getTime()
            : 0;

          const dateB = b.createdAt
            ? new Date(
                b.createdAt
              ).getTime()
            : 0;

          return dateB - dateA;
        });
      }

      /* -----------------------------------------------------
         GROUP SERVICES BY PROVIDER
      ----------------------------------------------------- */

      const providerMap =
        new Map<
          string,
          DisplayService
        >();

      result.forEach((service) => {
        /*
         * If provider ID exists, use it.
         *
         * If for some reason the backend doesn't
         * populate provider, fall back to service ID
         * so the service is still displayed.
         */
        const providerId =
          service.provider?._id ||
          `service-${service._id}`;

        const existing =
          providerMap.get(
            providerId
          );

        if (!existing) {
          providerMap.set(
            providerId,
            {
              ...service,
              providerServiceCount: 1,
              additionalServicesCount: 0,
            }
          );
        } else {
          /*
           * Same provider has another service.
           */
          existing.providerServiceCount += 1;

          existing.additionalServicesCount =
            existing.providerServiceCount -
            1;
        }
      });

      return Array.from(
        providerMap.values()
      );
    }, [
      servicesFromOtherUsers,
      search,
      selectedCategory,
      sortBy,
    ]);

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

  /* =========================================================
     TOTAL SERVICE COUNT
  ========================================================= */

  const totalMatchingServices =
    useMemo(() => {
      let result = [
        ...servicesFromOtherUsers,
      ];

      const searchValue =
        search.trim().toLowerCase();

      if (searchValue) {
        result = result.filter(
          (service) => {
            const title =
              service.title?.toLowerCase() ||
              "";

            const description =
              service.description?.toLowerCase() ||
              "";

            const category =
              service.category?.toLowerCase() ||
              "";

            const providerName =
              service.provider?.fullName?.toLowerCase() ||
              service.provider?.name?.toLowerCase() ||
              "";

            return (
              title.includes(
                searchValue
              ) ||
              description.includes(
                searchValue
              ) ||
              category.includes(
                searchValue
              ) ||
              providerName.includes(
                searchValue
              )
            );
          }
        );
      }

      if (
        selectedCategory !== "All"
      ) {
        result = result.filter(
          (service) =>
            service.category ===
            selectedCategory
        );
      }

      return result.length;
    }, [
      servicesFromOtherUsers,
      search,
      selectedCategory,
    ]);

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
          HERO SEARCH AREA
      ===================================================== */}

      <div className="mb-7 overflow-hidden rounded-2xl border border-ink-100 bg-gradient-to-br from-ink-50 via-white to-ink-50 p-5 dark:border-ink-800 dark:from-ink-900 dark:via-ink-900 dark:to-ink-800 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 text-white dark:bg-white dark:text-ink-900">
                <Sparkles className="h-4 w-4" />
              </div>

              <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                Servicely Marketplace
              </span>
            </div>

            <h2 className="text-xl font-bold text-ink-900 dark:text-white sm:text-2xl">
              Find the right service for
              you
            </h2>

            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              Browse services offered by
              ABUAD providers.
            </p>
          </div>

          <div className="text-left lg:text-right">
            <p className="text-2xl font-bold text-ink-900 dark:text-white">
              {totalMatchingServices}
            </p>

            <p className="text-xs text-ink-400">
              {totalMatchingServices ===
              1
                ? "service available"
                : "services available"}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search services, categories or providers..."
              className="w-full rounded-xl border border-ink-200 bg-white py-3 pl-11 pr-10 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-ink-900 focus:ring-4 focus:ring-ink-900/5 dark:border-ink-700 dark:bg-ink-800 dark:text-white dark:focus:border-white"
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-900 dark:hover:bg-ink-700 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Mobile filter */}
          <button
            type="button"
            onClick={() =>
              setShowFilters(
                !showFilters
              )
            }
            className="flex items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm font-semibold text-ink-700 transition hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:bg-ink-700 sm:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />

            Filters
          </button>
        </div>
      </div>

      {/* =====================================================
          FILTER BAR
      ===================================================== */}

      <div
        className={`mb-7 ${
          showFilters
            ? "block"
            : "hidden"
        } sm:block`}
      >
        <div className="flex flex-col gap-4 rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900 sm:flex-row sm:items-center sm:justify-between">

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map(
              (category) => {
                const active =
                  selectedCategory ===
                  category;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() =>
                      setSelectedCategory(
                        category
                      )
                    }
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                      active
                        ? "bg-ink-900 text-white shadow-sm dark:bg-white dark:text-ink-900"
                        : "bg-ink-50 text-ink-600 hover:bg-ink-100 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700"
                    }`}
                  >
                    {category}
                  </button>
                );
              }
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-xs text-ink-400">
              Sort by
            </span>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value
                  )
                }
                className="appearance-none rounded-xl border border-ink-200 bg-white py-2 pl-3 pr-9 text-xs font-semibold text-ink-700 outline-none transition focus:border-ink-900 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              >
                <option value="newest">
                  Newest
                </option>

                <option value="price-low">
                  Price: Low to High
                </option>

                <option value="price-high">
                  Price: High to Low
                </option>

                <option value="name">
                  Name
                </option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600"
              >
                <X className="h-3.5 w-3.5" />

                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[
            1, 2, 3, 4, 5, 6, 7, 8,
          ].map((item) => (
            <div
              key={item}
              className="overflow-hidden rounded-2xl border border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900"
            >
              <div className="h-52 animate-pulse bg-ink-100 dark:bg-ink-800" />

              <div className="space-y-3 p-5">
                <div className="h-4 w-3/4 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />

                <div className="h-3 w-full animate-pulse rounded bg-ink-100 dark:bg-ink-800" />

                <div className="h-3 w-2/3 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />

                <div className="h-10 animate-pulse rounded-xl bg-ink-100 dark:bg-ink-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =====================================================
          ERROR
      ===================================================== */}

      {!loading && error && (
        <div className="flex min-h-[350px] items-center justify-center">
          <div className="max-w-sm text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/10">
              <X className="h-5 w-5" />
            </div>

            <h3 className="mt-4 text-base font-semibold text-ink-900 dark:text-white">
              Unable to load services
            </h3>

            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="btn-primary btn-sm mt-4"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          EMPTY
      ===================================================== */}

      {!loading &&
        !error &&
        filteredServices.length ===
          0 && (
          <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-dashed border-ink-200 dark:border-ink-800">
            <div className="max-w-sm px-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300">
                <Search className="h-6 w-6" />
              </div>

              <h3 className="mt-4 text-lg font-semibold text-ink-900 dark:text-white">
                No services found
              </h3>

              <p className="mt-1 text-sm leading-6 text-ink-500 dark:text-ink-400">
                We couldn't find any
                services matching your
                search or filters.
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="mt-4 text-sm font-semibold text-ink-900 underline underline-offset-4 dark:text-white"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}

      {/* =====================================================
          SERVICES
      ===================================================== */}

      {!loading &&
        !error &&
        filteredServices.length >
          0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredServices.map(
              (service) => (
                <CustomerServiceCard
                  key={service._id}
                  service={service}
                  additionalServicesCount={
                    service.additionalServicesCount
                  }
                />
              )
            )}
          </div>
        )}
    </DashboardLayout>
  );
}
