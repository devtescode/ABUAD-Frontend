import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  DollarSign,
  Eye,
  EyeOff,
  Home,
  Image,
  Inbox,
  KeyRound,
  Landmark,
  Package,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Star,
  User,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { DashboardLayout, DashboardHeader } from '@/components/DashboardLayout';
import { Badge, Button, Card, Skeleton, cn } from '@/components/ui';
import { Logo } from '@/components/shared';
import { useChangeProviderPassword, useProviderAccount } from '@/hooks/queries';
import { getApiErrorMessage } from '@/lib/api';

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
  checked,
  onChange,
}: {
  label: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event.target.checked);
  };

  return (
    <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
      <input
        type="checkbox"
        {...(checked === undefined ? { defaultChecked } : { checked })}
        onChange={handleChange}
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

const NOTIFICATION_STORAGE_KEY = 'servicely_provider_notification_prefs';

type NotificationPreferences = Record<string, boolean>;

function asText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

function asBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
}

function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber) return '';
  if (accountNumber.length <= 4) return accountNumber;
  return `${'•'.repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`;
}

function loadNotificationPreferences(): NotificationPreferences {
  const defaults = notificationItems.reduce<NotificationPreferences>((prefs, item) => {
    prefs[item.label] = true;
    return prefs;
  }, {});

  if (typeof window === 'undefined') return defaults;

  try {
    const stored = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!stored) return defaults;

    const parsed = JSON.parse(stored) as Record<string, unknown>;
    Object.keys(defaults).forEach((key) => {
      if (typeof parsed[key] === 'boolean') defaults[key] = parsed[key] as boolean;
    });
  } catch {
    /* Ignore unreadable or corrupt storage. */
  }

  return defaults;
}

type PasswordFieldKey = 'current' | 'next' | 'confirm';

type PasswordStrength = {
  label: 'Weak' | 'Fair' | 'Strong';
  filled: number;
  barClass: string;
  textClass: string;
};

function getPasswordStrength(password: string): PasswordStrength | null {
  if (!password) return null;

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) {
    return {
      label: 'Weak',
      filled: 1,
      barClass: 'bg-rose-500',
      textClass: 'text-rose-600 dark:text-rose-400',
    };
  }

  if (score <= 3) {
    return {
      label: 'Fair',
      filled: 2,
      barClass: 'bg-amber-500',
      textClass: 'text-amber-600 dark:text-amber-400',
    };
  }

  return {
    label: 'Strong',
    filled: 3,
    barClass: 'bg-success-500',
    textClass: 'text-success-600 dark:text-success-400',
  };
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  error,
  visible,
  onToggleVisibility,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  error?: string;
  visible: boolean;
  onToggleVisibility: () => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            'input pr-14',
            error &&
              'border-danger-300 focus:border-danger-500 focus:ring-danger-500/10 dark:border-danger-500/50'
          )}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          disabled={disabled}
          className="absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-brand-600/60 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:text-ink-200"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {error && (
        <p
          id={`${id}-error`}
          className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger-600 dark:text-danger-300"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

export function ProviderSettings() {
  const accountQuery = useProviderAccount();
  const changePassword = useChangeProviderPassword();

  const [notificationPrefs, setNotificationPrefs] =
    useState<NotificationPreferences>(loadNotificationPreferences);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisibility, setPasswordVisibility] = useState<
    Record<PasswordFieldKey, boolean>
  >({ current: false, next: false, confirm: false });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<PasswordFieldKey, string>>
  >({});
  const [formError, setFormError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    try {
      window.localStorage.setItem(
        NOTIFICATION_STORAGE_KEY,
        JSON.stringify(notificationPrefs)
      );
    } catch {
      /* Storage may be unavailable (private mode / quota). */
    }
  }, [notificationPrefs]);

  const account = accountQuery.data?.account;
  const bankName = asText(account?.bankName);
  const accountName = asText(account?.accountName);
  const accountNumber = asText(account?.accountNumber);
  const isVerified = asBoolean(account?.isVerified);
  const hasSubaccount = asBoolean(account?.hasSubaccount);
  const hasPayoutAccount = hasSubaccount || Boolean(bankName) || Boolean(accountNumber);

  const passwordStrength = getPasswordStrength(newPassword);

  const toggleNotification = (label: string, checked: boolean) => {
    setNotificationPrefs((current) => ({ ...current, [label]: checked }));
  };

  const togglePasswordVisibility = (field: PasswordFieldKey) => {
    setPasswordVisibility((current) => ({ ...current, [field]: !current[field] }));
  };

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordVisibility({ current: false, next: false, confirm: false });
    setFieldErrors({});
    setFormError('');
    setPasswordSuccess('');
    changePassword.reset();
  };

  const closePasswordForm = () => {
    setShowPasswordForm(false);
    resetPasswordForm();
  };

  const openPasswordForm = () => {
    resetPasswordForm();
    setShowPasswordForm(true);
  };

  const updatePasswordField = (field: PasswordFieldKey, value: string) => {
    if (field === 'current') setCurrentPassword(value);
    if (field === 'next') setNewPassword(value);
    if (field === 'confirm') setConfirmPassword(value);

    setFormError('');
    setPasswordSuccess('');
    setFieldErrors((current) => {
      if (!current[field]) return current;
      return { ...current, [field]: undefined };
    });
  };

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setFormError('');
    setPasswordSuccess('');

    const errors: Partial<Record<PasswordFieldKey, string>> = {};

    if (!currentPassword) {
      errors.current = 'Enter your current password.';
    }

    if (!newPassword) {
      errors.next = 'Enter a new password.';
    } else if (newPassword.length < 8) {
      errors.next = 'Your new password must be at least 8 characters.';
    } else if (newPassword === currentPassword) {
      errors.next = 'Choose a password different from your current one.';
    }

    if (!confirmPassword) {
      errors.confirm = 'Confirm your new password.';
    } else if (newPassword !== confirmPassword) {
      errors.confirm = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    changePassword.mutate(
      { currentPassword, newPassword, confirmPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setPasswordVisibility({ current: false, next: false, confirm: false });
          setFieldErrors({});
          setFormError('');
          setPasswordSuccess(
            'Your password has been updated. Use it the next time you sign in.'
          );
        },
        onError: (error) => {
          setPasswordSuccess('');
          setFormError(getApiErrorMessage(error));
        },
      }
    );
  };

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
                <ToggleSwitch
                  label={item.label}
                  checked={notificationPrefs[item.label] ?? true}
                  onChange={(checked) => toggleNotification(item.label, checked)}
                />
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
            {accountQuery.isLoading ? (
              <div className="space-y-3" aria-busy="true" aria-label="Loading payout details">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            ) : accountQuery.isError ? (
              <div
                role="alert"
                className="flex flex-col gap-3 rounded-xl border border-danger-200 bg-danger-50/70 p-4 text-sm text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/10 dark:text-danger-200 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="leading-5">
                    {getApiErrorMessage(accountQuery.error)}
                  </span>
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                  loading={accountQuery.isFetching}
                  onClick={() => void accountQuery.refetch()}
                  className="w-full shrink-0 sm:w-auto"
                >
                  Try again
                </Button>
              </div>
            ) : hasPayoutAccount ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-4 dark:border-ink-800 dark:bg-ink-800/50">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-ink-50">
                      <Landmark
                        className="h-4 w-4 shrink-0 text-slate-400 dark:text-ink-500"
                        aria-hidden="true"
                      />
                      {bankName || 'Bank account'}
                    </p>
                    <Badge
                      tone={isVerified ? 'success' : 'warning'}
                      icon={isVerified ? CheckCircle2 : Clock}
                    >
                      {isVerified ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-500 dark:text-ink-400">Account name</dt>
                      <dd className="truncate font-medium text-slate-800 dark:text-ink-200">
                        {accountName || '—'}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-500 dark:text-ink-400">Account number</dt>
                      <dd className="font-mono tracking-widest text-slate-800 dark:text-ink-200">
                        {maskAccountNumber(accountNumber) || '—'}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500 dark:text-ink-400">
                    Earnings from completed bookings are paid into this account.
                  </p>
                  <Link
                    to="/provider/add-account"
                    className="btn-outline inline-flex h-11 w-full shrink-0 items-center justify-center whitespace-nowrap sm:w-auto"
                  >
                    Manage account
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 dark:border-ink-700 dark:bg-ink-800/30">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lavender text-brand-600 dark:bg-brand-950 dark:text-brand-300"
                  >
                    <Landmark className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-ink-50">
                      No payout account connected
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-ink-400">
                      Connect a Nigerian bank account so your earnings from completed
                      bookings can be paid out.
                    </p>
                  </div>
                </div>
                <Link
                  to="/provider/add-account"
                  className="btn-primary inline-flex h-11 w-full items-center justify-center whitespace-nowrap sm:w-auto"
                >
                  Connect payout account
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <SettingsCardHeader
            icon={ShieldCheck}
            title="Security"
            description="Keep your account protected."
          />
          <div className="mt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500 dark:text-ink-400">
                Update the password you use to sign in.
              </p>
              <Button
                type="button"
                variant={showPasswordForm ? 'ghost' : 'outline'}
                icon={showPasswordForm ? undefined : KeyRound}
                onClick={showPasswordForm ? closePasswordForm : openPasswordForm}
                disabled={changePassword.isPending}
                className="w-full sm:w-auto"
              >
                {showPasswordForm ? 'Cancel' : 'Change Password'}
              </Button>
            </div>

            {showPasswordForm && (
              <form
                onSubmit={handlePasswordSubmit}
                aria-busy={changePassword.isPending}
                className="mt-5 space-y-4 border-t border-slate-100 pt-5 dark:border-ink-800"
              >
                {formError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-xl border border-danger-200 bg-danger-50/70 p-3.5 text-sm text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/10 dark:text-danger-200"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <p className="leading-5">{formError}</p>
                  </div>
                )}

                {passwordSuccess && (
                  <div
                    role="status"
                    className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <p className="leading-5">{passwordSuccess}</p>
                  </div>
                )}

                <PasswordField
                  id="current-password"
                  label="Current password"
                  value={currentPassword}
                  onChange={(value) => updatePasswordField('current', value)}
                  autoComplete="current-password"
                  error={fieldErrors.current}
                  visible={passwordVisibility.current}
                  onToggleVisibility={() => togglePasswordVisibility('current')}
                  disabled={changePassword.isPending}
                />

                <PasswordField
                  id="new-password"
                  label="New password"
                  value={newPassword}
                  onChange={(value) => updatePasswordField('next', value)}
                  autoComplete="new-password"
                  error={fieldErrors.next}
                  visible={passwordVisibility.next}
                  onToggleVisibility={() => togglePasswordVisibility('next')}
                  disabled={changePassword.isPending}
                />

                {newPassword && passwordStrength && (
                  <div className="space-y-1.5" aria-live="polite">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-medium text-slate-500 dark:text-ink-400">
                        Password strength
                      </span>
                      <span className={cn('font-semibold', passwordStrength.textClass)}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      {[1, 2, 3].map((bar) => (
                        <span
                          key={bar}
                          aria-hidden="true"
                          className={cn(
                            'h-1.5 flex-1 rounded-full transition-colors',
                            bar <= passwordStrength.filled
                              ? passwordStrength.barClass
                              : 'bg-slate-200 dark:bg-ink-700'
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] leading-4 text-slate-500 dark:text-ink-400">
                      Mix upper and lower case letters, numbers, and symbols for a stronger
                      password.
                    </p>
                  </div>
                )}

                <PasswordField
                  id="confirm-password"
                  label="Confirm new password"
                  value={confirmPassword}
                  onChange={(value) => updatePasswordField('confirm', value)}
                  autoComplete="new-password"
                  error={fieldErrors.confirm}
                  visible={passwordVisibility.confirm}
                  onToggleVisibility={() => togglePasswordVisibility('confirm')}
                  disabled={changePassword.isPending}
                />

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 dark:border-ink-800 sm:flex-row sm:items-center sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closePasswordForm}
                    disabled={changePassword.isPending}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    icon={KeyRound}
                    loading={changePassword.isPending}
                    className="w-full sm:w-auto"
                  >
                    {changePassword.isPending ? 'Updating…' : 'Update password'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
