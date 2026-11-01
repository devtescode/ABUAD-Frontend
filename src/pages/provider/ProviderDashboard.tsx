import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  DollarSign,
  Home,
  Image,
  Inbox,
  Landmark,
  Lock,
  Package,
  Plus,
  Receipt,
  Settings,
  ShieldCheck,
  Star,
  TrendingUp,
  User,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { DashboardLayout, DashboardHeader, StatCard } from '@/components/DashboardLayout';
import { Badge, Button, Card, cn } from '@/components/ui';
import { Logo } from '@/components/shared';
import { formatNaira, sampleBookings } from '@/data/mockData';

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

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const serviceCategoryOptions = ['Photography', 'Videography', 'Graphic Design', 'Makeup'];

/* Native checkbox rendered as a toggle switch, with a 44px-friendly wrapper. */
function ToggleSwitch({
  label,
  defaultChecked = false,
}: {
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        aria-label={label}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-slate-300 transition-colors duration-200 peer-checked:bg-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600/60 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-white dark:bg-ink-700 dark:peer-focus-visible:ring-offset-ink-900"
      />
      <span
        aria-hidden="true"
        className="relative z-10 ml-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-5"
      />
    </span>
  );
}

export function ProviderOnboarding() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const steps = ['Profile Details', 'Services & Pricing', 'Portfolio', 'Availability', 'Review & Submit'];
  const isLastStep = step === steps.length - 1;

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-10 dark:bg-ink-950">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="card w-full max-w-md p-8 text-center"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-warning-50 text-warning-600 dark:bg-warning-600/15 dark:text-warning-200">
            <Clock className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-xl font-bold text-slate-900 dark:text-ink-50 sm:text-2xl">
            Verification Pending
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-ink-400">
            Your profile has been submitted for review. Our team will verify your information and approve your account shortly. You'll receive a notification once approved.
          </p>
          <div className="mt-6 rounded-xl border border-slate-200/70 bg-slate-50 p-4 text-left dark:border-ink-800 dark:bg-ink-800/50">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-ink-400">
              Current Status
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Badge tone="warning" icon={Clock}>Pending Review</Badge>
            </div>
          </div>
          <Link to="/provider" className="btn-primary mt-6 w-full">
            Go to Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-ink-950">
      <header className="border-b border-slate-200/70 bg-white/85 backdrop-blur-md dark:border-ink-800 dark:bg-ink-950/85">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Logo />
          <Badge tone="brand" icon={User}>Provider setup</Badge>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-ink-50 sm:text-3xl">
            Provider Onboarding
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-ink-400">
            Complete your profile to start receiving bookings
          </p>
        </div>

        {/* Stepper */}
        <div className="mt-7">
          {/* Compact mobile progress */}
          <div className="sm:hidden">
            <div className="flex items-center justify-between gap-3 text-xs font-medium">
              <span className="text-slate-500 dark:text-ink-400">
                Step {step + 1} of {steps.length}
              </span>
              <span className="truncate text-brand-700 dark:text-brand-300">{steps[step]}</span>
            </div>
            <div
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={steps.length}
              aria-valuenow={step + 1}
              aria-label="Onboarding progress"
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-ink-800"
            >
              <div
                className="h-full rounded-full bg-brand-600 transition-all duration-300"
                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Full labelled stepper on tablet and up */}
          <ol className="hidden sm:flex" aria-label="Onboarding steps">
            {steps.map((label, index) => {
              const isComplete = index < step;
              const isActive = index === step;

              return (
                <li
                  key={label}
                  aria-current={isActive ? 'step' : undefined}
                  className="relative flex flex-1 flex-col items-center text-center"
                >
                  {index < steps.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute left-1/2 top-[18px] h-0.5 w-full',
                        isComplete ? 'bg-brand-600' : 'bg-slate-200 dark:bg-ink-700'
                      )}
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                      isComplete && 'border-brand-600 bg-brand-600 text-white',
                      isActive &&
                        'border-brand-600 bg-white text-brand-700 ring-4 ring-brand-600/10 dark:bg-ink-900 dark:text-brand-300',
                      !isComplete &&
                        !isActive &&
                        'border-slate-200 bg-white text-slate-400 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-500'
                    )}
                  >
                    {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  <span
                    className={cn(
                      'mt-2 text-[11px] font-medium leading-tight',
                      isActive
                        ? 'text-brand-700 dark:text-brand-300'
                        : isComplete
                          ? 'text-slate-600 dark:text-ink-300'
                          : 'text-slate-400 dark:text-ink-500'
                    )}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="card mt-6 p-6 sm:p-8">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="label" htmlFor="provider-name">Professional Name</label>
                <input
                  id="provider-name"
                  className="input"
                  placeholder="e.g. Daniel Photography"
                  autoComplete="organization"
                />
              </div>
              <fieldset>
                <legend className="label">Service Categories</legend>
                <div className="flex flex-wrap gap-2">
                  {serviceCategoryOptions.map((category) => {
                    const selected = selectedCategories.includes(category);

                    return (
                      <label
                        key={category}
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors focus-within:ring-2 focus-within:ring-brand-600/60 focus-within:ring-offset-2 dark:focus-within:ring-offset-ink-900',
                          selected
                            ? 'border-brand-600 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-950/60 dark:text-brand-300'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-lavender dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:border-ink-600 dark:hover:bg-ink-700'
                        )}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={selected}
                          onChange={() => toggleCategory(category)}
                        />
                        <span
                          aria-hidden="true"
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                            selected
                              ? 'border-brand-600 bg-brand-600 text-white'
                              : 'border-slate-300 text-transparent dark:border-ink-600'
                          )}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                        {category}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <div>
                <label className="label" htmlFor="provider-bio">About / Bio</label>
                <textarea
                  id="provider-bio"
                  className="input min-h-[100px] resize-y"
                  placeholder="Tell customers about your services and experience..."
                />
              </div>
              <div>
                <label className="label" htmlFor="provider-location">Location / Service Area</label>
                <input
                  id="provider-location"
                  className="input"
                  placeholder="e.g. ABUAD Campus, Ado-Ekiti"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <p className="text-sm text-slate-500 dark:text-ink-400">
                Add at least one service to continue. You can add more later.
              </p>
              <div>
                <label className="label" htmlFor="service-title">Service Title</label>
                <input id="service-title" className="input" placeholder="e.g. Birthday Photography" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="service-price">Price (₦)</label>
                  <input
                    id="service-price"
                    type="number"
                    inputMode="numeric"
                    className="input"
                    placeholder="30000"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="service-duration">Duration</label>
                  <input id="service-duration" className="input" placeholder="e.g. 2 hours" />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="service-description">Description</label>
                <textarea
                  id="service-description"
                  className="input min-h-[80px] resize-y"
                  placeholder="Describe the service..."
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <p className="text-sm text-slate-500 dark:text-ink-400">
                Upload examples of your work to showcase in your portfolio.
              </p>
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-8 text-center transition-colors hover:border-brand-300 hover:bg-lavender/50 dark:border-ink-700 dark:bg-ink-800/30 dark:hover:border-ink-600 dark:hover:bg-ink-800/60">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lavender text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                  <Image className="h-7 w-7" />
                </div>
                <p className="mt-3 text-sm text-slate-500 dark:text-ink-400">
                  Drag and drop images here, or click to browse
                </p>
                <Button type="button" variant="outline" className="mt-4" icon={Image}>
                  Upload Images
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 dark:text-ink-400">
                Set your weekly availability so customers know when you're free.
              </p>
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="rounded-xl border border-slate-200/70 bg-white p-3 transition-colors hover:border-brand-200 dark:border-ink-800 dark:bg-ink-900 dark:hover:border-ink-700 sm:flex sm:items-center sm:gap-3"
                >
                  <div className="flex items-center justify-between gap-3 sm:justify-start">
                    <span className="w-24 text-sm font-medium text-slate-700 dark:text-ink-200">
                      {day}
                    </span>
                    <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
                      <ToggleSwitch label={`${day} availability`} defaultChecked />
                    </label>
                  </div>
                  <div className="mt-2 flex items-center gap-2 sm:mt-0 sm:flex-1">
                    <label className="sr-only" htmlFor={`${day}-start`}>{day} start time</label>
                    <input
                      id={`${day}-start`}
                      type="time"
                      defaultValue="10:00"
                      className="input min-w-0 flex-1"
                    />
                    <span aria-hidden="true" className="text-slate-400">—</span>
                    <label className="sr-only" htmlFor={`${day}-end`}>{day} end time</label>
                    <input
                      id={`${day}-end`}
                      type="time"
                      defaultValue="17:00"
                      className="input min-w-0 flex-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-ink-400">
                Review your information and submit for verification.
              </p>
              <div className="flex gap-3 rounded-xl border border-brand-100 bg-brand-50/60 p-4 text-sm dark:border-brand-900/60 dark:bg-brand-950/40">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 dark:bg-ink-900 dark:text-brand-300">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium text-slate-900 dark:text-ink-50">Ready to submit?</p>
                  <p className="mt-1 leading-relaxed text-slate-500 dark:text-ink-400">
                    Once submitted, our admin team will review your profile. This usually takes 1-2 business days.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 dark:border-ink-800 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="w-full sm:w-auto"
            >
              Back
            </Button>
            {isLastStep ? (
              <Button onClick={() => setSubmitted(true)} className="w-full sm:w-auto">
                Submit for Verification <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => setStep(step + 1)} className="w-full sm:w-auto">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProviderEarnings() {
  const transactions = sampleBookings.filter((b) =>
    ['paid', 'completed', 'reviewed'].includes(b.status)
  );

  return (
    <DashboardLayout role="provider" navItems={navItems}>
      <DashboardHeader title="Earnings" subtitle="Track your income and payouts" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Earnings" value="₦845,000" icon={DollarSign} color="primary" />
        <StatCard label="This Month" value="₦120,000" icon={TrendingUp} color="sky" trend="+12%" />
        <StatCard label="Pending Payout" value="₦45,000" icon={Clock} color="accent" />
        <StatCard label="Commission Paid" value="₦84,500" icon={DollarSign} color="rose" />
      </div>

      <Card className="mt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lavender text-brand-600 dark:bg-brand-950 dark:text-brand-300">
              <Receipt className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-ink-50">
                Recent Transactions
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-ink-400">
                Your latest payouts, shown after commission
              </p>
            </div>
          </div>
          <Badge tone="neutral">{transactions.length}</Badge>
        </div>

        <div className="mt-4 divide-y divide-slate-100 dark:divide-ink-800">
          {transactions.map((b) => (
            <div
              key={b.id}
              className="flex flex-col gap-2 rounded-lg py-3 transition-colors hover:bg-slate-50/80 dark:hover:bg-ink-800/40 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-ink-50">
                  {b.serviceName}
                </p>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-ink-500">{b.date}</p>
              </div>
              <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                <p className="text-sm font-bold text-brand-600 dark:text-brand-300">
                  +{formatNaira(b.price * 0.9)}
                </p>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-ink-500 sm:mt-0">
                  Fee: {formatNaira(b.price * 0.1)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 dark:border-ink-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500 dark:text-ink-400">
            Payouts are sent to your registered bank account.
          </p>
          <Button className="w-full sm:w-auto" icon={Wallet}>
            Request Payout
          </Button>
        </div>
      </Card>
    </DashboardLayout>
  );
}

const notificationItems = [
  {
    label: 'New booking requests',
    description: 'Get notified when a customer requests a booking.',
    icon: Inbox,
  },
  {
    label: 'Booking confirmations',
    description: 'Updates when a booking is confirmed or changes.',
    icon: CheckCircle2,
  },
  {
    label: 'New reviews',
    description: 'Alerts when customers leave feedback.',
    icon: Star,
  },
  {
    label: 'Payout updates',
    description: 'Know when a payout has been processed.',
    icon: Wallet,
  },
];

function SettingsCardHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lavender text-brand-600 dark:bg-brand-950 dark:text-brand-300">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h2 className="font-semibold text-slate-900 dark:text-ink-50">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-ink-400">{description}</p>
      </div>
    </div>
  );
}

export function ProviderSettings() {
  return (
    <DashboardLayout role="provider" navItems={navItems}>
      <DashboardHeader title="Settings" subtitle="Manage your account preferences" />

      <div className="max-w-3xl space-y-6">
        <Card>
          <SettingsCardHeader
            icon={Bell}
            title="Notifications"
            description="Choose which updates you want to receive."
          />
          <div className="mt-3 divide-y divide-slate-100 dark:divide-ink-800">
            {notificationItems.map((item) => (
              <label
                key={item.label}
                className="-mx-2 flex cursor-pointer items-center justify-between gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-ink-800/50"
              >
                <span className="flex min-w-0 items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-ink-800 dark:text-ink-300"
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-700 dark:text-ink-200">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-ink-400">
                      {item.description}
                    </span>
                  </span>
                </span>
                <ToggleSwitch label={item.label} defaultChecked />
              </label>
            ))}
          </div>
        </Card>

        <Card>
          <SettingsCardHeader
            icon={Landmark}
            title="Payout Details"
            description="Where your earnings are sent."
          />
          <div className="mt-5">
            <label className="label" htmlFor="bank-account">Bank Account</label>
            <input
              id="bank-account"
              className="input"
              placeholder="Enter account number"
              inputMode="numeric"
              autoComplete="off"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-ink-400">
              Used for all payouts after a booking is completed.
            </p>
          </div>
        </Card>

        <Card>
          <SettingsCardHeader
            icon={ShieldCheck}
            title="Security"
            description="Keep your account protected."
          />
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500 dark:text-ink-400">
              Update the password you use to sign in.
            </p>
            <Button variant="outline" icon={Lock} className="w-full sm:w-auto">
              Change Password
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
