import { useEffect, useMemo, useState } from "react";

import {
  DashboardLayout,
  DashboardHeader,
} from "@/components/DashboardLayout";

import {
  VerifiedBadge,
  StarRating,
} from "@/components/shared";

import { providerNavItems } from "@/data/providerNavItems";

import { Star, MessageSquare, Loader2, RefreshCw } from "lucide-react";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

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
  _id: string;
  booking?: string;
  provider?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
  customer?: Customer;
  service?: Service;
}

interface ReviewsResponse {
  success: boolean;
  count?: number;
  averageRating?: number;
  reviews?: Review[];
  message?: string;
}

interface Provider {
  _id: string;
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

interface ProviderResponse {
  success: boolean;
  provider?: Provider;
  message?: string;
}

const formatDate = (date?: string) => {
  if (!date) return "Unknown date";

  try {
    return new Date(date).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Unknown date";
  }
};

const getCustomerName = (customer?: Customer) => {
  return (
    customer?.fullName ||
    customer?.name ||
    "Customer"
  );
};

const getInitial = (name: string) => {
  return name.trim().charAt(0).toUpperCase() || "C";
};

const getCustomerImage = (customer?: Customer) => {
  return (
    customer?.avatar ||
    customer?.profileImage ||
    ""
  );
};

export function ProviderReviews() {
  const [provider, setProvider] = useState<Provider | null>(null);

  const [providerLoading, setProviderLoading] =
    useState(true);

  const [reviews, setReviews] = useState<Review[]>([]);

  const [reviewsLoading, setReviewsLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  /**
   * Fetch the logged-in provider's profile
   */
  const fetchProvider = async () => {
    try {
      setProviderLoading(true);
      setError("");

      const token =
        sessionStorage.getItem("servicely_token");

      if (!token) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      /**
       * This endpoint returns the logged-in
       * provider's profile.
       */
      const response = await fetch(
        `${API_URL}/reviews/my-profile`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      const result: ProviderResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to load provider profile."
        );
      }

      if (!result.provider?._id) {
        throw new Error(
          "Provider profile was not found."
        );
      }

      setProvider(result.provider);

      return result.provider;
    } catch (error) {
      console.error(
        "Fetch provider profile error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load provider profile."
      );

      return null;
    } finally {
      setProviderLoading(false);
    }
  };

  /**
   * Fetch reviews belonging to this provider
   */
  const fetchReviews = async (
    providerId: string
  ) => {
    try {
      setReviewsLoading(true);

      const response = await fetch(
        `${API_URL}/reviews/provider/${encodeURIComponent(
          providerId
        )}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      const result: ReviewsResponse =
        await response.json();

      console.log(
        "Provider reviews response:",
        result
      );

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to load reviews."
        );
      }

      setReviews(
        Array.isArray(result.reviews)
          ? result.reviews
          : []
      );
    } catch (error) {
      console.error(
        "Fetch provider reviews error:",
        error
      );

      setReviews([]);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load reviews."
      );
    } finally {
      setReviewsLoading(false);
    }
  };

  /**
   * Load provider first, then load
   * reviews for that provider.
   */
  useEffect(() => {
    let cancelled = false;

    const loadReviews = async () => {
      const loadedProvider =
        await fetchProvider();

      if (
        cancelled ||
        !loadedProvider?._id
      ) {
        return;
      }

      await fetchReviews(
        loadedProvider._id
      );
    };

    loadReviews();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Refresh reviews
   */
  const handleRefresh = async () => {
    if (!provider?._id) return;

    try {
      setRefreshing(true);
      setError("");

      await fetchReviews(provider._id);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Calculate rating from actual reviews.
   */
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;

    const total = reviews.reduce(
      (sum, review) =>
        sum + Number(review.rating || 0),
      0
    );

    return total / reviews.length;
  }, [reviews]);

  const formattedRating =
    averageRating > 0
      ? averageRating.toFixed(1)
      : "0.0";

  const totalReviews = reviews.length;

  const providerName =
    provider?.fullName ||
    provider?.name ||
    "Provider";

  const isVerified =
    provider?.verified === true ||
    provider?.status === "active";

  return (
    <DashboardLayout
      role="provider"
      navItems={providerNavItems}
    >
      <DashboardHeader
        title="Reviews"
        subtitle="What customers are saying about you"
      />

      <div className="space-y-6">
        {/* =========================
            ERROR
        ========================== */}
        {error && (
          <div className="flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                Unable to load reviews
              </p>

              <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                {error}
              </p>
            </div>

            {provider?._id && (
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}

                Try Again
              </button>
            )}
          </div>
        )}

        {/* =========================
            RATING SUMMARY
        ========================== */}
        {providerLoading || reviewsLoading ? (
          <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white p-5 shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 animate-pulse rounded-2xl bg-ink-100 dark:bg-ink-800" />

                <div className="space-y-2">
                  <div className="h-4 w-28 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />

                  <div className="h-3 w-40 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />

                  <div className="h-3 w-24 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
                </div>
              </div>

              <div className="hidden h-16 w-px bg-ink-100 dark:bg-ink-800 sm:block" />

              <div className="flex-1 space-y-2">
                <div className="h-4 w-36 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />

                <div className="h-3 w-full max-w-md animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm dark:border-ink-800 dark:bg-ink-900">
            <div className="p-5 sm:p-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                {/* Rating */}
                <div className="flex items-center gap-4 sm:min-w-[210px]">
                  <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-ink-50 dark:bg-ink-800">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-current text-amber-400" />

                      <span className="text-2xl font-bold text-ink-900 dark:text-white">
                        {formattedRating}
                      </span>
                    </div>

                    <span className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                      Average rating
                    </span>
                  </div>

                  <div>
                    <StarRating
                      rating={averageRating}
                      size={18}
                    />

                    <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
                      {totalReviews}{" "}
                      {totalReviews === 1
                        ? "review"
                        : "reviews"}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="hidden h-16 w-px bg-ink-100 dark:bg-ink-800 sm:block" />

                {/* Provider information */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {isVerified && (
                      <VerifiedBadge />
                    )}

                    <span className="text-sm font-semibold text-ink-900 dark:text-white">
                      {providerName}
                    </span>
                  </div>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-ink-500 dark:text-ink-400">
                    Keep delivering great service
                    to maintain your rating and
                    build trust with more customers.
                  </p>
                </div>

                {/* Refresh */}
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800"
                >
                  {refreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}

                  <span className="hidden sm:inline">
                    Refresh
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================
            REVIEWS
        ========================== */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink-900 dark:text-white">
                Customer Reviews
              </h2>

              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                Feedback from customers who have
                used your services.
              </p>
            </div>

            {!reviewsLoading && (
              <span className="hidden rounded-full bg-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-600 dark:bg-ink-800 dark:text-ink-300 sm:inline-flex">
                {totalReviews}{" "}
                {totalReviews === 1
                  ? "Review"
                  : "Reviews"}
              </span>
            )}
          </div>

          {reviewsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm dark:border-ink-800 dark:bg-ink-900"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-ink-100 dark:bg-ink-800" />

                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="h-4 w-32 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />

                          <div className="h-3 w-24 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
                        </div>
                      </div>

                      <div className="h-5 w-20 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
                    </div>

                    <div className="mt-4 h-16 w-full animate-pulse rounded-xl bg-ink-100 dark:bg-ink-800" />
                  </div>
                )
              )}
            </div>
          ) : totalReviews === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-12 dark:border-ink-700 dark:bg-ink-900">
              <div className="flex max-w-md flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-50 text-ink-400 dark:bg-ink-800 dark:text-ink-500">
                  <MessageSquare className="h-7 w-7" />
                </div>

                <h3 className="mt-5 text-lg font-bold text-ink-900 dark:text-white">
                  No reviews yet
                </h3>

                <p className="mt-2 text-sm leading-6 text-ink-500 dark:text-ink-400">
                  Reviews from customers will
                  appear here after they complete
                  a booking and leave feedback for
                  your service.
                </p>

                <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink-50 px-3 py-1.5 text-xs font-medium text-ink-500 dark:bg-ink-800 dark:text-ink-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-ink-300 dark:bg-ink-600" />

                  Waiting for customer feedback
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const customerName =
                  getCustomerName(
                    review.customer
                  );

                const customerImage =
                  getCustomerImage(
                    review.customer
                  );

                return (
                  <div
                    key={review._id}
                    className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-ink-800 dark:bg-ink-900 sm:p-6"
                  >
                    {/* Review header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        {/* Customer avatar */}
                        {customerImage ? (
                          <img
                            src={customerImage}
                            alt={customerName}
                            className="h-11 w-11 shrink-0 rounded-full object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">
                            {getInitial(
                              customerName
                            )}
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">
                            {customerName}
                          </p>

                          <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
                            {formatDate(
                              review.createdAt
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1.5 dark:bg-amber-500/10">
                        <Star className="h-3.5 w-3.5 fill-current text-amber-400" />

                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                          {Number(
                            review.rating || 0
                          ).toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="mt-4">
                      <StarRating
                        rating={Number(
                          review.rating || 0
                        )}
                        size={16}
                      />
                    </div>

                    {/* Comment */}
                    {review.comment ? (
                      <p className="mt-4 text-sm leading-6 text-ink-600 dark:text-ink-300">
                        {review.comment}
                      </p>
                    ) : (
                      <p className="mt-4 text-sm italic text-ink-400 dark:text-ink-500">
                        No written comment was
                        provided.
                      </p>
                    )}

                    {/* Service */}
                    {review.service?.title && (
                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-4 dark:border-ink-800">
                        <span className="text-xs text-ink-400 dark:text-ink-500">
                          Service:
                        </span>

                        <span className="rounded-full bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                          {review.service.title}
                        </span>

                        {review.service.category && (
                          <span className="rounded-full bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-500 dark:bg-ink-800 dark:text-ink-400">
                            {review.service.category}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}