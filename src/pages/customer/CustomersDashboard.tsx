import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, Heart, Calendar, Star, User, Settings, ArrowRight, TrendingUp, Clock, CheckCircle2, CalendarClock } from 'lucide-react';
import { DashboardLayout, DashboardHeader, StatCard } from '@/components/DashboardLayout';
import { ProviderCard, StatusBadge } from '@/components/shared';
import { useAuth, useBookings } from '@/context/AppContext';
import { providers, formatNaira } from '@/data/mockData';
import { customerNavItems } from "@/data/customerNavItems";


export function CustomersDashboard() {
  const { user } = useAuth();
  const { bookings, savedProviders } = useBookings();
  const upcoming = bookings.filter((b) => ['accepted', 'paid'].includes(b.status));
  const pending = bookings.filter((b) => b.status === 'pending');
  const completed = bookings.filter((b) => ['completed', 'reviewed'].includes(b.status));
  const saved = providers.filter((p) => savedProviders.includes(p.id));
  const recommended = providers.filter((p) => p.verified).slice(0, 4);

  return (
    <DashboardLayout role="customer" navItems={customerNavItems}>
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