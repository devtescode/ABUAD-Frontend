/**
 * Customer profile hero: identity, avatar preview and photo drop zone.
 *
 * The cover keeps the forest-green brand gradient while lime accents draw the
 * eye to the two available photo actions. All drag/drop state is owned by the
 * parent so this component stays purely presentational.
 */
import { useEffect, useState } from 'react';
import type * as React from 'react';

import { motion } from 'framer-motion';
import {
  AlertCircle,
  Camera,
  ImageIcon,
  Mail,
  UploadCloud,
  X,
} from 'lucide-react';

import { cn } from '@/components/ui';
import { getInitials } from './profileTypes';

export type ProfileHeroProps = {
  name: string;
  email?: string;
  hasAvatar: boolean;
  previewUrl?: string | null;
  selectedFileName?: string | null;
  error?: string;
  isDragging: boolean;
  onPickFile: () => void;
  onDrop: (e: React.DragEvent<HTMLElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLElement>) => void;
  onRemoveFile: () => void;
};

export function ProfileHero({
  name,
  email,
  hasAvatar,
  previewUrl,
  selectedFileName,
  error,
  isDragging,
  onPickFile,
  onDrop,
  onDragOver,
  onDragLeave,
  onRemoveFile,
}: ProfileHeroProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const displayName = name?.trim() || 'Your name';
  const showImage = Boolean(previewUrl) && !imageFailed;
  const hasNewPhoto = Boolean(selectedFileName);

  const photoStatus = hasNewPhoto
    ? 'New photo selected'
    : hasAvatar
      ? 'Photo Uploaded'
      : 'No photo yet';

  useEffect(() => {
    setImageFailed(false);
  }, [previewUrl]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white shadow-soft dark:from-brand-800 dark:via-brand-900 dark:to-brand-950"
    >
      {/* Decorative lime glow keeps the dark cover feeling alive. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-lime-300/25 blur-3xl dark:bg-lime-300/15" />
        <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-lime-400/10 blur-3xl" />
        <div className="absolute right-[18%] top-7 h-16 w-16 rounded-full border border-lime-300/25" />
        <div className="absolute bottom-9 right-[9%] h-10 w-10 rounded-full bg-lime-300/10" />
      </div>

      <div className="relative h-24 sm:h-32">
        <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/85 backdrop-blur sm:left-7">
          Customer profile
        </span>
      </div>

      <div className="relative -mt-14 px-5 pb-5 sm:-mt-16 sm:px-7 sm:pb-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
            <div className="relative h-28 w-28 shrink-0">
              <div className="absolute inset-0 rounded-full bg-white p-1 shadow-elevated dark:bg-ink-950 dark:ring-1 dark:ring-white/10">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-brand-100 text-2xl font-bold text-brand-700 ring-2 ring-white/60 dark:bg-brand-950 dark:text-lime-200 dark:ring-white/10">
                  {showImage ? (
                    <img
                      src={previewUrl ?? undefined}
                      alt={`${displayName}'s profile picture`}
                      draggable={false}
                      loading="eager"
                      decoding="async"
                      className="h-full w-full object-cover"
                      onError={() => setImageFailed(true)}
                    />
                  ) : (
                    <span aria-hidden="true">{getInitials(displayName)}</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onPickFile}
                aria-label="Change profile picture"
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-lime-300 text-brand-900 shadow-soft ring-4 ring-brand-800 transition duration-200 hover:-translate-y-0.5 hover:bg-lime-200 active:translate-y-0 active:scale-95 focus-visible:ring-4 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-800 dark:ring-ink-950 dark:focus-visible:ring-offset-ink-950"
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="min-w-0 pb-1 sm:pb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-300/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-lime-200 ring-1 ring-inset ring-lime-300/30">
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    hasNewPhoto || hasAvatar ? 'bg-lime-300' : 'bg-white/50'
                  )}
                />
                {photoStatus}
              </span>

              <h2 className="mt-2 truncate text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {displayName}
              </h2>

              {email ? (
                <p className="mt-1 flex min-w-0 items-center gap-2 text-sm text-white/75">
                  <Mail className="h-4 w-4 shrink-0 text-lime-300/80" aria-hidden="true" />
                  <span className="truncate">{email}</span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-white/60">
                  Keep your profile up to date.
                </p>
              )}
            </div>
          </div>

          <p className="max-w-xs text-xs leading-5 text-white/60 sm:pb-2 sm:text-right">
            A familiar face makes every booking feel more personal.
          </p>
        </div>

        <div
          role="group"
          aria-label="Profile photo drop zone"
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={cn(
            'mt-6 rounded-2xl border border-dashed px-4 py-4 transition-colors duration-200 sm:px-5',
            isDragging
              ? 'border-lime-300 bg-lime-300/15'
              : 'border-white/25 bg-white/10 hover:border-lime-300/60 hover:bg-white/[0.14] dark:border-white/15 dark:bg-black/20 dark:hover:bg-black/30'
          )}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime-300/20 text-lime-200 ring-1 ring-lime-300/30">
                <UploadCloud className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {isDragging ? 'Drop your photo here' : 'Drag & drop your photo here'}
                </p>
                <p className="mt-0.5 text-xs text-white/60">
                  JPG, PNG or WebP · Max 5MB
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onPickFile}
              className="btn h-10 shrink-0 bg-lime-300 px-4 text-xs font-bold text-brand-900 shadow-sm hover:bg-lime-200 active:bg-lime-400 focus-visible:ring-lime-200/80 focus-visible:ring-offset-brand-800 dark:hover:bg-lime-200 dark:focus-visible:ring-offset-brand-900"
            >
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              Choose photo
            </button>
          </div>

          {(selectedFileName || error) && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              {selectedFileName && (
                <span
                  title={selectedFileName}
                  className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 py-1 pl-3 pr-1.5 text-xs text-white/90 backdrop-blur dark:bg-black/20"
                >
                  <ImageIcon className="h-3.5 w-3.5 shrink-0 text-lime-300" aria-hidden="true" />
                  <span className="max-w-[min(60vw,18rem)] truncate">{selectedFileName}</span>
                  <button
                    type="button"
                    onClick={onRemoveFile}
                    aria-label="Remove selected photo"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/70 transition hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-lime-300 dark:hover:bg-white/10"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </span>
              )}

              {error && (
                <p
                  role="alert"
                  className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-danger-100 dark:text-danger-200"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="break-words">{error}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
