
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Clock,
  MapPin,
  Star,
  ArrowRight,
} from "lucide-react";

interface CustomerServiceCardProps {
  service: {
    _id: string;
    title: string;
    category: string;
    price: number;
    duration: string;
    description: string;
    image: string;

    provider?: {
      _id?: string;
      fullName?: string;
      name?: string;
      avatar?: string;
      profileImage?: string;
    };
  };
  additionalServicesCount?: number;
  providerServices?: Array<{
    _id: string;
    title: string;
    category: string;
    price: number;
    duration: string;
    description: string;
    image: string;
  }>;
}



const formatNaira = (amount: number) => {
  return `₦${Number(amount || 0).toLocaleString("en-NG")}`;
};

export function CustomerServiceCard({
  service,
  additionalServicesCount = 0,
  providerServices = [],
}: CustomerServiceCardProps) {
  const providerName =
    service.provider?.fullName ||
    service.provider?.name ||
    "Service Provider";

  const providerImage =
    service.provider?.avatar ||
    service.provider?.profileImage ||
    "/images/default-avatar.png";

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="group overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm transition-shadow duration-300 hover:shadow-xl dark:border-ink-800 dark:bg-ink-900"
    >
      {/* Service Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={service.image}
          alt={service.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Image Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Category */}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-ink-800 shadow-sm backdrop-blur dark:bg-ink-900/90 dark:text-white">
          {service.category}
        </span>

        {/* Provider */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <img
            src={providerImage}
            alt={providerName}
            className="h-9 w-9 rounded-full border-2 border-white object-cover"
            onError={(e) => {
              e.currentTarget.src = "/images/default-avatar.png";
            }}
          />

          <div>
            <p className="text-xs font-semibold text-white">
              {providerName}
            </p>

            <div className="flex items-center gap-1 text-[11px] text-white/80">
              <Star className="h-3 w-3 fill-current" />
              Verified Provider
            </div>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="line-clamp-1 text-base font-bold text-ink-900 dark:text-white">
          {service.title}
        </h3>

        {additionalServicesCount > 0 && (
          <p className="mt-0 text-xs font-medium text-primary-600 dark:text-primary-400">
            +{additionalServicesCount} more service{additionalServicesCount === 1 ? "" : "s"} from this provider
          </p>
        )}

        {/* Description */}
        <p className="mt-0 line-clamp-2 min-h-[35px] text-sm leading-5 text-ink-500 dark:text-ink-400">
          {service.description}
        </p>

        {/* Price + Duration */}
        <div className="flex items-end justify-between border-t border-ink-100 pt-4 dark:border-ink-800">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-ink-400">
              Starting from
            </p>

            <p className="text-lg font-bold text-ink-900 dark:text-white">
              {formatNaira(service.price)}
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-ink-50 px-2.5 py-1.5 text-xs font-medium text-ink-500 dark:bg-ink-800 dark:text-ink-300">
            <Clock className="h-3.5 w-3.5" />
            {service.duration}
          </div>
        </div>

        {/* Location */}
        <div className="mt-0 flex items-center gap-1.5 text-xs text-ink-400">
          <MapPin className="h-3.5 w-3.5" />
          ABUAD
        </div>

        {/* View Service */}
        {/* <Link
          to={`/services/${service._id}`} */}
        {/* <Link to={`/providers/${service.provider?._id}`}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-800 dark:bg-white dark:text-ink-900 dark:hover:bg-ink-100"
        >
          View Service
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link> */} 
        {service.provider?._id ? (
          <Link
            to={`/providers/${service.provider._id}`}
            state={{ providerServices }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-800 dark:bg-white dark:text-ink-900 dark:hover:bg-ink-100"
          >
            View Service
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="mt-4 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-400 dark:bg-ink-800 dark:text-ink-500"
          >
            Provider unavailable
          </button>
        )}

      </div>
    </motion.div>
  );
}

