import { motion } from 'framer-motion';
import { PublicNavbar, Footer, ProviderCard } from '@/components/shared';
import { providers } from '@/data/mockData';
import { Search, Users, Calendar, Star, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ProvidersPage() {
  const verified = providers.filter((p) => p.verified);
  return (
    <div className="min-h-screen bg-ink-50">
      <PublicNavbar />
      <div className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold text-ink-900 dark:text-ink-50">All Providers</h1>
          <p className="mt-1 text-ink-500">Browse all verified service providers on the platform</p>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {verified.map((provider, i) => (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <ProviderCard provider={provider} />
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export function HowItWorksPage() {
  const steps = [
    { icon: Search, title: 'Find a Service', desc: 'Search for the service you need from our categories — photography, videography, design, and makeup.' },
    { icon: Users, title: 'Choose a Provider', desc: 'Compare profiles, portfolios, ratings and prices to find the perfect match for your needs.' },
    { icon: Calendar, title: 'Book Your Service', desc: 'Select your preferred date, time and location. Add any special requests and submit your booking.' },
    { icon: Star, title: 'Get the Service & Review', desc: 'After the service is completed, leave a rating and review to help other students choose.' },
  ];

  return (
    <div className="min-h-screen bg-ink-50">
      <PublicNavbar />
      <section className="relative overflow-hidden border-b border-ink-100 bg-white">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary-100/50 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:py-24">
          <span className="badge bg-primary-100 text-primary-700 mb-4">Simple Process</span>
          <h1 className="font-display text-3xl font-bold text-ink-900 dark:text-ink-50 sm:text-5xl">How Servicely Works</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-600">
            From discovery to delivery, we make booking professional services effortless for ABUAD students.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-6"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-md">
                <step.icon className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary-600">Step {i + 1}</span>
                </div>
                <h3 className="mt-1 text-xl font-bold text-ink-900 dark:text-ink-50">{step.title}</h3>
                <p className="mt-2 text-ink-600">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 p-8 text-center sm:p-12">
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Ready to get started?</h2>
          <p className="mx-auto mt-2 max-w-xl text-primary-100">Browse our verified providers and book your next service today.</p>
          <Link to="/services" className="btn-accent btn-lg mt-6">
            Browse Services <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export function AboutPage() {
  return (
    <div className="min-h-screen bg-ink-50">
      <PublicNavbar />
      <section className="relative overflow-hidden border-b border-ink-100 bg-white">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent-100/50 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:py-24">
          <span className="badge bg-accent-100 text-accent-700 mb-4">Our Story</span>
          <h1 className="font-display text-3xl font-bold text-ink-900 dark:text-ink-50 sm:text-5xl">About Servicely</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-600">
            We are building Nigeria's most trusted student service marketplace — starting at ABUAD and expanding nationwide.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-lg max-w-none">
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">Our Mission</h2>
          <p className="mt-3 text-ink-600">
            Servicely connects students who need professional services with verified service providers who offer them. We believe finding a photographer, videographer, designer, or makeup artist should be as simple as ordering food online — transparent, secure, and reliable.
          </p>
          <h2 className="mt-8 font-display text-2xl font-bold text-ink-900">Why Servicely?</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { icon: CheckCircle2, title: 'Verified Providers', desc: 'Every provider is reviewed and approved before joining.' },
              { icon: Star, title: 'Real Reviews', desc: 'Genuine feedback from students who completed bookings.' },
              { icon: Users, title: 'Student-First', desc: 'Built for the ABUAD community with student needs in mind.' },
              { icon: ArrowRight, title: 'Scaling Nationwide', desc: 'Designed to expand to other universities and cities.' },
            ].map((item) => (
              <div key={item.title} className="card p-5">
                <item.icon className="h-6 w-6 text-primary-600" />
                <h3 className="mt-2 font-semibold text-ink-900">{item.title}</h3>
                <p className="mt-1 text-sm text-ink-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
