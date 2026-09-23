import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type SyntheticEvent,
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
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Heart,
  ImageIcon,
  Loader2,
  MapPin,
  Maximize2,
  MessageCircle,
  Share2,
  ShieldCheck,
  Star,
  Tag,
  User,
  Briefcase,
  X,
} from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { customerNavItems } from "@/data/customerNavItems";
import { useBookings } from "@/context/AppContext";

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

  status?:
  | "active"
  | "pending"
  | "suspended"
  | string;

  rating?: number;
  reviewCount?: number;
  completedBookings?: number;

  portfolio?: PortfolioItem[];
  portfolioItems?: PortfolioItem[];

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
  imageUrl?: string;

  images?: string[];

  category?: string;

  tags?: string[];

  link?: string;
  url?: string;

  createdAt?: string;
  updatedAt?: string;

  providerId?: string | { _id?: string };

  userId?: string | { _id?: string };

  provider?: {
    _id?: string;
    fullName?: string;
    name?: string;
  };

  user?: {
    _id?: string;
    fullName?: string;
    name?: string;
  };
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

interface PortfolioResponse {
  success?: boolean;
  message?: string;

  count?: number;

  portfolio?: PortfolioItem[];
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

const getPortfolioImage = (
  item: PortfolioItem
) => {
  return (
    item.image ||
    item.imageUrl ||
    item.images?.[0] ||
    ""
  );
};

const getPortfolioImages = (
  item: PortfolioItem
) => {
  const images: string[] = [];

  if (item.image) {
    images.push(item.image);
  }

  if (
    item.imageUrl &&
    !images.includes(item.imageUrl)
  ) {
    images.push(item.imageUrl);
  }

  if (Array.isArray(item.images)) {
    item.images.forEach((image) => {
      if (
        image &&
        !images.includes(image)
      ) {
        images.push(image);
      }
    });
  }

  return images;
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
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-ink-200 bg-white px-6 text-center shadow-sm dark:border-ink-800 dark:bg-ink-900">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-50 text-ink-400 dark:bg-ink-800">
        {icon}
      </div>

      <h3 className="mt-5 text-base font-bold text-ink-900 dark:text-white">
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

  /* =========================================================
     SAVED PROVIDERS
  ========================================================= */

  const {
    savedProviders,
    toggleSavedProvider,
  } = useBookings();

  const routeServices = useMemo(
    () =>
      (
        location.state as
        | ProviderProfileLocationState
        | null
      )?.providerServices || [],
    [location.state]
  );

  /* =========================================================
     STATE
  ========================================================= */

  const [provider, setProvider] =
    useState<Provider | null>(null);

  const [services, setServices] =
    useState<Service[]>([]);

  const [reviews, setReviews] =
    useState<Review[]>([]);

  const [portfolioItems, setPortfolioItems] =
    useState<PortfolioItem[]>([]);

  const [activeTab, setActiveTab] =
    useState<TabType>("services");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [portfolioLoading, setPortfolioLoading] =
    useState(false);

  const [portfolioError, setPortfolioError] =
    useState("");

  const [savingProvider, setSavingProvider] =
    useState(false);

  const [sharing, setSharing] =
    useState(false);

  const [portfolioFilter, setPortfolioFilter] =
    useState("All");

  const [
    selectedPortfolioIndex,
    setSelectedPortfolioIndex,
  ] = useState<number | null>(null);

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

        let result: ProviderProfileResponse;

        try {
          result = await response.json();
        } catch {
          throw new Error(
            "The server returned an invalid response."
          );
        }

        if (
          !response.ok ||
          !result.success
        ) {
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

        const profileServices =
          Array.isArray(result.services)
            ? result.services
            : Array.isArray(
              result.provider.services
            )
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
     FETCH THIS PROVIDER'S PORTFOLIO
     
     IMPORTANT:
     
     We are NOT using:
     
       /portfolio/allportfolio
     
     We are using:
     
       /portfolio/provider/:providerId
     
     This matches the new backend controller.
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    const fetchProviderPortfolio = async () => {
      if (!id) return;

      try {
        setPortfolioLoading(true);
        setPortfolioError("");

        const token =
          sessionStorage.getItem(
            "servicely_token"
          );

        if (!token) {
          return;
        }

        const portfolioUrl =
          `${API_URL}/portfolio/provider/${encodeURIComponent(
            id
          )}`;

        console.log(
          "Fetching provider portfolio from:",
          portfolioUrl
        );

        const response = await fetch(
          portfolioUrl,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        let result: PortfolioResponse;

        try {
          result = await response.json();
        } catch {
          throw new Error(
            "The portfolio server returned an invalid response."
          );
        }

        console.log(
          "Provider portfolio response:",
          result
        );

        if (
          !response.ok ||
          result.success === false
        ) {
          throw new Error(
            result.message ||
            `Failed to load portfolio. (${response.status})`
          );
        }

        if (cancelled) return;

        const portfolio = Array.isArray(
          result.portfolio
        )
          ? result.portfolio
          : [];

        /*
         * Backend already filters by provider.
         *
         * We therefore DO NOT need to filter
         * every portfolio on the frontend.
         */

        portfolio.sort((a, b) => {
          if (
            !a.createdAt ||
            !b.createdAt
          ) {
            return 0;
          }

          return (
            new Date(
              b.createdAt
            ).getTime() -
            new Date(
              a.createdAt
            ).getTime()
          );
        });

        setPortfolioItems(portfolio);
      } catch (err) {
        if (cancelled) return;

        console.error(
          "Fetch provider portfolio error:",
          err
        );

        setPortfolioError(
          err instanceof Error
            ? err.message
            : "Failed to load provider portfolio."
        );

        setPortfolioItems([]);
      } finally {
        if (!cancelled) {
          setPortfolioLoading(false);
        }
      }
    };

    fetchProviderPortfolio();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /* =========================================================
     ACTIVE SERVICES
  ========================================================= */

  const activeServices = services.filter(
    (service) =>
      service.status !== "rejected"
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

  const availability =
    provider?.availability || [];

  const providerIsActive =
    provider?.status === "active" ||
    provider?.verified === true;

  /* =========================================================
     SAVED PROVIDER STATUS
  ========================================================= */

  const isSaved = provider?._id
    ? savedProviders.some(
      (providerId) =>
        String(providerId) ===
        String(provider._id)
    )
    : false;

  /* =========================================================
     SAVE / UNSAVE PROVIDER
  ========================================================= */

  const handleSaveProvider = async () => {
    if (
      !provider?._id ||
      savingProvider
    ) {
      return;
    }

    try {
      setSavingProvider(true);

      await toggleSavedProvider(
        provider._id
      );
    } catch (error) {
      console.error(
        "Save provider error:",
        error
      );
    } finally {
      setSavingProvider(false);
    }
  };

  /* =========================================================
     PORTFOLIO CATEGORIES
  ========================================================= */

  const portfolioCategories =
    useMemo(() => {
      const categories =
        portfolioItems
          .map((item) =>
            item.category?.trim()
          )
          .filter(Boolean) as string[];

      return [
        "All",
        ...Array.from(
          new Set(categories)
        ),
      ];
    }, [portfolioItems]);

  /* =========================================================
     FILTERED PORTFOLIO
  ========================================================= */

  const filteredPortfolio =
    useMemo(() => {
      if (
        portfolioFilter === "All"
      ) {
        return portfolioItems;
      }

      return portfolioItems.filter(
        (item) =>
          item.category?.trim() ===
          portfolioFilter
      );
    }, [
      portfolioItems,
      portfolioFilter,
    ]);

  /* =========================================================
     RESET INVALID FILTER
  ========================================================= */

  useEffect(() => {
    if (
      !portfolioCategories.includes(
        portfolioFilter
      )
    ) {
      setPortfolioFilter("All");
    }
  }, [
    portfolioCategories,
    portfolioFilter,
  ]);

  /* =========================================================
     SELECTED PORTFOLIO
  ========================================================= */

  const selectedPortfolio =
    selectedPortfolioIndex !== null
      ? filteredPortfolio[
      selectedPortfolioIndex
      ] || null
      : null;

  /* =========================================================
     CLOSE MODAL
  ========================================================= */

  const closePortfolioModal = () => {
    setSelectedPortfolioIndex(null);
  };

  /* =========================================================
     KEYBOARD CONTROLS
  ========================================================= */

  useEffect(() => {
    if (
      selectedPortfolioIndex === null
    ) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        setSelectedPortfolioIndex(null);
      }

      if (
        event.key === "ArrowRight" &&
        filteredPortfolio.length > 1
      ) {
        setSelectedPortfolioIndex(
          (current) => {
            if (current === null) {
              return 0;
            }

            return (
              (current + 1) %
              filteredPortfolio.length
            );
          }
        );
      }

      if (
        event.key === "ArrowLeft" &&
        filteredPortfolio.length > 1
      ) {
        setSelectedPortfolioIndex(
          (current) => {
            if (current === null) {
              return 0;
            }

            return (
              (current -
                1 +
                filteredPortfolio.length) %
              filteredPortfolio.length
            );
          }
        );
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    selectedPortfolioIndex,
    filteredPortfolio.length,
  ]);

  /* =========================================================
     NEXT PORTFOLIO
  ========================================================= */

  const showNextPortfolio = () => {
    if (
      filteredPortfolio.length <= 1
    ) {
      return;
    }

    setSelectedPortfolioIndex(
      (current) => {
        if (current === null) {
          return 0;
        }

        return (
          (current + 1) %
          filteredPortfolio.length
        );
      }
    );
  };

  /* =========================================================
     PREVIOUS PORTFOLIO
  ========================================================= */

  const showPreviousPortfolio = () => {
    if (
      filteredPortfolio.length <= 1
    ) {
      return;
    }

    setSelectedPortfolioIndex(
      (current) => {
        if (current === null) {
          return 0;
        }

        return (
          (current -
            1 +
            filteredPortfolio.length) %
          filteredPortfolio.length
        );
      }
    );
  };

  /* =========================================================
     IMAGE ERROR
  ========================================================= */

  const handlePortfolioImageError = (
    event: SyntheticEvent<HTMLImageElement>
  ) => {
    const image =
      event.currentTarget;

    if (
      image.dataset.fallback ===
      "true"
    ) {
      return;
    }

    image.dataset.fallback = "true";

    image.src =
      "/images/service-placeholder.png";
  };

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
            Number(
              service.price || 0
            ),
          0
        );

      return (
        total /
        activeServices.length
      );
    }, [activeServices]);

  const [selectedServiceImage, setSelectedServiceImage] = useState<{
    image: string;
    title: string;
  } | null>(null);

  /* =========================================================
     SHARE
  ========================================================= */

  const handleShare = async () => {
    try {
      setSharing(true);

      if (navigator.share) {
        await navigator.share({
          title: `${providerName} - Servicely`,
          text: `Check out ${providerName}'s services and portfolio on Servicely.`,
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

              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                <div className="relative h-24 w-24 sm:h-32 sm:w-32">
                  {/* Glow */}
                  <div
                    className="
                      absolute
                      -inset-1.5
                      rounded-[1.5rem]
                      bg-gradient-to-br
                      from-primary-300/70
                      via-white/20
                      to-accent-300/50
                      blur-sm
                      sm:-inset-2
                      sm:rounded-[2rem]
                    "
                  />

                  {/* Profile Image */}
                  <img
                    src={providerImage}
                    alt={providerName}
                    onError={(event) => {
                      if (
                        event.currentTarget.src.endsWith(
                          "/images/default-avatar.png"
                        )
                      ) {
                        return;
                      }

                      event.currentTarget.src =
                        "/images/default-avatar.png";
                    }}
                    className="
                      relative
                      h-24
                      w-24
                      rounded-[1.4rem]
                      border-2
                      border-white/70
                      object-cover
                      shadow-2xl
                      sm:h-32
                      sm:w-32
                      sm:rounded-[1.65rem]
                    "
                  />

                  {/* Active / Verified Circle */}
                  {providerIsActive && (
                    <div
                      className="
                        absolute
                        bottom-0
                        right-0
                        z-10
                        flex
                        h-8
                        w-8
                        translate-x-1/4
                        translate-y-1/4
                        items-center
                        justify-center
                        rounded-full
                        border-[3px]
                        border-ink-900
                        bg-emerald-500
                        text-white
                        shadow-lg
                        sm:h-9
                        sm:w-9
                        sm:border-4
                        sm:translate-x-1/4
                        sm:translate-y-1/4
                      "
                    >
                      <CheckCircle2 className="h-4 w-4 sm:h-4 sm:w-4" />
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
                        "Not specified"}
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

              <div className="flex flex-wrap items-center gap-2">
                {activeServices.length >
                  0 && (
                    <Link
                      to={`/book/${provider._id}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-400 px-4 py-2.5 text-sm font-extrabold text-primary-950 shadow-lg shadow-primary-950/20 transition hover:bg-primary-300"
                    >
                      Book now
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}

                {/* =================================================
                    SAVE PROVIDER
                ================================================= */}

                <button
                  type="button"
                  onClick={handleSaveProvider}
                  disabled={savingProvider}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    isSaved
                      ? "bg-white text-ink-900 shadow-lg"
                      : "bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/20"
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  {savingProvider ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Heart
                      className={`h-4 w-4 ${
                        isSaved
                          ? "fill-current text-red-500"
                          : ""
                      }`}
                    />
                  )}

                  {savingProvider
                    ? "Saving..."
                    : isSaved
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
                  {activeServices.length}
                </p>

                <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                  Services
                </p>
              </div>

              <div className="px-4 py-5 text-center sm:px-6">
                <p className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                  {portfolioItems.length}
                </p>

                <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                  Portfolio
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
                      "portfolio" &&
                      portfolioItems.length >
                      0 && (
                        <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                          {
                            portfolioItems.length
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

            {activeTab === "services" && (
              <motion.div
                key="services"
                initial={{
                  opacity: 0,
                  y: 12,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -12,
                }}
                transition={{
                  duration: 0.25,
                }}
              >
                {activeServices.length === 0 ? (
                  <div className="relative overflow-hidden rounded-[28px] border border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900">
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-400/10 blur-3xl" />

                    <div className="relative px-6 py-16 text-center sm:px-10 sm:py-20">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-300">
                        <Briefcase className="h-7 w-7" />
                      </div>

                      <h3 className="mt-6 text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                        No services available
                      </h3>

                      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-500 dark:text-ink-400">
                        {providerName} has not added any services yet.
                        Available services will appear here once they are
                        published.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      {activeServices.map((service, index) => {
                        const serviceImage =
                          service.image ||
                          "/images/service-placeholder.png";

                        return (
                          <motion.article
                            key={service._id}
                            initial={{
                              opacity: 0,
                              y: 20,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            transition={{
                              delay: index * 0.06,
                              duration: 0.4,
                            }}
                            className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[28px] border border-ink-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary-200 hover:shadow-2xl hover:shadow-primary-950/10 dark:border-ink-800 dark:bg-ink-900 dark:hover:border-primary-900"
                          >
                            <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-ink-100 dark:bg-ink-800">
                              <img
                                src={serviceImage}
                                alt={service.title}
                                onError={(event) => {
                                  if (
                                    !event.currentTarget.src.endsWith(
                                      "/images/service-placeholder.png"
                                    )
                                  ) {
                                    event.currentTarget.src =
                                      "/images/service-placeholder.png";
                                  }
                                }}
                                className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110"
                              />

                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                              <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
                                <span className="inline-flex max-w-[65%] items-center gap-1.5 truncate rounded-full border border-white/20 bg-white/95 px-3 py-1.5 text-xs font-bold text-ink-800 shadow-lg backdrop-blur-md dark:bg-ink-900/90 dark:text-white">
                                  <Briefcase className="h-3 w-3 shrink-0" />

                                  <span className="truncate">
                                    {service.category || "Service"}
                                  </span>
                                </span>

                                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-emerald-500/90 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-lg backdrop-blur-md">
                                  <span className="h-1.5 w-1.5 rounded-full bg-white" />

                                  Available
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedServiceImage({
                                    image: serviceImage,
                                    title: service.title,
                                  })
                                }
                                className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-2.5 text-xs font-bold text-white opacity-0 shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-black/60 group-hover:opacity-100"
                              >
                                <Maximize2 className="h-4 w-4" />

                                View image
                              </button>

                              <button
                                type="button"
                                aria-label={`View ${service.title} image`}
                                onClick={() =>
                                  setSelectedServiceImage({
                                    image: serviceImage,
                                    title: service.title,
                                  })
                                }
                                className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-black/50"
                              >
                                <Maximize2 className="h-4 w-4" />
                              </button>

                              <div className="absolute bottom-4 left-4 right-16">
                                <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
                                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 backdrop-blur-md">
                                    <Clock className="h-3.5 w-3.5" />
                                  </span>

                                  <span>
                                    {service.duration ||
                                      "Flexible duration"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-1 flex-col p-5 sm:p-6">
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-400">
                                {service.category || "Professional service"}
                              </p>

                              <h3 className="mt-2 line-clamp-2 text-xl font-extrabold leading-tight tracking-tight text-ink-900 dark:text-white">
                                {service.title}
                              </h3>

                              <p className="mt-3 line-clamp-3 min-h-[72px] text-sm leading-6 text-ink-500 dark:text-ink-400">
                                {service.description ||
                                  "Professional service tailored to your needs."}
                              </p>

                              <div className="mt-0 rounded-2xl bg-ink-50 p-4 dark:bg-ink-800/70">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">
                                      Starting from
                                    </p>

                                    <p className="mt-1 truncate text-2xl font-black tracking-tight text-ink-900 dark:text-white">
                                      {formatNaira(service.price)}
                                    </p>
                                  </div>

                                  <div className="flex shrink-0 flex-col items-end">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">
                                      Duration
                                    </p>

                                    <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-ink-700 dark:text-ink-200">
                                      <Clock className="h-3.5 w-3.5 text-primary-500" />

                                      <span className="max-w-[100px] truncate">
                                        {service.duration ||
                                          "Flexible"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 grid grid-cols-[auto_1fr] gap-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedServiceImage({
                                      image: serviceImage,
                                      title: service.title,
                                    })
                                  }
                                  className="flex items-center justify-center gap-2 rounded-2xl border border-ink-200 bg-white px-4 py-3.5 text-xs font-bold text-ink-700 transition-all hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:border-primary-700 dark:hover:bg-primary-950/40 dark:hover:text-primary-300"
                                >
                                  <ImageIcon className="h-4 w-4" />

                                  <span className="hidden sm:inline">
                                    Image
                                  </span>
                                </button>

                                <Link
                                  to={`/book/${provider._id}?service=${service._id}`}
                                  className="flex items-center justify-center gap-2 rounded-2xl bg-ink-900 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-ink-950/10 transition-all duration-300 hover:bg-primary-600 hover:shadow-xl hover:shadow-primary-600/20 active:scale-[0.98] dark:bg-white dark:text-ink-900 dark:hover:bg-primary-400"
                                >
                                  <span>
                                    Book this service
                                  </span>

                                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                </Link>
                              </div>

                              <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-medium text-ink-400">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />

                                Secure booking through Servicely
                              </div>
                            </div>
                          </motion.article>
                        );
                      })}
                    </div>

                    <div className="flex justify-center pt-1">
                      <div className="inline-flex items-center gap-2 rounded-full border border-ink-100 bg-white px-4 py-2.5 text-xs font-medium text-ink-400 shadow-sm dark:border-ink-800 dark:bg-ink-900">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />

                        <span>
                          Showing{" "}
                          <span className="font-bold text-ink-700 dark:text-ink-200">
                            {activeServices.length}
                          </span>{" "}
                          {activeServices.length === 1
                            ? "service"
                            : "services"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            <AnimatePresence>
              {selectedServiceImage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md sm:p-6"
                  onClick={() => setSelectedServiceImage(null)}
                >
                  <button
                    type="button"
                    aria-label="Close image viewer"
                    onClick={() => setSelectedServiceImage(null)}
                    className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-xl transition hover:bg-white/20 sm:right-6 sm:top-6"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <motion.div
                    initial={{
                      opacity: 0,
                      scale: 0.94,
                      y: 15,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.94,
                      y: 15,
                    }}
                    transition={{
                      duration: 0.25,
                    }}
                    className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-ink-950 shadow-2xl"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black">
                      <img
                        src={selectedServiceImage.image}
                        alt={selectedServiceImage.title}
                        className="max-h-[75vh] w-full object-contain"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t border-white/10 bg-ink-950 px-5 py-4 sm:px-6">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
                          Service image
                        </p>

                        <h3 className="mt-1 truncate text-sm font-bold text-white sm:text-base">
                          {selectedServiceImage.title}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedServiceImage(null)}
                        className="shrink-0 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* =================================================
                PORTFOLIO
            ================================================= */}

            {activeTab === "portfolio" && (
              <motion.div
                key="portfolio"
                initial={{
                  opacity: 0,
                  y: 12,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -12,
                }}
                transition={{
                  duration: 0.25,
                }}
              >
                {portfolioLoading ? (
                  <div className="space-y-7">
                    <div className="rounded-3xl border border-ink-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-900 sm:p-7">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-3">
                          <div className="h-7 w-52 animate-pulse rounded-lg bg-ink-100 dark:bg-ink-800" />
                          <div className="h-4 w-80 max-w-full animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
                        </div>

                        <div className="h-10 w-28 animate-pulse rounded-xl bg-ink-100 dark:bg-ink-800" />
                      </div>
                    </div>

                    <div className="flex gap-2 overflow-hidden">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div
                          key={index}
                          className="h-10 w-24 shrink-0 animate-pulse rounded-full bg-ink-100 dark:bg-ink-800"
                        />
                      ))}
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div
                          key={index}
                          className="overflow-hidden rounded-3xl border border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900"
                        >
                          <div className="aspect-[4/3] animate-pulse bg-ink-100 dark:bg-ink-800" />

                          <div className="space-y-3 p-5">
                            <div className="h-5 w-2/3 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />

                            <div className="h-4 w-full animate-pulse rounded bg-ink-100 dark:bg-ink-800" />

                            <div className="h-4 w-4/5 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : portfolioError ? (
                  <EmptyState
                    icon={
                      <ImageIcon className="h-6 w-6" />
                    }
                    title="Portfolio unavailable"
                    description={portfolioError}
                  />
                ) : portfolioItems.length === 0 ? (
                  <div className="overflow-hidden rounded-3xl border border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900">
                    <div className="relative px-6 py-14 text-center sm:px-10 sm:py-20">
                      <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-primary-400/10 blur-3xl" />

                      <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-50 text-ink-400 dark:bg-ink-800 dark:text-ink-500">
                        <ImageIcon className="h-7 w-7" />
                      </div>

                      <h3 className="relative mt-5 text-xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                        No portfolio yet
                      </h3>

                      <p className="relative mx-auto mt-2 max-w-md text-sm leading-6 text-ink-500 dark:text-ink-400">
                        {providerName} has not added any portfolio
                        posts yet. Their completed work will appear
                        here when available.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-7">
                    <div className="relative overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm dark:border-ink-800 dark:bg-ink-900">
                      <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary-400/10 blur-3xl" />

                      <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-accent-400/10 blur-3xl" />

                      <div className="relative flex flex-col gap-6 p-3 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">
                            <ImageIcon className="h-5 w-5" />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-xl font-extrabold tracking-tight text-ink-900 dark:text-white sm:text-2xl">
                                {providerName}'s Portfolio
                              </h2>

                              <span className="rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-bold text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                                {portfolioItems.length}{" "}
                                {portfolioItems.length === 1
                                  ? "project"
                                  : "projects"}
                              </span>
                            </div>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500 dark:text-ink-400">
                              Explore previous work, creative projects,
                              and examples of what {providerName} can
                              deliver.
                            </p>
                          </div>
                        </div>

                        <div className="hidden items-center gap-3 sm:flex">
                          <div className="h-11 w-11 overflow-hidden rounded-full border-2 border-white shadow-md dark:border-ink-700">
                            <img
                              src={providerImage}
                              alt={providerName}
                              onError={(event) => {
                                event.currentTarget.src =
                                  "/images/default-avatar.png";
                              }}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div>
                            <p className="text-xs font-medium text-ink-400">
                              Portfolio by
                            </p>

                            <p className="text-sm font-bold text-ink-900 dark:text-white">
                              {providerName}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {portfolioCategories.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {portfolioCategories.map((category) => {
                          const active =
                            portfolioFilter === category;

                          return (
                            <button
                              key={category}
                              type="button"
                              onClick={() => {
                                setPortfolioFilter(category);
                                setSelectedPortfolioIndex(null);
                              }}
                              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${active
                                ? "bg-ink-900 text-white shadow-md shadow-ink-950/10 dark:bg-white dark:text-ink-900"
                                : "border border-ink-200 bg-white text-ink-600 hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-700 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300 dark:hover:border-primary-700 dark:hover:bg-primary-950/20 dark:hover:text-primary-300"
                                }`}
                            >
                              {category !== "All" && (
                                <Tag className="h-3.5 w-3.5" />
                              )}

                              {category}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {filteredPortfolio.length === 0 ? (
                      <EmptyState
                        icon={
                          <Tag className="h-6 w-6" />
                        }
                        title="No work in this category"
                        description={`There are no portfolio posts from ${providerName} under "${portfolioFilter}".`}
                      />
                    ) : (
                      <>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                          {filteredPortfolio.map((item, index) => {
                            const image =
                              getPortfolioImage(item);

                            const tags = Array.isArray(
                              item.tags
                            )
                              ? item.tags.filter(Boolean)
                              : [];

                            return (
                              <motion.article
                                key={
                                  item._id ||
                                  `${item.title}-${index}`
                                }
                                initial={{
                                  opacity: 0,
                                  y: 18,
                                }}
                                animate={{
                                  opacity: 1,
                                  y: 0,
                                }}
                                transition={{
                                  delay: index * 0.05,
                                  duration: 0.35,
                                }}
                                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl hover:shadow-ink-950/10 dark:border-ink-800 dark:bg-ink-900 dark:hover:border-primary-900"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedPortfolioIndex(
                                      index
                                    )
                                  }
                                  className="relative block aspect-[4/3] w-full shrink-0 overflow-hidden bg-ink-100 text-left dark:bg-ink-800"
                                >
                                  {image ? (
                                    <img
                                      src={image}
                                      alt={
                                        item.title ||
                                        `${providerName} portfolio`
                                      }
                                      onError={
                                        handlePortfolioImageError
                                      }
                                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-ink-100 via-white to-primary-50 text-ink-300 dark:from-ink-900 dark:via-ink-800 dark:to-ink-900">
                                      <ImageIcon className="h-10 w-10" />

                                      <span className="mt-3 text-xs font-semibold text-ink-400">
                                        No image available
                                      </span>
                                    </div>
                                  )}

                                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90" />

                                  {item.category && (
                                    <span className="absolute left-4 top-4 inline-flex max-w-[calc(100%-5rem)] items-center gap-1.5 truncate rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-ink-800 shadow-lg backdrop-blur-md dark:bg-ink-900/90 dark:text-white">
                                      <Tag className="h-3 w-3 shrink-0" />

                                      <span className="truncate">
                                        {item.category}
                                      </span>
                                    </span>
                                  )}

                                  <span className="absolute right-4 top-4 flex h-10 w-10 translate-y-1 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                                    <Maximize2 className="h-4 w-4" />
                                  </span>

                                  <div className="absolute bottom-0 left-0 right-0 p-5">
                                    {item.title && (
                                      <h3 className="line-clamp-2 text-lg font-extrabold tracking-tight text-white">
                                        {item.title}
                                      </h3>
                                    )}

                                    <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-white/80">
                                      <span>
                                        View project
                                      </span>

                                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                                    </div>
                                  </div>
                                </button>

                                <div className="flex flex-1 flex-col p-5">
                                  {item.description && (
                                    <p className="line-clamp-3 text-sm leading-6 text-ink-500 dark:text-ink-400">
                                      {item.description}
                                    </p>
                                  )}

                                  {tags.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-1.5">
                                      {tags
                                        .slice(0, 4)
                                        .map((tag) => (
                                          <span
                                            key={tag}
                                            className="rounded-full bg-ink-50 px-2.5 py-1 text-[11px] font-medium text-ink-500 dark:bg-ink-800 dark:text-ink-300"
                                          >
                                            #{tag}
                                          </span>
                                        ))}
                                    </div>
                                  )}

                                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-ink-100 pt-4 dark:border-ink-800">
                                    {item.createdAt ? (
                                      <div className="flex min-w-0 items-center gap-2 text-xs text-ink-400">
                                        <Calendar className="h-3.5 w-3.5 shrink-0" />

                                        <span className="truncate">
                                          {formatDate(
                                            item.createdAt
                                          )}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-ink-400">
                                        Portfolio work
                                      </span>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedPortfolioIndex(
                                          index
                                        )
                                      }
                                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-ink-50 px-3 py-2 text-xs font-bold text-ink-700 transition hover:bg-primary-50 hover:text-primary-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:bg-primary-950/50 dark:hover:text-primary-300"
                                    >
                                      <Maximize2 className="h-3.5 w-3.5" />

                                      View
                                    </button>
                                  </div>
                                </div>
                              </motion.article>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-center pt-2">
                          <div className="inline-flex items-center gap-2 rounded-full border border-ink-100 bg-white px-4 py-2 text-xs font-medium text-ink-400 shadow-sm dark:border-ink-800 dark:bg-ink-900">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />

                            Showing{" "}
                            <span className="font-bold text-ink-700 dark:text-ink-200">
                              {filteredPortfolio.length}
                            </span>{" "}
                            {filteredPortfolio.length === 1
                              ? "project"
                              : "projects"}
                          </div>
                        </div>
                      </>
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

      {/* =====================================================
          PORTFOLIO LIGHTBOX
      ===================================================== */}

      <AnimatePresence>
        {selectedPortfolio && (
          <motion.div
            key="portfolio-modal"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/80 p-3 backdrop-blur-md sm:p-6"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closePortfolioModal();
              }
            }}
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.96,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
                y: 20,
              }}
              transition={{
                duration: 0.25,
              }}
              className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-ink-900 lg:flex-row"
            >
              <button
                type="button"
                onClick={
                  closePortfolioModal
                }
                aria-label="Close portfolio preview"
                className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="relative flex min-h-[320px] flex-1 items-center justify-center overflow-hidden bg-ink-950 lg:min-h-[650px]">
                {getPortfolioImage(
                  selectedPortfolio
                ) ? (
                  <img
                    src={getPortfolioImage(
                      selectedPortfolio
                    )}
                    alt={
                      selectedPortfolio.title ||
                      "Portfolio preview"
                    }
                    onError={
                      handlePortfolioImageError
                    }
                    className="max-h-[75vh] w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-white/30">
                    <ImageIcon className="h-20 w-20" />

                    <p className="mt-4 text-sm">
                      No image available
                    </p>
                  </div>
                )}

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />

                {filteredPortfolio.length >
                  1 && (
                    <button
                      type="button"
                      onClick={
                        showPreviousPortfolio
                      }
                      aria-label="Previous portfolio"
                      className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                  )}

                {filteredPortfolio.length >
                  1 && (
                    <button
                      type="button"
                      onClick={
                        showNextPortfolio
                      }
                      aria-label="Next portfolio"
                      className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  )}

                {selectedPortfolioIndex !==
                  null &&
                  filteredPortfolio.length >
                  1 && (
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
                      {selectedPortfolioIndex +
                        1}{" "}
                      /{" "}
                      {
                        filteredPortfolio.length
                      }
                    </div>
                  )}
              </div>

              <div className="w-full overflow-y-auto lg:max-w-md">
                <div className="p-6 sm:p-8">
                  {selectedPortfolio.category && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">
                      <Tag className="h-3.5 w-3.5" />

                      {
                        selectedPortfolio.category
                      }
                    </span>
                  )}

                  <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white sm:text-3xl">
                    {selectedPortfolio.title ||
                      "Portfolio project"}
                  </h2>

                  {selectedPortfolio.createdAt && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-ink-400">
                      <Calendar className="h-4 w-4" />

                      Posted{" "}
                      {formatDate(
                        selectedPortfolio.createdAt
                      )}
                    </div>
                  )}

                  <div className="my-6 h-px bg-ink-100 dark:bg-ink-800" />

                  <div>
                    <h3 className="text-sm font-bold text-ink-900 dark:text-white">
                      About this work
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-ink-600 dark:text-ink-300">
                      {selectedPortfolio.description ||
                        "The provider has not added a description for this portfolio project."}
                    </p>
                  </div>

                  {selectedPortfolio.tags &&
                    selectedPortfolio.tags
                      .filter(Boolean)
                      .length >
                    0 && (
                      <div className="mt-7">
                        <h3 className="text-sm font-bold text-ink-900 dark:text-white">
                          Tags
                        </h3>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedPortfolio.tags
                            .filter(Boolean)
                            .map(
                              (tag) => (
                                <span
                                  key={
                                    tag
                                  }
                                  className="rounded-full bg-ink-50 px-3 py-1.5 text-xs font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300"
                                >
                                  #{tag}
                                </span>
                              )
                            )}
                        </div>
                      </div>
                    )}

                  {getPortfolioImages(
                    selectedPortfolio
                  ).length >
                    1 && (
                      <div className="mt-7 rounded-2xl border border-ink-100 bg-ink-50 p-4 dark:border-ink-800 dark:bg-ink-950">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary-600 shadow-sm dark:bg-ink-900">
                            <ImageIcon className="h-4 w-4" />
                          </div>

                          <div>
                            <p className="text-sm font-bold text-ink-900 dark:text-white">
                              {
                                getPortfolioImages(
                                  selectedPortfolio
                                ).length
                              }{" "}
                              images
                            </p>

                            <p className="text-xs text-ink-400">
                              More project images
                              are available.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  {(selectedPortfolio.link ||
                    selectedPortfolio.url) && (
                    <a
                      href={
                        selectedPortfolio.link ||
                        selectedPortfolio.url
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-ink-800 dark:bg-white dark:text-ink-900 dark:hover:bg-ink-100"
                    >
                      View project link

                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}

                  <div className="mt-7 rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
                    <div className="flex items-center gap-3">
                      <img
                        src={providerImage}
                        alt={providerName}
                        onError={(event) => {
                          event.currentTarget.src =
                            "/images/default-avatar.png";
                        }}
                        className="h-11 w-11 rounded-xl object-cover"
                      />

                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
                          Created by
                        </p>

                        <p className="truncate text-sm font-bold text-ink-900 dark:text-white">
                          {providerName}
                        </p>
                      </div>

                      {providerIsActive && (
                        <ShieldCheck className="ml-auto h-5 w-5 shrink-0 text-primary-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}