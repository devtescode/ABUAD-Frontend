import { useState } from 'react';
import { DashboardLayout, DashboardHeader } from '@/components/DashboardLayout';
import { providers } from '@/data/mockData';
import { providerNavItems } from "@/data/providerNavItems";
export function ProviderAvailability() {
    
const currentProvider = providers[0];
  const [days, setDays] = useState(currentProvider.availability);
  const toggle = (day: string) => setDays((prev) => prev.map((d) => d.day === day ? { ...d, available: !d.available } : d));
  return (
    <DashboardLayout role="provider" navItems={providerNavItems}>
      <DashboardHeader title="Availability" subtitle="Set your working days and times" />
      <div className="card max-w-2xl p-6">
        <div className="space-y-3">
          {days.map((day) => (
            <div key={day.day} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
              <span className="w-24 text-sm font-medium text-ink-700">{day.day}</span>
              <button
                onClick={() => toggle(day.day)}
                className={`relative h-6 w-11 rounded-full transition-colors ${day.available ? 'bg-primary-600' : 'bg-ink-200'}`}
              >
                <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${day.available ? 'translate-x-5' : ''}`} />
              </button>
              {day.available ? (
                <div className="flex flex-1 items-center gap-2">
                  <input type="time" defaultValue={day.start} className="input flex-1" />
                  <span className="text-ink-400">—</span>
                  <input type="time" defaultValue={day.end} className="input flex-1" />
                </div>
              ) : (
                <span className="badge bg-ink-100 text-ink-500">Unavailable</span>
              )}
            </div>
          ))}
        </div>
        <button className="btn-primary mt-6">Save Availability</button>
      </div>
    </DashboardLayout>
  );
}