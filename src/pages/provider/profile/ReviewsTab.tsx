import { useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

import {
  Briefcase,
  CheckCircle2,
  ChevronDown,
  MessageCircle,
  RefreshCw,
  Star,
} from "lucide-react";

import { ErrorState } from "@/components/ui";

/* =========================================================
   TYPES
========================================================= */

interface ReviewCustomer {
  _id?: string;
  fullName?: string;
  name?: string;
  avatar?: string;
  profileImage?: string;
}

interface ReviewService {
  _id?: string;
  title?: string;
  category?: string;
  image?: string;
  price?: number;
}

interface Review {
  _id: string;
  rating: number;
  comment?: string;
  customer?: ReviewCustomer;
  service?: ReviewService;
  createdAt?: string;
  updatedAt?: string;
}

interface ReviewsTabProps {
  reviews: Review[];
  providerName: string;
  loading: boolean;
  error: string;
  onRetry: () => void;
}

interface StarRowProps {
  value: number;
  size?: "sm" | "md";
}

interface ReviewAvatarProps {
  name: string;
  image?: string;
}

type RatingFilter = "all" | "5" | "4" | "3" | "2" | "1";
type SortOption = "newest" | "highest" | "lowest";

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE = 6;

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "highest", label: "Highest rated" },
  { value: "lowest", label: "Lowest rated" },
];

/* =========================================================
   HELPERS
========================================================= */

const clampRating = (value: number) => {
  if (!Number.isFinite(value)) return 0;

  return Math.min(5, Math.max(0, value));
};

const getRating = (review: Review) => {
  return clampRating(Number(review.rating));
};

const getStarBucket = (review: Review) => {
  const rating = getRating(review);

  if (rating <= 0) return 0;

  return Math.min(5, Math.max(1, Math.round(rating)));
};

const getTimestamp = (date?: string) => {
  if (!date) return 0;

  const timestamp = new Date(date).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
};

const formatDate = (date?: string) => {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Date unavailable";
  }

  return parsed.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatPrice = (price?: number) => {
  return `₦${Number(price || 0).toLocaleString("en-NG")}`;
};

const getCustomerName = (customer?: ReviewCustomer) => {
  return customer?.fullName || customer?.name || "Verified customer";
};

const getCustomerImage = (customer?: ReviewCustomer) => {
  return customer?.avatar || customer?.profileImage || "";
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "C";

  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";

  return `${first}${last}`.toUpperCase();
};

/* =========================================================
   SUBCOMPONENTS
========================================================= */

function StarRow({ value, size = "sm" }: StarRowProps) {
  const rounded = Math.round(clampRating(value));
  const starClass = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";

  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`${clampRating(value).toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden="true"
          className={`${starClass} ${
            star <= rounded
              ? "fill-warning-500 text-warning-500"
              : "text-ink-200 dark:text-ink-700"
          }`}
        />
      ))}
    </div>
  );
}

function ReviewAvatar({ name, image }: ReviewAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  if (image && !imageFailed) {
    return (
      <img
        src={image}
        alt={`${name}'s avatar`}
        loading="lazy"
        onError={() => setImageFailed(true)}
        className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-ink-100 transition duration-300 group-hover:ring-primary-200 dark:ring-ink-800 dark:group-hover:ring-primary-900"
      />
    );
  }

  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-primary-100 text-sm font-extrabold text-brand-700 ring-2 ring-ink-100 transition duration-300 group-hover:ring-primary-200 dark:from-brand-950 dark:to-primary-950 dark:text-brand-200 dark:ring-ink-800 dark:group-hover:ring-primary-900"
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div
      className="space-y-5"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading customer reviews…</span>

      <div className="animate-pulse rounded-3xl border border-ink-100 bg-white p-6 shadow-card dark:border-ink-800 dark:bg-ink-900">
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-ink-100 dark:bg-ink-800" />
            <div className="space-y-3">
              <div className="h-9 w-28 rounded-lg bg-ink-100 dark:bg-ink-800" />
              <div className="h-4 w-40 rounded bg-ink-100 dark:bg-ink-800" />
            </div>
          </div>

          <div className="flex-1 space-y-3">
            {[5, 4, 3, 2, 1].map((row) => (
              <div key={row} className="flex items-center gap-3">
                <div className="h-3 w-8 rounded bg-ink-100 dark:bg-ink-800" />
                <div className="h-2 flex-1 rounded-full bg-ink-100 dark:bg-ink-800" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="h-12 animate-pulse rounded-2xl bg-ink-100 dark:bg-ink-800" />

      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-2xl border border-ink-100 bg-white p-5 shadow-card dark:border-ink-800 dark:bg-ink-900"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-ink-100 dark:bg-ink-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 rounded bg-ink-100 dark:bg-ink-800" />
              <div className="h-3 w-24 rounded bg-ink-100 dark:bg-ink-800" />
            </div>
            <div className="h-7 w-14 rounded-full bg-ink-100 dark:bg-ink-800" />
          </div>

          <div className="mt-4 h-4 w-24 rounded bg-ink-100 dark:bg-ink-800" />
          <div className="mt-4 h-16 rounded-xl bg-ink-100 dark:bg-ink-800" />
        </div>
      ))}
    </div>
  );
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  const customerName = getCustomerName(review.customer);
  const rating = getRating(review);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
      className="group relative overflow-hidden rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-card-hover dark:border-ink-800 dark:bg-ink-900 dark:hover:border-primary-900"
    >
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-primary-400 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <ReviewAvatar
            name={customerName}
            image={getCustomerImage(review.customer)}
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink-900 dark:text-white">
              {customerName}
            </p>
            <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
              {formatDate(review.createdAt)}
            </p>
          </div>
        </div>

        <span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-warning-50 px-2.5 py-1.5 text-xs font-extrabold text-warning-700 ring-1 ring-warning-200/70 dark:bg-warning-500/10 dark:text-warning-200 dark:ring-warning-500/20"
          aria-label={`Rated ${rating.toFixed(1)} out of 5`}
        >
          <Star
            className="h-3.5 w-3.5 fill-warning-500 text-warning-500"
            aria-hidden="true"
          />
          {rating.toFixed(1)}
        </span>
      </div>

      <div className="mt-4">
        <StarRow value={rating} size="md" />
      </div>

      {review.comment ? (
        <div className="mt-4 rounded-xl border border-ink-100/80 bg-ink-50/80 px-4 py-3 dark:border-ink-800 dark:bg-ink-800/50">
          <p className="whitespace-pre-line text-sm leading-6 text-ink-600 dark:text-ink-300">
            &ldquo;{review.comment}&rdquo;
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm italic text-ink-400 dark:text-ink-500">
          Customer left a rating without a written comment.
        </p>
      )}

      {review.service?.title && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-100 bg-primary-50 px-3 py-1.5 text-[11px] font-bold text-primary-700 transition group-hover:border-primary-200 dark:border-primary-900/60 dark:bg-primary-950/40 dark:text-primary-300">
            <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
            {review.service.title}
          </span>

          {review.service.category && (
            <span className="rounded-full bg-ink-100 px-2.5 py-1.5 text-[11px] font-semibold text-ink-500 dark:bg-ink-800 dark:text-ink-400">
              {review.service.category}
            </span>
          )}

          {Number(review.service.price) > 0 && (
            <span className="text-[11px] font-semibold text-ink-400 dark:text-ink-500">
              {formatPrice(review.service.price)}
            </span>
          )}
        </div>
      )}
    </motion.article>
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ReviewsTab({
  reviews,
  providerName,
  loading,
  error,
  onRetry,
}: ReviewsTabProps) {
  const [filter, setFilter] = useState<RatingFilter>("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const summary = useMemo(() => {
    const total = reviews.length;
    const totalRating = reviews.reduce(
      (sum, review) => sum + getRating(review),
      0
    );
    const average = total > 0 ? totalRating / total : 0;

    const distribution = [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter(
        (review) => getStarBucket(review) === star
      ).length;

      return {
        star,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      };
    });

    const recommendCount = distribution
      .filter((entry) => entry.star >= 4)
      .reduce((sum, entry) => sum + entry.count, 0);

    return {
      total,
      average,
      distribution,
      recommendPercentage:
        total > 0 ? Math.round((recommendCount / total) * 100) : 0,
    };
  }, [reviews]);

  const sortedReviews = useMemo(() => {
    const list = [...reviews];

    return list.sort((a, b) => {
      const aTime = getTimestamp(a.createdAt || a.updatedAt);
      const bTime = getTimestamp(b.createdAt || b.updatedAt);

      if (sort === "highest") {
        return getRating(b) - getRating(a) || bTime - aTime;
      }

      if (sort === "lowest") {
        return getRating(a) - getRating(b) || bTime - aTime;
      }

      return bTime - aTime;
    });
  }, [reviews, sort]);

  const filteredReviews = useMemo(() => {
    if (filter === "all") return sortedReviews;

    const star = Number(filter);

    return sortedReviews.filter(
      (review) => getStarBucket(review) === star
    );
  }, [sortedReviews, filter]);

  const visibleReviews = filteredReviews.slice(0, visibleCount);
  const remaining = filteredReviews.length - visibleReviews.length;

  const handleFilterChange = (value: RatingFilter) => {
    setFilter(value);
    setVisibleCount(PAGE_SIZE);
  };

  const handleSortChange = (value: SortOption) => {
    setSort(value);
    setVisibleCount(PAGE_SIZE);
  };

  if (loading) {
    return (
      <section aria-label="Customer reviews" className="w-full">
        <LoadingSkeleton />
      </section>
    );
  }

  if (error) {
    return (
      <section aria-label="Customer reviews" className="w-full">
        <ErrorState
          title="Could not load reviews"
          message={error}
          onRetry={onRetry}
        />
      </section>
    );
  }

  if (summary.total === 0) {
    return (
      <section aria-label="Customer reviews" className="w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-3xl border border-dashed border-ink-200 bg-white px-6 py-12 text-center shadow-card dark:border-ink-800 dark:bg-ink-900"
        >
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-100/50 blur-3xl dark:bg-brand-950/30" />

          <div className="relative flex max-w-md flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-primary-50 text-brand-600 ring-1 ring-brand-100 dark:from-brand-950 dark:to-primary-950 dark:text-brand-300 dark:ring-brand-900/60">
              <Star className="h-7 w-7" aria-hidden="true" />
            </div>

            <h3 className="mt-5 text-xl font-extrabold tracking-tight text-ink-900 dark:text-white">
              No reviews yet
            </h3>

            <p className="mt-2 text-sm leading-6 text-ink-500 dark:text-ink-400">
              Reviews from customers will appear here after they complete a
              booking with {providerName || "this provider"}.
            </p>

            <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink-50 px-3 py-1.5 text-xs font-semibold text-ink-500 dark:bg-ink-800 dark:text-ink-400">
              <span className="h-1.5 w-1.5 rounded-full bg-ink-300 dark:bg-ink-600" />
              No customer reviews yet
            </span>
          </div>
        </motion.div>
      </section>
    );
  }

  return (
    <section
      aria-label={`Reviews for ${providerName || "this provider"}`}
      className="w-full space-y-5"
    >
      {/* =====================================================
          REVIEW SUMMARY
      ====================================================== */}

      <div className="relative overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand-100/50 blur-3xl dark:bg-brand-950/30" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-primary-100/40 blur-3xl dark:bg-primary-950/20" />

        <div className="relative grid gap-8 p-6 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:p-7">
          <div className="flex flex-col justify-center gap-5 sm:flex-row sm:items-center lg:flex-col lg:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-50 to-warning-100 text-warning-600 ring-1 ring-warning-200/70 dark:from-brand-950/40 dark:to-warning-700/30 dark:text-warning-200 dark:ring-warning-500/20">
              <Star
                className="h-8 w-8 fill-current"
                aria-hidden="true"
              />
            </div>

            <div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black tracking-tight text-ink-900 dark:text-white sm:text-5xl">
                  {summary.average.toFixed(1)}
                </span>
                <span className="pb-1.5 text-sm font-semibold text-ink-400 dark:text-ink-500">
                  / 5
                </span>
              </div>

              <div className="mt-2">
                <StarRow value={summary.average} size="md" />
              </div>

              <p className="mt-2 text-xs font-medium text-ink-500 dark:text-ink-400">
                Based on {summary.total} verified reviews
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-ink-700 dark:text-ink-300">
                Rating breakdown
              </h3>

              <span className="inline-flex items-center gap-2 rounded-full bg-success-50 px-3 py-1.5 text-xs font-bold text-success-700 ring-1 ring-success-200/70 dark:bg-success-500/10 dark:text-success-200 dark:ring-success-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Recommend
                <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] dark:bg-ink-900/50">
                  {summary.recommendPercentage}%
                </span>
              </span>
            </div>

            <div className="space-y-2.5" aria-label="Star rating distribution">
              {summary.distribution.map((entry) => (
                <div
                  key={entry.star}
                  className="flex items-center gap-3"
                  role="img"
                  aria-label={`${entry.count} ${entry.star} star ${entry.count === 1 ? "review" : "reviews"}`}
                >
                  <span className="w-7 shrink-0 text-xs font-bold text-ink-500 dark:text-ink-400">
                    {entry.star}★
                  </span>

                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${entry.percentage}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-primary-400"
                    />
                  </div>

                  <span className="w-9 shrink-0 text-right text-xs font-semibold text-ink-500 dark:text-ink-400">
                    {Math.round(entry.percentage)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="h-1 w-full bg-gradient-to-r from-brand-500 via-primary-400 to-transparent" />
      </div>

      {/* =====================================================
          TOOLBAR
      ====================================================== */}

      <div className="flex flex-col gap-4 rounded-2xl border border-ink-100 bg-white/80 p-4 shadow-card backdrop-blur dark:border-ink-800 dark:bg-ink-900/80 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter reviews by star rating"
        >
          {(["all", "5", "4", "3", "2", "1"] as RatingFilter[]).map(
            (value) => {
              const active = filter === value;
              const count =
                value === "all"
                  ? summary.total
                  : summary.distribution.find(
                    (entry) => entry.star === Number(value)
                  )?.count || 0;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleFilterChange(value)}
                  aria-pressed={active}
                  aria-label={
                    value === "all"
                      ? `Show all ${summary.total} reviews`
                      : `Show ${count} ${value} star reviews`
                  }
                  className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
                    active
                      ? "border-brand-200 bg-brand-600 text-white shadow-soft dark:border-brand-500/40"
                      : "border-ink-200 bg-white text-ink-600 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:border-primary-900 dark:hover:bg-primary-950/30 dark:hover:text-primary-300"
                  }`}
                >
                  {value === "all" ? "All" : `${value}★`}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            }
          )}
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="reviews-sort"
            className="text-xs font-semibold text-ink-500 dark:text-ink-400"
          >
            Sort by
          </label>

          <div className="relative">
            <select
              id="reviews-sort"
              value={sort}
              onChange={(event) =>
                handleSortChange(event.target.value as SortOption)
              }
              aria-label="Sort reviews"
              className="min-h-[38px] appearance-none rounded-xl border border-ink-200 bg-white py-2 pl-3 pr-9 text-xs font-bold text-ink-700 outline-none transition hover:border-primary-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:border-primary-900"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400 dark:text-ink-500"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* =====================================================
          HEADER + RESULT COUNT
      ====================================================== */}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 ring-1 ring-primary-100 dark:bg-primary-950/40 dark:text-primary-300 dark:ring-primary-900/50">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </div>

          <div>
            <h3 className="text-lg font-extrabold tracking-tight text-ink-900 dark:text-white">
              Customer reviews
            </h3>
            <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
              See what customers say about {providerName || "this provider"}.
            </p>
          </div>
        </div>

        <p
          className="text-xs font-medium text-ink-500 dark:text-ink-400"
          aria-live="polite"
        >
          Showing{" "}
          <span className="font-extrabold text-ink-800 dark:text-ink-100">
            {visibleReviews.length}
          </span>{" "}
          of{" "}
          <span className="font-extrabold text-ink-800 dark:text-ink-100">
            {filteredReviews.length}
          </span>{" "}
          {filteredReviews.length === 1 ? "review" : "reviews"}
          {filter !== "all" && ` with ${filter} stars`}
        </p>
      </div>

      {/* =====================================================
          REVIEW LIST
      ====================================================== */}

      {filteredReviews.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-ink-200 bg-white px-6 py-12 text-center shadow-card dark:border-ink-800 dark:bg-ink-900"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning-50 text-warning-600 ring-1 ring-warning-200/70 dark:bg-warning-500/10 dark:text-warning-200 dark:ring-warning-500/20">
            <Star className="h-6 w-6" aria-hidden="true" />
          </div>

          <h3 className="mt-4 text-base font-extrabold text-ink-900 dark:text-white">
            No {filter}★ reviews
          </h3>

          <p className="mt-2 max-w-sm text-sm leading-6 text-ink-500 dark:text-ink-400">
            No reviews match the selected star filter. Reset the filter to see
            all customer feedback.
          </p>

          <button
            type="button"
            onClick={() => handleFilterChange("all")}
            className="mt-5 inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:bg-white dark:text-ink-900 dark:hover:bg-ink-100"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset filter
          </button>
        </motion.div>
      ) : (
        <>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              layout
              className="grid gap-4 xl:grid-cols-2"
              aria-label="Customer review list"
            >
              {visibleReviews.map((review, index) => (
                <ReviewCard
                  key={review._id}
                  review={review}
                  index={index}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-ink-100 pt-5 dark:border-ink-800 sm:flex-row">
            <p className="text-xs text-ink-500 dark:text-ink-400">
              {remaining > 0
                ? `${remaining} more ${remaining === 1 ? "review" : "reviews"} available`
                : "You have reached the end of the reviews."}
            </p>

            {remaining > 0 && (
              <button
                type="button"
                onClick={() =>
                  setVisibleCount((current) => current + PAGE_SIZE)
                }
                aria-label={`Show ${Math.min(PAGE_SIZE, remaining)} more reviews`}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-ink-200 bg-white px-5 py-2.5 text-sm font-bold text-ink-700 shadow-card transition hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:border-primary-900 dark:hover:bg-primary-950/30 dark:hover:text-primary-300"
              >
                Show more
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
