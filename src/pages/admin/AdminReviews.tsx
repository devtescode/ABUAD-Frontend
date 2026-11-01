import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Star,
  X,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { DashboardLayout, DashboardHeader } from "@/components/DashboardLayout";
import { adminNavItems } from "@/data/adminNavItems";
import { StarRating } from "@/components/shared";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  ResponsiveModal,
  Skeleton,
  cn,
} from "@/components/ui";
import { getApiErrorMessage } from "@/lib/api";
import {
  useAdminReviewVisibility,
  useAdminReviews,
} from "@/hooks/queries";

/* =========================================================
   TYPES
========================================================= */

interface Customer {
  _id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  avatar?: string;
  profileImage?: string;
}

interface Provider {
  _id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
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
  _id: string;
  booking?: string;
  customer?: Customer;
  provider?: Provider;
  service?: Service;
  rating: number;
  comment?: string;
  isHidden?: boolean;
  hidden?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

type VisibilityFilter = "all" | "visible" | "hidden";
type RatingFilter = "all" | "5" | "4" | "3" | "low";
type SortOption = "newest" | "oldest" | "highest" | "lowest";

interface Toast {
  type: "success" | "error";
  message: string;
}

/* =========================================================
   HELPERS
========================================================= */

const formatDate = (date?: string) => {
  if (!date) return "Unknown date";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown date";
  }

  return parsedDate.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getCustomerName = (customer?: Customer) => {
  return (
    customer?.name ||
    customer?.fullName ||
    customer?.email ||
    "Customer"
  );
};

const getProviderName = (provider?: Provider) => {
  return (
    provider?.name ||
    provider?.fullName ||
    provider?.email ||
    "Provider"
  );
};

/*
 * Extract a phone number from a customer or provider.
 * Handles multiple possible backend field names.
 */
const getPersonPhone = (person?: Customer | Provider) => {
  return person?.phone || person?.phoneNumber || "";
};

const getImage = (person?: Customer | Provider) => {
  return person?.avatar || person?.profileImage || "";
};

/*
 * Helper: determine whether a review is currently hidden.
 * Handles multiple possible backend field names so this
 * works regardless of how the backend names it.
 */
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

const getReviewTime = (review: Review) => {
  if (!review.createdAt) return 0;

  const time = new Date(review.createdAt).getTime();

  return Number.isNaN(time) ? 0 : time;
};

/* =========================================================
   PAGE
========================================================= */

export function AdminReviews() {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useAdminReviews();

  const {
    mutateAsync: toggleVisibility,
    isPending: isVisibilityPending,
    variables: visibilityVariables,
  } = useAdminReviewVisibility();

  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>("all");
  const [ratingFilter, setRatingFilter] =
    useState<RatingFilter>("all");
  const [sortOption, setSortOption] =
    useState<SortOption>("newest");

  const [selectedReviewId, setSelectedReviewId] = useState<
    string | null
  >(null);
  const [confirmTarget, setConfirmTarget] =
    useState<Review | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  /*
   * Reviews come straight from React Query. Hidden-review
   * normalisation is handled by `isReviewHidden` so the UI keeps
   * supporting every backend field name.
   */
  const reviews = useMemo<Review[]>(
    () =>
      Array.isArray(data)
        ? (data as unknown as Review[])
        : [],
    [data]
  );

  /*
   * The details dialog derives its review from the query data so it
   * stays in sync after a hide/unhide mutation invalidates the list.
   */
  const selectedReview = useMemo(
    () =>
      reviews.find(
        (review) => review._id === selectedReviewId
      ) || null,
    [reviews, selectedReviewId]
  );

  /* Auto-dismiss toast after 3 seconds. */
  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [toast]);

  /* =======================================================
     SEARCH / FILTER / SORT
  ======================================================= */

  const filteredReviews = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const list = reviews.filter((review) => {
      if (
        visibilityFilter !== "all" &&
        isReviewHidden(review) !==
          (visibilityFilter === "hidden")
      ) {
        return false;
      }

      const rating = Number(review.rating || 0);

      if (ratingFilter === "5" && rating !== 5) {
        return false;
      }

      if (ratingFilter === "4" && rating !== 4) {
        return false;
      }

      if (ratingFilter === "3" && rating !== 3) {
        return false;
      }

      if (ratingFilter === "low" && rating > 2) {
        return false;
      }

      if (!query) return true;

      const customerName = getCustomerName(
        review.customer
      ).toLowerCase();

      const customerEmail =
        review.customer?.email?.toLowerCase() || "";

      const customerPhone = getPersonPhone(
        review.customer
      ).toLowerCase();

      const providerName = getProviderName(
        review.provider
      ).toLowerCase();

      const providerEmail =
        review.provider?.email?.toLowerCase() || "";

      const providerPhone = getPersonPhone(
        review.provider
      ).toLowerCase();

      const serviceName =
        review.service?.title?.toLowerCase() || "";

      const serviceCategory =
        review.service?.category?.toLowerCase() || "";

      const comment = review.comment?.toLowerCase() || "";

      return (
        customerName.includes(query) ||
        customerEmail.includes(query) ||
        customerPhone.includes(query) ||
        providerName.includes(query) ||
        providerEmail.includes(query) ||
        providerPhone.includes(query) ||
        serviceName.includes(query) ||
        serviceCategory.includes(query) ||
        comment.includes(query)
      );
    });

    const sorted = [...list];

    switch (sortOption) {
      case "oldest":
        sorted.sort(
          (a, b) => getReviewTime(a) - getReviewTime(b)
        );
        break;
      case "highest":
        sorted.sort(
          (a, b) =>
            Number(b.rating || 0) - Number(a.rating || 0)
        );
        break;
      case "lowest":
        sorted.sort(
          (a, b) =>
            Number(a.rating || 0) - Number(b.rating || 0)
        );
        break;
      default:
        sorted.sort(
          (a, b) => getReviewTime(b) - getReviewTime(a)
        );
    }

    return sorted;
  }, [
    reviews,
    searchQuery,
    visibilityFilter,
    ratingFilter,
    sortOption,
  ]);

  /* =======================================================
     STATISTICS (based on ALL reviews, not filtered results)
  ======================================================= */

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;

    const total = reviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0
    );

    return total / reviews.length;
  }, [reviews]);

  const fiveStarReviews = useMemo(
    () =>
      reviews.filter(
        (review) => Number(review.rating) === 5
      ).length,
    [reviews]
  );

  const lowRatedReviews = useMemo(
    () =>
      reviews.filter(
        (review) => Number(review.rating) <= 2
      ).length,
    [reviews]
  );

  const hiddenReviews = useMemo(
    () =>
      reviews.filter((review) =>
        isReviewHidden(review)
      ).length,
    [reviews]
  );

  const fiveStarPercent = reviews.length
    ? Math.round((fiveStarReviews / reviews.length) * 100)
    : 0;

  /* =======================================================
     QUERY STATE
  ======================================================= */

  const errorMessage = isError
    ? getApiErrorMessage(error)
    : "";

  /*
   * Refetch when the current data is stale after a failed
   * background refresh, keeping any previously loaded rows.
   */
  const showStaleError =
    isError && reviews.length > 0;

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    visibilityFilter !== "all" ||
    ratingFilter !== "all";

  const resetFilters = () => {
    setSearchQuery("");
    setVisibilityFilter("all");
    setRatingFilter("all");
    setSortOption("newest");
  };

  /* =======================================================
     ACTIONS
  ======================================================= */

  const requestToggle = (review: Review) => {
    if (!review?._id || isVisibilityPending) return;

    setSelectedReviewId(null);
    setToast(null);
    setConfirmTarget(review);
  };

  const handleConfirmToggle = async () => {
    const target = confirmTarget;

    if (!target?._id) return;

    const hide = !isReviewHidden(target);

    setToast(null);

    try {
      await toggleVisibility({
        id: target._id,
        hide,
      });

      setToast({
        type: "success",
        message: hide
          ? "Review has been hidden from customers."
          : "Review is now visible to customers.",
      });

      setConfirmTarget(null);
    } catch (err) {
      console.error(
        "TOGGLE REVIEW VISIBILITY ERROR:",
        err
      );

      setToast({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Unable to update review visibility.",
      });
    }
  };

  const confirmHidden = confirmTarget
    ? !isReviewHidden(confirmTarget)
    : true;

  const isConfirming =
    Boolean(confirmTarget) &&
    isVisibilityPending &&
    visibilityVariables?.id === confirmTarget?._id;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <DashboardLayout role="admin" navItems={adminNavItems}>
      <DashboardHeader
        title="Review Management"
        subtitle="View and moderate customer reviews"
        action={
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300">
            <EyeOff className="h-3.5 w-3.5 text-danger-500 dark:text-danger-200" />
            {isLoading
              ? "Loading reviews…"
              : `${hiddenReviews} hidden`}
          </span>
        }
      />

      {/* ====================================================
          SUMMARY CARDS
      ==================================================== */}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "card p-4 sm:p-5",
                index === 0 && "col-span-2 sm:col-span-1"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-9 w-9 rounded-xl" />
              </div>
              <Skeleton className="mt-4 h-7 w-14" />
              <Skeleton className="mt-2 h-3 w-24" />
            </div>
          ))
        ) : (
          <>
            <MetricCard
              label="Total Reviews"
              value={reviews.length}
              icon={MessageSquare}
              tone="bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300"
              hint={
                <>
                  {hiddenReviews}{" "}
                  {hiddenReviews === 1
                    ? "review is"
                    : "reviews are"}{" "}
                  hidden
                </>
              }
              className="col-span-2 sm:col-span-1"
            />

            <MetricCard
              label="Average Rating"
              value={averageRating.toFixed(1)}
              icon={Star}
              tone="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
              hint={
                <div className="flex items-center gap-1.5">
                  <StarRating
                    rating={averageRating}
                    size={12}
                  />
                  <span>out of 5</span>
                </div>
              }
            />

            <MetricCard
              label="5-Star Reviews"
              value={fiveStarReviews}
              icon={Star}
              tone="bg-success-50 text-success-600 dark:bg-success-600/15 dark:text-success-200"
              hint={`${fiveStarPercent}% of all reviews`}
            />

            <MetricCard
              label="Low Rated"
              value={lowRatedReviews}
              icon={AlertCircle}
              tone="bg-warning-50 text-warning-600 dark:bg-warning-600/15 dark:text-warning-200"
              hint="Ratings of 2 or below"
            />

            <MetricCard
              label="Hidden Reviews"
              value={hiddenReviews}
              icon={EyeOff}
              tone="bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-200"
              hint="Excluded from customer view"
            />
          </>
        )}
      </div>

      {/* ====================================================
          TOOLBAR
      ==================================================== */}

      <div className="card mb-5 p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative w-full xl:flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-ink-500" />

            <input
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search by customer, provider, service or comment…"
              aria-label="Search reviews"
              autoComplete="off"
              className="search-input h-11 pl-10 pr-11"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-ink-800 dark:hover:text-ink-100"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:items-center">
            <select
              value={visibilityFilter}
              onChange={(event) =>
                setVisibilityFilter(
                  event.target.value as VisibilityFilter
                )
              }
              aria-label="Filter by visibility"
              className="input h-11 w-full min-w-0 cursor-pointer pr-9 text-sm xl:w-[168px]"
            >
              <option value="all">All reviews</option>
              <option value="visible">Visible only</option>
              <option value="hidden">Hidden only</option>
            </select>

            <select
              value={ratingFilter}
              onChange={(event) =>
                setRatingFilter(
                  event.target.value as RatingFilter
                )
              }
              aria-label="Filter by rating"
              className="input h-11 w-full min-w-0 cursor-pointer pr-9 text-sm xl:w-[160px]"
            >
              <option value="all">All ratings</option>
              <option value="5">5 stars</option>
              <option value="4">4 stars</option>
              <option value="3">3 stars</option>
              <option value="low">Low rated (≤2)</option>
            </select>

            <select
              value={sortOption}
              onChange={(event) =>
                setSortOption(
                  event.target.value as SortOption
                )
              }
              aria-label="Sort reviews"
              className="input h-11 w-full min-w-0 cursor-pointer pr-9 text-sm xl:w-[160px]"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="highest">Highest rated</option>
              <option value="lowest">Lowest rated</option>
            </select>

            <Button
              variant="outline"
              icon={RefreshCw}
              loading={isFetching}
              onClick={() => {
                void refetch();
              }}
              className="h-11 w-full sm:col-span-2 xl:w-auto"
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-ink-800">
          <p
            className="text-sm text-slate-500 dark:text-ink-400"
            aria-live="polite"
          >
            {isLoading ? (
              "Loading reviews…"
            ) : (
              <>
                Showing{" "}
                <span className="font-semibold text-slate-800 dark:text-ink-100">
                  {filteredReviews.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-800 dark:text-ink-100">
                  {reviews.length}
                </span>{" "}
                {reviews.length === 1
                  ? "review"
                  : "reviews"}
              </>
            )}
          </p>

          {hasActiveFilters && !isLoading && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/50"
            >
              <X className="h-3.5 w-3.5" />
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* ====================================================
          STALE / BACKGROUND ERROR
      ==================================================== */}

      {showStaleError && (
        <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:border-warning-600/30 dark:bg-warning-600/10 dark:text-warning-200 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Showing the last loaded reviews.{" "}
              {errorMessage}
            </span>
          </span>

          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="shrink-0 self-start font-semibold underline underline-offset-2 hover:no-underline sm:self-auto"
          >
            Retry
          </button>
        </div>
      )}

      {/* ====================================================
          CONTENT
      ==================================================== */}

      {isLoading ? (
        <ReviewsSkeleton />
      ) : isError && reviews.length === 0 ? (
        <ErrorState
          title="Unable to load reviews"
          message={errorMessage}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No reviews yet"
          description="Customer reviews will appear here after customers complete bookings and submit their feedback."
        />
      ) : filteredReviews.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching reviews"
          description={
            searchQuery.trim()
              ? `We couldn't find any reviews matching "${searchQuery.trim()}".`
              : "No reviews match the selected filters. Try a different combination."
          }
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          {/* ==============================================
              DESKTOP TABLE
          ============================================== */}

          <div className="card hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-sm">
                <caption className="sr-only">
                  Customer reviews available for moderation
                </caption>

                <thead className="border-b border-slate-200/70 bg-slate-50/95 text-[11px] uppercase tracking-wider text-slate-500 dark:border-ink-800 dark:bg-ink-900/95 dark:text-ink-400">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3.5 font-semibold"
                    >
                      Customer
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3.5 font-semibold"
                    >
                      Provider &amp; Service
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3.5 font-semibold"
                    >
                      Rating
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3.5 font-semibold"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3.5 font-semibold"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3.5 text-right font-semibold"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-ink-800">
                  {filteredReviews.map((review) => {
                    const view = getReviewView(review);

                    const rowIsPending =
                      isVisibilityPending &&
                      visibilityVariables?.id === review._id;

                    return (
                      <tr
                        key={review._id}
                        className={cn(
                          "group transition-colors hover:bg-slate-50/80 dark:hover:bg-ink-800/40",
                          view.hidden &&
                            "bg-danger-50/40 dark:bg-danger-500/5"
                        )}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={view.customerImage}
                              name={view.customerName}
                              size="md"
                            />

                            <div className="min-w-0">
                              <p className="max-w-[190px] truncate font-semibold text-slate-900 dark:text-ink-50">
                                {view.customerName}
                              </p>

                              {review.customer?.email && (
                                <p className="max-w-[190px] truncate text-xs text-slate-500 dark:text-ink-400">
                                  {review.customer.email}
                                </p>
                              )}

                              {view.customerPhone && (
                                <p className="mt-0.5 flex max-w-[190px] items-center gap-1 truncate text-[11px] text-slate-400 dark:text-ink-500">
                                  <Phone className="h-3 w-3 shrink-0" />
                                  {view.customerPhone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate font-semibold text-slate-900 dark:text-ink-50">
                              {view.providerName}
                            </p>

                            {review.service?.title && (
                              <p className="max-w-[220px] truncate text-xs text-slate-500 dark:text-ink-400">
                                {review.service.title}
                              </p>
                            )}

                            {review.service?.category && (
                              <p className="max-w-[220px] truncate text-[11px] text-slate-400 dark:text-ink-500">
                                {review.service.category}
                              </p>
                            )}

                            {view.providerPhone && (
                              <p className="mt-0.5 flex max-w-[220px] items-center gap-1 truncate text-[11px] text-slate-400 dark:text-ink-500">
                                <Phone className="h-3 w-3 shrink-0" />
                                {view.providerPhone}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <StarRating
                              rating={Number(
                                review.rating || 0
                              )}
                              size={14}
                            />
                            <span className="text-xs font-semibold text-slate-500 dark:text-ink-400">
                              {review.rating}/5
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <VisibilityBadge hidden={view.hidden} />
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500 dark:text-ink-400">
                          {formatDate(review.createdAt)}
                        </td>

                        <td className="px-4 py-4">
                          <ReviewActions
                            hidden={view.hidden}
                            pending={rowIsPending}
                            busy={isVisibilityPending}
                            onView={() =>
                              setSelectedReviewId(review._id)
                            }
                            onToggle={() =>
                              requestToggle(review)
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ==============================================
              MOBILE CARDS
          ============================================== */}

          <div className="space-y-3 md:hidden">
            {filteredReviews.map((review) => {
              const view = getReviewView(review);

              const rowIsPending =
                isVisibilityPending &&
                visibilityVariables?.id === review._id;

              return (
                <motion.div
                  key={review._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "card p-4 transition-shadow hover:shadow-card-hover",
                    view.hidden &&
                      "border-danger-200 bg-danger-50/40 dark:border-danger-500/30 dark:bg-danger-500/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        src={view.customerImage}
                        name={view.customerName}
                        size="md"
                      />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
                          {view.customerName}
                        </p>

                        {review.customer?.email && (
                          <p className="truncate text-xs text-slate-500 dark:text-ink-400">
                            {review.customer.email}
                          </p>
                        )}

                        {view.customerPhone && (
                          <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-slate-400 dark:text-ink-500">
                            <Phone className="h-3 w-3 shrink-0" />
                            {view.customerPhone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                      <StarRating
                        rating={Number(review.rating || 0)}
                        size={13}
                      />
                      <span className="text-xs font-semibold text-slate-500 dark:text-ink-400">
                        {review.rating}/5
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <VisibilityBadge hidden={view.hidden} />
                    <span className="text-xs text-slate-400 dark:text-ink-500">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>

                  <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-ink-800/50">
                    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
                      <span className="text-xs text-slate-400 dark:text-ink-500">
                        Reviewed:
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-ink-100">
                        {view.providerName}
                      </span>
                      {review.service?.title && (
                        <span className="text-xs text-slate-500 dark:text-ink-400">
                          • {review.service.title}
                        </span>
                      )}
                    </p>

                    {review.service?.category && (
                      <p className="mt-1 text-[11px] text-slate-400 dark:text-ink-500">
                        {review.service.category}
                      </p>
                    )}

                    {view.providerPhone && (
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-ink-400">
                        <Phone className="h-3 w-3 shrink-0" />
                        Provider phone: {view.providerPhone}
                      </p>
                    )}
                  </div>

                  {review.comment ? (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-ink-300">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  ) : (
                    <p className="mt-3 text-sm italic text-slate-400 dark:text-ink-500">
                      No written comment was provided.
                    </p>
                  )}

                  <div className="mt-4 border-t border-slate-100 pt-3 dark:border-ink-800">
                    <ReviewActions
                      hidden={view.hidden}
                      pending={rowIsPending}
                      busy={isVisibilityPending}
                      layout="grid"
                      onView={() =>
                        setSelectedReviewId(review._id)
                      }
                      onToggle={() => requestToggle(review)}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* ====================================================
          REVIEW DETAILS
      ==================================================== */}

      <ResponsiveModal
        open={Boolean(selectedReview)}
        onClose={() => setSelectedReviewId(null)}
        title="Review details"
        footer={
          selectedReview ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedReviewId(null)}
                className="min-h-10"
              >
                Close
              </Button>

              <Button
                variant={
                  isReviewHidden(selectedReview)
                    ? "primary"
                    : "danger"
                }
                size="sm"
                icon={
                  isReviewHidden(selectedReview)
                    ? Eye
                    : Ban
                }
                disabled={isVisibilityPending}
                onClick={() =>
                  requestToggle(selectedReview)
                }
                className="min-h-10"
              >
                {isReviewHidden(selectedReview)
                  ? "Unhide review"
                  : "Hide review"}
              </Button>
            </div>
          ) : null
        }
      >
        {selectedReview && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <VisibilityBadge
                hidden={isReviewHidden(selectedReview)}
              />

              <span className="text-xs font-medium text-slate-500 dark:text-ink-400">
                {formatDate(selectedReview.createdAt)}
              </span>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-ink-500">
                Customer
              </p>

              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-ink-800 dark:bg-ink-800/40">
                <Avatar
                  src={getImage(selectedReview.customer)}
                  name={getCustomerName(
                    selectedReview.customer
                  )}
                  size="lg"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900 dark:text-ink-50">
                    {getCustomerName(selectedReview.customer)}
                  </p>

                  {selectedReview.customer?.email && (
                    <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-ink-400">
                      {selectedReview.customer.email}
                    </p>
                  )}

                  {getPersonPhone(selectedReview.customer) && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500 dark:text-ink-400">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {getPersonPhone(
                        selectedReview.customer
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-ink-500">
                Provider
              </p>

              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3.5 shadow-xs dark:border-ink-800 dark:bg-ink-900">
                <Avatar
                  src={getImage(selectedReview.provider)}
                  name={getProviderName(
                    selectedReview.provider
                  )}
                  size="lg"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900 dark:text-ink-50">
                    {getProviderName(selectedReview.provider)}
                  </p>

                  {selectedReview.provider?.email && (
                    <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-ink-400">
                      {selectedReview.provider.email}
                    </p>
                  )}

                  {getPersonPhone(selectedReview.provider) && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500 dark:text-ink-400">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {getPersonPhone(
                        selectedReview.provider
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-ink-500">
                Service Reviewed
              </p>

              <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xs dark:border-ink-800 dark:bg-ink-900">
                {selectedReview.service?.image ? (
                  <img
                    src={selectedReview.service.image}
                    alt={
                      selectedReview.service.title ||
                      "Service"
                    }
                    loading="lazy"
                    className="h-40 w-full object-cover sm:h-44"
                  />
                ) : (
                  <div className="flex h-28 items-center justify-center bg-slate-100 text-sm text-slate-400 dark:bg-ink-800 dark:text-ink-500">
                    No service image available
                  </div>
                )}

                <div className="p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-ink-50">
                        {selectedReview.service?.title ||
                          "Service"}
                      </p>

                      {selectedReview.service?.category && (
                        <span className="badge mt-1.5 bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                          {selectedReview.service.category}
                        </span>
                      )}
                    </div>

                    {typeof selectedReview.service?.price ===
                      "number" && (
                      <p className="shrink-0 text-sm font-bold text-brand-600 dark:text-brand-300">
                        ₦
                        {selectedReview.service.price.toLocaleString(
                          "en-NG"
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-ink-500">
                Rating
              </p>

              <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-ink-800 dark:bg-ink-800/40">
                <StarRating
                  rating={Number(selectedReview.rating || 0)}
                  size={18}
                />
                <span className="text-sm font-semibold text-slate-700 dark:text-ink-200">
                  {selectedReview.rating}/5
                </span>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-ink-500">
                Customer Review
              </p>

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-ink-800 dark:bg-ink-800/40">
                <p className="text-sm leading-6 text-slate-700 dark:text-ink-200">
                  {selectedReview.comment ||
                    "No written comment was provided."}
                </p>
              </div>
            </div>
          </div>
        )}
      </ResponsiveModal>

      {/* ====================================================
          CONFIRMATION
      ==================================================== */}

      <ResponsiveModal
        open={Boolean(confirmTarget)}
        onClose={() => {
          if (!isConfirming) setConfirmTarget(null);
        }}
        title={
          confirmHidden
            ? "Hide this review?"
            : "Unhide this review?"
        }
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmTarget(null)}
              disabled={isConfirming}
              className="min-h-10"
            >
              Cancel
            </Button>

            <Button
              variant={confirmHidden ? "danger" : "primary"}
              size="sm"
              loading={isConfirming}
              onClick={() => {
                void handleConfirmToggle();
              }}
              className="min-h-10"
            >
              {confirmHidden ? "Hide review" : "Unhide review"}
            </Button>
          </div>
        }
      >
        {confirmTarget && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-ink-800 dark:bg-ink-800/40">
              <Avatar
                src={getImage(confirmTarget.customer)}
                name={getCustomerName(confirmTarget.customer)}
                size="md"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
                  {getCustomerName(confirmTarget.customer)}
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <StarRating
                    rating={Number(confirmTarget.rating || 0)}
                    size={12}
                  />
                  <span className="text-xs text-slate-500 dark:text-ink-400">
                    {confirmTarget.rating}/5
                  </span>
                </div>

                {confirmTarget.comment && (
                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-ink-400">
                    &ldquo;{confirmTarget.comment}&rdquo;
                  </p>
                )}
              </div>
            </div>

            <p className="text-sm leading-relaxed text-slate-600 dark:text-ink-300">
              {confirmHidden
                ? "This review will be hidden from customers and provider profiles. You can unhide it at any time."
                : "This review will become visible to customers and provider profiles again."}
            </p>
          </div>
        )}
      </ResponsiveModal>

      {/* ====================================================
          TOAST
      ==================================================== */}

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{
              duration: 0.22,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex justify-center px-4 safe-bottom"
          >
            <div
              className={cn(
                "pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl border px-4 py-3 shadow-elevated backdrop-blur-md",
                toast.type === "success"
                  ? "border-success-200 bg-success-50/95 text-success-700 dark:border-success-600/30 dark:bg-success-600/15 dark:text-success-200"
                  : "border-danger-200 bg-danger-50/95 text-danger-700 dark:border-danger-500/30 dark:bg-danger-500/15 dark:text-danger-200"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white",
                  toast.type === "success"
                    ? "bg-success-600"
                    : "bg-danger-600"
                )}
              >
                {toast.type === "success" ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
              </span>

              <p className="text-sm font-semibold">
                {toast.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

/* =========================================================
   SHARED BITS
========================================================= */

function getReviewView(review: Review) {
  return {
    customerName: getCustomerName(review.customer),
    customerImage: getImage(review.customer),
    customerPhone: getPersonPhone(review.customer),
    providerName: getProviderName(review.provider),
    providerPhone: getPersonPhone(review.provider),
    hidden: isReviewHidden(review),
  };
}

function VisibilityBadge({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <Badge tone="danger" icon={EyeOff}>
      Hidden
    </Badge>
  ) : (
    <Badge tone="success" icon={Eye}>
      Visible
    </Badge>
  );
}

function ReviewActions({
  hidden,
  pending,
  busy,
  layout = "row",
  onView,
  onToggle,
}: {
  hidden: boolean;
  pending: boolean;
  busy: boolean;
  layout?: "row" | "grid";
  onView: () => void;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "items-center gap-2",
        layout === "row"
          ? "flex justify-end"
          : "grid grid-cols-2"
      )}
    >
      <button
        type="button"
        onClick={onView}
        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-200 hover:bg-lavender hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600/60 dark:border-ink-700 dark:bg-transparent dark:text-ink-300 dark:hover:border-ink-600 dark:hover:bg-ink-800 dark:hover:text-ink-50"
      >
        <Eye className="h-3.5 w-3.5" />
        View
      </button>

      <button
        type="button"
        onClick={onToggle}
        disabled={busy}
        aria-busy={pending || undefined}
        className={cn(
          "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60",
          hidden
            ? "border-success-200 bg-white text-success-700 hover:bg-success-50 focus-visible:ring-success-600/60 dark:border-success-600/30 dark:bg-transparent dark:text-success-200 dark:hover:bg-success-600/10"
            : "border-danger-200 bg-white text-danger-600 hover:bg-danger-50 focus-visible:ring-danger-500/60 dark:border-danger-500/30 dark:bg-transparent dark:text-danger-200 dark:hover:bg-danger-500/10"
        )}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : hidden ? (
          <Eye className="h-3.5 w-3.5" />
        ) : (
          <Ban className="h-3.5 w-3.5" />
        )}

        {pending
          ? hidden
            ? "Unhiding…"
            : "Hiding…"
          : hidden
            ? "Unhide"
            : "Hide"}
      </button>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  className,
}: {
  label: string;
  value: string | number;
  hint?: React.ReactNode;
  icon: LucideIcon;
  tone: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "card flex flex-col justify-between gap-3 p-4 transition-shadow hover:shadow-card-hover sm:p-5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-ink-400">
          {label}
        </p>

        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-black/5 dark:ring-white/10",
            tone
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <div>
        <p className="text-2xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-ink-50">
          {value}
        </p>

        {hint && (
          <div className="mt-1 text-xs text-slate-500 dark:text-ink-400">
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="card overflow-hidden" aria-busy="true">
      <div className="hidden items-center gap-4 border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-ink-800 dark:bg-ink-900/60 md:flex">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="ml-auto h-3 w-16" />
      </div>

      <div className="divide-y divide-slate-100 dark:divide-ink-800">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 px-4 py-4 sm:px-5"
          >
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />

            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-40 max-w-full" />
              <Skeleton className="h-3 w-56 max-w-full" />
            </div>

            <Skeleton className="hidden h-3 w-20 sm:block" />
            <Skeleton className="h-8 w-20 shrink-0 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
