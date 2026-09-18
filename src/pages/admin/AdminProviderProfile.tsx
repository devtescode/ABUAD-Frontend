
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  BriefcaseBusiness,
  MapPin,
  Loader2,
  Ban,
  Clock,
} from "lucide-react";

import {
  DashboardLayout,
  DashboardHeader,
} from "@/components/DashboardLayout";

import { adminNavItems } from "@/data/adminNavItems";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

interface Provider {
  _id: string;
  fullName?: string;
  name?: string;
  email?: string;
  avatar?: string;
  profileImage?: string;
  categories?: string[];
  status?: string;
  verified?: boolean;
}

interface Service {
  _id: string;
  title: string;
  category: string;
  price: number;
  duration: string;
  description: string;
  image: string;
  status?: string;
}

interface ProviderResponse {
  success: boolean;
  message?: string;
  provider?: Provider;
  services?: Service[];
}

const getProviderStatus = (provider: Provider) => {
  const status = provider.status?.toLowerCase();

  if (status === "suspended") {
    return {
      label: "Suspended",
      className: "bg-red-500/15 text-red-100 ring-red-300/30",
    };
  }

  if (
    status === "active" ||
    status === "verified" ||
    status === "approved" ||
    provider.verified
  ) {
    return {
      label: "Active / Verified",
      className: "bg-primary-400/15 text-primary-100 ring-primary-300/30",
    };
  }

  if (status === "rejected") {
    return {
      label: "Rejected",
      className: "bg-red-500/15 text-red-100 ring-red-300/30",
    };
  }

  return {
    label: "Pending review",
    className: "bg-amber-400/15 text-amber-100 ring-amber-300/30",
  };
};

export function AdminProviderProfile() {
  const { id } = useParams<{ id: string }>();

  const [provider, setProvider] =
    useState<Provider | null>(null);

  const [services, setServices] =
    useState<Service[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!id) {
      setError("Provider ID is missing.");
      setLoading(false);
      return;
    }

    const fetchProvider = async () => {
      try {
        setLoading(true);
        setError("");

        const token = sessionStorage.getItem(
          "servicely_admin_token"
        );

        if (!token) {
          throw new Error(
            "Admin authentication token not found."
          );
        }

        const response = await fetch(
          `${API_URL}/admin/providers/${id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result: ProviderResponse =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Failed to fetch provider."
          );
        }

        setProvider(result.provider || null);
        setServices(result.services || []);
      } catch (error) {
        console.error(
          "Fetch admin provider error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load provider."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProvider();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout
        role="admin"
        navItems={adminNavItems}
      >
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-ink-500" />

            <p className="text-sm text-ink-500">
              Loading provider profile...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !provider) {
    return (
      <DashboardLayout
        role="admin"
        navItems={adminNavItems}
      >
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="max-w-md text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/10">
              <Ban className="h-5 w-5" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-ink-900 dark:text-white">
              Provider not found
            </h2>

            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              {error ||
                "This provider could not be found."}
            </p>

            <Link
              to="/admin/providers"
              className="btn-primary btn-sm mt-5 inline-flex"
            >
              Back to Providers
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const providerName =
    provider.fullName ||
    provider.name ||
    "Service Provider";

  const providerImage =
    provider.avatar ||
    provider.profileImage ||
    "/images/default-avatar.png";

  const providerStatus = getProviderStatus(provider);

  return (
    <DashboardLayout
      role="admin"
      navItems={adminNavItems}
    >
      <DashboardHeader
        title="Provider Profile"
        subtitle={`Viewing ${providerName}`}
      />

      <Link
        to="/admin/providers"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-ink-500 transition hover:text-ink-900 dark:text-ink-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Providers
      </Link>

      {/* Provider information */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-ink-900 to-ink-700 px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <img
              src={providerImage}
              alt={providerName}
              onError={(event) => {
                event.currentTarget.src =
                  "/images/default-avatar.png";
              }}
              className="h-24 w-24 rounded-2xl border-2 border-white/30 object-cover shadow-xl"
            />

            <div className="text-white">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">
                  {providerName}
                </h1>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${providerStatus.className}`}
                >
                  {providerStatus.label}
                </span>
              </div>

              {provider.email && (
                <p className="mt-1 text-sm text-white/70">
                  {provider.email}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {provider.categories?.map(
                  (category) => (
                    <span
                      key={category}
                      className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80"
                    >
                      {category}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
          <div className="rounded-xl bg-ink-50 p-4 dark:bg-ink-800">
            <Mail className="h-5 w-5 text-ink-500" />

            <p className="mt-3 text-xs text-ink-400">
              Email
            </p>

            <p className="mt-1 break-all text-sm font-semibold text-ink-900 dark:text-white">
              {provider.email || "Not provided"}
            </p>
          </div>

          <div className="rounded-xl bg-ink-50 p-4 dark:bg-ink-800">
            <BriefcaseBusiness className="h-5 w-5 text-ink-500" />

            <p className="mt-3 text-xs text-ink-400">
              Services
            </p>

            <p className="mt-1 text-sm font-semibold text-ink-900 dark:text-white">
              {services.length} posted
            </p>
          </div>

          <div className="rounded-xl bg-ink-50 p-4 dark:bg-ink-800">
            <MapPin className="h-5 w-5 text-ink-500" />

            <p className="mt-3 text-xs text-ink-400">
              Location
            </p>

            <p className="mt-1 text-sm font-semibold text-ink-900 dark:text-white">
              ABUAD
            </p>
          </div>
        </div>
      </div>

      {/* Provider posts */}
      <div className="mt-7">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink-900 dark:text-white">
              Provider Posts
            </h2>

            <p className="text-sm text-ink-500 dark:text-ink-400">
              Services posted by this provider
            </p>
          </div>

          <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-600 dark:bg-ink-800 dark:text-ink-300">
            {services.length}{" "}
            {services.length === 1
              ? "Post"
              : "Posts"}
          </span>
        </div>

        {services.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-200 p-10 text-center dark:border-ink-800">
            <BriefcaseBusiness className="mx-auto h-8 w-8 text-ink-400" />

            <h3 className="mt-3 font-semibold text-ink-900 dark:text-white">
              No posts yet
            </h3>

            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              This provider hasn't posted any
              services.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service._id}
                className="card overflow-hidden"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="h-full w-full object-cover"
                  />

                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-ink-800 shadow-sm">
                    {service.category}
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-ink-900 dark:text-white">
                    {service.title}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-sm text-ink-500 dark:text-ink-400">
                    {service.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-ink-400">
                        Price
                      </p>

                      <p className="font-bold text-ink-900 dark:text-white">
                        ₦
                        {Number(
                          service.price || 0
                        ).toLocaleString("en-NG")}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-ink-400">
                      <Clock className="h-3.5 w-3.5" />
                      {service.duration}
                    </div>
                  </div>

                  {/* <div className="mt-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        service.status ===
                        "approved"
                          ? "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                          : service.status ===
                            "rejected"
                          ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                          : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                      }`}
                    >
                      {service.status ||
                        "pending"}
                    </span>
                  </div> */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
