import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Menu, X, Camera, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AppContext';
import { formatNaira } from '@/data/mockData';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 shadow-sm">
        <Camera className="h-4 w-4 text-white" />
      </div>
      <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-ink-50">
        Servicely
      </span>
    </Link>
  );
}

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Services', to: '/services' },
    { label: 'Providers', to: '/providers' },
    { label: 'How It Works', to: '/how-it-works' },
    { label: 'About', to: '/about' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/85 backdrop-blur-md dark:border-ink-800 dark:bg-ink-950/85">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <div className="hidden items-center gap-0.5 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-lavender hover:text-brand-700 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-50"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          {user ? (
            <>
              <Link
                to={`/${user.role}`}
                className="btn-outline btn-sm"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </Link>
              <button onClick={logout} className="btn-ghost btn-sm">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-ghost">
              Login
            </Link>
          )}
          <Link to={user ? '/services' : '/signup'} className="btn-primary">
            Get Started
          </Link>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-lavender dark:text-ink-300 dark:hover:bg-ink-800 lg:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-200/70 bg-white dark:border-ink-800 dark:bg-ink-950 lg:hidden"
          >
            <div className="space-y-1 px-4 py-3">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-lavender hover:text-brand-700 dark:text-ink-400 dark:hover:bg-ink-800"
                >
                  {link.label}
                </Link>
              ))}
              <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-ink-800">
                <ThemeToggle />
                {user ? (
                  <>
                    <Link
                      to={`/${user.role}`}
                      onClick={() => setOpen(false)}
                      className="btn-outline w-full"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setOpen(false);
                        navigate('/');
                      }}
                      className="btn-ghost w-full"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setOpen(false)}
                      className="btn-outline w-full"
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setOpen(false)}
                      className="btn-primary w-full"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function Footer() {
  const footerLinks = {
    Company: [
      { label: 'About', to: '/about' },
      { label: 'How It Works', to: '/how-it-works' },
    ],
    Marketplace: [
      { label: 'Services', to: '/services' },
      { label: 'Providers', to: '/providers' },
    ],
    Account: [
      { label: 'Login', to: '/login' },
      { label: 'Sign Up', to: '/signup' },
    ],
  };

  return (
    <footer className="border-t border-slate-200/70 bg-white dark:border-ink-800 dark:bg-ink-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <Logo />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-ink-400">
              The trusted marketplace for ABUAD student service providers. Find,
              book, and pay for professional services with confidence.
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-ink-50">
                {title}
              </h4>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-500 transition-colors hover:text-brand-600 dark:text-ink-400 dark:hover:text-brand-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200/70 pt-6 sm:flex-row dark:border-ink-800">
          <p className="text-sm text-slate-400 dark:text-ink-500">
            © {new Date().getFullYear()} Servicely. Built for ABUAD students.
          </p>
          <p className="text-sm text-slate-400 dark:text-ink-500">
            Secure payments powered by Paystack
          </p>
        </div>
      </div>
    </footer>
  );
}

const statusStyles: Record<string, string> = {
  pending: 'bg-warning-50 text-warning-700 dark:bg-warning-600/15 dark:text-warning-200',
  accepted: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200',
  payment_pending: 'bg-warning-50 text-warning-700 dark:bg-warning-600/15 dark:text-warning-200',
  paid: 'bg-success-50 text-success-700 dark:bg-success-600/15 dark:text-success-200',
  completed: 'bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300',
  reviewed: 'bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300',
  rejected: 'bg-danger-50 text-danger-700 dark:bg-danger-500/15 dark:text-danger-200',
  cancelled: 'bg-slate-100 text-slate-500 dark:bg-ink-800 dark:text-ink-400',
  disputed: 'bg-danger-50 text-danger-700 dark:bg-danger-500/15 dark:text-danger-200',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  payment_pending: 'Payment Due',
  paid: 'Confirmed',
  completed: 'Completed',
  reviewed: 'Reviewed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${statusStyles[status] || 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-ink-300'}`}>
      {statusLabels[status] || status}
    </span>
  );
}

export function VerifiedBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return (
    <span
      className={`badge bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300 ${
        size === 'md' ? 'px-3 py-1 text-xs' : ''
      }`}
    >
      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l2.4 2.4 3.4-.6.6 3.4L20.8 9.6 18.4 12l2.4 2.4-3.4.6-.6 3.4L12 16l-2.4 2.4-3.4-.6-.6-3.4L3.2 11.6 5.6 9.2 3.2 6.8l3.4-.6.6-3.4L12 2zm-1.2 12.8l5.2-5.2-1.4-1.4-3.8 3.8-1.8-1.8-1.4 1.4 3.2 3.2z" />
      </svg>
      Verified
    </span>
  );
}

export function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} width={size} height={size} viewBox="0 0 24 24" fill={star <= Math.round(rating) ? '#f59e0b' : '#e4e4e7'} aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export function ProviderCard({ provider }: { provider: import('@/data/mockData').Provider }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="card-hover group overflow-hidden"
    >
      <div className="relative h-40 overflow-hidden bg-lavender">
        <img
          src={provider.portfolio?.[0]?.image || provider.avatar}
          alt={provider.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2.5">
          <img src={provider.avatar} alt={provider.name} className="h-9 w-9 rounded-full border-2 border-white object-cover" />
          <div className="text-white">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold">{provider.name}</span>
              {provider.verified && <VerifiedBadge />}
            </div>
            <p className="text-xs text-white/80">
              {(provider.categories || []).join(' • ')}
            </p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <StarRating rating={provider.rating} />
            <span className="text-sm font-medium text-slate-700 dark:text-ink-300">{provider.rating}</span>
            <span className="text-xs text-slate-400">({provider.reviewCount})</span>
          </div>
          <span className="text-xs text-slate-400">{provider.completedBookings} bookings</span>
        </div>
        <p className="mt-2 line-clamp-2 text-xs text-slate-500 dark:text-ink-400">{provider.about}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-slate-500 dark:text-ink-400">
            From <span className="font-bold text-slate-900 dark:text-ink-50">{formatNaira(provider.startingPrice)}</span>
          </span>
          <span className="text-xs text-slate-400">{provider.location}</span>
        </div>
        <div className="mt-4 flex gap-2">
          <Link to={`/providers/${provider.id}`} className="btn-outline btn-sm flex-1">
            View Profile
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export function ChevronLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="group inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
      {children}
      <ChevronDown className="h-4 w-4 -rotate-90 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
