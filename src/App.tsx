import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, BookingProvider, isTokenExpired, useAuth } from '@/context/AppContext';
import { queryClient } from '@/lib/queryClient';
import { lazy, Suspense, useEffect, useState } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';

/**
 * Route-level code splitting keeps the public landing page fast and only
 * downloads a dashboard bundle when the user actually visits it.
 */
const HomePage = lazy(() =>
  import('@/pages/public/HomePage').then((m) => ({ default: m.HomePage }))
);
const ServicesPage = lazy(() =>
  import('@/pages/public/ServicesPage').then((m) => ({ default: m.ServicesPage }))
);
const ProviderProfilePage = lazy(() => import('@/pages/provider/ProviderProfilePage'));
const ProvidersPage = lazy(() =>
  import('@/pages/public/StaticPages').then((m) => ({ default: m.ProvidersPage }))
);
const HowItWorksPage = lazy(() =>
  import('@/pages/public/StaticPages').then((m) => ({ default: m.HowItWorksPage }))
);
const AboutPage = lazy(() =>
  import('@/pages/public/StaticPages').then((m) => ({ default: m.AboutPage }))
);
const SignupRolePage = lazy(() =>
  import('@/pages/auth/AuthPages').then((m) => ({ default: m.SignupRolePage }))
);
const SignupPage = lazy(() =>
  import('@/pages/auth/AuthPages').then((m) => ({ default: m.SignupPage }))
);
const LoginPage = lazy(() =>
  import('@/pages/auth/AuthPages').then((m) => ({ default: m.LoginPage }))
);
const RoleLoginPage = lazy(() =>
  import('@/pages/auth/AuthPages').then((m) => ({ default: m.RoleLoginPage }))
);
const ForgotPasswordPage = lazy(() =>
  import('@/pages/auth/AuthPages').then((m) => ({ default: m.ForgotPasswordPage }))
);
const CustomerProfile = lazy(() =>
  import('@/pages/customer/CustomerDashboard').then((m) => ({ default: m.CustomerProfile }))
);
const CustomerSettings = lazy(() =>
  import('@/pages/customer/CustomerDashboard').then((m) => ({ default: m.CustomerSettings }))
);
const CustomerBrowse = lazy(() =>
  import('@/pages/customer/CustomerBrowse').then((m) => ({ default: m.CustomerBrowse }))
);
const CustomerSaved = lazy(() =>
  import('@/pages/customer/CustomerSaved').then((m) => ({ default: m.CustomerSaved }))
);
const CustomerBookings = lazy(() =>
  import('@/pages/customer/CustomerBookings').then((m) => ({ default: m.CustomerBookings }))
);
const CustomersDashboard = lazy(() =>
  import('@/pages/customer/CustomersDashboard').then((m) => ({ default: m.CustomersDashboard }))
);
const CustomerReviews = lazy(() =>
  import('@/pages/customer/CustomerReviews').then((m) => ({ default: m.CustomerReviews }))
);
const ProviderOnboarding = lazy(() =>
  import('@/pages/provider/ProviderDashboard').then((m) => ({ default: m.ProviderOnboarding }))
);
const ProviderEarnings = lazy(() =>
  import('@/pages/provider/ProviderDashboard').then((m) => ({ default: m.ProviderEarnings }))
);
const ProviderSettings = lazy(() =>
  import('@/pages/provider/ProviderDashboard').then((m) => ({ default: m.ProviderSettings }))
);
const ProvidersDashboard = lazy(() =>
  import('@/pages/provider/ProvidersDashboard').then((m) => ({ default: m.ProvidersDashboard }))
);
const ProviderAddService = lazy(() =>
  import('@/pages/provider/ProviderAddService').then((m) => ({ default: m.ProviderAddService }))
);
const ProviderPortfolio = lazy(() =>
  import('@/pages/provider/ProviderPortfolio').then((m) => ({ default: m.ProviderPortfolio }))
);
const ProviderServices = lazy(() =>
  import('@/pages/provider/ProviderServices').then((m) => ({ default: m.ProviderServices }))
);
const ProviderProfile = lazy(() =>
  import('@/pages/provider/ProviderProfile').then((m) => ({ default: m.ProviderProfile }))
);
const ProviderAvailability = lazy(() =>
  import('@/pages/provider/ProviderAvailability').then((m) => ({ default: m.ProviderAvailability }))
);
const ProviderAccount = lazy(() =>
  import('@/pages/provider/ProviderAccount').then((m) => ({ default: m.ProviderAccount }))
);
const ProviderRequests = lazy(() =>
  import('@/pages/provider/ProviderRequests').then((m) => ({ default: m.ProviderRequests }))
);
const ProviderBookings = lazy(() =>
  import('@/pages/provider/ProviderBookings').then((m) => ({ default: m.ProviderBookings }))
);
const ProviderReviews = lazy(() =>
  import('@/pages/provider/ProviderReviews').then((m) => ({ default: m.ProviderReviews }))
);
const BookingFlow = lazy(() =>
  import('@/pages/booking/BookingFlow').then((m) => ({ default: m.BookingFlow }))
);
const BookingConfirmed = lazy(() =>
  import('@/pages/booking/BookingFlow').then((m) => ({ default: m.BookingConfirmed }))
);
const PaymentPage = lazy(() =>
  import('@/pages/booking/BookingFlow').then((m) => ({ default: m.PaymentPage }))
);
const ReviewPage = lazy(() =>
  import('@/pages/booking/BookingFlow').then((m) => ({ default: m.ReviewPage }))
);
const AdminDashboard = lazy(() =>
  import('@/pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const AdminCategories = lazy(() =>
  import('@/pages/admin/AdminDashboard').then((m) => ({ default: m.AdminCategories }))
);
const AdminPayments = lazy(() =>
  import('@/pages/admin/AdminDashboard').then((m) => ({ default: m.AdminPayments }))
);
const AdminDisputes = lazy(() =>
  import('@/pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDisputes }))
);
const AdminFeatured = lazy(() =>
  import('@/pages/admin/AdminDashboard').then((m) => ({ default: m.AdminFeatured }))
);
const AdminAnalytics = lazy(() =>
  import('@/pages/admin/AdminDashboard').then((m) => ({ default: m.AdminAnalytics }))
);
const AdminSettings = lazy(() =>
  import('@/pages/admin/AdminDashboard').then((m) => ({ default: m.AdminSettings }))
);
const AdminAuth = lazy(() => import('@/pages/auth/AdminAuth'));
const AdminUsers = lazy(() =>
  import('@/pages/admin/AdminUsers').then((m) => ({ default: m.AdminUsers }))
);
const AdminVerification = lazy(() =>
  import('@/pages/admin/AdminVerification').then((m) => ({ default: m.AdminVerification }))
);
const AdminProviders = lazy(() =>
  import('@/pages/admin/Provider').then((m) => ({ default: m.AdminProviders }))
);
const AdminProviderProfile = lazy(() =>
  import('@/pages/admin/AdminProviderProfile').then((m) => ({ default: m.AdminProviderProfile }))
);
const AdminBookings = lazy(() =>
  import('@/pages/admin/AdminBookings').then((m) => ({ default: m.AdminBookings }))
);
const AdminReviews = lazy(() =>
  import('@/pages/admin/AdminReviews').then((m) => ({ default: m.AdminReviews }))
);

// function ProtectedRoute({ role, children }: { role: 'customer' | 'provider' | 'admin'; children: React.ReactNode }) {
//   const { user } = useAuth();
//   if (!user) return <Navigate to={`/login/${role}`} replace />;
//   if (user.role !== role) return <Navigate to={`/${user.role}`} replace />;
//   return <>{children}</>;
// }
function ProtectedRoute({
  role,
  children,
}: {
  role: "customer" | "provider" | "admin";
  children: React.ReactNode;
}) {
  const [adminSessionExpired, setAdminSessionExpired] = useState(false);
  const { user } = useAuth();
  const adminToken = role === "admin"
    ? sessionStorage.getItem("servicely_admin_token")
    : null;
  const adminTokenIsExpired = role === "admin"
    && (!adminToken || isTokenExpired(adminToken));

  useEffect(() => {
    if (role !== "admin" || !adminToken || adminTokenIsExpired) {
      return;
    }

    const tokenPayload = JSON.parse(
      atob(adminToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
    );

    if (!tokenPayload.exp) {
      return;
    }

    const expiryTimer = window.setTimeout(() => {
      sessionStorage.removeItem("servicely_admin_token");
      sessionStorage.removeItem("servicely_admin");
      setAdminSessionExpired(true);
    }, Math.max(0, tokenPayload.exp * 1000 - Date.now()));

    return () => window.clearTimeout(expiryTimer);
  }, [adminToken, adminTokenIsExpired, role]);

  // ADMIN HAS A COMPLETELY SEPARATE AUTH SYSTEM
  if (role === "admin") {
    if (!adminToken || adminTokenIsExpired || adminSessionExpired) {
      sessionStorage.removeItem("servicely_admin_token");
      sessionStorage.removeItem("servicely_admin");
      return (
        <Navigate
          to="/login/admin"
          replace
        />
      );
    }

    return <>{children}</>;
  }

  // CUSTOMER / PROVIDER AUTH
  if (!user) {
    return (
      <Navigate
        to={`/login/${role}`}
        replace
      />
    );
  }

  if (user.role !== role) {
    return (
      <Navigate
        to={`/${user.role}`}
        replace
      />
    );
  }

  return <>{children}</>;
}


function RouteFallback() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 dark:bg-ink-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600 dark:border-ink-800 dark:border-t-brand-400" />
        <p className="text-sm font-medium text-slate-500 dark:text-ink-400">
          Loading your workspace…
        </p>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/providers" element={<ProvidersPage />} />
      <Route path="/providers/:id" element={<ProviderProfilePage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/about" element={<AboutPage />} />

      {/* Auth */}
      <Route path="/signup" element={<SignupRolePage />} />
      <Route path="/signup/:role" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/:role" element={<RoleLoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Booking flow */}
      <Route path="/book/:id" element={<BookingFlow />} />
      <Route path="/booking-confirmed/:id" element={<BookingConfirmed />} />
      <Route path="/payment/:id" element={<PaymentPage />} />
      <Route path="/review/:id" element={<ReviewPage />} />

      {/* Customer */}
      <Route path="/customer" element={<ProtectedRoute role="customer"><CustomersDashboard /></ProtectedRoute>} />
      <Route path="/customer/browse" element={<ProtectedRoute role="customer"><CustomerBrowse /></ProtectedRoute>} />
      <Route path="/customer/saved" element={<ProtectedRoute role="customer"><CustomerSaved /></ProtectedRoute>} />
      <Route path="/customer/bookings" element={<ProtectedRoute role="customer"><CustomerBookings /></ProtectedRoute>} />
      <Route path="/customer/reviews" element={<ProtectedRoute role="customer"><CustomerReviews /></ProtectedRoute>} />
      <Route path="/customer/profile" element={<ProtectedRoute role="customer"><CustomerProfile /></ProtectedRoute>} />
      <Route path="/customer/settings" element={<ProtectedRoute role="customer"><CustomerSettings /></ProtectedRoute>} />

      {/* Provider */}
      <Route path="/provider/onboarding" element={<ProviderOnboarding />} />
      {/* <Route path="/provider" element={<ProtectedRoute role="provider"><ProviderDashboard /></ProtectedRoute>} /> */}
      <Route path="/provider" element={<ProtectedRoute role="provider"><ProvidersDashboard /></ProtectedRoute>} />
      <Route path="/provider/services" element={<ProtectedRoute role="provider"><ProviderServices /></ProtectedRoute>} />
      <Route path="/provider/add-service" element={<ProtectedRoute role="provider"><ProviderAddService /></ProtectedRoute>} />
      <Route path="/provider/portfolio" element={<ProtectedRoute role="provider"><ProviderPortfolio /></ProtectedRoute>} />
      <Route path="/provider/availability" element={<ProtectedRoute role="provider"><ProviderAvailability /></ProtectedRoute>} />
      <Route path="/provider/requests" element={<ProtectedRoute role="provider"><ProviderRequests /></ProtectedRoute>} />
      <Route path="/provider/bookings" element={<ProtectedRoute role="provider"><ProviderBookings /></ProtectedRoute>} />
      <Route path="/provider/earnings" element={<ProtectedRoute role="provider"><ProviderEarnings /></ProtectedRoute>} />
      <Route path="/provider/reviews" element={<ProtectedRoute role="provider"><ProviderReviews /></ProtectedRoute>} />
      <Route path="/provider/profile" element={<ProtectedRoute role="provider"><ProviderProfile /></ProtectedRoute>} />
      <Route path="/provider/settings" element={<ProtectedRoute role="provider"><ProviderSettings /></ProtectedRoute>} />
      <Route path="/provider/add-account" element={<ProtectedRoute role="provider"><ProviderAccount /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/login/admin" element={<AdminAuth />} />
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/providers" element={<ProtectedRoute role="admin"><AdminProviders /></ProtectedRoute>} />
      <Route path="/admin/verification" element={<ProtectedRoute role="admin"><AdminVerification /></ProtectedRoute>} />
      <Route path="/admin/categories" element={<ProtectedRoute role="admin"><AdminCategories /></ProtectedRoute>} />
      <Route path="/admin/bookings" element={<ProtectedRoute role="admin"><AdminBookings /></ProtectedRoute>} />
      <Route path="/admin/payments" element={<ProtectedRoute role="admin"><AdminPayments /></ProtectedRoute>} />
      <Route path="/admin/reviews" element={<ProtectedRoute role="admin"><AdminReviews /></ProtectedRoute>} />
      <Route path="/admin/disputes" element={<ProtectedRoute role="admin"><AdminDisputes /></ProtectedRoute>} />
      <Route path="/admin/featured" element={<ProtectedRoute role="admin"><AdminFeatured /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute role="admin"><AdminAnalytics /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute role="admin"><AdminSettings /></ProtectedRoute>} />
      {/* AdminProviderProfile */}
      <Route
        path="/admin/providers/:id"
        element={<ProtectedRoute role="admin"><AdminProviderProfile /></ProtectedRoute>}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BookingProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </BookingProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
