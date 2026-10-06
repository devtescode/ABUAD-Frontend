
import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  CircleDollarSign,
  Inbox,
  LoaderCircle,
  Mail,
  MapPin,
  CalendarDays,
  Wallet,
  UserRound,
  Phone,
  CreditCard,
  Hash,
  BriefcaseBusiness,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import {
  DashboardLayout,
  DashboardHeader,
} from '../../components/DashboardLayout';

import { providerNavItems } from '../../data/providerNavItems';
import { formatNaira } from '../../data/mockData';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

interface ProviderBooking {
  id: string;

  serviceId: string;
  serviceName: string;
  serviceImage?: string;

  providerId: string;
  providerName?: string;
  providerAvatar?: string;

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

  status:
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

  paymentStatus:
  | 'unpaid'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded';

  paymentReference?: string | null;

  platformFee?: number;
  providerAmount?: number;

  createdAt?: string;
  updatedAt?: string;
}

function BookingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <motion.div
          key={item}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm dark:border-ink-800 dark:bg-ink-900"
        >
          <div className="animate-pulse">
            <div className="h-28 bg-ink-100/80 dark:bg-ink-800" />

            <div className="space-y-4 p-5">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-ink-100 dark:bg-ink-800" />

                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/5 rounded bg-ink-100 dark:bg-ink-800" />
                  <div className="h-3 w-1/4 rounded bg-ink-100 dark:bg-ink-800" />
                </div>

                <div className="hidden h-10 w-28 rounded-xl bg-ink-100 sm:block dark:bg-ink-800" />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="h-16 rounded-xl bg-ink-100 dark:bg-ink-800" />
                <div className="h-16 rounded-xl bg-ink-100 dark:bg-ink-800" />
                <div className="h-16 rounded-xl bg-ink-100 dark:bg-ink-800" />
              </div>

              <div className="h-11 rounded-xl bg-ink-100 dark:bg-ink-800" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
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

export function ProviderRequests() {
  const [bookings, setBookings] = useState<ProviderBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] =
    useState<string | null>(null);

  const [expandedId, setExpandedId] =
    useState<string | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token =
    sessionStorage.getItem('servicely_token');

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError('');

      if (!token) {
        throw new Error(
          'Authentication required.'
        );
      }

      const response = await fetch(
        `${API_URL}/bookings/provider-bookings`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          'Unable to load bookings.'
        );
      }

      setBookings(data.bookings || []);
    } catch (err) {
      console.error(
        'Provider bookings error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load bookings.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  /*
   * IMPORTANT:
   * Booking Requests should ONLY contain:
   * - paid bookings
   * - active bookings
   *
   * Completed bookings are intentionally removed.
   * They remain in the backend and will appear
   * inside My Bookings -> Completed.
   */
  const activeBookings = useMemo(() => {
    return bookings.filter(
      (booking) =>
        booking.paymentStatus === 'paid' &&
        booking.status !== 'completed' &&
        !['cancelled', 'rejected'].includes(
          booking.status
        )
    );
  }, [bookings]);

  const totalEarnings = useMemo(() => {
    return activeBookings.reduce(
      (total, booking) =>
        total +
        Number(
          booking.providerAmount ??
          booking.price ??
          0
        ),
      0
    );
  }, [activeBookings]);

  const completeService = async (
    bookingId: string
  ) => {
    try {
      setCompletingId(bookingId);
      setError('');
      setSuccess('');

      if (!token) {
        throw new Error(
          'Authentication required.'
        );
      }

      const response = await fetch(
        `${API_URL}/bookings/${bookingId}/complete`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          'Unable to complete this service.'
        );
      }

      /*
       * Remove it immediately from Booking Requests.
       *
       * The booking itself is NOT deleted.
       * Its backend status becomes "completed".
       *
       * Therefore My Bookings -> Completed
       * will pick it up automatically.
       */
      setBookings((currentBookings) =>
        currentBookings.filter(
          (booking) =>
            booking.id !== bookingId
        )
      );

      setExpandedId(null);

      setSuccess(
        'Service completed successfully. It has been moved to your completed bookings.'
      );

      setTimeout(() => {
        setSuccess('');
      }, 4000);
    } catch (err) {
      console.error(
        'Complete service error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to complete service.'
      );
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <DashboardLayout
      role="provider"
      navItems={providerNavItems}
    >
      <DashboardHeader
        title="Booking Requests"
        subtitle="Manage your active paid bookings and complete customer services"
      />

      {/* =========================================================
          NOTIFICATIONS
      ========================================================== */}

      <AnimatePresence mode="wait">
        {success && (
          <motion.div
            initial={{
              opacity: 0,
              y: -12,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -12,
              scale: 0.98,
            }}
            className="mb-5 flex items-start gap-3 rounded-2xl border border-primary-200 bg-primary-50 px-4 py-4 shadow-sm dark:border-primary-900/50 dark:bg-primary-950/30"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary-800 dark:text-primary-300">
                Service completed
              </p>

              <p className="mt-0.5 text-xs leading-5 text-primary-700/80 dark:text-primary-300/80">
                {success}
              </p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{
              opacity: 0,
              y: -12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -12,
            }}
            className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          TOP STATS
      ========================================================== */}

      {!loading && (
        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {/* Active bookings */}
          <div className="group relative overflow-hidden rounded-2xl border border-ink-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-ink-800 dark:bg-ink-900">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary-500/5 blur-2xl" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink-500 dark:text-ink-400">
                  Active Bookings
                </p>

                <p className="mt-1 text-3xl font-bold tracking-tight text-ink-900 dark:text-ink-50">
                  {activeBookings.length}
                </p>

                <p className="mt-1 text-xs text-ink-400">
                  Paid and awaiting completion
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div className="group relative overflow-hidden rounded-2xl border border-ink-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-ink-800 dark:bg-ink-900">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent-500/5 blur-2xl" />

            <div className="relative flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink-500 dark:text-ink-400">
                  Active Earnings
                </p>

                <p className="mt-1 truncate text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-50">
                  {formatNaira(totalEarnings)}
                </p>

                <p className="mt-1 text-xs text-ink-400">
                  Provider share
                </p>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-100 text-accent-600 dark:bg-accent-950/30 dark:text-accent-400">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Payment status */}
          <div className="group relative overflow-hidden rounded-2xl border border-ink-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-ink-800 dark:bg-ink-900">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary-500/5 blur-2xl" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink-500 dark:text-ink-400">
                  Payment Status
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary-500 shadow-[0_0_0_4px_rgba(34,197,94,0.10)]" />

                  <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                    Payments Confirmed
                  </span>
                </div>

                <p className="mt-1 text-xs text-ink-400">
                  Only paid bookings shown
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
                <CircleDollarSign className="h-5 w-5" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* =========================================================
          LOADING
      ========================================================== */}

      {loading ? (
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          className="relative"
        >
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-60 blur-3xl">
            <div className="absolute left-1/4 top-10 h-40 w-40 rounded-full bg-primary-400/20" />
            <div className="absolute right-1/4 top-32 h-32 w-32 rounded-full bg-accent-400/20" />
          </div>

          <BookingSkeleton />

          
        </motion.div>
      ) : activeBookings.length === 0 ? (
        /* =======================================================
           EMPTY STATE
        ======================================================== */

        <motion.div
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="relative flex min-h-[390px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-ink-200 bg-white px-6 text-center shadow-sm dark:border-ink-700 dark:bg-ink-900"
        >
          <div className="pointer-events-none absolute -left-20 -top-20 h-52 w-52 rounded-full bg-primary-500/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-52 w-52 rounded-full bg-accent-500/5 blur-3xl" />

          <motion.div
            initial={{
              scale: 0.8,
              opacity: 0,
            }}
            animate={{
              scale: 1,
              opacity: 1,
            }}
            transition={{
              type: 'spring',
              stiffness: 180,
              damping: 15,
            }}
            className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-ink-100 text-ink-400 shadow-inner dark:bg-ink-800"
          >
            <Inbox className="h-9 w-9" />

            <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-4 border-white bg-primary-500 dark:border-ink-900" />
          </motion.div>

          <h3 className="mt-6 text-xl font-bold text-ink-900 dark:text-ink-50">
            No active bookings
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-ink-500 dark:text-ink-400">
            Paid customer bookings will appear here.
            Once you complete a service, it will
            automatically move to your Completed
            bookings.
          </p>

          <div className="mt-6 flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-xs font-medium text-primary-700 dark:bg-primary-950/30 dark:text-primary-300">
            <CheckCircle2 className="h-4 w-4" />
            Payment-confirmed bookings only
          </div>
        </motion.div>
      ) : (
        /* =======================================================
           ACTIVE BOOKINGS
        ======================================================== */

        <div className="space-y-4">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">
                Active Booking
              </h2>

              <p className="mt-0.5 text-xs text-ink-400">
                Click a booking to view complete details
              </p>
            </div>

            <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">
              {activeBookings.length}{' '}
              {activeBookings.length === 1
                ? 'booking'
                : 'bookings'}
            </span>
          </div>

          <AnimatePresence mode="popLayout">
            {activeBookings.map(
              (booking, index) => {
                const isExpanded =
                  expandedId === booking.id;

                const isCompleting =
                  completingId === booking.id;

                return (
                  <motion.div
                    layout
                    key={booking.id}
                    initial={{
                      opacity: 0,
                      y: 20,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.96,
                      y: -10,
                    }}
                    transition={{
                      duration: 0.35,
                      delay: index * 0.05,
                    }}
                    className="group overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl dark:border-ink-800 dark:bg-ink-900"
                  >
                    {/* =================================================
                        COMPACT BOOKING HEADER
                    ================================================== */}

                    {/* =================================================
    COMPACT BOOKING HEADER
================================================== */}

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(
                          isExpanded
                            ? null
                            : booking.id
                        )
                      }
                      className="w-full text-left"
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex items-center gap-4">
                          {/* Small service thumbnail */}
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-ink-100 shadow-sm dark:bg-ink-800 sm:h-[72px] sm:w-[72px]">
                            {booking.serviceImage ? (
                              <img
                                src={booking.serviceImage}
                                alt={booking.serviceName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-primary-50 text-primary-500 dark:bg-primary-950/30 dark:text-primary-400">
                                <BriefcaseBusiness className="h-6 w-6" />
                              </div>
                            )}

                            {/* Paid indicator */}
                            <span className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-primary-500 text-white shadow-sm dark:border-ink-900">
                              <Check className="h-3 w-3" />
                            </span>
                          </div>

                          {/* Main booking information */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 text-[10px] font-bold text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                                PAID
                              </span>

                              <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2.5 py-1 text-[10px] font-bold text-accent-700 dark:bg-accent-950/30 dark:text-accent-300">
                                <Clock3 className="h-3 w-3" />
                                ACTIVE
                              </span>
                            </div>

                            <h3 className="mt-2 truncate text-base font-bold text-ink-900 dark:text-ink-50 sm:text-lg">
                              {booking.serviceName}
                            </h3>

                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
                              <span>
                                Customer:{" "}
                                <span className="font-medium text-ink-600 dark:text-ink-300">
                                  {booking.customerName}
                                </span>
                              </span>

                              <span className="hidden sm:inline">
                                •
                              </span>

                              <span>
                                {booking.date} at {booking.time}
                              </span>
                            </div>
                          </div>

                          {/* Amount + expand button */}
                          <div className="flex shrink-0 items-center gap-3">
                            <div className="hidden text-right sm:block">
                              <p className="text-[10px] font-medium uppercase tracking-wider text-ink-400">
                                Earnings
                              </p>

                              <p className="mt-0.5 text-sm font-bold text-primary-600 dark:text-primary-400">
                                {formatNaira(
                                  booking.providerAmount ??
                                  booking.price
                                )}
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-500 transition-colors group-hover:bg-primary-100 group-hover:text-primary-600 dark:bg-ink-800 dark:text-ink-400 dark:group-hover:bg-primary-950/40 dark:group-hover:text-primary-400">
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Mobile amount */}
                        <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3 dark:border-ink-800 sm:hidden">
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-primary-500" />

                            <span className="text-xs text-ink-400">
                              Your earnings
                            </span>
                          </div>

                          <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                            {formatNaira(
                              booking.providerAmount ??
                              booking.price
                            )}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* =================================================
                        EXPANDED DETAILS
                    ================================================== */}

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{
                            height: 0,
                            opacity: 0,
                          }}
                          animate={{
                            height: 'auto',
                            opacity: 1,
                          }}
                          exit={{
                            height: 0,
                            opacity: 0,
                          }}
                          transition={{
                            duration: 0.35,
                            ease: [
                              0.22,
                              1,
                              0.36,
                              1,
                            ],
                          }}
                          className="overflow-hidden"
                        >
                          {/* =====================================
    SERVICE PREVIEW
====================================== */}

                          <div className="mb-6 p-3 overflow-hidden rounded-2xl border border-ink-100 bg-ink-50/50 dark:border-ink-800 dark:bg-ink-800/20">
                            <div className="flex flex-col sm:flex-row">
                              {/* Service image */}
                              <div className="relative h-52 w-full shrink-0 overflow-hidden sm:h-auto sm:w-56">
                                {booking.serviceImage ? (
                                  <img
                                    src={booking.serviceImage}
                                    alt={booking.serviceName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full min-h-[180px] w-full items-center justify-center bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-950/40 dark:to-accent-950/30">
                                    <BriefcaseBusiness className="h-10 w-10 text-ink-400" />
                                  </div>
                                )}

                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                                <div className="absolute bottom-3 left-3">
                                  <span className="rounded-full bg-black/40 px-3 py-1.5 text-[10px] font-semibold text-white backdrop-blur-md">
                                    Service
                                  </span>
                                </div>
                              </div>

                              {/* Service information */}
                              <div className="flex min-w-0 flex-1 flex-col justify-center p-5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
                                  Selected Service
                                </p>

                                <h3 className="mt-2 text-xl font-bold text-ink-900 dark:text-ink-50">
                                  {booking.serviceName}
                                </h3>

                                <div className="mt-3 flex items-start gap-2">
                                  <Hash className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />

                                  <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
                                      Service ID
                                    </p>

                                    <p className="mt-1 break-all font-mono text-xs text-ink-500 dark:text-ink-400">
                                      {booking.serviceId}
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1.5 text-xs font-semibold text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Payment Confirmed
                                  </span>

                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1.5 text-xs font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                                    <Clock3 className="h-3.5 w-3.5" />
                                    Active Booking
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="border-t border-ink-100 dark:border-ink-800">
                            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.15fr_0.85fr]">
                              {/* =====================================
                                  LEFT SIDE
                              ====================================== */}

                              <div className="space-y-6">
                                {/* Customer profile */}
                                <div>
                                  <div className="mb-3 flex items-center justify-between">
                                    <div>
                                      <p className="text-xs font-bold uppercase tracking-widest text-ink-400">
                                        Customer
                                      </p>

                                      <p className="mt-0.5 text-xs text-ink-400">
                                        Customer information
                                      </p>
                                    </div>

                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
                                      <UserRound className="h-4 w-4" />
                                    </div>
                                  </div>

                                  <div className="rounded-2xl border border-ink-100 bg-ink-50/60 p-4 dark:border-ink-800 dark:bg-ink-800/30">
                                    <div className="flex items-center gap-4">
                                      {booking.customerAvatar ? (
                                        <img
                                          src={
                                            booking.customerAvatar
                                          }
                                          alt={
                                            booking.customerName
                                          }
                                          className="h-14 w-14 shrink-0 rounded-full object-cover ring-4 ring-white shadow-md dark:ring-ink-800"
                                        />
                                      ) : (
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700 ring-4 ring-white dark:bg-primary-950/40 dark:text-primary-300 dark:ring-ink-800">
                                          {booking.customerName
                                            ?.charAt(
                                              0
                                            )
                                            .toUpperCase() ||
                                            'C'}
                                        </div>
                                      )}

                                      <div className="min-w-0">
                                        <h4 className="truncate text-base font-bold text-ink-900 dark:text-ink-50">
                                          {
                                            booking.customerName
                                          }
                                        </h4>

                                        <div className="mt-2 flex flex-col gap-1.5">
                                          <div className="flex min-w-0 items-center gap-2 text-xs text-ink-500">
                                            <Mail className="h-3.5 w-3.5 shrink-0" />

                                            <span className="truncate">
                                              {booking.customerEmail ||
                                                'No email provided'}
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-2 text-xs font-medium text-primary-600 dark:text-primary-400">
                                            <Phone className="h-3.5 w-3.5 shrink-0" />

                                            <span>
                                              {booking.customerPhone ||
                                                'No phone provided'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Booking details */}
                                <div>
                                  <div className="mb-3">
                                    <p className="text-xs font-bold uppercase tracking-widest text-ink-400">
                                      Booking Details
                                    </p>
                                  </div>

                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <DetailItem
                                      icon={
                                        CalendarDays
                                      }
                                      label="Date"
                                      value={
                                        booking.date
                                      }
                                    />

                                    <DetailItem
                                      icon={Clock3}
                                      label="Time"
                                      value={
                                        booking.time
                                      }
                                    />

                                    <div className="sm:col-span-2">
                                      <DetailItem
                                        icon={MapPin}
                                        label="Service Location"
                                        value={
                                          booking.location ||
                                          'Not provided'
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Customer note */}
                                {booking.notes && (
                                  <div className="rounded-2xl border border-accent-100 bg-accent-50/60 p-4 dark:border-accent-900/30 dark:bg-accent-950/20">
                                    <div className="flex items-center gap-2">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-100 text-accent-600 dark:bg-accent-900/40 dark:text-accent-400">
                                        <BriefcaseBusiness className="h-4 w-4" />
                                      </div>

                                      <p className="text-xs font-bold uppercase tracking-widest text-accent-700 dark:text-accent-400">
                                        Customer Note
                                      </p>
                                    </div>

                                    <p className="mt-3 text-sm leading-6 text-ink-700 dark:text-ink-300">
                                      “
                                      {
                                        booking.notes
                                      }
                                      ”
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* =====================================
                                  RIGHT SIDE
                              ====================================== */}

                              <div className="space-y-5">
                                {/* Payment */}
                                <div className="overflow-hidden rounded-2xl border border-ink-100 dark:border-ink-800">
                                  <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50/70 px-4 py-3 dark:border-ink-800 dark:bg-ink-800/30">
                                    <div className="flex items-center gap-2">
                                      <CreditCard className="h-4 w-4 text-primary-600 dark:text-primary-400" />

                                      <p className="text-sm font-bold text-ink-800 dark:text-ink-100">
                                        Payment
                                      </p>
                                    </div>

                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-1 text-[10px] font-bold text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">
                                      <CheckCircle2 className="h-3 w-3" />
                                      PAID
                                    </span>
                                  </div>

                                  <div className="space-y-3 p-4">
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-sm text-ink-500">
                                        Service price
                                      </span>

                                      <span className="font-semibold text-ink-900 dark:text-ink-50">
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
                                            This booking is
                                            eligible for
                                            completion.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* IDs / references */}
                                <div className="rounded-2xl border border-ink-100 p-4 dark:border-ink-800">
                                  <div className="mb-4 flex items-center gap-2">
                                    <Hash className="h-4 w-4 text-ink-400" />

                                    <p className="text-sm font-bold text-ink-800 dark:text-ink-100">
                                      Booking Information
                                    </p>
                                  </div>

                                  <div className="space-y-4">
                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400">
                                        Booking ID
                                      </p>

                                      <p className="mt-1 break-all font-mono text-xs text-ink-500">
                                        {booking.id}
                                      </p>
                                    </div>

                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400">
                                        Service ID
                                      </p>

                                      <p className="mt-1 break-all font-mono text-xs text-ink-500">
                                        {
                                          booking.serviceId
                                        }
                                      </p>
                                    </div>

                                    {booking.paymentReference && (
                                      <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400">
                                          Payment Reference
                                        </p>

                                        <p className="mt-1 break-all font-mono text-xs text-ink-500">
                                          {
                                            booking.paymentReference
                                          }
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* =========================================
                                COMPLETION FOOTER
                            ========================================== */}

                            <div className="border-t border-ink-100 bg-ink-50/60 px-5 py-4 dark:border-ink-800 dark:bg-ink-800/20 sm:px-6">
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">
                                    Finished this customer's
                                    service?
                                  </p>

                                  <p className="mt-1 text-xs text-ink-400">
                                    Marking it completed will
                                    move it out of Booking
                                    Requests and into your
                                    Completed bookings.
                                  </p>
                                </div>

                                <motion.button
                                  type="button"
                                  whileHover={
                                    !isCompleting
                                      ? {
                                        scale: 1.02,
                                      }
                                      : undefined
                                  }
                                  whileTap={
                                    !isCompleting
                                      ? {
                                        scale: 0.98,
                                      }
                                      : undefined
                                  }
                                  onClick={() =>
                                    completeService(
                                      booking.id
                                    )
                                  }
                                  disabled={
                                    isCompleting
                                  }
                                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                                >
                                  {isCompleting ? (
                                    <>
                                      <LoaderCircle className="h-4 w-4 animate-spin" />
                                      Completing...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="h-4 w-4" />
                                      Mark as Completed
                                    </>
                                  )}
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              }
            )}
          </AnimatePresence>
        </div>
      )}
    </DashboardLayout>
  );
}

