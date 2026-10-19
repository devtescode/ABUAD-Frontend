import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Calendar,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock,
  DollarSign,
  Image as ImageIcon,
  Inbox,
  MapPin,
  Plus,
  RefreshCw,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { DashboardLayout, StatCard } from "@/components/DashboardLayout";

import {
  Avatar,
  BookingStatusBadge,
  EmptyState,
  ErrorState,
  Skeleton,
  cn,
} from "@/components/ui";

import { useAuth } from "@/context/AppContext";
import { formatNaira } from "@/data/mockData";
import { providerNavItems } from "@/data/providerNavItems";




const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

/*
 * Backend endpoints used by this dashboard:
 *
 *   GET /provider/eachprofiledetails/:userId  → provider profile
 *   GET /provider/services                    → provider's services
 *   GET /bookings/provider-bookings           → provider's bookings
 */
const PROFILE_ENDPOINT = "/provider/eachprofiledetails";
const SERVICES_ENDPOINT = "/provider/services";
const BOOKINGS_ENDPOINT = "/bookings/provider-bookings";
const REFRESH_INTERVAL = 30_000;

/* How many items each section shows before "+X more" */
const SERVICES_PREVIEW_LIMIT = 3;
const BOOKINGS_PREVIEW_LIMIT = 5;

/* Max number of individual month bars in the earnings chart
   (older months are aggregated into a single "Earlier" bar). */
const CHART_MAX_BARS = 7;

type AnyObject = Record<string, any>;

interface Service {
  _id?: string;
  id?: string;
  title?: string;
  category?: string;
  price?: number | string;
  duration?: string;
  description?: string;
  image?: string;
  imageUrl?: string;
  images?: string[];
  status?: string;
  active?: boolean;
  verified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Booking {
  _id?: string;
  id?: string;
  customer?: AnyObject;
  customerName?: string;
  customerAvatar?: string;
  service?: AnyObject;
  serviceName?: string;
  date?: string;
  bookingDate?: string;
  time?: string;
  location?: string;
  status?: string;
  bookingStatus?: string;
  paymentStatus?: string;
  price?: number | string;
  amount?: number | string;
  providerAmount?: number | string;
  paidAt?: string;
  paymentDate?: string;
  createdAt?: string;
}

interface Provider {
  _id?: string;
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  avatar?: string;
  profileImage?: string;
  verified?: boolean;
  status?: string;
  rating?: number;
  averageRating?: number;
  reviewCount?: number;
  services?: Service[];
}

/* =========================================================
   HELPERS
========================================================= */

const getId = (item: AnyObject) =>
  String(item?._id ?? item?.id ?? "");

const getCustomerName = (booking: Booking) =>
  booking.customerName ||
  booking.customer?.name ||
  booking.customer?.fullName ||
  "Customer";

const getCustomerAvatar = (booking: Booking) =>
  booking.customerAvatar ||
  booking.customer?.avatar ||
  booking.customer?.profileImage ||
  "";

const getServiceName = (booking: Booking) =>
  booking.serviceName ||
  booking.service?.title ||
  "Service booking";

const getBookingDate = (booking: Booking) => {
  const value = booking.date || booking.bookingDate;

  if (!value) return "Date not specified";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getServiceImage = (service: Service) => {
  if (service.image) return service.image;
  if (service.imageUrl) return service.imageUrl;

  if (
    Array.isArray(service.images) &&
    service.images.length > 0 &&
    service.images[0]
  ) {
    return service.images[0];
  }

  return "";
};

const getServiceSortTime = (service: Service) => {
  const raw =
    service.createdAt || service.updatedAt || 0;

  const time = new Date(raw).getTime();

  return Number.isNaN(time) ? 0 : time;
};

const getBookingSortTime = (booking: Booking) => {
  const raw =
    booking.createdAt ||
    booking.date ||
    booking.bookingDate ||
    0;

  const time = new Date(raw).getTime();

  return Number.isNaN(time) ? 0 : time;
};

/*
 * When the money for a booking was received — prefers explicit
 * payment timestamps, falls back to the booking creation date.
 * Returns 0 when nothing parseable exists (entry is then skipped).
 */
const getEarningsTime = (booking: Booking) => {
  const raw =
    booking.paidAt ||
    booking.paymentDate ||
    booking.createdAt ||
    booking.date ||
    booking.bookingDate ||
    0;

  const time = new Date(raw).getTime();

  return Number.isNaN(time) || time <= 0 ? 0 : time;
};

const getBookingAmount = (booking: Booking) =>
  Number(
    booking.providerAmount ??
    booking.amount ??
    booking.price ??
    0
  );

const isPending = (status?: string) =>
  ["pending", "requested"].includes(
    String(status || "").toLowerCase()
  );

const isCancelled = (status?: string) =>
  ["cancelled", "canceled", "rejected"].includes(
    String(status || "").toLowerCase()
  );

const isPaid = (booking: Booking) =>
  String(booking.paymentStatus || "").toLowerCase() === "paid";

const isActiveService = (service: Service) => {
  const status = String(service.status || "").toLowerCase();

  return (
    status !== "rejected" &&
    status !== "inactive" &&
    service.active !== false &&
    (
      status === "active" ||
      status === "verified" ||
      status === "approved" ||
      service.verified === true ||
      !status
    )
  );
};

/* Backend statuses → BookingStatusBadge keys */
const normalizeBookingStatus = (booking: Booking) =>
  String(
    booking.status || booking.bookingStatus || "pending"
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

/* ₦1.2m / ₦250k / ₦900 — for tight chart labels only */
const compactNaira = (value: number) => {
  if (value >= 1_000_000) {
    return `₦${(value / 1_000_000).toFixed(
      value >= 10_000_000 ? 0 : 1
    )}m`;
  }

  if (value >= 1_000) {
    return `₦${Math.round(value / 1_000)}k`;
  }

  return `₦${value}`;
};


/* =========================================================
   MAIN COMPONENT
========================================================= */

export function ProvidersDashboard() {
  const { user } = useAuth();

  const authUser = user as AnyObject | null;

  const userId = String(
    authUser?._id || authUser?.id || ""
  );



  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDashboard = useCallback(
    async (manualRefresh = false) => {
      const token = sessionStorage.getItem("servicely_token");

      if (!token) {
        setError("Please log in again to view your dashboard.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!userId) {
        setError(
          "Your account ID is missing. Please log in again."
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (manualRefresh) setRefreshing(true);

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        };

        const [
          profileResponse,
          servicesResponse,
          bookingsResponse,
        ] = await Promise.all([
          fetch(
            `${API_URL}${PROFILE_ENDPOINT}/${encodeURIComponent(
              userId
            )}`,
            { headers }
          ),
          fetch(`${API_URL}${SERVICES_ENDPOINT}`, {
            headers,
          }),
          fetch(`${API_URL}${BOOKINGS_ENDPOINT}`, {
            headers,
          }),
        ]);

        const [
          profileResult,
          servicesResult,
          bookingsResult,
        ] = await Promise.all([
          profileResponse.json(),
          servicesResponse.json(),
          bookingsResponse.json(),
        ]);

        /* PROFILE */
        if (!profileResponse.ok) {
          throw new Error(
            profileResult?.message ||
            "Unable to load your provider profile."
          );
        }

        const profile: Provider | null =
          profileResult?.provider ??
          profileResult?.data?.provider ??
          profileResult?.data ??
          profileResult;

        if (
          !profile ||
          profileResult?.success === false ||
          profileResult?.provider === null
        ) {
          throw new Error(
            profileResult?.message ||
            "Your provider profile was not found."
          );
        }

        /* SERVICES */
        if (!servicesResponse.ok) {
          throw new Error(
            servicesResult?.message ||
            "Unable to load your services."
          );
        }

        const serviceList: Service[] = Array.isArray(
          servicesResult?.services
        )
          ? servicesResult.services
          : Array.isArray(servicesResult?.data?.services)
            ? servicesResult.data.services
            : Array.isArray(servicesResult?.data)
              ? servicesResult.data
              : Array.isArray(servicesResult)
                ? servicesResult
                : [];

        if (servicesResult?.success === false) {
          throw new Error(
            servicesResult?.message ||
            "Unable to load your services."
          );
        }

        /* BOOKINGS */
        if (!bookingsResponse.ok) {
          throw new Error(
            bookingsResult?.message ||
            "Unable to load your bookings."
          );
        }

        const bookingList: Booking[] =
          Array.isArray(bookingsResult?.bookings)
            ? bookingsResult.bookings
            : Array.isArray(bookingsResult?.data?.bookings)
              ? bookingsResult.data.bookings
              : Array.isArray(bookingsResult?.data)
                ? bookingsResult.data
                : Array.isArray(bookingsResult)
                  ? bookingsResult
                  : [];

        if (bookingsResult?.success === false) {
          throw new Error(
            bookingsResult?.message ||
            "Unable to load bookings."
          );
        }

        setProvider(profile);
        setServices(serviceList);
        setBookings(bookingList);
        setLastUpdated(new Date());
        setError("");
      } catch (err) {
        console.error("Provider dashboard:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading your dashboard."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    void loadDashboard();

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadDashboard();
      }
    }, REFRESH_INTERVAL);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadDashboard();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.clearInterval(interval);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [loadDashboard]);

  /* =========================================================
     DERIVED DATA — everything below is computed from the
     real profile / services / bookings returned by the API.
  ========================================================= */

  const activeServices = useMemo(
    () => services.filter(isActiveService),
    [services]
  );

  const sortedActiveServices = useMemo(
    () =>
      [...services]
        .filter(isActiveService)
        .sort(
          (a, b) =>
            getServiceSortTime(b) -
            getServiceSortTime(a)
        ),
    [services]
  );

  const previewServices = useMemo(
    () =>
      sortedActiveServices.slice(
        0,
        SERVICES_PREVIEW_LIMIT
      ),
    [sortedActiveServices]
  );

  const extraServicesCount =
    sortedActiveServices.length - previewServices.length;

  /* Most recent bookings of any status, newest first */
  const recentBookings = useMemo(
    () =>
      [...bookings].sort(
        (a, b) =>
          getBookingSortTime(b) -
          getBookingSortTime(a)
      ),
    [bookings]
  );

  const previewBookings = useMemo(
    () =>
      recentBookings.slice(
        0,
        BOOKINGS_PREVIEW_LIMIT
      ),
    [recentBookings]
  );

  const extraBookingsCount =
    bookings.length - previewBookings.length;

  const pendingBookings = useMemo(
    () =>
      bookings.filter((booking) =>
        isPending(
          booking.status || booking.bookingStatus
        )
      ),
    [bookings]
  );

  /* Real money received: paid, non-cancelled bookings only */
  const paidBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          isPaid(booking) &&
          !isCancelled(booking.status)
      ),
    [bookings]
  );

  const totalEarnings = useMemo(
    () =>
      paidBookings.reduce(
        (total, booking) =>
          total + getBookingAmount(booking),
        0
      ),
    [paidBookings]
  );

  /*
   * Chart input: paid bookings that carry both a real amount
   * and a parseable date. Nothing is invented — months without
   * payments simply render a zero bar.
   */
  const earningsEntries = useMemo<EarningsEntry[]>(
    () =>
      paidBookings
        .map((booking) => ({
          time: getEarningsTime(booking),
          amount: getBookingAmount(booking),
        }))
        .filter(
          (entry) =>
            entry.time > 0 && entry.amount > 0
        ),
    [paidBookings]
  );

  /*
   * ⭐ RATING — read from the live profile the backend
   * returns (`rating`, falling back to `averageRating`).
   * When the profile provides none, we show "—".
   */
  const averageRating = Number(
    provider?.rating ??
    provider?.averageRating ??
    0
  );

  const reviewCount = Number(
    provider?.reviewCount ?? 0
  );

  const hasRating = averageRating > 0;

  const providerName =
    provider?.name ||
    provider?.fullName ||
    authUser?.name ||
    "Provider";

  const firstName = providerName.split(" ")[0];

  const profileImage =
    provider?.avatar ||
    provider?.profileImage ||
    authUser?.avatar ||
    "";

  const verified =
    provider?.verified === true ||
    provider?.status === "verified";

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 17
        ? "Good afternoon"
        : "Good evening";

  /* Loading screen */
  if (loading) {
    return (
      <DashboardLayout role="provider" navItems={providerNavItems}>
        <div
          className="space-y-6"
          aria-busy="true"
          aria-label="Loading your dashboard"
        >
          <Skeleton className="h-48 w-full rounded-3xl sm:h-52" />

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton
                key={item}
                className="h-32 rounded-2xl"
              />
            ))}
          </div>

          <Skeleton className="h-72 rounded-2xl" />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Skeleton className="h-80 rounded-2xl xl:col-span-2" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="provider" navItems={providerNavItems}>
      {/* ============================ WELCOME BANNER ============================ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 text-white shadow-soft dark:from-brand-800 dark:via-brand-900 dark:to-brand-950"
      >
        {/* Decorative service-themed accents */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-white/5" />
          <div className="absolute right-[20%] top-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
            <Camera className="h-6 w-6 text-white/70" />
          </div>
          <div className="absolute bottom-8 right-[7%] hidden h-20 w-20 items-center justify-center rounded-full bg-white/10 sm:flex">
            <Sparkles className="h-8 w-8 text-white/60" />
          </div>
          <div className="absolute bottom-3 right-[34%] hidden h-11 w-11 items-center justify-center rounded-full bg-white/10 md:flex">
            <Store className="h-5 w-5 text-white/70" />
          </div>
          <div className="absolute -left-8 top-10 hidden h-28 w-28 rounded-full border border-white/10 md:block" />
        </div>

        <div className="relative flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Link
              to="/provider/profile"
              aria-label="Open your provider profile"
              className="relative shrink-0"
            >
              <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/15 ring-2 ring-white/30 sm:h-16 sm:w-16">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={`${firstName}'s profile`}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <User className="h-7 w-7 text-white" />
                )}
              </span>

              {verified && (
                <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm">
                  <BadgeCheck className="h-4 w-4 text-brand-600" />
                </span>
              )}
            </Link>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
                  Provider Dashboard
                </span>

                {verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified
                  </span>
                )}
              </div>

              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                {greeting},{" "}
                <span className="text-brand-100">
                  {firstName}
                </span>{" "}
                👋
              </h1>

              <p className="mt-1.5 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
                Every booking grows your campus business —
                keep your services sharp and your calendar
                open, and watch the work come to you.
              </p>

              <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/70">
                <span className="inline-flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  Live
                </span>

                {lastUpdated && (
                  <span>
                    Updated{" "}
                    {lastUpdated.toLocaleTimeString("en-NG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}

                <span className="hidden sm:inline">
                  · {activeServices.length} service
                  {activeServices.length === 1 ? "" : "s"}{" "}
                  published · {bookings.length} booking
                  {bookings.length === 1 ? "" : "s"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2.5">
            <Link
              to="/provider/profile"
              className="btn bg-white px-4 py-2.5 text-sm text-brand-700 shadow-sm hover:bg-brand-50"
            >
              View Public Profile
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/provider/add-service"
              className="btn border border-white/30 bg-white/10 px-4 py-2.5 text-sm text-white backdrop-blur hover:bg-white/20"
            >
              <Plus className="h-4 w-4" />
              Add Service
            </Link>

            <button
              type="button"
              onClick={() => void loadDashboard(true)}
              disabled={refreshing}
              aria-label="Refresh dashboard data"
              className="btn border border-white/20 px-3.5 py-2.5 text-sm text-white/90 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4",
                  refreshing && "animate-spin"
                )}
              />
              Refresh
            </button>
          </div>
        </div>
      </motion.section>

      {/* ============================ ERROR BANNER ============================ */}
      {error && (
        <div
          role="alert"
          className="mt-6 flex flex-col gap-3 rounded-2xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700 sm:flex-row sm:items-center sm:justify-between dark:border-danger-500/25 dark:bg-danger-500/10 dark:text-danger-200"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-danger-200 bg-white px-3 py-1.5 text-xs font-semibold text-danger-700 transition hover:bg-danger-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-danger-500/30 dark:bg-transparent dark:text-danger-200 dark:hover:bg-danger-500/15"
          >
            <RefreshCw
              className={cn(
                "h-3.5 w-3.5",
                refreshing && "animate-spin"
              )}
            />
            Try again
          </button>
        </div>
      )}

      {/* ============================ STATS ============================ */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Bookings"
          value={bookings.length.toLocaleString("en-NG")}
          icon={ClipboardList}
          color="brand"
        />

        <StatCard
          label="Total Earnings"
          value={formatNaira(totalEarnings)}
          icon={DollarSign}
          color="success"
          trend={
            paidBookings.length > 0
              ? `${paidBookings.length} paid`
              : undefined
          }
        />

        <StatCard
          label="Pending Requests"
          value={String(pendingBookings.length)}
          icon={Inbox}
          color="warning"
        />

        <StatCard
          label="Average Rating"
          value={hasRating ? averageRating.toFixed(1) : "—"}
          icon={Star}
          color="rose"
          trend={
            reviewCount > 0
              ? `${reviewCount} review${reviewCount === 1 ? "" : "s"}`
              : undefined
          }
        />
      </div>

      {/* ============================ EARNINGS OVERVIEW ============================ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        aria-labelledby="earnings-heading"
        className="card mt-6 overflow-hidden"
      >
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:border-ink-800">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
              <TrendingUp className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2
                id="earnings-heading"
                className="text-base font-bold tracking-tight text-slate-900 sm:text-lg dark:text-ink-50"
              >
                Earnings Overview
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-ink-400">
                Paid bookings grouped by month
              </p>
            </div>
          </div>

          <div className="sm:text-right">
            <p className="text-2xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-ink-50">
              {formatNaira(totalEarnings)}
            </p>
            <p className="text-xs text-slate-500 dark:text-ink-400">
              Total received · {paidBookings.length} paid booking
              {paidBookings.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {error ? (
            <ErrorState
              message={error}
              onRetry={() => void loadDashboard(true)}
            />
          ) : earningsEntries.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Earnings will appear here once bookings are paid"
              description="As soon as customers pay for your services, your monthly earnings chart will start to build itself."
              action={
                <Link to="/provider/add-service" className="btn-primary btn-sm">
                  Add a service
                </Link>
              }
            />
          ) : (
            <EarningsChart entries={earningsEntries} />
          )}
        </div>
      </motion.section>

      {/* ==================== RECENT BOOKINGS + SERVICES ==================== */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ---------- RECENT BOOKING REQUESTS ---------- */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          aria-labelledby="recent-bookings-heading"
          className="min-w-0 xl:col-span-2"
        >
          <PanelHeading
            icon={CheckCircle2}
            tone="success"
            title="Recent Booking Requests"
            subtitle="Your latest customer bookings, newest first"
            action={
              <Link
                to="/provider/bookings"
                className="group inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-ink-700 dark:bg-transparent dark:text-ink-300 dark:hover:border-brand-700 dark:hover:text-brand-300"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            }
          />

          <div id="recent-bookings-heading" className="sr-only">
            Recent booking requests
          </div>

          {error && bookings.length === 0 ? (
            <ErrorState
              message={error}
              onRetry={() => void loadDashboard(true)}
            />
          ) : previewBookings.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No booking requests yet"
              description="When customers book one of your services, their request will appear here so you can follow it from start to finish."
              action={
                <Link to="/provider/services" className="btn-outline btn-sm">
                  Manage your services
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {previewBookings.map((booking, index) => (
                <BookingRow
                  key={
                    getId(booking) ||
                    `${index}-${getServiceName(booking)}`
                  }
                  booking={booking}
                  index={index}
                />
              ))}

              {extraBookingsCount > 0 && (
                <Link
                  to="/provider/bookings"
                  className="group flex items-center justify-between rounded-2xl border border-dashed border-brand-300 bg-lavender/60 px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-lavender dark:border-brand-800 dark:bg-brand-950/30 dark:text-brand-300 dark:hover:bg-brand-950/50"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                      +{extraBookingsCount}
                    </span>
                    More booking
                    {extraBookingsCount === 1 ? "" : "s"} waiting
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}
            </div>
          )}
        </motion.section>

        {/* ---------- ACTIVE SERVICES ---------- */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          aria-labelledby="services-heading"
          className="min-w-0"
        >
          <PanelHeading
            icon={Sparkles}
            title="Your Services"
            subtitle={
              activeServices.length === 0
                ? "Nothing published yet"
                : `${activeServices.length} published · latest first`
            }
            action={
              <Link
                to="/provider/services"
                aria-label="View all services"
                className="group inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-ink-700 dark:bg-transparent dark:text-ink-300 dark:hover:border-brand-700 dark:hover:text-brand-300"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            }
          />

          <div id="services-heading" className="sr-only">
            Your services
          </div>

          {error && services.length === 0 ? (
            <ErrorState
              message={error}
              onRetry={() => void loadDashboard(true)}
            />
          ) : previewServices.length === 0 ? (
            <EmptyState
              icon={ImageIcon}
              title="No active services"
              description="Add a service so customers can discover what you offer."
              action={
                <Link to="/provider/add-service" className="btn-primary btn-sm">
                  <Plus className="h-4 w-4" />
                  Add a service
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {previewServices.map((service, index) => (
                <ServiceRow
                  key={
                    getId(service) ||
                    `${service.title}-${index}`
                  }
                  service={service}
                  index={index}
                />
              ))}

              {extraServicesCount > 0 && (
                <Link
                  to="/provider/services"
                  className="group flex items-center justify-between rounded-2xl border border-dashed border-brand-300 bg-lavender/60 px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-lavender dark:border-brand-800 dark:bg-brand-950/30 dark:text-brand-300 dark:hover:bg-brand-950/50"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                      +{extraServicesCount}
                    </span>
                    More service
                    {extraServicesCount === 1 ? "" : "s"}
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}
            </div>
          )}

          <Link
            to="/provider/add-service"
            className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-brand-300 bg-lavender/60 py-3.5 text-sm font-semibold text-brand-600 transition hover:bg-lavender dark:border-brand-800 dark:bg-brand-950/30 dark:text-brand-300 dark:hover:bg-brand-950/50"
          >
            <Plus className="h-4 w-4" />
            Add another service
          </Link>
        </motion.section>
      </div>
    </DashboardLayout>
  );
}


/* =========================================================
   PANEL HEADING (section header used by the lower grid)
========================================================= */

function PanelHeading({
  icon: Icon,
  title,
  subtitle,
  action,
  tone = "brand",
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  tone?: "brand" | "success";
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
            tone === "success"
              ? "bg-success-50 text-success-600 dark:bg-success-600/15 dark:text-success-200"
              : "bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300"
          )}
        >
          <Icon className="h-4 w-4" />
        </span>

        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-ink-50">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-ink-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {action}
    </div>
  );
}


/* =========================================================
   EARNINGS CHART — pure CSS bars, no charting library.
   Every value comes from real paid bookings.
========================================================= */

interface EarningsEntry {
  time: number;
  amount: number;
}

interface EarningsBucket {
  key: string;
  label: string;
  fullLabel: string;
  amount: number;
}

function buildEarningsBuckets(
  entries: EarningsEntry[]
): EarningsBucket[] {
  if (entries.length === 0) return [];

  const times = entries.map((entry) => entry.time);
  const first = new Date(Math.min(...times));
  const last = new Date(Math.max(...times));

  /* Every calendar month between the first and last payment */
  const months: Array<{ y: number; m: number }> = [];
  const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
  const end = new Date(last.getFullYear(), last.getMonth(), 1);

  while (
    cursor.getTime() <= end.getTime() &&
    months.length < 60
  ) {
    months.push({
      y: cursor.getFullYear(),
      m: cursor.getMonth(),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const totals = new Map<string, number>();

  for (const entry of entries) {
    const date = new Date(entry.time);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    totals.set(key, (totals.get(key) || 0) + entry.amount);
  }

  /* Keep the chart readable: newest months individually,
     everything older collapses into one "Earlier" bar. */
  const startIdx = Math.max(
    0,
    months.length - CHART_MAX_BARS
  );

  const buckets: EarningsBucket[] = [];

  if (startIdx > 0) {
    let earlierAmount = 0;

    for (const month of months.slice(0, startIdx)) {
      earlierAmount +=
        totals.get(`${month.y}-${month.m}`) || 0;
    }

    buckets.push({
      key: "earlier",
      label: "Earlier",
      fullLabel: "Earlier months",
      amount: earlierAmount,
    });
  }

  const crossesYear =
    months.length > 1 &&
    months[0].y !== months[months.length - 1].y;

  for (const month of months.slice(startIdx)) {
    const date = new Date(month.y, month.m, 1);
    const key = `${month.y}-${month.m}`;

    buckets.push({
      key,
      label: crossesYear
        ? `${date.toLocaleDateString("en-NG", {
            month: "short",
          })} ${String(month.y).slice(2)}`
        : date.toLocaleDateString("en-NG", {
            month: "short",
          }),
      fullLabel: date.toLocaleDateString("en-NG", {
        month: "long",
        year: "numeric",
      }),
      amount: totals.get(key) || 0,
    });
  }

  return buckets;
}

function EarningsChart({
  entries,
}: {
  entries: EarningsEntry[];
}) {
  const buckets = useMemo(
    () => buildEarningsBuckets(entries),
    [entries]
  );

  const maxAmount = buckets.reduce(
    (max, bucket) => Math.max(max, bucket.amount),
    0
  );

  const chartTotal = buckets.reduce(
    (total, bucket) => total + bucket.amount,
    0
  );

  const peak = buckets.reduce<EarningsBucket | null>(
    (best, bucket) =>
      !best || bucket.amount > best.amount
        ? bucket
        : best,
    null
  );

  const latestTime = entries.reduce(
    (latest, entry) => Math.max(latest, entry.time),
    0
  );

  const latestPaymentLabel = latestTime
    ? new Date(latestTime).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  const ariaLabel =
    "Monthly earnings from paid bookings. " +
    buckets
      .map(
        (bucket) =>
          `${bucket.fullLabel}: ${
            bucket.amount > 0
              ? formatNaira(bucket.amount)
              : "no earnings"
          }`
      )
      .join("; ");

  return (
    <div>
      {/* legend + best month */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-ink-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand-500 dark:bg-brand-400" />
          Paid earnings per month
        </span>

        {peak && peak.amount > 0 && (
          <span>
            Best month:{" "}
            <span className="font-semibold text-slate-700 dark:text-ink-200">
              {peak.fullLabel}
            </span>{" "}
            ·{" "}
            <span className="font-semibold tabular-nums text-brand-600 dark:text-brand-300">
              {formatNaira(peak.amount)}
            </span>
          </span>
        )}
      </div>

      {/* bars */}
      <div role="img" aria-label={ariaLabel}>
        <div className="flex h-44 items-end gap-1.5 sm:gap-3">
          {buckets.map((bucket, index) => {
            const height =
              bucket.amount > 0
                ? Math.max(
                    6,
                    (bucket.amount / maxAmount) * 80
                  )
                : 4;

            return (
              <div
                key={bucket.key}
                title={`${bucket.fullLabel}: ${
                  bucket.amount > 0
                    ? formatNaira(bucket.amount)
                    : "No earnings"
                }`}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
              >
                <span
                  className={cn(
                    "mb-1.5 truncate text-[9px] font-bold tabular-nums sm:text-[10px]",
                    bucket.amount > 0
                      ? "text-slate-600 dark:text-ink-300"
                      : "text-slate-400 dark:text-ink-500"
                  )}
                >
                  {bucket.amount > 0
                    ? compactNaira(bucket.amount)
                    : "—"}
                </span>

                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{
                    duration: 0.5,
                    delay: 0.1 + index * 0.05,
                    ease: "easeOut",
                  }}
                  className={cn(
                    "mx-auto w-full max-w-16 rounded-t-md",
                    bucket.amount > 0
                      ? "bg-gradient-to-t from-brand-600 to-brand-400 dark:from-brand-500 dark:to-brand-400"
                      : "bg-slate-200 dark:bg-ink-700"
                  )}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-2 flex gap-1.5 border-t border-slate-100 pt-2 sm:gap-3 dark:border-ink-800">
          {buckets.map((bucket) => (
            <span
              key={bucket.key}
              title={bucket.fullLabel}
              className="min-w-0 flex-1 truncate text-center text-[9px] font-medium text-slate-400 sm:text-[10px] dark:text-ink-500"
            >
              {bucket.label}
            </span>
          ))}
        </div>
      </div>

      {/* summary chips */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MiniStat
          icon={DollarSign}
          label="Chart total"
          value={formatNaira(chartTotal)}
        />
        <MiniStat
          icon={CheckCircle2}
          label="Paid bookings"
          value={entries.length.toLocaleString("en-NG")}
        />
        <div className="col-span-2 sm:col-span-1">
          <MiniStat
            icon={Calendar}
            label="Latest payment"
            value={latestPaymentLabel}
          />
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="h-full rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-ink-800 dark:bg-ink-800/50">
      <div className="flex items-center gap-1.5 text-slate-500 dark:text-ink-400">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate text-[11px] font-medium">
          {label}
        </span>
      </div>
      <p className="mt-1 truncate text-sm font-bold tabular-nums text-slate-900 dark:text-ink-50">
        {value}
      </p>
    </div>
  );
}


/* =========================================================
   BOOKING ROW
========================================================= */

function BookingRow({
  booking,
  index,
}: {
  booking: Booking;
  index: number;
}) {
  const customerName = getCustomerName(booking);
  const customerAvatar = getCustomerAvatar(booking);
  const serviceName = getServiceName(booking);

  const price = getBookingAmount(booking);
  const paid = isPaid(booking);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.25,
        delay: index * 0.05,
      }}
      className="group rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card transition hover:border-brand-200/70 hover:shadow-card-hover dark:border-ink-800 dark:bg-ink-900 dark:hover:border-brand-900"
    >
      <div className="flex items-start gap-3">
        <Avatar
          src={customerAvatar || undefined}
          name={customerName}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
                {serviceName}
              </h3>
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-ink-400">
                {customerName}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-sm font-bold tabular-nums text-slate-900 dark:text-ink-50">
                {price > 0 ? formatNaira(price) : "—"}
              </p>
              {paid && (
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-success-600 dark:text-success-500">
                  Paid
                </p>
              )}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-ink-400">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {getBookingDate(booking)}
            </span>

            {booking.time && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {booking.time}
              </span>
            )}

            {booking.location && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {booking.location}
                </span>
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <BookingStatusBadge
              status={normalizeBookingStatus(booking)}
            />

            <Link
              to={`/provider/bookings?booking=${getId(booking)}`}
              aria-label={`View details for ${serviceName} booked by ${customerName}`}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-brand-600 transition hover:bg-lavender dark:text-brand-300 dark:hover:bg-brand-950"
            >
              View details
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}


/* =========================================================
   SERVICE ROW
========================================================= */

function ServiceRow({
  service,
  index,
}: {
  service: Service;
  index: number;
}) {
  const image = getServiceImage(service);
  const title = service.title || "Untitled service";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.25,
        delay: index * 0.05,
      }}
    >
      <Link
        to="/provider/services"
        aria-label={`View ${title} in your services`}
        className="group flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-3 shadow-card transition hover:border-brand-200/70 hover:shadow-card-hover dark:border-ink-800 dark:bg-ink-900 dark:hover:border-brand-900"
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-lavender dark:bg-brand-950">
          {image ? (
            <img
              src={image}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-brand-400 dark:text-brand-600">
              <ImageIcon className="h-5 w-5" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
            {title}
          </h3>

          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-ink-400">
            {service.category || "Service"}
          </p>

          {service.duration && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-ink-500">
              <Clock className="h-3 w-3 shrink-0" />
              {service.duration}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-ink-50">
            {Number(service.price || 0) > 0
              ? formatNaira(Number(service.price || 0))
              : "—"}
          </span>

          <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-slate-400 transition group-hover:text-brand-600 dark:text-ink-500 dark:group-hover:text-brand-300">
            View
            <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
