import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";

const API_URL = "http://localhost:5000";

type AuthMode = "login" | "register";

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />

          <p className="text-sm text-slate-400">
            Checking administrator access...
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">

      <div className="w-full max-w-md">

        {/* BRAND */}
        <div className="text-center mb-8">

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 mb-5">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>

          <h1 className="text-3xl font-bold text-white">
            Servicely
          </h1>

          <p className="text-slate-400 mt-2">
            Administrator Portal
          </p>

        </div>


        {/* CARD */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">

          {/* HEADER */}
          <div className="mb-6">

            <h2 className="text-2xl font-bold text-slate-900">
              {mode === "register"
                ? "Create Admin Account"
                : "Admin Login"}
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              {mode === "register"
                ? "Create the administrator account for Servicely."
                : "Sign in to access the Servicely admin dashboard."}
            </p>

          </div>


          {/* FIRST ADMIN NOTICE */}
          {mode === "register" && (
            <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-100 p-4 flex gap-3">

              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />

              <div>

                <p className="text-sm font-medium text-emerald-900">
                  First administrator
                </p>

                <p className="text-xs text-emerald-700 mt-1">
                  No administrator account exists yet.
                  Create the first admin account below.
                </p>

              </div>

            </div>
          )}


          {/* ERROR */}
          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-100 p-3 flex gap-3">

              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />

              <p className="text-sm text-red-700">
                {error}
              </p>

            </div>
          )}


          {/* SUCCESS */}
          {success && (
            <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-100 p-3 flex gap-3">

              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />

              <p className="text-sm text-emerald-700">
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
              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>

                <div className="relative">

                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="Enter your full name"
                    autoComplete="name"
                    className="w-full h-12 rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  />

                </div>

              </div>
            )}


            {/* EMAIL */}
            <div>

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>

              <div className="relative">

                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="admin@example.com"
                  autoComplete="email"
                  className="w-full h-12 rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                />

              </div>

            </div>


            {/* PASSWORD */}
            <div>

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>

              <div className="relative">

                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete={
                    mode === "register"
                      ? "new-password"
                      : "current-password"
                  }
                  className="w-full h-12 rounded-xl border border-slate-200 pl-11 pr-12 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>

              </div>

            </div>


            {/* CONFIRM PASSWORD */}
            {mode === "register" && (
              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm Password
                </label>

                <div className="relative">

                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    className="w-full h-12 rounded-xl border border-slate-200 pl-11 pr-12 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (previous) => !previous
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>

                </div>

              </div>
            )}


            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
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
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">

            <p className="text-xs text-slate-400">
              Servicely Administrator Portal
            </p>

          </div>

        </div>


        <p className="text-center text-xs text-slate-500 mt-6">
          Authorized administrators only
        </p>

      </div>

    </div>
  );
}

