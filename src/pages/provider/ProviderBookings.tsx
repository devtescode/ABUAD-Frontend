
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    RefreshCw,
    Loader2,
    CalendarDays,
    Clock3,
    MapPin,
    Mail,
    Phone,
    User,
    WalletCards,
    FileText,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    CheckCircle2,
    XCircle,
    CircleDollarSign,
    Image as ImageIcon,
    User2Icon,
} from "lucide-react";

import {
    DashboardLayout,
    DashboardHeader,
} from "../../components/DashboardLayout";

import { providerNavItems } from "../../data/providerNavItems";

import { StatusBadge } from "../../components/shared";

import { formatNaira } from "../../data/mockData";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";

type ProviderBooking = {
    id: string;

    serviceId: string;
    serviceName: string;
    serviceImage: string;

    providerId: string;
    providerName: string;
    providerAvatar: string;

    customerId: string;
    customerName: string;
    customerEmail: string;
    customerAvatar: string;
    customerPhone: string;
    customerGender: string;

    date: string;
    time: string;
    location: string;

    price: number;
    notes: string;

    status: string;
    paymentStatus: string;
    paymentReference?: string | null;

    platformFee: number;
    providerAmount: number;

    createdAt: string;
    updatedAt: string;
};

const tabs = [
    "all",
    "pending",
    "confirmed",
    "paid",
    "completed",
    "cancelled",
];

export function ProviderBookings() {
    const [bookings, setBookings] = useState<
        ProviderBooking[]
    >([]);

    const [filter, setFilter] =
        useState("all");

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [expandedBooking, setExpandedBooking] =
        useState<string | null>(null);

    const token =
        sessionStorage.getItem(
            "servicely_token"
        );

    const loadBookings = useCallback(
        async (showLoader = true) => {
            try {
                if (showLoader) {
                    setLoading(true);
                } else {
                    setRefreshing(true);
                }

                setError("");

                if (!token) {
                    setError(
                        "Your session has expired. Please login again."
                    );
                    return;
                }

                const response = await fetch(
                    `${API_URL}/bookings/provider-bookings`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data =
                    await response.json();

                if (
                    !response.ok ||
                    !data.success
                ) {
                    throw new Error(
                        data.message ||
                        "Unable to load bookings."
                    );
                }

                console.log(
                    "PROVIDER BOOKINGS RESPONSE:",
                    data
                );

                setBookings(
                    Array.isArray(data.bookings)
                        ? data.bookings
                        : []
                );
            } catch (err: any) {
                console.error(
                    "PROVIDER BOOKINGS ERROR:",
                    err
                );

                setError(
                    err.message ||
                    "Unable to load your bookings."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [token]
    );

    useEffect(() => {
        loadBookings(true);
    }, [loadBookings]);

    /*
     * Automatically check for new bookings
     * every 10 seconds.
     */
    useEffect(() => {
        const interval = setInterval(() => {
            loadBookings(false);
        }, 10000);

        return () => {
            clearInterval(interval);
        };
    }, [loadBookings]);

    const filteredBookings = useMemo(() => {
        if (filter === "all") {
            return bookings;
        }

        if (filter === "paid") {
            return bookings.filter(
                (booking) =>
                    booking.paymentStatus ===
                    "paid"
            );
        }

        return bookings.filter(
            (booking) =>
                booking.status === filter
        );
    }, [bookings, filter]);

    const totalBookings =
        bookings.length;

    const pendingBookings =
        bookings.filter(
            (booking) =>
                booking.status === "pending"
        ).length;

    const paidBookings =
        bookings.filter(
            (booking) =>
                booking.paymentStatus === "paid"
        ).length;

    const completedBookings =
        bookings.filter(
            (booking) =>
                booking.status === "completed"
        ).length;

    const totalEarnings =
        bookings
            .filter(
                (booking) =>
                    booking.paymentStatus ===
                    "paid"
            )
            .reduce(
                (total, booking) =>
                    total +
                    Number(
                        booking.providerAmount || 0
                    ),
                0
            );

    const toggleBooking = (
        bookingId: string
    ) => {
        setExpandedBooking(
            (current) =>
                current === bookingId
                    ? null
                    : bookingId
        );
    };

    const getInitials = (
        name: string
    ) => {
        if (!name) return "C";

        return name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map(
                (part) =>
                    part[0]?.toUpperCase()
            )
            .join("");
    };

    const getStatusIcon = (
        status: string
    ) => {
        switch (status) {
            case "completed":
                return (
                    <CheckCircle2 className="h-4 w-4" />
                );

            case "cancelled":
            case "rejected":
                return (
                    <XCircle className="h-4 w-4" />
                );

            case "confirmed":
                return (
                    <CheckCircle2 className="h-4 w-4" />
                );

            default:
                return (
                    <AlertCircle className="h-4 w-4" />
                );
        }
    };

    if (loading) {
        return (
            <DashboardLayout
                role="provider"
                navItems={providerNavItems}
            >
                <DashboardHeader
                    title="My Bookings"
                    subtitle="View and manage bookings from your customers"
                />

                <div className="mt-6 space-y-4">
                    {[1, 2, 3].map((item) => (
                        <div
                            key={item}
                            className="card animate-pulse p-5"
                        >
                            <div className="flex gap-4">
                                <div className="h-12 w-12 rounded-full bg-ink-100 dark:bg-ink-800" />

                                <div className="flex-1 space-y-3">
                                    <div className="h-4 w-48 rounded bg-ink-100 dark:bg-ink-800" />

                                    <div className="h-3 w-72 rounded bg-ink-100 dark:bg-ink-800" />

                                    <div className="h-3 w-40 rounded bg-ink-100 dark:bg-ink-800" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            role="provider"
            navItems={providerNavItems}
        >
            <DashboardHeader
                title="My Bookings"
                subtitle="View and manage bookings from your customers"
            />

            {/* TOP STATS */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                {/* TOTAL */}
                <div className="card p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-ink-500">
                                Total bookings
                            </p>

                            <p className="mt-2 text-2xl font-bold text-ink-900 dark:text-ink-50">
                                {totalBookings}
                            </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                            <CalendarDays className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                {/* PENDING */}
                <div className="card p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-ink-500">
                                Pending
                            </p>

                            <p className="mt-2 text-2xl font-bold text-ink-900 dark:text-ink-50">
                                {pendingBookings}
                            </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                            <Clock3 className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                {/* PAID */}
                <div className="card p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-ink-500">
                                Paid bookings
                            </p>

                            <p className="mt-2 text-2xl font-bold text-ink-900 dark:text-ink-50">
                                {paidBookings}
                            </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <CircleDollarSign className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                {/* EARNINGS */}
                <div className="card p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-ink-500">
                                Provider earnings
                            </p>

                            <p className="mt-2 text-xl font-bold text-ink-900 dark:text-ink-50">
                                {formatNaira(
                                    totalEarnings
                                )}
                            </p>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                            <WalletCards className="h-5 w-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* HEADER / REFRESH */}
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-bold text-ink-900 dark:text-ink-50">
                        Customer bookings
                    </h2>

                    <p className="mt-1 text-sm text-ink-500">
                        Bookings update automatically every 10 seconds.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        loadBookings(false)
                    }
                    disabled={refreshing}
                    className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800"
                >
                    {refreshing ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Refreshing...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </>
                    )}
                </button>
            </div>

            {/* ERROR */}
            {error && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                    <div>
                        <p className="font-semibold">
                            Unable to load bookings
                        </p>

                        <p className="mt-1">
                            {error}
                        </p>
                    </div>
                </div>
            )}

            {/* FILTERS */}
            <div className="mt-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {tabs.map((tab) => {
                    const count =
                        tab === "all"
                            ? bookings.length
                            : tab === "paid"
                                ? bookings.filter(
                                    (booking) =>
                                        booking.paymentStatus ===
                                        "paid"
                                ).length
                                : bookings.filter(
                                    (booking) =>
                                        booking.status ===
                                        tab
                                ).length;

                    return (
                        <button
                            key={tab}
                            type="button"
                            onClick={() =>
                                setFilter(tab)
                            }
                            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold capitalize transition ${
                                filter === tab
                                    ? "bg-primary-600 text-white shadow-sm"
                                    : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700"
                            }`}
                        >
                            {tab.replace(
                                "_",
                                " "
                            )}

                            <span
                                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                                    filter === tab
                                        ? "bg-white/20 text-white"
                                        : "bg-white text-ink-500 dark:bg-ink-700 dark:text-ink-300"
                                }`}
                            >
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* BOOKINGS */}
            <div className="mt-4 space-y-4">
                {filteredBookings.length === 0 ? (
                    <div className="card p-10 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ink-100 text-ink-400 dark:bg-ink-800">
                            <CalendarDays className="h-6 w-6" />
                        </div>

                        <h3 className="mt-4 font-semibold text-ink-900 dark:text-ink-50">
                            No bookings found
                        </h3>

                        <p className="mt-1 text-sm text-ink-500">
                            {filter === "all"
                                ? "You don't have any customer bookings yet."
                                : `You don't have any ${filter} bookings.`}
                        </p>
                    </div>
                ) : (
                    filteredBookings.map(
                        (booking) => {
                            const isExpanded =
                                expandedBooking ===
                                booking.id;

                            console.log(
                                "BOOKING:",
                                booking
                            );

                            console.log(
                                "CUSTOMER PHONE:",
                                booking.customerPhone
                            );

                            return (
                                <div
                                    key={booking.id}
                                    className="card overflow-hidden"
                                >
                                    {/* MAIN BOOKING */}
                                    <div className="p-5">
                                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center">

                                            {/* CUSTOMER */}
                                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                                {booking.customerAvatar ? (
                                                    <img
                                                        src={
                                                            booking.customerAvatar
                                                        }
                                                        alt={
                                                            booking.customerName
                                                        }
                                                        className="h-12 w-12 shrink-0 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">
                                                        {getInitials(
                                                            booking.customerName
                                                        )}
                                                    </div>
                                                )}

                                                <div className="min-w-0">
                                                    <h3 className="truncate font-bold text-ink-900 dark:text-ink-50">
                                                        {
                                                            booking.customerName
                                                        }
                                                    </h3>

                                                    <p className="mt-0.5 truncate text-xs text-ink-500">
                                                        {booking.customerEmail ||
                                                            "No email available"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* BOOKED SERVICE */}
                                            <div className="flex min-w-0 items-center gap-3 lg:w-64">
                                                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ink-100 dark:bg-ink-800">
                                                    {booking.serviceImage ? (
                                                        <img
                                                            src={
                                                                booking.serviceImage
                                                            }
                                                            alt={
                                                                booking.serviceName
                                                            }
                                                            className="h-full w-full object-cover"
                                                            onError={(
                                                                event
                                                            ) => {
                                                                event.currentTarget.style.display =
                                                                    "none";
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-ink-400">
                                                            <ImageIcon className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                                                        Service booked
                                                    </p>

                                                    <p className="mt-1 truncate text-sm font-semibold text-ink-800 dark:text-ink-200">
                                                        {
                                                            booking.serviceName
                                                        }
                                                    </p>
                                                </div>
                                            </div>

                                            {/* DATE */}
                                            <div className="lg:w-40">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                                                    Schedule
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-ink-800 dark:text-ink-200">
                                                    {booking.date}
                                                </p>

                                                <p className="mt-0.5 text-xs text-ink-500">
                                                    {booking.time}
                                                </p>
                                            </div>

                                            {/* PRICE */}
                                            <div className="lg:w-32 lg:text-right">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                                                    Amount
                                                </p>

                                                <p className="mt-1 font-bold text-ink-900 dark:text-ink-50">
                                                    {formatNaira(
                                                        booking.price
                                                    )}
                                                </p>

                                                <p
                                                    className={`mt-1 text-[11px] font-semibold ${
                                                        booking.paymentStatus ===
                                                        "paid"
                                                            ? "text-emerald-600"
                                                            : "text-amber-600"
                                                    }`}
                                                >
                                                    {booking.paymentStatus ===
                                                    "paid"
                                                        ? "Payment received"
                                                        : "Payment pending"}
                                                </p>
                                            </div>

                                            {/* STATUS */}
                                            <div className="flex items-center gap-3 lg:w-36 lg:justify-end">
                                                <StatusBadge
                                                    status={
                                                        booking.status
                                                    }
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleBooking(
                                                            booking.id
                                                        )
                                                    }
                                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500 transition hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700"
                                                    title={
                                                        isExpanded
                                                            ? "Hide booking details"
                                                            : "View booking details"
                                                    }
                                                >
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* EXPANDED DETAILS */}
                                    {isExpanded && (
                                        <div className="border-t border-ink-100 bg-ink-50/60 p-5 dark:border-ink-800 dark:bg-ink-900/40">

                                            {/* BOOKED SERVICE PREVIEW */}
                                            <div className="mb-5 overflow-hidden rounded-2xl bg-white dark:bg-ink-900">
                                                <div className="grid gap-0 md:grid-cols-[240px_1fr]">

                                                    {/* SERVICE IMAGE */}
                                                    <div className="h-56 overflow-hidden bg-ink-100 md:h-full md:min-h-[220px] dark:bg-ink-800">
                                                        {booking.serviceImage ? (
                                                            <img
                                                                src={
                                                                    booking.serviceImage
                                                                }
                                                                alt={
                                                                    booking.serviceName
                                                                }
                                                                className="h-full w-full object-cover"
                                                                onError={(
                                                                    event
                                                                ) => {
                                                                    event.currentTarget.style.display =
                                                                        "none";
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-ink-400">
                                                                <div className="text-center">
                                                                    <ImageIcon className="mx-auto h-8 w-8" />

                                                                    <p className="mt-2">
                                                                        No service image
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* SERVICE DETAILS */}
                                                    <div className="p-5">
                                                        <div className="flex items-center gap-2">
                                                            <ImageIcon className="h-4 w-4 text-primary-600" />

                                                            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">
                                                                Service booked
                                                            </p>
                                                        </div>

                                                        <h3 className="mt-2 text-xl font-bold text-ink-900 dark:text-ink-50">
                                                            {
                                                                booking.serviceName
                                                            }
                                                        </h3>

                                                        <p className="mt-2 text-sm leading-6 text-ink-500 dark:text-ink-400">
                                                            This is the exact service selected by the customer when creating this booking.
                                                        </p>

                                                        <div className="mt-4 flex flex-wrap gap-2">
                                                            <span className="rounded-full bg-ink-100 px-3 py-1.5 text-xs font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                                                                {formatNaira(
                                                                    booking.price
                                                                )}
                                                            </span>

                                                            <span
                                                                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                                                                    booking.paymentStatus ===
                                                                    "paid"
                                                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                                                        : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                                                                }`}
                                                            >
                                                                {booking.paymentStatus ===
                                                                "paid"
                                                                    ? "Paid"
                                                                    : "Payment pending"}
                                                            </span>

                                                            <span className="rounded-full bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">
                                                                {booking.status.replace(
                                                                    "_",
                                                                    " "
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* CUSTOMER / BOOKING / PAYMENT */}
                                            <div className="grid gap-5 lg:grid-cols-3">

                                                {/* CUSTOMER INFORMATION */}
                                                <div className="rounded-2xl bg-white p-5 dark:bg-ink-900">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-primary-600" />

                                                        <h4 className="font-semibold text-ink-900 dark:text-ink-50">
                                                            Customer information
                                                        </h4>
                                                    </div>

                                                    <div className="mt-4 space-y-3">

                                                        {/* NAME */}
                                                        <div>
                                                            <p className="text-xs text-ink-400">
                                                                Name
                                                            </p>

                                                            <p className="mt-1 text-sm font-semibold text-ink-800 dark:text-ink-200">
                                                                {
                                                                    booking.customerName
                                                                }
                                                            </p>
                                                        </div>

                                                        {/* EMAIL */}
                                                        <div className="flex items-start gap-2">
                                                            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />

                                                            <div className="min-w-0">
                                                                <p className="text-xs text-ink-400">
                                                                    Email
                                                                </p>

                                                                <p className="mt-1 break-all text-sm text-ink-700 dark:text-ink-300">
                                                                    {booking.customerEmail ||
                                                                        "Not available"}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* PHONE */}
                                                        <div className="flex items-start gap-2">
                                                            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />

                                                            <div>
                                                                <p className="text-xs text-ink-400">
                                                                    Phone
                                                                </p>

                                                                <p className="mt-1 text-sm text-ink-700 dark:text-ink-300">
                                                                    {booking.customerPhone ||
                                                                        "Not available"}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start gap-2">
                                                            <User2Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />

                                                            <div>
                                                                <p className="text-xs text-ink-400">
                                                                    Gender
                                                                </p>

                                                                <p className="mt-1 text-sm text-ink-700 dark:text-ink-300">
                                                                    {booking.customerGender ||
                                                                        "Not available"}
                                                                </p>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </div>

                                                {/* BOOKING INFORMATION */}
                                                <div className="rounded-2xl bg-white p-5 dark:bg-ink-900">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarDays className="h-4 w-4 text-primary-600" />

                                                        <h4 className="font-semibold text-ink-900 dark:text-ink-50">
                                                            Booking information
                                                        </h4>
                                                    </div>

                                                    <div className="mt-4 space-y-3">

                                                        {/* DATE */}
                                                        <div className="flex items-start gap-2">
                                                            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />

                                                            <div>
                                                                <p className="text-xs text-ink-400">
                                                                    Date
                                                                </p>

                                                                <p className="mt-1 text-sm font-medium text-ink-700 dark:text-ink-300">
                                                                    {booking.date}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* TIME */}
                                                        <div className="flex items-start gap-2">
                                                            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />

                                                            <div>
                                                                <p className="text-xs text-ink-400">
                                                                    Time
                                                                </p>

                                                                <p className="mt-1 text-sm font-medium text-ink-700 dark:text-ink-300">
                                                                    {booking.time}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* LOCATION */}
                                                        <div className="flex items-start gap-2">
                                                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />

                                                            <div>
                                                                <p className="text-xs text-ink-400">
                                                                    Location
                                                                </p>

                                                                <p className="mt-1 text-sm font-medium text-ink-700 dark:text-ink-300">
                                                                    {booking.location ||
                                                                        "Not provided"}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* SERVICE */}
                                                        <div>
                                                            <p className="text-xs text-ink-400">
                                                                Service
                                                            </p>

                                                            <p className="mt-1 text-sm font-medium text-ink-700 dark:text-ink-300">
                                                                {
                                                                    booking.serviceName
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* PAYMENT */}
                                                <div className="rounded-2xl bg-white p-5 dark:bg-ink-900">
                                                    <div className="flex items-center gap-2">
                                                        <WalletCards className="h-4 w-4 text-primary-600" />

                                                        <h4 className="font-semibold text-ink-900 dark:text-ink-50">
                                                            Payment details
                                                        </h4>
                                                    </div>

                                                    <div className="mt-4 space-y-3">

                                                        {/* BOOKING AMOUNT */}
                                                        <div>
                                                            <p className="text-xs text-ink-400">
                                                                Booking amount
                                                            </p>

                                                            <p className="mt-1 text-sm font-bold text-ink-800 dark:text-ink-200">
                                                                {formatNaira(
                                                                    booking.price
                                                                )}
                                                            </p>
                                                        </div>

                                                        {/* SERVICELY FEE */}
                                                        <div>
                                                            <p className="text-xs text-ink-400">
                                                                Servicely fee
                                                            </p>

                                                            <p className="mt-1 text-sm text-ink-700 dark:text-ink-300">
                                                                {formatNaira(
                                                                    booking.platformFee
                                                                )}
                                                            </p>
                                                        </div>

                                                        {/* PROVIDER EARNINGS */}
                                                        <div className="border-t border-ink-100 pt-3 dark:border-ink-800">
                                                            <p className="text-xs text-ink-400">
                                                                Your earnings
                                                            </p>

                                                            <p className="mt-1 text-lg font-bold text-emerald-600">
                                                                {formatNaira(
                                                                    booking.providerAmount
                                                                )}
                                                            </p>
                                                        </div>

                                                        {/* PAYMENT STATUS */}
                                                        <div>
                                                            <p className="text-xs text-ink-400">
                                                                Payment status
                                                            </p>

                                                            <p
                                                                className={`mt-1 text-sm font-semibold capitalize ${
                                                                    booking.paymentStatus ===
                                                                    "paid"
                                                                        ? "text-emerald-600"
                                                                        : "text-amber-600"
                                                                }`}
                                                            >
                                                                {
                                                                    booking.paymentStatus
                                                                }
                                                            </p>
                                                        </div>

                                                    </div>
                                                </div>
                                            </div>

                                            {/* CUSTOMER NOTE */}
                                            {booking.notes && (
                                                <div className="mt-5 rounded-2xl bg-white p-5 dark:bg-ink-900">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-primary-600" />

                                                        <h4 className="font-semibold text-ink-900 dark:text-ink-50">
                                                            Customer note
                                                        </h4>
                                                    </div>

                                                    <p className="mt-3 text-sm leading-6 text-ink-600 dark:text-ink-300">
                                                        {booking.notes}
                                                    </p>
                                                </div>
                                            )}

                                            {/* BOOKING META */}
                                            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-400">
                                                <span>
                                                    Booking ID:{" "}
                                                    {booking.id}
                                                </span>

                                                {booking.paymentReference && (
                                                    <span>
                                                        Payment reference:{" "}
                                                        {
                                                            booking.paymentReference
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        }
                    )
                )}
            </div>
        </DashboardLayout>
    );
}
