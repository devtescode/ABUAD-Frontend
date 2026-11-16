import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowUpRight,
  Clock,
  Download,
  Info,
  Landmark,
  Receipt,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import {
  DashboardLayout,
  DashboardHeader,
  StatCard,
} from '../../components/DashboardLayout';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  SearchBar,
  Skeleton,
  cn,
} from '../../components/ui';
import { providerNavItems } from '../../data/providerNavItems';
import { formatNaira } from '../../data/mockData';
import { getApiErrorMessage, hasUserToken } from '../../lib/api';
import {
  useProviderEarnings,
  type ProviderEarningsTransaction,
  type ProviderEarningsTrendPoint,
} from '@/hooks/queries';
import { useProviderEarningsStream } from '@/hooks/useProviderEarningsStream';

/* =========================================================
   FORMATTERS
========================================================= */

type BadgeTone =
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

function amount(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function naira(value: unknown): string {
  return formatNaira(amount(value));
}

function transactionDateValue(transaction: ProviderEarningsTransaction): string {
  return transaction.paidAt || transaction.date || transaction.createdAt || '';
}

function formatTransactionDate(
  transaction: ProviderEarningsTransaction
): string {
  const raw = transactionDateValue(transaction);

  if (!raw) return '—';

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return parsed.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function transactionTimestamp(
  transaction: ProviderEarningsTransaction
): number {
  const raw = transactionDateValue(transaction);

  if (!raw) return 0;

  const parsed = new Date(raw).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatChannel(channel?: string | null): string {
  if (!channel) return '';

  return channel
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

/* =========================================================
   STATUS MAPPING
========================================================= */

const statusMeta: Record<string, { label: string; tone: BadgeTone }> = {
  completed: { label: 'Completed', tone: 'success' },
  reviewed: { label: 'Reviewed', tone: 'brand' },
  paid: { label: 'Confirmed', tone: 'info' },
  confirmed: { label: 'Confirmed', tone: 'info' },
  accepted: { label: 'Confirmed', tone: 'info' },
  in_progress: { label: 'In progress', tone: 'warning' },
  pending: { label: 'Pending', tone: 'warning' },
  payment_pending: { label: 'Payment pending', tone: 'warning' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  canceled: { label: 'Cancelled', tone: 'neutral' },
  rejected: { label: 'Rejected', tone: 'danger' },
  disputed: { label: 'Disputed', tone: 'danger' },
  refunded: { label: 'Refunded', tone: 'neutral' },
};

function normalizeStatus(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function TransactionStatusBadge({
  status,
  fallback,
}: {
  status?: string;
  fallback?: string;
}) {
  const raw = status?.trim() || fallback?.trim() || '';
  const meta = statusMeta[normalizeStatus(raw)];

  if (!meta) {
    return (
      <Badge tone="neutral" className="capitalize">
        {raw ? raw.replace(/[_-]+/g, ' ') : 'Unknown'}
      </Badge>
    );
  }

  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

/* =========================================================
   LIVE STATUS
========================================================= */

function LiveStatus({
  connected,
  error,
}: {
  connected: boolean;
  error?: string | null;
}) {
  return (
    <span
      aria-live="polite"
      title={
        connected
          ? 'Live earnings updates connected'
          : error || 'Reconnecting to live earnings updates'
      }
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold',
        connected
          ? 'bg-success-50 text-success-700 dark:bg-success-600/15 dark:text-success-200'
          : 'bg-warning-50 text-warning-700 dark:bg-warning-600/15 dark:text-warning-200'
      )}
    >
      <span className="relative flex h-2 w-2" aria-hidden="true">
        {connected && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-500 opacity-75" />
        )}
        <span
          className={cn(
            'relative inline-flex h-2 w-2 rounded-full',
            connected ? 'bg-success-500' : 'bg-warning-500'
          )}
        />
      </span>
      <span className="whitespace-nowrap">
        {connected ? 'Live' : 'Reconnecting…'}
      </span>
    </span>
  );
}

/* =========================================================
   EARNINGS TREND CHART (no chart library)
========================================================= */

function EarningsTrendChart({
  points,
}: {
  points: ProviderEarningsTrendPoint[];
}) {
  const visible = points.slice(-6);

  if (visible.length === 0) {
    return (
      <div className="mt-5 flex h-44 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 text-center text-sm text-slate-500 dark:border-ink-700 dark:bg-ink-800/20 dark:text-ink-400">
        No trend data yet. Your monthly earnings will appear here.
      </div>
    );
  }

  const maxTotal = Math.max(
    1,
    ...visible.map(
      (point) => amount(point.earnings) + amount(point.commission)
    )
  );

  const ariaLabel = `Earnings trend for the last ${visible.length} months: ${visible
    .map(
      (point) =>
        `${point.label}, ${naira(
          amount(point.earnings) + amount(point.commission)
        )} gross`
    )
    .join('; ')}.`;

  return (
    <div role="img" aria-label={ariaLabel} className="mt-5">
      <div className="flex h-44 items-end gap-2 pt-6 sm:gap-3">
        {visible.map((point, index) => {
          const net = amount(point.earnings);
          const fee = amount(point.commission);
          const total = net + fee;
          const height = total > 0 ? Math.max((total / maxTotal) * 100, 5) : 2;

          return (
            <div
              key={`${point.month || point.label}-${index}`}
              className="group relative flex h-full flex-1 flex-col items-center justify-end"
            >
              <div className="pointer-events-none absolute -top-5 z-10 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-ink-700">
                {naira(total)}
              </div>

              <div
                tabIndex={0}
                title={`${point.label}: ${naira(total)} gross · ${naira(
                  net
                )} net · ${naira(fee)} platform fee`}
                className="flex w-full max-w-12 flex-col justify-end overflow-hidden rounded-t-lg bg-slate-100 outline-none transition focus-visible:ring-2 focus-visible:ring-brand-600/60 focus-visible:ring-offset-2 dark:bg-ink-800"
                style={{ height: `${height}%` }}
              >
                {total > 0 && (
                  <>
                    {fee > 0 && (
                      <div
                        className="w-full bg-brand-200 dark:bg-brand-900"
                        style={{ height: `${(fee / total) * 100}%` }}
                      />
                    )}
                    <div
                      className="w-full bg-brand-500 transition-colors group-hover:bg-brand-600 dark:bg-brand-400 dark:group-hover:bg-brand-300"
                      style={{ height: `${(net / total) * 100}%` }}
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex gap-2 sm:gap-3">
        {visible.map((point, index) => (
          <span
            key={`${point.month || point.label}-label-${index}`}
            className="flex-1 truncate text-center text-[11px] font-medium text-slate-400 dark:text-ink-500"
            title={point.label}
          >
            {point.label}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500 dark:text-ink-400">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full bg-brand-500 dark:bg-brand-400"
            aria-hidden="true"
          />
          Net earnings
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full bg-brand-200 dark:bg-brand-900"
            aria-hidden="true"
          />
          Platform fee
        </span>
        <span className="ml-auto hidden text-slate-400 dark:text-ink-500 sm:inline">
          Focus or hover a bar for the exact amount
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   CSV EXPORT
========================================================= */

const csvHeaders = [
  'Transaction ID',
  'Service',
  'Customer',
  'Payment date',
  'Time',
  'Gross',
  'Platform fee',
  'Net earnings',
  'Status',
  'Payment status',
  'Reference',
  'Channel',
  'Paid at',
];

function exportTransactionsCsv(transactions: ProviderEarningsTransaction[]) {
  if (transactions.length === 0) return;

  const escape = (value: unknown) => {
    let text = String(value ?? '');
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };

  const rows = transactions.map((transaction) =>
    [
      transaction.id,
      transaction.serviceName,
      transaction.customerName,
      formatTransactionDate(transaction),
      transaction.time,
      amount(transaction.grossAmount),
      amount(transaction.fee),
      amount(transaction.netAmount),
      transaction.status,
      transaction.paymentStatus,
      transaction.paymentReference ?? '',
      transaction.paymentChannel ?? '',
      transaction.paidAt ?? '',
    ]
      .map(escape)
      .join(',')
  );

  const csv = [csvHeaders.map(escape).join(','), ...rows].join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = `provider-earnings-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* =========================================================
   SKELETON
========================================================= */

function EarningsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading earnings">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-11 w-11 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-2 h-3 w-64" />
          <Skeleton className="mt-5 h-16 w-full rounded-xl" />
          <Skeleton className="mt-6 h-44 w-full rounded-xl" />
        </div>

        <div className="card p-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-2 h-3 w-40" />
          <Skeleton className="mt-5 h-16 w-full rounded-xl" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-4/5" />
          <Skeleton className="mt-2 h-4 w-3/5" />
          <Skeleton className="mt-6 h-9 w-full rounded-xl" />
        </div>
      </div>

      <div className="card mt-6 p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-3 w-72" />
        <div className="mt-5 space-y-3">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

type EarningsFilter = 'all' | 'confirmed' | 'completed';

const filterTabs: Array<{ value: EarningsFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
];

function isConfirmedTransaction(transaction: ProviderEarningsTransaction) {
  const status = normalizeStatus(transaction.status || '');
  const paymentStatus = normalizeStatus(transaction.paymentStatus || '');

  return (
    paymentStatus === 'paid' ||
    ['confirmed', 'paid', 'accepted'].includes(status)
  );
}

function isCompletedTransaction(transaction: ProviderEarningsTransaction) {
  return ['completed', 'reviewed'].includes(
    normalizeStatus(transaction.status || '')
  );
}

export function ProviderEarnings() {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    dataUpdatedAt,
  } = useProviderEarnings();

  const hasSession = hasUserToken();
  const { connected, error: streamError } = useProviderEarningsStream(hasSession);

  const [filter, setFilter] = useState<EarningsFilter>('all');
  const [search, setSearch] = useState('');

  const summary = data?.summary;
  const payout = data?.payout;

  const trend = useMemo<ProviderEarningsTrendPoint[]>(
    () => (Array.isArray(data?.trend) ? data.trend : []),
    [data]
  );

  const transactions = useMemo<ProviderEarningsTransaction[]>(
    () => (Array.isArray(data?.transactions) ? data.transactions : []),
    [data]
  );

  const sortedTransactions = useMemo(
    () =>
      [...transactions].sort(
        (a, b) => transactionTimestamp(b) - transactionTimestamp(a)
      ),
    [transactions]
  );

  const counts = useMemo(
    () => ({
      all: transactions.length,
      confirmed: transactions.filter(isConfirmedTransaction).length,
      completed: transactions.filter(isCompletedTransaction).length,
    }),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = sortedTransactions;

    if (filter === 'confirmed') {
      list = list.filter(isConfirmedTransaction);
    } else if (filter === 'completed') {
      list = list.filter(isCompletedTransaction);
    }

    if (term) {
      list = list.filter((transaction) =>
        [
          transaction.serviceName,
          transaction.customerName,
          transaction.paymentReference,
          transaction.paymentChannel,
          transaction.id,
        ].some((value) => (value || '').toLowerCase().includes(term))
      );
    }

    return list;
  }, [filter, search, sortedTransactions]);

  const lastUpdated = useMemo(() => {
    const source = data?.generatedAt || dataUpdatedAt;

    if (!source) return null;

    const date = new Date(source);

    if (Number.isNaN(date.getTime())) return null;

    return date.toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, [data?.generatedAt, dataUpdatedAt]);

  const monthlyGrowth = Math.round(amount(summary?.monthlyGrowth) * 10) / 10;
  const growthLabel = `${monthlyGrowth >= 0 ? '+' : ''}${monthlyGrowth}%`;
  const paidBookings = amount(summary?.paidBookings);

  const queryErrorMessage = !hasSession
    ? 'Authentication required. Please log in again to view your earnings.'
    : getApiErrorMessage(error) || 'Unable to load your earnings right now.';

  const resetFilters = () => {
    setFilter('all');
    setSearch('');
  };

  return (
    <DashboardLayout role="provider" navItems={providerNavItems}>
      <DashboardHeader
        title="Earnings"
        subtitle="Live income, payouts and platform fees"
        action={
          <>
            <LiveStatus connected={connected} error={streamError} />

            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              loading={isFetching}
              onClick={() => void refetch()}
              disabled={!hasSession}
            >
              Refresh
            </Button>

            <Link
              to="/provider/add-account"
              className="btn-outline btn-sm inline-flex items-center gap-1.5"
            >
              <Landmark className="h-3.5 w-3.5" aria-hidden="true" />
              Payout settings
            </Link>
          </>
        }
      />

      {isLoading ? (
        <EarningsSkeleton />
      ) : !hasSession ? (
        <ErrorState
          title="Session required"
          message={queryErrorMessage}
          className="mt-6"
        />
      ) : isError && !data ? (
        <ErrorState
          title="Couldn't load earnings"
          message={queryErrorMessage}
          onRetry={() => void refetch()}
          className="mt-6"
        />
      ) : (
        <>
          {isError && data && (
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-danger-100 bg-danger-50/70 p-4 text-sm text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/5 dark:text-danger-200 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2">
                <AlertCircle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <p>{queryErrorMessage}</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
              >
                Try again
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total earnings after platform fees"
              value={naira(summary?.totalEarnings)}
              icon={Wallet}
              color="brand"
              trend={data ? `${paidBookings} paid` : undefined}
            />

            <StatCard
              label="This month"
              value={naira(summary?.thisMonth)}
              icon={TrendingUp}
              color="sky"
              trend={data ? growthLabel : undefined}
            />

            <StatCard
              label="Pending payout"
              value={naira(summary?.pendingPayout)}
              icon={Clock}
              color="accent"
            />

            <StatCard
              label="Platform fees"
              value={naira(summary?.commissionPaid)}
              icon={Receipt}
              color="rose"
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                    <TrendingUp className="h-5 w-5" aria-hidden="true" />
                  </span>

                  <div>
                    <h2 className="font-semibold text-slate-900 dark:text-ink-50">
                      Earnings trend
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-ink-400">
                      Net earnings and platform fees over the last six months
                    </p>
                  </div>
                </div>

                <Badge tone="neutral">6 months</Badge>
              </div>

              <div className="mt-5 grid max-w-md grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50/80 px-3 py-2.5 dark:bg-ink-800/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-ink-500">
                    Total gross
                  </p>
                  <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-900 dark:text-ink-50">
                    {naira(summary?.grossEarnings)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50/80 px-3 py-2.5 dark:bg-ink-800/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-ink-500">
                    Average / booking
                  </p>
                  <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-900 dark:text-ink-50">
                    {naira(summary?.averageEarning)}
                  </p>
                </div>
              </div>

              <EarningsTrendChart points={trend} />
            </Card>

            <Card>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lavender text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                    <Landmark className="h-5 w-5" aria-hidden="true" />
                  </span>

                  <div>
                    <h2 className="font-semibold text-slate-900 dark:text-ink-50">
                      Payout account
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-ink-400">
                      Where your earnings are sent
                    </p>
                  </div>
                </div>

                {!payout?.hasAccount ? (
                  <Badge tone="neutral">Not connected</Badge>
                ) : payout.isVerified ? (
                  <Badge tone="success" icon={ShieldCheck}>
                    Verified
                  </Badge>
                ) : (
                  <Badge tone="warning" icon={Clock}>
                    Pending
                  </Badge>
                )}
              </div>

              <div className="mt-4 rounded-xl bg-slate-50/80 px-3 py-2.5 dark:bg-ink-800/40">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-ink-500">
                  Available balance
                </p>
                <p className="mt-0.5 text-xl font-bold tabular-nums text-slate-900 dark:text-ink-50">
                  {naira(summary?.availableBalance)}
                </p>
              </div>

              {payout?.hasAccount ? (
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="shrink-0 text-slate-500 dark:text-ink-400">
                      Bank
                    </dt>
                    <dd className="min-w-0 truncate text-right font-medium text-slate-900 dark:text-ink-50">
                      {payout.bankName || '—'}
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <dt className="shrink-0 text-slate-500 dark:text-ink-400">
                      Account name
                    </dt>
                    <dd className="min-w-0 truncate text-right font-medium text-slate-900 dark:text-ink-50">
                      {payout.accountName || '—'}
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <dt className="shrink-0 text-slate-500 dark:text-ink-400">
                      Account number
                    </dt>
                    <dd className="font-mono text-right font-medium tabular-nums text-slate-900 dark:text-ink-50">
                      {payout.accountNumberMasked || '—'}
                    </dd>
                  </div>
                </dl>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-4 dark:border-ink-700">
                  <p className="text-sm font-semibold text-slate-900 dark:text-ink-50">
                    No payout account connected
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-ink-400">
                    Connect a bank account to receive your 90% provider share
                    automatically after each paid booking.
                  </p>
                </div>
              )}

              <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-500 dark:text-ink-400">
                <Info
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
                Paystack splits each payment automatically (90% to you, 10%
                platform fee).
              </p>

              <Link
                to="/provider/add-account"
                className="btn-outline btn-sm mt-4 inline-flex w-full items-center justify-center gap-1.5"
              >
                {payout?.hasAccount
                  ? 'Manage payout account'
                  : 'Connect payout account'}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Card>
          </div>

          <Card className="mt-6">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 dark:border-ink-800 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lavender text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                  <Receipt className="h-5 w-5" aria-hidden="true" />
                </span>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-900 dark:text-ink-50">
                      Transactions
                    </h2>
                    <Badge tone="brand">{filteredTransactions.length}</Badge>
                  </div>

                  <p className="mt-0.5 text-xs text-slate-500 dark:text-ink-400">
                    Every payment, platform fee and net earning
                  </p>

                  {lastUpdated && (
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-ink-500">
                      Last updated {lastUpdated}
                    </p>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                icon={Download}
                onClick={() => exportTransactionsCsv(filteredTransactions)}
                disabled={filteredTransactions.length === 0}
                title={
                  filteredTransactions.length === 0
                    ? 'No transactions to export'
                    : 'Download the filtered transactions as CSV'
                }
              >
                Export CSV
              </Button>
            </div>

            {transactions.length > 0 && (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div
                  role="group"
                  aria-label="Filter transactions by status"
                  className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5"
                >
                  {filterTabs.map((tab) => {
                    const active = filter === tab.value;

                    return (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => setFilter(tab.value)}
                        aria-pressed={active}
                        className={cn(
                          'flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition',
                          active
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700'
                        )}
                      >
                        {tab.label}
                        <span
                          className={cn(
                            'rounded-full px-1.5 py-0.5 text-[10px] tabular-nums',
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-white text-slate-500 dark:bg-ink-700 dark:text-ink-300'
                          )}
                        >
                          {counts[tab.value]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <SearchBar
                  value={search}
                  onChange={setSearch}
                  placeholder="Search service, customer or reference…"
                  className="min-w-0 sm:ml-auto sm:w-72"
                />
              </div>
            )}

            {transactions.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={Receipt}
                  title="No earnings yet"
                  description="Paid and completed bookings will appear here with the gross amount, platform fee and your net payout."
                  action={
                    <Link
                      to="/provider/bookings"
                      className="btn-outline btn-sm inline-flex items-center"
                    >
                      View my bookings
                    </Link>
                  }
                />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={Receipt}
                  title="No matching transactions"
                  description={
                    search.trim()
                      ? `No transactions match "${search.trim()}" with the selected filter.`
                      : 'No transactions match the selected filter.'
                  }
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetFilters}
                    >
                      Clear filters
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                {/* Desktop rows */}
                <div className="mt-4 hidden overflow-x-auto lg:block">
                  <div className="min-w-[820px]">
                    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.9fr)] items-center gap-4 rounded-xl bg-slate-50/80 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:bg-ink-800/40 dark:text-ink-500">
                      <span>Service / customer</span>
                      <span>Date</span>
                      <span className="text-right">Gross</span>
                      <span className="text-right">Fee</span>
                      <span className="text-right">Net</span>
                      <span>Status</span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-ink-800">
                      {filteredTransactions.map((transaction) => {
                        const reference = transaction.paymentReference?.trim();
                        const channel = formatChannel(
                          transaction.paymentChannel
                        );

                        return (
                          <div
                            key={transaction.id}
                            className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.9fr)] items-center gap-4 px-4 py-3.5 transition-colors hover:bg-slate-50/70 dark:hover:bg-ink-800/30"
                          >
                            <div className="min-w-0">
                              <p
                                className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50"
                                title={transaction.serviceName}
                              >
                                {transaction.serviceName || 'Service'}
                              </p>
                              <p
                                className="mt-0.5 truncate text-xs text-slate-500 dark:text-ink-400"
                                title={transaction.customerName}
                              >
                                {transaction.customerName || 'Customer'}
                              </p>
                              {reference && (
                                <p
                                  className="mt-0.5 truncate font-mono text-[10px] text-slate-400 dark:text-ink-500"
                                  title={reference}
                                >
                                  Ref {reference}
                                </p>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-700 dark:text-ink-300">
                                {formatTransactionDate(transaction)}
                              </p>
                              <p className="mt-0.5 truncate text-[11px] text-slate-400 dark:text-ink-500">
                                {[transaction.time, channel]
                                  .filter(Boolean)
                                  .join(' · ') || '—'}
                              </p>
                            </div>

                            <p className="truncate text-right text-sm tabular-nums text-slate-600 dark:text-ink-300" title={naira(transaction.grossAmount)}>
                              {naira(transaction.grossAmount)}
                            </p>

                            <p className="truncate text-right text-sm tabular-nums text-rose-600 dark:text-rose-300" title={naira(transaction.fee)}>
                              {amount(transaction.fee) > 0
                                ? `-${naira(transaction.fee)}`
                                : naira(0)}
                            </p>

                            <p className="truncate text-right text-sm font-bold tabular-nums text-success-600 dark:text-success-200" title={naira(transaction.netAmount)}>
                              {naira(transaction.netAmount)}
                            </p>

                            <div className="min-w-0">
                              <TransactionStatusBadge
                                status={transaction.status}
                                fallback={transaction.paymentStatus}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Mobile cards */}
                <div className="mt-4 space-y-3 lg:hidden">
                  {filteredTransactions.map((transaction) => {
                    const reference = transaction.paymentReference?.trim();
                    const channel = formatChannel(transaction.paymentChannel);

                    return (
                      <article
                        key={transaction.id}
                        className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-xs dark:border-ink-800 dark:bg-ink-900"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p
                              className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50"
                              title={transaction.serviceName}
                            >
                              {transaction.serviceName || 'Service'}
                            </p>
                            <p
                              className="mt-0.5 truncate text-xs text-slate-500 dark:text-ink-400"
                              title={transaction.customerName}
                            >
                              {transaction.customerName || 'Customer'}
                            </p>
                          </div>

                          <TransactionStatusBadge
                            status={transaction.status}
                            fallback={transaction.paymentStatus}
                          />
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-slate-50/80 px-3 py-2.5 dark:bg-ink-800/40">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-ink-500">
                              Gross
                            </p>
                            <p className="mt-0.5 truncate text-xs font-semibold tabular-nums text-slate-700 dark:text-ink-300" title={naira(transaction.grossAmount)}>
                              {naira(transaction.grossAmount)}
                            </p>
                          </div>

                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-ink-500">
                              Fee
                            </p>
                            <p className="mt-0.5 truncate text-xs font-semibold tabular-nums text-rose-600 dark:text-rose-300" title={naira(transaction.fee)}>
                              {amount(transaction.fee) > 0
                                ? `-${naira(transaction.fee)}`
                                : naira(0)}
                            </p>
                          </div>

                          <div className="min-w-0 text-right">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-ink-500">
                              Net
                            </p>
                            <p className="mt-0.5 truncate text-sm font-bold tabular-nums text-success-600 dark:text-success-200" title={naira(transaction.netAmount)}>
                              {naira(transaction.netAmount)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-slate-400 dark:text-ink-500">
                          <span>
                            {formatTransactionDate(transaction)}
                            {transaction.time
                              ? ` · ${transaction.time}`
                              : ''}
                          </span>

                          {reference && (
                            <span
                              className="max-w-[60%] truncate font-mono"
                              title={reference}
                            >
                              {reference}
                            </span>
                          )}
                        </div>

                        {channel && (
                          <p className="mt-1 text-[11px] text-slate-400 dark:text-ink-500">
                            via {channel}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-col gap-1 border-t border-slate-100 pt-3 text-[11px] text-slate-400 dark:border-ink-800 dark:text-ink-500 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Showing {filteredTransactions.length} of{' '}
                    {transactions.length} transactions
                  </span>
                  <span>
                    {lastUpdated
                      ? `Last updated ${lastUpdated}`
                      : 'Awaiting live update'}
                  </span>
                </div>
              </>
            )}
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
