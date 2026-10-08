import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Ban,
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Star,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { DashboardLayout, DashboardHeader } from "@/components/DashboardLayout";
import { adminNavItems } from "@/data/adminNavItems";
import { StarRating } from "@/components/shared";


const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

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

interface ReviewsResponse {
  success: boolean;
  count?: number;
  reviews?: Review[];
  message?: string;
}

interface ToggleHideResponse {
  success: boolean;
  message?: string;
  review?: Review;
}

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
const getPersonPhone = (
  person?: Customer | Provider
) => {
  return (
    person?.phone ||
    person?.phoneNumber ||
    ""
  );
};

const getInitial = (name?: string) => {
  if (!name) return "?";

  return name.trim().charAt(0).toUpperCase();
};

const getImage = (
  person?: Customer | Provider
) => {
  return (
    person?.avatar ||
    person?.profileImage ||
    ""
  );
};

/*
 * Helper: determine whether a review is currently hidden.
 * Handles multiple possible backend field names so this
 * works regardless of how your backend names it.
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

export function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedReview, setSelectedReview] =
    useState<Review | null>(null);

  const [searchQuery, setSearchQuery] =
    useState("");

  /*
   * Tracks which review ids are currently being toggled.
   * Used to disable the button and show a spinner only on
   * the specific review being updated.
   */
  const [togglingIds, setTogglingIds] = useState<
    Set<string>
  >(new Set());

  /*
   * Toast-style feedback for hide/unhide results.
   */
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchReviews = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const token = sessionStorage.getItem(
          "servicely_admin_token"
        );

        if (!token) {
          throw new Error(
            "Admin session expired. Please log in again."
          );
        }

        const response = await fetch(
          `${API_URL}/adminreviews/allreviews`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data: ReviewsResponse =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load reviews."
          );
        }

        if (!data.success) {
          throw new Error(
            data.message ||
              "Unable to load reviews."
          );
        }

        setReviews(
          Array.isArray(data.reviews)
            ? data.reviews
            : []
        );
      } catch (err) {
        console.error(
          "FETCH ADMIN REVIEWS ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load reviews."
        );

        if (!isRefresh) {
          setReviews([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  /*
   * Auto-dismiss toast after 3 seconds.
   */
  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleRefresh = () => {
    fetchReviews(true);
  };

  /* =========================================================
     TOGGLE HIDE / UNHIDE
     
     Sends a PATCH request to the backend to hide or unhide
     the given review.

     Backend endpoint used:
       PATCH /adminreviews/:id/hide
       PATCH /adminreviews/:id/unhide

     If your backend uses a single endpoint like
     /adminreviews/:id/visibility with a body { hidden: true },
     swap the two fetch calls below for one.
  ========================================================= */
  const handleToggleHide = async (review: Review) => {
    if (!review?._id) return;

    const currentlyHidden = isReviewHidden(review);
    const reviewId = review._id;

    // Guard: skip if already toggling this review
    if (togglingIds.has(reviewId)) return;

    // Mark as toggling
    setTogglingIds((prev) => {
      const next = new Set(prev);
      next.add(reviewId);
      return next;
    });

    try {
      const token = sessionStorage.getItem(
        "servicely_admin_token"
      );

      if (!token) {
        throw new Error(
          "Admin session expired. Please log in again."
        );
      }

      const endpoint = currentlyHidden
        ? `${API_URL}/adminreviews/${encodeURIComponent(
            reviewId
          )}/unhide`
        : `${API_URL}/adminreviews/${encodeURIComponent(
            reviewId
          )}/hide`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let data: ToggleHideResponse;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message ||
            (currentlyHidden
              ? "Unable to unhide review."
              : "Unable to hide review.")
        );
      }

      /*
       * Update local state so the UI reflects the new state
       * without needing a full refetch.
       *
       * We prefer the review object returned by the backend
       * (data.review) if present, otherwise we patch locally.
       */
      const updatedReview: Review = data.review
        ? data.review
        : {
            ...review,
            isHidden: !currentlyHidden,
            hidden: !currentlyHidden,
          };

      setReviews((prev) =>
        prev.map((item) =>
          item._id === reviewId
            ? { ...item, ...updatedReview }
            : item
        )
      );

      // Keep the modal in sync if it's open on this review
      setSelectedReview((prev) =>
        prev && prev._id === reviewId
          ? { ...prev, ...updatedReview }
          : prev
      );

      setToast({
        type: "success",
        message: currentlyHidden
          ? "Review is now visible to customers."
          : "Review has been hidden from customers.",
      });
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
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(reviewId);
        return next;
      });
    }
  };

  /*
   * SEARCH
   * Searches through:
   * - Customer name
   * - Customer email
   * - Customer phone
   * - Provider name
   * - Provider email
   * - Provider phone
   * - Service title
   * - Service category
   * - Review comment
   */
  const filteredReviews = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    if (!query) {
      return reviews;
    }

    return reviews.filter((review) => {
      const customerName =
        getCustomerName(
          review.customer
        ).toLowerCase();

      const customerEmail =
        review.customer?.email?.toLowerCase() ||
        "";

      const customerPhone =
        getPersonPhone(
          review.customer
        ).toLowerCase();

      const providerName =
        getProviderName(
          review.provider
        ).toLowerCase();

      const providerEmail =
        review.provider?.email?.toLowerCase() ||
        "";

      const providerPhone =
        getPersonPhone(
          review.provider
        ).toLowerCase();

      const serviceName =
        review.service?.title?.toLowerCase() ||
        "";

      const serviceCategory =
        review.service?.category?.toLowerCase() ||
        "";

      const comment =
        review.comment?.toLowerCase() || "";

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
  }, [reviews, searchQuery]);

  /*
   * STATISTICS
   * These remain based on ALL reviews,
   * not just the search results.
   */
  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;

    const total = reviews.reduce(
      (sum, review) =>
        sum + Number(review.rating || 0),
      0
    );

    return total / reviews.length;
  }, [reviews]);

  const fiveStarReviews = useMemo(() => {
    return reviews.filter(
      (review) =>
        Number(review.rating) === 5
    ).length;
  }, [reviews]);

  const lowRatedReviews = useMemo(() => {
    return reviews.filter(
      (review) =>
        Number(review.rating) <= 2
    ).length;
  }, [reviews]);

  const hiddenReviews = useMemo(() => {
    return reviews.filter((review) =>
      isReviewHidden(review)
    ).length;
  }, [reviews]);

  return (
    <DashboardLayout
      role="admin"
      navItems={adminNavItems}
    >
      <DashboardHeader
        title="Review Management"
        subtitle="View and moderate customer reviews"
      />

      <div className="space-y-6">
        {/* =========================================
            PAGE HEADER + SEARCH
        ========================================== */}
        <div className="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900 sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                  <MessageSquare className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-ink-900 dark:text-white">
                    Customer Reviews
                  </h2>

                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                    See what customers are saying
                    about providers and their
                    services.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
              {/* SEARCH */}
              <div className="relative w-full sm:min-w-[300px] xl:w-[360px]">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value
                    )
                  }
                  placeholder="Search reviews..."
                  className="h-11 search-input"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearchQuery("")
                    }
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* REFRESH */}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={
                  loading || refreshing
                }
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-700 transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800 sm:w-auto"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}

                Refresh
              </button>
            </div>
          </div>

          {/* SEARCH RESULT COUNT */}
          {!loading && (
            <div className="mt-5 flex flex-col gap-2 border-t border-ink-100 pt-4 dark:border-ink-800 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-ink-500 dark:text-ink-400">
                {searchQuery ? (
                  <>
                    Showing{" "}
                    <span className="font-semibold text-ink-700 dark:text-ink-200">
                      {filteredReviews.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-ink-700 dark:text-ink-200">
                      {reviews.length}
                    </span>{" "}
                    reviews
                  </>
                ) : (
                  <>
                    {reviews.length}{" "}
                    {reviews.length === 1
                      ? "review"
                      : "reviews"}{" "}
                    available
                  </>
                )}
              </p>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchQuery("")
                  }
                  className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-primary-600 transition hover:text-primary-700 dark:text-primary-400"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>

        {/* =========================================
            STATISTICS
        ========================================== */}
        {!loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* TOTAL */}
            <div className="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-ink-500 dark:text-ink-400">
                    Total Reviews
                  </p>

                  <p className="mt-2 text-2xl font-bold text-ink-900 dark:text-white">
                    {reviews.length}
                  </p>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                  <MessageSquare className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* AVERAGE */}
            <div className="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-ink-500 dark:text-ink-400">
                    Average Rating
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-2xl font-bold text-ink-900 dark:text-white">
                      {averageRating.toFixed(
                        1
                      )}
                    </p>

                    <Star className="h-5 w-5 fill-current text-amber-400" />
                  </div>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-500/10">
                  <Star className="h-5 w-5 fill-current" />
                </div>
              </div>
            </div>

            {/* FIVE STAR */}
            <div className="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-ink-500 dark:text-ink-400">
                    5-Star Reviews
                  </p>

                  <p className="mt-2 text-2xl font-bold text-ink-900 dark:text-white">
                    {fiveStarReviews}
                  </p>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <Star className="h-5 w-5 fill-current" />
                </div>
              </div>
            </div>

            {/* LOW RATED / HIDDEN */}
            <div className="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-ink-500 dark:text-ink-400">
                    {hiddenReviews > 0
                      ? "Hidden Reviews"
                      : "Low Rated"}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-ink-900 dark:text-white">
                    {hiddenReviews > 0
                      ? hiddenReviews
                      : lowRatedReviews}
                  </p>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  {hiddenReviews > 0 ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Ban className="h-5 w-5" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            ERROR
        ========================================== */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Unable to load reviews
                </p>

                <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-500/20 dark:bg-ink-900 dark:text-red-400 dark:hover:bg-red-500/10 sm:w-auto"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* =========================================
            LOADING
        ========================================== */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900 sm:p-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 shrink-0 rounded-full bg-ink-100 dark:bg-ink-800" />

                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-36 rounded bg-ink-100 dark:bg-ink-800" />

                      <div className="h-3 w-48 rounded bg-ink-100 dark:bg-ink-800" />
                    </div>

                    <div className="h-5 w-20 rounded bg-ink-100 dark:bg-ink-800" />
                  </div>

                  <div className="mt-5 h-16 rounded-xl bg-ink-100 dark:bg-ink-800" />

                  <div className="mt-4 h-8 w-28 rounded bg-ink-100 dark:bg-ink-800" />
                </div>
              )
            )}
          </div>
        ) : reviews.length === 0 ? (
          /* =========================================
             NO REVIEWS
          ========================================== */
          <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-12 dark:border-ink-700 dark:bg-ink-900">
            <div className="flex max-w-md flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-50 text-ink-400 dark:bg-ink-800 dark:text-ink-500">
                <MessageSquare className="h-7 w-7" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-ink-900 dark:text-white">
                No reviews yet
              </h3>

              <p className="mt-2 text-sm leading-6 text-ink-500 dark:text-ink-400">
                Customer reviews will appear
                here after customers complete
                bookings and submit their
                feedback.
              </p>
            </div>
          </div>
        ) : filteredReviews.length === 0 ? (
          /* =========================================
             NO SEARCH RESULTS
          ========================================== */
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-12 dark:border-ink-700 dark:bg-ink-900">
            <div className="flex max-w-md flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-50 text-ink-400 dark:bg-ink-800 dark:text-ink-500">
                <Search className="h-6 w-6" />
              </div>

              <h3 className="mt-4 text-base font-bold text-ink-900 dark:text-white">
                No matching reviews
              </h3>

              <p className="mt-2 text-sm leading-6 text-ink-500 dark:text-ink-400">
                We couldn't find any reviews
                matching{" "}
                <span className="font-semibold text-ink-700 dark:text-ink-200">
                  "{searchQuery}"
                </span>
                .
              </p>

              <button
                type="button"
                onClick={() =>
                  setSearchQuery("")
                }
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
              >
                <X className="h-4 w-4" />
                Clear Search
              </button>
            </div>
          </div>
        ) : (
          /* =========================================
             REVIEWS LIST
          ========================================== */
          <div className="space-y-4">
            {filteredReviews.map((review) => {
              const customerName =
                getCustomerName(
                  review.customer
                );

              const providerName =
                getProviderName(
                  review.provider
                );

              const customerImage =
                getImage(review.customer);

              const customerPhone =
                getPersonPhone(review.customer);

              const providerPhone =
                getPersonPhone(review.provider);

              const hidden = isReviewHidden(review);
              const isToggling = togglingIds.has(
                review._id
              );

              return (
                <motion.div
                  key={review._id}
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                  className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md dark:bg-ink-900 sm:p-6 ${
                    hidden
                      ? "border-red-200 bg-red-50/40 dark:border-red-500/30 dark:bg-red-500/5"
                      : "border-ink-100 bg-white dark:border-ink-800"
                  }`}
                >
                  {/* TOP */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      {customerImage ? (
                        <img
                          src={customerImage}
                          alt={customerName}
                          className="h-11 w-11 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">
                          {getInitial(
                            customerName
                          )}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">
                            {customerName}
                          </p>

                          {hidden && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700 dark:bg-red-500/20 dark:text-red-300">
                              <EyeOff className="h-3 w-3" />
                              Hidden
                            </span>
                          )}
                        </div>

                        {review.customer
                          ?.email && (
                          <p className="mt-0.5 truncate text-xs text-ink-400 dark:text-ink-500">
                            {review.customer.email}
                          </p>
                        )}

                        {customerPhone && (
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-400 dark:text-ink-500">
                            <Phone className="h-3 w-3 shrink-0" />
                            {customerPhone}
                          </p>
                        )}

                        <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
                          {formatDate(
                            review.createdAt
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StarRating
                        rating={Number(
                          review.rating || 0
                        )}
                      />

                      <span className="text-xs font-semibold text-ink-500 dark:text-ink-400">
                        {review.rating}/5
                      </span>
                    </div>
                  </div>

                  {/* PROVIDER + SERVICE */}
                  <div className="mt-4 rounded-xl bg-ink-50 p-3.5 dark:bg-ink-800/60">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <span className="text-ink-400">
                        Customer reviewed:
                      </span>

                      <span className="font-semibold text-ink-800 dark:text-ink-100">
                        {providerName}
                      </span>

                      {review.service
                        ?.title && (
                        <>
                          <span className="text-ink-300 dark:text-ink-600">
                            •
                          </span>

                          <span className="text-ink-600 dark:text-ink-300">
                            {review.service.title}
                          </span>
                        </>
                      )}
                    </div>

                    {review.service
                      ?.category && (
                      <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">
                        {review.service.category}
                      </p>
                    )}

                    {providerPhone && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
                        <Phone className="h-3 w-3 shrink-0" />
                        Provider phone:{" "}
                        <span className="font-semibold text-ink-700 dark:text-ink-200">
                          {providerPhone}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* COMMENT */}
                  <div className="mt-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400 dark:text-ink-500">
                      Customer Review
                    </p>

                    {review.comment ? (
                      <p className="text-sm leading-6 text-ink-600 dark:text-ink-300">
                        "{review.comment}"
                      </p>
                    ) : (
                      <p className="text-sm italic text-ink-400 dark:text-ink-500">
                        No written comment was
                        provided.
                      </p>
                    )}
                  </div>

                  {/* ACTIONS */}
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-ink-100 pt-4 dark:border-ink-800">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedReview(
                          review
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-xs font-semibold text-ink-700 transition hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleToggleHide(review)
                      }
                      disabled={isToggling}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        hidden
                          ? "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/20 dark:bg-ink-900 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                          : "border-red-200 bg-white text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:bg-ink-900 dark:text-red-400 dark:hover:bg-red-500/10"
                      }`}
                    >
                      {isToggling ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : hidden ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <Ban className="h-3.5 w-3.5" />
                      )}

                      {isToggling
                        ? hidden
                          ? "Unhiding..."
                          : "Hiding..."
                        : hidden
                        ? "Unhide"
                        : "Hide"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================
          REVIEW DETAILS MODAL
      ========================================== */}
      <AnimatePresence>
        {selectedReview && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() =>
              setSelectedReview(null)
            }
          >
            <motion.div
              className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-ink-900"
              initial={{
                opacity: 0,
                y: 30,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 20,
                scale: 0.96,
              }}
              transition={{
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              {/* MODAL HEADER */}
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-ink-100 bg-white px-5 py-5 dark:border-ink-800 dark:bg-ink-900 sm:px-6">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-ink-900 dark:text-white">
                    Review Details
                  </h3>

                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                    Customer feedback and service
                    information
                  </p>
                </div>

                <motion.button
                  type="button"
                  onClick={() =>
                    setSelectedReview(null)
                  }
                  whileHover={{
                    scale: 1.08,
                  }}
                  whileTap={{
                    scale: 0.92,
                  }}
                  aria-label="Close review"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>

              <div className="space-y-6 p-5 sm:p-6">
                {/* CUSTOMER */}
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.08,
                    duration: 0.25,
                  }}
                >
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400 dark:text-ink-500">
                    Customer
                  </p>

                  <div className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-ink-50 p-4 dark:border-ink-800 dark:bg-ink-800/50">
                    {getImage(
                      selectedReview.customer
                    ) ? (
                      <img
                        src={getImage(
                          selectedReview.customer
                        )}
                        alt={getCustomerName(
                          selectedReview.customer
                        )}
                        className="h-12 w-12 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">
                        {getInitial(
                          getCustomerName(
                            selectedReview.customer
                          )
                        )}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink-900 dark:text-white">
                        {getCustomerName(
                          selectedReview.customer
                        )}
                      </p>

                      {selectedReview
                        .customer?.email && (
                        <p className="mt-0.5 truncate text-sm text-ink-500 dark:text-ink-400">
                          {
                            selectedReview
                              .customer.email
                          }
                        </p>
                      )}

                      {getPersonPhone(
                        selectedReview.customer
                      ) && (
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-500 dark:text-ink-400">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          {getPersonPhone(
                            selectedReview.customer
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* PROVIDER */}
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.14,
                    duration: 0.25,
                  }}
                >
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400 dark:text-ink-500">
                    Provider
                  </p>

                  <div className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-sm dark:border-ink-800 dark:bg-ink-900">
                    {getImage(
                      selectedReview.provider
                    ) ? (
                      <img
                        src={getImage(
                          selectedReview.provider
                        )}
                        alt={getProviderName(
                          selectedReview.provider
                        )}
                        className="h-14 w-14 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">
                        {getInitial(
                          getProviderName(
                            selectedReview.provider
                          )
                        )}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink-900 dark:text-white">
                        {getProviderName(
                          selectedReview.provider
                        )}
                      </p>

                      {selectedReview
                        .provider?.email && (
                        <p className="mt-0.5 truncate text-sm text-ink-500 dark:text-ink-400">
                          {
                            selectedReview
                              .provider.email
                          }
                        </p>
                      )}

                      {getPersonPhone(
                        selectedReview.provider
                      ) && (
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-500 dark:text-ink-400">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          {getPersonPhone(
                            selectedReview.provider
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* SERVICE */}
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.2,
                    duration: 0.25,
                  }}
                >
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400 dark:text-ink-500">
                    Service Reviewed
                  </p>

                  <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm dark:border-ink-800 dark:bg-ink-900">
                    {selectedReview.service
                      ?.image ? (
                      <div className="relative h-48 w-full overflow-hidden bg-ink-100 dark:bg-ink-800 sm:h-60">
                        <motion.img
                          src={
                            selectedReview
                              .service.image
                          }
                          alt={
                            selectedReview.service
                              .title ||
                            "Service"
                          }
                          initial={{
                            scale: 1.05,
                          }}
                          animate={{
                            scale: 1,
                          }}
                          transition={{
                            duration: 0.5,
                            ease: "easeOut",
                          }}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-40 items-center justify-center bg-ink-100 text-sm text-ink-400 dark:bg-ink-800">
                        No service image
                        available
                      </div>
                    )}

                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h4 className="text-base font-bold text-ink-900 dark:text-white">
                            {selectedReview
                              .service
                              ?.title ||
                              "Service"}
                          </h4>

                          {selectedReview
                            .service
                            ?.category && (
                            <span className="mt-2 inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">
                              {
                                selectedReview
                                  .service
                                  .category
                              }
                            </span>
                          )}
                        </div>

                        {typeof selectedReview
                          .service
                          ?.price ===
                          "number" && (
                          <p className="shrink-0 text-base font-bold text-primary-600 dark:text-primary-400">
                            ₦
                            {selectedReview.service.price.toLocaleString(
                              "en-NG"
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* RATING */}
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.26,
                    duration: 0.25,
                  }}
                >
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400 dark:text-ink-500">
                    Rating
                  </p>

                  <div className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-ink-50 p-4 dark:border-ink-800 dark:bg-ink-800/50">
                    <StarRating
                      rating={Number(
                        selectedReview.rating ||
                          0
                      )}
                    />

                    <span className="font-semibold text-ink-700 dark:text-ink-200">
                      {selectedReview.rating}/5
                    </span>
                  </div>
                </motion.div>

                {/* COMMENT */}
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.32,
                    duration: 0.25,
                  }}
                >
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400 dark:text-ink-500">
                    Customer Review
                  </p>

                  <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4 dark:border-ink-800 dark:bg-ink-800/50 sm:p-5">
                    <p className="text-sm leading-7 text-ink-700 dark:text-ink-200">
                      {selectedReview.comment ||
                        "No written comment was provided."}
                    </p>
                  </div>
                </motion.div>

                {/* DATE */}
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.38,
                    duration: 0.25,
                  }}
                  className="border-t border-ink-100 pt-5 dark:border-ink-800"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-400 dark:text-ink-500">
                      Review Date
                    </p>

                    <p className="text-sm font-medium text-ink-700 dark:text-ink-200">
                      {formatDate(
                        selectedReview.createdAt
                      )}
                    </p>
                  </div>
                </motion.div>

                {/* MODAL ACTIONS */}
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.44,
                    duration: 0.25,
                  }}
                  className="border-t border-ink-100 pt-5 dark:border-ink-800"
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleHide(
                        selectedReview
                      )
                    }
                    disabled={togglingIds.has(
                      selectedReview._id
                    )}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${
                      isReviewHidden(
                        selectedReview
                      )
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                        : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                    }`}
                  >
                    {togglingIds.has(
                      selectedReview._id
                    ) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isReviewHidden(
                        selectedReview
                      ) ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <Ban className="h-4 w-4" />
                    )}

                    {togglingIds.has(
                      selectedReview._id
                    )
                      ? isReviewHidden(
                          selectedReview
                        )
                        ? "Unhiding..."
                        : "Hiding..."
                      : isReviewHidden(
                          selectedReview
                        )
                      ? "Unhide this review"
                      : "Hide this review"}
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================
          TOAST
      ========================================== */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{
              opacity: 0,
              y: 40,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 20,
              scale: 0.95,
            }}
            transition={{
              duration: 0.25,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2"
          >
            <div
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-md ${
                toast.type === "success"
                  ? "border-emerald-200 bg-emerald-50/95 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200"
                  : "border-red-200 bg-red-50/95 text-red-800 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-200"
              }`}
            >
              {toast.type === "success" ? (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 5.29a1 1 0 010 1.415l-7.5 7.5a1 1 0 01-1.415 0l-3.5-3.5a1 1 0 111.415-1.415l2.792 2.793 6.793-6.793a1 1 0 011.415 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              ) : (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
                  <X className="h-3.5 w-3.5" />
                </div>
              )}

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