import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    AlertCircle,
    ArrowLeft,
    Camera,
    CheckCircle2,
    ChevronDown,
    Clock,
    Eye,
    Image as ImageIcon,
    Info,
    Plus,
    ShieldCheck,
    Tag,
    Upload,
    Wallet,
    X,
} from 'lucide-react';
import { DashboardLayout, DashboardHeader } from '@/components/DashboardLayout';
import { providerNavItems } from '@/data/providerNavItems';
import { Badge, Button, cn } from '@/components/ui';
import { useCreateService } from '@/hooks/queries';
import { getApiErrorMessage } from '@/lib/api';
import { formatNaira } from '@/data/mockData';

const categories = [
    'Photography',
    'Videography',
    'Graphic Design',
    'Makeup',
];

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface ServiceFormState {
    title: string;
    category: string;
    price: string;
    duration: string;
    description: string;
}

type FieldErrors = Partial<
    Record<'title' | 'price' | 'duration' | 'description' | 'image', string>
>;

const EMPTY_FORM: ServiceFormState = {
    title: '',
    category: 'Photography',
    price: '',
    duration: '',
    description: '',
};

const helperTextClass = 'mt-1.5 text-xs leading-5 text-slate-400 dark:text-ink-500';
const fieldErrorClass =
    'mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger-600 dark:text-danger-200';

export function ProviderAddService() {

    const [formData, setFormData] = useState<ServiceFormState>(EMPTY_FORM);

    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const createService = useCreateService();
    const isSubmitting = createService.isPending;

    // Keep feedback visible long enough to be read, then dismiss it.
    useEffect(() => {
        if (!error && !success) return;

        const timeoutId = window.setTimeout(() => {
            setError('');
            setSuccess('');
        }, 15_000);

        return () => window.clearTimeout(timeoutId);
    }, [error, success]);

    // Release the browser object URL when the preview is replaced/unmounted.
    useEffect(() => {
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
        };
    }, [imagePreview]);

    const clearFieldError = (field: keyof FieldErrors) => {
        setFieldErrors((prev) => {
            if (!prev[field]) return prev;

            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        clearFieldError(name as keyof FieldErrors);
    };

    const applyImageFile = (file?: File | null) => {
        if (!file) return;

        // Only allow images
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file.');
            return;
        }

        // 5MB limit
        if (file.size > MAX_IMAGE_BYTES) {
            setError('Image size must be less than 5MB.');
            return;
        }

        setError('');
        clearFieldError('image');
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleImageChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        applyImageFile(e.target.files?.[0]);

        // Allow selecting the same file again after removing it.
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        setIsDragging(false);

        if (isSubmitting) return;

        applyImageFile(e.dataTransfer.files?.[0]);
    };

    const removeImage = () => {
        setImage(null);
        setImagePreview('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const openFilePicker = () => {
        if (!isSubmitting) fileInputRef.current?.click();
    };

    const validate = (): FieldErrors => {
        const next: FieldErrors = {};

        if (!formData.title.trim()) {
            next.title = 'Please enter a service title.';
        }

        if (!formData.price || Number(formData.price) <= 0) {
            next.price = 'Please enter a valid price.';
        }

        if (!formData.duration.trim()) {
            next.duration = 'Please enter the service duration.';
        }

        if (!formData.description.trim()) {
            next.description = 'Please describe your service.';
        }

        if (!image) {
            next.image = 'Please upload a service image.';
        }

        return next;
    };

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        setError('');
        setSuccess('');

        // Validate every field once so the user can fix them together.
        const nextErrors = validate();
        const firstError = Object.values(nextErrors)[0];

        if (firstError) {
            setFieldErrors(nextErrors);
            setError(firstError);
            return;
        }

        // Make sure an image was selected (also narrows the type below).
        if (!image) {
            const message = 'Please upload a service image.';
            setFieldErrors((prev) => ({ ...prev, image: message }));
            setError(message);
            return;
        }

        const serviceImage = image;

        const token = sessionStorage.getItem('servicely_token');

        if (!token) {
            setError('Your session has expired. Please log in again.');
            return;
        }

        /*
         * FormData is used because we are sending
         * both normal fields and an image file.
         */
        const data = new FormData();

        data.append('title', formData.title.trim());
        data.append('category', formData.category);
        data.append('price', formData.price);
        data.append('duration', formData.duration.trim());
        data.append('description', formData.description.trim());
        // New listings are live by default; an admin can suspend them later.
        // data.append('status', 'active');

        data.append('image', serviceImage);

        try {
            const result = await createService.mutateAsync(data);

            setSuccess(
                result?.message ||
                'Service created successfully!'
            );

            // Keep the confirmation visible, but prepare a clean form for
            // the provider's next service listing.
            setFormData(EMPTY_FORM);
            setFieldErrors({});
            setImage(null);
            setImagePreview('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            setError(getApiErrorMessage(err));
        }
    };

    const checklist = [
        { label: 'Service title', done: Boolean(formData.title.trim()) },
        {
            label: 'Starting price',
            done: Boolean(formData.price) && Number(formData.price) > 0,
        },
        { label: 'Duration', done: Boolean(formData.duration.trim()) },
        { label: 'Description', done: Boolean(formData.description.trim()) },
        { label: 'Service image', done: Boolean(image) },
    ];

    const completed = checklist.filter((item) => item.done).length;
    const progress = Math.round((completed / checklist.length) * 100);

    return (
        <DashboardLayout
            role="provider"
            navItems={providerNavItems}
        >
            <DashboardHeader
                title="Add Service"
                subtitle="Create a new service listing"
                action={
                    <Link
                        to="/provider/services"
                        className="btn-outline hidden sm:inline-flex"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to services
                    </Link>
                }
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:items-start">
                {/* =================================================
                    FORM
                ================================================= */}
                <div className="card p-5 sm:p-6 lg:p-8">
                    <div className="mb-6 flex items-start gap-3 border-b border-slate-100 pb-5 dark:border-ink-800">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                            <Plus className="h-5 w-5" />
                        </div>

                        <div>
                            <h2 className="text-base font-semibold text-slate-900 dark:text-ink-50">
                                Service details
                            </h2>
                            <p className="mt-0.5 text-sm text-slate-500 dark:text-ink-400">
                                Tell students exactly what you offer and what it costs.
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        noValidate
                        className="space-y-6"
                    >
                        {/* Service Title */}
                        <div>
                            <label
                                htmlFor="service-title"
                                className="label"
                            >
                                Service Title
                            </label>

                            <input
                                id="service-title"
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="input text-base sm:text-sm"
                                placeholder="e.g. Birthday Photography"
                                disabled={isSubmitting}
                                aria-invalid={Boolean(fieldErrors.title)}
                                aria-describedby="service-title-help service-title-error"
                                autoComplete="off"
                            />

                            {fieldErrors.title ? (
                                <p id="service-title-error" className={fieldErrorClass} role="alert">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    {fieldErrors.title}
                                </p>
                            ) : (
                                <p id="service-title-help" className={helperTextClass}>
                                    Give your service a clear and specific name.
                                </p>
                            )}
                        </div>

                        {/* Category */}
                        <div>
                            <label
                                htmlFor="service-category"
                                className="label"
                            >
                                Category
                            </label>

                            <div className="relative">
                                <select
                                    id="service-category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="input appearance-none pr-10 text-base sm:text-sm"
                                    disabled={isSubmitting}
                                >
                                    {categories.map((category) => (
                                        <option
                                            key={category}
                                            value={category}
                                        >
                                            {category}
                                        </option>
                                    ))}
                                </select>

                                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            </div>

                            <p className="mt-1.5 text-xs text-slate-400 dark:text-ink-500">
                                Choose the category that best matches your work.
                            </p>
                        </div>

                        {/* Price + Duration */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="service-price"
                                    className="label"
                                >
                                    Price (₦)
                                </label>

                                <div className="relative">
                                    <Wallet className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                    <input
                                        id="service-price"
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        className="input pl-10 text-base sm:text-sm"
                                        placeholder="30000"
                                        min="0"
                                        inputMode="numeric"
                                        disabled={isSubmitting}
                                        aria-invalid={Boolean(fieldErrors.price)}
                                        aria-describedby="service-price-help service-price-error"
                                    />
                                </div>

                                {fieldErrors.price ? (
                                    <p id="service-price-error" className={fieldErrorClass} role="alert">
                                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                        {fieldErrors.price}
                                    </p>
                                ) : (
                                    <p id="service-price-help" className={helperTextClass}>
                                        Starting price in Nigerian Naira.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="service-duration"
                                    className="label"
                                >
                                    Duration
                                </label>

                                <div className="relative">
                                    <Clock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                    <input
                                        id="service-duration"
                                        type="text"
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleChange}
                                        className="input pl-10 text-base sm:text-sm"
                                        placeholder="e.g. 2 hours"
                                        disabled={isSubmitting}
                                        aria-invalid={Boolean(fieldErrors.duration)}
                                        aria-describedby="service-duration-help service-duration-error"
                                    />
                                </div>

                                {fieldErrors.duration ? (
                                    <p id="service-duration-error" className={fieldErrorClass} role="alert">
                                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                        {fieldErrors.duration}
                                    </p>
                                ) : (
                                    <p id="service-duration-help" className={helperTextClass}>
                                        How long the session typically takes.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <div className="flex items-center justify-between gap-3">
                                <label
                                    htmlFor="service-description"
                                    className="label mb-0"
                                >
                                    Description
                                </label>

                                <span className="text-[11px] tabular-nums text-slate-400 dark:text-ink-500">
                                    {formData.description.length} characters
                                </span>
                            </div>

                            <textarea
                                id="service-description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="form-textarea mt-1.5 min-h-[140px]"
                                placeholder="Describe your service in detail..."
                                rows={5}
                                disabled={isSubmitting}
                                aria-invalid={Boolean(fieldErrors.description)}
                                aria-describedby="service-description-help service-description-error"
                            />

                            {fieldErrors.description ? (
                                <p id="service-description-error" className={fieldErrorClass} role="alert">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    {fieldErrors.description}
                                </p>
                            ) : (
                                <p id="service-description-help" className={helperTextClass}>
                                    Tell customers what you offer and what they should expect.
                                </p>
                            )}
                        </div>

                        {/* Image */}
                        <div>
                            <label
                                htmlFor="service-image"
                                className="label"
                            >
                                Service Image
                            </label>

                            <input
                                ref={fileInputRef}
                                id="service-image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="sr-only"
                                tabIndex={-1}
                                disabled={isSubmitting}
                            />

                            {!imagePreview ? (
                                <div
                                    role="button"
                                    tabIndex={isSubmitting ? -1 : 0}
                                    aria-label="Upload a service image"
                                    aria-disabled={isSubmitting}
                                    onClick={openFilePicker}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            openFilePicker();
                                        }
                                    }}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        if (!isSubmitting) setIsDragging(true);
                                    }}
                                    onDragLeave={(e) => {
                                        e.preventDefault();
                                        setIsDragging(false);
                                    }}
                                    onDrop={handleDrop}
                                    className={cn(
                                        'group mt-1 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors',
                                        isDragging
                                            ? 'border-brand-500 bg-brand-50/70 dark:border-brand-400 dark:bg-brand-950/20'
                                            : 'border-slate-200 bg-slate-50/60 hover:border-brand-400 hover:bg-brand-50/40 dark:border-ink-700 dark:bg-ink-800/40 dark:hover:border-brand-500 dark:hover:bg-brand-950/10',
                                        isSubmitting && 'cursor-not-allowed opacity-60'
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm transition group-hover:scale-105 dark:bg-ink-900 dark:text-brand-300',
                                            isDragging && 'scale-105'
                                        )}
                                    >
                                        <Upload className="h-6 w-6" />
                                    </div>

                                    <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-ink-50">
                                        {isDragging
                                            ? 'Drop your image here'
                                            : 'Click to upload or drag and drop'}
                                    </p>

                                    <p id="service-image-help" className="mt-1 text-xs text-slate-500 dark:text-ink-400">
                                        PNG, JPG or WEBP · Maximum 5MB
                                    </p>
                                </div>
                            ) : (
                                <div className="group relative mt-1 overflow-hidden rounded-2xl border border-slate-200 dark:border-ink-700">
                                    <img
                                        src={imagePreview}
                                        alt="Service preview"
                                        className="h-64 w-full object-cover"
                                    />

                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/0 to-slate-950/20" />

                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        disabled={isSubmitting}
                                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/70 text-white backdrop-blur-sm transition hover:bg-slate-950/90 disabled:opacity-50"
                                        aria-label="Remove image"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>

                                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-4 py-3">
                                        <p className="min-w-0 truncate text-xs font-medium text-white">
                                            {image?.name}
                                        </p>

                                        <button
                                            type="button"
                                            onClick={openFilePicker}
                                            disabled={isSubmitting}
                                            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-slate-900 backdrop-blur transition hover:bg-white disabled:opacity-50"
                                        >
                                            <Camera className="h-3.5 w-3.5" />
                                            Replace
                                        </button>
                                    </div>
                                </div>
                            )}

                            {fieldErrors.image && (
                                <p className={fieldErrorClass} role="alert">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    {fieldErrors.image}
                                </p>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 dark:border-ink-800 sm:flex-row sm:items-center sm:justify-between">
                            <Link
                                to="/provider/services"
                                className={cn(
                                    'btn-outline text-center',
                                    isSubmitting && 'pointer-events-none opacity-50'
                                )}
                                aria-disabled={isSubmitting}
                            >
                                Cancel
                            </Link>

                            <Button
                                type="submit"
                                size="md"
                                icon={Plus}
                                loading={isSubmitting}
                                className="sm:min-w-[170px]"
                            >
                                {isSubmitting
                                    ? 'Creating Service...'
                                    : 'Create Service'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* =================================================
                    LIVE PREVIEW
                ================================================= */}
                <aside
                    className="space-y-4 lg:sticky lg:top-6"
                    aria-label="Live service preview"
                >
                    <div className="flex items-center justify-between px-1">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-ink-50">
                            <Eye className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                            Live preview
                        </h2>

                        <Badge tone="brand">Draft</Badge>
                    </div>

                    <div className="card overflow-hidden">
                        <div className="relative aspect-[16/10] overflow-hidden bg-lavender">
                            {imagePreview ? (
                                <img
                                    src={imagePreview}
                                    alt="Service image preview"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-brand-100 to-brand-200 px-6 text-center dark:from-brand-950 dark:to-brand-900">
                                    <ImageIcon className="h-8 w-8 text-brand-500 dark:text-brand-400" />
                                    <p className="text-xs font-medium text-brand-700/80 dark:text-brand-300/80">
                                        Your service image will appear here
                                    </p>
                                </div>
                            )}

                            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-brand-700 shadow-sm backdrop-blur dark:bg-ink-900/90 dark:text-brand-300">
                                <Tag className="h-3 w-3" />
                                {formData.category}
                            </span>
                        </div>

                        <div className="p-5">
                            <h3
                                className={cn(
                                    'line-clamp-2 text-base font-semibold',
                                    formData.title.trim()
                                        ? 'text-slate-900 dark:text-ink-50'
                                        : 'text-slate-400 dark:text-ink-500'
                                )}
                            >
                                {formData.title.trim() || 'Your service title'}
                            </h3>

                            <p
                                className={cn(
                                    'mt-2 line-clamp-3 text-sm leading-6',
                                    formData.description.trim()
                                        ? 'text-slate-500 dark:text-ink-400'
                                        : 'italic text-slate-400 dark:text-ink-500'
                                )}
                            >
                                {formData.description.trim() ||
                                    'Add a description so students know exactly what to expect.'}
                            </p>

                            <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-4 dark:border-ink-800">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-ink-500">
                                        Starting at
                                    </p>

                                    <p className="mt-0.5 truncate text-lg font-bold text-slate-900 dark:text-ink-50">
                                        {formData.price && Number(formData.price) > 0
                                            ? formatNaira(Number(formData.price))
                                            : '₦0'}
                                    </p>
                                </div>

                                <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:bg-ink-800 dark:text-ink-300">
                                    <Clock className="h-3.5 w-3.5" />
                                    {formData.duration.trim() || 'Duration'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Completion checklist */}
                    <div className="card p-5">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900 dark:text-ink-50">
                                Ready to publish
                            </p>

                            <span className="text-xs font-medium tabular-nums text-slate-500 dark:text-ink-400">
                                {completed}/{checklist.length}
                            </span>
                        </div>

                        <div
                            className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-ink-800"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={progress}
                            aria-label="Listing completion"
                        >
                            <div
                                className="h-full rounded-full bg-brand-600 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        <ul className="mt-4 space-y-2.5">
                            {checklist.map((item) => (
                                <li
                                    key={item.label}
                                    className="flex items-center gap-2.5 text-sm"
                                >
                                    <CheckCircle2
                                        className={cn(
                                            'h-4 w-4 shrink-0',
                                            item.done
                                                ? 'text-success-600 dark:text-success-500'
                                                : 'text-slate-300 dark:text-ink-600'
                                        )}
                                    />

                                    <span
                                        className={cn(
                                            item.done
                                                ? 'text-slate-700 dark:text-ink-200'
                                                : 'text-slate-400 dark:text-ink-500'
                                        )}
                                    >
                                        {item.label}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <p className="mt-4 flex items-start gap-1.5 border-t border-slate-100 pt-4 text-[11px] leading-5 text-slate-400 dark:border-ink-800 dark:text-ink-500">
                            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            Your listing goes live after creation and can be suspended by an admin later.
                        </p>
                    </div>

                    <div className="hidden items-center gap-2 px-1 text-xs text-slate-400 dark:text-ink-500 lg:flex">
                        <ShieldCheck className="h-4 w-4 shrink-0" />
                        Your details are saved securely to your provider account.
                    </div>
                </aside>
            </div>

            {(error || success) && (
                <div
                    className={cn(
                        'fixed bottom-6 right-6 z-[100] flex w-[calc(100%-3rem)] max-w-md items-start gap-3 rounded-2xl border px-4 py-4 shadow-2xl sm:w-full',
                        error
                            ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950 dark:text-red-200'
                            : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-950 dark:text-green-200'
                    )}
                    role={error ? 'alert' : 'status'}
                    aria-live="polite"
                >
                    {error ? (
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    ) : (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    )}

                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-5">
                            {error || success}
                        </p>

                        {success && !error && (
                            <Link
                                to="/provider/services"
                                className="mt-1 inline-block text-xs font-semibold underline underline-offset-2 transition hover:opacity-80"
                            >
                                View my services
                            </Link>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setError('');
                            setSuccess('');
                        }}
                        className="rounded-md p-1 transition hover:bg-black/10"
                        aria-label="Dismiss notification"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
        </DashboardLayout>
    );
}
