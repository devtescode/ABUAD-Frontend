import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, Heart, Calendar, Star, User, Settings, ArrowRight, TrendingUp, Clock, CheckCircle2, CalendarClock } from 'lucide-react';
import { DashboardLayout, DashboardHeader, StatCard } from '@/components/DashboardLayout';
import { ProviderCard, StatusBadge } from '@/components/shared';
import { useAuth, useBookings } from '@/context/AppContext';
import { providers, formatNaira } from '@/data/mockData';

const navItems = [
  { label: 'Overview', icon: Home, path: '/customer' },
  { label: 'Browse Services', icon: Search, path: '/customer/browse' },
  { label: 'Saved Providers', icon: Heart, path: '/customer/saved' },
  { label: 'My Bookings', icon: Calendar, path: '/customer/bookings' },
  { label: 'My Reviews', icon: Star, path: '/customer/reviews' },
  { label: 'Profile', icon: User, path: '/customer/profile' },
  { label: 'Settings', icon: Settings, path: '/customer/settings' },
];

export function CustomerDashboard() {
  const { user } = useAuth();
  const { bookings, savedProviders } = useBookings();
  const upcoming = bookings.filter((b) => ['accepted', 'paid'].includes(b.status));
  const pending = bookings.filter((b) => b.status === 'pending');
  const completed = bookings.filter((b) => ['completed', 'reviewed'].includes(b.status));
  const saved = providers.filter((p) => savedProviders.includes(p.id));
  const recommended = providers.filter((p) => p.verified).slice(0, 4);

  return (
    <DashboardLayout role="customer" navItems={navItems}>
      <DashboardHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'}`}
        subtitle="Here's what's happening with your bookings"
        action={<Link to="/customer/browse" className="btn-primary"><Search className="h-4 w-4" /> Browse Services</Link>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Upcoming" value={String(upcoming.length)} icon={CalendarClock} color="primary" />
        <StatCard label="Pending" value={String(pending.length)} icon={Clock} color="accent" />
        <StatCard label="Completed" value={String(completed.length)} icon={CheckCircle2} color="sky" />
        <StatCard label="Saved" value={String(saved.length)} icon={Heart} color="rose" />
      </div>

      {/* Upcoming bookings */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink-900 dark:text-ink-50">Upcoming Bookings</h2>
          <Link to="/customer/bookings" className="text-sm font-semibold text-primary-600">View all →</Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-10 w-10 text-ink-300" />
            <p className="mt-3 text-sm text-ink-500">No upcoming bookings yet</p>
            <Link to="/customer/browse" className="btn-primary btn-sm mt-4">Browse Services</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((booking, i) => (
              <motion.div key={booking.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="card flex items-center gap-4 p-4">
                <img src={booking.providerAvatar} alt="" className="h-12 w-12 rounded-xl object-cover" />
                <div className="flex-1">
                  <h3 className="font-semibold text-ink-900">{booking.serviceName}</h3>
                  <p className="text-sm text-ink-500">{booking.providerName} • {booking.date} at {booking.time}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-ink-900 dark:text-ink-50">{formatNaira(booking.price)}</p>
                  <StatusBadge status={booking.status} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink-900 dark:text-ink-50">Recommended for you</h2>
          <Link to="/customer/browse" className="text-sm font-semibold text-primary-600">View all →</Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {recommended.map((provider, i) => (
            <motion.div key={provider.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <ProviderCard provider={provider} />
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}






export function CustomerReviews() {
  const { bookings } = useBookings();
  const reviewed = bookings.filter((b) => b.status === 'reviewed' || b.status === 'completed');
  return (
    <DashboardLayout role="customer" navItems={navItems}>
      <DashboardHeader title="My Reviews" subtitle="Reviews you've left for providers" />
      {reviewed.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <Star className="h-12 w-12 text-ink-300" />
          <h3 className="mt-4 text-lg font-semibold text-ink-900 dark:text-ink-50">No reviews yet</h3>
          <p className="mt-1 text-sm text-ink-500">Complete a booking to leave a review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviewed.map((booking) => (
            <div key={booking.id} className="card p-4">
              <div className="flex items-center gap-3">
                <img src={booking.providerAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <h3 className="font-semibold text-ink-900">{booking.providerName}</h3>
                  <p className="text-xs text-ink-400">{booking.serviceName}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export function CustomerProfile() {
  const { user } = useAuth();
  return (
    <DashboardLayout role="customer" navItems={navItems}>
      <DashboardHeader title="My Profile" subtitle="Manage your personal information" />
      <div className="card max-w-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-700">
            {user?.name?.[0] || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink-900">{user?.name}</h2>
            <p className="text-sm text-ink-500">{user?.email}</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Full Name</label>
            <input className="input" defaultValue={user?.name} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" defaultValue={user?.email} disabled />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" placeholder="Enter phone number" />
          </div>
          <div>
            <label className="label">University</label>
            <input className="input" defaultValue="ABUAD" />
          </div>
        </div>
        <button className="btn-primary mt-6">Save Changes</button>
      </div>
    </DashboardLayout>
  );
}

export function CustomerSettings() {
  return (
    <DashboardLayout role="customer" navItems={navItems}>
      <DashboardHeader title="Settings" subtitle="Manage your account preferences" />
      <div className="card max-w-2xl p-6">
        <h3 className="font-semibold text-ink-900">Notifications</h3>
        <div className="mt-4 space-y-3">
          {['Booking updates', 'Provider messages', 'Promotional emails', 'New providers in your area'].map((item) => (
            <label key={item} className="flex items-center justify-between">
              <span className="text-sm text-ink-700">{item}</span>
              <input type="checkbox" defaultChecked className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-ink-200 transition-colors checked:bg-primary-600 relative after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform checked:after:translate-x-4" />
            </label>
          ))}
        </div>
        <h3 className="mt-8 font-semibold text-ink-900">Security</h3>
        <button className="btn-outline mt-4">Change Password</button>
      </div>
    </DashboardLayout>
  );
}
