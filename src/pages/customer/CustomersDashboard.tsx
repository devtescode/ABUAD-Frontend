import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Compass,
  Heart,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  User,
  Users,
  Wallet,
} from "lucide-react";

import {
  DashboardLayout,
  DashboardHeader,
  StatCard,
} from "@/components/DashboardLayout";
import {
  Avatar,
  BookingStatusBadge,
  Button,
  EmptyState,
  ErrorState,
  MarketplaceProviderCard,
  RenderErrorBoundary,
  SearchBar,
  Skeleton,
  SkeletonRows,
  providerId,
  type ProviderLike,
} from "@/components/ui";
import { useAuth, useBookings } from "@/context/AppContext";
import { customerNavItems } from "@/data/customerNavItems";
import { categories } from "@/data/mockData";

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

const bookingTimestamp = (booking: Booking) => {
  const base =
    booking.date ||
    booking.createdAt ||
    "";

  if (!base) return 0;

  const time = new Date(base).getTime();

  return Number.isNaN(time) ? 0 : time;
};

/**
 * Flatten the loosely-shaped API provider (which may nest
 * fields under `user` / `provider`) into the ProviderLike
 * shape MarketplaceProviderCard expects.
 */
const normalizeProvider = (raw: any): ProviderLike => {
  const id = String(
    raw?._id ||
    raw?.id ||
    raw?.user?._id ||
    raw?.provider?._id ||
    ""
  );

  const name =
    raw?.fullName ||
    raw?.name ||
    raw?.user?.fullName ||
    raw?.user?.name ||
    raw?.provider?.fullName ||
    raw?.provider?.name ||
    "Service Provider";

  const avatar = String(
    raw?.avatar ||
    raw?.profileImage ||
    raw?.user?.avatar ||
    raw?.user?.profileImage ||
    raw?.provider?.avatar ||
    raw?.provider?.profileImage ||
    "/images/default-avatar.png"
  );

  const categoryList: string[] = (
    Array.isArray(raw?.categories)
      ? raw.categories
      : Array.isArray(raw?.skills)
        ? raw.skills
        : []
  )
    .filter(Boolean)
    .map(String);

  const rating =
    Number(raw?.rating ?? raw?.averageRating ?? 0) ||
    0;

  const reviewCount =
    Number(
      raw?.reviewCount ?? raw?.totalReviews ?? 0
    ) || 0;

  const completedBookings =
    Number(
      raw?.completedBookings ?? raw?.jobs ?? 0
    ) || 0;

  const startingPrice =
    Number(
      raw?.startingPrice ??
      raw?.minServicePrice ??
      raw?.lowestPrice ??
      raw?.hourlyRate ??
      raw?.price ??
      0
    ) || 0;

  const about = String(
    raw?.description ||
    raw?.bio ||
    raw?.about ||
    ""
  );

  const portfolio = Array.isArray(raw?.portfolio)
    ? raw.portfolio
    : Array.isArray(raw?.portfolioItems)
      ? raw.portfolioItems
      : [];

  return {
    _id: id,
    id,
    fullName: name,
    name,
    avatar,
    profileImage: avatar,
    categories: categoryList,
    category:
      String(raw?.category || categoryList[0] || "") ||
      undefined,
    location:
      String(raw?.location || raw?.city || "") ||
      undefined,
    about,
    rating,
    reviewCount,
    completedBookings,
    verified: Boolean(raw?.verified),
    hourlyRate:
      Number(raw?.hourlyRate ?? 0) || undefined,
    startingPrice:
      startingPrice > 0 ? startingPrice : undefined,
    price:
      startingPrice > 0 ? startingPrice : undefined,
    portfolio,
  };
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
  const { savedProviders, toggleSavedProvider } =
    useBookings();

  const [bookings, setBookings] = useState<
    Booking[]
  >([]);
  const [recommended, setRecommended] = useState<
    any[]
  >([]);

  const [bookingsLoading, setBookingsLoading] =
    useState(true);
  const [recommendedLoading, setRecommendedLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");
  const [recommendedError, setRecommendedError] =
    useState("");
  const [lastUpdated, setLastUpdated] = useState<
    Date | null
  >(null);

  const [searchQuery, setSearchQuery] = useState("");

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

     Endpoint: GET /reviews/recommended?limit=4

     Backend returns providers sorted by rating (highest
     first) and includes `startingPrice` (the lowest
     active service price for each provider).
  ========================================================= */

  const fetchRecommended = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setRecommendedLoading(true);

        const token =
          sessionStorage.getItem(
            "servicely_token"
          );

        /*
         * Endpoint: /reviews/recommended (NOT /provider/...)
         */
        const url = `${API_URL}/reviews/recommended?limit=4`;

        const response = await fetch(url, {
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
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
            "Unable to load providers."
          );
        }

        const list = Array.isArray(
          result.providers
        )
          ? result.providers
          : [];

        /*
         * ⭐ Client-side sort — HIGHEST RATING FIRST.
         */
        const sortedByRating = [...list].sort(
          (a, b) => {
            const aRating = Number(
              a?.rating ?? a?.averageRating ?? 0
            );
            const bRating = Number(
              b?.rating ?? b?.averageRating ?? 0
            );

            if (bRating !== aRating) {
              return bRating - aRating;
            }

            const aVerified = a?.verified ? 1 : 0;
            const bVerified = b?.verified ? 1 : 0;

            if (bVerified !== aVerified) {
              return bVerified - aVerified;
            }

            const aReviews = Number(
              a?.reviewCount ??
              a?.totalReviews ??
              0
            );
            const bReviews = Number(
              b?.reviewCount ??
              b?.totalReviews ??
              0
            );

            if (bReviews !== aReviews) {
              return bReviews - aReviews;
            }

            const aCompleted = Number(
              a?.completedBookings ?? 0
            );
            const bCompleted = Number(
              b?.completedBookings ?? 0
            );

            return bCompleted - aCompleted;
          }
        );

        setRecommended(sortedByRating);
        setRecommendedError("");
      } catch (err) {
        console.error(
          "Fetch recommended providers error:",
          err
        );
        setRecommended([]);

        if (!silent) {
          setRecommendedError(
            err instanceof Error
              ? err.message
              : "Unable to load providers."
          );
        }
      } finally {
        if (!silent) setRecommendedLoading(false);
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
     SEARCH + CATEGORY HANDOFF
  ========================================================= */

  const handleSearch = () => {
    const q = searchQuery.trim();

    navigate(
      q
        ? `/customer/browse?q=${encodeURIComponent(q)}`
        : "/customer/browse"
    );
  };

  /* =========================================================
     DERIVED DATA
  ========================================================= */

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

  const recentBookings = useMemo(
    () =>
      [...bookings]
        .sort(
          (a, b) =>
            bookingTimestamp(b) -
            bookingTimestamp(a)
        )
        .slice(0, 5),
    [bookings]
  );

  const firstName =
    user?.name?.split(" ")[0] || "there";

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <DashboardLayout
      role="customer"
      navItems={customerNavItems}
    >
      <DashboardHeader
        title="Dashboard"
        subtitle="Here's what's happening with your bookings"
        action={
          <Button
            variant="outline"
            icon={RefreshCw}
            loading={refreshing}
            onClick={handleRefresh}
            aria-label="Refresh dashboard"
          >
            Refresh
          </Button>
        }
      />

      {/* ==================================================
          WELCOME BANNER
      ================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-900 p-6 text-white shadow-soft sm:p-8"
        aria-label={`Welcome, ${firstName}`}
      >
        {/* Decorative elements */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-brand-300/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/60">
                <Sparkles className="h-3.5 w-3.5" />
                Welcome back
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                {getGreeting()}, {firstName} 👋
              </h2>

              <p className="mt-2 max-w-md text-sm text-white/75 sm:text-base">
                Ready to get things done? Book trusted
                campus talent for your next project — or
                pick up right where you left off.
              </p>
            </div>

            {/* Live-updates pill */}
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 ring-1 ring-white/20 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Live
              {lastUpdated && (
                <span className="font-medium text-white/60">
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
            </span>
          </div>

          {/* Quick actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/customer/browse"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-brand-700 shadow-sm transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700 active:scale-[0.97]"
            >
              <Compass className="h-4 w-4" />
              Browse Services
            </Link>

            <Link
              to="/customer/bookings"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700 active:scale-[0.97]"
            >
              <Calendar className="h-4 w-4" />
              View Bookings
            </Link>
          </div>

          {/* Secondary quick links */}
          <div className="mt-5 flex flex-wrap gap-2 border-t border-white/15 pt-4">
            <Link
              to="/customer/saved"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 ring-1 ring-white/15 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Heart className="h-3.5 w-3.5" />
              Saved
            </Link>

            <Link
              to="/customer/reviews"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 ring-1 ring-white/15 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Star className="h-3.5 w-3.5" />
              My Reviews
            </Link>

            <Link
              to="/customer/profile"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 ring-1 ring-white/15 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <User className="h-3.5 w-3.5" />
              Profile
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ERROR */}
      {error && (
        <div className="mt-6 rounded-2xl border border-danger-100 bg-danger-50 p-4 dark:border-danger-500/20 dark:bg-danger-500/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-danger-700 dark:text-danger-200">
              {error}
            </p>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-danger-200 bg-white px-3 py-2 text-xs font-semibold text-danger-600 transition hover:bg-danger-50 disabled:opacity-60 dark:border-danger-500/20 dark:bg-ink-900 dark:text-danger-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* ==================================================
          SEARCH + CATEGORIES
      ================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.35,
          delay: 0.05,
        }}
        className="card mt-6 p-5 sm:p-6"
        aria-label="Search the marketplace"
      >
        <p className="text-sm font-bold text-slate-900 dark:text-ink-50">
          What do you need today?
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={handleSearch}
            placeholder="Search services or providers…"
            className="flex-1"
          />

          <Button
            icon={Search}
            onClick={handleSearch}
            className="shrink-0"
          >
            Search
          </Button>
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-ink-400">
          Popular categories
        </p>

        <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/customer/browse?category=${encodeURIComponent(category.name)}`}
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card-hover dark:border-ink-700 dark:bg-ink-900 dark:hover:border-ink-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label={`Browse ${category.name} providers`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${category.color} text-white shadow-sm transition-transform duration-300 group-hover:scale-110`}
                aria-hidden="true"
              >
                <category.icon className="h-4 w-4" />
              </span>

              <span className="min-w-0 truncate text-sm font-semibold text-slate-700 dark:text-ink-300">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* ==================================================
          STATS ROW
      ================================================== */}
      <section
        className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4"
        aria-label="Booking statistics"
      >
        {bookingsLoading ? (
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="card p-5">
              <div className="flex justify-end">
                <Skeleton className="h-11 w-11 rounded-xl" />
              </div>
              <Skeleton className="mt-3 h-7 w-16" />
              <Skeleton className="mt-1.5 h-4 w-24" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              label="Upcoming"
              value={String(stats.upcoming)}
              icon={CalendarClock}
              color="brand"
              trend={
                stats.pending > 0
                  ? `${stats.pending} pending`
                  : undefined
              }
            />

            <StatCard
              label="Completed"
              value={String(stats.completed)}
              icon={CheckCircle2}
              color="success"
            />

            <StatCard
              label="Total spent"
              value={formatNaira(stats.totalSpent)}
              icon={Wallet}
              color="sky"
            />

            <StatCard
              label="Saved providers"
              value={String(stats.saved)}
              icon={Heart}
              color="rose"
            />
          </>
        )}
      </section>

      {/* ==================================================
          FEATURED PROVIDERS
      ================================================== */}
      <section className="mt-8" aria-label="Featured providers">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-ink-50">
              Featured providers
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-ink-400">
              Top-rated campus talent, ready to book
            </p>
          </div>

          <Link
            to="/customer/browse"
            className="group inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {recommendedLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="card animate-pulse p-0"
              >
                <div className="h-36 bg-slate-100 dark:bg-ink-800" />

                <div className="space-y-3 p-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-8 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : recommendedError ? (
          <ErrorState
            message={recommendedError}
            onRetry={() => fetchRecommended()}
          />
        ) : recommended.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No providers yet"
            description="Check back soon — verified campus providers are joining every day."
            action={
              <Link to="/customer/browse" className="btn-primary btn-sm">
                <Compass className="h-4 w-4" />
                Browse Services
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {recommended.map((raw, i) => {
              const provider =
                normalizeProvider(raw);
              const id = providerId(provider);

              return (
                <motion.div
                  key={id || `rec-${i}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.05,
                    duration: 0.3,
                  }}
                >
                  <RenderErrorBoundary
                    fallback={
                      <div className="rounded-2xl border border-danger-100 bg-danger-50 p-4 text-xs text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/5 dark:text-danger-200">
                        This provider couldn't be
                        displayed. Try refreshing the
                        dashboard.
                      </div>
                    }
                  >
                    <MarketplaceProviderCard
                      provider={provider}
                      saved={savedProviders.includes(
                        id
                      )}
                      onSave={(providerIdToSave) =>
                        toggleSavedProvider(
                          providerIdToSave
                        )
                      }
                      onBook={(providerIdToBook) =>
                        navigate(
                          `/book/${providerIdToBook}`
                        )
                      }
                    />
                  </RenderErrorBoundary>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* ==================================================
          MY BOOKINGS
      ================================================== */}
      <section className="mt-8" aria-label="My bookings">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-ink-50">
              My bookings
            </h2>

            {!bookingsLoading &&
              stats.totalBookings > 0 && (
                <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
                  {stats.totalBookings}
                </span>
              )}
          </div>

          <Link
            to="/customer/bookings"
            className="group inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {bookingsLoading ? (
          <div className="card p-4">
            <SkeletonRows rows={4} />
          </div>
        ) : recentBookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No bookings yet"
            description="When you book a service, it will show up here with all the details."
            action={
              <Link to="/customer/browse" className="btn-primary btn-sm">
                <Compass className="h-4 w-4" />
                Browse Services
              </Link>
            }
          />
        ) : (
          <>
            {/* Desktop: table */}
            <div className="card hidden overflow-hidden p-0 md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Your five most recent bookings
                </caption>
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 dark:border-ink-800 dark:bg-ink-800/50 dark:text-ink-400">
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
                      Provider
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 font-semibold"
                    >
                      Date &amp; time
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
                      className="px-5 py-3 text-right font-semibold"
                    >
                      <span className="sr-only">
                        Actions
                      </span>
                      Details
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-ink-800">
                  {recentBookings.map((booking) => {
                    const serviceName =
                      booking.serviceName ||
                      booking.service?.title ||
                      "Service";

                    const providerName =
                      booking.providerName ||
                      getProviderName(
                        booking.provider
                      );

                    const providerImage =
                      booking.providerAvatar ||
                      getProviderImage(
                        booking.provider
                      );

                    const price = Number(
                      booking.price ||
                      booking.amount ||
                      0
                    );

                    const when = formatDate(
                      booking.date
                    );

                    return (
                      <tr
                        key={
                          booking._id ||
                          booking.id ||
                          serviceName
                        }
                        className="transition-colors hover:bg-slate-50 dark:hover:bg-ink-800/40"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-900 dark:text-ink-50">
                          {serviceName}
                        </td>

                        <td className="px-5 py-4">
                          <span className="flex items-center gap-2.5 text-slate-600 dark:text-ink-300">
                            <Avatar
                              src={
                                providerImage.includes(
                                  "default-avatar"
                                )
                                  ? undefined
                                  : providerImage
                              }
                              name={providerName}
                              size="xs"
                            />
                            <span className="max-w-[160px] truncate">
                              {providerName}
                            </span>
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-600 dark:text-ink-300">
                          {when || "—"}
                          {booking.time && (
                            <span className="text-slate-400 dark:text-ink-500">
                              {" "}
                              at {booking.time}
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right font-bold tabular-nums text-slate-900 dark:text-ink-50">
                          {formatNaira(price)}
                        </td>

                        <td className="px-5 py-4">
                          <BookingStatusBadge
                            status={booking.status}
                          />
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            to={`/customer/bookings?booking=${booking._id || booking.id || ""}`}
                            className="text-sm font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                            aria-label={`View details for ${serviceName}`}
                          >
                            View details
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile: stacked cards */}
            <div className="space-y-3 md:hidden">
              {recentBookings.map((booking) => {
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

                const when = formatDate(booking.date);

                return (
                  <Link
                    key={
                      booking._id ||
                      booking.id ||
                      serviceName
                    }
                    to={`/customer/bookings?booking=${booking._id || booking.id || ""}`}
                    className="card group flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover dark:hover:border-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    aria-label={`View details for ${serviceName}`}
                  >
                    <Avatar
                      src={
                        providerImage.includes(
                          "default-avatar"
                        )
                          ? undefined
                          : providerImage
                      }
                      name={providerName}
                      size="md"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
                        {serviceName}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-ink-400">
                        {providerName}
                      </p>

                      <p className="mt-1 text-xs text-slate-400 dark:text-ink-500">
                        {when || "Date TBA"}
                        {booking.time && (
                          <> at {booking.time}</>
                        )}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold tabular-nums text-slate-900 dark:text-ink-50">
                        {formatNaira(price)}
                      </p>

                      <div className="mt-1">
                        <BookingStatusBadge
                          status={booking.status}
                        />
                      </div>
                    </div>

                    <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500 dark:text-ink-600 sm:block" />
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>
    </DashboardLayout>
  );
}
