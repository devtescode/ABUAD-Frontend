import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ImageIcon,
  Tag,
  X,
} from "lucide-react";

import { ErrorState } from "@/components/ui";

/* =========================================================
   TYPES
========================================================= */

interface PortfolioItem {
  _id?: string;
  title?: string;
  description?: string;
  image?: string;
  imageUrl?: string;
  images?: string[];
  category?: string;
  tags?: string[];
  link?: string;
  url?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PortfolioTabProps {
  items: PortfolioItem[];
  providerName: string;
  providerImage: string;
  loading: boolean;
  error: string;
  onRetry: () => void;
}

interface CategoryFilter {
  label: string;
  count: number;
}

interface ProjectImageProps {
  src: string;
  alt: string;
  className?: string;
  variant?: "card" | "lightbox";
  eager?: boolean;
}

/* =========================================================
   HELPERS
========================================================= */

const getImages = (item: PortfolioItem): string[] => {
  const images: string[] = [];

  const addImage = (value?: string) => {
    const image = value?.trim();

    if (image && !images.includes(image)) {
      images.push(image);
    }
  };

  addImage(item.image);
  addImage(item.imageUrl);
  item.images?.forEach(addImage);

  return images;
};

const cleanTags = (tags?: string[]) =>
  (tags || [])
    .map((tag) => tag?.trim())
    .filter((tag): tag is string => Boolean(tag));

const formatDate = (value?: string) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "P";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const normalizeUrl = (value?: string) => {
  const url = value?.trim();

  if (!url) {
    return "";
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `https://${url}`;
};

/* =========================================================
   SMALL PRESENTATIONAL PIECES
========================================================= */

function ProviderAvatar({
  image,
  name,
  className = "h-10 w-10",
}: {
  image: string;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [image]);

  if (!image?.trim() || failed) {
    return (
      <div
        className={`flex ${className} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-primary-500 text-xs font-bold text-white ring-2 ring-white dark:ring-ink-800`}
        aria-hidden="true"
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={name}
      onError={() => setFailed(true)}
      className={`${className} shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-ink-800`}
    />
  );
}

function ProjectImage({
  src,
  alt,
  className = "",
  variant = "card",
  eager = false,
}: ProjectImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const isLightbox = variant === "lightbox";

  if (!src || failed) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center ${
          isLightbox
            ? "bg-ink-950 text-ink-600"
            : "bg-gradient-to-br from-ink-100 via-white to-brand-50 text-ink-400 dark:from-ink-800 dark:via-ink-900 dark:to-brand-950/30 dark:text-ink-600"
        }`}
      >
        <ImageIcon
          className={isLightbox ? "h-12 w-12" : "h-9 w-9"}
          aria-hidden="true"
        />

        <span
          className={`mt-3 text-xs font-semibold ${
            isLightbox ? "text-ink-500" : "text-ink-400 dark:text-ink-500"
          }`}
        >
          No image available
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-12 text-center shadow-card dark:border-ink-700 dark:bg-ink-900/60 sm:px-10">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 dark:bg-brand-950/40 dark:text-brand-300 dark:ring-brand-900/60">
        {icon}
      </div>

      <h3 className="mt-5 text-base font-bold text-ink-900 dark:text-white">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-ink-500 dark:text-ink-400">
        {description}
      </p>

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function PortfolioSkeleton() {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="animate-pulse space-y-6"
    >
      <span className="sr-only">Loading provider portfolio…</span>

      <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card dark:border-ink-800 dark:bg-ink-900 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 shrink-0 rounded-full bg-ink-100 dark:bg-ink-800" />

            <div className="space-y-3">
              <div className="h-6 w-40 rounded bg-ink-100 dark:bg-ink-800" />

              <div className="h-3.5 w-64 max-w-full rounded bg-ink-100 dark:bg-ink-800" />

              <div className="h-5 w-24 rounded-full bg-ink-100 dark:bg-ink-800" />
            </div>
          </div>

          <div className="h-10 w-32 shrink-0 rounded-full bg-ink-100 dark:bg-ink-800" />
        </div>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-9 w-24 shrink-0 rounded-full bg-ink-100 dark:bg-ink-800"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={`overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card dark:border-ink-800 dark:bg-ink-900 ${
              index === 0 ? "lg:col-span-2" : ""
            }`}
          >
            <div
              className={`w-full bg-ink-100 dark:bg-ink-800 ${
                index === 0 ? "aspect-[4/3] sm:aspect-[16/10]" : "aspect-[5/4]"
              }`}
            />

            <div className="space-y-3 p-5">
              <div className="h-5 w-2/3 rounded bg-ink-100 dark:bg-ink-800" />

              <div className="h-4 w-full rounded bg-ink-100 dark:bg-ink-800" />

              <div className="h-4 w-4/5 rounded bg-ink-100 dark:bg-ink-800" />

              <div className="flex justify-between pt-2">
                <div className="h-4 w-20 rounded bg-ink-100 dark:bg-ink-800" />

                <div className="h-8 w-24 rounded-xl bg-ink-100 dark:bg-ink-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function PortfolioTab({
  items,
  providerName,
  providerImage,
  loading,
  error,
  onRetry,
}: PortfolioTabProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const categories = useMemo<CategoryFilter[]>(() => {
    const counts = new Map<string, number>();

    items.forEach((item) => {
      const category = item.category?.trim();

      if (!category) {
        return;
      }

      counts.set(category, (counts.get(category) || 0) + 1);
    });

    return [
      { label: "All", count: items.length },
      ...Array.from(counts, ([label, count]) => ({ label, count })),
    ];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeCategory === "All") {
      return items;
    }

    return items.filter(
      (item) => item.category?.trim() === activeCategory
    );
  }, [items, activeCategory]);

  const selectedItem =
    selectedIndex !== null
      ? filteredItems[selectedIndex] || null
      : null;

  const selectedImages = selectedItem ? getImages(selectedItem) : [];
  const selectedImage = selectedImages[0] || "";
  const selectedPosition =
    selectedIndex !== null ? selectedIndex + 1 : 0;
  const selectedDate = formatDate(
    selectedItem?.createdAt || selectedItem?.updatedAt
  );
  const selectedTags = cleanTags(selectedItem?.tags);
  const projectLink = normalizeUrl(
    selectedItem?.link || selectedItem?.url
  );
  const isLightboxOpen = selectedItem !== null;

  const closeLightbox = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const step = useCallback(
    (direction: number) => {
      if (filteredItems.length === 0) {
        return;
      }

      setSelectedIndex((current) => {
        if (current === null) {
          return 0;
        }

        return (
          (current + direction + filteredItems.length) %
          filteredItems.length
        );
      });
    },
    [filteredItems.length]
  );

  useEffect(() => {
    if (
      activeCategory !== "All" &&
      !categories.some((category) => category.label === activeCategory)
    ) {
      setActiveCategory("All");
      setSelectedIndex(null);
    }
  }, [activeCategory, categories]);

  useEffect(() => {
    if (selectedIndex !== null && selectedIndex >= filteredItems.length) {
      setSelectedIndex(null);
    }
  }, [selectedIndex, filteredItems.length]);

  useEffect(() => {
    if (loading || error || items.length === 0) {
      setSelectedIndex(null);
    }
  }, [loading, error, items.length]);

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isLightboxOpen]);

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen, closeLightbox, step]);

  const handleCategoryChange = (label: string) => {
    setActiveCategory(label);
    setSelectedIndex(null);
  };

  if (loading) {
    return <PortfolioSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ImageIcon className="h-6 w-6" aria-hidden="true" />}
        title="No portfolio yet"
        description={`${providerName} has not shared any work yet. Completed projects will appear here once they are added.`}
      />
    );
  }

  return (
    <section aria-labelledby="portfolio-heading" className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-ink-100 bg-white p-5 shadow-card dark:border-ink-800 dark:bg-ink-900 sm:p-6">
        <div
          className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-600 via-primary-400 to-accent-400"
          aria-hidden="true"
        />

        <div className="flex flex-col gap-5 pl-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">
              Portfolio
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2
                id="portfolio-heading"
                className="text-xl font-extrabold tracking-tight text-ink-900 dark:text-white sm:text-2xl"
              >
                Selected work
              </h2>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-bold text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-success-500"
                  aria-hidden="true"
                />

                {items.length} {items.length === 1 ? "project" : "projects"}
              </span>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500 dark:text-ink-400">
              A closer look at the work {providerName} has delivered, from
              first idea to finished result.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-full border border-ink-100 bg-ink-50/70 py-1.5 pl-1.5 pr-4 dark:border-ink-800 dark:bg-ink-950/50">
            <ProviderAvatar
              image={providerImage}
              name={providerName}
              className="h-9 w-9"
            />

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                Curated by
              </p>

              <p className="truncate text-sm font-bold text-ink-900 dark:text-white">
                {providerName}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div
        className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
        role="group"
        aria-label="Filter portfolio by category"
      >
        {categories.map((category) => {
          const active = activeCategory === category.label;

          return (
            <button
              key={category.label}
              type="button"
              onClick={() => handleCategoryChange(category.label)}
              aria-pressed={active}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 ${
                active
                  ? "border-brand-600 bg-brand-600 text-white shadow-soft dark:border-brand-500 dark:bg-brand-500"
                  : "border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300 dark:hover:border-brand-700 dark:hover:bg-brand-950/30 dark:hover:text-brand-200"
              }`}
            >
              {category.label !== "All" && (
                <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              )}

              <span>{category.label}</span>

              <span
                className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  active
                    ? "bg-white/20 text-white"
                    : "bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400"
                }`}
              >
                {category.count}
              </span>
            </button>
          );
        })}
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<Tag className="h-6 w-6" aria-hidden="true" />}
          title="No work in this category"
          description={`There are no portfolio projects from ${providerName} under "${activeCategory}".`}
          action={
            <button
              type="button"
              onClick={() => handleCategoryChange("All")}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-300 dark:bg-brand-500 dark:hover:bg-brand-400"
            >
              Reset filter
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item, index) => {
              const images = getImages(item);
              const cover = images[0] || "";
              const tags = cleanTags(item.tags);
              const date = formatDate(item.createdAt || item.updatedAt);
              const featured = index === 0;
              const title = item.title || "Portfolio project";

              return (
                <motion.article
                  key={item._id || `${item.title || "project"}-${index}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: Math.min(index * 0.05, 0.3),
                  }}
                  className={`group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-card-hover focus-within:border-brand-300 dark:border-ink-800 dark:bg-ink-900 dark:hover:border-brand-800 ${
                    featured ? "lg:col-span-2" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    aria-label={`Open ${title} in image viewer`}
                    className={`relative block w-full shrink-0 overflow-hidden bg-ink-100 text-left dark:bg-ink-800 ${
                      featured
                        ? "aspect-[4/3] sm:aspect-[16/10]"
                        : "aspect-[5/4]"
                    }`}
                  >
                    <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.06]">
                      <ProjectImage
                        src={cover}
                        alt={title}
                      />
                    </div>

                    <div
                      className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/10 to-transparent opacity-75 transition-opacity duration-300 group-hover:opacity-95"
                      aria-hidden="true"
                    />

                    {item.category?.trim() && (
                      <span className="absolute left-4 top-4 inline-flex max-w-[calc(100%-5rem)] items-center gap-1.5 truncate rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-bold text-ink-800 shadow-card backdrop-blur-md dark:bg-ink-900/90 dark:text-white">
                        <Tag
                          className="h-3 w-3 shrink-0"
                          aria-hidden="true"
                        />

                        <span className="truncate">{item.category.trim()}</span>
                      </span>
                    )}

                    <span
                      className="absolute right-4 top-4 flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                      aria-hidden="true"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </span>

                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <h3 className="line-clamp-2 text-base font-extrabold tracking-tight text-white sm:text-lg">
                        {title}
                      </h3>

                      <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-white/90">
                        View project
                        <ArrowRight
                          className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                  </button>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="line-clamp-3 text-sm leading-6 text-ink-500 dark:text-ink-400">
                      {item.description ||
                        "No description was provided for this project."}
                    </p>

                    {tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-ink-50 px-2.5 py-1 text-[11px] font-medium text-ink-500 dark:bg-ink-800 dark:text-ink-300"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-ink-100 pt-4 dark:border-ink-800">
                      <div className="flex min-w-0 items-center gap-2 text-xs text-ink-400">
                        {date ? (
                          <>
                            <Calendar
                              className="h-3.5 w-3.5 shrink-0"
                              aria-hidden="true"
                            />

                            <span className="truncate">{date}</span>
                          </>
                        ) : (
                          <span>Portfolio work</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedIndex(index)}
                        aria-label={`View details for ${title}`}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700 transition hover:bg-brand-100 focus-visible:ring-2 focus-visible:ring-brand-300 dark:bg-brand-950/40 dark:text-brand-200 dark:hover:bg-brand-900/50"
                      >
                        View project
                        <ArrowRight
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-3 pt-1 text-xs font-medium text-ink-400">
            <span
              className="h-px w-8 bg-ink-200 dark:bg-ink-700"
              aria-hidden="true"
            />

            <span>
              Showing {filteredItems.length} of {items.length}{" "}
              {items.length === 1 ? "project" : "projects"}
            </span>

            <span
              className="h-px w-8 bg-ink-200 dark:bg-ink-700"
              aria-hidden="true"
            />
          </div>
        </>
      )}

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            key="portfolio-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeLightbox}
            role="dialog"
            aria-modal="true"
            aria-label={`${
              selectedItem.title || "Portfolio project"
            } image viewer`}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/85 p-3 backdrop-blur-sm sm:p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
              className="relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-elevated dark:bg-ink-900 sm:max-h-[calc(100vh-3rem)] lg:flex-row"
            >
              <button
                type="button"
                onClick={closeLightbox}
                autoFocus
                aria-label="Close image viewer"
                className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-ink-950/55 text-white backdrop-blur-md transition hover:bg-ink-950/80 focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>

              <div className="relative min-h-[240px] flex-1 bg-ink-950 sm:min-h-[340px] lg:min-h-[520px]">
                <ProjectImage
                  src={selectedImage}
                  alt={selectedItem.title || `${providerName} portfolio project`}
                  variant="lightbox"
                  eager
                />

                <div
                  className="absolute inset-0 bg-gradient-to-t from-ink-950/45 via-transparent to-ink-950/25"
                  aria-hidden="true"
                />

                <div
                  className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-ink-950/65 px-3 py-1.5 text-[11px] font-bold tracking-wide text-white backdrop-blur-md"
                  aria-label={`Image ${selectedPosition} of ${filteredItems.length}`}
                >
                  <span className="text-brand-300">
                    {String(selectedPosition).padStart(2, "0")}
                  </span>

                  <span className="text-white/40">/</span>

                  <span>
                    {String(filteredItems.length).padStart(2, "0")}
                  </span>
                </div>

                {filteredItems.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => step(-1)}
                      aria-label="Previous image"
                      className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink-950/55 text-white backdrop-blur-md transition hover:bg-ink-950/80 focus-visible:ring-2 focus-visible:ring-white/70"
                    >
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => step(1)}
                      aria-label="Next image"
                      className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink-950/55 text-white backdrop-blur-md transition hover:bg-ink-950/80 focus-visible:ring-2 focus-visible:ring-white/70"
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </>
                )}

                <div
                  className="absolute bottom-4 left-1/2 flex max-w-[70%] flex-wrap justify-center gap-1.5 -translate-x-1/2"
                  aria-hidden="true"
                >
                  {filteredItems.map((_, dotIndex) => (
                    <span
                      key={dotIndex}
                      className={`h-1.5 rounded-full transition-all ${
                        dotIndex === selectedIndex
                          ? "w-5 bg-brand-400"
                          : "w-1.5 bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <aside className="max-h-[42vh] w-full overflow-y-auto border-t border-ink-100 dark:border-ink-800 lg:max-h-none lg:w-[380px] lg:border-l lg:border-t-0">
                <div className="p-6 sm:p-7">
                  {selectedItem.category?.trim() && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 dark:bg-brand-950/50 dark:text-brand-200">
                      <Tag
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />

                      {selectedItem.category.trim()}
                    </span>
                  )}

                  <h3 className="mt-4 text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                    {selectedItem.title || "Portfolio project"}
                  </h3>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-400">
                    {selectedDate && (
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />

                        {selectedDate}
                      </span>
                    )}

                    {selectedImages.length > 1 && (
                      <span className="inline-flex items-center gap-1.5">
                        <ImageIcon
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />

                        {selectedImages.length} images
                      </span>
                    )}
                  </div>

                  <div className="my-6 h-px bg-ink-100 dark:bg-ink-800" />

                  <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-400">
                    About this work
                  </h4>

                  <p className="mt-2 text-sm leading-7 text-ink-600 dark:text-ink-300">
                    {selectedItem.description ||
                      "The provider has not added a description for this portfolio project."}
                  </p>

                  {selectedTags.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-400">
                        Tags
                      </h4>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedTags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-ink-50 px-3 py-1.5 text-xs font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {projectLink && (
                    <a
                      href={projectLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-300 dark:bg-brand-500 dark:hover:bg-brand-400"
                    >
                      View project link
                      <ExternalLink
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    </a>
                  )}

                  <div className="mt-6 rounded-2xl border border-ink-100 bg-ink-50/70 p-4 dark:border-ink-800 dark:bg-ink-950/50">
                    <div className="flex items-center gap-3">
                      <ProviderAvatar
                        image={providerImage}
                        name={providerName}
                        className="h-10 w-10"
                      />

                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
                          Created by
                        </p>

                        <p className="truncate text-sm font-bold text-ink-900 dark:text-white">
                          {providerName}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
