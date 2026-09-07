
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Ban,
  RefreshCw,
  X,
  Mail,
  CalendarDays,
  ShieldCheck,
  UserRound,
  Hash,
  Search,
  LoaderCircle,
} from 'lucide-react';

import {
  DashboardLayout,
  DashboardHeader,
} from '@/components/DashboardLayout';

import { adminNavItems } from '@/data/adminNavItems';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'provider';
  status?: 'active' | 'pending' | 'suspended';
  createdAt: string;
}

const API_URL = 'http://localhost:5000';

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const token = sessionStorage.getItem(
        'servicely_admin_token'
      );

      if (!token) {
        throw new Error(
          'Admin authentication token not found.'
        );
      }

      const response = await fetch(
        `${API_URL}/admin/getallusers`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to fetch users.'
        );
      }

      setUsers(data.users || []);
    } catch (err) {
      console.error('Fetch users error:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while fetching users.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Close modal with Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedUser(null);
      }
    };

    if (selectedUser) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape
      );

      document.body.style.overflow = '';
    };
  }, [selectedUser]);

  /*
   * Search users locally.
   * Searches:
   * - Name
   * - Email
   * - Role
   * - Status
   * - User ID
   */
  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) => {
      const status = user.status || 'active';

      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query) ||
        status.toLowerCase().includes(query) ||
        user._id.toLowerCase().includes(query)
      );
    });
  }, [users, searchQuery]);

  const formatDate = (date: string) => {
    if (!date) return '—';

    return new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: string) => {
    if (!date) return '—';

    return new Date(date).toLocaleString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatus = (user: User) => {
    return user.status || 'active';
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-primary-100 text-primary-700';

      case 'pending':
        return 'bg-accent-100 text-accent-700';

      case 'suspended':
        return 'bg-red-100 text-red-700';

      default:
        return 'bg-ink-100 text-ink-600';
    }
  };

  const openUserModal = (user: User) => {
    setSelectedUser(user);
  };

  const closeUserModal = () => {
    setSelectedUser(null);
  };

  return (
    <DashboardLayout
      role="admin"
      navItems={adminNavItems}
    >
      <DashboardHeader
        title="User Management"
        subtitle="View and manage all platform users"
      />

      {/* Top controls */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* User count */}
        <div>
          <p className="text-sm text-ink-500">
            {loading
              ? 'Loading users...'
              : searchQuery
              ? `${filteredUsers.length} of ${users.length} users`
              : `${users.length} user${
                  users.length !== 1 ? 's' : ''
                }`}
          </p>
        </div>

        {/* Search + Refresh */}
        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search users..."
              className="h-10 w-full rounded-lg border border-ink-200 bg-white pl-10 pr-10 text-sm text-ink-900 outline-none transition-all placeholder:text-ink-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50"
            />

            {/* Clear search */}
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  type="button"
                  initial={{
                    opacity: 0,
                    scale: 0.8,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.8,
                  }}
                  transition={{
                    duration: 0.15,
                  }}
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1.5 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Refresh */}
          <button
            onClick={() => fetchUsers(true)}
            disabled={loading || refreshing}
            className="btn-ghost btn-sm flex h-10 items-center justify-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? 'animate-spin' : ''
              }`}
            />

            <span className="hidden sm:inline">
              Refresh
            </span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <div className="flex items-center justify-between gap-4">
            <span>{error}</span>

            <button
              onClick={() => fetchUsers()}
              className="shrink-0 font-medium underline"
            >
              Try again
            </button>
          </div>
        </motion.div>
      )}

      {/* Users table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase text-ink-500 dark:border-ink-800 dark:bg-ink-900/50">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Joined</th>
                <th className="p-4 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
              {/* =========================
                  LOADING STATE
              ========================== */}
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-0"
                  >
                    <div className="flex min-h-[360px] flex-col items-center justify-center">
                      {/* Animated loader */}
                      <div className="relative mb-6">
                        {/* Outer pulse */}
                        <motion.div
                          className="absolute inset-0 rounded-full border border-primary-500/20"
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.7, 0, 0.7],
                          }}
                          transition={{
                            duration: 1.8,
                            repeat: Infinity,
                            ease: 'easeOut',
                          }}
                        />

                        {/* Inner circle */}
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-950/30">
                          <LoaderCircle className="h-8 w-8 animate-spin text-primary-600" />
                        </div>
                      </div>

                      {/* Loading text */}
                      <motion.div
                        initial={{
                          opacity: 0,
                          y: 5,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          duration: 0.3,
                        }}
                        className="text-center"
                      >
                        <p className="font-medium text-ink-800 dark:text-ink-100">
                          Loading users
                        </p>

                        <div className="mt-1 flex items-center justify-center gap-1 text-sm text-ink-400">
                          <span>
                            Fetching the latest accounts
                          </span>

                          <motion.span
                            animate={{
                              opacity: [0, 1, 0],
                            }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              repeatDelay: 0.2,
                            }}
                          >
                            ...
                          </motion.span>
                        </div>
                      </motion.div>
                    </div>
                  </td>
                </tr>
              )}

              {/* =========================
                  USERS
              ========================== */}
              {!loading &&
                filteredUsers.map((user) => {
                  const status = getStatus(user);

                  return (
                    <motion.tr
                      key={user._id}
                      initial={{
                        opacity: 0,
                        y: 6,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        duration: 0.2,
                      }}
                      className="transition-colors hover:bg-ink-50 dark:hover:bg-ink-800/50"
                    >
                      <td className="p-4">
                        <div className="font-medium text-ink-900 dark:text-ink-50">
                          {user.name}
                        </div>
                      </td>

                      <td className="p-4 text-ink-600 dark:text-ink-300">
                        {user.email}
                      </td>

                      <td className="p-4 capitalize text-ink-600 dark:text-ink-300">
                        {user.role}
                      </td>

                      <td className="p-4">
                        <span
                          className={`badge ${getStatusClasses(
                            status
                          )}`}
                        >
                          {status.charAt(0).toUpperCase() +
                            status.slice(1)}
                        </span>
                      </td>

                      <td className="p-4 text-ink-400">
                        {formatDate(user.createdAt)}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          {/* View */}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn-ghost btn-sm"
                            title="View user"
                            onClick={() =>
                              openUserModal(user)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </motion.button>

                          {/* Suspend */}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn-ghost btn-sm text-red-600"
                            title="Suspend user"
                            onClick={() => {
                              console.log(
                                'Suspend user:',
                                user
                              );
                            }}
                          >
                            <Ban className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}

              {/* =========================
                  NO SEARCH RESULTS
              ========================== */}
              {!loading &&
                users.length > 0 &&
                filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-12 text-center"
                    >
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400 dark:bg-ink-800">
                          <Search className="h-5 w-5" />
                        </div>

                        <p className="font-medium text-ink-800 dark:text-ink-100">
                          No users found
                        </p>

                        <p className="mt-1 text-sm text-ink-400">
                          No user matches "
                          <span className="font-medium">
                            {searchQuery}
                          </span>
                          ".
                        </p>

                        <button
                          onClick={() =>
                            setSearchQuery('')
                          }
                          className="mt-4 text-sm font-medium text-primary-600 hover:underline"
                        >
                          Clear search
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

              {/* =========================
                  NO USERS
              ========================== */}
              {!loading &&
                users.length === 0 &&
                !error && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-12 text-center"
                    >
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400 dark:bg-ink-800">
                          <UserRound className="h-5 w-5" />
                        </div>

                        <p className="font-medium text-ink-800 dark:text-ink-100">
                          No users yet
                        </p>

                        <p className="mt-1 text-sm text-ink-400">
                          Users will appear here when they
                          create an account.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================
          USER DETAILS MODAL
      ========================== */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.2,
              ease: 'easeOut',
            }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeUserModal();
              }
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="user-details-title"
              className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-ink-900"
              initial={{
                opacity: 0,
                y: 24,
                scale: 0.97,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 16,
                scale: 0.98,
              }}
              transition={{
                duration: 0.25,
                ease: [0.22, 1, 0.36, 1],
              }}
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-ink-100 px-6 py-5 dark:border-ink-800">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{
                      scale: 0.8,
                      opacity: 0,
                    }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                    }}
                    transition={{
                      delay: 0.08,
                      duration: 0.2,
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 text-primary-700"
                  >
                    <UserRound className="h-5 w-5" />
                  </motion.div>

                  <div>
                    <h2
                      id="user-details-title"
                      className="text-lg font-semibold text-ink-900 dark:text-ink-50"
                    >
                      User Details
                    </h2>

                    <p className="text-sm text-ink-500">
                      Account information
                    </p>
                  </div>
                </div>

                <button
                  onClick={closeUserModal}
                  className="btn-ghost btn-sm"
                  aria-label="Close user details"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.08,
                    },
                  },
                }}
                className="space-y-5 p-6"
              >
                {/* Full name */}
                <motion.div
                  variants={{
                    hidden: {
                      opacity: 0,
                      y: 8,
                    },
                    visible: {
                      opacity: 1,
                      y: 0,
                    },
                  }}
                  className="rounded-xl bg-ink-50 p-4 dark:bg-ink-800/60"
                >
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-400">
                    Full Name
                  </p>

                  <p className="text-base font-semibold text-ink-900 dark:text-ink-50">
                    {selectedUser.name}
                  </p>
                </motion.div>

                {/* Email */}
                <motion.div
                  variants={{
                    hidden: {
                      opacity: 0,
                      y: 8,
                    },
                    visible: {
                      opacity: 1,
                      y: 0,
                    },
                  }}
                  className="flex items-start gap-3"
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                    <Mail className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-ink-400">
                      Email Address
                    </p>

                    <p className="break-all text-sm font-medium text-ink-800 dark:text-ink-100">
                      {selectedUser.email}
                    </p>
                  </div>
                </motion.div>

                {/* Role */}
                <motion.div
                  variants={{
                    hidden: {
                      opacity: 0,
                      y: 8,
                    },
                    visible: {
                      opacity: 1,
                      y: 0,
                    },
                  }}
                  className="flex items-start gap-3"
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                    <ShieldCheck className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-xs text-ink-400">
                      Account Role
                    </p>

                    <p className="text-sm font-medium capitalize text-ink-800 dark:text-ink-100">
                      {selectedUser.role}
                    </p>
                  </div>
                </motion.div>

                {/* Status */}
                <motion.div
                  variants={{
                    hidden: {
                      opacity: 0,
                      y: 8,
                    },
                    visible: {
                      opacity: 1,
                      y: 0,
                    },
                  }}
                  className="flex items-start gap-3"
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                    <ShieldCheck className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-xs text-ink-400">
                      Account Status
                    </p>

                    <span
                      className={`badge mt-1 ${getStatusClasses(
                        getStatus(selectedUser)
                      )}`}
                    >
                      {getStatus(selectedUser)
                        .charAt(0)
                        .toUpperCase() +
                        getStatus(selectedUser).slice(1)}
                    </span>
                  </div>
                </motion.div>

                {/* Joined */}
                <motion.div
                  variants={{
                    hidden: {
                      opacity: 0,
                      y: 8,
                    },
                    visible: {
                      opacity: 1,
                      y: 0,
                    },
                  }}
                  className="flex items-start gap-3"
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                    <CalendarDays className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-xs text-ink-400">
                      Joined
                    </p>

                    <p className="text-sm font-medium text-ink-800 dark:text-ink-100">
                      {formatDateTime(
                        selectedUser.createdAt
                      )}
                    </p>
                  </div>
                </motion.div>

                {/* User ID */}
                <motion.div
                  variants={{
                    hidden: {
                      opacity: 0,
                      y: 8,
                    },
                    visible: {
                      opacity: 1,
                      y: 0,
                    },
                  }}
                  className="flex items-start gap-3"
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                    <Hash className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-ink-400">
                      User ID
                    </p>

                    <p className="break-all font-mono text-xs text-ink-600 dark:text-ink-300">
                      {selectedUser._id}
                    </p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Modal Footer */}
              <div className="flex justify-end border-t border-ink-100 px-6 py-4 dark:border-ink-800">
                <button
                  onClick={closeUserModal}
                  className="btn-secondary btn-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
