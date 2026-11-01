import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Ban,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Hash,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import {
  DashboardHeader,
  DashboardLayout,
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
import { adminNavItems } from "@/data/adminNavItems";
import { getApiErrorMessage } from "@/lib/api";
import {
  useAdminVerification,
  useAdminVerificationAction,
  type VerificationAction,
} from "@/hooks/queries";

/* =========================================================
   TYPES
========================================================= */

type ProviderStatus = "pending" | "active" | "rejected" | "suspended";
type TabType = ProviderStatus;

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

interface Feedback {
  type: "success" | "error";
  message: string;
}

interface ConfirmState {
  provider: Provider;
  action: VerificationAction;
}

/* =========================================================
   TAB + STATUS CONFIG
========================================================= */

const tabs: {
  id: TabType;
  label: string;
  description: string;
  icon: LucideIcon;
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

const STATUS_META: Record<
  ProviderStatus,
  { label: string; icon: LucideIcon; className: string }
> = {
  pending: {
    label: "Pending",
    icon: Clock3,
    className:
      "bg-warning-50 text-warning-700 dark:bg-warning-600/15 dark:text-warning-200",
  },
  active: {
    label: "Approved",
    icon: ShieldCheck,
    className:
      "bg-success-50 text-success-700 dark:bg-success-600/15 dark:text-success-200",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className:
      "bg-danger-50 text-danger-700 dark:bg-danger-500/15 dark:text-danger-200",
  },
  suspended: {
    label: "Suspended",
    icon: Ban,
    className:
      "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200",
  },
};

const SUMMARY_TONES: Record<ProviderStatus, string> = {
  pending:
    "bg-warning-50 text-warning-600 dark:bg-warning-600/15 dark:text-warning-200",
  active:
    "bg-success-50 text-success-600 dark:bg-success-600/15 dark:text-success-200",
  rejected:
    "bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-200",
  suspended:
    "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-200",
};

const ACTION_LABELS: Record<VerificationAction, string> = {
  approve: "Approve",
  reject: "Reject",
  restore: "Restore & Approve",
  suspend: "Suspend",
  unsuspend: "Unsuspend",
};

const ACTION_PENDING_LABELS: Record<VerificationAction, string> = {
  approve: "Approving…",
  reject: "Rejecting…",
  restore: "Restoring…",
  suspend: "Suspending…",
  unsuspend: "Restoring…",
};

const ACTION_ICONS: Record<VerificationAction, LucideIcon> = {
  approve: CheckCircle2,
  reject: XCircle,
  restore: ShieldCheck,
  suspend: Ban,
  unsuspend: ShieldCheck,
};

const ACTION_BUTTON_CLASSES: Record<VerificationAction, string> = {
  approve: "btn-primary",
  reject:
    "btn-outline border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:border-red-500/50 dark:hover:bg-red-500/10",
  restore: "btn-primary",
  suspend:
    "btn-outline border-orange-200 text-orange-600 hover:border-orange-300 hover:bg-orange-50 dark:border-orange-500/30 dark:text-orange-300 dark:hover:border-orange-500/50 dark:hover:bg-orange-500/10",
  unsuspend: "btn-primary",
};

const ACTION_MESSAGES: Record<VerificationAction, string> = {
  approve: "has been approved.",
  reject: "has been rejected.",
  restore: "has been restored and approved.",
  suspend: "has been suspended.",
  unsuspend: "has been unsuspended.",
};

/* =========================================================
   NORMALISATION HELPERS
   The verification endpoint is intentionally loose, so every
   provider record is normalised before it reaches the UI.
========================================================= */

function textValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function listValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === "string" || typeof entry === "number") {
          return textValue(entry);
        }

        if (entry && typeof entry === "object") {
          const record = entry as Record<string, unknown>;
          return (
            textValue(record.name) ||
            textValue(record.title) ||
            textValue(record.label) ||
            textValue(record.category)
          );
        }

        return "";
      })
      .filter(Boolean);
  }

  const single = textValue(value);

  return single
    ? single
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
    : [];
}

const STATUS_ALIASES: Record<string, ProviderStatus> = {
  pending: "pending",
  awaiting: "pending",
  "under review": "pending",
  active: "active",
  approved: "active",
  verified: "active",
  rejected: "rejected",
  declined: "rejected",
  suspended: "suspended",
  blocked: "suspended",
  disabled: "suspended",
};

function normalizeStatus(
  value: unknown,
  fallback: ProviderStatus
): ProviderStatus {
  const key = textValue(value).toLowerCase();
  return STATUS_ALIASES[key] || fallback;
}

function toProvider(
  raw: Record<string, unknown>,
  fallbackStatus: ProviderStatus
): Provider | null {
  const role = textValue(raw.role).toLowerCase();

  // The endpoint is provider-only. Tolerate a missing role, but skip
  // anything that explicitly belongs to another role.
  if (role && role !== "provider") return null;

  const id = textValue(raw._id) || textValue(raw.id);
  if (!id) return null;

  const categoryRecords = listValue(raw.categories);
  const categories =
    categoryRecords.length > 0
      ? categoryRecords
      : listValue(raw.serviceCategories);
  const category = textValue(raw.category);

  if (categories.length === 0 && category) {
    categories.push(category);
  }

  const composedName = [textValue(raw.firstName), textValue(raw.lastName)]
    .filter(Boolean)
    .join(" ");

  return {
    _id: id,
    id,
    name:
      textValue(raw.name) ||
      textValue(raw.fullName) ||
      composedName ||
      "Unnamed provider",
    email: textValue(raw.email) || undefined,
    matricNo:
      textValue(raw.matricNo) ||
      textValue(raw.matricNumber) ||
      textValue(raw.matric_number) ||
      textValue(raw.matric) ||
      undefined,
    phoneNumber:
      textValue(raw.phoneNumber) ||
      textValue(raw.phone) ||
      textValue(raw.phone_number) ||
      undefined,
    gender: textValue(raw.gender) || undefined,
    role: "provider",
    status: normalizeStatus(
      raw.status || raw.verificationStatus,
      fallbackStatus
    ),
    avatar:
      textValue(raw.avatar) ||
      textValue(raw.avatarUrl) ||
      textValue(raw.profileImage) ||
      undefined,
    categories,
    location: textValue(raw.location) || undefined,
    joinedDate: textValue(raw.joinedDate) || undefined,
    about: textValue(raw.about) || textValue(raw.bio) || undefined,
    createdAt:
      textValue(raw.createdAt) ||
      textValue(raw.created_at) ||
      undefined,
    updatedAt:
      textValue(raw.updatedAt) ||
      textValue(raw.updated_at) ||
      undefined,
  };
}

function getProviderId(provider: Provider): string {
  return provider._id || provider.id || "";
}

function formatDate(value?: string): string {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/* =========================================================
   ADMIN VERIFICATION
========================================================= */

export function AdminVerification() {
  // Always call all four status hooks — never conditionally.
  const pendingQuery = useAdminVerification("pending");
  const activeQuery = useAdminVerification("active");
  const rejectedQuery = useAdminVerification("rejected");
  const suspendedQuery = useAdminVerification("suspended");

  const {
    mutateAsync: runVerificationAction,
    isPending: isActionPending,
    variables: actionVariables,
  } = useAdminVerificationAction();

  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmState | null>(
    null
  );

  /* ========================================================
     COMBINE QUERY RESULTS
  ======================================================== */

  const providers = useMemo(() => {
    const providerMap = new Map<string, Provider>();

    const groups: Array<{
      status: ProviderStatus;
      records?: Array<Record<string, unknown>>;
    }> = [
      { status: "pending", records: pendingQuery.data },
      { status: "active", records: activeQuery.data },
      { status: "rejected", records: rejectedQuery.data },
      { status: "suspended", records: suspendedQuery.data },
    ];

    groups.forEach(({ status, records }) => {
      if (!Array.isArray(records)) return;

      records.forEach((record) => {
        const provider = toProvider(record, status);

        if (provider && !providerMap.has(provider._id)) {
          providerMap.set(provider._id, provider);
        }
      });
    });

    return Array.from(providerMap.values());
  }, [
    pendingQuery.data,
    activeQuery.data,
    rejectedQuery.data,
    suspendedQuery.data,
  ]);

  const providerCounts = useMemo(() => {
    const counts: Record<ProviderStatus, number> = {
      pending: 0,
      active: 0,
      rejected: 0,
      suspended: 0,
    };

    providers.forEach((provider) => {
      counts[provider.status] += 1;
    });

    return counts;
  }, [providers]);

  const filteredProviders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return providers
      .filter((provider) => provider.status === activeTab)
      .filter((provider) => {
        if (!normalizedSearch) return true;

        return [
          provider.name,
          provider.email,
          provider.matricNo,
          provider.phoneNumber,
          provider.location,
          ...(provider.categories || []),
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedSearch)
          );
      });
  }, [providers, activeTab, search]);

  /* ========================================================
     COMBINED QUERY STATE
  ======================================================== */

  const isLoading =
    pendingQuery.isLoading ||
    activeQuery.isLoading ||
    rejectedQuery.isLoading ||
    suspendedQuery.isLoading;

  const isFetching =
    pendingQuery.isFetching ||
    activeQuery.isFetching ||
    rejectedQuery.isFetching ||
    suspendedQuery.isFetching;

  const isError =
    pendingQuery.isError ||
    activeQuery.isError ||
    rejectedQuery.isError ||
    suspendedQuery.isError;

  const error =
    pendingQuery.error ||
    activeQuery.error ||
    rejectedQuery.error ||
    suspendedQuery.error ||
    null;

  const refetch = () =>
    Promise.all([
      pendingQuery.refetch(),
      activeQuery.refetch(),
      rejectedQuery.refetch(),
      suspendedQuery.refetch(),
    ]);

  const errorMessage = error
    ? getApiErrorMessage(error)
    : "We could not load the verification queue. Please try again.";

  /* ========================================================
     ACTIONS
  ======================================================== */

  const handleAction = async (
    provider: Provider,
    action: VerificationAction
  ) => {
    setFeedback(null);

    try {
      await runVerificationAction({
        id: getProviderId(provider),
        action,
      });

      setFeedback({
        type: "success",
        message: `${provider.name} ${ACTION_MESSAGES[action]}`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: getApiErrorMessage(err),
      });
    }
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;

    const { provider, action } = confirmAction;
    await handleAction(provider, action);
    setConfirmAction(null);
  };

  const isConfirming =
    confirmAction !== null &&
    isActionPending &&
    actionVariables?.id === getProviderId(confirmAction.provider) &&
    actionVariables?.action === confirmAction.action;

  /* ========================================================
     RENDER HELPERS
  ======================================================== */

  const activeTabMeta = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  const renderActions = (provider: Provider, fullWidth = false) => {
    const providerId = getProviderId(provider);
    const rowIsPending =
      isActionPending && actionVariables?.id === providerId;
    const busy = isActionPending;

    const wrapperClass = fullWidth
      ? "grid grid-cols-2 gap-2"
      : "flex flex-wrap items-center justify-end gap-2";

    const isActionLoading = (action: VerificationAction) =>
      rowIsPending && actionVariables?.action === action;

    if (provider.status === "pending") {
      return (
        <div className={wrapperClass}>
          <ActionButton
            action="approve"
            loading={isActionLoading("approve")}
            disabled={busy}
            onClick={() => {
              void handleAction(provider, "approve");
            }}
            className={fullWidth ? "w-full" : undefined}
          />

          <ActionButton
            action="reject"
            loading={isActionLoading("reject")}
            disabled={busy}
            onClick={() =>
              setConfirmAction({ provider, action: "reject" })
            }
            className={fullWidth ? "w-full" : undefined}
          />
        </div>
      );
    }

    if (provider.status === "rejected") {
      return (
        <div className={fullWidth ? "grid gap-2" : "flex justify-end"}>
          <ActionButton
            action="restore"
            loading={isActionLoading("restore")}
            disabled={busy}
            onClick={() => {
              void handleAction(provider, "restore");
            }}
            className={fullWidth ? "w-full" : undefined}
          />
        </div>
      );
    }

    if (provider.status === "active") {
      return (
        <div className={fullWidth ? "grid gap-2" : "flex justify-end"}>
          <ActionButton
            action="suspend"
            loading={isActionLoading("suspend")}
            disabled={busy}
            onClick={() =>
              setConfirmAction({ provider, action: "suspend" })
            }
            className={fullWidth ? "w-full" : undefined}
          />
        </div>
      );
    }

    return (
      <div className={fullWidth ? "grid gap-2" : "flex justify-end"}>
        <ActionButton
          action="unsuspend"
          loading={isActionLoading("unsuspend")}
          disabled={busy}
          onClick={() => {
            void handleAction(provider, "unsuspend");
          }}
          className={fullWidth ? "w-full" : undefined}
        />
      </div>
    );
  };

  const emptyTitle = search
    ? "No providers found"
    : activeTab === "pending"
      ? "No pending requests"
      : activeTab === "active"
        ? "No approved providers"
        : activeTab === "rejected"
          ? "No rejected providers"
          : "No suspended providers";

  const emptyDescription = search
    ? `No ${activeTabMeta.label.toLowerCase()} providers match "${search.trim()}".`
    : activeTab === "pending"
      ? "All provider applications have been reviewed."
      : activeTab === "active"
        ? "Approved providers will appear here."
        : activeTab === "rejected"
          ? "Rejected provider applications will appear here."
          : "Suspended providers will appear here.";

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <DashboardLayout role="admin" navItems={adminNavItems}>
      <DashboardHeader
        title="Provider Verification"
        subtitle="Review applications, approve trusted providers and manage account status."
        action={
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300">
            <Clock3 className="h-3.5 w-3.5 text-warning-600 dark:text-warning-200" />
            {isLoading
              ? "Loading queue…"
              : `${providerCounts.pending} awaiting review`}
          </span>
        }
      />

      {/* ====================================================
          SUMMARY CARDS
      ==================================================== */}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="card p-4 sm:p-5">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="mt-4 h-7 w-12" />
                <Skeleton className="mt-2 h-3.5 w-24" />
              </div>
            ))
          : tabs.map((tab) => (
              <SummaryCard
                key={tab.id}
                label={tab.label}
                value={providerCounts[tab.id]}
                icon={tab.icon}
                tone={SUMMARY_TONES[tab.id]}
                active={activeTab === tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearch("");
                }}
              />
            ))}
      </div>

      {/* ====================================================
          STATUS TABS
      ==================================================== */}

      <div className="no-scrollbar mb-5 overflow-x-auto">
        <div
          role="tablist"
          aria-label="Verification status"
          className="flex min-w-max gap-1.5 rounded-2xl border border-slate-200/70 bg-white p-1.5 shadow-card dark:border-ink-800 dark:bg-ink-900"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearch("");
                }}
                className={cn(
                  "flex min-h-10 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition sm:px-4",
                  isActive
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 dark:text-ink-300 dark:hover:bg-ink-800"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs tabular-nums",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-ink-300"
                  )}
                >
                  {providerCounts[tab.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ====================================================
          SEARCH + REFRESH
      ==================================================== */}

      <div className="card mb-5 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-ink-500" />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, matric number or phone…"
              aria-label="Search verification providers"
              autoComplete="off"
              className="search-input h-11 pl-10 pr-12"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-ink-800 dark:hover:text-ink-100"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Button
            variant="outline"
            icon={RefreshCw}
            loading={isFetching}
            onClick={() => {
              void refetch();
            }}
            className="h-11 w-full sm:w-auto"
          >
            Refresh
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-ink-800">
          <p
            className="text-sm text-slate-500 dark:text-ink-400"
            aria-live="polite"
          >
            {isLoading ? (
              "Loading providers…"
            ) : (
              <>
                Showing{" "}
                <span className="font-semibold text-slate-800 dark:text-ink-100">
                  {filteredProviders.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-800 dark:text-ink-100">
                  {providerCounts[activeTab]}
                </span>{" "}
                {activeTabMeta.label.toLowerCase()}{" "}
                {providerCounts[activeTab] === 1 ? "provider" : "providers"}
              </>
            )}
          </p>

          {search && !isLoading && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/50"
            >
              <X className="h-3.5 w-3.5" />
              Clear search
            </button>
          )}
        </div>
      </div>

      {/* ====================================================
          ACTION FEEDBACK
      ==================================================== */}

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "mb-4 flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm",
            feedback.type === "success"
              ? "border-success-200 bg-success-50 text-success-700 dark:border-success-600/30 dark:bg-success-600/10 dark:text-success-200"
              : "border-danger-200 bg-danger-50 text-danger-700 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-200"
          )}
        >
          <span className="flex items-start gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </span>

          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Dismiss message"
            className="shrink-0 rounded-lg p-1 transition hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Background-refresh failure with cached data still visible */}
      {isError && providers.length > 0 && (
        <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:border-warning-600/30 dark:bg-warning-600/10 dark:text-warning-200 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Showing the last loaded providers. {errorMessage}</span>
          </span>

          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="shrink-0 self-start font-semibold underline underline-offset-2 hover:no-underline sm:self-auto"
          >
            Retry
          </button>
        </div>
      )}

      {/* ====================================================
          TAB DESCRIPTION
      ==================================================== */}

      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-ink-50">
            {activeTabMeta.label} Providers
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-ink-400">
            {activeTabMeta.description}
          </p>
        </div>
      </div>

      {/* ====================================================
          CONTENT
      ==================================================== */}

      {isLoading ? (
        <VerificationSkeleton />
      ) : isError && providers.length === 0 ? (
        <ErrorState
          message={errorMessage}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : filteredProviders.length === 0 ? (
        <EmptyState
          icon={search ? Search : activeTabMeta.icon}
          title={emptyTitle}
          description={emptyDescription}
          action={
            search ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearch("")}
              >
                Clear search
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void refetch();
                }}
              >
                Refresh
              </Button>
            )
          }
        />
      ) : (
        <div className="card overflow-hidden">
          {/* ==============================================
              DESKTOP TABLE
          ============================================== */}

          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <caption className="sr-only">
                  Providers in the {activeTabMeta.label.toLowerCase()} queue
                </caption>

                <thead className="border-b border-slate-200/70 bg-slate-50/95 text-[11px] uppercase tracking-wider text-slate-500 dark:border-ink-800 dark:bg-ink-900/95 dark:text-ink-400">
                  <tr>
                    <th scope="col" className="px-5 py-3.5 font-semibold">
                      Provider
                    </th>
                    <th scope="col" className="px-5 py-3.5 font-semibold">
                      Contact
                    </th>
                    <th scope="col" className="px-5 py-3.5 font-semibold">
                      Categories
                    </th>
                    <th scope="col" className="px-5 py-3.5 font-semibold">
                      Status
                    </th>
                    <th scope="col" className="px-5 py-3.5 font-semibold">
                      Submitted
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3.5 text-right font-semibold"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-ink-800">
                  {filteredProviders.map((provider) => {
                    const providerId = getProviderId(provider);

                    return (
                      <tr
                        key={providerId}
                        className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-ink-800/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <ProviderAvatar
                              src={provider.avatar}
                              name={provider.name}
                            />

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900 dark:text-ink-50">
                                {provider.name}
                              </p>
                              <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400 dark:text-ink-500">
                                #{providerId.slice(-6).toUpperCase()}
                              </p>
                              {provider.location && (
                                <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-slate-400 dark:text-ink-500">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  {provider.location}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <p className="flex max-w-[220px] items-center gap-1.5 truncate text-slate-600 dark:text-ink-300">
                              <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-ink-500" />
                              <span className="truncate">
                                {provider.email || "No email"}
                              </span>
                            </p>
                            <p className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-ink-500">
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              {provider.phoneNumber || "No phone"}
                            </p>
                            {provider.matricNo && (
                              <p className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-ink-500">
                                <Hash className="h-3.5 w-3.5 shrink-0" />
                                {provider.matricNo}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <CategoryList categories={provider.categories} />
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={provider.status} />
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-500 dark:text-ink-400">
                          {formatDate(
                            provider.createdAt || provider.joinedDate
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <Link
                              to={`/admin/providers/${encodeURIComponent(
                                providerId
                              )}`}
                              aria-label={`View ${provider.name}'s profile`}
                              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:border-brand-500/40 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Link>

                            {renderActions(provider)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ==============================================
              MOBILE CARDS
          ============================================== */}

          <div className="divide-y divide-slate-100 dark:divide-ink-800 md:hidden">
            {filteredProviders.map((provider) => {
              const providerId = getProviderId(provider);

              return (
                <article
                  key={providerId}
                  className="p-4 transition-colors hover:bg-slate-50/70 dark:hover:bg-ink-800/30"
                >
                  <div className="flex items-start gap-3">
                    <ProviderAvatar
                      src={provider.avatar}
                      name={provider.name}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
                              {provider.name}
                            </p>
                            <StatusBadge status={provider.status} />
                          </div>

                          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-ink-400">
                            {provider.email || "No email address"}
                          </p>
                        </div>

                        <Link
                          to={`/admin/providers/${encodeURIComponent(
                            providerId
                          )}`}
                          aria-label={`View ${provider.name}'s profile`}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:border-brand-500/40 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>

                      {provider.categories &&
                        provider.categories.length > 0 && (
                          <div className="mt-2">
                            <CategoryList
                              categories={provider.categories}
                              max={3}
                            />
                          </div>
                        )}

                      <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-ink-800 dark:text-ink-400">
                        {provider.phoneNumber && (
                          <p className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-ink-500" />
                            {provider.phoneNumber}
                          </p>
                        )}

                        {provider.matricNo && (
                          <p className="flex items-center gap-1.5">
                            <Hash className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-ink-500" />
                            {provider.matricNo}
                          </p>
                        )}

                        {provider.location && (
                          <p className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-ink-500" />
                            {provider.location}
                          </p>
                        )}

                        <p className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-ink-500" />
                          Submitted{" "}
                          {formatDate(
                            provider.createdAt || provider.joinedDate
                          )}
                        </p>
                      </div>

                      <div className="mt-3">
                        {renderActions(provider, true)}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================
          CONFIRMATION DIALOG
      ==================================================== */}

      {confirmAction && (
        <ResponsiveModal
          open={Boolean(confirmAction)}
          onClose={() => {
            if (!isConfirming) setConfirmAction(null);
          }}
          title={
            confirmAction.action === "reject"
              ? "Reject provider?"
              : "Suspend provider?"
          }
          footer={
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmAction(null)}
                disabled={isConfirming}
                className="min-h-10"
              >
                Cancel
              </Button>

              <Button
                variant={
                  confirmAction.action === "reject" ? "danger" : "primary"
                }
                size="sm"
                loading={isConfirming}
                onClick={() => {
                  void handleConfirm();
                }}
                className="min-h-10"
              >
                {ACTION_LABELS[confirmAction.action]}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-ink-800 dark:bg-ink-800/40">
              <ProviderAvatar
                src={confirmAction.provider.avatar}
                name={confirmAction.provider.name}
                size="lg"
              />

              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900 dark:text-ink-50">
                  {confirmAction.provider.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-ink-400">
                  {confirmAction.provider.email || "No email address"}
                </p>
                <div className="mt-1.5">
                  <StatusBadge status={confirmAction.provider.status} />
                </div>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-slate-600 dark:text-ink-300">
              {confirmAction.action === "reject"
                ? "This provider will lose access to provider features until an admin restores their account. You can still restore them from the Rejected tab."
                : "This provider will no longer be able to accept bookings until an admin unsuspends their account. You can restore access from the Suspended tab."}
            </p>
          </div>
        </ResponsiveModal>
      )}
    </DashboardLayout>
  );
}

/* =========================================================
   SHARED BITS
========================================================= */

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-4 text-left shadow-sm transition sm:p-5",
        active
          ? "border-brand-300 bg-brand-50/70 ring-1 ring-brand-300 dark:border-brand-700 dark:bg-brand-950/30 dark:ring-brand-700"
          : "border-slate-200/70 bg-white hover:border-brand-200 hover:shadow-card-hover dark:border-ink-800 dark:bg-ink-900 dark:hover:border-ink-700"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            tone
          )}
        >
          <Icon className="h-5 w-5" />
        </span>

        {active && (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">
            Viewing
          </span>
        )}
      </div>

      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-ink-50">
        {value}
      </p>
      <p className="text-sm text-slate-500 dark:text-ink-400">{label}</p>
    </button>
  );
}

function ProviderAvatar({
  src,
  name,
  size = "md",
}: {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const sizes = {
    sm: "h-9 w-9 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
  };

  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-semibold text-brand-700 ring-1 ring-slate-900/5 dark:bg-brand-950 dark:text-brand-300 dark:ring-white/10",
        sizes[size]
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={name || "Provider avatar"}
          loading="lazy"
          onError={() => setFailedSrc(src || null)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ProviderStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;

  return (
    <span className={cn("badge", meta.className)}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

function CategoryList({
  categories,
  max = 2,
}: {
  categories?: string[];
  max?: number;
}) {
  const list = categories || [];

  if (list.length === 0) {
    return (
      <span className="text-xs text-slate-400 dark:text-ink-500">—</span>
    );
  }

  const visible = list.slice(0, max);

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((category, index) => (
        <Badge key={`${category}-${index}`} tone="neutral">
          {category}
        </Badge>
      ))}

      {list.length > visible.length && (
        <Badge tone="brand">+{list.length - visible.length}</Badge>
      )}
    </div>
  );
}

function ActionButton({
  action,
  onClick,
  loading,
  disabled,
  className,
}: {
  action: VerificationAction;
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
  className?: string;
}) {
  const Icon = ACTION_ICONS[action];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(
        "btn-sm min-h-10 touch-manipulation disabled:cursor-not-allowed disabled:opacity-60",
        ACTION_BUTTON_CLASSES[action],
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}

      {loading ? ACTION_PENDING_LABELS[action] : ACTION_LABELS[action]}
    </button>
  );
}

function VerificationSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="border-b border-slate-200/70 bg-slate-50/95 dark:border-ink-800 dark:bg-ink-900/95">
              <tr>
                {[
                  "Provider",
                  "Contact",
                  "Categories",
                  "Status",
                  "Submitted",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className={cn(
                      "px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-ink-500",
                      heading === "Actions" && "text-right"
                    )}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-ink-800">
              {Array.from({ length: 6 }).map((_, index) => (
                <tr key={index}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-2.5 w-20" />
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="mt-2 h-2.5 w-24" />
                  </td>

                  <td className="px-5 py-4">
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </td>

                  <td className="px-5 py-4">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </td>

                  <td className="px-5 py-4">
                    <Skeleton className="h-3.5 w-20" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-10 w-16 rounded-lg" />
                      <Skeleton className="h-10 w-20 rounded-lg" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-ink-800 md:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />

              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />

                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>

                <Skeleton className="mt-3 h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="mt-2 h-10 w-full rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
