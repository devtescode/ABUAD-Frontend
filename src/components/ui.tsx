/**
 * Servicely Design System — shared UI primitives.
 *
 * All redesigned pages should build on these components to keep the
 * product visually consistent. Every component supports light + dark
 * themes and includes proper focus/keyboard accessibility.
 */
import {
  Component,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Inbox,
  RefreshCw,
  Search,
  Star,
  X,
  type LucideIcon,
} from 'lucide-react';
import { StarRating, VerifiedBadge } from '@/components/shared';
import { formatNaira } from '@/data/mockData';

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/* =========================================================
   BUTTON
========================================================= */

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:shadow-soft active:bg-brand-800',
  secondary:
    'bg-lavender text-brand-700 hover:bg-brand-100 active:bg-brand-200 dark:bg-brand-950/60 dark:text-brand-300 dark:hover:bg-brand-950 dark:active:bg-brand-900',
  outline:
    'border border-slate-200 bg-white text-slate-700 shadow-xs hover:border-brand-300 hover:bg-lavender hover:text-brand-700 active:bg-brand-100 dark:border-ink-700 dark:bg-transparent dark:text-ink-300 dark:hover:border-ink-600 dark:hover:bg-ink-800 dark:hover:text-ink-50 dark:active:bg-ink-700',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-50 dark:active:bg-ink-700',
  danger:
    'bg-danger-600 text-white shadow-sm hover:bg-danger-700 hover:shadow-soft active:bg-danger-700',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-9 gap-1.5 rounded-lg px-3.5 text-xs',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-7 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  className,
  children,
  disabled,
  ...props
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: LucideIcon;
  className?: string;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'btn',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <RefreshCw className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}

/* =========================================================
   CARD
========================================================= */

export function Card({
  hover = false,
  className,
  children,
}: {
  hover?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        hover ? 'card-hover' : 'card',
        'relative p-5',
        className
      )}
    >
      {children}
    </div>
  );
}

/* =========================================================
   SECTION HEADING
========================================================= */

export function SectionHeading({
  title,
  subtitle,
  action,
  align = 'left',
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  align?: 'left' | 'center';
}) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'text-center sm:flex-col sm:items-center'
      )}
    >
      <div className="min-w-0">
        <h2 className="text-balance text-xl font-bold tracking-tight text-slate-900 dark:text-ink-50 sm:text-2xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-ink-400">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* =========================================================
   BADGE
========================================================= */

const badgeTones = {
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300',
  success:
    'bg-success-50 text-success-700 dark:bg-success-600/15 dark:text-success-200',
  warning:
    'bg-warning-50 text-warning-700 dark:bg-warning-600/15 dark:text-warning-200',
  danger:
    'bg-danger-50 text-danger-700 dark:bg-danger-500/15 dark:text-danger-200',
  info: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200',
  neutral:
    'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-ink-300',
};

export function Badge({
  tone = 'neutral',
  icon: Icon,
  className,
  children,
}: {
  tone?: keyof typeof badgeTones;
  icon?: LucideIcon;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={cn('badge', badgeTones[tone], className)}>
      {Icon && <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  );
}

/* =========================================================
   BOOKING STATUS BADGE
   Maps the real backend booking statuses.
========================================================= */

const bookingStatusTones: Record<string, keyof typeof badgeTones> = {
  pending: 'warning',
  accepted: 'info',
  payment_pending: 'warning',
  paid: 'success',
  completed: 'brand',
  reviewed: 'brand',
  rejected: 'danger',
  cancelled: 'neutral',
  disputed: 'danger',
};

const bookingStatusLabels: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  payment_pending: 'Payment Due',
  paid: 'Confirmed',
  completed: 'Completed',
  reviewed: 'Reviewed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

export function BookingStatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={bookingStatusTones[status] || 'neutral'}>
      {bookingStatusLabels[status] || status}
    </Badge>
  );
}

/* =========================================================
   AVATAR
========================================================= */

export function Avatar({
  src,
  name,
  size = 'md',
  className,
}: {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
    xl: 'h-20 w-20 text-2xl',
  };

  const label = name ? `${name} avatar` : 'Avatar';

  return (
    <div
      role="img"
      aria-label={label}
      title={name || undefined}
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-brand-700 ring-1 ring-black/5 dark:bg-brand-950 dark:text-brand-300 dark:ring-white/10',
        sizes[size],
        className
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="font-semibold" aria-hidden="true">
          {(name || 'U')[0]?.toUpperCase()}
        </span>
      )}
    </div>
  );
}

/* =========================================================
   SKELETONS
========================================================= */

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('skeleton', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="card overflow-hidden p-5" aria-busy="true">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-5/6" />
      <Skeleton className="mt-4 h-9 w-full rounded-xl" />
    </div>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}

/* =========================================================
   EMPTY / ERROR STATES
========================================================= */

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-12 text-center shadow-xs dark:border-ink-700 dark:bg-ink-900/40 sm:px-10 sm:py-16',
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lavender text-brand-600 ring-1 ring-brand-100 dark:bg-brand-950 dark:text-brand-300 dark:ring-brand-900/60">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-5 text-base font-semibold text-slate-900 dark:text-ink-50">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-500 dark:text-ink-400">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message = 'Something went wrong.',
  title,
  onRetry,
  className,
}: {
  message?: string;
  title?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-danger-100 bg-danger-50/60 px-6 py-12 text-center shadow-xs dark:border-danger-500/20 dark:bg-danger-500/5 sm:px-10 sm:py-14',
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-100 text-danger-600 ring-1 ring-danger-200/70 dark:bg-danger-500/15 dark:text-danger-200 dark:ring-danger-500/20">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </div>
      {title && (
        <h3 className="mt-4 text-base font-semibold text-danger-700 dark:text-danger-200">
          {title}
        </h3>
      )}
      <p className="mt-3 max-w-md text-sm font-medium leading-relaxed text-danger-700 dark:text-danger-200">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="mt-5"
          onClick={onRetry}
          icon={RefreshCw}
        >
          Try again
        </Button>
      )}
    </div>
  );
}

/* =========================================================
   RESPONSIVE MODAL
========================================================= */

export function ResponsiveModal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null || el === panel);

      if (focusable.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);

    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Move focus into the dialog once it has mounted.
    const focusTimer = window.setTimeout(() => panelRef.current?.focus(), 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-ink-950/70"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : 'Dialog'}
            tabIndex={-1}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="safe-bottom relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-elevated outline-none dark:bg-ink-900 sm:max-h-[85vh] sm:rounded-2xl sm:pb-0"
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-ink-800">
              {title ? (
                <h3
                  id={titleId}
                  className="text-base font-semibold text-slate-900 dark:text-ink-50"
                >
                  {title}
                </h3>
              ) : (
                <span className="sr-only">Dialog</span>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="-mr-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-brand-600/60 dark:hover:bg-ink-800 dark:hover:text-ink-200"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              {children}
            </div>
            {footer && (
              <div className="border-t border-slate-100 px-5 py-4 dark:border-ink-800">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* =========================================================
   SEARCH BAR
========================================================= */

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search…',
  icon: Icon = Search,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className={cn('relative', className)}
    >
      <Icon
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-ink-500"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        enterKeyHint="search"
        autoComplete="off"
        className="search-input h-11 pr-4"
      />
    </form>
  );
}

/* =========================================================
   SHAPES (loose backend-compatible provider / service)
========================================================= */

export interface ProviderLike {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  avatar?: string;
  profileImage?: string;
  categories?: string[];
  category?: string;
  location?: string;
  about?: string;
  rating?: number;
  reviewCount?: number;
  completedBookings?: number;
  verified?: boolean;
  status?: string;
  hourlyRate?: number;
  price?: number;
  startingPrice?: number;
  portfolio?: Array<{ image?: string; title?: string }>;
  [key: string]: unknown;
}

export interface ServiceLike {
  _id?: string;
  id?: string;
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  image?: string;
  duration?: string;
  status?: string;
  isActive?: boolean;
  provider?: ProviderLike;
  [key: string]: unknown;
}

export function providerId(p: ProviderLike): string {
  return String(p._id || p.id || '');
}

export function providerName(p: ProviderLike): string {
  return String(p.fullName || p.name || 'Service Provider');
}

export function providerAvatar(p: ProviderLike): string | undefined {
  return (p.avatar || p.profileImage) as string | undefined;
}

export function providerStartingPrice(p: ProviderLike): number | undefined {
  const raw = p.startingPrice ?? p.hourlyRate ?? p.price;
  return typeof raw === 'number' && raw > 0 ? raw : undefined;
}

/* =========================================================
   MARKETPLACE PROVIDER CARD (backend-aware)
========================================================= */

export function MarketplaceProviderCard({
  provider,
  saved = false,
  onSave,
  onBook,
  className,
}: {
  provider: ProviderLike;
  saved?: boolean;
  onSave?: (id: string) => void;
  onBook?: (id: string) => void;
  className?: string;
}) {
  const id = providerId(provider);
  const cover =
    (provider.portfolio?.[0]?.image as string | undefined) ||
    providerAvatar(provider);
  const price = providerStartingPrice(provider);
  const rating = typeof provider.rating === 'number' ? provider.rating : 0;
  const reviewCount =
    typeof provider.reviewCount === 'number' ? provider.reviewCount : 0;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'card-hover group overflow-hidden focus-within:ring-2 focus-within:ring-brand-600/30',
        className
      )}
    >
      <div className="relative h-36 overflow-hidden bg-lavender dark:bg-ink-800">
        {cover ? (
          <img
            src={cover}
            alt={providerName(provider)}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-950 dark:to-brand-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />

        {onSave && (
          <button
            onClick={() => onSave(id)}
            aria-label={saved ? 'Unsave provider' : 'Save provider'}
            aria-pressed={saved}
            className={cn(
              'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur transition focus-visible:ring-2 focus-visible:ring-white/80',
              saved
                ? 'bg-white text-danger-500 shadow-sm'
                : 'bg-slate-900/30 text-white hover:bg-white hover:text-danger-500'
            )}
          >
            <svg
              className="h-4 w-4"
              fill={saved ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
          </button>
        )}

        <div className="absolute inset-x-3 bottom-3 flex items-center gap-2.5">
          <Avatar
            src={providerAvatar(provider)}
            name={providerName(provider)}
            size="sm"
            className="ring-2 ring-white"
          />
          <div className="min-w-0 text-white">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold">{providerName(provider)}</p>
              {provider.verified && (
                <span
                  className="shrink-0 rounded-full bg-white/20 p-0.5 backdrop-blur"
                  role="img"
                  aria-label="Verified provider"
                >
                  <svg
                    className="h-3 w-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 2l2.4 2.4 3.4-.6.6 3.4L20.8 9.6 18.4 12l2.4 2.4-3.4.6-.6 3.4L12 16l-2.4 2.4-3.4-.6-.6-3.4L3.2 11.6 5.6 9.2 3.2 6.8l3.4-.6.6-3.4L12 2z" />
                  </svg>
                </span>
              )}
            </div>
            <p className="truncate text-xs text-white/80">
              {(provider.categories || (provider.category ? [provider.category] : []))
                .filter(Boolean)
                .join(' • ') || 'Service provider'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <StarRating rating={rating} />
            <span className="font-medium text-slate-700 dark:text-ink-300">
              {rating ? rating.toFixed(1) : 'New'}
            </span>
            {reviewCount > 0 && (
              <span className="text-xs text-slate-400">({reviewCount})</span>
            )}
          </div>
          {provider.location && (
            <span className="min-w-0 max-w-[45%] truncate pl-2 text-xs text-slate-400">
              {provider.location}
            </span>
          )}
        </div>

        {provider.about && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-ink-400">
            {provider.about}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-slate-500 dark:text-ink-400">
            {price ? (
              <>
                From{' '}
                <span className="font-bold text-slate-900 dark:text-ink-50">
                  {formatNaira(price)}
                </span>
              </>
            ) : (
              <span className="text-xs font-medium text-slate-400">Price on request</span>
            )}
          </span>
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            to={`/providers/${id}`}
            className="btn-outline btn-sm flex flex-1 items-center justify-center whitespace-nowrap"
          >
            View Profile
          </Link>
          {onBook && (
            <Button
              size="sm"
              className="flex-1 whitespace-nowrap"
              onClick={() => onBook(id)}
            >
              Book Now
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   SERVICE CARD (backend-aware)
========================================================= */

export function ServiceCard({
  service,
  action,
  className,
}: {
  service: ServiceLike;
  action?: ReactNode;
  className?: string;
}) {
  const provider = service.provider;
  const price = typeof service.price === 'number' ? service.price : undefined;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'card-hover group overflow-hidden focus-within:ring-2 focus-within:ring-brand-600/30',
        className
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-lavender dark:bg-ink-800">
        {service.image ? (
          <img
            src={service.image}
            alt={service.title || 'Service'}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-950 dark:to-brand-900" />
        )}
        {service.category && (
          <span className="absolute left-3 top-3 max-w-[calc(100%_-_1.5rem)] truncate rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-brand-700 shadow-xs backdrop-blur dark:bg-ink-900/90 dark:text-brand-300">
            {service.category}
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-ink-50">
          {service.title || 'Service'}
        </h3>

        {provider && (
          <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-slate-500 dark:text-ink-400">
            <Avatar
              src={providerAvatar(provider)}
              name={providerName(provider)}
              size="xs"
            />
            <span className="truncate">{providerName(provider)}</span>
            {provider.verified && <VerifiedBadge />}
          </div>
        )}

        {service.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-ink-400">
            {service.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-slate-500 dark:text-ink-400">
            {price ? (
              <>
                <span className="text-xs">From </span>
                <span className="font-bold text-slate-900 dark:text-ink-50">
                  {formatNaira(price)}
                </span>
              </>
            ) : (
              <span className="text-xs font-medium text-slate-400">Price on request</span>
            )}
          </span>
          {action && <div className="ml-3 shrink-0">{action}</div>}
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   REVIEW CARD
========================================================= */

export function ReviewCard({
  rating,
  comment,
  reviewerName,
  date,
  avatar,
}: {
  rating: number;
  comment?: string;
  reviewerName?: string;
  date?: string;
  avatar?: string;
}) {
  let formattedDate = '';
  if (date) {
    try {
      formattedDate = new Date(date).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      formattedDate = '';
    }
  }

  return (
    <div className="card h-full p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar src={avatar} name={reviewerName || 'Guest'} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-ink-50">
              {reviewerName || 'Guest'}
            </p>
            {formattedDate && (
              <p className="text-xs tabular-nums text-slate-400">
                {formattedDate}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-warning-50 px-2 py-0.5 dark:bg-warning-600/15">
          <Star
            className="h-3 w-3 fill-warning-500 text-warning-500"
            aria-hidden="true"
          />
          <span className="text-xs font-semibold tabular-nums text-warning-700 dark:text-warning-200">
            {Number(rating || 0).toFixed(1)}
          </span>
        </div>
      </div>
      {comment && (
        <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-slate-600 dark:text-ink-300">
          {comment}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   ERROR BOUNDARY (guards card renders against bad API data)
========================================================= */

export class RenderErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('RenderErrorBoundary:', error);
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback || (
          <div
            role="alert"
            className="rounded-xl border border-danger-100 bg-danger-50 p-4 text-xs text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/5 dark:text-danger-200"
          >
            This section failed to render. Please refresh the page.
          </div>
        )
      );
    }
    return this.props.children;
  }
}
