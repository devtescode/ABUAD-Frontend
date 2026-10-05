import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  FileText,
  MapPin,
  RefreshCw,
  Receipt,
  ShieldCheck,
  UserRound,
  X,
  XCircle,
  AlertCircle,
} from "lucide-react";

import { customerNavItems } from "@/data/customerNavItems";
import {
  DashboardLayout,
  DashboardHeader,
} from "@/components/DashboardLayout";
import { formatNaira } from "@/data/mockData";

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

  return (
    <DashboardLayout
      role="customer"
      navItems={customerNavItems}
    >
      <DashboardHeader
        title="My Bookings"
        subtitle="Track your services, payments and booking details."
      />

      <div className="space-y-6">
        {/* ==================================================
            SUMMARY
        ================================================== */}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard
            icon={<Receipt />}
            label="Total"
            value={counts.all}
          />

          <SummaryCard
            icon={<Clock3 />}
            label="Pending"
            value={counts.pending}
          />

          <SummaryCard
            icon={<CreditCard />}
            label="Paid"
            value={counts.paid}
          />

          <SummaryCard
            icon={<CheckCircle2 />}
            label="Completed"
            value={counts.completed}
          />
        </div>

        {/* ==================================================
            FILTER BAR
        ================================================== */}

        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 no-scrollbar">
            {tabs.map((tab) => {
              const count =
                counts[tab.id];

              const active =
                filter === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setFilter(tab.id)
                  }
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                    active
                      ? "bg-primary-600 text-white shadow-sm"
                      : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700"
                  }`}
                >
                  {tab.label}

                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-white/70 text-ink-500 dark:bg-ink-700 dark:text-ink-300"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() =>
              fetchBookings(true)
            }
            disabled={refreshing}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-600 transition hover:bg-ink-50 disabled:opacity-50 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:bg-ink-800"
            title="Refresh bookings"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />
          </button>
        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
            <AlertCircle className="h-5 w-5 shrink-0" />

            <div className="flex-1">
              <p className="font-semibold">
                Unable to load bookings
              </p>

              <p className="mt-0.5 text-xs opacity-80">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                fetchBookings()
              }
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* ==================================================
            LOADING
        ================================================== */}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <BookingSkeleton
                key={item}
              />
            ))}
          </div>
        ) : filteredBookings.length ===
          0 ? (
          /* ==================================================
             EMPTY STATE
          ================================================== */
          <div className="rounded-3xl border border-dashed border-ink-200 bg-white px-6 py-20 text-center dark:border-ink-700 dark:bg-ink-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-100 dark:bg-ink-800">
              <Calendar className="h-7 w-7 text-ink-400" />
            </div>

            <h3 className="mt-5 text-lg font-bold text-ink-900 dark:text-ink-50">
              No bookings found
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">
              {filter === "all"
                ? "Book a service to see your bookings and payment details here."
                : filter ===
                    "payment_pending"
                  ? "You don't have any payments waiting to be completed."
                  : `You don't have any ${filter.replace(
                      "_",
                      " "
                    )} bookings.`}
            </p>
          </div>
        ) : (
          /* ==================================================
             BOOKINGS
          ================================================== */
          <div className="space-y-4">
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
   BOOKING CARD
====================================================== */

function BookingCard({
  booking,
  onView,
}: {
  booking: Booking;
  onView: () => void;
}) {
  const isPaid =
    booking.paymentStatus ===
    "paid";

  const needsPayment =
    booking.paymentStatus ===
      "unpaid" ||
    booking.paymentStatus ===
      "pending";

  const isCompleted =
    booking.bookingStatus ===
    "completed";

  return (
    <div className="group overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-ink-700 dark:bg-ink-900">
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-5 sm:flex-row">
          {/* PROVIDER */}
          <div className="flex min-w-0 flex-1 gap-4">
            <img
              src={
                booking.providerAvatar ||
                "/images/avatar-placeholder.png"
              }
              alt={
                booking.providerName
              }
              className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-1 ring-ink-200 dark:ring-ink-700"
              onError={(e) => {
                e.currentTarget.src =
                  "/images/avatar-placeholder.png";
              }}
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-bold text-ink-900 dark:text-ink-50">
                  {booking.serviceName}
                </h3>

                <PaymentBadge
                  status={
                    booking.paymentStatus
                  }
                />
              </div>

              <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
                <UserRound className="h-3.5 w-3.5" />

                {booking.providerName}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
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

          {/* PRICE / ACTION */}
          <div className="flex items-center justify-between gap-4 border-t border-ink-100 pt-4 sm:min-w-[180px] sm:flex-col sm:items-end sm:justify-center sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0 dark:border-ink-800">
            <div className="text-left sm:text-right">
              <p className="text-[11px] font-medium uppercase tracking-wider text-ink-400">
                Total
              </p>

              <p className="mt-0.5 text-xl font-black text-ink-900 dark:text-white">
                {formatNaira(
                  booking.price
                )}
              </p>
            </div>

            <div className="flex gap-2">
              {needsPayment && (
                <Link
                  to={`/payment/${booking.id}`}
                  className="rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700"
                >
                  Pay Now
                </Link>
              )}

              <button
                type="button"
                onClick={onView}
                className="flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-xs font-bold text-ink-700 transition hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800"
              >
                <Eye className="h-3.5 w-3.5" />
                Details
              </button>

              {isCompleted && (
                <Link
                  to={`/review/${booking.id}`}
                  className="hidden rounded-xl border border-ink-200 px-3.5 py-2 text-xs font-bold text-ink-700 sm:block"
                >
                  Review
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT CONFIRMATION */}
      {isPaid && (
        <div className="flex flex-col gap-2 border-t border-emerald-100 bg-emerald-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />

            Payment confirmed by Paystack
          </div>

          {booking.payment.reference && (
            <span className="truncate font-mono text-[10px] text-emerald-600 dark:text-emerald-500">
              {booking.payment.reference}
            </span>
          )}
        </div>
      )}
    </div>
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
    booking.paymentStatus ===
    "paid";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (
          e.target === e.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl dark:bg-ink-900">
        {/* HEADER */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6 dark:border-ink-800 dark:bg-ink-900/95">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary-600">
              Booking details
            </p>

            <h2 className="mt-1 text-lg font-black text-ink-900 dark:text-white">
              {booking.serviceName}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-100 text-ink-500 transition hover:bg-ink-200 dark:bg-ink-800 dark:hover:bg-ink-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {/* SERVICE */}
          <section className="overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-700">
            {booking.serviceDetails.image && (
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
                <h3 className="font-bold text-ink-900 dark:text-white">
                  {booking.serviceDetails.title}
                </h3>

                {booking.serviceDetails
                  .category && (
                  <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[10px] font-bold text-primary-700 dark:bg-primary-950/30 dark:text-primary-400">
                    {
                      booking.serviceDetails
                        .category
                    }
                  </span>
                )}
              </div>

              {booking.serviceDetails
                .description && (
                <p className="mt-2 text-sm leading-6 text-ink-500">
                  {
                    booking.serviceDetails
                      .description
                  }
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

            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-ink-50 p-4 dark:bg-ink-800/60">
              <img
                src={
                  booking.providerAvatar ||
                  "/images/avatar-placeholder.png"
                }
                alt=""
                className="h-11 w-11 rounded-xl object-cover"
              />

              <div>
                <p className="font-bold text-ink-900 dark:text-white">
                  {booking.providerName}
                </p>

                <p className="text-xs text-ink-500">
                  Service Provider
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

              <DetailItem
                icon={<FileText />}
                label="Booking status"
                value={formatStatus(
                  booking.bookingStatus
                )}
              />
            </div>
          </section>

          {/* NOTES */}
          {booking.notes && (
            <section>
              <SectionTitle
                icon={<FileText />}
                title="Your notes"
              />

              <div className="mt-3 rounded-2xl bg-ink-50 p-4 text-sm leading-6 text-ink-600 dark:bg-ink-800/60 dark:text-ink-300">
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
              className={`mt-3 overflow-hidden rounded-2xl border ${
                isPaid
                  ? "border-emerald-200 dark:border-emerald-900/50"
                  : "border-ink-200 dark:border-ink-700"
              }`}
            >
              <div
                className={`flex items-center justify-between px-4 py-4 ${
                  isPaid
                    ? "bg-emerald-50 dark:bg-emerald-950/20"
                    : "bg-ink-50 dark:bg-ink-800/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isPaid ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Clock3 className="h-5 w-5 text-amber-500" />
                  )}

                  <span className="text-sm font-bold text-ink-900 dark:text-white">
                    {isPaid
                      ? "Payment successful"
                      : formatStatus(
                          booking.paymentStatus
                        )}
                  </span>
                </div>

                {isPaid && (
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                )}
              </div>

              <div className="divide-y divide-ink-100 dark:divide-ink-800">
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

          {/* FOOTER ACTIONS */}
          <div className="flex flex-col gap-2 sm:flex-row">
            {!isPaid &&
              (booking.paymentStatus ===
                "unpaid" ||
                booking.paymentStatus ===
                  "pending") && (
                <Link
                  to={`/payment/${booking.id}`}
                  onClick={onClose}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-700"
                >
                  <CreditCard className="h-4 w-4" />
                  Complete Payment
                </Link>
              )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-ink-200 px-5 py-3 text-sm font-bold text-ink-700 dark:border-ink-700 dark:text-ink-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   SUMMARY CARD
====================================================== */

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-900">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400">
          <span className="[&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </span>
        </div>

        <span className="text-xl font-black text-ink-900 dark:text-white">
          {value}
        </span>
      </div>

      <p className="mt-3 text-xs font-medium text-ink-500">
        {label}
      </p>
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
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
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
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
        <Clock3 className="h-3 w-3" />
        Payment Pending
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700 dark:bg-red-950/30 dark:text-red-400">
        <XCircle className="h-3 w-3" />
        Failed
      </span>
    );
  }

  return (
    <span className="rounded-full bg-ink-100 px-2.5 py-1 text-[10px] font-bold text-ink-600 dark:bg-ink-800 dark:text-ink-300">
      {formatStatus(status)}
    </span>
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
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-ink-50 px-2.5 py-1.5 text-[11px] font-medium text-ink-500 dark:bg-ink-800 dark:text-ink-400">
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
    <div className="flex items-center gap-2 text-sm font-bold text-ink-900 dark:text-white">
      <span className="text-primary-600 [&>svg]:h-4 [&>svg]:w-4">
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
    <div className="rounded-2xl bg-ink-50 p-3.5 dark:bg-ink-800/60">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
        <span className="[&>svg]:h-3 [&>svg]:w-3">
          {icon}
        </span>

        {label}
      </div>

      <p className="mt-1.5 text-sm font-semibold text-ink-800 dark:text-ink-200">
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
      <span className="text-xs text-ink-500">
        {label}
      </span>

      <span
        className={`break-all text-right text-xs ${
          mono ? "font-mono" : ""
        } ${
          strong
            ? "font-black text-ink-900 dark:text-white"
            : "font-semibold text-ink-700 dark:text-ink-300"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/* ======================================================
   SKELETON
====================================================== */

function BookingSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-ink-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900">
      <div className="flex gap-4">
        <div className="h-14 w-14 rounded-2xl bg-ink-200 dark:bg-ink-700" />

        <div className="flex-1 space-y-3">
          <div className="h-4 w-48 rounded bg-ink-200 dark:bg-ink-700" />

          <div className="h-3 w-32 rounded bg-ink-200 dark:bg-ink-700" />

          <div className="h-8 w-full max-w-md rounded bg-ink-100 dark:bg-ink-800" />
        </div>
      </div>
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