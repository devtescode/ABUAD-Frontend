
import { useEffect, useState } from 'react';
import {
    Edit,
    Trash2,
    Plus,
    X,
    Eye,
    LoaderCircle,
    AlertCircle,
    Pencil,
    Camera,
    Info,
    ChevronDown,
    Clock,
    ShieldCheck,
    Save,
    Tag,
    Wallet,
    FileText,
    Image as ImageIcon,
} from 'lucide-react';
import { DashboardLayout, DashboardHeader } from '@/components/DashboardLayout';
import { providerNavItems } from '@/data/providerNavItems';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from "framer-motion";
import { StatusBadge } from '@/components/shared';

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

export function ProviderServices() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // View
    const [viewingService, setViewingService] = useState<Service | null>(null);

    // Edit
    const [editingService, setEditingService] = useState<Service | null>(null);

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
            setError('');

            const token = getToken();

            if (!token) {
                setError('Your session has expired. Please log in again.');
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

            setError(
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
    // OPEN EDIT MODAL
    // ==========================================

    const openEditModal = (service: Service) => {
        setEditingService(service);

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
            setEditingService(null);
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
        if (!deletingService) return;

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

            setDeletingService(null);

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
    // STATUS STYLE
    // ==========================================


    const getStatusStyle = (status: Service['status']) => {
        switch (status?.toLowerCase()) {
            case 'active':
            case 'approved':
                return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';

            case 'pending':
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400';

            case 'rejected':
                return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';

            case 'suspended':
                return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';

            default:
                return 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300';
        }
    };

    const getStatusText = (status: Service['status']) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'Active';

            case 'approved':
                return 'Approved';

            case 'pending':
                return 'Pending';

            case 'rejected':
                return 'Rejected';

            case 'suspended':
                return 'Suspended';

            default:
                return status || 'Pending';
        }
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

            {/* ERROR */}
            {error && (
                <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() => setError('')}
                        className="ml-auto"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* LOADING */}
            {loading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                    <div className="flex items-center gap-3 text-ink-500">
                        <LoaderCircle className="h-6 w-6 animate-spin" />
                        <span>Loading your services...</span>
                    </div>
                </div>
            ) : services.length === 0 ? (

                /* EMPTY STATE */
                <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center dark:border-ink-700 dark:bg-ink-900">

                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ink-100 dark:bg-ink-800">
                        <Plus className="h-6 w-6 text-ink-500" />
                    </div>

                    <h3 className="text-lg font-semibold text-ink-900 dark:text-white">
                        No services yet
                    </h3>

                    <p className="mt-2 max-w-sm text-sm text-ink-500">
                        You haven't added any services yet. Create your first
                        service to start offering your work to ABUAD students.
                    </p>

                    <Link
                        to="/provider/add-service"
                        className="btn-primary mt-5"
                    >
                        <Plus className="h-4 w-4" />
                        Add Your First Service
                    </Link>

                </div>

            ) : (

                /* SERVICES */

                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 xl:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                        {services.map((service, index) => (
                            <motion.div
                                key={service._id}
                                layout
                                initial={{
                                    opacity: 0,
                                    y: 20,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                exit={{
                                    opacity: 0,
                                    scale: 0.95,
                                }}
                                transition={{
                                    duration: 0.3,
                                    delay: index * 0.05,
                                }}
                                whileHover={{
                                    y: -5,
                                }}
                                className="group overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm transition-shadow duration-300 hover:shadow-xl dark:border-ink-800 dark:bg-ink-900"
                            >
                                {/* ================= IMAGE ================= */}
                                <div className="relative overflow-hidden">
                                    <img
                                        src={service.image}
                                        alt={service.title}
                                        className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                                    />

                                    {/* Image gradient */}
                                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

                                    {/* Status */}
                                    <div className="absolute right-3 top-3">
                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-lg backdrop-blur-md ${getStatusStyle(
                                                service.status
                                            )}`}
                                        >
                                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                            {getStatusText(service.status)}
                                        </span>
                                    </div>

                                    {/* Category */}
                                    <div className="absolute bottom-3 left-3">
                                        <span className="rounded-lg bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-ink-800 shadow-sm backdrop-blur-md dark:bg-ink-900/90 dark:text-white">
                                            {service.category}
                                        </span>
                                    </div>
                                </div>

                                {/* ================= CONTENT ================= */}
                                <div className="p-3">
                                    {/* Title */}
                                    <h3 className="line-clamp-1 text-base font-bold text-ink-900 dark:text-white">
                                        {service.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="mt-2 line-clamp-2 min-h-[40px] text-sm leading-5 text-ink-500 dark:text-ink-400">
                                        {service.description}
                                    </p>

                                    {/* Price / Duration */}
                                    <div className="mt-0 flex items-end justify-between border-t border-ink-100 pt-4 dark:border-ink-800">
                                        <div>
                                            <p className="text-[10px] font-medium uppercase tracking-wider text-ink-400">
                                                Starting from
                                            </p>

                                            <p className="mt-0.5 text-lg font-bold text-ink-900 dark:text-white">
                                                {formatNaira(service.price)}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1.5 rounded-lg bg-ink-50 px-2.5 py-1.5 text-xs font-medium text-ink-500 dark:bg-ink-800 dark:text-ink-300">
                                            <Clock className="h-3.5 w-3.5" />
                                            {service.duration}
                                        </div>
                                    </div>

                                    {/* ================= ACTIONS ================= */}
                                    <div className="mt-5 flex items-center gap-2">
                                        {/* VIEW */}
                                        <motion.button
                                            type="button"
                                            onClick={() => setViewingService(service)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.97 }}
                                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-ink-900 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-ink-800 dark:bg-white dark:text-ink-900 dark:hover:bg-ink-100"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            View
                                        </motion.button>

                                        {/* EDIT */}
                                        <motion.button
                                            type="button"
                                            onClick={() => openEditModal(service)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-600 transition hover:border-ink-300 hover:bg-ink-50 hover:text-ink-900 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700 dark:hover:text-white"
                                            title="Edit service"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </motion.button>

                                        {/* DELETE */}
                                        <motion.button
                                            type="button"
                                            onClick={() => setDeletingService(service)}
                                            whileHover={{
                                                scale: 1.05,
                                            }}
                                            whileTap={{
                                                scale: 0.95,
                                            }}
                                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:border-red-200 hover:bg-red-100 dark:border-red-500/10 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                                            title="Delete service"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>



            )}

            {/* =====================================================
          VIEW SERVICE MODAL
      ===================================================== */}


            <AnimatePresence>
                {viewingService && (
                    <motion.div
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setViewingService(null)}
                    >
                        <motion.div
                            className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-ink-900"
                            initial={{
                                opacity: 0,
                                scale: 0.92,
                                y: 35,
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                            }}
                            exit={{
                                opacity: 0,
                                scale: 0.94,
                                y: 20,
                            }}
                            transition={{
                                duration: 0.3,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* ================= HEADER ================= */}
                            <div className="flex items-center justify-between border-b border-ink-100 px-6 py-5 dark:border-ink-800 sm:px-8">
                                <div className="flex items-center gap-3">
                                    <motion.div
                                        initial={{ scale: 0, rotate: -10 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{
                                            delay: 0.08,
                                            type: "spring",
                                            stiffness: 250,
                                        }}
                                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-900 text-white dark:bg-white dark:text-ink-900"
                                    >
                                        <Eye className="h-5 w-5" />
                                    </motion.div>

                                    <div>
                                        <h2 className="text-lg font-bold text-ink-900 dark:text-white sm:text-xl">
                                            Service Details
                                        </h2>

                                        <p className="text-xs text-ink-500 dark:text-ink-400 sm:text-sm">
                                            View your service information
                                        </p>
                                    </div>
                                </div>

                                <motion.button
                                    type="button"
                                    onClick={() => setViewingService(null)}
                                    whileHover={{ rotate: 90, scale: 1.05 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="flex h-9 w-9 items-center justify-center rounded-full text-ink-400 transition hover:bg-ink-100 hover:text-ink-900 dark:hover:bg-ink-800 dark:hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </motion.button>
                            </div>

                            {/* ================= CONTENT ================= */}
                            <div className="overflow-y-auto">
                                <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[360px_1fr]">

                                    {/* ================= IMAGE ================= */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.08, duration: 0.35 }}
                                        className="relative"
                                    >
                                        <div className="group relative overflow-hidden rounded-2xl border border-ink-200 bg-ink-100 dark:border-ink-700 dark:bg-ink-800">
                                            {viewingService.image ? (
                                                <motion.img
                                                    src={viewingService.image}
                                                    alt={viewingService.title}
                                                    initial={{ scale: 1.08 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{
                                                        duration: 0.6,
                                                        ease: "easeOut",
                                                    }}
                                                    className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex aspect-[4/5] items-center justify-center text-ink-400">
                                                    <ImageIcon className="h-12 w-12" />
                                                </div>
                                            )}

                                            {/* Image gradient */}
                                            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />

                                            {/* Category */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.25 }}
                                                className="absolute bottom-4 left-4"
                                            >
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-ink-900 shadow-lg backdrop-blur">
                                                    <Tag className="h-3.5 w-3.5" />
                                                    {viewingService.category}
                                                </span>
                                            </motion.div>
                                        </div>

                                        {/* Status */}
                                        <div className="mt-4 flex items-center justify-between rounded-xl border border-ink-100 bg-ink-50 px-4 py-3 dark:border-ink-800 dark:bg-ink-800/60">
                                            <span className="text-xs font-medium text-ink-500 dark:text-ink-400">
                                                Service Status
                                            </span>

                                            <StatusBadge status={viewingService.status} />
                                        </div>
                                    </motion.div>

                                    {/* ================= DETAILS ================= */}
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.12, duration: 0.35 }}
                                        className="flex flex-col"
                                    >
                                        {/* Title */}
                                        <div>
                                            <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                                                Your Service
                                            </span>

                                            <h1 className="mt-2 text-2xl font-bold leading-tight text-ink-900 dark:text-white sm:text-3xl">
                                                {viewingService.title}
                                            </h1>
                                        </div>

                                        {/* Price & Duration */}
                                        <div className="mt-6 grid grid-cols-2 gap-3">
                                            <motion.div
                                                whileHover={{ y: -2 }}
                                                className="rounded-2xl border border-ink-100 bg-ink-50 p-4 dark:border-ink-800 dark:bg-ink-800/60"
                                            >
                                                <div className="flex items-center gap-2 text-ink-400">
                                                    <Wallet className="h-4 w-4" />
                                                    <span className="text-xs font-medium">
                                                        Starting Price
                                                    </span>
                                                </div>

                                                <p className="mt-2 text-xl font-bold text-ink-900 dark:text-white">
                                                    {formatNaira(viewingService.price)}
                                                </p>
                                            </motion.div>

                                            <motion.div
                                                whileHover={{ y: -2 }}
                                                className="rounded-2xl border border-ink-100 bg-ink-50 p-4 dark:border-ink-800 dark:bg-ink-800/60"
                                            >
                                                <div className="flex items-center gap-2 text-ink-400">
                                                    <Clock className="h-4 w-4" />
                                                    <span className="text-xs font-medium">
                                                        Duration
                                                    </span>
                                                </div>

                                                <p className="mt-2 text-base font-bold text-ink-900 dark:text-white">
                                                    {viewingService.duration}
                                                </p>
                                            </motion.div>
                                        </div>

                                        {/* Description */}
                                        <div className="mt-7">
                                            <div className="mb-3 flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-ink-400" />

                                                <h3 className="text-sm font-semibold text-ink-900 dark:text-white">
                                                    About this service
                                                </h3>
                                            </div>

                                            <div className="rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
                                                <p className="whitespace-pre-line text-sm leading-7 text-ink-600 dark:text-ink-300">
                                                    {viewingService.description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Service information */}
                                        <div className="mt-6">
                                            <div className="mb-3 flex items-center gap-2">
                                                <Info className="h-4 w-4 text-ink-400" />

                                                <h3 className="text-sm font-semibold text-ink-900 dark:text-white">
                                                    Service Information
                                                </h3>
                                            </div>

                                            <div className="divide-y divide-ink-100 rounded-2xl border border-ink-100 dark:divide-ink-800 dark:border-ink-800">
                                                <div className="flex items-center justify-between px-4 py-3.5">
                                                    <span className="text-xs text-ink-500 dark:text-ink-400">
                                                        Category
                                                    </span>

                                                    <span className="text-sm font-medium text-ink-900 dark:text-white">
                                                        {viewingService.category}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between px-4 py-3.5">
                                                    <span className="text-xs text-ink-500 dark:text-ink-400">
                                                        Created
                                                    </span>

                                                    <span className="text-sm font-medium text-ink-900 dark:text-white">
                                                        {viewingService.createdAt
                                                            ? new Date(
                                                                viewingService.createdAt
                                                            ).toLocaleDateString("en-NG", {
                                                                day: "numeric",
                                                                month: "short",
                                                                year: "numeric",
                                                            })
                                                            : "—"}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between px-4 py-3.5">
                                                    <span className="text-xs text-ink-500 dark:text-ink-400">
                                                        Last Updated
                                                    </span>

                                                    <span className="text-sm font-medium text-ink-900 dark:text-white">
                                                        {viewingService.updatedAt
                                                            ? new Date(
                                                                viewingService.updatedAt
                                                            ).toLocaleDateString("en-NG", {
                                                                day: "numeric",
                                                                month: "short",
                                                                year: "numeric",
                                                            })
                                                            : "—"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>

                            {/* ================= FOOTER ================= */}
                            <div className="flex flex-col-reverse gap-3 border-t border-ink-100 bg-ink-50/70 px-6 py-4 dark:border-ink-800 dark:bg-ink-900 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                                <div className="flex items-center gap-2 text-xs text-ink-400">
                                    <ShieldCheck className="h-4 w-4" />
                                    Manage your service from your dashboard.
                                </div>

                                <div className="flex gap-3">
                                    <motion.button
                                        type="button"
                                        onClick={() => setViewingService(null)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="rounded-xl border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:bg-ink-700"
                                    >
                                        Close
                                    </motion.button>

                                    <motion.button
                                        type="button"
                                        onClick={() => {
                                            openEditModal(viewingService);
                                            setViewingService(null);
                                        }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="flex items-center gap-2 rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ink-900/10 transition hover:bg-ink-800 dark:bg-white dark:text-ink-900 dark:hover:bg-ink-100"
                                    >
                                        <Pencil className="h-4 w-4" />
                                        Edit Service
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* =====================================================
          EDIT SERVICE MODAL
      ===================================================== */}

            <AnimatePresence>
                {editingService && (
                    <motion.div
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => {
                            if (!editLoading) {
                                setEditingService(null);
                            }
                        }}
                    >
                        <motion.div
                            className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-ink-900"
                            initial={{
                                opacity: 0,
                                scale: 0.92,
                                y: 35,
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                            }}
                            exit={{
                                opacity: 0,
                                scale: 0.94,
                                y: 20,
                            }}
                            transition={{
                                duration: 0.3,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* ================= HEADER ================= */}
                            <div className="flex items-center justify-between border-b border-ink-100 px-6 py-5 dark:border-ink-800 sm:px-8">
                                <div className="flex items-center gap-3">
                                    <motion.div
                                        initial={{ scale: 0, rotate: -15 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{
                                            delay: 0.08,
                                            type: "spring",
                                            stiffness: 250,
                                        }}
                                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-900 text-white dark:bg-white dark:text-ink-900"
                                    >
                                        <Pencil className="h-5 w-5" />
                                    </motion.div>

                                    <div>
                                        <h2 className="text-lg font-bold text-ink-900 dark:text-white sm:text-xl">
                                            Edit Service
                                        </h2>

                                        <p className="text-xs text-ink-500 dark:text-ink-400 sm:text-sm">
                                            Update your service information
                                        </p>
                                    </div>
                                </div>

                                <motion.button
                                    type="button"
                                    onClick={() => setEditingService(null)}
                                    disabled={editLoading}
                                    whileHover={{ rotate: 90, scale: 1.05 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="flex h-9 w-9 items-center justify-center rounded-full text-ink-400 transition hover:bg-ink-100 hover:text-ink-900 disabled:opacity-50 dark:hover:bg-ink-800 dark:hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </motion.button>
                            </div>

                            {/* ================= CONTENT ================= */}
                            <div className="overflow-y-auto">
                                <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[280px_1fr]">

                                    {/* ================= IMAGE SECTION ================= */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -15 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1, duration: 0.3 }}
                                    >
                                        <div className="mb-3">
                                            <h3 className="text-sm font-semibold text-ink-900 dark:text-white">
                                                Service Image
                                            </h3>

                                            <p className="mt-1 text-xs leading-5 text-ink-500 dark:text-ink-400">
                                                Use a clear image that represents your service.
                                            </p>
                                        </div>

                                        <div className="group relative overflow-hidden rounded-2xl border border-ink-200 bg-ink-50 dark:border-ink-700 dark:bg-ink-800">
                                            {editImagePreview ? (
                                                <img
                                                    src={editImagePreview}
                                                    alt={editingService.title}
                                                    className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex aspect-[4/5] items-center justify-center text-ink-400">
                                                    <ImageIcon className="h-10 w-10" />
                                                </div>
                                            )}

                                            {/* Image overlay */}
                                            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/10 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                                <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/95 px-4 py-3 text-sm font-semibold text-ink-900 shadow-lg backdrop-blur transition hover:bg-white">
                                                    <Camera className="h-4 w-4" />
                                                    Change Image

                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleEditImageChange}
                                                    />
                                                </label>
                                            </div>
                                        </div>

                                        {/* Mobile change image button */}
                                        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:bg-ink-700 sm:hidden">
                                            <Camera className="h-4 w-4" />
                                            Change Image

                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleEditImageChange}
                                            />
                                        </label>

                                        {editImage && (
                                            <motion.button
                                                type="button"
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                onClick={removeEditImage}
                                                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                                Remove New Image
                                            </motion.button>
                                        )}

                                        <div className="mt-3 flex items-start gap-2 text-[11px] leading-4 text-ink-400">
                                            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                            <span>JPG, PNG or WEBP. Maximum size: 5MB.</span>
                                        </div>
                                    </motion.div>

                                    {/* ================= FORM ================= */}
                                    <motion.div
                                        initial={{ opacity: 0, x: 15 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.12, duration: 0.3 }}
                                        className="space-y-6"
                                    >
                                        {/* Basic information */}
                                        <div>
                                            <div className="mb-4">
                                                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                                                    Basic Information
                                                </p>

                                                <div className="mt-2 h-px bg-ink-100 dark:bg-ink-800" />
                                            </div>

                                            {/* Title */}
                                            <div>
                                                <label className="mb-2 block text-sm font-semibold text-ink-800 dark:text-ink-200">
                                                    Service Title
                                                </label>

                                                <input
                                                    type="text"
                                                    value={editForm.title}
                                                    onChange={(e) =>
                                                        setEditForm({
                                                            ...editForm,
                                                            title: e.target.value,
                                                        })
                                                    }
                                                    placeholder="e.g. Professional Event Photography"
                                                    className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-ink-900 focus:ring-4 focus:ring-ink-900/5 dark:border-ink-700 dark:bg-ink-800 dark:text-white dark:focus:border-white dark:focus:ring-white/5"
                                                />
                                            </div>

                                            {/* Category */}
                                            <div className="mt-4">
                                                <label className="mb-2 block text-sm font-semibold text-ink-800 dark:text-ink-200">
                                                    Category
                                                </label>

                                                <div className="relative">
                                                    <select
                                                        value={editForm.category}
                                                        onChange={(e) =>
                                                            setEditForm({
                                                                ...editForm,
                                                                category: e.target.value,
                                                            })
                                                        }
                                                        className="w-full appearance-none rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-ink-900 focus:ring-4 focus:ring-ink-900/5 dark:border-ink-700 dark:bg-ink-800 dark:text-white dark:focus:border-white"
                                                    >
                                                        {categories.map((category) => (
                                                            <option key={category} value={category}>
                                                                {category}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pricing */}
                                        <div>
                                            <div className="mb-4">
                                                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                                                    Pricing & Duration
                                                </p>

                                                <div className="mt-2 h-px bg-ink-100 dark:bg-ink-800" />
                                            </div>

                                            <div className="grid gap-4 sm:grid-cols-2">
                                                {/* Price */}
                                                <div>
                                                    <label className="mb-2 block text-sm font-semibold text-ink-800 dark:text-ink-200">
                                                        Price
                                                    </label>

                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-400">
                                                            ₦
                                                        </span>

                                                        <input
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
                                                            className="w-full rounded-xl border border-ink-200 bg-white py-3 pl-9 pr-4 text-sm text-ink-900 outline-none transition focus:border-ink-900 focus:ring-4 focus:ring-ink-900/5 dark:border-ink-700 dark:bg-ink-800 dark:text-white dark:focus:border-white"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Duration */}
                                                <div>
                                                    <label className="mb-2 block text-sm font-semibold text-ink-800 dark:text-ink-200">
                                                        Duration
                                                    </label>

                                                    <div className="relative">
                                                        <Clock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />

                                                        <input
                                                            type="text"
                                                            value={editForm.duration}
                                                            onChange={(e) =>
                                                                setEditForm({
                                                                    ...editForm,
                                                                    duration: e.target.value,
                                                                })
                                                            }
                                                            placeholder="e.g. 2 hours"
                                                            className="w-full rounded-xl border border-ink-200 bg-white py-3 pl-11 pr-4 text-sm text-ink-900 outline-none transition focus:border-ink-900 focus:ring-4 focus:ring-ink-900/5 dark:border-ink-700 dark:bg-ink-800 dark:text-white dark:focus:border-white"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <div className="mb-4">
                                                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                                                    Service Description
                                                </p>

                                                <div className="mt-2 h-px bg-ink-100 dark:bg-ink-800" />
                                            </div>

                                            <textarea
                                                rows={6}
                                                value={editForm.description}
                                                onChange={(e) =>
                                                    setEditForm({
                                                        ...editForm,
                                                        description: e.target.value,
                                                    })
                                                }
                                                placeholder="Describe what customers will receive..."
                                                className="w-full resize-none rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm leading-6 text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-ink-900 focus:ring-4 focus:ring-ink-900/5 dark:border-ink-700 dark:bg-ink-800 dark:text-white dark:focus:border-white"
                                            />

                                            <div className="mt-2 flex justify-end">
                                                <span className="text-[11px] text-ink-400">
                                                    {editForm.description.length}/2000
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>

                            {/* ================= FOOTER ================= */}
                            <div className="flex flex-col-reverse gap-3 border-t border-ink-100 bg-ink-50/70 px-6 py-4 dark:border-ink-800 dark:bg-ink-900 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                                <div className="flex items-center gap-2 text-xs text-ink-400">
                                    <ShieldCheck className="h-4 w-4" />
                                    Your changes will be saved securely.
                                </div>

                                <div className="flex gap-3">
                                    <motion.button
                                        type="button"
                                        onClick={() => setEditingService(null)}
                                        disabled={editLoading}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="rounded-xl border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50 disabled:opacity-50 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:bg-ink-700"
                                    >
                                        Cancel
                                    </motion.button>

                                    <motion.button
                                        type="button"
                                        onClick={handleUpdateService}
                                        disabled={editLoading}
                                        whileHover={!editLoading ? { scale: 1.02 } : undefined}
                                        whileTap={!editLoading ? { scale: 0.97 } : undefined}
                                        className="flex min-w-[145px] items-center justify-center gap-2 rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ink-900/10 transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-ink-900 dark:hover:bg-ink-100"
                                    >
                                        {editLoading ? (
                                            <>
                                                <motion.div
                                                    className="h-4 w-4 rounded-full border-2 border-current/20 border-t-current"
                                                    animate={{ rotate: 360 }}
                                                    transition={{
                                                        duration: 0.7,
                                                        repeat: Infinity,
                                                        ease: "linear",
                                                    }}
                                                />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>




            {/* =====================================================
          DELETE MODAL
      ===================================================== */}


            <AnimatePresence>
                {deletingService && (
                    <motion.div
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => {
                            if (!deleteLoading) {
                                setDeletingService(null);
                            }
                        }}
                    >
                        <motion.div
                            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-ink-900"
                            initial={{
                                opacity: 0,
                                scale: 0.85,
                                y: 25,
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                            }}
                            exit={{
                                opacity: 0,
                                scale: 0.9,
                                y: 15,
                            }}
                            transition={{
                                duration: 0.25,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-start gap-4 p-6">
                                <motion.div
                                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                                    initial={{ scale: 0, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{
                                        delay: 0.08,
                                        duration: 0.25,
                                        type: "spring",
                                        stiffness: 250,
                                    }}
                                >
                                    <Trash2 className="h-6 w-6" />
                                </motion.div>

                                <div>
                                    <h3 className="text-lg font-semibold text-ink-900 dark:text-white">
                                        Delete Service?
                                    </h3>

                                    <p className="mt-1 text-sm leading-6 text-ink-500 dark:text-ink-400">
                                        Are you sure you want to delete{" "}
                                        <span className="font-medium text-ink-700 dark:text-ink-200">
                                            "{deletingService.title}"
                                        </span>
                                        ? This action cannot be undone.
                                    </p>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center justify-end gap-3 border-t border-ink-100 bg-ink-50/50 px-6 py-4 dark:border-ink-800 dark:bg-ink-900/50">
                                <motion.button
                                    type="button"
                                    onClick={() => setDeletingService(null)}
                                    disabled={deleteLoading}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="rounded-xl border border-ink-200 bg-white px-5 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:bg-ink-700"
                                >
                                    Cancel
                                </motion.button>

                                <motion.button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleteLoading}
                                    whileHover={!deleteLoading ? { scale: 1.02 } : undefined}
                                    whileTap={!deleteLoading ? { scale: 0.97 } : undefined}
                                    className="flex min-w-[120px] items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {deleteLoading ? (
                                        <>
                                            <motion.div
                                                className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                                                animate={{ rotate: 360 }}
                                                transition={{
                                                    duration: 0.7,
                                                    repeat: Infinity,
                                                    ease: "linear",
                                                }}
                                            />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>



        </DashboardLayout>
    );
}
