import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  Loader2,
  MapPin,
  ShieldCheck,
  User,
  X,
   AlertCircle,
  RefreshCcw,
  LockKeyhole,
  Sparkles,
  
} from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { customerNavItems } from "@/data/customerNavItems";
import { formatNaira, type Booking } from "@/data/mockData";
import { useBookings } from "@/context/AppContext";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

/* =========================================================
   TYPES
========================================================= */

type Provider = {
  _id: string;
  name?: string;
  fullName?: string;
  email?: string;
  avatar?: string;
  profileImage?: string;
  about?: string;
  location?: string;
  status?: string;
  role?: string;
  createdAt?: string;

  availability?: {
    day: string;
    available: boolean;
    start: string;
    end: string;
  }[];
};

type Service = {
  _id: string;
  title?: string;
  name?: string;
  description?: string;
  price?: number | string;
  amount?: number | string;
  category?: string;
  status?: string;
  verified?: boolean;
  active?: boolean;
  image?: string;
  imageUrl?: string;
  createdAt?: string;
};

type BookingFormData = {
  date: string;
  time: string;
  location: string;
  notes: string;
};

type Step = {
  id: number;
  title: string;
  description: string;
};

/* =========================================================
   HELPERS
========================================================= */

const getServiceName = (service: Service) => {
  return service.title || service.name || "Selected Service";
};

const getServicePrice = (service: Service) => {
  const rawPrice = service.price ?? service.amount ?? 0;
  const numericPrice = Number(rawPrice);

  return Number.isFinite(numericPrice) ? numericPrice : 0;
};

const getProviderName = (provider: Provider) => {
  return provider.name || provider.fullName || "Provider";
};

const getProviderImage = (provider: Provider) => {
  return provider.avatar || provider.profileImage || "";
};

const formatTime = (time: string) => {
  if (!time) return "";

  const [hours, minutes] = time.split(":");
  const hour = Number(hours);

  if (Number.isNaN(hour)) {
    return time;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;

  return `${formattedHour}:${minutes || "00"} ${period}`;
};

const formatDate = (date: string) => {
  if (!date) return "";

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getDayName = (date: string) => {
  if (!date) return "";

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleDateString("en-US", {
    weekday: "long",
  });
};

const isDateInPast = (date: string) => {
  if (!date) return false;

  const today = new Date();

  const current = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const selected = new Date(`${date}T00:00:00`);

  return selected < current;
};

const getMinimumDate = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const isAvailableDay = (
  date: string,
  availability: Provider["availability"]
) => {
  if (!date) return false;

  if (!availability || availability.length === 0) {
    return true;
  }

  const dayName = getDayName(date);

  const slot = availability.find(
    (item) =>
      item.day.toLowerCase() === dayName.toLowerCase()
  );

  return Boolean(slot?.available);
};

const getAvailabilityForDate = (
  date: string,
  availability: Provider["availability"]
) => {
  if (!date || !availability) return null;

  const dayName = getDayName(date);

  return (
    availability.find(
      (item) =>
        item.day.toLowerCase() === dayName.toLowerCase()
    ) || null
  );
};

const generateTimeSlots = (
  start = "08:00",
  end = "18:00"
) => {
  const slots: string[] = [];

  const [startHour, startMinute] = start
    .split(":")
    .map(Number);

  const [endHour, endMinute] = end
    .split(":")
    .map(Number);

  if (
    Number.isNaN(startHour) ||
    Number.isNaN(startMinute) ||
    Number.isNaN(endHour) ||
    Number.isNaN(endMinute)
  ) {
    return slots;
  }

  let currentMinutes =
    startHour * 60 + startMinute;

  const endingMinutes =
    endHour * 60 + endMinute;

  while (currentMinutes <= endingMinutes) {
    const hour = Math.floor(currentMinutes / 60);
    const minute = currentMinutes % 60;

    slots.push(
      `${String(hour).padStart(2, "0")}:${String(
        minute
      ).padStart(2, "0")}`
    );

    currentMinutes += 60;
  }

  return slots;
};

/* =========================================================
   BOOKING STEPS
========================================================= */

const bookingSteps: Step[] = [
  {
    id: 0,
    title: "Date & Time",
    description: "Choose when you want the service",
  },
  {
    id: 1,
    title: "Location",
    description: "Tell the provider where to meet you",
  },
  {
    id: 2,
    title: "Details",
    description: "Add any additional information",
  },
  {
    id: 3,
    title: "Review",
    description: "Review your booking before confirming",
  },
];

/* =========================================================
   BOOKING FLOW
========================================================= */

export function BookingFlow() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { addBooking } = useBookings();

  const serviceId = searchParams.get("service");

  const [provider, setProvider] =
    useState<Provider | null>(null);

  const [selectedService, setSelectedService] =
    useState<Service | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [step, setStep] = useState(0);

  const [data, setData] = useState<BookingFormData>({
    date: "",
    time: "",
    location: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);

  /* =======================================================
     FETCH PROVIDER + SELECTED SERVICE
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const fetchBookingData = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          sessionStorage.getItem("servicely_token");

        if (!token) {
          navigate("/login/customer", {
            replace: true,
          });

          return;
        }

        if (!id) {
          throw new Error("Provider ID is missing.");
        }

        if (!serviceId) {
          throw new Error(
            "No service was selected. Please go back and click Book this on a service."
          );
        }

        const response = await fetch(
          `${API_URL}/provider/eachprofile/${encodeURIComponent(
            id
          )}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message ||
            "Failed to load provider information."
          );
        }

        if (!result?.success) {
          throw new Error(
            result?.message ||
            "Failed to load provider information."
          );
        }

        const fetchedProvider: Provider =
          result.provider;

        const providerServices: Service[] =
          Array.isArray(result.services)
            ? result.services
            : [];

        /*
         * IMPORTANT:
         *
         * We are NOT displaying all services here.
         *
         * We only find the exact service whose ID was
         * passed from:
         *
         * /book/:providerId?service=:serviceId
         */
        const exactService =
          providerServices.find(
            (service) =>
              String(service?._id) ===
              String(serviceId)
          );

        if (!exactService) {
          throw new Error(
            "The selected service could not be found. It may have been removed or is no longer available."
          );
        }

        const serviceIsRejected =
          exactService.status === "rejected";

        if (serviceIsRejected) {
          throw new Error(
            "This service is currently unavailable for booking."
          );
        }

        if (!mounted) return;

        setProvider(fetchedProvider);
        setSelectedService(exactService);
      } catch (err: any) {
        if (!mounted) return;

        console.error(
          "Booking flow fetch error:",
          err
        );

        setError(
          err?.message ||
          "Something went wrong while loading the booking."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchBookingData();

    return () => {
      mounted = false;
    };
  }, [id, serviceId, navigate]);

  /* =======================================================
     AVAILABLE DAYS
  ======================================================= */

  const availableDays = useMemo(() => {
    if (!provider?.availability) {
      return [];
    }

    return provider.availability.filter(
      (slot) => slot.available !== false
    );
  }, [provider]);

  /* =======================================================
     SELECTED DATE AVAILABILITY
  ======================================================= */

  const selectedAvailability =
    useMemo(() => {
      if (!data.date) return null;

      return getAvailabilityForDate(
        data.date,
        provider?.availability
      );
    }, [data.date, provider]);

  /* =======================================================
     TIME SLOTS
  ======================================================= */

  const timeSlots = useMemo(() => {
    /*
     * If the provider has availability configured,
     * use the selected day's working hours.
     */
    if (selectedAvailability) {
      return generateTimeSlots(
        selectedAvailability.start || "08:00",
        selectedAvailability.end || "18:00"
      );
    }

    /*
     * If availability has not been configured,
     * use the default working hours.
     */
    if (
      provider &&
      (!provider.availability ||
        provider.availability.length === 0)
    ) {
      return generateTimeSlots("08:00", "18:00");
    }

    return [];
  }, [selectedAvailability, provider]);

  /* =======================================================
     HANDLE INPUT
  ======================================================= */

  const updateData = (
    field: keyof BookingFormData,
    value: string
  ) => {
    setData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /* =======================================================
     DATE CHANGE
  ======================================================= */

  const handleDateChange = (
    value: string
  ) => {
    if (!value) {
      setData((previous) => ({
        ...previous,
        date: "",
        time: "",
      }));

      return;
    }

    if (isDateInPast(value)) {
      return;
    }

    if (
      provider?.availability &&
      provider.availability.length > 0
    ) {
      const available = isAvailableDay(
        value,
        provider.availability
      );

      if (!available) {
        setData((previous) => ({
          ...previous,
          date: value,
          time: "",
        }));

        return;
      }
    }

    setData((previous) => ({
      ...previous,
      date: value,
      time: "",
    }));
  };

  /* =======================================================
     STEP VALIDATION
  ======================================================= */

  const validateCurrentStep = () => {
    if (step === 0) {
      if (!data.date) {
        return "Please select a booking date.";
      }

      if (isDateInPast(data.date)) {
        return "Please select a future date.";
      }

      if (
        provider?.availability &&
        provider.availability.length > 0 &&
        !isAvailableDay(
          data.date,
          provider.availability
        )
      ) {
        return `The provider is not available on ${getDayName(
          data.date
        )}. Please choose another date.`;
      }

      if (!data.time) {
        return "Please select a time.";
      }
    }

    if (step === 1) {
      if (!data.location.trim()) {
        return "Please enter the service location.";
      }
    }

    return "";
  };

  /* =======================================================
     NEXT STEP
  ======================================================= */

  const handleNext = () => {
    const validationError =
      validateCurrentStep();

    if (validationError) {
      setError(validationError);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    setError("");

    if (step < bookingSteps.length - 1) {
      setStep((previous) => previous + 1);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  /* =======================================================
     PREVIOUS STEP
  ======================================================= */

  const handleBack = () => {
    setError("");

    if (step > 0) {
      setStep((previous) => previous - 1);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      navigate(-1);
    }
  };

  /* =======================================================
     SUBMIT BOOKING
  ======================================================= */

 /* =======================================================
   SUBMIT BOOKING — REAL DATABASE
======================================================= */

const handleConfirmBooking = async () => {
  if (!provider || !selectedService) {
    return;
  }

  const validationError =
    validateCurrentStep();

  if (validationError) {
    setError(validationError);
    return;
  }

  try {
    setSubmitting(true);
    setError("");

    // ==========================================
    // AUTH TOKEN
    // ==========================================

    const token =
      sessionStorage.getItem(
        "servicely_token"
      );

    if (!token) {
      navigate(
        "/login/customer",
        {
          replace: true,
        }
      );

      return;
    }

    // ==========================================
    // CREATE REAL MONGODB BOOKING
    // ==========================================

    const response =
      await fetch(
        `${API_URL}/bookings/createbookings`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,

            Accept:
              "application/json",
          },

          body: JSON.stringify({
            serviceId:
              selectedService._id,

            date:
              data.date,

            time:
              data.time,

            location:
              data.location.trim(),

            note:
              data.notes.trim(),
          }),
        }
      );

    let result: any = {};

    try {
      result =
        await response.json();
    } catch {
      throw new Error(
        `Server returned an invalid response (${response.status}).`
      );
    }

    console.log(
      "Booking creation response:",
      result
    );

    if (!response.ok) {
      throw new Error(
        result?.message ||
          result?.error ||
          `Unable to create booking (${response.status}).`
      );
    }

    if (!result?.success) {
      throw new Error(
        result?.message ||
          "Unable to create booking."
      );
    }

    // ==========================================
    // GET REAL MONGODB BOOKING
    // ==========================================

    const backendBooking =
      result?.booking ||
      result?.data?.booking;

    if (!backendBooking) {
      console.error(
        "No booking returned:",
        result
      );

      throw new Error(
        "Booking was created, but no booking information was returned."
      );
    }

    // ==========================================
    // REAL MONGODB ID
    // ==========================================

    const mongoBookingId =
      backendBooking?._id ||
      backendBooking?.id;

    if (!mongoBookingId) {
      console.error(
        "No MongoDB booking ID:",
        backendBooking
      );

      throw new Error(
        "The booking was created but no valid booking ID was returned."
      );
    }

    console.log(
      "REAL MONGODB BOOKING ID:",
      mongoBookingId
    );

    // ==========================================
    // PRICE FROM BACKEND
    // ==========================================

    const bookingPrice =
      Number(
        backendBooking?.amount ??
          backendBooking?.price ??
          getServicePrice(
            selectedService
          )
      ) || 0;

    // ==========================================
    // MAP BACKEND → FRONTEND BOOKING
    // ==========================================

    const booking: Booking = {
      id: String(
        mongoBookingId
      ),

      serviceId: String(
        backendBooking?.service?._id ||
          backendBooking?.service ||
          selectedService._id
      ),

      serviceName:
        backendBooking?.service?.title ||
        backendBooking?.serviceName ||
        getServiceName(
          selectedService
        ),

      providerId: String(
        backendBooking?.provider?._id ||
          backendBooking?.provider ||
          provider._id
      ),

      providerName:
        backendBooking?.provider?.name ||
        backendBooking?.providerName ||
        getProviderName(
          provider
        ),

      providerAvatar:
        backendBooking?.provider?.avatar ||
        backendBooking?.provider?.profileImage ||
        backendBooking?.providerAvatar ||
        getProviderImage(
          provider
        ),

      customerName:
        backendBooking?.customer?.name ||
        backendBooking?.customerName ||
        "You",

      date:
        backendBooking?.date ||
        data.date,

      time:
        backendBooking?.time ||
        data.time,

      location:
        backendBooking?.location ||
        data.location,

      price:
        bookingPrice,

      notes:
        backendBooking?.note ||
        backendBooking?.notes ||
        data.notes,

      // Frontend status
      status:
        "payment_pending",

      createdAt:
        backendBooking?.createdAt ||
        new Date().toISOString(),
    };

    // ==========================================
    // SAVE IN YOUR EXISTING CONTEXT
    // ==========================================

    addBooking(
      booking
    );

    console.log(
      "Booking saved with real MongoDB ID:",
      booking.id
    );

    // ==========================================
    // GO TO PAYMENT
    // ==========================================

    navigate(
      `/payment/${encodeURIComponent(
        booking.id
      )}`
    );
  } catch (error: any) {
    console.error(
      "Create booking error:",
      error
    );

    setError(
      error?.message ||
        "Unable to create your booking. Please try again."
    );
  } finally {
    setSubmitting(false);
  }
};

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <DashboardLayout
        role="customer"
        navItems={customerNavItems}
      >
        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-950/40">
              <Loader2 className="h-7 w-7 animate-spin text-primary-600" />
            </div>

            <h2 className="text-lg font-bold text-ink-900 dark:text-white">
              Loading booking
            </h2>

            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              Preparing the selected service...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error && (!provider || !selectedService)) {
    return (
      <DashboardLayout
        role="customer"
        navItems={customerNavItems}
      >
        <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4">
          <div className="w-full rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-900/40 dark:bg-ink-900">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30">
              <X className="h-7 w-7 text-red-500" />
            </div>

            <h2 className="text-xl font-bold text-ink-900 dark:text-white">
              Unable to start booking
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-500 dark:text-ink-400">
              {error}
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-xl border border-ink-200 px-5 py-3 text-sm font-semibold text-ink-700 transition hover:bg-ink-50 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800"
              >
                Go Back
              </button>

              {id && (
                <Link
                  to={`/provider/${id}`}
                  className="rounded-xl bg-ink-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-600 dark:bg-white dark:text-ink-900"
                >
                  View Provider
                </Link>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!provider || !selectedService) {
    return null;
  }

  const servicePrice =
    getServicePrice(selectedService);

  const providerName =
    getProviderName(provider);

  const serviceName =
    getServiceName(selectedService);

  const providerImage =
    getProviderImage(provider);

  const isSelectedDateAvailable =
    !data.date ||
    !provider.availability ||
    provider.availability.length === 0 ||
    isAvailableDay(
      data.date,
      provider.availability
    );

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <DashboardLayout
      role="customer"
      navItems={customerNavItems}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-7">
          <button
            type="button"
            onClick={handleBack}
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-ink-500 transition hover:text-primary-600 dark:text-ink-400 dark:hover:text-primary-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">
                Book a service
              </p>

              <h1 className="text-2xl font-black tracking-tight text-ink-900 dark:text-white sm:text-3xl">
                Complete your booking
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500 dark:text-ink-400">
                You are booking the selected service from{" "}
                <span className="font-semibold text-ink-700 dark:text-ink-200">
                  {providerName}
                </span>
                .
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-ink-400">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Secure booking
            </div>
          </div>
        </div>

        {/* =================================================
            PROGRESS
        ================================================= */}

        <div className="mb-7 overflow-x-auto">
          <div className="flex min-w-[650px] items-center">
            {bookingSteps.map(
              (bookingStep, index) => {
                const isCompleted =
                  step > bookingStep.id;

                const isCurrent =
                  step === bookingStep.id;

                return (
                  <div
                    key={bookingStep.id}
                    className="flex flex-1 items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={[
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all",
                          isCompleted
                            ? "bg-primary-600 text-white"
                            : isCurrent
                              ? "bg-ink-900 text-white dark:bg-white dark:text-ink-900"
                              : "bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500",
                        ].join(" ")}
                      >
                        {isCompleted ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          bookingStep.id + 1
                        )}
                      </div>

                      <div className="hidden sm:block">
                        <p
                          className={[
                            "text-sm font-bold",
                            isCurrent ||
                              isCompleted
                              ? "text-ink-900 dark:text-white"
                              : "text-ink-400 dark:text-ink-500",
                          ].join(" ")}
                        >
                          {bookingStep.title}
                        </p>

                        <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
                          {bookingStep.description}
                        </p>
                      </div>
                    </div>

                    {index <
                      bookingSteps.length - 1 && (
                        <div
                          className={[
                            "mx-4 h-px flex-1",
                            step > index
                              ? "bg-primary-500"
                              : "bg-ink-200 dark:bg-ink-700",
                          ].join(" ")}
                        />
                      )}
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* =================================================
            ERROR ALERT
        ================================================= */}

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{
                opacity: 0,
                y: -10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -10,
              }}
              className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* =================================================
              LEFT CONTENT
          ================================================= */}

          <div>
            <AnimatePresence mode="wait">
              {/* =============================================
                  STEP 1
              ============================================= */}

              {step === 0 && (
                <motion.div
                  key="step-date"
                  initial={{
                    opacity: 0,
                    x: 20,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: -20,
                  }}
                  className="space-y-5"
                >
                  <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-7">
                    <div className="mb-6 flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
                        <Calendar className="h-5 w-5" />
                      </div>

                      <div>
                        <h2 className="text-lg font-bold text-ink-900 dark:text-white">
                          Choose a date
                        </h2>

                        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                          Select a date when the provider is available.
                        </p>
                      </div>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-ink-700 dark:text-ink-200">
                        Booking date
                      </span>

                      <input
                        type="date"
                        min={getMinimumDate()}
                        value={data.date}
                        onChange={(event) =>
                          handleDateChange(
                            event.target.value
                          )
                        }
                        className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3.5 text-sm font-medium text-ink-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-ink-700 dark:bg-ink-950 dark:text-white"
                      />
                    </label>

                    {data.date && (
                      <div
                        className={[
                          "mt-4 rounded-2xl border px-4 py-3",
                          isSelectedDateAvailable
                            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                            : "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-2">
                          {isSelectedDateAvailable ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}

                          <p
                            className={[
                              "text-sm font-semibold",
                              isSelectedDateAvailable
                                ? "text-emerald-700 dark:text-emerald-300"
                                : "text-red-700 dark:text-red-300",
                            ].join(" ")}
                          >
                            {isSelectedDateAvailable
                              ? `${formatDate(
                                data.date
                              )} is available`
                              : `${providerName} is not available on ${formatDate(
                                data.date
                              )}`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-7">
                    <div className="mb-6 flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
                        <Clock className="h-5 w-5" />
                      </div>

                      <div>
                        <h2 className="text-lg font-bold text-ink-900 dark:text-white">
                          Choose a time
                        </h2>

                        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                          Select a time within the provider's available hours.
                        </p>
                      </div>
                    </div>

                    {!data.date ? (
                      <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 px-5 py-8 text-center dark:border-ink-700 dark:bg-ink-950/40">
                        <Calendar className="mx-auto h-7 w-7 text-ink-400" />

                        <p className="mt-3 text-sm font-semibold text-ink-600 dark:text-ink-300">
                          Select a date first
                        </p>

                        <p className="mt-1 text-xs text-ink-400">
                          Available time slots will appear here.
                        </p>
                      </div>
                    ) : !isSelectedDateAvailable ? (
                      <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 px-5 py-8 text-center dark:border-red-900/40 dark:bg-red-950/20">
                        <Clock className="mx-auto h-7 w-7 text-red-400" />

                        <p className="mt-3 text-sm font-semibold text-red-700 dark:text-red-300">
                          No time slots available
                        </p>

                        <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                          Please choose another date.
                        </p>
                      </div>
                    ) : timeSlots.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 px-5 py-8 text-center dark:border-ink-700 dark:bg-ink-950/40">
                        <Clock className="mx-auto h-7 w-7 text-ink-400" />

                        <p className="mt-3 text-sm font-semibold text-ink-600 dark:text-ink-300">
                          Time availability not added
                        </p>

                        <p className="mt-1 text-xs text-ink-400">
                          Please contact the provider for availability.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {timeSlots.map(
                          (time) => {
                            const selected =
                              data.time === time;

                            return (
                              <button
                                key={time}
                                type="button"
                                onClick={() =>
                                  updateData(
                                    "time",
                                    time
                                  )
                                }
                                className={[
                                  "rounded-2xl border px-4 py-3.5 text-sm font-semibold transition-all",
                                  selected
                                    ? "border-primary-600 bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                                    : "border-ink-200 bg-white text-ink-700 hover:border-primary-300 hover:bg-primary-50 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-200 dark:hover:border-primary-700 dark:hover:bg-primary-950/30",
                                ].join(" ")}
                              >
                                <Clock className="mx-auto mb-1 h-4 w-4" />

                                {formatTime(
                                  time
                                )}
                              </button>
                            );
                          }
                        )}
                      </div>
                    )}

                    {availableDays.length > 0 && (
                      <div className="mt-5 rounded-2xl bg-ink-50 px-4 py-3 dark:bg-ink-950/50">
                        <p className="text-xs font-semibold text-ink-500 dark:text-ink-400">
                          Provider available:
                        </p>

                        <p className="mt-1 text-xs text-ink-700 dark:text-ink-300">
                          {availableDays
                            .map(
                              (day) =>
                                day.day
                            )
                            .join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* =============================================
                  STEP 2
              ============================================= */}

              {step === 1 && (
                <motion.div
                  key="step-location"
                  initial={{
                    opacity: 0,
                    x: 20,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: -20,
                  }}
                >
                  <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-7">
                    <div className="mb-7 flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
                        <MapPin className="h-5 w-5" />
                      </div>

                      <div>
                        <h2 className="text-lg font-bold text-ink-900 dark:text-white">
                          Where should the service take place?
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-ink-500 dark:text-ink-400">
                          Provide the location where you want the provider to deliver the service.
                        </p>
                      </div>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-ink-700 dark:text-ink-200">
                        Service location
                      </span>

                      <textarea
                        rows={4}
                        value={data.location}
                        onChange={(event) =>
                          updateData(
                            "location",
                            event.target.value
                          )
                        }
                        placeholder="e.g. ABUAD Main Campus, Hostel A, Room 12"
                        className="w-full resize-none rounded-2xl border border-ink-200 bg-white px-4 py-3.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-ink-700 dark:bg-ink-950 dark:text-white"
                      />
                    </label>

                    <div className="mt-5 flex gap-3 rounded-2xl bg-primary-50 p-4 dark:bg-primary-950/20">
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" />

                      <div>
                        <p className="text-sm font-semibold text-ink-800 dark:text-ink-200">
                          Provider location
                        </p>

                        <p className="mt-1 text-xs leading-5 text-ink-500 dark:text-ink-400">
                          {provider.location ||
                            "Location not provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* =============================================
                  STEP 3
              ============================================= */}

              {step === 2 && (
                <motion.div
                  key="step-details"
                  initial={{
                    opacity: 0,
                    x: 20,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: -20,
                  }}
                >
                  <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-7">
                    <div className="mb-7 flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
                        <FileText className="h-5 w-5" />
                      </div>

                      <div>
                        <h2 className="text-lg font-bold text-ink-900 dark:text-white">
                          Additional details
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-ink-500 dark:text-ink-400">
                          Tell the provider anything they should know before the booking.
                        </p>
                      </div>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-ink-700 dark:text-ink-200">
                        Notes{" "}
                        <span className="font-normal text-ink-400">
                          (optional)
                        </span>
                      </span>

                      <textarea
                        rows={7}
                        value={data.notes}
                        onChange={(event) =>
                          updateData(
                            "notes",
                            event.target.value
                          )
                        }
                        placeholder="Add any instructions, preferences, requirements, or other information..."
                        className="w-full resize-none rounded-2xl border border-ink-200 bg-white px-4 py-3.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-ink-700 dark:bg-ink-950 dark:text-white"
                      />
                    </label>

                    <div className="mt-5 rounded-2xl bg-ink-50 px-4 py-4 dark:bg-ink-950/50">
                      <p className="text-xs leading-5 text-ink-500 dark:text-ink-400">
                        Your notes will be shared with the provider so they can better understand your booking request.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* =============================================
                  STEP 4
              ============================================= */}

              {step === 3 && (
                <motion.div
                  key="step-review"
                  initial={{
                    opacity: 0,
                    x: 20,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: -20,
                  }}
                >
                  <div className="space-y-5">
                    <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-7">
                      <div className="mb-6">
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary-600 dark:text-primary-400">
                          Review
                        </p>

                        <h2 className="mt-1 text-xl font-bold text-ink-900 dark:text-white">
                          Review your booking
                        </h2>

                        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                          Make sure everything is correct before confirming.
                        </p>
                      </div>

                      {/* SERVICE */}
                      <div className="rounded-2xl border border-ink-100 p-4 dark:border-ink-800">
                        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-400">
                          Service
                        </p>

                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h3 className="font-bold text-ink-900 dark:text-white">
                              {serviceName}
                            </h3>

                            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                              {providerName}
                            </p>
                          </div>

                          <p className="shrink-0 text-lg font-black text-primary-600 dark:text-primary-400">
                            {formatNaira(
                              servicePrice
                            )}
                          </p>
                        </div>
                      </div>

                      {/* DATE */}
                      <div className="mt-4 rounded-2xl border border-ink-100 p-4 dark:border-ink-800">
                        <div className="flex items-start gap-3">
                          <Calendar className="mt-0.5 h-5 w-5 text-primary-600" />

                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-ink-400">
                              Date & Time
                            </p>

                            <p className="mt-1 text-sm font-semibold text-ink-900 dark:text-white">
                              {formatDate(
                                data.date
                              )}
                            </p>

                            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                              {formatTime(
                                data.time
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* LOCATION */}
                      <div className="mt-4 rounded-2xl border border-ink-100 p-4 dark:border-ink-800">
                        <div className="flex items-start gap-3">
                          <MapPin className="mt-0.5 h-5 w-5 text-primary-600" />

                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-ink-400">
                              Location
                            </p>

                            <p className="mt-1 whitespace-pre-line text-sm font-semibold text-ink-900 dark:text-white">
                              {data.location}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* NOTES */}
                      {data.notes.trim() && (
                        <div className="mt-4 rounded-2xl border border-ink-100 p-4 dark:border-ink-800">
                          <div className="flex items-start gap-3">
                            <FileText className="mt-0.5 h-5 w-5 text-primary-600" />

                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-ink-400">
                                Notes
                              </p>

                              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-ink-700 dark:text-ink-300">
                                {data.notes}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="rounded-3xl border border-primary-100 bg-primary-50/70 p-5 dark:border-primary-900/30 dark:bg-primary-950/20">
                      <div className="flex gap-3">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" />

                        <div>
                          <p className="text-sm font-bold text-ink-900 dark:text-white">
                            Booking confirmation
                          </p>

                          <p className="mt-1 text-xs leading-5 text-ink-600 dark:text-ink-400">
                            By confirming, your booking request will be created with the selected service, date, time and location.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* =================================================
                NAVIGATION BUTTONS
            ================================================= */}

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 rounded-2xl border border-ink-200 bg-white px-5 py-3.5 text-sm font-bold text-ink-700 transition hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              {step < bookingSteps.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 rounded-2xl bg-ink-900 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-ink-950/10 transition hover:bg-primary-600 hover:shadow-xl hover:shadow-primary-600/20 dark:bg-white dark:text-ink-900 dark:hover:bg-primary-400"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-600/20 transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Preparing Payment...
                    </>
                  ) : (
                    <>
                      Proceed to Payment
                      <CreditCard className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* =================================================
              RIGHT SUMMARY
          ================================================= */}

          <aside className="lg:sticky lg:top-6 lg:h-fit">
            <div className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm dark:border-ink-800 dark:bg-ink-900">
              {/* PROVIDER */}
              <div className="border-b border-ink-100 p-5 dark:border-ink-800">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-ink-400">
                  Provider
                </p>

                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                    {providerImage ? (
                      <img
                        src={providerImage}
                        alt={providerName}
                        className="h-full w-full object-cover"
                        onError={(
                          event
                        ) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <User className="h-5 w-5 text-ink-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink-900 dark:text-white">
                      {providerName}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-ink-500 dark:text-ink-400">
                      {provider.location ||
                        "ABUAD"}
                    </p>
                  </div>
                </div>
              </div>

              {/* SELECTED SERVICE */}
              <div className="border-b border-ink-100 p-5 dark:border-ink-800">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-ink-400">
                  Selected service
                </p>

                <div className="rounded-2xl bg-ink-50 p-4 dark:bg-ink-950/60">
                  <h3 className="font-bold text-ink-900 dark:text-white">
                    {serviceName}
                  </h3>

                  {selectedService.category && (
                    <p className="mt-1 text-xs text-primary-600 dark:text-primary-400">
                      {selectedService.category}
                    </p>
                  )}

                  {selectedService.description && (
                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-ink-500 dark:text-ink-400">
                      {selectedService.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-ink-200 pt-3 dark:border-ink-800">
                    <span className="text-xs font-medium text-ink-500 dark:text-ink-400">
                      Service price
                    </span>

                    <span className="text-lg font-black text-primary-600 dark:text-primary-400">
                      {formatNaira(
                        servicePrice
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* BOOKING SUMMARY */}
              <div className="p-5">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-ink-400">
                  Booking summary
                </p>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />

                    <div className="min-w-0">
                      <p className="text-xs text-ink-400">
                        Date
                      </p>

                      <p className="mt-0.5 text-sm font-semibold text-ink-800 dark:text-ink-200">
                        {data.date
                          ? formatDate(
                            data.date
                          )
                          : "Not selected"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />

                    <div className="min-w-0">
                      <p className="text-xs text-ink-400">
                        Time
                      </p>

                      <p className="mt-0.5 text-sm font-semibold text-ink-800 dark:text-ink-200">
                        {data.time
                          ? formatTime(
                            data.time
                          )
                          : "Not selected"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />

                    <div className="min-w-0">
                      <p className="text-xs text-ink-400">
                        Location
                      </p>

                      <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-ink-800 dark:text-ink-200">
                        {data.location ||
                          "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-ink-100 pt-5 dark:border-ink-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink-500 dark:text-ink-400">
                      Total
                    </span>

                    <span className="text-xl font-black text-ink-900 dark:text-white">
                      {formatNaira(
                        servicePrice
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex gap-2 rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/20">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

                  <p className="text-[11px] leading-5 text-emerald-700 dark:text-emerald-300">
                    Your booking information is protected and will only be shared with the relevant provider.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* =========================================================
   BOOKING CONFIRMED
========================================================= */

export function BookingConfirmed() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { bookings } = useBookings();

  const booking = bookings.find(
    (item: any) =>
      String(item.id) === String(id)
  );

  return (
    <DashboardLayout
      role="customer"
      navItems={customerNavItems}
    >
      <div className="mx-auto flex min-h-[75vh] max-w-2xl items-center justify-center px-4 py-10">
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.96,
            y: 15,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          className="w-full rounded-3xl border border-ink-100 bg-white p-7 text-center shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-10"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>

          <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">
            Booking created
          </p>

          <h1 className="mt-2 text-2xl font-black text-ink-900 dark:text-white sm:text-3xl">
            Booking confirmed
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-500 dark:text-ink-400">
            Your booking request has been created successfully.
          </p>

          {booking && (
            <div className="mt-7 rounded-2xl bg-ink-50 p-5 text-left dark:bg-ink-950/50">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-ink-400">
                    Service
                  </p>

                  <p className="mt-1 font-bold text-ink-900 dark:text-white">
                    {booking.serviceName}
                  </p>
                </div>

                <p className="font-black text-primary-600 dark:text-primary-400">
                  {formatNaira(
                    Number(booking.price) || 0
                  )}
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-ink-400">
                    Date
                  </p>

                  <p className="mt-1 text-sm font-semibold text-ink-800 dark:text-ink-200">
                    {formatDate(
                      booking.date
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-ink-400">
                    Time
                  </p>

                  <p className="mt-1 text-sm font-semibold text-ink-800 dark:text-ink-200">
                    {formatTime(
                      booking.time
                    )}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs text-ink-400">
                    Location
                  </p>

                  <p className="mt-1 text-sm font-semibold text-ink-800 dark:text-ink-200">
                    {booking.location}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() =>
                navigate("/customer")
              }
              className="rounded-2xl bg-ink-900 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-primary-600 dark:bg-white dark:text-ink-900"
            >
              Go to Dashboard
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/customer/bookings")
              }
              className="rounded-2xl border border-ink-200 px-6 py-3.5 text-sm font-bold text-ink-700 transition hover:bg-ink-50 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800"
            >
              View Bookings
            </button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

/* =========================================================
   PAYMENT PAGE
========================================================= */


// Keep your existing imports for these if they are located elsewhere
// import { formatNaira, formatDate, formatTime } from "...";





const INVALID_BOOKINGS_KEY =
  "servicely_invalid_bookings";

// ======================================================
// INVALID BOOKING STORAGE HELPERS
// ======================================================

function getInvalidBookingIds(): string[] {
  try {
    const stored =
      sessionStorage.getItem(
        INVALID_BOOKINGS_KEY
      );

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((value) => String(value).trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function rememberInvalidBooking(
  bookingId: string
) {
  const normalizedId =
    String(bookingId || "").trim();

  if (!normalizedId) {
    return;
  }

  const currentIds =
    getInvalidBookingIds();

  if (!currentIds.includes(normalizedId)) {
    currentIds.push(normalizedId);
  }

  sessionStorage.setItem(
    INVALID_BOOKINGS_KEY,
    JSON.stringify(currentIds)
  );
}

function forgetInvalidBooking(
  bookingId: string
) {
  const normalizedId =
    String(bookingId || "").trim();

  if (!normalizedId) {
    return;
  }

  const remainingIds =
    getInvalidBookingIds().filter(
      (item) =>
        String(item) !== normalizedId
    );

  if (remainingIds.length > 0) {
    sessionStorage.setItem(
      INVALID_BOOKINGS_KEY,
      JSON.stringify(remainingIds)
    );
  } else {
    sessionStorage.removeItem(
      INVALID_BOOKINGS_KEY
    );
  }
}

// ======================================================
// DATE FORMATTER
// ======================================================

// function formatDate(
//   dateString: string
// ) {
//   if (!dateString) {
//     return "Date not provided";
//   }

//   try {
//     const date = new Date(dateString);

//     if (Number.isNaN(date.getTime())) {
//       return dateString;
//     }

//     return date.toLocaleDateString(
//       "en-NG",
//       {
//         weekday: "long",
//         day: "numeric",
//         month: "long",
//         year: "numeric",
//       }
//     );
//   } catch {
//     return dateString;
//   }
// }

// ======================================================
// TIME FORMATTER
// ======================================================

// function formatTime(
//   timeString: string
// ) {
//   if (!timeString) {
//     return "Time not provided";
//   }

//   try {
//     const [hours, minutes] =
//       timeString.split(":");

//     const hour = Number(hours);

//     if (
//       Number.isNaN(hour) ||
//       !minutes
//     ) {
//       return timeString;
//     }

//     const period =
//       hour >= 12 ? "PM" : "AM";

//     const formattedHour =
//       hour % 12 || 12;

//     return `${formattedHour}:${minutes} ${period}`;
//   } catch {
//     return timeString;
//   }
// }

// ======================================================
// PAYMENT PAGE
// ======================================================

export function PaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { bookings } = useBookings();

  const [resolvedBooking, setResolvedBooking] =
    useState<Booking | null>(null);

  const [resolvingBooking, setResolvingBooking] =
    useState(false);

  const [bookingResolutionFailed, setBookingResolutionFailed] =
    useState(false);

  const [paying, setPaying] =
    useState(false);

  const [paymentError, setPaymentError] =
    useState("");

  const [verifying, setVerifying] =
    useState(false);

  const [verificationSuccess, setVerificationSuccess] =
    useState(false);

  const [verificationMessage, setVerificationMessage] =
    useState("");

  // ======================================================
  // DETECT PAYSTACK CALLBACK
  // ======================================================

  const paymentReference = useMemo(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    return (
      params.get("reference") ||
      params.get("trxref") ||
      ""
    ).trim();
  }, []);

  const isPaymentCallback =
    Boolean(paymentReference);

  // ======================================================
  // FIND BOOKING FROM APP CONTEXT
  // ======================================================

  const contextBooking =
    bookings.find(
      (item: Booking) =>
        String(item.id) === String(id)
    ) || null;

  // ======================================================
  // FINAL BOOKING
  // ======================================================
  //
  // Prefer booking from AppContext.
  // If AppContext does not have it, resolvedBooking
  // contains the booking fetched directly from backend.
  //

  const booking =
    contextBooking || resolvedBooking;

  // ======================================================
  // RESOLVE BOOKING FROM BACKEND
  // ======================================================
  //
  // This prevents the page from immediately saying
  // "Booking not found" while AppContext is still loading.
  //

  useEffect(() => {
    if (isPaymentCallback) {
      return;
    }

    if (!id) {
      return;
    }

    // Already available from AppContext.
    if (contextBooking) {
      forgetInvalidBooking(id);
      setResolvedBooking(null);
      setResolvingBooking(false);
      setBookingResolutionFailed(false);
      return;
    }

    let cancelled = false;

    const resolveBooking = async () => {
      try {
        setResolvingBooking(true);
        setBookingResolutionFailed(false);

        const token =
          sessionStorage.getItem(
            "servicely_token"
          );

        if (!token) {
          navigate(
            "/login/customer",
            {
              replace: true,
            }
          );

          return;
        }

        const response = await fetch(
          `${API_URL}/bookings/my-bookings`,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
              Accept:
                "application/json",
            },
          }
        );

        let result: any = {};

        try {
          result = await response.json();
        } catch {
          throw new Error(
            `The server returned an invalid response (${response.status}).`
          );
        }

        if (!response.ok) {
          throw new Error(
            result?.message ||
              `Unable to load booking (${response.status}).`
          );
        }

        const backendBookings =
          Array.isArray(
            result?.bookings
          )
            ? result.bookings
            : [];

        const foundBooking =
          backendBookings.find(
            (item: Booking) =>
              String(item.id) ===
              String(id)
          ) || null;

        if (cancelled) {
          return;
        }

        // ==============================================
        // BOOKING EXISTS
        // ==============================================

        if (foundBooking) {
          forgetInvalidBooking(id);

          setResolvedBooking(
            foundBooking
          );

          setBookingResolutionFailed(
            false
          );

          return;
        }

        // ==============================================
        // BOOKING DOES NOT EXIST
        // ==============================================

        rememberInvalidBooking(id);

        setResolvedBooking(null);

        setBookingResolutionFailed(
          true
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "BOOKING RESOLUTION ERROR:",
          error
        );

        // Do not immediately remove the booking
        // if the request itself failed.
        //
        // This prevents a temporary network error
        // from deleting a valid booking from the list.

        setBookingResolutionFailed(
          false
        );
      } finally {
        if (!cancelled) {
          setResolvingBooking(false);
        }
      }
    };

    resolveBooking();

    return () => {
      cancelled = true;
    };
  }, [
    API_URL,
    id,
    contextBooking,
    isPaymentCallback,
    navigate,
  ]);

  // ======================================================
  // VERIFY PAYSTACK PAYMENT
  // ======================================================

  useEffect(() => {
    if (
      !isPaymentCallback ||
      !paymentReference
    ) {
      return;
    }

    let cancelled = false;

    const verifyPaystackPayment =
      async () => {
        try {
          setVerifying(true);
          setVerificationSuccess(false);
          setVerificationMessage("");

          // ==========================================
          // GET AUTH TOKEN
          // ==========================================

          const token =
            sessionStorage.getItem(
              "servicely_token"
            );

          if (!token) {
            navigate(
              "/login/customer",
              {
                replace: true,
              }
            );

            return;
          }

          console.log(
            "Paystack callback reference:",
            paymentReference
          );

          // ==========================================
          // VERIFY PAYMENT WITH BACKEND
          // ==========================================

          const response = await fetch(
            `${API_URL}/payments/verify/${encodeURIComponent(
              paymentReference
            )}`,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${token}`,

                Accept:
                  "application/json",
              },
            }
          );

          let result: any = {};

          try {
            result =
              await response.json();
          } catch {
            throw new Error(
              `The server returned an invalid response (${response.status}).`
            );
          }

          console.log(
            "Payment verification response:",
            result
          );

          if (!response.ok) {
            throw new Error(
              result?.message ||
                `Unable to verify payment (${response.status}).`
            );
          }

          if (
            !result?.success ||
            !result?.verified
          ) {
            throw new Error(
              result?.message ||
                "Payment could not be verified."
            );
          }

          if (cancelled) {
            return;
          }

          // ==========================================
          // SUCCESS
          // ==========================================

          setVerificationSuccess(
            true
          );

          setVerificationMessage(
            result?.message ||
              "Your payment has been verified successfully."
          );

          // ==========================================
          // CLEAN CALLBACK URL
          // ==========================================

          window.history.replaceState(
            {},
            document.title,
            "/payment/verify"
          );
        } catch (error: any) {
          if (cancelled) {
            return;
          }

          console.error(
            "Payment verification error:",
            error
          );

          setVerificationSuccess(
            false
          );

          setVerificationMessage(
            error?.message ||
              "Unable to verify your payment. Please try again."
          );
        } finally {
          if (!cancelled) {
            setVerifying(false);
          }
        }
      };

    verifyPaystackPayment();

    return () => {
      cancelled = true;
    };
  }, [
    API_URL,
    isPaymentCallback,
    paymentReference,
    navigate,
  ]);

  // ======================================================
  // START PAYMENT
  // ======================================================

  const handlePayment = async () => {
    if (!booking) {
      setPaymentError(
        "Booking could not be found."
      );

      return;
    }

    try {
      setPaying(true);
      setPaymentError("");

      // ==========================================
      // GET AUTH TOKEN
      // ==========================================

      const token =
        sessionStorage.getItem(
          "servicely_token"
        );

      if (!token) {
        navigate(
          "/login/customer",
          {
            replace: true,
          }
        );

        return;
      }

      // ==========================================
      // REAL MONGODB BOOKING ID
      // ==========================================

      const bookingId =
        String(
          booking.id || ""
        ).trim();

      if (!bookingId) {
        throw new Error(
          "This booking does not have a valid booking ID."
        );
      }

      // ==========================================
      // VALIDATE MONGODB OBJECT ID
      // ==========================================

      const isValidMongoId =
        /^[a-fA-F0-9]{24}$/.test(
          bookingId
        );

      if (!isValidMongoId) {
        console.error(
          "Invalid booking ID:",
          bookingId
        );

        rememberInvalidBooking(
          bookingId
        );

        throw new Error(
          "This booking does not have a valid MongoDB booking ID. Please create the booking again."
        );
      }

      console.log(
        "Payment booking:",
        booking
      );

      console.log(
        "MongoDB Booking ID:",
        bookingId
      );

      // ==========================================
      // INITIALIZE PAYSTACK PAYMENT
      // ==========================================

      const response = await fetch(
        `${API_URL}/payments/initialize`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,

            Accept:
              "application/json",
          },

          body: JSON.stringify({
            bookingId,
          }),
        }
      );

      // ==========================================
      // READ RESPONSE
      // ==========================================

      let result: any = {};

      try {
        result =
          await response.json();
      } catch {
        throw new Error(
          `The server returned an invalid response (${response.status}).`
        );
      }

      console.log(
        "Payment initialization response:",
        result
      );

      // ==========================================
      // BOOKING DOES NOT EXIST
      // ==========================================

      if (
        response.status === 404 &&
        /booking/i.test(
          String(
            result?.message ||
              result?.error ||
              ""
          )
        )
      ) {
        rememberInvalidBooking(
          bookingId
        );

        setPaymentError(
          "This booking is no longer available."
        );

        setTimeout(() => {
          navigate(-1);
        }, 800);

        return;
      }

      // ==========================================
      // HANDLE BACKEND ERROR
      // ==========================================

      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.error ||
            `Unable to initialize payment (${response.status}).`
        );
      }

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Unable to initialize payment."
        );
      }

      // ==========================================
      // GET PAYSTACK URL
      // ==========================================

      const authorizationUrl =
        result?.authorization_url ||
        result?.data
          ?.authorization_url;

      if (!authorizationUrl) {
        console.error(
          "Paystack URL missing:",
          result
        );

        throw new Error(
          "Paystack payment URL was not returned by the server."
        );
      }

      console.log(
        "Redirecting to Paystack:",
        authorizationUrl
      );

      // ==========================================
      // REDIRECT TO PAYSTACK
      // ==========================================

      window.location.assign(
        authorizationUrl
      );
    } catch (error: any) {
      console.error(
        "Payment initialization error:",
        error
      );

      setPaymentError(
        error?.message ||
          "Unable to start payment. Please try again."
      );
    } finally {
      setPaying(false);
    }
  };

  // ======================================================
  // BOOKING PRICE
  // ======================================================

  const bookingPrice =
    Number(
      booking?.price
    ) || 0;

  // ======================================================
  // PAYMENT CALLBACK UI
  // ======================================================

  if (isPaymentCallback) {
    return (
      <DashboardLayout
        role="customer"
        navItems={customerNavItems}
      >
        <div className="relative flex min-h-[calc(100vh-80px)] items-center justify-center overflow-hidden px-4 py-10 sm:px-6">

          {/* BACKGROUND */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary-500/10 blur-3xl" />

            <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          </div>

          <div className="relative w-full max-w-lg">

            {/* VERIFICATION CARD */}
            <div className="overflow-hidden rounded-[2rem] border border-ink-100 bg-white shadow-2xl shadow-ink-900/5 dark:border-ink-800 dark:bg-ink-900">

              {/* TOP ACCENT */}
              <div className="h-1.5 bg-gradient-to-r from-primary-500 via-primary-600 to-blue-600" />

              <div className="p-7 text-center sm:p-10">

                {/* LOADING */}
                {verifying && (
                  <>
                    <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-950/40">
                      <div className="absolute inset-0 animate-ping rounded-full bg-primary-500/10" />

                      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm dark:bg-ink-900">
                        <Loader2 className="h-8 w-8 animate-spin text-primary-600 dark:text-primary-400" />
                      </div>
                    </div>

                    <div className="mt-7">
                      <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">
                        <Sparkles className="h-3.5 w-3.5" />
                        Processing securely
                      </div>

                      <h1 className="mt-5 text-2xl font-black tracking-tight text-ink-900 dark:text-white sm:text-3xl">
                        Verifying your payment
                      </h1>

                      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink-500 dark:text-ink-400">
                        We're confirming your
                        transaction with Paystack.
                        Please don't close this
                        page.
                      </p>
                    </div>

                    <div className="mt-8 rounded-2xl border border-ink-100 bg-ink-50 p-4 dark:border-ink-800 dark:bg-ink-950/40">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-950/60">
                          <LockKeyhole className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        </div>

                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-xs font-bold text-ink-800 dark:text-ink-200">
                            Secure transaction verification
                          </p>

                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
                            <div className="h-full w-2/3 animate-pulse rounded-full bg-primary-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* SUCCESS */}
                {!verifying &&
                  verificationSuccess && (
                    <>
                      <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
                        <div className="absolute inset-0 rounded-full bg-emerald-500/10" />

                        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20">
                          <Check className="h-8 w-8 text-white" />
                        </div>
                      </div>

                      <div className="mt-7">
                        <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Payment confirmed
                        </div>

                        <h1 className="mt-5 text-2xl font-black tracking-tight text-ink-900 dark:text-white sm:text-3xl">
                          Payment successful
                        </h1>

                        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink-500 dark:text-ink-400">
                          {verificationMessage ||
                            "Your payment has been successfully verified and your booking is now confirmed."}
                        </p>
                      </div>

                      <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                        <div className="flex items-start gap-3 text-left">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500">
                            <ShieldCheck className="h-4 w-4 text-white" />
                          </div>

                          <div>
                            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                              Booking confirmed
                            </p>

                            <p className="mt-1 text-xs leading-5 text-emerald-700 dark:text-emerald-400">
                              Your payment has been
                              verified. You can now
                              manage your booking from
                              your dashboard.
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            "/customer",
                            {
                              replace: true,
                            }
                          )
                        }
                        className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink-900 px-5 py-4 text-sm font-bold text-white shadow-xl shadow-ink-900/10 transition hover:-translate-y-0.5 hover:opacity-90 dark:bg-white dark:text-ink-900"
                      >
                        Go to Dashboard

                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}

                {/* FAILED */}
                {!verifying &&
                  !verificationSuccess && (
                    <>
                      <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/20">
                          <AlertCircle className="h-8 w-8 text-white" />
                        </div>
                      </div>

                      <div className="mt-7">
                        <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 dark:bg-red-950/30 dark:text-red-300">
                          <X className="h-3.5 w-3.5" />
                          Verification failed
                        </div>

                        <h1 className="mt-5 text-2xl font-black tracking-tight text-ink-900 dark:text-white sm:text-3xl">
                          Payment could not be verified
                        </h1>

                        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink-500 dark:text-ink-400">
                          {verificationMessage ||
                            "We could not confirm this transaction. Your booking has not been marked as paid."}
                        </p>
                      </div>

                      <div className="mt-7 rounded-2xl border border-red-100 bg-red-50/70 p-4 text-left dark:border-red-900/40 dark:bg-red-950/20">
                        <div className="flex gap-3">
                          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

                          <div>
                            <p className="text-sm font-bold text-red-900 dark:text-red-300">
                              What you can do
                            </p>

                            <p className="mt-1 text-xs leading-5 text-red-700 dark:text-red-400">
                              If money was deducted
                              from your account, don't
                              make another payment
                              immediately. Check your
                              booking status or contact
                              support first.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-7 grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() =>
                            window.location.reload()
                          }
                          className="flex items-center justify-center gap-2 rounded-2xl border border-ink-200 bg-white px-5 py-3.5 text-sm font-bold text-ink-800 transition hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800"
                        >
                          <RefreshCcw className="h-4 w-4" />
                          Try Again
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              "/customer",
                              {
                                replace: true,
                              }
                            )
                          }
                          className="flex items-center justify-center gap-2 rounded-2xl bg-ink-900 px-5 py-3.5 text-sm font-bold text-white transition hover:opacity-90 dark:bg-white dark:text-ink-900"
                        >
                          Dashboard

                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
              </div>

              <div className="border-t border-ink-100 bg-ink-50/70 px-6 py-4 dark:border-ink-800 dark:bg-ink-950/40">
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-ink-500 dark:text-ink-400">
                  <LockKeyhole className="h-3.5 w-3.5" />
                  Secured by Servicely & Paystack
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ======================================================
  // RESOLVING BOOKING
  // ======================================================

  if (
    !booking &&
    resolvingBooking
  ) {
    return (
      <DashboardLayout
        role="customer"
        navItems={customerNavItems}
      >
        <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-10">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-20 h-64 w-64 -translate-x-1/2 rounded-full bg-primary-500/5 blur-3xl" />
          </div>

          <div className="relative w-full max-w-lg rounded-[2rem] border border-ink-100 bg-white p-8 text-center shadow-xl shadow-ink-900/5 dark:border-ink-800 dark:bg-ink-900 sm:p-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-50 dark:bg-primary-950/30">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600 dark:text-primary-400" />
            </div>

            <h2 className="mt-6 text-2xl font-black tracking-tight text-ink-900 dark:text-white">
              Loading booking
            </h2>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink-500 dark:text-ink-400">
              We're loading your booking details.
              Please wait a moment.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ======================================================
  // BOOKING NOT FOUND
  // ======================================================

  if (
    !booking &&
    bookingResolutionFailed
  ) {
    return (
      <DashboardLayout
        role="customer"
        navItems={customerNavItems}
      >
        <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-10">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-20 h-64 w-64 -translate-x-1/2 rounded-full bg-red-500/5 blur-3xl" />
          </div>

          <div className="relative w-full max-w-lg rounded-[2rem] border border-ink-100 bg-white p-8 text-center shadow-xl shadow-ink-900/5 dark:border-ink-800 dark:bg-ink-900 sm:p-10">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 dark:bg-red-950/30">
              <X className="h-8 w-8 text-red-500" />
            </div>

            <h2 className="mt-6 text-2xl font-black tracking-tight text-ink-900 dark:text-white">
              Booking not found
            </h2>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink-500 dark:text-ink-400">
              We couldn't find this booking.
              It may have been removed or is
              no longer available for payment.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(-1)
              }
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-ink-900 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-ink-900/10 transition hover:-translate-y-0.5 hover:opacity-90 dark:bg-white dark:text-ink-900"
            >
              <ArrowLeft className="h-4 w-4" />

              Back to My Bookings
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ======================================================
  // PAYMENT PAGE
  // ======================================================

  return (
    <DashboardLayout
      role="customer"
      navItems={customerNavItems}
    >
      <div className="relative min-h-[calc(100vh-80px)] overflow-hidden px-4 py-6 sm:px-6 sm:py-10">

        {/* BACKGROUND */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary-500/5 blur-3xl" />

          <div className="absolute -right-20 top-40 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl">

          {/* BACK */}
          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            className="group mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-semibold text-ink-500 transition hover:text-primary-600 dark:text-ink-400 dark:hover:text-primary-400"
          >
            <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
            Back
          </button>

          {/* MAIN CARD */}
          <div className="overflow-hidden rounded-[2rem] border border-ink-100 bg-white shadow-2xl shadow-ink-900/5 dark:border-ink-800 dark:bg-ink-900">

            {/* TOP ACCENT */}
            <div className="h-1.5 bg-gradient-to-r from-primary-500 via-primary-600 to-blue-600" />

            <div className="p-5 sm:p-8 lg:p-10">

              {/* HEADER */}
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

                <div className="flex items-start gap-4">

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 shadow-sm dark:bg-primary-950/40 dark:text-primary-400">
                    <CreditCard className="h-6 w-6" />
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">
                      Secure checkout
                    </span>

                    <h1 className="mt-1.5 text-2xl font-black tracking-tight text-ink-900 dark:text-white sm:text-3xl">
                      Complete your payment
                    </h1>

                    <p className="mt-2 max-w-lg text-sm leading-6 text-ink-500 dark:text-ink-400">
                      Confirm your booking by
                      completing your secure payment
                      through Paystack.
                    </p>
                  </div>
                </div>

                <div className="hidden shrink-0 items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300 sm:flex">
                  <LockKeyhole className="h-3.5 w-3.5" />
                  Secure
                </div>
              </div>

              {/* BOOKING SUMMARY */}
              <div className="mt-8 overflow-hidden rounded-3xl border border-ink-100 dark:border-ink-800">

                {/* SERVICE HEADER */}
                <div className="bg-gradient-to-br from-ink-50 to-white p-5 dark:from-ink-950/70 dark:to-ink-900 sm:p-6">

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-400">
                        Booking summary
                      </p>

                      <h2 className="mt-1.5 break-words text-lg font-black text-ink-900 dark:text-white sm:text-xl">
                        {booking?.serviceName ||
                          "Service"}
                      </h2>

                      <p className="mt-1 text-sm font-medium text-ink-500 dark:text-ink-400">
                        with{" "}
                        <span className="text-ink-700 dark:text-ink-300">
                          {booking?.providerName ||
                            "Provider"}
                        </span>
                      </p>
                    </div>

                    <div className="shrink-0 rounded-2xl bg-white px-4 py-3 text-left shadow-sm ring-1 ring-ink-100 dark:bg-ink-900 dark:ring-ink-800 sm:text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
                        Total
                      </p>

                      <p className="mt-0.5 text-xl font-black text-primary-600 dark:text-primary-400">
                        {formatNaira(
                          bookingPrice
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* DETAILS */}
                <div className="grid gap-0 divide-y divide-ink-100 dark:divide-ink-800 sm:grid-cols-2 sm:divide-x sm:divide-y-0">

                  {/* DATE */}
                  <div className="flex gap-3 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-950/40">
                      <Calendar className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                        Date
                      </p>

                      <p className="mt-1 text-sm font-bold text-ink-800 dark:text-ink-200">
                        {formatDate(
                          booking?.date || ""
                        )}
                      </p>
                    </div>
                  </div>

                  {/* TIME */}
                  <div className="flex gap-3 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-950/40">
                      <Clock className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                        Time
                      </p>

                      <p className="mt-1 text-sm font-bold text-ink-800 dark:text-ink-200">
                        {formatTime(
                          booking?.time || ""
                        )}
                      </p>
                    </div>
                  </div>

                  {/* LOCATION */}
                  <div className="flex gap-3 p-5 sm:col-span-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-950/40">
                      <MapPin className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                        Location
                      </p>

                      <p className="mt-1 break-words text-sm font-bold text-ink-800 dark:text-ink-200">
                        {booking?.location ||
                          "Location not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* PRICE */}
              <div className="mt-5 rounded-3xl border border-primary-100 bg-primary-50/60 p-5 dark:border-primary-900/30 dark:bg-primary-950/20 sm:p-6">

                <div className="flex items-center justify-between gap-4">

                  <div>
                    <p className="text-sm font-bold text-ink-700 dark:text-ink-300">
                      Amount to pay
                    </p>

                    <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                      Your booking price
                    </p>
                  </div>

                  <p className="text-2xl font-black tracking-tight text-ink-900 dark:text-white sm:text-3xl">
                    {formatNaira(
                      bookingPrice
                    )}
                  </p>
                </div>
              </div>

              {/* ERROR */}
              {paymentError && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/50">
                      <X className="h-4 w-4 text-red-500" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-red-800 dark:text-red-300">
                        Payment could not start
                      </p>

                      <p className="mt-1 break-words text-xs leading-5 text-red-700 dark:text-red-400">
                        {paymentError}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SECURITY */}
              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/50">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                      Safe & secure payment
                    </p>

                    <p className="mt-1 text-xs leading-5 text-emerald-700 dark:text-emerald-400">
                      Your payment is processed
                      securely by Paystack. Servicely
                      only confirms your booking after
                      successful payment verification.
                    </p>
                  </div>
                </div>
              </div>

              {/* PAY BUTTON */}
              <button
                type="button"
                onClick={handlePayment}
                disabled={
                  paying ||
                  bookingPrice <= 0
                }
                className="group relative mt-6 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary-600 px-5 py-4 text-sm font-black text-white shadow-xl shadow-primary-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-2xl hover:shadow-primary-600/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <span className="absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-500 group-hover:translate-x-full" />

                {paying ? (
                  <>
                    <Loader2 className="relative h-5 w-5 animate-spin" />

                    <span className="relative">
                      Preparing secure payment...
                    </span>
                  </>
                ) : (
                  <>
                    <CreditCard className="relative h-5 w-5" />

                    <span className="relative">
                      Pay{" "}
                      {formatNaira(
                        bookingPrice
                      )}
                    </span>

                    <ChevronRight className="relative h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>

              {/* FOOTER */}
              <div className="mt-5 flex items-center justify-center gap-2 text-center text-[11px] font-medium text-ink-400 dark:text-ink-500">
                <LockKeyhole className="h-3.5 w-3.5" />
                Payments are securely handled by Paystack
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}



/* =========================================================
   REVIEW PAGE
========================================================= */

export function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { bookings } = useBookings();

  const booking = bookings.find(
    (item: any) =>
      String(item.id) === String(id)
  );

  const [rating, setRating] =
    useState(0);

  const [review, setReview] =
    useState("");

  const [submitted, setSubmitted] =
    useState(false);

  const handleSubmit = () => {
    if (!rating) return;

    /*
     * Review API can be connected here later.
     */
    setSubmitted(true);
  };

  return (
    <DashboardLayout
      role="customer"
      navItems={customerNavItems}
    >
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-ink-500 transition hover:text-primary-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm dark:border-ink-800 dark:bg-ink-900 sm:p-8">
          {!submitted ? (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <h1 className="mt-5 text-2xl font-black text-ink-900 dark:text-white">
                Leave a review
              </h1>

              <p className="mt-2 text-sm leading-6 text-ink-500 dark:text-ink-400">
                Share your experience with the provider.
              </p>

              {booking && (
                <div className="mt-6 rounded-2xl bg-ink-50 p-4 dark:bg-ink-950/50">
                  <p className="text-xs text-ink-400">
                    Service
                  </p>

                  <p className="mt-1 font-bold text-ink-900 dark:text-white">
                    {booking.serviceName}
                  </p>

                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                    {booking.providerName}
                  </p>
                </div>
              )}

              <div className="mt-7">
                <p className="text-sm font-bold text-ink-800 dark:text-ink-200">
                  Your rating
                </p>

                <div className="mt-3 flex gap-2">
                  {[1, 2, 3, 4, 5].map(
                    (value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setRating(value)
                        }
                        className={[
                          "flex h-11 w-11 items-center justify-center rounded-xl border text-xl transition",
                          rating >= value
                            ? "border-primary-500 bg-primary-50 text-primary-600 dark:bg-primary-950/30"
                            : "border-ink-200 text-ink-300 dark:border-ink-700 dark:text-ink-600",
                        ].join(" ")}
                      >
                        ★
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-bold text-ink-800 dark:text-ink-200">
                  Review
                </label>

                <textarea
                  value={review}
                  onChange={(event) =>
                    setReview(
                      event.target.value
                    )
                  }
                  rows={5}
                  placeholder="Tell us about your experience..."
                  className="mt-2 w-full resize-none rounded-2xl border border-ink-200 bg-white px-4 py-3.5 text-sm text-ink-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-ink-700 dark:bg-ink-950 dark:text-white"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!rating}
                className="mt-6 w-full rounded-2xl bg-primary-600 px-5 py-4 text-sm font-bold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Submit Review
              </button>
            </>
          ) : (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
                <Check className="h-8 w-8 text-emerald-500" />
              </div>

              <h2 className="mt-5 text-xl font-black text-ink-900 dark:text-white">
                Thank you for your review!
              </h2>

              <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
                Your feedback has been recorded.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate("/customer")
                }
                className="mt-6 rounded-2xl bg-ink-900 px-6 py-3.5 text-sm font-bold text-white dark:bg-white dark:text-ink-900"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}