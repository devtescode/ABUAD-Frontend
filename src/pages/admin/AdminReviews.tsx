import {
  DashboardLayout,
  DashboardHeader,
} from "@/components/DashboardLayout";
import { Eye, Ban } from 'lucide-react';
import { adminNavItems } from "@/data/adminNavItems";
import { providers, sampleBookings, reviews, formatNaira, categories } from '@/data/mockData';
import { StatusBadge, VerifiedBadge, StarRating } from '@/components/shared';
export function AdminReviews() {
  return (
    <DashboardLayout role="admin" navItems={adminNavItems}>
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