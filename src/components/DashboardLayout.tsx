import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useAuth } from '@/context/AppContext';
import { Logo } from '@/components/shared';
import { LogOut, Menu, X } from 'lucide-react';
import type { UserRole } from '@/data/mockData';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

export function DashboardLayout({ role, navItems, children }: { role: UserRole; navItems: NavItem[]; children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-ink-100 bg-white lg:flex lg:flex-col">
        <div className="flex h-14 items-center border-b border-ink-100 px-5">
          <Logo />
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? 'bg-ink-100 text-ink-900' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-900'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-ink-900"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={`h-4 w-4 ${active ? 'text-ink-900' : 'text-ink-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-ink-100 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-white">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink-900">{user?.name}</p>
              <p className="truncate text-xs text-ink-400">{roleLabel} account</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink-100 bg-white px-4 lg:hidden">
        <Logo />
        <button onClick={() => setMobileOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-700">
          <Menu className="h-5 w-5" />
        </button>
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
              className="fixed inset-0 z-40 bg-ink-900/30 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto bg-white lg:hidden"
            >
              <div className="flex h-14 items-center justify-between border-b border-ink-100 px-5">
                <Logo />
                <button onClick={() => setMobileOpen(false)} className="text-ink-400 hover:text-ink-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="space-y-0.5 p-3">
                {navItems.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        active ? 'bg-ink-100 text-ink-900' : 'text-ink-500 hover:bg-ink-50'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-ink-100 p-3">
                <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-500 hover:bg-ink-50">
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="lg:pl-60">
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

export function DashboardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, trend, color = 'primary' }: { label: string; value: string; icon: LucideIcon; trend?: string; color?: 'primary' | 'accent' | 'sky' | 'rose' }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    accent: 'bg-accent-50 text-accent-600',
    sky: 'bg-sky-50 text-sky-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card p-5"
    >
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && <span className="badge bg-ink-100 text-ink-600">{trend}</span>}
      </div>
      <p className="mt-3 text-2xl font-bold text-ink-900">{value}</p>
      <p className="text-sm text-ink-500">{label}</p>
    </motion.div>
  );
}
