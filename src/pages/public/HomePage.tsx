import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CalendarDays,
  CreditCard,
  Lock,
  MessageSquareText,
  PartyPopper,
  PenLine,
  Search,
  Sparkles,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { PublicNavbar, Footer } from '@/components/shared';
import {
  Badge,
  MarketplaceProviderCard,
  ReviewCard,
  SectionHeading,
  SkeletonCard,
  providerId,
  type ProviderLike,
} from '@/components/ui';
import { categories } from '@/data/mockData';
import {
  useApprovedServices,
  useRecommendedProviders,
} from '@/hooks/queries';

/* =========================================================
   CONFIG
========================================================= */

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?fm=jpg&q=75&w=1400&auto=format&fit=crop';

/* =========================================================
   STATIC PRESENTATION DATA (taxonomy only — no fake listings)
========================================================= */

interface ExtraCategory {
  id: string;
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
}

const extraCategories: ExtraCategory[] = [
  // {
  //   id: 'event-planning',
  //   name: 'Event Planning',
  //   slug: 'event-planning',
  //   icon: PartyPopper,
  //   description: 'Plan and coordinate campus events from idea to finish.',
  // },
  // {
  //   id: 'writing',
  //   name: 'Writing',
  //   slug: 'writing',
  //   icon: PenLine,
  //   description: 'Essays, reports, and content crafted with care.',
  // },
];

const trustIndicators = [
  {
    icon: BadgeCheck,
    title: 'Verified Providers',
    description: 'Profiles reviewed and approved before going live.',
  },
  {
    icon: Lock,
    title: 'Secure Payments',
    description: 'Protected checkout for every booking you make.',
  },
  {
    icon: CalendarCheck,
    title: 'Easy Booking',
    description: 'Request a date, time, and location in minutes.',
  },
  {
    icon: MessageSquareText,
    title: 'Rate & Review',
    description: 'Genuine feedback from students like you.',
  },
];

const steps = [
  {
    icon: Search,
    title: 'Discover',
    description:
      'Browse categories and compare verified student providers.',
  },
  {
    icon: CalendarDays,
    title: 'Book',
    description: 'Pick a date, time, and location that works for you.',
  },
  {
    icon: CreditCard,
    title: 'Pay Securely',
    description: 'Complete payment safely through protected checkout.',
  },
  {
    icon: Star,
    title: 'Rate',
    description:
      'Once it is done, leave a review to help others choose.',
  },
];

/* =========================================================
   MOTION PRESETS (subtle)
========================================================= */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

/* =========================================================
   API NORMALIZATION HELPERS
========================================================= */

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/**
 * Derives a unique provider list from the
 * `/provider/approved-services` response (`result.services`).
 */
function deriveProviders(services: unknown): ProviderLike[] {
  const seen = new Set<string>();
  const list: ProviderLike[] = [];

  for (const entry of toArray(services)) {
    if (!entry || typeof entry !== 'object') continue;

    const provider = (entry as { provider?: unknown }).provider;
    if (!provider || typeof provider !== 'object') continue;

    const p = provider as ProviderLike;
    const id =
      providerId(p) || String(p.fullName || p.name || '').trim();

    if (!id || seen.has(id)) continue;

    seen.add(id);
    list.push(p);
  }

  return list;
}

interface NormalizedReview {
  rating: number;
  comment?: string;
  reviewerName?: string;
  date?: string;
  avatar?: string;
}

/**
 * Normalizes the `/reviews/recommended` payload into review shapes.
 * The endpoint may return review objects directly, or provider
 * objects with an embedded review — both are handled.
 */
function normalizeReviews(payload: unknown): NormalizedReview[] {
  const data = payload as Record<string, unknown> | null;

  const rawList = Array.isArray(data)
    ? data
    : Array.isArray(data?.reviews)
      ? data.reviews
      : Array.isArray(data?.providers)
        ? data.providers
        : [];

  const out: NormalizedReview[] = [];

  for (const entry of rawList) {
    if (!entry || typeof entry !== 'object') continue;

    const item = entry as Record<string, unknown>;

    const embeddedRaw =
      item.latestReview ??
      item.review ??
      (Array.isArray(item.reviews) ? item.reviews[0] : undefined);

    const source =
      embeddedRaw && typeof embeddedRaw === 'object'
        ? (embeddedRaw as Record<string, unknown>)
        : item;

    const rating = Number(source.rating ?? 0);
    if (!Number.isFinite(rating) || rating <= 0) continue;

    const customerRaw =
      source.customer ?? source.reviewer ?? item.customer;

    const customer =
      customerRaw && typeof customerRaw === 'object'
        ? (customerRaw as Record<string, unknown>)
        : undefined;

    const reviewerName =
      String(
        source.reviewerName ??
          customer?.fullName ??
          customer?.name ??
          item.fullName ??
          item.name ??
          ''
      ).trim() || 'ABUAD Student';

    const avatar =
      typeof source.avatar === 'string'
        ? source.avatar
        : typeof customer?.avatar === 'string'
          ? customer.avatar
          : typeof customer?.profileImage === 'string'
            ? customer.profileImage
            : undefined;

    const comment =
      typeof source.comment === 'string' && source.comment.trim()
        ? source.comment.trim()
        : undefined;

    const dateRaw = source.createdAt ?? source.date ?? item.createdAt;
    const date = typeof dateRaw === 'string' ? dateRaw : undefined;

    out.push({ rating, comment, reviewerName, avatar, date });
  }

  return out;
}

/* =========================================================
   SMALL LOCAL PIECES
========================================================= */

function SectionRetry({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center dark:border-ink-800 dark:bg-ink-900/50 dark:text-ink-300"
    >
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="btn-outline btn-sm shrink-0"
      >
        Try again
      </button>
    </div>
  );
}

function CategoryTile({
  to,
  name,
  description,
  children,
}: {
  to: string;
  name: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="card-hover group flex h-full flex-col overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8FAFC] dark:focus-visible:ring-offset-ink-950"
    >
      {children}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900 transition-colors group-hover:text-brand-700 dark:text-ink-50 dark:group-hover:text-brand-300">
            {name}
          </h3>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lavender text-brand-700 transition-all group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-950/60 dark:text-brand-300 dark:group-hover:bg-brand-500 dark:group-hover:text-white">
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-ink-400">
          {description}
        </p>
      </div>
    </Link>
  );
}

/* =========================================================
   HOME PAGE
========================================================= */

export function HomePage() {
  const {
    data: approvedServices,
    isLoading: featuredLoading,
    isError: featuredError,
    refetch: refetchFeatured,
  } = useApprovedServices();

  const {
    data: recommendedProviders,
    isLoading: reviewsLoading,
    isError: reviewsError,
    refetch: refetchReviews,
  } = useRecommendedProviders(6);

  const featuredProviders = useMemo(
    () => deriveProviders(approvedServices).slice(0, 8),
    [approvedServices]
  );

  const reviews = useMemo(
    () => normalizeReviews(recommendedProviders).slice(0, 6),
    [recommendedProviders]
  );

  const showFeatured = featuredProviders.length > 0;
  const showReviews = reviews.length > 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-ink-950">
      <PublicNavbar />

      <main>
        {/* ===================================================
           HERO
        =================================================== */}
        <section
          aria-labelledby="hero-heading"
          className="relative isolate overflow-hidden bg-gradient-to-b from-lavender/80 via-[#F8FAFC] to-[#F8FAFC] dark:from-brand-950/50 dark:via-ink-950 dark:to-ink-950"
        >
          {/* Decorative glows */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
          >
            <div className="absolute -left-40 -top-48 h-[28rem] w-[28rem] rounded-full bg-brand-300/30 blur-3xl dark:bg-brand-800/20" />
            <div className="absolute -right-40 top-8 h-[26rem] w-[26rem] rounded-full bg-brand-200/40 blur-3xl dark:bg-ink-800/60" />
            <div className="absolute bottom-0 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-white/60 blur-3xl dark:bg-brand-900/20" />
          </div>

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-28 lg:pt-24">
            {/* Copy */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge
                tone="brand"
                icon={Sparkles}
                className="px-3 py-1 tracking-wide ring-1 ring-brand-200/70 dark:bg-brand-950/60 dark:ring-brand-800"
              >
                ABUAD Student Service Marketplace
              </Badge>

              <h1
                id="hero-heading"
                className="mt-6 text-balance text-[2.5rem] font-extrabold leading-[1.06] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-ink-50"
              >
                Get Your Campus Services{' '}
                <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 bg-clip-text text-transparent dark:from-brand-300 dark:via-brand-400 dark:to-brand-200">
                  Done Easily
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg dark:text-ink-300">
                Discover and book trusted student service providers for
                photography, design, makeup, events, and more. Compare
                portfolios, read genuine reviews, and pay securely —
                all in one place.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link to="/services" className="btn-primary btn-lg group">
                  Explore Services
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
                <Link to="/how-it-works" className="btn-outline btn-lg">
                  How It Works
                </Link>
              </div>
            </motion.div>

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative mx-auto w-full max-w-lg lg:max-w-none"
            >
              <div
                aria-hidden="true"
                className="absolute -inset-3 rounded-[2rem] bg-gradient-to-tr from-brand-200/70 via-lavender to-transparent blur-xl dark:from-brand-800/40 dark:via-brand-950/40"
              />
              <div
                aria-hidden="true"
                className="absolute -right-3 -top-3 h-full w-full rounded-[2rem] bg-gradient-to-br from-lavender to-brand-100 dark:from-brand-950 dark:to-ink-800 lg:-right-4 lg:-top-4"
              />
              <div className="relative overflow-hidden rounded-[2rem] shadow-soft ring-1 ring-slate-900/5 dark:ring-ink-700/60">
                <img
                  src={HERO_IMAGE}
                  alt="Students collaborating together on campus"
                  className="h-72 w-full object-cover sm:h-96 lg:h-[470px]"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent"
                />
              </div>

              {/* Floating trust card */}
              <div className="absolute bottom-4 left-4 right-4 flex max-w-[19rem] items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-card backdrop-blur sm:bottom-6 sm:left-6 sm:right-auto dark:border-ink-800 dark:bg-ink-900/95">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lavender text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                  <BadgeCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-ink-50">
                    Verified student providers
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-ink-400">
                    Every provider is reviewed by our team before they
                    can take bookings.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ===================================================
           TRUST INDICATORS
        =================================================== */}
        <section
          aria-label="Why students trust Servicely"
          className="border-y border-slate-200/70 bg-white/80 backdrop-blur dark:border-ink-800 dark:bg-ink-900/40"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-x-6 gap-y-7 px-4 py-9 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:py-10">
            {trustIndicators.map((indicator, i) => (
              <motion.div
                key={indicator.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="flex items-start gap-3.5 rounded-2xl p-1.5 sm:p-2"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lavender text-brand-600 ring-1 ring-brand-100 dark:bg-brand-950 dark:text-brand-300 dark:ring-brand-900/70">
                  <indicator.icon
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-ink-50">
                    {indicator.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-ink-400">
                    {indicator.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ===================================================
           POPULAR SERVICES
        =================================================== */}
        <section
          aria-label="Popular services"
          className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24"
        >
          <SectionHeading
            title="Popular Services"
            subtitle="Find the right student professional for any occasion"
            action={
              <Link
                to="/services"
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              >
                View all services
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            }
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-40px' }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5"
          >
            {categories.map((cat) => (
              <motion.div key={cat.id} variants={fadeUp} className="h-full">
                <CategoryTile
                  to={`/services?category=${cat.slug}`}
                  name={cat.name}
                  description={cat.description}
                >
                  <div className="relative h-40 overflow-hidden bg-lavender sm:h-44">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"
                    />
                    <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-brand-700 shadow-sm backdrop-blur dark:bg-ink-900/90 dark:text-brand-300">
                      <cat.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                </CategoryTile>
              </motion.div>
            ))}

            {extraCategories.map((cat) => (
              <motion.div key={cat.id} variants={fadeUp} className="h-full">
                <CategoryTile
                  to={`/services?category=${cat.slug}`}
                  name={cat.name}
                  description={cat.description}
                >
                  <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-lavender to-brand-100 sm:h-44 dark:from-brand-950 dark:to-ink-800">
                    <div
                      aria-hidden="true"
                      className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/40 blur-2xl dark:bg-brand-500/10"
                    />
                    <cat.icon
                      className="relative h-10 w-10 text-brand-600 transition-transform duration-500 group-hover:scale-110 dark:text-brand-300"
                      aria-hidden="true"
                    />
                  </div>
                </CategoryTile>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ===================================================
           FEATURED PROVIDERS (hidden when no real data)
        =================================================== */}
        {(featuredLoading || showFeatured) && (
          <section
            aria-label="Featured providers"
            aria-busy={featuredLoading}
            className="border-y border-slate-200/70 bg-white py-16 dark:border-ink-800 dark:bg-ink-900/40 sm:py-20 lg:py-24"
          >
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <SectionHeading
                title="Featured Providers"
                subtitle="Top-rated professionals ready to book"
                action={
                  <Link
                    to="/providers"
                    className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    Browse all providers
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                }
              />

              {featuredError && showFeatured && (
                <SectionRetry
                  message="We couldn't refresh featured providers. Showing the latest available results."
                  onRetry={() => void refetchFeatured()}
                />
              )}

              {featuredLoading ? (
                <div
                  role="status"
                  aria-label="Loading featured providers"
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-5"
                >
                  <span className="sr-only">Loading featured providers…</span>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : (
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-40px' }}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-5"
                >
                  {featuredProviders.map((provider) => (
                    <motion.div
                      key={providerId(provider)}
                      variants={fadeUp}
                      className="h-full"
                    >
                      <MarketplaceProviderCard provider={provider} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </section>
        )}

        {/* ===================================================
           HOW IT WORKS
        =================================================== */}
        <section
          aria-label="How it works"
          className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24"
        >
          <SectionHeading
            title="How It Works"
            subtitle="Book a campus service in four simple steps"
            align="center"
          />

          <div className="relative mt-12">
            <div
              aria-hidden="true"
              className="absolute left-[12%] right-[12%] top-7 hidden h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent lg:block dark:via-ink-700"
            />

            <ol className="relative grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {steps.map((step, i) => (
                <motion.li
                  key={step.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="group relative text-center sm:text-left"
                >
                  <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lavender text-brand-600 ring-1 ring-brand-100 transition-transform duration-200 group-hover:-translate-y-0.5 dark:bg-brand-950 dark:text-brand-300 dark:ring-brand-900/70 sm:mx-0">
                    <step.icon className="h-6 w-6" aria-hidden="true" />
                    <span
                      aria-hidden="true"
                      className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white shadow-sm"
                    >
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-ink-50">
                    {step.title}
                  </h3>
                  <p className="mx-auto mt-1.5 max-w-[16rem] text-sm leading-relaxed text-slate-500 dark:text-ink-400 sm:mx-0">
                    {step.description}
                  </p>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        {/* ===================================================
           TESTIMONIALS (hidden when no real data)
        =================================================== */}
        {(reviewsLoading || showReviews) && (
          <section
            aria-label="Testimonials"
            aria-busy={reviewsLoading}
            className="border-y border-slate-200/70 bg-white py-16 dark:border-ink-800 dark:bg-ink-900/40 sm:py-20 lg:py-24"
          >
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <SectionHeading
                align="center"
                title="Loved by the ABUAD Community"
                subtitle="Real feedback from students who booked through Servicely"
              />

              {reviewsError && showReviews && (
                <SectionRetry
                  message="We couldn't refresh testimonials. Showing the latest available reviews."
                  onRetry={() => void refetchReviews()}
                />
              )}

              {reviewsLoading ? (
                <div
                  role="status"
                  aria-label="Loading testimonials"
                  className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5"
                >
                  <span className="sr-only">Loading testimonials…</span>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : (
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-40px' }}
                  className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5"
                >
                  {reviews.map((review, i) => (
                    <motion.div
                      key={`${review.reviewerName ?? 'review'}-${i}`}
                      variants={fadeUp}
                      className="h-full"
                    >
                      <ReviewCard {...review} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </section>
        )}

        {/* ===================================================
           FINAL CTA
        =================================================== */}
        <section
          aria-label="Get started with Servicely"
          className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45 }}
            className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-6 py-14 text-center shadow-soft sm:px-12 lg:py-20"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-brand-400/40 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_55%)]"
            />

            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to Get Your Campus Services Done?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
                Create a free account, discover trusted student
                providers, and book your next service with confidence.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/signup"
                  className="btn group bg-white px-7 py-3.5 text-base text-brand-700 shadow-sm hover:bg-lavender"
                >
                  Get Started
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
                <Link
                  to="/services"
                  className="btn border border-white/30 bg-transparent px-7 py-3.5 text-base text-white hover:bg-white/10"
                >
                  Browse Services
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
