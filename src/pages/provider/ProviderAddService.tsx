
import { useEffect, useState } from 'react';
import { DashboardLayout, DashboardHeader } from '@/components/DashboardLayout';
import { providerNavItems } from '@/data/providerNavItems';
import {
    Image as ImageIcon,
    Upload,
    X,
    LoaderCircle,
    CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL =
    import.meta.env.VITE_API_URL ||
    'http://localhost:5000';

const categories = [
    'Photography',
    'Videography',
    'Graphic Design',
    'Makeup',
];

export function ProviderAddService() {

    const [formData, setFormData] = useState({
        title: '',
        category: 'Photography',
        price: '',
        duration: '',
        description: '',
    });

    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Keep feedback visible long enough to be read, then dismiss it.
    useEffect(() => {
        if (!error && !success) return;

        const timeoutId = window.setTimeout(() => {
            setError('');
            setSuccess('');
        }, 15_000);

        return () => window.clearTimeout(timeoutId);
    }, [error, success]);

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
    };

    const handleImageChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];

        if (!file) return;

        // Only allow images
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file.');
            return;
        }

        // 5MB limit
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB.');
            return;
        }

        setError('');
        setImage(file);

        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
    };

    const removeImage = () => {
        setImage(null);
        setImagePreview('');
    };

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        setError('');
        setSuccess('');

        // Basic validation
        if (!formData.title.trim()) {
            setError('Please enter a service title.');
            return;
        }

        if (!formData.price || Number(formData.price) <= 0) {
            setError('Please enter a valid price.');
            return;
        }

        if (!formData.duration.trim()) {
            setError('Please enter the service duration.');
            return;
        }

        if (!formData.description.trim()) {
            setError('Please describe your service.');
            return;
        }

        // Make sure an image was selected
        if (!image) {
            setError('Please upload a service image.');
            return;
        }

        // At this point TypeScript knows serviceImage is a File
        const serviceImage = image;

        try {
            setLoading(true);

            const token = sessionStorage.getItem('servicely_token');

            if (!token) {
                setError('Your session has expired. Please log in again.');
                setLoading(false);
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

            // Use the guaranteed File value here
            data.append('image', serviceImage);

            const response = await fetch(
                `${API_URL}/provider/services`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: data,
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || 'Failed to create service.'
                );
            }

            setSuccess(
                result.message ||
                'Service created successfully!'
            );

            // Keep the confirmation visible, but prepare a clean form for
            // the provider's next service listing.
            setFormData({
                title: '',
                category: 'Photography',
                price: '',
                duration: '',
                description: '',
            });
            setImage(null);
            setImagePreview('');
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Something went wrong. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };



    return (
        <DashboardLayout
            role="provider"
            navItems={providerNavItems}
        >
            <DashboardHeader
                title="Add Service"
                subtitle="Create a new service listing"
            />

            <div className="card max-w-2xl p-6">
                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >
                    {/* Service Title */}
                    <div>
                        <label className="label">
                            Service Title
                        </label>

                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="input text-base sm:text-sm"
                            placeholder="e.g. Birthday Photography"
                            disabled={loading}
                        />

                        <p className="mt-1.5 text-xs text-ink-400">
                            Give your service a clear and specific name.
                        </p>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="label">
                            Category
                        </label>

                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="input text-base sm:text-sm"
                            disabled={loading}
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
                    </div>

                    {/* Price + Duration */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="label">
                                Price (₦)
                            </label>

                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                className="input text-base sm:text-sm"
                                placeholder="30000"
                                min="0"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="label">
                                Duration
                            </label>

                            <input
                                type="text"
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                className="input text-base sm:text-sm"
                                placeholder="e.g. 2 hours"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="label">
                            Description
                        </label>

                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="input min-h-[120px] resize-none text-base sm:text-sm "
                            placeholder="Describe your service in detail..."
                            disabled={loading}
                        />

                        <p className="mt-1.5 text-xs text-ink-400">
                            Tell customers what you offer and what they should expect.
                        </p>
                    </div>

                    {/* Image */}
                    <div>
                        <label className="label">
                            Service Image
                        </label>

                        {!imagePreview ? (
                            <label className="group block cursor-pointer">
                                <div className="rounded-xl border-2 border-dashed border-ink-200 p-8 text-center transition-colors group-hover:border-primary-400 group-hover:bg-primary-50/30 dark:border-ink-700 dark:group-hover:border-primary-500 dark:group-hover:bg-primary-950/10">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        disabled={loading}
                                    />

                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 dark:bg-ink-800">
                                        <Upload className="h-5 w-5 text-ink-500" />
                                    </div>

                                    <p className="mt-3 text-sm font-medium text-ink-700 dark:text-ink-200">
                                        Click to upload an image
                                    </p>

                                    <p className="mt-1 text-xs text-ink-400">
                                        PNG, JPG or WEBP · Maximum 5MB
                                    </p>
                                </div>
                            </label>
                        ) : (
                            <div className="relative overflow-hidden rounded-xl border border-ink-200 dark:border-ink-700">
                                <img
                                    src={imagePreview}
                                    alt="Service preview"
                                    className="h-64 w-full object-cover"
                                />

                                <button
                                    type="button"
                                    onClick={removeImage}
                                    disabled={loading}
                                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm transition hover:bg-black/90 disabled:opacity-50"
                                    aria-label="Remove image"
                                >
                                    <X className="h-4 w-4" />
                                </button>

                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-4 py-2 text-xs text-white backdrop-blur-sm">
                                    {image?.name}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                        <Link
                            to="/provider/services"
                            className={`btn-outline text-center ${loading
                                    ? 'pointer-events-none opacity-50'
                                    : ''
                                }`}
                        >
                            Cancel
                        </Link>

                        
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex flex-1 items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                    Creating Service...
                                </>
                            ) : (
                                'Create Service'
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {(error || success) && (
                <div
                    className={`fixed bottom-6 right-6 z-[100] flex w-[calc(100%-3rem)] max-w-md items-start gap-3 rounded-2xl border px-4 py-4 shadow-2xl sm:w-full ${
                        error
                            ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950 dark:text-red-200'
                            : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-950 dark:text-green-200'
                    }`}
                    role="status"
                >
                    {/* {error ? (
                        <X className="mt-0.5 h-5 w-5 shrink-0" />
                    ) : (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    )} */}

                    <p className="flex-1 text-sm font-medium leading-5">
                        {error || success}
                    </p>

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
