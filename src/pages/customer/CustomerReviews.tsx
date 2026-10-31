import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  LogIn,
  MessageSquareQuote,
  Pencil,
  Star,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import {
  DashboardLayout,
  DashboardHeader,
} from "@/components/DashboardLayout";
import { customerNavItems } from "@/data/customerNavItems";
import { useAuth } from "@/context/AppContext";
import { StarRating } from "@/components/shared";
import {
  Avatar,
  Button,
  EmptyState,
  ErrorState,
  ResponsiveModal,
  Skeleton,
} from "@/components/ui";
import {
  useDeleteReview,
  useMyReviews,
  useUpdateReview,
} from "@/hooks/queries";
import { getApiErrorMessage, hasUserToken } from "@/lib/api";

type Review = {
  _id: string;
  rating: number;
  comment?: string;
  createdAt: string;

  provider?: {
    _id?: string;
    name?: string;
    fullName?: string;
    avatar?: string;
    profileImage?: string;
  };

  service?: {
    title?: string;
    category?: string;
    image?: string;
  };

  booking?: {
    date?: string;
    time?: string;
    status?: string;
  };
};

const STAR_VALUES = [1, 2, 3, 4, 5] as const;
const BREAKDOWN_VALUES = [5, 4, 3, 2, 1] as const;

function getProviderName(
  provider?: Review["provider"]
) {
  return (
    provider?.name ||
    provider?.fullName ||
    "Provider"
  );
}

function getProviderImage(
  provider?: Review["provider"]
) {
  return (
    provider?.avatar ||
    provider?.profileImage ||
    ""
  );
}

function formatDate(date?: string) {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CustomerReviews() {
  const { user } = useAuth();
  const hasSession = hasUserToken();

  const reviewsQuery = useMyReviews({
    enabled: hasSession,
  });
  const updateReview = useUpdateReview();
  const deleteReview = useDeleteReview();

  const reviews =
    (reviewsQuery.data ?? []) as unknown as Review[];

  const reviewCount = reviews.length;

  const averageRating =
    reviewCount > 0
      ? reviews.reduce(
        (total, review) =>
          total + (Number(review.rating) || 0),
        0
      ) / reviewCount
      : 0;

  const ratingBreakdown = BREAKDOWN_VALUES.map(
    (stars) => ({
      stars,
      count: reviews.filter(
        (review) =>
          Math.round(
            Number(review.rating) || 0
          ) === stars
      ).length,
    })
  );

  // Delete state
  const [deleteId, setDeleteId] =
    useState<string | null>(null);
  const [deleteError, setDeleteError] =
    useState("");

  // Edit state
  const [editingReview, setEditingReview] =
    useState<Review | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] =
    useState("");
  const [editError, setEditError] =
    useState("");

  // Success message
  const [successMessage, setSuccessMessage] =
    useState("");

  /*
   * Keeps the last opened review so the modal body
   * doesn't blank out while its exit animation runs.
   */
  const lastEditedReview = useRef<Review | null>(null);
  const successTimer = useRef<number | null>(null);

  if (editingReview) {
    lastEditedReview.current = editingReview;
  }

  const editReview =
    editingReview ?? lastEditedReview.current;

  const reviewToDelete =
    reviews.find(
      (review) => review._id === deleteId
    ) ?? null;

  const deleteRating = reviewToDelete
    ? Number(reviewToDelete.rating) || 0
    : 0;

  const listError = reviewsQuery.isError
    ? getApiErrorMessage(reviewsQuery.error)
    : "";

  const showSuccess = (message: string) => {
    if (successTimer.current !== null) {
      window.clearTimeout(successTimer.current);
    }

    setSuccessMessage(message);

    successTimer.current = window.setTimeout(() => {
      setSuccessMessage("");
      successTimer.current = null;
    }, 3500);
  };

  const resetEditState = () => {
    setEditingReview(null);
    setEditRating(0);
    setEditComment("");
    setEditError("");
  };

  const handleEditClick = (review: Review) => {
    updateReview.reset();
    setEditingReview(review);
    setEditRating(Number(review.rating) || 0);
    setEditComment(review.comment || "");
    setEditError("");
  };

  const closeEditModal = () => {
    if (updateReview.isPending) return;

    resetEditState();
  };

  const handleUpdateReview = async () => {
    if (!editingReview) return;

    if (editRating < 1 || editRating > 5) {
      setEditError(
        "Please select a rating between 1 and 5."
      );
      return;
    }

    if (!hasUserToken()) {
      setEditError(
        "Your session has expired. Please log in again."
      );
      return;
    }

    setEditError("");

    try {
      await updateReview.mutateAsync({
        id: editingReview._id,
        payload: {
          rating: editRating,
          comment: editComment.trim(),
        },
      });

      resetEditState();

      showSuccess(
        "Your review has been updated successfully."
      );
    } catch (error) {
      setEditError(
        getApiErrorMessage(error) ||
        "Unable to update review."
      );
    }
  };

  const closeDeleteModal = () => {
    if (deleteReview.isPending) return;

    setDeleteId(null);
    setDeleteError("");
  };

  const handleDeleteReview = async () => {
    if (!deleteId) return;

    if (!hasUserToken()) {
      setDeleteError(
        "Your session has expired. Please log in again."
      );
      return;
    }

    setDeleteError("");

    try {
      await deleteReview.mutateAsync(deleteId);

      setDeleteId(null);
      setDeleteError("");

      showSuccess(
        "Your review has been deleted successfully."
      );
    } catch (error) {
      setDeleteError(
        getApiErrorMessage(error) ||
        "Unable to delete review."
      );
    }
  };

  return (
    <DashboardLayout
      role="customer"
      navItems={customerNavItems}
    >
      <DashboardHeader
        title="My Reviews"
        subtitle="Reviews you've left for providers"
        action={
          !reviewsQuery.isLoading &&
            !reviewsQuery.isError &&
            reviewCount > 0 ? (
            <span className="badge bg-lavender text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              <MessageSquareQuote className="h-3 w-3" />
              {reviewCount}{" "}
              {reviewCount === 1
                ? "review"
                : "reviews"}
            </span>
          ) : undefined
        }
      />

      <div className="space-y-5">
        {/* ==================================================
            SUCCESS NOTIFICATION
        ================================================== */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{
                opacity: 0,
                y: -16,
                scale: 0.97,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: -16,
                scale: 0.97,
              }}
              transition={{ duration: 0.25 }}
              role="status"
              className="flex items-center gap-3 rounded-2xl border border-success-100 bg-success-50 p-4 text-sm font-medium text-success-700 shadow-card dark:border-success-600/30 dark:bg-success-600/10 dark:text-success-200"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" />

              <span className="flex-1">
                {successMessage}
              </span>

              <button
                type="button"
                onClick={() => setSuccessMessage("")}
                aria-label="Dismiss notification"
                className="rounded-lg p-1.5 text-success-700/70 transition-colors hover:bg-success-100 hover:text-success-800 dark:text-success-200/80 dark:hover:bg-success-600/20 dark:hover:text-success-100"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==================================================
            AUTH REQUIRED
        ================================================== */}
        {!hasSession ? (
          <EmptyState
            icon={LogIn}
            title="Sign in to view your reviews"
            description="Your reviews are linked to your Servicely account. Sign in to manage them."
            action={
              <Link
                to="/login"
                className="btn-primary"
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </Link>
            }
          />
        ) : reviewsQuery.isLoading ? (
          /* ==================================================
             LOADING
          ================================================== */
          <ReviewsSkeleton />
        ) : reviewsQuery.isError ? (
          /* ==================================================
             ERROR
          ================================================== */
          <ErrorState
            message={
              listError ||
              "Unable to load your reviews."
            }
            onRetry={() => {
              void reviewsQuery.refetch();
            }}
          />
        ) : reviewCount === 0 ? (
          /* ==================================================
             EMPTY STATE
          ================================================== */
          <EmptyState
            icon={MessageSquareQuote}
            title="You haven't reviewed any services yet"
            description="Complete a booking and share your experience with the provider. Your reviews will appear here."
            action={
              <Link
                to="/customer/browse"
                className="btn-primary"
              >
                Browse Services
              </Link>
            }
          />
        ) : (
          <>
            {/* ==================================================
                RATING SUMMARY
            ================================================== */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              aria-label="Rating summary"
              className="card overflow-hidden p-5 sm:p-6"
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4 sm:w-48 sm:flex-col sm:items-start sm:border-r sm:border-slate-100 sm:pr-6 sm:dark:border-ink-800">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-ink-50">
                      {averageRating.toFixed(1)}
                    </span>

                    <span className="text-sm font-medium text-slate-400 dark:text-ink-500">
                      / 5
                    </span>
                  </div>

                  <div>
                    <StarRating
                      rating={averageRating}
                      size={18}
                    />

                    <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-ink-400">
                      Based on {reviewCount}{" "}
                      {reviewCount === 1
                        ? "review"
                        : "reviews"}
                    </p>
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  {ratingBreakdown.map(
                    ({ stars, count }) => {
                      const percent =
                        reviewCount > 0
                          ? Math.round(
                            (count / reviewCount) *
                            100
                          )
                          : 0;

                      return (
                        <div
                          key={stars}
                          className="flex items-center gap-3"
                        >
                          <span className="flex w-9 shrink-0 items-center gap-1 text-xs font-medium text-slate-500 dark:text-ink-400">
                            {stars}
                            <Star className="h-3 w-3 fill-warning-500 text-warning-500" />
                          </span>

                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-ink-800">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${percent}%`,
                              }}
                              transition={{
                                duration: 0.6,
                                ease: "easeOut",
                              }}
                              className="h-full rounded-full bg-warning-500"
                            />
                          </div>

                          <span className="w-6 shrink-0 text-right text-xs tabular-nums text-slate-400 dark:text-ink-500">
                            {count}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </motion.section>

            {/* ==================================================
                REVIEWS
            ================================================== */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.06,
                  },
                },
              }}
              className="grid gap-4 md:grid-cols-2"
            >
              {reviews.map((review) => {
                const providerName =
                  getProviderName(review.provider);

                const providerImage =
                  getProviderImage(review.provider);

                const providerId =
                  review.provider?._id;

                const reviewRating =
                  Number(review.rating) || 0;

                return (
                  <motion.article
                    key={review._id}
                    variants={{
                      hidden: {
                        opacity: 0,
                        y: 16,
                      },
                      visible: {
                        opacity: 1,
                        y: 0,
                      },
                    }}
                    transition={{ duration: 0.3 }}
                    className="card flex h-full flex-col p-5 transition-shadow hover:shadow-card-hover"
                  >
                    <div className="flex-1">
                      {/* Header: provider + actions */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-3">
                          {providerImage ? (
                            <img
                              src={providerImage}
                              alt={providerName}
                              loading="lazy"
                              className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-slate-100 dark:ring-ink-800"
                            />
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lavender text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                              <UserRound className="h-5 w-5" />
                            </div>
                          )}

                          <div className="min-w-0">
                            {providerId ? (
                              <Link
                                to={`/providers/${providerId}`}
                                className="group/link inline-flex max-w-full items-center gap-1 text-sm font-semibold text-slate-900 transition-colors hover:text-brand-700 dark:text-ink-50 dark:hover:text-brand-300"
                              >
                                <span className="truncate">
                                  {providerName}
                                </span>

                                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover/link:opacity-100" />
                              </Link>
                            ) : (
                              <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
                                {providerName}
                              </h3>
                            )}

                            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-ink-400">
                              {review.service?.title
                                ? review.service.title
                                : "Service review"}
                              {review.service?.category
                                ? ` · ${review.service.category}`
                                : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleEditClick(review)
                            }
                            aria-label={`Edit your review for ${providerName}`}
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-600 transition-colors hover:bg-lavender hover:text-brand-700 dark:text-brand-400 dark:hover:bg-brand-950/60 dark:hover:text-brand-300 sm:h-8 sm:w-auto sm:gap-1.5 sm:px-2.5"
                          >
                            <Pencil className="h-4 w-4 sm:h-3.5 sm:w-3.5" />

                            <span className="hidden text-xs font-semibold sm:inline">
                              Edit
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              deleteReview.reset();
                              setDeleteId(review._id);
                              setDeleteError("");
                            }}
                            aria-label={`Delete your review for ${providerName}`}
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-danger-600 transition-colors hover:bg-danger-50 hover:text-danger-700 dark:text-danger-400 dark:hover:bg-danger-500/10 dark:hover:text-danger-200 sm:h-8 sm:w-auto sm:gap-1.5 sm:px-2.5"
                          >
                            <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />

                            <span className="hidden text-xs font-semibold sm:inline">
                              Delete
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Rating + date */}
                      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                        <StarRating
                          rating={reviewRating}
                          size={16}
                        />

                        <span className="text-xs font-semibold text-slate-700 dark:text-ink-200">
                          {reviewRating}/5
                        </span>

                        <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-ink-600" />

                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-ink-500">
                          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                          {formatDate(review.createdAt)}
                        </span>
                      </div>

                      {/* Comment */}
                      {review.comment ? (
                        <blockquote className="relative mt-4 overflow-hidden rounded-2xl bg-slate-50 py-3.5 pl-5 pr-4 dark:bg-ink-800/60">
                          <span className="absolute left-0 top-0 h-full w-1 bg-brand-500" />

                          <div className="flex gap-3">
                            <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-brand-500 dark:text-brand-400" />

                            <p className="text-sm leading-6 text-slate-600 dark:text-ink-300">
                              {review.comment}
                            </p>
                          </div>
                        </blockquote>
                      ) : (
                        <p className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-xs italic text-slate-400 dark:border-ink-800 dark:text-ink-500">
                          No written comment was added.
                        </p>
                      )}
                    </div>

                    {/* Footer: booking context + reviewer identity */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-slate-100 pt-3.5 dark:border-ink-800">
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar
                          src={user?.avatar}
                          name={user?.name}
                          size="xs"
                        />

                        <span className="truncate text-xs font-medium text-slate-600 dark:text-ink-300">
                          {user?.name}
                        </span>

                        <span className="badge shrink-0 bg-lavender px-2 py-0.5 text-[10px] text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                          Your review
                        </span>
                      </div>

                      {review.booking?.date && (
                        <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-ink-500">
                          <CalendarDays className="h-3.5 w-3.5 shrink-0" />

                          Booking{" "}
                          {formatDate(
                            review.booking.date
                          )}
                          {review.booking.time
                            ? ` · ${review.booking.time}`
                            : ""}
                        </span>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          </>
        )}
      </div>

      {/* =====================================================
          EDIT REVIEW MODAL
      ===================================================== */}
      <ResponsiveModal
        open={Boolean(editingReview)}
        onClose={closeEditModal}
        title="Edit your review"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={closeEditModal}
              disabled={updateReview.isPending}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>

            <Button
              onClick={handleUpdateReview}
              disabled={
                updateReview.isPending ||
                editRating === 0
              }
              loading={updateReview.isPending}
              icon={CheckCircle2}
              className="w-full sm:w-auto"
            >
              {updateReview.isPending
                ? "Saving…"
                : "Save changes"}
            </Button>
          </div>
        }
      >
        {editReview && (
          <div className="space-y-5">
            {/* Provider context */}
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-ink-800/60">
              {getProviderImage(
                editReview.provider
              ) ? (
                <img
                  src={getProviderImage(
                    editReview.provider
                  )}
                  alt={getProviderName(
                    editReview.provider
                  )}
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lavender text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                  <UserRound className="h-5 w-5" />
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
                  {getProviderName(
                    editReview.provider
                  )}
                </p>

                <p className="truncate text-xs text-slate-500 dark:text-ink-400">
                  {editReview.service?.title ||
                    "Service review"}
                  {editReview.service?.category
                    ? ` · ${editReview.service.category}`
                    : ""}
                </p>
              </div>
            </div>

            {/* Rating picker */}
            <div>
              <span
                id="edit-review-rating-label"
                className="label"
              >
                Your rating
              </span>

              <div
                role="radiogroup"
                aria-labelledby="edit-review-rating-label"
                className="mt-2 flex flex-wrap items-center gap-1.5"
              >
                {STAR_VALUES.map((star) => (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={editRating === star}
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                    onClick={() =>
                      setEditRating(star)
                    }
                    className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${editRating >= star
                      ? "bg-warning-50 dark:bg-warning-600/15"
                      : "hover:bg-slate-100 dark:hover:bg-ink-800"
                      }`}
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${editRating >= star
                        ? "text-warning-500"
                        : "text-slate-200 dark:text-ink-700"
                        }`}
                      fill={
                        editRating >= star
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                ))}

                <span className="ml-0.5 text-sm font-semibold text-slate-600 dark:text-ink-300">
                  {editRating > 0
                    ? `${editRating}/5`
                    : "Select a rating"}
                </span>
              </div>
            </div>

            {/* Comment */}
            <div>
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="edit-review-comment"
                  className="label mb-0"
                >
                  Your review
                </label>

                <span className="text-xs tabular-nums text-slate-400 dark:text-ink-500">
                  {editComment.length}/2000
                </span>
              </div>

              <textarea
                id="edit-review-comment"
                value={editComment}
                onChange={(event) =>
                  setEditComment(
                    event.target.value.slice(0, 2000)
                  )
                }
                rows={5}
                placeholder="Tell us about your experience..."
                className="form-textarea mt-1.5"
              />
            </div>

            {/* Error */}
            <AnimatePresence>
              {editError && (
                <motion.div
                  initial={{
                    opacity: 0,
                    height: 0,
                  }}
                  animate={{
                    opacity: 1,
                    height: "auto",
                  }}
                  exit={{
                    opacity: 0,
                    height: 0,
                  }}
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-danger-100 bg-danger-50 p-3 text-sm text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/5 dark:text-danger-200"
                >
                  <span className="flex-1">
                    {editError}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </ResponsiveModal>

      {/* =====================================================
          DELETE CONFIRMATION MODAL
      ===================================================== */}
      <ResponsiveModal
        open={Boolean(deleteId)}
        onClose={closeDeleteModal}
        title="Delete review?"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={closeDeleteModal}
              disabled={deleteReview.isPending}
              className="w-full sm:w-auto"
            >
              Keep review
            </Button>

            <Button
              variant="danger"
              onClick={handleDeleteReview}
              disabled={deleteReview.isPending}
              loading={deleteReview.isPending}
              icon={Trash2}
              className="w-full sm:w-auto"
            >
              {deleteReview.isPending
                ? "Deleting…"
                : "Delete review"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-200">
              <Trash2 className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-ink-50">
                This action can&apos;t be undone
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-ink-400">
                This will permanently remove your
                review. It will also disappear from
                the provider&apos;s profile and affect
                their review rating.
              </p>
            </div>
          </div>

          {reviewToDelete && (
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3 dark:border-ink-800 dark:bg-ink-800/60">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
                {getProviderName(
                  reviewToDelete.provider
                )}
              </p>

              <p className="truncate text-xs text-slate-500 dark:text-ink-400">
                {reviewToDelete.service?.title ||
                  "Service review"}
              </p>

              <div className="mt-2 flex items-center gap-2">
                <StarRating
                  rating={deleteRating}
                  size={14}
                />

                <span className="text-xs font-semibold text-slate-600 dark:text-ink-300">
                  {deleteRating}/5
                </span>
              </div>
            </div>
          )}

          <AnimatePresence>
            {deleteError && (
              <motion.div
                initial={{
                  opacity: 0,
                  height: 0,
                }}
                animate={{
                  opacity: 1,
                  height: "auto",
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                }}
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-danger-100 bg-danger-50 p-3 text-sm text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/5 dark:text-danger-200"
              >
                <span className="flex-1">
                  {deleteError}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ResponsiveModal>
    </DashboardLayout>
  );
}

/* ======================================================
   SKELETON
====================================================== */

function ReviewsSkeleton() {
  return (
    <div
      className="space-y-4"
      aria-hidden="true"
    >
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4 sm:w-48 sm:flex-col sm:items-start sm:border-r sm:border-slate-100 sm:pr-6 sm:dark:border-ink-800">
            <Skeleton className="h-10 w-24 rounded-xl" />

            <div className="space-y-2">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {BREAKDOWN_VALUES.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3"
              >
                <Skeleton className="h-3 w-9 rounded" />
                <Skeleton className="h-2 flex-1 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="card animate-pulse p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Skeleton className="h-11 w-11 rounded-full" />

                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 rounded-lg" />
                  <Skeleton className="h-3 w-24 rounded-lg" />
                </div>
              </div>

              <div className="flex gap-1">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>

            <Skeleton className="mt-4 h-20 w-full rounded-2xl" />

            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3.5 dark:border-ink-800">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-3 w-28 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
