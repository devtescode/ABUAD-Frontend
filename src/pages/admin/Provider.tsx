
import { useEffect, useState } from "react";
import {
  Eye,
  Ban,
  CheckCircle,
  Loader2,
  Users,
  BriefcaseBusiness,
  ArrowRight,
} from "lucide-react";
import {
  DashboardLayout,
  DashboardHeader,
} from "@/components/DashboardLayout";
import { adminNavItems } from "@/data/adminNavItems";
import { VerifiedBadge, StarRating } from "@/components/shared";
import { Link } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

interface Provider {
  _id: string;
  fullName?: string;
  name?: string;
  email?: string;
  avatar?: string;
  profileImage?: string;
  categories?: string[];
  rating?: number;
  completedBookings?: number;
  verified?: boolean;
  status?: string;
  role?: string;
}

interface ProviderStatusResponse {
  message?: string;
  provider?: Partial<Provider>;
  status?: string;
}

export function AdminProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * Fetch all providers
   */
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        setError("");

        const token = sessionStorage.getItem(
          "servicely_admin_token"
        );

        if (!token) {
          setError(
            "Admin authentication token was not found."
          );
          return;
        }

        const response = await fetch(
          `${API_URL}/admin/providers`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Failed to fetch providers."
          );
        }

        setProviders(result.providers || []);
      } catch (error) {
        console.error(
          "Fetch admin providers error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load providers."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  /*
   * Suspend / Unsuspend provider
   */
  const handleProviderStatus = async (
  providerId: string,
  currentStatus?: string
) => {
  const isSuspended = currentStatus === "suspended";

  const confirmed = window.confirm(
    isSuspended
      ? "Are you sure you want to unsuspend this provider?"
      : "Are you sure you want to suspend this provider?"
  );

  if (!confirmed) return;

  try {
    const token = sessionStorage.getItem(
      "servicely_admin_token"
    );

    if (!token) {
      throw new Error(
        "Admin authentication token was not found."
      );
    }

    const endpoint = isSuspended
      ? `${API_URL}/admin/providers/${providerId}/unsuspend`
      : `${API_URL}/admin/providers/${providerId}/suspend`;

    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const result: ProviderStatusResponse =
      await response.json();

    console.log("Provider status response:", result);

    if (!response.ok) {
      throw new Error(
        result.message ||
          `Failed to ${
            isSuspended ? "unsuspend" : "suspend"
          } provider.`
      );
    }

    // Use the status returned by the backend.
    // If backend doesn't return it, use the expected status.
    const updatedStatus =
      result.provider?.status ||
      result.status ||
      (isSuspended ? "active" : "suspended");

    setProviders((current) =>
      current.map((provider) =>
        provider._id === providerId
          ? {
              ...provider,
              ...result.provider,
              status: updatedStatus,
              verified: isSuspended
                ? true
                : false,
            }
          : provider
      )
    );
  } catch (error) {
    console.error(
      "Update provider status error:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : `Failed to ${
            isSuspended ? "unsuspend" : "suspend"
          } provider.`
    );
  }
};

  return (
    <DashboardLayout
      role="admin"
      navItems={adminNavItems}
    >
      <DashboardHeader
        title="Provider Management"
        subtitle="Manage providers and review their posted services"
      />

      {/* =========================
          SUMMARY
      ========================== */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Total Providers */}
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200">
            <Users className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs font-medium text-ink-400">
              Total Providers
            </p>

            <p className="mt-1 text-2xl font-bold text-ink-900 dark:text-white">
              {providers.length}
            </p>
          </div>
        </div>

        {/* Provider Access */}
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200">
            <BriefcaseBusiness className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs font-medium text-ink-400">
              Provider Access
            </p>

            <p className="mt-1 text-sm font-semibold text-ink-900 dark:text-white">
              Profiles & Services
            </p>
          </div>
        </div>
      </div>

      {/* =========================
          LOADING
      ========================== */}
      {loading && (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-ink-500" />

            <p className="text-sm text-ink-500">
              Loading providers...
            </p>
          </div>
        </div>
      )}

      {/* =========================
          ERROR
      ========================== */}
      {!loading && error && (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="max-w-sm text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/10">
              <Ban className="h-5 w-5" />
            </div>

            <h3 className="mt-4 font-semibold text-ink-900 dark:text-white">
              Unable to load providers
            </h3>

            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="btn-primary btn-sm mt-4"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* =========================
          EMPTY STATE
      ========================== */}
      {!loading &&
        !error &&
        providers.length === 0 && (
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-ink-200 dark:border-ink-800">
            <div className="text-center">
              <Users className="mx-auto h-8 w-8 text-ink-400" />

              <h3 className="mt-3 font-semibold text-ink-900 dark:text-white">
                No providers found
              </h3>

              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                There are currently no registered
                providers.
              </p>
            </div>
          </div>
        )}

      {/* =========================
          PROVIDERS
      ========================== */}
      {!loading &&
        !error &&
        providers.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => {
              const providerName =
                provider.fullName ||
                provider.name ||
                "Service Provider";

              const providerImage =
                provider.avatar ||
                provider.profileImage ||
                "/images/default-avatar.png";

              const rating =
                Number(provider.rating || 0);

              const isSuspended =
                provider.status === "suspended";

              const isActiveOrVerified =
                provider.status === "active" ||
                provider.status === "verified" ||
                provider.status === "approved" ||
                provider.verified === true;

              return (
                <div
                  key={provider._id}
                  className="card overflow-hidden p-5 transition-shadow hover:shadow-lg"
                >
                  {/* =====================
                      PROVIDER INFO
                  ====================== */}
                  <div className="flex items-start gap-3">
                    <img
                      src={providerImage}
                      alt={providerName}
                      onError={(event) => {
                        event.currentTarget.src =
                          "/images/default-avatar.png";
                      }}
                      className="h-12 w-12 rounded-full object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="truncate font-semibold text-ink-900 dark:text-white">
                          {providerName}
                        </h3>

                        {isActiveOrVerified &&
                          !isSuspended && (
                            <VerifiedBadge />
                          )}
                      </div>

                      <p className="mt-0.5 truncate text-xs text-ink-500 dark:text-ink-400">
                        {provider.email ||
                          "Provider"}
                      </p>

                      <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                        {provider.categories?.length
                          ? provider.categories.join(
                              ", "
                            )
                          : "Service Provider"}
                      </p>
                    </div>
                  </div>

                  {/* =====================
                      STATS
                  ====================== */}
                  <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3 dark:border-ink-800">
                    <span className="flex items-center gap-1 text-sm">
                      <StarRating
                        rating={rating}
                      />

                      <span className="text-ink-600 dark:text-ink-300">
                        {rating.toFixed(1)}
                      </span>
                    </span>

                    <span className="text-xs text-ink-400">
                      {provider.completedBookings ||
                        0}{" "}
                      bookings
                    </span>
                  </div>

                  {/* =====================
                      STATUS
                  ====================== */}
                  <div className="mt-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        isSuspended
                          ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                        : isActiveOrVerified
                          ? "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                          : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                      }`}
                    >
                      {isSuspended
                        ? "Suspended"
                        : isActiveOrVerified
                        ? "Active / Verified"
                        : "Pending Review"}
                    </span>
                  </div>

                  {/* =====================
                      PROFILE + POSTS
                  ====================== */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      to={`/admin/providers/${provider._id}`}
                      className="btn-outline btn-sm flex items-center justify-center gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Profile
                    </Link>

                    <Link
                      to={`/admin/providers/${provider._id}/services`}
                      className="btn-primary btn-sm flex items-center justify-center gap-1.5"
                    >
                      Posts
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {/* =====================
                      SUSPEND / UNSUSPEND
                  ====================== */}
                  {/* <button
                    type="button"
                    onClick={() =>
                      handleProviderStatus(
                        provider._id,
                        provider.status
                      )
                    }
                    className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      isSuspended
                        ? "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-500/10"
                        : "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    }`}
                  >
                    {isSuspended ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5" />
                        Unsuspend Provider
                      </>
                    ) : (
                      <>
                        <Ban className="h-3.5 w-3.5" />
                        Suspend Provider
                      </>
                    )}
                  </button> */}
                </div>
              );
            })}
          </div>
        )}
    </DashboardLayout>
  );
}

