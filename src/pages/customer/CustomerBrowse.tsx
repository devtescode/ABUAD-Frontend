import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AppContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { customerNavItems } from "@/data/customerNavItems";
import { categories as staticCategories } from "@/data/mockData";
import {
  Button,
  EmptyState,
  ErrorState,
  Skeleton,
  cn,
  providerId as getProviderIdFromLike,
  providerName as getProviderNameFromLike,
  type ServiceLike,
} from "@/components/ui";
import { getApiErrorMessage } from "@/lib/api";
import { useApprovedServices } from "@/hooks/queries";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HeroSearch } from "./browse/HeroSearch";
import { CategoryChips } from "./browse/CategoryChips";
import { ViewToggle, type BrowseView } from "./browse/ViewToggle";
import { ServiceGridCard } from "./browse/ServiceGridCard";
import { ServiceListRow } from "./browse/ServiceListRow";

/* =========================================================
   TYPES
========================================================= */

type Service = ServiceLike;

type DisplayService = Service & {
  providerServiceCount: number;
  additionalServicesCount: number;
  providerServices: Service[];
};

type LoggedInUser = {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  role?: string;
};

const PAGE_SIZE = 4;

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price low to high" },
  { value: "price-high", label: "Price high to low" },
  { value: "name", label: "Name A-Z" },
] as const;

type SortValue = (typeof sortOptions)[number]["value"];

const TRENDING = [
  { label: "Trending: AC repair", query: "AC repair" },
  { label: "Home cleaning", query: "Home cleaning" },
  { label: "Braiding", query: "Braiding" },
];

const HERO_NAV = [
  { label: "Dashboard", to: "/customer" },
  { label: "Browse Services", to: "/customer/browse", active: true },
  { label: "My Bookings", to: "/customer/bookings" },
  { label: "Messages", to: "/customer/messages" },
];

/* =========================================================
   HELPERS
========================================================= */

function getStoredUserId(): string | null {
  try {
    const storedUser = sessionStorage.getItem("servicely_user");
    if (!storedUser) return null;
    const user: LoggedInUser = JSON.parse(storedUser);
    return user._id || user.id || null;
  } catch {
    return null;
  }
}

function getServiceProviderId(service: Service): string {
  return service.provider ? getProviderIdFromLike(service.provider) : "";
}

function getServiceId(service: Service): string {
  return String(service._id || service.id || "").trim();
}

function getServiceKey(service: Service, index: number): string {
  return getServiceId(service) || `service-${index}`;
}

function normalizeCategory(value: string): string {
  return value.trim().toLowerCase();
}

function getCreatedAtTime(service: Service): number {
  const value = service.createdAt;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
  }
  return 0;
}

function getPriceValue(service: Service): number | null {
  return typeof service.price === "number" && Number.isFinite(service.price)
    ? service.price
    : null;
}

function matchesSearch(service: Service, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;

  const title = (service.title || "").toLowerCase();
  const description = (service.description || "").toLowerCase();
  const category = (service.category || "").toLowerCase();
  const providerName = service.provider
    ? getProviderNameFromLike(service.provider).toLowerCase()
    : "";

  return (
    title.includes(query) ||
    description.includes(query) ||
    category.includes(query) ||
    providerName.includes(query)
  );
}

function compareServices(a: Service, b: Service, sortBy: SortValue): number {
  if (sortBy === "price-low") {
    const ap = getPriceValue(a);
    const bp = getPriceValue(b);
    const av = ap ?? Number.POSITIVE_INFINITY;
    const bv = bp ?? Number.POSITIVE_INFINITY;
    if (av !== bv) return av - bv;
  }

  if (sortBy === "price-high") {
    const ap = getPriceValue(a);
    const bp = getPriceValue(b);
    const av = ap ?? Number.NEGATIVE_INFINITY;
    const bv = bp ?? Number.NEGATIVE_INFINITY;
    if (av !== bv) return bv - av;
  }

  if (sortBy === "name") {
    return (a.title || "").localeCompare(b.title || "");
  }

  // newest (default)
  return getCreatedAtTime(b) - getCreatedAtTime(a);
}

function parsePositiveInt(value: string | null): number {
  if (!value) return 1;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function isSortValue(value: string | null): value is SortValue {
  return sortOptions.some((option) => option.value === value);
}

function isViewValue(value: string | null): value is BrowseView {
  return value === "grid" || value === "list";
}

function getPageNumbers(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("ellipsis");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

/* =========================================================
   COMPONENT
========================================================= */

export function CustomerBrowse() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch, isFetching } =
    useApprovedServices();

  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = (searchParams.get("q") ?? searchParams.get("search") ?? "").trim();

  const [search, setSearch] = useState(initialSearch);

  const selectedCategoryParam = searchParams.get("category") ?? "All";
  const selectedCategory = selectedCategoryParam.trim() || "All";
  const sortParam = searchParams.get("sort");
  const sortBy: SortValue = isSortValue(sortParam) ? sortParam : "newest";
  const requestedPage = parsePositiveInt(searchParams.get("page"));
  const viewParam = searchParams.get("view");
  const view: BrowseView = isViewValue(viewParam) ? viewParam : "grid";

  // Keep local search input in sync with URL-driven navigation (e.g. dashboard links/back-forward).
  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  const updateParams = useCallback(
    (
      updates: Record<string, string | null>,
      options?: { replace?: boolean }
    ) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(updates)) {
        if (value == null || value === "") next.delete(key);
        else next.set(key, value);
      }
      setSearchParams(next, { replace: options?.replace ?? true });
    },
    [searchParams, setSearchParams]
  );

  const setSelectedCategory = useCallback(
    (category: string) => {
      updateParams(
        { category: category === "All" ? null : category, page: "1" },
        { replace: true }
      );
    },
    [updateParams]
  );

  const setSortBy = useCallback(
    (value: SortValue) => {
      updateParams(
        { sort: value === "newest" ? null : value, page: "1" },
        { replace: true }
      );
    },
    [updateParams]
  );

  const setView = useCallback(
    (value: BrowseView) => {
      updateParams({ view: value === "grid" ? null : value }, { replace: true });
    },
    [updateParams]
  );

  const setPageInUrl = useCallback(
    (page: number) => {
      const safe = Number.isFinite(page) && page > 1 ? String(Math.floor(page)) : "1";
      updateParams({ page: safe === "1" ? null : safe }, { replace: true });
    },
    [updateParams]
  );

  const submitSearch = useCallback(() => {
    const trimmed = search.trim();
    setSearch(trimmed);
    updateParams(
      { q: trimmed || null, search: null, page: "1" },
      { replace: true }
    );
  }, [search, updateParams]);

  const applyTrendingSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      setSearch(trimmed);
      updateParams(
        { q: trimmed || null, search: null, page: "1" },
        { replace: true }
      );
    },
    [updateParams]
  );

  const clearFilters = useCallback(() => {
    setSearch("");
    const next = new URLSearchParams(searchParams);
    next.delete("q");
    next.delete("search");
    next.delete("category");
    next.delete("sort");
    next.delete("page");
    // preserve view choice
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const [currentUserId] = useState<string | null>(() => getStoredUserId());

  const services = useMemo<Service[]>(
    () => (Array.isArray(data) ? data : []),
    [data]
  );

  const servicesFromOtherUsers = useMemo(() => {
    if (!currentUserId) return services;
    return services.filter((service) => {
      const providerId = getServiceProviderId(service);
      if (!providerId) return true;
      return providerId !== currentUserId;
    });
  }, [services, currentUserId]);

  const providerServicesMap = useMemo(() => {
    const map = new Map<string, Service[]>();
    servicesFromOtherUsers.forEach((service) => {
      const providerId = getServiceProviderId(service);
      if (!providerId) return;
      const existing = map.get(providerId);
      if (existing) existing.push(service);
      else map.set(providerId, [service]);
    });
    return map;
  }, [servicesFromOtherUsers]);

  /* =========================================================
     SEARCH + CATEGORY OPTIONS/COUNTS
  ========================================================= */

  const searchMatchedServices = useMemo(
    () => servicesFromOtherUsers.filter((service) => matchesSearch(service, search)),
    [servicesFromOtherUsers, search]
  );

  const categoryOptions = useMemo(() => {
    const labels = new Map<string, string>(); // normalized -> display label

    for (const category of staticCategories) {
      if (category?.name?.trim()) {
        const name = category.name.trim();
        labels.set(normalizeCategory(name), name);
      }
    }

    for (const service of servicesFromOtherUsers) {
      if (typeof service.category === "string" && service.category.trim()) {
        const name = service.category.trim();
        const key = normalizeCategory(name);
        if (!labels.has(key)) labels.set(key, name);
      }
    }

    return ["All", ...Array.from(labels.values()).sort((a, b) => a.localeCompare(b))];
  }, [servicesFromOtherUsers]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const service of searchMatchedServices) {
      if (typeof service.category !== "string" || !service.category.trim()) continue;
      const key = normalizeCategory(service.category);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [searchMatchedServices]);

  const categoryChipOptions = useMemo(
    () =>
      categoryOptions.map((name) => ({
        name,
        count:
          name === "All"
            ? searchMatchedServices.length
            : categoryCounts.get(normalizeCategory(name)) ?? 0,
      })),
    [categoryOptions, searchMatchedServices.length, categoryCounts]
  );

  // Normalize selected category if URL/data no longer contains it.
  useEffect(() => {
    if (selectedCategory === "All") return;
    const exists = categoryOptions.some(
      (option) => option !== "All" && normalizeCategory(option) === normalizeCategory(selectedCategory)
    );
    if (!exists) {
      updateParams({ category: null, page: "1" }, { replace: true });
    }
  }, [selectedCategory, categoryOptions, updateParams]);

  /* =========================================================
     MATCH + SORT + GROUP
  ========================================================= */

  const matchedServices = useMemo(() => {
    const selectedKey = normalizeCategory(selectedCategory);
    return searchMatchedServices.filter((service) => {
      if (selectedCategory === "All") return true;
      return normalizeCategory(service.category || "") === selectedKey;
    });
  }, [searchMatchedServices, selectedCategory]);

  const groupedProviders = useMemo(() => {
    const sorted = [...matchedServices].sort((a, b) => compareServices(a, b, sortBy));
    const map = new Map<string, DisplayService>();

    sorted.forEach((service, index) => {
      const providerId = getServiceProviderId(service);
      const providerKey = providerId || `service-${getServiceKey(service, index)}`;
      const existing = map.get(providerKey);

      if (!existing) {
        map.set(providerKey, {
          ...service,
          providerServiceCount: 1,
          additionalServicesCount: 0,
          providerServices: [service],
        });
        return;
      }

      existing.providerServices.push(service);
      existing.providerServiceCount += 1;
      existing.additionalServicesCount = existing.providerServiceCount - 1;
    });

    return Array.from(map.values());
  }, [matchedServices, sortBy]);

  const totalPages = Math.max(1, Math.ceil(groupedProviders.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);

  useEffect(() => {
    if (groupedProviders.length === 0) return;
    if (requestedPage !== currentPage) {
      setPageInUrl(currentPage);
    }
  }, [requestedPage, currentPage, groupedProviders.length, setPageInUrl]);

  const paginatedServices = useMemo(
    () =>
      groupedProviders.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [groupedProviders, currentPage]
  );

  const totalMatchingServices = matchedServices.length;
  const hasActiveFilters =
    search.trim() !== "" || selectedCategory !== "All" || sortBy !== "newest";

  const errorMessage = getApiErrorMessage(error) ||
    "We couldn't load the service catalogue. Please try again.";

  const refresh = () => {
    void refetch();
  };

  const goToPage = (page: number) => {
    const next = Math.min(Math.max(page, 1), totalPages);
    setPageInUrl(next);
  };

  const pageNumbers = useMemo(
    () => getPageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  );

  const avatarUrl = user?.avatar;
  const avatarInitial = (user?.name || "U").charAt(0).toUpperCase();

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <DashboardLayout role="customer" navItems={customerNavItems}>
      <div className="-mx-4 -mt-6 min-h-[calc(100vh-4rem)] bg-[#F4F3EE] px-4 pb-10 dark:bg-ink-950 sm:-mx-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8">
        {/* HERO */}
        <section
          aria-label="Browse hero"
          className="-mx-4 overflow-hidden rounded-b-[40px] bg-[#0E2B25] px-4 pb-10 pt-5 text-white dark:bg-ink-900 dark:ring-1 dark:ring-ink-800 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        >
          <div className="mx-auto w-full max-w-6xl">
            {/* <div className="flex items-center justify-between gap-4">
              <Link
                to="/"
                className="shrink-0 text-[28px] font-bold tracking-tight text-[#C6F36B]"
                style={{ fontFamily: '"Space Grotesk", Inter, sans-serif' }}
                aria-label="Servicely home"
              >
                Servicely
              </Link>

              <nav
                aria-label="Browse navigation"
                className="hidden items-center gap-1 rounded-full bg-[#143d35] p-1 ring-1 ring-white/10 max-[760px]:hidden md:flex"
              >
                {HERO_NAV.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    aria-current={item.active ? "page" : undefined}
                    className={cn(
                      "inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6F36B]",
                      item.active
                        ? "bg-[#1B4238] text-white shadow-[inset_0_0_0_1px_rgba(198,243,107,0.18)]"
                        : "text-[#CFE6DC] hover:bg-[#1B4238]/70 hover:text-white"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1B4238] text-sm font-bold text-[#C6F36B] ring-1 ring-[#C6F36B]/30"
                aria-label={user?.name ? `${user.name} account` : "Account"}
                title={user?.name || "Account"}
                style={{ fontFamily: '"Space Grotesk", Inter, sans-serif' }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span aria-hidden="true">{avatarInitial}</span>
                )}
              </div>
            </div> */}

            {/* <nav
              aria-label="Browse navigation mobile"
              className="mt-4 hidden flex-wrap gap-2 max-[760px]:flex"
            >
              {HERO_NAV.map((item) => (
                <Link
                  key={`m-${item.label}`}
                  to={item.to}
                  aria-current={item.active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-[44px] items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors",
                    item.active
                      ? "bg-[#1B4238] text-white"
                      : "bg-[#143d35] text-[#CFE6DC] hover:bg-[#1B4238]"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav> */}

            <div className="mx-auto mt-10 max-w-4xl text-center sm:mt-14">
              <h1
                className="text-balance text-[38px] font-bold leading-[1.05] tracking-tight text-white sm:text-[46px] lg:text-[52px]"
                style={{ fontFamily: '"Space Grotesk", Inter, sans-serif' }}
              >
                Book trusted help, <span className="text-[#C6F36B]">today.</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#B9D6CA] sm:text-lg">
                Browse approved providers, compare services and book in a few taps.
              </p>

              <HeroSearch
                value={search}
                onChange={setSearch}
                onSubmit={submitSearch}
                onSelectTrending={applyTrendingSearch}
                // trending={TRENDING}
                className="mt-8"
              />
            </div>
          </div>
        </section>

        <div className="mx-auto mt-8 w-full max-w-6xl space-y-6">
          {/* CATEGORY CHIPS */}
          {!isLoading && !isError && (
            <section aria-label="Category filters">
              <CategoryChips
                options={categoryChipOptions}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </section>
          )}

          {/* TOOLBAR */}
          {!isLoading && !isError && (
            <section
              aria-label="Results toolbar"
              className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p
                aria-live="polite"
                className="text-sm font-medium text-[#59625E] dark:text-ink-400"
              >
                <span
                  className="font-bold text-[#0E1A17] dark:text-ink-50"
                  style={{ fontFamily: '"Space Grotesk", Inter, sans-serif' }}
                >
                  {totalMatchingServices}
                </span>{" "}
                services in this view
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2">
                  <span className="sr-only">Sort services</span>
                  <select
                    value={sortBy}
                    aria-label="Sort services"
                    onChange={(event) => {
                      const value = event.target.value;
                      if (isSortValue(value)) setSortBy(value);
                    }}
                    className="h-11 min-w-[190px] rounded-full border border-[#E4E6E0] bg-white px-4 pr-9 text-sm font-medium text-[#0E1A17] outline-none transition focus:border-[#0E2B25] focus:ring-2 focus:ring-[#0E2B25]/10 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-50 dark:focus:border-ink-600 dark:focus:ring-brand-500/20"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <ViewToggle value={view} onChange={setView} />
              </div>
            </section>
          )}

          {/* LOADING */}
          {isLoading && (
            <section aria-label="Loading services" aria-busy="true">
              <span className="sr-only">Loading services…</span>
              {view === "grid" ? (
                <div className="grid grid-cols-1 gap-6 sm:[grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="overflow-hidden rounded-[24px] border border-[#E4E6E0] bg-white dark:border-ink-800 dark:bg-ink-900"
                      aria-hidden="true"
                    >
                      <div className="h-[150px] animate-pulse bg-[#E9ECE6] dark:bg-ink-800" />
                      <div className="space-y-3 p-5">
                        <Skeleton className="h-5 w-3/4 rounded-lg bg-[#E9ECE6] dark:bg-ink-800" />
                        <Skeleton className="h-4 w-full rounded-lg bg-[#E9ECE6] dark:bg-ink-800" />
                        <Skeleton className="h-4 w-5/6 rounded-lg bg-[#E9ECE6] dark:bg-ink-800" />
                        <div className="flex items-center gap-2 pt-1">
                          <Skeleton className="h-9 w-9 rounded-full bg-[#E9ECE6] dark:bg-ink-800" />
                          <Skeleton className="h-4 w-1/3 rounded-lg bg-[#E9ECE6] dark:bg-ink-800" />
                        </div>
                        <div className="flex items-center justify-between border-t border-[#E4E6E0] pt-4 dark:border-ink-800">
                          <Skeleton className="h-8 w-24 rounded-lg bg-[#E9ECE6] dark:bg-ink-800" />
                          <div className="flex gap-2">
                            <Skeleton className="h-11 w-20 rounded-full bg-[#E9ECE6] dark:bg-ink-800" />
                            <Skeleton className="h-11 w-24 rounded-full bg-[#E9ECE6] dark:bg-ink-800" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex flex-col overflow-hidden rounded-[24px] border border-[#E4E6E0] bg-white dark:border-ink-800 dark:bg-ink-900 md:flex-row"
                      aria-hidden="true"
                    >
                      <div className="h-[180px] w-full animate-pulse bg-[#E9ECE6] dark:bg-ink-800 md:h-auto md:min-h-[220px] md:w-[190px]" />
                      <div className="flex flex-1 flex-col gap-4 p-5 md:flex-row md:justify-between md:p-6">
                        <div className="flex-1 space-y-3">
                          <div className="flex gap-2">
                            <Skeleton className="h-7 w-24 rounded-full bg-[#E9ECE6] dark:bg-ink-800" />
                            <Skeleton className="h-7 w-20 rounded-full bg-[#E9ECE6] dark:bg-ink-800" />
                          </div>
                          <Skeleton className="h-6 w-2/3 rounded-lg bg-[#E9ECE6] dark:bg-ink-800" />
                          <Skeleton className="h-4 w-full max-w-xl rounded-lg bg-[#E9ECE6] dark:bg-ink-800" />
                          <Skeleton className="h-4 w-4/5 max-w-lg rounded-lg bg-[#E9ECE6] dark:bg-ink-800" />
                          <div className="flex items-center gap-2 pt-1">
                            <Skeleton className="h-9 w-9 rounded-full bg-[#E9ECE6] dark:bg-ink-800" />
                            <Skeleton className="h-4 w-32 rounded-lg bg-[#E9ECE6] dark:bg-ink-800" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 border-t border-[#E4E6E0] pt-4 dark:border-ink-800 md:w-[220px] md:items-end md:border-t-0 md:pt-0">
                          <Skeleton className="h-8 w-28 rounded-lg bg-[#E9ECE6] dark:bg-ink-800" />
                          <div className="flex gap-2 md:justify-end">
                            <Skeleton className="h-11 w-24 rounded-full bg-[#E9ECE6] dark:bg-ink-800" />
                            <Skeleton className="h-11 w-28 rounded-full bg-[#E9ECE6] dark:bg-ink-800" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ERROR */}
          {!isLoading && isError && (
            <ErrorState
              message={errorMessage}
              onRetry={refresh}
              className="rounded-[24px] border-[#F3D6D6] bg-white dark:border-red-900/40 dark:bg-ink-900"
            />
          )}

          {/* EMPTY */}
          {!isLoading && !isError && groupedProviders.length === 0 && (
            <EmptyState
              title="No services match"
              description={
                hasActiveFilters
                  ? "Try a different search or clear the category filter"
                  : "There are no approved services to browse right now. Please check back soon."
              }
              action={
                hasActiveFilters ? (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="h-11 rounded-full border-[#0E2B25] bg-white px-5 text-[#0E2B25] hover:bg-[#F4F3EE] dark:border-[#C6F36B] dark:bg-transparent dark:text-[#C6F36B] dark:hover:bg-ink-800"
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={refresh}
                    loading={isFetching}
                    className="h-11 rounded-full border-[#0E2B25] bg-white px-5 text-[#0E2B25] hover:bg-[#F4F3EE] dark:border-[#C6F36B] dark:bg-transparent dark:text-[#C6F36B] dark:hover:bg-ink-800"
                  >
                    Refresh
                  </Button>
                )
              }
              className="rounded-[24px] border-[#E4E6E0] bg-white py-14 text-[#0E1A17] dark:border-ink-800 dark:bg-ink-900 dark:text-ink-50 sm:py-16"
            />
          )}

          {/* RESULTS */}
          {!isLoading && !isError && groupedProviders.length > 0 && (
            <section aria-label="Service results">
              {view === "grid" ? (
                <div
                  role="list"
                  className="grid grid-cols-1 gap-6 sm:[grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]"
                >
                  {paginatedServices.map((group, index) => {
                    const providerId = getServiceProviderId(group);
                    const serviceId = getServiceId(group);
                    const providerServicesForLink =
                      (providerId && providerServicesMap.get(providerId)) ||
                      group.providerServices ||
                      [group];
                    return (
                      <ServiceGridCard
                        key={
                          providerId
                            ? `provider-${providerId}`
                            : `service-${getServiceKey(group, index)}`
                        }
                        service={group}
                        index={index}
                        providerId={providerId}
                        serviceId={serviceId}
                        providerServicesForLink={providerServicesForLink}
                      />
                    );
                  })}
                </div>
              ) : (
                <div role="list" className="flex flex-col gap-6">
                  {paginatedServices.map((group, index) => {
                    const providerId = getServiceProviderId(group);
                    const serviceId = getServiceId(group);
                    const providerServicesForLink =
                      (providerId && providerServicesMap.get(providerId)) ||
                      group.providerServices ||
                      [group];
                    return (
                      <ServiceListRow
                        key={
                          providerId
                            ? `provider-${providerId}`
                            : `service-${getServiceKey(group, index)}`
                        }
                        service={group}
                        index={index}
                        providerId={providerId}
                        serviceId={serviceId}
                        providerServicesForLink={providerServicesForLink}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* PAGINATION */}
          {!isLoading && !isError && groupedProviders.length > 0 && totalPages > 1 && (
            <nav
              aria-label="Pagination"
              className="flex flex-wrap items-center justify-center gap-2 pt-2"
            >
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-full border border-[#E4E6E0] bg-white px-4 text-sm font-semibold text-[#0E1A17] transition-colors hover:border-[#0E2B25] hover:bg-[#F4F3EE] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E2B25] focus-visible:ring-offset-2 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-50 dark:hover:border-ink-700 dark:hover:bg-ink-800 dark:focus-visible:ring-brand-500 dark:focus-visible:ring-offset-ink-950"
              >
                <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
                Previous
              </button>

              {pageNumbers.map((page, idx) =>
                page === "ellipsis" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="inline-flex h-11 min-w-[44px] items-center justify-center px-1 text-sm font-medium text-[#59625E] dark:text-ink-400"
                    aria-hidden="true"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    onClick={() => goToPage(page)}
                    aria-label={`Page ${page}`}
                    aria-current={page === currentPage ? "page" : undefined}
                    className={cn(
                      "inline-flex h-11 min-w-[44px] items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E2B25] focus-visible:ring-offset-2 dark:focus-visible:ring-brand-500 dark:focus-visible:ring-offset-ink-950",
                      page === currentPage
                        ? "bg-[#0E2B25] text-white dark:bg-ink-50 dark:text-ink-950"
                        : "border border-[#E4E6E0] bg-white text-[#0E1A17] hover:border-[#0E2B25] hover:bg-[#F4F3EE] dark:border-ink-800 dark:bg-ink-900 dark:text-ink-50 dark:hover:border-ink-700 dark:hover:bg-ink-800"
                    )}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                aria-label="Next page"
                className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-full border border-[#E4E6E0] bg-white px-4 text-sm font-semibold text-[#0E1A17] transition-colors hover:border-[#0E2B25] hover:bg-[#F4F3EE] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E2B25] focus-visible:ring-offset-2 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-50 dark:hover:border-ink-700 dark:hover:bg-ink-800 dark:focus-visible:ring-brand-500 dark:focus-visible:ring-offset-ink-950"
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
              </button>
            </nav>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
