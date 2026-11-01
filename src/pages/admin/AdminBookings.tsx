import { Fragment, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowUpDown,
  Banknote,
  BriefcaseBusiness,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  CreditCard,
  Hash,
  Mail,
  MapPin,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';

import {
  DashboardHeader,
  DashboardLayout,
  StatCard,
} from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/shared';
import {
  Avatar,
  Button,
  EmptyState,
  ErrorState,
  Skeleton,
  cn,
} from '@/components/ui';
import { adminNavItems } from '@/data/adminNavItems';
import { formatNaira } from '@/data/mockData';
import { getApiErrorMessage, hasAdminToken } from '@/lib/api';
import { useAdminBookings } from '@/hooks/queries';

/* =========================================================
   DATA SHAPES
   The admin endpoint returns loosely-typed booking documents,
   so the normaliser below supports both flattened and
   populated (nested service/customer/provider) payloads.
========================================================= */

type RawBooking = Record<string, unknown>;

type Booking = {
  id: string;

  serviceName: string;
  serviceCategory?: string;
  serviceDescription?: string;
  serviceImage?: string;

  providerId?: string;
  providerName: string;
  providerEmail?: string;
  providerAvatar?: string;

  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerAvatar?: string;

  date: string;
  time: string;
  location?: string;
  notes?: string;

  price: number;

  status: string;
  paymentStatus: string;
  paymentReference?: string | null;

  platformFee?: number;
  providerAmount?: number;

  createdAt?: string;
  updatedAt?: string;
};

function asRecord(value: unknown): RawBooking {
  return value !== null && typeof value === 'object'
    ? (value as RawBooking)
    : {};
}

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number') {
      return String(value);
    }
  }

  return '';
}

function pickNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (value === null || value === undefined || value === '') {
      continue;
    }

    const parsed = typeof value === 'number' ? value : Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function normalizeBooking(
  rawValue: unknown,
  index: number
): Booking {
  const raw = asRecord(rawValue);
  const service = asRecord(raw.service);
  const customer = asRecord(raw.customer);
  const user = asRecord(raw.user);
  const provider = {
    ...asRecord(service.provider),
    ...asRecord(raw.provider),
  };

  return {
    id:
      pickString(raw.id, raw._id, raw.bookingId, raw.booking_id) ||
      `booking-${index}`,

    serviceName:
      pickString(
        raw.serviceName,
        raw.service_name,
        service.title,
        service.name,
        service.serviceName
      ) || 'Service',
    serviceCategory:
      pickString(
        raw.serviceCategory,
        service.category,
        service.serviceCategory
      ) || undefined,
    serviceDescription:
      pickString(
        raw.serviceDescription,
        raw.description,
        service.description,
        service.about
      ) || undefined,
    serviceImage:
      pickString(
        raw.serviceImage,
        raw.serviceImageUrl,
        service.image,
        service.imageUrl,
        service.coverImage
      ) || undefined,

    providerId:
      pickString(
        raw.providerId,
        raw.provider_id,
        provider.id,
        provider._id,
        typeof raw.provider === 'string' ? raw.provider : undefined
      ) || undefined,
    providerName:
      pickString(
        raw.providerName,
        raw.provider_name,
        provider.fullName,
        provider.name
      ) || 'Provider',
    providerEmail:
      pickString(raw.providerEmail, provider.email) || undefined,
    providerAvatar:
      pickString(
        raw.providerAvatar,
        provider.avatar,
        provider.profileImage
      ) || undefined,

    customerId:
      pickString(
        raw.customerId,
        raw.customer_id,
        customer.id,
        customer._id,
        user.id,
        user._id,
        raw.userId,
        typeof raw.customer === 'string' ? raw.customer : undefined
      ) || undefined,
    customerName:
      pickString(
        raw.customerName,
        raw.customer_name,
        customer.fullName,
        customer.name,
        user.fullName,
        user.name
      ) || 'Customer',
    customerEmail:
      pickString(
        raw.customerEmail,
        customer.email,
        user.email
      ) || undefined,
    customerAvatar:
      pickString(
        raw.customerAvatar,
        customer.avatar,
        customer.profileImage,
        user.avatar,
        user.profileImage
      ) || undefined,

    date:
      pickString(
        raw.date,
        raw.bookingDate,
        raw.scheduledDate,
        raw.appointmentDate
      ) || '',
    time:
      pickString(
        raw.time,
        raw.bookingTime,
        raw.scheduledTime
      ) || '',
    location: pickString(
      raw.location,
      raw.address,
      raw.serviceLocation,
      raw.customerAddress,
      customer.location
    ) || undefined,
    notes:
      pickString(raw.notes, raw.note, raw.customerNote) ||
      undefined,

    price:
      pickNumber(
        raw.price,
        raw.amount,
        raw.totalAmount,
        raw.total,
        service.price
      ) ?? 0,

    status: (pickString(raw.status) || 'pending').toLowerCase(),
    paymentStatus: (
      pickString(raw.paymentStatus, raw.payment_status) || 'unpaid'
    ).toLowerCase(),
    paymentReference:
      pickString(
        raw.paymentReference,
        raw.payment_reference,
        raw.txRef,
        raw.reference
      ) || null,

    platformFee: pickNumber(
      raw.platformFee,
      raw.platform_fee,
      raw.serviceFee
    ),
    providerAmount: pickNumber(
      raw.providerAmount,
      raw.provider_amount,
      raw.earnings,
      raw.providerEarnings
    ),

    createdAt:
      pickString(raw.createdAt, raw.created_at) || undefined,
    updatedAt:
      pickString(raw.updatedAt, raw.updated_at) || undefined,
  };
}

/* =========================================================
   FILTER + SORT OPTIONS
========================================================= */

type Filter =
  | 'all'
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'paid';

type DateRange = 'all' | 'today' | 'week' | 'month';

type SortOption =
  | 'newest'
  | 'oldest'
  | 'schedule-asc'
  | 'schedule-desc'
  | 'amount-high'
  | 'amount-low';

const tabs: Array<{ label: string; value: Filter }> = [
  { label: 'All Bookings', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Paid', value: 'paid' },
];

const DATE_OPTIONS: Array<{ value: DateRange; label: string }> = [
  { value: 'all', label: 'All dates' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
];

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'schedule-asc', label: 'Date: soonest' },
  { value: 'schedule-desc', label: 'Date: latest' },
  { value: 'amount-high', label: 'Amount: high to low' },
  { value: 'amount-low', label: 'Amount: low to high' },
];

/* =========================================================
   FORMATTERS + SMALL HELPERS
========================================================= */

function toTimestamp(value?: string): number {
  if (!value) return 0;

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDate(value?: string): string {
  if (!value) return '—';

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value?: string): string {
  if (!value) return '—';

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function dateRangeStart(range: DateRange): number | null {
  if (range === 'all') return null;

  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  if (range === 'week') {
    start.setDate(start.getDate() - 6);
  }

  if (range === 'month') {
    start.setDate(start.getDate() - 29);
  }

  return start.getTime();
}

function describeError(error: unknown): string {
  const message = getApiErrorMessage(error);
  const lowered = message.toLowerCase();

  if (
    lowered.includes('enotfound') ||
    lowered.includes('mongodb') ||
    lowered.includes('mongodb.net') ||
    lowered.includes('getaddrinfo') ||
    lowered.includes('econnrefused') ||
    lowered.includes('database')
  ) {
    return 'The booking server cannot connect to the database right now. Please check the backend database connection and try again.';
  }

  if (
    lowered.includes('401') ||
    lowered.includes('unauthorized')
  ) {
    return 'Your admin session is no longer valid. Please log in again.';
  }

  return message || 'Unable to load platform bookings.';
}

/* =========================================================
   PAGE
========================================================= */

export function AdminBookings() {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useAdminBookings();

  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [expandedBookingId, setExpandedBookingId] = useState<
    string | null
  >(null);

  const hasSession = hasAdminToken();

  const bookings = useMemo(
    () =>
      Array.isArray(data)
        ? data.map((record, index) => normalizeBooking(record, index))
        : [],
    [data]
  );

  /* -------------------------------------------------------
     STATISTICS
  ------------------------------------------------------- */

  const stats = useMemo(() => {
    let pending = 0;
    let confirmed = 0;
    let inProgress = 0;
    let completed = 0;
    let cancelled = 0;
    let rejected = 0;
    let paid = 0;
    let totalPaidAmount = 0;
    let platformFees = 0;

    bookings.forEach((booking) => {
      if (booking.status === 'pending') pending += 1;
      if (booking.status === 'confirmed') confirmed += 1;
      if (booking.status === 'in_progress') inProgress += 1;
      if (booking.status === 'completed') completed += 1;
      if (booking.status === 'cancelled') cancelled += 1;
      if (booking.status === 'rejected') rejected += 1;

      if (booking.paymentStatus === 'paid') {
        paid += 1;
        totalPaidAmount += Number(booking.price || 0);
        platformFees += Number(booking.platformFee || 0);
      }
    });

    return {
      total: bookings.length,
      pending,
      confirmed,
      inProgress,
      completed,
      cancelled,
      rejected,
      paid,
      totalPaidAmount,
      platformFees,
    };
  }, [bookings]);

  const counts: Record<Filter, number> = {
    all: stats.total,
    pending: stats.pending,
    confirmed: stats.confirmed,
    in_progress: stats.inProgress,
    completed: stats.completed,
    cancelled: stats.cancelled,
    rejected: stats.rejected,
    paid: stats.paid,
  };

  /* -------------------------------------------------------
     FILTER + SEARCH + SORT
  ------------------------------------------------------- */

  const filteredBookings = useMemo(() => {
    let result = [...bookings];

    /*
     * PAID uses paymentStatus only.
     * Every other tab uses the booking status.
     * A booking can therefore appear in both Paid and Completed.
     */
    if (filter === 'paid') {
      result = result.filter(
        (booking) => booking.paymentStatus === 'paid'
      );
    } else if (filter !== 'all') {
      result = result.filter(
        (booking) => booking.status === filter
      );
    }

    const start = dateRangeStart(dateRange);

    if (start !== null) {
      result = result.filter((booking) => {
        const timestamp = toTimestamp(
          booking.createdAt || booking.date
        );

        return timestamp > 0 && timestamp >= start;
      });
    }

    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter((booking) => {
        const searchableFields = [
          booking.id,
          booking.serviceName,
          booking.serviceCategory,
          booking.serviceDescription,

          booking.customerName,
          booking.customerEmail,
          booking.customerId,

          booking.providerName,
          booking.providerEmail,
          booking.providerId,

          booking.location,
          booking.notes,

          booking.paymentReference,

          booking.status,
          booking.paymentStatus,
        ];

        return searchableFields.some((field) =>
          String(field || '')
            .toLowerCase()
            .includes(query)
        );
      });
    }

    const sorted = [...result];

    switch (sortOption) {
      case 'oldest':
        sorted.sort(
          (a, b) =>
            toTimestamp(a.createdAt || a.date) -
            toTimestamp(b.createdAt || b.date)
        );
        break;

      case 'schedule-asc':
        sorted.sort(
          (a, b) => toTimestamp(a.date) - toTimestamp(b.date)
        );
        break;

      case 'schedule-desc':
        sorted.sort(
          (a, b) => toTimestamp(b.date) - toTimestamp(a.date)
        );
        break;

      case 'amount-high':
        sorted.sort((a, b) => b.price - a.price);
        break;

      case 'amount-low':
        sorted.sort((a, b) => a.price - b.price);
        break;

      default:
        sorted.sort(
          (a, b) =>
            toTimestamp(b.createdAt || b.date) -
            toTimestamp(a.createdAt || a.date)
        );
    }

    return sorted;
  }, [bookings, filter, search, dateRange, sortOption]);

  const hasSearch = Boolean(search.trim());

  const hasActiveFilters =
    hasSearch ||
    filter !== 'all' ||
    dateRange !== 'all' ||
    sortOption !== 'newest';

  const errorMessage = !hasSession
    ? 'Your admin session has expired. Please log in again.'
    : describeError(error);

  const resetFilters = () => {
    setSearch('');
    setFilter('all');
    setDateRange('all');
    setSortOption('newest');
  };

  const toggleBooking = (bookingId: string) => {
    setExpandedBookingId((current) =>
      current === bookingId ? null : bookingId
    );
  };

  return (
    <DashboardLayout role="admin" navItems={adminNavItems}>
      <DashboardHeader
        title="Booking Management"
        subtitle="Monitor every booking, payment and provider engagement across the Servicely platform."
        action={
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
            Read-only monitor
          </span>
        }
      />

      <div className="space-y-6" aria-busy={isFetching}>
        {/* =================================================
            SUMMARY CARDS
        ================================================== */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="card p-5">
                <Skeleton className="h-11 w-11 rounded-xl" />
                <Skeleton className="mt-3 h-7 w-16" />
                <Skeleton className="mt-2 h-3.5 w-24" />
              </div>
            ))
          ) : (
            <>
              <StatCard
                label="Total bookings"
                value={String(stats.total)}
                icon={CalendarDays}
                color="brand"
                trend="All time"
              />

              <StatCard
                label="Pending"
                value={String(stats.pending)}
                icon={Clock3}
                color="warning"
                trend="Awaiting action"
              />

              <StatCard
                label="Confirmed"
                value={String(stats.confirmed)}
                icon={CheckCircle2}
                color="sky"
                trend="Scheduled"
              />

              <StatCard
                label="In progress"
                value={String(stats.inProgress)}
                icon={Users}
                color="accent"
                trend="Service underway"
              />

              <StatCard
                label="Completed"
                value={String(stats.completed)}
                icon={CheckCircle2}
                color="success"
                trend="Finished"
              />

              <StatCard
                label="Paid"
                value={String(stats.paid)}
                icon={CreditCard}
                color="primary"
                trend="Payment confirmed"
              />
            </>
          )}
        </div>

        {/* =================================================
            PAID REVENUE
        ================================================== */}
        <div className="card p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                <CreditCard className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm text-slate-500 dark:text-ink-400">
                  Total paid booking value
                </p>

                {isLoading ? (
                  <Skeleton className="mt-2 h-8 w-40" />
                ) : (
                  <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-ink-50">
                    {formatNaira(stats.totalPaidAmount)}
                  </p>
                )}

                <p className="mt-1 text-xs text-slate-400 dark:text-ink-500">
                  {stats.paid} paid booking
                  {stats.paid === 1 ? '' : 's'} ·{' '}
                  {formatNaira(stats.platformFees)} platform fees
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-ink-800 dark:bg-ink-800/30">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm dark:bg-ink-900 dark:text-brand-300">
                <ReceiptText className="h-4 w-4" />
              </div>

              <div>
                <p className="text-xs text-slate-400 dark:text-ink-500">
                  Payments captured
                </p>
                <p className="text-lg font-semibold leading-tight text-slate-900 dark:text-ink-50">
                  {stats.paid}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            SEARCH + FILTER TOOLBAR
        ================================================== */}
        <div className="card p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative w-full xl:max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-ink-500" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customer, provider, service or reference…"
                aria-label="Search bookings"
                autoComplete="off"
                className="search-input h-11 pl-10 pr-12"
              />

              {hasSearch && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-ink-800 dark:hover:text-ink-100"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 xl:ml-auto xl:w-auto">
              <FilterSelect
                id="booking-date-range"
                label="Filter by date added"
                value={dateRange}
                onChange={(value) =>
                  setDateRange(value as DateRange)
                }
                icon={CalendarRange}
                options={DATE_OPTIONS}
              />

              <FilterSelect
                id="booking-sort"
                label="Sort bookings"
                value={sortOption}
                onChange={(value) =>
                  setSortOption(value as SortOption)
                }
                icon={ArrowUpDown}
                options={SORT_OPTIONS}
              />

              <Button
                variant="outline"
                loading={isFetching}
                onClick={() => {
                  void refetch();
                }}
                disabled={!hasSession}
                className="col-span-2 h-11 sm:col-span-1"
              >
                Refresh
              </Button>
            </div>
          </div>

          <div
            role="group"
            aria-label="Filter bookings by status"
            className="no-scrollbar mt-4 flex items-center gap-1.5 overflow-x-auto pb-0.5"
          >
            {tabs.map((tab) => {
              const active = filter === tab.value;

              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setFilter(tab.value)}
                  aria-pressed={active}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition',
                    active
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700'
                  )}
                >
                  {tab.label}

                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] tabular-nums',
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-white text-slate-500 dark:bg-ink-700 dark:text-ink-300'
                    )}
                  >
                    {counts[tab.value]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-ink-800">
            <p
              className="text-sm text-slate-500 dark:text-ink-400"
              aria-live="polite"
            >
              {isLoading ? (
                'Loading bookings…'
              ) : (
                <>
                  Showing{' '}
                  <span className="font-semibold text-slate-800 dark:text-ink-100">
                    {filteredBookings.length}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-slate-800 dark:text-ink-100">
                    {bookings.length}
                  </span>{' '}
                  {bookings.length === 1 ? 'booking' : 'bookings'}

                  {hasSearch && (
                    <>
                      {' '}for “
                      <span className="font-semibold text-slate-800 dark:text-ink-100">
                        {search.trim()}
                      </span>
                      ”
                    </>
                  )}
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

        {/* =================================================
            BACKGROUND REFRESH FAILURE
            (cached bookings remain visible)
        ================================================== */}
        {isError && bookings.length > 0 && hasSession && (
          <div className="flex flex-col gap-3 rounded-2xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800 dark:border-warning-600/30 dark:bg-warning-600/10 dark:text-warning-200 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Showing the last loaded bookings. {errorMessage}</span>
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

        {/* =================================================
            BOOKING LIST
        ================================================== */}
        {!hasSession ? (
          <ErrorState message={errorMessage} />
        ) : isLoading ? (
          <BookingsSkeleton />
        ) : isError && bookings.length === 0 ? (
          <ErrorState
            message={errorMessage}
            onRetry={() => {
              void refetch();
            }}
          />
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            icon={bookings.length === 0 ? CalendarDays : Search}
            title={
              bookings.length === 0
                ? 'No bookings yet'
                : 'No bookings match your filters'
            }
            description={
              bookings.length === 0
                ? 'Bookings created across the platform will appear here once customers start booking services.'
                : hasSearch
                  ? `No bookings match “${search.trim()}”. Try another name, email, service or reference.`
                  : 'Try adjusting the status tab, date range or sort options.'
            }
            action={
              bookings.length === 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void refetch();
                  }}
                >
                  Refresh
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                >
                  Clear filters
                </Button>
              )
            }
          />
        ) : (
          <>
            {/* =============================================
                DESKTOP TABLE
            ============================================== */}
            <div className="card hidden overflow-hidden lg:block">
              <div className="max-h-[70vh] overflow-auto">
                <table className="w-full min-w-[1120px] text-left text-sm">
                  <caption className="sr-only">
                    All platform bookings
                  </caption>

                  <thead className="sticky top-0 z-10 border-b border-slate-200/70 bg-slate-50/95 text-[11px] uppercase tracking-wider text-slate-500 backdrop-blur dark:border-ink-800 dark:bg-ink-900/95 dark:text-ink-400">
                    <tr>
                      <th scope="col" className="px-5 py-3.5 font-semibold">
                        Service
                      </th>
                      <th scope="col" className="px-5 py-3.5 font-semibold">
                        Customer
                      </th>
                      <th scope="col" className="px-5 py-3.5 font-semibold">
                        Provider
                      </th>
                      <th scope="col" className="px-5 py-3.5 font-semibold">
                        Schedule
                      </th>
                      <th scope="col" className="px-5 py-3.5 font-semibold">
                        Amount
                      </th>
                      <th scope="col" className="px-5 py-3.5 font-semibold">
                        Payment
                      </th>
                      <th scope="col" className="px-5 py-3.5 font-semibold">
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-3.5 text-right font-semibold"
                      >
                        <span className="sr-only">Booking details</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-ink-800">
                    {filteredBookings.map((booking) => {
                      const isExpanded =
                        expandedBookingId === booking.id;
                      const detailsId = `desktop-booking-details-${booking.id}`;

                      return (
                        <Fragment key={booking.id}>
                          <tr
                            className={cn(
                              'transition-colors',
                              isExpanded
                                ? 'bg-brand-50/40 dark:bg-brand-950/20'
                                : 'hover:bg-slate-50/80 dark:hover:bg-ink-800/40'
                            )}
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <ServiceThumb booking={booking} />

                                <div className="min-w-0">
                                  <p className="max-w-[170px] truncate font-semibold text-slate-900 dark:text-ink-50">
                                    {booking.serviceName}
                                  </p>

                                  {booking.serviceCategory && (
                                    <p className="mt-0.5 max-w-[170px] truncate text-xs text-slate-400 dark:text-ink-500">
                                      {booking.serviceCategory}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2.5">
                                <Avatar
                                  src={booking.customerAvatar}
                                  name={booking.customerName}
                                  size="sm"
                                />

                                <div className="min-w-0">
                                  <p className="max-w-[150px] truncate font-medium text-slate-800 dark:text-ink-200">
                                    {booking.customerName}
                                  </p>

                                  {booking.customerEmail && (
                                    <p className="mt-0.5 max-w-[150px] truncate text-xs text-slate-400 dark:text-ink-500">
                                      {booking.customerEmail}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2.5">
                                <Avatar
                                  src={booking.providerAvatar}
                                  name={booking.providerName}
                                  size="sm"
                                />

                                <div className="min-w-0">
                                  <p className="max-w-[150px] truncate font-medium text-slate-800 dark:text-ink-200">
                                    {booking.providerName}
                                  </p>

                                  {booking.providerEmail && (
                                    <p className="mt-0.5 max-w-[150px] truncate text-xs text-slate-400 dark:text-ink-500">
                                      {booking.providerEmail}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <p className="whitespace-nowrap font-medium text-slate-700 dark:text-ink-300">
                                {formatDate(booking.date)}
                              </p>

                              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-400 dark:text-ink-500">
                                <Clock3 className="h-3.5 w-3.5" />
                                {booking.time || 'No time'}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <p className="whitespace-nowrap font-semibold text-slate-900 dark:text-ink-50">
                                {formatNaira(Number(booking.price || 0))}
                              </p>

                              {booking.platformFee !== undefined && (
                                <p className="mt-0.5 whitespace-nowrap text-xs text-slate-400 dark:text-ink-500">
                                  Fee:{' '}
                                  {formatNaira(
                                    Number(booking.platformFee)
                                  )}
                                </p>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <PaymentStatus
                                status={booking.paymentStatus}
                              />
                            </td>

                            <td className="px-5 py-4">
                              <StatusBadge status={booking.status} />
                            </td>

                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleBooking(booking.id)
                                }
                                aria-expanded={isExpanded}
                                aria-controls={detailsId}
                                aria-label={
                                  isExpanded
                                    ? `Hide details for ${booking.serviceName}`
                                    : `View details for ${booking.serviceName}`
                                }
                                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:border-brand-500/40 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                )}
                                {isExpanded ? 'Hide' : 'View'}
                              </button>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr
                              id={detailsId}
                              className="bg-slate-50/60 dark:bg-ink-800/20"
                            >
                              <td colSpan={8} className="px-5 py-5">
                                <BookingDetails booking={booking} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* =============================================
                MOBILE / TABLET CARDS
            ============================================== */}
            <div className="space-y-3 lg:hidden">
              {filteredBookings.map((booking) => {
                const isExpanded =
                  expandedBookingId === booking.id;
                const detailsId = `mobile-booking-details-${booking.id}`;

                return (
                  <article
                    key={booking.id}
                    className="card overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <StatusBadge status={booking.status} />
                            <PaymentStatus
                              status={booking.paymentStatus}
                            />
                          </div>

                          <h3 className="mt-2 truncate text-sm font-bold text-slate-900 dark:text-ink-50">
                            {booking.serviceName}
                          </h3>

                          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-ink-400">
                            {[booking.serviceCategory, booking.location]
                              .filter(Boolean)
                              .join(' • ') || 'Service booking'}
                          </p>
                        </div>

                        <p className="shrink-0 text-sm font-bold text-slate-900 dark:text-ink-50">
                          {formatNaira(Number(booking.price || 0))}
                        </p>
                      </div>

                      <div className="mt-3 space-y-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-ink-800 dark:bg-ink-800/30">
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-ink-300">
                          <Avatar
                            src={booking.customerAvatar}
                            name={booking.customerName}
                            size="xs"
                          />

                          <span className="truncate font-medium">
                            {booking.customerName}
                          </span>

                          <span className="ml-auto shrink-0 text-slate-400 dark:text-ink-500">
                            Customer
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-ink-300">
                          <Avatar
                            src={booking.providerAvatar}
                            name={booking.providerName}
                            size="xs"
                          />

                          <span className="truncate font-medium">
                            {booking.providerName}
                          </span>

                          <span className="ml-auto shrink-0 text-slate-400 dark:text-ink-500">
                            Provider
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-200/70 pt-2 text-xs text-slate-500 dark:border-ink-700 dark:text-ink-400">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(booking.date)}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 className="h-3.5 w-3.5" />
                            {booking.time || 'No time'}
                          </span>

                          {booking.platformFee !== undefined && (
                            <span className="inline-flex items-center gap-1.5">
                              <Banknote className="h-3.5 w-3.5" />
                              Fee{' '}
                              {formatNaira(
                                Number(booking.platformFee)
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleBooking(booking.id)}
                        aria-expanded={isExpanded}
                        aria-controls={detailsId}
                        className="mt-3 flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700 dark:border-ink-700 dark:bg-ink-800/40 dark:text-ink-300 dark:hover:border-ink-600 dark:hover:bg-ink-800 dark:hover:text-brand-300"
                      >
                        <span>
                          {isExpanded
                            ? 'Hide details'
                            : 'View details'}
                        </span>

                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {isExpanded && (
                      <div
                        id={detailsId}
                        className="border-t border-slate-100 bg-slate-50/60 p-4 dark:border-ink-800 dark:bg-ink-900/40"
                      >
                        <BookingDetails booking={booking} />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

/* =========================================================
   TOOLBAR SELECT
========================================================= */

function FilterSelect({
  id,
  label,
  value,
  onChange,
  icon: Icon,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: LucideIcon;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="relative min-w-0">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>

      <Icon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-ink-500" />

      <select
        id={id}
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
    </div>
  );
}

/* =========================================================
   SERVICE THUMBNAIL
========================================================= */

function ServiceThumb({ booking }: { booking: Booking }) {
  return (
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-ink-800">
      {booking.serviceImage ? (
        <img
          src={booking.serviceImage}
          alt={booking.serviceName}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-ink-500">
          <BriefcaseBusiness className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PAYMENT STATUS
========================================================= */

function PaymentStatus({ status }: { status: string }) {
  const normalized = (status || 'unpaid').toLowerCase();

  const styles: Record<string, string> = {
    paid: 'bg-success-50 text-success-700 dark:bg-success-600/15 dark:text-success-200',
    unpaid:
      'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-ink-300',
    pending:
      'bg-warning-50 text-warning-700 dark:bg-warning-600/15 dark:text-warning-200',
    failed:
      'bg-danger-50 text-danger-700 dark:bg-danger-500/15 dark:text-danger-200',
    refunded:
      'bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
  };

  const tone =
    styles[normalized] ||
    'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-ink-300';

  const labels: Record<string, string> = {
    paid: 'Paid',
    unpaid: 'Unpaid',
    pending: 'Payment pending',
    failed: 'Payment failed',
    refunded: 'Refunded',
  };

  return (
    <span
      className={cn(
        'badge whitespace-nowrap font-semibold',
        tone
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          normalized === 'paid'
            ? 'bg-success-500'
            : normalized === 'failed'
              ? 'bg-danger-500'
              : normalized === 'pending'
                ? 'bg-warning-500'
                : normalized === 'refunded'
                  ? 'bg-purple-500'
                  : 'bg-slate-400'
        )}
      />
      {labels[normalized] || status || 'Unknown'}
    </span>
  );
}

/* =========================================================
   BOOKING DETAILS (expanded panel)
========================================================= */

function BookingDetails({ booking }: { booking: Booking }) {
  return (
    <div className="space-y-6 text-left">
      {/* SERVICE */}
      <section>
        <SectionTitle
          icon={BriefcaseBusiness}
          title="Service information"
        />

        <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
          <div className="flex flex-col gap-4 sm:flex-row">
            {booking.serviceImage ? (
              <img
                src={booking.serviceImage}
                alt={booking.serviceName}
                loading="lazy"
                className="h-20 w-20 shrink-0 rounded-xl object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                <BriefcaseBusiness className="h-7 w-7" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900 dark:text-ink-50">
                {booking.serviceName}
              </h3>

              {booking.serviceCategory && (
                <p className="mt-1 text-sm text-slate-500 dark:text-ink-400">
                  {booking.serviceCategory}
                </p>
              )}

              {booking.serviceDescription && (
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-ink-300">
                  {booking.serviceDescription}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CUSTOMER + PROVIDER */}
      <div className="grid gap-3 md:grid-cols-2">
        <InfoCard
          icon={User}
          title="Customer"
          name={booking.customerName}
          email={booking.customerEmail}
          id={booking.customerId}
        />

        <InfoCard
          icon={BriefcaseBusiness}
          title="Provider"
          name={booking.providerName}
          email={booking.providerEmail}
          id={booking.providerId}
        />
      </div>

      {/* BOOKING INFORMATION */}
      <section>
        <SectionTitle
          icon={CalendarDays}
          title="Booking information"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailItem
            label="Date"
            value={formatDate(booking.date)}
            icon={CalendarDays}
          />

          <DetailItem
            label="Time"
            value={booking.time || 'No time provided'}
            icon={Clock3}
          />

          <DetailItem
            label="Location"
            value={booking.location || 'No location provided'}
            icon={MapPin}
          />

          <DetailItem
            label="Amount"
            value={formatNaira(Number(booking.price || 0))}
            icon={Banknote}
          />
        </div>
      </section>

      {/* STATUS */}
      <section>
        <SectionTitle icon={CheckCircle2} title="Status" />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-ink-500">
              Booking status
            </p>

            <StatusBadge status={booking.status} />
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-ink-500">
              Payment status
            </p>

            <PaymentStatus status={booking.paymentStatus} />
          </div>
        </div>
      </section>

      {/* PAYMENT INFORMATION */}
      <section>
        <SectionTitle
          icon={CreditCard}
          title="Payment information"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailItem
            label="Payment reference"
            value={booking.paymentReference || 'No payment reference'}
            icon={Hash}
          />

          <DetailItem
            label="Platform fee"
            value={formatNaira(Number(booking.platformFee || 0))}
            icon={CreditCard}
          />

          <DetailItem
            label="Provider amount"
            value={formatNaira(Number(booking.providerAmount || 0))}
            icon={Banknote}
          />

          <DetailItem
            label="Booking amount"
            value={formatNaira(Number(booking.price || 0))}
            icon={ReceiptText}
          />
        </div>
      </section>

      {/* NOTES */}
      {booking.notes && (
        <section>
          <SectionTitle icon={ReceiptText} title="Customer note" />

          <div className="rounded-xl border border-slate-100 bg-white p-4 text-sm leading-6 text-slate-600 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300">
            {booking.notes}
          </div>
        </section>
      )}

      {/* TIMESTAMPS */}
      <section>
        <SectionTitle icon={Clock3} title="Record information" />

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailItem
            label="Created"
            value={formatDateTime(booking.createdAt)}
            icon={Clock3}
          />

          <DetailItem
            label="Last updated"
            value={formatDateTime(booking.updatedAt)}
            icon={RefreshCw}
          />
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  icon: Icon,
  title,
  name,
  email,
  id,
}: {
  icon: LucideIcon;
  title: string;
  name: string;
  email?: string;
  id?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-brand-500" />

        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-ink-500">
          {title}
        </p>
      </div>

      <p className="mt-3 truncate font-semibold text-slate-900 dark:text-ink-50">
        {name}
      </p>

      {email && (
        <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-ink-400">
          <Mail className="h-3.5 w-3.5 shrink-0" />

          <span className="truncate">{email}</span>
        </div>
      )}

      {id && (
        <p className="mt-2 truncate font-mono text-[11px] text-slate-400 dark:text-ink-500">
          ID: {id}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   SECTION TITLE
========================================================= */

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-4 w-4 text-brand-500" />

      <h3 className="text-sm font-semibold text-slate-900 dark:text-ink-50">
        {title}
      </h3>
    </div>
  );
}

/* =========================================================
   DETAIL ITEM
========================================================= */

function DetailItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-slate-400 dark:text-ink-500" />

        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-ink-500">
          {label}
        </p>
      </div>

      <p className="mt-2 break-words text-sm font-semibold text-slate-800 dark:text-ink-100">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   LOADING SKELETONS
========================================================= */

function BookingsSkeleton() {
  return (
    <>
      <div className="card hidden overflow-hidden lg:block">
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3.5 dark:border-ink-800 dark:bg-ink-900/40">
          <Skeleton className="h-3 w-full" />
        </div>

        <div className="divide-y divide-slate-100 dark:divide-ink-800">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 px-5 py-4"
            >
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />

              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>

              <div className="hidden space-y-2 sm:block">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>

              <Skeleton className="hidden h-3.5 w-24 md:block" />
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
              <Skeleton className="h-10 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>

                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>

              <Skeleton className="h-4 w-20" />
            </div>

            <div className="mt-3 space-y-2 rounded-xl border border-slate-100 p-3 dark:border-ink-800">
              <Skeleton className="h-3.5 w-3/5" />
              <Skeleton className="h-3.5 w-3/5" />
              <Skeleton className="h-3 w-4/5" />
            </div>

            <Skeleton className="mt-3 h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </>
  );
}
