import { useEffect, useMemo, useState } from "react";

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  Info,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

interface AvailabilitySlot {
  _id?: string;
  day?: string;
  start?: string;
  end?: string;
  available?: boolean;
}

interface AvailabilityTabProps {
  slots: AvailabilitySlot[];
  providerName: string;
  providerId: string;
}

interface DayConfig {
  name: string;
  short: string;
  weekday: number;
}

interface DayGroup {
  key: string;
  label: string;
  ranges: string[];
  count: number;
}

/* =========================================================
   CONSTANTS
========================================================= */

/*
 * weekday matches the Date.getDay() numbering:
 * Sunday is 0, Monday is 1 and so on. The board itself is
 * rendered Monday first, so the order below is intentional.
 */
const WEEK_DAYS: DayConfig[] = [
  { name: "Monday", short: "Mon", weekday: 1 },
  { name: "Tuesday", short: "Tue", weekday: 2 },
  { name: "Wednesday", short: "Wed", weekday: 3 },
  { name: "Thursday", short: "Thu", weekday: 4 },
  { name: "Friday", short: "Fri", weekday: 5 },
  { name: "Saturday", short: "Sat", weekday: 6 },
  { name: "Sunday", short: "Sun", weekday: 0 },
];

const DAY_ALIASES: Record<string, string> = {
  mon: "Monday",
  monday: "Monday",
  tue: "Tuesday",
  tues: "Tuesday",
  tuesday: "Tuesday",
  wed: "Wednesday",
  weds: "Wednesday",
  wednesday: "Wednesday",
  thu: "Thursday",
  thur: "Thursday",
  thurs: "Thursday",
  thursday: "Thursday",
  fri: "Friday",
  friday: "Friday",
  sat: "Saturday",
  saturday: "Saturday",
  sun: "Sunday",
  sunday: "Sunday",
};

/* =========================================================
   HELPERS
========================================================= */

const canonicalDay = (value?: string): string => {
  const key = (value || "").trim().toLowerCase();
  return DAY_ALIASES[key] || "";
};

/*
 * "09:00" -> "9:00 AM", "13:30" -> "1:30 PM".
 * Unknown values are passed through so no data is lost.
 */
const formatTime = (value?: string): string => {
  if (!value) return "";

  const raw = value.trim();
  const match = /^(\d{1,2}):(\d{2})/.exec(raw);

  if (!match) return raw;

  const hours = Number(match[1]);

  if (!Number.isFinite(hours)) return raw;

  const minutes = match[2];
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${minutes} ${period}`;
};

const formatRange = (slot: AvailabilitySlot): string => {
  const start = formatTime(slot.start);
  const end = formatTime(slot.end);

  if (start && end) return `${start} – ${end}`;
  if (start) return `From ${start}`;
  if (end) return `Until ${end}`;

  return "Time on request";
};

/* =========================================================
   COMPONENT
========================================================= */

export default function AvailabilityTab({
  slots,
  providerName,
  providerId,
}: AvailabilityTabProps) {
  /*
   * The current weekday is resolved after mount so the first render
   * is identical on the server and in the browser. No hydration
   * mismatch, no locale/timezone dependent output during render.
   */
  const [todayIndex, setTodayIndex] = useState<number | null>(null);

  useEffect(() => {
    setTodayIndex(new Date().getDay());
  }, []);

  const availableSlots = useMemo(
    () =>
      (Array.isArray(slots) ? slots : []).filter(
        (slot) => slot && slot.available !== false
      ),
    [slots]
  );

  const slotsByDay = useMemo(() => {
    const map: Record<string, AvailabilitySlot[]> = {};

    availableSlots.forEach((slot) => {
      const day = canonicalDay(slot.day);

      if (!day) return;

      if (!map[day]) map[day] = [];
      map[day].push(slot);
    });

    return map;
  }, [availableSlots]);

  const groups = useMemo<DayGroup[]>(() => {
    const result: DayGroup[] = [];

    WEEK_DAYS.forEach((day) => {
      const daySlots = slotsByDay[day.name] || [];

      if (daySlots.length === 0) return;

      result.push({
        key: day.name,
        label: day.name,
        ranges: daySlots.map(formatRange),
        count: daySlots.length,
      });
    });

    const flexibleSlots = availableSlots.filter(
      (slot) => !canonicalDay(slot.day)
    );

    if (flexibleSlots.length > 0) {
      result.push({
        key: "flexible",
        label: "Flexible",
        ranges: flexibleSlots.map(formatRange),
        count: flexibleSlots.length,
      });
    }

    return result;
  }, [availableSlots, slotsByDay]);

  const availableDayCount = groups.filter(
    (group) => group.key !== "flexible"
  ).length;

  /* =======================================================
     EMPTY STATE
  ====================================================== */

  if (availableSlots.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        aria-label="No availability published"
        className="relative overflow-hidden rounded-3xl border border-dashed border-ink-200 bg-white px-6 py-14 text-center shadow-xs dark:border-ink-700 dark:bg-ink-900"
      >
        <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-brand-100/60 blur-3xl dark:bg-brand-950/30" />

        <div className="relative flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-xs ring-1 ring-brand-100 dark:bg-brand-950/50 dark:text-brand-300 dark:ring-brand-900">
            <Compass className="h-7 w-7" aria-hidden="true" />
          </div>

          <h3 className="mt-5 text-lg font-extrabold tracking-tight text-ink-900 dark:text-white">
            No schedule shared yet
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-ink-500 dark:text-ink-400">
            {providerName} has not added working days or booking hours
            yet. Browse other services in the meantime, or check back
            soon for an updated schedule.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink-50 px-3 py-1.5 text-xs font-medium text-ink-500 dark:bg-ink-800 dark:text-ink-400">
            <span className="h-1.5 w-1.5 rounded-full bg-ink-300 dark:bg-ink-600" />
            Schedule unavailable
          </div>

          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Link
              to="/services"
              aria-label="Browse all services"
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-soft transition hover:bg-brand-700 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-ink-900"
            >
              Browse services
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>

            <Link
              to={`/book/${providerId}`}
              aria-label={`Book a session with ${providerName}`}
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-xs font-bold text-ink-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:border-brand-800 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
            >
              Book a session
            </Link>
          </div>
        </div>
      </motion.section>
    );
  }

  /* =======================================================
     AVAILABILITY
  ====================================================== */

  return (
    <div
      className="space-y-8"
      aria-label={`${providerName} availability`}
    >
      {/* SUMMARY HEADER */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        aria-label="Weekly schedule summary"
        className="relative overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-primary-400 to-accent-400" />

        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-100/60 blur-3xl dark:bg-brand-950/30" />

        <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-xs ring-1 ring-brand-100 dark:bg-brand-950/50 dark:text-brand-300 dark:ring-brand-900">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">
                At a glance
              </p>

              <h2 className="mt-1 text-lg font-extrabold tracking-tight text-ink-900 dark:text-white sm:text-xl">
                Weekly schedule
              </h2>

              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                See when {providerName} is open for bookings.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className="inline-flex items-center gap-2 rounded-full bg-success-50 px-3 py-1.5 text-xs font-bold text-success-700 ring-1 ring-success-100 dark:bg-success-500/10 dark:text-success-500 dark:ring-success-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
              {availableDayCount}{" "}
              {availableDayCount === 1 ? "day" : "days"} available
            </span>

            <span className="inline-flex items-center gap-1.5 text-xs text-ink-400 dark:text-ink-500">
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
              Times shown in your local time
            </span>
          </div>
        </div>
      </motion.section>

      {/* WEEKLY BOARD */}
      <section aria-label="Weekly availability board" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-ink-900 dark:text-white">
              This week at a glance
            </h3>

            <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
              Open days are highlighted. Closed days have no bookings.
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-ink-50 px-3 py-1.5 text-[11px] font-semibold text-ink-500 ring-1 ring-ink-100 dark:bg-ink-800 dark:text-ink-300 dark:ring-ink-700">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {availableDayCount}/7 open
          </span>
        </div>

        <div
          role="list"
          aria-label="Weekly availability by day"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7"
        >
          {WEEK_DAYS.map((day, index) => {
            const daySlots = slotsByDay[day.name] || [];
            const isOpen = daySlots.length > 0;
            const isToday = todayIndex === day.weekday;
            const primaryRange = isOpen
              ? formatRange(daySlots[0])
              : "Closed";

            return (
              <motion.div
                key={day.name}
                role="listitem"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                aria-label={`${day.name}: ${primaryRange}${
                  isToday ? ", today" : ""
                }`}
                className={`relative flex min-h-[132px] flex-col overflow-hidden rounded-2xl border p-4 transition-all duration-200 ${
                  isToday
                    ? "border-brand-300 bg-brand-50/70 shadow-soft ring-2 ring-brand-400/50 dark:border-brand-700 dark:bg-brand-950/30 dark:ring-brand-500/40"
                    : isOpen
                      ? "border-ink-100 bg-white shadow-card hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover dark:border-ink-800 dark:bg-ink-900 dark:hover:border-brand-800"
                      : "border-dashed border-ink-200 bg-ink-50/60 dark:border-ink-700 dark:bg-ink-900/60"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-[0.16em] ${
                        isToday
                          ? "text-brand-600 dark:text-brand-300"
                          : "text-ink-400 dark:text-ink-500"
                      }`}
                    >
                      {day.short}
                    </p>

                    <p
                      className={`mt-0.5 text-sm font-bold ${
                        isOpen
                          ? "text-ink-900 dark:text-white"
                          : "text-ink-400 dark:text-ink-500"
                      }`}
                    >
                      {day.name}
                    </p>
                  </div>

                  {isToday && (
                    <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                      Today
                    </span>
                  )}
                </div>

                <div className="mt-auto pt-4">
                  {isOpen ? (
                    <>
                      <div className="flex items-center gap-1.5 text-success-600 dark:text-success-500">
                        <CheckCircle2
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />

                        <span className="text-[10px] font-bold uppercase tracking-wide">
                          Open
                        </span>
                      </div>

                      <p className="mt-1.5 text-xs font-semibold leading-5 text-ink-700 dark:text-ink-200">
                        {primaryRange}
                      </p>

                      {daySlots.length > 1 && (
                        <p className="mt-0.5 text-[10px] font-medium text-ink-400 dark:text-ink-500">
                          +{daySlots.length - 1} more session
                          {daySlots.length - 1 === 1 ? "" : "s"}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 text-ink-300 dark:text-ink-600">
                        <Clock
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />

                        <span className="text-[10px] font-bold uppercase tracking-wide">
                          Closed
                        </span>
                      </div>

                      <p className="mt-1.5 text-xs text-ink-400 dark:text-ink-500">
                        No bookings
                      </p>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* AVAILABLE DAYS */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        aria-labelledby="availability-days-heading"
        className="rounded-3xl border border-ink-100 bg-ink-50/50 p-5 dark:border-ink-800 dark:bg-ink-950/40 sm:p-6"
      >
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-xs ring-1 ring-ink-100 dark:bg-ink-800 dark:text-brand-300 dark:ring-ink-700">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
            </div>

            <div>
              <h3
                id="availability-days-heading"
                className="text-sm font-extrabold text-ink-900 dark:text-white"
              >
                Available days
              </h3>

              <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                Pick a day, then choose a time that works for you.
              </p>
            </div>
          </div>

          <Link
            to={`/book/${providerId}`}
            aria-label={`Book a session with ${providerName}`}
            className="inline-flex min-h-[38px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white shadow-soft transition hover:bg-brand-700 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-ink-900"
          >
            Book a session
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group, groupIndex) => (
            <motion.article
              key={group.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: groupIndex * 0.05 }}
              aria-label={`${group.label}: ${group.ranges.join(", ")}`}
              className="rounded-2xl border border-ink-100 bg-white p-4 shadow-xs transition hover:border-brand-200 hover:shadow-card dark:border-ink-800 dark:bg-ink-900 dark:hover:border-brand-800"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-[10px] font-extrabold text-brand-600 dark:bg-brand-950/50 dark:text-brand-300">
                    {group.label.slice(0, 3).toUpperCase()}
                  </span>

                  <p className="truncate text-sm font-bold text-ink-900 dark:text-white">
                    {group.label}
                  </p>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-[10px] font-bold text-success-700 dark:bg-success-500/10 dark:text-success-500">
                  <span className="h-1 w-1 rounded-full bg-success-500" />
                  Open
                </span>
              </div>

              <div className="mt-3 space-y-1.5 border-t border-ink-100 pt-3 dark:border-ink-800">
                {group.ranges.map((range, rangeIndex) => (
                  <div
                    key={`${group.key}-${rangeIndex}`}
                    className="flex items-center gap-2 text-xs font-semibold text-ink-700 dark:text-ink-200"
                  >
                    <Clock
                      className="h-3.5 w-3.5 shrink-0 text-brand-500"
                      aria-hidden="true"
                    />

                    <span>{range}</span>
                  </div>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
