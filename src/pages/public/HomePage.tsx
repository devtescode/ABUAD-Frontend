import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowRight, ShieldCheck, Star, Camera, Video, Palette, Sparkles, Heart, Users, Calendar, CheckCircle2, Quote } from 'lucide-react';
import { PublicNavbar, Footer, ProviderCard, StarRating } from '@/components/shared';
import { categories, providers, formatNaira } from '@/data/mockData';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function HomePage() {
  const [search, setSearch] = useState('');
  const featured = providers.filter((p) => p.featured && p.verified);

  return (
    <div className="min-h-screen bg-ink-50">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50" />
        <motion.div
          className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary-200/40 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -left-32 top-40 h-72 w-72 rounded-full bg-accent-200/30 blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="badge bg-primary-100 text-primary-700 mb-4"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Trusted by ABUAD students
            </motion.span>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
              Find trusted service providers for your{' '}
              <span className="gradient-text">next project</span>
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mx-auto mt-6 max-w-2xl text-lg text-ink-600"
            >
              Book verified photographers, videographers, designers, and makeup artists. Compare portfolios, read reviews, and pay securely — all in one place.
            </motion.p>

            {/* Search bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-2xl border border-ink-200 bg-white p-2 shadow-xl shadow-primary-900/5"
            >
              <Search className="ml-3 h-5 w-5 text-ink-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for photography, makeup, design..."
                className="flex-1 bg-transparent text-sm outline-none placeholder-ink-400"
              />
              <Link to={`/services?q=${encodeURIComponent(search)}`} className="btn-primary">
                Search
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-500"
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary-500" /> Verified providers
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-accent-500" /> Real reviews
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary-500" /> Secure payments
              </span>
            </motion.div>

            {/* Stats strip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mx-auto mt-12 grid max-w-lg grid-cols-3 gap-4"
            >
              {[
                { value: '72+', label: 'Verified Providers' },
                { value: '1,200+', label: 'Happy Students' },
                { value: '4.9★', label: 'Average Rating' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-display text-2xl font-bold text-ink-900">{stat.value}</p>
                  <p className="text-xs text-ink-500">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 flex items-end justify-between"
        >
          <div>
            <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">Browse by category</h2>
            <p className="mt-1 text-ink-500">Find the right professional for any occasion</p>
          </div>
          <Link to="/services" className="hidden text-sm font-semibold text-primary-600 hover:text-primary-700 sm:block">
            View all →
          </Link>
        </motion.div>
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {categories.map((cat) => (
            <motion.div key={cat.id} variants={item} whileHover={{ y: -6 }} className="card-glow">
              <Link to={`/services?category=${cat.slug}`} className="group relative block overflow-hidden rounded-2xl">
                <div className="relative h-48 overflow-hidden">
                  <img src={cat.image} alt={cat.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-80 mix-blend-multiply`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 to-transparent" />
                </div>
                <div className="absolute inset-0 flex flex-col justify-end p-5">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <cat.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{cat.name}</h3>
                  <p className="mt-1 text-xs text-white/80 line-clamp-2">{cat.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Featured Providers */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 flex items-end justify-between"
          >
            <div>
              <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">Featured providers</h2>
              <p className="mt-1 text-ink-500">Top-rated professionals, ready to book</p>
            </div>
            <Link to="/providers" className="hidden text-sm font-semibold text-primary-600 hover:text-primary-700 sm:block">
              View all →
            </Link>
          </motion.div>
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((provider) => (
              <motion.div key={provider.id} variants={item}>
                <ProviderCard provider={provider} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
          <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">How it works</h2>
          <p className="mt-1 text-ink-500">Book a service in four simple steps</p>
        </motion.div>
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Search, title: 'Find a Service', desc: 'Search for the service you need from our categories.' },
            { icon: Users, title: 'Choose a Provider', desc: 'Compare profiles, portfolios, ratings and prices.' },
            { icon: Calendar, title: 'Book', desc: 'Select your preferred date, time and location.' },
            { icon: Star, title: 'Get the Service', desc: 'Complete the service and leave a review.' },
          ].map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative text-center"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600"
              >
                <step.icon className="h-7 w-7" />
              </motion.div>
              <div className="absolute left-1/2 top-7 hidden h-0.5 w-full -translate-x-0 bg-ink-200 lg:block" style={{ zIndex: -1 }} />
              <h3 className="mt-4 text-lg font-semibold text-ink-900">{i + 1}. {step.title}</h3>
              <p className="mt-1 text-sm text-ink-500">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
            <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">What students say</h2>
            <p className="mt-1 text-ink-500">Real experiences from the ABUAD community</p>
          </motion.div>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { name: 'Chioma O.', text: 'Found an amazing photographer for my birthday in minutes. The whole process was so smooth!', rating: 5 },
              { name: 'Tunde A.', text: 'Servicely made it easy to compare providers and pick the best one. Highly recommend.', rating: 5 },
              { name: 'Fatima I.', text: 'The makeup artist I booked was professional and talented. Will definitely use again.', rating: 5 },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-6"
              >
                <Quote className="h-8 w-8 text-primary-200" />
                <p className="mt-3 text-sm text-ink-600">{t.text}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                      {t.name[0]}
                    </div>
                    <span className="text-sm font-semibold text-ink-900">{t.name}</span>
                  </div>
                  <StarRating rating={t.rating} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="bg-ink-900 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
            <span className="badge bg-primary-500/20 text-primary-300 mb-4">
              <ShieldCheck className="h-3.5 w-3.5" /> Trust & Safety
            </span>
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Book with confidence</h2>
            <p className="mx-auto mt-2 max-w-2xl text-ink-400">
              Every provider on Servicely goes through a verification process. We prioritize your safety at every step.
            </p>
          </motion.div>
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: ShieldCheck, title: 'Verified Providers', desc: 'Every provider is reviewed and approved by our team before they can receive bookings.' },
              { icon: Star, title: 'Ratings & Reviews', desc: 'Read genuine reviews from students who have booked and completed services.' },
              { icon: Camera, title: 'Portfolio Verification', desc: 'Browse real work samples to ensure quality before you book.' },
              { icon: CheckCircle2, title: 'Completed Booking Count', desc: 'See how many successful bookings each provider has completed.' },
              { icon: Heart, title: 'Transparent Pricing', desc: 'Know the price upfront. No hidden fees, no surprises.' },
              { icon: Users, title: 'Admin Oversight', desc: 'Our team monitors the platform to resolve disputes and maintain quality.' },
            ].map((it) => (
              <motion.div key={it.title} variants={item} whileHover={{ y: -4 }} className="rounded-2xl border border-ink-800 bg-ink-800/50 p-6 transition-colors hover:border-primary-500/30">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/20 text-primary-400">
                  <it.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-white">{it.title}</h3>
                <p className="mt-1 text-sm text-ink-400">{it.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 px-6 py-12 text-center sm:px-12 sm:py-16"
        >
          <motion.div
            className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent-400/20 blur-2xl"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          />
          <div className="relative">
            <h2 className="font-display text-2xl font-bold text-white sm:text-4xl">Ready to book your next service?</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-100">
              Join hundreds of ABUAD students who trust Servicely for their professional service needs.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/services" className="btn-accent btn-lg">
                Book a Service <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/signup" className="btn-lg btn border border-white/30 bg-white/10 text-white hover:bg-white/20">
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
