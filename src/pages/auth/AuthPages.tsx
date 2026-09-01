import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Briefcase, ArrowRight, Mail, Lock, UserCircle, ShieldCheck,
  ArrowLeft, CheckCircle2, Eye, EyeOff, Sparkles, ShoppingBag,
  LayoutDashboard, Shield, TrendingUp, Wallet, Star, Calendar,
} from 'lucide-react';
import { useAuth } from '@/context/AppContext';
import type { UserRole } from '@/data/mockData';
import { Logo } from '@/components/shared';

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

const roleConfigs: Record<'customer' | 'provider' | 'admin', RoleConfig> = {
  customer: {
    id: 'customer',
    title: 'Customer Login',
    subtitle: 'Book trusted service providers in minutes',
    icon: User,
    accent: 'primary',
    benefits: [
      { icon: ShoppingBag, text: 'Browse and book verified providers' },
      { icon: Wallet, text: 'Pay securely through the platform' },
      { icon: Star, text: 'Read real reviews from students' },
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
      { icon: Calendar, text: 'Receive and manage booking requests' },
      { icon: Wallet, text: 'Track earnings and request payouts' },
      { icon: TrendingUp, text: 'Build your reputation with reviews' },
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
      { icon: ShieldCheck, text: 'Verify and approve providers' },
      { icon: LayoutDashboard, text: 'Monitor platform analytics' },
      { icon: CheckCircle2, text: 'Resolve disputes and manage reviews' },
    ],
    cta: 'Access admin dashboard',
    redirect: '/admin',
  },
};

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
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Servicely</span>
          </Link>
        </div>

        <div className="relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-3xl font-bold leading-tight text-white"
          >
            Trusted by ABUAD students
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="mt-3 max-w-md text-ink-400"
          >
            Join the marketplace where students find, book, and pay for professional services with confidence.
          </motion.p>
          <div className="mt-8 space-y-3">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
                className="flex items-center gap-3 text-ink-300"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                  <benefit.icon className="h-4 w-4" />
                </div>
                <span className="text-sm">{benefit.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-sm text-ink-600">© 2025 Servicely. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-8 lg:mt-0"
          >
            <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-50 sm:text-3xl">{title}</h1>
            <p className="mt-2 text-ink-500 dark:text-ink-400">{subtitle}</p>
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-6">{footer}</div>}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

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
        className="input pl-10 pr-10"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-3 text-ink-400 hover:text-ink-600"
      >
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}

// ─── Signup Role Selection ───────────────────────────────────────────────────

export function SignupRolePage() {
  const [hovered, setHovered] = useState<UserRole | null>(null);
  const navigate = useNavigate();

  const roles: { id: UserRole; title: string; desc: string; icon: typeof User; bg: string; iconBg: string }[] = [
    {
      id: 'customer',
      title: 'Customer',
      desc: 'Find and book trusted service providers for your events and projects.',
      icon: User,
      bg: 'hover:border-primary-300 hover:bg-primary-50/50',
      iconBg: 'bg-primary-100 text-primary-600',
    },
    {
      id: 'provider',
      title: 'Service Provider',
      desc: 'Offer your services, receive bookings, and grow your client base.',
      icon: Briefcase,
      bg: 'hover:border-sky-300 hover:bg-sky-50/50',
      iconBg: 'bg-sky-100 text-sky-600',
    },
  ];

  return (
    <AuthShell
      title="Create your account"
      subtitle="How do you want to use the platform?"
      benefits={[
        { icon: ShoppingBag, text: 'Browse and book verified providers' },
        { icon: Wallet, text: 'Pay securely through the platform' },
        { icon: Star, text: 'Read real reviews from students' },
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
            className={`group flex w-full items-center gap-4 rounded-xl border border-ink-200 dark:border-ink-700 p-4 text-left transition-all ${role.bg}`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${role.iconBg} transition-transform group-hover:scale-105`}>
              <role.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-ink-900 dark:text-ink-50">{role.title}</h3>
              <p className="text-sm text-ink-500 dark:text-ink-400">{role.desc}</p>
            </div>
            <motion.div animate={{ x: hovered === role.id ? 4 : 0 }}>
              <ArrowRight className="h-4 w-4 text-ink-400 dark:text-ink-600" />
            </motion.div>
          </motion.button>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-ink-900 dark:text-ink-50 hover:text-primary-600">
          Login
        </Link>
      </p>
    </AuthShell>
  );
}

// ─── Signup Page ────────────────────────────────────────────────────────────

export function SignupPage() {
  const { role: roleParam } = useParams();
  const role: UserRole = roleParam === 'provider' ? 'provider' : 'customer';
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isProvider = role === 'provider';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signup(name, email, role);
    navigate(isProvider ? '/provider/onboarding' : '/customer');
  };

  return (
    <AuthShell
      title={isProvider ? 'Become a Provider' : 'Create your account'}
      subtitle={isProvider ? 'Start offering your services on Servicely' : 'Join Servicely as a customer'}
      benefits={
        isProvider
          ? [
              { icon: Calendar, text: 'Receive and manage booking requests' },
              { icon: Wallet, text: 'Track earnings and request payouts' },
              { icon: TrendingUp, text: 'Build your reputation with reviews' },
            ]
          : [
              { icon: ShoppingBag, text: 'Browse and book verified providers' },
              { icon: Wallet, text: 'Pay securely through the platform' },
              { icon: Star, text: 'Read real reviews from students' },
            ]
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
          <label className="label">Full Name</label>
          <div className="relative">
            <UserCircle className="absolute left-3 top-3 h-5 w-5 text-ink-400" />
            <input className="input pl-10" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <label className="label">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-ink-400" />
            <input type="email" className="input pl-10" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <label className="label">Password</label>
          <PasswordInput value={password} onChange={setPassword} placeholder="Create a password" />
        </motion.div>
        {isProvider && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-start gap-2 rounded-lg bg-accent-50 p-3 text-xs text-accent-700"
          >
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
            <span>After signup, you will complete your profile and submit it for verification before becoming bookable.</span>
          </motion.div>
        )}
        <motion.button
          type="submit"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="btn-primary btn-lg w-full"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {isProvider ? 'Continue to Onboarding' : 'Create Account'} <ArrowRight className="h-4 w-4" />
        </motion.button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
        Already have an account?{' '}
        <Link to={isProvider ? '/login/provider' : '/login/customer'} className="font-semibold text-ink-900 dark:text-ink-50 hover:text-primary-600">
          Login
        </Link>
      </p>
    </AuthShell>
  );
}

// ─── Login Hub (role selection) ─────────────────────────────────────────────

export function LoginPage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<UserRole | null>(null);

  const roles: { id: UserRole; title: string; desc: string; icon: typeof User; iconBg: string; path: string }[] = [
    {
      id: 'customer',
      title: 'Customer',
      desc: 'Find and book trusted service providers.',
      icon: User,
      iconBg: 'bg-primary-100 text-primary-600',
      path: '/login/customer',
    },
    {
      id: 'provider',
      title: 'Service Provider',
      desc: 'Offer services and receive bookings.',
      icon: Briefcase,
      iconBg: 'bg-sky-100 text-sky-600',
      path: '/login/provider',
    },
    // {
    //   id: 'admin',
    //   title: 'Admin',
    //   desc: 'Manage and monitor the marketplace.',
    //   icon: Shield,
    //   iconBg: 'bg-ink-100 text-ink-700',
    //   path: '/login/admin',
    // },
  ];

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Choose your account type to continue"
      benefits={[
        { icon: ShieldCheck, text: 'Verified providers only' },
        { icon: Wallet, text: 'Secure in-platform payments' },
        { icon: Star, text: 'Real reviews from real students' },
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
            onClick={() => navigate(role.path)}
            className="group flex w-full items-center gap-4 rounded-xl border border-ink-200 dark:border-ink-700 p-4 text-left transition-all hover:border-ink-300 dark:hover:border-ink-600 hover:bg-ink-50 dark:hover:bg-ink-800"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${role.iconBg} transition-transform group-hover:scale-105`}>
              <role.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-ink-900 dark:text-ink-50">{role.title}</h3>
              <p className="text-sm text-ink-500 dark:text-ink-400">{role.desc}</p>
            </div>
            <motion.div animate={{ x: hovered === role.id ? 4 : 0 }}>
              <ArrowRight className="h-4 w-4 text-ink-400 dark:text-ink-600" />
            </motion.div>
          </motion.button>
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
        Don't have an account?{' '}
        <Link to="/signup" className="font-semibold text-ink-900 dark:text-ink-50 hover:text-primary-600">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}

// ─── Role-Specific Login Pages ──────────────────────────────────────────────

export function RoleLoginPage() {
  const { role: roleParam } = useParams();
  const role = (['customer', 'provider', 'admin'].includes(roleParam || '') ? roleParam : 'customer') as UserRole;
  const config = roleConfigs[role];
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(email, role);
      navigate(config.redirect);
    }, 600);
  };

  return (
    <AuthShell
      title={config.title}
      subtitle={config.subtitle}
      benefits={config.benefits}
      footer={
        <div className="flex items-center justify-center gap-4 text-sm">
          <Link to="/login" className="flex items-center gap-1 font-medium text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50">
            <ArrowLeft className="h-4 w-4" /> All logins
          </Link>
          {role !== 'admin' && (
            <Link to={`/signup/${role}`} className="font-semibold text-ink-900 dark:text-ink-50 hover:text-primary-600">
              Create {role} account
            </Link>
          )}
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="mb-6 flex items-center gap-3 rounded-xl border border-ink-100 dark:border-ink-800 bg-ink-50 dark:bg-ink-900 p-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-900 dark:bg-ink-50 text-white dark:text-ink-900">
            <config.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold capitalize text-ink-900 dark:text-ink-50">{role} Portal</p>
            <p className="text-xs text-ink-500 dark:text-ink-400">{config.cta}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <label className="label">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-ink-400" />
            <input
              type="email"
              className="input pl-10"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center justify-between">
            <label className="label">Password</label>
            <Link to="/forgot-password" className="text-xs font-medium text-primary-600 hover:text-primary-700">
              Forgot password?
            </Link>
          </div>
          <PasswordInput value={password} onChange={setPassword} placeholder="Enter your password" />
        </motion.div>

        {role !== 'admin' && (
          <motion.label
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 text-sm text-ink-600"
          >
            <input type="checkbox" className="h-4 w-4 rounded accent-primary-600" />
            Remember me on this device
          </motion.label>
        )}

        <motion.button
          type="submit"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          disabled={loading}
          className="btn-primary btn-lg w-full"
          whileHover={{ scale: loading ? 1 : 1.01 }}
          whileTap={{ scale: loading ? 1 : 0.99 }}
        >
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                />
                Signing in...
              </motion.span>
            ) : (
              <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                Sign In <ArrowRight className="h-4 w-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </form>
    </AuthShell>
  );
}

// ─── Forgot Password ───────────────────────────────────────────────────────

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter your email to receive a reset link"
      benefits={[
        { icon: ShieldCheck, text: 'Verified providers only' },
        { icon: Wallet, text: 'Secure in-platform payments' },
        { icon: Star, text: 'Real reviews from real students' },
      ]}
    >
      {sent ? (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
            <CheckCircle2 className="h-7 w-7 text-primary-600" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-ink-900 dark:text-ink-50">Check your email</h3>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">We've sent a password reset link to your email address.</p>
          <Link to="/login" className="btn-primary mt-6 w-full">
            Back to Login
          </Link>
        </motion.div>
      ) : (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
          <div>
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-ink-400" />
              <input type="email" className="input pl-10" placeholder="you@example.com" required />
            </div>
          </div>
          <motion.button type="submit" className="btn-primary btn-lg w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            Send Reset Link <ArrowRight className="h-4 w-4" />
          </motion.button>
        </form>
      )}
      <Link to="/login" className="mt-6 flex items-center justify-center gap-1 text-sm font-medium text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50">
        <ArrowLeft className="h-4 w-4" /> Back to login
      </Link>
    </AuthShell>
  );
}
