import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  Compass,
  Heart,
  Search,
  SearchX,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  MarketplaceProviderCard,
  SearchBar,
  SectionHeading,
  SkeletonCard,
  providerId,
  type ProviderLike,
  type ServiceLike,
} from '@/components/ui';
import { Footer, PublicNavbar } from '@/components/shared';
import { useApprovedServices } from '@/hooks/queries';
import { getApiErrorMessage } from '@/lib/api';

/* =========================================================
   SHARED HELPERS
========================================================= */

interface DerivedProvider extends ProviderLike {
  categories: string[];
  portfolio: Array<{ image?: string; title?: string }>;
  startingPrice?: number;
}

/** Groups real approved services into unique providers. */
function deriveProviders(services: ServiceLike[]): DerivedProvider[] {
  const map = new Map<string, DerivedProvider>();

  for (const service of services) {
    const provider = service.provider;
    if (!provider) continue;

    const id = providerId(provider);
    if (!id) continue;

    let entry = map.get(id);
    if (!entry) {
      entry = { ...provider, categories: [], portfolio: [] };
      map.set(id, entry);
    }

    const category =
      typeof service.category === 'string' ? service.category.trim() : '';
    if (category && !entry.categories.includes(category)) {
      entry.categories.push(category);
    }

    if (typeof service.image === 'string' && service.image) {
      entry.portfolio.push({ image: service.image, title: service.title });
    }

    const price =
      typeof service.price === 'number' && service.price > 0
        ? service.price
        : undefined;
    if (
      price !== undefined &&
      (entry.startingPrice === undefined || price < entry.startingPrice)
    ) {
      entry.startingPrice = price;
    }
  }

  return Array.from(map.values());
}

function PageHero({
  badge,
  badgeIcon: BadgeIcon,
  title,
  subtitle,
}: {
  badge: string;
  badgeIcon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <section className="border-b border-slate-200/70 bg-gradient-to-b from-lavender via-lavender/40 to-transparent dark:border-ink-800 dark:from-brand-950/50 dark:via-brand-950/10">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-3xl text-center"
        >
          <Badge tone="brand" icon={BadgeIcon}>
            {badge}
          </Badge>
          <h1 className="mt-3 text-balance text-3xl font-bold tracking-tight text-slate-900 dark:text-ink-50 sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-500 dark:text-ink-400 sm:text-lg">
            {subtitle}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function CtaBand({
  title,
  subtitle,
  primaryLabel,
  primaryTo,
  secondaryLabel,
  secondaryTo,
}: {
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryTo: string;
  secondaryLabel: string;
  secondaryTo: string;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 px-6 py-14 text-center shadow-soft sm:px-12"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl"
        />
        <div className="relative">
          <h2 className="text-balance text-2xl font-bold text-white sm:text-4xl">
            {title}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">{subtitle}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to={primaryTo}
              className="btn btn-lg bg-white text-brand-700 shadow-card-hover hover:bg-lavender"
            >
              {primaryLabel} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to={secondaryTo}
              className="btn btn-lg border border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* =========================================================
   PROVIDERS DIRECTORY (/providers)
========================================================= */

export function ProvidersPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, error, refetch } = useApprovedServices();

  const providers = useMemo<DerivedProvider[]>(
    () => deriveProviders(data ?? []),
    [data]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return providers;
    return providers.filter((p) => {
      const name = String(p.fullName || p.name || '').toLowerCase();
      const cats = p.categories.map((c) => c.toLowerCase());
      return name.includes(query) || cats.some((c) => c.includes(query));
    });
  }, [providers, search]);

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <PublicNavbar />

      <PageHero
        badge="Provider directory"
        badgeIcon={Users}
        title="Meet our providers"
        subtitle="Browse professionals who list their services on Servicely — compare categories, portfolios and starting prices before you book."
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {isLoading ? (
          <div>
            <p className="sr-only" role="status">
              Loading providers…
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="space-y-4">
            <ErrorState
              message={`We couldn't load the provider directory. ${getApiErrorMessage(
                error
              )}`}
              onRetry={() => refetch()}
            />
            <p className="text-center text-sm text-slate-500 dark:text-ink-400">
              You can still{' '}
              <Link
                to="/services"
                className="font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              >
                browse the service catalogue
              </Link>{' '}
              or{' '}
              <Link
                to="/login"
                className="font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              >
                sign in
              </Link>
              .
            </p>
          </div>
        ) : providers.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No providers yet"
            description="Providers appear here once their services are approved. Be the first to offer a service on Servicely."
            action={
              <Link to="/signup" className="btn-primary">
                Become a provider
              </Link>
            }
          />
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-ink-800 dark:bg-ink-900/60 sm:flex-row sm:items-center sm:justify-between">
              <p
                aria-live="polite"
                className="text-sm text-slate-500 dark:text-ink-400"
              >
                <span className="font-semibold text-slate-900 dark:text-ink-50">
                  {filtered.length}
                </span>{' '}
                {filtered.length === 1 ? 'provider' : 'providers'} found
              </p>
              <SearchBar
                className="sm:w-72"
                value={search}
                onChange={setSearch}
                placeholder="Search providers..."
              />
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No providers match your search"
                description="Try a different name or category."
                action={
                  <Button variant="outline" onClick={() => setSearch('')}>
                    Clear search
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((provider, i) => (
                  <motion.div
                    key={providerId(provider)}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: Math.min(i, 11) * 0.04,
                      duration: 0.35,
                    }}
                  >
                    <MarketplaceProviderCard provider={provider} />
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

/* =========================================================
   HOW IT WORKS (/how-it-works)
========================================================= */

const howItWorksSteps = [
  {
    icon: Compass,
    title: 'Discover providers',
    description:
      'Browse the service catalogue by category — photography, videography, graphic design and makeup. Open a provider profile to see real work samples, ratings and starting prices.',
    points: [
      'Filter by category or search by name',
      'Compare portfolios, reviews and pricing',
    ],
  },
  {
    icon: CalendarCheck,
    title: 'Book a service',
    description:
      'Found the right professional? Pick your preferred date, time and location, share the details of your event, and send your booking request directly to the provider.',
    points: [
      'Choose a date that works for you',
      'Add notes so the provider can prepare',
    ],
  },
  {
    icon: Wallet,
    title: 'Pay securely with Paystack',
    description:
      'Once your booking is confirmed, complete your payment through Paystack’s secure checkout. Every transaction is encrypted, and you receive a confirmation as soon as it goes through.',
    points: [
      'Trusted Paystack payment processing',
      'Clear pricing — no surprises',
    ],
  },
  {
    icon: Star,
    title: 'Rate & review',
    description:
      'After the service is delivered, rate your provider and leave an honest review. Your feedback keeps the marketplace trustworthy for the whole ABUAD community.',
    points: [
      'Reviews come from completed bookings',
      'Help other students choose with confidence',
    ],
  },
];

export function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <PublicNavbar />

      <PageHero
        badge="Simple process"
        badgeIcon={Sparkles}
        title="How Servicely works"
        subtitle="From discovery to delivery, booking a professional service on campus takes just four steps."
      />

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-16">
        <ol className="space-y-12 sm:space-y-16">
          {howItWorksSteps.map((step, i) => (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-10"
            >
              <div
                className={`relative shrink-0 ${i % 2 === 1 ? 'sm:order-last' : ''}`}
              >
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-lavender text-brand-600 shadow-soft dark:bg-brand-950 dark:text-brand-300 sm:h-28 sm:w-28">
                  <step.icon className="h-10 w-10 sm:h-12 sm:w-12" />
                </div>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-3 -top-4 select-none text-5xl font-black text-brand-200 dark:text-brand-800/70"
                >
                  {i + 1}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <Badge tone="brand">Step {i + 1}</Badge>
                <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-ink-50 sm:text-2xl">
                  {step.title}
                </h2>
                <p className="mt-2 leading-relaxed text-slate-500 dark:text-ink-400">
                  {step.description}
                </p>
                <ul className="mt-4 space-y-2">
                  {step.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2 text-sm font-medium text-slate-700 dark:text-ink-300"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.li>
          ))}
        </ol>
      </section>

      <CtaBand
        title="Ready to get started?"
        subtitle="Browse verified providers, book your next service and pay securely — all in one place."
        primaryLabel="Browse Services"
        primaryTo="/services"
        secondaryLabel="Become a Provider"
        secondaryTo="/signup"
      />

      <Footer />
    </div>
  );
}

/* =========================================================
   ABOUT (/about)
========================================================= */

const trustPoints = [
  {
    icon: BadgeCheck,
    title: 'Verified providers',
    description:
      'Every provider is reviewed and approved before they can list services, so students book from real, accountable professionals.',
  },
  {
    icon: Wallet,
    title: 'Secure payments',
    description:
      'Payments run through Paystack’s secure checkout with bank-grade encryption — no cash hand-offs, no guesswork.',
  },
  {
    icon: Star,
    title: 'Honest reviews',
    description:
      'Ratings and reviews come from students who actually completed bookings, so you can trust the feedback you read.',
  },
  {
    icon: ShieldCheck,
    title: 'Transparent pricing',
    description:
      'See starting prices upfront on every listing. What you see before you book is what you pay for — no hidden fees.',
  },
];

export function AboutPage() {
  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <PublicNavbar />

      <PageHero
        badge="Our mission"
        badgeIcon={Heart}
        title="Built for the ABUAD community"
        subtitle="Servicely connects students who need professional services with verified providers who deliver them — transparently, securely and right here on campus."
      />

      {/* Mission */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-ink-50 sm:text-3xl">
              Why Servicely exists
            </h2>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-slate-600 dark:text-ink-300 sm:text-lg">
            <p>
              Finding a photographer for your birthday, a designer for your
              project or a makeup artist for an event shouldn't mean scrolling
              through group chats and hoping for the best. Most students either
              don't know who is trustworthy, or can't tell what a service
              should really cost.
            </p>
            <p>
              Servicely fixes that. We bring verified service providers and
              students onto one marketplace where portfolios, reviews and
              prices are visible upfront — so every booking starts with trust
              and ends with a secure, confirmed payment.
            </p>
            <p>
              We're starting with the ABUAD community, with the goal of
              becoming the standard way students across Nigeria discover and
              book professional services.
            </p>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-y border-slate-200/70 bg-white py-14 dark:border-ink-800 dark:bg-ink-900/50 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            title="Why students trust Servicely"
            subtitle="Trust isn't a feature bolted on at the end — it's built into every step of the marketplace."
            align="center"
          />
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trustPoints.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="card p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lavender text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900 dark:text-ink-50">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-ink-400">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <SectionHeading
          title="A marketplace for both sides of campus"
          subtitle="Whether you need a service or you offer one, Servicely is built around you."
          align="center"
        />
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4 }}
            className="card p-6 sm:p-8"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lavender text-brand-600 dark:bg-brand-950 dark:text-brand-300">
              <Search className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-ink-50">
              For students
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-ink-400">
              Discover verified providers, compare work and prices, book a
              service in minutes and pay securely with Paystack — then share
              your experience with honest reviews.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/services" className="btn-primary btn-sm">
                Browse services
              </Link>
              <Link to="/how-it-works" className="btn-outline btn-sm">
                See how it works
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="card p-6 sm:p-8"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lavender text-brand-600 dark:bg-brand-950 dark:text-brand-300">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-ink-50">
              For providers
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-ink-400">
              Showcase your portfolio, set your own prices, receive booking
              requests from serious students and get paid through a secure,
              trackable flow — no chasing people for payment.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/signup" className="btn-primary btn-sm">
                Become a provider
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <CtaBand
        title="Join Servicely today"
        subtitle="Create a free account to book services or start offering yours to the ABUAD community."
        primaryLabel="Get Started"
        primaryTo="/signup"
        secondaryLabel="Browse Services"
        secondaryTo="/services"
      />

      <Footer />
    </div>
  );
}
