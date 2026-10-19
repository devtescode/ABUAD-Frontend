import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useAuth } from '@/context/AppContext';
import { Logo } from '@/components/shared';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogOut, Menu, X } from 'lucide-react';
import type { UserRole } from '@/data/mockData';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

export function DashboardLayout({
  role,
  navItems,
  children,
}: {
  role: UserRole;
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    if (role === 'admin') {
      sessionStorage.removeItem('servicely_admin_token');
      sessionStorage.removeItem('servicely_admin');
      navigate('/login/admin', { replace: true });
      return;
    }

    // Customer / Provider
    logout();
    navigate('/', { replace: true });
  };

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  const renderNavItem = (item: NavItem, mobile = false) => {
    const active =
      location.pathname === item.path ||
      (item.path !== `/${role}` &&
        location.pathname.startsWith(item.path + '/'));

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => mobile && setMobileOpen(false)}
        aria-current={active ? 'page' : undefined}
        className={
          mobile
            ? `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-ink-400 dark:hover:bg-ink-800'
              }`
            : `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-50'
              }`
        }
      >
        {active && !mobile && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-600"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <item.icon
          className={`h-[18px] w-[18px] shrink-0 ${
            active
              ? 'text-brand-600 dark:text-brand-400'
              : 'text-slate-400 dark:text-ink-500'
          }`}
        />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-ink-950">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200/70 bg-white dark:border-ink-800 dark:bg-ink-900 lg:flex lg:flex-col">
        <div className="flex h-16 shrink-0 items-center border-b border-slate-100 px-5 dark:border-ink-800">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => renderNavItem(item))}
        </nav>
        <div className="space-y-1 border-t border-slate-100 p-3 dark:border-ink-800">
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-ink-800/60">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-600 text-sm font-semibold text-white">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || 'Profile'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
                {user?.name}
              </p>
              <p className="truncate text-xs text-slate-400 dark:text-ink-500">
                {roleLabel} account
              </p>
            </div>
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-danger-50 hover:text-danger-600 dark:text-ink-400 dark:hover:bg-danger-500/10 dark:hover:text-danger-200"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur-md dark:border-ink-800 dark:bg-ink-950/90 lg:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm dark:bg-ink-950/60 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white dark:bg-ink-900 lg:hidden"
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-5 dark:border-ink-800">
                <Logo />
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation"
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-ink-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                {navItems.map((item) => renderNavItem(item, true))}
              </nav>
              <div className="space-y-2 border-t border-slate-100 p-3 dark:border-ink-800">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-ink-800/60">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-600 text-sm font-semibold text-white">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user?.name || 'Profile'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
                      {user?.name}
                    </p>
                    <p className="truncate text-xs text-slate-400 dark:text-ink-500">
                      {roleLabel} account
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-danger-50 hover:text-danger-600 dark:text-ink-400 dark:hover:bg-danger-500/10"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export function DashboardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-ink-50 sm:text-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 dark:text-ink-400">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

const statColors = {
  primary: 'bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-300',
  accent: 'bg-accent-50 text-accent-600 dark:bg-accent-900/40 dark:text-accent-300',
  sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300',
  success: 'bg-success-50 text-success-600 dark:bg-success-600/15 dark:text-success-200',
  warning: 'bg-warning-50 text-warning-600 dark:bg-warning-600/15 dark:text-warning-200',
  danger: 'bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-200',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color = 'brand',
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  color?: keyof typeof statColors;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card p-5"
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${statColors[color] || statColors.brand}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span className="badge bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-ink-300">
            {trend}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-ink-50">
        {value}
      </p>
      <p className="text-sm text-slate-500 dark:text-ink-400">{label}</p>
    </motion.div>
  );
}

/* Small helper for pages that want a floating-page heading with icon */
export function PageIconHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-ink-50">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 dark:text-ink-400">{subtitle}</p>}
      </div>
    </div>
  );
}
