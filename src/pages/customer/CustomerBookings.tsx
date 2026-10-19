import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
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

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const INVALID_BOOKINGS_KEY =
  "servicely_invalid_bookings";

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

/* ======================================================
   INVALID BOOKING STORAGE
====================================================== */

function getInvalidBookingIds(): string[] {
  try {
    const stored =
      sessionStorage.getItem(
        INVALID_BOOKINGS_KEY
      );

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed)
      ? parsed.filter(
        (id): id is string =>
          typeof id === "string" &&
          id.trim().length > 0
      )
      : [];
  } catch {
    return [];
  }
}

function markBookingAsInvalid(
  bookingId: string
) {
  if (!bookingId) return;

  try {
    const existing =
      getInvalidBookingIds();

    if (!existing.includes(bookingId)) {
      sessionStorage.setItem(
        INVALID_BOOKINGS_KEY,
        JSON.stringify([
          ...existing,
          bookingId,
        ])
      );
    }
  } catch (error) {
    console.error(
      "Unable to save invalid booking:",
      error
    );
  }
}

/* ======================================================
   MAIN COMPONENT
====================================================== */

export function CustomerBookings() {
  const [bookings, setBookings] = useState<Booking[]>(
    []
  );

  const [filter, setFilter] =
    useState<Filter>("all");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [selectedBooking, setSelectedBooking] =
    useState<Booking | null>(null);

  /**
   * --------------------------------------------------
   * FETCH BOOKINGS
   * --------------------------------------------------
   */
  const fetchBookings = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const token =
          sessionStorage.getItem(
            "servicely_token"
          );

        if (!token) {
          setError(
            "Your session has expired. Please log in again."
          );
          return;
        }

        const response = await fetch(
          `${API_URL}/bookings/my-bookings`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
            "Unable to load bookings."
          );
        }

        const fetchedBookings =
          Array.isArray(data?.bookings)
            ? data.bookings
            : [];

        /*
         * IDs that the payment page has already
         * confirmed as invalid / not found.
         */
        const invalidIds =
          getInvalidBookingIds();

        /*
         * Remove:
         * 1. Records without an ID.
         * 2. Records previously confirmed as invalid.
         * 3. Payment-pending records without
         *    a valid service ID.
         */
        const validBookings =
          fetchedBookings.filter(
            (booking: Booking) => {
              if (!booking?.id) {
                return false;
              }

              if (
                invalidIds.includes(
                  booking.id
                )
              ) {
                return false;
              }

              if (
                (booking.paymentStatus ===
                  "unpaid" ||
                  booking.paymentStatus ===
                  "pending") &&
                !booking.serviceId
              ) {
                return false;
              }

              return true;
            }
          );

        setBookings(validBookings);
      } catch (err) {
        console.error(
          "FETCH CUSTOMER BOOKINGS ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your bookings."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /**
   * --------------------------------------------------
   * INITIAL LOAD
   * --------------------------------------------------
   */
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  /**
   * --------------------------------------------------
   * REFRESH WHEN CUSTOMER RETURNS TO PAGE
   * --------------------------------------------------
   */
  useEffect(() => {
    const handleFocus = () => {
      fetchBookings(true);
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [fetchBookings]);

  /**
   * --------------------------------------------------
   * REMOVE INVALID BOOKING FROM CURRENT STATE
   * --------------------------------------------------
   *
   * This is useful when another part of the app
   * reports that the booking no longer exists.
   */
  useEffect(() => {
    const handleInvalidBooking = (
      event: Event
    ) => {
      const customEvent =
        event as CustomEvent<{
          bookingId?: string;
        }>;

      const bookingId =
        customEvent.detail?.bookingId;

      if (!bookingId) {
        return;
      }

      markBookingAsInvalid(
        bookingId
      );

      setBookings((current) =>
        current.filter(
          (booking) =>
            booking.id !== bookingId
        )
      );

      setSelectedBooking((current) =>
        current?.id === bookingId
          ? null
          : current
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
   * FILTER BOOKINGS
   * --------------------------------------------------
   */
  const filteredBookings = useMemo(() => {
    const invalidIds =
      getInvalidBookingIds();

    /*
     * Always remove invalid bookings first.
     */
    const validBookings =
      bookings.filter((booking) => {
        if (!booking?.id) {
          return false;
        }

        if (
          invalidIds.includes(
            booking.id
          )
        ) {
          return false;
        }

        if (
          (booking.paymentStatus ===
            "unpaid" ||
            booking.paymentStatus ===
            "pending") &&
          !booking.serviceId
        ) {
          return false;
        }

        return true;
      });

    if (filter === "all") {
      return validBookings;
    }

    if (filter === "pending") {
      return validBookings.filter(
        (booking) =>
          booking.bookingStatus ===
          "pending"
      );
    }

    if (
      filter === "payment_pending"
    ) {
      return validBookings.filter(
        (booking) =>
          (booking.paymentStatus ===
            "unpaid" ||
            booking.paymentStatus ===
            "pending") &&
          Boolean(booking.id) &&
          Boolean(booking.serviceId)
      );
    }

    if (filter === "paid") {
      return validBookings.filter(
        (booking) =>
          booking.paymentStatus ===
          "paid"
      );
    }

    if (filter === "completed") {
      return validBookings.filter(
        (booking) =>
          booking.bookingStatus ===
          "completed"
      );
    }

    if (filter === "cancelled") {
      return validBookings.filter(
        (booking) =>
          booking.bookingStatus ===
          "cancelled"
      );
    }

    return validBookings;
  }, [bookings, filter]);

  /**
   * --------------------------------------------------
   * COUNTS
   * --------------------------------------------------
   */
  const counts = useMemo(() => {
    const invalidIds =
      getInvalidBookingIds();

    const validBookings =
      bookings.filter((booking) => {
        if (!booking?.id) {
          return false;
        }

        if (
          invalidIds.includes(
            booking.id
          )
        ) {
          return false;
        }

        return true;
      });

    return {
      all: validBookings.length,

      pending:
        validBookings.filter(
          (booking) =>
            booking.bookingStatus ===
            "pending"
        ).length,

      payment_pending:
        validBookings.filter(
          (booking) =>
            (booking.paymentStatus ===
              "unpaid" ||
              booking.paymentStatus ===
              "pending") &&
            Boolean(booking.id) &&
            Boolean(booking.serviceId)
        ).length,

      paid:
        validBookings.filter(
          (booking) =>
            booking.paymentStatus ===
            "paid"
        ).length,

      completed:
        validBookings.filter(
          (booking) =>
            booking.bookingStatus ===
            "completed"
        ).length,

      cancelled:
        validBookings.filter(
          (booking) =>
            booking.bookingStatus ===
            "cancelled"
        ).length,
    };
  }, [bookings]);

  /**
   * --------------------------------------------------
   * TABS
   * --------------------------------------------------
   */
  const tabs: {
    id: Filter;
    label: string;
  }[] = [
      {
        id: "all",
        label: "All",
      },
      {
        id: "pending",
        label: "Pending",
      },
      {
        id: "payment_pending",
        label: "Payment Pending",
      },
      {
        id: "paid",
        label: "Paid",
      },
      {
        id: "completed",
        label: "Completed",
      },
      {
        id: "cancelled",
        label: "Cancelled",
      },
    ];

  const hasData =
    filteredBookings.length > 0;

  const showFullError =
    Boolean(error) &&
    !loading &&
    !hasData;

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
            loading={refreshing}
            onClick={() =>
              fetchBookings(true)
            }
            aria-label="Refresh bookings"
          >
            Refresh
          </Button>
        }
      />

      <div className="space-y-6">
        {/* ==================================================
            SUMMARY
        ================================================== */}

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
            value={String(
              counts.completed
            )}
            icon={CheckCircle2}
            color="sky"
          />
        </div>

        {/* ==================================================
            FILTER CHIPS
        ================================================== */}

        <div
          role="group"
          aria-label="Filter bookings"
          className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
        >
          {tabs.map((tab) => {
            const count =
              counts[tab.id];

            const active =
              filter === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setFilter(tab.id)
                }
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${active
                  ? "bg-brand-600 text-white shadow-soft"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:border-ink-600 dark:hover:text-ink-50"
                  }`}
              >
                {tab.label}

                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${active
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

        {/* ==================================================
            REFRESH ERROR (data already on screen)
        ================================================== */}

        {Boolean(error) &&
          !loading &&
          hasData && (
            <div className="flex flex-col gap-3 rounded-2xl border border-danger-100 bg-danger-50/60 p-4 dark:border-danger-500/20 dark:bg-danger-500/5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger-500 dark:text-danger-200" />

                <div>
                  <p className="text-sm font-semibold text-danger-700 dark:text-danger-200">
                    Unable to refresh bookings
                  </p>

                  <p className="mt-0.5 text-xs text-danger-600 dark:text-danger-200/80">
                    {error}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                icon={RefreshCw}
                onClick={() =>
                  fetchBookings()
                }
                className="shrink-0"
              >
                Try again
              </Button>
            </div>
          )}

        {/* ==================================================
            LOADING
        ================================================== */}

        {loading ? (
          <BookingSkeleton />
        ) : showFullError ? (
          /* ==================================================
             ERROR
          ================================================== */
          <ErrorState
            message={error}
            onRetry={() =>
              fetchBookings()
            }
          />
        ) : filteredBookings.length ===
          0 ? (
          /* ==================================================
             EMPTY STATE
          ================================================== */
          <EmptyState
            icon={Calendar}
            title={
              filter === "all"
                ? "No bookings yet"
                : `No ${tabs
                  .find(
                    (tab) =>
                      tab.id === filter
                  )
                  ?.label.toLowerCase()} bookings`
            }
            description={
              filter === "all"
                ? "Book a service to see your bookings and payment details here."
                : filter ===
                  "payment_pending"
                  ? "You don't have any payments waiting to be completed."
                  : `You don't have any ${filter.replace(
                    "_",
                    " "
                  )} bookings.`
            }
            action={
              filter === "all" ? (
                <Link
                  to="/customer/browse"
                  className="btn-primary"
                >
                  <Search className="h-4 w-4" />
                  Browse Services
                </Link>
              ) : (
                <Button
                  variant="outline"
                  onClick={() =>
                    setFilter("all")
                  }
                >
                  Show all bookings
                </Button>
              )
            }
          />
        ) : (
          /* ==================================================
             BOOKINGS — desktop table + mobile cards
          ================================================== */
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900 lg:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200/70 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-ink-800 dark:bg-ink-800/60 dark:text-ink-400">
                    <th
                      scope="col"
                      className="px-5 py-3.5"
                    >
                      Service
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3.5"
                    >
                      Provider
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3.5"
                    >
                      Date &amp; time
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3.5"
                    >
                      Amount
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3.5"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3.5 text-right"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-ink-800">
                  {filteredBookings.map(
                    (booking) => (
                      <tr
                        key={booking.id}
                        className="transition-colors hover:bg-slate-50/70 dark:hover:bg-ink-800/40"
                      >
                        {/* SERVICE */}
                        <td className="px-5 py-4 align-top">
                          <p className="text-sm font-semibold text-slate-900 dark:text-ink-50">
                            {booking.serviceName}
                          </p>

                          {booking
                            .serviceDetails
                            ?.category && (
                              <p className="mt-0.5 text-xs text-slate-500 dark:text-ink-400">
                                {
                                  booking
                                    .serviceDetails
                                    .category
                                }
                              </p>
                            )}
                        </td>

                        {/* PROVIDER */}
                        <td className="px-5 py-4 align-top">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              src={
                                booking.providerAvatar
                              }
                              name={
                                booking.providerName
                              }
                              size="sm"
                            />

                            <span className="text-sm text-slate-600 dark:text-ink-300">
                              {booking.providerName}
                            </span>
                          </div>
                        </td>

                        {/* DATE & TIME */}
                        <td className="px-5 py-4 align-top">
                          <p className="text-sm font-medium text-slate-700 dark:text-ink-200">
                            {booking.date}
                          </p>

                          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-ink-400">
                            <Clock3 className="h-3 w-3 shrink-0" />

                            <span className="truncate">
                              {booking.time}
                              {booking.location
                                ? ` · ${booking.location}`
                                : ""}
                            </span>
                          </p>
                        </td>

                        {/* AMOUNT */}
                        <td className="px-5 py-4 align-top">
                          <p className="text-sm font-bold text-slate-900 dark:text-ink-50">
                            {formatNaira(
                              booking.price
                            )}
                          </p>

                          <div className="mt-1">
                            <PaymentBadge
                              status={
                                booking.paymentStatus
                              }
                            />
                          </div>
                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-4 align-top">
                          <BookingStatusBadge
                            status={
                              booking.bookingStatus
                            }
                          />
                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-4 align-top">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedBooking(
                                  booking
                                )
                              }
                              className="btn-outline btn-sm"
                              aria-label={`View details for ${booking.serviceName}`}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Details
                            </button>

                            {booking.paymentStatus ===
                              "unpaid" ||
                              booking.paymentStatus ===
                              "pending" ? (
                              <Link
                                to={`/payment/${booking.id}`}
                                className="btn-primary btn-sm"
                              >
                                <CreditCard className="h-3.5 w-3.5" />
                                Pay now
                              </Link>
                            ) : null}

                            {booking.bookingStatus ===
                              "completed" ? (
                              <Link
                                to={`/review/${booking.id}`}
                                className="btn-outline btn-sm"
                              >
                                Review
                              </Link>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-4 lg:hidden">
              {filteredBookings.map(
                (booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onView={() =>
                      setSelectedBooking(
                        booking
                      )
                    }
                  />
                )
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* ==================================================
          DETAILS MODAL
      ================================================== */}

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() =>
            setSelectedBooking(null)
          }
        />
      )}
    </DashboardLayout>
  );
}

/* ======================================================
   BOOKING CARD (mobile / tablet)
====================================================== */

function BookingCard({
  booking,
  onView,
}: {
  booking: Booking;
  onView: () => void;
}) {
  const isPaid =
    booking.paymentStatus === "paid";

  const needsPayment =
    booking.paymentStatus ===
    "unpaid" ||
    booking.paymentStatus === "pending";

  const isCompleted =
    booking.bookingStatus === "completed";

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card overflow-hidden transition-shadow hover:shadow-card-hover"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3.5">
          <Avatar
            src={booking.providerAvatar}
            name={booking.providerName}
            size="lg"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
                {booking.serviceName}
              </h3>

              <BookingStatusBadge
                status={
                  booking.bookingStatus
                }
              />
            </div>

            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-ink-400">
              <UserRound className="h-3.5 w-3.5 shrink-0" />
              {booking.providerName}
            </p>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <InfoPill
                icon={<Calendar />}
                text={booking.date}
              />

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

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-4 dark:border-ink-800">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-ink-500">
              Total
            </p>

            <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-ink-50">
              {formatNaira(
                booking.price
              )}
            </p>

            <div className="mt-1.5">
              <PaymentBadge
                status={
                  booking.paymentStatus
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {needsPayment && (
              <Link
                to={`/payment/${booking.id}`}
                className="btn-primary btn-sm"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Pay now
              </Link>
            )}

            <button
              type="button"
              onClick={onView}
              className="btn-outline btn-sm"
              aria-label={`View details for ${booking.serviceName}`}
            >
              <Eye className="h-3.5 w-3.5" />
              Details
            </button>

            {isCompleted && (
              <Link
                to={`/review/${booking.id}`}
                className="btn-outline btn-sm"
              >
                Review
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* PAYMENT CONFIRMATION */}
      {isPaid && (
        <div className="flex flex-col gap-1.5 border-t border-success-100 bg-success-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-success-600/30 dark:bg-success-600/10">
          <div className="flex items-center gap-2 text-xs font-semibold text-success-700 dark:text-success-200">
            <CheckCircle2 className="h-4 w-4 shrink-0" />

            Payment confirmed by Paystack
          </div>

          {booking.payment.reference && (
            <span className="truncate font-mono text-[10px] text-success-600 dark:text-success-200/80">
              {booking.payment.reference}
            </span>
          )}
        </div>
      )}
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
  const isPaid =
    booking.paymentStatus === "paid";

  const needsPayment =
    booking.paymentStatus ===
    "unpaid" ||
    booking.paymentStatus === "pending";

  return (
    <ResponsiveModal
      open
      onClose={onClose}
      title="Booking details"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {needsPayment && (
            <Link
              to={`/payment/${booking.id}`}
              onClick={onClose}
              className="btn-primary w-full sm:w-auto"
            >
              <CreditCard className="h-4 w-4" />
              Complete payment
            </Link>
          )}

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
          {booking.serviceDetails
            ?.image && (
              <img
                src={
                  booking.serviceDetails
                    .image
                }
                alt={
                  booking.serviceDetails
                    .title
                }
                className="h-40 w-full object-cover"
              />
            )}

          <div className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-ink-50">
                {booking.serviceDetails
                  ?.title ||
                  booking.serviceName}
              </h3>

              {booking.serviceDetails
                ?.category && (
                  <span className="badge bg-lavender text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    {booking.serviceDetails.category}
                  </span>
                )}
            </div>

            {booking.serviceDetails
              ?.description && (
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-ink-400">
                  {booking.serviceDetails.description}
                </p>
              )}
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
              value={booking.date}
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
                  status={
                    booking.bookingStatus
                  }
                />
              </div>
            </div>
          </div>
        </section>

        {/* NOTES */}
        {booking.notes && (
          <section>
            <SectionTitle
              icon={<FileText />}
              title="Your notes"
            />

            <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:bg-ink-800/60 dark:text-ink-300">
              {booking.notes}
            </div>
          </section>
        )}

        {/* PAYMENT */}
        <section>
          <SectionTitle
            icon={<CreditCard />}
            title="Payment information"
          />

          <div
            className={`mt-3 overflow-hidden rounded-2xl border ${isPaid
              ? "border-success-100 dark:border-success-600/30"
              : "border-slate-200 dark:border-ink-800"
              }`}
          >
            <div
              className={`flex items-center justify-between px-4 py-4 ${isPaid
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
                    : formatStatus(
                      booking.paymentStatus
                    )}
                </span>
              </div>

              {isPaid && (
                <ShieldCheck className="h-5 w-5 text-success-600 dark:text-success-200" />
              )}
            </div>

            <div className="divide-y divide-slate-100 dark:divide-ink-800">
              <PaymentRow
                label="Amount paid"
                value={formatNaira(
                  booking.payment
                    .amount !== null &&
                    booking.payment
                      .amount !==
                    undefined
                    ? booking.payment
                      .amount
                    : booking.price
                )}
                strong
              />

              {booking.payment
                .reference && (
                  <PaymentRow
                    label="Payment reference"
                    value={
                      booking.payment
                        .reference
                    }
                    mono
                  />
                )}

              {booking.payment
                .transactionId && (
                  <PaymentRow
                    label="Transaction ID"
                    value={
                      booking.payment
                        .transactionId
                    }
                    mono
                  />
                )}

              {booking.payment
                .channel && (
                  <PaymentRow
                    label="Payment channel"
                    value={formatStatus(
                      booking.payment
                        .channel
                    )}
                  />
                )}

              {booking.payment
                .paidAt && (
                  <PaymentRow
                    label="Paid on"
                    value={formatDateTime(
                      booking.payment
                        .paidAt
                    )}
                  />
                )}

              <PaymentRow
                label="Servicely fee"
                value={formatNaira(
                  booking.platformFee
                )}
              />

              <PaymentRow
                label="Provider amount"
                value={formatNaira(
                  booking.providerAmount
                )}
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

      <span className="truncate">
        {text}
      </span>
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
        className={`break-all text-right text-xs ${mono ? "font-mono" : ""
          } ${strong
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

function PaymentBadge({
  status,
}: {
  status: string;
}) {
  if (status === "paid") {
    return (
      <span className="badge bg-success-50 text-success-700 dark:bg-success-600/15 dark:text-success-200">
        <CheckCircle2 className="h-3 w-3" />
        Paid
      </span>
    );
  }

  if (
    status === "pending" ||
    status === "unpaid"
  ) {
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
   SKELETON
====================================================== */

function BookingSkeleton() {
  return (
    <div
      className="space-y-4"
      aria-hidden="true"
    >
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="card animate-pulse p-5"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />

            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3 rounded-lg" />

              <Skeleton className="h-3 w-1/4 rounded-lg" />
            </div>

            <Skeleton className="h-6 w-24 rounded-full" />
          </div>

          <div className="mt-4 flex gap-2">
            <Skeleton className="h-7 w-24 rounded-lg" />

            <Skeleton className="h-7 w-24 rounded-lg" />

            <Skeleton className="h-7 w-24 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ======================================================
   HELPERS
====================================================== */

function formatStatus(
  value: string
) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

function formatDateTime(
  value: string
) {
  try {
    return new Intl.DateTimeFormat(
      "en-NG",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(new Date(value));
  } catch {
    return value;
  }
}
