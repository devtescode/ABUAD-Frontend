import { useEffect, useMemo, useState } from "react";
import {
  DashboardLayout,
  DashboardHeader,
} from "@/components/DashboardLayout";
import { providerNavItems } from "@/data/providerNavItems";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Save,
  X,
} from "lucide-react";
import {
  Badge,
  Button,
  ErrorState,
  Skeleton,
  cn,
} from "@/components/ui";
import { useAvailability, useUpdateAvailability } from "@/hooks/queries";
import { getApiErrorMessage, hasUserToken } from "@/lib/api";

type AvailabilityDay = {
  day: string;
  available: boolean;
  start: string;
  end: string;
};

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const DEFAULT_START = "08:00";
const DEFAULT_END = "18:00";

const dayShortNames: Record<string, string> = {
  Monday: "MON",
  Tuesday: "TUE",
  Wednesday: "WED",
  Thursday: "THU",
  Friday: "FRI",
  Saturday: "SAT",
  Sunday: "SUN",
};

const defaultAvailability: AvailabilityDay[] = WEEK_DAYS.map((day) => ({
  day,
  available: false,
  start: DEFAULT_START,
  end: DEFAULT_END,
}));

/* =========================================================
   HELPERS
========================================================= */

function normalizeTime(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;

  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : fallback;
}

/**
 * The API may return a partial or out-of-order weekly schedule. Normalise it
 * back into the seven-day model the editor (and the save payload) expects.
 */
function normalizeAvailability(
  rows: Array<Record<string, unknown>>
): AvailabilityDay[] {
  const byDay = new Map<string, AvailabilityDay>();

  rows.forEach((row) => {
    if (!row || typeof row !== "object") return;

    const rawDay = typeof row.day === "string" ? row.day.trim() : "";
    const day = WEEK_DAYS.find(
      (name) => name.toLowerCase() === rawDay.toLowerCase()
    );

    if (!day || byDay.has(day)) return;

    byDay.set(day, {
      day,
      available: Boolean(row.available),
      start: normalizeTime(row.start, DEFAULT_START),
      end: normalizeTime(row.end, DEFAULT_END),
    });
  });

  return WEEK_DAYS.map(
    (day) =>
      byDay.get(day) ?? {
        day,
        available: false,
        start: DEFAULT_START,
        end: DEFAULT_END,
      }
  );
}

function timeToMinutes(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})/);
  if (!match) return null;

  return Number(match[1]) * 60 + Number(match[2]);
}

function formatDuration(totalMinutes: number) {
  if (totalMinutes <= 0) return "0h";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!hours) return `${minutes}m`;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

/* =========================================================
   TOAST
========================================================= */

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
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      className={cn(
        "fixed inset-x-3 top-4 z-[9999] mx-auto max-w-[420px] overflow-hidden",
        "rounded-xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/5",
        "animate-fade-in dark:bg-ink-900 dark:ring-white/10",
        "sm:inset-x-auto sm:right-5 sm:top-5 sm:mx-0 md:right-6 md:top-6"
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            type === "success"
              ? "bg-success-50 text-success-600 dark:bg-success-600/15 dark:text-success-200"
              : "bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-200"
          )}
        >
          {type === "success" ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-semibold text-slate-900 dark:text-ink-50">
            {type === "success" ? "Success" : "Something went wrong"}
          </p>

          <p className="mt-0.5 break-words text-xs leading-5 text-slate-500 dark:text-ink-400">
            {message}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-ink-500 dark:hover:bg-ink-800 dark:hover:text-ink-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div
        aria-hidden="true"
        className={cn(
          "h-1 w-full",
          type === "success" ? "bg-success-500" : "bg-danger-500"
        )}
      />
    </div>
  );
}

/* =========================================================
   DAY CARD
========================================================= */

function DayCard({
  item,
  disabled,
  onToggle,
  onTimeChange,
}: {
  item: AvailabilityDay;
  disabled: boolean;
  onToggle: () => void;
  onTimeChange: (field: "start" | "end", value: string) => void;
}) {
  const startId = `availability-${item.day.toLowerCase()}-start`;
  const endId = `availability-${item.day.toLowerCase()}-end`;
  const hintId = `availability-${item.day.toLowerCase()}-hint`;

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all duration-200 sm:p-5",
        item.available
          ? "border-brand-200 bg-brand-50/50 shadow-sm dark:border-brand-900 dark:bg-brand-950/20"
          : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-ink-800 dark:bg-ink-900/40 dark:hover:border-ink-700"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            aria-hidden="true"
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold tracking-wide transition-colors",
              item.available
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-500 dark:bg-ink-800 dark:text-ink-400"
            )}
          >
            {dayShortNames[item.day] ?? item.day.slice(0, 3).toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-ink-50">
              {item.day}
            </p>

            <p
              className={cn(
                "mt-0.5 text-xs font-medium",
                item.available
                  ? "text-brand-700 dark:text-brand-300"
                  : "text-slate-500 dark:text-ink-400"
              )}
            >
              {item.available
                ? `Open ${item.start} – ${item.end}`
                : "Closed"}
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={item.available}
          aria-label={`${item.day} availability`}
          onClick={onToggle}
          disabled={disabled}
          className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-ink-800"
        >
          <span
            aria-hidden="true"
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors duration-200",
              item.available
                ? "bg-brand-600"
                : "bg-slate-300 dark:bg-ink-700"
            )}
          >
            <span
              className={cn(
                "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
                item.available ? "translate-x-5" : "translate-x-0"
              )}
            />
          </span>
        </button>
      </div>

      {item.available ? (
        <div className="mt-4 border-t border-brand-100 pt-4 dark:border-brand-900">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <label
                htmlFor={startId}
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-ink-400"
              >
                Start time
              </label>

              <input
                id={startId}
                type="time"
                min="08:00"
                max="18:00"
                value={item.start}
                onChange={(event) =>
                  onTimeChange("start", event.target.value)
                }
                aria-describedby={hintId}
                className="input h-11 min-w-0 appearance-none"
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor={endId}
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-ink-400"
              >
                End time
              </label>

              <input
                id={endId}
                type="time"
                min="08:00"
                max="18:00"
                value={item.end}
                onChange={(event) =>
                  onTimeChange("end", event.target.value)
                }
                aria-describedby={hintId}
                className="input h-11 min-w-0 appearance-none"
              />
            </div>
          </div>

          <p
            id={hintId}
            className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-ink-400"
          >
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>Choose a time between 8:00 AM and 6:00 PM.</span>
          </p>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-ink-800/60 dark:text-ink-400">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
          <span>Customers cannot book you on this day.</span>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SUMMARY (desktop sticky action)
========================================================= */

function ScheduleSummary({
  openDays,
  weeklyMinutes,
  saving,
  onSave,
}: {
  openDays: number;
  weeklyMinutes: number;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
          <CalendarDays className="h-4 w-4" />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-ink-50">
            Schedule summary
          </h2>
          <p className="text-xs text-slate-500 dark:text-ink-400">
            Your weekly availability
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-ink-800/60">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-ink-400">
            Open days
          </dt>
          <dd className="mt-1 text-lg font-bold text-slate-900 dark:text-ink-50">
            {openDays}
            <span className="text-xs font-medium text-slate-400 dark:text-ink-500">
              {" "}
              / 7
            </span>
          </dd>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 dark:bg-ink-800/60">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-ink-400">
            Weekly hours
          </dt>
          <dd className="mt-1 text-lg font-bold text-slate-900 dark:text-ink-50">
            {formatDuration(weeklyMinutes)}
          </dd>
        </div>
      </dl>

      <p className="mt-4 rounded-xl border border-dashed border-slate-200 px-3 py-2.5 text-[11px] leading-5 text-slate-500 dark:border-ink-700 dark:text-ink-400">
        Bookings are limited to{" "}
        <span className="font-semibold text-slate-700 dark:text-ink-200">
          8:00 AM – 6:00 PM
        </span>
        . Closed days are hidden from customers.
      </p>

      <Button
        type="button"
        onClick={onSave}
        loading={saving}
        icon={Save}
        disabled={saving}
        className="mt-4 w-full"
      >
        {saving ? "Saving availability..." : "Save availability"}
      </Button>
    </div>
  );
}

/* =========================================================
   LOADING SKELETON
========================================================= */

function AvailabilitySkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-5 dark:border-ink-800 sm:px-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-11 w-11 rounded-xl" />

            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>

          <Skeleton className="mt-4 h-10 w-full rounded-xl" />
        </div>

        <div className="space-y-3 p-5 sm:p-6">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-100 p-4 dark:border-ink-800"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-11 w-11 rounded-xl" />

                  <div className="space-y-2">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>

                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="card space-y-4 p-5">
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export function ProviderAvailability() {
  const [days, setDays] = useState<AvailabilityDay[]>(defaultAvailability);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const availabilityQuery = useAvailability();
  const updateAvailability = useUpdateAvailability();

  const { data, isLoading, isError, error, refetch } = availabilityQuery;
  const saving = updateAvailability.isPending;

  /* Keep the editable draft in sync with the latest server data. */
  useEffect(() => {
    if (data) {
      setDays(normalizeAvailability(data));
    }
  }, [data]);

  /* Auto-hide the toast after 4 seconds (existing behaviour). */
  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [message]);

  const openDays = useMemo(
    () => days.filter((item) => item.available).length,
    [days]
  );

  const weeklyMinutes = useMemo(
    () =>
      days.reduce((total, item) => {
        if (!item.available) return total;

        const start = timeToMinutes(item.start);
        const end = timeToMinutes(item.end);

        if (start === null || end === null) return total;

        return total + Math.max(0, end - start);
      }, 0),
    [days]
  );

  const clearMessage = () => {
    setMessage("");
    setMessageType("");
  };

  const toggle = (day: string) => {
    setDays((prev) =>
      prev.map((item) =>
        item.day === day ? { ...item, available: !item.available } : item
      )
    );

    clearMessage();
  };

  const updateTime = (
    day: string,
    field: "start" | "end",
    value: string
  ) => {
    setDays((prev) =>
      prev.map((item) =>
        item.day === day ? { ...item, [field]: value } : item
      )
    );

    clearMessage();
  };

  const validateAvailability = () => {
    for (const item of days) {
      // Unavailable days don't need time validation
      if (!item.available) continue;

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

  const saveAvailability = async () => {
    const validationError = validateAvailability();

    if (validationError) {
      setMessage(validationError);
      setMessageType("error");
      return;
    }

    if (!hasUserToken()) {
      setMessage("Your session has expired. Please login again.");
      setMessageType("error");
      return;
    }

    clearMessage();

    try {
      const response = await updateAvailability.mutateAsync(
        days as Array<Record<string, unknown>>
      );

      const successMessage =
        typeof response?.message === "string" && response.message.trim()
          ? response.message
          : "Your availability has been saved successfully.";

      setMessage(successMessage);
      setMessageType("success");

      // Reload saved data from the backend.
      await refetch();
    } catch (saveError) {
      setMessage(
        getApiErrorMessage(saveError) ||
          "Something went wrong while saving availability."
      );
      setMessageType("error");
    }
  };

  const sessionMissing = !hasUserToken();
  const showLoadError = sessionMissing || isError;

  const loadErrorMessage = sessionMissing
    ? "Your session has expired. Please login again."
    : getApiErrorMessage(error);

  return (
    <DashboardLayout role="provider" navItems={providerNavItems}>
      {message && messageType && (
        <AvailabilityToast
          message={message}
          type={messageType}
          onClose={clearMessage}
        />
      )}

      <DashboardHeader
        title="Availability"
        subtitle="Set the days and hours when customers can book your services."
        action={
          !isLoading && !showLoadError ? (
            <Badge tone="brand" icon={CalendarDays}>
              {openDays} of 7 days open
            </Badge>
          ) : undefined
        }
      />

      {isLoading ? (
        <AvailabilitySkeleton />
      ) : showLoadError ? (
        <div className="max-w-3xl">
          <ErrorState
            message={loadErrorMessage}
            onRetry={() => {
              void refetch();
            }}
          />
        </div>
      ) : (
        <>
          <div className="grid gap-6 pb-24 lg:grid-cols-[minmax(0,1fr)_300px] lg:pb-0">
            <section
              aria-busy={saving}
              className="card overflow-hidden transition-opacity duration-200"
            >
              <div className="border-b border-slate-100 px-5 py-5 dark:border-ink-800 sm:px-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                    <CalendarDays className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-ink-50">
                      Working schedule
                    </h2>

                    <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-ink-400">
                      Customers will only be able to book you during the times
                      you mark as available.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600 dark:bg-ink-800/60 dark:text-ink-300">
                  <Clock className="h-4 w-4 shrink-0" />

                  <span>
                    Working hours must be between{" "}
                    <strong className="font-semibold text-slate-800 dark:text-ink-50">
                      8:00 AM
                    </strong>{" "}
                    and{" "}
                    <strong className="font-semibold text-slate-800 dark:text-ink-50">
                      6:00 PM
                    </strong>
                    .
                  </span>
                </div>
              </div>

              <div className="space-y-3 p-5 sm:p-6">
                {days.map((item) => (
                  <DayCard
                    key={item.day}
                    item={item}
                    disabled={saving}
                    onToggle={() => toggle(item.day)}
                    onTimeChange={(field, value) =>
                      updateTime(item.day, field, value)
                    }
                  />
                ))}
              </div>

              <div className="hidden border-t border-slate-100 px-5 py-4 text-xs text-slate-500 dark:border-ink-800 dark:text-ink-400 lg:block sm:px-6">
                Changes are not saved until you select{" "}
                <span className="font-semibold text-slate-700 dark:text-ink-200">
                  Save availability
                </span>
                .
              </div>
            </section>

            <aside className="hidden lg:block">
              <div className="lg:sticky lg:top-24">
                <ScheduleSummary
                  openDays={openDays}
                  weeklyMinutes={weeklyMinutes}
                  saving={saving}
                  onSave={saveAvailability}
                />
              </div>
            </aside>
          </div>

          {/* Mobile sticky save action */}
          <div
            className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 px-4 pb-3 pt-3 backdrop-blur-md dark:border-ink-800 dark:bg-ink-950/95 lg:hidden"
            style={{
              paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
            }}
          >
            <div className="mx-auto flex max-w-3xl items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-900 dark:text-ink-50">
                  {openDays} of 7 days open
                </p>
                <p className="truncate text-[11px] text-slate-500 dark:text-ink-400">
                  {formatDuration(weeklyMinutes)} scheduled this week
                </p>
              </div>

              <Button
                type="button"
                onClick={saveAvailability}
                loading={saving}
                icon={Save}
                disabled={saving}
                className="shrink-0"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
