
import { useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    AlertTriangle,
    Camera,
    CheckCircle2,
    ChevronDown,
    Clock,
    Eye,
    FileText,
    Image as ImageIcon,
    Info,
    LayoutGrid,
    Pencil,
    Plus,
    Save,
    Search,
    ShieldCheck,
    Tag,
    Trash2,
    Wallet,
    X,
    type LucideIcon,
} from 'lucide-react';
import { DashboardLayout, DashboardHeader } from '@/components/DashboardLayout';
import { providerNavItems } from '@/data/providerNavItems';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Badge,
    Button,
    EmptyState,
    ErrorState,
    ResponsiveModal,
    SearchBar,
    SkeletonCard,
    cn,
} from '@/components/ui';

// Keep this page on the same API instance as the admin status controls.
// A hard-coded localhost URL can return stale service statuses from a
// different backend than the one the admin just updated.
const API_URL =
    import.meta.env.VITE_API_URL ||
    'http://localhost:5000';

interface Service {
    _id: string;
    provider: string;
    title: string;
    category: string;
    price: number;
    duration: string;
    description: string;
    image: string;
    // status: 'pending' | 'approved' | 'rejected' | 'suspended';
    status: 'pending' | 'active' | 'approved' | 'rejected' | 'suspended' | string;
    createdAt?: string;
    updatedAt?: string;
}

const categories = [
    'Photography',
    'Videography',
    'Graphic Design',
    'Makeup',
];

const formatNaira = (amount: number) => {
    return `₦${Number(amount || 0).toLocaleString('en-NG')}`;
};

const formatDate = (value?: string) => {
    if (!value) return '—';

    return new Date(value).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

/* =========================================================
   APPROVAL STATUS (maps the real backend status field)
========================================================= */

type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

const getStatusMeta = (status?: string): {
    label: string;
    tone: StatusTone;
    icon: LucideIcon;
} => {
    switch ((status || '').toLowerCase()) {
        case 'active':
            return { label: 'Active', tone: 'success', icon: CheckCircle2 };

        case 'approved':
            return { label: 'Approved', tone: 'success', icon: CheckCircle2 };

        case 'pending':
            return { label: 'Pending', tone: 'warning', icon: Clock };

        case 'rejected':
            return { label: 'Rejected', tone: 'danger', icon: AlertTriangle };

        case 'suspended':
            return { label: 'Suspended', tone: 'danger', icon: AlertTriangle };

        default:
            return { label: status || 'Active', tone: 'neutral', icon: Info };
    }
};

const isActiveStatus = (status?: string) => {
    const value = (status || '').toLowerCase();
    return value === 'active' || value === 'approved';
};

const isPendingStatus = (status?: string) =>
    (status || '').toLowerCase() === 'pending';

/* =========================================================
   PAGE
========================================================= */

type StatusFilter = 'all' | 'active' | 'pending';

export function ProviderServices() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch failures (list could not be loaded) vs. action errors
    // (edit/delete/validation) so each one renders in the right place.
    const [listError, setListError] = useState('');
    const [error, setError] = useState('');

    // Toolbar
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    // View
    const [viewingService, setViewingService] = useState<Service | null>(null);
    const [viewOpen, setViewOpen] = useState(false);

    // Edit
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [editOpen, setEditOpen] = useState(false);

    const [editForm, setEditForm] = useState({
        title: '',
        category: 'Photography',
        price: '',
        duration: '',
        description: '',
    });

    const [editImage, setEditImage] = useState<File | null>(null);
    const [editImagePreview, setEditImagePreview] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    // Delete
    const [deletingService, setDeletingService] = useState<Service | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const getToken = () => {
        return sessionStorage.getItem('servicely_token');
    };

    // ==========================================
    // FETCH SERVICES
    // ==========================================


    const fetchServices = async () => {
        try {
            setLoading(true);
            setListError('');

            const token = getToken();

            if (!token) {
                setListError('Your session has expired. Please log in again.');
                return;
            }

            const response = await fetch(
                `${API_URL}/provider/services`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                        'Cache-Control': 'no-cache',
                    },
                    cache: 'no-store',
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    'Failed to load your services.'
                );
            }

            const fetchedServices = Array.isArray(result.services)
                ? result.services
                : [];

            console.log(
                'Provider services fetched:',
                fetchedServices.map((service: Service) => ({
                    id: service._id,
                    title: service.title,
                    status: service.status,
                }))
            );

            setServices(fetchedServices);
        } catch (error) {
            console.error(
                'Fetch services error:',
                error
            );

            setListError(
                error instanceof Error
                    ? error.message
                    : 'Failed to load your services.'
            );
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        fetchServices();
    }, []);

    // ==========================================
    // FILTERS (client side)
    // ==========================================

    const filteredServices = useMemo(() => {
        const query = search.trim().toLowerCase();

        return services.filter((service) => {
            const matchesQuery =
                !query ||
                (service.title || '').toLowerCase().includes(query) ||
                (service.category || '').toLowerCase().includes(query);

            if (!matchesQuery) return false;

            if (statusFilter === 'active') {
                return isActiveStatus(service.status);
            }

            if (statusFilter === 'pending') {
                return isPendingStatus(service.status);
            }

            return true;
        });
    }, [services, search, statusFilter]);

    const filterChips: Array<{ key: StatusFilter; label: string; count: number }> = [
        { key: 'all', label: 'All', count: services.length },
        {
            key: 'active',
            label: 'Active',
            count: services.filter((service) => isActiveStatus(service.status)).length,
        },
        {
            key: 'pending',
            label: 'Pending approval',
            count: services.filter((service) => isPendingStatus(service.status)).length,
        },
    ];

    const anyModalOpen = viewOpen || editOpen || deleteOpen;

    // ==========================================
    // OPEN VIEW MODAL
    // ==========================================

    const openViewModal = (service: Service) => {
        setViewingService(service);
        setViewOpen(true);
        setError('');
    };

    // ==========================================
    // OPEN DELETE MODAL
    // ==========================================

    const openDeleteModal = (service: Service) => {
        setDeletingService(service);
        setDeleteOpen(true);
        setError('');
    };

    // ==========================================
    // OPEN EDIT MODAL
    // ==========================================

    const openEditModal = (service: Service) => {
        setEditingService(service);
        setEditOpen(true);

        setEditForm({
            title: service.title,
            category: service.category,
            price: String(service.price),
            duration: service.duration,
            description: service.description,
        });

        setEditImage(null);
        setEditImagePreview(service.image);
        setError('');
    };

    // ==========================================
    // CHANGE EDIT IMAGE
    // ==========================================

    const handleEditImageChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB.');
            return;
        }

        setError('');
        setEditImage(file);

        const previewUrl = URL.createObjectURL(file);
        setEditImagePreview(previewUrl);
    };

    // ==========================================
    // REMOVE NEW IMAGE
    // ==========================================

    const removeEditImage = () => {
        setEditImage(null);

        if (editingService) {
            setEditImagePreview(editingService.image);
        }
    };

    // ==========================================
    // UPDATE SERVICE
    // ==========================================

    const handleUpdateService = async () => {
        if (!editingService) return;

        setError('');

        if (!editForm.title.trim()) {
            setError('Please enter a service title.');
            return;
        }

        if (!editForm.price || Number(editForm.price) <= 0) {
            setError('Please enter a valid price.');
            return;
        }

        if (!editForm.duration.trim()) {
            setError('Please enter the service duration.');
            return;
        }

        if (!editForm.description.trim()) {
            setError('Please enter a service description.');
            return;
        }

        try {
            setEditLoading(true);

            const token = getToken();

            if (!token) {
                setError('Your session has expired. Please log in again.');
                return;
            }

            const data = new FormData();

            data.append('title', editForm.title.trim());
            data.append('category', editForm.category);
            data.append('price', editForm.price);
            data.append('duration', editForm.duration.trim());
            data.append('description', editForm.description.trim());

            // Only send image if provider selected a new one
            if (editImage) {
                data.append('image', editImage);
            }

            const response = await fetch(
                `${API_URL}/provider/services/${editingService._id}`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: data,
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || 'Failed to update service.'
                );
            }

            // Update service in UI immediately
            setServices((prev) =>
                prev.map((service) =>
                    service._id === editingService._id
                        ? result.service
                        : service
                )
            );

            // Close modal
            setEditOpen(false);
            setEditImage(null);
            setEditImagePreview('');

        } catch (error) {
            console.error('Update service error:', error);

            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to update service.'
            );
        } finally {
            setEditLoading(false);
        }
    };

    // ==========================================
    // DELETE SERVICE
    // ==========================================

    const handleDelete = async () => {
        if (!deleteOpen || !deletingService) return;

        try {
            setDeleteLoading(true);
            setError('');

            const token = getToken();

            if (!token) {
                setError('Your session has expired. Please log in again.');
                return;
            }

            const response = await fetch(
                `${API_URL}/provider/services/${deletingService._id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || 'Failed to delete service.'
                );
            }

            setServices((prev) =>
                prev.filter(
                    (service) => service._id !== deletingService._id
                )
            );

            setDeleteOpen(false);

        } catch (error) {
            console.error('Delete service error:', error);

            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to delete service.'
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    // ==========================================
    // SHARED FRAGMENTS
    // ==========================================

    const inlineError = error ? (
        <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-xl border border-danger-100 bg-danger-50 px-3 py-2.5 text-xs font-medium text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/10 dark:text-danger-200"
        >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
        </div>
    ) : null;

    const statusBadge = (service: Service) => {
        const meta = getStatusMeta(service.status);

        return (
            <Badge tone={meta.tone} icon={meta.icon}>
                {meta.label}
            </Badge>
        );
    };


    return (
        <DashboardLayout role="provider" navItems={providerNavItems}>

            <DashboardHeader
                title="My Services"
                subtitle="Manage your service listings"
                action={
                    <Link
                        to="/provider/add-service"
                        className="btn-primary"
                    >
                        <Plus className="h-4 w-4" />
                        Add Service
                    </Link>
                }
            />

            {/* =====================================================
          TOOLBAR — search + status filter chips
      ===================================================== */}

            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
            >
                <SearchBar
                    value={search}
                    onChange={setSearch}
                    placeholder="Search services by title or category"
                    className="w-full lg:max-w-md"
                />

                <div
                    role="group"
                    aria-label="Filter services by status"
                    className="flex flex-wrap items-center gap-2"
                >
                    {filterChips.map((chip) => {
                        const active = statusFilter === chip.key;

                        return (
                            <button
                                key={chip.key}
                                type="button"
                                onClick={() => setStatusFilter(chip.key)}
                                aria-pressed={active}
                                className={cn(
                                    'inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition',
                                    active
                                        ? 'border-brand-600 bg-brand-600 text-white shadow-sm dark:border-brand-500 dark:bg-brand-600'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700 dark:border-ink-700 dark:bg-ink-800/60 dark:text-ink-300 dark:hover:border-ink-600 dark:hover:text-brand-300'
                                )}
                            >
                                {chip.label}
                                <span
                                    className={cn(
                                        'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                                        active
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-100 text-slate-500 dark:bg-ink-700 dark:text-ink-400'
                                    )}
                                >
                                    {chip.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {/* =====================================================
          LIST ERROR BANNER (refresh failed but list still visible)
      ===================================================== */}

            {listError && services.length > 0 && (
                <div
                    role="alert"
                    className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/10 dark:text-danger-200"
                >
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>{listError}</span>

                    <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto"
                        onClick={fetchServices}
                    >
                        Retry
                    </Button>
                </div>
            )}

            {/* =====================================================
          ACTION ERROR BANNER (edit / delete / validation)
      ===================================================== */}

            {error && !anyModalOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="alert"
                    className="mb-6 flex items-center gap-3 rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/10 dark:text-danger-200"
                >
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() => setError('')}
                        aria-label="Dismiss error"
                        className="ml-auto rounded-lg p-1 transition hover:bg-danger-100 dark:hover:bg-danger-500/20"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </motion.div>
            )}

            {/* =====================================================
          CONTENT
      ===================================================== */}

            {loading ? (

                /* LOADING */
                <div
                    className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
                    aria-busy="true"
                    aria-label="Loading your services"
                >
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                        <SkeletonCard key={item} />
                    ))}
                </div>

            ) : listError && services.length === 0 ? (

                /* FETCH ERROR */
                <ErrorState
                    message={listError}
                    onRetry={fetchServices}
                />

            ) : services.length === 0 ? (

                /* EMPTY STATE */
                <EmptyState
                    icon={LayoutGrid}
                    title="You haven't added any services yet"
                    description="Create your first service to start offering your work to ABUAD students."
                    action={
                        <Link to="/provider/add-service" className="btn-primary">
                            <Plus className="h-4 w-4" />
                            Add Service
                        </Link>
                    }
                />

            ) : filteredServices.length === 0 ? (

                /* NO MATCHING RESULTS */
                <EmptyState
                    icon={Search}
                    title="No services match your filters"
                    description="Try a different search term, or clear the filters to see all of your services."
                    action={
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSearch('');
                                setStatusFilter('all');
                            }}
                        >
                            Clear filters
                        </Button>
                    }
                />

            ) : (

                /* SERVICES GRID */

                <>
                    <p
                        aria-live="polite"
                        className="mb-4 text-sm text-slate-500 dark:text-ink-400"
                    >
                        Showing {filteredServices.length} of {services.length}{' '}
                        {services.length === 1 ? 'service' : 'services'}
                    </p>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        <AnimatePresence mode="popLayout">
                            {filteredServices.map((service, index) => {
                                const meta = getStatusMeta(service.status);

                                return (
                                    <motion.article
                                        key={service._id}
                                        layout
                                        initial={{
                                            opacity: 0,
                                            y: 18,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                        }}
                                        exit={{
                                            opacity: 0,
                                            scale: 0.96,
                                        }}
                                        transition={{
                                            duration: 0.3,
                                            delay: Math.min(index, 7) * 0.04,
                                        }}
                                        whileHover={{ y: -4 }}
                                        className="card-hover group flex flex-col overflow-hidden"
                                    >
                                        {/* ================= IMAGE ================= */}
                                        <div className="relative aspect-[16/10] overflow-hidden bg-lavender">
                                            {service.image ? (
                                                <img
                                                    src={service.image}
                                                    alt={service.title}
                                                    loading="lazy"
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-950 dark:to-brand-900">
                                                    <ImageIcon className="h-10 w-10 text-brand-400 dark:text-brand-500" />
                                                </div>
                                            )}
                                        </div>

                                        {/* ================= CONTENT ================= */}
                                        <div className="flex flex-1 flex-col p-4 sm:p-5">
                                            {/* Title */}
                                            <h3 className="line-clamp-1 text-base font-semibold text-slate-900 dark:text-ink-50">
                                                {service.title}
                                            </h3>

                                            {/* Category + approval status */}
                                            <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                                <Badge tone="brand" icon={Tag}>
                                                    {service.category}
                                                </Badge>

                                                <Badge tone={meta.tone} icon={meta.icon}>
                                                    {meta.label}
                                                </Badge>
                                            </div>

                                            {/* Description */}
                                            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-ink-400">
                                                {service.description}
                                            </p>

                                            {/* Price / duration + actions */}
                                            <div className="mt-auto pt-4">
                                                <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-4 dark:border-ink-800">
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-ink-500">
                                                            Price
                                                        </p>

                                                        <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-ink-50">
                                                            {formatNaira(service.price)}
                                                        </p>
                                                    </div>

                                                    <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:bg-ink-800 dark:text-ink-300">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {service.duration}
                                                    </span>
                                                </div>

                                                {/* ================= ACTIONS ================= */}
                                                <div className="mt-4 flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        icon={Pencil}
                                                        className="flex-1"
                                                        onClick={() => openEditModal(service)}
                                                    >
                                                        Edit
                                                    </Button>

                                                    <button
                                                        type="button"
                                                        onClick={() => openViewModal(service)}
                                                        aria-label={`View details of ${service.title}`}
                                                        title="View details"
                                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-brand-300 hover:bg-lavender hover:text-brand-700 dark:border-ink-700 dark:text-ink-400 dark:hover:border-ink-600 dark:hover:bg-ink-800 dark:hover:text-brand-300"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => openDeleteModal(service)}
                                                        aria-label={`Delete ${service.title}`}
                                                        title="Delete service"
                                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-danger-100 bg-danger-50 text-danger-600 transition hover:bg-danger-100 dark:border-danger-500/20 dark:bg-danger-500/10 dark:text-danger-400 dark:hover:bg-danger-500/20"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.article>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </>

            )}

            {/* =====================================================
          VIEW SERVICE MODAL
      ===================================================== */}

            <ResponsiveModal
                open={viewOpen}
                onClose={() => setViewOpen(false)}
                title="Service details"
                footer={
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setViewOpen(false)}
                        >
                            Close
                        </Button>

                        <Button
                            icon={Pencil}
                            onClick={() => {
                                if (viewingService) {
                                    openEditModal(viewingService);
                                    setViewOpen(false);
                                }
                            }}
                        >
                            Edit service
                        </Button>
                    </div>
                }
            >
                {viewingService && (
                    <div className="space-y-4">
                        {/* Image */}
                        <div className="aspect-[16/10] overflow-hidden rounded-xl bg-lavender">
                            {viewingService.image ? (
                                <img
                                    src={viewingService.image}
                                    alt={viewingService.title}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <ImageIcon className="h-10 w-10 text-brand-400 dark:text-brand-500" />
                                </div>
                            )}
                        </div>

                        {/* Category + status */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="brand" icon={Tag}>
                                {viewingService.category}
                            </Badge>
                            {statusBadge(viewingService)}
                        </div>

                        {/* Title */}
                        <div>
                            <h4 className="text-lg font-bold text-slate-900 dark:text-ink-50">
                                {viewingService.title}
                            </h4>

                            <p className="mt-1 text-xs text-slate-400 dark:text-ink-500">
                                Created {formatDate(viewingService.createdAt)} · Last
                                updated {formatDate(viewingService.updatedAt)}
                            </p>
                        </div>

                        {/* Price + duration */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-ink-800 dark:bg-ink-800/60">
                                <div className="flex items-center gap-1.5 text-slate-400 dark:text-ink-500">
                                    <Wallet className="h-4 w-4" />
                                    <span className="text-xs font-medium">Price</span>
                                </div>

                                <p className="mt-1.5 text-lg font-bold text-slate-900 dark:text-ink-50">
                                    {formatNaira(viewingService.price)}
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-ink-800 dark:bg-ink-800/60">
                                <div className="flex items-center gap-1.5 text-slate-400 dark:text-ink-500">
                                    <Clock className="h-4 w-4" />
                                    <span className="text-xs font-medium">Duration</span>
                                </div>

                                <p className="mt-1.5 text-base font-bold text-slate-900 dark:text-ink-50">
                                    {viewingService.duration}
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-ink-50">
                                <FileText className="h-4 w-4 text-slate-400" />
                                About this service
                            </p>

                            <p className="whitespace-pre-line rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-sm leading-6 text-slate-600 dark:border-ink-800 dark:bg-ink-800/60 dark:text-ink-300">
                                {viewingService.description}
                            </p>
                        </div>
                    </div>
                )}
            </ResponsiveModal>


            {/* =====================================================
          EDIT SERVICE MODAL
      ===================================================== */}

            <ResponsiveModal
                open={editOpen}
                onClose={() => {
                    if (!editLoading) {
                        setEditOpen(false);
                    }
                }}
                title="Edit service"
                footer={
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-ink-400">
                            <ShieldCheck className="h-4 w-4 shrink-0" />
                            Your changes are saved securely.
                        </p>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setEditOpen(false)}
                                disabled={editLoading}
                            >
                                Cancel
                            </Button>

                            <Button
                                icon={Save}
                                loading={editLoading}
                                onClick={handleUpdateService}
                            >
                                Save changes
                            </Button>
                        </div>
                    </div>
                }
            >
                {inlineError}

                {/* ================= IMAGE SECTION ================= */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-ink-800 dark:bg-ink-800/50">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="h-28 w-full shrink-0 overflow-hidden rounded-xl bg-lavender sm:w-40">
                            {editImagePreview ? (
                                <img
                                    src={editImagePreview}
                                    alt={editForm.title || 'Service image preview'}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <ImageIcon className="h-8 w-8 text-brand-400 dark:text-brand-500" />
                                </div>
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900 dark:text-ink-50">
                                Service image
                            </p>

                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-ink-400">
                                Use a clear image that represents your service.
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <label className="btn-outline btn-sm cursor-pointer">
                                    <Camera className="h-3.5 w-3.5" />
                                    Change image

                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="sr-only"
                                        aria-label="Upload a new service image"
                                        onChange={handleEditImageChange}
                                    />
                                </label>

                                {editImage && (
                                    <button
                                        type="button"
                                        onClick={removeEditImage}
                                        className="btn btn-sm border border-danger-100 bg-danger-50 text-danger-600 hover:bg-danger-100 dark:border-danger-500/20 dark:bg-danger-500/10 dark:text-danger-400"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        Remove new image
                                    </button>
                                )}
                            </div>

                            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-ink-500">
                                <Info className="h-3.5 w-3.5 shrink-0" />
                                JPG, PNG or WEBP. Maximum size: 5MB.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ================= FORM ================= */}
                <div className="mt-5 space-y-4">
                    {/* Title */}
                    <div>
                        <label htmlFor="edit-service-title" className="label">
                            Service title
                        </label>

                        <input
                            id="edit-service-title"
                            type="text"
                            value={editForm.title}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    title: e.target.value,
                                })
                            }
                            placeholder="e.g. Professional Event Photography"
                            className="input"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label htmlFor="edit-service-category" className="label">
                            Category
                        </label>

                        <div className="relative">
                            <select
                                id="edit-service-category"
                                value={editForm.category}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        category: e.target.value,
                                    })
                                }
                                className="input appearance-none pr-10"
                            >
                                {categories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>

                            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>

                    {/* Price + duration */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="edit-service-price" className="label">
                                Price
                            </label>

                            <div className="relative">
                                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                                    ₦
                                </span>

                                <input
                                    id="edit-service-price"
                                    type="number"
                                    min="0"
                                    value={editForm.price}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            price: e.target.value,
                                        })
                                    }
                                    placeholder="0"
                                    className="input pl-9"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="edit-service-duration" className="label">
                                Duration
                            </label>

                            <div className="relative">
                                <Clock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                <input
                                    id="edit-service-duration"
                                    type="text"
                                    value={editForm.duration}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            duration: e.target.value,
                                        })
                                    }
                                    placeholder="e.g. 2 hours"
                                    className="input pl-10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <div className="flex items-center justify-between">
                            <label
                                htmlFor="edit-service-description"
                                className="label mb-0"
                            >
                                Description
                            </label>

                            <span className="text-[11px] text-slate-400 dark:text-ink-500">
                                {editForm.description.length}/2000
                            </span>
                        </div>

                        <textarea
                            id="edit-service-description"
                            rows={6}
                            value={editForm.description}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    description: e.target.value,
                                })
                            }
                            placeholder="Describe what customers will receive..."
                            className="form-textarea mt-1.5"
                        />
                    </div>
                </div>
            </ResponsiveModal>


            {/* =====================================================
          DELETE MODAL
      ===================================================== */}

            <ResponsiveModal
                open={deleteOpen}
                onClose={() => {
                    if (!deleteLoading) {
                        setDeleteOpen(false);
                    }
                }}
                title="Delete service?"
                footer={
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteOpen(false)}
                            disabled={deleteLoading}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="danger"
                            icon={Trash2}
                            loading={deleteLoading}
                            onClick={handleDelete}
                        >
                            Delete service
                        </Button>
                    </div>
                }
            >
                {inlineError}

                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-200">
                        <Trash2 className="h-5 w-5" />
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-ink-50">
                            This action cannot be undone.
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-ink-400">
                            Are you sure you want to delete{' '}
                            <span className="font-semibold text-slate-900 dark:text-ink-50">
                                "{deletingService?.title}"
                            </span>
                            ? Your customers will no longer be able to book this
                            service.
                        </p>
                    </div>
                </div>
            </ResponsiveModal>

        </DashboardLayout>
    );
}
