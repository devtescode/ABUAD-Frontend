import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, Briefcase, CheckCircle2, Tag, Calendar, CreditCard, Star, AlertTriangle, Award, BarChart3, Settings, TrendingUp, DollarSign, Eye, XCircle, Ban, RotateCcw } from 'lucide-react';
import { DashboardLayout, DashboardHeader, StatCard } from '@/components/DashboardLayout';
import { StatusBadge, VerifiedBadge, StarRating } from '@/components/shared';
import { providers, sampleBookings, reviews, formatNaira, categories } from '@/data/mockData';

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, path: '/admin' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Providers', icon: Briefcase, path: '/admin/providers' },
  { label: 'Verification', icon: CheckCircle2, path: '/admin/verification' },
  { label: 'Categories', icon: Tag, path: '/admin/categories' },
  { label: 'Bookings', icon: Calendar, path: '/admin/bookings' },
  { label: 'Payments', icon: CreditCard, path: '/admin/payments' },
  { label: 'Reviews', icon: Star, path: '/admin/reviews' },
  { label: 'Disputes', icon: AlertTriangle, path: '/admin/disputes' },
  { label: 'Featured', icon: Award, path: '/admin/featured' },
  { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
];

export function AdminDashboard() {
  return (
    <DashboardLayout role="admin" navItems={navItems}>
      <DashboardHeader title="Admin Dashboard" subtitle="Platform overview and statistics" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Users" value="1,247" icon={Users} color="primary" trend="+8%" />
        <StatCard label="Total Providers" value="86" icon={Briefcase} color="sky" />
        <StatCard label="Verified" value="72" icon={CheckCircle2} color="primary" />
        <StatCard label="Pending" value="14" icon={AlertTriangle} color="accent" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Bookings" value="432" icon={Calendar} color="primary" />
        <StatCard label="Completed" value="389" icon={CheckCircle2} color="sky" />
        <StatCard label="Cancelled" value="28" icon={XCircle} color="rose" />
        <StatCard label="Transaction Volume" value="₦2.4M" icon={DollarSign} color="primary" trend="+15%" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="font-semibold text-ink-900 dark:text-ink-50">Platform Commission</h3>
          <div className="mt-4 flex items-end gap-1">
            {[40, 55, 35, 70, 60, 85, 75, 90, 80, 95].map((h, i) => (
              <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.05 }} className="flex-1 rounded-t bg-primary-500" style={{ height: `${h}%` }} />
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-400">Last 10 months • Total: ₦240,000</p>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold text-ink-900 dark:text-ink-50">Recent Activity</h3>
          <div className="mt-4 space-y-3">
            {[
              { text: 'New provider registration', time: '2 mins ago' },
              { text: 'Booking completed by Daniel Okonkwo', time: '15 mins ago' },
              { text: 'Payment received ₦45,000', time: '1 hour ago' },
              { text: 'New review submitted', time: '2 hours ago' },
              { text: 'Provider verification request', time: '3 hours ago' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between border-b border-ink-100 pb-2 last:border-0">
                <p className="text-sm text-ink-700">{item.text}</p>
                <span className="text-xs text-ink-400">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}



export function AdminCategories() {
  return (
    <DashboardLayout role="admin" navItems={navItems}>
      <DashboardHeader title="Category Management" subtitle="Manage service categories" action={<button className="btn-primary"><Tag className="h-4 w-4" /> Add Category</button>} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat) => (
          <div key={cat.id} className="card overflow-hidden">
            <img src={cat.image} alt="" className="h-32 w-full object-cover" />
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-ink-900">{cat.name}</h3>
                <span className="badge bg-primary-100 text-primary-700">Active</span>
              </div>
              <p className="mt-1 text-xs text-ink-500 line-clamp-2">{cat.description}</p>
              <div className="mt-3 flex gap-2">
                <button className="btn-outline btn-sm flex-1">Edit</button>
                <button className="btn-outline btn-sm text-red-600"><Ban className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}



export function AdminPayments() {
  return (
    <DashboardLayout role="admin" navItems={navItems}>
      <DashboardHeader title="Payment Management" subtitle="Monitor transactions and payouts" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Volume" value="₦2.4M" icon={DollarSign} color="primary" trend="+15%" />
        <StatCard label="Commission" value="₦240k" icon={TrendingUp} color="sky" />
        <StatCard label="Provider Payouts" value="₦1.96M" icon={CreditCard} color="accent" />
        <StatCard label="Failed Payments" value="3" icon={XCircle} color="rose" />
      </div>
      <div className="mt-6 card overflow-hidden">
        <h3 className="p-5 font-semibold text-ink-900 dark:text-ink-50">Recent Transactions</h3>
        <table className="w-full text-left text-sm">
          <thead className="border-y border-ink-100 bg-ink-50 text-xs uppercase text-ink-500">
            <tr><th className="p-4">Booking</th><th className="p-4">Amount</th><th className="p-4">Commission</th><th className="p-4">Provider</th><th className="p-4">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {sampleBookings.filter((b) => ['paid', 'completed', 'reviewed'].includes(b.status)).map((b) => (
              <tr key={b.id} className="hover:bg-ink-50">
                <td className="p-4 font-medium text-ink-900">{b.serviceName}</td>
                <td className="p-4 text-ink-600">{formatNaira(b.price)}</td>
                <td className="p-4 text-primary-600">{formatNaira(b.price * 0.1)}</td>
                <td className="p-4 text-ink-600">{formatNaira(b.price * 0.9)}</td>
                <td className="p-4"><span className="badge bg-primary-100 text-primary-700">Success</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

export function AdminReviews() {
  return (
    <DashboardLayout role="admin" navItems={navItems}>
      <DashboardHeader title="Review Management" subtitle="Moderate customer reviews" />
      <div className="space-y-3">
        {reviews.map((review) => {
          const provider = providers.find((p) => p.id === review.providerId);
          return (
            <div key={review.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                    {review.customerName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{review.customerName}</p>
                    <p className="text-xs text-ink-400">on {provider?.name} • {review.date}</p>
                  </div>
                </div>
                <StarRating rating={review.rating} />
              </div>
              <p className="mt-3 text-sm text-ink-600">{review.comment}</p>
              <div className="mt-3 flex gap-2">
                <button className="btn-outline btn-sm"><Eye className="h-3.5 w-3.5" /> View</button>
                <button className="btn-outline btn-sm text-red-600"><Ban className="h-3.5 w-3.5" /> Hide</button>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}

export function AdminDisputes() {
  return (
    <DashboardLayout role="admin" navItems={navItems}>
      <DashboardHeader title="Dispute Management" subtitle="Review and resolve booking disputes" />
      <div className="card flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-ink-300" />
          <h3 className="mt-4 text-lg font-semibold text-ink-900 dark:text-ink-50">No active disputes</h3>
        <p className="mt-1 text-sm text-ink-500">When customers or providers report issues, they will appear here.</p>
      </div>
    </DashboardLayout>
  );
}

export function AdminFeatured() {
  const featured = providers.filter((p) => p.featured);
  const nonFeatured = providers.filter((p) => !p.featured && p.verified);
  return (
    <DashboardLayout role="admin" navItems={navItems}>
      <DashboardHeader title="Featured Providers" subtitle="Promote top providers on the homepage" />
      <h3 className="mb-3 font-semibold text-ink-900 dark:text-ink-50">Currently Featured</h3>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((p) => (
          <div key={p.id} className="card flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <img src={p.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              <div>
                <p className="text-sm font-semibold text-ink-900">{p.name}</p>
                <p className="text-xs text-ink-400">{p.categories.join(', ')}</p>
              </div>
            </div>
            <button className="btn-outline btn-sm text-red-600"><Award className="h-3.5 w-3.5" /> Unfeature</button>
          </div>
        ))}
      </div>
      <h3 className="mb-3 font-semibold text-ink-900">Available to Feature</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {nonFeatured.map((p) => (
          <div key={p.id} className="card flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <img src={p.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              <div>
                <p className="text-sm font-semibold text-ink-900">{p.name}</p>
                <p className="text-xs text-ink-400">{p.categories.join(', ')}</p>
              </div>
            </div>
            <button className="btn-primary btn-sm"><Award className="h-3.5 w-3.5" /> Feature</button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

export function AdminAnalytics() {
  return (
    <DashboardLayout role="admin" navItems={navItems}>
      <DashboardHeader title="Analytics" subtitle="Platform growth and insights" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Users" value="1,247" icon={Users} color="primary" trend="+8%" />
        <StatCard label="Active Providers" value="72" icon={Briefcase} color="sky" trend="+5%" />
        <StatCard label="Bookings" value="432" icon={Calendar} color="accent" trend="+12%" />
        <StatCard label="Revenue" value="₦2.4M" icon={DollarSign} color="rose" trend="+15%" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="font-semibold text-ink-900">Monthly Bookings</h3>
          <div className="mt-4 flex h-40 items-end gap-2">
            {[30, 45, 35, 50, 60, 55, 70, 65, 80, 75, 90, 85].map((h, i) => (
              <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.03 }} className="flex-1 rounded-t bg-primary-500" />
            ))}
          </div>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold text-ink-900">Top Categories</h3>
          <div className="mt-4 space-y-3">
            {categories.map((cat, i) => (
              <div key={cat.id}>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-700">{cat.name}</span>
                  <span className="font-medium text-ink-900">{[45, 25, 20, 10][i]}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-100">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${[45, 25, 20, 10][i]}%` }} transition={{ delay: i * 0.1 }} className="h-full rounded-full bg-primary-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export function AdminSettings() {
  return (
    <DashboardLayout role="admin" navItems={navItems}>
      <DashboardHeader title="Settings" subtitle="Platform configuration" />
      <div className="card max-w-2xl p-6">
        <h3 className="font-semibold text-ink-900">Platform Settings</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label">Platform Commission (%)</label>
            <input type="number" className="input" defaultValue={10} />
          </div>
          <div>
            <label className="label">Platform Name</label>
            <input className="input" defaultValue="Servicely" />
          </div>
          <div>
            <label className="label">Default Currency</label>
            <select className="input"><option>NGN (₦)</option><option>USD ($)</option></select>
          </div>
          <div>
            <label className="label">Support Email</label>
            <input className="input" defaultValue="support@servicely.com" />
          </div>
          <button className="btn-primary">Save Settings</button>
        </div>
      </div>
    </DashboardLayout>
  );
}
