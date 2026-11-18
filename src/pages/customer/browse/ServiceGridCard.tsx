import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  cn,
  providerAvatar as getProviderAvatarFromLike,
  providerName as getProviderNameFromLike,
  type ServiceLike,
} from "@/components/ui";
import { formatPrice, getCategoryStyle, getInitials } from "./browseUtils";

export type BrowseDisplayService = ServiceLike & {
  providerServiceCount: number;
  additionalServicesCount: number;
  providerServices: ServiceLike[];
};

export function ServiceGridCard({
  service,
  index,
  providerId,
  serviceId,
  providerServicesForLink,
}: {
  service: BrowseDisplayService;
  index: number;
  providerId: string;
  serviceId: string;
  providerServicesForLink: ServiceLike[];
}) {
  const reduceMotion = useReducedMotion();
  const [avatarFailed, setAvatarFailed] = useState(false);
  const providerLabel = service.provider
    ? getProviderNameFromLike(service.provider)
    : "Provider";
  const providerAvatarSrc =
    service.provider && !avatarFailed ? getProviderAvatarFromLike(service.provider) : undefined;
  const canBook = Boolean(providerId && serviceId);
  const style = getCategoryStyle(service.category);
  const Icon = style.Icon;
  const title = service.title || "Service";
  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: {
          duration: 0.35,
          delay: Math.min(index * 0.05, 0.35),
          ease: "easeOut" as const,
        },
      };

  return (
    <motion.article
      role="listitem"
      {...motionProps}
      className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-[#E4E6E0] bg-white shadow-[0_1px_2px_rgba(14,26,23,0.04)] transition-shadow hover:shadow-[0_12px_28px_rgba(14,26,23,0.10)] dark:border-ink-800 dark:bg-ink-900"
    >
      <div
        className="relative h-[150px] overflow-hidden"
        style={{ backgroundColor: style.tint }}
      >
        {service.image ? (
          <img
            src={service.image}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 ring-1 ring-black/5"
              aria-hidden="true"
            >
              <Icon
                className="h-7 w-7"
                style={{ color: style.iconColor }}
                strokeWidth={1.8}
              />
            </div>
          </div>
        )}
        {service.category && (
          <span className="absolute left-3 top-3 z-10 inline-flex min-h-[28px] max-w-[60%] items-center truncate rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#0E1A17] shadow-sm backdrop-blur-sm">
            {service.category}
          </span>
        )}
        {service.additionalServicesCount > 0 && (
          <span className="absolute right-3 top-3 z-10 inline-flex min-h-[28px] items-center rounded-full bg-[#0E2B25] px-3 py-1 text-xs font-semibold text-[#C6F36B] shadow-sm">
            +{service.additionalServicesCount} more
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3
          className="line-clamp-1 text-[17px] font-bold text-[#0E1A17] dark:text-ink-50"
          style={{ fontFamily: '"Space Grotesk", Inter, sans-serif' }}
        >
          {title}
        </h3>
        <p className="mt-2 line-clamp-2 min-h-[2.75rem] text-sm leading-relaxed text-[#59625E] dark:text-ink-400">
          {service.description || "Trusted service from an approved provider."}
        </p>

        <div className="mt-4 flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0E2B25] text-xs font-bold text-[#C6F36B]"
            aria-hidden="true"
            style={{ fontFamily: '"Space Grotesk", Inter, sans-serif' }}
          >
            {providerAvatarSrc ? (
              <img
                src={providerAvatarSrc}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              getInitials(providerLabel)
            )}
          </div>
          <span className="min-w-0 truncate text-sm font-medium text-[#0E1A17] dark:text-ink-200">
            {providerLabel}
          </span>
        </div>

        <div className="mt-5 flex items-end justify-between gap-3 border-t border-[#E4E6E0] pt-4 dark:border-ink-800">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-[#59625E] dark:text-ink-400">
              From
            </p>
            <p
              className="mt-0.5 text-lg font-bold text-[#0E1A17] dark:text-ink-50"
              style={{ fontFamily: '"Space Grotesk", Inter, sans-serif' }}
            >
              {formatPrice(service.price)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {providerId ? (
              <Link
                to={`/providers/${encodeURIComponent(providerId)}`}
                state={{ providerServices: providerServicesForLink }}
                aria-label={`View provider ${providerLabel}`}
                className={cn(
                  "inline-flex h-11 items-center justify-center rounded-full border border-[#0E2B25] bg-white px-4 text-sm font-semibold text-[#0E2B25] transition-colors",
                  "hover:bg-[#F4F3EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E2B25] focus-visible:ring-offset-2 dark:border-[#3A6A5B] dark:bg-transparent dark:text-ink-50 dark:hover:bg-[#1B4238] dark:focus-visible:ring-[#C6F36B] dark:focus-visible:ring-offset-[#143D35]"
                )}
              >
                Profile
              </Link>
            ) : (
              <span
                aria-label={`Provider unavailable for ${title}`}
                className="inline-flex h-11 items-center justify-center rounded-full border border-[#E4E6E0] bg-[#F4F3EE] px-4 text-sm font-semibold text-[#59625E] dark:border-ink-800 dark:bg-ink-800/50 dark:text-ink-500"
              >
                Profile
              </span>
            )}

            {canBook ? (
              <Link
                to={`/book/${encodeURIComponent(providerId)}?service=${encodeURIComponent(serviceId)}`}
                aria-label={`Book ${title}`}
                className={cn(
                  "inline-flex h-11 items-center justify-center rounded-full bg-[#0E2B25] px-4 text-sm font-semibold text-white transition-colors",
                  "hover:bg-[#143d35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E2B25] focus-visible:ring-offset-2"
                )}
              >
                Book Now
              </Link>
            ) : (
              <button
                type="button"
                disabled
                aria-label={`Booking unavailable for ${title}`}
                className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-full bg-[#E4E6E0] px-4 text-sm font-semibold text-[#59625E] dark:bg-ink-800 dark:text-ink-500"
              >
                Book Now
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
