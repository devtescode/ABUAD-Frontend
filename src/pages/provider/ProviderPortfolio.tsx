import {
    useEffect,
    useState,
} from "react";

import {
    Trash2,
    Plus,
    Loader2,
    X,
    Image as ImageIcon,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";

import { providerNavItems } from "@/data/providerNavItems";

import {
    DashboardLayout,
    DashboardHeader,
} from "@/components/DashboardLayout";

// ========================================================
// API URL
// ========================================================

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";

// ========================================================
// TYPES
// ========================================================

interface PortfolioItem {
    _id: string;
    provider: string;

    title: string;
    category: string;
    description?: string;

    image: string;
    imagePublicId?: string;

    createdAt?: string;
    updatedAt?: string;
}

// ========================================================
// COMPONENT
// ========================================================

export function ProviderPortfolio() {
    const [portfolio, setPortfolio] =
        useState<PortfolioItem[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [deletingId, setDeletingId] =
        useState<string | null>(null);

    const [showModal, setShowModal] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [title, setTitle] =
        useState("");

    const [category, setCategory] =
        useState("");

    const [description, setDescription] =
        useState("");

    const [image, setImage] =
        useState<File | null>(null);

    const [imagePreview, setImagePreview] =
        useState("");

    // ========================================================
    // GET PROVIDER TOKEN
    // ========================================================

    const getToken = () => {
        return (
            sessionStorage.getItem(
                "servicely_token"
            )
        );
    };

    // ========================================================
    // FETCH PORTFOLIO
    // ========================================================

    const fetchPortfolio = async () => {
        try {
            setLoading(true);
            setError("");

            const token = getToken();

            if (!token) {
                throw new Error(
                    "Authentication token not found."
                );
            }

            const response = await fetch(
                `${API_URL}/portfolio/allportfolio`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Failed to fetch portfolio."
                );
            }

            setPortfolio(
                data?.portfolio || []
            );
        } catch (err: any) {
            console.error(
                "Fetch portfolio error:",
                err
            );

            setError(
                err?.message ||
                "Unable to load portfolio."
            );
        } finally {
            setLoading(false);
        }
    };

    // ========================================================
    // LOAD PORTFOLIO
    // ========================================================

    useEffect(() => {
        fetchPortfolio();
    }, []);

    // ========================================================
    // HANDLE IMAGE
    // ========================================================

    const handleImageChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            setError(
                "Please select a valid image."
            );

            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError(
                "Image must be smaller than 5MB."
            );

            return;
        }

        setError("");
        setImage(file);

        const previewUrl =
            URL.createObjectURL(file);

        setImagePreview(previewUrl);
    };

    // ========================================================
    // RESET FORM
    // ========================================================

    const resetForm = () => {
        setTitle("");
        setCategory("");
        setDescription("");
        setImage(null);
        setImagePreview("");
    };

    // ========================================================
    // CLOSE MODAL
    // ========================================================

    const closeModal = () => {
        if (submitting) {
            return;
        }

        setShowModal(false);
        resetForm();
    };

    // ========================================================
    // ADD PORTFOLIO
    // ========================================================

    const handleAddPortfolio = async (
        event: React.FormEvent
    ) => {
        event.preventDefault();

        try {
            setSubmitting(true);
            setError("");
            setSuccess("");

            const token = getToken();

            if (!token) {
                throw new Error(
                    "Authentication token not found."
                );
            }

            if (!title.trim()) {
                throw new Error(
                    "Portfolio title is required."
                );
            }

            if (!category.trim()) {
                throw new Error(
                    "Portfolio category is required."
                );
            }

            if (!image) {
                throw new Error(
                    "Please select an image."
                );
            }

            const formData = new FormData();

            formData.append(
                "title",
                title.trim()
            );

            formData.append(
                "category",
                category.trim()
            );

            formData.append(
                "description",
                description.trim()
            );

            formData.append(
                "image",
                image
            );

            const response = await fetch(
                `${API_URL}/portfolio/allportfolio`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Failed to add portfolio work."
                );
            }

            // Add the newly created item
            // immediately to the UI.
            if (data?.portfolio) {
                setPortfolio((current) => [
                    data.portfolio,
                    ...current,
                ]);
            }

            setSuccess(
                "Portfolio work added successfully."
            );

            setShowModal(false);
            resetForm();
        } catch (err: any) {
            console.error(
                "Add portfolio error:",
                err
            );

            setError(
                err?.message ||
                "Unable to add portfolio work."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // ========================================================
    // DELETE PORTFOLIO
    // ========================================================

    const handleDelete = async (
        portfolioId: string
    ) => {
        const confirmed =
            window.confirm(
                "Are you sure you want to delete this portfolio work?"
            );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingId(portfolioId);
            setError("");
            setSuccess("");

            const token = getToken();

            if (!token) {
                throw new Error(
                    "Authentication token not found."
                );
            }

            const response = await fetch(
                `${API_URL}/portfolio/allportfolio/${portfolioId}`,
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
                    data?.message ||
                    "Failed to delete portfolio work."
                );
            }

            setPortfolio((current) =>
                current.filter(
                    (item) =>
                        item._id !== portfolioId
                )
            );

            setSuccess(
                "Portfolio work deleted successfully."
            );
        } catch (err: any) {
            console.error(
                "Delete portfolio error:",
                err
            );

            setError(
                err?.message ||
                "Unable to delete portfolio work."
            );
        } finally {
            setDeletingId(null);
        }
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
                    <button
                        type="button"
                        onClick={() => {
                            setError("");
                            setSuccess("");
                            setShowModal(true);
                        }}
                        className="btn-primary"
                    >
                        <Plus className="h-4 w-4" />
                        Add Work
                    </button>
                }
            />

            {/* ====================================================
          SUCCESS
      ==================================================== */}

            {success && (
                <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-950/20 dark:text-green-400">
                    <CheckCircleIcon />

                    <span>{success}</span>

                    <button
                        type="button"
                        onClick={() =>
                            setSuccess("")
                        }
                        className="ml-auto"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* ====================================================
          ERROR
      ==================================================== */}

            {error && (
                <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
                    <AlertCircle className="h-5 w-5 shrink-0" />

                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                        className="ml-auto"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* ====================================================
          LOADING
      ==================================================== */}

            {loading ? (
                <div className="card flex min-h-[300px] flex-col items-center justify-center text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary-500" />

                    <h3 className="mt-4 text-lg font-semibold text-ink-900 dark:text-white">
                        Loading your portfolio...
                    </h3>

                    <p className="mt-1 text-sm text-ink-500">
                        Please wait.
                    </p>
                </div>
            ) : portfolio.length === 0 ? (
                /* ==================================================
                   EMPTY STATE
                ================================================== */

                <div className="card flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                        <ImageIcon className="h-8 w-8" />
                    </div>

                    <h3 className="mt-5 text-lg font-semibold text-ink-900 dark:text-white">
                        Your portfolio is empty
                    </h3>

                    <p className="mt-2 max-w-md text-sm text-ink-500 dark:text-ink-400">
                        Showcase your best work to help
                        customers understand your skills
                        and experience.
                    </p>

                    <button
                        type="button"
                        onClick={() => {
                            setError("");
                            setSuccess("");
                            setShowModal(true);
                        }}
                        className="btn-primary mt-6"
                    >
                        <Plus className="h-4 w-4" />
                        Add Your First Work
                    </button>
                </div>
            ) : (
                /* ==================================================
                   PORTFOLIO GRID
                ================================================== */

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {portfolio.map((item) => {
                        const isDeleting =
                            deletingId === item._id;

                        return (
                            <div
                                key={item._id}
                                className="group relative overflow-hidden rounded-xl bg-ink-100 dark:bg-ink-800"
                            >
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
                                />

                                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink-900/80 via-ink-900/20 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                                    <div className="flex w-full items-end justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-white">
                                                {item.title}
                                            </p>

                                            <p className="mt-0.5 text-xs text-white/70">
                                                {item.category}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            disabled={
                                                isDeleting
                                            }
                                            onClick={() =>
                                                handleDelete(
                                                    item._id
                                                )
                                            }
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/90 text-white transition hover:bg-red-600 disabled:opacity-60"
                                            title="Delete work"
                                        >
                                            {isDeleting ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* ADD WORK CARD */}

                    <button
                        type="button"
                        onClick={() => {
                            setError("");
                            setSuccess("");
                            setShowModal(true);
                        }}
                        className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 text-ink-400 transition hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-600 dark:border-ink-700 dark:hover:border-primary-700 dark:hover:bg-primary-950/20"
                    >
                        <Plus className="h-8 w-8" />

                        <span className="mt-2 text-sm font-medium">
                            Add Work
                        </span>
                    </button>
                </div>
            )}

            {/* ====================================================
          ADD WORK MODAL
      ==================================================== */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
                    <div className="flex min-h-full items-center justify-center">
                        <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-ink-900">

                            {/* Modal Header */}

                            <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4 dark:border-ink-800">
                                <div>
                                    <h2 className="text-lg font-bold text-ink-900 dark:text-white">
                                        Add Portfolio Work
                                    </h2>

                                    <p className="mt-1 text-xs text-ink-500">
                                        Showcase one of your best projects.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={submitting}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Modal Form */}

                            <form
                                onSubmit={
                                    handleAddPortfolio
                                }
                                className="space-y-5 p-6"
                            >
                                {/* Title */}

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-ink-200">
                                        Project Title
                                    </label>

                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(event) =>
                                            setTitle(
                                                event.target.value
                                            )
                                        }
                                        placeholder="e.g. ABUAD Event Photography"
                                        maxLength={100}
                                        className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-ink-700 dark:bg-ink-800 dark:text-white"
                                    />
                                </div>

                                {/* Category */}

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-ink-200">
                                        Category
                                    </label>

                                    <select
                                        value={category}
                                        onChange={(event) =>
                                            setCategory(
                                                event.target.value
                                            )
                                        }
                                        className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-ink-700 dark:bg-ink-800 dark:text-white"
                                    >
                                        <option value="">
                                            Select category
                                        </option>

                                        <option value="Photography">
                                            Photography
                                        </option>

                                        <option value="Videography">
                                            Videography
                                        </option>

                                        <option value="Graphic Design">
                                            Graphic Design
                                        </option>

                                        <option value="Makeup">
                                            Makeup
                                        </option>

                                        <option value="Other">
                                            Other
                                        </option>
                                    </select>
                                </div>

                                {/* Description */}

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-ink-200">
                                        Description
                                        <span className="ml-1 font-normal text-ink-400">
                                            (optional)
                                        </span>
                                    </label>

                                    <textarea
                                        value={description}
                                        onChange={(event) =>
                                            setDescription(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Tell customers briefly about this work..."
                                        rows={3}
                                        maxLength={500}
                                        className="w-full resize-none rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-ink-700 dark:bg-ink-800 dark:text-white"
                                    />
                                </div>

                                {/* Image */}

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-ink-700 dark:text-ink-200">
                                        Work Image
                                    </label>

                                    <label className="block cursor-pointer">
                                        {imagePreview ? (
                                            <div className="relative overflow-hidden rounded-xl border border-ink-200 dark:border-ink-700">
                                                <img
                                                    src={
                                                        imagePreview
                                                    }
                                                    alt="Preview"
                                                    className="h-48 w-full object-cover"
                                                />

                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition hover:opacity-100">
                                                    <span className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-ink-800">
                                                        Change image
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 text-center transition hover:border-primary-400 hover:bg-primary-50/50 dark:border-ink-700 dark:hover:border-primary-700">
                                                <ImageIcon className="h-8 w-8 text-ink-400" />

                                                <p className="mt-2 text-sm font-medium text-ink-600 dark:text-ink-300">
                                                    Click to upload an image
                                                </p>

                                                <p className="mt-1 text-xs text-ink-400">
                                                    PNG, JPG or WEBP • Max 5MB
                                                </p>
                                            </div>
                                        )}

                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={
                                                handleImageChange
                                            }
                                            className="hidden"
                                        />
                                    </label>
                                </div>

                                {/* Buttons */}

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={submitting}
                                        className="btn-outline"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4" />
                                                Add Work
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

// ========================================================
// SMALL SUCCESS ICON
// ========================================================

function CheckCircleIcon() {
    return (
        <CheckCircle2 className="h-5 w-5 shrink-0" />
    );
}