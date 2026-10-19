import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AppContext';
import type { UserRole } from '@/data/mockData';
import { Logo } from '@/components/shared';
import { Button, cn } from '@/components/ui';

type AccountRole = 'customer' | 'provider';

type RoleConfig = {
  id: UserRole;
  title: string;
  subtitle: string;
  icon: typeof User;
  benefits: { icon: typeof Star; text: string }[];
  cta: string;
  redirect: string;
};

const roleConfigs: Record<
  'customer' | 'provider',
  RoleConfig
> = {
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
//  • Mobile: compact brand header + full-width form card

function AuthShell({
  title,
  subtitle,
  children,
  benefits,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  benefits: { icon: typeof Star; text: string }[];
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-ink-950 lg:grid lg:grid-cols-2">
      {/* ── Left brand panel ── */}
      <aside className="relative hidden overflow-hidden bg-brand-600 lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Decorative shapes */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-700/70 blur-3xl" />
          <div className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-brand-800/50 blur-3xl" />
          <div className="absolute right-10 top-1/3 h-56 w-56 rounded-full bg-brand-400/25 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:28px_28px]" />
        </div>

        {/* White logo */}
        <Link
          to="/"
          className="relative z-10 flex items-center gap-3"
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
        <div className="relative z-10">
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
            className="max-w-lg text-3xl font-bold leading-tight text-white xl:text-4xl"
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
            Join the marketplace where ABUAD students find,
            book, and pay for professional services with confidence.
          </motion.p>

          <ul className="mt-8 space-y-3.5">
            {benefits.map((benefit, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.22 + i * 0.08,
                  duration: 0.4,
                }}
                className="flex items-center gap-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                </span>

                <span className="text-sm font-medium text-white/90">
                  {benefit.text}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-brand-200">
          Servicely — the ABUAD campus marketplace
        </p>
      </aside>

      {/* ── Right form panel ── */}
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-8 lg:min-h-0 lg:py-12">
        <div className="w-full max-w-md">
          {/* Compact mobile brand header */}
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Logo />

            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-sm">
              <Camera className="h-4 w-4 text-white" />
            </span>
          </div>

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="card p-6 sm:p-8"
          >
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-ink-50">
              {title}
            </h1>

            <p className="mt-1.5 text-sm text-slate-500 dark:text-ink-400">
              {subtitle}
            </p>

            <div className="mt-7">{children}</div>

            {footer && <div className="mt-7">{footer}</div>}
          </motion.section>
        </div>
      </main>
    </div>
  );
}

// ─── Field Primitives ────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-danger-600 dark:text-danger-400"
    >
      <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
      <span>{message}</span>
    </p>
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

      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 dark:text-ink-500" />

        <input
          id={id}
          aria-invalid={error ? true : undefined}
          className={cn(
            'input h-11 text-base sm:text-sm',
            rightAdornment ? 'pl-11 pr-12' : 'pl-11 pr-4',
            error &&
              'border-danger-300 focus:border-danger-500 focus:ring-danger-500/10 dark:border-danger-500/40',
            className
          )}
          {...props}
        />

        {rightAdornment}
      </div>

      <FieldError message={error} />

      {hint && (
        <p className="mt-1.5 text-xs text-slate-400 dark:text-ink-500">
          {hint}
        </p>
      )}
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

      <div className="relative">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 dark:text-ink-500" />

        <input
          id={id}
          type={show ? 'text' : 'password'}
          className={cn(
            'input h-11 pl-11 pr-12 text-base sm:text-sm',
            error &&
              'border-danger-300 focus:border-danger-500 focus:ring-danger-500/10 dark:border-danger-500/40'
          )}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          required={required}
          minLength={required ? 6 : undefined}
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-ink-200"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? (
            <EyeOff className="h-[18px] w-[18px]" />
          ) : (
            <Eye className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>

      <FieldError message={error} />

      {hint && (
        <p className="mt-1.5 text-xs text-slate-400 dark:text-ink-500">
          {hint}
        </p>
      )}
    </div>
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
        'group relative flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-200',
        selected
          ? 'border-brand-500 bg-white shadow-soft ring-4 ring-brand-500/10 dark:bg-ink-900'
          : 'border-slate-200 bg-white hover:border-brand-300 hover:shadow-card-hover dark:border-ink-700 dark:bg-ink-900 dark:hover:border-ink-600'
      )}
    >
      <span
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors',
          selected
            ? 'bg-brand-600 text-white'
            : 'bg-lavender text-brand-600 dark:bg-brand-950 dark:text-brand-300'
        )}
      >
        <Icon className="h-5 w-5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-slate-900 dark:text-ink-50">
          {title}
        </span>

        <span className="mt-1 block text-sm leading-5 text-slate-500 dark:text-ink-400">
          {desc}
        </span>
      </span>

      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          selected
            ? 'border-brand-600 bg-brand-600 text-white'
            : 'border-slate-300 dark:border-ink-600'
        )}
      >
        {selected && <CheckCircle2 className="h-3 w-3" />}
      </span>
    </button>
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
    icon: typeof User;
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
        <legend className="sr-only">Choose your account type</legend>

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isProvider = role === 'provider';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');

    if (!gender) {
      setError('Please select your gender.');
      return;
    }

    if (phoneNumber.length !== 10) {
      setError(
        'Please enter a valid 10-digit Nigerian phone number.'
      );
      return;
    }

    if (password.length < 6) {
      setError(
        'Password must be at least 6 characters.'
      );
      return;
    }

    try {
      setLoading(true);

      // Create the account
      await signup(
        name.trim(),
        matricNo.trim(),
        email.trim(),
        phoneNumber.trim(),
        gender,
        password,
        role
      );

      // IMPORTANT:
      // Signup does NOT log the user in.
      // Redirect to the correct login page based on role.

      if (role === 'customer') {
        navigate('/login/customer');

        return;
      }

      if (role === 'provider') {
        navigate('/login/provider');
        return;
      }
    } catch (error: any) {
      setError(
        error?.message ||
          'Unable to create your account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Inline field errors — same validation messages as before,
   * rendered directly below the field they belong to.
   */
  const genderError =
    error === 'Please select your gender.' ? error : undefined;
  const phoneError =
    error === 'Please enter a valid 10-digit Nigerian phone number.'
      ? error
      : undefined;
  const passwordError =
    error === 'Password must be at least 6 characters.'
      ? error
      : undefined;
  const bannerError =
    !genderError && !phoneError && !passwordError && error
      ? error
      : undefined;

  return (
    <AuthShell
      title={
        isProvider
          ? 'Become a Provider'
          : 'Create your account'
      }
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
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
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
              'flex h-9 w-9 items-center justify-center rounded-lg',
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

          <div>
            <p className="text-xs text-slate-500 dark:text-ink-400">
              Creating account as
            </p>

            <p className="text-sm font-semibold capitalize text-slate-900 dark:text-ink-50">
              {isProvider
                ? 'Service Provider'
                : 'Customer'}
            </p>
          </div>

          <Link
            to="/signup"
            className="ml-auto text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            Change
          </Link>
        </motion.div>

        {/* Error message (server / unmapped errors) */}
        <AnimatePresence>
          {bannerError && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
                y: -5,
              }}
              animate={{
                opacity: 1,
                height: 'auto',
                y: 0,
              }}
              exit={{
                opacity: 0,
                height: 0,
                y: -5,
              }}
              role="alert"
              className="overflow-hidden"
            >
              <div className="flex items-start gap-2.5 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700 dark:border-danger-500/25 dark:bg-danger-500/10 dark:text-danger-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{bannerError}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full Name */}
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

        {/* Matric Number + Gender */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="signup-matric"
            label="Matric Number"
            icon={GraduationCap}
            className="uppercase"
            placeholder="e.g. EU/20/1234"
            value={matricNo}
            onChange={(e) =>
              setMatricNo(e.target.value.toUpperCase())
            }
            required
          />

          {/* Gender */}
          <div>
            <label htmlFor="signup-gender" className="label">
              Gender
            </label>

            <div className="relative">
              <Users className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 dark:text-ink-500" />

              <select
                id="signup-gender"
                value={gender}
                onChange={(e) =>
                  setGender(
                    e.target.value as
                    | 'male'
                    | 'female'
                    | ''
                  )
                }
                required
                aria-invalid={genderError ? true : undefined}
                className={cn(
                  'input h-11 appearance-none pl-11 pr-10 text-base sm:text-sm',
                  genderError &&
                    'border-danger-300 focus:border-danger-500 focus:ring-danger-500/10 dark:border-danger-500/40'
                )}
              >
                <option value="">
                  Select gender
                </option>
                <option value="male">Male</option>
                <option value="female">
                  Female
                </option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-ink-500" />
            </div>

            <FieldError message={genderError} />
          </div>
        </div>

        {/* Email + Phone */}
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

          {/* Phone */}
          <div>
            <label htmlFor="signup-phone" className="label">
              Phone Number
            </label>

            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 dark:text-ink-500" />

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
                id="signup-phone"
                type="tel"
                className={cn(
                  'input h-11 pl-[5.75rem] pr-4 text-base sm:text-sm',
                  phoneError &&
                    'border-danger-300 focus:border-danger-500 focus:ring-danger-500/10 dark:border-danger-500/40'
                )}
                placeholder="8012345678"
                value={phoneNumber}
                onChange={(e) =>
                  setPhoneNumber(
                    e.target.value
                      .replace(/\D/g, '')
                      .slice(0, 10)
                  )
                }
                autoComplete="tel"
                inputMode="numeric"
                aria-invalid={phoneError ? true : undefined}
                required
              />
            </div>

            <FieldError message={phoneError} />
          </div>
        </div>

        {/* Password */}
        <PasswordField
          id="signup-password"
          label="Password"
          value={password}
          onValueChange={setPassword}
          placeholder="Create a password"
          autoComplete="new-password"
          error={passwordError}
          hint="Use at least 6 characters."
        />

        {/* Provider notice */}
        {isProvider && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-start gap-3 rounded-xl border border-accent-200 bg-accent-50 p-3.5 text-xs leading-5 text-accent-700 dark:border-accent-900/50 dark:bg-accent-950/30 dark:text-accent-400"
          >
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />

            <span>
              After creating your account, you'll
              complete your provider profile and submit
              it for verification. Your services will
              only become bookable after approval.
            </span>
          </motion.div>
        )}

        {/* Terms */}
        <p className="text-xs leading-5 text-slate-400 dark:text-ink-500">
          By creating an account, you agree to use
          Servicely responsibly and provide accurate
          information.
        </p>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          loading={loading}
          icon={ArrowRight}
          className="w-full"
        >
          {loading
            ? 'Creating account...'
            : isProvider
              ? 'Continue to Onboarding'
              : 'Create Account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-ink-400">
        Already have an account?{' '}
        <Link
          to={
            isProvider
              ? '/login/provider'
              : '/login/customer'
          }
          className="font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          Login
        </Link>
      </p>
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
    icon: typeof User;
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
        <legend className="sr-only">Choose your account type</legend>

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

export function RoleLoginPage() {
  const { role: roleParam } = useParams();

  /*
   * IMPORTANT:
   * Public login currently supports only customer/provider.
   * Admin has a separate Admin model and will have a separate
   * authentication endpoint.
   */
  const role: AccountRole =
    roleParam === 'provider'
      ? 'provider'
      : 'customer';

  const config = roleConfigs[role];

  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError('');

    if (!email.trim() || !password) {
      setError(
        'Please enter your email and password.'
      );
      return;
    }

    try {
      setLoading(true);

      /*
       * role is now AccountRole:
       * "customer" | "provider"
       *
       * Therefore this matches the login function
       * from AppContext exactly.
       */
      await login(
        email.trim(),
        password,
        role
      );

      navigate(config.redirect);
    } catch (error: any) {
      setError(
        error?.message ||
        'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Inline field errors — same validation messages as before.
   */
  const credentialsError =
    error === 'Please enter your email and password.'
      ? error
      : undefined;
  const bannerError = credentialsError ? undefined : error || undefined;

  return (
    <AuthShell
      title={config.title}
      subtitle={config.subtitle}
      benefits={config.benefits}
      footer={
        <div className="flex flex-col items-center gap-3 text-sm sm:flex-row sm:justify-between">
          <Link
            to="/login"
            className="flex items-center gap-1 font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-ink-400 dark:hover:text-ink-50"
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
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* Role badge */}
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.97,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          className="flex items-center gap-3 rounded-xl border border-brand-100 bg-lavender p-3.5 dark:border-brand-900/60 dark:bg-brand-950/40"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <config.icon className="h-5 w-5" />
          </span>

          <div className="min-w-0">
            <p className="text-sm font-semibold capitalize text-slate-900 dark:text-ink-50">
              {role} Portal
            </p>

            <p className="text-xs text-slate-500 dark:text-ink-400">
              {config.cta}
            </p>
          </div>
        </motion.div>

        {/* Error (server errors) */}
        <AnimatePresence>
          {bannerError && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: 'auto',
              }}
              exit={{
                opacity: 0,
                height: 0,
              }}
              role="alert"
              className="overflow-hidden"
            >
              <div className="flex items-start gap-2.5 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700 dark:border-danger-500/25 dark:bg-danger-500/10 dark:text-danger-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{bannerError}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <TextField
          id="login-email"
          label="Email Address"
          icon={Mail}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          error={credentialsError}
          required
        />

        <PasswordField
          id="login-password"
          label="Password"
          value={password}
          onValueChange={setPassword}
          placeholder="Enter your password"
          autoComplete="current-password"
          error={credentialsError}
          labelAction={
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Forgot password?
            </Link>
          }
        />

        {/* Remember me */}
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-ink-400">
          <input
            type="checkbox"
            className="h-4 w-4 rounded accent-brand-600"
          />

          Remember me on this device
        </label>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          loading={loading}
          icon={ArrowRight}
          className="w-full"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </AuthShell>
  );
}

// ─── Forgot Password ────────────────────────────────────────────────────────

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  return (
    <AuthShell
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
      {sent ? (
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.97,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          aria-live="polite"
          className="text-center"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-950">
            <CheckCircle2 className="h-7 w-7 text-brand-600 dark:text-brand-300" />
          </div>

          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-ink-50">
            Check your email
          </h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-ink-400">
            We've sent a password reset link to
            your email address.
          </p>

          <Link
            to="/login"
            className="btn-primary mt-6 flex w-full items-center justify-center"
          >
            Back to Login
          </Link>
        </motion.div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <TextField
            id="forgot-email"
            label="Email Address"
            icon={Mail}
            type="email"
            placeholder="you@example.com"
            required
          />

          <Button
            type="submit"
            size="lg"
            icon={ArrowRight}
            className="w-full"
          >
            Send Reset Link
          </Button>
        </form>
      )}

      <Link
        to="/login"
        className="mt-6 flex items-center justify-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-ink-400 dark:hover:text-ink-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>
    </AuthShell>
  );
}
