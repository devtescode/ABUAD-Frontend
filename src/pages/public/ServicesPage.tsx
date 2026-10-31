import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  RotateCcw,
  SearchX,
  SlidersHorizontal,
  Sparkles,
  Store,
  X,
} from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  ResponsiveModal,
  SearchBar,
  ServiceCard,
  SkeletonCard,
  cn,
  providerId,
} from '@/components/ui';
import { Footer, PublicNavbar, ProviderCard } from '@/components/shared';
import {
  categories as platformCategories,
  providers as mockProviders,
} from '@/data/mockData';
import { useApprovedServices } from '@/hooks/queries';
import { getApiErrorMessage } from '@/lib/api';

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

type ActiveFilter = {
  key: string;
  label: string;
  onRemove: () => void;
};

/* =========================================================
   PUBLIC SERVICES CATALOG (/services)

   Loads real approved services from the backend through the
   shared React Query hook. If the request fails, the page
   gracefully falls back to the public provider-browse
   experience it has always shown.
========================================================= */

export function ServicesPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(() => params.get('q') || '');
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, isError, error, refetch } = useApprovedServices();
  const services = useMemo(() => data ?? [], [data]);

  const selectedCategory = params.get('category') || '';
  const minPrice = Number(params.get('minPrice') || 0);
  const minRating = Number(params.get('minRating') || 0);
  const verifiedOnly = params.get('verified') === '1';

  /* ---------------------------------------------
     URL param helpers
  --------------------------------------------- */
  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const submitSearch = () => updateParam('q', search.trim());

  const clearFilters = () => {
    setSearch('');
    setParams(new URLSearchParams());
  };

  /* ---------------------------------------------
     Client-side filtering — live services
  --------------------------------------------- */
  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();
    const categorySlug = slugify(selectedCategory);

    return services.filter((service) => {
      const category =
        typeof service.category === 'string' ? service.category : '';

      if (categorySlug && slugify(category) !== categorySlug) return false;

      if (query) {
        const haystack = [
          service.title || '',
          category,
          service.description || '',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [services, search, selectedCategory]);

  /* ---------------------------------------------
     Category chips — derived from real data only
  --------------------------------------------- */
  const serviceChips = useMemo(() => {
    const names = new Set<string>();
    for (const service of services) {
      if (typeof service.category === 'string' && service.category.trim()) {
        names.add(service.category.trim());
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [services]);

  /* ---------------------------------------------
     Fallback: verified providers (public browse)
  --------------------------------------------- */
  const fallbackProviders = useMemo(() => {
    const query = search.trim().toLowerCase();
    const categorySlug = slugify(selectedCategory);

    return mockProviders.filter((p) => {
      if (p.status !== 'verified') return false;
      if (
        categorySlug &&
        !p.categories.some((c) => slugify(c) === categorySlug)
      )
        return false;
      if (minPrice && p.startingPrice < minPrice) return false;
      if (minRating && p.rating < minRating) return false;
      if (verifiedOnly && !p.verified) return false;
      if (
        query &&
        !p.name.toLowerCase().includes(query) &&
        !p.categories.some((c) => c.toLowerCase().includes(query))
      )
        return false;
      return true;
    });
  }, [selectedCategory, minPrice, minRating, verifiedOnly, search]);

  /* ---------------------------------------------
     Human-readable category label for chips
  --------------------------------------------- */
  const selectedCategoryLabel = useMemo(() => {
    if (!selectedCategory) return '';

    const platformCategory = platformCategories.find(
      (category) => slugify(category.name) === slugify(selectedCategory)
    );
    if (platformCategory) return platformCategory.name;

    return (
      serviceChips.find(
        (name) => slugify(name) === slugify(selectedCategory)
      ) || selectedCategory
    );
  }, [selectedCategory, serviceChips]);

  /* ---------------------------------------------
     Active filter chips
  --------------------------------------------- */
  const activeFilters: ActiveFilter[] = [];

  if (search.trim()) {
    activeFilters.push({
      key: 'q',
      label: `“${search.trim()}”`,
      onRemove: () => {
        setSearch('');
        updateParam('q', '');
      },
    });
  }

  if (selectedCategory) {
    activeFilters.push({
      key: 'category',
      label: selectedCategoryLabel || selectedCategory,
      onRemove: () => updateParam('category', ''),
    });
  }

  if (minRating) {
    activeFilters.push({
      key: 'minRating',
      label: `${minRating}+ rating`,
      onRemove: () => updateParam('minRating', ''),
    });
  }

  if (minPrice) {
    activeFilters.push({
      key: 'minPrice',
      label: `From ₦${minPrice.toLocaleString()}`,
      onRemove: () => updateParam('minPrice', ''),
    });
  }

  if (verifiedOnly) {
    activeFilters.push({
      key: 'verified',
      label: 'Verified only',
      onRemove: () => updateParam('verified', ''),
    });
  }

  const hasActiveFilters = activeFilters.length > 0;
  const resultCount = isError
    ? fallbackProviders.length
    : filteredServices.length;

  const filterPanel = (
    <FilterPanel
      selectedCategory={selectedCategory}
      minRating={minRating}
      minPrice={minPrice}
      verifiedOnly={verifiedOnly}
      onChange={updateParam}
    />
  );

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <PublicNavbar />

      {/* ============ Page header ============ */}
      <section className="border-b border-slate-200/70 bg-gradient-to-b from-lavender via-lavender/40 to-transparent dark:border-ink-800 dark:from-brand-950/50 dark:via-brand-950/10">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <Badge tone="brand" icon={Sparkles}>
              Service catalogue
            </Badge>
            <h1 className="mt-3 text-balance text-3xl font-bold tracking-tight text-slate-900 dark:text-ink-50 sm:text-4xl">
              Browse services
            </h1>
            <p className="mt-2 max-w-2xl text-slate-500 dark:text-ink-400">
              Discover services from verified providers across campus — compare
              portfolios, prices and reviews, then book with confidence.
            </p>
            <SearchBar
              className="mt-6 max-w-xl"
              value={search}
              onChange={setSearch}
              onSubmit={submitSearch}
              placeholder="Search services, categories or providers..."
            />
          </motion.div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {/* ============ Category chips ============ */}
        {!isLoading && !isError && serviceChips.length > 0 && (
          <div
            role="group"
            aria-label="Filter services by category"
            className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
          >
            <ChipButton
              active={!selectedCategory}
              onClick={() => updateParam('category', '')}
            >
              All
            </ChipButton>
            {serviceChips.map((name) => (
              <ChipButton
                key={name}
                active={slugify(name) === slugify(selectedCategory)}
                onClick={() => updateParam('category', slugify(name))}
              >
                {name}
              </ChipButton>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-6 lg:mt-6 lg:flex-row lg:gap-8">
          {/* ============ Desktop filters ============ */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="card sticky top-24 p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-ink-50">
                  Filters
                </h2>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </button>
                )}
              </div>
              {filterPanel}
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            {/* ============ Toolbar ============ */}
            {!isLoading && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p
                  aria-live="polite"
                  className="text-sm text-slate-500 dark:text-ink-400"
                >
                  {isError
                    ? `${fallbackProviders.length} ${
                        fallbackProviders.length === 1
                          ? 'provider'
                          : 'providers'
                      } found`
                    : `${filteredServices.length} ${
                        filteredServices.length === 1 ? 'service' : 'services'
                      } found`}
                </p>

                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={RotateCcw}
                      onClick={clearFilters}
                      className="hidden sm:inline-flex"
                    >
                      Clear all
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    icon={SlidersHorizontal}
                    onClick={() => setShowFilters(true)}
                    className="lg:hidden"
                  >
                    Filters
                    {hasActiveFilters && (
                      <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">
                        {activeFilters.length}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* ============ Active filter chips ============ */}
            {!isLoading && hasActiveFilters && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-ink-500">
                  Active
                </span>
                {activeFilters.map((filter) => (
                  <ActiveFilterChip
                    key={filter.key}
                    label={filter.label}
                    onRemove={filter.onRemove}
                  />
                ))}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* ============ Content ============ */}
            <div className="mt-4">
              {isLoading ? (
                <div
                  aria-busy="true"
                  className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
                >
                  <span className="sr-only" role="status">
                    Loading services…
                  </span>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : isError ? (
                /* -------- Inline error + public provider fallback -------- */
                <div className="space-y-8">
                  <ErrorState
                    message={`We couldn't load the live service catalogue right now. ${getApiErrorMessage(
                      error
                    )}`}
                    onRetry={() => refetch()}
                  />

                  <section aria-label="Provider directory">
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-ink-50">
                        Browse providers instead
                      </h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-ink-400">
                        Our public provider directory is still available while
                        the live catalogue reconnects.
                      </p>
                    </div>

                    {fallbackProviders.length === 0 ? (
                      <EmptyState
                        icon={Store}
                        title="No providers found"
                        description="Try adjusting your search or filters."
                        action={
                          <Button variant="outline" onClick={clearFilters}>
                            Clear search & filters
                          </Button>
                        }
                      />
                    ) : (
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {fallbackProviders.map((provider, i) => (
                          <motion.div
                            key={provider.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: Math.min(i, 11) * 0.04,
                              duration: 0.35,
                            }}
                          >
                            <ProviderCard provider={provider} />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              ) : filteredServices.length === 0 ? (
                <EmptyState
                  icon={SearchX}
                  title="No services found"
                  description={
                    services.length === 0
                      ? 'No services have been published yet. Check back soon.'
                      : 'Try a different search term or category.'
                  }
                  action={
                    services.length === 0 ? (
                      <Link to="/providers" className="btn-outline">
                        Browse providers
                      </Link>
                    ) : (
                      <Button variant="outline" onClick={clearFilters}>
                        Clear search & filters
                      </Button>
                    )
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredServices.map((service, i) => {
                    const provider = service.provider;
                    const pid = provider ? providerId(provider) : '';
                    return (
                      <motion.div
                        key={service._id || service.id || `${i}`}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: Math.min(i, 11) * 0.04,
                          duration: 0.35,
                        }}
                      >
                        <ServiceCard
                          service={service}
                          action={
                            pid ? (
                              <Link
                                to={`/providers/${pid}`}
                                className="btn-outline btn-sm"
                              >
                                View provider
                              </Link>
                            ) : undefined
                          }
                        />
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ============ Mobile filter sheet ============ */}
      <ResponsiveModal
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filters"
        footer={
          <div className="flex gap-2">
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            )}
            <Button
              className="flex-1"
              onClick={() => setShowFilters(false)}
            >
              Show {resultCount} {resultCount === 1 ? 'result' : 'results'}
            </Button>
          </div>
        }
      >
        {filterPanel}
      </ResponsiveModal>

      <Footer />
    </div>
  );
}

/* =========================================================
   Small building blocks
========================================================= */

function ActiveFilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${label} filter`}
      className="group inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-950/60 dark:text-brand-300 dark:hover:bg-brand-900/60"
    >
      <span className="max-w-[14rem] truncate">{label}</span>
      <X className="h-3 w-3 shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'min-h-[38px] shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all',
        active
          ? 'border-brand-600 bg-brand-600 text-white shadow-soft'
          : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-lavender dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:bg-ink-800'
      )}
    >
      {children}
    </button>
  );
}

function FilterPanel({
  selectedCategory,
  minRating,
  minPrice,
  verifiedOnly,
  onChange,
}: {
  selectedCategory: string;
  minRating: number;
  minPrice: number;
  verifiedOnly: boolean;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div>
      <fieldset>
        <legend className="label">Category</legend>
        <div className="space-y-1">
          <FilterOption
            label="All categories"
            active={!selectedCategory}
            onClick={() => onChange('category', '')}
          />
          {platformCategories.map((cat) => (
            <FilterOption
              key={cat.id}
              label={cat.name}
              active={slugify(cat.name) === slugify(selectedCategory)}
              onClick={() => onChange('category', cat.slug)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="label">Min rating</legend>
        <div className="flex gap-2">
          {[0, 3, 4, 4.5].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onChange('minRating', r === 0 ? '' : String(r))}
              aria-pressed={minRating === r}
              className={cn(
                'flex-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors',
                minRating === r
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700'
              )}
            >
              {r === 0 ? 'Any' : `${r}+`}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <label className="label" htmlFor="filter-min-price">
          Min. starting price
        </label>
        <input
          id="filter-min-price"
          type="range"
          min={0}
          max={100000}
          step={5000}
          value={minPrice}
          onChange={(e) =>
            onChange('minPrice', e.target.value === '0' ? '' : e.target.value)
          }
          className="w-full accent-brand-600"
        />
        <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-ink-400">
          <span>{minPrice ? `From ₦${minPrice.toLocaleString()}` : 'Any price'}</span>
          <span>₦100,000</span>
        </div>
      </div>

      <label className="mt-5 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-brand-200 dark:border-ink-700 dark:bg-ink-800/60 dark:text-ink-300 dark:hover:border-ink-600">
        <span>Verified only</span>
        <input
          type="checkbox"
          checked={verifiedOnly}
          onChange={(e) => onChange('verified', e.target.checked ? '1' : '')}
          className="h-4 w-4 rounded accent-brand-600"
        />
      </label>
    </div>
  );
}

function FilterOption({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
        active
          ? 'bg-lavender font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300'
          : 'text-slate-600 hover:bg-slate-50 dark:text-ink-400 dark:hover:bg-ink-800'
      )}
    >
      {label}
    </button>
  );
}
