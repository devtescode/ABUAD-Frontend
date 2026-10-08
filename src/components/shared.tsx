import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Menu, X, Camera, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AppContext';
import { formatNaira } from '@/data/mockData';

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 text-white">
        <Camera className="h-4 w-4" />
      </div>
      <span className="text-lg font-bold tracking-tight text-ink-900 dark:text-ink-50">Servicely</span>
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
    <header className="sticky top-0 z-50 w-full border-b border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <div className="hidden items-center gap-0.5 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-500 dark:text-ink-400 transition-colors hover:text-ink-900 dark:hover:text-ink-50"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Link to={`/${user.role}`} className="btn-outline">
                Dashboard
              </Link>
              <button onClick={logout} className="btn-ghost">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login/admin" className="btn-ghost">
                Admin
              </Link>
              <Link to="/signup" className="btn-primary">
                Sign Up
              </Link>
            </>
          )}
          <Link to="/services" className="btn-accent">
            Book a Service
          </Link>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-700 lg:hidden"
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
            className="overflow-hidden border-t border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900 lg:hidden"
          >
            <div className="space-y-1 px-4 py-3">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800"
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-ink-100 dark:border-ink-800 pt-3">
                {user ? (
                  <div className="space-y-2">
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
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link to="/login" onClick={() => setOpen(false)} className="btn-outline w-full">
                      Login
                    </Link>
                    <Link to="/signup" onClick={() => setOpen(false)} className="btn-primary w-full">
                      Sign Up
                    </Link>
                    <Link to="/services" onClick={() => setOpen(false)} className="btn-accent w-full">
                      Book a Service
                    </Link>
                  </div>
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
    Company: ['About', 'How It Works', 'Contact', 'Careers'],
    Services: ['Photography', 'Videography', 'Graphic Design', 'Makeup'],
    Support: ['Help Center', 'Safety', 'Privacy Policy', 'Terms of Service'],
  };

  return (
    <footer className="border-t border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-ink-500">
              The trusted marketplace for student service providers. Find, book, and pay for professional services with confidence.
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-ink-900 dark:text-ink-50">{title}</h4>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-ink-500 dark:text-ink-400 transition-colors hover:text-ink-900 dark:hover:text-ink-50">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-ink-100 dark:border-ink-800 pt-6 sm:flex-row">
          <p className="text-sm text-ink-400 dark:text-ink-500">© 2025 Servicely. All rights reserved.</p>
          <p className="text-sm text-ink-400 dark:text-ink-500">Built for ABUAD students</p>
        </div>
      </div>
    </footer>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-accent-100 text-accent-700',
    accepted: 'bg-sky-100 text-sky-700',
    payment_pending: 'bg-orange-100 text-orange-700',
    paid: 'bg-primary-100 text-primary-700',
    completed: 'bg-ink-100 text-ink-700',
    reviewed: 'bg-primary-100 text-primary-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-ink-100 text-ink-500',
    disputed: 'bg-red-100 text-red-700',
  };
  const labels: Record<string, string> = {
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
  return <span className={`badge ${styles[status] || 'bg-ink-100 text-ink-600'}`}>{labels[status] || status}</span>;
}

export function VerifiedBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return (
    <span className={`badge bg-primary-100 text-primary-700 ${size === 'md' ? 'px-3 py-1 text-xs' : ''}`}>
      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l2.4 2.4 3.4-.6.6 3.4L20.8 9.6 18.4 12l2.4 2.4-3.4.6-.6 3.4L12 16l-2.4 2.4-3.4-.6-.6-3.4L3.2 11.6 5.6 9.2 3.2 6.8l3.4-.6.6-3.4L12 2zm-1.2 12.8l5.2-5.2-1.4-1.4-3.8 3.8-1.8-1.8-1.4 1.4 3.2 3.2z" />
      </svg>
      Verified
    </span>
  );
}

export function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={star <= Math.round(rating) ? '#f59e0b' : '#e4e4e7'}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export function ProviderCard({ provider }: { provider: import('@/data/mockData').Provider }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="card-hover group overflow-hidden"
    >
      <div className="relative h-40 overflow-hidden">
        <img
          // src={provider.portfolio[0]?.image || provider.avatar}
          src={provider.portfolio?.[0]?.image || provider.avatar}
          alt={provider.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 to-transparent" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <img src={provider.avatar} alt={provider.name} className="h-9 w-9 rounded-full border-2 border-white object-cover" />
          <div className="text-white">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold">{provider.name}</span>
              {provider.verified && <VerifiedBadge />}
            </div>
            {/* <p className="text-xs text-white/80">{provider.categories.join(' • ')}</p> */}
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
            <span className="text-sm font-medium text-ink-700">{provider.rating}</span>
            <span className="text-xs text-ink-400">({provider.reviewCount})</span>
          </div>
          <span className="text-xs text-ink-400">{provider.completedBookings} bookings</span>
        </div>
        <p className="mt-2 text-xs text-ink-500 line-clamp-2">{provider.about}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-ink-600">
            From <span className="font-bold text-ink-900">{formatNaira(provider.startingPrice)}</span>
          </span>
          <span className="text-xs text-ink-400">{provider.location}</span>
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
    <Link to={to} className="group inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700">
      {children}
      <ChevronDown className="h-4 w-4 -rotate-90 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
