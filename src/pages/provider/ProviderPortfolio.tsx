import { useMemo, useState } from "react";

import { motion } from "framer-motion";

import { Link } from "react-router-dom";

import {
    AlertCircle,
    CalendarDays,
    Camera,
    CheckCircle2,
    ChevronDown,
    Eye,
    Image as ImageIcon,
    Info,
    Loader2,
    Plus,
    Tag,
    Trash2,
    UploadCloud,
    X,
} from "lucide-react";

import { providerNavItems } from "@/data/providerNavItems";

import {
    DashboardLayout,
    DashboardHeader,
} from "@/components/DashboardLayout";

import {
    Badge,
    Button,
    EmptyState,
    ErrorState,
    ResponsiveModal,
    Skeleton,
    cn,
} from "@/components/ui";

import { getApiErrorMessage, hasUserToken } from "@/lib/api";

import {
    useAddPortfolio,
    useDeletePortfolio,
    useMyPortfolio,
} from "@/hooks/queries";

// ========================================================
// CONSTANTS
// ========================================================

const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const CATEGORY_OPTIONS = [
    "Photography",
    "Videography",
    "Graphic Design",
    "Makeup",
    "Other",
];

// ========================================================
// TYPES
// ========================================================

interface PortfolioItem {
    _id: string;
    provider?: string;

    title: string;
    category: string;
    description?: string;

    image: string;
    imagePublicId?: string;

    createdAt?: string;
    updatedAt?: string;
}

// ========================================================
// NORMALIZATION
//
// The query hook returns backend-shaped records. Normalize
// once here so every render path works with the same shape
// and missing fields never break the gallery.
// ========================================================

function normalizePortfolio(
    items: Array<Record<string, unknown>> | undefined
): PortfolioItem[] {
    if (!Array.isArray(items)) {
        return [];
    }

    return items
        .filter(
            (item): item is Record<string, unknown> =>
                Boolean(item) && typeof item === "object"
        )
        .map((item) => {
            const providerValue = item.provider;

            let provider: string | undefined;

            if (typeof providerValue === "string") {
                provider = providerValue;
            } else if (
                providerValue &&
                typeof providerValue === "object"
            ) {
                const providerId = (
                    providerValue as Record<string, unknown>
                )._id;

                provider =
                    providerId == null
                        ? undefined
                        : String(providerId);
            }

            const description =
                typeof item.description === "string"
                    ? item.description
                    : undefined;

            return {
                _id: String(item._id ?? item.id ?? ""),
                provider: provider || undefined,
                title:
                    typeof item.title === "string" &&
                        item.title.trim()
                        ? item.title.trim()
                        : "Untitled work",
                category:
                    typeof item.category === "string"
                        ? item.category.trim()
                        : "",
                description,
                image:
                    typeof item.image === "string"
                        ? item.image
                        : "",
                imagePublicId:
                    typeof item.imagePublicId === "string"
                        ? item.imagePublicId
                        : undefined,
                createdAt:
                    typeof item.createdAt === "string"
                        ? item.createdAt
                        : undefined,
                updatedAt:
                    typeof item.updatedAt === "string"
                        ? item.updatedAt
                        : undefined,
            };
        });
}

function formatDate(value?: string) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function revokePreview(url: string) {
    if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
    }
}

// ========================================================
// PAGE
// ========================================================

export function ProviderPortfolio() {
    const portfolioQuery = useMyPortfolio();
    const addPortfolio = useAddPortfolio();
    const deletePortfolio = useDeletePortfolio();

    // List / modal state
    const [showModal, setShowModal] = useState(false);
    const [viewingItem, setViewingItem] =
        useState<PortfolioItem | null>(null);
    const [pendingDelete, setPendingDelete] =
        useState<PortfolioItem | null>(null);

    // Feedback
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form state
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState("");
    const [isDragging, setIsDragging] = useState(false);

    const portfolio = useMemo(
        () => normalizePortfolio(portfolioQuery.data),
        [portfolioQuery.data]
    );

    const isSubmitting = addPortfolio.isPending;

    const deletingId = deletePortfolio.isPending
        ? deletePortfolio.variables ?? null
        : null;

    const hasSession = hasUserToken();

    const anyModalOpen =
        showModal ||
        Boolean(viewingItem) ||
        Boolean(pendingDelete);

    const queryErrorMessage = portfolioQuery.isError
        ? getApiErrorMessage(portfolioQuery.error)
        : "";

    const viewingDate = viewingItem
        ? formatDate(viewingItem.createdAt)
        : "";

    // ========================================================
    // ADD MODAL
    // ========================================================

    const openAddModal = () => {
        setError("");
        setSuccess("");
        setShowModal(true);
    };

    const resetForm = () => {
        setTitle("");
        setCategory("");
        setDescription("");
        setImage(null);

        revokePreview(imagePreview);
        setImagePreview("");

        setIsDragging(false);
    };

    const closeAddModal = () => {
        if (isSubmitting) {
            return;
        }

        setShowModal(false);
        resetForm();
    };

    // ========================================================
    // IMAGE HANDLING
    // ========================================================

    const processImageFile = (file: File) => {
        if (!file.type.startsWith("image/")) {
            setError("Please select a valid image.");

            return;
        }

        if (file.size > MAX_IMAGE_BYTES) {
            setError("Image must be smaller than 5MB.");

            return;
        }

        setError("");
        setImage(file);

        revokePreview(imagePreview);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleImageChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        // Reset the input so picking the same file again
        // still fires a change event.
        event.target.value = "";

        if (!file) {
            return;
        }

        processImageFile(file);
    };

    const removeImage = () => {
        revokePreview(imagePreview);
        setImage(null);
        setImagePreview("");
    };

    // ========================================================
    // ADD PORTFOLIO
    // ========================================================

    const handleAddPortfolio = async (
        event: React.FormEvent
    ) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!hasUserToken()) {
            setError("Authentication token not found.");

            return;
        }

        if (!title.trim()) {
            setError("Portfolio title is required.");

            return;
        }

        if (!category.trim()) {
            setError("Portfolio category is required.");

            return;
        }

        if (!image) {
            setError("Please select an image.");

            return;
        }

        const formData = new FormData();

        formData.append("title", title.trim());
        formData.append("category", category.trim());
        formData.append("description", description.trim());
        formData.append("image", image);

        try {
            await addPortfolio.mutateAsync(formData);

            setSuccess("Portfolio work added successfully.");

            resetForm();
            setShowModal(false);
        } catch (err) {
            setError(
                getApiErrorMessage(err) ||
                "Unable to add portfolio work."
            );
        }
    };

    // ========================================================
    // DELETE PORTFOLIO
    // ========================================================

    const requestDelete = (item: PortfolioItem) => {
        if (deletePortfolio.isPending) {
            return;
        }

        if (!item._id) {
            setError("Unable to delete portfolio work.");

            return;
        }

        setError("");
        setSuccess("");
        setViewingItem(null);
        setPendingDelete(item);
    };

    const closeDeleteModal = () => {
        if (deletePortfolio.isPending) {
            return;
        }

        setPendingDelete(null);
    };

    const handleDelete = async () => {
        if (!pendingDelete) {
            return;
        }

        setError("");
        setSuccess("");

        if (!hasUserToken()) {
            setError("Authentication token not found.");

            return;
        }

        try {
            await deletePortfolio.mutateAsync(
                pendingDelete._id
            );

            setPendingDelete(null);
            setSuccess(
                "Portfolio work deleted successfully."
            );
        } catch (err) {
            setError(
                getApiErrorMessage(err) ||
                "Unable to delete portfolio work."
            );
        }
    };

    // ========================================================
    // VIEW PORTFOLIO
    // ========================================================

    const openView = (item: PortfolioItem) => {
        setError("");
        setViewingItem(item);
    };

    // ========================================================
    // RENDER
    // ========================================================

    return (
        <DashboardLayout
            role="provider"
            navItems={providerNavItems}
        >
            <DashboardHeader
                title="Portfolio"
                subtitle="Showcase your best work"
                action={
                    hasSession ? (
                        <button
                            type="button"
                            onClick={openAddModal}
                            className="btn-primary"
                        >
                            <Plus
                                className="h-4 w-4"
                                aria-hidden="true"
                            />
                            Add Work
                        </button>
                    ) : undefined
                }
            />

            {/* ====================================================
          SUCCESS
      ==================================================== */}

            {success && (
                <div
                    role="status"
                    aria-live="polite"
                    className="mb-5 flex items-center gap-3 rounded-xl border border-success-100 bg-success-50 p-4 text-sm text-success-700 dark:border-success-600/20 dark:bg-success-600/10 dark:text-success-200"
                >
                    <CheckCircle2
                        className="h-5 w-5 shrink-0"
                        aria-hidden="true"
                    />

                    <span>{success}</span>

                    <button
                        type="button"
                        onClick={() => setSuccess("")}
                        aria-label="Dismiss success message"
                        className="ml-auto rounded-lg p-1 transition hover:bg-success-100 dark:hover:bg-success-600/20"
                    >
                        <X
                            className="h-4 w-4"
                            aria-hidden="true"
                        />
                    </button>
                </div>
            )}

            {/* ====================================================
          ERROR
      ==================================================== */}

            {error && !anyModalOpen && (
                <div
                    role="alert"
                    className="mb-5 flex items-center gap-3 rounded-xl border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/10 dark:text-danger-200"
                >
                    <AlertCircle
                        className="h-5 w-5 shrink-0"
                        aria-hidden="true"
                    />

                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() => setError("")}
                        aria-label="Dismiss error message"
                        className="ml-auto rounded-lg p-1 transition hover:bg-danger-100 dark:hover:bg-danger-500/20"
                    >
                        <X
                            className="h-4 w-4"
                            aria-hidden="true"
                        />
                    </button>
                </div>
            )}

            {/* ====================================================
          CONTENT
      ==================================================== */}

            {!hasSession ? (
                /* SESSION EXPIRED */

                <EmptyState
                    icon={AlertCircle}
                    title="Please sign in again"
                    description="Your session has expired. Sign in to manage and showcase your portfolio."
                    action={
                        <Link
                            to="/login/provider"
                            className="btn-primary"
                        >
                            Sign in
                        </Link>
                    }
                />
            ) : portfolioQuery.isLoading ? (
                /* LOADING SKELETON */

                <PortfolioSkeleton />
            ) : portfolioQuery.isError &&
                portfolio.length === 0 ? (
                /* LOAD ERROR */

                <ErrorState
                    message={
                        queryErrorMessage ||
                        "Unable to load your portfolio."
                    }
                    onRetry={() => void portfolioQuery.refetch()}
                />
            ) : portfolio.length === 0 ? (
                /* EMPTY STATE */

                <EmptyState
                    icon={ImageIcon}
                    title="Your portfolio is empty"
                    description="Showcase your best work to help customers understand your skills and experience."
                    action={
                        <button
                            type="button"
                            onClick={openAddModal}
                            className="btn-primary"
                        >
                            <Plus
                                className="h-4 w-4"
                                aria-hidden="true"
                            />
                            Add Your First Work
                        </button>
                    }
                />
            ) : (
                /* GALLERY */

                <>
                    {portfolioQuery.isError && (
                        <div
                            role="alert"
                            className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/10 dark:text-danger-200"
                        >
                            <AlertCircle
                                className="h-5 w-5 shrink-0"
                                aria-hidden="true"
                            />

                            <span>
                                {queryErrorMessage ||
                                    "We couldn't refresh your portfolio."}
                            </span>

                            <Button
                                variant="outline"
                                size="sm"
                                className="ml-auto"
                                onClick={() =>
                                    void portfolioQuery.refetch()
                                }
                            >
                                Retry
                            </Button>
                        </div>
                    )}

                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm text-slate-500 dark:text-ink-400">
                            {portfolio.length}{" "}
                            {portfolio.length === 1
                                ? "piece"
                                : "pieces"}{" "}
                            of work
                        </p>

                        <p className="hidden text-xs text-slate-400 dark:text-ink-500 sm:block">
                            Hover a piece to view or delete it
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {portfolio.map((item, index) => {
                            const isDeleting =
                                deletingId === item._id;

                            const addedOn = formatDate(
                                item.createdAt
                            );

                            return (
                                <motion.article
                                    key={
                                        item._id ||
                                        `portfolio-${index}`
                                    }
                                    initial={{
                                        opacity: 0,
                                        y: 14,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                    }}
                                    transition={{
                                        duration: 0.3,
                                        delay: Math.min(
                                            index,
                                            6
                                        ) * 0.04,
                                    }}
                                    className="card group flex flex-col overflow-hidden"
                                >
                                    <div className="relative aspect-[4/3] overflow-hidden bg-lavender dark:bg-brand-950">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                loading="lazy"
                                                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-950 dark:to-brand-900">
                                                <ImageIcon
                                                    className="h-10 w-10 text-brand-400 dark:text-brand-500"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                        )}

                                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/15 to-transparent" />

                                        {/* Full-image preview trigger */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openView(item)
                                            }
                                            aria-label={`View ${item.title}`}
                                            className="absolute inset-0 z-[1] cursor-zoom-in"
                                        />

                                        {item.category && (
                                            <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-brand-700 backdrop-blur dark:bg-ink-900/90 dark:text-brand-300">
                                                {item.category}
                                            </span>
                                        )}

                                        <div className="absolute right-3 top-3 z-10 flex items-center gap-2 opacity-100 transition-opacity sm:pointer-events-none sm:opacity-0 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100 sm:group-focus-within:pointer-events-auto sm:group-focus-within:opacity-100">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openView(item)
                                                }
                                                aria-label={`View ${item.title}`}
                                                title="View work"
                                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white hover:text-brand-700 dark:bg-ink-900/90 dark:text-ink-200 dark:hover:text-brand-300"
                                            >
                                                <Eye
                                                    className="h-4 w-4"
                                                    aria-hidden="true"
                                                />
                                            </button>

                                            <button
                                                type="button"
                                                disabled={
                                                    isDeleting ||
                                                    !item._id
                                                }
                                                onClick={() =>
                                                    requestDelete(
                                                        item
                                                    )
                                                }
                                                aria-label={`Delete ${item.title}`}
                                                title="Delete work"
                                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger-600/95 text-white shadow-sm transition hover:bg-danger-700 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {isDeleting ? (
                                                    <Loader2
                                                        className="h-4 w-4 animate-spin"
                                                        aria-hidden="true"
                                                    />
                                                ) : (
                                                    <Trash2
                                                        className="h-4 w-4"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                            </button>
                                        </div>

                                        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] p-4">
                                            <h3 className="truncate text-sm font-semibold text-white">
                                                {item.title}
                                            </h3>

                                            <p className="mt-0.5 truncate text-xs text-white/70">
                                                {item.category ||
                                                    "Portfolio work"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-1 flex-col p-4 sm:p-5">
                                        <p
                                            className={cn(
                                                "line-clamp-2 text-sm leading-relaxed",
                                                item.description
                                                    ? "text-slate-600 dark:text-ink-300"
                                                    : "italic text-slate-400 dark:text-ink-500"
                                            )}
                                        >
                                            {item.description ||
                                                "No description added yet."}
                                        </p>

                                        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                                            {addedOn ? (
                                                <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-ink-500">
                                                    <CalendarDays
                                                        className="h-3.5 w-3.5"
                                                        aria-hidden="true"
                                                    />
                                                    {addedOn}
                                                </span>
                                            ) : (
                                                <span />
                                            )}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openView(item)
                                                }
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 transition hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
                                            >
                                                View details
                                                <Eye
                                                    className="h-3.5 w-3.5"
                                                    aria-hidden="true"
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </motion.article>
                            );
                        })}

                        {/* ADD WORK CTA */}
                        <motion.button
                            type="button"
                            onClick={openAddModal}
                            initial={{
                                opacity: 0,
                                y: 14,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                            }}
                            transition={{
                                duration: 0.3,
                                delay:
                                    Math.min(
                                        portfolio.length,
                                        6
                                    ) * 0.04,
                            }}
                            className="group flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 px-5 py-8 text-center transition hover:border-brand-300 hover:bg-lavender/60 focus-visible:border-brand-500 dark:border-ink-700 dark:bg-ink-900/40 dark:hover:border-ink-600 dark:hover:bg-ink-800/60"
                        >
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lavender text-brand-600 transition group-hover:scale-105 dark:bg-brand-950 dark:text-brand-300">
                                <Plus
                                    className="h-6 w-6"
                                    aria-hidden="true"
                                />
                            </span>

                            <span className="text-sm font-semibold text-slate-900 dark:text-ink-50">
                                Add new work
                            </span>

                            <span className="max-w-[12rem] text-xs leading-relaxed text-slate-400 dark:text-ink-500">
                                Upload a photo and a short
                                description of your project.
                            </span>
                        </motion.button>
                    </div>
                </>
            )}

            {/* ====================================================
          ADD WORK MODAL
      ==================================================== */}

            <ResponsiveModal
                open={showModal}
                onClose={closeAddModal}
                title="Add portfolio work"
                footer={
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Button
                            variant="outline"
                            onClick={closeAddModal}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            form="add-portfolio-form"
                            loading={isSubmitting}
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? "Uploading..."
                                : "Add Work"}
                        </Button>
                    </div>
                }
            >
                <p className="mb-4 text-xs text-slate-500 dark:text-ink-400">
                    Showcase one of your best projects.
                </p>

                {error && (
                    <div
                        role="alert"
                        className="mb-4 flex items-start gap-2 rounded-xl border border-danger-100 bg-danger-50 px-3 py-2.5 text-xs font-medium text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/10 dark:text-danger-200"
                    >
                        <AlertCircle
                            className="mt-0.5 h-4 w-4 shrink-0"
                            aria-hidden="true"
                        />
                        <span>{error}</span>
                    </div>
                )}

                <form
                    id="add-portfolio-form"
                    onSubmit={handleAddPortfolio}
                    className="space-y-5"
                >
                    {/* TITLE */}
                    <div>
                        <label
                            htmlFor="portfolio-title"
                            className="label"
                        >
                            Project title
                        </label>

                        <input
                            id="portfolio-title"
                            type="text"
                            value={title}
                            onChange={(event) =>
                                setTitle(event.target.value)
                            }
                            placeholder="e.g. ABUAD Event Photography"
                            maxLength={100}
                            autoComplete="off"
                            disabled={isSubmitting}
                            className="input"
                        />
                    </div>

                    {/* CATEGORY */}
                    <div>
                        <label
                            htmlFor="portfolio-category"
                            className="label"
                        >
                            Category
                        </label>

                        <div className="relative">
                            <select
                                id="portfolio-category"
                                value={category}
                                onChange={(event) =>
                                    setCategory(
                                        event.target.value
                                    )
                                }
                                disabled={isSubmitting}
                                className="input appearance-none pr-10"
                            >
                                <option value="">
                                    Select category
                                </option>

                                {CATEGORY_OPTIONS.map(
                                    (option) => (
                                        <option
                                            key={option}
                                            value={option}
                                        >
                                            {option}
                                        </option>
                                    )
                                )}
                            </select>

                            <ChevronDown
                                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                aria-hidden="true"
                            />
                        </div>
                    </div>

                    {/* DESCRIPTION */}
                    <div>
                        <div className="flex items-center justify-between">
                            <label
                                htmlFor="portfolio-description"
                                className="label mb-0"
                            >
                                Description
                                <span className="ml-1 font-normal text-slate-400">
                                    (optional)
                                </span>
                            </label>

                            <span className="text-[11px] text-slate-400 dark:text-ink-500">
                                {description.length}/500
                            </span>
                        </div>

                        <textarea
                            id="portfolio-description"
                            rows={4}
                            value={description}
                            onChange={(event) =>
                                setDescription(
                                    event.target.value
                                )
                            }
                            placeholder="Tell customers briefly about this work..."
                            maxLength={500}
                            disabled={isSubmitting}
                            className="form-textarea mt-2"
                        />
                    </div>

                    {/* IMAGE */}
                    <div>
                        <span className="label">
                            Work image
                        </span>

                        {imagePreview ? (
                            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-ink-700">
                                <div className="aspect-[16/9] bg-slate-100 dark:bg-ink-800">
                                    <img
                                        src={imagePreview}
                                        alt="Selected work preview"
                                        className="h-full w-full object-cover"
                                    />
                                </div>

                                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-white p-3 dark:border-ink-800 dark:bg-ink-900">
                                    <label className="btn-outline btn-sm cursor-pointer">
                                        <Camera
                                            className="h-3.5 w-3.5"
                                            aria-hidden="true"
                                        />
                                        Change image

                                        <input
                                            type="file"
                                            accept={IMAGE_ACCEPT}
                                            onChange={
                                                handleImageChange
                                            }
                                            className="sr-only"
                                            aria-label="Change portfolio image"
                                            disabled={
                                                isSubmitting
                                            }
                                        />
                                    </label>

                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        disabled={isSubmitting}
                                        className="btn btn-sm border border-danger-100 bg-danger-50 text-danger-600 hover:bg-danger-100 dark:border-danger-500/20 dark:bg-danger-500/10 dark:text-danger-400"
                                    >
                                        <X
                                            className="h-3.5 w-3.5"
                                            aria-hidden="true"
                                        />
                                        Remove
                                    </button>

                                    {image && (
                                        <span className="ml-auto max-w-[10rem] truncate text-[11px] text-slate-400 dark:text-ink-500">
                                            {image.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <label
                                htmlFor="portfolio-image"
                                onDragOver={(event) => {
                                    event.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() =>
                                    setIsDragging(false)
                                }
                                onDrop={(event) => {
                                    event.preventDefault();
                                    setIsDragging(false);

                                    const file =
                                        event.dataTransfer
                                            .files?.[0];

                                    if (file) {
                                        processImageFile(file);
                                    }
                                }}
                                className={cn(
                                    "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-10 text-center transition",
                                    isDragging
                                        ? "border-brand-500 bg-lavender dark:border-brand-500 dark:bg-brand-950/40"
                                        : "border-slate-200 hover:border-brand-300 hover:bg-lavender/60 dark:border-ink-700 dark:hover:border-ink-600 dark:hover:bg-ink-800/60"
                                )}
                            >
                                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lavender text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                                    <UploadCloud
                                        className="h-6 w-6"
                                        aria-hidden="true"
                                    />
                                </span>

                                <span className="mt-3 text-sm font-semibold text-slate-700 dark:text-ink-200">
                                    {isDragging
                                        ? "Drop image to upload"
                                        : "Click to upload or drag and drop"}
                                </span>

                                <span className="mt-1 text-xs text-slate-400 dark:text-ink-500">
                                    PNG, JPG or WEBP · Max 5MB
                                </span>

                                <input
                                    id="portfolio-image"
                                    type="file"
                                    accept={IMAGE_ACCEPT}
                                    onChange={handleImageChange}
                                    className="sr-only"
                                    disabled={isSubmitting}
                                />
                            </label>
                        )}

                        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-ink-500">
                            <Info
                                className="h-3.5 w-3.5 shrink-0"
                                aria-hidden="true"
                            />
                            A clear, well-lit image works best.
                            Maximum size 5MB.
                        </p>
                    </div>
                </form>
            </ResponsiveModal>

            {/* ====================================================
          VIEW WORK MODAL
      ==================================================== */}

            <ResponsiveModal
                open={Boolean(viewingItem)}
                onClose={() => setViewingItem(null)}
                title="Portfolio piece"
                footer={
                    viewingItem ? (
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setViewingItem(null)
                                }
                            >
                                Close
                            </Button>

                            <Button
                                variant="danger"
                                icon={Trash2}
                                onClick={() =>
                                    requestDelete(viewingItem)
                                }
                                disabled={!viewingItem._id}
                            >
                                Delete work
                            </Button>
                        </div>
                    ) : undefined
                }
            >
                {viewingItem && (
                    <div className="space-y-4">
                        <div className="overflow-hidden rounded-2xl bg-slate-900 dark:bg-ink-950">
                            {viewingItem.image ? (
                                <img
                                    src={viewingItem.image}
                                    alt={viewingItem.title}
                                    className="max-h-[55vh] w-full object-contain"
                                />
                            ) : (
                                <div className="flex aspect-[4/3] items-center justify-center text-slate-500">
                                    <ImageIcon
                                        className="h-10 w-10"
                                        aria-hidden="true"
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                {viewingItem.category && (
                                    <Badge
                                        tone="brand"
                                        icon={Tag}
                                    >
                                        {viewingItem.category}
                                    </Badge>
                                )}

                                {viewingDate && (
                                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-ink-500">
                                        <CalendarDays
                                            className="h-3.5 w-3.5"
                                            aria-hidden="true"
                                        />
                                        Added {viewingDate}
                                    </span>
                                )}
                            </div>

                            <h4 className="mt-3 text-lg font-bold text-slate-900 dark:text-ink-50">
                                {viewingItem.title}
                            </h4>

                            <p
                                className={cn(
                                    "mt-2 whitespace-pre-line text-sm leading-6",
                                    viewingItem.description
                                        ? "text-slate-600 dark:text-ink-300"
                                        : "italic text-slate-400 dark:text-ink-500"
                                )}
                            >
                                {viewingItem.description ||
                                    "No description added yet."}
                            </p>
                        </div>
                    </div>
                )}
            </ResponsiveModal>

            {/* ====================================================
          DELETE MODAL
      ==================================================== */}

            <ResponsiveModal
                open={Boolean(pendingDelete)}
                onClose={closeDeleteModal}
                title="Delete portfolio work?"
                footer={
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Button
                            variant="outline"
                            onClick={closeDeleteModal}
                            disabled={deletePortfolio.isPending}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="danger"
                            icon={Trash2}
                            loading={deletePortfolio.isPending}
                            onClick={() => void handleDelete()}
                        >
                            Delete work
                        </Button>
                    </div>
                }
            >
                {pendingDelete && (
                    <div className="space-y-4">
                        {error && (
                            <div
                                role="alert"
                                className="flex items-start gap-2 rounded-xl border border-danger-100 bg-danger-50 px-3 py-2.5 text-xs font-medium text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/10 dark:text-danger-200"
                            >
                                <AlertCircle
                                    className="mt-0.5 h-4 w-4 shrink-0"
                                    aria-hidden="true"
                                />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-200">
                                <Trash2
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-ink-50">
                                    This action cannot be undone.
                                </p>

                                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-ink-400">
                                    Are you sure you want to delete
                                    this portfolio work? It will be
                                    removed from your public
                                    portfolio immediately.
                                </p>
                            </div>
                        </div>

                        {pendingDelete.image && (
                            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-ink-800 dark:bg-ink-800/60">
                                <img
                                    src={pendingDelete.image}
                                    alt=""
                                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                                />

                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
                                        {pendingDelete.title}
                                    </p>

                                    <p className="truncate text-xs text-slate-400 dark:text-ink-500">
                                        {pendingDelete.category ||
                                            "Portfolio work"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </ResponsiveModal>
        </DashboardLayout>
    );
}

// ========================================================
// LOADING SKELETON
// ========================================================

function PortfolioSkeleton() {
    return (
        <div
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            aria-busy="true"
            aria-label="Loading your portfolio"
        >
            {Array.from({ length: 6 }).map((_, index) => (
                <div
                    key={index}
                    className="card overflow-hidden"
                >
                    <div className="aspect-[4/3] w-full overflow-hidden">
                        <Skeleton className="h-full w-full" />
                    </div>

                    <div className="space-y-3 p-4 sm:p-5">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-5/6" />

                        <div className="flex items-center justify-between pt-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
