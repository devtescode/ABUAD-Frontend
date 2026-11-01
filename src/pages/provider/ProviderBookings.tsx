import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleDollarSign,
  Clock3,
  FileText,
  Image as ImageIcon,
  Inbox,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  User,
  UserRound,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';

import {
  DashboardLayout,
  DashboardHeader,
  StatCard,
} from '../../components/DashboardLayout';
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  SearchBar,
  Skeleton,
} from '../../components/ui';
import { StatusBadge } from '../../components/shared';
import { providerNavItems } from '../../data/providerNavItems';
import { formatNaira } from '../../data/mockData';
import { getApiErrorMessage, hasUserToken } from '../../lib/api';
import { useProviderBookings } from '@/hooks/queries';

/* =========================================================
   DATA SHAPES
   The API returns loosely-typed booking documents, so the
   normaliser below supports both flattened and populated
   (nested service/customer/provider) payloads.
========================================================= */

type RawBooking = Record<string, unknown>;

interface ProviderBooking {
  id: string;

  serviceId: string;
  serviceName: string;
  serviceImage?: string;

  providerId: string;
  providerName: string;
  providerAvatar?: string;

  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerAvatar?: string;
  customerPhone?: string;
  customerGender?: string;

  date: string;
  time: string;
  location: string;

  price: number;
  notes?: string;

  status: string;
  paymentStatus: string;
  paymentReference?: string | null;

  platformFee?: number;
  providerAmount?: number;

  createdAt?: string;
  updatedAt?: string;
}

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
): ProviderBooking {
  const raw = asRecord(rawValue);
  const service = asRecord(raw.service);
  const customer = asRecord(raw.customer);
  const user = asRecord(raw.user);
  const provider = asRecord(raw.provider);

  return {
    id:
      pickString(raw.id, raw._id, raw.bookingId, raw.booking_id) ||
      `booking-${index}`,

    serviceId: pickString(
      raw.serviceId,
      raw.service_id,
      service.id,
      service._id
    ),
    serviceName:
      pickString(
        raw.serviceName,
        raw.service_name,
        service.title,
        service.name,
        service.serviceName
      ) || 'Service',
    serviceImage:
      pickString(
        raw.serviceImage,
        raw.serviceImageUrl,
        service.image,
        service.imageUrl,
        service.coverImage
      ) || undefined,

    providerId: pickString(
      raw.providerId,
      raw.provider_id,
      provider.id,
      provider._id
    ),
    providerName:
      pickString(
        raw.providerName,
        provider.fullName,
        provider.name
      ) || 'Provider',
    providerAvatar:
      pickString(
        raw.providerAvatar,
        provider.avatar,
        provider.profileImage
      ) || undefined,

    customerId: pickString(
      raw.customerId,
      raw.customer_id,
      customer.id,
      customer._id,
      user.id,
      user._id,
      raw.userId
    ),
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
    customerPhone:
      pickString(
        raw.customerPhone,
        raw.customer_phone,
        customer.phone,
        customer.phoneNumber,
        user.phone,
        user.phoneNumber
      ) || undefined,
    customerGender:
      pickString(
        raw.customerGender,
        raw.customer_gender,
        customer.gender,
        user.gender
      ) || undefined,

    date:
      pickString(
        raw.date,
        raw.bookingDate,
        raw.scheduledDate,
        raw.appointmentDate
      ) || 'Date to be confirmed',
    time:
      pickString(
        raw.time,
        raw.bookingTime,
        raw.scheduledTime
      ) || 'Time to be confirmed',
    location: pickString(
      raw.location,
      raw.address,
      raw.serviceLocation,
      raw.customerAddress,
      customer.location
    ),

    price:
      pickNumber(raw.price, raw.amount, raw.totalAmount, service.price) ?? 0,
    notes:
      pickString(raw.notes, raw.note, raw.customerNote) || undefined,

    status: (pickString(raw.status) || 'pending').toLowerCase(),
    paymentStatus: (
      pickString(raw.paymentStatus, raw.payment_status) || 'unpaid'
    ).toLowerCase(),
    paymentReference:
      pickString(
        raw.paymentReference,
        raw.payment_reference,
        raw.txRef
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

    createdAt: pickString(raw.createdAt, raw.created_at) || undefined,
    updatedAt: pickString(raw.updatedAt, raw.updated_at) || undefined,
  };
}

/* =========================================================
   PRESENTATION HELPERS
========================================================= */

const PAGE_SIZE = 4;

const tabs = [
  'all',
  'pending',
  'confirmed',
  'paid',
  'completed',
  'cancelled',
] as const;

type BookingTab = (typeof tabs)[number];

type SortKey = 'newest' | 'oldest' | 'amount-high' | 'amount-low';

const sortOptions: Array<{ value: SortKey; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'amount-high', label: 'Amount: high to low' },
  { value: 'amount-low', label: 'Amount: low to high' },
];

function toTimestamp(value?: string): number {
  if (!value) return 0;

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatShortDate(value?: string): string {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function SummarySkeleton() {
  return (
    <div
      aria-hidden="true"
      className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-16" />
            </div>
            <Skeleton className="h-11 w-11 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

function BookingsSkeleton() {
  return (
    <div className="mt-4 space-y-3" aria-hidden="true">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="card p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />

            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>

            <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ServiceThumb({ booking }: { booking: ProviderBooking }) {
  return (
    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-ink-800">
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
          <ImageIcon className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon?: LucideIcon;
  label: string;
  value: ReactNode;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      {Icon && (
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-ink-500" />
      )}

      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-ink-500">
          {label}
        </p>

        {href ? (
          <a
            href={href}
            className="mt-0.5 block break-all text-sm font-medium text-slate-700 underline-offset-2 transition hover:text-brand-600 hover:underline dark:text-ink-300 dark:hover:text-brand-300"
          >
            {value}
          </a>
        ) : (
          <p className="mt-0.5 break-words text-sm font-medium text-slate-700 dark:text-ink-300">
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

function DetailPanel({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
          <Icon className="h-4 w-4" />
        </span>

        <h4 className="text-sm font-semibold text-slate-900 dark:text-ink-50">
          {title}
        </h4>
      </div>

      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function BookingDetails({ booking }: { booking: ProviderBooking }) {
  const isPaid = booking.paymentStatus === 'paid';
  const bookedOn = formatShortDate(booking.createdAt);

  return (
    <div className="space-y-4">
      {/* SERVICE PREVIEW */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white dark:border-ink-800 dark:bg-ink-900">
        <div className="grid gap-0 md:grid-cols-[220px_1fr]">
          <div className="h-44 overflow-hidden bg-slate-100 md:h-full md:min-h-[200px] dark:bg-ink-800">
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
              <div className="flex h-full min-h-[176px] items-center justify-center text-slate-400 dark:text-ink-500">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-7 w-7" />

                  <p className="mt-2 text-xs">No service image</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                <ImageIcon className="h-4 w-4" />
              </span>

              <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-300">
                Service booked
              </p>
            </div>

            <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-ink-50">
              {booking.serviceName}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-ink-400">
              This is the exact service selected by the customer when
              creating this booking.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="neutral">{formatNaira(booking.price)}</Badge>

              <Badge
                tone={isPaid ? 'success' : 'warning'}
                icon={isPaid ? CheckCircle2 : Clock3}
              >
                {isPaid ? 'Paid' : 'Payment pending'}
              </Badge>

              <StatusBadge status={booking.status} />
            </div>
          </div>
        </div>
      </div>

      {/* CUSTOMER / BOOKING / PAYMENT */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DetailPanel icon={UserRound} title="Customer information">
          <DetailRow
            icon={User}
            label="Name"
            value={booking.customerName}
          />

          <DetailRow
            icon={Mail}
            label="Email"
            value={booking.customerEmail || 'Not available'}
            href={
              booking.customerEmail
                ? `mailto:${booking.customerEmail}`
                : undefined
            }
          />

          <DetailRow
            icon={Phone}
            label="Phone"
            value={booking.customerPhone || 'Not available'}
            href={
              booking.customerPhone
                ? `tel:${booking.customerPhone}`
                : undefined
            }
          />

          <DetailRow
            icon={UserRound}
            label="Gender"
            value={booking.customerGender || 'Not available'}
          />
        </DetailPanel>

        <DetailPanel icon={CalendarDays} title="Booking information">
          <DetailRow
            icon={CalendarDays}
            label="Date"
            value={booking.date}
          />

          <DetailRow icon={Clock3} label="Time" value={booking.time} />

          <DetailRow
            icon={MapPin}
            label="Location"
            value={booking.location || 'Not provided'}
          />

          <DetailRow
            icon={ImageIcon}
            label="Service"
            value={booking.serviceName}
          />
        </DetailPanel>

        <DetailPanel icon={WalletCards} title="Payment details">
          <DetailRow
            label="Booking amount"
            value={formatNaira(booking.price)}
          />

          <DetailRow
            label="Servicely fee"
            value={formatNaira(booking.platformFee ?? 0)}
          />

          <div className="border-t border-slate-100 pt-3 dark:border-ink-800">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-ink-500">
              Your earnings
            </p>

            <p className="mt-0.5 text-lg font-bold text-success-600 dark:text-success-200">
              {formatNaira(booking.providerAmount ?? 0)}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-ink-500">
              Payment status
            </p>

            <Badge
              tone={isPaid ? 'success' : 'warning'}
              icon={isPaid ? CheckCircle2 : Clock3}
              className="capitalize"
            >
              {booking.paymentStatus || 'unpaid'}
            </Badge>
          </div>
        </DetailPanel>
      </div>

      {/* CUSTOMER NOTE */}
      {booking.notes && (
        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
              <FileText className="h-4 w-4" />
            </span>

            <h4 className="text-sm font-semibold text-slate-900 dark:text-ink-50">
              Customer note
            </h4>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-ink-300">
            {booking.notes}
          </p>
        </div>
      )}

      {/* META / REQUEST LINK */}
      <div className="flex flex-col gap-3 text-xs text-slate-400 dark:text-ink-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <span>
            Booking ID:{' '}
            <span className="font-mono text-slate-500 dark:text-ink-400">
              {booking.id}
            </span>
          </span>

          {booking.paymentReference && (
            <span>
              Payment reference:{' '}
              <span className="font-mono text-slate-500 dark:text-ink-400">
                {booking.paymentReference}
              </span>
            </span>
          )}

          {bookedOn && <span>Booked {bookedOn}</span>}
        </div>

        <Link
          to="/provider/requests"
          className="inline-flex w-fit items-center gap-1.5 font-semibold text-brand-600 underline-offset-2 transition hover:text-brand-700 hover:underline dark:text-brand-300 dark:hover:text-brand-200"
        >
          <Inbox className="h-3.5 w-3.5" />
          Booking requests
        </Link>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export function ProviderBookings() {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useProviderBookings();

  const [filter, setFilter] = useState<BookingTab>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(
    null
  );

  const hasSession = hasUserToken();

  const bookings = useMemo(
    () => (Array.isArray(data) ? data.map(normalizeBooking) : []),
    [data]
  );

  const counts = useMemo<Record<BookingTab, number>>(() => {
    const next: Record<BookingTab, number> = {
      all: bookings.length,
      pending: 0,
      confirmed: 0,
      paid: 0,
      completed: 0,
      cancelled: 0,
    };

    bookings.forEach((booking) => {
      if (booking.status === 'pending') next.pending += 1;
      if (booking.status === 'confirmed') next.confirmed += 1;
      if (booking.status === 'completed') next.completed += 1;
      if (booking.status === 'cancelled') next.cancelled += 1;
      if (booking.paymentStatus === 'paid') next.paid += 1;
    });

    return next;
  }, [bookings]);

  const stats = useMemo(() => {
    let pending = 0;
    let paid = 0;
    let earnings = 0;

    bookings.forEach((booking) => {
      if (booking.status === 'pending') pending += 1;

      if (booking.paymentStatus === 'paid') {
        paid += 1;
        earnings += Number(booking.providerAmount ?? 0);
      }
    });

    return { total: bookings.length, pending, paid, earnings };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const term = search.trim().toLowerCase();

    let list = bookings;

    if (filter === 'paid') {
      list = list.filter(
        (booking) => booking.paymentStatus === 'paid'
      );
    } else if (filter !== 'all') {
      list = list.filter((booking) => booking.status === filter);
    }

    if (term) {
      list = list.filter((booking) =>
        [
          booking.id,
          booking.customerName,
          booking.customerEmail,
          booking.customerPhone,
          booking.serviceName,
          booking.location,
          booking.paymentReference,
        ].some((value) =>
          (value || '').toLowerCase().includes(term)
        )
      );
    }

    const sorted = [...list];

    switch (sort) {
      case 'oldest':
        sorted.sort(
          (a, b) =>
            toTimestamp(a.createdAt) - toTimestamp(b.createdAt)
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
            toTimestamp(b.createdAt) - toTimestamp(a.createdAt)
        );
    }

    return sorted;
  }, [bookings, filter, search, sort]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBookings.length / PAGE_SIZE)
  );
  const currentPage = Math.min(page, totalPages);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const firstBookingOnPage =
    filteredBookings.length === 0
      ? 0
      : (currentPage - 1) * PAGE_SIZE + 1;
  const lastBookingOnPage = Math.min(
    currentPage * PAGE_SIZE,
    filteredBookings.length
  );

  const queryErrorMessage = !hasSession
    ? 'Authentication required. Please log in again.'
    : getApiErrorMessage(error) || 'Unable to load your bookings.';

  const updateFilter = (tab: BookingTab) => {
    setFilter(tab);
    setPage(1);
  };

  const updateSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const updateSort = (value: SortKey) => {
    setSort(value);
    setPage(1);
  };

  const toggleBooking = (bookingId: string) => {
    setExpandedBooking((current) =>
      current === bookingId ? null : bookingId
    );
  };

  const clearFilters = () => {
    setSearch('');
    setFilter('all');
    setSort('newest');
    setPage(1);
  };

  const hasSearch = Boolean(search.trim());

  const emptyTitle =
    bookings.length === 0
      ? 'No bookings yet'
      : 'No matching bookings';

  const emptyDescription =
    bookings.length === 0
      ? "You don't have any customer bookings yet. New bookings will appear here."
      : hasSearch
        ? `No bookings match "${search.trim()}"${
            filter !== 'all'
              ? ` in the ${
                  filter === 'paid' ? 'paid' : filter
                } tab`
              : ''
          }.`
        : `You don't have any ${
            filter === 'paid' ? 'paid' : filter
          } bookings.`;

  return (
    <DashboardLayout
      role="provider"
      navItems={providerNavItems}
    >
      <DashboardHeader
        title="My Bookings"
        subtitle="Your complete booking history, payments and customer details"
        action={
          <Link
            to="/provider/requests"
            className="btn-outline btn-sm w-fit"
          >
            <Inbox className="h-4 w-4" />
            Booking requests
          </Link>
        }
      />

      {/* SUMMARY */}
      {isLoading ? (
        <SummarySkeleton />
      ) : hasSession && !(isError && bookings.length === 0) ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
            label="Paid bookings"
            value={String(stats.paid)}
            icon={CircleDollarSign}
            color="success"
            trend="Payment confirmed"
          />

          <StatCard
            label="Provider earnings"
            value={formatNaira(stats.earnings)}
            icon={WalletCards}
            color="sky"
            trend="Paid bookings only"
          />
        </div>
      ) : null}

      {/* SEARCH / SORT / FILTER BAR */}
      <div className="sticky top-16 z-20 mt-6 rounded-2xl border border-slate-200/70 bg-white/95 p-3 shadow-card backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:p-4 lg:top-4 dark:border-ink-800 dark:bg-ink-900/95 dark:supports-[backdrop-filter]:bg-ink-900/85">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar
            value={search}
            onChange={updateSearch}
            placeholder="Search customer, service or booking ID…"
            className="min-w-0 sm:flex-1"
          />

          <div className="flex items-center gap-2">
            <label htmlFor="booking-sort" className="sr-only">
              Sort bookings
            </label>

            <select
              id="booking-sort"
              value={sort}
              onChange={(event) =>
                updateSort(event.target.value as SortKey)
              }
              className="h-11 min-w-0 flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 sm:flex-none dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="md"
              icon={RefreshCw}
              loading={isFetching}
              onClick={() => void refetch()}
              disabled={!hasSession}
              className="h-11 shrink-0"
            >
              Refresh
            </Button>
          </div>
        </div>

        <div
          role="group"
          className="no-scrollbar mt-3 flex items-center gap-1.5 overflow-x-auto pb-0.5"
          aria-label="Filter bookings by status"
        >
          {tabs.map((tab) => {
            const active = filter === tab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => updateFilter(tab)}
                aria-pressed={active}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold capitalize transition ${
                  active
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700'
                }`}
              >
                {tab}

                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-white text-slate-500 dark:bg-ink-700 dark:text-ink-300'
                  }`}
                >
                  {counts[tab]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PARTIAL ERROR (stale data still visible) */}
      {isError && bookings.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-danger-100 bg-danger-50/70 p-4 text-sm text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/5 dark:text-danger-200 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{queryErrorMessage}</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
          >
            Try again
          </Button>
        </div>
      )}

      {/* CONTENT */}
      {isLoading ? (
        <BookingsSkeleton />
      ) : !hasSession ? (
        <div className="mt-4">
          <ErrorState message={queryErrorMessage} />
        </div>
      ) : isError && bookings.length === 0 ? (
        <div className="mt-4">
          <ErrorState
            message={queryErrorMessage}
            onRetry={() => void refetch()}
          />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={CalendarDays}
            title={emptyTitle}
            description={emptyDescription}
            action={
              bookings.length === 0 ? (
                <Link
                  to="/provider/requests"
                  className="btn-outline btn-sm"
                >
                  View booking requests
                </Link>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              )
            }
          />
        </div>
      ) : (
        <>
          {/* =================================================
              DESKTOP TABLE
          ================================================== */}
          <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card lg:block dark:border-ink-800 dark:bg-ink-900">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">
                Your customer bookings
              </caption>

              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-400 dark:border-ink-800 dark:bg-ink-800/40 dark:text-ink-500">
                  <th
                    scope="col"
                    className="px-5 py-3 font-semibold"
                  >
                    Customer
                  </th>

                  <th
                    scope="col"
                    className="px-5 py-3 font-semibold"
                  >
                    Service
                  </th>

                  <th
                    scope="col"
                    className="px-5 py-3 font-semibold"
                  >
                    Schedule
                  </th>

                  <th
                    scope="col"
                    className="px-5 py-3 text-right font-semibold"
                  >
                    Amount
                  </th>

                  <th
                    scope="col"
                    className="px-5 py-3 font-semibold"
                  >
                    Status
                  </th>

                  <th
                    scope="col"
                    className="px-5 py-3 text-right"
                  >
                    <span className="sr-only">
                      Booking details
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-ink-800">
                {paginatedBookings.map((booking) => {
                  const isExpanded =
                    expandedBooking === booking.id;
                  const detailsId = `desktop-booking-details-${booking.id}`;
                  const isPaid =
                    booking.paymentStatus === 'paid';

                  return (
                    <Fragment key={booking.id}>
                      <tr
                        onClick={() => toggleBooking(booking.id)}
                        className="group cursor-pointer transition-colors hover:bg-brand-50/40 dark:hover:bg-ink-800/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={booking.customerAvatar}
                              name={booking.customerName}
                              size="md"
                            />

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
                                {booking.customerName}
                              </p>

                              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-ink-400">
                                {booking.customerEmail ||
                                  'No email available'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <ServiceThumb booking={booking} />

                            <div className="min-w-0">
                              <p className="max-w-[180px] truncate text-sm font-medium text-slate-800 dark:text-ink-200">
                                {booking.serviceName}
                              </p>

                              {booking.location && (
                                <p className="mt-0.5 flex max-w-[180px] items-center gap-1 text-[11px] text-slate-400 dark:text-ink-500">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  <span className="truncate">
                                    {booking.location}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-800 dark:text-ink-200">
                            {booking.date}
                          </p>

                          <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500 dark:text-ink-400">
                            <Clock3 className="h-3.5 w-3.5" />
                            {booking.time}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <p className="text-sm font-bold text-slate-900 dark:text-ink-50">
                            {formatNaira(booking.price)}
                          </p>

                          <p
                            className={`mt-0.5 text-[11px] font-semibold ${
                              isPaid
                                ? 'text-success-600 dark:text-success-200'
                                : 'text-warning-600 dark:text-warning-200'
                            }`}
                          >
                            {isPaid
                              ? 'Payment received'
                              : 'Payment pending'}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={booking.status} />
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleBooking(booking.id);
                            }}
                            aria-expanded={isExpanded}
                            aria-controls={detailsId}
                            aria-label={
                              isExpanded
                                ? 'Hide booking details'
                                : 'View booking details'
                            }
                            title={
                              isExpanded
                                ? 'Hide booking details'
                                : 'View booking details'
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-brand-100 hover:text-brand-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr
                          id={detailsId}
                          className="bg-slate-50/60 dark:bg-ink-800/20"
                        >
                          <td
                            colSpan={6}
                            className="px-5 py-5"
                          >
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

          {/* =================================================
              MOBILE CARDS
          ================================================== */}
          <div className="mt-4 space-y-3 lg:hidden">
            {paginatedBookings.map((booking) => {
              const isExpanded =
                expandedBooking === booking.id;
              const detailsId = `mobile-booking-details-${booking.id}`;
              const isPaid =
                booking.paymentStatus === 'paid';

              return (
                <article
                  key={booking.id}
                  className="card overflow-hidden transition-shadow hover:shadow-card-hover"
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar
                        src={booking.customerAvatar}
                        name={booking.customerName}
                        size="md"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge status={booking.status} />

                          <Badge
                            tone={isPaid ? 'success' : 'warning'}
                            icon={isPaid ? CheckCircle2 : Clock3}
                          >
                            {isPaid ? 'Paid' : 'Payment pending'}
                          </Badge>
                        </div>

                        <h3 className="mt-1.5 truncate text-sm font-bold text-slate-900 dark:text-ink-50">
                          {booking.customerName}
                        </h3>

                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-ink-400">
                          {booking.customerEmail ||
                            'No email available'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 dark:border-ink-800 dark:bg-ink-800/30">
                      <ServiceThumb booking={booking} />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-800 dark:text-ink-200">
                          {booking.serviceName}
                        </p>

                        <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-slate-500 dark:text-ink-400">
                          <CalendarDays className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {booking.date} · {booking.time}
                          </span>
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-bold text-slate-900 dark:text-ink-50">
                        {formatNaira(booking.price)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleBooking(booking.id)}
                      aria-expanded={isExpanded}
                      aria-controls={detailsId}
                      className="mt-3 flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700 dark:border-ink-700 dark:bg-ink-800/40 dark:text-ink-300 dark:hover:border-ink-600 dark:hover:bg-ink-800 dark:hover:text-brand-300"
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

          {/* PAGINATION */}
          <nav
            aria-label="Booking results pagination"
            className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 shadow-card sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-ink-800 dark:bg-ink-900"
          >
            <p
              aria-live="polite"
              className="text-sm text-slate-500 dark:text-ink-400"
            >
              Showing{' '}
              <span className="font-semibold text-slate-800 dark:text-ink-100">
                {firstBookingOnPage}–{lastBookingOnPage}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-800 dark:text-ink-100">
                {filteredBookings.length}
              </span>{' '}
              bookings
            </p>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="text-xs font-medium tabular-nums text-slate-500 dark:text-ink-400">
                Page {currentPage} of {totalPages}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous page"
                  title="Previous page"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:border-ink-600 dark:hover:bg-ink-700 dark:hover:text-ink-50 dark:disabled:hover:border-ink-700 dark:disabled:hover:bg-ink-800 dark:disabled:hover:text-ink-300"
                >
                  <ChevronLeft
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </button>

                <button
                  type="button"
                  aria-label="Next page"
                  title="Next page"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:border-ink-600 dark:hover:bg-ink-700 dark:hover:text-ink-50 dark:disabled:hover:border-ink-700 dark:disabled:hover:bg-ink-800 dark:disabled:hover:text-ink-300"
                >
                  <ChevronRight
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          </nav>
        </>
      )}
    </DashboardLayout>
  );
}

