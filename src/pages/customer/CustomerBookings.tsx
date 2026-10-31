import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Eye,
  FileText,
  MapPin,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { customerNavItems } from "@/data/customerNavItems";
import {
  DashboardLayout,
  DashboardHeader,
  StatCard,
} from "@/components/DashboardLayout";
import { formatNaira } from "@/data/mockData";
import {
  Avatar,
  BookingStatusBadge,
  Button,
  EmptyState,
  ErrorState,
  ResponsiveModal,
  Skeleton,
} from "@/components/ui";
import { getApiErrorMessage, hasUserToken } from "@/lib/api";
import { useCustomerBookings } from "@/hooks/queries";

const INVALID_BOOKINGS_KEY = "servicely_invalid_bookings";

interface PaymentInfo {
  status: string;
  reference: string | null;
  transactionId: string | null;
  amount: number;
  currency: string;
  channel: string | null;
  gatewayResponse: string | null;
  paidAt: string | null;
}

interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;

  providerId: string;
  providerName: string;
  providerAvatar: string;

  customerName: string;

  date: string;
  time: string;
  location: string;

  price: number;
  notes: string;

  status: string;
  createdAt: string;

  payment: PaymentInfo;

  paymentReference: string | null;
  paymentStatus: string;

  platformFee: number;
  providerAmount: number;

  bookingStatus: string;

  serviceDetails: {
    title: string;
    category: string;
    duration: string;
    description: string;
    image: string | null;
  };
}

type Filter =
  | "all"
  | "pending"
  | "payment_pending"
  | "paid"
  | "completed"
  | "cancelled";

const TABS: {
  id: Filter;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "all", label: "All", icon: Receipt },
  { id: "pending", label: "Pending", icon: Clock3 },
  { id: "payment_pending", label: "Payment pending", icon: CreditCard },
  { id: "paid", label: "Paid", icon: ShieldCheck },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
  { id: "cancelled", label: "Cancelled", icon: XCircle },
];

/* ======================================================
   INVALID BOOKING STORAGE
====================================================== */

function getInvalidBookingIds(): string[] {
  try {
    const stored = sessionStorage.getItem(INVALID_BOOKINGS_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed)
      ? parsed.filter(
        (id): id is string =>
          typeof id === "string" && id.trim().length > 0
      )
      : [];
  } catch {
    return [];
  }
}

function markBookingAsInvalid(bookingId: string) {
  if (!bookingId) return;

  try {
    const existing = getInvalidBookingIds();

    if (!existing.includes(bookingId)) {
      sessionStorage.setItem(
        INVALID_BOOKINGS_KEY,
        JSON.stringify([...existing, bookingId])
      );
    }
  } catch (error) {
    console.error("Unable to save invalid booking:", error);
  }
}

/* ======================================================
   MAIN COMPONENT
====================================================== */

export function CustomerBookings() {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useCustomerBookings();

  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);

  const [selectedBooking, setSelectedBooking] =
    useState<Booking | null>(null);

  /**
   * IDs reported as invalid after mount. The query cache may still hold
   * them until the next successful refetch, so we dismiss them locally
   * as well as persisting them for future loads.
   */
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  /**
   * --------------------------------------------------
   * REMOVE INVALID BOOKING FROM CURRENT VIEW
   * --------------------------------------------------
   */
  useEffect(() => {
    const handleInvalidBooking = (event: Event) => {
      const customEvent = event as CustomEvent<{
        bookingId?: string;
      }>;

      const bookingId = customEvent.detail?.bookingId;

      if (!bookingId) {
        return;
      }

      markBookingAsInvalid(bookingId);

      setDismissedIds((current) =>
        current.includes(bookingId)
          ? current
          : [...current, bookingId]
      );

      setSelectedBooking((current) =>
        current?.id === bookingId ? null : current
      );
    };

    window.addEventListener(
      "servicely:booking-not-found",
      handleInvalidBooking
    );

    return () => {
      window.removeEventListener(
        "servicely:booking-not-found",
        handleInvalidBooking
      );
    };
  }, []);

  /**
   * --------------------------------------------------
   * VALID BOOKINGS
   * --------------------------------------------------
   *
   * Remove:
   * 1. Records without an ID.
   * 2. Records previously confirmed as invalid.
   * 3. Payment-pending records without a valid service ID.
   */
  const validBookings = useMemo(() => {
    const invalidIds = new Set([
      ...getInvalidBookingIds(),
      ...dismissedIds,
    ]);

    return (data ?? [])
      .map((record) => record as unknown as Booking)
      .filter((booking) => {
        if (!booking?.id) {
          return false;
        }

        if (invalidIds.has(booking.id)) {
          return false;
        }

        if (
          (booking.paymentStatus === "unpaid" ||
            booking.paymentStatus === "pending") &&
          !booking.serviceId
        ) {
          return false;
        }

        return true;
      });
  }, [data, dismissedIds]);

  /**
   * --------------------------------------------------
   * FILTER BOOKINGS
   * --------------------------------------------------
   */
  const filteredBookings = useMemo(() => {
    if (filter === "all") {
      return validBookings;
    }

    if (filter === "pending") {
      return validBookings.filter(
        (booking) => booking.bookingStatus === "pending"
      );
    }

    if (filter === "payment_pending") {
      return validBookings.filter(
        (booking) =>
          (booking.paymentStatus === "unpaid" ||
            booking.paymentStatus === "pending") &&
          Boolean(booking.id) &&
          Boolean(booking.serviceId)
      );
    }

    if (filter === "paid") {
      return validBookings.filter(
        (booking) => booking.paymentStatus === "paid"
      );
    }

    if (filter === "completed") {
      return validBookings.filter(
        (booking) => booking.bookingStatus === "completed"
      );
    }

    if (filter === "cancelled") {
      return validBookings.filter(
        (booking) => booking.bookingStatus === "cancelled"
      );
    }

    return validBookings;
  }, [validBookings, filter]);

  const bookingsPerPage = 4;
  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * bookingsPerPage,
    currentPage * bookingsPerPage
  );
  const firstBookingOnPage =
    filteredBookings.length === 0
      ? 0
      : (currentPage - 1) * bookingsPerPage + 1;
  const lastBookingOnPage = Math.min(
    currentPage * bookingsPerPage,
    filteredBookings.length
  );

  /**
   * --------------------------------------------------
   * COUNTS
   * --------------------------------------------------
   */
  const counts = useMemo(
    () => ({
      all: validBookings.length,

      pending: validBookings.filter(
        (booking) => booking.bookingStatus === "pending"
      ).length,

      payment_pending: validBookings.filter(
        (booking) =>
          (booking.paymentStatus === "unpaid" ||
            booking.paymentStatus === "pending") &&
          Boolean(booking.id) &&
          Boolean(booking.serviceId)
      ).length,

      paid: validBookings.filter(
        (booking) => booking.paymentStatus === "paid"
      ).length,

      completed: validBookings.filter(
        (booking) => booking.bookingStatus === "completed"
      ).length,

      cancelled: validBookings.filter(
        (booking) => booking.bookingStatus === "cancelled"
      ).length,
    }),
    [validBookings]
  );

  const activeTab = TABS.find((tab) => tab.id === filter);

  const sessionExpired = !hasUserToken();
  const apiError = isError ? getApiErrorMessage(error) : "";

  const hasData = filteredBookings.length > 0;
  const showFullError =
    !isLoading &&
    (sessionExpired || (!hasData && Boolean(apiError)));
  const showRefreshError =
    !isLoading && !sessionExpired && hasData && Boolean(apiError);
  const showUpdating = isFetching && !isLoading;

  const emptyTitle =
    filter === "all"
      ? "No bookings yet"
      : `No ${activeTab?.label.toLowerCase() ?? "matching"} bookings`;

  const emptyDescription =
    filter === "all"
      ? "Book a service to see your bookings, payment status and booking details here."
      : filter === "payment_pending"
        ? "You don't have any payments waiting to be completed."
        : `You don't have any ${filter.replace(
          "_",
          " "
        )} bookings.`;

  return (
    <DashboardLayout
      role="customer"
      navItems={customerNavItems}
    >
      <DashboardHeader
        title="My Bookings"
        subtitle="Track your services, payments and booking details."
        action={
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            loading={isFetching}
            onClick={() => refetch()}
            aria-label="Refresh bookings"
          >
            Refresh
          </Button>
        }
      />

      <div className="space-y-6" aria-busy={isFetching}>
        {/* ==================================================
            SUMMARY
        ================================================== */}

        {isLoading ? (
          <SummarySkeleton />
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Total bookings"
              value={String(counts.all)}
              icon={Receipt}
              color="brand"
            />

            <StatCard
              label="Pending"
              value={String(counts.pending)}
              icon={Clock3}
              color="warning"
            />

            <StatCard
              label="Paid"
              value={String(counts.paid)}
              icon={CreditCard}
              color="success"
            />

            <StatCard
              label="Completed"
              value={String(counts.completed)}
              icon={CheckCircle2}
              color="sky"
            />
          </div>
        )}

        {/* ==================================================
            FILTER CHIPS + RESULT COUNT
        ================================================== */}

        <div className="space-y-3">
          <div
            role="group"
            aria-label="Filter bookings"
            className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = filter === tab.id;
              const count = counts[tab.id];

              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={active}
                  aria-label={`${tab.label} (${count})`}
                  onClick={() => {
                    setFilter(tab.id);
                    setPage(1);
                  }}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                    active
                      ? "bg-brand-600 text-white shadow-soft"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:border-ink-600 dark:hover:text-ink-50"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      active
                        ? "text-white"
                        : "text-slate-400 dark:text-ink-500"
                    }`}
                  />

                  {tab.label}

                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-500 dark:bg-ink-800 dark:text-ink-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
            <p className="text-xs font-medium text-slate-500 dark:text-ink-400">
              Showing{" "}
              <span className="font-semibold text-slate-900 dark:text-ink-50">
                {filteredBookings.length}
              </span>{" "}
              of {counts.all}{" "}
              {counts.all === 1 ? "booking" : "bookings"}
              {filter !== "all" && activeTab ? (
                <span className="ml-1 text-slate-400 dark:text-ink-500">
                  · {activeTab.label}
                </span>
              ) : null}
            </p>

            {showUpdating ? (
              <span
                aria-live="polite"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-600 dark:text-brand-300"
              >
                <RefreshCw className="h-3 w-3 animate-spin" />
                Updating bookings…
              </span>
            ) : null}
          </div>
        </div>

        {/* ==================================================
            REFRESH ERROR (data already on screen)
        ================================================== */}

        {showRefreshError ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-danger-100 bg-danger-50/60 p-4 dark:border-danger-500/20 dark:bg-danger-500/5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger-500 dark:text-danger-200" />

              <div>
                <p className="text-sm font-semibold text-danger-700 dark:text-danger-200">
                  Unable to refresh bookings
                </p>

                <p className="mt-0.5 text-xs text-danger-600 dark:text-danger-200/80">
                  {apiError}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              loading={isFetching}
              onClick={() => refetch()}
              className="shrink-0"
            >
              Try again
            </Button>
          </div>
        ) : null}

        {/* ==================================================
            LOADING / ERROR / EMPTY / BOOKINGS
        ================================================== */}

        {isLoading ? (
          <BookingSkeleton />
        ) : showFullError ? (
          <ErrorState
            message={
              sessionExpired
                ? "Your session has expired. Please log in again to view your bookings."
                : apiError || "Unable to load your bookings."
            }
            onRetry={
              sessionExpired ? undefined : () => refetch()
            }
          />
        ) : !hasData ? (
          <EmptyState
            icon={Calendar}
            title={emptyTitle}
            description={emptyDescription}
            action={
              filter === "all" ? (
                <Link to="/customer/browse" className="btn-primary">
                  <Search className="h-4 w-4" />
                  Browse Services
                </Link>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setFilter("all")}
                >
                  Show all bookings
                </Button>
              )
            }
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {paginatedBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onView={() => setSelectedBooking(booking)}
              />
            ))}
          </motion.div>
        )}

        {!isLoading && !showFullError && hasData ? (
          <nav
            aria-label="Booking results pagination"
            className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 shadow-card sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-ink-800 dark:bg-ink-900"
          >
            <p
              aria-live="polite"
              className="text-sm text-slate-500 dark:text-ink-400"
            >
              Showing{" "}
              <span className="font-semibold text-slate-800 dark:text-ink-100">
                {firstBookingOnPage}–{lastBookingOnPage}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-800 dark:text-ink-100">
                {filteredBookings.length}
              </span>{" "}
              bookings
            </p>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="text-xs font-medium tabular-nums text-slate-500 dark:text-ink-400">
                Page {currentPage} of {Math.max(totalPages, 1)}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous page"
                  title="Previous page"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-brand-300 hover:bg-lavender hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:border-ink-600 dark:hover:bg-ink-700 dark:hover:text-ink-50 dark:disabled:hover:border-ink-700 dark:disabled:hover:bg-ink-800 dark:disabled:hover:text-ink-300"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Next page"
                  title="Next page"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-brand-300 hover:bg-lavender hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:border-ink-600 dark:hover:bg-ink-700 dark:hover:text-ink-50 dark:disabled:hover:border-ink-700 dark:disabled:hover:bg-ink-800 dark:disabled:hover:text-ink-300"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </nav>
        ) : null}
      </div>

      {/* ==================================================
          DETAILS MODAL
      ================================================== */}

      {selectedBooking ? (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      ) : null}
    </DashboardLayout>
  );
}

/* ======================================================
   BOOKING CARD
====================================================== */

function BookingCard({
  booking,
  onView,
}: {
  booking: Booking;
  onView: () => void;
}) {
  const isPaid = booking.paymentStatus === "paid";

  const needsPayment =
    booking.paymentStatus === "unpaid" ||
    booking.paymentStatus === "pending";

  const isCompleted = booking.bookingStatus === "completed";

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card group relative overflow-hidden transition-shadow hover:shadow-card-hover"
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1 ${bookingAccent(
          booking.bookingStatus
        )}`}
      />

      <div className="p-4 pl-5 sm:p-5 sm:pl-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3.5">
            <Avatar
              src={booking.providerAvatar}
              name={booking.providerName}
              size="md"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-ink-50 sm:text-base">
                  {booking.serviceName}
                </h3>

                <BookingStatusBadge
                  status={booking.bookingStatus}
                />
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-ink-400">
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <UserRound className="h-3.5 w-3.5 shrink-0" />

                  <span className="truncate">
                    {booking.providerName}
                  </span>
                </span>

                {booking.serviceDetails?.category ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="text-slate-300 dark:text-ink-600"
                    >
                      •
                    </span>

                    <span className="truncate text-slate-500 dark:text-ink-400">
                      {booking.serviceDetails.category}
                    </span>
                  </>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {booking.date ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                    <Calendar className="h-3 w-3" />
                    {formatBookingDate(booking.date)}
                  </span>
                ) : null}

                <InfoPill
                  icon={<Clock3 />}
                  text={booking.time}
                />

                <InfoPill
                  icon={<MapPin />}
                  text={booking.location}
                />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-end justify-between gap-3 border-t border-slate-100 pt-3 dark:border-ink-800 sm:flex-col sm:border-0 sm:pt-0 sm:text-right">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-ink-500">
                Total
              </p>

              <p className="mt-0.5 text-lg font-bold tracking-tight text-slate-900 dark:text-ink-50">
                {formatNaira(booking.price)}
              </p>
            </div>

            <PaymentBadge status={booking.paymentStatus} />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-ink-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-slate-400 dark:text-ink-500">
            {booking.createdAt
              ? `Booked ${formatDateTime(booking.createdAt)}`
              : "Booking details available below"}
          </p>

          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
            {needsPayment ? (
              <Link
                to={`/payment/${booking.id}`}
                className="btn-primary btn-sm w-full sm:w-auto"
                aria-label={`Pay for ${booking.serviceName}`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                Pay now
              </Link>
            ) : null}

            <button
              type="button"
              onClick={onView}
              className="btn-outline btn-sm w-full sm:w-auto"
              aria-label={`View details for ${booking.serviceName}`}
            >
              <Eye className="h-3.5 w-3.5" />
              Details
            </button>

            {isCompleted ? (
              <Link
                to={`/review/${booking.id}`}
                className="btn-outline btn-sm w-full sm:w-auto"
              >
                Leave review
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* PAYMENT CONFIRMATION */}
      {isPaid ? (
        <div className="flex flex-col gap-1.5 border-t border-success-100 bg-success-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-success-600/30 dark:bg-success-600/10">
          <div className="flex items-center gap-2 text-xs font-semibold text-success-700 dark:text-success-200">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Payment confirmed by Paystack
          </div>

          {booking.payment?.reference ? (
            <span className="truncate font-mono text-[10px] text-success-600 dark:text-success-200/80">
              {booking.payment.reference}
            </span>
          ) : null}
        </div>
      ) : null}
    </motion.article>
  );
}

/* ======================================================
   DETAILS MODAL
====================================================== */

function BookingDetailsModal({
  booking,
  onClose,
}: {
  booking: Booking;
  onClose: () => void;
}) {
  const isPaid = booking.paymentStatus === "paid";

  const needsPayment =
    booking.paymentStatus === "unpaid" ||
    booking.paymentStatus === "pending";

  const isCompleted = booking.bookingStatus === "completed";

  const payment = booking.payment ?? ({} as PaymentInfo);

  return (
    <ResponsiveModal
      open
      onClose={onClose}
      title="Booking details"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {needsPayment ? (
            <Link
              to={`/payment/${booking.id}`}
              onClick={onClose}
              className="btn-primary w-full sm:w-auto"
            >
              <CreditCard className="h-4 w-4" />
              Complete payment
            </Link>
          ) : null}

          {isCompleted ? (
            <Link
              to={`/review/${booking.id}`}
              onClick={onClose}
              className="btn-outline w-full sm:w-auto"
            >
              Leave review
            </Link>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="btn-outline w-full sm:w-auto"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* SERVICE */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/70 dark:border-ink-800">
          {booking.serviceDetails?.image ? (
            <img
              src={booking.serviceDetails.image}
              alt={booking.serviceDetails.title}
              className="h-40 w-full object-cover"
            />
          ) : null}

          <div className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-ink-50">
                {booking.serviceDetails?.title ||
                  booking.serviceName}
              </h3>

              {booking.serviceDetails?.category ? (
                <span className="badge bg-lavender text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  {booking.serviceDetails.category}
                </span>
              ) : null}
            </div>

            {booking.serviceDetails?.description ? (
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-ink-400">
                {booking.serviceDetails.description}
              </p>
            ) : null}
          </div>
        </section>

        {/* PROVIDER */}
        <section>
          <SectionTitle
            icon={<UserRound />}
            title="Provider"
          />

          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-ink-800/60">
            <Avatar
              src={booking.providerAvatar}
              name={booking.providerName}
              size="md"
            />

            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-ink-50">
                {booking.providerName}
              </p>

              <p className="text-xs text-slate-500 dark:text-ink-400">
                Service provider
              </p>
            </div>
          </div>
        </section>

        {/* BOOKING INFORMATION */}
        <section>
          <SectionTitle
            icon={<Calendar />}
            title="Booking information"
          />

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <DetailItem
              icon={<Calendar />}
              label="Date"
              value={formatBookingDate(booking.date)}
            />

            <DetailItem
              icon={<Clock3 />}
              label="Time"
              value={booking.time}
            />

            <DetailItem
              icon={<MapPin />}
              label="Location"
              value={booking.location}
            />

            <div className="rounded-2xl bg-slate-50 p-3.5 dark:bg-ink-800/60">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-ink-500">
                <FileText className="h-3 w-3" />
                Booking status
              </div>

              <div className="mt-2">
                <BookingStatusBadge
                  status={booking.bookingStatus}
                />
              </div>
            </div>
          </div>
        </section>

        {/* NOTES */}
        {booking.notes ? (
          <section>
            <SectionTitle
              icon={<FileText />}
              title="Your notes"
            />

            <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:bg-ink-800/60 dark:text-ink-300">
              {booking.notes}
            </div>
          </section>
        ) : null}

        {/* PAYMENT */}
        <section>
          <SectionTitle
            icon={<CreditCard />}
            title="Payment information"
          />

          <div
            className={`mt-3 overflow-hidden rounded-2xl border ${
              isPaid
                ? "border-success-100 dark:border-success-600/30"
                : "border-slate-200 dark:border-ink-800"
            }`}
          >
            <div
              className={`flex items-center justify-between px-4 py-4 ${
                isPaid
                  ? "bg-success-50 dark:bg-success-600/10"
                  : "bg-slate-50 dark:bg-ink-800/50"
              }`}
            >
              <div className="flex items-center gap-2">
                {isPaid ? (
                  <CheckCircle2 className="h-5 w-5 text-success-600 dark:text-success-200" />
                ) : (
                  <Clock3 className="h-5 w-5 text-warning-500" />
                )}

                <span className="text-sm font-semibold text-slate-900 dark:text-ink-50">
                  {isPaid
                    ? "Payment successful"
                    : formatStatus(booking.paymentStatus)}
                </span>
              </div>

              {isPaid ? (
                <ShieldCheck className="h-5 w-5 text-success-600 dark:text-success-200" />
              ) : null}
            </div>

            <div className="divide-y divide-slate-100 dark:divide-ink-800">
              <PaymentRow
                label={isPaid ? "Amount paid" : "Amount due"}
                value={formatNaira(
                  payment.amount !== null &&
                    payment.amount !== undefined
                    ? payment.amount
                    : booking.price
                )}
                strong
              />

              {payment.reference ? (
                <PaymentRow
                  label="Payment reference"
                  value={payment.reference}
                  mono
                />
              ) : null}

              {payment.transactionId ? (
                <PaymentRow
                  label="Transaction ID"
                  value={payment.transactionId}
                  mono
                />
              ) : null}

              {payment.channel ? (
                <PaymentRow
                  label="Payment channel"
                  value={formatStatus(payment.channel)}
                />
              ) : null}

              {payment.paidAt ? (
                <PaymentRow
                  label="Paid on"
                  value={formatDateTime(payment.paidAt)}
                />
              ) : null}

              <PaymentRow
                label="Servicely fee"
                value={formatNaira(booking.platformFee)}
              />

              <PaymentRow
                label="Provider amount"
                value={formatNaira(booking.providerAmount)}
              />
            </div>
          </div>
        </section>
      </div>
    </ResponsiveModal>
  );
}

/* ======================================================
   INFO PILL
====================================================== */

function InfoPill({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  if (!text) return null;

  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 dark:bg-ink-800 dark:text-ink-300">
      <span className="[&>svg]:h-3 [&>svg]:w-3">
        {icon}
      </span>

      <span className="truncate">{text}</span>
    </span>
  );
}

/* ======================================================
   SECTION TITLE
====================================================== */

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-ink-50">
      <span className="text-brand-600 [&>svg]:h-4 [&>svg]:w-4 dark:text-brand-400">
        {icon}
      </span>

      {title}
    </div>
  );
}

/* ======================================================
   DETAIL ITEM
====================================================== */

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3.5 dark:bg-ink-800/60">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-ink-500">
        <span className="[&>svg]:h-3 [&>svg]:w-3">
          {icon}
        </span>

        {label}
      </div>

      <p className="mt-1.5 text-sm font-semibold text-slate-700 dark:text-ink-200">
        {value || "—"}
      </p>
    </div>
  );
}

/* ======================================================
   PAYMENT ROW
====================================================== */

function PaymentRow({
  label,
  value,
  mono = false,
  strong = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs text-slate-500 dark:text-ink-400">
        {label}
      </span>

      <span
        className={`break-all text-right text-xs ${
          mono ? "font-mono" : ""
        } ${
          strong
            ? "font-bold text-slate-900 dark:text-ink-50"
            : "font-semibold text-slate-700 dark:text-ink-300"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/* ======================================================
   PAYMENT BADGE
====================================================== */

function PaymentBadge({ status }: { status: string }) {
  if (status === "paid") {
    return (
      <span className="badge bg-success-50 text-success-700 dark:bg-success-600/15 dark:text-success-200">
        <CheckCircle2 className="h-3 w-3" />
        Paid
      </span>
    );
  }

  if (status === "pending" || status === "unpaid") {
    return (
      <span className="badge bg-warning-50 text-warning-700 dark:bg-warning-600/15 dark:text-warning-200">
        <Clock3 className="h-3 w-3" />
        Payment pending
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="badge bg-danger-50 text-danger-700 dark:bg-danger-500/15 dark:text-danger-200">
        <XCircle className="h-3 w-3" />
        Failed
      </span>
    );
  }

  return (
    <span className="badge bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-ink-300">
      {formatStatus(status)}
    </span>
  );
}

/* ======================================================
   SKELETONS
====================================================== */

function SummarySkeleton() {
  return (
    <div
      className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      aria-hidden="true"
    >
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="card p-5">
          <Skeleton className="h-11 w-11 rounded-xl" />

          <Skeleton className="mt-3 h-7 w-14 rounded-lg" />

          <Skeleton className="mt-2 h-3 w-24 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function BookingSkeleton() {
  return (
    <div
      className="space-y-3"
      role="status"
      aria-label="Loading bookings"
    >
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          aria-hidden="true"
          className="card relative overflow-hidden p-5 pl-6"
        >
          <div className="flex items-start gap-3.5">
            <Skeleton className="h-10 w-10 rounded-full" />

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-4 w-40 rounded-lg" />

                <Skeleton className="h-5 w-20 rounded-full" />
              </div>

              <Skeleton className="h-3 w-28 rounded-lg" />

              <div className="flex flex-wrap gap-2 pt-1">
                <Skeleton className="h-7 w-28 rounded-lg" />

                <Skeleton className="h-7 w-20 rounded-lg" />

                <Skeleton className="h-7 w-24 rounded-lg" />
              </div>
            </div>

            <div className="hidden shrink-0 space-y-2 sm:block">
              <Skeleton className="h-3 w-10 rounded-lg" />

              <Skeleton className="h-6 w-20 rounded-lg" />

              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-ink-800 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-3 w-32 rounded-lg" />

            <div className="flex flex-col gap-2 sm:flex-row">
              <Skeleton className="h-9 w-full rounded-lg sm:w-24" />

              <Skeleton className="h-9 w-full rounded-lg sm:w-24" />
            </div>
          </div>
        </div>
      ))}

      <span className="sr-only">Loading bookings…</span>
    </div>
  );
}

/* ======================================================
   HELPERS
====================================================== */

function bookingAccent(status: string) {
  const accents: Record<string, string> = {
    pending: "bg-warning-400",
    accepted: "bg-sky-400",
    payment_pending: "bg-warning-400",
    paid: "bg-success-500",
    completed: "bg-brand-500",
    reviewed: "bg-brand-500",
    rejected: "bg-danger-500",
    cancelled: "bg-slate-300 dark:bg-ink-600",
    disputed: "bg-danger-500",
  };

  return accents[status] || "bg-slate-300 dark:bg-ink-600";
}

function formatStatus(value: string) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatBookingDate(value: string) {
  if (!value) return "";

  try {
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
    const parsed = new Date(
      dateOnly ? `${value}T00:00:00` : value
    );

    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("en-NG", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(parsed);
  } catch {
    return value;
  }
}

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
