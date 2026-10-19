import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Mail,
  Lock,
  User,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Activity,
  Lock as LockIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/components/ui";

// const API_URL = "http://localhost:5000";
const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

type AuthMode = "login" | "register";

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
  toggle,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  toggle?: {
    shown: boolean;
    onToggle: () => void;
  };
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-slate-700 dark:text-ink-300"
      >
        {label}
      </label>

      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 dark:text-ink-500" />

        <input
          id={id}
          type={
            toggle
              ? toggle.shown
                ? "text"
                : "password"
              : type
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={cn(
            "w-full h-11 rounded-xl border border-slate-200 bg-white pl-11 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 sm:text-sm dark:border-ink-700 dark:bg-ink-800 dark:text-ink-50 dark:placeholder:text-ink-500 dark:focus:border-emerald-400",
            toggle ? "pr-12" : "pr-4"
          )}
        />

        {toggle && (
          <button
            type="button"
            onClick={toggle.onToggle}
            aria-label={
              toggle.shown
                ? "Hide password"
                : "Show password"
            }
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-ink-200"
          >
            {toggle.shown ? (
              <EyeOff className="h-[18px] w-[18px]" />
            ) : (
              <Eye className="h-[18px] w-[18px]" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Admin Page ─────────────────────────────────────────────────────────────

export default function AdminAuth() {
  const navigate = useNavigate();

  // Prevent the initialization effect from running more than once
  const initialized = useRef(false);

  const [mode, setMode] = useState<AuthMode>("login");
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * CHECK ADMIN
   *
   * This runs only once when the page loads.
   */
  useEffect(() => {
    if (initialized.current) return;

    initialized.current = true;

    const checkAdmin = async () => {
      try {
        setCheckingAdmin(true);
        setError("");

        // Check whether an admin is already logged in
        const adminToken = sessionStorage.getItem(
          "servicely_admin_token"
        );

        if (adminToken) {
          navigate("/admin", {
            replace: true,
          });

          return;
        }

        // Ask backend whether an admin account exists
        const response = await fetch(
          `${API_URL}/admin/exists`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
            "Unable to check admin status."
          );
        }

        const exists = Boolean(data?.exists);

        setAdminExists(exists);

        if (exists) {
          // Admin already exists
          setMode("login");
        } else {
          // No admin exists
          setMode("register");
        }
      } catch (err: any) {
        console.error("Admin check error:", err);

        setError(
          err?.message ||
          "Unable to connect to the server."
        );
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdmin();
  }, []); // IMPORTANT: empty dependency array


  /*
   * REGISTER ADMIN
   */
  const handleRegister = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/admin/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          "Unable to create admin account."
        );
      }

      /*
       * DO NOT SAVE TOKEN HERE.
       *
       * Registration should take the admin to login.
       */
      setPassword("");
      setConfirmPassword("");

      setAdminExists(true);

      setSuccess(
        "Admin account created successfully. Please login."
      );

      // Change to login after registration
      setTimeout(() => {
        setMode("login");
        setSuccess("");
      }, 1200);
    } catch (err: any) {
      console.error("Admin registration error:", err);

      setError(
        err?.message ||
        "Something went wrong while creating the account."
      );
    } finally {
      setLoading(false);
    }
  };


  /*
   * LOGIN ADMIN
   */
  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/admin/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          "Invalid admin credentials."
        );
      }

      if (!data?.token) {
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
        data.token
      );

      if (data.admin) {
        sessionStorage.setItem(
          "servicely_admin",
          JSON.stringify(data.admin)
        );
      }

      /*
       * Go to admin dashboard.
       */
      navigate("/admin", {
        replace: true,
      });
    } catch (err: any) {
      console.error("Admin login error:", err);

      setError(
        err?.message ||
        "Something went wrong while logging in."
      );
    } finally {
      setLoading(false);
    }
  };


  /*
   * LOADING SCREEN
   */
  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
          </div>

          <div className="flex items-center gap-2.5">
            <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />

            <p className="text-sm text-slate-400">
              Checking administrator access...
            </p>
          </div>

        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-ink-950 lg:grid lg:grid-cols-2">

      {/* ── Left security panel ── */}
      <aside className="relative hidden overflow-hidden bg-slate-900 lg:flex lg:flex-col lg:justify-between lg:p-12">

        {/* Decorative shapes */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-emerald-400/5 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px]" />
        </div>

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">

          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-400/20">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </span>

          <div>
            <p className="text-lg font-bold leading-tight text-white">
              Servicely
            </p>

            <p className="text-xs text-slate-400">
              Administrator Portal
            </p>
          </div>

        </div>


        {/* Security copy */}
        <div className="relative z-10">

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur"
          >
            <LockIcon className="h-3.5 w-3.5" />
            Restricted access
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.4 }}
            className="max-w-lg text-3xl font-bold leading-tight text-white"
          >
            The secure control room
            <br />
            for the Servicely marketplace.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.4 }}
            className="mt-4 max-w-md text-sm leading-6 text-slate-400"
          >
            Sign in to verify providers, monitor
            bookings and payouts, and keep the ABUAD
            campus marketplace running smoothly.
          </motion.p>

          <ul className="mt-8 space-y-3.5">

            <motion.li
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.22, duration: 0.4 }}
              className="flex items-center gap-3"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              </span>

              <span className="text-sm font-medium text-slate-300">
                Administrator-only access, verified at every request
              </span>
            </motion.li>

            <motion.li
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="flex items-center gap-3"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                <Activity className="h-3.5 w-3.5 text-emerald-400" />
              </span>

              <span className="text-sm font-medium text-slate-300">
                Monitor providers, bookings, and platform activity
              </span>
            </motion.li>

            <motion.li
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.38, duration: 0.4 }}
              className="flex items-center gap-3"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                <LockIcon className="h-3.5 w-3.5 text-emerald-400" />
              </span>

              <span className="text-sm font-medium text-slate-300">
                Encrypted sessions, stored separately from students
              </span>
            </motion.li>

          </ul>

        </div>

        <p className="relative z-10 text-xs text-slate-500">
          Authorized administrators only
        </p>

      </aside>


      {/* ── Right form panel ── */}
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-8 lg:min-h-0 lg:py-12">

        <div className="w-full max-w-md">

          {/* Compact mobile brand header */}
          <div className="mb-6 flex items-center justify-center gap-3 lg:hidden">

            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/10 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </span>

            <div className="text-center">
              <p className="text-lg font-bold leading-tight text-slate-900 dark:text-white">
                Servicely
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Administrator Portal
              </p>
            </div>

          </div>


          {/* CARD */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xl sm:p-8 dark:border-ink-800 dark:bg-ink-900"
          >

            {/* HEADER */}
            <div className="mb-6">

              <h1 className="text-2xl font-bold text-slate-900 dark:text-ink-50">
                {mode === "register"
                  ? "Create Admin Account"
                  : "Admin Login"}
              </h1>

              <p className="mt-2 text-sm text-slate-500 dark:text-ink-400">
                {mode === "register"
                  ? "Create the administrator account for Servicely."
                  : "Sign in to access the Servicely admin dashboard."}
              </p>

            </div>


            {/* FIRST ADMIN NOTICE */}
            {mode === "register" && (
              <div className="mb-5 flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">

                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />

                <div>

                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                    First administrator
                  </p>

                  <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300/80">
                    No administrator account exists yet.
                    Create the first admin account below.
                  </p>

                </div>

              </div>
            )}


            {/* ERROR */}
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-5 flex gap-3 rounded-xl border border-red-100 bg-red-50 p-3 dark:border-red-500/25 dark:bg-red-500/10"
              >

                <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />

                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>

              </div>
            )}


            {/* SUCCESS */}
            {success && (
              <div
                role="status"
                aria-live="polite"
                className="mb-5 flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10"
              >

                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />

                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  {success}
                </p>

              </div>
            )}


            {/* FORM */}
            <form
              onSubmit={
                mode === "register"
                  ? handleRegister
                  : handleLogin
              }
              className="space-y-5"
            >

              {/* NAME */}
              {mode === "register" && (
                <AdminField
                  id="admin-name"
                  label="Full Name"
                  icon={User}
                  value={name}
                  onChange={setName}
                  placeholder="Enter your full name"
                  autoComplete="name"
                />
              )}


              {/* EMAIL */}
              <AdminField
                id="admin-email"
                label="Email Address"
                icon={Mail}
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="admin@example.com"
                autoComplete="email"
              />


              {/* PASSWORD */}
              <AdminField
                id="admin-password"
                label="Password"
                icon={Lock}
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
                autoComplete={
                  mode === "register"
                    ? "new-password"
                    : "current-password"
                }
                toggle={{
                  shown: showPassword,
                  onToggle: () =>
                    setShowPassword((previous) => !previous),
                }}
              />


              {/* CONFIRM PASSWORD */}
              {mode === "register" && (
                <AdminField
                  id="admin-confirm-password"
                  label="Confirm Password"
                  icon={Lock}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
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
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >

                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />

                    {mode === "register"
                      ? "Creating Account..."
                      : "Logging In..."}
                  </>
                ) : mode === "register" ? (
                  "Create Admin Account"
                ) : (
                  "Login to Dashboard"
                )}

              </button>

            </form>


            {/* FOOTER */}
            <div className="mt-6 pt-6 border-t border-slate-100 text-center dark:border-ink-800">

              <p className="text-xs text-slate-400 dark:text-ink-500">
                Servicely Administrator Portal
              </p>

            </div>

          </motion.div>


          <p className="mt-6 text-center text-xs text-slate-500 dark:text-ink-500">
            Authorized administrators only
          </p>

        </div>

      </main>

    </div>
  );
}
