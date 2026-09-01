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
  gradient: string;
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
    gradient: 'from-primary-500 via-primary-600 to-primary-800',
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
    gradient: 'from-sky-500 via-sky-600 to-blue-800',
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
    gradient: 'from-ink-700 via-ink-800 to-ink-950',
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
  gradient,
  benefits,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  gradient: string;
  benefits: { icon: typeof Star; text: string }[];
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-ink-50 lg:flex-row">
      {/* Left brand panel */}
      <div className={`relative hidden flex-1 overflow-hidden bg-gradient-to-br ${gradient} lg:flex lg:flex-col lg:justify-between lg:p-12`}>
        {/* Animated background orbs */}
        <motion.div
          className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-accent-400/20 blur-2xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        />
        <motion.div
          className="absolute right-1/3 top-1/3 h-40 w-40 rounded-full bg-white/5 blur-xl"
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, delay: 2 }}
        />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Servicely</span>
          </Link>
        </div>

        <div className="relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="font-display text-3xl font-bold leading-tight text-white"
          >
            Trusted by ABUAD students
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-3 max-w-md text-white/80"
          >
            Join the marketplace where students find, book, and pay for professional services with confidence.
          </motion.p>
          <div className="mt-8 space-y-3">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                className="flex items-center gap-3 text-white/90"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
                  <benefit.icon className="h-4 w-4" />
                </div>
                <span className="text-sm">{benefit.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-sm text-white/50">© 2025 Servicely. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <Logo />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-8 lg:mt-0"
          >
            <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">{title}</h1>
            <p className="mt-2 text-ink-500">{subtitle}</p>
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

function RoleSelector({
  roles,
  active,
  onSelect,
}: {
  roles: { id: UserRole; label: string; icon: typeof User }[];
  active: UserRole;
  onSelect: (r: UserRole) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-2xl bg-ink-100 p-1.5">
      {roles.map((r) => (
        <button
          key={r.id}
          onClick={() => onSelect(r.id)}
          className={`relative flex flex-col items-center gap-1.5 rounded-xl py-3 text-xs font-medium transition-colors ${
            active === r.id ? 'text-white' : 'text-ink-500 hover:text-ink-700'
          }`}
        >
          {active === r.id && (
            <motion.div
              layoutId="role-selector-pill"
              className="absolute inset-0 rounded-xl bg-primary-600 shadow-sm"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          <r.icon className="relative z-10 h-5 w-5" />
          <span className="relative z-10 capitalize">{r.label}</span>
        </button>
      ))}
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
      bg: 'hover:border-primary-400 hover:bg-primary-50',
      iconBg: 'bg-primary-100 text-primary-600',
    },
    {
      id: 'provider',
      title: 'Service Provider',
      desc: 'Offer your services, receive bookings, and grow your client base.',
      icon: Briefcase,
      bg: 'hover:border-sky-400 hover:bg-sky-50',
      iconBg: 'bg-sky-100 text-sky-600',
    },
  ];

  return (
    <AuthShell
      title="Create your account"
      subtitle="How do you want to use the platform?"
      gradient="from-primary-500 via-primary-600 to-primary-800"
      benefits={[
        { icon: ShoppingBag, text: 'Browse and book verified providers' },
        { icon: Wallet, text: 'Pay securely through the platform' },
        { icon: Star, text: 'Read real reviews from students' },
      ]}
    >
      <div className="space-y-4">
        {roles.map((role, i) => (
          <motion.button
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onHoverStart={() => setHovered(role.id)}
            onHoverEnd={() => setHovered(null)}
            onClick={() => navigate(`/signup/${role.id}`)}
            className={`group flex w-full items-center gap-4 rounded-2xl border-2 border-ink-200 p-5 text-left transition-all ${role.bg}`}
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${role.iconBg} transition-transform group-hover:scale-110`}>
              <role.icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-ink-900">{role.title}</h3>
              <p className="text-sm text-ink-500">{role.desc}</p>
            </div>
            <motion.div animate={{ x: hovered === role.id ? 4 : 0 }}>
              <ArrowRight className="h-5 w-5 text-ink-400" />
            </motion.div>
          </motion.button>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
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
      gradient={isProvider ? 'from-sky-500 via-sky-600 to-blue-800' : 'from-primary-500 via-primary-600 to-primary-800'}
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
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <label className="label">Full Name</label>
          <div className="relative">
            <UserCircle className="absolute left-3 top-3 h-5 w-5 text-ink-400" />
            <input className="input pl-10" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <label className="label">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-ink-400" />
            <input type="email" className="input pl-10" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <label className="label">Password</label>
          <PasswordInput value={password} onChange={setPassword} placeholder="Create a password" />
        </motion.div>
        {isProvider && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-start gap-2 rounded-xl bg-accent-50 p-3 text-xs text-accent-700"
          >
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
            <span>After signup, you will complete your profile and submit it for verification before becoming bookable.</span>
          </motion.div>
        )}
        <motion.button
          type="submit"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="btn-primary btn-lg w-full"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isProvider ? 'Continue to Onboarding' : 'Create Account'} <ArrowRight className="h-4 w-4" />
        </motion.button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{' '}
        <Link to={isProvider ? '/login/provider' : '/login/customer'} className="font-semibold text-primary-600 hover:text-primary-700">
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

  const roles: { id: UserRole; title: string; desc: string; icon: typeof User; gradient: string; iconBg: string; path: string }[] = [
    {
      id: 'customer',
      title: 'Customer',
      desc: 'Find and book trusted service providers.',
      icon: User,
      gradient: 'from-primary-500 to-primary-700',
      iconBg: 'bg-primary-100 text-primary-600',
      path: '/login/customer',
    },
    {
      id: 'provider',
      title: 'Service Provider',
      desc: 'Offer services and receive bookings.',
      icon: Briefcase,
      gradient: 'from-sky-500 to-blue-700',
      iconBg: 'bg-sky-100 text-sky-600',
      path: '/login/provider',
    },
    {
      id: 'admin',
      title: 'Admin',
      desc: 'Manage and monitor the marketplace.',
      icon: Shield,
      gradient: 'from-ink-700 to-ink-900',
      iconBg: 'bg-ink-100 text-ink-700',
      path: '/login/admin',
    },
  ];

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Choose your account type to continue"
      gradient="from-primary-500 via-primary-600 to-primary-800"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onHoverStart={() => setHovered(role.id)}
            onHoverEnd={() => setHovered(null)}
            onClick={() => navigate(role.path)}
            className="group flex w-full items-center gap-4 rounded-2xl border-2 border-ink-200 p-5 text-left transition-all hover:border-ink-300 hover:shadow-md"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${role.iconBg} transition-transform group-hover:scale-110`}>
              <role.icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-ink-900">{role.title}</h3>
              <p className="text-sm text-ink-500">{role.desc}</p>
            </div>
            <motion.div animate={{ x: hovered === role.id ? 4 : 0 }}>
              <ArrowRight className="h-5 w-5 text-ink-400" />
            </motion.div>
          </motion.button>
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-ink-500">
        Don't have an account?{' '}
        <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700">
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
      gradient={config.gradient}
      benefits={config.benefits}
      footer={
        <div className="flex items-center justify-center gap-4 text-sm">
          <Link to="/login" className="flex items-center gap-1 font-medium text-ink-500 hover:text-ink-700">
            <ArrowLeft className="h-4 w-4" /> All logins
          </Link>
          {role !== 'admin' && (
            <Link to={`/signup/${role}`} className="font-semibold text-primary-600 hover:text-primary-700">
              Create {role} account
            </Link>
          )}
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex items-center gap-3 rounded-2xl border border-ink-100 bg-ink-50 p-4"
        >
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${config.gradient} text-white shadow-sm`}>
            <config.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold capitalize text-ink-900">{role} Portal</p>
            <p className="text-xs text-ink-500">{config.cta}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
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

        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
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
            transition={{ delay: 0.25 }}
            className="flex items-center gap-2 text-sm text-ink-600"
          >
            <input type="checkbox" className="h-4 w-4 rounded accent-primary-600" />
            Remember me on this device
          </motion.label>
        )}

        <motion.button
          type="submit"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          disabled={loading}
          className="btn-primary btn-lg w-full"
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
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
      gradient="from-primary-500 via-primary-600 to-primary-800"
      benefits={[
        { icon: ShieldCheck, text: 'Verified providers only' },
        { icon: Wallet, text: 'Secure in-platform payments' },
        { icon: Star, text: 'Real reviews from real students' },
      ]}
    >
      {sent ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
            <CheckCircle2 className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-ink-900">Check your email</h3>
          <p className="mt-1 text-sm text-ink-500">We've sent a password reset link to your email address.</p>
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
          <motion.button type="submit" className="btn-primary btn-lg w-full" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            Send Reset Link <ArrowRight className="h-4 w-4" />
          </motion.button>
        </form>
      )}
      <Link to="/login" className="mt-6 flex items-center justify-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-700">
        <ArrowLeft className="h-4 w-4" /> Back to login
      </Link>
    </AuthShell>
  );
}
