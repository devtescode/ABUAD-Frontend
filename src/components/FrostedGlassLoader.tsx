import { useId } from 'react';
import { Camera } from 'lucide-react';

export interface FrostedGlassLoaderProps {
  /** Text shown inside the card and announced to assistive technology. */
  message?: string;
}

/**
 * Frosted-glass fallback shown while a lazy page chunk loads.
 * Mirrors the site's brand mark and glass surfaces, with full dark-mode
 * and reduced-motion support.
 */
export function FrostedGlassLoader({
  message = 'Getting things ready…',
}: FrostedGlassLoaderProps) {
  const labelId = useId();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-atomic="true"
      aria-labelledby={labelId}
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50 via-lavender to-white px-4 py-12 dark:from-ink-950 dark:via-ink-900 dark:to-ink-950"
    >
      {/* Ambient colour blobs give the frosted surface something to refract. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 top-10 h-64 w-64 rounded-full bg-brand-200/50 blur-3xl dark:bg-brand-900/40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 bottom-8 h-72 w-72 rounded-full bg-lime-200/50 blur-3xl dark:bg-lime-900/30"
      />

      {/* Frosted glass card */}
      <div className="relative w-full max-w-sm animate-scale-in rounded-3xl border border-white/60 bg-white/85 px-8 py-10 text-center shadow-elevated ring-1 ring-white/40 backdrop-blur-md motion-reduce:animate-none dark:border-white/10 dark:bg-ink-950/85 dark:ring-white/10 dark:backdrop-blur-xl">
        {/* Top light-catching edge */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent dark:via-lime-200/50"
        />

        {/* Brand mark framed by the spinner */}
        <div aria-hidden="true" className="relative mx-auto mb-7 h-16 w-16">
          <div className="absolute -inset-1.5 animate-spin rounded-[1.6rem] border-2 border-brand-100 border-t-brand-600 motion-reduce:animate-none dark:border-ink-800 dark:border-t-lime-300" />
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-brand-600 shadow-soft ring-4 ring-brand-50/80 dark:ring-brand-950/60">
            <Camera className="h-8 w-8 text-white" />
          </div>
        </div>

        <p
          id={labelId}
          className="animate-fade-up text-sm font-semibold tracking-tight text-slate-800 motion-reduce:animate-none dark:text-ink-100"
        >
          {message}
        </p>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-ink-400">
          Servicely · ABUAD student marketplace
        </p>

        {/* Subtle shimmer progress hint */}
        <div
          aria-hidden="true"
          className="mx-auto mt-6 h-1 w-40 overflow-hidden rounded-full bg-brand-100/70 dark:bg-ink-800"
        >
          <div className="h-full w-full animate-shimmer rounded-full bg-gradient-to-r from-transparent via-brand-500 to-transparent bg-[length:1000px_100%] motion-reduce:animate-none dark:via-lime-300" />
        </div>
      </div>
    </div>
  );
}

export default FrostedGlassLoader;
