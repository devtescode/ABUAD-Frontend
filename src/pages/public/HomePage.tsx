import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, ArrowRight, ShieldCheck, Star, Camera, Sparkles, Heart, Users, Calendar, CheckCircle2, Quote, Zap } from 'lucide-react';
import { PublicNavbar, Footer, ProviderCard, StarRating } from '@/components/shared';
import { categories, providers } from '@/data/mockData';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function SectionHeader({ title, subtitle, align = 'left' }: { title: string; subtitle?: string; align?: 'left' | 'center' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4 }}
      className={align === 'center' ? 'text-center' : ''}
    >
      <h2 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-50 sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-1.5 text-ink-500 dark:text-ink-400">{subtitle}</p>}
    </motion.div>
  );
}

export function HomePage() {
  const [search, setSearch] = useState('');
  const featured = providers.filter((p) => p.featured && p.verified);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <PublicNavbar />

      {/* Hero */}
      <section
        ref={heroRef}
        className="relative isolate min-h-[720px] overflow-hidden border-b border-ink-800"
      >
        {/* Background photograph */}
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1605076896228-086cda8868c9?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8cGVyc29uJTIwbG9va2luZyUyMGF0JTIwY2FtZXJhfGVufDB8fDB8fHww')",
          }}
        />

        {/* Dark overlay for readability */}
        <div className="absolute inset-0 -z-10 bg-black/60" />

        {/* Subtle primary-color gradient */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-950/80 via-black/40 to-black/70" />

        {/* Decorative glow */}
        <div className="absolute left-1/2 top-0 -z-10 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary-500/10 blur-3xl" />

        <motion.div
          style={{ y: heroY }}
          className="relative mx-auto flex min-h-[720px] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto w-full max-w-4xl text-center"
          >
            {/* Trust badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-7 flex justify-center"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-md">
                <ShieldCheck className="h-4 w-4 text-primary-300" />
                Trusted by ABUAD students
              </span>
            </motion.div>

            {/* Heading */}
            <h1 className="text-balance text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-7xl">
              Find trusted service providers for your{' '}
              <span className="text-primary-300">next project</span>
            </h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/75 sm:text-lg"
            >
              Book verified photographers, videographers, designers, and makeup
              artists. Compare portfolios, read reviews, and pay securely all in
              one place.
            </motion.p>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mx-auto mt-9 max-w-2xl"
            >
              <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:bg-ink-900/95">
                <Search className="ml-3 h-5 w-5 shrink-0 text-ink-400" />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search photography, makeup, design..."
                  className="min-w-0 flex-1 bg-transparent px-1 py-3 text-base text-ink-900 outline-none placeholder:text-ink-400 sm:text-sm dark:text-white"
                />

                <Link
                  to={`/services?q=${encodeURIComponent(search)}`}
                  className="shrink-0 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-primary-700 hover:shadow-primary-600/30"
                >
                  Search
                </Link>
              </div>
            </motion.div>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm text-white/75"
            >
              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary-300" />
                </span>
                Verified providers
              </span>

              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-500/20">
                  <Star className="h-3.5 w-3.5 text-accent-300" />
                </span>
                Real reviews
              </span>

              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500/20">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary-300" />
                </span>
                Secure payments
              </span>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mx-auto mt-14 grid max-w-2xl grid-cols-3 divide-x divide-white/15 border-t border-white/15 pt-8"
            >
              {[
                { value: '72+', label: 'Verified Providers' },
                { value: '1,200+', label: 'Happy Students' },
                { value: '4.9★', label: 'Average Rating' },
              ].map((stat) => (
                <div key={stat.label} className="px-3 text-center">
                  <p className="text-2xl font-bold text-white sm:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[11px] text-white/55 sm:text-xs">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Bottom fade into the next section */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/10 to-transparent dark:from-ink-900/30" />
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <SectionHeader title="Browse by category" subtitle="Find the right professional for any occasion" />
          <Link to="/services" className="hidden text-sm font-semibold text-primary-600 hover:text-primary-700 sm:block">
            View all →
          </Link>
        </div>
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {categories.map((cat) => (
            <motion.div key={cat.id} variants={item} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <Link to={`/services?category=${cat.slug}`} className="group relative block overflow-hidden rounded-xl border border-ink-100">
                <div className="relative h-44 overflow-hidden">
                  <img src={cat.image} alt={cat.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-70 mix-blend-multiply`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 to-transparent" />
                </div>
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    <cat.icon className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-white">{cat.name}</h3>
                  <p className="mt-0.5 text-xs text-white/70 line-clamp-2">{cat.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Featured Providers */}
      <section className="border-y border-ink-100 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <SectionHeader title="Featured providers" subtitle="Top-rated professionals, ready to book" />
            <Link to="/providers" className="hidden text-sm font-semibold text-primary-600 hover:text-primary-700 sm:block">
              View all →
            </Link>
          </div>
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((provider) => (
              <motion.div key={provider.id} variants={item}>
                <ProviderCard provider={provider} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeader title="How it works" subtitle="Book a service in four simple steps" align="center" />
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Search, title: 'Find a Service', desc: 'Search for the service you need from our categories.' },
            { icon: Users, title: 'Choose a Provider', desc: 'Compare profiles, portfolios, ratings and prices.' },
            { icon: Calendar, title: 'Book', desc: 'Select your preferred date, time and location.' },
            { icon: Star, title: 'Get the Service', desc: 'Complete the service and leave a review.' },
          ].map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="relative text-center"
            >
              <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-ink-100 text-ink-700">
                <step.icon className="h-6 w-6" />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink-900 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink-900 dark:text-ink-50">{step.title}</h3>
              <p className="mt-1 text-sm text-ink-500">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-ink-100 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeader title="What students say" subtitle="Real experiences from the ABUAD community" align="center" />
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { name: 'Chioma O.', text: 'Found an amazing photographer for my birthday in minutes. The whole process was so smooth!', rating: 5, role: 'Student' },
              { name: 'Tunde A.', text: 'Servicely made it easy to compare providers and pick the best one. Highly recommend.', rating: 5, role: 'Student' },
              { name: 'Fatima I.', text: 'The makeup artist I booked was professional and talented. Will definitely use again.', rating: 5, role: 'Student' },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="card p-6"
              >
                <div className="flex items-center justify-between">
                  <Quote className="h-7 w-7 text-ink-200" />
                  <StarRating rating={t.rating} />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">{t.text}</p>
                <div className="mt-5 flex items-center gap-3 border-t border-ink-100 pt-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-100 text-sm font-semibold text-ink-700">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{t.name}</p>
                    <p className="text-xs text-ink-400">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeader title="Book with confidence" subtitle="Every provider on Servicely goes through a verification process. We prioritize your safety at every step." align="center" />
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: ShieldCheck, title: 'Verified Providers', desc: 'Every provider is reviewed and approved by our team before they can receive bookings.' },
            { icon: Star, title: 'Ratings & Reviews', desc: 'Read genuine reviews from students who have booked and completed services.' },
            { icon: Camera, title: 'Portfolio Verification', desc: 'Browse real work samples to ensure quality before you book.' },
            { icon: CheckCircle2, title: 'Completed Booking Count', desc: 'See how many successful bookings each provider has completed.' },
            { icon: Heart, title: 'Transparent Pricing', desc: 'Know the price upfront. No hidden fees, no surprises.' },
            { icon: Users, title: 'Admin Oversight', desc: 'Our team monitors the platform to resolve disputes and maintain quality.' },
          ].map((it) => (
            <motion.div key={it.title} variants={item} className="card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-100 text-ink-700">
                <it.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-ink-900">{it.title}</h3>
              <p className="mt-1 text-sm text-ink-500">{it.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl border border-ink-100 bg-ink-900 px-6 py-12 text-center sm:px-12 sm:py-16"
        >
          <div className="relative">
            <span className="badge bg-white/10 text-white mb-4">
              <Zap className="h-3.5 w-3.5" /> Get started today
            </span>
            <h2 className="text-2xl font-bold text-white text-balance sm:text-4xl">Ready to book your next service?</h2>
            <p className="mx-auto mt-3 max-w-xl text-ink-400">
              Join hundreds of ABUAD students who trust Servicely for their professional service needs.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/services" className="btn-accent btn-lg">
                Book a Service <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/signup" className="btn-lg btn border border-ink-700 bg-ink-800 text-white hover:bg-ink-700">
                Become a Provider
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
