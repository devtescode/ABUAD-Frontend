import { useEffect, useState, type ReactNode } from 'react';
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

/* =========================================================
   CONFIG
========================================================= */

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  {
    id: 'event-planning',
    name: 'Event Planning',
    slug: 'event-planning',
    icon: PartyPopper,
    description: 'Plan and coordinate campus events from idea to finish.',
  },
  {
    id: 'writing',
    name: 'Writing',
    slug: 'writing',
    icon: PenLine,
    description: 'Essays, reports, and content crafted with care.',
  },
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
      className="card-hover group flex h-full flex-col overflow-hidden"
    >
      {children}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900 dark:text-ink-50">
            {name}
          </h3>
          <ArrowRight
            className="h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-500 dark:text-ink-600 dark:group-hover:text-brand-400"
            aria-hidden="true"
          />
        </div>
        <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-ink-400">
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
  const [featuredProviders, setFeaturedProviders] = useState<
    ProviderLike[]
  >([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  const [reviews, setReviews] = useState<NormalizedReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  /* -------------------------------------------------------
     FEATURED PROVIDERS — public, no auth header
  ------------------------------------------------------- */
  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const response = await fetch(
          `${API_URL}/provider/approved-services`,
          {
            method: 'GET',
            headers: { Accept: 'application/json' },
            cache: 'no-store',
            signal: controller.signal,
          }
        );

        const result: unknown = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error('Failed to load featured providers');
        }

        const services = (result as { services?: unknown } | null)
          ?.services;

        setFeaturedProviders(
          deriveProviders(services).slice(0, 8)
        );
      } catch {
        if (!controller.signal.aborted) {
          setFeaturedProviders([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setFeaturedLoading(false);
        }
      }
    };

    load();

    return () => controller.abort();
  }, []);

  /* -------------------------------------------------------
     TESTIMONIALS — public, no auth header
  ------------------------------------------------------- */
  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const response = await fetch(
          `${API_URL}/reviews/recommended?limit=6`,
          {
            method: 'GET',
            headers: { Accept: 'application/json' },
            cache: 'no-store',
            signal: controller.signal,
          }
        );

        const result: unknown = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error('Failed to load reviews');
        }

        setReviews(normalizeReviews(result).slice(0, 6));
      } catch {
        if (!controller.signal.aborted) {
          setReviews([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setReviewsLoading(false);
        }
      }
    };

    load();

    return () => controller.abort();
  }, []);

  const showFeatured = !featuredLoading && featuredProviders.length > 0;
  const showReviews = !reviewsLoading && reviews.length > 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-ink-950">
      <PublicNavbar />

      <main>
        {/* ===================================================
           HERO
        =================================================== */}
        <section
          aria-labelledby="hero-heading"
          className="relative overflow-hidden"
        >
          {/* Decorative glows */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-32 -top-40 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl dark:bg-brand-900/25"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 top-16 h-96 w-96 rounded-full bg-lavender blur-3xl dark:bg-ink-800/50"
          />

          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:pb-24 lg:pt-20">
            {/* Copy */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge
                tone="brand"
                icon={Sparkles}
                className="bg-lavender px-3 py-1 dark:bg-brand-950/60"
              >
                ABUAD Student Service Marketplace
              </Badge>

              <h1
                id="hero-heading"
                className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-ink-50"
              >
                Get Your Campus Services{' '}
                <span className="text-brand-600 dark:text-brand-400">
                  Done Easily
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-slate-500 sm:text-lg dark:text-ink-400">
                Discover and book trusted student service providers for
                photography, design, makeup, events, and more. Compare
                portfolios, read genuine reviews, and pay securely —
                all in one place.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/services" className="btn-primary btn-lg">
                  Explore Services
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
              className="relative"
            >
              <div
                aria-hidden="true"
                className="absolute -right-2 -top-4 h-full w-full rounded-3xl bg-lavender lg:-right-4 dark:bg-brand-950/50"
              />
              <div className="relative overflow-hidden rounded-3xl shadow-card ring-1 ring-slate-900/5 dark:ring-ink-700/60">
                <img
                  src={HERO_IMAGE}
                  alt="Students collaborating together on campus"
                  className="h-72 w-full object-cover sm:h-96 lg:h-[460px]"
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
          className="border-y border-slate-200/70 bg-white dark:border-ink-800 dark:bg-ink-900/40"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {trustIndicators.map((indicator, i) => (
              <motion.div
                key={indicator.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="flex items-start gap-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lavender text-brand-600 dark:bg-brand-950 dark:text-brand-300">
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
          className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20"
        >
          <SectionHeading
            title="Popular Services"
            subtitle="Find the right student professional for any occasion"
            action={
              <Link
                to="/services"
                className="text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              >
                View all services →
              </Link>
            }
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-40px' }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {categories.map((cat) => (
              <motion.div key={cat.id} variants={fadeUp}>
                <CategoryTile
                  to={`/services?category=${cat.slug}`}
                  name={cat.name}
                  description={cat.description}
                >
                  <div className="relative h-40 overflow-hidden bg-lavender">
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
                    <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-brand-700 backdrop-blur dark:bg-ink-900/90 dark:text-brand-300">
                      <cat.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                </CategoryTile>
              </motion.div>
            ))}

            {extraCategories.map((cat) => (
              <motion.div key={cat.id} variants={fadeUp}>
                <CategoryTile
                  to={`/services?category=${cat.slug}`}
                  name={cat.name}
                  description={cat.description}
                >
                  <div className="flex h-40 items-center justify-center bg-gradient-to-br from-lavender to-brand-100 dark:from-brand-950 dark:to-ink-800">
                    <cat.icon
                      className="h-10 w-10 text-brand-600 dark:text-brand-300"
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
            className="border-y border-slate-200/70 bg-white py-16 dark:border-ink-800 dark:bg-ink-900/40 lg:py-20"
          >
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <SectionHeading
                title="Featured Providers"
                subtitle="Top-rated professionals ready to book"
                action={
                  <Link
                    to="/providers"
                    className="text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    Browse all providers →
                  </Link>
                }
              />

              {featuredLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                  {featuredProviders.map((provider) => (
                    <motion.div
                      key={providerId(provider)}
                      variants={fadeUp}
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
          className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20"
        >
          <SectionHeading
            title="How It Works"
            subtitle="Book a campus service in four simple steps"
            align="center"
          />

          <ol className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {steps.map((step, i) => (
              <motion.li
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="relative text-center sm:text-left"
              >
                <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lavender text-brand-600 dark:bg-brand-950 dark:text-brand-300 sm:mx-0">
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
        </section>

        {/* ===================================================
           TESTIMONIALS (hidden when no real data)
        =================================================== */}
        {(reviewsLoading || showReviews) && (
          <section
            aria-label="Testimonials"
            className="border-y border-slate-200/70 bg-white py-16 dark:border-ink-800 dark:bg-ink-900/40 lg:py-20"
          >
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <SectionHeading
                align="center"
                title="Loved by the ABUAD Community"
                subtitle="Real feedback from students who booked through Servicely"
              />

              {reviewsLoading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                  className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                >
                  {reviews.map((review, i) => (
                    <motion.div
                      key={`${review.reviewerName ?? 'review'}-${i}`}
                      variants={fadeUp}
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
          className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45 }}
            className="relative overflow-hidden rounded-3xl bg-brand-600 px-6 py-14 text-center shadow-soft sm:px-12 lg:py-16"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-brand-400/40 blur-2xl"
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
                  className="btn bg-white px-7 py-3.5 text-base text-brand-700 shadow-sm hover:bg-lavender"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
