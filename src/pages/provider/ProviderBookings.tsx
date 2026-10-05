import { useState } from 'react';
import { DashboardLayout, DashboardHeader } from '../../components/DashboardLayout';
import { providerNavItems } from '../../data/providerNavItems';
import {Inbox, DollarSign as Money, ArrowRight, Trash2, Edit, Eye } from 'lucide-react';
import { StatusBadge, VerifiedBadge, StarRating } from '../../components/shared';
import { formatNaira, sampleBookings,  } from '../../data/mockData';
import { useAuth, useBookings } from '../../context/AppContext';

export function ProviderBookings() {
  const { bookings } = useBookings();
  const all = [...bookings, ...sampleBookings];
  const [filter, setFilter] = useState('all');
  const tabs = ['all', 'pending', 'accepted', 'paid', 'completed', 'cancelled'];
  const filtered = filter === 'all' ? all : all.filter((b) => b.status === filter);

  return (
    <DashboardLayout role="provider" navItems={providerNavItems}>
      <DashboardHeader title="My Bookings" subtitle="All your bookings in one place" />
      <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${filter === t ? 'bg-primary-600 text-white' : 'bg-ink-100 text-ink-600'}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((booking) => (
          <div key={booking.id} className="card flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
              {booking.customerName[0]}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-ink-900">{booking.serviceName}</h3>
              <p className="text-xs text-ink-500">{booking.customerName} • {booking.date} at {booking.time}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-ink-900">{formatNaira(booking.price)}</p>
              <StatusBadge status={booking.status} />
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}