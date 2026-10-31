import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Heart,
  HeartOff,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  Users,
  X,
} from "lucide-react";

import {
  DashboardHeader,
  DashboardLayout,
} from "@/components/DashboardLayout";
import {
  EmptyState,
  ErrorState,
  Skeleton,
  cn,
  providerAvatar,
  providerId,
  providerName,
  type ProviderLike,
} from "@/components/ui";
import { customerNavItems } from "@/data/customerNavItems";
import { getApiErrorMessage } from "@/lib/api";
import {
  useSavedProviders,
  useToggleSavedProvider,
} from "@/hooks/queries";

/* =========================================================
   HELPERS
========================================================= */

type ToastState = {
  type: "success" | "error";
  message: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function providerCover(provider: ProviderLike): string | undefined {
  const portfolio = provider.portfolio;

  if (!Array.isArray(portfolio)) return undefined;

  const image = portfolio[0]?.image;

  return typeof image === "string" && image.length > 0 ? image : undefined;
}

function providerCategories(provider: ProviderLike): string[] {
  const raw = Array.isArray(provider.categories) ? provider.categories : [];
  const single = typeof provider.category === "string" ? provider.category : "";

  return (raw.length > 0 ? raw : single ? [single] : [])
    .filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0
    )
    .slice(0, 2);
}

/* =========================================================
   PROVIDER AVATAR (with graceful image fallback)
========================================================= */

function ProviderMonogram({
  name,
  src,
}: {
  name: string;
  src?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(src) && !imageFailed;
  const label = initials(name);

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[15px] bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 text-white shadow-inner">
      {showImage ? (
        <img
          src={src}
          alt={`${name} profile photo`}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : label ? (
        <span aria-hidden="true" className="text-lg font-bold tracking-wide">
          {label}
        </span>
      ) : (
        <User aria-hidden="true" className="h-7 w-7 stroke-[1.6]" />
      )}
    </div>
  );
}

/* =========================================================
   COVER (portfolio image with brand fallback)
========================================================= */

function ProviderCover({
  provider,
  name,
}: {
  provider: ProviderLike;
  name: string;
}) {
  const cover = providerCover(provider);
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(cover) && !imageFailed;

  return (
    <div className="relative h-32 overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 sm:h-36">
      {showImage ? (
        <img
          src={cover}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <>
          <span
            aria-hidden="true"
            className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/15 blur-2xl"
          />
          <span
            aria-hidden="true"
            className="absolute -bottom-14 -left-8 h-32 w-32 rounded-full bg-brand-300/20 blur-2xl"
          />
          <span
            aria-hidden="true"
            className="absolute right-12 top-7 text-5xl font-black tracking-tight text-white/15"
          >
            {initials(name) || <User className="h-10 w-10" />}
          </span>
        </>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-slate-950/5 to-transparent" />
    </div>
  );
}

/* =========================================================
   SAVED PROVIDER CARD
========================================================= */

function SavedProviderCard({
  provider,
  index,
  removing,
  onUnsave,
}: {
  provider: ProviderLike;
  index: number;
  removing: boolean;
  onUnsave: (id: string, name: string) => void;
}) {
  const id = providerId(provider);
  const name = providerName(provider);
  const avatar = providerAvatar(provider);
  const location =
    typeof provider.location === "string" ? provider.location : "";
  const about = typeof provider.about === "string" ? provider.about : "";
  const categories = providerCategories(provider);
  const isActive = provider.status === "active" || provider.verified === true;

  const profileLink = id ? `/providers/${id}` : null;

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -8 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.06, 0.36),
        ease: "easeOut",
      }}
      whileHover={{ y: -4 }}
      className="group relative h-full"
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[24px] border border-slate-200/70 bg-white shadow-card transition-all duration-300 hover:border-brand-200 hover:shadow-card-hover dark:border-ink-800 dark:bg-ink-900 dark:hover:border-brand-900">
        <div className="relative">
          <ProviderCover provider={provider} name={name} />

          {/* Saved indicator */}
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-danger-600 shadow-sm backdrop-blur dark:bg-ink-900/85 dark:text-danger-200">
            <Heart aria-hidden="true" className="h-3 w-3 fill-current" />
            Saved
          </span>

          {/* Quick unsave */}
          <button
            type="button"
            onClick={() => id && onUnsave(id, name)}
            disabled={removing || !id}
            aria-label={`Remove ${name} from saved providers`}
            title="Remove from saved"
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/90 text-danger-500 shadow-sm backdrop-blur transition hover:bg-danger-500 hover:text-white focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-ink-900/85 dark:text-danger-300 dark:hover:bg-danger-600 dark:hover:text-white"
          >
            {removing ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <HeartOff aria-hidden="true" className="h-4 w-4" />
            )}
            <span className="sr-only">
              {removing ? "Removing from saved providers" : "Unsave provider"}
            </span>
          </button>

          {/* Avatar */}
          <div className="absolute -bottom-7 left-5 rounded-[20px] bg-white p-1.5 shadow-lg dark:bg-ink-900">
            <ProviderMonogram name={name} src={avatar} />
          </div>
        </div>

        {/* Card body */}
        <div className="flex flex-1 flex-col p-5 pt-10">
          <div className="flex items-start gap-1.5">
            <h3 className="min-w-0 flex-1 truncate text-base font-bold text-slate-900 dark:text-ink-50">
              {name}
            </h3>

            {isActive && (
              <span
                title="Active provider"
                className="mt-0.5 inline-flex shrink-0 items-center"
              >
                <ShieldCheck
                  aria-hidden="true"
                  className="h-4 w-4 text-brand-600 dark:text-brand-400"
                />
                <span className="sr-only">Active provider</span>
              </span>
            )}
          </div>

          <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-500 dark:text-ink-400">
            <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {location || "Not specified"}
            </span>
          </div>

          {categories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-950/60 dark:text-brand-300"
                >
                  {category}
                </span>
              ))}
            </div>
          )}

          <p className="mt-3 line-clamp-2 min-h-[42px] text-sm leading-6 text-slate-500 dark:text-ink-400">
            {about || "Professional service provider on Servicely."}
          </p>

          <div className="mt-auto pt-5">
            {profileLink ? (
              <Link
                to={profileLink}
                className="btn-primary group/cta w-full"
              >
                View Profile
                <ChevronRight
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-0.5"
                />
              </Link>
            ) : (
              <span className="btn-outline w-full cursor-not-allowed opacity-60">
                Profile unavailable
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* =========================================================
   SKELETON GRID
========================================================= */

function SavedProvidersSkeleton() {
  return (
    <div
      aria-busy="true"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      <span className="sr-only">Loading your saved providers…</span>

      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="overflow-hidden rounded-[24px] border border-slate-200/70 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900"
        >
          <div className="h-32 animate-pulse bg-slate-100 dark:bg-ink-800 sm:h-36" />

          <div className="space-y-3 p-5">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="mt-2 h-10 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export function CustomerSaved() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useSavedProviders();
  const toggleSavedProvider = useToggleSavedProvider();

  const [toast, setToast] = useState<ToastState | null>(null);

  const savedProviders = Array.isArray(data?.savedProviders)
    ? data.savedProviders.filter(Boolean)
    : [];

  const count = savedProviders.length;
  const removingId = toggleSavedProvider.isPending
    ? toggleSavedProvider.variables
    : undefined;

  /* Auto-dismiss toast */
  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), 4000);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleUnsave = (id: string, name: string) => {
    toggleSavedProvider.mutate(id, {
      onSuccess: () => {
        setToast({
          type: "success",
          message: `${name} was removed from your saved providers.`,
        });
      },
      onError: (mutationError) => {
        setToast({
          type: "error",
          message:
            getApiErrorMessage(mutationError) ||
            `Could not remove ${name}. Please try again.`,
        });
      },
    });
  };

  const errorMessage = isError
    ? getApiErrorMessage(error)
    : "";

  return (
    <DashboardLayout role="customer" navItems={customerNavItems}>
      <div className="relative space-y-6 pb-10">
        <DashboardHeader
          title="Saved Providers"
          subtitle="Providers you've saved for future bookings"
          action={
            <Link
              to="/customer/browse"
              className="btn-outline hidden w-fit items-center gap-2 sm:inline-flex"
            >
              <Search aria-hidden="true" className="h-4 w-4" />
              Browse providers
            </Link>
          }
        />

        <AnimatePresence mode="wait" initial={false}>
          {/* =========================
              LOADING
          ========================== */}
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <SavedProvidersSkeleton />
            </motion.div>
          )}

          {/* =========================
              ERROR
          ========================== */}
          {!isLoading && isError && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <ErrorState
                message={errorMessage}
                onRetry={() => void refetch()}
              />

              <div className="flex justify-center">
                <Link
                  to="/customer/browse"
                  className="btn-outline inline-flex items-center gap-2"
                >
                  <Search aria-hidden="true" className="h-4 w-4" />
                  Browse providers
                </Link>
              </div>
            </motion.div>
          )}

          {/* =========================
              EMPTY
          ========================== */}
          {!isLoading && !isError && count === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <EmptyState
                icon={Heart}
                title="No saved providers yet"
                description="Discover talented providers, save the ones you love, and easily come back to them when you're ready to book."
                action={
                  <Link
                    to="/customer/browse"
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Search aria-hidden="true" className="h-4 w-4" />
                    Browse Providers
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4"
                    />
                  </Link>
                }
              />
            </motion.div>
          )}

          {/* =========================
              SAVED PROVIDERS
          ========================== */}
          {!isLoading && !isError && count > 0 && (
            <motion.div
              key="providers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Count header */}
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                    <Users aria-hidden="true" className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-ink-50">
                      Your Saved Providers
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-ink-400">
                      People you're interested in booking
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    aria-live="polite"
                    className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200/70 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300"
                  >
                    <Heart
                      aria-hidden="true"
                      className="h-3.5 w-3.5 fill-current text-danger-500"
                    />
                    {count} {count === 1 ? "provider" : "providers"} saved
                  </span>

                  <button
                    type="button"
                    onClick={() => void refetch()}
                    disabled={isFetching}
                    aria-label="Refresh saved providers"
                    title="Refresh"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 bg-white text-slate-500 shadow-sm transition hover:border-brand-200 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-400 dark:hover:border-brand-900 dark:hover:text-brand-300"
                  >
                    <RefreshCw
                      aria-hidden="true"
                      className={cn(
                        "h-4 w-4",
                        isFetching && "animate-spin"
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence initial={false}>
                  {savedProviders.map((provider, index) => {
                    const id = providerId(provider);

                    return (
                      <SavedProviderCard
                        key={id || `saved-${index}`}
                        provider={provider}
                        index={index}
                        removing={
                          Boolean(removingId) && removingId === id
                        }
                        onUnsave={handleUnsave}
                      />
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =========================
            TOAST
        ========================== */}
        <AnimatePresence>
          {toast && (
            <motion.div
              key="toast"
              role={toast.type === "error" ? "alert" : "status"}
              aria-live={toast.type === "error" ? "assertive" : "polite"}
              aria-atomic="true"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed bottom-6 left-4 right-4 z-[60] mx-auto flex max-w-sm items-start gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-xl dark:border-ink-700 dark:bg-ink-900 sm:left-auto sm:right-6 sm:mx-0"
            >
              <span
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  toast.type === "success"
                    ? "bg-success-50 text-success-600 dark:bg-success-600/15 dark:text-success-200"
                    : "bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-200"
                )}
              >
                {toast.type === "success" ? (
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <AlertCircle aria-hidden="true" className="h-4 w-4" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-ink-50">
                  {toast.type === "success"
                    ? "Provider removed"
                    : "Something went wrong"}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-ink-400">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setToast(null)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-ink-800 dark:hover:text-ink-200"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
