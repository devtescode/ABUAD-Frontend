import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Package, Plus, Image, Calendar, Inbox, ClipboardList, DollarSign, Star, User, Settings, TrendingUp, Clock, CheckCircle2, DollarSign as Money, ArrowRight, Trash2, Edit, Eye } from 'lucide-react';
import { DashboardLayout, DashboardHeader, StatCard } from '@/components/DashboardLayout';
import { StatusBadge, VerifiedBadge, StarRating } from '@/components/shared';
import { useAuth, useBookings } from '@/context/AppContext';
import { providers, formatNaira, sampleBookings, reviews } from '@/data/mockData';
import { providerNavItems } from '@/data/providerNavItems';
export function ProviderProfile() {
  const { user } = useAuth();
  const currentProvider = providers[0];
  return (
    <DashboardLayout role="provider" navItems={providerNavItems}>
      <DashboardHeader title="My Profile" subtitle="Your public provider profile" />
      <div className="card max-w-2xl p-6">
        <div className="flex items-center gap-4">
          <img src={currentProvider.avatar} alt="" className="h-20 w-20 rounded-full object-cover" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-ink-900">{currentProvider.name}</h2>
              <VerifiedBadge />
            </div>
            <p className="text-sm text-ink-500">{currentProvider.categories.join(' • ')}</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Display Name</label>
            <input className="input" defaultValue={currentProvider.name} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" defaultValue={user?.email} disabled />
          </div>
          <div className="sm:col-span-2">
            <label className="label">About</label>
            <textarea className="input min-h-[100px]" defaultValue={currentProvider.about} />
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" defaultValue={currentProvider.location} />
          </div>
          <div>
            <label className="label">Starting Price</label>
            <input type="number" className="input" defaultValue={currentProvider.startingPrice} />
          </div>
        </div>
        <button className="btn-primary mt-6">Save Changes</button>
      </div>
    </DashboardLayout>
  );
}