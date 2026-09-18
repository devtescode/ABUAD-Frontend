
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  motion,
  AnimatePresence,
} from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Heart,
  ImageIcon,
  Loader2,
  MapPin,
  MessageCircle,
  Share2,
  ShieldCheck,
  Star,
  User,
  Briefcase,
} from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { customerNavItems } from "@/data/customerNavItems";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

/* =========================================================
   TYPES
========================================================= */

type TabType =
  | "services"
  | "portfolio"
  | "reviews"
  | "availability";

interface Provider {
  _id: string;

  fullName?: string;
  name?: string;
  email?: string;

  avatar?: string;
  profileImage?: string;

  categories?: string[];

  bio?: string;
  about?: string;
  location?: string;

  verified?: boolean;

  /*
   * Current User model status:
   * active | pending | suspended
   */
  status?:
  | "active"
  | "pending"
  | "suspended"
  | string;

  rating?: number;
  reviewCount?: number;
  completedBookings?: number;

  portfolio?: PortfolioItem[];
  availability?: Availability[];
  services?: Service[];
}

interface Service {
  _id: string;

  title: string;
  category: string;

  price: number;
  duration: string;
  description: string;

  image: string;

  status?: string;
  createdAt?: string;
}

interface PortfolioItem {
  _id?: string;

  title?: string;
  description?: string;
  image?: string;
  category?: string;
}

interface Availability {
  _id?: string;

  day?: string;
  startTime?: string;
  endTime?: string;

  available?: boolean;
}

interface Review {
  _id: string;

  rating: number;
  comment?: string;

  customer?: {
    _id?: string;
    fullName?: string;
    name?: string;
    avatar?: string;
    profileImage?: string;
  };

  createdAt?: string;
}

interface ProviderProfileResponse {
  success: boolean;
  message?: string;

  provider?: Provider;
  services?: Service[];
  reviews?: Review[];
}

interface ProviderProfileLocationState {
  providerServices?: Service[];
}

interface TabItem {
  id: TabType;
  label: string;
  icon: ReactNode;
}

/* =========================================================
   HELPERS
========================================================= */

const formatNaira = (amount: number) => {
  return `₦${Number(amount || 0).toLocaleString(
    "en-NG"
  )}`;
};

const formatDate = (date?: string) => {
  if (!date) return "";

  try {
    return new Date(date).toLocaleDateString(
      "en-NG",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  } catch {
    return "";
  }
};

const getProviderName = (
  provider?: Provider | null
) => {
  return (
    provider?.fullName ||
    provider?.name ||
    "Service Provider"
  );
};

const getProviderImage = (
  provider?: Provider | null
) => {
  return (
    provider?.avatar ||
    provider?.profileImage ||
    "/images/default-avatar.png"
  );
};

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white px-6 text-center dark:border-ink-800 dark:bg-ink-900">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-50 text-ink-400 dark:bg-ink-800">
        {icon}
      </div>

      <h3 className="mt-4 text-base font-bold text-ink-900 dark:text-white">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-ink-500 dark:text-ink-400">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function ProviderProfilePage() {
  const { id } =
    useParams<{ id: string }>();

  const navigate = useNavigate();

  const location = useLocation();

  const routeServices = useMemo(
    () =>
      (location.state as ProviderProfileLocationState | null)
        ?.providerServices || [],
    [location.state]
  );

  const [provider, setProvider] =
    useState<Provider | null>(null);

  const [services, setServices] =
    useState<Service[]>([]);

  const [reviews, setReviews] =
    useState<Review[]>([]);

  const [activeTab, setActiveTab] =
    useState<TabType>("services");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [saved, setSaved] =
    useState(false);

  const [sharing, setSharing] =
    useState(false);

  /* =========================================================
     TABS
  ========================================================= */

  const tabs: TabItem[] = [
    {
      id: "services",
      label: "Services",
      icon: (
        <Briefcase className="h-4 w-4" />
      ),
    },
    {
      id: "portfolio",
      label: "Portfolio",
      icon: (
        <ImageIcon className="h-4 w-4" />
      ),
    },
    {
      id: "reviews",
      label: "Reviews",
      icon: (
        <Star className="h-4 w-4" />
      ),
    },
    {
      id: "availability",
      label: "Availability",
      icon: (
        <Calendar className="h-4 w-4" />
      ),
    },
  ];

  /* =========================================================
     FETCH PROVIDER PROFILE
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    const fetchProviderProfile = async () => {
      if (!id) {
        setError(
          "Provider profile could not be found."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const token =
          sessionStorage.getItem(
            "servicely_token"
          );

        if (!token) {
          navigate("/login/customer", {
            replace: true,
          });
          return;
        }

        const response = await fetch(
          `${API_URL}/provider/profile/${encodeURIComponent(
            id
          )}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
        console.log(response, "wowwwwww");


        let result: ProviderProfileResponse;

        try {
          result = await response.json();
        } catch {
          throw new Error(
            "The server returned an invalid response."
          );
        }

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
            `Failed to load provider profile. (${response.status})`
          );
        }

        if (!result.provider) {
          throw new Error(
            "Provider profile was not returned by the server."
          );
        }

        if (cancelled) return;

        setProvider(result.provider);

        const profileServices = Array.isArray(
          result.services
        )
          ? result.services
          : Array.isArray(result.provider.services)
            ? result.provider.services
            : [];

        setServices(
          profileServices.length > 0
            ? profileServices
            : routeServices
        );

        setReviews(
          Array.isArray(result.reviews)
            ? result.reviews
            : []
        );
      } catch (err) {
        if (cancelled) return;

        console.error(
          "Fetch provider profile error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load provider profile."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProviderProfile();

    return () => {
      cancelled = true;
    };
  }, [id, navigate, routeServices]);

  /* =========================================================
     ACTIVE SERVICES
  ========================================================= */

  const activeServices = services.filter(
    (service) => service.status !== "rejected"
  );

  /* =========================================================
     PROVIDER DATA
  ========================================================= */

  const providerName =
    getProviderName(provider);

  const providerImage =
    getProviderImage(provider);

  const rating = Number(
    provider?.rating || 0
  );

  const reviewCount = Number(
    provider?.reviewCount ||
    reviews.length ||
    0
  );

  const portfolio =
    provider?.portfolio || [];

  const availability =
    provider?.availability || [];

  /*
   * Provider is considered active when:
   * - backend status is active
   * OR
   * - old verified field is true
   */
  const providerIsActive =
    provider?.status === "active" ||
    provider?.verified === true;

  /* =========================================================
     AVERAGE SERVICE PRICE
  ========================================================= */

  const averageServicePrice =
    useMemo(() => {
      if (!activeServices.length) {
        return 0;
      }

      const total =
        activeServices.reduce(
          (sum, service) =>
            sum +
            Number(service.price || 0),
          0
        );

      return (
        total / activeServices.length
      );
    }, [activeServices]);

  /* =========================================================
     SHARE
  ========================================================= */

  const handleShare = async () => {
    try {
      setSharing(true);

      if (navigator.share) {
        await navigator.share({
          title: `${providerName} - Servicely`,
          text: `Check out ${providerName}'s services on Servicely.`,
          url: window.location.href,
        });
      } else if (
        navigator.clipboard
      ) {
        await navigator.clipboard.writeText(
          window.location.href
        );
      }
    } catch (err) {
      console.log(
        "Share cancelled:",
        err
      );
    } finally {
      setSharing(false);
    }
  };

  /* =========================================================
     LOADING STATE
  ========================================================= */

  if (loading) {
    return (
      <DashboardLayout
        role="customer"
        navItems={customerNavItems}
      >
        <div className="min-h-screen bg-ink-50 px-4 py-8 dark:bg-ink-950 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 h-6 w-32 animate-pulse rounded bg-ink-200 dark:bg-ink-800" />

            <div className="overflow-hidden rounded-3xl border border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900">
              <div className="h-56 animate-pulse bg-ink-100 dark:bg-ink-800" />

              <div className="p-6 sm:p-8">
                <div className="-mt-20 flex flex-col gap-5 sm:flex-row sm:items-end">
                  <div className="h-28 w-28 animate-pulse rounded-full border-4 border-white bg-ink-200 dark:border-ink-900 dark:bg-ink-700" />

                  <div className="flex-1 space-y-3">
                    <div className="h-7 w-64 animate-pulse rounded bg-ink-200 dark:bg-ink-700" />

                    <div className="h-4 w-40 animate-pulse rounded bg-ink-200 dark:bg-ink-700" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              {Array.from({
                length: 3,
              }).map((_, index) => (
                <div
                  key={index}
                  className="h-80 animate-pulse rounded-2xl bg-white dark:bg-ink-900"
                />
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* =========================================================
     ERROR STATE
  ========================================================= */

  if (error || !provider) {
    return (
      <DashboardLayout
        role="customer"
        navItems={customerNavItems}
      >
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-ink-50 px-4 dark:bg-ink-950">
          <div className="w-full max-w-md rounded-3xl border border-ink-100 bg-white p-8 text-center shadow-sm dark:border-ink-800 dark:bg-ink-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-950/40">
              <User className="h-7 w-7" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-ink-900 dark:text-white">
              Provider not found
            </h2>

            <p className="mt-2 text-sm leading-6 text-ink-500 dark:text-ink-400">
              {error ||
                "We could not find the provider profile you are looking for."}
            </p>

            <button
              onClick={() =>
                navigate(-1)
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-800 dark:bg-white dark:text-ink-900 dark:hover:bg-ink-100"
            >
              <ArrowLeft className="h-4 w-4" />

              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <DashboardLayout
      role="customer"
      navItems={customerNavItems}
    >
      <div className="min-h-screen bg-[#f7f8f7] dark:bg-ink-950">
        {/* =================================================
            BACK BUTTON
        ================================================= */}

        <div className="border-b border-ink-100/80 bg-white/80 backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/80">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <button
              onClick={() =>
                navigate(-1)
              }
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-ink-500 transition hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />

              Back
            </button>
          </div>
        </div>

        {/* =================================================
            PROFILE HERO
        ================================================= */}

        <section className="relative overflow-hidden bg-ink-950 dark:bg-ink-900">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(16,185,129,0.42),transparent_28%),radial-gradient(circle_at_90%_80%,rgba(245,158,11,0.16),transparent_24%),linear-gradient(120deg,#071b17_0%,#0c2822_45%,#111827_100%)]" />

            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary-400/20 blur-3xl" />

            <div className="absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-accent-400/10 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pb-12 sm:pt-16 lg:px-8">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              {/* Provider information */}

              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                <div className="relative">
                  <div className="relative flex h-24 w-24 items-center justify-center sm:h-32 sm:w-32">
                    <div className="absolute -inset-1.5 rounded-[1.5rem] bg-gradient-to-br from-primary-300/70 via-white/20 to-accent-300/50 blur-sm sm:-inset-2 sm:rounded-[2rem]" />

                    <img
                      src={providerImage}
                      alt={providerName}
                      onError={(
                        event
                      ) => {
                        if (
                          event.currentTarget
                            .src.endsWith(
                              "/images/default-avatar.png"
                            )
                        ) {
                          return;
                        }

                        event.currentTarget.src =
                          "/images/default-avatar.png";
                      }}
                      className="relative h-24 w-24 rounded-[1.4rem] border-2 border-white/70 object-cover shadow-2xl sm:h-32 sm:w-32 sm:rounded-[1.65rem]"
                    />
                  </div>

                  {providerIsActive && (
                    <div className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-4 border-ink-900 bg-emerald-500 text-white">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  )}
                </div>

                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-white sm:text-4xl">
                      {providerName}
                    </h1>

                    {providerIsActive && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-400/15 px-3 py-1.5 text-xs font-bold text-primary-100 ring-1 ring-primary-300/30">
                        <ShieldCheck className="h-3.5 w-3.5" />

                        Verified
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/75">
                    <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10">
                      <MapPin className="h-4 w-4" />

                      {provider.location ||
                        "ABUAD"}
                    </span>

                    <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10">
                      <Star className="h-4 w-4 fill-current text-yellow-400" />

                      {rating > 0
                        ? rating.toFixed(1)
                        : "New"}

                      {reviewCount > 0 && (
                        <span>
                          ({reviewCount}{" "}
                          reviews)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(
                      provider.categories ||
                      []
                    ).map(
                      (category) => (
                        <span
                          key={category}
                          className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 ring-1 ring-white/10 backdrop-blur"
                        >
                          {category}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}

              <div className="flex flex-wrap items-center gap-2">
                {activeServices.length >
                  0 && (
                    <Link
                      to={`/book/${provider._id}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-400 px-4 py-2.5 text-sm font-extrabold text-primary-950 shadow-lg shadow-primary-950/20 transition hover:bg-primary-300 hover:shadow-primary-950/35"
                    >
                      Book now

                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}

                <button
                  onClick={() =>
                    setSaved(!saved)
                  }
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${saved
                      ? "bg-white text-ink-900 shadow-lg"
                      : "bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/20"
                    }`}
                >
                  <Heart
                    className={`h-4 w-4 ${saved
                        ? "fill-current text-red-500"
                        : ""
                      }`}
                  />

                  {saved
                    ? "Saved"
                    : "Save"}
                </button>

                <button
                  onClick={handleShare}
                  disabled={sharing}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/20 disabled:opacity-60"
                >
                  {sharing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}

                  Share
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            STATS
        ================================================= */}

        <section className="relative z-10 -mt-5 px-4 sm:-mt-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-xl shadow-ink-950/10 backdrop-blur dark:border-ink-700 dark:bg-ink-900/95">
            <div className="grid grid-cols-2 divide-x divide-y divide-ink-100 dark:divide-ink-800 sm:grid-cols-4 sm:divide-y-0">
              <div className="px-4 py-5 text-center sm:px-6">
                <p className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                  {
                    activeServices.length
                  }
                </p>

                <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                  Services
                </p>
              </div>

              <div className="px-4 py-5 text-center sm:px-6">
                <p className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                  {reviewCount}
                </p>

                <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                  Reviews
                </p>
              </div>

              <div className="px-4 py-5 text-center sm:px-6">
                <p className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                  {provider.completedBookings ||
                    0}
                </p>

                <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                  Completed
                </p>
              </div>

              <div className="px-4 py-5 text-center sm:px-6">
                <p className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                  {averageServicePrice >
                    0
                    ? formatNaira(
                      averageServicePrice
                    )
                    : "—"}
                </p>

                <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                  Avg. Service
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            ABOUT
        ================================================= */}

        {(provider.bio ||
          provider.about) && (
            <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
              <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-7">
                <div className="max-w-4xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">
                      <User className="h-4 w-4" />
                    </div>

                    <h2 className="text-lg font-bold text-ink-900 dark:text-white">
                      About {providerName}
                    </h2>
                  </div>

                  <p className="mt-4 text-[15px] leading-7 text-ink-600 dark:text-ink-300">
                    {provider.about ||
                      provider.bio}
                  </p>
                </div>
              </div>
            </section>
          )}

        {/* =================================================
            TABS
        ================================================= */}

        <div className="sticky top-0 z-30 mt-8 border-y border-ink-100 bg-white/90 backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/90">
          <div className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-max gap-2 py-2">
              {tabs.map((tab) => {
                const isActive =
                  activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() =>
                      setActiveTab(tab.id)
                    }
                    className={`relative flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${isActive
                        ? "bg-ink-900 text-white shadow-md dark:bg-white dark:text-ink-900"
                        : "text-ink-500 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-white"
                      }`}
                  >
                    {tab.icon}

                    {tab.label}

                    {tab.id ===
                      "services" &&
                      activeServices.length >
                      0 && (
                        <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                          {
                            activeServices.length
                          }
                        </span>
                      )}

                    {tab.id ===
                      "reviews" &&
                      reviewCount > 0 && (
                        <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                          {reviewCount}
                        </span>
                      )}

                    {isActive && (
                      <motion.div
                        layoutId="provider-profile-tab"
                        className="absolute -bottom-2 left-4 right-4 h-0.5 rounded-full bg-primary-500"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {/* =================================================
                SERVICES
            ================================================= */}

            {activeTab ===
              "services" && (
                <motion.div
                  key="services"
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                >
                  {activeServices.length ===
                    0 ? (
                    <EmptyState
                      icon={
                        <Briefcase className="h-6 w-6" />
                      }
                      title="No services available"
                      description={`${providerName} has not added any services yet.`}
                    />
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {activeServices.map(
                        (
                          service,
                          index
                        ) => (
                          <motion.div
                            key={
                              service._id
                            }
                            initial={{
                              opacity: 0,
                              y: 15,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            transition={{
                              delay:
                                index *
                                0.05,
                            }}
                            className="group overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary-200 hover:shadow-2xl hover:shadow-primary-950/10 dark:border-ink-800 dark:bg-ink-900 dark:hover:border-primary-900"
                          >
                            <div className="relative h-56 overflow-hidden">
                              <img
                                src={
                                  service.image ||
                                  "/images/service-placeholder.png"
                                }
                                alt={
                                  service.title
                                }
                                onError={(
                                  event
                                ) => {
                                  if (
                                    !event.currentTarget
                                      .src.endsWith(
                                        "/images/service-placeholder.png"
                                      )
                                  ) {
                                    event.currentTarget.src =
                                      "/images/service-placeholder.png";
                                  }
                                }}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />

                              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/5 to-transparent" />

                              <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-ink-800 shadow-sm backdrop-blur dark:bg-ink-900/90 dark:text-white">
                                {
                                  service.category
                                }
                              </span>

                              <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white">
                                <Clock className="h-4 w-4" />

                                <span className="text-xs font-medium">
                                  {
                                    service.duration
                                  }
                                </span>
                              </div>
                            </div>

                            <div className="p-5">
                              <h3 className="line-clamp-1 text-lg font-extrabold tracking-tight text-ink-900 dark:text-white">
                                {
                                  service.title
                                }
                              </h3>

                              <p className="mt-2 line-clamp-2 min-h-[40px] text-sm leading-5 text-ink-500 dark:text-ink-400">
                                {
                                  service.description
                                }
                              </p>

                              <div className="mt-5 flex items-end justify-between border-t border-ink-100 pt-4 dark:border-ink-800">
                                <div>
                                  <p className="text-[10px] font-medium uppercase tracking-wider text-ink-400">
                                    Starting
                                    from
                                  </p>

                                  <p className="mt-0.5 text-lg font-bold text-ink-900 dark:text-white">
                                    {formatNaira(
                                      service.price
                                    )}
                                  </p>
                                </div>

                                <Link
                                  to={`/book/${provider._id}?service=${service._id}`}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400"
                                >
                                  Book

                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                              </div>
                            </div>
                          </motion.div>
                        )
                      )}
                    </div>
                  )}
                </motion.div>
              )}

            {/* =================================================
                PORTFOLIO
            ================================================= */}

            {activeTab ===
              "portfolio" && (
                <motion.div
                  key="portfolio"
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                >
                  {portfolio.length ===
                    0 ? (
                    <EmptyState
                      icon={
                        <ImageIcon className="h-6 w-6" />
                      }
                      title="No portfolio yet"
                      description={`${providerName} has not added portfolio items yet.`}
                    />
                  ) : (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {portfolio.map(
                        (
                          item,
                          index
                        ) => (
                          <motion.div
                            key={
                              item._id ||
                              `${item.title}-${index}`
                            }
                            initial={{
                              opacity: 0,
                              y: 15,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            transition={{
                              delay:
                                index *
                                0.05,
                            }}
                            className="group overflow-hidden rounded-2xl border border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900"
                          >
                            {item.image ? (
                              <div className="relative h-64 overflow-hidden">
                                <img
                                  src={
                                    item.image
                                  }
                                  alt={
                                    item.title ||
                                    "Portfolio"
                                  }
                                  onError={(
                                    event
                                  ) => {
                                    event.currentTarget.style.display =
                                      "none";
                                  }}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />

                                {item.category && (
                                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-ink-800">
                                    {
                                      item.category
                                    }
                                  </span>
                                )}

                                {item.title && (
                                  <div className="absolute bottom-4 left-4 right-4">
                                    <h3 className="font-bold text-white">
                                      {
                                        item.title
                                      }
                                    </h3>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex h-64 items-center justify-center bg-ink-50 dark:bg-ink-800">
                                <ImageIcon className="h-10 w-10 text-ink-300" />
                              </div>
                            )}

                            {item.description && (
                              <div className="p-4">
                                <p className="text-sm leading-6 text-ink-500 dark:text-ink-400">
                                  {
                                    item.description
                                  }
                                </p>
                              </div>
                            )}
                          </motion.div>
                        )
                      )}
                    </div>
                  )}
                </motion.div>
              )}

            {/* =================================================
                REVIEWS
            ================================================= */}

            {activeTab ===
              "reviews" && (
                <motion.div
                  key="reviews"
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                >
                  {reviews.length ===
                    0 ? (
                    <EmptyState
                      icon={
                        <Star className="h-6 w-6" />
                      }
                      title="No reviews yet"
                      description="Reviews from customers will appear here after completed bookings."
                    />
                  ) : (
                    <div className="grid gap-5 lg:grid-cols-3">
                      {/* Rating summary */}

                      <div className="rounded-2xl border border-ink-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-900">
                        <p className="text-sm font-semibold text-ink-500 dark:text-ink-400">
                          Overall rating
                        </p>

                        <div className="mt-3 flex items-end gap-3">
                          <span className="text-5xl font-bold tracking-tight text-ink-900 dark:text-white">
                            {rating > 0
                              ? rating.toFixed(
                                1
                              )
                              : "0.0"}
                          </span>

                          <div className="pb-2">
                            <div className="flex gap-1">
                              {Array.from({
                                length: 5,
                              }).map(
                                (
                                  _,
                                  index
                                ) => (
                                  <Star
                                    key={
                                      index
                                    }
                                    className={`h-4 w-4 ${index <
                                        Math.round(
                                          rating
                                        )
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-ink-200 dark:text-ink-700"
                                      }`}
                                  />
                                )
                              )}
                            </div>

                            <p className="mt-1 text-xs text-ink-400">
                              {
                                reviewCount
                              }{" "}
                              reviews
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Reviews */}

                      <div className="space-y-4 lg:col-span-2">
                        {reviews.map(
                          (
                            review,
                            index
                          ) => {
                            const customerName =
                              review
                                .customer
                                ?.fullName ||
                              review
                                .customer
                                ?.name ||
                              "Customer";

                            const customerImage =
                              review
                                .customer
                                ?.avatar ||
                              review
                                .customer
                                ?.profileImage ||
                              "/images/default-avatar.png";

                            return (
                              <motion.div
                                key={
                                  review._id
                                }
                                initial={{
                                  opacity: 0,
                                  y: 10,
                                }}
                                animate={{
                                  opacity: 1,
                                  y: 0,
                                }}
                                transition={{
                                  delay:
                                    index *
                                    0.05,
                                }}
                                className="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={
                                        customerImage
                                      }
                                      alt={
                                        customerName
                                      }
                                      onError={(
                                        event
                                      ) => {
                                        event.currentTarget.src =
                                          "/images/default-avatar.png";
                                      }}
                                      className="h-10 w-10 rounded-full object-cover"
                                    />

                                    <div>
                                      <p className="text-sm font-bold text-ink-900 dark:text-white">
                                        {
                                          customerName
                                        }
                                      </p>

                                      {review.createdAt && (
                                        <p className="mt-0.5 text-xs text-ink-400">
                                          {formatDate(
                                            review.createdAt
                                          )}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 rounded-lg bg-yellow-50 px-2.5 py-1.5 dark:bg-yellow-950/30">
                                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />

                                    <span className="text-xs font-bold text-yellow-700 dark:text-yellow-300">
                                      {
                                        review.rating
                                      }
                                    </span>
                                  </div>
                                </div>

                                {review.comment && (
                                  <p className="mt-4 text-sm leading-6 text-ink-600 dark:text-ink-300">
                                    {
                                      review.comment
                                    }
                                  </p>
                                )}
                              </motion.div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

            {/* =================================================
                AVAILABILITY
            ================================================= */}

            {activeTab ===
              "availability" && (
                <motion.div
                  key="availability"
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                >
                  {availability.length ===
                    0 ? (
                    <EmptyState
                      icon={
                        <Calendar className="h-6 w-6" />
                      }
                      title="Availability not added"
                      description={`${providerName} has not provided their availability schedule yet.`}
                    />
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {availability.map(
                        (
                          slot,
                          index
                        ) => (
                          <motion.div
                            key={
                              slot._id ||
                              `${slot.day}-${index}`
                            }
                            initial={{
                              opacity: 0,
                              y: 10,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            transition={{
                              delay:
                                index *
                                0.05,
                            }}
                            className="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-bold text-ink-900 dark:text-white">
                                  {slot.day ||
                                    "Available"}
                                </p>

                                {slot.startTime &&
                                  slot.endTime && (
                                    <div className="mt-2 flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400">
                                      <Clock className="h-4 w-4" />

                                      {
                                        slot.startTime
                                      }

                                      {" - "}

                                      {
                                        slot.endTime
                                      }
                                    </div>
                                  )}
                              </div>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${slot.available ===
                                    false
                                    ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300"
                                    : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300"
                                  }`}
                              >
                                {slot.available ===
                                  false
                                  ? "Unavailable"
                                  : "Available"}
                              </span>
                            </div>
                          </motion.div>
                        )
                      )}
                    </div>
                  )}
                </motion.div>
              )}
          </AnimatePresence>
        </main>

        {/* =================================================
            BOTTOM CTA
        ================================================= */}

        {activeServices.length >
          0 && (
            <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
              <div className="relative overflow-hidden rounded-3xl bg-ink-950 px-6 py-10 text-center shadow-2xl shadow-ink-950/20 dark:bg-ink-800 sm:px-10 sm:py-12">
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-400/25 blur-2xl" />

                <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-accent-400/15 blur-2xl" />

                <div className="relative">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-400/20 text-primary-200 ring-1 ring-primary-300/30">
                    <MessageCircle className="h-5 w-5" />
                  </div>

                  <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    Ready to work with{" "}
                    {providerName}?
                  </h2>

                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/60">
                    Choose a service and
                    send a booking request.
                    You can discuss the
                    details with the provider
                    before confirming.
                  </p>

                  <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link
                      to={`/book/${provider._id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-400 px-6 py-3 text-sm font-extrabold text-primary-950 shadow-lg transition hover:bg-primary-300"
                    >
                      Book a Service

                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    <button
                      onClick={() =>
                        setActiveTab(
                          "services"
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/15"
                    >
                      View Services
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
      </div>
    </DashboardLayout>
  );
}
