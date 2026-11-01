import {
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import {
    AlertCircle,
    ArrowLeft,
    Camera,
    CheckCircle2,
    ChevronDown,
    Image as ImageIcon,
    Lock,
    Mail,
    MapPin,
    Save,
    Sparkles,
    UploadCloud,
    User,
    X,
} from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { VerifiedBadge } from "@/components/shared";
import { Badge, Button, cn } from "@/components/ui";
import { useAuth, type UpdateProfileData } from "@/context/AppContext";
import { providers } from "@/data/mockData";
import { providerNavItems } from "@/data/providerNavItems";

type NotificationType = "success" | "error";

interface Notification {
    type: NotificationType;
    message: string;
}

const DEFAULT_AVATAR = "/images/default-avatar.png";
const ABOUT_MIN_LENGTH = 10;
const ABOUT_MAX_LENGTH = 500;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

export function ProviderProfile() {
    const { user, updateProfile } = useAuth();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const notificationTimerRef =
        useRef<ReturnType<typeof setTimeout> | null>(null);

    const previewUrlRef = useRef<string | null>(null);

    const currentProvider = providers.find(
        (provider) => provider.id === user?.id
    );

    const [profileImage, setProfileImage] = useState(
        user?.avatar || DEFAULT_AVATAR
    );

    const [selectedImage, setSelectedImage] =
        useState<File | null>(null);

    const [displayName, setDisplayName] = useState(
        user?.name || ""
    );

    const [about, setAbout] = useState(
        user?.about || ""
    );

    const [location, setLocation] = useState(
        user?.location || ""
    );

    const [notification, setNotification] =
        useState<Notification | null>(null);

    /*
    |--------------------------------------------------------------------------
    | Save mutation
    |--------------------------------------------------------------------------
    |
    | `updateProfile` stays the single source of truth (it updates the auth
    | context + session storage). Wrapping it here only gives us a consistent
    | `isPending` state for the save button.
    |
    */

    const saveMutation = useMutation({
        mutationFn: (profileData: UpdateProfileData) =>
            updateProfile(profileData),
    });

    const isSaving = saveMutation.isPending;

    /*
    |--------------------------------------------------------------------------
    | Notification
    |--------------------------------------------------------------------------
    */

    const showNotification = (
        type: NotificationType,
        message: string
    ) => {
        if (notificationTimerRef.current) {
            clearTimeout(notificationTimerRef.current);
        }

        setNotification({
            type,
            message,
        });

        notificationTimerRef.current =
            setTimeout(() => {
                setNotification(null);
            }, 15000);
    };

    const closeNotification = () => {
        if (notificationTimerRef.current) {
            clearTimeout(notificationTimerRef.current);
        }

        setNotification(null);
    };

    useEffect(() => {
        return () => {
            if (notificationTimerRef.current) {
                clearTimeout(
                    notificationTimerRef.current
                );
            }

            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
                previewUrlRef.current = null;
            }
        };
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Sync user data
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | selectedImage is intentionally NOT included in the dependency array.
    |
    | Otherwise selecting an image would trigger this effect and could reset
    | the About and Location fields back to their previous backend values.
    |
    */

    useEffect(() => {
        if (!user) {
            setProfileImage(DEFAULT_AVATAR);
            setDisplayName("");
            setAbout("");
            setLocation("");
            setSelectedImage(null);

            return;
        }

        setDisplayName(user.name || "");
        setAbout(user.about || "");
        setLocation(user.location || "");

        if (!selectedImage) {
            setProfileImage(
                user.avatar ||
                DEFAULT_AVATAR
            );
        }
    }, [
        user?.id,
        user?.name,
        user?.about,
        user?.location,
        user?.avatar,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Validation
    |--------------------------------------------------------------------------
    */

    const validateProfileDetails = () => {
        if (!displayName.trim()) {
            showNotification(
                "error",
                "Please enter your display name before adding a profile picture."
            );

            return false;
        }

        if (!about.trim()) {
            showNotification(
                "error",
                "Please complete your About section before adding a profile picture."
            );

            return false;
        }

        if (about.trim().length < ABOUT_MIN_LENGTH) {
            showNotification(
                "error",
                "Please provide a little more information in your About section."
            );

            return false;
        }

        if (about.length > ABOUT_MAX_LENGTH) {
            showNotification(
                "error",
                "About section cannot exceed 500 characters."
            );

            return false;
        }

        if (!location.trim()) {
            showNotification(
                "error",
                "Please select your location before adding a profile picture."
            );

            return false;
        }

        return true;
    };

    /*
    |--------------------------------------------------------------------------
    | Image Picker
    |--------------------------------------------------------------------------
    */

    const openImagePicker = () => {
        if (!validateProfileDetails()) {
            return;
        }

        fileInputRef.current?.click();
    };

    /*
    |--------------------------------------------------------------------------
    | Image Selection
    |--------------------------------------------------------------------------
    */

    const handleImageChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            showNotification(
                "error",
                "Please choose a JPG, PNG, or WebP image."
            );

            event.target.value = "";

            return;
        }

        if (file.size > MAX_IMAGE_BYTES) {
            showNotification(
                "error",
                "Please choose an image smaller than 5MB."
            );

            event.target.value = "";

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Remove previous preview URL
        |--------------------------------------------------------------------------
        */

        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
        } else if (profileImage.startsWith("blob:")) {
            URL.revokeObjectURL(profileImage);
        }

        const imageUrl = URL.createObjectURL(file);

        previewUrlRef.current = imageUrl;

        setSelectedImage(file);
        setProfileImage(imageUrl);

        showNotification(
            "success",
            "Profile picture selected. Save your changes to upload it."
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Save Profile
    |--------------------------------------------------------------------------
    */

    const handleSave = async (
        event?: FormEvent<HTMLFormElement>
    ) => {
        event?.preventDefault();

        if (!displayName.trim()) {
            showNotification(
                "error",
                "Please enter your display name."
            );

            return;
        }

        if (!about.trim()) {
            showNotification(
                "error",
                "Please complete your About section."
            );

            return;
        }

        if (about.trim().length < ABOUT_MIN_LENGTH) {
            showNotification(
                "error",
                "Please provide a little more information in your About section."
            );

            return;
        }

        if (about.length > ABOUT_MAX_LENGTH) {
            showNotification(
                "error",
                "About section cannot exceed 500 characters."
            );

            return;
        }

        if (!location.trim()) {
            showNotification(
                "error",
                "Please select your location."
            );

            return;
        }

        const hasExistingAvatar = Boolean(user?.avatar);

        if (!selectedImage && !hasExistingAvatar) {
            showNotification(
                "error",
                "Please add a profile picture before saving your profile."
            );

            return;
        }

        try {
            const data = await saveMutation.mutateAsync({
                name: displayName.trim(),
                about: about.trim(),
                location: location.trim(),
                avatar: selectedImage,
            });

            if (data?.user) {
                if (data.user.avatar) {
                    setProfileImage(
                        data.user.avatar
                    );

                    if (previewUrlRef.current) {
                        URL.revokeObjectURL(
                            previewUrlRef.current
                        );

                        previewUrlRef.current = null;
                    }
                }

                setDisplayName(
                    data.user.name ||
                    displayName
                );

                setAbout(
                    data.user.about ??
                    about
                );

                setLocation(
                    data.user.location ??
                    location
                );
            }

            setSelectedImage(null);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            showNotification(
                "success",
                "Profile updated successfully!"
            );
        } catch (error: any) {
            console.error(
                "Profile update error:",
                error
            );

            showNotification(
                "error",
                error?.message ||
                "Unable to save your profile. Please try again."
            );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Derived UI state
    |--------------------------------------------------------------------------
    */

    const hasProfilePhoto =
        Boolean(selectedImage || user?.avatar) ||
        (Boolean(profileImage) &&
            !profileImage.includes("default-avatar"));

    const aboutIsValid =
        about.trim().length >= ABOUT_MIN_LENGTH &&
        about.length <= ABOUT_MAX_LENGTH;

    const checklist = [
        {
            label: "Display name",
            done: Boolean(displayName.trim()),
        },
        {
            label: "About section",
            done: aboutIsValid,
        },
        {
            label: "Location",
            done: Boolean(location.trim()),
        },
        {
            label: "Profile photo",
            done: hasProfilePhoto,
        },
    ];

    const completedSteps = checklist.filter(
        (item) => item.done
    ).length;

    const completionPercent = Math.round(
        (completedSteps / checklist.length) * 100
    );

    const hasChanges =
        Boolean(selectedImage) ||
        displayName.trim() !== (user?.name || "").trim() ||
        about !== (user?.about || "") ||
        location !== (user?.location || "");

    const aboutCountTone =
        about.length >= ABOUT_MAX_LENGTH
            ? "text-danger-600 dark:text-danger-200"
            : about.length > ABOUT_MAX_LENGTH * 0.9
                ? "text-warning-600 dark:text-warning-100"
                : "text-slate-400 dark:text-ink-500";

    return (
        <DashboardLayout
            role="provider"
            navItems={providerNavItems}
        >
            <div className="mx-auto max-w-5xl">
                {/* 
                |--------------------------------------------------------------------------
                | SUCCESS / ERROR BANNER
                |--------------------------------------------------------------------------
                */}

                <AnimatePresence>
                    {notification && (
                        <motion.div
                            initial={{
                                opacity: 0,
                                y: -12,
                                scale: 0.98,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                scale: 1,
                            }}
                            exit={{
                                opacity: 0,
                                y: -12,
                                scale: 0.98,
                            }}
                            transition={{
                                duration: 0.22,
                            }}
                            role={
                                notification.type ===
                                    "success"
                                    ? "status"
                                    : "alert"
                            }
                            aria-live={
                                notification.type ===
                                    "success"
                                    ? "polite"
                                    : "assertive"
                            }
                            className={cn(
                                "relative mb-6 overflow-hidden rounded-2xl border bg-white p-4 pr-12 shadow-sm dark:bg-ink-900",
                                notification.type ===
                                    "success"
                                    ? "border-success-200 dark:border-success-600/30"
                                    : "border-danger-200 dark:border-danger-500/30"
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <span
                                    className={cn(
                                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                                        notification.type ===
                                            "success"
                                            ? "bg-success-50 text-success-600 dark:bg-success-600/15 dark:text-success-200"
                                            : "bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-200"
                                    )}
                                    aria-hidden="true"
                                >
                                    {notification.type ===
                                        "success" ? (
                                        <CheckCircle2 className="h-5 w-5" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5" />
                                    )}
                                </span>

                                <div className="min-w-0">
                                    <p
                                        className={cn(
                                            "text-sm font-semibold",
                                            notification.type ===
                                                "success"
                                                ? "text-success-700 dark:text-success-200"
                                                : "text-danger-700 dark:text-danger-200"
                                        )}
                                    >
                                        {notification.type ===
                                            "success"
                                            ? "Success"
                                            : "Something went wrong"}
                                    </p>

                                    <p className="mt-0.5 text-sm leading-5 text-slate-600 dark:text-ink-300">
                                        {notification.message}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeNotification}
                                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-ink-800 dark:hover:text-ink-50"
                                aria-label="Dismiss notification"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <motion.div
                                initial={{ width: "100%" }}
                                animate={{ width: "0%" }}
                                transition={{
                                    duration: 15,
                                    ease: "linear",
                                }}
                                aria-hidden="true"
                                className={cn(
                                    "absolute bottom-0 left-0 h-[3px]",
                                    notification.type ===
                                        "success"
                                        ? "bg-success-500"
                                        : "bg-danger-500"
                                )}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 
                |--------------------------------------------------------------------------
                | HEADER
                |--------------------------------------------------------------------------
                */}

                <motion.div
                    initial={{
                        opacity: 0,
                        y: 10,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    transition={{
                        duration: 0.4,
                    }}
                    className="mb-6 sm:mb-8"
                >
                    <Link
                        to="/provider"
                        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-brand-700 dark:text-ink-400 dark:hover:text-brand-300"
                    >
                        <ArrowLeft className="h-4 w-4" />

                        Back to dashboard
                    </Link>

                    <h1 className="text-balance font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-ink-50 sm:text-3xl">
                        My Profile
                    </h1>

                    <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-ink-400">
                        Manage your public provider profile
                        and how customers see you.
                    </p>
                </motion.div>

                {/* 
                |--------------------------------------------------------------------------
                | TWO COLUMN LAYOUT
                |--------------------------------------------------------------------------
                */}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-start xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
                    {/* 
                    |--------------------------------------------------------------------------
                    | IDENTITY / AVATAR CARD
                    |--------------------------------------------------------------------------
                    */}

                    <aside className="space-y-5">
                        <motion.div
                            initial={{
                                opacity: 0,
                                y: 15,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                            }}
                            transition={{
                                duration: 0.45,
                            }}
                            className="card overflow-hidden"
                        >
                            <div
                                className="relative h-24 bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700"
                                aria-hidden="true"
                            >
                                <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full bg-white/10" />

                                <div className="absolute -bottom-14 left-8 h-32 w-32 rounded-full bg-white/10" />

                                <div className="absolute right-16 top-4 h-10 w-10 rounded-full bg-white/10" />
                            </div>

                            <div className="relative px-5 pb-5">
                                <div className="-mt-14 flex flex-col items-center text-center">
                                    <div className="relative">
                                        <div className="rounded-full bg-white p-[5px] shadow-lg dark:bg-ink-900">
                                            <div className="group relative h-28 w-28 overflow-hidden rounded-full bg-lavender ring-1 ring-slate-200/70 dark:bg-ink-800 dark:ring-ink-700">
                                                {profileImage ? (
                                                    <img
                                                        src={profileImage}
                                                        alt={
                                                            displayName ||
                                                            "Provider profile"
                                                        }
                                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                                        onError={(event) => {
                                                            event.currentTarget.style.display =
                                                                "none";
                                                            setProfileImage("");
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 to-lavender text-brand-500 dark:from-brand-950 dark:to-ink-800 dark:text-brand-300">
                                                        <User className="h-10 w-10" />
                                                    </div>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={
                                                        openImagePicker
                                                    }
                                                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/0 text-white opacity-0 transition-all duration-300 focus-visible:bg-black/45 focus-visible:opacity-100 group-hover:bg-black/45 group-hover:opacity-100"
                                                >
                                                    <Camera className="mb-1 h-6 w-6" />

                                                    <span className="text-xs font-semibold">
                                                        Change photo
                                                    </span>
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={
                                                openImagePicker
                                            }
                                            className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-brand-600 text-white shadow-lg transition-all hover:scale-105 hover:bg-brand-700 dark:border-ink-900"
                                            aria-label="Change profile picture"
                                        >
                                            <Camera className="h-4 w-4" />
                                        </button>

                                        <span
                                            className="absolute bottom-2 left-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-success-500 dark:border-ink-900"
                                            title="Available"
                                            aria-hidden="true"
                                        />
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                                        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-ink-50">
                                            {displayName ||
                                                "Your Name"}
                                        </h2>

                                        {currentProvider?.verified && (
                                            <VerifiedBadge />
                                        )}
                                    </div>

                                    <p className="mt-1 text-sm text-slate-500 dark:text-ink-400">
                                        {currentProvider?.categories?.join(
                                            " • "
                                        ) ||
                                            "Service Provider"}
                                    </p>

                                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                                        <Badge
                                            tone="success"
                                            icon={CheckCircle2}
                                        >
                                            Available
                                        </Badge>

                                        <Badge
                                            tone="neutral"
                                            icon={MapPin}
                                            className="max-w-full"
                                        >
                                            <span className="truncate">
                                                {location ||
                                                    "Location not set"}
                                            </span>
                                        </Badge>
                                    </div>

                                    <p className="mt-4 text-xs leading-5 text-slate-400 dark:text-ink-500">
                                        Complete your profile
                                        details before adding a
                                        profile picture.
                                    </p>
                                </div>

                                {/* 
                                |--------------------------------------------------------------------------
                                | AVATAR UPLOADER
                                |--------------------------------------------------------------------------
                                */}

                                <div className="mt-5 space-y-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        icon={UploadCloud}
                                        onClick={openImagePicker}
                                        className="w-full"
                                        aria-describedby="avatar-help"
                                    >
                                        {selectedImage
                                            ? "Choose a different photo"
                                            : "Upload new photo"}
                                    </Button>

                                    <p
                                        id="avatar-help"
                                        className="text-center text-xs text-slate-400 dark:text-ink-500"
                                    >
                                        JPG, PNG or WebP • up to 5MB
                                    </p>

                                    {selectedImage && (
                                        <p className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                                            <ImageIcon
                                                className="h-4 w-4 shrink-0"
                                                aria-hidden="true"
                                            />

                                            <span
                                                className="min-w-0 flex-1 truncate"
                                                title={
                                                    selectedImage.name
                                                }
                                            >
                                                {
                                                    selectedImage.name
                                                }
                                            </span>

                                            <span className="shrink-0 font-semibold">
                                                Selected
                                            </span>
                                        </p>
                                    )}
                                </div>

                                {/* Hidden File Input */}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                    onChange={
                                        handleImageChange
                                    }
                                    aria-label="Upload profile picture"
                                />
                            </div>
                        </motion.div>

                        {/* 
                        |--------------------------------------------------------------------------
                        | PROFILE STRENGTH
                        |--------------------------------------------------------------------------
                        */}

                        <motion.div
                            initial={{
                                opacity: 0,
                                y: 15,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                            }}
                            transition={{
                                duration: 0.45,
                                delay: 0.05,
                            }}
                            className="card p-5"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-ink-50">
                                        Profile strength
                                    </p>

                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-ink-400">
                                        {completedSteps} of{" "}
                                        {checklist.length}{" "}
                                        complete
                                    </p>
                                </div>

                                <span className="text-sm font-bold text-brand-600 dark:text-brand-300">
                                    {completionPercent}%
                                </span>
                            </div>

                            <div
                                className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-ink-800"
                                role="progressbar"
                                aria-label="Profile completion"
                                aria-valuenow={
                                    completionPercent
                                }
                                aria-valuemin={0}
                                aria-valuemax={100}
                            >
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: `${completionPercent}%`,
                                    }}
                                    transition={{
                                        duration: 0.5,
                                        ease: "easeOut",
                                    }}
                                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600"
                                />
                            </div>

                            <ul className="mt-4 space-y-2">
                                {checklist.map((item) => (
                                    <li
                                        key={item.label}
                                        className="flex items-center gap-2 text-xs"
                                    >
                                        {item.done ? (
                                            <CheckCircle2
                                                className="h-4 w-4 shrink-0 text-success-600 dark:text-success-500"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <span
                                                className="h-4 w-4 shrink-0 rounded-full border border-slate-300 dark:border-ink-600"
                                                aria-hidden="true"
                                            />
                                        )}

                                        <span
                                            className={
                                                item.done
                                                    ? "text-slate-600 dark:text-ink-300"
                                                    : "text-slate-400 dark:text-ink-500"
                                            }
                                        >
                                            {item.label}
                                        </span>

                                        <span className="sr-only">
                                            {item.done
                                                ? "complete"
                                                : "incomplete"}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </aside>

                    {/* 
                    |--------------------------------------------------------------------------
                    | FORM
                    |--------------------------------------------------------------------------
                    */}

                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 15,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        transition={{
                            duration: 0.45,
                            delay: 0.1,
                        }}
                    >
                        <form
                            onSubmit={handleSave}
                            noValidate
                            aria-busy={isSaving}
                            className="card overflow-hidden"
                        >
                            <div className="border-b border-slate-100 px-5 py-5 dark:border-ink-800 sm:px-7 sm:py-6">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-ink-50">
                                    Profile Information
                                </h2>

                                <p className="mt-1 text-sm text-slate-500 dark:text-ink-400">
                                    Keep your information accurate
                                    so customers know who they
                                    are booking.
                                </p>
                            </div>

                            <div className="space-y-8 p-5 sm:p-7">
                                {/* 
                                |--------------------------------------------------------------------------
                                | IDENTITY
                                |--------------------------------------------------------------------------
                                */}

                                <section
                                    aria-labelledby="identity-heading"
                                    className="space-y-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <span
                                            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300"
                                            aria-hidden="true"
                                        >
                                            <User className="h-4 w-4" />
                                        </span>

                                        <div>
                                            <h3
                                                id="identity-heading"
                                                className="text-sm font-semibold text-slate-900 dark:text-ink-50"
                                            >
                                                Identity
                                            </h3>

                                            <p className="mt-0.5 text-xs text-slate-500 dark:text-ink-400">
                                                Display name and
                                                email are managed
                                                by your ABUAD
                                                account.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                        {/* Display Name */}

                                        <div>
                                            <div className="mb-1.5 flex items-center justify-between gap-2">
                                                <label
                                                    htmlFor="displayName"
                                                    className="text-sm font-medium text-slate-700 dark:text-ink-300"
                                                >
                                                    Display Name
                                                </label>

                                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-ink-500">
                                                    <Lock className="h-3 w-3" />

                                                    Read only
                                                </span>
                                            </div>

                                            <div className="relative">
                                                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                                <input
                                                    id="displayName"
                                                    name="displayName"
                                                    className="input cursor-not-allowed bg-slate-50 pl-10 text-slate-500 dark:bg-ink-800/60 dark:text-ink-400"
                                                    value={
                                                        displayName
                                                    }
                                                    disabled
                                                    autoComplete="name"
                                                />
                                            </div>
                                        </div>

                                        {/* Email */}

                                        <div>
                                            <label
                                                htmlFor="email"
                                                className="label"
                                            >
                                                Email
                                            </label>

                                            <div className="relative">
                                                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                                <input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    className="input cursor-not-allowed bg-slate-50 pl-10 text-slate-500 dark:bg-ink-800/60 dark:text-ink-400"
                                                    value={
                                                        user?.email ||
                                                        ""
                                                    }
                                                    disabled
                                                    autoComplete="email"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <div className="h-px bg-slate-100 dark:bg-ink-800" />

                                {/* 
                                |--------------------------------------------------------------------------
                                | ABOUT
                                |--------------------------------------------------------------------------
                                */}

                                <section
                                    aria-labelledby="about-heading"
                                    className="space-y-3"
                                >
                                    <div className="flex items-start gap-3">
                                        <span
                                            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300"
                                            aria-hidden="true"
                                        >
                                            <Sparkles className="h-4 w-4" />
                                        </span>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <label
                                                    htmlFor="about"
                                                    id="about-heading"
                                                    className="text-sm font-semibold text-slate-900 dark:text-ink-50"
                                                >
                                                    About you
                                                    <span
                                                        className="ml-1 text-danger-500"
                                                        aria-hidden="true"
                                                    >
                                                        *
                                                    </span>
                                                </label>

                                                <span
                                                    id="about-count"
                                                    className={cn(
                                                        "text-xs font-medium tabular-nums",
                                                        aboutCountTone
                                                    )}
                                                >
                                                    {about.length}/
                                                    {
                                                        ABOUT_MAX_LENGTH
                                                    }
                                                </span>
                                            </div>

                                            <p
                                                id="about-help"
                                                className="mt-1 text-xs leading-5 text-slate-500 dark:text-ink-400"
                                            >
                                                Tell customers
                                                about your
                                                experience, skills
                                                and the services
                                                you provide.
                                            </p>
                                        </div>
                                    </div>

                                    <textarea
                                        id="about"
                                        name="about"
                                        className="form-textarea min-h-[150px] resize-y"
                                        value={about}
                                        onChange={(event) => {
                                            const value =
                                                event.target
                                                    .value;

                                            if (
                                                value.length <=
                                                ABOUT_MAX_LENGTH
                                            ) {
                                                setAbout(
                                                    value
                                                );
                                            }
                                        }}
                                        placeholder="Tell customers about yourself, your experience and the services you provide..."
                                        maxLength={
                                            ABOUT_MAX_LENGTH
                                        }
                                        required
                                        aria-required="true"
                                        aria-describedby="about-help about-count about-minimum"
                                    />

                                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                        <p
                                            id="about-minimum"
                                            className={cn(
                                                about.length > 0 &&
                                                    !aboutIsValid
                                                    ? "text-warning-600 dark:text-warning-100"
                                                    : "text-slate-400 dark:text-ink-500"
                                            )}
                                        >
                                            Minimum{" "}
                                            {
                                                ABOUT_MIN_LENGTH
                                            }{" "}
                                            characters.
                                        </p>

                                        <p className="text-slate-400 dark:text-ink-500">
                                            This appears on
                                            your public
                                            profile.
                                        </p>
                                    </div>
                                </section>

                                <div className="h-px bg-slate-100 dark:bg-ink-800" />

                                {/* 
                                |--------------------------------------------------------------------------
                                | LOCATION
                                |--------------------------------------------------------------------------
                                */}

                                <section
                                    aria-labelledby="location-heading"
                                    className="space-y-3"
                                >
                                    <div className="flex items-start gap-3">
                                        <span
                                            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300"
                                            aria-hidden="true"
                                        >
                                            <MapPin className="h-4 w-4" />
                                        </span>

                                        <div>
                                            <label
                                                htmlFor="location"
                                                id="location-heading"
                                                className="text-sm font-semibold text-slate-900 dark:text-ink-50"
                                            >
                                                Location
                                                <span
                                                    className="ml-1 text-danger-500"
                                                    aria-hidden="true"
                                                >
                                                    *
                                                </span>
                                            </label>

                                            <p
                                                id="location-help"
                                                className="mt-1 text-xs leading-5 text-slate-500 dark:text-ink-400"
                                            >
                                                Choose where
                                                customers can
                                                find you.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="relative max-w-md">
                                        <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                        <select
                                            id="location"
                                            name="location"
                                            className="input cursor-pointer appearance-none pl-10 pr-10"
                                            value={location}
                                            onChange={(event) => {
                                                setLocation(
                                                    event.target
                                                        .value
                                                );
                                            }}
                                            required
                                            aria-required="true"
                                            aria-describedby="location-help"
                                        >
                                            <option value="">
                                                Select your
                                                location
                                            </option>

                                            <option value="ABUAD">
                                                ABUAD
                                            </option>

                                            <option value="Ado-Ekiti">
                                                Ado-Ekiti
                                            </option>

                                            <option value="Off Campus">
                                                Off Campus
                                            </option>
                                        </select>

                                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    </div>
                                </section>

                                {/* 
                                |--------------------------------------------------------------------------
                                | PHOTO TIP
                                |--------------------------------------------------------------------------
                                */}

                                <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 dark:border-brand-900/50 dark:bg-brand-950/20">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm dark:bg-ink-800 dark:text-brand-300">
                                        <ImageIcon className="h-4 w-4" />
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-ink-200">
                                            Profile photo tip
                                        </p>

                                        <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-ink-400">
                                            Complete your About
                                            and Location first.
                                            Then add a clear,
                                            professional image
                                            where your face is
                                            visible. JPG, PNG and
                                            WebP images up to
                                            5MB are supported.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 
                            |--------------------------------------------------------------------------
                            | SAVE
                            |--------------------------------------------------------------------------
                            */}

                            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 dark:border-ink-800 dark:bg-ink-900/40 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                                <p
                                    className="text-xs text-slate-500 dark:text-ink-400"
                                    aria-live="polite"
                                >
                                    {hasChanges
                                        ? selectedImage
                                            ? "Your new photo will be uploaded when you save."
                                            : "You have unsaved changes."
                                        : "All changes saved."}
                                </p>

                                <Button
                                    type="submit"
                                    icon={Save}
                                    loading={isSaving}
                                    disabled={isSaving}
                                    className="w-full shadow-soft sm:w-auto"
                                >
                                    {isSaving
                                        ? "Saving changes..."
                                        : "Save Changes"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </DashboardLayout>
    );
}
