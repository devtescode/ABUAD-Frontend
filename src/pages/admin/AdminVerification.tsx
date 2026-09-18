import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  User,
  Search,
  ShieldCheck,
  ShieldAlert,
  Clock3,
  Ban,
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

type ProviderStatus =
  | "pending"
  | "active"
  | "rejected"
  | "suspended";

interface Provider {
  _id: string;
  id?: string;

  name: string;
  email?: string;
  matricNo?: string;
  phoneNumber?: string;
  gender?: string;

  role: "provider";
  status: ProviderStatus;

  avatar?: string;
  categories?: string[];
  location?: string;
  joinedDate?: string;
  about?: string;

  createdAt?: string;
  updatedAt?: string;
}

type TabType =
  | "pending"
  | "active"
  | "rejected"
  | "suspended";

// ========================================================
// TAB CONFIG
// ========================================================

const tabs: {
  id: TabType;
  label: string;
  description: string;
  icon: typeof Clock3;
}[] = [
  {
    id: "pending",
    label: "Pending",
    description: "Providers waiting for verification",
    icon: Clock3,
  },
  {
    id: "active",
    label: "Approved",
    description: "Approved and active providers",
    icon: ShieldCheck,
  },
  {
    id: "rejected",
    label: "Rejected",
    description: "Providers whose applications were rejected",
    icon: XCircle,
  },
  {
    id: "suspended",
    label: "Suspended",
    description: "Providers currently suspended",
    icon: Ban,
  },
];

// ========================================================
// ADMIN VERIFICATION
// ========================================================

export function AdminVerification() {
  const [allProviders, setAllProviders] = useState<Provider[]>([]);

  const [activeTab, setActiveTab] =
    useState<TabType>("pending");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  // ========================================================
  // GET ADMIN TOKEN
  // ========================================================

  const getAdminToken = () => {
    return sessionStorage.getItem(
      "servicely_admin_token"
    );
  };

  // ========================================================
  // GET PROVIDER ID
  // ========================================================

  const getProviderId = (provider: Provider) => {
    return provider._id || provider.id || "";
  };

  // ========================================================
  // GET PROVIDER LIST FROM RESPONSE
  // ========================================================

  const getProviderList = (
    data: unknown
  ): Provider[] => {
    if (Array.isArray(data)) {
      return data as Provider[];
    }

    if (!data || typeof data !== "object") {
      return [];
    }

    const responseData = data as {
      providers?: Provider[];
      users?: Provider[];
      data?: Provider[];
    };

    return (
      responseData.providers ||
      responseData.users ||
      responseData.data ||
      []
    );
  };

  // ========================================================
  // FETCH PROVIDERS
  // ========================================================

  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getAdminToken();

      if (!token) {
        throw new Error(
          "Admin authentication token not found."
        );
      }

      const statuses: TabType[] = [
        "pending",
        "active",
        "rejected",
        "suspended",
      ];

      const responses = await Promise.all(
        statuses.map((status) =>
          fetch(
            `${API_URL}/verification/providers?status=${status}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          )
        )
      );

      const data = await Promise.all(
        responses.map((response) =>
          response.json()
        )
      );

      const failedResponse = responses.find(
        (response) => !response.ok
      );

      if (failedResponse) {
        const failedIndex =
          responses.indexOf(failedResponse);

        const failedData = data[failedIndex];

        throw new Error(
          failedData?.message ||
            "Failed to fetch providers."
        );
      }

      const providerMap = new Map<
        string,
        Provider
      >();

      data.forEach((responseData) => {
        const providerList =
          getProviderList(responseData);

        providerList.forEach((provider) => {
          if (provider.role === "provider") {
            const id =
              getProviderId(provider);

            if (id) {
              providerMap.set(id, provider);
            }
          }
        });
      });

      setAllProviders(
        Array.from(providerMap.values())
      );
    } catch (err: any) {
      console.error(
        "Error fetching providers:",
        err
      );

      setError(
        err?.message ||
          "Unable to load providers."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // LOAD PROVIDERS
  // ========================================================

  useEffect(() => {
    fetchProviders();
  }, []);

  // ========================================================
  // PROVIDER COUNTS
  // ========================================================

  const providerCounts = useMemo(() => {
    return {
      pending: allProviders.filter(
        (provider) =>
          provider.status === "pending"
      ).length,

      active: allProviders.filter(
        (provider) =>
          provider.status === "active"
      ).length,

      rejected: allProviders.filter(
        (provider) =>
          provider.status === "rejected"
      ).length,

      suspended: allProviders.filter(
        (provider) =>
          provider.status === "suspended"
      ).length,
    };
  }, [allProviders]);

  // ========================================================
  // FILTER PROVIDERS
  // ========================================================

  const filteredProviders = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return allProviders
      .filter(
        (provider) =>
          provider.status === activeTab
      )
      .filter((provider) => {
        if (!normalizedSearch) {
          return true;
        }

        return [
          provider.name,
          provider.email,
          provider.matricNo,
          provider.phoneNumber,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(normalizedSearch)
          );
      });
  }, [
    allProviders,
    activeTab,
    search,
  ]);

  // ========================================================
  // APPROVE PENDING PROVIDER
  //
  // pending → active
  //
  // Backend:
  // PATCH /verification/providers/:id/approve
  // ========================================================

  const handleApprove = async (
    providerId: string
  ) => {
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
            "Content-Type":
              "application/json",
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

      // Backend changes status to active
      setAllProviders((current) =>
        current.map((provider) =>
          getProviderId(provider) ===
          providerId
            ? {
                ...provider,
                status: "active",
              }
            : provider
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
  //
  // pending → rejected
  //
  // Backend:
  // PATCH /verification/providers/:id/reject
  // ========================================================

  const handleReject = async (
    providerId: string
  ) => {
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
            "Content-Type":
              "application/json",
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

      // Backend changes status to rejected
      setAllProviders((current) =>
        current.map((provider) =>
          getProviderId(provider) ===
          providerId
            ? {
                ...provider,
                status: "rejected",
              }
            : provider
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
  // RESTORE REJECTED PROVIDER
  //
  // rejected → active
  //
  // Backend:
  // PATCH /verification/providers/:id/restore
  // ========================================================

  const handleRestore = async (
    providerId: string
  ) => {
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
        `${API_URL}/verification/providers/${providerId}/restore`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to restore provider."
        );
      }

      // Backend changes rejected → active
      setAllProviders((current) =>
        current.map((provider) =>
          getProviderId(provider) ===
          providerId
            ? {
                ...provider,
                status: "active",
              }
            : provider
        )
      );
    } catch (err: any) {
      console.error(
        "Error restoring provider:",
        err
      );

      setError(
        err?.message ||
          "Unable to restore provider."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ========================================================
  // SUSPEND PROVIDER
  //
  // active → suspended
  //
  // Backend:
  // PATCH /verification/providers/:id/suspend
  // ========================================================

  const handleSuspend = async (
    providerId: string
  ) => {
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
        `${API_URL}/verification/providers/${providerId}/suspend`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to suspend provider."
        );
      }

      // Backend changes active → suspended
      setAllProviders((current) =>
        current.map((provider) =>
          getProviderId(provider) ===
          providerId
            ? {
                ...provider,
                status: "suspended",
              }
            : provider
        )
      );
    } catch (err: any) {
      console.error(
        "Error suspending provider:",
        err
      );

      setError(
        err?.message ||
          "Unable to suspend provider."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ========================================================
  // UNSUSPEND PROVIDER
  //
  // suspended → active
  //
  // Backend:
  // PATCH /verification/providers/:id/unsuspend
  // ========================================================

  const handleUnsuspend = async (
    providerId: string
  ) => {
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
        `${API_URL}/verification/providers/${providerId}/unsuspend`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to unsuspend provider."
        );
      }

      // Backend changes suspended → active
      setAllProviders((current) =>
        current.map((provider) =>
          getProviderId(provider) ===
          providerId
            ? {
                ...provider,
                status: "active",
              }
            : provider
        )
      );
    } catch (err: any) {
      console.error(
        "Error unsuspending provider:",
        err
      );

      setError(
        err?.message ||
          "Unable to unsuspend provider."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ========================================================
  // FORMAT DATE
  // ========================================================

  const formatDate = (
    date?: string
  ) => {
    if (!date) {
      return "Recently";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
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
  // STATUS BADGE
  // ========================================================

  const getStatusBadge = (
    status: ProviderStatus
  ) => {
    if (status === "pending") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
          <Clock3 className="h-3.5 w-3.5" />
          Pending
        </span>
      );
    }

    if (status === "active") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Approved
        </span>
      );
    }

    if (status === "rejected") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <XCircle className="h-3.5 w-3.5" />
          Rejected
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
        <Ban className="h-3.5 w-3.5" />
        Suspended
      </span>
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
        title="Provider Verification"
        subtitle="Review and manage provider applications"
      />

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
          <div className="flex items-center justify-between gap-4">
            <p>{error}</p>

            <button
              type="button"
              onClick={fetchProviders}
              className="flex shrink-0 items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium transition hover:bg-red-100 dark:border-red-900/40 dark:hover:bg-red-950/30"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* ====================================================
          TABS
      ==================================================== */}

      <div className="mb-6 overflow-x-auto">
        <div className="flex min-w-max gap-2 rounded-2xl border border-ink-100 bg-white p-2 shadow-sm dark:border-ink-800 dark:bg-ink-900">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            const count =
              providerCounts[tab.id];

            const isActive =
              activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearch("");
                }}
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-ink-600 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
                }`}
              >
                <Icon className="h-4 w-4" />

                <span>{tab.label}</span>

                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ====================================================
          SEARCH + REFRESH
      ==================================================== */}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search by name, email, matric number or phone..."
            className="w-full rounded-xl border border-ink-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-ink-700 dark:bg-ink-900 dark:text-white"
          />
        </div>

        <button
          type="button"
          onClick={fetchProviders}
          disabled={loading}
          className="btn-outline btn-sm shrink-0"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading
                ? "animate-spin"
                : ""
            }`}
          />
          Refresh
        </button>
      </div>

      {/* ====================================================
          TAB DESCRIPTION
      ==================================================== */}

      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink-900 dark:text-white">
            {
              tabs.find(
                (tab) =>
                  tab.id === activeTab
              )?.label
            }{" "}
            Providers
          </h2>

          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            {
              tabs.find(
                (tab) =>
                  tab.id === activeTab
              )?.description
            }
          </p>
        </div>

        <span className="rounded-full bg-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-600 dark:bg-ink-800 dark:text-ink-300">
          {filteredProviders.length}{" "}
          {filteredProviders.length === 1
            ? "provider"
            : "providers"}
        </span>
      </div>

      {/* ====================================================
          LOADING
      ==================================================== */}

      {loading ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500" />

          <h3 className="mt-4 text-lg font-semibold text-ink-900 dark:text-ink-50">
            Loading providers...
          </h3>

          <p className="mt-1 text-sm text-ink-500">
            Please wait while we fetch provider records.
          </p>
        </div>
      ) : filteredProviders.length === 0 ? (
        /* ==================================================
           EMPTY STATE
        ================================================== */

        <div className="card flex flex-col items-center justify-center py-20 text-center">
          {activeTab === "pending" ? (
            <CheckCircle2 className="h-12 w-12 text-primary-300" />
          ) : activeTab === "rejected" ? (
            <XCircle className="h-12 w-12 text-red-300" />
          ) : activeTab === "suspended" ? (
            <Ban className="h-12 w-12 text-orange-300" />
          ) : (
            <ShieldCheck className="h-12 w-12 text-green-300" />
          )}

          <h3 className="mt-4 text-lg font-semibold text-ink-900 dark:text-ink-50">
            {search
              ? "No providers found"
              : activeTab === "pending"
              ? "No pending requests"
              : activeTab === "active"
              ? "No approved providers"
              : activeTab === "rejected"
              ? "No rejected providers"
              : "No suspended providers"}
          </h3>

          <p className="mt-1 max-w-md text-sm text-ink-500">
            {search
              ? `No ${
                  tabs.find(
                    (tab) =>
                      tab.id === activeTab
                  )?.label
                } providers match your search.`
              : activeTab === "pending"
              ? "All provider applications have been reviewed."
              : activeTab === "active"
              ? "Approved providers will appear here."
              : activeTab === "rejected"
              ? "Rejected provider applications will appear here."
              : "Suspended providers will appear here."}
          </p>

          {search && (
            <button
              type="button"
              onClick={() =>
                setSearch("")
              }
              className="btn-outline btn-sm mt-5"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        /* ==================================================
           PROVIDER LIST
        ================================================== */

        <div className="space-y-4">
          {filteredProviders.map(
            (provider) => {
              const providerId =
                getProviderId(provider);

              const isProcessing =
                processingId ===
                providerId;

              return (
                <div
                  key={providerId}
                  className="card p-5 transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                    {/* ========================================
                        PROVIDER INFORMATION
                    ======================================== */}

                    <div className="flex min-w-0 items-start gap-4">
                      {/* Avatar */}

                      {provider.avatar ? (
                        <img
                          src={
                            provider.avatar
                          }
                          alt={
                            provider.name
                          }
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

                          {getStatusBadge(
                            provider.status
                          )}
                        </div>

                        {provider.email && (
                          <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">
                            {provider.email}
                          </p>
                        )}

                        {provider.matricNo && (
                          <p className="mt-1 text-xs text-ink-400">
                            Matric No:{" "}
                            {
                              provider.matricNo
                            }
                          </p>
                        )}

                        {provider.phoneNumber && (
                          <p className="mt-1 text-xs text-ink-400">
                            Phone:{" "}
                            {
                              provider.phoneNumber
                            }
                          </p>
                        )}

                        {provider.categories &&
                          provider.categories
                            .length > 0 && (
                            <p className="mt-1 text-sm text-ink-500">
                              {provider.categories.join(
                                ", "
                              )}
                            </p>
                          )}

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

                        {provider.about && (
                          <p className="mt-2 max-w-2xl line-clamp-2 text-sm text-ink-600 dark:text-ink-400">
                            {
                              provider.about
                            }
                          </p>
                        )}
                      </div>
                    </div>

                    {/* ========================================
                        ACTIONS
                    ======================================== */}

                    <div className="flex shrink-0 flex-wrap gap-2">

                      {/* ======================================
                          PENDING
                      ====================================== */}

                      {provider.status ===
                        "pending" && (
                        <>
                          <button
                            type="button"
                            disabled={
                              isProcessing
                            }
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

                          <button
                            type="button"
                            disabled={
                              isProcessing
                            }
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
                        </>
                      )}

                      {/* ======================================
                          REJECTED
                      ====================================== */}

                      {provider.status ===
                        "rejected" && (
                        <button
                          type="button"
                          disabled={
                            isProcessing
                          }
                          onClick={() =>
                            handleRestore(
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
                            ? "Restoring..."
                            : "Restore & Approve"}
                        </button>
                      )}

                      {/* ======================================
                          ACTIVE / APPROVED
                      ====================================== */}

                      {provider.status ===
                        "active" && (
                        <>
                          <span className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700 dark:bg-green-950/20 dark:text-green-400">
                            <ShieldCheck className="h-4 w-4" />
                            Provider approved
                          </span>

                          <button
                            type="button"
                            disabled={
                              isProcessing
                            }
                            onClick={() =>
                              handleSuspend(
                                providerId
                              )
                            }
                            className="btn-outline btn-sm text-orange-600 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-orange-950/20"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Ban className="h-4 w-4" />
                            )}

                            {isProcessing
                              ? "Suspending..."
                              : "Suspend"}
                          </button>
                        </>
                      )}

                      {/* ======================================
                          SUSPENDED
                      ====================================== */}

                      {provider.status ===
                        "suspended" && (
                        <>
                          <span className="inline-flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700 dark:bg-orange-950/20 dark:text-orange-400">
                            <ShieldAlert className="h-4 w-4" />
                            Account suspended
                          </span>

                          <button
                            type="button"
                            disabled={
                              isProcessing
                            }
                            onClick={() =>
                              handleUnsuspend(
                                providerId
                              )
                            }
                            className="btn-primary btn-sm disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ShieldCheck className="h-4 w-4" />
                            )}

                            {isProcessing
                              ? "Restoring..."
                              : "Unsuspend"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </DashboardLayout>
  );
}