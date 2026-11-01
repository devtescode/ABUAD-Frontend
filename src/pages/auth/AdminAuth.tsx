import { useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { Button, cn } from "@/components/ui";
import { Logo } from "@/components/shared";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  queryKeys,
  useAdminExists,
  useAdminLogin,
  useAdminRegister,
  useQueryClient,
} from "@/hooks/queries";

type AuthMode = "login" | "register";

type AdminFieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const adminFeatures: Array<{ icon: LucideIcon; text: string }> = [
  {
    icon: ShieldCheck,
    text: "Administrator-only access, verified on every request",
  },
  {
    icon: Activity,
    text: "Monitor providers, bookings, and platform activity",
  },
  {
    icon: Lock,
    text: "Separate, encrypted admin sessions",
  },
];

const fieldErrorClass =
  "border-danger-500/60 focus:border-danger-500 focus:ring-danger-500/10 dark:border-danger-500/40";

// ─── Inline Field Error ─────────────────────────────────────────────────────

function FieldError({ id, message }: { id: string; message?: string }) {
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

// ─── Admin Field Primitive ──────────────────────────────────────────────────

function AdminField({
  id,
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  hint,
  toggle,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  hint?: string;
  toggle?: {
    shown: boolean;
    onToggle: () => void;
  };
}) {
  const describedBy =
    [error && `${id}-error`, hint && `${id}-hint`]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-slate-700 dark:text-ink-300"
      >
        {label}
      </label>

      <div className="group relative">
        <Icon
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 transition-colors",
            error
              ? "text-danger-500"
              : "text-slate-400 group-focus-within:text-brand-600 dark:text-ink-500 dark:group-focus-within:text-brand-400"
          )}
        />

        <input
          id={id}
          type={
            toggle ? (toggle.shown ? "text" : "password") : type
          }
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-12 w-full rounded-xl border bg-white pl-11 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 sm:text-sm dark:bg-ink-800 dark:text-ink-50 dark:placeholder:text-ink-500",
            toggle ? "pr-12" : "pr-4",
            error
              ? fieldErrorClass
              : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/10 dark:border-ink-700 dark:focus:border-brand-400 dark:focus:ring-brand-400/10"
          )}
        />

        {toggle && (
          <button
            type="button"
            onClick={toggle.onToggle}
            aria-label={
              toggle.shown ? "Hide password" : "Show password"
            }
            aria-pressed={toggle.shown}
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 dark:hover:bg-ink-700 dark:hover:text-ink-200"
          >
            {toggle.shown ? (
              <EyeOff className="h-[18px] w-[18px]" />
            ) : (
              <Eye className="h-[18px] w-[18px]" />
            )}
          </button>
        )}
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

// ─── Animated Form Message ──────────────────────────────────────────────────

function FormMessage({
  tone,
  message,
  onRetry,
  retrying,
}: {
  tone: "error" | "success";
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -4 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          role={tone === "error" ? "alert" : "status"}
          aria-live="polite"
          className="overflow-hidden"
        >
          <div
            className={cn(
              "flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm",
              tone === "error"
                ? "border-danger-200 bg-danger-50 text-danger-700 dark:border-danger-500/25 dark:bg-danger-500/10 dark:text-danger-200"
                : "border-success-200 bg-success-50 text-success-700 dark:border-success-600/25 dark:bg-success-600/10 dark:text-success-200"
            )}
          >
            {tone === "error" ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            )}

            <div className="min-w-0 flex-1">
              <p>{message}</p>

              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  disabled={retrying}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-danger-200 bg-white/70 px-2.5 py-1 text-xs font-semibold text-danger-700 transition hover:bg-white disabled:opacity-60 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-200 dark:hover:bg-danger-500/20"
                >
                  {retrying && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {retrying ? "Retrying..." : "Try again"}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Admin Existence Check Screen ───────────────────────────────────────────

function AdminCheckScreen() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-950 px-4">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500 via-brand-800 to-brand-950"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-brand-950/60 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:28px_28px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 w-full max-w-sm rounded-3xl border border-white/15 bg-white/10 p-8 text-center backdrop-blur-xl"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10"
        >
          <ShieldCheck className="h-8 w-8 text-brand-200" />
        </motion.div>

        <p className="mt-5 text-sm font-semibold text-white">
          Verifying administrator access
        </p>

        <p className="mt-1 text-xs text-brand-200/80">
          Secure connection · Servicely
        </p>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-brand-100">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking administrator access...
        </div>

        <div className="mt-6 h-1 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full w-1/2 rounded-full bg-gradient-to-r from-brand-300 to-sky-400"
            animate={{ x: ["-100%", "200%"] }}
            transition={{
              repeat: Infinity,
              duration: 1.4,
              ease: "easeInOut",
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}

// ─── Admin Page ─────────────────────────────────────────────────────────────

export default function AdminAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Resolve the "already signed in" redirect once, on mount.
  const [hadAdminSession] = useState(() =>
    Boolean(sessionStorage.getItem("servicely_admin_token"))
  );

  const adminExistsQuery = useAdminExists({
    enabled: !hadAdminSession,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const registerMutation = useAdminRegister();
  const loginMutation = useAdminLogin();

  const modeTimer = useRef<number | null>(null);

  const [mode, setMode] = useState<AuthMode>("login");
  const [initialized, setInitialized] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [fieldErrors, setFieldErrors] =
    useState<AdminFieldErrors>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const exists = adminExistsQuery.data
    ? Boolean(adminExistsQuery.data.exists)
    : undefined;

  const isRegister = mode === "register";
  const loading = isRegister
    ? registerMutation.isPending
    : loginMutation.isPending;

  if (hadAdminSession) {
    return <Navigate to="/admin" replace />;
  }

  if (adminExistsQuery.isLoading) {
    return <AdminCheckScreen />;
  }

  /*
   * ONE-TIME INITIALISATION GUARD
   *
   * The backend decides whether the page opens in "login" or "register"
   * mode. Apply that decision exactly once so later refetches — or the
   * admin manually switching modes — never override their choice.
   */
  if (!initialized && typeof exists === "boolean") {
    setInitialized(true);
    setMode(exists ? "login" : "register");
  }

  const existsError = adminExistsQuery.isError
    ? adminExistsQuery.error?.message ||
      "Unable to connect to the server."
    : "";

  const clearFieldError = (key: keyof AdminFieldErrors) => {
    setFieldErrors((previous) => {
      if (!previous[key]) return previous;

      const next = { ...previous };
      delete next[key];
      return next;
    });

    if (error) setError("");
  };

  const switchMode = (nextMode: AuthMode) => {
    if (loading || nextMode === mode) return;

    if (modeTimer.current !== null) {
      window.clearTimeout(modeTimer.current);
      modeTimer.current = null;
    }

    // A manual choice is final: a late existence refetch must not
    // override it.
    setInitialized(true);
    setMode(nextMode);
    setError("");
    setSuccess("");
    setFieldErrors({});
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const validateRegister = (): AdminFieldErrors => {
    const nextErrors: AdminFieldErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Please enter your full name.";
    }

    if (!email.trim()) {
      nextErrors.email = "Please enter your email.";
    }

    if (!password) {
      nextErrors.password = "Please enter a password.";
    } else if (password.length < 6) {
      nextErrors.password =
        "Password must be at least 6 characters.";
    }

    if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    return nextErrors;
  };

  const validateLogin = (): AdminFieldErrors => {
    const nextErrors: AdminFieldErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Please enter your email.";
    }

    if (!password) {
      nextErrors.password = "Please enter your password.";
    }

    return nextErrors;
  };

  /*
   * REGISTER ADMIN
   */
  const handleRegister = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const nextErrors = validateRegister();
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    try {
      await registerMutation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      /*
       * DO NOT SAVE TOKEN HERE.
       *
       * Registration should take the admin to login.
       */
      queryClient.setQueryData<{ exists?: boolean }>(
        queryKeys.admin.exists,
        { exists: true }
      );

      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);

      setSuccess(
        "Admin account created successfully. Please login."
      );

      // Change to login after registration
      modeTimer.current = window.setTimeout(() => {
        setMode("login");
        setSuccess("");
        modeTimer.current = null;
      }, 1200);
    } catch (registerError) {
      console.error(
        "Admin registration error:",
        registerError
      );

      setError(
        registerError instanceof Error
          ? registerError.message
          : "Something went wrong while creating the account."
      );
    }
  };

  /*
   * LOGIN ADMIN
   */
  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const nextErrors = validateLogin();
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    try {
      const data = await loginMutation.mutateAsync({
        email: email.trim(),
        password,
      });

      const token = data?.token;

      if (!token) {
        throw new Error(
          "Login successful but no token was returned."
        );
      }

      /*
       * ADMIN AUTH IS SEPARATE
       * FROM CUSTOMER/PROVIDER AUTH.
       */
      sessionStorage.setItem(
        "servicely_admin_token",
        token
      );

      const admin = data?.admin;

      if (admin) {
        sessionStorage.setItem(
          "servicely_admin",
          JSON.stringify(admin)
        );
      }

      /*
       * Go to admin dashboard.
       */
      navigate("/admin", {
        replace: true,
      });
    } catch (loginError) {
      console.error("Admin login error:", loginError);

      setError(
        loginError instanceof Error
          ? loginError.message
          : "Something went wrong while logging in."
      );
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] dark:bg-ink-950 lg:grid lg:grid-cols-2">
      {/* ── Left security panel ── */}
      <aside className="relative hidden overflow-hidden bg-brand-950 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-between lg:p-12 xl:p-16">
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
          {/* Brand */}
          <Link
            to="/"
            className="flex w-fit items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-4 focus-visible:ring-offset-brand-700"
            aria-label="Servicely home"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-soft">
              <ShieldCheck className="h-6 w-6 text-brand-600" />
            </span>

            <span>
              <span className="block text-xl font-bold tracking-tight text-white">
                Servicely
              </span>

              <span className="block text-xs font-medium text-brand-200">
                Administrator Portal
              </span>
            </span>
          </Link>

          {/* Security copy */}
          <div className="max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur"
            >
              <Lock className="h-3.5 w-3.5" />
              Restricted access
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.4 }}
              className="text-balance text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl"
            >
              The secure control room
              <br />
              for the Servicely marketplace.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.4 }}
              className="mt-4 max-w-md text-sm leading-6 text-brand-100"
            >
              Verify providers, monitor bookings and payouts,
              and keep the ABUAD campus marketplace running
              smoothly.
            </motion.p>

            <ul className="mt-8 space-y-3">
              {adminFeatures.map((feature, index) => {
                const Icon = feature.icon;

                return (
                  <motion.li
                    key={feature.text}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.22 + index * 0.08,
                      duration: 0.4,
                    }}
                    className="flex items-center gap-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white">
                      <Icon className="h-4 w-4" />
                    </span>

                    <span className="text-sm font-medium text-white/90">
                      {feature.text}
                    </span>
                  </motion.li>
                );
              })}
            </ul>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.48, duration: 0.4 }}
              className="mt-8 flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-brand-100">
                <Sparkles className="h-4 w-4" />
              </span>

              <p className="text-xs leading-5 text-brand-100">
                Admin sessions are kept separate from student
                accounts, with every privileged request
                verified by the API.
              </p>
            </motion.div>
          </div>

          {/* Trust footer */}
          <div className="flex items-center justify-between gap-4 text-xs text-brand-200">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Authorized administrators only
            </span>

            <span>ABUAD · Servicely</span>
          </div>
        </div>
      </aside>

      {/* ── Right form panel ── */}
      <main className="relative flex min-h-screen flex-col px-4 pb-8 pt-5 sm:px-8 lg:min-h-0 lg:px-10 lg:py-10 xl:px-14">
        {/* Top bar */}
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3">
          <div className="lg:hidden">
            <Logo />
          </div>

          <Link
            to="/"
            className="hidden items-center gap-1.5 rounded-lg text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 dark:text-ink-400 dark:hover:text-ink-50 lg:inline-flex"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Servicely
          </Link>

          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-8 sm:py-10">
          <div className="w-full max-w-md">
            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_30px_80px_-40px_rgba(30,26,77,0.45)] backdrop-blur dark:border-ink-800 dark:bg-ink-900/95"
            >
              {/* Accent line */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-brand-400 to-sky-400"
                aria-hidden="true"
              />

              <div className="p-6 sm:p-8">
                {/* HEADER */}
                <div className="mb-6">
                  <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-700 dark:border-brand-900/60 dark:bg-brand-950/60 dark:text-brand-300">
                    <ShieldCheck className="h-3 w-3" />
                    Administrator access
                  </span>

                  <h1 className="text-balance text-2xl font-bold tracking-tight text-slate-900 dark:text-ink-50 sm:text-[1.7rem]">
                    {isRegister
                      ? "Create admin account"
                      : "Welcome back"}
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-ink-400">
                    {isRegister
                      ? "Set up the administrator account for the Servicely marketplace."
                      : "Sign in to the Servicely administrator dashboard."}
                  </p>
                </div>

                {/* MODE SWITCH */}
                <div
                  className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-slate-200/80 bg-slate-100/70 p-1 dark:border-ink-800 dark:bg-ink-950/60"
                  role="group"
                  aria-label="Administrator authentication mode"
                >
                  {(["login", "register"] as const).map(
                    (value) => {
                      const active = mode === value;
                      const registerBlocked =
                        value === "register" && exists === true;

                      return (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={active}
                          disabled={loading || registerBlocked}
                          onClick={() => switchMode(value)}
                          title={
                            registerBlocked
                              ? "An administrator account already exists."
                              : undefined
                          }
                          className={cn(
                            "rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60",
                            active
                              ? "bg-white text-slate-900 shadow-sm dark:bg-ink-800 dark:text-ink-50"
                              : "text-slate-500 hover:text-slate-800 dark:text-ink-400 dark:hover:text-ink-100",
                            (loading || registerBlocked) &&
                              "cursor-not-allowed opacity-50"
                          )}
                        >
                          {value === "login"
                            ? "Sign in"
                            : "Create account"}
                        </button>
                      );
                    }
                  )}
                </div>

                {/* FIRST ADMIN NOTICE */}
                <AnimatePresence initial={false}>
                  {isRegister && exists === false && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mb-5 flex gap-3 rounded-xl border border-brand-100 bg-brand-50 p-4 dark:border-brand-900/60 dark:bg-brand-950/40">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-300" />

                        <div>
                          <p className="text-sm font-semibold text-brand-900 dark:text-brand-200">
                            First administrator
                          </p>

                          <p className="mt-1 text-xs leading-5 text-brand-700 dark:text-brand-300/80">
                            No administrator account exists yet.
                            Create the first admin account below.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* MESSAGES */}
                <div className="space-y-3">
                  <FormMessage
                    tone="error"
                    message={existsError || undefined}
                    onRetry={() => {
                      void adminExistsQuery.refetch();
                    }}
                    retrying={adminExistsQuery.isFetching}
                  />

                  <FormMessage
                    tone="error"
                    message={error || undefined}
                  />

                  <FormMessage
                    tone="success"
                    message={success || undefined}
                  />
                </div>

                {/* FORM */}
                <form
                  onSubmit={
                    isRegister ? handleRegister : handleLogin
                  }
                  className="mt-5 space-y-4"
                  noValidate
                  aria-busy={loading}
                >
                  {/* NAME */}
                  {isRegister && (
                    <AdminField
                      id="admin-name"
                      label="Full Name"
                      icon={User}
                      value={name}
                      onChange={(value) => {
                        setName(value);
                        clearFieldError("name");
                      }}
                      placeholder="Enter your full name"
                      autoComplete="name"
                      error={fieldErrors.name}
                    />
                  )}

                  {/* EMAIL */}
                  <AdminField
                    id="admin-email"
                    label="Email Address"
                    icon={Mail}
                    type="email"
                    value={email}
                    onChange={(value) => {
                      setEmail(value);
                      clearFieldError("email");
                    }}
                    placeholder="admin@example.com"
                    autoComplete="email"
                    error={fieldErrors.email}
                  />

                  {/* PASSWORD */}
                  <AdminField
                    id="admin-password"
                    label="Password"
                    icon={Lock}
                    value={password}
                    onChange={(value) => {
                      setPassword(value);
                      clearFieldError("password");
                    }}
                    placeholder={
                      isRegister
                        ? "Create a password"
                        : "Enter your password"
                    }
                    autoComplete={
                      isRegister
                        ? "new-password"
                        : "current-password"
                    }
                    error={fieldErrors.password}
                    hint={
                      isRegister
                        ? "Use at least 6 characters."
                        : undefined
                    }
                    toggle={{
                      shown: showPassword,
                      onToggle: () =>
                        setShowPassword(
                          (previous) => !previous
                        ),
                    }}
                  />

                  {/* CONFIRM PASSWORD */}
                  {isRegister && (
                    <AdminField
                      id="admin-confirm-password"
                      label="Confirm Password"
                      icon={Lock}
                      value={confirmPassword}
                      onChange={(value) => {
                        setConfirmPassword(value);
                        clearFieldError("confirmPassword");
                      }}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      error={fieldErrors.confirmPassword}
                      toggle={{
                        shown: showConfirmPassword,
                        onToggle: () =>
                          setShowConfirmPassword(
                            (previous) => !previous
                          ),
                      }}
                    />
                  )}

                  {/* SUBMIT */}
                  <div className="pt-1">
                    <Button
                      type="submit"
                      size="lg"
                      loading={loading}
                      icon={
                        isRegister ? UserPlus : ArrowRight
                      }
                      className="w-full"
                    >
                      {loading
                        ? isRegister
                          ? "Creating Account..."
                          : "Logging In..."
                        : isRegister
                          ? "Create Admin Account"
                          : "Login to Dashboard"}
                    </Button>
                  </div>
                </form>

                {/* FOOTER */}
                <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-5 text-[11px] font-medium text-slate-400 dark:border-ink-800 dark:text-ink-500">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Servicely Administrator Portal · Separate admin
                  sessions
                </div>
              </div>
            </motion.section>

            <p className="mt-6 text-center text-[11px] leading-5 text-slate-400 dark:text-ink-500">
              Authorized administrators only · Sessions expire when
              the tab closes.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
