import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  User,
} from "lucide-react";

import {
  DashboardLayout,
  DashboardHeader,
} from "@/components/DashboardLayout";

import { adminNavItems } from "@/data/adminNavItems";

// ========================================================
// API URL
// ========================================================

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

// ========================================================
// TYPES
// ========================================================

interface Provider {
  _id: string;
  id?: string;

  name: string;
  email?: string;
  matricNo?: string;
  phoneNumber?: string;
  gender?: string;

  role: "provider";
  status: "pending" | "approved" | "rejected" | "active";

  avatar?: string;
  categories?: string[];
  location?: string;
  joinedDate?: string;
  about?: string;

  createdAt?: string;
  updatedAt?: string;
}

// ========================================================
// ADMIN VERIFICATION
// ========================================================

export function AdminVerification() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [processingId, setProcessingId] = useState<string | null>(null);

  // ========================================================
  // GET ADMIN TOKEN
  // ========================================================

  const getAdminToken = () => {
    return sessionStorage.getItem("servicely_admin_token");
  };

  // ========================================================
  // FETCH PENDING PROVIDERS
  // ========================================================

  const fetchPendingProviders = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getAdminToken();

      if (!token) {
        throw new Error("Admin authentication token not found.");
      }

      const response = await fetch(
        `${API_URL}/verification/providers?status=pending`,
        {
          method: "GET",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to fetch pending providers."
        );
      }

      // ====================================================
      // SUPPORT DIFFERENT BACKEND RESPONSE STRUCTURES
      // ====================================================

      const providerList =
        Array.isArray(data)
          ? data
          : Array.isArray(data.providers)
            ? data.providers
            : Array.isArray(data.users)
              ? data.users
              : Array.isArray(data.data)
                ? data.data
                : [];

      // Only show providers that are actually pending
      const pendingProviders = providerList.filter(
        (provider: Provider) =>
          provider.role === "provider" &&
          provider.status === "pending"
      );

      setProviders(pendingProviders);
    } catch (err: any) {
      console.error(
        "Error fetching pending providers:",
        err
      );

      setError(
        err?.message ||
        "Unable to load verification requests."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // LOAD PROVIDERS ON PAGE LOAD
  // ========================================================

  useEffect(() => {
    fetchPendingProviders();
  }, []);

  // ========================================================
  // APPROVE PROVIDER
  // ========================================================

  const handleApprove = async (providerId: string) => {
    try {
      setProcessingId(providerId);
      setError("");

      const token = getAdminToken();

      if (!token) {
        throw new Error(
          "Admin authentication token not found."
        );
      }

      const response = await fetch(
        `${API_URL}/verification/providers/${providerId}/approve`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          "Failed to approve provider."
        );
      }

      // Remove provider from pending list
      setProviders((currentProviders) =>
        currentProviders.filter(
          (provider) =>
            (provider._id || provider.id) !== providerId
        )
      );

    } catch (err: any) {
      console.error(
        "Error approving provider:",
        err
      );

      setError(
        err?.message ||
        "Unable to approve provider."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ========================================================
  // REJECT PROVIDER
  // ========================================================

  const handleReject = async (providerId: string) => {
    try {
      setProcessingId(providerId);
      setError("");

      const token = getAdminToken();

      if (!token) {
        throw new Error(
          "Admin authentication token not found."
        );
      }

      const response = await fetch(
        `${API_URL}/verification/providers/${providerId}/reject`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          "Failed to reject provider."
        );
      }

      // Remove provider from pending list
      setProviders((currentProviders) =>
        currentProviders.filter(
          (provider) =>
            (provider._id || provider.id) !== providerId
        )
      );

    } catch (err: any) {
      console.error(
        "Error rejecting provider:",
        err
      );

      setError(
        err?.message ||
        "Unable to reject provider."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ========================================================
  // GET PROVIDER ID
  // ========================================================

  const getProviderId = (provider: Provider) => {
    return provider._id || provider.id || "";
  };

  // ========================================================
  // FORMAT JOIN DATE
  // ========================================================

  const formatDate = (
    date?: string
  ) => {
    if (!date) {
      return "Recently";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      "en-NG",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <DashboardLayout
      role="admin"
      navItems={adminNavItems}
    >
      <DashboardHeader
        title="Verification Requests"
        subtitle="Review and approve provider applications"
      />

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
          <div className="flex items-center justify-between gap-4">
            <p>{error}</p>

            <button
              onClick={fetchPendingProviders}
              className="flex shrink-0 items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium transition hover:bg-red-100 dark:border-red-900/40 dark:hover:bg-red-950/30"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* ====================================================
          LOADING
      ==================================================== */}

      {loading ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500" />

          <h3 className="mt-4 text-lg font-semibold text-ink-900 dark:text-ink-50">
            Loading verification requests...
          </h3>

          <p className="mt-1 text-sm text-ink-500">
            Please wait while we fetch pending providers.
          </p>
        </div>
      ) : providers.length === 0 ? (
        /* ==================================================
           NO PENDING PROVIDERS
        ================================================== */

        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <CheckCircle2 className="h-12 w-12 text-primary-300" />

          <h3 className="mt-4 text-lg font-semibold text-ink-900 dark:text-ink-50">
            No pending requests
          </h3>

          <p className="mt-1 text-sm text-ink-500">
            All provider applications have been reviewed.
          </p>

          <button
            onClick={fetchPendingProviders}
            className="btn-outline btn-sm mt-5"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      ) : (
        /* ==================================================
           PENDING PROVIDERS
        ================================================== */

        <div className="space-y-4">
          {providers.map((provider) => {
            const providerId =
              getProviderId(provider);

            const isProcessing =
              processingId === providerId;

            return (
              <div
                key={providerId}
                className="card p-5"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                  {/* ========================================
                      PROVIDER INFORMATION
                  ======================================== */}

                  <div className="flex items-start gap-4">

                    {/* Avatar */}
                    {provider.avatar ? (
                      <img
                        src={provider.avatar}
                        alt={provider.name}
                        className="h-14 w-14 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                        <User className="h-7 w-7" />
                      </div>
                    )}

                    {/* Details */}
                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-ink-900 dark:text-ink-50">
                          {provider.name}
                        </h3>

                        <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                          Pending
                        </span>
                      </div>

                      {/* Categories */}
                      {provider.categories &&
                        provider.categories.length > 0 && (
                          <p className="mt-1 text-sm text-ink-500">
                            {provider.categories.join(
                              ", "
                            )}
                          </p>
                        )}

                      {/* Email */}
                      {provider.email && (
                        <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">
                          {provider.email}
                        </p>
                      )}

                      {/* Matric Number */}
                      {provider.matricNo && (
                        <p className="mt-1 text-xs text-ink-400">
                          Matric No:{" "}
                          {provider.matricNo}
                        </p>
                      )}

                      {/* Phone */}
                      {provider.phoneNumber && (
                        <p className="mt-1 text-xs text-ink-400">
                          Phone:{" "}
                          {provider.phoneNumber}
                        </p>
                      )}

                      {/* Location / Joined */}
                      <p className="mt-1 text-xs text-ink-400">
                        {provider.location
                          ? `${provider.location} • `
                          : ""}
                        Joined{" "}
                        {formatDate(
                          provider.joinedDate ||
                          provider.createdAt
                        )}
                      </p>

                      {/* About */}
                      {provider.about && (
                        <p className="mt-2 max-w-2xl text-sm text-ink-600 line-clamp-2 dark:text-ink-400">
                          {provider.about}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ========================================
                      ACTION BUTTONS
                  ======================================== */}

                  <div className="flex shrink-0 gap-2">

                    {/* APPROVE */}
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() =>
                        handleApprove(
                          providerId
                        )
                      }
                      className="btn-primary btn-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}

                      {isProcessing
                        ? "Processing..."
                        : "Approve"}
                    </button>

                    {/* REJECT */}
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() =>
                        handleReject(
                          providerId
                        )
                      }
                      className="btn-outline btn-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-950/20"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}

                      {isProcessing
                        ? "Processing..."
                        : "Reject"}
                    </button>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}