import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  MessageSquareQuote,
  Pencil,
  Star,
  Trash2,
  UserRound,
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

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

export function CustomerReviews() {
  const { user } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Delete state
  const [deleteId, setDeleteId] =
    useState<string | null>(null);
  const [deleting, setDeleting] =
    useState(false);
  const [deleteError, setDeleteError] =
    useState("");

  // Edit state
  const [editingReview, setEditingReview] =
    useState<Review | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] =
    useState("");
  const [updating, setUpdating] =
    useState(false);
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

  if (editingReview) {
    lastEditedReview.current = editingReview;
  }

  const editReview = editingReview ?? lastEditedReview.current;

  /**
   * --------------------------------------------------
   * FETCH MY REVIEWS (shared by initial load + retry)
   * --------------------------------------------------
   */
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        sessionStorage.getItem("servicely_token");

      if (!token) {
        setError(
          "Please log in to view your reviews."
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/reviews/my-reviews`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to load your reviews."
        );
      }

      setReviews(data.reviews || []);
    } catch (error: any) {
      console.error(
        "Customer reviews error:",
        error
      );

      setError(
        error.message ||
        "Unable to load your reviews."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const getProviderName = (
    provider?: Review["provider"]
  ) => {
    return (
      provider?.name ||
      provider?.fullName ||
      "Provider"
    );
  };

  const getProviderImage = (
    provider?: Review["provider"]
  ) => {
    return (
      provider?.avatar ||
      provider?.profileImage ||
      ""
    );
  };

  const formatDate = (date: string) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString(
      "en-NG",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const handleEditClick = (review: Review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment || "");
    setEditError("");
  };

  const closeEditModal = () => {
    if (updating) return;

    setEditingReview(null);
    setEditRating(0);
    setEditComment("");
    setEditError("");
  };

  const handleUpdateReview = async () => {
    if (!editingReview) return;

    if (editRating < 1 || editRating > 5) {
      setEditError(
        "Please select a rating between 1 and 5."
      );
      return;
    }

    try {
      setUpdating(true);
      setEditError("");

      const token =
        sessionStorage.getItem("servicely_token");

      if (!token) {
        setEditError(
          "Your session has expired. Please log in again."
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/reviews/updatereview/${editingReview._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating: editRating,
            comment: editComment.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to update review."
        );
      }

      const updatedReview =
        data.review || {
          ...editingReview,
          rating: editRating,
          comment: editComment.trim(),
        };

      setReviews((previous) =>
        previous.map((review) =>
          review._id === editingReview._id
            ? updatedReview
            : review
        )
      );

      closeEditModal();

      setSuccessMessage(
        "Your review has been updated successfully."
      );

      setTimeout(() => {
        setSuccessMessage("");
      }, 3500);
    } catch (error: any) {
      console.error(
        "Update review error:",
        error
      );

      setEditError(
        error.message ||
        "Unable to update review."
      );
    } finally {
      setUpdating(false);
    }
  };

  const closeDeleteModal = () => {
    if (deleting) return;

    setDeleteId(null);
    setDeleteError("");
  };

  const handleDeleteReview = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);
      setDeleteError("");

      const token =
        sessionStorage.getItem("servicely_token");

      if (!token) {
        setDeleteError(
          "Your session has expired. Please log in again."
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/reviews/deletereview/${deleteId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to delete review."
        );
      }

      setReviews((previous) =>
        previous.filter(
          (review) => review._id !== deleteId
        )
      );

      setDeleteId(null);

      setSuccessMessage(
        "Your review has been deleted successfully."
      );

      setTimeout(() => {
        setSuccessMessage("");
      }, 3500);
    } catch (error: any) {
      console.error(
        "Delete review error:",
        error
      );

      setDeleteError(
        error.message ||
        "Unable to delete review."
      );
    } finally {
      setDeleting(false);
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
          !loading && !error && reviews.length > 0 ? (
            <span className="badge bg-lavender text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              <MessageSquareQuote className="h-3 w-3" />
              {reviews.length}{" "}
              {reviews.length === 1
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
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==================================================
            LOADING
        ================================================== */}
        {loading ? (
          <ReviewsSkeleton />
        ) : error ? (
          /* ==================================================
             ERROR
          ================================================== */
          <ErrorState
            message={error}
            onRetry={fetchReviews}
          />
        ) : reviews.length === 0 ? (
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
          /* ==================================================
             REVIEWS
          ================================================== */
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.07,
                },
              },
            }}
            className="space-y-4"
          >
            {reviews.map((review) => {
              const providerName =
                getProviderName(
                  review.provider
                );

              const providerImage =
                getProviderImage(
                  review.provider
                );

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
                  className="card p-5 transition-shadow hover:shadow-card-hover sm:p-6"
                >
                  {/* Header: provider + actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {providerImage ? (
                        <img
                          src={providerImage}
                          alt={providerName}
                          className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-slate-100 dark:ring-ink-800"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lavender text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                          <UserRound className="h-5 w-5" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
                          {providerName}
                        </h3>

                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-ink-400">
                          {review.service?.title
                            ? review.service.title
                            : "Service review"}
                          {review.service
                            ?.category
                            ? ` · ${review.service.category}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleEditClick(review)
                        }
                        aria-label={`Edit your review for ${providerName}`}
                        className="btn-ghost btn-sm text-brand-600 hover:bg-lavender hover:text-brand-700 dark:text-brand-400 dark:hover:bg-brand-950/60 dark:hover:text-brand-300"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeleteId(review._id);
                          setDeleteError("");
                        }}
                        aria-label={`Delete your review for ${providerName}`}
                        className="btn-ghost btn-sm text-danger-600 hover:bg-danger-50 hover:text-danger-700 dark:text-danger-400 dark:hover:bg-danger-500/10 dark:hover:text-danger-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Rating + date */}
                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <StarRating
                      rating={review.rating}
                      size={16}
                    />

                    <span className="text-xs font-semibold text-slate-700 dark:text-ink-200">
                      {review.rating}/5
                    </span>

                    <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-ink-600" />

                    <span className="text-xs text-slate-400 dark:text-ink-500">
                      {formatDate(
                        review.createdAt
                      )}
                    </span>
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <blockquote className="relative mt-4 overflow-hidden rounded-2xl bg-slate-50 py-3.5 pl-5 pr-4 dark:bg-ink-800/60">
                      <span className="absolute left-0 top-0 h-full w-1 bg-brand-500" />

                      <div className="flex gap-3">
                        <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-brand-500 dark:text-brand-400" />

                        <p className="text-sm leading-6 text-slate-600 dark:text-ink-300">
                          {review.comment}
                        </p>
                      </div>
                    </blockquote>
                  )}

                  {/* Footer: booking context + reviewer identity */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-slate-100 pt-3.5 dark:border-ink-800">
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={user?.avatar}
                        name={user?.name}
                        size="xs"
                      />

                      <span className="text-xs font-medium text-slate-600 dark:text-ink-300">
                        {user?.name}
                      </span>

                      <span className="badge bg-lavender px-2 py-0.5 text-[10px] text-brand-700 dark:bg-brand-950 dark:text-brand-300">
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
              disabled={updating}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>

            <Button
              onClick={handleUpdateReview}
              disabled={updating || editRating === 0}
              loading={updating}
              icon={CheckCircle2}
              className="w-full sm:w-auto"
            >
              {updating
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
                className="mt-2 flex items-center gap-2"
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={editRating === star}
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                    onClick={() =>
                      setEditRating(star)
                    }
                    className="rounded-lg p-1 transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${editRating >= star
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

                <span className="ml-1 text-sm font-semibold text-slate-600 dark:text-ink-300">
                  {editRating > 0
                    ? `${editRating}/5`
                    : "Select a rating"}
                </span>
              </div>
            </div>

            {/* Comment */}
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="edit-review-comment"
                  className="label mb-0"
                >
                  Your review
                </label>

                <span className="text-xs text-slate-400 dark:text-ink-500">
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
              disabled={deleting}
              className="w-full sm:w-auto"
            >
              Keep review
            </Button>

            <Button
              variant="danger"
              onClick={handleDeleteReview}
              disabled={deleting}
              loading={deleting}
              icon={Trash2}
              className="w-full sm:w-auto"
            >
              {deleting
                ? "Deleting…"
                : "Delete review"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-200">
            <Trash2 className="h-5 w-5" />
          </div>

          <p className="text-sm leading-6 text-slate-600 dark:text-ink-300">
            This will permanently remove your
            review. It will also disappear from
            the provider's profile and affect
            their review rating.
          </p>

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
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="card animate-pulse p-5 sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-full" />

              <div className="space-y-2">
                <Skeleton className="h-4 w-32 rounded-lg" />

                <Skeleton className="h-3 w-24 rounded-lg" />
              </div>
            </div>

            <div className="flex gap-2">
              <Skeleton className="h-7 w-16 rounded-lg" />

              <Skeleton className="h-7 w-16 rounded-lg" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Skeleton className="h-4 w-24 rounded" />

            <Skeleton className="h-3 w-10 rounded" />
          </div>

          <Skeleton className="mt-4 h-16 w-full rounded-2xl" />

          <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3.5 dark:border-ink-800">
            <Skeleton className="h-5 w-5 rounded-full" />

            <Skeleton className="h-3 w-28 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
