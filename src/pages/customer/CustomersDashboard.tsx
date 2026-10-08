import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  Compass,
  Heart,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  User,
  Users,
  Wallet,
} from "lucide-react";

import {
  DashboardLayout,
  DashboardHeader,
} from "@/components/DashboardLayout";
import { ProviderCard, StatusBadge } from "@/components/shared";
import { useAuth, useBookings } from "@/context/AppContext";
import { customerNavItems } from "@/data/customerNavItems";


const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

/* =========================================================
   HELPERS
========================================================= */

const formatNaira = (amount: number) => {
  return `₦${Number(amount || 0).toLocaleString(
    "en-NG"
  )}`;
};

const formatDate = (date?: string) => {
  if (!date) return "";

  try {
    return new Date(date).toLocaleDateString(
      "en-NG",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  } catch {
    return "";
  }
};

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const getProviderName = (provider: any) => {
  return (
    provider?.fullName ||
    provider?.name ||
    "Service Provider"
  );
};

const getProviderImage = (provider: any) => {
  return (
    provider?.avatar ||
    provider?.profileImage ||
    "/images/default-avatar.png"
  );
};

const getProviderRating = (provider: any) => {
  return Number(provider?.rating || 0);
};

const getProviderReviewCount = (provider: any) => {
  return Number(provider?.reviewCount || 0);
};

/* =========================================================
   TYPES
========================================================= */

interface Booking {
  _id?: string;
  id?: string;
  status: string;
  serviceName?: string;
  service?: {
    title?: string;
    image?: string;
  };
  provider?: {
    _id?: string;
    fullName?: string;
    name?: string;
    avatar?: string;
    profileImage?: string;
  };
  providerName?: string;
  providerAvatar?: string;
  date?: string;
  time?: string;
  price?: number;
  amount?: number;
  createdAt?: string;
}

interface Provider {
  _id: string;
  fullName?: string;
  name?: string;
  avatar?: string;
  profileImage?: string;
  categories?: string[];
  location?: string;
  rating?: number;
  reviewCount?: number;
  completedBookings?: number;
  verified?: boolean;
  status?: string;
  hourlyRate?: number;
  price?: number;
}

interface Stats {
  upcoming: number;
  pending: number;
  completed: number;
  saved: number;
  totalSpent: number;
  totalBookings: number;
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export function CustomersDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { savedProviders } = useBookings();

  /* =========================================================
     STATE
  ========================================================= */

  const [bookings, setBookings] = useState<Booking[]>(
    []
  );
  const [recommended, setRecommended] = useState<
    Provider[]
  >([]);

  const [bookingsLoading, setBookingsLoading] =
    useState(true);
  const [recommendedLoading, setRecommendedLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<
    Date | null
  >(null);

  /* =========================================================
     FETCH BOOKINGS
  ========================================================= */

  const fetchBookings = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setBookingsLoading(true);

        const token =
          sessionStorage.getItem(
            "servicely_token"
          );

        if (!token) return;

        const response = await fetch(
          `${API_URL}/bookings/my-bookings`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (
          !response.ok ||
          result.success === false
        ) {
          throw new Error(
            result.message ||
              "Unable to load bookings."
          );
        }

        const list = Array.isArray(result.bookings)
          ? result.bookings
          : Array.isArray(result.data)
          ? result.data
          : [];

        setBookings(list);
      } catch (err) {
        console.error(
          "Fetch customer bookings error:",
          err
        );

        if (!silent) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load bookings."
          );
        }
      } finally {
        if (!silent) setBookingsLoading(false);
      }
    },
    []
  );

  /* =========================================================
     FETCH RECOMMENDED PROVIDERS
  ========================================================= */

  const fetchRecommended = useCallback(
    async (silent = false) => {
      try {
        if (!silent)
          setRecommendedLoading(true);

        const token =
          sessionStorage.getItem(
            "servicely_token"
          );

        const response = await fetch(
          `${API_URL}/provider/allproviders`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {}),
            },
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to load providers."
          );
        }

        const list = Array.isArray(result.providers)
          ? result.providers
          : Array.isArray(result.data)
          ? result.data
          : [];

        /*
         * Pick the top-rated verified providers first,
         * then fill with the rest, and cap at 4.
         */
        const sorted = [...list].sort(
          (a: Provider, b: Provider) => {
            const aScore =
              (a.verified ? 100 : 0) +
              getProviderRating(a) * 10 +
              getProviderReviewCount(a) * 0.1;
            const bScore =
              (b.verified ? 100 : 0) +
              getProviderRating(b) * 10 +
              getProviderReviewCount(b) * 0.1;
            return bScore - aScore;
          }
        );

        setRecommended(sorted.slice(0, 4));
      } catch (err) {
        console.error(
          "Fetch recommended providers error:",
          err
        );
      } finally {
        if (!silent)
          setRecommendedLoading(false);
      }
    },
    []
  );

  /* =========================================================
     INITIAL FETCH
  ========================================================= */

  useEffect(() => {
    fetchBookings();
    fetchRecommended();
    setLastUpdated(new Date());
  }, [fetchBookings, fetchRecommended]);

  /* =========================================================
     REAL-TIME AUTO-REFRESH
     
     Polls the backend every 15 seconds to keep the
     dashboard live. Also refreshes when the tab regains
     focus so it's always up to date when the user
     comes back.
  ========================================================= */

  useEffect(() => {
    const interval = window.setInterval(() => {
      fetchBookings(true);
      fetchRecommended(true);
      setLastUpdated(new Date());
    }, 15000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchBookings(true);
        fetchRecommended(true);
        setLastUpdated(new Date());
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      window.clearInterval(interval);
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, [fetchBookings, fetchRecommended]);

  /* =========================================================
     MANUAL REFRESH
  ========================================================= */

  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");

    await Promise.all([
      fetchBookings(true),
      fetchRecommended(true),
    ]);

    setLastUpdated(new Date());
    setRefreshing(false);
  };

  /* =========================================================
     DERIVED DATA
  ========================================================= */

  const upcoming = useMemo(
    () =>
      bookings
        .filter((b) =>
          ["accepted", "paid", "in_progress"].includes(
            b.status
          )
        )
        .sort((a, b) => {
          const aDate = a.date
            ? new Date(a.date).getTime()
            : 0;
          const bDate = b.date
            ? new Date(b.date).getTime()
            : 0;
          return aDate - bDate;
        })
        .slice(0, 4),
    [bookings]
  );

  const stats: Stats = useMemo(() => {
    const completed = bookings.filter((b) =>
      ["completed", "reviewed"].includes(b.status)
    );

    const totalSpent = completed.reduce(
      (sum, b) =>
        sum + Number(b.price || b.amount || 0),
      0
    );

    return {
      upcoming: bookings.filter((b) =>
        ["accepted", "paid", "in_progress"].includes(
          b.status
        )
      ).length,
      pending: bookings.filter(
        (b) => b.status === "pending"
      ).length,
      completed: completed.length,
      saved: savedProviders.length,
      totalSpent,
      totalBookings: bookings.length,
    };
  }, [bookings, savedProviders]);

  const firstName =
    user?.name?.split(" ")[0] ||
    // user?.fullName?.split(" ")[0] ||
    "there";

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <DashboardLayout
      role="customer"
      navItems={customerNavItems}
    >
      <DashboardHeader
        title={`${getGreeting()}, ${firstName} 👋`}
        subtitle="Here's what's happening with your bookings"
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 text-sm font-semibold text-ink-700 transition hover:bg-ink-50 disabled:opacity-60 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800"
              aria-label="Refresh dashboard"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline">
                Refresh
              </span>
            </button>

            <Link
              to="/customer/browse"
              className="btn-primary"
            >
              <Search className="h-4 w-4" />
              Browse Services
            </Link>
          </div>
        }
      />

      {/* =====================================================
          LIVE STATUS BANNER
      ===================================================== */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-4 py-3 dark:border-emerald-500/20 dark:from-emerald-500/10 dark:to-ink-900"
      >
        <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>

          <span className="font-semibold">
            Live updates enabled
          </span>

          {lastUpdated && (
            <span className="text-emerald-600/70 dark:text-emerald-400/70">
              · Updated{" "}
              {lastUpdated.toLocaleTimeString(
                "en-NG",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </span>
          )}
        </div>

        <span className="hidden text-xs text-emerald-600 dark:text-emerald-400 sm:block">
          Auto-refreshes every 15s
        </span>
      </motion.div>

      {/* =====================================================
          ERROR
      ===================================================== */}
      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              {error}
            </p>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-500/20 dark:bg-ink-900 dark:text-red-400"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          HERO STATS
      ===================================================== */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <LiveStatCard
          label="Upcoming"
          value={stats.upcoming}
          icon={CalendarClock}
          color="primary"
          loading={bookingsLoading}
          delay={0}
        />

        <LiveStatCard
          label="Pending"
          value={stats.pending}
          icon={Clock}
          color="accent"
          loading={bookingsLoading}
          delay={0.05}
        />

        <LiveStatCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          color="sky"
          loading={bookingsLoading}
          delay={0.1}
        />

        <LiveStatCard
          label="Saved"
          value={stats.saved}
          icon={Heart}
          color="rose"
          loading={bookingsLoading}
          delay={0.15}
        />
      </div>

      {/* =====================================================
          QUICK ACTIONS
      ===================================================== */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickAction
          to="/customer/browse"
          icon={Compass}
          label="Browse services"
          color="primary"
        />
        <QuickAction
          to="/customer/bookings"
          icon={BookOpen}
          label="My bookings"
          color="accent"
        />
        <QuickAction
          to="/customer/messages"
          icon={MessageSquare}
          label="Messages"
          color="sky"
        />
        <QuickAction
          to="/customer/profile"
          icon={User}
          label="Profile"
          color="rose"
        />
      </div>

      {/* =====================================================
          UPCOMING BOOKINGS
      ===================================================== */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-ink-900 dark:text-ink-50">
              Upcoming Bookings
            </h2>

            {upcoming.length > 0 && (
              <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-700 dark:bg-primary-500/20 dark:text-primary-300">
                {upcoming.length}
              </span>
            )}
          </div>

          <Link
            to="/customer/bookings"
            className="group inline-flex items-center gap-1 text-sm font-semibold text-primary-600 transition hover:text-primary-700 dark:text-primary-400"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {bookingsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="card flex items-center gap-4 p-4"
              >
                <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-ink-100 dark:bg-ink-800" />

                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
                  <div className="h-3 w-56 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
                </div>

                <div className="h-6 w-20 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
              </div>
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card relative overflow-hidden flex flex-col items-center justify-center py-14 text-center"
          >
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-400/10 blur-3xl" />

            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
              <Calendar className="h-7 w-7" />
            </div>

            <h3 className="relative mt-4 text-base font-bold text-ink-900 dark:text-white">
              No upcoming bookings
            </h3>

            <p className="relative mt-1 max-w-sm text-sm text-ink-500 dark:text-ink-400">
              When you book a service, it will show up
              here with all the details.
            </p>

            <Link
              to="/customer/browse"
              className="btn-primary btn-sm relative mt-5"
            >
              <Compass className="h-4 w-4" />
              Browse Services
            </Link>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {upcoming.map((booking, i) => (
                <UpcomingBookingCard
                  key={
                    booking._id ||
                    booking.id ||
                    i
                  }
                  booking={booking}
                  index={i}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* =====================================================
          SPENDING SUMMARY
      ===================================================== */}
      {!bookingsLoading && stats.totalBookings > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-emerald-950 p-6 shadow-xl sm:p-8"
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-400/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-accent-400/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60">
                <Wallet className="h-3.5 w-3.5" />
                Total spent on services
              </div>

              <p className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                {formatNaira(stats.totalSpent)}
              </p>

              <p className="mt-1 text-sm text-white/60">
                Across {stats.completed}{" "}
                {stats.completed === 1
                  ? "completed booking"
                  : "completed bookings"}
              </p>
            </div>

            <Link
              to="/customer/bookings"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
            >
              View all bookings
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* =====================================================
          RECOMMENDED PROVIDERS
      ===================================================== */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />

            <h2 className="font-display text-lg font-bold text-ink-900 dark:text-ink-50">
              Recommended for you
            </h2>
          </div>

          <Link
            to="/customer/browse"
            className="group inline-flex items-center gap-1 text-sm font-semibold text-primary-600 transition hover:text-primary-700 dark:text-primary-400"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {recommendedLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="card overflow-hidden p-0"
              >
                <div className="h-40 animate-pulse bg-ink-100 dark:bg-ink-800" />

                <div className="space-y-3 p-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
                  <div className="h-8 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
                </div>
              </div>
            ))}
          </div>
        ) : recommended.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-10 w-10 text-ink-300" />

            <p className="mt-3 text-sm text-ink-500">
              No providers available right now.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {recommended.map((provider, i) => (
              <motion.div
                key={provider._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() =>
                  navigate(
                    `/provider/${provider._id}`
                  )
                }
                className="cursor-pointer"
              >
                <LiveProviderCard provider={provider} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/* =========================================================
   LIVE STAT CARD
========================================================= */

function LiveStatCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
  delay = 0,
}: {
  label: string;
  value: number;
  icon: any;
  color:
    | "primary"
    | "accent"
    | "sky"
    | "rose";
  loading?: boolean;
  delay?: number;
}) {
  const colorStyles = {
    primary:
      "bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400",
    accent:
      "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    sky: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
  } as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="card group relative overflow-hidden p-5"
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary-400/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-primary-400/10" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500">
            {label}
          </p>

          {loading ? (
            <div className="mt-3 h-7 w-12 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
          ) : (
            <motion.p
              key={value}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-2xl font-black tracking-tight text-ink-900 dark:text-white"
            >
              {value}
            </motion.p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${colorStyles[color]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
  to,
  icon: Icon,
  label,
  color,
}: {
  to: string;
  icon: any;
  label: string;
  color:
    | "primary"
    | "accent"
    | "sky"
    | "rose";
}) {
  const colorStyles = {
    primary:
      "bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400",
    accent:
      "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    sky: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
  } as const;

  return (
    <Link
      to={to}
      className="card group flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${colorStyles[color]}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <span className="truncate text-sm font-semibold text-ink-800 dark:text-ink-100">
        {label}
      </span>
    </Link>
  );
}

/* =========================================================
   UPCOMING BOOKING CARD
========================================================= */

function UpcomingBookingCard({
  booking,
  index,
}: {
  booking: Booking;
  index: number;
}) {
  const navigate = useNavigate();

  const serviceName =
    booking.serviceName ||
    booking.service?.title ||
    "Service";

  const providerName =
    booking.providerName ||
    getProviderName(booking.provider);

  const providerImage =
    booking.providerAvatar ||
    getProviderImage(booking.provider);

  const price = Number(
    booking.price || booking.amount || 0
  );

  const bookingId =
    booking._id || booking.id || "";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ delay: index * 0.05 }}
      onClick={() =>
        bookingId &&
        navigate(`/customer/bookings/${bookingId}`)
      }
      className="card group flex cursor-pointer items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative">
        <img
          src={providerImage}
          alt={providerName}
          onError={(e) => {
            e.currentTarget.src =
              "/images/default-avatar.png";
          }}
          className="h-12 w-12 shrink-0 rounded-xl object-cover"
        />

        <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 dark:border-ink-900">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-ink-900 dark:text-white">
          {serviceName}
        </h3>

        <p className="mt-0.5 truncate text-sm text-ink-500 dark:text-ink-400">
          {providerName}
          {booking.date && (
            <>
              {" · "}
              {formatDate(booking.date)}
            </>
          )}
          {booking.time && <> at {booking.time}</>}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-bold text-ink-900 dark:text-ink-50">
          {formatNaira(price)}
        </p>

        <div className="mt-1">
          <StatusBadge status={booking.status} />
        </div>
      </div>

      <ArrowRight className="hidden h-4 w-4 shrink-0 text-ink-300 transition-transform group-hover:translate-x-1 group-hover:text-primary-500 sm:block" />
    </motion.div>
  );
}

/* =========================================================
   LIVE PROVIDER CARD
   
   Wraps the shared ProviderCard with a rank badge on
   top so recommended providers feel more premium.
========================================================= */

function LiveProviderCard({
  provider,
}: {
  provider: Provider;
}) {
  const rating = getProviderRating(provider);
  const reviewCount =
    getProviderReviewCount(provider);

  /*
   * Transform the backend provider shape into the
   * shape that the shared ProviderCard expects.
   */
  const providerForCard = {
    id: provider._id,
    _id: provider._id,
    name: getProviderName(provider),
    fullName: provider.fullName,
    avatar: getProviderImage(provider),
    profileImage: provider.profileImage,
    category: provider.categories?.[0] || "Service",
    categories: provider.categories || [],
    location: provider.location || "Not specified",
    rating,
    reviewCount,
    completedBookings:
      provider.completedBookings || 0,
    verified: provider.verified || false,
    hourlyRate:
      provider.hourlyRate || provider.price || 0,
  };

  return (
    <div className="relative">
      {provider.verified && (
        <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
          <Star className="h-3 w-3 fill-current" />
          Top rated
        </span>
      )}

      <ProviderCard provider={providerForCard as any} />
    </div>
  );
}