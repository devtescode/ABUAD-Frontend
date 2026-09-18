import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, BookingProvider, useAuth } from '@/context/AppContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { HomePage } from '@/pages/public/HomePage';
import { ServicesPage } from '@/pages/public/ServicesPage';
import ProviderProfilePage from '@/pages/public/ProviderProfilePage';
import { ProvidersPage, HowItWorksPage, AboutPage } from '@/pages/public/StaticPages';
import { SignupRolePage, SignupPage, LoginPage, RoleLoginPage, ForgotPasswordPage } from '@/pages/auth/AuthPages';
import {
  CustomerDashboard,
  CustomerSaved,
  CustomerBookings,
  CustomerReviews,
  CustomerProfile,
  CustomerSettings,
} from '@/pages/customer/CustomerDashboard';

import { CustomerBrowse } from '@/pages/customer/CustomerBrowse';



import {
  ProviderOnboarding,
  ProviderDashboard,
  ProviderPortfolio,
  ProviderAvailability,
  ProviderRequests,
  ProviderBookings,
  ProviderEarnings,
  ProviderReviews,
  ProviderProfile,
  ProviderSettings,
} from '@/pages/provider/ProviderDashboard';
import { ProviderAddService } from '@/pages/provider/ProviderAddService';
import { ProviderServices } from '@/pages/provider/ProviderServices';

import { BookingFlow, BookingConfirmed, PaymentPage, ReviewPage } from '@/pages/booking/BookingFlow';
import {
  AdminDashboard,
  // AdminUsers,
  // AdminProviders,
  // AdminVerification,
  AdminCategories,
  AdminBookings,
  AdminPayments,
  AdminReviews,
  AdminDisputes,
  AdminFeatured,
  AdminAnalytics,
  AdminSettings,
} from '@/pages/admin/AdminDashboard';
import AdminAuth from './pages/auth/AdminAuth';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminVerification } from './pages/admin/AdminVerification';
import { AdminProviders } from './pages/admin/Provider';
import { AdminProviderProfile } from './pages/admin/AdminProviderProfile';

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
  // ADMIN HAS A COMPLETELY SEPARATE AUTH SYSTEM
  if (role === "admin") {
    const adminToken = sessionStorage.getItem(
      "servicely_admin_token"
    );

    if (!adminToken) {
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
  const { user } = useAuth();

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


function AppRoutes() {
  return (
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
      <Route path="/customer" element={<ProtectedRoute role="customer"><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/customer/browse" element={<ProtectedRoute role="customer"><CustomerBrowse /></ProtectedRoute>} />
      <Route path="/customer/saved" element={<ProtectedRoute role="customer"><CustomerSaved /></ProtectedRoute>} />
      <Route path="/customer/bookings" element={<ProtectedRoute role="customer"><CustomerBookings /></ProtectedRoute>} />
      <Route path="/customer/reviews" element={<ProtectedRoute role="customer"><CustomerReviews /></ProtectedRoute>} />
      <Route path="/customer/profile" element={<ProtectedRoute role="customer"><CustomerProfile /></ProtectedRoute>} />
      <Route path="/customer/settings" element={<ProtectedRoute role="customer"><CustomerSettings /></ProtectedRoute>} />

      {/* Provider */}
      <Route path="/provider/onboarding" element={<ProviderOnboarding />} />
      <Route path="/provider" element={<ProtectedRoute role="provider"><ProviderDashboard /></ProtectedRoute>} />
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
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BookingProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </BookingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
