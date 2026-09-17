import {
  DashboardLayout,
  DashboardHeader,
} from '@/components/DashboardLayout';
import { providerNavItems } from '@/data/providerNavItems';
import { Image } from 'lucide-react';
import { Link } from 'react-router-dom';


export function ProviderAddService() {
  return (
    <DashboardLayout role="provider" navItems={providerNavItems}>
      <DashboardHeader title="Add Service" subtitle="Create a new service listing" />
      <div className="card max-w-2xl p-6">
        <div className="space-y-4">
          <div>
            <label className="label">Service Title</label>
            <input className="input" placeholder="e.g. Birthday Photography" />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input">
              <option>Photography</option>
              <option>Videography</option>
              <option>Graphic Design</option>
              <option>Makeup</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Price (₦)</label>
              <input type="number" className="input" placeholder="30000" />
            </div>
            <div>
              <label className="label">Duration</label>
              <input className="input" placeholder="e.g. 2 hours" />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[100px]" placeholder="Describe your service in detail..." />
          </div>
          <div>
            <label className="label">Service Image</label>
            <div className="rounded-xl border-2 border-dashed border-ink-200 p-6 text-center">
              <Image className="mx-auto h-8 w-8 text-ink-300" />
              <p className="mt-1 text-sm text-ink-500">Click to upload an image</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/provider/services" className="btn-outline">Cancel</Link>
            <button className="btn-primary">Create Service</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
