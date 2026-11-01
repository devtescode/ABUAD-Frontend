import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpDown,
  Ban,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  DashboardHeader,
  DashboardLayout,
  StatCard,
} from '@/components/DashboardLayout';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  ResponsiveModal,
  Skeleton,
  cn,
} from '@/components/ui';
import { StarRating, VerifiedBadge } from '@/components/shared';
import { adminNavItems } from '@/data/adminNavItems';
import { getApiErrorMessage, hasAdminToken } from '@/lib/api';
import {
  useAdminProviders,
  useAdminProviderStatus,
} from '@/hooks/queries';

/* =========================================================
   TYPES + NORMALISATION
========================================================= */

type ProviderStatus = 'active' | 'pending' | 'suspended';
type StatusFilter = 'all' | ProviderStatus;
type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'rating'
  | 'bookings'
  | 'status';

interface ProviderRow {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  categories: string[];
  rating: number;
  completedBookings: number;
  verified: boolean;
  status: ProviderStatus;
}

function stringValue(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
}

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Normalises the loose backend provider shape into a predictable row.
 * Backends have used `active`, `verified` and `approved` interchangeably,
 * so all of those resolve to the "active" bucket.
 */
function toProvider(raw: Record<string, unknown>): ProviderRow {
  const rawStatus = stringValue(raw.status).toLowerCase();
  const verified = raw.verified === true;

  const status: ProviderStatus =
    rawStatus === 'suspended'
      ? 'suspended'
      : rawStatus === 'active' ||
          rawStatus === 'verified' ||
          rawStatus === 'approved' ||
          verified
        ? 'active'
        : 'pending';

  const rawCategories = raw.categories;
  const categories = Array.isArray(rawCategories)
    ? rawCategories
        .map((category) => stringValue(category))
        .filter(Boolean)
    : stringValue(raw.category)
      ? [stringValue(raw.category)]
      : [];

  return {
    _id: stringValue(raw._id) || stringValue(raw.id),
    name:
      stringValue(raw.fullName) ||
      stringValue(raw.name) ||
      'Service Provider',
    email: stringValue(raw.email),
    avatar:
      stringValue(raw.avatar) ||
      stringValue(raw.profileImage) ||
      undefined,
    categories,
    rating: numberValue(raw.rating),
    completedBookings: numberValue(raw.completedBookings),
    verified,
    status,
  };
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return 'P';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/* =========================================================
   STATIC OPTIONS / META
========================================================= */

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending review' },
  { value: 'suspended', label: 'Suspended' },
];

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'bookings', label: 'Most bookings' },
  { value: 'status', label: 'Status' },
];

const STATUS_META: Record<
  ProviderStatus,
  { label: string; tone: 'success' | 'warning' | 'danger'; icon: LucideIcon }
> = {
  active: { label: 'Active / Verified', tone: 'success', icon: CheckCircle2 },
  pending: { label: 'Pending Review', tone: 'warning', icon: Clock3 },
  suspended: { label: 'Suspended', tone: 'danger', icon: Ban },
};

const STATUS_ORDER: Record<ProviderStatus, number> = {
  active: 0,
  pending: 1,
  suspended: 2,
};

/* =========================================================
   PAGE
========================================================= */

export function AdminProviders() {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useAdminProviders();

  const statusMutation = useAdminProviderStatus();

  const hasToken = hasAdminToken();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('all');
  const [sortOption, setSortOption] =
    useState<SortOption>('name-asc');

  const [selectedProvider, setSelectedProvider] =
    useState<ProviderRow | null>(null);
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const providers = useMemo<ProviderRow[]>(
    () =>
      Array.isArray(data)
        ? data.map((record) => toProvider(record))
        : [],
    [data]
  );

  /* Derived counts */
  const counts = useMemo(() => {
    let active = 0;
    let pending = 0;
    let suspended = 0;

    providers.forEach((provider) => {
      if (provider.status === 'active') active += 1;
      if (provider.status === 'pending') pending += 1;
      if (provider.status === 'suspended') suspended += 1;
    });

    return {
      total: providers.length,
      active,
      pending,
      suspended,
    };
  }, [providers]);

  /* Search + status filter + sorting */
  const filteredProviders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const result = providers.filter((provider) => {
      if (
        statusFilter !== 'all' &&
        provider.status !== statusFilter
      ) {
        return false;
      }

      if (!query) return true;

      return [
        provider.name,
        provider.email,
        provider._id,
        provider.status,
        ...provider.categories,
      ].some((value) => value.toLowerCase().includes(query));
    });

    const byName = (a: ProviderRow, b: ProviderRow) =>
      a.name.localeCompare(b.name, undefined, {
        sensitivity: 'base',
      });

    switch (sortOption) {
      case 'name-desc':
        result.sort((a, b) => byName(b, a));
        break;
      case 'rating':
        result.sort(
          (a, b) => b.rating - a.rating || byName(a, b)
        );
        break;
      case 'bookings':
        result.sort(
          (a, b) =>
            b.completedBookings - a.completedBookings ||
            byName(a, b)
        );
        break;
      case 'status':
        result.sort(
          (a, b) =>
            STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
            byName(a, b)
        );
        break;
      default:
        result.sort(byName);
    }

    return result;
  }, [providers, searchQuery, statusFilter, sortOption]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== 'all' ||
    sortOption !== 'name-asc';

  const errorMessage =
    error?.message ||
    'We could not load the provider list. Please try again.';

  const pendingProviderId = statusMutation.isPending
    ? statusMutation.variables?.id
    : undefined;

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSortOption('name-asc');
  };

  const openConfirm = (provider: ProviderRow) => {
    setActionError('');
    setSuccessMessage('');
    setSelectedProvider(provider);
  };

  const closeConfirm = () => {
    if (statusMutation.isPending) return;
    setActionError('');
    setSelectedProvider(null);
  };

  const selectedIsSuspended =
    selectedProvider?.status === 'suspended';

  const handleConfirmStatus = async () => {
    if (!selectedProvider) return;

    const suspend = selectedProvider.status !== 'suspended';
    const providerName = selectedProvider.name;

    setActionError('');

    try {
      await statusMutation.mutateAsync({
        id: selectedProvider._id,
        suspend,
      });

      setSelectedProvider(null);
      setSuccessMessage(
        suspend
          ? `${providerName} has been suspended.`
          : `${providerName} has been unsuspended and can access the platform again.`
      );
    } catch (mutationError) {
      setActionError(getApiErrorMessage(mutationError));
    }
  };

  return (
    <DashboardLayout role="admin" navItems={adminNavItems}>
      <DashboardHeader
        title="Provider Management"
        subtitle="Manage providers, review verification and moderate platform access."
        action={
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300">
            <BriefcaseBusiness className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
            Profiles &amp; services
          </span>
        }
      />

      {/* =========================
          SUMMARY COUNTS
      ========================== */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="card p-5">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <Skeleton className="mt-4 h-7 w-16" />
              <Skeleton className="mt-2 h-3.5 w-24" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              label="Total providers"
              value={String(counts.total)}
              icon={Users}
              color="brand"
              trend={`${counts.active} active`}
            />
            <StatCard
              label="Active / verified"
              value={String(counts.active)}
              icon={ShieldCheck}
              color="success"
            />
            <StatCard
              label="Pending review"
              value={String(counts.pending)}
              icon={Clock3}
              color="warning"
            />
            <StatCard
              label="Suspended"
              value={String(counts.suspended)}
              icon={Ban}
              color="danger"
            />
          </>
        )}
      </div>

      {/* =========================
          SEARCH + FILTER TOOLBAR
      ========================== */}
      <div className="card mb-6 p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative w-full xl:max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-ink-500" />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search name, email, category or ID…"
              aria-label="Search providers"
              autoComplete="off"
              className="search-input h-11 pl-10 pr-12"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-ink-800 dark:hover:text-ink-100"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 xl:ml-auto xl:w-auto">
            <FilterSelect
              label="Filter by status"
              value={statusFilter}
              onChange={(value) =>
                setStatusFilter(value as StatusFilter)
              }
              icon={ShieldCheck}
              options={STATUS_OPTIONS}
            />

            <FilterSelect
              label="Sort providers"
              value={sortOption}
              onChange={(value) =>
                setSortOption(value as SortOption)
              }
              icon={ArrowUpDown}
              options={SORT_OPTIONS}
            />

            <Button
              variant="outline"
              loading={isFetching && !isLoading}
              icon={RefreshCw}
              onClick={() => {
                void refetch();
              }}
              className="col-span-2 h-11 w-full sm:col-span-1"
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-ink-800">
          <p
            className="text-sm text-slate-500 dark:text-ink-400"
            aria-live="polite"
          >
            {isLoading ? (
              'Loading providers…'
            ) : (
              <>
                Showing{' '}
                <span className="font-semibold text-slate-800 dark:text-ink-100">
                  {filteredProviders.length}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-800 dark:text-ink-100">
                  {providers.length}
                </span>{' '}
                {providers.length === 1 ? 'provider' : 'providers'}
              </>
            )}
          </p>

          {hasActiveFilters && !isLoading && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/50"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* =========================
          SUCCESS FEEDBACK
      ========================== */}
      {successMessage && (
        <div
          role="status"
          className="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-600/30 dark:bg-success-600/10 dark:text-success-200"
        >
          <span className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </span>

          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            aria-label="Dismiss message"
            className="shrink-0 rounded-md p-1 text-success-600 transition-colors hover:bg-success-100 dark:text-success-200 dark:hover:bg-success-600/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Background-refresh failure with cached data still visible */}
      {isError && providers.length > 0 && (
        <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-warning-500/30 bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-100 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Showing the last loaded providers. {errorMessage}
            </span>
          </span>

          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="shrink-0 self-start font-semibold underline underline-offset-2 hover:no-underline sm:self-auto"
          >
            Retry
          </button>
        </div>
      )}

      {/* =========================
          PROVIDERS LIST
      ========================== */}
      {!hasToken ? (
        <ErrorState message="Admin authentication token was not found. Please sign in again." />
      ) : isError && providers.length === 0 ? (
        <ErrorState
          message={errorMessage}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : (
        <div className="card overflow-hidden">
          {isLoading ? (
            <ProvidersSkeleton />
          ) : filteredProviders.length === 0 ? (
            <div className="p-4 sm:p-6">
              <EmptyState
                icon={providers.length === 0 ? Users : Search}
                title={
                  providers.length === 0
                    ? 'No providers found'
                    : 'No providers match your filters'
                }
                description={
                  providers.length === 0
                    ? 'There are currently no registered providers. New providers will appear here once they sign up.'
                    : 'Try a different search term, or clear the status filter and sorting.'
                }
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={
                      providers.length === 0
                        ? () => {
                            void refetch();
                          }
                        : resetFilters
                    }
                  >
                    {providers.length === 0
                      ? 'Refresh'
                      : 'Clear filters'}
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              {/* =========================
                  DESKTOP TABLE
              ========================== */}
              <div className="hidden md:block">
                <div className="max-h-[70vh] overflow-auto">
                  <table className="w-full min-w-[960px] text-left text-sm">
                    <caption className="sr-only">
                      All registered providers
                    </caption>

                    <thead className="sticky top-0 z-10 border-b border-slate-200/70 bg-slate-50/95 text-[11px] uppercase tracking-wider text-slate-500 backdrop-blur dark:border-ink-800 dark:bg-ink-900/95 dark:text-ink-400">
                      <tr>
                        <th scope="col" className="px-5 py-3.5 font-semibold">
                          Provider
                        </th>
                        <th scope="col" className="px-5 py-3.5 font-semibold">
                          Categories
                        </th>
                        <th scope="col" className="px-5 py-3.5 font-semibold">
                          Status
                        </th>
                        <th scope="col" className="px-5 py-3.5 font-semibold">
                          Rating
                        </th>
                        <th scope="col" className="px-5 py-3.5 font-semibold">
                          Bookings
                        </th>
                        <th
                          scope="col"
                          className="px-5 py-3.5 text-right font-semibold"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-ink-800">
                      {filteredProviders.map((provider) => {
                        const meta = STATUS_META[provider.status];
                        const isSuspended =
                          provider.status === 'suspended';
                        const isMutating =
                          pendingProviderId === provider._id;
                        const disabled =
                          statusMutation.isPending;

                        return (
                          <tr
                            key={provider._id}
                            className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-ink-800/40"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <ProviderAvatar
                                  src={provider.avatar}
                                  name={provider.name}
                                />

                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="truncate font-semibold text-slate-900 dark:text-ink-50">
                                      {provider.name}
                                    </p>

                                    {provider.status === 'active' && (
                                      <VerifiedBadge />
                                    )}
                                  </div>

                                  <p className="mt-0.5 max-w-[240px] truncate text-xs text-slate-500 dark:text-ink-400">
                                    {provider.email || 'No email address'}
                                  </p>

                                  <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400 dark:text-ink-500">
                                    {provider._id
                                      ? `#${provider._id
                                          .slice(-6)
                                          .toUpperCase()}`
                                      : 'No ID'}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <p className="max-w-[200px] truncate text-slate-600 dark:text-ink-300">
                                {provider.categories.length
                                  ? provider.categories.join(', ')
                                  : 'Service Provider'}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <Badge tone={meta.tone} icon={meta.icon}>
                                {meta.label}
                              </Badge>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5">
                                <StarRating rating={provider.rating} />

                                <span className="text-slate-600 dark:text-ink-300">
                                  {provider.rating > 0
                                    ? provider.rating.toFixed(1)
                                    : 'New'}
                                </span>
                              </div>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-slate-500 dark:text-ink-400">
                              {provider.completedBookings}
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  to={`/admin/providers/${provider._id}`}
                                  aria-label={`View profile for ${provider.name}`}
                                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:border-brand-500/40 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  View
                                </Link>

                                <Link
                                  to={`/admin/providers/${provider._id}/services`}
                                  aria-label={`View services posted by ${provider.name}`}
                                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:border-brand-500/40 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
                                >
                                  Posts
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Link>

                                <button
                                  type="button"
                                  onClick={() => openConfirm(provider)}
                                  disabled={disabled}
                                  aria-label={
                                    isSuspended
                                      ? `Unsuspend ${provider.name}`
                                      : `Suspend ${provider.name}`
                                  }
                                  className={cn(
                                    'inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
                                    isSuspended
                                      ? 'text-success-600 hover:bg-success-50 dark:text-success-200 dark:hover:bg-success-600/10'
                                      : 'text-danger-600 hover:bg-danger-50 dark:text-danger-200 dark:hover:bg-danger-500/10'
                                  )}
                                >
                                  {isMutating ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : isSuspended ? (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  ) : (
                                    <Ban className="h-3.5 w-3.5" />
                                  )}
                                  {isSuspended ? 'Unsuspend' : 'Suspend'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* =========================
                  MOBILE CARDS
              ========================== */}
              <div className="divide-y divide-slate-100 dark:divide-ink-800 md:hidden">
                {filteredProviders.map((provider) => {
                  const meta = STATUS_META[provider.status];
                  const isSuspended =
                    provider.status === 'suspended';
                  const isMutating =
                    pendingProviderId === provider._id;

                  return (
                    <article
                      key={provider._id}
                      className="p-4 transition-colors hover:bg-slate-50/70 dark:hover:bg-ink-800/30"
                    >
                      <div className="flex items-start gap-3">
                        <ProviderAvatar
                          src={provider.avatar}
                          name={provider.name}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-1.5">
                            <h3 className="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
                              {provider.name}
                            </h3>

                            {provider.status === 'active' && (
                              <VerifiedBadge />
                            )}
                          </div>

                          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-ink-400">
                            {provider.email || 'No email address'}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500 dark:text-ink-400">
                            {provider.categories.length
                              ? provider.categories.join(', ')
                              : 'Service Provider'}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <Badge tone={meta.tone} icon={meta.icon}>
                              {meta.label}
                            </Badge>

                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-ink-800 dark:text-ink-300">
                              <StarRating rating={provider.rating} />
                              {provider.rating > 0
                                ? provider.rating.toFixed(1)
                                : 'New'}
                            </span>

                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-ink-800 dark:text-ink-300">
                              {provider.completedBookings}{' '}
                              {provider.completedBookings === 1
                                ? 'booking'
                                : 'bookings'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Link
                          to={`/admin/providers/${provider._id}`}
                          aria-label={`View profile for ${provider.name}`}
                          className="btn-outline btn-sm h-10 min-h-[40px] justify-center"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Profile
                        </Link>

                        <Link
                          to={`/admin/providers/${provider._id}/services`}
                          aria-label={`View services posted by ${provider.name}`}
                          className="btn-primary btn-sm h-10 min-h-[40px] justify-center"
                        >
                          Posts
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => openConfirm(provider)}
                          disabled={statusMutation.isPending}
                          className={cn(
                            'col-span-2 flex h-10 min-h-[40px] items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
                            isSuspended
                              ? 'border-success-200 bg-success-50 text-success-700 hover:bg-success-100 dark:border-success-600/30 dark:bg-success-600/10 dark:text-success-200 dark:hover:bg-success-600/20'
                              : 'border-danger-200 bg-danger-50 text-danger-700 hover:bg-danger-100 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-200 dark:hover:bg-danger-500/20'
                          )}
                        >
                          {isMutating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : isSuspended ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <Ban className="h-3.5 w-3.5" />
                          )}
                          {isSuspended
                            ? 'Unsuspend Provider'
                            : 'Suspend Provider'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* =========================
          SUSPEND / UNSUSPEND CONFIRMATION
      ========================== */}
      <ResponsiveModal
        open={Boolean(selectedProvider)}
        onClose={closeConfirm}
        title={
          selectedIsSuspended
            ? 'Unsuspend provider'
            : 'Suspend provider'
        }
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={closeConfirm}
              disabled={statusMutation.isPending}
            >
              Cancel
            </Button>

            <Button
              variant={selectedIsSuspended ? 'primary' : 'danger'}
              size="sm"
              loading={statusMutation.isPending}
              onClick={() => {
                void handleConfirmStatus();
              }}
              className="h-10 sm:h-auto"
            >
              {selectedIsSuspended
                ? 'Unsuspend provider'
                : 'Suspend provider'}
            </Button>
          </div>
        }
      >
        {selectedProvider && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ProviderAvatar
                src={selectedProvider.avatar}
                name={selectedProvider.name}
                size="lg"
              />

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
                  {selectedProvider.name}
                </p>

                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-ink-400">
                  {selectedProvider.email || 'No email address'}
                </p>

                <div className="mt-1.5">
                  <Badge
                    tone={STATUS_META[selectedProvider.status].tone}
                    icon={STATUS_META[selectedProvider.status].icon}
                  >
                    {STATUS_META[selectedProvider.status].label}
                  </Badge>
                </div>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-slate-600 dark:text-ink-300">
              {selectedIsSuspended
                ? 'This provider will regain access to their dashboard and their profile and services will be visible to customers again.'
                : 'This provider will lose access to their dashboard and their profile and services will be hidden from customers. You can reverse this at any time.'}
            </p>

            {actionError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-danger-200 bg-danger-50 px-3.5 py-3 text-sm text-danger-700 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-200"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}
          </div>
        )}
      </ResponsiveModal>
    </DashboardLayout>
  );
}

/* =========================================================
   SHARED BITS
========================================================= */

function FilterSelect({
  label,
  value,
  onChange,
  icon: Icon,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: LucideIcon;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="relative block min-w-0">
      <span className="sr-only">{label}</span>

      <Icon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-ink-500" />

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:border-ink-600"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-ink-500" />
    </label>
  );
}

function ProviderAvatar({
  src,
  name,
  size = 'md',
}: {
  src?: string;
  name: string;
  size?: 'md' | 'lg';
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const sizes = {
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
  };

  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-semibold text-brand-700 ring-1 ring-slate-900/5 dark:bg-brand-950 dark:text-brand-300 dark:ring-white/10',
        sizes[size]
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={name || 'Provider avatar'}
          loading="lazy"
          onError={() => setFailedSrc(src || null)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}

function ProvidersSkeleton() {
  return (
    <>
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead className="border-b border-slate-200/70 bg-slate-50/95 dark:border-ink-800 dark:bg-ink-900/95">
              <tr>
                {[
                  'Provider',
                  'Categories',
                  'Status',
                  'Rating',
                  'Bookings',
                  'Actions',
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className={cn(
                      'px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-ink-500',
                      heading === 'Actions' && 'text-right'
                    )}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-ink-800">
              {Array.from({ length: 6 }).map((_, index) => (
                <tr key={index}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-2.5 w-40" />
                        <Skeleton className="h-2.5 w-20" />
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <Skeleton className="h-3.5 w-28" />
                  </td>

                  <td className="px-5 py-4">
                    <Skeleton className="h-6 w-28 rounded-full" />
                  </td>

                  <td className="px-5 py-4">
                    <Skeleton className="h-3.5 w-24" />
                  </td>

                  <td className="px-5 py-4">
                    <Skeleton className="h-3.5 w-10" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1.5">
                      <Skeleton className="h-9 w-16 rounded-lg" />
                      <Skeleton className="h-9 w-16 rounded-lg" />
                      <Skeleton className="h-9 w-20 rounded-lg" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-ink-800 md:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />

              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />

                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="col-span-2 h-10 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
