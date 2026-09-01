import { motion } from 'framer-motion';
import { PublicNavbar, Footer, ProviderCard, StarRating, VerifiedBadge } from '@/components/shared';
import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { Heart, MapPin, Calendar, CheckCircle2, ArrowRight, Share2 } from 'lucide-react';
import { getProviderById, getReviewsByProvider, formatNaira } from '@/data/mockData';
import { useBookings } from '@/context/AppContext';

export function ProviderProfilePage() {
  const { id } = useParams();
  const provider = getProviderById(id || '');
  const { savedProviders, toggleSavedProvider } = useBookings();
  const [tab, setTab] = useState<'services' | 'portfolio' | 'reviews' | 'availability'>('services');

  if (!provider) {
    return (
      <div className="min-h-screen bg-ink-50">
        <PublicNavbar />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-ink-900">Provider not found</h1>
          <Link to="/providers" className="btn-primary mt-4">Back to providers</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const providerReviews = getReviewsByProvider(provider.id);
  const isSaved = savedProviders.includes(provider.id);

  return (
    <div className="min-h-screen bg-ink-50">
      <PublicNavbar />

      {/* Cover */}
      <div className="relative h-48 overflow-hidden sm:h-64">
        <img src={provider.portfolio[0]?.image} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 to-ink-900/20" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Profile header */}
        <div className="relative -mt-16 rounded-2xl border border-ink-100 bg-white p-6 shadow-sm sm:-mt-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <img src={provider.avatar} alt={provider.name} className="h-20 w-20 rounded-2xl border-4 border-white object-cover shadow-md sm:h-24 sm:w-24" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">{provider.name}</h1>
                  {provider.verified && <VerifiedBadge size="md" />}
                </div>
                <p className="mt-1 text-sm text-ink-500">{provider.categories.join(' • ')}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-600">
                  <span className="flex items-center gap-1">
                    <StarRating rating={provider.rating} /> {provider.rating} ({provider.reviewCount})
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-primary-500" /> {provider.completedBookings} bookings
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-ink-400" /> {provider.location}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toggleSavedProvider(provider.id)}
                className={`btn-outline btn-sm ${isSaved ? 'border-red-200 text-red-600' : ''}`}
              >
                <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                {isSaved ? 'Saved' : 'Save'}
              </button>
              <button className="btn-outline btn-sm">
                <Share2 className="h-4 w-4" />
              </button>
              <Link to={`/book/${provider.id}`} className="btn-primary">
                Book Now <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="mt-6 card p-6">
          <h2 className="font-semibold text-ink-900">About</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">{provider.about}</p>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 border-b border-ink-100">
          {(['services', 'portfolio', 'reviews', 'availability'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-4 py-3 text-sm font-medium capitalize transition-colors ${tab === t ? 'text-primary-600' : 'text-ink-500 hover:text-ink-700'}`}
            >
              {t}
              {tab === t && <motion.div layoutId="tab-underline" className="absolute inset-x-0 -bottom-px h-0.5 bg-primary-600" />}
            </button>
          ))}
        </div>

        <div className="mt-6 pb-16">
          {tab === 'services' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {provider.services.filter((s) => s.active).map((service) => (
                <div key={service.id} className="card overflow-hidden">
                  <img src={service.image} alt={service.title} className="h-40 w-full object-cover" />
                  <div className="p-4">
                    <h3 className="font-semibold text-ink-900">{service.title}</h3>
                    <p className="mt-1 text-xs text-ink-500 line-clamp-2">{service.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-ink-900">{formatNaira(service.price)}</span>
                        <span className="ml-1 text-xs text-ink-400">/ {service.duration}</span>
                      </div>
                    </div>
                    <Link to={`/book/${provider.id}?service=${service.id}`} className="btn-primary btn-sm mt-3 w-full">
                      Book This Service
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'portfolio' && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {provider.portfolio.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  className="group relative overflow-hidden rounded-xl"
                >
                  <img src={item.image} alt={item.title} className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute bottom-0 left-0 p-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-white/70">{item.category}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {tab === 'reviews' && (
            <div className="space-y-4">
              <div className="card flex items-center gap-6 p-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-ink-900">{provider.rating}</p>
                  <StarRating rating={provider.rating} size={18} />
                  <p className="mt-1 text-xs text-ink-500">{provider.reviewCount} reviews</p>
                </div>
                <div className="flex-1 space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = providerReviews.filter((r) => r.rating === star).length;
                    const pct = providerReviews.length ? (count / providerReviews.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-3 text-ink-500">{star}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                          <div className="h-full rounded-full bg-accent-400" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-6 text-ink-400">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {providerReviews.map((review) => (
                <div key={review.id} className="card p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                        {review.customerName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink-900">{review.customerName}</p>
                        <p className="text-xs text-ink-400">{review.date}</p>
                      </div>
                    </div>
                    <StarRating rating={review.rating} />
                  </div>
                  <p className="mt-3 text-sm text-ink-600">{review.comment}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'availability' && (
            <div className="card overflow-hidden">
              <div className="border-b border-ink-100 p-5">
                <h3 className="flex items-center gap-2 font-semibold text-ink-900">
                  <Calendar className="h-5 w-5 text-primary-600" /> Weekly Availability
                </h3>
              </div>
              <div className="divide-y divide-ink-100">
                {provider.availability.map((day) => (
                  <div key={day.day} className="flex items-center justify-between p-4">
                    <span className="text-sm font-medium text-ink-700">{day.day}</span>
                    {day.available ? (
                      <span className="text-sm text-ink-600">
                        {day.start} — {day.end}
                      </span>
                    ) : (
                      <span className="badge bg-ink-100 text-ink-500">Unavailable</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
