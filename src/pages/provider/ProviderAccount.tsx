import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Lock,
  RefreshCw,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { motion } from "framer-motion";

import {
  DashboardLayout,
  DashboardHeader,
} from "@/components/DashboardLayout";
import {
  Badge,
  Button,
  ErrorState,
  Skeleton,
  cn,
} from "@/components/ui";
import { getApiErrorMessage, hasUserToken } from "@/lib/api";
import { providerNavItems } from "@/data/providerNavItems";
import {
  useBanks,
  useProviderAccount,
  useRefreshPaystackStatus,
  useSetupProviderAccount,
} from "@/hooks/queries";

/* =========================================================
   TYPES
========================================================= */

type Bank = {
  name: string;
  code: string;
  active?: boolean;
};

type ProviderAccountData = {
  accountName: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  isVerified: boolean;
  hasSubaccount: boolean;
};

const payoutSteps = [
  "Add and verify your bank account.",
  "Customers book and pay for your services.",
  "Your provider share is routed through your Paystack subaccount.",
];

/* =========================================================
   NORMALISATION
   The API returns loose records; normalise them once so the
   form and status panels always read the same shape.
========================================================= */

function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function normalizeAccount(
  raw?: Record<string, unknown>
): ProviderAccountData {
  return {
    accountName: asString(raw?.accountName),
    accountNumber: asString(raw?.accountNumber),
    bankCode: asString(raw?.bankCode),
    bankName: asString(raw?.bankName),
    isVerified: Boolean(raw?.isVerified),
    hasSubaccount: Boolean(raw?.hasSubaccount),
  };
}

function normalizeBanks(
  rows?: Array<Record<string, unknown>>
): Bank[] {
  if (!Array.isArray(rows)) return [];

  const seen = new Set<string>();
  const banks: Bank[] = [];

  rows.forEach((row) => {
    if (!row || typeof row !== "object") return;

    const code = asString(row.code).trim();
    const name = asString(row.name).trim();

    if (!code || !name || seen.has(code)) return;

    seen.add(code);

    banks.push({
      code,
      name,
      active:
        typeof row.active === "boolean" ? row.active : undefined,
    });
  });

  return banks;
}

function maskAccountNumber(accountNumber: string) {
  if (!accountNumber) return "";

  if (accountNumber.length < 4) {
    return accountNumber;
  }

  return `${"•".repeat(
    Math.max(0, accountNumber.length - 4)
  )}${accountNumber.slice(-4)}`;
}

/* =========================================================
   LOADING SKELETON
========================================================= */

function AccountSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <div className="card p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-11 w-11 rounded-full" />

            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-full max-w-md" />
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-5 dark:border-ink-800 sm:px-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-11 w-11 rounded-xl" />

              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <Skeleton className="h-12 w-full rounded-xl" />

            <div className="grid gap-5 sm:grid-cols-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>

            <Skeleton className="h-11 w-full rounded-xl sm:w-44" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export function ProviderAccount() {
  const accountQuery = useProviderAccount();
  const banksQuery = useBanks();
  const setupAccount = useSetupProviderAccount();
  const refreshStatus = useRefreshPaystackStatus();

  const [account, setAccount] =
    useState<ProviderAccountData>(() =>
      normalizeAccount(accountQuery.data?.account)
    );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const successTimer = useRef<number | null>(null);

  const saving = setupAccount.isPending;
  const refreshing = refreshStatus.isPending;

  const banks = useMemo(
    () => normalizeBanks(banksQuery.data),
    [banksQuery.data]
  );

  const selectedBank = useMemo(
    () =>
      banks.find(
        (bank) => bank.code === account.bankCode
      ),
    [banks, account.bankCode]
  );

  const accountSnapshot = accountQuery.data?.account;

  /**
   * Keep the editable draft in sync with the latest server
   * account. React Query's structural sharing means this only
   * fires when the backend actually returns new values.
   */
  useEffect(() => {
    if (!accountSnapshot) return;

    setAccount(normalizeAccount(accountSnapshot));
  }, [accountSnapshot]);

  useEffect(() => {
    return () => {
      if (successTimer.current !== null) {
        window.clearTimeout(successTimer.current);
      }
    };
  }, []);

  const flashSuccess = (message: string) => {
    if (successTimer.current !== null) {
      window.clearTimeout(successTimer.current);
    }

    setSuccess(message);

    successTimer.current = window.setTimeout(() => {
      setSuccess("");
      successTimer.current = null;
    }, 5000);
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const reload = () => {
    void accountQuery.refetch();
    void banksQuery.refetch();
  };

  const handleChange = (
    field: keyof ProviderAccountData,
    value: string
  ) => {
    clearMessages();

    if (field === "bankCode") {
      const bank = banks.find((item) => item.code === value);

      setAccount((previous) => ({
        ...previous,
        bankCode: value,
        bankName: bank?.name || "",
      }));

      return;
    }

    setAccount((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleAccountNumberChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, "").slice(0, 10);

    setAccount((previous) => ({
      ...previous,
      accountNumber: cleanValue,
      accountName: "",
      isVerified: false,
      hasSubaccount: false,
    }));

    clearMessages();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    clearMessages();

    if (!hasUserToken()) {
      setError("Your session has expired. Please login again.");
      return;
    }

    if (!account.bankCode) {
      setError("Please select your bank.");
      return;
    }

    if (account.accountNumber.length !== 10) {
      setError(
        "Please enter a valid 10-digit account number."
      );
      return;
    }

    try {
      const data = await setupAccount.mutateAsync({
        bankCode: account.bankCode,
        bankName: selectedBank?.name || account.bankName,
        accountNumber: account.accountNumber,
      });

      /**
       * Do not force isVerified to true here.
       *
       * Paystack may create the subaccount successfully
       * while verification is still pending.
       */
      setAccount((previous) => ({
        ...previous,
        accountName:
          asString(data.account?.accountName) ||
          previous.accountName,
        accountNumber:
          asString(data.account?.accountNumber) ||
          previous.accountNumber,
        bankName:
          asString(data.account?.bankName) ||
          previous.bankName,
        isVerified: Boolean(data.account?.isVerified),
        hasSubaccount: Boolean(data.account?.hasSubaccount),
      }));

      flashSuccess(
        data.account?.isVerified
          ? "Your payout account has been verified successfully."
          : "Your payout account has been saved. Paystack verification is still pending."
      );
    } catch (err) {
      setError(
        getApiErrorMessage(err) ||
          "Something went wrong while saving your account."
      );
    }
  };

  /**
   * Refresh Paystack verification status.
   *
   * This asks the backend to check the provider's actual
   * Paystack subaccount and synchronize isVerified.
   */
  const refreshPaystackStatus = async () => {
    clearMessages();

    if (!hasUserToken()) {
      setError("Your session has expired. Please login again.");
      return;
    }

    try {
      const data = await refreshStatus.mutateAsync();

      setAccount((previous) => ({
        ...previous,
        accountName:
          asString(data.account?.accountName) ||
          previous.accountName,
        accountNumber:
          asString(data.account?.accountNumber) ||
          previous.accountNumber,
        bankName:
          asString(data.account?.bankName) ||
          previous.bankName,
        isVerified: Boolean(data.account?.isVerified),
        hasSubaccount: Boolean(data.account?.subaccountCode),
      }));

      flashSuccess(
        data.account?.isVerified
          ? "Your Paystack account is now verified and ready to receive payments."
          : "Your Paystack account is connected, but verification is still pending."
      );
    } catch (err) {
      setError(
        getApiErrorMessage(err) ||
          "Unable to refresh Paystack verification status."
      );
    }
  };

  /* =========================================================
     DERIVED STATE
  ========================================================= */

  const isAuthenticated = hasUserToken();

  const isLoading = isAuthenticated && accountQuery.isLoading;

  const banksLoading = banksQuery.isLoading;

  const accountLoadError = !isAuthenticated
    ? "Your session has expired. Please login again."
    : accountQuery.isError
      ? getApiErrorMessage(accountQuery.error) ||
        "Failed to load payment account"
      : accountQuery.data?.success === false
        ? accountQuery.data.message ||
          "Failed to load payment account"
        : "";

  const banksLoadError = banksQuery.isError
    ? getApiErrorMessage(banksQuery.error) ||
      "Failed to load supported banks"
    : "";

  const hasAccount = Boolean(
    account.bankCode ||
      account.bankName ||
      account.accountNumber ||
      account.accountName ||
      account.hasSubaccount ||
      account.isVerified
  );

  const canRefreshStatus =
    account.isVerified || account.hasSubaccount;

  const statusMeta = account.isVerified
    ? {
        tone: "success" as const,
        label: "Account verified",
        title: "Ready to receive payments",
        description:
          "Your payout account is connected and verified. Earnings from completed bookings will be paid into this account.",
        icon: CheckCircle2,
        accent: "border-l-emerald-500",
        surface:
          "bg-emerald-50/70 dark:bg-emerald-500/10",
        iconWrap:
          "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
        titleClass:
          "text-emerald-900 dark:text-emerald-100",
        bodyClass:
          "text-emerald-800/80 dark:text-emerald-200/80",
      }
    : account.hasSubaccount
      ? {
          tone: "warning" as const,
          label: "Verification pending",
          title: "Verification pending",
          description:
            "Your Paystack account is connected, but Paystack verification has not yet been synchronized.",
          icon: AlertCircle,
          accent: "border-l-amber-500",
          surface: "bg-amber-50/70 dark:bg-amber-500/10",
          iconWrap:
            "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
          titleClass: "text-amber-900 dark:text-amber-100",
          bodyClass:
            "text-amber-800/80 dark:text-amber-200/80",
        }
      : {
          tone: "brand" as const,
          label: "Setup required",
          title: "Setup incomplete",
          description:
            "Add and verify your bank account to start receiving payments.",
          icon: AlertCircle,
          accent: "border-l-brand-500",
          surface: "bg-brand-50/70 dark:bg-brand-950/30",
          iconWrap:
            "bg-brand-100 text-brand-600 dark:bg-brand-950 dark:text-brand-300",
          titleClass: "text-brand-900 dark:text-brand-100",
          bodyClass:
            "text-brand-800/80 dark:text-brand-200/80",
        };

  const StatusIcon = statusMeta.icon;

  /* =========================================================
     LOADING
  ========================================================= */

  if (isLoading) {
    return (
      <DashboardLayout
        role="provider"
        navItems={providerNavItems}
      >
        <DashboardHeader
          title="Payment Account"
          subtitle="Manage where you receive your earnings"
        />

        <AccountSkeleton />
      </DashboardLayout>
    );
  }

  /* =========================================================
     LOAD ERROR
  ========================================================= */

  if (accountLoadError) {
    return (
      <DashboardLayout
        role="provider"
        navItems={providerNavItems}
      >
        <DashboardHeader
          title="Payment Account"
          subtitle="Manage the bank account where your Servicely earnings are paid"
        />

        <div className="max-w-2xl">
          <ErrorState
            message={accountLoadError}
            onRetry={
              isAuthenticated
                ? () => reload()
                : undefined
            }
          />
        </div>
      </DashboardLayout>
    );
  }

  /* =========================================================
     READY
  ========================================================= */

  return (
    <DashboardLayout
      role="provider"
      navItems={providerNavItems}
    >
      <DashboardHeader
        title="Payment Account"
        subtitle="Manage the bank account where your Servicely earnings are paid"
        action={
          <Badge
            tone={statusMeta.tone}
            icon={statusMeta.icon}
          >
            {statusMeta.label}
          </Badge>
        }
      />

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-slate-950 px-5 py-6 text-white shadow-soft sm:px-7 sm:py-7"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-14 -top-24 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -right-3 -top-12 h-44 w-44 rounded-full border border-white/10" />
          <div className="absolute -bottom-28 left-[42%] h-52 w-52 rounded-full bg-white/[0.04]" />
        </div>
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85 backdrop-blur">
              <WalletCards className="h-3.5 w-3.5" />
              Provider payouts
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Your earnings, delivered securely.</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-white/75 sm:text-base">
              Connect a Nigerian bank account to receive your share from completed bookings. You can update your payout details at any time.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-sm lg:min-w-64">
            <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", account.isVerified ? "bg-emerald-400/20 text-emerald-200" : account.hasSubaccount ? "bg-amber-300/20 text-amber-100" : "bg-white/15 text-white")}>
              <StatusIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white/65">Payout setup</p>
              <p className="mt-0.5 truncate text-sm font-semibold">{statusMeta.label}</p>
            </div>
            <span className={cn("ml-auto h-2.5 w-2.5 shrink-0 rounded-full", account.isVerified ? "bg-emerald-300" : account.hasSubaccount ? "bg-amber-300" : "bg-white/50")} />
          </div>
        </div>
        <div className="relative mt-7 grid gap-3 border-t border-white/15 pt-5 sm:grid-cols-3 sm:gap-5">
          {payoutSteps.map((step, index) => (
            <div key={step} className="flex items-center gap-3 text-sm text-white/75">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs font-bold text-white">{index + 1}</span>
              <span className="leading-5">{step}</span>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } } }}
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
      >
        {/* MAIN COLUMN */}
        <div className="space-y-6">
          {/* VERIFICATION STATUS BANNER */}
          <section
            aria-label="Payout verification status"
            className={cn(
              "card overflow-hidden border-l-4",
              statusMeta.accent,
              statusMeta.surface
            )}
          >
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                    statusMeta.iconWrap
                  )}
                >
                  <StatusIcon className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      statusMeta.titleClass
                    )}
                  >
                    {statusMeta.title}
                  </p>

                  <p
                    className={cn(
                      "mt-1 text-sm leading-6",
                      statusMeta.bodyClass
                    )}
                  >
                    {statusMeta.description}
                  </p>

                  {account.bankName && (
                    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-600 dark:text-ink-300">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span>{account.bankName}</span>

                      {account.accountNumber && (
                        <>
                          <span aria-hidden="true">•</span>
                          <span className="font-mono tracking-widest">
                            {maskAccountNumber(
                              account.accountNumber
                            )}
                          </span>
                        </>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {canRefreshStatus && (
                <Button
                  type="button"
                  variant="outline"
                  icon={RefreshCw}
                  loading={refreshing}
                  disabled={refreshing || saving}
                  onClick={() =>
                    void refreshPaystackStatus()
                  }
                  className="w-full shrink-0 sm:w-auto"
                >
                  {refreshing
                    ? "Checking Paystack..."
                    : "Refresh status"}
                </Button>
              )}
            </div>
          </section>

          {/* ACTION FEEDBACK */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-danger-200 bg-danger-50/70 p-4 text-sm text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/10 dark:text-danger-200"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <p className="font-semibold">
                  Unable to save account
                </p>

                <p className="mt-1 leading-5">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <p className="font-semibold">
                  Payment account update
                </p>

                <p className="mt-1 leading-5">{success}</p>
              </div>
            </div>
          )}

          {/* PAYOUT FORM */}
          <form
            onSubmit={handleSubmit}
            aria-busy={saving}
            className="card overflow-hidden"
          >
            <div className="border-b border-slate-100 bg-gradient-to-br from-brand-50/80 via-white to-white px-5 py-5 dark:border-ink-800 dark:from-brand-950/30 dark:via-ink-900 dark:to-ink-900 sm:px-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
                  <WalletCards className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-ink-50">
                    Payout details
                  </h2>

                  <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-ink-400">
                    Enter the Nigerian bank account where you
                    want to receive payments for completed
                    services.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              {/* BANK */}
              <div>
                <label
                  htmlFor="provider-bank"
                  className="label"
                >
                  Bank
                </label>

                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <select
                    id="provider-bank"
                    value={account.bankCode}
                    onChange={(event) =>
                      handleChange(
                        "bankCode",
                        event.target.value
                      )
                    }
                    disabled={banksLoading || saving}
                    aria-invalid={Boolean(banksLoadError)}
                    className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-11 text-base text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-50 dark:focus:border-brand-400 sm:text-sm"
                  >
                    <option value="">
                      {banksLoading
                        ? "Loading banks..."
                        : "Select your bank"}
                    </option>

                    {banks.map((bank) => (
                      <option
                        key={bank.code}
                        value={bank.code}
                      >
                        {bank.name}
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                </div>

                {banksLoadError ? (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-danger-600 dark:text-danger-300">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{banksLoadError}</span>

                    <button
                      type="button"
                      onClick={() => void banksQuery.refetch()}
                      className="font-semibold underline underline-offset-2 hover:no-underline"
                    >
                      Retry
                    </button>
                  </div>
                ) : !banksLoading && banks.length === 0 ? (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      No banks are available right now.
                    </span>

                    <button
                      type="button"
                      onClick={() => void banksQuery.refetch()}
                      className="font-semibold underline underline-offset-2 hover:no-underline"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-500 dark:text-ink-400">
                    Choose the bank linked to your payout
                    account.
                  </p>
                )}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* ACCOUNT NUMBER */}
                <div>
                  <label
                    htmlFor="provider-account-number"
                    className="label"
                  >
                    Account number
                  </label>

                  <div className="relative">
                    <CreditCard className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="provider-account-number"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={10}
                      value={account.accountNumber}
                      onChange={(event) =>
                        handleAccountNumberChange(
                          event.target.value
                        )
                      }
                      placeholder="10-digit account number"
                      disabled={saving}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-16 text-base tracking-wide text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-50 dark:focus:border-brand-400 sm:text-sm"
                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                      {account.accountNumber.length}/10
                    </span>
                  </div>

                  {account.accountNumber.length === 10 ? (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <Check className="h-3.5 w-3.5 shrink-0" />
                      Valid account number length
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500 dark:text-ink-400">
                      Enter the 10-digit NUBAN for this
                      account.
                    </p>
                  )}
                </div>

                {/* ACCOUNT NAME */}
                <div>
                  <label
                    htmlFor="provider-account-name"
                    className="label"
                  >
                    Account name
                  </label>

                  <div className="relative">
                    <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="provider-account-name"
                      type="text"
                      value={account.accountName}
                      readOnly
                      placeholder="Resolved by Paystack"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-base font-medium text-slate-800 outline-none dark:border-ink-700 dark:bg-ink-800/60 dark:text-ink-200 sm:text-sm"
                    />
                  </div>

                  {account.accountName ? (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <Check className="h-3.5 w-3.5 shrink-0" />
                      Account name verified by Paystack
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500 dark:text-ink-400">
                      The verified account name appears here
                      after Paystack confirms your details.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* SAVE ACTIONS */}
            <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/70 px-5 py-4 dark:border-ink-800 dark:bg-ink-800/30 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-ink-400">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Secured by Paystack. Your bank details are
                  never stored in the browser.
                </span>
              </p>

              <Button
                type="submit"
                icon={
                  account.hasSubaccount
                    ? RefreshCw
                    : ShieldCheck
                }
                loading={saving}
                disabled={
                  saving ||
                  refreshing ||
                  banksLoading ||
                  !account.bankCode ||
                  account.accountNumber.length !== 10
                }
                className="w-full sm:w-auto"
              >
                {saving
                  ? "Verifying account..."
                  : account.hasSubaccount
                    ? "Update account"
                    : "Verify account"}
              </Button>
            </div>
          </form>
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-6">
          {/* PAYOUT STATUS */}
          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-ink-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                  <WalletCards className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-ink-50">
                    Payout status
                  </h2>

                  <p className="text-xs text-slate-500 dark:text-ink-400">
                    Your provider payment setup
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5">
              {hasAccount ? (
                <>
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-ink-800/60">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-ink-400">
                      Connected account
                    </p>

                    <p className="mt-2 font-semibold text-slate-900 dark:text-ink-50">
                      {account.bankName || "Bank pending"}
                    </p>

                    <p className="mt-1 font-mono text-sm tracking-widest text-slate-600 dark:text-ink-300">
                      {maskAccountNumber(
                        account.accountNumber
                      ) || "—"}
                    </p>

                    {account.accountName && (
                      <p className="mt-2 text-xs text-slate-500 dark:text-ink-400">
                        {account.accountName}
                      </p>
                    )}
                  </div>

                  <dl className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-500 dark:text-ink-400">
                        Verification
                      </dt>

                      <dd>
                        <Badge tone={statusMeta.tone}>
                          {statusMeta.label}
                        </Badge>
                      </dd>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-500 dark:text-ink-400">
                        Subaccount
                      </dt>

                      <dd
                        className={cn(
                          "text-xs font-semibold",
                          account.hasSubaccount
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-500 dark:text-ink-400"
                        )}
                      >
                        {account.hasSubaccount
                          ? "Connected"
                          : "Not created"}
                      </dd>
                    </div>
                  </dl>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center dark:border-ink-700">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-ink-800 dark:text-ink-500">
                    <WalletCards className="h-5 w-5" />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-ink-50">
                    No payout account yet
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-ink-400">
                    Add your bank details to start receiving
                    earnings.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* SECURITY */}
          <div className="card p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <Lock className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-ink-50">
                  Your information is protected
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-ink-400">
                  Your bank details are sent securely to
                  Servicely's backend for verification. Your
                  Paystack credentials are never exposed in
                  the browser.
                </p>
              </div>
            </div>
          </div>

          {/* HOW IT WORKS */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-ink-50">
              How payouts work
            </h2>

            <div className="mt-4 space-y-4">
              {payoutSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex gap-3"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                    {index + 1}
                  </div>

                  <p className="text-sm leading-6 text-slate-500 dark:text-ink-400">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </motion.div>
    </DashboardLayout>
  );
}
