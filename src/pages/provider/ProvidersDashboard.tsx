import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  DollarSign,
  Eye,
  Image,
  Inbox,
  Plus,
  Star,
  TrendingUp,
  User,
} from "lucide-react";

import {
  DashboardLayout,
  StatCard,
} from "@/components/DashboardLayout";

import {
  StatusBadge,
  VerifiedBadge,
} from "@/components/shared";

import { useAuth } from "@/context/AppContext";

import {
  providers,
  formatNaira,
  sampleBookings,
} from "@/data/mockData";

import { providerNavItems } from "@/data/providerNavItems";

export function ProvidersDashboard() {
  const { user } = useAuth();

  /*
   * For now we find the provider using the logged-in user's id.
   * This is better than using providers[0], because providers[0]
   * would show the same provider data to every provider.
   */
  const currentProvider =
    providers.find((provider) => provider.id === user?.id) ||
    providers[0];

  const profileImage =
    user?.avatar ||
    // user?.profileImage ||
    currentProvider?.avatar ||
    "/images/default-avatar.png";

  const firstName =
    user?.name?.split(" ")[0] || "Provider";

  return (
    <DashboardLayout
      role="provider"
      navItems={providerNavItems}
    >
      {/* =====================================================
          WELCOME / PROFILE HERO
      ====================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.45,
          ease: "easeOut",
        }}
        className="relative mb-8 overflow-hidden rounded-3xl border border-ink-200/70 bg-white shadow-sm dark:border-ink-800 dark:bg-ink-900"
      >
        {/* Background decorations */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary-500/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-accent-500/10 blur-3xl" />

        <div className="relative p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            {/* LEFT SIDE */}
            <div className="flex min-w-0 items-center gap-4 sm:gap-5">
              {/* Profile picture */}
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.8,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  duration: 0.5,
                  ease: "easeOut",
                }}
                className="relative shrink-0"
              >
                {/* Gradient ring */}
                <div className="rounded-full bg-gradient-to-br from-primary-500 via-primary-400 to-accent-500 p-[3px] shadow-xl shadow-primary-500/20">
                  <div className="rounded-full bg-white p-[3px] dark:bg-ink-900">
                    {/* Image wrapper */}
                    <div className="group relative overflow-hidden rounded-full">
                      <img
                        src={profileImage}
                        alt={`${firstName}'s profile`}
                        className="h-16 w-16 rounded-full object-cover transition duration-500 group-hover:scale-110 sm:h-20 sm:w-20"
                        onError={(event) => {
                          event.currentTarget.src =
                            "/images/default-avatar.png";
                        }}
                      />

                      {/* Hover overlay */}
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-all duration-300 group-hover:bg-black/30">
                        <Eye className="h-5 w-5 scale-75 text-white opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Online indicator */}
                <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full border-4 border-white bg-emerald-500 shadow-sm dark:border-ink-900">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
              </motion.div>

              {/* Greeting */}
              <motion.div
                initial={{
                  opacity: 0,
                  x: -12,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  duration: 0.45,
                  delay: 0.1,
                }}
                className="min-w-0"
              >
                {/* Small label */}
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">
                    Provider Dashboard
                  </span>

                  {currentProvider?.verified && (
                    <VerifiedBadge />
                  )}
                </div>

                {/* Greeting */}
                <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-3xl">
                  Hello,{" "}
                  <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                    {firstName}
                  </span>{" "}
                  👋
                </h1>

                <p className="mt-1 max-w-xl text-sm leading-6 text-ink-500 dark:text-ink-400">
                  Welcome back. Here&apos;s what&apos;s happening
                  with your services today.
                </p>

                {/* Online status */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>

                  <span className="text-xs font-medium text-ink-500 dark:text-ink-400">
                    You&apos;re currently online
                  </span>
                </div>
              </motion.div>
            </div>

            {/* ACTIONS */}
            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.45,
                delay: 0.15,
              }}
              className="flex flex-wrap items-center gap-3"
            >
              {/* Profile */}
              <Link
                to="/provider/profile"
                className="group inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-300 hover:text-primary-600 hover:shadow-md dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:border-primary-500 dark:hover:text-primary-400"
              >
                <User className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                Profile
              </Link>

              {/* Add service */}
              <Link
                to="/provider/add-service"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary-500/25"
              >
                <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />

                Add Service

                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* =====================================================
          STAT CARDS
      ====================================================== */}
      <motion.div
        initial={{
          opacity: 0,
          y: 15,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.45,
          delay: 0.1,
        }}
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <StatCard
          label="Total Bookings"
          value="57"
          icon={ClipboardList}
          color="primary"
        />

        <StatCard
          label="Pending Requests"
          value="3"
          icon={Inbox}
          color="accent"
        />

        <StatCard
          label="Total Earnings"
          value="₦845k"
          icon={DollarSign}
          color="sky"
          trend="+12%"
        />

        <StatCard
          label="Avg Rating"
          value="4.9"
          icon={Star}
          color="rose"
        />
      </motion.div>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}
      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ===================================================
            RECENT BOOKINGS
        ==================================================== */}
        <motion.section
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
            delay: 0.15,
          }}
          className="xl:col-span-2"
        >
          {/* Section header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-ink-900 dark:text-ink-50">
                Recent Booking Requests
              </h2>

              <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                Keep track of your latest customer requests.
              </p>
            </div>

            <Link
              to="/provider/bookings"
              className="group hidden items-center gap-1 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700 sm:flex dark:text-primary-400"
            >
              View all
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Booking cards */}
          <div className="space-y-3">
            {sampleBookings.slice(0, 3).map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{
                  opacity: 0,
                  x: -10,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  duration: 0.35,
                  delay: 0.2 + index * 0.08,
                }}
                className="group rounded-2xl border border-ink-200/70 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md dark:border-ink-800 dark:bg-ink-900 dark:hover:border-primary-800"
              >
                <div className="flex items-center gap-4">
                  {/* Customer avatar */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-accent-100 text-sm font-bold text-primary-700 dark:from-primary-950 dark:to-accent-950 dark:text-primary-300">
                    {booking.customerName?.[0]?.toUpperCase()}
                  </div>

                  {/* Booking information */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-bold text-ink-900 dark:text-ink-100">
                        {booking.serviceName}
                      </h3>

                      <span className="hidden rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold text-ink-500 sm:inline-block dark:bg-ink-800 dark:text-ink-400">
                        New request
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                      {booking.customerName}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-400">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {booking.date}
                      </span>

                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {booking.time}
                      </span>

                      <span className="hidden sm:inline">
                        • {booking.location}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="hidden shrink-0 sm:block">
                    <StatusBadge status={booking.status} />
                  </div>
                </div>

                {/* Mobile status */}
                <div className="mt-3 border-t border-ink-100 pt-3 sm:hidden dark:border-ink-800">
                  <StatusBadge status={booking.status} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mobile view all */}
          <Link
            to="/provider/bookings"
            className="group mt-4 flex items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white py-3 text-sm font-semibold text-primary-600 transition hover:border-primary-300 dark:border-ink-800 dark:bg-ink-900 dark:text-primary-400 sm:hidden"
          >
            View all bookings
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.section>

        {/* ===================================================
            ACTIVE SERVICES
        ==================================================== */}
        <motion.section
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
            delay: 0.2,
          }}
        >
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-ink-900 dark:text-ink-50">
                Active Services
              </h2>

              <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                Your currently available services.
              </p>
            </div>

            <Link
              to="/provider/services"
              className="rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-primary-600 dark:hover:bg-ink-800"
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Services */}
          <div className="space-y-3">
            {currentProvider?.services
              ?.slice(0, 3)
              .map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{
                    opacity: 0,
                    x: 10,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  transition={{
                    duration: 0.35,
                    delay: 0.25 + index * 0.08,
                  }}
                  className="group rounded-2xl border border-ink-200/70 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md dark:border-ink-800 dark:bg-ink-900 dark:hover:border-primary-800"
                >
                  <div className="flex items-start gap-3">
                    {/* Service icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100 dark:bg-primary-950/40 dark:text-primary-400 dark:group-hover:bg-primary-950">
                      <Image className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-ink-900 dark:text-ink-100">
                            {service.title}
                          </h3>

                          <p className="mt-1 flex items-center gap-1 text-xs text-ink-400">
                            <Clock className="h-3.5 w-3.5" />
                            {service.duration}
                          </p>
                        </div>

                        <span className="shrink-0 text-sm font-bold text-primary-600 dark:text-primary-400">
                          {formatNaira(service.price)}
                        </span>
                      </div>

                      {/* Available indicator */}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Available
                        </span>

                        <Link
                          to={`/provider/services/${service.id}`}
                          className="text-[11px] font-semibold text-ink-400 opacity-0 transition-all group-hover:text-primary-600 group-hover:opacity-100 dark:group-hover:text-primary-400"
                        >
                          Manage
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>

          {/* Add service CTA */}
          <Link
            to="/provider/add-service"
            className="group mt-4 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-primary-300 bg-primary-50/50 py-3.5 text-sm font-semibold text-primary-600 transition-all duration-200 hover:border-primary-400 hover:bg-primary-50 dark:border-primary-800 dark:bg-primary-950/20 dark:text-primary-400 dark:hover:bg-primary-950/40"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            Add another service
          </Link>
        </motion.section>
      </div>

      {/* =====================================================
          QUICK PERFORMANCE SECTION
      ====================================================== */}
      <motion.section
        initial={{
          opacity: 0,
          y: 15,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.45,
          delay: 0.3,
        }}
        className="mt-6 overflow-hidden rounded-3xl border border-ink-200/70 bg-white shadow-sm dark:border-ink-800 dark:bg-ink-900"
      >
        <div className="flex flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
          {/* Left */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>

            <div>
              <h3 className="font-display text-base font-bold text-ink-900 dark:text-white">
                Your profile is performing well
              </h3>

              <p className="mt-1 text-xs leading-5 text-ink-500 dark:text-ink-400">
                Keep your portfolio and services updated to give
                customers more reasons to book you.
              </p>
            </div>
          </div>

          {/* Right */}
          <Link
            to="/provider/profile"
            className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-ink-900"
          >
            Manage Profile
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </motion.section>
    </DashboardLayout>
  );
}