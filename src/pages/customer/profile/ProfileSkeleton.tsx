/**
 * Loading placeholder for the customer profile page.
 *
 * Mirrors the real layout (hero, side cards and details form) so the page does
 * not jump once the customer data arrives.
 */
import { Skeleton } from '@/components/ui';

export function ProfileSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading profile…</span>

      {/* Hero skeleton: cover, overlapping avatar and photo drop zone. */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-5 shadow-soft dark:from-brand-800 dark:via-brand-900 dark:to-brand-950 sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-lime-300/25 blur-3xl dark:bg-lime-300/15" />
          <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-lime-400/10 blur-3xl" />
        </div>

        <div className="relative h-16 sm:h-20" />

        <div className="relative -mt-12 sm:-mt-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
            <Skeleton className="h-24 w-24 shrink-0 rounded-full ring-4 ring-brand-800/70 sm:h-28 sm:w-28 dark:ring-brand-950/80" />
            <div className="min-w-0 pb-1">
              <Skeleton className="h-5 w-32 rounded-full" />
              <Skeleton className="mt-3 h-7 w-48 sm:h-8 sm:w-56" />
              <Skeleton className="mt-2 h-3.5 w-40 sm:w-52" />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-4 dark:bg-black/20 sm:px-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
                <div className="min-w-0">
                  <Skeleton className="h-3.5 w-48 sm:w-56" />
                  <Skeleton className="mt-2 h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-10 w-full rounded-xl sm:w-32" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="space-y-6">
          {/* Profile strength skeleton. */}
          <div className="card p-5 sm:p-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-ink-800">
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-2 h-3 w-44" />
              </div>
            </div>
            <Skeleton className="mt-5 h-2 w-full rounded-full" />
            <div className="mt-5 space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-44" />
            </div>
          </div>

          {/* Account details skeleton. */}
          <div className="card p-5 sm:p-6">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5 dark:border-ink-800">
              <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="mt-4 space-y-3.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>

        {/* Personal information form skeleton. */}
        <div className="card p-5 sm:p-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-ink-800">
            <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="min-w-0">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="mt-2 h-3.5 w-64 max-w-full" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
            <div>
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="mt-2 h-11 w-full rounded-xl" />
              <Skeleton className="mt-2 h-3 w-40" />
            </div>
            <div>
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="mt-2 h-11 w-full rounded-xl" />
              <Skeleton className="mt-2 h-3 w-44" />
            </div>
            <div>
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="mt-2 h-11 w-full rounded-xl" />
              <Skeleton className="mt-2 h-3 w-36" />
            </div>
            <div>
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="mt-2 h-11 w-full rounded-xl" />
              <Skeleton className="mt-2 h-3 w-40" />
            </div>
            <div className="sm:col-span-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="mt-2 h-[132px] w-full rounded-xl" />
              <Skeleton className="mt-2 h-3 w-52" />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 dark:border-ink-800 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-10 w-full rounded-xl sm:w-36" />
          </div>
        </div>
      </div>
    </div>
  );
}
