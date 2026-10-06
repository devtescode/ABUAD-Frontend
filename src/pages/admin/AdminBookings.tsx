import {
    DashboardLayout,
    DashboardHeader,
} from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/shared";
import { adminNavItems } from "@/data/adminNavItems";
import { formatNaira } from "@/data/mockData";
// import { API_URL } from "@/config/api";

import {
    CalendarDays,
    CheckCircle2,
    Clock3,
    CreditCard,
    RefreshCw,
    Search,
    Users,
    Loader2,
    AlertCircle,
    Eye,
    X,
    MapPin,
    Mail,
    User,
    BriefcaseBusiness,
    ReceiptText,
    Banknote,
    Hash,
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useState,
    type ElementType,
} from "react";

type Booking = {
    id: string;

    serviceName: string;
    serviceCategory?: string;
    serviceDescription?: string;
    serviceImage?: string;

    providerName: string;
    providerEmail?: string;
    providerId?: string;

    customerName: string;
    customerEmail?: string;
    customerId?: string;

    date: string;
    time: string;
    location?: string;
    notes?: string;

    price: number;

    status: string;
    paymentStatus: string;

    paymentReference?: string | null;

    platformFee?: number;
    providerAmount?: number;

    createdAt?: string;
    updatedAt?: string;
};

type Filter =
    | "all"
    | "pending"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "rejected"
    | "paid";

const tabs: {
    label: string;
    value: Filter;
}[] = [
        {
            label: "All Bookings",
            value: "all",
        },
        {
            label: "Pending",
            value: "pending",
        },
        {
            label: "Confirmed",
            value: "confirmed",
        },
        {
            label: "In Progress",
            value: "in_progress",
        },
        {
            label: "Completed",
            value: "completed",
        },
        {
            label: "Cancelled",
            value: "cancelled",
        },
        {
            label: "Rejected",
            value: "rejected",
        },
        {
            label: "Paid",
            value: "paid",
        },
    ];

export function AdminBookings() {
    const [bookings, setBookings] = useState<Booking[]>([]);

    const [filter, setFilter] =
        useState<Filter>("all");

    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] = useState("");

    const [selectedBooking, setSelectedBooking] =
        useState<Booking | null>(null);

    // =====================================================
    // FETCH ALL BOOKINGS
    // =====================================================
    const API_URL =
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000";

    const fetchBookings = async (
        isRefresh = false
    ) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const token = sessionStorage.getItem(
                "servicely_admin_token"
            );

            if (!token) {
                throw new Error(
                    "Your admin session has expired. Please log in again."
                );
            }

            const response = await fetch(
                `${API_URL}/admin/getallbookings`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            let data: any = {};

            try {
                data = await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    `The server returned an error (${response.status}).`
                );
            }

            setBookings(
                Array.isArray(data?.bookings)
                    ? data.bookings
                    : []
            );
        } catch (error: any) {
            console.error(
                "ADMIN BOOKINGS ERROR:",
                error
            );

            const message =
                error?.message ||
                "Unable to load platform bookings.";

            /*
             * MongoDB / backend connection errors
             * should be explained clearly to the admin.
             */
            if (
                message.includes("ENOTFOUND") ||
                message.includes("MongoDB") ||
                message.includes("mongodb.net") ||
                message.includes("getaddrinfo")
            ) {
                setError(
                    "The booking server cannot connect to the database right now. Please check the backend database connection and try again."
                );
            } else if (
                message.includes("401") ||
                message.toLowerCase().includes("unauthorized")
            ) {
                setError(
                    "Your admin session is no longer valid. Please log in again."
                );
            } else {
                setError(message);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        fetchBookings();
    }, []);

    // =====================================================
    // FILTER + SEARCH
    // =====================================================

    const filteredBookings = useMemo(() => {
        let result = [...bookings];

        /*
         * PAID:
         * Uses paymentStatus ONLY.
         *
         * COMPLETED:
         * Uses booking status ONLY.
         *
         * Therefore a booking can appear in BOTH
         * Paid and Completed.
         */

        if (filter === "paid") {
            result = result.filter(
                (booking) =>
                    booking.paymentStatus === "paid"
            );
        } else if (filter !== "all") {
            result = result.filter(
                (booking) =>
                    booking.status === filter
            );
        }

        // ===================================================
        // SEARCH
        // ===================================================

        const query = search
            .toLowerCase()
            .trim();

        if (query) {
            result = result.filter((booking) => {
                const searchableFields = [
                    booking.serviceName,
                    booking.serviceCategory,
                    booking.serviceDescription,

                    booking.customerName,
                    booking.customerEmail,
                    booking.customerId,

                    booking.providerName,
                    booking.providerEmail,
                    booking.providerId,

                    booking.location,
                    booking.notes,

                    booking.paymentReference,

                    booking.status,
                    booking.paymentStatus,
                ];

                return searchableFields.some(
                    (field) =>
                        field &&
                        String(field)
                            .toLowerCase()
                            .includes(query)
                );
            });
        }

        return result;
    }, [bookings, filter, search]);

    // =====================================================
    // STATISTICS
    // =====================================================

    const stats = useMemo(() => {
        const total = bookings.length;

        const pending = bookings.filter(
            (booking) =>
                booking.status === "pending"
        ).length;

        const confirmed = bookings.filter(
            (booking) =>
                booking.status === "confirmed"
        ).length;

        const inProgress = bookings.filter(
            (booking) =>
                booking.status === "in_progress"
        ).length;

        const completed = bookings.filter(
            (booking) =>
                booking.status === "completed"
        ).length;

        const cancelled = bookings.filter(
            (booking) =>
                booking.status === "cancelled"
        ).length;

        const paid = bookings.filter(
            (booking) =>
                booking.paymentStatus === "paid"
        ).length;

        const totalPaidAmount = bookings
            .filter(
                (booking) =>
                    booking.paymentStatus === "paid"
            )
            .reduce(
                (total, booking) =>
                    total + Number(booking.price || 0),
                0
            );

        return {
            total,
            pending,
            confirmed,
            inProgress,
            completed,
            cancelled,
            paid,
            totalPaidAmount,
        };
    }, [bookings]);

    // =====================================================
    // DATE FORMAT
    // =====================================================

    const formatDate = (date: string) => {
        if (!date) return "—";

        const parsedDate = new Date(date);

        if (
            Number.isNaN(parsedDate.getTime())
        ) {
            return date;
        }

        return parsedDate.toLocaleDateString(
            "en-NG",
            {
                day: "numeric",
                month: "short",
                year: "numeric",
            }
        );
    };

    // =====================================================
    // DATETIME FORMAT
    // =====================================================

    const formatDateTime = (date?: string) => {
        if (!date) return "—";

        const parsedDate = new Date(date);

        if (
            Number.isNaN(parsedDate.getTime())
        ) {
            return date;
        }

        return parsedDate.toLocaleString(
            "en-NG",
            {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
            }
        );
    };

    return (
        <DashboardLayout
            role="admin"
            navItems={adminNavItems}
        >
            <DashboardHeader
                title="Booking Management"
                subtitle="Monitor and manage all bookings across the Servicely platform."
            />

            <div className="space-y-6">

                {/* ================================================= */}
                {/* SUMMARY CARDS */}
                {/* ================================================= */}

                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">

                    <SummaryCard
                        title="Total"
                        value={stats.total}
                        icon={CalendarDays}
                    />

                    <SummaryCard
                        title="Pending"
                        value={stats.pending}
                        icon={Clock3}
                    />

                    <SummaryCard
                        title="Confirmed"
                        value={stats.confirmed}
                        icon={CheckCircle2}
                    />

                    <SummaryCard
                        title="In Progress"
                        value={stats.inProgress}
                        icon={Users}
                    />

                    <SummaryCard
                        title="Completed"
                        value={stats.completed}
                        icon={CheckCircle2}
                    />

                    <SummaryCard
                        title="Paid"
                        value={stats.paid}
                        icon={CreditCard}
                    />

                </div>

                {/* ================================================= */}
                {/* PAID REVENUE */}
                {/* ================================================= */}

                <div className="card">

                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                            <p className="text-sm text-ink-500 dark:text-ink-400">
                                Total Paid Booking Value
                            </p>

                            {loading ? (
                                <div className="mt-2 h-8 w-40 animate-pulse rounded-lg bg-ink-100 blur-[1px] dark:bg-ink-800" />
                            ) : (
                                <h2 className="mt-1 text-2xl font-bold text-ink-900 dark:text-white">
                                    {formatNaira(
                                        stats.totalPaidAmount
                                    )}
                                </h2>
                            )}

                        </div>

                        <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                                <CreditCard className="h-5 w-5" />
                            </div>

                            <div>

                                <p className="text-xs text-ink-400">
                                    Paid bookings
                                </p>

                                <p className="font-semibold text-ink-900 dark:text-white">
                                    {stats.paid}
                                </p>

                            </div>

                        </div>

                    </div>

                </div>

                {/* ================================================= */}
                {/* SEARCH + REFRESH */}
                {/* ================================================= */}

                <div className="flex flex-col gap-3 md:flex-row">

                    <div className="relative flex-1">

                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />

                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search customer or provider name, email, service..."
                            className="w-full rounded-xl border border-ink-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-ink-700 dark:bg-ink-900 dark:text-white"
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={() =>
                                    setSearch("")
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 dark:hover:text-white"
                                aria-label="Clear search"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}

                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            fetchBookings(true)
                        }
                        disabled={refreshing}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-5 py-3 text-sm font-medium text-ink-700 transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800"
                    >

                        <RefreshCw
                            className={`h-4 w-4 ${refreshing
                                ? "animate-spin"
                                : ""
                                }`}
                        />

                        {refreshing
                            ? "Refreshing..."
                            : "Refresh"}

                    </button>

                </div>

                {/* ================================================= */}
                {/* SEARCH RESULT INFO */}
                {/* ================================================= */}

                {search.trim() && !loading && (
                    <p className="text-sm text-ink-500 dark:text-ink-400">
                        Showing{" "}
                        <span className="font-semibold text-ink-800 dark:text-white">
                            {filteredBookings.length}
                        </span>{" "}
                        result
                        {filteredBookings.length !== 1
                            ? "s"
                            : ""}{" "}
                        for "
                        <span className="font-semibold text-ink-800 dark:text-white">
                            {search}
                        </span>
                        "
                    </p>
                )}

                {/* ================================================= */}
                {/* FILTER TABS */}
                {/* ================================================= */}

                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">

                    {tabs.map((tab) => {

                        const active =
                            filter === tab.value;

                        return (
                            <button
                                key={tab.value}
                                type="button"
                                onClick={() =>
                                    setFilter(tab.value)
                                }
                                className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition ${active
                                    ? "bg-primary-600 text-white shadow-sm"
                                    : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}

                </div>

                {/* ================================================= */}
                {/* ERROR */}
                {/* ================================================= */}

                {error && !loading && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">

                        <div className="flex items-start gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                                <AlertCircle className="h-5 w-5" />
                            </div>

                            <div className="min-w-0 flex-1">

                                <h3 className="font-semibold text-amber-900 dark:text-amber-300">
                                    Booking data is temporarily unavailable
                                </h3>

                                <p className="mt-1 text-sm leading-6 text-amber-800 dark:text-amber-400">
                                    {error}
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        fetchBookings(true)
                                    }
                                    disabled={refreshing}
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
                                >
                                    <RefreshCw
                                        className={`h-3.5 w-3.5 ${refreshing
                                            ? "animate-spin"
                                            : ""
                                            }`}
                                    />
                                    Try Again
                                </button>

                            </div>

                        </div>

                    </div>
                )}

                {/* ================================================= */}
                {/* BOOKING TABLE */}
                {/* ================================================= */}

                <div className="card overflow-hidden">

                    {loading ? (
                        <BookingLoader />
                    ) : filteredBookings.length === 0 ? (

                        <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">

                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 dark:bg-ink-800">
                                <CalendarDays className="h-7 w-7 text-ink-400" />
                            </div>

                            <h3 className="mt-4 text-lg font-semibold text-ink-900 dark:text-white">
                                No bookings found
                            </h3>

                            <p className="mt-1 max-w-md text-sm text-ink-500 dark:text-ink-400">
                                {search
                                    ? "No bookings matched your search. Try another name, email, service or keyword."
                                    : "There are no bookings matching this filter."}
                            </p>

                            {search && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSearch("")
                                    }
                                    className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700"
                                >
                                    Clear Search
                                </button>
                            )}

                        </div>

                    ) : (

                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[1200px] text-left text-sm">

                                <thead className="border-b border-ink-100 bg-ink-50 dark:border-ink-800 dark:bg-ink-900/50">

                                    <tr>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-ink-500">
                                            Service
                                        </th>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-ink-500">
                                            Customer
                                        </th>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-ink-500">
                                            Provider
                                        </th>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-ink-500">
                                            Schedule
                                        </th>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-ink-500">
                                            Amount
                                        </th>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-ink-500">
                                            Payment
                                        </th>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-ink-500">
                                            Status
                                        </th>

                                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-ink-500">
                                            Action
                                        </th>

                                    </tr>

                                </thead>

                                <tbody className="divide-y divide-ink-100 dark:divide-ink-800">

                                    {filteredBookings.map(
                                        (booking) => (

                                            <tr
                                                key={booking.id}
                                                className="transition hover:bg-ink-50/70 dark:hover:bg-ink-800/30"
                                            >

                                                {/* SERVICE */}

                                                <td className="px-5 py-4">

                                                    <div className="max-w-[190px]">

                                                        <p className="truncate font-semibold text-ink-900 dark:text-white">
                                                            {booking.serviceName}
                                                        </p>

                                                        {booking.serviceCategory && (
                                                            <p className="mt-1 text-xs text-ink-400">
                                                                {booking.serviceCategory}
                                                            </p>
                                                        )}

                                                    </div>

                                                </td>

                                                {/* CUSTOMER */}

                                                <td className="px-5 py-4">

                                                    <p className="font-medium text-ink-800 dark:text-ink-200">
                                                        {booking.customerName}
                                                    </p>

                                                    {booking.customerEmail && (
                                                        <p className="mt-1 max-w-[170px] truncate text-xs text-ink-400">
                                                            {booking.customerEmail}
                                                        </p>
                                                    )}

                                                </td>

                                                {/* PROVIDER */}

                                                <td className="px-5 py-4">

                                                    <p className="font-medium text-ink-800 dark:text-ink-200">
                                                        {booking.providerName}
                                                    </p>

                                                    {booking.providerEmail && (
                                                        <p className="mt-1 max-w-[170px] truncate text-xs text-ink-400">
                                                            {booking.providerEmail}
                                                        </p>
                                                    )}

                                                </td>

                                                {/* SCHEDULE */}

                                                <td className="px-5 py-4">

                                                    <p className="font-medium text-ink-700 dark:text-ink-300">
                                                        {formatDate(
                                                            booking.date
                                                        )}
                                                    </p>

                                                    <p className="mt-1 text-xs text-ink-400">
                                                        {booking.time ||
                                                            "No time"}
                                                    </p>

                                                </td>

                                                {/* AMOUNT */}

                                                <td className="px-5 py-4">

                                                    <p className="font-semibold text-ink-900 dark:text-white">
                                                        {formatNaira(
                                                            Number(
                                                                booking.price || 0
                                                            )
                                                        )}
                                                    </p>

                                                    {booking.platformFee !==
                                                        undefined && (
                                                            <p className="mt-1 text-xs text-ink-400">
                                                                Fee:{" "}
                                                                {formatNaira(
                                                                    Number(
                                                                        booking.platformFee
                                                                    )
                                                                )}
                                                            </p>
                                                        )}

                                                </td>

                                                {/* PAYMENT */}

                                                <td className="px-5 py-4">
                                                    <div className="flex min-w-[125px] items-center">
                                                        <PaymentStatus status={booking.paymentStatus} />
                                                    </div>
                                                </td>

                                                {/* BOOKING STATUS */}

                                                <td className="px-5 py-4">

                                                    <StatusBadge
                                                        status={
                                                            booking.status
                                                        }
                                                    />

                                                </td>

                                                {/* ACTION */}

                                                <td className="px-5 py-4">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedBooking(
                                                                booking
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:border-primary-500/40 dark:hover:bg-primary-500/10 dark:hover:text-primary-400"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        View
                                                    </button>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </div>

            {/* ================================================= */}
            {/* BOOKING DETAILS MODAL */}
            {/* ================================================= */}

            {selectedBooking && (
                <BookingDetailsModal
                    booking={selectedBooking}
                    formatDate={formatDate}
                    formatDateTime={formatDateTime}
                    onClose={() =>
                        setSelectedBooking(null)
                    }
                />
            )}

        </DashboardLayout>
    );
}

/* ===================================================== */
/* SUMMARY CARD */
/* ===================================================== */

function SummaryCard({
    title,
    value,
    icon: Icon,
}: {
    title: string;
    value: number;
    icon: ElementType;
}) {
    return (
        <div className="card p-4">

            <div className="flex items-center justify-between gap-3">

                <div>

                    <p className="text-xs font-medium text-ink-500 dark:text-ink-400">
                        {title}
                    </p>

                    <p className="mt-1 text-xl font-bold text-ink-900 dark:text-white">
                        {value}
                    </p>

                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                    <Icon className="h-4 w-4" />
                </div>

            </div>

        </div>
    );
}

/* ===================================================== */
/* PAYMENT STATUS */
/* ===================================================== */

function PaymentStatus({
    status,
}: {
    status: string;
}) {
    const styles: Record<
        string,
        string
    > = {
        paid:
            "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",

        unpaid:
            "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300",

        pending:
            "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",

        failed:
            "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",

        refunded:
            "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
    };

    const labels: Record<
        string,
        string
    > = {
        paid: "Paid",
        unpaid: "Unpaid",
        pending: "Payment Pending",
        failed: "Payment Failed",
        refunded: "Refunded",
    };

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] ||
                "bg-ink-100 text-ink-600"
                }`}
        >
            {labels[status] || status}
        </span>
    );
}

/* ===================================================== */
/* BOOKING DETAILS MODAL */
/* ===================================================== */

function BookingDetailsModal({
    booking,
    formatDate,
    formatDateTime,
    onClose,
}: {
    booking: Booking;
    formatDate: (date: string) => string;
    formatDateTime: (date?: string) => string;
    onClose: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >

            <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-ink-900">

                {/* HEADER */}

                <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4 dark:border-ink-800 sm:px-6">

                    <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                            <ReceiptText className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">

                            <h2 className="truncate text-lg font-bold text-ink-900 dark:text-white">
                                Booking Details
                            </h2>

                            <p className="mt-0.5 truncate text-xs text-ink-400">
                                ID: {booking.id}
                            </p>

                        </div>

                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-white"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>

                </div>

                {/* CONTENT */}

                <div className="max-h-[calc(90vh-73px)] overflow-y-auto p-5 sm:p-6">

                    {/* SERVICE */}

                    <section>

                        <SectionTitle
                            icon={BriefcaseBusiness}
                            title="Service Information"
                        />

                        <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-4 dark:border-ink-800 dark:bg-ink-800/30">

                            <div className="flex flex-col gap-4 sm:flex-row">

                                {booking.serviceImage ? (
                                    <img
                                        src={booking.serviceImage}
                                        alt={booking.serviceName}
                                        className="h-20 w-20 rounded-xl object-cover"
                                    />
                                ) : (
                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                                        <BriefcaseBusiness className="h-7 w-7" />
                                    </div>
                                )}

                                <div className="min-w-0 flex-1">

                                    <h3 className="font-semibold text-ink-900 dark:text-white">
                                        {booking.serviceName}
                                    </h3>

                                    {booking.serviceCategory && (
                                        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                                            {booking.serviceCategory}
                                        </p>
                                    )}

                                    {booking.serviceDescription && (
                                        <p className="mt-3 text-sm leading-6 text-ink-600 dark:text-ink-300">
                                            {booking.serviceDescription}
                                        </p>
                                    )}

                                </div>

                            </div>

                        </div>

                    </section>

                    {/* CUSTOMER + PROVIDER */}

                    <div className="mt-6 grid gap-4 md:grid-cols-2">

                        <InfoCard
                            icon={User}
                            title="Customer"
                            name={booking.customerName}
                            email={booking.customerEmail}
                            id={booking.customerId}
                        />

                        <InfoCard
                            icon={BriefcaseBusiness}
                            title="Provider"
                            name={booking.providerName}
                            email={booking.providerEmail}
                            id={booking.providerId}
                        />

                    </div>

                    {/* BOOKING INFORMATION */}

                    <section className="mt-6">

                        <SectionTitle
                            icon={CalendarDays}
                            title="Booking Information"
                        />

                        <div className="grid gap-3 sm:grid-cols-2">

                            <DetailItem
                                label="Date"
                                value={formatDate(
                                    booking.date
                                )}
                                icon={CalendarDays}
                            />

                            <DetailItem
                                label="Time"
                                value={
                                    booking.time ||
                                    "No time provided"
                                }
                                icon={Clock3}
                            />

                            <DetailItem
                                label="Location"
                                value={
                                    booking.location ||
                                    "No location provided"
                                }
                                icon={MapPin}
                            />

                            <DetailItem
                                label="Amount"
                                value={formatNaira(
                                    Number(
                                        booking.price || 0
                                    )
                                )}
                                icon={Banknote}
                            />

                        </div>

                    </section>

                    {/* STATUS */}

                    <section className="mt-6">

                        <SectionTitle
                            icon={CheckCircle2}
                            title="Status"
                        />

                        <div className="grid gap-3 sm:grid-cols-2">

                            <div className="rounded-xl border border-ink-100 p-4 dark:border-ink-800">

                                <p className="mb-2 text-xs font-medium text-ink-400">
                                    Booking Status
                                </p>

                                <StatusBadge
                                    status={
                                        booking.status
                                    }
                                />

                            </div>

                            <div className="rounded-xl border border-ink-100 p-4 dark:border-ink-800">

                                <p className="mb-2 text-xs font-medium text-ink-400">
                                    Payment Status
                                </p>

                                <PaymentStatus
                                    status={
                                        booking.paymentStatus
                                    }
                                />

                            </div>

                        </div>

                    </section>

                    {/* PAYMENT */}

                    <section className="mt-6">

                        <SectionTitle
                            icon={CreditCard}
                            title="Payment Information"
                        />

                        <div className="grid gap-3 sm:grid-cols-2">

                            <DetailItem
                                label="Payment Reference"
                                value={
                                    booking.paymentReference ||
                                    "No payment reference"
                                }
                                icon={Hash}
                            />

                            <DetailItem
                                label="Platform Fee"
                                value={formatNaira(
                                    Number(
                                        booking.platformFee || 0
                                    )
                                )}
                                icon={CreditCard}
                            />

                            <DetailItem
                                label="Provider Amount"
                                value={formatNaira(
                                    Number(
                                        booking.providerAmount ||
                                        0
                                    )
                                )}
                                icon={Banknote}
                            />

                            <DetailItem
                                label="Booking Amount"
                                value={formatNaira(
                                    Number(
                                        booking.price || 0
                                    )
                                )}
                                icon={ReceiptText}
                            />

                        </div>

                    </section>

                    {/* NOTES */}

                    {booking.notes && (
                        <section className="mt-6">

                            <SectionTitle
                                icon={ReceiptText}
                                title="Customer Note"
                            />

                            <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-4 text-sm leading-6 text-ink-600 dark:border-ink-800 dark:bg-ink-800/30 dark:text-ink-300">
                                {booking.notes}
                            </div>

                        </section>
                    )}

                    {/* TIMESTAMPS */}

                    <section className="mt-6">

                        <SectionTitle
                            icon={Clock3}
                            title="Record Information"
                        />

                        <div className="grid gap-3 sm:grid-cols-2">

                            <DetailItem
                                label="Created"
                                value={formatDateTime(
                                    booking.createdAt
                                )}
                                icon={Clock3}
                            />

                            <DetailItem
                                label="Last Updated"
                                value={formatDateTime(
                                    booking.updatedAt
                                )}
                                icon={RefreshCw}
                            />

                        </div>

                    </section>

                </div>

            </div>

        </div>
    );
}

/* ===================================================== */
/* INFO CARD */
/* ===================================================== */

function InfoCard({
    icon: Icon,
    title,
    name,
    email,
    id,
}: {
    icon: ElementType;
    title: string;
    name: string;
    email?: string;
    id?: string;
}) {
    return (
        <div className="rounded-xl border border-ink-100 p-4 dark:border-ink-800">

            <div className="flex items-center gap-2">

                <Icon className="h-4 w-4 text-primary-500" />

                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                    {title}
                </p>

            </div>

            <p className="mt-3 font-semibold text-ink-900 dark:text-white">
                {name}
            </p>

            {email && (
                <div className="mt-2 flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400">

                    <Mail className="h-3.5 w-3.5 shrink-0" />

                    <span className="truncate">
                        {email}
                    </span>

                </div>
            )}

            {id && (
                <p className="mt-2 truncate text-xs text-ink-400">
                    ID: {id}
                </p>
            )}

        </div>
    );
}

/* ===================================================== */
/* SECTION TITLE */
/* ===================================================== */

function SectionTitle({
    icon: Icon,
    title,
}: {
    icon: ElementType;
    title: string;
}) {
    return (
        <div className="mb-3 flex items-center gap-2">

            <Icon className="h-4 w-4 text-primary-500" />

            <h3 className="text-sm font-semibold text-ink-900 dark:text-white">
                {title}
            </h3>

        </div>
    );
}

/* ===================================================== */
/* DETAIL ITEM */
/* ===================================================== */

function DetailItem({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: string;
    icon: ElementType;
}) {
    return (
        <div className="rounded-xl border border-ink-100 p-4 dark:border-ink-800">

            <div className="flex items-center gap-2">

                <Icon className="h-3.5 w-3.5 text-ink-400" />

                <p className="text-xs font-medium text-ink-400">
                    {label}
                </p>

            </div>

            <p className="mt-2 break-words text-sm font-semibold text-ink-800 dark:text-ink-200">
                {value}
            </p>

        </div>
    );
}

/* ===================================================== */
/* BLUR / SKELETON LOADER */
/* ===================================================== */

function BookingLoader() {
    return (
        <div className="overflow-hidden">

            {/* HEADER */}

            <div className="border-b border-ink-100 bg-ink-50 px-5 py-4 dark:border-ink-800 dark:bg-ink-900/50">

                <div className="grid grid-cols-8 gap-6">

                    {Array.from({
                        length: 8,
                    }).map((_, index) => (
                        <div
                            key={index}
                            className="h-3 animate-pulse rounded bg-ink-200 blur-[1px] dark:bg-ink-700"
                        />
                    ))}

                </div>

            </div>

            {/* ROWS */}

            <div className="divide-y divide-ink-100 dark:divide-ink-800">

                {Array.from({
                    length: 6,
                }).map((_, row) => (

                    <div
                        key={row}
                        className="grid min-w-[1200px] grid-cols-8 gap-6 px-5 py-5"
                    >

                        {Array.from({
                            length: 8,
                        }).map((_, column) => (

                            <div
                                key={column}
                                className="space-y-2"
                            >

                                <div
                                    className="h-4 animate-pulse rounded bg-ink-100 blur-[1px] dark:bg-ink-800"
                                    style={{
                                        width:
                                            column === 5 ||
                                                column === 6 ||
                                                column === 7
                                                ? "70px"
                                                : "110px",
                                    }}
                                />

                                {column < 5 && (
                                    <div className="h-3 w-20 animate-pulse rounded bg-ink-100 blur-[1px] dark:bg-ink-800" />
                                )}

                            </div>

                        ))}

                    </div>

                ))}

            </div>

            {/* LOADER */}

            <div className="flex items-center justify-center gap-2 border-t border-ink-100 py-5 dark:border-ink-800">

                <Loader2 className="h-4 w-4 animate-spin text-primary-500" />

                <span className="text-sm text-ink-500">
                    Loading platform bookings...
                </span>

            </div>

        </div>
    );
}