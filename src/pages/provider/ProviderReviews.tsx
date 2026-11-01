import { useMemo, useState } from "react";

import {
  DashboardLayout,
  DashboardHeader,
} from "@/components/DashboardLayout";

import {
  VerifiedBadge,
  StarRating,
} from "@/components/shared";

import {
  Avatar,
  Button,
  EmptyState,
  ErrorState,
  Skeleton,
} from "@/components/ui";

import { providerNavItems } from "@/data/providerNavItems";

import {
  useMyProviderProfile,
  useProviderReviews,
} from "@/hooks/queries";

import { getApiErrorMessage } from "@/lib/api";

import {
  ArrowUpDown,
  CalendarDays,
  ChevronDown,
  Filter,
  Loader2,
  MessageSquare,
  RefreshCw,
  Star,
  Tag,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

interface Customer {
  _id?: string;
  name?: string;
  fullName?: string;
  avatar?: string;
  profileImage?: string;
}

interface Service {
  _id?: string;
  title?: string;
  category?: string;
  image?: string;
  price?: number;
}

interface Review {
  _id?: string;
  booking?: string;
  provider?: string;
  rating?: number;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
  customer?: Customer;
  service?: Service;
  /* Admin moderation flags can arrive under any of these names. */
  isHidden?: boolean;
  hidden?: boolean;
  status?: string;
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
  reviewCount?: number;
}

type RatingFilter = "all" | "5" | "4" | "3" | "2" | "1";
type SortOption = "newest" | "oldest" | "highest" | "lowest";

/* =========================================================
   HELPERS
========================================================= */

const formatDate = (date?: string) => {
  if (!date) return "Unknown date";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date";
  }

  return parsed.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const toTimestamp = (date?: string) => {
  if (!date) return 0;

  const parsed = new Date(date).getTime();

  return Number.isFinite(parsed) ? parsed : 0;
};

const getCustomerName = (customer?: Customer) => {
  return customer?.fullName || customer?.name || "Customer";
};

const getInitial = (name: string) => {
  return name.trim().charAt(0).toUpperCase() || "C";
};

const getCustomerImage = (customer?: Customer) => {
  return customer?.avatar || customer?.profileImage || "";
};

const getReviewRating = (review: Review) => {
  const value = Number(review.rating);

  if (!Number.isFinite(value)) return 0;

  return Math.min(5, Math.max(0, value));
};

const clampRating = (value: number) => {
  if (!Number.isFinite(value)) return 0;

  return Math.min(5, Math.max(0, value));
};

/* Mirrors the admin moderation logic so hidden reviews never surface. */
const isReviewHidden = (review: Review) => {
  if (typeof review.isHidden === "boolean") {
    return review.isHidden;
  }

  if (typeof review.hidden === "boolean") {
    return review.hidden;
  }

  if (typeof review.status === "string") {
    return review.status.toLowerCase() === "hidden";
  }

  return false;
};

/* =========================================================
   SUBCOMPONENTS
========================================================= */

function CustomerAvatar({
  name,
  image,
}: {
  name: string;
  image?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (image && !failed) {
    return (
      <img
        src={image}
        alt={name}
        loading="lazy"
        className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-slate-200 dark:ring-ink-700"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
      {getInitial(name)}
    </div>
  );
}

function RatingSummarySkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-ink-800 dark:bg-ink-900 sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-full" />

            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>

          <div className="flex items-end gap-4">
            <Skeleton className="h-14 w-24 rounded-xl" />

            <div className="space-y-2 pb-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>

          <Skeleton className="h-3 w-full max-w-sm" />
        </div>

        <Skeleton className="h-52 w-full rounded-2xl" />
      </div>
    </div>
  );
}

function ReviewCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-ink-800 dark:bg-ink-900 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Skeleton className="h-11 w-11 shrink-0 rounded-full" />

          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>

        <Skeleton className="h-7 w-20 rounded-full" />
      </div>

      <Skeleton className="mt-5 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-5/6" />
      <Skeleton className="mt-5 h-7 w-40 rounded-full" />
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export function ProviderReviews() {
  const [ratingFilter, setRatingFilter] =
    useState<RatingFilter>("all");
  const [sortBy, setSortBy] =
    useState<SortOption>("newest");

  /* =========================
     DATA (React Query)
  ========================= */

  const {
    data: profileData,
    isLoading: profileLoading,
    isError: profileIsError,
    error: profileError,
    refetch: refetchProfile,
    isFetching: profileFetching,
  } = useMyProviderProfile();

  const provider = useMemo<Provider | null>(() => {
    const rawProvider = profileData?.provider as unknown as
      | Provider
      | undefined;

    return rawProvider ?? null;
  }, [profileData]);

  const providerId = String(
    provider?._id || provider?.id || ""
  );

  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    isError: reviewsIsError,
    error: reviewsError,
    refetch: refetchReviews,
    isFetching: reviewsFetching,
  } = useProviderReviews(providerId, {
    enabled: Boolean(providerId),
  });

  /* =========================
     DERIVED DATA
  ========================= */

  const reviews = useMemo<Review[]>(() => {
    const fromReviews = Array.isArray(reviewsData?.reviews)
      ? reviewsData.reviews
      : [];
    const fromProfile = Array.isArray(profileData?.reviews)
      ? profileData.reviews
      : [];

    const source: unknown[] =
      fromReviews.length > 0 ? fromReviews : fromProfile;

    return source
      .map((review) => review as unknown as Review)
      .filter(
        (review) =>
          Boolean(review) && !isReviewHidden(review)
      );
  }, [reviewsData, profileData]);

  const averageRating = useMemo(() => {
    if (reviews.length > 0) {
      const total = reviews.reduce(
        (sum, review) =>
          sum + getReviewRating(review),
        0
      );

      return total / reviews.length;
    }

    const fallback = Number(
      provider?.rating ??
        profileData?.averageRating ??
        0
    );

    return clampRating(fallback);
  }, [reviews, provider, profileData]);

  const fallbackReviewCount = Number(
    provider?.reviewCount ?? profileData?.count ?? 0
  );

  const totalReviews =
    reviews.length > 0
      ? reviews.length
      : Number.isFinite(fallbackReviewCount) &&
        fallbackReviewCount > 0
      ? Math.round(fallbackReviewCount)
      : 0;

  const ratingDistribution = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0];

    reviews.forEach((review) => {
      const rating = Math.round(
        getReviewRating(review)
      );

      if (rating >= 1 && rating <= 5) {
        buckets[rating - 1] += 1;
      }
    });

    return [5, 4, 3, 2, 1].map((star) => {
      const count = buckets[star - 1];

      return {
        star,
        count,
        percent:
          reviews.length > 0
            ? Math.round(
                (count / reviews.length) * 100
              )
            : 0,
      };
    });
  }, [reviews]);

  const visibleReviews = useMemo(() => {
    const filtered = reviews.filter((review) => {
      if (ratingFilter === "all") return true;

      return (
        String(Math.round(getReviewRating(review))) ===
        ratingFilter
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "highest") {
        return (
          getReviewRating(b) - getReviewRating(a)
        );
      }

      if (sortBy === "lowest") {
        return (
          getReviewRating(a) - getReviewRating(b)
        );
      }

      const aTime = toTimestamp(a.createdAt);
      const bTime = toTimestamp(b.createdAt);

      return sortBy === "oldest"
        ? aTime - bTime
        : bTime - aTime;
    });
  }, [reviews, ratingFilter, sortBy]);

  const providerName =
    provider?.fullName || provider?.name || "Provider";

  const providerAvatar =
    provider?.avatar || provider?.profileImage || "";

  const isVerified =
    provider?.verified === true ||
    provider?.status === "active";

  const formattedRating =
    averageRating > 0
      ? averageRating.toFixed(1)
      : "0.0";

  const summaryLoading =
    profileLoading || reviewsLoading;

  const profileUnavailable =
    !profileLoading && !providerId;

  const refreshing =
    profileFetching || reviewsFetching;

  const profileErrorMessage = profileIsError
    ? getApiErrorMessage(profileError)
    : "";

  const reviewsErrorMessage = reviewsIsError
    ? getApiErrorMessage(reviewsError)
    : "";

  const hasActiveFilters =
    ratingFilter !== "all" || sortBy !== "newest";

  /* =========================
     ACTIONS
  ========================= */

  const handleRefresh = async () => {
    const tasks: Array<Promise<unknown>> = [
      refetchProfile(),
    ];

    if (providerId) {
      tasks.push(refetchReviews());
    }

    await Promise.allSettled(tasks);
  };

  const clearFilters = () => {
    setRatingFilter("all");
    setSortBy("newest");
  };

  return (
    <DashboardLayout
      role="provider"
      navItems={providerNavItems}
    >
      <DashboardHeader
        title="Reviews"
        subtitle="What customers are saying about you"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="self-start sm:self-auto"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}

            <span>{refreshing ? "Refreshing" : "Refresh"}</span>
          </Button>
        }
      />

      <div className="space-y-6">
        {/* =========================
            PROFILE ERROR
        ========================== */}

        {profileUnavailable && (
          <ErrorState
            message={
              profileErrorMessage ||
              "We couldn't load your provider profile. Please refresh or sign in again."
            }
            onRetry={handleRefresh}
          />
        )}

        {profileIsError &&
          !profileUnavailable && (
            <div className="flex flex-col gap-3 rounded-2xl border border-warning-500/20 bg-warning-50 p-4 dark:border-warning-500/20 dark:bg-warning-600/10 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-warning-700 dark:text-amber-300">
                  Some profile details may be out of date
                </p>

                <p className="mt-1 text-sm text-warning-700/80 dark:text-amber-200/80">
                  {profileErrorMessage}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="self-start sm:self-auto"
              >
                Try again
              </Button>
            </div>
          )}

        {/* =========================
            RATING SUMMARY HERO
        ========================== */}

        {!profileUnavailable &&
          (summaryLoading ? (
            <RatingSummarySkeleton />
          ) : (
            <section
              aria-label="Rating summary"
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-900 p-5 text-white shadow-soft sm:p-8"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-brand-400/20 blur-3xl"
              />

              <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={providerAvatar}
                      name={providerName}
                      size="lg"
                      className="ring-2 ring-white/30"
                    />

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-white">
                          {providerName}
                        </p>

                        {isVerified && <VerifiedBadge />}
                      </div>

                      <p className="mt-1 text-xs text-white/70">
                        Your reputation on Servicely
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-end gap-4">
                    <p className="text-5xl font-black leading-none tracking-tight sm:text-6xl">
                      {formattedRating}
                    </p>

                    <div className="pb-1">
                      <StarRating
                        rating={averageRating}
                        size={20}
                      />

                      <p className="mt-2 text-sm text-white/80">
                        {totalReviews}{" "}
                        {totalReviews === 1
                          ? "review"
                          : "reviews"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 max-w-lg text-sm leading-6 text-white/80">
                    Keep delivering great service to
                    maintain your rating and build trust
                    with more customers.
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 ring-1 ring-white/15">
                      <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />

                      {averageRating >= 4.5
                        ? "Excellent reputation"
                        : averageRating >= 3.5
                        ? "Strong reputation"
                        : averageRating > 0
                        ? "Growing reputation"
                        : "New on Servicely"}
                    </span>

                    {reviews.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 ring-1 ring-white/15">
                        <MessageSquare className="h-3.5 w-3.5" />

                        {reviews.length} verified
                        feedback
                        {reviews.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Distribution */}
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                      Rating breakdown
                    </p>

                    <span className="text-xs text-white/60">
                      {totalReviews} total
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {ratingDistribution.map(
                      ({ star, count, percent }) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            setRatingFilter(
                              String(star) as RatingFilter
                            )
                          }
                          aria-label={`Filter ${star}-star reviews (${count})`}
                          aria-pressed={
                            ratingFilter === String(star)
                          }
                          className={`group flex w-full items-center gap-3 rounded-lg px-1.5 py-1 text-left transition hover:bg-white/10 focus-visible:bg-white/10 ${
                            ratingFilter === String(star)
                              ? "bg-white/10"
                              : ""
                          }`}
                        >
                          <span className="flex w-8 shrink-0 items-center gap-1 text-xs font-semibold text-white/80">
                            <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                            {star}
                          </span>

                          <span
                            role="progressbar"
                            aria-valuenow={percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${star} star reviews`}
                            className="h-2 flex-1 overflow-hidden rounded-full bg-white/15"
                          >
                            <span
                              className="block h-full rounded-full bg-amber-300 transition-all duration-500 group-hover:bg-amber-200"
                              style={{
                                width: `${percent}%`,
                              }}
                            />
                          </span>

                          <span className="w-8 shrink-0 text-right text-xs font-medium tabular-nums text-white/70">
                            {count}
                          </span>
                        </button>
                      )
                    )}
                  </div>

                  {reviews.length === 0 &&
                    totalReviews > 0 && (
                      <p className="mt-3 text-xs leading-5 text-white/60">
                        Detailed review history is not
                        available yet.
                      </p>
                    )}
                </div>
              </div>
            </section>
          ))}

        {/* =========================
            REVIEWS
        ========================== */}

        <section aria-labelledby="customer-reviews-heading">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="customer-reviews-heading"
                className="text-lg font-bold text-slate-900 dark:text-ink-50"
              >
                Customer Reviews
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-ink-400">
                Feedback from customers who have used
                your services.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {reviews.length > 0 && (
                <>
                  <div className="relative">
                    <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <select
                      value={ratingFilter}
                      onChange={(event) =>
                        setRatingFilter(
                          event.target.value as RatingFilter
                        )
                      }
                      aria-label="Filter reviews by rating"
                      className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 sm:w-auto"
                    >
                      <option value="all">
                        All ratings
                      </option>
                      <option value="5">5 stars</option>
                      <option value="4">4 stars</option>
                      <option value="3">3 stars</option>
                      <option value="2">2 stars</option>
                      <option value="1">1 star</option>
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>

                  <div className="relative">
                    <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <select
                      value={sortBy}
                      onChange={(event) =>
                        setSortBy(
                          event.target.value as SortOption
                        )
                      }
                      aria-label="Sort reviews"
                      className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 sm:w-auto"
                    >
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="highest">
                        Highest rated
                      </option>
                      <option value="lowest">
                        Lowest rated
                      </option>
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </>
              )}

              <span className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-ink-800 dark:text-ink-300 sm:inline-flex">
                {visibleReviews.length}{" "}
                {visibleReviews.length === 1
                  ? "Review"
                  : "Reviews"}
              </span>
            </div>
          </div>

          {profileUnavailable ? (
            <EmptyState
              icon={MessageSquare}
              title="Reviews unavailable"
              description="We couldn't connect reviews to your provider profile. Please refresh or sign in again."
            />
          ) : reviewsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map(
                (_, index) => (
                  <ReviewCardSkeleton key={index} />
                )
              )}
            </div>
          ) : reviewsIsError ? (
            <ErrorState
              message={
                reviewsErrorMessage ||
                "Unable to load your reviews."
              }
              onRetry={handleRefresh}
            />
          ) : totalReviews === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No reviews yet"
              description="Reviews from customers will appear here after they complete a booking and leave feedback for your service."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className="h-4 w-4" />
                  Check again
                </Button>
              }
            />
          ) : reviews.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Review details unavailable"
              description={`Your profile shows ${totalReviews} review${
                totalReviews === 1 ? "" : "s"
              }, but the individual reviews couldn't be loaded right now.`}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </Button>
              }
            />
          ) : visibleReviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center dark:border-ink-700 dark:bg-ink-900">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-lavender text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                <Filter className="h-5 w-5" />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-ink-50">
                No matching reviews
              </h3>

              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-ink-400">
                Try a different rating filter or clear
                the filters to see all customer
                feedback.
              </p>

              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="mt-4"
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleReviews.map((review, index) => {
                const customerName =
                  getCustomerName(review.customer);

                const customerImage =
                  getCustomerImage(review.customer);

                const reviewRating =
                  getReviewRating(review);

                const serviceTitle =
                  review.service?.title || "";

                const serviceCategory =
                  review.service?.category || "";

                return (
                  <article
                    key={
                      review._id ||
                      `${customerName}-${
                        review.createdAt || index
                      }`
                    }
                    className="card-hover rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card transition focus-within:ring-2 focus-within:ring-brand-500/40 dark:border-ink-800 dark:bg-ink-900 sm:p-6"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <CustomerAvatar
                          name={customerName}
                          image={customerImage}
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
                            {customerName}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 dark:text-ink-500">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5" />

                              {formatDate(
                                review.createdAt
                              )}
                            </span>

                            {serviceTitle && (
                              <span className="inline-flex items-center gap-1">
                                <Tag className="h-3.5 w-3.5" />

                                <span className="max-w-[14rem] truncate">
                                  {serviceTitle}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2.5 py-1 text-xs font-bold text-warning-700 dark:bg-warning-600/15 dark:text-amber-300">
                          <Star className="h-3.5 w-3.5 fill-warning-500 text-warning-500" />

                          {reviewRating.toFixed(1)}
                        </span>

                        <StarRating
                          rating={reviewRating}
                          size={14}
                        />
                      </div>
                    </div>

                    <div className="mt-4 border-l-2 border-brand-100 pl-4 dark:border-brand-900/60">
                      {review.comment ? (
                        <p className="text-sm leading-6 text-slate-600 dark:text-ink-300">
                          {review.comment}
                        </p>
                      ) : (
                        <p className="text-sm italic text-slate-400 dark:text-ink-500">
                          No written comment was provided.
                        </p>
                      )}
                    </div>

                    {(serviceTitle ||
                      serviceCategory) && (
                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-ink-800">
                        {serviceTitle && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                            <Tag className="h-3 w-3" />

                            {serviceTitle}
                          </span>
                        )}

                        {serviceCategory && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-ink-800 dark:text-ink-300">
                            {serviceCategory}
                          </span>
                        )}

                        {hasActiveFilters && (
                          <span className="ml-auto text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-ink-500">
                            {reviewRating.toFixed(0)}-star
                            review
                          </span>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
