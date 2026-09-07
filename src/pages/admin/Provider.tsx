import { Eye, Ban } from 'lucide-react';
import {
  DashboardLayout,
  DashboardHeader,
} from '@/components/DashboardLayout';

import { adminNavItems } from '@/data/adminNavItems';
import { providers} from '@/data/mockData';
import {VerifiedBadge, StarRating } from '@/components/shared';
import { Link } from 'react-router-dom';

export function AdminProviders() {
  return (
    <DashboardLayout role="admin" navItems={adminNavItems}>
      <DashboardHeader title="Provider Management" subtitle="Manage all service providers" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => (
          <div key={provider.id} className="card p-5">
            <div className="flex items-center gap-3">
              <img src={provider.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-ink-900">{provider.name}</h3>
                  {provider.verified && <VerifiedBadge />}
                </div>
                <p className="text-xs text-ink-500">{provider.categories.join(', ')}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1"><StarRating rating={provider.rating} /> {provider.rating}</span>
              <span className="text-ink-400">{provider.completedBookings} bookings</span>
            </div>
            <div className="mt-3 flex gap-2">
              <Link to={`/providers/${provider.id}`} className="btn-outline btn-sm flex-1"><Eye className="h-3.5 w-3.5" /> View</Link>
              {provider.status === 'verified' ? (
                <button className="btn-outline btn-sm text-red-600"><Ban className="h-3.5 w-3.5" /> Suspend</button>
              ) : (
                <Link to="/admin/verification" className="btn-primary btn-sm">Review</Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}