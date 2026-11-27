/**
 * Customer profile details form.
 *
 * Purely presentational: all field values, validation and persistence live in
 * the parent page. The card follows the shared Servicely field styles so it
 * stays consistent with the rest of the dashboard in both themes.
 */
import { useId } from 'react';

import {
    AlertCircle,
    CheckCircle2,
    GraduationCap,
    Mail,
    UserRound,
} from 'lucide-react';

import { Button, Card, cn } from '@/components/ui';
import {
    ABOUT_MAX_LENGTH,
    LOCATION_MAX_LENGTH,
    NAME_MAX_LENGTH,
} from './profileTypes';

export type ProfileFormProps = {
    values: import('./profileTypes').ProfileFormValues;
    onChange: (field: keyof import('./profileTypes').ProfileFormValues, value: string) => void;
    onSubmit: () => void;
    saving: boolean;
    dirty: boolean;
    error?: string;
    success?: string;
    email?: string;
    matricNo?: string;
};

export function ProfileForm({
    values,
    onChange,
    onSubmit,
    saving,
    dirty,
    error,
    success,
    email,
    matricNo,
}: ProfileFormProps) {
    const uid = useId();
    const titleId = `${uid}-title`;
    const nameId = `${uid}-name`;
    const locationId = `${uid}-location`;
    const emailId = `${uid}-email`;
    const matricId = `${uid}-matric`;
    const aboutId = `${uid}-about`;
    const aboutCountId = `${uid}-about-count`;
    const aboutHintId = `${uid}-about-hint`;

    return (
        <Card className="p-5 sm:p-6">
            <form
                aria-labelledby={titleId}
                aria-busy={saving || undefined}
                onSubmit={(e) => {
                    e.preventDefault();
                    onSubmit();
                }}
            >
                <div className="flex items-start gap-3 border-b border-slate-100 pb-4 dark:border-ink-800">
                    <span
                        aria-hidden="true"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lavender text-brand-600 ring-1 ring-brand-100 dark:bg-brand-950/70 dark:text-lime-300 dark:ring-brand-900/60"
                    >
                        <UserRound className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <h2
                            id={titleId}
                            className="text-base font-bold tracking-tight text-slate-900 dark:text-ink-50 sm:text-lg"
                        >
                            Personal information
                        </h2>
                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-ink-400 sm:text-sm">
                            Keep your details up to date so providers know who they’re meeting.
                        </p>
                    </div>
                </div>

                {(error || success) && (
                    <div className="mt-5 space-y-3">
                        {error && (
                            <div
                                role="alert"
                                className="flex items-start gap-2.5 rounded-xl border border-danger-100 bg-danger-50/80 px-3.5 py-3 text-sm font-medium text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/10 dark:text-danger-200"
                            >
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                                <span className="min-w-0 break-words">{error}</span>
                            </div>
                        )}

                        {success && (
                            <div
                                role="status"
                                className="flex items-start gap-2.5 rounded-xl border border-success-100 bg-success-50/80 px-3.5 py-3 text-sm font-medium text-success-700 dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-200"
                            >
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                                <span className="min-w-0 break-words">{success}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-5 grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
                    <div className="min-w-0">
                        <label htmlFor={nameId} className="label">
                            Full name
                        </label>
                        <input
                            id={nameId}
                            name="name"
                            type="text"
                            value={values.name}
                            onChange={(e) => onChange('name', e.target.value)}
                            placeholder="Enter your full name"
                            autoComplete="name"
                            maxLength={NAME_MAX_LENGTH}
                            className="input"
                        />
                        <p className="mt-1.5 text-xs text-slate-400 dark:text-ink-500">
                            This is the name providers will see.
                        </p>
                    </div>

                    <div className="min-w-0">
                        <label htmlFor={locationId} className="label">
                            Location
                        </label>
                        <input
                            id={locationId}
                            name="location"
                            type="text"
                            value={values.location}
                            onChange={(e) => onChange('location', e.target.value)}
                            placeholder="e.g. Abeokuta, Ogun State"
                            autoComplete="address-level2"
                            maxLength={LOCATION_MAX_LENGTH}
                            className="input"
                        />
                        <p className="mt-1.5 text-xs text-slate-400 dark:text-ink-500">
                            Helps providers understand where you are.
                        </p>
                    </div>

                    <div className="min-w-0">
                        <label htmlFor={emailId} className="label">
                            Email address
                        </label>
                        <input
                            id={emailId}
                            name="email"
                            type="email"
                            value={email ?? ''}
                            placeholder="Not available"
                            autoComplete="email"
                            disabled
                            readOnly
                            className="input cursor-not-allowed"
                        />
                        <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-ink-500">
                            <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
                            Your email can’t be changed here.
                        </p>
                    </div>

                    <div className="min-w-0">
                        <label htmlFor={matricId} className="label">
                            Matric number
                        </label>
                        <input
                            id={matricId}
                            name="matricNo"
                            type="text"
                            value={matricNo ?? ''}
                            placeholder="Not available"
                            disabled
                            readOnly
                            className="input cursor-not-allowed"
                        />
                        <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-ink-500">
                            <GraduationCap className="h-3 w-3 shrink-0" aria-hidden="true" />
                            Managed by your institution.
                        </p>
                    </div>

                    <div className="min-w-0 sm:col-span-2">
                        <div className="flex items-baseline justify-between gap-3">
                            <label htmlFor={aboutId} className="label">
                                About you
                            </label>
                            <span
                                id={aboutCountId}
                                aria-live="polite"
                                className={cn(
                                    'mb-1.5 text-xs font-medium tabular-nums',
                                    values.about.length >= ABOUT_MAX_LENGTH
                                        ? 'text-warning-600 dark:text-warning-200'
                                        : 'text-slate-400 dark:text-ink-500'
                                )}
                            >
                                {values.about.length}/{ABOUT_MAX_LENGTH}
                            </span>
                        </div>
                        <textarea
                            id={aboutId}
                            name="about"
                            value={values.about}
                            onChange={(e) => onChange('about', e.target.value)}
                            rows={4}
                            maxLength={ABOUT_MAX_LENGTH}
                            placeholder="Tell providers a little about yourself…"
                            aria-describedby={`${aboutHintId} ${aboutCountId}`}
                            className="input h-auto min-h-[132px] resize-y py-3 leading-relaxed"
                        />
                        <p
                            id={aboutHintId}
                            className="mt-1.5 text-xs leading-5 text-slate-400 dark:text-ink-500"
                        >
                            A short introduction helps build trust before a booking.
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 dark:border-ink-800 sm:flex-row sm:items-center sm:justify-between">
                    <p
                        aria-live="polite"
                        className={cn(
                            'inline-flex items-center gap-2 text-xs font-medium',
                            dirty
                                ? 'text-warning-700 dark:text-warning-200'
                                : 'text-slate-500 dark:text-ink-400'
                        )}
                    >
                        <span
                            aria-hidden="true"
                            className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                dirty ? 'bg-warning-500' : 'bg-success-500'
                            )}
                        />
                        {dirty ? 'Unsaved changes' : 'All changes saved'}
                    </p>
                    <Button
                        type="submit"
                        loading={saving}
                        icon={CheckCircle2}
                        className="w-full sm:w-auto"
                    >
                        {saving ? 'Saving…' : 'Save changes'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
