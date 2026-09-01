import { useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, ArrowLeft, Calendar, Clock, MapPin, FileText, CreditCard, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { PublicNavbar } from '@/components/shared';
import { getProviderById, formatNaira, type Booking } from '@/data/mockData';
import { useBookings } from '@/context/AppContext';

export function BookingFlow() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const provider = getProviderById(id || '');
  const { addBooking } = useBookings();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    serviceId: params.get('service') || '',
    date: '',
    time: '',
    location: '',
    notes: '',
  });

  if (!provider) {
    return (
      <div className="min-h-screen bg-ink-50">
        <PublicNavbar />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Provider not found</h1>
          <Link to="/services" className="btn-primary mt-4">Browse Services</Link>
        </div>
      </div>
    );
  }

  const steps = ['Service', 'Date', 'Time', 'Location', 'Details', 'Review'];
  const selectedService = provider.services.find((s) => s.id === data.serviceId) || provider.services[0];

  const submit = () => {
    const booking: Booking = {
      id: 'b' + Date.now(),
      serviceId: selectedService.id,
      serviceName: selectedService.title,
      providerId: provider.id,
      providerName: provider.name,
      providerAvatar: provider.avatar,
      customerName: 'You',
      date: data.date,
      time: data.time,
      location: data.location,
      price: selectedService.price,
      notes: data.notes,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    };
    addBooking(booking);
    navigate(`/booking-confirmed/${booking.id}`);
  };

  return (
    <div className="min-h-screen bg-ink-50">
      <PublicNavbar />

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">Book {provider.name}</h1>
        <p className="mt-1 text-sm text-ink-500">Complete your booking in a few simple steps</p>

        {/* Stepper */}
        <div className="mt-6 flex items-center">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center last:flex-none">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${i <= step ? 'bg-primary-600 text-white' : 'bg-ink-100 text-ink-400'}`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`mx-1 h-0.5 flex-1 ${i < step ? 'bg-primary-600' : 'bg-ink-100'}`} />}
            </div>
          ))}
        </div>
        <p className="mt-2 text-sm font-medium text-primary-600">{steps[step]}</p>

        <div className="mt-6 card p-6">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="service" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="mb-4 font-semibold text-ink-900 dark:text-ink-50">Select a Service</h3>
                <div className="space-y-3">
                  {provider.services.filter((s) => s.active).map((service) => (
                    <button
                      key={service.id}
                      onClick={() => setData({ ...data, serviceId: service.id })}
                      className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${data.serviceId === service.id ? 'border-primary-500 bg-primary-50' : 'border-ink-200 hover:border-primary-300'}`}
                    >
                      <img src={service.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-ink-900 dark:text-ink-50">{service.title}</h4>
                        <p className="text-xs text-ink-500">{service.duration}</p>
                      </div>
                      <span className="font-bold text-ink-900 dark:text-ink-50">{formatNaira(service.price)}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
            {step === 1 && (
              <motion.div key="date" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-ink-900 dark:text-ink-50"><Calendar className="h-5 w-5 text-primary-600" /> Select a Date</h3>
                <input type="date" className="input" value={data.date} onChange={(e) => setData({ ...data, date: e.target.value })} min={new Date().toISOString().split('T')[0]} />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="time" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-ink-900 dark:text-ink-50"><Clock className="h-5 w-5 text-primary-600" /> Select a Time</h3>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'].map((time) => (
                    <button
                      key={time}
                      onClick={() => setData({ ...data, time })}
                      className={`rounded-lg border-2 py-2 text-sm font-medium ${data.time === time ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-ink-200 text-ink-600 hover:border-primary-300'}`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="location" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-ink-900 dark:text-ink-50"><MapPin className="h-5 w-5 text-primary-600" /> Service Location</h3>
                <input className="input" placeholder="e.g. ABUAD Cafeteria, Hall B" value={data.location} onChange={(e) => setData({ ...data, location: e.target.value })} />
              </motion.div>
            )}
            {step === 4 && (
              <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-ink-900 dark:text-ink-50"><FileText className="h-5 w-5 text-primary-600" /> Additional Information</h3>
                <textarea className="input min-h-[120px]" placeholder="Any special requests or instructions for the provider..." value={data.notes} onChange={(e) => setData({ ...data, notes: e.target.value })} />
              </motion.div>
            )}
            {step === 5 && (
              <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="mb-4 font-semibold text-ink-900 dark:text-ink-50">Review Your Booking</h3>
                <div className="space-y-3 rounded-xl bg-ink-50 p-4">
                  <div className="flex justify-between"><span className="text-sm text-ink-500 dark:text-ink-400">Service</span><span className="text-sm font-medium text-ink-900 dark:text-ink-50">{selectedService.title}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-ink-500 dark:text-ink-400">Provider</span><span className="text-sm font-medium text-ink-900 dark:text-ink-50">{provider.name}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-ink-500 dark:text-ink-400">Date</span><span className="text-sm font-medium text-ink-900 dark:text-ink-50">{data.date || 'Not set'}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-ink-500 dark:text-ink-400">Time</span><span className="text-sm font-medium text-ink-900 dark:text-ink-50">{data.time || 'Not set'}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-ink-500 dark:text-ink-400">Location</span><span className="text-sm font-medium text-ink-900 dark:text-ink-50">{data.location || 'Not set'}</span></div>
                  {data.notes && <div className="flex justify-between"><span className="text-sm text-ink-500 dark:text-ink-400">Notes</span><span className="text-sm font-medium text-ink-900 dark:text-ink-50">{data.notes}</span></div>}
                  <div className="border-t border-ink-200 pt-3 flex justify-between"><span className="font-semibold text-ink-900 dark:text-ink-50">Total</span><span className="font-bold text-primary-600">{formatNaira(selectedService.price)}</span></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 flex justify-between">
            <button onClick={() => setStep(Math.max(0, step - 1))} className="btn-outline" disabled={step === 0}>
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(step + 1)} className="btn-primary">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={submit} className="btn-primary">
                Submit Booking <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BookingConfirmed() {
  const { id } = useParams();
  return (
    <div className="min-h-screen bg-ink-50">
      <PublicNavbar />
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
          <CheckCircle2 className="h-10 w-10 text-primary-600" />
        </motion.div>
        <h1 className="mt-6 text-2xl font-bold text-ink-900 dark:text-ink-50">Booking Submitted!</h1>
        <p className="mt-2 text-sm text-ink-500">
          Your booking request has been sent to the provider. You'll be notified once they respond. Your booking ID is #{id?.slice(-6)}.
        </p>
        <div className="mt-8 flex flex-col gap-2">
          <Link to="/customer/bookings" className="btn-primary w-full">View My Bookings</Link>
          <Link to="/services" className="btn-outline w-full">Browse More Services</Link>
        </div>
      </div>
    </div>
  );
}

export function PaymentPage() {
  const { id } = useParams();
  const { bookings, updateBookingStatus } = useBookings();
  const navigate = useNavigate();
  const booking = bookings.find((b) => b.id === id);
  const [processing, setProcessing] = useState(false);

  if (!booking) {
    return (
      <div className="min-h-screen bg-ink-50">
        <PublicNavbar />
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="text-xl font-bold text-ink-900">Booking not found</h1>
          <Link to="/customer/bookings" className="btn-primary mt-4">Back to Bookings</Link>
        </div>
      </div>
    );
  }

  const commission = booking.price * 0.1;
  const providerEarning = booking.price * 0.9;

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      updateBookingStatus(booking.id, 'paid');
      navigate('/customer/bookings');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-ink-50">
      <PublicNavbar />
      <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">Complete Payment</h1>
        <p className="mt-1 text-sm text-ink-500">Secure payment for your booking</p>

        <div className="mt-6 card p-6">
          <div className="flex items-center gap-3 border-b border-ink-100 pb-4">
            <img src={booking.providerAvatar} alt="" className="h-12 w-12 rounded-xl object-cover" />
            <div>
              <h3 className="font-semibold text-ink-900 dark:text-ink-50">{booking.serviceName}</h3>
              <p className="text-sm text-ink-500">{booking.providerName}</p>
            </div>
          </div>
          <div className="space-y-2 py-4">
            <div className="flex justify-between text-sm"><span className="text-ink-500 dark:text-ink-400">Service Price</span><span className="font-medium text-ink-900 dark:text-ink-50">{formatNaira(booking.price)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-ink-500">Platform Fee</span><span className="font-medium text-ink-900">{formatNaira(commission)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-ink-500">Provider Receives</span><span className="font-medium text-ink-900">{formatNaira(providerEarning)}</span></div>
            <div className="border-t border-ink-100 pt-2 flex justify-between"><span className="font-semibold text-ink-900">Total</span><span className="font-bold text-primary-600">{formatNaira(booking.price)}</span></div>
          </div>
        </div>

        <div className="mt-6 card p-6">
          <h3 className="flex items-center gap-2 font-semibold text-ink-900"><CreditCard className="h-5 w-5 text-primary-600" /> Payment Method</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 rounded-xl border-2 border-primary-500 bg-primary-50 p-3">
              <div className="flex h-8 w-12 items-center justify-center rounded bg-primary-600 text-xs font-bold text-white">Pay</div>
              <span className="text-sm font-medium text-ink-900">Pay with Card</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border-2 border-ink-200 p-3">
              <div className="flex h-8 w-12 items-center justify-center rounded bg-ink-100 text-xs font-bold text-ink-600">Bank</div>
              <span className="text-sm font-medium text-ink-600">Bank Transfer</span>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div><label className="label">Card Number</label><input className="input" placeholder="0000 0000 0000 0000" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Expiry</label><input className="input" placeholder="MM/YY" /></div>
              <div><label className="label">CVV</label><input className="input" placeholder="123" /></div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-ink-400">
          <ShieldCheck className="h-4 w-4 text-primary-500" /> Your payment is secured with bank-grade encryption
        </div>

        <button onClick={handlePay} disabled={processing} className="btn-primary btn-lg mt-4 w-full">
          {processing ? 'Processing...' : `Pay ${formatNaira(booking.price)}`}
        </button>
      </div>
    </div>
  );
}

export function ReviewPage() {
  const { id } = useParams();
  const { bookings, updateBookingStatus } = useBookings();
  const navigate = useNavigate();
  const booking = bookings.find((b) => b.id === id);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (!booking) {
    return (
      <div className="min-h-screen bg-ink-50">
        <PublicNavbar />
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="text-xl font-bold text-ink-900">Booking not found</h1>
          <Link to="/customer/bookings" className="btn-primary mt-4">Back to Bookings</Link>
        </div>
      </div>
    );
  }

  const submit = () => {
    updateBookingStatus(booking.id, 'reviewed');
    navigate('/customer/bookings');
  };

  return (
    <div className="min-h-screen bg-ink-50">
      <PublicNavbar />
      <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold text-ink-900">Leave a Review</h1>
        <p className="mt-1 text-sm text-ink-500">Share your experience to help other students</p>

        <div className="mt-6 card p-6">
          <div className="flex items-center gap-3 border-b border-ink-100 pb-4">
            <img src={booking.providerAvatar} alt="" className="h-12 w-12 rounded-xl object-cover" />
            <div>
              <h3 className="font-semibold text-ink-900">{booking.providerName}</h3>
              <p className="text-sm text-ink-500">{booking.serviceName}</p>
            </div>
          </div>
          <div className="py-4">
            <label className="label">Your Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill={star <= rating ? '#f59e0b' : '#e2e8f0'}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Your Review</label>
            <textarea className="input min-h-[120px]" placeholder="Tell others about your experience..." value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
          <button onClick={submit} className="btn-primary mt-4 w-full">Submit Review</button>
        </div>
      </div>
    </div>
  );
}
