import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Ban,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  Star,
  User,
  UserX,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  DashboardHeader,
  DashboardLayout,
  StatCard,
} from "@/components/DashboardLayout";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Skeleton,
  providerAvatar,
  providerName,
  type ProviderLike,
  type ServiceLike,
} from "@/components/ui";
import { adminNavItems } from "@/data/adminNavItems";
import { formatNaira } from "@/data/mockData";
import { useAdminProvider } from "@/hooks/queries";
import { getApiErrorMessage, hasAdminToken } from "@/lib/api";

/* =========================================================
   TYPES
========================================================= */

interface Provider extends ProviderLike {
  email?: string;
  phoneNumber?: string;
  matricNo?: string;
  about?: string;
  location?: string;
  joinedDate?: string;
  createdAt?: string;
  updatedAt?: string;
  verifiedAt?: string;
  verificationStatus?: string;
  rejectionReason?: string;
}

type ProviderStatus = {
  label: string;
  tone: "success" | "warning" | "danger";
  icon: LucideIcon;
};

/* =========================================================
   NORMALIZATION HELPERS
========================================================= */

const getProviderStatus = (provider: Provider): ProviderStatus => {
  const status = provider.status?.toLowerCase();

  if (status === "suspended") {
    return { label: "Suspended", tone: "danger", icon: Ban };
  }

  if (
    status === "active" ||
    status === "verified" ||
    status === "approved" ||
    provider.verified
  ) {
    return {
      label: "Active / Verified",
      tone: "success",
      icon: ShieldCheck,
    };
  }

  if (status === "rejected") {
    return { label: "Rejected", tone: "danger", icon: XCircle };
  }

  return { label: "Pending review", tone: "warning", icon: Clock };
};

const getServiceStatus = (status?: string) => {
  const label = status || "active";

  if (label === "approved" || label === "active") {
    return { label, tone: "success" as const };
  }

  if (label === "rejected") {
    return { label, tone: "danger" as const };
  }

  return { label, tone: "warning" as const };
};

const formatDate = (value?: string) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/* =========================================================
   SMALL PRESENTATIONAL PIECES
========================================================= */

function DetailRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-ink-800 dark:text-ink-300">
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-ink-500">
          {label}
        </dt>

        <dd className="mt-0.5 break-words text-sm font-medium text-slate-800 dark:text-ink-100">
          {href ? (
            <a
              href={href}
              className="transition hover:text-brand-600 hover:underline dark:hover:text-brand-300"
            >
              {value}
            </a>
          ) : (
            value
          )}
        </dd>
      </div>
    </div>
  );
}

function MetaRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-ink-800">
      <span className="text-sm text-slate-500 dark:text-ink-400">
        {label}
      </span>

      <span className="text-right">{children}</span>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading provider profile…</span>

      <div className="card overflow-hidden">
        <div className="h-28 bg-gradient-to-br from-slate-200 to-slate-100 dark:from-ink-800 dark:to-ink-900" />

        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <Skeleton className="h-20 w-20 rounded-full" />

          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-52 max-w-full" />
            <Skeleton className="h-4 w-64 max-w-full" />
            <Skeleton className="h-4 w-40 max-w-full" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card p-5">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <Skeleton className="mt-4 h-6 w-16" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-4 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-5/6" />
            <Skeleton className="mt-2 h-3 w-2/3" />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-64 w-full rounded-2xl"
              />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <Skeleton className="h-5 w-32" />
            <div className="mt-5 space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full" />
              ))}
            </div>
          </div>

          <div className="card p-6">
            <Skeleton className="h-5 w-28" />
            <div className="mt-5 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN PROVIDER PROFILE
========================================================= */

export function AdminProviderProfile() {
  const { id } = useParams<{ id: string }>();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAdminProvider(id);

  const provider = data?.provider
    ? (data.provider as Provider)
    : null;

  const services: ServiceLike[] = Array.isArray(data?.services)
    ? data.services.filter(
        (service): service is ServiceLike => Boolean(service)
      )
    : [];

  const missingAdminSession =
    Boolean(id) && !hasAdminToken();

  const subtitle = !id
    ? "Provider details unavailable"
    : missingAdminSession
      ? "Admin session required"
      : isLoading
        ? "Loading provider details…"
        : provider
          ? `Viewing ${providerName(provider)}`
          : "Provider details";

  return (
    <DashboardLayout role="admin" navItems={adminNavItems}>
      <DashboardHeader
        title="Provider Profile"
        subtitle={subtitle}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {id && !missingAdminSession && (
              <Button
                variant="outline"
                size="sm"
                icon={RefreshCw}
                loading={isFetching}
                onClick={() => void refetch()}
              >
                Refresh
              </Button>
            )}

            <Link
              to="/admin/providers"
              className="btn-outline btn-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Providers
            </Link>
          </div>
        }
      />

      {!id ? (
        <EmptyState
          icon={UserX}
          title="Provider ID is missing"
          description="The URL does not include a provider ID. Return to the providers list and try again."
          action={
            <Link
              to="/admin/providers"
              className="btn-primary btn-sm"
            >
              Back to Providers
            </Link>
          }
        />
      ) : missingAdminSession ? (
        <ErrorState message="Admin authentication token was not found. Please sign in again." />
      ) : isLoading ? (
        <ProfileSkeleton />
      ) : isError ? (
        <ErrorState
          message={
            getApiErrorMessage(error) ||
            "Unable to load this provider. Please try again."
          }
          onRetry={() => void refetch()}
        />
      ) : !provider ? (
        <EmptyState
          icon={UserX}
          title="Provider not found"
          description="This provider could not be found. They may have been removed or the link may be incorrect."
          action={
            <Link
              to="/admin/providers"
              className="btn-primary btn-sm"
            >
              Back to Providers
            </Link>
          }
        />
      ) : (
        <ProviderProfileContent
          provider={provider}
          services={services}
        />
      )}
    </DashboardLayout>
  );
}

/* =========================================================
   LOADED CONTENT
========================================================= */

function ProviderProfileContent({
  provider,
  services,
}: {
  provider: Provider;
  services: ServiceLike[];
}) {
  const displayName = providerName(provider);
  const avatar = providerAvatar(provider);
  const providerStatus = getProviderStatus(provider);

  const location = provider.location?.trim() || "ABUAD";

  const joinedOn = formatDate(
    provider.joinedDate || provider.createdAt
  );
  const verifiedOn = formatDate(provider.verifiedAt);
  const updatedOn = formatDate(provider.updatedAt);

  const categories = (
    provider.categories ||
    (provider.category ? [provider.category] : [])
  ).filter((category): category is string =>
    Boolean(category)
  );

  const rating =
    typeof provider.rating === "number" ? provider.rating : 0;

  const reviewCount =
    typeof provider.reviewCount === "number"
      ? provider.reviewCount
      : 0;

  const completedBookings =
    typeof provider.completedBookings === "number"
      ? provider.completedBookings
      : 0;

  const stats: Array<{
    label: string;
    value: string;
    icon: LucideIcon;
    color: "brand" | "success" | "warning" | "sky";
  }> = [
    {
      label: "Services posted",
      value: String(services.length),
      icon: BriefcaseBusiness,
      color: "brand",
    },
    {
      label: "Completed bookings",
      value: String(completedBookings),
      icon: CalendarDays,
      color: "success",
    },
    {
      label:
        reviewCount > 0
          ? `Rating · ${reviewCount} ${
              reviewCount === 1 ? "review" : "reviews"
            }`
          : "Average rating",
      value: rating ? rating.toFixed(1) : "—",
      icon: Star,
      color: "warning",
    },
    {
      label: "Location",
      value: location,
      icon: MapPin,
      color: "sky",
    },
  ];

  return (
    <>
      {/* Provider header */}
      <div className="card overflow-hidden">
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-ink-900 px-5 py-7 sm:px-8 sm:py-8">
          <div
            className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar
              src={avatar}
              name={displayName}
              size="xl"
              className="border-2 border-white/40 shadow-xl"
            />

            <div className="min-w-0 flex-1 text-white">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-2xl font-bold tracking-tight">
                  {displayName}
                </h2>

                <Badge
                  tone={providerStatus.tone}
                  icon={providerStatus.icon}
                >
                  {providerStatus.label}
                </Badge>
              </div>

              {provider.email && (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/75">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {provider.email}
                  </span>
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <span
                      key={category}
                      className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/85 ring-1 ring-inset ring-white/15"
                    >
                      {category}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-white/60">
                    No categories listed
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* About */}
          <section
            className="card p-5 sm:p-6"
            aria-labelledby="provider-about-heading"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                <User className="h-5 w-5" />
              </span>

              <div>
                <h3
                  id="provider-about-heading"
                  className="text-base font-bold text-slate-900 dark:text-ink-50"
                >
                  About provider
                </h3>

                <p className="text-sm text-slate-500 dark:text-ink-400">
                  A quick summary of this provider&apos;s
                  account.
                </p>
              </div>
            </div>

            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-ink-300">
              {provider.about ||
                "This provider hasn't added a bio yet."}
            </p>
          </section>

          {/* Services */}
          <section aria-labelledby="provider-posts-heading">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3
                  id="provider-posts-heading"
                  className="text-lg font-bold text-slate-900 dark:text-ink-50"
                >
                  Provider posts
                </h3>

                <p className="text-sm text-slate-500 dark:text-ink-400">
                  Services posted by this provider
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-ink-800 dark:text-ink-300">
                {services.length}{" "}
                {services.length === 1 ? "Post" : "Posts"}
              </span>
            </div>

            {services.length === 0 ? (
              <EmptyState
                icon={BriefcaseBusiness}
                title="No posts yet"
                description="This provider hasn't posted any services."
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {services.map((service, index) => {
                  const serviceStatus = getServiceStatus(
                    service.status
                  );

                  return (
                    <article
                      key={
                        service._id ||
                        service.id ||
                        `service-${index}`
                      }
                      className="card-hover group overflow-hidden"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-950 dark:to-brand-900">
                        {service.image ? (
                          <img
                            src={service.image}
                            alt={service.title || "Service"}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(event) => {
                              event.currentTarget.style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-brand-500 dark:text-brand-400">
                            <BriefcaseBusiness className="h-8 w-8" />
                          </div>
                        )}

                        <span className="absolute left-3 top-3 max-w-[calc(100%-5.5rem)] truncate rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur dark:bg-ink-900/95 dark:text-ink-100">
                          {service.category || "Uncategorized"}
                        </span>

                        <div className="absolute right-3 top-3">
                          <Badge tone={serviceStatus.tone}>
                            {serviceStatus.label}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-5">
                        <h4 className="line-clamp-1 text-sm font-bold text-slate-900 dark:text-ink-50">
                          {service.title || "Untitled service"}
                        </h4>

                        <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-slate-500 dark:text-ink-400">
                          {service.description ||
                            "No description provided."}
                        </p>

                        <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-4 dark:border-ink-800">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-ink-500">
                              Price
                            </p>

                            <p className="font-bold text-slate-900 dark:text-ink-50">
                              {formatNaira(
                                Number(service.price || 0)
                              )}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500 dark:bg-ink-800 dark:text-ink-300">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{service.duration || "—"}</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          {/* Profile details */}
          <section
            className="card p-5 sm:p-6"
            aria-labelledby="provider-details-heading"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-ink-800 dark:text-ink-300">
                <User className="h-5 w-5" />
              </span>

              <div>
                <h3
                  id="provider-details-heading"
                  className="text-base font-bold text-slate-900 dark:text-ink-50"
                >
                  Profile details
                </h3>

                <p className="text-sm text-slate-500 dark:text-ink-400">
                  Contact and account information
                </p>
              </div>
            </div>

            <dl className="mt-4 space-y-4">
              <DetailRow
                icon={Mail}
                label="Email"
                value={provider.email || "Not provided"}
                href={
                  provider.email
                    ? `mailto:${provider.email}`
                    : undefined
                }
              />

              {provider.phoneNumber && (
                <DetailRow
                  icon={Phone}
                  label="Phone"
                  value={provider.phoneNumber}
                  href={`tel:${provider.phoneNumber}`}
                />
              )}

              {provider.matricNo && (
                <DetailRow
                  icon={GraduationCap}
                  label="Matric number"
                  value={provider.matricNo}
                />
              )}

              <DetailRow
                icon={MapPin}
                label="Location"
                value={location}
              />

              <DetailRow
                icon={CalendarDays}
                label="Joined"
                value={joinedOn || "Not available"}
              />
            </dl>
          </section>

          {/* Verification metadata */}
          <section
            className="card p-5 sm:p-6"
            aria-labelledby="provider-verification-heading"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                <ShieldCheck className="h-5 w-5" />
              </span>

              <div>
                <h3
                  id="provider-verification-heading"
                  className="text-base font-bold text-slate-900 dark:text-ink-50"
                >
                  Verification
                </h3>

                <p className="text-sm text-slate-500 dark:text-ink-400">
                  Admin review and moderation metadata
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <MetaRow label="Account status">
                <Badge
                  tone={providerStatus.tone}
                  icon={providerStatus.icon}
                >
                  {providerStatus.label}
                </Badge>
              </MetaRow>

              <MetaRow label="Verified">
                {provider.verified ? (
                  <Badge tone="success" icon={CheckCircle2}>
                    Verified
                  </Badge>
                ) : (
                  <Badge tone="neutral">Not verified</Badge>
                )}
              </MetaRow>

              {provider.verificationStatus && (
                <MetaRow label="Verification status">
                  <span className="text-sm font-semibold capitalize text-slate-800 dark:text-ink-100">
                    {provider.verificationStatus}
                  </span>
                </MetaRow>
              )}

              {verifiedOn && (
                <MetaRow label="Verified on">
                  <span className="text-sm font-semibold text-slate-800 dark:text-ink-100">
                    {verifiedOn}
                  </span>
                </MetaRow>
              )}

              {updatedOn && (
                <MetaRow label="Last updated">
                  <span className="text-sm font-semibold text-slate-800 dark:text-ink-100">
                    {updatedOn}
                  </span>
                </MetaRow>
              )}
            </div>

            {provider.rejectionReason && (
              <div className="mt-4 rounded-xl border border-danger-100 bg-danger-50 p-3 text-xs leading-relaxed text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/10 dark:text-danger-200">
                <p className="font-semibold">
                  Rejection reason
                </p>

                <p className="mt-1">
                  {provider.rejectionReason}
                </p>
              </div>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
