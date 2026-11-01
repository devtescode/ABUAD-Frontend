import { useMemo, useRef, useState, type ElementType } from 'react';
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Hash,
  Inbox,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  UserRound,
  Wallet,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  ResponsiveModal,
  Skeleton,
} from '../../components/ui';
import { providerNavItems } from '../../data/providerNavItems';
import { formatNaira } from '../../data/mockData';
import { getApiErrorMessage, hasUserToken } from '../../lib/api';
import {
  useCompleteBooking,
  useProviderBookings,
} from '../../hooks/queries';

/* =========================================================
   DATA SHAPES
   The API returns loosely-typed booking documents, so the
   normaliser below supports both flattened and populated
   (nested service/customer) payloads.
========================================================= */

type RawBooking = Record<string, unknown>;

interface ProviderBooking {
  id: string;

  serviceId: string;
  serviceName: string;
  serviceImage?: string;

  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerAvatar?: string;
  customerPhone?: string;

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
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      continue;
    }

    const parsed =
      typeof value === 'number'
        ? value
        : Number(value);

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

  return {
    id:
      pickString(
        raw.id,
        raw._id,
        raw.bookingId,
        raw.booking_id
      ) || `booking-${index}`,

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
        customer.phone,
        customer.phoneNumber,
        user.phone,
        user.phoneNumber
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
      pickNumber(
        raw.price,
        raw.amount,
        raw.totalAmount,
        service.price
      ) ?? 0,
    notes:
      pickString(
        raw.notes,
        raw.note,
        raw.customerNote
      ) || undefined,

    status: (
      pickString(raw.status) || 'pending'
    ).toLowerCase(),
    paymentStatus: (
      pickString(
        raw.paymentStatus,
        raw.payment_status
      ) || 'unpaid'
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

    createdAt: pickString(raw.createdAt) || undefined,
    updatedAt: pickString(raw.updatedAt) || undefined,
  };
}

/* =========================================================
   SMALL PRESENTATION HELPERS
========================================================= */

function StatsSkeleton() {
  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="card p-5">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <Skeleton className="mt-4 h-6 w-24" />
          <Skeleton className="mt-2 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

function RequestsSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="card overflow-hidden">
          <div className="flex items-start gap-3 p-4 sm:p-5">
            <Skeleton className="h-10 w-10 rounded-full" />

            <div className="flex-1 space-y-2.5">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>

              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/5" />
            </div>

            <div className="hidden space-y-2 sm:block">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-ink-100 p-3 dark:border-ink-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <Skeleton className="h-8 w-28 rounded-xl" />
            <Skeleton className="h-9 w-full rounded-xl sm:w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-semibold text-ink-800 dark:text-ink-100">
            {value || 'Not provided'}
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400">
        {label}
      </p>

      <p className="mt-1 break-all font-mono text-xs text-ink-500 dark:text-ink-400">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export function ProviderRequests() {
  const {
    data,
    isLoading,
    isError,
    error: queryError,
    refetch,
    isFetching,
  } = useProviderBookings();

  const completeBooking = useCompleteBooking();

  const [expandedId, setExpandedId] =
    useState<string | null>(null);
  const [confirming, setConfirming] =
    useState<ProviderBooking | null>(null);
  const [completedIds, setCompletedIds] = useState<
    string[]
  >([]);

  const [success, setSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const successTimer = useRef<number | null>(null);

  const hasSession = hasUserToken();

  const bookings = useMemo(
    () =>
      Array.isArray(data)
        ? data.map(normalizeBooking)
        : [],
    [data]
  );

  /*
   * Booking Requests only contains paid, active bookings.
   * Completed requests are intentionally removed — they stay
   * on the backend and show up in My Bookings -> Completed.
   */
  const activeBookings = useMemo(() => {
    return bookings.filter(
      (booking) =>
        booking.paymentStatus === 'paid' &&
        booking.status !== 'completed' &&
        !['cancelled', 'rejected'].includes(
          booking.status
        ) &&
        !completedIds.includes(booking.id)
    );
  }, [bookings, completedIds]);

  const totalEarnings = useMemo(() => {
    return activeBookings.reduce(
      (total, booking) =>
        total +
        Number(
          booking.providerAmount ?? booking.price ?? 0
        ),
      0
    );
  }, [activeBookings]);

  const queryErrorMessage = !hasSession
    ? 'Authentication required. Please log in again.'
    : getApiErrorMessage(queryError) ||
      'Unable to load booking requests.';

  const isCompleting = (bookingId: string) =>
    completeBooking.isPending &&
    completeBooking.variables === bookingId;

  const flashSuccess = (message: string) => {
    setSuccess(message);

    if (successTimer.current) {
      window.clearTimeout(successTimer.current);
    }

    successTimer.current = window.setTimeout(() => {
      setSuccess('');
    }, 4000);
  };

  const requestComplete = (booking: ProviderBooking) => {
    setActionError('');
    setSuccess('');
    setConfirming(booking);
  };

  const confirmComplete = () => {
    if (!confirming) return;

    const booking = confirming;

    completeBooking.mutate(booking.id, {
      onSuccess: () => {
        /*
         * Hide immediately so it leaves the request inbox
         * without waiting for the refetch. The booking is not
         * deleted — the backend keeps it as "completed".
         */
        setCompletedIds((current) =>
          current.includes(booking.id)
            ? current
            : [...current, booking.id]
        );

        setExpandedId((current) =>
          current === booking.id ? null : current
        );
        setConfirming(null);
        setActionError('');

        flashSuccess(
          'Service completed successfully. It has been moved to your completed bookings.'
        );
      },

      onError: (mutationError) => {
        setConfirming(null);
        setSuccess('');
        setActionError(
          getApiErrorMessage(mutationError)
        );
      },
    });
  };

  const toggleExpanded = (bookingId: string) => {
    setExpandedId((current) =>
      current === bookingId ? null : bookingId
    );
  };

  return (
    <DashboardLayout
      role="provider"
      navItems={providerNavItems}
    >
      <DashboardHeader
        title="Booking Requests"
        subtitle="Paid customer bookings waiting for you to complete"
        action={
          <div className="flex items-center gap-2">
            <Badge
              tone="brand"
              className="hidden sm:inline-flex"
            >
              {activeBookings.length} active
            </Badge>

            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              loading={isFetching}
              onClick={() => void refetch()}
              disabled={!hasSession}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* =========================================================
          NOTIFICATIONS
      ========================================================== */}

      <AnimatePresence mode="wait">
        {success && (
          <motion.div
            key="success"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            className="mb-5 flex items-start gap-3 rounded-2xl border border-success-100 bg-success-50 px-4 py-4 shadow-sm dark:border-success-500/20 dark:bg-success-600/10"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success-100 text-success-700 dark:bg-success-600/20 dark:text-success-200">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-success-700 dark:text-success-200">
                Service completed
              </p>

              <p className="mt-0.5 text-xs leading-5 text-success-700/80 dark:text-success-200/80">
                {success}
              </p>
            </div>
          </motion.div>
        )}

        {actionError && (
          <motion.div
            key="action-error"
            role="alert"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mb-5 flex items-start gap-3 rounded-2xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/5 dark:text-danger-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <p>{actionError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          SUMMARY STATS
      ========================================================== */}

      {isLoading ? (
        <StatsSkeleton />
      ) : (
        hasSession &&
        !(isError && bookings.length === 0) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 grid gap-3 sm:grid-cols-3"
          >
            <StatCard
              label="Active requests"
              value={String(activeBookings.length)}
              icon={Inbox}
              color="brand"
              trend="Awaiting completion"
            />

            <StatCard
              label="Active earnings"
              value={formatNaira(totalEarnings)}
              icon={Wallet}
              color="success"
              trend="Provider share"
            />

            <StatCard
              label="Payment status"
              value="Confirmed"
              icon={CircleDollarSign}
              color="sky"
              trend="Paid bookings only"
            />
          </motion.div>
        )
      )}

      {/* =========================================================
          CONTENT
      ========================================================== */}

      {isLoading ? (
        <RequestsSkeleton />
      ) : !hasSession ? (
        <ErrorState message={queryErrorMessage} />
      ) : isError && bookings.length === 0 ? (
        <ErrorState
          message={queryErrorMessage}
          onRetry={() => void refetch()}
        />
      ) : activeBookings.length === 0 ? (
        /* =======================================================
           EMPTY STATE
        ======================================================== */

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <EmptyState
            icon={Inbox}
            title="No active requests"
            description="Paid customer bookings will appear here. Once you complete a service, it moves automatically to your Completed bookings."
            action={
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-xs font-semibold text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                <CheckCircle2 className="h-4 w-4" />
                Payment-confirmed bookings only
              </span>
            }
          />
        </motion.div>
      ) : (
        /* =======================================================
           REQUEST INBOX
        ======================================================== */

        <div>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">
                Incoming requests
              </h2>

              <p className="mt-0.5 text-xs text-ink-400">
                Complete a job to move it into your
                completed bookings.
              </p>
            </div>

            <Badge tone="brand">
              {activeBookings.length}{' '}
              {activeBookings.length === 1
                ? 'request'
                : 'requests'}
            </Badge>
          </div>

          {isError && bookings.length > 0 && (
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-danger-100 bg-danger-50/70 p-4 text-sm text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/5 dark:text-danger-200 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{queryErrorMessage}</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
              >
                Retry
              </Button>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {activeBookings.map((booking, index) => {
              const isExpanded =
                expandedId === booking.id;
              const completing =
                isCompleting(booking.id);
              const detailsId = `request-details-${index}`;

              return (
                <motion.article
                  layout
                  key={booking.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    scale: 0.96,
                    y: -10,
                  }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.04,
                  }}
                  className="card group mb-3 overflow-hidden transition-shadow duration-300 hover:shadow-card-hover"
                >
                  {/* =============================================
                      COMPACT REQUEST HEADER
                  ============================================== */}

                  <button
                    type="button"
                    onClick={() =>
                      toggleExpanded(booking.id)
                    }
                    aria-expanded={isExpanded}
                    aria-controls={detailsId}
                    className="w-full text-left"
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <Avatar
                          src={booking.customerAvatar}
                          name={booking.customerName}
                          size="md"
                          className="ring-4 ring-brand-50 dark:ring-brand-950/40"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge
                              tone="success"
                              icon={CheckCircle2}
                            >
                              Paid
                            </Badge>

                            <Badge
                              tone={
                                booking.status ===
                                'in_progress'
                                  ? 'info'
                                  : 'brand'
                              }
                              icon={Clock3}
                            >
                              {booking.status ===
                              'in_progress'
                                ? 'In progress'
                                : 'Active'}
                            </Badge>
                          </div>

                          <h3 className="mt-1.5 truncate text-base font-bold text-ink-900 dark:text-ink-50 sm:text-lg">
                            {booking.serviceName}
                          </h3>

                          <p className="mt-0.5 truncate text-xs text-ink-500 dark:text-ink-400">
                            {booking.customerName}
                            {booking.customerEmail
                              ? ` · ${booking.customerEmail}`
                              : ''}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-400">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {booking.date}
                            </span>

                            <span className="inline-flex items-center gap-1">
                              <Clock3 className="h-3.5 w-3.5" />
                              {booking.time}
                            </span>

                            {booking.location && (
                              <span className="inline-flex min-w-0 items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">
                                  {booking.location}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="hidden shrink-0 items-center gap-3 sm:flex">
                          <div className="text-right">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                              Earnings
                            </p>

                            <p className="mt-0.5 text-base font-bold text-primary-600 dark:text-primary-400">
                              {formatNaira(
                                booking.providerAmount ??
                                  booking.price
                              )}
                            </p>
                          </div>

                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-100 text-ink-500 transition-colors group-hover:bg-brand-100 group-hover:text-brand-600 dark:bg-ink-800 dark:text-ink-400 dark:group-hover:bg-brand-950/40 dark:group-hover:text-brand-400">
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Mobile amount row */}
                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-ink-100 pt-3 dark:border-ink-800 sm:hidden">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                            Your earnings
                          </p>

                          <p className="mt-0.5 text-sm font-bold text-primary-600 dark:text-primary-400">
                            {formatNaira(
                              booking.providerAmount ??
                                booking.price
                            )}
                          </p>
                        </div>

                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* =============================================
                      EXPANDED DETAILS
                  ============================================== */}

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        id={detailsId}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: 0.32,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="overflow-hidden border-t border-ink-100 dark:border-ink-800"
                      >
                        <div className="space-y-5 p-4 sm:p-5">
                          {/* Service preview */}
                          <div className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-ink-50/60 p-3 dark:border-ink-800 dark:bg-ink-800/20">
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ink-100 dark:bg-ink-800">
                              {booking.serviceImage ? (
                                <img
                                  src={booking.serviceImage}
                                  alt={booking.serviceName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-brand-50 text-brand-500 dark:bg-brand-950/30 dark:text-brand-400">
                                  <BriefcaseBusiness className="h-6 w-6" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                                Selected service
                              </p>

                              <p className="mt-0.5 truncate text-sm font-bold text-ink-900 dark:text-ink-50">
                                {booking.serviceName}
                              </p>

                              <p className="mt-0.5 truncate font-mono text-[11px] text-ink-400">
                                {booking.serviceId ||
                                  'Service ID unavailable'}
                              </p>
                            </div>

                            <div className="hidden sm:block">
                              <Badge
                                tone="success"
                                icon={CheckCircle2}
                              >
                                Payment confirmed
                              </Badge>
                            </div>
                          </div>

                          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                            {/* LEFT */}
                            <div className="space-y-5">
                              <div>
                                <div className="mb-2 flex items-center justify-between">
                                  <p className="text-xs font-bold uppercase tracking-widest text-ink-400">
                                    Customer
                                  </p>

                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                                    <UserRound className="h-4 w-4" />
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-ink-100 bg-ink-50/60 p-4 dark:border-ink-800 dark:bg-ink-800/30">
                                  <div className="flex items-center gap-3">
                                    <Avatar
                                      src={booking.customerAvatar}
                                      name={booking.customerName}
                                      size="lg"
                                      className="ring-4 ring-white shadow-md dark:ring-ink-900"
                                    />

                                    <div className="min-w-0">
                                      <h4 className="truncate text-base font-bold text-ink-900 dark:text-ink-50">
                                        {booking.customerName}
                                      </h4>

                                      <div className="mt-1.5 space-y-1">
                                        {booking.customerEmail ? (
                                          <a
                                            href={`mailto:${booking.customerEmail}`}
                                            className="flex min-w-0 items-center gap-2 text-xs text-ink-500 transition hover:text-brand-600 dark:text-ink-400 dark:hover:text-brand-400"
                                          >
                                            <Mail className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate">
                                              {
                                                booking.customerEmail
                                              }
                                            </span>
                                          </a>
                                        ) : (
                                          <p className="flex items-center gap-2 text-xs text-ink-400">
                                            <Mail className="h-3.5 w-3.5 shrink-0" />
                                            No email provided
                                          </p>
                                        )}

                                        {booking.customerPhone ? (
                                          <a
                                            href={`tel:${booking.customerPhone}`}
                                            className="flex items-center gap-2 text-xs font-medium text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                                          >
                                            <Phone className="h-3.5 w-3.5 shrink-0" />
                                            {booking.customerPhone}
                                          </a>
                                        ) : (
                                          <p className="flex items-center gap-2 text-xs text-ink-400">
                                            <Phone className="h-3.5 w-3.5 shrink-0" />
                                            No phone provided
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-ink-400">
                                  Booking details
                                </p>

                                <div className="grid gap-3 sm:grid-cols-2">
                                  <DetailItem
                                    icon={CalendarDays}
                                    label="Date"
                                    value={booking.date}
                                  />

                                  <DetailItem
                                    icon={Clock3}
                                    label="Time"
                                    value={booking.time}
                                  />

                                  <div className="sm:col-span-2">
                                    <DetailItem
                                      icon={MapPin}
                                      label="Service location"
                                      value={
                                        booking.location
                                      }
                                    />
                                  </div>
                                </div>
                              </div>

                              {booking.notes && (
                                <div className="rounded-2xl border border-accent-100 bg-accent-50/60 p-4 dark:border-accent-900/30 dark:bg-accent-950/20">
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-100 text-accent-600 dark:bg-accent-900/40 dark:text-accent-400">
                                      <MessageSquare className="h-4 w-4" />
                                    </div>

                                    <p className="text-xs font-bold uppercase tracking-widest text-accent-700 dark:text-accent-400">
                                      Customer note
                                    </p>
                                  </div>

                                  <p className="mt-3 text-sm leading-6 text-ink-700 dark:text-ink-300">
                                    “{booking.notes}”
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* RIGHT */}
                            <div className="space-y-5">
                              <div className="overflow-hidden rounded-2xl border border-ink-100 dark:border-ink-800">
                                <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50/70 px-4 py-3 dark:border-ink-800 dark:bg-ink-800/30">
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-brand-600 dark:text-brand-400" />

                                    <p className="text-sm font-bold text-ink-800 dark:text-ink-100">
                                      Payment
                                    </p>
                                  </div>

                                  <Badge
                                    tone="success"
                                    icon={CheckCircle2}
                                  >
                                    Paid
                                  </Badge>
                                </div>

                                <div className="space-y-3 p-4">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm text-ink-500">
                                      Service price
                                    </span>

                                    <span className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                                      {formatNaira(
                                        booking.price
                                      )}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm text-ink-500">
                                      Platform fee
                                    </span>

                                    <span className="text-sm text-ink-500">
                                      -
                                      {formatNaira(
                                        booking.platformFee ??
                                          0
                                      )}
                                    </span>
                                  </div>

                                  <div className="border-t border-dashed border-ink-200 pt-3 dark:border-ink-700">
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-sm font-semibold text-ink-700 dark:text-ink-300">
                                        Your earnings
                                      </span>

                                      <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                                        {formatNaira(
                                          booking.providerAmount ??
                                            booking.price
                                        )}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="rounded-xl bg-primary-50 p-3 dark:bg-primary-950/30">
                                    <div className="flex items-start gap-2">
                                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />

                                      <div>
                                        <p className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                                          Payment confirmed
                                        </p>

                                        <p className="mt-0.5 text-[11px] leading-5 text-primary-600/80 dark:text-primary-400/80">
                                          This request is
                                          ready to be
                                          completed.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="rounded-2xl border border-ink-100 p-4 dark:border-ink-800">
                                <div className="mb-4 flex items-center gap-2">
                                  <Hash className="h-4 w-4 text-ink-400" />

                                  <p className="text-sm font-bold text-ink-800 dark:text-ink-100">
                                    Booking information
                                  </p>
                                </div>

                                <div className="space-y-4">
                                  <InfoRow
                                    label="Booking ID"
                                    value={booking.id}
                                  />

                                  <InfoRow
                                    label="Service ID"
                                    value={
                                      booking.serviceId ||
                                      'Not provided'
                                    }
                                  />

                                  {booking.paymentReference && (
                                    <InfoRow
                                      label="Payment reference"
                                      value={
                                        booking.paymentReference
                                      }
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* =============================================
                      ACTIONS
                  ============================================== */}

                  <div className="flex flex-col gap-2 border-t border-ink-100 bg-ink-50/40 p-3 dark:border-ink-800 dark:bg-ink-800/10 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <button
                      type="button"
                      onClick={() =>
                        toggleExpanded(booking.id)
                      }
                      aria-expanded={isExpanded}
                      aria-controls={detailsId}
                      className="order-2 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-ink-500 transition hover:bg-ink-100 hover:text-ink-700 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-200 sm:order-1 sm:justify-start"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}

                      {isExpanded
                        ? 'Hide details'
                        : 'View details'}
                    </button>

                    <Button
                      size="sm"
                      icon={CheckCircle2}
                      loading={completing}
                      disabled={
                        completeBooking.isPending &&
                        !completing
                      }
                      onClick={() =>
                        requestComplete(booking)
                      }
                      className="order-1 w-full sm:order-2 sm:w-auto"
                    >
                      {completing
                        ? 'Completing...'
                        : 'Complete service'}
                    </Button>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* =========================================================
          COMPLETION CONFIRMATION
      ========================================================== */}

      <ResponsiveModal
        open={Boolean(confirming)}
        onClose={() => {
          if (!completeBooking.isPending) {
            setConfirming(null);
          }
        }}
        title="Complete this service?"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setConfirming(null)}
              disabled={completeBooking.isPending}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>

            <Button
              icon={CheckCircle2}
              loading={completeBooking.isPending}
              onClick={confirmComplete}
              className="w-full sm:w-auto"
            >
              Confirm completion
            </Button>
          </div>
        }
      >
        {confirming && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-lavender p-4 dark:bg-ink-800">
              <Avatar
                src={confirming.customerAvatar}
                name={confirming.customerName}
                size="lg"
              />

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink-900 dark:text-ink-50">
                  {confirming.customerName}
                </p>

                <p className="mt-0.5 truncate text-xs text-ink-500 dark:text-ink-400">
                  {confirming.serviceName}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-ink-100 p-3 dark:border-ink-800">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400">
                  Scheduled
                </p>

                <p className="mt-1 text-sm font-semibold text-ink-800 dark:text-ink-100">
                  {confirming.date}
                </p>

                <p className="text-xs text-ink-400">
                  {confirming.time}
                </p>
              </div>

              <div className="rounded-xl border border-ink-100 p-3 dark:border-ink-800">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400">
                  Your earnings
                </p>

                <p className="mt-1 text-sm font-bold text-primary-600 dark:text-primary-400">
                  {formatNaira(
                    confirming.providerAmount ??
                      confirming.price
                  )}
                </p>

                <p className="text-xs text-ink-400">
                  Payment confirmed
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-warning-50 p-3 text-xs leading-5 text-warning-700 dark:bg-warning-600/10 dark:text-warning-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

              <p>
                This marks the booking as completed and
                moves it to{' '}
                <span className="font-semibold">
                  My Bookings → Completed
                </span>
                . This action cannot be undone.
              </p>
            </div>
          </div>
        )}
      </ResponsiveModal>
    </DashboardLayout>
  );
}
