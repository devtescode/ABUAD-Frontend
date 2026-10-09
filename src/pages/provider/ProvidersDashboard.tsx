import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  DollarSign,
  Image as ImageIcon,
  Inbox,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Sparkles,
  Star,
  TrendingUp,
  User,
} from "lucide-react";

import {
  DashboardLayout,
  StatCard,
} from "@/components/DashboardLayout";

import {
  StatusBadge,
  VerifiedBadge,
} from "@/components/shared";

import { useAuth } from "@/context/AppContext";
import { formatNaira } from "@/data/mockData";
import { providerNavItems } from "@/data/providerNavItems";




const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

/*
 * Backend endpoints used by this dashboard:
 *
 *   GET /provider/eachprofile/:userId    → provider profile
 *   GET /provider/services               → provider's services
 *   GET /bookings/provider-bookings      → provider's bookings
 */
const PROFILE_ENDPOINT = "/provider/eachprofiledetails";
const SERVICES_ENDPOINT = "/provider/services";
const BOOKINGS_ENDPOINT = "/bookings/provider-bookings";
const REFRESH_INTERVAL = 30_000;

/* How many items each section shows before "+X more" */
const SERVICES_PREVIEW_LIMIT = 3;
const BOOKINGS_PREVIEW_LIMIT = 3;

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

const isPending = (status?: string) =>
  ["pending", "requested"].includes(
    String(status || "").toLowerCase()
  );

const isCancelled = (status?: string) =>
  ["cancelled", "canceled", "rejected"].includes(
    String(status || "").toLowerCase()
  );

const isCompleted = (status?: string) =>
  ["completed", "reviewed", "done"].includes(
    String(status || "").toLowerCase()
  );

const isPaid = (booking: Booking) =>
  String(booking.paymentStatus || "").toLowerCase() === "paid";

/*
 * Recent booking requests are:
 *   - paid
 *   - not completed / not reviewed
 *   - not cancelled
 */
const isRecentPaidRequest = (booking: Booking) => {
  const status = String(booking.status || "").toLowerCase();

  return (
    isPaid(booking) &&
    !isCompleted(status) &&
    !isCancelled(status)
  );
};

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

        /* =====================================================
           DEBUG LOGS — rating diagnostic
           
           These will show you exactly what the API returned.
           Remove once the rating is displaying correctly.
        ===================================================== */
        console.log("🔍 Profile from API:", profile);
        console.log("🔍 provider.rating:", profile?.rating);
        console.log(
          "🔍 provider.averageRating:",
          profile?.averageRating
        );
        console.log(
          "🔍 provider.reviewCount:",
          profile?.reviewCount
        );

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
     DERIVED DATA
  ========================================================= */

  /*
   * All active services (any order). Used for header counts.
   * Declared here so it's available in the JSX below.
   */
  const activeServices = useMemo(
    () => services.filter(isActiveService),
    [services]
  );

  /*
   * Active services sorted by most recent upload first
   * (createdAt, falling back to updatedAt).
   */
  const sortedActiveServices = useMemo(
    () =>
      services
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

  /*
   * Recent booking requests — paid but not completed.
   * Sorted by newest first.
   */
  const recentPaidRequests = useMemo(
    () =>
      bookings
        .filter(isRecentPaidRequest)
        .sort(
          (a, b) =>
            getBookingSortTime(b) -
            getBookingSortTime(a)
        ),
    [bookings]
  );

  const previewBookings = useMemo(
    () =>
      recentPaidRequests.slice(
        0,
        BOOKINGS_PREVIEW_LIMIT
      ),
    [recentPaidRequests]
  );

  const extraBookingsCount =
    recentPaidRequests.length - previewBookings.length;

  const pendingBookings = useMemo(
    () => bookings.filter((booking) => isPending(booking.status)),
    [bookings]
  );

  const totalEarnings = useMemo(
    () =>
      bookings.reduce((total, booking) => {
        if (!isPaid(booking) || isCancelled(booking.status)) {
          return total;
        }

        return (
          total +
          Number(
            booking.providerAmount ??
            booking.amount ??
            booking.price ??
            0
          )
        );
      }, 0),
    [bookings]
  );

  /*
   * ⭐ RATING
   *
   * The backend now returns `rating` (computed live from
   * reviews) AND `averageRating` (same value) AND
   * `reviewCount`.
   *
   * We read `rating` first, then fall back to
   * `averageRating`, then 0.
   */
  const averageRating = Number(
    provider?.rating ??
    provider?.averageRating ??
    0
  );

  const reviewCount = Number(
    provider?.reviewCount ?? 0
  );

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
    authUser?.profileImage ||
    "";

  const verified =
    provider?.verified === true ||
    provider?.status === "verified";

  /* Loading screen */
  if (loading) {
    return (
      <DashboardLayout role="provider" navItems={providerNavItems}>
        <div className="space-y-6">
          <div className="animate-pulse rounded-3xl border border-ink-200 bg-white p-6 dark:border-ink-800 dark:bg-ink-900">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-ink-200 dark:bg-ink-700" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-32 rounded bg-ink-200 dark:bg-ink-700" />
                <div className="h-7 w-48 max-w-full rounded bg-ink-200 dark:bg-ink-700" />
                <div className="h-3 w-56 max-w-full rounded bg-ink-200 dark:bg-ink-700" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl bg-ink-100 dark:bg-ink-800"
              />
            ))}
          </div>

          <div className="h-64 animate-pulse rounded-2xl bg-ink-100 dark:bg-ink-800" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="provider" navItems={providerNavItems}>
      {/* WELCOME */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative mb-8 overflow-hidden rounded-3xl border border-ink-200/70 bg-white shadow-sm dark:border-ink-800 dark:bg-ink-900"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-accent-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              to="/provider/profile"
              className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink-100 ring-4 ring-primary-500/15 dark:bg-ink-800"
            >
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
                <User className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              )}
            </Link>

            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">
                  Provider Dashboard
                </span>
                {verified && <VerifiedBadge />}
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-3xl">
                Hello,{" "}
                <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                  {firstName}
                </span>{" "}
                👋
              </h1>

              <p className="mt-1 text-sm leading-6 text-ink-500 dark:text-ink-400">
                Manage your bookings, services, and performance in one place.
              </p>

              <p className="mt-2 flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Dashboard connected
                {lastUpdated && (
                  <span>
                    · Updated{" "}
                    {lastUpdated.toLocaleTimeString("en-NG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadDashboard(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:border-primary-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-ink-700 dark:text-ink-200"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""
                  }`}
              />
              Refresh
            </button>

            <Link
              to="/provider/add-service"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Add Service
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ERROR */}
      {error && (
        <div
          role="alert"
          className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadDashboard(true)}
            className="inline-flex shrink-0 items-center gap-2 font-semibold"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      )}

      {/* STAT CARDS */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <StatCard
          label="Total Bookings"
          value={String(bookings.length)}
          icon={ClipboardList}
          color="primary"
        />

        <StatCard
          label="Pending Requests"
          value={String(pendingBookings.length)}
          icon={Inbox}
          color="accent"
        />

        <StatCard
          label="Paid Earnings"
          value={formatNaira(totalEarnings)}
          icon={DollarSign}
          color="sky"
        />

        <RatingCard
          rating={averageRating}
          reviewCount={reviewCount}
        />
      </motion.div>

      {/* RECENT BOOKING REQUESTS + ACTIVE SERVICES */}
      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* RECENT BOOKING REQUESTS */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="min-w-0 xl:col-span-2"
        >
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-lg font-bold text-ink-900 dark:text-white">
                  Recent Booking Requests
                </h2>
              </div>

              <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                Paid bookings waiting to be completed.
              </p>
            </div>

            <Link
              to="/provider/bookings"
              className="group inline-flex shrink-0 items-center gap-1 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-primary-300 hover:text-primary-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:border-primary-700 dark:hover:text-primary-300"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {previewBookings.length === 0 ? (
            <EmptyBookingsCard />
          ) : (
            <div className="space-y-3">
              {previewBookings.map((booking, index) => (
                <BookingRequestRow
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
                  className="group flex items-center justify-between rounded-2xl border border-dashed border-ink-300 bg-white px-4 py-3 text-sm font-semibold text-ink-600 transition hover:border-primary-400 hover:bg-primary-50/40 hover:text-primary-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:border-primary-700 dark:hover:bg-primary-950/20 dark:hover:text-primary-300"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-500/20 dark:text-primary-300">
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

        {/* ACTIVE SERVICES */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="min-w-0"
        >
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-lg font-bold text-ink-900 dark:text-white">
                  Active Services
                </h2>
              </div>

              <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                {activeServices.length === 0
                  ? "No services published"
                  : `Latest ${Math.min(
                    previewServices.length,
                    activeServices.length
                  )} of ${activeServices.length} published`}
              </p>
            </div>

            <Link
              to="/provider/services"
              aria-label="View all services"
              className="rounded-lg p-2 text-ink-500 transition hover:bg-ink-100 dark:hover:bg-ink-800"
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {previewServices.length === 0 ? (
            <EmptyServicesCard />
          ) : (
            <div className="space-y-3">
              {previewServices.map((service, index) => (
                <ServiceCard
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
                  className="group flex items-center justify-between rounded-2xl border border-dashed border-primary-300 bg-primary-50/50 px-4 py-3 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 dark:border-primary-800 dark:bg-primary-950/20 dark:text-primary-300 dark:hover:bg-primary-950/40"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-500/20 dark:text-primary-300">
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
            className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-primary-300 bg-primary-50/50 py-3.5 text-sm font-semibold text-primary-600 transition hover:bg-primary-50 dark:border-primary-800 dark:bg-primary-950/20 dark:text-primary-400"
          >
            <Plus className="h-4 w-4" />
            Add another service
          </Link>
        </motion.section>
      </div>

      {/* KEEP PROFILE FRESH */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mt-6 rounded-3xl border border-ink-200/70 bg-white p-5 shadow-sm sm:p-6 dark:border-ink-800 dark:bg-ink-900"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
              <TrendingUp className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-bold text-ink-900 dark:text-white">
                Keep your profile up to date
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-ink-500 dark:text-ink-400">
                Maintain your portfolio, availability, and services
                to help customers decide to book you.
              </p>
              <p className="mt-2 text-xs text-ink-500 dark:text-ink-400">
                {reviewCount > 0
                  ? `${reviewCount} review${reviewCount === 1 ? "" : "s"
                  } received`
                  : "Customer reviews will appear as they become available."}
              </p>
            </div>
          </div>

          <Link
            to="/provider/profile"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-ink-900"
          >
            Manage Profile
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.section>
    </DashboardLayout>
  );
}

/* =========================================================
   BOOKING REQUEST ROW
========================================================= */

function BookingRequestRow({
  booking,
  index,
}: {
  booking: Booking;
  index: number;
}) {
  const customerName = getCustomerName(booking);
  const customerAvatar = getCustomerAvatar(booking);
  const serviceName = getServiceName(booking);

  const price = Number(
    booking.providerAmount ??
    booking.amount ??
    booking.price ??
    0
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="group relative overflow-hidden rounded-2xl border border-ink-200/70 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-lg dark:border-ink-800 dark:bg-ink-900 dark:hover:border-primary-900"
    >
      <span className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600" />

      <div className="flex items-start gap-3 pl-2">
        <div className="relative shrink-0">
          {customerAvatar ? (
            <img
              src={customerAvatar}
              alt={customerName}
              className="h-11 w-11 rounded-full object-cover ring-2 ring-emerald-100 dark:ring-emerald-500/20"
              onError={(e) => {
                e.currentTarget.src =
                  "/images/default-avatar.png";
              }}
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-bold text-white ring-2 ring-primary-100 dark:ring-primary-500/20">
              {customerName.charAt(0).toUpperCase()}
            </div>
          )}

          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500 dark:border-ink-900">
            <CheckCircle2 className="h-2.5 w-2.5 text-white" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-ink-900 dark:text-white">
                {serviceName}
              </h3>

              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
                <User className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {customerName}
                </span>
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                {formatNaira(price)}
              </p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600/80 dark:text-emerald-500/80">
                Paid
              </p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-ink-500 dark:text-ink-400">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {getBookingDate(booking)}
            </span>

            {booking.time && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {booking.time}
              </span>
            )}

            {booking.location && (
              <span className="inline-flex items-center gap-1 max-w-full">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {booking.location}
                </span>
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <StatusBadge
              status={booking.status || "confirmed"}
            />

            <Link
              to={`/provider/bookings?booking=${getId(booking)}`}
              className="inline-flex items-center gap-1 rounded-lg border border-ink-200 px-2.5 py-1 text-[11px] font-bold text-ink-600 opacity-0 transition group-hover:opacity-100 hover:border-primary-300 hover:text-primary-700 dark:border-ink-700 dark:text-ink-300 dark:hover:border-primary-700 dark:hover:text-primary-300"
            >
              Details
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* =========================================================
   SERVICE CARD
========================================================= */

function ServiceCard({
  service,
  index,
}: {
  service: Service;
  index: number;
}) {
  const image = getServiceImage(service);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="group relative overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-lg dark:border-ink-800 dark:bg-ink-900 dark:hover:border-primary-900"
    >
      <div className="flex items-stretch">
        {/* ---------- COMPACT IMAGE ---------- */}
        <div className="relative w-24 shrink-0 overflow-hidden bg-ink-100 sm:w-28 dark:bg-ink-800">
          {image ? (
            <img
              src={image}
              alt={service.title || "Service"}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(event) => {
                event.currentTarget.src =
                  "/images/service-placeholder.png";
              }}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-ink-100 via-white to-primary-50 text-ink-400 dark:from-ink-900 dark:via-ink-800 dark:to-ink-900">
              <ImageIcon className="h-5 w-5" />
            </div>
          )}

          <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur">
            <Package className="h-2.5 w-2.5" />
            New
          </span>
        </div>

        {/* ---------- CONTENT ---------- */}
        <div className="flex min-w-0 flex-1 flex-col justify-between p-3.5">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 pr-1 text-sm font-bold leading-snug text-ink-900 dark:text-white">
                {service.title || "Untitled service"}
              </h3>

              <span className="shrink-0 rounded-lg bg-primary-50 px-2 py-1 text-xs font-black text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
                {formatNaira(Number(service.price || 0))}
              </span>
            </div>

            {service.category && (
              <p className="mt-1 line-clamp-1 text-[11px] font-medium uppercase tracking-wider text-ink-400 dark:text-ink-500">
                {service.category}
              </p>
            )}

            {service.description && (
              <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-ink-500 dark:text-ink-400">
                {service.description}
              </p>
            )}
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 text-[11px] text-ink-500 dark:text-ink-400">
              {service.duration && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {service.duration}
                </span>
              )}
            </div>

            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <CheckCircle2 className="h-3 w-3" />
              Available
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* =========================================================
   EMPTY STATES
========================================================= */

function EmptyBookingsCard() {
  return (
    <div className="rounded-2xl border border-dashed border-ink-300 bg-white px-5 py-10 text-center dark:border-ink-700 dark:bg-ink-900">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
        <Inbox className="h-6 w-6" />
      </div>

      <h3 className="mt-3 font-semibold text-ink-900 dark:text-white">
        No paid booking requests
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500 dark:text-ink-400">
        Once a customer pays for a service, their booking
        will appear here waiting for completion.
      </p>
    </div>
  );
}

function RatingCard({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) {
  const hasRatings = rating > 0 && reviewCount > 0;

  return (
    <div className="card group relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-rose-400/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-rose-400/10" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500">
            Average Rating
          </p>

          {hasRatings ? (
            <>
              <div className="mt-3 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFull = star <= Math.round(rating);
                  const isHalf =
                    !isFull &&
                    star - 0.5 <= rating &&
                    rating < star;

                  return (
                    <span
                      key={star}
                      className="relative inline-block h-5 w-5"
                    >
                      <Star className="absolute inset-0 h-5 w-5 text-ink-200 dark:text-ink-700" />

                      {(isFull || isHalf) && (
                        <span
                          className="absolute inset-0 overflow-hidden"
                          style={{
                            width: isFull ? "100%" : "50%",
                          }}
                        >
                          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                        </span>
                      )}
                    </span>
                  );
                })}

                <span className="ml-1 text-lg font-black tracking-tight text-ink-900 dark:text-white">
                  {rating.toFixed(1)}
                </span>
              </div>

              <p className="mt-2 text-xs text-ink-500 dark:text-ink-400">
                Based on{" "}
                <span className="font-semibold text-ink-700 dark:text-ink-200">
                  {reviewCount}
                </span>{" "}
                {reviewCount === 1 ? "review" : "reviews"}
              </p>
            </>
          ) : (
            <>
              <div className="mt-3 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="h-5 w-5 text-ink-200 dark:text-ink-700"
                  />
                ))}
              </div>

              <p className="mt-2 text-xs italic text-ink-400 dark:text-ink-500">
                No ratings yet
              </p>
            </>
          )}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-transform duration-300 group-hover:scale-110 dark:bg-rose-500/10 dark:text-rose-400">
          <Star className="h-5 w-5 fill-current" />
        </div>
      </div>
    </div>
  );
}

function EmptyServicesCard() {
  return (
    <div className="rounded-2xl border border-dashed border-ink-300 bg-white p-6 text-center dark:border-ink-700 dark:bg-ink-900">
      <ImageIcon className="mx-auto h-8 w-8 text-ink-400" />

      <h3 className="mt-3 text-sm font-semibold text-ink-900 dark:text-white">
        No active services
      </h3>

      <p className="mt-1 text-xs leading-5 text-ink-500 dark:text-ink-400">
        Add a service so customers can discover what you offer.
      </p>
    </div>
  );
}