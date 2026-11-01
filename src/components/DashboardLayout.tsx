import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AppContext';
import { Logo } from '@/components/shared';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  ChevronDown,
  ExternalLink,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const drawerRef = useRef<HTMLElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);

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
  const userInitial = user?.name?.[0]?.toUpperCase() || 'U';

  const currentNavItem =
    [...navItems]
      .sort((a, b) => b.path.length - a.path.length)
      .find(
        (item) =>
          location.pathname === item.path ||
          (item.path !== `/${role}` &&
            location.pathname.startsWith(item.path + '/'))
      ) || navItems[0];

  // Close the mobile drawer whenever navigation happens.
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Lock page scroll + trap focus while the mobile drawer is open.
  useEffect(() => {
    if (!mobileOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const focusTimer = window.setTimeout(
      () => mobileCloseRef.current?.focus(),
      0
    );

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setMobileOpen(false);
        return;
      }

      if (e.key !== 'Tab') return;

      const drawer = drawerRef.current;
      if (!drawer) return;

      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null || el === drawer);

      if (focusable.length === 0) {
        e.preventDefault();
        drawer.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [mobileOpen]);

  // Dismiss the desktop user menu on outside click or Escape.
  useEffect(() => {
    if (!userMenuOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!userMenuRef.current?.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
        userMenuButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [userMenuOpen]);

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
        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-600/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
          active
            ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-50'
        }`}
      >
        {active && !mobile && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-600 dark:bg-brand-400"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <item.icon
          className={`h-[18px] w-[18px] shrink-0 transition-colors ${
            active
              ? 'text-brand-600 dark:text-brand-400'
              : 'text-slate-400 group-hover:text-slate-600 dark:text-ink-500 dark:group-hover:text-ink-300'
          }`}
          aria-hidden="true"
        />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  const userAvatar = (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-600 text-sm font-semibold text-white ring-1 ring-black/5 dark:ring-white/10">
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{userInitial}</span>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-ink-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:z-[100] focus:mx-4 focus:my-3 focus:inline-flex focus:items-center focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-700 focus:shadow-elevated focus:ring-2 focus:ring-brand-600/60 dark:focus:bg-ink-900 dark:focus:text-brand-300"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/70 bg-white/95 backdrop-blur-sm dark:border-ink-800 dark:bg-ink-900/95 lg:flex">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-5 dark:border-ink-800">
          <Logo />
          <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
            {roleLabel}
          </span>
        </div>

        <nav
          aria-label={`${roleLabel} navigation`}
          className="flex-1 space-y-1 overflow-y-auto p-3"
        >
          {navItems.map((item) => renderNavItem(item))}
        </nav>

        <div className="space-y-2 border-t border-slate-100 p-3 dark:border-ink-800">
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-ink-800 dark:bg-ink-800/60">
            {userAvatar}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
                {user?.name || 'Account'}
              </p>
              <p className="truncate text-xs text-slate-400 dark:text-ink-500">
                {roleLabel} account
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleLogout}
              className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-danger-50 hover:text-danger-600 focus-visible:ring-2 focus-visible:ring-danger-500/50 dark:text-ink-400 dark:hover:bg-danger-500/10 dark:hover:text-danger-200"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur-md dark:border-ink-800 dark:bg-ink-950/90 lg:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            aria-controls="dashboard-mobile-nav"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-brand-600/60 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
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
              aria-hidden="true"
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm dark:bg-ink-950/70 lg:hidden"
            />
            <motion.aside
              ref={drawerRef}
              id="dashboard-mobile-nav"
              role="dialog"
              aria-modal="true"
              aria-label={`${roleLabel} navigation`}
              tabIndex={-1}
              initial={reduceMotion ? false : { x: '-100%' }}
              animate={{ x: 0 }}
              exit={reduceMotion ? undefined : { x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="safe-top safe-bottom fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white shadow-elevated outline-none dark:bg-ink-900 lg:hidden"
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-5 dark:border-ink-800">
                <Logo />
                <button
                  ref={mobileCloseRef}
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation"
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-brand-600/60 dark:hover:bg-ink-800 dark:hover:text-ink-200"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <nav
                aria-label={`${roleLabel} mobile navigation`}
                className="flex-1 space-y-1 overflow-y-auto p-3"
              >
                {navItems.map((item) => renderNavItem(item, true))}
              </nav>

              <div className="space-y-2 border-t border-slate-100 p-3 dark:border-ink-800">
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-ink-800 dark:bg-ink-800/60">
                  {userAvatar}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
                      {user?.name || 'Account'}
                    </p>
                    <p className="truncate text-xs text-slate-400 dark:text-ink-500">
                      {roleLabel} account
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-danger-50 hover:text-danger-600 focus-visible:ring-2 focus-visible:ring-danger-500/50 dark:text-ink-400 dark:hover:bg-danger-500/10 dark:hover:text-danger-200"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" /> Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Desktop topbar */}
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-between gap-4 border-b border-slate-200/70 bg-white/80 px-8 backdrop-blur-md dark:border-ink-800 dark:bg-ink-950/80 lg:flex">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-ink-500">
              {roleLabel} workspace
            </p>
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
              {currentNavItem?.label || 'Dashboard'}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              to="/"
              className="btn-ghost btn-sm hidden items-center gap-1.5 xl:inline-flex"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              Visit site
            </Link>
            <ThemeToggle />

            <div ref={userMenuRef} className="relative">
              <button
                ref={userMenuButtonRef}
                type="button"
                onClick={() => setUserMenuOpen((value) => !value)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                aria-label="Open account menu"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-left transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand-600/60 dark:border-ink-700 dark:bg-ink-900 dark:hover:border-ink-600 dark:hover:bg-ink-800"
              >
                {userAvatar}
                <span className="hidden max-w-[9rem] truncate text-sm font-semibold text-slate-700 dark:text-ink-200 xl:block">
                  {user?.name || 'Account'}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    role="menu"
                    aria-label="Account menu"
                    initial={reduceMotion ? false : { opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-popover dark:border-ink-700 dark:bg-ink-900"
                  >
                    <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-ink-800">
                      {userAvatar}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
                          {user?.name || 'Account'}
                        </p>
                        <p className="truncate text-xs text-slate-400 dark:text-ink-500">
                          {roleLabel} account
                        </p>
                      </div>
                    </div>
                    <div className="p-1.5">
                      <Link
                        role="menuitem"
                        to="/"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-brand-600/60 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-ink-50"
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        Visit site
                      </Link>
                      <button
                        role="menuitem"
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-danger-600 transition-colors hover:bg-danger-50 focus-visible:ring-2 focus-visible:ring-danger-500/50 dark:text-danger-200 dark:hover:bg-danger-500/10"
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={reduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -2 }}
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
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-balance text-xl font-bold tracking-tight text-slate-900 dark:text-ink-50 sm:text-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-ink-400">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
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
  const trendIsNegative = Boolean(trend && /^[-−]/.test(trend.trim()));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card group relative overflow-hidden p-5 transition-shadow hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-black/5 dark:ring-white/10 ${
            statColors[color] || statColors.brand
          }`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        {trend && (
          <span
            className={`badge ${
              trendIsNegative
                ? 'bg-danger-50 text-danger-700 dark:bg-danger-500/15 dark:text-danger-200'
                : 'bg-success-50 text-success-700 dark:bg-success-600/15 dark:text-success-200'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-ink-50">
        {value}
      </p>
      <p className="mt-0.5 text-sm text-slate-500 dark:text-ink-400">{label}</p>
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
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 dark:bg-brand-950/60 dark:text-brand-300 dark:ring-brand-900/60">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold text-slate-900 dark:text-ink-50">
          {title}
        </h1>
        {subtitle && (
          <p className="truncate text-xs text-slate-500 dark:text-ink-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
