import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  ChevronDown,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
  WalletCards,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import {
  DashboardLayout,
  DashboardHeader,
} from "@/components/DashboardLayout";

import { providerNavItems } from "@/data/providerNavItems";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

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

export function ProviderAccount() {
  const [account, setAccount] =
    useState<ProviderAccountData>({
      accountName: "",
      accountNumber: "",
      bankCode: "",
      bankName: "",
      isVerified: false,
      hasSubaccount: false,
    });

  const [banks, setBanks] = useState<Bank[]>([]);

  const [loading, setLoading] = useState(true);
  const [banksLoading, setBanksLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = sessionStorage.getItem("servicely_token");

  const selectedBank = useMemo(
    () =>
      banks.find(
        (bank) =>
          String(bank.code) === String(account.bankCode)
      ),
    [banks, account.bankCode]
  );

  useEffect(() => {
    loadAccount();
    loadBanks();
  }, []);

  const loadAccount = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        setError(
          "Your session has expired. Please login again."
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/provider-account/account`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
          "Failed to load payment account"
        );
      }

      setAccount({
        accountName:
          data.account?.accountName || "",
        accountNumber:
          data.account?.accountNumber || "",
        bankCode:
          data.account?.bankCode || "",
        bankName:
          data.account?.bankName || "",
        isVerified: Boolean(
          data.account?.isVerified
        ),
        hasSubaccount: Boolean(
          data.account?.hasSubaccount
        ),
      });
    } catch (err: any) {
      setError(
        err.message ||
        "Failed to load payment account"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadBanks = async () => {
    try {
      setBanksLoading(true);

      if (!token) return;

      const response = await fetch(
        `${API_URL}/provider-account/banks`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
          "Failed to load banks"
        );
      }

      setBanks(data.banks || []);
    } catch (err: any) {
      setError(
        err.message ||
        "Failed to load supported banks"
      );
    } finally {
      setBanksLoading(false);
    }
  };

  /**
   * Refresh Paystack verification status
   *
   * This asks the backend to check the provider's
   * actual Paystack subaccount and synchronize
   * isVerified into MongoDB.
   */
  const refreshPaystackStatus = async () => {
    try {
      setRefreshing(true);
      setError("");
      setSuccess("");

      if (!token) {
        setError(
          "Your session has expired. Please login again."
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/provider-account/refresh-paystack-status`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      console.log(
        "REFRESH PAYSTACK STATUS:",
        data
      );

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
          "Unable to refresh Paystack verification status."
        );
      }

      setAccount((previous) => ({
        ...previous,
        accountName:
          data.account?.accountName ||
          previous.accountName,
        accountNumber:
          data.account?.accountNumber ||
          previous.accountNumber,
        bankName:
          data.account?.bankName ||
          previous.bankName,
        isVerified: Boolean(
          data.account?.isVerified
        ),
        hasSubaccount: Boolean(
          data.account?.subaccountCode
        ),
      }));

      if (data.account?.isVerified) {
        setSuccess(
          "Your Paystack account is now verified and ready to receive payments."
        );
      } else {
        setSuccess(
          "Your Paystack account is connected, but verification is still pending."
        );
      }

      setTimeout(() => {
        setSuccess("");
      }, 5000);
    } catch (err: any) {
      console.error(
        "REFRESH PAYSTACK STATUS ERROR:",
        err
      );

      setError(
        err.message ||
        "Unable to refresh Paystack verification status."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleChange = (
    field: keyof ProviderAccountData,
    value: string
  ) => {
    setAccount((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
    setSuccess("");

    if (field === "bankCode") {
      const bank = banks.find(
        (item) => item.code === value
      );

      setAccount((previous) => ({
        ...previous,
        bankCode: value,
        bankName: bank?.name || "",
      }));
    }
  };

  const handleAccountNumberChange = (
    value: string
  ) => {
    const cleanValue = value
      .replace(/\D/g, "")
      .slice(0, 10);

    setAccount((previous) => ({
      ...previous,
      accountNumber: cleanValue,
      accountName: "",
      isVerified: false,
      hasSubaccount: false,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError(
        "Your session has expired. Please login again."
      );
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
      setSaving(true);

      const response = await fetch(
        `${API_URL}/provider-account/account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bankCode: account.bankCode,
            bankName:
              selectedBank?.name ||
              account.bankName,
            accountNumber:
              account.accountNumber,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "SAVE PROVIDER ACCOUNT RESPONSE:",
        data
      );

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
          "Unable to setup payment account"
        );
      }

      /**
       * Do not force isVerified to true here.
       *
       * Paystack may create the subaccount successfully
       * while verification is still pending.
       */
      setAccount((previous) => ({
        ...previous,
        accountName:
          data.account?.accountName ||
          previous.accountName,
        accountNumber:
          data.account?.accountNumber ||
          previous.accountNumber,
        bankName:
          data.account?.bankName ||
          previous.bankName,
        isVerified: Boolean(
          data.account?.isVerified
        ),
        hasSubaccount: Boolean(
          data.account?.hasSubaccount
        ),
      }));

      if (data.account?.isVerified) {
        setSuccess(
          "Your payout account has been verified successfully."
        );
      } else {
        setSuccess(
          "Your payout account has been saved. Paystack verification is still pending."
        );
      }

      setTimeout(() => {
        setSuccess("");
      }, 5000);
    } catch (err: any) {
      setError(
        err.message ||
        "Something went wrong while saving your account."
      );
    } finally {
      setSaving(false);
    }
  };

  const maskAccountNumber = (
    accountNumber: string
  ) => {
    if (!accountNumber) return "";

    if (accountNumber.length < 4) {
      return accountNumber;
    }

    return `${"•".repeat(
      Math.max(
        0,
        accountNumber.length - 4
      )
    )}${accountNumber.slice(-4)}`;
  };

  if (loading) {
    return (
      <DashboardLayout
        role="provider"
        navItems={providerNavItems}
      >
        <DashboardHeader
          title="Payment Account"
          subtitle="Manage where you receive your earnings"
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="card animate-pulse p-6">
            <div className="h-7 w-48 rounded-lg bg-ink-100 dark:bg-ink-800" />

            <div className="mt-3 h-4 w-72 rounded bg-ink-100 dark:bg-ink-800" />

            <div className="mt-8 space-y-5">
              <div className="h-14 rounded-xl bg-ink-100 dark:bg-ink-800" />
              <div className="h-14 rounded-xl bg-ink-100 dark:bg-ink-800" />
              <div className="h-14 rounded-xl bg-ink-100 dark:bg-ink-800" />
            </div>
          </div>

          <div className="card animate-pulse p-6">
            <div className="h-6 w-40 rounded bg-ink-100 dark:bg-ink-800" />

            <div className="mt-5 h-28 rounded-2xl bg-ink-100 dark:bg-ink-800" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="provider"
      navItems={providerNavItems}
    >
      <DashboardHeader
        title="Payment Account"
        subtitle="Manage the bank account where your Servicely earnings are paid"
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* MAIN FORM */}
        <div className="card overflow-hidden">
          {/* HEADER */}
          <div className="border-b border-ink-100 bg-gradient-to-br from-primary-50 via-white to-white p-6 dark:border-ink-800 dark:from-primary-950/30 dark:via-ink-900 dark:to-ink-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-600/20">
                  <WalletCards className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-ink-900 dark:text-ink-50">
                    Payout account
                  </h2>

                  <p className="mt-1 max-w-xl text-sm leading-6 text-ink-500 dark:text-ink-400">
                    Add the Nigerian bank account where you
                    want to receive payments for completed
                    services.
                  </p>
                </div>
              </div>

              {account.isVerified ? (
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <Check className="h-4 w-4" />
                  Account verified
                </div>
              ) : account.hasSubaccount ? (
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                  Verification pending
                </div>
              ) : (
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                  Setup required
                </div>
              )}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6"
          >
            {/* ERROR */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                <div>
                  <p className="font-semibold">
                    Unable to save account
                  </p>

                  <p className="mt-1">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* SUCCESS */}
            {success && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400">
                <Check className="mt-0.5 h-5 w-5 shrink-0" />

                <div>
                  <p className="font-semibold">
                    Payment account update
                  </p>

                  <p className="mt-1">
                    {success}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* BANK */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-ink-800 dark:text-ink-200">
                  Bank
                </label>

                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />

                  <select
                    value={account.bankCode}
                    onChange={(event) =>
                      handleChange(
                        "bankCode",
                        event.target.value
                      )
                    }
                    disabled={
                      banksLoading || saving
                    }
                    className="w-full appearance-none rounded-xl border border-ink-200 bg-white py-3.5 pl-12 pr-11 text-sm text-ink-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100"
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

                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
                </div>
              </div>

              {/* ACCOUNT NUMBER */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-ink-800 dark:text-ink-200">
                  Account number
                </label>

                <div className="relative">
                  <CreditCard className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={account.accountNumber}
                    onChange={(event) =>
                      handleAccountNumberChange(
                        event.target.value
                      )
                    }
                    placeholder="Enter your 10-digit account number"
                    disabled={saving}
                    className="w-full rounded-xl border border-ink-200 bg-white py-3.5 pl-12 pr-4 text-base sm:text-sm tracking-wide text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100"
                  />
                </div>

                <p className="mt-2 text-xs text-ink-400">
                  Your account number is securely used to
                  identify your payout account.
                </p>
              </div>

              {/* ACCOUNT NAME */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-ink-800 dark:text-ink-200">
                  Account name
                </label>

                <div className="relative">
                  <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />

                  <input
                    type="text"
                    value={account.accountName}
                    readOnly
                    placeholder="Account name will appear after verification"
                    className="w-full rounded-xl border border-ink-200 bg-ink-50 py-3.5 pl-12 pr-4 text-base font-medium text-ink-800 outline-none sm:text-sm dark:border-ink-700 dark:bg-ink-800/50 dark:text-ink-200"
                  />
                </div>

                {account.accountName && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                    Account name verified by Paystack
                  </p>
                )}
              </div>

              {/* SAVE */}
              <button
                type="submit"
                disabled={
                  saving ||
                  refreshing ||
                  banksLoading ||
                  !account.bankCode ||
                  account.accountNumber.length !== 10
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/20 transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verifying account...
                  </>
                ) : account.hasSubaccount ? (
                  <>
                    <RefreshCw className="h-5 w-5" />
                    Update payout account
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-5 w-5" />
                    Verify & save account
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT INFORMATION PANEL */}
        <div className="space-y-6">
          {/* PAYOUT STATUS */}
          <div className="card overflow-hidden">
            <div className="border-b border-ink-100 p-5 dark:border-ink-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                  <WalletCards className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="font-bold text-ink-900 dark:text-ink-50">
                    Payout status
                  </h3>

                  <p className="text-xs text-ink-500">
                    Your provider payment setup
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="rounded-2xl bg-ink-50 p-4 dark:bg-ink-800/60">
                {account.isVerified ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <Check className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="font-semibold text-ink-900 dark:text-ink-50">
                          Ready to receive payments
                        </p>

                        <p className="mt-1 text-xs text-ink-500">
                          Your payout account is connected and verified.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-ink-200 pt-4 dark:border-ink-700">
                      <p className="text-xs text-ink-400">
                        Connected account
                      </p>

                      <p className="mt-1 font-semibold text-ink-800 dark:text-ink-200">
                        {account.bankName}
                      </p>

                      <p className="mt-1 text-sm tracking-widest text-ink-500">
                        {maskAccountNumber(
                          account.accountNumber
                        )}
                      </p>
                    </div>

                    {/* REFRESH VERIFIED STATUS */}
                    <button
                      type="button"
                      onClick={refreshPaystackStatus}
                      disabled={refreshing}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm font-semibold text-ink-700 transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800"
                    >
                      {refreshing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Checking Paystack...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Refresh verification
                        </>
                      )}
                    </button>
                  </>
                ) : account.hasSubaccount ? (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                        <AlertCircle className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="font-semibold text-ink-900 dark:text-ink-50">
                          Verification pending
                        </p>

                        <p className="mt-1 text-xs leading-5 text-ink-500">
                          Your Paystack account is connected,
                          but Paystack verification has not yet
                          been synchronized.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={refreshPaystackStatus}
                      disabled={refreshing}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {refreshing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Checking Paystack...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Refresh verification
                        </>
                      )}
                    </button>

                    <p className="mt-3 text-center text-xs leading-5 text-ink-400">
                      If you have already completed verification
                      on Paystack, click the button above to sync
                      the latest status.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                        <AlertCircle className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="font-semibold text-ink-900 dark:text-ink-50">
                          Setup incomplete
                        </p>

                        <p className="mt-1 text-xs text-ink-500">
                          Add and verify your bank account.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* SECURITY */}
          <div className="card p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <Lock className="h-5 w-5" />
              </div>

              <div>
                <h3 className="font-semibold text-ink-900 dark:text-ink-50">
                  Your information is protected
                </h3>

                <p className="mt-2 text-sm leading-6 text-ink-500 dark:text-ink-400">
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
            <h3 className="font-semibold text-ink-900 dark:text-ink-50">
              How payouts work
            </h3>

            <div className="mt-4 space-y-4">
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">
                  1
                </div>

                <p className="text-sm leading-6 text-ink-500">
                  Add and verify your bank account.
                </p>
              </div>

              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">
                  2
                </div>

                <p className="text-sm leading-6 text-ink-500">
                  Customers book and pay for your services.
                </p>
              </div>

              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">
                  3
                </div>

                <p className="text-sm leading-6 text-ink-500">
                  Your provider share is routed through your
                  Paystack subaccount.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}