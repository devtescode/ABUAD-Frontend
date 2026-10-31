import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import {
  User,
  Briefcase,
  ArrowRight,
  Mail,
  Lock,
  UserCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  ShoppingBag,
  TrendingUp,
  Wallet,
  Star,
  Calendar,
  GraduationCap,
  Users,
  Camera,
  AlertCircle,
  Phone,
  ChevronDown,
  ArrowLeft,
  ShieldCheck,
  Quote,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AppContext';
import type { UserRole } from '@/data/mockData';
import { Logo } from '@/components/shared';
import { Button, Card, cn } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';

type AccountRole = 'customer' | 'provider';

type Benefit = {
  icon: LucideIcon;
  text: string;
};

type RoleConfig = {
  id: UserRole;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  benefits: Benefit[];
  cta: string;
  redirect: string;
};

const roleConfigs: Record<'customer' | 'provider', RoleConfig> = {
  customer: {
    id: 'customer',
    title: 'Customer Login',
    subtitle: 'Book trusted service providers in minutes',
    icon: User,
    benefits: [
      {
        icon: ShoppingBag,
        text: 'Browse and book verified providers',
      },
      {
        icon: Wallet,
        text: 'Pay securely through the platform',
      },
      {
        icon: Star,
        text: 'Read real reviews from students',
      },
    ],
    cta: 'Sign in to browse',
    redirect: '/customer',
  },

  provider: {
    id: 'provider',
    title: 'Provider Login',
    subtitle: 'Manage your services and grow your business',
    icon: Briefcase,
    benefits: [
      {
        icon: Calendar,
        text: 'Receive and manage booking requests',
      },
      {
        icon: Wallet,
        text: 'Track earnings and request payouts',
      },
      {
        icon: TrendingUp,
        text: 'Build your reputation with reviews',
      },
    ],
    cta: 'Sign in to your studio',
    redirect: '/provider',
  },
};

// ─── Auth Shell ──────────────────────────────────────────────────────────────
// Premium split-screen layout:
//  • Desktop: brand-indigo marketing panel (left) + centered form card (right)
//  • Mobile / tablet: compact brand header + centered form card

function AuthShell({
  title,
  subtitle,
  eyebrow,
  children,
  benefits,
  footer,
  wide = false,
}: {
  title: string;
  subtitle: string;
  eyebrow?: string;
  children: React.ReactNode;
  benefits: Benefit[];
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  const panelWidth = wide ? 'max-w-lg' : 'max-w-md';

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] dark:bg-ink-950 lg:grid lg:grid-cols-2">
      {/* ── Left brand panel ── */}
      <aside className="relative hidden overflow-hidden bg-brand-700 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        {/* Gradient wash */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500 via-brand-700 to-brand-950"
          aria-hidden="true"
        />

        {/* Decorative shapes */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-brand-950/60 blur-3xl" />
          <div className="absolute right-10 top-1/3 h-56 w-56 rounded-full bg-brand-300/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:28px_28px]" />
        </div>

        <div className="no-scrollbar relative z-10 flex h-full flex-col justify-between gap-10 overflow-y-auto">
          {/* White logo */}
          <Link
            to="/"
            className="flex w-fit items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-4 focus-visible:ring-offset-brand-700"
            aria-label="Servicely home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-soft">
              <Camera className="h-5 w-5 text-brand-600" />
            </span>

            <span className="text-xl font-bold tracking-tight text-white">
              Servicely
            </span>
          </Link>

          {/* Marketing copy */}
          <div className="max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Built for ABUAD students
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.4 }}
              className="text-balance text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl"
            >
              Trusted services.
              <br />
              Right when you need them.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.4 }}
              className="mt-4 max-w-md text-sm leading-6 text-brand-100"
            >
              Join the marketplace where ABUAD students find, book, and pay for
              professional services with confidence.
            </motion.p>

            <ul className="mt-8 space-y-3">
              {benefits.map((benefit, i) => {
                const Icon = benefit.icon;

                return (
                  <motion.li
                    key={benefit.text}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.22 + i * 0.08,
                      duration: 0.4,
                    }}
                    className="flex items-center gap-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white">
                      <Icon className="h-4 w-4" />
                    </span>

                    <span className="text-sm font-medium text-white/90">
                      {benefit.text}
                    </span>
                  </motion.li>
                );
              })}
            </ul>
          </div>

          {/* Social proof + trust */}
          <div className="space-y-5">
            <motion.figure
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.48, duration: 0.4 }}
              className="max-w-md rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm"
            >
              <Quote className="h-5 w-5 text-white/50" />

              <blockquote className="mt-2 text-sm leading-6 text-white/90">
                “Found a photographer for my matriculation shoot in minutes.
                Clear pricing, safe payment, no stress.”
              </blockquote>

              <figcaption className="mt-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
                  AO
                </span>

                <span>
                  <span className="block text-sm font-semibold text-white">
                    Adaeze O.
                  </span>
                  <span className="block text-xs text-brand-200">
                    300L · Law
                  </span>
                </span>
              </figcaption>
            </motion.figure>

            <p className="flex items-center gap-2 text-xs text-brand-200">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              Official ABUAD campus marketplace · Secure Paystack payments
            </p>
          </div>
        </div>
      </aside>

      {/* ── Right form panel ── */}
      <main className="relative flex min-h-screen flex-col px-4 pb-8 pt-5 sm:px-8 lg:px-10 xl:px-14">
        {/* Top bar */}
        <div
          className={cn(
            'mx-auto flex w-full items-center justify-between',
            panelWidth
          )}
        >
          {/* Compact mobile brand header */}
          <div className="lg:hidden">
            <Logo />
          </div>

          <Link
            to="/"
            className="hidden items-center gap-1.5 rounded-lg text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 dark:text-ink-400 dark:hover:text-ink-50 lg:inline-flex"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-8 sm:py-10">
          <div className={cn('w-full', panelWidth)}>
            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <Card className="relative overflow-hidden border-slate-200/80 p-6 shadow-[0_24px_70px_-40px_rgba(30,26,77,0.45)] dark:border-ink-800 sm:p-8">
                {/* Accent line */}
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-brand-400 to-sky-400"
                  aria-hidden="true"
                />

                {eyebrow && (
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-400">
                    {eyebrow}
                  </p>
                )}

                <h1 className="text-balance text-2xl font-bold tracking-tight text-slate-900 dark:text-ink-50">
                  {title}
                </h1>

                <p className="mt-1.5 text-sm leading-6 text-slate-500 dark:text-ink-400">
                  {subtitle}
                </p>

                <div className="mt-7">{children}</div>

                {footer && (
                  <div className="mt-7">
                    <div className="border-t border-slate-100 pt-5 dark:border-ink-800">
                      {footer}
                    </div>
                  </div>
                )}
              </Card>
            </motion.section>
          </div>
        </div>

        <p className="mx-auto max-w-md text-center text-[11px] leading-5 text-slate-400 dark:text-ink-500">
          © {new Date().getFullYear()} Servicely · Built for ABUAD students ·
          Secured by Paystack
        </p>
      </main>
    </div>
  );
}

// ─── Field Primitives ────────────────────────────────────────────────────────

const fieldErrorClass =
  'border-danger-500/60 focus:border-danger-500 focus:ring-danger-500/10 dark:border-danger-500/40';

function FieldError({ id, message }: { id?: string; message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p
          id={id}
          role="alert"
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -2 }}
          transition={{ duration: 0.15 }}
          className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-danger-600 dark:text-danger-200"
        >
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
          <span>{message}</span>
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function TextField({
  id,
  label,
  icon: Icon,
  error,
  hint,
  rightAdornment,
  className,
  ...props
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  error?: string;
  hint?: React.ReactNode;
  rightAdornment?: React.ReactNode;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>

      <div className="group relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-600 dark:text-ink-500 dark:group-focus-within:text-brand-400" />

        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          className={cn(
            'input h-11 pl-11 text-base sm:text-sm',
            rightAdornment ? 'pr-12' : 'pr-4',
            error && fieldErrorClass,
            className
          )}
          {...props}
        />

        {rightAdornment}
      </div>

      <FieldError id={`${id}-error`} message={error} />

      {hint && (
        <p
          id={`${id}-hint`}
          className="mt-1.5 text-xs text-slate-400 dark:text-ink-500"
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function passwordScore(value: string) {
  if (!value) return 0;

  let score = 1;

  if (value.length >= 6) score += 1;
  if (value.length >= 10) score += 1;
  if (
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value)
  ) {
    score += 1;
  }

  return Math.min(score, 4);
}

const passwordStrength = [
  {
    label: 'Too short',
    bar: 'bg-danger-500',
    text: 'text-danger-600 dark:text-danger-200',
  },
  {
    label: 'Weak',
    bar: 'bg-warning-500',
    text: 'text-warning-700 dark:text-warning-100',
  },
  {
    label: 'Good',
    bar: 'bg-sky-500',
    text: 'text-sky-600 dark:text-sky-400',
  },
  {
    label: 'Strong',
    bar: 'bg-success-500',
    text: 'text-success-700 dark:text-success-200',
  },
] as const;

function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;

  const score = passwordScore(value);
  const meta = passwordStrength[Math.max(score - 1, 0)];

  return (
    <div className="mt-2">
      <div className="flex gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              i < score ? meta.bar : 'bg-slate-200 dark:bg-ink-700'
            )}
          />
        ))}
      </div>

      <p
        className={cn('mt-1.5 text-xs font-medium', meta.text)}
        aria-live="polite"
      >
        Password strength: {meta.label}
      </p>
    </div>
  );
}

function PasswordField({
  id,
  label = 'Password',
  value,
  onValueChange,
  placeholder,
  autoComplete,
  error,
  hint,
  labelAction,
  required = true,
  showStrength = false,
}: {
  id: string;
  label?: string;
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  hint?: React.ReactNode;
  labelAction?: React.ReactNode;
  required?: boolean;
  showStrength?: boolean;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={id} className="label mb-0">
          {label}
        </label>

        {labelAction}
      </div>

      <div className="group relative">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-600 dark:text-ink-500 dark:group-focus-within:text-brand-400" />

        <input
          id={id}
          type={show ? 'text' : 'password'}
          className={cn(
            'input h-11 pl-11 pr-12 text-base sm:text-sm',
            error && fieldErrorClass
          )}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          required={required}
          minLength={required ? 6 : undefined}
        />

        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 dark:hover:bg-ink-700 dark:hover:text-ink-200"
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
        >
          {show ? (
            <EyeOff className="h-[18px] w-[18px]" />
          ) : (
            <Eye className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>

      {showStrength && <PasswordStrength value={value} />}

      <FieldError id={`${id}-error`} message={error} />

      {hint && (
        <p
          id={`${id}-hint`}
          className="mt-1.5 text-xs text-slate-400 dark:text-ink-500"
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function SelectField({
  id,
  label,
  icon: Icon,
  error,
  className,
  children,
  ...props
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  error?: string;
  className?: string;
  children: React.ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>

      <div className="group relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-600 dark:text-ink-500 dark:group-focus-within:text-brand-400" />

        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            'input h-11 appearance-none pl-11 pr-10 text-base sm:text-sm',
            error && fieldErrorClass,
            className
          )}
          {...props}
        >
          {children}
        </select>

        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-600 dark:text-ink-500 dark:group-focus-within:text-brand-400" />
      </div>

      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function PhoneField({
  id,
  label = 'Phone Number',
  value,
  onValueChange,
  error,
}: {
  id: string;
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>

      <div className="group relative">
        <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-600 dark:text-ink-500 dark:group-focus-within:text-brand-400" />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-10 top-1/2 h-5 w-px -translate-y-1/2 bg-slate-200 dark:bg-ink-700"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[3.25rem] top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 dark:text-ink-400"
        >
          +234
        </div>

        <input
          id={id}
          type="tel"
          className={cn(
            'input h-11 pl-[5.75rem] pr-4 text-base sm:text-sm',
            error && fieldErrorClass
          )}
          placeholder="8012345678"
          value={value}
          onChange={(e) =>
            onValueChange(e.target.value.replace(/\D/g, '').slice(0, 10))
          }
          autoComplete="tel"
          inputMode="numeric"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          required
        />
      </div>

      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function FormBanner({ message }: { message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -4 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          role="alert"
          className="overflow-hidden"
        >
          <div className="flex items-start gap-2.5 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700 dark:border-danger-500/25 dark:bg-danger-500/10 dark:text-danger-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Premium role chooser card ──────────────────────────────────────────────

function RoleChoiceCard({
  selected,
  icon: Icon,
  title,
  desc,
  onSelect,
}: {
  selected: boolean;
  icon: LucideIcon;
  title: string;
  desc: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'group relative flex w-full items-start gap-4 overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-ink-950 sm:p-5',
        selected
          ? 'border-brand-500 bg-white shadow-soft ring-4 ring-brand-500/10 dark:bg-ink-900'
          : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card-hover dark:border-ink-700 dark:bg-ink-900 dark:hover:border-ink-600'
      )}
    >
      <span
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors',
          selected
            ? 'bg-brand-600 text-white shadow-soft'
            : 'bg-lavender text-brand-600 dark:bg-brand-950 dark:text-brand-300'
        )}
      >
        <Icon className="h-5 w-5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-900 dark:text-ink-50">
            {title}
          </span>

          {selected && (
            <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
              Selected
            </span>
          )}
        </span>

        <span className="mt-1 block text-sm leading-5 text-slate-500 dark:text-ink-400">
          {desc}
        </span>

        {selected && (
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
            Tap again to continue
            <ArrowRight className="h-3 w-3" />
          </span>
        )}
      </span>

      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          selected
            ? 'border-brand-600 bg-brand-600 text-white'
            : 'border-slate-300 group-hover:border-brand-300 dark:border-ink-600'
        )}
      >
        {selected && <CheckCircle2 className="h-3 w-3" />}
      </span>
    </button>
  );
}

function FormSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="min-w-0 space-y-4">
      <legend className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-ink-500">
        {label}
      </legend>

      {children}
    </fieldset>
  );
}

// ─── Signup Role Selection ───────────────────────────────────────────────────

export function SignupRolePage() {
  const [selected, setSelected] = useState<AccountRole | null>(null);
  const navigate = useNavigate();

  const roles: {
    id: AccountRole;
    title: string;
    desc: string;
    icon: LucideIcon;
  }[] = [
    {
      id: 'customer',
      title: 'Customer',
      desc: 'Find and book trusted service providers for your events and projects.',
      icon: User,
    },
    {
      id: 'provider',
      title: 'Service Provider',
      desc: 'Offer your services, receive bookings, and grow your client base.',
      icon: Briefcase,
    },
  ];

  return (
    <AuthShell
      eyebrow="Step 1 of 2"
      title="Create your account"
      subtitle="How do you want to use the platform?"
      benefits={[
        {
          icon: ShoppingBag,
          text: 'Browse and book verified providers',
        },
        {
          icon: Wallet,
          text: 'Pay securely through the platform',
        },
        {
          icon: Star,
          text: 'Read real reviews from students',
        },
      ]}
    >
      <fieldset>
        <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-ink-500">
          Choose your account type
        </legend>

        <div className="space-y-3">
          {roles.map((role, i) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
            >
              <RoleChoiceCard
                selected={selected === role.id}
                icon={role.icon}
                title={role.title}
                desc={role.desc}
                onSelect={() =>
                  selected === role.id
                    ? navigate(`/signup/${role.id}`)
                    : setSelected(role.id)
                }
              />
            </motion.div>
          ))}
        </div>
      </fieldset>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <Button
              size="lg"
              icon={ArrowRight}
              className="mt-4 w-full"
              onClick={() => navigate(`/signup/${selected}`)}
            >
              Continue as{' '}
              {selected === 'customer' ? 'Customer' : 'Service Provider'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-ink-400">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          Login
        </Link>
      </p>
    </AuthShell>
  );
}

// ─── Signup Page ─────────────────────────────────────────────────────────────

type SignupFieldErrors = {
  gender?: string;
  phoneNumber?: string;
  password?: string;
};

type SignupPayload = {
  name: string;
  matricNo: string;
  email: string;
  phoneNumber: string;
  gender: 'male' | 'female';
  password: string;
  role: AccountRole;
};

export function SignupPage() {
  const { role: roleParam } = useParams();

  const role: AccountRole =
    roleParam === 'provider' ? 'provider' : 'customer';

  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [matricNo, setMatricNo] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState<
    'male' | 'female' | ''
  >('');
  const [password, setPassword] = useState('');

  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});
  const [bannerError, setBannerError] = useState('');

  const isProvider = role === 'provider';

  const signupMutation = useMutation({
    mutationFn: (payload: SignupPayload) =>
      signup(
        payload.name,
        payload.matricNo,
        payload.email,
        payload.phoneNumber,
        payload.gender,
        payload.password,
        payload.role
      ),
  });

  const clearFieldError = (key: keyof SignupFieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;

      return { ...prev, [key]: undefined };
    });

    if (bannerError) setBannerError('');
  };

  /*
   * Inline field errors — same validation rules and messages as before,
   * rendered directly below the field they belong to.
   */
  const validate = (): SignupFieldErrors => {
    const next: SignupFieldErrors = {};

    if (!gender) {
      next.gender = 'Please select your gender.';
    }

    if (phoneNumber.length !== 10) {
      next.phoneNumber =
        'Please enter a valid 10-digit Nigerian phone number.';
    }

    if (password.length < 6) {
      next.password = 'Password must be at least 6 characters.';
    }

    return next;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setBannerError('');

    const nextErrors = validate();
    setFieldErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    try {
      await signupMutation.mutateAsync({
        name: name.trim(),
        matricNo: matricNo.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        gender: gender as 'male' | 'female',
        password,
        role,
      });

      /*
       * IMPORTANT:
       * Signup does NOT log the user in.
       * Redirect to the correct login page based on role.
       */

      if (role === 'customer') {
        navigate('/login/customer');

        return;
      }

      if (role === 'provider') {
        navigate('/login/provider');
        return;
      }
    } catch (error: any) {
      setBannerError(
        error?.message ||
          'Unable to create your account. Please try again.'
      );
    }
  };

  return (
    <AuthShell
      wide
      eyebrow="Step 2 of 2"
      title={isProvider ? 'Become a Provider' : 'Create your account'}
      subtitle={
        isProvider
          ? 'Start offering your services on Servicely'
          : 'Join Servicely as a customer'
      }
      benefits={
        isProvider
          ? [
              {
                icon: Calendar,
                text: 'Receive and manage booking requests',
              },
              {
                icon: Wallet,
                text: 'Track earnings and request payouts',
              },
              {
                icon: TrendingUp,
                text: 'Build your reputation with reviews',
              },
            ]
          : [
              {
                icon: ShoppingBag,
                text: 'Browse and book verified providers',
              },
              {
                icon: Wallet,
                text: 'Pay securely through the platform',
              },
              {
                icon: Star,
                text: 'Read real reviews from students',
              },
            ]
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account type indicator */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'flex items-center gap-3 rounded-xl border p-3',
            isProvider
              ? 'border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/30'
              : 'border-brand-200 bg-lavender dark:border-brand-900 dark:bg-brand-950/40'
          )}
        >
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              isProvider
                ? 'bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-400'
                : 'bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-300'
            )}
          >
            {isProvider ? (
              <Briefcase className="h-4 w-4" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-ink-400">
              Creating account as
            </p>

            <p className="truncate text-sm font-semibold capitalize text-slate-900 dark:text-ink-50">
              {isProvider ? 'Service Provider' : 'Customer'}
            </p>
          </div>

          <Link
            to="/signup"
            className="ml-auto shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 dark:text-brand-400 dark:hover:bg-brand-950 dark:hover:text-brand-300"
          >
            Change
          </Link>
        </motion.div>

        {/* Error message (server / unmapped errors) */}
        <FormBanner message={bannerError || undefined} />

        {/* Personal details */}
        <FormSection label="Personal details">
          <TextField
            id="signup-name"
            label="Full Name"
            icon={UserCircle}
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              id="signup-matric"
              label="Matric Number"
              icon={GraduationCap}
              className="uppercase placeholder:normal-case"
              placeholder="e.g. EU/20/1234"
              value={matricNo}
              onChange={(e) => setMatricNo(e.target.value.toUpperCase())}
              required
            />

            <SelectField
              id="signup-gender"
              label="Gender"
              icon={Users}
              value={gender}
              onChange={(e) => {
                setGender(e.target.value as 'male' | 'female' | '');
                clearFieldError('gender');
              }}
              error={fieldErrors.gender}
              required
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </SelectField>
          </div>
        </FormSection>

        {/* Contact details */}
        <FormSection label="Contact details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              id="signup-email"
              label="Email Address"
              icon={Mail}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <PhoneField
              id="signup-phone"
              value={phoneNumber}
              onValueChange={(value) => {
                setPhoneNumber(value);
                clearFieldError('phoneNumber');
              }}
              error={fieldErrors.phoneNumber}
            />
          </div>
        </FormSection>

        {/* Security */}
        <FormSection label="Account security">
          <PasswordField
            id="signup-password"
            label="Password"
            value={password}
            onValueChange={(value) => {
              setPassword(value);
              clearFieldError('password');
            }}
            placeholder="Create a password"
            autoComplete="new-password"
            error={fieldErrors.password}
            hint="Use at least 6 characters."
            showStrength
          />

          {/* Provider notice */}
          {isProvider && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-start gap-3 rounded-xl border border-accent-200 bg-accent-50 p-3.5 text-xs leading-5 text-accent-700 dark:border-accent-900/50 dark:bg-accent-900/20 dark:text-accent-400"
            >
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />

              <span>
                After creating your account, you'll complete your provider
                profile and submit it for verification. Your services will only
                become bookable after approval.
              </span>
            </motion.div>
          )}
        </FormSection>

        {/* Terms */}
        <p className="text-xs leading-5 text-slate-400 dark:text-ink-500">
          By creating an account, you agree to use Servicely responsibly and
          provide accurate information.
        </p>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          loading={signupMutation.isPending}
          icon={ArrowRight}
          className="w-full"
        >
          {signupMutation.isPending
            ? 'Creating account...'
            : isProvider
              ? 'Continue to Onboarding'
              : 'Create Account'}
        </Button>

        <p className="text-center text-sm text-slate-500 dark:text-ink-400">
          Already have an account?{' '}
          <Link
            to={isProvider ? '/login/provider' : '/login/customer'}
            className="font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            Login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

// ─── Login Hub ───────────────────────────────────────────────────────────────

export function LoginPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<AccountRole | null>(null);

  const roles: {
    id: AccountRole;
    title: string;
    desc: string;
    icon: LucideIcon;
    path: string;
  }[] = [
    {
      id: 'customer',
      title: 'Customer',
      desc: 'Find and book trusted service providers.',
      icon: User,
      path: '/login/customer',
    },
    {
      id: 'provider',
      title: 'Service Provider',
      desc: 'Offer services and receive bookings.',
      icon: Briefcase,
      path: '/login/provider',
    },
  ];

  return (
    <AuthShell
      eyebrow="Account access"
      title="Welcome back"
      subtitle="Choose your account type to continue"
      benefits={[
        {
          icon: ShoppingBag,
          text: 'Verified providers only',
        },
        {
          icon: Wallet,
          text: 'Secure in-platform payments',
        },
        {
          icon: Star,
          text: 'Real reviews from real students',
        },
      ]}
    >
      <fieldset>
        <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-ink-500">
          Choose your account type
        </legend>

        <div className="space-y-3">
          {roles.map((role, i) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
            >
              <RoleChoiceCard
                selected={selected === role.id}
                icon={role.icon}
                title={role.title}
                desc={role.desc}
                onSelect={() =>
                  selected === role.id
                    ? navigate(role.path)
                    : setSelected(role.id)
                }
              />
            </motion.div>
          ))}
        </div>
      </fieldset>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <Button
              size="lg"
              icon={ArrowRight}
              className="mt-4 w-full"
              onClick={() =>
                navigate(
                  selected === 'customer'
                    ? '/login/customer'
                    : '/login/provider'
                )
              }
            >
              Continue as{' '}
              {selected === 'customer' ? 'Customer' : 'Service Provider'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-ink-400">
        Don't have an account?{' '}
        <Link
          to="/signup"
          className="font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}

// ─── Role-Specific Login Pages ──────────────────────────────────────────────

type LoginPayload = {
  email: string;
  password: string;
  role: AccountRole;
};

export function RoleLoginPage() {
  const { role: roleParam } = useParams();

  /*
   * IMPORTANT:
   * Public login currently supports only customer/provider.
   * Admin has a separate Admin model and will have a separate
   * authentication endpoint.
   */
  const role: AccountRole =
    roleParam === 'provider' ? 'provider' : 'customer';

  const config = roleConfigs[role];

  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showCredentialsError, setShowCredentialsError] = useState(false);
  const [bannerError, setBannerError] = useState('');

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) =>
      login(payload.email, payload.password, payload.role),
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setBannerError('');

    if (!email.trim() || !password) {
      setShowCredentialsError(true);
      return;
    }

    setShowCredentialsError(false);

    try {
      /*
       * role is now AccountRole:
       * "customer" | "provider"
       *
       * Therefore this matches the login function
       * from AppContext exactly.
       */
      await loginMutation.mutateAsync({
        email: email.trim(),
        password,
        role,
      });

      navigate(config.redirect);
    } catch (error: any) {
      setBannerError(
        error?.message || 'Invalid email or password. Please try again.'
      );
    }
  };

  /*
   * Inline field errors — same validation message as before.
   */
  const credentialsError = showCredentialsError
    ? 'Please enter your email and password.'
    : undefined;

  const emailError =
    credentialsError && !email.trim() ? credentialsError : undefined;
  const passwordError =
    credentialsError && !password ? credentialsError : undefined;

  const RoleIcon = config.icon;

  return (
    <AuthShell
      title={config.title}
      subtitle={config.subtitle}
      benefits={config.benefits}
      footer={
        <div className="flex flex-col items-center gap-3 text-sm sm:flex-row sm:justify-between">
          <Link
            to="/login"
            className="flex items-center gap-1 font-medium text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 dark:text-ink-400 dark:hover:text-ink-50"
          >
            <ArrowLeft className="h-4 w-4" />
            All logins
          </Link>

          <Link
            to={`/signup/${role}`}
            className="font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            Create {role} account
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 rounded-xl border border-brand-100 bg-lavender p-3.5 dark:border-brand-900/60 dark:bg-brand-950/40"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <RoleIcon className="h-5 w-5" />
          </span>

          <div className="min-w-0">
            <p className="text-sm font-semibold capitalize text-slate-900 dark:text-ink-50">
              {role} Portal
            </p>

            <p className="truncate text-xs text-slate-500 dark:text-ink-400">
              {config.cta}
            </p>
          </div>
        </motion.div>

        {/* Error (server errors) */}
        <FormBanner message={bannerError || undefined} />

        <TextField
          id="login-email"
          label="Email Address"
          icon={Mail}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (showCredentialsError) setShowCredentialsError(false);
            if (bannerError) setBannerError('');
          }}
          autoComplete="email"
          error={emailError}
          required
        />

        <PasswordField
          id="login-password"
          label="Password"
          value={password}
          onValueChange={(value) => {
            setPassword(value);
            if (showCredentialsError) setShowCredentialsError(false);
            if (bannerError) setBannerError('');
          }}
          placeholder="Enter your password"
          autoComplete="current-password"
          error={passwordError}
          labelAction={
            <Link
              to="/forgot-password"
              className="rounded text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Forgot password?
            </Link>
          }
        />

        {/* Remember me */}
        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg text-sm text-slate-600 dark:text-ink-400">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 accent-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 dark:border-ink-600"
          />

          Remember me on this device
        </label>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          loading={loginMutation.isPending}
          icon={ArrowRight}
          className="w-full"
        >
          {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
        </Button>

        <p className="flex items-center justify-center gap-1.5 pt-1 text-[11px] font-medium text-slate-400 dark:text-ink-500">
          <ShieldCheck className="h-3.5 w-3.5" />
          Your details are encrypted and never shared.
        </p>
      </form>
    </AuthShell>
  );
}

// ─── Forgot Password ────────────────────────────────────────────────────────

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    },
    []
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setSending(true);

    // No reset-password endpoint exists yet — mirror the existing
    // local-only confirmation flow with a brief sending state.
    timerRef.current = window.setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 650);
  };

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset password"
      subtitle="Enter your email to receive a reset link"
      benefits={[
        {
          icon: ShoppingBag,
          text: 'Verified providers only',
        },
        {
          icon: Wallet,
          text: 'Secure in-platform payments',
        },
        {
          icon: Star,
          text: 'Real reviews from real students',
        },
      ]}
    >
      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            aria-live="polite"
            className="text-center"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-950">
              <CheckCircle2 className="h-7 w-7 text-brand-600 dark:text-brand-300" />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-ink-50">
              Check your email
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-ink-400">
              We've sent a password reset link to your email address.
            </p>

            {email.trim() && (
              <p className="mx-auto mt-3 w-fit max-w-full truncate rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300">
                {email.trim()}
              </p>
            )}

            <Link
              to="/login"
              className="btn-primary mt-6 flex w-full items-center justify-center"
            >
              Back to Login
            </Link>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
            onSubmit={handleSubmit}
          >
            <TextField
              id="forgot-email"
              label="Email Address"
              icon={Mail}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              hint="Use the email address linked to your account."
              required
            />

            <Button
              type="submit"
              size="lg"
              loading={sending}
              icon={ArrowRight}
              className="w-full"
            >
              {sending ? 'Sending link...' : 'Send Reset Link'}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      <Link
        to="/login"
        className="mt-6 flex items-center justify-center gap-1 rounded text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 dark:text-ink-400 dark:hover:text-ink-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>
    </AuthShell>
  );
}
