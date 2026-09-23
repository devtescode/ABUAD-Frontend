import {
    DashboardLayout,
    DashboardHeader,
} from "@/components/DashboardLayout";

import { customerNavItems } from "@/data/customerNavItems";

import {
    Heart,
    Search,
    ArrowRight,
    Loader2,
    Users,
    MapPin,
    ShieldCheck,
    ChevronRight,
    User,
} from "lucide-react";

import { Link } from "react-router-dom";

import {
    useEffect,
    useState,
} from "react";

import {
    motion,
    AnimatePresence,
} from "framer-motion";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";

interface SavedProvider {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    about?: string;
    location?: string;
    status?: string;
    role: "provider";
}

export function CustomerSaved() {
    const [savedProviders, setSavedProviders] =
        useState<SavedProvider[]>([]);

    const [isLoading, setIsLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        const fetchSavedProviders =
            async () => {
                try {
                    setIsLoading(true);
                    setError("");

                    const token =
                        sessionStorage.getItem(
                            "servicely_token"
                        );

                    if (!token) {
                        throw new Error(
                            "Please login to view your saved providers."
                        );
                    }

                    const response =
                        await fetch(
                            `${API_URL}/usercreative/providers/saved`,
                            {
                                method: "GET",
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            }
                        );

                    const data =
                        await response.json();

                    if (!response.ok) {
                        throw new Error(
                            data?.message ||
                            "Failed to load saved providers."
                        );
                    }

                    setSavedProviders(
                        data.savedProviders || []
                    );
                } catch (error: any) {
                    console.error(
                        "Saved providers error:",
                        error
                    );

                    setError(
                        error?.message ||
                        "Unable to load saved providers."
                    );
                } finally {
                    setIsLoading(false);
                }
            };

        fetchSavedProviders();
    }, []);

    return (
        <DashboardLayout
            role="customer"
            navItems={customerNavItems}
        >
            <div className="relative space-y-8 pb-10">
                <DashboardHeader
                    title="Saved Providers"
                    subtitle="Providers you've saved for future bookings"
                />

                <AnimatePresence mode="wait">
                    {/* =========================
                        BLUR LOADING STATE
                    ========================== */}
                    {isLoading && (
                        <motion.div
                            key="loading"
                            initial={{
                                opacity: 0,
                                filter: "blur(10px)",
                            }}
                            animate={{
                                opacity: 1,
                                filter: "blur(0px)",
                            }}
                            exit={{
                                opacity: 0,
                                filter: "blur(10px)",
                            }}
                            transition={{
                                duration: 0.45,
                            }}
                            className="relative"
                        >
                            {/* Soft background glow */}
                            <div className="pointer-events-none absolute -top-10 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary-500/10 blur-3xl" />

                            <div className="relative overflow-hidden rounded-[28px] border border-ink-200/70 bg-white/90 p-6 shadow-sm backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/90 sm:p-8">
                                {/* Loading header */}
                                <div className="mb-7 flex items-center justify-between">
                                    <div className="space-y-2">
                                        <div className="h-5 w-44 animate-pulse rounded-lg bg-ink-200 dark:bg-ink-800" />
                                        <div className="h-3 w-28 animate-pulse rounded-lg bg-ink-100 dark:bg-ink-800/70" />
                                    </div>

                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-950/40">
                                        <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
                                    </div>
                                </div>

                                {/* Skeleton cards */}
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {[1, 2, 3, 4].map(
                                        (item) => (
                                            <motion.div
                                                key={item}
                                                initial={{
                                                    opacity: 0,
                                                    y: 14,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    y: 0,
                                                }}
                                                transition={{
                                                    delay:
                                                        item *
                                                        0.07,
                                                    duration:
                                                        0.35,
                                                }}
                                                className="overflow-hidden rounded-[24px] border border-ink-200/70 bg-white dark:border-ink-800 dark:bg-ink-900"
                                            >
                                                {/* Image skeleton */}
                                                <div className="relative h-40 animate-pulse bg-ink-100 dark:bg-ink-800">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/5" />

                                                    <div className="absolute bottom-4 left-4 h-16 w-16 rounded-2xl bg-white/70 dark:bg-ink-700/70" />
                                                </div>

                                                <div className="space-y-4 p-5">
                                                    <div className="space-y-2">
                                                        <div className="h-4 w-3/4 animate-pulse rounded-md bg-ink-200 dark:bg-ink-800" />
                                                        <div className="h-3 w-1/2 animate-pulse rounded-md bg-ink-100 dark:bg-ink-800/70" />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="h-3 w-full animate-pulse rounded-md bg-ink-100 dark:bg-ink-800/70" />
                                                        <div className="h-3 w-5/6 animate-pulse rounded-md bg-ink-100 dark:bg-ink-800/70" />
                                                    </div>

                                                    <div className="h-11 w-full animate-pulse rounded-xl bg-ink-100 dark:bg-ink-800" />
                                                </div>
                                            </motion.div>
                                        )
                                    )}
                                </div>

                                {/* Loading overlay */}
                                <div className="pointer-events-none absolute inset-0 bg-white/5 backdrop-blur-[1px] dark:bg-black/5" />
                            </div>

                            <div className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-ink-500 dark:text-ink-400">
                                <Loader2 className="h-4 w-4 animate-spin text-primary-500" />

                                Preparing your saved providers...
                            </div>
                        </motion.div>
                    )}

                    {/* =========================
                        ERROR STATE
                    ========================== */}
                    {!isLoading && error && (
                        <motion.div
                            key="error"
                            initial={{
                                opacity: 0,
                                y: 15,
                                filter: "blur(8px)",
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                filter: "blur(0px)",
                            }}
                            transition={{
                                duration: 0.45,
                            }}
                            className="relative overflow-hidden rounded-[28px] border border-red-200 bg-white p-10 text-center shadow-sm dark:border-red-900/50 dark:bg-ink-900"
                        >
                            <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-red-500/10 blur-3xl" />

                            <div className="relative">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30">
                                    <Heart className="h-7 w-7 text-red-500" />
                                </div>

                                <h3 className="mt-5 text-lg font-bold text-ink-900 dark:text-white">
                                    Something went wrong
                                </h3>

                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-red-600 dark:text-red-400">
                                    {error}
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        window.location.reload()
                                    }
                                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-700"
                                >
                                    Try again

                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* =========================
                        EMPTY STATE
                    ========================== */}
                    {!isLoading &&
                        !error &&
                        savedProviders.length === 0 && (
                            <motion.div
                                key="empty"
                                initial={{
                                    opacity: 0,
                                    y: 20,
                                    filter: "blur(10px)",
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                    filter: "blur(0px)",
                                }}
                                transition={{
                                    duration: 0.55,
                                    ease: "easeOut",
                                }}
                                className="relative overflow-hidden rounded-[32px] border border-ink-200/70 bg-white px-6 py-20 text-center shadow-sm dark:border-ink-800 dark:bg-ink-900"
                            >
                                {/* Decorative glow */}
                                <div className="pointer-events-none absolute -left-20 -top-20 h-52 w-52 rounded-full bg-primary-500/10 blur-3xl" />

                                <div className="pointer-events-none absolute -bottom-20 -right-20 h-52 w-52 rounded-full bg-primary-500/10 blur-3xl" />

                                <div className="relative">
                                    <motion.div
                                        initial={{
                                            scale: 0.8,
                                            opacity: 0,
                                        }}
                                        animate={{
                                            scale: 1,
                                            opacity: 1,
                                        }}
                                        transition={{
                                            delay: 0.15,
                                            duration: 0.45,
                                        }}
                                        className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-primary-50 to-primary-100 text-primary-500 shadow-inner dark:from-primary-950/40 dark:to-primary-900/30 dark:text-primary-400"
                                    >
                                        <Heart className="h-10 w-10" />
                                    </motion.div>

                                    <h3 className="mt-7 text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
                                        No saved providers yet
                                    </h3>

                                    <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-ink-500 dark:text-ink-400">
                                        Discover talented providers,
                                        save the ones you love, and
                                        easily come back to them when
                                        you're ready to book.
                                    </p>

                                    <Link
                                        to="/customer/browse"
                                        className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-500/25"
                                    >
                                        <Search className="h-4 w-4" />

                                        Browse Providers

                                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                    </Link>
                                </div>
                            </motion.div>
                        )}

                    {/* =========================
                        SAVED PROVIDERS
                    ========================== */}
                    {!isLoading &&
                        !error &&
                        savedProviders.length > 0 && (
                            <motion.div
                                key="providers"
                                initial={{
                                    opacity: 0,
                                    filter: "blur(10px)",
                                }}
                                animate={{
                                    opacity: 1,
                                    filter: "blur(0px)",
                                }}
                                transition={{
                                    duration: 0.6,
                                }}
                            >
                                {/* Section heading */}
                                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-950/40">
                                                <Users className="h-5 w-5 text-primary-500" />
                                            </div>

                                            <div>
                                                <h2 className="text-lg font-bold text-ink-900 dark:text-white">
                                                    Your Saved Providers
                                                </h2>

                                                <p className="text-xs text-ink-500 dark:text-ink-400">
                                                    People you're interested
                                                    in booking
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-ink-200/70 bg-white px-3.5 py-2 text-xs font-semibold text-ink-600 shadow-sm dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300">
                                        <Heart className="h-3.5 w-3.5 fill-current text-red-500" />

                                        {savedProviders.length}{" "}
                                        {savedProviders.length === 1
                                            ? "provider"
                                            : "providers"}{" "}
                                        saved
                                    </div>
                                </div>

                                {/* Provider cards */}
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {savedProviders.map(
                                        (
                                            provider,
                                            index
                                        ) => (
                                            <motion.div
                                                key={
                                                    provider._id
                                                }
                                                initial={{
                                                    opacity: 0,
                                                    y: 24,
                                                    filter: "blur(8px)",
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    y: 0,
                                                    filter: "blur(0px)",
                                                }}
                                                transition={{
                                                    delay:
                                                        index *
                                                        0.08,
                                                    duration:
                                                        0.5,
                                                    ease: "easeOut",
                                                }}
                                                whileHover={{
                                                    y: -6,
                                                }}
                                                className="group relative"
                                            >
                                                <div className="relative h-full overflow-hidden rounded-[26px] border border-ink-200/70 bg-white shadow-sm transition-all duration-500 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-500/10 dark:border-ink-800 dark:bg-ink-900 dark:hover:border-primary-900">
                                                    {/* Top visual area */}
                                                    <div className="relative h-36 overflow-hidden bg-gradient-to-br from-primary-100 via-primary-50 to-ink-100 dark:from-primary-950/50 dark:via-ink-900 dark:to-ink-800">
                                                        {/* Background decoration */}
                                                        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary-500/20 blur-2xl transition-transform duration-700 group-hover:scale-150" />

                                                        <div className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-primary-400/10 blur-2xl" />

                                                        {/* Saved badge */}
                                                        <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 bg-white/80 text-red-500 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-ink-900/70">
                                                            <Heart className="h-4 w-4 fill-current" />
                                                        </div>

                                                        {/* Provider avatar */}
                                                        <div className="absolute bottom-[-1px] left-5">
                                                            <div className="rounded-[20px] bg-white p-1.5 shadow-xl dark:bg-ink-900">
                                                                {provider.avatar ? (
                                                                    <img
                                                                        src={provider.avatar}
                                                                        alt={provider.name}
                                                                        className="h-16 w-16 rounded-[15px] object-cover"
                                                                        onError={(event) => {
                                                                            event.currentTarget.style.display = "none";
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div
                                                                        className="
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-[15px]
            bg-gradient-to-br
            from-primary-500
            via-primary-600
            to-primary-700
            text-white
            shadow-inner
        "
                                                                        aria-label={`${provider.name} profile`}
                                                                    >
                                                                        <User
                                                                            className="h-8 w-8 stroke-[1.6]"
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Card body */}
                                                    <div className="p-5 pt-6">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    <h3 className="truncate text-base font-bold text-ink-900 dark:text-white">
                                                                        {
                                                                            provider.name
                                                                        }
                                                                    </h3>

                                                                    {provider.status ===
                                                                        "active" && (
                                                                            <ShieldCheck className="h-4 w-4 shrink-0 text-primary-500" />
                                                                        )}
                                                                </div>

                                                                {provider.location ? (
                                                                    <div className="mt-1.5 flex items-center gap-1 text-xs text-ink-500 dark:text-ink-400">
                                                                        <MapPin className="h-3.5 w-3.5 shrink-0" />

                                                                        <span className="truncate">
                                                                            {
                                                                                provider.location
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <p className="mt-1.5 text-xs text-ink-400">
                                                                        Not specified
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <p className="mt-4 min-h-[42px] line-clamp-2 text-sm leading-6 text-ink-500 dark:text-ink-400">
                                                            {provider.about ||
                                                                "Professional service provider on Servicely."}
                                                        </p>

                                                        {/* View profile */}
                                                        <Link
                                                            to={`/providers/${provider._id}`}
                                                            className="group/button mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-primary-500/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20"
                                                        >
                                                            View Profile

                                                            <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover/button:translate-x-0.5" />
                                                        </Link>
                                                    </div>

                                                    {/* Bottom hover accent */}
                                                    <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-500 group-hover:w-full" />
                                                </div>
                                            </motion.div>
                                        )
                                    )}
                                </div>
                            </motion.div>
                        )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
}