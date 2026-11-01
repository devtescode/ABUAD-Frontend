import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Award,
  Ban,
  BarChart3,
  Briefcase,
  Calendar,
  CalendarCheck2,
  CheckCircle2,
  CreditCard,
  DollarSign,
  LayoutDashboard,
  Mail,
  ReceiptText,
  Settings,
  ShieldCheck,
  Star,
  Tag,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import {
  DashboardLayout,
  DashboardHeader,
  StatCard,
} from '@/components/DashboardLayout';
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  SectionHeading,
  cn,
} from '@/components/ui';
import { StarRating, VerifiedBadge } from '@/components/shared';
import {
  categories,
  formatNaira,
  providers,
  sampleBookings,
} from '@/data/mockData';

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, path: '/admin' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Providers', icon: Briefcase, path: '/admin/providers' },
  { label: 'Verification', icon: CheckCircle2, path: '/admin/verification' },
  { label: 'Categories', icon: Tag, path: '/admin/categories' },
  { label: 'Bookings', icon: Calendar, path: '/admin/bookings' },
  { label: 'Payments', icon: CreditCard, path: '/admin/payments' },
  { label: 'Reviews', icon: Star, path: '/admin/reviews' },
  { label: 'Disputes', icon: AlertTriangle, path: '/admin/disputes' },
  { label: 'Featured', icon: Award, path: '/admin/featured' },
  { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
];

const commissionSeries = [40, 55, 35, 70, 60, 85, 75, 90, 80, 95];

const monthlyBookingSeries = [30, 45, 35, 50, 60, 55, 70, 65, 80, 75, 90, 85];

const monthLabels = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const categoryShares = [45, 25, 20, 10];

const activityFeed = [
  {
    text: 'New provider registration',
    time: '2 mins ago',
    icon: UserPlus,
    tone: 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300',
  },
  {
    text: 'Booking completed by Daniel Okonkwo',
    time: '15 mins ago',
    icon: CalendarCheck2,
    tone: 'bg-success-50 text-success-600 dark:bg-success-600/15 dark:text-success-200',
  },
  {
    text: 'Payment received ₦45,000',
    time: '1 hour ago',
    icon: Wallet,
    tone: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
  },
  {
    text: 'New review submitted',
    time: '2 hours ago',
    icon: Star,
    tone: 'bg-warning-50 text-warning-600 dark:bg-warning-600/15 dark:text-warning-200',
  },
  {
    text: 'Provider verification request',
    time: '3 hours ago',
    icon: ShieldCheck,
    tone: 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300',
  },
];

/* =========================================================
   OVERVIEW
========================================================= */

export function AdminDashboard() {
  const today = new Date().toLocaleDateString('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <DashboardLayout role="admin" navItems={navItems}>
      <DashboardHeader
        title="Admin Dashboard"
        subtitle="Platform overview and statistics"
        action={
          <Badge tone="neutral" icon={Calendar} className="w-fit">
            {today}
          </Badge>
        }
      />

      <section aria-labelledby="admin-kpis" className="space-y-3 sm:space-y-4">
        <h2 id="admin-kpis" className="sr-only">
          Key platform metrics
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Users"
            value="1,247"
            icon={Users}
            color="brand"
            trend="+8%"
          />
          <StatCard
            label="Total Providers"
            value="86"
            icon={Briefcase}
            color="sky"
          />
          <StatCard
            label="Verified"
            value="72"
            icon={CheckCircle2}
            color="success"
          />
          <StatCard
            label="Pending"
            value="14"
            icon={AlertTriangle}
            color="warning"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Bookings"
            value="432"
            icon={Calendar}
            color="brand"
          />
          <StatCard
            label="Completed"
            value="389"
            icon={CheckCircle2}
            color="success"
          />
          <StatCard
            label="Cancelled"
            value="28"
            icon={XCircle}
            color="rose"
          />
          <StatCard
            label="Transaction Volume"
            value="₦2.4M"
            icon={DollarSign}
            color="brand"
            trend="+15%"
          />
        </div>
      </section>

      <section aria-labelledby="admin-insights" className="mt-6 sm:mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2
              id="admin-insights"
              className="text-base font-semibold tracking-tight text-slate-900 dark:text-ink-50"
            >
              Performance &amp; activity
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-ink-400">
              Commission trends and the latest platform events.
            </p>
          </div>
          <Badge tone="neutral" icon={Calendar}>
            Last 10 months
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* Commission chart */}
          <div className="card p-5 sm:p-6 lg:col-span-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                <TrendingUp className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-ink-50">
                  Platform Commission
                </h3>
                <p className="text-xs text-slate-500 dark:text-ink-400">
                  Monthly earnings trend
                </p>
              </div>
            </div>

            <div
              role="img"
              aria-label="Bar chart of platform commission over the last 10 months, trending upward."
              className="relative mt-6 h-40 sm:h-48"
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 flex flex-col justify-between"
              >
                {[0, 1, 2, 3].map((line) => (
                  <div
                    key={line}
                    className="border-t border-dashed border-slate-100 dark:border-ink-800"
                  />
                ))}
              </div>

              <div
                aria-hidden="true"
                className="relative flex h-full items-end gap-1.5 sm:gap-2"
              >
                {commissionSeries.map((height, index) => (
                  <motion.div
                    key={index}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{
                      delay: index * 0.04,
                      duration: 0.45,
                      ease: 'easeOut',
                    }}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400"
                  />
                ))}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-ink-400">
              <span>Last 10 months</span>
              <span className="font-semibold text-slate-600 dark:text-ink-300">
                Total: ₦240,000
              </span>
            </div>
          </div>

          {/* Recent activity */}
          <div className="card flex flex-col p-5 sm:p-6 lg:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                  <Activity className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-ink-50">
                    Recent Activity
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-ink-400">
                    Latest platform events
                  </p>
                </div>
              </div>
              <Badge tone="neutral">
                {activityFeed.length} updates
              </Badge>
            </div>

            <ol className="mt-4 flex-1 space-y-0.5">
              {activityFeed.map(({ text, time, icon: Icon, tone }) => (
                <li
                  key={text}
                  className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-ink-800/50"
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      tone
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug text-slate-700 dark:text-ink-200">
                      {text}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-ink-400">
                      {time}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}

/* =========================================================
   CATEGORIES
========================================================= */

export function AdminCategories() {
  return (
    <DashboardLayout role="admin" navItems={navItems}>
      <DashboardHeader
        title="Category Management"
        subtitle="Manage service categories"
        action={
          <Button
            icon={Tag}
            className="w-full sm:w-auto"
            aria-label="Add a new service category"
          >
            Add Category
          </Button>
        }
      />

      <h2 className="sr-only">Service categories</h2>

      {categories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No categories yet"
          description="Create your first category to start organising services on the platform."
          action={
            <Button icon={Tag} size="sm" aria-label="Add a new service category">
              Add Category
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge tone="brand" icon={Tag}>
              {categories.length} categories
            </Badge>
            <Badge tone="success" icon={CheckCircle2}>
              {categories.length} active
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {categories.map((cat, index) => {
              const Icon = cat.icon;

              return (
                <motion.article
                  key={cat.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.25,
                    delay: Math.min(index * 0.04, 0.16),
                  }}
                  className="card-hover group flex flex-col overflow-hidden"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-lavender dark:bg-ink-800">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />

                    <span className="absolute left-3 top-3">
                      <Badge tone="success" icon={CheckCircle2}>
                        Active
                      </Badge>
                    </span>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2.5 text-white">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <h3 className="truncate text-sm font-semibold">
                        {cat.name}
                      </h3>
                    </div>
                  </div>

                  <div className={cn('h-1 w-full bg-gradient-to-r', cat.color)} />

                  <div className="flex flex-1 flex-col p-4">
                    <p className="line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-slate-500 dark:text-ink-400">
                      {cat.description}
                    </p>

                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-10 flex-1"
                        aria-label={`Edit ${cat.name} category`}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-10 min-w-10 px-3"
                        aria-label={`Deactivate ${cat.name} category`}
                      >
                        <Ban
                          className="h-4 w-4 text-danger-600"
                          aria-hidden="true"
                        />
                      </Button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

/* =========================================================
   PAYMENTS
========================================================= */

export function AdminPayments() {
  const transactions = sampleBookings.filter((booking) =>
    ['paid', 'completed', 'reviewed'].includes(booking.status)
  );

  return (
    <DashboardLayout role="admin" navItems={navItems}>
      <DashboardHeader
        title="Payment Management"
        subtitle="Monitor transactions and payouts"
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Volume"
          value="₦2.4M"
          icon={DollarSign}
          color="brand"
          trend="+15%"
        />
        <StatCard
          label="Commission"
          value="₦240k"
          icon={TrendingUp}
          color="sky"
        />
        <StatCard
          label="Provider Payouts"
          value="₦1.96M"
          icon={CreditCard}
          color="warning"
        />
        <StatCard
          label="Failed Payments"
          value="3"
          icon={XCircle}
          color="danger"
        />
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-slate-100 p-5 dark:border-ink-800 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-ink-50">
              Recent Transactions
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-ink-400">
              Successful booking payments and provider payouts.
            </p>
          </div>
          <Badge tone="brand" icon={ReceiptText} className="w-fit">
            {transactions.length} records
          </Badge>
        </div>

        {transactions.length === 0 ? (
          <div className="p-4 sm:p-6">
            <EmptyState
              icon={ReceiptText}
              title="No transactions yet"
              description="Successful booking payments will appear here."
            />
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[680px] text-left text-sm">
                <caption className="sr-only">
                  Recent successful transactions with commission and provider
                  payout
                </caption>
                <thead className="border-b border-slate-200/70 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 dark:border-ink-800 dark:bg-ink-900/80 dark:text-ink-400">
                  <tr>
                    <th scope="col" className="px-5 py-3.5 font-semibold">
                      Booking
                    </th>
                    <th scope="col" className="px-5 py-3.5 font-semibold">
                      Amount
                    </th>
                    <th scope="col" className="px-5 py-3.5 font-semibold">
                      Commission
                    </th>
                    <th scope="col" className="px-5 py-3.5 font-semibold">
                      Provider Payout
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3.5 text-right font-semibold"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-ink-800">
                  {transactions.map((booking) => (
                    <tr
                      key={booking.id}
                      className="transition-colors hover:bg-slate-50/80 dark:hover:bg-ink-800/40"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                            <ReceiptText
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900 dark:text-ink-50">
                              {booking.serviceName}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-ink-400">
                              {booking.providerName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900 dark:text-ink-50">
                        {formatNaira(booking.price)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-brand-600 dark:text-brand-300">
                        {formatNaira(booking.price * 0.1)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600 dark:text-ink-300">
                        {formatNaira(booking.price * 0.9)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Badge tone="success" icon={CheckCircle2}>
                          Success
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards */}
            <ul className="divide-y divide-slate-100 dark:divide-ink-800 md:hidden">
              {transactions.map((booking) => (
                <li key={booking.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                        <ReceiptText className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
                          {booking.serviceName}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-ink-400">
                          {booking.providerName}
                        </p>
                      </div>
                    </div>
                    <Badge
                      tone="success"
                      icon={CheckCircle2}
                      className="shrink-0"
                    >
                      Success
                    </Badge>
                  </div>

                  <dl className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-xs dark:border-ink-800">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-500 dark:text-ink-400">
                        Amount
                      </dt>
                      <dd className="font-semibold text-slate-900 dark:text-ink-50">
                        {formatNaira(booking.price)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-500 dark:text-ink-400">
                        Commission
                      </dt>
                      <dd className="font-medium text-brand-600 dark:text-brand-300">
                        {formatNaira(booking.price * 0.1)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-500 dark:text-ink-400">
                        Provider Payout
                      </dt>
                      <dd className="font-medium text-slate-700 dark:text-ink-200">
                        {formatNaira(booking.price * 0.9)}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

/* =========================================================
   DISPUTES
========================================================= */

export function AdminDisputes() {
  return (
    <DashboardLayout role="admin" navItems={navItems}>
      <DashboardHeader
        title="Dispute Management"
        subtitle="Review and resolve booking disputes"
        action={
          <Badge tone="success" icon={CheckCircle2} className="w-fit">
            0 open
          </Badge>
        }
      />

      <h2 className="sr-only">Open disputes</h2>

      <EmptyState
        icon={AlertTriangle}
        title="No active disputes"
        description="When customers or providers report issues, they will appear here."
      />
    </DashboardLayout>
  );
}

/* =========================================================
   FEATURED PROVIDERS
========================================================= */

export function AdminFeatured() {
  const featured = providers.filter((provider) => provider.featured);
  const nonFeatured = providers.filter(
    (provider) => !provider.featured && provider.verified
  );

  return (
    <DashboardLayout role="admin" navItems={navItems}>
      <DashboardHeader
        title="Featured Providers"
        subtitle="Promote top providers on the homepage"
        action={
          <Badge tone="brand" icon={Award} className="w-fit">
            {featured.length} live
          </Badge>
        }
      />

      <section aria-label="Currently featured providers" className="mb-8">
        <SectionHeading
          title="Currently Featured"
          subtitle="These providers are promoted on the homepage."
          action={
            <Badge tone="brand" icon={Award} className="w-fit">
              {featured.length} providers
            </Badge>
          }
        />

        {featured.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No featured providers"
            description="Promote a verified provider to have them appear on the homepage."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {featured.map((provider, index) => (
              <motion.article
                key={provider.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  delay: Math.min(index * 0.04, 0.16),
                }}
                className="card-hover flex flex-col gap-4 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    src={provider.avatar}
                    name={provider.name}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
                        {provider.name}
                      </p>
                      {provider.verified && <VerifiedBadge />}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-ink-400">
                      {provider.categories.join(', ') || 'Service provider'}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                      <span className="flex items-center gap-1.5">
                        <StarRating rating={provider.rating} size={12} />
                        <span className="font-medium text-slate-700 dark:text-ink-300">
                          {provider.rating.toFixed(1)}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="text-slate-300 dark:text-ink-600"
                      >
                        •
                      </span>
                      <span className="text-slate-500 dark:text-ink-400">
                        From {formatNaira(provider.startingPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-10 w-full shrink-0"
                  aria-label={`Remove ${provider.name} from featured providers`}
                >
                  <Award
                    className="h-4 w-4 text-danger-600"
                    aria-hidden="true"
                  />
                  <span className="text-danger-600">Unfeature</span>
                </Button>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      <section aria-label="Providers available to feature">
        <SectionHeading
          title="Available to Feature"
          subtitle="Verified providers eligible for homepage promotion."
          action={
            <Badge tone="neutral" icon={ShieldCheck} className="w-fit">
              {nonFeatured.length} verified
            </Badge>
          }
        />

        {nonFeatured.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Nothing available to feature"
            description="All verified providers are already featured on the homepage."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {nonFeatured.map((provider, index) => (
              <motion.article
                key={provider.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  delay: Math.min(index * 0.04, 0.16),
                }}
                className="card-hover flex flex-col gap-4 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    src={provider.avatar}
                    name={provider.name}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
                        {provider.name}
                      </p>
                      {provider.verified && <VerifiedBadge />}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-ink-400">
                      {provider.categories.join(', ') || 'Service provider'}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                      <span className="flex items-center gap-1.5">
                        <StarRating rating={provider.rating} size={12} />
                        <span className="font-medium text-slate-700 dark:text-ink-300">
                          {provider.rating.toFixed(1)}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="text-slate-300 dark:text-ink-600"
                      >
                        •
                      </span>
                      <span className="text-slate-500 dark:text-ink-400">
                        From {formatNaira(provider.startingPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  className="min-h-10 w-full shrink-0"
                  aria-label={`Feature ${provider.name} on the homepage`}
                >
                  <Award className="h-4 w-4" aria-hidden="true" />
                  Feature
                </Button>
              </motion.article>
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}

/* =========================================================
   ANALYTICS
========================================================= */

export function AdminAnalytics() {
  return (
    <DashboardLayout role="admin" navItems={navItems}>
      <DashboardHeader
        title="Analytics"
        subtitle="Platform growth and insights"
        action={
          <Badge tone="neutral" icon={Calendar} className="w-fit">
            Last 12 months
          </Badge>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value="1,247"
          icon={Users}
          color="brand"
          trend="+8%"
        />
        <StatCard
          label="Active Providers"
          value="72"
          icon={Briefcase}
          color="sky"
          trend="+5%"
        />
        <StatCard
          label="Bookings"
          value="432"
          icon={Calendar}
          color="warning"
          trend="+12%"
        />
        <StatCard
          label="Revenue"
          value="₦2.4M"
          icon={DollarSign}
          color="success"
          trend="+15%"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-5">
        {/* Monthly bookings */}
        <div className="card p-5 sm:p-6 xl:col-span-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                <BarChart3 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-ink-50">
                  Monthly Bookings
                </h2>
                <p className="text-xs text-slate-500 dark:text-ink-400">
                  Booking volume over the last 12 months
                </p>
              </div>
            </div>
            <Badge tone="success" icon={TrendingUp}>
              +12%
            </Badge>
          </div>

          <div className="mt-5">
            <div
              role="img"
              aria-label="Bar chart of monthly bookings over the last 12 months, rising overall."
              className="relative h-40 sm:h-48"
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 flex flex-col justify-between"
              >
                {[0, 1, 2, 3].map((line) => (
                  <div
                    key={line}
                    className="border-t border-dashed border-slate-100 dark:border-ink-800"
                  />
                ))}
              </div>

              <div
                aria-hidden="true"
                className="relative flex h-full items-end gap-1 sm:gap-1.5"
              >
                {monthlyBookingSeries.map((height, index) => (
                  <div
                    key={monthLabels[index]}
                    className="flex h-full flex-1 flex-col justify-end"
                  >
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{
                        delay: index * 0.03,
                        duration: 0.45,
                        ease: 'easeOut',
                      }}
                      className="w-full rounded-t bg-gradient-to-t from-brand-600 to-brand-400"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div
              aria-hidden="true"
              className="mt-2 flex gap-1 sm:gap-1.5"
            >
              {monthLabels.map((month) => (
                <span
                  key={month}
                  className="flex-1 text-center text-[9px] font-medium text-slate-500 dark:text-ink-400 sm:text-[10px]"
                >
                  {month}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Top categories */}
        <div className="card p-5 sm:p-6 xl:col-span-2">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
              <Tag className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-ink-50">
                Top Categories
              </h2>
              <p className="text-xs text-slate-500 dark:text-ink-400">
                Share of total bookings
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {categories.map((category, index) => {
              const Icon = category.icon;
              const share = categoryShares[index] ?? 0;

              return (
                <div key={category.id}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2 text-sm text-slate-700 dark:text-ink-200">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <span className="truncate">{category.name}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-slate-900 dark:text-ink-50">
                      {share}%
                    </span>
                  </div>

                  <div
                    role="progressbar"
                    aria-valuenow={share}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${category.name} share of bookings`}
                    className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-ink-800"
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${share}%` }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* =========================================================
   SETTINGS
========================================================= */

const settingsSnapshot = [
  { label: 'Commission', value: '10%', icon: TrendingUp },
  { label: 'Currency', value: 'NGN (₦)', icon: Wallet },
  { label: 'Support', value: 'support@servicely.com', icon: Mail },
];

export function AdminSettings() {
  return (
    <DashboardLayout role="admin" navItems={navItems}>
      <DashboardHeader
        title="Settings"
        subtitle="Platform configuration"
        action={
          <Badge tone="neutral" icon={Settings} className="w-fit">
            Admin only
          </Badge>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-start gap-3 border-b border-slate-100 pb-5 dark:border-ink-800">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
              <Settings className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-ink-50">
                Platform Settings
              </h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-ink-400">
                Update the core configuration used across Servicely.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="platform-commission" className="label">
                Platform Commission (%)
              </label>
              <input
                id="platform-commission"
                name="platformCommission"
                type="number"
                defaultValue={10}
                inputMode="numeric"
                aria-describedby="platform-commission-help"
                className="input"
              />
              <p
                id="platform-commission-help"
                className="mt-1.5 text-xs text-slate-500 dark:text-ink-400"
              >
                Applied to each completed booking.
              </p>
            </div>

            <div>
              <label htmlFor="platform-name" className="label">
                Platform Name
              </label>
              <input
                id="platform-name"
                name="platformName"
                defaultValue="Servicely"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="platform-currency" className="label">
                Default Currency
              </label>
              <select
                id="platform-currency"
                name="currency"
                className="input"
              >
                <option>NGN (₦)</option>
                <option>USD ($)</option>
              </select>
            </div>

            <div>
              <label htmlFor="platform-support-email" className="label">
                Support Email
              </label>
              <input
                id="platform-support-email"
                name="supportEmail"
                type="email"
                defaultValue="support@servicely.com"
                autoComplete="email"
                className="input"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-100 pt-5 dark:border-ink-800">
            <Button type="button" className="w-full sm:w-auto">
              Save Settings
            </Button>
          </div>
        </div>

        <aside className="card h-fit p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-ink-50">
            At a glance
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-ink-400">
            Current platform configuration.
          </p>

          <dl className="mt-4 space-y-3">
            {settingsSnapshot.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-ink-800/50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm dark:bg-ink-900 dark:text-brand-300">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs text-slate-500 dark:text-ink-400">
                    {label}
                  </dt>
                  <dd className="truncate text-sm font-medium text-slate-900 dark:text-ink-50">
                    {value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>

          <p className="mt-4 rounded-xl bg-brand-50 p-3 text-xs leading-relaxed text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
            Review these values before saving changes.
          </p>
        </aside>
      </div>
    </DashboardLayout>
  );
}
