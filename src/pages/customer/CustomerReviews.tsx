import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DashboardLayout,
  DashboardHeader,
} from "@/components/DashboardLayout";
import { customerNavItems } from "@/data/customerNavItems";
import {
  Star,
  UserRound,
  Trash2,
  X,
  Pencil,
  MessageSquareQuote,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

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

  useEffect(() => {
    const fetchReviews = async () => {
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
    };

    fetchReviews();
  }, []);

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

  /*
   * Loading state
   */
  if (loading) {
    return (
      <DashboardLayout
        role="customer"
        navItems={customerNavItems}
      >
        <DashboardHeader
          title="My Reviews"
          subtitle="Reviews you've left for providers"
        />

        <div className="space-y-4">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-3xl border border-ink-100 bg-white p-5 shadow-sm dark:border-ink-800 dark:bg-ink-900"
            >
              <div className="flex gap-3">
                <div className="h-12 w-12 rounded-full bg-ink-100 dark:bg-ink-800" />

                <div className="flex-1">
                  <div className="h-4 w-32 rounded bg-ink-100 dark:bg-ink-800" />
                  <div className="mt-2 h-3 w-24 rounded bg-ink-100 dark:bg-ink-800" />
                  <div className="mt-3 h-4 w-28 rounded bg-ink-100 dark:bg-ink-800" />
                </div>
              </div>

              <div className="mt-5 h-20 rounded-2xl bg-ink-100 dark:bg-ink-800" />
            </div>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="customer"
      navItems={customerNavItems}
    >
      <DashboardHeader
        title="My Reviews"
        subtitle="Reviews you've left for providers"
      />

      <div className="relative">
        {/* Success notification */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{
                opacity: 0,
                y: -20,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: -20,
                scale: 0.96,
              }}
              transition={{
                duration: 0.25,
              }}
              className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {error ? (
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        ) : reviews.length === 0 ? (
          /*
           * Empty state
           */
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.4,
            }}
            className="rounded-3xl border border-ink-100 bg-white px-5 py-20 text-center shadow-sm dark:border-ink-800 dark:bg-ink-900"
          >
            <motion.div
              initial={{
                scale: 0.7,
                rotate: -10,
              }}
              animate={{
                scale: 1,
                rotate: 0,
              }}
              transition={{
                type: "spring",
                stiffness: 180,
                damping: 14,
              }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400"
            >
              <MessageSquareQuote className="h-8 w-8" />
            </motion.div>

            <h3 className="mt-5 text-xl font-bold text-ink-900 dark:text-white">
              No reviews yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-500 dark:text-ink-400">
              Complete a booking and share your
              experience with the provider. Your
              reviews will appear here.
            </p>
          </motion.div>
        ) : (
          /*
           * Reviews
           */
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.08,
                },
              },
            }}
            className="space-y-4"
          >
            {reviews.map((review) => {
              const providerName =
                getProviderName(review.provider);

              const providerImage =
                getProviderImage(review.provider);

              return (
                <motion.div
                  key={review._id}
                  variants={{
                    hidden: {
                      opacity: 0,
                      y: 20,
                    },
                    visible: {
                      opacity: 1,
                      y: 0,
                    },
                  }}
                  whileHover={{
                    y: -2,
                  }}
                  transition={{
                    duration: 0.25,
                  }}
                  className="group overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm transition-shadow hover:shadow-lg dark:border-ink-800 dark:bg-ink-900"
                >
                  <div className="p-4 sm:p-6">
                    {/* Top section */}
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Provider avatar */}
                      <motion.div
                        whileHover={{
                          scale: 1.05,
                        }}
                        className="shrink-0"
                      >
                        {providerImage ? (
                          <img
                            src={providerImage}
                            alt={providerName}
                            className="h-12 w-12 rounded-2xl object-cover ring-2 ring-ink-100 dark:ring-ink-800"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 ring-2 ring-primary-100 dark:bg-primary-950/40 dark:text-primary-400 dark:ring-primary-900/30">
                            <UserRound className="h-5 w-5" />
                          </div>
                        )}
                      </motion.div>

                      <div className="min-w-0 flex-1">
                        {/* Provider + actions */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-bold text-ink-900 dark:text-white">
                              {providerName}
                            </h3>

                            {review.service?.title && (
                              <div className="mt-0.5 flex items-center gap-1.5">
                                <span className="truncate text-xs font-medium text-ink-400">
                                  {review.service.title}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleEditClick(
                                  review
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold text-primary-600 transition hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/30"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setDeleteId(
                                  review._id
                                );
                                setDeleteError("");
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>

                        {/* Rating + date */}
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(
                              (star) => (
                                <motion.div
                                  key={star}
                                  initial={{
                                    opacity: 0,
                                    scale: 0.5,
                                  }}
                                  animate={{
                                    opacity: 1,
                                    scale: 1,
                                  }}
                                  transition={{
                                    delay:
                                      star * 0.04,
                                  }}
                                >
                                  <Star
                                    className="h-4 w-4 text-primary-500"
                                    fill={
                                      review.rating >=
                                      star
                                        ? "currentColor"
                                        : "none"
                                    }
                                  />
                                </motion.div>
                              )
                            )}
                          </div>

                          <span className="text-xs font-bold text-ink-600 dark:text-ink-300">
                            {review.rating}/5
                          </span>

                          <span className="h-1 w-1 rounded-full bg-ink-300" />

                          <span className="text-xs text-ink-400">
                            {formatDate(
                              review.createdAt
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Comment */}
                    {review.comment && (
                      <motion.div
                        initial={{
                          opacity: 0,
                        }}
                        animate={{
                          opacity: 1,
                        }}
                        transition={{
                          delay: 0.15,
                        }}
                        className="relative mt-5 overflow-hidden rounded-2xl bg-ink-50 p-4 dark:bg-ink-800/60"
                      >
                        <div className="absolute left-0 top-0 h-full w-1 bg-primary-500" />

                        <div className="flex gap-3">
                          <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />

                          <p className="text-sm leading-6 text-ink-600 dark:text-ink-300">
                            {review.comment}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Booking information */}
                    {review.booking?.date && (
                      <div className="mt-4 flex items-center gap-2 text-xs text-ink-400">
                        <CalendarDays className="h-3.5 w-3.5" />

                        <span>
                          Booking date:{" "}
                          {formatDate(
                            review.booking.date
                          )}

                          {review.booking.time
                            ? ` • ${review.booking.time}`
                            : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* =====================================================
          EDIT REVIEW MODAL
      ===================================================== */}
      <AnimatePresence>
        {editingReview && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !updating
              ) {
                closeEditModal();
              }
            }}
          >
            <motion.div
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
                type: "spring",
                stiffness: 300,
                damping: 25,
              }}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-ink-900"
            >
              {/* Modal header */}
              <div className="flex items-start justify-between border-b border-ink-100 p-5 sm:p-6 dark:border-ink-800">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
                      <Pencil className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-ink-900 dark:text-white">
                        Edit your review
                      </h2>

                      <p className="mt-0.5 text-xs text-ink-400">
                        Update your experience
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={updating}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-ink-800 dark:hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6">
                {/* Provider */}
                <div className="flex items-center gap-3 rounded-2xl bg-ink-50 p-3 dark:bg-ink-800/60">
                  {getProviderImage(
                    editingReview.provider
                  ) ? (
                    <img
                      src={getProviderImage(
                        editingReview.provider
                      )}
                      alt={getProviderName(
                        editingReview.provider
                      )}
                      className="h-11 w-11 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
                      <UserRound className="h-5 w-5" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink-900 dark:text-white">
                      {getProviderName(
                        editingReview.provider
                      )}
                    </p>

                    {editingReview.service?.title && (
                      <p className="truncate text-xs text-ink-400">
                        {editingReview.service.title}
                      </p>
                    )}
                  </div>
                </div>

                {/* Rating */}
                <div className="mt-6">
                  <label className="text-sm font-bold text-ink-900 dark:text-white">
                    Your rating
                  </label>

                  <div className="mt-3 flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(
                      (star) => (
                        <motion.button
                          key={star}
                          type="button"
                          whileHover={{
                            scale: 1.15,
                          }}
                          whileTap={{
                            scale: 0.9,
                          }}
                          onClick={() =>
                            setEditRating(star)
                          }
                          className="rounded-lg p-1 focus:outline-none"
                          aria-label={`${star} star`}
                        >
                          <Star
                            className={`h-8 w-8 transition-colors ${
                              editRating >= star
                                ? "text-primary-500"
                                : "text-ink-200 dark:text-ink-700"
                            }`}
                            fill={
                              editRating >= star
                                ? "currentColor"
                                : "none"
                            }
                          />
                        </motion.button>
                      )
                    )}

                    <span className="ml-2 text-sm font-bold text-ink-600 dark:text-ink-300">
                      {editRating > 0
                        ? `${editRating}/5`
                        : "Select a rating"}
                    </span>
                  </div>
                </div>

                {/* Comment */}
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="edit-review-comment"
                      className="text-sm font-bold text-ink-900 dark:text-white"
                    >
                      Your review
                    </label>

                    <span className="text-xs text-ink-400">
                      {editComment.length}/2000
                    </span>
                  </div>

                  <textarea
                    id="edit-review-comment"
                    value={editComment}
                    onChange={(event) =>
                      setEditComment(
                        event.target.value.slice(
                          0,
                          2000
                        )
                      )
                    }
                    rows={5}
                    placeholder="Tell us about your experience..."
                    className="mt-2 w-full resize-none rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm leading-6 text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 dark:border-ink-700 dark:bg-ink-950 dark:text-white dark:placeholder:text-ink-500"
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
                      className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{editError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Buttons */}
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={updating}
                    className="w-full rounded-xl border border-ink-200 px-5 py-3 text-sm font-bold text-ink-700 transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800 sm:w-auto"
                  >
                    Cancel
                  </button>

                  <motion.button
                    type="button"
                    onClick={handleUpdateReview}
                    disabled={
                      updating || editRating === 0
                    }
                    whileHover={
                      !updating && editRating > 0
                        ? {
                            scale: 1.01,
                          }
                        : {}
                    }
                    whileTap={
                      !updating && editRating > 0
                        ? {
                            scale: 0.98,
                          }
                        : {}
                    }
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {updating ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================
          DELETE CONFIRMATION MODAL
      ===================================================== */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !deleting
              ) {
                setDeleteId(null);
                setDeleteError("");
              }
            }}
          >
            <motion.div
              initial={{
                opacity: 0,
                y: 25,
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
                type: "spring",
                stiffness: 300,
                damping: 25,
              }}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-ink-900"
            >
              {/* Delete icon */}
              <motion.div
                initial={{
                  scale: 0.7,
                }}
                animate={{
                  scale: 1,
                }}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
              >
                <Trash2 className="h-5 w-5" />
              </motion.div>

              {/* Header */}
              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-ink-900 dark:text-white">
                    Delete review?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-ink-500 dark:text-ink-400">
                    This will permanently remove your
                    review. It will also disappear from
                    the provider's profile and affect
                    their review rating.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!deleting) {
                      setDeleteId(null);
                      setDeleteError("");
                    }
                  }}
                  disabled={deleting}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-ink-800 dark:hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Error */}
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
                    className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{deleteError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!deleting) {
                      setDeleteId(null);
                      setDeleteError("");
                    }
                  }}
                  disabled={deleting}
                  className="w-full rounded-xl border border-ink-200 px-5 py-3 text-sm font-bold text-ink-700 transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800 sm:w-auto"
                >
                  Keep Review
                </button>

                <motion.button
                  type="button"
                  onClick={handleDeleteReview}
                  disabled={deleting}
                  whileHover={
                    !deleting
                      ? {
                          scale: 1.01,
                        }
                      : {}
                  }
                  whileTap={
                    !deleting
                      ? {
                          scale: 0.98,
                        }
                      : {}
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {deleting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete Review
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}