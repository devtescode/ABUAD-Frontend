
import { useEffect, useState } from "react";
import {
    DashboardLayout,
    DashboardHeader,
} from "@/components/DashboardLayout";
import { providerNavItems } from "@/data/providerNavItems";
import {
    Clock,
    CheckCircle2,
    AlertCircle,
    Loader2,
    CalendarDays,
    X,
} from "lucide-react";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

type AvailabilityDay = {
    day: string;
    available: boolean;
    start: string;
    end: string;
};

const defaultAvailability: AvailabilityDay[] = [
    {
        day: "Monday",
        available: false,
        start: "08:00",
        end: "18:00",
    },
    {
        day: "Tuesday",
        available: false,
        start: "08:00",
        end: "18:00",
    },
    {
        day: "Wednesday",
        available: false,
        start: "08:00",
        end: "18:00",
    },
    {
        day: "Thursday",
        available: false,
        start: "08:00",
        end: "18:00",
    },
    {
        day: "Friday",
        available: false,
        start: "08:00",
        end: "18:00",
    },
    {
        day: "Saturday",
        available: false,
        start: "08:00",
        end: "18:00",
    },
    {
        day: "Sunday",
        available: false,
        start: "08:00",
        end: "18:00",
    },
];

const dayShortNames: Record<string, string> = {
    Monday: "MON",
    Tuesday: "TUE",
    Wednesday: "WED",
    Thursday: "THU",
    Friday: "FRI",
    Saturday: "SAT",
    Sunday: "SUN",
};

// ============================================================
// TOAST COMPONENT
// ============================================================

function AvailabilityToast({
    message,
    type,
    onClose,
}: {
    message: string;
    type: "success" | "error";
    onClose: () => void;
}) {
    return (
        <div
            className="
                fixed
                left-1/2
                top-4
                z-[9999]
                w-[calc(100%-24px)]
                max-w-[420px]
                -translate-x-1/2
                overflow-hidden
                rounded-lg
                bg-white
                shadow-[0_8px_30px_rgba(0,0,0,0.12)]
                ring-1
                ring-black/5
                animate-[toastEnter_0.35s_ease-out]
                sm:left-auto
                sm:right-5
                sm:top-5
                sm:translate-x-0
                md:right-6
                md:top-6
            "
        >
            {/* Main toast content */}
            <div className="flex items-start gap-3 px-4 py-3.5">
                {/* Icon */}
                <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${type === "success"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                >
                    {type === "success" ? (
                        <CheckCircle2 className="h-5 w-5" />
                    ) : (
                        <AlertCircle className="h-5 w-5" />
                    )}
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-semibold text-ink-900">
                        {type === "success"
                            ? "Success"
                            : "Something went wrong"}
                    </p>

                    <p className="mt-0.5 break-words text-xs leading-5 text-ink-500">
                        {message}
                    </p>
                </div>

                {/* Close button */}
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close notification"
                    className="shrink-0 rounded-md p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Progress bar */}
            <div className="h-1 w-full bg-ink-100">
                <div
                    className={`h-full animate-[toastProgress_4s_linear_forwards] ${type === "success"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                />
            </div>
        </div>
    );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function ProviderAvailability() {
    const [days, setDays] =
        useState<AvailabilityDay[]>(
            defaultAvailability
        );

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<
        "success" | "error" | ""
    >("");

    // ========================================================
    // AUTO HIDE TOAST
    // ========================================================

    useEffect(() => {
        if (!message) {
            return;
        }

        const timer = setTimeout(() => {
            setMessage("");
            setMessageType("");
        }, 4000);

        return () => clearTimeout(timer);
    }, [message]);

    // ========================================================
    // FETCH AVAILABILITY
    // ========================================================

    const fetchAvailability = async () => {
        try {
            setLoading(true);

            const token =
                sessionStorage.getItem(
                    "servicely_token"
                );

            if (!token) {
                setMessage(
                    "Your session has expired. Please login again."
                );
                setMessageType("error");
                return;
            }

            const response = await fetch(
                `${API_URL}/availability/getavailability`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            // JWT expired
            if (response.status === 401) {
                sessionStorage.removeItem(
                    "servicely_token"
                );

                window.location.href =
                    "/login/provider";

                return;
            }

            const data = await response.json();

            console.log(
                "Backend availability response:",
                data
            );

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.error ||
                    "The server rejected the request."
                );
            }

            const availability =
                data.availability || data;

            if (Array.isArray(availability)) {
                setDays(availability);
            }
        } catch (error) {
            console.error(
                "Fetch availability error:",
                error
            );

            setMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to load availability."
            );

            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    // ========================================================
    // LOAD AVAILABILITY WHEN PAGE OPENS
    // ========================================================

    useEffect(() => {
        fetchAvailability();
    }, []);

    // ========================================================
    // TOGGLE DAY
    // ========================================================

    const toggle = (day: string) => {
        setDays((prev) =>
            prev.map((item) =>
                item.day === day
                    ? {
                        ...item,
                        available:
                            !item.available,
                    }
                    : item
            )
        );

        // Remove any old toast when user edits again
        setMessage("");
        setMessageType("");
    };

    // ========================================================
    // UPDATE TIME
    // ========================================================

    const updateTime = (
        day: string,
        field: "start" | "end",
        value: string
    ) => {
        setDays((prev) =>
            prev.map((item) =>
                item.day === day
                    ? {
                        ...item,
                        [field]: value,
                    }
                    : item
            )
        );

        setMessage("");
        setMessageType("");
    };

    // ========================================================
    // VALIDATE AVAILABILITY
    // ========================================================

    const validateAvailability = () => {
        for (const item of days) {
            // Unavailable days don't need time validation
            if (!item.available) {
                continue;
            }

            if (!item.start || !item.end) {
                return `${item.day}: Please select both start and end time.`;
            }

            // Earliest allowed time = 8:00 AM
            if (item.start < "08:00") {
                return `${item.day}: Start time cannot be earlier than 8:00 AM.`;
            }

            // Latest allowed time = 6:00 PM
            if (item.end > "18:00") {
                return `${item.day}: End time cannot be later than 6:00 PM.`;
            }

            // End must be later than start
            if (item.end <= item.start) {
                return `${item.day}: End time must be later than start time.`;
            }
        }

        return null;
    };

    // ========================================================
    // SAVE AVAILABILITY
    // ========================================================

    const saveAvailability = async () => {
        // Validate before sending to backend
        const validationError =
            validateAvailability();

        if (validationError) {
            setMessage(validationError);
            setMessageType("error");
            return;
        }

        try {
            setSaving(true);

            // Clear previous toast
            setMessage("");
            setMessageType("");

            const token =
                sessionStorage.getItem(
                    "servicely_token"
                );

            if (!token) {
                setMessage(
                    "Your session has expired. Please login again."
                );
                setMessageType("error");
                return;
            }

            const response = await fetch(
                `${API_URL}/availability/postavailability`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        availability: days,
                    }),
                }
            );

            // JWT expired
            if (response.status === 401) {
                sessionStorage.removeItem(
                    "servicely_token"
                );

                window.location.href =
                    "/login/provider";

                return;
            }

            const data = await response.json();

            console.log(
                "Backend save availability response:",
                data
            );

            // IMPORTANT:
            // Display backend error instead of generic error
            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.error ||
                    "The server rejected your availability."
                );
            }

            // Success toast
            setMessage(
                data.message ||
                "Your availability has been saved successfully."
            );

            setMessageType("success");

            // Reload saved data from backend
            await fetchAvailability();
        } catch (error) {
            console.error(
                "Save availability error:",
                error
            );

            setMessage(
                error instanceof Error
                    ? error.message
                    : "Something went wrong while saving availability."
            );

            setMessageType("error");
        } finally {
            setSaving(false);
        }
    };

    // ========================================================
    // UI
    // ========================================================

    return (
        <DashboardLayout
            role="provider"
            navItems={providerNavItems}
        >
            {/* ==================================================
                TOAST
            ================================================== */}

            {message && messageType && (
                <AvailabilityToast
                    message={message}
                    type={messageType}
                    onClose={() => {
                        setMessage("");
                        setMessageType("");
                    }}
                />
            )}

            {/* ==================================================
                PAGE HEADER
            ================================================== */}

            <DashboardHeader
                title="Availability"
                subtitle="Set the days and hours when customers can book your services."
            />

            <div className="relative max-w-3xl">
                {/* ==================================================
                    INITIAL PAGE LOADER
                ================================================== */}

                {/* {loading && (
                    <div className="absolute inset-0 z-50 flex min-h-[650px] items-center justify-center rounded-2xl bg-white/50 backdrop-blur-md dark:bg-ink-950/50">
                        <div className="flex w-[calc(100%-40px)] max-w-xs flex-col items-center rounded-2xl border border-ink-100 bg-white px-7 py-7 text-center shadow-xl dark:border-ink-800 dark:bg-ink-900">
                            <div className="relative mb-4 flex h-14 w-14 items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-4 border-primary-100 dark:border-primary-950" />

                                <Loader2 className="relative h-7 w-7 animate-spin text-primary-600" />
                            </div>

                            <p className="text-sm font-semibold text-ink-900 dark:text-white">
                                Loading availability
                            </p>

                            <p className="mt-1.5 text-xs leading-5 text-ink-500">
                                Getting your saved schedule...
                            </p>
                        </div>
                    </div>
                )} */}

                {/* ==================================================
                    MAIN CARD
                ================================================== */}

                <div
                    className={`card overflow-hidden transition-all duration-300 ${loading
                            ? "pointer-events-none blur-[2px]"
                            : ""
                        }`}
                >
                    {/* ==================================================
                        HEADER
                    ================================================== */}

                    <div className="border-b border-ink-100 px-5 py-5 dark:border-ink-800 sm:px-6">
                        <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950">
                                <CalendarDays className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="text-base font-semibold text-ink-900 dark:text-white">
                                    Working Schedule
                                </h2>

                                <p className="mt-1 text-sm leading-5 text-ink-500">
                                    Customers will only be
                                    able to book you during
                                    the times you mark as
                                    available.
                                </p>
                            </div>
                        </div>

                        {/* Working hours information */}
                        <div className="mt-4 flex items-center gap-2 rounded-xl bg-ink-50 px-3 py-2.5 text-xs text-ink-600 dark:bg-ink-800/60 dark:text-ink-300">
                            <Clock className="h-4 w-4 shrink-0" />

                            <span>
                                Working hours must be
                                between{" "}
                                <strong className="font-semibold text-ink-800 dark:text-white">
                                    8:00 AM
                                </strong>{" "}
                                and{" "}
                                <strong className="font-semibold text-ink-800 dark:text-white">
                                    6:00 PM
                                </strong>
                                .
                            </span>
                        </div>
                    </div>

                    {/* ==================================================
                        DAYS
                    ================================================== */}

                    <div className="space-y-3 p-5 sm:p-6">
                        {days.map((day) => (
                            <div
                                key={day.day}
                                className={`rounded-2xl border p-4 transition-all duration-200 ${day.available
                                        ? "border-primary-200 bg-primary-50/40 dark:border-primary-900 dark:bg-primary-950/20"
                                        : "border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900/40"
                                    }`}
                            >
                                {/* Day row */}
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold ${day.available
                                                    ? "bg-primary-600 text-white"
                                                    : "bg-ink-100 text-ink-500 dark:bg-ink-800"
                                                }`}
                                        >
                                            {
                                                dayShortNames[
                                                day.day
                                                ]
                                            }
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-ink-800 dark:text-white">
                                                {day.day}
                                            </p>

                                            <p className="text-xs text-ink-500">
                                                {day.available
                                                    ? "Available for bookings"
                                                    : "Not available"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Toggle */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            toggle(
                                                day.day
                                            )
                                        }
                                        aria-label={`Toggle ${day.day}`}
                                        aria-pressed={
                                            day.available
                                        }
                                        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${day.available
                                                ? "bg-primary-600"
                                                : "bg-ink-200 dark:bg-ink-700"
                                            }`}
                                    >
                                        <span
                                            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${day.available
                                                    ? "translate-x-5"
                                                    : "translate-x-0"
                                                }`}
                                        />
                                    </button>
                                </div>

                                {/* ==================================================
                                    TIME INPUTS
                                ================================================== */}

                                {day.available && (
                                    <div className="mt-4 border-t border-primary-100 pt-4 dark:border-primary-900">
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                                            {/* Start */}
                                            <div className="min-w-0">
                                                <label className="mb-1.5 block text-xs font-medium text-ink-600 dark:text-ink-300">
                                                    Start time
                                                </label>

                                                <input
                                                    type="time"
                                                    min="08:00"
                                                    max="18:00"
                                                    value={day.start}
                                                    onChange={(e) =>
                                                        updateTime(
                                                            day.day,
                                                            "start",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="input w-full min-w-0 max-w-full text-base sm:text-sm"
                                                />
                                            </div>

                                            {/* Separator */}
                                            <div className="hidden pb-2 text-sm text-ink-400 sm:block">
                                                —
                                            </div>

                                            {/* End */}
                                            <div className="min-w-0">
                                                <label className="mb-1.5 block text-xs font-medium text-ink-600 dark:text-ink-300">
                                                    End time
                                                </label>

                                                <input
                                                    type="time"
                                                    min="08:00"
                                                    max="18:00"
                                                    value={day.end}
                                                    onChange={(e) =>
                                                        updateTime(
                                                            day.day,
                                                            "end",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="input w-full min-w-0 max-w-full text-base sm:text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-500">
                                            <Clock className="h-3.5 w-3.5 shrink-0" />

                                            <span>
                                                Select a time between 8:00 AM and 6:00 PM.
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* ==================================================
                                    UNAVAILABLE
                                ================================================== */}

                                {!day.available && (
                                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-500 dark:bg-ink-800/70">
                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink-400" />

                                        <span>
                                            Customers cannot
                                            book you on this
                                            day.
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* ==================================================
                        FOOTER
                    ================================================== */}

                    <div className="border-t border-ink-100 px-5 py-5 dark:border-ink-800 sm:px-6">
                        <button
                            type="button"
                            onClick={saveAvailability}
                            disabled={
                                saving || loading
                            }
                            className="btn-primary flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                            {saving && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}

                            {saving
                                ? "Saving availability..."
                                : "Save Availability"}
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

