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
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  ShoppingBag,
  LayoutDashboard,
  Shield,
  TrendingUp,
  Wallet,
  Star,
  Calendar,
  Phone,
  GraduationCap,
  Users,
} from 'lucide-react';
import { useAuth } from '@/context/AppContext';
import type { UserRole } from '@/data/mockData';
import { Logo } from '@/components/shared';

type AccountRole = 'customer' | 'provider';

type RoleConfig = {
  id: UserRole;
  title: string;
  subtitle: string;
  icon: typeof User;
  accent: string;
  benefits: { icon: typeof Star; text: string }[];
  cta: string;
  redirect: string;
};

const roleConfigs: Record<
  'customer' | 'provider' | 'admin',
  RoleConfig
> = {
  customer: {
    id: 'customer',
    title: 'Customer Login',
    subtitle: 'Book trusted service providers in minutes',
    icon: User,
    accent: 'primary',
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
    accent: 'sky',
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

  admin: {
    id: 'admin',
    title: 'Admin Portal',
    subtitle: 'Manage and monitor the marketplace',
    icon: Shield,
    accent: 'ink',
    benefits: [
      {
        icon: ShieldCheck,
        text: 'Verify and approve providers',
      },
      {
        icon: LayoutDashboard,
        text: 'Monitor platform analytics',
      },
      {
        icon: CheckCircle2,
        text: 'Resolve disputes and manage reviews',
      },
    ],
    cta: 'Access admin dashboard',
    redirect: '/admin',
  },
};

// ─── Auth Shell ──────────────────────────────────────────────────────────────

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
    <div className="flex min-h-screen flex-col bg-ink-50 dark:bg-ink-950 lg:flex-row">
      {/* Left brand panel */}
      <div className="relative hidden flex-1 overflow-hidden bg-ink-900 dark:bg-ink-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-600/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>

            <span className="text-lg font-bold text-white">
              Servicely
            </span>
          </Link>
        </div>

        {/* Main content */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-ink-300"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary-400" />
            Built for ABUAD students
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="max-w-lg text-3xl font-bold leading-tight text-white"
          >
            Trusted services.
            <br />
            Right when you need them.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="mt-4 max-w-md text-sm leading-6 text-ink-400"
          >
            Join the marketplace where ABUAD students find,
            book, and pay for professional services with confidence.
          </motion.p>

          <div className="mt-8 space-y-3">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.2 + i * 0.08,
                  duration: 0.4,
                }}
                className="flex items-center gap-3 text-ink-300"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                  <benefit.icon className="h-4 w-4" />
                </div>

                <span className="text-sm">
                  {benefit.text}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-ink-600">
          © 2026 Servicely. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center p-5 sm:p-8 lg:p-12">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="lg:hidden">
            <Logo />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-8 lg:mt-0"
          >
            <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-50 sm:text-3xl">
              {title}
            </h1>

            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400 sm:text-base">
              {subtitle}
            </p>

            <div className="mt-7">
              {children}
            </div>

            {footer && (
              <div className="mt-6">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── Password Input ──────────────────────────────────────────────────────────

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Lock className="absolute left-3 top-3 h-5 w-5 text-ink-400" />

      <input
        type={show ? 'text' : 'password'}
        className="input pl-10 pr-11"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        minLength={6}
      />

      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-3 text-ink-400 transition-colors hover:text-ink-600 dark:hover:text-ink-200"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? (
          <EyeOff className="h-5 w-5" />
        ) : (
          <Eye className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}

// ─── Signup Role Selection ───────────────────────────────────────────────────

export function SignupRolePage() {
  const [hovered, setHovered] = useState<AccountRole | null>(null);
  const navigate = useNavigate();

  const roles: {
    id: AccountRole;
    title: string;
    desc: string;
    icon: typeof User;
    bg: string;
    iconBg: string;
  }[] = [
      {
        id: 'customer',
        title: 'Customer',
        desc: 'Find and book trusted service providers for your events and projects.',
        icon: User,
        bg: 'hover:border-primary-300 hover:bg-primary-50/50 dark:hover:border-primary-700 dark:hover:bg-primary-950/30',
        iconBg:
          'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400',
      },
      {
        id: 'provider',
        title: 'Service Provider',
        desc: 'Offer your services, receive bookings, and grow your client base.',
        icon: Briefcase,
        bg: 'hover:border-sky-300 hover:bg-sky-50/50 dark:hover:border-sky-700 dark:hover:bg-sky-950/30',
        iconBg:
          'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400',
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
      <div className="space-y-3">
        {roles.map((role, i) => (
          <motion.button
            key={role.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onHoverStart={() => setHovered(role.id)}
            onHoverEnd={() => setHovered(null)}
            onClick={() => navigate(`/signup/${role.id}`)}
            className={`group flex w-full items-center gap-4 rounded-2xl border border-ink-200 bg-white p-4 text-left shadow-sm transition-all dark:border-ink-700 dark:bg-ink-900 ${role.bg}`}
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${role.iconBg} transition-transform group-hover:scale-105`}
            >
              <role.icon className="h-5 w-5" />
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-ink-900 dark:text-ink-50">
                {role.title}
              </h3>

              <p className="mt-1 text-sm leading-5 text-ink-500 dark:text-ink-400">
                {role.desc}
              </p>
            </div>

            <motion.div
              animate={{
                x: hovered === role.id ? 4 : 0,
              }}
            >
              <ArrowRight className="h-4 w-4 text-ink-400 dark:text-ink-600" />
            </motion.div>
          </motion.button>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-ink-900 hover:text-primary-600 dark:text-ink-50"
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
      navigate('/provider/login');
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
          className={`flex items-center gap-3 rounded-xl border p-3 ${isProvider
              ? 'border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/30'
              : 'border-primary-200 bg-primary-50 dark:border-primary-900 dark:bg-primary-950/30'
            }`}
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${isProvider
                ? 'bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-400'
                : 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
              }`}
          >
            {isProvider ? (
              <Briefcase className="h-4 w-4" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>

          <div>
            <p className="text-xs text-ink-500 dark:text-ink-400">
              Creating account as
            </p>

            <p className="text-sm font-semibold capitalize text-ink-900 dark:text-ink-50">
              {isProvider
                ? 'Service Provider'
                : 'Customer'}
            </p>
          </div>

          <Link
            to="/signup"
            className="ml-auto text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            Change
          </Link>
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
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
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full Name */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
        >
          <label className="label">Full Name</label>

          <div className="relative">
            <UserCircle className="absolute left-3 top-3 h-5 w-5 text-ink-400" />

            <input
              className="input pl-10"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              autoComplete="name"
              required
            />
          </div>
        </motion.div>

        {/* Matric Number + Gender */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Matric Number */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="label">
              Matric Number
            </label>

            <div className="relative">
              <GraduationCap className="absolute left-3 top-3 h-5 w-5 text-ink-400" />

              <input
                className="input pl-10 uppercase"
                placeholder="e.g. EU/20/1234"
                value={matricNo}
                onChange={(e) =>
                  setMatricNo(
                    e.target.value.toUpperCase()
                  )
                }
                required
              />
            </div>
          </motion.div>

          {/* Gender */}
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="label">Gender</label>

            <div className="relative">
              <Users className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-ink-400" />

              <select
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
                className="input appearance-none pl-10 pr-4"
              >
                <option value="">
                  Select gender
                </option>
                <option value="male">Male</option>
                <option value="female">
                  Female
                </option>
              </select>
            </div>
          </motion.div>
        </div>

        {/* Email + Phone */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Email */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <label className="label">
              Email Address
            </label>

            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-ink-400" />

              <input
                type="email"
                className="input pl-10"
                placeholder="you@example.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                autoComplete="email"
                required
              />
            </div>
          </motion.div>

          {/* Phone */}
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <label className="label">
              Phone Number
            </label>

            <div className="flex">
              <div className="flex items-center rounded-l-lg border border-r-0 border-ink-200 bg-ink-50 px-3 text-sm font-medium text-ink-500 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-400">
                +234
              </div>

              <input
                type="tel"
                className="input min-w-0 flex-1 rounded-l-none"
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
                required
              />
            </div>
          </motion.div>
        </div>

        {/* Password */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="label">Password</label>

          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder="Create a password"
          />

          <p className="mt-1.5 text-xs text-ink-400">
            Use at least 6 characters.
          </p>
        </motion.div>

        {/* Provider notice */}
        {isProvider && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
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
        <p className="text-xs leading-5 text-ink-400 dark:text-ink-500">
          By creating an account, you agree to use
          Servicely responsibly and provide accurate
          information.
        </p>

        {/* Submit */}
        <motion.button
          type="submit"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          disabled={loading}
          className="btn-primary btn-lg flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          whileHover={{
            scale: loading ? 1 : 1.01,
          }}
          whileTap={{
            scale: loading ? 1 : 0.99,
          }}
        >
          {loading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
              />

              Creating account...
            </>
          ) : (
            <>
              {isProvider
                ? 'Continue to Onboarding'
                : 'Create Account'}

              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </motion.button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
        Already have an account?{' '}
        <Link
          to={
            isProvider
              ? '/login/provider'
              : '/login/customer'
          }
          className="font-semibold text-ink-900 hover:text-primary-600 dark:text-ink-50"
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
  const [hovered, setHovered] =
    useState<AccountRole | null>(null);

  const roles: {
    id: AccountRole;
    title: string;
    desc: string;
    icon: typeof User;
    iconBg: string;
    path: string;
  }[] = [
      {
        id: 'customer',
        title: 'Customer',
        desc: 'Find and book trusted service providers.',
        icon: User,
        iconBg:
          'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400',
        path: '/login/customer',
      },
      {
        id: 'provider',
        title: 'Service Provider',
        desc: 'Offer services and receive bookings.',
        icon: Briefcase,
        iconBg:
          'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400',
        path: '/login/provider',
      },
    ];

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Choose your account type to continue"
      benefits={[
        {
          icon: ShieldCheck,
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
      <div className="space-y-3">
        {roles.map((role, i) => (
          <motion.button
            key={role.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onHoverStart={() =>
              setHovered(role.id)
            }
            onHoverEnd={() => setHovered(null)}
            onClick={() => navigate(role.path)}
            className="group flex w-full items-center gap-4 rounded-2xl border border-ink-200 bg-white p-4 text-left shadow-sm transition-all hover:border-ink-300 hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-900 dark:hover:border-ink-600 dark:hover:bg-ink-800"
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${role.iconBg} transition-transform group-hover:scale-105`}
            >
              <role.icon className="h-5 w-5" />
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-ink-900 dark:text-ink-50">
                {role.title}
              </h3>

              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                {role.desc}
              </p>
            </div>

            <motion.div
              animate={{
                x:
                  hovered === role.id
                    ? 4
                    : 0,
              }}
            >
              <ArrowRight className="h-4 w-4 text-ink-400 dark:text-ink-600" />
            </motion.div>
          </motion.button>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
        Don't have an account?{' '}
        <Link
          to="/signup"
          className="font-semibold text-ink-900 hover:text-primary-600 dark:text-ink-50"
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

  return (
    <AuthShell
      title={config.title}
      subtitle={config.subtitle}
      benefits={config.benefits}
      footer={
        <div className="flex items-center justify-center gap-4 text-sm">
          <Link
            to="/login"
            className="flex items-center gap-1 font-medium text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-50"
          >
            <ArrowLeft className="h-4 w-4" />
            All logins
          </Link>

          <Link
            to={`/signup/${role}`}
            className="font-semibold text-ink-900 hover:text-primary-600 dark:text-ink-50"
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
          transition={{ delay: 0.05 }}
          className="mb-6 flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50 p-4 dark:border-ink-800 dark:bg-ink-900"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-900 text-white dark:bg-ink-50 dark:text-ink-900">
            <config.icon className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-semibold capitalize text-ink-900 dark:text-ink-50">
              {role} Portal
            </p>

            <p className="text-xs text-ink-500 dark:text-ink-400">
              {config.cta}
            </p>
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
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
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email */}
        <motion.div
          initial={{
            opacity: 0,
            x: -8,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{ delay: 0.1 }}
        >
          <label className="label">
            Email Address
          </label>

          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-ink-400" />

            <input
              type="email"
              className="input pl-10"
              placeholder="you@example.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              autoComplete="email"
              required
            />
          </div>
        </motion.div>

        {/* Password */}
        <motion.div
          initial={{
            opacity: 0,
            x: -8,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center justify-between">
            <label className="label">
              Password
            </label>

            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              Forgot password?
            </Link>
          </div>

          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
          />
        </motion.div>

        {/* Remember me */}
        <motion.label
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-400"
        >
          <input
            type="checkbox"
            className="h-4 w-4 rounded accent-primary-600"
          />

          Remember me on this device
        </motion.label>

        {/* Submit */}
        <motion.button
          type="submit"
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{ delay: 0.25 }}
          disabled={loading}
          className="btn-primary btn-lg flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          whileHover={{
            scale: loading ? 1 : 1.01,
          }}
          whileTap={{
            scale: loading ? 1 : 0.99,
          }}
        >
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.span
                key="loading"
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                className="flex items-center gap-2"
              >
                <motion.div
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                />

                Signing in...
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                className="flex items-center gap-2"
              >
                Sign In
                <ArrowRight className="h-4 w-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
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
          icon: ShieldCheck,
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
          className="text-center"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
            <CheckCircle2 className="h-7 w-7 text-primary-600" />
          </div>

          <h3 className="mt-4 text-lg font-semibold text-ink-900 dark:text-ink-50">
            Check your email
          </h3>

          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
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
          <div>
            <label className="label">
              Email Address
            </label>

            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-ink-400" />

              <input
                type="email"
                className="input pl-10"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <motion.button
            type="submit"
            className="btn-primary btn-lg flex w-full items-center justify-center gap-2"
            whileHover={{
              scale: 1.01,
            }}
            whileTap={{
              scale: 0.99,
            }}
          >
            Send Reset Link
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </form>
      )}

      <Link
        to="/login"
        className="mt-6 flex items-center justify-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>
    </AuthShell>
  );
}