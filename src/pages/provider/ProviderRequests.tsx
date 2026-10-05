

import { DashboardLayout, DashboardHeader } from '../../components/DashboardLayout';
import { providerNavItems } from '../../data/providerNavItems';
import {Inbox, DollarSign as Money, ArrowRight, Trash2, Edit, Eye } from 'lucide-react';
import { StatusBadge, VerifiedBadge, StarRating } from '../../components/shared';
import { formatNaira, sampleBookings,  } from '../../data/mockData';
import { useAuth, useBookings } from '../../context/AppContext';
export function ProviderRequests() {
  const { bookings, updateBookingStatus } = useBookings();
  const requests = bookings.filter((b) => b.status === 'pending');
  const demoRequests = sampleBookings.filter((b) => b.status === 'pending' || b.status === 'accepted');

  return (
    <DashboardLayout role="provider" navItems={providerNavItems}>
      <DashboardHeader title="Booking Requests" subtitle="Review and respond to incoming requests" />
      {demoRequests.length === 0 && requests.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="h-12 w-12 text-ink-300" />
          <h3 className="mt-4 text-lg font-semibold text-ink-900 dark:text-ink-50">No new requests</h3>
          <p className="mt-1 text-sm text-ink-500">New booking requests will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...requests, ...demoRequests].map((booking) => (
            <div key={booking.id} className="card p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                    {booking.customerName[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink-900">{booking.serviceName}</h3>
                    <p className="text-sm text-ink-500">{booking.customerName}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-400">
                      <span>{booking.date} at {booking.time}</span>
                      <span>{booking.location}</span>
                      <span>{formatNaira(booking.price)}</span>
                    </div>
                    {booking.notes && <p className="mt-2 rounded-lg bg-ink-50 p-2 text-xs text-ink-600">"{booking.notes}"</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {booking.status === 'pending' ? (
                    <>
                      <button onClick={() => updateBookingStatus(booking.id, 'accepted')} className="btn-primary btn-sm">Accept</button>
                      <button onClick={() => updateBookingStatus(booking.id, 'rejected')} className="btn-outline btn-sm text-red-600">Reject</button>
                    </>
                  ) : (
                    <StatusBadge status={booking.status} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
