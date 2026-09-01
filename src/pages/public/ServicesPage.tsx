import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X, Search } from 'lucide-react';
import { PublicNavbar, Footer, ProviderCard } from '@/components/shared';
import { providers, categories } from '@/data/mockData';

export function ServicesPage() {
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState(params.get('q') || '');

  const selectedCategory = params.get('category') || '';
  const minPrice = Number(params.get('minPrice') || 0);
  const minRating = Number(params.get('minRating') || 0);
  const verifiedOnly = params.get('verified') === '1';

  const filtered = useMemo(() => {
    return providers.filter((p) => {
      if (p.status !== 'verified') return false;
      if (selectedCategory && !p.categories.includes(categories.find((c) => c.slug === selectedCategory)?.name || '')) return false;
      if (p.startingPrice < minPrice) return false;
      if (p.rating < minRating) return false;
      if (verifiedOnly && !p.verified) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.categories.some((c) => c.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [selectedCategory, minPrice, minRating, verifiedOnly, search]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  return (
    <div className="min-h-screen bg-ink-50">
      <PublicNavbar />

      <div className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold text-ink-900">Browse Services</h1>
          <p className="mt-1 text-ink-500">Discover verified providers for your next project</p>
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 px-4 py-2.5">
            <Search className="h-5 w-5 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search providers or services..."
              className="flex-1 bg-transparent text-sm outline-none placeholder-ink-400"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          {/* Desktop filters */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-20 card p-5">
              <h3 className="mb-4 font-semibold text-ink-900">Filters</h3>
              <FilterSection
                title="Category"
                options={categories.map((c) => ({ label: c.name, value: c.slug }))}
                selected={selectedCategory}
                onChange={(v) => updateParam('category', v)}
              />
              <div className="mt-5">
                <label className="label">Min Rating</label>
                <div className="flex gap-2">
                  {[0, 3, 4, 4.5].map((r) => (
                    <button
                      key={r}
                      onClick={() => updateParam('minRating', r === 0 ? '' : String(r))}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium ${minRating === r ? 'bg-primary-600 text-white' : 'bg-ink-100 text-ink-600'}`}
                    >
                      {r === 0 ? 'Any' : `${r}+`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-5">
                <label className="label">Max Price</label>
                <input
                  type="range"
                  min={5000}
                  max={100000}
                  step={5000}
                  value={minPrice || 100000}
                  onChange={(e) => updateParam('minPrice', e.target.value === '100000' ? '' : e.target.value)}
                  className="w-full accent-primary-600"
                />
                <p className="mt-1 text-xs text-ink-500">Up to ₦{(minPrice || 100000).toLocaleString()}</p>
              </div>
              <div className="mt-5">
                <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => updateParam('verified', e.target.checked ? '1' : '')}
                    className="h-4 w-4 rounded accent-primary-600"
                  />
                  Verified only
                </label>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-ink-500">{filtered.length} providers found</p>
              <button
                onClick={() => setShowFilters(true)}
                className="btn-outline btn-sm lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </button>
            </div>

            {filtered.length === 0 ? (
              <div className="card flex flex-col items-center justify-center py-20 text-center">
                <Search className="h-12 w-12 text-ink-300" />
                <h3 className="mt-4 text-lg font-semibold text-ink-900">No providers found</h3>
                <p className="mt-1 text-sm text-ink-500">Try adjusting your filters or search query.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((provider, i) => (
                  <motion.div
                    key={provider.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <ProviderCard provider={provider} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/50" onClick={() => setShowFilters(false)} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute right-0 top-0 h-full w-80 overflow-y-auto bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink-900">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="text-ink-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5">
              <FilterSection
                title="Category"
                options={categories.map((c) => ({ label: c.name, value: c.slug }))}
                selected={selectedCategory}
                onChange={(v) => updateParam('category', v)}
              />
              <div className="mt-5">
                <label className="label">Min Rating</label>
                <div className="flex gap-2">
                  {[0, 3, 4, 4.5].map((r) => (
                    <button
                      key={r}
                      onClick={() => updateParam('minRating', r === 0 ? '' : String(r))}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium ${minRating === r ? 'bg-primary-600 text-white' : 'bg-ink-100 text-ink-600'}`}
                    >
                      {r === 0 ? 'Any' : `${r}+`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-5">
                <label className="label">Max Price</label>
                <input
                  type="range"
                  min={5000}
                  max={100000}
                  step={5000}
                  value={minPrice || 100000}
                  onChange={(e) => updateParam('minPrice', e.target.value === '100000' ? '' : e.target.value)}
                  className="w-full accent-primary-600"
                />
                <p className="mt-1 text-xs text-ink-500">Up to ₦{(minPrice || 100000).toLocaleString()}</p>
              </div>
              <div className="mt-5">
                <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => updateParam('verified', e.target.checked ? '1' : '')}
                    className="h-4 w-4 rounded accent-primary-600"
                  />
                  Verified only
                </label>
              </div>
              <button onClick={() => setShowFilters(false)} className="btn-primary mt-6 w-full">
                Show {filtered.length} results
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function FilterSection({
  title,
  options,
  selected,
  onChange,
}: {
  title: string;
  options: { label: string; value: string }[];
  selected: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label">{title}</label>
      <div className="space-y-1.5">
        <button
          onClick={() => onChange('')}
          className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${!selected ? 'bg-primary-50 font-medium text-primary-700' : 'text-ink-600 hover:bg-ink-50'}`}
        >
          All {title.toLowerCase()}
        </button>
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${selected === opt.value ? 'bg-primary-50 font-medium text-primary-700' : 'text-ink-600 hover:bg-ink-50'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
