import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SearchX, SlidersHorizontal, Sparkles, Store } from 'lucide-react';
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
  type ServiceLike,
} from '@/components/ui';
import { Footer, PublicNavbar, ProviderCard } from '@/components/shared';
import {
  categories as platformCategories,
  providers as mockProviders,
} from '@/data/mockData';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

/* =========================================================
   PUBLIC SERVICES CATALOG (/services)

   Loads real approved services from the backend (no auth).
   If the request fails, the page gracefully falls back to the
   public provider-browse experience it has always shown.
========================================================= */

export function ServicesPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(() => params.get('q') || '');
  const [services, setServices] = useState<ServiceLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const selectedCategory = params.get('category') || '';
  const minPrice = Number(params.get('minPrice') || 0);
  const minRating = Number(params.get('minRating') || 0);
  const verifiedOnly = params.get('verified') === '1';

  /* ---------------------------------------------
     Fetch approved services (public, no auth)
  --------------------------------------------- */
  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/provider/approved-services`);

      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const message = (data as { message?: string } | null)?.message;
        throw new Error(message || 'Failed to load services.');
      }

      const list = (data as { services?: unknown } | null)?.services;
      if (!Array.isArray(list)) {
        throw new Error('Received an unexpected response from the server.');
      }

      setServices(list as ServiceLike[]);
    } catch (err) {
      setServices([]);
      setError(
        err instanceof Error
          ? err.message
          : 'Could not reach Servicely right now.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

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
        {!loading && !error && serviceChips.length > 0 && (
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

        {/* ============ Toolbar ============ */}
        {!loading && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <p
              aria-live="polite"
              className="text-sm text-slate-500 dark:text-ink-400"
            >
              {error
                ? `${fallbackProviders.length} providers found`
                : `${filteredServices.length} ${
                    filteredServices.length === 1 ? 'service' : 'services'
                  } found`}
            </p>
            {error && (
              <button
                onClick={() => setShowFilters(true)}
                className="btn-outline btn-sm lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </button>
            )}
          </div>
        )}

        {/* ============ Content ============ */}
        <div className="mt-4">
          {loading ? (
            <div
              aria-busy="true"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : error ? (
            /* -------- Public fallback: browse verified providers -------- */
            <div className="space-y-10">
              <ErrorState
                message="We couldn't load the live service catalogue right now. You can still browse our public provider directory below."
                onRetry={fetchServices}
              />

              <section aria-label="Provider directory">
                <div className="flex gap-6">
                  {/* Desktop filters */}
                  <aside className="hidden w-60 shrink-0 lg:block">
                    <div className="card sticky top-20 p-5">{filterPanel}</div>
                  </aside>

                  <div className="min-w-0 flex-1">
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
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                  </div>
                </div>
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </main>

      {/* ============ Mobile filter drawer ============ */}
      <ResponsiveModal
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filters"
        footer={
          <Button
            className="w-full"
            onClick={() => setShowFilters(false)}
          >
            Show {fallbackProviders.length} results
          </Button>
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
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'min-h-[38px] shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors',
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
              onClick={() => onChange('minRating', r === 0 ? '' : String(r))}
              aria-pressed={minRating === r}
              className={cn(
                'flex-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors',
                minRating === r
                  ? 'bg-brand-600 text-white'
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
        <p className="mt-1 text-xs text-slate-500 dark:text-ink-400">
          {minPrice ? `From ₦${minPrice.toLocaleString()}` : 'Any price'}
        </p>
      </div>

      <label className="mt-5 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-ink-300">
        <input
          type="checkbox"
          checked={verifiedOnly}
          onChange={(e) => onChange('verified', e.target.checked ? '1' : '')}
          className="h-4 w-4 rounded accent-brand-600"
        />
        Verified only
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
