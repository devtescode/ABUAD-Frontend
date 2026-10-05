import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Package, Plus, Image, Calendar, Inbox, ClipboardList, DollarSign, Star, User, Settings, TrendingUp, Clock, CheckCircle2, DollarSign as Money, ArrowRight, Trash2, Edit, Eye } from 'lucide-react';
import { DashboardLayout, DashboardHeader, StatCard } from '@/components/DashboardLayout';
import { StatusBadge, VerifiedBadge, StarRating } from '@/components/shared';
import { useAuth, useBookings } from '@/context/AppContext';
import { providers, formatNaira, sampleBookings, reviews } from '@/data/mockData';

const navItems = [
  { label: 'Overview', icon: Home, path: '/provider' },
  { label: 'My Services', icon: Package, path: '/provider/services' },
  { label: 'Add Service', icon: Plus, path: '/provider/add-service' },
  { label: 'Portfolio', icon: Image, path: '/provider/portfolio' },
  { label: 'Availability', icon: Calendar, path: '/provider/availability' },
  { label: 'Booking Requests', icon: Inbox, path: '/provider/requests' },
  { label: 'My Bookings', icon: ClipboardList, path: '/provider/bookings' },
  { label: 'Earnings', icon: DollarSign, path: '/provider/earnings' },
  { label: 'Reviews', icon: Star, path: '/provider/reviews' },
  { label: 'My Profile', icon: User, path: '/provider/profile' },
  { label: 'Settings', icon: Settings, path: '/provider/settings' },
];

const currentProvider = providers[0];

export function ProviderOnboarding() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const steps = ['Profile Details', 'Services & Pricing', 'Portfolio', 'Availability', 'Review & Submit'];

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card max-w-md p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-100 text-accent-600">
            <Clock className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-ink-900 dark:text-ink-50">Verification Pending</h1>
          <p className="mt-2 text-sm text-ink-500">
            Your profile has been submitted for review. Our team will verify your information and approve your account shortly. You'll receive a notification once approved.
          </p>
          <div className="mt-6 rounded-xl bg-ink-50 p-4 text-left">
            <p className="text-xs font-medium text-ink-500">Current Status</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="badge bg-accent-100 text-accent-700">Pending Review</span>
            </div>
          </div>
          <Link to="/provider" className="btn-primary mt-6 w-full">Go to Dashboard <ArrowRight className="h-4 w-4" /></Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">Provider Onboarding</h1>
        <p className="mt-1 text-sm text-ink-500">Complete your profile to start receiving bookings</p>

        {/* Stepper */}
        <div className="mt-8 flex items-center">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center last:flex-none">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${i <= step ? 'bg-primary-600 text-white' : 'bg-ink-100 text-ink-400'}`}>
                {i < step ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`mx-2 h-0.5 flex-1 ${i < step ? 'bg-primary-600' : 'bg-ink-100'}`} />}
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm font-medium text-ink-700">{steps[step]}</p>

        <div className="mt-6 card p-6">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="label">Professional Name</label>
                <input className="input" placeholder="e.g. Daniel Photography" />
              </div>
              <div>
                <label className="label">Service Categories</label>
                <div className="flex flex-wrap gap-2">
                  {['Photography', 'Videography', 'Graphic Design', 'Makeup'].map((c) => (
                    <label key={c} className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-sm">
                      <input type="checkbox" className="accent-primary-600" /> {c}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">About / Bio</label>
                <textarea className="input min-h-[100px]" placeholder="Tell customers about your services and experience..." />
              </div>
              <div>
                <label className="label">Location / Service Area</label>
                <input className="input" placeholder="e.g. ABUAD Campus, Ado-Ekiti" />
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-ink-500">Add at least one service to continue. You can add more later.</p>
              <div>
                <label className="label">Service Title</label>
                <input className="input" placeholder="e.g. Birthday Photography" />
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
                <textarea className="input min-h-[80px]" placeholder="Describe the service..." />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-ink-500">Upload examples of your work to showcase in your portfolio.</p>
              <div className="rounded-xl border-2 border-dashed border-ink-200 p-8 text-center">
                <Image className="mx-auto h-10 w-10 text-ink-300" />
                <p className="mt-2 text-sm text-ink-500">Drag and drop images here, or click to browse</p>
                <button className="btn-outline mt-4">Upload Images</button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-ink-500">Set your weekly availability so customers know when you're free.</p>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <div key={day} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                  <span className="w-24 text-sm font-medium text-ink-700">{day}</span>
                  <input type="checkbox" defaultChecked className="accent-primary-600" />
                  <input type="time" defaultValue="10:00" className="input flex-1" />
                  <span className="text-ink-400">—</span>
                  <input type="time" defaultValue="17:00" className="input flex-1" />
                </div>
              ))}
            </div>
          )}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm text-ink-500">Review your information and submit for verification.</p>
              <div className="rounded-xl bg-ink-50 p-4 text-sm">
                <p className="font-medium text-ink-700">Ready to submit?</p>
                <p className="mt-1 text-ink-500">Once submitted, our admin team will review your profile. This usually takes 1-2 business days.</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <button onClick={() => setStep(Math.max(0, step - 1))} className="btn-outline" disabled={step === 0}>
              Back
            </button>
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(step + 1)} className="btn-primary">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={() => setSubmitted(true)} className="btn-primary">
                Submit for Verification <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



export function ProviderEarnings() {
  return (
    <DashboardLayout role="provider" navItems={navItems}>
      <DashboardHeader title="Earnings" subtitle="Track your income and payouts" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Earnings" value="₦845,000" icon={Money} color="primary" />
        <StatCard label="This Month" value="₦120,000" icon={TrendingUp} color="sky" trend="+12%" />
        <StatCard label="Pending Payout" value="₦45,000" icon={Clock} color="accent" />
        <StatCard label="Commission Paid" value="₦84,500" icon={Money} color="rose" />
      </div>
      <div className="mt-6 card p-6">
        <h3 className="font-semibold text-ink-900 dark:text-ink-50">Recent Transactions</h3>
        <div className="mt-4 space-y-3">
          {sampleBookings.filter((b) => ['paid', 'completed', 'reviewed'].includes(b.status)).map((b) => (
            <div key={b.id} className="flex items-center justify-between border-b border-ink-100 pb-3 last:border-0">
              <div>
                <p className="text-sm font-medium text-ink-900">{b.serviceName}</p>
                <p className="text-xs text-ink-400">{b.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-primary-600">+{formatNaira(b.price * 0.9)}</p>
                <p className="text-xs text-ink-400">Fee: {formatNaira(b.price * 0.1)}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="btn-primary mt-6">Request Payout</button>
      </div>
    </DashboardLayout>
  );
}

export function ProviderReviews() {
  const providerReviews = reviews.filter((r) => r.providerId === currentProvider.id);
  return (
    <DashboardLayout role="provider" navItems={navItems}>
      <DashboardHeader title="Reviews" subtitle="What customers are saying about you" />
      <div className="card mb-6 flex items-center gap-6 p-6">
        <div className="text-center">
          <p className="text-4xl font-bold text-ink-900">{currentProvider.rating}</p>
          <StarRating rating={currentProvider.rating} size={18} />
          <p className="mt-1 text-xs text-ink-500">{currentProvider.reviewCount} reviews</p>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <VerifiedBadge />
            <span className="text-sm text-ink-600">Highly rated provider</span>
          </div>
          <p className="mt-2 text-sm text-ink-500">Keep delivering great service to maintain your rating.</p>
        </div>
      </div>
      <div className="space-y-3">
        {providerReviews.map((review) => (
          <div key={review.id} className="card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                  {review.customerName[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">{review.customerName}</p>
                  <p className="text-xs text-ink-400">{review.date}</p>
                </div>
              </div>
              <StarRating rating={review.rating} />
            </div>
            <p className="mt-3 text-sm text-ink-600">{review.comment}</p>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}



export function ProviderSettings() {
  return (
    <DashboardLayout role="provider" navItems={navItems}>
      <DashboardHeader title="Settings" subtitle="Manage your account preferences" />
      <div className="card max-w-2xl p-6">
        <h3 className="font-semibold text-ink-900">Notifications</h3>
        <div className="mt-4 space-y-3">
          {['New booking requests', 'Booking confirmations', 'New reviews', 'Payout updates'].map((item) => (
            <label key={item} className="flex items-center justify-between">
              <span className="text-sm text-ink-700">{item}</span>
              <input type="checkbox" defaultChecked className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-ink-200 transition-colors checked:bg-primary-600 relative after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform checked:after:translate-x-4" />
            </label>
          ))}
        </div>
        <h3 className="mt-8 font-semibold text-ink-900">Payout Details</h3>
        <div className="mt-4">
          <label className="label">Bank Account</label>
          <input className="input" placeholder="Enter account number" />
        </div>
        <button className="btn-outline mt-4">Change Password</button>
      </div>
    </DashboardLayout>
  );
}
