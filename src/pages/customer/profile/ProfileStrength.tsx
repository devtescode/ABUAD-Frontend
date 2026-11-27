/**
 * Customer profile completion checklist.
 *
 * Presentational only: the parent owns every field value, so this card simply
 * derives the four completion flags and animates the progress indicator.
 */
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';

import { Card, cn } from '@/components/ui';

export function ProfileStrength(props: {
    name: string;
    about: string;
    location: string;
    hasAvatar: boolean;
}) {
    const { name, about, location, hasAvatar } = props;

    const checklist = [
        { label: 'Add your full name', complete: name.trim().length > 0 },
        { label: 'Write a short bio', complete: about.trim().length >= 20 },
        { label: 'Add your location', complete: location.trim().length > 0 },
        { label: 'Upload a profile photo', complete: hasAvatar },
    ];

    const completedCount = checklist.filter((item) => item.complete).length;
    const progress = (completedCount / checklist.length) * 100;

    return (
        <Card className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
                <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lavender text-brand-600 ring-1 ring-brand-100 dark:bg-brand-950/70 dark:text-lime-300 dark:ring-brand-900/60"
                >
                    <Sparkles className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                    <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-ink-50 sm:text-lg">
                        Profile strength
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-ink-400 sm:text-sm">
                        Complete these steps to build trust with providers.
                    </p>
                </div>
            </div>

            <div className="mt-5">
                <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-600 dark:text-ink-300">
                        Your progress
                    </span>
                    <span
                        aria-live="polite"
                        className="text-xs font-bold tabular-nums text-brand-600 dark:text-lime-300"
                    >
                        {completedCount} of {checklist.length} complete
                    </span>
                </div>

                <div
                    role="progressbar"
                    aria-label="Profile completeness"
                    aria-valuemin={0}
                    aria-valuemax={checklist.length}
                    aria-valuenow={completedCount}
                    className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-ink-800"
                >
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.55, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-lime-400 to-lime-300 shadow-[0_0_10px_rgba(198,243,107,0.45)]"
                    />
                </div>
            </div>

            <ul className="mt-5 space-y-3">
                {checklist.map((item) => (
                    <li key={item.label} className="flex items-start gap-2.5">
                        {item.complete ? (
                            <CheckCircle2
                                aria-hidden="true"
                                className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-lime-300"
                            />
                        ) : (
                            <Circle
                                aria-hidden="true"
                                className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600"
                            />
                        )}
                        <span
                            className={cn(
                                'text-sm leading-5',
                                item.complete
                                    ? 'font-medium text-slate-700 dark:text-ink-200'
                                    : 'text-slate-500 dark:text-ink-400'
                            )}
                        >
                            {item.label}
                        </span>
                        {item.complete && <span className="sr-only">Completed</span>}
                    </li>
                ))}
            </ul>
        </Card>
    );
}
