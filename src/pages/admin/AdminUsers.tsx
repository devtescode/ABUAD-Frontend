import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowUpDown,
  Ban,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  Hash,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';

import {
  DashboardHeader,
  DashboardLayout,
  StatCard,
} from '@/components/DashboardLayout';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  ResponsiveModal,
  Skeleton,
  cn,
} from '@/components/ui';
import { adminNavItems } from '@/data/adminNavItems';
import { useAdminUsers } from '@/hooks/queries';

/* =========================================================
   TYPES + NORMALISATION
========================================================= */

type UserRole = 'customer' | 'provider';
type UserStatus = 'active' | 'pending' | 'suspended';
type RoleFilter = 'all' | UserRole;
type StatusFilter = 'all' | UserStatus;
type SortOption =
  | 'newest'
  | 'oldest'
  | 'name-asc'
  | 'name-desc'
  | 'role'
  | 'status';

interface User {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  avatar?: string;
  role: UserRole;
  gender: string;
  status: UserStatus;
  createdAt: string;
}

function stringValue(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
}

function toUser(raw: Record<string, unknown>): User {
  const roleValue = stringValue(raw.role).toLowerCase();
  const statusValue = stringValue(raw.status).toLowerCase();
  const genderValue = stringValue(raw.gender).toLowerCase();

  const role: UserRole = roleValue === 'provider' ? 'provider' : 'customer';
  const status: UserStatus =
    statusValue === 'pending'
      ? 'pending'
      : statusValue === 'suspended'
        ? 'suspended'
        : 'active';

  return {
    _id: stringValue(raw._id) || stringValue(raw.id),
    name:
      stringValue(raw.name) ||
      stringValue(raw.fullName) ||
      'Unnamed user',
    email: stringValue(raw.email),
    phoneNumber:
      stringValue(raw.phoneNumber) || stringValue(raw.phone),
    avatar:
      stringValue(raw.avatar) ||
      stringValue(raw.profileImage) ||
      undefined,
    role,
    gender: genderValue,
    status,
    createdAt:
      stringValue(raw.createdAt) || stringValue(raw.created_at),
  };
}

/* =========================================================
   FORMATTERS
========================================================= */

function formatDate(value: string): string {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(value: string): string {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function capitalize(value: string): string {
  if (!value) return '—';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/* =========================================================
   STATIC OPTIONS
========================================================= */

const ROLE_OPTIONS = [
  { value: 'all', label: 'All roles' },
  { value: 'customer', label: 'Customers' },
  { value: 'provider', label: 'Providers' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
  { value: 'role', label: 'Role' },
  { value: 'status', label: 'Status' },
];

const STATUS_META: Record<
  UserStatus,
  { tone: 'success' | 'warning' | 'danger'; icon: LucideIcon }
> = {
  active: { tone: 'success', icon: CheckCircle2 },
  pending: { tone: 'warning', icon: Clock3 },
  suspended: { tone: 'danger', icon: Ban },
};

const ROLE_META: Record<
  UserRole,
  { tone: 'brand' | 'info'; icon: LucideIcon; label: string }
> = {
  customer: { tone: 'info', icon: UserRound, label: 'Customer' },
  provider: {
    tone: 'brand',
    icon: BriefcaseBusiness,
    label: 'Provider',
  },
};

/* =========================================================
   PAGE
========================================================= */

export function AdminUsers() {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useAdminUsers();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] =
    useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('all');
  const [sortOption, setSortOption] =
    useState<SortOption>('newest');
  const [selectedUser, setSelectedUser] = useState<User | null>(
    null
  );

  const users = useMemo(
    () =>
      Array.isArray(data) ? data.map((record) => toUser(record)) : [],
    [data]
  );

  /* Derived counts */
  const counts = useMemo(() => {
    let customers = 0;
    let providers = 0;
    let active = 0;
    let pending = 0;
    let suspended = 0;

    users.forEach((user) => {
      if (user.role === 'customer') customers += 1;
      if (user.role === 'provider') providers += 1;
      if (user.status === 'active') active += 1;
      if (user.status === 'pending') pending += 1;
      if (user.status === 'suspended') suspended += 1;
    });

    return {
      total: users.length,
      customers,
      providers,
      active,
      pending,
      suspended,
    };
  }, [users]);

  /* Search + role/status filters + sorting */
  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const result = users.filter((user) => {
      if (roleFilter !== 'all' && user.role !== roleFilter) {
        return false;
      }

      if (
        statusFilter !== 'all' &&
        user.status !== statusFilter
      ) {
        return false;
      }

      if (!query) return true;

      return [
        user.name,
        user.email,
        user.phoneNumber,
        user.role,
        user.status,
        user._id,
      ].some((value) => value.toLowerCase().includes(query));
    });

    const byName = (a: User, b: User) =>
      a.name.localeCompare(b.name, undefined, {
        sensitivity: 'base',
      });

    switch (sortOption) {
      case 'oldest':
        result.sort(
          (a, b) =>
            timestamp(a.createdAt) - timestamp(b.createdAt)
        );
        break;
      case 'name-asc':
        result.sort(byName);
        break;
      case 'name-desc':
        result.sort((a, b) => byName(b, a));
        break;
      case 'role':
        result.sort(
          (a, b) => a.role.localeCompare(b.role) || byName(a, b)
        );
        break;
      case 'status':
        result.sort(
          (a, b) =>
            a.status.localeCompare(b.status) || byName(a, b)
        );
        break;
      default:
        result.sort(
          (a, b) =>
            timestamp(b.createdAt) - timestamp(a.createdAt)
        );
    }

    return result;
  }, [users, searchQuery, roleFilter, statusFilter, sortOption]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    roleFilter !== 'all' ||
    statusFilter !== 'all' ||
    sortOption !== 'newest';

  const errorMessage =
    error?.message ||
    'We could not load the user list. Please try again.';

  const resetFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
    setSortOption('newest');
  };

  const openUserDetails = (user: User) => {
    setSelectedUser(user);
  };

  const closeUserDetails = () => {
    setSelectedUser(null);
  };

  return (
    <DashboardLayout role="admin" navItems={adminNavItems}>
      <DashboardHeader
        title="User Management"
        subtitle="Browse and review every customer and provider on the platform."
        action={
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
            Read-only view
          </span>
        }
      />

      {/* =========================
          SUMMARY COUNTS
      ========================== */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="card p-5">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <Skeleton className="mt-4 h-7 w-16" />
              <Skeleton className="mt-2 h-3.5 w-24" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              label="Total users"
              value={String(counts.total)}
              icon={Users}
              color="brand"
              trend={`${counts.active} active`}
            />
            <StatCard
              label="Customers"
              value={String(counts.customers)}
              icon={UserRound}
              color="sky"
            />
            <StatCard
              label="Providers"
              value={String(counts.providers)}
              icon={BriefcaseBusiness}
              color="success"
            />
            <StatCard
              label="Pending"
              value={String(counts.pending)}
              icon={Clock3}
              color="warning"
            />
            <StatCard
              label="Suspended"
              value={String(counts.suspended)}
              icon={Ban}
              color="danger"
            />
          </>
        )}
      </div>

      {/* =========================
          SEARCH + FILTER TOOLBAR
      ========================== */}
      <div className="card mb-6 p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative w-full xl:max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-ink-500" />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search name, email, phone or ID…"
              aria-label="Search users"
              autoComplete="off"
              className="search-input h-11 pl-10 pr-12"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none dark:hover:bg-ink-800 dark:hover:text-ink-100"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 xl:ml-auto xl:w-auto">
            <FilterSelect
              label="Filter by role"
              value={roleFilter}
              onChange={(value) =>
                setRoleFilter(value as RoleFilter)
              }
              icon={UserRound}
              options={ROLE_OPTIONS}
            />

            <FilterSelect
              label="Filter by status"
              value={statusFilter}
              onChange={(value) =>
                setStatusFilter(value as StatusFilter)
              }
              icon={ShieldCheck}
              options={STATUS_OPTIONS}
            />

            <FilterSelect
              label="Sort users"
              value={sortOption}
              onChange={(value) =>
                setSortOption(value as SortOption)
              }
              icon={ArrowUpDown}
              options={SORT_OPTIONS}
            />

            <Button
              variant="outline"
              loading={isFetching}
              onClick={() => {
                void refetch();
              }}
              className="h-11 w-full"
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-ink-800">
          <p
            className="text-sm text-slate-500 dark:text-ink-400"
            aria-live="polite"
          >
            {isLoading ? (
              'Loading users…'
            ) : (
              <>
                Showing{' '}
                <span className="font-semibold text-slate-800 dark:text-ink-100">
                  {filteredUsers.length}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-800 dark:text-ink-100">
                  {users.length}
                </span>{' '}
                {users.length === 1 ? 'user' : 'users'}
              </>
            )}
          </p>

          {hasActiveFilters && !isLoading && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/50"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Background-refresh failure with cached data still visible */}
      {isError && users.length > 0 && (
        <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800 dark:border-warning-600/30 dark:bg-warning-600/10 dark:text-warning-200 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Showing the last loaded users. {errorMessage}
            </span>
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

      {isError && users.length === 0 ? (
        <ErrorState
          message={errorMessage}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : (
        <div className="card overflow-hidden">
          {isLoading ? (
            <UsersSkeleton />
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 sm:p-6">
              <EmptyState
                icon={users.length === 0 ? UserRound : Search}
                title={
                  users.length === 0
                    ? 'No users yet'
                    : 'No users match your filters'
                }
                description={
                  users.length === 0
                    ? 'Users will appear here once they create an account.'
                    : 'Try a different search term, or clear the role and status filters.'
                }
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={
                      users.length === 0
                        ? () => {
                            void refetch();
                          }
                        : resetFilters
                    }
                  >
                    {users.length === 0
                      ? 'Refresh'
                      : 'Clear filters'}
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              {/* =========================
                  DESKTOP TABLE
              ========================== */}
              <div className="hidden md:block">
                <div className="max-h-[70vh] overflow-auto">
                  <table className="w-full min-w-[860px] text-left text-sm">
                    <caption className="sr-only">
                      All platform users
                    </caption>

                    <thead className="sticky top-0 z-10 border-b border-slate-200/70 bg-slate-50/95 text-[11px] uppercase tracking-wider text-slate-500 backdrop-blur dark:border-ink-800 dark:bg-ink-900/95 dark:text-ink-400">
                      <tr>
                        <th
                          scope="col"
                          className="px-5 py-3.5 font-semibold"
                        >
                          User
                        </th>
                        <th
                          scope="col"
                          className="px-5 py-3.5 font-semibold"
                        >
                          Contact
                        </th>
                        <th
                          scope="col"
                          className="px-5 py-3.5 font-semibold"
                        >
                          Role
                        </th>
                        <th
                          scope="col"
                          className="px-5 py-3.5 font-semibold"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-5 py-3.5 font-semibold"
                        >
                          Joined
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
                      {filteredUsers.map((user, index) => (
                        <motion.tr
                          key={user._id || `${user.email}-${index}`}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.15,
                            delay: Math.min(index * 0.015, 0.12),
                          }}
                          className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-ink-800/40"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <UserAvatar
                                src={user.avatar}
                                name={user.name}
                              />

                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900 dark:text-ink-50">
                                  {user.name}
                                </p>
                                <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400 dark:text-ink-500">
                                  {user._id
                                    ? `#${user._id
                                        .slice(-6)
                                        .toUpperCase()}`
                                    : 'No ID'}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p className="max-w-[220px] truncate text-slate-600 dark:text-ink-300">
                              {user.email || '—'}
                            </p>
                            <p className="mt-0.5 max-w-[220px] truncate text-xs text-slate-400 dark:text-ink-500">
                              {user.phoneNumber || '—'}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <RoleBadge role={user.role} />
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge status={user.status} />
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-slate-500 dark:text-ink-400">
                            {formatDate(user.createdAt)}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                openUserDetails(user)
                              }
                              aria-label={`View details for ${user.name}`}
                              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:border-brand-500/40 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* =========================
                  MOBILE CARDS
              ========================== */}
              <div className="divide-y divide-slate-100 dark:divide-ink-800 md:hidden">
                {filteredUsers.map((user, index) => (
                  <article
                    key={user._id || `${user.email}-${index}`}
                    className="p-4 transition-colors hover:bg-slate-50/70 dark:hover:bg-ink-800/30"
                  >
                    <div className="flex items-start gap-3">
                      <UserAvatar
                        src={user.avatar}
                        name={user.name}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
                              {user.name}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-ink-400">
                              {user.email || 'No email address'}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              openUserDetails(user)
                            }
                            aria-label={`View details for ${user.name}`}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:border-brand-500/40 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <RoleBadge role={user.role} />
                          <StatusBadge status={user.status} />
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-slate-100 pt-3 text-xs dark:border-ink-800">
                          <span className="flex min-w-0 items-center gap-1.5 text-slate-500 dark:text-ink-400">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">
                              {user.phoneNumber ||
                                'No phone number'}
                            </span>
                          </span>

                          <span className="flex shrink-0 items-center gap-1.5 text-slate-400 dark:text-ink-500">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(user.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* =========================
          USER DETAILS MODAL
      ========================== */}
      <ResponsiveModal
        open={Boolean(selectedUser)}
        onClose={closeUserDetails}
        title="User details"
        footer={
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={closeUserDetails}
            >
              Close
            </Button>
          </div>
        }
      >
        {selectedUser && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <UserAvatar
                src={selectedUser.avatar}
                name={selectedUser.name}
                size="lg"
              />

              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-slate-900 dark:text-ink-50">
                  {selectedUser.name}
                </h3>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <RoleBadge role={selectedUser.role} />
                  <StatusBadge status={selectedUser.status} />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem
                icon={Mail}
                label="Email address"
                value={selectedUser.email || '—'}
                breakAll
              />

              <DetailItem
                icon={Phone}
                label="Phone number"
                value={selectedUser.phoneNumber || '—'}
              />

              <DetailItem
                icon={UserRound}
                label="Gender"
                value={
                  selectedUser.gender
                    ? capitalize(selectedUser.gender)
                    : 'Not specified'
                }
              />

              <DetailItem
                icon={ShieldCheck}
                label="Account role"
                value={ROLE_META[selectedUser.role].label}
              />

              <DetailItem
                icon={CalendarDays}
                label="Joined"
                value={formatDateTime(selectedUser.createdAt)}
              />

              <DetailItem
                icon={Hash}
                label="User ID"
                value={selectedUser._id || '—'}
                mono
                breakAll
              />
            </div>
          </div>
        )}
      </ResponsiveModal>
    </DashboardLayout>
  );
}

/* =========================================================
   SHARED BITS
========================================================= */

function FilterSelect({
  label,
  value,
  onChange,
  icon: Icon,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: LucideIcon;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="relative block min-w-0">
      <span className="sr-only">{label}</span>

      <Icon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-ink-500" />

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:border-ink-600"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-ink-500" />
    </label>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const meta = ROLE_META[role];

  return (
    <Badge tone={meta.tone} icon={meta.icon}>
      {meta.label}
    </Badge>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const meta = STATUS_META[status];

  return (
    <Badge tone={meta.tone} icon={meta.icon}>
      {capitalize(status)}
    </Badge>
  );
}

function UserAvatar({
  src,
  name,
  size = 'md',
  className,
}: {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const sizes = {
    sm: 'h-9 w-9 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
  };

  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-semibold text-brand-700 ring-1 ring-slate-900/5 dark:bg-brand-950 dark:text-brand-300 dark:ring-white/10',
        sizes[size],
        className
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={name || 'User avatar'}
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

function DetailItem({
  icon: Icon,
  label,
  value,
  mono = false,
  breakAll = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  mono?: boolean;
  breakAll?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3.5 dark:border-ink-800 dark:bg-ink-900">
      <div className="flex items-center gap-2 text-slate-400 dark:text-ink-500">
        <Icon className="h-3.5 w-3.5" />
        <p className="text-[11px] font-medium uppercase tracking-wide">
          {label}
        </p>
      </div>

      <p
        className={cn(
          'mt-1.5 text-sm font-medium text-slate-800 dark:text-ink-100',
          mono && 'font-mono text-xs',
          breakAll && 'break-all'
        )}
      >
        {value}
      </p>
    </div>
  );
}

function UsersSkeleton() {
  return (
    <>
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="border-b border-slate-200/70 bg-slate-50/95 dark:border-ink-800 dark:bg-ink-900/95">
              <tr>
                {[
                  'User',
                  'Contact',
                  'Role',
                  'Status',
                  'Joined',
                  'Actions',
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className={cn(
                      'px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-ink-500',
                      heading === 'Actions' && 'text-right'
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
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </td>

                  <td className="px-5 py-4">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </td>

                  <td className="px-5 py-4">
                    <Skeleton className="h-3.5 w-20" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end">
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
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>

                <Skeleton className="mt-3 h-3 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
