import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertCircle,
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
  SectionHeading,
  Skeleton,
  SkeletonRows,
  providerId,
  type ProviderLike,
} from "@/components/ui";
import { useAuth, useBookings } from "@/context/AppContext";
import { customerNavItems } from "@/data/customerNavItems";
import { categories } from "@/data/mockData";
import {
  useCustomerBookings,
  useRecommendedProviders,
} from "@/hooks/queries";
import { getApiErrorMessage } from "@/lib/api";

/* =========================================================
   HELPERS
========================================================= */

const formatNaira = (amount: number) => {
  return `₦${Number(amount || 0).toLocaleString("en-NG")}`;
};

const formatDate = (date?: string) => {
  if (!date) return "";

  try {
    return new Date(date).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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
  return provider?.fullName || provider?.name || "Service Provider";
};

const getProviderImage = (provider: any) => {
  return (
    provider?.avatar ||
    provider?.profileImage ||
    "/images/default-avatar.png"
  );
};

const getAvatarSrc = (image?: string) => {
  const value = String(image || "");

  if (!value || value.includes("default-avatar")) {
    return undefined;
  }

  return value;
};

const bookingTimestamp = (booking: Booking) => {
  const base = booking.date || booking.createdAt || "";

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
    Number(raw?.rating ?? raw?.averageRating ?? 0) || 0;

  const reviewCount =
    Number(raw?.reviewCount ?? raw?.totalReviews ?? 0) || 0;

  const completedBookings =
    Number(raw?.completedBookings ?? raw?.jobs ?? 0) || 0;

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
    raw?.description || raw?.bio || raw?.about || ""
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
    category: String(raw?.category || categoryList[0] || "") || undefined,
    location: String(raw?.location || raw?.city || "") || undefined,
    about,
    rating,
    reviewCount,
    completedBookings,
    verified: Boolean(raw?.verified),
    hourlyRate: Number(raw?.hourlyRate ?? 0) || undefined,
    startingPrice: startingPrice > 0 ? startingPrice : undefined,
    price: startingPrice > 0 ? startingPrice : undefined,
    portfolio,
  };
};

/**
 * ⭐ Client-side sort — HIGHEST RATING FIRST.
 * Kept from the original dashboard fetch so the recommended grid
 * always leads with the most trusted providers.
 */
const sortProvidersByRating = (a: ProviderLike, b: ProviderLike) => {
  const aRating = Number(a?.rating ?? a?.averageRating ?? 0);
  const bRating = Number(b?.rating ?? b?.averageRating ?? 0);

  if (bRating !== aRating) {
    return bRating - aRating;
  }

  const aVerified = a?.verified ? 1 : 0;
  const bVerified = b?.verified ? 1 : 0;

  if (bVerified !== aVerified) {
    return bVerified - aVerified;
  }

  const aReviews = Number(a?.reviewCount ?? a?.totalReviews ?? 0);
  const bReviews = Number(b?.reviewCount ?? b?.totalReviews ?? 0);

  if (bReviews !== aReviews) {
    return bReviews - aReviews;
  }

  const aCompleted = Number(a?.completedBookings ?? 0);
  const bCompleted = Number(b?.completedBookings ?? 0);

  return bCompleted - aCompleted;
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
   NEXT BOOKING CARD
========================================================= */

function NextBookingCard({
  booking,
  isLoading,
  error,
  onRetry,
}: {
  booking?: Booking;
  isLoading: boolean;
  error?: string;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <div className="card p-5" aria-hidden="true">
        <div className="flex items-start gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />

          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>

        <Skeleton className="mt-5 h-10 w-full rounded-xl sm:w-36" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="card flex h-full flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
        role="alert"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-200">
            <AlertCircle className="h-5 w-5" />
          </span>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-ink-50">
              Couldn't load your next booking
            </p>
            <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-ink-400">
              {error}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={onRetry}
          className="w-full shrink-0 sm:w-auto"
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="card flex h-full flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
            <CalendarClock className="h-5 w-5" />
          </span>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-ink-50">
              No upcoming bookings
            </p>
            <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-ink-400">
              Book a trusted campus provider and your next appointment
              will show up right here.
            </p>
          </div>
        </div>

        <Link
          to="/customer/browse"
          className="btn-primary btn-sm min-h-11 w-full shrink-0 justify-center sm:w-auto"
        >
          <Compass className="h-4 w-4" />
          Browse services
        </Link>
      </div>
    );
  }

  const serviceName =
    booking.serviceName || booking.service?.title || "Service";

  const providerName =
    booking.providerName || getProviderName(booking.provider);

  const providerImage =
    booking.providerAvatar || getProviderImage(booking.provider);

  const price = Number(booking.price || booking.amount || 0);
  const when = formatDate(booking.date);
  const bookingId = booking._id || booking.id || "";

  return (
    <article className="card h-full overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-brand-500 via-brand-400 to-indigo-400" />

      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Avatar
            src={getAvatarSrc(providerImage)}
            name={providerName}
            size="lg"
          />

          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
              Next booking
            </p>

            <h3 className="mt-1 truncate text-lg font-bold tracking-tight text-slate-900 dark:text-ink-50">
              {serviceName}
            </h3>

            <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-ink-400">
              {providerName}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-ink-400">
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock
                  className="h-3.5 w-3.5 shrink-0 text-slate-400"
                  aria-hidden="true"
                />
                {when || "Date TBA"}
                {booking.time ? ` · ${booking.time}` : ""}
              </span>

              <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums text-slate-700 dark:text-ink-300">
                <Wallet
                  className="h-3.5 w-3.5 shrink-0 text-slate-400"
                  aria-hidden="true"
                />
                {formatNaira(price)}
              </span>

              <BookingStatusBadge status={booking.status} />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:w-auto">
          <Link
            to={`/customer/bookings?booking=${bookingId}`}
            className="btn-primary btn-sm min-h-11 justify-center"
          >
            View booking
          </Link>

          <Link
            to="/customer/bookings"
            className="btn-outline btn-sm min-h-11 justify-center"
          >
            All bookings
          </Link>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   SAVED PROVIDERS SHORTCUT
========================================================= */

function SavedProvidersShortcut({ count }: { count: number }) {
  return (
    <Link
      to="/customer/saved"
      className="card-hover group flex h-full min-h-[168px] flex-col justify-between p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      aria-label={`View ${count} saved provider${count === 1 ? "" : "s"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
          <Heart className="h-5 w-5" />
        </span>

        <ArrowRight
          className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500 dark:text-ink-600"
          aria-hidden="true"
        />
      </div>

      <div className="mt-4">
        <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-ink-50">
          {count}
        </p>

        <p className="text-sm font-medium text-slate-600 dark:text-ink-300">
          Saved provider{count === 1 ? "" : "s"}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-ink-400">
          Keep your favourite campus talent one tap away.
        </p>
      </div>
    </Link>
  );
}

/* =========================================================
   STAT SKELETONS
========================================================= */

function StatSkeletons() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="card p-4 sm:p-5"
          aria-hidden="true"
        >
          <div className="flex justify-end">
            <Skeleton className="h-11 w-11 rounded-xl" />
          </div>
          <Skeleton className="mt-3 h-7 w-16" />
          <Skeleton className="mt-1.5 h-4 w-24" />
        </div>
      ))}
    </>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export function CustomersDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { savedProviders, toggleSavedProvider } = useBookings();

  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const bookingsQuery = useCustomerBookings({
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  const recommendedQuery = useRecommendedProviders(4, {
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  const bookings = useMemo<Booking[]>(
    () => (bookingsQuery.data ?? []) as unknown as Booking[],
    [bookingsQuery.data]
  );

  const recommended = useMemo<ProviderLike[]>(() => {
    const list = recommendedQuery.data ?? [];
    return [...list].sort(sortProvidersByRating);
  }, [recommendedQuery.data]);

  /*
   * Keep skeletons visible while a first load or a retry is in flight
   * and we still have nothing to show.
   */
  const isBookingsLoading =
    bookingsQuery.isLoading ||
    (bookingsQuery.isFetching &&
      bookingsQuery.data === undefined);

  const isRecommendedLoading =
    recommendedQuery.isLoading ||
    (recommendedQuery.isFetching &&
      recommendedQuery.data === undefined);

  /*
   * Only surface a full error state when we have nothing cached.
   * A failed background refresh should never hide good data.
   */
  const bookingsError =
    bookingsQuery.isError && bookingsQuery.data === undefined
      ? getApiErrorMessage(bookingsQuery.error)
      : "";

  const recommendedError =
    recommendedQuery.isError &&
    recommendedQuery.data === undefined
      ? getApiErrorMessage(recommendedQuery.error)
      : "";

  const isSyncing =
    bookingsQuery.isFetching || recommendedQuery.isFetching;

  const lastUpdated = useMemo(() => {
    const newest = Math.max(
      bookingsQuery.dataUpdatedAt || 0,
      recommendedQuery.dataUpdatedAt || 0
    );

    return newest > 0 ? new Date(newest) : null;
  }, [
    bookingsQuery.dataUpdatedAt,
    recommendedQuery.dataUpdatedAt,
  ]);

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        bookingsQuery.refetch(),
        recommendedQuery.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
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
      (sum, b) => sum + Number(b.price || b.amount || 0),
      0
    );

    return {
      upcoming: bookings.filter((b) =>
        ["accepted", "paid", "in_progress"].includes(b.status)
      ).length,
      pending: bookings.filter((b) => b.status === "pending").length,
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
            bookingTimestamp(b) - bookingTimestamp(a)
        )
        .slice(0, 5),
    [bookings]
  );

  const nextBooking = useMemo(() => {
    return [...bookings]
      .filter((b) =>
        ["accepted", "paid", "in_progress"].includes(b.status)
      )
      .sort(
        (a, b) =>
          bookingTimestamp(a) - bookingTimestamp(b)
      )[0];
  }, [bookings]);

  const firstName = user?.name?.split(" ")[0] || "there";

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
            className="min-h-11 w-full sm:w-auto"
          >
            Refresh
          </Button>
        }
      />

      {/* ==================================================
          GREETING HEADER
      ================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-900 p-5 text-white shadow-soft sm:p-8"
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

        <div className="relative flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/60">
                <Sparkles className="h-3.5 w-3.5" />
                Welcome back
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                {getGreeting()}, {firstName} 👋
              </h2>

              <p className="mt-2 max-w-md text-sm text-white/75 sm:text-base">
                Ready to get things done? Book trusted campus
                talent for your next project — or pick up right
                where you left off.
              </p>
            </div>

            {/* Live-updates pill */}
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 ring-1 ring-white/20 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>

              Live
              {(isSyncing || lastUpdated) && (
                <span className="inline-flex items-center gap-1 font-medium text-white/60">
                  {isSyncing ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Syncing…
                    </>
                  ) : (
                    <>
                      · Updated{" "}
                      {lastUpdated?.toLocaleTimeString("en-NG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </>
                  )}
                </span>
              )}
            </span>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            {/* Primary quick actions */}
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
              <Link
                to="/customer/browse"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-brand-700 shadow-sm transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700 active:scale-[0.97]"
              >
                <Compass className="h-4 w-4" />
                Browse Services
              </Link>

              <Link
                to="/customer/bookings"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700 active:scale-[0.97]"
              >
                <Calendar className="h-4 w-4" />
                View Bookings
              </Link>
            </div>

            {/* Account chip */}
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-2.5 ring-1 ring-white/15 backdrop-blur">
              <Avatar
                src={user?.avatar}
                name={user?.name || firstName}
                size="md"
                className="border-2 border-white/40"
              />

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {user?.name || "Customer"}
                </p>
                <p className="text-xs text-white/60">
                  Customer account
                </p>
              </div>
            </div>
          </div>

          {/* Secondary quick links */}
          <div className="flex flex-wrap gap-2 border-t border-white/15 pt-4">
            <Link
              to="/customer/saved"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 ring-1 ring-white/15 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Heart className="h-3.5 w-3.5" />
              Saved
            </Link>

            <Link
              to="/customer/reviews"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 ring-1 ring-white/15 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Star className="h-3.5 w-3.5" />
              My Reviews
            </Link>

            <Link
              to="/customer/profile"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 ring-1 ring-white/15 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <User className="h-3.5 w-3.5" />
              Profile
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ==================================================
          SEARCH + CATEGORIES
      ================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
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
            className="min-h-11 w-full shrink-0 sm:w-auto"
          >
            Search
          </Button>
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-ink-400">
          Popular categories
        </p>

        <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/customer/browse?category=${encodeURIComponent(category.name)}`}
              className="group flex min-h-[52px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-ink-700 dark:bg-ink-900 dark:hover:border-ink-600"
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
        className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
        aria-label="Booking statistics"
        aria-busy={isBookingsLoading}
      >
        {isBookingsLoading ? (
          <StatSkeletons />
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
          NEXT BOOKING + SAVED SHORTCUT
      ================================================== */}
      <section
        className="mt-6 grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3"
        aria-label="Next booking and saved providers"
      >
        <div className="lg:col-span-2">
          <NextBookingCard
            booking={nextBooking}
            isLoading={isBookingsLoading}
            error={bookingsError}
            onRetry={() => {
              bookingsQuery.refetch();
            }}
          />
        </div>

        <SavedProvidersShortcut count={stats.saved} />
      </section>

      {/* ==================================================
          RECOMMENDED PROVIDERS
      ================================================== */}
      <section className="mt-8" aria-label="Recommended providers">
        <SectionHeading
          title="Recommended for you"
          subtitle="Top-rated campus talent, ready to book"
          action={
            <Link
              to="/customer/browse"
              className="group inline-flex min-h-11 items-center gap-1 self-start rounded text-sm font-semibold text-brand-600 transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-400 dark:hover:text-brand-300"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          }
        />

        {isRecommendedLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="card overflow-hidden"
                aria-hidden="true"
              >
                <div className="h-36 bg-slate-100 dark:bg-ink-800">
                  <Skeleton className="h-full w-full rounded-none" />
                </div>

                <div className="space-y-3 p-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="mt-4 h-9 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : recommendedError ? (
          <ErrorState
            message={recommendedError}
            onRetry={() => {
              recommendedQuery.refetch();
            }}
          />
        ) : recommended.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No providers yet"
            description="Check back soon — verified campus providers are joining every day."
            action={
              <Link
                to="/customer/browse"
                className="btn-primary btn-sm min-h-11 justify-center"
              >
                <Compass className="h-4 w-4" />
                Browse Services
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {recommended.map((raw, i) => {
              const provider = normalizeProvider(raw);
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
                  className="h-full"
                >
                  <RenderErrorBoundary
                    fallback={
                      <div className="rounded-2xl border border-danger-100 bg-danger-50 p-4 text-xs text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/5 dark:text-danger-200">
                        This provider couldn't be displayed. Try
                        refreshing the dashboard.
                      </div>
                    }
                  >
                    <MarketplaceProviderCard
                      provider={provider}
                      saved={savedProviders.includes(id)}
                      onSave={(providerIdToSave) =>
                        toggleSavedProvider(providerIdToSave)
                      }
                      onBook={(providerIdToBook) =>
                        navigate(`/book/${providerIdToBook}`)
                      }
                      className="h-full"
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
        <SectionHeading
          title="My bookings"
          subtitle="Your five most recent bookings"
          action={
            <div className="flex flex-wrap items-center gap-3">
              {!isBookingsLoading &&
                stats.totalBookings > 0 && (
                  <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
                    {stats.totalBookings}
                  </span>
                )}

              <Link
                to="/customer/bookings"
                className="group inline-flex min-h-11 items-center gap-1 rounded text-sm font-semibold text-brand-600 transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-400 dark:hover:text-brand-300"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          }
        />

        {isBookingsLoading ? (
          <div className="card p-4">
            <SkeletonRows rows={4} />
          </div>
        ) : bookingsError ? (
          <ErrorState
            message={bookingsError}
            onRetry={() => {
              bookingsQuery.refetch();
            }}
          />
        ) : recentBookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No bookings yet"
            description="When you book a service, it will show up here with all the details."
            action={
              <Link
                to="/customer/browse"
                className="btn-primary btn-sm min-h-11 justify-center"
              >
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
                      <span className="sr-only">Actions</span>
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
                      getProviderName(booking.provider);

                    const providerImage =
                      booking.providerAvatar ||
                      getProviderImage(booking.provider);

                    const price = Number(
                      booking.price || booking.amount || 0
                    );

                    const when = formatDate(booking.date);

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
                              src={getAvatarSrc(providerImage)}
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
                            className="inline-flex min-h-9 items-center justify-end rounded text-sm font-semibold text-brand-600 transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-400 dark:hover:text-brand-300"
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
                    className="card group flex min-h-[88px] items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:border-ink-700"
                    aria-label={`View details for ${serviceName}`}
                  >
                    <Avatar
                      src={getAvatarSrc(providerImage)}
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
